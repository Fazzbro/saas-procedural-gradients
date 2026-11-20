# Procedural Gradient Mathematics & Shader Specifications

This document details the exact field equations, color stack mixing, and optical passes used by the 13 gradient engines in `saas-procedural-gradients`.

---

## 1. Gaussian Weighting Stack Math (`mixStack`)

Instead of linear interpolation across color stops (which creates harsh color banding and muddy midpoint grays), procedural gradients evaluate each stop's influence continuously across the domain via normalized Gaussian kernels:

$$w_i(t) = \exp\left(-\left(\frac{t \cdot (N - 1) - \text{pos}_i \cdot (N - 1)}{\sigma}\right)^2\right)$$

Where:
* $t \in [0, 1]$ is the scalar position along the procedural field.
* $N$ is the number of color stops.
* $\text{pos}_i \in [0, 1]$ is the normalized position of stop $i$.
* $\sigma = 0.2 + 1.7 \cdot (\text{blend} / 100)^{1.1}$ is the Gaussian dispersion parameter.

The final RGB color $\mathbf{C}(t)$ is computed via normalized convex combination:

$$\mathbf{C}(t) = \frac{\sum_{i=0}^{N-1} \mathbf{c}_i \cdot w_i(t)}{\sum_{i=0}^{N-1} w_i(t)}$$

This guarantees mathematically smooth $C^\infty$ continuous color transitions with zero gradient banding artifacts.

---

## 2. The 13 Engine Formulations

### 1. Melt (Multi-Harmonic Sinusoidal Field)
Simulates continuous liquid chromatic strata moving under gravity and lateral drift:

$$\begin{aligned}
xr &= x \cos(\theta) - y \sin(\theta) \\
yr &= x \sin(\theta) + y \cos(\theta) \\
xw &= xr + 0.18 \cdot \text{melt} \cdot \sin(yr \cdot 3.2 \cdot \text{scale} + \phi_2) \\
\text{wave} &= 0.5 \sin(xw \cdot f_1 + \phi_1) + 0.3 \sin(xw \cdot f_2 + \phi_2 + 1.7) + 0.2 \sin(xw \cdot f_3 - 0.7 \phi_1 + 0.4) \\
\text{bump} &= \max(0, \sin(xw \cdot 0.8 f_2 + \phi_1 + 2.1))^4 \\
s &= yr + 0.5 - \text{shift} + \text{bob} + 0.5 \cdot \text{melt} \cdot (\text{wave}(1 - 0.35 \cdot \text{peaks}) + \text{peaks} \cdot 1.1 \cdot (\text{bump} - 0.3))
\end{aligned}$$

Where $f_1 = 2.2 \cdot \text{scale}$, $f_2 = 4.1 \cdot \text{scale}$, $f_3 = 7.3 \cdot \text{scale}$.

### 2. Silk (Anisotropic Harmonic Wave Folding)
Simulates folded luxury fabric under rotational tension:

$$\begin{aligned}
w_1 &= xr + 0.5 \cdot \text{warp} \cdot \sin(yr \cdot fr \cdot 1.3 + 0.4 k + \phi) \\
f &= 0.55 \sin(w_1 \cdot 2.1 fr + \phi + 0.3 k) + 0.3 \sin((w_1 + 0.5 yr \cdot \text{warp}) \cdot 3.4 fr - 1.3 \phi - 0.25 k) + 0.15 \sin(2.7 yr \cdot fr + 0.7 \phi + 0.2 k) \\
t &= (0.5 + 0.5 f)^{1.15} \cdot 0.62 + 0.38 \left(\frac{xr}{\text{aspect}} \cdot 0.9 + 0.5\right)
\end{aligned}$$

### 3. Beams (Volumetric Ray Scattering)
Exponential decay field emanating from customizable celestial focal point $(s_x, s_y)$:

$$\begin{aligned}
\theta &= \text{atan2}(dx, dy) \\
\text{ray} &= \text{smoothstep}(0.2 - h_w, 0.2 + h_w + 0.45, 0.55 \sin(\theta f + p_1) + 0.3 \sin(\theta f_2 + p_2) + 0.15 \sin(\theta f_3 + p_3)) \\
\text{fall} &= \exp(-\text{dist} \cdot \text{decay}) \\
\text{light} &= \min(1, \text{ray} \cdot \text{fall} \cdot 1.2 + 0.5 \exp(-6 \cdot \text{dist}) + 0.06 \cdot \text{fall})
\end{aligned}$$

### 4. Glow (Thermal Distortion Field)
Multi-blob thermal distortion and warp fields simulating incandescent lighting:

$$wx = x + \text{warp}(0.3 \sin(2.1 y + \phi + 0.22 k) + 0.12 \sin(4.3 y + 1.7 \phi - 0.3 k))$$
$$t = 0.5 + (wx \cos \theta + wy \sin \theta) \cdot 0.85 - \sum_{b} \text{sign}_b \cdot \text{spots} \cdot 0.55 \exp\left(-\frac{\Delta x_b^2 + \Delta y_b^2}{r_b^2}\right)$$

### 5. Ripple (Polar Concentric Propagation)
Simulates concentric acoustic/liquid wave propagation with polar coordinate distortion:

$$d = \sqrt{x^2 + y^2} \cdot (1 + 0.12 \cdot \text{warp} \cdot \sin(2 \theta + \text{seed} + 0.35 k) + 0.05 \cdot \text{warp} \cdot \sin(3 \theta - 0.3 k + 2 \cdot \text{seed}))$$
$$\text{swell} = 0.5 + 0.5 \sin(d \cdot \text{rings} \cdot 2\pi - 0.9 k)$$

### 6. Ribbons (Stratified Spectral Strata)
Stacked mathematical ribbons with variable thickness and specular highlight falloff:

$$\text{cover}_i = \exp\left(-\left|\frac{y - \text{centre}_i}{\text{thick}_i}\right|^{\text{power}}\right),\quad \text{shine}_i = 0.26 \cdot (1 - \min(1, d))$$

### 7. Tide (Stratified Wave Contours)
Layered coastal wave contours with multi-frequency modulation:

$$y_j(u) = \text{level}_j + \text{amp} \cdot (0.6 \sin(u \cdot \text{freq} \cdot 2\pi + \phi_j + k(0.55 + 0.15 j)) + 0.4 \sin(13.5 u \cdot \text{freq} + \phi_{2j} - 0.45 k))$$

---

## 3. Optical Refraction Pass (`glassPass`)

To simulate premium architectural fluted/reeded glass in UI motion:
1. Divide width into $B$ vertical bars ($B = 6 \dots 80$).
2. Within each bar, subdivide into 6 optical sub-slices.
3. Apply cylindrical lens distortion formula to sample source coordinates:
   $$\text{src}_x = x + \frac{bw}{2} + u \cdot bw \cdot (1 - 0.9 \cdot \text{glass}) - 0.22 \cdot \text{glass} \cdot bw \cdot \sin(2\pi u)$$
4. Composite directional specular highlight gradient and dark refraction trough:
   $$\text{gradient} = \text{LinearGradient}(0 \to 1): \quad 0 \to 0.3 \cdot \text{gloss},\; 0.5 \to 0,\; 1.0 \to -0.3 \cdot \text{gloss}$$
