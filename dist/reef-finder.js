// Remote optical head and the operator's azimuth repeater. The objective faces
// stop just behind the simulated entrance pupils, so their hoods cannot mask the images.
const TideReefFinder=(()=>{
  function create(scene,g){
    const T=THREE,owned=new Set(),own=o=>(owned.add(o),o),root=new T.Group(),reef=new T.Group(),head=new T.Group(),leftStand=new T.Group();
    root.name='外礁双路镜与岸上方位器';scene.add(root);root.add(reef,leftStand);reef.add(head);
    const {eye,baseline}=TideRangeWatch,site=g.world.sections[0].sites[0],Y=new T.Vector3(0,1,0);
    reef.position.fromArray(eye);leftStand.position.set(site.x,site.y,site.z-.94);head.userData.rangeOpticsOmit=true;
    const metal=(color,roughness=.56,metalness=.48)=>own(new T.MeshStandardMaterial({color,roughness,metalness}));
    const enamel=metal(0x51645f),dark=metal(0x293534,.65,.35),iron=metal(0x76776a),brass=metal(0xb59d68,.43,.67),glass=metal(0x395750,.19,.55);
    const cube=own(new T.BoxGeometry()),round=own(new T.CylinderGeometry(1,1,1,24)),hex=own(new T.CylinderGeometry(1,1,1,6));
    function mesh(parent,geo,mat,x,y,z,sx,sy,sz){
      const m=new T.Mesh(geo,mat);m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.castShadow=m.receiveShadow=true;parent.add(m);return m;
    }
    const block=(p,m,x,y,z,w,h,d)=>mesh(p,cube,m,x,y,z,w,h,d);
    function rod(p,m,a,b,r,geo=round){
      const v=new T.Vector3().fromArray(a),w=new T.Vector3().fromArray(b),dir=w.clone().sub(v);
      const obj=mesh(p,geo,m,(v.x+w.x)/2,(v.y+w.y)/2,(v.z+w.z)/2,r,dir.length(),r);
      obj.quaternion.setFromUnitVectors(Y,dir.normalize());return obj;
    }
    const mount=(p,x,y,z,r,h,mat,shape)=>rod(p,mat,[x,y,z],[x,y+h,z],r,shape);
    // Braced tidal instrument platform; the optical bar turns about its left bearing.
    for(const x of [-1.25,1.25])for(const z of [-1.15,1.15]){
      mount(reef,x,-14,z,.105,12.63,dark);
      rod(reef,iron,[x,-3.8,z],[-x,-1.44,z],.056);
      rod(reef,iron,[x,-3.6,z],[x,-1.44,-z],.047);
    }
    block(reef,enamel,0,-1.44,0,2.80,.14,2.56);
    mount(reef,0,-1.38,0,.23,1.04,iron);mount(reef,0,-.37,0,.34,.13,dark);
    block(head,enamel,baseline/2,-.16,.34,baseline+.44,.22,.33);
    for(const x of [0,baseline]){
      block(head,iron,x,-.095,.28,.37,.31,.46);
      rod(head,dark,[x,0,.48],[x,0,.08],.165);
      rod(head,brass,[x,0,.12],[x,0,.067],.158);
      rod(head,glass,[x,0,.072],[x,0,.064],.12);
    }
    // The repeater is bolted to the left station floor. Both hands turn the yoke.
    block(leftStand,enamel,0,.055,0,.72,.11,.55);
    for(const x of [-.28,.28])for(const z of [-.19,.19])mount(leftStand,x,.115,z,.026,.027,brass,hex);
    mount(leftStand,0,.10,0,.19,.89,enamel);mount(leftStand,0,.92,0,.27,.08,iron);
    const az=new T.Group();az.position.y=1.03;leftStand.add(az);
    block(az,enamel,0,.24,0,.53,.43,.52);
    for(const x of [-.204,.204])rod(az,dark,[x,.36,-.16],[x,.36,.27],.083);
    for(const x of [-.126,.126]){
      rod(az,dark,[x,.36,.23],[x,.37,.37],.080);
      rod(az,glass,[x,.37,.374],[x,.37,.381],.063);
    }
    for(const x of [-.31,.31]){
      rod(az,iron,[x*.64,.18,.07],[x,.16,.28],.032);rod(az,dark,[x,.16,.27],[x,.16,.49],.045);
    }
    const left=new T.Vector3(-.31,.16,.39),right=new T.Vector3(.31,.16,.39),hands=[new T.Vector3(),new T.Vector3()];
    // Smooth rotation needs only a few batches, even for the bolt circles and braces.
    for(const parent of [reef,head,leftStand,az]){
      const bins=new Map();
      for(const piece of parent.children.slice()){
        if(!piece.isMesh)continue;
        const key=piece.geometry.uuid+piece.material.uuid;
        if(!bins.has(key))bins.set(key,[]);bins.get(key).push(piece);
      }
      for(const pieces of bins.values()){
        if(pieces.length<2)continue;
        const first=pieces[0],group=own(new T.InstancedMesh(first.geometry,first.material,pieces.length));
        pieces.forEach((m,i)=>{m.updateMatrix();group.setMatrixAt(i,m.matrix);parent.remove(m);});
        group.castShadow=group.receiveShadow=true;parent.add(group);
      }
    }
    function update(session){
      const r=session.rangeWatch;root.visible=!!r;if(!r)return;
      const a=TideLookout.camera(session).yaw;head.rotation.y=-a;az.rotation.y=-a*.55;
    }
    function grips(session){
      if(!session.rangeWatch||!session.engaged[0])return null;
      az.localToWorld(hands[0].copy(left));az.localToWorld(hands[1].copy(right));return hands;
    }
    return {update,grips,dispose(){root.removeFromParent();for(const o of owned)o.dispose();}};
  }
  return {create};
})();
