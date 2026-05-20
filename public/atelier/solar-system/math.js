// Pure math utilities: easing, lerp, distance compression, ellipse, sphere UV mapping.
window.SolarSys = window.SolarSys || {};

(function (NS) {
  const TAU = Math.PI * 2;

  function lerp(a, b, t) { return a + (b - a) * t; }
  function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }

  // Easing functions
  function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }
  function easeInOutQuart(t) {
    return t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2;
  }
  function easeOutBack(t) {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  }

  // Mulberry32 deterministic PRNG
  function mulberry32(seed) {
    let s = seed >>> 0;
    return function () {
      s = (s + 0x6D2B79F5) | 0;
      let t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // Identity — we now use `displayDistance` (artificial, spread for legibility)
  // instead of compressing real AU. Renderer/picker always pass displayDistance.
  function compressR(r) { return r; }
  function compressVec(auX, auY) { return { x: auX, y: auY }; }

  // Ellipse parameterization. Sun is at one focus; center offset by c = a*e.
  // theta is the parametric angle around the ellipse (not true anomaly — we
  // accept slight Keplerian inaccuracy; visually invisible).
  function ellipsePoint(a, e, theta) {
    const b = a * Math.sqrt(1 - e * e);
    const c = a * e;
    return {
      x: -c + a * Math.cos(theta),
      y: b * Math.sin(theta)
    };
  }

  // AU coords -> cell coords given camera state.
  // The orbital plane is (a) foreshortened by NS.VIEW_SQUASH then (b) rotated
  // by NS.VIEW_TILT in PIXEL space, pivoting on the sun's screen position.
  // Rotating in pixel space matters because cells are non-square (taller than
  // wide) — rotating cell-space directly would skew the angle.
  function auToCell(auX, auY, cam, cols, rows) {
    const squash = (window.SolarSys && window.SolarSys.VIEW_SQUASH) || 0.5;
    const tilt = (window.SolarSys && window.SolarSys.VIEW_TILT) || 0;
    const cellMetrics = window.SolarSys && window.SolarSys.__cellMetrics;
    const cellW = cellMetrics ? cellMetrics.w : 9;
    const cellH = cellMetrics ? cellMetrics.h : 18;
    // Sun cell anchor (rotation pivot). cam.cx shifts the sun left/right on screen.
    const sunCellX = cols / 2 - cam.cx * cam.scale;
    const sunCellY = rows / 2 - cam.cy * cam.scale * squash;
    // Body offset from sun, in pixel space.
    const dxp = auX * cam.scale * cellW;
    const dyp = auY * cam.scale * squash * cellH;
    // Rotate.
    const cosT = Math.cos(tilt), sinT = Math.sin(tilt);
    const rxp = dxp * cosT - dyp * sinT;
    const ryp = dxp * sinT + dyp * cosT;
    // Back to cells + sun anchor.
    return {
      x: Math.round(sunCellX + rxp / cellW),
      y: Math.round(sunCellY + ryp / cellH)
    };
  }

  // Inverse: cell coords -> display-AU. (Currently unused after wheel zoom
  // was removed, but kept for API completeness; reverses the tilt + squash.)
  function cellToAu(cellX, cellY, cam, cols, rows) {
    const squash = (window.SolarSys && window.SolarSys.VIEW_SQUASH) || 0.5;
    const tilt = (window.SolarSys && window.SolarSys.VIEW_TILT) || 0;
    const cellMetrics = window.SolarSys && window.SolarSys.__cellMetrics;
    const cellW = cellMetrics ? cellMetrics.w : 9;
    const cellH = cellMetrics ? cellMetrics.h : 18;
    const sunCellX = cols / 2 - cam.cx * cam.scale;
    const sunCellY = rows / 2 - cam.cy * cam.scale * squash;
    const rxp = (cellX - sunCellX) * cellW;
    const ryp = (cellY - sunCellY) * cellH;
    const cosT = Math.cos(-tilt), sinT = Math.sin(-tilt);
    const dxp = rxp * cosT - ryp * sinT;
    const dyp = rxp * sinT + ryp * cosT;
    return {
      x: dxp / (cam.scale * cellW),
      y: dyp / (cam.scale * squash * cellH)
    };
  }

  NS.math = {
    TAU, lerp, clamp,
    easeOutCubic, easeInOutQuart, easeOutBack,
    mulberry32,
    compressR, compressVec,
    ellipsePoint,
    auToCell, cellToAu
  };
})(window.SolarSys);
