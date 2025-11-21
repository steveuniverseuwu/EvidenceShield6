import { useEffect, useRef } from 'react';

export const BlockchainChainDesign = () => {
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

    // Chain link class
    class ChainLink {
      x: number;
      y: number;
      width: number;
      height: number;
      rotation: number;
      rotationSpeed: number;
      opacity: number;
      dots: Array<{x: number, y: number, opacity: number}>;

      constructor(x: number, y: number, rotation: number) {
        this.x = x;
        this.y = y;
        this.width = 60;
        this.height = 120;
        this.rotation = rotation;
        this.rotationSpeed = (Math.random() - 0.5) * 0.005;
        this.opacity = Math.random() * 0.3 + 0.6;
        
        // Generate random dots (binary code pattern) - reduced from 40 to 20
        this.dots = [];
        for (let i = 0; i < 20; i++) {
          this.dots.push({
            x: (Math.random() - 0.5) * this.width * 0.8,
            y: (Math.random() - 0.5) * this.height * 0.8,
            opacity: Math.random() * 0.5 + 0.3
          });
        }
      }

      update() {
        this.rotation += this.rotationSpeed;
      }

      draw(ctx: CanvasRenderingContext2D) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.globalAlpha = this.opacity;

        // Draw outer ring (main chain link) - reduced shadow blur
        ctx.strokeStyle = 'rgba(0, 200, 255, 0.8)';
        ctx.lineWidth = 3;
        ctx.shadowBlur = 10;
        ctx.shadowColor = 'rgba(0, 200, 255, 0.8)';
        
        // Rounded rectangle for chain link
        const radius = 15;
        ctx.beginPath();
        ctx.moveTo(-this.width/2 + radius, -this.height/2);
        ctx.lineTo(this.width/2 - radius, -this.height/2);
        ctx.quadraticCurveTo(this.width/2, -this.height/2, this.width/2, -this.height/2 + radius);
        ctx.lineTo(this.width/2, this.height/2 - radius);
        ctx.quadraticCurveTo(this.width/2, this.height/2, this.width/2 - radius, this.height/2);
        ctx.lineTo(-this.width/2 + radius, this.height/2);
        ctx.quadraticCurveTo(-this.width/2, this.height/2, -this.width/2, this.height/2 - radius);
        ctx.lineTo(-this.width/2, -this.height/2 + radius);
        ctx.quadraticCurveTo(-this.width/2, -this.height/2, -this.width/2 + radius, -this.height/2);
        ctx.closePath();
        ctx.stroke();

        // Draw inner ring (smaller)
        const innerWidth = this.width * 0.6;
        const innerHeight = this.height * 0.6;
        ctx.beginPath();
        ctx.moveTo(-innerWidth/2 + radius, -innerHeight/2);
        ctx.lineTo(innerWidth/2 - radius, -innerHeight/2);
        ctx.quadraticCurveTo(innerWidth/2, -innerHeight/2, innerWidth/2, -innerHeight/2 + radius);
        ctx.lineTo(innerWidth/2, innerHeight/2 - radius);
        ctx.quadraticCurveTo(innerWidth/2, innerHeight/2, innerWidth/2 - radius, innerHeight/2);
        ctx.lineTo(-innerWidth/2 + radius, innerHeight/2);
        ctx.quadraticCurveTo(-innerWidth/2, innerHeight/2, -innerWidth/2, innerHeight/2 - radius);
        ctx.lineTo(-innerWidth/2, -innerHeight/2 + radius);
        ctx.quadraticCurveTo(-innerWidth/2, -innerHeight/2, -innerWidth/2 + radius, -innerHeight/2);
        ctx.closePath();
        ctx.stroke();

        // Draw dots (binary code pattern) - reduced shadow blur
        ctx.shadowBlur = 3;
        this.dots.forEach(dot => {
          ctx.globalAlpha = this.opacity * dot.opacity;
          ctx.fillStyle = 'rgba(0, 220, 255, 1)';
          ctx.beginPath();
          ctx.arc(dot.x, dot.y, 1.5, 0, Math.PI * 2);
          ctx.fill();
        });

        ctx.restore();
      }
    }

    // Create chain links (reduced from 8 to 5 chains)
    const chains: ChainLink[] = [];
    const chainCount = 5;
    
    for (let i = 0; i < chainCount; i++) {
      const x = (canvas.width / (chainCount + 1)) * (i + 1);
      const startY = canvas.height * 0.25;
      
      // Create vertical chain (reduced from 4 to 3 links)
      for (let j = 0; j < 3; j++) {
        const y = startY + j * 160;
        const rotation = j % 2 === 0 ? 0 : Math.PI / 2;
        chains.push(new ChainLink(x, y, rotation));
      }
    }

    // Particles for depth (reduced from 100 to 30)
    const particles: Array<{x: number, y: number, size: number, opacity: number, speed: number}> = [];
    for (let i = 0; i < 30; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.5 + 0.2,
        speed: Math.random() * 0.5 + 0.2
      });
    }

    // Animation loop
    const animate = () => {
      // Clear with darker fade for better performance
      ctx.fillStyle = 'rgba(1, 10, 25, 0.15)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Update and draw particles
      particles.forEach(particle => {
        particle.y += particle.speed;
        if (particle.y > canvas.height) {
          particle.y = 0;
          particle.x = Math.random() * canvas.width;
        }

        ctx.fillStyle = `rgba(0, 200, 255, ${particle.opacity})`;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // Update and draw chain links
      chains.forEach(link => {
        link.update();
        link.draw(ctx);
      });

      requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ zIndex: 0 }}
    />
  );
};
