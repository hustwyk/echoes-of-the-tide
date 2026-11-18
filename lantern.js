// The lantern room, chart bearings, sight windows and illuminated water use the
// same horizontal coordinate frame. Distances are metres, measured from the lamp.
const TideLantern=(()=>{
  const yaw=1.08,co=Math.cos(yaw),si=Math.sin(yaw),height=21.62,range=[36,55];
  const clamp=(x,lo,hi)=>Math.max(lo,Math.min(hi,x));
  const coords=(x,y,z)=>({x:14+co*x+si*z,y:height+y,z:-91-si*x+co*z});
  const local=p=>({x:(p.x-14)*co-(p.z+91)*si,z:(p.x-14)*si+(p.z+91)*co});
  const chart=(x,d)=>coords(x,-height-4,-d);
  const settings=[
    {name:['遮片横移','遮片倾角'],zero:[.33,.72],pin:['左缘止动销','遮片下沿'],line:['裂片上沿已遮住','残余斜光消失']},
    {name:['辅镜焦距','镜框倾角'],zero:[.70,.28],pin:['镜座卡口','远焦压环'],line:['近窗能分清浪尖','远窗只剩一道清晰白边']},
    {name:['灯轴方位','偏心凸轮'],zero:[.28,.76],pin:['近端棘齿','远端棘齿'],line:['光带穿过侧槽入口','光带穿过转向桩']}
  ];
  function site(x,z,label){
    return {...coords(x,0,z),w:1.2,d:1.4,label};
  }
  function layout(){
    const axes={ux:co,uy:0,uz:-si,vx:-si,vy:0,vz:-co};
    const floor=(x,z,w,d)=>({...coords(x,0,z),w,d,kind:'lanternfloor',axes,pitch:0,yaw,roll:0,active:true});
    const floors=[floor(0,0,12.2,6.8),floor(0,4.55,10.2,2.36),floor(0,-4.55,10.2,2.36)];
    const entrances=[site(-3.65,3.8,'廊梯'),site(3.65,3.8,'廊梯')];
    const ports=[site(-3.55,-5.31,'近端检视窗'),site(3.55,-5.31,'远端检视窗')];
    const drive=site(0,2.82,'灯机调节座');
    const sections=TideMissions.chapters[9].map((spec,i)=>{
      const op=spec.cross?1:0,starts=i===0?entrances:i===1?[drive,ports[1]]:[ports[1],drive];
      const sites=op?[{...ports[0],kind:'lens'},{...drive,kind:'wheel'}]:[{...drive,kind:'wheel'},{...ports[0],kind:'lens'}];
      return {spec,starts,ends:op?[ports[1],drive]:[drive,ports[1]],sites,mid:floors[0],ports,drive,
        paths:[[],[]],returnDecks:[],danger:[],ferry:null};
    });
    return {floors,sections,style:'lens',lantern:true};
  }
  function create(g){
    if(!g.world.lantern)return null;
    const op=g.spec.cross?1:0;
    Object.assign(g.section.sites[1-op],g.section.ports[0]);
    const o={op,phase:0,axes:[.5,.5],reticle:-.85,tag:false,lease:0,stable:0,velocity:0,done:false,stamp:0,actionAt:-3,
      settings:settings[g.stage],observer:1-op};
    if(g.stage===1){
      o.mount={travel:0,angle:0,gate:0,done:false,struck:false};
      handles(g.section,o.mount);
    }
    return o;
  }
  const gauges=[{at:.31,angle:.69},{at:.72,angle:-.55}];
  function trolley(t){return -4.78+3.16*t;}
  function handles(sec,m){
    sec.sites.forEach((s,i)=>Object.assign(s,coords(trolley(m.travel),0,i?.89:-1.15),{label:i?'镜框转把':'镜车推杆'}));
  }
  function transfer(g,input,dt){
    const m=g.optic.mount,gate=gauges[m.gate],together=g.engaged.every(Boolean);
    if(g.engaged[1])m.angle=clamp(m.angle+input[1].x*dt*.85,-1.1,1.1);
    const delta=together?-input[0].z*dt*.19:0;
    let next=clamp(m.travel+delta,0,1);
    if(gate&&next>=gate.at){
      if(Math.abs(m.angle-gate.angle)>.085){
        next=gate.at;
        if(!m.struck){m.struck=true;g.sound(147,.11);g.alert('镜框碰到了导靴。停车，照着铜槽的方向转。',2);}
      }else if(delta>0){m.gate++;m.struck=false;g.sound(466,.12);g.events.checkpoint?.(g);g.alert(m.gate===1?'第一副导靴已张开，下一副向另一侧偏':'第二副导靴已张开，推到底座');}
    }
    if(!delta)m.struck=false;
    const motion=coords(trolley(next),0,0),old=coords(trolley(m.travel),0,0);
    g.players.forEach((p,i)=>{if(g.engaged[i]){p.x+=motion.x-old.x;p.z+=motion.z-old.z;}});
    m.speed=Math.abs(next-m.travel)*3.16/dt;
    m.travel=next;handles(g.section,m);
    g.set(0,'握住推杆，向前推镜车，向后退车。听守镜人的口令',{caption:'辅镜入座　·　通过导靴 '+m.gate+' / 2'});
    g.set(1,'握住转把，左右转动镜框，使镜片的边沿与前方铜槽平行',{
      caption:!gate?'两副导靴已经通过':Math.abs(m.angle-gate.angle)<.085?'镜框与导槽平行，可以推':gate.angle>m.angle?'镜框还要向右转':'镜框还要向左转'});
    if(next>=1){
      m.done=true;Object.assign(g.section.sites[g.optic.op],g.section.drive);
      Object.assign(g.section.sites[g.optic.observer],g.section.ports[0]);
      g.events.checkpoint?.(g);g.alert('辅镜已装入灯座。沈遥摇焦距手轮，林澈去近窗看浪纹。',4);g.sound(610,.15);
    }
  }
  function viewData(g){
    const o=g.optic,phase=o.phase,cal=o.settings.zero,stage=g.stage;
    const near=(o.axes[0]-cal[0])*(stage===2?9:7);
    const far=near*1.45+(o.axes[1]-cal[1])*(stage===2?12:9);
    const err=[near,far],e=err[phase],d=range[phase],mark=chart(0,d);
    // Low swell moves the apparent waterline under the stationary engraved fork.
    const water=TideLookout.swell(mark.x,mark.z,g.time);
    const dy=o.reticle-water;
    const band=stage===0?.25:stage===1?.18:.22;
    const fit=Math.abs(e)<band;
    function image(error){
      if(stage===0)return {x:0,twin:2.25+error*.52,width:.27,power:clamp(1+Math.min(0,error)*.68,.02,1),ghost:clamp(error*.85,0,1)};
      if(stage===1)return {x:0,twin:error*.49,width:.23+Math.abs(error)*.63,power:1,ghost:clamp(Math.abs(error)*.70,0,.68)};
      return {x:error,twin:error,width:.32,power:1,ghost:0};
    }
    return {phase,e,d,mark,dy,water,fit,level:Math.abs(dy)<.40,images:err.map(image)};
  }
  function hint(g,data){
    const {e,fit}=data;
    if(fit)return g.optic.settings.line[g.optic.phase];
    if(g.stage===0)return e>0?'右边还有一条细黄光，收遮片':'主光也被切暗了，退一点';
    if(g.stage===1)return e>0?'浪尖拖着朝右的淡边，向左回焦':'光雾在左边散开，向右进焦';
    return e>0?'光带落在刻叉右边，向左回':'光带落在刻叉左边，向右进';
  }
  function setPhase(g){
    const o=g.optic;
    if(o.phase===1){o.done=true;g.advance();return;}
    o.phase=1;o.tag=false;o.stable=0;o.reticle=.98;
    Object.assign(g.section.sites[o.observer],g.section.ports[1]);
    g.checkpoints[o.op]=g.section.drive;g.checkpoints[o.observer]=g.section.ports[0];
    g.events.checkpoint?.(g);
    g.alert(['近端已锁。走到外环另一端，看遮片的下沿。','镜座已扣紧。到另一扇窗复查远处的浪纹。','近端锁定。换到远窗，核对安全带的出口。'][g.stage],3.5);
  }
  function interact(g,keys,dt){
    const o=g.optic,k=o.phase,op=o.op,obs=o.observer;
    if(o.mount&&!o.mount.done){transfer(g,keys,dt);return;}
    const prev=o.axes[k];
    if(g.engaged[op])o.axes[k]=clamp(o.axes[k]+keys[op].x*dt*.30,0,1);
    if(g.engaged[obs])o.reticle=clamp(o.reticle-keys[obs].z*dt*.92,-1.8,1.8);
    o.velocity+=(Math.abs(o.axes[k]-prev)/dt-o.velocity)*(1-Math.exp(-8*dt));
    const data=viewData(g),both=g.engaged.every(Boolean),settled=o.velocity<.07,good=both&&data.fit&&data.level&&settled;
    o.stable=good?o.stable+dt:0;
    if(o.tag&&(!good||g.time>o.lease))o.tag=false;
    const received=o.tag;
    const report=hint(g,data),port=k?'远窗':'近窗';
    const axis=o.settings.name[k];
    g.state.dials[op]=o.axes[k];g.state.dials[obs]=(o.reticle+1.8)/3.6;
    g.cues.light=.97;g.cues.rays=data.images;
    g.set(op,'握住手轮，左右调'+axis+'。收到窗口的双响后按确认锁住', {
      caption:o.tag?'收到复核　·　现在锁住'+o.settings.pin[k]:axis+'　·　行程 '+Math.round(o.axes[k]*100)+' 格　·　等待'+port+'回话'});
    g.set(obs,'在'+port+'握住检视镜，前后调横丝贴住浮环白边。看清以后按确认发报',{
      caption:o.tag?'已敲两响，保持镜位':report+'　·　'+(data.level?'横丝贴到白边':data.dy>0?'压低横丝':'抬高横丝')});
    if(g.commit(obs,keys)&&!o.tag){
      if(o.stable>.22){o.tag=true;o.lease=g.time+4.3;o.stamp++;g.sound(550,.11);g.alert(port+'双响。机房可以落销。',2.1);}
      else if(g.time-o.actionAt>1.1){o.actionAt=g.time;g.alert(!g.engaged[op]?'机房还没有握住手轮':!data.fit?report:!settled?'手轮仍在转，等同伴停稳':!data.level?'纵丝已经对上，横丝还没贴到浪线':'让光和横丝稳住片刻，再敲两响',1.6);}
    }
    if(g.commit(op,keys)&&received&&good){g.sound(320,.18);setPhase(g);}
  }
  function checkpoint(g){
    const o=g.optic,m=o?.mount;
    if(!o||!o.phase&&!m?.gate&&!m?.done)return null;
    return {far:!!o.phase,near:o.axes[0],guide:m?.gate??0,installed:!!m?.done};
  }
  function restore(g,mark){
    const o=g.optic;
    if(!o||!mark||typeof mark!=='object')return;
    const far=mark.far===true;
    if(o.mount){
      const m=o.mount,gate=Number.isInteger(mark.guide)?clamp(mark.guide,0,2):0;
      m.done=mark.installed===true||far;m.gate=m.done?2:gate;
      m.travel=m.done?1:gate?gauges[gate-1].at:0;
      m.angle=gate?gauges[gate-1].angle:0;
      if(!m.done)handles(g.section,m);
      else Object.assign(g.section.sites[o.op],g.section.drive);
    }
    if(far){
      o.phase=1;o.axes[0]=Number.isFinite(mark.near)?clamp(mark.near,o.settings.zero[0]-.036,o.settings.zero[0]+.036):o.settings.zero[0];
      o.reticle=.98;
    }
    if(!o.mount||o.mount.done)Object.assign(g.section.sites[o.observer],g.section.ports[o.phase]);
    g.checkpoints=g.section.sites.map(s=>({...s}));
    g.players=g.checkpoints.map(s=>({...TideTraversal.spawn(s),x:s.x,z:s.z}));
    g.cues.rays=viewData(g).images;
  }
  function stance(g,i,dt){
    const o=g.optic,p=g.players[i],site=g.section.sites[i],k=1-Math.exp(-8*dt);
    const angle=o.mount&&!o.mount.done?yaw+(i?0:Math.PI):i===o.op?yaw:sight(g,o.phase).yaw;
    p.x+=(site.x-p.x)*k;p.z+=(site.z-p.z)*k;
    p.yaw+=Math.atan2(Math.sin(angle-p.yaw),Math.cos(angle-p.yaw))*k;
  }
  function collide(p){
    const at=local(p),x=at.x,z=at.z;
    if(p.y>height+3||p.y<height-.45||Math.abs(x)>=1.45||z<=-1.15||z>=2.04)return;
    const zs=z>.44?2.04:-1.15;
    if(1.45-Math.abs(x)<Math.abs(zs-z))at.x=x<0?-1.45:1.45;else at.z=zs;
    const fixed=coords(at.x,0,at.z);p.x=fixed.x;p.z=fixed.z;
  }
  function sight(g,k){
    const port=g.section.ports[k],eye={x:port.x,y:port.y+1.56,z:port.z},target=chart(0,range[k]);
    const dx=target.x-eye.x,dz=target.z-eye.z;
    return {eye,at:target,yaw:Math.atan2(-dx,-dz)};
  }
  // Retract the third-person camera before it crosses a window or the opaque lamp casing.
  function cameraArm(p,eye){
    const start=local(p),end=local(eye),dx=end.x-start.x,dz=end.z-start.z;
    let length=1;
    if(dx>0)length=Math.min(length,(5.85-start.x)/dx);
    if(dx<0)length=Math.min(length,(-5.85-start.x)/dx);
    if(dz>0)length=Math.min(length,(5.47-start.z)/dz);
    if(dz<0)length=Math.min(length,(-5.47-start.z)/dz);
    const slab=(at,d,min,max)=>{
      if(Math.abs(d)<.001)return at>min&&at<max?[-Infinity,Infinity]:[Infinity,-Infinity];
      const a=(min-at)/d,b=(max-at)/d;return [Math.min(a,b),Math.max(a,b)];
    };
    const xt=slab(start.x,dx,-1.38,1.38),zt=slab(start.z,dz,-1.19,2.01);
    const enter=Math.max(xt[0],zt[0]),leave=Math.min(xt[1],zt[1]);
    if(enter>=0&&enter<leave)length=Math.min(length,enter-.045);
    length=clamp(length,.10,1);
    return coords(start.x+dx*length,Math.min(3.46,p.y-height+1.49+(eye.y-p.y-1.49)*length),start.z+dz*length);
  }
  function shot(g,i){
    const o=g.optic;if(!o||!g.engaged[i])return null;
    const arr=p=>[p.x,p.y,p.z];
    if(o.mount&&!o.mount.done){
      const m=o.mount,x=trolley(m.travel);
      const eye=i?coords(x-.30,2.42,1.45):coords(x-1.37,1.66,-2.43);
      const at=coords(x+(i?.60:.25),1.10,-.14);return {eye:arr(eye),at:arr(at),fov:57};
    }
    if(i===o.observer){const s=sight(g,o.phase);return {eye:arr(s.eye),at:arr(s.at),fov:o.phase?27:32};}
    const eye=coords(i?1.24:-1.24,1.62,3.69),at=coords(.05,1.29,1.79);
    return {eye:arr(eye),at:arr(at),fov:55};
  }
  return {layout,create,interact,trolley,gauges,checkpoint,restore,stance,collide,cameraArm,shot,sight,viewData,coords,local,chart,range,yaw,height};
})();
