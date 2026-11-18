// Water collects in the worn top faces of the north-light forecourt. A boot displaces
// the thin film. Its impression gradually fills again in the rain.
const TideRainApron=(()=>{
  const T=THREE;
  let loading;
  function load(){
    if(window.TideApronConcrete)return Promise.resolve(window.TideApronConcrete);
    if(!loading)loading=new Promise(resolve=>{
      const tag=document.createElement('script');tag.src='assets/apron-concrete.js';
      tag.onload=()=>{tag.remove();resolve(window.TideApronConcrete);};
      tag.onerror=()=>{tag.remove();loading=null;resolve(null);};document.head.append(tag);
    });
    return loading;
  }
  function create(scene,material,own){
    const scanned={value:0};
    let closed=false;
    const ready=load().then(async data=>{
      if(!data||closed)return;
      const loader=new T.TextureLoader(),results=await Promise.allSettled(data.map(uri=>loader.loadAsync(uri)));
      const maps=results.filter(v=>v.status==='fulfilled').map(v=>v.value);
      if(closed||maps.length!==3){maps.forEach(t=>t.dispose());return;}
      for(const map of maps){own(map);map.wrapS=map.wrapT=T.RepeatWrapping;map.anisotropy=8;}
      maps[0].colorSpace=T.SRGBColorSpace;
      [material.map,material.normalMap,material.roughnessMap]=maps;
      material.normalScale.set(.71,.71);material.needsUpdate=true;scanned.value=1;
    });
    const time={value:0},compile=material.onBeforeCompile,originalKey=material.customProgramCacheKey();
    material.customProgramCacheKey=()=>originalKey+'/rain-apron';
    material.onBeforeCompile=function(s,renderer){
      compile.call(this,s,renderer);
      s.uniforms.apronTime=time;s.uniforms.apronScanned=scanned;
      s.fragmentShader=s.fragmentShader.replace('#include <common>',`#include <common>
        uniform float apronTime,apronScanned;
        float apronHash(vec2 p){return fract(sin(dot(p,vec2(41.27,117.21)))*1587.584);}
        float apronNoise(vec2 p){
          vec2 u=fract(p);u=u*u*(3.-2.*u);vec2 cell=floor(p);
          return mix(mix(apronHash(cell),apronHash(cell+vec2(1.,0.)),u.x),
                     mix(apronHash(cell+vec2(0.,1.)),apronHash(cell+vec2(1.)),u.x),u.y);
        }
        vec2 apronRipple(vec2 p){
          vec2 cell=floor(p);
          float seed=fract(sin(dot(cell,vec2(12.81,57.63)))*1478.21);
          float age=fract(apronTime*.64+seed*11.);
          vec2 v=fract(p)-.5-.38*vec2(sin(seed*62.9),cos(seed*83.));
          float d=length(v),front=d-(.018+.46*age);
          float skirt=exp(-abs(front)*28.)*(1.-smoothstep(.18,.83,age));
          return v/max(.015,d)*sin(front*95.)*skirt;
        }`).replace('#include <metalnessmap_fragment>',`#include <metalnessmap_fragment>
          vec2 ground=slabPosition.xz;
          float swale=.52*apronNoise(ground*.66)+.30*apronNoise(ground*1.87)+.18*apronNoise(ground*5.2);
          float high=mix(.48,armSample.b,apronScanned);
          float film=smoothstep(.48,.65,swale+(.5-high)*.25)*smoothstep(.88,.99,slabFace.y);
          diffuseColor.rgb*=mix(vec3(.93,.96,.97),vec3(.41,.51,.53),film);
          roughnessFactor=mix(roughnessFactor,.21+.08*armSample.g,film);`)
        .replace('#include <clearcoat_normal_fragment_begin>',`#include <clearcoat_normal_fragment_begin>
          if(film>.001){
            vec2 drops=apronRipple(ground*3.2)+.44*apronRipple(ground*5.3+vec2(1.7,4.8));
            vec3 filmNormal=normalize((viewMatrix*vec4(.037*drops.x,1.,.037*drops.y,0.)).xyz);
            normal=normalize(mix(normal,filmNormal,film*.93));
          }`);
    };
    // Stamp a rubber work-boot contact patch, including separated heel and toe blocks.
    const c=document.createElement('canvas');c.width=128;c.height=256;
    const pen=c.getContext('2d');
    function lug(x,y,w,h,angle){
      pen.save();pen.translate(x,y);pen.rotate(angle);
      pen.fillStyle='rgba(239,235,223,.86)';pen.fillRect(-w/2,-h/2,w,h);pen.restore();
    }
    for(let i=0;i<9;i++){
      const y=22+19*i,span=35+11*Math.sin(Math.PI*i/9);
      for(const side of [-1,1]){lug(64+side*span*.49,y,span*.87,9,-side*.26);lug(64+side*span,y+5,8,12,side*.24);}
    }
    for(let j=0;j<3;j++)for(const side of [-1,1])lug(64+side*(j===2?16:19),195+j*15,j===2?28:34,10,side*.09);
    const texture=own(new T.CanvasTexture(c));texture.anisotropy=4;
    const mat=own(new T.MeshStandardMaterial({map:texture,color:0x424844,transparent:true,depthWrite:false,
      roughness:.68,metalness:.02,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1}));
    const geo=own(new T.PlaneGeometry(.157,.303));geo.rotateX(-Math.PI/2);
    const count=40,ages=new T.InstancedBufferAttribute(new Float32Array(count).fill(-1000),1);
    geo.setAttribute('imprintTime',ages);
    mat.onBeforeCompile=s=>{
      s.uniforms.apronTime=time;
      s.vertexShader=s.vertexShader.replace('#include <common>','#include <common>\nattribute float imprintTime;varying float printTime;')
        .replace('#include <begin_vertex>','#include <begin_vertex>\nprintTime=imprintTime;');
      s.fragmentShader=s.fragmentShader.replace('#include <common>','#include <common>\nuniform float apronTime;varying float printTime;')
        .replace('#include <map_fragment>','#include <map_fragment>\ndiffuseColor.a*=.42*(1.-smoothstep(1.5,14.,apronTime-printTime));');
    };
    const tracks=new T.InstancedMesh(geo,mat,count);tracks.count=0;tracks.frustumCulled=false;
    tracks.name='雨中鞋印';tracks.receiveShadow=true;scene.add(tracks);
    const last=Array.from({length:4},()=>new T.Vector3(Infinity,0,0)),toe=new T.Vector3(),matrix=new T.Object3D();
    let slot=0;
    function update(g,actors){
      time.value=g.time;
      for(let i=0;i<2;i++){
        const p=g.players[i];
        if(!p.grounded||p.ground?.kind!=='signalpier'||p.speed<.45)continue;
        for(let foot=0;foot<2;foot++){
          const boot=actors[i].userData.rig.bones['boot'+foot];
          boot.updateWorldMatrix(true,false);toe.set(0,-.05,-.051).applyMatrix4(boot.matrixWorld);
          const y=TideTraversal.surfaceHeight(p.ground,toe.x,toe.z);
          if(toe.y-y>.067||toe.y<y-.10)continue;
          const prev=last[2*i+foot];
          if(prev.distanceToSquared(toe)<.47*.47)continue;
          prev.copy(toe);matrix.position.set(toe.x,y+.0014,toe.z);
          const e=boot.matrixWorld.elements;matrix.rotation.y=Math.atan2(e[8],e[10]);matrix.updateMatrix();
          tracks.setMatrixAt(slot,matrix.matrix);ages.setX(slot,g.time);slot=(slot+1)%count;
          tracks.count=Math.min(count,tracks.count+1);tracks.instanceMatrix.needsUpdate=true;ages.needsUpdate=true;
        }
      }
    }
    return {update,ready,dispose(){closed=true;tracks.removeFromParent();tracks.dispose();}};
  }
  return {create,load};
})();
