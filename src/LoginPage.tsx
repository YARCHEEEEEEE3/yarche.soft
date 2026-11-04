import {useEffect,useRef,useState} from 'react';
import type {Session} from '@supabase/supabase-js';
import ReferenceEffects from './ReferenceEffects';
import LivingScene from './LivingScene';
import GoogleIcon from './GoogleIcon';
import {auth} from './auth';

export default function App(){
  const busyRef=useRef(false),imageRef=useRef<HTMLImageElement>(null);
  const [busy,setBusy]=useState(false),[message,setMessage]=useState(''),[session,setSession]=useState<Session|null>(null),[route,setRoute]=useState(location.hash),[loaded,setLoaded]=useState(false);
  useEffect(()=>{
    const hash=()=>setRoute(location.hash);window.addEventListener('hashchange',hash);let alive=true;
    const params=new URLSearchParams(location.hash.slice(1));if(params.has('error_description'))setMessage('Не вдалося завершити вхід. Спробуй ще раз.');
    if(!auth)return()=>window.removeEventListener('hashchange',hash);
    auth.auth.getSession().then(({data,error})=>{if(!alive)return;if(error)setMessage('Не вдалося перевірити вхід. Спробуй ще раз.');if(data.session){setSession(data.session);location.hash='workspace';}});
    const {data}=auth.auth.onAuthStateChange((_event,next)=>{if(!alive)return;setSession(next);if(next)location.hash='workspace';else if(location.hash==='#workspace')location.hash='';});
    return()=>{alive=false;data.subscription.unsubscribe();window.removeEventListener('hashchange',hash);};
  },[]);
  async function login(){
    if(busyRef.current)return;setMessage('');
    if(!auth){setMessage('Вхід через Google ще не підключено. Зараз доступний перегляд дизайну.');return;}
    if(!/^https?:$/.test(location.protocol)){setMessage('Для входу через Google відкрий SAKYRA за адресою сайту. Цей HTML — автономний перегляд.');return;}
    busyRef.current=true;setBusy(true);
    try{const {error}=await auth.auth.signInWithOAuth({provider:'google',options:{redirectTo:location.origin+location.pathname}});if(error)throw error;}
    catch{setMessage('Не вдалося відкрити Google. Спробуй ще раз.');busyRef.current=false;setBusy(false);}
  }
  async function signOut(){
    try{const {error}=await auth!.auth.signOut();if(error)throw error;setSession(null);location.hash='';}
    catch{setMessage('Не вдалося вийти. Спробуй ще раз.');}
  }
  return <main className="reference-world">
    <h1 className="sr-only">SAKYRA</h1>
    <div className="reference-stage">
      <img ref={imageRef} className="reference-art" src="/scene/living-background.png" alt="Японський пейзаж SAKYRA із сакурою, горою Фудзі, мостом і вечірнім озером" draggable={false} onLoad={()=>setLoaded(true)} onError={()=>setMessage('Не вдалося завантажити зображення. Відкрий файл повторно.')}/>
      {loaded&&imageRef.current&&<LivingScene image={imageRef.current}/>}
      {loaded&&<ReferenceEffects/>}
      <div className="login-target"><button className="reference-login" aria-label="Увійти з Google" aria-busy={busy} disabled={busy||!loaded} onClick={login}><GoogleIcon/><span>{busy?'Відкриваємо…':'Увійти з Google'}</span>{busy?<span className="login-spinner"/>:<svg className="login-arrow" viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="M5 16h22M18 7l9 9-9 9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}</button></div>
      <p className={'auth-message '+(message?'visible':'')} role="status" aria-live="polite">{message}</p>
    </div>
    {session&&route==='#workspace'&&<section className="workspace-entry" aria-label="Робоча область"><p>SAKYRA · ТВОРЧИЙ ПРОСТІР</p><h2>Твоя історія починається тут.</h2><p>Вхід виконано: {session.user.email}</p><p>Робоча область — наступний етап. Генерацію відео ще не підключено.</p><button onClick={signOut}>Вийти</button></section>}
  </main>;
}
