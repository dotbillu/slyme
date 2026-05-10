import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Explore | Slyme",
  description: "Discover local MapRooms and Gigs around you in real-time.",
};

export default function ExploreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
