// Bootstrap: load fonts, init canvas/grid/scene, drive RAF loop, dispatch inputs.
(function () {
  const NS = window.SolarSys;
  const m = NS.math;

  const FONT_SIZE = 15;
  const FONT_STACK = '500 15px "IBM Plex Mono", "JetBrains Mono", "Sarasa Mono SC", monospace';

  let canvas, ctx;
  let dpr = 1;
  let viewportW = 0, viewportH = 0;
  let cellW = 0, cellH = 0;
  let cols = 0, rows = 0;
  let buffer = null;
  let scene = null;
  let lastNow = 0;
  let mousePixelX = -1, mousePixelY = -1;
  let mouseCellX = -1, mouseCellY = -1;

  async function bootstrap() {
    canvas = document.getElementById('stage');
    ctx = canvas.getContext('2d', { alpha: false });

    try {
      await Promise.race([
        Promise.all([
          document.fonts.load('500 15px "IBM Plex Mono"'),
          document.fonts.load('700 64px "IBM Plex Mono"'),
          document.fonts.load('600 32px "Noto Serif SC"'),
          document.fonts.load('400 22px "Noto Serif SC"')
        ]),
        new Promise(res => setTimeout(res, 2500))
      ]);
    } catch (e) { /* fallback fonts will render */ }

    document.getElementById('loading').classList.add('hidden');

    // Compute the plate epoch once: J{year}.{day-of-year}
    {
      const d = new Date();
      const start = Date.UTC(d.getFullYear(), 0, 1);
      const doy = Math.floor((d - start) / 86400000) + 1;
      NS.__epochString = `J${d.getFullYear()}.${String(doy).padStart(3, '0')}`;
    }

    resize();
    scene = NS.scenes.makeScene({ cols, rows });
    NS.render.initFields();

    window.addEventListener('resize', () => {
      resize();
      if (buffer) buffer.resize(cols, rows);
      if (scene) scene.grid = { cols, rows };
    });
    canvas.addEventListener('wheel', onWheel, { passive: false });
    canvas.addEventListener('click', onClick);
    canvas.addEventListener('mousemove', onMouseMove);
    window.addEventListener('keydown', onKeyDown);

    lastNow = performance.now();
    requestAnimationFrame(tick);
  }

  function resize() {
    dpr = Math.max(1, window.devicePixelRatio || 1);
    viewportW = window.innerWidth;
    viewportH = window.innerHeight;
    canvas.width = Math.floor(viewportW * dpr);
    canvas.height = Math.floor(viewportH * dpr);
    canvas.style.width = viewportW + 'px';
    canvas.style.height = viewportH + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.font = FONT_STACK;
    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';

    const metrics = ctx.measureText('M');
    cellW = Math.max(6, metrics.width);
    cellH = FONT_SIZE * 1.20;

    cols = Math.max(40, Math.floor(viewportW / cellW));
    rows = Math.max(20, Math.floor(viewportH / cellH));

    if (!buffer) buffer = new NS.CharBuffer(cols, rows);
    else buffer.resize(cols, rows);

    NS.__cellMetrics = { w: cellW, h: cellH };
  }

  function tick(now) {
    const dt = Math.min(now - lastNow, 64);
    lastNow = now;

    NS.scenes.update(scene, dt);

    if (mouseCellX >= 0) NS.scenes.updateHover(scene, mouseCellX, mouseCellY, now);
    canvas.classList.toggle('hover',
      !!scene.hoveredBody || !!scene.exploreHover || !!scene.returnHover);

    // Clear canvas — deep ink background
    ctx.fillStyle = '#08090C';
    ctx.fillRect(0, 0, viewportW, viewportH);

    const STATE = NS.scenes.STATE;
    const state = scene.state;
    const isOverviewLike = state === STATE.OVERVIEW || state === STATE.ENTRY_ANIM;
    const isDetail = state === STATE.DETAIL;
    const inTransition = state === STATE.ZOOM_IN || state === STATE.ZOOM_OUT;
    const tp = scene.transitionProgress != null ? scene.transitionProgress : 0;

    // Crossfade weights: overview overlays fade out by tp=0.7; detail overlays fade in from tp=0.3.
    const overviewAlpha = isOverviewLike ? 1 :
                         isDetail ? 0 :
                         m.clamp(1 - tp / 0.7, 0, 1);
    const detailAlpha = isDetail ? 1 :
                       isOverviewLike ? 0 :
                       m.clamp((tp - 0.3) / 0.7, 0, 1);

    const cellAspect = cellW / cellH;
    const entryFade = scene.appearProgress.sun != null ? scene.appearProgress.sun : 1;
    const starFade = m.clamp(scene.starFade, 0, 1);

    buffer.clear();

    // Stars + asteroids + comet (char buffer, in background z-order)
    NS.render.drawStars(buffer,
      m.lerp(0.55, starFade, overviewAlpha),
      m.lerp(0.4, 1, overviewAlpha));
    if (overviewAlpha > 0.005) {
      NS.render.drawAsteroids(buffer, scene.cam, now, m.clamp(entryFade, 0, 1) * overviewAlpha);
      if (state === STATE.OVERVIEW) {
        NS.render.drawComet(buffer, now, m.clamp(entryFade, 0, 1));
      }
    }
    // Detail half-globe stays in the buffer (char dot-matrix) — except black
    // holes, which render via ctx after the buffer flush.
    if (isDetail && scene.currentBody && scene.currentBody.starType !== 'black-hole') {
      NS.render.drawPlanetDetail(buffer, scene.currentBody, now, cellAspect);
    }
    // Transition body in dot-matrix mode (large R) also goes to buffer
    if (inTransition) {
      NS.render.drawTransitionGlobeMatrix(buffer, scene, now, cellAspect);
    }

    ctx.font = FONT_STACK;
    buffer.flush(ctx, cellW, cellH);

    // Thin foreshortened orbit ellipses — drawn on top of stars, below bodies.
    if (overviewAlpha > 0.005) {
      NS.render.drawOrbitRings(ctx, viewportW, viewportH, scene.cam,
        m.clamp(entryFade, 0, 1) * overviewAlpha, cellW, cellH);
    }

    // Overview bodies (realistic ctx dots + sun lens flare)
    if (overviewAlpha > 0.005) {
      NS.render.drawBodiesOverview(
        ctx, scene, now,
        scene.hoveredBody && scene.hoveredBody.id,
        scene.appearProgress, cellW, cellH,
        {
          excludeId: inTransition && scene.transitionTargetBody ? scene.transitionTargetBody.id : null,
          alphaMul: overviewAlpha
        }
      );
    }
    // Transition body in dot mode (small R) goes to ctx
    if (inTransition) {
      NS.render.drawTransitionGlobeDot(ctx, scene, now, cellAspect, cellW, cellH);
    }
    // Black hole detail render (ctx-only; replaces the half-globe path).
    if (isDetail && scene.currentBody && scene.currentBody.starType === 'black-hole') {
      NS.render.drawBlackHoleDetail(ctx, scene.currentBody, now, cellW, cellH,
        scene.grid.cols, scene.grid.rows, cellAspect);
    }

    // Overlays crossfade
    if (overviewAlpha > 0.005) {
      NS.render.overlayOverview(ctx, viewportW, viewportH, now, scene,
        scene.hoveredBody, scene.hoveredCellPos, cellW, cellH, overviewAlpha);
    }
    if (detailAlpha > 0.005) {
      const body = scene.currentBody || scene.transitionTargetBody;
      if (body) NS.render.overlayDetail(ctx, viewportW, viewportH, body, now, detailAlpha);
    }

    requestAnimationFrame(tick);
  }

  function onWheel(e) {
    e.preventDefault();
    NS.scenes.handleWheel(scene, e.deltaY, mouseCellX, mouseCellY);
  }

  function pointInBounds(px, py, b) {
    if (!b) return false;
    return px >= b.x && px <= b.x + b.w && py >= b.y && py <= b.y + b.h;
  }

  function onClick(e) {
    const rect = canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    const STATE = NS.scenes.STATE;
    const overviewActive = scene.state === STATE.OVERVIEW || scene.state === STATE.ENTRY_ANIM;
    if (overviewActive) {
      // Return button has priority — it sits left of the explore button.
      if (pointInBounds(px, py, NS.__returnButton) && NS.ORIGINAL_SYSTEM && NS.applySystem) {
        NS.applySystem(scene, NS.ORIGINAL_SYSTEM);
        return;
      }
      if (pointInBounds(px, py, NS.__exploreButton) && NS.generateRandomSystem) {
        const system = NS.generateRandomSystem();
        NS.applySystem(scene, system);
        return;
      }
    }
    const cx = Math.floor(px / cellW);
    const cy = Math.floor(py / cellH);
    NS.scenes.handleClick(scene, cx, cy, performance.now());
  }

  function onMouseMove(e) {
    const rect = canvas.getBoundingClientRect();
    mousePixelX = e.clientX - rect.left;
    mousePixelY = e.clientY - rect.top;
    mouseCellX = Math.floor(mousePixelX / cellW);
    mouseCellY = Math.floor(mousePixelY / cellH);
    if (scene) {
      scene.exploreHover = pointInBounds(mousePixelX, mousePixelY, NS.__exploreButton);
      scene.returnHover  = pointInBounds(mousePixelX, mousePixelY, NS.__returnButton);
    }
  }

  function onKeyDown(e) {
    if (e.key !== 'Escape') return;
    if (!scene || !scene.systemMeta || !NS.ORIGINAL_SYSTEM || !NS.applySystem) return;
    const STATE = NS.scenes.STATE;
    if (scene.state === STATE.OVERVIEW || scene.state === STATE.ENTRY_ANIM) {
      NS.applySystem(scene, NS.ORIGINAL_SYSTEM);
      e.preventDefault();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap);
  } else {
    bootstrap();
  }
})();
