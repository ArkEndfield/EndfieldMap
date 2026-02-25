#!/bin/bash
set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}========== 发布流程 ==========${NC}\n"

# 1. 检查工作区是否干净
if [ -n "$(git status --porcelain)" ]; then
  echo -e "${YELLOW}⚠ 工作区有未提交的变更：${NC}"
  git status --short
  echo ""
  read -p "是否先暂存这些变更再继续？(y/n) " -n 1 -r
  echo ""
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    git stash
    echo -e "${GREEN}已暂存变更${NC}\n"
    STASHED=1
  else
    echo -e "${RED}请先处理未提交的变更${NC}"
    exit 1
  fi
fi

# 2. 运行 changeset 交互式选择
echo -e "${GREEN}[1/4] 创建 changeset...${NC}\n"
pnpm changeset

# 检查是否有新的 changeset 文件生成
if [ -z "$(git status --porcelain .changeset/)" ]; then
  echo -e "${YELLOW}未创建新的 changeset，流程终止${NC}"
  if [ "$STASHED" = "1" ]; then
    git stash pop
  fi
  exit 0
fi

# 3. 消费 changeset，更新版本号
echo -e "\n${GREEN}[2/4] 更新版本号...${NC}\n"
pnpm changeset version

# 4. 显示变更概览
echo -e "\n${GREEN}[3/4] 变更概览：${NC}\n"
git status --short
echo ""

# 5. 输入 commit 信息并提交
DEFAULT_MSG="chore: version packages"
read -p "请输入 commit 信息 (回车使用默认: ${DEFAULT_MSG}): " COMMIT_MSG
COMMIT_MSG=${COMMIT_MSG:-$DEFAULT_MSG}

git add .
git commit -m "$COMMIT_MSG"

# 6. 推送
echo -e "\n${GREEN}[4/4] 推送到远程...${NC}\n"
git push

echo -e "\n${GREEN}========== 完成 ==========${NC}"
echo -e "版本已更新并推送，前往 CNB 点击「发布 npm 包」按钮完成发布"

# 恢复暂存
if [ "$STASHED" = "1" ]; then
  echo -e "\n${YELLOW}正在恢复之前暂存的变更...${NC}"
  git stash pop
fi
