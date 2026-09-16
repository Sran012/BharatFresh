import { Router } from "express";
import { withTransaction } from "../db/pool.js";
import { requireAuth } from "../middleware/auth.js";
import { distanceFormula } from "../services/orders.js";
import { asyncHandler, ApiError, ok } from "../utils/http.js";
import { requireString } from "../utils/validation.js";

const router = Router();

router.get(
  "/",
  asyncHandler(async (_request, response) => {
    const result = await withTransaction(async (client) => {
      const r = await client.query<{
        id: string;
        name: string;
        category: string | null;
        unit: string | null;
        image_url: string | null;
      }>(
        `SELECT id, name, category, unit, image_url FROM products ORDER BY name ASC`,
      );
      return r.rows.map((row) => ({
        id: row.id,
        name: row.name,
        category: row.category,
        unit: row.unit,
        imageUrl: row.image_url,
      }));
    });
    ok(response, result);
  }),
);

router.post(
  "/",
  requireAuth,
  asyncHandler(async (request, response) => {
    const name = requireString(request.body.name, "name");
    const category = typeof request.body.category === "string" ? request.body.category : null;
    const unit = typeof request.body.unit === "string" ? request.body.unit : "kg";

    const result = await withTransaction(async (client) => {
      const r = await client.query<{ id: string; name: string; category: string | null; unit: string | null; image_url: string | null }>(
        `INSERT INTO products (name, category, unit) VALUES ($1, $2, $3)
         ON CONFLICT DO NOTHING
         RETURNING id, name, category, unit, image_url`,
        [name, category, unit],
      );
      if (r.rows[0]) return r.rows[0];
      const existing = await client.query<{ id: string; name: string; category: string | null; unit: string | null; image_url: string | null }>(
        `SELECT id, name, category, unit, image_url FROM products WHERE name = $1`,
        [name],
      );
      return existing.rows[0];
    });

    ok(response, {
      id: result.id,
      name: result.name,
      category: result.category,
      defaultUnit: result.unit ?? "kg",
      imageUrl: result.image_url,
    });
  }),
);

router.get(
  "/search",
  asyncHandler(async (request, response) => {
    const q = typeof request.query.q === "string" ? request.query.q.trim() : "";
    const lat = typeof request.query.lat === "string" ? Number(request.query.lat) : null;
    const lng = typeof request.query.lng === "string" ? Number(request.query.lng) : null;
    const radius = typeof request.query.radius === "string" ? Number(request.query.radius) : 10;
    const minPrice = typeof request.query.min_price === "string" ? Number(request.query.min_price) : null;
    const maxPrice = typeof request.query.max_price === "string" ? Number(request.query.max_price) : null;

    const data = await withTransaction(async (client) => {
      const useDistance = lat !== null && lng !== null;
      const params: unknown[] = [q ? `%${q.toLowerCase()}%` : "%"];
      let nextParam = 2;

      const distLatParam = useDistance ? `$${nextParam++}` : null;
      const distLngParam = useDistance ? `$${nextParam++}` : null;
      const distRadiusParam = useDistance ? `$${nextParam++}` : null;

      const distanceSelect = distLatParam
        ? `${distanceFormula("sp.service_lat", "sp.service_lng", distLatParam, distLngParam!)} AS distance_km,`
        : "NULL::numeric AS distance_km,";
      const distanceFilter = distLatParam
        ? `AND ${distanceFormula("sp.service_lat", "sp.service_lng", distLatParam, distLngParam!)} <= ${distRadiusParam}`
        : "";

      const minPriceParam = minPrice !== null ? `$${nextParam++}` : null;
      const maxPriceParam = maxPrice !== null ? `$${nextParam++}` : null;
      const minPriceFilter = minPriceParam ? `AND ii.price >= ${minPriceParam}` : "";
      const maxPriceFilter = maxPriceParam ? `AND ii.price <= ${maxPriceParam}` : "";

      if (useDistance) {
        params.push(lat, lng, radius);
      }
      if (minPrice !== null) {
        params.push(minPrice);
      }
      if (maxPrice !== null) {
        params.push(maxPrice);
      }

      const result = await client.query<{
        product_id: string;
        product_name: string;
        category: string | null;
        default_unit: string | null;
        seller_id: string;
        shop_name: string | null;
        inventory_item_id: string;
        price: string;
        stock_qty: string;
        unit: string;
        distance_km: string | null;
      }>(
        `
          SELECT
            p.id AS product_id,
            p.name AS product_name,
            p.category,
            p.unit AS default_unit,
            sp.id AS seller_id,
            sp.shop_name,
            ii.id AS inventory_item_id,
            ii.price,
            ii.stock_qty,
            ii.unit,
            ${distanceSelect}
            sp.service_lat,
            sp.service_lng
          FROM products p
          JOIN inventory_items ii ON ii.product_id = p.id
          JOIN seller_profiles sp ON sp.id = ii.seller_id
          WHERE lower(p.name) LIKE $1
            AND sp.is_active = true
            AND ii.in_stock = true
            ${distanceFilter}
            ${minPriceFilter}
            ${maxPriceFilter}
          ORDER BY p.name ASC, ii.price ASC
        `,
        params,
      );

      const grouped = new Map<
        string,
        {
          productId: string;
          productName: string;
          category: string | null;
          unit: string | null;
          stats: {
            lowestPrice: number;
            highestPrice: number;
            averagePrice: number;
            sellerCount: number;
          };
          sellers: Array<{
            sellerId: string;
            shopName: string | null;
            inventoryItemId: string;
            price: number;
            stockQty: number;
            unit: string;
            distanceKm: number | null;
          }>;
        }
      >();

      for (const row of result.rows) {
        const price = Number(row.price);
        const existing = grouped.get(row.product_id);
        if (!existing) {
          grouped.set(row.product_id, {
            productId: row.product_id,
            productName: row.product_name,
            category: row.category,
            unit: row.default_unit,
            stats: {
              lowestPrice: price,
              highestPrice: price,
              averagePrice: price,
              sellerCount: 1,
            },
            sellers: [
              {
                sellerId: row.seller_id,
                shopName: row.shop_name,
                inventoryItemId: row.inventory_item_id,
                price,
                stockQty: Number(row.stock_qty),
                unit: row.unit,
                distanceKm: row.distance_km ? Number(row.distance_km) : null,
              },
            ],
          });
          continue;
        }

        existing.stats.lowestPrice = Math.min(existing.stats.lowestPrice, price);
        existing.stats.highestPrice = Math.max(existing.stats.highestPrice, price);
        existing.stats.averagePrice =
          (existing.stats.averagePrice * existing.stats.sellerCount + price) / (existing.stats.sellerCount + 1);
        existing.stats.sellerCount += 1;
        existing.sellers.push({
          sellerId: row.seller_id,
          shopName: row.shop_name,
          inventoryItemId: row.inventory_item_id,
          price,
          stockQty: Number(row.stock_qty),
          unit: row.unit,
          distanceKm: row.distance_km ? Number(row.distance_km) : null,
        });
      }

      return Array.from(grouped.values()).map((item) => ({
        ...item,
        stats: {
          ...item.stats,
          averagePrice: Number(item.stats.averagePrice.toFixed(2)),
        },
      }));
    });

    ok(response, data);
  }),
);

router.get(
  "/nearby",
  asyncHandler(async (request, response) => {
    const lat = Number(request.query.lat);
    const lng = Number(request.query.lng);
    const radius = typeof request.query.radius === "string" ? Number(request.query.radius) : 10;

    const data = await withTransaction(async (client) => {
      const result = await client.query<{
        inventory_item_id: string;
        product_id: string;
        product_name: string;
        category: string | null;
        seller_id: string;
        shop_name: string | null;
        price: string;
        stock_qty: string;
        unit: string;
        distance_km: string;
      }>(
        `
          SELECT
            ii.id AS inventory_item_id,
            p.id AS product_id,
            p.name AS product_name,
            p.category,
            sp.id AS seller_id,
            sp.shop_name,
            ii.price,
            ii.stock_qty,
            ii.unit,
            ${distanceFormula("sp.service_lat", "sp.service_lng", "$1", "$2")} AS distance_km
          FROM inventory_items ii
          JOIN products p ON p.id = ii.product_id
          JOIN seller_profiles sp ON sp.id = ii.seller_id
          WHERE sp.is_active = true
            AND ii.in_stock = true
            AND ${distanceFormula("sp.service_lat", "sp.service_lng", "$1", "$2")} <= $3
          ORDER BY distance_km ASC, ii.price ASC
        `,
        [lat, lng, radius],
      );

      return result.rows.map((row) => ({
        inventoryItemId: row.inventory_item_id,
        productId: row.product_id,
        productName: row.product_name,
        category: row.category,
        sellerId: row.seller_id,
        shopName: row.shop_name,
        price: Number(row.price),
        stockQty: Number(row.stock_qty),
        unit: row.unit,
        distanceKm: Number(row.distance_km),
      }));
    });

    ok(response, data);
  }),
);

// ponytail: /:id must be after /search and /nearby to avoid matching them as IDs
router.get(
  "/:id",
  asyncHandler(async (request, response) => {
    const productId = requireString(request.params.id, "productId");

    const data = await withTransaction(async (client) => {
      const result = await client.query<{
        id: string;
        name: string;
        category: string | null;
        unit: string | null;
        image_url: string | null;
      }>(
        `
          SELECT id, name, category, unit, image_url
          FROM products
          WHERE id = $1
        `,
        [productId],
      );

      if (!result.rows[0]) {
        throw new ApiError(404, "Product not found");
      }

      const product = result.rows[0];
      const sellersResult = await client.query<{
        seller_id: string;
        shop_name: string | null;
        inventory_item_id: string;
        price: string;
        stock_qty: string;
        unit: string;
        in_stock: boolean;
      }>(
        `
          SELECT sp.id AS seller_id, sp.shop_name, ii.id AS inventory_item_id, ii.price, ii.stock_qty, ii.unit, ii.in_stock
          FROM inventory_items ii
          JOIN seller_profiles sp ON sp.id = ii.seller_id
          WHERE ii.product_id = $1
            AND sp.is_active = true
            AND ii.in_stock = true
          ORDER BY ii.price ASC
        `,
        [productId],
      );

      return {
        id: product.id,
        name: product.name,
        category: product.category,
        unit: product.unit,
        imageUrl: product.image_url,
        sellers: sellersResult.rows.map((row) => ({
          sellerId: row.seller_id,
          shopName: row.shop_name,
          inventoryItemId: row.inventory_item_id,
          price: Number(row.price),
          stockQty: Number(row.stock_qty),
          unit: row.unit,
        })),
      };
    });

    ok(response, data);
  }),
);

export { router as productsRouter };
