import { Router } from "express";
import type { Router as ExpressRouter } from "express";
const router: ExpressRouter = Router();
import "dotenv/config";
import { verifyGoogleToken } from "../../../middlewares/auth/oauth";
import {
  createUserByCredentials,
  createUserOauth,
  generateToken,
  getUserbyEmail,
} from "../../../services/auth/services";
import { User } from "../../../generated/prisma/client";

router.post("/oauth", verifyGoogleToken, async (req, res) => {
  const payload = (req as any).googlePayload;

  let user: User | null = await getUserbyEmail(payload.email);
  if (user)
    return res.status(403).json({ error: "User already Exists ,Pls login" });
  user = await createUserOauth(payload);
  const appToken = generateToken(user);
  res.cookie("token", appToken, {
    httpOnly: true,
    secure: false, // true in prod
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return res.json({ message: "Auth success", user });
});

router.post("/credentials", async (req, res) => {
  const { name, username, password, email } = req.body;
  const isValidUsername = /^[a-zA-Z0-9_]+$/.test(username);
  if (!isValidUsername) {
    return res
      .status(400)
      .json({ error: "invalid username,dont use special charecters" });
  }
  console.log("EMAIL:", email);
  let user = await getUserbyEmail(email);
  if (user) {
    return res.status(403).json({ error: "username already exists" });
  }
  user = await createUserByCredentials({ name, username, password, email });
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
