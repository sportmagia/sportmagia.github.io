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
class LogoAnimator {
  /**
   * @param {string} logoId - The ID of the logo element
   * @param {Object} options - Configuration options
   * @param {number} [options.angle=40] - Angle in degrees
   * @param {number} [options.traversalDuration=4] - Time in seconds to traverse window diagonally
   * @param {boolean} [options.debug=false] - Enable debug mode
   */
  constructor(logoId, options = {}) {
    const { angle = 40, traversalDuration = 4, debug = false } = options;

    // DOM elements
    this.logo = document.getElementById(logoId);
    this.body = document.body;

    if (!this.logo) {
      throw new Error(`Logo element with ID "${logoId}" not found`);
    }

    // Add logo class for styling
    this.logo.classList.add('logo');

    // Create unique identifier for CSS variables
    this.uniqueId = `logo-${logoId}`;
    this.logo.style.setProperty('--instance-id', this.uniqueId);

    // Physics settings
    this.angle = angle * (Math.PI / 180);
    this.traversalDuration = traversalDuration;
    this.speed = this.calculateSpeedFromDuration();

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

    // FPS tracking
    this.frameCount = 0;
    this.lastFpsUpdate = 0;
    this.currentFps = 0;
    this.fpsUpdateInterval = 500; // Update FPS every 500ms

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
   * Calculate speed based on window diagonal and desired traversal duration
   * @returns {number} Speed in pixels per second
   */
  calculateSpeedFromDuration() {
    // Calculate window diagonal
    const diagonal = Math.sqrt(
      Math.pow(window.innerWidth, 2) + Math.pow(window.innerHeight, 2)
    );

    // Calculate speed needed to traverse diagonal in specified duration
    return diagonal / this.traversalDuration;
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

    // Calculate distance and required duration for constant speed
    const dx = targetPos.x - startPos.x;
    const dy = targetPos.y - startPos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const duration = distance / this.speed; // duration in seconds for constant speed

    // Set instance-specific CSS variables on the logo element itself
    this.logo.style.setProperty('--start-x', `${startPos.x}px`);
    this.logo.style.setProperty('--start-y', `${startPos.y}px`);
    this.logo.style.setProperty('--target-x', `${targetPos.x}px`);
    this.logo.style.setProperty('--target-y', `${targetPos.y}px`);
    this.logo.style.setProperty('--animation-duration', `${duration}s`);

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

    // Update FPS in debugger
    if (this.debugger) {
      this.debugger.updateFps(timestamp);
    }

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
    const MINIMUM_MOVEMENT = 1; // Minimum pixels to move to prevent getting stuck

    // Handle corner hits first
    if ((hitLeft || hitRight) && (hitTop || hitBottom)) {
      // For corner hits, reverse both directions at once
      this.angle = (this.angle + Math.PI) % (2 * Math.PI);
      if (this.debugger) {
        this.debugger.log(`Corner hit detected! Reversing direction`);
      }
      this.toggleGlow(2000);
    } else if (hitLeft || hitRight) {
      // Horizontal reflection
      this.angle = Math.PI - this.angle;
      // Ensure we move away from the wall
      const dx = Math.cos(this.angle);
      if ((hitLeft && dx < 0) || (hitRight && dx > 0)) {
        this.angle = (this.angle + Math.PI) % (2 * Math.PI);
      }
    } else if (hitTop || hitBottom) {
      // Vertical reflection
      this.angle = -this.angle;
      // Ensure we move away from the wall
      const dy = Math.sin(this.angle);
      if ((hitTop && dy < 0) || (hitBottom && dy > 0)) {
        this.angle = (this.angle + Math.PI) % (2 * Math.PI);
      }
    }

    // Normalize angle to [0, 2π)
    if (this.angle < 0) this.angle += 2 * Math.PI;
    this.angle %= 2 * Math.PI;

    const hit = hitLeft || hitRight || hitTop || hitBottom;
    if (hit) {
      // Move slightly away from the wall to prevent sticking
      const dx = Math.cos(this.angle) * MINIMUM_MOVEMENT;
      const dy = Math.sin(this.angle) * MINIMUM_MOVEMENT;
      this.currentX += dx;
      this.currentY += dy;

      this.updateCSSVariables();
      if (this.debugger) {
        this.debugger.log(
          `Collision handled - new angle: ${(
            (this.angle * 180) /
            Math.PI
          ).toFixed(1)}°`
        );
      }
    }

    // Debug logging
    if (this.debugger) {
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
        fps: this.debugger.currentFps,
      });
    }

    this.animationFrameId = requestAnimationFrame(this.mainLoop);
  }

  /**
   * Handle window resize event
   */
  handleResize() {
    // Update speed based on new window size while maintaining traversal duration
    this.speed = this.calculateSpeedFromDuration();
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
   * Calculate angle needed to hit the nearest corner while maintaining direction
   * @returns {number} The new angle in radians
   */
  calculateCornerAngle() {
    // Get current direction signs to maintain direction
    const dx = Math.cos(this.angle);
    const dy = Math.sin(this.angle);

    if (!this.logoDimensions) this.updateLogoDimensionsAndBounds();
    const dimensions = /** @type {LogoDimensions} */ (this.logoDimensions);
    const halfWidth = dimensions.width / 2;
    const halfHeight = dimensions.height / 2;

    // Find nearest corner based on current direction, accounting for logo dimensions
    const targetX =
      dx > 0
        ? this.bottomEnd() - halfWidth // right wall minus half width
        : this.topEnd() + halfWidth; // left wall plus half width

    const targetY =
      dy > 0
        ? this.rightEnd() - halfHeight // bottom wall minus half height
        : this.leftEnd() + halfHeight; // top wall plus half height

    // Calculate angle to that corner
    const deltaX = targetX - this.currentX;
    const deltaY = targetY - this.currentY;

    // Calculate new angle
    let newAngle = Math.atan2(deltaY, deltaX);
    if (newAngle < 0) newAngle += 2 * Math.PI;

    return newAngle;
  }

  /**
   * Update angle to target nearest corner
   */
  targetCorner() {
    this.angle = this.calculateCornerAngle();
    this.updateCSSVariables();

    if (this.debugger) {
      this.debugger.log(
        `Angle adjusted to target corner: ${(
          (this.angle * 180) /
          Math.PI
        ).toFixed(1)}° ` +
          `[${Math.cos(this.angle).toFixed(3)}, ${Math.sin(this.angle).toFixed(
            3
          )}]`
      );
    }
  }

  /**
   * Initialize the animation
   */
  initialize() {
    // Initial setup

    // Initialize debugger if enabled
    if (this.debugger) {
      this.debugger.initialize();
      this.debugger.setTargetCornerCallback(() => this.targetCorner());
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

export default LogoAnimator;
