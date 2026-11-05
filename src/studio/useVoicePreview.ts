import {useEffect,useRef,useState} from 'react';
import type {VoiceSettings} from './voiceModel';
export function useVoicePreview(){
 const supported=typeof window!=='undefined'&&'speechSynthesis' in window&&'SpeechSynthesisUtterance' in window;
 const [voices,setVoices]=useState<SpeechSynthesisVoice[]>([]),[playing,setPlaying]=useState<string|null>(null),[error,setError]=useState(false);
 const utterance=useRef<SpeechSynthesisUtterance|null>(null),timeout=useRef<ReturnType<typeof setTimeout>|undefined>(undefined);
 function stop(){clearTimeout(timeout.current);utterance.current=null;if(supported)window.speechSynthesis.cancel();setPlaying(null);}
 useEffect(()=>{
  if(!supported)return;
  const synth=window.speechSynthesis,refresh=()=>setVoices(synth.getVoices()),hide=()=>{if(document.hidden)stop();};
  refresh();synth.addEventListener('voiceschanged',refresh);document.addEventListener('visibilitychange',hide);
  return()=>{clearTimeout(timeout.current);utterance.current=null;synth.cancel();synth.removeEventListener('voiceschanged',refresh);document.removeEventListener('visibilitychange',hide);};
 },[supported]);
 function play(settings:VoiceSettings,basePitch:number){
  if(!supported)return;
  stop();setError(false);
  const available=voices.filter(v=>v.lang.toLowerCase().split(/[-_]/)[0]===settings.language);
  const voice=available.find(v=>v.voiceURI===settings.deviceVoice)||available[0];
  if(!voice||!settings.preview.trim())return;
  const u=new SpeechSynthesisUtterance(settings.preview);u.voice=voice;u.lang=voice.lang;u.rate=settings.rate;u.pitch=Math.min(2,Math.max(.5,basePitch+settings.tone*.08));utterance.current=u;
  const finish=()=>{if(utterance.current!==u)return;clearTimeout(timeout.current);utterance.current=null;setPlaying(null);};
  u.onstart=()=>{if(utterance.current===u){clearTimeout(timeout.current);setPlaying(settings.profile);}};
  u.onend=finish;u.onerror=()=>{if(utterance.current!==u)return;finish();setError(true);};
  timeout.current=setTimeout(()=>{if(utterance.current===u){stop();setError(true);}},8000);
  try{window.speechSynthesis.speak(u);}catch{stop();setError(true);}
 }
 return {supported,voices,playing,error,play,stop};
}
