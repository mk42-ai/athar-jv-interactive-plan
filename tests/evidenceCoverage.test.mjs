import test from 'node:test';
import assert from 'node:assert/strict';
import { evidenceCoverageGaps } from '../server/evidenceCoverage.js';
const answer = quotes => ({facts:quotes.map(quote=>({evidence:[{id:'src-test',quote}]})),conflicts:[],calculations:[]});
test('named cell values cannot be replaced with a generic unresolved comment',()=>{
 const retrieved={chunks:[{kind:'xlsx',text:'A1=Callable funding\nB1=To be agreed',records:[{cell:'B1',value:'To be agreed'}]}]};
 assert.equal(evidenceCoverageGaps('What does cell B1 state?',retrieved,answer(['Parties must agree funding.'])).length,1);
 assert.deepEqual(evidenceCoverageGaps('What does cell B1 state?',retrieved,answer(['A1=Callable funding\nB1=To be agreed'])),[]);
 assert.deepEqual(evidenceCoverageGaps('What is missing cell Z99?',retrieved,answer([])),[]);
});
test('count questions require each requested source-stated count, not one valid number',()=>{
 const retrieved={chunks:[{kind:'xlsx',text:'All 17 activities across six gates',records:[]}]};
 assert.equal(evidenceCoverageGaps('How many tasks and gates?',retrieved,answer(['All 17 activities'])).length,1);
 assert.deepEqual(evidenceCoverageGaps('How many tasks and gates?',retrieved,answer(['All 17 activities across six gates'])),[]);
 assert.deepEqual(evidenceCoverageGaps('Summarize the governance',retrieved,answer(['All 17 activities'])),[]);
});
test('year and week references are not turned into workbook cell requirements',()=>{
 assert.deepEqual(evidenceCoverageGaps('Compare Y5 and W20',{chunks:[]},answer([])),[]);
});

test('comparison starter requires both scenarios and conditional expansion qualification', () => {
 const retrieved={chunks:[{kind:'pdf',id:'src-a',text:'UAE-only Base Case. International Expansion Upside is contingent on approval.'}]};
 assert.ok(evidenceCoverageGaps('Compare the UAE base case with international expansion.',retrieved,answer(['Outputs heading'])).length >= 2);
 assert.deepEqual(evidenceCoverageGaps('Compare the UAE base case with international expansion.',retrieved,answer(['UAE-only Base Case. International Expansion Upside is contingent on approval.'])),[]);
});
test('capital decisions starter cannot substitute headings for actual labelled unresolved rows', () => {
 const retrieved={chunks:[{id:'src-test',documentId:'doc-a',kind:'xlsx',location:{sheet:'Control'},text:'Capital basis for the MoU. A1=Callable cash per party B1=To be agreed',records:[{cell:'A1',row:1,value:'Callable cash per party'},{cell:'B1',row:1,value:'To be agreed'}]}]};
 assert.ok(evidenceCoverageGaps('What capital decisions still need agreement?',retrieved,answer(['Capital basis for the MoU'])).length > 0);
 assert.deepEqual(evidenceCoverageGaps('What capital decisions still need agreement?',retrieved,answer(['Capital basis for the MoU. A1=Callable cash per party B1=To be agreed'])),[]);
});
