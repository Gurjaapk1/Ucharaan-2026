import {useMemo,useState} from 'react';
import {Text,View} from 'react-native';
import {Button,Copy,Heading,Small,useUI} from './components';
import {s} from './styles';
import {bold,line as lineFor} from './theme';
import {lineScore} from './content';
import {practicePrompt,sampleWordReview,type ReviewedLine,type WordFeedback} from './wordFeedback';
import type {Pauri} from './types';

export function WordReview({pauri,score,textSize,onPractice,measured}:{pauri:Pauri;score:number;textSize:number;onPractice:(line:number)=>void;measured?:ReviewedLine[]|null}) {
  const {t,host}=useUI();
  const {Sheet,audio}=host;
  // Real scores when the recitation was actually heard; fixtures otherwise.
  const review=useMemo(()=>measured??sampleWordReview(pauri,pauri.lines.map((_,i)=>lineScore(score,i,pauri.lines.length))),[measured,pauri,score]);
  const words=review.flatMap(line=>line.tokens.flatMap(token=>token.kind==='word'?[token.feedback]:[]));
  const flagged=words.filter(word=>word.score<80);
  const [selected,setSelected]=useState<WordFeedback|null>(null);
  const prompt=selected?practicePrompt(selected):null;
  const currentLine=selected?pauri.lines[selected.lineIndex]:null;
  function close(){audio.stop();setSelected(null);}
  return <>
    <Heading>Your pauri, word by word</Heading>
    <Small>Tap a word for its score and a practice tip.</Small>
    <View style={[s.wrap,{marginVertical:4}]}>
      <Copy style={{color:t.successText,backgroundColor:t.success,paddingHorizontal:8}}>Clear</Copy>
      <Copy style={{color:t.retryText,backgroundColor:t.retry,paddingHorizontal:8,textDecorationLine:'underline'}}>Practice</Copy>
    </View>
    <Small>Example feedback · {flagged.length} words to practice</Small>
    {flagged.length>0&&<Button secondary onPress={()=>setSelected(flagged[0])}>Review words to practice</Button>}
    <View style={{gap:22,marginVertical:12}}>{review.map((line,lineIndex)=><View key={lineIndex} style={{gap:7}}>
      <View style={s.rowBody}><View style={s.grow}><Small>Line {lineIndex+1}</Small></View><Small>{line.score}%</Small></View>
      <Text style={[s.text,{fontSize:textSize,lineHeight:lineFor(textSize),color:t.text}]}>{line.tokens.map((token,index)=>token.kind==='separator'?<Text key={index}>{token.text}</Text>:<Text key={index} accessible accessibilityRole="button" accessibilityLabel={`${token.text}, example score ${token.feedback.score} percent, ${token.feedback.score<80?'practice':'clear'}. Open practice tip`} onPress={()=>{audio.stop();setSelected(token.feedback);}} style={{color:token.feedback.score<80?t.retryText:t.successText,backgroundColor:token.feedback.score<80?t.retry:t.success,textDecorationLine:token.feedback.score<80?'underline':'none'}}>{token.text}</Text>)}</Text>
    </View>)}</View>
    <Sheet open={selected!==null} onOpenChange={open=>{if(!open)close();}} title="Practice coach">
      {selected&&prompt&&currentLine&&<View style={{padding:20,gap:14,backgroundColor:t.surface}}>
        <View style={s.rowBody}><View style={s.grow}><Copy style={{fontFamily:bold,fontSize:36,lineHeight:lineFor(36)}}>{selected.text}</Copy><Small>Line {selected.lineIndex+1} · Word {selected.wordIndex+1}</Small></View><View style={{padding:12,borderRadius:10,backgroundColor:selected.score<80?t.retry:t.success}}><Copy style={{fontFamily:bold,fontSize:26,lineHeight:lineFor(26),color:selected.score<80?t.retryText:t.successText}}>{selected.score}%</Copy><Small>Example score</Small></View></View>
        <Heading>{prompt.title}</Heading>
        <Copy>{prompt.tip}</Copy>
        <View style={{gap:8}}>{prompt.steps.map((step,i)=><Copy key={step}>{i+1}. {step}</Copy>)}</View>
        <Button onPress={()=>audio.playing?audio.stop():audio.listen(currentLine.start,currentLine.end,0.8)}>{audio.playing?'Pause reference':'Hear reference line'}</Button>
        <Small>Bhai Jarnail Singh · Slower playback</Small>
        <Button secondary onPress={()=>{const line=selected.lineIndex;close();onPractice(line);}}>Practice this line</Button>
        {flagged.length>1&&<Button secondary onPress={()=>{audio.stop();const index=flagged.findIndex(word=>word.id===selected.id);setSelected(flagged[(index+1)%flagged.length]);}}>Next word to practice</Button>}
        {audio.error.length>0&&<Copy style={{color:t.retryText}}>{audio.error}</Copy>}
        <Button secondary onPress={close}>Back to results</Button>
        <Small>{measured?'Each word carries its line\u2019s score. Word-level scoring needs verified word timings.':'Demo suggestions, not an analysis of your voice. Word-level reference audio will require verified word timings.'}</Small>
      </View>}
    </Sheet>
  </>;
}
