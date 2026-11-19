// The two viewports share these objects, materials and a single simulation clock.
window.TideCoast = (() => {
  const scriptURL = document.currentScript.src;
  const TAU = Math.PI * 2;
  let skyImage;

  function readSky() {
    if (skyImage) return skyImage;
    skyImage = new Promise((resolve, reject) => {
      const load = () => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = window.TideSkyImage;
      };
      if (window.TideSkyImage) return load();
      const script = document.createElement('script');
      script.src = new URL('assets/world-sky.js', scriptURL).href;
      script.onload = load;
      script.onerror = reject;
      document.head.appendChild(script);
    });
    return skyImage;
  }

  function randomSeed(seed) {
    return () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed / 4294967296;
    };
  }

  function makeNoise(T) {
    const rng = randomSeed(40413);
    const base = Float32Array.from({length: 256*256}, rng);
    const wrap = (v) => v & 255;
    function noise(x, y) {
      const ix = Math.floor(x), iy = Math.floor(y);
      let fx = x - ix, fy = y - iy;
      fx = fx * fx * (3 - 2 * fx);
      fy = fy * fy * (3 - 2 * fy);
      const a = base[wrap(ix)+wrap(iy)*256], b = base[wrap(ix+1)+wrap(iy)*256];
      const c = base[wrap(ix)+wrap(iy+1)*256], d = base[wrap(ix+1)+wrap(iy+1)*256];
      return (a + (b-a)*fx)*(1-fy) + (c + (d-c)*fx)*fy;
    }
    const n = 256, bytes = new Uint8Array(n*n*4);
    for(let j=0;j<n;j++) for(let i=0;i<n;i++) {
      const k=(i+j*n)*4;
      const basin = noise(i/8,j/8)*.48+noise(i/4,j/4)*.28+noise(i/2,j/2)*.15+noise(i,j)*.09;
      bytes[k]=basin*255;
      bytes[k+1]=(noise(i*.5+18,j*.25+11)*.6+noise(i+85,j*.5)*.4)*255;
      bytes[k+2]=base[i+j*256]*255;
      bytes[k+3]=255;
    }
    const texture = new T.DataTexture(bytes,n,n);
    texture.wrapS=texture.wrapT=T.RepeatWrapping;
    texture.generateMipmaps=true;
    texture.minFilter=T.LinearMipmapLinearFilter;
    texture.magFilter=T.LinearFilter;
    texture.needsUpdate=true;
    return texture;
  }

  function surfaceTexture(T, type) {
    const size=256, rng=randomSeed(type==='paint'?54721:73184);
    const canvas=document.createElement('canvas');
    canvas.width=canvas.height=size;
    const c=canvas.getContext('2d'), img=c.createImageData(size,size);
    for(let y=0;y<size;y++) for(let x=0;x<size;x++) {
      const k=(x+y*size)*4;
      const stain=(Math.sin(x/size*TAU*6+Math.sin(y/size*TAU)*.4)*.5+.5);
      const speck=rng();
      const l=type==='paint'?172+speck*60+stain*18:166+speck*57+stain*19;
      img.data[k]=l; img.data[k+1]=l*.995; img.data[k+2]=l*.98; img.data[k+3]=255;
    }
    c.putImageData(img,0,0);
    if(type==='paint') {
      for(let i=0;i<240;i++){
        const x=rng()*size,y=rng()*size, h=rng()*22+.7;
        c.strokeStyle='rgba(96,48,20,'+(.12+rng()*.37)+')';
        c.lineWidth=.2+rng()*1.6;
        c.beginPath();c.moveTo(x,y);c.lineTo(x+.25,y+h);c.stroke();
      }
    } else {
      for(let y=0;y<size;y+=32) for(let x=(y%64===0?0:-32);x<size;x+=64){
        c.strokeStyle='rgba(59,54,49,.45)';
        c.lineWidth=1.5; c.strokeRect(x+1,y+1,63,31);
      }
    }
    const t=new T.CanvasTexture(canvas);
    t.colorSpace=T.SRGBColorSpace;t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=4;
    return t;
  }

  // Chapter nine's survey staffs, pontoons, foam and optical readings use this same travelling swell.
  const surveyWaves = `
    float surveySwell(vec2 p,float t){
      float q=(t-(p.y+92.+.16*(p.x+46.))/4.48)/5.8;
      float a=6.28318530718*q;
      return -(.81+.075*cos(a*.31))*cos(a)+.085*sin(2.*a)+.037*sin(p.x*.38-p.y*.27+t*.85);
    }`;
  const swells = surveyWaves + `
    float swell(vec2 p,float t){
      return .46*sin(dot(p,vec2(.23,.11))+t*1.12)
           + .34*sin(dot(p,vec2(-.17,.29))-t*.88)
           + .18*sin(dot(p,vec2(.49,-.41))+t*1.42)
           + .09*sin(dot(p,vec2(.81,.62))-t*1.64);
    }
  `;
  const waterVertex = `
    uniform float uTime,uSurvey;
    ${swells}
    varying vec3 vSea;
    varying float vHeight;
    void main(){
      vec4 world=modelMatrix*vec4(position,1.);
      float h=uSurvey>.5?surveySwell(world.xz,uTime):swell(world.xz,uTime);
      world.y+=h;
      world.x+=(1.-uSurvey)*.18*cos(dot(world.xz,vec2(.23,.11))+uTime*1.12);
      vSea=world.xyz;vHeight=h;
      gl_Position=projectionMatrix*viewMatrix*world;
    }`;
  const waterFragment = `
${TideWindSea.declarations}
    ${TideFerryWash.declarations}
    uniform sampler2D uNoise,uSky,uSceneMap;uniform mat4 uSceneProject;uniform float uSceneLevel,uSceneWeight;
    uniform float uTime,uHasSky,uSignal,uBearing,uInside,uSurvey;
    uniform vec2 uPilot;
    ${surveyWaves}
    uniform float uShoreLamp;uniform vec2 uEntranceMarks[2];
    uniform vec3 uSun,uFog;uniform vec4 basin,uNearOptic,uFarOptic;uniform vec2 uGhost,uRangeAxis;
    varying vec3 vSea;
    varying float vHeight;
    const float PI=3.14159265;
    vec2 envUV(vec3 d){return vec2(.5+atan(d.z,d.x)/(2.*PI),.5+asin(clamp(d.y,-1.,1.))/PI);}
    void main(){
      vec2 p=vSea.xz;
      if(basin.z > 0. && all(lessThan(abs(p-basin.xy),basin.zw)))discard;
      float t=uTime;
      vec3 eye=cameraPosition-vSea;
      float dist=length(eye);
      eye/=dist;
      vec2 flow=vec2(t*.009,-t*.006);
      vec3 noiseA=texture2D(uNoise,p*.039+flow).rgb;
      vec3 noiseB=texture2D(uNoise,p.yx*.082-flow*1.3).rgb;
      float dx=.106*cos(dot(p,vec2(.23,.11))+t*1.12)-.058*cos(dot(p,vec2(-.17,.29))-t*.88)
             +.0882*cos(dot(p,vec2(.49,-.41))+t*1.42)+.0729*cos(dot(p,vec2(.81,.62))-t*1.64);
      float dz=.051*cos(dot(p,vec2(.23,.11))+t*1.12)+.099*cos(dot(p,vec2(-.17,.29))-t*.88)
             -.0738*cos(dot(p,vec2(.49,-.41))+t*1.42)+.0558*cos(dot(p,vec2(.81,.62))-t*1.64);
      if(uSurvey>.5){
        dx=(surveySwell(p+vec2(.1,0.),t)-surveySwell(p-vec2(.1,0.),t))*5.;
        dz=(surveySwell(p+vec2(0.,.1),t)-surveySwell(p-vec2(0.,.1),t))*5.;
      }
      ${TideWindSea.surface}
      ${TideFerryWash.disturbance}
      vec3 reflected=reflect(-eye,normal),r=reflected;
      ${TideWindSea.reflection}
      if(uSceneWeight>.5){
        vec2 tilt=clamp(normal.xz,vec2(-.74),vec2(.74));
        // Perturb the point on the reflector in world space before projecting.
        // A facet reflecting the port side then moves the correct way in either eye.
        float path=clamp(.35+.056*dist,.42,2.7);
        vec4 surfaceImage=uSceneProject*vec4(p.x+tilt.x*path,uSceneLevel,p.y+tilt.y*path,1.);
        vec2 base=surfaceImage.xy/max(surfaceImage.w,.001)*.5+.5;
        vec2 blur=vec2(.0012+.0018*abs(tilt.x),.0013+.0021*abs(tilt.y));
        vec4 image=.5*texture2D(uSceneMap,base)+.25*(texture2D(uSceneMap,base+blur)+texture2D(uSceneMap,base-blur));
        float edge=smoothstep(.0,.035,min(min(base.x,base.y),min(1.-base.x,1.-base.y)));
        if(surfaceImage.w>0.)sky=mix(sky,image.rgb/max(image.a,.001),edge*clamp(image.a,0.,1.)*.91);
      }
      float fresnel=.09+.70*pow(1.-max(dot(normal,eye),0.),3.);
      vec3 deep=mix(vec3(.019,.045,.054),vec3(.040,.094,.102),noiseA.r);
      vec3 lit=mix(deep,sky*.99,fresnel);
      float shaft=smoothstep(.13,.80,vHeight)*max(0.,dot(-uSun,eye));
      lit+=vec3(.016,.047,.039)*shaft;
      float shine=pow(max(dot(reflect(-uSun,normal),eye),0.),77.);
      lit+=vec3(1.,.61,.30)*shine*.8;
      ${TideWindSea.breaking}
      float ledX=14.+(p.y+85.)*tan(clamp(uBearing,-.7,.7));
      float streak=exp(-abs(p.x-ledX)*.38)*(noiseB.r*.8+.1);
      if(uPilot.y>0.){
        vec2 dir=vec2(sin(uPilot.x),-cos(uPilot.x)),span=p-vec2(14.,-91.);
        float range=dot(span,dir),crossing=dot(span,vec2(dir.y,-dir.x));
        float focus=exp(-pow(crossing/(.55+.033*max(0.,range)),2.))*smoothstep(18.,31.,range)*(1.-smoothstep(51.,68.,range));
        float facet=.24+.93*smoothstep(-.29,.32,normal.z+.37*normal.x+.43*(noiseB.g-.5));
        lit+=vec3(2.16,1.79,.89)*focus*facet*uSignal;
      }else if(uNearOptic.w<0.)lit+=vec3(.68,.43,.15)*streak*uSignal*.45;
      else{
        vec2 fromLamp=p-vec2(14.,-91.);
        float depth=-dot(fromLamp,uRangeAxis),u=dot(fromLamp,vec2(uRangeAxis.y,-uRangeAxis.x));
        float slice=clamp((depth-36.)/19.,0.,1.);
        vec4 img=mix(uNearOptic,uFarOptic,slice);
        float rangeFade=smoothstep(28.,34.,depth)*(1.-smoothstep(58.,65.,depth));
        float caustic=(.52+.68*noiseB.r+.25*max(0.,normal.y-.80))*(1.+.24*vHeight);
        // The same varying ray envelope that strikes the water also illuminates its crests.
        u+=.11*vHeight+.15*(noiseA.r-.5)+.13*normal.x;
        caustic*=.28+1.34*smoothstep(-.33,.34,normal.z+.35*normal.x+.54*(noiseB.r-.5));
        float mainSpot=exp(-pow((u-img.x)/img.z,2.));
        float ghost=exp(-pow((u-img.y)/max(.28,img.z*.68),2.))*mix(uGhost.x,uGhost.y,slice);
        lit+=rangeFade*caustic*(vec3(2.8,2.46,1.72)*mainSpot*img.w+vec3(1.86,1.15,.38)*ghost);
      }
      if(uShoreLamp>=0.){
        vec2 transit=normalize(vec2(25.,10.));
        vec2 across=vec2(-transit.y,transit.x);
        vec2 shore=p-vec2(-54.24,-124.90);
        float along=dot(shore,transit),side=dot(shore,across);
        float facet=.25+1.3*smoothstep(-.20,.34,normal.x+.43*normal.z+.42*(noiseB.g-.5));
        float shine=exp(-pow(side/(1.1+.12*max(0.,along)),2.))*smoothstep(-1.,2.,along)*exp(-max(0.,along)*.095);
        vec2 nearMark=p-vec2(-42.,-120.);
        float markerShine=exp(-pow(dot(nearMark,across)/.76,2.)-pow(dot(nearMark,transit)/3.3,2.));
        lit+=facet*vec3(.07,1.17,.43)*(shine*uShoreLamp+.38*markerShine);
      }
      ${TideFerryWash.color}
      if(dot(uBayLine.zw,uBayLine.zw)>.5){
        for(int j=0;j<2;j++){
          float stone=1.-smoothstep(-4.28,-3.78,vSea.y);
          float sd=distance(p,uEntranceMarks[j])-mix(.31,.64,stone);
          float wash=(1.-smoothstep(.012,.12+.14*noiseA.g,sd))*smoothstep(.19,.74,wsMid.b+.16*vHeight);
          lit=mix(lit,vec3(.68,.77,.72),wash*.75);
        }
      }
      lit=mix(lit,lit*vec3(.26,.39,.40)+vec3(.004,.009,.010),uInside);
      lit=mix(lit,uFog,smoothstep(90.,290.,dist)*.74);
      gl_FragColor=vec4(lit,1.);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`;

  function create(scene,act,index=act*3,floors=[]) {
    const T=window.THREE, group=new T.Group();
    group.name='北岬海岸';
    scene.add(group);
    const rng=randomSeed(81 + act*1349);
    const geometry=new Set(), materials=new Set(), textures=new Set();
    const track=(set,x)=>(set.add(x),x);
    const geom=g=>track(geometry,g);
    const mat=m=>track(materials,m);
    const tex=t=>track(textures,t);
    const previous={background:scene.background,env:scene.environment,fog:scene.fog,intensity:scene.backgroundIntensity};
    const chapter=index%3;
    const fogColor=new T.Color([0x81959b,0x62767a,0x77899b,0x979394][act]);
    const dusk=act===2?.78+chapter*.035:act===3?.81+chapter*.055:1.-chapter*.04;
    const fog=new T.FogExp2(fogColor,[.0063,.013,.0068,.0064][act]);
    scene.fog=fog;
    scene.background=fogColor;
    const noise=tex(makeNoise(T));
    const paint=tex(surfaceTexture(T,'paint'));
    const sky=tex(new T.Texture());
    sky.mapping=T.EquirectangularReflectionMapping;
    sky.colorSpace=T.SRGBColorSpace;
    let disposed=false;

    const hemisphere=new T.HemisphereLight(act===1?0xb7dee1:0xd9ebf4,0x63554b,act===1?1.55:1.28);
    const sun=new T.DirectionalLight(act===1?0xc8eef9:0xffdab1,act===1?1.95:2.65);
    const sunTarget=new T.Object3D();
    sunTarget.position.set(0,1,-28);sun.target=sunTarget;
    sun.position.set(-31,46,-67);sun.castShadow=true;
    sun.shadow.mapSize.set(2048,2048);
    Object.assign(sun.shadow.camera,{left:-52,right:52,top:58,bottom:-58,near:.5,far:155});
    if(index===2){
      sunTarget.position.set(-56,1,-123);sun.position.set(-84,41,-151);
      Object.assign(sun.shadow.camera,{left:-20,right:20,top:20,bottom:-20,near:24,far:94});
    }
    if(index===5){
      sunTarget.position.set(-57,3.2,-98);sun.position.set(-83,34,-127);
      Object.assign(sun.shadow.camera,{left:-11,right:11,top:12,bottom:-12,near:18,far:76});
    }
    if(index===7){
      sunTarget.position.set(-33,1,-85);sun.position.set(-61,40,-111);
      Object.assign(sun.shadow.camera,{left:-19,right:19,top:19,bottom:-19,near:20,far:90});
    }
    if(index===8){
      sunTarget.position.set(-43,0,-96);sun.position.set(-72,38,-124);
      Object.assign(sun.shadow.camera,{left:-19,right:19,top:21,bottom:-21,near:20,far:95});
    }
    if(index===10){
      sunTarget.position.set(1,8,-93);sun.position.set(-27,47,-123);
      Object.assign(sun.shadow.camera,{left:-22,right:22,top:23,bottom:-23,near:20,far:100});
    }
    if(index===9){
      sunTarget.position.set(14,22,-91);sun.position.set(-17,65,-127);
      Object.assign(sun.shadow.camera,{left:-12,right:12,top:12,bottom:-12,near:25,far:91});
    }
    // Fit the light-space rectangle to both players. A texel-aligned centre
    // keeps stationary rail and boot shadows from swimming when a partner walks.
    const followSun=[0,1,6,11].includes(index);
    const lightAxis=sun.position.clone().sub(sunTarget.position).normalize();
    const rightAxis=new T.Vector3().crossVectors(new T.Vector3(0,1,0),lightAxis).normalize();
    const highAxis=new T.Vector3().crossVectors(lightAxis,rightAxis);
    const midpoint=new T.Vector3(),span=new T.Vector3();
    let shadowExtent=0;
    function frameShadow(players){
      if(!players||!followSun)return;
      const [a,b]=players;
      midpoint.set((a.x+b.x)*.5,(a.y+b.y)*.5+1,(a.z+b.z)*.5);
      span.set(a.x-b.x,a.y-b.y,a.z-b.z);
      const need=10.5+.5*Math.max(Math.abs(span.dot(rightAxis)),Math.abs(span.dot(highAxis)));
      if(need>shadowExtent||need<shadowExtent-3){
        shadowExtent=Math.ceil(need/2)*2;
        Object.assign(sun.shadow.camera,{left:-shadowExtent,right:shadowExtent,top:shadowExtent,bottom:-shadowExtent,near:1,far:170});
        sun.shadow.camera.updateProjectionMatrix();
      }
      const texel=2*shadowExtent/sun.shadow.mapSize.x;
      const snap=(v,step)=>Math.round(v/step)*step;
      const x=snap(midpoint.dot(rightAxis),texel),y=snap(midpoint.dot(highAxis),texel);
      sunTarget.position.copy(rightAxis).multiplyScalar(x).addScaledVector(highAxis,y).addScaledVector(lightAxis,snap(midpoint.dot(lightAxis),.5));
      sun.position.copy(sunTarget.position).addScaledVector(lightAxis,83);
    }
    sun.shadow.camera.updateProjectionMatrix();
    sun.shadow.normalBias=.045;sun.shadow.bias=-.00016;
    const rim=new T.DirectionalLight(act===1?0xffb87c:0xafddff,act===1?1.05:.68);
    rim.position.set(29,16,24);
    group.add(hemisphere,sun,sunTarget,rim);
    const oceanGeo=geom(TideOceanGrid.create(T,floors,index));
    const windSea=TideWindSea.create(T),wash=TideFerryWash.create(T);
    const uniforms={...windSea.uniforms,...wash.uniforms,uEntranceMarks:{value:TideBayPassage.marks.map(m=>new T.Vector2(m.x,m.z))},uSceneMap:{value:null},uSceneProject:{value:new T.Matrix4()},uSceneWeight:{value:0},uSceneLevel:{value:-4},uPilot:{value:new T.Vector2()},uSurvey:{value:index===8?1:0},uTime:{value:0},uNoise:{value:noise},uSky:{value:noise},uHasSky:{value:0},uSignal:{value:0},
      uShoreLamp:{value:index===2?0:-1},
      uNearOptic:{value:new T.Vector4(0,0,1,-1)},uFarOptic:{value:new T.Vector4()},uGhost:{value:new T.Vector2()},uRangeAxis:{value:new T.Vector2(Math.sin(TideLantern.yaw),Math.cos(TideLantern.yaw))},
      basin:{value:new T.Vector4()},uBearing:{value:0},uInside:{value:act===1?.9:0},uSun:{value:new T.Vector3(-.42,.40,-.82).normalize()},uFog:{value:fogColor}};
    const water=new T.Mesh(oceanGeo,mat(new T.ShaderMaterial({uniforms,vertexShader:waterVertex,fragmentShader:waterFragment})));
    water.name='潮汐海面';water.position.y=-4;group.add(water);
    readSky().then(img=>{
      if(disposed)return;
      const panorama=document.createElement('canvas');
      panorama.width=img.naturalWidth;panorama.height=img.naturalHeight;
      const context=panorama.getContext('2d');
      // Align the low sun with the direction of the key light.
      const shift=Math.round(panorama.width*(.142+(.012*chapter)));
      context.drawImage(img,-shift,0);context.drawImage(img,panorama.width-shift,0);
      if(act===1 || act===2 || (act===3 && chapter<2)){
        context.globalCompositeOperation='multiply';
        context.fillStyle=act===2?'#b4cbee':'#d6e0e6';
        context.fillRect(0,0,panorama.width,panorama.height);
      }
      sky.image=panorama;sky.needsUpdate=true;
      scene.background=sky;scene.backgroundIntensity=act===1?.62:.91*dusk;
      scene.environment=sky;
      uniforms.uSky.value=sky;uniforms.uHasSky.value=1;
    }).catch(()=>{ /* The lit water and fog remain renderable during image decoding failures. */ });

    const standard=(color,roughness,metalness=0,map=null)=>mat(new T.MeshStandardMaterial({color,roughness,metalness,map}));
    const metal=standard(0x405050,.52,.69,paint);
    const black=standard(0x242c2d,.57,.55,paint);
    const iron=standard(0x83654d,.53,.58,paint);
    const amber=standard(0xa97635,.57,.48,paint);
    const masonry=mat(TideConcrete.material(0xdedacf)),stone=mat(TideConcrete.material(0xa0aca7));
    const white=standard(0xd6d2b5,.76,.11,paint);
    const red=standard(0x9b5143,.69,.17,paint);
    const copper=standard(0x688479,.47,.75,paint);
    const glass=mat(new T.MeshPhysicalMaterial({color:0x779394,metalness:.45,roughness:.21,clearcoat:.72,clearcoatRoughness:.18,transparent:true,opacity:.42,depthWrite:false}));
    const warm=mat(new T.MeshStandardMaterial({color:0xffedcd,emissive:0xff9644,emissiveIntensity:2.4,roughness:.34}));
    const cool=mat(new T.MeshStandardMaterial({color:0xc3fff4,emissive:0x57c7b7,emissiveIntensity:1.1,roughness:.34}));
    const shapes={
      box:geom(new T.BoxGeometry(1,1,1)),
      round:geom(new T.CylinderGeometry(.5,.5,1,20)),
      slim:geom(new T.CylinderGeometry(.5,.5,1,8)),
      roof:geom(new T.ConeGeometry(.5,1,12)),
      ring:geom(new T.TorusGeometry(.5,.024,6,48)),
      sphere:geom(new T.SphereGeometry(.5,12,9))
    };
    const batches=new Map(),dummy=new T.Object3D(),yAxis=new T.Vector3(0,1,0);
    function addInstance(shape,m,x,y,z,sx,sy,sz,rotation){
      const g=shapes[shape]||shape;
      const key=g.uuid+m.uuid;
      if(!batches.has(key))batches.set(key,{g,m,items:[]});
      dummy.position.set(x,y,z);dummy.scale.set(sx,sy,sz);
      dummy.rotation.set(0,0,0);
      if(rotation?.isQuaternion)dummy.quaternion.copy(rotation);
      else if(rotation)dummy.rotation.set(...rotation);
      dummy.updateMatrix();batches.get(key).items.push(dummy.matrix.clone());
    }
    function box(m,x,y,z,w,h,d,rot){addInstance('box',m,x,y,z,w,h,d,rot);}
    function cylinder(m,x,y,z,diam,h,rot){addInstance('round',m,x,y,z,diam,h,diam,rot);}
    function ring(m,x,y,z,d,rot=[Math.PI/2,0,0]){addInstance('ring',m,x,y,z,d,d,d,rot);}
    function bar(m,a,b,r=.09){
      const dir=new T.Vector3(b[0]-a[0],b[1]-a[1],b[2]-a[2]);const len=dir.length();
      const q=new T.Quaternion().setFromUnitVectors(yAxis,dir.normalize());
      addInstance('slim',m,(a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2,r*2,len,r*2,q);
    }
    function mesh(g,m,x,y,z,parent=group){
      const obj=new T.Mesh(g,m);
      obj.position.set(x,y,z);parent.add(obj);
      return obj;
    }
    const flamePoints=[];
    function floodlight(x,y,z,side=1,green=false){
      cylinder(black,x,y-.52,z,.23,1.2);
      bar(metal,[x,y-.15,z],[x+side*.48,y+.1,z],.085);
      box(metal,x+side*.56,y+.15,z,.34,.5,.64);
      box(green?cool:warm,x+side*.75,y+.14,z,.06,.34,.48);
      flamePoints.push([x+side*.79,y+.14,z,green]);
    }

    // Three-dimensional ridged basalt forms with matching displacement at shared vertices.
    const rockMat=mat(new T.MeshStandardMaterial({vertexColors:true,roughness:.72,metalness:.08}));
    rockMat.onBeforeCompile=shader=>{
      shader.vertexShader=shader.vertexShader.replace('#include <common>',
        '#include <common>\nvarying vec3 vBasalt,vBasaltFace;')
        .replace('#include <worldpos_vertex>',`#include <worldpos_vertex>
          vec4 surfacePosition=instanceMatrix*vec4(transformed,1.);
          vBasalt=surfacePosition.xyz*.24;
          vec3 basisScale=vec3(dot(instanceMatrix[0].xyz,instanceMatrix[0].xyz),
            dot(instanceMatrix[1].xyz,instanceMatrix[1].xyz),dot(instanceMatrix[2].xyz,instanceMatrix[2].xyz));
          vBasaltFace=normalize(mat3(instanceMatrix)*(normal/basisScale));`);
      shader.fragmentShader=shader.fragmentShader.replace('#include <common>',
        '#include <common>\nvarying vec3 vBasalt,vBasaltFace;')
        .replace('#include <map_fragment>',`float rockGrain=.5;
        #ifdef USE_MAP
          vec3 weights=pow(abs(normalize(vBasaltFace)),vec3(3.));
          weights/=max(.001,dot(weights,vec3(1.)));
          vec3 stratum=texture2D(map,vBasalt.zy).rgb*weights.x+
            texture2D(map,vBasalt.xz).rgb*weights.y+texture2D(map,vBasalt.xy).rgb*weights.z;
          rockGrain=dot(stratum,vec3(.23,.61,.16));
          diffuseColor.rgb*=.16+8.*stratum;
        #endif`)
        .replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
        #ifdef USE_MAP
          vec3 dpx=dFdx(-vViewPosition),dpy=dFdy(-vViewPosition);
          vec3 rx=cross(dpy,normal),ry=cross(normal,dpx);
          float determinant=dot(dpx,rx);
          normal=normalize(max(abs(determinant),.000001)*normal-sign(determinant)*.12*
            (dFdx(rockGrain)*rx+dFdy(rockGrain)*ry));
        #endif`);
    };
    readSky().then(()=>{
      if(disposed || !window.TideBasaltImage)return;
      const img=new Image();
      img.onload=()=>{
        if(disposed)return;
        const stoneMap=tex(new T.Texture(img));stoneMap.colorSpace=T.SRGBColorSpace;
        stoneMap.wrapS=stoneMap.wrapT=T.RepeatWrapping;stoneMap.anisotropy=4;
        stoneMap.needsUpdate=true;rockMat.map=stoneMap;rockMat.needsUpdate=true;
      };
      img.src=window.TideBasaltImage;
    }).catch(()=>{});
    function basalt(seed) {
      const g=geom(new T.IcosahedronGeometry(1,3)), pos=g.attributes.position,col=[];
      for(let i=0;i<pos.count;i++){
        const x=pos.getX(i),y=pos.getY(i),z=pos.getZ(i);
        const n=Math.sin(x*4.6+z*2.3+seed)*Math.cos(y*3.7-z*2.7);
        const r=1+n*.21+.046*Math.sin((x*.6+y*1.7+z*.8)*10+seed);
        const yy=y*r+(Math.sin(x*3+z*4+seed)*.075);
        pos.setXYZ(i,x*r,yy,z*r);
        const ledge=Math.pow(Math.max(0,Math.sin((yy+z*.23)*23+seed)),8)*.05;
        const fleck=.026*Math.cos(x*32+z*21+y*8);
        const algae=Math.max(0,y-.30)*.14*(n*.5+.55);
        const lum=.044+.055*(y*.5+.5)+ledge+fleck;
        col.push(lum+algae*.42,lum*1.07+algae*.70,lum*1.10+algae*.28);
      }
      g.setAttribute('color',new T.Float32BufferAttribute(col,3));g.computeVertexNormals();
      const normals=g.attributes.normal,smooth=new Map(),keys=[];
      for(let i=0;i<pos.count;i++){
        const key=[pos.getX(i),pos.getY(i),pos.getZ(i)].map(v=>Math.round(v*10000)).join(',');
        keys.push(key);
        if(!smooth.has(key))smooth.set(key,new T.Vector3());
        smooth.get(key).add(new T.Vector3().fromBufferAttribute(normals,i));
      }
      smooth.forEach(v=>v.normalize());
      for(let i=0;i<pos.count;i++){
        const n=new T.Vector3().fromBufferAttribute(normals,i).lerp(smooth.get(keys[i]),.72).normalize();
        normals.setXYZ(i,n.x,n.y,n.z);
      }
      return g;
    }
    const rocks=Array.from({length:5},(_,i)=>basalt(i*2.3+.67));
    function rock(x,y,z,sx,sy,sz,variant=0){
      addInstance(rocks[variant%5],rockMat,x,y,z,sx,sy,sz,[.16*(rng()-.5),rng()*TAU,.12*(rng()-.5)]);
    }
    for(let i=0;i<56;i++){
      const side=i%2?1:-1, r=rng(), z=9-rng()*124, x=side*(29+rng()*51);
      const drawX=x<0&&z< -77&&x> -57?x-45:x;
      const clearPier=index===5&&Math.hypot(drawX+57,z+98)<19||index===2&&Math.hypot(drawX+61,z+128)<20||index===8&&Math.hypot(drawX+45,z+94)<22;
      rock(clearPier?drawX-29:drawX,-5.1+rng(),z,2+r*10,2+r*r*9,2+rng()*9,i);
    }
    for(let i=0;i<11;i++){
      rock((index===7||index===8||index===10?26:14)+(rng()-.5)*25,-3+rng()*3,-103+(rng()-.5)*14,5+rng()*8,4+rng()*3,7+rng()*6,i);
    }

    if(index===2){
      for(const [u,v,s] of [[-3,-26,1.4],[2,-31,1.1],[-5,-33,.85]]){
        const p=TideSignal.point(u,0,v);rock(p.x,-4.65,p.z,s*2.6,s*1.37,s,3);
      }
    }
    function lighthouse(){
      const x=14,z=-91;
      cylinder(stone,x,1.9,z,12.6,3.8);
      const towerBase=4;
      for(let i=0;i<5;i++){
        if(index===9&&i>=3)continue;
        const base=6.15-i*.48;
        const g=geom(new T.CylinderGeometry((base-.48)*.5,base*.5,3.55,36));
        addInstance(g,i===2?red:white,x,towerBase+1.77+i*3.52,z,1,1,1);
        for(let side=0;side<2;side++){
          const a=i*1.33+side*Math.PI*.86;
          const rad=base*.5-.08;
          const xx=x+Math.sin(a)*rad,zz=z+Math.cos(a)*rad;
          box(black,xx,towerBase+i*3.52+1.4,zz,.58,1.16,.15,[0,a,0]);
          box(i%3===0?warm:glass,xx+.06*Math.sin(a),towerBase+i*3.52+1.46,zz+.06*Math.cos(a),.38,.76,.11,[0,a,0]);
        }
      }
      const top=towerBase+17.6;
      if(index===9){
        return new T.Vector3(x,TideLantern.height+2.50,z);
      }
      cylinder(black,x,top,z,5.7,.5);ring(iron,x,top+.99,z,5.46);ring(black,x,top+.46,z,5.46);
      for(let i=0;i<18;i++){
        const a=TAU*i/18;
        cylinder(black,x+2.7*Math.sin(a),top+.48,z+2.7*Math.cos(a),.078,1.06);
      }
      cylinder(copper,x,top+.5,z,3.65,.65);
      for(let i=0;i<10;i++){
        const a=TAU*i/10;
        cylinder(black,x+1.6*Math.sin(a),top+2.0,z+1.6*Math.cos(a),.14,2.7);
      }
      ring(iron,x,top+2.2,z,3.38);
      cylinder(black,x,top+3.36,z,3.75,.23);
      addInstance('roof',copper,x,top+4.13,z,4.6,1.6,4.6);
      cylinder(black,x,top+5.22,z,.12,1.9);
      addInstance('sphere',amber,x,top+4.99,z,.35,.5,.35);
      box(stone,x-5.8,4.05,z+2.1,4.5,3.6,6.1);
      box(iron,x-5.8,5.98,z+2.1,5.1,.39,6.7,[0,0,-.095]);
      box(black,x-5.8,3.77,z+5.19,1.35,2.28,.2);
      floodlight(x-4.65,5.14,z+5.21,-1);
      for(let i=0;i<4;i++)cylinder(copper,x,top+1.32+i*.38,z,1.45+Math.sin(i/3*Math.PI)*.59,.15);
      return new T.Vector3(x,top+1.96,z);
    }
    const lantern=lighthouse();
    let pilotLamp=null;
    if(index===11){
      pilotLamp=new T.SpotLight(0xffdc9b,0,85,.059,.68,2);
      pilotLamp.position.copy(lantern);group.add(pilotLamp,pilotLamp.target);
    }
    const beaconMat=mat(new T.MeshBasicMaterial({color:0xffca77,toneMapped:false}));
    const lamp=mesh(shapes.sphere,beaconMat,lantern.x,lantern.y,lantern.z);
    lamp.scale.set(.94,1.2,.94);
    // A tapered translucent shaft scatters light in the sea mist. UV controls fade and edge softness.
    const beamGeo=geom(new T.ConeGeometry(4.7,71,40,1,true).translate(0,-35.5,0).rotateX(-Math.PI/2));
    const beamMat=mat(new T.ShaderMaterial({
      uniforms:{uPower:{value:.06}},transparent:true,blending:T.AdditiveBlending,depthWrite:false,side:T.FrontSide,
      vertexShader:`varying vec2 vUV; varying vec3 vN; varying vec3 vEye;
        void main(){vUV=uv;vec4 eye=modelViewMatrix*vec4(position,1.);
          vEye=-eye.xyz;vN=normalMatrix*normal;gl_Position=projectionMatrix*eye;}`,
      fragmentShader:`uniform float uPower;varying vec2 vUV;varying vec3 vN;varying vec3 vEye;
        void main(){float path=abs(dot(normalize(vEye),normalize(vN)));
          float mist=.90+.10*sin(vUV.y*39.+sin(vUV.y*16.));
          float fade=pow(vUV.y,1.45)*smoothstep(.0,.95,path)*mist;
          gl_FragColor=vec4(1.,.76,.44,fade*uPower*.20);}`
    }));
    const beam=mesh(beamGeo,beamMat,lantern.x,lantern.y,lantern.z);
    beam.rotation.y=Math.PI*.86;

    const marker=new T.Group();marker.name='旧绿标';group.add(marker);
    const buoyBody=TideBuoyBody.create(marker),buoyLantern=TideBuoyLantern.create(marker);
    const buoyFoam=TideBuoyFoam.create(group,water);
    const buoySwell=index===8?TideSoundings.swell:TideLookout.swell;
    const seaHeight=(x,z,time)=>water.position.y+buoySwell(x,z,time);
    const marks=TideLookout.marks;
    let finalPile=null;
    if(index===11){
      const pile=new T.Group();pile.position.set(marks.stump.x,0,marks.stump.z);group.add(pile);
      finalPile=TideBrokenPile.create(pile);
    }else if(index!==8){
      const stump=mesh(shapes.round,iron,marks.stump.x,-2.51,marks.stump.z);
      stump.name='断桩';stump.scale.set(.76,3.1,.71);stump.rotation.z=.28;
      [-.95,-1.25].forEach(h=>{const collar=mesh(shapes.round,copper,marks.stump.x,h,marks.stump.z);collar.scale.set(.91,.105,.82);collar.rotation.z=.28;});
    }

    function timberPier(){
      for(const side of [-1,1])for(let i=0;i<6;i++){
        const x=side*(24+Math.sin(i*1.4)*2),z=2-i*13;
        for(let k=0;k<3;k++) {
          cylinder(iron,x+(k-1)*.76,-1.4,z+Math.sin(k)*.39,.71,7.5+(k%2)*.7);
          cylinder(black,x+(k-1)*.76,1.65,z+Math.sin(k)*.39,.76,.23);
        }
        box(black,x,2.3,z,3.4,.45,1.5);
        if(i%2===0)floodlight(x,3.25,z,-side,i===2);
      }
    }

    const rotors=[];
    function pumpHall(){
      for(const side of [-1,1]){
        const x=side*24;
        box(stone,x,0,-32,3.5,6.4,86);
        for(let i=0;i<8;i++){
          const z=9-i*11;
          box(masonry,x,6.4,z,1.9,8,2.1);
          box(iron,x,11,z,2.3,1.2,2.4);
          box(iron,x,11.86,z-5.5,.8,1.15,11.2);
          box(black,x,7.3,z-5.5,.47,.27,10);
          box(glass,x+side*.42,8.9,z-5.3,.12,2.8,7.8);
          for(let j=0;j<5;j++)box(metal,x,8.9,z-1.6-j*1.85,.34,3.3,.11);
          floodlight(x-side,5.2,z,-side);
          if(i%2)continue;
          const xx=x-side*2.2, cy=3.4;
          cylinder(iron,xx,cy,z,5.2,1.45,[0,0,Math.PI/2]);
          cylinder(black,xx-side*.8,cy,z,4.9,.28,[0,0,Math.PI/2]);
          ring(copper,xx-side*1.02,cy,z,4.51,[0,Math.PI/2,0]);
          const rotor=new T.Group();
          rotor.position.set(xx-side*1.05,cy,z);group.add(rotor);rotors.push(rotor);
          const blades=new T.InstancedMesh(shapes.box,metal,10);
          const tr=new T.Object3D();
          for(let k=0;k<10;k++){
            const a=k*TAU/10;
            tr.position.set(0,Math.cos(a)*1.25,Math.sin(a)*1.25);
            tr.rotation.set(a,.27,0);tr.scale.set(.21,1.65,.56);
            tr.updateMatrix();blades.setMatrixAt(k,tr.matrix);
          }
          rotor.add(blades);
          cylinder(copper,xx-side*1.13,cy,z,.9,.45,[0,0,Math.PI/2]);
        }
        for(const h of [3.35,4.0]){
          cylinder(copper,x-side*1.9,h,-32,.42,83,[Math.PI/2,0,0]);
          for(let k=0;k<13;k++)cylinder(iron,x-side*1.9,h,8-k*6.5,.53,.14,[Math.PI/2,0,0]);
        }
      }
      // Raised clerestory leaves two continuous sky strips above the machine hall.
      for(const side of [-1,1]){
        box(black,side*16.9,12.65,-33,14.3,.32,86,[0,0,-side*.22]);
        box(metal,side*4.5,15.35,-33,9,.25,86,[0,0,-side*.12]);
        bar(copper,[side*9.2,14.0,9],[side*9.2,14.0,-75],.24);
        for(let k=0;k<7;k++){
          const z=5-k*11.8;
          bar(black,[side*8.9,14.8,z],[side*8.9,11.25,z],.043);
          cylinder(iron,side*8.9,10.9,z,.92,.38);
          cylinder(warm,side*8.9,10.67,z,.78,.1);
        }
        box(masonry,side*15.6,4.12,-75.6,20.1,12,1.6);
        box(copper,side*6.2,4,-74.55,1,9.8,.55);
        box(masonry,side*15.8,10.7,-75.55,20.9,1.3,1.63);
        floodlight(side*7.0,7.4,-74.15,-side);
      }
      box(black,0,11,-75.5,13,.9,1.4);
      for(let i=0;i<9;i++)box(iron,0,10.7-i*.47,-75.5,11.8,.43,.5);
      for(let k=0;k<4;k++){
        const z=4-k*21;
        bar(iron,[-24,10.9,z],[0,16.4,z],.32);bar(iron,[0,16.4,z],[24,10.9,z],.32);
        bar(black,[-24,10.4,z],[24,10.4,z],.17);
      }
    }

    function craneBridge(){
      for(const side of [-1,1]){
        const x=side*23;
        for(let bay=0;bay<2;bay++){
          const cz=-14-bay*44,top=15+bay*3;
          for(const dz of [-2.4,2.4]){
            bar(amber,[x-1.6,-4,cz+dz],[x-.75,top,cz+dz*.4],.34);
            bar(amber,[x+1.6,-4,cz+dz],[x+.75,top,cz+dz*.4],.34);
          }
          for(let k=0;k<5;k++){
            const y=k*(top/5), z=cz;
            bar(iron,[x-1.25,y,z+1.6],[x+1.25,y+top/5,z+1.6],.13);
            bar(iron,[x+1.25,y,z+1.6],[x-1.25,y+top/5,z+1.6],.13);
          }
          box(amber,x,top+.3,cz,3.6,1,3.5);
          box(black,x,top+1.65,cz,2.3,1.85,2.4);
          box(glass,x,top+1.84,cz+1.23,1.93,.98,.06);
          const tip=[x+side*10,top+5,cz-6];
          bar(amber,[x,top,cz],tip,.37);
          bar(black,[x,top+2.7,cz],tip,.16);
          bar(black,tip,[tip[0],5,tip[2]],.045);
          box(iron,tip[0],4.6,tip[2],2.4,1.0,1.8);
          floodlight(x,top+3.0,cz,-side);
        }
        let last=null;
        for(let k=0;k<=22;k++){
          const q=k/22, z=-14-44*q;
          const h=14+3*q-8*4*q*(1-q);
          const now=[x,h,z];
          if(last)bar(black,last,now,.115);
          if(k%2===0)bar(metal,now,[x,.9,z],.043);
          last=now;
        }
      }
    }

    const optics=[];
    function lampGallery(){
      for(const side of [-1,1]){
        const x=side*23.3;
        box(masonry,x,-1.45,-31,4.9,5.2,85);
        for(let i=0;i<9;i++){
          const z=9-i*10.5;
          cylinder(copper,x,6.5,z,.62,12.5);
          cylinder(iron,x,1.45,z,.94,.7);
          box(glass,x+side*.38,5.0,z-4.6,.12,6.0,8.8);
          box(copper,x,8.4,z-4.8,.42,.37,9.85);
          bar(copper,[x,2.0,z],[x,8.25,z-9.5],.11);
          if(i%2===0)floodlight(x-.65*side,2.8,z,-side);
        }
      }
      // Large spare Fresnel lenses in their copper transport frames.
      for(let i=0;i<3;i++){
        const x=(i%2?1:-1)*21.7,z=-24-i*20;
        const y=5.5,w=5.7;
        cylinder(iron,x,.8,z,w+1,1.25);
        ring(iron,x,y,z,w*1.08,[0,i%2?-.70:.70,0]);
        const lensGroup=new T.Group();
        lensGroup.position.set(x,y,z);lensGroup.rotation.y=(i%2?-.70:.70);
        group.add(lensGroup);optics.push(lensGroup);
        const fresnelMat=mat(new T.MeshPhysicalMaterial({color:0x8faeb0,metalness:.52,roughness:.13,
          clearcoat:1,clearcoatRoughness:.06,emissive:0x9f5e27,emissiveIntensity:.26}));
        const rings=new T.InstancedMesh(shapes.ring,fresnelMat,15);
        for(let j=0;j<15;j++){
          dummy.position.set(0,0,(15-j)*.067);dummy.rotation.set(0,0,0);dummy.scale.setScalar(w*(j+1)/15);
          dummy.updateMatrix();rings.setMatrixAt(j,dummy.matrix);
        }
        lensGroup.add(rings);
        const core=mesh(shapes.sphere,warm,0,0,.57,lensGroup);core.scale.set(.67,.67,.35);
        bar(amber,[x,1.3,z-w*.42],[x,y,z-w*.52],.18);
        bar(amber,[x,1.3,z+w*.42],[x,y,z+w*.52],.18);
      }
    }
    if(act===0)timberPier();
    if(act===1)pumpHall();
    if(act===2&&index!==7&&index!==8)craneBridge();
    if(act===3&&index!==9&&index!==10)lampGallery();

    batches.forEach(({g,m,items})=>{
      const instances=new T.InstancedMesh(g,m,items.length);
      items.forEach((matrix,i)=>instances.setMatrixAt(i,matrix));
      instances.computeBoundingSphere();instances.castShadow=false;
      instances.receiveShadow=(m===masonry || m===stone || m===rockMat);
      group.add(instances);
    });
    batches.clear();

    const rainCount=act===1?140:500, rainVerts=[],tails=[];
    for(let i=0;i<rainCount;i++){
      const side=rng()<.5?-1:1;
      const x=act===1?side*(24+rng()*18):rng()*112-56;
      const y=rng()*25, z=rng()*124-96;
      rainVerts.push(x,y,z,x,y,z);tails.push(0,1);
    }
    const rainGeo=geom(new T.BufferGeometry());
    rainGeo.setAttribute('position',new T.Float32BufferAttribute(rainVerts,3));
    rainGeo.setAttribute('aEnd',new T.Float32BufferAttribute(tails,1));
    const rainMat=mat(new T.ShaderMaterial({uniforms:{uTime:{value:0}},transparent:true,depthWrite:false,
      vertexShader:`attribute float aEnd;uniform float uTime;varying float vFade;void main(){
        float falling=mod(position.y-uTime*10.1,25.);
        vec3 p=vec3(position.x+(25.-falling)*.27,falling-4.,position.z);
        p+=aEnd*vec3(.14,-.59,-.05);
        vFade=smoothstep(1.,7.,distance(cameraPosition,p))*(1.-smoothstep(35.,80.,distance(cameraPosition,p)));
        gl_Position=projectionMatrix*viewMatrix*vec4(p,1.);
      }`,
      fragmentShader:'varying float vFade;void main(){gl_FragColor=vec4(.68,.80,.85,.21*vFade);}'
    }));
    const rain=new T.LineSegments(rainGeo,rainMat);rain.frustumCulled=false;group.add(rain);

    const surf=act===1?null:TideSurf.create(group,{water,rockMaterial:rockMat,index,fog});

    const glowGeo=geom(new T.BufferGeometry());
    const glowPos=[],glowTint=[];
    flamePoints.forEach(([x,y,z,green])=>{
      glowPos.push(x,y,z);
      glowTint.push(...(green?[.26,1,.85]:[1,.55,.19]));
    });
    glowGeo.setAttribute('position',new T.Float32BufferAttribute(glowPos,3));
    glowGeo.setAttribute('tint',new T.Float32BufferAttribute(glowTint,3));
    const beamAxis=new T.Vector3(0,0,1),beamDirection=new T.Vector3();
    const glow=mat(new T.ShaderMaterial({transparent:true,depthWrite:false,blending:T.AdditiveBlending,
      vertexShader:'attribute vec3 tint; varying vec3 c;void main(){c=tint;vec4 mv=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*mv;gl_PointSize=clamp(525./max(1.,-mv.z),4.,42.);}',
      fragmentShader:'varying vec3 c;void main(){vec2 p=gl_PointCoord*2.-1.;float d=dot(p,p);float a=max(0.,exp(-d*4.)-exp(-4.));gl_FragColor=vec4(c,a*.38);}'
    }));
    group.add(new T.Points(glowGeo,glow));

    return {
      marker,water,finalPile,wash,
      update(t,cues={},players){
        frameShadow(players);uniforms.uTime.value=t;
        if(cues.vessel){
          uniforms.uShoreLamp.value=cues.rangeGreen;
        }
        if(cues.basinBounds)uniforms.basin.value.fromArray(cues.basinBounds);
        rainMat.uniforms.uTime.value=t;
        const strength=T.MathUtils.clamp(cues.light||0,0,1);
        water.position.y=Number.isFinite(cues.water)?cues.water:-4;
        surf?.update(t,water.position.y);
        const float=TideBuoyMotion.pose(index,t,water.position.y);
        marker.position.set(float.x,float.y,float.z);marker.rotation.set(float.rx,float.ry,float.rz);
        buoyFoam.update(float,seaHeight,t);
        const angle=Number.isFinite(cues.angle)?cues.angle:Math.sin(t*.14)*.32;
        beam.rotation.y=angle;
        beamMat.uniforms.uPower.value=strength;
        lamp.visible=strength>.018;
        beam.visible=strength>.025&&!cues.rays;
        if(cues.rays){
          const [a,b]=cues.rays;
          uniforms.uNearOptic.value.set(a.x,a.twin,a.width,a.power);
          uniforms.uFarOptic.value.set(b.x,b.twin,b.width,b.power);
          uniforms.uGhost.value.set(a.ghost,b.ghost);lamp.visible=false;
        }
        if(cues.pilot){
          const b=cues.pilot;
          uniforms.uPilot.value.set(b.bearing,1);
          const bow=b.bow||[b.x,water.position.y+1.48,b.z];
          const range=Math.max(1,Math.hypot(bow[0]-lantern.x,bow[2]-lantern.z));
          beamDirection.set(Math.sin(b.bearing),(bow[1]-lantern.y)/range,-Math.cos(b.bearing)).normalize();
          beam.quaternion.setFromUnitVectors(beamAxis,beamDirection);
          pilotLamp.target.position.copy(lantern).addScaledVector(beamDirection,range);
          pilotLamp.intensity=4600*strength;
        }
        uniforms.uSignal.value=strength;uniforms.uBearing.value=angle;
        rotors.forEach((obj,i)=>obj.rotation.x=t*(i%2?.27:-.25)*(1+strength*2));
        optics.forEach((obj,i)=>{obj.rotation.y=(i%2?-.70:.70)+.12*Math.sin(t*.15+i)+angle*.22;});
        if(cues.rescue>0)rain.visible=cues.rescue<.88;else rain.visible=true;
      },
      dispose(){
        if(disposed)return;
        disposed=true;
        windSea.dispose();wash.dispose();finalPile?.dispose();buoyFoam.dispose();buoyLantern.dispose();buoyBody.dispose();surf?.dispose();scene.remove(group);
        if(scene.background===sky || scene.background===fogColor){
          scene.background=previous.background;
          scene.backgroundIntensity=previous.intensity;
        }
        if(scene.environment===sky)scene.environment=previous.env;
        if(scene.fog===fog)scene.fog=previous.fog;
        group.traverse(obj=>{if(obj.isInstancedMesh)obj.dispose();});
        sun.shadow.dispose();
        geometry.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());
        group.clear();
      }
    };
  }

  return {create,swells};
})();
