import {useRef,useState} from 'react';
import {ArrowRight,Box,Clapperboard,ChevronDown,Globe2,Info,Monitor,Pencil,Smartphone,Sparkles} from 'lucide-react';
import StudioBrand,{Blossom} from './StudioBrand';
import OnboardingAtmosphere from './OnboardingAtmosphere';
import FishSettings from './fish/FishSettings';

import {readPreferences,savePreferences,type Preferences} from './studio/preferences';

const copy={uk:{badge:'Перший запуск',title:'Налаштуй свою',accent:'студію',subtitle:'Кілька параметрів, і можна починати створювати відео',name:'Назва студії',language:'Мова інтерфейсу',format:'Формат відео',default:'за замовчуванням',enter:'Увійти в студію',note:'Усі параметри можна буде змінити в налаштуваннях пізніше',required:'Вкажи назву студії — від 1 до 48 символів.',ready:'Твоя студія готова',saved:'Налаштування збережено на цьому пристрої.',failed:'Браузер не дозволив зберегти параметри. Вони діятимуть до закриття вкладки.',edit:'Змінити параметри',preview:'Це попередній перегляд студії. Генерацію відео ще не підключено.',back:'На титульну'},en:{badge:'First launch',title:'Set up your',accent:'studio',subtitle:'A few details, and you’re ready to start creating videos',name:'Studio name',language:'Interface language',format:'Default video',default:'format',enter:'Enter the studio',note:'You can change all these preferences in settings later',required:'Enter a studio name between 1 and 48 characters.',ready:'Your studio is ready',saved:'Your preferences are saved on this device.',failed:'Your browser could not save these preferences. They will last until this tab closes.',edit:'Edit preferences',preview:'This is a studio preview. Video generation is not connected yet.',back:'Back to title'}};
export default function Onboarding({editing=false}:{editing?:boolean}){
  const [prefs,setPrefs]=useState<Preferences>(readPreferences),[error,setError]=useState(false),[image,setImage]=useState<HTMLImageElement|null>(null);
  const input=useRef<HTMLInputElement>(null),t=copy[prefs.language];
  function submit(e:React.FormEvent){e.preventDefault();const name=prefs.name.trim();if(!name||name.length>48){setError(true);input.current?.focus();return;}savePreferences({...prefs,name});location.hash='studio';}
  return <main className="onboarding-world" lang={prefs.language}>
    <div className="onboarding-scenery" aria-hidden="true"><img src="/scene/onboarding-background.png" alt="" onLoad={e=>setImage(e.currentTarget)}/>{image&&<OnboardingAtmosphere image={image}/>}<div className="scenery-shade"/></div>
    <div className="onboarding-layout">
      <StudioBrand/>
      <section className="setup-panel" aria-labelledby="setup-title">
        <Blossom className="panel-blossom"/>
        <div className="setup-badge"><Sparkles size={16}/><span>{editing?(prefs.language==='uk'?'Твій простір':'Your space'):t.badge}</span></div>
          <h1 id="setup-title">{editing?(prefs.language==='uk'?'Налаштування':'Studio'):t.title} <span>{editing?(prefs.language==='uk'?'студії':'settings'):t.accent}</span></h1>
          <p className="setup-subtitle">{t.subtitle}</p>
          <form onSubmit={submit} noValidate>
            <div className="setup-fields">
              <div className={'setup-row '+(error?'has-error':'')}>
                <label htmlFor="studio-name" className="row-label"><Box/><span>{t.name}</span></label>
                <div className="name-control"><input ref={input} id="studio-name" name="studioName" value={prefs.name} maxLength={48} autoComplete="organization" aria-invalid={error} aria-describedby={error?'name-error':undefined} onChange={e=>{setPrefs({...prefs,name:e.target.value});setError(false);}}/><Pencil size={19} aria-hidden="true"/></div>
              </div>
              {error&&<p id="name-error" className="field-error" role="alert">{t.required}</p>}
              <div className="setup-row">
                <label htmlFor="studio-language" className="row-label"><Globe2/><span>{t.language}</span></label>
                <div className="language-control"><span className={'language-flag '+prefs.language} aria-hidden="true">{prefs.language==='en'?'EN':''}</span><select id="studio-language" value={prefs.language} onChange={e=>setPrefs({...prefs,language:e.target.value as Preferences['language']})}><option value="uk">Українська</option><option value="en">English</option></select><ChevronDown size={21} aria-hidden="true"/></div>
              </div>
              <fieldset className="setup-row format-row"><legend className="sr-only">{t.format} {t.default}</legend><div className="row-label" aria-hidden="true"><Clapperboard/><span>{t.format}<small>{t.default}</small></span></div><div className="format-options">{(['16:9','9:16'] as const).map(format=><label className={'format-option '+(prefs.format===format?'selected':'')} key={format}><input type="radio" name="videoFormat" value={format} checked={prefs.format===format} onChange={()=>setPrefs({...prefs,format})}/>{format==='16:9'?<Monitor/>:<Smartphone/>}<span><strong>{format}</strong><small>{format==='16:9'?'YouTube':'Shorts'}</small></span></label>)}</div></fieldset>
            </div>
            <button type="submit" className="enter-studio"><span>{editing?(prefs.language==='uk'?'Зберегти налаштування':'Save preferences'):t.enter}</span><ArrowRight size={25}/><Blossom className="button-blossom"/></button>
          </form>
          {editing&&<FishSettings language={prefs.language}/>}
          <p className="setup-footnote"><Info size={16}/><span>{t.note}</span></p>
        <a className="back-to-login" href={editing?'#studio':'#login'}>{editing?(prefs.language==='uk'?'До студії':'Back to studio'):t.back}<ArrowRight size={15}/></a>
      </section>
    </div>
  </main>;
}
