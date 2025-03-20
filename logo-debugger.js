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
    this.debugPanel = null;
    this.debugInterval = null;

    // FPS tracking
    this.frameCount = 0;
    this.lastFpsUpdate = 0;
    this.currentFps = 0;
    this.fpsUpdateInterval = 500; // Update FPS every 500ms

    // Bind methods
    this.updatePosition = this.updatePosition.bind(this);
    this.updateFps = this.updateFps.bind(this);
  }

  /**
   * Initialize the debugger
   */
  initialize() {
    this.addDebugPanel();
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
    if (this.debugPanel && this.debugPanel.parentNode) {
      this.debugPanel.parentNode.removeChild(this.debugPanel);
    }
  }

  updateDebugElements() {
    this.body.classList.toggle('debug-mode', this.isDebugMode);
    if (this.debugPanel) {
      this.debugPanel.style.display = this.isDebugMode ? 'block' : 'none';
    }
  }

  addDebugPanel() {
    const panel = document.createElement('div');
    panel.id = 'debug-panel';
    panel.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      background: rgba(0, 0, 0, 0.8);
      color: #00ff00;
      padding: 10px;
      font-family: monospace;
      font-size: 12px;
      border-radius: 4px;
      z-index: 9999;
      display: none;
      min-width: 200px;
    `;

    // Create sections for different debug info
    const normalizedInfo = document.createElement('div');
    normalizedInfo.id = 'debug-normalized';
    normalizedInfo.innerHTML =
      '<div style="color: #88ff88; margin-bottom: 5px;">Normalized (0,0)</div>';

    const windowInfo = document.createElement('div');
    windowInfo.id = 'debug-window';
    windowInfo.style.cssText = `
      margin-top: 10px;
      padding-top: 10px;
      border-top: 1px solid #333;
    `;
    windowInfo.innerHTML =
      '<div style="color: #88ff88; margin-bottom: 5px;">Window Coordinates</div>';

    const angleInfo = document.createElement('div');
    angleInfo.id = 'debug-angle';
    angleInfo.style.cssText = `
      margin-top: 10px;
      padding-top: 10px;
      border-top: 1px solid #333;
    `;

    const boundsInfo = document.createElement('div');
    boundsInfo.id = 'debug-bounds';
    boundsInfo.style.cssText = `
      margin-top: 10px;
      padding-top: 10px;
      border-top: 1px solid #333;
    `;

    const controlsSection = document.createElement('div');
    controlsSection.style.cssText = `
      margin-top: 10px;
      padding-top: 10px;
      border-top: 1px solid #333;
    `;

    const cornerButton = document.createElement('button');
    cornerButton.innerHTML = '🎯 Target Corner';
    cornerButton.style.cssText = `
      background: rgba(0, 255, 0, 0.2);
      color: #00ff00;
      border: 1px solid #00ff00;
      border-radius: 4px;
      padding: 5px 10px;
      cursor: pointer;
      font-family: monospace;
      margin-top: 5px;
    `;
    cornerButton.addEventListener('click', () => {
      if (this.onTargetCorner) {
        this.onTargetCorner();
      }
    });
    controlsSection.appendChild(cornerButton);

    panel.appendChild(normalizedInfo);
    panel.appendChild(windowInfo);
    panel.appendChild(angleInfo);
    panel.appendChild(boundsInfo);
    panel.appendChild(controlsSection);

    this.body.appendChild(panel);
    this.debugPanel = panel;
  }

  addDebugButton() {
    const button = document.createElement('button');
    button.id = 'debug-toggle';
    button.innerHTML = '🛠️';
    button.style.cssText = `
      position: fixed;
      top: 10px;
      left: 10px;
      z-index: 10000;
      padding: 8px;
      background: rgba(0, 0, 0, 0.8);
      color: #00ff00;
      border: 1px solid #00ff00;
      border-radius: 4px;
      cursor: pointer;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      opacity: 0.7;
      touch-action: manipulation;
      -webkit-tap-highlight-color: transparent;
    `;
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
   * @param {number} state.centerX - Center X position of logo
   * @param {number} state.centerY - Center Y position of logo
   * @param {number} state.viewportWidth - Current viewport width
   * @param {number} state.viewportHeight - Current viewport height
   * @param {number} state.timeLeft - Time left in animation
   * @param {number} state.actualX - Actual X position in viewport
   * @param {number} state.actualY - Actual Y position in viewport
   * @param {number} state.targetX - Target X position
   * @param {number} state.targetY - Target Y position
   * @param {number} state.maxX - Maximum X boundary
   * @param {number} state.maxY - Maximum Y boundary
   * @param {number} state.minX - Minimum X boundary
   * @param {number} state.minY - Minimum Y boundary
   * @param {number} state.angle - Current angle in radians
   * @param {number} state.angleDegrees - Current angle in degrees
   * @param {number} state.fps - Current frames per second
   */
  updatePosition(state) {
    if (!this.isDebugMode) return;

    const {
      currentX,
      currentY,
      centerX,
      centerY,
      viewportWidth,
      viewportHeight,
      timeLeft,
      actualX,
      actualY,
      targetX,
      targetY,
      maxX,
      maxY,
      minX,
      minY,
      angle,
      angleDegrees,
      fps,
    } = state;

    // Update debug panel with both coordinate systems
    if (this.debugPanel) {
      const normalizedInfo = document.getElementById('debug-normalized');
      if (normalizedInfo) {
        normalizedInfo.innerHTML = `
          <div style="color: #88ff88; margin-bottom: 5px;">Normalized (0,0)</div>
          <div>Current: [${currentX.toFixed(0)}, ${currentY.toFixed(0)}]</div>
          <div>Target: [${(targetX - viewportWidth / 2).toFixed(0)}, ${(
          targetY -
          viewportHeight / 2
        ).toFixed(0)}]</div>
          <div>Bounds: [${minX.toFixed(0)}, ${maxX.toFixed(
          0
        )}] × [${minY.toFixed(0)}, ${maxY.toFixed(0)}]</div>
          <div>FPS: ${fps || 0}</div>
        `;
      }

      const windowInfo = document.getElementById('debug-window');
      if (windowInfo) {
        windowInfo.innerHTML = `
          <div style="color: #88ff88; margin-bottom: 5px;">Window Coordinates</div>
          <div>Current: [${actualX.toFixed(0)}, ${actualY.toFixed(0)}]</div>
          <div>Target: [${targetX.toFixed(0)}, ${targetY.toFixed(0)}]</div>
          <div>Center: [${centerX.toFixed(0)}, ${centerY.toFixed(0)}]</div>
          <div>Viewport: ${viewportWidth.toFixed(0)} × ${viewportHeight.toFixed(
          0
        )}</div>
        `;
      }

      const angleInfo = document.getElementById('debug-angle');
      if (angleInfo) {
        const direction = this.getDirectionFromAngle(angleDegrees);
        angleInfo.innerHTML = `
          <div style="color: #88ff88; margin-bottom: 5px;">Angle</div>
          <div>Degrees: ${angleDegrees.toFixed(1)}°</div>
          <div>Radians: ${angle.toFixed(3)}</div>
          <div>Direction: ${direction}</div>
        `;
      }

      const boundsInfo = document.getElementById('debug-bounds');
      if (boundsInfo) {
        boundsInfo.innerHTML = `
          <div style="color: #88ff88; margin-bottom: 5px;">Boundaries</div>
          <div>Window: [0, ${viewportWidth.toFixed(
            0
          )}] × [0, ${viewportHeight.toFixed(0)}]</div>
          <div>Normalized: [${minX.toFixed(0)}, ${maxX.toFixed(
          0
        )}] × [${minY.toFixed(0)}, ${maxY.toFixed(0)}]</div>
        `;
      }
    }
  }

  /**
   * Get cardinal/ordinal direction from angle
   * @param {number} angleDegrees - Angle in degrees
   * @returns {string} Direction description
   */
  getDirectionFromAngle(angleDegrees) {
    // Normalize angle to 0-360
    const normalizedAngle = ((angleDegrees % 360) + 360) % 360;

    if (normalizedAngle > 337.5 || normalizedAngle <= 22.5) return '→ Right';
    if (normalizedAngle > 22.5 && normalizedAngle <= 67.5)
      return '↘ Down-Right';
    if (normalizedAngle > 67.5 && normalizedAngle <= 112.5) return '↓ Down';
    if (normalizedAngle > 112.5 && normalizedAngle <= 157.5)
      return '↙ Down-Left';
    if (normalizedAngle > 157.5 && normalizedAngle <= 202.5) return '← Left';
    if (normalizedAngle > 202.5 && normalizedAngle <= 247.5) return '↖ Up-Left';
    if (normalizedAngle > 247.5 && normalizedAngle <= 292.5) return '↑ Up';
    return '↗ Up-Right';
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

  /**
   * Set the callback for when the target corner button is clicked
   * @param {() => void} callback - The callback to execute
   */
  setTargetCornerCallback(callback) {
    this.onTargetCorner = callback;
  }

  /**
   * Update FPS counter
   * @param {number} timestamp - Current frame timestamp
   */
  updateFps(timestamp) {
    if (!this.isDebugMode) return;

    this.frameCount++;
    if (timestamp - this.lastFpsUpdate >= this.fpsUpdateInterval) {
      this.currentFps = Math.round(
        (this.frameCount * 1000) / (timestamp - this.lastFpsUpdate)
      );
      this.frameCount = 0;
      this.lastFpsUpdate = timestamp;
    }
  }
}

export default LogoDebugger;
