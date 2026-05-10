"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Loader2, Check, Search } from "lucide-react";
import { Room } from "@/types/room";
import { fetchUserRooms } from "@/services/room/service";
import { socket } from "@/lib/socket";

interface RoomPickerModalProps {
  shareUrl: string;
  onClose: () => void;
}

export default function RoomPickerModal({ shareUrl, onClose }: RoomPickerModalProps) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchUserRooms()
      .then((data) => setRooms(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSend = async () => {
    if (selected.size === 0) return;
    setSending(true);
    for (const roomId of selected) {
      socket.emit("send_message", { roomId, content: shareUrl });
    }
    setSending(false);
    setSent(true);
    setTimeout(() => onClose(), 1200);
  };

  const filtered = rooms.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[2100] bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 20 }}
        transition={{ type: "spring", damping: 26, stiffness: 300 }}
        className="fixed z-[2101] inset-x-4 top-1/2 -translate-y-1/2 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[400px] bg-zinc-900 rounded-2xl overflow-hidden shadow-2xl border border-zinc-800 flex flex-col max-h-[80vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <h3 className="text-sm font-semibold text-white">Share to Room</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white transition"
          >
            <X size={16} />
          </button>
        </div>

        {/* Search */}
        {rooms.length > 4 && (
          <div className="px-4 pt-3">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-800 border border-zinc-700">
              <Search size={14} className="text-zinc-500" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search rooms..."
                className="flex-1 bg-transparent text-sm text-white placeholder-zinc-500 outline-none"
              />
            </div>
          </div>
        )}

        {/* Room list */}
        <div className="flex-1 overflow-y-auto px-2 py-2 scrollbar-hide">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={24} className="text-zinc-500 animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm text-zinc-500">
                {rooms.length === 0 ? "You haven't joined any rooms yet" : "No rooms match your search"}
              </p>
            </div>
          ) : (
            filtered.map((room) => {
              const isSelected = selected.has(room.id);
              return (
                <button
                  key={room.id}
                  onClick={() => toggle(room.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition text-left ${
                    isSelected ? "bg-green-500/10" : "hover:bg-zinc-800/60"
                  }`}
                >
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden bg-gradient-to-br from-zinc-700 to-zinc-800 ring-2 ring-zinc-800 flex-shrink-0">
                    {room.imageUrl ? (
                      <img src={room.imageUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-sm font-semibold text-zinc-300">
                        {room.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>

                  {/* Name */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{room.name}</p>
                    <p className="text-[11px] text-zinc-500 truncate">
                      {room._count?.members || room.members?.length || 0} members
                    </p>
                  </div>

                  {/* Checkbox */}
                  <div
                    className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition flex-shrink-0 ${
                      isSelected
                        ? "bg-green-500 border-green-500"
                        : "border-zinc-600"
                    }`}
                  >
                    {isSelected && <Check size={12} className="text-white" />}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-zinc-800">
          <AnimatePresence mode="wait">
            {sent ? (
              <motion.div
                key="sent"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center justify-center gap-2 py-3 text-green-400 text-sm font-medium"
              >
                <Check size={16} /> Shared!
              </motion.div>
            ) : (
              <motion.button
                key="send"
                whileTap={{ scale: 0.97 }}
                onClick={handleSend}
                disabled={selected.size === 0 || sending}
                className="w-full py-3 rounded-xl bg-green-500 hover:bg-green-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm flex items-center justify-center gap-2 transition"
              >
                {sending ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Send size={14} />
                )}
                {sending ? "Sending..." : `Send to ${selected.size || ""} room${selected.size !== 1 ? "s" : ""}`}
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </>
  );
}
