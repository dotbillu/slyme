import { Router } from "express"
import { requireAuth } from "../../middlewares/auth/jwt"
import {
  createRoom,
  getUserRooms,
  updateRoom,
  deleteRoom,
  joinRoom,
} from "../../services/map/service"

const router = Router()

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
    const roomId = req.params.id

    const room = await updateRoom(roomId, userId, req.body)

    return res.json(room)
  } catch (err: any) {
    return res.status(400).json({ error: err.message })
  }
})

router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId
    const roomId = req.params.id

    await deleteRoom(roomId, userId)

    return res.json({ message: "deleted" })
  } catch (err: any) {
    return res.status(400).json({ error: err.message })
  }
})

router.post("/:id/join", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId
    const roomId = req.params.id

    const room = await joinRoom(roomId, userId)

    return res.json(room)
  } catch {
    return res.status(400).json({ error: "join failed" })
  }
})

export default router
