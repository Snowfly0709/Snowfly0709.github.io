export interface AtelierItem {
  slug: string;
  title: { en: string; zh: string };
  description: { en: string; zh: string };
  date: string;
  tags: readonly string[];
}

/**
 * Each item maps to a folder at `public/atelier/<slug>/` that contains an
 * `index.html`. The card on /atelier/ links to `/atelier/<slug>/` in a new tab.
 *
 * Example:
 *   {
 *     slug: "particle-typography",
 *     title: { en: "Particle Typography", zh: "粒子字体" },
 *     description: {
 *       en: "Type that shatters into particles on hover.",
 *       zh: "鼠标悬停时碎裂成粒子的文字。"
 *     },
 *     date: "2026-05-15",
 *     tags: ["canvas", "typography"]
 *   }
 */
export const atelierItems: readonly AtelierItem[] = [
  {
    slug: "solar-system",
    title: { en: "ASCII Orrery", zh: "字符太阳系" },
    description: {
      en: "A dot-matrix solar system you can explore — click a planet to zoom in, or generate a new stellar system with red giants, neutron stars, and black holes.",
      zh: "可探索的字符点阵太阳系。点击行星放大细看，或生成一个全新的恒星系——含红巨星、中子星与黑洞。"
    },
    date: "2026-05-20",
    tags: ["canvas", "ascii", "generative"]
  }
];
