import React, { useRef, useLayoutEffect } from "react";
import { renderGradient, PRESETS } from "../scripts/gradient_renderer.js";

export type GradientType =
  | "melt"
  | "mesh"
  | "silk"
  | "beams"
  | "glow"
  | "ripple"
  | "ribbons"
  | "tide"
  | "halo"
  | "horizon"
  | "linear"
  | "radial"
  | "conic";

export interface ProceduralGradientProps {
  /** The procedural gradient algorithm to execute. Default: 'melt' */
  type?: GradientType;
  /** Array of hex color strings (e.g. ['#140741', '#391B99', '#B02A9A', '#F3528D', '#FFF0F3']) */
  colours?: string[];
  /** Animation speed multiplier. 100 = 1.0x baseline speed. Default: 60 */
  speed?: number;
  /** Fluted glass optical refraction intensity (0 to 100). Default: 0 */
  glass?: number;
  /** Cryptographic noise grain intensity (0 to 100). Default: 20 */
  grain?: number;
  /** Remotion current frame index. When omitted, drives via continuous requestAnimationFrame. */
  frame?: number;
  /** Remotion framerate (e.g. 60 or 30). Default: 60 */
  fps?: number;
  /** Output width in pixels. Default: 1920 */
  width?: number;
  /** Output height in pixels. Default: 1080 */
  height?: number;
  /** Engine-specific options (e.g. { tilt, melt, peaks, glow, folds, twist, rays, rrings }) */
  options?: Record<string, any>;
  /** Optional inline CSS styles applied to the canvas element */
  style?: React.CSSProperties;
  /** Optional CSS class name */
  className?: string;
}

/**
 * ProceduralGradient
 *
 * Deterministic, zero-slop 60 FPS animated procedural gradient canvas component.
 * Compatible with Remotion React video trees and standalone React web applications.
 */
export const ProceduralGradient: React.FC<ProceduralGradientProps> = ({
  type = "melt",
  colours = PRESETS[0].colours,
  speed = 60,
  glass = 0,
  grain = 20,
  frame,
  fps = 60,
  width = 1920,
  height = 1080,
  options = {},
  style = {},
  className,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Stop positions normalized across stops array
  const stops = React.useMemo(() => {
    const last = Math.max(1, colours.length - 1);
    return colours.map((c, i) => ({
      c: c.toLowerCase(),
      p: Math.round((i * 100) / last),
    }));
  }, [colours]);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Deterministic Remotion Mode: Frame passed explicitly
    if (typeof frame === "number") {
      const clock = (frame / fps) * (speed / 100);
      renderGradient(ctx, width, height, clock, type, stops, {
        glass,
        grain,
        ...options,
      });
      return;
    }

    // Continuous Web Mode: requestAnimationFrame loop
    let rafId: number;
    let clock = 0;
    let last = performance.now();

    const loop = () => {
      const now = performance.now();
      clock += ((now - last) / 1000) * (speed / 100);
      last = now;

      renderGradient(ctx, width, height, clock, type, stops, {
        glass,
        grain,
        ...options,
      });

      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, [frame, fps, width, height, type, stops, speed, glass, grain, options]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className={className}
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

export default ProceduralGradient;
