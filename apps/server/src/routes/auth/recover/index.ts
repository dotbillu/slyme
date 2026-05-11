import { Router } from "express";
import {
  sendOtp,
  verifyOtp,
  generateTempToken,
  resetPassword,
} from "../../../services/auth/recovery/service";
import jwt from "jsonwebtoken";
const router = Router();

router.post("/get-otp/:cred", async (req, res) => {
  try {
    await sendOtp(req.params.cred);

    return res.json({ success: true });
  } catch {
    return res.status(500).json({ success: false });
  }
});

router.post("/verify-otp/:cred", async (req, res) => {
  try {
    const { otp } = req.body;

    const user = await verifyOtp(req.params.cred, otp);

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    const tempToken = generateTempToken(user);

    res.cookie("temp_token", tempToken, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 5 * 60 * 1000,
    });

    return res.json({
      success: true,
      message: "OTP verified",
    });
  } catch {
    return res.status(500).json({ success: false });
  }
});

router.post("/reset-password/:cred", async (req, res) => {
  try {
    const token = req.cookies.temp_token;
    const { password } = req.body;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    jwt.verify(token, process.env.JWT_SECRET!);

    await resetPassword(req.params.cred, password);

    return res.json({
      success: true,
      message: "Password updated",
    });
  } catch {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired session",
    });
  }
});
export default router;
