// K3: original ambientCG CC0 terrain color maps over the unmodified ClaudeCraft heightfield.
// Multi-material treatment replaces K2's single vertex-colour green slab and road rectangles.
import * as THREE from 'three';
export async function loadWorldTerrainMaterial(){
  const loader=new THREE.TextureLoader();
  const load=async(name:string)=>{
    const tex=await loader.loadAsync(new URL('./assets/original/terrain/'+name,document.baseURI).href);
    tex.wrapS=tex.wrapT=THREE.RepeatWrapping;tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=4;
    return tex;
  };
  const [grass,earth,rock,paving]=await Promise.all([
    load('grass.jpg'),load('earth.jpg'),load('rock.jpg'),load('paving.jpg')
  ]);
  return new THREE.ShaderMaterial({
    uniforms:{grass:{value:grass},earth:{value:earth},rock:{value:rock},paving:{value:paving}},
    vertexShader:`
      attribute float aRoad;
      varying vec3 vPoint;varying vec3 vNormalWorld;varying float vRoad;varying vec3 vTint;
      void main(){
        vPoint=position;vNormalWorld=normalize(normal);vRoad=aRoad;vTint=color;
        gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);
      }
    `,
    fragmentShader:`
      uniform sampler2D grass,earth,rock,paving;
      varying vec3 vPoint;varying vec3 vNormalWorld;varying float vRoad;varying vec3 vTint;
      void main(){
        vec2 uv=vPoint.xz*0.11;
        vec3 g=texture2D(grass,uv).rgb;
        vec3 e=texture2D(earth,uv*0.86).rgb;
        vec3 r=texture2D(rock,uv*.95).rgb;
        vec3 p=texture2D(paving,uv*.65).rgb;
        float steep=1.0-clamp(abs(vNormalWorld.y),0.0,1.0);
        float cliff=smoothstep(.15,.57,steep);
        float path=1.0-smoothstep(1.45,4.75,vRoad);
        float textureVariation=sin(vPoint.x*.113)*sin(vPoint.z*.179)*.075+.2;
        vec3 base=mix(g,e,clamp(textureVariation,0.0,.48));
        base=mix(base,r,cliff);
        base=mix(base,mix(e,p,.40),path*.94);
        float lit=.94+.22*clamp(dot(normalize(vNormalWorld),normalize(vec3(-.5,1.0,.3))),0.0,1.0);
        gl_FragColor=vec4(base*mix(vec3(1.0),vTint,.09)*lit,1.0);
      }
    `,
    vertexColors:true,side:THREE.DoubleSide,lights:false
  });
}
