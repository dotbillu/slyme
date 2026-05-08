import { Server, Socket } from "socket.io"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function getUnseenCount(userId: string): Promise<number> {
  return prisma.groupMessage.count({
    where: {
      room: {
        members: { some: { id: userId } },
      },
      senderId: { not: userId },
      seenBy: { none: { userId } },
    },
  })
}

export const registerChatHandlers = (io: Server, socket: Socket) => {
  const userId = socket.data.userId
  let unseenInterval: NodeJS.Timeout | null = null

  // Start pushing unseen count every 10 seconds
  if (userId) {
    const pushUnseenCount = async () => {
      try {
        const count = await getUnseenCount(userId)
        socket.emit("unseen_count", { count })
      } catch {}
    }

    pushUnseenCount()
    console.log("sending count")
    // unseenInterval = setInterval(pushUnseenCount, 10000)
  }

  // Client can also request it on demand
  socket.on("get_unseen_count", async () => {
    if (!userId) return
    try {
      const count = await getUnseenCount(userId)
      socket.emit("unseen_count", { count })
    } catch {}
  })

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

    // Push updated unseen count to all OTHER members in the room
    const room = await prisma.mapRoom.findUnique({
      where: { id: roomId },
      select: { members: { select: { id: true } } },
    })

    if (room) {
      for (const member of room.members) {
        if (member.id === userId) continue
        const count = await getUnseenCount(member.id)
        // Emit to all sockets of this user
        const sockets = await io.fetchSockets()
        for (const s of sockets) {
          if (s.data.userId === member.id) {
            s.emit("unseen_count", { count })
          }
        }
      }
    }
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

      // Push updated unseen count
      const count = await getUnseenCount(userId)
      socket.emit("unseen_count", { count })
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

  socket.on("disconnect", () => {
    if (unseenInterval) {
      clearInterval(unseenInterval)
      unseenInterval = null
    }
  })
}
