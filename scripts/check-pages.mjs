import {resolve,sep} from 'node:path';
import {loadEnv} from 'vite';
import {chromium,expect} from '@playwright/test';
const root=resolve('docs');
const config=loadEnv('production',process.cwd(),'VITE_');
const authOrigin=config.VITE_SUPABASE_URL?new URL(config.VITE_SUPABASE_URL).origin:null;
const user={id:'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',aud:'authenticated',role:'authenticated',email:'test@example.invalid',app_metadata:{provider:'google'},user_metadata:{},created_at:'2026-11-10T00:00:00Z'};
const jwt=[{alg:'HS256',typ:'JWT'},{sub:user.id,aud:'authenticated',exp:Math.floor(Date.now()/1000)+3600}].map(v=>Buffer.from(JSON.stringify(v)).toString('base64url')).join('.')+'.test-signature';
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
for(const viewport of [{width:375,height:667},{width:390,height:844},{width:844,height:390}]){
 const context=await browser.newContext({viewport,hasTouch:true,isMobile:true,deviceScaleFactor:2});
 let authorization=null,exchanges=0;
 const errors=[],external=[];await context.route('**/*',async route=>{
  const url=new URL(route.request().url());
  if(authOrigin&&url.origin===authOrigin){
   if(url.pathname==='/auth/v1/authorize'){authorization=url;return route.fulfill({contentType:'text/html',body:'<p>Mock Google sign-in boundary</p>'});}
   const headers={'Access-Control-Allow-Origin':'https://sakyra.test','Access-Control-Allow-Headers':'authorization, apikey, content-type, x-client-info, x-supabase-api-version','Access-Control-Allow-Methods':'GET, POST, OPTIONS'};
   if(route.request().method()==='OPTIONS')return route.fulfill({status:204,headers});
   if(url.pathname==='/auth/v1/token'){
    const body=route.request().postDataJSON();expect(body.auth_code).toBe('test-authorization-code');expect(body.code_verifier.length).toBeGreaterThan(30);expect(route.request().headers().apikey).toBe(config.VITE_SUPABASE_PUBLISHABLE_KEY);exchanges++;
    return route.fulfill({headers,json:{access_token:jwt,refresh_token:'test-refresh-token',token_type:'bearer',expires_in:3600,user}});
   }
   if(url.pathname==='/auth/v1/user')return route.fulfill({headers,json:user});
   external.push(url.href);return route.abort();
  }
  // Pages has no API server by itself. Exercise its honest unavailable state.
  if(url.origin==='https://sakyra.test'&&url.pathname==='/api/fish/key')return route.fulfill({status:404,contentType:'text/html',body:'Not found'});
  if(url.origin!=='https://sakyra.test'||!url.pathname.startsWith('/yarche.soft/')){external.push(url.href);return route.abort();}
  const file=resolve(root,decodeURIComponent(url.pathname.slice('/yarche.soft/'.length))||'index.html');
  if(!file.startsWith(root+sep)){external.push(url.href);return route.abort();}
  try{return await route.fulfill({path:file});}catch{external.push(url.href);return route.abort();}
 });
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto('https://sakyra.test/yarche.soft/');
 if(authOrigin){
  await page.getByRole('button',{name:'Увійти з Google',exact:true}).click();await expect.poll(()=>authorization?.pathname).toBe('/auth/v1/authorize');
  expect(authorization.searchParams.get('provider')).toBe('google');expect(authorization.searchParams.get('redirect_to')).toBe('https://sakyra.test/yarche.soft/');expect(authorization.searchParams.get('code_challenge_method')).toBe('s256');expect(authorization.searchParams.get('code_challenge').length).toBeGreaterThan(30);
  await page.goto('https://sakyra.test/yarche.soft/?code=test-authorization-code');await expect(page).toHaveURL(/#setup$/);expect(exchanges).toBe(1);
 }else{await page.getByRole('button',{name:'Відкрити студію'}).click();await expect(page).toHaveURL(/#setup$/);}
 const name=page.getByLabel('Назва студії');await name.fill('Студія на iPhone');
 if(viewport.width<=650)expect(await name.evaluate(el=>parseFloat(getComputedStyle(el).fontSize))).toBeGreaterThanOrEqual(16);
 const button=page.getByRole('button',{name:'Увійти в студію'});await button.scrollIntoViewIfNeeded();await expect(button).toBeInViewport();expect((await button.boundingBox()).height).toBeGreaterThanOrEqual(44);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(viewport.width);
 await button.click();await expect(page.getByRole('heading',{name:'Твоя студія готова.'})).toBeVisible();await page.reload();await page.goto('https://sakyra.test/yarche.soft/#settings');await expect(name).toHaveValue('Студія на iPhone');await expect(page.locator('.fish-settings [role=alert]')).toContainText('окремого API-сервера');
 if(authOrigin){await page.goto('https://sakyra.test/yarche.soft/#login');await expect(page).toHaveURL(/#studio$/);expect(exchanges).toBe(1);}
 expect(errors).toEqual([]);expect(external).toEqual([]);console.log('Passed',viewport.width+'x'+viewport.height,'subpath, touch targets, preferences, bundled assets');await context.close();
}
await browser.close();
