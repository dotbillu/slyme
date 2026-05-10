import { Suspense } from "react";
import { fetchProfile } from "@/services/user/service";
import ProfileLoader from "./components/ProfileLoader";
import ProfileSkeleton from "./components/ProfileSkeleton";
import { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  return {
    title: `${username} | Slyme`,
    description: `View ${username}'s profile on Slyme.`,
  };
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const userPromise = fetchProfile(username);

  return (
    <Suspense fallback={<ProfileSkeleton />}>
      <ProfileLoader userPromise={userPromise} username={username} />
    </Suspense>
  );
}
