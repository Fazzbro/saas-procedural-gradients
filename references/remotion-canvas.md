# Remotion Integration: Deterministic 60 FPS Procedural Gradients

In Remotion videos, animations must never rely on real-time wall-clock timestamps (`performance.now()` or `Date.now()`). Relying on wall-clock time causes frame pacing jitter, duplicate frames, and stuttering renders.

This guide provides the official pattern to embed procedural animated gradients into Remotion compositions with **100% deterministic frame accuracy**.

---

## 1. The Core Remotion React Component

```tsx
import React, { useRef, useLayoutEffect } from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { renderGradient } from "./gradient_renderer";

interface ProceduralGradientProps {
  type?: "melt" | "mesh" | "silk" | "beams" | "glow" | "ripple" | "ribbons" | "tide" | "halo" | "horizon" | "linear" | "radial" | "conic";
  colours?: string[];
  speed?: number; // 100 = 1.0x speed
  glass?: number; // 0 to 100
  grain?: number; // 0 to 100
  options?: Record<string, any>;
  style?: React.CSSProperties;
}

export const ProceduralGradient: React.FC<ProceduralGradientProps> = ({
  type = "melt",
  colours = ["#140741", "#391B99", "#B02A9A", "#F3528D", "#F7A3C3", "#FFF0F3"],
  speed = 60,
  glass = 0,
  grain = 20,
  options = {},
  style = {},
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // Convert Remotion frame index into deterministic animation clock (seconds)
  const clock = (frame / fps) * (speed / 100);

  // Format stops as expected by gradient engine
  const stops = colours.map((c, i) => ({
    c: c.toLowerCase(),
    p: Math.round((i * 100) / Math.max(1, colours.length - 1)),
  }));

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    renderGradient(ctx, width, height, clock, type, stops, {
      glass,
      grain,
      ...options,
    });
  }, [clock, width, height, type, stops, glass, grain, options]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        ...style,
      }}
    />
  );
};
```

---

## 2. Composing with Floating UI Bento Cards

In Haute Motion SaaS compositions, place the procedural gradient as the ambient stage background, behind floating glass or obsidian UI cards:

```tsx
import { AbsoluteFill, Sequence } from "remotion";
import { ProceduralGradient } from "./ProceduralGradient";

export const HeroScene: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#08090D" }}>
      {/* 1. Procedural Melt Gradient Stage */}
      <ProceduralGradient
        type="melt"
        colours={["#0A1033", "#1B2A8A", "#2A6FDB", "#27B5C9", "#7FE5D0", "#E6FFFA"]}
        speed={50}
        grain={25}
        glass={0}
        options={{ tilt: -12, melt: 65, glow: 50 }}
      />

      {/* 2. Optical Vignette / Contrast Darkening */}
      <AbsoluteFill
        style={{
          background: "radial-gradient(circle at 50% 50%, transparent 40%, rgba(0,0,0,0.65) 100%)",
        }}
      />

      {/* 3. Floating UI Content */}
      <Sequence from={15}>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {/* Card / Bento / Headline */}
        </div>
      </Sequence>
    </AbsoluteFill>
  );
};
```

---

## 3. Pairing with Fluted Glass Containers

When rendering a luxury glass card floating over content:

```tsx
<ProceduralGradient
  type="silk"
  colours={["#FFF0F3", "#F3528D", "#391B99", "#140741"]}
  glass={65}
  options={{ gbars: 36, gloss: 75 }}
  style={{
    borderRadius: 24,
    border: "1px solid rgba(255,255,255,0.2)",
    boxShadow: "0 24px 48px -12px rgba(0,0,0,0.85)",
  }}
/>
```

---

## 4. Performance & Render Guarantees

* **Zero Frame Drops**: Because the animation state depends strictly on `frame / fps`, Remotion's headless renderer can render at whatever speed the host CPU/GPU operates without dropping or skipping a single frame.
* **Resolution Scaling**: The procedural engine renders per-pixel math at an internal multi-harmonic scale buffer (`renderField` with max dimension 300–360px) and smoothly bilinearly upscales to the destination canvas with zero jagged edges, achieving high 60fps render throughput even at 4K resolution.
