import { Router } from "express";
import type { Router as ExpressRouter } from "express";
import { OAuth2Client } from "google-auth-library";
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const router: ExpressRouter = Router();
import "dotenv/config";
import { verifyGoogleToken } from "../../../middlewares/auth/oauth";
import { generateToken, getUserbyEmail } from "../../../services/auth/services";
import { validateCredentials } from "../../../middlewares/auth/credentials";
import { User } from "@prisma/client";

router.post("/oauth", verifyGoogleToken, async (req, res) => {
  const payload = (req as any).googlePayload;

  const user: User | null = await getUserbyEmail(payload.email);
  if (!user)
    return res.status(403).json({ error: "Not registered pls signUp" });

  const appToken = generateToken(user);
  res.cookie("token", appToken, {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return res.json({ message: "Auth success", user });
});

router.post("/credentials", validateCredentials, async (req, res) => {
  const user = (req as any).user;
  const appToken = generateToken(user);
  res.cookie("token", appToken, {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return res.json({ message: "Auth success", user });
});

export default router;
