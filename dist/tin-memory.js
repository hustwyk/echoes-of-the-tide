// Positions are metres in the sender's board frame. The children exchange the
// board and the tin after the first catch, keeping their own seats and cameras.
const TideTinMemory=(()=>{
  const {clamp}=TideTraversal;
  const pegs=[[-.058,-.045],[.054,.122]];
  const materials=['release','grain','peg','edge','rim','tin','wood','settle'];
  const active=g=>!!g.archive?.memory&&!g.archive.memory.done;
  const top=(m,x,z)=>.87+m.bank*x-m.slope*z+.009;
  const grip=(m,i)=>i===(m.dir===1?0:1);
  function speak(g,id){
    const m=g.archive.memory;
    if(m.voice){m.queue.push(id);return;}
    m.voice=id;m.clock=0;g.alert(TideTinLines[id].line,TideTinLines[id].duration);
  }
  function voiceStep(g,dt){
    const m=g.archive.memory;
    if(m.voice&&((m.clock+=dt)>=TideTinLines[m.voice].duration)){
      m.voice='';m.clock=0;if(m.queue.length)speak(g,m.queue.shift());
    }
  }
  function reset(m){
    m.phase='ready';m.age=0;m.dir=m.count? -1:1;
    m.x=m.count?.124:-.123;m.z=-.229;m.slope=.108;m.bank=0;m.vx=m.vz=m.vy=m.spin=0;
    m.y=top(m,m.x,m.z);m.catchX=m.count?-.117:.118;m.catchZ=.362;
    m.grain=0;m.runTime=0;m.track=[];m.touchedRim=false;m.rimmed=false;m.releaseQueued=false;
  }
  function readTakes(saved){
    const takes=[];
    for(const take of (Array.isArray(saved)?saved:[]).slice(0,2)){
      if(!Array.isArray(take)||!take.length||take.length>100)break;
      const valid=take.every((e,j)=>Array.isArray(e)&&e.length===4&&e.every((v,i)=>i===1?materials.includes(v):Number.isFinite(v))
        &&e[0]>=0&&e[0]<=12&&(!j||e[0]>=take[j-1][0])&&e[2]>=0&&e[2]<=1&&Math.abs(e[3])<=1);
      if(!valid||!take.some(e=>e[1]==='tin'))break;
      takes.push(take.map(e=>e.slice()));
    }
    return takes;
  }
  function create(g,saved){
    const m={count:0,takes:[],phase:'',age:0,elapsed:0,voice:'',clock:0,queue:[],events:[],serial:0,
      attempts:0,done:false,replay:-1,cursor:0,heard:[],turned:0};
    g.archive.memory=m;
    m.takes=readTakes(saved);
    m.count=m.takes.length;reset(m);
    if(m.count===2){m.x=m.catchX;m.z=m.catchZ;m.y=.658;prepareReplay(g);readings(g);return;}
    if(m.count===1)speak(g,'swap');
    else{speak(g,'wake');speak(g,'summer');}
    readings(g);
  }
  function sound(m,type,weight,pan,replay=false){
    const gain=clamp(weight,0,1),pos=clamp(pan,-1,1);
    const event={serial:++m.serial,time:m.elapsed,type,gain,pan:pos,replay};
    m.events.push(event);if(m.events.length>90)m.events.shift();
    if(!replay&&m.track.length<90){
      m.track.push([Math.round(m.runTime*1000)/1000,type,Math.round(gain*1000)/1000,Math.round(pos*1000)/1000]);
    }
  }
  function sequence(takes){
    let offset=.26;const events=[];
    for(const take of takes){
      for(const [time,id,gain,pan] of take)events.push([offset+time,id,gain,pan]);
      offset+=take[take.length-1][0]+.54;
    }
    return {events,end:offset+.15};
  }
  // The two takes stay with this pair. The seventh chapter's cable car has
  // the field recorder that Shen used to copy the childhood tape.
  function pocket(g,k,dt){
    const q=g.state;
    if(g.pocketTape?.length!==2||q.taps?.length)return false;
    const held=g.engaged.every(Boolean)&&k.every(input=>input.z<-.55);
    if(!held)q.pocketLatch=false;
    if(!q.pocket){
      q.pocketHold=held&&!q.pocketLatch?(q.pocketHold||0)+dt:0;
      if(q.pocketHold>=.46)q.pocketWaiting=true;
      if(!q.pocketWaiting)return false;
      if(g.swing?.voice){
        for(let i=0;i<2;i++)g.set(i,'等同伴说完，就放那一段录音。',{caption:'采音机已备好'});
        return true;
      }
      q.pocketWaiting=false;
      const clip=sequence(g.pocketTape);
      q.pocket={clip,cursor:0,elapsed:0,events:[],serial:0,track:[]};
      q.pocketLatch=true;q.pocketHold=0;
    }
    const player=q.pocket;player.elapsed+=dt;
    const items=player.clip.events;
    while(player.cursor<items.length&&items[player.cursor][0]<=player.elapsed){
      const [,id,gain,pan]=items[player.cursor++];sound(player,id,gain,pan,true);
    }
    const last=player.events.at(-1),mark=last?.type==='tin'?'铁盒响了':last?.type==='peg'?'图钉碰响':'螺丝擦过画板';
    for(let i=0;i<2;i++)g.set(i,'把采音机放在桌上，听刚才从旧工作带拷下的两声。',{
      caption:player.cursor?mark:'十秒钟北岬　·　童年的那一盘'});
    if(player.elapsed>player.clip.end+.40){q.pocket=null;q.pocketLatch=held;}
    return true;
  }
  function prepareReplay(g){
    const m=g.archive.memory;m.phase='playback';m.age=0;m.replay=-1;m.cursor=0;
    const clip=sequence(m.takes);m.heard=clip.events;m.end=clip.end;speak(g,'listen');
  }
  function act(g,k,dt){
    const m=g.archive.memory,from=m.dir===1?0:1,to=1-from;
    const send=k[from],receive=k[to];
    const response=1-Math.exp(-dt*7);
    if(['ready','roll','air','miss'].includes(m.phase)){
      m.bank+=((send.use?send.x*.36:0)-m.bank)*response;
      m.slope+=((send.use?.153-send.z*.151:.105)-m.slope)*response;
      if(receive.use){
        m.catchX=clamp(m.catchX+receive.x*.37*dt,-.216,.216);
        m.catchZ=clamp(m.catchZ+receive.z*.30*dt,.311,.484);
      }else{
        const stow=1-Math.exp(-dt*3.8);m.catchX+=(.221-m.catchX)*stow;m.catchZ+=(.475-m.catchZ)*stow;
      }
    }
    if(m.phase==='ready'){
      m.y=top(m,m.x,m.z);
      if(send.use&&send.jump)m.releaseQueued=true;
      if(!send.use)m.releaseQueued=false;
      if(m.releaseQueued&&m.voice!=='wake'){
        m.phase='roll';m.age=0;m.attempts++;m.runTime=0;
        sound(m,'release',.44,m.x*m.dir*3);
      }
      return;
    }
    if(m.phase==='roll'){
      m.runTime+=dt;
      m.vx+=(-4.2*m.bank-.88*m.vx)*dt;m.vz+=(4.7*m.slope-.65*m.vz)*dt;
      m.x+=m.vx*dt;m.z+=m.vz*dt;
      if(Math.abs(m.x)>.186){
        m.x=Math.sign(m.x)*.186;
        if(Math.abs(m.vx)>.014)sound(m,'edge',clamp(Math.abs(m.vx)*2,.15,.87),m.x*m.dir*3);
        m.vx*=-.40;
      }
      for(const [px,pz] of pegs){
        const dx=m.x-px,dz=m.z-pz,d=Math.hypot(dx,dz);
        if(d>=.023||d<.000001)continue;
        const nx=dx/d,nz=dz/d,v=m.vx*nx+m.vz*nz;
        m.x=px+nx*.023;m.z=pz+nz*.023;
        if(v<0){m.vx-=1.5*v*nx;m.vz-=1.5*v*nz;if(v<-.024)sound(m,'peg',clamp(-v*2,.18,.98),px*m.dir*3);}
      }
      const speed=Math.hypot(m.vx,m.vz);m.spin+=speed*dt/.008;
      m.grain+=speed*dt;
      if(m.grain>.047){m.grain%=.047;sound(m,'grain',Math.min(1,.12+speed*.65),m.x*m.dir*3);}
      m.y=top(m,m.x,m.z);
      if(m.z>=.28){m.phase='air';m.age=0;m.vy=m.bank*m.vx-m.slope*m.vz;}
      if(m.runTime>9){m.phase='miss';m.age=0;g.alert('螺丝抵住了图钉。把画板往旁边倾一点，再放一次。',2.2);}
      return;
    }
    if(m.phase==='air'){
      const oldY=m.y;m.runTime+=dt;m.vy-=9.81*dt;
      m.x+=m.vx*dt;m.z+=m.vz*dt;m.y+=m.vy*dt;m.spin+=m.vz*dt/.008;
      if(!m.touchedRim&&oldY>=.713&&m.y<.713){
        m.touchedRim=true;
        const fraction=(oldY-.713)/(oldY-m.y);
        const x=m.x-m.vx*dt*(1-fraction),z=m.z-m.vz*dt*(1-fraction);
        const dx=x-m.catchX,dz=z-m.catchZ;
        if(Math.abs(dx)<.059&&Math.abs(dz)<.049){
          m.x=x;m.z=z;m.phase='caught';m.age=0;m.y=.697;
          sound(m,'tin',clamp(.46+Math.abs(m.vy)*.26,0,1),x*m.dir*3);
          // A short roll along the actual tin bottom is part of the recorded take.
          m.landX=x;m.landZ=z;m.impact=Math.min(1,Math.abs(m.vy));
          return;
        }
        if(Math.abs(dx)<.087&&Math.abs(dz)<.078){
          m.x=x;m.z=z;m.y=.715;m.vy=Math.min(.52,Math.abs(m.vy)*.32);
          if(Math.abs(dx)/.064>Math.abs(dz)/.054)m.vx=Math.sign(dx)*(.19+Math.abs(m.vx)*.3);
          else m.vz=Math.sign(dz)*(.22+Math.abs(m.vz)*.35);
          m.rimmed=true;sound(m,'rim',.63,m.x*m.dir*3);
        }
      }
      if(m.y<=.650){
        m.y=.65;m.phase='miss';m.age=0;
        sound(m,'wood',.62,m.x*m.dir*3);g.alert(m.rimmed?'擦到铁边，弹出去了。再把盒口移近半指。':'木头上是闷的一声。再来，同伴把盒口跟到螺丝前面。',2.1);
      }
      return;
    }
    if(m.phase==='caught'){
      m.runTime+=dt;m.y=Math.max(.658,m.y-dt*.20);
      m.x=clamp(m.landX+m.vx*.07*(1-Math.exp(-m.age*8)),m.catchX-.054,m.catchX+.054);
      m.z=clamp(m.landZ+.044*(1-Math.exp(-m.age*8)),m.catchZ-.043,m.catchZ+.043);
      m.spin+=m.vz*Math.exp(-m.age*9)*dt/.008;
      if(m.age>.25&&m.track.at(-1)[1]!=='settle')sound(m,'settle',.26+.21*m.impact,m.x*m.dir*3);
      if(m.age>.63){
        m.takes.push(m.track.map(e=>e.slice()));m.count=m.takes.length;
        g.events.checkpoint?.(g);
        if(m.count===2)prepareReplay(g);
        else{m.phase='return';m.age=0;m.turned=0;speak(g,'swap');}
      }
      return;
    }
    if(m.phase==='return'){
      if(m.voice==='swap'||!m.voice)m.turned=Math.min(1,m.turned+dt/1.35);
      if(m.turned===1)reset(m);return;
    }
    if(m.phase==='miss'&&m.age>.96){reset(m);return;}
    if(m.phase==='playback'){
      if(m.replay<0){
        if(!m.voice&&!m.queue.length&&!send.use&&!receive.use){m.replay=0;m.cursor=0;}
      }else{
        m.replay+=dt;
        while(m.cursor<m.heard.length&&m.heard[m.cursor][0]<=m.replay){
          const [,id,gain,pan]=m.heard[m.cursor++];sound(m,id,gain,pan,true);
        }
        if(m.replay>m.end){m.phase='home';m.age=0;speak(g,'back');}
      }
    }else if(m.phase==='home'&&!m.voice){
      m.done=true;g.advance();
    }
  }
  function step(g,k,dt){
    const m=g.archive.memory;m.age+=dt;m.elapsed+=dt;voiceStep(g,dt);
    if(m.phase==='playback'&&!m.poolVisited){
      m.poolHold=k.every(input=>input.jumpHeld&&!input.use)?(m.poolHold||0)+dt:0;
      if(m.poolHold>=.45){m.poolRequested=m.poolVisited=true;}
    }
    g.near=[true,true];g.engaged=k.map(input=>input.use);act(g,k,dt);readings(g);
  }
  function readings(g){
    const m=g.archive.memory;
    for(let i=0;i<2;i++){
      const sender=grip(m,i);
      let line=sender?'扶住画板，左右倾斜避开图钉。向前抬高后沿，按确认松手。':'端住饼干盒，前后左右移到螺丝飞出的位置，接进盒口。';
      if(m.phase==='ready'&&m.releaseQueued&&sender)line='手指按好螺丝了。扶稳画板，等沈遥端起盒子。';
      if(m.phase==='return')line='把盒子和画板递过桌子，下一颗换你来。';
      if(m.phase==='playback'||m.phase==='home')line=m.replay<0?'把手里的东西放下，一起听刚才录的两声。':'听十秒钟北岬。';
      if(m.phase==='playback'&&!m.poolVisited)line='两人按住跳跃去窗外赛船，或留下听完这盘带子。';
      if(m.phase==='playback'&&Number.isInteger(m.poolResult))line=(m.poolResult===-1?'窗台上，两艘船分着一个瓶盖。':(m.poolResult===0?'林澈':'沈遥')+'把瓶盖留在了窗台上。')+'听，带子还在转。';
      const impulse=m.events.filter(e=>e.replay&&e.type!=='grain'&&e.type!=='settle').at(-1);
      const heard=impulse&&m.elapsed-impulse.time<.45?(impulse.type==='tin'?'叮　·　螺丝落进铁盒':impulse.type==='peg'?'嗒　·　撞过图钉':impulse.type==='edge'?'擦过板边':'松开螺丝'):'磁带回放';
      g.set(i,line,{caption:m.phase==='miss'?'掉在木头上　·　这一颗重来':m.phase==='caught'?'落进铁盒　·　录下来了':m.phase==='playback'&&m.replay>=0?heard:sender?'画板　·　'+(m.dir===1?'第一颗':'第二颗'):'饼干铁盒'});
    }
  }
  function shot(g,i){
    const m=g.archive.memory,side=i?1:-1,sender=grip(m,i);
    // The sender sees the whole board. From the receiver's lower angle, the
    // lip of the tin and the airborne gap are the most legible cues.
    const normal=sender?
      {eye:[32+side*.205,1.36,side*.55],at:[32+m.dir*m.x*.09,.809,-side*.062],fov:49}:
      {eye:[32+side*.49,1.085,side*.62],at:[32+m.dir*m.catchX*.49,.750,side*.255],fov:49};
    const opening=clamp((3.8-m.elapsed)/1.05,0,1);
    const passing=m.phase==='return'?Math.sin(Math.PI*m.turned):0;
    const listening=m.phase==='playback'||m.phase==='home'?clamp(m.age/.64,0,1):0;
    const amount=Math.max(opening,passing,listening);
    const ease=amount*amount*(3-2*amount);
    const eye=[32+side*.455,1.23,side*.94],at=[32,1.035,-side*.25];
    for(let j=0;j<3;j++){
      normal.eye[j]+=(eye[j]-normal.eye[j])*ease;
      normal.at[j]+=(at[j]-normal.at[j])*ease;
    }
    normal.memory=true;return normal;
  }
  return {create,step,active,shot,top,readTakes,pocket};
})();
