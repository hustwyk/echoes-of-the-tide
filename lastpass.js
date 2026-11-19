// The ship drifts lengthwise past a fixed pile. The lookout can see both collars
// clear the transom before the captain spends the last burst of propulsion.
const TideLastPass=(()=>{
  const home=-.96,heading=TideBayPassage.entry,clamp=TideTraversal.clamp;
  function begin(g){
    g.lastPass=g.index===11&&g.stage===2?{watch:TideSternWatch.create(),bay:TideBayPassage.create(),drift:0,wheel:Number.isFinite(g.leadAngle)?g.leadAngle:home,steer:1,next:'standby',warned:false,cleared:false,turned:false,arrived:false,
      voice:'',subtitle:'',clock:0,line:-1,occupied:false}:null;
    if(g.lastPass)g.cues.water=TideSternWatch.tide(g.time);
  }
  function yaw(g){return TideBayPassage.route(g.cues.rescue).yaw;}
  function vessel(g,t){
    const route=TideBayPassage.route(g.cues.rescue),r=g.lastPass,slide=4.35+6.72*(r?.drift||0),s=Math.sin(heading),c=Math.cos(heading),pile=TideLookout.marks.stump;
    const x=pile.x-slide*s-5.1*c+.17*Math.sin(t*.30)+route.x;
    const z=pile.z-slide*c+5.1*s+.11*Math.cos(t*.38)+route.z;
    return [x,g.cues.water+.5*(TideLookout.swell(x-2.5,z-2.8,t)+TideLookout.swell(x+2.5,z+2.8,t)),z];
  }
  function along(g){
    const p=vessel(g,g.time),mark=TideLookout.marks.stump,a=yaw(g);
    return (mark.x-p[0])*Math.sin(a)+(mark.z-p[2])*Math.cos(a);
  }
  function bowPoint(g){return onDeck(g,0,1.48,-7.85);}
  function bearing(g){
    if(g.lastPass.arrived)return home;
    const bow=bowPoint(g);return Math.atan2(bow[0]-14,-91-bow[2]);
  }
  function onDeck(g,x,y,z){
    const t=g.time,p=vessel(g,t),a=.028*Math.sin(t*.78),b=yaw(g),c=.034*Math.sin(t*.91);
    const u=x*Math.cos(c)-y*Math.sin(c),v=x*Math.sin(c)+y*Math.cos(c),n=z*Math.cos(b)-u*Math.sin(b);
    return [p[0]+u*Math.cos(b)+z*Math.sin(b),p[1]+v*Math.cos(a)-n*Math.sin(a),p[2]+v*Math.sin(a)+n*Math.cos(a)];
  }
  function local(g,point){
    const t=g.time,p=vessel(g,t),a=.028*Math.sin(t*.78),b=yaw(g),c=.034*Math.sin(t*.91);
    const x=point[0]-p[0],y=point[1]-p[1],z=point[2]-p[2];
    const v=y*Math.cos(a)+z*Math.sin(a),n=z*Math.cos(a)-y*Math.sin(a);
    const u=x*Math.cos(b)-n*Math.sin(b);
    return [u*Math.cos(c)+v*Math.sin(c),v*Math.cos(c)-u*Math.sin(c),x*Math.sin(b)+n*Math.cos(b)];
  }
  function shot(g,i){
    const r=g.lastPass;if(!r||!i||!g.state.mode||!g.near[1])return null;
    const p=TideLookout.marks.stump;
    if(!r.turned){
      const f=TideSternWatch.frame(g);if(!f)return null;
      return {eye:onDeck(g,...f.eye),at:onDeck(g,...f.at),fov:64-9*f.brace,handsOnly:true,aftWatch:true};
    }
    const close=TideBayPassage.shot(g);if(close)return close;
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
    if(id==='standby'){r.next='sighting';record(g);}
    if(id==='buried')record(g);
    if(id==='clear'){r.cleared=true;r.next='turn';record(g);}
    if(id==='turn'){r.turned=true;r.next='arriving';g.state.mode=2;record(g);}
    if(id==='berth'){r.arrived=true;record(g);}
  }
  function aimLight(g,bearing,wake){
    const ship=vessel(g,g.time);
    g.cues.pilot={bearing,bow:bowPoint(g),x:ship[0],z:ship[2],yaw:yaw(g),wake};
  }
  function release(g,input,dt){
    const q=g.state,r=g.lastPass;
    if(g.engaged[1]&&!r.occupied&&r.voice){
      // A keyed shore handset cuts off the ship. Request the complete report again.
      say(r,r.voice==='buried'&&TideSternWatch.reading(g).past?'':r.voice);
    }
    r.occupied=g.engaged[1];g.cues.water=TideSternWatch.tide(g.time);g.cues.light=g.engaged[0]?1:.28;
    if(g.engaged[0])r.wheel=clamp(r.wheel+input[0].x*dt*.30,-1.62,-.43);
    const target=bearing(g),aligned=Math.abs(r.wheel-target)<.061;
    aimLight(g,r.wheel,r.turned?.70:.12);
    const dial={vis:'dial',value:(r.wheel+1.62)/1.19,target:(target+1.62)/1.19,band:.051,
      caption:(r.arrived?'回位刻口':'船首方位')+'　'+Math.round(target*180/Math.PI)+'°　·　灯轴 '+Math.round(r.wheel*180/Math.PI)+'°'};
    if(!q.mode){
      g.set(0,'握稳手轮，左右调灯，把窄光落到船首。',dial);
      g.set(1,'按住发话键送最后一次引导。发话灯亮着时，船上听得到你。');
      q.hold=g.engaged.every(Boolean)&&aligned?q.hold+dt:0;
      if(q.hold>1.35){q.mode=1;g.alert('引导已经发出。把频道留给海雁号。',3);}
      return;
    }
    if(!r.turned){
      r.drift=clamp(r.drift+dt/19,0,1);
      TideSternWatch.move(g,input[1],dt);TideSternWatch.report(g,input[1]);
    }
    if(r.turned)TideBayPassage.watch(g,input[1],dt);
    g.set(0,r.arrived?'船尾进湾。左右转回原来的刻口，按确认锁轮。':'左右跟住船首，把窄光留给船长。',dial);
    g.set(1,r.turned?(r.occupied?'松开发话键让船尾完整回话。':r.arrived?'两舷都进湾了。收好手台，等灯轮回位。':r.bay.until>g.time?r.bay.feedback:'等船转直再靠住艉栏。黄顶界桩越过近处栏角时，在两舷各报一次。'):TideSternWatch.hint(g),{
      caption:r.occupied?'岸台发话　·　接收被占用':r.turned?(r.bay.side?'右舷':'左舷')+'　·　左 '+(r.bay.checked[0]?'已过':'待核')+'　右 '+(r.bay.checked[1]?'已过':'待核'):r.watch.sighted?'船尾来报':'海雁号　·　后甲板'});
    if(r.turned&&!r.arrived){
      // The single burst gives the hull way. Without a guiding light the
      // captain holds her heading and coasts until she can see the turn again.
      const guiding=g.engaged[0]&&aligned;
      r.steer+=(Number(guiding)-r.steer)*(1-Math.exp(-dt*(guiding?1.8:.68)));
      g.cues.rescue=clamp(g.cues.rescue+r.steer*dt/7.2,0,1);
      if(!guiding)g.set(0,'光离开船首了。握住手轮，找回船首让梁青继续带舵。',dial);
    }
    if(!r.voice&&!r.occupied){
      if(r.next==='standby')say(r,'standby');
      else if(r.next==='turn'&&g.engaged[0]&&aligned)say(r,'turn');
      else if(r.next==='arriving'&&g.engaged[0]&&aligned&&g.cues.rescue===1&&r.bay.checked.every(Boolean)&&!r.arrived)say(r,'berth');
    }
    receiver(g,dt);
    if(r.arrived&&aligned&&g.commit(0,input))g.advance();
  }
  function checkpoint(g){
    const r=g.lastPass;if(!r)return null;
    if(!r.cleared)return r.watch.aboard?{onWatch:true,asked:r.next==='sighting',warned:r.warned,watch:TideSternWatch.save(r.watch),drift:r.drift,wheel:r.wheel}:null;
    return {cleared:true,turned:r.turned,arrived:r.arrived,wheel:r.wheel,drift:r.drift,travel:g.cues.rescue,steer:r.steer,bayChecks:r.bay.checked.slice(),baySide:r.bay.side};
  }
  function restore(g,s){
    const r=g.lastPass;if(!r||(s?.cleared!==true&&s?.onWatch!==true))return;
    TideSternWatch.restore(r.watch,s.watch);
    if(s.cleared!==true){
      r.wheel=Number.isFinite(s.wheel)?clamp(s.wheel,-1.62,-.43):home;
      r.drift=clamp(Number(s.drift)||0,0,1);r.next=s.asked===true?'sighting':'standby';r.warned=s.warned===true;g.state.mode=1;
      g.field.done=true;g.players=g.section.sites.map(TideTraversal.spawn);g.checkpoints=g.section.sites.slice();return;
    }
    r.watch.sighted=true;
    r.cleared=true;r.wheel=Number.isFinite(s.wheel)?clamp(s.wheel,-1.62,-.43):home;r.drift=clamp(Number(s.drift)||1,0,1);r.warned=true;r.turned=s.turned===true;
    r.arrived=r.turned&&s.arrived===true;g.cues.rescue=r.turned?clamp(Number(s.travel)||0,0,1):0;
    r.steer=Number.isFinite(s.steer)?clamp(s.steer,0,1):1;
    if(r.arrived)g.cues.rescue=1;
    r.bay.checked=[0,1].map(i=>r.arrived||r.turned&&s.bayChecks?.[i]===true);
    r.bay.side=r.bay.pan=s.baySide===0?0:1;
    r.next=r.turned?'arriving':'turn';g.state.mode=r.turned?2:1;
    g.field.done=true;g.players=g.section.sites.map(TideTraversal.spawn);g.checkpoints=g.section.sites.slice();
  }
  return {begin,vessel,yaw,bowPoint,bearing,aimLight,along,reading:TideSternWatch.reading,onDeck,local,say,shot,release,checkpoint,restore};
})();
