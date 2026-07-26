# 阿里云部署指南

> 目标：将博客部署到阿里云 e 实例，绑定域名，开启 HTTPS，实现上线访问。

---

## 一、购买与准备

### 1.1 购买云服务器（e 实例）

| 配置项 | 推荐选择 |
|--------|----------|
| 地域 | 离你最近的（杭州/上海/北京） |
| 实例规格 | **2 核 2 GB**（1C1G 跑 `next build` 会卡） |
| 镜像 | **Ubuntu 22.04 LTS（64位）** |
| 系统盘 | 40 GB ESSD |
| 网络 | 按量计费或固定带宽（最低 1 Mbps 就够） |
| 登录凭证 | **密钥对**（推荐）或密码 |

> 🔥 新用户大概率有首年 ¥68-99 活动，直接拿下。

### 1.2 购买域名（可选但推荐）

在阿里云域名注册页面选购：

| 后缀 | 年费 |
|------|------|
| `.com` | ¥70-80 |
| `.cn` | ¥30 |
| `.top` | ¥10-20 |

买完后先不管配置，后面会讲。

### 1.3 安全组配置（⚠️ 重要）

购买 e 实例时/后，在控制台 → 安全组 → 入方向规则，添加：

| 端口 | 协议 | 来源 | 用途 |
|------|------|------|------|
| 22 | TCP | 0.0.0.0/0 | SSH 登录 |
| 80 | TCP | 0.0.0.0/0 | HTTP |
| 443 | TCP | 0.0.0.0/0 | HTTPS |

---

## 二、服务器初始化

SSH 登录到你的服务器：

```bash
ssh root@<你的公网IP>
```

### 2.1 系统更新

```bash
apt update && apt upgrade -y
```

### 2.2 安装基础工具

```bash
apt install -y curl git ufw nginx
```

### 2.3 配置防火墙

```bash
ufw allow 22
ufw allow 80
ufw allow 443
ufw enable
```

### 2.4 安装 Node.js 22（推荐用 NodeSource）

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt install -y nodejs

# 验证
node -v   # 应显示 v22.x.x
npm -v
```

### 2.5 安装 pnpm

```bash
npm install -g pnpm
```

### 2.6 安装 PM2（进程守护）

```bash
npm install -g pm2
pm2 startup systemd   # 设置开机自启（运行后会输出一行命令，复制执行）
```

---

## 三、部署项目

### 3.1 创建目录并克隆代码

```bash
mkdir -p /var/www
cd /var/www
git clone <你的Git仓库地址>
cd blog
```

### 3.2 安装依赖

```bash
pnpm install
```

### 3.3 创建环境变量

```bash
# 生成随机 AUTH_SECRET（32位+）
openssl rand -hex 32
# 复制输出，下面会用到
```

```bash
cat > .env << 'EOF'
# 数据库 — 使用 SQLite（无需安装 MySQL）
DATABASE_URL="file:./dev.db"

# NextAuth 认证
AUTH_SECRET="粘贴上面 openssl 生成的随机字符串"
AUTH_URL="https://你的域名（若暂未绑定域名，先填 http://你的公网IP）"

# SMTP 评论通知（可选，不填也能跑但收不到新评论通知）
SMTP_HOST=smtp.qq.com
SMTP_PORT=465
SMTP_USER=你的QQ邮箱
SMTP_PASS=QQ邮箱授权码
NOTIFY_EMAIL=你的QQ邮箱
EOF
```

> **关于数据库**：当前项目用的是 **SQLite**，一个文件就搞定，不需要安装 MySQL。如果你以后想切 MySQL，docker-compose.yml 已经准备好了。

### 3.4 初始化数据库（种子数据）

```bash
pnpm tsx src/db/seed.ts
```

这会创建：
- 管理员账号：`admin` / `admin123`
- 示例分类、标签、文章
- 示例简历

### 3.5 构建

```bash
pnpm build
```

### 3.6 启动服务

```bash
pm2 start pnpm --name blog -- start
pm2 save   # 保存进程列表，重启后自动恢复
```

验证：

```bash
curl http://localhost:3000
# 应该返回 HTML（首页内容）
```

---

## 四、Nginx 反向代理 + HTTPS

### 4.1 创建 Nginx 配置

```bash
cat > /etc/nginx/sites-available/blog << 'EOF'
server {
    listen 80;
    server_name _;   # 后续改为你的域名

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

    # 静态资源缓存
    location /_next/static {
        proxy_pass http://127.0.0.1:3000;
        proxy_cache_valid 200 30d;
        add_header Cache-Control "public, immutable";
    }
}
EOF
```

### 4.2 启用配置

```bash
ln -sf /etc/nginx/sites-available/blog /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default   # 删除默认配置
nginx -t   # 检查配置是否正确
systemctl restart nginx
```

现在浏览器访问 `http://<你的公网IP>` 应该能看到博客了。

---

## 五、域名 + HTTPS

### 5.1 域名 DNS 解析

阿里云控制台 → 域名 → 解析设置 → 添加记录：

| 记录类型 | 主机记录 | 记录值 |
|----------|----------|--------|
| A | @ | 你的服务器公网 IP |
| A | www | 你的服务器公网 IP |

等几分钟 DNS 生效后，`http://你的域名` 就能访问了。

### 5.2 修改项目环境变量

```bash
cd /var/www/blog
# 编辑 .env，将 AUTH_URL 改为：
# AUTH_URL="https://你的域名"
pnpm build   # 重新构建
pm2 restart blog
```

### 5.3 安装免费 SSL（Let's Encrypt）

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d 你的域名 -d www.你的域名
```

按提示操作（输入邮箱，选 redirect HTTP → HTTPS），完成后自动续期：

```bash
certbot renew --dry-run   # 测试自动续期是否正常
```

### 5.4 更新 Nginx 配置

Certbot 会自动修改 Nginx 配置添加 SSL。确认一下：

```bash
cat /etc/nginx/sites-available/blog | grep ssl
```

---

## 六、部署后检查清单

- [ ] `http://你的IP` → 能看到博客首页
- [ ] `https://你的域名` → 能访问且有 🔒 图标
- [ ] `/admin/login` → 管理后台登录页正常
- [ ] 用 `admin / <你的密码>` 登录管理后台
- [ ] **立即修改管理员密码**（后台 → 系统设置）
- [ ] 评论功能正常（可选：配置 SMTP 后测试邮件通知）

---

## 七、版本升级操作

后续更新代码时，SSH 登录服务器执行：

```bash
cd /var/www/blog
git pull
pnpm install
pnpm build
pm2 restart blog
```

---

## 八、费用总结

| 项目 | 首年 | 续费/年 |
|------|------|---------|
| e 实例 2C2G | ¥68-99 | ¥500-700 |
| .com 域名 | ¥70-80 | ¥70-80 |
| SSL 证书 | 免费 | 免费 |
| **合计** | **¥140-180** | **¥570-780** |

---

> 部署顺利！有问题随时问。
