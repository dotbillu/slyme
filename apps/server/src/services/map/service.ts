import { prisma } from "../../lib/prisma";

export async function createGig(data: {
  userId: string;
  title: string;
  description?: string;
  latitude: number;
  longitude: number;
  date?: string;
  reward?: string;
  gigTime?: string;
  expiresAt?: string;
  roomId?: string;
  type?: string;
  imageUrls?: string[];
}) {
  return prisma.gig.create({
    data: {
      title: data.title,
      description: data.description ?? null,
      latitude: Number(data.latitude),
      longitude: Number(data.longitude),
      date: data.date ? new Date(data.date) : null,
      gigTime: data.gigTime ? new Date(data.gigTime) : null,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      reward: data.reward ?? null,
      type: data.type ?? null,
      imageUrls: data.imageUrls ?? [],

      createdBy: {
        connect: { id: data.userId },
      },

      ...(data.roomId
        ? {
            room: {
              connect: { id: data.roomId },
            },
          }
        : {}),
    },
  });
}

export async function getGigs(skip = 0, take = 10) {
  return prisma.gig.findMany({
    skip,
    take,
    orderBy: {
      createdAt: "desc",
    },
    include: {
      createdBy: true,
    },
  });
}

export async function updateGig(
  gigId: string,
  userId: string,
  data: Partial<{
    title: string;
    description: string;
    latitude: number;
    longitude: number;
    date: string;
    reward: string;
    gigTime: string;
    expiresAt: string;
    type: string;
    imageUrls: string[];
  }>,
) {
  const gig = await prisma.gig.findUnique({
    where: { id: gigId },
  });

  if (!gig) throw new Error("Gig not found");
  if (gig.creatorId !== userId) throw new Error("Unauthorized");

  return prisma.gig.update({
    where: { id: gigId },
    data: {
      ...data,
      latitude: data.latitude ? Number(data.latitude) : undefined,
      longitude: data.longitude ? Number(data.longitude) : undefined,
      date: data.date ? new Date(data.date) : undefined,
      gigTime: data.gigTime ? new Date(data.gigTime) : undefined,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
    },
  });
}
export async function getGigById(gigId: string) {
  return prisma.gig.findUnique({
    where: { id: gigId },
    include: {
      createdBy: true,
      room: true,
    },
  });
}
export async function deleteGig(gigId: string, userId: string) {
  const gig = await prisma.gig.findUnique({
    where: { id: gigId },
  });

  if (!gig) throw new Error("Gig not found");
  if (gig.creatorId !== userId) throw new Error("Unauthorized");

  return prisma.gig.delete({
    where: { id: gigId },
  });
}



export async function createRoom(data: {
  userId: string
  name: string
  description?: string
  latitude: number
  longitude: number
  type?: string
  imageUrl?: string
}) {
  return prisma.mapRoom.create({
    data: {
      name: data.name,
      description: data.description,
      latitude: data.latitude,
      longitude: data.longitude,
      type: data.type,
      imageUrl: data.imageUrl,
      creatorId: data.userId,
      members: {
        connect: { id: data.userId },
      },
    },
    include: {
      members: true,
      createdBy: true,
    },
  })
}

export async function getUserRooms(userId: string) {
  return prisma.mapRoom.findMany({
    where: {
      members: {
        some: { id: userId },
      },
    },
    include: {
      createdBy: true,
      members: true,
    },
    orderBy: { createdAt: "desc" },
  })
}

export async function updateRoom(
  roomId: string,
  userId: string,
  data: any,
) {
  const room = await prisma.mapRoom.findUnique({
    where: { id: roomId },
  })

  if (!room || room.creatorId !== userId) {
    throw new Error("Not allowed")
  }

  return prisma.mapRoom.update({
    where: { id: roomId },
    data,
  })
}

export async function deleteRoom(roomId: string, userId: string) {
  const room = await prisma.mapRoom.findUnique({
    where: { id: roomId },
  })

  if (!room || room.creatorId !== userId) {
    throw new Error("Not allowed")
  }

  return prisma.mapRoom.delete({
    where: { id: roomId },
  })
}

export async function joinRoom(roomId: string, userId: string) {
  return prisma.mapRoom.update({
    where: { id: roomId },
    data: {
      members: {
        connect: { id: userId },
      },
    },
    include: {
      members: true,
      createdBy: true,
    },
  })
}

export async function getAllRooms() {
  return prisma.mapRoom.findMany({
    include: {
      createdBy: true,
      members: true,
      _count: {
        select: { members: true },
      },
    },
    orderBy: { createdAt: "desc" },
  })
}

export async function getRoomById(roomId: string) {
  return prisma.mapRoom.findUnique({
    where: { id: roomId },
    include: {
      createdBy: true,
      members: true,
      groupMessages: {
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
      },
    },
  })
}

export async function getRoomMessages(roomId: string, skip = 0, take = 50) {
  return prisma.groupMessage.findMany({
    where: { roomId },
    orderBy: { createdAt: "asc" },
    skip,
    take,
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
}
