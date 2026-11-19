// World-space purchases for the north breakwater coping. The simulation owns
// the root, including the short downward pendulum after the first catch.
const TideMantlePose=(()=>{
  const T=THREE, V=()=>new T.Vector3(), Q=()=>new T.Quaternion();
  const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
  const ramp=(a,b,x)=>{const f=clamp((x-a)/(b-a));return f*f*(3-2*f);};
  const mix=(a,b,t)=>a+(b-a)*t;
  const torso=[
    // progress, seated pelvis x/y relative to the outside top corner, chest lean.
    [0,.32,-.79,-.34],[.14,.36,-.65,-.23],[.32,.40,-.43,-.27],
    [.48,.36,-.24,-.60],[.61,.15,-.03,-.98],[.73,-.02,.17,-1.11],
    [.84,-.24,.39,-.85],[.93,-.41,.67,-.44],[1,-.53,.935,-.024]
  ];
  const lead=[
    // Ankle positions. While under the lip the tip stays against the wall.
    [0,.178,-1.42,.51],[.17,.18,-1.22,.52],[.35,.18,-.86,.56],
    [.50,.18,-.42,.62],[.57,.20,-.105,.53],[.635,.16,.118,.42],
    [.67,-.014,.161,.27],[.70,-.197,.16,.10],[.745,-.431,.148,-.29],[.765,-.535,.13,-.42],
    [.823,-.535,.064,-.17],[.846,-.535,.064,-.033],[.87,-.535,.064,.23],[.925,-.535,.064,.13],[1,-.535,.064,0]
  ];
  const trail=[
    [0,.18,-1.55,.44],[.24,.18,-1.32,.49],[.47,.18,-.87,.56],
    [.64,.18,-.49,.56],[.76,.18,-.18,.54],[.83,.17,.035,.42],
    [.88,.11,.19,.25],[.94,-.22,.15,.11],[.975,-.47,.079,.02],[1,-.518,.064,0]
  ];
  const kneePath=[
    [0,.105,-1.125,.30],[.22,.09,-.91,.30],[.40,.099,-.52,.29],[.472,.096,-.22,.30],
    [.504,.107,-.014,.28],[.532,.054,.11,.27],[.56,-.037,.072,.25],
    [.58,-.056,.074,.26],[.612,-.102,.154,.25],[.65,-.157,.263,.25],[.70,-.247,.30,.24],
    [.764,-.33,.38,.205],[.84,-.56,.41,.17],[.93,-.67,.411,.13],[1,-.55,.462,.102]
  ];
  const timeCurve=(table,t,out)=>{
    let n=0;while(n<table.length-2&&table[n+1][0]<t)n++;
    const a=table[n],b=table[n+1],prev=table[Math.max(0,n-1)],next=table[Math.min(n+2,table.length-1)];
    const d=b[0]-a[0],f=clamp((t-a[0])/d),f2=f*f,f3=f2*f;
    for(let j=1;j<a.length;j++){
      const s=(b[j]-a[j])/d,sa=n?(a[j]-prev[j])/(a[0]-prev[0]):0;
      const sb=n+2<table.length?(next[j]-b[j])/(next[0]-b[0]):0;
      const v0=(s*sa>0?2*s*sa/(s+sa):0)*d,v1=(s*sb>0?2*s*sb/(s+sb):0)*d;
      out[j-1]=a[j]*(2*f3-3*f2+1)+b[j]*(-2*f3+3*f2)+v0*(f3-2*f2+f)+v1*(f3-f2);
    }
  };
  const v0=V(),v1=V(),v2=V(),target=V(),pole=V(),line=V(),bend=V(),side=V(),axis=V(),hinge=V(),base=V(),candidate=V(),wp=V(),pp=V(),qp=Q(),qr=Q(),ori=Q();
  const basis=new T.Matrix4(),inv=new T.Matrix4(),normalToLocal=new T.Matrix3(),angles=new T.Euler();
  const gx=V(),gy=V(),gz=V(),patch=V(),worldGoal=V(),wristGoal=V(),root=V(),table=[0,0,0],footTable=[0,0,0],previous=[Q(),Q(),Q()];
  const kneepoint=V();
  const glX=new T.Vector3(0,0,1),glUp=new T.Vector3(0,1,0);
  const theta=Array.from({length:24},(_,i)=>[Math.cos(i*Math.PI/12),Math.sin(i*Math.PI/12)]);
  const scores=new Float32Array(24);
  function soleProfile(boot){
    // Convex outline of the original boot, including the protruding lugs.
    // The linear support in either direction lies on this outline.
    const ys=new Map();
    for(const mesh of boot.children){
      if(!mesh.geometry)continue;
      mesh.updateMatrix();
      const a=mesh.geometry.attributes.position;
      for(let i=0;i<a.count;i++){
        v0.fromBufferAttribute(a,i).applyMatrix4(mesh.matrix);
        const y=Math.round(v0.y*1e5)/1e5,z=v0.z;
        const r=ys.get(y);
        if(!r)ys.set(y,[z,z]);else{r[0]=Math.min(r[0],z);r[1]=Math.max(r[1],z);}
      }
    }
    const points=[];ys.forEach(([lo,hi],y)=>{points.push([y,lo]);if(lo!==hi)points.push([y,hi]);});
    points.sort((a,b)=>a[0]-b[0]||a[1]-b[1]);
    const hull=points=>{
      const h=[];
      for(const p of points){
        while(h.length>=2){const a=h[h.length-2],b=h[h.length-1];
          if((b[0]-a[0])*(p[1]-b[1])-(b[1]-a[1])*(p[0]-b[0])>0)break;h.pop();}
        h.push(p);
      }
      h.pop();return h;
    };
    return hull(points).concat(hull(points.reverse()));
  }
  function init(rig,z) {
    const b=rig.bones;
    return rig.copingPose={start:z,lastZ:z,dir:1,age:0,still:0,phase:'hang',soles:[0,1].map(i=>soleProfile(b['boot'+i])),
      glove:[0,1].map(i=>b['wrist'+i].children.find(m=>m.name==='workGlove')),
      hands:[V(),V()],feet:[V(),V()],release:[1,1],purchase:[0,0],
      armPoles:[V(),V()],legPoles:[V(),V()],weight:[1,1],footPlants:[0,0],locked:[0,0],step:[{},{}]};
  }
  // Local(normal)=transpose(world transform)*world normal. This matters on
  // Shen's narrower shoulders: using a rotation alone tilts the loaded palm.
  function frame(parent,x,z) {
    inv.copy(parent.matrixWorld).invert();
    normalToLocal.setFromMatrix4(parent.matrixWorld).transpose();
    gz.copy(z).applyMatrix3(normalToLocal).normalize();
    gx.copy(x).transformDirection(inv);gx.addScaledVector(gz,-gx.dot(gz)).normalize();
    gy.crossVectors(gz,gx).normalize();return ori.setFromRotationMatrix(basis.makeBasis(gx,gy,gz));
  }
  function corner(point,x,y){
    const a=point.x-x,b=point.y-y;
    return (a<0&&b<0)?Math.max(a,b):Math.hypot(Math.max(0,a),Math.max(0,b));
  }
  function solve(parent,upper,mid,end,goal,poleDir,orientation,last,edge,top,arm,weight,knee=null,kneeWeight=0){
    const l1=mid.position.length(),l2=end.position.length();
    line.copy(goal).sub(upper.position);
    const dist=clamp(line.length(),Math.abs(l1-l2)+.0001,l1+l2-.00009);
    line.normalize();bend.copy(poleDir).addScaledVector(line,-line.dot(poleDir));
    if(bend.lengthSq()<.00001)bend.set(1,0,0).addScaledVector(line,-line.x);
    bend.normalize();side.crossVectors(line,bend).normalize();
    const a=(l1*l1-l2*l2+dist*dist)/(2*dist),radius=Math.sqrt(Math.max(0,l1*l1-a*a));
    base.copy(upper.position).addScaledVector(line,a);
    let best=-Infinity,bi=0;
    for(let i=0;i<24;i++){
      axis.copy(bend).multiplyScalar(theta[i][0]).addScaledVector(side,theta[i][1]);
      candidate.copy(base).addScaledVector(axis,radius);
      let score=.73*theta[i][0]+(arm?.16:2.5)*last.dot(axis);
      wp.copy(candidate).applyMatrix4(parent.matrixWorld);
      score-=Math.max(0,(arm?.068:knee?.080:.094)-corner(wp,edge,top))**2*2400;
      if(knee){const dx=wp.x-knee.x,dy=wp.y-knee.y,dz=wp.z-knee.z;
        score-=kneeWeight*(dx*dx+dy*dy+.83*dz*dz);
        score-=2600*Math.max(0,.058-Math.sign(upper.position.x)*candidate.x)**2;
      }
      wp.copy(candidate).lerp(goal,.49).applyMatrix4(parent.matrixWorld);
      score-=Math.max(0,(arm?.044:.053)-corner(wp,edge,top))**2*1700;
      wp.copy(candidate).lerp(upper.position,.48).applyMatrix4(parent.matrixWorld);
      score-=Math.max(0,(arm?.070:.092)-corner(wp,edge,top))**2*1500;
      scores[i]=score;if(score>best){best=score;bi=i;}
    }
    const lo=scores[(bi+23)%24],hi=scores[(bi+1)%24];
    const fractional=clamp((lo-hi)/(2*(lo-2*best+hi)||1),-.5,.5);
    const rad=(bi+fractional)*Math.PI/12;
    last.copy(bend).multiplyScalar(Math.cos(rad)).addScaledVector(side,Math.sin(rad));
    hinge.copy(line).multiplyScalar(a).addScaledVector(last,radius);
    if(weight<1){previous[0].copy(upper.quaternion);previous[1].copy(mid.quaternion);previous[2].copy(end.quaternion);}
    upper.quaternion.setFromUnitVectors(v0.copy(mid.position).normalize(),v1.copy(hinge).normalize());
    v1.copy(line).multiplyScalar(dist).sub(hinge).normalize().applyQuaternion(qp.copy(upper.quaternion).invert());
    mid.quaternion.setFromUnitVectors(v0.copy(end.position).normalize(),v1);
    end.quaternion.copy(qp.copy(upper.quaternion).multiply(mid.quaternion).invert()).multiply(orientation);
    if(weight<1){
      upper.quaternion.slerp(previous[0],1-weight);mid.quaternion.slerp(previous[1],1-weight);end.quaternion.slerp(previous[2],1-weight);
    }
  }
  // A hand remains at precisely its current stone purchase while the other
  // traverses. A partially lifted hand can reverse onto the same purchase.
  function placeHands(rec,z,up){
    const stride=.37,advance=(z-rec.start)/stride;
    for(let i=0;i<2;i++){
      const phase=i?.50:0,off=i?-.205:.205;
      const u=advance+phase,k=Math.floor(u),f=u-k;
      const h=ramp(.055,.445,f),initial=ramp(.055,.445,phase);
      const shift=stride*(k+h-initial),lift=.051*Math.sin(Math.PI*h)*(1-ramp(.04,.20,rec.still));
      if(!up){
        rec.purchase[i]=rec.start+off+shift;
        rec.step[i].x=lift*.38;rec.step[i].y=lift;rec.weight[i]=1-7*lift;
      }
    }
  }
  function gloveGoal(rec,i,p,up,edge,top,z,bodyScale){
    const s=rec.step[i],q=up?1-ramp(0,.19,p):1;
    const shod=ramp(10.31,10.44,rec.purchase[i]);
    // Along the iron-backed run only a shallow lift fits under the shoe.
    // Retract the knuckles outwards, clear of its rolled underside.
    worldGoal.set(edge-.046+((s.x||0)+(s.y||0)*shod*.62)*q,top+.001+(s.y||0)*(1-.69*shod)*q,rec.purchase[i]);
    if(up){
      // Underhand support becomes palm pressure; first hand leaves after the
      // leading boot rolls over the corner. Last palm pushes the chest clear.
      const release=ramp(i?.765:.62,i?.92:.80,p);
      if(i){
        // The shoreward hand takes a fresh purchase farther onto the flat
        // while the seaward palm remains loaded. That hand is now the pivot.
        const fresh=ramp(.32,.53,p);
        worldGoal.x-=.201*fresh*(1-shod);
        worldGoal.y+=.047*Math.sin(Math.PI*fresh)*(1-shod);
      }
      rec.release[i]=1-release;
    }else{rec.release[i]=1;}
    rec.hands[i].copy(worldGoal);
    const g=rec.glove[i];if(g){g.morphTargetInfluences[0]=0;g.morphTargetInfluences[1]=rec.release[i]*(up?1:rec.weight[i]);}
    patch.set(0,-.075,-.0464);
  }
  function apply(actor,motion,dt){
    const rig=actor?.userData?.rig;if(!rig)return;
    const l=motion?.ledge,b=rig.bones;let rec=rig.copingPose;
    if(!l||(l.phase!=='hang'&&l.phase!=='up')){
      if(rec){if(!motion?.wall&&!motion?.pointAt)for(const g of rec.glove)if(g)g.morphTargetInfluences[1]=0;delete rig.copingPose;}return;
    }
    actor.updateWorldMatrix(true,false);root.setFromMatrixPosition(actor.matrixWorld);
    const edge=l.edgeX,top=l.topY,z=Number.isFinite(l.z)?l.z:root.z,up=l.phase==='up';
    if(!rec||(rec.phase==='up'&&!up)||Math.abs(rec.lastZ-z)>1.65)rec=init(rig,z);
    const p=up?clamp(l.progress||0):0, d=z-rec.lastZ;if(Math.abs(d)>.00006)rec.dir=Math.sign(d);
    rec.still=Math.abs(d)>.00006?0:rec.still+Math.max(0,dt||0);
    if(!up||rec.phase==='hang')placeHands(rec,z,false);
    rec.age+=Math.max(0,dt||0);rec.lastZ=z;rec.phase=l.phase;
    timeCurve(torso,p,table);
    const catchDrop=up?0:clamp(root.y-(top-1.70),-.05,.57);
    // Feet swing with the body on catching, while the knuckles stay fixed.
    // Only part of the catch momentum reaches the shoulder girdle.
    const hipX=table[0]+catchDrop*.11,hipY=table[1]+catchDrop*.78;
    const scale=actor.getWorldScale(v0).y;
    const settle=ramp(.83,1,p);
    v0.set(edge+hipX,top+hipY+(scale*.891-.935)*settle,z);
    actor.worldToLocal(v0);b.hips.position.copy(v0);b.hips.rotation.set(0,0,0);
    b.chest.position.set(0,.087,0);
    const unweight=up?0:rec.step[1].y-rec.step[0].y;
    b.chest.rotation.set(table[2]-.11*catchDrop,.050*Math.sin(p*Math.PI*2)+unweight*1.04,-.045*Math.sin(Math.PI*p));
    b.head.rotation.set(-.13-.53*table[2]-.08*Math.sin(p*Math.PI*2),up?.11*Math.sin(Math.PI*p):.14*rec.dir,0);
    b.hips.updateWorldMatrix(true,true);
    // Pick up slack from either shoulder without stretching the arm. A pulley
    // over one hand would float the opposite; solve both load limits together.
    for(let pass=0;pass<2;pass++){
      for(let i=0;i<2;i++){
        gloveGoal(rec,i,p,up,edge,top,z,scale);if(rec.release[i]<.0001)continue;
        frame(b.chest,glX,glUp);
        target.copy(worldGoal);b.chest.worldToLocal(target);target.sub(patch.applyQuaternion(ori));
        const sh=b['arm'+i];
        v1.copy(target).sub(sh.position);const length=v1.length(),limit=.428;
        if(length<limit)continue;
        v2.copy(sh.position).addScaledVector(v1,(length-limit)/length);
        b.chest.localToWorld(v2);b.chest.localToWorld(v1.copy(sh.position));
        actor.worldToLocal(v2);actor.worldToLocal(v1);
        b.hips.position.addScaledVector(v2.sub(v1),ramp(.16,1,rec.release[i]));b.hips.updateWorldMatrix(true,true);
      }
    }
    for(let i=0;i<2;i++){
      const sign=i?1:-1;
      gloveGoal(rec,i,p,up,edge,top,z,scale);
      const w=rec.release[i];
      // Retired hands fold against the ribcage, then settle to ordinary walk.
      const arm=b['arm'+i],mid=b['forearm'+i],hand=b['wrist'+i];
      const folded=Math.sin(p*Math.PI);
      arm.rotation.set(.055+.84*folded,sign*.08*folded,sign*(.085+.17*folded));
      mid.rotation.set(.148+.85*folded,0,0);hand.rotation.set(0,0,0);
      if(w>.00001||p<.945){
        frame(b.chest,glX,glUp);
        if(w<1){
          // Lift fingers off before swinging them back. Blending hinge angles
          // directly would sweep the knuckles through the top of the stone.
          arm.updateWorldMatrix(true,true);
          const recovery=hand.localToWorld(wristGoal.copy(patch));
          recovery.y=Math.max(recovery.y,top+.105);
          worldGoal.lerp(recovery,1-w);worldGoal.y+=.156*Math.sin((1-w)*Math.PI);
          qp.copy(arm.quaternion).multiply(mid.quaternion).multiply(hand.quaternion);
          ori.slerp(qp,1-w);
        }
        target.copy(worldGoal);b.chest.worldToLocal(target);target.sub(patch.applyQuaternion(ori));
        pole.set(sign*(.83-.20*p),-.66-.23*p,.63-.16*p);
        solve(b.chest,arm,mid,hand,target,pole,ori,rec.armPoles[i],edge,top,true,1);
      }
      timeCurve(i===0?lead:trail,p,footTable);
      const leave=i===0?.60:.78,land=i===0?.765:1;
      const wall=1-ramp(leave-.045,leave+.025,p),landed=ramp(land-.030,land,p);
      const tilt=footTable[2],cs=Math.cos(tilt),sn=Math.sin(tilt);
      // Real boot rubber has an elliptical toe and a lower tread. Evaluate
      // both supports, so the tip touching a vertical face is the actual toe.
      let toe=Infinity,heel=Infinity;
      for(const [y,z] of rec.soles[i]){toe=Math.min(toe,y*sn+z*cs);heel=Math.min(heel,y*cs-z*sn);}
      const hardY=-heel*scale+.0008,wallX=-toe*scale+.0008;
      let ax=mix(footTable[0],wallX,wall),ay=footTable[1]+catchDrop*.88;
      if(i===1)ax+=.006*Math.sin(Math.PI*ramp(.755,.834,p));
      ay=mix(ay,hardY,landed);
      if(!i&&p>.67&&p<.765)ay=Math.max(ay,hardY+.033*(1-ramp(.69,.765,p)));
      // Recovery foot finishes beneath the hips before ordinary gait resumes.
      // Move the centre of pressure back from the edge under the planted foot.
      const room=i?0:.245*ramp(.51,.635,p)*(1-ramp(.674,.765,p));
      const footZ=z+room+(i?-1:1)*mix(.133,.099,ramp(.64,.95,p))+(rec.purchase[1-i]-z+(i?-.205:.205))*.48*(1-ramp(.30,.7,p));
      rec.feet[i].set(edge+ax,top+ay,footZ);rec.footPlants[i]=wall||landed;
      const localX=v1.set(0,0,-1),localZ=v2.set(cs,-sn,0);
      frame(b.hips,localX,localZ);target.copy(rec.feet[i]);b.hips.worldToLocal(target);
      const swingKnee=i===0?ramp(.37,.68,p)*(1-ramp(.83,.98,p)):ramp(.66,.87,p)*(1-ramp(.94,1,p));
      pole.set(sign*(.37-.24*ramp(.62,1,p)),.15+2.85*swingKnee,-1.0+.65*swingKnee);
      let precision=0;
      if(i===0){
        timeCurve(kneePath,p,footTable);
        kneepoint.set(edge+footTable[0],top+footTable[1]+catchDrop*.80+(rig.id?0:.005)*ramp(.50,.55,p)*(1-ramp(.575,.60,p)),z+footTable[2]);
        const drape=ramp(.425,.525,p)*(1-ramp(.636,.702,p));
        if(drape>0){
          // Knee goes over before the boot. Intersect the actual thigh sphere
          // with the desired vertical section of the stone, then solve the
          // height of the ankle down the neighbouring face. This avoids the
          // unstable fold when an ankle travels through its own hip.
          const thigh=b.thigh0,shin=b.shin0,boot=b.boot0;
          b.hips.worldToLocal(kneepoint);
          let sy=kneepoint.y-thigh.position.y,sz=kneepoint.z-thigh.position.z;
          const rr=shin.position.length(),m=Math.min(1,rr*.98/(Math.hypot(sy,sz)||1));
          sy*=m;sz*=m;
          kneepoint.set(thigh.position.x-Math.sqrt(Math.max(0,rr*rr-sy*sy-sz*sz)),thigh.position.y+sy,thigh.position.z+sz);
          const rx=target.x-kneepoint.x,rz=target.z-kneepoint.z;
          const ankleY=kneepoint.y-Math.sqrt(Math.max(.00001,boot.position.lengthSq()-rx*rx-rz*rz));
          target.y=mix(target.y,ankleY,drape);
          b.hips.localToWorld(rec.feet[i].copy(target));
          if(p>.605){
            let clearY=-Infinity;
            for(const [y,z] of rec.soles[i]){
              const dx=(y*sn+z*cs)*scale,dy=(y*cs-z*sn)*scale;
              if(rec.feet[i].x+dx<edge+.012)clearY=Math.max(clearY,top-dy+.019);
            }
            rec.feet[i].y=Math.max(rec.feet[i].y,clearY);b.hips.worldToLocal(target.copy(rec.feet[i]));
          }b.hips.localToWorld(kneepoint);
        }
        precision=45+1350*drape;
      }else{
        // Keep the trailing knee on its own side, even when the hip passes
        // through the axis of the folded leg and a free pole is ambiguous.
        v0.copy(b['thigh'+i].position);b.hips.localToWorld(v0);
        kneepoint.copy(v0).lerp(rec.feet[i],.48);
        kneepoint.x-=.115;kneepoint.z=z-.243;
        if(p>.70)kneepoint.y+=.207*Math.sin(Math.PI*ramp(.70,1,p));
        precision=16;
      }
      solve(b.hips,b['thigh'+i],b['shin'+i],b['boot'+i],target,pole,ori,rec.legPoles[i],edge,top,false,1,kneepoint,precision);
    }
  }
  return {apply};
})();
