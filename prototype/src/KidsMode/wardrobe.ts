import type {Progress} from './rewards';
export type Slot = 'clothing'|'belonging'|'action';
export type StoryId = 'music'|'seva';
export type Wardrobe = {owned:string[];equipped:Record<Slot,string>;stories:StoryId[]};
export type Reward = {id:string;slot:Slot;name:string;description:string;icon:'shirt'|'satchel'|'book-open'|'rabab'|'basket'|'hand'|'headphones'|'leaf';color:string;unlock:{kind:'free'}|{kind:'coins';cost:number}|{kind:'pauris';count:number}|{kind:'story';story:StoryId}};
export const rewards:Reward[]=[
 {id:'everyday',slot:'clothing',name:'Everyday explorer',description:'Your original outfit. Always yours.',icon:'shirt',color:'#dce8f9',unlock:{kind:'free'}},
 {id:'garden-thread',slot:'clothing',name:'Garden embroidery',description:'Soft green fabric with a simple embroidered border.',icon:'shirt',color:'#e1ebdc',unlock:{kind:'coins',cost:30}},
 {id:'travel-light',slot:'belonging',name:'Travel light',description:'Keep your explorer’s hands free.',icon:'satchel',color:'#f1eee8',unlock:{kind:'free'}},
 {id:'journey-bag',slot:'belonging',name:'Journey satchel',description:'A small companion for your next adventure.',icon:'satchel',color:'#f0dfcb',unlock:{kind:'coins',cost:20}},
 {id:'journal',slot:'belonging',name:'Explorer’s journal',description:'A place to remember what you are learning.',icon:'book-open',color:'#e3e9f4',unlock:{kind:'pauris',count:1}},
 {id:'rabab',slot:'belonging',name:'Rabab',description:'Discover music and companionship with Bhai Mardana.',icon:'rabab',color:'#efdfcd',unlock:{kind:'story',story:'music'}},
 {id:'seva-basket',slot:'belonging',name:'Seva basket',description:'A reminder to share and help others.',icon:'basket',color:'#e4ead9',unlock:{kind:'story',story:'seva'}},
 {id:'ready',slot:'action',name:'Ready to explore',description:'A quiet moment before the next step.',icon:'leaf',color:'#e3e9e0',unlock:{kind:'free'}},
 {id:'greeting',slot:'action',name:'A warm welcome',description:'A cheerful greeting when you tap your explorer.',icon:'hand',color:'#f7e9cd',unlock:{kind:'coins',cost:20}},
 {id:'listening',slot:'action',name:'Listening closely',description:'Pause and lean in to listen.',icon:'headphones',color:'#dfe8f1',unlock:{kind:'pauris',count:1}},
 {id:'helping',slot:'action',name:'Ready to help',description:'Your explorer leans forward, ready to help.',icon:'basket',color:'#e2eadb',unlock:{kind:'story',story:'seva'}},
];
export function freshWardrobe():Wardrobe {return {owned:['everyday','travel-light','ready'],equipped:{clothing:'everyday',belonging:'travel-light',action:'ready'},stories:[]};}
export function wardrobeOf(progress:Progress):Wardrobe {return progress.wardrobe??freshWardrobe();}
export function rewardById(id:string):Reward|undefined {return rewards.find(r=>r.id===id);}
export function eligible(progress:Progress,item:Reward):boolean {
 const rule=item.unlock;
 if(rule.kind==='coins')return progress.coins>=rule.cost;
 if(rule.kind==='pauris')return Object.values(progress.best).filter(n=>n>0).length>=rule.count;
 if(rule.kind==='story')return wardrobeOf(progress).stories.includes(rule.story);
 return true;
}
// One state transition charges, owns and equips. Repeated taps cannot double-charge.
export function unlockAndEquip(progress:Progress,id:string):Progress {
 const item=rewardById(id);if(!item)return progress;
 const wardrobe=wardrobeOf(progress),owned=wardrobe.owned.includes(id);
 if(!owned&&!eligible(progress,item))return progress;
 return {...progress,coins:progress.coins-(!owned&&item.unlock.kind==='coins'?item.unlock.cost:0),wardrobe:{...wardrobe,owned:owned?wardrobe.owned:[...wardrobe.owned,id],equipped:{...wardrobe.equipped,[item.slot]:id}}};
}
export function readRewardStory(progress:Progress,story:StoryId):Progress {
 const wardrobe=wardrobeOf(progress);
 return wardrobe.stories.includes(story)?progress:{...progress,wardrobe:{...wardrobe,stories:[...wardrobe.stories,story]}};
}
export function parseWardrobe(value:unknown):Wardrobe|null {
 if(typeof value!=='object'||value===null)return null;
 const v=value as Record<string,unknown>;
 if(!Array.isArray(v.owned)||!Array.isArray(v.stories)||typeof v.equipped!=='object'||v.equipped===null)return null;
 if(v.owned.some(id=>typeof id!=='string'||!rewardById(id))||new Set(v.owned).size!==v.owned.length)return null;
 if(v.stories.some(id=>id!=='music'&&id!=='seva')||new Set(v.stories).size!==v.stories.length)return null;
 const e=v.equipped as Record<string,unknown>;
 for(const slot of ['clothing','belonging','action'] as const)if(typeof e[slot]!=='string'||!v.owned.includes(e[slot])||rewardById(e[slot])?.slot!==slot)return null;
 return {owned:[...v.owned],stories:[...v.stories],equipped:{clothing:String(e.clothing),belonging:String(e.belonging),action:String(e.action)}};
}
