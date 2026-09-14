import crypto from "node:crypto";
import { config } from "../config.js";

export type AuthTokenPayload = {
  userId: string;
  phone: string;
  role: "buyer" | "seller" | null;
};

const encode = (value: string): string => Buffer.from(value, "utf8").toString("base64url");
const decode = (value: string): string => Buffer.from(value, "base64url").toString("utf8");

export const signToken = (payload: AuthTokenPayload): string => {
  const header = encode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = encode(JSON.stringify(payload));
  const signature = crypto
    .createHmac("sha256", config.jwtSecret)
    .update(`${header}.${body}`)
    .digest("base64url");

  return `${header}.${body}.${signature}`;
};

export const verifyToken = (token: string): AuthTokenPayload | null => {
  const parts = token.split(".");
  if (parts.length !== 3) {
    return null;
  }

  const [header, body, signature] = parts;
  const expectedSignature = crypto
    .createHmac("sha256", config.jwtSecret)
    .update(`${header}.${body}`)
    .digest("base64url");

  if (signature !== expectedSignature) {
    return null;
  }

  try {
    return JSON.parse(decode(body)) as AuthTokenPayload;
  } catch {
    return null;
  }
};
