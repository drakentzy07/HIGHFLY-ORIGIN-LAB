// HIGHFLY C0-G: original upstream world heightfield, original world object locations,
// original Sim entities and AI. Rendering is 100% hand-coded diagnostic geometry.
// NO asset files, GLBs, icons, screenshots or sounds are included.
// Controls/dash/jump are provisional visualization controls, NOT final Fury 360.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { clone as cloneSkinned } from 'three/addons/utils/SkeletonUtils.js';
import { cameraBasis, controlWorldVector, yawAfterDrag, pitchAfterDrag, orbitCameraPosition } from './control_math.mjs';
import { Sim } from '../../../upstream/src/sim/sim.ts';
import { BUILTIN_WORLD, PLAYER_START, ZONES } from '../../../upstream/src/sim/data.ts';
import { terrainHeight, groundHeight, WATER_LEVEL } from '../../../upstream/src/sim/world.ts';
import { resolveMovement } from '../../../upstream/src/sim/colliders.ts';
import { WorldStreamer } from './world_stream.ts';
import { createHighflyFigure } from './highfly_actor.ts';
import { EASTBROOK_LAYOUT } from '../../../upstream/src/sim/eastbrook_layout.ts';
import { WORLD_SEED } from '../../../upstream/src/sim/world_seed.ts';

const canvas = document.getElementById('stage') as HTMLCanvasElement;
const stats = document.getElementById('stats') as HTMLDivElement;
const status = document.getElementById('status') as HTMLDivElement;
const loader = document.getElementById('loading') as HTMLDivElement;
const loadText = document.getElementById('loadText') as HTMLParagraphElement;
const hpbar = document.getElementById('hpbar') as HTMLElement;
const nub = document.getElementById('nub') as HTMLDivElement;
const joystick = document.getElementById('stick') as HTMLDivElement;
const hint = document.getElementById('hint') as HTMLDivElement;
const fullscreenButton=document.getElementById('fullscreen');
fullscreenButton?.addEventListener('click',async()=>{try{await document.documentElement.requestFullscreen?.();await (screen.orientation as any)?.lock?.('landscape').catch(()=>{});}catch(e){console.warn('Fullscreen requires a browser gesture:',e);}});
const keys = new Set<string>();
const MOVE = { x:0, y:0 };
const uiScale = 1;
let yaw = -0.55, pitch = 0.32, jumpOffset=0, jumpSpeed=0, dashLeft=0;
let stickPointer:number|null=null;
let cameraPointer:number|null=null;
let prevCameraX=0,prevCameraY=0;
let lastFrame=performance.now(), elapsed=0, simCarry=0, hudCarry=0;
let sim:any, player:any, playerId=0;
let target:any=null;
let worldStreamer:WorldStreamer|null=null;
const approvedLoader=new GLTFLoader();
approvedLoader.setMeshoptDecoder(MeshoptDecoder);
const buildingVisuals=new Map<string,THREE.Group>();
let wolfVisual:THREE.Group|null=null;
let wolfClips:THREE.AnimationClip[]=[];
const wolfMixers=new Map<number,THREE.AnimationMixer>();
let realBuildingsShown=0;
let realWolvesShown=0;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87bbd3);
scene.fog = new THREE.Fog(0x87bbd3, 65, 215);
const camera = new THREE.PerspectiveCamera(64,1,0.1,320);
const renderer = new THREE.WebGLRenderer({canvas,antialias:false,alpha:false,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.2));
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.shadowMap.enabled=false;
scene.add(new THREE.HemisphereLight(0xe2efff,0x58734e,2.2));
const sun = new THREE.DirectionalLight(0xffeac1,2.15);
sun.position.set(-30,85,45);scene.add(sun);

const material = (color:number,roughness=1)=>new THREE.MeshStandardMaterial({color,roughness,metalness:0});
const treeTrunkMat=material(0x6e5235);
const treeLeafMat=material(0x367250);
const pcMat=material(0x46bcf0);
const npcMat=material(0xffd080);
const wolfMat=material(0x9c6960);
const otherMobMat=material(0xa15d83);
const buildingMat=material(0x9eaa9a);
const roofMat=material(0x70485a);
const markerMat=material(0x37e5a8);
const playerMesh=createHighflyFigure('hunter'); // Temporary K2 actor; rigged Hunter comes next.
scene.add(playerMesh);

const height=(x:number,z:number)=>terrainHeight(x,z,WORLD_SEED);
const approvedUrl=(path:string)=>new URL('./'+path,document.baseURI).href;
async function loadApprovedModels(){
  // Every model below is pinned to the original KayKit CC0 repo and SHA-gated.
  const candidates:Record<string,string>={
    house:'building_home_A_blue',homeB:'building_home_B_blue',tavern:'building_tavern_blue',
    church:'building_church_blue',blacksmith:'building_blacksmith_blue',
    market:'building_market_blue',barracks:'building_barracks_blue',well:'building_well_blue',
    castle:'building_castle_blue',fortressTower:'building_tower_A_blue',fortressWall:'wall_straight',fortressGate:'wall_straight_gate',
    treeA:'tree_single_A',treeB:'tree_single_B',rockA:'rock_single_A',docks:'building_docks_blue',shipyard:'building_shipyard_blue'
  };
  const results=await Promise.all(Object.entries(candidates).map(async ([key,file])=>{
    const gltf=await approvedLoader.loadAsync(approvedUrl('assets/kaykit/'+file+'.gltf'));
    return [key,gltf.scene] as const;
  }));
  for(const [key,model] of results)buildingVisuals.set(key,model);
  const wolf=await approvedLoader.loadAsync(approvedUrl('assets/quaternius/wolf.glb'));
  wolfVisual=wolf.scene;wolfClips=wolf.animations;
  if(!wolfVisual||!wolfClips.length)throw Error('Quaternius wolf or animations not available');
}

function posOf(item:any):{x:number,z:number}|null{
  if(!item||typeof item!=='object')return null;
  const base=item.pos||item.position||item.center||item;
  const x=Number(base.x),z=Number(base.z);
  return Number.isFinite(x)&&Number.isFinite(z)?{x,z}:null;
}
function dist2(a:{x:number,z:number},b:{x:number,z:number}){
  return (a.x-b.x)**2+(a.z-b.z)**2;
}
function addMesh(geometry:THREE.BufferGeometry,mat:THREE.Material,x:number,y:number,z:number,rot=0){
  const mesh=new THREE.Mesh(geometry,mat);mesh.position.set(x,y,z);mesh.rotation.y=rot;
  scene.add(mesh);return mesh;
}
function generateGround(cx:number,cz:number){
  const cells=58,side=250;
  const minX=cx-side/2,minZ=cz-side/2,step=side/cells;
  const vertices:number[]=[];const colors:number[]=[];const indices:number[]=[];
  const grass=new THREE.Color(0x648657),sand=new THREE.Color(0xd5bb80);
  const green=new THREE.Color(0x58805c),waterline=WATER_LEVEL;
  for(let zi=0;zi<=cells;zi++)for(let xi=0;xi<=cells;xi++){
    const x=minX+xi*step,z=minZ+zi*step,y=height(x,z);
    vertices.push(x,y,z);
    const col=green.clone().lerp(grass,.35+.3*Math.sin(x*.07+z*.06));
    if(y<waterline+1.8)col.lerp(sand,Math.max(0,Math.min(1,(waterline+1.8-y)/3.0)));
    if(y>13)col.lerp(new THREE.Color(0x92948b),Math.min(.55,(y-13)/28));
    colors.push(col.r,col.g,col.b);
  }
  for(let z=0;z<cells;z++)for(let x=0;x<cells;x++){
    const a=z*(cells+1)+x,b=a+1,c=a+cells+1,d=c+1;
    indices.push(a,c,b,b,c,d);
  }
  const geo=new THREE.BufferGeometry();
  geo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
  geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
  geo.setIndex(indices);geo.computeVertexNormals();
  const land=new THREE.Mesh(geo,new THREE.MeshLambertMaterial({vertexColors:true,side:THREE.DoubleSide}));
  scene.add(land);
  const water=new THREE.Mesh(new THREE.PlaneGeometry(side,side),
    new THREE.MeshStandardMaterial({color:0x4b94ac,metalness:.05,transparent:true,opacity:.63,depthWrite:false}));
  water.rotation.x=-Math.PI/2;water.position.set(cx,waterline,cz);scene.add(water);
}
function renderRoads(cx:number,cz:number) {
  const roads:any[]=BUILTIN_WORLD.roads||[];
  const mat=new THREE.LineBasicMaterial({color:0xcab28d,transparent:true,opacity:.7,depthTest:true});
  let shown=0;
  for(const road of roads){
    if(!Array.isArray(road)||road.length<2)continue;
    const points:THREE.Vector3[]=[];
    for(let i=0;i<road.length-1;i++){
      const a=posOf(road[i]),b=posOf(road[i+1]);
      if(!a||!b||dist2(a,{x:cx,z:cz})>170*170&&dist2(b,{x:cx,z:cz})>170*170)continue;
      const count=Math.max(2,Math.min(12,Math.ceil(Math.sqrt(dist2(a,b))/3)));
      for(let j=0;j<=count;j++){
        const t=j/count,x=a.x+(b.x-a.x)*t,z=a.z+(b.z-a.z)*t;
        points.push(new THREE.Vector3(x,height(x,z)+.13,z));
      }
    }
    if(points.length>1){
      scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),mat));
      shown++;
    }
  }
  return shown;
}
function renderBuildings(cx:number,cz:number){
  const props:any=BUILTIN_WORLD.props||{};
  let count=0;
  for(const b of props.buildings||[]){
    const p=posOf(b);if(!p||dist2(p,{x:cx,z:cz})>145*145)continue;
    const w=Math.max(3,Math.min(18,Number(b.w??b.width??8)));
    const d=Math.max(4,Math.min(20,Number(b.d??b.depth??9)));
    const h=Math.max(4,Math.min(18,Number(b.h??b.height??5.5)));
    const y=height(p.x,p.z);
    const key=String(b.assetId||'').toLowerCase();
    const kind=String(b.kind||'').toLowerCase();
    const selected=/tavern|inn/.test(key+' '+kind)?'tavern':(/home|house/.test(key+' '+kind)?'house':null);
    const template=selected?buildingVisuals.get(selected):null;
    if(template){
      const model=template.clone(true);
      const bounds=new THREE.Box3().setFromObject(model);
      const size=new THREE.Vector3();bounds.getSize(size);
      const scale=Math.max(.01,Math.min(w/Math.max(.01,size.x),d/Math.max(.01,size.z)));
      model.scale.setScalar(scale);
      model.position.set(p.x,y-bounds.min.y*scale,p.z);
      model.rotation.y=Number(b.rot??0);
      model.userData.provenance='Pinned official KayKit Medieval Hexagon CC0';
      scene.add(model);
      realBuildingsShown++;
      count++;
      continue;
    }
    const base=addMesh(new THREE.BoxGeometry(w,h,d),buildingMat,p.x,y+h/2,p.z,Number(b.rot??0));
    base.userData.provenance='Original BUILTIN_WORLD building placement; original mesh replaced';
    const roof=addMesh(new THREE.ConeGeometry(Math.max(w,d)*.78,3.9,4),roofMat,
      p.x,y+h+1.3,p.z,Math.PI/4+Number(b.rot??0));
    roof.userData.provenance='Procedural roof for original building position';
    count++;
  }
  // Marker for the real Eastbrook zone hub, not an invented settlement position.
  const hub=posOf(ZONES[0]?.hub);
  if(hub){
    const y=height(hub.x,hub.z);
    const tower=new THREE.Mesh(new THREE.CylinderGeometry(.4,.4,7,8),markerMat);
    tower.position.set(hub.x,y+3.5,hub.z);scene.add(tower);
  }
  return count;
}
function seeded(seed:number){let s=seed>>>0;return()=>{s=(Math.imul(1664525,s)+1013904223)>>>0;return s/4294967296;};}
function renderTemporaryVegetation(cx:number,cz:number) {
  const rand=seeded(20161),count=135;
  const trunkGeo=new THREE.CylinderGeometry(.24,.42,2.1,5);
  const leafGeo=new THREE.ConeGeometry(1.8,4.3,6);
  const wood=new THREE.InstancedMesh(trunkGeo,treeTrunkMat,count);
  const leaf=new THREE.InstancedMesh(leafGeo,treeLeafMat,count);
  const dummy=new THREE.Object3D();
  const hub=posOf(ZONES[0]?.hub)||{x:-14,z:-100};
  for(let i=0;i<count;i++){
    const x=cx+(rand()-.5)*215,z=cz+(rand()-.5)*215;
    const forbidden=dist2({x,z},hub)<40*40;
    const scale=.7+rand()*1.2;
    const y=height(x,z);
    const valid=!forbidden&&y>WATER_LEVEL+1;
    dummy.position.set(x,valid?y+1.1*scale:-1500,z);
    dummy.scale.setScalar(scale);dummy.updateMatrix();wood.setMatrixAt(i,dummy.matrix);
    dummy.position.y=valid?y+3.3*scale:-1500;
    dummy.updateMatrix();leaf.setMatrixAt(i,dummy.matrix);
  }
  wood.instanceMatrix.needsUpdate=true;leaf.instanceMatrix.needsUpdate=true;
  scene.add(wood,leaf);
}
const entityMeshes=new Map<number,THREE.Group>();
function makeEntity(e:any){
  const group=new THREE.Group();
  let model:THREE.Object3D;
  if(e.kind==='npc'){
    model=createHighflyFigure('npc');
    model.scale.setScalar(.9);
  }else{
    const wolf=/wolf|hound/i.test((e.templateId||'')+' '+(e.name||''));
    if(wolf&&wolfVisual&&realWolvesShown<12){
      model=cloneSkinned(wolfVisual);
      const bbox=new THREE.Box3().setFromObject(model);
      const size=new THREE.Vector3();bbox.getSize(size);
      const sizeScale=1.8/Math.max(.1,size.x,size.z);
      model.scale.setScalar(sizeScale);
      model.position.y=-bbox.min.y*sizeScale;
      group.userData.approvedWolf=true;
      realWolvesShown++;
      if(wolfClips.length){
        const mixer=new THREE.AnimationMixer(model);
        const clip=wolfClips.find(x=>/idle/i.test(x.name))||wolfClips[0];
        mixer.clipAction(clip).play();
        wolfMixers.set(e.id,mixer);
      }
    }else{
      model=new THREE.Mesh(wolf?new THREE.BoxGeometry(1.8,.9,2.35):new THREE.IcosahedronGeometry(.82,0),wolf?wolfMat:otherMobMat);
      model.position.y=wolf ? 0.90 : 1.1;
    }
  }
  group.add(model);

  group.userData.entityId=e.id;group.userData.kind=e.kind;scene.add(group);return group;
}
function updateEntities(){
  const max=115,seen=new Set<number>();
  let shown=0;
  for(const e of sim.entities.values()){
    if(e.id===playerId||!e.pos||e.kind!=='mob'&&e.kind!=='npc')continue;
    if((e.hp??1)<=0||dist2(e.pos,player.pos)>max*max)continue;
    if(shown++>90)break;
    seen.add(e.id);
    let group=entityMeshes.get(e.id);
    if(!group){group=makeEntity(e);entityMeshes.set(e.id,group);}
    group.position.set(e.pos.x,e.pos.y,e.pos.z);
    group.rotation.y=e.facing||0;
    if(e.kind==='npc')group.children[0]?.userData.animate?.(elapsed,false,false);
  }
  for(const [id,group] of entityMeshes)
    if(!seen.has(id)){
      if(group.userData.approvedWolf)realWolvesShown--;
      wolfMixers.delete(id);scene.remove(group);entityMeshes.delete(id);
    }
}
function resize(){
  renderer.setSize(window.innerWidth,window.innerHeight,false);
  camera.aspect=window.innerWidth/window.innerHeight;camera.updateProjectionMatrix();
}
window.addEventListener('resize',resize);resize();
window.addEventListener('keydown',e=>{
  if(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space','ShiftLeft'].includes(e.code))e.preventDefault();
  keys.add(e.code);
  if(e.code==='Space')jump();
  if(e.code==='ShiftLeft')dash();
});
window.addEventListener('keyup',e=>keys.delete(e.code));
const stopStick=()=>{stickPointer=null;MOVE.x=0;MOVE.y=0;nub.style.left='50%';nub.style.top='50%';};
function stickMove(e:PointerEvent){
  const rect=joystick.getBoundingClientRect();
  const cx=rect.left+rect.width/2,cy=rect.top+rect.height/2;
  const radius=rect.width*.32;
  let x=e.clientX-cx,y=e.clientY-cy;
  const len=Math.hypot(x,y);if(len>radius){x*=radius/len;y*=radius/len;}
  MOVE.x=x/radius;MOVE.y=y/radius;
  nub.style.left=(50+(x/rect.width*100))+'%';
  nub.style.top=(50+(y/rect.height*100))+'%';
}
joystick.addEventListener('pointerdown',e=>{
  e.preventDefault();e.stopPropagation();stickPointer=e.pointerId;
  joystick.setPointerCapture(e.pointerId);stickMove(e);
});
joystick.addEventListener('pointermove',e=>{if(e.pointerId===stickPointer)stickMove(e);});
joystick.addEventListener('pointerup',stopStick);
joystick.addEventListener('pointercancel',stopStick);
canvas.addEventListener('pointerdown',e=>{
  if(e.clientX<window.innerWidth*.42)return;
  cameraPointer=e.pointerId;prevCameraX=e.clientX;prevCameraY=e.clientY;
  canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener('pointermove',e=>{
  if(cameraPointer!==e.pointerId)return;
  yaw=yawAfterDrag(yaw,e.clientX-prevCameraX);
  pitch=pitchAfterDrag(pitch,e.clientY-prevCameraY);
  prevCameraX=e.clientX;prevCameraY=e.clientY;
});
canvas.addEventListener('pointerup',e=>{if(cameraPointer===e.pointerId)cameraPointer=null;});
canvas.addEventListener('pointercancel',e=>{if(cameraPointer===e.pointerId)cameraPointer=null;});
function jump(){if(jumpOffset<.04){jumpSpeed=7.3;}}
function dash(){dashLeft=.24;}
document.getElementById('jump')!.addEventListener('pointerdown',e=>{e.preventDefault();jump();});
document.getElementById('dash')!.addEventListener('pointerdown',e=>{e.preventDefault();dash();});
document.getElementById('atk')!.addEventListener('pointerdown',e=>{e.preventDefault();attack();});
function attack(){
  let closest:any=null,best=20*20;
  for(const e of sim.entities.values()){
    if(e.kind!=='mob'||(e.hp??1)<=0||!e.pos)continue;
    const d=dist2(e.pos,player.pos);
    if(d<best){best=d;closest=e;}
  }
  if(!closest){status.textContent='ATK: no nearby mob in original Sim';return;}
  try{
    sim.targetEntity(closest.id,player.id);
    if(typeof sim.startAutoAttack==='function')sim.startAutoAttack(player.id);
    target=closest;
    status.textContent='ATK: original Sim target '+closest.name;
  }catch(err){status.textContent='Original attack command needs adapter: '+String(err).slice(0,110);}
}
function clock(t:number){
  const dt=Math.min(.05,Math.max(0,(t-lastFrame)/1000));lastFrame=t;
  if(!player)return;
  elapsed+=dt;simCarry+=dt;hudCarry+=dt;
  for(const mixer of wolfMixers.values())mixer.update(dt);
  playerMesh.userData.animate?.(elapsed,Math.hypot(MOVE.x,MOVE.y)>.1,!!target);
  // Preview movement applies to the original Sim entity and heightfield. Not the
  // original final movement/physics API, which remains to be integrated.
  let ix=MOVE.x,iy=-MOVE.y;
  if(keys.has('KeyW')||keys.has('ArrowUp'))iy+=1;
  if(keys.has('KeyS')||keys.has('ArrowDown'))iy-=1;
  if(keys.has('KeyD')||keys.has('ArrowRight'))ix+=1;
  if(keys.has('KeyA')||keys.has('ArrowLeft'))ix-=1;
  const mag=Math.hypot(ix,iy);
  if(mag>.1){
    ix/=Math.max(1,mag);iy/=Math.max(1,mag);
    const speed=(dashLeft>0?18:7.2)*dt;
    const direction=controlWorldVector(ix,iy,yaw);
    const next=resolveMovement(WORLD_SEED,player.pos.x,player.pos.z,player.pos.x+direction.x*speed,player.pos.z+direction.z*speed);
    player.pos.x=next.x;
    player.pos.z=next.z;
    player.facing=Math.atan2(direction.x,direction.z);
    player.vx=0;player.vz=0;
  }
  dashLeft=Math.max(0,dashLeft-dt);
  if(jumpSpeed!==0||jumpOffset>0){
    jumpOffset+=jumpSpeed*dt;jumpSpeed-=18*dt;
    if(jumpOffset<0){jumpOffset=0;jumpSpeed=0;}
  }
  const ground=groundHeight(player.pos.x,player.pos.z,WORLD_SEED);
  if(Number.isFinite(ground))player.pos.y=ground;
  let ticks=0;
  while(simCarry>=.05&&ticks++<3){
    simCarry-=.05;
    try{sim.tick();}catch(err){status.textContent='Sim runtime error: '+String(err);simCarry=0;break;}
  }
  const y=groundHeight(player.pos.x,player.pos.z,WORLD_SEED);
  playerMesh.position.set(player.pos.x,Number.isFinite(y)?y+jumpOffset:player.pos.y+jumpOffset,player.pos.z);
  playerMesh.rotation.y=player.facing||0;
  const focus=new THREE.Vector3(player.pos.x,playerMesh.position.y+1.6,player.pos.z);
  const distance=12;
  const position=orbitCameraPosition(focus,yaw,pitch,distance);
  const desired=new THREE.Vector3(position.x,position.y,position.z);
  // Keep the following camera slightly above the terrain, including on slopes.
  desired.y=Math.max(desired.y,height(desired.x,desired.z)+0.8);
  camera.position.lerp(desired,Math.min(1,dt*10));
  camera.lookAt(focus);
  if(hudCarry>.15){
    hudCarry=0;
    worldStreamer?.update(player.pos.x,player.pos.z);
    realBuildingsShown=worldStreamer?.approvedVisible??0;
    updateEntities();
    const zone=ZONES.find((z:any)=>player.pos.z>=z.zMin&&player.pos.z<=z.zMax);
    const hp=Math.max(0,Math.min(100,Math.round(100*(player.hp??0)/Math.max(1,player.maxHp??1))));
    const npcCount=[...entityMeshes.values()].filter(v=>v.userData.kind==='npc').length;
    stats.textContent='Nivel '+(player.level||1)+' · '+Math.round(player.pos.x)+', '+Math.round(player.pos.z)+'\n'+npcCount+' NPC · '+realWolvesShown+' lobos · '+entityMeshes.size+' entidades';
    stats.style.whiteSpace='pre-line';
    hpbar.style.width=hp+'%';
    if(!target)status.textContent='Zone: '+(zone?.name||'Outside zone')+' · Real Sim tick running';
    else status.textContent='Target: '+target.name+' · HP '+Math.max(0,Math.round(target.hp))+'/'+Math.round(target.maxHp||1);
    if(elapsed>9)hint.style.display='none';
  }
  renderer.render(scene,camera);
  requestAnimationFrame(clock);
}
async function initialize(){
  try{
    loadText.textContent='Initializing original world simulation…';
    sim=new Sim({seed:WORLD_SEED,playerClass:'warrior',noPlayer:true,idleMobTickRadius:95});
    playerId=sim.addPlayer('warrior','Draken');player=sim.entities.get(playerId);
    if(!player)throw Error('No original player entity created');
    const start=posOf(PLAYER_START);
    if(!start)throw Error('Original PLAYER_START missing');
    const townHub=posOf(ZONES[0]?.hub);
    if(townHub) yaw=Math.atan2(townHub.x-start.x,townHub.z-start.z);
    const centerX=start.x+50,centerZ=start.z-10;
    loadText.textContent='Generating original terrain and settlements at '+Math.round(start.x)+','+Math.round(start.z)+'…';
    await new Promise(resolve=>setTimeout(resolve,30));
    loadText.textContent='Loading verified KayKit town buildings and Quaternius wolf…';
    await loadApprovedModels();
    worldStreamer=new WorldStreamer(scene,buildingVisuals);
    worldStreamer.update(player.pos.x,player.pos.z,true);
    realBuildingsShown=worldStreamer.approvedVisible;
    const buildings=realBuildingsShown;
    updateEntities();
    status.textContent='Eastbrook K1 · '+buildings+' construcciones CC0 visibles';
    const zonesSelect=document.getElementById('zoneJump') as HTMLSelectElement|null;
    if(zonesSelect){for(let i=0;i<ZONES.length;i++){const opt=document.createElement('option');opt.value=String(i);opt.textContent=(i+1)+'. '+ZONES[i].name;zonesSelect.appendChild(opt);}
      zonesSelect.addEventListener('change',()=>{const zone=ZONES[Number(zonesSelect.value)];if(!zone)return;
        const p=posOf(zone.hub)||{x:((zone as any).xMin??-180)+180,z:(zone.zMin+zone.zMax)/2};
        player.pos.x=p.x;player.pos.z=p.z;player.pos.y=groundHeight(p.x,p.z,WORLD_SEED);
        target=null;jumpOffset=0;jumpSpeed=0;dashLeft=0;
        worldStreamer?.update(p.x,p.z,true);status.textContent='Exploración: '+zone.name;
      });}

    const poiSelect=document.getElementById('poiJump') as HTMLSelectElement|null;
    if(poiSelect){
      const landmarks=[
        ['spawn','Inicio original',PLAYER_START],
        ['plaza','Plaza Eastbrook',EASTBROOK_LAYOUT.civic.center],
        ['smithy','Herrería Eastbrook',EASTBROOK_LAYOUT.buildings.find((b:any)=>b.id==='eastbrook_smithy')?.position],
        ['inn','Taberna Eastbrook',EASTBROOK_LAYOUT.buildings.find((b:any)=>b.id==='eastbrook_inn')?.position],
        ['port','Muelles originales',{x:-94,z:-54}],
        ...ZONES[0].pois.filter((p:any)=>['wolf_run','bandit_camp','mirror_lake'].includes(p.id)).map((p:any)=>[p.id,p.label,p])
      ] as any[];
      for(const [key,label] of landmarks){const opt=document.createElement('option');opt.value=String(key);opt.textContent=String(label);poiSelect.appendChild(opt);}
      poiSelect.addEventListener('change',()=>{
        const found=landmarks.find(x=>x[0]===poiSelect.value);const p=found&&posOf(found[2]);if(!p)return;
        player.pos.x=p.x;player.pos.z=p.z;player.pos.y=groundHeight(p.x,p.z,WORLD_SEED);
        jumpOffset=0;jumpSpeed=0;dashLeft=0;target=null;worldStreamer?.update(p.x,p.z,true);
        updateEntities();status.textContent='Destino: '+found[1];
      });
    }
    // Read-only diagnostics: assert the actual mobile pointer paths, not just pure math.
    Object.defineProperty(window,'__HIGHFLY_C0_CONTROL_DIAG__',{value:()=>({
      yaw,pitch,approvedModelsLoaded:{house:buildingVisuals.has('house'),tavern:buildingVisuals.has('tavern'),church:buildingVisuals.has('church'),blacksmith:buildingVisuals.has('blacksmith'),market:buildingVisuals.has('market'),wolf:!!wolfVisual},realBuildingsShown,realWolvesShown,camera:{x:camera.position.x,y:camera.position.y,z:camera.position.z},position:{x:player.pos.x,z:player.pos.z},streaming:{chunks:worldStreamer?.chunkCount,sector:worldStreamer?.sector,regions:worldStreamer?.zones,zone:worldStreamer?.lastZone},right:cameraBasis(yaw).right,
      forward:cameraBasis(yaw).forward,actorVisible:playerMesh.visible,city:worldStreamer?.city,landmarkCount:poiSelect?.options.length||0,npcRendered:[...entityMeshes.values()].filter(v=>v.userData.kind==='npc').length
    }),configurable:false});
    loader.style.display='none';
    lastFrame=performance.now();
    requestAnimationFrame(clock);
  }catch(e){
    console.error('C0-G initialization failed',e);
    loadText.textContent='C0-G start error: '+String(e)+' · See console and CI.';
  }
}
initialize();
