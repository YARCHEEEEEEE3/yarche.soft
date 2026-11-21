import {useEffect,useRef,useState} from 'react';
import {ArrowLeft,Film,LoaderCircle,Palette,Sparkles} from 'lucide-react';
import {brainApi,brainError,shotDurations,type Language,type ScenePreparation} from '../../brain/api';
import Dialog from '../Dialog';
import type {Project} from '../projects';
import {videoCopy} from './copy';
import {styles,timecode} from './model';
import VideoVisual from './Visual';
import './video.css';

type Props={
 language:Language;
 project:Project;
 projects:Project[];
 onSelect:(id:string)=>void;
 onChange:(value:ScenePreparation)=>void;
};

export default function SceneWorkspace({language,project,projects,onSelect,onChange}:Props){
 const uk=language==='uk',t=videoCopy[language];
 const saved=project.scenePreparation;
 const scenes=saved?.source===project.script&&saved.format===project.format?saved.plan.shots:[];
 const [styleId,setStyleId]=useState(saved?.style??'');
 const [shotDurationSeconds,setShotDurationSeconds]=useState(saved?.shotDurationSeconds??5);
 const [showStyles,setShowStyles]=useState(false);
 const [busy,setBusy]=useState(false),[error,setError]=useState<unknown>(null);
 const controller=useRef<AbortController|null>(null);
 useEffect(()=>()=>controller.current?.abort(),[]);
 const style=styles.find(item=>item.id===styleId);
 const prepared=scenes.length>0&&saved?.style===styleId&&saved.shotDurationSeconds===shotDurationSeconds;

 async function prepare(){
  if(!style||controller.current||prepared)return;
  const request=new AbortController();
  controller.current=request;
  setBusy(true);
  setError(null);
  const settings={style:style.id,format:project.format,shotDurationSeconds};
  try{
   const plan=await brainApi.analyze(project.script,language,settings,request.signal);
   if(!request.signal.aborted)onChange({...settings,plan,source:project.script});
  }catch(err){if(!request.signal.aborted)setError(err);}
  finally{if(!request.signal.aborted){controller.current=null;setBusy(false);}}
 }

 function cancel(){
  controller.current?.abort();
  controller.current=null;
  setBusy(false);
 }

 return <section className="video-workspace" aria-label={t.title}>
  <div className="video-topline">
   <a href="#voice"><ArrowLeft size={14}/>{t.back}</a>
   <span>{t.step}</span>
   <select aria-label={t.project} disabled={busy} value={project.id} onChange={event=>onSelect(event.target.value)}>
    {projects.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}
   </select>
  </div>
  <div className="video-introduction"><h2>{uk?'Сцени':'Scenes'}</h2></div>
  <div className="video-config video-production-config">
   <button className="video-style-picker" disabled={busy} onClick={()=>setShowStyles(true)}>
    {style&&<VideoVisual kind="styles" index={style.image}/>}
    <span><small>{t.style}</small><strong>{style?.[language]??t.styles}</strong></span><Palette size={20}/>
   </button>
   <label><Film size={15}/>{uk?'Секунд на кадр':'Seconds per shot'}
    <select disabled={busy} value={shotDurationSeconds} onChange={event=>setShotDurationSeconds(Number(event.target.value))}>
     {shotDurations.map(seconds=><option key={seconds} value={seconds}>{seconds} {t.seconds}</option>)}
    </select>
   </label>
  </div>
  <div className="video-start-panel video-production-actions">
   <button className="video-action" disabled={busy||!style||prepared} onClick={()=>void prepare()}>
    {busy?<LoaderCircle className="video-spinner" size={18}/>:<Sparkles size={18}/>}
    {uk?'Підготувати сцени':'Prepare scenes'}
   </button>
   {busy&&<><span role="status">{uk?'Готуємо сцени…':'Preparing scenes…'}</span><button className="studio-secondary" onClick={cancel}>{t.cancel}</button></>}
   {prepared&&<span role="status">{uk?'Сцени готові':'Scenes ready'}</span>}
  </div>
  {error!=null&&<div className="script-file-error" role="alert"><p>{brainError(error,language)}</p><a href="#settings">{uk?'Налаштування OpenAI':'OpenAI settings'}</a></div>}
  {!!scenes.length&&<section aria-label={t.sceneGallery}>
   <h3>{t.sceneGallery} · {scenes.length}</h3>
   {!prepared&&<p>{uk?'Показано сцени з попередніми налаштуваннями.':'Showing scenes from the previous settings.'}</p>}
   <ol className="video-production-scenes">
    {scenes.map((scene,index)=><li key={index}><strong>{scene.title||`${t.scene} ${index+1}`}</strong><span>{timecode(scene.durationSeconds)}</span></li>)}
   </ol>
  </section>}
  {showStyles&&<Dialog title={t.stylesTitle} closeLabel={t.close} onClose={()=>setShowStyles(false)} className="video-style-dialog">
   <div className="video-style-gallery">{styles.map(item=><button key={item.id} aria-pressed={styleId===item.id} onClick={()=>{setStyleId(item.id);setShowStyles(false);}}>
    <VideoVisual kind="styles" index={item.image}/><span><strong>{item[language]}</strong><small>{uk?item.hintUk:item.hintEn}</small></span>
   </button>)}</div>
  </Dialog>}
 </section>;
}
