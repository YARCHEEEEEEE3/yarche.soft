import type {VoiceSettings} from './voiceModel';
export type Project={id:string;name:string;idea:string;script:string;format:'16:9'|'9:16';cover:0|1|2;createdAt:string;updatedAt:string;voice?:VoiceSettings};
const KEY='sakyra.studio.projects.v1';
let memory:Project[]|null=null;
export function readProjects():Project[]{
 if(memory)return memory;
 try{const data=JSON.parse(localStorage.getItem(KEY)||'[]');if(!Array.isArray(data))return [];return data.filter((p:Project)=>p&&typeof p.id==='string'&&typeof p.name==='string'&&p.name.length<=80&&typeof p.idea==='string'&&typeof p.script==='string'&&typeof p.createdAt==='string'&&typeof p.updatedAt==='string'&&['16:9','9:16'].includes(p.format)&&[0,1,2].includes(p.cover));}catch{return [];}
}
export function saveProjects(projects:Project[]){memory=projects;try{localStorage.setItem(KEY,JSON.stringify(projects));return true;}catch{return false;}}
export function projectId(){return globalThis.crypto?.randomUUID?.()||'project-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);}
export const examples=[{name:'Ancient Japan',cover:0 as const,progress:72,duration:'05:24'},{name:'Temple Stories',cover:1 as const,progress:48,duration:'07:13'},{name:'Moon Rituals',cover:2 as const,progress:100,duration:'04:50'}];
