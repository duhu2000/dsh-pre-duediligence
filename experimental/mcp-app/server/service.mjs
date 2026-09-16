export class ReadError extends Error {
  constructor(code) { super(code); this.code = code; }
}

// Grant comes from the server's binding, never tool arguments. P1 binding is synthetic.
export function createReader(source, binding, audit = () => {}) {
  const saved = structuredClone(source), grant = structuredClone(binding);
  const fail = code => { audit({ code }); throw new ReadError(code); };
  function report(args) {
    if (!grant?.principal || !saved.owner || ['principal', 'profile', 'session'].some(k => !grant[k] || grant[k] !== saved.owner[k]) || !grant.reportIds?.includes(args.reportId)) fail('ACCESS_DENIED');
    if (args.reportId !== saved.report?.reportId) fail('REPORT_NOT_FOUND');
    if (args.reportVersion !== saved.report.reportVersion) fail('VERSION_NOT_FOUND');
    if (saved.report.schemaVersion !== '1.0' || !saved.report.entity?.id || !Array.isArray(saved.report.sections) || saved.report.sections.length !== 8 || !Array.isArray(saved.report.findings) || !Array.isArray(saved.report.coverage)) fail('LEGACY_FIELDS_MISSING');
    return structuredClone(saved.report);
  }
  return Object.freeze({
    getReport: report,
    getEvidence(args) {
      const r = report(args);
      if (!r.findings.some(f => f.evidenceIds.includes(args.evidenceId))) fail('EVIDENCE_NOT_FOUND');
      const evidence = saved.evidence.find(e => e.id === args.evidenceId);
      if (!evidence) fail('EVIDENCE_NOT_FOUND');
      return { schemaVersion: '1.0', reportId: r.reportId, reportVersion: r.reportVersion, entity: r.entity, evidence: structuredClone(evidence) };
    },
    listArtifacts(args) { const r = report(args); return { schemaVersion: '1.0', reportId: r.reportId, reportVersion: r.reportVersion, artifacts: structuredClone(r.artifacts) }; }
  });
}

export function textReport(r) {
  return `${r.entity.fullName} · 版本 ${r.reportVersion} · 数据时点 ${r.dataAsOf}\n${r.summary}\n\n${r.sections.map(s => `${s.title}\n${s.text}`).join('\n\n')}\n\n${r.coverage.map(c => `${c.title}: ${c.status} — ${c.detail}`).join('\n')}\n${r.limitations.join('\n')}`;
}
