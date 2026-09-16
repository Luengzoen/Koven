export const DEMO_FINAL_REPORT = `## 修复报告

已定位并修正 \`vite.config.ts\` 中别名与路径解析不一致的问题。

| 步骤 | 动作 | 结果 | 备注 | 耗时 |
| --- | --- | --- | --- | --- |
| 1 | 搜索相关配置文件 | 命中 3 处 | search_files + grep | 0.4s |
| 2 | 读取候选文件 | 确认根因在别名表 | 并行 file_read | 0.6s |
| 3 | 对照官方文档 | 与当前版本一致 | 网页 + MCP | 1.2s |
| 4 | 应用 skill 改写 | 写入新别名映射 | apply-path-alias | 0.8s |
| 5 | 终端校验 | typecheck 通过 | pwsh | 2.1s |

示例片段：

\`\`\`ts
resolve: {
  alias: {
    '@renderer': path.join(__dirname, 'src/renderer/src'),
    '@shared': path.join(__dirname, 'src/shared')
  }
}
\`\`\`

流程示意：

\`\`\`mermaid
flowchart LR
  locate[定位文件] --> read[读取配置]
  read --> docs[对照文档]
  docs --> patch[写入修复]
  patch --> verify[终端校验]
  verify --> done[完成报告]
\`\`\`
`
