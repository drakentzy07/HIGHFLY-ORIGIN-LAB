// K3: real rigged glTF models and source animation clips — no procedural humanoids.
import * as THREE from 'three';
import { clone as cloneSkinned } from 'three/addons/utils/SkeletonUtils.js';
export interface RigController { root:THREE.Group; update:(dt:number,run:boolean)=>void; attack:()=>void; dispose:()=>void; clipCount:number }
const bounds=new THREE.Box3(),size=new THREE.Vector3();
const pick=(clips:THREE.AnimationClip[],re:RegExp)=>clips.find(c=>re.test(c.name));
export function makeRig(model:THREE.Object3D,clips:THREE.AnimationClip[],targetHeight=2.6):RigController {
  const root=new THREE.Group(),body=cloneSkinned(model);
  bounds.setFromObject(body);bounds.getSize(size);
  const s=targetHeight/Math.max(.05,size.y);
  body.scale.setScalar(s);body.position.y=-bounds.min.y*s;root.add(body);
  const mixer=new THREE.AnimationMixer(body);
  const idle=pick(clips,/^Idle(_A)?$|Idle_A|Idle/i);
  const run=pick(clips,/Running_A|^Running$|^Run$|Running/i)??pick(clips,/Walking_A|Walk/i);
  const hit=pick(clips,/1H_Melee_Attack_Slice_Diagonal|1H_Melee_Attack_Chop|Melee_Attack|^Attack/i);
  let state:'idle'|'run'='idle',attackRemaining=0;
  const idleAction=idle?mixer.clipAction(idle):null,runAction=run?mixer.clipAction(run):null,hitAction=hit?mixer.clipAction(hit):null;
  if(idleAction){idleAction.play();}
  else if(runAction){runAction.play();}
  const switchBase=(running:boolean)=>{
    const wanted=running?'run':'idle';if(wanted===state)return;
    const old=state==='run'?runAction:idleAction;
    const next=running?runAction:idleAction;state=wanted;
    if(next&&old&&next!==old){next.reset().play();next.crossFadeFrom(old,.16,false);}
    else if(next)next.play();
  };
  return {root,clipCount:clips.length,
    update(dt,runState){if(attackRemaining>0){attackRemaining=Math.max(0,attackRemaining-dt);if(attackRemaining===0&&hitAction)hitAction.fadeOut(.12);}switchBase(runState);mixer.update(dt);},
    attack(){if(!hitAction||attackRemaining>0)return;hitAction.reset();hitAction.setLoop(THREE.LoopOnce,1);hitAction.clampWhenFinished=true;hitAction.fadeIn(.08).play();attackRemaining=Math.max(.28,hit!.duration);},
    dispose(){mixer.stopAllAction()}
  };
}
