// HIGHFLY K5: enlarged waterfront town, aligned visible geometry and collision; upstream remains immutable.
// Model geometry is genuine licensed KayKit, not a proxy cube.
import * as THREE from 'three';
import { EASTBROOK_LAYOUT } from '../../../upstream/src/sim/eastbrook_layout.ts';
import { terrainHeight, waterLevelAt } from '../../../upstream/src/sim/world.ts';
import { WORLD_SEED } from '../../../upstream/src/sim/world_seed.ts';
export interface CityWall {x1:number;z1:number;x2:number;z2:number;radius:number;kind:string}
const height=(x:number,z:number)=>terrainHeight(x,z,WORLD_SEED);
const dry=(x:number,z:number,margin=1.25)=>{const w=waterLevelAt(x,z,WORLD_SEED);return !Number.isFinite(w)||height(x,z)>w+margin};
// Retain original building / NPC / road coordinates; shift only the NEW boundary.
const center={x:EASTBROOK_LAYOUT.civic.center.x-20,z:EASTBROOK_LAYOUT.civic.center.z+1};
const BOUNDS=new THREE.Box3(),SIZE=new THREE.Vector3();
const TARGET={hunter:1.70,houseDoor:2.10,wall:7.7,gate:9.2,tower:14.8,castle:18.5};
function angle(a:number,b:number){return Math.atan2(-(b.z-a.z),b.x-a.x);}
function distance(a:{x:number;z:number},b:{x:number;z:number}){return Math.hypot(a.x-b.x,a.z-b.z);}
function segmentDistance(px:number,pz:number,c:CityWall){
 const dx=c.x2-c.x1,dz=c.z2-c.z1,k=Math.max(.001,dx*dx+dz*dz);
 const t=Math.max(0,Math.min(1,((px-c.x1)*dx+(pz-c.z1)*dz)/k));
 return Math.hypot(px-c.x1-t*dx,pz-c.z1-t*dz);
}
export function blockedByCity(x:number,z:number,blockers:readonly CityWall[]){return blockers.some(b=>segmentDistance(x,z,b)<b.radius+.45)}
export function resolveCityMove(x:number,z:number,nx:number,nz:number,blocks:readonly CityWall[]){
 let px=x,pz=z;const dx=nx-x,dz=nz-z,n=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.3));
 for(let i=0;i<n;i++){const sx=dx/n,sz=dz/n;
   if(!blockedByCity(px+sx,pz+sz,blocks)){px+=sx;pz+=sz}
   else{if(!blockedByCity(px+sx,pz,blocks))px+=sx;if(!blockedByCity(px,pz+sz,blocks))pz+=sz}
 }return {x:px,z:pz};
}
function add(root:THREE.Group,models:Map<string,THREE.Group>,key:string,x:number,z:number,metres:number,rotation=0,span=0){
 const src=models.get(key);if(!src)return null;
 const model=src.clone(true);BOUNDS.setFromObject(model);BOUNDS.getSize(SIZE);
 const originalHeight=Math.max(.01,SIZE.y),scale=metres/originalHeight;
 model.scale.setScalar(scale);
 // Wall and arch modules must fill their surveyed chord; K4 left gaps by scaling height only.
 if(span>0)model.scale.x=span/Math.max(.01,SIZE.x);
 model.rotation.y=rotation;
 model.position.set(x,height(x,z)-BOUNDS.min.y*scale,z);
 // Gate leaves have centre-origin pivots in this glTF; rotating them intersects the arch.
 // The original OPEN stone frame remains, but the problematic temporary leaves are hidden.
 if(key==='fortressGate')model.traverse(node=>{
   if(/wall_straight_gate_door_(left|right)/i.test(node.name))node.visible=false;
 });
 model.userData.highflyApprovedCC0=true;root.add(model);
 return {model,width:SIZE.x*scale,height:SIZE.y*scale,depth:SIZE.z*scale,scale};
}
function anchor(t:number){
 // 72m perimeter encloses the Quayside district and the original 11 town lots.
 // NEVER collapse the ring in toward the plaza when an anchor meets sea: that
 // created the K4 waterfront gap and put wall sections through actual homes.
 return {x:center.x+Math.cos(t)*72,z:center.z+Math.sin(t)*72};
}
function safeWall(a:{x:number;z:number},b:{x:number;z:number}){
 for(const t of [0,.25,.5,.75,1]){const x=a.x+(b.x-a.x)*t,z=a.z+(b.z-a.z)*t;
  if(!dry(x,z,1.25))return false;
 }return true;
}
function makeBlock(a:{x:number;z:number},b:{x:number;z:number},kind:string,radius:number):CityWall{
 return {x1:a.x,z1:a.z,x2:b.x,z2:b.z,kind,radius};
}
export function buildHighflyFirstCity(models:Map<string,THREE.Group>){
 const root=new THREE.Group();root.name='HIGHFLY-K5-expanded-72m-fortress';
 const blockers:CityWall[]=[],passages:{x:number;z:number}[]=[];
 // 28 surveyed chords: a much larger city than K4 but with the original
 // Eastbrook world data, river and docks untouched. Wet spans are intentional
 // harbour access rather than walls sunk into water.
 const N=28,step=2*Math.PI/N,points=Array.from({length:N},(_,i)=>anchor(i*step));
 const valid=Array.from({length:N},(_,i)=>{
   const a=points[i],b=points[(i+1)%N];return {i,a,b,mid:{x:(a.x+b.x)/2,z:(a.z+b.z)/2}};
 }).filter(q=>distance(q.a,q.b)>=3&&safeWall(q.a,q.b));
 const targets=[{x:-94,z:-58},{x:6,z:-72}];
 const gateIndices=new Set<number>();
 for(const target of targets){
   const picked=[...valid].sort((a,b)=>distance(a.mid,target)-distance(b.mid,target))
     .find(q=>[...gateIndices].every(i=>Math.min(Math.abs(q.i-i),N-Math.abs(q.i-i))>=4));
   if(picked)gateIndices.add(picked.i);
 }
 let walls=0,gates=0,towers=0,skippedWater=0;const wallHeights:number[]=[],gateHeights:number[]=[];
 for(let i=0;i<N;i++){
  const a=points[i],b=points[(i+1)%N],mid={x:(a.x+b.x)/2,z:(a.z+b.z)/2},len=distance(a,b);
  if(len<3||!safeWall(a,b)){skippedWater++;continue;}
  if(gateIndices.has(i)){
   const p=add(root,models,'fortressGate',mid.x,mid.z,TARGET.gate,angle(a,b),len);
   if(!p)continue;gateHeights.push(p.height);gates++;passages.push(mid);
   // Gate is OPEN: the frame posts block only the ends, never the centre.
   const dx=(b.x-a.x)/len,dz=(b.z-a.z)/len,clearHalf=Math.min(3.5,len*.27);
   blockers.push(makeBlock(a,{x:mid.x-dx*clearHalf,z:mid.z-dz*clearHalf},'gate-jamb',.65));
   blockers.push(makeBlock({x:mid.x+dx*clearHalf,z:mid.z+dz*clearHalf},b,'gate-jamb',.65));
  }else{
   const p=add(root,models,'fortressWall',mid.x,mid.z,TARGET.wall,angle(a,b),len);
   if(!p)continue;walls++;wallHeights.push(p.height);
   blockers.push(makeBlock(a,b,'wall',Math.min(1.65,Math.max(.8,p.depth*.42))));
  }
 }
 // Distribute watch towers over GENUINELY dry stretches, never into the bay.
 const towerSites=valid.filter(q=>!gateIndices.has(q.i)).filter((q,_,all)=>
   all.length>0&&q.i%Math.max(1,Math.floor(N/5))===0).slice(0,5);
 if(towerSites.length<2)for(const q of valid){if(towerSites.length>=4)break;if(towerSites.every(t=>Math.abs(t.i-q.i)>3))towerSites.push(q);}
 for(const {a} of towerSites){
   if(!dry(a.x,a.z,1.5))continue;
   const p=add(root,models,'fortressTower',a.x,a.z,TARGET.tower,0);
   if(p){towers++;blockers.push(makeBlock(a,a,'tower',Math.max(2.6,Math.min(5,Math.max(p.width,p.depth)*.3))));}
 }
 // Unlike K3, the civic ornament is an actual KayKit 3D well, not a tile.
 const civic=EASTBROOK_LAYOUT.civic.monument.position;
 const well=dry(civic.x,civic.z)&&!!add(root,models,'well',civic.x,civic.z,3.7);
 // Raise the keep on a dry outlying site so it doesn't crush the civic square.
 // K4 keep fell over the smithy! Reserve a dry, clear lot away from all 11 homes.
 const keep=[{x:-35,z:-150},{x:-53,z:-140},{x:3,z:-148},{x:-9,z:-151}].find(p=>
   dry(p.x,p.z,2)&&EASTBROOK_LAYOUT.buildings.every(b=>distance(p,b.position)>23));
 const castle=!!keep&&!!add(root,models,'castle',keep.x,keep.z,TARGET.castle,-.18);
 return {root,blockers,passages,counts:{
    wallSegments:walls,gates,towers,well:well?1:0,castle:castle?1:0,
    skippedWater,wallHeight:wallHeights[0]??0,gateHeight:gateHeights[0]??0,
    cityRadius:72,originalLots:EASTBROOK_LAYOUT.buildings.length,
    actorHeight:TARGET.hunter
 }};
}
