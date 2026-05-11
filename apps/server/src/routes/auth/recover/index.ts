import { Router } from "express";
import { sendOtp, verifyOtp } from "../../../services/auth/recovery/service";

const router = Router();

router.post("/get-otp/:cred", async (req, res) => {
  try {
    const cred = req.params.cred;

    await sendOtp(cred);

    return res.json({
      success: true,
      message: "OTP sent",
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Failed to send OTP",
    });
  }
});

router.post("/verify-otp/:cred", async (req, res) => {
  try {
    const cred = req.params.cred;
    const { otp } = req.body;

    const ok = await verifyOtp(cred, otp);

    if (!ok) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP",
      });
    }

    return res.json({
      success: true,
      message: "OTP verified",
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Verification failed",
    });
  }
});

export default router;
