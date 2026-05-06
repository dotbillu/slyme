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
  User,
  MessageCircle,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/app/AuthProvider";

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  if (!user) return <></>;

  const items: NavItem[] = [
    { name: "Home", href: "/", icon: Home },
    { name: "Explore", href: "/explore", icon: Compass },
    { name: "Search", href: "/search", icon: Search },
    { name: "Create", href: "/create", icon: Plus },
    { name: "Messages", href: "/network", icon: MessageCircle },
    { name: "Profile", href: `/${user.username}`, icon: User },
  ];
  return (
    <div>
      <motion.nav
        onHoverStart={() => setOpen(true)}
        onHoverEnd={() => setOpen(false)}
        transition={{
          duration: 0.25,
        }}
        initial={{ width: 0 }}
        animate={{ width: 70 }}
        whileHover={{ width: 220 }}
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

      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-black">
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
                <Icon size={26} strokeWidth={isActive ? 2 : 1} />
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
