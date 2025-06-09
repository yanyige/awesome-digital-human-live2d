# 使用项目原本的阿里云镜像
FROM registry.cn-hangzhou.aliyuncs.com/awesome-digital-human/node:alpine3.19

# 添加代码
ADD web/ /workspace
WORKDIR /workspace

# npm换源
RUN npm config set registry https://registry.npmmirror.com

# 使用阿里云Alpine源
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' /etc/apk/repositories

# 只安装必要的依赖
RUN apk add --no-cache python3 make gcc g++

# 清理并安装依赖
RUN rm -rf node_modules .next \
    && npm install -g pnpm \
    && pnpm install --frozen-lockfile \
    && pnpm run build

ENTRYPOINT ["pnpm", "run", "start"]