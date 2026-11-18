// North Cape stone lantern gallery. The single packed local map uses albedo
// luminance and OpenGL normal XY from Old Stone Wall 02 by Charlotte Baglioni.
// Poly Haven, CC0: https://polyhaven.com/a/old_stone_wall_02
const TideGalleryWall=(()=>{
  const T=THREE,tau=2*Math.PI;
  const bottom=14.55,shaftTop=20.13,rad=y=>3.075-(y-4)*.24/3.52;
  const nrand=i=>{const v=Math.sin(i*127.17+30.15)*43758.5453;return v-Math.floor(v);};
  const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
  const angleDist=(a,b)=>Math.atan2(Math.sin(a-b),Math.cos(a-b));
  const windows=[3,4].flatMap(i=>[0,1].map(side=>{
    const a=(i*1.33+side*Math.PI*.86)%tau,y=4+i*3.52+1.4;
    return {a,y,half:.282/rad(y),warm:i===3};
  }));
  function weatherField(){
    const w=256,h=192,data=new Uint8Array(w*h*4),drips=[];
    function weatherNoise(x,y,wx,hy,seed){
      const xx=x*wx, yy=y*hy,ix=Math.floor(xx),iy=Math.floor(yy);
      const fx=xx-ix,fy=yy-iy,f=fx*fx*(3-2*fx),g=fy*fy*(3-2*fy);
      const hash=(i,j)=>nrand(((i%wx+wx)%wx)*178.93+j*7.31+seed);
      const u=hash(ix,iy)*(1-f)+hash(ix+1,iy)*f,v=hash(ix,iy+1)*(1-f)+hash(ix+1,iy+1)*f;
      return u+(v-u)*g;
    }
    for(let j=0;j<20;j++){
      const a=tau*(j+.28)/20;
      for(let k=0;k<4;k++){
        const i=j*8+k;drips.push([a+(k-1.5)*(.019+.013*nrand(i)),19.66+.65*nrand(i+6),.64+3.10*nrand(i+1),.005+.032*nrand(i+2),.23+.62*nrand(i+3),nrand(i+31)>.84?.46:0]);
      }
    }
    for(const win of windows)for(const side of [-1,1]){
      drips.push([win.a+side*win.half,win.y-.49,.83,.027,.46,.24]);
      drips.push([win.a+side*win.half*.8,win.y-.48,.42,.013,.56,.36]);
    }
    for(let j=0;j<h;j++)for(let i=0;i<w;i++){
      const u=(i+.5)/w,v=(j+.5)/h,y=14.25+v*7.6,a=u*tau;
      const large=weatherNoise(u,v,9,4,10),mid=weatherNoise(u,v,23,12,32),small=weatherNoise(u,v,53,35,15);
      const wash=clamp(.60+(large-.5)*.97+(mid-.5)*.43+(small-.5)*.23);
      let damp=.08+(1-wash)*.20,iron=0;
      for(const d of drips){
        const down=d[1]-y;if(down<0||down>d[2])continue;
        const delta=angleDist(a,d[0]+.010*Math.sin(down*2+d[0]*7)*Math.min(down,1));
        const s=delta/(d[3]*(.65+.38*down/d[2]));if(Math.abs(s)>3)continue;
        const intensity=Math.exp(-s*s)*Math.pow(1-down/d[2],.65)*(.75+.4*small);
        damp+=intensity*d[4];iron+=intensity*d[5];
      }
      const at=(j*w+i)*4;
      data[at]=Math.round(wash*255);data[at+1]=Math.round(clamp(damp)*255);data[at+2]=Math.round(clamp(iron)*255);data[at+3]=255;
    }
    const t=new T.DataTexture(data,w,h,T.RGBAFormat);t.wrapS=T.RepeatWrapping;t.minFilter=T.LinearFilter;t.magFilter=T.LinearFilter;t.needsUpdate=true;return t;
  }
  let imageSource=null;
  function loadStone(){
    if(window.TideGalleryLimestone)return Promise.resolve(window.TideGalleryLimestone);
    if(!imageSource)imageSource=new Promise((resolve,reject)=>{
      const script=document.createElement('script');script.src='assets/gallery-limestone.js';
      script.onload=()=>resolve(window.TideGalleryLimestone);
      script.onerror=()=>{script.remove();imageSource=null;reject(new Error('塔身石面纹理暂未加载'));};
      document.head.appendChild(script);
    });
    return imageSource;
  }
  function create(scene,g){
    if(g?.world&&!g.world.gallery)return {dispose(){}};
    const root=new T.Group();root.position.set(14,0,-91);root.name='北岬 · 石砌塔肩';scene.add(root);
    const resources=[],own=x=>(resources.push(x),x);
    let alive=true;
    const scan=own(new T.Texture());
    const ready=loadStone().then(url=>new T.ImageLoader().loadAsync(url)).then(image=>{
      if(alive){scan.image=image;scan.needsUpdate=true;}
    }).catch(()=>{});
    scan.wrapS=scan.wrapT=T.RepeatWrapping;scan.anisotropy=4;scan.colorSpace=T.NoColorSpace;
    const weather=own(weatherField());
    const masonry=own(new T.MeshStandardMaterial({color:0xffffff,roughness:.89,map:scan,normalMap:scan,vertexColors:true}));
    masonry.name='蚀灰砂岩 · 微表面/海雨潮斑';
    masonry.onBeforeCompile=s=>{
      s.uniforms.tideRainWash={value:weather};
      s.vertexShader=s.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 tideTowerPoint;').replace('#include <begin_vertex>','#include <begin_vertex>\ntideTowerPoint=position;');
      s.fragmentShader=s.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 tideTowerPoint;\nuniform sampler2D tideRainWash;')
      .replace('#include <map_fragment>',`
        vec3 stoneScan=texture2D(map,vMapUv).rgb;
        float stoneValue=clamp((stoneScan.r-.344)*4.36,0.,1.);
        float towerA=atan(tideTowerPoint.x,tideTowerPoint.z)*.159154943;
        vec3 weather=texture2D(tideRainWash,vec2(towerA,(tideTowerPoint.y-14.25)/7.60)).rgb;
        float wash=clamp(weather.r+1.16*(stoneScan.r-.47),0.,1.);
        vec3 rock=mix(vec3(.165,.152,.126),vec3(.465,.439,.342),stoneValue);
        vec3 lime=mix(vec3(.30,.301,.265),vec3(.75,.754,.657),stoneValue);
        vec3 stone=mix(rock,lime,wash);
        stone*=mix(vec3(1.),vec3(.47,.53,.47),weather.g);
        stone=mix(stone,stone*vec3(.74,.48,.34),weather.b*.80);
        diffuseColor.rgb*=stone;
      `)
      .replace('#include <normal_fragment_maps>',`
        vec2 relief=(stoneScan.gb*2.-1.)*mix(.92,.46,wash);
        normal=normalize(tbn*vec3(relief,sqrt(max(.12,1.-dot(relief,relief)))));
      `)
      .replace('#include <roughnessmap_fragment>','float roughnessFactor=clamp(.92-.29*weather.g-.11*(1.-wash)+.06*stoneValue,.52,.96);');
    };
    masonry.customProgramCacheKey=()=>'tide-lighthouse-stone24-v1';
    const standard=(name,color,roughness,metalness,extra={})=>{const m=own(new T.MeshStandardMaterial({color,roughness,metalness,vertexColors:true,...extra}));m.name=name;return m;};
    const iron=standard('嵌窗 · 旧铸铁、压条和栓头',0x55534a,.65,.57);
    const warm=standard('塔内旧钨丝灯的磨砂玻璃',0x8f7754,.42,.08,{emissive:0xb67438,emissiveIntensity:.52});
    const cool=standard('海侧夹丝玻璃',0x527078,.27,.22,{emissive:0x28393b,emissiveIntensity:.20});
    const batches=new Map();
    function batch(mat){if(!batches.has(mat))batches.set(mat,{p:[],n:[],uv:[],c:[]});return batches.get(mat);}
    const V=(x,y,z)=>new T.Vector3(x,y,z);
    const polar=(a,y,r)=>V(Math.sin(a)*r,y,Math.cos(a)*r);
    function face(mat,p,uv,col=1,normals=null){
      const b=batch(mat),normal=normals?null:p[1].clone().sub(p[0]).cross(p[2].clone().sub(p[0])).normalize();
      const colors=Array.isArray(col)?col:[col,col,col];
      for(const i of [0,1,2,0,2,3]){
        const n=normals?normals[i]:normal;
        b.p.push(p[i].x,p[i].y,p[i].z);b.n.push(n.x,n.y,n.z);b.uv.push(uv[i][0],uv[i][1]);b.c.push(...colors);
      }
    }
    const square=[[0,0],[1,0],[1,1],[0,1]];
    function wallPoint(a,y,tangent,radius){return polar(a,y,radius).add(V(Math.cos(a)*tangent,0,-Math.sin(a)*tangent));}
    // Side elevations are tiled at their physical photographed scale (2.1 m).
    // The two-level arches have polygonal openings, through reveals, deep glass and real sills.
    const angles=Array.from({length:97},(_,i)=>tau*i/96);
    const heights=[bottom,shaftTop,...[...Array(15)].map((_,i)=>14.66+i*.38).filter(y=>y<shaftTop)];
    for(const w of windows){angles.push((w.a-w.half+tau)%tau,(w.a+w.half)%tau);heights.push(w.y-.53,w.y+.53);}
    angles.sort((a,b)=>a-b);heights.sort((a,b)=>a-b);
    function shaftPanel(a,b,l,h){
      const p=[polar(a,l,rad(l)),polar(b,l,rad(l)),polar(b,h,rad(h)),polar(a,h,rad(h))];
      const normals=[a,b,b,a].map(k=>V(Math.sin(k),.24/3.52,Math.cos(k)).normalize());
      const uv=[[a,l],[b,l],[b,h],[a,h]].map(([ang,y])=>[ang/tau*7,(y-bottom)/2.1+.16]);
      face(masonry,p,uv,1,normals);
    }
    for(let i=0;i<angles.length-1;i++)for(let j=0;j<heights.length-1;j++){
      const a=angles[i],b=angles[i+1],l=heights[j],h=heights[j+1],m=(a+b)/2,y=(l+h)/2;
      if(!windows.some(w=>Math.abs(angleDist(m,w.a))<w.half&&Math.abs(y-w.y)<.53))shaftPanel(a,b,l,h);
    }
    function box(a,u,y,r,w,h,d,material,shade=1){
      const v=(i,j,k)=>wallPoint(a,y+j*h/2,u+i*w/2,r+k*d/2);
      const faces=[[[ -1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]], [[1,-1,-1],[-1,-1,-1],[-1,1,-1],[1,1,-1]], [[1,-1,1],[1,-1,-1],[1,1,-1],[1,1,1]], [[-1,-1,-1],[-1,-1,1],[-1,1,1],[-1,1,-1]], [[-1,1,1],[1,1,1],[1,1,-1],[-1,1,-1]], [[-1,-1,-1],[1,-1,-1],[1,-1,1],[-1,-1,1]]];
      const uvLengths=[[w,h],[w,h],[d,h],[d,h],[w,d],[w,d]];
      faces.forEach((q,i)=>face(material,q.map(t=>v(...t)),square.map(([x,z])=>[.12+x*uvLengths[i][0]/2.1,.36+z*uvLengths[i][1]/2.1]),shade));
    }
    for(const wi of windows){
      const a=wi.a,y=wi.y,r=rad(y);
      box(a,0,y,r-.27,.611,1.13,.058,iron,.58);
      box(a,0,y,r-.228,.50,1.01,.029,wi.warm?warm:cool,1);
      for(const s of [-1,1]){
        box(a,s*.252,y,r-.167,.044,1.06,.112,iron,1.04);
        box(a,0,y+s*.496,r-.166,.493,.035,.112,iron,.93);
        for(let row=0;row<3;row++)
          box(a,s*.314,y-.347+row*.349,r-.064,.091,.344,.337,masonry,.85+row*.038);
      }
      box(a,.005,y,r-.150,.020,.977,.038,iron,.70);
      box(a,0,y+.065,r-.151,.496,.029,.038,iron,.76);
      box(a,0,y-.550,r+.020,.793,.087,.409,masonry,.98);
      box(a,0,y-.598,r+.075,.746,.018,.278,masonry,.75);
      box(a,0,y+.549,r-.009,.750,.090,.293,masonry,1.08);
      box(a,0,y+.610,r-.010,.807,.050,.313,masonry,1.04);
    }
    // Lathed bearing courses under the gallery. Each projects only as far as
    // its actual dressed step; seams on the outer coping turn down into its soffit.
    const throat=[[20.125,rad(20.125)],[20.13,2.06],[20.15,2.09],[20.23,2.098],[20.235,2.19],[20.296,2.24],[20.34,2.24],[20.35,2.39],[20.49,2.49],[20.54,2.49],[20.55,2.66],[20.70,2.79],[20.73,2.79],[20.742,2.96],[20.89,3.11],[20.916,3.11],[20.93,3.29],[21.08,3.47],[21.12,3.47],[21.13,3.68],[21.22,3.84],[21.26,3.84],[21.28,4.07],[21.355,4.19],[21.37,4.48],[21.392,4.59],[21.504,4.66],[21.516,4.64],[21.531,4.77],[21.590,4.78],[21.60,4.73],[21.60,1.90]];
    let slant=0;
    for(let j=0;j<throat.length-1;j++){
      const [lo,r0]=throat[j],[hi,r1]=throat[j+1],d=Math.hypot(hi-lo,r1-r0),reps=Math.round(tau*(r1+r0)/4.2);
      const shade=hi-lo<.022?.74:(j<8?.91:.995);
      for(let i=0;i<96;i++){
        const a=tau*i/96,b=tau*(i+1)/96;
        const pts=[polar(a,lo,r0),polar(b,lo,r0),polar(b,hi,r1),polar(a,hi,r1)];
        const ns=[a,b,b,a].map(k=>V((hi-lo)*Math.sin(k),r0-r1,(hi-lo)*Math.cos(k)).normalize());
        face(masonry,pts,[[a/tau*reps,slant/2.1],[b/tau*reps,slant/2.1],[b/tau*reps,(slant+d)/2.1],[a/tau*reps,(slant+d)/2.1]],shade,ns);
      }
      slant+=d;
    }
    // Twenty individually dressed radial brackets. The stepped concave profile
    // casts an actual side silhouette. Left/right faces use metre-decoded UVs.
    const sash=[[19.31,.12,2.08],[19.37,.13,2.19],[19.62,.14,2.23],[19.70,.16,2.35],[19.86,.17,2.39],[19.88,.17,2.47],[20.04,.17,2.53],[20.12,.18,2.57],[20.31,.19,2.73],[20.48,.20,2.95],[20.64,.215,3.24],[20.77,.23,3.56],[20.83,.24,3.71],[20.858,.26,3.77],[20.93,.26,3.79],[20.953,.27,3.91],[21.09,.27,4.07],[21.13,.28,4.22],[21.23,.30,4.31],[21.26,.31,4.49],[21.335,.32,4.58],[21.395,.32,4.59]];
    for(let i=0;i<20;i++){
      const a=tau*(i+.28)/20,baseTone=.96+nrand(11.3+i)*.11;
      if(windows.some(w=>w.y>19&&Math.abs(angleDist(a,w.a))<.22))continue;
      for(let j=0;j<sash.length-1;j++){
        const [ay,aw,ar]=sash[j],[by,bw,br]=sash[j+1];
        const start=Math.max(1.91,Math.min(ar-.014,rad(ay)-.06));
        const uv=(r,y)=>[(r-1.82)/2.1+i*.171,(y-19)/2.1+j*.007];
        const p=(y,u,r)=>wallPoint(a,y,u,r);
        const fa=p(ay,-aw,ar),fb=p(ay,aw,ar),fc=p(by,bw,br),fd=p(by,-bw,br);
        const shade=by-ay<.04?.80:baseTone;
        face(masonry,[fa,fb,fc,fd],[[.41-aw/2.1,(ay-19)/2.1],[.41+aw/2.1,(ay-19)/2.1],[.41+bw/2.1,(by-19)/2.1],[.41-bw/2.1,(by-19)/2.1]],shade);
        face(masonry,[fb,p(ay,aw,start),p(by,bw,start),fc],[uv(ar,ay),uv(start,ay),uv(start,by),uv(br,by)],baseTone*.90);
        face(masonry,[p(ay,-aw,start),fa,fd,p(by,-bw,start)],[uv(start,ay),uv(ar,ay),uv(br,by),uv(start,by)],baseTone*.92);
      }
    }
    for(const [mat,b] of batches){
      const geo=own(new T.BufferGeometry());
      for(const [name,attr,k] of [['position','p',3],['normal','n',3],['uv','uv',2],['color','c',3]])geo.setAttribute(name,new T.Float32BufferAttribute(b[attr],k));
      geo.computeBoundingSphere();const mesh=new T.Mesh(geo,mat);mesh.name=mat.name;mesh.castShadow=mesh.receiveShadow=true;root.add(mesh);
    }
    return {ready,dispose(){if(!alive)return;alive=false;root.removeFromParent();for(const r of resources)r.dispose();}};
  }
  return {create};
})();
