import {test,expect,type Page} from '@playwright/test';

async function characters(page:Page){
 await page.getByRole('button',{name:'Створити персонажів · демо',exact:true}).click();
 await expect(page.getByRole('button',{name:'Підтвердити персонажів → сцени',exact:true})).toBeVisible();
}
async function scenePlan(page:Page){await characters(page);await page.getByRole('button',{name:'Підтвердити персонажів → сцени',exact:true}).click();await expect(page.getByRole('button',{name:'Підтвердити сцени й створити фото',exact:true})).toBeVisible();}
async function photos(page:Page){await scenePlan(page);await page.getByRole('button',{name:'Підтвердити сцени й створити фото',exact:true}).click();await expect(page.getByRole('button',{name:'Анімувати всі',exact:true})).toBeEnabled();await expect(page.locator('.video-job')).toHaveCount(0);}

test('demo requires both approvals before photos and supports individual and batch animation',async({page})=>{
 await page.goto('/#video');await expect(page.locator('.video-scene-card')).toHaveCount(0);
 await characters(page);await expect(page.locator('.video-character-grid article')).toHaveCount(3);await expect(page.locator('.video-scene-card')).toHaveCount(0);
 await page.getByRole('button',{name:'Підтвердити персонажів → сцени',exact:true}).click();await expect(page.locator('.video-scene-card')).toHaveCount(8);
 await expect(page.locator('.video-photo-state.has-photo')).toHaveCount(0);await expect(page.getByRole('button',{name:'Анімувати всі',exact:true})).toHaveCount(0);
 await page.getByRole('button',{name:'Підтвердити сцени й створити фото',exact:true}).click();await expect(page.locator('.video-photo-state.has-photo')).toHaveCount(8);await expect(page.locator('.video-job')).toHaveCount(0);
 await page.locator('.video-scene-card').first().getByRole('button',{name:'Анімувати кадр',exact:false}).click();await expect(page.locator('.video-photo-state.has-motion')).toHaveCount(1);await expect(page.locator('.video-job')).toHaveCount(0);
 await page.getByRole('checkbox',{name:'Вибрати сцену 2',exact:true}).check();await page.getByRole('checkbox',{name:'Вибрати сцену 3',exact:true}).check();await page.getByRole('button',{name:'Анімувати вибрані (2)',exact:true}).click();await expect(page.locator('.video-photo-state.has-motion')).toHaveCount(3);await expect(page.locator('.video-job')).toHaveCount(0);
 await page.getByRole('button',{name:'Анімувати всі',exact:true}).click();await expect(page.locator('.video-photo-state.has-motion')).toHaveCount(8);await expect(page.locator('.video-notice')).toContainText('Відеофайл не створено');await page.reload();await expect(page.locator('.video-photo-state.has-motion')).toHaveCount(8);
 await expect(page.locator('video')).toHaveCount(0);
});

test('long video counts, short last scene, styles and pagination are real',async({page})=>{
 await page.goto('/#video');await page.getByLabel('Довжина відео',{exact:true}).selectOption('1200');await expect(page.locator('.video-scene-count>strong')).toHaveText('150');
 await page.getByRole('button',{name:/Візуальний стиль/}).click();await expect(page.locator('.video-style-gallery>button')).toHaveCount(6);await page.getByRole('button',{name:/Акварель/}).click();await expect(page.locator('.video-style-picker')).toContainText('Акварель');
 await scenePlan(page);await expect(page.locator('.video-scene-card')).toHaveCount(12);await expect(page.locator('.video-pagination')).toContainText('1 з 13');await page.locator('.video-pagination').getByRole('button',{name:'Далі',exact:true}).click();await expect(page.getByRole('button',{name:'Відкрити сцену 13',exact:true})).toBeVisible();await page.getByRole('combobox',{name:'Сторінка',exact:true}).selectOption('12');await expect(page.locator('.video-scene-card')).toHaveCount(6);await expect(page.getByRole('button',{name:'Відкрити сцену 150',exact:true})).toBeVisible();
 await page.getByLabel('Довжина відео',{exact:true}).selectOption('30');await expect(page.getByRole('dialog')).toContainText('4 сцен');await page.getByRole('button',{name:'Скасувати',exact:true}).click();await expect(page.getByLabel('Довжина відео',{exact:true})).toHaveValue('1200');
 await page.getByLabel('Довжина відео',{exact:true}).selectOption('30');await page.getByRole('button',{name:'Змінити й почати заново',exact:true}).click();await scenePlan(page);await expect(page.locator('.video-scene-card')).toHaveCount(4);await expect(page.locator('.video-frame-duration').last()).toHaveText('00:06');
});

test('editing a finished frame invalidates only that photo and requires approval again',async({page})=>{
 await page.goto('/#video');await photos(page);
 await page.getByRole('button',{name:'Відкрити сцену 1',exact:true}).click();const dialog=page.getByRole('dialog');await dialog.getByLabel('Промпт',{exact:true}).fill('Новий кадр: Клео біля храму.');await dialog.getByLabel('Персонаж',{exact:true}).selectOption('cleo');await dialog.getByLabel('Локація',{exact:true}).selectOption('1');await dialog.getByRole('button',{name:'Зберегти сцену',exact:true}).click();
 await expect(page.getByRole('button',{name:'Підтвердити сцени й створити фото',exact:true})).toBeVisible();await expect(page.locator('.video-photo-state.has-photo')).toHaveCount(7);await expect(page.locator('.video-scene-card').first()).toContainText('Клео');
 await page.getByRole('button',{name:'Підтвердити сцени й створити фото',exact:true}).click();await expect(page.locator('.video-photo-state.has-photo')).toHaveCount(8);
 await page.reload();await expect(page.locator('.video-scene-card').first()).toContainText('Новий кадр: Клео біля храму.');
});

test('stopped generation resumes and settings stay separate between projects',async({page})=>{
 await page.addInitScript(()=>{if(!localStorage.getItem('sakyra.studio.projects.v1'))localStorage.setItem('sakyra.studio.projects.v1',JSON.stringify(['one','two'].map(id=>({id,name:id,idea:'',script:'Римська історія.',format:'16:9',cover:0,createdAt:'2026-11-05',updatedAt:'2026-11-05'}))));});
 await page.goto('/#video');await page.getByLabel('Довжина відео',{exact:true}).selectOption('1200');await scenePlan(page);await page.getByRole('button',{name:'Підтвердити сцени й створити фото',exact:true}).click();await expect(page.locator('.video-summary')).not.toContainText('Фото готові: 0');await page.getByRole('button',{name:'Зупинити демо',exact:true}).click();await page.reload();await expect(page.getByRole('button',{name:'Продовжити підготовку фото',exact:true})).toBeEnabled();
 await page.getByLabel('Вибери проєкт').selectOption('two');await expect(page.getByRole('button',{name:'Створити персонажів · демо',exact:true})).toBeVisible();await expect(page.getByLabel('Довжина відео',{exact:true})).toHaveValue('60');
 await page.getByLabel('Вибери проєкт').selectOption('one');await page.getByRole('button',{name:'Продовжити підготовку фото',exact:true}).click();await expect(page.locator('.video-job')).toHaveCount(0);await expect(page.locator('.video-summary')).toContainText('Фото готові: 150');
});

for(const width of [1440,390,320])test(`video workflow and scene editor at ${width}px`,async({page})=>{
 await page.setViewportSize({width,height:width>800?1000:844});await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/#video');await page.getByLabel('Довжина відео',{exact:true}).selectOption('30');await characters(page);
 await page.evaluate(async()=>{await document.fonts.ready;const img=new Image();img.src='/scene/video-characters.png';await img.decode();});await page.screenshot({path:`/workspace/scratch/sakyra/video-characters-${width}.png`});
 await page.getByRole('button',{name:'Підтвердити персонажів → сцени',exact:true}).click();await expect(page.locator('.video-scene-card')).toHaveCount(4);await page.getByRole('button',{name:'Підтвердити сцени й створити фото',exact:true}).click();await expect(page.locator('.video-job')).toHaveCount(0);await page.evaluate(async()=>{const img=new Image();img.src='/scene/video-scenes.png';await img.decode();});
 await page.locator('.video-gallery-toolbar').scrollIntoViewIfNeeded();await page.screenshot({path:`/workspace/scratch/sakyra/video-scenes-${width}.png`});expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(width);expect(await page.locator('.video-config').evaluate(el=>el.scrollWidth<=el.clientWidth+1)).toBe(true);
 await page.getByRole('button',{name:'Відкрити сцену 1',exact:true}).click();await expect(page.getByRole('dialog')).toBeVisible();await page.screenshot({path:`/workspace/scratch/sakyra/video-editor-${width}.png`});
 await page.getByRole('dialog').getByRole('button',{name:'Скасувати',exact:true}).click();await page.getByRole('button',{name:/Візуальний стиль/}).click();await page.screenshot({path:`/workspace/scratch/sakyra/video-styles-${width}.png`});await page.getByRole('button',{name:'Закрити',exact:true}).click();
});
