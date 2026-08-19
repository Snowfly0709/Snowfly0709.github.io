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
        detail:
          "Shipped an LLM-as-a-judge evaluation pipeline (TTS synthesis → blind multi-model transcription → 3-vote majority) that lifted a voice agent's local place-name pronunciation accuracy from 78% to 93.8% across a 349-entry dictionary, packaged as a reusable backend component with edit-safe bulk correction. Drove 0→1 feasibility and architecture for an LLM-tool capability letting voice agents traverse phone menus (DTMF/IVR navigation), hardened by an 8-agent adversarial code review that caught 4 production-blocking defects. Delivered client- and event-facing products end to end: a PII-hardened QR lead-capture web app for a live product event, a single-file visual mockup for a partner client demo on deadline, and requirement-to-voice-stack mapping for a competitive government AI tender. Authored ~50 product specs, feasibility studies, and PRDs on a production voice AI platform, turning ambiguity into documented, decision-ready scope."
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
        title: "Product Manager Intern",
        org: "Chengdu Hwadee IT Co., Ltd",
        period: "11/2023 - 02/2024",
        detail:
          "Led a 6-person cross-functional team to design and deliver a warehouse inventory management prototype through to enterprise-mentor acceptance, owning requirements, prioritisation, task allocation, and testing. Standardised inbound, outbound, inventory-query, stock-alert, reconciliation, and discrepancy-handling workflows, and personally implemented 4 core frontend, backend, and AI features — authentication, role-based access control, workflow configuration, and LLM-powered daily inventory reports."
      }
    ],
    projects: [
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
        title: "AI 产品助理（实习）",
        org: "KeyReply Pte. Ltd.",
        period: "2026.04 - 至今",
        detail:
          "交付 LLM-as-a-judge 评测流水线（TTS 合成 → 多模型盲评转写 → 三票多数裁定），把语音 Agent 在 349 条本地地名词典上的发音准确率从 78% 提升到 93.8%，并封装为具备安全批量纠正能力的可复用后端组件。主导「语音 Agent 穿越电话菜单（DTMF/IVR 导航）」能力的 0→1 可行性与架构设计，以 8 个 Agent 的对抗式代码评审提前捕获 4 个阻塞上线的缺陷。端到端交付面向客户与现场活动的产品：发布活动上线的 PII 加固二维码线索采集应用、为合作伙伴客户 Demo 按期交付的单文件可视化原型，以及为政府 AI 竞标项目完成的需求到语音技术栈映射。在生产级语音 AI 平台上撰写约 50 份产品方案、可行性研究与 PRD，持续把模糊需求转化为可决策的文档化范围。"
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
        title: "产品经理（实习）",
        org: "成都华栈信息技术有限公司",
        period: "2023.11 - 2024.02",
        detail:
          "带领 6 人跨职能团队设计并交付仓储库存管理系统原型，直至通过企业导师验收，负责需求梳理、优先级排序、任务分配与测试。标准化入库、出库、库存查询、缺货预警、对账与异常处理等流程，并亲自实现认证、基于角色的权限控制、工作流配置与大模型驱动的每日库存报表共 4 项前后端与 AI 核心功能。"
      }
    ],
    projects: [
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
