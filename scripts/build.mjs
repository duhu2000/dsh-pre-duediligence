import { mkdir, rm, writeFile, readFile } from "node:fs/promises"

import { build } from "esbuild"

const packageId = "dsh-pre-duediligence"

await rm("lib", { recursive: true, force: true })
await mkdir("lib", { recursive: true })

await build({
  entryPoints: ["src/index.ts"],
  external: ["./report-host.js"],
  outfile: "lib/index.js",
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node20",
  packages: "external",
  sourcemap: true,
})

const clientResult = await build({
  stdin: { contents: `export * from "./src/client.tsx";
import { apply as workbench, inject as workbenchInject } from "./src/client.tsx";
import { apply as report, inject as reportInject } from "./experimental/dsh-mcp-app-host/src/client.jsx";
export const inject = [...new Set([...workbenchInject, ...reportInject])];
export function apply(ctx) { workbench(ctx); report(ctx); }`, resolveDir: process.cwd(), sourcefile: "production-client.mjs" },
  bundle: true,
  format: "cjs",
  platform: "browser",
  target: "es2022",
  jsx: "automatic",
  external: [
    "@deepseek-ai/dsh-client-ui-primitives",
    "react",
    "react/jsx-runtime",
    "react-dom",
    "react-dom/client",
  ],
  write: false,
})

const clientOutput = clientResult.outputFiles.find(file => file.path.endsWith("<stdout>")) ?? clientResult.outputFiles[0]

if (clientOutput === undefined) {
  throw new Error("客户端构建未产生 JavaScript 输出")
}

const wrappedClient = `window.__ModuleLoader__.load({
  id: ${JSON.stringify(packageId)},
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
${clientOutput.text.replace(/[ \t]+$/gm, "")}
    return module.exports;
  }
});
`

await writeFile("lib/client.js", wrappedClient, "utf8")

// The main plugin injects the saved-report host from this sibling runtime entry.
// The synthetic server and test fixture are never installed or activated.
await build({
  entryPoints: ["experimental/dsh-mcp-app-host/src/saved-index.mjs"],
  outfile: "lib/report-host.js", bundle: true, platform: "node", format: "esm",
  target: "node22", packages: "external", sourcemap: true,
})
const reportApp = await build({
  entryPoints: ["experimental/mcp-app/ui/app.mjs"], bundle: true, write: false,
  format: "esm", platform: "browser", target: "es2022", minify: true,
})
const reportTemplate = await readFile("experimental/mcp-app/ui/report.html", "utf8")
await writeFile("lib/report.html", reportTemplate.replace("/* APP_BUNDLE */", () => reportApp.outputFiles[0].text.replace(/<\/script/gi, "<\\/script")))
