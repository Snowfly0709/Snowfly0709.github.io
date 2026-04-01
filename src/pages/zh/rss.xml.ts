import rss from "@astrojs/rss";
import { getCollection } from "astro:content";

export async function GET(context) {
  const posts = (await getCollection("blog", (entry) => entry.data.lang === "zh" && !entry.data.draft)).sort(
    (a, b) => b.data.date.getTime() - a.data.date.getTime()
  );

  return rss({
    title: "熊子枫博客",
    description: "技术笔记与 AI 产品思考。",
    site: context.site,
    items: posts.map((post) => ({
      title: post.data.title,
      pubDate: post.data.date,
      description: post.data.description,
      link: `/zh/blog/${post.slug.replace(/^zh\//, "")}/`
    }))
  });
}
