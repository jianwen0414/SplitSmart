"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { createHeroScene } from "./three/createHeroScene";

/* Thin React wrapper for the vanilla Three.js hero scene.
   The 3D scene runs entirely outside React; we just attach it to a div. */

export default function HeroScene({ children }: { children?: ReactNode }) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const cleanup = createHeroScene(containerRef.current);
    return () => {
      if (typeof cleanup === "function") cleanup();
    };
  }, []);

  return (
    <div className="hero-stage">
      <div ref={containerRef} className="hero-3d-canvas" />
      {children}
    </div>
  );
}
