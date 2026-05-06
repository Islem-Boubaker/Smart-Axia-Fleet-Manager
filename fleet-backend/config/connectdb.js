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

// 🚀 FIXED Sequelize config with optimized pooling
export const sequelize = new Sequelize(databaseUrl, {
  dialect: "postgres",
  logging: false,

  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
    keepAlive: true,
    statement_timeout: 30000, // 30s query timeout to prevent hanging queries
  },

  // 🔥 CONNECTION POOL TUNING — this was the main issue!
  pool: {
    max: 8,           // Max 8 connections (increased from 5)
    min: 2,           // Keep 2 warm connections ready
    acquire: 30000,   // Wait max 30s to get a connection
    idle: 10000,      // Close idle connections after 10s
    evict: 5000,      // Check idle every 5s and remove them
    validate: (connection) => {
      // 🔥 CRITICAL: Validate connection is still alive before using it
      return connection && !connection.closed;
    },
  },

  // 🔥 Connection retry strategy
  retry: {
    max: 3,
    match: [
      /ECONNREFUSED/,
      /ECONNRESET/,
      /ETIMEDOUT/,
      /EHOSTUNREACH/,
      /SequelizeConnectionError/,
    ],
    backoff: (options) => Math.min(options.attempt * 1000, 5000), // Max 5s backoff
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
      noDelay: true,  // 🔥 Disable Nagle's algorithm for faster responses
      reconnectStrategy: (retries) => {
        if (retries > 20) {
          console.error('[Redis] Max reconnect attempts exceeded');
          return new Error("Redis reconnect limit");
        }
        const delay = Math.min(retries * 100, 3000);
        return delay;
      },
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
  console.error("[Redis] Client error:", err.message);
});

redisClient.on("ready", () => {
  console.log("✅ Redis client connected");
});

redisPool.on("error", (err) => {
  console.error("[Redis] Pool error:", err.message);
});

redisPool.on("ready", () => {
  console.log("✅ Redis pool connected");
});

// 🔥 Initialize Redis (safe) — IMPORTANT: call this in server.js BEFORE starting server
export const initializeRedis = async () => {
  try {
    if (!redisClient.isOpen) {
      await redisClient.connect();
      console.log("✅ Redis client initialized");
    }
    if (!redisPool.isOpen) {
      await redisPool.connect();
      console.log("✅ Redis pool initialized");
    }
  } catch (err) {
    console.error("❌ Redis initialization failed:", err.message);
    throw err; // 🔥 Re-throw so server startup fails gracefully
  }
};

// 🔥 Get Redis instance (with fallback)
export const getRedisClient = () => {
  if (redisPool.isOpen) return redisPool;
  if (redisClient.isOpen) return redisClient;
  throw new Error("Redis is not connected");
};

// 🔥 Close Redis safely
export const closeRedis = async () => {
  try {
    if (redisPool.isOpen) {
      await redisPool.close();
      console.log("[Redis] Pool closed");
    }
    if (redisClient.isOpen) {
      await redisClient.quit();
      console.log("[Redis] Client closed");
    }
  } catch (err) {
    console.error("[Redis] Close error:", err.message);
  }
};

export const isRedisAvailable = () =>
  redisPool.isOpen || redisClient.isOpen;