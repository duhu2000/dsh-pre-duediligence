#!/usr/bin/env bash

set -euo pipefail

readonly PROFILE_NAME="${DSH_PROFILE:-web}"
readonly BETTER_SIDEBAR_SPEC="dsh-better-sidebar@0.17.1"
readonly MCP_CONNECTOR_SPEC="dsh-mcp-connector@0.2.32"
readonly PREVISIT_SPEC="${DSH_PRE_DUEDILIGENCE_SPEC:-dsh-pre-duediligence@0.1.1}"
readonly LEGACY_PREVISIT_NAME="qcc-previsit-dsh"
readonly LEGACY_QCC_OAUTH_NAME="qcc-dsh-mcp-oauth"

info() {
  printf '\n[dsh-pre-duediligence] %s\n' "$1"
}

fail() {
  printf '\n[dsh-pre-duediligence] 安装失败：%s\n' "$1" >&2
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

readonly INSTALLED_PLUGINS="$(dsh plugin --profile "${PROFILE_NAME}" list --depth 0 2>/dev/null || true)"
if [[ "${INSTALLED_PLUGINS}" == *"${LEGACY_PREVISIT_NAME}@"* ]]; then
  fail "检测到旧包 ${LEGACY_PREVISIT_NAME}。为避免重复注册智能体，请先执行：dsh plugin --profile ${PROFILE_NAME} remove ${LEGACY_PREVISIT_NAME}"
fi
if [[ "${INSTALLED_PLUGINS}" == *"${LEGACY_QCC_OAUTH_NAME}@"* ]]; then
  readonly LEGACY_QCC_OAUTH_PRESENT=true
else
  readonly LEGACY_QCC_OAUTH_PRESENT=false
fi

info "1/3 安装 Better Sidebar（工作台容器）"
dsh plugin --profile "${PROFILE_NAME}" add "${BETTER_SIDEBAR_SPEC}" --allow-build=node-pty

info "2/3 安装 MCP 连接器（通过市场连接企查查等 MCP）"
dsh plugin --profile "${PROFILE_NAME}" add "${MCP_CONNECTOR_SPEC}"

info "3/3 安装访前尽调工作台"
dsh plugin --profile "${PROFILE_NAME}" add "${PREVISIT_SPEC}" --allow-build=dsh-pre-duediligence

info "安装完成。请停止正在运行的 DSH Web，然后重新执行：dsh web"
if [[ "${LEGACY_QCC_OAUTH_PRESENT}" == true ]]; then
  printf '%s\n' \
    "检测到旧插件 ${LEGACY_QCC_OAUTH_NAME}。重启后先在“🧩 MCP连接器”中迁移旧企查查授权。" \
    "迁移完成后停止 DSH，执行：dsh plugin --profile ${PROFILE_NAME} remove ${LEGACY_QCC_OAUTH_NAME}" \
    "再次启动 DSH，并在“企查查·企业工商”中确认连接健康；不要让两个插件同时管理同名 MCP Server。"
else
  printf '%s\n' \
    "重启后打开左侧“🧩 MCP连接器”，选择“企查查·企业工商”并完成 OAuth 授权。" \
    "该连接会提供企业、风险、知产、经营、历史和董监高 MCP。"
fi
printf '%s\n' "在 DSH 左侧菜单点击“访前尽调智能体”即可打开；右侧标签菜单不再显示该入口，未点击时不会改动原页面。"
