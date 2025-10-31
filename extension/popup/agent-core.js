/**
 * Agent Mode - AI Core Animation System
 * Reactive particle-based 3D AI visualization
 */

class AICore {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.particles = [];
    this.coreRadius = 80;
    this.coreRotation = 0;
    this.pulseIntensity = 1;
    this.breathingPhase = 0;
    this.isListening = false;
    this.isSpeaking = false;
    this.audioLevel = 0;
    this.waveRipples = [];
    
    // Animation state
    this.animationId = null;
    this.isActive = false;
    
    // Core colors
    this.coreColor = { r: 0, g: 255, b: 200 }; // Cyan
    this.glowColor = { r: 0, g: 150, b: 255 }; // Blue
    
    this.initializeParticles();
    this.resize();
    
    // Handle canvas resize
    window.addEventListener('resize', () => this.resize());
  }
  
  resize() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    
    // Set default size if rect is invalid
    const width = rect.width > 0 ? rect.width : 300;
    const height = rect.height > 0 ? rect.height : 300;
    
    this.canvas.width = width;
    this.canvas.height = height;
    this.centerX = width / 2;
    this.centerY = height / 2;
  }
  
  initializeParticles() {
    this.particles = [];
    const particleCount = 200;
    
    // Core sphere particles
    for (let i = 0; i < particleCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const radius = this.coreRadius + (Math.random() - 0.5) * 20;
      
      this.particles.push({
        // 3D position
        x: radius * Math.sin(phi) * Math.cos(theta),
        y: radius * Math.sin(phi) * Math.sin(theta),
        z: radius * Math.cos(phi),
        
        // Original position (for breathing effect)
        originalRadius: radius,
        theta: theta,
        phi: phi,
        
        // Visual properties
        size: Math.random() * 2 + 1,
        opacity: Math.random() * 0.8 + 0.2,
        brightness: Math.random() * 0.5 + 0.5,
        
        // Animation
        rotationSpeed: (Math.random() - 0.5) * 0.02,
        pulsePhase: Math.random() * Math.PI * 2,
        
        // Particle type
        type: Math.random() < 0.7 ? 'core' : 'ambient'
      });
    }
    
    // Add ambient floating particles
    for (let i = 0; i < 50; i++) {
      this.particles.push({
        x: (Math.random() - 0.5) * 400,
        y: (Math.random() - 0.5) * 400,
        z: (Math.random() - 0.5) * 200,
        originalRadius: 150 + Math.random() * 100,
        theta: Math.random() * Math.PI * 2,
        phi: Math.random() * Math.PI,
        size: Math.random() * 1.5 + 0.5,
        opacity: Math.random() * 0.3 + 0.1,
        brightness: Math.random() * 0.3 + 0.1,
        rotationSpeed: (Math.random() - 0.5) * 0.005,
        pulsePhase: Math.random() * Math.PI * 2,
        type: 'ambient',
        driftSpeed: Math.random() * 0.01 + 0.005
      });
    }
  }
  
  updateParticles(deltaTime) {
    this.coreRotation += 0.008;
    this.breathingPhase += 0.02;
    
    // Update wave ripples
    this.waveRipples = this.waveRipples.filter(ripple => {
      ripple.radius += ripple.speed;
      ripple.opacity -= ripple.decay;
      return ripple.opacity > 0;
    });
    
    this.particles.forEach(particle => {
      if (particle.type === 'core') {
        // Core sphere rotation and breathing
        const breathingMultiplier = 1 + Math.sin(this.breathingPhase + particle.pulsePhase) * 0.1;
        const audioLevel = isFinite(this.audioLevel) ? Math.max(0, Math.min(1, this.audioLevel)) : 0;
        const listeningExpansion = this.isListening ? 1 + audioLevel * 0.5 : 1;
        const speakingPulse = this.isSpeaking ? 1 + Math.sin(Date.now() * 0.01) * 0.2 : 1;
        
        const radius = particle.originalRadius * breathingMultiplier * listeningExpansion * speakingPulse;
        
        // Apply rotation
        const rotatedTheta = particle.theta + this.coreRotation * particle.rotationSpeed;
        
        const newX = radius * Math.sin(particle.phi) * Math.cos(rotatedTheta);
        const newY = radius * Math.sin(particle.phi) * Math.sin(rotatedTheta);
        const newZ = radius * Math.cos(particle.phi);
        
        // Validate and assign positions
        particle.x = isFinite(newX) ? newX : 0;
        particle.y = isFinite(newY) ? newY : 0;
        particle.z = isFinite(newZ) ? newZ : 0;
        
        // Update visual properties based on state
        if (this.isSpeaking) {
          particle.brightness = Math.min(1, particle.brightness + 0.02);
          particle.opacity = Math.min(0.9, particle.opacity + 0.01);
        } else {
          particle.brightness = Math.max(0.3, particle.brightness - 0.01);
          particle.opacity = Math.max(0.2, particle.opacity - 0.005);
        }
        
      } else if (particle.type === 'ambient') {
        // Ambient particles floating motion
        particle.theta += particle.driftSpeed;
        particle.phi += particle.driftSpeed * 0.5;
        
        const radius = particle.originalRadius;
        const newX = radius * Math.sin(particle.phi) * Math.cos(particle.theta);
        const newY = radius * Math.sin(particle.phi) * Math.sin(particle.theta);
        const newZ = radius * Math.cos(particle.phi);
        
        // Validate and assign positions
        particle.x = isFinite(newX) ? newX : 0;
        particle.y = isFinite(newY) ? newY : 0;
        particle.z = isFinite(newZ) ? newZ : 0;
      }
    });
  }
  
  render() {
    let sortedParticles = [];
    
    try {
      // Clear canvas with fade effect
      this.ctx.fillStyle = 'rgba(5, 10, 20, 0.1)';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      
      // Sort particles by z-depth
      sortedParticles = [...this.particles].sort((a, b) => b.z - a.z);
      
      // Render wave ripples
      this.renderWaveRipples();
      
      // Render particles
      sortedParticles.forEach(particle => {
        try {
          this.renderParticle(particle);
        } catch (error) {
          console.warn('Error rendering particle:', error);
        }
      });
      
      // Render core glow
      this.renderCoreGlow();
      
      // Render connections between nearby particles
      this.renderConnections(sortedParticles);
      
    } catch (error) {
      console.error('Render error:', error);
    }
  }
  
  renderParticle(particle) {
    const screenX = this.centerX + particle.x;
    const screenY = this.centerY + particle.y;
    
    // Validate coordinates
    if (!isFinite(screenX) || !isFinite(screenY)) return;
    
    // Z-depth affects size and opacity
    const zFactor = Math.max(0.1, Math.min(2, (particle.z + 200) / 400));
    const size = Math.max(0.5, particle.size * zFactor);
    const opacity = Math.max(0, Math.min(1, particle.opacity * zFactor));
    
    if (opacity <= 0 || size <= 0) return;
    
    this.ctx.save();
    
    // Create particle glow with validated values
    const glowRadius = Math.max(1, size * 3);
    const gradient = this.ctx.createRadialGradient(screenX, screenY, 0, screenX, screenY, glowRadius);
    
    if (particle.type === 'core') {
      const intensity = this.isSpeaking ? particle.brightness * 1.5 : particle.brightness;
      gradient.addColorStop(0, `rgba(${this.coreColor.r}, ${this.coreColor.g}, ${this.coreColor.b}, ${opacity * intensity})`);
      gradient.addColorStop(0.3, `rgba(${this.glowColor.r}, ${this.glowColor.g}, ${this.glowColor.b}, ${opacity * intensity * 0.6})`);
      gradient.addColorStop(1, `rgba(${this.glowColor.r}, ${this.glowColor.g}, ${this.glowColor.b}, 0)`);
    } else {
      gradient.addColorStop(0, `rgba(100, 200, 255, ${opacity})`);
      gradient.addColorStop(0.5, `rgba(50, 150, 255, ${opacity * 0.5})`);
      gradient.addColorStop(1, `rgba(0, 100, 255, 0)`);
    }
    
    this.ctx.fillStyle = gradient;
    this.ctx.beginPath();
    this.ctx.arc(screenX, screenY, size * 2, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Core particle
    this.ctx.fillStyle = particle.type === 'core' 
      ? `rgba(255, 255, 255, ${opacity * 0.8})` 
      : `rgba(200, 230, 255, ${opacity * 0.6})`;
    this.ctx.beginPath();
    this.ctx.arc(screenX, screenY, size, 0, Math.PI * 2);
    this.ctx.fill();
    
    this.ctx.restore();
  }
  
  renderCoreGlow() {
    if (!this.isSpeaking && !this.isListening) return;
    
    const glowRadius = this.coreRadius * (this.isSpeaking ? 1.5 : 1.2);
    const glowIntensity = this.isSpeaking ? 0.3 : 0.1;
    
    this.ctx.save();
    const gradient = this.ctx.createRadialGradient(
      this.centerX, this.centerY, 0,
      this.centerX, this.centerY, glowRadius
    );
    
    gradient.addColorStop(0, `rgba(${this.coreColor.r}, ${this.coreColor.g}, ${this.coreColor.b}, ${glowIntensity})`);
    gradient.addColorStop(0.7, `rgba(${this.glowColor.r}, ${this.glowColor.g}, ${this.glowColor.b}, ${glowIntensity * 0.5})`);
    gradient.addColorStop(1, 'rgba(0, 100, 255, 0)');
    
    this.ctx.fillStyle = gradient;
    this.ctx.beginPath();
    this.ctx.arc(this.centerX, this.centerY, glowRadius, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.restore();
  }
  
  renderConnections(particles) {
    const maxDistance = 60;
    const coreParticles = particles.filter(p => p.type === 'core');
    
    this.ctx.save();
    this.ctx.globalCompositeOperation = 'lighter';
    
    for (let i = 0; i < coreParticles.length; i++) {
      for (let j = i + 1; j < coreParticles.length; j++) {
        const p1 = coreParticles[i];
        const p2 = coreParticles[j];
        
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        const dz = p1.z - p2.z;
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
        
        if (distance < maxDistance) {
          const opacity = (1 - distance / maxDistance) * 0.1;
          
          this.ctx.strokeStyle = `rgba(0, 200, 255, ${opacity})`;
          this.ctx.lineWidth = 0.5;
          this.ctx.beginPath();
          this.ctx.moveTo(this.centerX + p1.x, this.centerY + p1.y);
          this.ctx.lineTo(this.centerX + p2.x, this.centerY + p2.y);
          this.ctx.stroke();
        }
      }
    }
    
    this.ctx.restore();
  }
  
  renderWaveRipples() {
    this.ctx.save();
    this.ctx.globalCompositeOperation = 'lighter';
    
    this.waveRipples.forEach(ripple => {
      this.ctx.strokeStyle = `rgba(0, 255, 200, ${ripple.opacity})`;
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.arc(this.centerX, this.centerY, ripple.radius, 0, Math.PI * 2);
      this.ctx.stroke();
    });
    
    this.ctx.restore();
  }
  
  // Animation control methods
  start() {
    if (this.isActive) return;
    
    this.isActive = true;
    this.animate();
  }
  
  stop() {
    this.isActive = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }
  
  animate() {
    if (!this.isActive) return;
    
    this.updateParticles();
    this.render();
    
    this.animationId = requestAnimationFrame(() => this.animate());
  }
  
  // State change methods
  setListening(listening, audioLevel = 0) {
    this.isListening = listening;
    this.audioLevel = audioLevel;
    
    if (listening && audioLevel > 0.1) {
      // Create expanding wave ripple
      this.waveRipples.push({
        radius: 20,
        speed: 3 + audioLevel * 2,
        opacity: 0.6,
        decay: 0.02
      });
    }
  }
  
  setSpeaking(speaking) {
    this.isSpeaking = speaking;
    
    if (speaking) {
      // Boost core intensity
      this.particles.forEach(particle => {
        if (particle.type === 'core') {
          particle.brightness = Math.min(1, particle.brightness * 1.5);
        }
      });
    }
  }
  
  // Visual effect triggers
  triggerVoiceWave(intensity = 0.5) {
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        this.waveRipples.push({
          radius: 30 + i * 10,
          speed: 2 + intensity,
          opacity: 0.4,
          decay: 0.015
        });
      }, i * 100);
    }
  }
  
  triggerSpeakingPulse() {
    this.particles.forEach(particle => {
      if (particle.type === 'core' && Math.random() < 0.3) {
        particle.brightness = Math.min(1, particle.brightness + 0.3);
        particle.size = Math.min(3, particle.size + 0.5);
      }
    });
  }
}

// Export for use in popup.js
window.AICore = AICore;