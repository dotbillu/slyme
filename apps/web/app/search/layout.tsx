import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Search | Slyme",
  description: "Search for rooms, gigs, and users on Slyme.",
};

export default function SearchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
