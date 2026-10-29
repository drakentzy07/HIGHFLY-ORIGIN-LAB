// HIGHFLY K4: one shared authored scene/physics footprint; the original world stays immutable.
// Model geometry is genuine licensed KayKit, not a proxy cube.
import * as THREE from 'three';
import { EASTBROOK_LAYOUT } from '../../../upstream/src/sim/eastbrook_layout.ts';
import { terrainHeight, waterLevelAt } from '../../../upstream/src/sim/world.ts';
import { WORLD_SEED } from '../../../upstream/src/sim/world_seed.ts';
export interface CityWall {x1:number;z1:number;x2:number;z2:number;radius:number;kind:string}
const height=(x:number,z:number)=>terrainHeight(x,z,WORLD_SEED);
const dry=(x:number,z:number,margin=1.25)=>{const w=waterLevelAt(x,z,WORLD_SEED);return !Number.isFinite(w)||height(x,z)>w+margin};
const center=EASTBROOK_LAYOUT.civic.center;
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
function add(root:THREE.Group,models:Map<string,THREE.Group>,key:string,x:number,z:number,metres:number,rotation=0){
 const src=models.get(key);if(!src)return null;
 const model=src.clone(true);BOUNDS.setFromObject(model);BOUNDS.getSize(SIZE);
 const originalHeight=Math.max(.01,SIZE.y),scale=metres/originalHeight;
 model.scale.setScalar(scale);model.rotation.y=rotation;
 model.position.set(x,height(x,z)-BOUNDS.min.y*scale,z);
 if(key==='fortressGate')model.traverse(node=>{
   if(/wall_straight_gate_door_left/i.test(node.name))node.rotation.y=-1.25;
   if(/wall_straight_gate_door_right/i.test(node.name))node.rotation.y=1.25;
 });
 model.userData.highflyApprovedCC0=true;root.add(model);
 return {model,width:SIZE.x*scale,height:SIZE.y*scale,depth:SIZE.z*scale,scale};
}
function anchor(t:number){
 let r=40;for(let j=0;j<30;j++,r-=1.0){
  const x=center.x+Math.cos(t)*r,z=center.z+Math.sin(t)*r;
  if(dry(x,z,1.6)&&dry(x+Math.cos(t)*1.5,z+Math.sin(t)*1.5,1.6))return {x,z};
 }return {x:center.x+Math.cos(t)*11,z:center.z+Math.sin(t)*11};
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
 const root=new THREE.Group();root.name='HIGHFLY-K4-real-stone-fortress';
 const blockers:CityWall[]=[],passages:{x:number;z:number}[]=[];
 // A 20-piece circuit matches the genuine wall model when scaled to 7.7 metres:
 // native wall 2m wide, 1.1m tall -> ~14m per piece, not a little garden fence.
 const N=20,step=2*Math.PI/N,points=Array.from({length:N},(_,i)=>anchor(i*step));
 const targets=[Math.atan2(-58-center.z,-94-center.x),Math.atan2(-72-center.z,6-center.x)];
 const gateIndices=new Set(targets.map(t=>((Math.floor((t+Math.PI*2)%(Math.PI*2)/step))%N)));
 let walls=0,gates=0,towers=0,skippedWater=0;const wallHeights:number[]=[],gateHeights:number[]=[];
 for(let i=0;i<N;i++){
  const a=points[i],b=points[(i+1)%N],mid={x:(a.x+b.x)/2,z:(a.z+b.z)/2},len=distance(a,b);
  if(len<3||!safeWall(a,b)){skippedWater++;continue;}
  if(gateIndices.has(i)){
   const p=add(root,models,'fortressGate',mid.x,mid.z,TARGET.gate,angle(a,b));
   if(!p)continue;gateHeights.push(p.height);gates++;passages.push(mid);
   // Gate is OPEN: the frame posts block only the ends, never the centre.
   const dx=(b.x-a.x)/len,dz=(b.z-a.z)/len,edge=Math.min(1.25,len*.10);
   blockers.push(makeBlock(a,{x:a.x+dx*edge,z:a.z+dz*edge},'gate-jamb',.35));
   blockers.push(makeBlock({x:b.x-dx*edge,z:b.z-dz*edge},b,'gate-jamb',.35));
  }else{
   const p=add(root,models,'fortressWall',mid.x,mid.z,TARGET.wall,angle(a,b));
   if(!p)continue;walls++;wallHeights.push(p.height);
   blockers.push(makeBlock(a,b,'wall',Math.min(1.65,Math.max(.8,p.depth*.42))));
  }
 }
 for(const i of [2,7,12,17]){
   const p=points[i];if(!dry(p.x,p.z,1.5))continue;
   if(add(root,models,'fortressTower',p.x,p.z,TARGET.tower,0)){
    towers++;blockers.push(makeBlock(p,p,'tower',2.6));
   }
 }
 // Unlike K3, the civic ornament is an actual KayKit 3D well, not a tile.
 const civic=EASTBROOK_LAYOUT.civic.monument.position;
 const well=dry(civic.x,civic.z)&&!!add(root,models,'well',civic.x,civic.z,3.7);
 // Raise the keep on a dry outlying site so it doesn't crush the civic square.
 const keep={x:center.x+29,z:center.z-23};
 const castle=dry(keep.x,keep.z)&&!!add(root,models,'castle',keep.x,keep.z,TARGET.castle,-.18);
 return {root,blockers,passages,counts:{
    wallSegments:walls,gates,towers,well:well?1:0,castle:castle?1:0,
    skippedWater,wallHeight:wallHeights[0]??0,gateHeight:gateHeights[0]??0,
    actorHeight:TARGET.hunter
 }};
}
