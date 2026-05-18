// Page-wide Attention Graph
// On hover any [data-attention-id], illuminate all instances of that id
// + all neighbors (per the graph in src/data/attention-graph.ts), and
// draw cross-page Bezier curves on .attention-canvas.

import { attentionEdges, buildAdjacency } from "../data/attention-graph";

const SVG_NS = "http://www.w3.org/2000/svg";
const SEQ_WINDOW = 2; // each seq token links to ±N neighbors within its paragraph

type Center = { x: number; y: number };

type Ctx = {
  host: HTMLElement;
  canvas: SVGSVGElement;
  edgesLayer: SVGGElement;
  nodes: Map<string, HTMLElement[]>;        // id → instances
  centers: WeakMap<HTMLElement, Center>;    // element → center in host coords
  paths: Map<string, SVGPathElement>;       // sorted "a|b" → path
  adjacency: Record<string, string[]>;
  currentHover: HTMLElement | null;
  ro: ResizeObserver | null;
};

/** Walk the DOM and infer sequential edges between seq-* nodes that share a parent. */
function inferSequentialEdges(host: HTMLElement): Array<[string, string]> {
  const out: Array<[string, string]> = [];
  const seqEls = Array.from(host.querySelectorAll<HTMLElement>('[data-attention-id^="seq-"]'));
  const byParent = new Map<HTMLElement, HTMLElement[]>();
  for (const el of seqEls) {
    const parent = el.parentElement;
    if (!parent) continue;
    if (!byParent.has(parent)) byParent.set(parent, []);
    byParent.get(parent)!.push(el);
  }
  for (const [, tokens] of byParent) {
    for (let i = 0; i < tokens.length; i++) {
      const aId = tokens[i].dataset.attentionId;
      if (!aId) continue;
      for (let j = i + 1; j <= Math.min(i + SEQ_WINDOW, tokens.length - 1); j++) {
        const bId = tokens[j].dataset.attentionId;
        if (!bId) continue;
        out.push([aId, bId]);
      }
    }
  }
  return out;
}

/** Also link keyword tokens to their immediate seq neighbors so semantic + positional cohere. */
function inferKeywordSeqEdges(host: HTMLElement): Array<[string, string]> {
  const out: Array<[string, string]> = [];
  const allTokens = Array.from(host.querySelectorAll<HTMLElement>('.atk[data-attention-id]'));
  const byParent = new Map<HTMLElement, HTMLElement[]>();
  for (const el of allTokens) {
    const parent = el.parentElement;
    if (!parent) continue;
    if (!byParent.has(parent)) byParent.set(parent, []);
    byParent.get(parent)!.push(el);
  }
  for (const [, tokens] of byParent) {
    for (let i = 0; i < tokens.length; i++) {
      const a = tokens[i];
      const aId = a.dataset.attentionId;
      const aIsKw = a.classList.contains("atk--kw");
      if (!aId) continue;
      for (let j = i + 1; j <= Math.min(i + SEQ_WINDOW, tokens.length - 1); j++) {
        const b = tokens[j];
        const bId = b.dataset.attentionId;
        const bIsKw = b.classList.contains("atk--kw");
        if (!bId) continue;
        // Only add edges that involve at least one keyword to avoid double-counting
        // pure seq↔seq (already handled by inferSequentialEdges).
        if (aIsKw || bIsKw) out.push([aId, bId]);
      }
    }
  }
  return out;
}

let ctx: Ctx | null = null;

function disposeCtx() {
  if (!ctx) return;
  if (ctx.ro) ctx.ro.disconnect();
  ctx.edgesLayer.innerHTML = "";
  ctx = null;
}

function edgeKey(a: string, b: string): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

function curvePath(a: Center, b: Center): string {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const dist = Math.hypot(dx, dy) || 1;
  const offset = Math.min(140, dist * 0.18);
  const midX = (a.x + b.x) / 2;
  const midY = (a.y + b.y) / 2;
  // Perpendicular offset — gives long lines an elegant bow
  const perpX = (-dy / dist) * offset;
  const perpY = (dx / dist) * offset;
  return `M ${a.x.toFixed(1)} ${a.y.toFixed(1)} Q ${(midX + perpX).toFixed(1)} ${(midY + perpY).toFixed(1)} ${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
}

function measureAll() {
  if (!ctx) return;
  const hostRect = ctx.host.getBoundingClientRect();
  const width = ctx.host.scrollWidth || hostRect.width;
  const height = ctx.host.scrollHeight || hostRect.height;
  ctx.canvas.setAttribute("viewBox", `0 0 ${width} ${height}`);
  ctx.canvas.setAttribute("width", String(width));
  ctx.canvas.setAttribute("height", String(height));

  const fresh = new WeakMap<HTMLElement, Center>();
  for (const [, els] of ctx.nodes) {
    for (const el of els) {
      const r = el.getBoundingClientRect();
      fresh.set(el, {
        x: r.left - hostRect.left + r.width / 2,
        y: r.top - hostRect.top + r.height / 2,
      });
    }
  }
  ctx.centers = fresh;
}

function nearestInstance(source: HTMLElement, candidates: HTMLElement[]): HTMLElement | null {
  if (!ctx || candidates.length === 0) return null;
  const sCenter = ctx.centers.get(source);
  if (!sCenter) return null;
  let best: HTMLElement | null = null;
  let bestDist = Infinity;
  for (const c of candidates) {
    const cc = ctx.centers.get(c);
    if (!cc) continue;
    const d = Math.hypot(sCenter.x - cc.x, sCenter.y - cc.y);
    if (d < bestDist) {
      bestDist = d;
      best = c;
    }
  }
  return best;
}

function clearAll() {
  if (!ctx) return;
  ctx.currentHover = null;
  for (const [, els] of ctx.nodes) {
    for (const el of els) {
      el.classList.remove("is-active", "is-related");
    }
  }
  for (const p of ctx.paths.values()) {
    p.classList.remove("is-on");
  }
  document.dispatchEvent(new CustomEvent("attention:idle"));
}

function activate(el: HTMLElement) {
  if (!ctx) return;
  const id = el.dataset.attentionId;
  if (!id) return;

  clearAll();
  ctx.currentHover = el;

  // Highlight all instances of the hovered id
  const sameId = ctx.nodes.get(id) ?? [];
  for (const e of sameId) e.classList.add("is-active");

  // Light up each neighbor (nearest instance) + draw curve
  const sourceCenter = ctx.centers.get(el);
  if (!sourceCenter) return;

  const neighbors = ctx.adjacency[id] ?? [];
  for (const nid of neighbors) {
    const instances = ctx.nodes.get(nid) ?? [];
    if (instances.length === 0) continue;

    for (const inst of instances) inst.classList.add("is-related");

    const nearest = nearestInstance(el, instances);
    if (!nearest) continue;
    const nc = ctx.centers.get(nearest);
    if (!nc) continue;

    const path = ctx.paths.get(edgeKey(id, nid));
    if (!path) continue;
    path.setAttribute("d", curvePath(sourceCenter, nc));
    path.classList.add("is-on");
  }

  document.dispatchEvent(new CustomEvent("attention:active", { detail: { id } }));
}

function attachListeners() {
  if (!ctx) return;
  for (const [, els] of ctx.nodes) {
    for (const el of els) {
      if (el.dataset.attentionBound) continue;
      el.dataset.attentionBound = "1";
      el.addEventListener("pointerenter", () => activate(el));
      el.addEventListener("pointerleave", clearAll);
      el.addEventListener("focus", () => activate(el));
      el.addEventListener("blur", clearAll);
      // Hint to assistive tech that this is interactive
      if (!el.hasAttribute("tabindex") && el.tagName !== "BUTTON" && el.tagName !== "A") {
        el.setAttribute("tabindex", "0");
      }
    }
  }
}

function setup() {
  disposeCtx();

  const host = document.querySelector<HTMLElement>("[data-attention-host]");
  const canvas = document.querySelector<SVGSVGElement>("[data-attention-canvas]");
  const edgesLayer = canvas?.querySelector<SVGGElement>("[data-attention-edges]");
  if (!host || !canvas || !edgesLayer) return;

  const elements = Array.from(host.querySelectorAll<HTMLElement>("[data-attention-id]"));
  if (!elements.length) return;

  const nodes = new Map<string, HTMLElement[]>();
  for (const el of elements) {
    const id = el.dataset.attentionId;
    if (!id) continue;
    if (!nodes.has(id)) nodes.set(id, []);
    nodes.get(id)!.push(el);
  }

  const curated = buildAdjacency();
  const paths = new Map<string, SVGPathElement>();

  // 1. Curated semantic edges — thicker stroke (default .attention-edge)
  for (const [a, b] of attentionEdges) {
    if (!nodes.has(a) || !nodes.has(b)) continue;
    const key = edgeKey(a, b);
    if (paths.has(key)) continue;
    const path = document.createElementNS(SVG_NS, "path");
    path.setAttribute("class", "attention-edge");
    edgesLayer.appendChild(path);
    paths.set(key, path);
  }

  // 2. Sequential edges from same-paragraph tokens (window N=2)
  const seqEdges = inferSequentialEdges(host);
  const kwSeqEdges = inferKeywordSeqEdges(host);
  const allSeqEdges = [...seqEdges, ...kwSeqEdges];

  for (const [a, b] of allSeqEdges) {
    if (!nodes.has(a) || !nodes.has(b)) continue;
    const key = edgeKey(a, b);
    if (paths.has(key)) continue; // already covered by curated
    const path = document.createElementNS(SVG_NS, "path");
    path.setAttribute("class", "attention-edge attention-edge--seq");
    edgesLayer.appendChild(path);
    paths.set(key, path);
  }

  // 3. Merge curated + sequential into a single adjacency map (deduped via Set)
  const adjacencySet: Record<string, Set<string>> = {};
  for (const [k, vs] of Object.entries(curated)) {
    adjacencySet[k] = new Set(vs);
  }
  for (const [a, b] of allSeqEdges) {
    (adjacencySet[a] ??= new Set()).add(b);
    (adjacencySet[b] ??= new Set()).add(a);
  }
  const adjacency: Record<string, string[]> = {};
  for (const [k, set] of Object.entries(adjacencySet)) {
    adjacency[k] = Array.from(set);
  }

  ctx = {
    host,
    canvas,
    edgesLayer,
    nodes,
    centers: new WeakMap(),
    paths,
    adjacency,
    currentHover: null,
    ro: null,
  };

  // Measure now, then again after fonts + reveals settle.
  requestAnimationFrame(() => {
    measureAll();
    setTimeout(measureAll, 1600);
  });

  if ("ResizeObserver" in window) {
    ctx.ro = new ResizeObserver(() => {
      measureAll();
      // Re-render any currently active edge with new geometry
      if (ctx?.currentHover) activate(ctx.currentHover);
    });
    ctx.ro.observe(host);
  }

  window.addEventListener("resize", measureAll, { passive: true });

  attachListeners();
}

function init() {
  if (typeof window === "undefined") return;
  setup();
}

if (typeof window !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
  document.addEventListener("astro:page-load", init);
  document.addEventListener("astro:before-swap", () => {
    clearAll();
    disposeCtx();
  });
}
