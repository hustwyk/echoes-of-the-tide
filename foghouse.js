// Both service shoes turn about their physical axles. The wheel, tread, stamping jaw
// and the rider share the same angle used by the collision surface.
const TideFoghouse=(()=>{
  const T=THREE,TAU=Math.PI*2,V=(x,y,z)=>new T.Vector3(x,y,z);
  function create(scene,g){
    const w=g.world.foghouse,root=new T.Group(),owned=new Set(),own=o=>(owned.add(o),o);
    const base=V(w.rear.x,w.rear.y,w.rear.z-4.80);root.position.copy(base);scene.add(root);
    const env=TideFoghouseEnv.create(root),gear=TideFoghouseGear.create(root);
    const box=own(new T.BoxGeometry(1,1,1)),shaft=own(new T.CylinderGeometry(1,1,1,32)),nut=own(new T.CylinderGeometry(1,1,1,6));
    const steel=TideSteel.material(0,own,true);
    const metal=(color,roughness,metalness)=>own(new T.MeshStandardMaterial({color,roughness,metalness}));
    const bronze=metal(0xab884a,.48,.73),black=metal(0x353936,.58,.73),paint=metal(0xb19b50,.71,.52),silver=metal(0x9aada6,.42,.78);
    const pieces=new Map(),dummy=new T.Object3D();
    function piece(parent,geo,mat,x,y,z,sx,sy,sz,yaw=0){
      if(!pieces.has(parent))pieces.set(parent,new Map());
      const map=pieces.get(parent),key=geo.uuid+mat.uuid;
      if(!map.has(key))map.set(key,{geo,mat,m:[]});
      dummy.position.set(x,y,z);dummy.scale.set(sx,sy,sz);dummy.rotation.set(0,yaw,0);dummy.updateMatrix();map.get(key).m.push(dummy.matrix.clone());
    }
    const gripNodes=[];
    const rotors=w.wheels.map((pad,i)=>{
      const rotor=new T.Group(),x=pad.pivot.x-base.x,z=pad.pivot.z-base.z,R=pad.r;
      rotor.position.set(x,0,z);root.add(rotor);
      piece(root,shaft,steel,x,-1.78,z,.39,2.8,.39);
      for(const [radius,y,h,m] of [[.54,-1.09,.17,bronze],[.66,-.93,.24,steel],[.35,-.73,.21,black],[.30,-.60,.033,bronze]])
        piece(rotor,shaft,m,0,y,0,radius,h,radius);
      for(let k=0;k<48;k++){
        const a=k*TAU/48,s=Math.sin(a),c=Math.cos(a);
        piece(rotor,box,steel,R*s,-.94,R*c,R*.144,.31,.15,a);
        piece(rotor,box,black,(R+.089)*s,-.97,(R+.089)*c,.093,.21,.119,a);
        if(k%4===0){
          piece(rotor,box,steel,R*.56*s,-.96,R*.56*c,.118,.19,R*.88,a);
          piece(rotor,nut,bronze,R*s,-.773,R*c,.040,.039,.040,a);
        }
      }
      for(const sx of [-.62,.62]){
        piece(rotor,box,steel,sx,-.14,R,.11,.27,1.14);
        piece(rotor,box,bronze,sx,-.53,R,.092,.64,.11);
        for(const sz of [-.48,.48])piece(rotor,nut,silver,sx,.013,R+sz,.038,.034,.038);
      }
      for(let k=0;k<21;k++)piece(rotor,box,steel,-.67+k*.067,-.058,R,.032,.104,1.10);
      for(let k=0;k<7;k++)piece(rotor,box,black,0,-.111,R-.48+k*.16,1.42,.075,.044);
      for(const sz of [-.56,.56])piece(rotor,box,paint,0,-.030,R+sz,1.44,.074,.055);
      const side=i?1:-1;
      piece(rotor,box,steel,side*.64,.36,R,.082,.72,.107);
      piece(rotor,box,bronze,side*.54,.75,R,.29,.12,.27);
      for(const u of [-.094,.094])piece(rotor,box,silver,side*.49,.837,R+u,.145,.067,.049);
      const jaw=new T.Group();jaw.position.set(side*.46,.82,R);rotor.add(jaw);gripNodes.push(jaw);
      return rotor;
    });
    // The conning window stays fixed to the bridge as the lookout turns inside it.
    const frame=new T.Group();scene.add(frame);
    for(const x of [-.354,.354]){
      piece(frame,box,steel,x,0,-1.05,.028,1.03,.09);
      for(let k=0;k<8;k++)piece(frame,box,bronze,x,-.43+k*.12,-.995,.018,.018,.019);
    }
    piece(frame,box,steel,0,-.46,-1.05,1.48,.095,.12);
    piece(frame,box,black,0,.51,-1.05,1.48,.062,.1);
    // A hinged wiper crosses the lower quarter of the glass between squalls.
    const wiper=new T.Group();frame.add(wiper);wiper.position.set(.47,-.42,-1.026);
    piece(wiper,box,black,0,.225,0,.012,.45,.015);
    piece(wiper,box,black,-.045,.47,0,.30,.021,.023);
    for(const [parent,groups] of pieces)for(const {geo,mat,m} of groups.values()){
      const obj=own(new T.InstancedMesh(geo,mat,m.length));m.forEach((matrix,i)=>obj.setMatrixAt(i,matrix));
      obj.castShadow=obj.receiveShadow=true;parent.add(obj);
    }
    const up=V(0,1,0),look=new T.Matrix4(),lamp=V(...TideFogSignal.lamp),eye=V(0,0,0),center=V(0,0,0);
    function sheet(width,height,fragment){
      const mat=own(new T.ShaderMaterial({uniforms:{t:{value:0},water:{value:0}},transparent:true,depthWrite:false,side:T.DoubleSide,
        vertexShader:'varying vec2 st;void main(){st=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
        fragmentShader:'varying vec2 st;uniform float t,water;float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}'+fragment}));
      return new T.Mesh(own(new T.PlaneGeometry(width,height)),mat);
    }
    const glass=sheet(1.31,.92,`void main(){
      vec2 p=vec2(st.x*82.+.13*st.y,st.y*10.+t*.42);vec2 c=floor(p);vec2 q=fract(p)-vec2(.5,.5);
      float seed=hash(c);float drop=(1.-smoothstep(.14,.47,length(q*vec2(2.6,1.55))))*step(.78,seed);
      float streak=smoothstep(.944,.999,sin(st.x*631.+st.y*4.+t*.9))*.025;
      gl_FragColor=vec4(.70,.83,.84,(drop*.23+streak)*(.43+water*.57));}`);
    glass.position.set(0,0,-1.058);frame.add(glass);
    const veil=sheet(43,36,`void main(){
      float streak=.5+.5*sin(st.x*1050.+st.y*113.+t*27.);
      float drift=.5+.5*sin(st.x*19.+st.y*3.-t*1.4)*sin(st.x*5.7-st.y*5.1+t);
      float edge=smoothstep(0.,.19,st.x)*smoothstep(0.,.19,1.-st.x)*smoothstep(0.,.22,st.y)*smoothstep(0.,.22,1.-st.y);
      gl_FragColor=vec4(.31+.09*drift,.38+.09*drift,.40+.09*drift,water*edge*(.84+.1*drift+.05*streak));}`);
    scene.add(veil);veil.renderOrder=3;
    const can=document.createElement('canvas');can.width=can.height=96;const ctx=can.getContext('2d'),glow=ctx.createRadialGradient(48,48,0,48,48,48);
    for(const [k,c] of [[0,'#fffde7'],[.12,'#ffe9b6'],[.32,'rgba(255,219,153,.35)'],[1,'rgba(255,202,147,0)']])glow.addColorStop(k,c);
    ctx.fillStyle=glow;ctx.fillRect(0,0,96,96);
    const beacon=new T.Sprite(own(new T.SpriteMaterial({map:own(new T.CanvasTexture(can)),transparent:true,depthWrite:false,blending:T.AdditiveBlending})));
    beacon.position.copy(lamp);beacon.scale.setScalar(3.5);scene.add(beacon);
    const grips=[new T.Vector3(),new T.Vector3()];
    function update(g){
      const r=g.fog,p=g.players[0],editing=r.mode==='edit',phase=r.spin%1;
      w.wheels.forEach((pad,i)=>rotors[i].rotation.y=pad.angle);
      env.update(g.time,r.storm);
      const stamp=TideFogSignal.slots(r)[r.trace.source.length];
      gear.update({...r,keyState:r.key,carrier:[p.x-base.x,p.y-base.y,p.z-base.z,p.yaw],phase,editing,
        trace:editing?r.paper:r.trace,localCount:r.trace.source.length,aftCount:r.trace.aft.length,bridgeCount:r.trace.bridge.length,
        dark:TideFogSignal.dark(g),contact:r.mode==='sending'&&Math.abs(TideFogSignal.camTime(r)-stamp)<(g.stage?.15:.10),time:g.time});
      const cam=TideFogSignal.cabin(g);eye.fromArray(cam.eye);
      beacon.position.copy(lamp).lerp(eye,Math.min(.45,6.6/eye.distanceTo(lamp)));
      frame.position.copy(eye);frame.quaternion.setFromRotationMatrix(look.lookAt(eye,lamp,up));
      frame.visible=['bridge','spot'].includes(r.mode);
      wiper.rotation.z=-.81+.93*Math.sin(g.time*(.98+r.storm*.4));
      center.copy(eye).lerp(lamp,.6);veil.position.copy(center);veil.lookAt(eye);
      for(const sheet of [veil,glass]){sheet.material.uniforms.water.value=r.storm;sheet.material.uniforms.t.value=g.time;}
      veil.visible=r.storm>.008;beacon.material.opacity=(1-r.storm)*Math.min(1,.58+TideFogSignal.wind(g)*.52);
    }
    function hands(g,i){
      const r=g.fog,s=TideFogSignal.target(g,i);
      if(g.engaged[i]){
        if(s.kind==='shoe'){
          const jaw=gripNodes[s.index];jaw.updateWorldMatrix(true,false);
          return grips.map((v,k)=>v.set(0,.014,k?.087:-.087).applyMatrix4(jaw.matrixWorld));
        }
        return gear.hands(s.kind,s.kind==='bench'?r.stud:0);
      }
      return !i&&r.key==='carry'?gear.hands('carry',0):null;
    }
    const world=a=>[base.x+a[0],base.y+a[1],base.z+a[2]];
    const view=(a,b,fov,handsOnly=false)=>({eye:world(a),at:world(b),fov,handsOnly});
    function shot(g,i){
      const r=g.fog,p=g.players[i],s=TideFogSignal.target(g,i);
      if(i&&(r.mode==='bridge'||r.mode==='spot'&&g.engaged[i]))return {...TideFogSignal.cabin(g),handsOnly:true};
      if(i&&r.mode==='aft')return view([2.46,3.25,-13.67],[5.47,1.66,-7.89],55);
      if(!i&&r.key==='carry'&&!g.engaged[0]){
        return {eye:[p.x+.96,p.y+3.6,p.z+3.90],at:[p.x,p.y+.1,p.z-1.35],fov:61};
      }
      if(!g.engaged[i])return null;
      if(s.kind==='drive')return view([-3.91,1.63,-5.55],[-3.47,1.25,-7.07],48,true);
      if(s.kind==='bench')return view([3.60,2.11,1.05],[3.90,1.10,-.37],47,true);
      if(s.kind==='horn')return r.mode==='ack'?view([3.92,1.55,-3.83],[3.55,1.109,-4.93],39,true):view([3.84,1.76,-3.31],[3.20,1.16,-4.95],48,true);
      if(s.kind==='clutch')return view([3.05,2.62,5.80],[-1.25,.38,1.50],58);
      if(s.kind==='shoe')return {eye:[p.x+.98,p.y+2.13,p.z+1.65],at:[p.x,p.y+.63,p.z-.22],fov:56};
      return null;
    }
    return {update,hands,shot,dispose(){env.dispose();gear.dispose();for(const obj of [beacon,veil,frame,root])obj.removeFromParent();owned.forEach(o=>o.dispose());}};
  }
  return {create};
})();
