// HIGHFLY K2 — authored visual foundation over immutable original ClaudeCraft geography.
// Visual overlay only: original Sim, camp spawns, quests and terrain seed remain intact.
// Fortress colliders/quests are NOT yet active; this phase validates true CC0 geometry.
import * as THREE from 'three';
import { EASTBROOK_LAYOUT } from '../../../upstream/src/sim/eastbrook_layout.ts';
import { terrainHeight } from '../../../upstream/src/sim/world.ts';
import { WORLD_SEED } from '../../../upstream/src/sim/world_seed.ts';

const height=(x:number,z:number)=>terrainHeight(x,z,WORLD_SEED);
const frame=new THREE.Box3(), dimensions=new THREE.Vector3();
function place(root:THREE.Group,templates:Map<string,THREE.Group>,key:string,x:number,z:number,width:number,tall:number,depth:number,rot=0){
  const src=templates.get(key);if(!src)return false;
  const item=src.clone(true);frame.setFromObject(item);frame.getSize(dimensions);
  const sx=width/Math.max(.01,dimensions.x),sy=tall/Math.max(.01,dimensions.y),sz=depth/Math.max(.01,dimensions.z);
  item.scale.set(sx,sy,sz);item.rotation.y=rot;
  item.position.set(x,height(x,z)-frame.min.y*sy,z);
  item.userData.highflyApprovedCC0=true;item.userData.highflyK2Fortress=true;
  root.add(item);return true;
}
function distanceAngle(a:number,b:number){return Math.abs(Math.atan2(Math.sin(a-b),Math.cos(a-b)));}
export function buildHighflyFirstCity(templates:Map<string,THREE.Group>){
  const center=EASTBROOK_LAYOUT.civic.center; // -14,-102 — official authored hub
  const root=new THREE.Group();root.name='highfly-first-city-visual-overlay';
  const radius=39,parts=64,segment=2*Math.PI*radius/parts;
  const dockGate=Math.atan2(-58-center.z,-94-center.x),northGate=-Math.PI/2;
  const gates=[dockGate,northGate];
  let segments=0,doors=0,towers=0;
  for(let i=0;i<parts;i++){
    const a=(i+.5)*Math.PI*2/parts,x=center.x+Math.cos(a)*radius,z=center.z+Math.sin(a)*radius;
    if(gates.some(g=>distanceAngle(a,g)<Math.PI*2/parts*1.42))continue;
    const rot=-Math.PI/2-a;
    if(place(root,templates,'fortressWall',x,z,segment*1.05,4.8,1.5,rot))segments++;
  }
  for(const angle of gates){
    const x=center.x+Math.cos(angle)*radius,z=center.z+Math.sin(angle)*radius;
    if(place(root,templates,'fortressGate',x,z,12.5,6.1,2.4,-Math.PI/2-angle))doors++;
  }
  for(const angle of [Math.PI/4,3*Math.PI/4,5*Math.PI/4,7*Math.PI/4]){
    const x=center.x+Math.cos(angle)*radius,z=center.z+Math.sin(angle)*radius;
    if(place(root,templates,'fortressTower',x,z,7.5,10.5,7.5,Math.PI/2-angle))towers++;
  }
  // A keep above the original city square. This currently only displays approved geometry.
  const castle=place(root,templates,'castle',center.x+10,center.z-20,11.5,10,11.5,-.2);
  // Gardens and outer forest keep a visibly constructed transition to wilderness.
  let gardens=0;
  for(let i=0;i<22;i++){const a=i*Math.PI*2/22+.11;
    const r=radius+10+(i%3)*5,x=center.x+Math.cos(a)*r,z=center.z+Math.sin(a)*r;
    if(gates.some(g=>distanceAngle(a,g)<.20))continue;
    if(place(root,templates,i%2?'treeB':'treeA',x,z,3.6+(i%3)*.6,6+(i%3)*.5,3.6+(i%3)*.6,a))gardens++;
  }
  return {root,counts:{wallSegments:segments,gates:doors,towers,castle:castle?1:0,trees:gardens}};
}
