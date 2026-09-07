import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import { readFile, mkdir, writeFile } from "node:fs/promises"
import { setTimeout } from "node:timers/promises"

const { name, version } = JSON.parse(await readFile("package.json", "utf8"))
const sha = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim()
async function json(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(20000) })
  assert.ok(response.ok, `Registry readback: HTTP ${response.status}`)
  return response.json()
}
let evidence
for (let attempt = 0; attempt < 6; attempt++) {
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
  } catch (error) { if (attempt === 5) throw error; await setTimeout(5000) }
}
await mkdir("_scratch/release", { recursive: true })
await writeFile("_scratch/release/registry-evidence.json", JSON.stringify(evidence, null, 2) + "\n")
console.log(`Registry version, integrity and provenance matched ${sha}`)
