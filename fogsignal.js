// The fog signal has three listeners. The bridge sounder cannot separate an attack
// from a ringing diaphragm until the previous accepted impulse has decayed.
const TideFogSignal=(()=>{
  const {clamp}=TideTraversal,TAU=2*Math.PI,nominal=1/7.5;
  const origin={x:1.20,y:8.40,z:-90.40};
  const point=(x,y,z)=>({x:origin.x+x,y:origin.y+y,z:origin.z+z});
  const site=(kind,label,x,y,z,index=0)=>({...point(x,y,z),kind,label,index});
  const trace=()=>({source:[],aft:[],bridge:[],length:3.25});
  const phase=t=>t-Math.floor(t);
  function layout(){
    const floors=[],floor=(kind,x,y,z,w,d)=>{const p={...point(x,y,z),kind,w,d,active:true};floors.push(p);return p;};
    const rear=floor('fogApron',0,0,4.80,13.6,4.4),east=floor('fogGallery',3.70,0,-2.15,6.2,9.5);
    const outer=floor('fogHead',-3.40,0,-6.63,2.85,1.70);
    const wheels=[[.75,1.48],[-3.32,1.56]].map(([z,r],i)=>{
      const pivot=point(-3.4,0,z),pad=floor('fogShoe',-3.4,0,z+(i?-r:r),1.44,1.16);
      Object.assign(pad,{index:i,r,pivot,angle:i?Math.PI:0,dynamic:true,axes:{ux:1,uy:0,uz:0,vx:0,vy:0,vz:1}});
      return pad;
    });
    const rack=site('rack','黄铜对印钥',-4.90,0,4.64),clutch=site('clutch','盘车离合柄',1.55,0,3.72);
    const drive=site('drive','遮光调速盘',-3.40,0,-6.63),bench=site('bench','双齿间隔台',3.90,0,.40),horn=site('horn','气阀与接听台',3.18,0,-4.28);
    const starts=[point(-4.22,0,5.73),point(2.26,0,5.90)],end=[drive,horn];
    const sections=TideMissions.chapters[10].map((spec,k)=>({spec,starts:k?end:starts,ends:end,sites:end,mid:east,danger:[],returnDecks:[],paths:[[],[]],ferry:null}));
    return {floors,sections,style:'lens',foghouse:{rear,east,outer,wheels,rack,clutch,drive,bench,horn}};
  }
  const notch=[.26,.69];
  function create(g){
    return g.world.foghouse?{key:'rack',marks:[false,false],travel:.19,clutch:0,spin:.08,speed:nominal,balance:0,
      mode:'transport',service:.07,gaps:[.54,.54],locks:[false,false],stud:0,turn:null,down:false,
      valve:0,pressure:1,opened:0,pulseOrigin:0,oldPull:false,trace:trace(),paper:trace(),packets:[],lastAir:[-8,-8],
      showAft:false,showBridge:false,ready:false,voice:'',clock:0,subtitle:'',line:-1,spoken:false,
      sightYaw:-.12,sightPitch:.065,fix:0,seen:false,storm:0}:null;
  }
  function begin(g){
    const r=g.fog;if(!r)return;
    r.voice='';r.clock=0;r.line=-1;r.subtitle='';r.turn=null;r.down=false;r.oldPull=false;r.valve=0;r.ready=false;
    r.trace=trace();r.packets=[];r.lastAir=[-8,-8];r.showAft=r.showBridge=false;
    if(g.stage){
      r.key='seated';r.marks=[true,true];r.spoken=true;r.travel=1;
      r.mode=g.stage===1?'edit':'ready';
      if(g.stage===1){r.locks=[false,false];r.stud=0;r.service=.07;say(r,'spread');}
      if(g.stage===2){if(!r.locks[1])r.gaps=[.97,.99];r.locks=[true,true];}
    }
    if(g.stage===1&&!r.paper.source.length)r.paper={source:[.24,.78,1.32],aft:[.24,.78,1.32],bridge:[.24,1.32],length:3.25};
    g.cues.water=-3.52;g.cues.light=.9;
  }
  function target(g,i){
    const r=g.fog,w=g.world.foghouse;
    if(!i&&r.key==='rack')return w.rack;
    if(!i&&r.key==='carry'){
      const slot=r.marks.indexOf(false);
      if(slot>=0){const pad=w.wheels[slot];return {...pad,kind:'shoe',label:slot?'乙轮对印槽':'甲轮对印槽'};}
    }
    return i?(r.mode==='transport'?w.clutch:r.mode==='edit'?w.bench:w.horn):w.drive;
  }
  function near(g,i){
    const s=target(g,i),p=g.players[i],w=g.world.foghouse;
    if(s.kind==='shoe')return p.ground===w.wheels[s.index]&&Math.hypot(p.x-s.x,p.z-s.z)<.82;
    if(s===w.drive&&p.ground!==w.outer)return false;
    return p.grounded&&Math.abs(p.y-s.y)<.31&&Math.hypot(p.x-s.x,p.z-s.z)<1.02&&p.z>=s.z-.25;
  }
  function stance(g,i,dt){
    const p=g.players[i],s=target(g,i),k=1-Math.exp(-9*dt);
    p.x+=(s.x-p.x)*k;p.z+=(s.z-p.z)*k;
    const yaw=s.kind==='shoe'?g.world.foghouse.wheels[s.index].angle:0;
    p.yaw+=Math.atan2(Math.sin(yaw-p.yaw),Math.cos(yaw-p.yaw))*k;
  }
  function collide(g,p){
    const w=g.world.foghouse;
    for(const s of [w.rack,w.clutch,w.drive,w.bench,w.horn]){
      if(Math.abs(p.y-s.y)>.78)continue;
      const dx=p.x-s.x,dz=p.z-s.z+.72,len=Math.hypot(dx,dz),rad=s===w.bench?.54:.36;
      if(len>=rad)continue;const nx=len?dx/len:0,nz=len?dz/len:1;
      p.x=s.x+nx*rad;p.z=s.z-.72+nz*rad;const dot=p.vx*nx+p.vz*nz;if(dot<0){p.vx-=dot*nx;p.vz-=dot*nz;}
    }
  }
  function snap(g){g.events.checkpoint?.(g);}
  function load(g){return g.stage===2?.42*Math.sin(g.time*.69+.10)+.28*Math.sin(g.time*1.12):0;}
  function dark(g){const f=phase(g.fog.spin);return f>=.43&&f<.83;}
  function wind(g){return clamp(1-Math.abs(g.fog.balance-load(g))/.53,0,1);}
  function syncWheels(g){
    const r=g.fog,w=g.world.foghouse;
    for(const pad of w.wheels){
      const a=pad.index?Math.PI-r.travel*TAU:r.travel*TAU,c=Math.cos(a),s=Math.sin(a);
      const x=pad.pivot.x+s*pad.r,z=pad.pivot.z+c*pad.r,delta=a-pad.angle;
      for(const p of g.players)if(p.ground===pad){
        const dx=p.x-pad.x,dz=p.z-pad.z;p.x=x+dx*Math.cos(delta)+dz*Math.sin(delta);
        p.z=z-dx*Math.sin(delta)+dz*Math.cos(delta);p.yaw+=delta;
      }
      pad.x=x;pad.z=z;pad.angle=a;Object.assign(pad.axes,{ux:c,uz:-s,vx:s,vz:c});
    }
  }
  function step(g,dt){
    const r=g.fog;
    if(r.mode==='transport'){syncWheels(g);return;}
    if(r.mode==='edit'){r.spin=r.service;r.storm=0;g.cues.light=.74;return;}
    r.speed=nominal*(1+(g.stage===2?(r.balance-load(g))*.22+.045*Math.sin(g.time*1.48):0));
    r.spin+=dt*r.speed;const f=phase(r.spin);
    r.storm=clamp((f-.403)/.045,0,1)*clamp((.854-f)/.05,0,1);
    g.cues.light=.95*(1-r.storm)+.018;g.cues.angle=.01*Math.sin(r.spin*TAU);
  }
  function say(r,id){r.voice=id;r.clock=0;r.line=-1;r.subtitle='';}
  function status(g,txt){g.alert(txt,2.2);}
  function ready(g){
    const r=g.fog;r.mode='ready';r.turn=null;r.ready=false;r.down=false;r.packets=[];r.valve=0;
    r.trace=trace();r.lastAir=[-8,-8];r.showBridge=r.showAft=false;r.pressure=1;r.oldPull=false;
  }
  function narrate(g,dt){
    const r=g.fog;if(!r.voice)return;
    const c=TideFogSpeech[r.voice];r.clock+=dt;const j=c.lines.findLastIndex(l=>l[0]<=r.clock);
    if(j>=0&&r.line!==j){r.line=j;r.subtitle=c.lines[j][1];g.events.log?.(r.subtitle);}
    if(r.clock<c.duration)return;
    const id=r.voice;r.voice='';r.clock=0;r.subtitle='';r.line=-1;
    if(id==='aft'){
      r.showBridge=true;r.mode='bridge';say(r,['one','one','two','three'][r.trace.bridge.length]);
    }else if(id==='two'||id==='one'||id==='three'){
      if(g.stage===2&&r.trace.bridge.length===3){r.mode='spot';say(r,'eyes');}
      else {r.mode='ack';snap(g);}
    }else if(id==='eyes'){r.mode='spot';snap(g);}
    else if(id==='seen'){g.advance();}
  }
  function transport(g,input,dt){
    const r=g.fog,w=g.world.foghouse,s=target(g,0);
    if(g.engaged[1]){
      r.clutch=input[1].x;r.travel=clamp(r.travel+r.clutch*dt*.17,0,1);
    }else r.clutch=0;
    const p=g.players[0],slot=r.marks.indexOf(false),stop=slot===0?.25:.75;
    g.set(1,'握住离合柄，左右盘车。先把甲踏板倒到岸边，再向前转，让同伴换到乙轮。停手会抱闸。',{
      caption:'盘车 '+Math.round(r.travel*360)+'°　·　'+(w.wheels.includes(p.ground)?(p.ground.index?'乙轮':'甲轮')+'承重':'等待上轮')});
    if(s===w.rack){
      g.set(0,'握住墙架的方头钥，确认取下。两个轮缘各留有一道对印槽。',{caption:'黄铜对印钥'});
      if(g.commit(0,input)){r.key='carry';snap(g);g.sound(380,.09);}return;
    }
    if(s.kind==='shoe'){
      const aligned=Math.abs(r.travel-stop)<.046;
      g.set(0,p.ground===w.wheels[slot]?'握住槽座。让同伴盘到刻口，盘车柄停住后按确认，把对印压到钥上。':
        slot?'甲轮向外、乙轮向里时，两块踏板相对。跳上乙轮。':'等甲踏板靠到后廊，再向前跳。',{
        caption:(slot?'乙轮　270°':'甲轮　90°')+'　·　'+(aligned?'刻口对齐':'等待对印')});
      if(g.commit(0,input)){
        if(!aligned||!g.engaged[1]||Math.abs(r.clutch)>.10){status(g,'刻口要对正，离合柄还要有人握稳。');return;}
        r.marks[slot]=true;g.checkpoints[0]=w.wheels[slot];g.sound(610,.10);snap(g);
      }
      return;
    }
    g.set(0,'等乙踏板转到外端，跳上机座，握住调速盘并确认插入方头钥。',{caption:'甲乙两道对印已合'});
    if(g.commit(0,input)){
      r.key='seated';g.checkpoints[0]=w.drive;r.clutch=0;ready(g);r.spin=.10;snap(g);
      g.sound(482,.13);status(g,'调速盘已接好。沈遥去东廊的气阀台接听。');
    }
  }
  function edit(g,input,dt){
    const r=g.fog,i=r.stud,a=notch[i];
    if(g.engaged[0])r.service=clamp(r.service+input[0].x*dt*.34,0,1);
    if(g.engaged[1])r.gaps[i]=clamp(r.gaps[i]+input[1].x*dt*.43,.48,1.22);
    const aligned=Math.abs(r.service-a)<.048;
    g.set(0,'左右检修盘，把要改的齿送进窗口。在同伴锁紧之前，握住手轮。',{vis:'dial',value:r.service,target:a,band:.048,caption:'检修窗　'+(i?'C · 第三齿':'B · 第二齿')});
    g.set(1,'对照三行声迹，左右移齿拉开间隔。让前一响的尾音退到复位线之外，再按确认锁紧。',{
      caption:(i?'第二至第三响':'第一至第二响')+'　'+r.gaps[i].toFixed(2)+' 秒　·　桥楼复位约 0.85 秒　·　'+(aligned?'可锁紧':'等检修窗对齿')});
    if(g.commit(1,input)){
      if(!g.engaged[0]||!aligned){status(g,'检修窗还没露出这一齿。');return;}
      r.locks[i]=true;g.sound(492+i*92,.13);
      if(i===0){r.stud=1;snap(g);}else{ready(g);r.spin=.07;snap(g);status(g,'两齿已锁。回气阀，实际再发三响。');}
    }
  }
  const slots=r=>[.24,.24+r.gaps[0],.24+r.gaps[0]+r.gaps[1]];
  function camTime(r){return r.turn==null?-8:(r.spin-(r.turn+.43))/nominal;}
  function signalPacket(g,width){
    const r=g.fog,k=r.trace.source.length,stamp=r.pulseOrigin;
    r.trace.source.push(stamp);
    for(const [i,delay] of [[0,.17],[1,.43]])r.packets.push({side:i,at:g.time+delay,stamp,width,emitted:r.opened});
    g.sound(310+k*55,.045);
  }
  function receive(g){
    const r=g.fog;
    r.packets=r.packets.filter(e=>{
      if(g.time<e.at)return true;
      const decay=e.side?.802+e.width*.20:.28;
      if(e.emitted-r.lastAir[e.side]>=decay){r.lastAir[e.side]=e.emitted;r.trace[e.side?'bridge':'aft'].push(e.stamp);}
      return false;
    });
  }
  function fail(g,reason){ready(g);g.sound(148,.10);status(g,reason);}
  function work(g,input,dt){
    const r=g.fog,f=phase(r.spin);
    if(g.engaged[0]&&g.stage===2)r.balance=clamp(r.balance+input[0].x*dt*.73,-1,1);
    const steady=wind(g)>.40,pull=g.engaged[1]&&input[1].z<-.44;
    const rising=pull&&!r.oldPull;r.oldPull=pull;
    const on=g.engaged[0]&&g.engaged[1];
    if(!r.spoken&&on){r.spoken=true;say(r,'drill');}
    g.set(0,g.stage===2?'左右调飞锤，稳住转速。预灯缺口经过固定指针时按确认。':'握住调速盘，看铜色缺口。缺口经过固定指针时，按确认送出预备灯。',{
      vis:'dial',value:f,target:.30,band:.055,caption:'凸轮 '+Math.round(f*360)+'°　·　'+(g.stage===2?'转速 '+(r.speed*60).toFixed(1)+' / 8.0 rpm':'遮光段约三秒')});
    const stamps=slots(r),clock=camTime(r),i=r.trace.source.length,offset=clock-(stamps[i]??9);
    const contact=Math.abs(offset)<(g.stage===0?.10:.15);
    r.ready=r.turn!==null;
    g.set(1,r.mode==='ready'?'握住气阀，听预备灯的回铃。每次触点变亮时往前压杆，短响后松回中位。':
      r.down?'松回中位截断这声雾号。':'等下一个触点靠近中心，往前压杆发一声。',{
        vis:r.ready?'dial':'',value:clamp(.5+offset,0,1),target:r.ready?.5:null,band:g.stage===0?.10:.15,
        caption:(r.ready?'预备灯亮':'等待预备灯')+'　'+('●'.repeat(i)+'○'.repeat(3-i))+(r.down?'　气阀已开 '+(g.time-r.opened).toFixed(1)+' s':'')});
    if(r.mode==='ready'&&g.commit(0,input)){
      if(!on||r.voice){status(g,r.voice?'先听完船长的约定。':'等气阀台有人握住。');return;}
      if(!steady||Math.abs(f-.30)>.058){status(g,!steady?'飞锤偏出刻线，先把转速压回中线。':'缺口还没过指针。');return;}
      r.turn=Math.floor(r.spin);r.mode='sending';g.sound(825,.11);
    }
    if(r.mode!=='sending')return;
    if(!g.engaged[0]){fail(g,'调速盘松开，预备灯熄灭。两齿的间隔保留。');return;}
    if(rising&&!r.down){
      if(!dark(g)||!contact){status(g,'气阀没有对上这个触点。松一次杆再压。');}
      else{r.down=true;r.opened=g.time;r.pulseOrigin=clock;r.pressure=clamp(r.pressure-.09,0,1);}
    }
    if(r.down){
      const width=g.time-r.opened;
      if(width>.46||!dark(g)){fail(g,'这声拖进下一段了。短按气阀，松开时听雾号收尾。');return;}
      if(!pull){
        if(width<.135){fail(g,'气膜还没起振。稍多压一会儿再放。');return;}
        signalPacket(g,width);r.down=false;
        if(r.trace.source.length===3){r.mode='drain';r.ready=false;}
      }
    }else if(offset>.20||clock>3.06){fail(g,'错过一道触点。等下一圈，已调好的齿距会保留。');}
  }
  function feedback(g,input){
    const r=g.fog,three=r.trace.bridge.length===3;
    g.set(0,'岸上三枚灯全亮。留住这一圈的刻口，等驾驶台自己复述。',{caption:'岸台　●●●　·　'+(r.showAft?'后甲板　'+r.trace.aft.length+' 响':'等船尾')});
    g.set(1,r.mode==='drain'?'松开操作键，把频道让给海雁号。':r.mode==='ack'?'听完驾驶台，握住电台并按确认登记这次复述。':'等船尾和驾驶台分别说完。',{
      caption:'岸台　3　·　后甲板　'+(r.showAft?r.trace.aft.length:'…')+'　·　驾驶台　'+(r.showBridge?r.trace.bridge.length:'…')});
    if(r.mode==='drain'&&!r.packets.length&&!input[1].use){
      r.showAft=true;r.mode='aft';say(r,'aft');return;
    }
    if(r.mode!=='ack'||!g.commit(1,input)||!g.engaged[0])return;
    r.paper={...r.trace,source:r.trace.source.slice(),aft:r.trace.aft.slice(),bridge:r.trace.bridge.slice()};
    if(g.stage===0||three){g.advance();return;}
    r.mode='edit';r.stud=0;r.service=.07;r.locks=[false,false];snap(g);say(r,'spread');
  }
  const shipYaw=-2.19;
  const lamp=[14,24.1,-91];
  function cabin(g){
    const ship=TideLookout.vessel(g,g.time),sx=Math.sin(shipYaw),cx=Math.cos(shipYaw);
    const eye=[ship[0]-5.27*sx,ship[1]+3.45,ship[2]-5.27*cx];
    const base=Math.atan2(lamp[0]-eye[0],eye[2]-lamp[2]),elev=Math.atan2(lamp[1]-eye[1],Math.hypot(lamp[0]-eye[0],lamp[2]-eye[2]));
    const r=g.fog,yaw=base+r.sightYaw+.033*Math.sin(g.time*.82),pitch=elev+r.sightPitch+.021*Math.cos(g.time*.92);
    return {eye,at:[eye[0]+Math.sin(yaw)*Math.cos(pitch),eye[1]+Math.sin(pitch),eye[2]-Math.cos(yaw)*Math.cos(pitch)],yaw,pitch,base,elev,fov:49};
  }
  function lookout(g,input,dt){
    const r=g.fog;
    if(g.engaged[0])r.balance=clamp(r.balance+input[0].x*dt*.73,-1,1);
    if(g.engaged[1]){r.sightYaw=clamp(r.sightYaw+input[1].x*dt*.35,-.65,.65);r.sightPitch=clamp(r.sightPitch-input[1].z*dt*.25,-.36,.36);}
    const cam=cabin(g),aim=Math.hypot(cam.yaw-cam.base,cam.pitch-cam.elev)<.031;
    const light=r.storm<.23&&wind(g)>.44&&g.engaged[0];
    r.fix=aim&&light&&g.engaged[1]?Math.min(1,r.fix+dt*2.9):0;
    g.set(0,'左右稳住飞锤，让窄光从雨幕里重新露出来。听驾驶台确认。',{vis:'dial',value:(r.balance+1)/2,target:(load(g)+1)/2,band:.15,caption:'飞锤　'+(light?'光已露出':'雨幕或转速偏移')});
    g.set(1,'握住电台，切到驾驶台的视线。前后左右移动瞄环，等雨退、看清灯塔再确认。',{caption:r.storm>.6?'雨帘遮住灯室':r.fix>=1?'看见灯室　·　确认目视':'船在摇　·　对准亮起的灯室'});
    if(!r.voice&&r.fix>=1&&g.commit(1,input)&&!r.seen){r.seen=true;say(r,'seen');snap(g);}
  }
  function interact(g,input,dt){
    const r=g.fog;receive(g);
    if(r.mode==='transport')transport(g,input,dt);
    else if(r.mode==='edit')edit(g,input,dt);
    else if(r.mode==='ready'||r.mode==='sending')work(g,input,dt);
    else if(r.mode==='spot')lookout(g,input,dt);
    else feedback(g,input);
    r.valve+=(Number(r.down)-r.valve)*(1-Math.exp(-dt*(r.down?22:15)));
    r.pressure=clamp(r.pressure+dt*(r.down?-.18:.12),0,1);narrate(g,dt);
  }
  function checkpoint(g){
    const r=g.fog;if(!r||r.key==='rack')return null;
    return {key:r.key,marks:r.marks.slice(),gaps:r.gaps.slice(),locks:r.locks.slice(),mode:r.mode,paper:r.paper,
      receipt:['ack','spot'].includes(r.mode)?r.trace:null,seen:r.seen};
  }
  function validTrace(v){
    return v&&['source','aft','bridge'].every(k=>Array.isArray(v[k])&&v[k].length<=3&&v[k].every(n=>Number.isFinite(n)&&n>=-.4&&n<=3.4));
  }
  function restore(g,s){
    if(!s||!['carry','seated'].includes(s.key)||!g.fog)return;
    g.fog.voice='';g.fog.subtitle='';g.fog.clock=0;
    const r=g.fog,w=g.world.foghouse;r.key=g.stage?'seated':s.key;
    r.marks=[0,1].map(i=>r.key==='seated'||s.marks?.[i]===true);
    if(s.gaps?.length===2&&s.gaps.every(Number.isFinite))r.gaps=s.gaps.map(n=>clamp(n,.48,1.22));
    if(validTrace(s.paper))r.paper=s.paper;
    if(r.key==='carry'){
      r.mode='transport';r.travel=r.marks[1]?.75:r.marks[0]?.25:0;syncWheels(g);
    }else{
      r.spoken=g.stage!==0;ready(g);r.travel=1;syncWheels(g);
      if(g.stage===1&&s.locks?.[1]!==true){r.mode='edit';r.locks=[s.locks?.[0]===true,false];r.stud=r.locks[0]?1:0;r.service=r.stud?.26:.07;}
      else if(g.stage)r.locks=[true,true];
      if(['ack','spot'].includes(s.mode)&&validTrace(s.receipt)&&s.receipt.source.length===3){
        r.mode=s.mode;r.trace=s.receipt;r.showAft=r.showBridge=true;r.seen=s.seen===true;
        if(r.seen)say(r,'seen');
      }
    }
    const a=r.key==='seated'?w.drive:r.marks[1]?w.wheels[1]:r.marks[0]?w.wheels[0]:w.rack;
    const b=target(g,1);g.checkpoints=[a,b];g.players=g.checkpoints.map(TideTraversal.spawn);
    Object.assign(g.players[0],{x:a.x,y:a.y,z:a.z,ground:r.key==='seated'?w.outer:w.wheels.includes(a)?a:w.rear});
  }
  return {layout,create,begin,step,near,target,stance,collide,interact,checkpoint,restore,load,wind,dark,slots,camTime,cabin,shipYaw,lamp};
})();
