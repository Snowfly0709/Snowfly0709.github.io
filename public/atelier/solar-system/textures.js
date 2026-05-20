// Surface samplers: turn each body's declarative surface spec into a fast
// (lat, lon) → feature-intensity lookup used by the dot-matrix globe renderer.
window.SolarSys = window.SolarSys || {};

(function (NS) {
  const MAP_W = 360;
  const MAP_H = 180;

  // ── Polygon → binary raster (offscreen canvas) ────────────────────────────
  function buildLandRaster(polygons) {
    const cv = document.createElement('canvas');
    cv.width = MAP_W; cv.height = MAP_H;
    const c2 = cv.getContext('2d');
    c2.fillStyle = '#000';
    c2.fillRect(0, 0, MAP_W, MAP_H);
    c2.fillStyle = '#fff';
    for (const poly of polygons) {
      c2.beginPath();
      for (let i = 0; i < poly.length; i++) {
        const px = ((poly[i][0] + 180) / 360) * MAP_W;
        const py = ((90 - poly[i][1]) / 180) * MAP_H;
        if (i === 0) c2.moveTo(px, py); else c2.lineTo(px, py);
      }
      c2.closePath();
      c2.fill();
    }
    const data = c2.getImageData(0, 0, MAP_W, MAP_H).data;
    // pack to Uint8Array for compactness
    const out = new Uint8Array(MAP_W * MAP_H);
    for (let i = 0, j = 0; i < data.length; i += 4, j++) {
      out[j] = data[i] > 128 ? 1 : 0;
    }
    return { w: MAP_W, h: MAP_H, bits: out };
  }

  function isLand(raster, latDeg, lonDeg) {
    let px = Math.floor(((lonDeg + 180) / 360) * raster.w);
    let py = Math.floor(((90 - latDeg) / 180) * raster.h);
    if (py < 0) py = 0; else if (py >= raster.h) py = raster.h - 1;
    px = ((px % raster.w) + raster.w) % raster.w;
    return raster.bits[py * raster.w + px] === 1;
  }

  // ── Hash-based sample noise ───────────────────────────────────────────────
  function hash2(x, y, seed) {
    let h = (x | 0) * 374761393 + (y | 0) * 668265263 + (seed | 0) * 1274126177;
    h = (h ^ (h >>> 13)) * 1274126177;
    h = h ^ (h >>> 16);
    return ((h >>> 0) / 4294967296);
  }

  // ── Per-body surface sampler ──────────────────────────────────────────────
  // Returns:
  //   { feature: boolean, accent: '#xxxxxx'|null, density: 0..1 }
  // 'feature' = land / band-bright / crater hit; renderer chooses char + alpha.
  function makeSampler(body) {
    const s = body.surface;
    if (!s) return () => ({ feature: false, accent: null, density: 0 });

    if (s.type === 'continents') {
      const raster = buildLandRaster(s.polygons);
      const polarCutoff = s.polarSize ? (90 - s.polarSize * 90) : 78;
      return (lat, lon) => {
        if (s.polarCaps && Math.abs(lat) > polarCutoff) {
          return { feature: true, accent: '#E8E8E8', density: 0.9 };
        }
        const land = isLand(raster, lat, lon);
        // Random cloud streak
        if (!land && s.cloudiness > 0) {
          const cloud = hash2(Math.round(lat * 1.8), Math.round(lon * 1.2), 777);
          if (cloud < s.cloudiness * 0.35) {
            return { feature: true, accent: '#E8EDF2', density: 0.75 };
          }
        }
        return { feature: land, accent: null, density: land ? 1 : 0.32 };
      };
    }

    if (s.type === 'bands') {
      const bandFor = (lat) => {
        for (const b of s.bands) if (lat >= b.from && lat <= b.to) return b;
        return null;
      };
      const storms = s.storms || [];
      return (lat, lon) => {
        for (const st of storms) {
          const dLon = ((lon - st.lon + 540) % 360) - 180;
          const dLat = lat - st.lat;
          if ((dLon * dLon) / (st.rLon * st.rLon) + (dLat * dLat) / (st.rLat * st.rLat) < 1) {
            return { feature: true, accent: st.color, density: st.intensity };
          }
        }
        const b = bandFor(lat);
        if (!b) return { feature: false, accent: null, density: 0.3 };
        // Within a band, sub-sample noise so the row isn't dead-uniform
        const n = hash2(Math.round(lon * 0.55), Math.round(lat * 4.5), 909);
        return {
          feature: n < b.intensity,
          accent: null,
          density: b.intensity * (0.6 + 0.4 * n)
        };
      };
    }

    if (s.type === 'noise') {
      const seed = s.seed || 1;
      return (lat, lon) => {
        const polar = Math.abs(lat) > 70 ? 1 : 0;
        if (polar && s.polarBright && hash2(Math.round(lon), Math.round(lat), seed + 1) < s.polarBright) {
          return { feature: true, accent: '#E8E8E8', density: 0.85 };
        }
        if (s.swirlBands) {
          const w = Math.sin(lat * Math.PI / 90 * s.swirlBands * 0.5 + lon * Math.PI / 180 * 1.2);
          const noise = hash2(Math.round(lon * 0.4), Math.round(lat * 0.9), seed) * 0.6 - 0.3;
          return { feature: (w + noise) > 0.15, accent: null, density: 0.75 };
        }
        if (s.craterDensity != null) {
          const n = hash2(Math.round(lon * 1.5), Math.round(lat * 2.0), seed);
          return { feature: n < s.craterDensity, accent: null, density: 0.85 };
        }
        return { feature: false, accent: null, density: 0.4 };
      };
    }

    if (s.type === 'star') {
      return () => ({ feature: true, accent: null, density: 1.0 });
    }

    return () => ({ feature: false, accent: null, density: 0.4 });
  }

  // Pre-build per-body samplers (memoized on the body itself).
  function getSampler(body) {
    if (!body.__sampler) body.__sampler = makeSampler(body);
    return body.__sampler;
  }

  NS.surface = { buildLandRaster, isLand, makeSampler, getSampler };
})(window.SolarSys);
