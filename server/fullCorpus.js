// Complete on-disk evidence search and bounded cell reads, complementary to the
// existing rich passage retriever. No entire-workbook prompt or sampled-only index.
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { retrieveEvidence, validateCorpusIndex, immutableRecordsMap } from './retrieval.js';
const fail = (code, status=503) => Object.assign(new Error('Complete document index is unavailable.'), {code,status});
const hashFile = file => { const hash=createHash('sha256'), fd=fs.openSync(file,'r'), buffer=Buffer.alloc(1024*1024); try { for (;;) { const n=fs.readSync(fd,buffer,0,buffer.length,null);if(!n)break;hash.update(buffer.subarray(0,n)); } return hash.digest('hex'); } finally {fs.closeSync(fd);} };
const cellPoint = value => { const m=/^([A-Z]{1,3})([1-9][0-9]{0,6})$/.exec(value || ''); if(!m)return null;const col=[...m[1]].reduce((n,c)=>n*26+c.charCodeAt(0)-64,0),row=Number(m[2]);return col<=16384&&row<=1048576?{col,row}:null; };
const escapeRe = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const stop = new Set('the this that and or of to in on at for from with is are was were be please what which how does do give me show tell source document workbook worksheet cell saved value only according about original formula cached result'.split(' '));
export function createFullCorpus({corpusDir,loadIndex}={}) {
 let db=null,signature=null;
 function database(index) {
  if(!index.fullIndex)return null; // Synthetic legacy fixtures, not production truncation.
  if(!corpusDir)throw fail('corpus_unavailable');
  const root=path.resolve(corpusDir), file=path.join(root,'corpus.sqlite');
  if(fs.lstatSync(root).isSymbolicLink()||fs.lstatSync(file).isSymbolicLink()||!fs.statSync(file).isFile())throw fail('source_integrity_failed');
  const stat=fs.statSync(file), sig=[stat.ino,stat.size,stat.mtimeMs,stat.ctimeMs].join(':');
  if(db&&signature===sig)return db;
  const expected=index.fullIndex.sha256 || index.fullIndex.databaseSha256;
  if(!/^[a-f0-9]{64}$/.test(expected||'')||hashFile(file)!==expected)throw fail('source_integrity_failed');
  db?.close();db=new DatabaseSync(file,{readOnly:true});db.exec('PRAGMA query_only=ON; PRAGMA trusted_schema=OFF;');
  const originalSet=db.prepare('SELECT id FROM documents ORDER BY id').all().map(d=>d.id);
  if(JSON.stringify(originalSet)!==JSON.stringify(index.documents.map(d=>d.id).sort()))throw fail('source_integrity_failed');
  if(index.fullIndex.baseIndexSha256 && JSON.parse(db.prepare("SELECT value FROM meta WHERE key='sourceIndexSha256'").get().value)!==index.fullIndex.baseIndexSha256)throw fail('source_integrity_failed');
  signature=sig;
  return db;
 }
 function parseChunk(row,index) {
  if(!row)return null;
  const chunk=JSON.parse(row.json);const doc=index.documentsById.get(chunk.documentId);
  if(!doc||chunk.documentId!==doc.sha256)throw fail('invalid_source_records');
  return {...chunk,documentSlug:doc.slug,kind:doc.kind};
 }
 async function getChunk(id, index) {
  if(typeof id!=='string'||!/^src-[A-Za-z0-9_-]{1,160}$/.test(id))return null;
  index=index||await loadIndex();const conn=database(index);if(!conn)return null;
  return parseChunk(conn.prepare('SELECT json FROM chunks WHERE id = ?').get(id),index);
 }
 async function readCells(doc,sheet,bounds,headers=[]) {
  const index=await loadIndex(),conn=database(index);if(!conn||!index.documentsById.has(doc.id))throw fail('corpus_unavailable');
  if((bounds.maxRow-bounds.minRow+1)*(bounds.maxColumn-bounds.minColumn+1)>200||headers.length>40)throw fail('invalid_location',400);
  const rows=conn.prepare('SELECT json FROM cells WHERE document_id=? AND sheet=? AND row BETWEEN ? AND ? AND col BETWEEN ? AND ? ORDER BY row,col').all(doc.id,sheet,bounds.minRow,bounds.maxRow,bounds.minColumn,bounds.maxColumn);
  for(const address of headers) { const row=conn.prepare('SELECT json FROM cells WHERE document_id=? AND sheet=? AND address=?').get(doc.id,sheet,address);if(row)rows.push(row); }
  return rows.map(row=>{const record=JSON.parse(row.json);if(record.documentId!==doc.id||record.sheet!==sheet)throw fail('invalid_source_records');return record;});
 }
 async function retrieve(index,options) {
  const base=retrieveEvidence(index,options),conn=database(index);if(!conn)return base;
  const selected=index.documentsById.get(options.documentId),query=base.query;
  // Exact sheet/cell scope is resolved in the complete cell index, including any
  // late/dense coordinate absent from the older rich passage catalog.
  const namedSheets=[...new Set(index.documents.filter(doc=>!selected||doc.id===selected.id).flatMap(doc=>(doc.coverage.sheets||[]).map(s=>s.name)))].filter(name=>new RegExp('(?:^|[^a-z0-9])'+escapeRe(name)+'(?:$|[^a-z0-9])','i').test(query));
  const cells=[...query.matchAll(/(?<![\w$])\$?([A-Z]{1,3})\$?([1-9][0-9]{0,6})(?!\w)/g)].map(m=>m[1]+m[2]).filter(v=>cellPoint(v)&&(!/^[YW][0-9]+$/.test(v)||/\bcells?\b/i.test(query)));
  if(cells.length>12)throw fail('too_many_cells',400);
  const exact=[];
  for(const match of query.matchAll(/\b([A-Z]{1,3}[1-9][0-9]*):([A-Z]{1,3}[1-9][0-9]*)\b/g)){const a=cellPoint(match[1]),b=cellPoint(match[2]);if(!a||!b||b.row<a.row||b.col<a.col)throw fail('invalid_range',400);if((b.row-a.row+1)*(b.col-a.col+1)>12)throw fail('too_many_cells',400);for(let row=a.row;row<=b.row;row++)for(let col=a.col;col<=b.col;col++){let n=col,label='';for(;n;n=Math.floor((n-1)/26))label=String.fromCharCode(65+(n-1)%26)+label;const address=label+row;if(!cells.includes(address))cells.push(address);}}
  if(cells.length>12)throw fail('too_many_cells',400);
  if(cells.length && (!selected||selected.kind==='xlsx')) {
    for(const doc of index.documents.filter(doc=>doc.kind==='xlsx'&&(!selected||selected.id===doc.id))) {
      for(const sheet of (doc.coverage.sheets||[]).filter(s=>!namedSheets.length||namedSheets.includes(s.name))) {
        for(const address of cells) {
          const row=conn.prepare('SELECT json FROM cells WHERE document_id=? AND sheet=? AND address=?').get(doc.id,sheet.name,address);if(!row)continue;
          const record=JSON.parse(row.json),loc={sheet:sheet.name,range:address};
          // Text is a verbatim serialization of the stored source record, not a model answer.
          const value=record.formula&&record.cache?.state!=='present'?'Saved formula result unavailable':record.value==null?'Blank / not recorded':typeof record.value==='object'?JSON.stringify(record.value):String(record.value);
          const text=sheet.name+'!'+address+': '+value+'\nRaw value: '+JSON.stringify(record.rawValue)+'\nFormula (not recalculated): '+JSON.stringify(record.formula)+'\nSaved cache: '+JSON.stringify(record.cache)+'\nNumber format: '+JSON.stringify(record.numberFormat);
          const id='src-cell-'+doc.id+'-'+Buffer.from(sheet.name).toString('base64url')+'-'+address;
          exact.push({id,documentId:doc.id,documentSlug:doc.slug,kind:'xlsx',label:sheet.name+'!'+address,location:loc,text,records:[record],metadata:{originalSha256:doc.id,trust:'untrusted-source-data',evidenceOrigin:'complete-cell-index'}});
        }
      }
    }
  }
  const words=[...new Set((query.toLowerCase().match(/[\p{L}\p{N}]+/gu)||[]).filter(t=>t.length>1&&!stop.has(t)))].slice(0,24);
  let rows=[];
  if(words.length) {
    const terms=words.map(word=>'"'+word.replaceAll('"','""')+'"').join(' OR '),where=['chunks_fts MATCH ?'],params=[terms];
    if(selected){where.push('c.document_id=?');params.push(selected.id);}
    if(base.page!=null){where.push('c.page=?');params.push(base.page);}
    if(base.slide!=null){where.push('c.slide=?');params.push(base.slide);}
    if(namedSheets.length&&(/\b(only|exclusively|just)\b/i.test(query)||cells.length)){where.push('c.sheet IN ('+namedSheets.map(()=>'?').join(',')+')');params.push(...namedSheets);}
    rows=conn.prepare('SELECT c.json FROM chunks_fts JOIN chunks c ON c.rowid=chunks_fts.rowid WHERE '+where.join(' AND ')+' ORDER BY bm25(chunks_fts) LIMIT 70').all(...params);
  }
  const extra=rows.map(row=>parseChunk(row,index));
  if(exact.length) {
    // Stable deterministic ID is also resolvable to the original cell in getChunk.
    if(exact.length>12)throw fail('ambiguous_cells',400);
    const chunks=exact,chars=chunks.reduce((n,c)=>n+c.text.length,0);
    return {...base,chunks,modelChunks:chunks,recordsById:immutableRecordsMap(chunks.map(c=>[c.id,c])),charCount:chars,totalMatches:exact.length,fullIndex:true};
  }
  if(!extra.length)return {...base,fullIndex:true};
  // Rerank a bounded candidate set, not the entire workbook in RAM or in one prompt.
  const candidates=[...new Map([...base.chunks,...extra].map(chunk=>[chunk.id,chunk])).values()];
  const candidateIndex=validateCorpusIndex({...index,chunks:candidates});
  return {...retrieveEvidence(candidateIndex,options),fullIndex:true};
 }
 async function resolveChunk(id,index) {
  index=index||await loadIndex();
  const m=/^src-cell-([a-f0-9]{64})-([A-Za-z0-9_-]+)-([A-Z]{1,3}[1-9][0-9]{0,6})$/.exec(id||'');
  if(!m)return getChunk(id,index);
  const doc=index.documentsById.get(m[1]),sheet=Buffer.from(m[2],'base64url').toString('utf8');
  if(!doc||doc.kind!=='xlsx'||!doc.coverage.sheets.some(s=>s.name===sheet)||!cellPoint(m[3]))return null;
  const result=await retrieve(index,{question:sheet+' cell '+m[3],documentId:doc.id});
  return result.chunks.find(c=>c.id===id)||null;
 }
 return {getChunk:resolveChunk,readCells,retrieve};
}
