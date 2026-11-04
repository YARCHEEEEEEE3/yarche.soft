export type Preferences={name:string;language:'uk'|'en';format:'16:9'|'9:16'};
const KEY='sakyra.studio.preferences.v1';
let memory:Preferences|null=null;
let warning=false;
export function readPreferences():Preferences{
 if(memory)return memory;
 try{const value=JSON.parse(localStorage.getItem(KEY)||'null');if(value&&typeof value.name==='string'&&value.name.trim()&&value.name.length<=48&&(value.language==='uk'||value.language==='en')&&(value.format==='16:9'||value.format==='9:16'))return value;}catch{/* In-memory preferences still work when storage is blocked. */}
 return {name:'Моя студія',language:'uk',format:'16:9'};
}
export function hasPreferences(){if(memory)return true;try{return !!localStorage.getItem(KEY);}catch{return false;}}
export function savePreferences(value:Preferences){memory=value;try{localStorage.setItem(KEY,JSON.stringify(value));warning=false;}catch{warning=true;}return !warning;}
export function preferencesStorageWarning(){return warning;}
