import type {Experience} from './experience';
import type { ComponentType, PropsWithChildren } from 'react';
import type { ImageSourcePropType } from 'react-native';

export type Pauri = { number: number; lines: { text: string; translation: string; start: number; end: number }[] };
export type Character = 'prem' | 'sehaj';
export type Screen = 'home' | 'settings' | 'reader' | 'character' | 'world' | 'map' | 'pauri' | 'practice' | 'ready' | 'challenge' | 'results' | 'rewards' | 'journal' | 'story';
export type IconName = 'settings' | 'chevron-left' | 'home' | 'book-open' | 'map' | 'coins' | 'navigation' | 'headphones' | 'mic' | 'volume-2' | 'star';
export type HostPorts = {
  Scroll: ComponentType<PropsWithChildren>;
  HorizontalScroll: ComponentType<PropsWithChildren>;
  Icon: ComponentType<{name: IconName; color: string; size?: number}>;
  image: (file: string) => ImageSourcePropType;
  storage: {load:()=>Experience;save:(value:Experience)=>boolean};
  audio: { playing: boolean; error: string; listen: (start: number, end: number, rate?: number) => void; stop: () => void };
  statusBarBackground?: string;
  safeArea: {top: number; bottom: number};
};
