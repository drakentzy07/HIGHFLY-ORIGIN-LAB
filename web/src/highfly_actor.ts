// HIGHFLY original proof-of-concept character: independently authored humanoid mesh.
// Not a KayKit class model, not the intended final male/female Hunter SOURCE asset.
import * as THREE from 'three';
const mat=(c:number)=>new THREE.MeshStandardMaterial({color:c,roughness:.85,metalness:0});
const palette={
  hunter:{skin:0xd5a58b,cloth:0x263d59,armor:0x7897ad,leather:0x453c41,accent:0x2ed9e7,hair:0x1d202f},
  npc:{skin:0xc48c6d,cloth:0x695742,armor:0x947959,leather:0x594536,accent:0xe4c484,hair:0x48372d}
};
function limb(parent:THREE.Group,mesh:THREE.Object3D,x:number,y:number,z:number){mesh.position.set(x,y,z);parent.add(mesh);return mesh;}
export function createHighflyFigure(kind:'hunter'|'npc'='hunter'){
  const c=palette[kind],root=new THREE.Group();root.name=kind==='hunter'?'highfly-original-test-hunter':'highfly-original-test-npc';
  const cloth=mat(c.cloth),metal=mat(c.armor),leather=mat(c.leather),skin=mat(c.skin),accent=mat(c.accent),hair=mat(c.hair);
  const box=(w:number,h:number,d:number,m:THREE.Material)=>new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);
  const body=box(.75,1.03,.42,cloth);limb(root,body,0,1.65,0);
  const breast=box(.64,.55,.50,metal);limb(root,breast,0,1.84,.02);
  const belt=box(.83,.17,.50,leather);limb(root,belt,0,1.16,0);
  const head=new THREE.Mesh(new THREE.IcosahedronGeometry(.35,1),skin);limb(root,head,0,2.54,.04);
  const hairTop=box(.68,.16,.64,hair);limb(root,hairTop,0,2.84,-.02);
  const hairBack=box(.58,.33,.13,hair);limb(root,hairBack,0,2.65,-.27);
  if(kind==='hunter'){
    const cape=new THREE.Mesh(new THREE.ConeGeometry(.65,1.65,4,1,true),cloth);limb(root,cape,0,1.25,-.29);cape.rotation.y=Math.PI/4;
    const crest=box(.10,.14,.58,accent);limb(root,crest,0,2.8,.04);
    const emblem=box(.28,.24,.06,accent);limb(root,emblem,0,1.9,.29);
  } else {
    const apron=box(.8,.75,.52,leather);limb(root,apron,0,1.32,.01);
    const pouch=box(.28,.27,.17,accent);limb(root,pouch,.42,1.27,.13);
  }
  const legs:THREE.Group[]=[],arms:THREE.Group[]=[];
  for(const side of [-1,1]){
    const leg=new THREE.Group();leg.position.set(side*.24,1.04,0);root.add(leg);
    limb(leg,box(.29,.74,.33,cloth),0,-.36,0);limb(leg,box(.32,.34,.45,leather),0,-.83,.08);legs.push(leg);
    const arm=new THREE.Group();arm.position.set(side*.50,2.05,0);root.add(arm);
    limb(arm,box(.29,.65,.31,metal),0,-.35,0);limb(arm,box(.25,.30,.29,skin),0,-.74,0);arms.push(arm);
  }
  if(kind==='hunter'){
    const blade=box(.10,1.04,.16,metal),guard=box(.36,.09,.24,accent),grip=box(.14,.46,.18,leather);
    const hand=arms[1];limb(hand,grip,0,-.9,.12);limb(hand,guard,0,-1.16,.12);limb(hand,blade,0,-1.69,.12);
  }
  root.userData.animate=(t:number,run:boolean,attack:boolean)=>{
    const s=run?Math.sin(t*11)*.42:Math.sin(t*1.9)*.025;
    legs[0].rotation.x=s;legs[1].rotation.x=-s;
    arms[0].rotation.x=-s*.8;
    arms[1].rotation.x=attack?-1.3+Math.sin(t*16)*1.2:s*.8;
    body.rotation.z=run?Math.sin(t*11)*.035:0;
  };
  return root;
}
