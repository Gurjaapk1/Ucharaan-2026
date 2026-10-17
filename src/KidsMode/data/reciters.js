import { constant } from "@common";
import bjs from "../../ReaderScreen/components/AudioPlayer/assets/lyrics/BhaiJarnailSingh/japji-sahib.json";
import ggs from "../../ReaderScreen/components/AudioPlayer/assets/lyrics/GianiGurdevSingh/JapjiSahib.json";
import imk from "../../ReaderScreen/components/AudioPlayer/assets/lyrics/IndermohanKaurUK/JapjiSahib.json";

// Ids are the scoring service's; tracks and line timings are the ones the reader already ships.
export const RECITERS = {
  ggs: { name: "Giani Gurdev Singh", path: "GianiGurdevSingh/JapjiSahib.m4a", timings: ggs },
  bjs: { name: "Bhai Jarnail Singh", path: "BhaiJarnailSingh/JapjiSahib.m4a", timings: bjs },
  imk: { name: "Bibi Indermohan Kaur", path: "IndermohanKaurUK/JapjiSahib.m4a", timings: imk },
};

export const DEFAULT_RECITER = "ggs";

export const reciterOrDefault = (id) => (RECITERS[id] ? id : DEFAULT_RECITER);

export const reciterTrack = (id) => ({
  id: `kids-japji-${id}`,
  url: `${constant.AUDIO_BASE_URL}/${RECITERS[id].path}`,
  title: "Japji Sahib",
  artist: RECITERS[id].name,
});

export const lineTimings = (id, seqs) =>
  seqs.map((seq) => RECITERS[id].timings.find((line) => line.text === String(seq)));

// Only line timings are bundled, so the word is estimated by spreading the line evenly.
export const activeWord = (timings, wordCounts, position) => {
  const line = timings.findIndex((t) => t && position >= t.start && position < t.end);
  if (line < 0) return null;
  const { start, end } = timings[line];
  const word = Math.floor(((position - start) / (end - start)) * wordCounts[line]);
  return { line, word: Math.min(word, wordCounts[line] - 1) };
};
