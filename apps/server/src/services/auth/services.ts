import { User } from "../../generated/prisma/browser";
import { prisma } from "../../lib/prisma";

interface GooglePayload {
  sub: string;
  email?: string;
  name?: string;
  picture?: string;
}

export async function getUserOauth(
  payload: GooglePayload,
): Promise<User | null> {
  const googleId = payload.sub;
  const user = await prisma.user.findUnique({
    where: { googleId },
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
