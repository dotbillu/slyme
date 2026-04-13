"use client";

import { GoogleLogin } from "@react-oauth/google";
import Image from "next/image";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  CredentialSignUp,
  oauthEmailVerify,
  oauthSignUpUser,
} from "@/services/auth/service";
import { useAuth } from "@/app/AuthProvider";

export default function Signup() {
  const { setUser } = useAuth();
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
  });

  const [googleToken, setGoogleToken] = useState<string | null>(null);
  const [step, setStep] = useState<"form" | "username">("form");
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFormSignin = async () => {
    try {
      setLoading(true);
      setError(null);

      const user = await CredentialSignUp(form);

      setUser(user);
      router.replace("/");
    } catch (err: any) {
      setError(err.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  const handleOauthSignup = async (credentialResponse: any) => {
    try {
      setError(null);
      setLoading(true);

      const token = credentialResponse.credential;
      setGoogleToken(token);

      await oauthEmailVerify(token);

      setStep("username");
    } catch (err: any) {
      setError(err.message || "Google signup failed");
    } finally {
      setLoading(false);
    }
  };

  const handleUsernameSubmit = async () => {
    try {
      if (!googleToken) return;

      setLoading(true);
      setError(null);

      const user = await oauthSignUpUser(googleToken, username);

      setUser(user);
      router.replace("/");
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-screen min-h-screen bg-black flex justify-center items-center px-4 auth">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md flex flex-col items-center gap-5"
      >
        <motion.div
          initial={{ y: -80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          <Image
            src="/slymelogo.png"
            alt="logo"
            width={0}
            height={0}
            sizes="100vw"
            className="w-36 h-auto"
          />
        </motion.div>

        {error && (
          <p className="text-red-500 text-sm text-center w-full">{error}</p>
        )}

        {step === "form" && (
          <>
            <div className="w-full flex flex-col gap-1">
              <label className="text-zinc-400 text-sm">Name</label>
              <input
                name="name"
                onChange={handleChange}
                placeholder="Full name"
                className="w-full p-3 rounded-md bg-zinc-800 text-white outline-none"
              />
            </div>

            <div className="w-full flex flex-col gap-1">
              <label className="text-zinc-400 text-sm">Username</label>
              <input
                name="username"
                onChange={handleChange}
                placeholder="username"
                className="w-full p-3 rounded-md bg-zinc-800 text-white outline-none"
              />
            </div>

            <div className="w-full flex flex-col gap-1">
              <label className="text-zinc-400 text-sm">Email</label>
              <input
                name="email"
                onChange={handleChange}
                placeholder="email@example.com"
                className="w-full p-3 rounded-md bg-zinc-800 text-white outline-none"
              />
            </div>

            <div className="w-full flex flex-col gap-1">
              <label className="text-zinc-400 text-sm">Password</label>
              <input
                type="password"
                name="password"
                onChange={handleChange}
                placeholder="password"
                className="w-full p-3 rounded-md bg-zinc-800 text-white outline-none"
              />
            </div>

            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleFormSignin}
              disabled={loading}
              className="w-full mt-3 bg-green-500 text-white p-3 rounded-md font-semibold disabled:opacity-50"
            >
              {loading ? "Loading..." : "Sign Up"}
            </motion.button>

            <div className="flex items-center w-full gap-2">
              <div className="flex-1 h-[1px] bg-zinc-600" />
              <span className="text-zinc-400 text-sm">or</span>
              <div className="flex-1 h-[1px] bg-zinc-600" />
            </div>

            <GoogleLogin
              onSuccess={handleOauthSignup}
              onError={() => setError("Google login failed")}
              theme="filled_black"
              shape="circle"
              text="signup_with"
            />
          </>
        )}

        {step === "username" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full flex flex-col gap-4 mt-4"
          >
            <p className="text-white text-center text-lg font-semibold">
              Choose a username
            </p>

            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="username"
              className="w-full p-3 rounded-md bg-zinc-800 text-white outline-none"
            />

            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleUsernameSubmit}
              disabled={loading}
              className="w-full bg-green-500 text-white p-3 rounded-md font-semibold disabled:opacity-50"
            >
              {loading ? "Creating..." : "Continue"}
            </motion.button>
          </motion.div>
        )}

        <p className="text-zinc-400 text-sm">
          Already have an account?{" "}
          <span
            onClick={() => router.replace("/signin")}
            className="text-green-400 cursor-pointer"
          >
            Sign In
          </span>
        </p>
      </motion.div>
    </div>
  );
}
