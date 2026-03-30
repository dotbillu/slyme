import { Router } from "express";
import type { Router as ExpressRouter } from "express";
import { OAuth2Client } from "google-auth-library";
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
import jwt from "jsonwebtoken";
const router: ExpressRouter = Router();
import "dotenv/config";
import { verifyGoogleToken } from "../../../middlewares/auth/oauth";
import { createUserOauth, getUserOauth } from "../../../services/auth/services";
import { User } from "../../../generated/prisma/client";

router.post("/oauth", verifyGoogleToken, async (req, res) => {
  const payload = (req as any).googlePayload;

  let user: User | null = await getUserOauth(payload);
  if (user)
    return res.status(403).json({ error: "User already Exists ,Pls login" });
  user = await createUserOauth(payload);
  const appToken = jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET as string,
    {
      expiresIn: "7d",
    },
  );

  return res.json({ message: "Auth success", user, token: appToken });
});

export default router;
