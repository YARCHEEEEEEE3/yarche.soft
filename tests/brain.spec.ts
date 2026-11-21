import {expect,test} from '@playwright/test';

test('video prepares scenes only after style selection and keeps technical output hidden',async({page})=>{
 await page.setViewportSize({width:320,height:844});
 const script='Акі йде в сад.';
 let requests=0;
 await page.route('**/api/openai/plan',async route=>{
  requests++;
  expect(route.request().postDataJSON()).toEqual({script,language:'uk',shotDurationSeconds:6,style:'watercolor',format:'16:9'});
  await route.fulfill({json:{
   characters:[{name:'Акі',description:'Технічний опис героїні'}],
   locations:[{name:'Сад',description:'Технічний опис локації'}],
   shots:[{title:'Прогулянка в саду',description:'Технічний промпт кадру',durationSeconds:6}],
  }});
 });
 await page.goto('/#scripts');
 const editor=page.getByLabel('Текст сценарію');
 await editor.fill(script);
 await expect(page.getByRole('button',{name:'Розібрати сценарій'})).toHaveCount(0);
 await page.getByRole('button',{name:'Далі: Озвучка'}).click();
 await expect(page).toHaveURL(/#voice$/);
 await page.getByRole('link',{name:'Далі: Відео'}).click();
 const prepare=page.getByRole('button',{name:'Підготувати сцени'});
 await expect(prepare).toBeDisabled();
 await page.getByLabel('Секунд на кадр').selectOption('6');
 await page.getByRole('button',{name:/Візуальний стиль/}).click();
 await page.getByRole('button',{name:/Акварель/}).click();
 expect(requests).toBe(0);
 await prepare.click();
 await expect(page.getByText('Сцени готові')).toBeVisible();
 const gallery=page.getByRole('region',{name:'Сцени твоєї історії'});
 await expect(gallery).toContainText('Прогулянка в саду');
 await expect(gallery).toContainText('00:06');
 await expect(page.getByText(/Технічний/)).toHaveCount(0);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(320);
 await page.reload();
 await expect(gallery).toContainText('Прогулянка в саду');
 await expect(page.getByLabel('Секунд на кадр')).toHaveValue('6');
 expect(requests).toBe(1);
 await page.goto('/#scripts');
 await editor.fill('Змінений сценарій');
 await page.goto('/#video');
 await expect(gallery).toHaveCount(0);
 expect(requests).toBe(1);
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
