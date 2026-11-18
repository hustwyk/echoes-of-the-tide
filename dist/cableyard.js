// Both views draw the same paid-out line, tool sockets, reflected flashes and light beam.
const TideCableYard=(()=>{
  const T=THREE;
  function create(scene,g,equipment,actors){
    const w=g.world.cableQuay,root=new T.Group();scene.add(root);
    const shore=TideCableQuayEnv.create(scene,g.world);
    const plant=TideCableQuayGear.create(scene,w),owned=new Set(),own=o=>(owned.add(o),o);
    const vec=(x,y,z)=>new T.Vector3(x,y,z),up=vec(0,1,0),transform=new T.Object3D();
    const wet=own(new T.MeshStandardMaterial({color:0x393a30,metalness:.33,roughness:.32}));
    const brass=own(new T.MeshStandardMaterial({color:0xbaa06d,metalness:.62,roughness:.36}));
    const red=own(new T.MeshStandardMaterial({color:0xad7444,roughness:.56,metalness:.24}));
    const glass=own(new T.MeshStandardMaterial({color:0xb2c5b6,roughness:.28,metalness:.62}));
    function part(parent,geo,m,x,y,z){
      const obj=new T.Mesh(own(geo),m);obj.position.set(x,y,z);parent.add(obj);return obj;
    }
    const texture=document.createElement('canvas');texture.width=64;texture.height=256;
    const c=texture.getContext('2d');c.fillStyle='#959085';c.fillRect(0,0,64,256);
    for(let j=-1;j<10;j++){
      c.strokeStyle=j%3?'#65675f':'#b4a17a';c.lineWidth=j%3?1.3:3;
      c.beginPath();c.moveTo(0,j*32+24);c.lineTo(64,j*32-8);c.stroke();
    }
    const braid=own(new T.CanvasTexture(texture));braid.wrapS=braid.wrapT=T.RepeatWrapping;braid.colorSpace=T.SRGBColorSpace;
    wet.map=braid;
    const body=own(new T.CylinderGeometry(1,1,1,9)),links=own(new T.InstancedMesh(body,wet,144));
    links.frustumCulled=false;links.instanceMatrix.setUsage(T.DynamicDrawUsage);links.castShadow=true;root.add(links);
    const last=vec(),next=vec(),axis=vec();let count=0;
    function span(a,b,dip,r=.051,parts=17){
      last.set(a.x,a.y,a.z);
      for(let j=1;j<=parts;j++){
        const t=j/parts;next.set(a.x+(b.x-a.x)*t,a.y+(b.y-a.y)*t-dip*4*t*(1-t),a.z+(b.z-a.z)*t);
        axis.copy(next).sub(last);transform.position.copy(last).lerp(next,.5);
        transform.scale.set(r,Math.max(.002,axis.length()+.006),r);transform.quaternion.setFromUnitVectors(up,axis.normalize());
        transform.updateMatrix();links.setMatrixAt(count++,transform.matrix);last.copy(next);
      }
    }
    const box=new T.Group();root.add(box);
    part(box,new T.CylinderGeometry(.106,.090,.32,18),red,0,0,0).rotation.z=Math.PI/2;
    for(const x of [-.16,-.093,.093,.16])part(box,new T.CylinderGeometry(.095,.095,.023,16),brass,x,0,0).rotation.z=Math.PI/2;
    part(box,new T.BoxGeometry(.20,.083,.13),glass,0,.088,0);
    part(box,new T.TorusGeometry(.065,.013,6,16,Math.PI*1.48),brass,0,.013,.102);
    const feeder=[{x:2.914,y:3.567,z:-11.172},{x:2.17,y:3.80,z:-10.72},{x:-3.54,y:1.51,z:-8.11},w.source];
    for(const k of [1,2]){
      const p=feeder[k],base=k===1?2.65:0;
      part(root,new T.BoxGeometry(.13,p.y-base,.15),wet,p.x,(p.y+base)/2,p.z);
      part(root,new T.CylinderGeometry(.14,.14,.17,16),brass,p.x,p.y-.08,p.z).rotation.x=Math.PI/2;
    }
    const breaker=equipment.device('breaker',0);breaker.position.set(w.breaker.x,w.breaker.y,w.breaker.z-.72);root.add(breaker);
    const pilotMat=own(new T.MeshStandardMaterial({color:0xb9bb82,emissive:0xffa440,roughness:.22}));
    const pilot=part(root,new T.SphereGeometry(.092,18,12),pilotMat,w.breaker.x-.42,w.breaker.y+1.38,w.breaker.z-.47);
    part(root,new T.TorusGeometry(.097,.018,8,24),brass,pilot.position.x,pilot.position.y,pilot.position.z+.003);
    const lens=w.eye,spot=new T.SpotLight(0xffda94,22,14,.13,.68,1.55);
    spot.position.set(lens.x,lens.y,lens.z);root.add(spot,spot.target);
    const coneMat=own(new T.ShaderMaterial({transparent:true,depthWrite:false,side:T.DoubleSide,blending:T.AdditiveBlending,
      uniforms:{alpha:{value:0}},vertexShader:'varying float t; void main(){t=uv.y;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
      fragmentShader:'varying float t;uniform float alpha;void main(){gl_FragColor=vec4(1.0,.79,.48,alpha*(.26+.74*t));}'}));
    const cone=new T.Mesh(own(new T.CylinderGeometry(.055,.50,1,36,1,true)),coneMat);root.add(cone);
    const pocket=new T.Group();root.add(pocket);
    const enamel=own(new T.MeshStandardMaterial({color:0x354f4d,metalness:.54,roughness:.39}));
    part(pocket,new T.BoxGeometry(.245,.169,.089),enamel,0,0,0);
    part(pocket,new T.CylinderGeometry(.053,.053,.014,20),brass,-.035,.020,.051).rotation.x=Math.PI/2;
    const dial=own(new T.MeshStandardMaterial({color:0xd1d6b3,roughness:.26,emissive:0xfac676}));
    part(pocket,new T.CircleGeometry(.044,24),dial,-.035,.020,.061);
    const needle=part(pocket,new T.BoxGeometry(.004,.065,.005),wet,-.035,.020,.067);
    for(const x of [-.103,.103])for(const y of [-.062,.062])
      part(pocket,new T.SphereGeometry(.007,7,5),brass,x,y,.045);
    part(pocket,new T.CylinderGeometry(.019,.021,.035,10),red,.074,.08,0);
    const capLight=new T.SpotLight(0xffedc1,14,9,.34,.51,1.6);
    root.add(capLight,capLight.target);
    // A low line leaves foam where that span crosses the local moving wave.
    const foamGeometry=own(new T.RingGeometry(.85,1.0,42));
    const foam=[0,1,2].map(()=>{
      const m=own(new T.MeshBasicMaterial({color:0xd7e8d6,side:T.DoubleSide,transparent:true,depthWrite:false}));
      const mesh=new T.Mesh(foamGeometry,m);root.add(mesh);mesh.visible=false;return mesh;
    });
    const normal=vec(),face=vec(0,0,1);
    const hand=[vec(),vec()];
    function testerHands(s){
      pocket.updateWorldMatrix(true,false);
      hand[0].set(-.115,0,.01).applyMatrix4(pocket.matrixWorld);
      hand[1].set(.118,-.012,0).applyMatrix4(pocket.matrixWorld);return hand;
    }
    function leadHands(s){
      const p=s.players[0],head=TideCableQuay.tip(p),c=Math.cos(p.yaw),sn=Math.sin(p.yaw);
      for(let i=0;i<2;i++){const x=i?.12:-.12;hand[i].set(head.x+x*c,head.y+.024,head.z-x*sn);}
      return hand;
    }
    function hands(s,i){
      const place=TideCableQuay.target(s,i);
      return place.kind==='breaker'?equipment.grips(breaker):plant.hands(place.kind,place.index);
    }
    let lastTime=null,handsetLift=0;
    function update(s){
      const a=s.cable,p=s.players[0],destination=vec(...TideCableQuay.beam(s));
      const dt=lastTime===null?0:Math.max(0,Math.min(.15,s.time-lastTime));lastTime=s.time;
      const lift=s.stage===2&&a.backTest&&a.power&&s.engaged[1]?1:0;
      handsetLift+=(lift-handsetLift)*(1-Math.exp(-dt*10));
      shore.update(s.time,a.water);
      plant.update({down:a.down,pilot:a.pilot,returns:a.returns,route:a.route,payout:a.payout,hooks:a.hooks,backLight:a.backLight,
        beam:destination.toArray(),windows:a.windows,patched:a.patched,tx:a.radio==='sending'||a.radio==='sent',rx:a.radio==='reply',power:a.power,handsetLift});
      equipment.drive(breaker,a.power?1:0,s.time);pilotMat.emissiveIntensity=a.power?1.5:a.backLight?3.5:.025;
      count=0;
      span(feeder[0],feeder[1],.08);span(feeder[1],feeder[2],.28+.02*Math.sin(s.time));span(feeder[2],w.source,.018);
      let from=w.source;
      for(let j=0;j<a.hooks;j++){span(from,w.eyes[j],.23);from=w.eyes[j];}
      const end=a.carried?TideCableQuay.tip(p):a.hooks?from:{x:w.head.x,y:w.source.y-.27,z:w.head.z+.23};
      if(a.carried||!a.hooks){
        const dist=Math.hypot(end.x-from.x,end.y-from.y,end.z-from.z);
        span(from,end,a.carried?TideCableQuay.sag(dist,a.payout-TideCableQuay.fixed(s)):.19);
      }
      const observer=s.players[1],watch=s.engaged[1],place=TideCableQuay.target(s,1);
      const portable=s.stage===0||s.stage===2&&!a.backTest;
      pocket.visible=portable;
      if(portable){
        const sn=Math.sin(observer.yaw),cs=Math.cos(observer.yaw);
        if(watch&&place.kind==='post'){
          pocket.position.set(place.x-.20,place.y+1.01,place.z-.35);pocket.rotation.set(-.26,0,0);
          span(pocket.position,{x:place.x+.09,y:place.y+.90,z:place.z-.48},.075,.011,8);
        }else if(watch&&place.kind==='window'){
          pocket.position.set(2.72,3.66,place.z+.23);pocket.rotation.set(-.18,Math.PI/2,0,'YXZ');
          span(pocket.position,{x:2.50,y:3.72,z:place.z+.045},.08,.011,8);
        }else{
          pocket.position.set(observer.x-.32*sn,observer.y+1.13,observer.z-.32*cs);
          pocket.rotation.set(-.45,observer.yaw,0,'YXZ');
        }
        const strength=watch?(s.stage===0?a.returns[place.index]:Math.max(a.backLight,a.windows[place.index])):0;
        dial.emissiveIntensity=.04+strength*.75;needle.rotation.z=.68-strength*1.38;
      }
      capLight.visible=s.stage===1;
      if(capLight.visible){
        const bulb=actors[0].userData.rig.bones.headlamp;bulb.getWorldPosition(capLight.position);
        if(capLight.position.distanceToSquared(p)>5)capLight.position.set(p.x,p.y+1.69,p.z);
        capLight.target.position.set(p.x-Math.sin(p.yaw)*3.1,p.y-.25,p.z-Math.cos(p.yaw)*3.1);capLight.target.updateMatrixWorld();
      }
      links.count=count;links.instanceMatrix.needsUpdate=true;box.position.set(end.x,end.y,end.z);box.rotation.y=a.carried?p.yaw:.41;
      for(let i=0;i<foam.length;i++){
        const ring=foam[i],hit=a.contact;
        ring.visible=s.stage===1&&a.carried&&a.clearance<.23;
        if(!ring.visible)continue;
        const u=(s.time*1.19+i/foam.length)%1,x=hit.x+.09*i,z=hit.z-.08*i,t=s.time;
        const h=TideLookout.swell(x,z,t),dx=(TideLookout.swell(x+.15,z,t)-h)/.15,dz=(TideLookout.swell(x,z+.15,t)-h)/.15;
        normal.set(-dx,1,-dz).normalize();ring.quaternion.setFromUnitVectors(face,normal);
        ring.position.set(x,a.water+h+.053,z);ring.scale.set(.09+.51*u,.08+.42*u,1);
        ring.material.opacity=(1-u)*Math.min(.78,Math.max(0,.23-a.clearance)*2.4);
      }
      const on=s.stage===2&&(s.engaged[0]&&a.patched<0||a.patched>=0);
      cone.visible=spot.visible=on;spot.target.position.copy(destination);spot.target.updateMatrixWorld();
      if(on){axis.copy(spot.position).sub(destination);cone.position.copy(destination).lerp(spot.position,.5);
        cone.scale.y=axis.length();cone.quaternion.setFromUnitVectors(up,axis.normalize());coneMat.uniforms.alpha.value=.085;}
    }
    function shot(s,i){
      const a=s.cable,p=s.players[i],place=TideCableQuay.target(s,i);
      if(!s.engaged[i])return null;
      const lens=(eye,at,fov)=>({eye,at,fov});
      switch(place.kind){
        case 'key':return lens([-4.72,1.97,-.25],[-3.22,.99,-2.12],55);
        case 'post':return lens([4.95,4.50,place.z+1.07],[3.62,3.65,place.z-.62],52);
        case 'drum':return lens([5.45,4.91,-9.72],[-1.35,1.66,-10.2+(s.players[0].z+10.2)*.72],63);
        case 'saddle':return lens([p.x-2.25,p.y+1.54,p.z+1.16],[place.x,place.y+.82,place.z-.42],54);
        case 'lamp':return lens([-5.25,2.48,-21.30],[.65,3.29,-25.70],56);
        case 'window':return lens([4.32,4.34,place.z+.83],[2.38,3.83,place.z-.04],54);
        case 'breaker':return lens([-4.92,2.39,-28.20],[-3.24,1.44,-30.00],55);
        case 'mic':return lens([2.12,4.44,-31.22],[3.58,4.02,-30.54],54);
      }
      return null;
    }
    return {update,shot,hands,leadHands,testerHands,dispose(){shore.dispose();plant.dispose();root.removeFromParent();root.clear();for(const r of owned)r.dispose();}};
  }
  return {create};
})();
