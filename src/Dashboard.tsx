import {useEffect,useRef,useState} from 'react';
import {ArrowRight,Bell,ChartNoAxesColumnIncreasing,Check,ChevronDown,ChevronRight,Clapperboard,Download,Ellipsis,FileText,Film,Flower2,Folder,House,Layers,Menu,Mic,Monitor,Plus,Search,Settings,Smartphone,Sparkles,Trash2,Upload} from 'lucide-react';
import {Blossom} from './StudioBrand';
import {readPreferences,preferencesStorageWarning} from './studio/preferences';
import {examples,projectId,readProjects,saveProjects,type Project} from './studio/projects';
import {studioCopy,type StudioCopy} from './studio/copy';
import Dialog from './studio/Dialog';
import './dashboard.css';

type View='studio'|'projects'|'scripts'|'voice'|'video'|'export';
const navigation=[{id:'studio',key:'home',icon:House},{id:'projects',key:'projects',icon:Folder},{id:'scripts',key:'scripts',icon:FileText},{id:'voice',key:'voice',icon:Mic},{id:'video',key:'video',icon:Film},{id:'export',key:'export',icon:Upload}] as const;
function Landscape(){return <svg className="studio-landscape" viewBox="0 0 260 100" aria-hidden="true"><path d="m0 95 80-52 22 15 29-38 82 70 47-15v25H0" fill="currentColor" opacity=".23"/><path d="m107 48 24-29 29 29-15-7-10 5-7-9-10 10Z" fill="white" opacity=".5"/><path d="M156 48q40 9 80-5l-6 11q-31 9-70 3Zm5 18h70v7h-70m11-18-5 44h7l6-43m35-2 6 45h7l-5-47" fill="currentColor" opacity=".55"/></svg>}
function StudioLogo(){return <div className="dashboard-logo"><Flower2 aria-hidden="true"/><span>SAKYRA</span></div>}
function Cover({cover}:{cover:number}){return <span className={'project-cover cover-'+cover} aria-hidden="true"/>}
function ProjectEditor({project,isExample,onSave,onClose,t}:{project:Project;isExample:boolean;onSave:(p:Project)=>void;onClose:()=>void;t:StudioCopy}){
 const [draft,setDraft]=useState(project),[error,setError]=useState(false);const name=useRef<HTMLInputElement>(null);
 return <Dialog title={project.id?t.open:t.newProject} closeLabel={t.close} onClose={onClose}>
  {isExample&&<p className="example-explainer">{t.demoNotice}</p>}
  <form className="project-form" onSubmit={e=>{e.preventDefault();if(!draft.name.trim()){setError(true);name.current?.focus();return;}onSave({...draft,name:draft.name.trim()});}}>
   <label>{t.name}<input ref={name} autoFocus maxLength={80} value={draft.name} aria-invalid={error} aria-describedby={error?'project-name-error':undefined} onChange={e=>{setDraft({...draft,name:e.target.value});setError(false);}}/></label>
   {error&&<p id="project-name-error" className="project-error" role="alert">{t.nameRequired}</p>}
   <label>{t.idea}<textarea rows={3} maxLength={2000} value={draft.idea} onChange={e=>setDraft({...draft,idea:e.target.value})}/></label>
   <fieldset className="project-formats"><legend>{t.format}</legend>{(['16:9','9:16'] as const).map(format=><label key={format}><input type="radio" name="project-format" checked={draft.format===format} onChange={()=>setDraft({...draft,format})}/>{format==='16:9'?<Monitor size={20}/>:<Smartphone size={20}/>}<span>{format}</span></label>)}</fieldset>
   <fieldset className="cover-picker"><legend>{t.cover}</legend>{examples.map(example=><label key={example.cover}><input type="radio" name="project-cover" aria-label={example.name} checked={draft.cover===example.cover} onChange={()=>setDraft({...draft,cover:example.cover})}/><Cover cover={example.cover}/><Check size={16}/></label>)}</fieldset>
   {project.id&&<label>{t.scriptLabel}<textarea rows={5} maxLength={20000} value={draft.script} onChange={e=>setDraft({...draft,script:e.target.value})}/></label>}
   <div className="dialog-actions"><button type="button" className="studio-secondary" onClick={onClose}>{t.cancel}</button><button className="studio-primary" type="submit"><Plus size={17}/>{isExample?t.duplicate:project.id?t.save:t.create}</button></div>
  </form>
 </Dialog>;
}
export default function Dashboard({view='studio'}:{view?:View}){
 const prefs=readPreferences(),t=studioCopy[prefs.language];
 const [projects,setProjects]=useState(readProjects),[query,setQuery]=useState(''),[selectedId,setSelectedId]=useState('');
 const [modal,setModal]=useState<{project:Project;example:boolean}|null>(null),[deleting,setDeleting]=useState<Project|null>(null),[cardMenu,setCardMenu]=useState<string|null>(null);
 const [drawer,setDrawer]=useState(false),[popover,setPopover]=useState<'profile'|'notifications'|null>(null),[toast,setToast]=useState(''),[storageWarning,setStorageWarning]=useState(preferencesStorageWarning),[paused,setPaused]=useState(document.hidden);
 const [lastExport,setLastExport]=useState(()=>{try{return localStorage.getItem('sakyra.last-project-export')||'';}catch{return '';}});
 const header=useRef<HTMLHeadingElement>(null),popoverRef=useRef<HTMLDivElement>(null);
 const selected=projects.find(p=>p.id===selectedId)||projects[0];
 useEffect(()=>{setPopover(null);setCardMenu(null);setDrawer(false);header.current?.focus();},[view]);
 useEffect(()=>{const pause=()=>setPaused(document.hidden);document.addEventListener('visibilitychange',pause);return()=>document.removeEventListener('visibilitychange',pause);},[]);
 useEffect(()=>{if(!toast)return;const timer=setTimeout(()=>setToast(''),4000);return()=>clearTimeout(timer);},[toast]);
 useEffect(()=>{if(!cardMenu)return;const outside=(e:PointerEvent)=>{if(!(e.target as Element).closest('.card-actions,.project-card-footer button'))setCardMenu(null);};const escape=(e:KeyboardEvent)=>{if(e.key==='Escape')setCardMenu(null);};document.addEventListener('pointerdown',outside);document.addEventListener('keydown',escape);return()=>{document.removeEventListener('pointerdown',outside);document.removeEventListener('keydown',escape);};},[cardMenu]);
 useEffect(()=>{if(!popover)return;const outside=(e:PointerEvent)=>{if(!popoverRef.current?.contains(e.target as Node))setPopover(null);};const escape=(e:KeyboardEvent)=>{if(e.key==='Escape')setPopover(null);};document.addEventListener('pointerdown',outside);document.addEventListener('keydown',escape);return()=>{document.removeEventListener('pointerdown',outside);document.removeEventListener('keydown',escape);};},[popover]);
 function commit(next:Project[],message=''){setProjects(next);if(!saveProjects(next))setStorageWarning(true);if(message)setToast(message);}
 function blank(cover:0|1|2=0):Project{return {id:'',name:'',idea:'',script:'',format:prefs.format,cover,createdAt:'',updatedAt:''};}
 function create(){setModal({project:blank(),example:false});}
 function sample(index:number){const example=examples[index];setModal({project:{...blank(example.cover),name:example.name,idea:t.sampleIdea},example:true});}
 function save(project:Project){const now=new Date().toISOString(),isNew=!project.id,next={...project,id:project.id||projectId(),createdAt:project.createdAt||now,updatedAt:now};commit(isNew?[next,...projects]:projects.map(p=>p.id===next.id?next:p),isNew?t.created:t.saved);setSelectedId(next.id);setModal(null);}
 function duplicate(project:Project){setCardMenu(null);setModal({project:{...project,id:'',name:(project.name+t.copySuffix).slice(0,80),createdAt:'',updatedAt:''},example:false});}
 function download(){if(!selected)return;const data=JSON.stringify({version:1,studio:prefs.name,project:selected},null,2),url=URL.createObjectURL(new Blob([data],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=(selected.name.replace(/[^\p{L}\p{N}_-]/gu,'_')||'sakyra')+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1500);const now=new Date().toISOString();setLastExport(now);try{localStorage.setItem('sakyra.last-project-export',now);}catch{setStorageWarning(true);}setToast(t.exported);}
 const nav=<><nav aria-label={prefs.language==='uk'?'Розділи студії':'Studio sections'}>{navigation.map(({id,key,icon:Icon})=><a key={id} href={'#'+id} aria-current={view===id?'page':undefined} onClick={()=>setDrawer(false)}><Icon size={21}/><span>{t[key]}</span></a>)}</nav><div className="sidebar-divider"/><a className="sidebar-settings" href="#settings"><Settings size={21}/>{t.settings}</a></>;
 const selectProject=projects.length?<label className="project-select-label">{t.project}<select aria-label={t.choose} value={selected?.id||''} onChange={e=>setSelectedId(e.target.value)}>{projects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label>:null;
 const showExamples=projects.length===0;
 const filtered=projects.filter(p=>(p.name+' '+p.idea).toLocaleLowerCase().includes(query.toLocaleLowerCase()));
 const visible=view==='studio'?projects.slice(0,3):filtered;
 function cards(){return <div className="project-grid">{(showExamples?examples:visible).map((item,index)=>{
  const example=showExamples?examples[index]:null,project=showExamples?null:item as Project,id=project?.id||'example-'+index,progress=example?.progress||(project?.script.trim()?33:0);
  return <article className="project-card" key={id}>
   <button className="project-card-open" onClick={()=>project?setModal({project,example:false}):sample(index)} aria-label={t.open+' '+item.name}><Cover cover={item.cover}/><span className="project-card-title">{item.name}</span></button>
   <span className={'project-state '+(example?'example-state':'')}>{example?t.example:project?.script.trim()?t.scriptReady:t.draft}</span>
   <div className="project-progress"><progress max={100} value={progress} aria-label={item.name+' '+(example?t.example:t.process)}/><span>{progress}%</span></div>
   <div className="project-card-footer"><span><Film size={14}/>{example?example.duration:project?.format}</span><button className="icon-button" aria-label={t.actions+' '+item.name} aria-expanded={cardMenu===id} onClick={()=>setCardMenu(cardMenu===id?null:id)}><Ellipsis size={20}/></button></div>
   {cardMenu===id&&<div className="card-actions"><button onClick={()=>{setCardMenu(null);project?setModal({project,example:false}):sample(index);}}>{t.open}</button>{project?<><button onClick={()=>duplicate(project)}>{t.duplicate}</button><button className="danger-action" onClick={()=>{setDeleting(project);setCardMenu(null);}}>{t.delete}</button></>:<button onClick={()=>{sample(index);setCardMenu(null);}}>{t.duplicate}</button>}</div>}
  </article>;
 })}</div>}
 const overview=<aside className="studio-overview glass-card"><h2><ChartNoAxesColumnIncreasing/>{t.overview}</h2><dl><div><Folder/><dt>{t.total}</dt><dd>{projects.length}</dd></div><div><span className="generation-ring"/><dt>{t.active}</dt><dd>0</dd></div><div className="stat-stack"><Download/><dt>{t.lastExport}</dt><dd>{lastExport&&!Number.isNaN(Date.parse(lastExport))?new Intl.DateTimeFormat(prefs.language==='uk'?'uk-UA':'en-GB',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}).format(new Date(lastExport))+' · JSON':t.never}</dd></div><div className="stat-stack"><Monitor/><dt>{t.defaultFormat}</dt><dd>1080p ({prefs.format})</dd></div></dl><Landscape/></aside>;
 const empty=<div className="studio-empty"><span className="empty-symbol"><Clapperboard size={37}/></span><h2>{t.empty}</h2><p>{t.emptyText}</p><button className="studio-primary" onClick={create}><Plus size={18}/>{t.create}</button></div>;
 return <main className={'dashboard-world '+(paused?'is-paused':'')} lang={prefs.language}>
  <div className="dashboard-background" aria-hidden="true"/><div className="room-petals" aria-hidden="true">{Array.from({length:9},(_,i)=><i key={i} style={{left:(7+i*11)+'%',animationDelay:(-i*2.8)+'s',animationDuration:(16+i%4*3)+'s'}}/>)}</div><div className="tea-steam" aria-hidden="true"><i/><i/><i/></div>
  <div className="dashboard-shell">
   <aside className="studio-sidebar"><a href="#studio" className="brand-home" aria-label="SAKYRA"><StudioLogo/></a><Landscape/>{nav}<Blossom className="sidebar-blossom"/><span className="sidebar-edition">CREATIVE STUDIO</span></aside>
   <section className="dashboard-main" aria-label={t.home}>
    <header className="studio-header"><div className="mobile-studio-brand"><button className="icon-button" aria-label={t.menu} onClick={()=>setDrawer(true)}><Menu size={23}/></button><StudioLogo/></div><div className="studio-heading"><h1 ref={header} tabIndex={-1}>{view==='studio'?t.title:view==='projects'?t.projects:view==='scripts'?t.write:view==='voice'?t.voiceTitle:view==='video'?t.videoTitle:t.exportTitle}</h1><p>{view==='studio'?t.subtitle:view==='projects'?t.localNote:view==='scripts'?t.scriptSubtitle:''}</p></div>
     <div className="studio-toolbar" ref={popoverRef}><button className="icon-button notification-button" aria-label={t.notifications} aria-expanded={popover==='notifications'} onClick={()=>setPopover(popover==='notifications'?null:'notifications')}><Bell size={20}/></button><button className="studio-user" aria-label={t.profile} aria-expanded={popover==='profile'} onClick={()=>setPopover(popover==='profile'?null:'profile')}><span className="user-avatar"><Flower2 size={24}/></span><span>{prefs.name}</span><ChevronDown size={16}/></button>
      {popover&&<div className="studio-popover">{popover==='notifications'?<><h3>{t.noNotifications}</h3><p>{t.localNote}</p></>:<><strong>{prefs.name}</strong><a href="#settings"><Settings size={17}/>{t.settings}</a><a href="#login"><House size={17}/>{t.back}</a></>}</div>}
     </div>
    </header>
    {storageWarning&&<p className="storage-warning" role="alert">{t.storage}</p>}
    {view==='studio'?<div className="dashboard-grid"><div className="dashboard-center"><div className="studio-actions-row"><button className="new-project-tile" onClick={create}><span className="new-project-icon"><Plus size={27}/></span><span><strong>{t.newProject}</strong><small>{t.fromScratch}</small></span><ChevronRight size={20}/><Blossom className="tile-blossom"/><Landscape/></button><section className="process-card glass-card"><h2><Layers/>{t.process}</h2><Blossom className="process-blossom"/><div className="process-steps">{[{name:t.scripts,icon:FileText,path:'scripts'},{name:t.voice,icon:Mic,path:'voice'},{name:t.video,icon:Film,path:'video'}].map(({name,icon:Icon,path},i)=><div className="process-step-wrap" key={path}><a href={'#'+path}><Icon size={22}/><span>{i+1}. {name}</span></a>{i<2&&<ArrowRight size={20}/>}</div>)}</div></section></div><section className="recent-projects glass-card"><div className="section-title"><h2><Clapperboard/>{t.recent}</h2><a href="#projects">{t.all}<ChevronRight size={16}/></a></div>{cards()}</section></div>{overview}</div>:
    view==='projects'?<section className="projects-page glass-card"><div className="projects-toolbar"><label className="project-search"><Search size={19}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder={t.search} aria-label={t.search}/></label><button className="studio-primary" onClick={create}><Plus size={18}/>{t.newProject}</button></div>{showExamples?<><p className="examples-caption">{t.examples} · {t.localNote}</p>{cards()}</>:visible.length?cards():<p className="no-results">{t.noResults}</p>}</section>:
    view==='scripts'?<section className="workbench glass-card">{projects.length?<>{selectProject}<label className="script-label">{t.scriptLabel}<textarea key={selected.id} value={selected.script} maxLength={20000} placeholder={t.scriptPlaceholder} onChange={e=>commit(projects.map(p=>p.id===selected.id?{...p,script:e.target.value,updatedAt:new Date().toISOString()}:p))}/></label><p className="workbench-note">{prefs.language==='uk'?'Сценарій зберігається автоматично.':'Your script is saved automatically.'}</p></>:empty}</section>:
    view==='export'?<section className="workbench export-workbench glass-card"><span className="empty-symbol"><Download size={36}/></span><p>{t.exportText}</p>{projects.length?<>{selectProject}<button className="studio-primary" onClick={download}><Download size={18}/>{t.download}</button></>:<button className="studio-primary" onClick={create}><Plus size={18}/>{t.create}</button>}</section>:
    <section className="workbench coming-workbench glass-card"><span className="coming-badge"><Sparkles size={15}/>{t.soon}</span><span className="empty-symbol">{view==='voice'?<Mic size={40}/>:<Film size={40}/>}</span><p>{view==='voice'?t.voiceText:t.videoText}</p><a href="#scripts" className="studio-primary">{t.goScript}<ArrowRight size={18}/></a></section>}
    <footer className="studio-footer"><Flower2 size={13}/>{t.preview}</footer>
   </section>
  </div>
  <div className={'studio-toast '+(toast?'visible':'')} role="status" aria-live="polite">{toast&&<Check size={17}/>}<span>{toast}</span></div>
  {drawer&&<Dialog title="SAKYRA" closeLabel={t.close} onClose={()=>setDrawer(false)} className="studio-mobile-nav">{nav}</Dialog>}
  {modal&&<ProjectEditor project={modal.project} isExample={modal.example} onSave={save} onClose={()=>setModal(null)} t={t}/>}
  {deleting&&<Dialog title={t.deleteTitle} closeLabel={t.close} onClose={()=>setDeleting(null)}><p className="delete-project-name">{deleting.name}</p><p>{t.deleteText}</p><div className="dialog-actions"><button className="studio-secondary" onClick={()=>setDeleting(null)}>{t.cancel}</button><button className="studio-primary delete-button" onClick={()=>{commit(projects.filter(p=>p.id!==deleting.id),t.deleted);setDeleting(null);}}><Trash2 size={17}/>{t.delete}</button></div></Dialog>}
 </main>;
}
