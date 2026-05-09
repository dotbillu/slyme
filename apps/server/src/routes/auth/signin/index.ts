import { Router } from "express";
import type { Router as ExpressRouter } from "express";
const router: ExpressRouter = Router();
import "dotenv/config";
import { verifyGoogleToken } from "../../../middlewares/auth/oauth";
import { generateToken, getUserbyEmail } from "../../../services/auth/services";
import { validateCredentials } from "../../../middlewares/auth/credentials";
import { cookieOptions } from "../../../lib/cookie";

router.post("/oauth", verifyGoogleToken, async (req, res) => {
  const payload = (req as any).googlePayload;

  const user = await getUserbyEmail(payload.email);
  if (!user)
    return res.status(403).json({ error: "Not registered, try signing up?" });

  const appToken = generateToken(user);
  res.cookie("token", appToken, cookieOptions);

  return res.json({ message: "Auth success", user });
});

router.post("/credentials", validateCredentials, async (req, res) => {
  const user = (req as any).user;
  const appToken = generateToken(user);
  res.cookie("token", appToken, cookieOptions);

  return res.json({ message: "Auth success", user });
});

export default router;
