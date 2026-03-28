import { Server } from "socket.io";
import { verifyAccessToken } from "../utils/jwt.js";
import NotificationService from "../services/notification.service.js";

let io = null;

function parseCookies(rawCookie = "") {
  if (!rawCookie) return {};

  return rawCookie.split(";").reduce((acc, pair) => {
    const [rawKey, ...rawValue] = pair.split("=");
    if (!rawKey || rawValue.length === 0) return acc;

    const key = rawKey.trim();
    const value = rawValue.join("=").trim();
    acc[key] = decodeURIComponent(value);
    return acc;
  }, {});
}

function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN?.split(",") ?? "*",
      methods: ["GET", "POST"],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
    transports: ["websocket", "polling"],
  });

  io.use(async (socket, next) => {
    try {
      const cookies = parseCookies(socket.handshake.headers?.cookie ?? "");
      const token =
        socket.handshake.auth?.token ??
        socket.handshake.headers?.authorization?.replace("Bearer ", "") ??
        cookies.accessToken;

      if (!token) {
        return next(new Error("Authentication required"));
      }

      const decoded = verifyAccessToken(token);
      if (!decoded?.id) {
        return next(new Error("Invalid token"));
      }

      socket.userId = decoded.id;
      socket.userRole = decoded.role ?? "DRIVER";
      return next();
    } catch {
      return next(new Error("Authentication failed"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.userId;
    socket.join(`user:${userId}`);

    socket.on("notification:get_count", async () => {
      try {
        const count = await NotificationService.getUnreadCount(userId);
        socket.emit("notification:count", { count });
      } catch {
        socket.emit("error", { message: "Failed to get count" });
      }
    });

    socket.on("notification:mark_read", async ({ notificationId } = {}) => {
      try {
        if (!notificationId) return;
        await NotificationService.markAsRead(notificationId, userId);
      } catch {
        socket.emit("error", { message: "Failed to mark as read" });
      }
    });

    socket.on("notification:mark_all_read", async ({ group } = {}) => {
      try {
        await NotificationService.markAllAsRead(userId, group ?? null);
      } catch {
        socket.emit("error", { message: "Failed to mark all as read" });
      }
    });
  });

  return io;
}

function getIO() {
  if (!io) {
    throw new Error("Socket.IO not initialised. Call initSocket(server) first.");
  }
  return io;
}

export { initSocket, getIO };
