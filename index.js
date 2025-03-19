// @ts-check

document.addEventListener('DOMContentLoaded', () => {
  console.log('loaded');

  /** @type {HTMLCanvasElement} */
  const canvas = /** @type {HTMLCanvasElement} */ (
    document.getElementById('canvas')
  );

  if (!canvas) {
    console.error('Canvas element not found');
    return;
  }

  // Get the 2D context with better quality settings
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    console.error('Could not get 2D context from canvas');
    return;
  }

  // Enable high quality image smoothing
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Create logo instance - initial position will be updated in resizeCanvas
  const logo = new CanvasImage(
    'LOGO-SPORTMAGIA.svg', // Using SVG instead of PNG
    0, // Will be set properly in resizeCanvas
    0 // Will be set properly in resizeCanvas
  );

  // Animation state variables
  /** @type {number|null} */
  let animationFrameId = null;
  /** @type {number|null} */
  let lastTimestamp = null;

  // Motion state - 40 degree angle
  const angle = 40 * (Math.PI / 180); // Convert 40 degrees to radians
  const speed = 200; // Pixels per second

  // Velocity components
  let velocityX = Math.cos(angle) * speed;
  let velocityY = Math.sin(angle) * speed;

  // Create glow button
  const addGlowButton = () => {
    const button = document.createElement('button');
    button.textContent = 'Make Logo Glow';
    button.style.position = 'fixed';
    button.style.bottom = '20px';
    button.style.left = '20px';
    button.style.padding = '10px 20px';
    button.style.backgroundColor = '#4CAF50';
    button.style.color = 'white';
    button.style.border = 'none';
    button.style.borderRadius = '4px';
    button.style.cursor = 'pointer';
    button.style.zIndex = '1000';
    button.style.boxShadow = '0 2px 5px rgba(0,0,0,0.3)';

    button.addEventListener('click', () => {
      logo.startGlowEffect(5000); // Glow for 5000ms (5 seconds)
    });

    document.body.appendChild(button);
  };

  /**
   * Animate the logo moving at an angle and bouncing off all edges
   * @param {number} timestamp - Current timestamp from requestAnimationFrame
   */
  const animateLogo = (timestamp) => {
    // Calculate time delta
    if (!lastTimestamp) lastTimestamp = timestamp;
    const deltaTime = (timestamp - lastTimestamp) / 1000; // Convert to seconds
    lastTimestamp = timestamp;

    if (!logo.isDragging) {
      // Get the canvas bounds
      const canvasWidth = canvas.width / window.devicePixelRatio;
      const canvasHeight = canvas.height / window.devicePixelRatio;

      // Calculate logo bounds
      const logoHalfWidth = (logo.width * logo.scale) / 2;
      const logoHalfHeight = (logo.height * logo.scale) / 2;

      // Bounds for collision
      const leftBound = logoHalfWidth;
      const rightBound = canvasWidth - logoHalfWidth;
      const topBound = logoHalfHeight;
      const bottomBound = canvasHeight - logoHalfHeight;

      // Calculate new position
      let newX = logo.x + velocityX * deltaTime;
      let newY = logo.y + velocityY * deltaTime;

      // Track if we hit horizontal and vertical bounds in this frame
      let hitHorizontal = false;
      let hitVertical = false;

      // Store previous velocity to detect direction changes
      const prevVelocityX = velocityX;
      const prevVelocityY = velocityY;

      // Check for collision with horizontal edges and bounce
      if (newX <= leftBound) {
        newX = leftBound;
        velocityX = Math.abs(velocityX); // Bounce right
        hitHorizontal = prevVelocityX < 0; // Only count it if we were moving toward this edge
      } else if (newX >= rightBound) {
        newX = rightBound;
        velocityX = -Math.abs(velocityX); // Bounce left
        hitHorizontal = prevVelocityX > 0; // Only count it if we were moving toward this edge
      }

      // Check for collision with vertical edges and bounce
      if (newY <= topBound) {
        newY = topBound;
        velocityY = Math.abs(velocityY); // Bounce down
        hitVertical = prevVelocityY < 0; // Only count it if we were moving toward this edge
      } else if (newY >= bottomBound) {
        newY = bottomBound;
        velocityY = -Math.abs(velocityY); // Bounce up
        hitVertical = prevVelocityY > 0; // Only count it if we were moving toward this edge
      }

      // If we hit both horizontal and vertical bounds in the same frame, we hit a corner
      if (hitHorizontal && hitVertical && !logo.isGlowing) {
        // Determine which corner was hit
        let cornerName = '';
        if (newX <= leftBound && newY <= topBound) cornerName = 'top-left';
        else if (newX >= rightBound && newY <= topBound)
          cornerName = 'top-right';
        else if (newX <= leftBound && newY >= bottomBound)
          cornerName = 'bottom-left';
        else if (newX >= rightBound && newY >= bottomBound)
          cornerName = 'bottom-right';

        console.log(`Hit ${cornerName} corner!`);
        logo.startGlowEffect(5000); // Glow for 5 seconds when hitting a corner
      }

      // Update logo position
      logo.setPosition(newX, newY);
    } else {
      // If being dragged, we'll handle new velocity on drag end
    }

    // Update glow effect if active
    logo.updateGlowEffect(timestamp);

    // Redraw the scene
    drawScene();

    // Continue animation loop
    animationFrameId = requestAnimationFrame(animateLogo);
  };

  /**
   * Reset velocity after drag to maintain the 40-degree angle but in appropriate direction
   */
  const resetVelocityAfterDrag = () => {
    // Get canvas dimensions
    const canvasWidth = canvas.width / window.devicePixelRatio;
    const canvasHeight = canvas.height / window.devicePixelRatio;

    // Determine direction based on position in the canvas
    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;

    // The x and y components of direction
    const dirX = logo.x < centerX ? 1 : -1;
    const dirY = logo.y < centerY ? 1 : -1;

    // Set velocity at 40-degree angle in the correct direction
    velocityX = dirX * Math.abs(Math.cos(angle) * speed);
    velocityY = dirY * Math.abs(Math.sin(angle) * speed);
  };

  // Function to resize canvas and redraw
  const resizeCanvas = () => {
    // Get display size
    const displayWidth = canvas.clientWidth;
    const displayHeight = canvas.clientHeight;

    // Calculate device pixel ratio for high-DPI displays
    const dpr = window.devicePixelRatio || 1;

    // Set canvas size accounting for device pixel ratio
    canvas.width = Math.floor(displayWidth * dpr);
    canvas.height = Math.floor(displayHeight * dpr);

    // Scale all drawing operations by the dpr
    ctx.scale(dpr, dpr);

    // Set the CSS size of the canvas
    canvas.style.width = `${displayWidth}px`;
    canvas.style.height = `${displayHeight}px`;

    // Reset image smoothing after resize
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Center the logo on the canvas
    logo.setPosition(displayWidth / 2, displayHeight / 2);

    // Redraw scene after resize
    drawScene();
  };

  // Draw the complete scene
  const drawScene = () => {
    // Clear canvas
    ctx.clearRect(
      0,
      0,
      canvas.width / window.devicePixelRatio,
      canvas.height / window.devicePixelRatio
    );

    // Draw the logo
    logo.draw(ctx);
  };

  // Set up callback for when logo is loaded
  logo.setOnLoadCallback(() => {
    drawScene();

    // Add the glow button
    addGlowButton();

    // Start the animation immediately after the logo is loaded
    animationFrameId = requestAnimationFrame(animateLogo);
  });

  // Initial resize
  resizeCanvas();

  // Event listeners for logo manipulation
  canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    logo.startDrag(mouseX, mouseY);
  });

  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    logo.drag(mouseX, mouseY);
  });

  canvas.addEventListener('mouseup', () => {
    // When drag ends, reset velocity for proper 40-degree motion
    if (logo.isDragging) {
      resetVelocityAfterDrag();
    }
    logo.stopDrag();
  });

  canvas.addEventListener('wheel', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (logo.adjustScale(e.deltaY, mouseX, mouseY)) {
      e.preventDefault();
    }
  });

  console.log(canvas.width, canvas.height);

  // Handle window resizing
  window.addEventListener('resize', resizeCanvas);
});

/**
 * Class representing a draggable and scalable image on canvas
 */
class CanvasImage {
  /**
   * @param {string} src - Path to the image
   * @param {number} x - Initial x position
   * @param {number} y - Initial y position
   * @param {number} [scale=1.0] - Initial scale
   */
  constructor(src, x, y, scale = 1.0) {
    this.x = x;
    this.y = y;
    this.width = 0;
    this.height = 0;
    this.scale = scale;
    this.isDragging = false;
    this.dragOffsetX = 0;
    this.dragOffsetY = 0;

    // Glow effect properties
    this.isGlowing = false;
    this.glowStartTime = 0;
    this.glowDuration = 0;
    this.glowIntensity = 0;
    this.maxGlowIntensity = 30; // Maximum glow size in pixels

    // Create and load the image
    this.image = new Image();
    // Set cross-origin to anonymous for potential CORS issues with SVGs
    this.image.crossOrigin = 'anonymous';
    this.image.src = src;

    // Set natural dimensions once loaded
    this.image.onload = () => {
      this.width = this.image.naturalWidth;
      this.height = this.image.naturalHeight;
      if (this.onLoadCallback) {
        this.onLoadCallback();
      }
    };
  }

  /**
   * Start a glow effect that lasts for a specific duration
   * @param {number} duration - Duration of the glow effect in milliseconds
   * @returns {CanvasImage} - This instance for method chaining
   */
  startGlowEffect(duration = 5000) {
    this.isGlowing = true;
    this.glowStartTime = performance.now();
    this.glowDuration = duration;
    this.glowIntensity = this.maxGlowIntensity;
    return this;
  }

  /**
   * Update the glow effect based on elapsed time
   * @param {number} currentTime - Current timestamp
   * @returns {boolean} - Whether the glow effect is still active
   */
  updateGlowEffect(currentTime) {
    if (!this.isGlowing) return false;

    const elapsedTime = currentTime - this.glowStartTime;

    // Check if the glow effect duration has expired
    if (elapsedTime >= this.glowDuration) {
      this.isGlowing = false;
      this.glowIntensity = 0;
      return false;
    }

    // Calculate glow intensity based on time
    // Ramp up quickly, then slowly decrease
    if (elapsedTime < 500) {
      // Ramp up during first 500ms
      this.glowIntensity = (elapsedTime / 500) * this.maxGlowIntensity;
    } else if (elapsedTime > this.glowDuration - 1000) {
      // Fade out during last 1000ms
      const fadeProgress = (this.glowDuration - elapsedTime) / 1000;
      this.glowIntensity = fadeProgress * this.maxGlowIntensity;
    } else {
      // Maximum glow intensity in the middle
      this.glowIntensity = this.maxGlowIntensity;
    }

    return true;
  }

  /**
   * Draw the image on the canvas
   * @param {CanvasRenderingContext2D} ctx - The canvas context to draw on
   * @returns {CanvasImage} - This instance for method chaining
   */
  draw(ctx) {
    if (this.image.complete && this.width > 0) {
      // Save current state
      ctx.save();

      // Apply high quality transformations
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Use subpixel positioning for smoother rendering
      const x = Math.round(this.x - (this.width * this.scale) / 2) + 0.5;
      const y = Math.round(this.y - (this.height * this.scale) / 2) + 0.5;
      const width = Math.round(this.width * this.scale);
      const height = Math.round(this.height * this.scale);

      // Draw glow effect if active
      if (this.isGlowing && this.glowIntensity > 0) {
        const glowSize = this.glowIntensity;
        const glowX = x - glowSize;
        const glowY = y - glowSize;
        const glowWidth = width + glowSize * 2;
        const glowHeight = height + glowSize * 2;

        // Create radial gradient for glow
        const gradient = ctx.createRadialGradient(
          this.x,
          this.y,
          0,
          this.x,
          this.y,
          Math.max(width, height) / 1.5 + glowSize
        );

        gradient.addColorStop(0, 'rgba(255, 215, 0, 0.9)'); // Gold center
        gradient.addColorStop(0.7, 'rgba(255, 140, 0, 0.6)'); // Orange middle
        gradient.addColorStop(1, 'rgba(255, 69, 0, 0)'); // Transparent outer

        // Draw glow
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(
          this.x,
          this.y,
          Math.max(width, height) / 1.5 + glowSize,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }

      // Draw the image
      ctx.drawImage(this.image, x, y, width, height);

      // Restore previous state
      ctx.restore();
    }
    return this;
  }

  /**
   * Set the position of the image
   * @param {number} x - The new x position
   * @param {number} y - The new y position
   * @returns {CanvasImage} - This instance for method chaining
   */
  setPosition(x, y) {
    this.x = x;
    this.y = y;
    return this;
  }

  /**
   * Set callback for when image is loaded
   * @param {Function} callback
   * @returns {CanvasImage} - This instance for method chaining
   */
  setOnLoadCallback(callback) {
    this.onLoadCallback = callback;
    // If image is already loaded, call callback immediately
    if (this.image.complete && this.width > 0) {
      callback();
    }
    return this;
  }

  /**
   * Check if a point is inside the image
   * @param {number} x - The x coordinate to check
   * @param {number} y - The y coordinate to check
   * @returns {boolean} - Whether the point is inside the image
   */
  isPointInside(x, y) {
    const halfWidth = (this.width * this.scale) / 2;
    const halfHeight = (this.height * this.scale) / 2;
    return (
      x >= this.x - halfWidth &&
      x <= this.x + halfWidth &&
      y >= this.y - halfHeight &&
      y <= this.y + halfHeight
    );
  }

  /**
   * Start dragging the image
   * @param {number} mouseX - Mouse x position
   * @param {number} mouseY - Mouse y position
   * @returns {boolean} - Whether dragging started
   */
  startDrag(mouseX, mouseY) {
    if (this.isPointInside(mouseX, mouseY)) {
      this.isDragging = true;
      this.dragOffsetX = mouseX - this.x;
      this.dragOffsetY = mouseY - this.y;
      return true;
    }
    return false;
  }

  /**
   * Update position during drag
   * @param {number} mouseX - Mouse x position
   * @param {number} mouseY - Mouse y position
   * @returns {boolean} - Whether the position was updated
   */
  drag(mouseX, mouseY) {
    if (this.isDragging) {
      this.x = mouseX - this.dragOffsetX;
      this.y = mouseY - this.dragOffsetY;
      return true;
    }
    return false;
  }

  /**
   * Stop dragging
   * @returns {CanvasImage} - This instance for method chaining
   */
  stopDrag() {
    this.isDragging = false;
    return this;
  }

  /**
   * Adjust scale of the image
   * @param {number} delta - Amount to adjust scale by
   * @param {number} mouseX - Mouse x position for hit testing
   * @param {number} mouseY - Mouse y position for hit testing
   * @returns {boolean} - Whether scale was adjusted
   */
  adjustScale(delta, mouseX, mouseY) {
    if (this.isPointInside(mouseX, mouseY)) {
      // Adjust scale based on delta
      this.scale += delta > 0 ? -0.1 : 0.1;
      // Limit minimum and maximum scale
      this.scale = Math.max(0.2, Math.min(3.0, this.scale));
      return true;
    }
    return false;
  }
}
