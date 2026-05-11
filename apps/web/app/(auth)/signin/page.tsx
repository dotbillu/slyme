"use client";

import { GoogleLogin } from "@react-oauth/google";
import Image from "next/image";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CredentialSignIn, oauthSignIn } from "@/services/auth/service";
import { useAuth } from "@/app/AuthProvider";
import { Eye, EyeOff, Settings, X } from "lucide-react";
import { AnimatePresence } from "framer-motion";


type SigninModel = {
  username: string;
  password: string;
};

export default function Login() {
  const { user, checked, setUser } = useAuth();
  const router = useRouter();
  const [details, setDetails] = useState<SigninModel>({
    username: "",
    password: "",
  });

  const [credError, setCredError] = useState<string | null>(null);
  const [oauthError, setOauthError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [savedUser, setSavedUser] = useState<{ username: string; avatarUrl: string | null } | null>(null);
  const [showOneTap, setShowOneTap] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("slyme_saved_user");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSavedUser(parsed);
        setShowOneTap(true);
        setDetails((p) => ({ ...p, username: parsed.username }));
      } catch (e) {
        console.error("Error parsing saved user", e);
      }
    }
  }, []);


  // Removed automatic redirect to /explore to allow /ontap redirect to function
  // useEffect(() => {
  //   if (checked && user) {
  //     router.replace("/explore");
  //   }
  // }, [checked, user, router]);


  const handleLogin = async () => {
    if (loading) return;
    try {
      setLoading(true);
      setCredError(null);

      const user = await CredentialSignIn(details.username, details.password);
      setUser(user);
      router.replace("/ontap");



    } catch (err: any) {
      setOauthError(null);
      setCredError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOauthSignin = async (credentialResponse: any) => {
    if (loading) return;
    try {
      setLoading(true);
      setOauthError(null);

      const token = credentialResponse.credential;
      const user = await oauthSignIn(token);
      setUser(user);
      window.location.replace("/explore");



    } catch (err: any) {
      setCredError(null);
      setOauthError(err.message);
    } finally {
      setLoading(false);
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
        <AnimatePresence mode="wait">
          {showOneTap && savedUser ? (
            <motion.div
              key="onetap-ui"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="w-full max-w-sm flex flex-col items-center gap-8"
            >
              <div className="w-32 h-32 rounded-full overflow-hidden ring-4 ring-zinc-900 shadow-2xl">
                {savedUser.avatarUrl ? (
                  <Image src={savedUser.avatarUrl} alt="avatar" width={128} height={128} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                    <span className="text-4xl text-zinc-500 uppercase">{savedUser.username[0]}</span>
                  </div>
                )}
              </div>

              <h2 className="text-white text-3xl font-bold tracking-tight">{savedUser.username}</h2>

              <div className="w-full space-y-4">
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowPasswordModal(true)}
                  className="w-full bg-[#5cb038] text-white py-4 rounded-2xl font-bold text-lg hover:bg-[#4d942e] transition-all shadow-xl shadow-[#5cb038]/10"
                >
                  Continue
                </motion.button>

                <button
                  onClick={() => setShowOneTap(false)}
                  className="w-full text-zinc-500 text-sm font-semibold hover:text-white transition-colors py-2"
                >
                  Log in to another account
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.form
              key="standard-signin"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              onSubmit={(e) => {
                e.preventDefault();
                handleLogin();
              }}
              className="w-full max-w-md flex flex-col items-center gap-5"
            >
              <Image
                src="/slymelogo.png"
                alt="logo"
                width={160}
                height={60}
                className="w-40 h-auto mb-2"
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
                className="w-full p-3 rounded-md bg-zinc-800 text-white outline-none border border-white/5 focus:border-green-500/50 transition-all"
              />

              <div className="w-full relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={details.password}
                  onChange={(e) =>
                    setDetails((p) => ({ ...p, password: e.target.value }))
                  }
                  className="w-full p-3 rounded-md bg-zinc-800 text-white outline-none border border-white/5 focus:border-green-500/50 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              <div className="w-full flex justify-end -mt-3">
                <span
                  onClick={() => router.push("/recover")}
                  className="text-zinc-500 text-xs cursor-pointer hover:underline"
                >
                  Forgot password?
                </span>
              </div>

              <motion.button
                type="submit"
                disabled={loading}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-[#5cb038] text-white p-3 rounded-md font-semibold disabled:opacity-50 shadow-lg shadow-[#5cb038]/10"
              >
                {loading ? "Signing in..." : "Continue"}
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
                Don't have an account?{" "}
                <span
                  onClick={() => router.replace("/signup")}
                  className="text-green-400 cursor-pointer"
                >
                  Sign up
                </span>
              </p>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Password Modal */}
      <AnimatePresence>
        {showPasswordModal && savedUser && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPasswordModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md bg-black rounded-[40px] p-10 flex flex-col items-center gap-7 shadow-[0_0_80px_rgba(0,0,0,0.8)] border border-white/5"
            >
              <button 
                onClick={() => setShowPasswordModal(false)}
                className="absolute top-6 right-6 text-zinc-600 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>

              <div className="w-20 h-20 rounded-full overflow-hidden ring-2 ring-white/10">
                {savedUser.avatarUrl ? (
                  <Image src={savedUser.avatarUrl} alt="avatar" width={80} height={80} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-zinc-900 flex items-center justify-center">
                    <span className="text-3xl text-zinc-600 uppercase font-bold">{savedUser.username[0]}</span>
                  </div>
                )}
              </div>

              <h2 className="text-white text-lg font-bold tracking-tight -mt-2">{savedUser.username}</h2>

              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  handleLogin();
                }}
                className="w-full flex flex-col gap-5"
              >
                {credError && <p className="text-red-500 text-[10px] text-center -mb-2">{credError}</p>}
                
                <div className="w-full relative">
                  <input
                    autoFocus
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={details.password}
                    onChange={(e) => setDetails(p => ({ ...p, password: e.target.value }))}
                    className="w-full p-3.5 rounded-xl bg-[#111] text-white text-sm outline-none border border-white/5 focus:border-[#5cb038]/50 transition-all placeholder:text-zinc-700"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                <motion.button
                  type="submit"
                  disabled={loading}
                  whileTap={{ scale: 0.98 }}
                  className="w-full bg-[#5cb038] text-white py-3.5 rounded-xl font-bold text-base hover:bg-[#4d942e] transition-all disabled:opacity-50 shadow-lg shadow-[#5cb038]/5"
                >
                  {loading ? "Logging in..." : "Log in"}
                </motion.button>

                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordModal(false);
                    router.push("/recover");
                  }}
                  className="text-zinc-600 text-xs font-semibold hover:text-zinc-400 transition-colors"
                >
                  Forgot password?
                </button>
              </form>
            </motion.div>

          </div>
        )}
      </AnimatePresence>




    </div>
  );
}
