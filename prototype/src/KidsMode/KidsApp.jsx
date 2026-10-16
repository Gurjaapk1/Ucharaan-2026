import { RewardsScreen } from './RewardsScreen';
import { wardrobeOf } from './wardrobe';
import { useEffect, useState } from 'react';
import { Image, Pressable, Switch, Text, View } from 'react-native';
import { Avatar, Button, Copy, Heading, Row, Section, Small, Stars, UIProvider } from './components';
import { s } from './styles';
import { coinAward, completePauri, starsForScore } from './rewards';
import { bold, dark, legacyFont, light } from './theme';
import { characters, collection, regions } from './content';
import catalog from './bani-catalog.json';
import { freshExperience } from './experience';
import { storyForPauri, storyStopForLine } from './story';
import { StoryScene } from './StoryScene';
import { WordReview } from './WordReview';
export default function KidsApp({ pauris, host }) {
    const [saved] = useState(() => host.storage.load());
    const [attempts, setAttempts] = useState(saved.attempts);
    const [recall, setRecall] = useState(false);
    const [revealed, setRevealed] = useState(false);
    const [slow, setSlow] = useState(false);
    const [illustrations, setIllustrations] = useState(saved.illustrations);
    const [showOverview, setShowOverview] = useState(false);
    const [showCue, setShowCue] = useState(false);
    const [showLines, setShowLines] = useState(false);
    const [saveFailed, setSaveFailed] = useState(false);
    const [reviewControls, setReviewControls] = useState(false);
    const [autoScore, setAutoScore] = useState(true);
    const [screen, setScreen] = useState('home');
    const [settingsReturn, setSettingsReturn] = useState('home');
    const [kids, setKids] = useState(saved.kids);
    const [night, setNight] = useState(saved.night);
    const [meaning, setMeaning] = useState(saved.meaning);
    const [textSize, setTextSize] = useState(saved.textSize);
    const [character, setCharacter] = useState(saved.character);
    const [started, setStarted] = useState(saved.started);
    const [progress, setProgress] = useState(saved.progress);
    const [region, setRegion] = useState(saved.region);
    const [selected, setSelected] = useState(saved.selected);
    const [line, setLine] = useState(0);
    const [tick, setTick] = useState(0);
    const [running, setRunning] = useState(false);
    const [score, setScore] = useState(84);
    const [award, setAward] = useState(0);
    const [notice, setNotice] = useState('');
    const t = night ? dark : light;
    const { Scroll, HorizontalScroll, Icon, audio } = host;
    const pauri = pauris[selected - 1];
    const current = pauri.lines[line] ?? pauri.lines[0];
    const chapter = regions[region];
    const stars = starsForScore(score);
    const best = progress.best[String(selected)] ?? 0;
    const totalStars = Object.values(progress.best).reduce((sum, n) => sum + n, 0);
    const completed = Object.values(progress.best).filter(n => n > 0).length;
    const story = storyForPauri(selected);
    const storyStop = storyStopForLine(story, line);
    useEffect(() => { setRevealed(false); setShowCue(false); }, [line, screen]);
    useEffect(() => { setSaveFailed(!host.storage.save({ version: 1, kids, night, meaning, illustrations, textSize, character, started, progress, selected, region, attempts })); }, [host.storage, kids, night, meaning, illustrations, textSize, character, started, progress, selected, region, attempts]);
    const main = ['world', 'map', 'rewards', 'journal'].includes(screen);
    const reading = screen === 'reader' || screen === 'practice' || screen === 'challenge';
    function go(next) { audio.stop(); setRunning(false); setNotice(''); setScreen(next); }
    function openPauri(n) { setRegion(Math.max(0, regions.findIndex(r => n >= r.start && n <= r.end))); setSelected(n); setLine(0); go('pauri'); }
    function settings() { setSettingsReturn(screen); go('settings'); }
    function back() {
        if (screen === 'settings') {
            go(!kids && settingsReturn !== 'reader' ? 'home' : settingsReturn);
            return;
        }
        if (['practice', 'ready', 'results'].includes(screen)) {
            go('pauri');
            return;
        }
        if (screen === 'story') {
            go('pauri');
            return;
        }
        if (screen === 'pauri') {
            go('map');
            return;
        }
        if (screen === 'reader' || screen === 'world') {
            go('home');
            return;
        }
        if (screen === 'character') {
            go(started ? 'journal' : 'home');
            return;
        }
        go('world');
    }
    useEffect(() => { if (!notice)
        return; const timer = setTimeout(() => setNotice(''), 3500); return () => clearTimeout(timer); }, [notice]);
    useEffect(() => {
        if (screen !== 'challenge' || !running)
            return;
        const timer = setInterval(() => setTick(n => n + 1), 1000);
        return () => clearInterval(timer);
    }, [screen, running]);
    useEffect(() => {
        if (screen !== 'challenge' || !running)
            return;
        setLine(Math.min(Math.floor(tick / 4), pauri.lines.length - 1));
        if (tick >= pauri.lines.length * 4) {
            setAttempts(a => [{ pauri: selected, score, at: Date.now() }, ...a].slice(0, 50));
            setAward(coinAward(best, stars));
            setProgress(p => completePauri(p, selected, score));
            setRunning(false);
            setScreen('results');
        }
    }, [tick, screen, running, pauri, best, stars, selected, score]);
    const title = screen === 'home' ? 'ਸੁੰਦਰ ਗੁਟਕਾ' : screen === 'settings' ? 'Settings' : screen === 'world' ? 'Bani worlds' : screen === 'map' ? 'Japji Sahib' : screen === 'character' ? 'Choose your explorer' : screen === 'rewards' ? 'Nanak rewards' : screen === 'journal' ? 'My explorer' : screen === 'reader' ? 'ਜਪੁਜੀ ਸਾਹਿਬ' : screen === 'story' ? `Pauri ${selected} · memory walk` : `Pauri ${selected}`;
    return <UIProvider value={{ t, host, character, equipped: progress.equipped, wardrobe: wardrobeOf(progress) }}><View style={[s.app, { backgroundColor: host.statusBarBackground ?? t.surface, paddingTop: host.safeArea.top }]}>
    {screen === 'home' ? <View style={[s.homeHeader, { backgroundColor: t.primary }]}>
      <Text style={s.fateh}><Text style={{ fontFamily: legacyFont, fontSize: 20 }}>{'<> '}</Text>ਸ੍ਰੀ ਵਾਹਿਗੁਰੂ ਜੀ ਕੀ ਫਤਹਿ</Text>
      <View style={s.homeTitleRow}><Text style={s.homeTitle}><Text style={s.ornament}>Œ</Text> ਸੁੰਦਰ ਗੁਟਕਾ <Text style={s.ornament}>‰</Text></Text><Pressable accessibilityRole="button" accessibilityLabel="Settings" onPress={settings} style={s.settingsButton}><Icon name="settings" color="#faf9f6" size={28}/></Pressable></View>
    </View> : <View style={[s.header, { borderColor: t.separator, backgroundColor: t.surface }]}>
      <Pressable accessibilityRole="button" accessibilityLabel={screen === 'challenge' ? 'Leave challenge' : 'Back'} onPress={back} style={s.iconButton}><Icon name="chevron-left" color={t.text}/></Pressable>
      <View style={s.grow}><Copy style={s.headerTitle}>{title}</Copy>{reading && <Small>{screen === 'challenge' ? 'Challenge · continuous recitation' : screen === 'practice' ? 'Practice · Japji Sahib' : 'Sundar Gutka'}</Small>}</View>
      {main ? <Pressable accessibilityRole="button" accessibilityLabel={`${progress.coins} Nanak coins. Open rewards`} onPress={() => go('rewards')} style={[s.wallet, { backgroundColor: t.action }]}><Icon name="coins" color={t.text} size={19}/><Copy style={{ fontFamily: bold }}>{progress.coins}</Copy></Pressable> : screen !== 'settings' && <Pressable accessibilityRole="button" accessibilityLabel="Settings" onPress={settings} style={s.iconButton}><Icon name="settings" color={t.text}/></Pressable>}
    </View>}
    <View style={[s.content, { backgroundColor: t.surface }]}><Scroll key={screen === 'practice' ? `${screen}-${line}` : screen}><View style={{ paddingBottom: 24 }}>
      {screen === 'home' && <>
        {kids && <Row title="Kids Mode" subtitle={started ? `${characters.find(c => c.id === character)?.name} · ${totalStars} stars` : 'Choose an explorer and begin'} icon="map" onPress={() => go(started ? 'world' : 'character')}/>}
        {catalog.map(({ name, token }) => <Pressable accessibilityRole="button" key={name} onPress={() => { if (token === 'japji') {
            setSelected(1);
            setLine(0);
            go('reader');
        }
        else
            setNotice('This prototype includes Japji Sahib. More banis will be available in the app.'); }} style={({ pressed }) => [s.baniRow, { borderColor: t.separator, backgroundColor: pressed ? t.action : t.surface }]}><Copy style={{ fontSize: 23 }}>{name}</Copy></Pressable>)}
        <View style={[s.pad, s.center]}><Image source={host.image('khalislogo150.png')} style={{ width: 68, height: 68 }} resizeMode="contain"/><Small>With love, Khalis Foundation</Small></View>
      </>}
      {screen === 'settings' && <>
        <Section>Learning</Section><Row title="Kids Mode" subtitle="Explore bani through practice and play" icon="map" trailing={<Switch accessibilityLabel="Kids Mode" value={kids} onValueChange={setKids} trackColor={{ false: '#c8c8cc', true: t.primary }}/>}/>
        {kids && <View style={s.pad}><Button onPress={() => go(started ? 'world' : 'character')}>{started ? 'Open my journey' : 'Choose an explorer'}</Button></View>}
        <Section>Display</Section><Row title="Illustrations" subtitle="Show visual cues while reading" trailing={<Switch accessibilityLabel="Illustrations" value={illustrations} onValueChange={setIllustrations}/>}/><Row title="Night mode" icon="book-open" trailing={<Switch accessibilityLabel="Night mode" value={night} onValueChange={setNight} trackColor={{ false: '#c8c8cc', true: t.primary }}/>}/>
        <Row title="English meanings" subtitle="Show translations while reading" trailing={<Switch accessibilityLabel="English meanings" value={meaning} onValueChange={setMeaning} trackColor={{ false: '#c8c8cc', true: t.primary }}/>}/>
        <Row title="Font size" subtitle={`${textSize} pt`} trailing={<View style={s.inline}><Button secondary label="Decrease font size" disabled={textSize <= 21} onPress={() => setTextSize(n => n - 2)}>A−</Button><Button secondary label="Increase font size" disabled={textSize >= 35} onPress={() => setTextSize(n => n + 2)}>A+</Button></View>}/>
        <Row title="Font face" subtitle="Baloo Paaji 2"/>
        <Section>Preview controls</Section><Row title="Show test controls" subtitle="Choose a sample result for team review" trailing={<Switch accessibilityLabel="Show test controls" value={reviewControls} onValueChange={setReviewControls}/>}/>{reviewControls && <View style={s.pad}><Row title="Automatic sample progression" trailing={<Switch accessibilityLabel="Automatic sample progression" value={autoScore} onValueChange={setAutoScore}/>}/>{!autoScore && <View style={s.inline}>{[72, 84, 96].map(n => <Button key={n} secondary onPress={() => setScore(n)}>{n}%{score === n ? ' ✓' : ''}</Button>)}</View>}<Button secondary onPress={() => { const v = freshExperience(); setProgress(v.progress); setAttempts([]); setSelected(1); setRegion(0); setNotice('Practice progress reset. Your explorer and display settings are kept.'); }}>Reset practice progress</Button></View>}<Section>About</Section><View style={s.pad}><Small>Try Japji Sahib, Kids Mode, and the display controls above. Other Sundar Gutka settings and banis are outside this preview. Progress and settings are saved on this browser. No account or recording is created.</Small></View>
      </>}
      {screen === 'reader' && <><View style={s.pad}><Small>Japji Sahib · Pauri {selected}</Small></View>{pauri.lines.map((l, i) => <Pressable accessibilityRole="button" accessibilityLabel={`Listen to line ${i + 1}`} key={i} onPress={() => { setLine(i); audio.listen(l.start, l.end); }} style={[s.readerLine, { backgroundColor: audio.playing && line === i ? t.action : t.surface }]}><Copy style={[s.verse, { fontSize: textSize }]}>{l.text}</Copy>{meaning && <Copy style={s.translation}>{l.translation}</Copy>}</Pressable>)}<View style={s.pad}><Small>This reading preview contains the 38 pauris. The opening Mool Mantar and closing Salok remain in the full app.</Small><View style={s.inline}><Button secondary disabled={selected === 1} onPress={() => { audio.stop(); setSelected(n => n - 1); }}>Previous pauri</Button><Button secondary disabled={selected === 38} onPress={() => { audio.stop(); setSelected(n => n + 1); }}>Next pauri</Button></View>{audio.error.length > 0 && <Copy style={{ color: t.retryText }}>{audio.error}</Copy>}</View></>}
      {screen === 'character' && <View style={s.pad}><Heading>A friend for your journey</Heading><Small>Choose Prem Singh or Sehaj Kaur from the Khalis books. Both explore the same world.</Small><View style={[s.inline, { marginVertical: 22 }]}>{characters.map(c => <Pressable key={c.id} accessibilityRole="button" accessibilityState={{ selected: character === c.id }} onPress={() => setCharacter(c.id)} style={[s.characterChoice, { backgroundColor: t.subtle, borderColor: character === c.id ? t.primary : t.separator }]}><Avatar who={c.id}/><Copy style={{ fontFamily: bold }}>{c.name}</Copy><Small>{character === c.id ? 'Selected' : 'Choose'}</Small></Pressable>)}</View><Heading>Your starting style</Heading><View style={s.wrap}>{collection.filter(r => progress.owned.includes(r.id)).map(r => <Pressable key={r.id} accessibilityRole="button" accessibilityState={{ selected: progress.equipped === r.id }} onPress={() => setProgress(p => ({ ...p, equipped: r.id }))} style={[s.chip, { borderColor: r.color, backgroundColor: progress.equipped === r.id ? t.action : t.surface }]}><Copy>{r.name}</Copy></Pressable>)}</View><Button onPress={() => { setStarted(true); go('world'); }}>{started ? 'Save my explorer' : 'Begin my journey'}</Button><Small>Both characters are free. You can change your explorer at any time.</Small></View>}
      {screen === 'world' && <><View style={[s.pad, s.rowBody]}><View style={s.grow}><Heading>Your bani journey</Heading><Small>Choose where to practice.</Small></View><Pressable accessibilityRole="button" accessibilityLabel="Customize my explorer" onPress={() => go('character')}><Avatar small/></Pressable></View><Pressable accessibilityRole="button" accessibilityLabel="Explore Japji Sahib" onPress={() => go('map')} style={[s.worldCard, { backgroundColor: t.action }]}><Image source={host.image('journey-calm.jpg')} style={s.fill} resizeMode="cover"/><View style={s.worldCaption}><Text style={[s.text, { color: light.primary, fontSize: 28, fontFamily: bold }]}>Japji Sahib</Text><Text style={[s.text, { color: light.primary, fontSize: 14 }]}>38 pauris · 6 regions</Text></View><View style={s.worldCta}><Text style={[s.text, { color: '#fff', fontFamily: bold }]}>{completed ? 'Continue exploring' : 'Begin your journey'}  →</Text></View></Pressable><View style={s.pad}><Button onPress={() => openPauri(selected)}>Continue Pauri {selected}</Button><Small>{attempts.length ? `${attempts.length} challenges completed · Your journey is saved here.` : "Your progress saves on this device."}</Small></View><Section>More banis</Section>{['Jaap Sahib', 'Anand Sahib', 'Chaupai Sahib', 'Rehras Sahib', 'Tav Prasad Savaiye', 'Kirtan Sohila'].map(name => <Row key={name} title={name} subtitle="Coming later" icon="book-open" onPress={() => setNotice(`${name} is a preview. Japji Sahib is ready to explore.`)}/>)}</>}
      {screen === 'map' && <><View style={s.pad}><View style={s.rowBody}><View style={s.grow}><Heading>{chapter.name}</Heading><Small>Region {region + 1} of 6 · Pauris {chapter.start}–{chapter.end}</Small></View><Icon name="star" color="#cba51e"/><Copy>{totalStars}/114</Copy></View></View><HorizontalScroll><View style={[s.inline, { paddingHorizontal: 16, paddingBottom: 14 }]}>{regions.map((r, i) => <Pressable accessibilityRole="button" accessibilityState={{ selected: region === i }} key={r.name} onPress={() => setRegion(i)} style={[s.chip, { backgroundColor: region === i ? t.primary : t.subtle, borderColor: t.separator }]}><Copy style={{ color: region === i ? '#fff' : t.text, fontSize: 14 }}>{i + 1}. {r.name}</Copy></Pressable>)}</View></HorizontalScroll><View style={[s.map, { aspectRatio: chapter.aspectRatio }]}><Image source={host.image(chapter.image)} accessibilityLabel={chapter.description} style={s.fill} resizeMode="cover"/><View style={s.mapCaption}><Text style={[s.text, { color: light.primary, fontSize: 12 }]}>{chapter.place}</Text></View>{Array.from({ length: chapter.end - chapter.start + 1 }, (_, i) => { const n = chapter.start + i; const count = progress.best[String(n)] ?? 0; return <Pressable key={n} accessibilityRole="button" accessibilityLabel={`Pauri ${n}, ${count} of 3 stars`} onPress={() => openPauri(n)} style={[s.mapNode, { left: `${chapter.nodes[i][0]}%`, top: `${chapter.nodes[i][1]}%`, marginLeft: -30, marginTop: -24 }]}><View style={[s.nodeDisc, { backgroundColor: n === selected ? t.primary : count ? '#426a46' : '#fff', borderColor: n === selected ? (collection.find(r => r.id === progress.equipped)?.color ?? '#fff') : '#fff' }]}><Text style={[s.text, { fontFamily: bold, fontSize: 23, color: count || n === selected ? '#fff' : light.primary }]}>{n}</Text></View><View style={s.nodeStars}><Stars count={count}/></View></Pressable>; })}</View><View style={s.pad}><Button onPress={() => openPauri(selected)}>Continue with Pauri {selected}  →</Button></View></>}
      {screen === 'pauri' && <><View style={[s.pad, s.center, { backgroundColor: t.subtle }]}><Small>Japji Sahib</Small><Heading>Pauri {selected}</Heading><Stars count={best} large/><Small>{pauri.lines.length} lines · Your best: {best}/3 stars</Small></View>{story && <View style={{ padding: 16, gap: 10 }}>
        <Copy style={{ fontFamily: bold, fontSize: 18 }}>{story.title}</Copy>
        <StoryScene pauri={selected} line={0} host={host} overview/>
        <Small>The whole landscape for this pauri. Follow its landmarks as you practice.</Small>
      </View>}<Row title="Practice" subtitle="Listen and practice one line at a time" icon="headphones" onPress={() => { setLine(0); go('practice'); }}/><Row title="Challenge" subtitle="Recite continuously. Review at the end." icon="mic" onPress={() => go('ready')}/>{story && <Row title="Walk the story" subtitle={`Explore ${story.stops.length} connected visual cues`} icon="map" onPress={() => { setLine(0); go('story'); }}/>}<View style={s.pad}><Row title="Recall practice" subtitle="Hide the words until you are ready" trailing={<Switch accessibilityLabel="Recall practice" value={recall} onValueChange={setRecall}/>}/></View><View style={s.pad}><Heading>Stars and coins</Heading><Copy>Every new star earns 10 Nanak coins.</Copy><Small>1 star: 60–79% · 2 stars: 80–94% · 3 stars: 95–100%. These thresholds are proposed for V1.</Small><Small>Replays keep your best result. Improve your stars to earn the difference.</Small></View></>}
      {screen === 'story' && <View style={s.pad}>
        <View style={s.rowBody}><View style={s.grow}><Copy style={{ fontFamily: bold, fontSize: 18 }}>{storyStop.place}</Copy></View><Small>Line {line + 1} of {pauri.lines.length}</Small></View>
        {illustrations && <StoryScene pauri={selected} line={line} host={host} overview={showOverview} onSelect={n => { audio.stop(); setLine(n); }}/>}
        <Copy style={[s.verse, { fontSize: textSize }]}>{current.text}</Copy>
        <Copy style={{ fontSize: 19, lineHeight: 29, marginBottom: 12, color: t.text }}>{current.transliteration}</Copy>{meaning && <Copy style={s.translation}>{current.translation}</Copy>}
        <Row expanded={showCue} title="About this picture" onPress={() => setShowCue(v => !v)} trailing={<Copy>{showCue ? '−' : '+'}</Copy>}/>
        {showCue && <Small>{storyStop.reflection}</Small>}
        {illustrations && <Button secondary onPress={() => setShowOverview(v => !v)}>{showOverview ? 'Show this place' : 'Show the whole path'}</Button>}
        {audio.error.length > 0 && <Copy style={{ color: t.retryText }}>{audio.error}</Copy>}
      </View>}
      {screen === 'practice' && <View style={s.pad}>
        <View style={s.rowBody}><View style={s.grow}><Copy style={{ fontFamily: bold, fontSize: 18 }}>{recall ? 'Recall practice' : 'Listen and repeat'}</Copy></View><Small>Line {line + 1} of {pauri.lines.length}</Small></View>
        {illustrations && story && <StoryScene pauri={selected} line={line} host={host}/>}
        {recall && !revealed ? <><Heading>Can you recall this line?</Heading><Button secondary onPress={() => setRevealed(true)}>Show the words</Button></> : <><Copy style={[s.verse, { fontSize: textSize }]}>{current.text}</Copy><Copy style={{ fontSize: 19, lineHeight: 29, marginBottom: 12, color: t.text }}>{current.transliteration}</Copy>{meaning && <Copy style={s.translation}>{current.translation}</Copy>}</>}
        <View style={s.rowBody}><View style={s.grow}><Small>Bhai Jarnail Singh</Small></View><Pressable accessibilityRole="button" accessibilityLabel={slow ? 'Playback speed 0.8 times. Switch to normal speed' : 'Playback speed normal. Switch to slower speed'} onPress={() => { audio.stop(); setSlow(v => !v); }} style={[s.speed, { borderColor: t.separator }]}><Copy>{slow ? '0.8×' : '1×'} speed</Copy></Pressable></View>
        <Row expanded={showLines} title="Choose a line" onPress={() => setShowLines(v => !v)} trailing={<Copy>{showLines ? '−' : '+'}</Copy>}/>
        {showLines && pauri.lines.map((l, i) => <Row key={i} title={recall ? `Line ${i + 1}` : `${i + 1}. ${l.text}`} onPress={() => { audio.stop(); setLine(i); setShowLines(false); }} trailing={<Copy>{i === line ? '✓' : ''}</Copy>}/>)}
        {audio.error.length > 0 && <Copy style={{ color: t.retryText }}>{audio.error}</Copy>}
      </View>}
      {screen === 'ready' && <View style={s.pad}><View style={[s.center, { paddingVertical: 22 }]}><Icon name="mic" color={t.primary} size={44}/></View><Heading>Recite Pauri {selected}</Heading><Copy>Recite continuously. The final app will follow your words and move on when you finish each line. Review your pronunciation at the end.</Copy><Button onPress={() => { if (autoScore)
        setScore(attempts.some(a => a.pauri === selected) ? 96 : 84); setLine(0); setTick(0); setRunning(true); setScreen('challenge'); }}>Begin challenge</Button><Small>Interactive preview: no microphone is used. Alignment and feedback are simulated.</Small><Button secondary onPress={() => go('practice')}>Practice first</Button></View>}
      {screen === 'challenge' && <View style={s.pad}><View style={s.rowBody}><View style={s.grow}><Small>{running ? 'Reciting' : 'Paused'}</Small></View><Small>Line {line + 1} of {pauri.lines.length}</Small></View><View style={[s.track, { backgroundColor: t.separator }]}><View style={{ height: 4, width: `${tick / (pauri.lines.length * 4) * 100}%`, backgroundColor: t.primary }}/></View>{illustrations && story && <StoryScene pauri={selected} line={line} host={host}/>}<View accessibilityLiveRegion="polite" style={{ paddingVertical: 16 }}><Copy style={[s.verse, { fontSize: textSize, textAlign: 'center' }]}>{current.text}</Copy><Copy style={{ color: t.secondary, fontSize: 19, textAlign: 'center', marginTop: 22 }}>{pauri.lines[line + 1]?.text ?? 'Final line'}</Copy></View><Button secondary onPress={() => setRunning(v => !v)}>{running ? 'Pause challenge' : 'Resume challenge'}</Button><Small>Timed preview only. The final app will wait for you to finish each line. No voice is recorded here.</Small></View>}
      {screen === 'results' && <View style={s.pad}>
        <Heading>Challenge complete</Heading>
        <View style={s.rowBody}><View style={s.grow}><Copy style={{ fontFamily: bold, fontSize: 44, lineHeight: 54 }}>{score}%</Copy><Small>Example pronunciation score</Small></View><Stars count={stars} large/></View>
        <View style={[s.info, { backgroundColor: t.action, marginVertical: 4 }]}><Copy style={{ fontFamily: bold }}>{award ? `+${award} Nanak coins` : 'Best score kept'}</Copy><Small>{award ? '10 coins for each new star' : 'Improve your best star count to earn more coins.'}</Small></View>
        <WordReview pauri={pauri} score={score} textSize={textSize} onPractice={index => { setLine(index); setRecall(false); go('practice'); }}/>
        <Button onPress={() => { if (selected < 38)
            openPauri(selected + 1);
        else
            go('map'); }}>{selected < 38 ? 'Continue to the next pauri' : 'Return to the journey'}</Button>
        <Button secondary onPress={() => go('rewards')}>Visit rewards</Button>
        <View style={s.inline}><Button secondary onPress={() => go('ready')}>Try again</Button><Button secondary onPress={() => go('map')}>Back to map</Button></View>
      </View>}
      {screen === 'rewards' && <RewardsScreen progress={progress} setProgress={setProgress} onEarn={() => go('map')}/>}
      {screen === 'journal' && <View style={s.pad}><View style={s.center}><Avatar /><Heading>{characters.find(c => c.id === character)?.name}’s journey</Heading><Button secondary onPress={() => go('character')}>Customize my explorer</Button></View><View style={[s.info, s.rowBody, { backgroundColor: t.subtle }]}>{[[completed, 'pauris'], [totalStars, 'stars'], [progress.coins, 'coins']].map(([n, label]) => <View key={label} style={[s.grow, s.center]}><Copy style={{ fontSize: 28, fontFamily: bold }}>{n}</Copy><Small>{label}</Small></View>)}</View><Heading>Your progress</Heading>{completed ? Object.entries(progress.best).map(([n, count]) => <Row key={n} title={`Pauri ${n}`} trailing={<Stars count={count}/>} onPress={() => openPauri(Number(n))}/>) : <Button onPress={() => go('map')}>Explore your first pauri</Button>}<Heading>Recent practice</Heading>{attempts.slice(0, 8).map((a, i) => <Row key={`${a.at}-${i}`} title={`Pauri ${a.pauri} · ${a.score}%`} subtitle={`Sample challenge ${attempts.length - i}`} onPress={() => openPauri(a.pauri)} trailing={<Stars count={starsForScore(a.score)}/>}/>)}<Small>Progress is shared between both characters and saved on this browser.</Small></View>}
    </View></Scroll></View>
    {(screen === 'practice' || screen === 'story') && <View style={[s.readingControls, { backgroundColor: t.surface, borderColor: t.separator, paddingBottom: Math.max(12, host.safeArea.bottom) }]}>
      <Pressable accessibilityRole="button" accessibilityLabel="Previous line" accessibilityState={{ disabled: line === 0 }} disabled={line === 0} onPress={() => { audio.stop(); setLine(n => n - 1); }} style={[s.iconButton, { opacity: line === 0 ? 0.35 : 1 }]}><Icon name="chevron-left" color={t.text}/></Pressable>
      <View style={s.grow}><Button onPress={() => audio.playing ? audio.stop() : audio.listen(current.start, current.end, slow ? 0.8 : 1)}>{audio.playing ? 'Pause' : 'Listen'}</Button></View>
      <View style={s.grow}><Button secondary onPress={() => { audio.stop(); if (line === pauri.lines.length - 1) {
            if (screen === 'story') {
                setLine(0);
                setRecall(true);
                go('practice');
            }
            else
                go('ready');
        }
        else
            setLine(n => n + 1); }}>{line === pauri.lines.length - 1 ? (screen === 'story' ? 'Try recall' : 'Challenge') : 'Next line'}</Button></View>
    </View>}
    {(main || screen === 'settings' || screen === 'reader') && <View style={[s.nav, { backgroundColor: t.primary, paddingBottom: Math.max(8, host.safeArea.bottom) }]}>{(main ? [{ target: 'world', label: 'Worlds', icon: 'book-open' }, { target: 'map', label: 'Journey', icon: 'map' }, { target: 'rewards', label: 'Rewards', icon: 'coins' }, { target: 'journal', label: 'Explorer', icon: 'navigation' }] : [{ target: 'home', label: 'Home', icon: 'home' }, ...(screen === 'reader' ? [{ target: 'reader', label: audio.playing ? 'Pause' : 'Listen', icon: 'volume-2' }] : []), { target: 'settings', label: 'Settings', icon: 'settings' }]).map(item => <Pressable accessibilityRole="button" accessibilityLabel={item.label} accessibilityState={{ selected: screen === item.target }} key={item.label} onPress={() => { if (item.target === 'settings')
        settings();
    else if (item.target === 'reader') {
        audio.playing ? audio.stop() : audio.listen(current.start, current.end, slow ? 0.8 : 1);
    }
    else if (item.target === 'home')
        go('home');
    else if (item.target === 'world')
        go('world');
    else if (item.target === 'map')
        go('map');
    else if (item.target === 'rewards')
        go('rewards');
    else
        go('journal'); }} style={s.navItem}><View style={[s.navIcon, { backgroundColor: screen === item.target ? '#faf9f6' : 'transparent' }]}><Icon name={item.icon === 'home' ? 'home' : item.icon === 'map' ? 'map' : item.icon === 'coins' ? 'coins' : item.icon === 'navigation' ? 'navigation' : item.icon === 'volume-2' ? 'volume-2' : item.icon === 'settings' ? 'settings' : 'book-open'} color={screen === item.target ? t.primary : '#faf9f6'} size={24}/></View><Text style={[s.text, { color: '#faf9f6', fontSize: 12 }]}>{item.label}</Text></Pressable>)}</View>}
    {saveFailed && <View style={s.toast}><Text style={[s.text, { color: '#fff' }]}>This browser cannot save progress. Keep this tab open while testing.</Text></View>}{notice.length > 0 && <View accessibilityLiveRegion="polite" style={[s.toast, { bottom: host.safeArea.bottom + 90 }]}><Text style={[s.text, { color: '#fff', fontSize: 14 }]}>{notice}</Text></View>}
  </View></UIProvider>;
}
