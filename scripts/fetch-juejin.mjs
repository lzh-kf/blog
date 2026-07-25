/**
 * 掘金文章迁移脚本
 * 功能：
 * 1. 从掘金 API 拉取所有文章（含完整 Markdown 内容）
 * 2. 保存为 Markdown 文件到 content/juejin/
 * 3. 写入 SQLite 数据库（posts 表）
 *
 * 用法：node scripts/fetch-juejin.mjs
 */

import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import Database from "better-sqlite3";
import crypto from "crypto";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const CONTENT_DIR = join(ROOT, "content", "juejin");
const DB_PATH = join(ROOT, "dev.db");

// =========== 配置 ===========
const USER_ID = "4212984288912376";
const API_BASE = "https://api.juejin.cn/content_api/v1";
const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Origin: "https://juejin.cn",
  Referer: "https://juejin.cn/",
  "Content-Type": "application/json; charset=utf-8",
};

// =========== 工具函数 ===========

/** 生成 URL 友好的 slug */
function slugify(title) {
  // 简单策略：保留中英文和数字，其他字符替换为连字符
  return title
    .replace(/[^\w一-鿿]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase()
    .slice(0, 80) || "article";
}

/** Unix 时间戳 → yyyy-MM-dd */
function formatDate(ts) {
  return new Date(ts * 1000).toISOString().slice(0, 10);
}

/** 生成唯一短 ID */
function shortHash(str) {
  return crypto.createHash("md5").update(str).digest("hex").slice(0, 6);
}

// =========== API 调用 ===========

async function fetchArticleList() {
  console.log("📡 正在获取文章列表...");
  const res = await fetch(`${API_BASE}/article/query_list`, {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify({
      user_id: USER_ID,
      cursor: "0",
      sort_type: 2,
      client_type: 2608,
    }),
  });
  const json = await res.json();
  if (json.err_no !== 0) throw new Error(`列表 API 错误: ${json.err_msg}`);

  const articles = json.data.map((d) => ({
    article_id: d.article_info.article_id,
    title: d.article_info.title,
    brief_content: d.article_info.brief_content,
    ctime: Number(d.article_info.ctime),
    mtime: Number(d.article_info.mtime),
    view_count: d.article_info.view_count,
    digg_count: d.article_info.digg_count,
    collect_count: d.article_info.collect_count,
    comment_count: d.article_info.comment_count,
    tag_ids: d.article_info.tag_ids || [],
  }));

  console.log(`✅ 找到 ${articles.length} 篇文章\n`);
  return articles;
}

async function fetchArticleDetail(articleId) {
  const res = await fetch(`${API_BASE}/article/detail`, {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify({ article_id: articleId, client_type: 2608 }),
  });
  const json = await res.json();
  if (json.err_no !== 0)
    throw new Error(`详情 API 错误 (${articleId}): ${json.err_msg}`);
  return {
    mark_content: json.data.article_info.mark_content || "",
    title: json.data.article_info.title,
    brief_content: json.data.article_info.brief_content,
  };
}

// =========== 数据库操作 ===========

function getOrCreateCategory(db, name, slug) {
  const existing = db
    .prepare("SELECT id FROM categories WHERE slug = ?")
    .get(slug);
  if (existing) return existing.id;

  const result = db
    .prepare(
      "INSERT INTO categories (name, slug, description, sort_order, created_at) VALUES (?, ?, ?, ?, ?)"
    )
    .run(name, slug, `从掘金迁移的文章`, 0, new Date().toISOString());
  return result.lastInsertRowid;
}

function insertPost(db, post) {
  // 先检查 slug 是否已存在，若存在则追加 hash
  let slug = post.slug;
  const existing = db.prepare("SELECT id FROM posts WHERE slug = ?").get(slug);
  if (existing) {
    slug = `${post.slug}-${shortHash(post.article_id)}`;
  }

  const result = db
    .prepare(
      `INSERT INTO posts (title, slug, summary, content, category_id, status, is_top, view_count, published_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 'published', 0, ?, ?, ?, ?)`
    )
    .run(
      post.title,
      slug,
      post.brief_content || null,
      post.mark_content,
      post.categoryId || null,
      post.view_count,
      post.publishedAt,
      post.publishedAt,
      post.publishedAt
    );

  return { id: Number(result.lastInsertRowid), slug };
}

// =========== Markdown 文件 ===========

function buildFrontmatter(post) {
  const lines = [
    "---",
    `title: "${post.title.replace(/"/g, '\\"')}"`,
    `date: ${post.date}`,
    `source: https://juejin.cn/post/${post.article_id}`,
    `slug: ${post.slug}`,
    `summary: "${(post.brief_content || "").replace(/"/g, '\\"')}"`,
    `view_count: ${post.view_count}`,
    `digg_count: ${post.digg_count}`,
    `collect_count: ${post.collect_count}`,
    "---",
    "",
  ];
  return lines.join("\n");
}

function saveMarkdownFile(post) {
  mkdirSync(CONTENT_DIR, { recursive: true });
  const frontmatter = buildFrontmatter(post);
  const filePath = join(CONTENT_DIR, `${post.slug}.md`);
  writeFileSync(filePath, frontmatter + post.mark_content, "utf-8");
  return filePath;
}

// =========== 主流程 ===========

async function main() {
  console.log("🚀 掘金文章迁移工具\n");
  console.log(`📂 Markdown 输出目录: ${CONTENT_DIR}`);
  console.log(`🗄️  数据库: ${DB_PATH}\n`);

  // 1. 获取文章列表
  const articles = await fetchArticleList();

  // 2. 打开数据库
  const db = new Database(DB_PATH);
  // 启用 WAL 模式提升性能
  db.pragma("journal_mode = WAL");

  // 3. 获取或创建「掘金」分类
  const juejinCategoryId = getOrCreateCategory(db, "掘金", "juejin");
  console.log(`🏷️  分类 ID: ${juejinCategoryId} (掘金)\n`);

  // 4. 逐篇拉取并保存
  const results = [];
  let successCount = 0;
  let skippedCount = 0;

  for (let i = 0; i < articles.length; i++) {
    const article = articles[i];
    const date = formatDate(article.ctime);
    // 使用 ASCII 安全格式，避免中文 slug 导致 Next.js 路由 404
    const slug = `${date}-juejin-${shortHash(article.article_id)}`;

    console.log(
      `[${i + 1}/${articles.length}] 📝 ${article.title.slice(0, 50)}...`
    );

    try {
      // 检查是否已入库
      const existing = db
        .prepare("SELECT id FROM posts WHERE slug = ?")
        .get(slug);
      if (existing) {
        console.log(`   ⏭️  已存在 (slug: ${slug})，跳过\n`);
        skippedCount++;
        continue;
      }

      // 拉取完整内容
      const detail = await fetchArticleDetail(article.article_id);
      console.log(`   📥 内容长度: ${detail.mark_content.length} 字符`);

      const postData = {
        ...article,
        mark_content: detail.mark_content,
        date,
        slug,
        categoryId: juejinCategoryId,
        publishedAt: new Date(article.ctime * 1000).toISOString(),
      };

      // 保存 Markdown 文件
      const filePath = saveMarkdownFile(postData);
      console.log(`   💾 已保存: ${filePath}`);

      // 写入数据库
      const dbResult = insertPost(db, postData);
      console.log(`   🗄️  已入库: id=${dbResult.id}, slug=${dbResult.slug}\n`);

      results.push(postData);
      successCount++;

      // 请求间隔，避免被限流
      if (i < articles.length - 1) {
        await new Promise((r) => setTimeout(r, 500));
      }
    } catch (err) {
      console.error(`   ❌ 错误: ${err.message}\n`);
    }
  }

  // 5. 输出汇总
  console.log("═══════════════════════════════════");
  console.log("📊 迁移完成！");
  console.log(`   ✅ 成功: ${successCount} 篇`);
  console.log(`   ⏭️  跳过: ${skippedCount} 篇`);
  console.log(`   ❌ 失败: ${articles.length - successCount - skippedCount} 篇`);
  console.log(`   📂 Markdown 文件: ${CONTENT_DIR}`);
  console.log(`   🗄️  数据库: ${DB_PATH}`);
  console.log("═══════════════════════════════════");

  db.close();
}

main().catch((err) => {
  console.error("💥 脚本执行失败:", err);
  process.exit(1);
});
