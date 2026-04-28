"use client";

import dynamic from "next/dynamic";

const Map = dynamic(() => import("@/app/explore/components/Map"), {
  ssr: false,
});

export default function ExplorePage() {
  return <Map />;
}
