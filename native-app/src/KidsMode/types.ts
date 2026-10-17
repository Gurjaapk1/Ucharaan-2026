import type {Experience} from './experience';
import type {ReviewedLine} from './wordFeedback';
import type { ComponentType, PropsWithChildren } from 'react';
import type { ImageSourcePropType } from 'react-native';

export type Pauri = { number: number; lines: { text: string; transliteration: string; translation: string; start: number; end: number }[] };
export type Character = 'prem' | 'sehaj';
export type Screen = 'home' | 'settings' | 'reader' | 'character' | 'world' | 'map' | 'pauri' | 'practice' | 'ready' | 'challenge' | 'results' | 'rewards' | 'journal' | 'story';
export type IconName = 'shirt' | 'satchel' | 'rabab' | 'basket' | 'leaf' | 'hand' | 'settings' | 'chevron-left' | 'home' | 'book-open' | 'map' | 'coins' | 'navigation' | 'headphones' | 'mic' | 'volume-2' | 'star';
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
   * Live recitation. Optional provider adapter. The current Expo web and native builds record
   * audio and use the service; the historical prototype simulates recitation.
   */
  recitation?: {
    granted: boolean;
    requestPermission: () => Promise<boolean>;
    cancel?: () => Promise<void>;
    retry?: () => Promise<boolean>;
    start: (pauriNumber: number, lineCount: number) => Promise<boolean>;
    /**
     * Finish the current line.
     *
     * `nextLine` means that line is scored and recording has moved on to the
     * next one; `review` means the pauri is complete; `retry` means this line
     * got no score — the service heard too little or could not be reached —
     * and the child should say it again.
     */
    stop: () => Promise<
      | {review: ReviewedLine[]; score: number}
      | {nextLine: number; lineScore: number}
      | {retry: string}
      | null
    >;
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
    provider?: "service" | "local";
  };
  statusBarBackground?: string;
  safeArea: {top: number; bottom: number};
};
