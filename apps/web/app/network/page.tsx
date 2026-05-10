"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAtom } from "jotai";
import { useAuth } from "@/app/AuthProvider";
import { socket } from "@/lib/socket";
import { fetchUserRooms } from "@/services/room/service";
import { roomsAtom, roomsLoadedAtom } from "@/lib/atom";
import { Message } from "@/types/room";
import { MessageCircle } from "lucide-react";

export default function NetworkPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [rooms, setRooms] = useAtom(roomsAtom);
  const [roomsLoaded, setRoomsLoaded] = useAtom(roomsLoadedAtom);
  const roomIdsRef = useRef<string[]>([]);

  useEffect(() => {
    if (!user || roomsLoaded) return;
    fetchUserRooms()
      .then((data) => {
        setRooms(data);
        roomIdsRef.current = data.map((r) => r.id);
        setRoomsLoaded(true);
      })
      .catch(() => {});
  }, [user, roomsLoaded, setRooms, setRoomsLoaded]);

  useEffect(() => {
    roomIdsRef.current = rooms.map((r) => r.id);
  }, [rooms]);

  useEffect(() => {
    if (!user || rooms.length === 0) return;

    const joinAll = () => {
      roomIdsRef.current.forEach((rid) => socket.emit("join_room", rid));
    };

    const handleMessage = (msg: Message) => {
      setRooms((prev) =>
        prev.map((room) => {
          if (room.id !== msg.roomId) return room;
          return {
            ...room,
            lastMessage: msg,
            unreadCount:
              (room.unreadCount || 0) + (msg.senderId !== user.id ? 1 : 0),
          };
        }),
      );
    };

    socket.on("receive_message", handleMessage);

    // Join rooms if already connected, or when connection happens
    if (socket.connected) joinAll();
    socket.on("connect", joinAll);

    return () => {
      roomIdsRef.current.forEach((rid) => socket.emit("leave_room", rid));
      socket.off("connect", joinAll);
      socket.off("receive_message", handleMessage);
    };
  }, [user, rooms.length, setRooms]);

  if (!user) return null;

  const loading = !roomsLoaded;

  // Sort: unread first, then by latest message
  const sortedRooms = [...rooms].sort((a, b) => {
    if ((a.unreadCount || 0) > 0 && (b.unreadCount || 0) === 0) return -1;
    if ((a.unreadCount || 0) === 0 && (b.unreadCount || 0) > 0) return 1;
    const aTime = a.lastMessage?.createdAt || a.createdAt;
    const bTime = b.lastMessage?.createdAt || b.createdAt;
    return new Date(bTime).getTime() - new Date(aTime).getTime();
  });

  return (
    <div className="h-screen bg-black text-white md:ml-[70px] flex">
      {/* Room list */}
      <div className="w-full md:w-[400px] md:border-r md:border-zinc-800 flex flex-col">
        <div className="px-5 py-5 border-b border-zinc-800/60">
          <h2 className="text-lg font-bold text-white">Messages</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="divide-y divide-zinc-800/30">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 px-5 py-3.5 animate-pulse"
                >
                  <div className="w-14 h-14 rounded-full bg-zinc-800 flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3.5 bg-zinc-800 rounded-md w-2/5" />
                    <div className="h-3 bg-zinc-800/60 rounded-md w-3/5" />
                  </div>
                  <div className="h-3 bg-zinc-800/40 rounded w-8" />
                </div>
              ))}
            </div>
          ) : rooms.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-zinc-500 gap-2 px-8 text-center">
              <MessageCircle
                size={40}
                strokeWidth={1}
                className="text-zinc-700"
              />
              <p className="text-sm">No conversations yet</p>
              <p className="text-xs text-zinc-600">
                Join rooms from the map to start chatting
              </p>
            </div>
          ) : (
            sortedRooms.map((room, idx) => {
              const hasUnread = (room.unreadCount || 0) > 0;
              return (
                <motion.button
                  key={room.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  onClick={() => router.push(`/network/${room.id}`)}
                  className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-zinc-900/60 transition-colors text-left"
                >
                  <div className="relative flex-shrink-0">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center overflow-hidden ring-2 ring-zinc-800">
                      {room.imageUrl ? (
                        <img
                          src={room.imageUrl}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-lg font-semibold text-zinc-300">
                          {room.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    {hasUnread && (
                      <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-black" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p
                        className={`text-sm truncate ${hasUnread ? "font-bold text-white" : "font-medium text-zinc-200"}`}
                      >
                        {room.name}
                      </p>
                      {room.lastMessage && (
                        <span
                          className={`text-[11px] flex-shrink-0 ml-2 ${hasUnread ? "text-green-400" : "text-zinc-600"}`}
                        >
                          {formatTime(room.lastMessage.createdAt)}
                        </span>
                      )}
                    </div>
                    <p
                      className={`text-xs truncate mt-0.5 ${hasUnread ? "text-zinc-200" : "text-zinc-500"}`}
                    >
                      {room.lastMessage
                        ? `${room.lastMessage.sender?.username || "someone"}: ${room.lastMessage.content}`
                        : `${room.members?.length || 0} members`}
                    </p>
                  </div>

                  {hasUnread && (
                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-[10px] font-bold text-black">
                        {room.unreadCount! > 9 ? "9+" : room.unreadCount}
                      </span>
                    </div>
                  )}
                </motion.button>
              );
            })
          )}
        </div>
      </div>

      {/* Desktop: empty state */}
      <div className="hidden md:flex flex-1 items-center justify-center">
        <div className="text-center text-zinc-600">
          <MessageCircle
            size={48}
            strokeWidth={1}
            className="mx-auto mb-3 text-zinc-700"
          />
          <p className="text-sm">Select a conversation</p>
        </div>
      </div>
    </div>
  );
}

function formatTime(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
