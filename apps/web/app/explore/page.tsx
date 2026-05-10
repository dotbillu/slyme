"use client";

import dynamic from "next/dynamic";
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
  Trash2,
  Loader2,
  Check,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "@/app/AuthProvider";
import { Gig } from "@/types/gig";
import { Room } from "@/types/room";
import { UpdateRoomPayload } from "@/types/room";
import { fetchAllGigs, fetchGigById } from "@/services/gig/service";
import {
  fetchAllRooms,
  fetchRoomById,
  joinRoom,
  updateRoom,
  deleteRoom,
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

async function uploadFile(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch("/api/upload", { method: "POST", body: formData });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Upload failed");
  }
  return (await res.json()).url;
}

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
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Edit form state
  const [editName, setEditName] = useState(room.name);
  const [editDescription, setEditDescription] = useState(
    room.description || "",
  );
  const [editType, setEditType] = useState(room.type || "");
  const [editImageUrl, setEditImageUrl] = useState(room.imageUrl || "");

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: UpdateRoomPayload = {};
      if (editName !== room.name) payload.name = editName;
      if (editDescription !== (room.description || ""))
        payload.description = editDescription;
      if (editType !== (room.type || "")) payload.type = editType;
      if (editImageUrl !== (room.imageUrl || ""))
        payload.imageUrl = editImageUrl;

      const updated = await updateRoom(room.id, payload);
      onUpdated(updated);
      setEditing(false);
    } catch {
      // silently fail
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteRoom(room.id);
      onDeleted(room.id);
    } catch {
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadFile(file);
      setEditImageUrl(url);
    } catch {
      // silently fail
    } finally {
      setUploading(false);
    }
  };

  const panelContent = (
    <div className="flex flex-col h-full relative">
      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto scrollbar-hide py-4">
        {/* Image */}
        <div className="mx-4 rounded-xl overflow-hidden aspect-[16/10] bg-zinc-900 relative">
          {editing ? (
            <label className="w-full h-full flex items-center justify-center cursor-pointer hover:bg-zinc-800 transition">
              {uploading ? (
                <Loader2 size={24} className="animate-spin text-zinc-500" />
              ) : editImageUrl ? (
                <img
                  src={editImageUrl}
                  alt={editName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-sm text-zinc-500">
                  Click to upload image
                </span>
              )}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
                disabled={uploading}
              />
            </label>
          ) : room.imageUrl ? (
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
          {editing ? (
            <input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="text-2xl font-normal text-white leading-snug flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 outline-none focus:border-zinc-500"
              placeholder="Room name"
            />
          ) : (
            <h2 className="text-2xl font-normal text-white leading-snug flex-1">
              {room.name}
            </h2>
          )}
          <div className="shrink-0 mt-1">
            <ShareMenu type="room" id={room.id} isLoggedIn={isLoggedIn} />
          </div>
        </div>

        {/* Description below title */}
        {editing ? (
          <div className="px-6 pb-3">
            <textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              className="text-sm text-zinc-300 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 w-full outline-none focus:border-zinc-500 resize-none"
              rows={3}
              placeholder="Description"
            />
          </div>
        ) : room.description ? (
          <div className="px-6 pb-3">
            <p className="text-sm text-zinc-400 leading-relaxed">
              {room.description}
            </p>
          </div>
        ) : null}

        {/* Type capsule + members */}
        <div className="px-6 pb-3 flex items-center gap-2 flex-wrap">
          {editing ? (
            <input
              value={editType}
              onChange={(e) => setEditType(e.target.value)}
              className="text-sm text-zinc-300 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 outline-none focus:border-zinc-500"
              placeholder="Room type (e.g. Gaming, Music)"
            />
          ) : room.type ? (
            <span className="px-3 py-1 rounded-full bg-zinc-800 text-xs text-zinc-300 font-medium">
              {room.type}
            </span>
          ) : null}
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

      {/* Bottom action buttons */}
      <div className="px-6 py-4 shrink-0">
        {isOwner ? (
          editing ? (
            <div className="flex gap-2">
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-3 rounded-full bg-white hover:bg-zinc-200 text-black font-medium text-sm flex items-center justify-center gap-2 transition disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <>
                    <Check size={15} />
                    Save
                  </>
                )}
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => setConfirmDelete(true)}
                className="w-12 py-3 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 flex items-center justify-center transition"
              >
                <Trash2 size={15} />
              </motion.button>
            </div>
          ) : (
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => setEditing(true)}
              className="w-full py-3 rounded-full bg-white hover:bg-zinc-200 text-black font-medium text-sm flex items-center justify-center gap-2 transition"
            >
              <Pencil size={15} />
              Edit Room
            </motion.button>
          )
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

      {/* Delete confirmation modal */}
      <AnimatePresence>
        {confirmDelete && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[2000] bg-black/60 backdrop-blur-sm"
              onClick={() => setConfirmDelete(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed z-[2001] inset-x-6 top-1/2 -translate-y-1/2 mx-auto max-w-sm bg-zinc-900 rounded-2xl p-6 border border-zinc-800"
            >
              <h3 className="text-base font-medium text-white mb-2">
                Delete Room
              </h3>
              <p className="text-sm text-zinc-400 mb-5">
                This will permanently delete this room and all its messages.
                This can&apos;t be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="flex-1 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-sm text-white font-medium transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex-1 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-sm text-white font-medium transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {deleting ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    "Delete"
                  )}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
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
          {/* Close button on left edge */}
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
    </>
  );
}
