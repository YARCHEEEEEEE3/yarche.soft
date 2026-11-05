import {useState} from 'react';
import {ArrowLeft,ArrowRight,AudioLines,Calendar,Check,Clock,FileText,Gauge,Globe,Info,Mic,Play,SlidersHorizontal,Smile,Sparkles,Square,UserRound} from 'lucide-react';
import {Blossom} from '../StudioBrand';
import type {Project} from './projects';
import {normalizeVoice,previewText,readVoiceDraft,saveVoiceDraft,voiceProfiles,type VoiceSettings} from './voiceModel';
import {voiceCopy} from './voiceCopy';
import {useVoicePreview} from './useVoicePreview';
import Dialog from './Dialog';
import './voice.css';

type Profile=typeof voiceProfiles[number];
function Avatar({profile}:{profile:Profile}){return <span className={'voice-avatar voice-avatar-'+profile.avatar} aria-hidden="true"/>;}
function Wave({active=false}:{active?:boolean}){return <span className={'voice-wave '+(active?'is-playing':'')} aria-hidden="true">{Array.from({length:29},(_,i)=><i key={i} style={{height:(5+((i*13+7)%21))+'px',animationDelay:(i%7*-.13)+'s'}}/>)}</span>;}

export default function VoiceWorkspace({language,selected,projects,onSelect,onChange,storageWarning}:{language:'uk'|'en';selected?:Project;projects:Project[];onSelect:(id:string)=>void;onChange:(value:VoiceSettings)=>void;storageWarning:boolean}){
 const t=voiceCopy[language];
 const [settings,setSettings]=useState(()=>selected?.voice?normalizeVoice(selected.voice,language):readVoiceDraft(language));
 const [gender,setGender]=useState('all'),[age,setAge]=useState('all'),[mood,setMood]=useState('all'),[modal,setModal]=useState(false),[storageError,setStorageError]=useState(false);
 const audio=useVoicePreview(),profile=voiceProfiles.find(p=>p.id===settings.profile)||voiceProfiles[0];
 const available=audio.voices.filter(v=>v.lang.toLowerCase().split(/[-_]/)[0]===settings.language);
 const canPreview=audio.supported&&available.length>0&&!!settings.preview.trim();
 const filtered=voiceProfiles.filter(v=>(gender==='all'||v.gender===gender)&&(age==='all'||v.age===age)&&(mood==='all'||v.mood===mood));
 const words=(selected?.script.match(/[\p{L}\p{N}]+(?:['’ʼ-][\p{L}\p{N}]+)*/gu)||[]).length;
 const seconds=Math.ceil(words/140/settings.rate*60),duration=words?`${Math.floor(seconds/60).toString().padStart(2,'0')}:${(seconds%60).toString().padStart(2,'0')}`:'—';
 function update(patch:Partial<VoiceSettings>){audio.stop();const next=normalizeVoice({...settings,...patch},language);setSettings(next);if(selected)onChange(next);else if(!saveVoiceDraft(next))setStorageError(true);return next;}
 function preview(p=profile){if(audio.playing===p.id){audio.stop();return;}const next=p.id===settings.profile?settings:update({profile:p.id});audio.play(next,p.pitch);}
 function tags(p:Profile){return <span className="voice-tags"><span><UserRound size={10}/>{t[p.gender]}</span><span>{t[p.age]}</span><span className={'mood-'+p.mood}>{t[p.mood]}</span></span>;}
 const unavailable=!audio.supported?t.noSpeech:!available.length?t.unavailable:!settings.preview.trim()?t.emptyPreview:null;
 return <section className="voice-workspace" aria-label={t.title}>
  <div className="voice-project-bar"><a href="#scripts"><ArrowLeft size={14}/>{t.back}</a><span>{t.step}</span>{projects.length>0&&<label><FileText size={14}/><select aria-label={t.chooseProject} value={selected?.id||''} onChange={e=>onSelect(e.target.value)}>{projects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label>}</div>
  <div className="voice-layout">
   <div className="voice-library-column">
    <div className="voice-filters">
     <label className="voice-language-filter"><span><Globe size={15}/>{t.language}</span><select value={settings.language} onChange={e=>{const value=e.target.value as 'uk'|'en';update({language:value,deviceVoice:'',preview:settings.preview===previewText[settings.language]?previewText[value]:settings.preview});}}><option value="uk">Українська</option><option value="en">English</option></select></label>
     {[{label:t.gender,icon:UserRound,value:gender,set:setGender,values:['all','male','female'] as const},{label:t.age,icon:Calendar,value:age,set:setAge,values:['all','young','adult','mature'] as const},{label:t.mood,icon:Smile,value:mood,set:setMood,values:['all','serious','cheerful','confident'] as const}].map(({label,icon:Icon,value,set,values})=><fieldset key={label}><legend><Icon size={15}/>{label}</legend><div>{values.map(v=><button key={v} aria-pressed={value===v} onClick={()=>set(v)}>{t[v]}</button>)}</div></fieldset>)}
    </div>
    <div className="voice-library-heading"><h2><Mic size={22}/>{t.library}</h2><span>{filtered.length} {t.profiles}</span></div>
    <div className="voice-library">{filtered.map(p=><article key={p.id} className={'voice-card '+(settings.profile===p.id?'is-selected':'')}>
     <button className="voice-card-select" aria-label={t.select+' '+p[language]} aria-pressed={settings.profile===p.id} onClick={()=>update({profile:p.id})}><Avatar profile={p}/><span className="voice-card-person"><strong>{p[language]}</strong>{tags(p)}</span>{settings.profile===p.id&&<span className="voice-selected-check"><Check size={13}/></span>}</button>
     <div className="voice-card-player"><button className="voice-play" disabled={!canPreview} aria-label={(audio.playing===p.id?t.stop:t.preview)+' '+p[language]} onClick={()=>preview(p)}>{audio.playing===p.id?<Square size={12} fill="currentColor"/>:<Play size={13} fill="currentColor"/>}</button><Wave active={audio.playing===p.id}/><span>{t.demo}</span></div>
    </article>)}</div>
    {!filtered.length&&<div className="voice-empty"><SlidersHorizontal size={30}/><h3>{t.noMatches}</h3><p>{t.filterHint}</p><button className="studio-secondary" onClick={()=>{setGender('all');setAge('all');setMood('all');}}>{t.reset}</button></div>}
    <p className="voice-demo-note"><Info size={15}/>{t.demoNote}</p>
    <div className="voice-script-note"><FileText size={17}/><span>{selected?.script.trim()?selected.script.slice(0,170)+(selected.script.length>170?'…':''):t.noScript}</span><a href="#scripts">{t.script}<ArrowRight size={14}/></a></div>
   </div>
   <aside className="voice-settings-panel" aria-label={t.selected}>
    <Blossom className="voice-panel-blossom"/>
    <div className="voice-selected-person"><Avatar profile={profile}/><div><h2>{profile[language]}</h2>{tags(profile)}</div></div>
    <div className="voice-main-player"><button className="voice-play" disabled={!canPreview} aria-label={audio.playing===profile.id?t.stop:t.playText} onClick={()=>preview()}>{audio.playing===profile.id?<Square size={14} fill="currentColor"/>:<Play size={15} fill="currentColor"/>}</button><Wave active={audio.playing===profile.id}/><span>{audio.playing===profile.id?t.playing:t.test}</span></div>
    <label className="voice-preview-label"><span><FileText size={16}/>{t.previewLabel}</span><textarea rows={3} maxLength={200} value={settings.preview} onChange={e=>update({preview:e.target.value})}/><small>{settings.preview.length} / 200</small></label>
    <div className="voice-slider-field"><label htmlFor="voice-rate"><Gauge size={17}/>{t.speed}</label><div><input id="voice-rate" type="range" min="0.5" max="1.5" step="0.05" value={settings.rate} aria-valuetext={settings.rate.toFixed(2)+'×'} onChange={e=>update({rate:Number(e.target.value)})} style={{'--fill':((settings.rate-.5)*100)+'%'} as React.CSSProperties}/><output htmlFor="voice-rate">{Number(settings.rate.toFixed(2))}×</output></div></div>
    <div className="voice-slider-field"><label htmlFor="voice-tone"><AudioLines size={17}/>{t.tone}</label><div><input id="voice-tone" type="range" min="-4" max="4" step="1" value={settings.tone} onChange={e=>update({tone:Number(e.target.value)})} style={{'--fill':((settings.tone+4)/8*100)+'%'} as React.CSSProperties}/><output htmlFor="voice-tone">{settings.tone>0?'+':''}{settings.tone}</output></div><span className="tone-labels"><small>{t.low}</small><small>{t.high}</small></span></div>
    {available.length>0&&<label className="voice-device-label">{t.device}<select value={available.some(v=>v.voiceURI===settings.deviceVoice)?settings.deviceVoice:''} onChange={e=>update({deviceVoice:e.target.value})}><option value="">{t.defaultDevice}</option>{available.map(v=><option key={v.voiceURI} value={v.voiceURI}>{v.name}</option>)}</select></label>}
    {unavailable&&<p className="voice-availability">{unavailable}</p>}{audio.error&&<p className="voice-error" role="alert">{t.speechError}</p>}
    <button className="voice-generate" onClick={()=>setModal(true)}><Sparkles size={19}/>{t.generate}<small>{t.test}</small></button>
    <p className="voice-save-note" role={storageError?'alert':undefined}><Check size={12}/>{storageError||storageWarning?t.storage:t.local}</p>
   </aside>
  </div>
  <footer className="voice-summary"><div title={t.estimate}><Clock size={18}/><span>{t.duration}: <strong>{words?'≈ ':''}{duration}</strong></span></div><div><Globe size={18}/><span>{settings.language==='uk'?'Українська':'English'}</span></div><div><Mic size={18}/><span>{t.selected}: <strong>{profile[language]}</strong></span></div><a className="voice-next" href="#video">{t.next}<ArrowRight size={20}/></a></footer>
  {modal&&<Dialog title={t.modalTitle} closeLabel={t.close} onClose={()=>setModal(false)}><p className="voice-modal-copy"><Sparkles size={23}/>{t.modalText}</p><div className="voice-modal-settings"><Avatar profile={profile}/><span><strong>{profile[language]}</strong><small>{settings.language==='uk'?'Українська':'English'} · {settings.rate}× · {t.tone}: {settings.tone}</small></span></div>{!words&&<p><a href="#scripts" onClick={()=>setModal(false)}>{t.addScript}<ArrowRight size={13}/></a></p>}<div className="dialog-actions"><button className="studio-secondary" onClick={()=>setModal(false)}>{t.close}</button><button className="studio-primary" disabled={!canPreview} onClick={()=>{setModal(false);preview();}}><Play size={16}/>{t.listenSample}</button></div></Dialog>}
 </section>;
}
