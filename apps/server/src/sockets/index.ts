import { Server } from "socket.io";
import { Server as HTTPServer } from "http";
import cookie from "cookie";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import { registerChatHandlers } from "./chat";
import { registerSearchHandlers } from "./search";

const prisma = new PrismaClient();

export const initSocket = (server: HTTPServer) => {
  const io = new Server(server, {
    cors: {
      origin: ["http://localhost:3000", "https://slyme.dotbillu.in"],
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      let userId: string | null = null;

      const rawCookie = socket.request.headers.cookie;
      if (rawCookie) {
        const cookies = cookie.parse(rawCookie);
        const token = cookies.token;
        if (token) {
          const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET as string,
          ) as { id: string };
          userId = decoded.id;
        }
      }

      if (!userId) {
        userId = socket.handshake.auth?.userId || null;
      }

      if (userId) {
        socket.data.userId = userId;
        // Fetch user info for presence/typing
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { username: true, avatarUrl: true },
        });
        if (user) {
          socket.data.username = user.username;
          socket.data.avatarUrl = user.avatarUrl;
        }
      }

      next();
    } catch {
      const authUserId = socket.handshake.auth?.userId;
      if (authUserId) {
        socket.data.userId = authUserId;
        // Also fetch user info in fallback path
        try {
          const user = await prisma.user.findUnique({
            where: { id: authUserId },
            select: { username: true, avatarUrl: true },
          });
          if (user) {
            socket.data.username = user.username;
            socket.data.avatarUrl = user.avatarUrl;
          }
        } catch {}
      }
      next();
    }
  });

  io.on("connection", (socket) => {
    registerChatHandlers(io, socket);
    registerSearchHandlers(io, socket);
  });

  return io;
};
