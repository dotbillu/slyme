"use client";

import { GoogleLogin } from "@react-oauth/google";
import Image from "next/image";
import { motion } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CredentialSignIn, oauthSignIn } from "@/services/auth/service";
import { useAuth } from "@/app/AuthProvider";

type SigninModel = {
  username: string;
  password: string;
};

export default function Login() {
  const { setUser } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [details, setDetails] = useState<SigninModel>({
    username: "",
    password: "",
  });

  const [credError, setCredError] = useState<string | null>(null);
  const [oauthError, setOauthError] = useState<string | null>(null);

  const handleLogin = async () => {
    try {
      setCredError(null);

      const user = await CredentialSignIn(details.username, details.password);

      setUser(user);

      router.replace("/");
    } catch (err: any) {
      setOauthError(null);
      setCredError(err.message);
    }
  };

  const handleOauthSignin = async (credentialResponse: any) => {
    try {
      setOauthError(null);

      const token = credentialResponse.credential;

      const user = await oauthSignIn(token);

      setUser(user);

      router.replace("/");
    } catch (err: any) {
      setCredError(null);
      setOauthError(err.message);
    }
  };
  return (
    <div className="flex lg:h-screen lg:w-screen bg-black auth">
      <div className="lg:flex flex-1 hidden h-full ">
        <video
          src="/loginVideo.mp4"
          autoPlay
          muted
          className="w-full h-full object-cover"
        />
      </div>

      <motion.div className="w-full lg:w-1/2 xl:w-1/3 h-screen grid place-items-center px-4 py-10">
        <div className="w-full max-w-md flex flex-col items-center gap-5">
          <Image
            src="/slymelogo.png"
            alt="logo"
            width={160}
            height={60}
            className="w-40 h-auto"
          />

          {credError && (
            <p className="text-red-500 text-sm w-full text-center">
              {credError}
            </p>
          )}
          <input
            type="text"
            placeholder="Email or username"
            value={details.username}
            onChange={(e) =>
              setDetails((p) => ({ ...p, username: e.target.value }))
            }
            className="w-full p-3 rounded-md bg-zinc-800 text-white outline-none"
          />

          <input
            type="password"
            placeholder="Password"
            value={details.password}
            onChange={(e) =>
              setDetails((p) => ({ ...p, password: e.target.value }))
            }
            className="w-full p-3 rounded-md bg-zinc-800 text-white outline-none"
          />

          <motion.button
            onClick={handleLogin}
            whileTap={{ scale: 1.05 }}
            className="w-full bg-green-500 text-white p-3 rounded-md font-semibold"
          >
            Continue
          </motion.button>

          <div className="w-full flex items-center gap-2">
            <div className="flex-1 h-[1px] bg-zinc-600" />
            <span className="text-zinc-400 text-sm">or</span>
            <div className="flex-1 h-[1px] bg-zinc-600" />
          </div>

          {oauthError && (
            <p className="text-red-500 text-sm w-full text-center">
              {oauthError}
            </p>
          )}
          <GoogleLogin
            onSuccess={handleOauthSignin}
            onError={() => setOauthError("Google login failed")}
            text="signin_with"
            theme="filled_black"
            shape="circle"
          />

          <p className="text-zinc-400 text-sm">
            Don’t have an account?{" "}
            <span
              onClick={() => router.replace("/signup")}
              className="text-green-400 cursor-pointer"
            >
              Sign up
            </span>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
