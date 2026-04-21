import { Sequelize } from "sequelize";
import dotenv from "dotenv";
import { createClient, createClientPool } from "@redis/client";

dotenv.config({ quiet: true });

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

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

const maskRedisUrl = (value) => {
  try {
    const parsed = new URL(value);
    const hasAuth = Boolean(parsed.username || parsed.password);
    const auth = hasAuth ? "***@" : "";
    return `${parsed.protocol}//${auth}${parsed.hostname}:${parsed.port || "6379"}${parsed.pathname || ""}`;
  } catch {
    return "[invalid REDIS_URL]";
  }
};

const formatRedisError = (error) => {
  if (!error) return "Unknown Redis error";

  const pieces = [
    error?.name,
    error?.code,
    error?.message,
    error?.cause?.code,
    error?.cause?.message,
  ].filter(Boolean);

  if (!pieces.length) {
    try {
      return JSON.stringify(error);
    } catch {
      return String(error);
    }
  }

  return pieces.join(" | ");
};

const decodeSafe = (value) => {
  if (!value) return null;
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

const buildRedisOptions = (url) => {
  const parsed = new URL(url);
  const username = decodeSafe(parsed.username);
  const password = decodeSafe(parsed.password);
  const dbSegment = parsed.pathname?.replace("/", "") || "0";
  const db = Number.parseInt(dbSegment, 10);

  const baseOptions = {
    socket: {
      host: parsed.hostname || "localhost",
      port: Number.parseInt(parsed.port || "6379", 10),
      keepAlive: 5000,
      reconnectStrategy: (retries) => {
        if (retries > 20) {
          return new Error("Redis reconnect attempts exceeded");
        }
        return Math.min(retries * 100, 3000);
      },
      tls: parsed.protocol === "rediss:" ? true : undefined,
    },
    database: Number.isInteger(db) ? db : 0,
    commandsQueueMaxLength: 10000,
  };

  if (password) {
    baseOptions.password = password;
  }

  // Keep username for ACL setups, but skip "default" for legacy local Redis.
  if (username && username !== "default") {
    baseOptions.username = username;
  }

  return baseOptions;
};

const redisOptions = buildRedisOptions(redisUrl);

export const redisClient = createClient({
  ...redisOptions,
});

export const redisPool = createClientPool(
  {
    ...redisOptions,
  },
  { minimum: 1, maximum: 20 }
);

let redisReady = false;
let redisConnectPromise = null;

redisClient.on("error", (error) => {
  redisReady = false;
  console.error("[Redis] Client error:", formatRedisError(error));
});

redisClient.on("ready", () => {
  redisReady = true;
  console.log("[Redis] Connected");
});

redisClient.on("end", () => {
  redisReady = false;
  console.log("[Redis] Disconnected");
});

export const initializeRedis = async () => {
  if ((redisClient.isOpen && redisPool.isOpen) || redisReady) {
    return redisPool;
  }

  if (!process.env.REDIS_URL && process.env.NODE_ENV === "production") {
    console.warn("[Redis] REDIS_URL is not set in production. Falling back to localhost, which usually fails on Render.");
  }

  if (!redisConnectPromise) {
    redisConnectPromise = Promise.allSettled([redisClient.connect(), redisPool.connect()])
      .then((results) => {
        const [clientResult, poolResult] = results;

        if (clientResult.status === "rejected") {
          console.error("[Redis] Client connect failed:", formatRedisError(clientResult.reason));
        }

        if (poolResult.status === "rejected") {
          console.error("[Redis] Pool connect failed:", formatRedisError(poolResult.reason));
        }

        if (!redisClient.isOpen && !redisPool.isOpen) {
          throw new Error(
            `No Redis connection available. REDIS_URL=${maskRedisUrl(redisUrl)}`
          );
        }

        if (redisClient.isOpen || redisPool.isOpen) {
          redisReady = true;
          console.log(`[Redis] Connected (${redisPool.isOpen ? "pool" : "client"} mode)`);
        }
      })
      .catch((error) => {
        redisConnectPromise = null;
        console.error("[Redis] Failed to connect:", formatRedisError(error));
        throw error;
      })
      .finally(() => {
        redisConnectPromise = null;
      });
  }

  await redisConnectPromise;
  return redisPool.isOpen ? redisPool : redisClient;
};

export const getRedisClient = () => (redisPool.isOpen ? redisPool : redisClient);

export const isRedisAvailable = () => (redisPool.isOpen || redisClient.isOpen) && redisReady;

export const closeRedis = async () => {
  if (!redisClient.isOpen && !redisPool.isOpen) return;

  if (redisPool.isOpen) {
    try {
      await redisPool.close();
    } catch (error) {
      console.error("[Redis] Pool close failed, forcing destroy:", error.message);
      try {
        await redisPool.destroy();
      } catch (destroyError) {
        console.error("[Redis] Pool destroy failed:", destroyError.message);
      }
    }
  }

  if (!redisClient.isOpen) return;

  try {
    await redisClient.quit();
  } catch (error) {
    console.error("[Redis] Graceful quit failed, forcing close:", error.message);
    try {
      await redisClient.disconnect();
    } catch (disconnectError) {
      console.error("[Redis] Force disconnect failed:", disconnectError.message);
    }
  }
};

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