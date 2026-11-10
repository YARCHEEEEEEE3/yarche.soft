export type LoginIssue={message:string;diagnostic:string};
const knownCodes=new Set(['access_denied','server_error','unexpected_failure','oauth_callback_error','provider_disabled','validation_failed','bad_oauth_state','bad_oauth_callback','oauth_provider_not_supported','bad_code_verifier','flow_state_not_found','flow_state_expired','invalid_credentials','invalid_client','invalid_grant','redirect_uri_mismatch','over_request_rate_limit']);

// Provider descriptions may contain personal data. Classify them, never render/copy them verbatim.
export function describeLoginError(value:unknown,source:'callback'|'session'|'start'='session'):LoginIssue{
 const data=(value&&typeof value==='object'?value:{}) as {code?:unknown;error?:unknown;error_code?:unknown;error_description?:unknown;message?:unknown;name?:unknown};
 const rawCode=String(data.error_code||data.code||data.error||'').toLowerCase();
 const code=knownCodes.has(rawCode)?rawCode:'unknown';
 const text=[data.error_description,data.message,data.name,rawCode].filter(v=>typeof v==='string').join(' ').toLowerCase();
 let reason='UNKNOWN',message='Не вдалося завершити вхід. Скопіюй код помилки нижче — він допоможе знайти причину.';
 if(/invalid_client|invalid client|client secret|unauthorized_client/.test(text)){
  reason='GOOGLE_CLIENT_CREDENTIALS';message='Google не прийняв дані OAuth-клієнта. У Supabase потрібно перевірити пару Client ID та Client Secret із того самого клієнта Google.';
 }else if(/redirect_uri_mismatch|redirect uri mismatch/.test(text)){
  reason='GOOGLE_REDIRECT_URI';message='Адреса повернення не збігається. У Google Cloud має бути точний Callback URL із налаштувань Google у Supabase.';
 }else if(/exchange.*external.*code|external.*code.*exchange|oauth.*token.*exchange/.test(text)){
  reason='GOOGLE_CODE_EXCHANGE';message='Supabase не зміг обміняти код Google на сесію. Потрібно перевірити налаштування Google-провайдера; точну причину покажуть журнали Supabase Auth.';
 }else if(/bad_code_verifier|code verifier|code_verifier|pkce|flow_state_not_found|flow_state_expired/.test(text)){
  reason='BROWSER_LOGIN_STATE';message='Не вдалося підтвердити початок входу в цьому браузері. Почни вхід ще раз у тій самій вкладці Safari й заверши його там, не очищаючи дані сайту.';
 }else if(/provider_disabled|provider.*not enabled|provider.*disabled|oauth_provider_not_supported/.test(text)){
  reason='GOOGLE_PROVIDER_DISABLED';message='Google-вхід не ввімкнений у Supabase. У Sign In / Providers → Google увімкни провайдера та збережи налаштування.';
 }else if(/database error saving new user|database error.*user/.test(text)){
  reason='SUPABASE_USER_STORAGE';message='Supabase не зміг зберегти користувача. Потрібно перевірити помилку в журналах Supabase Auth.';
 }else if(/unable to fetch.*profile|error.*fetch.*profile|unable to get.*user/.test(text)){
  reason='GOOGLE_USER_PROFILE';message='Supabase не зміг отримати профіль Google. Точна причина є в журналах Supabase Auth.';
 }else if(code==='access_denied'||/user denied|access_denied/.test(text)){
  reason='GOOGLE_ACCESS_DENIED';message='Google не надав доступ до входу. Якщо ти скасував дозвіл, спробуй ще раз. Якщо Google обмежив доступ до застосунку, потрібно перевірити його налаштування Audience.';
 }else if(/fetch|network|timeout|authretryablefetcherror/.test(text)){
  reason='AUTH_NETWORK';message='Не вдалося зв’язатися із сервісом входу. Перевір інтернет і спробуй ще раз.';
 }
 return {message,diagnostic:`SAKYRA-AUTH/1 ${source.toUpperCase()} ${reason} ${code}`};
}
export function readLoginCallbackError(href:string):LoginIssue|null{
 const url=new URL(href),query=url.searchParams,hash=new URLSearchParams(url.hash.slice(1));
 const get=(key:string)=>hash.get(key)||query.get(key);
 if(!get('error')&&!get('error_description')&&!get('error_code'))return null;
 return describeLoginError({error:get('error'),error_code:get('error_code'),error_description:get('error_description')},'callback');
}
