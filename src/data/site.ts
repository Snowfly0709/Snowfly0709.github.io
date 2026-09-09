export const siteMeta = {
  name: "Zifeng Xiong",
  title: "Zifeng Xiong | AI Product Manager",
  description:
    "AI Product Associate at KeyReply, building LLM, RAG, and AI Agent workflows into reliable, secure-by-design systems.",
  email: "zif.xiong@gmail.com",
  defaultLang: "en"
} as const;

export const navItems = {
  en: [
    { label: "About", href: "/en/#about" },
    { label: "Blog", href: "/en/blog/" },
    { label: "Atelier", href: "/en/atelier/" },
    { label: "Contact", href: "/en/contact/" }
  ],
  zh: [
    { label: "关于", href: "/zh/#about" },
    { label: "博客", href: "/zh/blog/" },
    { label: "工坊", href: "/zh/atelier/" },
    { label: "联系", href: "/zh/contact/" }
  ]
} as const;

export const heroCopy = {
  en: {
    kicker: "AI PRODUCT MANAGER",
    headline: "I Build AI Products That Ship.",
    subline:
      "AI Product Associate at KeyReply. Turning LLM, RAG, and Agent capabilities into reliable, secure-by-design systems.",
    ctaPrimary: "Read Blog",
    ctaSecondary: "Contact"
  },
  zh: {
    kicker: "AI 产品经理",
    headline: "我把 AI 想法做成真正上线的产品。",
    subline:
      "KeyReply AI 产品助理。把 LLM、RAG 与 Agent 能力打造成可靠、安全、可落地的系统。",
    ctaPrimary: "查看博客",
    ctaSecondary: "联系我"
  }
} as const;

export const aboutSections = {
  en: {
    intro:
      "Master's student in Cybersecurity at NTU Singapore, working at the intersection of AI, security, and product design. I translate technical capabilities into practical, user-oriented solutions — LLM applications, RAG architectures, and backend systems that emphasize reliability, scalability, and data privacy in sensitive domains.",
    work: [
      {
        title: "AI Product Associate Intern",
        org: "KeyReply Pte. Ltd.",
        period: "04/2026 - Present",
        bullets: [
          "Partnered with the customer-success team and stakeholders to replace fragmented controls and a flat 1700+ voice catalog with a guided voice-and-character configuration workspace; translated needs into 50+ PRDs and interactive prototypes, aligned scope with design and engineering, and shipped 5 production pages.",
          "Led a cross-product UX redesign across 20+ pages, running 7 parallel AI agents alongside interactive prototypes to cut navigation friction and resolve 400+ UI inconsistencies and 10+ UX issues across information architecture, components, and outdated copy.",
          "Turned recurring support feedback on mispronounced local names into a measurable product initiative — a 349-entry benchmark and blind evaluation workflow, then productization of the pronunciation component — lifting usable accuracy from 78.0% to 93.8% across 321 unique terms (+15.8 pp).",
          "Worked directly with emergency-department staff and clinicians at a public hospital to translate bedside requirements and 6 deployment constraints into a 90-minute workshop, then prioritised and drove delivery of a 20-language, hands-free Translation Assistant with consent, recording, and access controls."
        ]
      },
      {
        title: "Researcher (Part-time)",
        org: "Xi'an Jiaotong University",
        period: "11/2024 - 06/2025",
        bullets: [
          "Built a RAG-based internal Q&A system over policy and process documents.",
          "KNN retrieval on long-document corpora; scenario-grounded evaluation reaching 96% Recall@N and 4.4/5 answer relevance."
        ]
      },
      {
        title: "Researcher (Part-time)",
        org: "Xi'an Jiaotong University · w/ ByteDance",
        period: "10/2023 - 01/2025",
        bullets: [
          "Multi-agent reinforcement learning (A2C-based) for large-scale microservice scheduling.",
          "Validated on real-world ByteDance and Alibaba traces; co-authored publication in Expert Systems with Applications."
        ]
      },
      {
        title: "Product Manager Intern",
        org: "Chengdu Hwadee IT Co., Ltd",
        period: "11/2023 - 02/2024",
        bullets: [
          "Led a 6-member cross-functional team to design and deliver a 6–7 page inventory product through to final acceptance, owning requirements, prioritisation, development coordination, testing, and delivery.",
          "Designed the core inventory workflows — inbound, outbound, inventory query, stock alerts, reconciliation, and discrepancy handling — and shipped 4 frontend, backend, and AI features, including Qwen-powered daily reports surfacing stock movements, low-inventory risks, and stale inventory."
        ]
      }
    ],
    projects: [
      {
        name: "SayExact · Voice Pipeline Accuracy Adapter",
        period: "08/2026 - Present",
        detail:
          "An accuracy adapter for voice pipelines, grown out of an earlier production project. Prioritised fields by error rate × business impact to isolate the highest-value use case, redesigned the capture flow, and validated it through user testing — lifting ASR accuracy past 85%. Taken from concept to internal pilot as a LiveKit Agents adapter with 336 automated tests; an upstream limitation found along the way was fixed and contributed back to the 14K-star repository."
      },
      {
        name: "MindGap · Claude Code Plugin",
        period: "05/2026",
        detail:
          "A Claude Code plugin that measures where each turn's wall time actually goes — Claude wait, automated tools, or user-gated tools. Zero-dependency Node.js hooks log every UserPromptSubmit / PreToolUse / PostToolUse / Stop to JSONL; a paired skill aggregates per-turn timings on demand. Published to the Claude Code marketplace under MIT."
      },
      {
        name: "AI Data Visualization Workflow Tool",
        period: "01/2026",
        detail:
          "End-to-end LLM workflow that unifies parsing, cleaning, analysis, and visualization across heterogeneous data (PDF / Excel / CSV). Compresses multi-hour analyst work to ~10 minutes; deployed as a Lark bot for zero-setup access. Built with Coze."
      }
    ],
    education: [
      {
        school: "Nanyang Technological University",
        degree: "M.Sc. in Cyber Security · GPA 4.63/5.0",
        period: "08/2025 - 12/2026",
        location: "Singapore"
      },
      {
        school: "Xi'an Jiaotong University",
        degree: "B.Eng. in Software Engineering · IELTS 7.5",
        period: "09/2021 - 07/2025",
        location: "Xi'an, China"
      }
    ],
    publications: [
      "Ma, N., Tang, A., Xiong, Z., & Jiang, F. (2025). A deep multi-agent reinforcement learning approach for the micro-service migration problem with affinity in the cloud. Expert Systems with Applications, 273, 126856."
    ]
  },
  zh: {
    intro:
      "南洋理工大学网络安全硕士在读，专注于 AI、安全与产品设计的交叉领域。我擅长把技术能力转化为可落地的用户解决方案 —— 涵盖 LLM 应用、RAG 架构与后端系统，强调在敏感领域中的可靠性、可扩展性与数据隐私。",
    work: [
      {
        title: "AI 产品助理（实习）",
        org: "KeyReply Pte. Ltd.",
        period: "2026.04 - 至今",
        bullets: [
          "与客户成功团队及各方干系人合作，把分散的控制项与 1700+ 条扁平语音清单重构为引导式的音色与角色配置工作台；将需求转化为 50+ 份 PRD 与交互原型，与设计、研发对齐范围，交付 5 个生产页面。",
          "主导跨产品的 UX 改版，覆盖 20+ 个页面，以 7 个并行 AI Agent 配合交互原型降低导航摩擦，解决 400+ 处 UI 不一致与 10+ 项 UX 问题，涉及信息架构、组件与过时文案。",
          "把客服侧反复出现的本地地名读音问题转化为可度量的产品课题：建立 349 条基准集与盲评流程，推动发音组件产品化，在 321 个独立词条上把可用准确率从 78.0% 提升至 93.8%（+15.8 pp）。",
          "与某公立医院急诊科的一线人员及临床医生直接合作，把床旁需求与 6 项部署约束浓缩为 90 分钟工作坊，并推动交付支持 20 种语言、免手操作的翻译助手，内置知情同意、录音与访问控制。"
        ]
      },
      {
        title: "研究员（兼职）",
        org: "西安交通大学",
        period: "2024.11 - 2025.06",
        bullets: [
          "搭建面向内部员工的 RAG 智能问答系统，覆盖政策与流程文档。",
          "在长文档语料上设计 KNN 检索方案，构建场景化评估框架，达到 96% Recall@N 与 4.4/5 答案相关度。"
        ]
      },
      {
        title: "研究员（兼职）",
        org: "西安交通大学 · 与字节跳动合作",
        period: "2023.10 - 2025.01",
        bullets: [
          "围绕大规模微服务调度问题展开基于 A2C 的多智能体强化学习研究。",
          "在字节跳动与阿里巴巴真实数据集上验证有效性，合著论文已发表于 Expert Systems with Applications。"
        ]
      },
      {
        title: "产品经理（实习）",
        org: "成都华栈信息技术有限公司",
        period: "2023.11 - 2024.02",
        bullets: [
          "带领 6 人跨职能团队设计并交付 6–7 个页面的库存管理产品，直至最终验收，负责需求梳理、优先级排序、研发协调、测试与交付。",
          "设计入库、出库、库存查询、缺货预警、对账与异常处理等核心库存流程，并交付 4 项前后端与 AI 功能，其中包括由 Qwen 驱动的每日报表，自动呈现库存变动、低库存风险与呆滞库存。"
        ]
      }
    ],
    projects: [
      {
        name: "SayExact · 语音链路准确率适配器",
        period: "2026.08 - 至今",
        detail:
          "面向语音链路的准确率适配器，脱胎于此前的生产项目。以「错误率 × 业务影响」对字段排序，锁定价值最高的场景，重新设计采集流程并通过用户测试验证，将 ASR 准确率提升至 85% 以上。从概念推进到内部试点，交付带 336 个自动化测试的 LiveKit Agents 适配器；过程中发现的上游缺陷已修复并回馈给该 14K star 的开源仓库。"
      },
      {
        name: "MindGap · Claude Code 插件",
        period: "2026.05",
        detail:
          "一个 Claude Code 插件，把每个 turn 的等待时长拆成三段：模型思考、自动化工具、需用户响应的工具。零依赖 Node.js 钩子将 UserPromptSubmit / PreToolUse / PostToolUse / Stop 四类事件落到 JSONL，配套的 skill 按需聚合并展示每个 turn 的发呆分布。已以 MIT 协议发布到 Claude Code 插件市场。"
      },
      {
        name: "AI 数据可视化工作流工具",
        period: "2026.01",
        detail:
          "端到端的 LLM 工作流，统一处理 PDF / Excel / CSV 等异构数据的解析、清洗、分析与可视化；将原本数小时的分析压缩至 ~10 分钟，以飞书机器人形态部署，零配置即用。基于 Coze 搭建。"
      }
    ],
    education: [
      {
        school: "南洋理工大学",
        degree: "网络安全硕士 · GPA 4.63/5.0",
        period: "2025.08 - 2026.12",
        location: "新加坡"
      },
      {
        school: "西安交通大学",
        degree: "软件工程学士 · 雅思 7.5",
        period: "2021.09 - 2025.07",
        location: "中国西安"
      }
    ],
    publications: [
      "Ma, N., Tang, A., Xiong, Z., & Jiang, F. (2025). A deep multi-agent reinforcement learning approach for the micro-service migration problem with affinity in the cloud. Expert Systems with Applications, 273, 126856."
    ]
  }
} as const;

export const skills = [
  "Product Management",
  "LLM",
  "RAG",
  "AI Agent",
  "Prompt Engineering",
  "Workflow Design",
  "Reinforcement Learning",
  "Coze",
  "FastGPT",
  "Cybersecurity",
  "Python",
  "TypeScript",
  "Java",
  "Spring Boot",
  "SQL",
  "PostgreSQL",
  "MongoDB",
  "Jira",
  "Figma",
  "Lark"
] as const;

export const contactLinks = [
  { label: "LinkedIn", href: "https://www.linkedin.com/in/zifeng-xiong/" },
  { label: "GitHub", href: "https://github.com/Snowfly0709" },
  { label: "CSDN", href: "https://blog.csdn.net/weixin_46876169?type=blog" },
  { label: "Email", href: "mailto:zif.xiong@gmail.com" }
] as const;
