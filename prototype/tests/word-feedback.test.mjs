import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {tokenizeLine,sampleWordReview,practicePrompt} from '../src/KidsMode/wordFeedback.js';
import {lineScore} from '../src/KidsMode/content.js';
const pauris=JSON.parse(await readFile(new URL('../src/bani.json',import.meta.url),'utf8'));

test('word review preserves every Gurbani line, combining mark and source offset',()=>{
 for(const pauri of pauris) for(const line of pauri.lines){
  const tokens=tokenizeLine(line.text);
  assert.equal(tokens.map(t=>t.text).join(''),line.text);
  for(const token of tokens)assert.equal(line.text.slice(token.start,token.end),token.text);
  for(const token of tokens.filter(t=>t.word))assert.ok(!/^[\p{M}]/u.test(token.text));
  for(const token of tokens.filter(t=>/[॥।]/u.test(t.text)))assert.equal(token.word,false);
 }
});
test('sample word scores are bounded and reconcile to each line score for all pauris',()=>{
 for(const pauri of pauris)for(const overall of [72,84,96]){
  const review=sampleWordReview(pauri,pauri.lines.map((_,i)=>lineScore(overall,i,pauri.lines.length)));
  const ids=[];
  for(const line of review){
   const words=line.tokens.filter(t=>t.kind==='word').map(t=>t.feedback);
   assert.equal(words.reduce((s,w)=>s+w.score,0)/words.length,line.score);
   assert.ok(words.every(w=>Number.isInteger(w.score)&&w.score>=0&&w.score<=100));
   ids.push(...words.map(w=>w.id));
  }
  assert.equal(new Set(ids).size,ids.length);
 }
});
test('coaching refers to the selected occurrence without claiming to have heard a voice',()=>{
 const review=sampleWordReview(pauris[0],pauris[0].lines.map((_,i)=>lineScore(84,i,6)));
 const words=review.flatMap(l=>l.tokens.filter(t=>t.kind==='word').map(t=>t.feedback));
 assert.ok(words.some(w=>w.score<80));assert.ok(words.some(w=>w.score>=80));
 for(const word of words){const p=practicePrompt(word);assert.ok(p.tip.includes(word.text));assert.equal(p.steps.length,3);}
});
