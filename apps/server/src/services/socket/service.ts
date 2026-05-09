import { prisma } from "../../lib/prisma";

export async function getUnseenCount(userId: string): Promise<number> {
  return prisma.groupMessage.count({
    where: {
      room: {
        members: { some: { id: userId } },
      },
      senderId: { not: userId },
      seenBy: { none: { userId } },
    },
  });
}
