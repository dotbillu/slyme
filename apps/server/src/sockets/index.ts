import { Server } from "socket.io"
import { Server as HTTPServer } from "http"
import cookieParser from "cookie-parser"
import { requireAuth } from "../middlewares/auth/jwt"
import { registerChatHandlers } from "./chat"

export const initSocket = (server: HTTPServer) => {
  const io = new Server(server, {
    cors: {
      origin: "http://localhost:3000",
      credentials: true,
    },
  })

  io.use((socket, next) => {
    const req = socket.request as any
    const res = { clearCookie: () => res, status: () => res, json: () => res } as any

    cookieParser()(req, res, (err?: any) => {
      if (err) return next(new Error("Cookie parse error"))

      requireAuth(req, res, (err?: any) => {
        if (err) return next(new Error("Not authenticated"))

        socket.data.userId = req.userId
        next()
      })
    })
  })

  io.on("connection", (socket) => {
    registerChatHandlers(io, socket)
  })

  return io
}

