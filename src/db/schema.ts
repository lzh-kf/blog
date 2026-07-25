import { sqliteTable, text, integer, primaryKey } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

// 管理员用户
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  nickname: text("nickname").notNull(),
  email: text("email").notNull(),
  createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
  updatedAt: text("updated_at").notNull().default("CURRENT_TIMESTAMP"),
});

// 文章分类
export const categories = sqliteTable("categories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
});

export const categoriesRelations = relations(categories, ({ many }) => ({
  posts: many(posts),
}));

// 文章标签
export const tags = sqliteTable("tags", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
});

export const tagsRelations = relations(tags, ({ many }) => ({
  postTags: many(postTags),
}));

// 文章
export const posts = sqliteTable("posts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  summary: text("summary"),
  content: text("content").notNull(),
  categoryId: integer("category_id").references(() => categories.id),
  status: text("status").notNull().default("draft"), // draft | published
  isTop: integer("is_top", { mode: "boolean" }).notNull().default(false),
  viewCount: integer("view_count").notNull().default(0),
  publishedAt: text("published_at"),
  createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
  updatedAt: text("updated_at").notNull().default("CURRENT_TIMESTAMP"),
});

export const postsRelations = relations(posts, ({ one, many }) => ({
  category: one(categories, { fields: [posts.categoryId], references: [categories.id] }),
  postTags: many(postTags),
  comments: many(comments),
}));

// 文章-标签 多对多
export const postTags = sqliteTable("post_tags", {
  postId: integer("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
  tagId: integer("tag_id").notNull().references(() => tags.id, { onDelete: "cascade" }),
}, (table) => ({
  pk: primaryKey({ columns: [table.postId, table.tagId] }),
}));

export const postTagsRelations = relations(postTags, ({ one }) => ({
  post: one(posts, { fields: [postTags.postId], references: [posts.id] }),
  tag: one(tags, { fields: [postTags.tagId], references: [tags.id] }),
}));

// 评论
export const comments = sqliteTable("comments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  postId: integer("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
  parentId: integer("parent_id"),
  authorName: text("author_name").notNull(),
  authorEmail: text("author_email").notNull(),
  content: text("content").notNull(),
  status: text("status").notNull().default("pending"), // pending | approved | spam
  ip: text("ip"),
  createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
});

export const commentsRelations = relations(comments, ({ one, many }) => ({
  post: one(posts, { fields: [comments.postId], references: [posts.id] }),
  parent: one(comments, { fields: [comments.parentId], references: [comments.id], relationName: "replies" }),
  replies: many(comments, { relationName: "replies" }),
}));

// 个人简历
export const resume = sqliteTable("resume", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  content: text("content").notNull().default(""),
  updatedAt: text("updated_at").notNull().default("CURRENT_TIMESTAMP"),
});
