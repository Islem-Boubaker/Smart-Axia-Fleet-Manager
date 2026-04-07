import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is not defined in .env");
}

const isPooler = databaseUrl.includes(".pooler.") || databaseUrl.includes(":6543");

export const sequelize = new Sequelize(databaseUrl, {
  dialect: "postgres",
  logging: false,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
    keepAlive: true,
  },
  pool: isPooler
    ? { max: 1, min: 0, idle: 10000, acquire: 60000, evict: 1000 }
    : { max: 10, min: 0, idle: 10000, acquire: 60000, evict: 1000 },
});

// import express from 'express';
// import postgres from 'postgres';
// import dotenv from 'dotenv';

// dotenv.config();

// const app = express();
// const PORT = process.env.PORT || 3000;

// // Create postgres connection
// const connectionString = process.env.DATABASE_URL || "postgresql://postgres:Islem94998370@db.midqrmwtpqbqjcgcntzd.supabase.co:5432/postgres";

// console.log("Connecting to database with URL:", connectionString);
// if (!connectionString) {
//   throw new Error("DATABASE_URL is not defined in .env");
// }

// const sql = postgres(connectionString, {
//   ssl: 'require', // Required for Supabase
// });

// // Test connection function
// async function startServer() {
//   try {
//     await sql`SELECT 1`; // Simple test query

//     console.log("✅ Supabase connected successfully!");

//     app.listen(PORT, () => {
//       console.log(`🚀 Server running on port ${PORT}`);
//     });

//   } catch (error) {
//     console.error("❌ Unable to connect:", error);
//     process.exit(1);
//   }
// }

// startServer();

// export default sql;