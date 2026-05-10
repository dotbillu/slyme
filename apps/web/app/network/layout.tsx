import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Messages | Slyme",
  description: "Connect and chat with your local community hubs.",
};

export default function NetworkLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
