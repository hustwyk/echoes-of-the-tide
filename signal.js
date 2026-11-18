// The new leading light, the old buoy and the ship share a transit in world space.
// Sending a report and releasing the microphone are separate actions on the one-way radio.
const TideSignal=(()=>{
  const dx=25/Math.hypot(25,10),dz=10/Math.hypot(25,10),yaw=Math.atan2(-dx,-dz);
  const co=Math.cos(yaw),si=Math.sin(yaw),clamp=TideTraversal.clamp,mix=TideTraversal.mix;
  const origin={x:-55,y:0,z:-125.2},length=4.45,hinge={x:0,y:.65,z:5.68};
  const point=(x,y,z)=>({x:origin.x+x*co+z*si,y,z:origin.z-x*si+z*co});
  const local=p=>({x:(p.x-origin.x)*co-(p.z-origin.z)*si,z:(p.x-origin.x)*si+(p.z-origin.z)*co});
  const axes=pitch=>({ux:co,uy:0,uz:-si,vx:-si*Math.cos(pitch),vy:Math.sin(pitch),vz:-co*Math.cos(pitch)});
  const site=(x,y,z,label,kind)=>({...point(x,y,z),label,kind});
  function layout(){
    const floors=[];
    function floor(x,y,z,w,d,kind='signalpier'){
      const a={...point(x,y,z),w,d,kind,active:true,axes:axes(0),yaw,pitch:0,roll:0};floors.push(a);return a;
    }
    const apron=floor(0,0,13.95,13.4,8.1);
    floor(-3.78,.30,9.32,4.0,1.28);floor(3.70,.30,9.32,4.0,1.28);
    const gallery=floor(0,.66,7.14,13.4,3.26);
    floor(4.25,.66,4.18,4.62,3.1);
    const head=floor(0,3.03,-.15,2.20,2.42,'lamppier');
    const bridge=floor(0,0,4,1.45,length,'chainstair');bridge.dynamic=true;
    const starter=site(-3.85,0,12.85,'飞轮起动杆','wheel');
    const pilot=site(3.70,0,12.75,'试灯离合器','breaker');
    const cutout=site(-3.65,.66,7.12,'机房合闸柄','breaker');
    const radio=site(4.32,.66,4.69,'观测窗话筒','radio');
    const chain=site(1.85,.66,6.35,'检修梯手链','winch');
    const shade=site(.05,3.03,.29,'灯头遮光链','brake');
    const entry=[site(-3.7,0,16.82,'入口','wheel'),site(3.7,0,16.82,'入口','breaker')];
    const sections=TideMissions.chapters[2].map((spec,k)=>({
      spec,starts:[entry,[starter,pilot],[cutout,radio]][k],ends:[[starter,pilot],[cutout,radio],[shade,radio]][k],
      sites:[[starter,pilot],[cutout,radio],[{...shade},{...chain}]][k],
      mid:k?gallery:apron,paths:[[],[]],returnDecks:[],danger:[],ferry:null
    }));
    return {floors,sections,style:'dock',signal:{apron,gallery,head,bridge,starter,pilot,cutout,radio,chain,shade}};
  }
  function create(g){
    if(!g.world.signal)return null;
    return {stroke:0,armed:true,rpm:.13,spin:0,trim:.48,linked:false,glow:0,shutter:0,
      sent:false,heard:false,speech:0,mic:'idle',replyAt:0,turn:0,drift:0,arrest:0,
      angle:-.63,velocity:0,walked:false,onHead:false,pinned:false,closed:false,
      early:-3,strokes:0};
  }
  function bridgePose(g){
    const r=g.signal,b=g.world.signal.bridge,pitch=r.angle;
    const feet=g.players.map(p=>{
      if(p.ground!==b)return null;
      const v=(hinge.z-local(p).z)/Math.max(.3,Math.cos(b.pitch));
      return {v:clamp(v,0,length),u:local(p).x};
    });
    Object.assign(b,point(0,hinge.y+Math.sin(pitch)*length*.5,hinge.z-Math.cos(pitch)*length*.5),{pitch,axes:axes(pitch)});
    for(const [i,f] of feet.entries())if(f)Object.assign(g.players[i],point(f.u,hinge.y+Math.sin(pitch)*f.v,hinge.z-Math.cos(pitch)*f.v));
  }
  function begin(g){
    const r=g.signal;if(!r)return;
    if(g.stage>=1){r.linked=true;r.rpm=Math.max(.53,r.rpm);}
    if(g.stage===2){
      r.sent=true;r.heard=true;r.shutter=1;r.glow=1;r.mic='idle';r.speech=0;
      r.turn=Math.max(r.turn,.11);r.drift=Math.max(r.drift,.045);
    }
    bridgePose(g);
  }
  function step(g,dt){
    const r=g.signal;r.spin+=r.rpm*dt*10.7;
    if(g.stage===0)r.rpm=Math.max(.09,r.rpm-dt*.028);
    else if(r.linked){
      const load=g.stage===1&&r.shutter>0?.055:0;
      r.rpm+=((.34+r.trim*.51-load+.030*Math.sin(g.time*1.7))-r.rpm)*(1-Math.exp(-dt*1.9));
    }
    const power=r.shutter*(r.linked?Math.min(1,r.rpm*1.85):0);
    r.glow+=(power-r.glow)*(1-Math.exp(-dt*5.4));
    g.cues.rangeGreen=r.glow;g.cues.light=0;
    if(r.heard){
      const stop=r.mic==='answered';
      if(stop)r.arrest=Math.min(1,r.arrest+dt*.57);
      r.turn+=(1-r.turn)*(1-Math.exp(-dt*.27))*(1-r.arrest);
      r.drift=Math.min(1,r.drift+dt*.083*(1-r.arrest*.88));
    }
    g.cues.vessel=ship(g,g.time);g.cues.wake=r.heard?.24+.66*r.turn*(1-.65*r.arrest):.12;
    if(g.stage===2&&!r.pinned){
      const coasting=g.engaged[1];
      if(!coasting)r.velocity+=(-.32-r.velocity)*(1-Math.exp(-dt*4));
      r.angle=clamp(r.angle+r.velocity*dt,-.63,.78);bridgePose(g);
      if(g.players[0].ground===g.world.signal.bridge){
        if(local(g.players[0]).z<hinge.z-2.5)r.walked=true;
      }
      r.onHead=g.players[0].ground===g.world.signal.head;
    }
  }
  function ship(g,t){
    const r=g.signal,d=51.3-10.7*r.drift,u=.24*Math.sin(t*.14)+1.28*Math.sin(r.drift*Math.PI);
    const p=point(u,0,-d);
    const rotation=yaw+Math.PI-1.04+1.02*r.turn;
    const swell=TideLookout.swell;
    return {x:p.x,y:g.cues.water+.5*(swell(p.x-3,p.z,t)+swell(p.x+3,p.z,t)),z:p.z,yaw:rotation};
  }
  function readySpeed(r){return r.rpm>=.50&&r.rpm<=.82;}
  function start(g,k,dt){
    const r=g.signal,strong=g.engaged[0],rear=g.engaged[1];
    if(strong)r.stroke=clamp(r.stroke+k[0].z*dt*2.05,0,1);
    if(r.stroke<.12)r.armed=true;
    if(r.stroke>.88&&r.armed){
      r.strokes++;r.armed=false;r.rpm=Math.min(.99,r.rpm+.15);g.sound(168+r.rpm*63,.075);
    }
    if(rear)r.trim=clamp(r.trim+k[1].x*dt*.48,0,1);
    const matched=Math.abs(r.rpm-r.trim)<.105,ready=readySpeed(r)&&matched;
    g.state.dials=[r.stroke,r.trim];
    g.set(0,'握住起动杆，向后拉到底，再向前推回。匀速后让同伴接住飞轮',{
      vis:'dial',value:r.rpm,target:.66,band:.16,caption:!r.armed?'回推，让棘爪重新咬齿':r.rpm>.82?'飞轮太快，先让它空转':readySpeed(r)?'转速进入绿弧，等试灯':'拉满一程才会带动飞轮'});
    g.set(1,'左右调离合器，让红针对上正在走的黑针。飞轮在绿弧内时按确认试灯',{
      vis:'dial',value:r.trim,target:r.rpm,band:.105,caption:!readySpeed(r)?'等同伴把飞轮摇进绿弧':matched?'两针已合，可以试灯':r.trim<r.rpm?'红针再往右':'红针再往左'});
    if(g.commit(1,k)&&rear){
      if(strong&&ready){r.linked=true;g.sound(440,.12);g.alert('试灯亮了。回路接住飞轮，岸外的新灯还没合闸。',3);g.advance();}
      else if(g.time-r.early>1.4){r.early=g.time;g.alert(!strong?'等同伴扶住起动杆':'离合器弹开，再看两根针',1.8);}
    }
  }
  function radio(g,k,dt,stop){
    const r=g.signal,active=g.engaged[1],ready=stop?r.closed&&r.glow<.06:r.shutter===1&&r.glow>.85;
    const msg=stop?'立即停止向北线转向':'北线已恢复';
    if(r.mic==='idle'&&g.commit(1,k)){
      if(ready){r.mic='sending';r.speech=0;g.alert('沈遥：海雁，'+msg+'。',2);g.sound(410,.06);}
      else if(g.time-r.early>1.5){r.early=g.time;g.alert(stop?'窗外的第二盏绿灯还亮着，等遮光闸落到底':'先看岸上的新灯亮稳，再发报',1.7);}
    }
    if(r.mic==='sending'){
      if(active)r.speech=Math.min(1,r.speech+dt/(stop?1.50:1.24));
      else if(r.speech<1){r.mic='idle';g.alert('句尾被截断。握住话筒，再完整发一次。',2);}
      else{
        r.mic=stop?'receipt':'listening';r.replyAt=g.time+1.30;
        if(!stop)r.sent=true;g.sound(252,.07);
      }
    }
    if(r.mic===(stop?'receipt':'listening')&&g.time>=r.replyAt){
      if(active){r.replyAt=g.time+.45;}
      else if(stop){
        r.mic='answered';r.replyAt=g.time+2.25;g.alert('梁青：绿灯灭了。舵回中。我们已经进了内流。',3.2);
      }else{
        r.heard=true;r.mic='readback';r.replyAt=g.time+3.85;
        g.alert('梁青：北线可以进入，收到。阿棠，你看着船头。',3.7);
      }
    }
    if((r.mic==='readback'||r.mic==='answered')&&g.time>=r.replyAt)g.advance();
    g.set(1,r.mic==='idle'?'握住话筒，按确认发出「'+msg+'」':r.mic==='sending'?(r.speech<1?'按住操作键说完整句':'松开操作键，把频道交给船长'):r.mic==='answered'?'驾驶台已确认，船头停止偏转':r.mic==='readback'?'看船头，它正转向两盏绿灯之间':'让话筒保持松开，听船长复述',{
      vis:r.mic==='sending'?'dial':'',value:r.speech,caption:r.mic==='sending'?'发话　'+Math.round(r.speech*100)+'%':r.mic==='readback'?'海雁　北线可以进入':'收听驾驶台'});
  }
  function light(g,k,dt){
    const r=g.signal;
    if(g.engaged[0]&&r.shutter===0)r.trim=clamp(r.trim+k[0].x*dt*.49,0,1);
    const stable=r.rpm>.58&&r.rpm<.76;
    if(r.shutter===0&&g.commit(0,k)){
      if(stable){r.shutter=1;g.sound(295,.18);g.alert('机房触点已合。沈遥从窗边看见了第二盏灯。',2.5);}
      else g.alert('调速杆还没进工作区，稍候再合闸',1.7);
    }
    g.state.dials[0]=r.trim;
    g.set(0,r.shutter===0?'左右调整调速杆。转速进工作区后按确认合闸':'合闸柄已锁住，从机房窗口看海雁的船首',{
      vis:r.shutter===0?'dial':'',value:r.rpm,target:.67,band:.09,caption:r.shutter===0?'飞轮调速　·　等待合闸':'岸灯已亮'});
    radio(g,k,dt,false);
  }
  function blackout(g,k,dt){
    const r=g.signal,w=g.world.signal;
    if(!r.pinned){
      if(g.engaged[1])r.velocity+=(k[1].z*.56-r.velocity)*(1-Math.exp(-dt*6));
      g.set(1,'在窗边握住手链，向后收链把检修梯抬起来。保持高度，等同伴插销',{
        vis:'dial',value:(r.angle+.63)/1.41,target:.80,band:.115,caption:r.onHead?'同伴已经站上灯头台':'检修梯仰角 '+Math.round(r.angle*180/Math.PI)+'°'});
      g.set(0,r.onHead?'在灯座旁按住操作键，确认插上止回销':'等同伴抬起检修梯。走到梯尖，跳上灯座的小平台',{
        caption:r.onHead?'止回销就在脚边':r.walked?'梯尖前面还有一道空隙':'检修梯需要从窗口提起'});
      if(r.onHead&&r.walked&&g.commit(0,k)&&g.engaged[1]){
        r.pinned=true;r.velocity=0;r.angle=.51;bridgePose(g);
        Object.assign(g.section.sites[1],w.radio);g.checkpoints=[w.head,w.gallery];
        g.events.checkpoint?.(g);g.sound(514,.12);g.alert('止回销咬住了。沈遥可以放手，回窗边拿话筒。',2.8);
      }
      return;
    }
    if(g.engaged[0]&&!r.closed)r.shutter=clamp(r.shutter-k[0].z*dt*.74,0,1);
    if(!r.closed&&r.shutter<.015){r.closed=true;r.shutter=0;g.sound(170,.18);g.events.checkpoint?.(g);g.alert('灯罩已经到底。旧浮标还亮着，岸上的绿光灭了。',2.8);}
    g.state.dials[0]=r.shutter;
    g.set(0,r.closed?'看船首等回话，遮光闸已落到底':'握住灯头链，向后拉下遮光闸，直到绿光消失',{
      vis:r.closed?'':'dial',value:r.shutter,caption:r.closed?'岸灯熄灭':'灯罩开度 '+Math.round(r.shutter*100)+'%'});
    radio(g,k,dt,true);
  }
  function interact(g,k,dt){
    if(g.stage===0)start(g,k,dt);else if(g.stage===1)light(g,k,dt);else blackout(g,k,dt);
  }
  function checkpoint(g){
    const r=g.signal;return r?.pinned?{pinned:true,closed:r.closed,turn:r.turn,drift:r.drift}:null;
  }
  function restore(g,m){
    if(!g.signal||g.stage!==2||m?.pinned!==true)return;
    const r=g.signal,w=g.world.signal;r.pinned=r.walked=true;r.closed=m.closed===true;
    r.angle=.51;r.velocity=0;r.shutter=r.closed?0:1;r.glow=r.shutter;
    r.turn=Number.isFinite(m.turn)?clamp(m.turn,0,1):.94;
    r.drift=Number.isFinite(m.drift)?clamp(m.drift,0,1):.91;
    bridgePose(g);
    Object.assign(g.section.sites[1],w.radio);g.checkpoints=[w.head,w.gallery];
    g.players=[w.shade,w.radio].map(s=>({...TideTraversal.spawn(s),x:s.x,z:s.z}));
  }
  function stand(g,side,dt){
    const p=g.players[side],s=g.section.sites[side],k=1-Math.exp(-8*dt);
    p.x=mix(p.x,s.x,k);p.z=mix(p.z,s.z,k);
    p.yaw+=Math.atan2(Math.sin(yaw-p.yaw),Math.cos(yaw-p.yaw))*k;
  }
  function target(g,side){
    const w=g.world.signal,r=g.signal;
    if(g.stage===2&&!r.pinned&&side===0&&!r.onHead){
      const tip=point(0,hinge.y+Math.sin(r.angle)*length,hinge.z-Math.cos(r.angle)*length);
      return r.walked?{p:w.head,name:'灯座小平台'}:{p:tip,name:'检修梯梯尖'};
    }
    const s=g.section.sites[side];return {p:s,name:s.label};
  }
  function scope(g){
    const s=g.world.signal.radio,uv=local(s),eye=point(uv.x,s.y+1.58,uv.z-.69);
    return [eye.x,eye.y,eye.z];
  }
  function shot(g,side){
    const r=g.signal,site=g.section.sites[side],u=local(site),cam=(x,y,z,tx,ty,tz,fov)=>{
      const a=point(x,y,z),b=point(tx,ty,tz);return {eye:[a.x,a.y,a.z],at:[b.x,b.y,b.z],fov};
    };
    if(g.stage===1&&TideLookout.active(g))return null;
    if(side===1&&((g.stage===1&&r.shutter===1||g.stage===2&&r.pinned)&&TideCoop.near(g.players[1],site))){
      return cam(3.25,4.45,11.0,.10,1.68,-8.5,55);
    }
    if(side===0&&g.stage===1&&r.shutter===1&&TideCoop.near(g.players[0],site))
      return cam(-3.15,2.20,5.04,-.45,.59,-10.4,60);
    if(!g.engaged[side])return null;
    if(g.stage===2&&!r.pinned&&side===1)return cam(3.24,4.10,8.12,.10,2.73,2.22,57);
    return cam(u.x+(side?1.22:-1.35),site.y+1.86,u.z+1.54,u.x,site.y+1.02,u.z-.63,52);
  }
  return {layout,create,begin,step,interact,checkpoint,restore,stand,ship,target,shot,scope,point,local,yaw,hinge,length};
})();
