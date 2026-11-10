import {useEffect,useRef,useState} from 'react';
import {Check,KeyRound,LoaderCircle,ShieldCheck,Trash2} from 'lucide-react';
import {fishApi,fishErrorMessage} from './api';
import './fish.css';

export default function FishSettings({language}:{language:'uk'|'en'}){
 const uk=language==='uk', [key,setKey]=useState(''),[configured,setConfigured]=useState(false),[ready,setReady]=useState(false),[busy,setBusy]=useState(false),[loading,setLoading]=useState(true),[error,setError]=useState<unknown>(null),[saved,setSaved]=useState(false),[confirmRemove,setConfirmRemove]=useState(false);
 const controller=useRef<AbortController|null>(null);
 async function load(){
  controller.current?.abort();const request=new AbortController();controller.current=request;
  setLoading(true);setReady(false);setError(null);
  try{const status=await fishApi.status(request.signal);if(!request.signal.aborted){setConfigured(status.configured);setReady(true);}}
  catch(err){if(!request.signal.aborted)setError(err);}finally{if(!request.signal.aborted)setLoading(false);}
 }
 useEffect(()=>{void load();return()=>controller.current?.abort();},[]);
 async function change(remove=false){
  if(busy)return;
  const request=new AbortController();controller.current=request;setBusy(true);setError(null);setSaved(false);
  const submitted=key;setKey('');
  try{const result=remove?await fishApi.removeKey(request.signal):await fishApi.saveKey(submitted,request.signal);if(!request.signal.aborted){setConfigured(result.configured);setSaved(true);setConfirmRemove(false);}}
  catch(err){if(!request.signal.aborted)setError(err);}finally{if(!request.signal.aborted)setBusy(false);}
 }
 return <section className="fish-settings" aria-labelledby="fish-settings-title">
  <div className="fish-section-title"><KeyRound size={21}/><h2 id="fish-settings-title">Fish Audio</h2><span>s2.1-pro-free</span></div>
  <p className="fish-security"><ShieldCheck size={17}/>{uk?'Ключ зберігається зашифрованим на сервері твого облікового запису. Він не записується в браузер або проєкти.':'Your account’s key is encrypted on the server. It is never saved in browser storage or projects.'}</p>
  {loading?<p role="status"><LoaderCircle className="fish-spinner" size={16}/> {uk?'Перевіряємо підключення…':'Checking connection…'}</p>:<p className="fish-key-status">{configured?<><Check size={16}/>{uk?'Ключ підключено':'Key connected'}</>:uk?'Ключ ще не додано':'No key added yet'}</p>}
  {error!=null&&<p className="fish-error" role="alert">{fishErrorMessage(error,language)}</p>}
  {!ready&&!loading&&<div className="fish-actions"><button type="button" onClick={()=>void load()}>{uk?'Перевірити ще раз':'Check again'}</button><a href="#login">{uk?'До входу':'Go to sign-in'}</a></div>}
  <form onSubmit={e=>{e.preventDefault();void change();}}>
   <label htmlFor="fish-api-key">{configured?(uk?'Замінити API-ключ':'Replace API key'):'API-ключ Fish Audio'}</label>
   <input id="fish-api-key" type="password" name="fish-api-key" value={key} autoComplete="off" autoCapitalize="none" autoCorrect="off" spellCheck={false} maxLength={512} disabled={!ready||busy} placeholder={configured?'••••••••••••':'Fish Audio API key'} onChange={e=>{setKey(e.target.value);setSaved(false);}}/>
   <div className="fish-actions"><button type="submit" disabled={!ready||busy||!key.trim()}>{busy?<LoaderCircle className="fish-spinner" size={16}/>:<ShieldCheck size={16}/>} {busy?(uk?'Перевіряємо…':'Checking…'):(uk?'Перевірити й зберегти':'Verify and save')}</button>{configured&&<button type="button" disabled={busy} onClick={()=>setConfirmRemove(true)}><Trash2 size={16}/>{uk?'Видалити ключ':'Remove key'}</button>}</div>
  </form>
  {confirmRemove&&<div className="fish-remove-confirm"><p>{uk?'Видалити ключ із сервера? Для наступної генерації його потрібно буде додати знову.':'Remove the key from the server? You will need to add it again before generating.'}</p><div className="fish-actions"><button disabled={busy} onClick={()=>void change(true)}>{uk?'Так, видалити':'Yes, remove'}</button><button disabled={busy} onClick={()=>setConfirmRemove(false)}>{uk?'Скасувати':'Cancel'}</button></div></div>}
  {saved&&<p role="status">{configured?(uk?'Ключ перевірено та збережено.':'Key verified and saved.'):(uk?'Ключ видалено.':'Key removed.')}</p>}
  <a className="fish-settings-link" href="#voice">{uk?'Перейти до озвучки →':'Go to voice-over →'}</a>
 </section>;
}
