import { Server, Socket } from "socket.io";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const registerChatHandlers = (io: Server, socket: Socket) => {
  const userId = socket.data.userId;

  socket.on("join_room", async (roomId: string) => {
    if (!roomId) return;

    socket.join(roomId);

    // Send recent messages to the user who just joined
    const messages = await prisma.groupMessage.findMany({
      where: { roomId },
      orderBy: { createdAt: "asc" },
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
    });

    socket.emit("room_messages", { roomId, messages });
  });

  socket.on("leave_room", (roomId: string) => {
    if (!roomId) return;
    socket.leave(roomId);
  });

  socket.on("send_message", async ({ roomId, content }) => {
    if (!roomId || !content || !userId) return;

    const tempId = crypto.randomUUID();

    const optimisticMessage = {
      id: tempId,
      content,
      roomId,
      senderId: userId,
      createdAt: new Date().toISOString(),
      sender: socket.data.user,
      pending: true,
    };

    io.to(roomId).emit("receive_message", optimisticMessage);

    prisma.groupMessage
      .create({
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
      .then((dbMessage) => {
        io.to(roomId).emit("message_confirmed", {
          tempId,
          message: dbMessage,
        });
      })
      .catch(() => {
        io.to(roomId).emit("message_failed", { tempId });
      });
  });
  socket.on("typing", ({ roomId }) => {
    if (!roomId || !userId) return;
    socket.to(roomId).emit("user_typing", { roomId, userId });
  });

  socket.on("stop_typing", ({ roomId }) => {
    if (!roomId || !userId) return;
    socket.to(roomId).emit("user_stop_typing", { roomId, userId });
  });
};
