import {useEffect,useId,useRef} from 'react';
import {X} from 'lucide-react';
export default function Dialog({title,closeLabel,onClose,children,className=''}:{title:React.ReactNode;closeLabel:string;onClose:()=>void;children:React.ReactNode;className?:string}){
 const ref=useRef<HTMLDialogElement>(null),id=useId(),close=useRef(onClose),opener=useRef(document.activeElement as HTMLElement|null);close.current=onClose;
 useEffect(()=>{const el=ref.current!;el.showModal();return()=>{if(el.open)el.close();if(opener.current?.isConnected)opener.current.focus();};},[]);
 return <dialog ref={ref} className={'studio-dialog '+className} aria-labelledby={id} onCancel={e=>{e.preventDefault();close.current();}} onClick={e=>{if(e.target===e.currentTarget){const r=e.currentTarget.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)close.current();}}}>
  <div className="dialog-heading"><h2 id={id}>{title}</h2><button type="button" className="icon-button" aria-label={closeLabel} onClick={onClose}><X size={21}/></button></div>{children}
 </dialog>;
}
