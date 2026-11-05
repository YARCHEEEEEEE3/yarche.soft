export const voiceProfiles=[
 {id:'oleksii',uk:'Олексій',en:'Oleksii',gender:'male',age:'adult',mood:'cheerful',avatar:0,pitch:.96},
 {id:'marko',uk:'Марко',en:'Marko',gender:'male',age:'young',mood:'confident',avatar:1,pitch:.9},
 {id:'iryna',uk:'Ірина',en:'Iryna',gender:'female',age:'adult',mood:'serious',avatar:2,pitch:1.06},
 {id:'sofia',uk:'Софія',en:'Sofia',gender:'female',age:'young',mood:'cheerful',avatar:3,pitch:1.12},
 {id:'taras',uk:'Тарас',en:'Taras',gender:'male',age:'mature',mood:'serious',avatar:4,pitch:.84},
 {id:'olena',uk:'Олена',en:'Olena',gender:'female',age:'adult',mood:'confident',avatar:5,pitch:1.02},
] as const;
export type VoiceSettings={profile:string;language:'uk'|'en';rate:number;tone:number;preview:string;deviceVoice:string};
export const previewText={uk:'Вітаю! Це приклад голосу для твоєї історії. Разом перетворимо слова на відео, яке хочеться дивитися.',en:'Hello! This is a voice preview for your story. Together, we can turn words into a video worth watching.'};
export function normalizeVoice(value:unknown,language:'uk'|'en'='uk'):VoiceSettings{
 const v=(value&&typeof value==='object'?value:{}) as Partial<VoiceSettings>;
 return {profile:voiceProfiles.some(p=>p.id===v.profile)?v.profile!:'oleksii',language:v.language==='uk'||v.language==='en'?v.language:language,rate:typeof v.rate==='number'&&Number.isFinite(v.rate)?Math.min(1.5,Math.max(.5,v.rate)):1,tone:typeof v.tone==='number'&&Number.isFinite(v.tone)?Math.min(4,Math.max(-4,Math.round(v.tone))):0,preview:typeof v.preview==='string'?v.preview.slice(0,200):previewText[language],deviceVoice:typeof v.deviceVoice==='string'?v.deviceVoice:''};
}
let draft:VoiceSettings|undefined;
export function readVoiceDraft(language:'uk'|'en'){try{return normalizeVoice(draft||JSON.parse(localStorage.getItem('sakyra.voice.draft.v1')||'null'),language);}catch{return normalizeVoice(draft,language);}}
export function saveVoiceDraft(value:VoiceSettings){draft=value;try{localStorage.setItem('sakyra.voice.draft.v1',JSON.stringify(value));return true;}catch{return false;}}
