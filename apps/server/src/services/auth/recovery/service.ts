import { prisma } from "../../../lib/prisma";
import jwt from "jsonwebtoken";
import { Resend } from "resend";
import bcrypt from "bcrypt";

const resend = new Resend(process.env.RESEND_API_KEY);

function isEmail(str: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str);
}

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function resolveUser(cred: string) {
  if (isEmail(cred)) {
    return prisma.user.findUnique({
      where: { email: cred },
    });
  }

  return prisma.user.findUnique({
    where: { username: cred },
  });
}

export function generateTempToken(user: { id: string }) {
  return jwt.sign({ id: user.id, type: "otp_temp" }, process.env.JWT_SECRET!, {
    expiresIn: "5m",
  });
}
export async function sendOtp(cred: string) {
  const user = await resolveUser(cred);
  if (!user) throw new Error("User not found");

  const email = user.email;
  const otp = generateOtp();

  await prisma.passwordReset.create({
    data: {
      email,
      otp,
      used: false,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    },
  });

  await resend.emails.send({
    from: "Slyme <noreply@dotbillu.in>",
    to: email,
    subject: "Your OTP Code",
    html: `<h1>${otp}</h1>`,
  });

  return true;
}
export async function verifyOtp(cred: string, otp: string) {
  const user = await resolveUser(cred);
  if (!user) return false;

  const record = await prisma.passwordReset.findFirst({
    where: { email: user.email, used: false },
    orderBy: { createdAt: "desc" },
  });

  if (!record) return false;
  if (record.expiresAt < new Date()) return false;
  if (record.otp !== otp) return false;

  await prisma.passwordReset.update({
    where: { id: record.id },
    data: { used: true },
  });

  return user;
}
export async function resetPassword(cred: string, newPassword: string) {
  const user = await resolveUser(cred);
  if (!user) throw new Error("User not found");

  const hashed = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashed },
  });

  return true;
}
