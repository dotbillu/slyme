import { Router } from "express";
import signInRoutes from "./signin/index";
import signUpRoutes from "./signup/index";

import type { Router as ExpressRouter } from "express";
import { requireAuth } from "../../middlewares/auth/jwt";
import { prisma } from "../../lib/prisma";

const router: ExpressRouter = Router();

router.use("/signin", signInRoutes);
router.use("/signup", signUpRoutes);

router.get("/me", requireAuth, async (req, res) => {
  const userId = (req as any).userId;

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  return res.json(user);
});

export default router;
