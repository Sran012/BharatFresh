import { Router } from "express";
import { query, withTransaction } from "../db/pool.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler, ApiError, ok } from "../utils/http.js";
import { signToken } from "../utils/token.js";
import { optionalNumber, optionalString, requireString } from "../utils/validation.js";

const router = Router();

router.post(
  "/send-otp",
  asyncHandler(async (request, response) => {
    const phone = requireString(request.body.phone, "phone");

    if (!/^\+?[0-9]{7,15}$/.test(phone)) {
      throw new ApiError(400, "Invalid phone number format");
    }

    const code = "111111";

    const result = await query<{ expires_at: string }>(
      `
        INSERT INTO otp_codes (phone, code, expires_at)
        VALUES ($1, $2, now() + interval '10 minutes')
        RETURNING expires_at
      `,
      [phone, code],
    );

    ok(
      response,
      {
        phone,
        expiresAt: result.rows[0].expires_at,
        devCode: code,
      },
      201,
    );
  }),
);

router.post(
  "/verify-otp",
  asyncHandler(async (request, response) => {
    const phone = requireString(request.body.phone, "phone");
    const code = requireString(request.body.code, "code");

    const otpResult = await query<{ id: string }>(
      `
        SELECT id
        FROM otp_codes
        WHERE phone = $1
          AND code = $2
          AND expires_at > now()
          AND verified_at IS NULL
        ORDER BY created_at DESC
        LIMIT 1
      `,
      [phone, code],
    );

    if (!otpResult.rows[0]) {
      throw new ApiError(401, "Invalid or expired OTP");
    }

    const data = await withTransaction(async (client) => {
      await client.query(
        `
          UPDATE otp_codes
          SET verified_at = now()
          WHERE id = $1
        `,
        [otpResult.rows[0].id],
      );

      const userResult = await client.query<{
        id: string;
        phone: string;
        role: "buyer" | "seller" | null;
        name: string | null;
      }>(
        `
          INSERT INTO users (phone)
          VALUES ($1)
          ON CONFLICT (phone) DO UPDATE SET phone = EXCLUDED.phone
          RETURNING id, phone, role, name
        `,
        [phone],
      );

      const user = userResult.rows[0];
      const token = signToken({
        userId: user.id,
        phone: user.phone,
        role: user.role,
      });

      return {
        token,
        user: {
          id: user.id,
          phone: user.phone,
          role: user.role,
          name: user.name,
          needsRegistration: !user.role,
        },
      };
    });

    ok(response, data);
  }),
);

router.post(
  "/register",
  requireAuth,
  asyncHandler(async (request, response) => {
    const name = requireString(request.body.name, "name");
    const role = requireString(request.body.role, "role");

    if (role !== "buyer" && role !== "seller") {
      throw new ApiError(400, "role must be buyer or seller");
    }

    const shopName = optionalString(request.body.shopName);
    const serviceLat = optionalNumber(request.body.serviceLat);
    const serviceLng = optionalNumber(request.body.serviceLng);
    const serviceRadiusKm = optionalNumber(request.body.serviceRadiusKm);

    const data = await withTransaction(async (client) => {
      const userResult = await client.query<{
        id: string;
        phone: string;
        role: "buyer" | "seller";
        name: string;
      }>(
        `
          UPDATE users
          SET name = $2, role = $3
          WHERE id = $1
          RETURNING id, phone, role, name
        `,
        [request.auth!.userId, name, role],
      );

      if (role === "buyer") {
        await client.query(
          `
            INSERT INTO buyer_profiles (user_id)
            VALUES ($1)
            ON CONFLICT (user_id) DO NOTHING
          `,
          [request.auth!.userId],
        );
      }

      if (role === "seller") {
        await client.query(
          `
            INSERT INTO seller_profiles (user_id, shop_name, service_lat, service_lng, service_radius_km)
            VALUES ($1, $2, $3, $4, COALESCE($5, 5))
            ON CONFLICT (user_id) DO UPDATE
            SET shop_name = COALESCE(EXCLUDED.shop_name, seller_profiles.shop_name),
                service_lat = COALESCE(EXCLUDED.service_lat, seller_profiles.service_lat),
                service_lng = COALESCE(EXCLUDED.service_lng, seller_profiles.service_lng),
                service_radius_km = COALESCE(EXCLUDED.service_radius_km, seller_profiles.service_radius_km)
          `,
          [request.auth!.userId, shopName, serviceLat, serviceLng, serviceRadiusKm],
        );
      }

      const user = userResult.rows[0];
      const token = signToken({
        userId: user.id,
        phone: user.phone,
        role: user.role,
      });

      return {
        token,
        user: {
          id: user.id,
          phone: user.phone,
          role: user.role,
          name: user.name,
        },
      };
    });

    ok(response, data);
  }),
);

router.get(
  "/me",
  requireAuth,
  asyncHandler(async (request, response) => {
    const result = await query<{
      id: string;
      phone: string;
      role: "buyer" | "seller" | null;
      name: string | null;
      created_at: string;
    }>(
      `
        SELECT id, phone, role, name, created_at
        FROM users
        WHERE id = $1
      `,
      [request.auth!.userId],
    );

    ok(response, result.rows[0]);
  }),
);

export { router as authRouter };
