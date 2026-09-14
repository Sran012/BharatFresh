import { pool } from "../db/pool.js";
import { schemaSql } from "../db/schema.js";

const main = async (): Promise<void> => {
  await pool.query(schemaSql);
  console.log("Migrations completed");
  await pool.end();
};

main().catch(async (error) => {
  console.error(error);
  await pool.end();
  process.exit(1);
});
