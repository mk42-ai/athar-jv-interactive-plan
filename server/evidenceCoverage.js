// Request-specific completeness checks, separate from evidence identity/quote validation.
// Missing coverage triggers the same bounded model repair, never invented source facts.
const normalize = text => String(text || '').normalize('NFKC').replace(/\s+/g, ' ').toLowerCase();
const escape = text => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
export function evidenceCoverageGaps(question, retrieved, answer) {
  const gaps=[];
  const quotes=[...answer.facts, ...answer.conflicts].flatMap(f=>f.evidence).map(e=>e.quote)
    .concat(answer.calculations.flatMap(c=>c.operands.map(o=>o.quote)));
  const joined=normalize(quotes.join('\n'));
  const cells=[...new Set([...String(question).matchAll(/(?<![\w$])\$?([A-Z]{1,3})\$?([1-9]\d{0,6})(?!\w)/g)].map(m=>m[1]+m[2]).filter(s=>!/^([YWMG]|AED|USD)\d+$/.test(s)))];
  for (const cell of cells) {
    const eligible=retrieved.chunks.filter(c=>c.kind==='xlsx').flatMap(c=>(c.records||[]).filter(r=>r.cell===cell));
    if (!eligible.length) continue; // not in selected source: missing evidence is the correct outcome
    const mention=new RegExp(`\\b${escape(cell)}\\s*(?:=|:)`, 'i');
    if (!quotes.some(q=>mention.test(q))) gaps.push(`quoted original cell ${cell} with its adjacent label and saved value`);
  }
  if (/\b(how many|total|totals|count)\b/i.test(question)) {
    const cardinal='(?:\\d[\\d,]*|one|two|three|four|five|six|seven|eight|nine|ten)';
    for (const [concept,pattern] of [['tasks','(?:tasks?|activities)'],['gates','gates?']]) {
      if (!(new RegExp(`\\b${pattern}\\b`,'i')).test(question)) continue;
      const explicit=new RegExp(`\\b${cardinal}\\s+(?:[a-z-]+\\s+){0,2}${pattern}\\b`,'i');
      if (retrieved.chunks.some(c=>explicit.test(c.text)) && !explicit.test(joined)) gaps.push(`the explicitly stated ${concept} total and its source heading`);
    }
  }
  // Exact starter intents require substantive evidence from both sides, not a
  // heading/topic match. Qualifiers are required only when present in retrieved originals.
  const allSource = normalize(retrieved.chunks.map(chunk => chunk.text).join('\n'));
  const quotedById = new Map();
  for (const fact of [...answer.facts, ...answer.conflicts]) for (const ref of fact.evidence) quotedById.set(ref.id, `${quotedById.get(ref.id) || ''} ${normalize(ref.quote)}`);
  if (/\bcompare\b/i.test(question) && /\bbase case\b/i.test(question) && /\b(?:international|expansion)\b/i.test(question)) {
    for (const phrase of ['base case', 'international expansion upside']) if (allSource.includes(phrase) && !joined.includes(phrase)) gaps.push(`the source-stated ${phrase} scenario`);
    if (/contingent|subject to.{0,80}approval/i.test(allSource) && !/contingent|subject to.{0,80}approval|approval of/i.test(joined)) gaps.push('the conditional expansion approval qualification');
    if (/headline financial case is limited to the uae/i.test(allSource) && !/limited to the uae|uae.only base case/i.test(joined)) gaps.push('the UAE-only headline geography boundary');
  }
  if (/\bcapital\s+(?:decisions?|agreements?|items?)\b/i.test(question) && /\bagree(?:ment)?|\bdecisions?\b/i.test(question)) {
    // Each real unresolved row is identified by source coordinates and label, never by
    // a hard-coded amount. The same item can be proved in another passage of that document.
    const unresolved = new Map();
    for (const chunk of retrieved.chunks.filter(c => c.kind === 'xlsx')) {
      for (const record of chunk.records || []) {
        if (!/^to be agreed$/i.test(String(record.value || '').trim())) continue;
        const row = Number(record.row || String(record.cell).match(/\d+$/)?.[0]);
        const label = (chunk.records || []).filter(r => Number(r.row || String(r.cell).match(/\d+$/)?.[0]) === row && r.cell !== record.cell && typeof r.value === 'string').map(r => normalize(r.value)).find(v => /cash|solvency|threshold|mou|capital/.test(v));
        if (label) unresolved.set(`${chunk.documentId}:${chunk.location.sheet}:${record.cell}`, { documentId: chunk.documentId, label });
      }
    }
    for (const item of unresolved.values()) {
      const docQuotes = normalize([...answer.facts, ...answer.conflicts].flatMap(f => f.evidence).filter(ref => retrieved.chunks.some(c => c.id === ref.id && c.documentId === item.documentId)).map(ref => ref.quote).join('\n'));
      if (!docQuotes.includes(item.label) || !docQuotes.includes('to be agreed')) gaps.push(`the exact unresolved item label: ${item.label}`);
    }
    if (allSource.includes('capital basis for the mou') && !/capital basis for the mou|contractual (?:mou|capital)|capital measure/.test(joined)) gaps.push('the unresolved contractual capital-basis choice');
  }
  return [...new Set(gaps)];
}
