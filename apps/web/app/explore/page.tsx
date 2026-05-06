"use client";

import dynamic from "next/dynamic";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { X, Users, LogIn } from "lucide-react";
import { useAuth } from "@/app/AuthProvider";
import { Gig } from "@/types/gig";
import { Room } from "@/types/room";
import { fetchAllGigs } from "@/services/gig/service";
import { fetchAllRooms, joinRoom } from "@/services/room/service";

const Map = dynamic(() => import("@/app/explore/components/Map"), { ssr: false });
const GigDetail = dynamic(() => import("@/app/explore/components/GigDetail"), { ssr: false });

export default function ExplorePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Gigs state
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [selectedGig, setSelectedGig] = useState<Gig | null>(null);

  // Rooms state
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [joining, setJoining] = useState(false);

  // Fetch all gigs
  const loadGigs = useCallback(async () => {
    try {
      const data = await fetchAllGigs();
      setGigs(data);
    } catch {}
  }, []);

  // Fetch all rooms
  const loadRooms = useCallback(async () => {
    try {
      const data = await fetchAllRooms();
      setRooms(data);
    } catch {}
  }, []);

  useEffect(() => { loadGigs(); loadRooms(); }, [loadGigs, loadRooms]);

  // Geolocation
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => {
        setUserLocation({ lat: 51.505, lng: -0.09 });
      },
      { enableHighAccuracy: true }
    );
  }, []);

  // Gig handlers
  const handleGigClick = useCallback((gig: Gig) => setSelectedGig(gig), []);
  const handleGigClose = useCallback(() => setSelectedGig(null), []);
  const handleGigUpdated = useCallback((updated: Gig) => {
    setGigs((prev) => prev.map((g) => (g.id === updated.id ? updated : g)));
    setSelectedGig(updated);
  }, []);
  const handleGigDeleted = useCallback((id: string) => {
    setGigs((prev) => prev.filter((g) => g.id !== id));
    setSelectedGig(null);
  }, []);

  // Room handlers
  const handleRoomClick = useCallback((room: Room) => {
    setSelectedRoom(room);
  }, []);

  const handleRoomClose = useCallback(() => {
    setSelectedRoom(null);
  }, []);

  const handleJoinRoom = useCallback(async () => {
    if (!selectedRoom) return;
    setJoining(true);
    try {
      if (user) {
        const isMember = selectedRoom.members?.some((m) => m.id === user.id);
        if (!isMember) {
          await joinRoom(selectedRoom.id);
        }
      }
      router.push(`/network/${selectedRoom.id}`);
    } catch {
      // failed
      setJoining(false);
    }
  }, [selectedRoom, user, router]);

  const avatarUrl = user?.avatarUrl || null;
  const isOwner = (gig: Gig) => !!user && gig.creatorId === user.id;

  return (
    <div className="relative h-screen w-full overflow-hidden">
      {/* Main map */}
      <div className="absolute inset-0">
        <Map
          userLocation={userLocation}
          avatarUrl={avatarUrl}
          gigs={gigs}
          rooms={rooms}
          onGigClick={handleGigClick}
          onRoomClick={handleRoomClick}
        />
      </div>

      {/* Gig detail sidebar / fullscreen */}
      <AnimatePresence>
        {selectedGig && (
          <GigDetail
            key={selectedGig.id}
            gig={selectedGig}
            isOwner={isOwner(selectedGig)}
            onClose={handleGigClose}
            onUpdated={handleGigUpdated}
            onDeleted={handleGigDeleted}
          />
        )}
      </AnimatePresence>

      {/* Room detail modal */}
      <AnimatePresence>
        {selectedRoom && (
          <RoomModal
            room={selectedRoom}
            onClose={handleRoomClose}
            onJoin={handleJoinRoom}
            joining={joining}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Room Modal ─── */
function RoomModal({
  room,
  onClose,
  onJoin,
  joining,
}: {
  room: Room;
  onClose: () => void;
  onJoin: () => void;
  joining: boolean;
}) {
  const memberCount = room._count?.members || room.members?.length || 0;

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[998] bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="fixed z-[999] inset-x-4 top-1/2 -translate-y-1/2 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[360px] bg-zinc-900 rounded-2xl overflow-hidden shadow-2xl"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 rounded-full bg-zinc-800/80 hover:bg-zinc-700 transition z-10"
        >
          <X size={18} className="text-zinc-300" />
        </button>

        {/* Room image / gradient header */}
        <div className="h-32 relative overflow-hidden">
          {room.imageUrl ? (
            <img
              src={room.imageUrl}
              alt={room.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center">
              <span className="text-4xl font-bold text-white/80">
                {room.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          {/* Gradient overlay at bottom */}
          <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-zinc-900 to-transparent" />
        </div>

        {/* Content */}
        <div className="px-5 pb-5 -mt-2 relative">
          <h2 className="text-lg font-semibold text-white mb-1">{room.name}</h2>

          {room.description && (
            <p className="text-sm text-zinc-400 mb-3 line-clamp-3">
              {room.description}
            </p>
          )}

          {/* Members */}
          <div className="flex items-center gap-2 text-zinc-400 text-sm mb-5">
            <Users size={16} />
            <span>{memberCount} {memberCount === 1 ? "member" : "members"}</span>
          </div>

          {/* Join button */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={onJoin}
            disabled={joining}
            className="w-full py-3 rounded-xl bg-purple-500 hover:bg-purple-600 text-white font-semibold text-sm flex items-center justify-center gap-2 transition disabled:opacity-50"
          >
            {joining ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <LogIn size={16} />
                Join Room
              </>
            )}
          </motion.button>
        </div>
      </motion.div>
    </>
  );
}
