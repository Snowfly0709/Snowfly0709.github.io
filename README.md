# snowfly09.com (Astro Rebuild)

Modern bilingual personal site and blog for Zifeng Xiong.

## Stack

- Astro (static output)
- Markdown content collections
- Built-in Shiki highlighting
- RSS feeds

## Local development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Content workflow (reusable)

1. Create a new Markdown file in one of these folders:
   - `src/content/blog/en/`
   - `src/content/blog/zh/`
2. Copy from template:
   - `templates/blog-post-template.en.md`
   - `templates/blog-post-template.zh.md`
3. Fill frontmatter fields:
   - `title`
   - `description`
   - `date`
   - `lang`
   - `tags`
4. Write post body in Markdown.

Code blocks (triple backticks) are automatically highlighted and get a copy button on post pages.

## Routing

- Default redirect: `/` -> `/en/`
- English pages: `/en/...`
- Chinese pages: `/zh/...`

## RSS

- English: `/en/rss.xml`
- Chinese: `/zh/rss.xml`

## Deployment

This project is static and can be deployed directly to GitHub Pages.
Custom domain is configured through `public/CNAME` (`snowfly09.com`).