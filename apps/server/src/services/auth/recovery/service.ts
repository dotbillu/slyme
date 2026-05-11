import { prisma } from "../../../lib/prisma";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function isEmail(str: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str);
}

async function resolveEmail(cred: string) {
  if (isEmail(cred)) return cred;

  const user = await prisma.user.findUnique({
    where: { username: cred },
    select: { email: true },
  });

  return user?.email || null;
}

export async function sendOtp(cred: string) {
  const email = await resolveEmail(cred);
  if (!email) throw new Error("User not found");

  await prisma.passwordReset.updateMany({
    where: { email, used: false },
    data: { used: true },
  });

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
  const email = await resolveEmail(cred);
  if (!email) return false;

  const record = await prisma.passwordReset.findFirst({
    where: { email, used: false },
    orderBy: { createdAt: "desc" },
  });

  if (!record) return false;

  if (record.expiresAt < new Date()) return false;

  if (record.otp !== otp) return false;

  await prisma.passwordReset.update({
    where: { id: record.id },
    data: { used: true },
  });

  return true;
}
