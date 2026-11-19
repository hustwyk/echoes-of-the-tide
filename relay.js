// The original transfer, both carbons and the narrow-beam set share one weather station.
const TideRelay=(()=>{
  const {clamp}=TideTraversal,origin={x:-34,y:0,z:-83},words=['林澈','只验了','灯机','北线','没有','复测'];
  const point=(x,y,z)=>({x:origin.x+x,y,z:origin.z+z});
  const site=(kind,label,x,y,z,index=0)=>({...point(x,y,z),kind,label,index});
  function layout(){
    const floors=[];
    const slab=(kind,x,y,z,w,d)=>{const f={...point(x,y,z),kind,w,d,active:true};floors.push(f);return f;};
    const base=slab('relayPier',-.15,0,.50,13.3,13);
    const lower=slab('relayRest',-5.40,2.04,-1.48,1.28,1.76);
    const upper=slab('relayHead',-2.68,4.56,-3.37,4.02,2.20);
    const car=slab('relayCar',TideRelayTrolley.railX(1),2.02,-1.47,1.43,1.18);car.dynamic=true;
    const foot=site('lower','塔脚爬梯',-5.40,0,-.28),rest=site('rest','下层歇脚板',-5.40,2.04,-1.24);
    const lift=site('upper','上段爬梯',-1.52,2.02,-1.49),mast=site('mast','桅顶天线',-2.74,4.56,-3.04);
    const haul=site('haul','横移绞盘',-.05,0,3.30),desk=site('desk','更正发报台',3.70,0,-4.04);
    const files=['事故摘要','本次交接联','今夜值班簿'].map((label,i)=>site('file',label,2.05+1.35*i,0,.79,i));
    const start=[point(-4.58,0,3.5),point(.42,0,5.15)],end=[mast,desk];
    const sections=TideMissions.chapters[7].map((spec,k)=>({spec,starts:k?end:start,ends:end,sites:end,
      mid:base,paths:[[],[]],danger:[],returnDecks:[],ferry:null}));
    return {floors,sections,style:'bridge',relay:{base,lower,upper,car,foot,rest,lift,mast,haul,desk,files,eye:point(-2.74,6.03,-3.66)}};
  }
  function create(g){
    return g.world.relay?{climb:'',low:false,top:false,travel:1,trolley:TideRelayTrolley.create(),boarded:false,file:-1,rejected:false,loaded:false,
      yaw:.28,pitch:-.14,actualYaw:0,actualPitch:0,reference:null,strength:0,lock:0,cursor:0,
      mask:Array(6).fill(false),tried:Array(6).fill(false),signed:[false,false],voice:'',clock:0,
      message:null,line:-1,subtitle:'',sum:0,samples:0,stageMode:'',gripTime:0}:null;
  }
  function begin(g){
    const r=g.relay;if(!r)return;
    r.stageMode='';r.voice='';r.clock=0;r.message=null;r.line=-1;r.subtitle='';r.lock=0;
    g.cues.water=-3.45;
    if(g.stage>=1){r.top=r.low=r.loaded=true;r.file=1;r.climb='';TideRelayTrolley.reset(g,true);}
    if(g.stage===2){r.mask.fill(true);r.tried.fill(true);}
  }
  function nearestFile(g){
    const p=g.players[1];return g.world.relay.files.reduce((a,b)=>Math.hypot(p.x-a.x,p.z-a.z)<Math.hypot(p.x-b.x,p.z-b.z)?a:b);
  }
  function target(g,i){
    const r=g.relay,w=g.world.relay;
    if(!i){
      if(r.top||g.stage)return w.mast;
      if(r.climb==='upper')return w.lift;
      if(r.climb==='lower'||!r.low||g.players[0].y<1.3&&!r.climb)return w.foot;
      return g.players[0].ground===w.car?w.lift:{...w.car,label:'横移踏板',kind:'car'};
    }
    if(g.stage||r.loaded)return w.desk;
    if(!r.top&&r.climb!=='upper')return w.haul;
    return r.file<0||r.rejected?nearestFile(g):w.desk;
  }
  function near(g,i){
    const r=g.relay,w=g.world.relay,p=g.players[i],s=target(g,i);
    if(!i&&r.climb)return true;
    if(!i&&s===w.lift)return p.grounded&&p.ground===w.car;
    if(s.kind==='car')return false;
    if(s===w.mast&&p.ground!==w.upper)return false;
    return p.grounded&&Math.abs(p.y-s.y)<.38&&Math.hypot(p.x-s.x,p.z-s.z)<(s.kind==='file'?.77:1.03)&&
      (s===w.foot||p.z>=s.z-.38);
  }
  function secure(g){g.events.checkpoint?.(g);}
  function vessel(g,t){
    const x=-17+3.9*Math.sin(t*.067+.41),z=-110+1.15*Math.sin(t*.052-.40);
    return [x,g.cues.water+.5*(TideLookout.swell(x-3,z,t)+TideLookout.swell(x+3,z,t)),z];
  }
  function bearing(g){
    const e=g.world.relay.eye,p=vessel(g,g.time),dx=p[0]-e.x,dz=p[2]-e.z;
    return {yaw:Math.atan2(dx,-dz),pitch:Math.atan2(p[1]+3.7-e.y,Math.hypot(dx,dz))};
  }
  function winds(g){
    const t=g.time,amp=g.stage===0?.42:g.stage===1?1:.82;
    return {yaw:amp*(.071*Math.sin(t*.89)+.029*Math.sin(t*1.58+.7)),
      pitch:amp*(.033*Math.sin(t*1.14-.4)+.016*Math.cos(t*.58))};
  }
  function wind(g){return Math.sin(g.time*1.35+.18);}
  function step(g,dt,driver){
    const r=g.relay;
    TideRelayTrolley.move(g,driver,dt);
    const gust=winds(g),aim=bearing(g);
    r.actualYaw=r.yaw+gust.yaw;r.actualPitch=r.pitch+gust.pitch;
    r.strength=Math.exp(-Math.pow((r.actualYaw-aim.yaw)/.098,2)-Math.pow((r.actualPitch-aim.pitch)/.076,2));
  }
  function collision(g,p){
    const w=g.world.relay;
    for(const [s,rad] of [[w.haul,.37],[w.desk,.46],[w.mast,.35],...w.files.map(f=>[f,.38])]){
      if(Math.abs(p.y-s.y)>.85)continue;
      const x=p.x-s.x,z=p.z-s.z+.61,d=Math.hypot(x,z);
      if(d>=rad)continue;
      const nx=d?x/d:0,nz=d?z/d:1;
      p.x=s.x+nx*rad;p.z=s.z-.61+nz*rad;
      const dot=p.vx*nx+p.vz*nz;if(dot<0){p.vx-=dot*nx;p.vz-=dot*nz;}
    }
  }
  function stance(g,i,dt){
    const p=g.players[i],s=target(g,i);
    if(!i&&!g.relay.top){
      if(p.ground===g.world.relay.car){
        const c=p.ground,k=1-Math.exp(-dt*9);
        p.x+=(c.x-p.x)*k;p.z+=(c.z+.13-p.z)*k;
        p.yaw+=Math.atan2(-Math.sin(p.yaw),Math.cos(p.yaw))*k;
      }
      return;
    }
    const k=1-Math.exp(-dt*9);const x=s.x+(i&&g.stage===2?.58:!i&&g.stage===2?-.13:0);
    p.x+=(x-p.x)*k;p.z+=(s.z-p.z)*k;
    p.yaw+=Math.atan2(Math.sin(-p.yaw),Math.cos(p.yaw))*k;
  }
  function climb(g,k,dt){
    const r=g.relay,w=g.world.relay,p=g.players[0];
    if(r.climb===''){
      const s=target(g,0);
      if(!k.use||!near(g,0)||(s!==w.foot&&s!==w.lift))return false;
      if(s===w.lift&&(!r.trolley.locked||!k.jump))return false;
      r.climb=s===w.foot?'lower':'upper';r.gripTime=0;
      g.sound(253,.08);
    }
    const upper=r.climb==='upper',bottom=upper?2.02:0,top=upper?4.56:2.04,s=upper?w.lift:w.foot;
    const last=p.y;const next=clamp(p.y-k.z*1.55*dt,bottom,top);
    r.gripTime+=dt;p.x+=(s.x-p.x)*Math.min(1,dt*15);p.y=next;
    const front=upper?-1.64:-.28,back=upper?-2.81:-1.21;
    const mantle=clamp((next-top+.54)/.54,0,1);
    p.z=origin.z+front+(back-front)*mantle;
    p.yaw=0;p.vx=p.vy=p.vz=0;p.ground=null;p.grounded=false;p.jumpBuffer=p.grace=0;
    p.speed=Math.abs(next-last)/Math.max(.001,dt);
    if(next>=top&&k.z<0){
      r.climb='';p.ground=upper?w.upper:w.lower;p.grounded=true;p.grace=.095;p.speed=0;
      if(upper){r.top=true;g.checkpoints[0]=w.mast;g.alert('桅顶夹座刻着「本次交接」。把六天前签的单子拿来。',3.4);}
      else{r.low=true;g.checkpoints[0]=w.rest;g.alert('先让下层绞盘把踏板收到近端，再跳上去。');}
      secure(g);
    }else if(next<=bottom&&k.z>.2){
      r.climb='';p.ground=upper?w.car:w.base;p.grounded=true;p.grace=.095;p.speed=0;
      if(!upper)r.boarded=false;
    }
    return true;
  }
  function startVoice(g,id,mode){
    const r=g.relay;r.voice=id;r.clock=0;r.line=-1;r.subtitle='';r.stageMode=mode;r.sum=r.samples=0;
  }
  function stopVoice(r){r.voice='';r.clock=0;r.line=-1;r.subtitle='';r.stageMode='';}
  function tune(g,k,dt){
    const r=g.relay;
    if(g.engaged[0]&&r.top){
      r.yaw=clamp(r.yaw+k.x*dt*.36,.09,1.23);
      r.pitch=clamp(r.pitch-k.z*dt*.27,-.59,.20);
    }
    r.lock=r.strength>.53&&g.engaged[0]?Math.min(1,r.lock+dt*2.9):0;
  }
  function arrive(g,input,dt){
    const r=g.relay,w=g.world.relay,p=g.players[0],s=target(g,1);
    if(!r.top){
      const h=r.trolley,onDeck=p.ground===w.car;
      TideRelayTrolley.insert(g,input[0],dt);
      if(onDeck&&!r.boarded)g.sound(174,.06);
      r.boarded=onDeck;
      const action=r.climb?'前推上爬，后拉可沿梯退回。':!r.low||p.y<1.3?'到外梯脚按操作键抓牢，前推上爬。':
        !onDeck?'等沈遥收回踏板，再向右跳上去。':h.locked?'保持握持，按跳跃换手接梯，前推登顶。':
        h.missed&&!h.blocked?'销头落空了。后拉收回，报出梯座的方向。':h.blocked?'销尖顶住了。后拉收销，报出偏差，再前推。':'握住插销，看梯座报左右。沈遥抱闸后，前推入孔。';
      g.set(0,action,{caption:onDeck?(h.locked?'插销已穿过梯座':TideRelayTrolley.direction(h)):(r.climb==='upper'?'上段爬梯':r.low?'下层歇脚板 · 安全索':'下段爬梯')});
      if(s===w.haul)g.set(1,h.locked?'已听见闩响。等林澈接上梯，去稿架取件。':onDeck?
        '听林澈报孔位。左右点动绞盘，松方向并继续握持即可抱闸。':'握住绞盘向左收车，等同伴跳上踏板。',{
        caption:(onDeck?'踏板承重':'空载')+'　·　'+(h.brake>.78?'已抱闸':h.driver?'绞盘在手':'绞盘松开')});
    }
    if(s.kind==='file'){
      g.set(1,'走到稿架的三份原件前，核对桅顶同伴要的日期。握住纸角并确认取件。',{caption:'稿架　'+s.label});
      if(g.commit(1,input)){r.file=s.index;r.rejected=false;g.sound(355,.10);g.alert('把选中的原件带到发报台的压纸辊。');}
    }else if(s===w.desk&&!r.loaded){
      g.set(1,'把交接原件带到发报桌，握住压纸辊并确认送入。',{caption:'手中　'+w.files[r.file].label});
      if(g.commit(1,input)){
        if(r.file!==1){r.rejected=true;g.alert('落款不合。拿回稿架，找这次移交时签的那一联。');return;}
        r.loaded=true;secure(g);g.sound(481,.11);g.alert('更正底联已装好。桅顶报出北岬和自己的姓。');
      }
    }
    if(!r.top)return;
    tune(g,input[0],dt);
    g.set(0,'在桅顶握住天线。左右转向、前后抬俯，瞄住船的驾驶台。底联到位后按确认报呼号。',{
      vis:'dial',value:r.strength,caption:'北岬　·　需要六日前交接联　·　'+(r.loaded?'底联已装':'等待原件')});
    if(r.loaded)g.set(1,'在发报台压住监听键，等林澈报出自己的呼号。',{caption:r.voice?'岸船通话':'呼号栏　待接通'});
    if(r.loaded&&!r.voice&&r.lock>=1&&g.engaged[1]&&g.commit(0,input))startVoice(g,'checkin','checkin');
  }
  function choose(g,input,dt){
    const r=g.relay;
    if(!r.voice&&g.engaged[1])r.cursor=clamp(r.cursor+input[1].x*dt*3.55,0,5);
    const j=Math.round(r.cursor),stripe=Math.floor(j/3)*3,started=r.tried.slice(stripe,stripe+3).some(Boolean);
    const copy=words.map((s,i)=>r.mask[i]?s:r.tried[i]?'□':'·').join(' ');
    g.set(0,'转动天线，让瞄环跟住真正的船。风会推偏桅顶，听同伴报出最后收到的方位。',{
      vis:'dial',value:r.strength,caption:'跟踪 '+Math.round(r.strength*100)+'%　·　真方位 '+Math.round(r.actualYaw*180/Math.PI)+'°'});
    g.set(1,r.voice?'观察回执纸。收到的字会留下，空格可以逐字重发。':'握住发报桌左右移字车，在行首确认送出三段。遇到缺口，把字车移回缺字再确认。',{
      caption:'字车「'+words[j]+'」　·　'+copy+'　·　上次船向 '+(r.reference==null?'…':Math.round(r.reference*180/Math.PI)+'°')});
    if(r.voice||!g.commit(1,input))return;
    if(r.mask[j]){g.alert('这个字已收在底联，移到没有印字的位置。');return;}
    if(!started&&j!==stripe){g.alert('新的一行要从左边的行首送入。');return;}
    if(stripe===3&&!r.mask.slice(0,3).every(Boolean)){g.alert('先把灯机验收这一行补齐。');return;}
    if(!g.engaged[0]||r.strength<.22){g.alert('驾驶台的载波还没有进瞄环。');return;}
    r.message=started?[j]:[stripe,stripe+1,stripe+2];startVoice(g,'word'+r.message[0],'word');
  }
  function signatures(g,input){
    const r=g.relay,side=r.signed[0]?1:0;
    g.set(0,r.signed[0]?'继续托住天线，让沈遥的署名送到船上。':'握住桅顶送话柄，瞄稳驾驶台后亲手按确认，为灯机验收署名。',{
      vis:'dial',value:r.strength,caption:r.signed[0]?'林澈　签收':'灯机验收　待林澈署名'});
    g.set(1,r.signed[0]?'在自己的落款处按确认，说清楚是谁发出了通航消息。':'听完林澈自己的话，等第一枚署名落下。',{
      caption:'航线通报　'+(r.signed[1]?'沈遥　签收':'待沈遥署名')});
    if(!r.voice&&r.lock>=1&&g.engaged.every(Boolean)&&g.commit(side,input))startVoice(g,side?'shen':'lin','sign');
  }
  function voice(g,dt){
    const r=g.relay;if(!r.voice)return;
    const clip=TideRelaySpeech[r.voice];r.clock+=dt;
    const line=clip.lines.findLastIndex(row=>r.clock>=row[0]);
    if(line!==r.line){r.line=line;r.subtitle=line<0?'':clip.lines[line][1];if(r.subtitle&&r.stageMode!=='word')g.events.log?.(r.subtitle);}
    const check=r.stageMode==='checkin'||r.stageMode==='sign'||r.stageMode==='word';
    if(check&&r.clock>.04&&r.clock<clip.duration-.035){
      r.samples+=dt;r.sum+=dt*(g.engaged[0]?r.strength:0);
    }
    if(r.clock<clip.duration)return;
    const mode=r.stageMode,id=r.voice,ok=r.samples>.01&&r.sum/r.samples>.49;
    stopVoice(r);
    if(mode==='word'){
      const j=r.message.shift();r.tried[j]=true;
      if(ok){r.mask[j]=true;r.reference=bearing(g).yaw;}secure(g);
      g.sound(ok?580:155,.066);
      if(r.message.length){startVoice(g,'word'+r.message[0],'word');return;}
      r.message=null;
      if(r.mask.every(Boolean)){startVoice(g,'carback','verified');return;}
      if(r.mask[3]&&!r.mask[4]&&r.mask[5]){startVoice(g,'missing','gap');return;}
      g.alert(r.mask[j]?'这一段已印在回单上。':'收纸的地方是空的。对准船，再补这一段。');return;
    }
    if(mode==='gap')return;
    if(mode==='sign'||mode==='checkin'){
      if(!ok){g.alert('海雁没有听清这句。前面的回执留着，瞄稳后重发本句。');return;}
      r.reference=bearing(g).yaw;
      if(mode==='checkin'){startVoice(g,'stationreply','checked');return;}
      r.signed[id==='lin'?0:1]=true;secure(g);
      if(id==='shen')startVoice(g,'answer','answered');
      else g.alert('林澈的署名收到了。现在轮到沈遥自己说。');
      return;
    }
    if(['verified','answered','checked'].includes(mode))g.advance();
  }
  function interact(g,input,dt){
    const r=g.relay;
    if(g.stage===0){
      arrive(g,input,dt);
      const h=r.trolley;
      if(!r.voice){
        if(!h.dialogue&&r.boarded&&h.driver){h.dialogue=1;startVoice(g,'transferBoard','trolley');}
        else if(h.locked&&h.dialogue===1){h.dialogue=2;startVoice(g,'transferPin','trolley');}
      }
    }
    else{
      if(TideLookout.active(g)){
        TideLookout.interact(g,input,dt);
        if(g.watch.done){const b=bearing(g);r.reference=b.yaw;r.yaw=b.yaw;r.pitch=b.pitch;secure(g);}
        return;
      }
      tune(g,input[0],dt);
      if(g.stage===1)choose(g,input,dt);else signatures(g,input);
    }
    voice(g,dt);
  }
  function checkpoint(g){
    const r=g.relay;if(!r||!r.low)return null;
    return {low:true,docked:r.trolley.locked,top:r.top,loaded:r.loaded,scope:g.watch?.done===true,mask:r.mask.slice(),tried:r.tried.slice(),signed:r.signed.slice()};
  }
  function restore(g,save){
    if(!g.relay||save?.low!==true)return;
    const w=g.world.relay,r=g.relay;r.low=true;r.top=g.stage>0||save.top===true;r.loaded=g.stage>0||save.loaded===true;
    r.file=r.loaded?1:-1;TideRelayTrolley.reset(g,r.top||save.docked===true);
    g.checkpoints=[r.top?w.mast:r.trolley.locked?w.car:w.rest,r.loaded?w.desk:r.top?w.files[1]:w.haul];
    g.players=g.checkpoints.map(TideTraversal.spawn);
    if(!r.top)Object.assign(g.players[0],r.trolley.locked?{ground:w.car,z:w.car.z+.13}:{z:w.rest.z,ground:w.lower});
    g.players[1].ground=w.base;
    // The foot positions are inside the usable top grating after a tower save.
    if(r.top)Object.assign(g.players[0],{x:w.mast.x,y:w.upper.y,z:w.mast.z,ground:w.upper});
    if(g.stage){
      if(g.watch&&save.scope===true)g.watch.done=true;
      if(g.stage===1&&Array.isArray(save.mask)&&save.mask.length===6){r.mask=save.mask.map(v=>v===true);r.tried=r.mask.map((ok,i)=>ok||save.tried?.[i]===true);}
      if(g.stage===2&&save.signed?.[0]===true)r.signed=[true,save.signed[1]===true];
      const b=bearing(g);r.reference=b.yaw;r.yaw=b.yaw;r.pitch=b.pitch;
      if(g.stage===1&&r.mask.every(Boolean))startVoice(g,'carback','verified');
      if(g.stage===2&&r.signed.every(Boolean))startVoice(g,'answer','answered');
    }
  }
  return {layout,create,begin,point,target,near,step,climb,collision,stance,interact,bearing,winds,wind,vessel,checkpoint,restore,words};
})();
