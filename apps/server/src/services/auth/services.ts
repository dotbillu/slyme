import { prisma } from "../../lib/prisma";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { User } from "@prisma/client";
interface GooglePayload {
  sub: string;
  email?: string;
  name?: string;
  picture?: string;
}
interface Credentials {
  name: string;
  username: string;
  password: string;
  email: string;
}

export async function getUserbyEmail(email: string): Promise<User | null> {
  const user = await prisma.user.findUnique({
    where: { email },
  });
  return user;
}

export async function getUserbyUsername(
  username: string,
): Promise<User | null> {
  const user = await prisma.user.findUnique({
    where: { username },
  });
  return user;
}
export async function createUserOauth(payload: GooglePayload): Promise<User> {
  const data = {
    googleId: payload.sub,
    email: payload.email || "",
    name: payload.name,
    avatarUrl: payload.picture,
  };
  const user = await prisma.user.create({ data });
  return user;
}

export async function createUserByCredentials(
  payload: Credentials,
): Promise<User> {
  const hashedPassword = await gethashedPassword(payload.password);
  const user = await prisma.user.create({
    data: {
      ...payload,
      password: hashedPassword,
    },
  });

  return user;
}

export function generateToken(user: User) {
  const token = jwt.sign(
    { id: user.id, username: user.username, email: user.email },
    process.env.JWT_SECRET as string,
    { expiresIn: "7d" },
  );
  return token;
}

export async function gethashedPassword(password: string) {
  const hashedPassword = await bcrypt.hash(password, 10);
  return hashedPassword;
}
