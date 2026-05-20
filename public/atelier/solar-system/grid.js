// Logical character grid backed by typed arrays. Flushes to canvas via fillText.
window.SolarSys = window.SolarSys || {};

(function (NS) {
  class CharBuffer {
    constructor(cols, rows) {
      this.resize(cols, rows);
    }

    resize(cols, rows) {
      this.cols = cols;
      this.rows = rows;
      const n = cols * rows;
      this.chars = new Array(n);
      this.colors = new Array(n);
      this.alphas = new Float32Array(n);
      this.clear();
    }

    clear() {
      const n = this.cols * this.rows;
      for (let i = 0; i < n; i++) {
        this.chars[i] = null;
        this.colors[i] = null;
        this.alphas[i] = 0;
      }
    }

    // Higher-alpha wins. Prevents flicker when overlapping sprites compete.
    put(x, y, ch, color, alpha) {
      if (x < 0 || x >= this.cols || y < 0 || y >= this.rows) return;
      if (alpha <= 0) return;
      const i = y * this.cols + x;
      if (alpha >= this.alphas[i]) {
        this.chars[i] = ch;
        this.colors[i] = color;
        this.alphas[i] = alpha > 1 ? 1 : alpha;
      }
    }

    // Force write (overrides alpha-wins) — used for top-priority layers like the sun core.
    force(x, y, ch, color, alpha) {
      if (x < 0 || x >= this.cols || y < 0 || y >= this.rows) return;
      const i = y * this.cols + x;
      this.chars[i] = ch;
      this.colors[i] = color;
      this.alphas[i] = alpha > 1 ? 1 : alpha;
    }

    flush(ctx, cellW, cellH) {
      ctx.textBaseline = 'top';
      ctx.textAlign = 'left';
      const cols = this.cols, rows = this.rows;
      let lastColor = null;
      let lastAlpha = -1;
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const i = y * cols + x;
          const ch = this.chars[i];
          if (!ch || this.alphas[i] <= 0) continue;
          const color = this.colors[i];
          const alpha = this.alphas[i];
          if (color !== lastColor) {
            ctx.fillStyle = color;
            lastColor = color;
          }
          if (alpha !== lastAlpha) {
            ctx.globalAlpha = alpha;
            lastAlpha = alpha;
          }
          ctx.fillText(ch, x * cellW, y * cellH);
        }
      }
      ctx.globalAlpha = 1;
    }
  }

  NS.CharBuffer = CharBuffer;
})(window.SolarSys);
