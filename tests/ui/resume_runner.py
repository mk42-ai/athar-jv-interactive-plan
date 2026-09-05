#!/usr/bin/env python3
"""Current-UI QA; owned adapter over existing run.py/proxy.py (no disk edits).

Smoke never sends an AI question. Sources mounts the real SourceViewer through
an explicitly synthetic delegated citation link with runtime corpus IDs. Live
ALSO sends all three exact starters and one This-document question, clicking
every returned citation via its real answer anchor. Raw source text,
raw CLI reports, credentials and cookies are never written to evidence.

Run from the persistent working directory so .ui-proof is uploaded normally.
Required secrets are read ONLY by the existing run.execute/test_origin broker at
execution time. --dry-run/--self-test do not read credentials, corpus or network.
"""
from __future__ import annotations
import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import sys
from urllib.parse import parse_qsl, urlsplit
import run
import proxy

HERE=Path(__file__).resolve().parent
SIZES=('360x800','390x844','834x1112','1440x900','1275x451')
SOURCE_PATH=re.compile(r'/api/citations/[A-Za-z0-9_-]{1,160}/view\Z')
PREVIEW_PATH=re.compile(r'/api/sources/[A-Za-z0-9_-]{1,160}/preview\Z')
BASE_CHECKS=('idle-guide-rail-present','idle-provider-metadata-hidden','resume-mode-allowed',
 'provider-hidden-by-default','provider-information-disclosure','provider-hidden-metadata-preserved',
 'transcript-all-21-moments','transcript-exact-original-text','transcript-current-moment','responsive-tabs-breakpoint',
 'transcript-label-visible-and-bounded','guide-info-escape-and-focus','guide-small-gold-text-contrast',
 'four-real-documents','exact-three-starters','starter-0-prefill-no-send','starter-1-prefill-no-send',
 'starter-2-prefill-no-send','focused-composer-layout','ask-slide-current-document',
 'all-scope-clears-slide','this-scope-restores-document','scope-draft-changes-no-request','proof-clean-session')
MOBILE_CHECKS=('mobile-tabs-aria','mobile-hidden-guide-still-mounted','mobile-hidden-presentation-not-focusable',
 'mobile-guide-time-index-preserved','mobile-chat-mounted-hidden','mobile-chat-draft-preserved',
 'mobile-shared-transport','mobile-hidden-guide-play-advances','mobile-hidden-guide-pause-freezes',
 'mobile-synthetic-keyboard-home','mobile-synthetic-keyboard-end','mobile-ask-focus-targets-44',
 'chat-open-expanded:mobile-views-exclusive','chat-open-expanded:mobile-preserves-mounted-guide')
STAGE_CONTRACT=json.loads((HERE/'assertions-contract.json').read_text())
ORIGINAL_PATH=proxy.real_path
ORIGINAL_STATE=proxy.RealState
LIVE_QUERIES=('scope-this','live-starter-0','scope-all','live-starter-2')
QUESTION_CONTRACT={
 'Summarize this document with source citations.':'scope-this',
 'Compare the UAE base case with international expansion.':'live-starter-0',
 'What capital decisions still need agreement?':'scope-all',
 'Which implementation milestones depend on those decisions?':'live-starter-2',
}
LIVE_QUERY_CHECKS=('exact-question-draft','exact-question-request','send-ready','request-completed','real-request','citations-real','all-returned-citations-opened')
LIVE_CHECKS=('live-executive-selected','scope-this-selected-executive','live-real-session-reset',
 'live-starter-0-sent-and-verified','live-starter-1-sent-and-verified','live-starter-2-sent-and-verified',
 'all-live-queries-completed','dependency-followup-same-conversation','dependency-grounding-metadata',
 'dependency-missing-statement-when-absent','live-source-navigation-control','live-source-navigation-initial-focus',
 'live-source-navigated','live-source-navigation-retains-focus','live-source-return-exact-citation',
 'live-source-escape-retains-chat-and-trigger')
CITATION_COMMON=('actual-inline-trigger','viewer-open','original-identity-location','original-excerpt','source-rendered','exact-location-label','verified')



def bounded_source_path(target):
    """Only GET/HEAD path policy is widened; POST and cookies remain unchanged.

    Encoded sheet names are confined to query VALUEs, never route/path/host.
    Unknown/duplicate keys, mixed kinds, huge ranges, controls and nested escapes
    are rejected here, before the actual server independently validates bounds.
    """
    u=urlsplit(target)
    if not SOURCE_PATH.fullmatch(u.path):
        if PREVIEW_PATH.fullmatch(u.path) and not u.query:
            return ORIGINAL_PATH(target)
        return ORIGINAL_PATH(target)
    if u.scheme or u.netloc or u.fragment or not target.startswith('/') or len(target)>1200:
        return None
    if ORIGINAL_PATH(u.path) is None or re.search(r'%(?![0-9A-Fa-f]{2})',u.query):
        return None
    try:
        pairs=parse_qsl(u.query,keep_blank_values=True,strict_parsing=True,max_num_fields=2,errors='strict') if u.query else []
    except (ValueError,UnicodeError): return None
    values=dict(pairs)
    if len(values)!=len(pairs) or not set(values)<={'page','slide','sheet','range'}: return None
    if set(values)&{'page','slide'}:
        if len(values)!=1 or not re.fullmatch(r'[1-9][0-9]{0,6}',next(iter(values.values()))): return None
    for key,value in values.items():
        if key=='sheet' and (not value or len(value)>128 or any(ord(c)<32 for c in value) or '%' in value): return None
        if key=='range':
            m=re.fullmatch(r'([A-Z]{1,3})([1-9][0-9]{0,6})(?::([A-Z]{1,3})([1-9][0-9]{0,6}))?',value)
            if not m:return None
            col=lambda s: sum((ord(c)-64)*26**i for i,c in enumerate(reversed(s)))
            a,b,c,d=m.groups();x,y=col(a),int(b);xx,yy=col(c or a),int(d or b)
            if not (x<=xx<=16384 and y<=yy<=1048576 and (xx-x+1)*(yy-y+1)<=200):return None
    return u.path


class ResumeState(ORIGINAL_STATE):
    def __init__(self,*args,**kwargs):
        super().__init__(*args,**kwargs)
        self._qa_queries=[]
        self._qa_previous_session=None
        self._qa_previous_question=None
        self._qa_stream_tails={}

    def begin(self,method,path,payload):
        item=super().begin(method,path,payload)
        if SOURCE_PATH.fullmatch(path): item['sourceView']=True
        if PREVIEW_PATH.fullmatch(path): item['sourcePreview']=True
        if method=='POST' and isinstance(payload,(dict,bytes,str)):
            # Only request-contract IDs and comparison booleans leave the broker.
            # A missing conversation identifier fails closed, never infers continuity.
            body=payload
            if isinstance(body,(bytes,str)):
                try:body=json.loads(body)
                except (ValueError,TypeError):body={}
            if not isinstance(body,dict):body={}
            question=body.get('question',body.get('query'))
            contract=QUESTION_CONTRACT.get(question) if isinstance(question,str) else None
            if not isinstance(question,str):return item
            session=body.get('sessionId',body.get('conversationId'))
            fingerprint=hashlib.sha256(session.encode()).digest() if isinstance(session,str) and session else None
            item.update(questionContractId=contract,
              sameConversationAsPrevious=fingerprint is not None and fingerprint==self._qa_previous_session,
              previousQueryWasCapitalStarter=self._qa_previous_question=='scope-all')
            self._qa_previous_session=fingerprint;self._qa_previous_question=contract
            self._qa_queries.append(item)
        return item
    def observe(self,item,raw,content_type):
        if not item.get('sourceView'):
            result=super().observe(item,raw,content_type)
            if item.get('kind')=='query' or 'questionContractId' in item:self._observe_grounding(item,raw)
            return result
        try:
            data=json.loads(raw)
            if not isinstance(data,dict):raise ValueError()
            if item.get('status')!=200:return
            safe=lambda v:isinstance(v,str) and bool(proxy.ID.fullmatch(v))
            loc=data.get('location') or {}
            with self.lock:
                item.update(citationId=data.get('citationId') if safe(data.get('citationId')) else None,
                  documentId=data.get('documentId') if safe(data.get('documentId')) else None,
                  sourceKind=data.get('kind') if data.get('kind') in ('pdf','pptx','xlsx') else 'unknown',
                  locationKeys=sorted(k for k in loc if k in ('page','slide','sheet','range')),
                  recordedCellCount=sum(len(row.get('cells',[])) for row in data.get('rows',[]) if isinstance(row,dict)),
                  previewAvailable=(data.get('preview') or {}).get('available') is True)
        except (ValueError,TypeError,AttributeError):item['metadataInvalid']=True

    def _observe_grounding(self,item,raw):
        # Process real JSON/SSE metadata only; never infer grounding from prose.
        # Fragment tails are private, bounded, and never enter summary/evidence.
        try:
            text=raw.decode('utf-8',errors='replace') if isinstance(raw,(bytes,bytearray)) else raw
            if not isinstance(text,str):return
            key=id(item);text=self._qa_stream_tails.pop(key,'')+text
            if len(text)>2_000_000:item['metadataInvalid']=True;return
            candidates=[]
            try:candidates.append(json.loads(text))
            except ValueError:
                lines=text.splitlines(keepends=True)
                for line in lines:
                    if line.startswith('data:'):
                        try:candidates.append(json.loads(line[5:].strip()))
                        except ValueError:
                            if not line.endswith(('\n','\r')):self._qa_stream_tails[key]=line
                    elif not line.endswith(('\n','\r')) and line.strip():self._qa_stream_tails[key]=line
            for data in candidates:
                if not isinstance(data,dict):continue
                for container in (data,data.get('metadata'),data.get('meta'),data.get('data')):
                    if not isinstance(container,dict):continue
                    grounding=container.get('grounding')
                    if isinstance(grounding,dict) and isinstance(grounding.get('dependencyEstablished'),bool):
                        item['groundingDependencyEstablished']=grounding['dependencyEstablished']
        except (ValueError,TypeError,AttributeError):item['metadataInvalid']=True

    def summary(self):
        result=super().summary()
        # Preserve the existing allow-listed probe format. Supplement only these
        # non-content fields even if the base summary has its own field filter.
        rows=[r for r in result.get('requests',[]) if r.get('kind')=='query' and r.get('method')=='POST']
        for row,item in zip(rows,self._qa_queries):
            for key in ('questionContractId','sameConversationAsPrevious','previousQueryWasCapitalStarter','groundingDependencyEstablished'):
                if key in item:row[key]=item[key]
        return result


def install_adapter():
    proxy.real_path=bounded_source_path
    proxy.REAL_DYNAMIC=re.compile(r'/api/(?:citations/[A-Za-z0-9_-]{1,160}(?:/view)?|sources/[A-Za-z0-9_-]{1,160}(?:/preview)?)\Z')
    proxy.RealState=ResumeState
    run.build_command=build_command


def expected_checks(config,size):
    keys=list(STAGE_CONTRACT['perInteraction'])+[f'{a}:{b}' for a in STAGE_CONTRACT['stages'] for b in STAGE_CONTRACT['perStage']]+list(BASE_CHECKS)
    if int(size.split('x')[0])<=640:keys+=MOBILE_CHECKS
    else:keys+=['desktop-tablet-resize-control','range-resize-value-and-layout','focused-resized-layout']
    mode=config['resumeMode']
    if mode!='live':keys+=['no-live-query-sent']
    if mode=='live':keys += list(LIVE_CHECKS)+[f'{stem}-{k}' for stem in LIVE_QUERIES for k in LIVE_QUERY_CHECKS]
    if mode in ('sources','live'):
        keys+=['source-fixtures-dynamic-all-kinds','all-source-cases-completed']
        for i,ref in enumerate(config['sourceRefs']):
            stem=f"source-{i}-{ref['kind']}-"
            suffix=['real-source-identity','viewer-ready','exact-excerpt','exact-location-label','controls-44','close-focus','return-to-citation']
            suffix+=['real-grid-cells','saved-values-not-recalculated','exact-cited-highlights','cell-record-detail','bounded-range-navigation','other-sheet-available','worksheet-navigation'] if ref['kind']=='xlsx' else ['protected-preview-available','actual-cited-page-rendered','navigation-page-available','page-navigation','protected-preview-real-http']
            keys += [stem+k for k in suffix]
    return keys


def contract_failures(data,expected):
    by={}
    for c in data.get('checks',[]):by.setdefault(c.get('id'),[]).append(c)
    failed=[k for k in expected if len(by.get(k,[]))!=1 or by[k][0].get('ok') is not True or not by[k][0].get('utc')]
    failed += [c.get('id','invalid-check') for c in data.get('checks',[]) if c.get('ok') is not True]
    # A broad wrapper must not pass when a dynamic citation/branch was skipped.
    # Derive required child checks only from count/ID/location metadata, not text.
    if 'all-live-queries-completed' in expected:
        completed=[a for a in data.get('actions',[]) if a.get('name')=='live-query-complete']
        if [a.get('query') for a in completed]!=list(LIVE_QUERIES) or any(a.get('allCitationsOpened') is not True for a in completed):
            failed.append('live-query-action-sequence')
        for stem in LIVE_QUERIES:
            records=by.get(stem+'-citations-real',[])
            count=records[0].get('detail',{}).get('count') if len(records)==1 else None
            if not isinstance(count,int) or isinstance(count,bool) or not 0<count<=100:
                failed.append(stem+'-citation-count-contract');continue
            wrapper=by.get(stem+'-all-returned-citations-opened',[])
            detail=wrapper[0].get('detail',{}) if len(wrapper)==1 else {}
            if detail.get('returnedCount')!=count or detail.get('openedCount')!=count:failed.append(stem+'-citation-count-match')
            actions=[a for a in data.get('actions',[]) if a.get('name')=='live-citation-complete' and a.get('query')==stem]
            if len(actions)!=count or sorted(a.get('index',-1) for a in actions)!=list(range(count)):
                failed.append(stem+'-all-citation-actions')
            for i in range(count):
                prefix=f'{stem}-citation-{i}-'
                identity=by.get(prefix+'original-identity-location',[])
                location=identity[0].get('detail',{}).get('location',{}) if len(identity)==1 else {}
                suffix=list(CITATION_COMMON)
                suffix+=['xlsx-bounds-highlights'] if isinstance(location,dict) and 'sheet' in location else ['pdf-preview-page','protected-preview-http']
                if not (stem==LIVE_QUERIES[0] and i==0):suffix+=['close-focus']
                for key in (prefix+k for k in suffix):
                    if len(by.get(key,[]))!=1 or by[key][0].get('ok') is not True or not by[key][0].get('utc'):failed.append(key)
                completed=[a for a in actions if a.get('index')==i]
                if len(identity)==1 and len(completed)==1 and identity[0].get('detail',{}).get('citationId')!=completed[0].get('citationId'):
                    failed.append(prefix+'identity-action-match')
        first=by.get('scope-this-citation-0-original-identity-location',[])
        loc=first[0].get('detail',{}).get('location',{}) if len(first)==1 else {}
        nav=['live-source-cell-navigation-available','live-source-range-form'] if isinstance(loc,dict) and 'sheet' in loc else ['live-source-page-navigation-available']
        for key in nav:
            if len(by.get(key,[]))!=1 or by[key][0].get('ok') is not True or not by[key][0].get('utc'):failed.append(key)
    if not data.get('endUTC') or not any(a.get('name')=='resume-checks-complete' and a.get('utc') for a in data.get('actions',[])):failed+=['resume-harness-completed']
    actual_stages=data.get('stages',[])
    if [s.get('name') for s in actual_stages]!=STAGE_CONTRACT['stages']:failed+=['exact-real-stage-sequence']
    return sorted(set(failed))


def source_references(corpus):
    if not corpus:raise ValueError('sources/live requires --corpus-dir or ATHAR_CORPUS_DIR')
    # Source content is parsed solely in memory; only immutable IDs and kinds
    # reach browser config. No labels, sheet names, excerpts or values persisted.
    index=json.loads((Path(corpus)/'index.json').read_text())
    docs=index.get('documents',[]);chunks=index.get('chunks',[]);refs=[]
    for doc in docs:
        if doc.get('slug') not in {'executive-presentation','financial-summary','financial-model','implementation-plan'}:continue
        candidates=[c for c in chunks if c.get('documentId')==doc.get('id') and isinstance(c.get('location'),dict)]
        if doc.get('kind')=='xlsx':candidates=[c for c in candidates if c['location'].get('sheet') and c['location'].get('range')]
        else:candidates=[c for c in candidates if c['location'].get('slide' if doc.get('kind')=='pptx' else 'page')]
        if not candidates:raise ValueError('no source citation location')
        c=candidates[0]
        if not all(isinstance(v,str) and proxy.ID.fullmatch(v) for v in (c.get('id'),doc.get('id'))):raise ValueError('invalid source ID')
        refs.append({'id':c['id'],'documentId':doc['id'],'kind':doc['kind']})
    if len(refs)!=4 or {r['kind'] for r in refs}!={'pdf','pptx','xlsx'}:raise ValueError('require four corpus documents/all three source kinds')
    return refs


def transcript_digests():
    import subprocess
    # Read the protected host store; client modules deliberately contain no transcript.
    js="""const {pathToFileURL}=require('node:url');const {createHash}=require('node:crypto');
    import(pathToFileURL(process.argv[1]).href).then(({getGuideSteps})=>{
      console.log(JSON.stringify(getGuideSteps().map(m=>createHash('sha256').update((m.label+'. '+m.text).replace(/\\s+/g,' ').trim()).digest('hex'))));
    });"""
    r=subprocess.run(['node','-e',js,str(HERE.parents[1]/'server/presentationStore.js')],capture_output=True,text=True,timeout=15,check=True)
    hashes=json.loads(r.stdout)
    if len(hashes)!=21 or not all(re.fullmatch('[0-9a-f]{64}',v) for v in hashes):raise ValueError('transcript contract missing')
    return hashes


def run_event(**data):
    folder=Path('/tmp/athar-resume');folder.mkdir(mode=0o700,parents=True,exist_ok=True)
    with (folder/'runs.jsonl').open('a') as f:f.write(json.dumps({'utc':run.utc(),**data})+'\n')


def build_command(args,config,mode,case,size,target,validator,label):
    width,height=map(int,size.split('x'))
    conf={**{k:v for k,v in config.items() if k!='mock'},'mode':'stage','stage':args.stage,'buildSha':args.build_sha,'viewport':{'width':width,'height':height}}
    source=HERE/'resume.js';script=source.read_text().replace('__RUN_CONFIG__',json.dumps(conf,separators=(',',':')))
    timeout=args.timeout or (900 if config['resumeMode']=='live' else 450 if config['resumeMode']=='sources' else 240)
    polls=args.polls if args.polls is not None else (7500 if config['resumeMode']=='live' else 3400 if config['resumeMode']=='sources' else 1600)
    cmd=[sys.executable,str(validator),'--url',target,'--label',label,'--viewport',size,'--viewport-only','--wait-selector',config['selectors']['root'],'--wait-ms',str(args.wait_ms),'--timeout',str(timeout),'--eval',script]
    cmd+=['--eval','__atharPoll()']*polls
    cmd+=['--eval','!!window.__atharEvidenceB64','--eval','window.__atharEvidence.ok === true','--eval',f'window.__atharEvidenceB64.length <= {args.max_chunks*args.chunk_size}']
    for i in range(args.max_chunks):cmd+=['--eval',f'window.__atharTransport({i},{args.chunk_size})']
    return cmd,timeout,source


def self_test():
    import unittest
    class ContractTests(unittest.TestCase):
        def test_query_policy(self):
            good=['/api/citations/src-test/view','/api/citations/src-test/view?page=2','/api/citations/src-test/view?sheet=Test+Sheet&range=B2%3AC3','/api/sources/id-test/preview']
            bad=['/api/citations/src-test/view?page=0','/api/citations/src-test/view?page=2&page=3','/api/citations/src-test/view?url=https://example.invalid','/api/citations/src-test/view?sheet=X&range=A1%3AZ500','/api/citations/src-test/view?sheet=%250A','/api/citations/src-test/view?sheet=%0A','/api/citations/src-test/view?slide=2&sheet=X','//evil/api/citations/id/view','/api/citations/%2e%2e/view','/api/sources/id/preview?token=x']
            for v in good:self.assertIsNotNone(bounded_source_path(v))
            for v in bad:self.assertIsNone(bounded_source_path(v))
        def test_no_missing_or_duplicate_checks_pass(self):
            keys=expected_checks({'resumeMode':'smoke'},'390x844')
            self.assertEqual(len(keys),len(set(keys)))
            d={'checks':[{'id':k,'ok':True,'utc':run.utc()} for k in keys],'endUTC':run.utc(),'actions':[{'name':'resume-checks-complete','utc':run.utc()}],'stages':[{'name':s} for s in STAGE_CONTRACT['stages']]}
            self.assertEqual(contract_failures(d,keys),[])
            d['checks'].pop();self.assertTrue(contract_failures(d,keys))
            d['checks'].append(d['checks'][0]);self.assertIn(keys[0],contract_failures(d,keys))
        def test_live_dynamic_children_cannot_be_skipped(self):
            refs=[{'kind':kind} for kind in ('pptx','pdf','xlsx','pdf')]
            keys=expected_checks({'resumeMode':'live','sourceRefs':refs},'1440x900')
            self.assertEqual(len(keys),len(set(keys)))
            d={'checks':[{'id':k,'ok':True,'utc':run.utc()} for k in keys],'endUTC':run.utc(),
              'actions':[{'name':'resume-checks-complete','utc':run.utc()}],
              'stages':[{'name':v} for v in STAGE_CONTRACT['stages']]}
            self.assertIn('scope-this-citation-count-contract',contract_failures(d,keys))
            for stem in LIVE_QUERIES:
                for c in d['checks']:
                    if c['id']==stem+'-citations-real':c['detail']={'count':2}
                    if c['id']==stem+'-all-returned-citations-opened':c['detail']={'returnedCount':2,'openedCount':2}
                d['actions'].append({'name':'live-query-complete','query':stem,'allCitationsOpened':True})
                for i in range(2):
                    prefix=f'{stem}-citation-{i}-'
                    suffix=list(CITATION_COMMON)+['pdf-preview-page','protected-preview-http']
                    if not (stem==LIVE_QUERIES[0] and i==0):suffix+=['close-focus']
                    for name in suffix:
                        d['checks'].append({'id':prefix+name,'ok':True,'utc':run.utc(),
                          'detail':{'citationId':f'id-{i}','documentId':'doc','location':{'page':1}}})
                    d['actions'].append({'name':'live-citation-complete','query':stem,'index':i,'citationId':f'id-{i}'})
            d['checks'].append({'id':'live-source-page-navigation-available','ok':True,'utc':run.utc()})
            self.assertEqual(contract_failures(d,keys),[])
            d['checks']=[c for c in d['checks'] if c['id']!='scope-all-citation-1-source-rendered']
            self.assertIn('scope-all-citation-1-source-rendered',contract_failures(d,keys))
            self.assertFalse(any('PRIVATE' in k for k in contract_failures(d,keys)))

        def test_query_metadata_contains_only_contract_and_booleans(self):
            from unittest.mock import patch
            def begin(_state,method,path,payload):return {'kind':'query','method':method,'path':path}
            state=ResumeState('http://127.0.0.1:5180')
            with patch.object(ORIGINAL_STATE,'begin',begin):
                state.begin('POST','/api/query',{'question':'What capital decisions still need agreement?','sessionId':'PRIVATE-SESSION'})
                item=state.begin('POST','/api/query',{'question':'Which implementation milestones depend on those decisions?','sessionId':'PRIVATE-SESSION'})
                self.assertTrue(item['sameConversationAsPrevious']);self.assertTrue(item['previousQueryWasCapitalStarter'])
                self.assertEqual(item['questionContractId'],'live-starter-2')
                self.assertNotIn('PRIVATE-SESSION',json.dumps(item));self.assertNotIn('Which implementation',json.dumps(item))
                other=state.begin('POST','/api/query',{'question':'What capital decisions still need agreement?','sessionId':'DIFFERENT-SESSION'})
                self.assertFalse(other['sameConversationAsPrevious'])
                missing=state.begin('POST','/api/query',{'question':'Which implementation milestones depend on those decisions?'})
                self.assertFalse(missing['sameConversationAsPrevious'])

        def test_real_broker_tags_kind_after_begin(self):
            state=ResumeState('http://127.0.0.1:5180')
            first=state.begin('POST','/api/query',{'question':'What capital decisions still need agreement?','sessionId':'PRIVATE-SENTINEL'})
            first['kind']='query'
            item=state.begin('POST','/api/query',{'question':'Which implementation milestones depend on those decisions?','sessionId':'PRIVATE-SENTINEL'})
            item['kind']='query';item['status']=200
            state.observe(item,b'data: {"grounding":{"dependencyEstablished":false}}\n\n','text/event-stream')
            result=state.summary();rows=[v for v in result['requests'] if v.get('kind')=='query']
            self.assertEqual(len(rows),2);self.assertTrue(rows[-1]['sameConversationAsPrevious'])
            self.assertTrue(rows[-1]['previousQueryWasCapitalStarter'])
            self.assertIs(rows[-1]['groundingDependencyEstablished'],False)
            self.assertNotIn('PRIVATE-SENTINEL',json.dumps(result))

        def test_grounding_from_metadata_not_prose(self):
            state=ResumeState('http://127.0.0.1:5180');item={'kind':'query'}
            state._observe_grounding(item,b'data: {"answer":"PRIVATE-SENTINEL not established"}\n\n')
            self.assertNotIn('groundingDependencyEstablished',item)
            state._observe_grounding(item,b'da')
            state._observe_grounding(item,b'ta: {"grounding":{"dependencyEstab')
            state._observe_grounding(item,b'lished":false},"answer":"PRIVATE-SENTINEL"}\n\n')
            self.assertIs(item['groundingDependencyEstablished'],False)
            state._observe_grounding(item,b'{"metadata":{"grounding":{"dependencyEstablished":true}}}')
            self.assertIs(item['groundingDependencyEstablished'],True)
            self.assertNotIn('PRIVATE-SENTINEL',json.dumps(item))

        def test_source_metadata_is_content_free(self):
            state=ResumeState('http://127.0.0.1:5180');i=state.begin('GET','/api/citations/id/view',{});i['status']=200
            state.observe(i,json.dumps({'citationId':'id','documentId':'doc','kind':'xlsx','location':{'sheet':'PRIVATE-SENTINEL','range':'B2:C3'},'rows':[{'cells':[{'value':'PRIVATE-SENTINEL'}]}],'excerpt':'PRIVATE-SENTINEL'}).encode(),'application/json')
            self.assertNotIn('PRIVATE-SENTINEL',json.dumps(state.summary()));self.assertEqual(i['recordedCellCount'],1)
        def test_no_credential_in_browser_command(self):
            a=run.parser().parse_args(['--url','http://127.0.0.1:5180','--stage','after'])
            cfg=json.loads((HERE/'config.json').read_text());cfg['resumeMode']='smoke'
            cmd,_,source=build_command(a,cfg,'authorized',None,'360x800',a.url,Path('/test/ui_validate.py'),'self-test')
            self.assertNotIn('--out-dir',cmd);self.assertIn('__atharPoll()',cmd);self.assertEqual(source.name,'resume.js')
            self.assertNotIn('__RUN_CONFIG__',cmd[cmd.index('--eval')+1]);self.assertNotIn('ATHAR_REVIEW_PASSPHRASE',' '.join(cmd))
        def test_source_refs_dynamic(self):
            import tempfile
            docs=[{'id':f'doc-{i}','slug':slug,'kind':kind} for i,(slug,kind) in enumerate([('executive-presentation','pptx'),('financial-summary','pdf'),('financial-model','xlsx'),('implementation-plan','pdf')])]
            chunks=[{'id':f'cite-{i}','documentId':d['id'],'location':{'sheet':'S','range':'A1:B2'} if d['kind']=='xlsx' else {'slide' if d['kind']=='pptx' else 'page':2},'text':'NOT-RETAINED'} for i,d in enumerate(docs)]
            with tempfile.TemporaryDirectory() as t:
                (Path(t)/'index.json').write_text(json.dumps({'documents':docs,'chunks':chunks}));refs=source_references(t)
            self.assertEqual(len(refs),4);self.assertNotIn('NOT-RETAINED',json.dumps(refs));self.assertTrue(all(set(r)=={'id','documentId','kind'} for r in refs))
    result=unittest.TextTestRunner(verbosity=2).run(unittest.defaultTestLoader.loadTestsFromTestCase(ContractTests))
    return 0 if result.wasSuccessful() else 1


def main(argv=None):
    os.umask(0o077)
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--url',type=run.safe_url,default='http://127.0.0.1:5180')
    p.add_argument('--mode',choices=('smoke','sources','live'),default='smoke')
    p.add_argument('--stage',choices=('before','after'),default='after')
    p.add_argument('--viewport',action='append',type=run.viewport)
    p.add_argument('--auth',choices=('env',),default='env')
    p.add_argument('--corpus-dir',type=Path)
    p.add_argument('--build-sha',type=run.sha)
    p.add_argument('--validator')
    p.add_argument('--timeout',type=int);p.add_argument('--polls',type=int)
    p.add_argument('--wait-ms',type=int,default=650)
    p.add_argument('--max-chunks',type=int,default=2600);p.add_argument('--chunk-size',type=int,default=112)
    p.add_argument('--dry-run',action='store_true');p.add_argument('--self-test',action='store_true')
    a=p.parse_args(argv)
    if a.self_test:return self_test()
    sizes=a.viewport or SIZES
    if any(v is not None and v<=0 for v in (a.timeout,a.polls,a.max_chunks,a.chunk_size)) or a.chunk_size>160 or a.wait_ms<0:p.error('invalid timeout/poll/chunk bounds')
    stamp=run.utc().replace(':','').replace('+','-').replace('.','-')
    label=f'{a.stage}-resume-{a.mode}-{stamp}'
    if a.dry_run:
        print(json.dumps({'utc':run.utc(),'dryRun':True,'mode':a.mode,'viewports':sizes,'label':label,'wouldSendAIQueriesPerViewport':4 if a.mode=='live' else 0,'requiresRuntimeCorpus':a.mode!='smoke','requiresRuntimeEnvAuth':True,'screenshots':'.ui-proof/','timestampsPerCheck':True,'contract':'original six stages/16 interactions/seven geometry checks plus resume assertions','browserNotStarted':True}));return 0
    try:
        config=json.loads((HERE/'config.json').read_text());config['resumeMode']=a.mode;config['transcriptDigests']=transcript_digests()
        if a.mode!='smoke':config['sourceRefs']=source_references(a.corpus_dir or os.environ.get('ATHAR_CORPUS_DIR'))
        validator=run.resolve_validator(a.validator)
        install_adapter()
        # Reuse execute's credential handling, strict output sanitizer, PNG size
        # checks, raw-output suppression, and unsafe screenshot deletion.
        a.stage=label;a.overwrite=False
        code=0
        for size in sizes:
            expected=expected_checks(config,size)
            run.contract_failures=lambda data,mode,expected=expected:contract_failures(data,expected)
            run_event(event='start',mode=a.mode,viewport=size,label=label)
            status=run.execute(a,config,validator,'authorized',None,size)
            report=Path.cwd()/'.ui-proof'/f'{label}-authorized-{size}.json'
            result=json.loads(report.read_text())
            run_event(event='complete',mode=a.mode,viewport=size,status=status,report=str(report),checkCount=len(result.get('checks',[])),stageCount=len(result.get('stages',[])),failedCheckIds=result.get('failedCheckIds',[]))
            code=max(code,status)
        return code
    except Exception:
        run_event(event='unavailable',mode=a.mode,label=label)
        # Never expose exception payloads/paths/URLs or raw subprocess output.
        print(json.dumps({'utc':run.utc(),'ok':False,'error':'resume-run-unavailable','detail':'Check auth, validator, corpus, app availability and timeout. No raw diagnostic persisted.'}));return 2

if __name__=='__main__':raise SystemExit(main())
