import { Router } from "express";
import { withTransaction } from "../db/pool.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { asyncHandler, ApiError, ok } from "../utils/http.js";
import { optionalNumber, optionalString, requireNumber, requireString } from "../utils/validation.js";

const router = Router();

router.use(requireAuth, requireRole("buyer"));

router.get(
  "/",
  asyncHandler(async (request, response) => {
    const data = await withTransaction(async (client) => {
      const result = await client.query<{
        id: string;
        product_id: string;
        product_name: string;
        category: string | null;
        quantity: string;
        unit: string;
        preferred_price: string | null;
        buyer_lat: string;
        buyer_lng: string;
        note: string | null;
      }>(
        `
          SELECT ci.id, p.id AS product_id, p.name AS product_name, p.category, ci.quantity, ci.unit, ci.preferred_price, ci.buyer_lat, ci.buyer_lng, ci.note
          FROM cart_items ci
          JOIN products p ON p.id = ci.product_id
          WHERE ci.user_id = $1
          ORDER BY ci.created_at DESC
        `,
        [request.auth!.userId],
      );

      return result.rows.map((row) => ({
        id: row.id,
        productId: row.product_id,
        productName: row.product_name,
        category: row.category,
        quantity: Number(row.quantity),
        unit: row.unit,
        preferredPrice: row.preferred_price ? Number(row.preferred_price) : null,
        buyerLat: Number(row.buyer_lat),
        buyerLng: Number(row.buyer_lng),
        note: row.note,
      }));
    });

    ok(response, data);
  }),
);

router.post(
  "/items",
  asyncHandler(async (request, response) => {
    const productId = requireString(request.body.productId, "productId");
    const quantity = requireNumber(request.body.quantity, "quantity");
    const unit = requireString(request.body.unit, "unit");
    const buyerLat = requireNumber(request.body.buyerLat, "buyerLat");
    const buyerLng = requireNumber(request.body.buyerLng, "buyerLng");
    const preferredPrice = optionalNumber(request.body.preferredPrice);
    const note = optionalString(request.body.note);

    if (quantity <= 0) {
      throw new ApiError(400, "quantity must be positive");
    }

    const data = await withTransaction(async (client) => {
      const productCheck = await client.query<{ id: string }>(
        `SELECT id FROM products WHERE id = $1`,
        [productId],
      );
      if (!productCheck.rows[0]) {
        throw new ApiError(404, "Product not found");
      }

      const result = await client.query<{
        id: string;
        product_id: string;
        quantity: string;
        unit: string;
        preferred_price: string | null;
        buyer_lat: string;
        buyer_lng: string;
        note: string | null;
      }>(
        `
          INSERT INTO cart_items (user_id, product_id, quantity, unit, preferred_price, buyer_lat, buyer_lng, note)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING id, product_id, quantity, unit, preferred_price, buyer_lat, buyer_lng, note
        `,
        [request.auth!.userId, productId, quantity, unit, preferredPrice, buyerLat, buyerLng, note],
      );

      const row = result.rows[0];
      return {
        id: row.id,
        productId: row.product_id,
        quantity: Number(row.quantity),
        unit: row.unit,
        preferredPrice: row.preferred_price ? Number(row.preferred_price) : null,
        buyerLat: Number(row.buyer_lat),
        buyerLng: Number(row.buyer_lng),
        note: row.note,
      };
    });

    ok(response, data, 201);
  }),
);

router.delete(
  "/items/:id",
  asyncHandler(async (request, response) => {
    const cartItemId = requireString(request.params.id, "cartItemId");

    await withTransaction(async (client) => {
      await client.query(
        `
          DELETE FROM cart_items
          WHERE id = $1
            AND user_id = $2
        `,
        [cartItemId, request.auth!.userId],
      );
    });

    ok(response, { deleted: true });
  }),
);

export { router as cartRouter };
