"use client";

import dynamic from "next/dynamic";
import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Drawer } from "vaul";
import { X, Users, LogIn, MapPin } from "lucide-react";
import { useAuth } from "@/app/AuthProvider";
import { Gig } from "@/types/gig";
import { Room } from "@/types/room";
import { fetchAllGigs, fetchGigById } from "@/services/gig/service";
import { fetchAllRooms, fetchRoomById, joinRoom } from "@/services/room/service";
import ShareMenu from "@/app/explore/components/ShareMenu";
import { useAtom } from "jotai";
import {
  exploreGigsAtom,
  exploreGigsLoadedAtom,
  exploreRoomsAtom,
  exploreRoomsLoadedAtom,
} from "@/lib/atom";

const Map = dynamic(() => import("@/app/explore/components/Map"), { ssr: false });
const GigDetail = dynamic(() => import("@/app/explore/components/GigDetail"), { ssr: false });

export default function ExplorePage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Gigs state
  const [gigs, setGigs] = useAtom(exploreGigsAtom);
  const [gigsLoaded, setGigsLoaded] = useAtom(exploreGigsLoadedAtom);
  const [selectedGig, setSelectedGig] = useState<Gig | null>(null);

  // Rooms state
  const [rooms, setRooms] = useAtom(exploreRoomsAtom);
  const [roomsLoaded, setRoomsLoaded] = useAtom(exploreRoomsLoadedAtom);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [joining, setJoining] = useState(false);

  // Track whether we've handled the initial URL params
  const initialUrlHandled = useRef(false);

  // Fetch all gigs
  const loadGigs = useCallback(async () => {
    if (gigsLoaded) return gigs;
    try {
      const data = await fetchAllGigs();
      setGigs(data);
      setGigsLoaded(true);
      return data;
    } catch {
      return [];
    }
  }, [gigsLoaded, gigs, setGigs, setGigsLoaded]);

  // Fetch all rooms
  const loadRooms = useCallback(async () => {
    if (roomsLoaded) return rooms;
    try {
      const data = await fetchAllRooms();
      setRooms(data);
      setRoomsLoaded(true);
      return data;
    } catch {
      return [];
    }
  }, [roomsLoaded, rooms, setRooms, setRoomsLoaded]);

  useEffect(() => {
    const init = async () => {
      const [loadedGigs, loadedRooms] = await Promise.all([loadGigs(), loadRooms()]);

      if (!initialUrlHandled.current) {
        initialUrlHandled.current = true;
        const gigId = searchParams.get("gig");
        const roomId = searchParams.get("room");

        if (gigId) {
          const found = loadedGigs.find((g: Gig) => g.id === gigId);
          if (found) {
            setSelectedGig(found);
          } else {
            try { const gig = await fetchGigById(gigId); setSelectedGig(gig); } catch {}
          }
        } else if (roomId) {
          const found = loadedRooms.find((r: Room) => r.id === roomId);
          if (found) {
            setSelectedRoom(found);
          } else {
            try { const room = await fetchRoomById(roomId); setSelectedRoom(room); } catch {}
          }
        }
      }
    };
    init();
  }, [loadGigs, loadRooms, searchParams]);

  // Geolocation
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setUserLocation({ lat: 51.505, lng: -0.09 }),
      { enableHighAccuracy: true }
    );
  }, []);

  // URL sync
  const pushParam = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("gig"); params.delete("room");
    params.set(key, value);
    router.replace(`/explore?${params.toString()}`, { scroll: false });
  }, [router, searchParams]);

  const clearParams = useCallback(() => {
    router.replace("/explore", { scroll: false });
  }, [router]);

  // Gig handlers
  const handleGigClick = useCallback((gig: Gig) => { setSelectedGig(gig); setSelectedRoom(null); pushParam("gig", gig.id); }, [pushParam]);
  const handleGigClose = useCallback(() => { setSelectedGig(null); clearParams(); }, [clearParams]);
  const handleGigUpdated = useCallback((updated: Gig) => { setGigs((prev) => prev.map((g) => (g.id === updated.id ? updated : g))); setSelectedGig(updated); }, []);
  const handleGigDeleted = useCallback((id: string) => { setGigs((prev) => prev.filter((g) => g.id !== id)); setSelectedGig(null); clearParams(); }, [clearParams]);

  // Room handlers
  const handleRoomClick = useCallback((room: Room) => { setSelectedRoom(room); setSelectedGig(null); pushParam("room", room.id); }, [pushParam]);
  const handleRoomClose = useCallback(() => { setSelectedRoom(null); clearParams(); }, [clearParams]);
  const handleJoinRoom = useCallback(async () => {
    if (!selectedRoom) return;
    setJoining(true);
    try {
      if (user) {
        const isMember = selectedRoom.members?.some((m) => m.id === user.id);
        if (!isMember) await joinRoom(selectedRoom.id);
      }
      router.push(`/network/${selectedRoom.id}`);
    } catch { setJoining(false); }
  }, [selectedRoom, user, router]);

  const avatarUrl = user?.avatarUrl || null;
  const isOwner = (gig: Gig) => !!user && gig.creatorId === user.id;

  return (
    <div className="relative h-screen w-full overflow-hidden">
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

      <AnimatePresence>
        {selectedGig && (
          <GigDetail key={selectedGig.id} gig={selectedGig} isOwner={isOwner(selectedGig)} onClose={handleGigClose} onUpdated={handleGigUpdated} onDeleted={handleGigDeleted} isLoggedIn={!!user} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedRoom && (
          <RoomPanel room={selectedRoom} onClose={handleRoomClose} onJoin={handleJoinRoom} joining={joining} isLoggedIn={!!user} />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Room Panel ─── */
function RoomPanel({
  room, onClose, onJoin, joining, isLoggedIn,
}: {
  room: Room; onClose: () => void; onJoin: () => void; joining: boolean; isLoggedIn: boolean;
}) {
  const memberCount = room._count?.members || room.members?.length || 0;
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const panelContent = (
    <div className="flex flex-col h-full relative">
      {/* Close button overlaid */}
      <button onClick={onClose} className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white/80 hover:text-white hover:bg-black/70 transition">
        <X size={16} />
      </button>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto scrollbar-hide py-4">
        {/* Image */}
        <div className="mx-4 rounded-xl overflow-hidden aspect-[16/10] bg-zinc-900">
          {room.imageUrl ? (
            <img src={room.imageUrl} alt={room.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-zinc-900 flex items-center justify-center">
              <span className="text-6xl font-light text-zinc-700">{room.name.charAt(0).toUpperCase()}</span>
            </div>
          )}
        </div>

        {/* Title + share */}
        <div className="px-6 pt-4 pb-2 flex items-start justify-between gap-3">
          <h2 className="text-2xl font-normal text-white leading-snug flex-1">{room.name}</h2>
          <div className="shrink-0 mt-1">
            <ShareMenu type="room" id={room.id} isLoggedIn={isLoggedIn} />
          </div>
        </div>

        {/* Type */}
        {room.type && (
          <div className="px-6 pb-3">
            <span className="text-sm text-zinc-400">{room.type}</span>
          </div>
        )}

        {/* Info */}
        <div className="px-6 flex flex-col gap-3 py-3">
          <div className="flex items-center gap-4">
            <Users size={16} className="text-zinc-500 shrink-0" />
            <p className="text-sm text-white">{memberCount} {memberCount === 1 ? "member" : "members"}</p>
          </div>

          {room.description && (
            <div className="flex items-start gap-4">
              <MapPin size={16} className="text-zinc-500 shrink-0 mt-0.5" />
              <p className="text-sm text-zinc-300 leading-relaxed">{room.description}</p>
            </div>
          )}
        </div>

        {/* Creator */}
        {room.createdBy && (
          <div className="px-6 py-3 flex items-center gap-3">
            {room.createdBy.avatarUrl ? (
              <img src={room.createdBy.avatarUrl} className="w-8 h-8 rounded-full object-cover" alt="" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-sm text-zinc-400">
                {(room.createdBy.username || room.createdBy.name || "?")[0].toUpperCase()}
              </div>
            )}
            <div>
              <p className="text-sm text-white">{room.createdBy.username || room.createdBy.name || "Anonymous"}</p>
              <p className="text-xs text-zinc-500">Creator</p>
            </div>
          </div>
        )}

        <div className="h-6" />
      </div>

      {/* Join button pinned */}
      <div className="px-6 py-4 shrink-0">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onJoin}
          disabled={joining}
          className="w-full py-3 rounded-full bg-white hover:bg-zinc-200 text-black font-medium text-sm flex items-center justify-center gap-2 transition disabled:opacity-50"
        >
          {joining ? (
            <div className="w-4 h-4 border-2 border-zinc-400 border-t-black rounded-full animate-spin" />
          ) : (
            <>
              <LogIn size={15} />
              Join Room
            </>
          )}
        </motion.button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      {!isMobile && (
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 26, stiffness: 260 }}
          className="fixed top-0 right-0 bottom-0 w-[420px] lg:w-[480px] z-[1000] bg-zinc-950 border-l border-zinc-800/40"
        >
          {panelContent}
        </motion.div>
      )}

      {/* Mobile — vaul Drawer */}
      {isMobile && (
        <Drawer.Root open onOpenChange={(open) => { if (!open) onClose(); }}>
          <Drawer.Portal>
            <Drawer.Overlay className="fixed inset-0 z-[10000] bg-black/60" />
            <Drawer.Content className="fixed bottom-0 left-0 right-0 z-[10001] bg-zinc-950 rounded-t-2xl max-h-[85vh] flex flex-col outline-none">
              <div className="flex justify-center pt-2 pb-1 shrink-0">
                <div className="w-9 h-1 rounded-full bg-zinc-700" />
              </div>
              {panelContent}
            </Drawer.Content>
          </Drawer.Portal>
        </Drawer.Root>
      )}
    </>
  );
}
