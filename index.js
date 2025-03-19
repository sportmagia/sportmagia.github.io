// @ts-check

/**
 * Class representing a draggable and scalable image on canvas
 */
class CanvasImage {
  /**
   * @param {string} src - Path to the image
   * @param {number} x - Initial x position
   * @param {number} y - Initial y position
   * @param {number} [scale=1.0] - Initial scale
   */
  constructor(src, x, y, scale = 1.0) {
    this.x = x;
    this.y = y;
    this.width = 0;
    this.height = 0;
    this.scale = scale;
    this.isDragging = false;
    this.dragOffsetX = 0;
    this.dragOffsetY = 0;

    // Create and load the image
    this.image = new Image();
    this.image.src = src;

    // Set natural dimensions once loaded
    this.image.onload = () => {
      this.width = this.image.naturalWidth;
      this.height = this.image.naturalHeight;
      if (this.onLoadCallback) {
        this.onLoadCallback();
      }
    };
  }

  /**
   * Set callback for when image is loaded
   * @param {Function} callback
   */
  setOnLoadCallback(callback) {
    this.onLoadCallback = callback;
    // If image is already loaded, call callback immediately
    if (this.image.complete && this.width > 0) {
      callback();
    }
  }

  /**
   * Check if a point is inside the image
   * @param {number} x - The x coordinate to check
   * @param {number} y - The y coordinate to check
   * @returns {boolean} - Whether the point is inside the image
   */
  isPointInside(x, y) {
    const halfWidth = (this.width * this.scale) / 2;
    const halfHeight = (this.height * this.scale) / 2;
    return (
      x >= this.x - halfWidth &&
      x <= this.x + halfWidth &&
      y >= this.y - halfHeight &&
      y <= this.y + halfHeight
    );
  }

  /**
   * Start dragging the image
   * @param {number} mouseX - Mouse x position
   * @param {number} mouseY - Mouse y position
   */
  startDrag(mouseX, mouseY) {
    if (this.isPointInside(mouseX, mouseY)) {
      this.isDragging = true;
      this.dragOffsetX = mouseX - this.x;
      this.dragOffsetY = mouseY - this.y;
      return true;
    }
    return false;
  }

  /**
   * Update position during drag
   * @param {number} mouseX - Mouse x position
   * @param {number} mouseY - Mouse y position
   * @returns {boolean} - Whether the position was updated
   */
  drag(mouseX, mouseY) {
    if (this.isDragging) {
      this.x = mouseX - this.dragOffsetX;
      this.y = mouseY - this.dragOffsetY;
      return true;
    }
    return false;
  }

  /**
   * Stop dragging
   */
  stopDrag() {
    this.isDragging = false;
  }

  /**
   * Adjust scale of the image
   * @param {number} delta - Amount to adjust scale by
   * @param {number} mouseX - Mouse x position for hit testing
   * @param {number} mouseY - Mouse y position for hit testing
   * @returns {boolean} - Whether scale was adjusted
   */
  adjustScale(delta, mouseX, mouseY) {
    if (this.isPointInside(mouseX, mouseY)) {
      // Adjust scale based on delta
      this.scale += delta > 0 ? -0.1 : 0.1;
      // Limit minimum and maximum scale
      this.scale = Math.max(0.2, Math.min(3.0, this.scale));
      return true;
    }
    return false;
  }

  /**
   * Draw the image on the canvas
   * @param {CanvasRenderingContext2D} ctx - The canvas context to draw on
   */
  draw(ctx) {
    if (this.image.complete && this.width > 0) {
      ctx.drawImage(
        this.image,
        this.x - (this.width * this.scale) / 2,
        this.y - (this.height * this.scale) / 2,
        this.width * this.scale,
        this.height * this.scale
      );
    }
  }
}

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

    // Redraw scene after resize
    drawScene();
  };

  // Function to draw the scene background
  const drawBackground = () => {
    ctx.fillStyle = 'red';
    ctx.fillRect(0, 0, canvas.width / 2, canvas.height / 2);
  };

  // Create logo instance
  const logo = new CanvasImage(
    'sm-logo-fb-clean1.png',
    canvas.width / 2,
    canvas.height / 2
  );

  // Draw the complete scene
  const drawScene = () => {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background elements
    drawBackground();

    // Draw the logo
    logo.draw(ctx);
  };

  // Set up callback for when logo is loaded
  logo.setOnLoadCallback(drawScene);

  // Initial resize
  resizeCanvas();

  // Event listeners for logo manipulation
  canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (logo.startDrag(mouseX, mouseY)) {
      // No need to redraw here, will be handled in mousemove
    }
  });

  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (logo.drag(mouseX, mouseY)) {
      drawScene();
    }
  });

  canvas.addEventListener('mouseup', () => {
    logo.stopDrag();
  });

  canvas.addEventListener('wheel', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (logo.adjustScale(e.deltaY, mouseX, mouseY)) {
      e.preventDefault();
      drawScene();
    }
  });

  console.log(canvas.width, canvas.height);

  // Handle window resizing
  // window.addEventListener('resize', resizeCanvas);
});
