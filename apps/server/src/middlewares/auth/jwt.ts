import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { cookieOptions } from "../../lib/cookie";

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies.token;

  if (!token) {
    res.clearCookie("token", cookieOptions);
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
      id: string;
    };

    (req as any).userId = decoded.id;
    next();
  } catch {
    res.clearCookie("token", cookieOptions);
    return res.status(401).json({ error: "Invalid token" });
  }
}
