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
    ms-ceintl.vscode-language-pack-zh-hans \
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
    \
    # --- 配置默认语言为中文---
    # 1. 为即将运行的 coder 用户创建配置目录
    && mkdir -p /root/.local/share/code-server/User \
    # 2. 写入语言配置到 settings.json 文件中
    && echo '{"locale":"zh-cn"}' > /root/.local/share/code-server/User/argv.json \
    # 3. 清理插件缓存，强制 code-server 在启动时重新扫描插件，解决语言包不显示的问题
    && rm -rf /root/.local/share/code-server/extensions/extensions.json \
    && rm -rf /root/.local/share/code-server/CachedExtensionVSIXs \
    && code-server --list-extensions \
    && echo "✅ All extensions installed successfully."