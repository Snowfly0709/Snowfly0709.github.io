// Page-wide Attention Graph
// Every hoverable word/phrase on the introduction page is a node.
// On hover, all instances of the node + all neighbors light up + curves drawn.

export type NodeGroup = "skill" | "work" | "edu" | "project" | "keyword";

export interface AttentionNode {
  id: string;
  labelEn: string;
  labelZh: string;
  /** Optional extra surface forms (case-sensitive). Used by markupKeywords. */
  aliases?: string[];
  group: NodeGroup;
}

export const attentionNodes: AttentionNode[] = [
  // ----- Skills (13) -----
  { id: "product-management", labelEn: "Product Management", labelZh: "产品管理", group: "skill" },
  { id: "llm", labelEn: "LLM", labelZh: "LLM", group: "skill" },
  { id: "rag", labelEn: "RAG", labelZh: "RAG", group: "skill" },
  { id: "ai-agent", labelEn: "AI Agent", labelZh: "AI Agent", group: "skill" },
  { id: "prompt-engineering", labelEn: "Prompt Engineering", labelZh: "Prompt 工程", group: "skill" },
  { id: "workflow-design", labelEn: "Workflow Design", labelZh: "工作流设计", group: "skill", aliases: ["LLM workflow", "LLM 工作流"] },
  { id: "coze-fastgpt", labelEn: "Coze · FastGPT", labelZh: "Coze · FastGPT", group: "skill", aliases: ["Coze", "FastGPT"] },
  { id: "cybersecurity", labelEn: "Cybersecurity", labelZh: "网络安全", group: "skill", aliases: ["Cyber Security", "data privacy", "数据隐私"] },
  { id: "typescript", labelEn: "TypeScript", labelZh: "TypeScript", group: "skill" },
  { id: "java", labelEn: "Java", labelZh: "Java", group: "skill" },
  { id: "spring-boot", labelEn: "Spring Boot", labelZh: "Spring Boot", group: "skill", aliases: ["SpringBoot"] },
  { id: "postgresql", labelEn: "PostgreSQL", labelZh: "PostgreSQL", group: "skill" },
  { id: "mongodb", labelEn: "MongoDB", labelZh: "MongoDB", group: "skill" },

  // ----- Work (4) -----
  { id: "work-keyreply", labelEn: "AI Product Associate", labelZh: "AI 产品助理", group: "work" },
  { id: "work-xjtu-rag", labelEn: "Researcher (Part-time) · XJTU", labelZh: "研究员（兼职） · 西交", group: "work" },
  { id: "work-xjtu-bd", labelEn: "Researcher (Part-time) · ByteDance", labelZh: "研究员（兼职） · 字节", group: "work" },
  { id: "work-pmi", labelEn: "Project Manager Intern", labelZh: "项目经理实习生", group: "work" },

  // ----- Education (2) -----
  { id: "edu-ntu", labelEn: "Nanyang Technological University", labelZh: "南洋理工大学", group: "edu", aliases: ["NTU"] },
  { id: "edu-xjtu", labelEn: "Xi'an Jiaotong University", labelZh: "西安交通大学", group: "edu", aliases: ["XJTU"] },

  // ----- Project (1) -----
  { id: "proj-dataviz", labelEn: "AI Data Visualization Workflow Tool", labelZh: "AI 数据可视化工作流工具", group: "project" },

  // ----- Inline keywords (from body text) -----
  { id: "kw-bytedance", labelEn: "ByteDance", labelZh: "字节跳动", group: "keyword", aliases: ["字节"] },
  { id: "kw-alibaba", labelEn: "Alibaba", labelZh: "阿里巴巴", group: "keyword" },
  { id: "kw-knn", labelEn: "KNN", labelZh: "KNN", group: "keyword" },
  { id: "kw-a2c", labelEn: "A2C", labelZh: "A2C", group: "keyword" },
  { id: "kw-lark", labelEn: "Lark", labelZh: "飞书", group: "keyword" },
  { id: "kw-vue", labelEn: "Vue", labelZh: "Vue", group: "keyword" },
  { id: "kw-multiagent-rl", labelEn: "Multi-agent reinforcement learning", labelZh: "多智能体强化学习", group: "keyword", aliases: ["multi-agent RL", "Multi-agent", "multi-agent"] },
  { id: "kw-esa", labelEn: "Expert Systems with Applications", labelZh: "Expert Systems with Applications", group: "keyword" },
];

/** Undirected edges. Each edge listed once; runtime expands to symmetric adjacency. */
export const attentionEdges: ReadonlyArray<readonly [string, string]> = [
  // ----- skill ↔ skill (existing relations) -----
  ["product-management", "llm"],
  ["product-management", "workflow-design"],
  ["llm", "rag"],
  ["llm", "ai-agent"],
  ["llm", "prompt-engineering"],
  ["llm", "coze-fastgpt"],
  ["rag", "ai-agent"],
  ["rag", "cybersecurity"],
  ["ai-agent", "workflow-design"],
  ["prompt-engineering", "workflow-design"],
  ["workflow-design", "coze-fastgpt"],
  ["typescript", "java"],
  ["java", "spring-boot"],
  ["spring-boot", "postgresql"],
  ["spring-boot", "mongodb"],
  ["postgresql", "mongodb"],

  // ----- work ↔ skill -----
  ["work-keyreply", "llm"],
  ["work-keyreply", "rag"],
  ["work-keyreply", "ai-agent"],
  ["work-keyreply", "product-management"],
  ["work-xjtu-rag", "rag"],
  ["work-xjtu-rag", "kw-knn"],
  ["work-xjtu-bd", "kw-a2c"],
  ["work-xjtu-bd", "kw-bytedance"],
  ["work-xjtu-bd", "kw-alibaba"],
  ["work-xjtu-bd", "kw-multiagent-rl"],
  ["work-xjtu-bd", "kw-esa"],
  ["work-pmi", "product-management"],
  ["work-pmi", "spring-boot"],
  ["work-pmi", "kw-vue"],
  ["work-pmi", "kw-lark"],

  // ----- edu ↔ skill / work -----
  ["edu-ntu", "cybersecurity"],
  ["edu-xjtu", "work-xjtu-rag"],
  ["edu-xjtu", "work-xjtu-bd"],

  // ----- project ↔ skill / keyword -----
  ["proj-dataviz", "llm"],
  ["proj-dataviz", "workflow-design"],
  ["proj-dataviz", "coze-fastgpt"],
  ["proj-dataviz", "kw-lark"],

  // ----- keyword ↔ skill -----
  ["kw-knn", "rag"],
];

/** Build a symmetric adjacency map for runtime lookup. */
export function buildAdjacency(): Record<string, string[]> {
  const adj: Record<string, Set<string>> = {};
  for (const [a, b] of attentionEdges) {
    (adj[a] ??= new Set()).add(b);
    (adj[b] ??= new Set()).add(a);
  }
  const out: Record<string, string[]> = {};
  for (const [k, v] of Object.entries(adj)) {
    out[k] = Array.from(v);
  }
  return out;
}

/** Quick lookup: node id → node. */
export function nodeById(): Record<string, AttentionNode> {
  const out: Record<string, AttentionNode> = {};
  for (const n of attentionNodes) out[n.id] = n;
  return out;
}
