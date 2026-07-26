#!/bin/bash
# 阿里云云效部署脚本
# 使用方法：在云效流水线中配置"主机部署"步骤，指向此脚本

set -e

PROJECT_DIR="/var/www/blog"
PM2_APP_NAME="blog"

echo "📦 进入项目目录..."
cd $PROJECT_DIR

echo "⬇️  拉取最新代码..."
git pull

echo "📥 安装依赖..."
pnpm install

echo "🔨 构建项目..."
pnpm build

echo "🚀 重启服务..."
pm2 restart $PM2_APP_NAME

echo "✅ 部署完成！"
