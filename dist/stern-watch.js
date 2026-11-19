// A Tang walks across Haiyan's wet afterdeck. The two white bands share the
// transom's actual top rail. Lining them up removes fore-and-aft parallax.
const TideSternWatch=(()=>{
  const {clamp,mix}=TideTraversal;
  const railZ=8.70,nearBand=.55,farBand=1.66,collars=[-2.50,-2.77];
  function create(){return {x:-.72,z:6.12,vx:0,vz:0,step:0,speed:0,brace:0,raise:0,
    aboard:false,seated:false,sighted:false,feedback:'',until:-1,serial:0,cue:'',at:-1};}
  function cue(g,id){
    const w=g.lastPass.watch;w.cue=id;w.at=g.time;w.serial++;
  }
  function tide(t){return -3.19+.08*Math.sin(t*.14+.4);}
  function station(g){
    const r=g.lastPass;return !!r&&g.state.mode===1&&r.watch.aboard&&!r.turned;
  }
  function move(g,k,dt){
    const r=g.lastPass,w=r.watch;
    if(!w.aboard&&!r.occupied){w.aboard=true;g.events.checkpoint?.(g);}
    w.raise=Math.max(0,w.raise-dt/.93);
    const power=1-Math.exp(-dt*10),atRail=w.z>7.96&&w.x<nearBand+.10;
    const hold=atRail&&!r.occupied?clamp(k.magnify||0,0,1):0;
    const before=w.brace;
    w.brace=mix(w.brace,hold,power);
    if(!r.occupied&&w.brace>.8&&before<=.8)cue(g,'railTouch');
    const speed=mix(1.40,.32,w.brace),dx=r.occupied?0:-k.z,dz=r.occupied?0:k.x;
    const unit=Math.max(1,Math.hypot(dx,dz));
    w.vx=mix(w.vx,dx*speed/unit,power);w.vz=mix(w.vz,dz*speed/unit,power);
    const x=w.x,z=w.z;
    w.x=clamp(x+w.vx*dt,-1.47,1.50);w.z=clamp(z+w.vz*dt,5.98,8.42);
    const travel=Math.hypot(w.x-x,w.z-z);w.speed=travel/dt;
    const foot=Math.floor(w.step/Math.PI);
    w.step+=travel*Math.PI/.53;
    if(w.brace<.40&&Math.floor(w.step/Math.PI)!==foot)cue(g,'deckStep');
  }
  function eyeAt(g){
    const w=g.lastPass.watch,brace=w.brace;
    const pace=clamp(w.speed/1.4,0,1)*(1-brace);
    return [w.x+.035*brace,2.96-.74*brace+.008*pace*Math.cos(w.step*2),
      w.z+.36*brace+.016*pace*Math.sin(w.step)];
  }
  function frame(g){
    if(!station(g)||g.lastPass.occupied)return null;
    const w=g.lastPass.watch,eye=eyeAt(g);
    const mark=TideLookout.marks.stump;
    const pile=TideLastPass.local(g,[mark.x,-2.51,mark.z]);
    // Keep enough rail in sight to judge the pile against it, even if the
    // observer is forward of the corner. Both points are attached to the ship.
    const at=[pile[0],mix(1.43,pile[1],.78),mix(railZ+.06,pile[2],.54)];
    return {x:w.x,z:w.z,eye,at,step:w.step,walking:w.speed>.06,speed:w.speed,
      brace:w.brace,raise:w.raise,heel:.034*Math.sin(g.time*.91)};
  }
  function reading(g){
    const w=g.lastPass.watch,eye=eyeAt(g),pile=TideLookout.marks.stump;
    const angle=x=>Math.atan2(railZ-eye[2],x-eye[0]);
    const parallax=Math.abs(angle(nearBand)-angle(farBand));
    const lined=w.brace>.83&&eye[0]<nearBand-.18&&parallax<.042;
    const water=g.cues.water+TideLookout.swell(pile.x,pile.z,g.time);
    const exposed=water<collars[1]-.055;
    const distance=Math.min(...collars.map(y=>TideLastPass.local(g,[pile.x,y,pile.z])[2]))-.395-railZ;
    return {lined,exposed,past:distance>.015,parallax,water,distance};
  }
  function report(g,k){
    const r=g.lastPass,w=r.watch,a=reading(g);
    if(a.lined&&!w.seated){w.seated=true;g.events.checkpoint?.(g);}
    if((!k.jump&&!k.waitReport)||r.occupied||r.next!=='sighting'||r.voice||w.raise>.40)return;
    let message;
    if(w.z<7.96)message='这里看的是船舷。走到艉栏的两道白漆旁。';
    else if(!a.lined)message='从两道白漆后面扶栏，沿栏微调，让它们排成一线。';
    else if(!a.exposed)message='这一道浪遮住了下箍。等浪退，再数一次。';
    else if(k.waitReport&&!a.past){
      w.until=-1;r.warned=true;w.raise=1;cue(g,'deckKey');TideLastPass.say(r,'buried');return;
    }else if(k.jump&&!k.waitReport&&a.past){
      w.until=-1;w.sighted=true;w.raise=1;cue(g,'deckKey');TideLastPass.say(r,'clear');return;
    }else if(a.past)message='从白漆往外看，艉栏线前已经空了。再确认桩的位置。';
    else message='上箍还在船舷这侧。从艉栏望过去，再报一次。';
    w.feedback=message;w.until=g.time+2.2;g.alert(message,2.2);
  }
  function hint(g){
    const r=g.lastPass,w=r.watch;
    if(r.occupied)return '岸台正在发话。松开操作键，把频道交给船上。';
    if(w.until>g.time)return w.feedback;
    if(w.sighted)return '让船尾说完整句，等船长决定什么时候转舵。';
    if(w.z<7.96)return '从舱门向右走到艉栏，找横栏上两处磨白的漆带。';
    if(w.x>nearBand-.18)return '向后退到两道白漆的内侧，从第一道往第二道看。';
    if(w.brace<.83)return '扶住横栏，低下身。让桩和栏杆转角都留在眼前。';
    if(!reading(g).lined)return '沿栏微调脚步，直到近处与远处的白漆排成一线。';
    return '看两道箍在哪一侧：贴舷报等桩，越过艉栏报已过。';
  }
  function save(w){return {x:w.x,z:w.z,seated:w.seated};}
  function restore(w,m){
    w.aboard=true;
    if(!m)return;
    if(Number.isFinite(m.x))w.x=clamp(m.x,-1.47,1.50);
    if(Number.isFinite(m.z))w.z=clamp(m.z,5.98,8.42);
    w.seated=m.seated===true;
  }
  return {create,station,tide,move,frame,reading,report,hint,save,restore,railZ};
})();
