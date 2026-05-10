import { Metadata } from "next";
import LandingPage from "./LandingPage";

export const metadata: Metadata = {
  title: "SLYME",
  description: "Connect with your local community through geo-locked hubs, real-time coordinate discovery, and hyperlocal gigs.",
};

export default function Home() {
  return <LandingPage />;
}
