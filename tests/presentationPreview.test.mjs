import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { once } from 'node:events';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { createApiApp } from '../server/api.js';
import { privatePresentation } from '../server/privatePresentation.js';
import { deckPdfMiddleware } from '../server/deck.js';
import { guideAudioMiddleware } from '../server/guideAudioStore.js';

// Synthetic fixtures only: no .env file, live credentials or original document content.
const digest = b => crypto.createHash('sha256').update(b).digest('hex');
async function fixture({ preview = false, configured = false } = {}) {
  const keys = ['ATHAR_PRIVATE_PRESENTATION','ATHAR_REVIEW_PASSPHRASE','ATHAR_SESSION_SECRET','ATHAR_PRESENTATION_DIR','ATHAR_CONFIG_FILE'];
  const prior = Object.fromEntries(keys.map(k => [k, process.env[k]]));
  const folder = fs.mkdtempSync(path.join(os.tmpdir(), 'presentation-preview-'));
  fs.chmodSync(folder, 0o700);
  const put = (name, value) => { const f=path.join(folder,name); fs.mkdirSync(path.dirname(f),{recursive:true,mode:0o700}); fs.writeFileSync(f,JSON.stringify(value),{mode:0o600}); };
  const pdf=Buffer.from('%PDF-1.7\nSynthetic deployment fixture\n%%EOF');
  const audio=Buffer.concat([Buffer.from('ID3'),Buffer.alloc(1200,5)]);
  const clip='synthetic-'+digest(audio).slice(0,12)+'.mp3';
  const text='Synthetic guide fixture only.';
  const manifest={version:1,clips:{one:{file:clip,bytes:audio.length,sha256:digest(audio),textSha256:digest(Buffer.from(text))}}};
  put('data/athar-jv-month-timeline.json',{overview:{title:'Synthetic presentation'},months:[],gates:[]});
  put('guide-script.json',[{n:1,title:'Fixture',steps:[{id:'one',text,boxes:[]}]}]);
  put('presentation-config.json',{suggestedQuestions:[],deck:{title:'Fixture deck',pages:[{n:1,title:'Fixture'}]}});
  put('data/deck-pdf.base64.json',{name:'fixture.pdf',pages:1,bytes:pdf.length,sha256:digest(pdf),base64:pdf.toString('base64')});
  put('data/guide-audio.base64.json',{manifest,files:{[clip]:{bytes:audio.length,sha256:digest(audio),base64:audio.toString('base64')}}});
  process.env.ATHAR_PRIVATE_PRESENTATION='1'; process.env.ATHAR_PRESENTATION_DIR=folder;
  delete process.env.ATHAR_CONFIG_FILE; delete process.env.ATHAR_REVIEW_PASSPHRASE; delete process.env.ATHAR_SESSION_SECRET;
  if(configured){process.env.ATHAR_REVIEW_PASSPHRASE='synthetic-test-only';process.env.ATHAR_SESSION_SECRET='synthetic-signing-material-more-than-32-chars';}
  const api=createApiApp({presentationPreview:preview}),app=express();
  app.use(api); app.use(privatePresentation(api.locals.reviewAccess,{presentationPreview:preview}));
  app.use(['/deck','/guide-audio'],api.locals.presentationReadAccess);
  app.use(guideAudioMiddleware());app.use(deckPdfMiddleware());
  app.get('/',(req,res)=>res.type('html').send('<main>Fixture application</main>'));
  app.get('/assets/app.js',(req,res)=>res.type('js').send('/* fixture application */'));
  app.get('*',(req,res)=>res.status(404).json({code:'not_found'}));
  const server=app.listen(0,'127.0.0.1'); await once(server,'listening');
  const base='http://127.0.0.1:'+server.address().port;
  const request=(p,options={})=>fetch(base+p,options);
  const close=async()=>{server.closeAllConnections();await new Promise(r=>server.close(r));for(const k of keys){if(prior[k]===undefined)delete process.env[k];else process.env[k]=prior[k];}fs.rmSync(folder,{recursive:true,force:true});};
  return {request,base,close,pdf,audio,clip};
}

test('explicit preview serves presentation reads without review configuration files',async()=>{
 const f=await fixture({preview:true});try {
  for(const p of ['/','/assets/app.js','/api/presentation','/api/guide/config','/guide-audio/manifest.json']) {const r=await f.request(p);assert.equal(r.status,200,p);assert.equal(r.headers.get('set-cookie'),null);assert.match(r.headers.get('cache-control'),/no-store/);}
  const data=await (await f.request('/api/presentation')).json();assert.equal(data.deck.sha256,digest(f.pdf));
  const pdf=await f.request('/deck/fixture.pdf');assert.equal(pdf.headers.get('content-type'),'application/pdf');assert.deepEqual(Buffer.from(await pdf.arrayBuffer()),f.pdf);
  const a=await f.request('/guide-audio/'+f.clip);assert.equal(a.status,200);assert.match(a.headers.get('content-type'),/audio\/mpeg/);assert.deepEqual(Buffer.from(await a.arrayBuffer()),f.audio);
  const state=await (await f.request('/api/access')).json();assert.equal(state.authenticated,false);assert.equal(state.configured,false);
 } finally {await f.close();}
});
test('preview does not promote visitors to reviewers or allow protected writes',async()=>{
 for(const configured of [false,true]){const f=await fixture({preview:true,configured});try{
  for(const p of ['/api/documents','/api/citations/src-unknown','/api/sources/unknown'])assert.equal((await f.request(p)).status,configured?401:503,p);
  for(const p of ['/api/chat/session','/api/chat/query','/api/voice/text-turn','/api/guide/tts']){const r=await f.request(p,{method:'POST',headers:{'content-type':'application/json',Origin:f.base},body:'{}'});assert.equal(r.status,configured?401:503,p);}
  assert.equal((await f.request('/qa/private-proof.png')).status,401);
 }finally{await f.close();}}
});
test('missing credentials do not enable preview on default production entrypoint',async()=>{
 const f=await fixture();try{
  const r=await f.request('/');assert.match(await r.text(),/Review access code/);
  assert.equal((await f.request('/api/presentation')).status,503);
  assert.equal((await f.request('/deck/fixture.pdf')).status,401);
  assert.equal((await f.request('/assets/app.js')).status,401);
 }finally{await f.close();}
});
test('Host, forwarded headers, cookies and query parameters cannot select preview mode',async()=>{
 const f=await fixture({configured:true});try{
  const headers={Host:'sb-test.vercel.run','X-Forwarded-Host':'sb-test.vercel.run','X-Forwarded-Proto':'https','X-Athar-Preview':'1',Cookie:'athar_preview=true'};
  for(const p of ['/api/presentation?preview=true','/deck/fixture.pdf?presentationPreview=1','/assets/app.js'])assert.equal((await f.request(p,{headers})).status,401,p);
 }finally{await f.close();}
});
test('production reviewer login, presentation access and CSRF protection are unchanged',async()=>{
 const f=await fixture({configured:true});try{
  const login=await f.request('/api/access',{method:'POST',headers:{Origin:f.base,'Content-Type':'application/json'},body:JSON.stringify({passphrase:'synthetic-test-only'})});assert.equal(login.status,200);
  const cookie=login.headers.get('set-cookie').split(';')[0];
  assert.equal((await f.request('/api/presentation',{headers:{Cookie:cookie}})).status,200);
  assert.equal((await f.request('/deck/fixture.pdf',{headers:{Cookie:cookie}})).status,200);
  const denied=await f.request('/api/chat/session',{method:'POST',headers:{Origin:'https://foreign.invalid',Cookie:cookie,'Content-Type':'application/json'},body:'{}'});assert.equal(denied.status,403);
 }finally{await f.close();}
});
