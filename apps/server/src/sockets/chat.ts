import { Server, Socket } from "socket.io"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export const registerChatHandlers = (io: Server, socket: Socket) => {
  socket.on("join_room", async (roomId: string) => {
    if (!roomId) return

    socket.join(roomId)
  })

  socket.on("send_message", async ({ roomId, content, senderId }) => {
    if (!roomId || !content || !senderId) return

    const message = await prisma.groupMessage.create({
      data: {
        content,
        roomId,
        senderId,
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
      },
    })

    io.to(roomId).emit("receive_message", message)
  })
}
