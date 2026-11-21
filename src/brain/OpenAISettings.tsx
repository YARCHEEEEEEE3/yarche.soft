import {useEffect,useRef,useState} from 'react';
import {KeyRound,ShieldCheck} from 'lucide-react';
import {brainApi,brainError,type Language} from './api';
import '../fish/fish.css';

export default function OpenAISettings({language}:{language:Language}){
 const uk=language==='uk';
 const [key,setKey]=useState(''),[configured,setConfigured]=useState<boolean|null>(null);
 const [busy,setBusy]=useState(false),[error,setError]=useState<unknown>(null);
 const controller=useRef<AbortController|null>(null);

 async function update(action:'load'|'save'|'remove'){
  controller.current?.abort();
  const request=new AbortController();
  controller.current=request;
  setError(null);
  setBusy(true);
  if(action==='save')setKey('');
  try{
   const result=await (action==='load'?brainApi.status(request.signal):action==='save'?brainApi.saveKey(key,request.signal):brainApi.removeKey(request.signal));
   if(!request.signal.aborted)setConfigured(result.configured);
  }catch(err){if(!request.signal.aborted)setError(err);}
  finally{if(!request.signal.aborted)setBusy(false);}
 }
 useEffect(()=>{
  void update('load');
  return ()=>controller.current?.abort();
 },[]);

 return <section className="fish-settings" aria-labelledby="openai-settings-title">
  <div className="fish-section-title"><KeyRound size={21}/><h2 id="openai-settings-title">OpenAI</h2></div>
  <p className="fish-security"><ShieldCheck size={17}/>{uk?'Ключ зберігається зашифрованим на сервері для твого облікового запису.':'The key is encrypted on the server for your account.'}</p>
  <p role="status">{busy?(uk?'Зачекай…':'Please wait…'):configured===true?(uk?'Ключ збережено':'Key saved'):configured===false?(uk?'Ключ ще не додано':'No key added yet'):null}</p>
  {error!=null&&<p className="fish-error" role="alert">{brainError(error,language)}</p>}
  {configured===null&&!busy&&<div className="fish-actions"><button onClick={()=>void update('load')}>{uk?'Спробувати ще раз':'Try again'}</button><a href="#login">{uk?'До входу':'Go to sign-in'}</a></div>}
  <form onSubmit={event=>{event.preventDefault();if(!busy&&configured!==null&&key.trim())void update('save');}}>
   <label htmlFor="openai-api-key">{configured?(uk?'Замінити API-ключ OpenAI':'Replace OpenAI API key'):(uk?'API-ключ OpenAI':'OpenAI API key')}</label>
   <input id="openai-api-key" type="password" autoComplete="off" autoCapitalize="none" autoCorrect="off" spellCheck={false} maxLength={512} disabled={busy||configured===null} value={key} onChange={event=>setKey(event.target.value)}/>
   <div className="fish-actions">
    <button type="submit" disabled={busy||configured===null||!key.trim()}>{uk?'Зберегти ключ':'Save key'}</button>
    {configured&&<button type="button" disabled={busy} onClick={()=>{if(window.confirm(uk?'Видалити ключ OpenAI із сервера?':'Remove the OpenAI key from the server?'))void update('remove');}}>{uk?'Видалити ключ OpenAI':'Remove OpenAI key'}</button>}
   </div>
  </form>
  <a className="fish-settings-link" href="#scripts">{uk?'Перейти до сценарію →':'Go to script →'}</a>
 </section>;
}
