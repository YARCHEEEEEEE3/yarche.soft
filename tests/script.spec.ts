import {test,expect} from '@playwright/test';

test('script drafts autosave, retain selection and clear only after confirmation',async({page})=>{
 await page.goto('/#scripts');
 const editor=page.getByRole('textbox',{name:'Текст сценарію'});
 await expect(page.getByRole('button',{name:'Далі: Озвучка'})).toBeDisabled();
 await editor.fill('Привіт, світ!');
 await expect(page.locator('.script-counts')).toContainText('Слів: 2');
 await page.reload();await expect(editor).toHaveValue('Привіт, світ!');
 const original=await page.getByLabel('Вибери проєкт').inputValue();
 await page.getByRole('button',{name:'Створити новий',exact:true}).click();await expect(editor).toHaveValue('');
 await editor.fill('Друга історія');
 await page.getByLabel('Вибери проєкт').selectOption(original);await page.reload();await expect(editor).toHaveValue('Привіт, світ!');
 await page.getByRole('button',{name:'Очистити сценарій',exact:true}).click();await page.getByRole('button',{name:'Скасувати',exact:true}).click();await expect(editor).toHaveValue('Привіт, світ!');
 await page.getByRole('button',{name:'Очистити сценарій',exact:true}).click();await page.getByRole('dialog').getByRole('button',{name:'Очистити сценарій',exact:true}).click();await expect(editor).toHaveValue('');
 await page.getByLabel('Вибери проєкт').selectOption({label:'Новий сценарій 2'});await expect(editor).toHaveValue('Друга історія');
 await page.getByRole('button',{name:'Далі: Озвучка'}).click();await expect(page).toHaveURL(/#voice$/);
});

test('UTF-8 import preserves existing drafts and rejects invalid or oversized input',async({page})=>{
 await page.goto('/#scripts');const editor=page.getByLabel('Текст сценарію');await editor.fill('Збережена історія');
 const original=await page.getByLabel('Вибери проєкт').inputValue();const input=page.locator('input[type=file]');
 await input.setInputFiles({name:'Японія.txt',mimeType:'text/plain',buffer:Buffer.from('Сцена 1. Сакура.\r\nСцена 2. Море.')});
 await expect(editor).toHaveValue('Сцена 1. Сакура.\nСцена 2. Море.');
 await input.setInputFiles({name:'bad.txt',mimeType:'text/plain',buffer:Buffer.from([0xff,0xfe,0x41])});await expect(page.getByRole('alert')).toContainText('UTF-8');
 await input.setInputFiles({name:'long.txt',mimeType:'text/plain',buffer:Buffer.from('я'.repeat(20001))});await expect(page.getByRole('alert')).toContainText('завеликий');
 await expect(editor).toHaveValue('Сцена 1. Сакура.\nСцена 2. Море.');
 await page.getByLabel('Вибери проєкт').selectOption(original);await expect(editor).toHaveValue('Збережена історія');
});

test('template is explicitly a test and creates a separate editable project',async({page})=>{
 await page.goto('/#scripts');const editor=page.getByLabel('Текст сценарію');await editor.fill('Мій оригінал');
 await page.getByRole('button',{name:/Згенерувати сценарій/}).click();await expect(page.getByRole('dialog')).toContainText('AI-генерацію ще не підключено');
 await page.getByLabel('Тема історії').fill('Весняна Японія');await page.getByRole('button',{name:'Створити з шаблону'}).click();
 await expect(editor).toHaveValue(/Весняна Японія[\s\S]*СЦЕНА 4/);
 await page.getByLabel('Вибери проєкт').selectOption({label:'Новий сценарій 1'});await expect(editor).toHaveValue('Мій оригінал');
});

for(const width of [1440,390,320])test(`script layout and editing work at ${width}px`,async({page})=>{
 await page.setViewportSize({width,height:width===1440?900:844});await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/#scripts');
 await page.evaluate(()=>document.fonts.ready);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(width);
 await page.screenshot({path:`/workspace/scratch/sakyra/script-${width}.png`,fullPage:true});
 const editor=page.getByLabel('Текст сценарію');await editor.fill('Історія сакури');await expect(editor).toBeFocused();
 if(width<851)expect(await editor.evaluate(el=>parseFloat(getComputedStyle(el).fontSize))).toBeGreaterThanOrEqual(16);
 await page.getByRole('button',{name:'Далі: Озвучка'}).click();await expect(page).toHaveURL(/#voice$/);
});
