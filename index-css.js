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

  // Physics settings
  const angle = 40 * (Math.PI / 180); // 40 degrees in radians
  const speed = 200; // Pixels per second - this controls animation duration

  // Velocity components
  let velocityX = Math.cos(angle) * speed;
  let velocityY = Math.sin(angle) * speed;

  // Current position tracking
  let currentX = window.innerWidth / 2; // Center X
  let currentY = window.innerHeight / 2; // Center Y

  // Animation state
  let animationInProgress = false;
  let animationEndTime = 0;

  // Timeout tracking
  /** @type {ReturnType<typeof setTimeout>|undefined} */
  let logoLoadTimeout;
  /** @type {ReturnType<typeof setTimeout>|undefined} */
  let animationSegmentTimeout;
  /** @type {ReturnType<typeof setTimeout>|undefined} */
  let nextAnimationTimeout;
  /** @type {ReturnType<typeof setTimeout>|undefined} */
  let glowTimeout;
  /** @type {ReturnType<typeof setTimeout>|undefined} */
  let resizeTimeout;

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

  // Set logo dimensions based on viewport
  const updateLogoDimensions = () => {
    // Calculate logo width - 20% of viewport with minimum 200px
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const baseWidth = Math.max(viewportWidth * 0.2, 200);

    // Set logo width
    logo.style.width = `${baseWidth}px`;

    // Clear any existing timeout
    clearTimeout(logoLoadTimeout);

    // Wait for the logo to load/render to get its actual dimensions
    logoLoadTimeout = setTimeout(() => {
      const logoRect = logo.getBoundingClientRect();
      const logoWidth = logoRect.width;
      const logoHeight = logoRect.height;

      if (isDebugMode) {
        console.log(
          `Logo dimensions: ${logoWidth.toFixed(1)} x ${logoHeight.toFixed(
            1
          )}px`
        );
      }

      // Update debug data attributes
      body.setAttribute(
        'data-logo-size',
        `${logoWidth.toFixed(0)} x ${logoHeight.toFixed(0)}px`
      );

      // Also set viewport dimensions for debugging
      body.setAttribute(
        'data-viewport',
        `${viewportWidth.toFixed(0)} x ${viewportHeight.toFixed(0)}px`
      );

      // We'll start the animation from the center
      currentX = viewportWidth / 2;
      currentY = viewportHeight / 2;

      // Set initial position directly with CSS variables for animation
      document.documentElement.style.setProperty('--start-x', `${currentX}px`);
      document.documentElement.style.setProperty('--start-y', `${currentY}px`);
      document.documentElement.style.setProperty('--target-x', `${currentX}px`);
      document.documentElement.style.setProperty('--target-y', `${currentY}px`);

      // Start the animation
      if (!animationInProgress) {
        calculateNextPosition();
      }
    }, 100); // Small delay to ensure image is rendered
  };

  // Calculate the next target position based on current position and velocity
  const calculateNextPosition = () => {
    // Get current dimensions
    const logoRect = logo.getBoundingClientRect();
    const logoWidth = logoRect.width;
    const logoHeight = logoRect.height;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Use the actual current position from the DOM element
    // This prevents any position drift that might occur
    const actualPosition = {
      x: parseFloat(window.getComputedStyle(logo).left) || currentX,
      y: parseFloat(window.getComputedStyle(logo).top) || currentY,
    };

    // Update our tracking variables to match reality
    currentX = actualPosition.x;
    currentY = actualPosition.y;

    // Get accurate logo dimensions by measuring the actual rendered element
    const actualLogoRect = logo.getBoundingClientRect();

    if (isDebugMode) {
      console.log(
        `Actual logo position: ${actualLogoRect.left}x${actualLogoRect.top}, size: ${actualLogoRect.width}x${actualLogoRect.height}`
      );
    }

    // Calculate collision bounds (where the logo's center point can go)
    // Account for transform: translate(-50%, -50%) in the CSS
    const leftBound = logoWidth / 2;
    const rightBound = viewportWidth - logoWidth / 2;
    const topBound = logoHeight / 2;
    const bottomBound = viewportHeight - logoHeight / 2;

    if (isDebugMode) {
      console.log(
        `Bounds: left=${leftBound}, right=${rightBound}, top=${topBound}, bottom=${bottomBound}`
      );
      console.log(`Current position: x=${currentX}, y=${currentY}`);
    }

    // Calculate the time it would take to hit each wall
    // Assuming the logo continues in the current direction
    let timeToHitX = Infinity;
    let timeToHitY = Infinity;
    let hitXWall = '';
    let hitYWall = '';

    if (velocityX > 0) {
      // Moving right
      timeToHitX = (rightBound - currentX) / velocityX;
      hitXWall = 'right';
    } else if (velocityX < 0) {
      // Moving left
      timeToHitX = (leftBound - currentX) / velocityX;
      hitXWall = 'left';
    }

    if (velocityY > 0) {
      // Moving down
      timeToHitY = (bottomBound - currentY) / velocityY;
      hitYWall = 'bottom';
    } else if (velocityY < 0) {
      // Moving up
      timeToHitY = (topBound - currentY) / velocityY;
      hitYWall = 'top';
    }

    // Determine which wall will be hit first
    const timeToHit = Math.min(timeToHitX, timeToHitY);

    // Calculate the position where the logo will hit the wall
    let nextX = currentX + velocityX * timeToHit;
    let nextY = currentY + velocityY * timeToHit;

    // Ensure we don't go out of bounds
    nextX = Math.max(leftBound, Math.min(rightBound, nextX));
    nextY = Math.max(topBound, Math.min(bottomBound, nextY));

    // Determine which wall we'll hit
    const hitWallX = timeToHitX <= timeToHitY && !!hitXWall;
    const hitWallY = timeToHitY <= timeToHitX && !!hitYWall;

    // Check if we're hitting a corner (both walls at the same time)
    const hitCorner =
      Math.abs(timeToHitX - timeToHitY) < 0.1 && !!hitXWall && !!hitYWall;

    if (hitCorner) {
      if (isDebugMode) {
        console.log(`Corner hit detected! ${hitXWall}-${hitYWall}`);
      }
      // Trigger glow effect for corner collisions
      toggleGlow(2000);
    } else if (isDebugMode && (hitWallX || hitWallY)) {
      console.log(`Wall hit detected: ${hitWallX ? hitXWall : hitYWall}`);
    }

    // Update velocity for the next segment
    if (hitWallX || hitCorner) {
      velocityX = -velocityX; // Reverse x direction
    }

    if (hitWallY || hitCorner) {
      velocityY = -velocityY; // Reverse y direction
    }

    // Directly set CSS variables for the animation keyframes
    document.documentElement.style.setProperty('--start-x', `${currentX}px`);
    document.documentElement.style.setProperty('--start-y', `${currentY}px`);
    document.documentElement.style.setProperty('--target-x', `${nextX}px`);
    document.documentElement.style.setProperty('--target-y', `${nextY}px`);

    // Calculate animation duration based on distance and speed
    const distance = Math.sqrt(
      Math.pow(nextX - currentX, 2) + Math.pow(nextY - currentY, 2)
    );
    const duration = distance / speed; // in seconds

    document.documentElement.style.setProperty(
      '--animation-duration',
      `${duration.toFixed(2)}s`
    );

    // Update current position for next calculation
    currentX = nextX;
    currentY = nextY;

    // Calculate when this animation will end
    animationEndTime = Date.now() + duration * 1000;

    // Start the animation
    animationInProgress = true;

    // Immediate animation restart technique
    requestAnimationFrame(() => {
      // Set explicit position to ensure starting point
      logo.style.left =
        document.documentElement.style.getPropertyValue('--start-x');
      logo.style.top =
        document.documentElement.style.getPropertyValue('--start-y');

      // // Temporarily disable animation
      logo.style.animation = 'none';

      // // Force reflow
      void logo.offsetWidth;

      // Remove explicit animation style
      logo.style.animation = '';
    });

    // Set up the next animation segment
    // Clear any existing animation timeouts
    clearTimeout(animationSegmentTimeout);
    clearTimeout(nextAnimationTimeout);

    animationSegmentTimeout = setTimeout(() => {
      // Set the exact position at the end of the animation to ensure seamless transition
      logo.style.left = `${nextX}px`;
      logo.style.top = `${nextY}px`;

      // Schedule the next segment after a very short delay
      nextAnimationTimeout = setTimeout(() => {
        animationInProgress = false;
        calculateNextPosition();
      }, 16); // 1 frame at 60fps
    }, duration * 1000);

    if (isDebugMode) {
      console.log(
        `Animating to [${nextX.toFixed(0)}, ${nextY.toFixed(
          0
        )}] in ${duration.toFixed(2)}s`
      );
    }
  };

  // Function to clear all timeouts
  const clearAllTimeouts = () => {
    clearTimeout(logoLoadTimeout);
    clearTimeout(animationSegmentTimeout);
    clearTimeout(nextAnimationTimeout);
    clearTimeout(glowTimeout);
    clearTimeout(resizeTimeout);
  };

  // Center the logo initially
  logo.style.position = 'absolute';
  logo.style.left = '50vw';
  logo.style.top = '50vh';

  // Add debug button
  addDebugButton();

  // Initialize debug mode
  updateDebugElements();

  // Set initial dimensions and update CSS variables
  updateLogoDimensions();

  // Update dimensions when window is resized
  window.addEventListener('resize', () => {
    // Cancel any pending resize handler
    clearTimeout(resizeTimeout);

    // Debounce the resize handler to avoid too many calls
    resizeTimeout = setTimeout(() => {
      // Stop any current animation
      if (animationInProgress) {
        logo.classList.remove('in-motion');
        animationInProgress = false;
      }

      // Clear all timeouts to ensure clean state
      clearAllTimeouts();

      // Update dimensions and restart animation
      updateLogoDimensions();

      // Log viewport dimensions in debug mode
      if (isDebugMode) {
        console.log(
          `Viewport resized: ${window.innerWidth}x${window.innerHeight}`
        );
      }
    }, 250); // Wait for resize to complete
  });

  // Update dimensions when logo image loads (in case it wasn't loaded yet)
  logo.addEventListener('load', updateLogoDimensions);

  // Create a function to toggle the glow effect
  const toggleGlow = (duration = 2000) => {
    if (logo.classList.contains('glow')) return;

    logo.classList.add('glow');

    // Clear any existing glow timeout
    clearTimeout(glowTimeout);

    // Remove the glow class after the specified duration
    glowTimeout = setTimeout(() => {
      logo.classList.remove('glow');
    }, duration);
  };

  // Add keydown event for debugging - press 'g' to trigger glow
  document.addEventListener('keydown', (e) => {
    if (e.key === 'g' || e.key === 'G') {
      toggleGlow();
    }
  });

  // Function to update debug position information
  const updateDebugPosition = () => {
    if (!isDebugMode) return;

    const logoRect = logo.getBoundingClientRect();
    const centerX = logoRect.left + logoRect.width / 2;
    const centerY = logoRect.top + logoRect.height / 2;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const timeLeft = Math.max(0, (animationEndTime - Date.now()) / 1000);

    // Update position data attribute with comprehensive information
    body.setAttribute(
      'data-position',
      `Pos: ${centerX.toFixed(0)}x${centerY.toFixed(0)} ` +
        `Target: [${currentX.toFixed(0)}, ${currentY.toFixed(0)}] ` +
        `Vel: ${velocityX.toFixed(1)}x${velocityY.toFixed(1)} ` +
        `Time: ${timeLeft.toFixed(1)}s`
    );

    // Keep viewport size updated
    body.setAttribute(
      'data-viewport',
      `${viewportWidth.toFixed(0)} x ${viewportHeight.toFixed(0)}px`
    );
  };

  // Start the FPS meter if available
  // @ts-ignore: fpsMeter is added by fps-meter.js
  if (window.fpsMeter) {
    // @ts-ignore: fpsMeter is added by fps-meter.js
    window.fpsMeter.start();
  }

  // Update debug position periodically
  setInterval(updateDebugPosition, 100);
});
