#!/usr/bin/env bash

set -euo pipefail

readonly PROFILE_NAME="${DSH_PROFILE:-web}"
readonly BASELINE="${DSH_PREVISIT_BASELINE:-stable}"
readonly PREVISIT_SPEC="${DSH_PRE_DUEDILIGENCE_SPEC:-dsh-pre-duediligence@0.1.12}"
readonly LEGACY_PREVISIT_NAME="qcc-previsit-dsh"
readonly LEGACY_QCC_OAUTH_NAME="qcc-dsh-mcp-oauth"

info() {
  printf '\n[dsh-pre-duediligence] %s\n' "$1"
}

fail() {
  printf '\n[dsh-pre-duediligence] 安装失败：%s\n' "$1" >&2
  exit 1
}

case "$BASELINE" in
  stable) DSH_VERSION="0.1.1-rc.2"; SIDEBAR_VERSION="0.17.1"; CONNECTOR_VERSION="0.2.32"; CONTEXT_VERSION="" ;;
  candidate) DSH_VERSION="0.1.2-rc.1"; SIDEBAR_VERSION="0.18.1"; CONNECTOR_VERSION="0.2.37"; CONTEXT_VERSION="0.48.0" ;;
  *) fail "未知基线 ${BASELINE}，可选 stable 或 candidate。" ;;
esac
readonly DSH_VERSION SIDEBAR_VERSION CONNECTOR_VERSION CONTEXT_VERSION
command -v node >/dev/null 2>&1 || fail "请安装 Node.js 22.19+（22 LTS）或 24 LTS。"
command -v pnpm >/dev/null 2>&1 || fail "未找到 pnpm。请先执行 corepack enable，或安装 pnpm。"
command -v dsh >/dev/null 2>&1 || fail "未找到 dsh。请先安装 DeepSeek Harness。"

node -e 'const [major,minor]=process.versions.node.split(".").map(Number); process.exit((major===22 && minor>=19)||major===24 ? 0 : 1)' || fail "验收基线要求 Node.js 22.19+（22 LTS）或 24 LTS。"
readonly CURRENT_DSH_VERSION="$(dsh --version)"
[[ "$CURRENT_DSH_VERSION" == "$DSH_VERSION" ]] || fail "${BASELINE} 基线要求 DSH ${DSH_VERSION}，当前为 ${CURRENT_DSH_VERSION}。请先核对共同版本矩阵。"

info "检测到 Node.js $(node --version)，DSH $(dsh --version)，目标 profile：${PROFILE_NAME}。"

INSTALLED_PLUGINS="$(dsh plugin --profile "$PROFILE_NAME" list --depth 0 --json)" || fail "无法读取插件清单；未执行安装。"
readonly INSTALLED_PLUGINS
node -e 'const d=JSON.parse(process.argv[1]); if(!Array.isArray(d)||d.length!==1||!d[0]||typeof d[0]!=="object") process.exit(1); const deps=d[0].dependencies??{}; if(typeof deps!=="object"||Array.isArray(deps)||Object.values(deps).some(p=>!p||typeof p.version!=="string")) process.exit(1)' "$INSTALLED_PLUGINS" || fail "无法识别插件清单；未执行安装。"
installed_version() {
  node -e 'const d=JSON.parse(process.argv[1])[0]; const p=d.dependencies?.[process.argv[2]]; if(p && typeof p.version!=="string") process.exit(1); process.stdout.write(p?.version??"")' "$INSTALLED_PLUGINS" "$1"
}
readonly LEGACY_PREVISIT="$(installed_version "$LEGACY_PREVISIT_NAME")"
readonly LEGACY_OAUTH="$(installed_version "$LEGACY_QCC_OAUTH_NAME")"
readonly CURRENT_SIDEBAR="$(installed_version dsh-better-sidebar)"
readonly CURRENT_CONNECTOR="$(installed_version dsh-mcp-connector)"
readonly CURRENT_CONTEXT="$(installed_version dsh-context)"
if [[ -n "$LEGACY_PREVISIT" ]]; then
  fail "检测到旧包 ${LEGACY_PREVISIT_NAME}。为避免重复注册智能体，请先执行：dsh plugin --profile ${PROFILE_NAME} remove ${LEGACY_PREVISIT_NAME}"
fi
if [[ -n "$LEGACY_OAUTH" ]]; then
  readonly LEGACY_QCC_OAUTH_PRESENT=true
else
  readonly LEGACY_QCC_OAUTH_PRESENT=false
fi

[[ -z "$CURRENT_SIDEBAR" || "$CURRENT_SIDEBAR" == "$SIDEBAR_VERSION" ]] || fail "现有 Sidebar ${CURRENT_SIDEBAR} 与 ${BASELINE} 成套基线 ${SIDEBAR_VERSION} 不匹配；不可与 DSH ${DSH_VERSION} 单组件混装。未修改 Profile，请先停止 DSH 并按完整组合升级/回滚。"
[[ -z "$CURRENT_CONNECTOR" || "$CURRENT_CONNECTOR" == "$CONNECTOR_VERSION" ]] || fail "现有 Connector ${CURRENT_CONNECTOR} 与 ${BASELINE} 基线 ${CONNECTOR_VERSION} 不同；未修改 Profile，请先明确升级/回滚方案。"
if [[ "$BASELINE" == candidate && -n "$CURRENT_CONTEXT" && "$CURRENT_CONTEXT" != "$CONTEXT_VERSION" ]]; then
  fail "检测到 dsh-context ${CURRENT_CONTEXT}；candidate 组合仅验证可选共存版本 ${CONTEXT_VERSION}。未修改 Profile，请先停止 DSH，升级 dsh-context@${CONTEXT_VERSION} 后再重试；本插件不会自动安装 dsh-context。"
fi
info "安装前请停止目标 Profile 的 DSH Web。"
[[ "$BASELINE" != candidate ]] || info "候选矩阵已通过隔离真实宿主启动与无付费交互验收；真实企查查 Provider 仍待验收。"
if [[ -z "$CURRENT_SIDEBAR" ]]; then
  info "1/3 安装 Better Sidebar（工作台容器）"
  dsh plugin --profile "$PROFILE_NAME" add "dsh-better-sidebar@${SIDEBAR_VERSION}" --allow-build=node-pty
fi

if [[ -z "$CURRENT_CONNECTOR" ]]; then
  info "2/3 安装 MCP 连接器（通过市场连接企查查等 MCP）"
  dsh plugin --profile "$PROFILE_NAME" add "dsh-mcp-connector@${CONNECTOR_VERSION}"
fi

info "3/3 安装访前尽调工作台"
dsh plugin --profile "${PROFILE_NAME}" add "${PREVISIT_SPEC}" --allow-build=dsh-pre-duediligence

dsh plugin --profile "$PROFILE_NAME" list --depth 0
info "安装完成。请完整重启：dsh --profile ${PROFILE_NAME} --no-open"
if [[ "${LEGACY_QCC_OAUTH_PRESENT}" == true ]]; then
  printf '%s\n' \
    "检测到旧插件 ${LEGACY_QCC_OAUTH_NAME}。重启后先在“🧩 MCP连接器”中迁移旧企查查授权。" \
    "先确认新连接健康并完成一次真实企业查询，成功后再停止 DSH。" \
    "查询成功后才能执行：dsh plugin --profile ${PROFILE_NAME} remove ${LEGACY_QCC_OAUTH_NAME}，然后完整重启。"
else
  printf '%s\n' \
    "重启后打开左侧“🧩 MCP连接器”，选择“企查查·企业工商”并完成 OAuth 授权。" \
    "该连接会提供企业、风险、知产、经营、历史和董监高 MCP。"
fi
printf '%s\n' "在 DSH 左侧菜单点击“访前尽调”进入初始会话；右侧工作台默认关闭，点击输入框下方业务按钮后才打开。"
