// The pond is shared, while the two chase cameras and their planar reflections are independent.
const TideRegattaView=(()=>{
  const T=THREE;
  function create(renderer){
    const scene=new T.Scene(),owned=[],actors=[],own=x=>(owned.push(x),x);
    let alive=true;scene.background=new T.Color(0xa9c4cf);scene.fog=new T.FogExp2(0xb9ced0,.021);
    const hemi=new T.HemisphereLight(0xfff1cf,0xaaa78a,1.45);scene.add(hemi);
    const sun=new T.DirectionalLight(0xffe3ac,3.25);sun.position.set(-5,8,-4);sun.castShadow=true;
    Object.assign(sun.shadow.camera,{left:-4.9,right:4.9,top:4.6,bottom:-4.6,near:.8,far:20});
    sun.shadow.mapSize.set(2048,2048);sun.shadow.bias=-.00024;sun.shadow.normalBias=.003;scene.add(sun,sun.target);
    const pool=TideRegattaPool.create(scene),duo=TideChildDuo.createRegatta(scene),boats=TideRegattaBoats.create(scene);
    actors.push(pool,duo,boats);
    const prize=TideRegattaBoats.createCap(scene);prize.model.position.set(-.76,.169,2.23);
    const ready=new Promise((resolve,reject)=>{
      const img=new Image();img.onload=()=>resolve(img);img.onerror=reject;
      if(window.TideRegattaSky)img.src=window.TideRegattaSky;
      else {const script=document.createElement('script');script.src='assets/regatta-sky.js';script.onload=()=>{img.src=window.TideRegattaSky;script.remove();};script.onerror=reject;document.head.append(script);}
    }).then(img=>{
      if(!alive)return;
      const sky=own(new T.Texture(img));sky.mapping=T.EquirectangularReflectionMapping;sky.colorSpace=T.SRGBColorSpace;sky.needsUpdate=true;
      scene.background=sky;scene.environment=sky;scene.backgroundIntensity=1.08;
    }).catch(()=>{});
    const mat=(col,rough=.68,metal=.08)=>own(new T.MeshStandardMaterial({color:col,roughness:rough,metalness:metal}));
    const wood=mat(0x865c3b,.83),edge=mat(0xd1a759,.66),metal=mat(0x77827d,.48,.54),white=mat(0xf1e7c8,.79);
    const red=mat(0xb33e2e),green=mat(0x26766e),black=mat(0x2e3939),cork=mat(0x976c47,.91);
    const boxGeo=own(new T.BoxGeometry(1,1,1)),cylGeo=own(new T.CylinderGeometry(1,1,1,16));
    function mesh(parent,geo,m,x,y,z,w,h,d){const o=new T.Mesh(geo,m);o.scale.set(w,h,d);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;parent.add(o);return o;}
    const box=(g,m,x,y,z,w,h,d)=>mesh(g,boxGeo,m,x,y,z,w,h,d);
    const cyl=(g,m,x,y,z,r,h)=>mesh(g,cylGeo,m,x,y,z,r,h,r);
    function print(text,fill,colour,size=120){
      const c=document.createElement('canvas');c.width=256;c.height=160;const p=c.getContext('2d');
      p.fillStyle=fill;p.fillRect(0,0,256,160);p.strokeStyle='#ddc79b';p.lineWidth=5;p.strokeRect(6,6,244,148);
      p.font='bold '+size+'px "Arial", "PingFang SC", sans-serif';p.fillStyle=colour;p.textAlign='center';p.textBaseline='middle';p.fillText(text,127,88,228);
      const tex=own(new T.CanvasTexture(c));tex.colorSpace=T.SRGBColorSpace;tex.anisotropy=4;
      return own(new T.MeshStandardMaterial({map:tex,side:T.DoubleSide,roughness:.76}));
    }
    const flagGeo=own(new T.PlaneGeometry(1,1,6,3)),flags=[],buoys=[];
    for(const [i,g] of TideRegatta.gates.entries()){
      for(const side of [-1,1]){
        const base=new T.Group();base.position.set(g.x-side*g.nz*g.width*.5,0,g.z+side*g.nx*g.width*.5);scene.add(base);buoys.push(base);
        const paint=side>0?red:green;
        cyl(base,cork,0,.018,0,.041,.065);cyl(base,paint,0,.046,0,.039,.036);cyl(base,white,0,.038,0,.040,.009);
        cyl(base,metal,0,.112,0,.004,.115);
        if(i===4){
          const board=new T.Group();base.add(board);board.rotation.y=-.80;
          for(let y=0;y<2;y++)for(let x=0;x<4;x++)box(board,(x+y)%2?white:black,.012+x*.024,.162-y*.023,0,.024,.023,.002);
        }else{
          const flag=mesh(base,flagGeo,print(String(i+1),side>0?'#a63b2c':'#256e64','#f6ebc9'),.039,.148,0,.078,.046,1);
          flags.push(flag);
        }
      }
    }
    // The children's ruler makes a bridge with two real passages underneath it.
    const bridge=new T.Group();bridge.position.set(-.24,0,-1.34);scene.add(bridge);
    for(const z of [-.70,-.02,.70]){
      cyl(bridge,wood,0,.133,z,.052,.43);cyl(bridge,metal,0,.206,z,.056,.019);
    }
    for(const x of [-.115,.115])box(bridge,wood,x,.30,0,.033,.058,1.54);
    for(let j=0;j<20;j++)box(bridge,j%4?wood:edge,0,.342,-.73+j*.077,.295,.030,.073);
    const rule=mesh(bridge,flagGeo,print('北岬  1998','#a69265','#393b32',38),.135,.298,0,.36,.051,1);
    rule.rotation.y=Math.PI/2;
    const pdl=new T.Group();pdl.position.set(.53,0,-.92);scene.add(pdl);
    cyl(pdl,metal,0,.028,0,.021,.23);box(pdl,wood,0,.040,0,.486,.061,.050);
    for(const s of [-1,1])box(pdl,edge,s*.186,.042,0,.071,.061,.052);
    // Transparent water leaves the actual pale floor visible through the reflected courtyard.
    const uniforms={uTime:{value:0},uSceneProject:{value:new T.Matrix4()},uSceneWeight:{value:0},uSceneLevel:{value:0},uSceneMap:{value:null},
      hull:{value:[new T.Vector4(),new T.Vector4()]}};
    const waterMat=own(new T.ShaderMaterial({uniforms,transparent:true,depthWrite:false,side:T.DoubleSide,
      vertexShader:`varying vec3 pw;void main(){vec4 w=modelMatrix*vec4(position,1.);pw=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}`,
      fragmentShader:`uniform float uTime,uSceneWeight; uniform vec4 hull[2];uniform sampler2D uSceneMap;uniform mat4 uSceneProject;varying vec3 pw;
      void main(){vec2 p=pw.xz;float t=uTime;vec2 n=vec2(.032*cos(p.x*23.+p.y*9.-t*2.4)+.013*cos(p.x*58.-p.y*14.+t*3.1),.028*cos(p.y*32.+p.x*6.+t*2.2)+.012*cos(p.y*71.+t*4.));
      for(int i=0;i<2;i++){vec2 delta=p-hull[i].xy;float rr=length(delta);n+=normalize(delta+.0001)*sin(rr*77.-t*9.)*exp(-rr*5.1)*.16*min(1.,hull[i].z);}
      vec3 norm=normalize(vec3(n.x,1.,n.y)),v=normalize(cameraPosition-pw);float fres=.12+.82*pow(1.-max(0.,dot(norm,v)),3.);vec3 refl=vec3(.67,.79,.80);
      if(uSceneWeight>.5){vec4 pp=uSceneProject*vec4(p.x,.0001,p.y,1.);vec2 uv=pp.xy/pp.w*.5+.5+n*.091;vec4 col=texture2D(uSceneMap,uv);float ok=step(0.,uv.x)*step(0.,uv.y)*step(uv.x,1.)*step(uv.y,1.);refl=mix(refl,col.rgb/max(.001,col.a),ok*clamp(col.a,0.,1.));}
      float glint=pow(max(0.,dot(reflect(normalize(vec3(5.,-8.,4.)),norm),v)),110.);vec3 c=mix(vec3(.080,.29,.25),refl,.39+.56*fres)+glint*vec3(2.0,1.8,1.17);
      gl_FragColor=vec4(c,.24+.58*fres);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
      }`}));
    const surfaceGeo=own(new T.BufferGeometry());surfaceGeo.setAttribute('position',new T.Float32BufferAttribute([-3.2,0,-2.05,-3.2,0,2.05,3.2,0,2.05,3.2,0,-2.05],3));surfaceGeo.setIndex([0,1,2,0,2,3]);
    const water=new T.Mesh(surfaceGeo,waterMat);water.renderOrder=3;scene.add(water);
    const floorLight=own(new T.ShaderMaterial({uniforms:{uTime:uniforms.uTime},transparent:true,depthWrite:false,blending:T.AdditiveBlending,
      vertexShader:'varying vec2 at;void main(){at=position.xz;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader:`uniform float uTime;varying vec2 at;void main(){vec2 p=at*6.;float t=uTime*.42;float f=sin(p.x+sin(p.y*1.43+t)*1.74+t)+sin(p.y*1.7+cos(p.x*1.21-t)*1.23-t);float k=exp(-abs(f)*14.);gl_FragColor=vec4(.43,.55,.32,k*.24);}`}));
    const caustic=new T.Mesh(surfaceGeo,floorLight);caustic.position.y=-.155;caustic.renderOrder=2;scene.add(caustic);
    const wakeMat=own(new T.ShaderMaterial({transparent:true,depthWrite:false,side:T.DoubleSide,
      vertexShader:'attribute float strength;varying float a;varying vec2 st;void main(){a=strength;st=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader:'varying float a;varying vec2 st;void main(){float k=sin(st.y*147.+st.x*5.)*.11+.84;gl_FragColor=vec4(.80,.91,.80,a*k*sin(st.x*3.14159));}'}));
    const wakes=[0,1].map(()=>[-1,0,1].map(()=>{
      const geo=own(new T.BufferGeometry()),pos=new Float32Array(37*6),strength=new Float32Array(74),uv=[],ix=[];
      for(let j=0;j<37;j++){uv.push(0,j/36,1,j/36);if(j<36){const n=2*j;ix.push(n,n+1,n+2,n+1,n+3,n+2);}}
      geo.setAttribute('position',new T.BufferAttribute(pos,3).setUsage(T.DynamicDrawUsage));geo.setAttribute('strength',new T.BufferAttribute(strength,1).setUsage(T.DynamicDrawUsage));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.setIndex(ix);geo.setDrawRange(0,0);
      const obj=new T.Mesh(geo,wakeMat);obj.frustumCulled=false;obj.renderOrder=4;scene.add(obj);return obj;
    }));
    function foam(b,i,t){
      for(const [k,obj] of wakes[i].entries()){
        const side=k-1,g=obj.geometry,pos=g.attributes.position,alpha=g.attributes.strength;
        for(const [j,v] of b.trail.entries()){
          const age=t-v.t,sd=side*(.035+age*.122*Math.min(v.v,1.55)),half=side?.013+age*.013:.019+age*.009;
          for(let l=0;l<2;l++){
            const d=sd+half*(l?1:-1),n=j*2+l;
            pos.setXYZ(n,v.x+Math.cos(v.h)*d,.006+Math.sin(age*14)*.001,v.z+Math.sin(v.h)*d);
            alpha.setX(n,Math.max(0,1-age/(side?2.05:1.1))*Math.min(1,v.v*1.6)*(side?.43:.66));}}
        pos.needsUpdate=alpha.needsUpdate=true;g.setDrawRange(0,Math.max(0,b.trail.length-1)*6);
      }
    }
    const reflection=TideHarborReflection.create(renderer,scene,water,[caustic,...wakes.flat()],.008);
    const cams=[0,1].map(()=>new T.PerspectiveCamera(56,1,.025,100)),look=[new T.Vector3(),new T.Vector3()],snap=[true,true];
    const chart=[false,false],pv=new T.Vector3(),at=new T.Vector3();
    let last=0,previousPhase='',lastWidth=0,lastHeight=0,lastRatio=0;
    function camera(r,i,dt){
      const b=r.boats[i],cam=cams[i],h=b.h,sin=Math.sin(h),cos=Math.cos(h);
      if(r.phase==='ready'){pv.set(i?2.2:-2.85,i?1.28:1.66,i?-1.18:-.15);at.set(i?.20:-.70,.30,1.45);}
      else if(chart[i]){pv.set(.03,5.98,1.78);at.set(0,0,-.01);}
      else{
        const nearBridge=Math.exp(-Math.pow((b.x+.24)/.58,2)-Math.pow((b.z+1.33)/.60,2));
        const dist=.71+b.speed*.15;
        pv.set(b.x-sin*dist,b.recover?.93:.56+.11*b.speed+.32*nearBridge,b.z+cos*dist);
        at.set(b.x+sin*.29,.035,b.z-cos*.29);
        if(r.phase==='result'||b.time!==null){
          pv.set(b.x-.57+i*.18,.44,b.z+.74);at.set(b.x,.065,b.z);
        }
      }
      if(snap[i]){cam.position.copy(pv);look[i].copy(at);snap[i]=false;}
      else {cam.position.lerp(pv,1-Math.exp(-dt*7.8));look[i].lerp(at,1-Math.exp(-dt*13));}
      cam.lookAt(look[i]);cam.updateMatrixWorld();
    }
    function draw(r,quality=1){
      const t=r.clock,dt=Math.min(.1,Math.max(1/120,t-last));last=t;
      if(previousPhase==='ready'&&r.phase==='count')snap.fill(true);previousPhase=r.phase;
      for(const a of actors)a.update(r,t);uniforms.uTime.value=t;
      r.boats.forEach((b,i)=>{uniforms.hull.value[i].set(b.x,b.z,b.speed,0);foam(b,i,t);});
      pdl.rotation.y=-TideRegatta.paddle(t).angle;
      buoys.forEach((p,j)=>{p.position.y=.0035*Math.sin(t*2.5+j*.8);p.rotation.z=.034*Math.sin(t*2+j);});
      flags.forEach((f,j)=>f.rotation.y=-.56+.19*Math.sin(t*4.3+j*.47));
      const c=renderer.domElement,w=c.clientWidth,h=c.clientHeight;if(!w||!h)return;
      const ratio=Math.min(window.devicePixelRatio||1,1.5)*quality;
      if(w!==lastWidth||h!==lastHeight||ratio!==lastRatio){renderer.setPixelRatio(ratio);renderer.setSize(w,h,false);lastWidth=w;lastHeight=h;lastRatio=ratio;}
      renderer.setScissorTest(true);renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=true;
      for(let i=0;i<2;i++){
        const l=Math.floor(w*i/2),ww=Math.floor(w*(i+1)/2)-l,cam=cams[i];cam.aspect=ww/h;cam.updateProjectionMatrix();camera(r,i,dt);
        TideHarbor.viewport(renderer,l,ww,h);reflection.use(i,cam,ww,h,t,quality);renderer.render(scene,cam);
      }
    }
    const gateLimits={side:.80,up:.62,down:.32},gateScreen={};
    function target(r,i){
      const g=TideRegatta.gates[r.boats[i].gate];
      TideBearings.project(pv.set(g.x,.19,g.z),cams[i],gateLimits,gateScreen);
      return {x:(gateScreen.x+1)*.5,y:(1-gateScreen.y)*.5,direction:gateScreen.direction};
    }
    function toggle(i){chart[i]=!chart[i];snap[i]=true;return chart[i];}
    function dispose(){alive=false;prize.dispose();reflection.dispose();for(const a of actors)a.dispose();sun.shadow.dispose();for(const x of owned)x.dispose();scene.clear();}
    return {draw,target,toggle,dispose,ready};
  }
  return {create};
})();
