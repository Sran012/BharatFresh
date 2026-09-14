import { Router } from "express";
import { withTransaction } from "../db/pool.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { expirePendingRequests } from "../services/orders.js";
import { getBuyerProfileId, getSellerProfileId } from "../services/users.js";
import { asyncHandler, ApiError, ok } from "../utils/http.js";
import { requireString } from "../utils/validation.js";
import { config } from "../config.js";

const router = Router();

router.post(
  "/checkout",
  requireAuth,
  requireRole("buyer"),
  asyncHandler(async (request, response) => {
    const data = await withTransaction(async (client) => {
      await expirePendingRequests(client);
      const buyerProfileId = await getBuyerProfileId(client, request.auth!.userId);
      const cartResult = await client.query<{
        id: string;
        product_id: string;
        quantity: string;
        unit: string;
        preferred_price: string | null;
        buyer_lat: string;
        buyer_lng: string;
      }>(
        `
          SELECT id, product_id, quantity, unit, preferred_price, buyer_lat, buyer_lng
          FROM cart_items
          WHERE user_id = $1
          ORDER BY created_at ASC
        `,
        [request.auth!.userId],
      );

      if (cartResult.rows.length === 0) {
        throw new ApiError(400, "Cart is empty");
      }

      const requestResult = await client.query<{ id: string; expires_at: string }>(
        `
          INSERT INTO market_requests (buyer_id, expires_at)
          VALUES ($1, now() + ($2 || ' minutes')::interval)
          RETURNING id, expires_at
        `,
        [buyerProfileId, String(config.requestExpiryMinutes)],
      );

      const marketRequest = requestResult.rows[0];
      const createdItems: Array<{ requestItemId: string; productId: string }> = [];

      for (const item of cartResult.rows) {
        const inserted = await client.query<{ id: string; product_id: string }>(
          `
            INSERT INTO market_request_items (request_id, product_id, quantity, unit, preferred_price, buyer_lat, buyer_lng)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING id, product_id
          `,
          [
            marketRequest.id,
            item.product_id,
            item.quantity,
            item.unit,
            item.preferred_price,
            item.buyer_lat,
            item.buyer_lng,
          ],
        );

        createdItems.push({
          requestItemId: inserted.rows[0].id,
          productId: inserted.rows[0].product_id,
        });
      }

      await client.query(
        `
          INSERT INTO notifications (user_id, title, body)
          SELECT DISTINCT sp.user_id, 'New market request', 'A nearby buyer request matches your inventory.'
          FROM market_request_items mri
          JOIN inventory_items ii ON ii.product_id = mri.product_id
          JOIN seller_profiles sp ON sp.id = ii.seller_id
          WHERE mri.request_id = $1
            AND sp.is_active = true
            AND ii.in_stock = true
            AND ii.stock_qty >= mri.quantity
            AND 6371 * acos(
              least(
                1,
                cos(radians(mri.buyer_lat)) * cos(radians(sp.service_lat)) *
                cos(radians(sp.service_lng) - radians(mri.buyer_lng)) +
                sin(radians(mri.buyer_lat)) * sin(radians(sp.service_lat))
              )
            ) <= sp.service_radius_km
        `,
        [marketRequest.id],
      );

      await client.query(
        `
          DELETE FROM cart_items
          WHERE user_id = $1
        `,
        [request.auth!.userId],
      );

      return {
        marketRequestId: marketRequest.id,
        expiresAt: marketRequest.expires_at,
        itemCount: createdItems.length,
        items: createdItems,
      };
    });

    ok(response, data, 201);
  }),
);

router.get(
  "/buyer",
  requireAuth,
  requireRole("buyer"),
  asyncHandler(async (request, response) => {
    const data = await withTransaction(async (client) => {
      await expirePendingRequests(client);
      const result = await client.query<{
        assignment_id: string | null;
        assignment_status: string | null;
        accepted_at: string | null;
        request_item_id: string;
        request_item_status: string;
        product_name: string;
        quantity: string;
        unit: string;
        preferred_price: string | null;
        market_request_id: string;
        market_request_status: string;
        expires_at: string;
        seller_shop_name: string | null;
        seller_name: string | null;
        seller_phone: string | null;
        seller_lat: string | null;
        seller_lng: string | null;
        buyer_lat: string;
        buyer_lng: string;
      }>(
        `
          SELECT
            oa.id AS assignment_id,
            oa.status AS assignment_status,
            oa.accepted_at,
            mri.id AS request_item_id,
            mri.status AS request_item_status,
            p.name AS product_name,
            mri.quantity,
            mri.unit,
            mri.preferred_price,
            mr.id AS market_request_id,
            mr.status AS market_request_status,
            mr.expires_at,
            sp.shop_name AS seller_shop_name,
            su.name AS seller_name,
            su.phone AS seller_phone,
            sp.service_lat AS seller_lat,
            sp.service_lng AS seller_lng,
            mri.buyer_lat,
            mri.buyer_lng
          FROM market_requests mr
          JOIN buyer_profiles bp ON bp.id = mr.buyer_id
          JOIN market_request_items mri ON mri.request_id = mr.id
          JOIN products p ON p.id = mri.product_id
          LEFT JOIN order_assignments oa ON oa.request_item_id = mri.id
          LEFT JOIN seller_profiles sp ON sp.id = oa.seller_id
          LEFT JOIN users su ON su.id = sp.user_id
          WHERE bp.user_id = $1
          ORDER BY mr.created_at DESC, mri.created_at DESC
        `,
        [request.auth!.userId],
      );

      return result.rows.map((row) => ({
        assignmentId: row.assignment_id,
        assignmentStatus: row.assignment_status,
        acceptedAt: row.accepted_at,
        requestItemId: row.request_item_id,
        requestItemStatus: row.request_item_status,
        productName: row.product_name,
        quantity: Number(row.quantity),
        unit: row.unit,
        preferredPrice: row.preferred_price ? Number(row.preferred_price) : null,
        marketRequestId: row.market_request_id,
        marketRequestStatus: row.market_request_status,
        expiresAt: row.expires_at,
        seller: row.seller_phone
          ? {
              shopName: row.seller_shop_name,
              sellerName: row.seller_name,
              phone: row.seller_phone,
              lat: row.seller_lat ? Number(row.seller_lat) : null,
              lng: row.seller_lng ? Number(row.seller_lng) : null,
            }
          : null,
        buyerLocation: {
          lat: Number(row.buyer_lat),
          lng: Number(row.buyer_lng),
        },
      }));
    });

    ok(response, data);
  }),
);

router.get(
  "/seller",
  requireAuth,
  requireRole("seller"),
  asyncHandler(async (request, response) => {
    const data = await withTransaction(async (client) => {
      const sellerId = await getSellerProfileId(client, request.auth!.userId);
      const result = await client.query<{
        assignment_id: string;
        status: string;
        accepted_at: string;
        product_name: string;
        quantity: string;
        unit: string;
        buyer_name: string | null;
        buyer_phone: string;
        buyer_lat: string;
        buyer_lng: string;
      }>(
        `
          SELECT
            oa.id AS assignment_id,
            oa.status,
            oa.accepted_at,
            p.name AS product_name,
            mri.quantity,
            mri.unit,
            u.name AS buyer_name,
            u.phone AS buyer_phone,
            mri.buyer_lat,
            mri.buyer_lng
          FROM order_assignments oa
          JOIN market_request_items mri ON mri.id = oa.request_item_id
          JOIN market_requests mr ON mr.id = mri.request_id
          JOIN buyer_profiles bp ON bp.id = mr.buyer_id
          JOIN users u ON u.id = bp.user_id
          JOIN products p ON p.id = mri.product_id
          WHERE oa.seller_id = $1
          ORDER BY oa.accepted_at DESC
        `,
        [sellerId],
      );

      return result.rows.map((row) => ({
        assignmentId: row.assignment_id,
        status: row.status,
        acceptedAt: row.accepted_at,
        productName: row.product_name,
        quantity: Number(row.quantity),
        unit: row.unit,
        buyerName: row.buyer_name,
        buyerPhone: row.buyer_phone,
        buyerLocation: {
          lat: Number(row.buyer_lat),
          lng: Number(row.buyer_lng),
        },
      }));
    });

    ok(response, data);
  }),
);

router.put(
  "/:id/status",
  requireAuth,
  requireRole("seller"),
  asyncHandler(async (request, response) => {
    const assignmentId = requireString(request.params.id, "assignmentId");
    const status = requireString(request.body.status, "status");
    const allowedStatuses = new Set(["accepted", "preparing", "out_for_delivery", "delivered", "cancelled"]);

    if (!allowedStatuses.has(status)) {
      throw new ApiError(400, "Invalid order status");
    }

    const data = await withTransaction(async (client) => {
      const sellerId = await getSellerProfileId(client, request.auth!.userId);
      const result = await client.query<{
        id: string;
        status: string;
        request_item_id: string;
        buyer_user_id: string;
      }>(
        `
          UPDATE order_assignments oa
          SET status = $3,
              updated_at = now()
          FROM market_request_items mri
          JOIN market_requests mr ON mr.id = mri.request_id
          JOIN buyer_profiles bp ON bp.id = mr.buyer_id
          WHERE oa.id = $1
            AND oa.seller_id = $2
            AND oa.request_item_id = mri.id
          RETURNING oa.id, oa.status, oa.request_item_id, bp.user_id AS buyer_user_id
        `,
        [assignmentId, sellerId, status],
      );

      if (!result.rows[0]) {
        throw new ApiError(404, "Order not found");
      }

      const updated = result.rows[0];

      if (status === "delivered") {
        await client.query(
          `
            UPDATE market_request_items
            SET status = 'assigned'
            WHERE id = $1
          `,
          [updated.request_item_id],
        );
      }

      await client.query(
        `
          INSERT INTO notifications (user_id, title, body)
          VALUES ($1, 'Order status updated', $2)
        `,
        [updated.buyer_user_id, `Your order is now ${status.replaceAll("_", " ")}.`],
      );

      return {
        assignmentId: updated.id,
        status: updated.status,
      };
    });

    ok(response, data);
  }),
);

router.get(
  "/:id",
  requireAuth,
  asyncHandler(async (request, response) => {
    const assignmentId = requireString(request.params.id, "assignmentId");

    const data = await withTransaction(async (client) => {
      const result = await client.query<{
        assignment_id: string;
        assignment_status: string;
        accepted_at: string;
        product_name: string;
        quantity: string;
        unit: string;
        preferred_price: string | null;
        buyer_name: string | null;
        buyer_phone: string;
        buyer_lat: string;
        buyer_lng: string;
        seller_name: string | null;
        seller_phone: string;
        shop_name: string | null;
        seller_lat: string | null;
        seller_lng: string | null;
        buyer_user_id: string;
        seller_user_id: string;
      }>(
        `
          SELECT
            oa.id AS assignment_id,
            oa.status AS assignment_status,
            oa.accepted_at,
            p.name AS product_name,
            mri.quantity,
            mri.unit,
            mri.preferred_price,
            bu.name AS buyer_name,
            bu.phone AS buyer_phone,
            mri.buyer_lat,
            mri.buyer_lng,
            su.name AS seller_name,
            su.phone AS seller_phone,
            sp.shop_name,
            sp.service_lat AS seller_lat,
            sp.service_lng AS seller_lng,
            bu.id AS buyer_user_id,
            su.id AS seller_user_id
          FROM order_assignments oa
          JOIN market_request_items mri ON mri.id = oa.request_item_id
          JOIN market_requests mr ON mr.id = mri.request_id
          JOIN buyer_profiles bp ON bp.id = mr.buyer_id
          JOIN users bu ON bu.id = bp.user_id
          JOIN seller_profiles sp ON sp.id = oa.seller_id
          JOIN users su ON su.id = sp.user_id
          JOIN products p ON p.id = mri.product_id
          WHERE oa.id = $1
        `,
        [assignmentId],
      );

      const row = result.rows[0];
      if (!row) {
        throw new ApiError(404, "Order not found");
      }

      const requesterId = request.auth!.userId;
      if (requesterId !== row.buyer_user_id && requesterId !== row.seller_user_id) {
        throw new ApiError(403, "You do not have access to this order");
      }

      return {
        assignmentId: row.assignment_id,
        status: row.assignment_status,
        acceptedAt: row.accepted_at,
        productName: row.product_name,
        quantity: Number(row.quantity),
        unit: row.unit,
        preferredPrice: row.preferred_price ? Number(row.preferred_price) : null,
        buyer: {
          name: row.buyer_name,
          phone: row.buyer_phone,
          lat: Number(row.buyer_lat),
          lng: Number(row.buyer_lng),
        },
        seller: {
          name: row.seller_name,
          phone: row.seller_phone,
          shopName: row.shop_name,
          lat: row.seller_lat ? Number(row.seller_lat) : null,
          lng: row.seller_lng ? Number(row.seller_lng) : null,
        },
      };
    });

    ok(response, data);
  }),
);

export { router as ordersRouter };
