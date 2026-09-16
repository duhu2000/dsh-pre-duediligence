# F24 P1: synthetic report → saved evidence

Private, independently installed experiment. No imports from the DSH plugin runtime, no real report storage, no enterprise query executor, no credentials, no write or supplement tools. The root package and its release pipeline are unchanged.

Baseline: `2a86f4fba3dba873557239ba6b76ad51dec73eaf` (`dsh-pre-duediligence@0.1.37`). Design and acceptance documents live in the handoff folder `AI-设计/智能体-访前尽调/` rather than duplicating the shared business standard here.

## Run

Use Node 24 (verified 24.19.0). From this directory:

```sh
npm ci --ignore-scripts
npm run build
npm test
npm start
```

The synthetic MCP endpoint binds `127.0.0.1:3001/mcp`. Only the `http://localhost:8080` browser origin is accepted. This is a local synthetic test binding, **not authenticated remote access**. Never replace the fixtures with customer data.

## Official basic-host

Use official ext-apps tag `v2.0.0`, commit `352f6ced4d80772e92b4e7a311854481a8d65b04`. Copy `examples/basic-host` to an isolated directory outside its workspace. The original source is unmodified. Standalone installation needs `@types/cors@2.8.19`; the parent workspace also supplies `cross-env`, so invoke Vite directly as below:

```sh
npm ci --ignore-scripts # use the archived basic-host package + lock files
node node_modules/typescript/bin/tsc --noEmit
INPUT=index.html node node_modules/vite/bin/vite.js build
INPUT=sandbox.html node node_modules/vite/bin/vite.js build
node serve.ts
```

The official example listens on 8080/8081 (all interfaces by upstream default). It must only be used temporarily with this synthetic fixture; stop it after testing. No installed DSH profile is involved.

Open `http://localhost:8080`, select `previsit_report_open`, enter `{"reportId":"demo-report","reportVersion":1}`, and click Call Tool. Click each judgment to fetch saved evidence via AppBridge.

With the MCP service and official host running, from this experiment:

```sh
npm run test:protocol
npm run test:host
```

The browser test uses installed macOS Chrome and a temporary Playwright profile. It records real HTTP requests/responses, iframe messages, lifecycle events and screenshots in the worktree `_scratch/evidence/`. Browser failure logs are separate from the final passing result. A screenshot alone is not acceptance.

## Boundaries

- Server-owned synthetic principal/profile/session/report grant; tool arguments cannot alter the grant. Every report/evidence/artifact read checks it.
- Schema `1.0`; an explicit report version is required; only evidence referenced by that version is readable.
- `structuredContent` is not treated as confidential or hidden from the model.
- UI renders text via `textContent`; the fixture deliberately contains script-looking material.
- Initial result, click error/retry, duplicate click, teardown/remount and page refresh are tested. App/host cancellation and interrupted transport recovery are implemented only in limited form and not fully fault-tested.
- No actual DSH or other production client acceptance. No remote authentication, real data, file downloads, supplement workflow, publication or deployment.
