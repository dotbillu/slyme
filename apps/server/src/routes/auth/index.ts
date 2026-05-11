import { Router } from "express";
import signInRoutes from "./signin/index";
import signUpRoutes from "./signup/index";
import recoverRoutes from "./recover/index";

import type { Router as ExpressRouter } from "express";

import { requireAuth } from "../../middlewares/auth/jwt";
import { prisma } from "../../lib/prisma";
import { cookieOptions } from "../../lib/cookie";

import jwt from "jsonwebtoken";
import { userSelect } from "../../lib/user.dto";
const router: ExpressRouter = Router();

router.use("/signin", signInRoutes);
router.use("/signup", signUpRoutes);
router.use("/recover", recoverRoutes);
router.post("/signout", (req, res) => {
  res.clearCookie("token", cookieOptions);
  res.json({ message: "Signed out" });
});

router.get("/me", requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  const token = req.cookies.token;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: userSelect,
  });

  if (!user) {
    res.clearCookie("token", cookieOptions);
    return res.status(401).json({ error: "User not found" });
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET as string, {
    ignoreExpiration: true,
  }) as any;

  const iat = decoded.iat * 1000;
  const now = Date.now();

  const ONE_DAY = 24 * 60 * 60 * 1000;

  if (now - iat > ONE_DAY) {
    const newToken = jwt.sign(
      { id: userId },
      process.env.JWT_SECRET as string,
      { expiresIn: "7d" },
    );

    res.cookie("token", newToken, cookieOptions);
  }

  return res.json(user);
});
export default router;
