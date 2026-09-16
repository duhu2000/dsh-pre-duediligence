# F24 DSH MCP Apps Host — synthetic experiment

Independent plugin for the installed DSH `0.1.2-rc.1`. No daily Profile or native MCP connector changes. Requires Node 24 and the adjacent `experimental/mcp-app` service at `127.0.0.1:3001`.

- Registers only `f24_previsit_report_open` with DSH's tools service.
- Persists the initial synthetic tool result and view grant via `output.presentationMeta`.
- Uses the public keyed `tool.call.toolview` slot and MCP Apps SDK 2.0.0 AppBridge.
- Reads one fixed UI resource. A sandboxed iframe (`allow-scripts` only) has no parent DOM access or direct network connection.
- Captures DSH session/call identity outside the App and forwards only two app-visible, read-only tools. Evidence must belong to the opened snapshot.
- Grants expire after 15 minutes and are memory-only. Browser refresh works while the Host lives; after restart/expiry, reopen through the report tool. This is not real Profile authorization or production history access.
- Test-only fixture emits one deterministic model tool call and a final response through the real DSH agent loop. It never sends model requests. Do not install the fixture in a daily Profile.

## Build and tests

In this directory, with Node 24 on PATH:

```sh
npm ci --ignore-scripts
npm run build
npm test
```

The adjacent MCP App must also be installed and built. Start `node server/main.mjs` from `../mcp-app`.

Run `node tests/prepare-profile.mjs` to prepare the repository-local patch and empty workspace. DSH validation uses an isolated `DSH_HOME` under repository `_scratch/dsh-f24-profile`, an empty workspace under `_scratch/f24-empty-workspace`, a patch loading `lib/index.js` with `{syntheticOnly: true, url: 'http://127.0.0.1:3001/mcp'}`, and the separate `tests/fixture` package. Set `agent-default-model` to provider `f24-fixture`, model `synthetic`. Start via supported `dsh web --patch <patch> --host 127.0.0.1 --port 3089 --no-open`, writing its output to `_scratch/dsh-host.log`. The temporary authentication URL must not be published.

`node tests/dsh-host.mjs` launches a fresh local Chrome using the adjacent experiment's Playwright. Evidence goes to `_scratch/dsh-evidence`. This macOS fixture references the installed DSH package at `/opt/homebrew/lib/node_modules/@deepseek-ai/dsh`; adapt that path on another machine. Tests do not imply generic support for every MCP App, external resource domain, production user authorization, or artifact download.

With the service running, `npm run test:integration` validates the Host API against real MCP (DSH registration/RPC context is a test harness). `npm run test:dsh` validates the full browser and real DSH session path. The two evidence levels are distinct.
