"use client";

import { useEffect, useRef } from "react";
import { createHeroScene } from "./three/createHeroScene";

/* Canvas-only mount for vanilla Three.js hero scene.
   Renders an empty div the 3D scene attaches to. */

export default function HeroScene() {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const cleanup = createHeroScene(containerRef.current);
    return () => {
      if (typeof cleanup === "function") cleanup();
    };
  }, []);

  return <div ref={containerRef} className="hero-3d-canvas" />;
}
