import {test,expect,type Page} from '@playwright/test';

async function mockSpeech(page:Page){
 await page.addInitScript(()=>{
  const state=window as unknown as {speechCalls:{text:string;rate:number;pitch:number;lang:string}[];speechCancels:number;utterance:{onend?:()=>void}|null};state.speechCalls=[];state.speechCancels=0;
  const events=new EventTarget();
  Object.defineProperty(window,'speechSynthesis',{configurable:true,value:{getVoices:()=>[{name:'Test Ukrainian',lang:'uk-UA',voiceURI:'test-uk'},{name:'Test English',lang:'en-US',voiceURI:'test-en'}],addEventListener:events.addEventListener.bind(events),removeEventListener:events.removeEventListener.bind(events),cancel:()=>{state.speechCancels++;},speak:(u:{text:string;rate:number;pitch:number;lang:string;onstart?:()=>void;onend?:()=>void})=>{state.utterance=u;state.speechCalls.push({text:u.text,rate:u.rate,pitch:u.pitch,lang:u.lang});queueMicrotask(()=>u.onstart?.());}}});
  Object.defineProperty(window,'SpeechSynthesisUtterance',{configurable:true,value:class{ text:string;constructor(text:string){this.text=text;} }});
 });
}

test('voice filters, empty state, selection and project settings persist',async({page})=>{
 await page.addInitScript(()=>{if(!localStorage.getItem('sakyra.studio.projects.v1'))localStorage.setItem('sakyra.studio.projects.v1',JSON.stringify([{id:'film',name:'Мій фільм',script:'Сакура '.repeat(140),idea:'',format:'16:9',cover:0,createdAt:'2026-11-05',updatedAt:'2026-11-05'}]));});
 await page.goto('/#voice');await page.getByRole('button',{name:/Голос пристрою/}).click();await expect(page.locator('.voice-card')).toHaveCount(6);
 await page.getByRole('group',{name:'Стать',exact:true}).getByRole('button',{name:'Жінка',exact:true}).click();await expect(page.locator('.voice-card')).toHaveCount(3);
 await page.getByRole('group',{name:'Вік',exact:true}).getByRole('button',{name:'Зрілий',exact:true}).click();await expect(page.getByText('Немає голосів із такими фільтрами')).toBeVisible();
 await page.getByRole('button',{name:'Скинути фільтри'}).click();await expect(page.locator('.voice-card')).toHaveCount(6);
 await page.getByRole('button',{name:'Обрати голос Олена',exact:true}).click();await page.getByRole('slider',{name:'Швидкість',exact:true}).focus();await page.keyboard.press('End');
 await page.getByRole('slider',{name:'Тон',exact:true}).focus();await page.keyboard.press('Home');await page.getByRole('textbox',{name:'Текст для прев’ю'}).fill('Тест моєї історії.');
 await expect(page.locator('.voice-summary')).toContainText('00:40');await page.reload();await page.getByRole('button',{name:/Голос пристрою/}).click();
 await expect(page.getByRole('button',{name:'Обрати голос Олена',exact:true})).toHaveAttribute('aria-pressed','true');await expect(page.getByRole('slider',{name:'Швидкість',exact:true})).toHaveValue('1.5');await expect(page.getByRole('slider',{name:'Тон',exact:true})).toHaveValue('-4');await expect(page.getByRole('textbox',{name:'Текст для прев’ю'})).toHaveValue('Тест моєї історії.');
 const settings=await page.evaluate(()=>JSON.parse(localStorage.getItem('sakyra.studio.projects.v1')!)[0].voice);expect(settings.profile).toBe('olena');expect(settings.rate).toBe(1.5);
});

test('device preview plays real utterances with settings and stops on navigation',async({page})=>{
 await mockSpeech(page);await page.goto('/#voice');await page.getByRole('button',{name:/Голос пристрою/}).click();await page.getByRole('textbox',{name:'Текст для прев’ю'}).fill('Привіт!');
 await page.getByRole('button',{name:'Прослухати Ірина',exact:true}).click();await expect(page.locator('.voice-main-player .voice-wave')).toHaveClass(/is-playing/);
 expect(await page.evaluate(()=>(window as unknown as {speechCalls:unknown[]}).speechCalls)).toEqual([{text:'Привіт!',rate:1,pitch:1.06,lang:'uk-UA'}]);
 await page.getByRole('slider',{name:'Швидкість',exact:true}).focus();await page.keyboard.press('End');await expect(page.locator('.voice-main-player .voice-wave')).not.toHaveClass(/is-playing/);
 await page.getByRole('button',{name:'Прослухати текст',exact:true}).click();await expect(page.locator('.voice-main-player .voice-wave')).toHaveClass(/is-playing/);
 const before=await page.evaluate(()=>(window as unknown as {speechCancels:number}).speechCancels);await page.getByRole('link',{name:'Далі: Відео'}).click();await expect(page).toHaveURL(/#video$/);await expect.poll(()=>page.evaluate(()=>(window as unknown as {speechCancels:number}).speechCancels)).toBeGreaterThan(before);
});

test('missing device voices and generation remain honest without fake playback',async({page})=>{
 await page.addInitScript(()=>{Object.defineProperty(window,'speechSynthesis',{configurable:true,value:{getVoices:()=>[],addEventListener:()=>{},removeEventListener:()=>{},cancel:()=>{}}});});
 await page.goto('/#voice');await page.getByRole('button',{name:/Голос пристрою/}).click();await expect(page.getByRole('button',{name:'Прослухати текст',exact:true})).toBeDisabled();await expect(page.locator('.voice-availability')).toBeVisible();await expect(page.locator('.voice-summary')).toContainText('—');
 await page.getByRole('button',{name:/Згенерувати озвучку/}).click();await expect(page.getByRole('dialog')).toContainText('Для AI-озвучення та створення MP3 перемкнися на Fish Audio');await page.getByRole('dialog').getByRole('button',{name:'Закрити',exact:true}).last().click();
 await expect(page.locator('.voice-wave.is-playing')).toHaveCount(0);
});

for(const width of [1440,1280,390,320])test(`voice layout at ${width}px`,async({page})=>{
 await page.setViewportSize({width,height:width>800?900:844});await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/#voice');await page.getByRole('button',{name:/Голос пристрою/}).click();await page.evaluate(async()=>{await document.fonts.ready;const img=new Image();img.src='/scene/voice-avatars.png';await img.decode();});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(width);await expect(page.locator('.voice-card')).toHaveCount(6);await page.screenshot({path:`/workspace/scratch/sakyra/voice-${width}.png`});
 await page.getByRole('button',{name:'Обрати голос Софія',exact:true}).click();await expect(page.locator('.voice-selected-person h2')).toHaveText('Софія');
 await page.getByRole('link',{name:'Далі: Відео'}).click();await expect(page).toHaveURL(/#video$/);
});
