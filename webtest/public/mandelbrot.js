(() => {
  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d', { alpha: false });
  const iterInput = document.getElementById('iter');
  const iterVal = document.getElementById('iterVal');
  const paletteSel = document.getElementById('palette');
  const zoomInBtn = document.getElementById('zoomIn');
  const zoomOutBtn = document.getElementById('zoomOut');
  const resetBtn = document.getElementById('reset');

  // Viewport in complex plane
  let cx = -0.5; // center x
  let cy = 0.0;  // center y
  let scale = 3.0; // width of view in complex plane
  let maxIter = parseInt(iterInput.value, 10) || 200;
  let renderToken = 0;

  function resizeCanvas() {
    const dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2));
    const widthCSS = Math.min(1200, document.querySelector('main').clientWidth - 4);
    const heightCSS = Math.round(widthCSS * 0.625); // 16:10 aspect
    canvas.style.width = widthCSS + 'px';
    canvas.style.height = heightCSS + 'px';
    const w = Math.floor(widthCSS * dpr);
    const h = Math.floor(heightCSS * dpr);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
  }

  function colorFn(iter, zn, palette) {
    if (iter >= maxIter) return { r: 0, g: 0, b: 0 };
    // Smooth iteration count
    const mu = iter + 1 - Math.log2(Math.log2(zn));
    const t = mu / maxIter; // 0..1
    if (palette === 'blue') {
      const r = Math.floor(20 + 50 * t);
      const g = Math.floor(40 + 120 * t);
      const b = Math.floor(120 + 135 * t);
      return { r, g, b };
    }
    if (palette === 'fire') {
      const r = Math.floor(50 + 205 * t);
      const g = Math.floor(10 + 80 * Math.pow(t, 0.6));
      const b = Math.floor(10 + 30 * Math.pow(1 - t, 3));
      return { r, g, b };
    }
    // HSL palette converted to RGB
    const hue = 360 * t;
    const sat = 100;
    const light = 50;
    // Convert HSL to RGB
    const c = (1 - Math.abs(2 * light / 100 - 1)) * (sat / 100);
    const hp = hue / 60;
    const x = c * (1 - Math.abs((hp % 2) - 1));
    let r1 = 0, g1 = 0, b1 = 0;
    if (hp >= 0 && hp < 1) { r1 = c; g1 = x; b1 = 0; }
    else if (hp < 2) { r1 = x; g1 = c; b1 = 0; }
    else if (hp < 3) { r1 = 0; g1 = c; b1 = x; }
    else if (hp < 4) { r1 = 0; g1 = x; b1 = c; }
    else if (hp < 5) { r1 = x; g1 = 0; b1 = c; }
    else { r1 = c; g1 = 0; b1 = x; }
    const m = (light / 100) - c / 2;
    return { r: Math.round((r1 + m) * 255), g: Math.round((g1 + m) * 255), b: Math.round((b1 + m) * 255) };
  }

  function render() {
    renderToken++;
    const token = renderToken;
    const w = canvas.width;
    const h = canvas.height;
    const img = ctx.createImageData(w, 1); // render row-by-row
    const palette = paletteSel.value;
    const xMin = cx - scale / 2;
    const yMin = cy - (scale * h / w) / 2;
    const xStep = scale / w;
    const yStep = (scale * h / w) / h;

    let y = 0;
    function renderRow() {
      if (token !== renderToken) return; // canceled
      if (y >= h) return;
      const y0 = yMin + y * yStep;
      const data = img.data;
      let idx = 0;
      for (let x = 0; x < w; x++) {
        const x0 = xMin + x * xStep;
        let a = 0, b = 0; // z = a + bi
        let i = 0;
        let aa = 0, bb = 0;
        for (; i < maxIter && aa + bb <= 4; i++) {
          b = 2 * a * b + y0;
          a = aa - bb + x0;
          aa = a * a; bb = b * b;
        }
        const zn = Math.sqrt(aa + bb) || 1.0;
        const { r, g, b: bl } = colorFn(i, zn, palette);
        data[idx++] = r;
        data[idx++] = g;
        data[idx++] = bl;
        data[idx++] = 255;
      }
      ctx.putImageData(img, 0, y);
      y++;
      if (y % 8 === 0) {
        // yield to UI periodically
        requestAnimationFrame(renderRow);
      } else {
        renderRow();
      }
    }
    renderRow();
  }

  function canvasToComplex(px, py) {
    const w = canvas.width, h = canvas.height;
    const xMin = cx - scale / 2;
    const yMin = cy - (scale * h / w) / 2;
    const xStep = scale / w;
    const yStep = (scale * h / w) / h;
    return [xMin + px * xStep, yMin + py * yStep];
  }

  function zoomAt(clientX, clientY, factor) {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2));
    const px = (clientX - rect.left) * dpr;
    const py = (clientY - rect.top) * dpr;
    const [nx, ny] = canvasToComplex(px, py);
    cx = nx; cy = ny; scale *= factor;
    render();
  }

  // Events
  window.addEventListener('resize', () => { resizeCanvas(); render(); });
  iterInput.addEventListener('input', () => { maxIter = parseInt(iterInput.value, 10); iterVal.textContent = String(maxIter); render(); });
  paletteSel.addEventListener('change', () => render());
  zoomInBtn.addEventListener('click', () => zoomAt(canvas.clientWidth/2, canvas.clientHeight/2, 0.5));
  zoomOutBtn.addEventListener('click', () => zoomAt(canvas.clientWidth/2, canvas.clientHeight/2, 2.0));
  resetBtn.addEventListener('click', () => { cx=-0.5; cy=0; scale=3.0; render(); });
  canvas.addEventListener('click', (e) => {
    const factor = e.shiftKey ? 2.0 : 0.5;
    zoomAt(e.clientX, e.clientY, factor);
  });

  // Init
  resizeCanvas();
  iterVal.textContent = String(maxIter);
  render();
})();

