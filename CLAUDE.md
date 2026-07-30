# 博客项目文档

> 自动生成于 2026-07-30，后续每次 Claude 会话启动时会自动加载本文档，无需重新扫描项目。

---

## 1. 项目概述

基于 **Next.js 16 App Router** 的全栈个人博客系统，支持文章发布、分类标签管理、评论审核、简历展示、主题切换等功能。

| 维度 | 说明 |
|------|------|
| 框架 | Next.js 16.2 (App Router) + React 19.2 |
| 语言 | TypeScript 5.5 (strict) |
| 样式方案 | Tailwind CSS 4 + shadcn/ui (base-nova 风格) + tw-animate-css |
| 数据库 | SQLite (`@libsql/client`) + Drizzle ORM 0.45 |
| 认证 | NextAuth v5 beta (Credentials Provider + JWT) |
| 内容渲染 | react-markdown + remark-gfm + rehype-highlight + rehype-slug |
| 包管理器 | pnpm |
| 部署 | 阿里云 Ubuntu 22.04, Nginx 反代, PM2 守护 |

---

## 2. 目录结构

```
blog/
├── src/
│   ├── middleware.ts                 # 路由认证守卫
│   ├── globals.css                   # Tailwind 4 + shadcn + highlight.js 样式
│   │
│   ├── db/                           # 数据层
│   │   ├── index.ts                  # @libsql/client 连接 + drizzle 实例
│   │   ├── schema.ts                 # 7 张表定义 (users/categories/tags/posts/post_tags/comments/resume)
│   │   └── seed.ts                   # 种子数据
│   │
│   ├── lib/                          # 工具库
│   │   ├── auth.ts                   # NextAuth 配置 (Credentials + JWT, 从 users 表校验)
│   │   ├── prisma.ts                 # 向后兼容 (重定向到 @/db)
│   │   ├── markdown.ts               # Markdown 渲染插件集
│   │   ├── toc.ts                    # 提取 h2/h3 生成目录 TOCItem[]
│   │   ├── email.ts                  # nodemailer 邮件通知
│   │   └── utils.ts                  # cn() class 合并 (tailwind-merge + clsx)
│   │
│   ├── components/
│   │   ├── ui/                       # shadcn/ui 基础组件 (16 个: avatar/badge/button/card/checkbox/dialog/dropdown-menu/input/label/select/separator/sheet/table/textarea/toast)
│   │   ├── blog/                     # 博客前端组件
│   │   │   ├── BlogShell.tsx         # 控制 .dark 作用域
│   │   │   ├── ThemeProvider.tsx     # 亮/暗/系统 + 6 种主题色
│   │   │   ├── Header.tsx           # 响应式顶部导航栏
│   │   │   ├── PostCard.tsx         # 文章卡片
│   │   │   ├── PostListNav.tsx      # 首页右侧浮动导航 (仅大屏)
│   │   │   ├── PostTOC.tsx          # 文章目录 (IntersectionObserver 高亮)
│   │   │   ├── MarkdownRenderer.tsx # Markdown 渲染器 (图片/代码/表格/外链定制)
│   │   │   ├── CommentSection.tsx   # 评论组件 (表单+列表)
│   │   │   └── ViewTracker.tsx      # 阅读量追踪 (POST /api/posts/[slug]/view)
│   │   └── admin/                    # 管理后台组件
│   │       ├── AdminSidebar.tsx     # 可折叠侧边栏 (桌面/移动端)
│   │       ├── SidebarContext.tsx    # 侧边栏折叠状态 Context
│   │       ├── AdminBreadcrumb.tsx  # 自动生成面包屑
│   │       ├── Pagination.tsx       # 分页组件
│   │       ├── PostEditor.tsx       # 文章编辑器 (新建/编辑)
│   │       └── MdEditor.tsx         # @uiw/react-md-editor 封装
│   │
│   └── app/
│       ├── layout.tsx                # 根布局
│       │
│       ├── (blog)/                   # 博客前端路由组
│       │   ├── layout.tsx           # ThemeProvider + BlogShell
│       │   ├── page.tsx             # 首页 (ISR 60s)
│       │   ├── posts/[slug]/page.tsx # 文章详情 (SSG + ISR 3600s)
│       │   ├── categories/[slug]/page.tsx  # 分类归档
│       │   ├── tags/[slug]/page.tsx # 标签归档
│       │   ├── resume/page.tsx      # 简历展示
│       │   └── settings/page.tsx    # 主题色/外观设置
│       │
│       ├── admin/
│       │   ├── login/               # 登录页
│       │   └── (dashboard)/         # 仪表盘路由组
│       │       ├── layout.tsx       # SessionProvider + SidebarProvider
│       │       ├── page.tsx         # 统计概览
│       │       ├── posts/           # 文章管理 (列表/新建/编辑)
│       │       ├── categories/      # 分类管理
│       │       ├── tags/            # 标签管理
│       │       ├── comments/        # 评论审核
│       │       ├── resume/          # 简历编辑
│       │       └── settings/        # 修改密码
│       │
│       └── api/                     # API 路由
│           ├── auth/[...nextauth]/  # NextAuth 回调
│           ├── posts/               # GET 公开文章列表
│           ├── posts/[slug]/view/   # POST 阅读量+1
│           ├── comments/            # GET 评论 / POST 提交评论
│           ├── categories/          # GET 分类列表
│           ├── tags/                # GET 标签列表
│           ├── resume/              # GET 简历
│           ├── uploads/[filename]/  # GET 图片服务
│           └── admin/
│               ├── posts/           # CRUD 文章
│               ├── categories/      # CRUD 分类
│               ├── tags/            # CRUD 标签
│               ├── comments/        # 审核/删除评论
│               ├── resume/          # PUT 更新简历
│               ├── settings/password/  # PUT 修改密码
│               └── upload/          # POST 上传图片
│
├── data/                            # 运行时上传文件存储 (图片等)
├── public/                          # 静态资源 (SVG 图标)
├── content/juejin/                  # 掘金迁移的 Markdown 文件
├── scripts/fetch-juejin.mjs         # 掘金文章同步脚本
├── docs/webhook-deploy.md           # Webhook 部署文档
├── .aliyun/                         # 阿里云部署文件 (deploy.sh, webhook.js)
├── prisma/                          # 已废弃的 Prisma schema (保留参考)
│
├── package.json                     # 依赖与脚本
├── drizzle.config.ts                # Drizzle Kit 配置
├── next.config.ts                   # Next.js 配置 (关闭 devIndicators)
├── tsconfig.json                    # TS 配置 (paths: @/ → ./src/*)
├── postcss.config.mjs               # PostCSS: @tailwindcss/postcss
├── eslint.config.mjs                # ESLint: next/core-web-vitals + typescript
├── components.json                  # shadcn/ui 配置
└── .env                             # 环境变量
```

---

## 3. 数据库模型

### 3.1 数据库连接 (`src/db/index.ts`)

- 开发/生产均使用 `@libsql/client` + SQLite
- 数据库文件路径: `process.cwd() + /dev.db`
- Drizzle 实例: `export const db = drizzle(client, { schema })`

### 3.2 表结构 (`src/db/schema.ts`)

**users** — 管理员用户
| 字段 | 类型 | 说明 |
|------|------|------|
| id | integer (PK, auto) | |
| username | text (unique) | 登录用户名 |
| passwordHash | text | bcrypt 哈希 |
| nickname | text | 显示昵称 |
| email | text | 邮箱 |
| created_at/updated_at | text | CURRENT_TIMESTAMP |

**categories** — 文章分类
| 字段 | 类型 | 说明 |
|------|------|------|
| id | integer (PK, auto) | |
| name | text | 分类名 |
| slug | text (unique) | URL 标识 |
| description | text (nullable) | 分类描述 |
| sortOrder | integer | 排序权重 (default 0) |

**tags** — 文章标签
| 字段 | 类型 | 说明 |
|------|------|------|
| id | integer (PK, auto) | |
| name | text | 标签名 |
| slug | text (unique) | URL 标识 |

**posts** — 文章
| 字段 | 类型 | 说明 |
|------|------|------|
| id | integer (PK, auto) | |
| title | text | 标题 |
| slug | text (unique) | URL 标识 |
| summary | text (nullable) | 摘要 |
| content | text | Markdown 正文 |
| categoryId | integer (FK -> categories.id) | 所属分类 |
| status | text | draft / published |
| isTop | integer (boolean) | 是否置顶 |
| viewCount | integer | 阅读量 (default 0) |
| publishedAt | text (nullable) | 发布时间 |
| created_at/updated_at | text | |

**post_tags** — 文章-标签多对多
| 字段 | 类型 | 说明 |
|------|------|------|
| postId | integer (FK -> posts.id, cascade) | |
| tagId | integer (FK -> tags.id, cascade) | |
| (postId, tagId) | 复合主键 | |

**comments** — 评论
| 字段 | 类型 | 说明 |
|------|------|------|
| id | integer (PK, auto) | |
| postId | integer (FK -> posts.id, cascade) | |
| parentId | integer (nullable, 自引用 FK) | 父评论 ID |
| authorName | text | 评论者昵称 |
| authorEmail | text | 评论者邮箱 |
| content | text | 评论内容 |
| status | text | pending / approved / spam |
| ip | text (nullable) | 评论者 IP |
| created_at | text | |

**resume** — 个人简历
| 字段 | 类型 | 说明 |
|------|------|------|
| id | integer (PK, auto) | |
| content | text | Markdown 简历内容 |
| updated_at | text | |

### 3.3 关系定义
- `posts → categories`: 多对一
- `posts → postTags → tags`: 多对多
- `posts → comments`: 一对多
- `comments → parent/replies`: 自引用一对多 (relationName: "replies")

---

## 4. 认证与中间件

### 4.1 NextAuth 配置 (`src/lib/auth.ts`)
- 使用 `Credentials` Provider，从 `users` 表查询用户
- bcrypt 密码校验
- JWT 策略: token 包含 `id`，session 包含 `session.user.id`
- 登录页: `/admin/login`
- cookie 名: `authjs.session-token` 或 `__Secure-authjs.session-token`

### 4.2 中间件 (`src/middleware.ts`)
匹配路径: `/admin/:path*`, `/api/admin/:path*`, `/api/auth/:path*`

逻辑:
- `/api/auth/*` 放行
- 管理端路由: 检查 session token → 无 token 返回 401(API) 或重定向到登录页
- 已登录访问登录页 → 重定向到 `/admin`

---

## 5. API 路由一览

### 5.1 公开 API (无需认证)
| 路由 | 方法 | 说明 |
|------|------|------|
| `/api/auth/[...nextauth]` | * | NextAuth 回调 |
| `/api/posts` | GET | 文章列表 (分页、搜索、分类、标签过滤) |
| `/api/posts/[slug]/view` | POST | 阅读量递增 |
| `/api/comments` | GET/POST | 评论列表 / 提交评论 |
| `/api/categories` | GET | 分类列表 |
| `/api/tags` | GET | 标签列表 |
| `/api/resume` | GET | 简历数据 |
| `/api/uploads/[filename]` | GET | 图片文件服务 |

### 5.2 管理端 API (需认证)
| 路由 | 方法 | 说明 |
|------|------|------|
| `/api/admin/posts` | GET/POST | 全部文章 / 创建文章 |
| `/api/admin/posts/[id]` | GET/PUT/DELETE | 单文章操作 |
| `/api/admin/categories` | GET/POST | 全部分类 / 新建 |
| `/api/admin/categories/[id]` | PUT/DELETE | 编辑/删除分类 |
| `/api/admin/tags` | GET/POST | 全部标签 / 新建 |
| `/api/admin/tags/[id]` | PUT/DELETE | 编辑/删除标签 |
| `/api/admin/comments` | GET | 全部评论列表 |
| `/api/admin/comments/[id]` | PUT/DELETE | 审核/删除评论 |
| `/api/admin/resume` | PUT | 更新简历 |
| `/api/admin/settings/password` | PUT | 修改密码 |
| `/api/admin/upload` | POST | 图片上传 |

---

## 6. 页面架构与数据流

### 6.1 博客前端 (ISR + SSG)
- **首页**: ISR 60s — 服务端获取文章列表，客户端 ViewTracker 追踪阅读量
- **文章详情**: `generateStaticParams` 预生成 + ISR 3600s — 返回静态页面，ViewTracker 在客户端更新阅读量
- **分类/标签页**: 按 slug 过滤文章
- **简历页**: 渲染 resume 表 Markdown 内容
- **设置页**: 纯客户端 localStorage (主题色/外观模式)

### 6.2 管理后台 (CSR + API)
- **登录**: 客户端表单 → NextAuth signIn → session cookie → 重定向
- **Dashboard 布局**: SessionProvider + SidebarProvider
- **文章编辑**: PostEditor (表单 + MdEditor) → fetch admin API
- **图片上传**: MdEditor → POST `/api/admin/upload` → 返回 URL，存储到 `data/` 目录，由 `/api/uploads/[filename]` 服务

---

## 7. 样式与主题

### 7.1 基础样式 (`src/globals.css`)
- Tailwind CSS 4 + `@tailwindcss/typography` (prose 排版)
- `highlight.js` 代码高亮主题
- CSS 变量驱动的主题系统

### 7.2 主题系统 (`BlogShell.tsx` + `ThemeProvider.tsx`)
- 三种外观模式: light / dark / system
- 6 种主题色 (通过 CSS 变量 `--primary` 等切换)
- `.dark` class 控制暗色模式作用域
- 设置通过 localStorage 持久化

### 7.3 shadcn/ui 配置
- 风格: base-nova
- 图标: lucide-react
- 别名: `@/components`, `@/lib/utils`, `@/components/ui`, `@/hooks`

---

## 8. 部署信息

### 8.1 服务器
- 阿里云 e 实例 (2C2G, Ubuntu 22.04)
- Nginx 反向代理 → localhost:3000
- PM2 守护进程

### 8.2 部署流程
1. 本地 push → GitHub
2. GitHub Webhook → 服务器 webhook.js (localhost:3456)
3. webhook.js 执行 deploy.sh: `git pull → pnpm install → pnpm build → pm2 restart`

### 8.3 文件存储注意
- 图片上传存储到 `data/` 目录 (不在 `public/` 下，避免构建覆盖)
- 生产环境通过 `/api/uploads/[filename]` 路由读取文件

---

## 9. 遗留/废弃文件

- `prisma/schema.prisma` + `prisma/seed.ts`: 早期 Prisma ORM，已迁移到 Drizzle
- `src/lib/prisma.ts`: 仅做向后兼容导出指向 `@/db`
- `docker-compose.yml`: MySQL 配置，当前未使用 (使用 SQLite)

---

## 10. 常用命令

```bash
pnpm dev          # 开发服务器
pnpm build        # 生产构建
pnpm start        # 生产启动
pnpm lint         # ESLint 检查
npx drizzle-kit push:sqlite    # 推送 schema 到 SQLite
npx drizzle-kit generate       # 生成迁移文件
npx tsx src/db/seed.ts         # 运行种子数据
```

---

## 11. 架构要点速记

1. **数据库访问唯一入口**: `import { db } from "@/db"`，不要从 prisma 导入
2. **认证检查**: 服务端用 `auth()` (从 `@/lib/auth`)，客户端用 `useSession()`，中间件用 cookie 检查
3. **文章 slug 唯一**: posts 表和 categories 表、tags 表均依靠 slug 做 URL 路由
4. **阅读量与 ISR 分离**: 文章页面做 SSG+ISR 静态渲染，阅读量通过客户端 ViewTracker 组件单独请求
5. **图片上传**: 使用 `@uiw/react-md-editor` 的图片粘贴/拖拽功能，POST 到 `/api/admin/upload`，文件存 `data/`，通过 `/api/uploads/[filename]` 访问
6. **路径别名**: `@/` 映射到 `./src/*`
