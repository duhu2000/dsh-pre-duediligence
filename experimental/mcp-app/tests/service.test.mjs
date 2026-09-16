import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createReader, textReport } from '../server/service.mjs';
import { snapshot, grant } from '../server/snapshot.mjs';
const args = { reportId: 'demo-report', reportVersion: 1 };
test('report, linked evidence, inherited date, coverage and plain text remain consistent', () => {
  const reader = createReader(snapshot, grant);
  const report = reader.getReport(args);
  assert.equal(report.sections.length, 8);
  assert.deepEqual(report.coverage.map(c => c.status), ['no-data', 'failed', 'not-covered', 'unknown']);
  assert.equal(reader.getEvidence({ ...args, evidenceId: 'e1' }).evidence.sourceDate, '2026-09-01');
  assert.ok(textReport(report).includes('现场必问'));
  assert.deepEqual(reader.listArtifacts(args).artifacts, []);
});
test('cross principal/profile/session and missing grants fail closed', () => {
  for (const field of ['principal', 'profile', 'session']) {
    assert.throws(() => createReader(snapshot, { ...grant, [field]: 'other' }).getReport(args), /ACCESS_DENIED/);
  }
  assert.throws(() => createReader(snapshot, {}).getReport(args), /ACCESS_DENIED/);
  assert.throws(() => createReader(snapshot, grant).getEvidence({ ...args, reportId: 'other', evidenceId: 'e1' }), /ACCESS_DENIED/);
});
test('version and evidence guesses cannot escape saved version', () => {
  const reader = createReader(snapshot, grant);
  assert.throws(() => reader.getReport({ ...args, reportVersion: 2 }), /VERSION_NOT_FOUND/);
  assert.throws(() => reader.getEvidence({ ...args, evidenceId: 'other' }), /EVIDENCE_NOT_FOUND/);
  const s = structuredClone(snapshot); s.evidence.push({ id: 'unlinked' });
  assert.throws(() => createReader(s, grant).getEvidence({ ...args, evidenceId: 'unlinked' }), /EVIDENCE_NOT_FOUND/);
});
test('missing historical fields fail explicitly; caller mutations cannot alter snapshots or grants', () => {
  const s = structuredClone(snapshot), g = structuredClone(grant), reader = createReader(s, g);
  s.report.reportVersion = 99; g.reportIds.push('other');
  reader.getReport(args).entity.fullName = 'changed';
  assert.equal(reader.getReport(args).entity.fullName, snapshot.report.entity.fullName);
  delete s.report.sections;
  assert.throws(() => createReader(s, grant).getReport({ ...args, reportVersion: 99 }), /LEGACY_FIELDS_MISSING/);
});
