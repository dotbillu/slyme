import { fetchProfile } from "@/services/user/service";
import ProfileClient from "../components/ProfileContent";
import { UserPublic } from "@/types/user";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;

  const user: UserPublic = await fetchProfile(username);

  return <ProfileClient user={user} />;
}
