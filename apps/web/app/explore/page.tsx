"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useState, useEffect, useCallback, useRef } from "react";

import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Drawer } from "vaul";
import {
  X,
  Users,
  LogIn,
  MapPin,
  Pencil,
  ChevronRight,
  Check,
} from "lucide-react";

import { useAuth } from "@/app/AuthProvider";
import { Gig } from "@/types/gig";
import { Room } from "@/types/room";
import { fetchAllGigs, fetchGigById } from "@/services/gig/service";
import {
  fetchAllRooms,
  fetchRoomById,
  joinRoom,
} from "@/services/room/service";
import ShareMenu from "@/app/explore/components/ShareMenu";
import { useAtom, useSetAtom } from "jotai";
import {
  exploreGigsAtom,
  exploreGigsLoadedAtom,
  exploreRoomsAtom,
  exploreRoomsLoadedAtom,
  roomsLoadedAtom,
} from "@/lib/atom";
import { socket } from "@/lib/socket";

const Map = dynamic(() => import("@/app/explore/components/Map"), {
  ssr: false,
});
const GigDetail = dynamic(() => import("@/app/explore/components/GigDetail"), {
  ssr: false,
});
import EditRoomModal from "@/app/explore/components/EditRoomModal";

export default function ExplorePage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const setNetworkRoomsLoaded = useSetAtom(roomsLoadedAtom);
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  // Gigs state
  const [gigs, setGigs] = useAtom(exploreGigsAtom);
  const [gigsLoaded, setGigsLoaded] = useAtom(exploreGigsLoadedAtom);
  const [selectedGig, setSelectedGig] = useState<Gig | null>(null);

  // Rooms state
  const [rooms, setRooms] = useAtom(exploreRoomsAtom);
  const [roomsLoaded, setRoomsLoaded] = useAtom(exploreRoomsLoadedAtom);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [joining, setJoining] = useState(false);
  const [showNudge, setShowNudge] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);

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
      const [loadedGigs, loadedRooms] = await Promise.all([
        loadGigs(),
        loadRooms(),
      ]);

      if (!initialUrlHandled.current) {
        initialUrlHandled.current = true;
        const gigId = searchParams.get("gig");
        const roomId = searchParams.get("room");

        if (gigId) {
          const found = loadedGigs.find((g: Gig) => g.id === gigId);
          if (found) {
            setSelectedGig(found);
          } else {
            try {
              const gig = await fetchGigById(gigId);
              setSelectedGig(gig);
            } catch {}
          }
        } else if (roomId) {
          const found = loadedRooms.find((r: Room) => r.id === roomId);
          if (found) {
            setSelectedRoom(found);
          } else {
            try {
              const room = await fetchRoomById(roomId);
              setSelectedRoom(room);
            } catch {}
          }
        }
      }
    };
    init();
  }, [loadGigs, loadRooms, searchParams]);

  // Handle refresh after creation (via URL param or socket)
  useEffect(() => {
    const handleRefresh = () => {
      setGigsLoaded(false);
      setRoomsLoaded(false);
    };

    // Check for redirect param
    if (searchParams.get("created") === "true") {
      handleRefresh();
      // Clean URL
      const params = new URLSearchParams(searchParams.toString());
      params.delete("created");
      const newPath = params.toString()
        ? `/explore?${params.toString()}`
        : "/explore";
      router.replace(newPath, { scroll: false });
    }

    // Socket listeners for real-time refresh
    socket.on("gig_created", handleRefresh);
    socket.on("room_created", handleRefresh);

    return () => {
      socket.off("gig_created", handleRefresh);
      socket.off("room_created", handleRefresh);
    };
  }, [searchParams, setGigsLoaded, setRoomsLoaded, router]);

  // Geolocation
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        }),
      () => setUserLocation({ lat: 51.505, lng: -0.09 }),
      { enableHighAccuracy: true },
    );
  }, []);

  // Profile completion nudge
  useEffect(() => {
    if (!user) return;

    const nudgeShownSession = sessionStorage.getItem(
      "slyme_avatar_nudge_shown",
    );
    const nudgeHiddenPermanent = localStorage.getItem(
      "slyme_avatar_nudge_hidden",
    );

    if (
      !user.avatarUrl ||
      (!user.bio && !nudgeShownSession && !nudgeHiddenPermanent)
    ) {
      const timer = setTimeout(() => {
        setShowNudge(true);
        sessionStorage.setItem("slyme_avatar_nudge_shown", "true");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [user]);

  const handleNudgeClose = () => {
    if (dontShowAgain) {
      localStorage.setItem("slyme_avatar_nudge_hidden", "true");
    }
    setShowNudge(false);
  };

  // URL sync
  const pushParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("gig");
      params.delete("room");
      params.set(key, value);
      router.replace(`/explore?${params.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  const clearParams = useCallback(() => {
    router.replace("/explore", { scroll: false });
  }, [router]);

  const handleGigClick = useCallback(
    (gig: Gig) => {
      setSelectedGig(gig);
      setSelectedRoom(null);
      pushParam("gig", gig.id);
    },
    [pushParam],
  );
  const handleGigClose = useCallback(() => {
    setSelectedGig(null);
    clearParams();
  }, [clearParams]);
  const handleGigUpdated = useCallback((updated: Gig) => {
    setGigs((prev) => prev.map((g) => (g.id === updated.id ? updated : g)));
    setSelectedGig(updated);
  }, []);
  const handleGigDeleted = useCallback(
    (id: string) => {
      setGigs((prev) => prev.filter((g) => g.id !== id));
      setSelectedGig(null);
      clearParams();
    },
    [clearParams],
  );
  const handleGigRoomClick = useCallback(
    (roomId: string) => {
      setSelectedGig(null);
      const room = rooms.find((r) => r.id === roomId);
      if (room) {
        setSelectedRoom(room);
        pushParam("room", roomId);
      }
    },
    [rooms, pushParam],
  );

  // Room handlers
  const handleRoomClick = useCallback(
    (room: Room) => {
      setSelectedRoom(room);
      setSelectedGig(null);
      pushParam("room", room.id);
    },
    [pushParam],
  );
  const handleRoomClose = useCallback(() => {
    setSelectedRoom(null);
    clearParams();
  }, [clearParams]);
  const handleRoomUpdated = useCallback((updated: Room) => {
    setRooms((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    setSelectedRoom(updated);
  }, []);
  const handleRoomDeleted = useCallback(
    (id: string) => {
      setRooms((prev) => prev.filter((r) => r.id !== id));
      setSelectedRoom(null);
      clearParams();
    },
    [clearParams],
  );
  const handleJoinRoom = useCallback(async () => {
    if (!selectedRoom) return;
    setJoining(true);
    try {
      if (user) {
        const isMember = selectedRoom.members?.some((m) => m.id === user.id);
        if (!isMember) await joinRoom(selectedRoom.id);
      }
      setNetworkRoomsLoaded(false);
      router.push(`/network/${selectedRoom.id}`);
    } catch {
      setJoining(false);
    }
  }, [selectedRoom, user, router, setNetworkRoomsLoaded]);

  const avatarUrl = user?.avatarUrl || null;
  const isOwner = (gig: Gig) => !!user && gig.creatorId === user.id;
  const isRoomOwner = (room: Room) => !!user && room.creatorId === user.id;

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

      <AnimatePresence mode="wait">
        {selectedGig ? (
          <GigDetail
            key={`gig-${selectedGig.id}`}
            gig={selectedGig}
            isOwner={isOwner(selectedGig)}
            onClose={handleGigClose}
            onUpdated={handleGigUpdated}
            onDeleted={handleGigDeleted}
            onRoomClick={handleGigRoomClick}
            isLoggedIn={!!user}
          />
        ) : selectedRoom ? (
          <RoomPanel
            key={`room-${selectedRoom.id}`}
            room={selectedRoom}
            isOwner={isRoomOwner(selectedRoom)}
            onClose={handleRoomClose}
            onJoin={handleJoinRoom}
            onUpdated={handleRoomUpdated}
            onDeleted={handleRoomDeleted}
            joining={joining}
            isLoggedIn={!!user}
          />
        ) : null}
      </AnimatePresence>

      {/* Profile Completion Nudge */}
      <AnimatePresence>
        {showNudge && user && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleNudgeClose}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-[340px] bg-[#1a1a1a]/90 backdrop-blur-2xl border border-white/10 rounded-[32px] p-8 flex flex-col items-center text-center shadow-[0_32px_64px_-12px_rgba(0,0,0,0.8)]"
            >
              <button
                onClick={handleNudgeClose}
                className="absolute top-6 right-6 p-1 text-zinc-500 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>

              <div className="w-16 h-16 flex items-center justify-center mb-6">
                <Image
                  src="/slymelogo.png"
                  alt="Slyme"
                  width={60}
                  height={60}
                  className="object-contain drop-shadow-[0_0_15px_rgba(92,176,56,0.2)]"
                />
              </div>

              <div className="space-y-2 mb-8">
                <h3 className="text-[18px] font-bold text-white leading-tight px-4">
                  Tips: Update profile to let people know about you more
                </h3>
                <p className="text-zinc-500 text-[13px]">
                  Complete your profile to build trust.
                </p>
              </div>

              <div className="w-full space-y-5">
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    handleNudgeClose();
                    router.push(`/${user.username}?mode=edit`);
                  }}
                  className="w-full bg-[#5cb038] text-white py-3 rounded-[16px] font-bold text-[16px] hover:bg-[#4d942e] transition-all shadow-lg shadow-[#5cb038]/10"
                >
                  Edit Profile
                </motion.button>

                <div className="flex items-center justify-center gap-2">
                  <div
                    onClick={() => setDontShowAgain(!dontShowAgain)}
                    className={`w-4 h-4 rounded-md border flex items-center justify-center cursor-pointer transition-all ${
                      dontShowAgain
                        ? "bg-[#5cb038] border-[#5cb038]"
                        : "border-zinc-700 hover:border-zinc-500 bg-zinc-800/50"
                    }`}
                  >
                    {dontShowAgain && (
                      <Check size={12} className="text-white" strokeWidth={4} />
                    )}
                  </div>
                  <span
                    onClick={() => setDontShowAgain(!dontShowAgain)}
                    className="text-[11px] text-zinc-500 cursor-pointer hover:text-zinc-400 transition-colors select-none font-medium"
                  >
                    Don't show again
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Location Name (reverse geocode) ─── */
function LocationName({ lat, lng }: { lat: number; lng: number }) {
  const [name, setName] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14`,
    )
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled && data.display_name) {
          // Shorten: take first 2-3 parts
          const parts = data.display_name.split(", ");
          setName(parts.slice(0, 3).join(", "));
        }
      })
      .catch(() => {
        if (!cancelled) setName(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
      });
    return () => {
      cancelled = true;
    };
  }, [lat, lng]);

  if (!name) return null;

  return (
    <div className="px-6 pb-3 flex items-center gap-3">
      <MapPin size={14} className="text-zinc-500 shrink-0" />
      <p className="text-xs text-zinc-400">{name}</p>
    </div>
  );
}

/* ─── Room Panel ─── */
function RoomPanel({
  room,
  isOwner,
  onClose,
  onJoin,
  onUpdated,
  onDeleted,
  joining,
  isLoggedIn,
}: {
  room: Room;
  isOwner: boolean;
  onClose: () => void;
  onJoin: () => void;
  onUpdated: (room: Room) => void;
  onDeleted: (id: string) => void;
  joining: boolean;
  isLoggedIn: boolean;
}) {
  const memberCount = room._count?.members || room.members?.length || 0;
  const [isMobile, setIsMobile] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  useEffect(() => {
    if (showEdit) return;
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [showEdit]);

  const panelContent = (
    <div className="flex flex-col h-full relative">
      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto scrollbar-hide py-4">
        {/* Image */}
        <div className="mx-4 rounded-xl overflow-hidden aspect-[16/10] bg-zinc-900">
          {room.imageUrl ? (
            <img
              src={room.imageUrl}
              alt={room.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-zinc-900 flex items-center justify-center">
              <span className="text-6xl font-light text-zinc-700">
                {room.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>

        {/* Title + share */}
        <div className="px-6 pt-4 pb-1 flex items-start justify-between gap-3">
          <h2 className="text-2xl font-normal text-white leading-snug flex-1">
            {room.name}
          </h2>
          <div className="shrink-0 mt-1">
            <ShareMenu type="room" id={room.id} isLoggedIn={isLoggedIn} />
          </div>
        </div>

        {/* Description */}
        {room.description && (
          <div className="px-6 pb-3">
            <p className="text-sm text-zinc-400 leading-relaxed">
              {room.description}
            </p>
          </div>
        )}

        {/* Type capsule + members */}
        <div className="px-6 pb-3 flex items-center gap-2 flex-wrap">
          {room.type && (
            <span className="px-3 py-1 rounded-full bg-zinc-800 text-xs text-zinc-300 font-medium">
              {room.type}
            </span>
          )}
          <span className="px-3 py-1 rounded-full bg-zinc-800 text-xs text-zinc-300 font-medium flex items-center gap-1.5">
            <Users size={12} className="text-zinc-500" />
            {memberCount} {memberCount === 1 ? "member" : "members"}
          </span>
        </div>

        {/* Location */}
        <LocationName lat={room.latitude} lng={room.longitude} />

        {/* Creator */}
        {room.createdBy && (
          <div className="px-6 py-3 flex items-center gap-3">
            {room.createdBy.avatarUrl ? (
              <img
                src={room.createdBy.avatarUrl}
                className="w-8 h-8 rounded-full object-cover"
                alt=""
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-sm text-zinc-400">
                {(room.createdBy.username ||
                  room.createdBy.name ||
                  "?")[0].toUpperCase()}
              </div>
            )}
            <div>
              <p className="text-sm text-white">
                {room.createdBy.username || room.createdBy.name || "Anonymous"}
              </p>
              <p className="text-xs text-zinc-500">Creator</p>
            </div>
          </div>
        )}

        <div className="h-6" />
      </div>

      {/* Bottom action */}
      <div className="px-6 py-4 shrink-0">
        {isOwner ? (
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowEdit(true)}
            className="w-full py-3 rounded-full bg-white hover:bg-zinc-200 text-black font-medium text-sm flex items-center justify-center gap-2 transition"
          >
            <Pencil size={15} />
            Edit Room
          </motion.button>
        ) : (
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
        )}
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
          <button
            onClick={onClose}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 w-7 h-14 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <ChevronRight size={16} />
          </button>
          {panelContent}
        </motion.div>
      )}

      {/* Mobile — vaul Drawer */}
      {isMobile && (
        <Drawer.Root
          open
          onOpenChange={(open) => {
            if (!open) onClose();
          }}
        >
          <Drawer.Portal>
            <Drawer.Overlay className="fixed inset-0 z-[10000] bg-black/60" />
            <Drawer.Content className="fixed bottom-0 left-0 right-0 z-[10001] bg-zinc-950 rounded-t-2xl max-h-[85vh] flex flex-col outline-none overflow-hidden">
              <div className="flex justify-center pt-2 pb-1 shrink-0">
                <div className="w-9 h-1 rounded-full bg-zinc-700" />
              </div>
              <div className="flex-1 overflow-y-auto">{panelContent}</div>
            </Drawer.Content>
          </Drawer.Portal>
        </Drawer.Root>
      )}

      {/* Edit Modal */}
      <AnimatePresence>
        {showEdit && (
          <EditRoomModal
            room={room}
            onClose={() => setShowEdit(false)}
            onUpdated={(updated) => {
              onUpdated(updated);
              setShowEdit(false);
            }}
            onDeleted={onDeleted}
          />
        )}
      </AnimatePresence>
    </>
  );
}
