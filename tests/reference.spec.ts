import {test,expect} from '@playwright/test';

const ready=async(page:import('@playwright/test').Page)=>{
  await page.goto('/#login');await expect(page.getByRole('button',{name:'Увійти з Google'})).toBeEnabled();await expect(page.locator('.living-scene')).toHaveAttribute('data-renderer',/webgl|canvas2d/);
};

test('clean artwork and actual vector button preserve the reference composition',async({page})=>{
  await page.setViewportSize({width:1672,height:941});await page.emulateMedia({reducedMotion:'reduce'});await ready(page);
  const image=page.locator('.reference-art'),button=page.getByRole('button',{name:'Увійти з Google'});
  await expect(image).toHaveAttribute('src','/scene/living-background.png');
  expect(await image.evaluate((img:HTMLImageElement)=>[img.naturalWidth,img.naturalHeight])).toEqual([1672,941]);
  await expect(button).toHaveText('Увійти з Google');await expect(button.locator('svg')).toHaveCount(2);await expect(page.getByRole('slider')).toHaveCount(0);
  const box=(await button.boundingBox())!;expect(box.x).toBeCloseTo(624,0);expect(box.y).toBeCloseTo(466.5,0);
  await page.screenshot({path:'/workspace/scratch/sakyra/SAKYRA-v4-desktop.png'});
});

test('Google button supports mouse and keyboard without pretending to authenticate',async({page})=>{
  await ready(page);const button=page.getByRole('button',{name:'Увійти з Google'});
  await button.click();await expect(page.getByRole('status')).toContainText('ще не підключено');
  await page.reload();await expect(button).toBeEnabled();await page.keyboard.press('Tab');await expect(button).toBeFocused();await page.keyboard.press('Enter');
  await expect(page.getByRole('status')).toContainText('ще не підключено');await expect(page.locator('input')).toHaveCount(0);
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

test('phone keeps the artwork and a legible touch button',async({page})=>{
  await page.setViewportSize({width:390,height:844});await ready(page);
  const image=page.locator('.reference-art'),button=page.getByRole('button',{name:'Увійти з Google'});
  await expect(image).toBeInViewport({ratio:1});await expect(button).toBeInViewport({ratio:1});
  const box=(await image.boundingBox())!;expect(box.width/box.height).toBeCloseTo(1672/941,3);
  expect((await button.boundingBox())!.height).toBeGreaterThanOrEqual(50);expect((await button.boundingBox())!.width).toBeGreaterThanOrEqual(245);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(390);
  await button.click();await expect(page.getByRole('status')).toContainText('ще не підключено');
});
