import LogoAnimator from './logo-animator.js';

document.addEventListener('DOMContentLoaded', () => {
  // Enable debug mode on localhost
  const isLocalhost =
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname === '' ||
    window.location.hostname.endsWith('.loca.lt');

  const logo1 = new LogoAnimator('logo1', {
    angle: -40,
    traversalDuration: 8,
    debug: isLocalhost,
  });

  // const logo2 = new LogoAnimator('logo2', {
  //   angle: 20,
  //   traversalDuration: 10,
  //   debug: isLocalhost,
  // });

  logo1.initialize();
  // logo2.initialize();
});
