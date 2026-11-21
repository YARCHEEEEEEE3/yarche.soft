import {ApiError as FishError,apiJson,apiRequest} from '../apiClient';
export {FishError};

export type FishVoice={id:string;title:string;description:string;languages:string[];tags:string[]};
export type VoiceList={items:FishVoice[];total:number;page:number};
export type KeyStatus={configured:boolean;model:string;maxText:number};
export const fishApi={
 status:(signal?:AbortSignal)=>apiJson<KeyStatus>('fish/key',{signal}),
 saveKey:(key:string,signal?:AbortSignal)=>apiJson<{configured:boolean}>('fish/key',{method:'PUT',body:JSON.stringify({key}),signal}),
 removeKey:(signal?:AbortSignal)=>apiJson<{configured:boolean}>('fish/key',{method:'DELETE',signal}),
 voices:(page:number,query:string,own:boolean,signal?:AbortSignal)=>apiJson<VoiceList>(`fish/voices?${new URLSearchParams({page:String(page),q:query,own:String(own)})}`,{signal}),
 async generate(input:{text:string;voiceId:string;speed:number},signal?:AbortSignal){
  const response=await apiRequest('fish/tts',{method:'POST',body:JSON.stringify(input),signal});
  if(!response.headers.get('content-type')?.includes('audio/mpeg'))throw new FishError('FISH_INVALID_AUDIO');
  const audio=await response.blob();if(!audio.size)throw new FishError('FISH_INVALID_AUDIO');return audio;
 },
};
const errors:Record<string,[string,string]>={
 HTTPS_REQUIRED:['Для передачі ключа потрібне захищене HTTPS-підключення до сервера.','A secure HTTPS connection to the server is required.'],
 SERVER_UNAVAILABLE:['Сервер озвучки ще не підключений або недоступний. GitHub Pages потребує окремого API-сервера.','The voice server is not connected or unavailable. GitHub Pages needs a separate API server.'],
 AUTH_NOT_CONFIGURED:['Вхід через Supabase ще не налаштований на сервері.','Supabase sign-in is not configured on the server.'],
 SERVER_NOT_CONFIGURED:['Сервер потребує налаштування захищеного сховища ключів.','The server needs its encrypted key storage configured.'],
 SIGN_IN_REQUIRED:['Увійди в обліковий запис на титульній сторінці, щоб використовувати Fish Audio.','Sign in on the title page to use Fish Audio.'],
 AUTH_UNAVAILABLE:['Не вдалося перевірити вхід. Спробуй ще раз.','Could not verify your session. Please try again.'],
 FISH_KEY_REQUIRED:['Додай API-ключ Fish Audio у налаштуваннях студії.','Add your Fish Audio API key in studio settings.'],
 FISH_KEY_INVALID:['Fish Audio не прийняв ключ. Перевір або заміни його в налаштуваннях.','Fish Audio rejected the key. Check or replace it in settings.'],
 INVALID_KEY:['Введи коректний API-ключ Fish Audio без пробілів усередині.','Enter a valid Fish Audio API key with no spaces inside.'],
 FISH_QUOTA:['Fish Audio повідомив про обмеження балансу або квоти. Перевір свій обліковий запис.','Fish Audio reported a balance or quota limit. Check your account.'],
 FISH_ACCESS_DENIED:['Fish Audio відмовив у доступі. Перевір дозволи ключа та доступність моделі.','Fish Audio denied access. Check key permissions and model availability.'],
 FISH_REQUEST_REJECTED:['Fish Audio відхилив запит. Перевір голос, довжину тексту та доступ до s2.1-pro-free.','Fish Audio rejected the request. Check the voice, text length and access to s2.1-pro-free.'],
 FISH_RATE_LIMIT:['Ліміт Fish Audio. Зачекай трохи та повтори запит.','Fish Audio rate limit reached. Wait a moment and retry.'],
 RATE_LIMIT:['Забагато запитів. Зачекай хвилину.','Too many requests. Wait a minute.'],
 REQUEST_IN_PROGRESS:['Попередній запит ще виконується. Дочекайся завершення.','Your previous request is still running. Wait for it to finish.'],
 FISH_TIMEOUT:['Fish Audio не встиг відповісти. Повтори запит або скороти текст.','Fish Audio timed out. Retry or shorten the text.'],
 FISH_UNAVAILABLE:['Fish Audio тимчасово недоступний. Спробуй пізніше.','Fish Audio is temporarily unavailable. Try again later.'],
 INVALID_TTS_INPUT:['Обери голос і введи від 1 до 10 000 символів тексту.','Select a voice and enter between 1 and 10,000 characters.'],
 FISH_INVALID_AUDIO:['Отримано некоректний аудіофайл. Повтори запит.','The returned audio is invalid. Retry the request.'],
 FISH_RESPONSE_TOO_LARGE:['Аудіо перевищує ліміт цього запиту. Розділи текст на частини.','The audio exceeds this request’s limit. Split the text into parts.'],
 ORIGIN_NOT_ALLOWED:['Адреса сайту ще не дозволена в налаштуваннях API-сервера.','This site’s address is not yet allowed by the API server.'],
};
export function fishErrorMessage(error:unknown,language:'uk'|'en'){
 const code=error instanceof FishError?error.code:'';
 return (errors[code]||['Не вдалося виконати запит. Спробуй ще раз.','The request failed. Please try again.'])[language==='uk'?0:1];
}
