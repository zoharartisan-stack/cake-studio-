/**
 * Shared name → visual mappings used by both the 2.5D and 3D cake previews
 * (heuristic; the bakery doesn't model exact colors yet).
 */

export function spongeColor(name?: string): string {
  const n = (name ?? "").toLowerCase();
  if (n.includes("chocolate")) return "#6b4a2e";
  if (n.includes("red velvet")) return "#a83b4e";
  if (n.includes("coffee")) return "#6f4a2b";
  if (n.includes("lemon")) return "#f2e08a";
  if (n.includes("pistachio")) return "#bcd08a";
  return "#f0dcae"; // vanilla / default
}

export function fillingColor(name?: string): string {
  const n = (name ?? "").toLowerCase();
  if (n.includes("ganache") || n.includes("chocolate")) return "#4a2e22";
  if (n.includes("caramel")) return "#c98a3a";
  if (n.includes("fruit") || n.includes("berry") || n.includes("rasp") || n.includes("straw"))
    return "#c0435e";
  if (n.includes("lemon")) return "#f6e58d";
  return "#fff2df"; // cream / default
}

export type Finish = "matte" | "glossy" | "soft";
export function frostingFinish(name?: string): Finish {
  const n = (name ?? "").toLowerCase();
  if (n.includes("fondant")) return "glossy";
  if (n.includes("whipped")) return "soft";
  return "matte"; // buttercream / default
}

export type ToppingShape = "circle" | "diamond" | "triangle" | "flower";
export type ToppingVisual = { shape: ToppingShape; color: string };

export function mapTopping(name: string): ToppingVisual | "candle" {
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
