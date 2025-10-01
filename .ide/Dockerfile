FROM node:22

# 安装依赖
RUN apt-get update
RUN apt-get install -y build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev
# 安装中文字体
RUN apt-get install -y fonts-wqy-zenhei fonts-wqy-microhei fonts-noto-cjk fonts-noto-extra

# 安装 code-server 和 vscode 常用插件
RUN curl -fsSL https://code-server.dev/install.sh | sh \
  && code-server --install-extension cnbcool.cnb-welcome \
  && code-server --install-extension redhat.vscode-yaml \
  && code-server --install-extension dbaeumer.vscode-eslint \
  && code-server --install-extension waderyan.gitblame \
  && code-server --install-extension mhutchie.git-graph \
  && code-server --install-extension donjayamanne.githistory \
  && code-server --install-extension tencent-cloud.coding-copilot \
  && code-server --install-extension MS-CEINTL.vscode-language-pack-zh-hans \
  && code-server --install-extension formulahendry.code-runner \
  && code-server --install-extension WallabyJs.console-ninja \
  && code-server --install-extension usernamehw.errorlens \
  && code-server --install-extension esbenp.prettier-vscode \
  && code-server --install-extension bradlc.vscode-tailwindcss \
  && code-server --install-extension wayou.vscode-todo-highlight \
  && code-server --install-extension Gruntfuggly.todo-tree \
  && code-server --install-extension Vue.volar \
  && code-server --install-extension sdras.vue-vscode-snippets \
  && code-server --install-extension hollowtree.vue-snippets \
  && code-server --install-extension eamodio.gitlens \
  && code-server --install-extension bradlc.vscode-tailwindcss \
  && echo done

# 安装 ssh 服务，用于支持 VSCode 等客户端通过 Remote-SSH 访问开发环境
RUN apt-get update && apt-get install -y wget unzip openssh-server

# 指定字符集支持命令行输入中文（根据需要选择字符集）
ENV LANG C.UTF-8
ENV LANGUAGE C.UTF-8