document.addEventListener('DOMContentLoaded', () => {
  console.log('loaded');
  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'red';
  ctx.fillRect(0, 0, 100, canvas.height);
});
