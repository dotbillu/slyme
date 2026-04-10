"use client";

import { GoogleLogin } from "@react-oauth/google";
import Image from "next/image";
import { motion } from "framer-motion";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { authSignUp } from "@/services/auth/service";

export default function Signup() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
  });

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    try {
      const res = await authSignUp(form);
      console.log(res);
      router.push("/dashboard");
    } catch (err: any) {
      console.log(err.message);
    }
  };

  const handleSuccess = async (credentialResponse: any) => {
    const token = credentialResponse.credential;

    await fetch("http://localhost:3001/auth/signin/oauth", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token }),
    });
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
          transition={{ duration: 0.6, ease: "easeOut" }}
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
          onClick={handleSubmit}
          className="w-full mt-3 bg-green-500 text-white p-3 rounded-md font-semibold"
        >
          Sign Up
        </motion.button>

        <div className="flex items-center w-full gap-2">
          <div className="flex-1 h-[1px] bg-zinc-600" />
          <span className="text-zinc-400 text-sm">or</span>
          <div className="flex-1 h-[1px] bg-zinc-600" />
        </div>

        <GoogleLogin
          onSuccess={handleSuccess}
          onError={() => console.log("Login Failed")}
          theme="filled_black"
          shape="circle"
          text="signup_with"
        />

        <p className="text-zinc-400 text-sm">
          Already have an account?{" "}
          <span
            onClick={() => {
              router.push("/signin");
            }}
            className="text-green-400 cursor-pointer"
          >
            Sign In
          </span>
        </p>
      </motion.div>
    </div>
  );
}
