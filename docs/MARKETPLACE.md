# awesome-dsh-plugin 投稿登记

日期：2026-09-07。本文记录市场投稿事实与证据，不代表已经被收录。只有上游 PR 合并且目录生效后，才可以标记为已上架。

## 投稿元数据

| 项目 | 已核验值 |
| --- | --- |
| 仓库 | `https://github.com/duhu2000/dsh-pre-duediligence`，公开、未归档 |
| npm | `dsh-pre-duediligence@0.1.9`，`latest=0.1.9` |
| Release | `https://github.com/duhu2000/dsh-pre-duediligence/releases/tag/v0.1.9` |
| 许可证 | MIT |
| Topic | `dsh-plugin` |
| Manifest | `package.json` 的 `dsh.bundle.patch` 指向 `./cordis.patch.yml` |
| 兼容声明 | DSH `>=0.1.1-rc.2`；Node `^22.19.0 || ^24.0.0`；Better Sidebar `>=0.17.1 <0.19.0` |
| 上游分类 | `workflow` |

英文简介：

> Prepare a session-scoped enterprise pre-visit due-diligence brief in DeepSeek Harness, with explicit entity confirmation and tool-call budget approval for Qichacha MCP queries.

中文简介：

> 在 DeepSeek Harness 中按会话准备企业访前尽调简报，并在调用企查查 MCP 前要求明确的主体确认和工具调用预算授权。

## 权限、额度与验收边界

- 企查查数据采用 BYO QCC：用户需要自行安装并配置兼容的 MCP Connector，使用自己的企查查账号、产品权限和可用额度完成 OAuth；本插件不附带账号、数据权限或查询额度。
- 开始任务前需要用户确认唯一法律实体；执行前需要用户确认 8 / 18 / 40 次工具调用硬预算。重启后不复用内存中的预算确认。
- 零记录、无权限、额度不足和调用失败是不同状态；未执行或失败的维度不得写成“零风险”。
- 0.1.9 已完成自动化契约、构建和隔离 UI 回归；真实 DSH 四插件组合、Connector 双版本及企查查 Provider 真链路仍待验收，市场描述不把这些待验项写成已通过。

## 安装、卸载与截图证据

- 公开 npm tarball `dsh-pre-duediligence-0.1.9.tgz` 已在独立临时目录完成包层安装，核对版本、仓库、MIT、`dsh.bundle`、`cordis.patch.yml`、`lib/index.js` 和安装脚本后成功卸载；目标包目录已不存在。
- 上述验证使用 npm `--ignore-scripts --legacy-peer-deps`，没有运行 `install.sh`，没有读取或修改生产 DSH Profile。验证终端为 Node 25，因此 npm 按预期提示不在项目声明的 Node 22/24 引擎范围内；受支持版本的构建和测试结果见 [兼容与验收记录](COMPATIBILITY.md)。
- `screenshots.json` 声明 4 张浅色/深色、桌面/移动截图。图片来自隔离 React + Chrome 回归环境，只含合成 UI，不含客户数据、访问令牌、真实查询结果或本机配置；它们不是实际 DSH Host 或真实企查查 Provider 验收证据。

## 投稿进度

| 项目 | 状态 |
| --- | --- |
| 重复 PR 检索 | 未发现同名历史或在途 PR |
| 上游 PR | 待创建 |
| PR checks | 待创建后登记 |
| 目录状态 | 未收录 |
| 下一步 | 从上游最新 `main` 创建单文件投稿 PR，等待 CI 和维护者评审 |

发布版本保持不可变：本次只补充市场材料，不移动 `v0.1.9` tag，不重复发布 npm 0.1.9。
