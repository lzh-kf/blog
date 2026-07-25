import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import bcrypt from "bcryptjs";

const sqlite = new Database("dev.db");
const db = drizzle(sqlite, { schema });

async function main() {
  console.log("🌱 开始种子数据...");

  // 删除旧数据
  sqlite.exec("DELETE FROM post_tags");
  sqlite.exec("DELETE FROM comments");
  sqlite.exec("DELETE FROM posts");
  sqlite.exec("DELETE FROM categories");
  sqlite.exec("DELETE FROM tags");
  sqlite.exec("DELETE FROM users");
  sqlite.exec("DELETE FROM resume");

  // 创建管理员
  const passwordHash = await bcrypt.hash("admin123", 10);
  db.insert(schema.users).values({
    username: "admin",
    passwordHash,
    nickname: "站长",
    email: "admin@example.com",
  }).run();
  console.log("✅ 管理员创建完成: admin");

  // 创建分类
  const cat1 = db.insert(schema.categories).values({
    name: "技术", slug: "tech", description: "技术相关文章", sortOrder: 1,
  }).run();
  const cat2 = db.insert(schema.categories).values({
    name: "生活", slug: "life", description: "生活随笔", sortOrder: 2,
  }).run();
  const cat3 = db.insert(schema.categories).values({
    name: "随笔", slug: "essay", description: "日常思考", sortOrder: 3,
  }).run();
  console.log("✅ 分类创建完成: 3个");

  // 创建标签
  const tags = [
    db.insert(schema.tags).values({ name: "React", slug: "react" }).run(),
    db.insert(schema.tags).values({ name: "Next.js", slug: "nextjs" }).run(),
    db.insert(schema.tags).values({ name: "TypeScript", slug: "typescript" }).run(),
    db.insert(schema.tags).values({ name: "Node.js", slug: "nodejs" }).run(),
    db.insert(schema.tags).values({ name: "SQLite", slug: "sqlite" }).run(),
  ];
  console.log("✅ 标签创建完成:", tags.length, "个");

  // 创建示例文章
  const post = db.insert(schema.posts).values({
    title: "使用 Next.js 和 Drizzle ORM 构建个人博客",
    slug: "build-blog-with-nextjs-drizzle",
    summary: "从零开始，使用 Next.js 全栈框架和 Drizzle ORM 构建一个 SEO 友好的个人博客网站，支持 Markdown 编写和服务器端渲染。",
    content: `# 使用 Next.js 和 Drizzle ORM 构建个人博客

## 前言

Next.js 是一个基于 React 的全栈框架，支持 SSR、SSG 和 ISR，非常适合构建 SEO 友好的博客类网站。

## 技术栈

- **Next.js** - React 全栈框架
- **Drizzle ORM** - 类型安全的轻量级 ORM
- **SQLite/MySQL** - 开发/生产数据库
- **Tailwind CSS** - 原子化样式
- **react-markdown** - Markdown 渲染

## 开始

\`\`\`bash
pnpm create next-app@latest blog --typescript --tailwind
pnpm add drizzle-orm better-sqlite3
\`\`\`

## 为什么选择 Drizzle ORM？

- 零依赖第三方二进制，安装即用
- 完整的 TypeScript 类型推导
- SQL-like 查询语法，学习曲线平缓
- 支持 SQLite（开发）和 MySQL（生产）无缝切换

## 总结

Next.js + Drizzle ORM 的组合非常适合个人博客这类内容驱动型网站。
`,
    categoryId: 1,
    status: "published",
    isTop: true,
    publishedAt: new Date().toISOString(),
  }).run();
  console.log("✅ 示例文章创建完成:", "build-blog-with-nextjs-drizzle");

  // 文章-标签关联
  db.insert(schema.postTags).values({ postId: 1, tagId: 1 }).run();
  db.insert(schema.postTags).values({ postId: 1, tagId: 2 }).run();
  db.insert(schema.postTags).values({ postId: 1, tagId: 3 }).run();
  console.log("✅ 文章标签关联完成");

  // 创建简历
  db.insert(schema.resume).values({
    content: `# 个人信息

- **昵称**：站长
- **邮箱**：admin@example.com
- **GitHub**：https://github.com/example

## 技能

- 前端开发：React、Vue、TypeScript
- 后端开发：Node.js、Python
- 数据库：MySQL、SQLite、PostgreSQL

## 工作经历

### 前端工程师 @ XX公司（2022-至今）

负责公司核心产品的前端架构设计和开发。

## 教育

- 本科 - 计算机科学与技术 @ 某大学（2016-2020）
`,
  }).run();
  console.log("✅ 简历创建完成");

  console.log("🎉 种子数据完成！");
}

main().catch((e) => {
  console.error("❌ 种子数据失败:", e);
  process.exit(1);
});
