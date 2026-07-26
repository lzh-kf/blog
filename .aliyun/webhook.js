/**
 * 轻量级 Git Webhook 服务
 * 只监听 127.0.0.1，通过 Nginx 反代走 HTTPS
 *
 * 使用：pm2 start .aliyun/webhook.js --name webhook
 * 密钥：通过 WEBHOOK_SECRET 环境变量设置
 */

const http = require("http");
const { execSync } = require("child_process");
const crypto = require("crypto");

const PORT = 3456;
const HOST = "127.0.0.1";
const SECRET = process.env.WEBHOOK_SECRET || "change-me";
const PROJECT_DIR = "/var/www/blog";
const PM2_APP = "blog";

function deploy() {
  const log = (msg) => console.log(`[${new Date().toISOString()}] ${msg}`);

  try {
    log("拉取代码...");
    execSync("git pull", { cwd: PROJECT_DIR, stdio: "inherit" });

    log("安装依赖...");
    execSync("pnpm install", { cwd: PROJECT_DIR, stdio: "inherit" });

    log("构建项目...");
    execSync("pnpm build", { cwd: PROJECT_DIR, stdio: "inherit" });

    log("重启服务...");
    execSync(`pm2 restart ${PM2_APP}`, { stdio: "inherit" });

    log("✅ 部署完成");
    return true;
  } catch (e) {
    log(`❌ 部署失败: ${e.message}`);
    return false;
  }
}

http
  .createServer((req, res) => {
    if (req.method !== "POST" || req.url !== "/deploy") {
      res.writeHead(404);
      return res.end("Not Found");
    }

    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      // 验证签名（GitHub 用 x-hub-signature-256，Gitee 用 x-gitee-token）
      const sig = req.headers["x-hub-signature-256"]
        || req.headers["x-gitee-token"];
      if (sig) {
        const expected =
          "sha256=" + crypto.createHmac("sha256", SECRET).update(body).digest("hex");
        if (sig !== expected && sig !== SECRET) {
          res.writeHead(403);
          return res.end("Invalid Signature");
        }
      }

      res.writeHead(200);
      res.end("OK");

      // 异步执行部署，不阻塞响应
      deploy();
    });
  })
  .listen(PORT, HOST, () => {
    console.log(`Webhook 已启动: http://${HOST}:${PORT}/deploy`);
  });
