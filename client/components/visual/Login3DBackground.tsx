import React, { useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Float, Stars, useTexture } from "@react-three/drei";
import * as THREE from "three";

function ParallaxGroup({ children }: { children: React.ReactNode }) {
  const group = useRef<THREE.Group>(null!);
  const { viewport, pointer } = useThree();
  useFrame(() => {
    const x = (pointer.x * Math.min(1, viewport.width / 8)) / 12;
    const y = (pointer.y * Math.min(1, viewport.height / 8)) / 12;
    group.current.rotation.y = THREE.MathUtils.lerp(
      group.current.rotation.y,
      x,
      0.05,
    );
    group.current.rotation.x = THREE.MathUtils.lerp(
      group.current.rotation.x,
      -y,
      0.05,
    );
  });
  return <group ref={group}>{children}</group>;
}

function LogoPlane({ url }: { url: string }) {
  const tex = useTexture(url);
  tex.anisotropy = 8;
  return (
    <mesh position={[0, 0.2, 0]}>
      <planeGeometry args={[6, 2]} />
      <meshBasicMaterial map={tex} transparent toneMapped={false} />
    </mesh>
  );
}

export default function Login3DBackground({ logoUrl }: { logoUrl: string }) {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10">
      <Canvas dpr={[1, 2]} camera={{ position: [0, 0, 8], fov: 50 }}>
        <color attach="background" args={["#0B1220"]} />
        {/* Depth fog for contrast */}
        <fog attach="fog" args={["#0B1220", 10, 25]} />

        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 5, 5]} intensity={1.2} />
        <directionalLight
          position={[-6, -4, 2]}
          intensity={0.4}
          color="#4f46e5"
        />

        <ParallaxGroup>
          <Float speed={0.6} rotationIntensity={0.2} floatIntensity={0.6}>
            <LogoPlane url={logoUrl} />
          </Float>
        </ParallaxGroup>

        <Stars
          radius={80}
          depth={40}
          count={2000}
          factor={2}
          saturation={0}
          fade
          speed={0.6}
        />
      </Canvas>
    </div>
  );
}
