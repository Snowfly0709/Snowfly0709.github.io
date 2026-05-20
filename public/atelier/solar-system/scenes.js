// Scene state machine + camera + transition tweens + input handlers.
window.SolarSys = window.SolarSys || {};

(function (NS) {
  const m = NS.math;
  const TAU = m.TAU;

  const STATE = {
    ENTRY_ANIM: 'ENTRY_ANIM',
    OVERVIEW: 'OVERVIEW',
    ZOOM_IN: 'ZOOM_IN',
    DETAIL: 'DETAIL',
    ZOOM_OUT: 'ZOOM_OUT'
  };

  const ENTRY_DURATION = 2400;
  const TRANSITION_DURATION = 900;

  // Fixed scale for the ecliptic-observer view. Sun sits at ~25% from left so
  // the right ~75% of the canvas holds the orbital fan. Jupiter (d=80) is near
  // the edge of regular visibility; outer planets drift in and out.
  function defaultScale(cols) {
    return Math.max(1.2, Math.min(1.9, (cols * 0.75 - 30) / 90));
  }

  function makeScene(grid) {
    const initScale = defaultScale(grid.cols);
    // Initial camera offset: sun appears at ~25% from left edge instead of
    // dead-center. This frees up the right 75% for the orbital fan.
    const initCamX = (grid.cols / 4) / initScale;
    const scene = {
      state: STATE.ENTRY_ANIM,
      stateT: 0,
      grid,
      cam: { cx: initCamX, cy: 0, scale: initScale },
      defaultScale: initScale,
      defaultCamX: initCamX,

      // entry-anim helpers
      appearProgress: {},
      starFade: 0,
      titleAlpha: 0,
      hintAlpha: 0,
      titleShownOnce: false,    // once the intro title has played, never re-show

      // transition state: 0 = full overview, 1 = full detail (camera does not move)
      transitionProgress: 0,
      transitionTargetBody: null,
      transitionFromCell: null,   // captured at click time

      // detail
      currentBody: null,

      // input state
      mouseCellX: -1,
      mouseCellY: -1,
      hoveredBody: null,
      hoveredCellPos: null
    };

    for (const b of NS.BODIES) scene.appearProgress[b.id] = 0;

    return scene;
  }

  function update(scene, dtMs) {
    scene.stateT += dtMs;
    if (scene.state === STATE.ENTRY_ANIM) updateEntry(scene);
    else if (scene.state === STATE.OVERVIEW) updateOverview(scene);
    else if (scene.state === STATE.ZOOM_IN) updateZoomIn(scene);
    else if (scene.state === STATE.DETAIL) updateDetail(scene);
    else if (scene.state === STATE.ZOOM_OUT) updateZoomOut(scene);
  }

  function updateEntry(scene) {
    const t = scene.stateT;

    // Stars fade in: 0–800ms
    scene.starFade = m.clamp(t / 800, 0, 1);

    // Title fade in: 800–1400ms — skipped if it has already played once.
    if (!scene.titleShownOnce) {
      scene.titleAlpha = m.clamp((t - 800) / 600, 0, 1);
    } else {
      scene.titleAlpha = 0;
    }

    // Bodies cascade from sun outward: 1400–2400ms, 80ms stagger
    const bodyStart = 1400;
    const bodyStagger = 80;
    NS.BODIES.forEach((b, i) => {
      const localT = t - bodyStart - i * bodyStagger;
      const p = m.clamp(localT / 500, 0, 1);
      scene.appearProgress[b.id] = m.easeOutBack(p);
    });

    // Hint slowly comes in at end
    scene.hintAlpha = m.clamp((t - 1800) / 600, 0, 1);

    if (t >= ENTRY_DURATION) {
      scene.state = STATE.OVERVIEW;
      scene.stateT = 0;
      for (const b of NS.BODIES) scene.appearProgress[b.id] = 1;
      if (!scene.titleShownOnce) scene.titleAlpha = 1;
      else scene.titleAlpha = 0;
      scene.hintAlpha = 1;
      // Mark the title as used once the first entry completes — any future
      // applySystem (explore / 归) will skip it.
      scene.titleShownOnce = true;
    }
  }

  function updateOverview(scene) {
    // Title fades out after a while in overview — but only if currently visible
    // (otherwise returning from detail would briefly resurrect the title).
    if (scene.titleAlpha > 0) {
      const fade = m.clamp(1 - (scene.stateT - 3000) / 1500, 0, 1);
      scene.titleAlpha = fade;
    }
  }

  function updateZoomIn(scene) {
    const p = m.clamp(scene.stateT / TRANSITION_DURATION, 0, 1);
    scene.transitionProgress = m.easeInOutQuart(p);
    scene.titleAlpha = m.lerp(scene.titleAlpha, 0, 0.15);
    scene.hintAlpha = m.lerp(scene.hintAlpha, 0, 0.15);
    if (p >= 1) {
      scene.state = STATE.DETAIL;
      scene.stateT = 0;
      scene.currentBody = scene.transitionTargetBody;
      scene.transitionProgress = 1;
    }
  }

  function updateDetail(scene) {
    // Static — animations driven by global time elsewhere
  }

  function updateZoomOut(scene) {
    const p = m.clamp(scene.stateT / TRANSITION_DURATION, 0, 1);
    scene.transitionProgress = 1 - m.easeInOutQuart(p);
    if (p >= 1) {
      scene.state = STATE.OVERVIEW;
      scene.stateT = 0;
      scene.currentBody = null;
      scene.transitionTargetBody = null;
      scene.transitionProgress = 0;
      scene.titleAlpha = 0;
      scene.hintAlpha = 1;
    }
  }

  // ===== Input =====

  function handleWheel(scene, deltaY /*, mouseCellX, mouseCellY */) {
    // OVERVIEW intentionally ignores wheel — the ecliptic-observer view has
    // no zoom. DETAIL still uses wheel-out as the return gesture.
    if (scene.state === STATE.DETAIL && deltaY > 6) {
      beginZoomOut(scene);
    }
  }

  function beginZoomOut(scene) {
    scene.transitionTargetBody = scene.currentBody;
    scene.state = STATE.ZOOM_OUT;
    scene.stateT = 0;
    scene.transitionProgress = 1;
  }

  function handleClick(scene, mouseCellX, mouseCellY, currentTime) {
    // Click during entry: snap the cascade to completion so the user isn't
    // stuck waiting 2.4s before they can interact.
    if (scene.state === STATE.ENTRY_ANIM) finishEntry(scene);
    if (scene.state !== STATE.OVERVIEW) return;
    let body = scene.hoveredBody;
    if (!body) body = pickBody(scene, mouseCellX, mouseCellY, currentTime);
    if (!body) return;
    beginZoomIn(scene, body, currentTime);
  }

  function finishEntry(scene) {
    scene.state = STATE.OVERVIEW;
    scene.stateT = 0;
    for (const b of NS.BODIES) scene.appearProgress[b.id] = 1;
    scene.starFade = 1;
    scene.titleAlpha = scene.titleShownOnce ? 0 : 1;
    scene.hintAlpha = 1;
    scene.titleShownOnce = true;
  }

  function beginZoomIn(scene, body, currentTime) {
    // Camera does NOT move. The target body morphs from its orbital position +
    // overview-radius to bottom-center + detail-radius. Other elements fade.
    scene.transitionTargetBody = body;
    scene.state = STATE.ZOOM_IN;
    scene.stateT = 0;
    scene.transitionProgress = 0;
  }

  function pickBody(scene, cellX, cellY, currentTime) {
    const cols = scene.grid.cols, rows = scene.grid.rows;
    let best = null;
    let bestScore = Infinity;
    let bestCell = null;
    for (const body of NS.BODIES) {
      let pos;
      if (!body.displayDistance) {
        pos = { x: 0, y: 0 };
      } else {
        const theta = (currentTime / 1000 / body.visualOrbitSec) * TAU + body.phaseOffset;
        pos = m.ellipsePoint(body.displayDistance, body.eccentricity, theta);
      }
      const cell = m.auToCell(pos.x, pos.y, scene.cam, cols, rows);
      const d = Math.max(Math.abs(cell.x - cellX), Math.abs(cell.y - cellY));
      // Hit radius follows sprite size; stars with big blooms get the entire
      // bright halo treated as clickable so the user can hit the giant
      // visual presence — not just the small bright core.
      const spriteR = NS.render && NS.render.bodySpriteRadius
        ? NS.render.bodySpriteRadius(body, scene.cam.scale)
        : 1;
      let hitR = Math.max(6, Math.ceil(spriteR) + 3);
      const isStar = body.surface && body.surface.type === 'star';
      if (isStar && NS.STAR_VISUALS) {
        const v = NS.STAR_VISUALS[body.starType || 'sun'];
        if (v) {
          const reach = v.bloomMul || v.haloMul || v.diskMul || 5;
          hitR = Math.max(hitR, Math.ceil(spriteR * reach * 0.5));
        }
      }
      if (d <= hitR && d < bestScore) {
        best = body;
        bestScore = d;
        bestCell = cell;
      }
    }
    if (best) scene.hoveredCellPos = bestCell;
    return best;
  }

  function updateHover(scene, mouseCellX, mouseCellY, currentTime) {
    scene.mouseCellX = mouseCellX;
    scene.mouseCellY = mouseCellY;
    if (scene.state !== STATE.OVERVIEW) {
      scene.hoveredBody = null;
      scene.hoveredCellPos = null;
      return null;
    }
    const body = pickBody(scene, mouseCellX, mouseCellY, currentTime);
    scene.hoveredBody = body;
    return body;
  }

  NS.scenes = {
    STATE, defaultScale,
    makeScene, update, handleWheel, handleClick, updateHover
  };
})(window.SolarSys);
