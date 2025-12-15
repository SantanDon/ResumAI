import React, { useEffect, useRef } from 'react';
import './Particles.css';

interface ParticlesProps {
  quantity?: number;
  staticity?: number;
  spread?: number;
  size?: number;
  baseSize?: number;
  sizeRandomness?: number;
  colors?: string[];
  uTime?: number;
}

export const Particles: React.FC<ParticlesProps> = ({
  quantity = 300,
  staticity = 50,
  spread = 0,
  size = 0.6,
  baseSize = 0.6,
  sizeRandomness = 0.5,
  colors = ['#ffffff', '#a855f7', '#3b82f6'],
  uTime = 0.1,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const particlesRef = useRef<any[]>([]);
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    contextRef.current = ctx;

    const initParticles = () => {
      const particles = [];
      const w = canvas.width;
      const h = canvas.height;

      for (let i = 0; i < quantity; i++) {
        const x = Math.random() * w;
        const y = Math.random() * h;
        const dx = (Math.random() - 0.5) * 0.5;
        const dy = (Math.random() - 0.5) * 0.5;
        const s = (baseSize + Math.random() * sizeRandomness) * 2; // Scale up for visibility
        const color = colors[Math.floor(Math.random() * colors.length)];
        particles.push({ x, y, dx, dy, s, color });
      }
      particlesRef.current = particles;
    };

    const resize = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.offsetWidth;
        canvas.height = parent.offsetHeight;
        initParticles();
      }
    };

    window.addEventListener('resize', resize);
    resize();

    const animate = () => {
      if (!contextRef.current || !canvasRef.current) return;
      const ctx = contextRef.current;
      const w = canvasRef.current.width;
      const h = canvasRef.current.height;

      ctx.clearRect(0, 0, w, h);

      particlesRef.current.forEach((p) => {
        p.x += p.dx;
        p.y += p.dy;

        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.s, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [quantity, baseSize, sizeRandomness, colors]);

  return (
    <div className="particles-container">
      <canvas ref={canvasRef} className="block w-full h-full" />
    </div>
  );
};
