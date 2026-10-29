// C0-G browser verification in a real headless Chromium/Chrome build.
// This ensures a successful esbuild compilation truly boots original Sim in WebGL.
import { chromium } from 'playwright-core';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
let browser;
let startupError;
for(const candidate of [
  {channel:'chrome'},
  {executablePath:'/usr/bin/google-chrome'},
  {executablePath:'/usr/bin/chromium'},
  {executablePath:'/usr/bin/chromium-browser'}
]) {
  try {
    browser=await chromium.launch({
      headless:true,
      ...candidate,
      args:['--no-sandbox','--disable-dev-shm-usage','--enable-webgl',
        '--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']
    });
    console.log('BROWSER READY: '+JSON.stringify(candidate));
    break;
  }catch(e){startupError=String(e);}
}
if(!browser)throw Error('Headless Chrome missing: '+startupError);
let passed=false;
try {
  const page=await browser.newPage({viewport:{width:915,height:412},deviceScaleFactor:1,isMobile:true,hasTouch:true});
  const pageErrors=[];
  page.on('pageerror',e=>pageErrors.push(String(e)));
  page.on('console',m=>{if(m.type()==='error')console.error('BROWSER_CONSOLE:',m.text().slice(0,400));});
  await page.goto('http://127.0.0.1:4173/',{waitUntil:'domcontentloaded',timeout:35000});
  try{
    await page.waitForFunction(
      "() => document.querySelector('#loading')?.style.display === 'none'",
      null,{timeout:90000}
    );
  }catch(e){
    console.error('LOADER TEXT:',await page.locator('#loadText').textContent());
    throw e;
  }
  await page.waitForTimeout(1800);
  const stats=await page.locator('#stats').innerText();
  const status=await page.locator('#status').innerText();
  const canvas=await page.locator('#stage').evaluate(el=>({
    width:el.width,height:el.height,webglAvailable:!!el.getContext('webgl2')
  }));
  if(!stats.includes('Level')||!status.includes('Zone'))throw Error('HUD not populated: '+JSON.stringify({stats,status}));
  if(!canvas.width||!canvas.height||!canvas.webglAvailable)throw Error('WebGL canvas missing '+JSON.stringify(canvas));
  if(pageErrors.length)throw Error('Browser JS errors: '+JSON.stringify(pageErrors.slice(0,5)));
  // Exercise real pointer camera orbit on the right, then attack button.
  await page.mouse.move(750,190);
  await page.mouse.down();
  await page.mouse.move(830,215,{steps:4});
  await page.mouse.up();
  await page.locator('#atk').click();
  await page.waitForTimeout(400);
  if(pageErrors.length)throw Error('Pointer/attack JS errors: '+JSON.stringify(pageErrors.slice(0,5)));
  await mkdir('highfly/reports/c0/browser',{recursive:true});
  await page.screenshot({path:'highfly/reports/c0/browser/landscape.png'});
  const report={passed:true,view:'915x412 mobile landscape',canvas,stats,status,
    afterAttack:await page.locator('#status').innerText(),pageErrors};
  await writeFile('highfly/reports/c0/browser/summary.json',JSON.stringify(report,null,2)+'\n');
  console.log('C0-G BROWSER GREEN: '+JSON.stringify(report));
  passed=true;
}finally{
  await browser.close();
}
if(!passed)process.exitCode=1;
