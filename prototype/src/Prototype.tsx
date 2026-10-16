import { useEffect, useRef, useState } from 'react';
import { MobileScroll, Carousel } from './mobile';
import pauris from './bani.json';
import { coinAward, completePauri, initialProgress, redeem, starsForScore, type Progress } from './rewards';

type Character = 'prem' | 'sehaj';
type Screen = 'character' | 'world' | 'map' | 'pauri' | 'practice' | 'ready' | 'challenge' | 'results' | 'rewards' | 'journal';
const names: Record<Character,string> = {prem:'Prem Singh',sehaj:'Sehaj Kaur'};
const regions = [{name:'The beginning',place:'Punjab’s open fields',start:1,end:6},{name:'By the river',place:'Sultanpur Lodhi inspired',start:7,end:12},{name:'Paths of listening',place:'Village paths',start:13,end:18},{name:'An open horizon',place:'Fields and foothills',start:19,end:24},{name:'A world of wonder',place:'Mountain trails',start:25,end:30},{name:'Growing in grace',place:'Kartarpur inspired',start:31,end:38}];
const rewards = [{id:'sky',title:'Sky frame',desc:'A free starting style',cost:0,icon:'sparkles'},{id:'classic',title:'Classic explorer',desc:'Your original character frame',cost:0,icon:'navigation'},{id:'sunshine',title:'Sunshine frame',desc:'A little gold for your journey',cost:10,icon:'sparkles'},{id:'river',title:'River explorer',desc:'A blue frame and map marker',cost:20,icon:'flag'},{id:'garden',title:'Garden explorer',desc:'A leafy frame and map marker',cost:30,icon:'leaf'}];
const audioUrl='https://gurbani-audios-c4abhzghhnccd5gj.z01.azurefd.net/audios/BhaiJarnailSingh/JapjiSahib.m4a';
function Icon({name,size=22}:{name:string;size?:number}) {return <img className="icon" src={`/assets/${name}.svg`} width={size} height={size} alt=""/>;}
function Stars({count=0,large=false}:{count?:number;large?:boolean}) {return <span className={`stars ${large?'large':''}`} aria-label={`${count} of 3 stars`}>{[1,2,3].map(i=><img key={i} src="/assets/star.svg" alt="" className={i<=count?'earned':''}/>)}</span>;}
function Avatar({character,equipped='classic',small=false}:{character:Character;equipped?:string;small?:boolean}) {return <div className={`avatar ${equipped} ${small?'small':''}`}><img src={`/assets/${character}-character.png`} alt={names[character]} onError={e=>{e.currentTarget.onerror=null;e.currentTarget.src=`/assets/${character}-cover.png`;}}/></div>;}

export default function Prototype() {
 const [screen,setScreen]=useState<Screen>('character');
 const [character,setCharacter]=useState<Character>('prem');
 const [started,setStarted]=useState(false);
 const [progress,setProgress]=useState<Progress>(initialProgress);
 const [region,setRegion]=useState(0);
 const [selected,setSelected]=useState(1);
 const [line,setLine]=useState(0);
 const [playing,setPlaying]=useState(false);
 const [audioError,setAudioError]=useState('');
 const [running,setRunning]=useState(false);
 const [tick,setTick]=useState(0);
 const [demoScore,setDemoScore]=useState(84);
 const [award,setAward]=useState(0);
 const [notice,setNotice]=useState('');
 const [showMeaning,setShowMeaning]=useState(true);
 const audio=useRef<HTMLAudioElement|null>(null);
 const pauri=pauris[selected-1];
 const currentRegion=regions[region];
 const stars=starsForScore(demoScore);
 const best=progress.best[String(selected)]??0;
 const totalStars=Object.values(progress.best).reduce<number>((a,b)=>a+b,0);
 const totalDone=Object.values(progress.best).filter(x=>x>0).length;
 const currentLine=pauri.lines[line]??pauri.lines[0];
 const scene=selected===1?(line===2?'grain-scene.png':line>=4?'path-scene.png':'reflection-scene.png'):'riverside-terrain.jpg';
 const go=(next:Screen)=>{audio.current?.pause();setPlaying(false);setAudioError('');setRunning(false);setNotice('');setScreen(next);};
 useEffect(()=>{if(!notice)return;const timer=window.setTimeout(()=>setNotice(''),3500);return()=>window.clearTimeout(timer);},[notice]);
 useEffect(()=>{
  if(screen!=='challenge'||!running)return;
  const timer=window.setInterval(()=>setTick(t=>t+1),1000);
  return()=>window.clearInterval(timer);
 },[screen,running]);
 useEffect(()=>{
  if(screen!=='challenge'||!running)return;
  const nextLine=Math.min(Math.floor(tick/4),pauri.lines.length-1);setLine(nextLine);
  if(tick>=pauri.lines.length*4){setRunning(false);setAward(coinAward(best,stars));setProgress(p=>completePauri(p,selected,demoScore));setScreen('results');}
 },[tick,screen,running,pauri,best,stars,selected,demoScore]);
 function listen(index:number) {
  const player=audio.current; if(!player)return;
  setLine(index);setAudioError('');player.currentTime=pauri.lines[index].start;
  void player.play().then(()=>setPlaying(true)).catch(()=>{setAudioError('Audio could not load. Please try again.');setPlaying(false);});
 }
 const headerTitle=screen==='world'?'Your bani world':screen==='map'?'Japji Sahib':screen==='rewards'?'Nanak rewards':screen==='journal'?'My journey':screen==='character'?'Uchaaran':`Pauri ${selected}`;
 const isMain=['world','map','rewards','journal'].includes(screen);
 function back(){if(screen==='character'){go('world');return;}if(['practice','ready','results'].includes(screen)){go('pauri');return;}if(screen==='pauri'){go('map');return;}go('world');}
 function openPauri(n:number){setSelected(n);setLine(0);go('pauri');}
 return <div className="uchaaran">
  <audio ref={audio} src={audioUrl} preload="none" onError={()=>{if(playing)setAudioError('Audio is unavailable. Try again when connected.');setPlaying(false);}} onTimeUpdate={()=>{if(audio.current&&screen==='practice'&&audio.current.currentTime>=currentLine.end){audio.current.pause();setPlaying(false);}}}/>
  <header className="app-header">
   {screen==='world'||screen==='character'?<img className="brand-icon" src="/assets/sundar_gutka_icon.png" alt="Sundar Gutka"/>:<button className="round" aria-label="Back" onClick={back}><Icon name="chevron-left"/></button>}
   <div className="header-copy"><strong>{headerTitle}</strong><span>{screen==='character'?'A Sundar Gutka companion':screen==='challenge'?'Continuous challenge':screen==='practice'?'Practice at your pace':'A little practice, every day'}</span></div>
   <button className="wallet" aria-label={`${progress.coins} Nanak coins. Open rewards`} onClick={()=>go('rewards')}><Icon name="coins" size={19}/>{progress.coins}</button>
  </header>
  <div className={`app-body ${isMain?'has-nav':''}`}><MobileScroll key={screen} className="app-screen"><main>
  {screen==='character'&&<div className="pad onboarding">
   <h1>Your journey.<br/>Your little explorer.</h1><p>Choose a friend from the Khalis books. Make their journey your own.</p>
   <div className="character-grid">{(['prem','sehaj'] satisfies Character[]).map(c=><button key={c} className={`character-choice ${character===c?'selected':''}`} aria-pressed={character===c} onClick={()=>setCharacter(c)}><Avatar character={c} equipped={progress.equipped}/><strong>{names[c]}</strong><span>{character===c?'Your explorer':'Choose explorer'}</span></button>)}</div>
   <h2>Pick your starting style</h2><div className="style-choices">{rewards.filter(r=>progress.owned.includes(r.id)).map(r=><button key={r.id} className={progress.equipped===r.id?'selected':''} aria-pressed={progress.equipped===r.id} onClick={()=>setProgress(p=>({...p,equipped:r.id}))}><Icon name={r.icon}/>{r.title}</button>)}</div>
   <div className="hint"><Icon name="sparkles"/><p>Earn stars as you learn. Collect Nanak coins to unlock new looks.</p></div>
   <button className="primary" onClick={()=>{setStarted(true);go('world');}}>{started?'Save my explorer':'Let’s begin'}<span>→</span></button>
   <p className="fine centered">Both characters are free. Switch whenever you like.</p>
  </div>}
  {screen==='world'&&<>
   <div className="pad world-intro"><div><p className="greeting">Sat Sri Akal, explorer!</p><h1>A world of bani<br/>is waiting.</h1></div><button className="avatar-button" aria-label="Customize character" onClick={()=>go('character')}><Avatar character={character} equipped={progress.equipped} small/></button></div>
   <button className="world-feature" onClick={()=>go('map')}><img src="/assets/world-terrain.jpg" alt="Illustrated green landscape with paths, a river and villages"/><span className="world-label"><span className="pill">Your first journey</span><strong>Japji Sahib</strong><span>38 pauris · 6 regions</span><span className="world-cta">{totalDone?'Continue exploring':'Begin your journey'} <b>→</b></span></span></button>
   <div className="pad"><div className="section-title"><h2>More worlds to discover</h2><span>Coming later</span></div><div className="bani-grid">{['Jaap Sahib','Anand Sahib','Chaupai Sahib','Rehras Sahib','Tav Prasad Savaiye','Kirtan Sohila'].map((b,i)=><button key={b} className={`bani-preview tone-${i%3}`} onClick={()=>setNotice(`${b} is a preview. Japji Sahib is ready to explore.`)}><Icon name={i%2?'book-open':'sparkles'} size={28}/><strong>{b}</strong><span><Icon name="lock-keyhole" size={12}/> Preview</span></button>)}</div><p className="fine">Your pace. No lost streaks, no rush.</p></div>
  </>}
  {screen==='map'&&<>
   <div className="map-heading pad"><div><h1>{currentRegion.name}</h1><p>Region {region+1} of 6 · Pauris {currentRegion.start}–{currentRegion.end}</p></div><span className="star-total"><Icon name="star"/>{totalStars}/114</span></div>
   <Carousel ariaLabel="Choose journey region" className="region-carousel"><div className="region-track">{regions.map((r,i)=><button key={r.name} className={i===region?'active':''} onClick={()=>setRegion(i)} aria-pressed={i===region}>{i+1}. {r.name}</button>)}</div></Carousel>
   <div className="journey-map"><img className="terrain" src={`/assets/${region===1?'sultanpur-inspired-terrain':'riverside-terrain'}.jpg`} alt="A winding journey through a Punjab-inspired landscape"/><div className="region-sign"><Icon name="navigation" size={16}/>{currentRegion.place}</div>
    {Array.from({length:currentRegion.end-currentRegion.start+1},(_,i)=>{const n=currentRegion.start+i;const count=progress.best[String(n)]??0;return <button key={n} className={`map-stop ${n===selected?'current':''} ${count?'done':''} marker-${progress.equipped}`} style={{left:`${[14,34,61,78,56,30,16,43][i]}%`,top:`${82-i*(65/(currentRegion.end-currentRegion.start))}%`}} aria-label={`Pauri ${n}, ${count} of 3 stars`} onClick={()=>openPauri(n)}><span className="stop-disc">{n}</span><Stars count={count}/>{n===selected&&<span className="you-here">You’re here</span>}</button>;})}
   </div>
   <div className="pad map-bottom"><button className="continue-card" onClick={()=>openPauri(selected)}><span><strong>Pauri {selected}</strong><span>{best?'Keep growing your mastery':'Listen, practise, then try a challenge'}</span></span><span className="arrow-circle">→</span></button><p className="fine">A landscape inspired by Punjab. Regions are learning chapters, not claims about where each pauri was composed.</p></div>
  </>}
  {screen==='pauri'&&<div className="pad">
   <div className="pauri-hero"><img src="/assets/riverside-terrain.jpg" alt="Riverside landscape"/><div><span>Japji Sahib</span><h1>Pauri {selected}</h1><Stars count={best} large/><p>{pauri.lines.length} lines · Your best: {best}/3 stars</p></div></div>
   <h2>How would you like to learn?</h2>
   <button className="mode-card" onClick={()=>{setLine(0);go('practice');}}><span className="mode-icon"><Icon name="headphones" size={28}/></span><span><strong>Practice</strong><span>Listen to a line. Repeat it.<br/>Take all the time you need.</span></span><b>→</b></button>
   <button className="mode-card challenge-mode" onClick={()=>go('ready')}><span className="mode-icon"><Icon name="mic" size={28}/></span><span><strong>Challenge</strong><span>One continuous recitation.<br/>See your feedback at the end.</span></span><b>→</b></button>
   <div className="reward-rule"><Stars count={3}/><span>Every new star earns <b>10 Nanak coins</b>.</span></div>
   <details className="details"><summary>How mastery works</summary><p>60–79% earns 1 star, 80–94% earns 2, and 95–100% earns 3. These are proposed thresholds for this prototype. Practice is always available.</p></details>
  </div>}
  {screen==='practice'&&<div className="pad practice">
   <div className="section-title"><h1>One line at a time.</h1><span>{line+1}/{pauri.lines.length}</span></div>
   <div className="meaning-scene"><img src={`/assets/${scene}`} alt="Interpretive landscape illustration accompanying this line of bani"/><span>Pause. Listen. Reflect.</span></div>
   <div className="verse-card"><span className="line-label">Line {line+1}</span><p className="gurmukhi" lang="pa">{currentLine.text}</p>{showMeaning&&<p className="translation">{currentLine.translation}</p>}</div>
   <button className="text-button" onClick={()=>setShowMeaning(!showMeaning)}>{showMeaning?'Hide':'Show'} meaning</button>
   <button className="primary" onClick={()=>{if(playing){audio.current?.pause();setPlaying(false);}else listen(line);}}><Icon name="volume-2"/>{playing?'Pause reference':'Listen to this line'}</button><p className="fine centered">Bhai Jarnail Singh · Sundar Gutka reference audio</p>{audioError&&<p role="alert" className="error">{audioError}</p>}
   <div className="two-buttons"><button className="secondary" disabled={line===0} onClick={()=>{audio.current?.pause();setPlaying(false);setLine(l=>l-1);}}>Previous line</button><button className="secondary" onClick={()=>{audio.current?.pause();setPlaying(false);line===pauri.lines.length-1?go('ready'):setLine(l=>l+1);}}>{line===pauri.lines.length-1?'Try challenge':'Next line'} →</button></div>
   <details className="details"><summary>Choose a specific line</summary>{pauri.lines.map((l,i)=><button className="line-option" key={i} onClick={()=>{audio.current?.pause();setPlaying(false);setLine(i);}}><b>{i+1}</b><span lang="pa">{l.text}</span></button>)}</details>
   <p className="fine">Pauri 1 includes changing visual metaphors for reflection, hunger and walking in harmony. These concepts need educator review; other pauris use a shared landscape.</p>
  </div>}
  {screen==='ready'&&<div className="pad ready"><div className="big-symbol"><Icon name="mic" size={42}/></div><h1>A whole pauri.<br/>One peaceful flow.</h1><p>Recite from beginning to end. The next line appears automatically. We’ll save the feedback for afterwards.</p><div className="flow-explainer"><span><Icon name="mic"/> Begin once</span><span><Icon name="navigation"/> Follow the lines</span><span><Icon name="star"/> See your progress</span></div>
   <div className="demo-panel"><strong>Try the demo</strong><p>No microphone is used. Lines advance every 4 seconds and the score is simulated.</p><label htmlFor="demo-result">Example result</label><select id="demo-result" value={demoScore} onChange={e=>setDemoScore(Number(e.target.value))}><option value={72}>72% · 1 star</option><option value={84}>84% · 2 stars</option><option value={96}>96% · 3 stars</option></select></div>
   <button className="primary" onClick={()=>{setLine(0);setTick(0);setRunning(true);setScreen('challenge');}}>Begin demo challenge <span>→</span></button><button className="text-button full" onClick={()=>go('practice')}>I’d like to practise first</button>
  </div>}
  {screen==='challenge'&&<div className="pad challenge"><div className="challenge-status"><span><i className={running?'pulse':''}/>{running?'Reciting':'Paused'}</span><span>Line {line+1} of {pauri.lines.length}</span></div><div className="progress-bar"><span style={{width:`${tick/(pauri.lines.length*4)*100}%`}}/></div><div className="challenge-art"><img src={`/assets/${scene}`} alt="A reflective landscape accompanying the current line"/></div><div className="live-verse" aria-live="polite"><span className="line-label">Pauri {selected} · Line {line+1}</span><p className="gurmukhi" lang="pa">{currentLine.text}</p><p className="next-line" lang="pa">{pauri.lines[line+1]?.text??'Take a breath. You’re almost there.'}</p></div><div className={`listening-bars ${running?'animated':''}`} aria-hidden="true">{Array.from({length:19},(_,i)=><i key={i} style={{height:`${12+(i*13)%30}px`,animationDelay:`${i*.08}s`}}/>)}</div><p className="centered">{running?'Keep going. We’ll follow along.':'Take your time. Resume when ready.'}</p><button className="secondary full" onClick={()=>setRunning(!running)}>{running?'Pause challenge':'Resume challenge'}</button><p className="fine centered">Demo playback · No voice recorded or assessed</p></div>}
  {screen==='results'&&<div className="pad results"><p className="result-intro">You made time to learn.</p><h1>{stars===3?'Three-star explorer!':'Look how you’re growing!'}</h1><Stars count={stars} large/><div className="score"><strong>{demoScore}<small>%</small></strong><span>Example pronunciation score</span></div><div className="earned-coins"><Icon name="coins" size={30}/><span><strong>{award?`+${award} Nanak coins`:'Your stars are safe'}</strong><span>{award?'10 coins for every new star':'Replay complete. Coins reward new stars only.'}</span></span></div><div className="section-title"><h2>Your line-by-line review</h2><span>Simulated</span></div><div className="rubric">{pauri.lines.map((l,i)=>{const needsWork=demoScore<95&&i%3===1;const score=demoScore<95&&i<Math.floor(pauri.lines.length/3)*3?demoScore+(i%3===1?-16:8):demoScore;return <button key={i} className={`rubric-row ${needsWork?'needs-work':'clear'}`} onClick={()=>{setLine(i);go('practice');}}><span className="rubric-num">{i+1}</span><span><span className="rubric-verse" lang="pa">{l.text}</span><span className="rubric-note">{needsWork?'Practise again':'Clear in this example'}</span></span><strong>{score}%</strong></button>;})}</div><p className="fine">Tap a line to practise it. Colours and percentages show sample feedback, not an assessment of your voice.</p><button className="primary" onClick={()=>go('rewards')}>Visit the rewards shop <span>→</span></button><div className="two-buttons"><button className="secondary" onClick={()=>go('ready')}>Try again</button><button className="secondary" onClick={()=>go('map')}>Back to map</button></div></div>}
  {screen==='rewards'&&<div className="pad rewards"><div className="rewards-hero"><Avatar character={character} equipped={progress.equipped}/><div><h1>A little more you.</h1><p>Your stars become coins.<br/>Your coins become new looks.</p><div className="balance"><Icon name="coins"/>{progress.coins} <span>Nanak coins</span></div></div></div><h2>Your explorer’s collection</h2><div className="reward-grid">{rewards.map(r=>{const owned=progress.owned.includes(r.id);const equipped=progress.equipped===r.id;return <article key={r.id} className={`reward-item ${r.id}`}><div className="reward-preview"><Avatar character={character} equipped={r.id} small/></div><strong>{r.title}</strong><p>{r.desc}</p><button className={equipped?'equipped':'secondary'} disabled={!owned&&progress.coins<r.cost} onClick={()=>{setProgress(p=>redeem(p,r.id,r.cost));setNotice(`${r.title} equipped!`);}}>{equipped?'Equipped':owned?'Equip':<><Icon name="coins" size={15}/>{r.cost} coins</>}</button></article>;})}</div><div className="hint"><Icon name="star"/><p>Earn up to 30 coins per pauri. Improve your stars to earn the difference. All learning stays free.</p></div><button className="secondary full" onClick={()=>go('map')}>Earn more stars</button><p className="fine">Digital cosmetics only in V1. Book discounts, physical rewards and gifting remain ideas for a later phase.</p></div>}
  {screen==='journal'&&<div className="pad journal"><div className="journal-hero"><Avatar character={character} equipped={progress.equipped}/><h1>{names[character]}’s journey</h1><button className="text-button" onClick={()=>go('character')}>Customize my explorer</button></div><div className="stats"><div><strong>{totalDone}</strong><span>pauris explored</span></div><div><strong>{totalStars}</strong><span>stars earned</span></div><div><strong>{progress.coins}</strong><span>Nanak coins</span></div></div><h2>Small steps count.</h2><p>Every return to bani is a good day. Your journey has no deadline.</p>{totalDone?Object.entries(progress.best).map(([n,s])=><button className="journal-row" key={n} onClick={()=>openPauri(Number(n))}><span>Japji Sahib · Pauri {n}</span><Stars count={s}/></button>):<button className="primary" onClick={()=>go('map')}>Explore your first pauri →</button>}<details className="details"><summary>About this prototype</summary><p>React interaction prototype for a future React Native experience. Progress lasts for this browser session. No account, voice analysis, purchases or history mini-games.</p><p>Characters are adaptations of Prem Singh and Sehaj Kaur from Khalis Foundation books. Scripture and English meanings: BaniDB. Reference audio and visual tokens: Sundar Gutka.</p><a href="https://shop.khal.is/collections/childrens" target="_blank" rel="noreferrer">Meet the characters in their books ↗</a></details></div>}
  </main></MobileScroll></div>
  {isMain&&<nav className="bottom-nav" aria-label="Main navigation">{([{screen:'world',name:'World',icon:'book-open'},{screen:'map',name:'Journey',icon:'map'},{screen:'rewards',name:'Rewards',icon:'coins'},{screen:'journal',name:'My explorer',icon:'navigation'}] satisfies {screen:Screen;name:string;icon:string}[]).map(n=><button key={n.name} className={screen===n.screen?'active':''} aria-current={screen===n.screen?'page':undefined} onClick={()=>go(n.screen)}><Icon name={n.icon}/><span>{n.name}</span></button>)}</nav>}
  {notice&&<div className="toast" role="status">{notice}</div>}
 </div>;
}
