// A spring trip on the shore gallery and a separate hand-bearing sight on the ship.
const TideTransit=(()=>{
  const clamp=TideTraversal.clamp;
  const active=g=>g.stage===1&&!!g.signal?.heard;
  function speak(g,id){
    const r=g.signal,clip=TideTransitSpeech[id];
    r.voice=id;r.clock=0;g.alert(clip.line,clip.duration);
  }
  function enter(g,announce=true){
    const r=g.signal,w=g.world.signal;
    r.heard=true;r.sent=true;r.shutter=r.glow=1;r.mic='readback';
    g.section.sites[0]=w.test;
    // Shen is listening on shore while the second player has the captain's point of view.
    g.players[1].x=w.radio.x;g.players[1].z=w.radio.z;
    if(announce){speak(g,'readback');g.events.checkpoint?.(g);}
  }
  function sources(g){
    const shore=TideSignal.point(0,4.305,-.82);
    return {shore:[shore.x,shore.y,shore.z],buoy:TideBuoyMotion.lamp(g)};
  }
  function camera(g){
    const r=g.signal,t=g.time,s=TideSignal.ship(g,t);
    const pitch=.028*Math.sin(t*.78),roll=.034*Math.sin(t*.91);
    // Eye on the port bridge wing, clear of the solid wheelhouse and its roof.
    const u=-1.79*Math.cos(roll)-4.60*Math.sin(roll),v=-1.79*Math.sin(roll)+4.60*Math.cos(roll);
    const x=u*Math.cos(s.yaw)-4.25*Math.sin(s.yaw),z=-u*Math.sin(s.yaw)-4.25*Math.cos(s.yaw);
    const eye=[s.x+x,s.y+v*Math.cos(pitch)-z*Math.sin(pitch),s.z+v*Math.sin(pitch)+z*Math.cos(pitch)];
    const bearing=TideSignal.yaw+r.sightX+roll*.20,elevation=.021+r.sightY+pitch*.22;
    const at=[eye[0]+Math.sin(bearing)*Math.cos(elevation),eye[1]+Math.sin(elevation),eye[2]+Math.cos(bearing)*Math.cos(elevation)];
    return {eye,at,bearing,elevation,fov:33,transit:true};
  }
  function delta(cam,p){
    const dx=p[0]-cam.eye[0],dy=p[1]-cam.eye[1],dz=p[2]-cam.eye[2];
    const a=Math.atan2(dx,dz)-cam.bearing;
    return {x:Math.atan2(Math.sin(a),Math.cos(a)),y:Math.atan2(dy,Math.hypot(dx,dz))-cam.elevation};
  }
  function operate(g,k,dt){
    const r=g.signal;
    if(r.marked){
      g.set(0,'收回试光柄，去灯座下找检修梯。',{});g.set(1,'听完驾驶台的回话，准备回到沈遥的话筒。',{});
      if(!r.voice)g.advance();return;
    }
    const pulling=g.engaged[0];
    r.testStroke=clamp(r.testStroke+(pulling?k[0].z*1.65:-1.8)*dt,0,1);
    if(r.testStroke<.18&&r.tripTime>=1.54)r.tripReady=true;
    if(r.testStroke>.78&&r.tripReady){
      r.tripReady=false;r.tripTime=0;r.strokesTest++;g.sound(186,.07);
    }
    r.tripTime+=dt;
    // The trip releases its blade even when the lever is held at the end of its travel.
    r.flag=clamp(Math.min(r.tripTime/.13,(1.32-r.tripTime)/.20),0,1);
    // Screen-right is decreasing bearing in our +Z coordinate convention.
    r.sightX=clamp(r.sightX-k[1].x*dt*.21,-.32,.32);
    r.sightY=clamp(r.sightY-k[1].z*dt*.17,-.23,.23);
    const cam=camera(g),points=sources(g),offset=delta(cam,points.shore);
    const tracking=Math.hypot(offset.x,offset.y)<.028;
    if(tracking){
      if(r.flag>.80)r.darkTime+=dt;
      if(r.darkTime>.16&&r.flag<.20)r.observed=true;
    }else if(!r.observed)r.darkTime=0;
    if(k[1].jump&&g.time-r.strikeAt>.55){
      r.strikeAt=g.time;
      if(tracking&&r.observed&&r.flag<.20&&r.voice!=='readback'){
        r.marked=true;speak(g,'marked');g.sound(503,.09);return;
      }
      const other=delta(cam,points.buoy);
      const why=r.voice==='readback'?'先听完船长的回话':Math.hypot(other.x,other.y)<.035?'这盏灯跟着浪走，刚才一直亮着。再向岸上要一次试光。':tracking?'要在同一个镜心里看清它暗下去，又亮回来。':'准星里还没有一盏完整的灯。';
      g.alert(why,2.4);
    }
    g.set(0,'握住试光柄并向后拉满，让扇片扫过岸灯。船上没看清就推回柄，再试一次。',{
      caption:r.flag>.55?'扇片正经过灯前':r.tripReady?'试光柄已复位':'扇片已弹回，推柄可再试'});
    g.set(1,'转动方位镜，让一盏灯落在中心。看清同一盏灯熄灭又复亮，按确认报出方位。',{
      caption:r.observed?'看见一次完整明灭。对准刚才那盏灯报位。':'左右转镜　上下抬镜　·　留意浪里的那一盏'});
  }
  return {active,enter,speak,operate,camera,sources,delta};
})();
