// Working posture of the starter and clutch operators on the third chapter apron.
// Call after the common walk, face and equipment animation, once per actor per draw.
const TideStarterPose=(()=>{
  const T=THREE,records=new WeakMap(),sessions=new WeakMap(),v=()=>new T.Vector3(),q=()=>new T.Quaternion();
  let nextSession=0;
  const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x)),mix=(a,b,t)=>a+(b-a)*t;
  const smooth=(a,b,x)=>{const u=clamp((x-a)/(b-a));return u*u*(3-2*u);};
  const baseHands=[v(),v()],hands=[v(),v()],goals=[v(),v()],feet=[v(),v()],baseAnkles=[v(),v()];
  const baseBoot=[q(),q()],restUpper=q(),restFore=q(),correction=v(),dir=v(),bend=v(),elbow=v(),tmp=v(),vec=v(),lamp=v(),offset=v();
  const A=q(),B=q(),inv=q(),neutral=q(),soleQuat=q(),end=q(),euler=new T.Euler();
  const palm=new T.Vector3(0,-.055,-.005),footBottom=.059;
  const armNames=['arm0','forearm0','wrist0','arm1','forearm1','wrist1'];
  function armRest(){return {w:0,hip:v(),chest:v(),chestTilt:v(),headTilt:v(),saved:armNames.map(q),
    from:[v(),v()],lastGoal:[v(),v()],feet:[v(),v()],target:[v(),v()],entry:0,release:0,root:v(),face:0,was:false,previous:0,drive:0,look:0};}
  function turn(bone,x,y,z,w){
    end.setFromEuler(euler.set(x,y,z,'XYZ'));bone.quaternion.slerp(end,w);
  }
  // Identical two-link geometry and forearm/palm origin to TideActors.handleArm.
  // Calculating in parent-local space keeps Shen's narrower shoulder scale intact.
  function chain(upper,mid,goalInParent,lowerTip,px,py,pz){
    dir.copy(goalInParent).sub(upper.position);
    const l1=mid.position.length(),l2=lowerTip.length();
    const d=clamp(dir.length(),Math.abs(l1-l2)+.0001,l1+l2-.00012);
    dir.normalize();bend.set(px,py,pz).addScaledVector(dir,-(px*dir.x+py*dir.y+pz*dir.z)).normalize();
    const a=(l1*l1-l2*l2+d*d)/(2*d);
    elbow.copy(dir).multiplyScalar(a).addScaledVector(bend,Math.sqrt(Math.max(0,l1*l1-a*a)));
    A.setFromUnitVectors(tmp.copy(mid.position).normalize(),vec.copy(elbow).normalize());
    B.setFromUnitVectors(tmp.copy(lowerTip).normalize(),vec.copy(dir).multiplyScalar(d).sub(elbow).normalize().applyQuaternion(inv.copy(A).invert()));
    upper.quaternion.copy(A);mid.quaternion.copy(B);
  }
  function snapshotFeet(actor,b,s,site,yaw){
    const c=Math.cos(yaw),sn=Math.sin(yaw);
    for(let j=0;j<2;j++){
      b['boot'+j].getWorldPosition(s.from[j]);
      const sign=j?1:-1,lead=!!j===!!s.right;
      // One foot advances and the other stays aft. Both anchors subsequently
      // stay in the quay frame while the operator rocks about them.
      const x=sign*(s.right?.156:.149),z=lead?-.114:.116;
      s.target[j].set(site.x+c*x+sn*z,site.y+footBottom*actor.scale.y,site.z-sn*x+c*z);
      s.feet[j].copy(s.from[j]);
    }
  }
  function settleFeet(actor,b,s){
    for(let j=0;j<2;j++){
      const first=!!j===!!s.right,delay=first?.045:.275;
      const u=smooth(delay,delay+.288,s.entry);
      feet[j].copy(s.from[j]).lerp(s.target[j],u);
      feet[j].y+=.041*Math.sin(Math.PI*u);
      s.feet[j].copy(feet[j]);
    }
  }
  function apply(actor,g,i,dt,time,grips){
    const rig=actor.userData.rig,b=rig.bones,r=g.signal,world=g.world.signal,site=i?world.pilot:world.starter;
    let s=records.get(actor),key=sessions.get(g);
    if(!key){key=++nextSession;sessions.set(g,key);}
    if(s&&(s.session!==key||g.time+.01<s.clock)){records.delete(actor);s=null;}
    const holding=!!(grips&&g.engaged[i]&&g.stage===0&&g.players[i].grounded!==false);
    if(!s&&!holding)return;
    if(!s){s=armRest();s.right=!!i;s.session=key;records.set(actor,s);}
    s.clock=g.time;
    const h=clamp(Number.isFinite(dt)?dt:0,0,.12),stroke=i?r.shift:r.stroke;
    const distance=Math.hypot(actor.position.x-site.x,actor.position.z-site.z);
    // The normal approach animation moves the root into the worksite. Delay
    // the foot plant until the service stance itself is within stepping range.
    const here=holding&&distance<.40;
    if(!s.was&&!here&&!s.release){records.delete(actor);return;}
    for(let j=0;j<2;j++){
      b['boot'+j].getWorldPosition(baseAnkles[j]);
      b['wrist'+j].localToWorld(baseHands[j].copy(palm));
      baseBoot[j].copy(b.hips.quaternion).multiply(b['thigh'+j].quaternion).multiply(b['shin'+j].quaternion).multiply(b['boot'+j].quaternion);
    }
    if(here&&!s.was){
      s.entry=0;s.previous=stroke;s.drive=0;s.release=0;
      snapshotFeet(actor,b,s,site,TideSignal.yaw);
      s.lastGoal[0].copy(grips[0]);s.lastGoal[1].copy(grips[1]);
    }else if(!here&&s.was){s.release=1;s.leaveWeight=s.w;s.exitAge=0;
      s.idleExit=Math.abs(g.players[i].speed||0)<.35;s.stepMix=s.idleExit?1:0;}
    if(!here){
      s.exitAge+=h;s.release=Math.max(0,1-s.exitAge/(s.idleExit?.48:.33));
      if((g.players[i].speed||0)>.5)s.stepMix*=Math.exp(-h*15);
      if(s.release<=0){records.delete(actor);return;}
    }
    s.was=here;
    if(here){
      s.entry+=h;s.w=smooth(0,.25,s.entry);s.face=actor.rotation.y;s.root.copy(actor.position);
      if(h>.00001){
        const speed=clamp((stroke-s.previous)/h,-3,3);
        s.drive+=(speed-s.drive)*(1-Math.exp(-h*13));
      }
      s.previous=stroke;
      if(r.linked)s.look+=(1-s.look)*(1-Math.exp(-h*4));
      else s.look=0;
      for(let j=0;j<2;j++){
        hands[j].copy(grips[j]);actor.worldToLocal(hands[j]);s.lastGoal[j].copy(grips[j]);
        b['wrist'+j].localToWorld(goals[j].copy(palm));goals[j].lerp(grips[j],s.w);
      }
      const pressure=clamp((r.shift-.19)/.54)*(r.linked?0:clamp(Math.abs(r.rpm-r.drivenRPM||0)*3.2+.27));
      const age=Math.max(0,g.time-(r.foley?.scrape??-10));
      const kick=age<.68?Math.sin(Math.min(age/.19,1)*Math.PI*.77)*Math.exp(-age*6.7):0;
      const drive=clamp(s.drive/(i?1.1:2.05),-1,1),breath=Math.sin(time*2.05+i*1.4);
      const hm=(hands[0].z+hands[1].z)/2;
      // On the starter the forward grip is the long reach; on the clutch the
      // outboard hand travels forward against the spring while the left braces.
      const send=i?stroke:1-stroke,relax=s.look*.63;
      const load=pressure*(i?.84:.92),effort=load*(1-relax);
      s.hip.set(i?-.025-.014*load:.016+.010*drive,
        (i?.856:.865)-.021*send-.016*effort-.019*kick,
        clamp((hm+(i?.35:.275))*.23,-.072,.061)+(i?.005:-drive*.011)+kick*(i?.053:.014));
      s.chest.set(i?.014:.002,.088+.0028*breath,-.008-.011*effort);
      s.chestTilt.set((i?-.126:-.089)-send*(i?.114:.224)-.045*effort
        +(i?.126:.032)*kick+(i?0:.046*drive),
        i?-.044-.082*send+.025*kick:-.027+.035*drive,
        i?.047+.048*effort-.070*kick:-.023-.024*drive);
      const pilot=TideSignal.point(3.689,1.417,12.035);
      lamp.set(pilot.x,pilot.y,pilot.z);
      // The actual steel pilot sits above Shen's right wrist. Lin looks
      // across the apron when the dog seats and Shen lifts her chin to the lamp.
      s.chestTilt.y+=s.look*(i?.052:-.34);
      s.headTilt.set(-.27-(i?.072:.033)*send+.029*drive+.075*kick,
        i?-.055-.079*send:.047*drive,-s.chestTilt.z*.52);
      settleFeet(actor,b,s);
    }else{
      s.w=s.leaveWeight*smooth(0,1,s.release);
      const lift=clamp((actor.position.y-s.root.y)/.12);
      for(let j=0;j<2;j++){
        feet[j].copy(baseAnkles[j]).lerp(s.feet[j],s.w*(1-lift));
        if(s.stepMix>.001){
          const first=!!j!==!!i,delay=first?0:.205;
          const u=smooth(delay,delay+.27,s.exitAge);
          tmp.copy(s.feet[j]).lerp(baseAnkles[j],u);tmp.y+=.033*Math.sin(Math.PI*u);
          feet[j].lerp(tmp,s.stepMix);
        }
      }
    }
    const w=s.w;
    if(w<=.00001)return;
    b.hips.position.lerp(s.hip,w);b.chest.position.lerp(s.chest,w);
    if(!here){
      // On releasing into a turn the simulation can rotate the root by twenty
      // degrees in a tick. Unwind that turn through the waist after the palms
      // have begun to come off the steel instead of flinging them sideways.
      const delta=s.face-actor.rotation.y,turnback=Math.atan2(Math.sin(delta),Math.cos(delta));
      b.hips.rotation.y+=clamp(turnback,-1.35,1.35)*w;
      tmp.copy(s.root);actor.worldToLocal(tmp);tmp.y=0;
      if(tmp.length()>.10)tmp.setLength(.10);
      b.hips.position.addScaledVector(tmp,w);
    }
    turn(b.chest,s.chestTilt.x,s.chestTilt.y,s.chestTilt.z,w);
    if(here){
      // A given shoulder cannot pull the wheel through its stroke from an
      // armlength away. Bring the body in if either glove is near extension.
      // Correct in world coordinates, then transform only the necessary motion
      // into the pelvis's parent frame (works with the scaled Shen rig).
      for(let pass=0;pass<4;pass++){
        let largest=.0003;
        for(let j=0;j<2;j++){
          const arm=b['arm'+j],fore=b['forearm'+j];
          tmp.copy(grips[j]);b.chest.worldToLocal(tmp);tmp.sub(arm.position);
          const d=tmp.length(),over=d-(fore.position.length()+.254-.013);
          if(over>largest){largest=over;correction.copy(tmp).multiplyScalar(over/d);}
        }
        if(largest===.0003)break;
        tmp.copy(correction);b.chest.localToWorld(tmp);
        vec.set(0,0,0);b.chest.localToWorld(vec);actor.worldToLocal(vec);actor.worldToLocal(tmp);
        b.hips.position.addScaledVector(tmp.sub(vec),w);
      }
    }
    if(here&&s.look>.0001){
      b.chest.worldToLocal(lamp);lamp.sub(b.head.position);lamp.y-=.125;
      const yaw=clamp(Math.atan2(-lamp.x,-lamp.z),-.96,.96);
      const pitch=clamp(Math.atan2(lamp.y,Math.hypot(lamp.x,lamp.z)),-.42,.37);
      s.headTilt.y=mix(s.headTilt.y,yaw,s.look);s.headTilt.x=mix(s.headTilt.x,pitch,s.look);
    }
    turn(b.head,s.headTilt.x,s.headTilt.y,s.headTilt.z*.8,w);
    for(let j=0;j<2;j++){
      const sign=j?1:-1,thigh=b['thigh'+j],shin=b['shin'+j],boot=b['boot'+j];
      // Both soles retain the common animator's vertical contact while the
      // hips transfer load and each knee bends independently over its toe.
      tmp.copy(feet[j]);b.hips.worldToLocal(tmp);
      chain(thigh,shin,tmp,boot.position,sign*.12,.025,-1);
      neutral.copy(b.hips.quaternion).multiply(thigh.quaternion).multiply(shin.quaternion).invert();
      soleQuat.setFromEuler(euler.set(0,sign*.035,0,'YXZ'));
      baseBoot[j].slerp(soleQuat,w);boot.quaternion.copy(neutral.multiply(baseBoot[j]));
      const arm=b['arm'+j],fore=b['forearm'+j],wrist=b['wrist'+j];
      if(here){
        restUpper.copy(arm.quaternion);restFore.copy(fore.quaternion);
        turn(wrist,(i?(j?.36:.12):.32-.24*stroke)*w,0,sign*(i?.06:.045)*w,1);
        offset.copy(palm).applyQuaternion(wrist.quaternion).add(wrist.position);
        tmp.copy(goals[j]);b.chest.worldToLocal(tmp);
        chain(arm,fore,tmp,offset,sign*(i?.81:.76),i?-.30:-.24,i?.48:.64);
        if(w<1){arm.quaternion.slerp(restUpper,1-w);fore.quaternion.slerp(restFore,1-w);}
      }else{
        const unhand=1-smooth(0,.33,s.exitAge);
        arm.quaternion.slerp(s.saved[j*3],unhand);
        fore.quaternion.slerp(s.saved[j*3+1],unhand);
        wrist.quaternion.slerp(s.saved[j*3+2],unhand);
        const linger=unhand*s.leaveWeight;
        goals[j].copy(s.lastGoal[j]).lerp(baseHands[j],1-linger);
        offset.copy(palm).applyQuaternion(wrist.quaternion).add(wrist.position);
        tmp.copy(goals[j]);b.chest.worldToLocal(tmp);
        restUpper.copy(arm.quaternion);restFore.copy(fore.quaternion);
        chain(arm,fore,tmp,offset,sign*(i?.81:.76),i?-.30:-.24,i?.48:.64);
        const match=smooth(0,.36,linger);
        arm.quaternion.slerp(restUpper,1-match);fore.quaternion.slerp(restFore,1-match);
      }
    }
    if(here){
      armNames.forEach((key,j)=>s.saved[j].copy(b[key].quaternion));
      // Capture the corrected hip, so releasing the handle does not discard
      // the final centimetres of reach correction in one frame.
      if(w>.995)s.hip.copy(b.hips.position);
    }
  }
  return {apply};
})();
