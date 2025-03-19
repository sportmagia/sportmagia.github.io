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

  if (!logo) {
    console.error('Logo element not found');
    return;
  }

  // Center the logo initially
  logo.style.position = 'absolute';
  logo.style.left = '50vw';
  logo.style.top = '50vh';
  logo.style.transform = 'translate(-50%, -50%)';
  logo.style.width = '20%';
  logo.style.minWidth = '200px';

  // Start the FPS meter if available
  // @ts-ignore: fpsMeter is added by fps-meter.js
  if (window.fpsMeter) {
    // @ts-ignore: fpsMeter is added by fps-meter.js
    window.fpsMeter.start();
  }
});
