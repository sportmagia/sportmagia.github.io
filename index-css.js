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

import LogoAnimator from './logo-animator.js';

document.addEventListener('DOMContentLoaded', () => {
  // Enable debug mode on localhost
  const isLocalhost =
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname === '';

  const logoAnimator = new LogoAnimator('logo', {
    angle: 40,
    speed: 300,
    debug: isLocalhost,
  });

  logoAnimator.initialize();
});
