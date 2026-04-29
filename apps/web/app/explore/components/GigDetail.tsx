"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, MapPin, Clock, Calendar, Tag, Award, Pencil, Trash2,
  Loader2, ArrowLeft, Check,
} from "lucide-react";
import { Gig, GIG_TYPES, UpdateGigPayload } from "@/types/gig";
import { updateGig, deleteGig } from "@/services/gig/service";

interface GigDetailProps {
  gig: Gig;
  isOwner: boolean;
  onClose: () => void;
  onUpdated: (gig: Gig) => void;
  onDeleted: (id: string) => void;
}

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

/* ─── Read-only detail view ─── */
function DetailView({ gig, isOwner, onEdit, onDelete, deleting }: {
  gig: Gig; isOwner: boolean;
  onEdit: () => void; onDelete: () => void; deleting: boolean;
}) {
  return (
    <div className="flex flex-col gap-5">
      {/* Image */}
      {gig.imageUrls.length > 0 && (
        <div className="w-full aspect-video rounded-xl overflow-hidden bg-zinc-800">
          <img src={gig.imageUrls[0]} alt={gig.title} className="w-full h-full object-cover" />
        </div>
      )}

      {/* Title & type badge */}
      <div>
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-lg font-semibold text-white leading-tight">{gig.title}</h2>
          {gig.type && (
            <span className="shrink-0 text-[10px] px-2 py-1 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700">
              {gig.type}
            </span>
          )}
        </div>
        {gig.createdBy && (
          <div className="flex items-center gap-2 mt-2">
            {gig.createdBy.avatarUrl && (
              <img src={gig.createdBy.avatarUrl} className="w-5 h-5 rounded-full object-cover" alt="" />
            )}
            <span className="text-xs text-zinc-500">
              {gig.createdBy.username || gig.createdBy.name || "Anonymous"}
            </span>
          </div>
        )}
      </div>

      {/* Description */}
      {gig.description && (
        <p className="text-sm text-zinc-400 leading-relaxed">{gig.description}</p>
      )}

      {/* Info rows */}
      <div className="flex flex-col gap-3">
        {gig.reward && (
          <div className="flex items-center gap-3 text-sm">
            <Award size={14} className="text-green-400 shrink-0" />
            <span className="text-zinc-300">{gig.reward}</span>
          </div>
        )}
        <div className="flex items-center gap-3 text-sm">
          <Calendar size={14} className="text-blue-400 shrink-0" />
          <span className="text-zinc-300">{formatDate(gig.gigTime || gig.date)}</span>
        </div>
        {gig.expiresAt && (
          <div className="flex items-center gap-3 text-sm">
            <Clock size={14} className="text-orange-400 shrink-0" />
            <span className="text-zinc-300">Expires {formatDate(gig.expiresAt)}</span>
          </div>
        )}
        {gig.latitude && gig.longitude && (
          <div className="flex items-center gap-3 text-sm">
            <MapPin size={14} className="text-red-400 shrink-0" />
            <span className="text-zinc-300 text-xs">{gig.latitude.toFixed(4)}, {gig.longitude.toFixed(4)}</span>
          </div>
        )}
      </div>

      <p className="text-[10px] text-zinc-600">
        Created {formatDate(gig.createdAt)}
      </p>

      {/* Owner actions */}
      {isOwner && (
        <div className="flex gap-3 pt-2 border-t border-zinc-800">
          <button
            onClick={onEdit}
            className="flex-1 flex items-center justify-center gap-2 p-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-sm transition"
          >
            <Pencil size={14} /> Edit
          </button>
          <button
            onClick={onDelete}
            disabled={deleting}
            className="flex-1 flex items-center justify-center gap-2 p-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm transition disabled:opacity-50"
          >
            {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
            {deleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      )}
    </div>
  );
}

/* ─── Edit view ─── */
function EditView({ gig, onCancel, onSave }: {
  gig: Gig; onCancel: () => void;
  onSave: (payload: UpdateGigPayload) => Promise<void>;
}) {
  const [form, setForm] = useState({
    title: gig.title,
    description: gig.description || "",
    reward: gig.reward || "",
    type: gig.type || GIG_TYPES[0],
    imageUrl: gig.imageUrls[0] || "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const handleSave = async () => {
    if (!form.title.trim()) { setError("Title is required"); return; }
    setSaving(true);
    setError(null);
    try {
      await onSave({
        title: form.title,
        description: form.description,
        reward: form.reward,
        type: form.type,
        imageUrls: form.imageUrl ? [form.imageUrl] : [],
      });
    } catch (err: any) {
      setError(err.message || "Failed to save");
      setSaving(false);
    }
  };

  const inputClass = "w-full p-3 rounded-xl bg-zinc-800 text-white text-sm outline-none focus:ring-1 focus:ring-green-500/50";

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 text-red-400 text-xs text-center">{error}</div>
      )}

      <div className="flex flex-col gap-1">
        <label className="text-zinc-400 text-xs">Title *</label>
        <input name="title" value={form.title} onChange={handleChange} className={inputClass} />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-zinc-400 text-xs">Description</label>
        <textarea name="description" value={form.description} onChange={handleChange} rows={3} className={`${inputClass} resize-none`} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-zinc-400 text-xs">Reward</label>
          <input name="reward" value={form.reward} onChange={handleChange} className={inputClass} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-zinc-400 text-xs">Type</label>
          <select name="type" value={form.type} onChange={handleChange} className={`${inputClass} appearance-none`}>
            {GIG_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-zinc-400 text-xs">Image URL</label>
        <input name="imageUrl" value={form.imageUrl} onChange={handleChange} className={inputClass} />
      </div>

      <div className="flex gap-3 pt-2">
        <button onClick={onCancel} className="flex-1 p-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-sm transition">
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 flex items-center justify-center gap-2 p-3 rounded-xl bg-green-500 hover:bg-green-600 text-white text-sm transition disabled:opacity-50"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}

/* ─── Main GigDetail export ─── */
export default function GigDetail({ gig, isOwner, onClose, onUpdated, onDeleted }: GigDetailProps) {
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [deleting, setDeleting] = useState(false);
  const [currentGig, setCurrentGig] = useState(gig);

  const handleDelete = async () => {
    if (!confirm("Delete this gig? This can't be undone.")) return;
    setDeleting(true);
    try {
      await deleteGig(currentGig.id);
      onDeleted(currentGig.id);
    } catch {
      setDeleting(false);
    }
  };

  const handleSave = async (payload: UpdateGigPayload) => {
    const updated = await updateGig(currentGig.id, payload);
    setCurrentGig(updated);
    onUpdated(updated);
    setMode("view");
  };

  const content = (
    <>
      {mode === "view" ? (
        <DetailView
          gig={currentGig}
          isOwner={isOwner}
          onEdit={() => setMode("edit")}
          onDelete={handleDelete}
          deleting={deleting}
        />
      ) : (
        <EditView
          gig={currentGig}
          onCancel={() => setMode("view")}
          onSave={handleSave}
        />
      )}
    </>
  );

  return (
    <>
      {/* Desktop: right sidebar */}
      <div className="hidden md:block">
        <DesktopSidebar onClose={onClose} mode={mode} onBack={() => setMode("view")}>
          {content}
        </DesktopSidebar>
      </div>

      {/* Mobile: fullscreen */}
      <div className="md:hidden">
        <MobileFullscreen onClose={onClose} mode={mode} onBack={() => setMode("view")}>
          {content}
        </MobileFullscreen>
      </div>
    </>
  );
}

/* ─── Desktop sidebar ─── */
function DesktopSidebar({ children, onClose, mode, onBack }: {
  children: React.ReactNode; onClose: () => void; mode: string; onBack: () => void;
}) {
  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 30, stiffness: 300 }}
      className="fixed top-0 right-0 bottom-0 w-[380px] z-[1000] bg-zinc-900 border-l border-zinc-800 flex flex-col"
    >
      <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
        {mode === "edit" ? (
          <button onClick={onBack} className="text-zinc-400 hover:text-white text-sm flex items-center gap-1">
            <ArrowLeft size={14} /> Back
          </button>
        ) : (
          <span className="text-sm font-semibold text-white">Gig Details</span>
        )}
        <button onClick={onClose} className="text-zinc-400 hover:text-white" aria-label="Close">
          <X size={18} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-5">
        {children}
      </div>
    </motion.div>
  );
}

/* ─── Mobile fullscreen ─── */
function MobileFullscreen({ children, onClose, mode, onBack }: {
  children: React.ReactNode; onClose: () => void; mode: string; onBack: () => void;
}) {
  return (
    <motion.div
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", damping: 30, stiffness: 300 }}
      className="fixed inset-0 z-[1000] bg-zinc-900 flex flex-col"
    >
      <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
        {mode === "edit" ? (
          <button onClick={onBack} className="text-zinc-400 text-sm flex items-center gap-1">
            <ArrowLeft size={14} /> Back
          </button>
        ) : (
          <button onClick={onClose} className="text-zinc-400 text-sm flex items-center gap-1">
            <ArrowLeft size={14} /> Map
          </button>
        )}
        <span className="text-sm font-semibold text-white">
          {mode === "edit" ? "Edit Gig" : "Gig Details"}
        </span>
        <div className="w-12" />
      </div>
      <div className="flex-1 overflow-y-auto p-5 pb-24">
        {children}
      </div>
    </motion.div>
  );
}
