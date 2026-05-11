"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/AuthProvider";
import { KeyRound } from "lucide-react";
import { useEffect } from "react";

export default function OnTapPage() {
  const { user, checked } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (checked && !user) {
      router.replace("/signin");
    }
  }, [checked, user, router]);

  const handleSave = () => {
    if (user) {
      localStorage.setItem(
        "slyme_saved_user",
        JSON.stringify({
          username: user.username,
          avatarUrl: user.avatarUrl,
        })
      );
    }
    router.replace("/explore");
  };

  const handleSkip = () => {
    router.replace("/explore");
  };

  if (!user) return null;

  return (
    <div className="w-screen h-screen bg-black flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-[#1a1a1a] border border-white/5 rounded-[32px] p-8 flex flex-col items-center gap-6 text-center"
      >
        <div className="w-20 h-20 rounded-full border-2 border-white/10 flex items-center justify-center">
          <KeyRound className="w-10 h-10 text-white" />
        </div>

        <div className="space-y-2">
          <h1 className="text-white text-2xl font-bold">Save your login info?</h1>
          <p className="text-zinc-400 text-[15px] leading-relaxed px-4">
            We can save your login info on this browser so you don't need to enter it again.
          </p>
        </div>

        <div className="w-full space-y-3 mt-2">
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handleSave}
            className="w-full bg-[#5cb038] text-white py-4 rounded-2xl font-bold text-lg hover:bg-[#4a8f2d] transition-colors"
          >
            Save info
          </motion.button>
          
          <button
            onClick={handleSkip}
            className="w-full text-zinc-500 font-bold text-[16px] hover:text-white transition-colors py-2"
          >
            Not now
          </button>
        </div>
      </motion.div>
    </div>
  );
}
