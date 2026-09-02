#!/usr/bin/env bash

set -euo pipefail

readonly PROFILE_NAME="${DSH_PROFILE:-web}"
readonly BETTER_SIDEBAR_SPEC="dsh-better-sidebar@0.17.1"
readonly QCC_OAUTH_SPEC="qcc-dsh-mcp-oauth@0.1.7"
readonly PREVISIT_SPEC="${QCC_PREVISIT_SPEC:-github:JinhangShi/qcc-previsit-dsh#main}"

info() {
  printf '\n[qcc-previsit] %s\n' "$1"
}

fail() {
  printf '\n[qcc-previsit] 安装失败：%s\n' "$1" >&2
  exit 1
}

command -v node >/dev/null 2>&1 || fail "未找到 Node.js，请先安装 Node.js 20 或更高版本。"
command -v pnpm >/dev/null 2>&1 || fail "未找到 pnpm。请先执行 corepack enable，或安装 pnpm。"
command -v dsh >/dev/null 2>&1 || fail "未找到 dsh。请先安装 DeepSeek Harness。"

readonly NODE_MAJOR="$(node -p "Number(process.versions.node.split('.')[0])")"
if (( NODE_MAJOR < 20 )); then
  fail "当前 Node.js 主版本为 ${NODE_MAJOR}，本插件要求 Node.js 20 或更高版本。"
fi

info "检测到 Node.js $(node --version)，DSH $(dsh --version)，目标 profile：${PROFILE_NAME}。"

info "1/3 安装 Better Sidebar（工作台容器）"
dsh plugin --profile "${PROFILE_NAME}" add "${BETTER_SIDEBAR_SPEC}" --allow-build=node-pty

info "2/3 安装企查查 OAuth（自动挂载企业数据 MCP）"
dsh plugin --profile "${PROFILE_NAME}" add "${QCC_OAUTH_SPEC}"

info "3/3 安装访前尽调工作台"
dsh plugin --profile "${PROFILE_NAME}" add "${PREVISIT_SPEC}" --allow-build=qcc-previsit-dsh

info "安装完成。请停止正在运行的 DSH Web，然后重新执行：dsh web"
printf '%s\n' \
  "首次启动会自动打开企查查授权页。若未弹出，请在对话中输入：连接企查查" \
  "进入任意工作空间和 Session 后，可从侧栏或对话输入框旁打开“访前尽调”。"
