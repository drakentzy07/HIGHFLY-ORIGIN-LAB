// HIGHFLY K5 — deterministic genuine CC0 vessels at ClaudeCraft's ACTUAL piers.
import * as THREE from 'three';
import {terrainHeight,waterLevelAt} from '../../../upstream/src/sim/world.ts';
import {WORLD_SEED} from '../../../upstream/src/sim/world_seed.ts';
const box=new THREE.Box3(),size=new THREE.Vector3();
const BERTHS=[
  {x:-114.5,z:-47}, // between north work pier (z=-40) and ferry pier (z=-54)
  {x:-114.5,z:-61}, // between ferry pier (z=-54) and south work pier (z=-68)
  {x:-114.5,z:-80}  // south of last work pier; no deck intersection
] as const;
function wetBerth(target:{x:number;z:number}){
  // Never randomise around an arbitrary radius: the dock's fixed coordinates
  // are world-authored and the ship must stay next to its intended berth.
  const probes=[{x:0,z:0},{x:-2,z:0},{x:0,z:2},{x:-2,z:2},{x:0,z:-2},{x:-2,z:-2}];
  for(const p of probes){
    const x=target.x+p.x,z=target.z+p.z,w=waterLevelAt(x,z,WORLD_SEED);
    if(Number.isFinite(w)&&terrainHeight(x,z,WORLD_SEED)<w-0.8)return {x,z,w};
  }
  return null;
}
function weatheredMarineMaterial(root:THREE.Object3D){
  // Reuse original permitted geometry; soften K4's solid red/green/blue hulls
  // without relying on third-party textures or introducing proxy vessels.
  root.traverse(obj=>{
    if(!(obj instanceof THREE.Mesh))return;
    const tweak=(src:THREE.Material)=>{
      const material=src.clone();
      if('color' in material&&material.color instanceof THREE.Color){
        const hsv={h:0,s:0,l:0};material.color.getHSL(hsv);
        material.color.setHSL(hsv.h,Math.min(hsv.s,.28),Math.max(.30,Math.min(.67,hsv.l)));
      }
      if(material instanceof THREE.MeshStandardMaterial){material.roughness=.82;material.metalness=0;}
      return material;
    };
    obj.material=Array.isArray(obj.material)?obj.material.map(tweak):tweak(obj.material);
  });
}
export function buildHighflyShips(models:Map<string,THREE.Group>){
  const root=new THREE.Group();root.name='HIGHFLY-K5-CC0-moored-ships';
  let ships=0;const occupied:{x:number;z:number}[]=[];
  for(let i=0;i<BERTHS.length;i++){
    const spot=wetBerth(BERTHS[i]),src=models.get(['shipBlue','shipGreen','shipRed'][i]);
    if(!src||!spot)continue;
    const model=src.clone(true);box.setFromObject(model);box.getSize(size);
    const factor=10.5/Math.max(.1,Math.max(size.x,size.z));
    model.scale.setScalar(factor);
    // Source ships face local Z; berths run in the X direction beside piers.
    model.rotation.y=Math.PI/2;
    model.position.set(spot.x,spot.w-box.min.y*factor-.18,spot.z);
    weatheredMarineMaterial(model);
    model.userData.highflyApprovedCC0=true;
    model.userData.harborBerth=i+1;
    root.add(model);ships++;occupied.push({x:spot.x,z:spot.z});
  }
  return {root,ships,berths:occupied};
}
