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
  // K2 can stream many original-heightfield sectors plus CC0 fortress models.
  // The loader disappearing is not enough: wait for the first SIM/HUD frame.
  await page.waitForFunction(
    "() => /Nivel|Level/.test(document.querySelector('#stats')?.textContent || '')",
    null,{timeout:60000}
  );
  const stats=await page.locator('#stats').innerText();
  const status=await page.locator('#status').innerText();
  const canvas=await page.locator('#stage').evaluate(el=>({
    width:el.width,height:el.height,webglAvailable:!!el.getContext('webgl2')
  }));
  if(!(/Level|Nivel/.test(stats))||!/Zone|Zona/.test(status))throw Error('HUD not populated: '+JSON.stringify({stats,status}));
  if(!canvas.width||!canvas.height||!canvas.webglAvailable)throw Error('WebGL canvas missing '+JSON.stringify(canvas));
  if(pageErrors.length)throw Error('Browser JS errors: '+JSON.stringify(pageErrors.slice(0,5)));
  // Check the actual pointer event path and world positions, not only math tests.
  const snapshot = () => page.evaluate(() => window.__HIGHFLY_C0_CONTROL_DIAG__?.());
  const initial = await snapshot();
  if(!initial) throw Error('C0-H control diagnostics missing');
  if(!initial.approvedModelsLoaded?.house||!initial.approvedModelsLoaded?.tavern||
     !initial.approvedModelsLoaded?.wolf)
    throw Error('C0-I approved 3D models did not load: '+JSON.stringify(initial.approvedModelsLoaded));
  if(!(initial.realBuildingsShown>0))
    throw Error('C0-I true KayKit 3D buildings were not placed in original Eastbrook map');

  if(initial.streaming?.regions!==15||!(initial.streaming?.chunks>=9))
    throw Error('C0-J world did not stream the original 15-zone map: '+JSON.stringify(initial.streaming));
  if(!initial.actorVisible||initial.landmarkCount<7)
    throw Error('K1 original Hunter visual or navigation markers missing: '+JSON.stringify(initial));
  if(!(initial.city?.wallSegments>=40&&initial.city?.towers===4&&initial.city?.gates===2&&initial.city?.trees>=10))
    throw Error('K2 city overlay did not construct the approved fortress: '+JSON.stringify(initial.city));
  if(!initial.approvedModelsLoaded?.church||!initial.approvedModelsLoaded?.blacksmith||
     !initial.approvedModelsLoaded?.market)
    throw Error('K1 town building types failed to load');
  await page.mouse.move(750,190);
  await page.mouse.down();
  await page.mouse.move(830,215,{steps:4});
  await page.mouse.up();
  const afterCamera=await snapshot();
  if(!(afterCamera.yaw<initial.yaw-0.15))
    throw Error('Camera inversion persists: drag right did not decrease yaw '+JSON.stringify({initial,afterCamera}));
  // Verify real vertical dragging in touch-sized Chromium, without changing yaw.
  await page.mouse.move(740,220);
  await page.mouse.down();
  await page.mouse.move(740,120,{steps:6});
  await page.mouse.up();
  await page.waitForTimeout(220);
  const afterUp=await snapshot();
  if(!(afterUp.pitch < afterCamera.pitch - .25))
    throw Error('Swipe UP did not look UP: '+JSON.stringify({before:afterCamera,afterUp}));
  await page.mouse.move(740,120);
  await page.mouse.down();
  await page.mouse.move(740,275,{steps:7});
  await page.mouse.up();
  await page.waitForTimeout(280);
  const afterDown=await snapshot();
  if(!(afterDown.pitch > afterUp.pitch + .4))
    throw Error('Swipe DOWN did not look DOWN: '+JSON.stringify({afterUp,afterDown}));
  if(Math.abs(afterDown.yaw-afterCamera.yaw)>1e-4)
    throw Error('Vertical swipe wrongly changed horizontal aim');
  if(!(afterDown.camera.y > afterUp.camera.y+1))
    throw Error('Camera elevation did not follow vertical orbit');
  const stickBox=await page.locator('#stick').boundingBox();
  if(!stickBox) throw Error('Touch joystick missing');
  const cx=stickBox.x+stickBox.width/2,cy=stickBox.y+stickBox.height/2;
  await page.mouse.move(cx,cy);
  await page.mouse.down();
  await page.mouse.move(cx+stickBox.width*0.26,cy,{steps:4});
  await page.waitForTimeout(700);
  await page.mouse.up();
  const afterRight=await snapshot();
  const displacement={x:afterRight.position.x-afterCamera.position.x,z:afterRight.position.z-afterCamera.position.z};
  const rightDot=displacement.x*afterCamera.right.x+displacement.z*afterCamera.right.z;
  if(!(rightDot>0.25))
    throw Error('Joystick still mirrored: moving right should project right '+JSON.stringify({displacement,rightDot,afterCamera,afterRight}));
  await page.locator('#atk').click();
  await page.waitForTimeout(400);
  if(pageErrors.length)throw Error('Pointer/attack JS errors: '+JSON.stringify(pageErrors.slice(0,5)));
  // Travel to another authored zone and verify new terrain sectors stream in.
  const targetRegion=await page.locator('#zoneJump option').last().getAttribute('value');
  if(!targetRegion)throw Error('C0-J zone travel options missing');
  await page.locator('#zoneJump').selectOption(targetRegion);
  await page.waitForTimeout(2200);
  const afterTravel=await snapshot();
  if(afterTravel.streaming?.sector===initial.streaming?.sector||afterTravel.streaming?.zone===initial.streaming?.zone)
    throw Error('C0-J map traversal did not change sector and zone: '+JSON.stringify({initial:initial.streaming,afterTravel:afterTravel.streaming}));
  if(pageErrors.length)throw Error('World travel JS errors: '+JSON.stringify(pageErrors.slice(0,5)));
  await mkdir('highfly/reports/c0/browser',{recursive:true});
  await page.screenshot({path:'highfly/reports/c0/browser/landscape.png'});
  const report={passed:true,view:'915x412 mobile landscape',canvas,stats,status,
    approvedModelsLoaded:initial.approvedModelsLoaded,
    realBuildingsShown:initial.realBuildingsShown,
    realWolvesShown:initial.realWolvesShown,
    cameraSwipeRightYawDelta:afterCamera.yaw-initial.yaw,
    swipeUpPitchDelta:afterUp.pitch-afterCamera.pitch,
    swipeDownPitchDelta:afterDown.pitch-afterUp.pitch,
    cameraElevationDifference:afterDown.camera.y-afterUp.camera.y,
    joystickRightScreenProjection:rightDot,
    afterAttack:await page.locator('#status').innerText(),pageErrors};
  await writeFile('highfly/reports/c0/browser/summary.json',JSON.stringify(report,null,2)+'\n');
  console.log('C0-G BROWSER GREEN: '+JSON.stringify(report));
  passed=true;
}finally{
  await browser.close();
}
if(!passed)process.exitCode=1;
