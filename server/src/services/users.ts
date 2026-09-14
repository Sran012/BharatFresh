import type { PoolClient } from "pg";
import { ApiError } from "../utils/http.js";

type UserRow = {
  id: string;
  phone: string;
  role: "buyer" | "seller" | null;
  name: string | null;
  created_at: string;
};

export const getUserById = async (client: PoolClient, userId: string): Promise<UserRow> => {
  const result = await client.query<UserRow>(
    `
      SELECT id, phone, role, name, created_at
      FROM users
      WHERE id = $1
    `,
    [userId],
  );

  if (!result.rows[0]) {
    throw new ApiError(404, "User not found");
  }

  return result.rows[0];
};

export const getBuyerProfileId = async (client: PoolClient, userId: string): Promise<string> => {
  const result = await client.query<{ id: string }>(
    `
      SELECT id
      FROM buyer_profiles
      WHERE user_id = $1
    `,
    [userId],
  );

  if (!result.rows[0]) {
    throw new ApiError(400, "Buyer profile has not been created");
  }

  return result.rows[0].id;
};

export const getSellerProfileId = async (client: PoolClient, userId: string): Promise<string> => {
  const result = await client.query<{ id: string }>(
    `
      SELECT id
      FROM seller_profiles
      WHERE user_id = $1
    `,
    [userId],
  );

  if (!result.rows[0]) {
    throw new ApiError(400, "Seller profile has not been created");
  }

  return result.rows[0].id;
};
