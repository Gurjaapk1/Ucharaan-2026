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
  const {Sheet,audio,clip}=host;
  // Real scores when the recitation was actually heard; fixtures otherwise.
  const review=useMemo(()=>measured??sampleWordReview(pauri,pauri.lines.map((_,i)=>lineScore(score,i,pauri.lines.length))),[measured,pauri,score]);
  const words=review.flatMap(line=>line.tokens.flatMap(token=>token.kind==='word'?[token.feedback]:[]));
  // The service judges words as like/check/unclear rather than by number. Its
  // states use the design's own two styles: check as Practice, like as Clear;
  // unclear (not heard well enough to judge) is left unmarked.
  const judged=words.some(word=>word.state!==undefined);
  const practice=(word:WordFeedback)=>judged?word.state==='check':word.score<80;
  const unheard=(word:WordFeedback)=>word.state==='unclear';
  const flagged=words.filter(practice);
  // The word the service picked as most worth practising opens first.
  const practise=words.find(word=>word.practise)??null;
  const wordStyle=(word:WordFeedback)=>unheard(word)?{}:{color:practice(word)?t.retryText:t.successText,backgroundColor:practice(word)?t.retry:t.success,textDecorationLine:practice(word)?'underline' as const:'none' as const};
  const [selected,setSelected]=useState<WordFeedback|null>(null);
  const prompt=selected?practicePrompt(selected):null;
  const currentLine=selected?pauri.lines[selected.lineIndex]:null;
  function close(){audio.stop();clip?.stop();setSelected(null);}
  // The reciter's own word, next to the line from the Bhai Jarnail Singh track.
  const clipButton=(word:WordFeedback)=>clip&&word.clip?<Button secondary onPress={()=>{audio.stop();clip.play(word.clip!);}}>Hear the reciter say {word.text}</Button>:null;
  return <>
    <Heading>Your words</Heading>
    <Small>Tap a word to hear it.</Small>
    <View style={[s.wrap,{marginVertical:4}]}>
      <Copy style={{color:t.successText,backgroundColor:t.success,paddingHorizontal:8}}>Clear</Copy>
      <Copy style={{color:t.retryText,backgroundColor:t.retry,paddingHorizontal:8,textDecorationLine:'underline'}}>Practice</Copy>
    </View>
    <Small>Example feedback · {flagged.length} words to practice</Small>
    {flagged.length>0&&<Button secondary onPress={()=>setSelected(practise??flagged[0])}>Words to practise</Button>}
    <View style={{gap:22,marginVertical:12}}>{review.map((line,lineIndex)=><View key={lineIndex} style={{gap:7}}>
      <View style={s.rowBody}><View style={s.grow}><Small>Line {lineIndex+1}</Small></View><Small>{line.score}%</Small></View>
      <Text style={[s.text,{fontSize:textSize,lineHeight:lineFor(textSize),color:t.text}]}>{line.tokens.map((token,index)=>token.kind==='separator'?<Text key={index}>{token.text}</Text>:<Text key={index} accessible accessibilityRole="button" accessibilityLabel={`${token.text}, example score ${token.feedback.score} percent, ${practice(token.feedback)?'practice':unheard(token.feedback)?'not heard clearly':'clear'}. Open practice tip`} onPress={()=>{audio.stop();setSelected(token.feedback);}} style={wordStyle(token.feedback)}>{token.text}</Text>)}</Text>
    </View>)}</View>
    <Sheet open={selected!==null} onOpenChange={open=>{if(!open)close();}} title="Practice coach">
      {selected&&prompt&&currentLine&&<View style={{padding:20,gap:14,backgroundColor:t.surface}}>
        <View style={s.rowBody}><View style={s.grow}><Copy style={{fontFamily:bold,fontSize:36,lineHeight:lineFor(36)}}>{selected.text}</Copy><Small>Line {selected.lineIndex+1} · Word {selected.wordIndex+1}</Small></View><View style={{padding:12,borderRadius:10,backgroundColor:practice(selected)?t.retry:unheard(selected)?t.subtle:t.success}}><Copy style={{fontFamily:bold,fontSize:26,lineHeight:lineFor(26),color:practice(selected)?t.retryText:unheard(selected)?t.secondary:t.successText}}>{selected.score}%</Copy><Small>Practice score</Small></View></View>
        <Heading>{prompt.title}</Heading>
        <Copy>{prompt.tip}</Copy>
        <View style={{gap:8}}>{prompt.steps.map((step,i)=><Copy key={step}>{i+1}. {step}</Copy>)}</View>
        {clipButton(selected)}
        {clip&&clip.error.length>0&&selected.clip&&<Copy style={{color:t.retryText}}>{clip.error}</Copy>}
        <Button onPress={()=>audio.playing?audio.stop():audio.listen(currentLine.start,currentLine.end,0.8)}>{audio.playing?'Stop':'Hear it again'}</Button>
        <Small>Bhai Jarnail Singh · Slower playback</Small>
        <Button secondary onPress={()=>{const line=selected.lineIndex;close();onPractice(line);}}>Say this line</Button>
        {flagged.length>1&&<Button secondary onPress={()=>{audio.stop();const index=flagged.findIndex(word=>word.id===selected.id);setSelected(flagged[(index+1)%flagged.length]);}}>Next word</Button>}
        {audio.error.length>0&&<Copy style={{color:t.retryText}}>{audio.error}</Copy>}
        <Button secondary onPress={close}>Back</Button>
        <Small>{measured?'Each word shows how its line went.':'These are practice ideas, not a check of your voice.'}</Small>
      </View>}
    </Sheet>
  </>;
}
