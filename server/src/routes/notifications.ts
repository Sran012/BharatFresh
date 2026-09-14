import { Router } from "express";
import { withTransaction } from "../db/pool.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler, ok } from "../utils/http.js";
import { requireString } from "../utils/validation.js";

const router = Router();

router.use(requireAuth);

router.post(
  "/tokens",
  asyncHandler(async (request, response) => {
    const platform = requireString(request.body.platform, "platform");
    const token = requireString(request.body.token, "token");

    const data = await withTransaction(async (client) => {
      const result = await client.query<{ id: string; platform: string; token: string }>(
        `
          INSERT INTO device_tokens (user_id, platform, token)
          VALUES ($1, $2, $3)
          ON CONFLICT (user_id, token) DO UPDATE
          SET platform = EXCLUDED.platform
          RETURNING id, platform, token
        `,
        [request.auth!.userId, platform, token],
      );

      return result.rows[0];
    });

    ok(response, data, 201);
  }),
);

router.get(
  "/",
  asyncHandler(async (request, response) => {
    const data = await withTransaction(async (client) => {
      const result = await client.query<{
        id: string;
        title: string;
        body: string;
        read: boolean;
        created_at: string;
      }>(
        `
          SELECT id, title, body, read, created_at
          FROM notifications
          WHERE user_id = $1
          ORDER BY created_at DESC
        `,
        [request.auth!.userId],
      );

      return result.rows;
    });

    ok(response, data);
  }),
);

router.put(
  "/:id/read",
  asyncHandler(async (request, response) => {
    const notificationId = requireString(request.params.id, "notificationId");

    await withTransaction(async (client) => {
      await client.query(
        `
          UPDATE notifications
          SET read = true
          WHERE id = $1
            AND user_id = $2
        `,
        [notificationId, request.auth!.userId],
      );
    });

    ok(response, { updated: true });
  }),
);

export { router as notificationsRouter };
