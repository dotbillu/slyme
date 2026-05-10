import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Get Started | Slyme",
  description: "Create a Slyme account and join your local community.",
};

export default function SignupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
