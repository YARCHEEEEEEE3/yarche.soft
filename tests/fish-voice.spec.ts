import {test,expect,type Page} from '@playwright/test';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
const audioFile=path.resolve('tests/fixtures/tts-test-tone.mp3');
const voices=[{id:'fish_a',title:'Calm narrator',description:'Warm storytelling voice',languages:['uk','en'],tags:['calm']},{id:'fish_b',title:'Bright narrator',description:'Clear and lively',languages:['en'],tags:['bright']}];
async function setup(page:Page){
 await page.addInitScript(()=>{if(!localStorage.getItem('sakyra.studio.projects.v1'))localStorage.setItem('sakyra.studio.projects.v1',JSON.stringify([{id:'fish-film',name:'Сакура',script:'Привіт! Це сценарій для перевірки озвучки.',idea:'',format:'16:9',cover:0,createdAt:'2026-11-10',updatedAt:'2026-11-10'}]));});
 await page.route('**/api/fish/key',route=>route.fulfill({json:{configured:true,model:'s2.1-pro-free',maxText:10000}}));
 await page.route('**/api/fish/voices?*',route=>route.fulfill({json:{items:voices,total:2,page:1}}));
}

test('Fish flow: select real voice, generate project MP3, play, download, persist choice',async({page})=>{
 await setup(page);const requests:unknown[]=[];
 await page.route('**/api/fish/tts',async route=>{requests.push(route.request().postDataJSON());await route.fulfill({contentType:'audio/mpeg',body:await readFile(audioFile)});});
 await page.goto('/#voice');
 const generate=page.getByRole('button',{name:'Згенерувати озвучку',exact:true});await expect(generate).toBeDisabled();
 await page.getByRole('button',{name:'Обрати голос Calm narrator',exact:true}).click();await generate.click();
 await expect(page.getByText('Озвучка готова',{exact:true})).toBeVisible();expect(requests).toEqual([{text:'Привіт! Це сценарій для перевірки озвучки.',voiceId:'fish_a',speed:1}]);
 const player=page.locator('audio');await expect.poll(()=>player.evaluate((e:HTMLAudioElement)=>e.readyState)).toBeGreaterThanOrEqual(2);
 await player.evaluate((e:HTMLAudioElement)=>e.play());await expect.poll(()=>player.evaluate((e:HTMLAudioElement)=>e.currentTime)).toBeGreaterThan(0);
 const downloadPromise=page.waitForEvent('download');await page.getByRole('link',{name:'Завантажити MP3'}).click();const download=await downloadPromise;expect(download.suggestedFilename()).toMatch(/^sakyra-voice-.*\.mp3$/);expect(await download.failure()).toBeNull();
 await page.getByRole('button',{name:'Обрати голос Bright narrator',exact:true}).click();await expect(player).toHaveCount(0);
 await page.reload();await expect(page.getByRole('button',{name:'Обрати голос Bright narrator',exact:true})).toHaveAttribute('aria-pressed','true');
});

test('preview is a separate short generation, never sends the full script or API key',async({page})=>{
 await setup(page);let body:Record<string,unknown>={};
 await page.route('**/api/fish/tts',async route=>{body=route.request().postDataJSON();await route.fulfill({contentType:'audio/mpeg',body:await readFile(audioFile)});});
 await page.goto('/#voice');await page.getByRole('button',{name:'Обрати голос Calm narrator',exact:true}).click();
 await page.getByRole('textbox',{name:'Текст для прев’ю Fish Audio'}).fill('Тест голосу.');await page.getByRole('button',{name:'Створити прев’ю',exact:true}).click();
 await expect(page.getByText('Прев’ю готове',{exact:true})).toBeVisible();expect(body).toEqual({text:'Тест голосу.',voiceId:'fish_a',speed:1});
 await page.getByRole('slider',{name:'Швидкість Fish Audio'}).focus();await page.keyboard.press('End');await expect(page.locator('audio')).toHaveCount(0);
});

test('provider failures clear loading and allow retry; in-flight requests disable duplicate generation',async({page})=>{
 await setup(page);let release!:()=>void;
 const wait=new Promise<void>(resolve=>{release=resolve;});
 await page.route('**/api/fish/tts',async route=>{await wait;await route.fulfill({status:429,json:{code:'FISH_RATE_LIMIT'}});});
 await page.goto('/#voice');await page.getByRole('button',{name:'Обрати голос Calm narrator',exact:true}).click();
 const generate=page.getByRole('button',{name:'Згенерувати озвучку',exact:true});await generate.click();await expect(generate).toBeDisabled();await expect(page.getByText('Створюємо аудіо…')).toBeVisible();
 release();await expect(page.getByRole('alert')).toContainText('Ліміт Fish Audio');await expect(generate).toBeEnabled();await expect(page.locator('audio')).toHaveCount(0);
 await page.route('**/api/fish/tts',async route=>route.fulfill({contentType:'audio/mpeg',body:await readFile(audioFile)}));await generate.click();await expect(page.locator('audio')).toBeVisible();
});

test('cancel and navigation discard late audio; text limits prevent truncated generation',async({page})=>{
 await setup(page);let release!:()=>void;const wait=new Promise<void>(resolve=>{release=resolve;});
 await page.route('**/api/fish/tts',async route=>{await wait;await route.fulfill({contentType:'audio/mpeg',body:await readFile(audioFile)}).catch(()=>{});});
 await page.goto('/#voice');await page.getByRole('button',{name:'Обрати голос Calm narrator',exact:true}).click();
 await page.getByRole('button',{name:'Згенерувати озвучку',exact:true}).click();await page.getByRole('button',{name:'Скасувати',exact:true}).click();release();
 await expect(page.getByRole('button',{name:'Згенерувати озвучку',exact:true})).toBeEnabled();await expect(page.locator('audio')).toHaveCount(0);
 await page.getByRole('button',{name:'Власний текст',exact:true}).click();await page.getByRole('textbox',{name:'Текст для озвучки',exact:true}).fill('x'.repeat(10001));await expect(page.getByRole('alert')).toContainText('не обрізається');await expect(page.getByRole('button',{name:'Згенерувати озвучку',exact:true})).toBeDisabled();
 await page.getByRole('link',{name:'Далі: Відео'}).click();await expect(page).toHaveURL(/#video$/);
});

test('voice search, own voices and pagination reach the server; empty result is visible',async({page})=>{
 await setup(page);const urls:string[]=[];
 await page.route('**/api/fish/voices?*',async route=>{urls.push(route.request().url());await route.fulfill({json:{items:new URL(route.request().url()).searchParams.get('q')?[]:voices,total:30,page:1}});});
 await page.goto('/#voice');await expect(page.getByRole('button',{name:'Обрати голос Calm narrator',exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Наступна сторінка голосів'}).click();await expect.poll(()=>urls.at(-1)).toContain('page=2');
 await page.getByRole('checkbox',{name:'Лише мої голоси'}).check();await expect.poll(()=>urls.at(-1)).toContain('own=true');
 await page.getByRole('textbox',{name:'Пошук голосів'}).fill('missing');await page.getByRole('button',{name:'Знайти',exact:true}).click();await expect(page.getByText('На цій сторінці немає готових голосів')).toBeVisible();expect(urls.at(-1)).toContain('q=missing');
});

for(const width of [1440,390,320])test(`Fish UI keeps the studio design at ${width}px`,async({page})=>{
 await setup(page);await page.setViewportSize({width,height:900});await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/#voice');
 await page.getByRole('button',{name:'Обрати голос Calm narrator',exact:true}).click();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(width);await page.screenshot({path:`/workspace/scratch/sakyra/fish-${width}.png`,fullPage:true});
});

test('unconfigured Pages site offers settings instead of a fake AI result',async({page})=>{
 await page.route('**/api/fish/key',route=>route.fulfill({status:404,contentType:'text/html',body:'Not found'}));
 await page.goto('/#voice');await expect(page.getByRole('alert')).toContainText('окремого API-сервера');await expect(page.getByRole('button',{name:'Згенерувати озвучку',exact:true})).toBeDisabled();
 await page.getByRole('link',{name:'Налаштувати Fish Audio'}).click();await expect(page).toHaveURL(/#settings$/);
});
