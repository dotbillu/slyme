"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Share2, Link2, MessageCircle, Check } from "lucide-react";
import RoomPickerModal from "./RoomPickerModal";

const SHARE_DOMAIN = "https://slyme.dotbillu.in";

interface ShareMenuProps {
  /** "gig" or "room" */
  type: "gig" | "room";
  /** The entity ID */
  id: string;
  /** Whether the current user is logged in */
  isLoggedIn: boolean;
}

export default function ShareMenu({ type, id, isLoggedIn }: ShareMenuProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const shareUrl = `${SHARE_DOMAIN}/explore?${type}=${id}`;

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
    }
  }, [open]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
        setOpen(false);
      }, 1200);
    } catch {
      // fallback
      const textarea = document.createElement("textarea");
      textarea.value = shareUrl;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
        setOpen(false);
      }, 1200);
    }
  };

  const handleShareToRoom = () => {
    setOpen(false);
    setPickerOpen(true);
  };

  return (
    <div className="relative" ref={menuRef}>
      {/* Trigger button */}
      <button
        onClick={() => setOpen((p) => !p)}
        className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition"
        aria-label="Share"
      >
        <Share2 size={16} />
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-52 bg-zinc-800 rounded-xl overflow-hidden shadow-xl shadow-black/40 border border-zinc-700/50 z-[1500]"
          >
            {/* Copy Link */}
            <button
              onClick={handleCopy}
              className="flex items-center gap-3 w-full px-4 py-3 hover:bg-zinc-700 transition text-left"
            >
              {copied ? (
                <Check size={16} className="text-green-400" />
              ) : (
                <Link2 size={16} className="text-zinc-300" />
              )}
              <span className="text-sm text-white">
                {copied ? "Copied!" : "Copy Link"}
              </span>
            </button>

            {/* Share to Room (only for logged-in users) */}
            {isLoggedIn && (
              <>
                <div className="h-px bg-zinc-700/50" />
                <button
                  onClick={handleShareToRoom}
                  className="flex items-center gap-3 w-full px-4 py-3 hover:bg-zinc-700 transition text-left"
                >
                  <MessageCircle size={16} className="text-zinc-300" />
                  <span className="text-sm text-white">Share to Room</span>
                </button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Room Picker Modal */}
      <AnimatePresence>
        {pickerOpen && (
          <RoomPickerModal
            shareUrl={shareUrl}
            onClose={() => setPickerOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
