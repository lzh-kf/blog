# 项目地图：个人博客 (Blog)

> 一份清晰的导航文档，帮助开发者快速理解项目结构、技术架构和业务逻辑。

---

## 1. 项目概述

一个基于 **Next.js 16 (App Router)** 全栈框架构建的个人博客系统。支持 Markdown 写作、文章分类/标签管理、评论审核、简历展示和邮件通知。数据层使用 **Drizzle ORM + SQLite**（通过 better-sqlite3），管理后台使用 **NextAuth v5 (Credentials Provider)** 进行身份认证。

| 维度 | 说明 |
|------|------|
| 框架 | Next.js 16.2 (App Router) + React 19 |
| 语言 | TypeScript 5.5 (strict) |
| 样式方案 | Tailwind CSS 4 + shadcn/ui + tw-animate-css |
| 数据库 | SQLite (better-sqlite3) + Drizzle ORM |
| 认证 | NextAuth v5 beta (Credentials + JWT) |
| 内容渲染 | react-markdown + remark-gfm + rehype-highlight + rehype-slug |
| 包管理器 | pnpm |
| 部署 | Vercel（默认） |

---

## 2. 目录拓扑

```
blog/
├── package.json              # 项目依赖与脚本
├── tsconfig.json             # TypeScript 配置（路径别名 @/ → ./src/*）
├── next.config.ts            # Next.js 配置（关闭 dev 指示器）
├── eslint.config.mjs         # ESLint 配置 (next/core-web-vitals + typescript)
├── postcss.config.mjs        # PostCSS → Tailwind CSS 4
├── README.md                 # 项目说明（默认模板）
├── PROJECT_MAP.md            # ← 本文件
│
├── public/                   # 静态资源
│   ├── *.svg                 # Next.js/Vercel 默认图标
│   └── images/juejin/        # 掘金图片资源（.png/.webp，约40张）
│
└── src/
    ├── middleware.ts          # 路由守卫（API/admin 认证拦截）
    │
    ├── db/                   # 🗄️ 数据层
    │   ├── schema.ts         #   数据库表结构定义（Drizzle ORM）
    │   ├── index.ts          #   数据库连接实例（单例模式）
    │   └── seed.ts           #   种子数据脚本（admin/posts/categories/tags/resume）
    │
    ├── lib/                  # 🔧 工具库
    │   ├── auth.ts           #   NextAuth 配置（Credentials Provider + JWT）
    │   ├── prisma.ts         #   向后兼容导出（重定向到 @/db）
    │   ├── markdown.ts       #   Markdown 插件配置（remarkGfm + rehypeHighlight + rehypeSlug）
    │   ├── toc.ts            #   文章目录提取（h2/h3 → TOCItem[]，兼容 rehype-slug 的 slug 算法）
    │   ├── email.ts          #   邮件通知（nodemailer + QQ SMTP）
    │   └── utils.ts          #   cn() — Tailwind class 合并工具
    │
    ├── components/           # 🧩 组件
    │   ├── ui/               #   shadcn/ui 基础组件（14个）
    │   ├── blog/             #   博客前端组件
    │   │   ├── Header.tsx           # 顶部导航栏（响应式，桌面/移动端）
    │   │   ├── PostCard.tsx         # 文章卡片（首页列表项）
    │   │   ├── PostListNav.tsx      # 首页文章列表浮动导航（大屏右侧）
    │   │   ├── PostTOC.tsx          # 文章详情目录导航（IntersectionObserver 高亮）
    │   │   ├── MarkdownRenderer.tsx # Markdown 渲染器（图片/代码块/表格/外链定制）
    │   │   └── CommentSection.tsx   # 评论组件（表单 + 列表 + 审核状态）
    │   └── admin/            #   管理后台组件
    │       ├── AdminSidebar.tsx      # 侧边栏（可折叠，桌面/移动端两套实现）
    │       ├── SidebarContext.tsx    # 侧边栏折叠状态 Context
    │       ├── AdminBreadcrumb.tsx   # 面包屑（usePathname 自动生成）
    │       ├── Pagination.tsx        # 分页组件
    │       ├── PostEditor.tsx        # 文章编辑器（新建/编辑，含分类/标签选择）
    │       └── MdEditor.tsx          # Markdown 编辑器封装（@uiw/react-md-editor）
    │
    └── app/                  # 📄 路由页面（App Router 文件系统路由）
        ├── globals.css       #   全局样式（Tailwind + shadcn + highlight.js + 自定义主题变量）
        ├── layout.tsx        #   根布局（<html> + <body> + Toaster）
        ├── page.tsx          #   首页 → 文章列表（ISR: revalidate=60s）
        │
        ├── posts/[slug]/     #   文章详情页
        │   └── page.tsx      #     Markdown 渲染 + TOC + 评论 + 阅读量递增
        │
        ├── categories/[slug]/#   分类归档页
        │   └── page.tsx      #     按分类筛选已发布文章
        │
        ├── tags/[slug]/      #   标签归档页
        │   └── page.tsx      #     按标签筛选已发布文章
        │
        ├── resume/           #   简历展示页
        │   └── page.tsx      #     react-markdown 直接渲染 resume.content
        │
        ├── admin/            #   管理后台
        │   ├── login/        #     登录页
        │   │   ├── page.tsx         # 登录页面入口（Suspense 包裹）
        │   │   └── login-form.tsx   # 登录表单（next-auth signIn）
        │   │
        │   └── (dashboard)/  #     仪表盘路由组（共享 AdminLayout）
        │       ├── layout.tsx       # 管理后台布局（SessionProvider + SidebarProvider）
        │       ├── page.tsx         # 仪表盘 → 统计卡片（文章数/待审核评论/分类数/标签数）
        │       ├── posts/
        │       │   ├── page.tsx           # 文章列表管理
        │       │   ├── new/page.tsx       # 新建文章
        │       │   └── [id]/edit/page.tsx # 编辑文章
        │       ├── categories/  page.tsx  # 分类管理
        │       ├── tags/        page.tsx  # 标签管理
        │       ├── comments/    page.tsx  # 评论管理（审核/删除）
        │       ├── resume/      page.tsx  # 简历编辑
        │       └── settings/    page.tsx  # 系统设置（修改密码）
        │
        └── api/               # 🌐 API 路由
            ├── auth/[...nextauth]/route.ts  # NextAuth 回调处理
            ├── posts/       route.ts        # GET 公开文章列表（分页/搜索/筛选）
            ├── comments/    route.ts        # GET 评论列表 | POST 提交评论（含邮件通知）
            ├── categories/  route.ts        # GET 分类列表（含文章计数）
            ├── tags/        route.ts        # GET 标签列表（含文章计数）
            ├── resume/      route.ts        # GET 简历数据
            └── admin/                        # 🔒 管理端 API（需认证）
                ├── posts/        route.ts    #   GET 全部文章 | POST 创建文章
                ├── posts/[id]/   route.ts    #   GET/PUT/DELETE 单篇文章
                ├── categories/   route.ts    #   GET/POST 分类
                ├── categories/[id]/ route.ts #   PUT/DELETE 分类
                ├── tags/         route.ts    #   GET/POST 标签
                ├── tags/[id]/    route.ts    #   PUT/DELETE 标签
                ├── comments/     route.ts    #   GET 全部评论 | PUT 批量审核
                ├── comments/[id]/route.ts    #   PUT/DELETE 单条评论
                ├── resume/       route.ts    #   PUT 更新简历
                └── settings/password/route.ts# PUT 修改密码
```

---

## 3. 数据库模型（ER 概要）

```
┌──────────┐       ┌──────────────┐       ┌──────────┐
│   users  │       │    posts     │       │ post_tags│
├──────────┤       ├──────────────┤       ├──────────┤
│ id (PK)  │       │ id (PK)      │──┐    │ postId   │──┐
│ username │       │ title        │  │    │ tagId    │  │
│ password │       │ slug (UQ)    │  │    └──────────┘  │
│ nickname │       │ summary      │  │        ┌──────────┐
│ email    │       │ content      │  ├───────→│   tags   │
└──────────┘       │ categoryId ──┤──┘        ├──────────┤
                   │ status       │           │ id (PK)  │
                   │ isTop        │           │ name     │
┌──────────┐       │ viewCount    │           │ slug(UQ) │
│categories │      │ publishedAt  │           └──────────┘
├──────────┤       │ createdAt   │
│ id (PK)  │←──────│ updatedAt   │
│ name     │       └──────────────┘
│ slug(UQ) │              │
│ desc     │              │
└──────────┘              ▼
                   ┌──────────────┐       ┌──────────┐
                   │   comments   │       │  resume  │
                   ├──────────────┤       ├──────────┤
                   │ id (PK)      │       │ id (PK)  │
                   │ postId (FK)  │       │ content  │
                   │ parentId     │       │ updatedAt│
                   │ authorName   │       └──────────┘
                   │ authorEmail  │
                   │ content      │
                   │ status       │  pending | approved | spam
                   │ ip           │
                   │ createdAt    │
                   └──────────────┘
```

**关键业务规则：**

- `posts.status` 枚举：`"draft"` / `"published"`
- `comments.status` 枚举：`"pending"` / `"approved"` / `"spam"`
- 文章与标签为**多对多**关系（通过 `post_tags` 中间表）
- 文章与分类为**多对一**关系
- 评论支持**自引用**（`parentId` 指向父评论，实现嵌套回复）
- 文章 `viewCount` 递增使用 SQL 原子操作 `view_count + 1`
- `isTop` 为 `true` 的文章在列表最前显示

---

## 4. 路由与页面一览

### 4.1 公开页面

| 路由 | 文件 | 说明 | 渲染策略 |
|------|------|------|----------|
| `/` | `app/page.tsx` | 文章列表首页 | ISR (revalidate=60s) |
| `/posts/[slug]` | `app/posts/[slug]/page.tsx` | 文章详情 | SSG (generateStaticParams) + 动态 |
| `/categories/[slug]` | `app/categories/[slug]/page.tsx` | 分类归档 | SSG (generateStaticParams) |
| `/tags/[slug]` | `app/tags/[slug]/page.tsx` | 标签归档 | SSG (generateStaticParams) |
| `/resume` | `app/resume/page.tsx` | 简历展示 | 动态渲染 |

### 4.2 管理后台页面（需登录）

| 路由 | 文件 | 说明 |
|------|------|------|
| `/admin/login` | `app/admin/login/` | 登录页（已登录自动跳转） |
| `/admin` | `app/admin/(dashboard)/page.tsx` | 仪表盘（统计概览） |
| `/admin/posts` | `app/admin/(dashboard)/posts/page.tsx` | 文章列表管理 |
| `/admin/posts/new` | `app/admin/(dashboard)/posts/new/page.tsx` | 新建文章 |
| `/admin/posts/[id]/edit` | `app/admin/(dashboard)/posts/[id]/edit/page.tsx` | 编辑文章 |
| `/admin/categories` | `app/admin/(dashboard)/categories/page.tsx` | 分类管理 |
| `/admin/tags` | `app/admin/(dashboard)/tags/page.tsx` | 标签管理 |
| `/admin/comments` | `app/admin/(dashboard)/comments/page.tsx` | 评论审核 |
| `/admin/resume` | `app/admin/(dashboard)/resume/page.tsx` | 简历编辑 |
| `/admin/settings` | `app/admin/(dashboard)/settings/page.tsx` | 系统设置（修改密码） |

### 4.3 API 端点

| 方法 | 端点 | 认证 | 说明 |
|------|------|------|------|
| `GET` | `/api/posts` | 否 | 公开文章列表（分页/搜索/分类/标签筛选） |
| `GET` | `/api/comments` | 否 | 文章评论列表（需 postSlug） |
| `POST` | `/api/comments` | 否 | 提交评论（状态=pending，异步发邮件通知） |
| `GET` | `/api/categories` | 否 | 分类列表（含已发布文章计数） |
| `GET` | `/api/tags` | 否 | 标签列表（含文章计数） |
| `GET` | `/api/resume` | 否 | 简历数据 |
| `GET/POST` | `/api/admin/posts` | 是 | 文章列表 CRUD |
| `GET/PUT/DELETE` | `/api/admin/posts/[id]` | 是 | 单篇文章操作 |
| `GET/POST` | `/api/admin/categories` | 是 | 分类 CRUD |
| `PUT/DELETE` | `/api/admin/categories/[id]` | 是 | 单分类操作 |
| `GET/POST` | `/api/admin/tags` | 是 | 标签 CRUD |
| `PUT/DELETE` | `/api/admin/tags/[id]` | 是 | 单标签操作 |
| `GET/PUT` | `/api/admin/comments` | 是 | 评论列表 + 批量审核 |
| `PUT/DELETE` | `/api/admin/comments/[id]` | 是 | 单条评论审核/删除 |
| `PUT` | `/api/admin/resume` | 是 | 更新简历 |
| `PUT` | `/api/admin/settings/password` | 是 | 修改密码 |

---

## 5. 认证与安全架构

```
浏览器请求
    │
    ▼
┌──────────────────────────────────┐
│  middleware.ts                   │
│  ───────────────────────────────│
│  • /admin/** & /api/admin/**    │  检查 authjs.session-token cookie
│    → 无 token → /admin/login    │
│  • /admin/login + 已有 token    │
│    → /admin                     │
│  • /api/auth/** → 放行          │
└──────────────────────────────────┘
    │
    ▼
┌──────────────────────────────────┐
│  src/lib/auth.ts                │
│  ───────────────────────────────│
│  NextAuth v5 + Credentials      │
│  • bcrypt 密码验证              │
│  • JWT session strategy         │
│  • jwt callback → token.id      │
│  • session callback → user.id   │
└──────────────────────────────────┘
```

**认证要点：**
- 使用 NextAuth v5 beta 的 **Credentials Provider**（用户名+密码）
- Session 策略为 **JWT**（无数据库 session 表）
- 中间件直接读取 cookie 做快速判断，不调用 Prisma/NextAuth（避免 Edge Runtime 兼容问题）
- API 返回 401 JSON 错误，页面返回重定向

---

## 6. 核心业务流

### 6.1 文章发布流程

```
管理后台 → PostEditor → POST/PUT /api/admin/posts
    │
    ├── 标题 → 自动生成 slug（中文转 base36 时间戳，英文转 kebab-case）
    ├── 分类选择 → categoryId
    ├── 标签多选 → post_tags 关联表
    ├── 发布状态 → draft / published
    └── publishedAt → 首次发布时写入时间戳
```

### 6.2 评论审核流程

```
访客 → POST /api/comments (status=pending)
    │
    ├── 提取 x-forwarded-for / x-real-ip
    ├── 异步 → sendCommentNotification (nodemailer → QQ SMTP)
    │          → 站长邮箱收到通知
    │
    └── 管理后台 → /admin/comments
         ├── [审核通过] → PUT status=approved
         ├── [标记垃圾] → PUT status=spam
         └── [删除]     → DELETE
```

### 6.3 首页 ISR 刷新

```
GET / → 60s 内返回缓存 → 60s 后首次请求触发后台重新生成
    → db.query.posts.findMany({ where: status="published", with: category + tags })
    → PostCard 列表渲染
```

---

## 7. 技术决策记录

| 决策 | 选择 | 原因 |
|------|------|------|
| 数据库 | SQLite (better-sqlite3) | 零配置、单文件、适合个人博客体量 |
| ORM | Drizzle ORM | 类型安全、SQL-like 语法、轻量 |
| 认证 | NextAuth Credentials | 单用户博客，无需 OAuth 复杂度 |
| 前台渲染策略 | ISR (60s) + SSG | SEO 友好 + 阅读量实时更新 |
| 中间件实现 | 直接读 cookie | 避免 Edge Runtime 加载 Prisma/bcrypt 失败 |
| Markdown 编辑器 | @uiw/react-md-editor | React 原生、支持分屏预览 |
| 邮件服务 | nodemailer + QQ SMTP | 个人项目无需专业邮件服务 |
| 状态管理 | React Context (SidebarContext) | 仅管理后台侧边栏折叠，无需全局状态库 |

---

## 8. 快速启动

```bash
# 安装依赖
pnpm install

# 初始化数据库 + 种子数据
pnpm tsx src/db/seed.ts

# 启动开发服务器
pnpm dev
# → http://localhost:3000
# → 管理后台: http://localhost:3000/admin/login
#    默认账号: admin / admin123
```

---

## 9. 文件职责速查表

| 文件 | 类型 | 职责 |
|------|------|------|
| `src/db/schema.ts` | 数据 | 所有表的 Drizzle schema 定义 + relations |
| `src/db/index.ts` | 数据 | 单例 DB 实例（开发环境 hot-reload 安全） |
| `src/db/seed.ts` | 数据 | 种子数据：admin 用户 + 示例分类/标签/文章/简历 |
| `src/middleware.ts` | 安全 | 路由级别认证拦截 |
| `src/lib/auth.ts` | 安全 | NextAuth 配置（jwt + session callbacks） |
| `src/lib/markdown.ts` | 工具 | Markdown 渲染插件集（unified 生态） |
| `src/lib/toc.ts` | 工具 | Markdown 标题提取 + slug 生成 |
| `src/lib/email.ts` | 工具 | 邮件通知（nodemailer） |
| `src/lib/utils.ts` | 工具 | `cn()` class 合并 |
| `src/app/layout.tsx` | UI | 根布局 + 全局 metadata |
| `src/app/globals.css` | UI | Tailwind + shadcn + highlight.js 主题 |
| `src/app/page.tsx` | 页面 | 首页文章列表 |
| `src/app/posts/[slug]/page.tsx` | 页面 | 文章详情 + 阅读量统计 |
| `src/components/blog/MarkdownRenderer.tsx` | UI | 定制化 Markdown → HTML 渲染 |
| `src/components/blog/CommentSection.tsx` | UI | 评论表单 + 评论列表 |
| `src/components/blog/PostTOC.tsx` | UI | 文章内目录导航 + 滚动高亮 |
| `src/components/blog/PostListNav.tsx` | UI | 首页文章列表浮动导航 |
| `src/components/admin/PostEditor.tsx` | UI | 文章编辑器（新建/编辑模式） |
| `src/components/admin/AdminSidebar.tsx` | UI | 管理后台侧边栏 |
| `src/app/api/posts/route.ts` | API | 公开文章查询 API |
| `src/app/api/comments/route.ts` | API | 评论查询 + 提交 API |
| `src/app/api/admin/posts/route.ts` | API | 管理端文章 CRUD |
```

---

> 最后更新：2026-07-25
