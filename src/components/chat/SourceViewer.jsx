import React, { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { getSourceLocation } from '../../lib/api.js';
import './source-viewer.css';

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;
const printable = (value) => value == null ? 'Not recorded' : typeof value === 'object' ? JSON.stringify(value) : String(value);
const formulaText = (formula) => typeof formula === 'string' ? formula : formula?.text || formula?.resolved || formula?.translated || formula?.original || (formula ? JSON.stringify(formula) : '');
const displayCell = (cell) => cell.availability === 'missing-formula-cache' ? 'Saved result unavailable' : cell.value == null ? 'Blank / not recorded' : printable(cell.value);
const columnName = (n) => { let s=''; for (;n>0;n=Math.floor((n-1)/26)) s=String.fromCharCode(65+(n-1)%26)+s; return s; };

function SourcePdf({ view, onUnauthorized }) {
  const canvas = useRef(null), holder = useRef(null), version = useRef(0);
  const [width, setWidth] = useState(0), [state, setState] = useState('loading'), [bounds, setBounds] = useState(null);
  useEffect(() => { const el=holder.current; if(!el)return; const ro=new ResizeObserver(()=>setWidth(el.clientWidth));ro.observe(el);setWidth(el.clientWidth);return()=>ro.disconnect(); }, []);
  useEffect(() => {
    if (!view.preview?.available || !width) return;
    let cancelled=false, documentTask, renderTask;
    const revision=++version.current;setState('loading');setBounds(null);
    const controller = new AbortController();
    (async()=>{
      try {
        const res=await fetch(view.preview.url,{credentials:'same-origin',cache:'no-store',signal:controller.signal});
        if(res.status===401){onUnauthorized?.();throw new Error('Access expired');}
        if(!res.ok||!res.headers.get('content-type')?.includes('application/pdf'))throw new Error('Preview unavailable');
        const bytes=new Uint8Array(await res.arrayBuffer());
        if(crypto.subtle&&view.preview.sha256){const hash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(n=>n.toString(16).padStart(2,'0')).join('');if(hash!==view.preview.sha256)throw new Error('Preview integrity mismatch');}
        if(cancelled)return;
        documentTask=pdfjsLib.getDocument({data:bytes});const pdf=await documentTask.promise;
        const page=await pdf.getPage(view.previewPage);const original=page.getViewport({scale:1});const scale=Math.max(0.1,(width-2)/original.width);const viewport=page.getViewport({scale});
        if(cancelled||revision!==version.current||!canvas.current)return;
        const el=canvas.current,dpr=Math.min(devicePixelRatio||1,2);el.width=Math.floor(viewport.width*dpr);el.height=Math.floor(viewport.height*dpr);el.style.width=`${Math.floor(viewport.width)}px`;el.style.height=`${Math.floor(viewport.height)}px`;
        renderTask=page.render({canvasContext:el.getContext('2d'),viewport,transform:dpr===1?null:[dpr,0,0,dpr,0,0]});await renderTask.promise;
        if(cancelled||revision!==version.current)return;
        el.dataset.page=String(view.previewPage);setBounds({width:original.width,height:original.height});setState('ready');
      } catch(error){if(!cancelled&&error.name!=='AbortError'&&error.name!=='RenderingCancelledException')setState('error');}
    })();
    return()=>{cancelled=true;controller.abort();renderTask?.cancel?.();documentTask?.destroy?.();};
  },[view.preview?.url,view.preview?.sha256,view.previewPage,width,onUnauthorized]);
  return <div className="source-pdf" ref={holder} data-testid="source-pdf" data-state={view.preview?.available ? state : 'unavailable'}>
    {!view.preview?.available ? <p role="status">This source preview is unavailable. The original and extracted source records remain accessible; no substitute slide is displayed.</p> : <>
      {state==='loading'&&<p role="status">Opening the cited {view.kind==='pptx'?'slide':'page'}…</p>}
      {state==='error'&&<p role="alert">The protected preview could not be opened. Retry the source below.</p>}
      <div className="source-pdf-page"><canvas ref={canvas} aria-label={`Source ${view.kind==='pptx'?'slide':'page'} ${view.previewPage}`} data-testid="source-pdf-canvas" />
        {state==='ready'&&bounds&&view.highlights?.visible&&(view.highlights.bboxes||[]).map((box,i)=><span key={i} className="source-box" aria-hidden="true" style={{left:`${box[0]/bounds.width*100}%`,top:`${box[1]/bounds.height*100}%`,width:`${(box[2]-box[0])/bounds.width*100}%`,height:`${(box[3]-box[1])/bounds.height*100}%`}} />)}
      </div>
      <p className="source-note">{view.preview.derivative ? 'Protected rendering of the original PowerPoint; slide count and file identity verified.' : 'Original PDF, opened at its cited page.'} Small print is also available in the source excerpt.</p>
    </>}
  </div>;
}

function Worksheet({ view }) {
  const [selected,setSelected]=useState(null);
  useEffect(()=>setSelected(null),[view.location.sheet,view.location.range]);
  const columns=Array.from({length:view.bounds.maxColumn-view.bounds.minColumn+1},(_,i)=>view.bounds.minColumn+i);
  return <>
    <div className="source-sheet-scroll" role="region" aria-label={`${view.location.sheet} cells ${view.location.range}. Scroll horizontally within the worksheet.`} tabIndex={0} data-testid="source-sheet-scroll">
      <table className="source-sheet" data-testid="source-sheet"><caption>{view.location.sheet}!{view.location.range}</caption><thead><tr><th scope="col">Row</th>{columns.map(n=><th scope="col" key={n}>{columnName(n)}</th>)}</tr></thead>
        <tbody>{view.rows.map(row=><tr key={row.row}><th scope="row">{row.row}</th>{columns.map(col=>{const cell=row.cells.find(c=>c.columnIndex===col);const address=`${columnName(col)}${row.row}`;return <td key={col} data-cell={address} data-highlighted={cell?.highlight?'true':'false'} className={cell?.highlight?'is-cited':''}>{cell?<button type="button" className="source-cell" onClick={()=>setSelected(cell)} aria-label={`${address}: ${displayCell(cell)}. Inspect original value and formula.`}>{displayCell(cell)}{cell.formula&&<span className="source-formula-tag">ƒx</span>}</button>:<span className="source-unrecorded">Not recorded</span>}</td>;})}</tr>)}</tbody>
      </table>
    </div>
    {view.windowed&&<p className="source-note">Showing a bounded window of the cited range. Navigate cells above; the full original has not been truncated.</p>}
    {selected&&<section className="source-cell-details" aria-label={`Source record ${selected.address}`} data-testid="source-cell-details"><h4>{selected.sheet}!{selected.address}</h4><dl><dt>Saved source value</dt><dd>{displayCell(selected)}</dd><dt>Raw stored value</dt><dd>{printable(selected.rawValue)}</dd><dt>Number format</dt><dd>{printable(selected.numberFormat)}</dd><dt>Formula (not recalculated)</dt><dd><code>{formulaText(selected.formula)||'No formula in this record'}</code></dd><dt>Cached result</dt><dd>{printable(selected.cache)}</dd><dt>Display provenance</dt><dd>{printable(selected.displayValue)}</dd></dl></section>}
    {view.headerRecords?.length>0&&<details className="source-header-records"><summary>Source headers and units ({view.headerRecords.length})</summary><ul>{view.headerRecords.map(c=><li key={c.address}><b>{c.address}</b> — {displayCell(c)}</li>)}</ul></details>}
    <p className="source-note">Gold cells belong to the cited range. Saved values, formulas and display formats are separate records. Missing formula caches are unavailable—not zero.</p>
  </>;
}

export default function SourceViewer({source,citationId,onClose,onAuthRequired}) {
  const [view,setView]=useState(null),[busy,setBusy]=useState(true),[error,setError]=useState(''),[target,setTarget]=useState({}),[retry,setRetry]=useState(0);
  const [sheet,setSheet]=useState(''),[range,setRange]=useState('');
  const authRef=useRef(onAuthRequired);authRef.current=onAuthRequired;
  const unauthorized=useRef(()=>authRef.current?.()).current;
  useEffect(()=>{setTarget({});setView(null);},[citationId]);
  useEffect(()=>{
    let alive=true;setBusy(true);setError('');
    getSourceLocation(citationId,target).then(data=>{if(!alive)return;setView(data);setSheet(data.location.sheet||'');setRange(data.location.range||'');}).catch(e=>{if(!alive)return;if(e.status===401)unauthorized();setError(e.status===400?'That location is outside the source or too large. Choose up to 200 cells.':'The protected source could not be opened. Retry without changing the source.');}).finally(()=>alive&&setBusy(false));
    return()=>{alive=false;};
  },[citationId,target,retry,unauthorized]);
  const originalUrl = typeof source.originalUrl === 'string' && /^\/api\/sources\/[a-f0-9]{64}$/.test(source.originalUrl) ? source.originalUrl : null;
  // The executive deck may be provisioned as its exact PDF rendering: its pages ARE the slides.
  const pagedDeck=source?.documentSlug==='executive-presentation'&&(view?.kind==='pdf'||source?.kind==='pdf');
  const pageWord=pagedDeck?'Slide':'Page';
  const locationLabel=view?.location.sheet?`${view.location.sheet}!${view.location.range}`:view?.location.page?`${pageWord} ${view.location.page}`:view?.location.slide?`Slide ${view.location.slide}`:'';
  const key=view?.kind==='pptx'?'slide':'page';const max=view?.availableLocations?.[key==='slide'?'slideCount':'pageCount']||0;const current=view?.location?.[key]||1;
  const navigate=(location)=>{if(!busy)setTarget(location);};
  const canMoveRows=(direction)=>{const b=view?.bounds;const s=view?.availableLocations?.sheets?.find(s=>s.name===sheet);return !busy&&!!b&&!!s?.bounds&&(direction<0?b.minRow>s.bounds.minRow:b.maxRow<s.bounds.maxRow);};
  const moveRows=(direction)=>{if(!canMoveRows(direction))return;const b=view.bounds;const delta=(b.maxRow-b.minRow+1)*direction;const sheetInfo=view.availableLocations.sheets.find(s=>s.name===sheet);const top=Math.max(sheetInfo.bounds.minRow,Math.min(sheetInfo.bounds.maxRow-(b.maxRow-b.minRow),b.minRow+delta));setTarget({sheet,range:`${columnName(b.minColumn)}${top}:${columnName(b.maxColumn)}${top+b.maxRow-b.minRow}`});};
  return <div className="source-viewer" data-testid="source-viewer" data-kind={view?.kind||''} data-location={locationLabel} aria-busy={busy}>
    <header><div><p className="source-kicker">Original source</p><h3 id="citation-panel-title">{source.title}</h3><p data-testid="source-location">{locationLabel||source.label}</p></div><button className="icon-btn" onClick={onClose} aria-label="Close source excerpt">×</button></header>
    {busy&&<p role="status">Loading the protected cited location…</p>}
    {error&&<p role="alert">{error}</p>}
    {view&&<>
      {view.kind==='xlsx'?<form className="source-nav" onSubmit={e=>{e.preventDefault();navigate({sheet,range});}}><label>Worksheet<select value={sheet} aria-disabled={busy} onChange={e=>{if(!busy){setSheet(e.target.value);navigate({sheet:e.target.value});}}} data-testid="source-sheet-select">{view.availableLocations.sheets.map(s=><option key={s.name} value={s.name}>{s.name}{s.state==='hidden'?' (hidden in original)':''}</option>)}</select></label><label>Cell range<input value={range} aria-disabled={busy} onChange={e=>{if(!busy)setRange(e.target.value);}} aria-label="Source cell range" data-testid="source-range-input" /></label><button className="btn small" type="submit" aria-disabled={busy}>Go to cells</button><button className="btn small" type="button" onClick={()=>moveRows(-1)} aria-disabled={!canMoveRows(-1)} aria-label="Previous source rows">↑</button><button className="btn small" type="button" onClick={()=>moveRows(1)} aria-disabled={!canMoveRows(1)} aria-label="Next source rows">↓</button></form>:<div className="source-nav" role="group" aria-label="Source page navigation"><button className="btn small" aria-disabled={busy||current<=1} onClick={()=>{if(current>1)navigate({[key]:current-1});}} aria-label={`Previous source ${key}`}>←</button><label>{key==='slide'||pagedDeck?'Slide':'Page'}<select aria-label={`Source ${key}`} value={busy ? target[key]||current : current} aria-disabled={busy} onChange={e=>navigate({[key]:Number(e.target.value)})} data-testid="source-page-select">{Array.from({length:max},(_,i)=><option key={i} value={i+1}>{i+1} of {max}</option>)}</select></label><button className="btn small" aria-disabled={busy||current>=max} onClick={()=>{if(current<max)navigate({[key]:current+1});}} aria-label={`Next source ${key}`}>→</button></div>}
      <button className="btn small source-return" onClick={()=>navigate({})} aria-disabled={busy} data-testid="source-return-citation">Return to cited location</button>
      {view.renderer==='workbook'?<Worksheet view={view}/>:<SourcePdf view={view} onUnauthorized={unauthorized}/>}
      <details open={view.kind!=='xlsx'} className="source-excerpt"><summary>Exact cited excerpt · {source.label}</summary><blockquote>{source.excerpt}</blockquote></details>
      {!!view.limitations?.length&&<details><summary>Source extraction notes</summary><ul>{view.limitations.map((text,i)=><li key={i}>{text}</li>)}</ul></details>}
    </>}
    <div className="source-footer"><button className="btn small" onClick={()=>{if(!busy)setRetry(n=>n+1);}} aria-disabled={busy}>Retry source</button>{originalUrl&&<a href={originalUrl} className="btn small" download data-testid="citation-original">Download original</a>}</div>
  </div>;
}
