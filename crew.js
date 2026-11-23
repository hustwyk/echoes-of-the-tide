// The cast share topology, while each face retains its own proportions and portrait UVs.
// The atlas is local so both the hosted game and the offline entry use the same materials.
const TideCrew=(()=>{
  const T=THREE;
  const oval=[10,338,297,332,284,251,389,356,454,323,361,288,397,365,379,378,400,377,152,148,176,149,150,136,172,58,132,93,234,127,162,21,54,103,67,109];
  const lids=[
    [[33,246,161,160,159,158,157,173,133],[33,7,163,144,145,153,154,155,133]],
    [[263,466,388,387,386,385,384,398,362],[263,249,390,373,374,380,381,382,362]]
  ];
  const lips=[[78,191,80,81,82,13,312,311,310,415,308],[78,95,88,178,87,14,317,402,318,324,308]];
  const atlas=new T.TextureLoader().load(TideCrewSkin.atlas);
  atlas.colorSpace=T.SRGBColorSpace;atlas.anisotropy=8;
  const skin=new T.MeshStandardMaterial({map:atlas,roughness:.63,metalness:0});
  const moist=new T.MeshStandardMaterial({map:atlas,roughness:.24,metalness:.015});
  const lining=new T.MeshStandardMaterial({color:0x4b2325,roughness:.54,side:T.DoubleSide});
  const profile=new T.TextureLoader().load(TideCrewSkin.profile);
  profile.colorSpace=T.SRGBColorSpace;profile.anisotropy=8;
  skin.side=T.DoubleSide;
  skin.onBeforeCompile=shader=>{
    shader.uniforms.profileAtlas={value:profile};
    shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nattribute vec3 profileUV; attribute float skinFinish; varying float vSkinFinish; varying vec3 sideSample;')
      .replace('#include <uv_vertex>','#include <uv_vertex>\nsideSample=profileUV;vSkinFinish=skinFinish;');
    shader.fragmentShader=shader.fragmentShader.replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\nroughnessFactor=clamp(roughnessFactor+vSkinFinish,0.33,0.87);').replace('#include <common>','#include <common>\nuniform sampler2D profileAtlas;varying vec3 sideSample;varying float vSkinFinish;')
      .replace('#include <map_fragment>','diffuseColor.rgb*=mix(texture2D(map,vMapUv).rgb,texture2D(profileAtlas,sideSample.xy).rgb,sideSample.z);');
  };
  function projectProfile(g,side,part){
    const a=g.attributes.position,coords=[],finish=[];
    const face=TideCrewSkin.people[side].position;
    const region=(x,y,landmark,w,h)=>Math.exp(-((x-face[landmark*3])**2/w**2+(y-face[landmark*3+1])**2/h**2));
    for(let i=0;i<a.count;i++){
      const x=Math.abs(a.getX(i)),y=a.getY(i),z=a.getZ(i);
      const sx=a.getX(i);
      const gloss=part==='face'
        ? .055-.24*region(sx,y,1,.025,.029)-.29*region(sx,y,13,.029,.010)-.13*region(sx,y,10,.048,.044)
        : .075;
      finish.push(gloss);
      const px=(side?551:152)-(z-.012)*(side?1710:1810);
      const py=(side?239:240)-(y-(side?.117:.120))*(side?1640:1540);
      const back=(side?418:24)+(side?75:54)*T.MathUtils.smoothstep(py,162,340);
      const weight=part==='ear'?1:part==='neck'?T.MathUtils.smoothstep(z,-.035,.010):
        T.MathUtils.smoothstep(z,-.056,-.015)*T.MathUtils.smoothstep(x,.026,.056);
      coords.push(Math.max(back,px)/768,1-py/512,part==='scalp'?Math.max(weight,T.MathUtils.smoothstep(z,-.010,.015)):weight);
    }
    g.setAttribute('skinFinish',new T.Float32BufferAttribute(finish,1));
    g.setAttribute('profileUV',new T.Float32BufferAttribute(coords,3));return g;
  }
  function geometry(pos,uv,index){
    const g=new T.BufferGeometry();
    g.setAttribute('position',new T.Float32BufferAttribute(pos,3));
    if(uv)g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));
    g.setIndex(index);g.computeVertexNormals();g.computeBoundingSphere();return g;
  }
  function add(group,g,mat,name){
    const m=new T.Mesh(g,mat);m.name=name;m.castShadow=true;m.receiveShadow=true;group.add(m);return m;
  }
  // Retain the rim of the face scan and continue it around the skull beneath the helmet.
  function cranium(group,data,side){
    const pos=[],uv=[],idx=[];
    const rings=12,n=oval.length,midY=.119;
    for(let j=0;j<=rings;j++){
      const t=j/rings,a=t*Math.PI*.495,c=Math.cos(a),s=Math.sin(a);
      for(let i=0;i<n;i++){
        const k=oval[i],x=data.position[3*k],y=data.position[3*k+1],z=data.position[3*k+2];
        const h=midY+(y-midY)*c*(1+.065*Math.sin(2*a));
        pos.push(x*c*(1+.13*Math.sin(2*a)),h,z*(1-s)+.093*s);
        const u=data.uv[2*k],v=data.uv[2*k+1];
        uv.push(u,v);
        if(j<rings){
          const a0=j*n+i,b=j*n+(i+1)%n;
          idx.push(a0,b,b+n,a0,b+n,a0+n);
        }
      }
    }
    for(let i=1;i<n-1;i++)idx.push(rings*n,rings*n+i,rings*n+i+1);
    add(group,projectProfile(geometry(pos,uv,idx),side,'scalp'),skin,'头部后侧');
  }
  function neck(group,data,side){
    const pos=[],uv=[],idx=[],n=34,chin=data.uv[2*152+1],cx=data.uv[2*152];
    const rings=[[-.05,.061,.055],[-.012,.057,.050],[.025,.050,.049],[.059,.047,.046],[.086,.049,.046]];
    rings.forEach(([y,w,d],j)=>{
      for(let k=0;k<=n;k++){
        const a=2*Math.PI*k/n,s=Math.sin(a),c=Math.cos(a);
        pos.push(w*s,y,.009-d*c);uv.push(cx-.067*s,chin-.035-.063*(1-j/(rings.length-1)));
        if(j<rings.length-1&&k<n){const i=j*(n+1)+k;idx.push(i,i+n+1,i+1,i+1,i+n+1,i+n+2);}
      }
    });
    add(group,projectProfile(geometry(pos,uv,idx),side,'neck'),skin,'颈部');
  }
  function ears(group,data,side){
    const pos=[],uv=[],idx=[];
    for(let e=0;e<2;e++){
      const s=e===0?1:-1,edge=e===0?234:454,base=pos.length/3;
      const [u0,v0,u1,v1]=data.ears[e],xRoot=Math.abs(data.position[3*edge]);
      const yRoot=data.position[3*edge+1]-.010,zRoot=data.position[3*edge+2]+.019,n=24;
      for(let j=0;j<=5;j++){
        const r=Math.max(.007,j/5);
        for(let k=0;k<n;k++){
          const a=k*2*Math.PI/n,c=Math.cos(a),sn=Math.sin(a);
          const lip=Math.exp(-((r-.73)**2)/.026)*.0048;
          pos.push(s*(xRoot-.005+.013*(1-r*r)+lip+.0023*sn),yRoot+.033*r*sn,zRoot+.014*r*c+.003*r*sn);
          uv.push((u0+u1)/2-s*(u1-u0)*.38*r*c,(v0+v1)/2+(v1-v0)*.415*r*sn);
          if(j<5){
            const a0=base+j*n+k,b=base+j*n+(k+1)%n;
            if(s===1)idx.push(a0,b,b+n,a0,b+n,a0+n);else idx.push(a0,b+n,b,a0,a0+n,b+n);
          }
        }
      }
    }
    const g=geometry(pos,uv,idx);add(group,projectProfile(g,side,'ear'),skin,'耳廓');
  }
  function face(group,side){
    const data=TideCrewSkin.people[side],source=data.position,skinIndices=[],eyes=[],mouth=[];
    const edges=[...lids,lips].map(pair=>new Set(pair.flat()));
    const topology=TideCrewSkin.index;
    for(let j=0;j<topology.length;j+=3){
      const tri=topology.slice(j,j+3);
      const hole=edges.findIndex(edge=>tri.every(i=>edge.has(i)));
      (hole===2?mouth:hole>=0?eyes:skinIndices).push(...tri);
    }
    const g=geometry(source,data.uv,skinIndices),close=new Float32Array(source.length),say=new Float32Array(source.length),round=new Float32Array(source.length);
    for(const [upper,lower] of lids)for(let k=1;k<upper.length-1;k++){
      const a=3*upper[k],b=3*lower[k];
      for(let axis=0;axis<3;axis++){
        const mid=.13*source[a+axis]+.87*source[b+axis]-(axis===2?.0014:0);
        close[a+axis]=mid-source[a+axis];close[b+axis]=mid-source[b+axis];
      }
    }
    const endY=source[3*152+1],lipY=source[3*14+1];
    for(let i=0;i<source.length/3;i++){
      const x=source[3*i],y=source[3*i+1];
      const weight=(1-T.MathUtils.smoothstep(y,lipY-.001,lipY+.004))*(1-T.MathUtils.smoothstep(Math.abs(x),.025,.063));
      say[3*i+1]=-weight*(.003+.003*T.MathUtils.smoothstep(y,endY,lipY));
      say[3*i+2]=weight*.002;
      const lipX=x-source[3*13],mask=Math.exp(-(lipX*lipX/.00080+(y-lipY)**2/.00013));
      round[3*i]=-lipX*.19*mask;
      round[3*i+2]=-.0038*mask;
    }
    for(const i of lips[0]){say[3*i+1]=.0005;say[3*i+2]=0;}
    g.morphTargetsRelative=true;g.morphAttributes.position=[close,say,round].map(a=>new T.BufferAttribute(a,3));
    add(group,projectProfile(g,side,'face'),skin,'face');
    const inner=source.slice();
    for(const i of new Set(eyes))inner[3*i+2]+=.0004;
    add(group,geometry(inner,data.uv,eyes),moist,'眼睛');
    for(const i of new Set(mouth)){inner[3*i+2]+=.0022;inner[3*i+1]+=lips[1].includes(i)?-.006:.001;}
    add(group,geometry(inner,null,mouth),lining,'口腔');
    cranium(group,data,side);ears(group,data,side);neck(group,data,side);
    if(side){
      const g=new T.SphereGeometry(1,36,24),pos=g.attributes.position,uv=g.attributes.uv;
      for(let i=0;i<pos.count;i++){
        const x=pos.getX(i),y=pos.getY(i),z=pos.getZ(i);
        const winding=1+.045*Math.cos(Math.atan2(x,z)*9+y*6);
        pos.setXYZ(i,.037*x*winding,.117+.039*y,.089+.040*z*winding);
        uv.setXY(i,(426-24*z)/768,1-(259-31*y)/512);
      }
      g.computeVertexNormals();g.computeBoundingSphere();
      const m=new T.MeshStandardMaterial({map:profile,roughness:.71});add(group,g,m,'盘发');
    }
  }
  function express(mesh,id,time,talking,rounded=0,dt=1/60){
    const period=id?4.73:5.21;
    const t=(time+(id?2.03:1.23))%period;
    const blink=T.MathUtils.smoothstep(t,.04,.126)*(1-T.MathUtils.smoothstep(t,.14,.263));
    mesh.morphTargetInfluences[0]=blink;
    const jaw=typeof talking==='number'?talking:talking ? .44+.31*Math.sin(time*21+id)+.23*Math.sin(time*31.2):0;
    const weights=mesh.morphTargetInfluences;
    weights[1]+=(Math.max(0,jaw)-weights[1])*(1-Math.exp(-dt*(jaw>weights[1]?42:26)));
    weights[2]+=(rounded-weights[2])*(1-Math.exp(-dt*25));
  }
  return {face,express};
})();
