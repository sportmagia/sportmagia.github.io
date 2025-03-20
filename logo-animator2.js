// @ts-check

import debounce from './debounce.js';
import LogoDebugger from './logo-debugger.js';

/**
 * @typedef {Object} LogoDimensions
 * @property {number} width - Logo width
 * @property {number} height - Logo height
 * @property {number} leftBound - Left boundary for animation
 * @property {number} rightBound - Right boundary for animation
 * @property {number} topBound - Top boundary for animation
 * @property {number} bottomBound - Bottom boundary for animation
 */

/**
 * @typedef {((...args: any[]) => void) & { cancel: () => void }} DebouncedFunction
 */

/**
 * Class to handle logo animation and related functionality using requestAnimationFrame
 */
class LogoAnimator2 {
  /**
   * @param {string} logoId - The ID of the logo element
   * @param {Object} options - Configuration options
   * @param {number} [options.angle=40] - Angle in degrees
   * @param {number} [options.speed=300] - Speed in pixels per second
   * @param {boolean} [options.debug=false] - Enable debug mode
   */
  constructor(logoId, options = {}) {
    const { angle = 40, speed = 300, debug = false } = options;

    // DOM elements
    this.logo = document.getElementById(logoId);
    this.body = document.body;

    if (!this.logo) {
      throw new Error(`Logo element with ID "${logoId}" not found`);
    }

    // Physics settings
    this.angle = angle * (Math.PI / 180);
    this.speed = speed;

    // Cached dimensions
    /** @type {LogoDimensions|null} */
    this.logoDimensions = null;

    // Position tracking
    this.currentX = 0;
    this.currentY = 0;

    this.updateCSSVariables();

    // Animation state
    this.isAnimating = false;
    /** @type {number|null} */
    this.animationFrameId = null;
    this.lastFrameTime = 0;

    // Debug setup
    this.debugger = debug
      ? new LogoDebugger(this.logo, {
          enabledByDefault:
            window.location.hostname === 'localhost' ||
            window.location.hostname === '127.0.0.1' ||
            window.location.hostname === '',
        })
      : null;

    /** @type {DebouncedFunction} */
    this.debouncedResize = /** @type {DebouncedFunction} */ (
      debounce(() => {
        this.initializeLogoDimensions();
        if (this.debugger) {
          this.debugger.log(
            `Viewport resized: ${window.innerWidth}x${window.innerHeight}`
          );
        }
      }, 250)
    );

    // Bind methods
    this.initializeLogoDimensions = this.initializeLogoDimensions.bind(this);
    this.handleResize = this.handleResize.bind(this);
    this.mainLoop = this.mainLoop.bind(this);
  }

  /**
   * Update cached logo dimensions and boundaries
   * @private
   */
  updateLogoDimensionsAndBounds() {
    console.log('updateLogoDimensionsAndBounds');

    const logoRect = this.logo.getBoundingClientRect();

    this.logoDimensions = {
      width: logoRect.width,
      height: logoRect.height,
      leftBound: this.topEnd() + logoRect.width / 2,
      rightBound: this.bottomEnd() - logoRect.width / 2,
      topBound: this.leftEnd() + logoRect.height / 2,
      bottomBound: this.rightEnd() - logoRect.height / 2,
    };

    if (this.debugger) {
      this.debugger.updateDimensions({
        width: logoRect.width,
        height: logoRect.height,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
      });
    }
  }

  /**
   * Update logo dimensions and position
   */
  initializeLogoDimensions() {
    const baseWidth = Math.max(window.innerWidth * 0.2, 200);
    this.logo.style.width = `${baseWidth}px`;
    this.logo.style.position = 'absolute';
    this.logo.style.left = '50vw';
    this.logo.style.top = '50vh';
  }

  /**
   * Convert window coordinates to normalized coordinates (0,0 at center)
   * @param {number} x - Window X coordinate
   * @param {number} y - Window Y coordinate
   * @returns {{x: number, y: number}} Normalized coordinates
   */
  windowToNormalized(x, y) {
    return {
      x: x - window.innerWidth / 2,
      y: y - window.innerHeight / 2,
    };
  }

  /**
   * Convert normalized coordinates to window coordinates
   * @param {number} x - Normalized X coordinate
   * @param {number} y - Normalized Y coordinate
   * @returns {{x: number, y: number}} Window coordinates
   */
  normalizedToWindow(x, y) {
    return {
      x: x + window.innerWidth / 2,
      y: y + window.innerHeight / 2,
    };
  }

  bottomEnd = () => window.innerWidth / 2;
  topEnd = () => -this.bottomEnd();
  rightEnd = () => window.innerHeight / 2;
  leftEnd = () => -this.rightEnd();

  // Target positions in normalized coordinates
  targetX = () => {
    // Calculate how far we need to go to hit the border
    const dx = Math.cos(this.angle);
    const dy = Math.sin(this.angle);

    // Find intersection with vertical borders
    let tx = dx > 0 ? this.bottomEnd() : this.topEnd();
    let ty = this.currentY + (dy * (tx - this.currentX)) / dx;

    // If we hit horizontal borders first, recalculate
    if (ty > this.rightEnd() || ty < this.leftEnd()) {
      ty = dy > 0 ? this.rightEnd() : this.leftEnd();
      tx = this.currentX + (dx * (ty - this.currentY)) / dy;
    }

    return tx;
  };

  targetY = () => {
    // Calculate how far we need to go to hit the border
    const dx = Math.cos(this.angle);
    const dy = Math.sin(this.angle);

    // Find intersection with vertical borders
    let tx = dx > 0 ? this.bottomEnd() : this.topEnd();
    let ty = this.currentY + (dy * (tx - this.currentX)) / dx;

    // If we hit horizontal borders first, recalculate
    if (ty > this.rightEnd() || ty < this.leftEnd()) {
      ty = dy > 0 ? this.rightEnd() : this.leftEnd();
      tx = this.currentX + (dx * (ty - this.currentY)) / dy;
    }

    return ty;
  };

  /**
   * Update CSS variables for animation
   * @private
   */
  updateCSSVariables() {
    this.logo.classList.remove('animate');

    // Convert normalized coordinates to window coordinates for CSS
    const startPos = this.normalizedToWindow(this.currentX, this.currentY);
    const targetPos = this.normalizedToWindow(this.targetX(), this.targetY());
    console.log(
      { startPos, targetPos },
      this.currentX,
      this.currentY,
      this.targetX(),
      this.targetY()
    );

    document.documentElement.style.setProperty('--start-x', `${startPos.x}px`);
    document.documentElement.style.setProperty('--start-y', `${startPos.y}px`);
    document.documentElement.style.setProperty(
      '--target-x',
      `${targetPos.x}px`
    );
    document.documentElement.style.setProperty(
      '--target-y',
      `${targetPos.y}px`
    );

    void this.logo.offsetWidth;
    this.logo.classList.add('animate');
  }

  /**
   * Main animation loop using requestAnimationFrame
   * @param {number} timestamp - Current frame timestamp
   */
  mainLoop(timestamp) {
    if (!this.isAnimating) return;

    const deltaTime = (timestamp - this.lastFrameTime) / 1000;
    this.lastFrameTime = timestamp;

    // Get current position from computed style and convert to normalized coordinates
    const computedStyle = window.getComputedStyle(this.logo);
    const windowX = parseFloat(computedStyle.left) || window.innerWidth / 2;
    const windowY = parseFloat(computedStyle.top) || window.innerHeight / 2;
    const normalized = this.windowToNormalized(windowX, windowY);

    this.currentX = normalized.x;
    this.currentY = normalized.y;

    // Get logo center position in window coordinates for debugging
    const logoRect = this.logo.getBoundingClientRect();
    const centerX = logoRect.left + logoRect.width / 2;
    const centerY = logoRect.top + logoRect.height / 2;

    // Check for collisions using normalized coordinates
    if (!this.logoDimensions) this.updateLogoDimensionsAndBounds();

    const dimensions = /** @type {LogoDimensions} */ (this.logoDimensions);
    const halfWidth = dimensions.width / 2;
    const halfHeight = dimensions.height / 2;

    // Detect wall hits in normalized coordinates
    const hitLeft = this.currentX - halfWidth <= this.topEnd();
    const hitRight = this.currentX + halfWidth >= this.bottomEnd();
    const hitTop = this.currentY - halfHeight <= this.leftEnd();
    const hitBottom = this.currentY + halfHeight >= this.rightEnd();

    // Handle wall collisions
    if (hitLeft || hitRight) {
      this.velocityX = -this.velocityX;
      this.angle = Math.PI - this.angle;
      if (this.angle < 0) this.angle += 2 * Math.PI;
    }

    if (hitTop || hitBottom) {
      this.angle = -this.angle;
      if (this.angle < 0) this.angle += 2 * Math.PI;
    }

    const hit = hitLeft || hitRight || hitTop || hitBottom;
    if (hit) {
      this.updateCSSVariables();
      console.log({ hitLeft, hitRight, hitTop, hitBottom });
    }

    // Handle corner hits
    const hitCorner = (hitLeft || hitRight) && (hitTop || hitBottom);
    if (hitCorner) {
      if (this.debugger) {
        this.debugger.log(
          `Corner hit detected! ${hitLeft}-${hitRight}-${hitTop}-${hitBottom}`
        );
      }
      this.toggleGlow(2000);
    }

    // Debug logging
    if (this.debugger) {
      if (hit) {
        this.debugger.log(
          `Collision detected: ${[
            hitLeft && 'left',
            hitRight && 'right',
            hitTop && 'top',
            hitBottom && 'bottom',
          ]
            .filter(Boolean)
            .join(', ')}`
        );
      }

      // Convert normalized coordinates to window coordinates for debugging
      const windowPos = this.normalizedToWindow(this.currentX, this.currentY);
      const targetPos = this.normalizedToWindow(this.targetX(), this.targetY());

      this.debugger.updatePosition({
        currentX: this.currentX,
        currentY: this.currentY,
        centerX,
        centerY,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
        timeLeft: 1.0,
        actualX: windowPos.x,
        actualY: windowPos.y,
        targetX: targetPos.x,
        targetY: targetPos.y,
        maxX: this.bottomEnd(),
        maxY: this.rightEnd(),
        minX: this.topEnd(),
        minY: this.leftEnd(),
        angle: this.angle,
        angleDegrees: (this.angle * 180) / Math.PI,
      });
    }

    this.animationFrameId = requestAnimationFrame(this.mainLoop);
  }

  /**
   * Handle window resize event
   */
  handleResize() {
    this.debouncedResize();
  }

  /**
   * Toggle glow effect on the logo
   * @param {number} duration - Duration of the glow effect in milliseconds
   */
  toggleGlow(duration = 2000) {
    if (this.logo.classList.contains('glow')) return;

    this.logo.classList.add('glow');
    setTimeout(() => {
      this.logo.classList.remove('glow');
    }, duration);
  }

  /**
   * Initialize the animation
   */
  initialize() {
    // Initial setup

    // Initialize debugger if enabled
    if (this.debugger) {
      this.debugger.initialize();
    }

    // Set initial dimensions and update CSS variables

    this.initializeLogoDimensions();
    this.updateCSSVariables();

    // Event listeners
    window.addEventListener('resize', this.handleResize);
    this.logo.addEventListener('load', this.initializeLogoDimensions);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'g' || e.key === 'G') {
        this.toggleGlow();
      }
    });

    // Start animation loop
    this.isAnimating = true;
    this.lastFrameTime = performance.now();
    this.animationFrameId = requestAnimationFrame(this.mainLoop);

    // Start FPS meter if available
    // @ts-ignore: fpsMeter is added by fps-meter.js
    if (window.fpsMeter) {
      // @ts-ignore: fpsMeter is added by fps-meter.js
      window.fpsMeter.start();
    }
  }

  /**
   * Clean up resources and event listeners
   */
  cleanup() {
    // Stop animation loop
    this.isAnimating = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }

    // Remove event listeners
    window.removeEventListener('resize', this.handleResize);
    this.logo.removeEventListener('load', this.initializeLogoDimensions);

    // Cancel debounced resize
    this.debouncedResize.cancel();

    // Clean up debugger if enabled
    if (this.debugger) {
      this.debugger.cleanup();
    }
  }
}

export default LogoAnimator2;
