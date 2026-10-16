import test from 'node:test';
import assert from 'node:assert/strict';
import { coinAward, starsForScore, completePauri, redeem, initialProgress } from '../src/KidsMode/rewards.ts';
test('mastery thresholds include their exact boundaries',()=>{for(const [score,stars] of [[0,0],[59,0],[60,1],[79,1],[80,2],[94,2],[95,3],[100,3]])assert.equal(starsForScore(score),stars);assert.throws(()=>starsForScore(NaN));});
test('replaying cannot farm coins or remove previous mastery',()=>{const first=completePauri(initialProgress,1,84);assert.equal(first.coins,20);const replay=completePauri(first,1,84);assert.deepEqual(replay,first);const worse=completePauri(first,1,72);assert.deepEqual(worse,first);const improved=completePauri(first,1,96);assert.equal(improved.coins,30);assert.equal(improved.best['1'],3);assert.equal(coinAward(3,1),0);});
test('redemption spends once and never overdraws',()=>{const first=completePauri(initialProgress,1,84);const bought=redeem(first,'river',20);assert.equal(bought.coins,0);assert.equal(bought.equipped,'river');assert.deepEqual(redeem(bought,'river',20),bought);assert.deepEqual(redeem(bought,'garden',30),bought);});
test('different pauris earn independently and shared character changes do not affect progress',()=>{let p=completePauri(initialProgress,1,96);p=completePauri(p,2,96);assert.equal(p.coins,60);assert.equal(Object.keys(p.best).length,2);});

test('line feedback averages to the displayed overall score for every pauri', async()=>{
  const {lineScore}=await import('../src/KidsMode/content.ts');
  const {readFile}=await import('node:fs/promises');
  const pauris=JSON.parse(await readFile(new URL('../src/bani.json',import.meta.url),'utf8'));
  for(const pauri of pauris)for(const overall of [72,84,96]){
    const scores=pauri.lines.map((_,i)=>lineScore(overall,i,pauri.lines.length));
    assert.equal(scores.reduce((a,b)=>a+b,0)/scores.length,overall);
    assert.ok(scores.every(n=>n>=0&&n<=100));
  }
});
