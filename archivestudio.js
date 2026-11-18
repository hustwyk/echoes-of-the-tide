// Capture the walls and practical lights once for believable reflections on
// the reels and damp floor. Both player cameras see the same room and machines.
const TideArchiveStudio=(()=>{
  const T=THREE;
  function create(scene,g,renderer){
    const room=TideTapeRoom.create(scene),desks=g.world.archive.desks.map((s,i)=>TideTapeDesk.create(scene,s,i));
    const lights=new T.Group();scene.add(lights);scene.background=new T.Color(0x354f58);
    scene.fog=new T.FogExp2(0x475f65,.021);
    const fill=new T.HemisphereLight(0xc2d7d8,0x705345,.91);
    const key=new T.DirectionalLight(0xd6e6e6,1.67);
    key.position.set(3.8,4.4,-1.8);key.target.position.set(-1.3,.8,1.7);key.castShadow=true;
    key.shadow.mapSize.set(2048,2048);
    Object.assign(key.shadow.camera,{left:-6.8,right:6.8,top:6.5,bottom:-6.5,near:.1,far:19});
    key.shadow.camera.updateProjectionMatrix();key.shadow.normalBias=.018;key.shadow.bias=-.00024;
    const bounce=new T.DirectionalLight(0xffdab0,.80);bounce.position.set(-4.5,3.7,5.4);
    lights.add(fill,key,key.target,bounce);
    const cube=new T.BoxGeometry(1,1,1),panel=TideConcrete.material(0xa8977b,-1.3);
    const beam=new T.MeshStandardMaterial({color:0x475754,metalness:.56,roughness:.61});
    const pipe=new T.MeshStandardMaterial({color:0x80705b,metalness:.67,roughness:.43});
    const ivory=new T.MeshStandardMaterial({color:0xb9baa5,metalness:.24,roughness:.47});
    const diffuser=new T.MeshStandardMaterial({color:0xc9d4c8,emissive:0xc4d5ce,emissiveIntensity:1.1,roughness:.44});
    const ceiling=new Map(),transform=new T.Object3D();
    function piece(mat,x,y,z,w,h,d){
      if(!ceiling.has(mat))ceiling.set(mat,[]);
      transform.position.set(x,y,z);transform.scale.set(w,h,d);transform.updateMatrix();
      ceiling.get(mat).push(transform.matrix.clone());
    }
    for(let col=0;col<5;col++)for(let row=0;row<8;row++)
      piece(panel,-5.2+col*2.6,3.82,-4.5+row*2.05,2.596,.16,2.046);
    for(let j=0;j<6;j++){
      const z=-4.78+j*2.71;
      piece(beam,0,3.68,z,13.15,.21,.13);piece(beam,0,3.57,z,13.12,.045,.25);
      for(const x of [-4.9,-4.43])piece(beam,x,3.52,z,.29,.05,.051);
    }
    for(const x of [-4.9,-4.43])piece(pipe,x,3.50,2.57,.095,.09,15.41);
    for(const z of [-1.40,4.01,9.42])for(const x of [-2.05,2.05]){
      piece(beam,x,3.65,z,1.31,.12,.35);piece(ivory,x,3.57,z,1.27,.065,.30);
      for(const dz of [-.068,.068])piece(diffuser,x,3.53,z+dz,1.17,.046,.062);
    }
    // The entrance passage continues behind the players. During a reverse
    // portrait their shoulders are framed by the watertight door and pipe chase.
    for(let j=0;j<5;j++)piece(panel,-5.22+j*2.61,1.89,10.94,2.60,3.8,.25);
    for(const x of [-6.47,6.47])piece(panel,x,1.89,8.64,.20,3.80,4.45);
    piece(beam,.82,1.24,10.76,1.88,2.51,.19);
    piece(ivory,.82,1.22,10.59,1.64,2.37,.12);
    for(const x of [.11,1.53]){
      piece(beam,x,1.20,10.489,.07,2.16,.09);
      for(const y of [.39,1.23,2.09])piece(pipe,x,y,10.43,.21,.06,.09);
    }
    for(const y of [.24,.71,1.69,2.15])piece(beam,.82,y,10.49,1.38,.063,.065);
    piece(beam,.82,1.51,10.45,.47,.32,.12);piece(diffuser,.82,1.51,10.38,.36,.209,.024);
    for(const x of [-3.44,-3.16,-2.95])piece(pipe,x,1.60,10.68,.09,3.23,.09);
    for(const y of [.59,1.91,2.95])piece(beam,-3.22,y,10.61,.78,.062,.10);
    for(const x of [3.68,4.27]){
      piece(beam,x,1.45,10.71,.51,.82,.22);
      for(let j=0;j<6;j++)piece(pipe,x,1.25+.068*j,10.58,.29,.024,.037);
    }
    const ceilingMeshes=[];
    for(const [mat,matrices] of ceiling){
      const mesh=new T.InstancedMesh(cube,mat,matrices.length);
      matrices.forEach((m,i)=>mesh.setMatrixAt(i,m));mesh.receiveShadow=true;mesh.computeBoundingSphere();
      ceilingMeshes.push(mesh);lights.add(mesh);
    }
    const env=new T.WebGLCubeRenderTarget(128,{type:renderer.capabilities.isWebGL2?T.HalfFloatType:T.UnsignedByteType});
    const probe=new T.CubeCamera(.12,45,env);probe.position.set(0,1.61,.20);
    let captureAt=0,captured=false,reflection=null;
    function capture(){
      const scissor=renderer.getScissorTest(),viewport=renderer.getViewport(new T.Vector4()),sc=renderer.getScissor(new T.Vector4());
      renderer.setScissorTest(false);
      const pmrem=new T.PMREMGenerator(renderer);
      try{
        probe.update(renderer,scene);reflection=pmrem.fromCubemap(env.texture);
        scene.environment=reflection.texture;
      }finally{pmrem.dispose();renderer.setViewport(viewport);renderer.setScissor(sc);renderer.setScissorTest(scissor);}
    }
    const grips=[[new T.Vector3(),new T.Vector3()],[new T.Vector3(),new T.Vector3()]];
    function shelfGrips(g,i){
      const s=g.section.sites[i],hands=grips[i],k=g.archive.keys;
      if(k&&!i){
        const x=s.x-.235+k.col*.278,y=1.896-k.row*.230+(k.held?.07:0);
        hands[0].set(s.x-.29,1.40,-4.30);hands[1].set(x+.044,y-.045,k.held?-4.47:-4.56);
      }else{
        hands[0].set(s.x-.14,1.12,-4.26);hands[1].set(s.x+.15,1.11,-4.26);
      }
      return hands;
    }
    function carryGrips(g,i){
      const p=g.players[i],c=Math.cos(p.yaw),s=Math.sin(p.yaw),hands=grips[i];
      for(let j=0;j<2;j++){
        const x=j?.21:-.21,z=-.30;
        hands[j].set(p.x+c*x+s*z,p.y+1.10,p.z-s*x+c*z);
      }
      return hands;
    }
    return {desks,shelfGrips,carryGrips,update(g){
      room.update(g);for(let i=0;i<2;i++)desks[i].update(TideArchive.markView(g,i));
      if(!captured&&++captureAt>=4){captured=true;capture();}
    },dispose(){
      for(const d of desks)d.dispose();room.dispose();key.shadow.dispose();lights.removeFromParent();
      if(scene.environment===reflection?.texture)scene.environment=null;
      reflection?.dispose();env.dispose();
      for(const m of ceilingMeshes)m.dispose();for(const m of [cube,panel,beam,pipe,ivory,diffuser])m.dispose();
    }};
  }
  return {create};
})();
