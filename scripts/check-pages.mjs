import {resolve,sep} from 'node:path';
import {chromium,expect} from '@playwright/test';
const root=resolve('docs');
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
for(const viewport of [{width:375,height:667},{width:390,height:844},{width:844,height:390}]){
 const context=await browser.newContext({viewport,hasTouch:true,isMobile:true,deviceScaleFactor:2});
 const errors=[],external=[];await context.route('**/*',async route=>{
  const url=new URL(route.request().url());
  // Pages has no API server by itself. Exercise its honest unavailable state.
  if(url.origin==='https://sakyra.test'&&url.pathname==='/api/fish/key')return route.fulfill({status:404,contentType:'text/html',body:'Not found'});
  if(url.origin!=='https://sakyra.test'||!url.pathname.startsWith('/yarche.soft/')){external.push(url.href);return route.abort();}
  const file=resolve(root,decodeURIComponent(url.pathname.slice('/yarche.soft/'.length))||'index.html');
  if(!file.startsWith(root+sep)){external.push(url.href);return route.abort();}
  try{return await route.fulfill({path:file});}catch{external.push(url.href);return route.abort();}
 });
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto('https://sakyra.test/yarche.soft/');
 await page.getByRole('button',{name:'Відкрити студію'}).click();await expect(page).toHaveURL(/#setup$/);
 const name=page.getByLabel('Назва студії');await name.fill('Студія на iPhone');
 if(viewport.width<=650)expect(await name.evaluate(el=>parseFloat(getComputedStyle(el).fontSize))).toBeGreaterThanOrEqual(16);
 const button=page.getByRole('button',{name:'Увійти в студію'});await button.scrollIntoViewIfNeeded();await expect(button).toBeInViewport();expect((await button.boundingBox()).height).toBeGreaterThanOrEqual(44);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(viewport.width);
 await button.click();await expect(page.getByRole('heading',{name:'Твоя студія готова.'})).toBeVisible();await page.reload();await page.goto('https://sakyra.test/yarche.soft/#settings');await expect(name).toHaveValue('Студія на iPhone');await expect(page.locator('.fish-settings [role=alert]')).toContainText('окремого API-сервера');
 expect(errors).toEqual([]);expect(external).toEqual([]);console.log('Passed',viewport.width+'x'+viewport.height,'subpath, touch targets, preferences, bundled assets');await context.close();
}
await browser.close();
