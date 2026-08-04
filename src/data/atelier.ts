export type RegisterId = "tools" | "creative" | "research" | "misc";

export interface Register {
  id: RegisterId;
  labelEn: string;
  labelZh: string;
  order: number;
}

/**
 * The Plate Wall hangs pieces in "registers" by intent. Order is the hang order
 * on the wall. `misc` is a type-safe fallback that only renders if populated.
 */
export const registers: readonly Register[] = [
  { id: "tools", labelEn: "Tools", labelZh: "工具", order: 1 },
  { id: "creative", labelEn: "Imaginings", labelZh: "创想", order: 2 },
  { id: "research", labelEn: "Research", labelZh: "研究", order: 3 },
  { id: "misc", labelEn: "Sundry", labelZh: "其它", order: 99 }
];

export interface AtelierItem {
  slug: string;
  title: { en: string; zh: string };
  description: { en: string; zh: string };
  /** Short one-line caption shown on the plate (long `description` stays for search + detail). */
  tagline?: { en: string; zh: string };
  date: string;
  tags: readonly string[];
  /** Which register the plate hangs in. */
  category: RegisterId;
  /** Poster image; when absent, a letterpress proof-sheet placeholder renders. */
  poster?: { src: string; alt: { en: string; zh: string } };
  /** Plate frame aspect. `large` plates render wide regardless. Defaults to portrait. */
  aspect?: "portrait" | "landscape";
  status?: "live" | "sandbox";
  /** Flagship plate hangs larger within its register (salon hang). */
  scale?: "large" | "regular";
  /** Optional tint for the proof-sheet ground; defaults to cinnabar. */
  posterTint?: string;
}

/**
 * Each item maps to a folder at `public/atelier/<slug>/` that contains an
 * `index.html`. The card on /atelier/ links to `/atelier/<slug>/` in a new tab.
 * Plate numbers are derived at build time (oldest = 01) — do not store them here.
 *
 * To add a poster later: drop the image at `public/atelier/<slug>/poster.*` and set
 *   poster: { src: "/atelier/<slug>/poster.webp", alt: { en: "...", zh: "..." } }
 * Until then, the proof-sheet placeholder renders with zero layout change.
 */
export const atelierItems: readonly AtelierItem[] = [
  {
    slug: "next-bus",
    title: { en: "Next Bus", zh: "下一班巴士" },
    tagline: {
      en: "Live LED arrivals for any Singapore bus stop.",
      zh: "任意新加坡巴士站的实时到站点阵屏。"
    },
    description: {
      en: "A live LED departure board for any Singapore bus stop. Search by code or name (fuzzy — \"block\" finds \"Blk\"), pick a stop off the night map, or one-tap locate to the stop nearest you — amber dot-matrix arrivals refreshed every 20 seconds from LTA DataMall.",
      zh: "一块可查询全岛任意巴士站的 LED 实时到站屏。按代码或站名模糊搜索（打 block 也能搜到 Blk）、在夜色地图上点选站点，或一键定位到离你最近的站——琥珀色点阵班次每 20 秒从 LTA DataMall 刷新一次。"
    },
    date: "2026-06-10",
    tags: ["live-data", "transit", "led"],
    category: "tools",
    status: "live",
    scale: "large",
    poster: {
      src: "/atelier/next-bus/poster.webp",
      alt: {
        en: "Pointillist night painting of a covered bus stop, its arrival board glowing amber, a double-deck bus on a wet street.",
        zh: "点彩派夜景：有顶巴士候车亭，到站屏泛着琥珀微光，雨后街道上一辆双层巴士。"
      }
    }
  },
  {
    slug: "yongguang-hospital",
    title: { en: "Yongguang Asylum", zh: "永光精神病院" },
    tagline: {
      en: "A browser ARG unravelling a 1996 cold case.",
      zh: "在浏览器里追查 1996 年悬案的 ARG 解谜。"
    },
    description: {
      en: "A browser-native ARG. Comb through emails, fake wikis, weibo threads, tabloid archives, and first-person scenes to unravel a 1996 cold case in the fictional city of Aihu.",
      zh: "浏览器原生的 ARG 解谜。在博客后台、仿百科、仿微博、地方报刊存档与第一人称场景之间穿梭，追查 1996 年艾湖市的一桩悬案。"
    },
    date: "2026-05-29",
    tags: ["game", "vue", "arg"],
    category: "creative",
    status: "sandbox",
    poster: {
      src: "/atelier/yongguang-hospital/poster.webp",
      alt: {
        en: "Brutalist concrete monolith of an abandoned asylum under a dead sky, one barred ground-floor window glowing red.",
        zh: "粗野主义混凝土巨块——死寂天空下的废弃医院，底层一扇铁窗透出红光。"
      }
    }
  },
  {
    slug: "solar-system",
    title: { en: "ASCII Orrery", zh: "字符太阳系" },
    tagline: {
      en: "An explorable dot-matrix solar system you can regenerate.",
      zh: "可探索、可重生成的字符点阵太阳系。"
    },
    description: {
      en: "A dot-matrix solar system you can explore — click a planet to zoom in, or generate a new stellar system with red giants, neutron stars, and black holes.",
      zh: "可探索的字符点阵太阳系。点击行星放大细看，或生成一个全新的恒星系——含红巨星、中子星与黑洞。"
    },
    date: "2026-05-20",
    tags: ["canvas", "ascii", "generative"],
    category: "creative",
    status: "sandbox",
    poster: {
      src: "/atelier/solar-system/poster.webp",
      alt: {
        en: "Deconstructivist cosmos of fractured character-grids warping around a black hole with a red accretion rim.",
        zh: "解构主义宇宙：碎裂的字符网格在带红色吸积环的黑洞周围扭曲。"
      }
    }
  },
  {
    slug: "hypothesis-engine",
    title: { en: "Hypothesis Engine", zh: "假设引擎" },
    tagline: {
      en: "An LLM-agent society that honestly kills its own hypotheses.",
      zh: "一个会诚实证否自己假设的智能体社会。"
    },
    description: {
      en: "An adversarially-gated society of LLM agents for Singapore population-health research: a generative researcher proposes and runs pre-registered in-silico studies, an independent auditor panel votes at every gate, and a human coordinator reproduces the integrity proofs — so the engine returns honest nulls and rolls back broken designs instead of manufacturing findings. It feeds real pilots, not claims.",
      zh: "面向新加坡人口健康研究的对抗式门控智能体社会：生成式研究者提出并运行预注册的硅内研究，独立审计小组在每道门投票，人类协调者复现完整性证明——因而引擎会给出诚实的零结果、对不成立的设计回退，而非制造发现。产出用于真实试点，而非论断。"
    },
    date: "2026-08-04",
    tags: ["llm-agents", "research", "in-silico"],
    category: "research",
    status: "sandbox",
    scale: "large"
  }
];
