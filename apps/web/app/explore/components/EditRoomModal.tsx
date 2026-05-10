"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, Trash2 } from "lucide-react";
import { Room } from "@/types/room";
import { UpdateRoomPayload } from "@/types/room";
import { updateRoom, deleteRoom } from "@/services/room/service";

interface EditRoomModalProps {
  room: Room;
  onClose: () => void;
  onUpdated: (room: Room) => void;
  onDeleted: (id: string) => void;
}

export default function EditRoomModal({ room, onClose, onUpdated, onDeleted }: EditRoomModalProps) {
  const [name, setName] = useState(room.name);
  const [description, setDescription] = useState(room.description || "");
  const [type, setType] = useState(room.type || "");
  const [imageUrl, setImageUrl] = useState(room.imageUrl || "");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (res.ok) {
        const { url } = await res.json();
        setImageUrl(url);
      }
    } catch {}
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: UpdateRoomPayload = {};
      if (name !== room.name) payload.name = name;
      if (description !== (room.description || "")) payload.description = description;
      if (type !== (room.type || "")) payload.type = type;
      if (imageUrl !== (room.imageUrl || "")) payload.imageUrl = imageUrl;
      const updated = await updateRoom(room.id, payload);
      onUpdated(updated);
      onClose();
    } catch {}
    setSaving(false);
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

  const inputClass = "w-full p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-sm outline-none focus:border-zinc-600 transition placeholder:text-zinc-600";

  return (
    <>
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
            <span className="text-sm font-medium text-white">Edit Room</span>
            <div className="w-[18px]" />
          </div>

          {/* Scrollable form */}
          <div className="flex-1 overflow-y-auto px-5 py-4">
            <div className="flex flex-col gap-4">
              {/* Image */}
              <div className="flex flex-col gap-2">
                <span className="text-zinc-400 text-xs">Cover Image</span>
                <div className="relative rounded-xl overflow-hidden aspect-[16/10] bg-zinc-900">
                  {imageUrl && (
                    <img src={imageUrl} alt="" className="w-full h-full object-cover" />
                  )}
                  <div className="absolute inset-0 flex items-center justify-center">
                    {uploading ? (
                      <Loader2 size={20} className="animate-spin text-zinc-400" />
                    ) : (
                      <button
                        type="button"
                        onClick={() => fileRef.current?.click()}
                        className="px-4 py-2 rounded-lg bg-black/60 backdrop-blur-sm text-xs text-white hover:bg-black/80 transition"
                      >
                        {imageUrl ? "Change" : "Upload"}
                      </button>
                    )}
                  </div>
                </div>
                <input ref={fileRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
              </div>

              {/* Name */}
              <div className="flex flex-col gap-1.5">
                <span className="text-zinc-400 text-xs">Name</span>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Room name" className={inputClass} />
              </div>

              {/* Description */}
              <div className="flex flex-col gap-1.5">
                <span className="text-zinc-400 text-xs">Description</span>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" rows={3} className={`${inputClass} resize-none`} />
              </div>

              {/* Type */}
              <div className="flex flex-col gap-1.5">
                <span className="text-zinc-400 text-xs">Type</span>
                <input value={type} onChange={(e) => setType(e.target.value)} placeholder="e.g. Community, Gaming" className={inputClass} />
              </div>
            </div>
          </div>

          {/* Bottom: Save + Delete */}
          <div className="px-5 py-4 border-t border-zinc-800 shrink-0 flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 py-3 rounded-full bg-white hover:bg-zinc-200 text-black font-medium text-sm flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              {saving ? <Loader2 size={15} className="animate-spin" /> : "Save"}
            </button>
            <button
              onClick={() => setConfirmDelete(true)}
              className="w-12 py-3 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 flex items-center justify-center transition"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </motion.div>
      </motion.div>

      {/* Delete confirmation modal */}
      <AnimatePresence>
        {confirmDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[6000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setConfirmDelete(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="w-full max-w-sm bg-zinc-900 rounded-2xl p-6 border border-zinc-800"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-base font-medium text-white mb-2">Delete Room?</h3>
              <p className="text-sm text-zinc-400 mb-5">Are you sure? This will permanently delete this room and all its messages.</p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmDelete(false)} className="flex-1 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-sm text-white font-medium transition">
                  Cancel
                </button>
                <button onClick={handleDelete} disabled={deleting} className="flex-1 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-sm text-white font-medium transition disabled:opacity-50 flex items-center justify-center gap-2">
                  {deleting ? <Loader2 size={14} className="animate-spin" /> : "Delete"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
