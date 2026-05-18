// Hero Token Stream — pre-recorded sequences + attention matrices
// attention[i][j] = how much token i attends to token j (0..1, symmetric-ish)

export interface HeroTokenSet {
  tokens: string[];
  attention: number[][];
  /** indices that should be rendered in accent color */
  highlight?: number[];
}

const en: HeroTokenSet = {
  tokens: ["I", "build", "AI", "products", "that", "ship", "."],
  highlight: [2, 5],
  attention: [
    // I    build AI    prod  that  ship  .
    [0.00, 0.55, 0.05, 0.18, 0.08, 0.40, 0.10], // I
    [0.55, 0.00, 0.15, 0.45, 0.10, 0.15, 0.05], // build
    [0.05, 0.20, 0.00, 0.70, 0.05, 0.18, 0.05], // AI
    [0.20, 0.45, 0.65, 0.00, 0.10, 0.20, 0.10], // products
    [0.05, 0.10, 0.05, 0.45, 0.00, 0.55, 0.05], // that
    [0.42, 0.15, 0.10, 0.35, 0.45, 0.00, 0.20], // ship
    [0.40, 0.08, 0.05, 0.20, 0.05, 0.35, 0.00], // .
  ],
};

const zh: HeroTokenSet = {
  tokens: ["我", "建造", "能", "落地", "的", "AI", "产品", "。"],
  highlight: [5, 6],
  attention: [
    // 我   建造  能    落地  的    AI    产品  。
    [0.00, 0.55, 0.10, 0.35, 0.05, 0.10, 0.30, 0.10], // 我
    [0.55, 0.00, 0.10, 0.40, 0.05, 0.20, 0.45, 0.08], // 建造
    [0.10, 0.10, 0.00, 0.65, 0.20, 0.05, 0.10, 0.05], // 能
    [0.30, 0.45, 0.60, 0.00, 0.30, 0.10, 0.45, 0.10], // 落地
    [0.05, 0.10, 0.20, 0.30, 0.00, 0.10, 0.55, 0.05], // 的
    [0.10, 0.15, 0.05, 0.10, 0.10, 0.00, 0.75, 0.10], // AI
    [0.30, 0.45, 0.10, 0.45, 0.55, 0.75, 0.00, 0.20], // 产品
    [0.35, 0.10, 0.05, 0.15, 0.05, 0.10, 0.30, 0.00], // 。
  ],
};

export const heroTokens: Record<"en" | "zh", HeroTokenSet> = { en, zh };
