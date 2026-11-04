import {useEffect,useId,useState} from 'react';
import {ChevronDown,Clapperboard,FileText,Film,Folder,House,Mic,Settings,Upload} from 'lucide-react';
import type {StudioCopy} from './copy';

const steps=[{id:'scripts',key:'scripts',icon:FileText},{id:'voice',key:'voice',icon:Mic},{id:'video',key:'video',icon:Film},{id:'export',key:'export',icon:Upload}] as const;

export default function StudioNavigation({view,t,label,onNavigate}:{view:string;t:StudioCopy;label:string;onNavigate:()=>void}){
 const [expanded,setExpanded]=useState(true),stepsId=useId();
 const inWorkflow=steps.some(step=>step.id===view);
 useEffect(()=>{if(inWorkflow)setExpanded(true);},[view,inWorkflow]);
 return <>
  <nav className="studio-navigation" aria-label={label}>
   {[{id:'studio',name:t.home,icon:House},{id:'projects',name:t.projects,icon:Folder}].map(({id,name,icon:Icon})=><a key={id} className="navigation-main-link" href={'#'+id} aria-current={view===id?'page':undefined} onClick={onNavigate}><Icon size={23}/><span>{name}</span></a>)}
   <div className={'creation-menu '+(inWorkflow?'has-current-step':'')}>
    <button className="creation-toggle" type="button" aria-expanded={expanded} aria-controls={stepsId} onClick={()=>setExpanded(!expanded)}>
     <Clapperboard className="creation-symbol" size={28}/><span><strong>{t.creation}</strong><small>{t.creationHint}</small></span><ChevronDown className="creation-chevron" size={18}/>
    </button>
    <ol className="creation-steps" id={stepsId} hidden={!expanded}>
     {steps.map(({id,key,icon:Icon},index)=><li key={id}><a href={'#'+id} aria-current={view===id?'page':undefined} onClick={onNavigate}><span className="step-number" aria-hidden="true">{index+1}</span><span className="step-icon"><Icon size={23}/></span><span>{t[key]}</span></a></li>)}
    </ol>
   </div>
  </nav>
  <div className="sidebar-divider"/>
  <a className="sidebar-settings" href="#settings" onClick={onNavigate}><Settings size={23}/>{t.settings}</a>
 </>;
}
