// Protect the existing presentation, derived timeline and bundle at the host boundary.
// The login shell contains no business content, provider key, source metadata or access token.
export function privatePresentation(access) {
  return (req, res, next) => {
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
      return res.status(200).type('html').send(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Private review</title><style>body{font:16px system-ui;background:#f7f5f0;color:#292621;margin:0;display:grid;place-items:center;min-height:100vh}main{box-sizing:border-box;max-width:420px;width:calc(100% - 32px);padding:28px;border:1px solid #ded8ce;border-radius:12px;background:white;box-shadow:0 12px 30px #00000008}h1{font:30px Georgia;margin-top:0}p{line-height:1.6;color:#625b50}label{display:block;font-weight:600;font-size:14px;margin-bottom:8px}input,button{box-sizing:border-box;min-height:48px;border-radius:6px;width:100%;font:inherit}input{border:1px solid #cfc7b7;padding:10px}button{margin-top:14px;background:#292621;color:white;border:0;cursor:pointer}:focus-visible{outline:3px solid #886020;outline-offset:3px}#message{color:#963b31;font-size:14px}</style></head><body><main><h1>Private review</h1><p>The presentation and original documents require authorized reviewer access.</p><form id="access-form"><label for="access-code">Review access code</label><input id="access-code" name="passphrase" type="password" autocomplete="current-password" required><button type="submit">Open workspace</button><p id="message" role="alert"></p></form><p>Use the review code supplied by the workspace owner—not an AI-provider API key.</p></main><script>document.getElementById('access-form').addEventListener('submit',async event=>{event.preventDefault();const input=document.getElementById('access-code'),button=event.target.querySelector('button'),message=document.getElementById('message');button.disabled=true;message.textContent='';try{const response=await fetch('/api/access',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'same-origin',body:JSON.stringify({passphrase:input.value})});input.value='';if(!response.ok)throw Error();const result=await response.json();if(!result.authenticated)throw Error();location.reload();}catch{input.value='';message.textContent='Access was not accepted. Check your review code and try again.';}finally{button.disabled=false;}});</script></body></html>`);
    }
    return res.status(401).json({ code: 'access_required', message: 'Reviewer access is required.' });
  };
}
