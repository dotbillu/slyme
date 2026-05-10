"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Drawer } from "vaul";
import { useRouter } from "next/navigation";
import {
  X, MapPin, Pencil, Trash2, Loader2, ArrowLeft, Check,
  ChevronLeft, ChevronRight, Upload, Clock, Calendar, Award, Search, Users,
} from "lucide-react";
import { Gig, GIG_TYPES, UpdateGigPayload } from "@/types/gig";
import { updateGig, deleteGig } from "@/services/gig/service";
import { socket } from "@/lib/socket";
import { Room } from "@/types/room";
import ShareMenu from "./ShareMenu";

interface GigDetailProps {
  gig: Gig;
  isOwner: boolean;
  onClose: () => void;
  onUpdated: (gig: Gig) => void;
  onDeleted: (id: string) => void;
  onRoomClick?: (roomId: string) => void;
  isLoggedIn?: boolean;
}

function formatDate(d: string | null) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
  });
}

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

/* ─── Image Carousel ─── */
function ImageCarousel({ images, onImageClick }: { images: string[]; onImageClick: (i: number) => void }) {
  const [current, setCurrent] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  if (images.length === 0) return null;

  const scrollTo = (i: number) => {
    setCurrent(i);
    ref.current?.scrollTo({ left: i * (ref.current?.clientWidth || 0), behavior: "smooth" });
  };

  return (
    <div className="relative bg-zinc-900 mx-4 rounded-xl overflow-hidden">
      <div
        ref={ref}
        className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide"
        onScroll={(e) => {
          const el = e.currentTarget;
          const i = Math.round(el.scrollLeft / el.clientWidth);
          if (i !== current) setCurrent(i);
        }}
      >
        {images.map((url, i) => (
          <div key={i} className="w-full flex-shrink-0 aspect-[16/10] snap-center cursor-pointer" onClick={() => onImageClick(i)}>
            <img src={url} alt="" className="w-full h-full object-cover" />
          </div>
        ))}
      </div>
      {images.length > 1 && (
        <>
          <button onClick={() => scrollTo(current > 0 ? current - 1 : images.length - 1)} className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80 transition">
            <ChevronLeft size={16} />
          </button>
          <button onClick={() => scrollTo(current < images.length - 1 ? current + 1 : 0)} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80 transition">
            <ChevronRight size={16} />
          </button>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
            {images.map((_, i) => (
              <div key={i} className={`h-1.5 rounded-full transition-all ${i === current ? "w-4 bg-white" : "w-1.5 bg-white/40"}`} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ─── Lightbox ─── */
function Lightbox({ images, startIndex, onClose }: { images: string[]; startIndex: number; onClose: () => void }) {
  const [current, setCurrent] = useState(startIndex);
  const prev = () => setCurrent(current > 0 ? current - 1 : images.length - 1);
  const next = () => setCurrent(current < images.length - 1 ? current + 1 : 0);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[9999] bg-black flex items-center justify-center" onClick={onClose}>
      <button onClick={onClose} className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white z-10"><X size={18} /></button>
      {images.length > 1 && <div className="absolute top-4 left-4 px-2.5 py-1 rounded-full bg-white/10 text-white text-xs">{current + 1}/{images.length}</div>}
      <motion.img key={current} initial={{ opacity: 0 }} animate={{ opacity: 1 }} src={images[current]} alt="" className="max-w-[92vw] max-h-[92vh] object-contain" onClick={(e) => e.stopPropagation()} />
      {images.length > 1 && (
        <>
          <button onClick={(e) => { e.stopPropagation(); prev(); }} className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"><ChevronLeft size={20} /></button>
          <button onClick={(e) => { e.stopPropagation(); next(); }} className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"><ChevronRight size={20} /></button>
        </>
      )}
    </motion.div>
  );
}

/* ─── Location Name for Gig ─── */
function GigLocationName({ lat, lng }: { lat: number; lng: number }) {
  const [name, setName] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled && data.display_name) {
          const parts = data.display_name.split(", ");
          setName(parts.slice(0, 3).join(", "));
        }
      })
      .catch(() => {
        if (!cancelled) setName(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
      });
    return () => { cancelled = true; };
  }, [lat, lng]);

  if (!name) return null;

  return (
    <div className="flex items-center gap-3">
      <MapPin size={14} className="text-zinc-500 shrink-0" />
      <p className="text-xs text-zinc-400">{name}</p>
    </div>
  );
}

/* ─── Detail View ─── */
function DetailView({ gig, isOwner, onEdit, onImageClick, onRoomClick, isLoggedIn }: {
  gig: Gig; isOwner: boolean;
  onEdit: () => void;
  onImageClick: (i: number) => void; onRoomClick?: (roomId: string) => void; isLoggedIn: boolean;
}) {
  const router = useRouter();

  return (
    <div className="flex-1 overflow-y-auto scrollbar-hide py-4">
      {/* Image or placeholder */}
      {gig.imageUrls.length > 0 ? (
        <div className="relative">
          <ImageCarousel images={gig.imageUrls} onImageClick={onImageClick} />
          {gig.createdBy && (
            <div className="absolute bottom-3 left-7 z-10">
              <button
                onClick={() => { if (gig.createdBy?.username) router.push(`/${gig.createdBy.username}`); }}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-black/60 backdrop-blur-sm hover:bg-black/80 transition"
              >
                {gig.createdBy.avatarUrl ? (
                  <img src={gig.createdBy.avatarUrl} className="w-5 h-5 rounded-full object-cover" alt="" />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-zinc-700 flex items-center justify-center text-[9px] text-white font-medium">
                    {(gig.createdBy.username || gig.createdBy.name || "?")[0].toUpperCase()}
                  </div>
                )}
                <span className="text-xs text-white font-medium">{gig.createdBy.username || gig.createdBy.name || "Anonymous"}</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="mx-4 rounded-xl overflow-hidden aspect-[16/10] bg-zinc-900 relative flex items-center justify-center">
          <span className="text-6xl font-light text-zinc-700">{gig.title.charAt(0).toUpperCase()}</span>
          {gig.createdBy && (
            <div className="absolute bottom-3 left-3">
              <button
                onClick={() => { if (gig.createdBy?.username) router.push(`/${gig.createdBy.username}`); }}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-black/60 backdrop-blur-sm hover:bg-black/80 transition"
              >
                {gig.createdBy.avatarUrl ? (
                  <img src={gig.createdBy.avatarUrl} className="w-5 h-5 rounded-full object-cover" alt="" />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-zinc-700 flex items-center justify-center text-[9px] text-white font-medium">
                    {(gig.createdBy.username || gig.createdBy.name || "?")[0].toUpperCase()}
                  </div>
                )}
                <span className="text-xs text-white font-medium">{gig.createdBy.username || gig.createdBy.name || "Anonymous"}</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Title row with share + edit */}
      <div className="px-6 pt-4 pb-1 flex items-start justify-between gap-3">
        <h2 className="text-2xl font-normal text-white leading-snug flex-1">{gig.title}</h2>
        <div className="flex items-center gap-1.5 shrink-0 mt-1">
          <ShareMenu type="gig" id={gig.id} isLoggedIn={isLoggedIn} />
          {isOwner && (
            <button onClick={onEdit} className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition" aria-label="Edit">
              <Pencil size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Description below title */}
      {gig.description && (
        <div className="px-6 pb-3">
          <p className="text-sm text-zinc-400 leading-relaxed whitespace-pre-wrap">{gig.description}</p>
        </div>
      )}

      {/* Type capsule + reward capsule */}
      <div className="px-6 pb-3 flex items-center gap-2 flex-wrap">
        {gig.type && (
          <span className="px-3 py-1 rounded-full bg-zinc-800 text-xs text-zinc-300 font-medium">{gig.type}</span>
        )}
        {gig.reward && (
          <span className="px-3 py-1 rounded-full bg-zinc-800 text-xs text-zinc-300 font-medium flex items-center gap-1.5">
            <Award size={12} className="text-zinc-500" />
            {gig.reward}
          </span>
        )}
      </div>

      {/* Location */}
      <div className="px-6 pb-3">
        <GigLocationName lat={gig.latitude} lng={gig.longitude} />
      </div>

      {/* Time info */}
      <div className="px-6 flex flex-col gap-2 pb-3">
        {(gig.gigTime || gig.date) && (
          <div className="flex items-center gap-3">
            <Calendar size={14} className="text-zinc-500 shrink-0" />
            <p className="text-xs text-zinc-400">{formatDate(gig.gigTime || gig.date)}</p>
          </div>
        )}

        {gig.expiresAt && (
          <div className="flex items-center gap-3">
            <Clock size={14} className="text-zinc-500 shrink-0" />
            <p className="text-xs text-zinc-400">Expires {formatDate(gig.expiresAt)}</p>
          </div>
        )}
      </div>

      <div className="h-6" />
    </div>
  );
}

/* ─── Edit View (modal overlay style, same as create/gig form) ─── */
function EditView({ gig, onCancel, onSave, saveRef }: {
  gig: Gig; onCancel: () => void;
  onSave: (payload: UpdateGigPayload) => Promise<void>;
  saveRef?: React.MutableRefObject<(() => void) | null>;
}) {
  const [form, setForm] = useState({ title: gig.title, description: gig.description || "", reward: gig.reward || "", type: gig.type || GIG_TYPES[0] });
  const [imageUrls, setImageUrls] = useState<string[]>(gig.imageUrls || []);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Room picker state
  const [roomSearch, setRoomSearch] = useState("");
  const [roomResults, setRoomResults] = useState<Room[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<{ id: string; name: string; imageUrl: string | null } | null>(gig.room || null);
  const [roomSearching, setRoomSearching] = useState(false);

  // Room search via socket
  useEffect(() => {
    if (!roomSearch.trim()) {
      setRoomResults([]);
      return;
    }
    setRoomSearching(true);
    socket.connect();
    socket.emit("search", { query: roomSearch.trim() });

    const handleResults = (data: { rooms: Room[] }) => {
      setRoomResults(data.rooms || []);
      setRoomSearching(false);
    };
    socket.on("search_results", handleResults);
    return () => { socket.off("search_results", handleResults); };
  }, [roomSearch]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  const handleFiles = async (files: FileList | File[]) => {
    const arr = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (!arr.length) return;
    setUploading(true); setError(null);
    try { const urls = await Promise.all(arr.map(uploadFile)); setImageUrls((p) => [...p, ...urls]); }
    catch (err: any) { setError(err.message || "Upload failed"); }
    finally { setUploading(false); }
  };
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files?.length) { handleFiles(e.target.files); e.target.value = ""; } };
  const handleDrop = (e: React.DragEvent) => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files); };
  const removeImage = (i: number) => setImageUrls((p) => p.filter((_, idx) => idx !== i));
  const handleSave = async () => {
    if (!form.title.trim()) { setError("Title is required"); return; }
    setSaving(true); setError(null);
    try { await onSave({ title: form.title, description: form.description, reward: form.reward, type: form.type, imageUrls, roomId: selectedRoom?.id || null }); }
    catch (err: any) { setError(err.message || "Failed"); setSaving(false); }
  };

  // Expose save to parent
  useEffect(() => {
    if (saveRef) saveRef.current = handleSave;
  });

  const inputClass = "w-full p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-sm outline-none focus:border-zinc-600 transition placeholder:text-zinc-600";

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 shrink-0">
        <button onClick={onCancel} className="text-zinc-400 hover:text-white text-sm transition">Cancel</button>
        <span className="text-sm font-medium text-white">Edit Gig</span>
        <div className="w-12" />
      </div>

      {/* Scrollable form */}
      <div className="flex-1 overflow-y-auto scrollbar-hide px-5 pb-6">
        <div className="flex flex-col gap-4">
          {error && <div className="p-2.5 rounded-xl bg-red-500/10 text-red-400 text-xs text-center">{error}</div>}

          {/* Photos */}
          <div className="flex flex-col gap-2">
            <span className="text-zinc-400 text-xs">Photos</span>
            {imageUrls.length > 0 ? (
              <div onDrop={handleDrop} onDragOver={(e) => { e.preventDefault(); setDragOver(true); }} onDragLeave={(e) => { e.preventDefault(); setDragOver(false); }} className={`flex gap-2 flex-wrap ${dragOver ? "ring-1 ring-zinc-600 rounded-xl p-1" : ""}`}>
                {imageUrls.map((url, i) => (
                  <div key={i} className="relative group w-16 h-16">
                    <img src={url} alt="" className="w-full h-full rounded-lg object-cover" />
                    <button onClick={() => removeImage(i)} className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-zinc-700 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition"><X size={8} /></button>
                  </div>
                ))}
                <button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="w-16 h-16 rounded-lg border border-dashed border-zinc-700 hover:border-zinc-500 flex items-center justify-center transition">
                  {uploading ? <Loader2 size={14} className="text-zinc-400 animate-spin" /> : <Upload size={14} className="text-zinc-500" />}
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFileInput} className="hidden" />
              </div>
            ) : (
              <div onDrop={handleDrop} onDragOver={(e) => { e.preventDefault(); setDragOver(true); }} onDragLeave={(e) => { e.preventDefault(); setDragOver(false); }} onClick={() => fileInputRef.current?.click()} className={`flex flex-col items-center gap-1.5 p-5 rounded-xl border border-dashed cursor-pointer transition ${dragOver ? "border-zinc-500 bg-zinc-800/50" : "border-zinc-800 hover:border-zinc-600"}`}>
                {uploading ? <Loader2 size={18} className="text-zinc-400 animate-spin" /> : <Upload size={18} className="text-zinc-500" />}
                <p className="text-xs text-zinc-500">{uploading ? "Uploading..." : "Drop or click to add"}</p>
                <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFileInput} className="hidden" />
              </div>
            )}
          </div>

          <input name="title" value={form.title} onChange={handleChange} placeholder="Title" className={inputClass} />
          <textarea name="description" value={form.description} onChange={handleChange} rows={4} placeholder="Description" className={`${inputClass} resize-none`} />
          <div className="grid grid-cols-2 gap-3">
            <input name="reward" value={form.reward} onChange={handleChange} placeholder="Reward" className={inputClass} />
            <select name="type" value={form.type} onChange={handleChange} className={`${inputClass} appearance-none`}>
              {GIG_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {/* Room picker */}
          <div className="flex flex-col gap-1.5">
            <span className="text-zinc-400 text-xs flex items-center gap-1.5"><Users size={12} /> Connected Room</span>
            {selectedRoom ? (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-900 border border-zinc-800">
                <div className="w-7 h-7 rounded-full overflow-hidden bg-zinc-800 flex items-center justify-center shrink-0">
                  {selectedRoom.imageUrl ? (
                    <img src={selectedRoom.imageUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[10px] text-zinc-400 font-medium">{selectedRoom.name.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <p className="text-sm text-white truncate flex-1">{selectedRoom.name}</p>
                <button onClick={() => setSelectedRoom(null)} className="p-1 rounded-full hover:bg-zinc-800 text-zinc-500 hover:text-white transition">
                  <X size={12} />
                </button>
              </div>
            ) : (
              <div className="relative">
                <div className="flex items-center gap-2 p-3 rounded-xl bg-zinc-900 border border-zinc-800">
                  <Search size={14} className="text-zinc-500 shrink-0" />
                  <input
                    value={roomSearch}
                    onChange={(e) => setRoomSearch(e.target.value)}
                    placeholder="Search rooms..."
                    className="flex-1 bg-transparent text-sm text-white placeholder-zinc-600 outline-none"
                  />
                  {roomSearching && <Loader2 size={12} className="text-zinc-500 animate-spin" />}
                </div>
                {roomResults.length > 0 && roomSearch.trim() && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden z-10 max-h-40 overflow-y-auto">
                    {roomResults.map((room) => (
                      <button
                        key={room.id}
                        onClick={() => { setSelectedRoom({ id: room.id, name: room.name, imageUrl: room.imageUrl }); setRoomSearch(""); setRoomResults([]); }}
                        className="w-full flex items-center gap-3 px-3 py-2 hover:bg-zinc-800 transition text-left"
                      >
                        <div className="w-7 h-7 rounded-full overflow-hidden bg-zinc-800 flex items-center justify-center shrink-0">
                          {room.imageUrl ? (
                            <img src={room.imageUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-[10px] text-zinc-400 font-medium">{room.name.charAt(0).toUpperCase()}</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white truncate">{room.name}</p>
                          <p className="text-[10px] text-zinc-500">{room._count?.members || 0} members</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Export ─── */
export default function GigDetail({ gig, isOwner, onClose, onUpdated, onDeleted, onRoomClick, isLoggedIn = false }: GigDetailProps) {
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [currentGig, setCurrentGig] = useState(gig);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const editSaveRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const handleDelete = async () => {
    setDeleting(true);
    try { await deleteGig(currentGig.id); onDeleted(currentGig.id); } catch { setDeleting(false); setConfirmDelete(false); }
  };

  const handleSave = async (payload: UpdateGigPayload) => {
    const updated = await updateGig(currentGig.id, payload);
    setCurrentGig(updated); onUpdated(updated); setMode("view");
  };

  const content = (
    <div className="flex flex-col h-full relative">
      {mode === "view" ? (
        <>
          <DetailView gig={currentGig} isOwner={isOwner} onEdit={() => setMode("edit")} onImageClick={(i) => setLightboxIndex(i)} onRoomClick={onRoomClick} isLoggedIn={isLoggedIn} />
          {/* Connected room pinned at bottom */}
          {currentGig.room && onRoomClick && (
            <div className="px-5 py-3 shrink-0 border-t border-zinc-800/40">
              <p className="text-xs text-zinc-500 mb-2 px-1">Join Room</p>
              <button
                onClick={() => onRoomClick(currentGig.room!.id)}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 transition text-left"
              >
                <div className="w-8 h-8 rounded-full overflow-hidden bg-zinc-800 flex items-center justify-center shrink-0">
                  {currentGig.room.imageUrl ? (
                    <img src={currentGig.room.imageUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs text-zinc-400 font-medium">{currentGig.room.name.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <p className="text-sm text-white truncate flex-1">{currentGig.room.name}</p>
                <Users size={14} className="text-zinc-500 shrink-0" />
                <ChevronRight size={16} className="text-zinc-500 shrink-0" />
              </button>
            </div>
          )}
        </>
      ) : (
        <>
          <EditView gig={currentGig} onCancel={() => setMode("view")} onSave={handleSave} saveRef={editSaveRef} />
          {/* Save + Delete pinned at bottom in edit mode */}
          {isOwner && (
            <div className="px-5 py-3 shrink-0 border-t border-zinc-800/40 flex gap-2">
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => editSaveRef.current?.()}
                className="flex-1 py-3 rounded-full bg-white hover:bg-zinc-200 text-black font-medium text-sm flex items-center justify-center gap-2 transition"
              >
                <Check size={15} />
                Save
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => setConfirmDelete(true)}
                className="w-12 py-3 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 flex items-center justify-center transition"
              >
                <Trash2 size={15} />
              </motion.button>
            </div>
          )}
        </>
      )}

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
              <h3 className="text-base font-medium text-white mb-2">Delete Gig</h3>
              <p className="text-sm text-zinc-400 mb-5">This will permanently delete this gig. This can&apos;t be undone.</p>
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
                  {deleting ? <Loader2 size={14} className="animate-spin" /> : "Delete"}
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
          {content}
        </motion.div>
      )}

      {/* Mobile — vaul Drawer */}
      {isMobile && (
        <Drawer.Root open onOpenChange={(open) => { if (!open) onClose(); }}>
          <Drawer.Portal>
            <Drawer.Overlay className="fixed inset-0 z-[10000] bg-black/60" />
            <Drawer.Content className="fixed bottom-0 left-0 right-0 z-[10001] bg-zinc-950 rounded-t-2xl max-h-[85vh] flex flex-col outline-none overflow-hidden">
              <div className="flex justify-center pt-2 pb-1 shrink-0">
                <div className="w-9 h-1 rounded-full bg-zinc-700" />
              </div>
              <div className="flex-1 overflow-y-auto">
                {content}
              </div>
            </Drawer.Content>
          </Drawer.Portal>
        </Drawer.Root>
      )}

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxIndex !== null && currentGig.imageUrls.length > 0 && (
          <Lightbox images={currentGig.imageUrls} startIndex={lightboxIndex} onClose={() => setLightboxIndex(null)} />
        )}
      </AnimatePresence>
    </>
  );
}
