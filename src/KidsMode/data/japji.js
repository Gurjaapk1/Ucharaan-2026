import { logError } from "@common";
import initDB from "../../database/connect";
import { getTranslitText } from "../../database/utils";

export const JAPJI_BANI_ID = 2;
export const PAURI_COUNT = 38;

// mv_Banis_Shabad Seqs per pauri. The scoring service and its word clips cover Pauri 1 only.
export const PAURI_SEQS = { 1: [5, 6, 7, 8, 9, 10] };

export const isPauriReady = (pauri) => Boolean(PAURI_SEQS[pauri]);

export const REGIONS = [
  { name: "The beginning", start: 1, end: 6 },
  { name: "By the river", start: 7, end: 12 },
  { name: "Paths of listening", start: 13, end: 18 },
  { name: "An open horizon", start: 19, end: 24 },
  { name: "A world of wonder", start: 25, end: 30 },
  { name: "Growing in grace", start: 31, end: 38 },
];

// Word index is the position in split(" "), as in db.js; transliteration is paired per word
// only when it splits into the same number of words.
export const toPauriLine = ({ Seq, GurmukhiUni, Transliterations }, language) => {
  const translit = Transliterations ? getTranslitText(Transliterations, language) || "" : "";
  const gurmukhi = GurmukhiUni.split(" ");
  const roman = translit.split(" ");
  const paired = roman.length === gurmukhi.length;
  return {
    seq: Seq,
    translit,
    words: gurmukhi.map((text, index) => ({ text, translit: paired ? roman[index] : null })),
  };
};

export const getPauriLines = async (pauri, language) => {
  const seqs = PAURI_SEQS[pauri];
  if (!seqs) return [];
  const db = await initDB();
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        `SELECT Seq, GurmukhiUni, Transliterations FROM mv_Banis_Shabad
         WHERE Bani = ? AND Seq BETWEEN ? AND ? ORDER BY Seq ASC;`,
        [JAPJI_BANI_ID, seqs[0], seqs[seqs.length - 1]],
        (_tx, { rows }) => {
          resolve(
            Array.from({ length: rows.length }, (_, i) => toPauriLine(rows.item(i), language))
          );
        },
        (error) => {
          logError(error);
          reject(error);
        }
      );
    });
  });
};
