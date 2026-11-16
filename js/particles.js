/**
 * ==============================================================================
 * NUMORIA - LIGHTWEIGHT PARTICLE SYSTEM
 * Optimized for high performance and low GPU/CPU load
 * ==============================================================================
 */
class ParticleSystem {
  constructor() {
    this.particles = [];
    this.maxParticles = 20; // Lightweight capped pool
  }

  emit(x, y, color, count = 1, speed = 2) {
    if (this.particles.length >= this.maxParticles) return;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const vel = (Math.random() * 0.7 + 0.3) * speed;
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * vel,
        vy: Math.sin(angle) * vel,
        size: Math.random() * 2.5 + 1.2,
        color: color,
        alpha: 0.9,
        decay: 0.05
      });
    }
  }

  update(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= p.decay;
      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  draw(ctx) {
    if (this.particles.length === 0) return;
    ctx.save();
    for (const p of this.particles) {
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

window.ParticleSystem = ParticleSystem;
