import { PrismaClient } from "../src/generated/prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 开始种子数据...");

  // 创建管理员
  const passwordHash = await bcrypt.hash("admin123", 10);
  const admin = await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      passwordHash,
      nickname: "站长",
      email: "admin@example.com",
    },
  });
  console.log("✅ 管理员创建完成:", admin.username);

  // 创建分类
  const categories = await Promise.all([
    prisma.category.create({ data: { name: "技术", slug: "tech", description: "技术相关文章", sortOrder: 1 } }),
    prisma.category.create({ data: { name: "生活", slug: "life", description: "生活随笔", sortOrder: 2 } }),
    prisma.category.create({ data: { name: "随笔", slug: "essay", description: "日常思考", sortOrder: 3 } }),
  ]);
  console.log("✅ 分类创建完成:", categories.length, "个");

  // 创建标签
  const tags = await Promise.all([
    prisma.tag.create({ data: { name: "React", slug: "react" } }),
    prisma.tag.create({ data: { name: "Next.js", slug: "nextjs" } }),
    prisma.tag.create({ data: { name: "TypeScript", slug: "typescript" } }),
    prisma.tag.create({ data: { name: "Node.js", slug: "nodejs" } }),
    prisma.tag.create({ data: { name: "MySQL", slug: "mysql" } }),
  ]);
  console.log("✅ 标签创建完成:", tags.length, "个");

  // 创建示例文章
  const post = await prisma.post.create({
    data: {
      title: "使用 Next.js 和 Prisma 构建个人博客",
      slug: "build-blog-with-nextjs-prisma",
      summary: "从零开始，使用 Next.js 全栈框架和 Prisma ORM 构建一个个人博客网站。",
      content: `# 使用 Next.js 和 Prisma 构建个人博客

## 前言

Next.js 是一个基于 React 的全栈框架，支持 SSR、SSG 和 ISR，非常适合构建博客类网站。

## 技术栈

- **Next.js** - React 全栈框架
- **Prisma** - 类型安全的 ORM
- **MySQL** - 关系型数据库
- **Tailwind CSS** - 原子化 CSS 框架

## 开始

\`\`\`bash
npx create-next-app@latest blog --typescript --tailwind
\`\`\`

## 总结

使用这些技术栈可以快速搭建一个 SEO 友好的博客。
`,
      categoryId: categories[0].id,
      status: "published",
      publishedAt: new Date(),
      tags: {
        create: [{ tagId: tags[0].id }, { tagId: tags[1].id }, { tagId: tags[2].id }],
      },
    },
  });
  console.log("✅ 示例文章创建完成:", post.title);

  // 创建简历
  await prisma.resume.create({
    data: {
      content: `# 个人信息

- **姓名**：张三
- **邮箱**：zhangsan@example.com
- **GitHub**：https://github.com/zhangsan

## 技能

- 前端开发：React、Vue、TypeScript
- 后端开发：Node.js、Python
- 数据库：MySQL、PostgreSQL

## 工作经历

### 前端工程师 @ XX公司（2022-至今）

负责公司核心产品的前端架构设计和开发。

### 初级前端工程师 @ YY公司（2020-2022）

参与多个项目的开发，积累了大量实战经验。

## 教育

- 本科 - 计算机科学与技术 @ 某大学（2016-2020）
`,
    },
  });
  console.log("✅ 简历创建完成");

  console.log("🎉 种子数据完成！");
}

main()
  .catch((e) => {
    console.error("❌ 种子数据失败:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
