import * as React from "react";
import { cn } from "@/lib/utils/cn";

type Tone = "gold" | "rose" | "neutral";

const tones: Record<Tone, string> = {
  gold: "bg-gold-100 text-gold-800",
  rose: "bg-rose-100 text-rose-800",
  neutral: "bg-cream-200 text-choco-600",
};

export function Badge({
  className,
  tone = "gold",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold font-display",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
