# awesome-dsh-plugin 投稿登记

日期：2026-09-07。本文记录市场投稿事实与证据，不代表已经被收录。只有上游 PR 合并且目录生效后，才可以标记为已上架。

## 投稿元数据

| 项目 | 已核验值 |
| --- | --- |
| 仓库 | `https://github.com/duhu2000/dsh-pre-duediligence`，公开、未归档 |
| npm | `dsh-pre-duediligence@0.1.17`，发布后核验 `latest=0.1.17` |
| Release | `https://github.com/duhu2000/dsh-pre-duediligence/releases/tag/v0.1.17` |
| 许可证 | MIT |
| Topic | `dsh-plugin` |
| Manifest | `package.json` 的 `dsh.bundle.patch` 指向 `./cordis.patch.yml` |
| 兼容声明 | DSH `>=0.1.1-rc.2`；Node `^22.19.0 || ^24.0.0`；Better Sidebar 为可选工作台 peer，启用时支持 `>=0.17.1 <0.19.0` 并须按 Host 成套配对 |
| 上游分类 | `workflow` |

英文简介：

> Prepare a session-scoped enterprise pre-visit due-diligence brief in DeepSeek Harness, with explicit entity confirmation and bounded Qichacha MCP queries.

中文简介：

> 在 DeepSeek Harness 中按会话准备企业访前尽调简报，确认唯一法律实体，并在用户已选的有界预算内调用企查查 MCP。

## 权限、额度与验收边界

- 企查查数据采用 BYO QCC：用户需要自行安装并配置兼容的 MCP Connector，使用自己的企查查账号、产品权限和可用额度完成 OAuth；本插件不附带账号、数据权限或查询额度。
- 多候选时需要用户确认唯一法律实体；用户发送任务即表示同意所选档位的 8 / 18 / 40 次工具调用硬上限，不再二次询问。
- 零记录、无权限、额度不足和调用失败是不同状态；未执行或失败的维度不得写成“零风险”。
- 0.1.17 已完成终态、状态色、自动化契约、构建和隔离 UI 回归；真实企查查 Provider 真链路仍待用户验收，市场描述不把待验项写成已通过。

## 安装、卸载与截图证据

- 公开 npm tarball 的精确版本、仓库、MIT、`dsh.bundle`、`cordis.patch.yml`、`lib/index.js` 和 provenance 由发布 workflow 在上架后回读核验。
- 上述验证使用 npm `--ignore-scripts --legacy-peer-deps`，没有运行 `install.sh`，没有读取或修改生产 DSH Profile。验证终端为 Node 25，因此 npm 按预期提示不在项目声明的 Node 22/24 引擎范围内；受支持版本的构建和测试结果见 [兼容与验收记录](COMPATIBILITY.md)。
- `screenshots.json` 声明 4 张浅色/深色、桌面/移动截图。图片来自隔离 React + Chrome 回归环境，只含合成 UI，不含客户数据、访问令牌、真实查询结果或本机配置；它们不是实际 DSH Host 或真实企查查 Provider 验收证据。

## 投稿进度

| 项目 | 状态 |
| --- | --- |
| 重复 PR 检索 | 创建前未发现同名历史或在途 PR；当前同名投稿为本次 PR #4587 |
| 上游 PR | [awesome-dsh-plugin#4587](https://github.com/awesome-dsh-plugin/awesome-dsh-plugin/pull/4587)，OPEN、Ready for review（非 Draft） |
| 投稿分支 / 提交 | `duhu2000:add/duhu2000-dsh-pre-duediligence` / `550f65c3c731991ef829f791a67b17761df760ce` |
| PR check | SUCCESS（2026-09-07），[运行记录](https://github.com/awesome-dsh-plugin/awesome-dsh-plugin/actions/runs/34131526825/job/101772555052) |
| Submission gate | SUCCESS（2026-09-07），[运行记录](https://github.com/awesome-dsh-plugin/awesome-dsh-plugin/runs/101773351008) |
| 目录状态 | 未收录 |
| 下一步 | 等待维护者评审与合并；合并后再核验 README、站点目录和 npm 自动映射是否生效 |

发布版本保持不可变：每次修复使用新 tag 和新 npm 版本，不移动旧 tag，不覆盖已发布 tarball。
