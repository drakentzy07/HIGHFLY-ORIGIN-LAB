// HIGHFLY K4: three licensed KayKit ship models anchored on original water.
import * as THREE from 'three';
import {terrainHeight,waterLevelAt} from '../../../upstream/src/sim/world.ts';
import {WORLD_SEED} from '../../../upstream/src/sim/world_seed.ts';
const b=new THREE.Box3(),s=new THREE.Vector3();
export function buildHighflyShips(models:Map<string,THREE.Group>){
 const root=new THREE.Group();root.name='HIGHFLY-K4-CC0-harbor-ships';
 const spots:{x:number;z:number;level:number}[]=[];
 // Probe the real ClaudeCraft sea; never position a floating boat over dry grass.
 for(let radius=14;radius<88&&spots.length<3;radius+=7)for(let k=0;k<28&&spots.length<3;k++){
  const a=k*Math.PI*2/28;const x=-94+radius*Math.cos(a),z=-58+radius*Math.sin(a);
  const w=waterLevelAt(x,z,WORLD_SEED),h=terrainHeight(x,z,WORLD_SEED);
  if(!Number.isFinite(w)||h>w-1.0)continue;
  if(spots.some(p=>Math.hypot(p.x-x,p.z-z)<20))continue;
  spots.push({x,z,level:w});
 }
 let ships=0;
 for(let i=0;i<spots.length;i++){
  const src=models.get(['shipBlue','shipGreen','shipRed'][i]);if(!src)continue;
  const mesh=src.clone(true);b.setFromObject(mesh);b.getSize(s);
  const scale=9/Math.max(.1,Math.max(s.x,s.z));
  mesh.scale.setScalar(scale);mesh.rotation.y=.2+i*.72;
  mesh.position.set(spots[i].x,spots[i].level-b.min.y*scale-.16,spots[i].z);
  mesh.userData.highflyApprovedCC0=true;root.add(mesh);ships++;
 }
 return {root,ships};
}
