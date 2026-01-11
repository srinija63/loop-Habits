/**
 * Confetti Animation System
 * Celebrates habit completions with a burst of confetti
 */

class Confetti {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.particles = [];
    this.animationId = null;
    this.isRunning = false;
    
    // Resize canvas to window size
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }
  
  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }
  
  /**
   * Create a single particle
   */
  createParticle(x, y, color) {
    const angle = Math.random() * Math.PI * 2;
    const velocity = 8 + Math.random() * 8;
    
    return {
      x,
      y,
      vx: Math.cos(angle) * velocity,
      vy: Math.sin(angle) * velocity - 10,
      color,
      size: 6 + Math.random() * 6,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.2,
      gravity: 0.3,
      friction: 0.99,
      opacity: 1,
      shape: Math.random() > 0.5 ? 'rect' : 'circle',
      width: 8 + Math.random() * 8,
      height: 4 + Math.random() * 4
    };
  }
  
  /**
   * Launch confetti from a specific point
   */
  burst(x, y, count = 30, colors = null) {
    const defaultColors = [
      '#ff6b6b', '#feca57', '#48dbfb', '#ff9ff3', '#54a0ff',
      '#5f27cd', '#00d2d3', '#1dd1a1', '#ff9f43', '#ee5a24'
    ];
    
    const particleColors = colors || defaultColors;
    
    for (let i = 0; i < count; i++) {
      const color = particleColors[Math.floor(Math.random() * particleColors.length)];
      this.particles.push(this.createParticle(x, y, color));
    }
    
    if (!this.isRunning) {
      this.start();
    }
  }
  
  /**
   * Launch confetti from the center bottom
   */
  celebrate(count = 50) {
    const x = this.canvas.width / 2;
    const y = this.canvas.height;
    this.burst(x, y, count);
  }
  
  /**
   * Launch confetti from multiple points
   */
  shower(count = 100) {
    const positions = [
      { x: this.canvas.width * 0.2, y: this.canvas.height },
      { x: this.canvas.width * 0.5, y: this.canvas.height },
      { x: this.canvas.width * 0.8, y: this.canvas.height }
    ];
    
    positions.forEach(pos => {
      this.burst(pos.x, pos.y, count / positions.length);
    });
  }
  
  /**
   * Update particle physics
   */
  updateParticle(particle) {
    particle.vy += particle.gravity;
    particle.vx *= particle.friction;
    particle.vy *= particle.friction;
    
    particle.x += particle.vx;
    particle.y += particle.vy;
    
    particle.rotation += particle.rotationSpeed;
    
    // Fade out as it falls
    if (particle.y > this.canvas.height * 0.7) {
      particle.opacity -= 0.02;
    }
    
    return particle.opacity > 0 && particle.y < this.canvas.height + 50;
  }
  
  /**
   * Draw a single particle
   */
  drawParticle(particle) {
    this.ctx.save();
    this.ctx.translate(particle.x, particle.y);
    this.ctx.rotate(particle.rotation);
    this.ctx.globalAlpha = particle.opacity;
    this.ctx.fillStyle = particle.color;
    
    if (particle.shape === 'rect') {
      this.ctx.fillRect(
        -particle.width / 2,
        -particle.height / 2,
        particle.width,
        particle.height
      );
    } else {
      this.ctx.beginPath();
      this.ctx.arc(0, 0, particle.size / 2, 0, Math.PI * 2);
      this.ctx.fill();
    }
    
    this.ctx.restore();
  }
  
  /**
   * Animation loop
   */
  animate() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Update and draw particles
    this.particles = this.particles.filter(particle => {
      const alive = this.updateParticle(particle);
      if (alive) {
        this.drawParticle(particle);
      }
      return alive;
    });
    
    // Continue animation if there are particles
    if (this.particles.length > 0) {
      this.animationId = requestAnimationFrame(() => this.animate());
    } else {
      this.stop();
    }
  }
  
  /**
   * Start the animation
   */
  start() {
    if (!this.isRunning) {
      this.isRunning = true;
      this.animate();
    }
  }
  
  /**
   * Stop the animation
   */
  stop() {
    this.isRunning = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }
  
  /**
   * Clear all particles
   */
  clear() {
    this.particles = [];
    this.stop();
  }
}

// Singleton instance
let confettiInstance = null;

/**
 * Initialize confetti with canvas element
 */
export function initConfetti(canvas) {
  confettiInstance = new Confetti(canvas);
  return confettiInstance;
}

/**
 * Get the confetti instance
 */
export function getConfetti() {
  return confettiInstance;
}

/**
 * Fire confetti celebration
 */
export function celebrate(options = {}) {
  if (!confettiInstance) {
    console.warn('Confetti not initialized');
    return;
  }
  
  const { x, y, count = 40, colors } = options;
  
  if (x !== undefined && y !== undefined) {
    confettiInstance.burst(x, y, count, colors);
  } else {
    confettiInstance.celebrate(count);
  }
}

/**
 * Fire confetti shower
 */
export function shower(count = 80) {
  if (!confettiInstance) {
    console.warn('Confetti not initialized');
    return;
  }
  confettiInstance.shower(count);
}

/**
 * Clear confetti
 */
export function clearConfetti() {
  if (confettiInstance) {
    confettiInstance.clear();
  }
}

export default Confetti;
