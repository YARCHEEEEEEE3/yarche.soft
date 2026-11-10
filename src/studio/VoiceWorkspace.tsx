import {useState} from 'react';
import type {ComponentProps} from 'react';
import {Mic,Monitor} from 'lucide-react';
import DeviceVoiceWorkspace from './DeviceVoiceWorkspace';
import FishVoiceWorkspace from '../fish/FishVoiceWorkspace';
import '../fish/fish.css';

export type VoiceWorkspaceProps=ComponentProps<typeof DeviceVoiceWorkspace>;
export default function VoiceWorkspace(props:VoiceWorkspaceProps){
 const [provider,setProvider]=useState<'fish'|'device'>('fish');
 const uk=props.language==='uk';
 return <><div className="fish-provider-switch" role="group" aria-label={uk?'Сервіс озвучки':'Voice service'}><button aria-pressed={provider==='fish'} onClick={()=>setProvider('fish')}><Mic size={16}/>Fish Audio <small>AI · MP3</small></button><button aria-pressed={provider==='device'} onClick={()=>setProvider('device')}><Monitor size={16}/>{uk?'Голос пристрою':'Device voice'}<small>{uk?'Демо':'Demo'}</small></button></div>{provider==='fish'?<FishVoiceWorkspace {...props}/>:<DeviceVoiceWorkspace {...props}/>}</>;
}
