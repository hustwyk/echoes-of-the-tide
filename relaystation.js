// Both views share the physical transfer car, the selected file and the moving radio head.
const TideRelayStation=(()=>{
  const T=THREE;
  function create(scene,g){
    const origin=TideRelay.point(0,0,0),root=new T.Group(),car=new T.Group(),bogie=new T.Group();
    root.position.set(origin.x,origin.y,origin.z);scene.add(root);root.add(car,bogie);
    const env=TideRelayEnv.create(root,g.world),gear=TideRelayGear.create(root),fittings=TideTrolleyFittings.create(root,car);
    const owned=new Set(),keep=o=>(owned.add(o),o);
    const metal=(color,roughness,metalness)=>keep(new T.MeshStandardMaterial({color,roughness,metalness}));
    const iron=metal(0x405053,.49,.74),edge=metal(0x9d9d85,.34,.68),rub=metal(0x272e30,.72,.12),yellow=metal(0xe3a251,.53,.52);
    const box=keep(new T.BoxGeometry(1,1,1)),cylinder=keep(new T.CylinderGeometry(1,1,1,12));
    const up=new T.Vector3(0,1,0),dir=new T.Vector3(),vec=(a)=>new T.Vector3(...a);
    const batches=new Map(),matrix=new T.Object3D();
    function add(parent,shape,mat,center,size,quat){
      let arr=batches.get(parent);if(!arr)batches.set(parent,arr=new Map());
      const key=shape.uuid+mat.uuid;if(!arr.has(key))arr.set(key,{shape,mat,list:[]});
      matrix.position.copy(center);matrix.quaternion.identity();if(quat)matrix.quaternion.copy(quat);
      matrix.scale.copy(size);matrix.updateMatrix();arr.get(key).list.push(matrix.matrix.clone());
    }
    function bar(parent,a,b,r,mat){const p=vec(a),q=vec(b);dir.copy(q).sub(p);
      const length=dir.length(),rotation=new T.Quaternion().setFromUnitVectors(up,dir.normalize());
      add(parent,cylinder,mat,p.lerp(q,.5),new T.Vector3(r,length,r),rotation);
    }
    function block(parent,c,size,mat){add(parent,box,mat,vec(c),vec(size));}
    function ladder(x,z,bottom,top){
      for(const u of [-.32,.32]){
        bar(root,[x+u,bottom+.03,z],[x+u,top+.65,z],.027,edge);
        for(let y=bottom+.24;y<top+.25;y+=.83)bar(root,[x+u,y,z],[x+u,y,z-.20],.023,iron);
      }
      for(let y=bottom+.23;y<top+.05;y+=.29){
        bar(root,[x-.33,y,z],[x+.33,y,z],.023,edge);
        for(const u of [-.18,.18])bar(root,[x+u-.10,y,z],[x+u+.10,y,z],.027,rub);
      }
    }
    ladder(-5.4,-.65,0,2.04);ladder(-1.52,-2.05,2.02,4.56);
    for(const z of [-.55,.55]){
      block(car,[0,-.075,z],[1.43,.15,.07],iron);block(car,[0,-.012,z],[1.37,.021,.087],yellow);
      for(const x of [-.61,.61])bar(car,[x,-.14,z],[x,-.045,z],.028,edge);
    }
    for(const u of [-.68,0,.68])block(car,[u,-.055,0],[.053,.11,1.17],iron);
    for(let i=0;i<24;i++)block(car,[-.655+i*.057,-.014,0],[.028,.034,1.14],edge);
    for(let i=0;i<11;i++)block(car,[0,-.025,-.48+i*.095],[1.39,.022,.020],iron);
    const hangers=[];
    for(const z of [-.99,-1.95]){
      bar(root,[-5.96,3.92,z],[-.64,3.92,z],.029,iron);
      for(const x of [-.39,.39]){
        const u=z+1.47,b=x*.61;
        bar(bogie,[b,0,u-.034],[b,0,u+.034],.083,rub);
        for(const side of [-.052,.052])bar(bogie,[b,0,u+side],[b,-.13,u+side],.024,edge);
        bar(bogie,[b,-.13,u-.07],[b,-.13,u+.07],.023,iron);
        const cable=new T.Mesh(cylinder,edge);
        root.add(cable);cable.castShadow=true;
        hangers.push({cable,bottom:vec([x,.015,u]),upper:vec([b,-.13,u])});
      }
    }
    const lowerEye=new T.Vector3(),upperEye=new T.Vector3();
    for(const [parent,groups] of batches)for(const {shape,mat,list} of groups.values()){
      const inst=new T.InstancedMesh(shape,mat,list.length);list.forEach((m,i)=>inst.setMatrixAt(i,m));
      inst.castShadow=inst.receiveShadow=true;parent.add(inst);keep(inst);
    }
    const folder=new T.Group();root.add(folder);
    const folios=[1,2,3].map(n=>{const o=root.getObjectByName('Working archive original '+n).clone(true);
      o.position.set(0,0,0);o.rotation.set(0,0,0);folder.add(o);return o;});
    const grips=[new T.Vector3(),new T.Vector3()];
    const local=(p)=>[p.x-origin.x,p.y,p.z-origin.z];
    const shotAt=(a,b,fov,handsOnly=false,focus=0)=>({eye:[a[0]+origin.x,a[1],a[2]+origin.z],at:[b[0]+origin.x,b[1],b[2]+origin.z],fov,handsOnly,focus});
    function update(g){
      const r=g.relay,w=g.world.relay,p=g.players[1],held=r.file>=0&&!r.loaded;
      env.update(g.time);car.position.set(w.car.x-origin.x,w.car.y,w.car.z-origin.z);
      car.rotation.z=r.trolley.tilt;bogie.position.set(TideRelayTrolley.railX(r.travel),4.016,-1.47);
      car.updateMatrix();
      for(const {cable,bottom,upper} of hangers){
        lowerEye.copy(bottom).applyMatrix4(car.matrix);
        upperEye.copy(upper).add(bogie.position);
        dir.subVectors(upperEye,lowerEye);cable.scale.set(.014,dir.length(),.014);
        cable.quaternion.setFromUnitVectors(up,dir.normalize());cable.position.copy(lowerEye).lerp(upperEye,.5);
      }
      fittings.update({travel:r.travel,brake:r.trolley.brake,bolt:r.trolley.bolt,locked:r.trolley.locked});
      const id=r.voice,word=id.startsWith('word')?Number(id.slice(4)):-1;
      gear.update({...r,yaw:r.actualYaw,pitch:r.actualPitch,stage:g.stage,
        head:word<0?r.cursor/5:(word+r.clock/TideRelaySpeech[id].duration)/6,attempted:r.tried,
        tx:['word','checkin','sign'].includes(r.stageMode),rx:!!id&&!['word','checkin','sign'].includes(r.stageMode)});
      folder.visible=held;
      if(held){
        folios.forEach((o,i)=>{o.visible=i===r.file;});
        folder.rotation.set(-.69,p.yaw,.025,'YXZ');folder.scale.setScalar(.64);
        folder.position.set(p.x-origin.x-.34*Math.sin(p.yaw),1.03+p.y,p.z-origin.z-.34*Math.cos(p.yaw));
      }
    }
    function hands(g,i){
      const r=g.relay,w=g.world.relay,p=g.players[i];
      if(!i&&r.climb){
        const upper=r.climb==='upper',bottom=upper?2.02:0,x=upper?w.lift.x:w.foot.x,z=origin.z+(upper?-2.05:-.65);
        return grips.map((v,j)=>{const n=Math.floor((p.y+1.16-bottom)/.58+(j?.5:0));
          return v.set(x+(j?.20:-.20),Math.min(bottom+.23+n*.58+(j?0:.29),upper?5.08:2.54),z+.012);});
      }
      if(i&&r.file>=0&&!r.loaded&&!g.engaged[1]){
        folder.updateWorldMatrix(true,false);
        return grips.map((v,j)=>v.set(j?.29:-.29,-.18,.02).applyMatrix4(folder.matrixWorld));
      }
      if(!g.engaged[i])return null;
      const s=TideRelay.target(g,i),kind=!i&&r.top?(g.stage===2?'throat':'mast'):i&&s===w.desk&&g.stage===2?'sign':s.kind;
      if(!i&&!r.top&&p.ground===w.car)return fittings.grip(grips);
      const result=gear.hands(kind,s.index);
      if(kind==='haul'&&r.trolley.brake>.40){
        grips[0].copy(result[0]);fittings.brakeGrip(grips[1]);return grips;
      }
      return result.length===2?result:null;
    }
    function shot(g,i,aspect){
      const r=g.relay,w=g.world.relay,p=g.players[i],s=TideRelay.target(g,i);
      if(!i&&!r.top&&!r.climb&&p.ground===w.car&&g.engaged[0]){
        const [x,y,z]=local(w.car);
        // From beside the grip both the moving brass nose and the fixed fork stay in view.
        const follow=Math.max(-.76,Math.min(.76,(-1.52-x)*.40));
        return shotAt([x+.50,y+.96,z+.06],[x+follow,y+.64,z-.67],aspect<.82?66:60,true,.96);
      }
      if(!i&&!r.top&&(r.climb||p.y>.78)){
        const [x,y,z]=local(p);return shotAt([x+1.15,y+1.88,z+3.92],[x+.48,y+1.00,z-.44],57);
      }
      if(!g.engaged[i])return null;
      if(!i){
        if(!r.top||TideLookout.active(g))return null;
        const e=w.eye,v=new T.Vector3(Math.sin(r.actualYaw)*Math.cos(r.actualPitch),Math.sin(r.actualPitch),-Math.cos(r.actualYaw)*Math.cos(r.actualPitch));
        const eye=new T.Vector3(e.x,e.y,e.z).addScaledVector(v,.35);
        return {eye:eye.toArray(),at:eye.clone().add(v).toArray(),fov:38,handsOnly:true};
      }
      if(s===w.haul)return shotAt([.56,1.66,3.84],[.036,1.21,2.79],aspect<.82?55:48,true,1.18);
      if(s.kind==='file'){const x=s.x-origin.x;return shotAt([x-.305,1.84,.87],[x,.94,.18],45,true);}
      return shotAt([3.31,2.23,-3.69],[3.735,1.17,-4.97],45,true);
    }
    function dispose(){env.dispose();gear.dispose();fittings.dispose();owned.forEach(o=>o.dispose());root.removeFromParent();}
    return {update,hands,shot,dispose};
  }
  return {create};
})();
