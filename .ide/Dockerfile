# 使用官方的 Node.js 22 作为基础镜像
FROM node:22
# --- 环境配置 ---
ENV LANG C.UTF-8
ENV LANGUAGE C.UTF-8
ENV LOCALE zh-CN
ENV SERVICE_URL=https://marketplace.visualstudio.com/_apis/public/gallery
ENV ITEM_URL=https://marketplace.visualstudio.com/items
# 定义插件列表
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
    # 安装系统依赖
    apt-get update && \
    apt-get install -y --no-install-recommends \
    build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev \
    fonts-wqy-zenhei fonts-wqy-microhei fonts-noto-cjk fonts-noto-extra \
    wget unzip openssh-server git \
    && apt-get clean && rm -rf /var/lib/apt/lists/* \
    \
    # 安装 code-server
    && curl -fsSL https://code-server.dev/install.sh | sh \
    \
    # 安装所有插件
    && for extension in ${VSCODE_EXTENSIONS}; do \
        echo "--> Installing extension: $extension"; \
        code-server --install-extension "$extension"; \
    done \
    && echo "✅ All extensions installed successfully."