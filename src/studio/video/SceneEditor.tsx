import {useState} from 'react';
import {Check,Image,Play,Save} from 'lucide-react';
import Dialog from '../Dialog';
import {locations,type Scene,type VideoState} from './model';
import {videoCopy} from './copy';
import VideoVisual from './Visual';
export default function SceneEditor({scene,state,language,onClose,onSave,onAnimate}:{scene:Scene;state:VideoState;language:'uk'|'en';onClose:()=>void;onSave:(scene:Scene)=>void;onAnimate:()=>void}){
 const t=videoCopy[language],[draft,setDraft]=useState(scene);
 const dirty=['title','prompt','character','location','shot'].some(key=>draft[key as keyof Scene]!==scene[key as keyof Scene]);
 const character=state.characters.find(c=>c.id===draft.character)||state.characters[0];
 return <Dialog title={`${t.scene} ${String(scene.id).padStart(3,'0')} · ${t.preview}`} closeLabel={t.close} onClose={onClose} className="video-scene-dialog">
  <div className="video-scene-detail"><div><div className="video-detail-image"><VideoVisual index={scene.image}/><span className="video-image-caption"><Image size={14}/>{scene.photo?t.photoReady:t.planned} · {t.demo}</span></div><p className="video-detail-note">{t.referenceNote}</p><div className="video-references"><span>{t.refs}</span><div><VideoVisual kind="characters" index={character.image}/>{character.name}</div><div><VideoVisual index={locations[draft.location].image}/>{locations[draft.location][language]}</div></div>{scene.animated&&<p className="video-motion-note"><Check size={15}/>{t.motionDone}</p>}</div>
  <form className="project-form" onSubmit={e=>{e.preventDefault();if(draft.title.trim()&&draft.prompt.trim())onSave({...draft,title:draft.title.trim(),prompt:draft.prompt.trim()});}}>
   <label>{t.sceneTitle}<input aria-label={t.sceneTitle} required maxLength={100} value={draft.title} onChange={e=>setDraft({...draft,title:e.target.value})}/></label>
   <div className="video-binding-fields"><label>{t.character}<select aria-label={t.character} value={draft.character} onChange={e=>setDraft({...draft,character:e.target.value})}>{state.characters.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label><label>{t.location}<select aria-label={t.location} value={draft.location} onChange={e=>setDraft({...draft,location:Number(e.target.value)})}>{locations.map((l,i)=><option key={i} value={i}>{l[language]}</option>)}</select></label></div>
   <fieldset className="video-shot-picker"><legend>{t.shot}</legend>{(['wide','portrait','cinematic','dynamic'] as const).map(shot=><label key={shot}><input type="radio" name="shot" checked={draft.shot===shot} onChange={()=>setDraft({...draft,shot})}/><span>{t[shot]}</span></label>)}</fieldset>
   <label>{t.prompt}<textarea aria-label={t.prompt} required rows={5} maxLength={3000} value={draft.prompt} onChange={e=>setDraft({...draft,prompt:e.target.value})}/></label>
   {dirty&&<p className="video-edit-hint">{t.editHint}</p>}
   <div className="dialog-actions"><button type="button" className="studio-secondary" onClick={onClose}>{t.cancel}</button><button className="studio-primary" type="submit"><Save size={16}/>{t.saveScene}</button></div>
   {state.phase==='ready'&&scene.photo&&<button type="button" className="video-animate-button" disabled={dirty} onClick={onAnimate}><Play size={16}/>{scene.animated?t.replay:t.animate}<small>{t.demo}</small></button>}
  </form></div>
 </Dialog>;
}
