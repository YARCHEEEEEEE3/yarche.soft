export const styles=[
 {id:'anime',uk:'Кінематографічне аніме',en:'Cinematic anime',hintUk:'Виразні герої, м’яке світло',hintEn:'Expressive characters, soft light',image:0},
 {id:'cinema',uk:'Реалістичне кіно',en:'Live-action cinema',hintUk:'Природні текстури та глибина',hintEn:'Natural textures and depth',image:1},
 {id:'watercolor',uk:'Акварель',en:'Watercolor',hintUk:'Легкі кольори й живі мазки',hintEn:'Light colors, painterly strokes',image:2},
 {id:'3d',uk:'3D-анімація',en:'3D animation',hintUk:'Об’ємний світ і м’які форми',hintEn:'Dimensional worlds, soft shapes',image:3},
 {id:'comic',uk:'Графічний роман',en:'Graphic novel',hintUk:'Контрастна графіка й туш',hintEn:'Bold contrast and ink',image:4},
 {id:'pixel',uk:'Піксель-арт',en:'Pixel art',hintUk:'Ретро-естетика в деталях',hintEn:'Detailed retro aesthetics',image:5},
] as const;
export type Character={id:string;name:string;description:string;image:number};
export type Scene={id:number;title:string;prompt:string;character:string;location:number;shot:'wide'|'portrait'|'cinematic'|'dynamic';image:number;seconds:number;photo:boolean;animated:boolean};
export type VideoState={version:1;duration:number;shotSeconds:number;style:string;phase:'setup'|'characters'|'scenes'|'ready';characters:Character[];scenes:Scene[]};
export const durations=[30,60,180,300,600,1200,1800];
export const shotLengths=[4,6,8];
export function sceneCount(duration:number,shotSeconds:number){return Math.ceil(duration/shotSeconds);}
export function timecode(seconds:number){return `${Math.floor(seconds/60).toString().padStart(2,'0')}:${(seconds%60).toString().padStart(2,'0')}`;}
export function defaultCharacters(language:'uk'|'en'):Character[]{return language==='uk'?[{id:'marcus',name:'Маркус',description:'Молодий римлянин із лавровим вінком і червоним плащем. Допитливий та рішучий.',image:0},{id:'cleo',name:'Клео',description:'Мандрівниця з Єгипту. Темне волосся, золота діадема, бірюзовий одяг.',image:1},{id:'narrator',name:'Оповідач',description:'Мудрий літописець із сивою бородою у світлій тозі.',image:2}]:[{id:'marcus',name:'Marcus',description:'A curious, determined young Roman with a laurel wreath and a red cloak.',image:0},{id:'cleo',name:'Cleo',description:'An Egyptian traveler with dark hair, a gold diadem and teal clothes.',image:1},{id:'narrator',name:'Narrator',description:'A wise chronicler with a silver beard and a cream toga.',image:2}];}
export const locations=[{uk:'Римський форум',en:'Roman forum',image:0},{uk:'Храм',en:'Temple',image:3},{uk:'Морський берег',en:'Coast',image:5},{uk:'Кам’яний міст',en:'Stone bridge',image:4}];
const sceneNames={uk:['Панорама Риму','Маркус у форумі','Портрет Маркуса','Клео входить у храм','Розмова біля мосту','Захід сонця над морем'],en:['Rome at dawn','Marcus in the forum','Portrait of Marcus','Cleo enters the temple','A conversation by the bridge','Sunset over the sea']};
const scenePrompts={uk:['Загальний план Риму. Колони форуму в ранковому світлі, м’яка повітряна перспектива.','Маркус повільно йде форумом. Червоний плащ, кам’яні колони, тепле світло.','Крупний план Маркуса, рішучий погляд, лавровий вінок. Розмитий форум на тлі.','Клео заходить у храм. Бірюзове вбрання, золоті деталі, світло між колонами.','Оповідач розмовляє з Маркусом біля кам’яного мосту. Річка й давнє місто.','Маркус і Клео дивляться на море. Панорама міста, золотий захід, спокійна атмосфера.'],en:['A wide shot of Rome. Forum columns in warm morning light, soft atmospheric depth.','Marcus walks through the forum in a red cloak. Stone columns, warm light.','A close-up of Marcus with a determined gaze and a laurel wreath. Soft forum background.','Cleo enters a temple. Teal clothing, gold details, light between columns.','The narrator speaks with Marcus by a stone bridge. A river and an ancient city.','Marcus and Cleo look out to sea. A city panorama, golden sunset, a peaceful atmosphere.']};
export function newVideo(language:'uk'|'en'):VideoState{return {version:1,duration:60,shotSeconds:8,style:'anime',phase:'setup',characters:defaultCharacters(language),scenes:[]};}
export function storyboard(state:VideoState,language:'uk'|'en',script=''):Scene[]{
 const names=defaultCharacters(language);
 const rename=(text:string)=>names.reduce((value,c,i)=>c.name===state.characters[i].name?value:language==='uk'?value.replace(new RegExp(i===0?'Маркус(?:ом|а)?':i===1?'Клео':'Оповідач(?:ем|а)?','g'),()=>state.characters[i].name):value.split(c.name).join(state.characters[i].name),text);
 const snippets=script.split(/\n\s*\n|(?<=[.!?])\s+/).map(s=>s.trim()).filter(Boolean);
 return Array.from({length:sceneCount(state.duration,state.shotSeconds)},(_,i)=>({id:i+1,title:rename(sceneNames[language][i%6]),prompt:(snippets.length?snippets[i%snippets.length].slice(0,2500)+'\n\n':'')+rename(scenePrompts[language][i%6]),character:i%6===3?'cleo':i%6===4?'narrator':'marcus',location:i%6===3?1:i%6===4?3:i%6===5?2:0,shot:i%6===2?'portrait':'cinematic',image:i%6,seconds:Math.min(state.shotSeconds,state.duration-i*state.shotSeconds),photo:false,animated:false}));
}
export function normalizeVideo(value:unknown,language:'uk'|'en'):VideoState{
 const base=newVideo(language);if(!value||typeof value!=='object')return base;
 const v=value as Partial<VideoState>;
 const duration=durations.includes(v.duration||0)?v.duration!:60,shotSeconds=shotLengths.includes(v.shotSeconds||0)?v.shotSeconds!:8;
 const characters=Array.isArray(v.characters)&&v.characters.length===3?v.characters.map((c,i)=>({...base.characters[i],name:typeof c?.name==='string'?c.name.slice(0,40):base.characters[i].name,description:typeof c?.description==='string'?c.description.slice(0,400):base.characters[i].description})):base.characters;
 const expected=sceneCount(duration,shotSeconds);
 const scenes=Array.isArray(v.scenes)?v.scenes.slice(0,expected).filter((s,i)=>s&&s.id===i+1&&typeof s.title==='string'&&typeof s.prompt==='string').map((s,i)=>({id:i+1,title:s.title.slice(0,100),prompt:s.prompt.slice(0,3000),character:characters.some(c=>c.id===s.character)?s.character:'marcus',location:[0,1,2,3].includes(s.location)?s.location:0,shot:['wide','portrait','cinematic','dynamic'].includes(s.shot)?s.shot:'cinematic' as Scene['shot'],image:i%6,seconds:Math.min(shotSeconds,duration-i*shotSeconds),photo:s.photo===true,animated:s.photo===true&&s.animated===true})):[];
 const phase=v.phase==='characters'?'characters':(v.phase==='scenes'||v.phase==='ready')&&scenes.length===expected?v.phase:'setup';
 return {version:1,duration,shotSeconds,style:styles.some(s=>s.id===v.style)?v.style!:'anime',phase,characters,scenes:phase==='setup'||phase==='characters'?[]:scenes};
}
let draft:VideoState|undefined;
export function readVideoDraft(language:'uk'|'en'){try{return normalizeVideo(draft||JSON.parse(localStorage.getItem('sakyra.video.demo.v1')||'null'),language);}catch{return normalizeVideo(draft,language);}}
export function saveVideoDraft(state:VideoState){draft=state;try{localStorage.setItem('sakyra.video.demo.v1',JSON.stringify(state));return true;}catch{return false;}}
