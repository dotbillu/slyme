"use client";
import { getMe } from "@/services/auth/service";
import Image from "next/image";
import { useEffect } from "react";

export default function Home() {
  useEffect(() => {
    async function getmebro() {
      const res = await getMe();
      return res;
    }
    getmebro();
  }, []);
  return <div>hi</div>;
}
