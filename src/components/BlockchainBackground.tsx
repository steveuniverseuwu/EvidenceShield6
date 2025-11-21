import { useEffect, useRef } from 'react';

export const BlockchainBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Node class for blockchain network
    class Node {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      connections: Node[];

      constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 0.3;
        this.vy = (Math.random() - 0.5) * 0.3;
        this.radius = Math.random() * 2 + 1;
        this.connections = [];
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;

        if (this.x < 0 || this.x > canvas!.width) this.vx *= -1;
        if (this.y < 0 || this.y > canvas!.height) this.vy *= -1;
      }

      draw(ctx: CanvasRenderingContext2D) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(59, 130, 246, 0.6)';
        ctx.fill();
        
        // Glow effect
        ctx.shadowBlur = 10;
        ctx.shadowColor = 'rgba(59, 130, 246, 0.8)';
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }

    // Optimize node count based on screen size
    const getOptimalNodeCount = () => {
      const area = canvas.width * canvas.height;
      const isMobile = window.innerWidth < 768;
      const divisor = isMobile ? 30000 : 15000; // Fewer nodes on mobile
      return Math.floor(area / divisor);
    };

    // Create nodes with optimized count
    const nodes: Node[] = [];
    const nodeCount = getOptimalNodeCount();
    
    for (let i = 0; i < nodeCount; i++) {
      nodes.push(new Node(
        Math.random() * canvas.width,
        Math.random() * canvas.height
      ));
    }

    // Animation loop with FPS limiting and optimizations
    let lastTime = 0;
    let animationId: number;
    const targetFPS = 30; // Limit to 30 FPS (huge performance gain, invisible to human eye)
    const frameInterval = 1000 / targetFPS;
    const connectionThreshold = 150;
    const connectionThresholdSquared = connectionThreshold * connectionThreshold; // Avoid sqrt

    const animate = (currentTime: number) => {
      // FPS throttling - skip frames to maintain 30 FPS
      if (currentTime - lastTime < frameInterval) {
        animationId = requestAnimationFrame(animate);
        return;
      }
      lastTime = currentTime;

      ctx.fillStyle = 'rgba(3, 7, 18, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Update and draw nodes
      nodes.forEach(node => {
        node.update();
        node.draw(ctx);
      });

      // Draw connections with optimized distance calculation
      nodes.forEach((node, i) => {
        nodes.slice(i + 1).forEach(otherNode => {
          const dx = node.x - otherNode.x;
          const dy = node.y - otherNode.y;
          const distSquared = dx * dx + dy * dy; // Avoid expensive sqrt

          if (distSquared < connectionThresholdSquared) {
            const distance = Math.sqrt(distSquared); // Only calculate when needed
            ctx.beginPath();
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(otherNode.x, otherNode.y);
            const opacity = (1 - distance / connectionThreshold) * 0.3;
            ctx.strokeStyle = `rgba(59, 130, 246, ${opacity})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        });
      });

      animationId = requestAnimationFrame(animate);
    };

    // Pause animation when tab is not visible (100% CPU savings when hidden)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (animationId) {
          cancelAnimationFrame(animationId);
        }
      } else {
        lastTime = performance.now();
        animate(lastTime);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    animate(performance.now());

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, []);

  return (
    <>
      {/* Animated Canvas Network */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 w-full h-full"
        style={{ 
          zIndex: 0,
          willChange: 'transform',
          transform: 'translateZ(0)' // Force GPU acceleration
        }}
      />

      {/* Static Background Layers */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950" style={{ zIndex: -1 }} />
      
      {/* Grid Pattern */}
      <div 
        className="fixed inset-0 opacity-10 animate-grid-slide"
        style={{
          zIndex: 1,
          backgroundImage: `
            linear-gradient(rgba(59, 130, 246, 0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(59, 130, 246, 0.3) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
          pointerEvents: 'none'
        }}
      />

      {/* Hexagon Pattern */}
      <div className="fixed inset-0 opacity-5" style={{ zIndex: 1, pointerEvents: 'none' }}>
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-hex-float"
            style={{
              left: `${(i * 20) % 100}%`,
              top: `${(i * 30) % 100}%`,
              animationDelay: `${i * 1.5}s`,
            }}
          >
            <svg width="100" height="100" viewBox="0 0 100 100">
              <polygon
                points="50,5 90,28 90,72 50,95 10,72 10,28"
                fill="none"
                stroke="rgba(59, 130, 246, 0.4)"
                strokeWidth="2"
              />
            </svg>
          </div>
        ))}
      </div>

      {/* Light Rays */}
      <div 
        className="fixed inset-0 opacity-20"
        style={{
          zIndex: 1,
          background: `
            radial-gradient(ellipse at 20% 30%, rgba(59, 130, 246, 0.15) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 70%, rgba(99, 102, 241, 0.15) 0%, transparent 50%)
          `,
          pointerEvents: 'none'
        }}
      />

      {/* Scanline Effect */}
      <div 
        className="fixed inset-0 opacity-5 animate-grid-slide"
        style={{
          zIndex: 2,
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(59, 130, 246, 0.1) 2px, rgba(59, 130, 246, 0.1) 4px)',
          pointerEvents: 'none'
        }}
      />
    </>
  );
};
