// HIGHFLY C0-J — streamed whole-world foundation.
// Original pinned ClaudeCraft 0.44.7 data, terrain, walkable heights and Eastbrook harbor.
// Visuals not represented by approved CC0 files remain explicitly temporary.
import * as THREE from 'three';
import { BUILTIN_WORLD, ZONES } from '../../../upstream/src/sim/data.ts';
import { terrainHeight, roadDistance, waterLevelAt, WATER_LEVEL } from '../../../upstream/src/sim/world.ts';
import { WORLD_SEED } from '../../../upstream/src/sim/world_seed.ts';
import { buildEastbrookHarbor } from '../../../upstream/src/render/eastbrook_harbor.ts';
import { EASTBROOK_LAYOUT } from '../../../upstream/src/sim/eastbrook_layout.ts';
import { buildHighflyFirstCity, resolveCityMove, blockedByCity, type CityWall } from './highfly_city.ts';
import { buildHighflyShips } from './highfly_harbor.ts';
import { generateDecorationsInBounds } from '../../../upstream/src/sim/world.ts';

const SIZE=64, RADIUS=2, SAMPLES=32; // Original WORLD_SEED and original height sampler.
const landMat=new THREE.MeshLambertMaterial({vertexColors:true,side:THREE.DoubleSide});
const roadMat=new THREE.MeshLambertMaterial({color:0xb39b76,side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:-1});
const waterMat=new THREE.MeshStandardMaterial({color:0x3989a4,roughness:.55,metalness:.05,transparent:true,opacity:.72,depthWrite:false,side:THREE.DoubleSide});
const tempBox=new THREE.Box3(),tempSize=new THREE.Vector3();
// K5: geometry-matched colliders for visible approved houses.
function outline(x:number,z:number,hw:number,hd:number,yaw:number):CityWall[]{
 const c=Math.cos(yaw),sin=Math.sin(yaw);
 const point=(u:number,v:number)=>({x:x+u*c+v*sin,z:z-u*sin+v*c});
 const corners=[point(-hw,-hd),point(hw,-hd),point(hw,hd),point(-hw,hd)];
 return corners.map((p,i)=>({x1:p.x,z1:p.z,x2:corners[(i+1)%4].x,z2:corners[(i+1)%4].z,kind:'visible-house',radius:.24}));
}
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
function terrain(ix:number,iz:number,group:THREE.Group,material:THREE.Material){
  const v:number[]=[],ind:number[]=[],col:number[]=[],road:number[]=[],step=SIZE/SAMPLES;
  for(let j=0;j<=SAMPLES;j++)for(let i=0;i<=SAMPLES;i++){
    const x=ix*SIZE+i*step,z=iz*SIZE+j*step,y=elev(x,z),rd=roadDistance(x,z),c=palette(x,z,y,rd);
    v.push(x,y,z);col.push(c.r,c.g,c.b);road.push(Math.min(100,rd));
  }
  for(let j=0;j<SAMPLES;j++)for(let i=0;i<SAMPLES;i++){const a=j*(SAMPLES+1)+i,b=a+1,c=a+SAMPLES+1,d=c+1;ind.push(a,c,b,b,c,d);}
  const g=geometry(v,ind,col);g.setAttribute('aRoad',new THREE.Float32BufferAttribute(road,1));
  const mesh=new THREE.Mesh(g,material);mesh.receiveShadow=true;mesh.userData.disposable=true;group.add(mesh);
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
function buildings(ix:number,iz:number,group:THREE.Group,templates:Map<string,THREE.Group>){
  let approved=0;const visualBlockers:CityWall[]=[];
  for(const b of (BUILTIN_WORLD.props?.buildings||[]) as any[]){
    const p=pos(b);if(!p||!inChunk(p.x,p.z,ix,iz))continue;
    const w=Math.max(3,Math.min(30,Number(b.w??b.width??8))),d=Math.max(3,Math.min(30,Number(b.d??b.depth??9)));
    const id=String(b.id||''),tag=String(b.assetId||'')+' '+String(b.kind||'');
    const selected=/smithy/i.test(id)?'blacksmith':/chapel/i.test(id)?'church':/inn/i.test(id)?'tavern':/harbour_market/i.test(id)?'market':/bank/i.test(id)?'barracks':/toolworks|quayside|home_east/i.test(id)?'homeB':/workshop/i.test(id)?'blacksmith':/home/i.test(id)?'house':(/tavern|inn/i.test(tag)?'tavern':'house');
    const template=templates.get(selected)||templates.get('house');if(!template)continue;
    const mesh=template.clone(true);tempBox.setFromObject(mesh);tempBox.getSize(tempSize);
    // Uniform scale preserves the original artist's proportions. Avoid stretched hex buildings.
    const authentic=EASTBROOK_LAYOUT.buildings.find((e:any)=>e.id===id);
    // HIGHFLY human-scale rules: 1.70m avatar, 2.10m minimum doorway.
    // The original height metadata informs the category but not the final scale.
    const targetHeight=/chapel/.test(id)?9.0:/bank/.test(id)?10.0:/inn|market/.test(id)?8.0:/smithy|workshop|toolworks/.test(id)?7.0:/home|quayside/.test(id)?6.2:Math.max(6.4,Math.min(9.5,Number((authentic as any)?.nativeDimensions?.height??8)));
    const scale=targetHeight/Math.max(.01,tempSize.y);
    mesh.scale.setScalar(Math.max(.01,scale));
    mesh.position.set(p.x,elev(p.x,p.z)-tempBox.min.y*scale,p.z);
    mesh.rotation.y=Number(b.rot??b.rotation??0);
    mesh.userData.highflyApprovedCC0=true;group.add(mesh);approved++;
    const hw=tempSize.x*scale*.5,hd=tempSize.z*scale*.5;
    if(hw>0&&hd>0&&hw<30&&hd<30)visualBlockers.push(...outline(p.x,p.z,hw,hd,mesh.rotation.y));
  }
  // Stream collider lifecycle is tied to the corresponding approved 3D meshes.
  group.userData.highflyVisibleHouseBlockers=visualBlockers;
  return approved;
}
function trees(ix:number,iz:number,group:THREE.Group,templates:Map<string,THREE.Group>){
  // Use original ClaudeCraft-generated decoration POSITIONS with Quaternius CC0 models.
  const xs=ix*SIZE,zs=iz*SIZE;
  const all=generateDecorationsInBounds(WORLD_SEED,{minX:xs,maxX:xs+SIZE-.01,minZ:zs,maxZ:zs+SIZE-.01});
  const bounds=new THREE.Box3(),size=new THREE.Vector3();
  let placed=0;
  for(const p of all){
    const key=p.kind==='rock'?'rockNature':p.kind==='tree2'?'pineNature':p.kind==='tree'?'oakNature':null;
    if(!key||!templates.has(key))continue;
    if(placed>=55)break; // limited draw calls on S23: full decoration coordinates remain unchanged
    const source=templates.get(key)!;
    const item=source.clone(true);bounds.setFromObject(item);bounds.getSize(size);
    const target=p.kind==='rock'?1.5:6.2*Math.max(.7,p.scale);
    const scale=target/Math.max(.01,size.y);
    item.scale.setScalar(scale);item.rotation.y=Number(p.variant||0)*1.91;
    item.position.set(p.x,elev(p.x,p.z)-bounds.min.y*scale,p.z);
    item.userData.highflyApprovedCC0=true;item.userData.highflyK3Nature=true;
    group.add(item);placed++;
  }
  group.userData.highflyNatureCount=placed;
}
function dispose(group:THREE.Group){group.traverse((obj:any)=>{if(obj.userData?.disposable&&obj.geometry)obj.geometry.dispose();});group.parent?.remove(group);}
export class WorldStreamer{
  private chunks=new Map<string,THREE.Group>();private center={ix:NaN,iz:NaN};
  public approvedVisible=0;public zones=ZONES.length;public lastZone='';public city:Record<string,number>={};
  private blockers:CityWall[]=[];public shipCount=0;private gatePassages:{x:number;z:number}[]=[];
  public harborBerths:{x:number;z:number}[]=[];
  private fortress:THREE.Group|null=null;private raycaster=new THREE.Raycaster();
  constructor(private scene:THREE.Scene,private templates:Map<string,THREE.Group>,private terrainMaterial:THREE.Material){
    const harbor=buildEastbrookHarbor(WORLD_SEED);harbor.name='claudecraft-original-eastbrook-harbor';scene.add(harbor);
    const city=buildHighflyFirstCity(templates);scene.add(city.root);this.fortress=city.root;this.city=city.counts;this.blockers=city.blockers;this.gatePassages=city.passages;
    const boats=buildHighflyShips(templates);scene.add(boats.root);this.shipCount=boats.ships;this.harborBerths=boats.berths;
  }
  private load(ix:number,iz:number){const key=ix+','+iz;if(this.chunks.has(key))return;
    const group=new THREE.Group();group.name='world-sector-'+key;
    terrain(ix,iz,group,this.terrainMaterial);water(ix,iz,group);buildings(ix,iz,group,this.templates);trees(ix,iz,group,this.templates);
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
  usesNewCityCollision(x:number,z:number){return Math.hypot(x+34,z+101)<84;}
  solveMove(x:number,z:number,nx:number,nz:number){
    if(!this.usesNewCityCollision(x,z)&&!this.usesNewCityCollision(nx,nz))return {x:nx,z:nz};
    const cx=Math.floor(nx/SIZE),cz=Math.floor(nz/SIZE);
    const nearby:CityWall[]=[];
    for(let ix=cx-1;ix<=cx+1;ix++)for(let iz=cz-1;iz<=cz+1;iz++){
      const group=this.chunks.get(ix+','+iz);
      if(group)nearby.push(...(group.userData.highflyVisibleHouseBlockers??[]));
    }
    // No invisible legacy footprints: collision comes from current visual walls/houses.
    return resolveCityMove(x,z,nx,nz,[...this.blockers,...nearby]);
  }
  getGateDiagnostics(){return this.gatePassages.map(p=>({position:p,blocked:blockedByCity(p.x,p.z,this.blockers)}));}
  avoidCamera(focus:THREE.Vector3,desired:THREE.Vector3){
    if(!this.fortress)return desired;
    const ray=desired.clone().sub(focus),length=ray.length();
    if(length<.01)return desired;
    this.raycaster.set(focus,ray.normalize());this.raycaster.far=length;
    const hit=this.raycaster.intersectObjects(this.fortress.children,true)[0];
    return hit?focus.clone().addScaledVector(ray,Math.max(1.2,hit.distance-.7)):desired;
  }
  get blockerCount(){return this.blockers.length;}
  get chunkCount(){return this.chunks.size;}
  get sector(){return this.center.ix+','+this.center.iz;}
}
