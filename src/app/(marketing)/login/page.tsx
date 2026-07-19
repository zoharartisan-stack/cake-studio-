import type { Metadata } from "next";
import Link from "next/link";
import { Cake } from "lucide-react";
import { Card } from "@/components/ui/card";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <main className="grid min-h-screen place-items-center px-5 py-12">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2 font-display text-xl text-choco-800">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-gold-500 text-white">
            <Cake className="h-5 w-5" />
          </span>
          CakeCraft Studio
        </Link>
        <Card>
          <h1 className="text-center text-2xl">Welcome back</h1>
          <p className="mb-6 mt-1 text-center text-sm text-muted-foreground">
            Sign in to manage your bakery.
          </p>
          <LoginForm />
        </Card>
        <p className="mt-5 text-center text-sm text-muted-foreground">
          New here?{" "}
          <Link href="/signup" className="font-medium text-gold-700 hover:underline">
            Start your bakery
          </Link>
        </p>
      </div>
    </main>
  );
}
