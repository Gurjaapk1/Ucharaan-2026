import test from 'node:test';
import assert from 'node:assert/strict';
import {freshExperience,parseExperience} from '../src/KidsMode/experience.js';

test('fresh state and earned progress survive JSON storage',()=>{
 const value=freshExperience();value.kids=true;value.character='sehaj';value.progress={coins:10,best:{1:2},owned:['classic','sky','sunshine'],equipped:'sunshine'};value.attempts=[{pauri:1,score:84,at:1}];
 assert.deepEqual(parseExperience(JSON.parse(JSON.stringify(value))),value);
});
test('malformed or incompatible storage is rejected without trusting it',()=>{
 for(const value of [null,{},[],{...freshExperience(),version:2},{...freshExperience(),selected:39},{...freshExperience(),progress:{coins:-10,best:{},owned:[],equipped:'hacked'}},{...freshExperience(),attempts:[{pauri:1,score:101,at:1}]}])assert.equal(parseExperience(value),null);
});
test('saved cosmetics and star counts must be valid',()=>{
 const value=freshExperience();value.progress.best['1']=4;assert.equal(parseExperience(value),null);
 const other=freshExperience();other.progress.equipped='river';assert.equal(parseExperience(other),null);
});

// A display-only schema addition must preserve existing users' saved rewards.
test('older snapshots retain progress and default illustrations on',()=>{
 const value=freshExperience();value.progress.coins=20;delete value.illustrations;
 const loaded=parseExperience(value);assert.equal(loaded?.illustrations,true);assert.equal(loaded?.progress.coins,20);
 const quiet={...freshExperience(),illustrations:false};assert.equal(parseExperience(quiet)?.illustrations,false);
 assert.equal(parseExperience({...quiet,illustrations:'false'}),null);
});
