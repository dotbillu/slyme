import { Server, Socket } from "socket.io";
import { PrismaClient } from "@prisma/client";
import { getUnseenCount } from "../services/socket/service";

const prisma = new PrismaClient();


export const registerChatHandlers = (io: Server, socket: Socket) => {
  const userId = socket.data.userId;
  let unseenInterval: NodeJS.Timeout | null = null;

  socket.on("get_unseen_count", async () => {
    if (!userId) return;
    try {
      const count = await getUnseenCount(userId);
      socket.emit("unseen_count", { count });
    } catch {}
  });

  socket.on("join_room", async (roomId: string) => {
    if (!roomId) return;

    socket.join(roomId);

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
    });

    socket.emit("room_messages", { roomId, messages: messages.reverse() });
  });

  socket.on("leave_room", (roomId: string) => {
    if (!roomId) return;
    socket.leave(roomId);
  });

  socket.on("send_message", async ({ roomId, content }) => {
    if (!roomId || !content || !userId) return;
    const messageId = crypto.randomUUID();

    const messagePayload = {
      id: messageId,
      content,
      roomId,
      senderId: userId,
      createdAt: new Date(),
      sender: {
        id: userId,
        username: socket.data.username,
        avatarUrl: socket.data.avatarUrl,
      },
    };

    io.to(roomId).emit("receive_message", messagePayload);
    try {
      await prisma.groupMessage.create({
        data: {
          id: messageId,
          content,
          roomId,
          senderId: userId,
        },
      });
      const room = await prisma.mapRoom.findUnique({
        where: { id: roomId },
        select: { members: { select: { id: true } } },
      });

      if (room) {
        const allSockets = await io.fetchSockets();
        const recipients = room.members.filter(
          (member) => member.id !== userId,
        );

        await Promise.all(
          recipients.map(async (member) => {
            const count = await getUnseenCount(member.id);

            allSockets
              .filter((s) => s.data.userId === member.id)
              .forEach((s) => s.emit("unseen_count", { count }));
          }),
        );
      }
    } catch (error) {
      console.error("Failed to process message background tasks:", error);
    }
  });

  socket.on("mark_seen", async ({ roomId }) => {
    if (!roomId || !userId) return;

    try {
      const unseenMessages = await prisma.groupMessage.findMany({
        where: {
          roomId,
          senderId: { not: userId },
          seenBy: { none: { userId } },
        },
        select: { id: true },
      });

      if (unseenMessages.length > 0) {
        await prisma.messageSeen.createMany({
          data: unseenMessages.map((msg: { id: string }) => ({
            userId,
            messageId: msg.id,
          })),
          skipDuplicates: true,
        });
      }

      socket.emit("messages_marked_seen", { roomId });

      const count = await getUnseenCount(userId);
      socket.emit("unseen_count", { count });
    } catch {}
  });

  socket.on("typing", ({ roomId }) => {
    if (!roomId || !userId) return;
    socket.to(roomId).emit("user_typing", { roomId, userId });
  });

  socket.on("stop_typing", ({ roomId }) => {
    if (!roomId || !userId) return;
    socket.to(roomId).emit("user_stop_typing", { roomId, userId });
  });

  socket.on("disconnect", () => {
    if (unseenInterval) {
      clearInterval(unseenInterval);
      unseenInterval = null;
    }
  });
};
