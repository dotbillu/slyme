import { Server } from "socket.io";
import { Server as HTTPServer } from "http";
import cookie from "cookie";
import jwt from "jsonwebtoken";
import { registerChatHandlers } from "./chat";
import { registerSearchHandlers } from "./search";

export const initSocket = (server: HTTPServer) => {
  const io = new Server(server, {
    cors: {
      origin: ["http://localhost:3000", "https://slymev2-web.vercel.app"],
      credentials: true,
    },
  });

  io.use((socket, next) => {
    try {
      const rawCookie = socket.request.headers.cookie;
      if (rawCookie) {
        const cookies = cookie.parse(rawCookie);
        const token = cookies.token;
        if (token) {
          const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET as string,
          ) as {
            id: string;
          };
          socket.data.userId = decoded.id;
          return next();
        }
      }

      const authUserId = socket.handshake.auth?.userId;
      if (authUserId) {
        socket.data.userId = authUserId;
      }

      next();
    } catch {
      const authUserId = socket.handshake.auth?.userId;
      if (authUserId) {
        socket.data.userId = authUserId;
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
