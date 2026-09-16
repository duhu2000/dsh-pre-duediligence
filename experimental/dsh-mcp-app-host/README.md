# F24 DSH MCP Apps Host — isolated development

Independent plugin for the installed DSH `0.1.2-rc.1`. No daily Profile or native MCP connector changes. Requires Node 24. The original synthetic mode uses the adjacent `experimental/mcp-app` HTTP service; the saved-record mode below uses an in-process MCP transport bound to the current DSH execution.

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


## Saved business record mode (development only)

Load **only one** Host entry: `lib/saved.js` with `{savedReports: true}`. It injects `previsitSavedReports`, the read-only service provided by this branch's business plugin. Installed 0.1.37 releases do not yet provide that service; merely installing this Host alongside the old release is insufficient. No release version or daily Profile is changed here.

The service owns the Profile store. Session ID and workspace come from `exec.agent.session.id` and `exec.agent.session.header.cwd`; the App cannot supply either. Report ID is the exact PV task ID (not a root ID alias), with an explicit version. Reads are restricted to the owning session and workspace. The dedicated `readSnapshot` path does not call the existing normalizing/writing `get/list` methods, nor reopen the single-owner storage domain.

Each view uses the standard MCP client/server protocol over an in-memory transport. Every App read reauthorizes through the source and compares the original snapshot digest. Deleted, reassigned or changed records fail closed. Saved-mode cards now persist a minimal receipt in the separate `f24_saved_views_v1` Host domain. The receipt stores trusted execution identity, active report/version, previously seen content digests, and a fixed 30-day expiry, never report text or evidence. Resource reads rebuild the result from the authorized source, including after Host restart. A receipt does not replace source authorization. The original HTTP synthetic mode still uses 15-minute memory grants.

Projection preserves original Markdown, eight report sections, saved finding-to-evidence links, run outcomes and original source dates. Material quotes require a matching material checksum and quote. Query summaries are labeled summaries, with collection time distinct from unknown source date. Missing historical links are not inferred. Registered HTML artifacts are metadata only; PDF/DOCX registry integration and downloads remain out of scope.

### Reproduce without customer data

1. Build the adjacent MCP App, then this Host.
2. Run `node tests/prepare-saved-profile.mjs` from this package. It prepares a separate test fixture package and `_scratch/f24-saved.patch.yml`.
3. From repository root, start the installed DSH CLI with `DSH_HOME="$PWD/_scratch/dsh-f24-saved-profile" dsh web --patch "$PWD/_scratch/f24-saved.patch.yml" --host 127.0.0.1 --port 3090 --no-open > _scratch/dsh-saved-host.log 2>&1` (Node 24 on PATH).
4. Run `npm run test:saved-dsh` here. The fixture's explicit prepare tool stores synthetic V1/V2 records through the actual business store. The report tool then reads through the same source API used by the business plugin.
5. Evidence: `_scratch/dsh-saved-evidence/result.json` and `saved-dsh.png`. The test checks that task-storage SHA-256 stays unchanged across viewing, evidence clicks, close/reopen and browser refresh. Initial wrong-version failures render a visible error, not an indefinite waiting state.

Root `pnpm test` covers the business source only (reference downloads and Node-test experiments are intentionally excluded). Run the adjacent package and Host tests separately. All samples are synthetic in the real business storage format; this is not validation against customer reports or a production authorization certification.


### Recovery and version history

The Host toolbar lists published versions in the same report family, session, workspace and legal entity. Other owners, subjects and drafts are excluded; duplicate version numbers fail explicitly. Selection is saved in the Host receipt so refresh, close/reopen and process restart restore the selected version. Switching revisits pinned digests: a previously viewed version that changed in place cannot silently replace the original.

Business report storage stays read-only. Creating a card and selecting a version write only the separate Host receipt domain. Reading/restoring a card does not write the receipt either. The Host caps receipts at 1,000 and version pins at 100; expired receipts are removed when creating another card. Expiry is absolute and never renewed by reads or switches. After 30 days, source changes, or a missing receipt, execute the opening tool again. Cards created by earlier experiment commits have no durable receipt and require one fresh tool execution; no authority is reconstructed from their browser metadata.

Run `node tests/prepare-saved-profile.mjs`, then `npm run test:recovery`. This test owns two launches of the supported installed `dsh web` CLI, an isolated `_scratch/dsh-f24-recovery-profile`, and port 3091. It actually stops/restarts DSH, reauthenticates using the new local launch token, reopens the existing session, and checks V1 restoration, original evidence, V2 switchback, hidden cross-owner/subject versions, and unchanged report/receipt bytes during recovery. It shuts down its own processes and archives only token-free evidence in `_scratch/dsh-recovery-evidence`.

This is still a single local Profile authorization model. Cross-session browsing, multiuser account permissions, rollout to a daily Profile, and real customer-report compatibility are not covered by the synthetic acceptance.
