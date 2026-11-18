// Positions on the launch use the same rest frame as its gunwales and fairleads.
const TideArrival=(()=>{
  const {clamp}=TideTraversal;
  const castSite={x:1.65,y:-2.62,z:15.69},radioSite={x:.35,y:-2.62,z:16.95};
  const helmSite={x:-6.03,y:-2.69,z:16.73};
  const active=g=>!!g.arrival&&!g.arrival.done;
  function deck(g,x,y,z){
    const h=g.world.fenders.floatPose;
    return TideFloating.point(h,x-h.anchorX,y-h.anchorY,z-h.anchorZ);
  }
  function cleat(g){
    const f=g.world.fenders.shelf;
    return {x:f.x+f.w*.5-.105,y:f.y+.145,z:f.z-.22};
  }
  function begin(g){
    const h=g.world.fenders.floatPose;
    g.arrival={x:h.anchorX-17.6,z:h.anchorZ+4.65,heading:.19,speed:.63,rudder:0,drive:0,
      plate:{look:0,stroke:.045,coverage:Array(12).fill(0),read:false,reported:false,held:false,direction:0,cue:'',cueAt:0,serial:0},
      dial:9,channel:9,receive:0,radio:'tune',voice:'',voiceAt:0,caption:'',cue:'',serial:0,
      lateral:-.78,reach:2.9,flight:null,attached:false,secured:false,haul:0,walking:0,
      moored:false,done:false,use:false,warning:'',warnTo:0,misses:0,engineRunning:true};
    advanceHull(g,0,0,0);placeCrew(g,0);display(g);
  }
  function tell(g,key){const s=g.arrival;s.cue=key;s.serial++;}
  const callSignEnd=TideArrivalSpeech.captain.cues[0].end+.09;
  const speech=id=>TideArrivalSpeech[id]||TidePlateSpeech[id];
  function speak(s,key){s.voice=key;s.voiceAt=0;s.caption='';}
  function inspectPlate(g,helm,dt){
    const s=g.arrival,p=s.plate,held=!!helm.use&&s.radio!=='line';
    const cue=id=>{p.cue=id;p.cueAt=g.time;p.serial++;};
    if(!held&&p.held&&p.look>.55)cue('tap');
    p.held=held;
    p.look=clamp(p.look+dt*(held?2.25:-2.82),0,1);
    const old=p.stroke;
    if(held&&p.look>.52)p.stroke=clamp(old+helm.x*dt*1.03,0,1);
    const span=Math.abs(p.stroke-old),direction=Math.sign(p.stroke-old);
    if(span<.00001){p.direction=0;return;}
    if(direction!==p.direction&&g.time-p.cueAt>.28)cue('wipe');
    p.direction=direction;
    const left=Math.min(old,p.stroke),right=Math.max(old,p.stroke);
    for(let i=0;i<p.coverage.length;i++){
      const x=(i+.5)/p.coverage.length,dist=Math.max(left-x,x-right,0);
      p.coverage[i]=clamp(p.coverage[i]+span*11*clamp(1-dist/.123,0,1),0,1);
    }
    // Both stamped digits must be legible. Scrubbing one small spot cannot reveal the other.
    if(!p.read)p.read=[1,2,3,4,7,8,9,10].every(i=>p.coverage[i]>.54);
  }
  function voice(g,dt,pressed){
    const s=g.arrival;
    if(s.radio==='tune'){
      s.receive=s.channel===12?Math.min(.48,s.receive+dt):0;
      if(s.plate.read&&!s.plate.reported&&!s.voice){
        s.plate.reported=true;speak(s,'read');
      }
      if(s.receive>=.48&&!s.voice){
        s.radio=s.plate.reported?'acquire':'listen';speak(s,'captain');
      }
    }
    if(s.radio==='wait'&&pressed){s.radio='test';speak(s,'call');}
    if(!s.voice){s.caption='';return;}
    const clip=speech(s.voice);s.voiceAt+=dt;
    // The receiver catches the ship's call sign first. Lin echoes the number in
    // the pause; the same transmission continues from its passenger count.
    if(s.radio==='acquire'&&s.voice==='captain'&&s.voiceAt>=callSignEnd){
      s.radio='readback';speak(s,'tuned');return;
    }
    const from=s.plate.reported&&s.radio==='listen'&&s.voice==='captain'?callSignEnd:0;
    const line=clip.lines.findLast(l=>l[0]>=from&&l[0]<=s.voiceAt)?.[1]||'';
    if(line!==s.caption){s.caption=line;if(line)g.events.log?.(line);}
    if(s.voiceAt<clip.duration)return;
    if(s.voice==='read'){s.voice='';s.caption='';}
    else if(s.voice==='tuned'){s.radio='listen';speak(s,'captain');s.voiceAt=callSignEnd;}
    else if(s.voice==='captain')speak(s,'heard');
    else if(s.voice==='heard')speak(s,'button');
    else if(s.voice==='call')speak(s,'dark');
    else {s.radio=s.voice==='button'?'wait':'line';s.voice='';s.caption='';}
  }
  function advanceHull(g,steer,thrust,dt){
    const s=g.arrival,h=g.world.fenders.floatPose;
    s.rudder+=(steer-s.rudder)*(1-Math.exp(-dt*4.5));
    s.drive+=((s.engineRunning?thrust:0)-s.drive)*(1-Math.exp(-dt*3.4));
    if(!s.moored){
      const desired=s.engineRunning?s.drive*(s.drive>=0?2.65:1.52):0;
      s.speed+=(desired-s.speed)*(1-Math.exp(-dt*(s.attached?1.5:1.08)));
      s.heading-=s.rudder*(.12*Math.abs(s.drive)+.54*Math.min(1,Math.abs(s.speed)))*dt*(s.speed<-.08?-1:1);
      // Narrow water and a fixed quay prevent a full turn during the final approach.
      s.heading=clamp(s.heading,-.82,.82);
      s.x+=Math.cos(s.heading)*s.speed*dt;
      s.z+=(-Math.sin(s.heading)*s.speed+.033*Math.cos(g.time*.54))*dt;
      const shoreLimit=16.53+Math.abs(Math.sin(s.heading))*4.2;
      if(s.z<shoreLimit){s.z=shoreLimit;s.speed*=Math.exp(-dt*.8);}
      s.x=clamp(s.x,-24,8.3);s.z=clamp(s.z,shoreLimit,26);
      if(s.attached){
        // The warp can only shorten while the engine is in neutral. The two players feel the same load.
        const lineX=castSite.x-h.anchorX,lineZ=castSite.z-h.anchorZ,co=Math.cos(s.heading),sn=Math.sin(s.heading),end=cleat(g);
        const dx=s.x+lineX*co+lineZ*sn-end.x,dz=s.z-lineX*sn+lineZ*co-end.z,length=Math.hypot(dx,dz);
        if(length>s.paidOut){
          const excess=1-s.paidOut/length;s.x-=dx*excess;s.z-=dz*excess;
          if((dx*co-dz*sn)*s.speed>0)s.speed*=Math.exp(-dt*5);
        }
        const tension=s.haul;
        if(tension>0){
          const b=1-Math.exp(-dt*(.38+1.55*tension));
          s.x+=(h.anchorX-s.x)*b;s.z+=(h.anchorZ-s.z)*b;s.heading*=1-b;
        }
        if(s.secured&&Math.abs(s.x-h.anchorX)<.09&&Math.abs(s.z-h.anchorZ)<.09&&Math.abs(s.heading)<.035){
          s.moored=true;s.x=h.anchorX;s.z=h.anchorZ;s.heading=0;s.speed=0;tell(g,'hull');
        }
      }
    }
    TideFloating.step(h,g.players,g.cues.water,g.time,dt,s.x,s.z,s.heading);
  }
  function moveTo(g,i,place,yaw){
    const p=g.players[i],v=deck(g,place.x,place.y,place.z),h=g.world.fenders.floatPose;
    p.x=v.x;p.y=v.y;p.z=v.z;p.yaw=yaw+h.yaw;p.vx=p.vy=p.vz=p.speed=0;
    p.grounded=true;p.ground=g.world.fenders.boats[i===0?1:0];
  }
  function placeCrew(g,dt){
    const s=g.arrival;
    const atBow=s.radio==='line';
    s.atBow=clamp((s.atBow||0)+(atBow?1:-1)*dt*1.2,0,1);
    const t=s.atBow;
    let a={x:radioSite.x+(castSite.x-radioSite.x)*t,y:radioSite.y,z:radioSite.z+(castSite.z-radioSite.z)*t};
    let b=helmSite,ay=0,by=-Math.PI*.5;
    if(s.moored){
      s.walking=Math.min(1,s.walking+dt*.285);
      const pathA=[[1.65,15.69],[.25,15.84],[-1.05,16.60],[-2.40,16.56],[-3.08,17.25]];
      const pathB=[[-6.03,16.73],[-5.93,17.83],[-4.48,17.90],[-2.60,17.52],[-1.10,17.20],[.18,17.48],[1.15,17.25]];
      function cross(path,t,startY,endY,initial){
        const step=clamp(t,0,1)*(path.length-1),n=Math.min(path.length-2,Math.floor(step)),f=step-n;
        const [x,z]=path[n],dx=path[n+1][0]-x,dz=path[n+1][1]-z;
        return {x:x+dx*f,y:startY+(endY-startY)*t,z:z+dz*f,yaw:t>0?Math.atan2(-dx,-dz):initial};
      }
      a=cross(pathA,s.walking,castSite.y,-2.72,0);
      b=cross(pathB,clamp((s.walking-.15)/.85,0,1),helmSite.y,-2.62,-Math.PI*.5);
      ay=a.yaw;by=b.yaw;
    }
    if(t>0&&t<1&&!s.moored)ay=Math.atan2(radioSite.x-castSite.x,radioSite.z-castSite.z);
    moveTo(g,0,a,ay);moveTo(g,1,b,by);
    if(t>0&&t<1&&!s.moored)g.players[0].speed=Math.hypot(castSite.x-radioSite.x,castSite.z-radioSite.z)*1.2;
    if(s.moored&&s.walking>0&&s.walking<1){g.players[0].speed=1.65;g.players[1].speed=s.walking>.15?2.35:0;}
  }
  function endPoint(g){
    const s=g.arrival;
    return deck(g,castSite.x+s.lateral,castSite.y+.11,castSite.z-s.reach);
  }
  function warn(g,msg){g.arrival.warning=msg;g.arrival.warnTo=g.time+2.5;}
  function cast(g){
    const s=g.arrival,from=deck(g,castSite.x-.06,castSite.y+1.01,castSite.z-.24),to=endPoint(g);
    const end=cleat(g);
    const valid=Math.hypot(to.x-end.x,to.z-end.z)<.65&&Math.abs(s.speed)<1.34;
    const floor=TideTraversal.surface(g.world,to.x,to.z,to.y+.25);
    to.y=floor?TideTraversal.surfaceHeight(floor,to.x,to.z)+.065:g.cues.water+TideFloating.swell(to.x,to.z,g.time+.70)+.035;
    s.flight={from,to:valid?end:to,age:0,hit:valid,fast:Math.abs(s.speed)>=1.34};s.misses+=valid?0:1;
  }
  function step(g,inputs,dt){
    const s=g.arrival,k=inputs[0],helm=inputs[1];
    const pressed=k.use&&!s.use,released=!k.use&&s.use;
    if(s.radio==='tune'){
      s.dial=clamp(s.dial+k.x*3.65*dt,6,16);
      const channel=Math.round(s.dial);
      if(channel!==s.channel){s.channel=channel;tell(g,'dial');}
    }else if(s.radio==='wait'&&pressed||s.radio==='test'&&released)tell(g,pressed?'pttDown':'pttUp');
    if(released&&s.radio==='test'&&s.voice==='call'){s.radio='wait';s.voice='';warn(g,'松键太早了。按住到林澈把话说完。');}
    inspectPlate(g,helm,dt);voice(g,dt,pressed);
    // Keys spring back to idle. The pilot can back up and try the same shore cleat again.
    const thrust=clamp(-helm.z,-1,1);
    if(s.attached&&Math.abs(thrust)<.12&&Math.abs(s.speed)<.68&&helm.use){s.secured=true;s.engineRunning=false;}
    s.haul=s.attached&&s.secured&&k.use?1:0;
    advanceHull(g,s.plate.held?s.rudder:helm.x,thrust,dt);
    if(s.radio==='line'&&!s.attached){
      if(!s.flight){
        s.lateral=clamp(s.lateral+k.x*dt*2.2,-4.8,4.8);
        s.reach=clamp(s.reach-k.z*dt*2.1,1.05,6.1);
        if(pressed&&(s.atBow||0)>.80)cast(g);
      }else{
        s.flight.age+=dt;
        if(s.flight.age>=.70&&s.flight.hit){s.attached=true;s.flight=null;
          const bow=deck(g,castSite.x,castSite.y,castSite.z);const end=cleat(g);
          s.paidOut=Math.hypot(bow.x-end.x,bow.z-end.z)+.37;tell(g,'hull');}
        else if(s.flight.age>=1.16){const f=s.flight;s.flight=null;
          warn(g,f.fast?'船还在往前冲。先收油，再把缆圈送过去。':'缆圈落空了，收回来。看圈落在岸桩的哪一边。');}
      }
    }
    placeCrew(g,dt);s.use=k.use;
    if(s.moored&&s.walking>=1){
      s.done=true;g.engaged.fill(false);g.near.fill(false);g.fenders.moored=true;
      for(let i=0;i<2;i++){const p=g.players[i],f=g.world.fenders.boats[i];p.ground=f;p.y=TideTraversal.surfaceHeight(f,p.x,p.z);p.yaw=0;p.grace=.1;}
      g.events.checkpoint?.(g);g.alert(TideFenders.briefing,3);return;
    }
    display(g);
  }
  function display(g){
    const s=g.arrival;g.near.fill(true);g.engaged.fill(true);
    const end=cleat(g),here=endPoint(g),miss=Math.hypot(end.x-here.x,end.z-here.z);
    let radio,read;
    if(s.radio==='tune'){radio='转动防水电台的旋钮。让掌舵的人告诉你值班频道。';read='频道 '+String(s.channel).padStart(2,'0');}
    else if(s.radio==='wait'){radio=g.time<s.warnTo?s.warning:'按住侧面的发话键，等林澈把话说完。';read='接收灯亮　／　发射灯灭';}
    else if(s.radio!=='line'){radio='听电台和艇上的回话。';read='北岬工作台　／　CH 12';}
    else if(s.moored){radio='通过艇上的窄走道，准备登岸。';read='首缆已系妥';}
    else if(s.attached){radio=s.secured?'按住操作键收缆，把船带到护舷旁。':'缆眼套住了。等同伴停机，再收紧。';read=s.secured?'船尾空挡　／　可以收缆':'首缆套住';}
    else{radio=g.time<s.warnTo?s.warning:'看岸上的黄铜系缆桩，移动缆圈的落点。套准后按操作键抛缆。';
      read=s.flight?'缆圈在空中':miss<.65?'缆圈对准桩顶':miss>6?'岸桩还在投缆范围外':'收放缆圈，对准岸桩';}
    g.set(0,radio,{caption:read});
    const plate=s.plate,inspect=s.radio==='tune'&&!plate.reported;
    const pilot=plate.held?(plate.read?'读出值班频道，松开操作键抬头看堤。':'左右移动手套，把两位数字上的盐霜都擦掉。油门仍可进退。'):
      inspect?'舵轮旁有一块值班牌。按住操作键俯身看，报给艇首。':s.moored?'已贴靠。换位，让林澈去堤下的绞盘。':s.attached?(s.secured?'发动机已停。等首缆收紧。':'松开油门，减速后按住操作键停机。'):
      '看岸边红白「首缆」牌，向前进车，带船首靠过去。临近收油，过头可倒车。';
    g.set(1,pilot,{caption:(s.secured?'空挡':'航速 '+Math.abs(s.speed).toFixed(1)+' m/s')+(s.radio==='tune'?(plate.read?'　／　外港值班 12':'　／　舵座铜牌'):'')});
  }
  return {begin,step,active,speech,cleat,deck,endPoint,helmSite,castSite,radioSite};
})();
