// @ts-check

/**
 * Class to handle debug functionality for logo animation
 */
class LogoDebugger {
  /**
   * @param {HTMLElement} logo - The logo element to debug
   * @param {Object} options - Debug configuration options
   * @param {boolean} [options.enabledByDefault=false] - Whether debug mode is enabled by default
   */
  constructor(logo, options = {}) {
    const { enabledByDefault = false } = options;

    this.logo = logo;
    this.body = document.body;
    this.isDebugMode = enabledByDefault;
    this.debugButton = null;
    this.debugInterval = null;

    // Bind methods
    this.updatePosition = this.updatePosition.bind(this);
  }

  /**
   * Initialize the debugger
   */
  initialize() {
    this.addDebugButton();
    this.updateDebugElements();
    this.startPositionUpdates();
  }

  /**
   * Clean up debugger resources
   */
  cleanup() {
    if (this.debugInterval) {
      clearInterval(this.debugInterval);
    }
    if (this.debugButton && this.debugButton.parentNode) {
      this.debugButton.parentNode.removeChild(this.debugButton);
    }
  }

  updateDebugElements() {
    this.body.classList.toggle('debug-mode', this.isDebugMode);
  }

  addDebugButton() {
    const button = document.createElement('button');
    button.id = 'debug-toggle';
    button.innerHTML = '🛠️';
    button.title = 'Toggle Debug Mode';

    button.addEventListener('click', () => {
      this.isDebugMode = !this.isDebugMode;
      this.updateDebugElements();
      console.log(`Debug mode: ${this.isDebugMode ? 'ON' : 'OFF'}`);
    });

    this.body.appendChild(button);
    this.debugButton = button;
  }

  /**
   * Log debug information
   * @param {string} message - The debug message
   * @param {any} [data] - Optional data to log
   */
  log(message, data) {
    if (!this.isDebugMode) return;

    if (data !== undefined) {
      console.log(message, data);
    } else {
      console.log(message);
    }
  }

  /**
   * Update debug position information
   * @param {Object} state - Current animation state
   * @param {number} state.currentX - Current X position
   * @param {number} state.currentY - Current Y position
   * @param {number} state.velocityX - X velocity
   * @param {number} state.velocityY - Y velocity
   * @param {number} state.animationEndTime - Animation end timestamp
   */
  updatePosition(state) {
    if (!this.isDebugMode) return;

    const logoRect = this.logo.getBoundingClientRect();
    const centerX = logoRect.left + logoRect.width / 2;
    const centerY = logoRect.top + logoRect.height / 2;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const timeLeft = Math.max(0, (state.animationEndTime - Date.now()) / 1000);

    this.body.setAttribute(
      'data-position',
      `Pos: ${centerX.toFixed(0)}x${centerY.toFixed(0)} ` +
        `Target: [${state.currentX.toFixed(0)}, ${state.currentY.toFixed(
          0
        )}] ` +
        `Vel: ${state.velocityX.toFixed(1)}x${state.velocityY.toFixed(1)} ` +
        `Time: ${timeLeft.toFixed(1)}s`
    );

    this.body.setAttribute(
      'data-viewport',
      `${viewportWidth.toFixed(0)} x ${viewportHeight.toFixed(0)}px`
    );
  }

  /**
   * Update logo dimensions debug info
   * @param {Object} dimensions - Logo dimensions
   * @param {number} dimensions.width - Logo width
   * @param {number} dimensions.height - Logo height
   */
  updateDimensions(dimensions) {
    if (!this.isDebugMode) return;

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    this.log(
      `Logo dimensions: ${dimensions.width.toFixed(
        1
      )} x ${dimensions.height.toFixed(1)}px`
    );

    this.body.setAttribute(
      'data-logo-size',
      `${dimensions.width.toFixed(0)} x ${dimensions.height.toFixed(0)}px`
    );

    this.body.setAttribute(
      'data-viewport',
      `${viewportWidth.toFixed(0)} x ${viewportHeight.toFixed(0)}px`
    );
  }

  /**
   * Start periodic position updates
   */
  startPositionUpdates() {
    this.debugInterval = setInterval(() => {
      // This will be called with current state by LogoAnimator
      // The actual updatePosition call happens there
    }, 100);
  }
}

export default LogoDebugger;
