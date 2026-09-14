import { Router } from "express";
import { withTransaction } from "../db/pool.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { distanceFormula, expirePendingRequests } from "../services/orders.js";
import { getSellerProfileId, getUserById } from "../services/users.js";
import { asyncHandler, ApiError, ok } from "../utils/http.js";
import { optionalNumber, optionalString, requireNumber, requireString } from "../utils/validation.js";

const router = Router();

router.use(requireAuth, requireRole("seller"));

router.get(
  "/profile",
  asyncHandler(async (request, response) => {
    const data = await withTransaction(async (client) => {
      const user = await getUserById(client, request.auth!.userId);
      const result = await client.query<{
        id: string;
        shop_name: string | null;
        service_lat: string | null;
        service_lng: string | null;
        service_radius_km: string;
        rating: string;
        is_active: boolean;
      }>(
        `
          SELECT id, shop_name, service_lat, service_lng, service_radius_km, rating, is_active
          FROM seller_profiles
          WHERE user_id = $1
        `,
        [request.auth!.userId],
      );

      const profile = result.rows[0];
      return {
        id: user.id,
        phone: user.phone,
        role: user.role,
        name: user.name,
        sellerProfile: {
          id: profile.id,
          shopName: profile.shop_name,
          serviceLat: profile.service_lat ? Number(profile.service_lat) : null,
          serviceLng: profile.service_lng ? Number(profile.service_lng) : null,
          serviceRadiusKm: Number(profile.service_radius_km),
          rating: Number(profile.rating),
          isActive: profile.is_active,
        },
      };
    });

    ok(response, data);
  }),
);

router.put(
  "/profile",
  asyncHandler(async (request, response) => {
    const name = requireString(request.body.name, "name");
    const shopName = optionalString(request.body.shopName);
    const serviceLat = optionalNumber(request.body.serviceLat);
    const serviceLng = optionalNumber(request.body.serviceLng);
    const serviceRadiusKm = optionalNumber(request.body.serviceRadiusKm);
    const isActive = typeof request.body.isActive === "boolean" ? request.body.isActive : true;

    const data = await withTransaction(async (client) => {
      await client.query(
        `
          UPDATE users
          SET name = $2
          WHERE id = $1
        `,
        [request.auth!.userId, name],
      );

      const result = await client.query<{
        id: string;
        shop_name: string | null;
        service_lat: string | null;
        service_lng: string | null;
        service_radius_km: string;
        rating: string;
        is_active: boolean;
      }>(
        `
          UPDATE seller_profiles
          SET shop_name = COALESCE($2, shop_name),
              service_lat = COALESCE($3, service_lat),
              service_lng = COALESCE($4, service_lng),
              service_radius_km = COALESCE($5, service_radius_km),
              is_active = $6
          WHERE user_id = $1
          RETURNING id, shop_name, service_lat, service_lng, service_radius_km, rating, is_active
        `,
        [request.auth!.userId, shopName, serviceLat, serviceLng, serviceRadiusKm, isActive],
      );

      const row = result.rows[0];
      return {
        shopName: row.shop_name,
        serviceLat: row.service_lat ? Number(row.service_lat) : null,
        serviceLng: row.service_lng ? Number(row.service_lng) : null,
        serviceRadiusKm: Number(row.service_radius_km),
        rating: Number(row.rating),
        isActive: row.is_active,
      };
    });

    ok(response, data);
  }),
);

router.get(
  "/inventory",
  asyncHandler(async (request, response) => {
    const data = await withTransaction(async (client) => {
      const sellerId = await getSellerProfileId(client, request.auth!.userId);
      const result = await client.query<{
        id: string;
        product_id: string;
        product_name: string;
        category: string | null;
        price: string;
        stock_qty: string;
        unit: string;
        in_stock: boolean;
        image_url: string | null;
        description: string | null;
      }>(
        `
          SELECT ii.id, p.id AS product_id, p.name AS product_name, p.category, ii.price, ii.stock_qty, ii.unit, ii.in_stock, ii.image_url, ii.description
          FROM inventory_items ii
          JOIN products p ON p.id = ii.product_id
          WHERE ii.seller_id = $1
          ORDER BY p.name ASC
        `,
        [sellerId],
      );

      return result.rows.map((row) => ({
        id: row.id,
        productId: row.product_id,
        productName: row.product_name,
        category: row.category,
        price: Number(row.price),
        stockQty: Number(row.stock_qty),
        unit: row.unit,
        inStock: row.in_stock,
        imageUrl: row.image_url,
        description: row.description,
      }));
    });

    ok(response, data);
  }),
);

router.post(
  "/inventory",
  asyncHandler(async (request, response) => {
    const productId = requireString(request.body.productId, "productId");
    const price = requireNumber(request.body.price, "price");
    const stockQty = requireNumber(request.body.stockQty, "stockQty");
    const unit = requireString(request.body.unit, "unit");

    if (price <= 0) {
      throw new ApiError(400, "price must be positive");
    }
    if (stockQty < 0) {
      throw new ApiError(400, "stockQty cannot be negative");
    }
    const imageUrl = optionalString(request.body.imageUrl);
    const description = optionalString(request.body.description);
    const inStock = typeof request.body.inStock === "boolean" ? request.body.inStock : true;

    const data = await withTransaction(async (client) => {
      const sellerId = await getSellerProfileId(client, request.auth!.userId);
      const result = await client.query<{
        id: string;
        product_id: string;
        price: string;
        stock_qty: string;
        unit: string;
        in_stock: boolean;
        image_url: string | null;
        description: string | null;
      }>(
        `
          INSERT INTO inventory_items (seller_id, product_id, price, stock_qty, unit, in_stock, image_url, description)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT (seller_id, product_id) DO UPDATE
          SET price = EXCLUDED.price,
              stock_qty = EXCLUDED.stock_qty,
              unit = EXCLUDED.unit,
              in_stock = EXCLUDED.in_stock,
              image_url = EXCLUDED.image_url,
              description = EXCLUDED.description,
              updated_at = now()
          RETURNING id, product_id, price, stock_qty, unit, in_stock, image_url, description
        `,
        [sellerId, productId, price, stockQty, unit, inStock, imageUrl, description],
      );

      const row = result.rows[0];
      return {
        id: row.id,
        productId: row.product_id,
        price: Number(row.price),
        stockQty: Number(row.stock_qty),
        unit: row.unit,
        inStock: row.in_stock,
        imageUrl: row.image_url,
        description: row.description,
      };
    });

    ok(response, data, 201);
  }),
);

router.put(
  "/inventory/:id",
  asyncHandler(async (request, response) => {
    const inventoryId = requireString(request.params.id, "inventoryId");
    const price = optionalNumber(request.body.price);
    const stockQty = optionalNumber(request.body.stockQty);
    const inStock = typeof request.body.inStock === "boolean" ? request.body.inStock : null;
    const unit = optionalString(request.body.unit);
    const imageUrl = optionalString(request.body.imageUrl);
    const description = optionalString(request.body.description);

    const data = await withTransaction(async (client) => {
      const sellerId = await getSellerProfileId(client, request.auth!.userId);
      const result = await client.query<{
        id: string;
        product_id: string;
        price: string;
        stock_qty: string;
        unit: string;
        in_stock: boolean;
        image_url: string | null;
        description: string | null;
      }>(
        `
          UPDATE inventory_items
          SET price = COALESCE($3, price),
              stock_qty = COALESCE($4, stock_qty),
              unit = COALESCE($5, unit),
              in_stock = COALESCE($6, in_stock),
              image_url = COALESCE($7, image_url),
              description = COALESCE($8, description),
              updated_at = now()
          WHERE id = $1
            AND seller_id = $2
          RETURNING id, product_id, price, stock_qty, unit, in_stock, image_url, description
        `,
        [inventoryId, sellerId, price, stockQty, unit, inStock, imageUrl, description],
      );

      if (!result.rows[0]) {
        throw new ApiError(404, "Inventory item not found");
      }

      const row = result.rows[0];
      return {
        id: row.id,
        productId: row.product_id,
        price: Number(row.price),
        stockQty: Number(row.stock_qty),
        unit: row.unit,
        inStock: row.in_stock,
        imageUrl: row.image_url,
        description: row.description,
      };
    });

    ok(response, data);
  }),
);

router.delete(
  "/inventory/:id",
  asyncHandler(async (request, response) => {
    const inventoryId = requireString(request.params.id, "inventoryId");

    await withTransaction(async (client) => {
      const sellerId = await getSellerProfileId(client, request.auth!.userId);
      await client.query(
        `
          DELETE FROM inventory_items
          WHERE id = $1
            AND seller_id = $2
        `,
        [inventoryId, sellerId],
      );
    });

    ok(response, { deleted: true });
  }),
);

router.get(
  "/requests",
  asyncHandler(async (request, response) => {
    const data = await withTransaction(async (client) => {
      await expirePendingRequests(client);
      const sellerId = await getSellerProfileId(client, request.auth!.userId);
      const result = await client.query<{
        request_item_id: string;
        request_id: string;
        product_id: string;
        product_name: string;
        quantity: string;
        unit: string;
        preferred_price: string | null;
        buyer_lat: string;
        buyer_lng: string;
        expires_at: string;
        distance_km: string;
      }>(
        `
          SELECT
            mri.id AS request_item_id,
            mr.id AS request_id,
            p.id AS product_id,
            p.name AS product_name,
            mri.quantity,
            mri.unit,
            mri.preferred_price,
            mri.buyer_lat,
            mri.buyer_lng,
            mr.expires_at,
            ${distanceFormula("sp.service_lat", "sp.service_lng", "mri.buyer_lat", "mri.buyer_lng")} AS distance_km
          FROM market_request_items mri
          JOIN market_requests mr ON mr.id = mri.request_id
          JOIN products p ON p.id = mri.product_id
          JOIN inventory_items ii ON ii.product_id = mri.product_id
          JOIN seller_profiles sp ON sp.id = ii.seller_id
          LEFT JOIN order_assignments oa ON oa.request_item_id = mri.id
          WHERE sp.id = $1
            AND sp.is_active = true
            AND ii.in_stock = true
            AND ii.stock_qty >= mri.quantity
            AND oa.id IS NULL
            AND mri.status = 'pending'
            AND mr.expires_at > now()
            AND ${distanceFormula("sp.service_lat", "sp.service_lng", "mri.buyer_lat", "mri.buyer_lng")} <= sp.service_radius_km
          ORDER BY mr.created_at DESC
        `,
        [sellerId],
      );

      return result.rows.map((row) => ({
        requestItemId: row.request_item_id,
        requestId: row.request_id,
        productId: row.product_id,
        productName: row.product_name,
        quantity: Number(row.quantity),
        unit: row.unit,
        preferredPrice: row.preferred_price ? Number(row.preferred_price) : null,
        buyerLat: Number(row.buyer_lat),
        buyerLng: Number(row.buyer_lng),
        expiresAt: row.expires_at,
        distanceKm: Number(row.distance_km),
      }));
    });

    ok(response, data);
  }),
);

router.post(
  "/requests/:id/accept",
  asyncHandler(async (request, response) => {
    const requestItemId = requireString(request.params.id, "requestItemId");

    const data = await withTransaction(async (client) => {
      await expirePendingRequests(client);
      const sellerId = await getSellerProfileId(client, request.auth!.userId);

      const requestItemResult = await client.query<{
        id: string;
        request_id: string;
        quantity: string;
        buyer_user_id: string;
      }>(
        `
          SELECT mri.id, mri.request_id, mri.quantity, bp.user_id AS buyer_user_id
          FROM market_request_items mri
          JOIN market_requests mr ON mr.id = mri.request_id
          JOIN buyer_profiles bp ON bp.id = mr.buyer_id
          JOIN inventory_items ii ON ii.product_id = mri.product_id AND ii.seller_id = $2
          JOIN seller_profiles sp ON sp.id = ii.seller_id
          LEFT JOIN order_assignments oa ON oa.request_item_id = mri.id
          WHERE mri.id = $1
            AND mri.status = 'pending'
            AND mr.expires_at > now()
            AND sp.is_active = true
            AND ii.in_stock = true
            AND ii.stock_qty >= mri.quantity
            AND oa.id IS NULL
            AND ${distanceFormula("sp.service_lat", "sp.service_lng", "mri.buyer_lat", "mri.buyer_lng")} <= sp.service_radius_km
        `,
        [requestItemId, sellerId],
      );

      if (!requestItemResult.rows[0]) {
        throw new ApiError(409, "Request item is no longer available");
      }

      const requestItem = requestItemResult.rows[0];

      await client.query(
        `
          INSERT INTO order_assignments (request_item_id, seller_id)
          VALUES ($1, $2)
        `,
        [requestItemId, sellerId],
      );

      await client.query(
        `
          UPDATE market_request_items
          SET status = 'assigned'
          WHERE id = $1
        `,
        [requestItemId],
      );

      await client.query(
        `
          UPDATE market_requests
          SET status = 'assigned'
          WHERE id = $1
        `,
        [requestItem.request_id],
      );

      await client.query(
        `
          UPDATE inventory_items
          SET stock_qty = stock_qty - $2,
              updated_at = now(),
              in_stock = CASE WHEN stock_qty - $2 > 0 THEN in_stock ELSE false END
          WHERE seller_id = $1
            AND product_id = (
              SELECT product_id
              FROM market_request_items
              WHERE id = $3
            )
        `,
        [sellerId, Number(requestItem.quantity), requestItemId],
      );

      await client.query(
        `
          INSERT INTO notifications (user_id, title, body)
          VALUES ($1, 'Order accepted', 'A nearby seller accepted your market request.')
        `,
        [requestItem.buyer_user_id],
      );

      const result = await client.query<{ id: string; status: string; accepted_at: string }>(
        `
          SELECT id, status, accepted_at
          FROM order_assignments
          WHERE request_item_id = $1
        `,
        [requestItemId],
      );

      return result.rows[0];
    });

    ok(response, data, 201);
  }),
);

export { router as sellerRouter };
