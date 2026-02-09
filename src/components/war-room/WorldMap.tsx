"use client";

import { ComposableMap, Geographies, Geography, Marker, Line } from "react-simple-maps";
import type { ExportFlow } from "@/types/premium";

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

interface Props { flows: ExportFlow[] }

export default function WorldMap({ flows }: Props) {
  return (
    <div className="glass-card overflow-hidden p-4">
      <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-wr-muted">
        Flux export temps réel
      </h3>
      <div className="h-[380px]">
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{ scale: 130, center: [15, 30] }}
          style={{ width: "100%", height: "100%" }}
        >
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map((geo) => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill="#1a1a2e"
                  stroke="#2a2a3e"
                  strokeWidth={0.5}
                  style={{ hover: { fill: "#2a2a3e" } }}
                />
              ))
            }
          </Geographies>

          {/* Flow lines */}
          {flows.map((f, i) => (
            <Line
              key={i}
              from={[f.from[1], f.from[0]]}
              to={[f.to[1], f.to[0]]}
              stroke="#00ff88"
              strokeWidth={Math.max(1, f.orders * 0.8)}
              strokeOpacity={0.5}
              strokeLinecap="round"
              style={{ pointerEvents: "none" }}
            />
          ))}

          {/* Origin marker - Tlemcen */}
          {flows.length > 0 && (
            <Marker coordinates={[flows[0].from[1], flows[0].from[0]]}>
              <circle r={5} fill="#00ff88" className="animate-pulse-glow" />
              <text textAnchor="middle" y={-10} style={{ fontSize: 10, fill: "#00ff88", fontWeight: "bold" }}>
                Tlemcen
              </text>
            </Marker>
          )}

          {/* Destination markers */}
          {flows.map((f, i) => (
            <Marker key={i} coordinates={[f.to[1], f.to[0]]}>
              <circle r={3} fill="#3b82f6" />
              <text textAnchor="middle" y={-8} style={{ fontSize: 8, fill: "#a0a0b0" }}>
                {f.toLabel}
              </text>
            </Marker>
          ))}
        </ComposableMap>
      </div>
    </div>
  );
}
