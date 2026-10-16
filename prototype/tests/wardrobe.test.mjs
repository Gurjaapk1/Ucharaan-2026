import test from 'node:test';
import assert from 'node:assert/strict';
import {initialProgress,completePauri} from '../src/KidsMode/rewards.js';
import {unlockAndEquip,wardrobeOf,readRewardStory,parseWardrobe,freshWardrobe} from '../src/KidsMode/wardrobe.js';
import {freshExperience,parseExperience} from '../src/KidsMode/experience.js';
test('purchase charges once and equips only its own slot',()=>{
 const p={...initialProgress,coins:60};
 const clothing=unlockAndEquip(p,'garden-thread');assert.equal(clothing.coins,30);
 const bag=unlockAndEquip(clothing,'journey-bag');assert.equal(bag.coins,10);
 assert.equal(wardrobeOf(bag).equipped.clothing,'garden-thread');
 assert.equal(wardrobeOf(bag).equipped.belonging,'journey-bag');
 assert.deepEqual(unlockAndEquip(bag,'journey-bag'),bag);
 assert.deepEqual(unlockAndEquip(bag,'greeting'),bag);
 assert.deepEqual(unlockAndEquip(bag,'not-an-item'),bag);
});
test('milestones and stories unlock without spending or affecting mastery',()=>{
 assert.deepEqual(unlockAndEquip(initialProgress,'journal'),initialProgress);
 assert.deepEqual(unlockAndEquip(initialProgress,'rabab'),initialProgress);
 const earned=completePauri(initialProgress,1,84),journal=unlockAndEquip(earned,'journal');
 assert.equal(journal.coins,20);assert.equal(wardrobeOf(journal).equipped.belonging,'journal');
 const story=readRewardStory(journal,'music');const instrument=unlockAndEquip(story,'rabab');
 assert.equal(instrument.coins,20);assert.deepEqual(instrument.best,earned.best);
 assert.deepEqual(readRewardStory(story,'music'),story);
});
test('old saves retain rewards; new wardrobe survives reload and validates slots',()=>{
 const old=freshExperience();old.progress={...initialProgress,coins:20,owned:['classic','sky','river'],equipped:'river'};
 const migrated=parseExperience(old);
 assert.deepEqual(migrated.progress,{coins:20,best:{}});
 assert.equal('equipped' in migrated.progress,false);
 assert.equal('owned' in migrated.progress,false);
 const saved={...migrated,progress:unlockAndEquip(migrated.progress,'journey-bag')};
 const legacyWithWardrobe={...saved,progress:{...saved.progress,owned:['classic','river'],equipped:'river'}};
 assert.deepEqual(parseExperience(legacyWithWardrobe),saved);
 assert.deepEqual(parseExperience(parseExperience(legacyWithWardrobe)),saved);
 assert.deepEqual(parseExperience(JSON.parse(JSON.stringify(saved))),saved);
 const invalid=freshWardrobe();invalid.equipped.clothing='ready';assert.equal(parseWardrobe(invalid),null);
 const invalidOwned=freshWardrobe();invalidOwned.owned.push('unknown');assert.equal(parseWardrobe(invalidOwned),null);
});
