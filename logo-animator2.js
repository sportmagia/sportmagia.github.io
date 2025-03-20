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
      leftBound: this.minX() + logoRect.width / 2,
      rightBound: this.maxX() - logoRect.width / 2,
      topBound: this.minY() + logoRect.height / 2,
      bottomBound: this.maxY() - logoRect.height / 2,
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

  maxX = () => window.innerWidth / 2;
  minX = () => -this.maxX();
  maxY = () => window.innerHeight / 2;
  minY = () => -this.maxY();
  actualX = () => this.currentX + this.maxX();
  actualY = () => this.currentY + this.maxY();
  targetXX = () => this.actualX() + this.maxX() * Math.cos(this.angle);
  targetYY = () => this.actualY() + this.maxY() * Math.sin(this.angle);

  /**
   * Update CSS variables for animation
   * @private
   */
  updateCSSVariables() {
    this.logo.classList.remove('animate');
    document.documentElement.style.setProperty(
      '--start-x',
      `${this.actualX()}px`
    );
    document.documentElement.style.setProperty(
      '--start-y',
      `${this.actualY()}px`
    );
    document.documentElement.style.setProperty(
      '--target-x',
      `${this.targetXX()}px`
    );
    document.documentElement.style.setProperty(
      '--target-y',
      `${this.targetYY()}px`
    );

    // -> triggering reflow /* The actual magic */
    // without this it wouldn't work. Try uncommenting the line and the transition won't be retriggered.
    void this.logo.offsetWidth;
    this.logo.classList.add('animate');
  }

  /**
   * Main animation loop using requestAnimationFrame
   * @param {number} timestamp - Current frame timestamp
   */
  mainLoop(timestamp) {
    if (!this.isAnimating) return;

    // Calculate delta time in seconds
    const deltaTime = (timestamp - this.lastFrameTime) / 1000;
    this.lastFrameTime = timestamp;

    // Get current position from computed style
    const computedStyle = window.getComputedStyle(this.logo);
    this.currentX =
      parseFloat(computedStyle.left) - window.innerWidth / 2 || this.currentX;
    this.currentY =
      parseFloat(computedStyle.top) - window.innerHeight / 2 || this.currentY;

    // Get logo center position
    const logoRect = this.logo.getBoundingClientRect();
    const centerX = logoRect.left + logoRect.width / 2;
    const centerY = logoRect.top + logoRect.height / 2;

    // Check for collisions
    if (!this.logoDimensions) this.updateLogoDimensionsAndBounds();

    const dimensions = /** @type {LogoDimensions} */ (this.logoDimensions);
    const { leftBound, rightBound, topBound, bottomBound } = dimensions;

    // Detect wall hits
    const hitLeft = this.currentX <= leftBound;
    const hitRight = this.currentX >= rightBound;
    const hitTop = this.currentY <= topBound;
    const hitBottom = this.currentY >= bottomBound;

    // Handle wall collisions
    if (hitLeft || hitRight) {
      this.velocityX = -this.velocityX;
      console.log('angle', this.angle);
      this.angle =
        this.angle < Math.PI
          ? Math.PI - this.angle
          : this.angle < (3 / 2) * Math.PI
          ? this.angle - Math.PI
          : (3 / 2) * Math.PI - this.angle;

      console.log('angle', this.angle, Math.sin(this.angle));
    }

    if (hitTop || hitBottom) this.angle = -this.angle;

    const hit = hitLeft || hitRight || hitTop || hitBottom;
    // Update CSS variables for animation
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
      if (hitLeft || hitRight || hitTop || hitBottom) {
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

      this.debugger.updatePosition({
        currentX: this.currentX,
        currentY: this.currentY,
        centerX,
        centerY,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
        timeLeft: 1.0, // Since we're using RAF, this is a placeholder value
      });
    }

    // Request next frame
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
