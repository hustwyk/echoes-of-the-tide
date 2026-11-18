// The inspection floats ride the simulated swell. Their moorings stay attached to the stone sills.
const TideSurveyPier=(()=>{
  const T=THREE,V=(x,y,z)=>new T.Vector3(x,y,z),up=V(0,1,0),tau=Math.PI*2;
  function buildPile(stump,own,rod,iron,bolt,wood){
    // Wet split timber has a jagged crown, a complete lower collar and a missing segment of the upper one.
    let seed=738;const rand=()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296);
    const pts=[],rgb=[],idx=[],rings=6,N=44,grain=Array.from({length:N},()=>rand());
    for(let j=0;j<rings;j++)for(let i=0;i<N;i++){
      const a=i*tau/N,y=[-5,-3.31,-2.88,-2.61,-2.35,-2.13][j]+(j===5?grain[i]*.23-.09:0),rad=(.31+.031*grain[i])*(j===5?.83:1);
      pts.push(Math.sin(a)*rad+.034*(y+3),y,Math.cos(a)*rad);
      const v=.049+.075*grain[i]+.015*j;rgb.push(v,v*.81,v*.60);
      if(j<rings-1){const k=j*N+i,n=j*N+(i+1)%N;idx.push(k,n,n+N,k,n+N,k+N);}
    }
    for(let i=1;i<N-1;i++)idx.push(5*N,5*N+i,5*N+i+1);
    const splinters=own(new T.BufferGeometry());splinters.setAttribute('position',new T.Float32BufferAttribute(pts,3));splinters.setAttribute('color',new T.Float32BufferAttribute(rgb,3));splinters.setIndex(idx);splinters.computeVertexNormals();
    const bark=own(new T.MeshStandardMaterial({vertexColors:true,roughness:.59,metalness:.09,side:T.DoubleSide}));
    const pile=new T.Mesh(splinters,bark);pile.castShadow=true;stump.add(pile);
    for(let k=0;k<27;k++){
      const a=k*tau/27,b=(k+1)*tau/27;
      for(const [y,missing] of [[-2.77,false],[-2.50,k>=2&&k<=7]]){
        if(missing)continue;
        rod(stump,iron,V(Math.sin(a)*.373,y+.028*Math.cos(a),Math.cos(a)*.373),V(Math.sin(b)*.373,y+.028*Math.cos(b),Math.cos(b)*.373),.048,.034);
        if(k%4===0)rod(stump,bolt,V(Math.sin(a)*.36,y+.015,Math.cos(a)*.36),V(Math.sin(a)*.42,y+.015,Math.cos(a)*.42),.023);
      }
      const h=grain[k]*.24;
      rod(stump,wood,V(Math.sin(a)*.25,-2.18,Math.cos(a)*.25),V(Math.sin(a)*.278,-2.09+h,Math.cos(a)*.278),.014);
    }
  }
  function create(scene,g){
    const root=new T.Group(),base=TideSoundings.point(0,0,0);
    root.position.set(base.x,0,base.z);scene.add(root);
    const w=g.world.soundings,env=TideSoundingsEnv.create(root,g.world),gear=TideSoundingsGear.create(root);
    const owned=new Set(),own=o=>(owned.add(o),o);
    const mat=(color,roughness,metalness)=>own(new T.MeshStandardMaterial({color,roughness,metalness}));
    const iron=TideSteel.material(0,own,true),zinc=mat(0x879491,.54,.78),rubber=mat(0x343a34,.72,.08),
      ochre=mat(0xc19451,.61,.42),wood=mat(0x554d3e,.80,.12),rope=mat(0x75684b,.92,.07),bolt=mat(0x978d75,.46,.69);
    const box=own(new T.BoxGeometry(1,1,1)),cyl=own(new T.CylinderGeometry(1,1,1,14)),dummy=new T.Object3D(),batches=new Map();
    function form(parent,geo,material,pos,scale,rot){
      if(!batches.has(parent))batches.set(parent,new Map());
      const sub=batches.get(parent),key=geo.uuid+material.uuid;if(!sub.has(key))sub.set(key,{geo,material,instances:[]});
      dummy.position.copy(pos);dummy.scale.copy(scale);dummy.quaternion.identity();if(rot)dummy.quaternion.copy(rot);
      dummy.updateMatrix();sub.get(key).instances.push(dummy.matrix.clone());
    }
    function block(parent,mat,x,y,z,sx,sy,sz){form(parent,box,mat,V(x,y,z),V(sx,sy,sz));}
    function rod(parent,mat,a,b,r,rz=r){const n=b.clone().sub(a);form(parent,cyl,mat,a.clone().lerp(b,.5),V(r,n.length(),rz),new T.Quaternion().setFromUnitVectors(up,n.normalize()));}
    const lines=[],floats=w.floats.map((f,i)=>{
      const o=new T.Group();root.add(o);const hx=f.w*.5,hz=f.d*.5;
      for(const sign of [-1,1]){
        const x=sign*(hx-.17);rod(o,rubber,V(x,-.52,-hz+.035),V(x,-.52,hz-.035),.29,.30);
        for(const z of [-hz+.12,0,hz-.12]){
          rod(o,iron,V(x,-.52,z-.032),V(x,-.52,z+.032),.302);
          rod(o,zinc,V(x,-.20,z),V(x,-.13,z),.046);
        }
        block(o,iron,sign*(hx-.041),-.082,0,.08,.15,f.d);
        block(o,iron,0,-.089,sign*(hz-.04),f.w-.10,.16,.08);
        block(o,ochre,0,-.020,sign*(hz-.047),f.w*.64,.042,.090);
        for(const zz of [-hz+.12,hz-.12])rod(o,bolt,V(sign*(hx-.11),-.054,zz),V(sign*(hx-.11),.007,zz),.019);
      }
      for(let j=0;j<16;j++)block(o,zinc,-hx+.10+j*(f.w-.20)/15,-.027,0,.027,.052,f.d-.10);
      for(let j=0;j<15;j++)block(o,iron,0,-.058,-hz+.105+j*(f.d-.210)/14,f.w-.12,.050,.016);
      for(const x of [-.27,.27])block(o,iron,x,-.117,0,.055,.070,f.d-.10);
      for(const s of [-1,1]){
        const end=V(s*(hx-.09),-.16,s*hz*.62),start=V(f.anchor.x-base.x+s*(i===2?1.95:1.12),-1.68,f.anchor.z-base.z+s*(i===2?1.03:1.65));
        const pieces=[];for(let k=0;k<5;k++){const m=new T.Mesh(cyl,rope);root.add(m);pieces.push(m);}
        lines.push({end,start,pieces,o});rod(root,iron,start.clone().add(V(0,-3.5,0)),start,.058);
      }
      return o;
    });
    const stump=new T.Group();stump.position.set(TideLookout.marks.stump.x-base.x,0,TideLookout.marks.stump.z-base.z);root.add(stump);
    buildPile(stump,own,rod,iron,bolt,wood);
    for(const [parent,groups] of batches)for(const {geo,material,instances} of groups.values()){
      const mesh=new T.InstancedMesh(geo,material,instances.length);instances.forEach((m,i)=>mesh.setMatrixAt(i,m));
      mesh.castShadow=mesh.receiveShadow=true;parent.add(mesh);own(mesh);
    }
    const waterEdge=new T.Mesh(own(new T.PlaneGeometry(.181,.014,10,1)),
      own(new T.MeshBasicMaterial({color:0xb7cebe,transparent:true,opacity:.74,depthWrite:false,side:T.DoubleSide})));
    root.add(waterEdge);waterEdge.rotation.y=Math.PI*.5;
    const start=V(0,0,0),end=V(0,0,0),a=V(0,0,0),b=V(0,0,0),d=V(0,0,0);
    function update(g){
      const r=g.survey,t=g.time;
      for(let i=0;i<floats.length;i++){const f=w.floats[i];floats[i].position.set(f.x-base.x,f.y,f.z-base.z);}
      for(const l of lines){
        start.copy(l.start);end.copy(l.o.position).add(l.end);
        for(let j=0;j<l.pieces.length;j++){
          const m=l.pieces[j],u=j/l.pieces.length,v=(j+1)/l.pieces.length;
          a.copy(start).lerp(end,u);b.copy(start).lerp(end,v);a.y-=.22*Math.sin(u*Math.PI);b.y-=.22*Math.sin(v*Math.PI);
          d.copy(b).sub(a);m.position.copy(a).lerp(b,.5);m.scale.set(.017,d.length(),.017);m.quaternion.setFromUnitVectors(up,d.normalize());
        }
      }
      waterEdge.visible=r.mount>=0;
      if(waterEdge.visible){
        const q=w.probes[r.mount];waterEdge.position.set(q.x-base.x+.034,TideSoundings.surface(q.x,q.z,t)+.010,q.z-base.z);
        const pos=waterEdge.geometry.attributes.position;
        for(let i=0;i<pos.count;i++)pos.setY(i,(i<11?.008:-.006)+.006*Math.sin(pos.getX(i)*38+t*4.1));
        pos.needsUpdate=true;
      }
      env.update(t,g.cues.water);const p=g.players[0];
      gear.update({...r,stage:g.stage,rack:!r.taken,staff:[p.x-base.x,p.y,p.z-base.z,p.yaw],marked:g.watch?.done===true,sight:TideSoundings.sightLine(r),solved:r.fixed,rule:TideSurveyPlot.visual(r.plotter,g.stage===2),time:t});
    }
    function hands(g,i){
      const r=g.survey,s=TideSoundings.target(g,i);
      if(!g.engaged[i])return !i&&r.carry?gear.hands('rack',0):null;
      return gear.hands(s.kind,s.index);
    }
    const view=(a,b,fov,handsOnly=false)=>({eye:[base.x+a[0],a[1],base.z+a[2]],at:[base.x+b[0],b[1],base.z+b[2]],fov,handsOnly});
    function shot(g,i,aspect){
      const r=g.survey,p=g.players[i],s=TideSoundings.target(g,i);
      if(!g.engaged[i])return null;
      if(g.stage===2){
        if(i){const cam=TideLookout.camera(g);return {...cam,fov:24,handsOnly:true};}
        const fov=2*Math.atan(Math.max(1.70,2.19/aspect)/3.44)*180/Math.PI;
        return view([-.87,4.10,3.45],[-.56,2.55,2.78],fov);
      }
      if(i)return {...TideSoundings.scopeAim(g),handsOnly:true};
      if(s.kind==='rack')return view([-4.60,3.32,4.85],[-3.27,2.40,3.69],51);
      if(r.mount!==g.stage)return null;
      const q=w.probes[g.stage],x=q.x-base.x,z=q.z-base.z;
      const water=TideSoundings.surface(q.x,q.z,g.time),level=water*.66+r.jaw*.34;
      return view([x+1.40,-.96,z+.22],[x,level,z],26);
    }
    return {update,hands,shot,dispose(){env.dispose();gear.dispose();owned.forEach(o=>o.dispose());root.removeFromParent();}};
  }
  return {create,buildPile};
})();
