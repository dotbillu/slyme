import { prisma } from "../../../lib/prisma";
import jwt from "jsonwebtoken";
import { resend } from "../../../lib/resend";
import bcrypt from "bcrypt";

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
    from: "Slyme <slyme-noreply@dotbillu.in>",
    to: email,
    subject: "Your OTP Code",
    html: `
  <div style="font-family: Arial, sans-serif; background:#f6f6f6; padding:20px;">
    <div style="max-width:420px; margin:auto; background:white; padding:24px; border-radius:12px; text-align:center;">
      
      <img
        src="https://slyme.dotbillu.in/slymelogo.png"
        alt="Slyme"
        style="width:64px; height:64px; object-fit:contain; margin-bottom:16px;"
      />

      <h2 style="margin-bottom:10px;">Password Reset</h2>

      <p style="color:#555; font-size:14px;">
        Use this code to continue. It expires in 10 minutes.
      </p>

      <div style="
        font-size:28px;
        letter-spacing:6px;
        font-weight:bold;
        margin:20px 0;
        padding:12px;
        background:#f3f4f6;
        border-radius:8px;
        user-select:all;
      ">
        ${otp}
      </div>

      <p style="font-size:12px; color:#888;">
        If you didn’t request this,best of luck.
      </p>

    </div>
  </div>
  `,
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
