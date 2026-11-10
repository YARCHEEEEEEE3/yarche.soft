import {resolve,sep} from 'node:path';
import {loadEnv} from 'vite';
import {chromium,expect} from '@playwright/test';
const config=loadEnv('production',process.cwd(),'VITE_');
if(!config.VITE_SUPABASE_URL)throw Error('Build with production auth configuration before running this check');
const authOrigin=new URL(config.VITE_SUPABASE_URL).origin;
const root=resolve('docs');
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
const cases=[
 {name:'invalid-client',code:'unexpected_failure',description:'Unable to exchange external code: invalid_client fake-private-secret test@example.invalid',expected:'GOOGLE_CLIENT_CREDENTIALS'},
 {name:'provider-exchange',code:'unexpected_failure',description:'Unable to exchange external code: secret=fake-private-secret',expected:'GOOGLE_CODE_EXCHANGE'},
 {name:'access-denied',code:'access_denied',description:'The user denied access: test@example.invalid',expected:'GOOGLE_ACCESS_DENIED'},
 {name:'redirect-mismatch',code:'redirect_uri_mismatch',description:'redirect_uri_mismatch',expected:'GOOGLE_REDIRECT_URI'},
 {name:'provider-disabled',code:'provider_disabled',description:'Provider is not enabled',expected:'GOOGLE_PROVIDER_DISABLED'},
 {name:'user-save',code:'unexpected_failure',description:'Database error saving new user test@example.invalid',expected:'SUPABASE_USER_STORAGE'},
 {name:'unknown-redaction',code:'fake-private-secret',description:'Bearer fake-private-secret token test@example.invalid',expected:'UNKNOWN unknown'},
 {name:'query-error',code:'bad_code_verifier',description:'PKCE verifier expired',expected:'BROWSER_LOGIN_STATE',query:true},
 {name:'pkce-exchange-failure',expected:'BROWSER_LOGIN_STATE',exchange:true},
];
try{
 for(const item of cases){
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  let exchanges=0;const errors=[];
  await context.addInitScript(({storageKey,exchange})=>{
   window.__copiedDiagnostic='';
   Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>{window.__copiedDiagnostic=text;}}});
   if(exchange)localStorage.setItem(storageKey+'-code-verifier',JSON.stringify('test-verifier-for-failed-pkce-exchange'));
  },{storageKey:'sb-'+new URL(authOrigin).hostname.split('.')[0]+'-auth-token',exchange:!!item.exchange});
  await context.route('**/*',async route=>{
   const url=new URL(route.request().url());
   if(url.origin===authOrigin){
    const headers={'Access-Control-Allow-Origin':'https://sakyra.test','Access-Control-Allow-Headers':'authorization, apikey, content-type, x-client-info, x-supabase-api-version','Access-Control-Allow-Methods':'GET, POST, OPTIONS'};
    if(route.request().method()==='OPTIONS')return route.fulfill({status:204,headers});
    if(item.exchange&&url.pathname==='/auth/v1/token'){exchanges++;return route.fulfill({status:400,headers,json:{code:'bad_code_verifier',msg:'PKCE code verifier mismatch fake-private-secret'}});}
    return route.abort();
   }
   if(url.origin!=='https://sakyra.test'||!url.pathname.startsWith('/yarche.soft/'))return route.abort();
   const file=resolve(root,decodeURIComponent(url.pathname.slice('/yarche.soft/'.length))||'index.html');
   if(!file.startsWith(root+sep))return route.abort();
   return route.fulfill({path:file});
  });
  const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));
  const params=new URLSearchParams({error:'server_error',error_code:item.code||'',error_description:item.description||''});
  const suffix=item.exchange?'?code=test-failed-code':(item.query?'?':'#')+params;
  await page.goto('https://sakyra.test/yarche.soft/'+suffix);
  await expect(page.locator('.auth-diagnostic code')).toContainText(item.expected);
  const text=await page.locator('.auth-message').innerText();expect(text).not.toContain('fake-private-secret');expect(text).not.toContain('test@example.invalid');
  await page.getByRole('button',{name:'Скопіювати код помилки'}).click();
  const copied=await page.evaluate(()=>window.__copiedDiagnostic);expect(copied).toContain(item.expected);expect(copied).not.toContain('fake-private-secret');expect(copied).not.toContain('http');
  await expect(page.getByRole('button',{name:'Код скопійовано'})).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(390);expect(errors).toEqual([]);
  if(item.exchange)expect(exchanges).toBe(1);
  if(item.name==='provider-exchange')await page.screenshot({path:'/workspace/scratch/sakyra/auth-error-diagnostic.png'});
  console.log('Passed',item.name);await context.close();
 }
}finally{await browser.close();}
