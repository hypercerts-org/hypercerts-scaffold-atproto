import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Hypercert",
  description:
    "Create a new hypercert impact claim. Define your work scope, contributors, evidence, and more using the step-by-step wizard.",
  openGraph: {
    title: "Create Hypercert",
    description:
      "Create a new hypercert impact claim with the step-by-step wizard.",
  },
};

export default function CreateHypercertLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
