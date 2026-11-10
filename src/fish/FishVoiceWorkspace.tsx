import {useEffect,useRef,useState} from 'react';
import {ArrowLeft,ArrowRight,Check,Download,FileText,Gauge,LoaderCircle,Mic,RefreshCw,Search,Settings2,Sparkles,X} from 'lucide-react';
import {Blossom} from '../StudioBrand';
import type {VoiceWorkspaceProps} from '../studio/VoiceWorkspace';
import {normalizeVoice,previewText,readVoiceDraft,saveVoiceDraft} from '../studio/voiceModel';
import {fishApi,fishErrorMessage,type KeyStatus,type FishVoice,type VoiceList} from './api';

export default function FishVoiceWorkspace({language,selected,projects,onSelect,onChange,storageWarning}:VoiceWorkspaceProps){
 const uk=language==='uk';
 const [settings,setSettings]=useState(()=>selected?.voice?normalizeVoice(selected.voice,language):readVoiceDraft(language));
 const [status,setStatus]=useState<KeyStatus|null>(null),[connecting,setConnecting]=useState(true),[connectionError,setConnectionError]=useState<unknown>(null),[retry,setRetry]=useState(0);
 const [voices,setVoices]=useState<VoiceList>({items:[],page:1,total:0}),[loading,setLoading]=useState(false),[listError,setListError]=useState<unknown>(null);
 const [search,setSearch]=useState(''),[query,setQuery]=useState(''),[own,setOwn]=useState(false),[page,setPage]=useState(1),[refresh,setRefresh]=useState(0);
 const [source,setSource]=useState<'script'|'custom'>(selected?.script.trim()?'script':'custom'),[custom,setCustom]=useState(''),[preview,setPreview]=useState(previewText[language]);
 const [busy,setBusy]=useState<'preview'|'full'|null>(null),[error,setError]=useState<unknown>(null),[localError,setLocalError]=useState(false),[result,setResult]=useState<{url:string;kind:'preview'|'full';name:string}|null>(null);
 const request=useRef<AbortController|null>(null),audioUrl=useRef(''),player=useRef<HTMLAudioElement>(null);
 const voice=settings.fishVoice,speed=settings.fishSpeed||1,text=source==='script'?(selected?.script||''):custom,maxText=status?.maxText||10000;
 const selectedInfo=voices.items.find(v=>v.id===voice?.id);
 const ready=!!status?.configured,valid=!!text.trim()&&text.length<=maxText;
 function clearAudio(){player.current?.pause();if(audioUrl.current)URL.revokeObjectURL(audioUrl.current);audioUrl.current='';setResult(null);}
 function save(patch:Partial<typeof settings>){clearAudio();const next=normalizeVoice({...settings,...patch},language);setSettings(next);if(selected)onChange(next);else if(!saveVoiceDraft(next))setLocalError(true);}
 function selectVoice(v:FishVoice){save({fishVoice:{id:v.id,title:v.title}});}
 useEffect(()=>{
  const controller=new AbortController();setConnecting(true);setConnectionError(null);setStatus(null);
  fishApi.status(controller.signal).then(value=>{if(!controller.signal.aborted)setStatus(value);}).catch(err=>{if(!controller.signal.aborted)setConnectionError(err);}).finally(()=>{if(!controller.signal.aborted)setConnecting(false);});
  return()=>controller.abort();
 },[retry]);
 useEffect(()=>{
  if(!ready)return;
  const controller=new AbortController();setLoading(true);setListError(null);
  fishApi.voices(page,query,own,controller.signal).then(value=>{if(!controller.signal.aborted)setVoices(value);}).catch(err=>{if(!controller.signal.aborted)setListError(err);}).finally(()=>{if(!controller.signal.aborted)setLoading(false);});
  return()=>controller.abort();
 },[ready,page,query,own,refresh]);
 useEffect(()=>{
  const pause=()=>{if(document.hidden)player.current?.pause();};document.addEventListener('visibilitychange',pause);
  return()=>{request.current?.abort();if(audioUrl.current)URL.revokeObjectURL(audioUrl.current);document.removeEventListener('visibilitychange',pause);};
 },[]);
 async function generate(kind:'preview'|'full'){
  if(!voice||!ready||request.current)return;
  const controller=new AbortController();request.current=controller;clearAudio();setBusy(kind);setError(null);
  try{
   const blob=await fishApi.generate({text:kind==='preview'?preview:text,voiceId:voice.id,speed},controller.signal);
   if(!controller.signal.aborted){const url=URL.createObjectURL(blob);audioUrl.current=url;setResult({url,kind,name:`sakyra-${kind==='preview'?'preview':'voice'}-${new Date().toISOString().replace(/[:.]/g,'-')}.mp3`});}
  }catch(err){if(!controller.signal.aborted)setError(err);}finally{if(request.current===controller){request.current=null;setBusy(null);}}
 }
 function cancel(){request.current?.abort();request.current=null;setBusy(null);}
 return <section className="voice-workspace fish-workspace" aria-label={uk?'Озвучка Fish Audio':'Fish Audio voice-over'}>
  <div className="voice-project-bar"><a href="#scripts"><ArrowLeft size={14}/>{uk?'До сценарію':'Back to script'}</a><span>{uk?'Крок 02 / 04':'Step 02 / 04'}</span>{projects.length>0&&<label><FileText size={14}/><select disabled={!!busy} aria-label={uk?'Вибери проєкт':'Choose a project'} value={selected?.id||''} onChange={e=>onSelect(e.target.value)}>{projects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label>}</div>
  {connecting&&<p className="fish-connection" role="status"><LoaderCircle className="fish-spinner" size={17}/>{uk?'Підключаємо Fish Audio…':'Connecting to Fish Audio…'}</p>}
  {!connecting&&!ready&&<div className="fish-connection"><Mic size={24}/><div><strong>{uk?'Підключи свій голос':'Connect your voice'}</strong><p role={connectionError?'alert':undefined}>{connectionError?fishErrorMessage(connectionError,language):(uk?'Додай API-ключ Fish Audio у налаштуваннях — і можна генерувати озвучку.':'Add your Fish Audio API key in settings to generate voice-overs.')}</p><div className="fish-actions"><a href="#settings"><Settings2 size={15}/>{uk?'Налаштувати Fish Audio':'Set up Fish Audio'}</a><button onClick={()=>setRetry(value=>value+1)}><RefreshCw size={15}/>{uk?'Перевірити підключення':'Check connection'}</button></div></div></div>}
  <div className="voice-layout">
   <div className="voice-library-column">
    <div className="voice-library-heading"><h2><Mic size={22}/>{uk?'Бібліотека голосів':'Voice library'}</h2><span>Fish Audio</span></div>
    <form className="fish-search" onSubmit={e=>{e.preventDefault();setPage(1);setQuery(search.trim());setRefresh(v=>v+1);}}><label><Search size={17}/><input aria-label={uk?'Пошук голосів':'Search voices'} placeholder={uk?'Знайти голос за назвою…':'Find a voice by name…'} value={search} maxLength={100} disabled={!ready||!!busy} onChange={e=>setSearch(e.target.value)}/></label><button disabled={!ready||loading||!!busy} type="submit">{uk?'Знайти':'Search'}</button></form>
    <label className="fish-own"><input type="checkbox" checked={own} disabled={!ready||!!busy} onChange={e=>{setOwn(e.target.checked);setPage(1);}}/>{uk?'Лише мої голоси':'My voices only'}</label>
    {loading?<p className="fish-loading" role="status"><LoaderCircle className="fish-spinner" size={19}/>{uk?'Завантажуємо голоси…':'Loading voices…'}</p>:listError?<div className="fish-error" role="alert">{fishErrorMessage(listError,language)}<button className="fish-inline" onClick={()=>setRefresh(v=>v+1)}>{uk?'Повторити':'Retry'}</button></div>:<>
     <div className="voice-library fish-library">{ready&&voices.items.map(v=><article className={'voice-card '+(voice?.id===v.id?'is-selected':'')} key={v.id}><button className="voice-card-select" disabled={!!busy} aria-label={(uk?'Обрати голос ':'Select voice ')+v.title} aria-pressed={voice?.id===v.id} onClick={()=>selectVoice(v)}><span className="fish-voice-avatar"><Mic size={22}/></span><span className="voice-card-person"><strong>{v.title}</strong><span className="voice-tags">{v.languages.map(lang=><span key={lang}>{lang}</span>)}</span></span>{voice?.id===v.id&&<span className="voice-selected-check"><Check size={13}/></span>}</button>{v.description&&<p>{v.description}</p>}<div className="fish-voice-tags">{v.tags.slice(0,3).map((tag,i)=><span key={i}>{tag}</span>)}</div></article>)}</div>
     {ready&&!voices.items.length&&<div className="voice-empty"><Search size={28}/><h3>{uk?'На цій сторінці немає готових голосів':'No ready voices on this page'}</h3><p>{uk?'Спробуй інший запит або наступну сторінку.':'Try another search or the next page.'}</p></div>}
    </>}
    {ready&&<div className="fish-pagination"><button disabled={page===1||loading||!!busy} onClick={()=>setPage(p=>p-1)} aria-label={uk?'Попередня сторінка голосів':'Previous voices page'}><ArrowLeft size={16}/></button><span>{uk?'Сторінка':'Page'} {page}</span><button disabled={page*24>=voices.total||loading||!!busy} onClick={()=>setPage(p=>p+1)} aria-label={uk?'Наступна сторінка голосів':'Next voices page'}><ArrowRight size={16}/></button></div>}
    {!ready&&!connecting&&<div className="voice-empty"><Mic size={32}/><h3>{uk?'Твої AI-голоси з’являться тут':'Your AI voices will appear here'}</h3><p>{uk?'Для доступу потрібні вхід і підключений ключ.':'Sign in and connect your key to access voices.'}</p></div>}
    <div className="fish-script-editor"><div className="fish-text-source" role="group" aria-label={uk?'Джерело тексту':'Text source'}><button disabled={!!busy||!selected} aria-pressed={source==='script'} onClick={()=>{clearAudio();setSource('script');}}><FileText size={14}/>{uk?'Сценарій проєкту':'Project script'}</button><button disabled={!!busy} aria-pressed={source==='custom'} onClick={()=>{clearAudio();setSource('custom');}}>{uk?'Власний текст':'Custom text'}</button></div><label htmlFor="fish-text">{uk?'Текст для озвучки':'Text to narrate'}</label><textarea id="fish-text" rows={7} value={text} readOnly={source==='script'} disabled={!!busy} placeholder={uk?'Встав текст, який потрібно озвучити…':'Paste the text to narrate…'} onChange={e=>{clearAudio();setCustom(e.target.value);}}/><div className="fish-text-meta"><span>{text.length.toLocaleString(language)} / {maxText.toLocaleString(language)}</span>{source==='script'&&<a href="#scripts">{uk?'Редагувати сценарій':'Edit script'}<ArrowRight size={13}/></a>}</div>{text.length>maxText&&<p className="fish-error" role="alert">{uk?'Розділи сценарій на частини до 10 000 символів у вкладці «Власний текст». Текст не обрізається автоматично.':'Split the script into parts of up to 10,000 characters using Custom text. Text is never truncated automatically.'}</p>}</div>
   </div>
   <aside className="voice-settings-panel fish-controls" aria-label={uk?'Налаштування Fish Audio':'Fish Audio settings'}><Blossom className="voice-panel-blossom"/>
    <div className="voice-selected-person"><span className="fish-voice-avatar"><Mic size={28}/></span><div><small>Fish Audio</small><h2>{voice?.title||(uk?'Обери голос':'Choose a voice')}</h2></div></div>
    {selectedInfo?.languages.length?<p className="fish-selected-languages">{selectedInfo.languages.join(' · ')}</p>:null}
    <label className="voice-preview-label"><span><FileText size={16}/>{uk?'Текст для прев’ю Fish Audio':'Fish Audio preview text'}</span><textarea rows={3} maxLength={200} value={preview} disabled={!!busy} onChange={e=>{clearAudio();setPreview(e.target.value);}}/><small>{preview.length} / 200</small></label>
    <button className="fish-preview-button" disabled={!ready||!voice||!preview.trim()||!!busy} onClick={()=>void generate('preview')}>{busy==='preview'?<LoaderCircle className="fish-spinner" size={16}/>:<Mic size={16}/>} {uk?'Створити прев’ю':'Generate preview'}</button>
    <div className="voice-slider-field"><label htmlFor="fish-speed"><Gauge size={17}/>{uk?'Швидкість Fish Audio':'Fish Audio speed'}</label><div><input id="fish-speed" type="range" min="0.5" max="2" step="0.05" disabled={!!busy} value={speed} onChange={e=>save({fishSpeed:Number(e.target.value)})} style={{'--fill':((speed-.5)/1.5*100)+'%'} as React.CSSProperties}/><output htmlFor="fish-speed">{Number(speed.toFixed(2))}×</output></div></div>
    <p className="fish-model-note">s2.1-pro-free · MP3 · 128 kbps</p>
    <button className="voice-generate" disabled={!ready||!voice||!valid||!!busy} onClick={()=>void generate('full')}>{busy==='full'?<LoaderCircle className="fish-spinner" size={18}/>:<Sparkles size={18}/>} {uk?'Згенерувати озвучку':'Generate voice-over'}</button>
    {busy&&<div className="fish-progress" role="status"><p>{uk?'Створюємо аудіо…':'Generating audio…'}</p><button onClick={cancel}><X size={14}/>{uk?'Скасувати':'Cancel'}</button></div>}
    {error!=null&&<p className="fish-error" role="alert">{fishErrorMessage(error,language)}</p>}
    {result&&<div className="fish-result"><p role="status"><Check size={16}/>{result.kind==='preview'?(uk?'Прев’ю готове':'Preview ready'):(uk?'Озвучка готова':'Voice-over ready')}</p><audio ref={player} controls preload="metadata" src={result.url} aria-label={uk?'Аудіо Fish Audio':'Fish Audio playback'}/><a href={result.url} download={result.name}><Download size={17}/>{uk?'Завантажити MP3':'Download MP3'}</a><small>{uk?'Завантаж файл перед виходом із вкладки.':'Download the file before leaving this tab.'}</small></div>}
    <p className="voice-save-note" role={localError||storageWarning?'alert':undefined}>{localError||storageWarning?(uk?'Параметри доступні лише до закриття вкладки.':'Settings last only until this tab closes.'):(uk?'Вибір голосу й швидкість зберігаються у проєкті.':'Voice choice and speed are saved with the project.')}</p>
    <a className="fish-config-link" href="#settings"><Settings2 size={14}/>{uk?'Налаштування ключа':'API key settings'}</a>
   </aside>
  </div>
  <footer className="voice-summary"><div><Mic size={18}/><span>{uk?'Обраний голос':'Selected voice'}: <strong>{voice?.title||'—'}</strong></span></div><a className="voice-next" href="#video">{uk?'Далі: Відео':'Next: Video'}<ArrowRight size={20}/></a></footer>
 </section>;
}
