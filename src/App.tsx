import {useEffect,useState} from 'react';
import LoginPage from './LoginPage';
import Onboarding from './Onboarding';
import './onboarding.css';

export default function App(){
  const [route,setRoute]=useState(location.hash);
  useEffect(()=>{const update=()=>setRoute(location.hash);window.addEventListener('hashchange',update);return()=>window.removeEventListener('hashchange',update);},[]);
  return route==='#setup'||route==='#workspace'?<Onboarding/>:<LoginPage/>;
}
