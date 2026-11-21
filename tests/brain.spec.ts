import {expect,test} from '@playwright/test';

test('mobile plan can be edited, confirmed, restored and invalidated by script changes',async({page})=>{
 await page.setViewportSize({width:320,height:844});
 const script='Акі йде в сад.';
 await page.route('**/api/openai/plan',async route=>{
  expect(route.request().postDataJSON()).toEqual({script,language:'uk',shotDurationSeconds:6});
  await route.fulfill({json:{
   characters:[{name:'Акі',description:'Головна героїня'}],
   locations:[{name:'Сад',description:'Ранкова прогулянка'}],
   shots:[{description:'Акі заходить у сад.',durationSeconds:6}],
  }});
 });
 await page.goto('/#scripts');
 const editor=page.getByLabel('Текст сценарію');
 await editor.fill(script);
 await page.getByLabel('Секунд на кадр').selectOption('6');
 await page.getByRole('button',{name:'Розібрати сценарій'}).click();
 const plan=page.getByRole('region',{name:'План сценарію'});
 await expect(plan.getByText('Чернетка плану')).toBeVisible();
 await plan.getByRole('region',{name:'Персонажі'}).getByLabel('Назва').fill('Акіко');
 await plan.getByLabel('Тривалість (с)').selectOption('4');
 await expect(plan.getByRole('heading',{name:'Кадри · 4 с'})).toBeVisible();
 await plan.getByRole('button',{name:'Підтвердити план'}).click();
 await expect(plan.getByText('План підтверджено')).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(320);
 await page.reload();
 await expect(plan.getByLabel('Секунд на кадр')).toHaveValue('6');
 await expect(plan.getByLabel('Тривалість (с)')).toHaveValue('4');
 await expect(plan.getByRole('region',{name:'Персонажі'}).getByLabel('Назва')).toHaveValue('Акіко');
 await expect(plan.getByText('План підтверджено')).toBeVisible();
 await editor.fill('Змінений сценарій');
 await expect(plan.getByText(/Сценарій змінився/)).toBeVisible();
 await expect(plan.getByRole('button',{name:'Підтвердити план'})).toBeDisabled();
});

test('OpenAI settings send the key to the server and clear the password input',async({page})=>{
 const key='sk-test-key-only-for-playwright';
 await page.route('**/api/openai/key',async route=>{
  if(route.request().method()==='GET')return route.fulfill({json:{configured:false}});
  expect(route.request().method()).toBe('PUT');
  expect(route.request().postDataJSON()).toEqual({key});
  await route.fulfill({json:{configured:true}});
 });
 await page.goto('/#settings');
 const settings=page.getByRole('region',{name:'OpenAI',exact:true});
 const input=settings.locator('input[type=password]');
 await input.fill(key);
 await settings.getByRole('button',{name:'Зберегти ключ'}).click();
 await expect(settings.getByText('Ключ збережено')).toBeVisible();
 await expect(input).toHaveValue('');
 expect(await page.evaluate(value=>JSON.stringify({...localStorage,...sessionStorage}).includes(value),key)).toBe(false);
});
