import http from "http";
import app from "./app.js";
import { sequelize } from "./config/connectdb.js";
import "./models/index.js";
import { initSocket } from "./config/socket.js";
import "./events/notification.handlers.js";

const PORT = Number(process.env.PORT);
const ENV = process.env.NODE_ENV || "development";
const MAX_PORT_RETRIES = 10;

// ─── Sequelize sync strategy ──────────────────────────────────────────────────
// development  → alter: true   (auto-patch columns, safe for iteration)
// production   → never sync    (use migrations only — never alter a live DB)
const SYNC_OPTIONS = ENV === "development" ? { alter: true } : null;

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

    // 5. Start listening (auto-fallback if the requested port is busy)
    let currentPort = PORT;
    let retryCount = 0;

    const listen = () => {
      server.listen(currentPort, "0.0.0.0", () => {
        console.log(`✅ Server running on port ${currentPort} [${ENV}]`);
      });
    };

    server.on("error", (err) => {
      if (err?.code === "EADDRINUSE" && retryCount < MAX_PORT_RETRIES) {
        retryCount += 1;
        currentPort += 1;
        console.warn(
          `⚠️ Port in use, retrying on ${currentPort} (${retryCount}/${MAX_PORT_RETRIES})`,
        );
        setTimeout(listen, 150);
        return;
      }

      console.error("❌ HTTP server error:", err?.message || err);
      process.exit(1);
    });

    listen();

    // 6. Graceful shutdown ────────────────────────────────────────────────────
    const shutdown = async (signal) => {
      console.log(`\n⚠️  ${signal} received — shutting down gracefully...`);

      // Stop accepting new connections
      server.close(async () => {
        try {
          await sequelize.close();
          console.log("✅ DB connection closed");
          console.log("👋 Server shut down cleanly");
          process.exit(0);
        } catch (err) {
          console.error("❌ Error during shutdown:", err.message);
          process.exit(1);
        }
      });

      // Force-kill after 10 s if something hangs
      setTimeout(() => {
        console.error("⚠️  Forced shutdown after timeout");
        process.exit(1);
      }, 10_000);
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