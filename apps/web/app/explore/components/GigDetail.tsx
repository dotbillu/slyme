"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Drawer } from "vaul";
import { useRouter } from "next/navigation";
import {
  X, MapPin, Pencil, Trash2, Loader2, ArrowLeft, Check,
  ChevronLeft, ChevronRight, Upload, Clock, Calendar, Award,
} from "lucide-react";
import { Gig, GIG_TYPES, UpdateGigPayload } from "@/types/gig";
import { updateGig, deleteGig } from "@/services/gig/service";
import ShareMenu from "./ShareMenu";

interface GigDetailProps {
  gig: Gig;
  isOwner: boolean;
  onClose: () => void;
  onUpdated: (gig: Gig) => void;
  onDeleted: (id: string) => void;
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

/* ─── Detail View ─── */
function DetailView({ gig, isOwner, onEdit, onDelete, deleting, onImageClick, isLoggedIn }: {
  gig: Gig; isOwner: boolean;
  onEdit: () => void; onDelete: () => void; deleting: boolean;
  onImageClick: (i: number) => void; isLoggedIn: boolean;
}) {
  const router = useRouter();

  const creatorEl = gig.createdBy ? (
    <button
      onClick={() => {
        if (gig.createdBy?.username) router.push(`/${gig.createdBy.username}`);
      }}
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
  ) : null;

  return (
    <div className="flex-1 overflow-y-auto scrollbar-hide py-4">
      {/* Image with creator overlay */}
      {gig.imageUrls.length > 0 ? (
        <div className="relative">
          <ImageCarousel images={gig.imageUrls} onImageClick={onImageClick} />
          {creatorEl && (
            <div className="absolute bottom-3 left-7 z-10">
              {creatorEl}
            </div>
          )}
        </div>
      ) : (
        creatorEl && (
          <div className="px-6 pb-3">
            {creatorEl}
          </div>
        )
      )}

      {/* Title row with share + owner actions */}
      <div className="px-6 pt-4 pb-2 flex items-start justify-between gap-3">
        <h2 className="text-2xl font-normal text-white leading-snug flex-1">{gig.title}</h2>
        <div className="flex items-center gap-1.5 shrink-0 mt-1">
          <ShareMenu type="gig" id={gig.id} isLoggedIn={isLoggedIn} />
          {isOwner && (
            <>
              <button onClick={onEdit} className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition" aria-label="Edit">
                <Pencil size={15} />
              </button>
              <button onClick={onDelete} disabled={deleting} className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-red-400 transition disabled:opacity-50" aria-label="Delete">
                {deleting ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Type */}
      {gig.type && (
        <div className="px-6 pb-3">
          <span className="text-sm text-zinc-400">{gig.type}</span>
        </div>
      )}

      {/* Info rows */}
      <div className="px-6 flex flex-col gap-3 py-3">
        <div className="flex items-center gap-4">
          <MapPin size={16} className="text-zinc-500 shrink-0" />
          <p className="text-sm text-white">{gig.latitude.toFixed(5)}, {gig.longitude.toFixed(5)}</p>
        </div>

        {(gig.gigTime || gig.date) && (
          <div className="flex items-center gap-4">
            <Calendar size={16} className="text-zinc-500 shrink-0" />
            <p className="text-sm text-white">{formatDate(gig.gigTime || gig.date)}</p>
          </div>
        )}

        {gig.expiresAt && (
          <div className="flex items-center gap-4">
            <Clock size={16} className="text-zinc-500 shrink-0" />
            <p className="text-sm text-white">Expires {formatDate(gig.expiresAt)}</p>
          </div>
        )}

        {gig.reward && (
          <div className="flex items-center gap-4">
            <Award size={16} className="text-zinc-500 shrink-0" />
            <p className="text-sm text-white">{gig.reward}</p>
          </div>
        )}
      </div>

      {/* Description */}
      {gig.description && (
        <div className="px-6 py-3">
          <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">{gig.description}</p>
        </div>
      )}

      <div className="h-6" />
    </div>
  );
}

/* ─── Edit View (modal overlay style, same as create/gig form) ─── */
function EditView({ gig, onCancel, onSave }: {
  gig: Gig; onCancel: () => void;
  onSave: (payload: UpdateGigPayload) => Promise<void>;
}) {
  const [form, setForm] = useState({ title: gig.title, description: gig.description || "", reward: gig.reward || "", type: gig.type || GIG_TYPES[0] });
  const [imageUrls, setImageUrls] = useState<string[]>(gig.imageUrls || []);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    try { await onSave({ title: form.title, description: form.description, reward: form.reward, type: form.type, imageUrls }); }
    catch (err: any) { setError(err.message || "Failed"); setSaving(false); }
  };

  const inputClass = "w-full p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-sm outline-none focus:border-zinc-600 transition placeholder:text-zinc-600";

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 shrink-0">
        <button onClick={onCancel} className="text-zinc-400 hover:text-white text-sm transition">Cancel</button>
        <span className="text-sm font-medium text-white">Edit Gig</span>
        <button onClick={handleSave} disabled={saving || uploading} className="text-sm font-medium text-white hover:text-zinc-300 transition disabled:opacity-50">
          {saving ? "..." : "Save"}
        </button>
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
        </div>
      </div>
    </div>
  );
}

/* ─── Main Export ─── */
export default function GigDetail({ gig, isOwner, onClose, onUpdated, onDeleted, isLoggedIn = false }: GigDetailProps) {
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [deleting, setDeleting] = useState(false);
  const [currentGig, setCurrentGig] = useState(gig);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const handleDelete = async () => {
    if (!confirm("Delete this gig?")) return;
    setDeleting(true);
    try { await deleteGig(currentGig.id); onDeleted(currentGig.id); } catch { setDeleting(false); }
  };

  const handleSave = async (payload: UpdateGigPayload) => {
    const updated = await updateGig(currentGig.id, payload);
    setCurrentGig(updated); onUpdated(updated); setMode("view");
  };

  const content = (
    <div className="flex flex-col h-full relative">
      <button onClick={onClose} className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white/80 hover:text-white hover:bg-black/70 transition">
        <X size={16} />
      </button>
      {mode === "view" ? (
        <DetailView gig={currentGig} isOwner={isOwner} onEdit={() => setMode("edit")} onDelete={handleDelete} deleting={deleting} onImageClick={(i) => setLightboxIndex(i)} isLoggedIn={isLoggedIn} />
      ) : (
        <EditView gig={currentGig} onCancel={() => setMode("view")} onSave={handleSave} />
      )}
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
          {content}
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
              {content}
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
