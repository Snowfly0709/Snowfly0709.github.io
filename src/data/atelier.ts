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
    slug: "voice-audition",
    title: { en: "Voice Audition", zh: "声音甄选室" },
    description: {
      en: "A guided listening deck for picking the voice of an AI voicebot. Step through paired and ranked samples in a spectral, latent-space room — each one blooms a live waveform painted by frequency — and tell me which timbres sound most natural, approachable, and genuinely Singaporean.",
      zh: "为一个 AI 语音助手挑选声音的引导式试听台。在一间频谱化的「潜空间」里逐张翻看配对与排序的样本——每段声音都会绽放一道按频率上色的实时波形——告诉我哪种音色听起来最自然、最亲切、最像真正的新加坡人。"
    },
    date: "2026-06-09",
    tags: ["web-audio", "voice", "research"]
  },
  {
    slug: "yongguang-hospital",
    title: { en: "Yongguang Asylum", zh: "永光精神病院" },
    description: {
      en: "A browser-native ARG. Comb through emails, fake wikis, weibo threads, tabloid archives, and first-person scenes to unravel a 1996 cold case in the fictional city of Aihu.",
      zh: "浏览器原生的 ARG 解谜。在博客后台、仿百科、仿微博、地方报刊存档与第一人称场景之间穿梭，追查 1996 年艾湖市的一桩悬案。"
    },
    date: "2026-05-29",
    tags: ["game", "vue", "arg"]
  },
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
