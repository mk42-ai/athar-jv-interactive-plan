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
