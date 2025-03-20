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

      // Calculate bounce positions
      const maxX = viewportWidth - logoWidth;
      const maxY = viewportHeight - logoHeight;

      document.documentElement.style.setProperty('--max-x', `${maxX}px`);
      document.documentElement.style.setProperty('--max-y', `${maxY}px`);

      // Update CSS variables with translation offsets for corner detection
      // Since the logo is centered with translate(-50%, -50%), the effective
      // position is offset by half the logo's dimensions
      document.documentElement.style.setProperty(
        '--translate-x',
        `${logoWidth / 2}px`
      );
      document.documentElement.style.setProperty(
        '--translate-y',
        `${logoHeight / 2}px`
      );

      // Update debug data attributes
      body.setAttribute(
        'data-logo-size',
        `${logoWidth.toFixed(0)} x ${logoHeight.toFixed(0)}px`
      );

      // We'll start the animation from the center
      currentX = viewportWidth / 2;
      currentY = viewportHeight / 2;

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

    // Calculate collision bounds (where the center point can go)
    const halfWidth = logoWidth / 2;
    const halfHeight = logoHeight / 2;
    const leftBound = halfWidth;
    const rightBound = viewportWidth - halfWidth;
    const topBound = halfHeight;
    const bottomBound = viewportHeight - halfHeight;

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

    // Update CSS variables for the animation
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

    // Start the animation
    animationInProgress = true;
    logo.classList.add('in-motion');

    // Update current position for next calculation
    currentX = nextX;
    currentY = nextY;

    // Calculate when this animation will end
    animationEndTime = Date.now() + duration * 1000;

    // Set up the next animation segment
    setTimeout(() => {
      // Remove the animation class
      logo.classList.remove('in-motion');

      // Force a reflow to ensure CSS animation restarts
      void logo.offsetWidth;

      // Calculate and start the next animation segment
      setTimeout(() => {
        animationInProgress = false;
        calculateNextPosition();
      }, 50);
    }, duration * 1000);

    if (isDebugMode) {
      console.log(
        `Animating to [${nextX.toFixed(0)}, ${nextY.toFixed(
          0
        )}] in ${duration.toFixed(2)}s`
      );
    }
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

    const timeLeft = Math.max(0, (animationEndTime - Date.now()) / 1000);

    body.setAttribute(
      'data-position',
      `Pos: ${centerX.toFixed(0)}x${centerY.toFixed(0)} ` +
        `Target: [${currentX.toFixed(0)}, ${currentY.toFixed(0)}] ` +
        `Vel: ${velocityX.toFixed(1)}x${velocityY.toFixed(1)} ` +
        `Time: ${timeLeft.toFixed(1)}s`
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
