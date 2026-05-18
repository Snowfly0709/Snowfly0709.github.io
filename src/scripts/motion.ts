// Scroll reveal — [data-reveal] + [data-stagger]
// Auto-observes elements and adds `.is-in` when intersecting viewport.
// Re-runs after Astro View Transitions to handle new DOM.

const STAGGER_BASE = 80; // ms per stagger index

function setRevealDelay(el: HTMLElement) {
  const stagger = el.dataset.stagger;
  if (stagger) {
    const idx = Number(stagger);
    if (Number.isFinite(idx) && idx > 0) {
      el.style.setProperty("--reveal-delay", `${idx * STAGGER_BASE}ms`);
    }
  }
}

function observeReveal() {
  const targets = document.querySelectorAll<HTMLElement>("[data-reveal]:not(.is-in):not([data-reveal-observed])");
  if (!targets.length) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion) {
    targets.forEach((el) => el.classList.add("is-in"));
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          (e.target as HTMLElement).classList.add("is-in");
          io.unobserve(e.target);
        }
      }
    },
    { rootMargin: "0px 0px -10% 0px", threshold: 0.05 }
  );

  targets.forEach((el) => {
    setRevealDelay(el);
    el.setAttribute("data-reveal-observed", "");
    io.observe(el);
  });
}

if (typeof window !== "undefined") {
  document.addEventListener("DOMContentLoaded", observeReveal);
  document.addEventListener("astro:page-load", observeReveal);
  // Run immediately for current page (in case script loads after DOMContentLoaded)
  observeReveal();
}
