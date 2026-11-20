# AGENTS.md — Universal Agent Instructions for Procedural Gradients

> **Agent Protocol Version**: 1.0.0  
> **Skill Name**: `saas-procedural-gradients`  
> **Applies to**: Antigravity, Claude Code, Cursor, Windsurf, Codex, Devin, OpenCode

---

## 🎯 What This Skill Does
This repository provides a universal skill and pure-ESM engine for rendering **13 zero-slop mathematical procedural gradients**, **fluted glass optical refraction**, and **cryptographic film grain** at **60 FPS** with **zero frame drops**.

Use this skill whenever:
1. You are generating a SaaS product launch video, landing page hero, or Remotion/HyperFrames motion composition.
2. The user requests an animated gradient, dynamic lighting horizon, or luxury glass container.
3. You need to replace generic, muddy CSS linear gradients (`#222` to `#111` or neon purple-to-cyan) with world-class, continuous chromatic strata.

---

## 🚫 Hard Negative Constraints for AI Agents

1. **BANNED**: Never write flat 2-stop linear CSS gradients (`linear-gradient(135deg, #333, #111)`). They look cheap and amateurish.
2. **BANNED**: Never animate gradients using `performance.now()` or `Date.now()` inside Remotion. Always derive the clock from Remotion's frame index:
   ```ts
   const clock = (frame / fps) * (speed / 100);
   ```
3. **BANNED**: Never put text directly over high-frequency gradients without an ambient vignette or contrast rating check.
4. **MANDATORY**: Always apply subtle film grain (`grain: 15–25`) over large gradient surfaces to eliminate 8-bit display quantization banding.

---

## ⚡ Fast Engine Selection Matrix

| If the User/Scene Needs... | Choose Engine | Key Options | Recommended Palette |
| :--- | :--- | :--- | :--- |
| Hero liquid wave reveal, active SaaS dynamic backdrop | `melt` | `melt: 55, peaks: 35, tilt: -10, glow: 40` | `flamingo` / `iris` |
| Floating UI bento stage, smooth ambient control points | `mesh` | `size: 80, seed: 4.2` | `aurora` / `lagoon` |
| Editorial luxury fabric fold, keynote product reveal | `silk` | `folds: 4.5, twist: 65, sang: 25` | `glacier` / `ink` |
| Developer CLI, telemetry HUD, celestial light flare | `beams` | `rays: 8, srcx: 50, srcy: 0, rreach: 110` | `amber` / `molten` |
| Dark mode bento grid, thermal illumination card | `glow` | `gwarp: 60, gspot: 50, gang: 25` | `aurora` / `lagoon` |
| Acoustic audio visualizer, metric pulse confirmation | `ripple` | `rrings: 7, rwarp: 45` | `ink` / `glacier` |
| Multi-tier pricing bento, layered spectral strata | `ribbons`| `ramp: 50, rwid: 55, rtilt: -15, rsoft: 60` | `wine` / `jade` |
| Horizontal dashboard transition, calm metric view | `tide` | `amp: 45, freq: 3, soft: 45` | `lagoon` / `glacier` |
| Central spotlight, hardware product highlight | `halo` | `hsize: 90, squash: 80, posy: 45` | `glacier` / `ink` |
| Dramatic bottom ground-plane sunrise or horizon | `horizon`| `horizon: 10, sun: 16, spread: 120` | `ember` / `molten` |

---

## 💻 Zero-Dependency Quickstart for Codebases

### In Remotion Compositions:
```tsx
import { ProceduralGradient } from "./components/ProceduralGradient";

export const VideoScene = () => (
  <ProceduralGradient
    type="melt"
    colours={["#140741", "#391B99", "#B02A9A", "#F3528D", "#FFF0F3"]}
    speed={60}
    grain={20}
    glass={0}
  />
);
```

### In Vanilla Canvas / WebGL / HyperFrames:
```javascript
import { renderGradient, PRESETS } from "./scripts/gradient_renderer.js";

const ctx = canvas.getContext("2d");
renderGradient(ctx, 1920, 1080, clock, "silk", PRESETS[0].colours, {
  grain: 20,
  glass: 40,
});
```
