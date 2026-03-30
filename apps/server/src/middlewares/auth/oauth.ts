import { Request, Response, NextFunction } from "express";
import { OAuth2Client } from "google-auth-library";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const verifyGoogleToken = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: "Token missing" });

  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    if (!payload || payload.aud !== process.env.GOOGLE_CLIENT_ID) {
      return res.status(401).json({ error: "unauthorized/invalid token" });
    }

    (req as any).googlePayload = payload;
    next();
  } catch (err) {
    console.error(err);
    return res.status(401).json({ error: "Token verification failed" });
  }
};
