// Simple cochlea visualization for bicial
(function () {
  "use strict";

  // Number of turns (revolutions) for the cochlea and the CI electrode
  const ciTurns = 2;
  const cochleaTurns = 2.5;

  // Persisted geometry for mapping positions from normalized spiral to canvas
  let cochleaGeom = null;

  function ensureVizDom() {
    const wrap = document.getElementById("vizContent");
    if (!wrap) return null;
    // Clear previous
    wrap.innerHTML = "";
    // Heading
    const h2 = document.createElement("h2");
    h2.textContent = "Simplified visualization of the CI electrodes";
    wrap.appendChild(h2);
    // Canvas container to maintain square aspect ratio using CSS
    const container = document.createElement("div");
    container.style.position = "relative";
    container.style.width = "100%";
    // Use a wider aspect to reduce height (less vertical space)
    container.style.aspectRatio = "16 / 9";
    container.style.background = "#0a0f1d";
    container.style.border = "1px solid var(--border)";
    container.style.borderRadius = "10px";

    const canvas = document.createElement("canvas");
    canvas.id = "cochleaCanvas";
    canvas.style.position = "absolute";
    canvas.style.top = 0;
    canvas.style.left = 0;
    canvas.style.width = "100%";
    canvas.style.height = "100%";

    container.appendChild(canvas);
    wrap.appendChild(container);
    return canvas;
  }

  function drawScene(canvas) {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    // Use actual container size with widescreen aspect
    const wCss = rect.width;
    const hCss = rect.height;
    canvas.width = Math.max(1, Math.floor(wCss * dpr));
    canvas.height = Math.max(1, Math.floor(hCss * dpr));
    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);

    // Background gradient for subtle polish
    const g = ctx.createLinearGradient(0, 0, rect.width, rect.height);
    g.addColorStop(0, "rgba(96,165,250,0.08)");
    g.addColorStop(1, "rgba(96,165,250,0.02)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, rect.width, rect.height);

    // Draw stylized, idealized cochlea (logarithmic spiral), fitted to fill the canvas with padding
    const w = wCss;
    const h = hCss;
    const cx = w / 2;
    const cy = h / 2;
    const pad = Math.max(6, Math.min(w, h) * 0.035);

    const drawFittedSpiral = (turns, color, lineWidth) => {
      const thetaApex = 2 * Math.PI * turns;
      // Build points in normalized units where outer radius is 1
      const r0 = 0.01; // inner radius as a fraction of outer radius
      const b = -Math.log(r0) / thetaApex; // r(t) = exp(-b*t) * 1 at t=thetaApex -> r(thetaApex)=1, r(0)=r0
      const step = Math.max(400, Math.floor(280 * turns));
      const pts = [];
      // Rotation so outer end lies to the left (-1, 0)
      const rot = Math.PI - (thetaApex % (2 * Math.PI));
      const cosR = Math.cos(rot);
      const sinR = Math.sin(rot);
      let minX = Infinity,
        maxX = -Infinity,
        minY = Infinity,
        maxY = -Infinity;
      for (let i = 0; i <= step; i++) {
        const t = (i / step) * thetaApex;
        const r = r0 * Math.exp(b * t);
        const x = r * Math.cos(t);
        const y = r * Math.sin(t);
        // rotate
        const xr = x * cosR - y * sinR;
        const yr = x * sinR + y * cosR;
        pts.push({ x: xr, y: yr });
        if (xr < minX) minX = xr;
        if (xr > maxX) maxX = xr;
        if (yr < minY) minY = yr;
        if (yr > maxY) maxY = yr;
      }
      const spanX = maxX - minX;
      const spanY = maxY - minY;
      const availW = Math.max(1, w - 2 * pad);
      const availH = Math.max(1, h - 2 * pad);
      // Prefer filling width fully; clamp to height if needed
      const scaleW = availW / spanX;
      const scaleH = availH / spanY;
      const scale = Math.min(scaleW, scaleH);
      const cxBB = (minX + maxX) / 2;
      const cyBB = (minY + maxY) / 2;

      ctx.save();
      ctx.translate(cx, cy);
      ctx.beginPath();
      for (let i = 0; i < pts.length; i++) {
        const dx = (pts[i].x - cxBB) * scale;
        const dy = (pts[i].y - cyBB) * scale;
        if (i === 0) ctx.moveTo(dx, dy);
        else ctx.lineTo(dx, dy);
      }
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke();
      ctx.restore();

      // Save geometry for later marker placement if this is the cochlea spiral
      if (turns === cochleaTurns) {
        cochleaGeom = {
          rot,
          r0,
          b,
          thetaApex,
          cx,
          cy,
          cxBB,
          cyBB,
          scale,
          w,
          h,
          pad,
        };
      }
    };

    // Cochlea: medium blueish, maximized within canvas
    drawFittedSpiral(cochleaTurns, "rgba(96,165,250,0.9)", 3);
  }

  function renderCochlea() {
    const canvas = ensureVizDom();
    if (!canvas) return;
    drawScene(canvas);
    // Redraw on resize to keep crisp
    let raf;
    const onResize = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        drawScene(canvas);
        try {
          if (typeof placeAllElectrodeMarkers === "function") {
            placeAllElectrodeMarkers();
          }
        } catch {}
      });
    };
    window.addEventListener("resize", onResize, { passive: true });
  }

  // Expose
  window.renderCochlea = renderCochlea;

  // Greenwood frequency-place mapping (Greenwood 1990):
  // f = A * (10^(a*x) - K), x in [0,1], x=0 apex (low f), x=1 base (high f)
  const GREENWOOD = { A: 165.4, a: 2.1, K: 0.88 };
  function freqToPlace(f) {
    const { A, a, K } = GREENWOOD;
    const val = f / A + K;
    if (!isFinite(val) || val <= 0) return 0;
    const x = Math.log10(val) / a; // 0..1 (apex..base)
    return Math.max(0, Math.min(1, x));
  }

  // Draw a labeled disk at the cochlea position corresponding to frequency f.
  // n: electrode number (used for label); f: frequency in Hz; color: CSS color string; radius: disk radius
  function drawElectrodeMarker(n, f, color, radius) {
    if (!cochleaGeom) return;
    const canvas = document.getElementById("cochleaCanvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const { rot, r0, b, thetaApex, cx, cy, cxBB, cyBB, scale, w, h } =
      cochleaGeom;

    // Map frequency to place along the cochlea measured from the base.
    // theta increases from apex (0) to base (thetaApex).
    const x = freqToPlace(f); // 0..1 apex..base

    // Calculate theta (wrong formula, since x is relative length, not angle)
    const theta = x * thetaApex;

    const r = r0 * Math.exp(b * theta);
    // Spiral point before fitting transform
    const x0 = r * Math.cos(theta);
    const y0 = r * Math.sin(theta);
    // Apply rotation
    const xr = x0 * Math.cos(rot) - y0 * Math.sin(rot);
    const yr = x0 * Math.sin(rot) + y0 * Math.cos(rot);
    // Map to canvas
    const px = cx + (xr - cxBB) * scale;
    const py = cy + (yr - cyBB) * scale;

    // Draw disk
    const rad = Math.max(6, Math.min(w, h) * (radius || 0.024));
    ctx.save();
    ctx.beginPath();
    ctx.fillStyle = color || "rgba(147,197,253,0.95)";
    ctx.arc(px, py, rad, 0, Math.PI * 2);
    ctx.fill();
    // outline
    ctx.lineWidth = Math.max(1, rad * 0.2);
    ctx.strokeStyle = "rgba(0,0,0,0.35)";
    ctx.stroke();
    // label
    ctx.fillStyle = "white";
    ctx.font = `${Math.round(rad * 0.95)}px Inter, system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(
      String(n),
      px,
      py + (navigator.platform.startsWith("Win") ? 1 : 0)
    );
    ctx.restore();
  }

  // Expose marker drawing
  window.drawElectrodeMarker = drawElectrodeMarker;

  // Helpers to read current arrays from localStorage
  function logSpace(start, end, num) {
    const out = [];
    const a = Math.log10(start),
      b = Math.log10(end);
    for (let i = 0; i < num; i++)
      out.push(Math.round(10 ** (a + ((b - a) * i) / (num - 1))));
    return out;
  }
  function readFreqArray(count, ear) {
    const key = (ear === "L" ? "fL_" : "fR_") + String(count);
    const raw = localStorage.getItem(key);
    if (raw) {
      try {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr) && arr.length === Number(count)) return arr;
      } catch {}
    }
    return logSpace(200, 7500, Number(count));
  }

  function placeAllElectrodeMarkers() {
    if (!cochleaGeom) return;
    const count = Number(localStorage.getItem("electrodeCount") || "12");
    const ciSide = localStorage.getItem("ciSide") || "R";
    const ciEar = ciSide === "L" ? "L" : "R";
    const otherEar = ciEar === "L" ? "R" : "L";
    const fCI = readFreqArray(count, ciEar);
    const fOther = readFreqArray(count, otherEar);
    const colorCI = "#60A5FA"; // blue
    const colorOther = "#F59E0B"; // orange
    for (let i = 0; i < count; i++) {
      const n = i + 1;
      try {
        drawElectrodeMarker(n, Number(fCI[i]) || 0, colorCI);
      } catch {}
      try {
        drawElectrodeMarker(n, Number(fOther[i]) || 0, colorOther);
      } catch {}
    }
  }

  // Expose bulk placement
  window.placeAllElectrodeMarkers = placeAllElectrodeMarkers;
})();
