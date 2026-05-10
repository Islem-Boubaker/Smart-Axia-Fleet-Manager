import http from "http";
import app from "./app.js";
import { closeRedis, sequelize, initializeRedis } from "./config/connectdb.js";
import "./models/index.js";
import { closeIO, initSocket } from "./config/socket.js";
import "./events/notification.handlers.js";

const REQUIRED_ENV = [
  'DATABASE_URL',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'REDIS_URL',
];
const missing = REQUIRED_ENV.filter((k) => !process.env[k]);
if (missing.length > 0) {
  console.error(`❌ Missing required environment variables: ${missing.join(', ')}`);
  process.exit(1);
}






const PORT = Number(process.env.PORT) || 8080;
const ENV = process.env.NODE_ENV || "development";
const MAX_PORT_RETRIES = 10;

// ─── Sequelize sync strategy ──────────────────────────────────────────────────
const SYNC_OPTIONS = ENV === "development" ? { alter: { drop: false } } : null;

const listenWithFallback = (server, startPort, maxAttempts = 10) =>
  new Promise((resolve, reject) => {
    const numericStartPort = Number.parseInt(String(startPort), 10);

    if (!Number.isInteger(numericStartPort) || numericStartPort < 1 || numericStartPort > 65535) {
      reject(new Error(`Invalid PORT value: ${startPort}`));
      return;
    }

    const tryListen = (port, attemptsLeft) => {
      const onError = (err) => {
        server.removeListener("listening", onListening);

        if (err?.code === "EADDRINUSE" && attemptsLeft > 0) {
          const nextPort = port + 1;
          console.warn(`⚠️  Port ${port} is in use, retrying on ${nextPort}...`);
          tryListen(nextPort, attemptsLeft - 1);
          return;
        }

        reject(err);
      };

      const onListening = () => {
        server.removeListener("error", onError);
        resolve(port);
      };

      server.once("error", onError);
      server.once("listening", onListening);
      server.listen(port);
    };

    tryListen(numericStartPort, maxAttempts);
  });

// ─── Boot ─────────────────────────────────────────────────────────────────────
async function startServer() {
  let server; // Track server for graceful shutdown

  try {
    // 1. Initialize Redis FIRST (before any requests can come in)
    await initializeRedis();
    console.log("✅ Redis initialized");

    // 2. Verify DB connection
    await sequelize.authenticate();
    console.log("✅ Supabase connected successfully!");

    // 3. Sync models (dev only)
    if (SYNC_OPTIONS) {
      await sequelize.sync(SYNC_OPTIONS);
      console.log("✅ Models synced (development)");
    }

    // 4. Wrap Express in a raw HTTP server so Socket.IO can share the port
    server = http.createServer(app);

    // 5. Attach Socket.IO (JWT auth + user rooms — see config/socket.js)
    initSocket(server);
    console.log("✅ Socket.IO initialised");

    // 6. Start listening
    const activePort = await listenWithFallback(server, PORT);
    console.log(`✅ Server running on port ${activePort} [${ENV}]`);

    // 7. Graceful shutdown ────────────────────────────────────────────────────
    let isShuttingDown = false;

    const shutdown = async (signal) => {
      if (isShuttingDown) return;
      isShuttingDown = true;

      console.log(`\n⚠️  ${signal} received — shutting down gracefully...`);

      const forceTimer = setTimeout(() => {
        console.error("⚠️  Forced shutdown after timeout");
        if (typeof server.closeAllConnections === "function") {
          server.closeAllConnections();
        }
        process.exit(1);
      }, 10_000);

      try {
        // Close Socket.IO first so long-lived websocket connections do not block HTTP server close.
        await closeIO();

        await new Promise((resolve, reject) => {
          server.close((err) => {
            if (err) {
              if (String(err.message || '').includes('Server is not running')) {
                return resolve();
              }
              return reject(err);
            }
            return resolve();
          });
        });

        await sequelize.close();
        await closeRedis();
        clearTimeout(forceTimer);
        console.log("✅ DB connection closed");
        console.log("✅ Redis connection closed");
        console.log("👋 Server shut down cleanly");
        process.exit(0);
      } catch (err) {
        clearTimeout(forceTimer);
        console.error("❌ Error during shutdown:", err.message);
        process.exit(1);
      }
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));

  } catch (error) {
    console.error("❌ Unable to start server:", error.message);
    if (server) server.close();
    process.exit(1);
  }
}

// ─── Unhandled rejection safety net ──────────────────────────────────────────
process.on("unhandledRejection", (reason) => {
  console.error("❌ Unhandled rejection:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("❌ Uncaught exception:", err.message);
  process.exit(1);
});

startServer();