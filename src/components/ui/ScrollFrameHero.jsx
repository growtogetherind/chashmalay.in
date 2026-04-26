import React, { useEffect, useRef, useCallback } from 'react';
import './ScrollFrameHero.css';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

// ─── Frame paths (009 → 024 = 16 frames) ────────────────────────────────────
const FRAMES = Array.from({ length: 16 }, (_, i) => {
  const num = String(i + 9).padStart(3, '0');
  return `/assets/frames/Create_video_showing_202604260251_${num}.jpg`;
});

const SCROLL_HEIGHT_MULTIPLIER = 5; // Extra scroll for smoother feel

export default function ScrollFrameHero() {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const imagesRef = useRef([]);
  
  // Logic refs
  const targetProgressRef = useRef(0);
  const currentProgressRef = useRef(0);
  const lastDrawnIndexRef = useRef(-1);
  const rafRef = useRef(null);
  const loadedCountRef = useRef(0);

  // ── Pre-load all frames ──────────────────────────────────────────────────
  useEffect(() => {
    imagesRef.current = [];
    loadedCountRef.current = 0;

    FRAMES.forEach((src, i) => {
      const img = new Image();
      img.src = src;
      img.onload = () => {
        loadedCountRef.current += 1;
        // Initial draw if first frame is ready
        if (i === 0) drawFrame(0);
      };
      imagesRef.current[i] = img;
    });

    return () => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // ── Draw logic (COVER scaling for FULL SCREEN feel) ──────────────────────
  const drawFrame = useCallback((index) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const img = imagesRef.current[index];
    if (!img || !img.complete) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    const cw = canvas.width;
    const ch = canvas.height;

    // COVER math
    const imgRatio = img.naturalWidth / img.naturalHeight;
    const canvasRatio = cw / ch;
    let drawW, drawH, dx, dy;

    if (imgRatio < canvasRatio) {
      drawW = cw;
      drawH = cw / imgRatio;
      dx = 0;
      dy = (ch - drawH) / 2;
    } else {
      drawH = ch;
      drawW = ch * imgRatio;
      dx = (cw - drawW) / 2;
      dy = 0;
    }

    // No clear needed if we cover everything, but better for transparency safety
    ctx.drawImage(img, dx, dy, drawW, drawH);
    lastDrawnIndexRef.current = index;
  }, []);

  // ── Continuous Lerp Animation Loop ─────────────────────────────────────
  const animate = useCallback(() => {
    // Lerp progress: current = current + (target - current) * factor
    // 0.1 is a sweet spot for "premium" smooth lag-free catch-up
    currentProgressRef.current += (targetProgressRef.current - currentProgressRef.current) * 0.1;

    const index = Math.min(
      Math.floor(currentProgressRef.current * (FRAMES.length - 1)),
      FRAMES.length - 1
    );

    if (index !== lastDrawnIndexRef.current) {
      drawFrame(index);
    }

    rafRef.current = requestAnimationFrame(animate);
  }, [drawFrame]);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [animate]);

  // ── Scroll Listener ───────────────────────────────────────────────────
  useEffect(() => {
    const handleScroll = () => {
      const container = containerRef.current;
      if (!container) return;

      const containerTop = container.offsetTop;
      const scrollY = window.scrollY;
      const scrollableDistance = container.offsetHeight - window.innerHeight;

      // Calculate progress (0 to 1) based on sticky range
      const rawProgress = (scrollY - containerTop) / scrollableDistance;
      targetProgressRef.current = Math.min(Math.max(rawProgress, 0), 1);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // ── Responsive Canvas Fix ──────────────────────────────────────────────
  useEffect(() => {
    const resize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const dpr = window.devicePixelRatio || 1;
      const parent = canvas.parentElement;
      
      canvas.width = parent.clientWidth * dpr;
      canvas.height = parent.clientHeight * dpr;
      
      const ctx = canvas.getContext('2d');
      ctx.scale(dpr, dpr);
      
      drawFrame(lastDrawnIndexRef.current >= 0 ? lastDrawnIndexRef.current : 0);
    };

    window.addEventListener('resize', resize);
    resize();
    return () => window.removeEventListener('resize', resize);
  }, [drawFrame]);

  const stickyHeight = `${SCROLL_HEIGHT_MULTIPLIER * 100}vh`;

  return (
    <section
      ref={containerRef}
      className="scroll-frame-hero-outer"
      style={{ height: stickyHeight }}
    >
      <div className="scroll-frame-sticky">
        <div className="scroll-frame-canvas-wrap">
          <canvas ref={canvasRef} className="scroll-frame-canvas" />
        </div>

        <div className="scroll-frame-overlay" />

        <div className="scroll-frame-content">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.4, ease: [0.19, 1, 0.22, 1] }}
            className="scroll-frame-text"
          >
            <span className="scroll-frame-eyebrow">Architectural Precision</span>

            <h1 className="scroll-frame-title">
              <span className="block">CLEAR</span>
              <span className="block scroll-frame-title-accent">VISION.</span>
            </h1>

            <p className="scroll-frame-sub">
              Cinematic objects for the visionary soul. Scroll to explore the geometry of shadow and light.
            </p>

            <div className="scroll-frame-actions">
              <Link to="/category/eyeglasses" className="sfh-btn sfh-btn-primary">
                The Archive <ArrowRight size={16} />
              </Link>
              <Link to="/all-products" className="sfh-btn">
                Explore Studio
              </Link>
            </div>
          </motion.div>
        </div>

        <div className="scroll-frame-indicator">
          <div className="scroll-frame-indicator-line" />
          <span>SCROLL TO EXPLORE</span>
        </div>
      </div>
    </section>
  );
}
