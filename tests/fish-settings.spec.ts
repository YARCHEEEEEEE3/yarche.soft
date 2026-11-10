import {test,expect} from '@playwright/test';

test('key is verified and cleared, never stored, and can be removed without changing preferences',async({page})=>{
 let configured=false;const submitted:string[]=[];
 await page.route('**/api/fish/key',async route=>{
  if(route.request().method()==='PUT'){submitted.push(route.request().postDataJSON().key);configured=true;}
  if(route.request().method()==='DELETE')configured=false;
  await route.fulfill({json:{configured,model:'s2.1-pro-free',maxText:10000}});
 });
 await page.goto('/#settings');
 const key=page.locator('#fish-api-key');await expect(key).toBeEnabled();await expect(key).toHaveAttribute('type','password');
 await key.fill('fake-browser-secret-key');await page.getByRole('button',{name:'Перевірити й зберегти'}).click();
 await expect(page.getByText('Ключ перевірено та збережено.')).toBeVisible();await expect(key).toHaveValue('');expect(submitted).toEqual(['fake-browser-secret-key']);
 const stored=await page.evaluate(()=>JSON.stringify([Object.entries(localStorage),Object.entries(sessionStorage)]));expect(stored).not.toContain('fake-browser-secret-key');
 await page.reload();await expect(page.getByText('Ключ підключено',{exact:true})).toBeVisible();await expect(key).toHaveValue('');
 await page.getByRole('button',{name:'Видалити ключ',exact:true}).click();await page.getByRole('button',{name:'Так, видалити'}).click();await expect(page.getByText('Ключ видалено.',{exact:true})).toBeVisible();
 await expect(page).toHaveURL(/#settings$/);
});

test('settings show failed verification and unavailable API honestly on mobile',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.route('**/api/fish/key',async route=>{await route.fulfill(route.request().method()==='PUT'?{status:422,json:{code:'FISH_KEY_INVALID'}}:{json:{configured:false}});});
 await page.goto('/#settings');await page.locator('#fish-api-key').fill('fake-invalid-secret');await page.getByRole('button',{name:'Перевірити й зберегти'}).click();
 await expect(page.getByRole('alert')).toContainText('Fish Audio не прийняв ключ');await expect(page.locator('#fish-api-key')).toHaveValue('');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(390);
 await page.route('**/api/fish/key',route=>route.fulfill({status:503,json:{code:'AUTH_NOT_CONFIGURED'}}));
 await page.reload();await expect(page.getByRole('alert')).toContainText('Supabase');await expect(page.locator('#fish-api-key')).toBeDisabled();
});
