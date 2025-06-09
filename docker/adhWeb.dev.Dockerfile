# 开发环境 - 只安装依赖，支持热更新
FROM registry.cn-hangzhou.aliyuncs.com/awesome-digital-human/node:alpine3.19

WORKDIR /workspace

# npm换源
RUN npm config set registry https://registry.npmmirror.com

# 使用阿里云Alpine源
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' /etc/apk/repositories

# 只安装必要的依赖
RUN apk add --no-cache python3 make gcc g++

# 先复制package文件安装依赖
COPY web/package.json web/pnpm-lock.yaml* ./

# 安装依赖
RUN npm install -g pnpm \
    && pnpm install --frozen-lockfile

# 开发模式 - 代码通过volume挂载，支持热更新
EXPOSE 3000

# 默认命令，可以被docker-compose覆盖
CMD ["pnpm", "run", "dev"] 