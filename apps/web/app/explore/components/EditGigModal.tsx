"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { X, Loader2, Upload, Trash2, Search, Users } from "lucide-react";
import { Gig, GIG_TYPES, UpdateGigPayload } from "@/types/gig";
import { updateGig, deleteGig } from "@/services/gig/service";
import { socket } from "@/lib/socket";
import { Room } from "@/types/room";

interface EditGigModalProps {
  gig: Gig;
  onClose: () => void;
  onUpdated: (gig: Gig) => void;
  onDeleted: (id: string) => void;
}

export default function EditGigModal({ gig, onClose, onUpdated, onDeleted }: EditGigModalProps) {
  const [title, setTitle] = useState(gig.title);
  const [description, setDescription] = useState(gig.description || "");
  const [reward, setReward] = useState(gig.reward || "");
  const [type, setType] = useState(gig.type || GIG_TYPES[0]);
  const [imageUrls, setImageUrls] = useState<string[]>(gig.imageUrls || []);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Room picker
  const [roomSearch, setRoomSearch] = useState("");
  const [roomResults, setRoomResults] = useState<Room[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<{ id: string; name: string; imageUrl: string | null } | null>(gig.room || null);
  const [roomSearching, setRoomSearching] = useState(false);

  useEffect(() => {
    if (!roomSearch.trim()) { setRoomResults([]); return; }
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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    setUploading(true);
    try {
      const newUrls: string[] = [];
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        if (res.ok) {
          const { url } = await res.json();
          newUrls.push(url);
        }
      }
      setImageUrls((prev) => [...prev, ...newUrls]);
    } catch {}
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const removeImage = (i: number) => setImageUrls((prev) => prev.filter((_, idx) => idx !== i));

  const handleSave = async () => {
    if (!title.trim()) { setError("Title is required"); return; }
    setSaving(true);
    setError(null);
    try {
      const payload: UpdateGigPayload = {
        title,
        description,
        reward,
        type,
        imageUrls,
        roomId: selectedRoom?.id || null,
      };
      const updated = await updateGig(gig.id, payload);
      onUpdated(updated);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed");
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteGig(gig.id);
      onDeleted(gig.id);
    } catch {
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  const inputClass = "w-full p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-sm outline-none focus:border-zinc-600 transition placeholder:text-zinc-600";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[5000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="w-full max-w-md max-h-[85vh] bg-zinc-950 rounded-2xl border border-zinc-800 flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 shrink-0">
          <button onClick={onClose} className="text-zinc-400 hover:text-white transition">
            <X size={18} />
          </button>
          <span className="text-sm font-medium text-white">Edit Gig</span>
          <button onClick={handleSave} disabled={saving} className="text-sm font-medium text-white hover:text-zinc-300 transition disabled:opacity-50">
            {saving ? <Loader2 size={14} className="animate-spin" /> : "Save"}
          </button>
        </div>

        {/* Scrollable form */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div className="flex flex-col gap-4">
            {error && <div className="p-2.5 rounded-xl bg-red-500/10 text-red-400 text-xs text-center">{error}</div>}

            {/* Photos */}
            <div className="flex flex-col gap-2">
              <span className="text-zinc-400 text-xs">Photos</span>
              <div className="flex gap-2 flex-wrap">
                {imageUrls.map((url, i) => (
                  <div key={i} className="relative group w-16 h-16">
                    <img src={url} alt="" className="w-full h-full rounded-lg object-cover" />
                    <button onClick={() => removeImage(i)} className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-zinc-700 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                      <X size={8} />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="w-16 h-16 rounded-lg border border-dashed border-zinc-700 hover:border-zinc-500 flex items-center justify-center transition"
                >
                  {uploading ? <Loader2 size={14} className="text-zinc-400 animate-spin" /> : <Upload size={14} className="text-zinc-500" />}
                </button>
              </div>
              <input ref={fileRef} type="file" accept="image/*" multiple onChange={handleFileChange} className="hidden" />
            </div>

            {/* Title */}
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" className={inputClass} />

            {/* Description */}
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Description" className={`${inputClass} resize-none`} />

            {/* Reward + Type */}
            <div className="grid grid-cols-2 gap-3">
              <input value={reward} onChange={(e) => setReward(e.target.value)} placeholder="Reward" className={inputClass} />
              <select value={type} onChange={(e) => setType(e.target.value)} className={`${inputClass} appearance-none`}>
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

        {/* Delete */}
        <div className="px-5 py-3 border-t border-zinc-800 shrink-0">
          {confirmDelete ? (
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(false)} className="flex-1 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-sm text-white font-medium transition">
                Cancel
              </button>
              <button onClick={handleDelete} disabled={deleting} className="flex-1 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-sm text-white font-medium transition disabled:opacity-50 flex items-center justify-center gap-2">
                {deleting ? <Loader2 size={14} className="animate-spin" /> : "Delete"}
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="w-full py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-sm text-zinc-400 font-medium transition flex items-center justify-center gap-2"
            >
              <Trash2 size={14} />
              Delete Gig
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
