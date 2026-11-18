// The hook moves with the boat. The messenger eye is hung on the stationary
// quay. Collision therefore follows the actual reach between the two frames.
const TideSternLine=(()=>{
  const {clamp}=TideTraversal;
  const rail={x:-4.74,y:-2.70,z:15.72};
  const aftCleat={x:-5.30,y:-2.49,z:15.30};
  const mix=(a,b,k)=>({x:a.x+(b.x-a.x)*k,y:a.y+(b.y-a.y)*k,z:a.z+(b.z-a.z)*k});
  const world=(g,p)=>TideArrival.deck(g,p.x,p.y,p.z);
  function create(){return {phase:'reach',travel:0,turn:0,look:0,side:-.16,reach:.17,draw:0,slack:0,lower:0,
    lastJump:false,use:false,strike:0,miss:'short',mistakes:0,holdSaid:false,entryTime:0,queue:[]};}
  function anchor(g){
    const f=g.world.fenders.lower;
    return {x:f.x-f.w*.5+.105,y:f.y+.145,z:f.z+.54};
  }
  function waitingEye(g){
    const t=g.time,w=TideFloating.swell(-3.87,13.86,t);
    return {x:-3.87+.062*Math.sin(t*1.31),y:-3.04+.051*Math.sin(t*1.64)+w*.17,z:13.87+.07*Math.sin(t*1.16)};
  }
  function points(g){
    const s=g.arrival.stern,eye=waitingEye(g),cleat=world(g,aftCleat),pivot=world(g,{x:-4.54,y:-1.64,z:15.37});
    const target=world(g,{x:-4.82+1.24*s.side,y:-1.95-1.43*s.reach,z:15.13-1.66*s.reach});
    const near=((target.x-eye.x)/.205)**2+((target.y-eye.y)/.32)**2<1&&Math.abs(target.z-eye.z)<.25;
    let tip=target,ring=eye;
    if(s.phase!=='reach'){
      // Haul the loaded eye over the gunwale and down onto the real aft cleat.
      const f=s.draw,top={x:cleat.x,y:cleat.y+.31,z:cleat.z};
      ring=mix(eye,top,f);ring.y+=Math.sin(Math.PI*f)*.49;
      tip={...ring};
      if(s.phase==='lower'||s.phase==='fast'){
        ring=mix(top,cleat,s.lower);tip=mix(top,pivot,.38*s.lower);
      }
    }else if(s.strike>0){tip={...tip,z:tip.z-.12*Math.sin(s.strike*Math.PI)};}
    const dx=tip.x-pivot.x,dy=tip.y-pivot.y,dz=tip.z-pivot.z,scale=3.31/(Math.hypot(dx,dy,dz)||1);
    const base={x:tip.x-dx*scale,y:tip.y-dy*scale,z:tip.z-dz*scale};
    return {base,tip,pivot,eye:ring,cleat,anchor:anchor(g),near,caught:s.phase!=='reach',fast:s.phase==='fast',visible:true};
  }
  function equipment(g){
    const s=g.arrival?.stern;
    if(s){
      const pose=points(g);pose.poleVisible=s.travel>.75;return pose;
    }
    const cleat=world(g,aftCleat),fast=!TideArrival.active(g);
    return {anchor:anchor(g),cleat,eye:fast?cleat:waitingEye(g),caught:fast,fast,visible:true,poleVisible:false};
  }
  function queue(g,id){
    const a=g.arrival;
    // A fast crew may have caught the eye before the pilot finishes speaking.
    if(id==='sternCaught')a.stern.queue=a.stern.queue.filter(v=>v!=='sternHold');
    if(id==='sternFast')a.stern.queue.length=0;
    a.stern.queue.push(id);if(!a.voice)nextVoice(a);
  }
  function nextVoice(a){a.voice=a.stern.queue.shift()||'';a.voiceAt=0;a.caption='';}
  function start(g){
    const a=g.arrival;a.stern=create();queue(g,'sternOut');g.events.checkpoint?.(g);
  }
  function step(g,k,dt){
    const a=g.arrival,s=a.stern;
    s.travel=Math.min(1,s.travel+dt*.71);
    const inspect=s.phase==='reach'&&s.travel>.85&&k.use;
    s.look=clamp(s.look+(inspect?2.6:-3.1)*dt,0,1);
    s.entryTime+=dt;
    if(!s.holdSaid&&a.haul&&s.entryTime>1.3&&s.phase==='reach'){s.holdSaid=true;queue(g,'sternHold');}
    s.strike=Math.max(0,s.strike-dt*2.8);
    const fresh=k.jump&&!s.lastJump;s.lastJump=!!k.jump;
    s.slack=clamp(s.slack+(a.haul?-1.8:1.22)*dt,0,1);
    if(s.travel<1)return;
    if(s.phase==='reach'){
      s.side=clamp(s.side+k.x*dt*.94,-1,1);
      s.reach=clamp(s.reach-k.z*dt*.71,0,1);
      if(fresh&&!s.strike){
        const geom=points(g);
        if(geom.near){
          s.phase='draw';s.draw=0;queue(g,'sternCaught');g.events.checkpoint?.(g);
        }else{
          const f=g.world.fenders.lower,tip=geom.tip;
          const quay=Math.abs(tip.x-f.x)<f.w/2+.08&&Math.abs(tip.z-f.z)<f.d/2+.20&&tip.y<f.y+.1;
          const wet=tip.y<g.cues.water+TideFloating.swell(tip.x,tip.z,g.time)+.08;
          s.mistakes++;s.strike=1;s.miss=quay?'stone':wet?'water':'short';
          if(quay)cue(g,'hookStone');
        }
      }
    }else if(s.phase==='draw'){
      // The bow line must be eased once the stern comes under load. When both
      // lines oppose one another the hook stays loaded at the gunwale.
      if(k.use&&k.z>.12){
        const limit=.50+.50*s.slack;
        if(s.draw<limit)s.draw=Math.min(limit,s.draw+k.z*.69*dt);
        if(!s.use)cue(g,'wetLine');
      }else if(!k.use&&s.draw<.985)s.draw=Math.max(0,s.draw-.18*dt);
      if(!k.use&&s.use&&s.draw>=.985){s.phase='lower';cue(g,'cleatDrop');}
      s.use=!!k.use;
    }else if(s.phase==='lower'){
      s.lower=clamp(s.lower+dt*1.7,0,1);
      if(s.lower===1){s.phase='fast';queue(g,'sternFast');g.events.checkpoint?.(g);}
    }
  }
  function cue(g,key){const a=g.arrival;a.cue=key;a.serial++;}
  function show(g){
    const a=g.arrival,s=a.stern,near=s.phase==='reach'&&points(g).near;
    if(s.phase==='reach'){
      g.set(0,'握住首缆把艇首拉近。等沈遥从艇尾喊勾住，再松开。',{caption:a.haul?'首缆吃力　／　保持到她勾住':'首缆已松　／　按住收缆'});
      g.set(1,s.travel<1?'离开舵位，到艇尾拿船钩。':s.strike?(s.miss==='stone'?'钩头碰到了堤边。收回一点，对准绿绳眼再挑。':s.miss==='water'?'钩头探进了水里。稍微收杆，等绳眼回来。':'钩口还没有兜住绳眼。看它从哪边擦过去，再来一次。'):'左右扫钩、前推送杆。需要近看时按住操作键。钩尖进绿绳眼，按跳跃键挑起。',{caption:near?'钩口贴住绿绳眼　／　可以挑起':'岸桩旁　／　找绿绳眼'});
    }else if(s.phase==='draw'){
      g.set(0,'尾缆勾住了。松开首缆，给艇尾留出回摆的位置。',{caption:a.haul?'首缆绷紧　／　尾缆受力':'首缆松出　／　等艇尾落桩'});
      g.set(1,s.draw>=.985?'绳眼已在尾桩上方。松开操作键，让它落在桩上。':s.draw>.46&&s.slack<.28?'杆被两根缆拉住了。请林澈松开首缆，握住船钩再后拉。':'握住操作键，后拉方向，把湿绳眼带过船舷。',{caption:s.draw>=.985?'可以落桩':s.draw>.46&&s.slack<.28?'首缆仍在吃力':'绿绳眼已勾住'});
    }else{
      g.set(0,'两根缆都在桩上了。按住收紧首缆，等靠球贴住堤脚。',{caption:'尾缆就位　／　收齐首缆'});
      g.set(1,'看尾缆落在桩肩，等艇首靠稳，再沿走道去放登岸梯。',{caption:s.phase==='fast'?'尾缆已系妥':'绳眼正在落桩'});
    }
  }
  function checkpoint(g){
    const a=g.arrival,s=a?.stern;if(!s||a.done)return null;
    return {berth:'stern',x:a.x,z:a.z,heading:a.heading,paid:a.paidOut,phase:s.phase==='lower'?'fast':s.phase,draw:s.draw};
  }
  function restore(g,mark){
    TideArrival.begin(g);const a=g.arrival,h=g.world.fenders.floatPose;
    const num=(n,lo,hi,f)=>Number.isFinite(n)?clamp(n,lo,hi):f;
    Object.assign(a,{x:num(mark.x,-24,8.3,h.anchorX),z:num(mark.z,16.53,26,h.anchorZ),heading:num(mark.heading,-.82,.82,0),
      radio:'line',atBow:1,channel:12,dial:12,attached:true,secured:true,engineRunning:false,speed:0,paidOut:num(mark.paid,.5,15,3.4),stern:create()});
    const s=a.stern;s.phase=['draw','fast'].includes(mark.phase)?mark.phase:'reach';s.travel=1;
    s.draw=s.phase==='fast'?1:num(mark.draw,0,.98,0);s.lower=s.phase==='fast'?1:0;
    s.holdSaid=s.phase!=='reach';queue(g,s.phase==='reach'?'sternOut':s.phase==='draw'?'sternCaught':'sternFast');
    TideFloating.step(h,g.players,g.cues.water,g.time,0,a.x,a.z,a.heading);
    TideArrival.step(g,[{x:0,z:0},{x:0,z:0}],0);
  }
  return {rail,start,points,equipment,step,show,nextVoice,checkpoint,restore};
})();
