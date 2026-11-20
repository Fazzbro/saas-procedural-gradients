---
name: saas-procedural-gradients
description: >-
  Pure-code procedural animated gradient generator and optical shader engine for
  high-end SaaS product launches and motion graphics in Remotion and HyperFrames.
  Synthesizes 13 deterministic 60fps gradient engines:
  (1) Melt (multi-harmonic sinusoidal liquid wave displacement),
  (2) Mesh (procedural orbiting Gaussian control point clusters),
  (3) Silk (anisotropic wave folding with angular tension),
  (4) Beams (volumetric angular ray scattering with exponential decay),
  (5) Glow (thermal incandescent multi-blob distortion fields),
  (6) Ripple (concentric polar wave propagation),
  (7) Ribbons (stratified sine ribbons with specular shine),
  (8) Tide (layered wave contours with multi-frequency modulation),
  (9) Halo (concentric elliptical blooms with optical dissipation),
  (10) Horizon (anamorphic radial sun burst with ground plane perspective),
  (11) Linear (continuous rotational multi-stop linear gradient),
  (12) Radial (center-drifting geometric boundary radial gradient), and
  (13) Conic (rotational sweep gradient with 360-degree cyclic wrap).
  Includes procedural fluted glass optical refraction passes, cryptographic film grain,
  and archetype-to-palette mapping across the 6 Haute Motion archetypes.
  Use when styling, animating, or coding procedural gradient backdrops, hero stages,
  ambient lighting, or glass containers in Remotion or HyperFrames without lag or frame drops.
version: 1.0.0
triggers:
  - procedural gradient
  - animated gradient background
  - melt gradient
  - mesh gradient
  - silk gradient
  - remotion gradient background
  - saas hero gradient
  - fluted glass gradient
  - procedural glass pass
  - hyperframes gradient backdrop
---

# SaaS Procedural Gradients & Optical Shaders (`saas-procedural-gradients`)

Never settle for muddy two-stop linear CSS gradients (`#333333` to `#111111`, or generic violet-to-cyan) that look like generic 2021 web templates. World-class motion design (Apple keynote transitions, Linear hero reveals, Raycast launch films) relies on **mathematically continuous, multi-harmonic chromatic strata** that move organically at 60 FPS without dropping frames.

This skill provides **13 zero-slop procedural gradient engines**, optical fluted glass refraction, and cryptographic film grain noise, engineered for **Remotion** and **HyperFrames**.

---

## 0. THE CONSTITUTION OF TASTE: GRADIENT RULES

1. **NEVER** use 2-stop linear gradients as a hero background. A flat linear gradient looks artificial and static. Always use multi-stop Gaussian stack blends ($N \ge 4$ stops) or harmonic procedural fields.
2. **NEVER** use muddy mid-gray transitions. When transitioning between warm and cool colors, interpolate in HSL or pass through an intentional intermediary chroma tone rather than letting RGB math create dirty grays.
3. **NEVER** animate gradients using real-time wall-clock timestamps (`performance.now()` or `Date.now()`). In Remotion, always drive the animation clock deterministically from frame indices:
   $$\text{clock} = \left(\frac{\text{frame}}{\text{fps}}\right) \times \left(\frac{\text{speed}}{100}\right)$$
4. **NEVER** apply text directly over high-contrast gradient transitions without a dedicated contrast backing, vignette, or WCAG AAA rating check.
5. **ALWAYS** add a subtle film grain pass (`grain: 15–25`) over large gradient surfaces to eliminate 8-bit display quantization banding.

---

## 1. THE 13 PROCEDURAL GRADIENT ENGINES

All engines render into standard HTML5 `<canvas>` contexts via `renderGradient(ctx, width, height, clock, type, stops, options)`:

| Engine | Visual Character | Key Parameters | Best Paired Archetype |
| :--- | :--- | :--- | :--- |
| **`melt`** | Flowing liquid chromatic strata with directional gravity and peak bloom | `scale`, `melt`, `rise`, `peaks`, `tilt`, `glow`, `dir` | Electric Cobalt / Dynamic |
| **`mesh`** | Smooth organic orbiting color blobs with radial Gaussian falloff | `size`, `seed` | Obsidian Precision |
| **`silk`** | Luxury fabric tension folds with anisotropic wave harmonics | `folds`, `twist`, `sang`, `blend` | Neo-Swiss Minimal |
| **`beams`** | Celestial volumetric light rays with exponential spatial decay | `rays`, `srcx`, `srcy`, `rreach`, `blend` | Celestial Technical |
| **`glow`** | Incandescent volumetric thermal blobs with multi-frequency warp | `gang`, `gwarp`, `gspot`, `blend` | Obsidian Precision |
| **`ripple`** | Concentric acoustic wave propagation with polar coordinate distortion | `rrings`, `rwarp`, `rcx`, `rcy` | Editorial Industrial |
| **`ribbons`** | Stratified spectral ribbons with specular highlights and depth | `ramp`, `rwid`, `rtilt`, `rsoft` | Neo-Swiss Minimal |
| **`tide`** | Ocean wave horizon strata with multi-frequency layering | `amp`, `freq`, `soft` | Editorial Monograph |
| **`halo`** | Concentric elliptical blooms with variable squash and blur | `hsize`, `squash`, `posy`, `soft` | Celestial Technical |
| **`horizon`** | Anamorphic radial sun burst with ground-plane perspective | `horizon`, `sun`, `spread`, `reach`, `hblend` | Obsidian Precision |
| **`linear`** | Angular multi-stop linear gradient with smooth rotational drift | `angle` | Neo-Swiss Minimal |
| **`radial`** | Center-drifting multi-stop geometric boundary radial gradient | *(continuous orbital drift)* | Minimal Stage |
| **`conic`** | 360-degree rotational chromatic sweep gradient | `angle` | Playful Kinetic Pop |

---

## 2. OPTICAL POST-PROCESSING PASSES

### Pass A: Fluted Glass Refraction (`glassPass`)
Simulates architectural ribbed/reeded glass. Divides the canvas into $B$ vertical cylindrical bars and re-samples source coordinates with cylindrical lens distortion and specular edge sheen:

```typescript
// Enable fluted glass over any gradient
options = {
  glass: 60, // Refraction intensity (0 to 100)
  gbars: 32, // Number of glass bars (6 to 80)
  gloss: 75, // Specular gloss reflection (0 to 100)
};
```

### Pass B: Cryptographic Film Grain (`grainPass`)
Eliminates 8-bit color banding on OLED and LCD screens by compositing cryptographic white noise in `overlay` blend mode with sub-pixel jitter:

```typescript
// Enable film grain
options = {
  grain: 20, // Opacity (0 to 100)
  gsize: 1.5, // Scale multiplier (1.0 to 4.0)
};
```

---

## 3. ARCHETYPE-TO-PALETTE MAPPING

Map your project's chosen Haute Motion Archetype to its proven color palette:

```typescript
export const PALETTES = {
  // Archetype 1: Neo-Swiss Minimal
  ink: ["#F2F2F2", "#BDBDC6", "#7E7E8E", "#42424F", "#1E1E28", "#09090D"],
  glacier: ["#F4FBFF", "#BFE6FF", "#7CB8F5", "#4F7DE0", "#2B3D9A", "#0F1740"],

  // Archetype 2: Obsidian Precision
  aurora: ["#E8FFF4", "#7DF9C6", "#3FD0E8", "#5A7CF5", "#8A3FD6", "#1A0B3D"],
  lagoon: ["#E6FFFA", "#7FE5D0", "#27B5C9", "#2A6FDB", "#1B2A8A", "#0A1033"],

  // Archetype 3: Electric Cobalt / Dynamic
  iris: ["#F6F0FF", "#CDB8FF", "#9A7BFF", "#6A3DE8", "#3B1C9E", "#120A3A"],
  flamingo: ["#FFF0F3", "#F7A3C3", "#F3528D", "#B02A9A", "#391B99", "#140741"],

  // Archetype 4: Anodized Industrial / Hardware
  molten: ["#FFF3C4", "#FFC247", "#FF7A1A", "#E5321F", "#7A1030", "#1C0614"],
  ember: ["#FFE8D6", "#FF9A62", "#F0533A", "#A61E3A", "#4A0F3A", "#12071F"],

  // Archetype 5: Editorial Monograph
  wine: ["#FFEFEA", "#F3A6A0", "#D9506B", "#8E1F58", "#46113F", "#14071A"],
  jade: ["#F0FFE8", "#B9F29B", "#4FD18B", "#12A08A", "#0D5E78", "#07213A"],

  // Archetype 6: Playful Kinetic Pop
  sherbet: ["#FFF6E0", "#FFC9A1", "#FF8FA3", "#E070D8", "#8F6CF0", "#3E3AA8"],
  candy: ["#FFF0FA", "#FFB3E6", "#FF7AC8", "#B37CFF", "#6FA8FF", "#7FE8FF"],
};
```

---

## 4. REMOTION CODE BLUEPRINT

Import `gradient_renderer.js` directly into your Remotion React tree:

```tsx
import React, { useRef, useLayoutEffect } from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { renderGradient } from "./gradient_renderer";

export const ProceduralGradientScene: React.FC<{
  type?: "melt" | "silk" | "mesh" | "beams" | "glow" | "ribbons";
  colours: string[];
  speed?: number;
  glass?: number;
  grain?: number;
}> = ({ type = "melt", colours, speed = 60, glass = 0, grain = 20 }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // 100% deterministic clock derived strictly from frame index
  const clock = (frame / fps) * (speed / 100);

  const stops = colours.map((c, i) => ({
    c: c.toLowerCase(),
    p: Math.round((i * 100) / Math.max(1, colours.length - 1)),
  }));

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    renderGradient(ctx, width, height, clock, type, stops, { glass, grain });
  }, [clock, width, height, type, stops, glass, grain]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
    />
  );
};
```

---

## 5. HYPERFRAMES CODE BLUEPRINT

In HyperFrames web compositions, embed in your continuous render loop:

```javascript
import { renderGradient } from "./gradient_renderer.js";

const canvas = document.querySelector("#bg-canvas");
const ctx = canvas.getContext("2d");
let clock = 0;
let last = performance.now();

function render(time) {
  const now = performance.now();
  clock += ((now - last) / 1000) * 0.6; // Speed 60%
  last = now;

  renderGradient(ctx, canvas.width, canvas.height, clock, "silk", stops, {
    grain: 20,
    glass: 0,
    folds: 5,
    twist: 70,
  });

  requestAnimationFrame(render);
}
requestAnimationFrame(render);
```

---

## 6. SIBLING SKILL ORCHESTRATION

* **Pair with `saas-kinetic-typography`**: Place a high-contrast `melt` or `silk` gradient stage behind headline typography or Reddit/Slack discussion threads.
* **Pair with `saas-procedural-backdrops`**: Use procedural gradients to illuminate the horizon of an architectural dashed guideline grid.
* **Pair with `remotion-markup`**: When UI cards animate across the gradient, wrap them in `<HtmlInCanvasMotionBlur>` with shutter angle $180^\circ$ for cinematic optical motion blur.
