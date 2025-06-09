# 开发环境 - Python后端热更新
FROM registry.cn-hangzhou.aliyuncs.com/awesome-digital-human/python:3.12.1-slim

WORKDIR /workspace

# 使用阿里云源
RUN sed -i 's/deb.debian.org/mirrors.aliyun.com/g' /etc/apt/sources.list.d/debian.sources && \
    sed -i 's/security.debian.org/mirrors.aliyun.com/g' /etc/apt/sources.list.d/debian.sources

# 安装依赖
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# 先复制requirements安装Python依赖
COPY requirements.txt ./

# 配置pip源并安装依赖
RUN pip config set global.index-url https://mirrors.aliyun.com/pypi/simple/ \
    && pip config set global.trusted-host mirrors.aliyun.com \
    && pip install --no-cache-dir -r requirements.txt

# 开发模式 - 代码通过volume挂载，支持热更新
EXPOSE 8000

# 默认命令
CMD ["python", "main.py"] 