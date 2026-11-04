import {useEffect,useRef,useState} from 'react';
import {ArrowRight,Check,ChevronDown,ChevronRight,FilePlus2,FileText,Film,Flower2,Mic,Sparkles,Trash2,Upload} from 'lucide-react';
import type {Project} from './projects';
import Dialog from './Dialog';
import {scriptCopy,scriptTemplate} from './scriptCopy';
import './script.css';

export default function ScriptWorkspace({language,projects,selected,onSelect,onChange,onNew,storageWarning}:{language:'uk'|'en';projects:Project[];selected?:Project;onSelect:(id:string)=>void;onChange:(text:string)=>void;onNew:(text?:string,name?:string)=>void;storageWarning:boolean}){
 const t=scriptCopy[language],text=selected?.script||'';
 const [dialog,setDialog]=useState<'template'|'clear'|null>(null),[topic,setTopic]=useState(''),[error,setError]=useState(''),[reading,setReading]=useState(false);
 const editor=useRef<HTMLTextAreaElement>(null),fileInput=useRef<HTMLInputElement>(null),alive=useRef(true),revision=useRef(0);
 useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);
 useEffect(()=>{revision.current++;setError('');setDialog(null);},[selected?.id]);
 const words=(text.match(/[\p{L}\p{N}]+(?:['’ʼ-][\p{L}\p{N}]+)*/gu)||[]).length;
 const steps=[{id:'scripts',label:t.script,icon:FileText},{id:'voice',label:t.voice,icon:Mic},{id:'video',label:t.video,icon:Film},{id:'export',label:t.export,icon:Upload}];
 async function importText(file?:File){
  if(!file)return;
  setError('');
  if(!/\.txt$/i.test(file.name)){setError(t.fileError);return;}
  if(file.size>100_000){setError(t.fileLong);return;}
  const request=revision.current;setReading(true);
  try{
   const buffer=await file.arrayBuffer();
   let content:string;
   try{content=new TextDecoder('utf-8',{fatal:true}).decode(buffer).replace(/\r\n?/g,'\n');}catch{if(alive.current)setError(t.fileError);return;}
   if(!alive.current||request!==revision.current)return;
   if(content.length>20000){setError(t.fileLong);return;}
   if(content.includes('\0')){setError(t.fileError);return;}
   onNew(content,file.name.replace(/\.txt$/i,'').slice(0,80)||t.untitled);
   editor.current?.focus();
  }catch{if(alive.current)setError(t.fileRead);}finally{if(alive.current)setReading(false);}
 }
 return <section className="script-workspace" aria-label={t.title}>
  <nav className="script-stage-nav" aria-label={t.workflow}>{steps.map(({id,label,icon:Icon},i)=><div className="script-stage" key={id}><a href={'#'+id} aria-current={i===0?'step':undefined}><Icon size={22}/><span>{i+1}. {label}</span></a>{i<3&&<ChevronRight className="stage-arrow" size={20}/>}</div>)}</nav>
  <div className="script-intro"><div><span className="script-eyebrow"><Flower2 size={13}/>{t.step}</span><h2><FileText size={29}/>{t.title}</h2><p>{t.subtitle}</p></div><button className="script-generate" disabled={reading} onClick={()=>setDialog('template')}><Sparkles size={20}/><span>{t.generate}<small>{t.test}</small></span><ChevronDown size={17}/></button></div>
  <div className="script-editor-card">
   <div className="script-editor-top"><div className="script-project-picker"><FileText size={16}/>{projects.length?<select aria-label={t.project} value={selected?.id||''} disabled={reading} onChange={e=>onSelect(e.target.value)}>{projects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select>:<span>{t.untitled}</span>}</div><span className={'script-save-state '+(storageWarning?'memory-only':'')}><Check size={14}/>{storageWarning?t.memory:text?t.saved:t.ready}</span></div>
   <textarea ref={editor} aria-label={t.label} aria-describedby="script-editor-hint" value={text} maxLength={20000} placeholder={t.placeholder} spellCheck disabled={reading} onChange={e=>{setError('');onChange(e.target.value);}}/>
   <div className="script-editor-bottom"><span id="script-editor-hint">{text.length>=20000?t.limit:t.autoHint}</span><Flower2 size={19}/></div>
  </div>
  {error&&<p className="script-file-error" role="alert">{error}</p>}
  <div className="script-tools"><div className="script-file-actions"><input ref={fileInput} type="file" accept=".txt,text/plain" hidden onChange={e=>{void importText(e.target.files?.[0]);e.target.value='';}}/><button className="studio-secondary" disabled={reading} onClick={()=>fileInput.current?.click()}><Upload size={19}/>{reading?t.reading:t.upload}</button><button className="studio-secondary" disabled={reading} onClick={()=>{onNew();editor.current?.focus();}}><FilePlus2 size={19}/>{t.new}</button></div><div className="script-counts"><span>{t.words}: <strong>{words.toLocaleString(language)}</strong></span><span>{t.characters}: <strong>{text.length.toLocaleString(language)}</strong></span></div><button className="script-clear icon-button" disabled={!text||reading} aria-label={t.clear} title={t.clear} onClick={()=>setDialog('clear')}><Trash2 size={21}/></button></div>
  <div className="script-next"><span>{text.trim()?t.nextReady:t.nextHint}</span><button className="script-next-button" disabled={!text.trim()||reading} onClick={()=>{location.hash='voice';}}>{t.next}<ArrowRight size={23}/></button></div>
  {dialog==='clear'&&<Dialog title={t.clearTitle} closeLabel={t.close} onClose={()=>setDialog(null)}><p>{t.clearText}</p><div className="dialog-actions"><button className="studio-secondary" onClick={()=>setDialog(null)}>{t.cancel}</button><button className="studio-primary" onClick={()=>{onChange('');setDialog(null);}}>{t.clear}</button></div></Dialog>}
  {dialog==='template'&&<Dialog title={t.demoTitle} closeLabel={t.close} onClose={()=>setDialog(null)}><p className="script-template-notice"><Sparkles size={19}/>{t.demoText}</p><form className="project-form" onSubmit={e=>{e.preventDefault();if(!topic.trim())return;onNew(scriptTemplate(topic.trim(),language),topic.trim());setDialog(null);}}><label>{t.topic}<input required maxLength={80} placeholder={t.topicPlaceholder} value={topic} onChange={e=>setTopic(e.target.value)}/></label><p className="script-template-hint">{t.separate}</p><div className="dialog-actions"><button className="studio-secondary" type="button" onClick={()=>setDialog(null)}>{t.cancel}</button><button className="studio-primary" type="submit"><Sparkles size={17}/>{t.template}</button></div></form></Dialog>}
 </section>;
}
