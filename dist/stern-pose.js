// Right-hand boat operator. All hand positions are calculated on the current ash shaft.
// The pin on shore and the heaving launch are already in the same world frame.
const TideSternPose=(()=>{
  const T=THREE,V=()=>new T.Vector3(),Q=()=>new T.Quaternion(),M=()=>new T.Matrix4();
  const records=new WeakMap(),clamp=(v,lo=0,hi=1)=>Math.max(lo,Math.min(hi,v));
  const smooth=(a,b,x)=>{const f=clamp((x-a)/(b-a));return f*f*(3-2*f);};
  const base=V(),tip=V(),pivot=V(),axis=V(),up=V(),across=V(),over=V(),goal=V(),raw=V(),bend=V(),line=V(),hinge=V();
  const v0=V(),v1=V(),v2=V(),v3=V(),fix=V(),dirX=V(),dirY=V(),dirZ=V(),pad=V(),sole=V();
  const handTargets=[V(),V()],footTargets=[V(),V()],baseHand=[V(),V()],baseFoot=[V(),V()];
  const palmFrame=[Q(),Q()],bootFrame=[Q(),Q()],armRot=Q(),foreRot=Q(),qc=Q(),qp=Q(),savedA=Q(),savedB=Q(),savedW=Q();
  const inv=M(),basis=M(),euler=new T.Euler();
  const cone=V(),poleAxis=V(),poleOrigin=V(),sideAxis=V(),candidate=V(),extreme=V(),wp=V(),start=V(),acc=V();
  const clearanceSamples=[.22,.51,.83,1.22,1.56,1.80],scoreTable=new Float32Array(24);
  const torsoTests=[['head',.134,-.021,.196],['chest',.295,-.021,.195],['arm1',0,0,.154],['arm0',0,0,.126],['chest',.147,-.021,.185]];
  const phi=Array.from({length:24},(_,i)=>[Math.cos(2*Math.PI*i/24),Math.sin(2*Math.PI*i/24)]);
  const gripPatch=new T.Vector3(0,-.090,-.044);
  const solePatch=new T.Vector3(0,-.059,-.044);
  function read(dst,p){return dst.set(p.x,p.y,p.z);}
  function deck(g,x,y,z,dst){return read(dst,TideArrival.deck(g,x,y,z));}
  function mixTurn(bone,x,y,z,w){bone.quaternion.slerp(qp.setFromEuler(euler.set(x,y,z,'YXZ')),w);}
  function chain(upper,mid,lower,point,pole,orientation,lastPole=null){
    // point and hand/sole orientation are wholly inside the parent joint's
    // coordinate system. Shen's nonuniform chest/hip width is handled upstream.
    line.copy(point).sub(upper.position);
    const l1=mid.position.length(),l2=lower.position.length(),dist=clamp(line.length(),Math.abs(l1-l2)+.0001,l1+l2-.00013);
    line.normalize();bend.copy(pole).addScaledVector(line,-pole.dot(line));
    if(bend.lengthSq()<1e-6)bend.set(0,-1,0).addScaledVector(line,line.y);
    bend.normalize();
    const a=(l1*l1-l2*l2+dist*dist)/(2*dist);
    const radius=Math.sqrt(Math.max(0,l1*l1-a*a));
    if(lastPole&&radius>.001){
      // Search the elbow circle without altering either sewn limb length. The
      // trailing sleeve must stay outside the wood even when the pole crosses
      // behind the bent arm. Prefer a low elbow and the ordinary elbow pole.
      cone.crossVectors(line,bend).normalize();let best=-1e20,choice=0;
      start.copy(line).multiplyScalar(a).add(upper.position);
      for(let n=0;n<phi.length;n++){
        const cs=phi[n][0],sn=phi[n][1];
        sideAxis.copy(bend).multiplyScalar(cs).addScaledVector(cone,sn);
        candidate.copy(start).addScaledVector(sideAxis,radius);
        let score=.20*cs-.87*sideAxis.y+.31*lastPole.dot(sideAxis);
        for(const t of clearanceSamples){
          if(t<=1)wp.copy(point).lerp(candidate,t);else wp.copy(candidate).lerp(upper.position,t-1);
          wp.sub(poleOrigin).addScaledVector(poleAxis,-wp.dot(poleAxis));
          const safe=t<.40?.064:t<.8?.079:.095;
          score-=1700*Math.max(0,safe-wp.length())**2;
        }
        scoreTable[n]=score;if(score>best){best=score;choice=n;}
      }
      const lo=scoreTable[(choice+23)%24],hi=scoreTable[(choice+1)%24];
      const frac=clamp((lo-hi)/(2*(lo-2*best+hi)||1),-.5,.5);
      const theta=(choice+frac)*Math.PI/12;
      extreme.copy(bend).multiplyScalar(Math.cos(theta)).addScaledVector(cone,Math.sin(theta));
      bend.copy(extreme);lastPole.copy(bend);
    }
    hinge.copy(line).multiplyScalar(a).addScaledVector(bend,radius);
    armRot.setFromUnitVectors(raw.copy(mid.position).normalize(),v0.copy(hinge).normalize());
    v0.copy(line).multiplyScalar(dist).sub(hinge).normalize().applyQuaternion(qc.copy(armRot).invert());
    foreRot.setFromUnitVectors(raw.copy(lower.position).normalize(),v0);
    upper.quaternion.copy(armRot);mid.quaternion.copy(foreRot);
    lower.quaternion.copy(qc.copy(armRot).multiply(foreRot).invert()).multiply(orientation);
  }
  function endFrame(b,worldX,worldY,out){
    // Two shaft axes represented in the parent's scaled space keep the chosen
    // point on the inside of the glove registered to the actual cylindrical surface.
    inv.copy(b.matrixWorld).invert();
    dirX.copy(worldX).transformDirection(inv);
    dirY.copy(worldY).transformDirection(inv);dirY.addScaledVector(dirX,-dirX.dot(dirY)).normalize();
    dirZ.crossVectors(dirX,dirY).normalize();
    return out.setFromRotationMatrix(basis.makeBasis(dirX,dirY,dirZ));
  }
  function rollIntoGrip(wrist,amount){
    for(const mesh of wrist.children)if(mesh.name==='workGlove'&&mesh.morphTargetInfluences)mesh.morphTargetInfluences[0]=amount;
  }
  function palms(b){
    b.chest.updateWorldMatrix(true,false);
    const localSide=v3.copy(axis).negate();
    
    for(let i=0;i<2;i++){
      const radial=i?.83:-.86;
      const prox=v1.copy(across).multiplyScalar(radial).addScaledVector(over,i?.557:.511).normalize();
      endFrame(b.chest,localSide,prox,palmFrame[i]);
    }
  }
  function shiftFoot(g,i,p,sample){
    const lag=i?.21:.53,k=smooth(lag,lag+.39,p),step=Math.sin(Math.PI*k);
    const restX=i?-4.52:-5.045;
    const x=restX+(i?.041:-.026)*k,z=(i?15.79:15.56)+(i?.033:.195)*k;
    // The port boot is on the slightly raised aft weather deck. The right
    // boot is on the teak below the coaming. Neither lands on the metal rib.
    const y=i?-2.72:-2.72+.098+.045*(-4.77-x)/.41;
    deck(g,x,y+.002+step*.042,z,sample);
  }
  function locate(g,geometry,out){
    const s=g.arrival.stern,draw=s.phase==='reach'?0:s.phase==='lower'?1:clamp(s.draw);
    const lower=s.phase==='lower'?s.lower:0;
    read(base,geometry.base);read(tip,geometry.tip);axis.subVectors(tip,base);
    const len=axis.length();if(len<.05)return -1;axis.divideScalar(len);
    if(geometry.pivot)read(pivot,geometry.pivot);else deck(g,-4.54,-1.64,15.37,pivot);
    const distance=clamp(v0.subVectors(pivot,base).dot(axis),.20,len-.20);
    for(let j=0;j<2;j++){
      const u=(distance/.47+(j?.53:0))%1;
      // A glove stays on one section of wood for each loaded half-stroke.
      // It slides forward while the opposite hand bears the eye.
      const pass=(smooth(.32,.94,u)-u)*.47*draw*(1-lower);
      const at=clamp(distance+(j?-.070:.155)+pass-(j?.027:.014)*lower,.064,len-.22);
      out[j].copy(base).addScaledVector(axis,at);
    }
    return distance;
  }
  function grips(g,geometry,out=handTargets){
    const s=g.arrival?.stern;
    return s&&s.travel>.75&&s.phase!=='fast'&&geometry?.base&&geometry?.tip&&locate(g,geometry,out)>=0?out:null;
  }
  function apply(actor,g,geometry,dt){
    if(!actor||actor.userData?.rig?.id!==1)return;
    const b=actor.userData.rig.bones,s=g.arrival?.stern;let rec=records.get(actor);
    const active=!!(s&&s.travel>.75&&s.phase!=='fast'&&!g.arrival.moored&&geometry?.base&&geometry?.tip);
    if(!active){
      if(rec){rollIntoGrip(b.wrist0,0);rollIntoGrip(b.wrist1,0);records.delete(actor);}
      return;
    }
    if(!rec){rec={advance:0,elbows:[V(),V()]};records.set(actor,rec);}
    const h=clamp(Number.isFinite(dt)?dt:0,0,.15);
    rec.advance=Math.min(1,rec.advance+6*h);
    const w=smooth(.75,.985,s.travel)*(s.travel===1?1:smooth(0,1,rec.advance));
    if(w<.0001)return;
    const draw=s.phase==='reach'?0:s.phase==='lower'?1:clamp(s.draw),lower=s.phase==='lower'?s.lower:0;
    const distance=locate(g,geometry,handTargets);if(distance<0)return;
    const axes=g.world.fenders.floatPose.axes;
    up.set(axes.nx,axes.ny,axes.nz).normalize();across.crossVectors(axis,up);
    if(across.lengthSq()<1e-6)return;
    across.normalize();over.crossVectors(across,axis).normalize();
    const locked=s.phase==='draw'&&s.use&&s.draw>.43&&s.slack<.31;
    for(let j=0;j<2;j++){
      b['wrist'+j].localToWorld(baseHand[j].copy(gripPatch));
      b['boot'+j].localToWorld(baseFoot[j].copy(solePatch));
      shiftFoot(g,j,draw,footTargets[j]);footTargets[j].lerp(baseFoot[j],1-w);
    }
    // Squat and lean in the direction of the actual stock, then come aft
    // under load. The gunwale/shaft moves under the hands as the hull rolls.
    const ay=actor.rotation.y,cs=Math.cos(ay),sn=Math.sin(ay);
    const localAx=cs*axis.x-sn*axis.z,localAz=sn*axis.x+cs*axis.z;
    const sight=clamp(Math.atan2(-localAx,-localAz),-1.42,1.45);
    const extension=s.phase==='reach'?s.reach:1-draw;
    const high=actor.worldToLocal(v0.copy(handTargets[0]).lerp(handTargets[1],.5)).y;
    const dip=clamp(1.16-high,-.10,.31);
    const hipY=.870-.053*extension-.026*(locked?1:0)-dip*.44+.021*draw;
    b.hips.position.lerp(v0.set(-.010-.026*extension,hipY,-.015-.023*extension+.078*draw),w);
    mixTurn(b.hips,-.015,.33*sight-.13,.015+.053*localAx,w);
    b.chest.position.lerp(v0.set(.020,.089,-.017),w);
    mixTurn(b.chest,-.255-.11*extension+.12*draw-(locked?.062:0),.47*sight-.19,.042-.12*localAx,w);
    // If one shoulder would otherwise lock straight, bring the torso nearer
    // in several centimetre-sized increments. No bone is ever lengthened.
    for(let pass=0;pass<15;pass++){
      palms(b);let max=.0003;
      for(let j=0;j<2;j++){
        const arm=b['arm'+j],fore=b['forearm'+j],wrist=b['wrist'+j];
        v0.copy(handTargets[j]);b.chest.worldToLocal(v0);
        v0.sub(v1.copy(gripPatch).applyQuaternion(palmFrame[j])).sub(arm.position);
        const L=v0.length(),excess=L-(fore.position.length()+wrist.position.length()-.011);
        if(excess>max){max=excess;fix.copy(v0).multiplyScalar(excess/L);}
      }
      let deepest=.00018;
      if(pass<12)for(const [name,y,z,clearance] of torsoTests){
        b[name].localToWorld(wp.set(0,y,z));
        acc.copy(wp).sub(base);acc.addScaledVector(axis,-acc.dot(axis));
        const radius=acc.length(),depth=clearance-radius;if(depth<=deepest||radius<1e-6)continue;
        deepest=depth;v1.copy(wp).addScaledVector(acc,depth/radius);
        actor.worldToLocal(wp);actor.worldToLocal(v1);extreme.copy(v1).sub(wp);
      }
      if(deepest>.00018)b.hips.position.addScaledVector(extreme,.93*w);
      if(max===.0003){if(deepest===.00018)break;continue;}
      v0.copy(fix);b.chest.localToWorld(v0);b.chest.localToWorld(v1.set(0,0,0));
      actor.worldToLocal(v0);actor.worldToLocal(v1);b.hips.position.addScaledVector(v0.sub(v1),w);
    }
    b.chest.worldToLocal(v0.copy(tip));v0.sub(b.head.position);v0.y-=.137;v0.z+=.053;
    mixTurn(b.head,clamp(Math.atan2(v0.y,Math.hypot(v0.x,v0.z)),-.69,.13),
      clamp(Math.atan2(-v0.x,-v0.z),-.75,.80),-.04*localAx,w);
    for(let j=0;j<2;j++){
      const thigh=b['thigh'+j],shin=b['shin'+j],boot=b['boot'+j];
      b.hips.updateWorldMatrix(true,false);
      // Align boot X with gunwale wrt the actual deck plane, including its pitch and roll.
      const toeYaw=(j?.1:-.22)+.18*sight,c=Math.cos(toeYaw),ss=Math.sin(toeYaw);
      const tilt=j?0:-.045/.41;
      const xx=axes.ux*c-axes.vx*ss+axes.nx*tilt*c,xy=axes.uy*c-axes.vy*ss+axes.ny*tilt*c,xz=axes.uz*c-axes.vz*ss+axes.nz*tilt*c;
      const workX=v2.set(xx,xy,xz).normalize(),workY=v1.copy(up).addScaledVector(v3.set(axes.ux,axes.uy,axes.uz),-tilt).normalize();
      endFrame(b.hips,workX,workY,bootFrame[j]);
      goal.copy(footTargets[j]);b.hips.worldToLocal(goal);goal.sub(sole.copy(solePatch).applyQuaternion(bootFrame[j]));
      chain(thigh,shin,boot,goal,v2.set(j?.25:-.19,.02,-1),bootFrame[j]);
    }
    palms(b);
    b.chest.worldToLocal(poleOrigin.copy(base));b.chest.worldToLocal(poleAxis.copy(tip));poleAxis.sub(poleOrigin).normalize();
    for(let j=0;j<2;j++){
      const arm=b['arm'+j],fore=b['forearm'+j],wrist=b['wrist'+j],u=(distance/.47+(j?.53:0))%1;
      savedA.copy(arm.quaternion);savedB.copy(fore.quaternion);savedW.copy(wrist.quaternion);
      raw.copy(baseHand[j]).lerp(handTargets[j],w);goal.copy(raw);b.chest.worldToLocal(goal);
      goal.sub(pad.copy(gripPatch).applyQuaternion(palmFrame[j]));
      chain(arm,fore,wrist,goal,v2.set(j?.68:-.79,j?-.72:-.48,.54),palmFrame[j],rec.elbows[j]);
      if(w<1){arm.quaternion.slerp(savedA,1-w);fore.quaternion.slerp(savedB,1-w);wrist.quaternion.slerp(savedW,1-w);}
      const sliding=Math.sin(Math.PI*smooth(.32,.94,u))*draw*(1-lower);
      rollIntoGrip(wrist,w*(.97-.27*sliding));
    }
  }
  return {apply,grips};
})();
