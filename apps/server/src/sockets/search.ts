import { Server, Socket } from "socket.io"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export const registerSearchHandlers = (io: Server, socket: Socket) => {
  socket.on("search", async ({ query }: { query: string }) => {
    if (!query || typeof query !== "string") {
      socket.emit("search_results", { query, users: [], rooms: [], gigs: [] })
      return
    }

    const q = query.trim()
    if (q.length === 0) {
      socket.emit("search_results", { query, users: [], rooms: [], gigs: [] })
      return
    }

    try {
      const mode = "insensitive" as const

      const users = await prisma.user.findMany({
        where: {
          OR: [
            { username: { contains: q, mode } },
            { name: { contains: q, mode } },
            { bio: { contains: q, mode } },
          ],
        },
        select: {
          id: true,
          username: true,
          name: true,
          avatarUrl: true,
          bio: true,
        },
        take: 10,
      })

      const rooms = await prisma.mapRoom.findMany({
        where: {
          OR: [
            { name: { contains: q, mode } },
            { description: { contains: q, mode } },
            { type: { contains: q, mode } },
          ],
        },
        include: {
          createdBy: {
            select: {
              id: true,
              username: true,
              name: true,
              avatarUrl: true,
            },
          },
          _count: {
            select: { members: true },
          },
        },
        take: 10,
      })

      const gigs = await prisma.gig.findMany({
        where: {
          OR: [
            { title: { contains: q, mode } },
            { description: { contains: q, mode } },
            { type: { contains: q, mode } },
            { reward: { contains: q, mode } },
          ],
        },
        include: {
          createdBy: {
            select: {
              id: true,
              username: true,
              name: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      })

      socket.emit("search_results", { query, users, rooms, gigs })
    } catch {
      socket.emit("search_results", { query, users: [], rooms: [], gigs: [] })
    }
  })
}
