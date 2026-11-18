// The long axis of the launch is X. Axes below are metres in a right-handed
// deck frame with the same YXZ rotation order as the rendered hull.
const TideFloating=(()=>{
  const {clamp}=TideTraversal;
  function basis(p){
    const cy=Math.cos(p.yaw),sy=Math.sin(p.yaw),cp=Math.cos(p.pitch),sp=Math.sin(p.pitch),cr=Math.cos(p.roll),sr=Math.sin(p.roll);
    return {ux:cy*cr+sy*sp*sr,uy:cp*sr,uz:-sy*cr+cy*sp*sr,
      nx:-cy*sr+sy*sp*cr,ny:cp*cr,nz:sy*sr+cy*sp*cr,
      vx:sy*cp,vy:-sp,vz:cy*cp};
  }
  function point(p,x,y,z){
    const a=p.axes;
    return {x:p.x+x*a.ux+y*a.nx+z*a.vx,y:p.y+x*a.uy+y*a.ny+z*a.vy,z:p.z+x*a.uz+y*a.nz+z*a.vz};
  }
  function local(p,x,y,z){
    const a=p.axes,dx=x-p.x,dy=y-p.y,dz=z-p.z;
    return {x:dx*a.ux+dy*a.uy+dz*a.uz,y:dx*a.nx+dy*a.ny+dz*a.nz,z:dx*a.vx+dy*a.vy+dz*a.vz};
  }
  // The sea vertex includes a small horizontal orbital displacement. Invert
  // it before sampling the waterline at a collision or a shore attachment.
  function swell(x,z,t){
    const a=x-.18*Math.cos(.23*x+.11*z+1.12*t);
    return TideLookout.swell(x-.18*Math.cos(.23*a+.11*z+1.12*t),z,t);
  }
  function make(floors,x,y,z,spanX,spanZ,freeboard){
    const p={floors,anchorX:x,anchorY:y,anchorZ:z,x,y,z,spanX,spanZ,freeboard,pitch:0,roll:0,yaw:0,
      heaveSpeed:0,pitchSpeed:0,rollSpeed:0,ready:false,previous:[null,null]};
    p.axes=basis(p);
    for(const floor of floors){floor.buoyant=true;floor.rest={x:floor.x,y:floor.y,z:floor.z};}
    return p;
  }
  function step(p,players,water,t,dt,cx=p.anchorX,cz=p.anchorZ){
    const feet=players.map((actor)=>actor.grounded&&p.floors.includes(actor.ground)?local(p,actor.x,actor.y,actor.z):null);
    const large=p.spanX>3,x=p.spanX,z=p.spanZ;
    const bow=swell(cx+x,cz,t),stern=swell(cx-x,cz,t),port=swell(cx,cz-z,t),starboard=swell(cx,cz+z,t);
    let heave=water+p.freeboard+(bow+stern+port+starboard)*.25;
    let roll=Math.atan((bow-stern)/(2*x))*.90,pitch=-Math.atan((starboard-port)/(2*z))*.79;
    for(let i=0;i<feet.length;i++){
      const f=feet[i];if(!f)continue;
      heave-=large?.024:.063;roll-=clamp(f.x/x,-1,1)*(large?.019:.085);pitch+=clamp(f.z/z,-1,1)*(large?.028:.090);
      if(p.ready&&!p.previous[i]&&players[i].landing>.12)p.heaveSpeed-=players[i].landing*(large?.17:.61);
    }
    pitch=clamp(pitch,-.185,.185);roll=clamp(roll,-.19,.19);
    if(!p.ready){p.y=heave;p.roll=roll;p.pitch=pitch;}
    else{
      p.heaveSpeed+=((heave-p.y)*15-p.heaveSpeed*5.2)*dt;p.y+=p.heaveSpeed*dt;
      p.rollSpeed+=((roll-p.roll)*21-p.rollSpeed*5.8)*dt;p.roll+=p.rollSpeed*dt;
      p.pitchSpeed+=((pitch-p.pitch)*18-p.pitchSpeed*5.6)*dt;p.pitch+=p.pitchSpeed*dt;
    }
    p.x=cx+(large?.115:.145)*Math.sin(t*.76+cz*.27);
    p.z=cz+(large?.11:.085)*Math.cos(t*.86+cx*.33);p.yaw=.026*Math.sin(t*.62+cz*.21);
    p.axes=basis(p);
    for(const f of p.floors){
      const rest=f.rest;
      Object.assign(f,point(p,rest.x-p.anchorX,rest.y-p.anchorY,rest.z-p.anchorZ),{axes:p.axes,pitch:p.pitch,roll:p.roll,yaw:p.yaw});
    }
    for(let i=0;i<feet.length;i++){
      const f=feet[i];if(!f)continue;
      const actor=players[i],next=point(p,f.x,f.y,f.z);
      actor.deckMotion=p.ready&&dt?{x:(next.x-actor.x)/dt,y:(next.y-actor.y)/dt,z:(next.z-actor.z)/dt}:null;
      Object.assign(actor,next);
    }
    p.previous=feet;p.ready=true;
  }
  function spawn(f){
    const p=TideTraversal.spawn(f);
    if(f.buoyant)p.y=TideTraversal.surfaceHeight(f,p.x,p.z);
    return p;
  }
  return {make,step,point,local,swell,spawn};
})();
