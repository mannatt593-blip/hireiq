const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on("connect", () => {
  console.log("PostgreSQL database connected");
});

pool.on("error", (error) => {
  console.error("PostgreSQL pool error:", error);
});

module.exports = pool;