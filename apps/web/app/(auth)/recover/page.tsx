"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Image from "next/image";
import {
  sendRecoveryOtp,
  verifyRecoveryOtp,
  resetPasswordRecover,
} from "@/services/auth/service";
import { Eye, EyeOff } from "lucide-react";

enum RecoverStep {
  IDENTIFY = "IDENTIFY",
  RESET = "RESET",
  SUCCESS = "SUCCESS",
}

export default function RecoverPage() {
  const router = useRouter();
  const [step, setStep] = useState<RecoverStep>(RecoverStep.IDENTIFY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [credential, setCredential] = useState("");
  const [otp, setOtp] = useState("");
  const [showOtp, setShowOtp] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const handleSendOtp = async () => {
    if (!credential) return;
    setLoading(true);
    setError(null);
    try {
      await sendRecoveryOtp(credential);
      setShowOtp(true);
      setResendCooldown(60);
      const timer = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err: any) {
      setError(err.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp) return;
    setLoading(true);
    setError(null);
    try {
      await verifyRecoveryOtp(credential, otp);
      setStep(RecoverStep.RESET);
    } catch (err: any) {
      setError(err.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await resetPasswordRecover(credential, newPassword);
      setStep(RecoverStep.SUCCESS);
    } catch (err: any) {
      setError(err.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-screen bg-black">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full h-full grid place-items-center px-4 py-10"
      >
        <div className="w-full max-w-md flex flex-col items-center gap-6">
          <Image
            src="/slymelogo.png"
            alt="logo"
            width={160}
            height={60}
            className="w-40 h-auto"
          />

          <div className="w-full text-center space-y-2">
            <h1 className="text-2xl font-bold text-white">
              {step === RecoverStep.IDENTIFY && "Recover Password"}
              {step === RecoverStep.RESET && "Reset Password"}
              {step === RecoverStep.SUCCESS && "Success!"}
            </h1>
            <p className="text-zinc-400 text-sm">
              {step === RecoverStep.IDENTIFY &&
                "Enter your email or username to receive an OTP"}
              {step === RecoverStep.RESET && "Enter your new password below"}
              {step === RecoverStep.SUCCESS &&
                "Your password has been reset successfully"}
            </p>
          </div>

          {error && (
            <p className="text-red-500 text-sm w-full text-center bg-red-500/10 py-2 rounded-md border border-red-500/20">
              {error}
            </p>
          )}

          <AnimatePresence mode="wait">
            {step === RecoverStep.IDENTIFY && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="w-full flex flex-col gap-4"
              >
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (showOtp) {
                      handleVerifyOtp();
                    } else {
                      handleSendOtp();
                    }
                  }}
                  className="w-full flex flex-col gap-4"
                >
                  <input
                    type="text"
                    placeholder="Email or username"
                    value={credential}
                    disabled={showOtp || loading}
                    onChange={(e) => setCredential(e.target.value)}
                    className="w-full p-3 rounded-md bg-zinc-800 text-white outline-none focus:ring-2 focus:ring-green-500 transition-all"
                  />

                  {showOtp && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="space-y-4"
                    >
                      <input
                        type="text"
                        placeholder="Enter 6-digit OTP"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        className="w-full p-3 rounded-md bg-zinc-800 text-white outline-none focus:ring-2 focus:ring-green-500 transition-all"
                      />
                      <motion.button
                        type="submit"
                        disabled={loading || otp.length < 6}
                        whileTap={{ scale: 0.98 }}
                        className="w-full bg-green-500 text-white p-3 rounded-md font-semibold disabled:opacity-50"
                      >
                        {loading ? "Verifying..." : "Verify OTP"}
                      </motion.button>

                      <div className="w-full text-center">
                        <button
                          type="button"
                          onClick={handleSendOtp}
                          disabled={loading || resendCooldown > 0}
                          className="text-sm text-zinc-400 hover:text-green-400 transition-colors disabled:opacity-50 disabled:hover:text-zinc-400"
                        >
                          {resendCooldown > 0
                            ? `Resend OTP in ${resendCooldown}s`
                            : "Resend OTP"}
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {!showOtp && (
                    <motion.button
                      type="submit"
                      disabled={loading || !credential}
                      whileTap={{ scale: 0.98 }}
                      className="w-full bg-green-500 text-white p-3 rounded-md font-semibold disabled:opacity-50"
                    >
                      {loading ? "Sending..." : "Get OTP"}
                    </motion.button>
                  )}
                </form>
              </motion.div>
            )}

            {step === RecoverStep.RESET && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="w-full flex flex-col gap-4"
              >
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleResetPassword();
                  }}
                  className="w-full flex flex-col gap-4"
                >
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      placeholder="New Password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full p-3 rounded-md bg-zinc-800 text-white outline-none focus:ring-2 focus:ring-green-500 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors"
                    >
                      {showNewPassword ? (
                        <EyeOff size={20} />
                      ) : (
                        <Eye size={20} />
                      )}
                    </button>
                  </div>

                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm New Password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full p-3 rounded-md bg-zinc-800 text-white outline-none focus:ring-2 focus:ring-green-500 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors"
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={20} />
                      ) : (
                        <Eye size={20} />
                      )}
                    </button>
                  </div>
                  <motion.button
                    type="submit"
                    disabled={
                      loading || !newPassword || newPassword !== confirmPassword
                    }
                    whileTap={{ scale: 0.98 }}
                    className="w-full bg-green-500 text-white p-3 rounded-md font-semibold disabled:opacity-50"
                  >
                    {loading ? "Updating..." : "Reset Password"}
                  </motion.button>
                </form>
              </motion.div>
            )}

            {step === RecoverStep.SUCCESS && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full flex flex-col gap-6 items-center"
              >
                <motion.button
                  onClick={() => router.replace("/signin")}
                  whileTap={{ scale: 0.98 }}
                  className="w-full bg-green-500 text-white p-3 rounded-md font-semibold"
                >
                  Back to Sign In
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          <p
            onClick={() => router.replace("/signin")}
            className="absolute bottom-10 text-zinc-500 text-sm cursor-pointer hover:text-zinc-300 transition-colors"
          >
            Wait, I remember my password
          </p>
        </div>
      </motion.div>
    </div>
  );
}
