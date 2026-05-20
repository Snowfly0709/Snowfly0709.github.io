// Frame pipeline: celestial grid, sparse stars, orbit rings, asteroid belt,
// dot-matrix planet globes, comet, half-globe detail view, native overlays.
window.SolarSys = window.SolarSys || {};

(function (NS) {
  const m = NS.math;
  const TAU = m.TAU;

  // ----- One-time generated arrays / state -----
  let _stars = null;
  let _asteroids = null;
  let _cometState = null;

  // Character palettes for the dot-matrix.
  const LAND_CHARS  = ['#', '*'];
  const OCEAN_CHARS = ['·', ','];
  const POLAR_CHARS = ['*', '+'];
  const STORM_CHARS = ['@', 'O'];

  // ----- Init -----
  function initStars() {
    const rng = m.mulberry32(NS.STARS.seed);
    _stars = [];
    for (let i = 0; i < NS.STARS.count; i++) {
      _stars.push({
        u: rng(), v: rng(),
        char: NS.STARS.chars[Math.floor(rng() * NS.STARS.chars.length)],
        alpha: m.lerp(NS.STARS.minAlpha, NS.STARS.maxAlpha, rng())
      });
    }
  }

  function initAsteroids() {
    if (!NS.ASTEROIDS) { _asteroids = []; return; }
    const rng = m.mulberry32(NS.ASTEROIDS.seed);
    _asteroids = [];
    for (let i = 0; i < NS.ASTEROIDS.count; i++) {
      _asteroids.push({
        baseAngle: rng() * TAU,
        radius: m.lerp(NS.ASTEROIDS.minAU, NS.ASTEROIDS.maxAU, rng()),
        jitter: rng() * 0.4 - 0.2,
        charIdx: Math.floor(rng() * NS.ASTEROIDS.chars.length),
        radialJitter: (rng() - 0.5) * 0.15
      });
    }
  }

  function initFields() {
    if (!_stars) initStars();
    if (!_asteroids) initAsteroids();
    if (!_cometState) _cometState = { nextSpawn: 0, active: null };
  }

  // Drop the cached asteroid belt so the next frame rebuilds it from the
  // (newly swapped) NS.ASTEROIDS spec.
  function invalidateAsteroids() { _asteroids = null; }

  // Deterministic 0..1 hash for cell-local stylistic variation.
  function hash01(a, b, c) {
    let h = (a | 0) * 374761393 + (b | 0) * 668265263 + (c | 0) * 1274126177;
    h = (h ^ (h >>> 13)) * 1274126177;
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  }

  // ===== Layer: faint celestial grid (drawn natively on ctx) =====
  function drawCelestialGrid(ctx, w, h, fade) {
    const fa = (fade != null ? fade : 1) * NS.GRID.alpha;
    if (fa <= 0.01) return;
    const cellW = NS.__cellMetrics.w;
    const cellH = NS.__cellMetrics.h;
    const minor = NS.GRID.minorEvery * cellW;
    const major = NS.GRID.majorEvery * cellW;
    ctx.save();
    ctx.strokeStyle = NS.GRID.color;
    ctx.globalAlpha = fa;
    ctx.lineWidth = 1;
    // Light vertical/horizontal minor grid only in the outer band — leave the
    // center clean so the solar system reads cleanly.
    const cx = w / 2, cy = h / 2;
    const maxR = Math.hypot(w, h) / 2;
    const innerR = maxR * NS.GRID.edgeFade;
    for (let x = 0; x < w; x += minor) {
      const d = Math.abs(x - cx);
      if (d < innerR * 0.7) continue;
      ctx.beginPath();
      ctx.moveTo(x + 0.5, 0);
      ctx.lineTo(x + 0.5, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += minor) {
      const d = Math.abs(y - cy);
      if (d < innerR * 0.55) continue;
      ctx.beginPath();
      ctx.moveTo(0, y + 0.5);
      ctx.lineTo(w, y + 0.5);
      ctx.stroke();
    }
    // Major tick marks along the four screen edges.
    ctx.strokeStyle = NS.GRID.tickColor;
    ctx.globalAlpha = fa * 1.6;
    for (let x = 0; x < w; x += major) {
      ctx.beginPath();
      ctx.moveTo(x + 0.5, 0); ctx.lineTo(x + 0.5, 6);
      ctx.moveTo(x + 0.5, h - 6); ctx.lineTo(x + 0.5, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += major) {
      ctx.beginPath();
      ctx.moveTo(0, y + 0.5); ctx.lineTo(6, y + 0.5);
      ctx.moveTo(w - 6, y + 0.5); ctx.lineTo(w, y + 0.5);
      ctx.stroke();
    }
    ctx.restore();
  }

  // ===== Layer: stars (no twinkle, monochrome) =====
  function drawStars(buf, fade, density) {
    if (!_stars) initFields();
    const cols = buf.cols, rows = buf.rows;
    const fa = fade != null ? fade : 1;
    const limit = density != null ? Math.floor(_stars.length * density) : _stars.length;
    for (let i = 0; i < limit; i++) {
      const s = _stars[i];
      const x = Math.floor(s.u * cols);
      const y = Math.floor(s.v * rows);
      buf.put(x, y, s.char, NS.STARS.color, s.alpha * fa);
    }
  }

  // ===== Layer: orbit rings (thin foreshortened ellipses, tilted around sun) =====
  function drawOrbitRings(ctx, w, h, cam, fade, cellW, cellH) {
    const fa = fade != null ? fade : 1;
    if (fa <= 0) return;
    const squash = NS.VIEW_SQUASH || 0.5;
    const tilt = NS.VIEW_TILT || 0;
    const cosT = Math.cos(tilt), sinT = Math.sin(tilt);
    ctx.save();
    ctx.lineWidth = 1;
    ctx.strokeStyle = `rgba(120, 130, 145, ${0.16 * fa})`;
    // Sun pixel anchor — orbit ellipses pivot around this point.
    const sunPx = w / 2 - cam.cx * cam.scale * cellW;
    const sunPy = h / 2 - cam.cy * cam.scale * squash * cellH;
    for (const body of NS.BODIES) {
      if (!body.displayDistance) continue;  // skip central body — no orbit
      const a = body.displayDistance * cam.scale;        // semi-major in cells
      const b = a * Math.sqrt(1 - body.eccentricity * body.eccentricity);
      const c = a * body.eccentricity;                   // focus offset in cells
      // Ellipse center offset from sun in pixel space (untilted), then rotated.
      const dxp = -c * cellW;
      const dyp = 0;
      const ex = sunPx + (dxp * cosT - dyp * sinT);
      const ey = sunPy + (dxp * sinT + dyp * cosT);
      const rxPx = a * cellW;
      const ryPx = b * squash * cellH;
      ctx.beginPath();
      ctx.ellipse(ex, ey, rxPx, ryPx, tilt, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  // ===== Layer: asteroid belt =====
  function drawAsteroids(buf, cam, t, fade) {
    if (!_asteroids) initFields();
    if (!NS.ASTEROIDS || !_asteroids || _asteroids.length === 0) return;
    const cols = buf.cols, rows = buf.rows;
    const fa = fade != null ? fade : 1;
    if (fa <= 0) return;
    for (const a of _asteroids) {
      const ang = a.baseAngle + t * NS.ASTEROIDS.angularSpeed * (1 + a.jitter);
      const r = a.radius + a.radialJitter;
      const px = Math.cos(ang) * r;
      const py = Math.sin(ang) * r;
      const cell = m.auToCell(px, py, cam, cols, rows);
      const ch = NS.ASTEROIDS.chars[a.charIdx];
      buf.put(cell.x, cell.y, ch, NS.ASTEROIDS.color, NS.ASTEROIDS.baseAlpha * fa);
    }
  }

  // ===== Body sprite radius (cells) at given camera scale =====
  function bodySpriteRadius(body, scale) {
    return Math.max(0.5, Math.min(body.spriteMax, scale * body.spriteFactor * 0.5));
  }

  // ===== Core: dot-matrix sphere =====
  // R is the horizontal radius in cells; aspect squashes y because cells are tall.
  function drawDotMatrixGlobe(buf, cxCell, cyCell, R, body, t, alpha, scanlineBoost, aspect) {
    if (alpha <= 0) return;
    const Rv = Math.max(1, R * aspect);
    const sampler = NS.surface.getSampler(body);
    const rotation = body.visualRotSec
      ? (t / 1000 / body.visualRotSec) * TAU
      : (t / 1000) * 0.05;
    const dxHi = Math.ceil(R);
    const dyHi = Math.ceil(Rv);
    const idSeed = (body.id.charCodeAt(0) << 7) ^ (body.id.charCodeAt(1) || 0);
    const isStar = body.surface && body.surface.type === 'star';

    for (let dy = -dyHi; dy <= dyHi; dy++) {
      for (let dx = -dxHi; dx <= dxHi; dx++) {
        const nx = dx / R;
        const ny = dy / Rv;
        const r2 = nx * nx + ny * ny;
        if (r2 > 1) continue;
        const nz = Math.sqrt(1 - r2);
        const lat = Math.asin(-ny);
        const cosLat = Math.cos(lat);
        let sample;
        if (isStar) {
          sample = { feature: true, accent: null, density: 1 };
        } else {
          if (cosLat < 0.001) {
            sample = { feature: false, accent: null, density: 0.2 };
          } else {
            const sinLonRot = nx / cosLat;
            if (Math.abs(sinLonRot) > 1) {
              sample = { feature: false, accent: null, density: 0.2 };
            } else {
              const lon = rotation + Math.asin(sinLonRot);
              const latDeg = lat * 180 / Math.PI;
              let lonDeg = ((lon * 180 / Math.PI) % 360 + 540) % 360 - 180;
              sample = sampler(latDeg, lonDeg);
            }
          }
        }

        // Limb shading: brighter toward sub-observer point, fade at rim.
        const limb = 0.45 + 0.55 * nz;
        // Optional scanline highlight (hover effect)
        const scan = scanlineBoost && (((dy + 1024) % 3) === 0) ? 1.15 : 1;

        let ch, color, a;
        if (sample.feature) {
          if (isStar) {
            ch = LAND_CHARS[hash01(dx + 9, dy + 3, idSeed) < 0.5 ? 0 : 1];
            color = body.primaryColor;
            a = 0.95 * limb * alpha * scan;
          } else if (sample.accent === '#E8E8E8') {
            ch = POLAR_CHARS[hash01(dx + 11, dy + 5, idSeed) < 0.6 ? 0 : 1];
            color = '#E8EDF2';
            a = 0.85 * limb * alpha * scan;
          } else if (sample.accent) {
            ch = STORM_CHARS[hash01(dx + 17, dy + 13, idSeed) < 0.55 ? 0 : 1];
            color = sample.accent;
            a = (sample.density || 0.9) * limb * alpha * scan;
          } else {
            ch = LAND_CHARS[hash01(dx + 7, dy + 19, idSeed) < 0.55 ? 0 : 1];
            color = body.primaryColor;
            a = 0.92 * (sample.density || 1) * limb * alpha * scan;
          }
        } else {
          // Background / ocean — sparse dot pattern at low alpha
          const dotProb = 0.35 + 0.5 * (sample.density || 0.3);
          const h = hash01(dx + 31, dy + 41, idSeed);
          if (h > dotProb) continue;
          ch = OCEAN_CHARS[hash01(dx + 5, dy + 23, idSeed) < 0.6 ? 0 : 1];
          color = body.primaryColor;
          a = 0.34 * limb * alpha * scan;
        }
        buf.put(cxCell + dx, cyCell + dy, ch, color, a);
      }
    }
  }

  // Tiny-fallback when sprite radius < 2: just a colored cross/plus of cells.
  function drawTinyBody(buf, cxCell, cyCell, body, alpha) {
    const col = body.primaryColor;
    buf.put(cxCell,     cyCell,     body.sprite || '*', col, 0.95 * alpha);
    buf.put(cxCell - 1, cyCell,     body.sprite || '*', col, 0.55 * alpha);
    buf.put(cxCell + 1, cyCell,     body.sprite || '*', col, 0.55 * alpha);
    buf.put(cxCell,     cyCell - 1, body.sprite || '*', col, 0.45 * alpha);
    buf.put(cxCell,     cyCell + 1, body.sprite || '*', col, 0.45 * alpha);
  }

  function drawSunCorona(buf, cxCell, cyCell, R, t, alpha, aspect) {
    const pulse = 1 + 0.08 * Math.sin(t * 0.0018);
    const rings = [
      { mul: 1.25, char: '*', alpha: 0.62, color: '#FFE08A' },
      { mul: 1.65, char: '+', alpha: 0.38, color: '#F5A02A' },
      { mul: 2.10, char: '.', alpha: 0.22, color: '#FF6E1F' }
    ];
    for (const r of rings) {
      const rH = R * r.mul * pulse;
      const rV = rH * aspect;
      const samples = Math.max(14, Math.floor(2 * Math.PI * rH / 1.4));
      for (let i = 0; i < samples; i++) {
        const ang = (i / samples) * TAU;
        const x = Math.round(cxCell + Math.cos(ang) * rH);
        const y = Math.round(cyCell + Math.sin(ang) * rV);
        buf.put(x, y, r.char, r.color, r.alpha * alpha);
      }
    }
  }

  function drawSaturnRingsOverview(buf, cxCell, cyCell, R, body, alpha, aspect) {
    const ringInner = R * 1.30;
    const ringOuter = R * 2.20;
    const ringVRad = R * 0.42 * aspect;
    const ringColor = body.ringColor || body.primaryColor;
    const cols = buf.cols;

    for (let x = Math.floor(cxCell - ringOuter); x <= Math.ceil(cxCell + ringOuter); x++) {
      if (x < 0 || x >= cols) continue;
      const dx = x - cxCell;
      const adx = Math.abs(dx);
      const tOut = 1 - (dx / ringOuter) * (dx / ringOuter);
      if (tOut <= 0) continue;
      const yOut = Math.sqrt(tOut) * ringVRad;
      let yIn = 0;
      if (adx < ringInner) {
        const tIn = 1 - (dx / ringInner) * (dx / ringInner);
        yIn = Math.sqrt(Math.max(0, tIn)) * ringVRad;
      }
      const yTopFar = Math.round(cyCell - yOut);
      const yTopNear = Math.round(cyCell - yIn);
      const yBotNear = Math.round(cyCell + yIn);
      const yBotFar = Math.round(cyCell + yOut);
      const insidePlanet = adx < R;

      const drawRow = (y0, y1, frontFace) => {
        for (let y = y0; y <= y1; y++) {
          const ch = (adx < ringInner * 1.12) ? '=' : '-';
          const inSphere = (Math.abs(y - cyCell) / Math.max(1, R * aspect)) ** 2 + (dx / R) ** 2 <= 1;
          let a = frontFace ? 0.88 : 0.78;
          if (insidePlanet && inSphere) a = frontFace ? 0.32 : 0.32;
          buf.put(x, y, ch, ringColor, a * alpha);
        }
      };
      drawRow(yTopFar, yTopNear, false);
      drawRow(yBotNear, yBotFar, true);
    }
  }

  // ===== Realistic ctx-based renderers for overview/transition =====

  function hexWithAlpha(hex, alpha) {
    if (alpha <= 0) return 'rgba(0,0,0,0)';
    const a = Math.max(0, Math.min(1, alpha));
    // Tolerate either a #RRGGBB hex or a fallback so a single bad colour can
    // never blow up addColorStop and kill the whole tick.
    let r = 200, g = 200, b = 200;
    if (typeof hex === 'string' && hex.length >= 7 && hex.charCodeAt(0) === 35) {
      const pr = parseInt(hex.slice(1, 3), 16);
      const pg = parseInt(hex.slice(3, 5), 16);
      const pb = parseInt(hex.slice(5, 7), 16);
      if (!Number.isNaN(pr) && !Number.isNaN(pg) && !Number.isNaN(pb)) {
        r = pr; g = pg; b = pb;
      }
    }
    return `rgba(${r},${g},${b},${a.toFixed(3)})`;
  }

  function lightenHex(hex, t) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const nr = Math.min(255, Math.round(r + (255 - r) * t));
    const ng = Math.min(255, Math.round(g + (255 - g) * t));
    const nb = Math.min(255, Math.round(b + (255 - b) * t));
    // Return hex so it composes cleanly with hexWithAlpha downstream.
    return '#' +
      nr.toString(16).padStart(2, '0') +
      ng.toString(16).padStart(2, '0') +
      nb.toString(16).padStart(2, '0');
  }

  // Tiny glowing disc — used for every non-sun body in overview.
  function drawBodyDot(ctx, px, py, R_cells, body, cellW, alpha) {
    if (alpha <= 0.005) return;
    // Pixel-radius floor keeps distant outer planets (Pluto/Neptune) visible
    // as crisp dots instead of disappearing into sub-pixel territory.
    const r = Math.max(2.5, R_cells * cellW);
    const haloR = r * 4.5;
    const haloGrad = ctx.createRadialGradient(px, py, r * 0.5, px, py, haloR);
    haloGrad.addColorStop(0, hexWithAlpha(body.primaryColor, 0.55 * alpha));
    haloGrad.addColorStop(0.35, hexWithAlpha(body.primaryColor, 0.18 * alpha));
    haloGrad.addColorStop(1, hexWithAlpha(body.primaryColor, 0));
    ctx.fillStyle = haloGrad;
    ctx.fillRect(px - haloR, py - haloR, haloR * 2, haloR * 2);
    // Solid disc with a soft highlight shifted up-left for a 3D feel.
    const coreGrad = ctx.createRadialGradient(px - r * 0.35, py - r * 0.35, 0, px, py, r);
    coreGrad.addColorStop(0, hexWithAlpha(lightenHex(body.primaryColor, 0.45), alpha));
    coreGrad.addColorStop(0.85, hexWithAlpha(body.primaryColor, alpha));
    coreGrad.addColorStop(1, hexWithAlpha(body.primaryColor, 0.7 * alpha));
    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    ctx.arc(px, py, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Central body painter — dispatches by body.starType to either a standard
  // bloom+core star or, for black holes, an accretion-disk renderer.
  function drawSunStar(ctx, px, py, R_cells, body, cellW, alpha, time) {
    if (alpha <= 0.005) return;
    const type = body.starType || 'sun';
    const visuals = NS.STAR_VISUALS && NS.STAR_VISUALS[type]
      ? NS.STAR_VISUALS[type]
      : (NS.STAR_VISUALS && NS.STAR_VISUALS.sun);
    if (!visuals) return;
    if (visuals.accretion) {
      drawBlackHole(ctx, px, py, R_cells, body, cellW, alpha, time);
      return;
    }
    const r = Math.max(2, R_cells * cellW);
    ctx.save();
    const pulse = 1 + 0.03 * Math.sin(time * 0.0012);

    // Radial bloom — palette from visuals table.
    const bloomR = r * visuals.bloomMul * pulse;
    const bloomGrad = ctx.createRadialGradient(px, py, r * 0.6, px, py, bloomR);
    const bloomStops = visuals.bloomStops(alpha);
    for (const s of bloomStops) bloomGrad.addColorStop(s.p, s.c);
    ctx.fillStyle = bloomGrad;
    ctx.fillRect(px - bloomR, py - bloomR, bloomR * 2, bloomR * 2);

    // Bright core.
    const coreR = r * visuals.coreMul;
    const coreGrad = ctx.createRadialGradient(px, py, 0, px, py, coreR);
    const coreStops = visuals.coreStops(alpha, body.primaryColor);
    for (const s of coreStops) coreGrad.addColorStop(s.p, s.c);
    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    ctx.arc(px, py, coreR, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // Black hole — Gargantua (Interstellar) style. Clean six-pass version:
  // (1) very subtle ambient glow far beyond the disk
  // (2) accretion disk BACK half (thin horizontal strip, upper clip)
  // (3) bright lensing halo — sharp ring of light tight against the BH
  // (4) event horizon — solid pitch-black sphere covering halo center
  // (5) accretion disk FRONT half (thin strip, lower clip)
  // (6) photon ring — crisp thin bright outline at the exact event horizon
  function drawBlackHole(ctx, px, py, R_cells, body, cellW, alpha, time) {
    const r = Math.max(3, R_cells * cellW);
    const eventR  = r;
    const ringOuter = r * 1.55;        // tight halo just outside BH
    const diskInner = r * 1.55;        // disk meets halo
    const diskOuter = r * 6.0;         // disk reach
    const diskSquash = 0.05;           // very thin razor-edge disk
    const tilt = NS.VIEW_TILT || 0;    // share orbital plane tilt

    ctx.save();

    // (1) Very subtle ambient glow well outside the disk
    const ambGrad = ctx.createRadialGradient(px, py, diskOuter * 0.65, px, py, diskOuter * 1.5);
    ambGrad.addColorStop(0.00, `rgba(255, 150, 60, ${0.08 * alpha})`);
    ambGrad.addColorStop(1.00, 'rgba(80, 30, 10, 0)');
    ctx.fillStyle = ambGrad;
    ctx.fillRect(px - diskOuter * 1.5, py - diskOuter * 1.5, diskOuter * 3, diskOuter * 3);

    // Move into BH-local rotated frame
    ctx.translate(px, py);
    ctx.rotate(tilt);

    // Disk gradient (used twice, for back & front halves)
    const diskGrad = ctx.createRadialGradient(0, 0, diskInner, 0, 0, diskOuter);
    diskGrad.addColorStop(0.00, `rgba(255, 245, 215, ${0.95 * alpha})`);
    diskGrad.addColorStop(0.18, `rgba(255, 195, 95,  ${0.80 * alpha})`);
    diskGrad.addColorStop(0.50, `rgba(220, 110, 40,  ${0.38 * alpha})`);
    diskGrad.addColorStop(1.00, 'rgba(120, 40, 10, 0)');

    // (2) Disk BACK half — thin strip behind BH (upper clip)
    ctx.save();
    ctx.beginPath();
    ctx.rect(-diskOuter * 1.2, -diskOuter * 0.3, diskOuter * 2.4, diskOuter * 0.3);
    ctx.clip();
    ctx.fillStyle = diskGrad;
    ctx.beginPath();
    ctx.ellipse(0, 0, diskOuter, diskOuter * diskSquash, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // (3) Bright LENSING HALO — tight bright ring all 360° around BH.
    // Drawn as a filled circle; the event horizon is painted on top next so
    // the center returns to pitch black, leaving a clean bright annulus.
    const haloGrad = ctx.createRadialGradient(0, 0, eventR * 0.96, 0, 0, ringOuter);
    haloGrad.addColorStop(0.00, `rgba(255, 252, 230, ${alpha})`);
    haloGrad.addColorStop(0.35, `rgba(255, 218, 145, ${0.92 * alpha})`);
    haloGrad.addColorStop(0.75, `rgba(255, 170, 70,  ${0.45 * alpha})`);
    haloGrad.addColorStop(1.00, 'rgba(220, 110, 40, 0)');
    ctx.fillStyle = haloGrad;
    ctx.beginPath();
    ctx.arc(0, 0, ringOuter, 0, Math.PI * 2);
    ctx.fill();

    // (4) Event horizon — pitch-black disc covering halo center
    ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
    ctx.beginPath();
    ctx.arc(0, 0, eventR, 0, Math.PI * 2);
    ctx.fill();

    // (5) Disk FRONT half — thin strip in front of BH (lower clip)
    ctx.save();
    ctx.beginPath();
    ctx.rect(-diskOuter * 1.2, 0, diskOuter * 2.4, diskOuter * 0.3);
    ctx.clip();
    ctx.fillStyle = diskGrad;
    ctx.beginPath();
    ctx.ellipse(0, 0, diskOuter, diskOuter * diskSquash, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // (6) Photon ring — sharp thin bright outline at exact event horizon
    ctx.strokeStyle = `rgba(255, 250, 225, ${alpha})`;
    ctx.lineWidth = Math.max(1.4, r * 0.035);
    ctx.beginPath();
    ctx.arc(0, 0, eventR * 1.015, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }

  // Detail-view BH render — ctx-based at full viewport scale (skips the buffer
  // dot-matrix half-globe path since a black hole isn't a sphere).
  function drawBlackHoleDetail(ctx, body, time, cellW, cellH, cols, rows /* , aspect */) {
    const w = cols * cellW, h = rows * cellH;
    // Center horizontally; place slightly below mid so the upper info panel
    // doesn't crowd the disk.
    const px = w / 2;
    const py = h * 0.6;
    // Event-horizon radius in cells — chosen so the full disk+halo (~7-8 × r)
    // fits within the viewport with margin on all sides.
    const factor = body.detailRadiusFactor || 0.07;
    const Rpx = Math.min(w * factor, h * 0.10);
    const Rcells = Rpx / cellW;
    drawBlackHole(ctx, px, py, Rcells, body, cellW, 1.0, time);
  }

  // Saturn ring — thin ellipse in screen space, foreshortened for the side view.
  function drawSaturnRingsCtx(ctx, px, py, R_cells, body, cellW, alpha) {
    if (alpha <= 0.005) return;
    const r = R_cells * cellW;
    const ringOuterX = r * 2.4;
    const ringInnerX = r * 1.5;
    const ringY = Math.max(1, r * 0.22);
    const color = body.ringColor || body.primaryColor;
    ctx.save();
    ctx.lineWidth = 1.1;
    ctx.strokeStyle = hexWithAlpha(color, 0.6 * alpha);
    ctx.beginPath();
    ctx.ellipse(px, py, ringOuterX, ringY, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = hexWithAlpha(color, 0.45 * alpha);
    ctx.beginPath();
    ctx.ellipse(px, py, ringInnerX, ringY * 0.62, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // Subpixel AU → screen-pixel transform (matches auToCell math but skips the
  // integer cell rounding so ctx draws don't jitter as planets move).
  function auToPx(auX, auY, cam, w, h, cellW, cellH) {
    const squash = NS.VIEW_SQUASH || 0.5;
    const tilt = NS.VIEW_TILT || 0;
    const cosT = Math.cos(tilt), sinT = Math.sin(tilt);
    const sunPx = w / 2 - cam.cx * cam.scale * cellW;
    const sunPy = h / 2 - cam.cy * cam.scale * squash * cellH;
    const dxp = auX * cam.scale * cellW;
    const dyp = auY * cam.scale * squash * cellH;
    return {
      x: sunPx + dxp * cosT - dyp * sinT,
      y: sunPy + dxp * sinT + dyp * cosT
    };
  }

  // ===== Bodies in overview (ctx-based realistic style) =====
  // Bodies are z-sorted so planets behind the sun get occluded (painter's algo).
  // Depth axis = AU y (the in-plane axis that becomes the near/far direction
  // under the ecliptic-tilt projection). Smaller y = further behind, drawn
  // first; larger y = in front of sun, drawn last.
  function drawBodiesOverview(ctx, scene, t, hoveredId, appearProgress, cellW, cellH, opts) {
    opts = opts || {};
    const alphaMul = opts.alphaMul != null ? opts.alphaMul : 1;
    const excludeId = opts.excludeId || null;
    if (alphaMul <= 0.005) return;
    const w = scene.grid.cols * cellW;
    const h = scene.grid.rows * cellH;
    const cam = scene.cam;

    // Precompute positions and sort by depth.
    const queue = [];
    for (const body of NS.BODIES) {
      if (body.id === excludeId) continue;
      const isCentral = !body.displayDistance;  // central body (sun / random star)
      let pos;
      if (isCentral) pos = { x: 0, y: 0 };
      else {
        const theta = (t / 1000 / body.visualOrbitSec) * TAU + body.phaseOffset;
        pos = m.ellipsePoint(body.displayDistance, body.eccentricity, theta);
      }
      queue.push({ body, pos, isCentral });
    }
    queue.sort((a, b) => a.pos.y - b.pos.y);

    for (const { body, pos, isCentral } of queue) {
      const apRaw = appearProgress[body.id] != null ? appearProgress[body.id] : 1;
      const ap = m.clamp(apRaw, 0, 1.2) * alphaMul;
      if (ap <= 0.005) continue;
      const R = bodySpriteRadius(body, cam.scale) * Math.min(1, m.clamp(apRaw, 0, 1.2));
      const fade = m.clamp(ap, 0, 1);

      const sp = auToPx(pos.x, pos.y, cam, w, h, cellW, cellH);
      const margin = R * cellW + 80;
      if (sp.x < -margin || sp.x > w + margin) continue;

      if (isCentral) {
        drawSunStar(ctx, sp.x, sp.y, R, body, cellW, fade, t);
      } else {
        drawBodyDot(ctx, sp.x, sp.y, R, body, cellW, fade);
        if (body.hasRings) drawSaturnRingsCtx(ctx, sp.x, sp.y, R, body, cellW, fade);
      }
    }
  }

  // ===== Comet =====
  function drawComet(buf, t, fade) {
    if (!_cometState) _cometState = { nextSpawn: 0, active: null };
    const cols = buf.cols, rows = buf.rows;
    if (_cometState.nextSpawn === 0) {
      _cometState.nextSpawn = t + NS.COMET.minInterval +
        Math.random() * (NS.COMET.maxInterval - NS.COMET.minInterval);
    }
    if (!_cometState.active && t >= _cometState.nextSpawn) {
      _cometState.active = spawnComet(cols, rows, t);
    }
    const c = _cometState.active;
    if (!c) return;
    const elapsed = t - c.t0;
    if (elapsed >= NS.COMET.durationMs) {
      _cometState.active = null;
      _cometState.nextSpawn = t + NS.COMET.minInterval +
        Math.random() * (NS.COMET.maxInterval - NS.COMET.minInterval);
      return;
    }
    const progress = elapsed / NS.COMET.durationMs;
    const eased = 1 - Math.pow(1 - progress, 1.6);
    const headX = c.x0 + c.dx * eased;
    const headY = c.y0 + c.dy * eased;
    const trailLen = NS.COMET.trailLen;
    const stepX = -c.dx * 0.02;
    const stepY = -c.dy * 0.02;
    for (let i = 0; i < trailLen; i++) {
      const px = Math.round(headX + stepX * i);
      const py = Math.round(headY + stepY * i);
      if (px < 0 || px >= cols || py < 0 || py >= rows) continue;
      let ch;
      if (i === 0) ch = NS.COMET.headChar;
      else {
        const idx = Math.min(NS.COMET.tailChars.length - 1, Math.floor(i / 2));
        ch = NS.COMET.tailChars[idx];
      }
      const a = (1 - i / trailLen) * fade * 0.85;
      buf.put(px, py, ch, NS.COMET.color, a);
    }
  }

  function spawnComet(cols, rows, t) {
    const edge = Math.floor(Math.random() * 4);
    let x0, y0, dirAng;
    if (edge === 0) { x0 = -3; y0 = Math.random() * rows * 0.7; dirAng = (Math.random() - 0.5) * 0.7; }
    else if (edge === 1) { x0 = Math.random() * cols; y0 = -3; dirAng = Math.PI / 2 + (Math.random() - 0.5) * 0.7; }
    else if (edge === 2) { x0 = cols + 3; y0 = Math.random() * rows * 0.7; dirAng = Math.PI + (Math.random() - 0.5) * 0.7; }
    else { x0 = Math.random() * cols; y0 = rows + 3; dirAng = -Math.PI / 2 + (Math.random() - 0.5) * 0.7; }
    const dist = Math.hypot(cols, rows) * (0.65 + Math.random() * 0.35);
    const dx = Math.cos(dirAng) * dist;
    const dy = Math.sin(dirAng) * dist * 0.55;
    return { x0, y0, dx, dy, t0: t };
  }

  // ===== Detail view (half-globe vaulting from below) =====
  function detailGlobeGeometry(body, cols, rows, aspect) {
    // Cap by viewport rows so the globe never invades the info area on short
    // screens, regardless of how wide the viewport gets.
    const R = Math.min(cols * (body.detailRadiusFactor || 0.28), rows * 0.78);
    const cx = Math.floor(cols / 2);
    const offsetFraction = body.hasRings ? -0.12 : 0.28;
    const cy = Math.floor(rows + R * aspect * offsetFraction);
    return { cx, cy, R };
  }

  function drawPlanetDetail(buf, body, t, cellAspect) {
    const cols = buf.cols, rows = buf.rows;
    const aspect = cellAspect || 0.5;
    const g = detailGlobeGeometry(body, cols, rows, aspect);
    drawDotMatrixGlobe(buf, g.cx, g.cy, g.R, body, t, 1.0, false, aspect);
    // Stars (sun + any generated star) get a corona ring.
    if (body.surface && body.surface.type === 'star') {
      drawSunCorona(buf, g.cx, g.cy, g.R, t, 1.0, aspect);
    }
    if (body.hasRings) drawSaturnRingsDetail(buf, g.cx, g.cy, g.R, body, aspect);
  }

  // ===== Transition globe — dual-mode morph =====
  // Overview side is realistic (ctx dot + lens flare). Detail side is dot-matrix.
  // We split the renderer in two: a ctx pass for small R and a buffer pass for
  // large R, with a crossfade window so the handoff is invisible.
  const TRANSITION_HANDOFF_R = 6;       // cells; below = pure dot, above = pure matrix
  const TRANSITION_HANDOFF_WIDTH = 3;   // cells of crossfade overlap

  function _transitionState(scene, time, cols, rows, aspect) {
    const body = scene.transitionTargetBody;
    if (!body) return null;
    const p = m.clamp(scene.transitionProgress != null ? scene.transitionProgress : 0, 0, 1);
    let auPos;
    if (!body.displayDistance) auPos = { x: 0, y: 0 };
    else {
      const theta = (time / 1000 / body.visualOrbitSec) * TAU + body.phaseOffset;
      auPos = m.ellipsePoint(body.displayDistance, body.eccentricity, theta);
    }
    const fromCell = m.auToCell(auPos.x, auPos.y, scene.cam, cols, rows);
    const fromR = bodySpriteRadius(body, scene.cam.scale);
    const to = detailGlobeGeometry(body, cols, rows, aspect);
    return {
      body, p,
      lerpX: m.lerp(fromCell.x, to.cx, p),
      lerpY: m.lerp(fromCell.y, to.cy, p),
      lerpR: m.lerp(fromR, to.R, p)
    };
  }

  function _handoffWeights(lerpR) {
    // Returns { dotAlpha, matrixAlpha } summing to ~1 across the handoff.
    if (lerpR <= TRANSITION_HANDOFF_R) return { dotAlpha: 1, matrixAlpha: 0 };
    if (lerpR >= TRANSITION_HANDOFF_R + TRANSITION_HANDOFF_WIDTH) return { dotAlpha: 0, matrixAlpha: 1 };
    const k = (lerpR - TRANSITION_HANDOFF_R) / TRANSITION_HANDOFF_WIDTH;
    return { dotAlpha: 1 - k, matrixAlpha: k };
  }

  // Ctx dot half — for the overview side of the transition.
  // Recomputes position with subpixel precision (auToPx) so the morphing globe
  // stays smooth instead of snapping cell-by-cell.
  function drawTransitionGlobeDot(ctx, scene, time, cellAspect, cellW, cellH) {
    const body = scene.transitionTargetBody;
    if (!body) return;
    const cols = scene.grid.cols, rows = scene.grid.rows;
    const aspect = cellAspect || 0.5;
    const p = m.clamp(scene.transitionProgress != null ? scene.transitionProgress : 0, 0, 1);
    let auPos;
    if (!body.displayDistance) auPos = { x: 0, y: 0 };
    else {
      const theta = (time / 1000 / body.visualOrbitSec) * TAU + body.phaseOffset;
      auPos = m.ellipsePoint(body.displayDistance, body.eccentricity, theta);
    }
    const wPx = cols * cellW, hPx = rows * cellH;
    const fromPx = auToPx(auPos.x, auPos.y, scene.cam, wPx, hPx, cellW, cellH);
    const fromR = bodySpriteRadius(body, scene.cam.scale);
    const isCentral = !body.displayDistance;
    const isBH = body.starType === 'black-hole';

    // Black hole has no buffer half-globe — its detail target is a centered
    // ctx render. Always rendered on ctx at full alpha throughout the morph.
    if (isBH) {
      const factor = body.detailRadiusFactor || 0.06;
      const detailRpx = Math.min(wPx * factor, hPx * 0.10);
      const toPxX = wPx / 2;
      const toPxY = hPx * 0.6;
      const lerpPxX = m.lerp(fromPx.x, toPxX, p);
      const lerpPxY = m.lerp(fromPx.y, toPxY, p);
      const lerpR = m.lerp(fromR, detailRpx / cellW, p);
      drawBlackHole(ctx, lerpPxX, lerpPxY, lerpR, body, cellW, 1.0, time);
      return;
    }

    const to = detailGlobeGeometry(body, cols, rows, aspect);
    const lerpPxX = m.lerp(fromPx.x, to.cx * cellW, p);
    const lerpPxY = m.lerp(fromPx.y, to.cy * cellH, p);
    const lerpR = m.lerp(fromR, to.R, p);
    const wgt = _handoffWeights(lerpR);
    if (wgt.dotAlpha <= 0.005) return;
    if (isCentral) {
      drawSunStar(ctx, lerpPxX, lerpPxY, lerpR, body, cellW, wgt.dotAlpha, time);
    } else {
      drawBodyDot(ctx, lerpPxX, lerpPxY, lerpR, body, cellW, wgt.dotAlpha);
      if (body.hasRings) drawSaturnRingsCtx(ctx, lerpPxX, lerpPxY, lerpR, body, cellW, wgt.dotAlpha);
    }
  }

  // Buffer dot-matrix half — for the detail side of the transition.
  function drawTransitionGlobeMatrix(buf, scene, time, cellAspect) {
    const cols = buf.cols, rows = buf.rows;
    const aspect = cellAspect || 0.5;
    const s = _transitionState(scene, time, cols, rows, aspect);
    if (!s) return;
    // Black hole is handled entirely on ctx by drawTransitionGlobeDot.
    if (s.body.starType === 'black-hole') return;
    const w = _handoffWeights(s.lerpR);
    if (w.matrixAlpha <= 0.005) return;
    const R = Math.max(0.8, s.lerpR);
    drawDotMatrixGlobe(buf, Math.round(s.lerpX), Math.round(s.lerpY), R, s.body, time, w.matrixAlpha, false, aspect);
    if (s.body.surface && s.body.surface.type === 'star') {
      drawSunCorona(buf, s.lerpX, s.lerpY, R, time, w.matrixAlpha, aspect);
    }
    if (s.body.hasRings) {
      if (s.p < 0.55) drawSaturnRingsOverview(buf, s.lerpX, s.lerpY, R, s.body, w.matrixAlpha, aspect);
      else drawSaturnRingsDetail(buf, s.lerpX, s.lerpY, R, s.body, aspect);
    }
  }

  function drawSaturnRingsDetail(buf, cxCell, cyCell, R, body, aspect) {
    const ringInner = R * 1.10;
    const ringOuter = R * 1.85;
    const ringVRad = R * 0.30 * aspect;
    const ringColor = body.ringColor || body.primaryColor;
    const cols = buf.cols, rows = buf.rows;

    for (let x = Math.max(0, Math.floor(cxCell - ringOuter)); x <= Math.min(cols - 1, Math.ceil(cxCell + ringOuter)); x++) {
      const dx = x - cxCell;
      const adx = Math.abs(dx);
      if (adx > ringOuter) continue;
      const tOut = 1 - (dx / ringOuter) * (dx / ringOuter);
      if (tOut <= 0) continue;
      const yOut = Math.sqrt(tOut) * ringVRad;
      let yIn = 0;
      if (adx < ringInner) {
        const tIn = 1 - (dx / ringInner) * (dx / ringInner);
        yIn = Math.sqrt(Math.max(0, tIn)) * ringVRad;
      }
      const yTop1 = Math.round(cyCell - yOut);
      const yTop2 = Math.round(cyCell - yIn);
      const yBot1 = Math.round(cyCell + yIn);
      const yBot2 = Math.round(cyCell + yOut);

      for (let y = yTop1; y <= yTop2; y++) {
        if (y < 0 || y >= rows) continue;
        const ch = (adx < ringInner * 1.15) ? '=' : '-';
        let a = 0.88;
        const insidePlanet = adx < R;
        if (insidePlanet) {
          const dy = (y - cyCell) / Math.max(1, R * aspect);
          const dxN = dx / R;
          if (dxN * dxN + dy * dy <= 1) a = 0.30;
        }
        buf.put(x, y, ch, ringColor, a);
      }
      for (let y = yBot1; y <= yBot2; y++) {
        if (y < 0 || y >= rows) continue;
        const ch = (adx < ringInner * 1.15) ? '=' : '-';
        buf.put(x, y, ch, ringColor, 0.92);
      }
    }
  }

  // ===== Native canvas overlays =====

  function overlayOverview(ctx, w, h, t, scene, hoveredBody, hoverCellPos, cellW, cellH, mul) {
    NS.__cellMetrics = { w: cellW, h: cellH };
    mul = mul != null ? mul : 1;
    if (mul <= 0.005) return;

    // Title — small uppercase mono, top-left, with subtitle in serif underneath.
    // Suppressed for randomly-generated systems; the bottom metadata strip
    // shows the actual star name in that case.
    const titleAlpha = scene.titleAlpha * mul;
    if (titleAlpha > 0.01 && !scene.systemMeta) {
      ctx.save();
      ctx.globalAlpha = titleAlpha;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.font = '500 11px "IBM Plex Mono", monospace';
      ctx.fillStyle = '#5A5E66';
      ctx.fillText('S O L A R   S Y S T E M  /  太 阳 系', 28, 22);
      ctx.font = '400 22px "Noto Serif SC", serif';
      ctx.fillStyle = '#D4D8E0';
      ctx.fillText('一份点阵观测笔记', 28, 42);
      ctx.font = '400 11px "IBM Plex Mono", monospace';
      ctx.fillStyle = '#5A5E66';
      ctx.fillText('AN ASCII-MATRIX FIELD NOTE', 28, 80);
      ctx.restore();
    }

    // Plate-style metadata line, centered along the bottom edge.
    {
      const a = mul * scene.hintAlpha;
      if (a > 0.01) {
        ctx.save();
        ctx.font = '400 10px "IBM Plex Mono", monospace';
        ctx.fillStyle = '#7A7A7A';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.globalAlpha = Math.min(1, 0.55 * a);
        const epoch = NS.__epochString || 'J2026.139';
        const systemLabel = (scene.systemMeta && scene.systemMeta.starNameZh)
          ? `${epoch}  ·  ${scene.systemMeta.starNameZh} · ${scene.systemMeta.starName}`
          : `${epoch}  ·  ECLIPTIC PLANE`;
        ctx.fillText(systemLabel, w / 2, h - 30);
        ctx.restore();
      }
    }

    // Bottom-right buttons:  ← 归    探索 →
    //  "归" only visible when we're away from the original solar system.
    //  Cool palette (greys) for return mirrors the warm palette for explore.
    {
      const a = mul * scene.hintAlpha;
      if (a > 0.01) {
        ctx.save();
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.font = '500 15px "Noto Serif SC", serif';
        const buttonY = h - 56;
        const padX = 14, padY = 12;

        // ─── 探索 → ───
        const exploreText = '探索  →';
        const exploreRight = w - 60;
        const exploreTW = ctx.measureText(exploreText).width;
        const exploreBounds = {
          x: exploreRight - exploreTW - padX,
          y: buttonY - padY,
          w: exploreTW + padX * 2,
          h: padY * 2
        };
        NS.__exploreButton = exploreBounds;
        const exploreHover = !!scene.exploreHover;
        ctx.fillStyle = exploreHover ? '#F0E5C8' : '#A89060';
        ctx.globalAlpha = Math.min(1, (exploreHover ? 0.95 : 0.78) * a);
        ctx.fillText(exploreText, exploreRight, buttonY);

        // ─── ← 归 (only when in a generated system) ───
        if (scene.systemMeta) {
          const returnText = '←  归';
          const returnRight = exploreBounds.x - 16;          // gap from explore
          const returnTW = ctx.measureText(returnText).width;
          const returnBounds = {
            x: returnRight - returnTW - padX,
            y: buttonY - padY,
            w: returnTW + padX * 2,
            h: padY * 2
          };
          NS.__returnButton = returnBounds;
          const returnHover = !!scene.returnHover;
          ctx.fillStyle = returnHover ? '#D8E2EE' : '#8898A8';
          ctx.globalAlpha = Math.min(1, (returnHover ? 0.95 : 0.78) * a);
          ctx.fillText(returnText, returnRight, buttonY);
        } else {
          NS.__returnButton = null;
        }

        ctx.restore();
      } else {
        NS.__exploreButton = null;
        NS.__returnButton = null;
      }
    }
  }

  // ---------- Detail overlay ----------
  function overlayDetail(ctx, w, h, body, t, mul) {
    if (!body) return;
    mul = mul != null ? mul : 1;
    if (mul <= 0.005) return;

    // Top-band: huge English name + small Chinese name + alt-name in serif.
    ctx.save();
    ctx.globalAlpha = mul;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    ctx.font = '700 64px "IBM Plex Mono", monospace';
    ctx.fillStyle = body.primaryColor;
    const nameUpper = body.nameEn.toUpperCase();
    ctx.fillText(nameUpper, 60, 56);

    ctx.font = '400 18px "IBM Plex Mono", monospace';
    ctx.fillStyle = '#5A5E66';
    ctx.fillText(`/ ${body.altName || body.nameZh}`, 60, 132);

    ctx.font = '600 32px "Noto Serif SC", serif';
    ctx.fillStyle = '#D4D8E0';
    ctx.fillText(body.nameZh, 60, 156);

    // Top-right id strip
    ctx.textAlign = 'right';
    ctx.font = '500 11px "IBM Plex Mono", monospace';
    ctx.fillStyle = '#5A5E66';
    ctx.fillText(`OBJ · ${body.nameEn.toUpperCase()}`, w - 60, 60);
    ctx.font = '300 10px "IBM Plex Mono", monospace';
    ctx.fillStyle = '#3C414B';
    const yr = body.discoveryYear ? `YR ${body.discoveryYear}` : 'YR ——';
    ctx.fillText(`SAMPLED  /  ${yr}`, w - 60, 78);

    // Special path for Earth: poetic full-screen quote
    if (body.id === 'earth') {
      drawEarthPoetry(ctx, w, h, body, mul);
    } else {
      drawDetailPanels(ctx, w, h, body, t, mul);
    }

    // Tagline beneath the title block — a quiet inscription, not centered.
    if (body.id !== 'earth') {
      ctx.textAlign = 'left';
      ctx.font = '400 15px "Noto Serif SC", serif';
      ctx.fillStyle = '#9098A4';
      ctx.fillText(body.tagline, 60, 196);
    }

    // Bottom hint
    ctx.textAlign = 'center';
    ctx.font = '300 10px "IBM Plex Mono", monospace';
    ctx.fillStyle = '#5A5E66';
    ctx.textBaseline = 'bottom';
    ctx.fillText(NS.UI.detailHint, w / 2, h - 22);

    ctx.restore();
  }

  function drawEarthPoetry(ctx, w, h, body, mul) {
    mul = mul != null ? mul : 1;
    const quote = body.tagline;
    const idx = quote.indexOf('——');
    let line1 = quote, attr = '';
    if (idx > 0) {
      line1 = quote.substring(0, idx).trim();
      attr = quote.substring(idx).trim();
    }
    ctx.save();
    ctx.globalAlpha = mul;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '400 36px "Noto Serif SC", serif';
    ctx.fillStyle = '#D4D8E0';
    ctx.fillText(line1, w / 2, h * 0.40);
    ctx.font = '400 14px "Noto Serif SC", serif';
    ctx.fillStyle = '#5A5E66';
    ctx.fillText(attr, w / 2, h * 0.40 + 50);
    ctx.strokeStyle = '#3C414B';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(w / 2 - 80, h * 0.40 + 86);
    ctx.lineTo(w / 2 + 80, h * 0.40 + 86);
    ctx.stroke();
    ctx.restore();
  }

  // Six-stat panels with live sparklines.
  function drawDetailPanels(ctx, w, h, body, t, mul) {
    mul = mul != null ? mul : 1;
    const tSec = t / 1000;
    const stats = [
      { label: 'DIAMETER',  value: body.diameterKm.toLocaleString('en-US'), unit: 'km' },
      { label: 'MASS',      value: body.massKg.toExponential(2),            unit: 'kg' },
      { label: 'DISTANCE',  value: !body.displayDistance ? '——' : body.distanceAU.toFixed(2), unit: 'AU' },
      { label: 'ORBIT',     value: !body.displayDistance ? '——' : body.orbitalPeriodYears.toFixed(2), unit: 'yr' },
      { label: 'ROTATION',  value: Math.abs(body.rotationPeriodDays).toString() + (body.rotationPeriodDays < 0 ? '↺' : ''), unit: 'd' },
      { label: 'SURF · TEMP', value: body.surfaceTempC, unit: '' }
    ];

    ctx.save();
    ctx.globalAlpha = mul;
    ctx.textBaseline = 'top';

    // Events strip — sits in the empty center band, ABOVE the stat blocks &
    // ABOVE the globe. This keeps it readable instead of overlapping the dot-matrix.
    if (body.events && body.events.length) {
      const eventY = 240;
      ctx.textAlign = 'center';
      ctx.font = '500 10px "IBM Plex Mono", monospace';
      ctx.fillStyle = body.primaryColor;
      ctx.globalAlpha = 0.75 * mul;
      ctx.fillText('— 发  现  与  探  测 —', w / 2, eventY);
      ctx.globalAlpha = mul;
      let y = eventY + 22;
      for (const ev of body.events) {
        ctx.fillStyle = body.primaryColor;
        ctx.textAlign = 'right';
        ctx.font = '500 11px "IBM Plex Mono", monospace';
        ctx.fillText(String(ev.year), w / 2 - 16, y);
        ctx.fillStyle = '#9098A4';
        ctx.textAlign = 'left';
        ctx.font = '400 12px "Noto Sans SC", "IBM Plex Mono", sans-serif';
        ctx.fillText(ev.text, w / 2 + 16, y);
        y += 19;
      }
    }

    // Compact stat blocks — pushed below the events row, slim weight.
    const leftX  = 60;
    const rightX = w - 60;
    const startY = 360;
    const lineH  = 54;

    ctx.textAlign = 'left';
    for (let i = 0; i < 3; i++) {
      drawStatBlock(ctx, leftX, startY + i * lineH, stats[i], body, tSec, i, mul);
    }
    ctx.textAlign = 'right';
    for (let i = 0; i < 3; i++) {
      drawStatBlock(ctx, rightX, startY + i * lineH, stats[i + 3], body, tSec, i + 3, mul);
    }

    ctx.restore();
  }

  function drawStatBlock(ctx, x, y, stat, body, tSec, idx, mul) {
    mul = mul != null ? mul : 1;
    ctx.font = '500 9px "IBM Plex Mono", monospace';
    ctx.fillStyle = '#5A5E66';
    ctx.fillText(stat.label, x, y);

    ctx.font = '500 17px "IBM Plex Mono", monospace';
    ctx.fillStyle = '#D4D8E0';
    const valStr = `${stat.value}${stat.unit ? ' ' : ''}${stat.unit}`;
    ctx.fillText(valStr, x, y + 12);

    // Sparkline — subtle, never the focal point.
    const spark = '▁▂▃▄▅▆▇█';
    let s = '';
    for (let j = 0; j < 12; j++) {
      const v = Math.sin(tSec * 1.4 + j * 0.6 + idx * 1.7) * 0.5 + 0.5;
      s += spark[Math.floor(v * (spark.length - 0.01))];
    }
    ctx.font = '400 10px "IBM Plex Mono", monospace';
    ctx.fillStyle = body.primaryColor;
    ctx.globalAlpha = 0.42 * mul;
    ctx.fillText(s, x, y + 34);
    ctx.globalAlpha = mul;
  }

  NS.render = {
    initFields, bodySpriteRadius,
    drawCelestialGrid,
    drawStars,
    drawOrbitRings,
    drawAsteroids,
    drawBodiesOverview,
    drawComet,
    drawPlanetDetail,
    drawBlackHoleDetail,
    drawTransitionGlobeDot, drawTransitionGlobeMatrix,
    overlayOverview, overlayDetail,
    invalidateAsteroids
  };
})(window.SolarSys);
