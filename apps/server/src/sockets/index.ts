import { Server } from "socket.io"
import { Server as HTTPServer } from "http"
import cookie from "cookie"
import jwt from "jsonwebtoken"
import { registerChatHandlers } from "./chat"

export const initSocket = (server: HTTPServer) => {
  const io = new Server(server, {
    cors: {
      origin: "http://localhost:3000",
      credentials: true,
    },
  })

  io.use((socket, next) => {
    try {
      // Try to extract userId from cookie if available
      const rawCookie = socket.request.headers.cookie
      if (rawCookie) {
        const cookies = cookie.parse(rawCookie)
        const token = cookies.token
        if (token) {
          const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
            id: string
          }
          socket.data.userId = decoded.id
          return next()
        }
      }

      // Fallback: accept connection without auth (for dev)
      // userId can be passed via handshake auth
      const authUserId = socket.handshake.auth?.userId
      if (authUserId) {
        socket.data.userId = authUserId
      }

      next()
    } catch {
      // Still allow connection in dev, just without userId from cookie
      const authUserId = socket.handshake.auth?.userId
      if (authUserId) {
        socket.data.userId = authUserId
      }
      next()
    }
  })

  io.on("connection", (socket) => {
    registerChatHandlers(io, socket)
  })

  return io
}
