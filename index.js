import LogoAnimator2 from './logo-animator2.js';

document.addEventListener('DOMContentLoaded', () => {
  // Enable debug mode on localhost
  const isLocalhost =
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname === '';

  const logo1 = new LogoAnimator2('logo1', {
    angle: -40,
    traversalDuration: 8,
    debug: isLocalhost,
  });

  const logo2 = new LogoAnimator2('logo2', {
    angle: 20,
    traversalDuration: 10,
    debug: isLocalhost,
  });

  logo1.initialize();
  logo2.initialize();
});
