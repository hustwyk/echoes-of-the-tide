// The machinery, working grips and lamp share the local frame of the station's traversable surfaces.
const TideSignalHouse=(()=>{
  const T=THREE,TAU=2*Math.PI;
  function create(scene,g,equipment){
    const owned=new Set(),own=a=>(owned.add(a),a),root=new T.Group(),origin=TideSignal.point(0,0,0);
    root.position.set(origin.x,0,origin.z);root.rotation.y=TideSignal.yaw;scene.add(root);
    const paint=TideSteel.material(0,own,true),plate=TideSteel.material(1,own);
    const concrete=own(TideConcrete.material(0xc1bba9,-3.6));
    const metal=(c,m=.62,r=.39)=>own(new T.MeshStandardMaterial({color:c,metalness:m,roughness:r}));
    const iron=metal(0x343d3d),bronze=metal(0xb6874f,.76,.33),copper=metal(0x925539,.77,.31);
    const black=metal(0x181e20,.25,.64),white=metal(0xdccda6,.15,.52),red=metal(0x9d4734);
    const green=metal(0x426756),yellow=metal(0xcfaa5c,.52,.47);
    const glass=metal(0x20573e,.26,.24);glass.emissive.setHex(0x3cffa1);
    const pilot=metal(0x996f38,.13,.20);pilot.emissive.setHex(0xffb765);
    const tx=own(new T.BoxGeometry(1,1,1)),cy=own(new T.CylinderGeometry(.5,.5,1,32)),ring=own(new T.TorusGeometry(1,.095,10,64)),rim=own(new T.TorusGeometry(1,.016,8,64)),bolt=own(new T.CylinderGeometry(.5,.5,1,6));
    const all=new Map(),dummy=new T.Object3D(),v=new T.Vector3(),up=new T.Vector3(0,1,0);
    function group(parent,x,y,z){
      const n=new T.Group();n.position.set(x,y,z);parent.add(n);return n;
    }
    function stamp(parent,geo,mat,x,y,z,w,h,d,rx=0,ry=0,rz=0,quat){
      dummy.position.set(x,y,z);dummy.scale.set(w,h,d);dummy.rotation.set(rx,ry,rz);
      if(quat)dummy.quaternion.copy(quat);dummy.updateMatrix();
      if(!all.has(parent))all.set(parent,new Map());
      const batch=all.get(parent),key=geo.id+'/'+mat.id;
      if(!batch.has(key))batch.set(key,{geo,mat,matrices:[]});
      batch.get(key).matrices.push(dummy.matrix.clone());
    }
    const box=(p,m,x,y,z,w,h,d,rx,ry,rz)=>stamp(p,tx,m,x,y,z,w,h,d,rx,ry,rz);
    const cyl=(p,m,x,y,z,w,h,d,rx,ry,rz)=>stamp(p,cy,m,x,y,z,w,h,d,rx,ry,rz);
    const hoop=(p,m,x,y,z,r,rx=0,ry=0)=>stamp(p,ring,m,x,y,z,r,r,r,rx,ry);
    function bar(p,m,a,b,r){
      const d=v.set(b[0]-a[0],b[1]-a[1],b[2]-a[2]),h=d.length(),q=new T.Quaternion().setFromUnitVectors(up,d.normalize());
      stamp(p,cy,m,(a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2,r*2,h,r*2,0,0,0,q);
    }
    function label(p,x,y,z,w,h,words,bg='#28423f',ink='#f0deb3'){
      const c=document.createElement('canvas');c.width=768;c.height=Math.round(768*h/w);
      const ctx=c.getContext('2d');ctx.fillStyle=bg;ctx.fillRect(0,0,c.width,c.height);
      ctx.strokeStyle=ink;ctx.lineWidth=4;ctx.strokeRect(8,8,c.width-16,c.height-16);
      const rows=words.split('\n');ctx.fillStyle=ink;ctx.textAlign='center';ctx.textBaseline='middle';
      ctx.font='bold '+Math.min(.60*c.height/rows.length,.8*c.width/Math.max(...rows.map(s=>s.length)))+'px sans-serif';
      rows.forEach((s,i)=>ctx.fillText(s,c.width/2,c.height*(i+.5)/rows.length));
      for(const px of [16,c.width-16])for(const py of [16,c.height-16]){ctx.beginPath();ctx.arc(px,py,3,0,TAU);ctx.fill();}
      const texture=own(new T.CanvasTexture(c));texture.colorSpace=T.SRGBColorSpace;texture.anisotropy=8;
      const mesh=new T.Mesh(own(new T.PlaneGeometry(w,h)),own(new T.MeshStandardMaterial({map:texture,roughness:.55,metalness:.16})));
      mesh.position.set(x,y,z);p.add(mesh);return mesh;
    }
    const w=g.world.signal;
    // Drainage joints separate foot-worn slabs. The lighthouse plinth stands alone in the sea.
    for(const floor of g.world.floors){
      if(floor===w.bridge)continue;
      const p=TideSignal.local(floor),cols=Math.ceil(floor.w/2.15),rows=Math.ceil(floor.d/1.55);
      box(root,concrete,p.x,floor.y-.40,p.z,floor.w,.65,floor.d);
      for(let a=0;a<cols;a++)for(let j=0;j<rows;j++){
        box(root,floor===w.head?plate:concrete,p.x+floor.w*((a+.5)/cols-.5),floor.y-.065,p.z+floor.d*((j+.5)/rows-.5),floor.w/cols-.022,.13,floor.d/rows-.018);
      }
      if(floor.d>3||floor===w.head)for(const sx of [-1,1])for(const sz of [-1,1]){
        const x=p.x+sx*(floor.w*.5-.40),z=p.z+sz*(floor.d*.5-.48);
        cyl(root,concrete,x,floor.y/2-4.25,z,.78,8.5+floor.y,.78);
        cyl(root,iron,x,-2.65,z,.82,.25,.82);
      }
    }
    const rails=(x1,z1,x2,z2,y)=>{
      const posts=Math.ceil(Math.hypot(x2-x1,z2-z1)/1.9);
      for(let j=0;j<=posts;j++){
        const x=x1+(x2-x1)*j/posts,z=z1+(z2-z1)*j/posts;
        cyl(root,paint,x,y+.51,z,.080,1.02,.08);box(root,plate,x,y+.045,z,.22,.09,.19);
      }
      for(const h of [.48,1.0])bar(root,paint,[x1,y+h,z1],[x2,y+h,z2],.033);
    };
    rails(-6.53,17.78,-6.53,10,0);rails(6.53,17.78,6.53,10,0);
    rails(-6.53,8.5,-6.53,5.65,.66);rails(-6.45,5.6,-1.10,5.6,.66);
    rails(6.42,8.55,6.42,2.80,.66);rails(2.05,2.70,6.40,2.70,.66);
    // The flywheel, armature and copper field windings turn on one shaft.
    const fly=group(root,-3.82,1.25,11.73),gen=group(root,-3.82,.06,11.37);
    box(gen,paint,0,.16,0,2.86,.32,1.64);box(gen,iron,0,.36,-.22,2.22,.18,1.12);
    for(const x of [-1.11,1.08])for(const z of [-.57,.55])stamp(gen,bolt,bronze,x,.345,z,.13,.09,.13);
    cyl(gen,green,0,1.18,-.28,1.23,.93,1.23,Math.PI/2);
    for(let j=0;j<20;j++)cyl(gen,j%4===0?iron:copper,0,1.18,-.89+j*.050,1.30,.033,1.30,Math.PI/2);
    for(const x of [-.87,.87]){box(gen,paint,x,.77,-.09,.35,.86,1.06);box(gen,bronze,x,1.23,-.10,.38,.115,.81);}
    hoop(fly,iron,0,0,0,.96);stamp(fly,rim,bronze,0,0,.082,.96,.96,.96);
    cyl(fly,paint,0,0,.03,.31,.31,.31,Math.PI/2);
    for(let j=0;j<8;j++){const a=j*TAU/8;bar(fly,green,[.10*Math.cos(a-.22),.10*Math.sin(a-.22),.005],[.94*Math.cos(a),.94*Math.sin(a),.005],.064);}
    // The ratchet turns the main shaft. A smaller pulley drives the oil pump.
    const pump=group(root,-5.11,.80,11.75),deltaX=pump.position.x-fly.position.x,deltaY=pump.position.y-fly.position.y;
    const separation=Math.hypot(deltaX,deltaY),ratio=(.60-.26)/separation;
    const beltNormal=Math.atan2(deltaY,deltaX),beltAngle=Math.acos(ratio);
    for(const sign of [-1,1]){
      const a=beltNormal+sign*beltAngle,nx=Math.cos(a),ny=Math.sin(a);
      bar(gen,black,[.60*nx,1.19+.60*ny,.24],[deltaX+.26*nx,1.19+deltaY+.26*ny,.24],.041);
    }
    hoop(fly,black,0,0,-.12,.60);hoop(pump,black,0,0,-.14,.26);
    cyl(pump,copper,0,0,-.16,.42,.22,.42,Math.PI/2);
    for(let j=0;j<12;j++){
      const a=j*TAU/12;stamp(fly,bolt,bronze,.211*Math.sin(a),.211*Math.cos(a),.111,.051,.031,.051,Math.PI/2);
    }
    cyl(fly,paint,0,0,.065,.53,.078,.53,Math.PI/2);
    cyl(fly,bronze,0,0,.17,.154,.104,.154,Math.PI/2);
    for(let j=0;j<7;j++)box(gen,green,-.59+j*.195,1.40,-.35,.069,.79,.83);
    bar(gen,copper,[-1.15,.47,.09],[-1.15,1.10,.09],.036);
    bar(gen,copper,[-1.15,1.10,.09],[-.80,1.10,.09],.036);
    cyl(gen,bronze,-1.15,1.19,.09,.16,.13,.16);
    const handle=group(root,-3.85,.51,12.28);
    bar(handle,red,[0,0,0],[0,.58,.24],.037);bar(handle,black,[-.29,.58,.24],[.29,.58,.24],.04);
    const pegs=(parent,a,b)=>[group(parent,...a),group(parent,...b)];
    const crankHands=pegs(handle,[-.18,.58,.24],[.18,.58,.24]);
    label(gen,-.81,.59,.62,.64,.20,'北岬機械工場');
    for(let j=0;j<5;j++)for(const x of [-1,1]){
      box(gen,iron,x*.89,.63+j*.095,.472,.28,.032,.055);
    }
    const install=(s,type,i)=>{
      const pos=TideSignal.local(s),dev=equipment.device(type,i);
      dev.position.set(pos.x,s.y,pos.z-.65);root.add(dev);return dev;
    };
    const clutch=install(w.pilot,'breaker',1),cutout=install(w.cutout,'breaker',0),radio=install(w.radio,'radio',1);
    const dial=group(root,3.67,1.33,12.10);
    cyl(dial,bronze,0,0,0,.73,.10,.73,Math.PI/2);cyl(dial,white,0,0,.063,.65,.038,.65,Math.PI/2);
    for(let j=0;j<=26;j++){
      const a=-1.98+j/26*3.96,x=Math.sin(a)*.270,y=Math.cos(a)*.270;
      box(dial,j>=13&&j<=21?green:black,x,y,.087,.011,j%2?.031:.058,.008,0,0,-a);
    }
    const tach=group(dial,0,0,.10),needle=group(dial,0,0,.117);
    box(tach,black,0,.134,0,.018,.267,.010);box(needle,red,0,.097,0,.021,.207,.009);
    cyl(dial,bronze,0,0,.14,.056,.019,.056,Math.PI/2);
    label(dial,0,-.17,.092,.31,.084,'飛輪　RPM','#d7c9ac','#2f3834');
    cyl(dial,iron,.54,-.085,.04,.18,.09,.18,Math.PI/2);cyl(dial,pilot,.54,-.085,.099,.135,.035,.135,Math.PI/2);
    box(root,paint,3.68,.63,11.75,2.24,1.23,.44);label(root,3.72,.95,11.988,1.54,.30,'機　房　／　試　燈');
    // Porcelain insulators and rain loops take the restored feed to the seaward light.
    for(const x of [-5.75,-5.0])for(const z of [11.62,7.28]){
      cyl(root,iron,x,1.12,z,.09,2.23,.09);
      for(let j=0;j<5;j++)cyl(root,white,x,2.13+j*.05,z,.19-j*.01,.027,.19-j*.01);
      if(z===11.62){bar(root,black,[x,2.37,z],[x,2.14,9.47],.014);bar(root,black,[x,2.14,9.47],[x,2.37,7.28],.014);}
    }
    const canopy=(xs,ze,y)=>{
      for(const x of xs){
        box(root,paint,x,y*.5+.33,ze,.14,y-.66,.14);
        bar(root,paint,[x,y-.87,ze],[x,y-.12,ze+.83],.043);
      }
      const mid=(xs[0]+xs[1])/2,span=xs[1]-xs[0]+.44;
      box(root,paint,mid,y,ze+.85,span,.12,2.32,-.035);
      for(let j=0;j<span/.18;j++)box(root,paint,xs[0]-.12+j*.18,y+.072,ze+.85,.045,.047,2.32,-.035);
      box(root,bronze,mid,y-.071,ze+2.00,span,.12,.085);
    };
    canopy([-6.29,-1.37],5.77,3.82);
    label(root,-3.80,2.76,6.11,1.98,.43,'北岬　引導標');box(root,paint,-3.80,2.76,6.07,2.04,.49,.055);
    // Keep the actual radio window open from the observer's optical axis to the buoy.
    for(const x of [2.28,6.19])box(root,paint,x,1.78,3.12,.105,2.24,.105);
    box(root,paint,4.22,2.96,3.12,4.15,.11,.13);
    box(root,paint,4.20,.99,3.12,3.98,.63,.12);
    const scope=group(root,4.68,1.92,4.05);
    cyl(scope,bronze,0,0,0,.128,.43,.128,Math.PI/2);cyl(scope,black,0,.015,-.22,.18,.14,.18,Math.PI/2);
    bar(scope,iron,[0,-.52,0],[0,-.05,0],.030);label(root,5.34,1.25,3.22,1.01,.23,'北線　／　收報');
    const drum=group(root,1.85,1.65,5.95);
    cyl(drum,bronze,0,0,0,.33,.31,.33,Math.PI/2);hoop(drum,iron,0,0,.21,.27);
    for(let j=0;j<6;j++){const a=j*TAU/6;bar(drum,iron,[0,0,.21],[.25*Math.cos(a),.25*Math.sin(a),.21],.014);}
    const chainHands=pegs(root,[1.64,1.55,6.07],[2.01,1.72,6.08]);
    const h=TideSignal.hinge,l=TideSignal.length,stair=group(root,h.x,h.y,h.z);
    for(const x of [-.67,.67]){
      box(stair,paint,x,-.10,-l/2,.13,.22,l);
      bar(stair,paint,[x,.78,-.10],[x,.78,-l+.07],.030);
      for(let j=0;j<=3;j++)bar(stair,paint,[x,0,-.10-j*(l-.17)/3],[x,.79,-.10-j*(l-.17)/3],.025);
    }
    for(let j=0;j<18;j++){
      const z=-(j+.5)*l/18;box(stair,plate,0,-.04,z,1.30,.080,.195);
      if(j%4===0)box(stair,yellow,0,.004,z+.065,1.18,.008,.028);
    }
    cyl(root,bronze,0,.65,5.68,.25,1.63,.25,0,0,Math.PI/2);
    const wire=new T.Mesh(cy,iron);root.add(wire);
    const a=new T.Vector3(1.85,1.65,5.95),b=new T.Vector3(),d=new T.Vector3();
    // Slatted storm shutter closes around the Fresnel drum. Its chain hangs to the landing.
    const head=group(root,0,3.035,-.82);
    cyl(head,paint,0,.18,0,1.25,.36,1.25);
    cyl(head,bronze,0,.52,0,.74,.35,.74);cyl(head,iron,0,.80,0,.93,.27,.93);
    const slats=[];
    for(let j=0;j<11;j++){
      const y=.96+j*.058,r=.47+.065*Math.sin(j/10*Math.PI);
      cyl(head,glass,0,y,0,r*2,.051,r*2);stamp(head,rim,green,0,y+.030,0,r,r,r,Math.PI/2);
    }
    for(const sy of [.89,1.62])cyl(head,paint,0,sy,0,1.18,.11,1.18);
    cyl(head,paint,0,1.73,0,.76,.13,.76);cyl(head,bronze,0,1.83,0,.36,.085,.36);
    for(let j=0;j<12;j++){
      const a=TAU*j/12,x=.567*Math.sin(a),z=.567*Math.cos(a);
      const vane=group(head,x,1.26,z);vane.rotation.y=a;
      box(vane,paint,0,0,0,.307,.68,.032);slats.push(vane);
      if(j%3===0)bar(head,bronze,[x,.88,z],[x,1.61,z],.022);
    }
    for(let j=0;j<16;j++){
      const n=group(head,.43,.45+j*.055,.63);hoop(n,j%2?bronze:iron,0,0,0,.041,0,j%2?.99:0);
    }
    label(head,0,.29,.65,.66,.18,'北岬　後燈');
    const shadeHands=pegs(head,[.27,.80,.68],[.43,1.04,.65]);
    const bloom=document.createElement('canvas');bloom.width=bloom.height=128;
    const ctx=bloom.getContext('2d'),gradient=ctx.createRadialGradient(64,64,0,64,64,64);
    gradient.addColorStop(0,'rgba(211,255,218,.8)');gradient.addColorStop(.27,'rgba(110,255,152,.34)');
    gradient.addColorStop(.58,'rgba(76,234,149,.12)');gradient.addColorStop(1,'rgba(56,210,127,0)');
    ctx.fillStyle=gradient;ctx.fillRect(0,0,128,128);
    const glowMaterial=own(new T.SpriteMaterial({map:own(new T.CanvasTexture(bloom)),blending:T.AdditiveBlending,depthWrite:false,transparent:true}));
    const halo=new T.Sprite(glowMaterial);halo.position.y=1.27;halo.scale.set(2.8,2.8,1);head.add(halo);
    const lampLight=new T.PointLight(0x6cffb4,0,9,2);head.add(lampLight);lampLight.position.y=1.23;
    for(const [parent,batches] of all)for(const {geo,mat,matrices} of batches.values()){
      const mesh=new T.InstancedMesh(geo,mat,matrices.length);
      matrices.forEach((m,i)=>mesh.setMatrixAt(i,m));mesh.computeBoundingSphere();
      mesh.receiveShadow=true;mesh.castShadow=true;parent.add(mesh);
    }
    const handVectors=[0,1].map(()=>[new T.Vector3(),new T.Vector3()]);
    function hands(g,i){
      let nodes;
      if(g.stage===0&&i===0)nodes=crankHands;
      if(g.stage===2&&i===0)nodes=shadeHands;
      if(g.stage===2&&i===1&&!g.signal.pinned)nodes=chainHands;
      if(nodes)return nodes.map((n,j)=>n.getWorldPosition(handVectors[i][j]));
      return equipment.grips(g.stage===0?clutch:i?radio:cutout);
    }
    function update(g){
      const r=g.signal;
      fly.rotation.z=-r.spin;pump.rotation.z=-r.spin*.60/.26;handle.rotation.x=-.30+r.stroke*.82;
      equipment.drive(clutch,r.trim,g.time);equipment.drive(cutout,r.shutter,g.time);equipment.drive(radio,r.mic==='sending'?1:0,g.time);
      tach.rotation.z=1.98-r.rpm*3.96;needle.rotation.z=1.98-r.trim*3.96;
      pilot.emissiveIntensity=r.linked?2.8:Math.max(0,r.rpm-.25)*.38;
      glass.emissiveIntensity=.025+r.glow*4.1;glowMaterial.opacity=r.glow*.86;lampLight.intensity=r.glow*4;
      slats.forEach((v,j)=>v.rotation.y=j*TAU/12+r.shutter*1.52);
      stair.rotation.x=r.angle;drum.rotation.z=r.angle*2.8;
      b.set(.67,h.y+Math.sin(r.angle)*(l-.21),h.z-Math.cos(r.angle)*(l-.21));d.subVectors(b,a);
      wire.scale.set(.032,d.length(),.032);wire.position.copy(a).lerp(b,.5);wire.quaternion.setFromUnitVectors(up,d.normalize());
    }
    update(g);
    return {hands,update,dispose(){root.removeFromParent();root.traverse(n=>{if(n.isInstancedMesh)n.dispose();});for(const a of owned)a.dispose();}};
  }
  return {create};
})();
