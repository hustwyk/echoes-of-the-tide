// The ocean is a fixed triangle grid. Narrow the submitted index interval without touching a visible cell.
const TideHarborReflection=(()=>{
  const T=THREE,up=new T.Vector3(0,1,0);
  function oceanRows(water){
    const g=water.geometry,par=g.parameters||{},cols=par.widthSegments,rows=par.heightSegments;
    const p=g.getAttribute('position'),ix=g.index,range={start:g.drawRange.start,count:g.drawRange.count};
    if(!cols||!rows||p.count!==(cols+1)*(rows+1)||ix?.count!==6*cols*rows||ix.getX(0)!==0||ix.getX(1)!==cols+1||ix.getX(2)!==1||range.start!==0||range.count<ix.count)return null;
    const z=new Float64Array(rows+1);for(let i=0;i<=rows;i++){z[i]=p.getZ(i*(cols+1));if(i&&z[i]<=z[i-1])return null;}
    const xmin=p.getX(0),xmax=p.getX(cols);if(xmax<=xmin)return null;
    if(!g.boundingBox)g.computeBoundingBox();const lowY=g.boundingBox.min.y,highY=g.boundingBox.max.y;
    const f=new T.Frustum(),pv=new T.Matrix4(),rowWidth=cols*6;
    function cut(cam,survey){
      water.updateWorldMatrix(true,false);const e=water.matrixWorld.elements;
      f.setFromProjectionMatrix(pv.multiplyMatrices(cam.projectionMatrix,cam.matrixWorldInverse),cam.coordinateSystem);
      // The shader adds displacement in WORLD space, even if this mesh has a transformed parent.
      // Regular tidal swell max .46+.34+.18+.09=1.07m; the survey max is .81+.075+.085+.037=1.007m.
      const waveY=survey?1.008:1.071,waveX=survey?.001:.181;
      let lo=z[0],hi=z[rows];
      for(const h of f.planes){
        const n=h.normal,x=n.x*e[0]+n.y*e[1]+n.z*e[2],y=n.x*e[4]+n.y*e[5]+n.z*e[6],depth=n.x*e[8]+n.y*e[9]+n.z*e[10];
        const best=h.constant+n.x*e[12]+n.y*e[13]+n.z*e[14]+Math.max(x*xmin,x*xmax)+Math.max(y*lowY,y*highY)+Math.abs(n.x)*waveX+Math.abs(n.y)*waveY+.0003;
        if(depth>1e-12)lo=Math.max(lo,-best/depth);
        else if(depth< -1e-12)hi=Math.min(hi,-best/depth);
        else if(best<0){g.setDrawRange(0,0);return false;}
        if(lo>hi){g.setDrawRange(0,0);return false;}
      }
      // Closed intervals include both touching rows and keep original winding and shared vertices.
      let a=0,b=rows;while(a<b){const m=(a+b)>>1;if(z[m+1]<lo)a=m+1;else b=m;}const first=a;
      a=first;b=rows;while(a<b){const m=(a+b)>>1;if(z[m]<=hi)a=m+1;else b=m;}
      g.setDrawRange(first*rowWidth,(a-first)*rowWidth);return a>first;
    }
    return {cut,dispose(){g.setDrawRange(range.start,range.count);}};
  }
  function create(renderer,scene,water,omit=[]){
    const u=water.material.uniforms,eye=new T.PerspectiveCamera();
    const pos=new T.Vector3(),dir=new T.Vector3(),top=new T.Vector3(),target=new T.Vector3();
    const plane=new T.Plane(),clip=new T.Vector4(),corner=new T.Vector4();
    const viewport=new T.Vector4(),scissor=new T.Vector4(),colour=new T.Color();
    const skip=new Set([water,...omit]);scene.traverse(o=>{if(o.isPoints||o.isLineSegments||o.userData.noSeaReflection)skip.add(o);});
    const hidden=Array.from(skip),visibility=new Uint8Array(hidden.length),grid=oceanRows(water);
    // The shared sun may be updated by the first mirror draw if that pass hides no shadow-casting geometry.
    let omittedCaster=false;for(const o of hidden)o.traverse(n=>{if(n.castShadow)omittedCaster=true;});
    const pair=[0,1].map(()=>({target:null,matrix:new T.Matrix4(),projection:new T.Matrix4(),last:-Infinity,level:0,
      pos:new T.Vector3(),dir:new T.Vector3(),top:new T.Vector3(),valid:false,layers:0}));
    function use(i,cam,w,h,t,quality){
      const s=pair[i];u.uSceneWeight.value=0;cam.updateWorldMatrix(true,false);
      const seaInSight=grid?grid.cut(cam,u.uSurvey?.value>.5):true;
      pos.setFromMatrixPosition(cam.matrixWorld);
      water.getWorldPosition(target);const level=target.y;
      if(!seaInSight||quality<.85||!water.visible||!water.layers.test(cam.layers)||pos.y<level+.22){s.valid=false;return;}
      const ww=Math.max(64,Math.round(w*.45)),hh=Math.max(64,Math.round(h*.45));
      const size=!s.target||s.target.width!==ww||s.target.height!==hh;
      dir.setFromMatrixColumn(cam.matrixWorld,2).normalize().negate();top.setFromMatrixColumn(cam.matrixWorld,1).normalize();
      if(!s.valid||size||t<s.last||t-s.last>(i?.103:.091)||s.pos.distanceToSquared(pos)>.095||s.dir.dot(dir)<.9982||s.top.dot(top)<.9982||
        s.layers!==cam.layers.mask||!s.projection.equals(cam.projectionMatrix)||Math.abs(s.level-level)>.055){
        if(!s.target)s.target=new T.WebGLRenderTarget(ww,hh,{minFilter:T.LinearFilter,magFilter:T.LinearFilter,depthBuffer:true});
        else if(size)s.target.setSize(ww,hh);
        // Copy only rendering intrinsics. Object3D.copy also clones animations and serializes userData.
        eye.near=cam.near;eye.far=cam.far;eye.fov=cam.fov;eye.aspect=cam.aspect;eye.zoom=cam.zoom;
        eye.layers.mask=cam.layers.mask;eye.coordinateSystem=cam.coordinateSystem;
        eye.projectionMatrix.copy(cam.projectionMatrix);eye.position.copy(pos);eye.position.y=2*level-pos.y;
        eye.up.copy(top).reflect(up);eye.lookAt(target.copy(dir).reflect(up).add(eye.position));eye.updateMatrixWorld();
        s.matrix.multiplyMatrices(eye.projectionMatrix,eye.matrixWorldInverse);
        plane.setFromNormalAndCoplanarPoint(up,target.set(0,level-.22,0)).applyMatrix4(eye.matrixWorldInverse);
        clip.set(plane.normal.x,plane.normal.y,plane.normal.z,plane.constant);
        const e=eye.projectionMatrix.elements;
        corner.set((Math.sign(clip.x)+e[8])/e[0],(Math.sign(clip.y)+e[9])/e[5],-1,(1+e[10])/e[14]);
        clip.multiplyScalar(2/clip.dot(corner));e[2]=clip.x;e[6]=clip.y;e[10]=clip.z+.997;e[14]=clip.w;
        eye.projectionMatrixInverse.copy(eye.projectionMatrix).invert();
        const rt=renderer.getRenderTarget(),bg=scene.background,sc=renderer.getScissorTest(),alpha=renderer.getClearAlpha();
        const shadow=renderer.shadowMap.needsUpdate,autoShadow=renderer.shadowMap.autoUpdate;
        const auto=renderer.autoClear,c=renderer.autoClearColor,d=renderer.autoClearDepth,st=renderer.autoClearStencil;
        renderer.getViewport(viewport);renderer.getScissor(scissor);renderer.getClearColor(colour);
        let complete=false;
        try{
          for(let j=0;j<hidden.length;j++){visibility[j]=hidden[j].visible;hidden[j].visible=false;}
          scene.background=null;renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=shadow&&!omittedCaster;
          renderer.setRenderTarget(s.target);renderer.setScissorTest(false);renderer.setClearColor(0,0);
          renderer.autoClear=true;renderer.autoClearColor=true;renderer.autoClearDepth=true;renderer.autoClearStencil=false;
          renderer.render(scene,eye);complete=true;
        }finally{
          for(let j=0;j<hidden.length;j++)hidden[j].visible=!!visibility[j];scene.background=bg;
          if(!complete||omittedCaster)renderer.shadowMap.needsUpdate=shadow;renderer.shadowMap.autoUpdate=autoShadow;
          renderer.autoClear=auto;renderer.autoClearColor=c;renderer.autoClearDepth=d;renderer.autoClearStencil=st;
          renderer.setRenderTarget(rt);renderer.setClearColor(colour,alpha);renderer.setViewport(viewport);renderer.setScissor(scissor);renderer.setScissorTest(sc);
        }
        s.pos.copy(pos);s.dir.copy(dir);s.top.copy(top);s.last=t;s.valid=true;s.level=level;s.layers=cam.layers.mask;s.projection.copy(cam.projectionMatrix);
      }
      u.uSceneMap.value=s.target.texture;u.uSceneProject.value=s.matrix;u.uSceneLevel.value=level;u.uSceneWeight.value=1;
    }
    return {use,dispose(){grid?.dispose();for(const s of pair)s.target?.dispose();u.uSceneWeight.value=0;u.uSceneMap.value=null;}};
  }
  return {create};
})();
