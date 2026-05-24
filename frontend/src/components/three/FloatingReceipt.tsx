"use client";
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import * as THREE from "three";

export function FloatingReceipt({ position }: { position: [number, number, number] }) {
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.x += 0.003;
      meshRef.current.rotation.z += 0.002;
    }
  });
  return (
    <Float speed={0.9} rotationIntensity={0.5} floatIntensity={0.8}>
      <mesh ref={meshRef} position={position}>
        <boxGeometry args={[0.8, 1.2, 0.02]} />
        <meshStandardMaterial color="#FFFFFF" transparent opacity={0.85} />
      </mesh>
    </Float>
  );
}
