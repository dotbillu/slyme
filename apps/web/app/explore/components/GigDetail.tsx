"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, MapPin, Clock, Calendar, Tag, Award, Pencil, Trash2,
  Loader2, ArrowLeft, Check, ChevronLeft, ChevronRight, Upload,
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

async function uploadFile(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch("/api/upload", { method: "POST", body: formData });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Upload failed");
  }
  const data = await res.json();
  return data.url;
}

/* ─── Image Gallery ─── */
function ImageGallery({ images, onImageClick }: { images: string[]; onImageClick: (index: number) => void }) {
  const [current, setCurrent] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  if (images.length === 0) return null;

  const scrollTo = (index: number) => {
    setCurrent(index);
    scrollRef.current?.children[index]?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  };

  const prev = () => scrollTo(current > 0 ? current - 1 : images.length - 1);
  const next = () => scrollTo(current < images.length - 1 ? current + 1 : 0);

  if (images.length === 1) {
    return (
      <div
        className="w-full aspect-[16/10] rounded-xl overflow-hidden bg-zinc-800 cursor-pointer"
        onClick={() => onImageClick(0)}
      >
        <img src={images[0]} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
      </div>
    );
  }

  return (
    <div className="relative">
      <div
        ref={scrollRef}
        className="flex gap-0 overflow-x-auto overflow-y-hidden snap-x snap-mandatory rounded-xl scrollbar-hide"
        onScroll={(e) => {
          const el = e.currentTarget;
          const index = Math.round(el.scrollLeft / el.clientWidth);
          setCurrent(index);
        }}
      >
        {images.map((url, i) => (
          <div
            key={i}
            className="w-full flex-shrink-0 aspect-[16/10] snap-center cursor-pointer bg-zinc-800"
            onClick={() => onImageClick(i)}
          >
            <img src={url} alt="" className="w-full h-full object-cover" />
          </div>
        ))}
      </div>

      {/* Navigation arrows */}
      {images.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/60 hover:bg-black/80 text-white transition"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={next}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/60 hover:bg-black/80 text-white transition"
          >
            <ChevronRight size={16} />
          </button>
        </>
      )}

      {/* Dots */}
      {images.length > 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => scrollTo(i)}
              className={`w-1.5 h-1.5 rounded-full transition-all ${
                i === current ? "bg-white w-4" : "bg-white/40"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Fullscreen Lightbox ─── */
function Lightbox({ images, startIndex, onClose }: { images: string[]; startIndex: number; onClose: () => void }) {
  const [current, setCurrent] = useState(startIndex);

  const prev = () => setCurrent(current > 0 ? current - 1 : images.length - 1);
  const next = () => setCurrent(current < images.length - 1 ? current + 1 : 0);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[2000] bg-black/95 flex items-center justify-center"
      onClick={onClose}
    >
      {/* Close */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 rounded-full bg-zinc-800/80 hover:bg-zinc-700 text-white z-10"
      >
        <X size={20} />
      </button>

      {/* Counter */}
      {images.length > 1 && (
        <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-zinc-800/80 text-white text-xs">
          {current + 1} / {images.length}
        </div>
      )}

      {/* Image */}
      <motion.img
        key={current}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
        src={images[current]}
        alt=""
        className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg"
        onClick={(e) => e.stopPropagation()}
      />

      {/* Navigation */}
      {images.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); prev(); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-zinc-800/80 hover:bg-zinc-700 text-white"
          >
            <ChevronLeft size={24} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); next(); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-zinc-800/80 hover:bg-zinc-700 text-white"
          >
            <ChevronRight size={24} />
          </button>
        </>
      )}
    </motion.div>
  );
}

/* ─── Read-only detail view ─── */
function DetailView({ gig, isOwner, onEdit, onDelete, deleting, onImageClick }: {
  gig: Gig; isOwner: boolean;
  onEdit: () => void; onDelete: () => void; deleting: boolean;
  onImageClick: (index: number) => void;
}) {
  return (
    <div className="flex flex-col gap-5">
      {/* Image gallery */}
      <ImageGallery images={gig.imageUrls} onImageClick={onImageClick} />

      {/* Title & type badge */}
      <div>
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-lg font-semibold text-white leading-tight">{gig.title}</h2>
          {gig.type && (
            <span className="shrink-0 text-[10px] px-2.5 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/20 font-medium">
              {gig.type}
            </span>
          )}
        </div>
        {gig.createdBy && (
          <div className="flex items-center gap-2 mt-2.5">
            {gig.createdBy.avatarUrl ? (
              <img src={gig.createdBy.avatarUrl} className="w-6 h-6 rounded-full object-cover ring-2 ring-zinc-800" alt="" />
            ) : (
              <div className="w-6 h-6 rounded-full bg-zinc-700 flex items-center justify-center text-[10px] text-zinc-400 font-medium">
                {(gig.createdBy.username || gig.createdBy.name || "?")[0].toUpperCase()}
              </div>
            )}
            <span className="text-xs text-zinc-400">
              {gig.createdBy.username || gig.createdBy.name || "Anonymous"}
            </span>
          </div>
        )}
      </div>

      {/* Description */}
      {gig.description && (
        <p className="text-sm text-zinc-300 leading-relaxed">{gig.description}</p>
      )}

      {/* Info cards */}
      <div className="flex flex-col gap-2">
        {gig.reward && (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-800/50 border border-zinc-800">
            <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
              <Award size={14} className="text-green-400" />
            </div>
            <div>
              <p className="text-[10px] text-zinc-500 uppercase tracking-wide">Reward</p>
              <p className="text-sm text-white">{gig.reward}</p>
            </div>
          </div>
        )}
        <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-800/50 border border-zinc-800">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <Calendar size={14} className="text-blue-400" />
          </div>
          <div>
            <p className="text-[10px] text-zinc-500 uppercase tracking-wide">Gig Time</p>
            <p className="text-sm text-white">{formatDate(gig.gigTime || gig.date)}</p>
          </div>
        </div>
        {gig.expiresAt && (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-800/50 border border-zinc-800">
            <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
              <Clock size={14} className="text-orange-400" />
            </div>
            <div>
              <p className="text-[10px] text-zinc-500 uppercase tracking-wide">Expires</p>
              <p className="text-sm text-white">{formatDate(gig.expiresAt)}</p>
            </div>
          </div>
        )}
        {gig.latitude && gig.longitude && (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-800/50 border border-zinc-800">
            <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
              <MapPin size={14} className="text-red-400" />
            </div>
            <div>
              <p className="text-[10px] text-zinc-500 uppercase tracking-wide">Location</p>
              <p className="text-sm text-white">{gig.latitude.toFixed(4)}, {gig.longitude.toFixed(4)}</p>
            </div>
          </div>
        )}
      </div>

      <p className="text-[10px] text-zinc-600">
        Created {formatDate(gig.createdAt)}
      </p>

      {/* Owner actions */}
      {isOwner && (
        <div className="flex gap-3 pt-3 border-t border-zinc-800">
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
  });
  const [imageUrls, setImageUrls] = useState<string[]>(gig.imageUrls || []);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const handleFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (fileArray.length === 0) return;
    setUploading(true);
    setError(null);
    try {
      const urls = await Promise.all(fileArray.map(uploadFile));
      setImageUrls((prev) => [...prev, ...urls]);
    } catch (err: any) {
      setError(err.message || "Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
      e.target.value = "";
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const removeImage = (index: number) => {
    setImageUrls((prev) => prev.filter((_, i) => i !== index));
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
        imageUrls,
      });
    } catch (err: any) {
      setError(err.message || "Failed to save");
      setSaving(false);
    }
  };

  const inputClass = "w-full p-3 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-sm outline-none focus:ring-1 focus:ring-green-500/50 focus:border-green-500/50 transition";

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 text-red-400 text-xs text-center border border-red-500/20">{error}</div>
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

      {/* Image upload */}
      <div className="flex flex-col gap-1.5">
        <label className="text-zinc-400 text-xs">Photos</label>

        {imageUrls.length > 0 ? (
          <div
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={(e) => { e.preventDefault(); setDragOver(false); }}
            className={`flex gap-2 flex-wrap p-2 rounded-xl border-2 border-dashed transition ${
              dragOver ? "border-green-500 bg-green-500/10" : "border-transparent"
            }`}
          >
            {imageUrls.map((url, i) => (
              <div key={i} className="relative group w-16 h-16">
                <img src={url} alt="" className="w-full h-full rounded-lg object-cover border border-zinc-700" />
                <button
                  onClick={() => removeImage(i)}
                  className="absolute -top-1.5 -right-1.5 p-0.5 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition"
                >
                  <X size={10} />
                </button>
              </div>
            ))}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-16 h-16 rounded-lg border-2 border-dashed border-zinc-700 hover:border-green-500/50 flex items-center justify-center transition"
            >
              {uploading ? (
                <Loader2 size={14} className="text-green-400 animate-spin" />
              ) : (
                <Upload size={14} className="text-zinc-500" />
              )}
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFileInput} className="hidden" />
          </div>
        ) : (
          <div
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={(e) => { e.preventDefault(); setDragOver(false); }}
            onClick={() => fileInputRef.current?.click()}
            className={`flex flex-col items-center justify-center gap-1.5 p-4 rounded-xl border-2 border-dashed cursor-pointer transition ${
              dragOver ? "border-green-500 bg-green-500/10" : "border-zinc-700 hover:border-green-500/50 hover:bg-zinc-800/50"
            }`}
          >
            {uploading ? (
              <Loader2 size={20} className="text-green-400 animate-spin" />
            ) : (
              <Upload size={20} className={`${dragOver ? "text-green-400" : "text-zinc-600"} transition`} />
            )}
            <p className="text-[11px] text-zinc-500 text-center">
              {uploading ? "Uploading..." : "Click or drag & drop images"}
            </p>
            <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFileInput} className="hidden" />
          </div>
        )}
      </div>

      <div className="flex gap-3 pt-2">
        <button onClick={onCancel} className="flex-1 p-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-sm transition">
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving || uploading}
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
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

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
          onImageClick={(i) => setLightboxIndex(i)}
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

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxIndex !== null && currentGig.imageUrls.length > 0 && (
          <Lightbox
            images={currentGig.imageUrls}
            startIndex={lightboxIndex}
            onClose={() => setLightboxIndex(null)}
          />
        )}
      </AnimatePresence>
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
      className="fixed top-0 right-0 bottom-0 h-screen w-[480px] z-[1000] bg-zinc-900/95 backdrop-blur-md border-l border-zinc-800 flex flex-col shadow-2xl"
      data-gig-detail
    >
      <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
        {mode === "edit" ? (
          <button onClick={onBack} className="text-zinc-400 hover:text-white text-sm flex items-center gap-1.5 transition">
            <ArrowLeft size={14} /> Back
          </button>
        ) : (
          <span className="text-sm font-semibold text-white">Gig Details</span>
        )}
        <button onClick={onClose} className="p-1.5 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white transition" aria-label="Close">
          <X size={18} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
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
      data-gig-detail
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
      <div className="flex-1 overflow-y-auto p-5 pb-24 scrollbar-hide">
        {children}
      </div>
    </motion.div>
  );
}
