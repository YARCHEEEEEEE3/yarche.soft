import {test,expect} from '@playwright/test';

test('reference composition uses real editable controls',async({page})=>{
 await page.setViewportSize({width:1280,height:720});await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/#setup');
 await expect(page.getByRole('heading',{name:'Налаштуй свою студію'})).toBeVisible();await expect(page.getByLabel('Назва студії')).toHaveValue('Моя студія');
 await expect(page.getByRole('radio',{name:'16:9 YouTube'})).toBeChecked();
 await expect(page.getByRole('button',{name:'Увійти в студію'})).toBeInViewport();
 await page.locator('.onboarding-scenery img').evaluate((img:HTMLImageElement)=>img.decode());await page.screenshot({path:'/workspace/scratch/sakyra/SAKYRA-v5-desktop.png'});
});

test('preferences save and survive a reload with a translated interface',async({page})=>{
 await page.goto('/#setup');await page.getByLabel('Назва студії').fill('Yarche Films');await page.getByRole('radio',{name:'9:16 Shorts'}).check();await page.getByLabel('Мова інтерфейсу').selectOption('en');
 await expect(page.getByRole('heading',{name:'Set up your studio'})).toBeVisible();await page.getByRole('button',{name:'Enter the studio'}).click();
 await expect(page.getByRole('heading',{name:'Your studio is ready.'})).toBeFocused();await expect(page.getByRole('button',{name:'Studio menu'})).toContainText('Yarche Films');
 await page.reload();await page.goto('/#settings');await expect(page.getByLabel('Studio name')).toHaveValue('Yarche Films');await expect(page.getByLabel('Interface language')).toHaveValue('en');await expect(page.getByRole('radio',{name:'9:16 Shorts'})).toBeChecked();
});

test('empty name is rejected and storage errors do not lose the form',async({page})=>{
 await page.addInitScript(()=>{Storage.prototype.setItem=()=>{throw new Error('Unavailable')};});await page.goto('/#setup');await page.getByLabel('Назва студії').fill('   ');await page.getByRole('button',{name:'Увійти в студію'}).click();await expect(page.getByRole('alert')).toContainText('Вкажи назву');await expect(page.getByLabel('Назва студії')).toBeFocused();
 await page.getByLabel('Назва студії').fill('Тест');await page.getByRole('button',{name:'Увійти в студію'}).click();await expect(page.getByRole('alert')).toContainText('не дозволяє');await page.goto('/#settings');await expect(page.getByLabel('Назва студії')).toHaveValue('Тест');
});

test('mobile layout stays usable without horizontal overflow',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto('/#setup');await expect(page.getByRole('button',{name:'Увійти в студію'})).toBeInViewport();expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(390);await page.getByRole('radio',{name:'9:16 Shorts'}).check();await page.getByRole('button',{name:'Увійти в студію'}).click();await expect(page.getByRole('heading',{name:'Твоя студія готова.'})).toBeVisible();
 await page.goto('/#settings');await page.screenshot({path:'/workspace/scratch/sakyra/SAKYRA-v5-mobile.png'});
});

test('keyboard selection and reduced-motion are supported',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/#setup');await page.keyboard.press('Tab');await expect(page.getByLabel('Назва студії')).toBeFocused();await page.keyboard.press('Tab');await expect(page.getByLabel('Мова інтерфейсу')).toBeFocused();await page.keyboard.press('Tab');await expect(page.getByRole('radio',{name:'16:9 YouTube'})).toBeFocused();await page.keyboard.press('ArrowRight');await expect(page.getByRole('radio',{name:'9:16 Shorts'})).toBeChecked();await expect(page.locator('.onboarding-atmosphere')).toBeHidden();
});

test('atmosphere animates and pauses when the page is hidden',async({page})=>{
 await page.goto('/#setup');await expect(page.locator('.onboarding-atmosphere')).toBeAttached();
 const snapshot=()=>page.locator('.onboarding-atmosphere').evaluate((c:HTMLCanvasElement)=>c.toDataURL());
 const before=await snapshot();await page.waitForTimeout(250);expect(await snapshot()).not.toBe(before);
 await page.evaluate(()=>{Object.defineProperty(document,'hidden',{value:true,configurable:true});document.dispatchEvent(new Event('visibilitychange'));});
 const paused=await snapshot();await page.waitForTimeout(200);expect(await snapshot()).toBe(paused);await expect(page.locator('html')).toHaveAttribute('data-page-hidden','');
});
