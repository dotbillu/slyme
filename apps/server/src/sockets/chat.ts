import { Server, Socket } from "socket.io"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export const registerChatHandlers = (io: Server, socket: Socket) => {
  const userId = socket.data.userId

  socket.on("join_room", async (roomId: string) => {
    if (!roomId) return

    socket.join(roomId)

    // Load latest 50 messages (desc then reverse for correct order)
    const messages = await prisma.groupMessage.findMany({
      where: { roomId },
      orderBy: { createdAt: "desc" },
      take: 50,
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

    socket.emit("room_messages", { roomId, messages: messages.reverse() })
  })

  socket.on("leave_room", (roomId: string) => {
    if (!roomId) return
    socket.leave(roomId)
  })

  socket.on("send_message", async ({ roomId, content }) => {
    if (!roomId || !content || !userId) return

    const message = await prisma.groupMessage.create({
      data: {
        content,
        roomId,
        senderId: userId,
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

  socket.on("mark_seen", async ({ roomId }) => {
    if (!roomId || !userId) return

    try {
      const unseenMessages = await prisma.groupMessage.findMany({
        where: {
          roomId,
          senderId: { not: userId },
          seenBy: { none: { userId } },
        },
        select: { id: true },
      })

      if (unseenMessages.length > 0) {
        await prisma.messageSeen.createMany({
          data: unseenMessages.map((msg) => ({
            userId,
            messageId: msg.id,
          })),
          skipDuplicates: true,
        })
      }

      socket.emit("messages_marked_seen", { roomId })
    } catch {}
  })

  socket.on("typing", ({ roomId }) => {
    if (!roomId || !userId) return
    socket.to(roomId).emit("user_typing", { roomId, userId })
  })

  socket.on("stop_typing", ({ roomId }) => {
    if (!roomId || !userId) return
    socket.to(roomId).emit("user_stop_typing", { roomId, userId })
  })
}
