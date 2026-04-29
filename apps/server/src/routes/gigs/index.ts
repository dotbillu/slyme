import { Router } from "express";
import { requireAuth } from "../../middlewares/auth/jwt";
import {
  createGig,
  updateGig,
  deleteGig,
  getGigById,
  getGigs,
} from "../../services/map/service";

const router = Router();

router.post("/", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;

    const gig = await createGig({ userId, ...req.body });

    return res.status(201).json(gig);
  } catch (err) {
    return res.status(500).json({ error: "create failed" });
  }
});

router.patch("/:id", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const gigId = req.params.id as string;

    const gig = await updateGig(gigId, userId, req.body);

    return res.json(gig);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const gigId = req.params.id as string;

    await deleteGig(gigId, userId);

    return res.json({ message: "deleted" });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const gigId = req.params.id as string;

    const gig = await getGigById(gigId);
    return res.json(gig);
  } catch {
    return res.status(404).json({ error: "not found" });
  }
});

router.get("/", async (req, res) => {
  try {
    const skip =
      typeof req.query.skip === "string" ? Number(req.query.skip) : 0;
    const take =
      typeof req.query.take === "string" ? Number(req.query.take) : 10;
    const gigs = await getGigs(skip, take);

    return res.json(gigs);
  } catch {
    return res.status(500).json({ error: "failed to fetch" });
  }
});

export default router;
