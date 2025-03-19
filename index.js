// @ts-check

document.addEventListener('DOMContentLoaded', () => {
  console.log('loaded');

  /** @type {HTMLCanvasElement} */
  const canvas = /** @type {HTMLCanvasElement} */ (
    document.getElementById('canvas')
  );

  if (!canvas) {
    console.error('Canvas element not found');
    return;
  }

  /** @type {CanvasRenderingContext2D|null} */
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    console.error('Could not get 2D context from canvas');
    return;
  }

  // Function to resize canvas and redraw
  const resizeCanvas = () => {
    // Set canvas dimensions to match its CSS display size
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;

    // Redraw after resize
    // drawScene();
  };

  // Function to draw the scene
  const drawScene1 = () => {
    ctx.fillStyle = 'red';
    ctx.fillRect(0, 0, canvas.width / 2, canvas.height / 2);
  };

  // Initial resize
  resizeCanvas();

  // Load the logo image
  const logoImage = new Image();
  logoImage.src = 'sm-logo-fb-clean1.png';

  // Logo state for manipulation
  const logo = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    width: 100,
    height: 100,
    isDragging: false,
    dragOffsetX: 0,
    dragOffsetY: 0,
    scale: 1.0,
  };

  // Draw the scene with the logo
  const drawSceneWithLogo = () => {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background elements
    drawScene1();

    // Draw the logo if image is loaded
    if (logoImage.complete) {
      ctx.drawImage(
        logoImage,
        logo.x - (logo.width * logo.scale) / 2,
        logo.y - (logo.height * logo.scale) / 2,
        logo.width * logo.scale,
        logo.height * logo.scale
      );
    }
  };

  // Check if a point is inside the logo
  const isPointInLogo = (x, y) => {
    const halfWidth = (logo.width * logo.scale) / 2;
    const halfHeight = (logo.height * logo.scale) / 2;
    return (
      x >= logo.x - halfWidth &&
      x <= logo.x + halfWidth &&
      y >= logo.y - halfHeight &&
      y <= logo.y + halfHeight
    );
  };

  // Event listeners for logo manipulation
  canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (isPointInLogo(mouseX, mouseY)) {
      logo.isDragging = true;
      logo.dragOffsetX = mouseX - logo.x;
      logo.dragOffsetY = mouseY - logo.y;
    }
  });

  canvas.addEventListener('mousemove', (e) => {
    if (logo.isDragging) {
      const rect = canvas.getBoundingClientRect();
      logo.x = e.clientX - rect.left - logo.dragOffsetX;
      logo.y = e.clientY - rect.top - logo.dragOffsetY;
      drawSceneWithLogo();
    }
  });

  canvas.addEventListener('mouseup', () => {
    logo.isDragging = false;
  });

  canvas.addEventListener('wheel', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (isPointInLogo(mouseX, mouseY)) {
      e.preventDefault();
      // Adjust scale based on wheel direction
      logo.scale += e.deltaY > 0 ? -0.1 : 0.1;
      // Limit minimum and maximum scale
      logo.scale = Math.max(0.2, Math.min(3.0, logo.scale));
      drawSceneWithLogo();
    }
  });

  // Wait for the image to load before initial draw
  logoImage.onload = () => {
    // Update the draw function to include the logo
    drawSceneWithLogo();
  };

  console.log(canvas.width, canvas.height);

  //
  // Handle window resizing
  // window.addEventListener('resize', resizeCanvas);
});
