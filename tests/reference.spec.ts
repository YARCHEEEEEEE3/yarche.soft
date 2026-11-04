import {test,expect} from '@playwright/test';

const ready=async(page:import('@playwright/test').Page)=>{
  await page.goto('/');await expect(page.getByRole('button',{name:'Відкрити студію'})).toBeEnabled();await expect(page.locator('.living-scene')).toHaveAttribute('data-renderer',/webgl|canvas2d/);
};

test('clean artwork and actual vector button preserve the reference composition',async({page})=>{
  await page.setViewportSize({width:1672,height:941});await page.emulateMedia({reducedMotion:'reduce'});await ready(page);
  const image=page.locator('.reference-art'),button=page.getByRole('button',{name:'Відкрити студію'});
  await expect(image).toHaveAttribute('src','/scene/living-background.png');
  expect(await image.evaluate((img:HTMLImageElement)=>[img.naturalWidth,img.naturalHeight])).toEqual([1672,941]);
  await expect(button).toHaveText('Відкрити студію');await expect(button.locator('svg')).toHaveCount(2);await expect(page.getByRole('slider')).toHaveCount(0);
  const box=(await button.boundingBox())!;expect(box.x).toBeCloseTo(624,0);expect(box.y).toBeCloseTo(466.5,0);
  await page.screenshot({path:'/workspace/scratch/sakyra/SAKYRA-v6-desktop.png'});
});

test('title opens setup with mouse and keyboard, and browser history works',async({page})=>{
  await ready(page);const button=page.getByRole('button',{name:'Відкрити студію'});
  await button.click();await expect(page).toHaveURL(/#setup$/);await expect(page.getByRole('heading',{name:'Налаштуй свою студію'})).toBeVisible();
  await page.goBack();await expect(button).toBeVisible();await page.goForward();await expect(page.getByLabel('Назва студії')).toBeVisible();
  await page.getByRole('link',{name:'На титульну'}).click();await expect(button).toBeEnabled();
  await button.focus();await page.keyboard.press('Enter');await expect(page).toHaveURL(/#setup$/);

});

test('water and petals animate, then freeze in hidden tabs and reduced motion',async({page})=>{
  await ready(page);
  const snapshot=()=>page.locator('canvas').evaluateAll(cs=>cs.map(c=>(c as HTMLCanvasElement).toDataURL()));
  await page.waitForTimeout(300);const before=await snapshot();await page.waitForTimeout(400);const after=await snapshot();
  const mode=await page.locator('.living-scene').getAttribute('data-renderer');
  expect(after[mode==='webgl'?0:1]).not.toBe(before[mode==='webgl'?0:1]);expect(after[2]).not.toBe(before[2]);
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));});
  const frozen=await snapshot();await page.waitForTimeout(250);expect(await snapshot()).toEqual(frozen);
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:false});document.dispatchEvent(new Event('visibilitychange'));});
  await page.emulateMedia({reducedMotion:'reduce'});await page.waitForTimeout(150);const reduced=await snapshot();await page.waitForTimeout(200);expect(await snapshot()).toEqual(reduced);
  expect(await page.locator('.reference-effects').evaluate((c:HTMLCanvasElement)=>c.getContext('2d')!.getImageData(0,0,c.width,c.height).data.some(v=>v!==0))).toBe(false);
});

test('water fallback works when WebGL is unavailable',async({page})=>{
  await page.addInitScript(()=>{const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type:string,...args:unknown[]){if(type==='webgl')return null;return original.apply(this,[type,...args] as Parameters<typeof original>);} as typeof original;});
  await ready(page);await expect(page.locator('.living-scene')).toHaveAttribute('data-renderer','canvas2d');
  const snapshot=()=>page.locator('.living-scene canvas').nth(1).evaluate((c:HTMLCanvasElement)=>c.toDataURL());
  const before=await snapshot();await page.waitForTimeout(300);expect(await snapshot()).not.toBe(before);
});

test('phone gets full-height portrait artwork and a working studio button',async({page})=>{
  await page.setViewportSize({width:390,height:844});await ready(page);
  const image=page.locator('.reference-art'),button=page.getByRole('button',{name:'Відкрити студію'});
  await expect(image).toBeInViewport({ratio:1});await expect(button).toBeInViewport({ratio:1});
  const box=(await image.boundingBox())!;expect(box.width).toBe(390);expect(box.height).toBe(844);
  expect(await image.evaluate((img:HTMLImageElement)=>img.currentSrc)).toContain('title-mobile.png');
  expect((await button.boundingBox())!.height).toBeGreaterThanOrEqual(50);expect((await button.boundingBox())!.width).toBeGreaterThanOrEqual(245);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(390);
  await button.click();await expect(page.getByRole('heading',{name:'Налаштуй свою студію'})).toBeVisible();
});

test('portrait title fills a small phone and switches artwork on rotation',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});await page.setViewportSize({width:375,height:667});await ready(page);
  const image=page.locator('.reference-art'),button=page.getByRole('button',{name:'Відкрити студію'});
  await expect(button).toBeInViewport({ratio:1});await page.screenshot({path:'/workspace/scratch/sakyra/SAKYRA-v6-mobile.png'});
  await page.setViewportSize({width:844,height:390});
  await expect.poll(()=>image.evaluate((img:HTMLImageElement)=>img.currentSrc)).toContain('living-background.png');
  await expect(button).toBeInViewport({ratio:1});
  await page.setViewportSize({width:390,height:844});
  await expect.poll(()=>image.evaluate((img:HTMLImageElement)=>img.currentSrc)).toContain('title-mobile.png');
  await expect.poll(()=>page.locator('.living-scene canvas').first().evaluate((c:HTMLCanvasElement)=>c.height/c.width)).toBeCloseTo(844/390,2);
  await page.screenshot({path:'/workspace/scratch/sakyra/SAKYRA-v6-iphone.png'});
  await button.click();await expect(page.getByRole('heading',{name:'Налаштуй свою студію'})).toBeVisible();
});
