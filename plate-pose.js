// Layered over the seated launch animation. All joints below the waist retain the helm pose.
const TidePlatePose=(()=>{
  const T=THREE,V=()=>new T.Vector3(),Q=()=>new T.Quaternion();
  const m=new T.Matrix4(),basis=new T.Matrix4(),normalMat=new T.Matrix3(),transpose=new T.Matrix3();
  const x=V(),y=V(),z=V(),aim=V(),goal=V(),delta=V(),elbow=V(),pole=V(),v=V(),u=V(),rest=V();
  const aQ=Q(),fQ=Q(),wQ=Q(),baseQ=Q(),helper=Q();
  const touch=V(),normal=V(),along=V(),across=V(),finger=V(),tilted=V(),wristY=V();
  const palm=new T.Vector3(0,-.055,-.005);
  const neutralPad=new T.Vector3(-.0086,-.1105,-.027),pressedPad=new T.Vector3(-.00946,-.1105,-.04628),patch=V();
  const clamp=(s,a=0,b=1)=>Math.max(a,Math.min(b,s));
  const ease=(s,a,b)=>{s=clamp((s-a)/(b-a));return s*s*(3-2*s);};
  const left={point:V(),y:V(),normal:V(),elbow:V()},right={point:V(),y:V(),normal:V(),elbow:V()};
  const resetting=new WeakSet();
  function surface(wrist,local,save,fore){
    wrist.updateWorldMatrix(true,false);
    save.point.copy(local).applyMatrix4(wrist.matrixWorld);
    save.y.set(0,1,0).transformDirection(wrist.matrixWorld);
    save.normal.set(0,0,1).applyMatrix3(normalMat.getNormalMatrix(wrist.matrixWorld)).normalize();
    fore.getWorldPosition(save.elbow);
  }
  function orient(dst,worldY,worldZ){
    // Normal and tangent use different transforms on the operator's narrower coat and pelvis.
    z.copy(worldZ).applyMatrix3(transpose).normalize();
    y.copy(worldY).transformDirection(m).addScaledVector(z,-y.dot(z)).normalize();
    x.crossVectors(y,z).normalize();y.crossVectors(z,x).normalize();
    return dst.setFromRotationMatrix(basis.makeBasis(x,y,z));
  }
  function solve(b,i,worldPoint,q,contact,elbowWorld,outer){
    const arm=b['arm'+i],fore=b['forearm'+i],wrist=b['wrist'+i];
    goal.copy(worldPoint).applyMatrix4(m).sub(arm.position).sub(v.copy(contact).applyQuaternion(q));
    const l1=fore.position.length(),l2=wrist.position.length(),distance=goal.length();
    if(distance<.0001)return;
    aim.copy(goal).multiplyScalar(1/distance);
    const d=clamp(distance,Math.abs(l1-l2)+.0001,l1+l2-.00004);
    // Carry the seated elbow bend through the reach. The right elbow arcs outboard to clear the wheel.
    pole.copy(elbowWorld).applyMatrix4(m).sub(arm.position);
    if(outer>0)pole.lerp(v.set(.49,-.74,.34).multiplyScalar(l1),outer);
    pole.addScaledVector(aim,-pole.dot(aim));
    if(pole.lengthSq()<1e-8){pole.set(i?1:-1,0,.4);pole.addScaledVector(aim,-pole.dot(aim));}
    const axial=(l1*l1-l2*l2+d*d)/(2*d);
    elbow.copy(aim).multiplyScalar(axial).addScaledVector(pole.normalize(),Math.sqrt(Math.max(0,l1*l1-axial*axial)));
    rest.copy(fore.position).applyQuaternion(arm.quaternion).normalize();
    aQ.setFromUnitVectors(rest,u.copy(elbow).normalize()).multiply(arm.quaternion);
    delta.copy(aim).multiplyScalar(d).sub(elbow).applyQuaternion(helper.copy(aQ).invert()).normalize();
    rest.copy(wrist.position).applyQuaternion(fore.quaternion).normalize();
    fQ.setFromUnitVectors(rest,delta).multiply(fore.quaternion);
    arm.quaternion.copy(aQ);fore.quaternion.copy(fQ);
    wrist.quaternion.copy(helper.copy(aQ).multiply(fQ).invert()).multiply(q);
  }
  function press(wrist,weight){
    for(const mesh of wrist.children)if(mesh.morphTargetInfluences)mesh.morphTargetInfluences[1]=weight;
  }
  function apply(actor,g,dt,time,plate){
    const rig=actor?.userData?.rig,p=g?.arrival?.plate;
    if(!rig||rig.id!==1)return;
    const b=rig.bones,look=clamp(p?.look||0);
    if(!plate||!look||!rig.locomotion?.helm?.w){
      if(resetting.delete(actor))press(b.wrist1,0);
      return;
    }
    // The player can move the wiping track as soon as look passes .52.
    // Settle the pads just before that threshold, while the camera is still moving in.
    const lean=ease(look,0,.86),reach=ease(look,.024,.515),squash=ease(look,.28,.515);
    surface(b.wrist0,palm,left,b.forearm0);surface(b.wrist1,neutralPad,right,b.forearm1);
    plate.touch(touch);plate.normal(normal);plate.along(along);across.crossVectors(normal,along).normalize();
    b.chest.rotation.x-=.165*lean;b.chest.rotation.y-=.175*lean;b.chest.rotation.z-=.088*lean;
    b.chest.position.x+=.007*lean;b.chest.position.z-=.018*lean;
    b.chest.updateWorldMatrix(true,false);
    m.copy(b.chest.matrixWorld).invert();transpose.setFromMatrix4(b.chest.matrixWorld).transpose();
    orient(wQ,left.y,left.normal);solve(b,0,left.point,wQ,palm,left.elbow,0);
    // Lay the index and middle pads onto the engraving, with the cuff lifted slightly.
    // The 11 cm-long middle finger stays on the worn track as the boat pitches and rolls.
    const stroke=clamp(p.stroke??.5),pitch=.24;
    finger.copy(across).multiplyScalar(.88).addScaledVector(along,-.47+.13*(stroke-.5)).normalize();
    tilted.copy(normal).multiplyScalar(Math.cos(pitch)).addScaledVector(finger,Math.sin(pitch));
    wristY.copy(finger).multiplyScalar(-Math.cos(pitch)).addScaledVector(normal,Math.sin(pitch));
    orient(wQ,wristY,tilted);orient(baseQ,right.y,right.normal);wQ.slerp(baseQ,1-reach);
    patch.copy(neutralPad).lerp(pressedPad,squash);
    v.copy(right.point).lerp(touch,reach).addScaledVector(normal,.045*Math.sin(Math.PI*reach));
    solve(b,1,v,wQ,patch,right.elbow,reach*.86);
    press(b.wrist1,squash);resetting.add(actor);
    // The head tips after the shoulder starts moving; steering-side peripheral vision stays open.
    aim.copy(touch).applyMatrix4(m).sub(b.head.position);aim.y-=.145;aim.z+=.058;
    const nod=ease(look,.065,.96);
    b.head.rotation.x+=(clamp(Math.atan2(aim.y,Math.hypot(aim.x,aim.z)),-.79,.04)-b.head.rotation.x)*nod;
    b.head.rotation.y+=(clamp(Math.atan2(-aim.x,-aim.z),-.78,.38)-b.head.rotation.y)*nod;
    b.head.rotation.z-=.038*nod;
  }
  return {apply};
})();
