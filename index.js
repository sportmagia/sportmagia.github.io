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

  // Debug mode - true by default on localhost, false otherwise
  let isDebugMode =
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname === '';

  // FPS counter variables
  let frameCount = 0;
  let lastFpsUpdateTime = 0;
  let currentFps = 0;
  const fpsUpdateInterval = 500; // Update FPS display every 500ms

  // Create logo instance - initial position will be updated in resizeCanvas
  const logo = new CanvasImage(
    'LOGO-SPORTMAGIA.svg', // Using SVG instead of PNG
    0, // Will be set properly in resizeCanvas
    0, // Will be set properly in resizeCanvas
    1.0, // Default scale
    { relativeWidth: 0.2, minWidth: 200 } // Default options
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

  // Reference to the glow button
  /** @type {HTMLButtonElement|null} */
  let glowButton = null;

  /**
   * Create debug toggle button
   */
  const addDebugButton = () => {
    const button = document.createElement('button');
    button.id = 'debug-toggle';
    button.innerHTML = '🛠️'; // Wrench/tool emoji as debug icon
    button.style.position = 'fixed';
    button.style.top = '10px';
    button.style.left = '10px';
    button.style.width = '30px';
    button.style.height = '30px';
    button.style.padding = '0';
    button.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    button.style.color = 'white';
    button.style.border = '1px solid white';
    button.style.borderRadius = '4px';
    button.style.cursor = 'pointer';
    button.style.zIndex = '1000';
    button.style.fontSize = '16px';
    button.style.display = 'flex';
    button.style.alignItems = 'center';
    button.style.justifyContent = 'center';
    button.title = 'Toggle Debug Mode';

    button.addEventListener('click', toggleDebugMode);

    document.body.appendChild(button);
  };

  /**
   * Toggle debug mode on/off
   */
  const toggleDebugMode = () => {
    isDebugMode = !isDebugMode;
    updateDebugElements();
    console.log(`Debug mode: ${isDebugMode ? 'ON' : 'OFF'}`);
  };

  /**
   * Update visibility of debug elements based on debug mode
   */
  const updateDebugElements = () => {
    // Handle glow button visibility
    if (glowButton) {
      glowButton.style.display = isDebugMode ? 'block' : 'none';
    }

    // No need to update FPS visibility as it's handled in drawScene
  };

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
    button.style.display = isDebugMode ? 'block' : 'none'; // Initially based on debug mode

    button.addEventListener('click', () => {
      logo.startGlowEffect(5000); // Glow for 5000ms (5 seconds)
    });

    document.body.appendChild(button);
    glowButton = button; // Store reference
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

    // Update FPS counter
    frameCount++;
    if (timestamp - lastFpsUpdateTime >= fpsUpdateInterval) {
      // Calculate FPS: frames / seconds
      currentFps = Math.round(
        (frameCount * 1000) / (timestamp - lastFpsUpdateTime)
      );
      frameCount = 0;
      lastFpsUpdateTime = timestamp;
    }

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
    // Get display size from the container (window size)
    const displayWidth = window.innerWidth;
    const displayHeight = window.innerHeight;

    // Calculate device pixel ratio for high-DPI displays
    const dpr = window.devicePixelRatio || 1;

    // Update canvas size to match window size (with proper DPI scaling)
    canvas.width = Math.floor(displayWidth * dpr);
    canvas.height = Math.floor(displayHeight * dpr);

    // Reset context state since changing canvas dimensions resets the context
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    // Scale all drawing operations by the dpr
    ctx.scale(dpr, dpr);

    // Set the CSS size of the canvas
    canvas.style.width = `${displayWidth}px`;
    canvas.style.height = `${displayHeight}px`;

    // Reset image smoothing after resize
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Update logo size based on canvas width (maintaining proportions)
    logo.updateSize(displayWidth);

    // Center the logo on the canvas
    logo.setPosition(displayWidth / 2, displayHeight / 2);

    // Redraw scene after resize
    drawScene();

    console.log(
      `Canvas resized to ${displayWidth}x${displayHeight} (DPR: ${dpr}), Logo scale: ${logo.scale.toFixed(
        2
      )}`
    );
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

    // Draw FPS counter if debug mode is enabled
    if (isDebugMode) {
      drawFpsCounter();
    }
  };

  /**
   * Draw the FPS counter in the top-right corner
   */
  const drawFpsCounter = () => {
    const padding = 10;
    const displayWidth = canvas.width / window.devicePixelRatio;

    ctx.save();

    // Set font and style for FPS counter
    ctx.font = '16px Arial';
    ctx.fillStyle = 'lime';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';

    // Draw FPS text with background for better visibility
    const fpsText = `${currentFps} FPS`;
    const textMetrics = ctx.measureText(fpsText);
    const textHeight = 20; // Approximate height

    // Draw semi-transparent background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(
      displayWidth - textMetrics.width - padding * 2,
      padding,
      textMetrics.width + padding * 2,
      textHeight + padding
    );

    // Draw text
    ctx.fillStyle = 'lime';
    ctx.fillText(fpsText, displayWidth - padding, padding);

    ctx.restore();
  };

  // Set up callback for when logo is loaded
  logo.setOnLoadCallback(() => {
    drawScene();

    // Add debug button
    addDebugButton();

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
   * @param {Object} [options={}] - Configuration options
   * @param {number} [options.relativeWidth=0.2] - Width relative to canvas (0.0-1.0)
   * @param {number} [options.minWidth=200] - Minimum width in pixels
   */
  constructor(src, x, y, scale = 1.0, options = {}) {
    this.x = x;
    this.y = y;
    this.width = 0;
    this.height = 0;
    this.scale = scale;
    this.naturalWidth = 0;
    this.naturalHeight = 0;
    this.aspectRatio = 1;
    this.isDragging = false;
    this.dragOffsetX = 0;
    this.dragOffsetY = 0;

    // Size configuration
    this.relativeWidth =
      options.relativeWidth !== undefined ? options.relativeWidth : 0.2;
    this.minWidth = options.minWidth !== undefined ? options.minWidth : 200;

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
      this.naturalWidth = this.image.naturalWidth;
      this.naturalHeight = this.image.naturalHeight;
      this.aspectRatio = this.naturalWidth / this.naturalHeight;
      this.width = this.naturalWidth;
      this.height = this.naturalHeight;
      if (this.onLoadCallback) {
        this.onLoadCallback();
      }
    };
  }

  /**
   * Update the image size based on canvas width
   * @param {number} canvasWidth - Width of the canvas in pixels
   * @returns {CanvasImage} - This instance for method chaining
   */
  updateSize(canvasWidth) {
    // Calculate target width based on relative width (percentage of canvas)
    let targetWidth = canvasWidth * this.relativeWidth;

    // Ensure minimum width
    targetWidth = Math.max(targetWidth, this.minWidth);

    // Calculate scale factor based on natural dimensions
    if (this.naturalWidth > 0) {
      // Set scale to achieve target width
      this.scale = targetWidth / this.naturalWidth;

      // Update width and height
      this.width = this.naturalWidth;
      this.height = this.naturalHeight;
    }

    return this;
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
    if (this.image.complete && this.naturalWidth > 0) {
      // Save current state
      ctx.save();

      // Apply high quality transformations
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Calculate scaled dimensions
      const scaledWidth = this.naturalWidth * this.scale;
      const scaledHeight = this.naturalHeight * this.scale;

      // Use subpixel positioning for smoother rendering
      const x = Math.round(this.x - scaledWidth / 2) + 0.5;
      const y = Math.round(this.y - scaledHeight / 2) + 0.5;

      // Round scaled dimensions for pixel-perfect rendering
      const width = Math.round(scaledWidth);
      const height = Math.round(scaledHeight);

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
    // Calculate scaled dimensions
    const scaledWidth = this.naturalWidth * this.scale;
    const scaledHeight = this.naturalHeight * this.scale;

    // Use half the scaled dimensions for boundary calculations
    const halfWidth = scaledWidth / 2;
    const halfHeight = scaledHeight / 2;

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
