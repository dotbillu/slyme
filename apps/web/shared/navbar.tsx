"use client";

import { NavItem } from "@/lib/type";
import { motion } from "framer-motion";
import {
  Home,
  Compass,
  PlaySquare,
  Plus,
  Heart,
  Search,
  Menu,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";

const items: NavItem[] = [
  { href: "/", icon: Home },
  { href: "/explore", icon: Compass },
  { href: "/reels", icon: PlaySquare },
  { href: "/create", icon: Plus },
  { href: "/activity", icon: Heart },
  { href: "/search", icon: Search },
];

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      <motion.nav
        onHoverStart={() => setOpen(true)}
        onHoverEnd={() => setOpen(false)}
        animate={{ width: open ? 220 : 72 }}
        className="hidden md:flex fixed top-0 left-0 h-screen flex-col py-6 bg-black"
      >
        <Image
          src="/slymelogo.png"
          alt="logo"
          width={30}
          height={30}
          className="absolute ml-5"
        />

        <div className="flex flex-col gap-3 px-3 flex-1 justify-center">
          {items.map((i, k) => {
            const Icon = i.icon;
            const isActive = pathname === i.href;

            return (
              <Link
                key={k}
                href={i.href}
                className={`flex items-center gap-4 px-3 py-2 rounded-xl transition hover:bg-white/30`}
              >
                <Icon
                size={26}
                strokeWidth={isActive?3:2} 
                className="rounded-4xl " 
                />

                <motion.span
                  className={`text-sm absolute ml-10 ${isActive ? "font-bold" : ""}`}
                  initial={{ x: -100, opacity: 0 }}
                  animate={{ x: open ? 0 : -10, opacity: open ? 1 : 0 }}
                >
                  {(i.href.slice(1) || "home").charAt(0).toUpperCase() +
                    (i.href.slice(1) || "home").slice(1)}
                </motion.span>
              </Link>
            );
          })}
        </div>

        <div className="px-3">
          <button
            onClick={() => setOpen((p) => !p)}
            className="p-3 text-zinc-400 hover:text-white"
          >
            <Menu size={26} />
          </button>
        </div>
      </motion.nav>

      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-[#0a0a0a]/90 backdrop-blur">
        <div className="flex justify-around items-center h-16">
          {items.slice(0, 5).map((i, k) => {
            const Icon = i.icon;
            const isActive = pathname === i.href;

            return (
              <Link
                key={k}
                href={i.href}
                className={`flex items-center justify-center ${
                  isActive ? "text-white" : "text-zinc-400"
                }`}
              >
                <Icon size={26} />
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
