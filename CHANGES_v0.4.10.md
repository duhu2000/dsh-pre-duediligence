# v0.4.10 修复：精简模式对工具行无效
原因：DSH 里 MCP 工具调用行的节点类型是 tool-call（command 只是斜杠命令），v0.4.4 的规则只匹配了 command。
现在 tool-call 与 command 一并折叠：一串连续的工具行（中间夹着只有思考的空步骤也算）只留最后一行。
应用同前，验证 version: 0.4.10。
