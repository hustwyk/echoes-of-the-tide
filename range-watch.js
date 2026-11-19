// The two reef cameras share a 2.4 m base. The lower camera toes in to the
// distance set on Shen's drum. Only features at that distance join at the seam.
const TideRangeWatch=(()=>{
  const clamp=TideTraversal.clamp,baseline=2.4,eye=Object.freeze([-37.3,5.15,-89.8]),order=['stump','ship'];
  const limit=[15,60],names={stump:'双箍断桩',ship:'驾驶台前窗'};
  const deg=a=>Math.round(a*180/Math.PI*10)/10;
  function begin(g){
    g.rangeWatch=g.index===11&&g.stage===0?{phase:'sight',submitted:false,range:49,samples:[],lightAngle:-1.18,selection:0,
      feedback:['',''],until:[0,0],steady:0,voice:'',clock:0,line:-1,subtitle:'',queue:[],asked:false,heard:null,serial:0,cue:'',at:-1}:null;
  }
  function position(g,id){
    const p=TideLookout.marks.stump;
    return id==='stump'?[p.x+.16,-2.5,p.z+.32]:TideLastPass.onDeck(g,1.626,4.12,-3.96);
  }
  function optics(g){
    const c=TideLookout.camera(g),r=g.rangeWatch,y=c.yaw,p=c.pitch;
    if(r.phase!=='sight'){
      const wide={eye:c.eye,at:TideLastPass.onDeck(g,0,2.1,-1.5),fov:32};
      return {upper:wide,lower:wide};
    }
    const dir=[Math.sin(y)*Math.cos(p),Math.sin(p),-Math.cos(y)*Math.cos(p)];
    const eye=c.eye,lower=[eye[0]+baseline*Math.cos(y),eye[1],eye[2]+baseline*Math.sin(y)];
    const at=eye.map((v,i)=>v+r.range*dir[i]);
    return {upper:{eye,at,fov:8},lower:{eye:lower,at,fov:8}};
  }
  function measure(g,id){
    const r=g.rangeWatch,cam=TideLookout.camera(g),p=position(g,id);
    const [x,y,z]=p.map((v,i)=>v-cam.eye[i]),bearing=Math.atan2(x,-z),pitch=Math.atan2(y,Math.hypot(x,z));
    const distance=Math.hypot(x,y,z);
    // Difference of vergence angles, not a tolerance on a guessed range slider.
    const disparity=Math.atan2(baseline,distance)-Math.atan2(baseline,r.range);
    const water=g.cues.water+TideLookout.swell(p[0],p[2],g.time);
    return {id,distance,bearing,pitch,disparity,exposed:id!=='stump'||water<p[1]-.035,
      centered:Math.abs(bearing-cam.yaw)<.010&&Math.abs(pitch-cam.pitch)<.0075};
  }
  function cue(g,name){const r=g.rangeWatch;r.cue=name;r.at=g.time;r.serial++;}
  function say(r,name){if(!r.voice){r.voice=name;r.clock=0;r.line=-1;r.subtitle='';}else if(r.voice!==name&&!r.queue.includes(name))r.queue.push(name);}
  function listen(g,dt){
    const r=g.rangeWatch;if(!r.voice)return;
    r.clock+=dt;const clip=TideRangeSpeech[r.voice],n=clip.lines.findLastIndex(l=>l[0]<=r.clock);
    if(n>=0&&n!==r.line){r.line=n;r.subtitle=clip.lines[n][1];g.events.log?.(r.subtitle);}
    if(r.clock>=clip.duration){if(r.voice==='pile'||r.voice==='bridge')r.heard=r.voice;r.voice='';r.subtitle='';if(r.queue.length)say(r,r.queue.shift());}
  }
  function tell(g,side,message){const r=g.rangeWatch;r.feedback[side]=message;r.until[side]=g.time+2.2;g.alert(message,2.2);}
  function status(g,side,message,caption){const r=g.rangeWatch;g.set(side,r.until[side]>g.time?r.feedback[side]:message,{caption});}
  function readback(g,inputs,dt){
    const r=g.rangeWatch,w=g.watch,expected=order[r.samples.length];
    TideLookout.observe(g,inputs,dt);
    if(g.engaged[1]){
      const last=r.range;r.range=clamp(last+inputs[1].x*dt*8.4,limit[0],limit[1]);
      if(Math.floor(r.range)!==Math.floor(last)&&g.time-r.at>.09)cue(g,'drum');
    }
    const m=measure(g,expected),both=g.engaged.every(Boolean),cam=TideLookout.camera(g);
    if(g.commit(0,inputs)&&!w.marked){
      if(w.seen!==expected)tell(g,0,expected==='stump'?'找桩头，不看旁边的浮标。':'沿船侧往前找驾驶台上层第一扇窗。');
      else if(!m.exposed)tell(g,0,'接片线落在浪上。等桩箍露出来再报。');
      else {w.marked=expected;r.heard=null;say(r,expected==='stump'?'pile':'bridge');cue(g,'selector');}
    }
    const aligned=w.marked===expected&&m.exposed&&m.centered&&Math.abs(m.disparity)<.0023;
    r.steady=both&&aligned?r.steady+dt:0;
    status(g,0,w.marked?'稳住外礁镜，把要测的那条竖边留在十字正中。':
      expected==='stump'?'先找断桩。把缺箍旁的木边放在十字正中，报点。':'沿船舷找驾驶台。在靠船首的那扇窗前缘报点。',
      '外礁左镜　'+deg(cam.yaw)+'°');
    status(g,1,w.marked?'左右转测距鼓，让接片线上下的竖边接直，再压下抄数键。':'先看接片窗，等林澈说出他正对着的物件。',
      '测距鼓　'+r.range.toFixed(1)+' m　·　'+(w.marked?names[w.marked]:'未报点'));
    if(!g.commit(1,inputs))return;
    if(!w.marked){tell(g,1,'这一行还空着。先请林澈报出所看的物件。');return;}
    if(!both||!m.centered||!m.exposed){tell(g,1,'接片线上的边跑了。请同伴把竖边带回镜心。');return;}
    if(r.steady<.23){
      tell(g,1,'上下两半还没接稳。慢转到同一条边，停一拍。');
      if(!r.asked){r.asked=true;say(r,'steady');}
      return;
    }
    if(r.heard!==(expected==='stump'?'pile':'bridge')){
      tell(g,1,'两半接住了。听完林澈的报点，再把这行抄下来。');return;
    }
    r.samples.push({id:expected,distance:r.range,bearing:cam.yaw,pitch:cam.pitch});
    r.until=[0,0];w.step=r.samples.length;w.marked=null;r.steady=0;cue(g,'scribe');
    if(w.step===2){w.done=true;r.phase='light';r.lightAngle=lampBearing(g,r.samples[0]);say(r,'filed');}
    g.events.checkpoint?.(g);
  }
  function reconstructed(g,s){
    const eye=TideLookout.camera(g).eye,slope=Math.cos(s.pitch)*s.distance;
    return [eye[0]+Math.sin(s.bearing)*slope,eye[1]+Math.sin(s.pitch)*s.distance,eye[2]-Math.cos(s.bearing)*slope];
  }
  function lampBearing(g,s){
    const p=reconstructed(g,s);
    if(s.id==='ship'){
      const bow=TideLastPass.bowPoint(g),window=position(g,'ship');
      for(let i=0;i<3;i++)p[i]+=bow[i]-window[i];
    }
    return Math.atan2(p[0]-14,-91-p[2]);
  }
  function holdLight(g,inputs,dt){
    const r=g.rangeWatch,bow=TideLastPass.bowPoint(g);
    if(g.engaged[0])r.lightAngle=clamp(r.lightAngle+inputs[0].x*dt*.18,-1.5,-.46);
    if(g.engaged[1]&&Math.abs(inputs[1].x)>.50){
      const selection=Number(inputs[1].x>0);
      if(selection!==r.selection){r.selection=selection;cue(g,'selector');}
    }
    const chosen=r.samples[r.selection],requested=lampBearing(g,chosen);
    const onBow=Math.abs(r.lightAngle-Math.atan2(bow[0]-14,-91-bow[2]))<.045;
    g.cues.light=g.engaged[0]?.91:.24;
    TideLastPass.aimLight(g,r.lightAngle,.11);
    status(g,0,'照着沈遥抄下的方位转灯，把窄光落到船首，守住手轮。','岸灯手轮　'+deg(r.lightAngle)+'°');
    status(g,1,'左右拨选抄数联，把换算的方位读给林澈。看到船首进光再送出。',names[chosen.id]+'　'+chosen.distance.toFixed(1)+' m　·　灯轴 '+deg(requested)+'°');
    r.steady=g.engaged.every(Boolean)&&onBow&&r.selection===1&&Math.abs(requested-r.lightAngle)<.034?r.steady+dt:0;
    if(!g.commit(1,inputs))return;
    if(!r.selection){tell(g,1,'这一联是断桩。它标的是要留在暗里的礁边。');return;}
    if(r.steady<.34){tell(g,1,'光还没守在船首。把前窗那一联的灯轴度数读给同伴。');return;}
    g.leadAngle=r.lightAngle;r.submitted=true;cue(g,'selector');
  }
  function operate(g,inputs,dt){
    g.cues.water=-3.56+.045*Math.sin(g.time*.22);listen(g,dt);
    if(g.rangeWatch.phase==='sight')readback(g,inputs,dt);else if(!g.rangeWatch.submitted)holdLight(g,inputs,dt);
    else{
      g.set(0,'守住已经送出的方位，准备给船上发正式信号。');
      g.set(1,'船首已经入光。把抄数联留在台上，带两人走向雾号台。');
      if(!g.rangeWatch.voice){g.rangeWatch.phase='done';g.advance();}
    }
  }
  function shot(g,side,aspect){
    const r=g.rangeWatch;if(!r||side||!g.engaged[0])return null;
    if(r.phase==='sight')return {...TideLookout.camera(g),fov:28-7*(g.watch.magnification-1)};
    const eye=TideLookout.camera(g).eye,bow=TideLastPass.bowPoint(g);
    return {eye,at:bow,fov:aspect<.77?38:33};
  }
  function checkpoint(g){const r=g.rangeWatch;return r?.samples.length?{samples:r.samples.map(s=>({...s})),range:r.range,lightAngle:r.lightAngle,selection:r.selection}:null;}
  function restore(g,mark){
    const r=g.rangeWatch;if(!r||!Array.isArray(mark?.samples))return;
    const samples=[];
    for(const [i,s] of mark.samples.slice(0,2).entries()){
      if(!s||s.id!==order[i]||![s.distance,s.bearing,s.pitch].every(Number.isFinite)||s.distance<limit[0]||s.distance>limit[1]||Math.abs(s.bearing)>Math.PI||Math.abs(s.pitch)>Math.PI/2)break;
      samples.push({id:s.id,distance:s.distance,bearing:s.bearing,pitch:s.pitch});
    }
    if(!samples.length)return;
    r.samples=samples;r.range=Number.isFinite(mark.range)?clamp(mark.range,...limit):samples.at(-1).distance;r.selection=mark.selection===1?1:0;
    r.lightAngle=Number.isFinite(mark.lightAngle)?clamp(mark.lightAngle,-1.5,-.46):lampBearing(g,samples[0]);
    const last=samples.at(-1),cam=TideLookout.camera(g);
    g.watch.yaw=clamp(g.watch.yaw+last.bearing-cam.yaw,-1.35,1.35);g.watch.pitch=clamp(last.pitch,-.54,.21);
    g.watch.step=samples.length;g.watch.done=samples.length===2;r.phase=g.watch.done?'light':'sight';
    if(g.watch.done)say(r,'filed');
    g.field.done=true;g.players=g.section.sites.map(TideTraversal.spawn);g.checkpoints=g.section.sites.slice();
  }
  return {eye,baseline,begin,position,optics,measure,lampBearing,operate,shot,checkpoint,restore};
})();
