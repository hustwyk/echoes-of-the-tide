// The rope eye leaves a moving hand. Its centre, open loop and the two shore
// horns are all in metres in the rendered harbour's coordinate system.
const TideBowCast=(()=>{
  const {clamp}=TideTraversal, gravity=9.81, delivery=.18;
  const ease=t=>t*t*(3-2*t);
  const mix=(a,b,t)=>a+(b-a)*t;
  function create(){
    return {phase:'ready',aim:0,loft:.59,power:0,age:0,velocity:{x:0,y:0,z:0},
      previous:null,flight:null,impact:null,seat:null,wet:0,reels:0,reason:''};
  }
  function turn(g){return g.arrival.bow.aim-g.world.fenders.floatPose.yaw;}
  function hand(g,stroke){
    const a=g.arrival.bow,dx=Math.sin(a.aim),dz=-Math.cos(a.aim);
    return TideArrival.deck(g,1.82+dx*stroke,-1.56+.17*stroke,15.61+dz*stroke);
  }
  function stroke(a){
    if(a.phase==='swing')return mix(-.08-.30*a.power,.42,ease(clamp(a.age/delivery,0,1)));
    if(a.phase==='wind')return -.08-.30*a.power;
    if(a.phase==='air')return mix(.42,-.08,ease(clamp(a.age/.48,0,1)));
    if(a.phase==='retrieve')return -.08+.14*Math.sin(a.reels*5.8);
    return -.08;
  }
  function held(g){
    const a=g.arrival.bow,h=hand(g,stroke(a)),yaw=turn(g);
    const baseTilt=.99-.24*a.power,tilt=a.phase==='swing'?mix(baseTilt,.75,clamp(a.age/delivery,0,1)):baseTilt;
    const rz=.20,splice=rz+.146,reach=splice*Math.cos(tilt);
    return {x:h.x+Math.sin(yaw)*reach,y:h.y+splice*Math.sin(tilt),z:h.z-Math.cos(yaw)*reach,yaw,tilt,rx:.23,rz,wet:a.wet};
  }
  function launch(g,power){
    const a=g.arrival.bow,origin=hand(g,.42),yaw=turn(g),speed=2.25+5.45*power,flat=speed*Math.cos(a.loft);
    const reach=.346*Math.cos(.75);
    return {x:origin.x+Math.sin(yaw)*reach,y:origin.y+.346*Math.sin(.75),z:origin.z-Math.cos(yaw)*reach,yaw,
      vx:Math.sin(yaw)*flat+a.velocity.x,vy:speed*Math.sin(a.loft)+a.velocity.y,vz:-Math.cos(yaw)*flat+a.velocity.z,
      // A small crosswind bends the eye once it has left the hand.
      ax:.22+.08*Math.sin(g.time*.34),az:.10};
  }
  function position(f,t){
    return {x:f.x+f.vx*t+.5*f.ax*t*t,y:f.y+f.vy*t-.5*gravity*t*t,z:f.z+f.vz*t+.5*f.az*t*t};
  }
  function airborne(f,t,wet){
    const v=position(f,t),open=ease(clamp(t/.28,0,1));
    return {...v,yaw:f.yaw,tilt:mix(.75,.045,open),rx:mix(.23,.49,open),rz:mix(.20,.405,open),wet};
  }
  function crossing(f,y){
    const q=f.vy*f.vy+2*gravity*(f.y-y);
    return q>=0?(f.vy+Math.sqrt(q))/gravity:-1;
  }
  function hornClearance(frame,target){
    const c=Math.cos(frame.yaw),s=Math.sin(frame.yaw),depth=frame.rz*Math.cos(frame.tilt);
    function horn(dx){
      const x=target.x+dx-frame.x,z=target.z-frame.z;
      return [(x*c+z*s)/(frame.rx-.033),(x*s-z*c)/(depth-.033)];
    }
    const [x,z]=horn(-.189),[u,v]=horn(.189),dx=u-x,dz=v-z;
    const along=clamp(-(x*dx+z*dz)/(dx*dx+dz*dz),0,1);
    return {outer:Math.max(Math.hypot(x,z),Math.hypot(u,v)),inner:Math.hypot(x+dx*along,z+dz*along)};
  }
  function frame(g){
    const a=g.arrival.bow;
    if(g.arrival.attached){
      const p=TideArrival.cleat(g),seat=a.seat,settle=ease(clamp(a.age/.38,0,1));
      const rest={x:p.x,y:p.y-.059,z:p.z,yaw:0,tilt:0,rx:.218,rz:.106,wet:a.wet};
      if(seat)for(const k of ['x','y','z','yaw','rx','rz','tilt'])rest[k]=mix(seat[k],rest[k],settle);
      return rest;
    }
    if(a.phase==='air')return airborne(a.flight,a.age,a.wet);
    if(a.phase==='retrieve')return {...a.loose,wet:a.wet};
    return held(g);
  }
  function reason(g,point,kind){
    const end=TideArrival.cleat(g),yaw=g.arrival.bow.flight.yaw,x=point.x-end.x,z=point.z-end.z;
    const side=x*Math.cos(yaw)+z*Math.sin(yaw),past=x*Math.sin(yaw)-z*Math.cos(yaw);
    if(kind==='horn')return '绳圈擦过羊角，只套进一头。把圈口对正两只角。';
    if(Math.abs(side)>Math.abs(past))return side>0?'绳圈落在桩右边。下一把向左带一点。':'绳圈落在桩左边。下一把向右带一点。';
    return past<0?'绳圈落短了。多带一点力，或请沈遥再靠近。':'绳圈越过了桩。下一把早些松手。';
  }
  function miss(g,point,kind){
    const a=g.arrival.bow,f=a.flight;
    a.reason=reason(g,point,kind);a.landed=kind;a.loose={...point,tilt:.03};a.phase='retrieve';a.age=0;a.reels=0;
    a.impact={x:point.x,y:point.y,z:point.z,kind,age:0,vx:f.vx,vz:f.vz};
    if(kind==='horn'){
      const end=TideArrival.cleat(g),dx=point.x-end.x,dz=point.z-end.z;
      const radius=Math.max(.001,Math.hypot(dx,dz));a.slip={x:dx/radius,z:dz/radius};
    }
    a.flight=null;
    if(kind==='water')a.wet=1;
    g.arrival.misses++;
    TideArrival.tell(g,kind==='water'?'bowSplash':'bowDrop');
  }
  function fly(g,dt){
    const a=g.arrival.bow,f=a.flight,end=TideArrival.cleat(g);
    // Find the descending crossing exactly, even if both rims pass the horns
    // between two display frames. The target never alters the launch velocity.
    const t=crossing(f,end.y),next=a.age+dt;
    if(t>a.age&&t<=next){
      const at=airborne(f,t,a.wet);
      const horns=hornClearance(at,end);
      if(horns.outer<=1){
        a.seat=at;a.phase='seated';a.age=0;a.flight=null;g.arrival.attached=true;
        const bow=TideArrival.deck(g,TideArrival.castSite.x,TideArrival.castSite.y,TideArrival.castSite.z);
        g.arrival.paidOut=Math.hypot(bow.x-end.x,bow.z-end.z)+.37;
        TideArrival.tell(g,'cleatDrop');return;
      }
      if(horns.inner<=1.08){miss(g,at,'horn');return;}
    }
    // Test the descending centre against actual decks and the local sea.
    // Small substeps keep a narrow quay edge from disappearing at low FPS.
    const count=Math.max(1,Math.ceil(dt*90));
    for(let j=1;j<=count;j++){
      const age=a.age+dt*j/count;if(f.vy-gravity*age>0)continue;
      const p=airborne(f,age,a.wet),prev=position(f,age-dt/count);
      const floor=TideTraversal.surface(g.world,p.x,p.z,Math.max(prev.y,p.y)+.12);
      const water=g.cues.water+TideFloating.swell(p.x,p.z,g.time-dt+dt*j/count);
      const stone=floor?TideTraversal.surfaceHeight(floor,p.x,p.z):-Infinity;
      const ground=Math.max(stone,water);
      if(p.y<=ground+.025){p.y=ground+.025;miss(g,p,stone>=water?'stone':'water');return;}
    }
    a.age=next;
  }
  function step(g,k,dt,pressed,released){
    const a=g.arrival.bow;
    const anchor=TideArrival.deck(g,1.82,-1.52,15.19);
    if(a.previous&&dt>0)for(const key of ['x','y','z'])a.velocity[key]=(anchor[key]-a.previous[key])/dt;
    a.previous=anchor;
    a.wet=Math.max(0,a.wet-dt*.045);
    if(a.impact){a.impact.age+=dt;if(a.impact.age>1.35)a.impact=null;}
    if(g.arrival.attached){a.age+=dt;return;}
    if(g.arrival.radio!=='line'||g.arrival.atBow<.8)return;
    if(a.phase==='air'){fly(g,dt);return;}
    if(a.phase==='retrieve'){
      const p=a.loose;
      if(a.landed==='horn'){
        const drop=Math.min(dt,Math.max(0,.24-a.age));a.age+=dt;
        p.x+=a.slip.x*drop*.56;p.z+=a.slip.z*drop*.56;p.y-=drop*.50;
      }
      if(a.landed==='water'&&a.reels===0)p.y=g.cues.water+TideFloating.swell(p.x,p.z,g.time)+.025;
      if(k.use){
        const h=held(g),dx=h.x-p.x,dy=h.y-p.y,dz=h.z-p.z,d=Math.hypot(dx,dy,dz);
        const fraction=d>.001?Math.min(1,dt*4.1/d):1;
        p.x+=dx*fraction;p.y+=dy*fraction;p.z+=dz*fraction;a.reels+=dt;
        const sill=g.world.fenders.shelf;
        if(Math.abs(p.x-sill.x)<sill.w*.5&&Math.abs(p.z-sill.z)<sill.d*.5)p.y=Math.max(p.y,sill.y+.025);
        p.rx=mix(p.rx,h.rx,fraction);p.rz=mix(p.rz,h.rz,fraction);p.tilt=mix(p.tilt,h.tilt,fraction);
        if(d<.075){a.flight=null;a.phase='ready';a.power=0;}
      }return;
    }
    if(a.phase==='swing'){
      a.age+=dt;if(a.age+1e-7>=delivery){a.flight=launch(g,a.power);a.age=0;a.phase='air';TideArrival.tell(g,'bowCast');}
      return;
    }
    a.aim=clamp(a.aim+k.x*dt*1.48,-1.32,1.32);
    a.loft=clamp(a.loft-k.z*dt*.64,.34,.98);
    if(a.phase==='ready'&&pressed){a.phase='wind';a.power=0;a.reason='';}
    if(a.phase==='wind'){
      if(released){a.phase='swing';a.age=0;}
      else a.power=clamp(a.power+dt/.98,0,1);
    }
  }
  return {create,step,frame,hand,stroke,launch,position,crossing,hornClearance,turn};
})();
