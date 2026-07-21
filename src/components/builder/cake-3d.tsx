"use client";

import { useMemo, useRef, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, ContactShadows } from "@react-three/drei";
import * as THREE from "three";
import { spongeColor, mapTopping } from "@/lib/builder/preview-mapping";
import type { PreviewState } from "./cake-preview";

type Props = PreviewState & { reduced: boolean };

const TIER_H = 0.85;
// Whole-cake scale by tier count, so a tall 5-tier cake still fits the frame.
const FIT: Record<number, number> = { 1: 0.62, 2: 0.56, 3: 0.5, 4: 0.45, 5: 0.4 };

/** Parametric heart geometry (single-tier only). */
function useHeartGeometry() {
  return useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(0, 0.5);
    s.bezierCurveTo(0, 0.5, -0.4, 1.2, -1, 1.2);
    s.bezierCurveTo(-1.8, 1.2, -1.8, 0.2, -1.8, 0.2);
    s.bezierCurveTo(-1.8, -0.6, -0.9, -1.4, 0, -1.9);
    s.bezierCurveTo(0.9, -1.4, 1.8, -0.6, 1.8, 0.2);
    s.bezierCurveTo(1.8, 0.2, 1.8, 1.2, 1, 1.2);
    s.bezierCurveTo(0.4, 1.2, 0, 0.5, 0, 0.5);
    const geo = new THREE.ExtrudeGeometry(s, {
      depth: 1.1,
      bevelEnabled: true,
      bevelThickness: 0.08,
      bevelSize: 0.08,
      bevelSegments: 2,
      steps: 1,
    });
    geo.center();
    geo.rotateX(-Math.PI / 2);
    return geo;
  }, []);
}

/**
 * Drives render frames for ~600ms whenever `dep` changes, so the demand-mode
 * canvas actually animates the tier-grow and topping-drop lerps. No-op (single
 * frame) when reduced motion is on.
 */
function AnimationKick({ dep, animate }: { dep: string; animate: boolean }) {
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    invalidate();
    if (!animate) return;
    let raf = 0;
    const start = performance.now();
    const loop = () => {
      invalidate();
      if (performance.now() - start < 650) raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [dep, animate, invalidate]);
  return null;
}

/** One cake tier that scales in/out when it enters or leaves the stack. */
function Tier({
  index,
  count,
  bottomY,
  shape,
  sponge,
  frostingColor,
  roughness,
  clearcoat,
  animate,
}: {
  index: number;
  count: number;
  bottomY: number;
  shape: "round" | "square";
  sponge: string;
  frostingColor: string;
  roughness: number;
  clearcoat: number;
  animate: boolean;
}) {
  const g = useRef<THREE.Group>(null);
  const target = index < count ? 1 : 0;
  const cur = useRef(animate ? (index < count ? 0.001 : 0) : target);

  useFrame(() => {
    if (!g.current) return;
    cur.current += (target - cur.current) * 0.16;
    if (Math.abs(target - cur.current) < 0.002) cur.current = target;
    g.current.scale.setScalar(Math.max(0.0001, cur.current));
    g.current.visible = cur.current > 0.01;
  });

  const r = 1.2 * (1 - 0.14 * index);
  const side = 2.3 * (1 - 0.13 * index);

  return (
    <group ref={g} position={[0, bottomY, 0]}>
      {shape === "square" ? (
        <>
          <mesh position={[0, TIER_H / 2, 0]} castShadow>
            <boxGeometry args={[side, TIER_H, side]} />
            <meshStandardMaterial color={sponge} roughness={0.9} />
          </mesh>
          <mesh position={[0, TIER_H - 0.02, 0]} castShadow>
            <boxGeometry args={[side * 1.05, 0.28, side * 1.05]} />
            <meshPhysicalMaterial color={frostingColor} roughness={roughness} clearcoat={clearcoat} clearcoatRoughness={0.3} />
          </mesh>
        </>
      ) : (
        <>
          <mesh position={[0, TIER_H / 2, 0]} castShadow>
            <cylinderGeometry args={[r, r, TIER_H, 64]} />
            <meshStandardMaterial color={sponge} roughness={0.9} />
          </mesh>
          <mesh position={[0, TIER_H - 0.02, 0]} castShadow>
            <cylinderGeometry args={[r * 1.06, r * 1.06, 0.28, 64]} />
            <meshPhysicalMaterial color={frostingColor} roughness={roughness} clearcoat={clearcoat} clearcoatRoughness={0.3} />
          </mesh>
        </>
      )}
    </group>
  );
}

/** A topping that drops onto the cake from above when it first appears. */
function Topping({ x, y, z, color, animate }: { x: number; y: number; z: number; color: string; animate: boolean }) {
  const m = useRef<THREE.Mesh>(null);
  const cur = useRef(animate ? y + 1.5 : y);
  useFrame(() => {
    if (!m.current) return;
    cur.current += (y - cur.current) * 0.16;
    if (Math.abs(y - cur.current) < 0.002) cur.current = y;
    m.current.position.y = cur.current;
  });
  return (
    <mesh ref={m} position={[x, cur.current, z]} castShadow>
      <sphereGeometry args={[0.13, 20, 20]} />
      <meshStandardMaterial color={color} roughness={0.4} />
    </mesh>
  );
}

function Cake({
  shape,
  frostingColor,
  sponge,
  finish,
  toppings,
  hasCandle,
  accent,
  scale,
  tiers,
  animate,
}: {
  shape: PreviewState["shape"];
  frostingColor: string;
  sponge: string;
  finish: "matte" | "glossy" | "soft";
  toppings: { color: string }[];
  hasCandle: boolean;
  accent: string;
  scale: number;
  tiers: number;
  animate: boolean;
}) {
  const heart = useHeartGeometry();
  const roughness = finish === "glossy" ? 0.15 : finish === "soft" ? 0.65 : 0.45;
  const clearcoat = finish === "glossy" ? 1 : 0.2;

  const count = Math.max(1, Math.min(5, Math.round(tiers || 1)));
  const isHeart = shape === "heart";
  const stackShape: "round" | "square" = shape === "square" ? "square" : "round";
  const groupScale = scale * (FIT[count] ?? 0.5);
  const stackOffset = -(count * TIER_H) / 2; // vertically centre the stack

  // Top surface where toppings/candle sit.
  const topR = 1.2 * (1 - 0.14 * (count - 1));
  const topY = isHeart ? 0.5 : count * TIER_H + stackOffset;
  const ringR = isHeart ? 0.45 : shape === "square" ? topR * 0.62 : topR * 0.6;
  const plateY = isHeart ? -0.66 : stackOffset - 0.12;

  return (
    <group scale={groupScale} position={[0, 0, 0]}>
      {/* plate */}
      <mesh position={[0, plateY, 0]} receiveShadow>
        <cylinderGeometry args={[topR + 0.9, topR + 1.0, 0.14, 48]} />
        <meshStandardMaterial color="#efe6df" roughness={0.8} />
      </mesh>

      {isHeart ? (
        <mesh geometry={heart} scale={0.6} castShadow>
          <meshPhysicalMaterial color={frostingColor} roughness={roughness} clearcoat={clearcoat} clearcoatRoughness={0.3} />
        </mesh>
      ) : (
        // Always mount 5 slots so add/remove animates; each scales to its target.
        [0, 1, 2, 3, 4].map((i) => (
          <Tier
            key={i}
            index={i}
            count={count}
            bottomY={i * TIER_H + stackOffset}
            shape={stackShape}
            sponge={sponge}
            frostingColor={frostingColor}
            roughness={roughness}
            clearcoat={clearcoat}
            animate={animate}
          />
        ))
      )}

      {/* toppings ring on the top tier */}
      {toppings.slice(0, 8).map((t, i) => {
        const a = (i / Math.max(toppings.length, 1)) * Math.PI * 2;
        return (
          <Topping
            key={`${i}-${t.color}`}
            x={Math.cos(a) * ringR}
            y={topY}
            z={Math.sin(a) * ringR}
            color={t.color}
            animate={animate}
          />
        );
      })}

      {/* candle */}
      {hasCandle && (
        <group position={[0, topY, 0]}>
          <mesh position={[0, 0.28, 0]} castShadow>
            <cylinderGeometry args={[0.055, 0.055, 0.56, 16]} />
            <meshStandardMaterial color={accent} roughness={0.6} />
          </mesh>
          <mesh position={[0, 0.62, 0]}>
            <sphereGeometry args={[0.075, 16, 16]} />
            <meshStandardMaterial color="#ffb24d" emissive="#ff8a3d" emissiveIntensity={1.4} />
          </mesh>
        </group>
      )}
    </group>
  );
}

export default function Cake3DScene(props: Props) {
  const { primary, accent, scale, shape, flavorName, toppingNames, frostingName, tiers, reduced } = props;
  const sponge = spongeColor(flavorName);
  const finish =
    (frostingName ?? "").toLowerCase().includes("fondant")
      ? "glossy"
      : (frostingName ?? "").toLowerCase().includes("whipped")
        ? "soft"
        : "matte";

  const mapped = toppingNames.map(mapTopping);
  const hasCandle = mapped.includes("candle");
  const toppings = mapped
    .filter((m): m is Exclude<typeof m, "candle"> => m !== "candle")
    .map((m) => ({ color: m.color }));

  const count = Math.max(1, Math.min(5, Math.round(tiers || 1)));

  return (
    <Canvas
      frameloop="demand"
      dpr={[1, 1.75]}
      camera={{ position: [0, 1.4, 6.8], fov: 40 }}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      style={{ width: "100%", height: "100%" }}
    >
      <color attach="background" args={["#fff6f3"]} />
      <ambientLight intensity={0.7} />
      <directionalLight position={[3, 6, 4]} intensity={1.15} castShadow />
      <directionalLight position={[-4, 2, -2]} intensity={0.35} />
      <AnimationKick dep={`${count}|${toppings.length}|${hasCandle ? 1 : 0}`} animate={!reduced} />
      <Cake
        shape={shape}
        frostingColor={primary}
        sponge={sponge}
        finish={finish}
        toppings={toppings}
        hasCandle={hasCandle}
        accent={accent}
        scale={scale}
        tiers={count}
        animate={!reduced}
      />
      <ContactShadows position={[0, -1.15, 0]} opacity={0.32} scale={9} blur={2.6} far={3.4} />
      <OrbitControls
        makeDefault
        enablePan={false}
        enableDamping
        dampingFactor={0.12}
        minDistance={4}
        maxDistance={10}
        minPolarAngle={0.4}
        maxPolarAngle={Math.PI / 2.05}
        target={[0, 0, 0]}
      />
    </Canvas>
  );
}
