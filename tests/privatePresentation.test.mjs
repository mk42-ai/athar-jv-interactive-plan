import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { once } from 'node:events';
import { privatePresentation } from '../server/privatePresentation.js';
import { createAccessControl } from '../server/access.js';

async function fixture() {
  const old = process.env.ATHAR_PRIVATE_PRESENTATION;
  process.env.ATHAR_PRIVATE_PRESENTATION = '1';
  const access=createAccessControl({passphrase:'synthetic-review-code',signingKey:'synthetic-signing-key-at-least-thirty-two-characters'});
  const app=express();app.use('/api/access',access.router);app.use(privatePresentation(access));
  app.get('*',(req,res)=>res.json({content:'SYNTHETIC_CONFIDENTIAL_TEST_ONLY'}));
  const server=app.listen(0,'127.0.0.1');await once(server,'listening');const base=`http://127.0.0.1:${server.address().port}`;
  const close=async()=>{server.closeAllConnections();await new Promise(r=>server.close(r));if(old===undefined)delete process.env.ATHAR_PRIVATE_PRESENTATION;else process.env.ATHAR_PRIVATE_PRESENTATION=old;};
  return{base,close};
}
test('private deployment keeps bundle, presentation, media and QA behind review access',async()=>{
  const f=await fixture();try{
    const landing=await fetch(f.base);assert.equal(landing.status,200);const html=await landing.text();assert.ok(html.includes('Review access code'));assert.ok(!html.includes('SYNTHETIC_CONFIDENTIAL_TEST_ONLY'));
    for(const route of ['/assets/app.js','/deck/original.pdf','/guide-audio/manifest.json','/qa/figure.png']){const r=await fetch(f.base+route);assert.equal(r.status,401);assert.match(r.headers.get('cache-control'),/private, no-store/);assert.ok(!(await r.text()).includes('SYNTHETIC_CONFIDENTIAL_TEST_ONLY'));}
  }finally{await f.close();}
});
test('authorized private presentation remains available without disclosing access credential',async()=>{
  const f=await fixture();try{
    const login=await fetch(f.base+'/api/access',{method:'POST',headers:{Origin:f.base,'Content-Type':'application/json'},body:JSON.stringify({passphrase:'synthetic-review-code'})});
    assert.equal(login.status,200);const cookie=login.headers.get('set-cookie').split(';')[0];assert.match(login.headers.get('set-cookie'),/HttpOnly/);
    const r=await fetch(f.base+'/assets/app.js',{headers:{Cookie:cookie}});assert.equal(r.status,200);assert.match(r.headers.get('cache-control'),/private, no-store/);const body=await r.text();assert.ok(body.includes('SYNTHETIC_CONFIDENTIAL_TEST_ONLY'));assert.ok(!body.includes('synthetic-review-code'));
  }finally{await f.close();}
});

test('public mode (ATHAR_PRIVATE_PRESENTATION unset/0): no login shell, presentation payload routes open, AI routes still gated', async () => {
  const { presentationAccess, presentationMode } = await import('../server/privatePresentation.js');
  const old = process.env.ATHAR_PRIVATE_PRESENTATION;
  process.env.ATHAR_PRIVATE_PRESENTATION = '0';
  const access = createAccessControl({ passphrase: 'synthetic-review-code', signingKey: 'synthetic-signing-key-at-least-thirty-two-characters' });
  const app = express();
  app.use('/api/access', access.router);
  app.use(privatePresentation(access));
  app.use(['/deck', '/guide-audio', '/api/presentation', '/api/guide'], presentationAccess(access));
  app.get('/api/documents', access.requireAccess, (req, res) => res.json({ ai: 'GATED_SYNTHETIC' }));
  app.get('*', (req, res) => res.json({ content: 'PUBLIC_PRESENTATION_SYNTHETIC', path: req.path }));
  const server = app.listen(0, '127.0.0.1'); await once(server, 'listening'); const base = `http://127.0.0.1:${server.address().port}`;
  try {
    assert.equal(presentationMode(), 'public');
    const landing = await fetch(base); assert.equal(landing.status, 200);
    const html = await landing.text(); assert.ok(!html.includes('Review access code')); assert.ok(html.includes('PUBLIC_PRESENTATION_SYNTHETIC'));
    for (const route of ['/deck/original.pdf', '/guide-audio/manifest.json', '/api/presentation', '/api/guide/config', '/assets/app.js']) {
      const r = await fetch(base + route); assert.equal(r.status, 200, route);
      if (route !== '/assets/app.js') assert.equal(r.headers.get('x-presentation-mode'), 'public', route);
      assert.ok((await r.text()).includes('PUBLIC_PRESENTATION_SYNTHETIC'), route);
    }
    const ai = await fetch(base + '/api/documents'); assert.equal(ai.status, 401); assert.ok(!(await ai.text()).includes('GATED_SYNTHETIC'));
    process.env.ATHAR_PRIVATE_PRESENTATION = '1';
    assert.equal(presentationMode(), 'private');
    for (const route of ['/deck/original.pdf', '/api/presentation']) { const r = await fetch(base + route); assert.equal(r.status, 401, route); }
    const shell = await fetch(base); assert.ok((await shell.text()).includes('Review access code'));
  } finally {
    server.closeAllConnections(); await new Promise(r => server.close(r));
    if (old === undefined) delete process.env.ATHAR_PRIVATE_PRESENTATION; else process.env.ATHAR_PRIVATE_PRESENTATION = old;
  }
});

test('login shell (private mode) offers a new-tab link when embedded and verifies the cookie after sign-in', async () => {
  const f = await fixture(); try {
    const html = await (await fetch(f.base)).text();
    assert.ok(html.includes('id="framed" hidden'));
    assert.ok(html.includes('open the workspace in a new tab'));
    assert.ok(html.includes("fetch('/api/access',{credentials:'same-origin',cache:'no-store'})"));
  } finally { await f.close(); }
});
