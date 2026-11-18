// A crossing is measured against the directed line between the two physical buoys.
const TideRegatta=(()=>{
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n)),mix=(a,b,k)=>a+(b-a)*k;
  const gates=[
    {name:'红罐门',x:1.15,z:1.41,nx:1,nz:0,width:1.20},
    {name:'东弯',x:2.47,z:0,nx:0,nz:-1,width:1.24},
    {name:'木桥双孔',x:-.24,z:-1.34,nx:-1,nz:0,width:1.32},
    {name:'西弯',x:-2.47,z:0,nx:0,nz:1,width:1.28},
    {name:'格旗线',x:-.76,z:1.39,nx:1,nz:0,width:1.28}
  ];
  const start=gates[4],laps=2;
  function boat(i,round){
    const z=(i+(round%2))%2?1.65:1.14;
    return {id:i,x:start.x,z,h:Math.PI/2,vx:0,vz:0,speed:0,omega:0,rudder:0,roll:0,pitch:0,
      heave:0,throttle:0,charge:1,boost:0,hot:false,gate:0,lap:0,splits:[],lapStart:0,time:null,
      anchor:{x:start.x,z,h:Math.PI/2},recover:0,resetHold:0,resetHeld:false,penalty:0,
      bumpAt:-9,message:'',messageUntil:0,trail:[],trailAt:0,inner:0,outer:0};
  }
  function create(round=0){
    return {round,phase:'ready',boats:[boat(0,round),boat(1,round)],ready:[false,false],
      clock:0,elapsed:0,count:3,winner:null,firstAt:null,paddle:0,events:[],serial:0};
  }
  function event(r,key,i=-1,force=1){r.events.push({key,i,force,at:r.clock,id:++r.serial});if(r.events.length>40)r.events.shift();}
  function confirm(r,i){
    if(r.phase!=='ready'||r.ready[i])return;
    r.ready[i]=true;event(r,'ready',i);
    if(r.ready.every(Boolean)){r.phase='count';r.count=3;event(r,'count');}
  }
  function note(r,b,text,seconds=1.25){b.message=text;b.messageUntil=r.clock+seconds;}
  function impact(r,b,nx,nz,penetration,bodyX,bodyZ,wallVX=0,wallVZ=0){
    b.x+=nx*penetration;b.z+=nz*penetration;
    const vn=(b.vx-wallVX)*nx+(b.vz-wallVZ)*nz;
    if(vn>=0)return;
    const impulse=-vn*1.14;
    b.vx+=nx*impulse;b.vz+=nz*impulse;
    b.omega+=clamp((bodyX*nz-bodyZ*nx)*impulse*4,-.62,.62);
    if(vn<-.28&&r.clock-b.bumpAt>.28){b.bumpAt=r.clock;event(r,'bump',b.id,Math.min(1,-vn));}
  }
  function pole(r,b,px,pz,rad,x,z,u,v,wx=0,wz=0){
    const dx=x-px,dz=z-pz,dist=Math.hypot(dx,dz);
    if(dist>=rad)return false;
    impact(r,b,dist>.0001?dx/dist:1,dist>.0001?dz/dist:0,rad-dist,u,v,wx,wz);return true;
  }
  function paddle(t){
    const angle=t*.98+.38,reach=.24;
    return {x:.53,z:-.92,dx:Math.cos(angle)*reach,dz:Math.sin(angle)*reach,angle};
  }
  function collide(r,b){
    const sin=Math.sin(b.h),cos=Math.cos(b.h),rad=.074,corner=.43;
    for(const offset of [-.080,.082]){
      const u=sin*offset,v=-cos*offset,x=b.x+u,z=b.z+v;
      // A rounded stone pool and continuous capsule island contain each end of the hull.
      const cx=clamp(x,-3.20+corner,3.20-corner),cz=clamp(z,-2.05+corner,2.05-corner);
      const dx=x-cx,dz=z-cz,dist=Math.hypot(dx,dz);
      if(dist>corner-rad)impact(r,b,-dx/dist,-dz/dist,dist-corner+rad,u,v);
      pole(r,b,clamp(x,-.93,.93),0,.60+rad,x,z,u,v);
      for(const g of gates)for(const sign of [-1,1])
        pole(r,b,g.x-sign*g.nz*g.width*.5,g.z+sign*g.nx*g.width*.5,.038+rad,x,z,u,v);
      // Narrow arch has a wooden paddle that can transfer its momentum to a hull.
      pole(r,b,-.24,-1.36,.057+rad,x,z,u,v);
      const p=r.paddle,den=p.dx*p.dx+p.dz*p.dz;
      const t=clamp(((x-p.x)*p.dx+(z-p.z)*p.dz)/den,-1,1);
      if(pole(r,b,p.x+p.dx*t,p.z+p.dz*t,.034+rad,x,z,u,v,-.98*p.dz*t,.98*p.dx*t)&&r.clock-b.bumpAt<.05)
        note(r,b,'水拨拍到了船舷，可以走外孔。');
    }
  }
  function rescue(r,b){
    Object.assign(b,b.anchor,{vx:0,vz:0,omega:0,rudder:0,boost:0,throttle:0,speed:0,recover:1.00,resetHold:0,resetHeld:true});
    b.penalty+=2;b.trail.length=0;note(r,b,'船已放回上一道门　＋2 秒',2.2);event(r,'lift',b.id);
  }
  function move(r,b,k,dt){
    if(b.time!==null){b.throttle=b.boost=0;b.vx*=Math.exp(-dt*4);b.vz*=Math.exp(-dt*4);b.speed=Math.hypot(b.vx,b.vz);b.x+=b.vx*dt;b.z+=b.vz*dt;collide(r,b);return;}
    if(!k.reset)b.resetHeld=false;
    b.resetHold=k.reset&&!b.resetHeld?b.resetHold+dt:0;if(b.resetHold>.72){rescue(r,b);return;}
    if(b.recover>0){b.recover=Math.max(0,b.recover-dt);return;}
    const sin=Math.sin(b.h),cos=Math.cos(b.h),long=b.vx*sin-b.vz*cos;
    b.rudder=mix(b.rudder,clamp(k.x,-1,1),1-Math.exp(-dt*9));
    b.throttle=mix(b.throttle,clamp(-k.z,-1,1),1-Math.exp(-dt*5.7));
    if(!k.boost&&b.charge>.28)b.hot=false;
    b.boost=k.boost&&!b.hot&&b.throttle>.45?1:0;
    b.charge=clamp(b.charge+dt*(b.boost?-.55:.18),0,1);
    if(b.charge===0&&b.boost){b.hot=true;note(r,b,'电机歇一拍，松开直驱键。');}
    const turnSign=long<-.075||Math.abs(long)<.075&&b.throttle<-.2?-1:1;
    const yawRate=b.rudder*turnSign*(.08+2.70*clamp(Math.abs(long)*1.65+.12*Math.abs(b.throttle),0,1));
    b.omega=mix(b.omega,yawRate,1-Math.exp(-dt*5.8));b.h+=b.omega*dt;
    const ahead=b.throttle*(b.throttle<0?.63:1.44+b.boost*.64);
    const accel=b.throttle<-.1&&long>.05?3.6:Math.abs(b.throttle)<.06?.90:2.35;
    const speed=mix(long,ahead*(1-.12*Math.abs(b.rudder)),1-Math.exp(-dt*accel));
    const eta=1-Math.exp(-dt*(b.boost?4.5:6.9)),sx=Math.sin(b.h),cz=Math.cos(b.h);
    const sideways=(b.vx*cz+b.vz*sx)*(1-eta);
    // Water spilling from the small sluice gives a following current in the northern channel.
    const stream=.065*Math.exp(-Math.pow((b.z+1.63)/.24,2))*Math.exp(-Math.pow(b.x/1.45,4));
    b.vx=speed*sx+sideways*cz-stream*dt*4;b.vz=-speed*cz+sideways*sx;
    b.x+=b.vx*dt;b.z+=b.vz*dt;collide(r,b);
    b.speed=Math.hypot(b.vx,b.vz);
    b.roll=mix(b.roll,-b.omega*b.speed*.058,1-Math.exp(-dt*4.4));
    b.pitch=mix(b.pitch,(ahead-long)*.056+Math.sin(r.clock*8+b.id)*.005,1-Math.exp(-dt*6));
    b.heave=.0035*Math.sin(r.clock*4.6+b.id)+.002*b.speed*Math.sin(r.clock*9-b.x);
  }
  function cross(r,b,x,z,dt){
    if(b.time!==null||b.recover>0)return;
    const g=gates[b.gate],before=(x-g.x)*g.nx+(z-g.z)*g.nz,after=(b.x-g.x)*g.nx+(b.z-g.z)*g.nz;
    if(before>=0||after<0||after-before<.000001)return;
    const t=-before/(after-before),side=-(mix(x,b.x,t)-g.x)*g.nz+(mix(z,b.z,t)-g.z)*g.nx;
    if(Math.abs(side)>g.width*.5){note(r,b,'漏了这道门。掉头绕回来，或取回船模。',1.8);return;}
    if(b.gate===2){if(b.z> -1.36)b.inner++;else b.outer++;}
    const along=clamp(side,-g.width*.28,g.width*.28);
    b.anchor={x:g.x+g.nx*.18-g.nz*along,z:g.z+g.nz*.18+g.nx*along,h:Math.atan2(g.nx,-g.nz)};
    b.gate=(b.gate+1)%gates.length;event(r,'gate',b.id);
    if(b.gate!==0)return;
    const stamp=r.elapsed-(1-t)*dt+b.penalty;
    b.splits.push(stamp-b.lapStart);b.lapStart=stamp;b.lap++;
    if(b.lap===laps){b.time=stamp;if(r.firstAt===null)r.firstAt=r.elapsed;event(r,'finish',b.id);note(r,b,'过线！',10);}
    else {event(r,'lap',b.id);note(r,b,'还有最后一圈',1.8);}
  }
  function boatsTouch(r){
    const [a,b]=r.boats;if(a.recover||b.recover||a.time!==null||b.time!==null)return;
    // The keel samples keep a stern tap distinct from two boats rubbing side by side.
    for(const u of [-.065,.066])for(const v of [-.065,.066]){
      const dx=b.x+v*Math.sin(b.h)-a.x-u*Math.sin(a.h),dz=b.z-v*Math.cos(b.h)-a.z+u*Math.cos(a.h);
      const dist=Math.hypot(dx,dz);if(dist>=.127)continue;
      const nx=dist>.001?dx/dist:0,nz=dist>.001?dz/dist:1,d=(.127-dist)*.50;
      a.x-=d*nx;a.z-=d*nz;b.x+=d*nx;b.z+=d*nz;
      const approach=(a.vx-b.vx)*nx+(a.vz-b.vz)*nz;
      if(approach>0){const impulse=approach*.57;a.vx-=nx*impulse;a.vz-=nz*impulse;b.vx+=nx*impulse;b.vz+=nz*impulse;
        if(approach>.18&&r.clock-Math.max(a.bumpAt,b.bumpAt)>.28){event(r,'rub',-1,Math.min(1,approach));a.bumpAt=b.bumpAt=r.clock;}}
    }
  }
  function step(r,k,dt){
    r.clock+=dt;r.paddle=paddle(r.clock);
    if(r.phase==='count'){
      const old=Math.ceil(r.count);r.count=Math.max(0,r.count-dt);
      if(r.count<=1e-6){r.phase='race';r.count=0;event(r,'go');}
      else if(Math.ceil(r.count)!==old)event(r,'count');return;
    }
    if(r.phase!=='race')return;
    r.elapsed+=dt;
    const old=r.boats.map(b=>[b.x,b.z]);
    r.boats.forEach((b,i)=>move(r,b,k[i],dt));boatsTouch(r);
    for(const [i,b] of r.boats.entries()){
      cross(r,b,old[i][0],old[i][1],dt);
      if(r.clock>=b.trailAt){
        b.trailAt=r.clock+.055;
        b.trail.push({x:b.x-.125*Math.sin(b.h),z:b.z+.125*Math.cos(b.h),h:b.h,v:b.speed,t:r.clock});
        if(b.trail.length>37)b.trail.shift();
      }
    }
    if(r.firstAt!==null&&(r.boats.every(b=>b.time!==null)||r.elapsed-r.firstAt>=12)){
      const [a,b]=r.boats;r.phase='result';
      r.winner=a.time===null?1:b.time===null?0:Math.abs(a.time-b.time)<=.035?-1:a.time<b.time?0:1;event(r,'result');
    }
  }
  return {create,confirm,step,gates,laps,paddle};
})();
