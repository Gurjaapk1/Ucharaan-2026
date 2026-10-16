import { useCallback, useEffect, useMemo, useRef, useState, type PropsWithChildren } from 'react';
import { Carousel, MobileScroll, useMobileDevice } from './mobile';
import KidsApp from './KidsMode/KidsApp';
import type { HostPorts, IconName } from './KidsMode/types';
import pauris from './bani.json';

const referenceAudio = 'https://gurbani-audios-c4abhzghhnccd5gj.z01.azurefd.net/audios/BhaiJarnailSingh/JapjiSahib.m4a';
const image = (file: string) => ({uri:`/assets/${file}`});
function Scroll({children}:PropsWithChildren) {return <MobileScroll className="kids-scroll">{children}</MobileScroll>;}
function HorizontalScroll({children}:PropsWithChildren) {return <Carousel ariaLabel="Choose journey region">{children}</Carousel>;}
function Icon({name,color,size=22}:{name:IconName;color:string;size?:number}) {
  return <span aria-hidden="true" style={{display:'inline-block',flexShrink:0,width:size,height:size,backgroundColor:color,mask:`url(/assets/${name}.svg) center / contain no-repeat`,WebkitMask:`url(/assets/${name}.svg) center / contain no-repeat`}}/>;
}

// Browser-only ports. Native integration supplies ScrollView, host icons,
// bundled image requires, safe-area insets and the existing TrackPlayer adapter.
export default function Prototype() {
  const {device}=useMobileDevice();
  const player=useRef<HTMLAudioElement|null>(null);
  const end=useRef(0);
  const request=useRef(0);
  const [playing,setPlaying]=useState(false);
  const [error,setError]=useState('');
  const stop=useCallback(()=>{request.current++;player.current?.pause();setPlaying(false);setError('');},[]);
  const listen=useCallback((start:number,finish:number)=>{
    const audio=player.current;if(!audio)return;
    const id=++request.current;audio.pause();setError('');end.current=finish;audio.currentTime=start;
    void audio.play().then(()=>{if(id===request.current)setPlaying(true);}).catch(()=>{if(id===request.current){setError('Audio could not load. Please try again.');setPlaying(false);}});
  },[]);
  useEffect(()=>()=>{player.current?.pause();},[]);
  const host=useMemo<HostPorts>(()=>({Scroll,HorizontalScroll,Icon,image,audio:{playing,error,listen,stop},statusBarBackground:'#ffffff',safeArea:{top:device.geometry.safeArea.top,bottom:device.platform==='ios'?device.geometry.safeArea.bottom:8}}),[device,playing,error,listen,stop]);
  return <div className="uchaaran"><audio ref={player} src={referenceAudio} preload="none" onTimeUpdate={()=>{if(player.current&&player.current.currentTime>=end.current){player.current.pause();setPlaying(false);}}} onError={()=>{setError('Reference audio is currently unavailable.');setPlaying(false);}}/><KidsApp pauris={pauris} host={host}/></div>;
}
