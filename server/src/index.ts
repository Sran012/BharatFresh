import { app } from "./app.js";
import { config } from "./config.js";
import { pool } from "./db/pool.js";
import { schemaSql } from "./db/schema.js";

const start = async (): Promise<void> => {
  if (process.env.RUN_MIGRATIONS === "true") {
    console.log("Running auto-migrations...");
    await pool.query(schemaSql);
    console.log("Auto-migrations completed");
    for (const [name, category, unit] of [
      ["Tomato", "vegetables", "kg"],
      ["Potato", "root", "kg"],
      ["Onion", "root", "kg"],
      ["Spinach", "leafy", "bunch"],
      ["Banana", "fruits", "dozen"],
      ["Coriander", "herbs", "bunch"],
    ]) {
      await pool.query(
        `INSERT INTO products (name, category, unit) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
        [name, category, unit],
      );
    }
    console.log("Auto-seed completed");
  }

  app.listen(config.port, "0.0.0.0", () => {
    console.log(`BharatFresh API listening on 0.0.0.0:${config.port}`);
  });
};

start().catch((error) => {
  console.error("Failed to start server", error);
  process.exit(1);
});
