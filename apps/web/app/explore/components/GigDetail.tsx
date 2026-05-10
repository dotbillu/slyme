"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Drawer } from "vaul";
import { useRouter } from "next/navigation";
import {
  X, MapPin, Pencil, ChevronLeft, ChevronRight, Clock, Calendar, Award, Users,
} from "lucide-react";
import { Gig } from "@/types/gig";
import ShareMenu from "./ShareMenu";
import EditGigModal from "./EditGigModal";

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

/* ─── Image Carousel ─── */
function ImageCarousel({ images, onImageClick }: { images: string[]; onImageClick: (i: number) => void }) {
  const [current, setCurrent] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  if (images.length === 0) return null;
  const scrollTo = (i: number) => { setCurrent(i); ref.current?.scrollTo({ left: i * (ref.current?.clientWidth || 0), behavior: "smooth" }); };
  return (
    <div className="relative bg-zinc-900 mx-4 rounded-xl overflow-hidden">
      <div ref={ref} className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide" onScroll={(e) => { const el = e.currentTarget; const i = Math.round(el.scrollLeft / el.clientWidth); if (i !== current) setCurrent(i); }}>
        {images.map((url, i) => (
          <div key={i} className="w-full flex-shrink-0 aspect-[16/10] snap-center cursor-pointer" onClick={() => onImageClick(i)}>
            <img src={url} alt="" className="w-full h-full object-cover" />
          </div>
        ))}
      </div>
      {images.length > 1 && (
        <>
          <button onClick={() => scrollTo(current > 0 ? current - 1 : images.length - 1)} className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80 transition"><ChevronLeft size={16} /></button>
          <button onClick={() => scrollTo(current < images.length - 1 ? current + 1 : 0)} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80 transition"><ChevronRight size={16} /></button>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
            {images.map((_, i) => (<div key={i} className={`h-1.5 rounded-full transition-all ${i === current ? "w-4 bg-white" : "w-1.5 bg-white/40"}`} />))}
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

/* ─── Location Name ─── */
function GigLocationName({ lat, lng }: { lat: number; lng: number }) {
  const [name, setName] = useState<string>("");
  useEffect(() => {
    let cancelled = false;
    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14`)
      .then((r) => r.json())
      .then((data) => { if (!cancelled && data.display_name) { setName(data.display_name.split(", ").slice(0, 3).join(", ")); } })
      .catch(() => { if (!cancelled) setName(`${lat.toFixed(4)}, ${lng.toFixed(4)}`); });
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
function DetailView({ gig, isOwner, onEdit, onImageClick, isLoggedIn }: {
  gig: Gig; isOwner: boolean; onEdit: () => void; onImageClick: (i: number) => void; isLoggedIn: boolean;
}) {
  const router = useRouter();
  return (
    <div className="flex-1 overflow-y-auto scrollbar-hide py-4">
      {gig.imageUrls.length > 0 ? (
        <div className="relative">
          <ImageCarousel images={gig.imageUrls} onImageClick={onImageClick} />
          {gig.createdBy && (
            <div className="absolute bottom-3 left-7 z-10">
              <button onClick={() => { if (gig.createdBy?.username) router.push(`/${gig.createdBy.username}`); }} className="flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-black/60 backdrop-blur-sm hover:bg-black/80 transition">
                {gig.createdBy.avatarUrl ? <img src={gig.createdBy.avatarUrl} className="w-5 h-5 rounded-full object-cover" alt="" /> : <div className="w-5 h-5 rounded-full bg-zinc-700 flex items-center justify-center text-[9px] text-white font-medium">{(gig.createdBy.username || gig.createdBy.name || "?")[0].toUpperCase()}</div>}
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
              <button onClick={() => { if (gig.createdBy?.username) router.push(`/${gig.createdBy.username}`); }} className="flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-black/60 backdrop-blur-sm hover:bg-black/80 transition">
                {gig.createdBy.avatarUrl ? <img src={gig.createdBy.avatarUrl} className="w-5 h-5 rounded-full object-cover" alt="" /> : <div className="w-5 h-5 rounded-full bg-zinc-700 flex items-center justify-center text-[9px] text-white font-medium">{(gig.createdBy.username || gig.createdBy.name || "?")[0].toUpperCase()}</div>}
                <span className="text-xs text-white font-medium">{gig.createdBy.username || gig.createdBy.name || "Anonymous"}</span>
              </button>
            </div>
          )}
        </div>
      )}

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

      {gig.description && (
        <div className="px-6 pb-3">
          <p className="text-sm text-zinc-400 leading-relaxed whitespace-pre-wrap">{gig.description}</p>
        </div>
      )}

      <div className="px-6 pb-3 flex items-center gap-2 flex-wrap">
        {gig.type && <span className="px-3 py-1 rounded-full bg-zinc-800 text-xs text-zinc-300 font-medium">{gig.type}</span>}
        {gig.reward && <span className="px-3 py-1 rounded-full bg-zinc-800 text-xs text-zinc-300 font-medium flex items-center gap-1.5"><Award size={12} className="text-zinc-500" />{gig.reward}</span>}
      </div>

      <div className="px-6 pb-3"><GigLocationName lat={gig.latitude} lng={gig.longitude} /></div>

      <div className="px-6 flex flex-col gap-2 pb-3">
        {(gig.gigTime || gig.date) && (
          <div className="flex items-center gap-3"><Calendar size={14} className="text-zinc-500 shrink-0" /><p className="text-xs text-zinc-400">{formatDate(gig.gigTime || gig.date)}</p></div>
        )}
        {gig.expiresAt && (
          <div className="flex items-center gap-3"><Clock size={14} className="text-zinc-500 shrink-0" /><p className="text-xs text-zinc-400">Expires {formatDate(gig.expiresAt)}</p></div>
        )}
      </div>

      <div className="h-6" />
    </div>
  );
}

/* ─── Main Export ─── */
export default function GigDetail({ gig, isOwner, onClose, onUpdated, onDeleted, onRoomClick, isLoggedIn = false }: GigDetailProps) {
  const [currentGig, setCurrentGig] = useState(gig);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  useEffect(() => {
    if (showEdit) return;
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [showEdit]);

  const content = (
    <div className="flex flex-col h-full relative">
      <DetailView gig={currentGig} isOwner={isOwner} onEdit={() => setShowEdit(true)} onImageClick={(i) => setLightboxIndex(i)} isLoggedIn={isLoggedIn} />
      {currentGig.room && onRoomClick && (
        <div className="px-5 py-3 shrink-0 border-t border-zinc-800/40">
          <p className="text-xs text-zinc-500 mb-2 px-1">Join Room</p>
          <button onClick={() => onRoomClick(currentGig.room!.id)} className="w-full flex items-center gap-3 p-3 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 transition text-left">
            <div className="w-8 h-8 rounded-full overflow-hidden bg-zinc-800 flex items-center justify-center shrink-0">
              {currentGig.room.imageUrl ? <img src={currentGig.room.imageUrl} alt="" className="w-full h-full object-cover" /> : <span className="text-xs text-zinc-400 font-medium">{currentGig.room.name.charAt(0).toUpperCase()}</span>}
            </div>
            <p className="text-sm text-white truncate flex-1">{currentGig.room.name}</p>
            <Users size={14} className="text-zinc-500 shrink-0" />
            <ChevronRight size={16} className="text-zinc-500 shrink-0" />
          </button>
        </div>
      )}
    </div>
  );

  return (
    <>
      {!isMobile && (
        <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 26, stiffness: 260 }} className="fixed top-0 right-0 bottom-0 w-[420px] lg:w-[480px] z-[1000] bg-zinc-950 border-l border-zinc-800/40">
          <button onClick={onClose} className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 w-7 h-14 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition"><ChevronRight size={16} /></button>
          {content}
        </motion.div>
      )}

      {isMobile && (
        <Drawer.Root open onOpenChange={(open) => { if (!open) onClose(); }}>
          <Drawer.Portal>
            <Drawer.Overlay className="fixed inset-0 z-[10000] bg-black/60" />
            <Drawer.Content className="fixed bottom-0 left-0 right-0 z-[10001] bg-zinc-950 rounded-t-2xl max-h-[85vh] flex flex-col outline-none overflow-hidden">
              <div className="flex justify-center pt-2 pb-1 shrink-0"><div className="w-9 h-1 rounded-full bg-zinc-700" /></div>
              <div className="flex-1 overflow-y-auto">{content}</div>
            </Drawer.Content>
          </Drawer.Portal>
        </Drawer.Root>
      )}

      <AnimatePresence>
        {lightboxIndex !== null && currentGig.imageUrls.length > 0 && (
          <Lightbox images={currentGig.imageUrls} startIndex={lightboxIndex} onClose={() => setLightboxIndex(null)} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showEdit && (
          <EditGigModal
            gig={currentGig}
            onClose={() => setShowEdit(false)}
            onUpdated={(updated) => { setCurrentGig(updated); onUpdated(updated); setShowEdit(false); }}
            onDeleted={onDeleted}
          />
        )}
      </AnimatePresence>
    </>
  );
}
