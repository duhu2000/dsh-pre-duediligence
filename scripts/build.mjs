import { mkdir, rm, writeFile } from "node:fs/promises"

import { build } from "esbuild"

const packageId = "qcc-previsit-dsh"

await rm("lib", { recursive: true, force: true })
await mkdir("lib", { recursive: true })

await build({
  entryPoints: ["src/index.ts"],
  outfile: "lib/index.js",
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node20",
  packages: "external",
  sourcemap: true,
})

const clientResult = await build({
  entryPoints: ["src/client.tsx"],
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
${clientOutput.text}
    return module.exports;
  }
});
`

await writeFile("lib/client.js", wrappedClient, "utf8")
