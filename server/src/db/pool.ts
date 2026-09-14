import { Pool, type PoolClient, type QueryResult, type QueryResultRow } from "pg";
import { config } from "../config.js";

const rawDatabaseUrl = new URL(config.databaseUrl);
const useSsl = rawDatabaseUrl.searchParams.get("sslmode") === "require" || rawDatabaseUrl.searchParams.get("ssl") === "true";

if (useSsl) {
  rawDatabaseUrl.searchParams.delete("sslmode");
  rawDatabaseUrl.searchParams.delete("ssl");
}

export const pool = new Pool({
  connectionString: rawDatabaseUrl.toString(),
  ssl: useSsl
    ? {
        rejectUnauthorized: !config.allowSelfSignedDbCert,
      }
    : undefined,
});

export const query = <T extends QueryResultRow>(
  text: string,
  params: unknown[] = [],
): Promise<QueryResult<T>> => pool.query<T>(text, params);

export const withTransaction = async <T>(
  work: (client: PoolClient) => Promise<T>,
): Promise<T> => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    const result = await work(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};
