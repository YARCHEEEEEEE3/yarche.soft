import {useEffect,useRef,useState} from 'react';
import {Clapperboard} from 'lucide-react';
import ReferenceEffects from './ReferenceEffects';
import LivingScene from './LivingScene';
import GoogleIcon from './GoogleIcon';
import {auth} from './auth';
import {hasPreferences} from './studio/preferences';

export default function LoginPage(){
  const busyRef=useRef(false),imageRef=useRef<HTMLImageElement>(null);
  const [busy,setBusy]=useState(false),[message,setMessage]=useState(''),[loaded,setLoaded]=useState(false),[art,setArt]=useState('');
  useEffect(()=>{
    let alive=true;
    const params=new URLSearchParams(location.hash.slice(1));if(params.has('error_description'))setMessage('Не вдалося завершити вхід. Спробуй ще раз.');
    if(!auth)return;
    auth.auth.getSession().then(({data,error})=>{if(!alive)return;if(error)setMessage('Не вдалося перевірити вхід. Спробуй ще раз.');if(data.session)location.hash=hasPreferences()?'studio':'setup';});
    const {data}=auth.auth.onAuthStateChange((_event,next)=>{if(!alive)return;if(next)location.hash=hasPreferences()?'studio':'setup';});
    return()=>{alive=false;data.subscription.unsubscribe();};
  },[]);
  async function login(){
    if(busyRef.current)return;setMessage('');
    if(!auth){location.hash=hasPreferences()?'studio':'setup';return;}
    if(!/^https?:$/.test(location.protocol)){setMessage('Для входу через Google відкрий SAKYRA за адресою сайту. Цей HTML — автономний перегляд.');return;}
    busyRef.current=true;setBusy(true);
    try{const {error}=await auth.auth.signInWithOAuth({provider:'google',options:{redirectTo:location.origin+location.pathname}});if(error)throw error;}
    catch{setMessage('Не вдалося відкрити Google. Спробуй ще раз.');busyRef.current=false;setBusy(false);}
  }
  const label=auth?'Увійти з Google':'Відкрити студію';
  return <main className="reference-world">
    <h1 className="sr-only">SAKYRA</h1>
    <div className="reference-stage">
      <picture className="title-picture"><source media="(max-width: 650px) and (orientation: portrait)" srcSet="/scene/title-mobile.png"/><img ref={imageRef} className="reference-art" src="/scene/living-background.png" alt="Японський пейзаж SAKYRA із сакурою, горою Фудзі, мостом і вечірнім озером" draggable={false} onLoad={e=>{setLoaded(true);setArt(e.currentTarget.currentSrc);}} onError={()=>setMessage('Не вдалося завантажити зображення. Відкрий файл повторно.')}/></picture>
      {loaded&&imageRef.current&&<LivingScene key={art} image={imageRef.current}/>}
      {loaded&&<ReferenceEffects/>}
      <div className="login-target"><button className="reference-login" aria-label={label} aria-busy={busy} disabled={busy||!loaded} onClick={login}>{auth?<GoogleIcon/>:<Clapperboard className="studio-entry-icon"/>}<span>{busy?'Відкриваємо…':label}</span>{busy?<span className="login-spinner"/>:<svg className="login-arrow" viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="M5 16h22M18 7l9 9-9 9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}</button></div>
      {!auth&&<p className="preview-caption">Тестовий перегляд · без авторизації</p>}
      <p className={'auth-message '+(message?'visible':'')} role="status" aria-live="polite">{message}</p>
    </div>

  </main>;
}
