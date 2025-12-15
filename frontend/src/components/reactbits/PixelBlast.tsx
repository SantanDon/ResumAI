import React, { useEffect, useRef } from 'react';

interface PixelBlastProps {
  colors?: string[];
  gap?: number;
  speed?: number;
  className?: string;
  children?: React.ReactNode;
}

export const PixelBlast: React.FC<PixelBlastProps> = ({
  colors = ['#ffffff', '#f3f4f6', '#e5e7eb'],
  gap = 40,
  speed = 0.05,
  className = '',
  children
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let particles: Particle[] = [];
    let mouse = { x: 0, y: 0 };
    let isActive = false;

    const resize = () => {
      width = container.clientWidth;
      height = container.clientHeight;
      canvas.width = width;
      canvas.height = height;
    };

    class Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      color: string;
      size: number;
      life: number;

      constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
        const angle = Math.random() * Math.PI * 2;
        const velocity = Math.random() * 2 + 1;
        this.vx = Math.cos(angle) * velocity;
        this.vy = Math.sin(angle) * velocity;
        this.color = colors[Math.floor(Math.random() * colors.length)];
        this.size = Math.random() * 4 + 2;
        this.life = 1;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= speed;
        this.size *= 0.95;
      }

      draw(ctx: CanvasRenderingContext2D) {
        ctx.fillStyle = this.color;
        ctx.globalAlpha = this.life;
        ctx.beginPath();
        ctx.rect(this.x, this.y, this.size, this.size);
        ctx.fill();
      }
    }

    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      // Ambient particles
      if (particles.length < 30) {
          particles.push(new Particle(Math.random() * width, Math.random() * height));
      }

      if (isActive) {
        for (let i = 0; i < 5; i++) {
          particles.push(new Particle(mouse.x, mouse.y));
        }
      }

      particles.forEach((p, index) => {
        p.update();
        p.draw(ctx);
        if (p.life <= 0) {
          particles.splice(index, 1);
        }
      });

      requestAnimationFrame(animate);
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
      isActive = true;
    };

    const handleMouseLeave = () => {
      isActive = false;
    };

    window.addEventListener('resize', resize);
    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseleave', handleMouseLeave);
    
    // Initial resize and fill
    resize();
    for(let i=0; i<50; i++) {
        particles.push(new Particle(Math.random() * width, Math.random() * height));
    }
    animate();

    return () => {
      window.removeEventListener('resize', resize);
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [colors, gap, speed]);

  return (
    <div ref={containerRef} className={`absolute inset-0 w-full h-full overflow-hidden bg-black ${className}`}>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 z-0"
      />
      <div className="relative z-10 w-full h-full pointer-events-none">
        <div className="pointer-events-auto w-full h-full">
            {children}
        </div>
      </div>
    </div>
  );
};
