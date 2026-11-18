// Geometry and motion of the arrest line and the two pickup rungs in the foghouse pit.
const TideFogRecovery=(()=>{
  const {clamp,mix}=TideTraversal,turn=Math.PI*2;
  const smooth=v=>{const u=clamp(v,0,1);return u*u*(3-2*u);};
  function rung(pad){
    return {x:pad.x+Math.sin(pad.angle)*.55,y:pad.y-.32,z:pad.z+Math.cos(pad.angle)*.55};
  }
  function cue(g,id){const r=g.fog;r.haulCue=id;r.haulCueAt=g.time;r.haulSerial++;}
  function say(r,id){r.voice=id;r.clock=0;r.subtitle='';r.line=-1;}
  function change(h,phase,p){
    h.phase=phase;h.age=0;h.from={x:p.x,y:p.y,z:p.z,vx:p.vx,vy:p.vy,vz:p.vz};h.idle=0;
  }
  function arrest(g){
    const r=g.fog,p=g.players[0],w=g.world.foghouse;
    if(r.mode!=='transport'||r.key!=='carry'||r.haul)return false;
    const dist=pad=>Math.hypot(p.x-pad.pivot.x,p.z-pad.pivot.z);
    // A missed transfer may still be caught by the incoming, unstamped second shoe.
    const wheel=Number(r.marks[1]||r.marks[0]&&dist(w.wheels[1])<dist(w.wheels[0]));
    const pad=w.wheels[wheel],dx=p.x-pad.pivot.x,dz=p.z-pad.pivot.z;
    if(dist(pad)>4.0)return false;
    const bearing=Math.hypot(dx,dz)>.12?Math.atan2(dx,dz):pad.angle;
    const h={wheel,bearing,start:g.time,elapsed:0,offset:0,sway:0,effort:0,reaching:false,pull:0,grip:0,gap:0,braked:0};
    r.haul=h;change(h,'catch',p);h.catchTime=clamp(.59+Math.abs(dist(pad)-pad.r-.82)*.12,.59,1.08);
    p.cast=p.grounded=p.jumpRise=false;p.ground=null;p.deckMotion=null;p.jumpBuffer=p.grace=0;
    g.setbacks++;cue(g,'arrest');say(r,'fall');return true;
  }
  function rewind(g,h,p){const r=g.fog;change(h,'rewind',p);cue(g,'return');say(r,'rewind');}
  function placeBody(p,x,y,z,dt){
    p.vx=(x-p.x)/dt;p.vy=(y-p.y)/dt;p.vz=(z-p.z)/dt;
    p.x=x;p.y=y;p.z=z;p.speed=0;p.launch=p.landing=0;
  }
  function land(g,p,floor,x,z,manual){
    const yaw=p.yaw;
    Object.assign(p,TideTraversal.spawn(floor),{x,y:floor.y,z,yaw,landing:.44});
    g.fog.haul=null;g.engaged[0]=false;
    if(manual)say(g.fog,'aboard');
  }
  function rewindTo(g){
    const w=g.world.foghouse,m=g.fog.marks;
    return m[0]?w.wheels[m[1]?1:0]:w.rear;
  }
  function step(g,input,dt){
    const r=g.fog,h=r.haul,p=g.players[0],w=g.world.foghouse,pad=w.wheels[h.wheel],at=rung(pad);
    const k=input[0];if(h.start===g.time)return;
    h.age+=dt;h.elapsed+=dt;
    h.reaching=!!k.use;h.effort=clamp(k.x,-1,1);
    if(h.phase!=='rewind'&&h.elapsed>.42&&k.jump&&!k.use)rewind(g,h,p);
    if(h.phase==='rewind'){
      const home=rewindTo(g),x=home===w.rear?w.rack.x:home.x,z=home===w.rear?w.rack.z:home.z;
      const u=h.age/1.82,a=h.from,across=smooth((u-.25)/.63);
      const y=mix(a.y,home.y+.47,smooth(u/.44))-.47*smooth((u-.80)/.20);
      placeBody(p,mix(a.x,x,across),y,mix(a.z,z,across),dt);
      g.set(0,'卷索正在收回。钥匙上的旧印还在。',{caption:'回到'+(home===w.rear?'取钥处':home.index?'乙踏板':'甲踏板')});
      g.set(1,'卷筒在回收，离合柄已经抱闸。',{caption:'等同伴落脚'});
      if(u>=1)land(g,p,home,x,z,false);return;
    }
    const sn=Math.sin(h.bearing),cs=Math.cos(h.bearing);
    if(h.phase==='climb'){
      h.idle=k.use&&k.z<-.15?0:h.idle+dt;
      h.pull=clamp(h.pull+dt*(k.use?Math.max(0,-k.z):0)*1.04,0,1);
      const u=h.pull,a=h.from,forward=smooth((u-.47)/.53);
      const x=mix(a.x,pad.x+Math.sin(pad.angle)*.18,forward),z=mix(a.z,pad.z+Math.cos(pad.angle)*.18,forward);
      placeBody(p,x,mix(a.y,pad.y,smooth(u/.94))+.12*Math.sin(Math.PI*u),z,dt);
      g.set(0,'抓住黄环，握住操作键向前推，先屈膝再翻上格栅。',{vis:'dial',value:u,caption:'翻上踏板　'+Math.round(u*100)+'%'});
      g.set(1,'黄环已受力，离合器保持抱闸。等他报脚下踩实。',{caption:'等待踏板重新承重'});
      if(u>=1)land(g,p,pad,x,z,true);
      else if(h.idle>5)rewind(g,h,p);
      return;
    }
    // The suspended body can swing tangentially. The wheel and the pendulum use
    // separate coordinates, so reaching alone cannot bring a moving rung to hand.
    h.sway+=(k.x*2.1-h.offset*4.8-h.sway*2.2)*dt;h.offset=clamp(h.offset+h.sway*dt,-.54,.54);
    const rad=pad.r+.81,tx=pad.pivot.x+sn*rad+cs*h.offset,tz=pad.pivot.z+cs*rad-sn*h.offset;
    const ty=pad.y-1.83+.028*Math.sin(h.elapsed*4.1)+.07*h.offset*h.offset;
    if(h.phase==='catch'){
      const u=clamp(h.age/h.catchTime,0,1),f=smooth(u),v=u*(1-u)*(1-u)*h.catchTime,a=h.from;
      placeBody(p,mix(a.x,tx,f)+clamp(a.vx,-6,6)*v,mix(a.y,ty,f)+clamp(a.vy,-8,0)*v,mix(a.z,tz,f)+clamp(a.vz,-6,6)*v,dt);
      if(u>=1)change(h,'wait',p);
    }else placeBody(p,tx,ty,tz,dt);
    const yaw=Math.atan2(p.x-pad.pivot.x,p.z-pad.pivot.z);
    p.yaw+=Math.atan2(Math.sin(yaw-p.yaw),Math.cos(yaw-p.yaw))*(1-Math.exp(-dt*9));
    h.gap=Math.hypot(at.x-(p.x-sn*.25),at.z-(p.z-cs*.25));
    // Choose an attainable handwheel setting even close to its mechanical end stops.
    const want=Math.atan2(p.x-pad.pivot.x,p.z-pad.pivot.z);
    let dial=((h.wheel?Math.PI-want:want)/turn%1+1)%1;
    if(dial<.015&&r.travel>.85)dial=1;
    if(dial>.985&&r.travel<.15)dial=0;
    const correction=dial-r.travel;
    h.braked=g.engaged[1]&&Math.abs(r.clutch)<.10?h.braked+dt:0;
    const canHold=h.phase==='wait'&&h.gap<.36&&h.braked>=.14;
    h.grip=canHold&&k.use?h.grip+dt:0;
    const side=h.wheel?'乙':'甲',instruction=h.gap>=.36?(correction<0?'告诉沈遥再向左盘一点。':'告诉沈遥再向右盘一点。'):h.braked<.14?'黄环到了，让沈遥停住并握紧离合柄。':'黄环在手边，按住操作键抓环。';
    g.set(0,instruction+'　按跳跃可回上次落脚处。',{caption:side+'轮黄环　·　手边相差 '+Math.round(h.gap*100)+' cm'});
    g.set(1,'握住离合柄，左右倒回'+side+'踏板。听林澈报位置，松开方向键抱闸。',{caption:'盘车 '+Math.round(r.travel*360)+'°　·　'+(h.braked>.14?'已抱闸':'黄环随轮转动')});
    if(h.grip>=.16){change(h,'climb',p);h.pull=0;cue(g,'grasp');}
    else{
      const active=Math.abs(k.x)>.14||k.use||Math.abs(r.clutch)>.10;
      h.idle=active?0:h.idle+dt;
      if(h.phase==='wait'&&h.idle>5)rewind(g,h,p);
    }
  }
  return {arrest,step,rung};
})();
