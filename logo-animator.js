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
 * @typedef {Object} ViewportDimensions
 * @property {number} width - Viewport width
 * @property {number} height - Viewport height
 */

/**
 * @typedef {((...args: any[]) => void) & { cancel: () => void }} DebouncedFunction
 */

/**
 * Class to handle logo animation and related functionality
 */
class LogoAnimator {
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
    this.velocityX = Math.cos(this.angle) * this.speed;
    this.velocityY = Math.sin(this.angle) * this.speed;

    // Cached dimensions
    /** @type {LogoDimensions|null} */
    this.logoDimensions = null;
    /** @type {ViewportDimensions|null} */
    this.viewportDimensions = null;

    // Position tracking
    this.currentX = window.innerWidth / 2;
    this.currentY = window.innerHeight / 2;

    // Animation state
    this.animationInProgress = false;
    this.animationEndTime = 0;

    // Timeout tracking
    /** @type {ReturnType<typeof setTimeout>|undefined} */
    this.logoLoadTimeout = undefined;
    /** @type {ReturnType<typeof setTimeout>|undefined} */
    this.animationSegmentTimeout = undefined;
    /** @type {ReturnType<typeof setTimeout>|undefined} */
    this.nextAnimationTimeout = undefined;
    /** @type {ReturnType<typeof setTimeout>|undefined} */
    this.glowTimeout = undefined;

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
        if (this.animationInProgress) {
          this.logo.classList.remove('in-motion');
          this.animationInProgress = false;
        }

        this.clearAllTimeouts();
        this.updateLogoDimensions();

        if (this.debugger) {
          this.debugger.log(
            `Viewport resized: ${window.innerWidth}x${window.innerHeight}`
          );
        }
      }, 250)
    );

    // Bind methods
    this.updateLogoDimensions = this.updateLogoDimensions.bind(this);
    this.calculateNextPosition = this.calculateNextPosition.bind(this);
    this.handleResize = this.handleResize.bind(this);
  }

  /**
   * Update cached viewport dimensions
   * @private
   */
  updateViewportDimensions() {
    this.viewportDimensions = {
      width: window.innerWidth,
      height: window.innerHeight,
    };
  }

  /**
   * Update cached logo dimensions and boundaries
   * @private
   */
  updateLogoDimensionsAndBounds() {
    if (!this.viewportDimensions) {
      this.updateViewportDimensions();
    }

    // After calling updateViewportDimensions, we can be sure viewportDimensions exists
    const viewportDimensions = /** @type {ViewportDimensions} */ (
      this.viewportDimensions
    );

    const logoRect = this.logo.getBoundingClientRect();
    const logoWidth = logoRect.width;
    const logoHeight = logoRect.height;

    this.logoDimensions = {
      width: logoWidth,
      height: logoHeight,
      leftBound: logoWidth / 2,
      rightBound: viewportDimensions.width - logoWidth / 2,
      topBound: logoHeight / 2,
      bottomBound: viewportDimensions.height - logoHeight / 2,
    };

    if (this.debugger) {
      this.debugger.updateDimensions({
        width: logoWidth,
        height: logoHeight,
      });
    }
  }

  updateLogoDimensions() {
    this.updateViewportDimensions();
    // After calling updateViewportDimensions, we can be sure viewportDimensions exists
    const viewportDimensions = /** @type {ViewportDimensions} */ (
      this.viewportDimensions
    );
    const baseWidth = Math.max(viewportDimensions.width * 0.2, 200);
    this.logo.style.width = `${baseWidth}px`;

    clearTimeout(this.logoLoadTimeout);

    this.logoLoadTimeout = setTimeout(() => {
      this.updateLogoDimensionsAndBounds();

      // Center the logo initially
      const dimensions = /** @type {ViewportDimensions} */ (
        this.viewportDimensions
      );
      this.currentX = dimensions.width / 2;
      this.currentY = dimensions.height / 2;

      document.documentElement.style.setProperty(
        '--start-x',
        `${this.currentX}px`
      );
      document.documentElement.style.setProperty(
        '--start-y',
        `${this.currentY}px`
      );
      document.documentElement.style.setProperty(
        '--target-x',
        `${this.currentX}px`
      );
      document.documentElement.style.setProperty(
        '--target-y',
        `${this.currentY}px`
      );

      if (!this.animationInProgress) {
        this.calculateNextPosition();
      }
    }, 100);
  }

  calculateNextPosition() {
    if (!this.logoDimensions || !this.viewportDimensions) {
      this.updateLogoDimensionsAndBounds();
    }

    // After calling updateLogoDimensionsAndBounds, we can be sure logoDimensions exists
    const dimensions = /** @type {LogoDimensions} */ (this.logoDimensions);

    const actualPosition = {
      x: parseFloat(window.getComputedStyle(this.logo).left) || this.currentX,
      y: parseFloat(window.getComputedStyle(this.logo).top) || this.currentY,
    };

    this.currentX = actualPosition.x;
    this.currentY = actualPosition.y;

    let nextX = this.currentX + this.velocityX / 60;
    let nextY = this.currentY + this.velocityY / 60;

    const { leftBound, rightBound, topBound, bottomBound } = dimensions;

    const hitLeft = nextX <= leftBound;
    const hitRight = nextX >= rightBound;
    const hitTop = nextY <= topBound;
    const hitBottom = nextY >= bottomBound;

    if (hitLeft || hitRight) {
      this.velocityX = -this.velocityX;
      nextX = hitLeft ? leftBound : rightBound;
    }

    if (hitTop || hitBottom) {
      this.velocityY = -this.velocityY;
      nextY = hitTop ? topBound : bottomBound;
    }

    const hitCorner = (hitLeft || hitRight) && (hitTop || hitBottom);
    if (hitCorner) {
      if (this.debugger) {
        this.debugger.log(
          `Corner hit detected! ${hitLeft}-${hitRight}-${hitTop}-${hitBottom}`
        );
      }
      this.toggleGlow(2000);
    }

    if (this.debugger) {
      this.debugger.log(
        `Boundaries: L:${leftBound} R:${rightBound} T:${topBound} B:${bottomBound}`
      );
      this.debugger.log(
        `Position: Current(${this.currentX.toFixed(0)},${this.currentY.toFixed(
          0
        )}) Next(${nextX.toFixed(0)},${nextY.toFixed(0)})`
      );
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
    }

    nextX = Math.max(leftBound, Math.min(rightBound, nextX));
    nextY = Math.max(topBound, Math.min(bottomBound, nextY));

    document.documentElement.style.setProperty(
      '--start-x',
      `${this.currentX}px`
    );
    document.documentElement.style.setProperty(
      '--start-y',
      `${this.currentY}px`
    );
    document.documentElement.style.setProperty('--target-x', `${nextX}px`);
    document.documentElement.style.setProperty('--target-y', `${nextY}px`);

    const distance = Math.sqrt(
      Math.pow(nextX - this.currentX, 2) + Math.pow(nextY - this.currentY, 2)
    );
    const duration = distance / this.speed;

    document.documentElement.style.setProperty(
      '--animation-duration',
      `${duration.toFixed(2)}s`
    );

    this.currentX = nextX;
    this.currentY = nextY;
    this.animationEndTime = Date.now() + duration * 1000;
    this.animationInProgress = true;

    requestAnimationFrame(() => {
      this.logo.style.left =
        document.documentElement.style.getPropertyValue('--start-x');
      this.logo.style.top =
        document.documentElement.style.getPropertyValue('--start-y');
      this.logo.style.animation = 'none';
      void this.logo.offsetWidth;
      this.logo.style.animation = '';
    });

    clearTimeout(this.animationSegmentTimeout);
    clearTimeout(this.nextAnimationTimeout);

    this.animationSegmentTimeout = setTimeout(() => {
      this.logo.style.left = `${nextX}px`;
      this.logo.style.top = `${nextY}px`;

      this.nextAnimationTimeout = setTimeout(() => {
        this.animationInProgress = false;
        this.calculateNextPosition();
      }, 16);
    }, duration * 1000);

    if (this.debugger) {
      this.debugger.log(
        `Animating to [${nextX.toFixed(0)}, ${nextY.toFixed(
          0
        )}] in ${duration.toFixed(2)}s`
      );

      this.debugger.updatePosition({
        currentX: this.currentX,
        currentY: this.currentY,
        velocityX: this.velocityX,
        velocityY: this.velocityY,
        animationEndTime: this.animationEndTime,
      });
    }
  }

  clearAllTimeouts() {
    clearTimeout(this.logoLoadTimeout);
    clearTimeout(this.animationSegmentTimeout);
    clearTimeout(this.nextAnimationTimeout);
    clearTimeout(this.glowTimeout);
  }

  toggleGlow(duration = 2000) {
    if (this.logo.classList.contains('glow')) return;

    this.logo.classList.add('glow');
    clearTimeout(this.glowTimeout);

    this.glowTimeout = setTimeout(() => {
      this.logo.classList.remove('glow');
    }, duration);
  }

  /**
   * Handle window resize event using debounced function
   */
  handleResize() {
    this.debouncedResize();
  }

  initialize() {
    // Initial setup
    this.logo.style.position = 'absolute';
    this.logo.style.left = '50vw';
    this.logo.style.top = '50vh';

    // Initialize debugger if enabled
    if (this.debugger) {
      this.debugger.initialize();
    }

    // Set initial dimensions and update CSS variables
    this.updateLogoDimensions();

    // Event listeners
    window.addEventListener('resize', this.handleResize);
    this.logo.addEventListener('load', this.updateLogoDimensions);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'g' || e.key === 'G') {
        this.toggleGlow();
      }
    });

    // Start FPS meter if available
    // @ts-ignore: fpsMeter is added by fps-meter.js
    if (window.fpsMeter) {
      // @ts-ignore: fpsMeter is added by fps-meter.js
      window.fpsMeter.start();
    }
  }

  cleanup() {
    // Remove event listeners
    window.removeEventListener('resize', this.handleResize);
    this.logo.removeEventListener('load', this.updateLogoDimensions);

    // Clear all timeouts
    this.clearAllTimeouts();

    // Cancel debounced resize
    this.debouncedResize.cancel();

    // Clean up debugger if enabled
    if (this.debugger) {
      this.debugger.cleanup();
    }
  }
}

export default LogoAnimator;
