import http from "http";
import app from "./app.js";
import { sequelize } from "./config/connectdb.js";
import "./models/index.js";
import { closeIO, initSocket } from "./config/socket.js";
import "./events/notification.handlers.js";

const PORT = Number(process.env.PORT);
const ENV = process.env.NODE_ENV || "development";
const MAX_PORT_RETRIES = 10;

// ─── Sequelize sync strategy ──────────────────────────────────────────────────
// development  → alter (without drops) to avoid accidental column loss
// production   → never sync    (use migrations only — never alter a live DB)
const SYNC_OPTIONS = ENV === "development" ? { alter: { drop: false } } : null;

// ─── Boot ─────────────────────────────────────────────────────────────────────
async function startServer() {
  try {
    // 1. Verify DB connection
    await sequelize.authenticate();
    console.log("✅ Supabase connected successfully!");

    // 2. Sync models (dev only)
    if (SYNC_OPTIONS) {
      await sequelize.sync(SYNC_OPTIONS);
      console.log("✅ Models synced (development)");
    }

    // 3. Wrap Express in a raw HTTP server so Socket.IO can share the port
    const server = http.createServer(app);

    // 4. Attach Socket.IO (JWT auth + user rooms — see config/socket.js)
    initSocket(server);
    console.log("✅ Socket.IO initialised");

    // 5. Start listening
    server.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT} [${ENV}]`);
    });

    listen();

    // 6. Graceful shutdown ────────────────────────────────────────────────────
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
        clearTimeout(forceTimer);
        console.log("✅ DB connection closed");
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