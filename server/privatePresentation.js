// Protect the existing presentation, derived timeline and bundle at the host boundary.
// The login shell contains no business content, provider key, source metadata or access token.
// Explicit server-start option; never inferred from missing secrets or request headers.
// This publishes presentation reads only and never authenticates a reviewer.
export function presentationReadAccess(access, { presentationPreview = false } = {}) {
  return (req, res, next) => {
    if (presentationPreview === true && (req.method === 'GET' || req.method === 'HEAD')) {
      res.setHeader('Cache-Control', 'private, no-store');
      return next();
    }
    return access.requireAccess(req, res, next);
  };
}

export function privatePresentation(access, { presentationPreview = false } = {}) {
  return (req, res, next) => {
    const pathname = req.path || String(req.url || '').split('?')[0];
    // Keep the preview exception confined to existing read-only deck/player assets.
    if (presentationPreview === true && (req.method === 'GET' || req.method === 'HEAD') &&
        /^(?:\/|\/index\.html|\/favicon\.ico|\/(?:assets|deck|guide-audio)\/[^/]+)$/.test(pathname)) {
      res.setHeader('Cache-Control', 'private, no-store');
      return next();
    }
    if (process.env.ATHAR_PRIVATE_PRESENTATION !== '1' || access.read(req)) {
      if (process.env.ATHAR_PRIVATE_PRESENTATION === '1') {
        res.setHeader('Cache-Control', 'private, no-store');
        res.setHeader('Vary', 'Cookie');
      }
      return next();
    }
    res.setHeader('Cache-Control', 'private, no-store');
    res.setHeader('Vary', 'Cookie');
    if ((req.path === '/' || req.path === '/index.html') && req.method === 'GET') {
      return res.status(200).type('html').send(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Private review</title><style>body{font:16px system-ui;background:#f7f5f0;color:#292621;margin:0;display:grid;place-items:center;min-height:100vh}main{box-sizing:border-box;max-width:420px;width:calc(100% - 32px);padding:28px;border:1px solid #ded8ce;border-radius:12px;background:white;box-shadow:0 12px 30px #00000008}h1{font:30px Georgia;margin-top:0}p{line-height:1.6;color:#625b50}label{display:block;font-weight:600;font-size:14px;margin-bottom:8px}input,button{box-sizing:border-box;min-height:48px;border-radius:6px;width:100%;font:inherit}input{border:1px solid #cfc7b7;padding:10px}button{margin-top:14px;background:#292621;color:white;border:0;cursor:pointer}:focus-visible{outline:3px solid #886020;outline-offset:3px}#message{color:#963b31;font-size:14px}</style></head><body><main><h1>Private review</h1><p>The presentation and original documents require authorized reviewer access.</p><form id="access-form"><label for="access-code">Review access code</label><input id="access-code" name="passphrase" type="password" autocomplete="current-password" required><button type="submit">Open workspace</button><p id="message" role="alert"></p></form><p>Use the review code supplied by the workspace owner—not an AI-provider API key.</p><p id="framed" hidden>Embedded view. If sign-in does not persist here, <a id="open-tab" href="" target="_blank" rel="noopener">open the workspace in a new tab</a>.</p></main><script>(function(){var framed=false;try{framed=window.top!==window.self;}catch(e){framed=true;}if(framed){var note=document.getElementById('framed'),link=document.getElementById('open-tab');link.href=location.href;note.hidden=false;}document.getElementById('access-form').addEventListener('submit',async event=>{event.preventDefault();const input=document.getElementById('access-code'),button=event.target.querySelector('button'),message=document.getElementById('message');button.disabled=true;message.textContent='';try{const response=await fetch('/api/access',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'same-origin',body:JSON.stringify({passphrase:input.value})});input.value='';if(!response.ok)throw Error('denied');const result=await response.json();if(!result.authenticated)throw Error('denied');const check=await fetch('/api/access',{credentials:'same-origin',cache:'no-store'}).then(r=>r.json()).catch(()=>({}));if(!check.authenticated){message.textContent='Signed in, but this browser did not keep the session cookie (cookies are often blocked inside embedded frames). Open the workspace in a new tab and sign in there.';return;}location.reload();}catch(error){input.value='';message.textContent=error&&error.message==='denied'?'Access was not accepted. Check your review code and try again.':'Sign-in could not be completed. Check your connection and try again.';}finally{button.disabled=false;}});})();</script></body></html>`);
    }
    return res.status(401).json({ code: 'access_required', message: 'Reviewer access is required.' });
  };
}
