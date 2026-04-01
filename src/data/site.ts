export const siteMeta = {
  name: "Zifeng Xiong",
  title: "Zifeng Xiong | AI Product Manager",
  description:
    "AI Product Manager focused on shipping LLM, RAG, and AI Agent workflows into production-ready products.",
  email: "zif.xiong@gmail.com",
  defaultLang: "en"
} as const;

export const navItems = {
  en: [
    { label: "About", href: "/en/#about" },
    { label: "Blog", href: "/en/blog/" },
    { label: "Contact", href: "/en/contact/" }
  ],
  zh: [
    { label: "关于", href: "/zh/#about" },
    { label: "博客", href: "/zh/blog/" },
    { label: "联系", href: "/zh/contact/" }
  ]
} as const;

export const heroCopy = {
  en: {
    kicker: "AI PRODUCT MANAGER",
    headline: "I Build AI Products That Ship.",
    subline:
      "Focused on turning LLM, RAG, and Agent workflows into production-ready systems. This site is my portfolio and working notebook for ideas, experiments, and execution.",
    ctaPrimary: "Read Blog",
    ctaSecondary: "Contact"
  },
  zh: {
    kicker: "AI 产品经理",
    headline: "我把 AI 想法做成真正上线的产品。",
    subline:
      "专注于将 LLM、RAG 与 Agent 工作流落地为可交付系统。这个网站既是我的作品集，也是我在工作中的技术复盘与思考博客。",
    ctaPrimary: "查看博客",
    ctaSecondary: "联系我"
  }
} as const;

export const aboutSections = {
  en: {
    intro:
      "M.Sc. candidate in Cyber Security at NTU (Singapore), previously B.Eng. in Software Engineering at Xi'an Jiaotong University. I work at the intersection of AI product strategy, engineering execution, and technical writing.",
    work: [
      {
        title: "AI Product Manager",
        org: "Current Focus",
        period: "2026 - Present",
        detail:
          "Designing and delivering AI products with RAG pipelines, workflow orchestration, and agent-driven automation."
      },
      {
        title: "Project Manager Intern",
        org: "Chengdu Hwadee Information Technology Co., LTD",
        period: "11/2023 - 01/2024",
        detail: "Delivered requirement coordination and technical planning for enterprise software projects."
      },
      {
        title: "Back-end Developer Intern",
        org: "Aspire Technology (Shenzhen) Co., LTD",
        period: "06/2023 - 09/2023",
        detail: "Built and maintained backend services for production systems."
      }
    ],
    projects: [
      {
        name: "Industry Dialogue System Based on LLM",
        period: "11/2024 - 06/2025",
        detail:
          "Research assistant work on domain dialogue capabilities and productizable AI interaction workflows."
      },
      {
        name: "Real-time Monitoring for Zhejiang Power Grid",
        period: "02/2025 - 06/2025",
        detail:
          "Collaborated on delivery strategy and engineering coordination for an enterprise monitoring platform."
      },
      {
        name: "Micro-Service Rescheduling in Cloud Computing",
        period: "10/2022 - 02/2025",
        detail: "Research and engineering exploration in collaboration with ByteDance."
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
      "我目前在南洋理工大学攻读网络安全硕士，曾就读于西安交通大学软件工程专业。我的工作重心在 AI 产品策略、工程落地与技术写作的交叉点。",
    work: [
      {
        title: "AI 产品经理",
        org: "当前工作重心",
        period: "2026 - 至今",
        detail: "围绕 RAG、工作流编排和 Agent 自动化设计并落地可交付 AI 产品。"
      },
      {
        title: "项目经理实习生",
        org: "成都华栈信息技术有限公司",
        period: "11/2023 - 01/2024",
        detail: "负责企业软件项目需求协同与技术规划。"
      },
      {
        title: "后端开发实习生",
        org: "亚信科技（深圳）有限公司",
        period: "06/2023 - 09/2023",
        detail: "参与生产环境后端服务开发与维护。"
      }
    ],
    projects: [
      {
        name: "基于 LLM 的行业对话系统",
        period: "11/2024 - 06/2025",
        detail: "参与行业对话能力研究与产品化 AI 交互流程设计。"
      },
      {
        name: "浙江电网实时监控系统",
        period: "02/2025 - 06/2025",
        detail: "参与企业级监控平台交付策略与工程协同。"
      },
      {
        name: "云计算中心微服务重调度",
        period: "10/2022 - 02/2025",
        detail: "与字节跳动合作开展研究与工程探索。"
      }
    ],
    education: [
      {
        school: "南洋理工大学",
        degree: "网络安全硕士",
        period: "08/2025 - 12/2026",
        location: "新加坡"
      },
      {
        school: "西安交通大学",
        degree: "软件工程学士",
        period: "09/2021 - 07/2025",
        location: "中国西安"
      }
    ],
    publications: [
      "Ma, N., Tang, A., Xiong, Z., & Jiang, F. (2025). A deep multi-agent reinforcement learning approach for the micro-service migration problem with affinity in the cloud. Expert Systems with Applications, 273, 126856."
    ]
  }
} as const;

export const skills = [
  "Coze",
  "FastGPT",
  "Workflow",
  "AI Agent",
  "Vue.js",
  "Spring Boot",
  "Lark",
  "Microservices",
  "RAG",
  "AI",
  "HTML",
  "Vibe Coding",
  "Java",
  "LLM",
  "Project Management",
  "Product Management",
  "MongoDB",
  "PostgreSQL"
] as const;

export const contactLinks = [
  { label: "LinkedIn", href: "https://www.linkedin.com/in/zifeng-xiong/" },
  { label: "GitHub", href: "https://github.com/Snowfly0709" },
  { label: "CSDN", href: "https://blog.csdn.net/weixin_46876169?type=blog" },
  { label: "Email", href: "mailto:zif.xiong@gmail.com" }
] as const;