import type {Experience} from './experience';
import type {ReviewedLine} from './wordFeedback';
import type { ComponentType, PropsWithChildren } from 'react';
import type { ImageSourcePropType } from 'react-native';

export type Pauri = { number: number; lines: { text: string; translation: string; start: number; end: number }[] };
export type Character = 'prem' | 'sehaj';
export type Screen = 'home' | 'settings' | 'reader' | 'character' | 'world' | 'map' | 'pauri' | 'practice' | 'ready' | 'challenge' | 'results' | 'rewards' | 'journal' | 'story';
export type IconName = 'settings' | 'chevron-left' | 'home' | 'book-open' | 'map' | 'coins' | 'navigation' | 'headphones' | 'mic' | 'volume-2' | 'star';
export type HostPorts = {
  Sheet: ComponentType<PropsWithChildren<{open:boolean;onOpenChange:(open:boolean)=>void;title:string}>>;
  Scroll: ComponentType<PropsWithChildren>;
  HorizontalScroll: ComponentType<PropsWithChildren>;
  Icon: ComponentType<{name: IconName; color: string; size?: number}>;
  image: (file: string) => ImageSourcePropType;
  storage: {load:()=>Experience;save:(value:Experience)=>boolean};
  audio: { playing: boolean; error: string; listen: (start: number, end: number, rate?: number) => void; stop: () => void };
  /** Plays a single word clip from the scoring service's reference store. */
  clip?: { playing: boolean; error: string; play: (url: string) => void; stop: () => void };
  /**
   * Live recitation. Absent on the web prototype, which has no microphone
   * access and simulates the challenge; present on device, where the child's
   * voice is recorded and scored locally.
   */
  recitation?: {
    granted: boolean;
    requestPermission: () => Promise<boolean>;
    start: (pauriNumber: number, lineCount: number) => Promise<boolean>;
    /** `retry` means no score: the service heard too little, or could not be reached. */
    stop: () => Promise<{review: ReviewedLine[]; score: number} | {retry: string} | null>;
    isRecording: boolean;
    /** 0-1 input level, for a meter. */
    level: number;
    /** The line the child is reciting now. */
    currentLine: number;
    /** Scores for lines already finished, as they land. */
    lineScores: {lineIndex: number; score: number}[];
    error: string | null;
    /** The recording is with the scoring service (3-10 s). */
    checking?: boolean;
    /** False when the pauri is recorded whole and scored at the end, with no line following. */
    following?: boolean;
  };
  statusBarBackground?: string;
  safeArea: {top: number; bottom: number};
};
