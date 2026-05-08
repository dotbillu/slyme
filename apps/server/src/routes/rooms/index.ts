import { Router } from "express"
import { requireAuth } from "../../middlewares/auth/jwt"
import {
  createRoom,
  getUserRooms,
  getAllRooms,
  getRoomById,
  getRoomMessages,
  markMessagesSeen,
  updateRoom,
  deleteRoom,
  joinRoom,
} from "../../services/map/service"

const router = Router()

// Open route - get all rooms (no auth required, for map display)
router.get("/all", async (req, res) => {
  try {
    const rooms = await getAllRooms()
    return res.json(rooms)
  } catch {
    return res.status(500).json({ error: "failed to fetch rooms" })
  }
})

// Get a single room by ID with messages
router.get("/:id", requireAuth, async (req, res) => {
  try {
    const roomId = req.params.id as string
    const room = await getRoomById(roomId)

    if (!room) {
      return res.status(404).json({ error: "room not found" })
    }

    return res.json(room)
  } catch {
    return res.status(500).json({ error: "failed to fetch room" })
  }
})

// Get messages for a room
router.get("/:id/messages", requireAuth, async (req, res) => {
  try {
    const roomId = req.params.id as string
    const skip = typeof req.query.skip === "string" ? Number(req.query.skip) : 0
    const take = typeof req.query.take === "string" ? Number(req.query.take) : 50

    const messages = await getRoomMessages(roomId, skip, take)
    return res.json(messages)
  } catch {
    return res.status(500).json({ error: "failed to fetch messages" })
  }
})

router.post("/", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId

    const room = await createRoom({
      userId,
      ...req.body,
    })

    return res.status(201).json(room)
  } catch {
    return res.status(500).json({ error: "create failed" })
  }
})

router.get("/", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId
    const rooms = await getUserRooms(userId)

    return res.json(rooms)
  } catch {
    return res.status(500).json({ error: "failed to fetch" })
  }
})

router.patch("/:id", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId
    const roomId = req.params.id as string

    const room = await updateRoom(roomId, userId, req.body)

    return res.json(room)
  } catch (err: any) {
    return res.status(400).json({ error: err.message })
  }
})

router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId
    const roomId = req.params.id as string

    await deleteRoom(roomId, userId)

    return res.json({ message: "deleted" })
  } catch (err: any) {
    return res.status(400).json({ error: err.message })
  }
})

router.post("/:id/join", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId
    const roomId = req.params.id as string

    const room = await joinRoom(roomId, userId)

    return res.json(room)
  } catch {
    return res.status(400).json({ error: "join failed" })
  }
})

router.post("/:id/seen", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId
    const roomId = req.params.id as string

    const result = await markMessagesSeen(roomId, userId)

    return res.json(result)
  } catch {
    return res.status(500).json({ error: "failed to mark seen" })
  }
})

export default router
