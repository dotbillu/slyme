import { Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import { prisma } from "../../lib/prisma";
export async function validateCredentials(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const { cred, password } = req.body;

  if (!cred || !password) {
    return res.status(400).json({ error: "Missing credentials" });
  }

  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cred);

  const user = await prisma.user.findUnique({
    where: isEmail ? { email: cred } : { username: cred },
    select: {
      id: true,
      email: true,
      username: true,
      name: true,
      avatarUrl: true,
      createdAt: true,
      password: true,
    },
  });

  if (!user || !user.password) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const { password: _, ...safeUser } = user;

  (req as any).user = safeUser;

  next();
}
