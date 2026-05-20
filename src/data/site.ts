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
        title: "AI Product Associate",
        org: "KeyReply",
        period: "04/2026 - Present",
        detail: ""
      },
      {
        title: "Researcher (Part-time)",
        org: "Xi'an Jiaotong University",
        period: "11/2024 - 06/2025",
        detail:
          "Built a RAG-based internal Q&A system over policy and process documents. KNN retrieval on long-document corpora; scenario-grounded evaluation reaching 96% Recall@N and 4.4/5 answer relevance."
      },
      {
        title: "Researcher (Part-time)",
        org: "Xi'an Jiaotong University · w/ ByteDance",
        period: "10/2023 - 01/2025",
        detail:
          "Multi-agent reinforcement learning (A2C-based) for large-scale microservice scheduling. Validated on real-world ByteDance and Alibaba traces; co-authored publication in Expert Systems with Applications."
      },
      {
        title: "Project Manager Intern",
        org: "Chengdu Hwadee IT Co., Ltd",
        period: "11/2023 - 01/2024",
        detail:
          "Coordinated full-stack delivery (SpringBoot + Vue) for an e-commerce product management system. Defined milestones via Lark; authored 20+ project documents."
      }
    ],
    projects: [
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
        degree: "M.Sc. in Cyber Security",
        period: "08/2025 - 12/2026",
        location: "Singapore"
      },
      {
        school: "Xi'an Jiaotong University",
        degree: "B.Eng. in Software Engineering",
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
        title: "AI 产品助理",
        org: "KeyReply",
        period: "2026.04 - 至今",
        detail: ""
      },
      {
        title: "研究员（兼职）",
        org: "西安交通大学",
        period: "2024.11 - 2025.06",
        detail:
          "搭建面向内部员工的 RAG 智能问答系统，覆盖政策与流程文档；在长文档语料上设计 KNN 检索方案，构建场景化评估框架，达到 96% Recall@N 与 4.4/5 答案相关度。"
      },
      {
        title: "研究员（兼职）",
        org: "西安交通大学 · 与字节跳动合作",
        period: "2023.10 - 2025.01",
        detail:
          "围绕大规模微服务调度问题展开基于 A2C 的多智能体强化学习研究，在字节跳动与阿里巴巴真实数据集上验证有效性，合著论文已发表于 Expert Systems with Applications。"
      },
      {
        title: "项目经理实习生",
        org: "成都华栈信息技术有限公司",
        period: "2023.11 - 2024.01",
        detail:
          "协调电商产品管理系统的全栈交付（SpringBoot + Vue），通过飞书定义与跟踪里程碑，撰写 20+ 项目文档。"
      }
    ],
    projects: [
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
        degree: "网络安全硕士",
        period: "2025.08 - 2026.12",
        location: "新加坡"
      },
      {
        school: "西安交通大学",
        degree: "软件工程学士",
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
  "Coze",
  "FastGPT",
  "Cybersecurity",
  "TypeScript",
  "Java",
  "Spring Boot",
  "PostgreSQL",
  "MongoDB"
] as const;

export const contactLinks = [
  { label: "LinkedIn", href: "https://www.linkedin.com/in/zifeng-xiong/" },
  { label: "GitHub", href: "https://github.com/Snowfly0709" },
  { label: "CSDN", href: "https://blog.csdn.net/weixin_46876169?type=blog" },
  { label: "Email", href: "mailto:zif.xiong@gmail.com" }
] as const;
