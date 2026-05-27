/* eslint-disable */
// @ts-nocheck
/* Vanilla Three.js hero scene — same logic as hero-scene.js but adapted as
   an ES module that imports THREE from the npm package and exports
   createHeroScene(container) -> cleanupFn. */

import * as THREE from "three";

export function createHeroScene(container: HTMLElement, opts?: any) {
  return init(container, opts);
}

/* SplitSmart 3D hero scene — vanilla Three.js, no React deps.
   Exposes a single function on `window.SplitSmartHero`:
     SplitSmartHero.init(container, opts) -> cleanupFn

   Builds five banknotes (USD/EUR/GBP/JPY/CNY-style families) as 3D slabs
   with canvas-drawn paper textures, and five coins as 3D cylinders with
   canvas-drawn faces and metallic Three.js materials.

   Behaviour:
     • Pieces float around an anchor with bob + slight 3D tumble.
     • Drag any piece in screen space; on release it remains where dropped.
     • Tap (no drag) a coin to flip it 720° in 3D.
*/

/* ===================================================================== */
  /*  THEMES                                                               */
  /* ===================================================================== */

  const NOTE_THEMES = {
    usd: {
      paper: "#cfddc1", paper2: "#bdceab", paper3: "#9fb88a",
      ink:   "#0c2516", border: "#1d4429",
      seal: "#7a2528", treasury: "#1d4429",
      denom: "20", currency: "$",
      label: "SPLITSMART · FEDERAL SPLIT NOTE",
      label2: "THIS NOTE IS LEGAL TENDER FOR ALL DEBTS, BRUNCH & PUBLIC",
      pattern: "lattice",
      portraitName: "S.   SMART",
      portraitInitials: "S",
      promise: "TWENTY · SPLITS",
      serial: "L 74829361 A",
      seriesYear: "SERIES MMXXVI",
    },
    eur: {
      paper: "#e6c98a", paper2: "#d4ab5c", paper3: "#b88940",
      ink:   "#2e1a06", border: "#7a3f10",
      seal: "#7a3f10", treasury: "#7a3f10",
      denom: "50", currency: "€",
      label: "SPLITSMART · EUROPEAN SPLIT UNION",
      label2: "BCE  ·  ECB  ·  EZB  ·  EKT  ·  ESB  ·  EKP",
      pattern: "arches",
      portraitName: "ANNO MMXXVI",
      portraitInitials: "€",
      promise: "FIFTY · EURO",
      serial: "X 04218 47362",
      seriesYear: "EUROPA · MMXXVI",
    },
    gbp: {
      paper: "#c8aed1", paper2: "#a785b3", paper3: "#7e5b8c",
      ink:   "#1c0a26", border: "#3a1c4d",
      seal: "#3a1c4d", treasury: "#3a1c4d",
      denom: "20", currency: "£",
      label: "BANK OF SPLITSMART",
      label2: "I PROMISE TO PAY THE BEARER, EVENTUALLY",
      pattern: "crown",
      portraitName: "REG. SPLITSMART",
      portraitInitials: "♛",
      promise: "TWENTY · POUNDS",
      serial: "AH 72 145821",
      seriesYear: "SERIES MMXXVI",
    },
    jpy: {
      paper: "#e7d6d4", paper2: "#cda8ab", paper3: "#a47578",
      ink:   "#1b0d12", border: "#52243a",
      seal: "#a31f2d", treasury: "#52243a",
      denom: "1000", currency: "¥",
      label: "日本 割勘 銀行  ·  NIHON SPLITBANK",
      label2: "NIPPON  GINKOU  ·  SPLIT  ·  KEN  ·  MMXXVI",
      pattern: "waves",
      portraitName: "千  ·  SEN",
      portraitInitials: "圓",
      promise: "ICHI - SEN  ·  千 円",
      serial: "RW 482364 G",
      seriesYear: "令和  MMXXVI",
    },
    cny: {
      paper: "#dcb39a", paper2: "#c48863", paper3: "#9c5b35",
      ink:   "#2b0e05", border: "#702a14",
      seal: "#a31f2d", treasury: "#702a14",
      denom: "100", currency: "¥",
      label: "中国 分账 银行  ·  ZHONG GUO SPLIT",
      label2: "RENMINBI  ·  YUAN  ·  SPLITSMART",
      pattern: "pavilion",
      portraitName: "一百  ·  YIBAI",
      portraitInitials: "圓",
      promise: "壹佰  ·  HUNDRED YUAN",
      serial: "FA 8214 7362",
      seriesYear: "二〇二六",
    },
  };

  const COIN_THEMES = {
    gold:   { face: "#d4a737", deep: "#7a5a08", hi: "#fff0b8", rim: "#8a6710", ink: "#3a2a05", denom: "$", arc: "SPLITSMART · UNIO" },
    silver: { face: "#bdbdc2", deep: "#5e5e62", hi: "#ffffff", rim: "#7a7a7e", ink: "#1f1f22", denom: "€", arc: "SPLITSMART · UNIO" },
    copper: { face: "#b06535", deep: "#4d2410", hi: "#e8b287", rim: "#7e3b1e", ink: "#2a1208", denom: "£", arc: "SPLITSMART · UNIO" },
    bronze: { face: "#8e6c3f", deep: "#3a2814", hi: "#caa472", rim: "#5e4221", ink: "#1f1408", denom: "¥", arc: "SPLITSMART · UNIO" },
    rose:   { face: "#c97a78", deep: "#4d2424", hi: "#f3c0bf", rim: "#7a3a38", ink: "#2a1010", denom: "¢", arc: "SPLITSMART · UNIO" },
  };

  /* ===================================================================== */
  /*  CANVAS HELPERS                                                       */
  /* ===================================================================== */

  function makeCanvas(w, h) {
    const c = document.createElement("canvas");
    c.width = w; c.height = h;
    return c;
  }

  function clearCanvas(ctx, w, h, fill) {
    ctx.fillStyle = fill;
    ctx.fillRect(0, 0, w, h);
  }

  function addNoise(ctx, w, h, amount) {
    const img = ctx.getImageData(0, 0, w, h);
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      const n = (Math.random() - 0.5) * 255 * amount;
      d[i]   = Math.max(0, Math.min(255, d[i] + n));
      d[i+1] = Math.max(0, Math.min(255, d[i+1] + n));
      d[i+2] = Math.max(0, Math.min(255, d[i+2] + n));
    }
    ctx.putImageData(img, 0, 0);
  }

  /* Layered guilloché — overlapping wavy line patterns at multiple angles. */
  function drawGuilloche(ctx, w, h, color, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = color;

    // Horizontal layer
    ctx.lineWidth = 0.6;
    for (let i = 0; i < 70; i++) {
      ctx.beginPath();
      const yBase = (i / 70) * h;
      for (let x = 0; x <= w; x += 3) {
        const y = yBase + Math.sin(x * 0.022 + i * 0.35) * 5 + Math.sin(x * 0.07 + i * 0.5) * 2.5;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    // Vertical layer
    ctx.lineWidth = 0.45;
    ctx.globalAlpha = alpha * 0.7;
    for (let i = 0; i < 90; i++) {
      ctx.beginPath();
      const xBase = (i / 90) * w;
      for (let y = 0; y <= h; y += 3) {
        const x = xBase + Math.sin(y * 0.03 + i * 0.4) * 4 + Math.sin(y * 0.08 + i * 0.6) * 2;
        if (y === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    ctx.restore();
  }

  /* Concentric guilloché rings around a focal point. */
  function drawGuillocheRings(ctx, cx, cy, rMax, color, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = color;
    ctx.lineWidth = 0.5;
    for (let r = 8; r < rMax; r += 3.5) {
      ctx.beginPath();
      for (let a = 0; a <= Math.PI * 2 + 0.1; a += 0.05) {
        const wobble = Math.sin(a * 12 + r * 0.3) * 1.4 + Math.sin(a * 7) * 0.8;
        const rr = r + wobble;
        const x = cx + Math.cos(a) * rr;
        const y = cy + Math.sin(a) * rr;
        if (a === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawPatternOverlay(ctx, w, h, pattern, color, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = color;
    ctx.fillStyle = color;

    if (pattern === "arches") {
      ctx.lineWidth = 0.6;
      for (let yi = 0; yi < 6; yi++) {
        for (let xi = 0; xi < 25; xi++) {
          const x0 = (xi / 25) * w;
          const y0 = h - (yi / 6) * h * 0.3 - 50;
          ctx.beginPath();
          ctx.moveTo(x0, y0);
          ctx.quadraticCurveTo(x0 + w / 50, y0 - 30, x0 + w / 25, y0);
          ctx.stroke();
        }
      }
    } else if (pattern === "crown") {
      ctx.lineWidth = 0.5;
      for (let yi = 0; yi < 14; yi++) {
        for (let xi = 0; xi < 30; xi++) {
          const x = (xi / 30) * w + (yi % 2) * (w / 60);
          const y = (yi / 14) * h;
          ctx.beginPath();
          ctx.moveTo(x, y + 8);
          ctx.lineTo(x + 4, y);
          ctx.lineTo(x + 8, y + 6);
          ctx.lineTo(x + 12, y);
          ctx.lineTo(x + 16, y + 8);
          ctx.stroke();
        }
      }
    } else if (pattern === "waves") {
      ctx.lineWidth = 0.55;
      for (let yi = 0; yi < 20; yi++) {
        ctx.beginPath();
        for (let x = 0; x <= w; x += 4) {
          const y = (yi / 20) * h + Math.sin(x * 0.03 + yi) * 6;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    } else if (pattern === "pavilion") {
      ctx.lineWidth = 0.55;
      for (let yi = 0; yi < 8; yi++) {
        for (let xi = 0; xi < 16; xi++) {
          const x = (xi / 16) * w;
          const y = (yi / 8) * h;
          ctx.beginPath();
          ctx.moveTo(x + 4, y + 20);
          ctx.lineTo(x + 4, y + 12);
          ctx.lineTo(x + 14, y + 4);
          ctx.lineTo(x + 24, y + 12);
          ctx.lineTo(x + 24, y + 20);
          ctx.stroke();
        }
      }
    }

    ctx.restore();
  }

  /* Filigree corner ornament. */
  function drawCorner(ctx, x, y, size, color, opts) {
    opts = opts || {};
    ctx.save();
    ctx.translate(x, y);
    if (opts.flipX) ctx.scale(-1, 1);
    if (opts.flipY) ctx.scale(1, -1);

    ctx.strokeStyle = color;
    ctx.lineWidth = 1.4;
    ctx.globalAlpha = 0.7;

    // Outer curl
    ctx.beginPath();
    ctx.moveTo(0, size * 0.55);
    ctx.bezierCurveTo(0, size * 0.2, size * 0.2, 0, size * 0.55, 0);
    ctx.stroke();

    // Inner curl
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(size * 0.15, size * 0.45);
    ctx.quadraticCurveTo(size * 0.25, size * 0.22, size * 0.45, size * 0.15);
    ctx.stroke();

    // Spiral
    ctx.beginPath();
    for (let a = 0; a < Math.PI * 2; a += 0.1) {
      const rr = 5 + a * 1.5;
      const px = 25 + Math.cos(a) * rr;
      const py = 25 + Math.sin(a) * rr;
      if (a === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    // Dot
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(size * 0.12, size * 0.12, 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  /* Classical stylized bust silhouette inside an oval frame. */
  function drawPortrait(ctx, cx, cy, halfW, halfH, theme) {
    ctx.save();

    // Oval frame (double line)
    ctx.strokeStyle = theme.border;
    ctx.globalAlpha = 0.65;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.ellipse(cx, cy, halfW, halfH, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.ellipse(cx, cy, halfW * 0.92, halfH * 0.92, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Pearl ring around the oval
    ctx.fillStyle = theme.border;
    ctx.globalAlpha = 0.6;
    for (let i = 0; i < 50; i++) {
      const a = (i / 50) * Math.PI * 2;
      const x = cx + Math.cos(a) * halfW * 1.06;
      const y = cy + Math.sin(a) * halfH * 1.06;
      ctx.beginPath();
      ctx.arc(x, y, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Inner shaded oval
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(cx, cy, halfW * 0.88, halfH * 0.88, 0, 0, Math.PI * 2);
    ctx.clip();

    const grad = ctx.createRadialGradient(
      cx - halfW * 0.25, cy - halfH * 0.3, 0,
      cx, cy, Math.max(halfW, halfH)
    );
    grad.addColorStop(0, theme.paper);
    grad.addColorStop(0.55, theme.paper2);
    grad.addColorStop(1, theme.paper3);
    ctx.fillStyle = grad;
    ctx.globalAlpha = 0.8;
    ctx.fillRect(cx - halfW, cy - halfH, halfW * 2, halfH * 2);

    // Concentric line shading
    ctx.strokeStyle = theme.border;
    ctx.globalAlpha = 0.16;
    ctx.lineWidth = 0.45;
    for (let r = 5; r < Math.max(halfW, halfH); r += 2) {
      ctx.beginPath();
      ctx.ellipse(cx, cy, r * (halfW / halfH), r, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Stylized bust silhouette
    ctx.globalAlpha = 0.42;
    ctx.fillStyle = theme.border;
    ctx.beginPath();
    // Head (slightly oval)
    ctx.ellipse(cx, cy - halfH * 0.18, halfW * 0.42, halfH * 0.32, 0, 0, Math.PI * 2);
    ctx.fill();
    // Shoulders
    ctx.beginPath();
    ctx.moveTo(cx - halfW * 0.85, cy + halfH * 0.55);
    ctx.bezierCurveTo(cx - halfW * 0.65, cy + halfH * 0.05, cx - halfW * 0.45, cy + halfH * 0.18, cx - halfW * 0.42, cy + halfH * 0.18);
    ctx.lineTo(cx + halfW * 0.42, cy + halfH * 0.18);
    ctx.bezierCurveTo(cx + halfW * 0.45, cy + halfH * 0.18, cx + halfW * 0.65, cy + halfH * 0.05, cx + halfW * 0.85, cy + halfH * 0.55);
    ctx.lineTo(cx + halfW * 0.9, cy + halfH);
    ctx.lineTo(cx - halfW * 0.9, cy + halfH);
    ctx.closePath();
    ctx.fill();

    // Big initial overlay (faint)
    ctx.fillStyle = theme.paper;
    ctx.globalAlpha = 0.5;
    ctx.font = `${halfH * 1.0}px "Instrument Serif", "Times New Roman", serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(theme.portraitInitials, cx, cy - halfH * 0.05);

    ctx.restore();

    // Caption under portrait
    ctx.fillStyle = theme.border;
    ctx.globalAlpha = 0.75;
    ctx.font = `bold ${halfW * 0.12}px "JetBrains Mono", monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(theme.portraitName, cx, cy + halfH + 14);

    ctx.restore();
  }

  /* Round seal with denomination glyph + arc text. */
  function drawSeal(ctx, cx, cy, r, color, glyph, arcText) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.85;

    // Outer ring
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();

    // Star-pointed inner ring (treasury-style)
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < 40; i++) {
      const a = (i / 40) * Math.PI * 2;
      const rr = r * (i % 2 === 0 ? 0.92 : 0.86);
      const x = cx + Math.cos(a) * rr;
      const y = cy + Math.sin(a) * rr;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();

    // Dotted inner ring
    for (let i = 0; i < 32; i++) {
      const a = (i / 32) * Math.PI * 2;
      const x = cx + Math.cos(a) * r * 0.72;
      const y = cy + Math.sin(a) * r * 0.72;
      ctx.beginPath();
      ctx.arc(x, y, 0.9, 0, Math.PI * 2);
      ctx.fill();
    }

    // Center glyph
    ctx.font = `${r * 1.1}px "Instrument Serif", "Times New Roman", serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(glyph, cx, cy + 1);

    // Arc text below
    if (arcText) {
      drawArcText(ctx, arcText, cx, cy, r * 0.55, Math.PI * 0.25, Math.PI * 0.75, r * 0.22, color);
    }

    ctx.restore();
  }

  /* Treasury-style abstract emblem (mainly used on the right side of notes). */
  function drawTreasurySeal(ctx, cx, cy, r, color) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.75;

    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();

    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.85, 0, Math.PI * 2);
    ctx.stroke();

    // Inner star
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
      const rr = i % 2 === 0 ? r * 0.55 : r * 0.25;
      const x = cx + Math.cos(a) * rr;
      const y = cy + Math.sin(a) * rr;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();

    // Tiny center dot
    ctx.beginPath();
    ctx.arc(cx, cy, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  /* Faux cursive signature scrawl. */
  function drawSignature(ctx, x, y, w, color) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.globalAlpha = 0.78;
    ctx.lineWidth = 1.8;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(x - w * 0.45, y);
    ctx.bezierCurveTo(x - w * 0.35, y - w * 0.5,   x - w * 0.20, y + w * 0.35,  x - w * 0.10, y - w * 0.15);
    ctx.bezierCurveTo(x - w * 0.02, y - w * 0.55,  x + w * 0.10, y + w * 0.20,  x + w * 0.18, y - w * 0.15);
    ctx.bezierCurveTo(x + w * 0.25, y + w * 0.40,  x + w * 0.38, y - w * 0.20,  x + w * 0.45, y + w * 0.10);
    ctx.stroke();
    ctx.restore();
  }

  /* Text along an arc. */
  function drawArcText(ctx, text, cx, cy, r, startAngle, endAngle, fontSize, color, opts) {
    opts = opts || {};
    ctx.save();
    ctx.fillStyle = color;
    ctx.font = `${opts.bold ? "bold " : ""}${fontSize}px "JetBrains Mono", monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = opts.inside ? "top" : "bottom";

    const chars = [...text];
    const total = chars.length;
    const span = endAngle - startAngle;
    for (let i = 0; i < total; i++) {
      const a = startAngle + (i + 0.5) * (span / total);
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(a + Math.PI / 2);
      ctx.translate(0, opts.inside ? r : -r);
      ctx.fillText(chars[i], 0, 0);
      ctx.restore();
    }
    ctx.restore();
  }

  /* Decorative laurel branch. */
  function drawLaurel(ctx, cx, cy, size, color, mirror) {
    ctx.save();
    ctx.translate(cx, cy);
    if (mirror) ctx.scale(-1, 1);
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.75;
    ctx.lineWidth = 1;

    // Stem
    ctx.beginPath();
    ctx.moveTo(0, -size);
    ctx.quadraticCurveTo(-size * 0.4, 0, 0, size);
    ctx.stroke();

    // Leaves
    for (let i = -3; i <= 3; i++) {
      const t = i / 3.5;
      const x = -size * 0.4 * (1 - Math.abs(t));
      const y = t * size * 0.9;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(-Math.PI / 6 + t * 0.4);
      ctx.beginPath();
      ctx.ellipse(-size * 0.18, 0, size * 0.18, size * 0.07, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  }

  /* ===================================================================== */
  /*  BANKNOTE TEXTURE                                                     */
  /* ===================================================================== */

  function drawBanknote(canvas, theme) {
    const w = canvas.width, h = canvas.height;
    const ctx = canvas.getContext("2d");

    // Base paper with vertical gradient
    const bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, theme.paper);
    bg.addColorStop(0.5, theme.paper2);
    bg.addColorStop(1, theme.paper);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    // Side vignette
    const vg = ctx.createRadialGradient(w / 2, h / 2, h * 0.2, w / 2, h / 2, w * 0.7);
    vg.addColorStop(0, "rgba(0,0,0,0)");
    vg.addColorStop(1, "rgba(0,0,0,0.18)");
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, w, h);

    // Pattern overlay (currency-specific)
    drawPatternOverlay(ctx, w, h, theme.pattern, theme.border, 0.16);

    // Layered guilloché engraving
    drawGuilloche(ctx, w, h, theme.border, 0.2);

    // Concentric guilloché around portrait area
    drawGuillocheRings(ctx, w / 2, h / 2, h * 0.42, theme.border, 0.22);

    // Double frame
    ctx.strokeStyle = theme.border;
    ctx.globalAlpha = 0.8;
    ctx.lineWidth = 4;
    ctx.strokeRect(22, 22, w - 44, h - 44);
    ctx.lineWidth = 1.4;
    ctx.strokeRect(34, 34, w - 68, h - 68);
    ctx.globalAlpha = 1;

    // Filigree corners (4)
    const cs = 90;
    drawCorner(ctx, 36, 36, cs, theme.border, {});
    drawCorner(ctx, w - 36, 36, cs, theme.border, { flipX: true });
    drawCorner(ctx, 36, h - 36, cs, theme.border, { flipY: true });
    drawCorner(ctx, w - 36, h - 36, cs, theme.border, { flipX: true, flipY: true });

    // Bank name banner (top)
    ctx.fillStyle = theme.border;
    ctx.font = `bold ${Math.round(w * 0.022)}px "JetBrains Mono", monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.globalAlpha = 0.92;
    ctx.fillText(theme.label, w / 2, 62);

    // Decorative dividers under banner
    ctx.strokeStyle = theme.border;
    ctx.globalAlpha = 0.5;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(w * 0.30, 100);
    ctx.lineTo(w * 0.70, 100);
    ctx.stroke();
    ctx.globalAlpha = 1;

    // Big corner numerals (top-left, bottom-right)
    ctx.fillStyle = theme.ink;
    ctx.font = `bold ${Math.round(h * 0.22)}px "Instrument Serif", "Times New Roman", serif`;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(theme.denom, 70, 110);
    ctx.textAlign = "right";
    ctx.textBaseline = "bottom";
    ctx.fillText(theme.denom, w - 70, h - 110);

    // Smaller numerals (other corners)
    ctx.font = `${Math.round(h * 0.10)}px "Instrument Serif", "Times New Roman", serif`;
    ctx.textAlign = "right";
    ctx.textBaseline = "top";
    ctx.fillText(theme.denom, w - 70, 130);
    ctx.textAlign = "left";
    ctx.textBaseline = "bottom";
    ctx.fillText(theme.denom, 70, h - 130);

    // Central portrait
    drawPortrait(ctx, w / 2, h / 2 + 8, h * 0.28, h * 0.35, theme);

    // Round seal left
    drawSeal(ctx, w * 0.22, h * 0.62, h * 0.13, theme.seal, theme.currency, "SPLITSMART");

    // Treasury seal right
    drawTreasurySeal(ctx, w * 0.78, h * 0.62, h * 0.13, theme.treasury);

    // Promise / denomination word (top center, under banner)
    ctx.fillStyle = theme.ink;
    ctx.font = `${Math.round(h * 0.05)}px "Instrument Serif", "Times New Roman", serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.globalAlpha = 0.9;
    ctx.fillText(theme.promise, w / 2, h * 0.18);

    // Serial numbers (two locations)
    ctx.fillStyle = theme.border;
    ctx.globalAlpha = 0.85;
    ctx.font = `bold ${Math.round(h * 0.04)}px "JetBrains Mono", monospace`;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(theme.serial, 230, 120);
    ctx.textAlign = "right";
    ctx.textBaseline = "bottom";
    ctx.fillText(theme.serial, w - 230, h - 120);

    // Signatures
    drawSignature(ctx, w * 0.32, h * 0.84, w * 0.12, theme.border);
    drawSignature(ctx, w * 0.68, h * 0.84, w * 0.12, theme.border);
    ctx.fillStyle = theme.border;
    ctx.globalAlpha = 0.7;
    ctx.font = `${Math.round(h * 0.024)}px "JetBrains Mono", monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText("TREASURER", w * 0.32, h * 0.88);
    ctx.fillText("REGISTRAR", w * 0.68, h * 0.88);

    // Series year + tender line
    ctx.fillStyle = theme.border;
    ctx.globalAlpha = 0.65;
    ctx.font = `${Math.round(h * 0.028)}px "JetBrains Mono", monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.fillText(theme.seriesYear, w / 2, h - 60);

    ctx.font = `${Math.round(h * 0.024)}px "JetBrains Mono", monospace`;
    ctx.fillText(theme.label2, w / 2, h - 38);

    // Vertical microtext column on left edge
    ctx.save();
    ctx.translate(60, h / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.font = `${Math.round(h * 0.023)}px "JetBrains Mono", monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.globalAlpha = 0.7;
    ctx.fillStyle = theme.border;
    ctx.fillText("SPLITSMART · " + theme.serial + " · SPLITSMART · " + theme.serial, 0, 0);
    ctx.restore();

    // Right edge vertical hologram strip (subtle iridescent)
    const stripX = w - 80;
    const strip = ctx.createLinearGradient(stripX, 0, stripX + 30, 0);
    strip.addColorStop(0, "rgba(255,255,255,0.0)");
    strip.addColorStop(0.5, "rgba(255,255,255,0.35)");
    strip.addColorStop(1, "rgba(255,255,255,0.0)");
    ctx.fillStyle = strip;
    ctx.globalAlpha = 0.6;
    ctx.fillRect(stripX, 110, 30, h - 220);

    // Bake a soft light gradient over the whole note for paper sheen
    const light = ctx.createLinearGradient(0, 0, w, h);
    light.addColorStop(0, "rgba(255,255,255,0.16)");
    light.addColorStop(0.4, "rgba(255,255,255,0.0)");
    light.addColorStop(0.6, "rgba(0,0,0,0.0)");
    light.addColorStop(1, "rgba(0,0,0,0.10)");
    ctx.fillStyle = light;
    ctx.globalAlpha = 1;
    ctx.fillRect(0, 0, w, h);

    // Paper grain
    addNoise(ctx, w, h, 0.035);
  }

  /* ===================================================================== */
  /*  COIN FACE TEXTURE                                                    */
  /* ===================================================================== */

  function drawCoinFace(canvas, theme, side) {
    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const r = w / 2;
    const ctx = canvas.getContext("2d");

    // Transparent outside the coin disc
    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.clip();

    // Base flat colour — Three.js will provide most of the lighting,
    // but a soft radial gradient adds depth even without an envMap.
    const base = ctx.createRadialGradient(
      cx - r * 0.25, cy - r * 0.30, r * 0.05,
      cx + r * 0.05, cy + r * 0.10, r * 1.1
    );
    base.addColorStop(0, theme.hi);
    base.addColorStop(0.45, theme.face);
    base.addColorStop(0.95, theme.deep);
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, w, h);

    // Subtle radial brushed texture
    ctx.save();
    ctx.globalAlpha = 0.08;
    ctx.strokeStyle = theme.deep;
    ctx.lineWidth = 0.8;
    for (let i = 0; i < 360; i += 2) {
      const a = (i * Math.PI) / 180;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * r * 0.18, cy + Math.sin(a) * r * 0.18);
      ctx.lineTo(cx + Math.cos(a) * r * 0.92, cy + Math.sin(a) * r * 0.92);
      ctx.stroke();
    }
    ctx.restore();

    // Reeded outer rim
    ctx.strokeStyle = theme.deep;
    ctx.globalAlpha = 0.5;
    ctx.lineWidth = r * 0.08;
    ctx.beginPath();
    ctx.arc(cx, cy, r - r * 0.04, 0, Math.PI * 2);
    ctx.stroke();

    // Inner raised rim
    ctx.strokeStyle = theme.hi;
    ctx.globalAlpha = 0.55;
    ctx.lineWidth = r * 0.02;
    ctx.beginPath();
    ctx.arc(cx, cy, r - r * 0.085, 0, Math.PI * 2);
    ctx.stroke();

    // Pearl / dot ring
    ctx.fillStyle = theme.deep;
    ctx.globalAlpha = 0.85;
    for (let i = 0; i < 90; i++) {
      const a = (i / 90) * Math.PI * 2;
      const x = cx + Math.cos(a) * (r - r * 0.14);
      const y = cy + Math.sin(a) * (r - r * 0.14);
      ctx.beginPath();
      ctx.arc(x, y, r * 0.013, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    if (side === "front") {
      // Engraved laurel surround
      drawLaurel(ctx, cx - r * 0.65, cy, r * 0.32, theme.deep, false);
      drawLaurel(ctx, cx + r * 0.65, cy, r * 0.32, theme.deep, true);

      // Big central denomination
      ctx.fillStyle = theme.deep;
      ctx.globalAlpha = 0.95;
      ctx.font = `${r * 1.1}px "Instrument Serif", "Times New Roman", serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(theme.denom, cx, cy + 4);

      // Highlight on the numeral (subtle 3D)
      ctx.fillStyle = theme.hi;
      ctx.globalAlpha = 0.18;
      ctx.fillText(theme.denom, cx - 2, cy + 2);

      // Top arc text
      drawArcText(ctx, "SPLITSMART", cx, cy, r * 0.82, -Math.PI * 0.75, -Math.PI * 0.25, r * 0.13, theme.deep, { bold: true });
      // Bottom arc text
      drawArcText(ctx, "· UNIO · MMXXVI ·", cx, cy, r * 0.82, Math.PI * 0.20, Math.PI * 0.80, r * 0.11, theme.deep, { inside: true });
    } else {
      // BACK FACE — crest with rays + monogram
      // Sun ray pattern
      ctx.strokeStyle = theme.deep;
      ctx.globalAlpha = 0.35;
      ctx.lineWidth = 1;
      for (let i = 0; i < 32; i++) {
        const a = (i / 32) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * r * 0.22, cy + Math.sin(a) * r * 0.22);
        ctx.lineTo(cx + Math.cos(a) * r * 0.60, cy + Math.sin(a) * r * 0.60);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      // Crest shield
      ctx.fillStyle = theme.deep;
      ctx.globalAlpha = 0.9;
      ctx.beginPath();
      ctx.moveTo(cx, cy - r * 0.28);
      ctx.lineTo(cx + r * 0.25, cy - r * 0.28);
      ctx.lineTo(cx + r * 0.25, cy + r * 0.05);
      ctx.quadraticCurveTo(cx + r * 0.25, cy + r * 0.30, cx, cy + r * 0.32);
      ctx.quadraticCurveTo(cx - r * 0.25, cy + r * 0.30, cx - r * 0.25, cy + r * 0.05);
      ctx.lineTo(cx - r * 0.25, cy - r * 0.28);
      ctx.closePath();
      ctx.fill();

      // Monogram
      ctx.fillStyle = theme.hi;
      ctx.globalAlpha = 0.9;
      ctx.font = `${r * 0.42}px "Instrument Serif", "Times New Roman", serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("S$", cx, cy);

      // Arc text
      drawArcText(ctx, "IN MEMES WE TRUST", cx, cy, r * 0.82, -Math.PI * 0.85, -Math.PI * 0.15, r * 0.12, theme.deep, { bold: true });
      drawArcText(ctx, "· MMXXVI ·", cx, cy, r * 0.82, Math.PI * 0.30, Math.PI * 0.70, r * 0.13, theme.deep, { inside: true });
    }

    // Subtle pre-baked specular highlight (top-left)
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "screen";
    const hi = ctx.createRadialGradient(cx - r * 0.35, cy - r * 0.40, 0, cx - r * 0.30, cy - r * 0.35, r * 0.85);
    hi.addColorStop(0, "rgba(255,255,255,0.45)");
    hi.addColorStop(0.5, "rgba(255,255,255,0.10)");
    hi.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = hi;
    ctx.fillRect(0, 0, w, h);

    // Pre-baked shadow bottom-right
    ctx.globalCompositeOperation = "multiply";
    const sh = ctx.createRadialGradient(cx + r * 0.35, cy + r * 0.45, 0, cx + r * 0.35, cy + r * 0.45, r * 0.95);
    sh.addColorStop(0, "rgba(70,40,10,0.45)");
    sh.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = sh;
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = "source-over";

    ctx.restore();
  }

  /* ===================================================================== */
  /*  SCENE                                                                */
  /* ===================================================================== */

  function init(container, opts) {
    opts = opts || {};

    // Setup renderer & scene
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.domElement.style.display = "block";
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();

    /* Procedural environment map — gives metallic surfaces something to
       reflect since we have no HDR file. A warm gradient with a couple of
       bright spots = studio lighting. */
    {
      const c = makeCanvas(1024, 512);
      const cx = c.getContext("2d");
      const g = cx.createLinearGradient(0, 0, 0, 512);
      g.addColorStop(0, "#ffe8c5");
      g.addColorStop(0.3, "#fff5e0");
      g.addColorStop(0.55, "#d8d2c2");
      g.addColorStop(0.85, "#705430");
      g.addColorStop(1, "#3a2a18");
      cx.fillStyle = g;
      cx.fillRect(0, 0, 1024, 512);

      // Bright studio "softboxes" overhead
      cx.globalAlpha = 0.85;
      cx.fillStyle = "#ffffff";
      cx.beginPath(); cx.ellipse(220, 160, 130, 40, 0, 0, Math.PI * 2); cx.fill();
      cx.beginPath(); cx.ellipse(780, 200, 100, 35, 0, 0, Math.PI * 2); cx.fill();
      cx.beginPath(); cx.ellipse(512, 90, 200, 30, 0, 0, Math.PI * 2); cx.fill();

      // Warm fill
      cx.globalAlpha = 0.55;
      cx.fillStyle = "#ffd9a8";
      cx.beginPath(); cx.ellipse(512, 380, 300, 60, 0, 0, Math.PI * 2); cx.fill();

      const tex = new THREE.CanvasTexture(c);
      tex.mapping = THREE.EquirectangularReflectionMapping;
      tex.colorSpace = THREE.SRGBColorSpace;

      const pmrem = new THREE.PMREMGenerator(renderer);
      pmrem.compileEquirectangularShader();
      scene.environment = pmrem.fromEquirectangular(tex).texture;
      tex.dispose();
      pmrem.dispose();
    }

    const camera = new THREE.PerspectiveCamera(
      32,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    );
    camera.position.set(0, 0, 9);
    camera.lookAt(0, 0, 0);

    // Lighting — studio-style for warm currency feel.
    const ambient = new THREE.AmbientLight(0xfff2dd, 0.6);
    scene.add(ambient);

    const key = new THREE.DirectionalLight(0xffe8c0, 1.5);
    key.position.set(4, 6, 6);
    scene.add(key);

    const fill = new THREE.DirectionalLight(0xb8d0ff, 0.55);
    fill.position.set(-5, -2, 4);
    scene.add(fill);

    const rim = new THREE.DirectionalLight(0xffcc99, 1.0);
    rim.position.set(-2, 5, -6);
    scene.add(rim);

    // A small "studio light" point near upper-front for coin glints
    const studio = new THREE.PointLight(0xffe9c0, 1.6, 30, 1.4);
    studio.position.set(0.5, 3.5, 3);
    scene.add(studio);

    /* ----- Build pieces ----- */
    const pieces = [];

    // Banknotes
    const noteSpecs = [
      { id: "usd", x: -3.55, y:  1.65, rZ: -0.12, rY:  0.12 },
      { id: "eur", x:  3.55, y:  1.55, rZ:  0.10, rY: -0.14 },
      { id: "gbp", x: -3.55, y: -1.50, rZ:  0.08, rY:  0.12 },
      { id: "jpy", x:  3.55, y: -1.65, rZ: -0.12, rY: -0.12 },
      { id: "cny", x:  3.80, y:  0.05, rZ:  0.22, rY:  0.24 },
    ];

    noteSpecs.forEach((s) => {
      const theme = NOTE_THEMES[s.id];

      const front = makeCanvas(1024, 512);
      drawBanknote(front, theme);
      const back = makeCanvas(1024, 512);
      // Back: slightly different palette by using darker tones
      drawBanknote(back, theme);
      // Soften back (less detail prominence)
      const bctx = back.getContext("2d");
      bctx.globalAlpha = 0.3;
      bctx.fillStyle = theme.paper3;
      bctx.fillRect(0, 0, back.width, back.height);

      const tFront = new THREE.CanvasTexture(front);
      tFront.colorSpace = THREE.SRGBColorSpace;
      tFront.anisotropy = 16;
      const tBack = new THREE.CanvasTexture(back);
      tBack.colorSpace = THREE.SRGBColorSpace;
      tBack.anisotropy = 16;

      // 2:1 aspect, world dimensions
      const W = 2.2, H = 1.1, T = 0.018;
      const geo = new THREE.BoxGeometry(W, H, T, 32, 16, 1);

      // Gentle curl: displace vertices for a subtle convex shape
      const pos = geo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const y = pos.getY(i);
        const z = pos.getZ(i);
        // Bulge front face slightly, dish back face slightly
        const bulge = (1 - (x / (W / 2)) ** 2) * (1 - (y / (H / 2)) ** 2) * 0.025;
        pos.setZ(i, z + Math.sign(z) * bulge);
      }
      geo.computeVertexNormals();

      const edgeMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(theme.paper3).multiplyScalar(0.85),
        roughness: 0.95,
        metalness: 0,
      });
      const matFront = new THREE.MeshStandardMaterial({
        map: tFront, roughness: 0.78, metalness: 0.02,
      });
      const matBack = new THREE.MeshStandardMaterial({
        map: tBack, roughness: 0.82, metalness: 0.02,
      });
      // BoxGeometry material order: +X, -X, +Y, -Y, +Z (front), -Z (back)
      const materials = [edgeMat, edgeMat, edgeMat, edgeMat, matFront, matBack];

      const mesh = new THREE.Mesh(geo, materials);
      mesh.position.set(s.x, s.y, 0);
      mesh.rotation.set(0, s.rY, s.rZ);
      scene.add(mesh);

      pieces.push({
        mesh, type: "note",
        anchor: mesh.position.clone(),
        baseRotZ: s.rZ, baseRotY: s.rY,
        vel: new THREE.Vector3(), angVelZ: 0,
        bobPhase: Math.random() * Math.PI * 2,
        bobSpeed: 0.4 + Math.random() * 0.25,
        bobAmpX: 0.07 + Math.random() * 0.05,
        bobAmpY: 0.08 + Math.random() * 0.06,
        rotPhase: Math.random() * Math.PI * 2,
        rotSpeed: 0.3 + Math.random() * 0.2,
        rotAmpZ: 0.04 + Math.random() * 0.04,
        rotAmpY: 0.05 + Math.random() * 0.04,
        tumblePhase: Math.random() * Math.PI * 2,
        flipStart: -Infinity,
        dragging: false,
      });
    });

    // Coins
    const coinSpecs = [
      { color: "gold",   r: 0.55, x:  0.0,  y:  2.30, z: 0.3 },
      { color: "silver", r: 0.48, x:  3.95, y:  2.30, z: 0.5 },
      { color: "copper", r: 0.46, x: -4.10, y:  0.10, z: 0.2 },
      { color: "bronze", r: 0.42, x:  0.10, y: -2.30, z: 0.4 },
      { color: "rose",   r: 0.40, x:  3.95, y: -2.30, z: 0.3 },
    ];

    coinSpecs.forEach((s) => {
      const theme = COIN_THEMES[s.color];
      const frontC = makeCanvas(512, 512);
      drawCoinFace(frontC, theme, "front");
      const backC = makeCanvas(512, 512);
      drawCoinFace(backC, theme, "back");

      const tFront = new THREE.CanvasTexture(frontC);
      tFront.colorSpace = THREE.SRGBColorSpace;
      tFront.anisotropy = 16;
      const tBack = new THREE.CanvasTexture(backC);
      tBack.colorSpace = THREE.SRGBColorSpace;
      tBack.anisotropy = 16;

      const radius = s.r;
      const thickness = radius * 0.16;
      const geo = new THREE.CylinderGeometry(radius, radius, thickness, 96, 1, false);

      // Reeded edge: tiny vertical strokes via material color noise — fake it
      // via a separate canvas for the side
      const sideC = makeCanvas(512, 32);
      const sctx = sideC.getContext("2d");
      const sg = sctx.createLinearGradient(0, 0, 0, 32);
      sg.addColorStop(0, theme.deep);
      sg.addColorStop(0.5, theme.face);
      sg.addColorStop(1, theme.deep);
      sctx.fillStyle = sg;
      sctx.fillRect(0, 0, 512, 32);
      // Reeded vertical lines
      sctx.strokeStyle = theme.deep;
      sctx.globalAlpha = 0.5;
      sctx.lineWidth = 1;
      for (let i = 0; i < 96; i++) {
        const x = (i / 96) * 512;
        sctx.beginPath();
        sctx.moveTo(x, 0);
        sctx.lineTo(x, 32);
        sctx.stroke();
      }
      const tSide = new THREE.CanvasTexture(sideC);
      tSide.wrapS = THREE.RepeatWrapping;
      tSide.repeat.set(1, 1);

      // CylinderGeometry material order: side, top, bottom
      const matSide = new THREE.MeshStandardMaterial({
        map: tSide, color: 0xffffff, metalness: 0.85, roughness: 0.45,
      });
      const matTop = new THREE.MeshPhysicalMaterial({
        map: tFront, color: 0xffffff,
        metalness: 0.92, roughness: 0.38,
        clearcoat: 0.45, clearcoatRoughness: 0.25,
      });
      const matBottom = new THREE.MeshPhysicalMaterial({
        map: tBack, color: 0xffffff,
        metalness: 0.92, roughness: 0.38,
        clearcoat: 0.45, clearcoatRoughness: 0.25,
      });
      const materials = [matSide, matTop, matBottom];

      const mesh = new THREE.Mesh(geo, materials);
      // Make the coin's face point toward the camera (+Z)
      mesh.rotation.x = Math.PI / 2;
      mesh.position.set(s.x, s.y, s.z);
      scene.add(mesh);

      pieces.push({
        mesh, type: "coin",
        anchor: mesh.position.clone(),
        baseRotZ: 0, baseRotX: Math.PI / 2, baseRotY: 0,
        vel: new THREE.Vector3(), angVelZ: 0,
        bobPhase: Math.random() * Math.PI * 2,
        bobSpeed: 0.5 + Math.random() * 0.4,
        bobAmpX: 0.05 + Math.random() * 0.05,
        bobAmpY: 0.07 + Math.random() * 0.05,
        rotPhase: Math.random() * Math.PI * 2,
        rotSpeed: 0.4 + Math.random() * 0.3,
        rotAmpZ: 0.05 + Math.random() * 0.04,
        rotAmpY: 0.10 + Math.random() * 0.06,
        tumblePhase: Math.random() * Math.PI * 2,
        flipStart: -Infinity,
        dragging: false,
      });
    });

    /* ----- Pointer handling (drag in screen space) ----- */
    const raycaster = new THREE.Raycaster();
    const cursor = new THREE.Vector2();
    let dragging = null;

    function setCursorNDC(e, rect) {
      cursor.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      cursor.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    }

    function onPointerDown(e) {
      const rect = renderer.domElement.getBoundingClientRect();
      setCursorNDC(e, rect);
      raycaster.setFromCamera(cursor, camera);

      const meshes = pieces.map((p) => p.mesh);
      const hits = raycaster.intersectObjects(meshes, false);
      if (!hits.length) return;
      e.preventDefault();
      e.stopPropagation();

      const hitMesh = hits[0].object;
      const piece = pieces.find((p) => p.mesh === hitMesh);
      if (!piece) return;

      // Drag plane perpendicular to camera at piece's depth (z)
      const dragPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -piece.mesh.position.z);
      const hit = new THREE.Vector3();
      raycaster.ray.intersectPlane(dragPlane, hit);
      const offset = hit.clone().sub(piece.mesh.position);

      piece.dragging = true;
      piece.vel.set(0, 0, 0);
      piece.angVelZ = 0;
      hitMesh.renderOrder = 100;
      // Lift forward so it's clearly above other pieces
      hitMesh.position.z = piece.anchor.z + 0.4;

      dragging = {
        piece, dragPlane, offset,
        samples: [{ t: performance.now(), x: piece.mesh.position.x, y: piece.mesh.position.y }],
        moved: false,
        startTime: performance.now(),
        startCursor: cursor.clone(),
      };

      try {
        renderer.domElement.setPointerCapture(e.pointerId);
      } catch (_) {}
    }

    function onPointerMove(e) {
      if (!dragging) return;
      const rect = renderer.domElement.getBoundingClientRect();
      setCursorNDC(e, rect);
      raycaster.setFromCamera(cursor, camera);
      const hit = new THREE.Vector3();
      raycaster.ray.intersectPlane(dragging.dragPlane, hit);
      const target = hit.sub(dragging.offset);

      dragging.piece.mesh.position.x = target.x;
      dragging.piece.mesh.position.y = target.y;

      // Tilt the note slightly in the drag direction
      if (dragging.piece.type === "note" && dragging.samples.length) {
        const last = dragging.samples[dragging.samples.length - 1];
        const dx = target.x - last.x;
        dragging.piece.mesh.rotation.z = dragging.piece.baseRotZ + Math.max(-0.4, Math.min(0.4, dx * 4));
      }

      dragging.samples.push({ t: performance.now(), x: target.x, y: target.y });
      if (dragging.samples.length > 6) dragging.samples.shift();

      const dxn = cursor.x - dragging.startCursor.x;
      const dyn = cursor.y - dragging.startCursor.y;
      if (Math.hypot(dxn, dyn) > 0.015) dragging.moved = true;
    }

    function onPointerUp(e) {
      if (!dragging) return;
      const p = dragging.piece;

      // Anchor at release position
      p.anchor.set(p.mesh.position.x, p.mesh.position.y, p.mesh.position.z - 0.4);
      p.mesh.position.z = p.anchor.z;
      p.mesh.renderOrder = 0;

      // Release velocity
      const s = dragging.samples;
      if (s.length >= 2) {
        const a = s[0];
        const b = s[s.length - 1];
        const dtt = (b.t - a.t) / 1000;
        if (dtt > 0.01) {
          p.vel.x = clamp((b.x - a.x) / dtt, -15, 15) * 0.5;
          p.vel.y = clamp((b.y - a.y) / dtt, -15, 15) * 0.5;
          p.angVelZ = clamp((b.x - a.x) / dtt * 0.5, -4, 4);
        }
      }

      // Tap (no movement) → coin flip
      const duration = performance.now() - dragging.startTime;
      if (!dragging.moved && duration < 350) {
        if (p.type === "coin") {
          p.flipStart = performance.now();
        } else {
          p.vel.y = 1.2;
          p.angVelZ = (Math.random() - 0.5) * 4;
        }
      }

      p.dragging = false;
      dragging = null;

      try {
        renderer.domElement.releasePointerCapture(e.pointerId);
      } catch (_) {}
    }

    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);

    /* ----- Animate ----- */
    let tickCount = 0;
    function tick(now) {
      tickCount++;
      try {
      const t = now / 1000;
      const dt = 1 / 60;

      pieces.forEach((p) => {
        if (p.dragging) return;

        // Release damping
        p.vel.multiplyScalar(0.94);
        p.angVelZ *= 0.93;
        if (p.vel.length() < 0.002) p.vel.set(0, 0, 0);
        if (Math.abs(p.angVelZ) < 0.003) p.angVelZ = 0;

        p.anchor.x += p.vel.x * dt;
        p.anchor.y += p.vel.y * dt;
        p.baseRotZ += p.angVelZ * dt;

        // Soft bounds in world space
        const xb = 5.8, yb = 3.2;
        if (p.anchor.x >  xb) { p.anchor.x =  xb; p.vel.x = -Math.abs(p.vel.x) * 0.4; }
        if (p.anchor.x < -xb) { p.anchor.x = -xb; p.vel.x =  Math.abs(p.vel.x) * 0.4; }
        if (p.anchor.y >  yb) { p.anchor.y =  yb; p.vel.y = -Math.abs(p.vel.y) * 0.4; }
        if (p.anchor.y < -yb) { p.anchor.y = -yb; p.vel.y =  Math.abs(p.vel.y) * 0.4; }

        // Floating bob
        const bx = Math.sin(t * p.bobSpeed + p.bobPhase) * p.bobAmpX;
        const by = Math.sin(t * p.bobSpeed * 0.7 + p.bobPhase + 1.3) * p.bobAmpY;
        p.mesh.position.x = p.anchor.x + bx;
        p.mesh.position.y = p.anchor.y + by;
        p.mesh.position.z = p.anchor.z;

        // Rotation drift
        const rotZ = p.baseRotZ + Math.sin(t * p.rotSpeed + p.rotPhase) * p.rotAmpZ;
        const tumble = Math.sin(t * p.rotSpeed * 0.6 + p.tumblePhase) * p.rotAmpY;

        if (p.type === "note") {
          p.mesh.rotation.z = rotZ;
          // Subtle tumble around Y for parallax
          p.mesh.rotation.y = p.baseRotY + tumble;
          // Pitch slightly around X
          p.mesh.rotation.x = Math.sin(t * 0.4 + p.bobPhase) * 0.08;
        } else {
          // Coin: cylinder base orientation rotation.x = π/2 puts face toward +Z
          // Tap flip adds full rotation around X (2π over FLIP_DURATION).
          let flipDelta = 0;
          const elapsed = (now - p.flipStart) / 800;
          if (elapsed > 0 && elapsed < 1) {
            const eased = 1 - Math.pow(1 - elapsed, 3);
            flipDelta = eased * Math.PI * 2;
          }
          p.mesh.rotation.x = Math.PI / 2 + flipDelta;
          // Idle gentle wobble around vertical (Z) so light glints across face
          p.mesh.rotation.z = rotZ + Math.sin(t * 0.6 + p.tumblePhase) * 0.15;
          // Subtle parallax around Y
          p.mesh.rotation.y = tumble * 0.5;
        }
      });

      renderer.render(scene, camera);
      rafId = requestAnimationFrame(tick);
      } catch (err) {
        console.error("[SplitSmartHero] tick error:", err);
        if (window.__heroDebug) window.__heroDebug.lastError = String(err);
        // Stop the loop on error
      }
    }

    let rafId = requestAnimationFrame(tick);

    /* ----- Resize ----- */
    function onResize() {
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    }
    const resizeObserver = new ResizeObserver(onResize);
    resizeObserver.observe(container);
    window.addEventListener("resize", onResize);

    /* ----- Shake — kick every piece in a random direction. ----- */
    function shake() {
      pieces.forEach((p) => {
        const ang = Math.random() * Math.PI * 2;
        const mag = 2 + Math.random() * 2;
        p.vel.x += Math.cos(ang) * mag;
        p.vel.y += Math.sin(ang) * mag;
        p.angVelZ += (Math.random() - 0.5) * 6;
        if (p.type === "coin") p.flipStart = performance.now();
      });
    }
    // Expose shake on the scene return value if needed in the future
    (init as any).shake = shake;

    /* ----- Cleanup ----- */
    return function cleanup() {
      cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      window.removeEventListener("resize", onResize);
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);

      // Dispose textures & geometries
      pieces.forEach((p) => {
        p.mesh.geometry.dispose();
        const mats = Array.isArray(p.mesh.material) ? p.mesh.material : [p.mesh.material];
        mats.forEach((m) => {
          if (m.map) m.map.dispose();
          m.dispose();
        });
      });
      renderer.dispose();
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }

  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
