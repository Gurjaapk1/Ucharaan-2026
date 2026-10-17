import './browser-native-compat';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { BottomSheet, Carousel, MobileScroll, useMobileDevice } from './mobile';
import KidsApp from './KidsMode/KidsApp';
import pauris from './bani.json';
import { freshExperience, parseExperience } from './KidsMode/experience';
const storage = { load: () => { try {
        return parseExperience(JSON.parse(localStorage.getItem('uchaaran-experience-v1') ?? 'null')) ?? freshExperience();
    }
    catch {
        return freshExperience();
    } }, save: (value) => { try {
        localStorage.setItem('uchaaran-experience-v1', JSON.stringify(value));
        return true;
    }
    catch {
        return false;
    } } };
const referenceAudio = 'https://gurbani-audios-c4abhzghhnccd5gj.z01.azurefd.net/audios/BhaiJarnailSingh/JapjiSahib.m4a';
const image = (file) => ({ uri: `/assets/${file}` });
function Sheet({ children, ...props }) {
    const { device } = useMobileDevice();
    // MobileScroll is absolutely positioned; give it a bounded sheet viewport.
    return <BottomSheet {...props} snap={0.86}><div style={{ position: 'relative', height: Math.round(device.geometry.screen.height * 0.86) - 90 }}><MobileScroll className="kids-scroll">{children}</MobileScroll></div></BottomSheet>;
}
const scrollPositions = new Map();
function Scroll({ children, positionKey }) {
    const frame = useRef(null);
    useLayoutEffect(() => {
        if (!positionKey) return;
        const scroll = frame.current?.querySelector('[data-testid="mobile-scroll"]');
        if (scroll) scroll.scrollTop = scrollPositions.get(positionKey) ?? 0;
    }, [positionKey]);
    return <div ref={frame} style={{ position: 'absolute', inset: 0 }} onScrollCapture={event => {
        if (positionKey && event.target.matches('[data-testid="mobile-scroll"]')) scrollPositions.set(positionKey, event.target.scrollTop);
    }}><MobileScroll className="kids-scroll">{children}</MobileScroll></div>;
}
function HorizontalScroll({ children }) { return <Carousel ariaLabel="Choose journey region">{children}</Carousel>; }
function Icon({ name, color, size = 22 }) {
    return <span aria-hidden="true" style={{ display: 'inline-block', flexShrink: 0, width: size, height: size, backgroundColor: color, mask: `url(/assets/${name}.svg) center / contain no-repeat`, WebkitMask: `url(/assets/${name}.svg) center / contain no-repeat` }}/>;
}
// Browser-only ports. Native integration supplies ScrollView, host icons,
// bundled image requires, safe-area insets and the existing TrackPlayer adapter.
export default function Prototype() {
    const { device } = useMobileDevice();
    const player = useRef(null);
    const end = useRef(0);
    const request = useRef(0);
    const [playing, setPlaying] = useState(false);
    const [error, setError] = useState('');
    const stop = useCallback(() => { request.current++; player.current?.pause(); setPlaying(false); setError(''); }, []);
    const listen = useCallback((start, finish, rate = 1) => {
        const audio = player.current;
        if (!audio)
            return;
        const id = ++request.current;
        audio.pause();
        setError('');
        end.current = finish;
        audio.currentTime = start;
        audio.playbackRate = rate;
        void audio.play().then(() => { if (id === request.current)
            setPlaying(true); }).catch(() => { if (id === request.current) {
            setError('Audio could not load. Please try again.');
            setPlaying(false);
        } });
    }, []);
    useEffect(() => () => { player.current?.pause(); }, []);
    const host = useMemo(() => ({ Sheet, Scroll, HorizontalScroll, Icon, image, storage, audio: { playing, error, listen, stop }, statusBarBackground: '#ffffff', safeArea: { top: device.geometry.safeArea.top, bottom: device.platform === 'ios' ? device.geometry.safeArea.bottom : 8 } }), [device, playing, error, listen, stop]);
    return <div className="uchaaran"><audio ref={player} src={referenceAudio} preload="none" onTimeUpdate={() => { if (player.current && player.current.currentTime >= end.current) {
        player.current.pause();
        setPlaying(false);
    } }} onError={() => { setError('Reference audio is currently unavailable.'); setPlaying(false); }}/><KidsApp pauris={pauris} host={host}/></div>;
}
