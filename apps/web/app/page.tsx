"use client";
import { getMe } from "@/services/auth/service";
import { useEffect } from "react";

export default function Home() {
  useEffect(() => {
    async function getmebro() {
      const res = await getMe();
      return res;
    }
    getmebro();
  }, []);
  return (
    <div className="bg-black h-screen w-screen flex justify-center items-center">
      <button
        onClick={() => {
          alert("click ");
        }}
        className=" border borer white"
      >click</button>
    </div>
  );
}
