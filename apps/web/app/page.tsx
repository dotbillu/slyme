"use client";
import { getMe } from "@/services/auth/service";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/explore");
  }, []);
  return (
    <div className="bg-black h-screen w-screen flex justify-center items-center">
      <button
        onClick={() => {
          alert("click ");
        }}
        className=" border borer white"
      >
        click
      </button>
    </div>
  );
}
