// Measurements of the fixed quay edge in the outer berth. Positive Z leads seaward.
const TideFenderCoping=(()=>{
  const {clamp,mix,smooth}=TideTraversal;
  const edgeX=-.78,topY=.68,flatEnd=10.05,ironStart=10.45,ironEnd=11.91;
  const handMin=8.80,handMax=11.67,bodyOffset=.29,reach=1.70;
  function sound(g,id){
    const f=g.fenders;f.contactSound=id;f.contactAt=g.time;f.contactSerial++;
  }
  function charge(wall){
    return smooth(clamp((wall.age-.10)/.36,0,1));
  }
  function aboveGrip(p){
    return p.z>=handMin&&p.z<=handMax&&p.y>topY-1.05;
  }
  function catchEdge(g,oldX,inward){
    const s=g.fenders,p=g.players[1];
    if(s.lastFace!==-1||p.grounded||oldX<edgeX-.04||p.x>edgeX+bodyOffset+.025||!inward)return false;
    if(p.z<handMin||p.z>handMax||p.y+reach<topY-.04||aboveGrip(p))return false;
    s.ledge={phase:'hang',edgeX,topY,z:p.z,travel:0,age:0,dir:0,progress:0,
      catchY:p.y,shift:0,dropLock:true,blockedAt:-2};
    s.wall=null;s.wallBuffer=0;
    p.x=edgeX+bodyOffset;p.yaw=Math.PI*.5;p.vx=p.vy=p.vz=p.speed=0;
    p.ground=null;p.grounded=false;p.cast=p.jumpRise=false;p.jumpBuffer=p.grace=p.launch=0;
    sound(g,'lipCatch');
    if(!s.askedAtEdge){s.askedAtEdge=true;s.queue.push('lipAsk','lipReply');}
    return true;
  }
  // The raised iron is thick enough to stop a boot on both faces. A high
  // airborne foot can pass over it, and the flat shoreward end stays open.
  function guard(p,oldX,oldZ){
    if(p.y>1.05||p.y<topY-.43)return;
    const lo=-1.235-.12,hi=-.832+.18,front=ironStart-.09,back=ironEnd+.09;
    if(p.x<=lo||p.x>=hi||p.z<=front||p.z>=back)return;
    if(oldZ<=front){p.z=front;p.vz=Math.min(0,p.vz);}
    else if(oldZ>=back){p.z=back;p.vz=Math.max(0,p.vz);}
    else if(oldX>=hi||oldX>lo&&p.x>(lo+hi)*.5){p.x=hi;p.vx=Math.max(p.vx,0);}
    else{p.x=lo;p.vx=Math.min(p.vx,0);}
  }
  // Root follows the shift from a two-handed hang to palms, knee and standing foot.
  const mantlePath=[[0,.29,-1.70],[.14,.32,-1.54],[.32,.29,-1.24],[.48,.23,-.95],
    [.61,.11,-.60],[.73,-.08,-.34],[.87,-.32,-.12],[1,-.53,0]];
  function slope(i,axis){
    if(!i||i===mantlePath.length-1)return 0;
    const [a,b,c]=mantlePath.slice(i-1,i+2);
    const u=(b[axis]-a[axis])/(b[0]-a[0]),v=(c[axis]-b[axis])/(c[0]-b[0]);
    return u*v>0?2*u*v/(u+v):0;
  }
  function root(h,out){
    let i=0;
    while(i<mantlePath.length-2&&mantlePath[i+1][0]<h.progress)i++;
    const a=mantlePath[i],b=mantlePath[i+1],span=b[0]-a[0],t=clamp((h.progress-a[0])/span,0,1);
    const ease=smooth(t);
    const axis=j=>mix(a[j],b[j],ease)+span*t*(1-t)*(slope(i,j)*(1-t)-slope(i+1,j)*t);
    out.x=edgeX+axis(1);out.y=topY+axis(2);out.z=h.z;return out;
  }
  function step(g,k,pressed,dt){
    const s=g.fenders,h=s.ledge,p=g.players[1];
    h.age+=dt;p.yaw=Math.PI*.5;
    if(h.phase==='up'){
      const prev=h.progress;h.progress=Math.min(1,h.progress+dt/.95);
      if(prev<.38&&h.progress>=.38)sound(g,'lipLand');
      root(h,p);
      if(h.progress>=1){
        s.ledgeExit={at:g.time,z:h.z,raised:1};s.ledge=null;p.y=topY;p.ground=g.world.fenders.ledge;p.grounded=true;p.grace=.095;p.landing=.45;
      }
      return;
    }
    const stick=Math.abs(k.x)>Math.abs(k.z)?-k.x:k.z;
    h.dir=Math.abs(stick)>.18?stick:0;
    const oldZ=h.z,settle=smooth(clamp(h.age/.34,0,1));
    h.z=clamp(h.z+h.dir*.84*dt*settle,handMin,handMax);
    const delta=h.z-oldZ;h.travel+=delta;h.shift+=Math.abs(delta);
    if(h.shift>.30){h.shift-=.30;sound(g,'lipShift');}
    p.z=h.z;p.x=edgeX+bodyOffset;p.y=mix(h.catchY,topY-reach,settle);
    if(!k.use)h.dropLock=false;
    if(k.use&&!h.dropLock){
      s.ledgeExit={at:g.time,z:h.z,raised:0};s.ledge=null;s.lastFace=0;s.kicks=0;p.x+=.07;p.vx=.75;p.vy=-.75;return;
    }
    if(!pressed||h.age<.34)return;
    if(h.z>flatEnd){
      if(g.time-h.blockedAt>1.1){h.blockedAt=g.time;g.alert('手上方顶着铁盖。沿石边往岸里挪，找一段平顶。',2);}
      return;
    }
    h.phase='up';h.progress=0;h.dir=0;
  }
  function shot(g,i){
    const s=g.fenders,h=s.ledge,exit=s.ledgeExit;
    if(!h&&(!exit||g.time-exit.at>=.54))return null;
    if(!i&&!s.grip[0])return null;
    const t=h?(h.phase==='up'?smooth(h.progress):0):exit.raised,z=h?h.z:exit.z;
    const blend=h?smooth(clamp(h.age/(i?.32:.55),0,1)):1-smooth(clamp((g.time-exit.at)/.54,0,1));
    // Seen end-on, the two sides of the quay frame Lin below and Shen's hands above.
    if(!i)return {eye:[-1.60,1.36+t*.26,15.45],at:[-1.70,-.35+t*.16,10.91],fov:50,blend};
    return {eye:[edgeX+2.48,.94+t*.72,z+1.58],at:[edgeX-.04,topY-.30+t*.65,z-.34],fov:53,blend};
  }
  return {catchEdge,aboveGrip,charge,guard,step,root,shot,flatEnd};
})();
