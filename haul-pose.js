// Fall arrest below the fog-room service wheels. Called once after TideActors.animate.
// The harness, rung and feet are evaluated in the same world frame as the moving shoe.
const TideHaulPose=(()=>{
  const T=THREE,V=()=>new T.Vector3(),Q=()=>new T.Quaternion();
  const up=new T.Vector3(0,1,0),glove=new T.Vector3(0,-.062,-.012);
  const sole=new T.Vector3(0,-.055,-.043),toe=new T.Vector3(0,-.036,-.135);
  const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
  const smooth=(a,b,x)=>{const k=clamp((x-a)/(b-a));return k*k*(3-2*k);};
  const mix=(a,b,x)=>a+(b-a)*x;
  const records=new WeakMap(),parts=['hips','chest','head','arm0','forearm0','wrist0','arm1','forearm1','wrist1','thigh0','shin0','boot0','thigh1','shin1','boot1'];
  const tang=V(),out=V(),shoeAt=V(),bar=V(),wanted=V(),loose=V(),via=V(),line=V(),rail=V();
  const offset=V(),goal=V(),direction=V(),pole=V(),joint=V(),lower=V(),rest=V(),scratch=V();
  const localEuler=new T.Euler(),desired=Q(),upperQ=Q(),lowerQ=Q(),endQ=Q(),parentQ=Q(),orient=Q(),ringQ=Q(),deckQ=Q(),ropeQ=Q(),tmpQ=Q();
  const lastHip=V(),lastChest=V(),worldScale=V();
  function footPoint(dst,radial,x,height){
    return dst.copy(shoeAt).addScaledVector(out,radial).addScaledVector(tang,x).addScaledVector(up,height);
  }
  function rotation(dst,yaw,pitch,roll=0){
    return dst.setFromEuler(localEuler.set(pitch,yaw,roll,'YXZ'));
  }
  function tilt(bone,pitch,yaw,roll,amount){
    desired.setFromEuler(localEuler.set(pitch,yaw,roll,'XYZ'));bone.quaternion.slerp(desired,amount);
  }
  function curl(wrist,tight){
    // The existing morph curls three fingers around a bar and leaves the index free to feel its edge.
    for(const m of wrist.children)if(m.morphTargetInfluences)m.morphTargetInfluences[0]=tight;
  }
  function chain(parent,upper,mid,tip,worldPoint,worldEnd,contact,poleX,poleY,poleZ,weight,scale,extension=.995){
    // Subtract the actual oriented palm/boot contact patch before solving for the wrist/ankle.
    // This prevents a sleeve cuff from being used as a substitute for the palm on the metal.
    goal.copy(worldPoint).sub(offset.copy(contact).multiplyScalar(scale).applyQuaternion(worldEnd));
    parent.worldToLocal(goal);goal.sub(upper.position);
    const l1=mid.position.length(),l2=tip.position.length(),requested=goal.length();
    if(requested<1e-5||weight<1e-5)return Infinity;
    const d=clamp(requested,Math.abs(l1-l2)+.023,(l1+l2)*extension);
    direction.copy(goal).multiplyScalar(1/requested);
    pole.set(poleX,poleY,poleZ);pole.addScaledVector(direction,-pole.dot(direction));
    if(pole.lengthSq()<.00002){pole.set(.1,-1,0);pole.addScaledVector(direction,-pole.dot(direction));}
    pole.normalize();
    const along=(l1*l1+d*d-l2*l2)/(2*d),lift=Math.sqrt(Math.max(.000001,l1*l1-along*along));
    joint.copy(direction).multiplyScalar(along).addScaledVector(pole,lift);
    upperQ.setFromUnitVectors(rest.copy(mid.position).normalize(),scratch.copy(joint).normalize());
    lower.copy(direction).multiplyScalar(d).sub(joint).normalize().applyQuaternion(tmpQ.copy(upperQ).invert());
    lowerQ.setFromUnitVectors(rest.copy(tip.position).normalize(),lower);
    upper.quaternion.slerp(upperQ,weight);mid.quaternion.slerp(lowerQ,weight);
    mid.getWorldQuaternion(parentQ);endQ.copy(parentQ).invert().multiply(worldEnd);
    tip.quaternion.slerp(endQ,weight);
    return Math.abs(requested-d)*scale;
  }
  function capture(rec,b){
    for(let j=0;j<parts.length;j++)rec.pose[j].copy(b[parts[j]].quaternion);
    rec.hips.copy(b.hips.position);rec.chest.copy(b.chest.position);
  }
  function release(actor,b,rec,dt){
    if(!rec)return;
    rec.tail+=dt;
    const k=1-smooth(0,.15,rec.tail);
    const point=actor.userData.rig.pointing;
    const base=i=>point?.side===i?point.weight:0;
    if(k<=0){curl(b.wrist0,base(0));curl(b.wrist1,base(1));records.delete(actor);return;}
    for(let j=0;j<parts.length;j++)b[parts[j]].quaternion.slerp(rec.pose[j],k);
    b.hips.position.lerp(rec.hips,k);b.chest.position.lerp(rec.chest,k);
    for(let i=0;i<2;i++)curl(b['wrist'+i],mix(base(i),rec.grip[i],k));
  }
  function apply(actor,g,dt,t,gear){
    const rig=actor?.userData?.rig,b=rig?.bones;
    if(!b||rig.id!==0)return;
    const h=g?.fog?.haul,world=g?.world?.foghouse,f=world?.wheels?.[h?.wheel],seconds=clamp(Number.isFinite(dt)?dt:0,0,.1);
    let rec=records.get(actor);
    if(!h||!f){release(actor,b,rec,seconds);return;}
    const age=Math.max(0,h.age||0),elapsed=Math.max(0,h.elapsed||0),p=h.phase==='climb'?clamp(h.pull||0):0;
    const catchFall=h.phase==='catch',waiting=h.phase==='wait',climbing=h.phase==='climb',rewind=h.phase==='rewind';
    if(!rec||rec.tail>0||elapsed<rec.elapsed-.06){
      rec={pose:parts.map(()=>Q()),hips:V(),chest:V(),tail:0,reach:0,effort:0,grip:[0,0],elapsed};
      records.set(actor,rec);
    }
    rec.elapsed=elapsed;
    const ease=1-Math.exp(-13*seconds),swing=clamp(h.effort||0,-1,1);
    rec.reach=mix(rec.reach,climbing||waiting&&h.reaching?1:0,ease);
    rec.effort=mix(rec.effort,swing,ease);
    const effort=rec.effort,reaching=rec.reach,blend=catchFall?smooth(.012,.16,age):1;
    const land=smooth(.70,.998,p),push=smooth(.28,.63,p)*(1-smooth(.69,.98,p));
    const jerk=catchFall?Math.exp(-2.25*age)*Math.sin(Math.PI*Math.min(1.62,age/.25)):0;
    const breath=Math.sin((Number.isFinite(t)?t:elapsed)*2.45+.32),balance=Math.sin(elapsed*3.4)*Math.exp(-elapsed*1.12);
    const a=f.angle;
    tang.set(Math.cos(a),0,-Math.sin(a));out.set(Math.sin(a),0,Math.cos(a));shoeAt.set(f.x,f.y,f.z);
    bar.copy(shoeAt).addScaledVector(out,.55).addScaledVector(up,-.32);
    actor.getWorldScale(worldScale);const scale=worldScale.y;
    const facing=actor.getWorldDirection(scratch),yaw=Math.atan2(facing.x,facing.z);
    goal.copy(bar);actor.worldToLocal(goal);
    const turn=clamp(Math.atan2(-goal.x,Math.max(.24,-goal.z)),-.74,.74)*(1-land);
    const post=rewind?.48:1;
    // The suspension point carries the upper torso. A dropped pelvis and a small
    // counter-rotation at the waist keep the load out of a single elbow.
    lastHip.copy(b.hips.position);lastChest.copy(b.chest.position);
    b.hips.position.set(.023*effort*(1-land),mix(.834,.885,land)-push*.236-.054*jerk,
      (.057+jerk*.031)*(1-land)+push*.079).lerp(lastHip,1-blend);
    b.chest.position.set(0,.087+.0037*breath,0).lerp(lastChest,1-blend);
    tilt(b.hips,.072*(1-land)-push*.16,turn*.69,-effort*.087*(1-land)+.048*jerk,blend);
    tilt(b.chest,(.055-.19*reaching-.081*jerk)*(1-land)-push*.52,turn*.33-(.054+.072*reaching)*(1-land),
      (.034+.052*effort+.041*balance)*(1-land),blend);
    // Aim the face from the actual head socket. Positive X rotation raises a face looking towards -Z.
    b.head.getWorldPosition(scratch);
    goal.copy(bar).addScaledVector(up,climbing?.26:0);b.chest.worldToLocal(goal);b.chest.worldToLocal(scratch);goal.sub(scratch);
    const headYaw=clamp(Math.atan2(-goal.x,Math.max(.17,-goal.z)),-.77,.77),headPitch=clamp(Math.atan2(goal.y,Math.hypot(goal.x,goal.z)),-.54,.61);
    tilt(b.head,headPitch*(1-land)-.12*land,headYaw*(1-land),-.048*effort*(1-land),blend);
    // The right hand steadies the live line above the actual dorsal harness fitting.
    if(gear?.linePoint){gear.linePoint(.237,line);}
    else{
      line.set(.117,.445,.127);b.chest.localToWorld(line);
      const baseZ=world.rear.z-4.80;
      rail.set(world.rear.x-1.736,world.rear.y+3.192,clamp(line.z,baseZ-6.57,baseZ+4.87));
      line.addScaledVector(scratch.copy(rail).sub(line).normalize(),.237);
    }
    rotation(ropeQ,yaw,.83,-.64);
    const shoulderHeight=b.arm0.getWorldPosition(scratch).y;
    const transfer=climbing?Math.max(smooth(.13,.50,p),smooth(.23,.48,shoulderHeight-bar.y)):0;
    const releaseHand=climbing?smooth(.66,.96,p):0;
    for(let i=0;i<2;i++){
      const sign=i?1:-1;
      // The palm initially draws up against the underside of the transverse bar.
      // It then moves through the clear outboard side onto the tread above it.
      ringQ.copy(rotation(orient,a,1.70+.11*i,sign*.10));
      deckQ.copy(rotation(orient,a,-1.42,sign*.12)).multiply(tmpQ.setFromAxisAngle(up,Math.PI));
      const swap=climbing?clamp(transfer-(i?.19:0)):0;
      const edgeAngle=smooth(0,1,swap),u=sign*(i?.205:.193);
      wanted.copy(bar).addScaledVector(tang,u).addScaledVector(out,.007).addScaledVector(up,-.017);
      if(swap>0){
        via.copy(shoeAt).addScaledVector(tang,u+sign*.041).addScaledVector(out,.439).addScaledVector(up,.015);
        wanted.lerp(via,edgeAngle).addScaledVector(out,.154*Math.sin(edgeAngle*Math.PI));
        ringQ.slerp(deckQ,edgeAngle);
      }
      if(releaseHand>0){
        via.set(sign*(.219+.030*i),.126+.044*i,-.250);b.chest.localToWorld(via);
        wanted.lerp(via,releaseHand);ringQ.slerp(rotation(orient,yaw,.65,sign*.16),releaseHand);
      }
      if(i){
        const onto=climbing?smooth(.015,.145,p):0;
        wanted.lerp(line,1-onto);ringQ.slerp(ropeQ,1-onto);
      }else{
        // Waiters can try the rung at any distance. A miss remains a miss;
        // the world-space solver never extends the sleeve past its sewn length.
        loose.set(-.245,.252+.039*breath,-.226-.057*post);b.chest.localToWorld(loose);
        const tryHand=climbing?1:waiting?reaching:0;
        wanted.lerp(loose,1-tryHand);ringQ.slerp(rotation(orient,yaw,.83,-.20),1-tryHand);
      }
      const miss=chain(b.chest,b['arm'+i],b['forearm'+i],b['wrist'+i],wanted,ringQ,glove,sign*.85,-.39,.61,blend,scale,.994);
      const hold=(i?climbing?.66:.73:climbing?.71:.74*reaching)*(1-smooth(.014,.064,miss))*(1-releaseHand);
      rec.grip[i]=hold*blend;curl(b['wrist'+i],rec.grip[i]);
    }
    const stand=climbing?smooth(.82,1,p):0;
    for(let i=0;i<2;i++){
      const sign=i?1:-1;
      const legSwing=(.055*balance+effort*.057)*sign*(1-stand);
      // Loose soles stay well outside the toothed ring. The leading knee is
      // tucked toward the lip while the other boot counterbalances the fall.
      loose.set(sign*(.123+.020*jerk)+effort*.037,.134+(i?.015:.109)+.062*jerk+sign*.029*balance,
        .079+(i?.058:-.04)+legSwing);
      actor.localToWorld(loose);wanted.copy(loose);offset.copy(sole);
      let pitch=-.30-.071*i+.071*effort;
      if(climbing){
        if(i===0){
          const lift=smooth(.16,.485,p),over=smooth(.565,.88,p);
          footPoint(via,.566,-.146,-.302);
          wanted.lerp(via,lift);footPoint(via,.13,-.141,.002);
          // Clear the upper lip with the toe before drawing the ankle in.
          wanted.lerp(via,over).addScaledVector(out,.267*Math.sin(over*Math.PI)).addScaledVector(up,.218*Math.sin(over*Math.PI));
          offset.lerp(toe,lift*(1-over));pitch=mix(mix(pitch,.17,lift),.005,over);
        }else{
          const high=smooth(.28,.62,p),inboard=smooth(.61,.90,p);
          footPoint(via,.73,.132,.102);wanted.lerp(via,high);
          footPoint(via,.28,.133,.002);wanted.lerp(via,inboard);
          pitch=mix(mix(pitch,.205,high),.002,inboard);
        }
        // End at both boots of the physical actor, wherever the moving tread
        // has carried him. The landing point is never a stale world coordinate.
        via.set(sign*.105,.002,i?.010:-.035);actor.localToWorld(via);via.y=f.y+.0015;
        wanted.lerp(via,stand);pitch=mix(pitch,0,stand);
      }
      ringQ.copy(rotation(orient,climbing?a:yaw,pitch,sign*.045*(1-stand)));
      // Save the contact offset separately since chain uses its own scratch.
      const patch=via.copy(offset),thigh=b['thigh'+i],knee=b['shin'+i],boot=b['boot'+i];
      // A foot never pulls up to the hip socket. The knees flare out while
      // the patellae clear the steel nosing, then come forward over the tread.
      let flare=0;
      if(climbing){
        const hipY=thigh.getWorldPosition(scratch).y;
        wanted.y=Math.min(wanted.y,hipY-.284);
        flare=smooth(.055,.27,p)*(1-smooth(.69,.86,p));
      }
      chain(b.hips,thigh,knee,boot,wanted,ringQ,patch,sign*(.22+flare*1.04),.03,mix(-1,.08,flare),blend,scale,.998);
    }
    capture(rec,b);
  }
  return {apply};
})();
