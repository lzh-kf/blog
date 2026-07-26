# Webhook 自动部署流程文档

## 架构总览

```
GitHub push → GitHub Webhook → 阿里云服务器 (Nginx → Webhook 服务 → 部署脚本 → PM2 重启)
```

| 组件 | 位置 | 作用 |
|------|------|------|
| Webhook 服务 | `.aliyun/webhook.js` | 接收 GitHub 推送通知，验证签名，触发部署 |
| 部署脚本 | `.aliyun/deploy.sh` | `git pull` → `pnpm install` → `pnpm build` → `pm2 restart` |
| PM2 | 服务器 | 进程管理，守护 blog 和 webhook 两个服务 |
| Nginx | 服务器 | 反向代理，HTTPS → 本地 webhook 端口 |

---

## 完整流程

### 第一步：本地推送代码

```bash
git add .
git commit -m "feat: xxx"
git push origin master
```

### 第二步：GitHub 触发 Webhook

GitHub 收到 push 后，向 Webhook URL 发送 POST 请求：

```
POST https://你的域名/deploy
Headers:
  X-Hub-Signature-256: sha256=<HMAC签名>
Body:
  { "ref": "refs/heads/master", ... }
```

GitHub 仓库 → **Settings** → **Webhooks** 中配置。

### 第三步：Nginx 转发

Nginx 将 HTTPS 请求转发到本地 Webhook 服务：

```nginx
# 示例配置
location /deploy {
    proxy_pass http://127.0.0.1:3456;
}
```

### 第四步：Webhook 验证签名

[`.aliyun/webhook.js`](../.aliyun/webhook.js) 做三件事：

1. **读取密钥** — 优先读环境变量 `WEBHOOK_SECRET`，其次读 `.env` 文件
2. **验证签名** — 用 HMAC-SHA256 对比 `X-Hub-Signature-256`，防止伪造请求
3. **异步部署** — 验证通过后立即返回 `200 OK`，部署在后台执行（避免 GitHub 超时）

```
请求 → 验证签名 → 通过 → 返回 200 → 异步执行 deploy()
              → 失败 → 返回 403
```

### 第五步：执行部署

`deploy()` 函数顺序执行：

```bash
git pull              # 拉取最新代码
pnpm install          # 安装新依赖
pnpm build            # 构建 Next.js 项目
pm2 restart blog      # 重启应用服务
```

### 第六步：服务恢复

PM2 重启 `blog` 应用后，Next.js 加载新构建的页面，部署完成。

---

## 服务器目录结构

```
/var/www/blog/
├── .env                    # 环境变量（手动维护，不入 Git）
├── .aliyun/
│   ├── webhook.js          # Webhook 服务入口
│   └── deploy.sh           # 备用部署脚本
├── src/                    # 源码（Git 管理）
├── .next/                  # 构建产物
├── node_modules/           # 依赖
└── dev.db                  # SQLite 数据库
```

---

## 启动命令

```bash
# Webhook 服务
pm2 start .aliyun/webhook.js --name webhook

# Blog 应用（首次）
pm2 start pnpm --name blog -- start

# 查看状态
pm2 status

# 查看日志
pm2 logs webhook   # Webhook 日志
pm2 logs blog      # 应用日志
pm2 logs           # 全部日志
```

---

## 密钥配置

### GitHub 端

Webhook Secret 需要和服务器一致：

1. GitHub 仓库 → **Settings** → **Webhooks**
2. **Secret** 字段填入密钥
3. **Payload URL**: `https://你的域名/deploy`
4. **Content type**: `application/json`

### 服务器端

在 `/var/www/blog/.env` 中添加：

```env
WEBHOOK_SECRET=你的密钥
```

Webhook 服务启动时会自动读取。

---

## 故障排查

| 问题 | 检查 |
|------|------|
| GitHub 显示 Webhook 发送失败 | 检查服务器是否可达、Nginx 是否正常 |
| 签名验证失败 (403) | 检查 GitHub Secret 和服务器 `WEBHOOK_SECRET` 是否一致 |
| 代码拉取成功但未生效 | 检查 `pm2 restart blog` 是否执行、构建是否报错 |
| 查看详细日志 | `pm2 logs webhook` |

---

## 注意

- `.env` 在 `.gitignore` 中，不会通过 Git 部署。服务器上的 `.env` 需要**手动维护**（SSH 上去编辑）
- Webhook 监听 `127.0.0.1:3456`，仅本地访问，由 Nginx 反代
- 部署是异步的，GitHub 那边不会等它完成就收到 200 响应
