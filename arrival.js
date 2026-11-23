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
      bow:TideBowCast.create(),attached:false,secured:false,haul:0,
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
    if(s.stern?.queue.length){
      const stale=s.voice==='sternHold'&&s.stern.phase!=='reach'||s.voice==='sternCaught'&&s.stern.phase==='fast';
      const between=clip.cues?.some(q=>s.voiceAt>=q.end&&s.voiceAt-dt<q.end);
      if(stale&&between){TideSternLine.nextVoice(s);return;}
    }
    // The receiver catches the ship's call sign first. Lin echoes the number in
    // the pause; the same transmission continues from its passenger count.
    if(s.radio==='acquire'&&s.voice==='captain'&&s.voiceAt>=callSignEnd){
      s.radio='readback';speak(s,'tuned');return;
    }
    const from=s.plate.reported&&s.radio==='listen'&&s.voice==='captain'?callSignEnd:0;
    const line=clip.lines.findLast(l=>l[0]>=from&&l[0]<=s.voiceAt)?.[1]||'';
    if(line!==s.caption){s.caption=line;if(line)g.events.log?.(line);}
    if(s.voiceAt<clip.duration)return;
    if(s.stern&&s.voice.startsWith('stern')){TideSternLine.nextVoice(s);return;}
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
          const opposed=s.stern?.phase==='draw'?Math.min(1,s.stern.draw*2):0;
          s.x+=(h.anchorX-s.x)*b;s.z+=(h.anchorZ+.21*opposed-s.z)*b;
          s.heading+=(.12*opposed-s.heading)*b;
        }
        if(s.stern&&!s.haul&&s.stern.phase==='reach'){
          // With only the head line fast the tide sets the stern back out.
          const drift=1-Math.exp(-dt*.46);
          s.z+=(Math.max(s.z,h.anchorZ+1.12)-s.z)*drift;
          s.heading+=(.13-s.heading)*drift;
        }
        if(s.stern?.phase==='draw'&&!s.haul){
          const settle=(1-Math.exp(-dt*1.4))*s.stern.draw;
          s.z+=(h.anchorZ-s.z)*settle;s.heading*=1-settle;
        }
        if(s.secured&&s.haul&&s.stern?.phase==='fast'&&Math.abs(s.x-h.anchorX)<.09&&Math.abs(s.z-h.anchorZ)<.09&&Math.abs(s.heading)<.035){
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
    if(s.stern){
      const f=s.stern.travel,d=TideSternLine.rail;
      b={x:helmSite.x+(d.x-helmSite.x)*f,y:helmSite.y+(d.y-helmSite.y)*f,z:helmSite.z+(d.z-helmSite.z)*f+.32*Math.sin(Math.PI*f)};
      if(!s.moored){
        const end=TideSternLine.points(g).tip,local=TideFloating.local(g.world.fenders.floatPose,end.x,end.y,end.z);
        const desired=clamp(Math.atan2(d.x-g.world.fenders.floatPose.anchorX-local.x,d.z-g.world.fenders.floatPose.anchorZ-local.z),-.94,.94);
        s.stern.turn+=(desired-s.stern.turn)*(1-Math.exp(-dt*5));
      }
      by=-(1-f)*Math.PI*.5+s.stern.turn*f;
    }
    if(t>0&&t<1&&!s.moored)ay=Math.atan2(radioSite.x-castSite.x,radioSite.z-castSite.z);
    if(t===1&&!s.moored&&!s.attached)ay=-s.bow.aim;
    moveTo(g,0,a,ay);moveTo(g,1,b,by);
    if(s.stern&&s.stern.travel<1)g.players[1].speed=1.17;
    if(t>0&&t<1&&!s.moored)g.players[0].speed=Math.hypot(castSite.x-radioSite.x,castSite.z-radioSite.z)*1.2;

  }
  function warn(g,msg){g.arrival.warning=msg;g.arrival.warnTo=g.time+2.5;}
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
    if(s.attached&&!s.secured&&Math.abs(thrust)<.12&&Math.abs(s.speed)<.68&&helm.use){s.secured=true;s.engineRunning=false;TideSternLine.start(g);}
    s.haul=s.attached&&s.secured&&k.use?1:0;
    advanceHull(g,s.plate.held?s.rudder:helm.x,thrust,dt);
    TideBowCast.step(g,k,dt,pressed,released);
    if(s.stern&&!s.moored)TideSternLine.step(g,helm,dt);
    placeCrew(g,dt);s.use=k.use;
    if(s.moored){
      s.done=true;g.engaged.fill(false);g.near.fill(false);g.fenders.moored=true;
      TideBerthBoard.start(g);g.events.checkpoint?.(g);g.alert(TideFenders.briefing,3);return;
    }
    display(g);
  }
  function display(g){
    const s=g.arrival;g.near.fill(true);g.engaged.fill(true);
    if(s.stern&&!s.moored){TideSternLine.show(g);return;}
    const bow=s.bow;
    let radio,read;
    if(s.radio==='tune'){radio='转动防水电台的旋钮。让掌舵的人告诉你值班频道。';read='频道 '+String(s.channel).padStart(2,'0');}
    else if(s.radio==='wait'){radio=g.time<s.warnTo?s.warning:'按住侧面的发话键，等林澈把话说完。';read='接收灯亮　／　发射灯灭';}
    else if(s.radio!=='line'){radio='听电台和艇上的回话。';read='北岬工作台　／　CH 12';}
    else if(s.moored){radio='通过艇上的窄走道，准备登岸。';read='首缆已系妥';}
    else if(s.attached){radio=s.secured?'按住操作键收缆，把船带到护舷旁。':'缆眼套住了。等同伴停机，再收紧。';read=s.secured?'船尾空挡　／　可以收缆':'首缆套住';}
    else if(bow.phase==='retrieve'){
      radio=bow.reason;read='按住操作键把余缆收回艇首';
    }else if(bow.phase==='wind'){
      radio='对着岸桩两只羊角松手。船还在走，绳圈也会跟船往前飞。';
      read='后摆 '+Math.round(bow.power*100)+'%　／　松手抛出';
    }else if(bow.phase==='air'||bow.phase==='swing'){
      radio='看绳圈落在羊角的哪一边。';read=bow.phase==='air'?'缆眼已离手':'向前送肩';
    }else{
      radio='找红白牌下的双角桩。左右瞄，前后调仰角。按住操作键后摆，松手抛缆。';
      read='仰角 '+Math.round(bow.loft*180/Math.PI)+'°　／　'+(s.misses?'缆已收回，再抛一把':'白点是这一把的弧线');
    }
    g.set(0,radio,{caption:read});
    const plate=s.plate,inspect=s.radio==='tune'&&!plate.reported;
    const pilot=plate.held?(plate.read?'读出值班频道，松开操作键抬头看堤。':'左右移动手套，把两位数字上的盐霜都擦掉。油门仍可进退。'):
      inspect?'舵轮旁有一块值班牌。按住操作键俯身看，报给艇首。':s.moored?'已贴靠。换位，让林澈去堤下的绞盘。':s.attached?(s.secured?'发动机已停。等首缆收紧。':'松开油门，减速后按住操作键停机。'):
      '看岸边红白「首缆」牌，向前进车，带船首靠过去。临近收油，过头可倒车。';
    g.set(1,pilot,{caption:(s.secured?'空挡':'航速 '+Math.abs(s.speed).toFixed(1)+' m/s')+(s.radio==='tune'?(plate.read?'　／　外港值班 12':'　／　舵座铜牌'):'')});
  }
  return {begin,step,active,voice,speech,cleat,deck,tell,helmSite,castSite,radioSite};
})();
