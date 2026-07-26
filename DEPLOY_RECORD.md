# 博客部署全记录：从购买到上线

> 日期：2026-07-26  
> 服务器：阿里云 e 实例 2C2G，华南 3（广州），Ubuntu 22.04  
> 博客：Next.js 16 + Drizzle ORM + SQLite + shadcn/ui  
> 公网 IP：<你的公网IP>

---

## 一、购买云服务器

| 选项 | 选择 |
|------|------|
| 产品 | 阿里云 **e 实例**（个人开发者必选） |
| 地域 | **华南 3**（广州，广东用户最优） |
| 规格 | **2 核 2 GB**（1C1G 不够用） |
| 镜像 | **Ubuntu 22.04 LTS（64位）** |
| 系统盘 | 40 GB ESSD |
| 登录方式 | 默认（密钥对，后可重置为密码） |

> 新用户首年约 ¥68-99。域名可选（`.com` 约 ¥70/年），暂未购买。

---

## 二、服务器初始化

### 2.1 SSH 登录

```bash
ssh root@<你的公网IP>
```

> ⚠️ 首次登录遇到 `Permission denied (publickey)`——阿里云默认密钥对登录，没有密钥文件。  
> **解决**：阿里云控制台 → ECS 实例 → 重置实例密码 → 重启实例，然后用密码登录。

### 2.2 系统更新 + 基础工具

```bash
apt update && apt upgrade -y
apt install -y curl git ufw nginx sqlite3 build-essential
```

### 2.3 防火墙（安全组）

**阿里云控制台侧**：安全组 → 入方向 → 手动添加：

| 端口 | 协议 | 来源 | 用途 |
|------|------|------|------|
| 22 | TCP | 0.0.0.0/0 | SSH |
| 80 | TCP | 0.0.0.0/0 | HTTP |
| 443 | TCP | 0.0.0.0/0 | HTTPS |

**服务器侧**（可选，双重保障）：

```bash
ufw allow 22
ufw allow 80
ufw allow 443
ufw enable
```

---

## 三、安装 Node.js（⚠️ 重点）

### 3.1 初次尝试失败

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
# → 阿里云服务器访问 GitHub/NodeSource 不稳定，无输出
```

```bash
apt install -y nodejs
# → 同样失败
```

### 3.2 最终方案：国内镜像直接下载二进制包

```bash
wget https://npmmirror.com/mirrors/node/v22.11.0/node-v22.11.0-linux-x64.tar.xz
tar -xf node-v22.11.0-linux-x64.tar.xz
mv node-v22.11.0-linux-x64 /usr/local/node
echo 'export PATH=/usr/local/node/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
node -v   # v22.11.0 ✅
```

### 3.3 npm 换淘宝镜像 + 安装 pnpm / PM2

```bash
npm config set registry https://registry.npmmirror.com
npm install -g pnpm
npm install -g pm2
```

---

## 四、部署项目

### 4.1 拉取代码

```bash
mkdir -p /var/www && cd /var/www
git clone <你的Git仓库地址>
cd blog
```

### 4.2 安装依赖（⚠️ 重点）

```bash
pnpm install
# → better-sqlite3 编译报错：node-gyp 下载 header 超时
```

**解决**：设置 Node.js header 镜像后重试。

```bash
export NODEJS_ORG_MIRROR=https://npmmirror.com/mirrors/node
pnpm install   # 成功 ✅
```

### 4.3 数据库驱动崩溃（⚠️ 最坑）

```bash
pnpm tsx src/db/seed.ts
# → 无输出，静默失败
```

**排查**：

```bash
node -e "const Database = require('better-sqlite3'); new Database('dev.db');"
# → Segmentation fault (core dumped)
```

**原因**：`better-sqlite3` 是 C++ 原生模块，与阿里云 e 实例的内核存在兼容性问题，无法正常运行。

**解决**：更换为纯 JS 实现的 SQLite 驱动 `@libsql/client`。

本地修改代码：

- `src/db/index.ts`：`better-sqlite3` → `@libsql/client`
- `src/db/seed.ts`：同上
- `package.json`：替换依赖
- **所有 API 路由**：补充 `await`（`@libsql/client` 是异步驱动，19 处 `.run()` 和 1 处 `.all()` 需要加 `await`）
- `generateStaticParams` 移除：libsql 不兼容多 worker 并发构建，改为 `force-dynamic`

提交推送 → 服务器拉取：

```bash
git pull origin master
pnpm install
npx drizzle-kit push   # 创建表结构，提示时输入 y
pnpm tsx src/db/seed.ts   # 初始化种子数据
pnpm build   # 构建成功 ✅
```

---

## 五、启动服务

### 5.1 PM2 守护进程

```bash
pm2 start pnpm --name blog -- start
pm2 save
```

| 命令 | 作用 |
|------|------|
| `pm2 list` | 查看运行状态 |
| `pm2 logs blog` | 查看日志 |
| `pm2 restart blog` | 重启 |
| `pm2 stop blog` | 停止 |

### 5.2 Nginx 反向代理

```bash
cat > /etc/nginx/sites-available/blog << 'EOF'
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF
```

```bash
ln -sf /etc/nginx/sites-available/blog /etc/nginx/sites-enabled/blog
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl restart nginx
```

### 5.3 502 问题排查

访问 `http://<你的公网IP>` 显示 Nginx 欢迎页 → 502。

**原因**：`sites-enabled/blog` 符号链接未成功创建，目录为空。

```bash
ls -la /etc/nginx/sites-enabled/   # 确认目录为空后重新链接
ln -sf /etc/nginx/sites-available/blog /etc/nginx/sites-enabled/blog
systemctl restart nginx
# → 博客首页正常显示 ✅
```

---

## 六、最终状态

| 检查项 | 状态 |
|--------|------|
| 博客首页 `http://<你的公网IP>` | ✅ |
| 管理后台 `http://<你的公网IP>/admin` | ✅ |
| 管理员账号 `admin / <你的密码>` | 需改密码 |
| 域名绑定 | ⬜ 待购买 |
| HTTPS | ⬜ 待域名购买后配置 |

---

## 七、维护速查

### 更新部署代码

```bash
cd /var/www/blog
git pull origin master
pnpm install
pnpm build
pm2 restart blog
```

### 本地开发

```bash
pnpm dev
# → http://localhost:3000
```

### 本地构建验证（不改线上）

```bash
pnpm build
```

---

## 八、费用

| 项目 | 首年 | 续费/年 |
|------|------|---------|
| 阿里云 e 实例 2C2G | ¥68-99 | ¥500-700 |
| .com 域名（可选） | ¥70-80 | ¥70-80 |
| SSL 证书 | 免费 | 免费 |
| **合计** | **¥68-180** | **¥500-780** |

---

## 九、关键踩坑总结

| 坑 | 原因 | 解决 |
|-----|------|------|
| SSH 无法登录 | 默认密钥对，没下载密钥 | 控制台重置密码 |
| Node.js 装不上 | 阿里云访问 GitHub/NodeSource 被墙 | 用 npmmirror 镜像直接下载二进制包 |
| npm 装不了包 | npm registry 被墙 | 换成淘宝镜像 `registry.npmmirror.com` |
| node-gyp 编译超时 | 下载 Node header 被墙 | 设置 `NODEJS_ORG_MIRROR` 环境变量 |
| better-sqlite3 段错误 | 原生模块与 e 实例内核不兼容 | 换成 `@libsql/client`（纯 JS） |
| 所有 `.run()` 没 `await` | `better-sqlite3` 是同步的，`libsql` 是异步的 | 全局加 `await`（19 处） |
| 构建时数据库锁 | libsql 不支持多 worker 并发 | `generateStaticParams` 改为 `force-dynamic` |
| 公网 502 | Nginx site 符号链接未生效 | 确认 `sites-enabled/blog` 存在后重启 |
