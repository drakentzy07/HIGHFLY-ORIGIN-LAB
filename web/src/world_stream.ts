// HIGHFLY C0-J — streamed whole-world foundation.
// Original pinned ClaudeCraft 0.44.7 data, terrain, walkable heights and Eastbrook harbor.
// Visuals not represented by approved CC0 files remain explicitly temporary.
import * as THREE from 'three';
import { BUILTIN_WORLD, ZONES } from '../../../upstream/src/sim/data.ts';
import { terrainHeight, roadDistance, waterLevelAt, WATER_LEVEL } from '../../../upstream/src/sim/world.ts';
import { WORLD_SEED } from '../../../upstream/src/sim/world_seed.ts';
import { buildEastbrookHarbor } from '../../../upstream/src/render/eastbrook_harbor.ts';

const SIZE=64, RADIUS=2, SAMPLES=16;
const landMat=new THREE.MeshLambertMaterial({vertexColors:true,side:THREE.DoubleSide});
const roadMat=new THREE.MeshLambertMaterial({color:0xb39b76,side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:-1});
const waterMat=new THREE.MeshStandardMaterial({color:0x3989a4,roughness:.55,metalness:.05,transparent:true,opacity:.72,depthWrite:false,side:THREE.DoubleSide});
const treeMat=new THREE.MeshLambertMaterial({color:0x346a49});
const woodMat=new THREE.MeshLambertMaterial({color:0x775337});
const stoneMat=new THREE.MeshLambertMaterial({color:0x9e9c8d});
const roofMat=new THREE.MeshLambertMaterial({color:0x635b70});
const stallMat=new THREE.MeshLambertMaterial({color:0xc8a261,side:THREE.DoubleSide});
const treeGeo=new THREE.ConeGeometry(1.6,4.2,6);
const trunkGeo=new THREE.CylinderGeometry(.22,.36,2,6);
const tempBox=new THREE.Box3(),tempSize=new THREE.Vector3();
const pos=(b:any)=>{const p=b?.pos||b?.position||b?.center||b;return p&&Number.isFinite(Number(p.x))&&Number.isFinite(Number(p.z))?{x:Number(p.x),z:Number(p.z)}:null;};
const elev=(x:number,z:number)=>terrainHeight(x,z,WORLD_SEED);
const inChunk=(x:number,z:number,ix:number,iz:number)=>Math.floor(x/SIZE)===ix&&Math.floor(z/SIZE)===iz;
function hash(a:number,b:number,c:number){let k=(Math.imul(a,73856093)^Math.imul(b,19349663)^Math.imul(c,83492791))>>>0;k^=k>>>16;k=Math.imul(k,2246822507)>>>0;k^=k>>>13;return (k>>>0)/4294967295;}
function zoneAt(x:number,z:number){return ZONES.find((a:any)=>z>=a.zMin&&z<=a.zMax&&x>=(a.xMin??-180)&&x<=(a.xMax??180))||ZONES[0];}
function palette(x:number,z:number,y:number,rd:number){const biome=String(zoneAt(x,z).biome);let color:number=0x68865c;
  if(/marsh|swamp/i.test(biome))color=0x536b54;
  if(/desert|beach/i.test(biome))color=0xc3a877;
  if(/volcano/i.test(biome))color=0x756860;
  if(/snow|frost|peaks/i.test(biome))color=0x8d928d;
  if(/jungle|palm/i.test(biome))color=0x477d52;
  const c=new THREE.Color(color);
  if(rd<3.3)c.lerp(new THREE.Color(0x9b8369),Math.min(1,(3.3-rd)/2.8));
  if(y<WATER_LEVEL+1.6)c.lerp(new THREE.Color(0xc3ae83),.52);
  if(y>29)c.lerp(new THREE.Color(0xa1a4a1),Math.min(.7,(y-29)/45));
  c.multiplyScalar(.9+hash(Math.floor(x/9),Math.floor(z/9),12)*.2);
  return c;
}
function geometry(posArr:number[],ind:number[],cols?:number[]){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(posArr,3));if(cols)g.setAttribute('color',new THREE.Float32BufferAttribute(cols,3));g.setIndex(ind);g.computeVertexNormals();return g;}
function terrain(ix:number,iz:number,group:THREE.Group){const v:number[]=[],ind:number[]=[],col:number[]=[],step=SIZE/SAMPLES;
  for(let j=0;j<=SAMPLES;j++)for(let i=0;i<=SAMPLES;i++){const x=ix*SIZE+i*step,z=iz*SIZE+j*step,y=elev(x,z),rd=roadDistance(x,z),c=palette(x,z,y,rd);v.push(x,y,z);col.push(c.r,c.g,c.b);}
  for(let j=0;j<SAMPLES;j++)for(let i=0;i<SAMPLES;i++){const a=j*(SAMPLES+1)+i,b=a+1,c=a+SAMPLES+1,d=c+1;ind.push(a,c,b,b,c,d);}
  const mesh=new THREE.Mesh(geometry(v,ind,col),landMat);mesh.userData.disposable=true;group.add(mesh);
}
function water(ix:number,iz:number,group:THREE.Group){const v:number[]=[],ind:number[]=[],div=8,step=SIZE/div;
  for(let j=0;j<div;j++)for(let i=0;i<div;i++){const x=ix*SIZE+i*step,z=iz*SIZE+j*step;
    const level=waterLevelAt(x+step*.5,z+step*.5,WORLD_SEED);if(!Number.isFinite(level))continue;
    const n=v.length/3;v.push(x,level+.06,z,x+step,level+.06,z,x,level+.06,z+step,x+step,level+.06,z+step);ind.push(n,n+2,n+1,n+1,n+2,n+3);
  }
  if(ind.length){const m=new THREE.Mesh(geometry(v,ind),waterMat);m.userData.disposable=true;group.add(m);}
}
function roads(ix:number,iz:number,group:THREE.Group){const v:number[]=[],ind:number[]=[],minX=ix*SIZE-4,maxX=(ix+1)*SIZE+4,minZ=iz*SIZE-4,maxZ=(iz+1)*SIZE+4;
  for(const road of (BUILTIN_WORLD.roads as any[])){if(!Array.isArray(road))continue;
    for(let i=0;i<road.length-1;i++){const a=pos(road[i]),b=pos(road[i+1]);if(!a||!b)continue;
      if(Math.max(a.x,b.x)<minX||Math.min(a.x,b.x)>maxX||Math.max(a.z,b.z)<minZ||Math.min(a.z,b.z)>maxZ)continue;
      const dx=b.x-a.x,dz=b.z-a.z,length=Math.hypot(dx,dz);if(length<.01)continue;
      const nx=-dz/length*1.65,nz=dx/length*1.65,steps=Math.min(120,Math.max(1,Math.ceil(length/3)));
      for(let j=0;j<steps;j++){const t=j/steps,u=(j+1)/steps,xa=a.x+dx*t,za=a.z+dz*t,xb=a.x+dx*u,zb=a.z+dz*u;
        if(Math.max(xa,xb)<minX||Math.min(xa,xb)>maxX||Math.max(za,zb)<minZ||Math.min(za,zb)>maxZ)continue;
        const idx=v.length/3;
        v.push(xa+nx,elev(xa+nx,za+nz)+.08,za+nz,xa-nx,elev(xa-nx,za-nz)+.08,za-nz,xb+nx,elev(xb+nx,zb+nz)+.08,zb+nz,xb-nx,elev(xb-nx,zb-nz)+.08,zb-nz);
        ind.push(idx,idx+2,idx+1,idx+1,idx+2,idx+3);
      }
    }
  }
  if(ind.length){const m=new THREE.Mesh(geometry(v,ind),roadMat);m.userData.disposable=true;group.add(m);}
}
function box(group:THREE.Group,w:number,h:number,d:number,mat:THREE.Material,x:number,y:number,z:number,rot=0){const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);mesh.position.set(x,y+h/2,z);mesh.rotation.y=rot;mesh.userData.disposable=true;group.add(mesh);return mesh;}
function buildings(ix:number,iz:number,group:THREE.Group,templates:Map<string,THREE.Group>){let approved=0;
  for(const b of (BUILTIN_WORLD.props?.buildings||[]) as any[]){const p=pos(b);if(!p||!inChunk(p.x,p.z,ix,iz))continue;
    const w=Math.max(3,Math.min(30,Number(b.w??b.width??8))),d=Math.max(3,Math.min(30,Number(b.d??b.depth??9))),h=Math.max(3,Math.min(22,Number(b.height??b.h??6)));
    const rot=Number(b.rot??b.rotation??0),y=elev(p.x,p.z),tag=String(b.assetId||'')+' '+String(b.kind||'');
    const template=/tavern|inn/i.test(tag)?templates.get('tavern'):templates.get('house');
    if(template){const mesh=template.clone(true);tempBox.setFromObject(mesh);tempBox.getSize(tempSize);
      const scale=Math.min(w/Math.max(.01,tempSize.x),d/Math.max(.01,tempSize.z));
      mesh.scale.setScalar(Math.max(.01,scale));mesh.position.set(p.x,y-tempBox.min.y*scale,p.z);mesh.rotation.y=rot;
      mesh.userData.highflyApprovedCC0=true;group.add(mesh);approved++;
    }else{
      box(group,w,h,d,stoneMat,p.x,y,p.z,rot);
      const roof=new THREE.Mesh(new THREE.ConeGeometry(Math.max(w,d)*.7,3,4),roofMat);
      roof.position.set(p.x,y+h+1.2,p.z);roof.rotation.y=rot+Math.PI/4;roof.userData.disposable=true;group.add(roof);
    }
  }
  for(const s of (BUILTIN_WORLD.props?.stalls||[]) as any[]){const p=pos(s);if(!p||!inChunk(p.x,p.z,ix,iz))continue;const y=elev(p.x,p.z);box(group,3,1.05,2,woodMat,p.x,y,p.z);box(group,3.9,.22,2.8,stallMat,p.x,y+2.9,p.z);}
  return approved;
}
function trees(ix:number,iz:number,group:THREE.Group){const positions:{x:number,y:number,z:number,s:number}[]=[];const cx=ix*SIZE,cz=iz*SIZE;
  for(let i=0;i<42;i++){const x=cx+hash(ix,iz,i*2+5)*SIZE,z=cz+hash(ix,iz,i*2+6)*SIZE,y=elev(x,z);
    if(y<WATER_LEVEL+1||roadDistance(x,z)<6)continue;
    const aroundTown=ZONES.some((zone:any)=>zone.hub&&Math.hypot(x-zone.hub.x,z-zone.hub.z)<(zone.hub.radius||35)+5);
    if(aroundTown)continue;
    const nearBuilding=((BUILTIN_WORLD.props?.buildings||[]) as any[]).some(b=>{const p=pos(b);return p&&Math.abs(p.x-x)<9&&Math.abs(p.z-z)<9;});
    if(nearBuilding)continue;
    positions.push({x,y,z,s:.7+hash(ix,iz,i+410)*1.2});
  }
  if(!positions.length)return;const trunks=new THREE.InstancedMesh(trunkGeo,woodMat,positions.length),crowns=new THREE.InstancedMesh(treeGeo,treeMat,positions.length),o=new THREE.Object3D();
  positions.forEach((p,i)=>{o.position.set(p.x,p.y+p.s,p.z);o.scale.setScalar(p.s);o.updateMatrix();trunks.setMatrixAt(i,o.matrix);
    o.position.y=p.y+p.s*3.2;o.updateMatrix();crowns.setMatrixAt(i,o.matrix);});
  trunks.instanceMatrix.needsUpdate=true;crowns.instanceMatrix.needsUpdate=true;group.add(trunks,crowns);
}
function dispose(group:THREE.Group){group.traverse((obj:any)=>{if(obj.userData?.disposable&&obj.geometry)obj.geometry.dispose();});group.parent?.remove(group);}
export class WorldStreamer{
  private chunks=new Map<string,THREE.Group>();private center={ix:NaN,iz:NaN};
  public approvedVisible=0;public zones=ZONES.length;public lastZone='';
  constructor(private scene:THREE.Scene,private templates:Map<string,THREE.Group>){
    const harbor=buildEastbrookHarbor(WORLD_SEED);harbor.name='claudecraft-original-eastbrook-harbor';scene.add(harbor);
  }
  private load(ix:number,iz:number){const key=ix+','+iz;if(this.chunks.has(key))return;
    const group=new THREE.Group();group.name='world-sector-'+key;
    terrain(ix,iz,group);water(ix,iz,group);roads(ix,iz,group);buildings(ix,iz,group,this.templates);trees(ix,iz,group);
    this.scene.add(group);this.chunks.set(key,group);
  }
  update(x:number,z:number,prime=false){const ix=Math.floor(x/SIZE),iz=Math.floor(z/SIZE);this.center={ix,iz};
    this.lastZone=String(zoneAt(x,z).name);
    const needed:{ix:number,iz:number,d:number}[]=[];
    for(let dz=-RADIUS;dz<=RADIUS;dz++)for(let dx=-RADIUS;dx<=RADIUS;dx++)needed.push({ix:ix+dx,iz:iz+dz,d:dx*dx+dz*dz});
    needed.sort((a,b)=>a.d-b.d);
    // Always fill 3x3 at boot. Add two outer tiles per update afterwards.
    let budget=prime?9:2;
    for(const p of needed){if(budget<=0)break;
      if(prime&&Math.abs(p.ix-ix)>1||prime&&Math.abs(p.iz-iz)>1)continue;
      const key=p.ix+','+p.iz;if(!this.chunks.has(key)){this.load(p.ix,p.iz);budget--;}
    }
    for(const [key,group] of this.chunks){const [a,b]=key.split(',').map(Number);if(Math.abs(a-ix)>RADIUS||Math.abs(b-iz)>RADIUS){dispose(group);this.chunks.delete(key);}}
    let n=0;for(const group of this.chunks.values())group.traverse((o:any)=>{if(o.userData?.highflyApprovedCC0)n++;});
    this.approvedVisible=n;
  }
  get chunkCount(){return this.chunks.size;}
  get sector(){return this.center.ix+','+this.center.iz;}
}
