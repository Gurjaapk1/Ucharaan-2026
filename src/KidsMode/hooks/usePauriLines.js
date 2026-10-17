import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { logError } from "@common";
import { getPauriLines } from "../data/japji";

const usePauriLines = (pauri) => {
  const language = useSelector((state) => state.transliterationLanguage);
  const [lines, setLines] = useState([]);

  useEffect(() => {
    let active = true;
    getPauriLines(pauri, language)
      .then((result) => active && setLines(result))
      .catch(logError);
    return () => {
      active = false;
    };
  }, [pauri, language]);

  return lines;
};

export default usePauriLines;
