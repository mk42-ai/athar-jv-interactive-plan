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
  return [...new Set(gaps)];
}
