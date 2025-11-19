# 使用官方的 Node.js 22 作为基础镜像
FROM node:22
# --- 环境配置 ---
# 设置环境变量，支持中文显示和输入
ENV LANG C.UTF-8
ENV LANGUAGE C.UTF-8
ENV LOCALE zh-CN
# 关键：定义插件市场的环境变量。code-server 进程会自动读取它们！
ENV SERVICE_URL=https://marketplace.visualstudio.com/_apis/public/gallery
ENV ITEM_URL=https://marketplace.visualstudio.com/items
# 定义插件列表，便于后续维护和增删
ENV VSCODE_EXTENSIONS=" \
    redhat.vscode-yaml \
    dbaeumer.vscode-eslint \
    waderyan.gitblame \
    mhutchie.git-graph \
    donjayamanne.githistory \
    tencent-cloud.coding-copilot \
    formulahendry.code-runner \
    WallabyJs.console-ninja \
    usernamehw.errorlens \
    esbenp.prettier-vscode \
    bradlc.vscode-tailwindcss \
    wayou.vscode-todo-highlight \
    gruntfuggly.todo-tree \
    eamodio.gitlens \
    lokalise.i18n-ally \
    steoates.autoimport \
    rvest.vs-code-prettier-eslint \
    naumovs.color-highlight \
    britesnow.vscode-toggle-quotes \
    "
# --- 系统和软件安装 ---
RUN set -ex; \
    # 更新包列表并安装依赖
    apt-get update && \
    apt-get install -y --no-install-recommends \
    build-essential \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    fonts-wqy-zenhei \
    fonts-wqy-microhei \
    fonts-noto-cjk \
    fonts-noto-extra \
    wget \
    unzip \
    openssh-server \
    git \
    # 清理 apt 缓存，减小镜像体积
    && apt-get clean && rm -rf /var/lib/apt/lists/* \
    \
    # 安装 code-server
    && curl -fsSL https://code-server.dev/install.sh | sh \
    \
    # --- 插件安装核心逻辑 ---
    # 直接运行安装命令即可，它会自动使用上面定义的 ENV 环境变量
    && for extension in ${VSCODE_EXTENSIONS}; do \
        echo "--> Installing extension: $extension"; \
        code-server --install-extension "$extension"; \
    done \
    \
    && echo "✅ All extensions installed successfully from Microsoft Marketplace."