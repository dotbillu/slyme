"use client";

import { use } from "react";
import { UserPublic } from "@/types/user";
import ProfileClient from "./ProfileContent";
import { useAtom } from "jotai";
import { currentUserProfileAtom } from "@/lib/atom";

export default function ProfileLoader({
  userPromise,
  username,
}: {
  userPromise: Promise<UserPublic>;
  username: string;
}) {
  const [cachedProfile] = useAtom(currentUserProfileAtom);

  // If the prefetched Jotai profile matches the requested username,
  // we render instantly using the cache and skip waiting for the server promise.
  if (cachedProfile && cachedProfile.username === username) {
    return <ProfileClient user={cachedProfile} />;
  }

  // Otherwise, wait for the server component to finish fetching the data.
  const user = use(userPromise);

  return <ProfileClient user={user} />;
}
