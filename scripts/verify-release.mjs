import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import { readFileSync } from "node:fs"

const git = (...args) => execFileSync("git", args, { encoding: "utf8" }).trim()
const { version } = JSON.parse(readFileSync("package.json", "utf8"))
const tag = process.env.RELEASE_TAG
assert.equal(tag, `v${version}`, "tag must match package version")
assert.equal(git("cat-file", "-t", `refs/tags/${tag}`), "tag", "release requires an annotated tag")
const sha = git("rev-parse", "HEAD")
assert.equal(git("rev-parse", `${tag}^{commit}`), sha)
git("merge-base", "--is-ancestor", sha, "origin/main")
const repository = process.env.GITHUB_REPOSITORY
assert.equal(repository, "duhu2000/dsh-pre-duediligence")
const response = await fetch(`https://api.github.com/repos/${repository}/actions/runs?head_sha=${sha}&per_page=100`, {
  headers: { Authorization: `Bearer ${process.env.GITHUB_TOKEN}`, Accept: "application/vnd.github+json" }, signal: AbortSignal.timeout(20000),
})
assert.ok(response.ok, `CI lookup failed: ${response.status}`)
const runs = (await response.json()).workflow_runs.filter(run => run.path === ".github/workflows/ci.yml" && run.head_sha === sha && run.event === "push" && run.head_branch === "main")
assert.ok(runs.length > 0, "no CI run for release commit on main")
assert.equal(runs[0].conclusion, "success", "latest main CI must finish successfully before tagging")
const existing = await fetch(`https://registry.npmjs.org/dsh-pre-duediligence/${version}`, { signal: AbortSignal.timeout(20000) })
assert.equal(existing.status, 404, "version must be new; never overwrite or reuse a published version")
console.log(`Release admission passed: ${tag} ${sha}`)
