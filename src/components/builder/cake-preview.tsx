"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useReducedMotionSafe } from "@/hooks/use-reduced-motion-safe";

export interface PreviewState {
  primary: string;
  secondary: string;
  accent: string;
  /** 0.85–1.15 scale hint from the chosen size. */
  scale: number;
  shape: "round" | "square" | "heart";
  flavorName?: string;
  fillingName?: string;
  frostingName?: string;
  toppingNames: string[];
  message: string;
  occasion?: string;
}

/* ----- name → visual mappings (heuristic; the real 3D model lands in 5d) ----- */

function spongeColor(name?: string): string {
  const n = (name ?? "").toLowerCase();
  if (n.includes("chocolate")) return "#6b4a2e";
  if (n.includes("red velvet")) return "#a83b4e";
  if (n.includes("coffee")) return "#6f4a2b";
  if (n.includes("lemon")) return "#f2e08a";
  if (n.includes("pistachio")) return "#bcd08a";
  return "#f0dcae"; // vanilla / default
}

function fillingColor(name?: string): string {
  const n = (name ?? "").toLowerCase();
  if (n.includes("ganache") || n.includes("chocolate")) return "#4a2e22";
  if (n.includes("caramel")) return "#c98a3a";
  if (n.includes("fruit") || n.includes("berry") || n.includes("rasp") || n.includes("straw"))
    return "#c0435e";
  if (n.includes("lemon")) return "#f6e58d";
  return "#fff2df"; // cream / default
}

type Finish = "matte" | "glossy" | "soft";
function frostingFinish(name?: string): Finish {
  const n = (name ?? "").toLowerCase();
  if (n.includes("fondant")) return "glossy";
  if (n.includes("whipped")) return "soft";
  return "matte"; // buttercream / default
}

type ToppingShape = "circle" | "diamond" | "triangle" | "flower";
function mapTopping(name: string): { shape: ToppingShape; color: string } | "candle" {
  const n = name.toLowerCase();
  if (n.includes("candle")) return "candle";
  if (n.includes("gold") || n.includes("leaf")) return { shape: "diamond", color: "#d4af37" };
  if (n.includes("choc") || n.includes("shard")) return { shape: "triangle", color: "#4a2e22" };
  if (n.includes("berr") || n.includes("fruit") || n.includes("rasp") || n.includes("straw"))
    return { shape: "circle", color: "#c0435e" };
  if (n.includes("flower") || n.includes("petal")) return { shape: "flower", color: "#e26d9a" };
  if (n.includes("sprinkle")) return { shape: "circle", color: "#7a5af8" };
  return { shape: "circle", color: "#8a5a3a" };
}

export function CakePreview(props: PreviewState) {
  const {
    primary,
    secondary,
    accent,
    scale,
    shape,
    flavorName,
    fillingName,
    frostingName,
    toppingNames,
    message,
    occasion,
  } = props;
  const reduce = useReducedMotionSafe();

  const sponge = spongeColor(flavorName);
  const filling = fillingColor(fillingName);
  const finish = frostingFinish(frostingName);

  const mapped = toppingNames.map(mapTopping);
  const hasCandle = mapped.includes("candle");
  const toppings = mapped.filter((m): m is Exclude<typeof m, "candle"> => m !== "candle").slice(0, 7);

  const bodyRadius =
    shape === "square"
      ? "8px"
      : shape === "heart"
        ? "45% 45% 42% 42% / 55% 55% 45% 45%"
        : "18px 18px 12px 12px";
  const topRadius = shape === "square" ? "10px" : "50%";

  const finishOverlay =
    finish === "glossy"
      ? "radial-gradient(40% 60% at 32% 22%, rgba(255,255,255,.65), transparent 60%)"
      : finish === "soft"
        ? "linear-gradient(180deg, rgba(255,255,255,.5), transparent 55%)"
        : "repeating-linear-gradient(115deg, rgba(255,255,255,.14) 0 6px, transparent 6px 12px)";

  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden">
      <div
        aria-hidden
        className="absolute inset-0"
        style={{ background: `radial-gradient(60% 55% at 50% 42%, ${secondary}22, transparent 70%)` }}
      />
      <AnimatePresence>
        {occasion && (
          <motion.span
            key={occasion}
            initial={reduce ? false : { y: -8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute left-1/2 top-6 -translate-x-1/2 rounded-full px-3 py-1 text-xs font-semibold text-white"
            style={{ backgroundColor: secondary }}
          >
            {occasion}
          </motion.span>
        )}
      </AnimatePresence>

      <motion.div
        className="relative"
        animate={reduce ? undefined : { y: [0, -8, 0] }}
        transition={reduce ? undefined : { duration: 6, repeat: Infinity, ease: "easeInOut" }}
        style={{ width: 280 }}
      >
        <motion.div
          animate={{ scale }}
          transition={{ type: "spring", stiffness: 260, damping: 22 }}
          style={{ transformOrigin: "bottom center" }}
        >
          {/* candle */}
          {hasCandle && (
            <div className="mb-0.5 flex justify-center">
              <div className="relative">
                {!reduce && (
                  <motion.span
                    className="absolute -top-4 left-1/2 h-3 w-2 -translate-x-1/2 rounded-full"
                    style={{ background: "radial-gradient(circle at 50% 30%, #ffe08a, #ff8a3d)" }}
                    animate={{ scaleY: [1, 1.25, 0.95, 1.15, 1], opacity: [0.9, 1, 0.85, 1, 0.9] }}
                    transition={{ duration: 0.9, repeat: Infinity, ease: "easeInOut" }}
                  />
                )}
                {reduce && (
                  <span
                    className="absolute -top-4 left-1/2 h-3 w-2 -translate-x-1/2 rounded-full"
                    style={{ background: "radial-gradient(circle at 50% 30%, #ffe08a, #ff8a3d)" }}
                  />
                )}
                <span className="block h-6 w-1.5 rounded-sm" style={{ backgroundColor: accent }} />
              </div>
            </div>
          )}

          {/* toppings */}
          <div className="relative z-10 mx-auto -mb-2 flex h-4 w-44 items-end justify-around">
            <AnimatePresence mode="popLayout">
              {toppings.map((t, i) => (
                <motion.span
                  key={`${i}-${t.shape}-${t.color}`}
                  initial={reduce ? false : { scale: 0, y: 10 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 520, damping: 16, delay: i * 0.03 }}
                  className={t.shape === "flower" ? "text-base leading-none" : "block"}
                  style={toppingStyle(t.shape, t.color)}
                >
                  {t.shape === "flower" ? "✿" : null}
                </motion.span>
              ))}
            </AnimatePresence>
          </div>

          {/* frosting top — remounts (pops) when finish/color changes */}
          <motion.div
            key={`${finish}-${primary}`}
            initial={reduce ? false : { scale: 0.94, opacity: 0.7 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 420, damping: 20 }}
            className="relative mx-auto h-16 w-44 shadow-lg"
            style={{ backgroundColor: primary, borderRadius: topRadius }}
          >
            <span className="absolute inset-0" style={{ borderRadius: topRadius, background: finishOverlay }} />
          </motion.div>

          {/* drips */}
          <div className="relative mx-auto -mt-2 flex w-44 justify-around">
            {Array.from({ length: 5 }).map((_, i) => (
              <span
                key={i}
                className="h-3 w-3 rounded-b-full"
                style={{ backgroundColor: primary, opacity: 0.9 }}
              />
            ))}
          </div>

          {/* message band */}
          <div
            className="relative z-10 mx-auto -mt-1 flex h-9 w-52 items-center justify-center px-3 shadow"
            style={{ backgroundColor: "#fffaf3", borderRadius: "10px" }}
          >
            <span className="truncate font-display text-sm font-semibold" style={{ color: accent }}>
              {message || "Your cake"}
            </span>
          </div>

          {/* base tier — sponge color tweens on flavor change; filling stripe */}
          <motion.div
            className="relative mx-auto -mt-1 h-28 w-60 overflow-hidden"
            style={{ borderRadius: bodyRadius }}
            animate={{ backgroundColor: sponge }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <motion.span
              className="absolute left-0 right-0 top-1/2 h-3 -translate-y-1/2"
              animate={{ backgroundColor: filling }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            />
            <span
              className="absolute inset-x-0 top-0 h-4"
              style={{ background: "rgba(255,255,255,.14)" }}
            />
          </motion.div>

          {/* plate */}
          <div className="mx-auto mt-1 h-3 w-64 rounded-full bg-black/10" />
        </motion.div>
      </motion.div>
    </div>
  );
}

function toppingStyle(shape: ToppingShape, color: string): React.CSSProperties {
  if (shape === "flower") return { color };
  if (shape === "diamond")
    return { width: 12, height: 12, backgroundColor: color, transform: "rotate(45deg)", borderRadius: 2 };
  if (shape === "triangle")
    return {
      width: 0,
      height: 0,
      borderLeft: "6px solid transparent",
      borderRight: "6px solid transparent",
      borderBottom: `12px solid ${color}`,
      backgroundColor: "transparent",
    };
  return { width: 12, height: 12, backgroundColor: color, borderRadius: "9999px" };
}
