import type { Metadata } from "next";
import Link from "next/link";
import { Cake } from "lucide-react";
import { Container } from "@/components/ui/container";
import { SignupWizard } from "./wizard";

export const metadata: Metadata = {
  title: "Start your bakery",
  description: "Create your branded cake-design storefront in a few steps.",
};

export default function SignupPage() {
  return (
    <main className="min-h-screen pb-16">
      <header className="border-b border-border py-4">
        <Container className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-display text-lg text-choco-800">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-gold-500 text-white">
              <Cake className="h-4 w-4" />
            </span>
            CakeCraft Studio
          </Link>
          <Link href="/login" className="text-sm text-choco-600 hover:text-gold-700">
            Already have a bakery? Sign in
          </Link>
        </Container>
      </header>
      <SignupWizard />
    </main>
  );
}
