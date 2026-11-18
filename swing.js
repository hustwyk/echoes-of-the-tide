// A single trolley and trapeze connect the broken service jetty to the cable car.
// Both views, the two rollers, the release velocity and the landing gate use metres.
const TideSwing=(()=>{
  const {clamp,spawn}=TideTraversal,L=5.6,rest=.785,axisY=6.25,axisZ=-6.12;
  const entryX=[-1.52,1.54],gateX=.18,netHeight=-2.55;
  const point=(w,x,y,z)=>({x:w.o.x+x,y:w.o.y+y,z:w.o.z+z});
  const station=(w,kind,label,x,y,z,face=0)=>({...point(w,x,y,z),kind,label,face});
  function build(world){
    const sec=world.sections[2],c=sec.tram;if(!c)return;
    const o={x:(sec.starts[0].x+sec.starts[1].x)/2,y:sec.starts[0].y,z:sec.starts[0].z};
    const w=world.swing={o,car:c};Object.assign(c.from,point(w,-.50,-.08,-13.08));Object.assign(c.deck,c.from);
    const net={...point(w,0,netHeight,-8.16),w:7.08,d:12.78,active:true,kind:'safetynet',sag:.49,loads:[{x:0,z:0,a:0},{x:0,z:0,a:0}]};
    world.floors.push(net);
    w.net=net;w.land=station(w,'rim','吊篮开口',gateX,-.08,-11.69);w.wheel=station(w,'near','桥头横移轮',-2.66,0,-1.65);
    w.steps=[station(w,'ladder','回桥头软梯',2.93,netHeight,-2.59),station(w,'farLadder','吊篮外舷软梯',-1.98,netHeight,-11.34,Math.PI)];
    w.shore=station(w,'deck','桥头检修台',2.92,0,-1.51);
    w.mail={x:sec.mid.x,y:sec.mid.y,z:sec.mid.z-.84};
    w.fileSites=[-1,1].map((dir,i)=>({x:w.mail.x+dir*.46,y:w.mail.y,z:w.mail.z+.64,kind:i?'paper':'drawer',label:i?'收件人栏':'桥头寄件柜',face:dir*.16}));
    TideDrawbridge.tramSites(sec);
  }
  function create(g){return g.world.swing?{phase:'cross',rider:1,rail:-1.62,railV:0,spin:0,angle:rest,omega:0,
    reach:0,grip:{x:0,y:0,z:0},anchor:{x:0,y:axisY,z:axisZ},occupied:false,flight:false,effort:0,latched:true,
    crossed:[false,false],climb:[null,null],attempt:0,stow:0,stowed:false,clip:false,drawer:0,report:0,played:{},voice:'',clock:0,subtitle:'',line:-1,queue:[],
    cue:'',cueSerial:0,catchAt:-10,releaseAt:-10}:null;}
  function bar(s){
    Object.assign(s.anchor,{x:s.rail,y:axisY,z:axisZ});
    s.grip.x=s.rail;s.grip.y=axisY-L*Math.cos(s.angle);s.grip.z=axisZ+L*Math.sin(s.angle);
  }
  function speak(g,id){
    const s=g.swing;if(s.played[id])return;s.played[id]=true;
    if(!s.voice){s.voice=id;s.clock=0;s.line=-1;s.subtitle='';}else s.queue.push(id);
  }
  function narrate(g,dt){const s=g.swing;
    if(g.stage===2){
      const net=g.world.swing.net;
      for(let i=0;i<2;i++){
        const p=g.players[i],load=net.loads[i],on=p.ground===net;
        if(on){load.x=p.x;load.z=p.z;}load.a+=((on?.23+.12*(p.landing||0):0)-load.a)*(1-Math.exp(-dt*7));
      }
      if(s.phase!=='cross'&&!s.latched){returning(s,dt);bar(s);}
    }
    if(!s.voice)return;
    const a=TideSwingSpeech[s.voice];s.clock+=dt;
    const line=a.lines.findLastIndex(l=>l[0]<=s.clock);
    if(line>=0&&line!==s.line){s.line=line;s.subtitle=a.lines[line][1];g.events.log?.(s.subtitle);}
    if(s.clock>=a.duration){s.voice=s.queue.shift()||'';s.clock=0;s.line=-1;s.subtitle='';}
  }
  const cue=(s,key)=>{s.cue=key;s.cueSerial++;};
  function begin(g){if(g.swing&&g.stage===2){bar(g.swing);speak(g,'look');}}
  const active=g=>!!g.swing&&g.stage===2&&(!g.swing.stowed||g.swing.phase==='report');
  function carPoint(g,kind,label,x,z,face=0){
    const d=g.section.tram.deck;return {x:d.x+x,y:d.y,z:d.z+z,kind,label,face};
  }
  function onNet(g,i){return g.players[i].ground===g.world.swing.net;}
  const carWheel=g=>carPoint(g,'far','吊篮横移轮',-1.68,.98,Math.PI);
  const rack=g=>carPoint(g,'rack','潮尺卡箍',-1.47,-.91,-1.45);
  const latch=g=>carPoint(g,'clip','尺架止动销',-.82,-.96,1.45);
  function target(g,i){
    const w=g.world.swing,s=g.swing;
    if(s.phase==='report')return w.fileSites[i];
    if(onNet(g,i)||s.climb[i])return w.steps[s.crossed[i]?1:0];
    if(s.phase==='stow')return i?latch(g):rack(g);
    if(i!==s.rider)return i?carWheel(g):w.wheel;
    if(s.occupied||s.flight)return w.land;
    return station(w,'reach','横把起跳线',entryX[i],0,-1.76);
  }
  function near(g,i){
    const p=g.players[i],t=target(g,i);
    if(!p.grounded)return false;
    if(t.kind==='drawer'||t.kind==='paper')return p.ground!==g.section.tram.deck&&Math.abs(p.y-t.y)<.25&&Math.hypot(p.x-t.x,p.z-t.z)<.65;
    if(!['near','far','rack','clip'].includes(t.kind))return false;
    if(t.kind!=='near'&&p.ground!==g.section.tram.deck)return false;
    return Math.hypot(p.x-t.x,p.z-t.z)<.76&&Math.abs(p.y-t.y)<.21;
  }
  function stance(g,i,dt){
    const p=g.players[i],t=target(g,i),k=1-Math.exp(-dt*9);
    p.x+=(t.x-p.x)*k;p.z+=(t.z-p.z)*k;p.yaw+=Math.atan2(Math.sin(t.face-p.yaw),Math.cos(t.face-p.yaw))*k;
  }
  function climb(g,i,k,dt){
    const w=g.world.swing,s=g.swing,p=g.players[i],far=s.crossed[i],station=w.steps[far?1:0];
    let a=s.climb[i];
    if(!a&&onNet(g,i)&&k.use&&Math.hypot(p.x-station.x,p.z-station.z)<.78){
      a=s.climb[i]={t:0,y:p.y,x:p.x,z:p.z,far};p.vx=p.vy=p.vz=p.speed=0;p.ground=null;p.grounded=false;
    }
    if(!a)return false;
    if(k.use)a.t=clamp(a.t-k.z*dt*.88,0,1);
    const dest=a.far?carPoint(g,'deck','吊篮甲板',-1.46,1.33,Math.PI):w.shore;
    p.x=a.x+(dest.x-a.x)*a.t;p.z=a.z+(dest.z-a.z)*a.t;p.y=a.y+(dest.y-a.y)*a.t;p.yaw=a.far?0:Math.PI;
    if(a.t===1){
      const f=TideTraversal.surface(g.world,dest.x,dest.z,dest.y+.15);
      if(f){Object.assign(p,spawn(f),{x:dest.x,y:dest.y,z:dest.z,yaw:a.far?0:Math.PI});s.climb[i]=null;}
    }
    return true;
  }
  function attached(g,i,k,dt){if(!active(g))return false;
    if(climb(g,i,k,dt))return true;
    return g.swing.occupied&&g.swing.rider===i;
  }
  function reset(g,i){
    if(!active(g))return;
    const s=g.swing;s.climb[i]=null;
    if(i===s.rider){s.occupied=false;s.flight=false;}
    delete g.players[i].cast;
    if(s.crossed[i]){const d=g.section.tram.deck;Object.assign(g.players[i],spawn(d),{x:d.x+(i?-.82:.8),z:d.z+.99});}
  }
  function gate(g,p,oldZ){
    const w=g.world.swing,c=g.section.tram.deck,s=g.swing;
    if(s.phase==='report'){
      if(p.ground!==c&&Math.abs(p.x-w.mail.x)<.86&&p.z<w.mail.z+.38&&p.z>w.mail.z-.60){p.z=w.mail.z+.38;p.vz=Math.max(0,p.vz);}
      return;
    }
    const z=c.z+c.d*.5-.03,base=c.y,x=p.x-c.x;
    if(p.ground===w.net||p.y<base-.66||p.y>base+1.21||Math.abs(x)>c.w*.5+.13)return;
    const offset=p.x-w.land.x;
    if(Math.abs(offset)<.57||oldZ<z-.31||p.z<z-.50||p.z>z+.23)return;
    if(s.flight&&g.players[s.rider]===p){p.z=z+.27;p.vz=Math.max(.27,-p.vz*.12);p.vx*=.64;g.alert('靴子碰到护栏。下一次让同伴把吊点移向白色开口。',2);}
    else {p.z=oldZ>=z?z+.24:z-.24;p.vz=0;}
  }
  function place(g){const s=g.swing,p=g.players[s.rider],w=g.world.swing;
    const h=1.74-.15*Math.max(0,s.effort*-Math.cos(s.angle));
    Object.assign(p,point(w,s.grip.x,s.grip.y-h,s.grip.z+.045),{vx:0,vy:0,vz:0,speed:0,ground:null,grounded:false,grace:0,jumpRise:false,jumpBuffer:0,yaw:0});
  }
  function returning(s,dt){
    s.omega+=(9.0*(rest-s.angle)-4.2*s.omega)*dt;s.angle+=s.omega*dt;
    if(Math.abs(s.angle-rest)<.014&&Math.abs(s.omega)<.08){s.angle=rest;s.omega=0;s.latched=true;}
  }
  function overhead(g,k,dt){
    const w=g.world.swing,s=g.swing,r=s.rider,op=1-r,p=g.players[r];
    const working=g.engaged[op],drive=working?k[op].x:0;
    s.railV+=(drive*2.37-s.railV)*(1-Math.exp(-dt*(working?6:14)));
    const last=s.rail;s.rail=clamp(s.rail+s.railV*dt,-2.34,2.34);s.spin+=(s.rail-last)*3.86;
    if(s.occupied){
      s.effort=-k[r].z;
      // Kicking through the bottom adds torque. Reversing at the other apex
      // lets a rider build amplitude over several cycles after missing a release.
      s.omega+=(-9.81/L*Math.sin(s.angle)-.12*s.omega-s.effort*.59*Math.cos(s.angle))*dt;
      s.angle+=s.omega*dt;
      if(Math.abs(s.angle)>1.09){s.angle=Math.sign(s.angle)*1.09;s.omega*=-.13;}
      bar(s);place(g);
      if(k[r].jump&&g.time-s.catchAt>.18){
        s.flight=true;s.occupied=false;s.releaseAt=g.time;s.reach=0;s.latched=false;
        p.vx=s.railV;p.vz=L*Math.cos(s.angle)*s.omega;p.vy=L*Math.sin(s.angle)*s.omega+.60;
        p.cast=true;p.jumpBuffer=0;p.grace=0;cue(s,'clasp');
      }
    }else{
      if(!s.latched)returning(s,dt);bar(s);
      if(s.flight&&(p.grounded||!p.cast)){
        s.flight=false;
        if(p.ground===g.section.tram.deck){
          s.crossed[r]=true;g.checkpoints[r]=g.section.tram.deck;
          if(s.crossed.every(Boolean)){s.phase='stow';}
          else{s.rider=1-r;speak(g,'across');}
          cue(s,'clasp');g.events.checkpoint?.(g);
        }else if(p.ground===w.net){s.attempt++;if(!r)speak(g,'catch');g.alert('安全网兜住了。沿网走到桥头软梯，可以重新起跳。',2.6);}
      }
      const grip=point(w,s.grip.x,s.grip.y,s.grip.z),nearGrip=Math.hypot(p.x-grip.x,p.z-grip.z)<.56;
      const reachable=!p.grounded&&p.vy>-.8&&Math.abs(p.y+1.68-grip.y)<.37;
      if(!s.flight&&!s.crossed[r]&&nearGrip&&reachable&&k[r].use&&working&&s.latched){
        s.occupied=true;s.latched=false;s.catchAt=g.time;s.omega=-.06;s.effort=0;delete p.cast;
        place(g);cue(s,'strain');if(r===1)speak(g,'take');
      }
    }
  }
  function clearsBow(g){
    const s=g.swing,feet=g.players[s.rider],w=g.world.swing,d=g.section.tram.deck;
    const forward=L*Math.cos(s.angle)*s.omega,upward=L*Math.sin(s.angle)*s.omega+.60;
    const discriminant=upward*upward+39*(feet.y-d.y);
    if(forward>=0||discriminant<=0)return false;
    const time=(upward+Math.sqrt(discriminant))/19.5;
    if(time<=0)return false;
    const flight=(1-Math.exp(-.11*time))/.11,landing=feet.z+forward*flight;
    const bow=d.z+d.d*.5,gateTime=Math.max(0,(bow-feet.z)/forward);
    return landing<bow-.12&&landing>d.z-d.d*.5+.16&&Math.abs(feet.x+s.railV*gateTime-w.land.x)<.48;
  }
  function instructions(g){
    const s=g.swing,r=s.rider,op=1-r,p=g.players[r],w=g.world.swing;
    const aligned=s.occupied&&clearsBow(g);
    const launch=entryX[r],cm=Math.round((s.rail-(s.occupied||s.flight?gateX:launch))*100);
    g.set(op,s.occupied?(aligned?'绳子正对开口，这一摆能落上甲板。可以告诉同伴了。':'握住横移轮，把上方小车对准吊篮白色开口。由同伴决定什么时候松把。'):s.flight?'看同伴的落点。已经甩出的横把会由配重带回。':'在轮旁按住操作键，左右移动吊点；握住离合，让同伴从黄线起跳抓把。',{caption:'轨道尺 '+s.rail.toFixed(2)+' m　·　'+(Math.abs(cm)<22?'已靠近刻线':(cm>0?'向左 ':'向右 ')+Math.abs(cm)+' cm')});
    g.set(r,s.occupied?(aligned?'两道白边已经到脚下。现在按跳跃键松手，可顺着惯性落上吊篮。':'前后压摆。向白色开口荡去，脚越过水面向上抬时按跳跃键松把。'):s.flight?'空中可轻推方向修正，在两条白边之间落脚。':'到黄线旁，握住操作键并起跳抓横把。让同伴把吊点移到你头上。',{caption:s.occupied?'绳角 '+Math.round(s.angle*180/Math.PI)+'°　·　'+(s.omega<0?'去程':'回程'):s.flight?'落点　·　吊篮开口':s.latched?'横把挂在桥头':'横把正在回摆'});
    for(let i=0;i<2;i++)if(onNet(g,i)||s.climb[i])g.set(i,s.climb[i]?'握住软梯，前推向上攀；松方向键停在这一阶。':'安全网承住了。走到软梯旁，握住操作键前推爬上去。',{caption:s.crossed[i]?'吊篮外舷软梯':'桥头软梯'});
  }
  function stow(g,k,dt){
    const s=g.swing;s.clip=g.engaged[1]&&k[1].z>.28;
    if(s.clip&&g.engaged[0])s.stow=clamp(s.stow-k[0].z*dt*.69,0,1);
    g.set(0,'将折尺送到篮侧尺架。等沈遥拉住止动销，握住操作键前推入槽。',{caption:'尺身入槽 '+Math.round(s.stow*100)+'%'});
    g.set(1,'面对尺架握住操作键，后拉止动销。尺脚落到底时按确认扣住。',{caption:s.stow>.97?'尺脚到位，可以锁扣':s.clip?'止动销已拉开':'尺架止动销'});
    if(s.stow>.97&&s.clip&&g.commit(1,k)){
      s.stow=1;s.stowed=true;s.phase='quiet';cue(s,'clasp');speak(g,'rack');g.events.checkpoint?.(g);
    }
  }
  function report(g,k,dt){
    const s=g.swing;
    if(g.engaged[0])s.drawer=clamp(s.drawer+k[0].z*dt*.78,0,1);
    if(g.engaged[1]&&g.engaged[0]&&s.drawer>.85)s.report=clamp(s.report-k[1].z*dt*.72,0,1);
    g.set(0,'下吊篮，到桥头低柜前。握住把手向后拉，让同伴取出压在档夹下面的更正稿。',{caption:'寄件抽屉　'+Math.round(s.drawer*100)+'%'});
    g.set(1,'下车绕过桌角。等同伴托住抽屉，握住纸夹向前翻起；读完按确认收好。',{caption:s.report>.87?'收件人　＿＿＿＿':'港务值班　·　更正存根'});
    if(s.report>.92&&g.engaged[0]&&g.commit(1,k)){s.report=1;g.advance();}
  }
  function openFile(g){
    if(g.swing.phase==='report')return;
    g.swing.phase='report';g.events.checkpoint?.(g);g.alert('到站了。林澈记得，旧件都搁在桥头的寄件柜。',3);
  }
  function interact(g,input,dt){
    const s=g.swing;
    if(s.phase==='report'){report(g,input,dt);return;}
    if(s.phase==='stow'){stow(g,input,dt);return;}
    overhead(g,input,dt);if(s.phase==='cross')instructions(g);
  }
  function checkpoint(g){const s=g.swing;if(!s||g.stage!==2||!s.crossed.some(Boolean))return null;
    return {stage:2,file:s.phase==='report',drawer:s.drawer,report:s.report,crossed:s.crossed.slice(),stowed:s.stowed,stow:s.stow,rail:s.rail,travel:g.section.tram.travel,heard:g.section.tram.heard,skip:!!g.skipTin};
  }
  function restore(g,m){
    const s=g.swing,w=g.world.swing;if(!s||g.stage!==2||m?.stage!==2||!Array.isArray(m.crossed)||m.crossed[1]!==true)return;
    s.crossed=[m.crossed[0]===true,true];s.stowed=s.crossed[0]&&m.stowed===true;s.phase=s.stowed?'quiet':s.crossed[0]?'stow':'cross';
    s.rider=0;s.stow=s.stowed?1:clamp(Number(m.stow)||0,0,1);s.rail=clamp(Number(m.rail)||0,-2.34,2.34);
    s.occupied=s.flight=false;s.angle=rest;s.omega=s.railV=0;s.latched=true;bar(s);s.voice='';s.subtitle='';s.queue=[];s.played.look=s.played.take=true;
    const c=g.section.tram;
    if(s.stowed){
      c.departed=true;c.ready=.5;c.travel=clamp(Number(m.travel)||0,0,1);c.heard=!!m.heard;g.skipTin=!!m.skip;TideDrawbridge.tram(g,0);
    }
    if(m.file&&s.stowed&&c.arrived){s.phase='report';s.drawer=clamp(Number(m.drawer)||0,0,1);s.report=clamp(Number(m.report)||0,0,1);}
    for(let i=0;i<2;i++){
      const d=s.crossed[i]?c.deck:g.section.starts[i];g.checkpoints[i]=d;
      Object.assign(g.players[i],spawn(d),s.crossed[i]?{x:d.x+(i?-1.20:.55),z:d.z+.98}:{});
    }
  }
  function film(time){const a=TideSwingSpeech.paper,clock=time-.32;
    return {voice:clock>=0&&clock<a.duration?'paper':'',clock:Math.max(0,clock),subtitle:a.lines.findLast(row=>row[0]<=clock)?.[1]||''};
  }
  return {build,create,begin,active,narrate,near,target,stance,attached,gate,interact,reset,checkpoint,restore,openFile,speak,film,cue,clearsBow,point,entryX,gateX};
})();
