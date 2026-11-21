import {useEffect,useRef,useState} from 'react';
import {Check,Sparkles} from 'lucide-react';
import {brainApi,brainError,shotDurations,type Language,type Plan,type PlanEntry,type ProjectPlan} from './api';
import type {Project} from '../studio/projects';
import './plan.css';

export default function PlanWorkspace({project,language,onChange}:{project:Project;language:Language;onChange:(value:ProjectPlan)=>void}){
 const uk=language==='uk';
 const [busy,setBusy]=useState(false),[error,setError]=useState<unknown>(null);
 const controller=useRef<AbortController|null>(null);
 useEffect(()=>()=>controller.current?.abort(),[]);

 const saved=project.brain;
 const [shotDurationSeconds,setShotDurationSeconds]=useState(saved?.shotDurationSeconds??5);
 const hasOutdatedDurations=saved?.plan.shots.some(shot=>!shotDurations.includes(shot.durationSeconds))??false;
 const stale=!!saved&&saved.source!==project.script;
 const seconds=saved?.plan.shots.reduce((total,shot)=>total+(shot.durationSeconds||0),0)??0;

 async function analyze(){
  if(controller.current||!project.script.trim())return;
  if(saved&&!window.confirm(uk?'Замінити поточний план новим після аналізу?':'Replace the current plan when analysis completes?'))return;
  const request=new AbortController();
  controller.current=request;
  setBusy(true);
  setError(null);
  try{
   const plan=await brainApi.analyze(project.script,language,shotDurationSeconds,request.signal);
   if(!request.signal.aborted)onChange({plan,source:project.script,confirmed:false,shotDurationSeconds});
  }catch(err){if(!request.signal.aborted)setError(err);}
  finally{
   if(!request.signal.aborted){controller.current=null;setBusy(false);}
  }
 }
 function edit(plan:Plan){if(saved)onChange({...saved,plan,confirmed:false});}
 function entries(kind:'characters'|'locations',title:string){
  if(!saved)return null;
  const items=saved.plan[kind];
  function update(next:PlanEntry[]){if(saved)edit({...saved.plan,[kind]:next});}
  return <section aria-label={title}>
   <h4>{title}</h4>
   {items.map((item,index)=><div className="brain-row" key={index}>
    <label>{uk?'Назва':'Name'}<input required maxLength={120} value={item.name} onChange={event=>update(items.map((entry,i)=>i===index?{...entry,name:event.target.value}:entry))}/></label>
    <label>{uk?'Опис':'Description'}<textarea required maxLength={1200} rows={2} value={item.description} onChange={event=>update(items.map((entry,i)=>i===index?{...entry,description:event.target.value}:entry))}/></label>
    <button className="studio-secondary" type="button" onClick={()=>update(items.filter((_,i)=>i!==index))}>{uk?'Видалити':'Remove'}</button>
   </div>)}
   <button className="studio-secondary" type="button" disabled={items.length>=40} onClick={()=>update([...items,{name:'',description:''}])}>{kind==='characters'?(uk?'Додати персонажа':'Add character'):(uk?'Додати локацію':'Add location')}</button>
  </section>;
 }

 return <section className="brain-panel script-editor-card" aria-labelledby="brain-title">
  <div className="brain-header">
   <div><h3 id="brain-title"><Sparkles size={20}/> {uk?'План сценарію':'Script plan'}</h3><p>{uk?'Для аналізу текст сценарію надсилається в OpenAI.':'Analysis sends the script text to OpenAI.'}</p></div>
   <label className="brain-duration">{uk?'Секунд на кадр':'Seconds per shot'}
    <select value={shotDurationSeconds} disabled={busy} onChange={event=>setShotDurationSeconds(Number(event.target.value))}>
     {shotDurations.map(duration=><option key={duration} value={duration}>{duration}</option>)}
    </select>
   </label>
   <button className="studio-primary" type="button" disabled={busy||!project.script.trim()} onClick={()=>void analyze()}>{busy?(uk?'Аналізуємо…':'Analyzing…'):(uk?'Розібрати сценарій':'Analyze script')}</button>
  </div>
  {error!=null&&<p className="script-file-error" role="alert">{brainError(error,language)}</p>}
  {(!saved||error!=null)&&<a href="#settings">{uk?'Налаштування OpenAI':'OpenAI settings'}</a>}
  {saved&&<form className="project-form" onSubmit={event=>{
   event.preventDefault();
   const {characters,locations,shots}=saved.plan;
   const valid=shots.length&&shots.every(shot=>shot.description.trim()&&shotDurations.includes(shot.durationSeconds))&&[...characters,...locations].every(entry=>entry.name.trim()&&entry.description.trim());
   if(valid&&!busy&&!stale)onChange({...saved,confirmed:true});
  }}>
   <p role="status">{stale?(uk?'Сценарій змінився. Повтори аналіз, щоб підтвердити новий план.':'The script changed. Analyze it again to confirm a new plan.'):hasOutdatedDurations?(uk?'У плані є кадри поза межами 4–6 секунд. Розбери сценарій повторно або відредагуй їх.':'Some shots are outside 4–6 seconds. Analyze the script again or edit them.'):saved.confirmed?(uk?'План підтверджено':'Plan confirmed'):(uk?'Чернетка плану':'Draft plan')}</p>
   <fieldset className="brain-fields" disabled={stale||busy}>
    {entries('characters',uk?'Персонажі':'Characters')}
    {entries('locations',uk?'Локації':'Locations')}
    <section aria-label={uk?'Кадри':'Shots'}>
     <h4>{uk?'Кадри':'Shots'} · {seconds.toLocaleString(language)} {uk?'с':'s'}</h4>
     {saved.plan.shots.map((shot,index)=><div className="brain-row" key={index}>
      <h5>{uk?'Кадр':'Shot'} {index+1}</h5>
      <label>{uk?'Опис кадру':'Shot description'}<textarea required maxLength={1200} rows={2} value={shot.description} onChange={event=>edit({...saved.plan,shots:saved.plan.shots.map((item,i)=>i===index?{...item,description:event.target.value}:item)})}/></label>
      <label className="brain-duration">{uk?'Тривалість (с)':'Duration (s)'}
       <select required value={shotDurations.includes(shot.durationSeconds)?shot.durationSeconds:''} onChange={event=>{
        const durationSeconds=Number(event.target.value);
        edit({...saved.plan,shots:saved.plan.shots.map((item,i)=>i===index?{...item,durationSeconds}:item)});
       }}>
        {!shotDurations.includes(shot.durationSeconds)&&<option value="" disabled>{shot.durationSeconds} {uk?'с (старий план)':'s (old plan)'}</option>}
        {shotDurations.map(duration=><option key={duration} value={duration}>{duration}</option>)}
       </select>
      </label>
      <button className="studio-secondary" type="button" disabled={saved.plan.shots.length<=1} onClick={()=>edit({...saved.plan,shots:saved.plan.shots.filter((_,i)=>i!==index)})}>{uk?'Видалити кадр':'Remove shot'}</button>
     </div>)}
     <button className="studio-secondary" type="button" disabled={saved.plan.shots.length>=80} onClick={()=>edit({...saved.plan,shots:[...saved.plan.shots,{description:'',durationSeconds:saved.shotDurationSeconds??shotDurationSeconds}]})}>{uk?'Додати кадр':'Add shot'}</button>
    </section>
    <button className="studio-primary" type="submit" disabled={saved.confirmed||hasOutdatedDurations}><Check size={17}/>{uk?'Підтвердити план':'Confirm plan'}</button>
   </fieldset>
  </form>}
 </section>;
}
