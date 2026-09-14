import { Router } from "express";
import { withTransaction } from "../db/pool.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { getUserById } from "../services/users.js";
import { asyncHandler, ok } from "../utils/http.js";
import { optionalNumber, requireString } from "../utils/validation.js";

const router = Router();

router.use(requireAuth, requireRole("buyer"));

router.get(
  "/profile",
  asyncHandler(async (request, response) => {
    const data = await withTransaction(async (client) => {
      const user = await getUserById(client, request.auth!.userId);
      return {
        id: user.id,
        phone: user.phone,
        role: user.role,
        name: user.name,
      };
    });

    ok(response, data);
  }),
);

router.put(
  "/profile",
  asyncHandler(async (request, response) => {
    const name = requireString(request.body.name, "name");

    const data = await withTransaction(async (client) => {
      const result = await client.query<{
        id: string;
        phone: string;
        role: "buyer";
        name: string;
      }>(
        `
          UPDATE users
          SET name = $2
          WHERE id = $1
          RETURNING id, phone, role, name
        `,
        [request.auth!.userId, name],
      );

      return result.rows[0];
    });

    ok(response, data);
  }),
);

router.get(
  "/addresses",
  asyncHandler(async (request, response) => {
    const data = await withTransaction(async (client) => {
      const result = await client.query<{
        id: string;
        label: string;
        full_address: string;
        lat: string | null;
        lng: string | null;
        is_default: boolean;
      }>(
        `
          SELECT id, label, full_address, lat, lng, is_default
          FROM addresses
          WHERE user_id = $1
          ORDER BY is_default DESC, created_at DESC
        `,
        [request.auth!.userId],
      );

      return result.rows.map((row) => ({
        id: row.id,
        label: row.label,
        fullAddress: row.full_address,
        lat: row.lat ? Number(row.lat) : null,
        lng: row.lng ? Number(row.lng) : null,
        isDefault: row.is_default,
      }));
    });

    ok(response, data);
  }),
);

router.post(
  "/addresses",
  asyncHandler(async (request, response) => {
    const label = requireString(request.body.label, "label");
    const fullAddress = requireString(request.body.fullAddress, "fullAddress");
    const lat = optionalNumber(request.body.lat);
    const lng = optionalNumber(request.body.lng);
    const isDefault = request.body.isDefault === true;

    const data = await withTransaction(async (client) => {
      if (isDefault) {
        await client.query(
          `
            UPDATE addresses
            SET is_default = false
            WHERE user_id = $1
          `,
          [request.auth!.userId],
        );
      }

      const result = await client.query<{
        id: string;
        label: string;
        full_address: string;
        lat: string | null;
        lng: string | null;
        is_default: boolean;
      }>(
        `
          INSERT INTO addresses (user_id, label, full_address, lat, lng, is_default)
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING id, label, full_address, lat, lng, is_default
        `,
        [request.auth!.userId, label, fullAddress, lat, lng, isDefault],
      );

      const row = result.rows[0];
      return {
        id: row.id,
        label: row.label,
        fullAddress: row.full_address,
        lat: row.lat ? Number(row.lat) : null,
        lng: row.lng ? Number(row.lng) : null,
        isDefault: row.is_default,
      };
    });

    ok(response, data, 201);
  }),
);

router.put(
  "/addresses/:id",
  asyncHandler(async (request, response) => {
    const addressId = requireString(request.params.id, "addressId");
    const label = requireString(request.body.label, "label");
    const fullAddress = requireString(request.body.fullAddress, "fullAddress");
    const lat = optionalNumber(request.body.lat);
    const lng = optionalNumber(request.body.lng);
    const isDefault = request.body.isDefault === true;

    const data = await withTransaction(async (client) => {
      if (isDefault) {
        await client.query(
          `
            UPDATE addresses
            SET is_default = false
            WHERE user_id = $1
          `,
          [request.auth!.userId],
        );
      }

      const result = await client.query<{
        id: string;
        label: string;
        full_address: string;
        lat: string | null;
        lng: string | null;
        is_default: boolean;
      }>(
        `
          UPDATE addresses
          SET label = $3,
              full_address = $4,
              lat = $5,
              lng = $6,
              is_default = $7
          WHERE id = $1
            AND user_id = $2
          RETURNING id, label, full_address, lat, lng, is_default
        `,
        [addressId, request.auth!.userId, label, fullAddress, lat, lng, isDefault],
      );

      const row = result.rows[0];
      return {
        id: row.id,
        label: row.label,
        fullAddress: row.full_address,
        lat: row.lat ? Number(row.lat) : null,
        lng: row.lng ? Number(row.lng) : null,
        isDefault: row.is_default,
      };
    });

    ok(response, data);
  }),
);

export { router as buyerRouter };
