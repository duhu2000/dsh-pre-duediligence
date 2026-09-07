import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import { readFile, mkdir, writeFile } from "node:fs/promises"
import { setTimeout } from "node:timers/promises"

const checkoutPackage = JSON.parse(await readFile("package.json", "utf8"))
const tag = process.env.VERIFY_RELEASE_TAG ?? `v${checkoutPackage.version}`
assert.match(tag, /^v\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/, "expected a version tag")
const git = (...args) => execFileSync("git", args, { encoding: "utf8" }).trim()
assert.equal(git("cat-file", "-t", `refs/tags/${tag}`), "tag", "expected an annotated release tag")
const { name, version } = JSON.parse(git("show", `refs/tags/${tag}:package.json`))
assert.equal(name, "dsh-pre-duediligence")
assert.equal(tag, `v${version}`)
const sha = git("rev-parse", `refs/tags/${tag}^{commit}`)
// npm may accept a publish several minutes before serving package/attestation
// metadata. This is read-only recovery, never another publish attempt.
const deadline = Date.now() + 10 * 60 * 1000
async function json(url) {
  const request = new URL(url)
  request.searchParams.set("release_readback", String(Date.now()))
  const response = await fetch(request, { signal: AbortSignal.timeout(Math.max(1, Math.min(20000, deadline - Date.now()))), cache: "no-store" })
  assert.ok(response.ok, `Registry readback: HTTP ${response.status}`)
  return response.json()
}
let evidence
for (let attempt = 1; ; attempt++) {
  try {
    const pkg = await json(`https://registry.npmjs.org/${name}/${version}`)
    assert.equal(pkg.version, version)
    assert.ok(pkg.dist?.integrity)
    const attestations = await json(`https://registry.npmjs.org/-/npm/v1/attestations/${name}@${version}`)
    const attestation = attestations.attestations.find(a => a.predicateType === "https://slsa.dev/provenance/v1")
    assert.ok(attestation, "missing provenance")
    const statement = JSON.parse(Buffer.from(attestation.bundle.dsseEnvelope.payload, "base64").toString())
    const integrity = new Map(pkg.dist.integrity.split(/\s+/).map(part => {
      const separator = part.indexOf("-")
      return [part.slice(0, separator), Buffer.from(part.slice(separator + 1), "base64").toString("hex")]
    }))
    assert.ok(statement.subject?.some(subject => Object.entries(subject.digest ?? {}).some(([algorithm, digest]) => integrity.get(algorithm) === digest)), "provenance artifact digest mismatch")
    const definition = statement.predicate.buildDefinition
    assert.equal(definition.externalParameters.workflow.repository, "https://github.com/duhu2000/dsh-pre-duediligence")
    assert.equal(definition.externalParameters.workflow.path, ".github/workflows/release.yml")
    assert.equal(definition.externalParameters.workflow.ref, `refs/tags/v${version}`)
    assert.ok(definition.resolvedDependencies.some(d => d.digest?.gitCommit === sha), "provenance commit mismatch")
    evidence = { name, version, sha, integrity: pkg.dist.integrity, provenance: statement.predicate, checkedAt: new Date().toISOString() }
    break
  } catch (error) {
    if (Date.now() >= deadline) throw error
    console.warn(`Registry readback attempt ${attempt}: ${error.message}; retrying without publishing`)
    await setTimeout(Math.min(15000, deadline - Date.now()))
  }
}
await mkdir("_scratch/release", { recursive: true })
await writeFile("_scratch/release/registry-evidence.json", JSON.stringify(evidence, null, 2) + "\n")
console.log(`Registry version, integrity and provenance matched ${sha}`)
