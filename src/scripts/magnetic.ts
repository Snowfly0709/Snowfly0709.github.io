// Magnetic — [data-magnetic] elements gently follow the pointer when nearby.
// Default radius: 80px. Max translate: 8px on the element, 14px on its first child.

const RADIUS = 100;
const MAX_TRANSLATE = 8;
const CHILD_MULTIPLIER = 1.6;

type MagState = { el: HTMLElement; child: HTMLElement | null };

function attach(el: HTMLElement, state: MagState[]) {
  if (el.hasAttribute("data-magnetic-bound")) return;
  el.setAttribute("data-magnetic-bound", "");
  const child = el.querySelector<HTMLElement>(":scope > *") ?? null;
  state.push({ el, child });
}

function init() {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion) return;

  const state: MagState[] = [];
  const sync = () => {
    document.querySelectorAll<HTMLElement>("[data-magnetic]").forEach((el) => attach(el, state));
  };
  sync();
  document.addEventListener("astro:page-load", sync);

  let raf = 0;
  let pointerX = 0;
  let pointerY = 0;

  const tick = () => {
    raf = 0;
    for (const { el, child } of state) {
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const dx = pointerX - cx;
      const dy = pointerY - cy;
      const dist = Math.hypot(dx, dy);

      if (dist > RADIUS) {
        if (!el.classList.contains("is-magnetic-resting")) {
          el.classList.add("is-magnetic-resting");
          el.style.transform = "translate3d(0,0,0)";
          if (child) child.style.transform = "translate3d(0,0,0)";
        }
        continue;
      }

      el.classList.remove("is-magnetic-resting");
      const t = 1 - dist / RADIUS;
      const tx = (dx / dist || 0) * MAX_TRANSLATE * t;
      const ty = (dy / dist || 0) * MAX_TRANSLATE * t;
      el.style.transform = `translate3d(${tx.toFixed(2)}px, ${ty.toFixed(2)}px, 0)`;
      if (child) {
        child.style.transform = `translate3d(${(tx * CHILD_MULTIPLIER).toFixed(2)}px, ${(ty * CHILD_MULTIPLIER).toFixed(2)}px, 0)`;
      }
    }
  };

  const onPointerMove = (e: PointerEvent) => {
    pointerX = e.clientX;
    pointerY = e.clientY;
    if (!raf) raf = requestAnimationFrame(tick);
  };

  const onPointerLeave = () => {
    for (const { el, child } of state) {
      el.classList.add("is-magnetic-resting");
      el.style.transform = "translate3d(0,0,0)";
      if (child) child.style.transform = "translate3d(0,0,0)";
    }
  };

  window.addEventListener("pointermove", onPointerMove, { passive: true });
  window.addEventListener("pointerleave", onPointerLeave, { passive: true });
}

if (typeof window !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
}
