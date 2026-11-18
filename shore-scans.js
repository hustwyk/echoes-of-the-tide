// Real coastal photogrammetry placed against the first pier's seaward toes.
// Both silhouettes, UVs and PBR atlases come from Poly Haven. See shore-scans-sources.json.
window.TideShoreScans=(()=>{
  const T=THREE;let dataLoad=null;
  function load(){
    if(window.TideShoreScanData)return Promise.resolve();
    if(!dataLoad)dataLoad=new Promise((resolve,reject)=>{
      const script=document.createElement('script');script.src='assets/shore-scan-data.js';
      script.onload=resolve;script.onerror=()=>{dataLoad=null;script.remove();reject(new Error('海岩纹理暂未载入'));};
      document.head.append(script);
    });
    return dataLoad;
  }
  // Coordinates denote the centre of the scan footprint and the survey's zero elevation.
  // All toes end on the shore side of the launch approach and below the standing surfaces.
  const placements=[
    {id:1,x:-10.63,y:-4.93,z:5.59,yaw:1.38,scale:[1.07,1.55,1.04],label:'西堤下蚀沟'},
    {id:0,x:-6.92,y:-4.66,z:9.46,yaw:-.28,scale:[1.13,1.91,1.11],label:'西堤头潮岩'},
    {id:0,x:-8.85,y:-5.04,z:10.65,yaw:-1.54,scale:[.88,1.51,.84],label:'西堤脚碎块'},
    {id:1,x:10.43,y:-4.93,z:3.93,yaw:-1.41,scale:[1.05,1.71,1.01],label:'东堤下蚀沟'},
    {id:0,x:6.56,y:-4.71,z:8.59,yaw:.65,scale:[1.03,1.84,1.11],label:'东堤头潮岩'}
  ];
  function decode(str,Type){const raw=atob(str),buf=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)buf[i]=raw.charCodeAt(i);return new Type(buf.buffer);}
  function geometry(src,lod){
    const indices=decode(lod.index,Uint16Array),packed=decode(lod.pos,Uint16Array),positions=new Float32Array(packed.length);
    const width=src.max.map((x,i)=>x-src.min[i]),base=[-width[0]*.5,src.min[1],-width[2]*.5];
    for(let i=0;i<packed.length;i++){const j=i%3;positions[i]=base[j]+width[j]*packed[i]/65535;}
    const g=new T.BufferGeometry();g.setIndex(new T.BufferAttribute(indices,1));g.setAttribute('position',new T.BufferAttribute(positions,3));
    g.setAttribute('normal',new T.BufferAttribute(decode(lod.normal,Int8Array),3,true));g.setAttribute('uv',new T.BufferAttribute(decode(lod.uv,Uint16Array),2,true));
    g.computeBoundingBox();g.computeBoundingSphere();return g;
  }
  function create(scene,g){
    const root=new T.Group();root.name='北岬 · 实测海岩护岸';scene.add(root);const res=new Set(),own=x=>(res.add(x),x),jobs=[];
    const time={value:0},mean={value:Number.isFinite(g?.cues?.water)?g.cues.water:-4};
    function texture(uri,srgb){const i=new Image(),t=own(new T.Texture(i));t.flipY=false;t.anisotropy=8;if(srgb)t.colorSpace=T.SRGBColorSpace;
      jobs.push(new Promise((resolve,reject)=>{i.onload=()=>{t.needsUpdate=true;resolve();};i.onerror=()=>reject(new Error('海岩图谱解码失败'));}));i.src=uri;return t;}
    const scans=(window.TideShoreScanData||[]).map(s=>{
      const arm=texture(s.maps.arm,false);const mat=own(new T.MeshStandardMaterial({map:texture(s.maps.diff,true),normalMap:texture(s.maps.nor_gl,false),
        color:0xcdd1c8,normalScale:new T.Vector2(1,-1),roughnessMap:arm,aoMap:arm,aoMapIntensity:.76,metalness:0,roughness:1,side:T.DoubleSide}));
      mat.name=s.id+' · 浪溅面';mat.customProgramCacheKey=()=>'shore-scan-wet23';
      mat.onBeforeCompile=shader=>{
        shader.uniforms.shoreTime=time;shader.uniforms.shoreMean=mean;
        shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 shoreP;')
          .replace('#include <worldpos_vertex>','#include <worldpos_vertex>\nshoreP=(modelMatrix*vec4(transformed,1.)).xyz;');
        shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 shoreP; uniform float shoreTime,shoreMean;')
          .replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>
            vec2 shoreXZ=shoreP.xz;float t=shoreTime;
            shoreXZ.x-=.18*cos(dot(shoreP.xz,vec2(.23,.11))+t*1.12);
            shoreXZ.x=shoreP.x-.18*cos(dot(shoreXZ,vec2(.23,.11))+t*1.12);
            float swell=.46*sin(dot(shoreXZ,vec2(.23,.11))+t*1.12)+.34*sin(dot(shoreXZ,vec2(-.17,.29))-t*.88)+.18*sin(dot(shoreXZ,vec2(.49,-.41))+t*1.42)+.09*sin(dot(shoreXZ,vec2(.81,.62))-t*1.64);
            float height=shoreP.y-shoreMean;
            float damp=1.-smoothstep(.13,.67,height-swell);
            float stained=1.-smoothstep(.65,1.22,height);
            diffuseColor.rgb*=mix(vec3(1.),vec3(.79,.83,.79),stained)*mix(vec3(1.),vec3(.61,.68,.67),damp);
            roughnessFactor=mix(roughnessFactor,max(.19,roughnessFactor*.39),damp);
          `);};
      return {m:mat,levels:s.levels.map(l=>own(geometry(s,l))),tri:s.levels.map(l=>l.triangles)};
    });
    for(const a of placements){const s=scans[a.id];if(!s)continue;const lod=new T.LOD();lod.name=a.label;lod.position.set(a.x,a.y,a.z);lod.rotation.y=a.yaw;lod.scale.fromArray(a.scale);
      s.levels.forEach((geometry,i)=>{const o=new T.Mesh(geometry,s.m);o.name=a.label+' L'+i;o.receiveShadow=true;o.castShadow=true;lod.addLevel(o,[0,18,42][i],[0,.12,.15][i]);});root.add(lod);}
    // The existing quay aprons end at z=5.80. These two battered tidal toes lap against that face.
    // The exposed upper faces fall away from the quay; by the end joint they disappear below a rising tide.
    const apron=own(TideConcrete.material(0x939689,-3.95));apron.name='旧码头 · 露骨料堤脚';apron.normalScale.set(.50,.50);
    const pos=[],norm=[],uv=[],indices=[],A=new T.Vector3(),B=new T.Vector3(),C=new T.Vector3();
    function face(a,b,c,d){const idx=pos.length/3;A.fromArray(a);B.fromArray(b).sub(A);C.fromArray(c).sub(A);const n=B.cross(C).normalize();for(const v of [a,b,c,d]){pos.push(...v);norm.push(n.x,n.y,n.z);uv.push(v[0],v[2]);}indices.push(idx,idx+1,idx+2,idx,idx+2,idx+3);}
    for(const side of [-1,1]){
      const end=side===1?9.96:9.69,begin=5.812,sections=3;
      function loop(z){const q=(z-begin)/(end-begin),inner=side*(side===1?5.81+q*.45:5.87+q*.43),outer=side*(6.55+q*.25);
        const crown=-2.66-q*(side===1?1.94:1.82),toe=crown-.23;
        return [[inner,crown-.12,z],[inner+.09*side,crown,z],[outer-.14*side,toe,z],[outer,toe-.14,z],[outer+.29*side,-5.68,z],[inner-.13*side,-5.68,z]];}
      for(let piece=0;piece<sections;piece++){
        const l=loop(begin+(end-begin)*piece/sections+.006),r=loop(begin+(end-begin)*(piece+1)/sections-.006);
        for(let j=0;j<l.length;j++){const k=(j+1)%l.length;const quad=[l[j],r[j],r[k],l[k]];if(side<0)quad.reverse();face(...quad);}
        for(const [row,rev] of [[l,side<0],[r,side===1]]){const m=row.length;for(let k=1;k<m-1;k++){let tr=[row[0],row[k],row[k+1],row[k+1]];if(rev)tr.reverse();face(...tr);}}
      }
    }
    // Octagonal concrete bents bear directly against the 2.96 m-deep existing deck shells.
    // The cap noses and two shallow recessed lift joints remain legible from the low helm.
    function section(cx,cz,y,width,depth,chamfer){
      const x=width*.5,z=depth*.5,r=chamfer;
      return [[-x+r,-z],[x-r,-z],[x,-z+r],[x,z-r],[x-r,z],[-x+r,z],[-x,z-r],[-x,-z+r]].map(([a,b])=>[cx+a,y,cz+b]);
    }
    function course(cx,cz,width,depth,levels){
      let last=null;
      for(const [y,w,d] of levels){
        const ring=section(cx,cz,y,width*w,depth*d,Math.min(.11,width*w*.16,depth*d*.16));
        if(last){for(let j=0;j<8;j++){const k=(j+1)%8;face(last[j],ring[j],ring[k],last[k]);}}
        last=ring;
      }
      for(let j=1;j<7;j++)face(last[0],last[j+1],last[j],last[j]);
    }
    function pile(x,z,deckY,width,depth,joint){
      const bearing=deckY-2.96;
      course(x,z,width,depth,[[-6.70,1.16,1.17],[-4.47,1.10,1.12],[joint-.018,1.04,1.045],
        [joint-.009,1.012,1.019],[joint+.013,1.012,1.019],[joint+.021,1.04,1.045],
        [bearing-.40,.976,.982],[bearing-.35,1.05,1.06],[bearing-.15,1.29,1.33],[bearing+.06,1.29,1.33]]);
    }
    function pileCap(x,z,deckY,width,depth){const b=deckY-2.96;
      course(x,z,width,depth,[[b-.28,.97,.88],[b-.21,1,1],[b-.066,1,1],
        [b-.053,.994,.973],[b-.038,.994,.973],[b-.024,1,1],[b+.085,1,1]]);
    }
    for(const side of [-1,1]){
      pile(side*6.035,1.05,0,.68,.76,-4.08);pile(side*6.035,5.18,0,.74,.82,-3.86);
      pile(side*4.01,5.19,0,.69,.81,-3.95);
      pileCap(side*6.035,3.14,0,.77,5.02);pileCap(side*5.05,5.22,0,3.02,.77);
    }
    // The three stepped blocks are stationary. Keep the adjacent winch cradle, ladder foot,
    // spring fender and the water gaps beneath the playable jump clear.
    pile(-3.25,6.10,.05,.62,.64,-3.92);pileCap(-2.70,6.08,.05,1.94,.67);
    pile(-3.28,7.14,.34,.69,.72,-3.78);pileCap(-2.70,7.13,.34,2.01,.69);
    pile(-3.165,8.53,.68,.59,.66,-3.61);pileCap(-3.16,8.54,.68,.88,.86);
    pile(-1.91,8.85,.68,.47,.49,-3.74);pileCap(-1.92,8.84,.68,.76,.69);
    const concrete=own(new T.BufferGeometry());concrete.setAttribute('position',new T.Float32BufferAttribute(pos,3));concrete.setAttribute('normal',new T.Float32BufferAttribute(norm,3));concrete.setAttribute('uv',new T.Float32BufferAttribute(uv,2));concrete.setIndex(indices);concrete.computeBoundingSphere();
    const shoulder=new T.Mesh(concrete,apron);shoulder.name='北岬 · 堤角承台与斜身护岸趾座';shoulder.castShadow=shoulder.receiveShadow=true;root.add(shoulder);
    let alive=true;
    // The geometry also supports local image-data URLs when the game is opened from disk.
    const ready=Promise.all(jobs).then(()=>{if(alive)root.userData.atlasesReady=true;return root;});ready.catch(()=>{});
    function update(g,t){time.value=Number.isFinite(t)?t:(g?.time||0);if(Number.isFinite(g?.cues?.water))mean.value=g.cues.water;}
    function dispose(){if(!alive)return;alive=false;root.removeFromParent();for(const o of res)o.dispose();root.clear();}
    return {root,ready,update,dispose};
  }
  return {create,load,placements};
})();
