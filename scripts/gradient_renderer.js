/**
 * Haute Motion Director — Procedural Gradient Engine
 * 
 * Zero-dependency, deterministic 60fps canvas renderer featuring 13 procedural
 * gradient models, fluted glass optical refraction, and cryptographic grain noise.
 * Designed for Remotion React compositions and HyperFrames scenes.
 */

export const TAU = Math.PI * 2;
export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
export const clamp01 = (v) => clamp(v, 0, 1);

export function rnd(seed, i) {
    const x = Math.sin(seed * 127.1 + i * 311.7) * 43758.5453;
    return x - Math.floor(x);
}

export function toRgb(hex) {
    const n = Number.parseInt(hex.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function toHex(r, g, b) {
    return `#${[r, g, b].map((v) => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, "0")).join("")}`;
}

export function rgba(hex, a) {
    const [r, g, b] = toRgb(hex);
    return `rgba(${r},${g},${b},${a})`;
}

export function rgbToHsl(r255, g255, b255) {
    const r = r255 / 255;
    const g = g255 / 255;
    const b = b255 / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const l = (max + min) / 2;
    if (max === min)
        return [0, 0, l];
    const d = max - min;
    const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    let h;
    if (max === r)
        h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g)
        h = (b - r) / d + 2;
    else
        h = (r - g) / d + 4;
    return [h * 60, s, l];
}

export function hslToRgb(hue, s, l) {
    const h = ((hue % 360) + 360) % 360;
    const a = s * Math.min(l, 1 - l);
    const f = (n) => {
        const k = (n + h / 30) % 12;
        return 255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)));
    };
    return [f(0), f(8), f(4)];
}

export const paletteOf = (stops) => ({
    rgb: stops.map((s) => toRgb(s.c)),
    pos: stops.map((s) => s.p / 100),
});

export function mixStack(pal, t, blend, out) {
    const n = pal.rgb.length;
    const x = clamp01(t) * (n - 1);
    const sigma = 0.2 + 1.7 * (blend ** 1.1);
    let total = 0;
    let r = 0;
    let g = 0;
    let b = 0;
    for (let i = 0; i < n; i++) {
        const d = (x - pal.pos[i] * (n - 1)) / sigma;
        const w = Math.exp(-d * d);
        total += w;
        r += pal.rgb[i][0] * w;
        g += pal.rgb[i][1] * w;
        b += pal.rgb[i][2] * w;
    }
    out[0] = r / total;
    out[1] = g / total;
    out[2] = b / total;
}

// -------------------------------------------------------------
// Precomputed Noise Pattern
// -------------------------------------------------------------
let noiseCanvas = null;
function getNoiseCanvas() {
    if (noiseCanvas) return noiseCanvas;
    if (typeof document === "undefined") return null;
    const c = document.createElement("canvas");
    c.width = 256;
    c.height = 256;
    const ctx = c.getContext("2d");
    if (!ctx) return null;
    const tile = ctx.createImageData(256, 256);
    const vals = new Uint8Array(256 * 256);
    if (typeof crypto !== "undefined" && crypto.getRandomValues) {
        crypto.getRandomValues(vals);
    } else {
        for (let i = 0; i < vals.length; i++) vals[i] = Math.floor(Math.random() * 256);
    }
    vals.forEach((v, i) => {
        tile.data.set([v, v, v, 255], i * 4);
    });
    ctx.putImageData(tile, 0, 0);
    noiseCanvas = c;
    return noiseCanvas;
}

// -------------------------------------------------------------
// Per-pixel procedural field renderer
// -------------------------------------------------------------
const buffers = new Map();
function bufferFor(bw, bh) {
    const key = `${bw}x${bh}`;
    let found = buffers.get(key);
    if (!found) {
        if (buffers.size > 8) buffers.clear();
        const canvas = document.createElement("canvas");
        canvas.width = bw;
        canvas.height = bh;
        const ctx = canvas.getContext("2d");
        found = { ctx, img: ctx.createImageData(bw, bh) };
        buffers.set(key, found);
    }
    return found;
}

function renderField(ctx, w, h, maxRes, fn) {
    const sc = Math.min(1, maxRes / Math.max(w, h));
    const bw = Math.max(2, Math.round(w * sc));
    const bh = Math.max(2, Math.round(h * sc));
    const buf = bufferFor(bw, bh);
    const d = buf.img.data;
    const out = [0, 0, 0];
    const aspect = bw / bh;
    for (let j = 0; j < bh; j++) {
        const v = (j + 0.5) / bh;
        for (let i = 0; i < bw; i++) {
            fn((i + 0.5) / bw, v, aspect, out);
            const p = (j * bw + i) * 4;
            d[p] = out[0];
            d[p + 1] = out[1];
            d[p + 2] = out[2];
            d[p + 3] = 255;
        }
    }
    buf.ctx.putImageData(buf.img, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(buf.ctx.canvas, 0, 0, w, h);
}

// -------------------------------------------------------------
// 13 Procedural Gradient Engines
// -------------------------------------------------------------

export const MELT_DRIFT = { left: -1, right: 1, up: 0.35, down: 0.35 };

export function renderMelt(ctx, w, h, k, cols, opts = {}) {
    const pal = paletteOf(cols);
    const n = cols.length;
    const melt = (opts.melt ?? 52) / 100;
    const peaks = (opts.peaks ?? 32) / 100;
    const glow = (opts.glow ?? 40) / 100;
    const scale = 0.6 + ((opts.scale ?? 58) / 100) * 2.4;
    const [f1, f2, f3] = [2.2 * scale, 4.1 * scale, 7.3 * scale];
    const a = ((opts.tilt ?? 0) * Math.PI) / 180;
    const [ca, sa] = [Math.cos(a), Math.sin(a)];
    const dir = opts.dir ?? "right";
    const drift = MELT_DRIFT[dir] ?? 1;
    const vertical = dir === "up" || dir === "down";
    const seed = opts.seed ?? 3.7;
    const sp = seed * 2.3;
    const ph1 = sp + k * 0.8 * drift;
    const ph2 = sp * 1.7 + k * 0.55 * drift;
    const turn = dir === "up" ? 0 : Math.PI;
    const bob = vertical ? 0.12 * Math.sin(k * 0.9 + turn) : 0.03 * Math.sin(k * 0.5);
    const shift = (((opts.rise ?? 58) / 100) - 0.5) * 0.9;
    const blend = (opts.blend ?? 70) / 100;

    renderField(ctx, w, h, 340, (u, v, aspect, out) => {
        const x = (u - 0.5) * aspect;
        const yy = 0.5 - v;
        const xr = x * ca - yy * sa;
        const yr = x * sa + yy * ca;
        const xw = xr + 0.18 * melt * Math.sin(yr * 3.2 * scale + ph2);
        let wave = 0.5 * Math.sin(xw * f1 + ph1) + 0.3 * Math.sin(xw * f2 + ph2 + 1.7) + 0.2 * Math.sin(xw * f3 - ph1 * 0.7 + 0.4);
        const bump = Math.max(0, Math.sin(xw * f2 * 0.8 + ph1 + 2.1)) ** 4;
        wave = wave * (1 - 0.35 * peaks) + peaks * 1.1 * (bump - 0.3);
        const s = yr + 0.5 - shift + bob + melt * 0.5 * wave;
        const tt = clamp01(s) * (n - 1);
        const f = tt - Math.floor(tt);
        mixStack(pal, s, blend, out);
        const lift = glow * 0.22 * (1 - Math.abs(2 * f - 1));
        for (let c = 0; c < 3; c++) out[c] += (255 - out[c]) * lift;
    });
}

export function renderSilk(ctx, w, h, k, cols, opts = {}) {
    const pal = paletteOf(cols);
    const a = ((opts.sang ?? 28) * Math.PI) / 180;
    const [ca, sa] = [Math.cos(a), Math.sin(a)];
    const fr = 0.8 + (opts.folds ?? 4) * 0.45;
    const warp = ((opts.twist ?? 60) / 100) * 0.9;
    const ph = (opts.seed ?? 3.7) * 1.7;
    const blend = (opts.blend ?? 70) / 100;

    renderField(ctx, w, h, 300, (u, v, aspect, out) => {
        const x = (u - 0.5) * aspect;
        const y = v - 0.5;
        const xr = x * ca + y * sa;
        const yr = -x * sa + y * ca;
        const w1 = xr + warp * 0.5 * Math.sin(yr * fr * 1.3 + k * 0.4 + ph);
        const f = 0.55 * Math.sin(w1 * fr * 2.1 + ph + k * 0.3) +
            0.3 * Math.sin((w1 + yr * 0.5 * warp) * fr * 3.4 - ph * 1.3 - k * 0.25) +
            0.15 * Math.sin(yr * fr * 2.7 + ph * 0.7 + k * 0.2);
        const tt = (0.5 + 0.5 * f) ** 1.15;
        mixStack(pal, 0.62 * tt + 0.38 * ((xr / aspect) * 0.9 + 0.5), blend, out);
    });
}

export function renderBeams(ctx, w, h, k, cols, opts = {}) {
    const blend = (opts.blend ?? 70) / 100;
    const halfWidth = 0.1 + 0.8 * blend;
    const pal = paletteOf(cols);
    const f = Math.max(2, Math.round((opts.rays ?? 7) * 1.8));
    const f2 = Math.round(f * 2.3);
    const f3 = Math.round(f * 3.7);
    const decay = 2.6 / ((opts.rreach ?? 100) / 100);
    const seed = opts.seed ?? 3.7;
    const p1 = seed * 3 + k * 0.25;
    const p2 = seed * 5.1 - k * 0.18;
    const p3 = seed * 7.3 + k * 0.12;
    const sy = ((opts.srcy ?? 0) / 100) * 1.08 - 0.08;
    const sx = (opts.srcx ?? 50) / 100;

    renderField(ctx, w, h, 300, (u, v, aspect, out) => {
        const dx = (u - 0.5) * aspect - (sx - 0.5) * aspect;
        const dy = v - sy;
        const dist = Math.hypot(dx, dy);
        const th = Math.atan2(dx, dy);
        const it = 0.55 * Math.sin(th * f + p1) + 0.3 * Math.sin(th * f2 + p2) + 0.15 * Math.sin(th * f3 + p3);
        const smoothstep = (a, b, x) => {
            const t = clamp01((x - a) / (b - a));
            return t * t * (3 - 2 * t);
        };
        const ray = smoothstep(0.2 - halfWidth, 0.2 + halfWidth + 0.45, it);
        const fall = Math.exp(-dist * decay);
        const light = Math.min(1, ray * fall * 1.2 + Math.exp(-dist * 6) * 0.5 + 0.06 * fall);
        mixStack(pal, 1 - light, 0.55, out);
    });
}

export function renderGlow(ctx, w, h, k, cols, opts = {}) {
    const pal = paletteOf(cols);
    const a = ((opts.gang ?? 15) * Math.PI) / 180;
    const [ca, sa] = [Math.cos(a), Math.sin(a)];
    const warp = (opts.gwarp ?? 60) / 100;
    const spots = (opts.gspot ?? 55) / 100;
    const seed = opts.seed ?? 3.7;
    const ph = seed * 1.7;
    const blend = (opts.blend ?? 70) / 100;
    const blobs = [0, 1, 2].map((j) => ({
        x: (rnd(seed, j * 5 + 1) - 0.5) * 0.9,
        y: (rnd(seed, j * 5 + 2) - 0.5) * 0.9,
        r: 0.18 + 0.16 * rnd(seed, j * 5 + 3),
        sign: j === 1 ? -1 : 1,
        drift: 0.06 * Math.sin(k * 0.3 + j),
    }));

    renderField(ctx, w, h, 300, (u, v, aspect, out) => {
        const x = (u - 0.5) * aspect;
        const y = v - 0.5;
        const wx = x + warp * (0.3 * Math.sin(y * 2.1 + ph + k * 0.22) + 0.12 * Math.sin(y * 4.3 + ph * 1.7 - k * 0.3));
        const wy = y + warp * (0.26 * Math.sin(x * 1.8 + ph * 0.8 + k * 0.19) + 0.1 * Math.sin(x * 3.9 - ph - k * 0.25));
        let t = 0.5 + (wx * ca + wy * sa) * 0.85;
        for (const b of blobs) {
            const dx = wx - b.x - b.drift;
            const dy = wy - b.y;
            t -= b.sign * spots * 0.55 * Math.exp(-(dx * dx + dy * dy) / (b.r * b.r));
        }
        mixStack(pal, t, blend, out);
    });
}

export function renderRipple(ctx, w, h, k, cols, opts = {}) {
    const pal = paletteOf(cols);
    const warp = (opts.rwarp ?? 40) / 100;
    const cx = (opts.rcx ?? 50) / 100 - 0.5;
    const cy = (opts.rcy ?? 50) / 100;
    const seed = opts.seed ?? 3.7;
    const rrings = opts.rrings ?? 7;
    const blend = (opts.blend ?? 70) / 100;

    renderField(ctx, w, h, 340, (u, v, aspect, out) => {
        const x = (u - 0.5) * aspect - cx * aspect;
        const y = v - cy;
        const ang = Math.atan2(y, x);
        const d = Math.hypot(x, y) *
            (1 + warp * 0.12 * Math.sin(ang * 2 + seed + k * 0.35) + warp * 0.05 * Math.sin(ang * 3 - k * 0.3 + seed * 2));
        const swell = 0.5 + 0.5 * Math.sin(d * rrings * TAU - k * 0.9);
        const fall = Math.min(1, d * 1.05);
        mixStack(pal, clamp01(fall + (swell - 0.5) * 0.3 * (1 - fall * 0.35)), blend, out);
    });
}

export function renderRibbons(ctx, w, h, k, cols, opts = {}) {
    const pal = paletteOf(cols);
    const count = cols.length - 1;
    const amp = (opts.ramp ?? 45) / 100;
    const width = (opts.rwid ?? 50) / 100;
    const a = ((opts.rtilt ?? -18) * Math.PI) / 180;
    const [ca, sa] = [Math.cos(a), Math.sin(a)];
    const power = 1.6 + (1 - (opts.rsoft ?? 55) / 100) * 5;
    const bg = pal.rgb[count];
    const seed = opts.seed ?? 3.7;
    const ribbons = Array.from({ length: count }, (_, i) => ({
        i,
        colour: pal.rgb[count - 1 - i],
        t: count > 1 ? i / (count - 1) : 0.5,
        ph: rnd(seed, i * 3 + 1) * TAU,
        ph2: rnd(seed, i * 3 + 2) * TAU,
    }));

    renderField(ctx, w, h, 360, (u, v, aspect, out) => {
        const x0 = (u - 0.5) * aspect;
        const y0 = v - 0.5;
        const x = x0 * ca - y0 * sa;
        const y = x0 * sa + y0 * ca;
        const px = [bg[0], bg[1], bg[2]];
        for (const rb of ribbons) {
            const centre = (rb.t - 0.5) * 0.85 +
                amp * 0.3 * (Math.sin(x * 2.1 + rb.ph + k * (0.35 + 0.08 * rb.i)) * 0.65 + Math.sin(x * 4.3 + rb.ph2 - k * 0.3) * 0.35);
            const thick = (0.07 + 0.2 * width) * (0.75 + 0.35 * Math.sin(x * 2.7 + rb.ph2 + k * 0.2));
            const d = Math.abs((y - centre) / thick);
            const cover = Math.exp(-(d ** power));
            if (cover < 0.004) continue;
            const shine = 0.26 * (1 - Math.min(1, d));
            const alpha = cover * 0.95;
            for (let c = 0; c < 3; c++) px[c] += (rb.colour[c] + (255 - rb.colour[c]) * shine - px[c]) * alpha;
        }
        out[0] = px[0];
        out[1] = px[1];
        out[2] = px[2];
    });
}

export function renderTide(ctx, w, h, k, cols, opts = {}) {
    const n = cols.length;
    const layers = n - 1;
    const amp = ((opts.amp ?? 45) / 100) * h * 0.22;
    const soft = ((opts.soft ?? 40) / 100) * h * 0.07;
    const pad = Math.max(w * 0.1, soft * 3);
    const steps = 90;
    const seed = opts.seed ?? 3.7;
    const freq = opts.freq ?? 3;

    ctx.fillStyle = cols[n - 1].c;
    ctx.fillRect(0, 0, w, h);
    if ("filter" in ctx && soft > 0.3) ctx.filter = `blur(${soft}px)`;

    for (let j = 0; j < layers; j++) {
        const ci = n - 2 - j;
        const level = h * (0.16 + (0.74 * j) / layers);
        const ph = rnd(seed, j) * TAU;
        const ph2 = rnd(seed, j + 9) * TAU;
        ctx.beginPath();
        ctx.moveTo(-pad, h + pad);
        for (let i = 0; i <= steps; i++) {
            const x = -pad + ((w + pad * 2) * i) / steps;
            const u = x / w;
            const y = level + amp * (Math.sin(u * freq * TAU + ph + k * (0.55 + 0.15 * j)) * 0.6 + Math.sin(u * freq * 13.5 + ph2 - k * 0.45) * 0.4);
            ctx.lineTo(x, y);
        }
        ctx.lineTo(w + pad, h + pad);
        ctx.closePath();
        const g = ctx.createLinearGradient(0, level - amp, 0, level + h * 0.4);
        g.addColorStop(0, cols[ci].c);
        g.addColorStop(1, cols[Math.max(0, ci - 1)].c);
        ctx.fillStyle = g;
        ctx.fill();
    }
    if ("filter" in ctx) ctx.filter = "none";
}

export function renderHalo(ctx, w, h, k, cols, opts = {}) {
    const n = cols.length;
    const radius = Math.max(w, h) * ((opts.hsize ?? 90) / 100) * 0.75;
    const soft = ((opts.soft ?? 40) / 100) * Math.min(w, h) * 0.3;
    const squash = (opts.squash ?? 100) / 100;
    const cx = w * 0.5 + w * 0.06 * Math.sin(k * 0.5);
    const cy = (h * (opts.posy ?? 50)) / 100 + h * 0.05 * Math.cos(k * 0.4);

    ctx.fillStyle = cols[n - 1].c;
    ctx.fillRect(0, 0, w, h);
    if ("filter" in ctx && soft > 0.3) ctx.filter = `blur(${soft}px)`;

    for (let j = 0; j < n - 1; j++) {
        const r = radius * (1 - j / (n - 1)) * (1 + 0.04 * Math.sin(k * 0.8 + j));
        ctx.fillStyle = cols[n - 2 - j].c;
        ctx.beginPath();
        ctx.ellipse(cx, cy, r, r * squash, 0, 0, TAU);
        ctx.fill();
    }
    if ("filter" in ctx) ctx.filter = "none";
}

export function renderHorizon(ctx, w, h, k, cols, opts = {}) {
    const n = cols.length;
    const cx = w * (0.5 + 0.07 * Math.sin(k * 0.45));
    const cy = h * (1 - ((opts.horizon ?? 8) / 100) * 0.5);
    const rx = w * ((opts.spread ?? 110) / 100) * 0.8 * (1 + 0.04 * Math.sin(k * 0.7));
    const sy = Math.max(0.05, (h * (opts.reach ?? 95)) / 100 / rx);
    const bulb = Math.min(w, h) * ((opts.sun ?? 14) / 100) * (1 + 0.08 * Math.sin(k * 1.1));
    const half = (((1 - (opts.hblend ?? 75) / 100) * 0.5) / (n - 1)) * 0.95;

    ctx.fillStyle = cols[n - 1].c;
    ctx.fillRect(0, 0, w, h);
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(1, sy);
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
    cols.forEach((c, i) => {
        const t = i / (n - 1);
        g.addColorStop(clamp01(t - half), c.c);
        g.addColorStop(clamp01(t + half), c.c);
    });
    ctx.fillStyle = g;
    ctx.fillRect(-rx * 3, -rx * 3, rx * 6, rx * 6);
    ctx.restore();

    const light = toHex(...toRgb(cols[0].c).map((v) => v + (255 - v) * 0.7));
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    const haze = ctx.createRadialGradient(cx, cy, 0, cx, cy, bulb * 4.5);
    haze.addColorStop(0, rgba(light, 0.95));
    haze.addColorStop(0.25, rgba(cols[0].c, 0.55));
    haze.addColorStop(1, rgba(cols[0].c, 0));
    ctx.fillStyle = haze;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();

    if ("filter" in ctx) ctx.filter = `blur(${bulb * 0.12}px)`;
    ctx.fillStyle = light;
    ctx.beginPath();
    ctx.arc(cx, cy, bulb * 0.55, 0, TAU);
    ctx.fill();
    if ("filter" in ctx) ctx.filter = "none";
}

export function renderLinear(ctx, w, h, k, cols, opts = {}) {
    const a = (((opts.angle ?? 135) + k * 18) * Math.PI) / 180;
    const dx = Math.sin(a);
    const dy = -Math.cos(a);
    const len = Math.abs(w * dx) + Math.abs(h * dy);
    const g = ctx.createLinearGradient(w / 2 - (dx * len) / 2, h / 2 - (dy * len) / 2, w / 2 + (dx * len) / 2, h / 2 + (dy * len) / 2);
    for (const s of cols) g.addColorStop(s.p / 100, s.c);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
}

export function renderRadial(ctx, w, h, k, cols) {
    const cx = w * (0.5 + 0.2 * Math.cos(k * 0.5));
    const cy = h * (0.5 + 0.2 * Math.sin(k * 0.5));
    const r = Math.max(Math.hypot(cx, cy), Math.hypot(w - cx, cy), Math.hypot(cx, h - cy), Math.hypot(w - cx, h - cy));
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    for (const s of cols) g.addColorStop(s.p / 100, s.c);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
}

export function renderConic(ctx, w, h, k, cols, opts = {}) {
    const g = ctx.createConicGradient((((opts.angle ?? 135) - 90 + k * 18) * Math.PI) / 180, w / 2, h / 2);
    for (const s of cols) g.addColorStop(s.p / 100, s.c);
    g.addColorStop(1, cols[0].c);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
}

export function renderMesh(ctx, w, h, k, cols, opts = {}) {
    ctx.fillStyle = cols[0].c;
    ctx.fillRect(0, 0, w, h);
    const r = Math.max(w, h) * ((opts.size ?? 75) / 100) * 0.7;
    const seed = opts.seed ?? 3.7;
    cols.forEach((s, i) => {
        const x = 0.12 + 0.76 * rnd(seed, i * 2 + 1) + 0.09 * Math.sin(k * 0.55 + i * 1.9);
        const y = 0.12 + 0.76 * rnd(seed, i * 2 + 2) + 0.09 * Math.cos(k * 0.45 + i * 2.3);
        const g = ctx.createRadialGradient(x * w, y * h, 0, x * w, y * h, r);
        g.addColorStop(0, rgba(s.c, 1));
        g.addColorStop(0.5, rgba(s.c, 0.55));
        g.addColorStop(1, rgba(s.c, 0));
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
    });
}

export const RENDERERS = {
    melt: renderMelt,
    mesh: renderMesh,
    silk: renderSilk,
    beams: renderBeams,
    glow: renderGlow,
    ripple: renderRipple,
    ribbons: renderRibbons,
    tide: renderTide,
    halo: renderHalo,
    horizon: renderHorizon,
    linear: renderLinear,
    radial: renderRadial,
    conic: renderConic,
};

// -------------------------------------------------------------
// Optical Post-Processing Passes
// -------------------------------------------------------------
let glassCopy = null;
export function glassPass(ctx, w, h, opts = {}) {
    const bars = opts.gbars ?? 28;
    const bw = w / bars;
    const slices = 6;
    const amount = (opts.glass ?? 0) / 100;
    const gloss = (opts.gloss ?? 60) / 100;
    if (amount <= 0) return;

    if (!glassCopy || glassCopy.canvas.width !== w || glassCopy.canvas.height !== h) {
        const c = document.createElement("canvas");
        c.width = w;
        c.height = h;
        glassCopy = c.getContext("2d");
    }
    glassCopy.clearRect(0, 0, w, h);
    glassCopy.drawImage(ctx.canvas, 0, 0);

    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    const sliceWidth = Math.max(1, (bw / slices) * (1 - amount * 0.9));
    for (let i = 0; i < bars; i++) {
        const x = i * bw;
        for (let j = 0; j < slices; j++) {
            const u = (j + 0.5) / slices - 0.5;
            const srcx = x + bw / 2 + u * bw * (1 - amount * 0.9) - amount * bw * 0.22 * Math.sin(TAU * u);
            ctx.drawImage(glassCopy.canvas, srcx - sliceWidth / 2, 0, sliceWidth, h, x + (j * bw) / slices, 0, bw / slices + 0.7, h);
        }
        const g = ctx.createLinearGradient(x, 0, x + bw, 0);
        g.addColorStop(0, `rgba(255,255,255,${0.3 * gloss})`);
        g.addColorStop(0.14, `rgba(255,255,255,${0.07 * gloss})`);
        g.addColorStop(0.5, "rgba(255,255,255,0)");
        g.addColorStop(0.86, `rgba(0,0,0,${0.07 * gloss})`);
        g.addColorStop(1, `rgba(0,0,0,${0.3 * gloss})`);
        ctx.fillStyle = g;
        ctx.fillRect(x, 0, bw, h);
        ctx.fillStyle = `rgba(255,255,255,${0.38 * gloss})`;
        ctx.fillRect(x, 0, Math.max(1, bw * 0.025), h);
    }
    const sheen = ctx.createLinearGradient(0, 0, w, h);
    sheen.addColorStop(0, `rgba(255,255,255,${0.2 * gloss})`);
    sheen.addColorStop(0.45, "rgba(255,255,255,0)");
    sheen.addColorStop(1, `rgba(255,255,255,${0.07 * gloss})`);
    ctx.fillStyle = sheen;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
}

export function grainPass(ctx, w, h, opts = {}) {
    const grain = opts.grain ?? 0;
    if (grain <= 0) return;
    const noise = getNoiseCanvas();
    if (!noise) return;
    const pattern = ctx.createPattern(noise, "repeat");
    if (!pattern) return;

    ctx.save();
    const gsize = opts.gsize ?? 1.5;
    const sc = gsize * Math.max(1, w / 1000);
    const jx = Math.random() * 256;
    const jy = Math.random() * 256;
    ctx.globalCompositeOperation = "overlay";
    ctx.globalAlpha = (grain / 100) * 0.7;
    ctx.scale(sc, sc);
    ctx.translate(-jx, -jy);
    ctx.fillStyle = pattern;
    ctx.fillRect(jx, jy, w / sc, h / sc);
    ctx.restore();
}

// -------------------------------------------------------------
// Main Unified Render Entry Point
// -------------------------------------------------------------
export function renderGradient(ctx, w, h, clock, type = "melt", stops = [], opts = {}) {
    ctx.save();
    ctx.clearRect(0, 0, w, h);
    const fn = RENDERERS[type] || renderMelt;
    fn(ctx, w, h, clock, stops, opts);
    if ((opts.glass ?? 0) > 0) glassPass(ctx, w, h, opts);
    if ((opts.grain ?? 0) > 0) grainPass(ctx, w, h, opts);
    ctx.restore();
}

// -------------------------------------------------------------
// Curated Haute Motion Palettes
// -------------------------------------------------------------
export const PRESETS = [
    { name: "Flamingo", archetype: "electric_cobalt", colours: ["#FFF0F3", "#F7A3C3", "#F3528D", "#B02A9A", "#391B99", "#140741"] },
    { name: "Lagoon", archetype: "obsidian_precision", colours: ["#E6FFFA", "#7FE5D0", "#27B5C9", "#2A6FDB", "#1B2A8A", "#0A1033"] },
    { name: "Molten", archetype: "anodized_hardware", colours: ["#FFF3C4", "#FFC247", "#FF7A1A", "#E5321F", "#7A1030", "#1C0614"] },
    { name: "Glacier", archetype: "neo_swiss", colours: ["#F4FBFF", "#BFE6FF", "#7CB8F5", "#4F7DE0", "#2B3D9A", "#0F1740"] },
    { name: "Ember", archetype: "anodized_hardware", colours: ["#FFE8D6", "#FF9A62", "#F0533A", "#A61E3A", "#4A0F3A", "#12071F"] },
    { name: "Iris", archetype: "electric_cobalt", colours: ["#F6F0FF", "#CDB8FF", "#9A7BFF", "#6A3DE8", "#3B1C9E", "#120A3A"] },
    { name: "Jade", archetype: "editorial_monograph", colours: ["#F0FFE8", "#B9F29B", "#4FD18B", "#12A08A", "#0D5E78", "#07213A"] },
    { name: "Wine", archetype: "editorial_monograph", colours: ["#FFEFEA", "#F3A6A0", "#D9506B", "#8E1F58", "#46113F", "#14071A"] },
    { name: "Sherbet", archetype: "playful_kinetic_pop", colours: ["#FFF6E0", "#FFC9A1", "#FF8FA3", "#E070D8", "#8F6CF0", "#3E3AA8"] },
    { name: "Ink", archetype: "neo_swiss", colours: ["#F2F2F2", "#BDBDC6", "#7E7E8E", "#42424F", "#1E1E28", "#09090D"] },
    { name: "Aurora", archetype: "obsidian_precision", colours: ["#E8FFF4", "#7DF9C6", "#3FD0E8", "#5A7CF5", "#8A3FD6", "#1A0B3D"] },
    { name: "Candy", archetype: "playful_kinetic_pop", colours: ["#FFF0FA", "#FFB3E6", "#FF7AC8", "#B37CFF", "#6FA8FF", "#7FE8FF"] },
];
