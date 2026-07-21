"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { Rotate3d } from "lucide-react";
import { CakePreview, type PreviewState } from "./cake-preview";
import { useReducedMotionSafe } from "@/hooks/use-reduced-motion-safe";

// Heavy 3D bundle (three/R3F/drei) — code-split and client-only.
const Cake3DScene = dynamic(() => import("./cake-3d"), {
  ssr: false,
  loading: () => <div className="skeleton absolute inset-0" aria-hidden />,
});

/** WebGL + rough device-capability gate for the 3D preview. */
function supports3D(): boolean {
  try {
    const c = document.createElement("canvas");
    const gl = c.getContext("webgl2") || c.getContext("webgl");
    if (!gl) return false;
    const mem = (navigator as unknown as { deviceMemory?: number }).deviceMemory;
    return mem === undefined || mem > 2;
  } catch {
    return false;
  }
}

/**
 * Preview host. Renders the 2.5D preview on the server and until the client
 * decides, then upgrades to the interactive 3D cake when WebGL + device allow;
 * otherwise stays on 2.5D. Both react to the same PreviewState.
 */
export function CakePreview3D(props: PreviewState) {
  const reduced = useReducedMotionSafe();
  const [decided, setDecided] = useState(false);
  const [use3d, setUse3d] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      setUse3d(supports3D());
      setDecided(true);
    });
    return () => cancelAnimationFrame(id);
  }, []);

  if (!decided || !use3d) return <CakePreview {...props} />;

  return (
    <div className="relative h-full w-full">
      <Cake3DScene {...props} reduced={reduced} />
      {props.occasion && (
        <span
          className="pointer-events-none absolute left-1/2 top-6 -translate-x-1/2 rounded-full px-3 py-1 text-xs font-semibold text-white"
          style={{ backgroundColor: props.secondary }}
        >
          {props.occasion}
        </span>
      )}
      <span className="pointer-events-none absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-white/80 px-3 py-1 text-xs text-choco-500 backdrop-blur">
        <Rotate3d className="h-3.5 w-3.5" /> Drag to rotate · scroll to zoom
      </span>
    </div>
  );
}
