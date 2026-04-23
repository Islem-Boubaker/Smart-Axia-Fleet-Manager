import { Sequelize } from "sequelize";
import dotenv from "dotenv";
import { createClient, createClientPool } from "@redis/client";

dotenv.config({ quiet: true });

/* =========================
   🔥 DATABASE CONFIG
========================= */

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not defined in .env");
}

// 🚀 FIXED Sequelize config (NO MORE max:1 ❌)
export const sequelize = new Sequelize(databaseUrl, {
  dialect: "postgres",
  logging: false,

  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
    keepAlive: true, // 🔥 keep connection alive
  },

  pool: {
    max: 5,
    min: 0,         // 🔥 keep connections warm
    acquire: 30000,
    idle: 10000,
    evict: 1000,
  },
});

// 🔥 connect once at server start (VERY IMPORTANT)
export const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Database connected successfully");
  } catch (error) {
    console.error("❌ Database connection failed:", error.message);
    process.exit(1);
  }
};


/* =========================
   🔥 REDIS CONFIG (OPTIMIZED)
========================= */

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

// Utility: safe decode
const decodeSafe = (value) => {
  if (!value) return null;
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

// Build Redis options
const buildRedisOptions = (url) => {
  const parsed = new URL(url);

  return {
    socket: {
      host: parsed.hostname || "localhost",
      port: Number(parsed.port || 6379),
      keepAlive: 5000,
      reconnectStrategy: (retries) =>
        retries > 20 ? new Error("Redis reconnect limit") : Math.min(retries * 100, 3000),
      tls: parsed.protocol === "rediss:" ? true : undefined,
    },
    username: decodeSafe(parsed.username) || undefined,
    password: decodeSafe(parsed.password) || undefined,
    database: Number(parsed.pathname?.replace("/", "") || 0),
  };
};

const redisOptions = buildRedisOptions(redisUrl);

// 🚀 main Redis client
export const redisClient = createClient(redisOptions);

// 🚀 Redis pool
export const redisPool = createClientPool(redisOptions, {
  minimum: 1,
  maximum: 10,
});

// 🔥 Redis lifecycle
redisClient.on("error", (err) => {
  console.error("[Redis] Error:", err.message);
});

redisClient.on("ready", () => {
  console.log("✅ Redis connected");
});

// 🔥 Initialize Redis (safe)
export const initializeRedis = async () => {
  try {
    if (!redisClient.isOpen) await redisClient.connect();
    if (!redisPool.isOpen) await redisPool.connect();
  } catch (err) {
    console.error("❌ Redis connection failed:", err.message);
  }
};

// 🔥 Get Redis instance
export const getRedisClient = () =>
  redisPool.isOpen ? redisPool : redisClient;

// 🔥 Close Redis safely
export const closeRedis = async () => {
  try {
    if (redisPool.isOpen) await redisPool.close();
    if (redisClient.isOpen) await redisClient.quit();
  } catch (err) {
    console.error("[Redis] Close error:", err.message);
  }
};

export const isRedisAvailable = () =>
  redisPool.isOpen || redisClient.isOpen;