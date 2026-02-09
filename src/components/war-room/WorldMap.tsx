"use client";

import { useState, useCallback } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  Graticule,
  useMapContext,
} from "react-simple-maps";
import { motion, AnimatePresence } from "framer-motion";
import type { ExportFlow } from "@/types/premium";
import { formatCurrency } from "@/lib/utils";

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

/* ── SVG Glow Filters (rendered inside ComposableMap) ── */
function MapDefs() {
  return (
    <defs>
      <filter id="glow-green" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="3" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      <filter id="glow-blue" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="2" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
  );
}

/* ── Curved Arc with 3-layer rendering ── */
function FlowArc({
  flow,
  index,
  onHover,
  onLeave,
}: {
  flow: ExportFlow;
  index: number;
  onHover: (flow: ExportFlow, x: number, y: number) => void;
  onLeave: () => void;
}) {
  const { projection } = useMapContext();

  // Convert [lat, lon] → [lon, lat] for d3 projection
  const from = projection([flow.from[1], flow.from[0]]);
  const to = projection([flow.to[1], flow.to[0]]);

  if (!from || !to) return null;

  const [fromX, fromY] = from;
  const [toX, toY] = to;

  // Quadratic Bezier control point — arc curves upward
  const midX = (fromX + toX) / 2;
  const midY = (fromY + toY) / 2;
  const dist = Math.sqrt((toX - fromX) ** 2 + (toY - fromY) ** 2);
  const curvature = Math.min(dist * 0.3, 80);
  const controlX = midX;
  const controlY = midY - curvature;

  const d = `M ${fromX},${fromY} Q ${controlX},${controlY} ${toX},${toY}`;
  const strokeW = Math.max(1.5, flow.orders * 0.6);

  return (
    <g>
      {/* Per-arc gradient: green origin → blue destination */}
      <defs>
        <linearGradient
          id={`arc-grad-${index}`}
          gradientUnits="userSpaceOnUse"
          x1={fromX}
          y1={fromY}
          x2={toX}
          y2={toY}
        >
          <stop offset="0%" stopColor="#00ff88" stopOpacity={0.9} />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.7} />
        </linearGradient>
      </defs>

      {/* Layer 1: Glow underlay */}
      <path
        d={d}
        fill="none"
        stroke="#00ff88"
        strokeWidth={strokeW + 6}
        strokeOpacity={0.15}
        strokeLinecap="round"
        filter="url(#glow-green)"
        style={{ pointerEvents: "none" }}
      />

      {/* Layer 2: Gradient base arc */}
      <path
        d={d}
        fill="none"
        stroke={`url(#arc-grad-${index})`}
        strokeWidth={strokeW}
        strokeOpacity={0.75}
        strokeLinecap="round"
        style={{ pointerEvents: "none" }}
      />

      {/* Layer 3: Animated flowing dashes */}
      <path
        d={d}
        fill="none"
        stroke="#00ff88"
        strokeWidth={1.5}
        strokeOpacity={0.85}
        strokeLinecap="round"
        strokeDasharray="6 18"
        className="animate-arc-flow"
        style={{ pointerEvents: "none" }}
      />

      {/* Invisible hitbox for hover tooltip */}
      <path
        d={d}
        fill="none"
        stroke="transparent"
        strokeWidth={14}
        style={{ cursor: "pointer" }}
        onMouseEnter={(e) => onHover(flow, e.clientX, e.clientY)}
        onMouseLeave={onLeave}
      />
    </g>
  );
}

/* ── Tlemcen Origin Marker with pulsing rings ── */
function OriginMarker({ coords }: { coords: [number, number] }) {
  return (
    <Marker coordinates={[coords[1], coords[0]]}>
      {/* Expanding ring 1 */}
      <circle r={4} fill="none" stroke="#00ff88" strokeWidth={1.5} className="animate-ring-expand" />
      {/* Expanding ring 2 (staggered) */}
      <circle r={4} fill="none" stroke="#00ff88" strokeWidth={1} className="animate-ring-expand-delayed" />
      {/* Static outer ring */}
      <circle r={7} fill="none" stroke="#00ff88" strokeWidth={0.5} strokeOpacity={0.3} />
      {/* Core dot with glow */}
      <circle r={4} fill="#00ff88" filter="url(#glow-green)" />
      {/* Inner bright center */}
      <circle r={1.5} fill="#fff" opacity={0.9} />
      {/* Label */}
      <text
        textAnchor="middle"
        y={-16}
        style={{
          fontSize: 11,
          fill: "#00ff88",
          fontWeight: 700,
          letterSpacing: "1px",
        }}
      >
        TLEMCEN
      </text>
    </Marker>
  );
}

/* ── Destination Marker with proportional size ── */
function DestinationMarker({
  flow,
  onHover,
  onLeave,
}: {
  flow: ExportFlow;
  onHover: (flow: ExportFlow, x: number, y: number) => void;
  onLeave: () => void;
}) {
  const radius = Math.max(2.5, Math.min(5, flow.orders * 0.5));

  return (
    <Marker coordinates={[flow.to[1], flow.to[0]]}>
      {/* Subtle glow ring */}
      <circle
        r={radius + 3}
        fill="none"
        stroke="#3b82f6"
        strokeWidth={0.5}
        strokeOpacity={0.4}
        className="animate-pulse-glow"
      />
      {/* Core marker */}
      <circle
        r={radius}
        fill="#3b82f6"
        filter="url(#glow-blue)"
        style={{ cursor: "pointer" }}
        onMouseEnter={(e) => onHover(flow, e.clientX, e.clientY)}
        onMouseLeave={onLeave}
      />
      {/* Inner bright dot */}
      <circle r={1} fill="#fff" opacity={0.7} />
      {/* Country label */}
      <text
        textAnchor="middle"
        y={-radius - 6}
        style={{
          fontSize: 8,
          fill: "#a0a0c0",
          fontWeight: 600,
          letterSpacing: "0.5px",
        }}
      >
        {flow.toLabel.toUpperCase()}
      </text>
    </Marker>
  );
}

/* ── Tooltip on hover ── */
function FlowTooltip({ flow, x, y }: { flow: ExportFlow; x: number; y: number }) {
  // Clamp to viewport
  const left = Math.min(x + 12, (typeof window !== "undefined" ? window.innerWidth : 1200) - 200);
  const top = Math.max(y - 50, 10);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.15 }}
      className="pointer-events-none fixed z-50 rounded-lg border border-white/10 bg-[#0e0e20]/95 px-3 py-2 shadow-2xl backdrop-blur-sm"
      style={{ left, top }}
    >
      <p className="text-xs font-bold text-white">{flow.toLabel}</p>
      <p className="text-[11px] font-semibold text-[#00ff88]">{formatCurrency(flow.value)}</p>
      <p className="text-[10px] text-[#606070]">{flow.orders} commandes actives</p>
    </motion.div>
  );
}

/* ── Stats HUD Overlay ── */
function StatsOverlay({ flows }: { flows: ExportFlow[] }) {
  const totalValue = flows.reduce((s, f) => s + f.value, 0);
  const totalOrders = flows.reduce((s, f) => s + f.orders, 0);
  const activeRoutes = flows.length;

  return (
    <div className="absolute right-4 top-12 space-y-1.5">
      <div className="rounded-md border border-white/5 bg-[#0a0a1a]/80 px-3 py-1.5 backdrop-blur-sm">
        <p className="text-[9px] uppercase tracking-widest text-[#606070]">Routes actives</p>
        <p className="text-sm font-bold text-[#00ff88]">{activeRoutes}</p>
      </div>
      <div className="rounded-md border border-white/5 bg-[#0a0a1a]/80 px-3 py-1.5 backdrop-blur-sm">
        <p className="text-[9px] uppercase tracking-widest text-[#606070]">Commandes</p>
        <p className="text-sm font-bold text-white">{totalOrders}</p>
      </div>
      <div className="rounded-md border border-white/5 bg-[#0a0a1a]/80 px-3 py-1.5 backdrop-blur-sm">
        <p className="text-[9px] uppercase tracking-widest text-[#606070]">Valeur totale</p>
        <p className="text-sm font-bold text-[#3b82f6]">{formatCurrency(totalValue)}</p>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   Main WorldMap Component
   ══════════════════════════════════════════════════════════ */
interface Props {
  flows: ExportFlow[];
}

export default function WorldMap({ flows }: Props) {
  const [tooltip, setTooltip] = useState<{ flow: ExportFlow; x: number; y: number } | null>(null);

  const handleHover = useCallback((flow: ExportFlow, x: number, y: number) => {
    setTooltip({ flow, x, y });
  }, []);

  const handleLeave = useCallback(() => {
    setTooltip(null);
  }, []);

  return (
    <div className="glass-card relative overflow-hidden p-4">
      <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-wr-muted">
        Flux export temps réel
      </h3>

      <div className="relative h-[380px]">
        <ComposableMap
          projection="geoNaturalEarth1"
          projectionConfig={{ scale: 160, center: [15, 25] }}
          style={{ width: "100%", height: "100%" }}
        >
          {/* SVG filters & gradient defs */}
          <MapDefs />

          {/* Subtle graticule grid */}
          <Graticule stroke="#1e2a40" strokeWidth={0.3} />

          {/* World geography */}
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map((geo) => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill="#16213e"
                  stroke="#2d3a5e"
                  strokeWidth={0.5}
                  style={{
                    default: { outline: "none" },
                    hover: { fill: "#1e2d4a", outline: "none" },
                    pressed: { outline: "none" },
                  }}
                />
              ))
            }
          </Geographies>

          {/* Curved flow arcs */}
          {flows.map((f, i) => (
            <FlowArc
              key={i}
              flow={f}
              index={i}
              onHover={handleHover}
              onLeave={handleLeave}
            />
          ))}

          {/* Origin marker — Tlemcen */}
          {flows.length > 0 && <OriginMarker coords={flows[0].from} />}

          {/* Destination markers */}
          {flows.map((f, i) => (
            <DestinationMarker
              key={i}
              flow={f}
              onHover={handleHover}
              onLeave={handleLeave}
            />
          ))}
        </ComposableMap>

        {/* Stats HUD overlay */}
        <StatsOverlay flows={flows} />
      </div>

      {/* Tooltip */}
      <AnimatePresence>
        {tooltip && (
          <FlowTooltip flow={tooltip.flow} x={tooltip.x} y={tooltip.y} />
        )}
      </AnimatePresence>
    </div>
  );
}
