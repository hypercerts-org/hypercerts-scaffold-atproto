import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Organization",
  description:
    "Create a new organization on the Hypercerts platform. Set up a shared workspace for collaborative impact claims.",
  openGraph: {
    title: "Create Organization",
    description:
      "Create a new organization for collaborative impact claims.",
  },
};

export default function CreateOrganizationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
