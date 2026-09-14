import type { PoolClient } from "pg";

export const distanceFormula = (
  latField: string,
  lngField: string,
  refLatPlaceholder: string,
  refLngPlaceholder: string,
): string => `
  6371 * acos(
    least(
      1,
      cos(radians(${refLatPlaceholder})) * cos(radians(${latField})) *
      cos(radians(${lngField}) - radians(${refLngPlaceholder})) +
      sin(radians(${refLatPlaceholder})) * sin(radians(${latField}))
    )
  )
`;

export const expirePendingRequests = async (client: PoolClient): Promise<void> => {
  await client.query(`
    UPDATE market_request_items mri
    SET status = 'expired'
    FROM market_requests mr
    WHERE mri.request_id = mr.id
      AND mr.expires_at <= now()
      AND mri.status = 'pending'
  `);

  await client.query(`
    UPDATE market_requests
    SET status = 'expired'
    WHERE expires_at <= now()
      AND status = 'pending'
  `);
};
