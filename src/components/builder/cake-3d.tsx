"use client";

import { useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, ContactShadows } from "@react-three/drei";
import * as THREE from "three";
import { spongeColor, mapTopping } from "@/lib/builder/preview-mapping";
import type { PreviewState } from "./cake-preview";

type Props = PreviewState & { reduced: boolean };

/** Parametric cake geometry keyed by shape. */
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

function Cake({
  shape,
  frostingColor,
  sponge,
  finish,
  toppings,
  hasCandle,
  accent,
  scale,
}: {
  shape: PreviewState["shape"];
  frostingColor: string;
  sponge: string;
  finish: "matte" | "glossy" | "soft";
  toppings: { color: string }[];
  hasCandle: boolean;
  accent: string;
  scale: number;
}) {
  const heart = useHeartGeometry();
  const roughness = finish === "glossy" ? 0.15 : finish === "soft" ? 0.65 : 0.45;
  const clearcoat = finish === "glossy" ? 1 : 0.2;

  // Top surface Y where toppings/candle sit, per shape.
  const topY = shape === "heart" ? 0.5 : 0.9;
  const ringR = shape === "square" ? 0.75 : shape === "heart" ? 0.45 : 0.62;

  return (
    <group scale={scale * 0.62} position={[0, 0, 0]}>
      {/* plate */}
      <mesh position={[0, -0.66, 0]} receiveShadow>
        <cylinderGeometry args={[1.85, 1.95, 0.14, 48]} />
        <meshStandardMaterial color="#efe6df" roughness={0.8} />
      </mesh>

      {shape === "heart" ? (
        <mesh geometry={heart} scale={0.6} castShadow>
          <meshPhysicalMaterial color={frostingColor} roughness={roughness} clearcoat={clearcoat} clearcoatRoughness={0.3} />
        </mesh>
      ) : shape === "square" ? (
        <>
          <mesh position={[0, 0, 0]} castShadow>
            <boxGeometry args={[2.3, 1.1, 2.3]} />
            <meshStandardMaterial color={sponge} roughness={0.9} />
          </mesh>
          <mesh position={[0, 0.72, 0]} castShadow>
            <boxGeometry args={[2.42, 0.34, 2.42]} />
            <meshPhysicalMaterial color={frostingColor} roughness={roughness} clearcoat={clearcoat} clearcoatRoughness={0.3} />
          </mesh>
        </>
      ) : (
        <>
          <mesh position={[0, 0, 0]} castShadow>
            <cylinderGeometry args={[1.25, 1.25, 1.1, 64]} />
            <meshStandardMaterial color={sponge} roughness={0.9} />
          </mesh>
          <mesh position={[0, 0.72, 0]} castShadow>
            <cylinderGeometry args={[1.32, 1.32, 0.34, 64]} />
            <meshPhysicalMaterial color={frostingColor} roughness={roughness} clearcoat={clearcoat} clearcoatRoughness={0.3} />
          </mesh>
        </>
      )}

      {/* toppings */}
      {toppings.slice(0, 8).map((t, i) => {
        const a = (i / Math.max(toppings.length, 1)) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(a) * ringR, topY, Math.sin(a) * ringR]} castShadow>
            <sphereGeometry args={[0.13, 20, 20]} />
            <meshStandardMaterial color={t.color} roughness={0.4} />
          </mesh>
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
  const { primary, accent, scale, shape, flavorName, toppingNames, frostingName } = props;
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

  return (
    <Canvas
      frameloop="demand"
      dpr={[1, 1.75]}
      camera={{ position: [0, 1.6, 6.4], fov: 38 }}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      style={{ width: "100%", height: "100%" }}
    >
      <color attach="background" args={["#fff6f3"]} />
      <ambientLight intensity={0.7} />
      <directionalLight position={[3, 6, 4]} intensity={1.15} castShadow />
      <directionalLight position={[-4, 2, -2]} intensity={0.35} />
      <Cake
        shape={shape}
        frostingColor={primary}
        sponge={sponge}
        finish={finish}
        toppings={toppings}
        hasCandle={hasCandle}
        accent={accent}
        scale={scale}
      />
      <ContactShadows position={[0, -0.72, 0]} opacity={0.35} scale={9} blur={2.6} far={3.2} />
      <OrbitControls
        makeDefault
        enablePan={false}
        enableDamping
        dampingFactor={0.12}
        minDistance={4}
        maxDistance={9}
        minPolarAngle={0.5}
        maxPolarAngle={Math.PI / 2.05}
        target={[0, 0.1, 0]}
      />
    </Canvas>
  );
}
