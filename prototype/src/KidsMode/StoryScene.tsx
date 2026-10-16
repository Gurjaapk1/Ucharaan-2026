import {useEffect,useRef,useState} from 'react';
import {AccessibilityInfo,Animated, Pressable, Text, View} from 'react-native';
import {pauriOneStory} from './story';
import {font, light} from './theme';
import type {HostPorts} from './types';

export function StoryScene({line,host,overview=false,onSelect}:{line:number;host:HostPorts;overview?:boolean;onSelect?:(line:number)=>void}) {
  const [reduced,setReduced]=useState(false);
  useEffect(()=>{let active=true;AccessibilityInfo.isReduceMotionEnabled().then(value=>{if(active)setReduced(value);});const subscription=AccessibilityInfo.addEventListener('reduceMotionChanged',setReduced);return()=>{active=false;subscription.remove();};},[]);
  const stop=pauriOneStory[line]??pauriOneStory[0];
  const pan=useRef(new Animated.Value(stop.x)).current;
  useEffect(()=>{const move=Animated.timing(pan,{toValue:stop.x,duration:reduced?0:450,useNativeDriver:false});move.start();return()=>move.stop();},[pan,stop.x,reduced]);
  return <View style={{gap:8}}>
    <View style={{height:overview?118:200,overflow:'hidden',borderRadius:12,backgroundColor:'#d7ddbf'}}>
      <Animated.Image source={host.image('pauri-1-story-panorama.png')} resizeMode={overview?"contain":"cover"} accessibilityLabel={overview?'The whole connected Pauri 1 memory walk':`${stop.place}. ${stop.cue}`} style={overview?{width:'100%',height:'100%'}:{position:'absolute',width:'280%',height:'160%',top:'-30%',left:pan.interpolate({inputRange:[0,1],outputRange:['0%','-180%']})}}/>
    </View>
    {onSelect&&<View style={{flexDirection:'row',gap:4,justifyContent:'space-between'}}>{pauriOneStory.map((s,i)=><Pressable accessibilityRole="button" accessibilityLabel={`Story stop ${i+1}: ${s.place}`} accessibilityState={{selected:i===line}} key={s.place} onPress={()=>onSelect?.(i)} style={{flex:1,minHeight:35,borderRadius:8,alignItems:'center',justifyContent:'center',backgroundColor:i===line?light.primary:light.action}}><Text style={{fontFamily:font,color:i===line?'#fff':light.primary}}>{i+1}</Text></Pressable>)}</View>}
  </View>;
}
