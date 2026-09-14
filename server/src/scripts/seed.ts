import { pool } from "../db/pool.js";

const products = [
  ["Tomato", "vegetables", "kg"],
  ["Potato", "root", "kg"],
  ["Onion", "root", "kg"],
  ["Spinach", "leafy", "bunch"],
  ["Banana", "fruits", "dozen"],
  ["Coriander", "herbs", "bunch"],
];

const main = async (): Promise<void> => {
  for (const [name, category, unit] of products) {
    await pool.query(
      `
        INSERT INTO products (name, category, unit)
        VALUES ($1, $2, $3)
        ON CONFLICT DO NOTHING
      `,
      [name, category, unit],
    );
  }

  console.log("Seed completed");
  await pool.end();
};

main().catch(async (error) => {
  console.error(error);
  await pool.end();
  process.exit(1);
});
