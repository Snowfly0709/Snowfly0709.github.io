export interface SkillGroup {
  id: string;
  labelEn: string;
  labelZh: string;
  skills: string[];
}

export const skillGroups: SkillGroup[] = [
  {
    id: "core",
    labelEn: "CORE",
    labelZh: "核心",
    skills: [
      "Product Management",
      "LLM",
      "RAG",
      "AI Agent",
      "Prompt Engineering",
      "Workflow Design",
      "Reinforcement Learning",
      "Coze · FastGPT",
    ],
  },
  {
    id: "stack",
    labelEn: "STACK",
    labelZh: "技术栈",
    skills: [
      "Python",
      "TypeScript",
      "Java",
      "Spring Boot",
      "SQL",
      "PostgreSQL",
      "MongoDB",
    ],
  },
  {
    id: "tools",
    labelEn: "TOOLS",
    labelZh: "工具",
    skills: ["Jira", "Figma", "Lark"],
  },
  {
    id: "security",
    labelEn: "SECURITY",
    labelZh: "安全",
    skills: ["Cybersecurity"],
  },
];

export const skillRelations: ReadonlyArray<readonly [string, string]> = [
  ["Product Management", "LLM"],
  ["Product Management", "Workflow Design"],
  ["LLM", "RAG"],
  ["LLM", "AI Agent"],
  ["LLM", "Prompt Engineering"],
  ["RAG", "AI Agent"],
  ["RAG", "Cybersecurity"],
  ["AI Agent", "Workflow Design"],
  ["Prompt Engineering", "Workflow Design"],
  ["Workflow Design", "Coze · FastGPT"],
  ["LLM", "Reinforcement Learning"],
  ["Reinforcement Learning", "AI Agent"],
  ["Python", "LLM"],
  ["Python", "Reinforcement Learning"],
  ["TypeScript", "Java"],
  ["Java", "Spring Boot"],
  ["Spring Boot", "PostgreSQL"],
  ["Spring Boot", "MongoDB"],
  ["SQL", "PostgreSQL"],
  ["PostgreSQL", "MongoDB"],
  ["Jira", "Product Management"],
  ["Figma", "Product Management"],
  ["Lark", "Workflow Design"],
  ["Jira", "Figma"],
];

export interface FlatSkill {
  name: string;
  group: string;
  index: number;
}

export function flattenSkills(): FlatSkill[] {
  const out: FlatSkill[] = [];
  let i = 0;
  for (const g of skillGroups) {
    for (const s of g.skills) {
      i += 1;
      out.push({ name: s, group: g.id, index: i });
    }
  }
  return out;
}

export function buildAdjacency(): Record<string, string[]> {
  const adj: Record<string, string[]> = {};
  for (const [a, b] of skillRelations) {
    (adj[a] ??= []).push(b);
    (adj[b] ??= []).push(a);
  }
  return adj;
}
