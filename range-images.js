// The optician splits one rectangular picture at its principal point.
// Each half sees the physical scene from a separate entrance pupil.
(() => {
  'use strict';
  const T = THREE;
  function create(renderer) {
    const format = {minFilter:T.LinearFilter,magFilter:T.LinearFilter,generateMipmaps:false};
    const hdr = renderer.capabilities.isWebGL2 && renderer.extensions.has('EXT_color_buffer_float');
    const raw = new T.WebGLRenderTarget(1,1,{...format,type:hdr?T.HalfFloatType:T.UnsignedByteType,depthBuffer:true,stencilBuffer:false});
    const display = new T.WebGLRenderTarget(1,1,{...format,depthBuffer:false,stencilBuffer:false});
    raw.texture.name='Rangefinder · two entrance pupils';display.texture.name='Rangefinder · phosphor face';
    display.texture.colorSpace=T.LinearSRGBColorSpace;
    const eyes=[new T.PerspectiveCamera(16,4/3,.115,420),new T.PerspectiveCamera(16,4/3,.115,420)];
    const aim=[new T.Vector3(),new T.Vector3()],pos=[new T.Vector3(),new T.Vector3()],direction=[new T.Vector3(),new T.Vector3()];
    const lastPos=[new T.Vector3(),new T.Vector3()],lastDirection=[new T.Vector3(),new T.Vector3()];
    const plate=new T.Scene(),flat=new T.Camera(),film=new T.BufferGeometry();
    film.setAttribute('position',new T.Float32BufferAttribute([-1,-1,0,3,-1,0,-1,3,0],3));
    const glass=new T.ShaderMaterial({
      depthTest:false,depthWrite:false,toneMapped:false,
      uniforms:{source:{value:raw.texture},size:{value:new T.Vector2()},gain:{value:1}},
      vertexShader:'varying vec2 st;void main(){st=position.xy*.5+.5;gl_Position=vec4(position.xy,0.,1.);}',
      fragmentShader:`uniform sampler2D source;uniform vec2 size;uniform float gain;varying vec2 st;
        void main(){
          vec3 c=max(texture2D(source,st).rgb,vec3(0.));
          float y=dot(c,vec3(.2126,.7152,.0722)),x=y*gain;
          float signal=clamp(x*(2.51*x+.03)/(x*(2.43*x+.59)+.14),0.,1.);
          vec3 phosphor=mix(vec3(signal),c*(signal/max(y,.0001)),.30)*vec3(.951,1.,.969);
          vec2 edge=st*2.-1.;float corner=dot(edge,edge);
          // A light phosphor raster, subtle enough to retain a single thin mullion.
          phosphor*=1.-.028*corner*corner-.009*(.5+.5*cos(gl_FragCoord.y*3.14159-1.5708));
          phosphor+=vec3(.0025,.0039,.0031);
          float dy=(st.y-.5)*size.y;
          float hair=1.-smoothstep(.13,.91,abs(dy-.46));
          phosphor*=1.-.28*hair;
          // Two short etched fiducials at each end of the cemented prism boundary.
          float side=min(st.x,1.-st.x)*size.x;
          vec2 marks=abs(vec2(side-size.x*.046,side-size.x*.085));
          float ticks=max((1.-smoothstep(.25,1.,marks.x))*(1.-smoothstep(3.,4.,abs(dy))),
                          (1.-smoothstep(.25,1.,marks.y))*(1.-smoothstep(1.,2.,abs(dy))));
          phosphor=mix(phosphor,vec3(.36,.42,.38),ticks*.58);
          gl_FragColor=vec4(phosphor,1.);
        }`
    });
    const pass=new T.Mesh(film,glass);pass.frustumCulled=false;plate.add(pass);
    const originalViewport=new T.Vector4(),originalScissor=new T.Vector4(),activeViewport=new T.Vector4();
    const boundViewport=new T.Vector4(),boundScissor=new T.Vector4();
    const callerColour=new T.Color(),hidden=[],oceans=[],surfaceSlots=[];
    let lastTime=-Infinity,lastFov=NaN,lastScene=null,alive=true,busy=false,valid=false;
    function vec(out,input) {
      if(!input)return false;
      if(input.x!==undefined)out.set(input.x,input.y,input.z);
      else out.fromArray(input);
      return Number.isFinite(out.x)&&Number.isFinite(out.y)&&Number.isFinite(out.z);
    }
    function readsFace(mat) {
      if(!mat)return false;
      const tx=display.texture;
      if(mat.map===tx||mat.emissiveMap===tx)return true;
      if(mat.isShaderMaterial)for(const key in mat.uniforms)if(mat.uniforms[key]?.value===tx)return true;
      return false;
    }
    function findObjects(o) {
      if(!o.visible)return;
      const m=o.material;
      if(o.userData.rangeOpticsOmit||(Array.isArray(m)?m.some(readsFace):readsFace(m))){
        hidden.push(o);o.visible=false;return;
      }
      if(m?.uniforms?.uSceneWeight && m.uniforms.uSceneProject && o.geometry){
        // Main-view water is cropped and its reflection was projected from that viewer.
        // The scope sees the full ocean mesh, using its sky reflection from each pupil.
        const i=oceans.length,slot=surfaceSlots[i]||(surfaceSlots[i]={});
        slot.weight=m.uniforms.uSceneWeight.value;slot.start=o.geometry.drawRange.start;slot.count=o.geometry.drawRange.count;
        oceans.push(o);m.uniforms.uSceneWeight.value=0;o.geometry.setDrawRange(0,Infinity);
      }
      for(let i=0;i<o.children.length;i++)findObjects(o.children[i]);
    }
    // The coast's regularly indexed rows are closer together near the quay.
    // The frustum clipped to the wave-height slab is convex. Its z extrema occur
    // at frustum corners in the slab, or where one of the twelve edges cuts a slab plane.
    const grids=new WeakMap(),corners=Array.from({length:8},()=>new T.Vector3());
    const edges=[0,1,2,3,4,5,6,7,0,2,1,3,4,6,5,7,0,4,1,5,2,6,3,7];
    function waterGrid(g) {
      if(grids.has(g))return grids.get(g);
      const p=g.attributes.position,cols=g.parameters?.widthSegments,rows=g.parameters?.heightSegments;
      let grid=null;
      if(cols&&rows&&p.count===(cols+1)*(rows+1)&&g.index?.count===6*cols*rows&&g.index.getX(0)===0&&g.index.getX(1)===cols+1&&g.index.getX(2)===1){
        const z=new Float64Array(rows+1);let valid=true;
        for(let j=0;j<=rows;j++){
          z[j]=p.getZ(j*(cols+1));
          if(z[j]!==p.getZ(j*(cols+1)+cols)||(j&&z[j]<=z[j-1]))valid=false;
        }
        if(valid){if(!g.boundingBox)g.computeBoundingBox();grid={z,rows,rowSize:cols*6};}
      }
      grids.set(g,grid);return grid;
    }
    function cropWater(camera) {
      for(const o of oceans){
        if(o.name!=='潮汐海面'||!o.material.uniforms.uSurvey)continue;
        const g=o.geometry,grid=waterGrid(g),e=o.matrixWorld.elements;
        // The ocean uses world-X horizontal chop; an upright, axis-aligned
        // water mesh gives it no z component. Other water meshes keep their full range.
        if(!grid||e[1]||e[9]||e[2]||e[6]||e[5]<=0||e[10]<=0)continue;
        const low=e[13]+e[5]*g.boundingBox.min.y-1.075,high=e[13]+e[5]*g.boundingBox.max.y+1.075;
        let minZ=Infinity,maxZ=-Infinity;
        for(let i=0;i<8;i++){
          const v=corners[i].set(i&1?1:-1,i&2?1:-1,i&4?1:-1).unproject(camera);
          if(v.y>=low&&v.y<=high){minZ=Math.min(minZ,v.z);maxZ=Math.max(maxZ,v.z);}
        }
        for(let i=0;i<edges.length;i+=2){
          const a=corners[edges[i]],b=corners[edges[i+1]],dy=b.y-a.y;
          if(Math.abs(dy)<1e-12)continue;
          let f=(low-a.y)/dy;
          if(f>=0&&f<=1){const z=a.z+f*(b.z-a.z);minZ=Math.min(minZ,z);maxZ=Math.max(maxZ,z);}
          f=(high-a.y)/dy;
          if(f>=0&&f<=1){const z=a.z+f*(b.z-a.z);minZ=Math.min(minZ,z);maxZ=Math.max(maxZ,z);}
        }
        if(maxZ<minZ){g.setDrawRange(0,0);continue;}
        const lo=(minZ-e[14])/e[10]-.002,hi=(maxZ-e[14])/e[10]+.002;
        const {rows,rowSize,z}=grid;
        let l=0,h=rows;while(l<h){const j=(l+h)>>1;if(z[j+1]<lo)l=j+1;else h=j;}
        const first=l;h=rows;while(l<h){const j=(l+h)>>1;if(z[j]<=hi)l=j+1;else h=j;}
        g.setDrawRange(first*rowSize,(l-first)*rowSize);
      }
    }
    function update(scene,shots,time,quality=1) {
      if(!alive||busy)return false;
      if(!scene||!shots?.upper||!shots.lower){valid=false;lastScene=null;return false;}
      if(!Number.isFinite(time))return false;
      const a=shots.upper,b=shots.lower;
      if(!vec(pos[0],a.eye)||!vec(pos[1],b.eye)||!vec(aim[0],a.at)||!vec(aim[1],b.at))return false;
      for(let i=0;i<2;i++){direction[i].copy(aim[i]).sub(pos[i]);if(direction[i].lengthSq()<1e-12)return false;direction[i].normalize();}
      const fov=T.MathUtils.clamp(Number.isFinite(a.fov)?a.fov:Number.isFinite(b.fov)?b.fov:16,2,105);
      const w=quality>=.93?640:quality>=.72?512:384,h=w*3/4;
      const age=time-lastTime;
      let moved=false;
      for(let i=0;i<2;i++)if(direction[i].dot(lastDirection[i])<.999999994 || pos[i].distanceToSquared(lastPos[i])>.00030){moved=true;break;}
      if(valid&&scene===lastScene&&display.width===w&&lastFov===fov&&age>=0){
        // Duplicate calls for the partner window consume no additional scene draws.
        if(age<.000001 || age+.000001<(moved?1/60:1/(quality>=.82?30:24)))return false;
      }
      busy=true;
      const oldTarget=renderer.getRenderTarget(),cube=renderer.getActiveCubeFace(),level=renderer.getActiveMipmapLevel();
      renderer.getViewport(originalViewport);renderer.getScissor(originalScissor);renderer.getCurrentViewport(activeViewport);
      const test=renderer.getScissorTest(),alpha=renderer.getClearAlpha();renderer.getClearColor(callerColour);
      const xr=renderer.xr.enabled,shadows=renderer.shadowMap;
      const autoShadow=shadows.autoUpdate,shadowDirty=shadows.needsUpdate;
      const auto=renderer.autoClear,autoColor=renderer.autoClearColor,autoDepth=renderer.autoClearDepth,autoStencil=renderer.autoClearStencil;
      const autoWorld=scene.matrixWorldAutoUpdate;
      // Three r158 stores the default and current target scissors separately. Only nested
      // calls need driver queries to distinguish an explicit setScissor from target.scissor.
      const gl=oldTarget?renderer.getContext():null;
      const activeScissor=gl?gl.getParameter(gl.SCISSOR_BOX):null,activeTest=gl?gl.isEnabled(gl.SCISSOR_TEST):false;
      try{
        if(display.width!==w){raw.setSize(w,h);display.setSize(w,h);glass.uniforms.size.value.set(w,h);}
        renderer.xr.enabled=false;shadows.autoUpdate=false;shadows.needsUpdate=false;
        renderer.autoClear=true;renderer.autoClearColor=true;renderer.autoClearDepth=true;renderer.autoClearStencil=false;
        if(autoWorld)scene.updateMatrixWorld();scene.matrixWorldAutoUpdate=false;
        findObjects(scene);
        const shared=pos[0].equals(pos[1])&&direction[0].equals(direction[1]);
        const count=shared?1:2;
        for(let i=0;i<count;i++){
          const camera=eyes[i];
          camera.position.copy(pos[i]);camera.lookAt(aim[i]);camera.fov=fov;
          // setViewOffset uses top-left film coordinates; viewport/scissor use bottom-left pixels.
          if(shared){camera.aspect=w/h;camera.clearViewOffset();}else camera.setViewOffset(w,h,0,i*h/2,w,h/2);
          camera.updateMatrixWorld();cropWater(camera);
          raw.viewport.set(0,shared||i?0:h/2,w,shared?h:h/2);raw.scissor.copy(raw.viewport);raw.scissorTest=true;
          renderer.setRenderTarget(raw);renderer.render(scene,camera);
        }
        glass.uniforms.gain.value=renderer.toneMappingExposure;
        renderer.setRenderTarget(display);renderer.render(plate,flat);
        for(let i=0;i<2;i++){lastPos[i].copy(pos[i]);lastDirection[i].copy(direction[i]);}
        lastFov=fov;lastTime=time;lastScene=scene;valid=true;
        return true;
      }finally{
        for(const o of hidden)o.visible=true;
        for(let i=oceans.length-1;i>=0;i--){
          const o=oceans[i],s=surfaceSlots[i];o.geometry.setDrawRange(s.start,s.count);o.material.uniforms.uSceneWeight.value=s.weight;
        }
        hidden.length=0;oceans.length=0;scene.matrixWorldAutoUpdate=autoWorld;
        renderer.xr.enabled=xr;shadows.autoUpdate=autoShadow;shadows.needsUpdate=shadowDirty;
        renderer.autoClear=auto;renderer.autoClearColor=autoColor;renderer.autoClearDepth=autoDepth;renderer.autoClearStencil=autoStencil;
        renderer.setClearColor(callerColour,alpha);renderer.setViewport(originalViewport);renderer.setScissor(originalScissor);renderer.setScissorTest(test);
        if(oldTarget){
          boundViewport.copy(oldTarget.viewport);boundScissor.copy(oldTarget.scissor);const boundTest=oldTarget.scissorTest;
          oldTarget.viewport.copy(activeViewport);oldTarget.scissor.fromArray(activeScissor);oldTarget.scissorTest=activeTest;
          try{renderer.setRenderTarget(oldTarget,cube,level);}
          finally{oldTarget.viewport.copy(boundViewport);oldTarget.scissor.copy(boundScissor);oldTarget.scissorTest=boundTest;}
        }else renderer.setRenderTarget(null);
        busy=false;
      }
    }
    return {texture:display.texture,update,dispose(){
      if(!alive)return;alive=false;valid=false;lastScene=null;
      raw.dispose();display.dispose();glass.dispose();film.dispose();plate.clear();surfaceSlots.length=0;
    }};
  }
  window.TideRangeImages={create};
})();
