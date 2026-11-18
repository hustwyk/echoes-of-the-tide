// Survey well: the two pressure circuits meet only through the bypass pipe.
// The geometric seats, valve stems and the figures engraved beside them follow
// the same physical elevations and stop settings as the stair and float.
const TideCisternRoom=(()=>{
  const T=THREE,V=(x,y,z)=>new T.Vector3(x,y,z),o=TideCistern.origin;
  function create(scene,g){
    scene.background=new T.Color(0x3f555b);scene.fog=new T.FogExp2(0x839692,.028);
    const root=new T.Group(),owned=new Set(),own=v=>(owned.add(v),v);scene.add(root);root.position.set(o.x,o.y,o.z);
    const env=TideCisternEnv.create(root),gear=TideCisternGear.create(root);
    const fill=new T.HemisphereLight(0xc9e0dc,0x786453,1.32),sun=new T.DirectionalLight(0xffe4b4,2.16),rim=new T.DirectionalLight(0xc0e6ff,1.04);
    sun.position.set(4.8,5.56,2.06);sun.target.position.set(-1.90,.2,-1.8);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);
    Object.assign(sun.shadow.camera,{left:-9.4,right:9.4,top:8.1,bottom:-8.4,near:.15,far:25});sun.shadow.camera.updateProjectionMatrix();sun.shadow.normalBias=.014;sun.shadow.bias=-.00014;
    rim.position.set(-3.5,3.95,-5.36);rim.target.position.set(.65,.80,-1.8);root.add(fill,sun,sun.target,rim,rim.target);
    const box=own(new T.BoxGeometry(1,1,1)),cyl=own(new T.CylinderGeometry(1,1,1,14)),hex=own(new T.CylinderGeometry(1,1,1,6));
    const groups=new Map(),matrix=new T.Object3D(),up=V(0,1,0);
    const solid=(color,metal,rough)=>own(new T.MeshStandardMaterial({color,metalness:metal,roughness:rough}));
    const rock=own(TideConcrete.material(0xc6ba9d,.5)),pool=own(TideConcrete.material(0xaeb8a5,.12)),iron=TideSteel.material(0,own,true);
    const brass=solid(0xc29b57,.53,.31),dark=solid(0x36423f,.62,.48),red=solid(0x97543f,.29,.54),ivory=solid(0xd7c99b,.20,.61);
    function batch(geo,mat,x,y,z,sx,sy,sz,quaternion){
      matrix.position.set(x,y,z);matrix.scale.set(sx,sy,sz);
      if(quaternion)matrix.quaternion.copy(quaternion);else matrix.rotation.set(0,0,0);
      matrix.updateMatrix();let bucket=groups.get(mat);if(!bucket){bucket=new Map();groups.set(mat,bucket);}
      let parts=bucket.get(geo);if(!parts){parts=[];bucket.set(geo,parts);}parts.push(matrix.matrix.clone());
    }
    const slab=(m,x,y,z,w,h,d)=>batch(box,m,x,y,z,w,h,d);
    const pin=(x,y,z,r,h,mat=brass)=>batch(hex,mat,x,y,z,r,h,r);
    function tube(m,a,b,r){const p=V(...a),q=V(...b),v=q.clone().sub(p),c=p.lerp(q,.5);batch(cyl,m,c.x,c.y,c.z,r,v.length(),r,new T.Quaternion().setFromUnitVectors(up,v.normalize()));}
    function tag(text,x,y,z,width,height,base='#303c37',ink='#d4c69a'){
      const canvas=document.createElement('canvas');canvas.width=384;canvas.height=128;
      const ctx=canvas.getContext('2d');ctx.fillStyle=base;ctx.fillRect(0,0,384,128);ctx.strokeStyle=ink;ctx.lineWidth=3;ctx.strokeRect(9,9,366,110);
      ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=ink;ctx.font='bold 54px sans-serif';ctx.fillText(text,192,66,330);
      for(const u of [19,365])for(const v of [20,108]){ctx.fillStyle='#8b896d';ctx.beginPath();ctx.arc(u,v,4,0,6.29);ctx.fill();}
      const tex=own(new T.CanvasTexture(canvas));tex.colorSpace=T.SRGBColorSpace;tex.anisotropy=8;
      const m=own(new T.MeshStandardMaterial({map:tex,metalness:.19,roughness:.68,side:T.DoubleSide})),b=new T.Mesh(own(new T.PlaneGeometry(width,height)),m);root.add(b);b.position.set(x,y,z);return b;
    }
    // A partition protects the valve-room footing even at the highest channel level.
    const w=g.world.cistern;
    for(const f of g.world.floors){
      if(f===w.raft)continue;
      const x=f.x-o.x,y=f.y-o.y,z=f.z-o.z,high=f===w.gallery||['lip','windowWalk'].includes(f.id);
      const h=high?.23:f===w.east||f===w.west?.44:.28;
      slab(high?iron:rock,x,y-h/2,z,f.w,h,f.d);
      if(high){
        for(let u=-f.w*.5+.06;u<f.w*.5;u+=.20)slab(dark,x+u,y+.008,z,.031,.018,f.d-.07);
        for(const a of [-1,1])slab(brass,x,y-.045,z+a*(f.d*.5-.047),f.w,.052,.032);
      }else{
        for(let u=-f.w*.5+.09;u<f.w*.5;u+=.46)slab(iron,x+u,y+.006,z-f.d*.5+.12,.20,.010,.055);
        for(const a of [-1,1])for(const b of [-1,1])pin(x+a*(f.w*.5-.15),y+.017,z+b*(f.d*.5-.14),.032,.024);
      }
      if(f!==w.bottom)for(const a of [-1,1])for(const b of [-1,1]){
        const h=y+1.14;slab(high?iron:pool,x+a*(f.w*.5-.20),-1.16+h*.5,z+b*(f.d*.5-.20),high?.10:.25,h,high?.11:.26);
      }
    }
    // The intake wall is cut away at the embarkation and disembarkation ledges.
    for(const [x,z,h,d] of [[.69,.20,2.86,10.90],[3.58,-1.27,2.83,6.08],[3.62,5.19,1.18,2.31]]){
      slab(pool,x,-1.14+h*.5,z,.16,h,d);
      slab(iron,x,-1.14+h,z,.20,.052,d);
    }
    // A cast gutter behind the steps gives the observer visible evidence of drainage.
    const cocks=[];
    for(const [i,c] of w.cocks.entries()){
      const x=c.x-o.x,y=c.y-o.y,z=c.z-o.z,px=x-.42,pz=z-.42;
      tube(iron,[px,y-.52,pz],[px,y+.84,pz],.081);tube(brass,[px,y+.81,pz],[px+.22,y+.81,pz+.04],.071);
      tube(iron,[px,y+.76,pz],[px,y+.39,pz+.32],.058);
      const knob=new T.Group();root.add(knob);knob.position.set(px+.20,y+.86,pz+.10);
      const wheel=new T.Mesh(own(new T.TorusGeometry(.142,.023,7,24)),red);knob.add(wheel);
      for(let n=0;n<3;n++){const spoke=new T.Mesh(box,brass);spoke.scale.set(.241,.018,.018);spoke.rotation.z=n*Math.PI/3;knob.add(spoke);}
      tag(i?'Ⅱ　63':'Ⅰ　31',px-.23,y+1.16,pz,.40,.16);
      cocks.push(knob);
    }
    // Hanger rods terminate on the underside of a transverse structural channel.
    slab(iron,2.16,5.60,-.65,7.84,.17,.23);
    for(const x of [.61,3.71])for(const z of [-.762,-.538]){
      tube(dark,[x,3.78,z],[x,5.61,z],.025);
      pin(x,5.48,z,.063,.042);
    }
    // Surveyor's staff: decimetre ticks disappear behind the actual water surface.
    for(const [x,z,ymax] of [[.82,.86,3.06],[2.37,-4.93,3.32],[-3.12,-3.51,1.84]]){
      slab(ivory,x,(ymax-.88)*.5,z,.134,ymax+.88,.045);
      for(let i=-8;i<=Math.floor(ymax*10);i++)slab(i%5?dark:red,x-(i%5?.031:0),i*.10,z+.024,i%5?.069:.13,i%5?.014:.029,.008);
    }
    
    const feelers=[];
    for(const [x,z,y,pivotX] of [[1.97,-.14,1.64,3.56],[2.32,-5.18,3.41,3.35]]){
      const lever=new T.Group();root.add(lever);lever.position.set(pivotX,y,z);feelers.push(lever);
      const dx=x-pivotX;
      const arm=new T.Mesh(box,dark);arm.position.set(dx/2,-.105,-.04);arm.scale.set(-dx+.06,.042,.071);lever.add(arm);
      for(const sign of [-1,1]){
        const cheek=new T.Mesh(box,brass);cheek.scale.set(.032,.19,.074);cheek.position.set(dx+sign*.091,0,0);cheek.rotation.z=sign*.23;lever.add(cheek);
      }
      const socket=new T.Mesh(cyl,brass);socket.position.set(0,-.09,0);socket.scale.set(.071,.16,.071);lever.add(socket);
      tube(dark,[pivotX,-.98,z],[pivotX,y-.10,z],.046);
      pin(pivotX,y+.017,z,.054,.032);
    }
    for(const [a,b] of [
      [[-5.78,1.93,6.88],[-5.78,1.93,1.88]],[[-5.48,1.57,1.58],[-5.48,.93,-3.82]],
      [[5.97,1.98,6.38],[5.97,1.98,2.04]],[[5.96,3.63,-4.61],[5.96,3.63,-7.66]],
      [[-5.42,.65,-7.6],[2.51,.65,-7.6]]]){
      tube(iron,a,b,.032);const n=Math.ceil(Math.hypot(a[0]-b[0],a[2]-b[2])/1.15);
      for(let j=0;j<=n;j++){const t=j/n,x=a[0]+(b[0]-a[0])*t,y=a[1]+(b[1]-a[1])*t,z=a[2]+(b[2]-a[2])*t;tube(iron,[x,y-.71,z],[x,y,z],.027);pin(x,y-.69,z,.047,.054);}
    }
    for(const [mat,geos] of groups)for(const [geo,instances] of geos){const mesh=new T.InstancedMesh(geo,mat,instances.length);
      instances.forEach((m,i)=>mesh.setMatrixAt(i,m));mesh.castShadow=mesh.receiveShadow=true;root.add(mesh);}
    let probe=null,prefilter=null;
    function reflect(renderer,actors,markers){
      if(probe||!gear.reflect||!rock.map?.image?.width)return;
      const hdr=renderer.capabilities.isWebGL2&&renderer.extensions.has('EXT_color_buffer_float');
      probe=new T.WebGLCubeRenderTarget(256,{type:hdr?T.HalfFloatType:T.UnsignedByteType,generateMipmaps:true,minFilter:T.LinearMipmapLinearFilter});
      const pos=V(.20,2.34,-.78),camera=new T.CubeCamera(.08,35,probe);
      camera.position.copy(pos).add(root.position);camera.updateMatrixWorld();
      const hidden=[...actors,...markers],visible=hidden.map(n=>n.visible),scissor=renderer.getScissorTest();
      hidden.forEach(n=>n.visible=false);gear.waterVisible(false);renderer.setScissorTest(false);
      try{
        camera.update(renderer,scene);
        gear.reflect(probe.texture,pos);
        if(hdr||renderer.extensions.has('EXT_color_buffer_half_float')){
          const generator=new T.PMREMGenerator(renderer);
          try{prefilter=generator.fromCubemap(probe.texture);scene.environment=prefilter.texture;}finally{generator.dispose();}
        }
      }finally{
        gear.waterVisible(true);hidden.forEach((n,i)=>n.visible=visible[i]);renderer.setScissorTest(scissor);
      }
    }
    const handsCache=[V(),V()];
    function hands(g,i){
      const p=g.players[i],s=g.cistern,t=TideCistern.target(g,i);
      if(!g.engaged[i]&&!(s.tape==='carried'&&!i))return null;
      const gr=gear.hands(!i&&s.tape==='carried'?'carry':({line:'line',rake:'rake',hoist:'hoist',pump:'pump',bypass:'bypass',cabinet:'cabinet',basket:'basket'})[t.kind]||'');
      if(gr){
        if(Array.isArray(gr)&&gr[0]?.isVector3)return gr;
        if(gr.left&&gr.right){[gr.left,gr.right].forEach((v,j)=>handsCache[j].fromArray(v).add(root.position));return handsCache;}
      }
      if(t.kind==='vent'){
        const c=cocks[Math.min(1,s.ports)];handsCache[0].set(-.113,0,.03);handsCache[1].set(.113,0,.03);
        return handsCache.map(h=>c.localToWorld(h));
      }
      if(!i&&s.tape==='carried'){
        const dx=Math.sin(p.yaw),dz=Math.cos(p.yaw);for(let j=0;j<2;j++){const a=j?.155:-.155;handsCache[j].set(p.x-dx*.39+a*dz,p.y+.96,p.z-dz*.39-a*dx);}return handsCache;
      }
      return null;
    }
    function filmHands(g,i,time){
      if(!i)return gear.hands('basket');
      const take=receipt(time);
      return take>.005?gear.hands('receive'):null;
    }
    function receipt(t){
      const line=TideCisternSpeech.reply.lines.find(row=>row[1].includes('盒子'))||TideCisternSpeech.reply.lines[0];
      const x=clamp((t-.25-TideCisternSpeech.box.duration-.24-line[0])/.94,0,1);return x*x*(3-2*x);
    }
    function update(g,filmTime){const s=g.cistern,p=g.players[0],receiver=filmTime?g.world.cistern.haul:g.players[1];
      env.update(g.time+filmTime,s.well);s.grateClear=s.cupKept;
      s.receipt=receipt(filmTime);s.receiver={x:receiver.x-o.x,y:receiver.y-o.y,z:receiver.z-o.z,yaw:1.73};
      s.carrier={x:p.x-o.x,y:p.y-o.y,z:p.z-o.z,yaw:p.yaw};
      gear.update(s,g.time+filmTime);rock.userData.waterline.value=s.well;pool.userData.waterline.value=s.water;
      feelers[0].rotation.y=-1.42*clamp((.88-s.raftZ)/1.15,0,1);
      cocks.forEach((c,i)=>{c.rotation.z=(i<s.ports?1:i===s.ports?s.vent:0)*Math.PI*1.32;});
    }
    const lens=(eye,at,fov,extra)=>({eye:eye.map((v,i)=>v+[o.x,o.y,o.z][i]),at:at.map((v,i)=>v+[o.x,o.y,o.z][i]),fov,...extra});
    function shot(g,i){
      const s=g.cistern,p=g.players[i],x=p.x-o.x,y=p.y-o.y,z=p.z-o.z,station=TideCistern.target(g,i);
      if((s.phase==='grate'||s.phase==='inspect')&&i&&g.engaged[1]){
        if(s.catchLift>.60)return lens([s.cupX+.355,s.cupY+.185,s.cupZ+.23],[s.cupX+.015,s.cupY,s.cupZ+.018],47,{focus:.37});
        return lens([3.30,3.45,4.88],[2.91,1.69,3.51],43);
      }
      if(!i&&g.engaged[0]&&g.stage<2)return lens([-3.07,2.91,4.07],[-4.36,2.22,3.00],55);
      if(i&&g.stage===1&&g.engaged[1]){
        const travel=lens([s.raftX+.71,Math.min(5.35,s.deckY+2.23),s.raftZ+1.91],[s.raftX-.10,s.deckY+1.02,s.raftZ-2.28],61);
        const low=!s.passed&&s.raftZ>-.24,amount=low?clamp((1.94-s.raftZ)/.85,0,1)*clamp((s.raftZ+.24)/.70,0,1):clamp((-3.28-s.raftZ)/.78,0,1);
        if(!amount)return travel;
        const slot=low?lens([2.99,s.deckY+1.55,.92],[1.99,s.deckY+.65,-.22],54):lens([3.01,s.deckY+1.70,-3.74],[2.32,(s.deckY+2.85)*.5+.57,-5.20],55);
        const mix=amount*amount*(3-2*amount);
        return {eye:travel.eye.map((v,j)=>v+(slot.eye[j]-v)*mix),at:travel.at.map((v,j)=>v+(slot.at[j]-v)*mix),fov:travel.fov+(slot.fov-travel.fov)*mix};
      }
      if(i&&g.engaged[1]&&station.kind==='bypass')return lens([5.38,4.73,-4.60],[4.10,3.76,-6.22],54);
      if(!i&&g.engaged[0]&&station.kind==='vent')return lens([x-.79,y+1.49,z+.38],[x-.31,y+.95,z-.34],53);
      if(!i&&g.engaged[0]&&station.kind==='cabinet')return lens([x+.58,y+1.85,z+.07],[x,y+.85,-6.51],51);
      if(s.phase==='hoist'&&g.engaged[i])return i?lens([4.60,4.86,-5.22],[2.67,2.34+s.hoist*.69,-6.05],57):lens([.76,1.65,-4.93],[2.64,.68+s.hoist*1.39,-6.02],63);
      if(i&&s.moored&&g.stage===1)return lens([x+1.11,4.96,z+2.60],[2.74,3.46,-5.98],61);
      return null;
    }
    function filmShot(g,i,time){
      const a=TideCistern.film(time).actor;
      if(!i)return lens([2.83,1.45,-5.14],[2.08,1.31,-5.84],49,{focus:1.04});
      if(a===1&&g.cistern.receipt<.90)return lens([2.06,4.23,-5.32],[3.03,3.96,-6.00],56);
      return lens([2.07,4.31,-5.57],[3.34,4.08,-6.02],52,{focus:1.30});
    }
    function cameraArm(v){v.x=clamp(v.x,o.x-5.95,o.x+5.95);v.z=clamp(v.z,o.z-7.70,o.z+7.65);v.y=Math.min(v.y,o.y+5.49);}
    const clamp=TideTraversal.clamp;
    return {update,shot,filmShot,filmHands,hands,cameraArm,reflect,dispose(){scene.environment=null;prefilter?.dispose();probe?.dispose();env.dispose();gear.dispose();sun.shadow.map?.dispose();root.traverse(n=>{if(n.isInstancedMesh)n.dispose();});root.removeFromParent();for(const a of owned)a.dispose();}};
  }
  return {create};
})();
