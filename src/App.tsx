import {useEffect,useState} from 'react';
import LoginPage from './LoginPage';
import Onboarding from './Onboarding';
import Dashboard from './Dashboard';
import './onboarding.css';

export default function App(){
  const [route,setRoute]=useState(location.hash);
  useEffect(()=>{const update=()=>setRoute(location.hash);window.addEventListener('hashchange',update);return()=>window.removeEventListener('hashchange',update);},[]);
  const view=(['studio','projects','scripts','voice','video','export'] as const).find(v=>route==='#'+v);
  if(view||route==='#workspace')return <Dashboard view={view||'studio'}/>;
  if(route==='#setup'||route==='#settings')return <Onboarding editing={route==='#settings'}/>;
  return <LoginPage/>;
}
