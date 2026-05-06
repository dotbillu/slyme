"use client";

import { NavItem } from "@/lib/type";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  Compass,
  PlaySquare,
  Plus,
  Heart,
  Search,
  Menu,
  User,
  MessageCircle,
  MapPin,
  Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/app/AuthProvider";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const { user } = useAuth();
  const createRef = useRef<HTMLDivElement>(null);

  // Close create menu on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (createRef.current && !createRef.current.contains(e.target as Node)) {
        setCreateOpen(false);
      }
    }
    if (createOpen) {
      document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
    }
  }, [createOpen]);

  // Close on route change
  useEffect(() => {
    setCreateOpen(false);
  }, [pathname]);

  if (!user) return <></>;

  const items: NavItem[] = [
    { name: "Home", href: "/", icon: Home },
    { name: "Explore", href: "/explore", icon: Compass },
    { name: "Search", href: "/search", icon: Search },
    { name: "Create", href: "#", icon: Plus },
    { name: "Messages", href: "/network", icon: MessageCircle },
    { name: "Profile", href: `/${user.username}`, icon: User },
  ];

  const handleCreateOption = (type: "gig" | "room") => {
    setCreateOpen(false);
    router.push(`/create/${type}`);
  };

  return (
    <div>
      {/* Desktop sidebar */}
      <motion.nav
        onHoverStart={() => setOpen(true)}
        onHoverEnd={() => setOpen(false)}
        transition={{
          duration: 0.25,
        }}
        initial={{ width: 0 }}
        animate={{ width: 70 }}
        whileHover={{ width: 220 }}
        className="hidden md:flex fixed top-0 left-0 h-screen min-h-full flex-col py-6 bg-black z-[100]"
      >
        <Image
          src="/slymelogo.png"
          alt="logo"
          width={30}
          height={30}
          className="absolute ml-5 flex-1"
        />

        <div className="flex flex-col gap-3 px-3 flex-1 justify-center">
          {items.map((i, k) => {
            const Icon = i.icon;
            const isActive = pathname === i.href;

            // Create button — special handling
            if (i.name === "Create") {
              return (
                <div key={k} className="relative" ref={createRef}>
                  <button
                    onClick={() => setCreateOpen((p) => !p)}
                    className="flex items-center gap-4 px-3 py-2 rounded-xl transition hover:bg-white/30 w-full"
                  >
                    <Plus
                      size={26}
                      strokeWidth={createOpen ? 2.5 : 1.3}
                      className="min-w-6.5 max-w-6.5"
                    />
                    <motion.span
                      className="text-sm absolute ml-10"
                      initial={{ x: -100, opacity: 0 }}
                      animate={{ x: open ? 0 : -10, opacity: open ? 1 : 0 }}
                    >
                      Create
                    </motion.span>
                  </button>

                  {/* Desktop popup — appears below the + button */}
                  <AnimatePresence>
                    {createOpen && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: -4 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: -4 }}
                        transition={{ duration: 0.15 }}
                        className="absolute left-2 top-full mt-2 w-48 bg-zinc-800 rounded-xl overflow-hidden shadow-xl shadow-black/40 border border-zinc-700/50 z-[200]"
                      >
                        <button
                          onClick={() => handleCreateOption("gig")}
                          className="flex items-center justify-between w-full px-4 py-3.5 hover:bg-zinc-700 transition text-left"
                        >
                          <span className="text-sm text-white">Gig</span>
                          <MapPin size={20} className="text-zinc-300" />
                        </button>
                        <div className="h-px bg-zinc-700/50" />
                        <button
                          onClick={() => handleCreateOption("room")}
                          className="flex items-center justify-between w-full px-4 py-3.5 hover:bg-zinc-700 transition text-left"
                        >
                          <span className="text-sm text-white">Room</span>
                          <Users size={20} className="text-zinc-300" />
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            }

            return (
              <Link
                key={k}
                href={i.href}
                className={`flex items-center gap-4 px-3 py-2 rounded-xl transition hover:bg-white/30`}
              >
                <Icon
                  size={26}
                  strokeWidth={isActive ? 2.5 : 1.3}
                  className="min-w-6.5 max-w-6.5"
                />

                <motion.span
                  className={`text-sm absolute ml-10 ${isActive ? "font-bold" : ""}`}
                  initial={{ x: -100, opacity: 0 }}
                  animate={{ x: open ? 0 : -10, opacity: open ? 1 : 0 }}
                >
                  {i.name}
                </motion.span>
              </Link>
            );
          })}
        </div>

        <div className="px-3 ">
          <button
            onClick={() => setOpen((p) => !p)}
            className="flex items-center gap-4 px-3 py-2 text-zinc-400 hover:text-white w-full hover:bg-white/30 rounded-xl"
          >
            <Menu size={26} className="min-w-6.5 max-w-6.5" />
            <motion.span
              className="text-sm absolute ml-10"
              initial={{ x: -100, opacity: 0 }}
              animate={{ x: open ? 0 : -10, opacity: open ? 1 : 0 }}
            >
              More
            </motion.span>
          </button>
        </div>
      </motion.nav>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-black z-[100]">
        <div className="flex justify-around items-center h-16">
          {items.slice(0, 5).map((i, k) => {
            const Icon = i.icon;
            const isActive = pathname === i.href;

            // Create button — special handling for mobile
            if (i.name === "Create") {
              return (
                <div key={k} className="relative" ref={createRef}>
                  <button
                    onClick={() => setCreateOpen((p) => !p)}
                    className={`flex items-center justify-center ${
                      createOpen ? "text-white" : "text-zinc-400"
                    }`}
                  >
                    <Plus size={26} strokeWidth={createOpen ? 2 : 1} />
                  </button>

                  {/* Mobile popup — appears above the + button */}
                  <AnimatePresence>
                    {createOpen && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 8 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 8 }}
                        transition={{ duration: 0.15 }}
                        className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 w-44 bg-zinc-800 rounded-xl overflow-hidden shadow-xl shadow-black/50 border border-zinc-700/50 z-[200]"
                      >
                        <button
                          onClick={() => handleCreateOption("gig")}
                          className="flex items-center justify-between w-full px-4 py-3.5 hover:bg-zinc-700 transition text-left"
                        >
                          <span className="text-sm text-white">Gig</span>
                          <MapPin size={20} className="text-zinc-300" />
                        </button>
                        <div className="h-px bg-zinc-700/50" />
                        <button
                          onClick={() => handleCreateOption("room")}
                          className="flex items-center justify-between w-full px-4 py-3.5 hover:bg-zinc-700 transition text-left"
                        >
                          <span className="text-sm text-white">Room</span>
                          <Users size={20} className="text-zinc-300" />
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            }

            return (
              <Link
                key={k}
                href={i.href}
                className={`flex items-center justify-center ${
                  isActive ? "text-white" : "text-zinc-400"
                }`}
              >
                <Icon size={26} strokeWidth={isActive ? 2 : 1} />
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
