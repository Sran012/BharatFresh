import dotenv from "dotenv";

dotenv.config();

const toNumber = (value: string | undefined, fallback: number): number => {
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const config = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: toNumber(process.env.PORT, 4000),
  databaseUrl: process.env.DATABASE_URL ?? "postgres://postgres:postgres@localhost:5432/bharatfresh",
  jwtSecret: process.env.JWT_SECRET ?? "bharatfresh-dev-secret",
  otpTtlMinutes: toNumber(process.env.OTP_TTL_MINUTES, 10),
  requestExpiryMinutes: toNumber(process.env.REQUEST_EXPIRY_MINUTES, 20),
  allowSelfSignedDbCert:
    process.env.DB_SSL_ALLOW_SELF_SIGNED === "false"
      ? false
      : true,
};

export const isProduction = config.nodeEnv === "production";
