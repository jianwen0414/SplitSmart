"use client";
import { Suspense, useEffect, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import { FloatingCoin } from "./FloatingCoin";
import { FloatingReceipt } from "./FloatingReceipt";

const COIN_POSITIONS: [number, number, number][] = [
  [-3.2, 1.4, 0], [-1.5, -1.2, 0.5], [0.8, 1.8, -1], [2.4, -0.6, 0.2], [3.6, 1.0, -0.5], [-2.5, 0.2, 1], [1.6, 0.5, 0.8],
];
const RECEIPT_POSITIONS: [number, number, number][] = [
  [-1.8, 2.0, -1], [2.8, 1.5, 0], [-2.2, -1.8, 0.5], [0.5, -1.5, -0.8],
];

function MouseParallax() {
  const { camera, pointer } = useThree();
  useFrame(() => {
    camera.position.x += (pointer.x * 0.3 - camera.position.x) * 0.05;
    camera.position.y += (-pointer.y * 0.3 - camera.position.y) * 0.05;
    camera.lookAt(0, 0, 0);
  });
  return null;
}

function MobileFallback() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-brand-50 via-amber-50 to-white">
      <div className="text-6xl opacity-30">💰 🧾 💴</div>
    </div>
  );
}

export default function HeroScene() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  if (isMobile) return <MobileFallback />;

  return (
    <Canvas
      camera={{ position: [0, 0, 6], fov: 45 }}
      frameloop="always"
      gl={{ antialias: true, alpha: true }}
      style={{ background: "transparent" }}
    >
      <Suspense fallback={null}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={0.8} />
        <Stars radius={50} depth={20} count={100} factor={2} fade speed={0.5} />
        {COIN_POSITIONS.map((p, i) => <FloatingCoin key={`c${i}`} position={p} />)}
        {RECEIPT_POSITIONS.map((p, i) => <FloatingReceipt key={`r${i}`} position={p} />)}
        <MouseParallax />
      </Suspense>
    </Canvas>
  );
}
