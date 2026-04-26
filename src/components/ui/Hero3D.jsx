import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Environment, ContactShadows, MeshTransmissionMaterial } from '@react-three/drei';
import { useInView } from 'framer-motion';
import { RevealText, FadeIn } from './Motion';

const GlassLens = () => {
  const mesh = useRef();

  useFrame((state, delta) => {
    if (mesh.current) {
      mesh.current.rotation.x += delta * 0.1;
      mesh.current.rotation.y += delta * 0.15;
    }
  });

  return (
    <Float floatIntensity={2} speed={1.5} rotationIntensity={0.5}>
      <mesh ref={mesh} position={[0, 0.5, 0]}>
        <torusGeometry args={[1.5, 0.4, 64, 128]} />
        <MeshTransmissionMaterial
          backside
          backsideThickness={0.5}
          thickness={1.5}
          chromaticAberration={0.05}
          anisotropicBlur={0.2}
          clearcoat={1}
          clearcoatRoughness={0.1}
          envMapIntensity={2}
          transmission={1}
          roughness={0}
          distortion={0.2}
          distortionScale={0.1}
          temporalDistortion={0}
          color="#FAF9F6"
        />
      </mesh>
    </Float>
  );
};

export const Hero3D = () => {
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { once: false, margin: "0px 0px -100px 0px" });

  return (
    <section ref={containerRef} className="relative w-full h-screen bg-background overflow-hidden flex items-center justify-center">
      
      {/* 3D Canvas Background */}
      <div className="absolute inset-0 z-0">
        {isInView && (
          <Canvas 
            camera={{ position: [0, 0, 8], fov: 45 }} 
            dpr={[1, 1.5]}
            gl={{ antialias: true, powerPreference: 'high-performance' }}
            className="w-full h-full pointer-events-none"
          >
            <ambientLight intensity={0.5} />
            <directionalLight position={[10, 10, 10]} intensity={1} />
            <Environment preset="studio" />
            <GlassLens />
            <ContactShadows 
              position={[0, -2, 0]} 
              opacity={0.4} 
              scale={20} 
              blur={2.5} 
              far={4.5} 
              color="#1A1A1A"
            />
          </Canvas>
        )}
      </div>

      {/* Hero Typography Overlay */}
      <div className="relative z-10 text-center container h-full flex flex-col items-center justify-center pointer-events-auto">
        <h1 className="flex flex-col items-center gap-2 mb-8">
          <RevealText text="Elegance in" delay={0.2} />
          <RevealText text="Every Detail" delay={0.4} className="text-secondary italic font-light" />
        </h1>
        
        <FadeIn delay={0.8}>
          <p className="text-secondary text-lg md:text-xl max-w-md mx-auto mb-10 font-sans tracking-wide">
            Discover our curated collection of premium optical frames designed for the modern vision.
          </p>
        </FadeIn>

        <FadeIn delay={1.0}>
          <button className="btn-primary">
            Explore Collection
          </button>
        </FadeIn>
      </div>

    </section>
  );
};

export default Hero3D;
