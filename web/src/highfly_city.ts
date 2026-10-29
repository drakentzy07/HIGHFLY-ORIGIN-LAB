// HIGHFLY K3: one authored placement is shared by rendering and physical collision.
// The pinned ClaudeCraft seed and BUILTIN_WORLD remain immutable.
import * as THREE from 'three';
import { EASTBROOK_LAYOUT } from '../../../upstream/src/sim/eastbrook_layout.ts';
import { terrainHeight, waterLevelAt } from '../../../upstream/src/sim/world.ts';
import { WORLD_SEED } from '../../../upstream/src/sim/world_seed.ts';

export interface CityWall { x1:number;z1:number;x2:number;z2:number;radius:number;kind:string }
const h=(x:number,z:number)=>terrainHeight(x,z,WORLD_SEED);
const safe=(x:number,z:number)=>{const w=waterLevelAt(x,z,WORLD_SEED);return !Number.isFinite(w)||h(x,z)>w+1.1;};
const center=EASTBROOK_LAYOUT.civic.center;
const box=new THREE.Box3(),dim=new THREE.Vector3();
function place(scene:THREE.Group,templates:Map<string,THREE.Group>,key:string,x:number,z:number,width:number,rotation=0){
  const source=templates.get(key);if(!source)return false;
  const mesh=source.clone(true);box.setFromObject(mesh);box.getSize(dim);
  const scale=width/Math.max(.001,dim.x);
  mesh.scale.setScalar(scale);mesh.rotation.y=rotation;
  mesh.position.set(x,h(x,z)-box.min.y*scale,z);
  if(key==='fortressGate') {
    // The genuine KayKit gate has two named, independently pivoted door leaves.
    mesh.traverse((node:any)=>{
      if(/wall_straight_gate_door_left/i.test(node.name))node.rotation.y=-1.13;
      if(/wall_straight_gate_door_right/i.test(node.name))node.rotation.y=1.13;
    });
  }
  mesh.userData.highflyApprovedCC0=true;
  mesh.userData.highflyK3Authored=true;
  scene.add(mesh);
  return true;
}
function angular(a:number,b:number){return Math.abs(Math.atan2(Math.sin(a-b),Math.cos(a-b)));}
function point(a:number){
  let r=39;
  // Wall anchor moves INLAND if the original coastline crosses this angle.
  for(let attempt=0;attempt<24;attempt++,r-=1.25){
    const x=center.x+Math.cos(a)*r,z=center.z+Math.sin(a)*r;
    if(safe(x,z)&&safe(x+Math.cos(a)*1,z+Math.sin(a)*1))return {x,z};
  }
  return {x:center.x+Math.cos(a)*10,z:center.z+Math.sin(a)*10};
}
function length(a:{x:number;z:number},b:{x:number;z:number}){return Math.hypot(a.x-b.x,a.z-b.z);}
function yw(a:{x:number;z:number},b:{x:number;z:number}){return Math.atan2(-(b.z-a.z),b.x-a.x);}
function lineDistance(px:number,pz:number,c:CityWall){
  const dx=c.x2-c.x1,dz=c.z2-c.z1,k=Math.max(.001,dx*dx+dz*dz);
  const t=Math.max(0,Math.min(1,((px-c.x1)*dx+(pz-c.z1)*dz)/k));
  return Math.hypot(px-(c.x1+t*dx),pz-(c.z1+t*dz));
}
export function blockedByCity(x:number,z:number,blockers:readonly CityWall[]){
  return blockers.some(b=>lineDistance(x,z,b)<b.radius+.48);
}
export function resolveCityMove(x:number,z:number,nx:number,nz:number,blocks:readonly CityWall[]){
  // Small swept substeps prevent tunneling during dash, with axis sliding.
  const dx=nx-x,dz=nz-z,steps=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.38));
  let px=x,pz=z;
  for(let i=0;i<steps;i++){
    const sx=dx/steps,sz=dz/steps;
    if(!blockedByCity(px+sx,pz+sz,blocks)){px+=sx;pz+=sz;continue;}
    if(!blockedByCity(px+sx,pz,blocks))px+=sx;
    if(!blockedByCity(px,pz+sz,blocks))pz+=sz;
  }
  return {x:px,z:pz};
}
export function buildHighflyFirstCity(templates:Map<string,THREE.Group>){
  const root=new THREE.Group();root.name='HIGHFLY-K3-CC0-physical-city';
  const blockers:CityWall[]=[];
  const parts=40,period=Math.PI*2/parts;
  // Gate aims at authored harbour and existing north road; NOT a random axis.
  const targets=[Math.atan2(-58-center.z,-94-center.x),Math.atan2(-72-center.z,6-center.x)];
  const gates=new Set(targets.map(t=>((Math.round(t/period-.5)%parts)+parts)%parts));
  const pts=Array.from({length:parts},(_,i)=>point(i*period));
  let walls=0,opened=0,towers=0;
  for(let i=0;i<parts;i++){
    const a=pts[i],b=pts[(i+1)%parts],d=length(a,b);
    const x=(a.x+b.x)/2,z=(a.z+b.z)/2;
    if(!safe(x,z)||d<1.8)continue;
    if(gates.has(i)){
      if(place(root,templates,'fortressGate',x,z,d,yw(a,b)))opened++;
      // No collider across the gate opening.
    }else if(place(root,templates,'fortressWall',x,z,d*1.04,yw(a,b))){
      walls++;blockers.push({x1:a.x,z1:a.z,x2:b.x,z2:b.z,radius:1.15,kind:'wall'});
    }
  }
  // Four guarded corners: the tower silhouette remains KayKit, never procedural.
  for(const i of [5,15,25,35]){
    const p=pts[i];if(!safe(p.x,p.z))continue;
    if(place(root,templates,'fortressTower',p.x,p.z,7,0)) {
      towers++;blockers.push({x1:p.x,z1:p.z,x2:p.x,z2:p.z,radius:2.0,kind:'tower'});
    }
  }
  // Use the original town's real civic feature coordinate, NOT loose floor tiles.
  const well=EASTBROOK_LAYOUT.civic.monument.position;
  const civic=well&&safe(well.x,well.z)&&place(root,templates,'well',well.x,well.z,3.5,0);
  return {root,blockers,counts:{wallSegments:walls,gates:opened,towers,well:civic?1:0,trees:0}};
}
