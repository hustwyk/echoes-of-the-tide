// Linear-colour reflections of the actual gantries, vessel and people in each view.
const TideHarborReflection=(()=>{
  const T=THREE,up=new T.Vector3(0,1,0);
  function create(renderer,scene,water,omit){
    const u=water.material.uniforms,eye=new T.PerspectiveCamera(),look=new T.Vector3(),normal=new T.Vector3(),worldUp=new T.Vector3();
    const plane=new T.Plane(),clip=new T.Vector4(),corner=new T.Vector4();
    const viewport=new T.Vector4(),scissor=new T.Vector4(),colour=new T.Color();
    const hidden=[water,...omit];
    scene.traverse(o=>{if(o.isPoints||o.isLineSegments||o.userData.noSeaReflection)hidden.push(o);});
    const pair=[0,1].map(()=>({target:new T.WebGLRenderTarget(1,1,{minFilter:T.LinearFilter,magFilter:T.LinearFilter,depthBuffer:true}),
      matrix:new T.Matrix4(),last:-Infinity,pos:new T.Vector3(),dir:new T.Vector3()}));
    function use(i,cam,w,h,t,quality){
      u.uSceneWeight.value=0;
      if(quality<.85||cam.position.y<water.position.y+.22)return;
      cam.updateMatrixWorld();cam.getWorldDirection(look);
      const s=pair[i],ww=Math.max(64,Math.round(w*.45)),hh=Math.max(64,Math.round(h*.45)),level=water.position.y;
      const size=s.target.width!==ww||s.target.height!==hh;
      if(size||t<s.last||t-s.last>(i?.103:.091)||s.pos.distanceToSquared(cam.position)>.095||s.dir.dot(look)<.9982){
        if(size)s.target.setSize(ww,hh);
        s.pos.copy(cam.position);s.dir.copy(look);s.last=t;
        eye.copy(cam,false);eye.position.y=2*level-cam.position.y;
        normal.copy(look).reflect(up);eye.up.copy(worldUp.set(0,1,0).applyQuaternion(cam.quaternion)).reflect(up);
        eye.lookAt(look.copy(eye.position).add(normal));eye.updateMatrixWorld();
        s.matrix.multiplyMatrices(eye.projectionMatrix,eye.matrixWorldInverse);
        plane.setFromNormalAndCoplanarPoint(up,normal.set(0,level-.22,0)).applyMatrix4(eye.matrixWorldInverse);
        clip.set(plane.normal.x,plane.normal.y,plane.normal.z,plane.constant);
        const e=eye.projectionMatrix.elements;
        corner.set((Math.sign(clip.x)+e[8])/e[0],(Math.sign(clip.y)+e[9])/e[5],-1,(1+e[10])/e[14]);
        clip.multiplyScalar(2/clip.dot(corner));e[2]=clip.x;e[6]=clip.y;e[10]=clip.z+.997;e[14]=clip.w;
        eye.projectionMatrixInverse.copy(eye.projectionMatrix).invert();
        const rt=renderer.getRenderTarget(),bg=scene.background,sc=renderer.getScissorTest(),alpha=renderer.getClearAlpha(),shadow=renderer.shadowMap.needsUpdate;
        const visibility=hidden.map(o=>o.visible);renderer.getViewport(viewport);renderer.getScissor(scissor);renderer.getClearColor(colour);
        try{
          scene.background=null;hidden.forEach(o=>o.visible=false);renderer.shadowMap.needsUpdate=false;
          renderer.setRenderTarget(s.target);renderer.setScissorTest(false);renderer.setClearColor(0,0);renderer.clear(true,true,false);
          renderer.render(scene,eye);
        }finally{
          hidden.forEach((o,n)=>o.visible=visibility[n]);scene.background=bg;renderer.shadowMap.needsUpdate=shadow;
          renderer.setRenderTarget(rt);renderer.setClearColor(colour,alpha);renderer.setViewport(viewport);renderer.setScissor(scissor);renderer.setScissorTest(sc);
        }
      }
      u.uSceneMap.value=s.target.texture;u.uSceneProject.value=s.matrix;u.uSceneLevel.value=level;u.uSceneWeight.value=1;
    }
    return {use,dispose(){for(const s of pair)s.target.dispose();u.uSceneWeight.value=0;u.uSceneMap.value=null;}};
  }
  return {create};
})();
