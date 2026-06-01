"use client";
import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

const PARTICLE_COUNT = 80;
const COLORS = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7", "#DDA0DD", "#98D8C8"];

interface Particle {
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  color: THREE.Color;
}

function ParticleSystem() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const particles = useMemo<Particle[]>(() => {
    const out: Particle[] = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      out.push({
        pos: new THREE.Vector3((Math.random() - 0.5) * 0.5, 0, (Math.random() - 0.5) * 0.5),
        vel: new THREE.Vector3(
          (Math.random() - 0.5) * 4,
          Math.random() * 4 + 4,
          (Math.random() - 0.5) * 2
        ),
        color: new THREE.Color(COLORS[Math.floor(Math.random() * COLORS.length)]),
      });
    }
    return out;
  }, []);

  useEffect(() => {
    if (!meshRef.current) return;
    particles.forEach((p, i) => {
      meshRef.current!.setColorAt(i, p.color);
    });
    meshRef.current.instanceColor!.needsUpdate = true;
  }, [particles]);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    particles.forEach((p, i) => {
      p.vel.y -= 6 * delta;
      p.pos.addScaledVector(p.vel, delta);
      dummy.position.copy(p.pos);
      dummy.rotation.x += 0.05;
      dummy.rotation.y += 0.03;
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, PARTICLE_COUNT]}>
      <boxGeometry args={[0.08, 0.08, 0.08]} />
      <meshStandardMaterial vertexColors />
    </instancedMesh>
  );
}

export default function SettlementConfetti() {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        pointerEvents: "none",
        zIndex: 50,
      }}
    >
      <Canvas camera={{ position: [0, 0, 10], fov: 50 }} gl={{ alpha: true }}>
        <ambientLight intensity={0.7} />
        <pointLight position={[0, 5, 5]} intensity={0.8} />
        <ParticleSystem />
      </Canvas>
    </div>
  );
}
