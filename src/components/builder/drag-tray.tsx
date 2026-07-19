"use client";

import { useRef, useState } from "react";
import { motion, type PanInfo } from "framer-motion";
import { Plus, X, Hand } from "lucide-react";
import { formatCurrency } from "@/lib/utils/format";
import { useReducedMotionSafe } from "@/hooks/use-reduced-motion-safe";
import type { BuilderOption } from "@/lib/builder/steps";

interface DragTrayProps {
  options: BuilderOption[];
  selectedIds: string[];
  currency: string;
  locale: string;
  primary: string;
  secondary: string;
  onToggle: (id: string) => void;
}

/**
 * Drag-and-drop ingredient tray (Phase 5e). Drag a chip onto the drop zone to
 * add it to the cake, or simply TAP/keyboard-activate it — full parity so it
 * works for touch, pointer, and assistive tech. Placed items show as removable
 * pills; the live preview reflects them immediately.
 */
export function DragTray({
  options,
  selectedIds,
  currency,
  locale,
  primary,
  secondary,
  onToggle,
}: DragTrayProps) {
  const reduce = useReducedMotionSafe();
  const dropRef = useRef<HTMLDivElement>(null);
  // Id of the chip currently being dragged (moved), so its trailing click is
  // suppressed — a drag and a tap must never both toggle the same chip.
  const movedRef = useRef<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const selected = options.filter((o) => selectedIds.includes(o.id));

  function handleDragEnd(id: string, info: PanInfo) {
    const el = dropRef.current;
    if (el) {
      const r = el.getBoundingClientRect();
      const { x, y } = info.point;
      if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) {
        if (!selectedIds.includes(id)) onToggle(id);
      }
    }
    setDragging(false);
  }

  function handleClick(id: string) {
    if (movedRef.current === id) {
      movedRef.current = null; // this "click" is the tail of a drag — ignore
      return;
    }
    onToggle(id);
  }

  return (
    <div>
      {/* Drop zone */}
      <div
        ref={dropRef}
        aria-hidden
        className="mb-5 rounded-xl border-2 border-dashed p-4 transition-colors"
        style={{
          borderColor: dragging ? primary : undefined,
          backgroundColor: dragging ? `${primary}0d` : undefined,
        }}
      >
        <p className="mb-2 flex items-center gap-1.5 text-sm text-choco-500">
          <Hand className="h-4 w-4" /> Drag here to add — or tap an option below
        </p>
        {selected.length === 0 ? (
          <p className="py-2 text-sm text-choco-400">Nothing added yet.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {selected.map((o) => (
              <motion.span
                key={o.id}
                layout
                initial={reduce ? false : { scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm text-white"
                style={{ backgroundColor: secondary }}
              >
                {o.name}
                <button onClick={() => onToggle(o.id)} aria-label={`Remove ${o.name}`}>
                  <X className="h-3.5 w-3.5" />
                </button>
              </motion.span>
            ))}
          </div>
        )}
      </div>

      {/* Tray of draggable chips */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {options.map((o) => {
          const isSel = selectedIds.includes(o.id);
          return (
            <motion.button
              key={o.id}
              type="button"
              aria-pressed={isSel}
              onClick={() => handleClick(o.id)}
              drag={!reduce}
              dragSnapToOrigin
              dragElastic={0.25}
              onDragStart={() => {
                movedRef.current = null;
                setDragging(true);
              }}
              onDrag={() => {
                movedRef.current = o.id;
              }}
              onDragEnd={(_, info) => handleDragEnd(o.id, info)}
              whileDrag={{ scale: 1.08, zIndex: 50, cursor: "grabbing" }}
              whileTap={reduce ? undefined : { scale: 0.97 }}
              className={`relative flex touch-none items-center justify-between gap-2 rounded-xl border-2 bg-surface p-3 text-left ${
                isSel ? "shadow-lift" : "border-cream-300 hover:border-cream-400"
              }`}
              style={isSel ? { borderColor: primary } : undefined}
            >
              <span className="min-w-0">
                <span className="block truncate font-display text-sm font-medium text-choco-800">
                  {o.name}
                </span>
                {o.priceMinor > 0 && (
                  <span className="block text-xs text-choco-400">
                    +{formatCurrency(o.priceMinor, currency, locale)}
                  </span>
                )}
              </span>
              <span
                className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-white"
                style={{ backgroundColor: isSel ? primary : "#d9c9be" }}
              >
                {isSel ? <span className="text-xs">✓</span> : <Plus className="h-3.5 w-3.5" />}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
