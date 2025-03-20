// @ts-check

// Declare the fpsMeter global for TypeScript
/**
 * FPS meter class for measuring and displaying frames per second
 * @typedef {Object} FPSMeter
 * @property {() => void} start - Start the FPS meter
 * @property {() => void} pause - Pause the FPS meter
 * @property {() => void} resume - Resume the FPS meter
 * @property {() => void} toggle - Toggle the FPS meter on/off
 * @property {() => void} stop - Stop the FPS meter and remove UI
 * @property {number} fps - Current FPS value
 */

// Extend the Window interface
/**
 * @typedef {Object} WindowWithFPSMeter
 * @property {FPSMeter} [fpsMeter] - The global FPS meter instance
 */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize the logo
  const logo = document.getElementById('logo');
  const body = document.body;

  if (!logo) {
    console.error('Logo element not found');
    return;
  }

  // Debug mode settings
  const isLocalhost =
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname === '';
  let isDebugMode = isLocalhost; // Enable debug by default on localhost

  // Update visibility of debug elements
  const updateDebugElements = () => {
    body.classList.toggle('debug-mode', isDebugMode);
  };

  // Add debug toggle button
  const addDebugButton = () => {
    const button = document.createElement('button');
    button.id = 'debug-toggle';
    button.innerHTML = '🛠️'; // Wrench/tool emoji as debug icon
    button.title = 'Toggle Debug Mode';

    button.addEventListener('click', () => {
      isDebugMode = !isDebugMode;
      updateDebugElements();
      console.log(`Debug mode: ${isDebugMode ? 'ON' : 'OFF'}`);
    });

    body.appendChild(button);
  };

  // Set logo dimensions based on viewport and update CSS variables
  const updateLogoDimensions = () => {
    // Calculate logo width - 20% of viewport with minimum 200px
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const baseWidth = Math.max(viewportWidth * 0.2, 200);

    // Set logo width
    logo.style.width = `${baseWidth}px`;

    // Wait for the logo to load/render to get its actual dimensions
    setTimeout(() => {
      const logoRect = logo.getBoundingClientRect();
      const logoWidth = logoRect.width;
      const logoHeight = logoRect.height;

      console.log(
        `Logo dimensions: ${logoWidth.toFixed(1)} x ${logoHeight.toFixed(1)}px`
      );

      // Set CSS variables for the logo dimensions
      document.documentElement.style.setProperty(
        '--logo-width',
        `${logoWidth}px`
      );
      document.documentElement.style.setProperty(
        '--logo-height',
        `${logoHeight}px`
      );

      // Also set useful calculated values
      document.documentElement.style.setProperty(
        '--logo-width-value',
        `${logoWidth}`
      );
      document.documentElement.style.setProperty(
        '--logo-height-value',
        `${logoHeight}`
      );

      // Update debug data attributes
      body.setAttribute(
        'data-logo-size',
        `${logoWidth.toFixed(0)} x ${logoHeight.toFixed(0)}px`
      );

      // If animation was in progress, restart it to apply new dimensions
      if (logo.style.animationPlayState !== 'paused') {
        logo.style.animation = 'none';
        // Force reflow
        void logo.offsetWidth;
        logo.style.animation = 'bounce 8s linear infinite';
      }
    }, 100); // Small delay to ensure image is rendered
  };

  // Center the logo initially
  logo.style.position = 'absolute';
  logo.style.left = '50vw';
  logo.style.top = '50vh';
  logo.style.transform = 'translate(-50%, -50%)';

  // Add debug button
  addDebugButton();

  // Initialize debug mode
  updateDebugElements();

  // Set initial dimensions and update CSS variables
  updateLogoDimensions();

  // Update dimensions when window is resized
  window.addEventListener('resize', updateLogoDimensions);

  // Update dimensions when logo image loads (in case it wasn't loaded yet)
  logo.addEventListener('load', updateLogoDimensions);

  // Create a function to toggle the glow effect
  const toggleGlow = (duration = 2000) => {
    if (logo.classList.contains('glow')) return;

    logo.classList.add('glow');

    // Remove the glow class after the specified duration
    setTimeout(() => {
      logo.classList.remove('glow');

      // Force reflow and resume animation
      setTimeout(() => {
        logo.style.animationPlayState = 'running';
      }, 50);
    }, duration);
  };

  // Add keydown event for debugging - press 'g' to trigger glow
  document.addEventListener('keydown', (e) => {
    if (e.key === 'g' || e.key === 'G') {
      toggleGlow();
    }
  });

  // Start the FPS meter if available
  // @ts-ignore: fpsMeter is added by fps-meter.js
  if (window.fpsMeter) {
    // @ts-ignore: fpsMeter is added by fps-meter.js
    window.fpsMeter.start();
  }

  // Add corner detection based on animation timing
  const detectCorners = () => {
    if (!logo) return;

    // Get the computed style to check the animation progress
    const computedStyle = window.getComputedStyle(logo);
    const rect = logo.getBoundingClientRect();

    // Get the current position of the logo (center point)
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    // Calculate the viewport boundaries accounting for logo dimensions
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Calculate how far the center of the logo is from each edge
    // This accounts for the translate(-50%, -50%) that centers the logo
    const distanceToLeft = centerX;
    const distanceToRight = viewportWidth - centerX;
    const distanceToTop = centerY;
    const distanceToBottom = viewportHeight - centerY;

    // Threshold for considering the logo at a border (in pixels)
    const borderThreshold = 20;

    // Calculate where we are in the animation
    const animDuration = 8; // matches the 8s in CSS
    const currentTime = (Date.now() / 1000) % animDuration;

    /**
     * Checks if the current animation time is near the target corner time
     * @param {number} target - The target time in the animation (in seconds)
     * @returns {boolean} - Whether we're near the target corner
     */
    const nearCorner = (target) => {
      const threshold = 0.1; // 100ms threshold
      return (
        Math.abs((currentTime % animDuration) - target) < threshold ||
        Math.abs((currentTime % animDuration) - (animDuration + target)) <
          threshold
      );
    };

    // Update debug information if debug mode is on
    if (isDebugMode) {
      const secondsInAnim = currentTime.toFixed(1);
      const percentComplete = ((currentTime / animDuration) * 100).toFixed(0);
      body.setAttribute(
        'data-position',
        `Animation: ${secondsInAnim}s / ${animDuration}s (${percentComplete}%) - ` +
          `Dist: L:${distanceToLeft.toFixed(0)}, R:${distanceToRight.toFixed(
            0
          )}, ` +
          `T:${distanceToTop.toFixed(0)}, B:${distanceToBottom.toFixed(0)}`
      );
    }

    // Detect which corner we're near using both position and animation time
    let cornerName = '';

    // Position-based detection (primary method)
    const halfWidth = rect.width / 2;
    const halfHeight = rect.height / 2;

    if (
      distanceToLeft <= halfWidth + borderThreshold &&
      distanceToTop <= halfHeight + borderThreshold
    ) {
      cornerName = 'top-left';
    } else if (
      distanceToRight <= halfWidth + borderThreshold &&
      distanceToTop <= halfHeight + borderThreshold
    ) {
      cornerName = 'top-right';
    } else if (
      distanceToRight <= halfWidth + borderThreshold &&
      distanceToBottom <= halfHeight + borderThreshold
    ) {
      cornerName = 'bottom-right';
    } else if (
      distanceToLeft <= halfWidth + borderThreshold &&
      distanceToBottom <= halfHeight + borderThreshold
    ) {
      cornerName = 'bottom-left';
    } else {
      // Fallback to time-based detection if position doesn't indicate a corner
      if (nearCorner(0)) {
        cornerName = 'top-left';
      } else if (nearCorner(2)) {
        cornerName = 'top-right';
      } else if (nearCorner(4)) {
        cornerName = 'bottom-right';
      } else if (nearCorner(6)) {
        cornerName = 'bottom-left';
      }
    }

    // If we're at a corner, trigger the glow effect
    if (cornerName && isDebugMode) {
      console.log(
        `Corner detected: ${cornerName} at time ${currentTime.toFixed(2)}s`
      );
    }

    if (cornerName) {
      toggleGlow(2000);
    }
  };

  // For a CSS animation, we can check periodically for corners
  setInterval(detectCorners, 100); // Check every 100ms
});
