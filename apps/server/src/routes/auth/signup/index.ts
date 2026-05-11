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
  getUserbyUsername,
} from "../../../services/auth/services";
import { cookieOptions } from "../../../lib/cookie";
import { sendWelcomeEmail } from "../../../services/auth/email/service";

router.post("/credentials", async (req, res) => {
  const { name, username, password, email } = req.body;

  const isValidUsername = /^[a-zA-Z0-9_]+$/.test(username);
  if (!isValidUsername) {
    return res
      .status(400)
      .json({ error: "Invalid username, don't use special characters" });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: "Invalid email address" });
  }

  let user = await getUserbyEmail(email);
  if (user) {
    return res.status(403).json({ error: "Email already exists" });
  }
  user = await createUserByCredentials({ name, username, password, email });
  const appToken = generateToken(user);
  res.cookie("token", appToken, cookieOptions);

  sendWelcomeEmail(user);

  return res.json({ message: "Auth success", user });
});

router.post("/oauth/email-check", verifyGoogleToken, async (req, res) => {
  const payload = (req as any).googlePayload;

  let user = await getUserbyEmail(payload.email);
  if (user) return res.status(403).json({ error: "Email already Exists" });
  return res.json({ message: "Good Email", user });
});
router.post("/oauth/create-user", verifyGoogleToken, async (req, res) => {
  const payload = (req as any).googlePayload;
  const { username } = req.body;
  let user = await getUserbyUsername(username);
  if (user)
    return res
      .status(403)
      .json({ error: "Username already Exists ,Pls login" });
  user = await createUserOauth(payload, username);
  const appToken = generateToken(user);
  res.cookie("token", appToken, cookieOptions);

  sendWelcomeEmail(user);

  return res.json({ message: "Auth success", user });
});
export default router;
