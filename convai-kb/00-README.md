# ConvAI Knowledge Base — Zifeng Xiong / 知识库说明

This folder is the **knowledge base for the ElevenLabs Conversational AI widget** embedded
site-wide on snowfly09.com (agent `agent_3701ktk6j328fa1bvtkpyje8c96d`). Each file mirrors one
section of the site so the voice agent can answer questions about Zifeng grounded in facts.

本目录是嵌入在 snowfly09.com 全站的 ElevenLabs 语音挂件的**知识库**。每个文件对应站点的一个板块，
方便单独增改。内容均取自站点源码，不含编造信息。

> **Source of truth / 事实来源**: mirrors `src/data/site.ts`, `src/data/skills.ts`,
> `src/data/atelier.ts`, `src/content/blog/**`, and `src/components/Colophon.astro`,
> as of **2026-06-08**. When you change those files, update the matching doc here.

---

## File map / 文件分区

| File | Site section / 对应板块 |
|------|------------------------|
| `01-about-bio.md` | About — identity, positioning, bio, location, languages / 关于：身份、定位、简介、坐标、语言 |
| `02-experience-education.md` | Experience — work history, education, publications / 工作经历、教育、出版 |
| `03-selected-work.md` | Selected Work — shipped projects / 代表项目 |
| `04-skills.md` | Skill Index — skills & how they relate / 技能索引 |
| `05-blog.md` | Blog — articles and what they cover / 博客文章 |
| `06-atelier.md` | Atelier — frontend experiments / 工坊：前端实验作品 |
| `07-contact.md` | Contact — channels & links / 联系方式 |
| `08-about-this-site.md` | Colophon — how the site itself is built / 站点本身的技术栈与设计 |

Each doc is self-contained and bilingual (English + 中文) so retrieval matches queries in either
language. Edit one file without touching the others.

---

## How to load these into ElevenLabs / 如何上传到 ElevenLabs

In the ElevenLabs dashboard → your agent → **Knowledge base** → **Add document**:

- **Easiest:** open a file here, copy its contents, and paste using the **Text** option
  (one entry per file; name it after the file).
- **As a file:** the uploader accepts `.txt`, `.pdf`, `.docx`, `.html`, `.epub` — it may **not**
  accept `.md` directly. If so, save/rename the file to `.txt` (the Markdown is still readable as
  plain text) and upload that.

上传时：仪表盘 → 你的 agent → **Knowledge base** → **Add document**。最省事的方式是直接复制文件内容、
用 **Text** 方式粘贴；若想以文件上传，注意上传器可能不接受 `.md`，把文件另存为 `.txt` 再传即可。

> Tip: after adding/updating docs, re-index if the dashboard prompts you, then test in the
> agent preview with a few questions in both languages.

---

## Suggested agent persona / 建议的 agent 人设（可粘到 System prompt）

> You are the voice assistant on Zifeng Xiong's personal site (snowfly09.com). Speak as a concise,
> warm guide to Zifeng's work — an AI product person working at the intersection of AI, security,
> and product. Answer **only** from the knowledge base; if something isn't covered, say you don't
> have that detail and point visitors to the Contact page or email. Reply in the visitor's
> language (English or 中文). Keep answers short and spoken-friendly; offer to go deeper rather
> than dumping everything at once. Never invent facts, dates, or numbers.

> 你是熊子枫个人网站（snowfly09.com）的语音助手。用简洁、亲切的口吻介绍 Zifeng 的工作——一位在 AI、
> 安全与产品交叉领域工作的 AI 产品人。**只**依据知识库回答；知识库没有的内容，如实说明并引导访客到联系页
> 或邮箱。用访客的语言（中文或英文）作答。回答简短、适合口语，先给要点、再问是否展开。绝不编造事实、
> 日期或数字。
