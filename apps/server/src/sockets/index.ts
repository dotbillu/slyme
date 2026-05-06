import { Server } from "socket.io"
import { Server as HTTPServer } from "http"
import { registerChatHandlers } from "./chat"

export const initSocket = (server: HTTPServer) => {
  const io = new Server(server, {
    cors: {
      origin: "http://localhost:3000",
      credentials: true,
    },
  })

  io.on("connection", (socket) => {
    registerChatHandlers(io, socket)
  })

  return io
}
