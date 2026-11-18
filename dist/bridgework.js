// Engineering scale is in metres. All leaf-mounted pieces share the collision plane's pivot.
const TideBridgework=(()=>{
  const T=THREE,up=new T.Vector3(0,1,0);
  function create(scene,g,floors,actors){
    if(!g.world.sections.some(s=>s.span))return null;
    const shared=new Set(),batches=new Map(),contacts=new Map(),carriers=[],wires=[],sights=[];
    const own=o=>(shared.add(o),o);
    const cube=own(new T.BoxGeometry()),roller=own(new T.CylinderGeometry(.5,.5,1,14));
    const dummy=new T.Object3D(),color=new T.Color();
    const V=(x,y,z)=>new T.Vector3(x,y,z);
    const group=(parent,name)=>{const obj=new T.Group();parent.add(obj);obj.name=name;return obj;};
    const base=group(scene,'桥墩、索塔和接收座');
    const plain=own(new T.MeshStandardMaterial({roughness:.57,metalness:.46}));
    const light=own(new T.MeshBasicMaterial());
    const iron=TideSteel.material(0,own),plate=TideSteel.material(1,own),stone=own(TideConcrete.material(0xbac2ba));
    function add(parent,shape,mat,tint,p,size,rotation){
      const key=[parent.id,shape.id,mat.id].join('-');
      if(!batches.has(key))batches.set(key,{parent,shape,mat,parts:[]});
      dummy.position.copy(p);dummy.scale.set(...size);dummy.rotation.set(0,0,0);
      if(rotation?.isQuaternion)dummy.quaternion.copy(rotation);
      else if(rotation)dummy.rotation.set(...rotation);
      dummy.updateMatrix();batches.get(key).parts.push([dummy.matrix.clone(),tint]);
    }
    const box=(root,x,y,z,w,h,d,m=iron,c=0xffffff,rot)=>add(root,cube,m,c,V(x,y,z),[w,h,d],rot);
    const cyl=(root,x,y,z,r,h,m,c,rot)=>add(root,roller,m,c,V(x,y,z),[2*r,h,2*r],rot);
    function beam(root,a,b,w,d,m=iron,c=0xffffff){
      const start=V(...a),end=V(...b),axis=end.clone().sub(start),len=axis.length();
      add(root,cube,m,c,start.lerp(end,.5),[w,len,d],new T.Quaternion().setFromUnitVectors(up,axis.normalize()));
    }
    const ochre=0xd9a758,bronze=0xa47a48,dark=0x29383a;
    function grips(root,x,y,z){
      return [-1,1].map(k=>{const o=group(root,'握点');o.position.set(x+k*.185,y,z);return o;});
    }
    function cable(a,p){
      const m=new T.Mesh(roller,plain);m.name='升桥钢索';scene.add(m);wires.push({a,m,p});
    }
    const spans=g.world.sections.filter(s=>s.span);
    for(const sec of spans){
      const b=sec.span,L=b.length,hw=b.deck.w*.5,deck=floors.get(b.deck);
      const z=v=>L*.5-v;
      const seam=(v0,v1)=>{
        const n=Math.ceil((v1-v0)/1.25),step=(v1-v0)/n;
        for(let i=0;i<n;i++){
          const cz=z(v0+(i+.5)*step);
          box(deck,0,-.063,cz,hw*2-.11,.123,step-.013,plate,0xc1c8c3);
          for(const side of [-1,1])for(const k of [-.32,.32])cyl(deck,side*(hw-.20),.008,cz+k*step,.034,.021,plain,bronze);
        }
      };
      if(b.lower){const [v0,v1]=b.deck.gap.map(n=>n+L*.5);seam(0,v0);seam(v1,L);}
      else seam(0,L);
      const n=Math.ceil(L/2.6),step=L/n;
      for(const k of [-1,1]){
        const x=k*(hw-.095);
        box(deck,x,-.35,0,.12,.62,L);box(deck,x,-.63,0,.29,.10,L);
        box(deck,x,-.014,0,.19,.038,L,plain,ochre);
        for(let j=0;j<=n;j++){
          const cz=z(j*step);
          box(deck,x+k*.095,-.33,cz,.085,.62,.32,plain,0x55645d);
          for(const h of [-.51,-.19])cyl(deck,x+k*.153,h,cz,.054,.038,plain,bronze,[0,0,Math.PI/2]);
          box(deck,x,.48,cz,.071,1.03,.085);box(deck,x,.81,cz,.10,.26,.10,plain,ochre);
          if(j<n)beam(deck,[x,-.57,cz],[x,-.13,cz-step],.078,.075);
        }
        box(deck,x,1.03,0,.079,.079,L,plain,0x8e9b93);box(deck,x,.52,0,.032,.038,L,plain,0x687a75);
      }
      for(let j=0;j<=n;j++)box(deck,0,-.38,z(j*step),hw*2,.34,.17);
      if(b.lower){
        for(const v of b.gates){
          const cz=z(v);
          for(const k of [-1,1]){
            box(deck,k*(hw-.04),1.05,cz,.12,2.12,.15);
            beam(deck,[k*(hw-.1),1.6,cz],[k*(hw-.54),2.06,cz],.073,.083);
          }
          box(deck,0,2.13,cz,2*hw,.24,.19);
          for(let i=-3;i<=3;i++)box(deck,i*.36,2.12,cz+.101,.19,.2,.017,plain,ochre,[0,0,-.28]);
        }
      }
      const railZ=z(b.rail*L);
      for(const d of [-.27,.27])box(deck,0,.067,railZ+d,hw*2-.13,.11,.077,plain,0xa9aaa2);
      for(let i=-6;i<=6;i++)box(deck,i*.18,.013,railZ-.51,.027,.024,i%3?.073:.17,plain,0xeed9aa);
      const cart=group(deck,'横移配重车');cart.position.z=railZ;
      for(const x of [-.29,.29])for(const s of [-.27,.27]){
        cyl(cart,x,.161,s,.115,.09,plain,dark,[Math.PI/2,0,0]);
        cyl(cart,x,.161,s+.051,.072,.018,plain,bronze,[Math.PI/2,0,0]);
      }
      for(let k=0;k<4;k++)box(cart,0,.295+.092*k,0,.81-.045*k,.078,.50,iron,k%2?0xaab4a9:0xdacbc0);
      for(const k of [-1,1])beam(cart,[k*.27,.48,.11],[k*.27,.90,.04],.052,.052,plain,bronze);
      box(cart,0,.90,.04,.68,.062,.073,plain,0xa98151);
      for(const k of [-1,1])box(cart,k*.185,.902,.04,.155,.074,.082,plain,dark);
      contacts.set(sec,grips(cart,0,.915,.05));carriers.push({b,cart});
      box(deck,0,.029,z(L-.48),.10,.058,.91,plain,0xffde83);
      for(const k of [-1,1]){
        const x=b.hinge.x+k*(hw+.42),h=b.hinge.y,worldZ=b.hinge.z;
        box(base,x,h-2.28,worldZ,1.32,5.4,2.4,stone);
        box(base,x,h+2.44,worldZ,.24,5.1,.34);
        beam(base,[x,h+.1,worldZ+2.12],[x,h+4.83,worldZ],.17,.24);
        cyl(base,x,h+4.89,worldZ,.39,.24,plain,bronze,[0,0,Math.PI/2]);
        cyl(base,x+k*.145,h+4.89,worldZ,.128,.068,plain,dark,[0,0,Math.PI/2]);
        cable(V(x,h+4.89,worldZ),()=>TideDrawbridge.point(b,k*(hw-.095),.92,L*.68));
      }
      box(base,b.hinge.x,b.hinge.y+4.76,b.hinge.z,hw*2+1.12,.24,.27);
      for(const [index,a] of [b.level+.205,b.level].entries()){
        const x=b.lip.x,y=b.hinge.y+Math.sin(a)*L,z0=b.hinge.z-Math.cos(a)*L;
        const sight=group(base,'活动对中标');sight.position.set(x,y,z0-.40);
        // Sighting from the trolley puts the white fork over the ochre centre line.
        box(sight,hw*.54,.185,0,hw*1.13,.046,.063,plain,dark);
        for(const k of [-1,1])box(sight,k*.105,.32,0,.046,.28,.057,light,0xf5e9be);
        const lamp=new T.Mesh(roller,own(new T.MeshBasicMaterial({color:0xd99850})));
        lamp.scale.set(.12,.085,.12);lamp.position.set(hw+.17,.47,0);sight.add(lamp);
        sights.push({b,index,sight,lamp});
        // The first pair of guides is overhead. The second sits flush to the landing.
        for(const k of [-1,1]){
          const xx=x+k*(hw+.17);
          box(base,xx,y-1.8,z0,.22,3.76,.28);
          cyl(base,xx,y,z0,.18,.34,plain,bronze,[Math.PI/2,0,0]);
          box(base,xx,y+.28,z0,.23,.21,.19,light,index?0x83d5bd:0xf0be75);
        }
        if(index)box(base,x,y-.37,z0-.26,hw*2+.66,.63,.62,stone);
      }
    }
    const last=g.world.sections.at(-1),c=last.tram,car=floors.get(c.deck);
    box(car,0,-.095,0,c.deck.w,.19,c.deck.d,plate,0xc1c8b8);
    for(const k of [-1,1]){
      const x=k*2.24;
      box(car,x,.42,0,.12,.92,3.78);box(car,x,.94,0,.096,.078,3.78,plain,ochre);
      box(car,x-k*.32,.46,.35,.51,.099,1.5,plain,0x907251);
      for(const zz of [-1.72,1.72]){
        beam(car,[x,0,zz],[x-k*.67,2.72,zz*.56],.085,.10);
        beam(car,[x-k*.67,2.72,zz*.56],[k*1.32,3.7,zz*.38],.13,.12);
        cyl(car,k*1.32,3.8,zz*.38,.24,.15,plain,bronze,[0,0,Math.PI/2]);
      }
      box(car,k*1.32,3.76,0,.12,.22,1.59);
      let prev;
      for(let i=0;i<=18;i++){
        const t=i/18,arc=Math.sin(Math.PI*t),p=[T.MathUtils.lerp(c.from.x,c.to.x,t)+arc*.60+k*1.32,T.MathUtils.lerp(c.from.y,c.to.y,t)-arc*.75+3.59,T.MathUtils.lerp(c.from.z,c.to.z,t)];
        if(prev)beam(base,prev,p,.045,.046,plain,0x697a76);prev=p;
      }
    }
    box(car,0,.28,-1.82,1.77,.53,.085);box(car,0,.65,-1.82,1.82,.078,.08,plain,ochre);
    const doors=[-1,1].map(k=>{
      const door=group(car,'到站侧门');door.position.set(k*2.22,0,-1.8);
      box(door,-k*.66,.62,0,1.32,.06,.065,plain,ochre);
      box(door,-k*.66,.30,0,1.32,.045,.046);box(door,-k*1.27,.43,0,.058,.42,.06);
      return {door,k};
    });
    for(const p of [c.from,c.to]){
      for(const k of [-1,1])box(base,p.x+k*2.66,p.y+.32,p.z,.27,7.11,.32);
      box(base,p.x,p.y+3.87,p.z,5.66,.31,.34);
    }
    const cabinHands=[-.8,.8].map(x=>grips(car,x*.64,.93,-.64));
    const staff=group(actors[0].userData.rig.bones.chest,'折叠潮尺');
    staff.position.set(-.25,-.22,.19);
    for(let i=0;i<18;i++){
      box(staff,0,i*.105-.16,0,.10,.105,.036,plain,i%2?0xeae3cc:0xb13e30);
      box(staff,-.025,i*.105-.15,.021,.046,.022,.008,plain,dark);
    }
    box(staff,0,-.22,0,.107,.065,.043,plain,bronze);
    for(const {parent,shape,mat,parts} of batches.values()){
      const mesh=own(new T.InstancedMesh(shape,mat,parts.length));
      parts.forEach(([matrix,tint],i)=>{mesh.setMatrixAt(i,matrix);mesh.setColorAt(i,color.set(tint));});
      mesh.receiveShadow=true;mesh.castShadow=mat!==light;mesh.computeBoundingSphere();parent.add(mesh);
    }
    batches.clear();
    const handPoints=[[],[]].map(()=>[V(0,0,0),V(0,0,0)]);
    function hands(sec,i){
      const anchors=sec.tram?cabinHands[i]:contacts.get(sec);
      anchors.forEach((o,j)=>o.getWorldPosition(handPoints[i][j]));return handPoints[i];
    }
    const tip=V(0,0,0),axis=V(0,0,0);
    function update(){
      for(const {b,index,sight,lamp} of sights){
        sight.visible=b.notch===index;
        lamp.material.color.setHex(b.aligned?0x91ffc8:g.time-b.impact<.65?0xff613e:0xffb54c);
      }
      for(const {door,k} of doors)door.rotation.y=c.arrived?k*1.50:0;
      for(const {b,cart} of carriers)cart.position.x=b.mass*.91;
      const lower=g.section.span;staff.visible=!!lower?.lower&&!lower.landed;
      if(staff.visible)staff.rotation.x=.04+lower.folded*1.45;
      for(const {a,m,p} of wires){
        const end=p();tip.set(end.x,end.y,end.z);axis.subVectors(tip,a);
        m.position.copy(a).lerp(tip,.5);m.scale.set(.041,axis.length(),.041);m.quaternion.setFromUnitVectors(up,axis.normalize());
      }
    }
    function dispose(){staff.removeFromParent();base.removeFromParent();for(const r of shared)r.dispose();}
    update();return {update,hands,dispose};
  }
  return {create};
})();
