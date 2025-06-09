#!/bin/bash

# Docker清理脚本 - 释放磁盘空间
echo "🧹 Docker清理工具"
echo "=================="

# 显示当前Docker占用空间
echo "📊 当前Docker占用空间:"
docker system df

echo ""
echo "🗑️  开始清理..."

# 1. 清理停止的容器
echo "1️⃣  清理停止的容器..."
docker container prune -f

# 2. 清理悬空镜像
echo "2️⃣  清理悬空镜像..."
docker image prune -f

# 3. 清理无用的网络
echo "3️⃣  清理无用的网络..."
docker network prune -f

# 4. 清理无用的卷
echo "4️⃣  清理无用的卷..."
docker volume prune -f

# 5. 清理构建缓存
echo "5️⃣  清理构建缓存..."
docker builder prune -f

# 6. 可选：清理所有未使用的镜像
read -p "是否清理所有未使用的镜像? (这会删除所有未被容器使用的镜像) (y/N): " confirm
if [[ $confirm == [yY] || $confirm == [yY][eE][sS] ]]; then
    echo "6️⃣  清理所有未使用的镜像..."
    docker image prune -a -f
fi

# 7. 显示清理后的空间
echo ""
echo "✅ 清理完成！"
echo "📊 清理后Docker占用空间:"
docker system df

echo ""
echo "💡 提示:"
echo "   - 如需彻底清理，可运行: docker system prune -a --volumes"
echo "   - 如需清理特定项目镜像，可运行: docker images | grep adh" 