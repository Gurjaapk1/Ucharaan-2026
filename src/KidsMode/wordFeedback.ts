import type {Pauri} from './types';

export type WordFeedback = {
  id:string; text:string; lineIndex:number; wordIndex:number;
  start:number; end:number; score:number;
  focus:'ending'|'beginning'|'whole-word';
  // Set when the scoring service judged the word; the UI then shows the state, not a number.
  state?:'like'|'check'|'unclear'; reasons?:string[]; practise?:boolean;
};
export type ReviewToken = {kind:'separator';text:string}|{kind:'word';text:string;feedback:WordFeedback};
export type ReviewedLine = {text:string;score:number;tokens:ReviewToken[]};

// Preserve whitespace, Gurmukhi combining marks and verse markers verbatim.
// start/end are UTF-16 offsets into the unchanged source line, end exclusive.
export function tokenizeLine(text:string):{text:string;start:number;end:number;word:boolean}[] {
  let offset=0;
  return text.split(/(\s+|[॥।੦-੯0-9]+)/u).filter(Boolean).map(part=>{
    const start=offset;offset+=part.length;
    return {text:part,start,end:offset,word:/\p{L}/u.test(part)};
  });
}

// Display fixtures only. The average stays equal to the displayed line score.
function sampleScores(score:number,count:number,lineIndex:number):number[] {
  if(!count)return [];
  const values=Array.from({length:count},(_,i)=>Math.max(0,Math.min(100,score+(score>=95?0:(i+lineIndex)%3===0?-24:12))));
  let remaining=score*count-values.reduce((a,b)=>a+b,0);
  while(remaining!==0){
    for(let i=0;i<count&&remaining!==0;i++){
      const step=Math.sign(remaining);
      if(values[i]+step>=0&&values[i]+step<=100){values[i]+=step;remaining-=step;}
    }
  }
  return values;
}
export function sampleWordReview(pauri:Pauri,lineScores:readonly number[]):ReviewedLine[] {
  return pauri.lines.map((line,lineIndex)=>{
    const parts=tokenizeLine(line.text);
    const score=lineScores[lineIndex];
    const scores=sampleScores(score,parts.filter(p=>p.word).length,lineIndex);
    let wordIndex=0;
    const tokens:ReviewToken[]=parts.map(part=>{
      if(!part.word)return {kind:'separator',text:part.text};
      const index=wordIndex++;
      return {kind:'word',text:part.text,feedback:{id:`${lineIndex}:${index}`,text:part.text,lineIndex,wordIndex:index,start:part.start,end:part.end,score:scores[index],focus:index%3===0?'ending':index%3===1?'beginning':'whole-word'}};
    });
    return {text:line.text,score,tokens};
  });
}
export function practicePrompt(word:WordFeedback):{title:string;tip:string;steps:string[]} {
  const focus=word.focus==='ending'?'word ending':word.focus==='beginning'?'first sound':'whole word';
  return {
    title:word.score<80?`Practice the ${focus}`:'Keep this word clear',
    tip:word.focus==='ending'?`Listen closely to how ${word.text} ends in the reference. Repeat the ending without rushing.`:word.focus==='beginning'?`Listen to the first sound in ${word.text}. Begin the word clearly, then join it to the rest.`:`Listen to ${word.text} as one word. Repeat it slowly, then at the reference pace.`,
    steps:[`Find ${word.text} in the reference line.`,`Repeat ${word.text} on its own.`,`Recite the full line, keeping that word clear.`],
  };
}
