// Page-wide coordinated pulse.
// Periodically pulses one [data-attention-id] node plus 1-2 of its neighbors,
// suggesting the underlying graph without showing it.
// Pauses while the user is actively hovering a node (so the global attention
// highlight has the stage), resumes shortly after they leave.

import { buildAdjacency } from "../data/attention-graph";

const TICK_MS = 2400;
const HISTORY = 10;
const RESUME_DELAY = 900;

type Pulse = { hub: HTMLElement; neighbors: HTMLElement[] };

type State = {
  nodes: Map<string, HTMLElement[]>;
  adjacency: Record<string, string[]>;
  visible: Set<string>;             // ids whose at-least-one instance is in viewport
  io: IntersectionObserver | null;
  current: Pulse | null;
  recent: string[];
  timer: number | null;
  paused: boolean;
};

let state: State | null = null;

function clearPulse() {
  if (!state || !state.current) return;
  state.current.hub.classList.remove("is-pulsing");
  for (const n of state.current.neighbors) n.classList.remove("is-pulsing");
  state.current = null;
}

function pickHubId(): string | null {
  if (!state) return null;
  const candidates = Array.from(state.visible).filter((id) => !state.recent.includes(id));
  const pool = candidates.length > 0 ? candidates : Array.from(state.visible);
  if (pool.length === 0) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}

function pickNeighbors(hubId: string, count: number): HTMLElement[] {
  if (!state) return [];
  const ns = state.adjacency[hubId] ?? [];
  const inViewport = ns.filter((id) => state!.visible.has(id));
  const pool = inViewport.length > 0 ? inViewport : ns;
  const out: HTMLElement[] = [];
  const remaining = [...pool];
  for (let i = 0; i < count && remaining.length > 0; i++) {
    const idx = Math.floor(Math.random() * remaining.length);
    const nid = remaining.splice(idx, 1)[0];
    const instances = state.nodes.get(nid) ?? [];
    if (instances.length === 0) continue;
    // Prefer an instance that's visible
    const visible = instances.find((el) => isElementInViewport(el)) ?? instances[0];
    out.push(visible);
  }
  return out;
}

function isElementInViewport(el: HTMLElement): boolean {
  const r = el.getBoundingClientRect();
  return r.bottom > 0 && r.top < (window.innerHeight || 0);
}

function tick() {
  if (!state || state.paused) return;
  clearPulse();
  const hubId = pickHubId();
  if (!hubId) return;
  const hubInstances = state.nodes.get(hubId) ?? [];
  const hub = hubInstances.find((el) => isElementInViewport(el)) ?? hubInstances[0];
  if (!hub) return;

  const neighbors = pickNeighbors(hubId, 1 + Math.floor(Math.random() * 2));

  hub.classList.add("is-pulsing");
  for (const n of neighbors) n.classList.add("is-pulsing");

  state.current = { hub, neighbors };
  state.recent.push(hubId);
  while (state.recent.length > HISTORY) state.recent.shift();
}

function stop() {
  if (!state) return;
  if (state.timer !== null) {
    clearInterval(state.timer);
    state.timer = null;
  }
  clearPulse();
}

function start() {
  if (!state || state.paused) return;
  stop();
  // Initial delay so the page settles first
  state.timer = window.setTimeout(() => {
    if (!state) return;
    tick();
    state.timer = window.setInterval(tick, TICK_MS) as unknown as number;
  }, 1600) as unknown as number;
}

function refresh() {
  // Tear down
  stop();
  if (state?.io) state.io.disconnect();
  state = null;

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced) return;

  // Only pulse curated nodes (skip seq-* tokens — too numerous, would be noisy)
  const nodes = new Map<string, HTMLElement[]>();
  const els = document.querySelectorAll<HTMLElement>(
    '[data-attention-id]:not([data-attention-id^="seq-"])'
  );
  if (!els.length) return;

  for (const el of els) {
    const id = el.dataset.attentionId;
    if (!id) continue;
    if (!nodes.has(id)) nodes.set(id, []);
    nodes.get(id)!.push(el);
  }

  state = {
    nodes,
    adjacency: buildAdjacency(),
    visible: new Set(),
    io: null,
    current: null,
    recent: [],
    timer: null,
    paused: false,
  };

  // Track which ids have at least one instance in viewport
  state.io = new IntersectionObserver(
    (entries) => {
      if (!state) return;
      for (const e of entries) {
        const id = (e.target as HTMLElement).dataset.attentionId;
        if (!id) continue;
        if (e.isIntersecting) state.visible.add(id);
        else {
          // Only remove if no other instance of this id is visible
          const allInstances = state.nodes.get(id) ?? [];
          const stillVisible = allInstances.some((el) => isElementInViewport(el) && el !== e.target);
          if (!stillVisible) state.visible.delete(id);
        }
      }
    },
    { rootMargin: "-10% 0px -10% 0px", threshold: 0 }
  );
  for (const el of els) state.io.observe(el);

  start();
}

let resumeTimer: number | null = null;

function pauseForHover() {
  if (!state) return;
  state.paused = true;
  stop();
  if (resumeTimer !== null) {
    clearTimeout(resumeTimer);
    resumeTimer = null;
  }
}

function scheduleResume() {
  if (!state) return;
  if (resumeTimer !== null) clearTimeout(resumeTimer);
  resumeTimer = window.setTimeout(() => {
    resumeTimer = null;
    if (!state) return;
    state.paused = false;
    start();
  }, RESUME_DELAY) as unknown as number;
}

if (typeof window !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", refresh);
  } else {
    refresh();
  }
  document.addEventListener("astro:page-load", refresh);
  document.addEventListener("astro:before-swap", stop);

  document.addEventListener("attention:active", pauseForHover);
  document.addEventListener("attention:idle", scheduleResume);

  const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
  mql.addEventListener?.("change", refresh);
}
