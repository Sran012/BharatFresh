import { Router } from "express";
import { withTransaction } from "../db/pool.js";
import { distanceFormula } from "../services/orders.js";
import { asyncHandler, ApiError, ok } from "../utils/http.js";

const router = Router();

router.get(
  "/nearby",
  asyncHandler(async (request, response) => {
    const lat = Number(request.query.lat);
    const lng = Number(request.query.lng);
    const radius = typeof request.query.radius === "string" ? Number(request.query.radius) : 10;

    const data = await withTransaction(async (client) => {
      const result = await client.query<{
        seller_id: string;
        user_id: string;
        shop_name: string | null;
        seller_name: string | null;
        service_lat: string | null;
        service_lng: string | null;
        service_radius_km: string;
        rating: string;
        distance_km: string;
      }>(
        `
          SELECT
            sp.id AS seller_id,
            u.id AS user_id,
            sp.shop_name,
            u.name AS seller_name,
            sp.service_lat,
            sp.service_lng,
            sp.service_radius_km,
            sp.rating,
            ${distanceFormula("sp.service_lat", "sp.service_lng", "$1", "$2")} AS distance_km
          FROM seller_profiles sp
          JOIN users u ON u.id = sp.user_id
          WHERE sp.is_active = true
            AND ${distanceFormula("sp.service_lat", "sp.service_lng", "$1", "$2")} <= $3
          ORDER BY distance_km ASC
        `,
        [lat, lng, radius],
      );

      return result.rows.map((row) => ({
        sellerId: row.seller_id,
        userId: row.user_id,
        shopName: row.shop_name,
        sellerName: row.seller_name,
        serviceLat: row.service_lat ? Number(row.service_lat) : null,
        serviceLng: row.service_lng ? Number(row.service_lng) : null,
        serviceRadiusKm: Number(row.service_radius_km),
        rating: Number(row.rating),
        distanceKm: Number(row.distance_km),
      }));
    });

    ok(response, data);
  }),
);

router.get(
  "/:id/inventory",
  asyncHandler(async (request, response) => {
    const sellerId = request.params.id;

    const data = await withTransaction(async (client) => {
      const result = await client.query<{
        inventory_item_id: string;
        product_id: string;
        product_name: string;
        category: string | null;
        price: string;
        stock_qty: string;
        unit: string;
        image_url: string | null;
        description: string | null;
        shop_name: string | null;
      }>(
        `
          SELECT
            ii.id AS inventory_item_id,
            p.id AS product_id,
            p.name AS product_name,
            p.category,
            ii.price,
            ii.stock_qty,
            ii.unit,
            ii.image_url,
            ii.description,
            sp.shop_name
          FROM inventory_items ii
          JOIN products p ON p.id = ii.product_id
          JOIN seller_profiles sp ON sp.id = ii.seller_id
          WHERE ii.seller_id = $1
            AND ii.in_stock = true
          ORDER BY p.name ASC
        `,
        [sellerId],
      );

      return result.rows.map((row) => ({
        inventoryItemId: row.inventory_item_id,
        productId: row.product_id,
        productName: row.product_name,
        category: row.category,
        price: Number(row.price),
        stockQty: Number(row.stock_qty),
        unit: row.unit,
        imageUrl: row.image_url,
        description: row.description,
        shopName: row.shop_name,
      }));
    });

    ok(response, data);
  }),
);

router.get(
  "/:id",
  asyncHandler(async (request, response) => {
    const sellerId = request.params.id;
    const data = await withTransaction(async (client) => {
      const result = await client.query<{
        shop_name: string | null;
        seller_name: string | null;
        rating: string;
        service_lat: string | null;
        service_lng: string | null;
        phone: string;
      }>(
        `
          SELECT sp.shop_name, u.name AS seller_name, sp.rating, sp.service_lat, sp.service_lng, u.phone
          FROM seller_profiles sp
          JOIN users u ON u.id = sp.user_id
          WHERE sp.id = $1
        `,
        [sellerId],
      );
      if (!result.rows[0]) {
        throw new ApiError(404, "Seller not found");
      }
      const row = result.rows[0];
      return {
        shopName: row.shop_name,
        sellerName: row.seller_name,
        rating: Number(row.rating),
        lat: row.service_lat ? Number(row.service_lat) : null,
        lng: row.service_lng ? Number(row.service_lng) : null,
        phone: row.phone,
      };
    });
    ok(response, data);
  }),
);

export { router as sellersRouter };
