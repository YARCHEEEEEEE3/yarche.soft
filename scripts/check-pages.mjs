import {readFile} from 'node:fs/promises';
import {chromium,expect} from '@playwright/test';
const html=await readFile('docs/index.html','utf8');
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
for(const viewport of [{width:375,height:667},{width:390,height:844},{width:844,height:390}]){
 const context=await browser.newContext({viewport,hasTouch:true,isMobile:true,deviceScaleFactor:2});
 const errors=[],external=[];await context.route('**/*',route=>{if(route.request().url()==='https://sakyra.test/yarche.soft/')return route.fulfill({contentType:'text/html',body:html});external.push(route.request().url());return route.abort();});
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto('https://sakyra.test/yarche.soft/');
 const name=page.getByLabel('Назва студії');await name.fill('Студія на iPhone');
 if(viewport.width<=650)expect(await name.evaluate(el=>parseFloat(getComputedStyle(el).fontSize))).toBeGreaterThanOrEqual(16);
 const button=page.getByRole('button',{name:'Увійти в студію'});await button.scrollIntoViewIfNeeded();await expect(button).toBeInViewport();expect((await button.boundingBox()).height).toBeGreaterThanOrEqual(44);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(viewport.width);
 await button.click();await expect(page.getByRole('heading',{name:'Твоя студія готова'})).toBeVisible();await page.reload();await expect(name).toHaveValue('Студія на iPhone');
 expect(errors).toEqual([]);expect(external).toEqual([]);console.log('Passed',viewport.width+'x'+viewport.height,'subpath, touch targets, preferences, bundled assets');await context.close();
}
await browser.close();
