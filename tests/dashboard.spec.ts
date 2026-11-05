import {test,expect} from '@playwright/test';

test('dashboard resembles the reference and separates examples from real projects',async({page})=>{
 await page.setViewportSize({width:1280,height:720});await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/#studio');
 await expect(page.getByRole('heading',{name:'Твоя студія готова.'})).toBeVisible();await expect(page.locator('.project-card')).toHaveCount(3);await expect(page.locator('.project-state').first()).toHaveText('Приклад');await expect(page.locator('.studio-overview dd').first()).toHaveText('0');
 await page.evaluate(async()=>{await document.fonts.ready;await Promise.all(['/scene/dashboard-room.png','/scene/project-covers.png'].map(src=>{const img=new Image();img.src=src;return img.decode();}));});
 await page.screenshot({path:'/workspace/scratch/sakyra/SAKYRA-v7-desktop.png'});
});

test('create, autosave a script, export JSON, and delete a real project',async({page})=>{
 await page.goto('/#studio');await page.getByRole('button',{name:'Новий проєкт'}).click();const dialog=page.getByRole('dialog');
 await dialog.getByLabel('Назва проєкту').fill('Мій фільм');await dialog.getByLabel('Ідея / короткий опис').fill('Історія про сакуру');await dialog.getByRole('button',{name:'Створити проєкт',exact:true}).click();
 await expect(dialog).not.toBeVisible();await expect(page.locator('.studio-overview dd').first()).toHaveText('1');await expect(page.getByRole('button',{name:'Відкрити Мій фільм',exact:true})).toBeVisible();
 await page.goto('/#scripts');await page.getByLabel('Текст сценарію').fill('Сцена 1. Світанок над Японією.');await page.reload();await expect(page.getByLabel('Текст сценарію')).toHaveValue('Сцена 1. Світанок над Японією.');
 await page.goto('/#export');const downloadPromise=page.waitForEvent('download');await page.getByRole('button',{name:'Завантажити проєкт (.json)'}).click();const download=await downloadPromise;expect(download.suggestedFilename()).toMatch(/\.json$/);
 const stream=await download.createReadStream();let text='';for await(const chunk of stream!)text+=chunk;expect(JSON.parse(text).project.script).toBe('Сцена 1. Світанок над Японією.');
 await page.goto('/#projects');await page.getByRole('button',{name:'Дії з проєктом Мій фільм'}).click();await page.getByRole('button',{name:'Видалити',exact:true}).click();await page.getByRole('dialog').getByRole('button',{name:'Видалити',exact:true}).click();await page.reload();await expect(page.getByRole('button',{name:'Відкрити Мій фільм',exact:true})).toHaveCount(0);
});

test('example copy creates a draft and dialog supports validation and Escape',async({page})=>{
 await page.goto('/#studio');await page.getByRole('button',{name:'Відкрити Ancient Japan',exact:true}).click();await expect(page.getByText('Це демонстраційна картка.',{exact:false})).toBeVisible();
 await page.getByRole('dialog').getByLabel('Назва проєкту').fill(' ');await page.getByRole('button',{name:'Створити копію',exact:true}).click();await expect(page.getByRole('alert')).toContainText('Вкажи назву');
 await page.getByRole('dialog').getByLabel('Назва проєкту').fill('Копія Японії');await page.getByRole('button',{name:'Створити копію',exact:true}).click();await expect(page.locator('.studio-overview dd').first()).toHaveText('1');
 await page.getByRole('button',{name:'Новий проєкт'}).click();await page.keyboard.press('Escape');await expect(page.getByRole('dialog')).not.toBeVisible();await expect(page.getByRole('button',{name:'Новий проєкт'})).toBeFocused();
});

test('iPhone dashboard and navigation drawer remain usable',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/#studio');await expect(page.getByRole('button',{name:'Новий проєкт'})).toBeInViewport();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(390);await page.screenshot({path:'/workspace/scratch/sakyra/SAKYRA-v7-mobile.png',fullPage:true});
 await page.getByRole('button',{name:'Відкрити меню'}).click();await page.getByRole('dialog').getByRole('link',{name:'Озвучка',exact:true}).click();await expect(page.getByRole('heading',{name:'Озвучка'})).toBeVisible();await expect(page.getByRole('dialog')).not.toBeVisible();
 await page.getByRole('button',{name:'Меню студії'}).click();await page.getByRole('link',{name:'Налаштування',exact:true}).filter({visible:true}).click();await expect(page.getByLabel('Назва студії')).toBeVisible();
});

test('storage failure preserves in-memory work and displays a warning',async({page})=>{
 await page.addInitScript(()=>{Storage.prototype.setItem=()=>{throw new Error('blocked')};});await page.goto('/#studio');await page.getByRole('button',{name:'Новий проєкт'}).click();await page.getByRole('dialog').getByLabel('Назва проєкту').fill('Тимчасовий');await page.getByRole('dialog').getByRole('button',{name:'Створити проєкт'}).click();await expect(page.getByRole('alert')).toContainText('не дозволяє');await page.goto('/#scripts');await expect(page.getByLabel('Вибери проєкт')).toContainText('Тимчасовий');
});

test('title, onboarding and dashboard form a connected journey',async({page})=>{
 await page.goto('/');await page.getByRole('button',{name:'Відкрити студію'}).click();await expect(page).toHaveURL(/#setup$/);await page.getByLabel('Назва студії').fill('SAKYRA_User');await page.getByRole('button',{name:'Увійти в студію'}).click();await expect(page).toHaveURL(/#studio$/);await expect(page.getByRole('button',{name:'Меню студії'})).toContainText('SAKYRA_User');
 await page.goto('/#login');await page.getByRole('button',{name:'Відкрити студію'}).click();await expect(page).toHaveURL(/#studio$/);
});
