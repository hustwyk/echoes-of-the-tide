// The ship drifts lengthwise past a fixed pile. The lookout can see both collars
// clear the transom before the captain spends the last burst of propulsion.
const TideLastPass=(()=>{
  const home=-.96,heading=-2.19,clamp=TideTraversal.clamp,transom=8.45;
  function begin(g){
    g.lastPass=g.index===11&&g.stage===2?{drift:0,wheel:home,next:'standby',warned:false,cleared:false,turned:false,arrived:false,
      voice:'',subtitle:'',clock:0,line:-1,occupied:false}:null;
  }
  function yaw(g){return heading-.68*g.cues.rescue;}
  function vessel(g,t){
    const f=g.cues.rescue,r=g.lastPass,slide=4.35+6.72*(r?.drift||0),s=Math.sin(heading),c=Math.cos(heading),pile=TideLookout.marks.stump;
    const x=pile.x-slide*s-5.1*c+.17*Math.sin(t*.30)-8.4*f;
    const z=pile.z-slide*c+5.1*s+.11*Math.cos(t*.38)+14.8*f;
    return [x,g.cues.water+.5*(TideLookout.swell(x-2.5,z-2.8,t)+TideLookout.swell(x+2.5,z+2.8,t)),z];
  }
  function along(g){
    const p=vessel(g,g.time),mark=TideLookout.marks.stump,a=yaw(g);
    return (mark.x-p[0])*Math.sin(a)+(mark.z-p[2])*Math.cos(a);
  }
  function bearing(g){
    if(g.lastPass.arrived)return home;
    const p=vessel(g,g.time);return Math.atan2(p[0]-14,-91-p[2]);
  }
  function onDeck(g,x,y,z){
    const t=g.time,p=vessel(g,t),a=.028*Math.sin(t*.78),b=yaw(g),c=.034*Math.sin(t*.91);
    const u=x*Math.cos(c)-y*Math.sin(c),v=x*Math.sin(c)+y*Math.cos(c),n=z*Math.cos(b)-u*Math.sin(b);
    return [p[0]+u*Math.cos(b)+z*Math.sin(b),p[1]+v*Math.cos(a)-n*Math.sin(a),p[2]+v*Math.sin(a)+n*Math.cos(a)];
  }
  function shot(g,i){
    const r=g.lastPass;if(!r||!i||!g.state.mode||!g.near[1])return null;
    const p=TideLookout.marks.stump;
    if(!r.turned){
      const stern=onDeck(g,1.92,1.60,8.23);
      return {eye:onDeck(g,-.67,3.20,7.0),at:[p.x*.80+stern[0]*.20,-2.41*.80+stern[1]*.20,p.z*.80+stern[2]*.20],fov:56,handsOnly:true};
    }
    const ship=vessel(g,g.time);
    return {eye:[p.x-5.05,2.20,p.z-2.3],at:[ship[0],ship[1]+1.64,ship[2]],fov:57,handsOnly:true};
  }
  function say(r,name){r.voice=name;r.clock=0;r.line=-1;r.subtitle='';}
  function record(g){g.events.checkpoint?.(g);}
  function receiver(g,dt){
    const r=g.lastPass;
    if(!r.voice||r.occupied)return;
    const clip=TidePassSpeech[r.voice];r.clock+=dt;
    const j=clip.lines.findLastIndex(l=>l[0]<=r.clock);
    if(j>=0&&r.line!==j){r.line=j;r.subtitle=clip.lines[j][1];g.events.log?.(r.subtitle);}
    if(r.clock<clip.duration)return;
    const id=r.voice;say(r,'');
    if(id==='standby')r.next='sighting';
    if(id==='clear'){r.cleared=true;r.next='turn';record(g);}
    if(id==='turn'){r.turned=true;r.next='arriving';g.state.mode=2;record(g);}
    if(id==='berth'){r.arrived=true;record(g);}
  }
  function release(g,input,dt){
    const q=g.state,r=g.lastPass;
    if(g.engaged[1]&&!r.occupied&&r.voice){
      // A keyed shore handset cuts off the ship. Request the complete report again.
      say(r,r.voice==='buried'&&along(g)>transom?'':r.voice);
    }
    r.occupied=g.engaged[1];g.cues.light=g.engaged[0]?1:.28;
    if(g.engaged[0])r.wheel=clamp(r.wheel+input[0].x*dt*.30,-1.62,-.43);
    const target=bearing(g),aligned=Math.abs(r.wheel-target)<.061,ship=vessel(g,g.time);
    g.cues.pilot={bearing:r.wheel,x:ship[0],z:ship[2],yaw:yaw(g),wake:r.turned?.70:.12};
    const dial={vis:'dial',value:(r.wheel+1.62)/1.19,target:(target+1.62)/1.19,band:.051,
      caption:(r.arrived?'回位刻口':'船首方位')+'　'+Math.round(target*180/Math.PI)+'°　·　灯轴 '+Math.round(r.wheel*180/Math.PI)+'°'};
    if(!q.mode){
      g.set(0,'握稳手轮，左右调灯，把窄光落到船首。',dial);
      g.set(1,'按住发话键送最后一次引导。发话灯亮着时，船上听得到你。');
      q.hold=g.engaged.every(Boolean)&&aligned?q.hold+dt:0;
      if(q.hold>1.35){q.mode=1;g.alert('引导已经发出。把频道留给海雁号。',3);}
      return;
    }
    if(!r.turned)r.drift=clamp(r.drift+dt/19,0,1);
    const past=along(g)>transom,tail=r.turned?'背风水域':past?'两道铁箍均已越过船尾':'断桩仍在船身外侧';
    g.set(0,r.arrived?'船尾进湾。左右转回原来的刻口，按确认锁轮。':'左右跟住船首，把窄光留给船长。',dial);
    g.set(1,r.occupied?'松开发话键，让船上完整复述这句话。':'听船尾报告，等驾驶台自己动舵。',{caption:r.occupied?'岸台发话　·　接收被占用':tail});
    if(r.turned)g.cues.rescue=clamp(g.cues.rescue+dt/7.2,0,1);
    if(!r.voice&&!r.occupied){
      if(r.next==='standby')say(r,'standby');
      else if(r.next==='sighting'){
        if(past)say(r,'clear');
        else if(!r.warned){r.warned=true;say(r,'buried');}
      }else if(r.next==='turn'&&g.engaged[0]&&aligned)say(r,'turn');
      else if(r.next==='arriving'&&g.cues.rescue===1&&!r.arrived)say(r,'berth');
    }
    receiver(g,dt);
    if(r.arrived&&aligned&&g.commit(0,input))g.advance();
  }
  function checkpoint(g){
    const r=g.lastPass;if(!r?.cleared)return null;
    return {cleared:true,turned:r.turned,arrived:r.arrived,wheel:r.wheel,drift:r.drift,travel:g.cues.rescue};
  }
  function restore(g,s){
    const r=g.lastPass;if(!r||s?.cleared!==true)return;
    r.cleared=true;r.wheel=Number.isFinite(s.wheel)?clamp(s.wheel,-1.62,-.43):home;r.drift=clamp(Number(s.drift)||1,0,1);r.warned=true;r.turned=s.turned===true;
    r.arrived=r.turned&&s.arrived===true;g.cues.rescue=r.turned?clamp(Number(s.travel)||0,0,1):0;
    if(r.arrived)g.cues.rescue=1;
    r.next=r.turned?'arriving':'turn';g.state.mode=r.turned?2:1;
    g.field.done=true;g.players=g.section.sites.map(TideTraversal.spawn);g.checkpoints=g.section.sites.slice();
  }
  return {begin,vessel,yaw,bearing,along,shot,release,checkpoint,restore};
})();
