// Bearings are calculated from the same world-space navigation marks seen in both cameras.
const TideLookout=(()=>{
  const {clamp}=TideTraversal;
  const labels={buoy:'旧绿标',stump:'断桩',ship:'海雁号驾驶台'};
  const watch={
    '2/1':{watcher:1,targets:['buoy','ship'],caption:'航线复电前辨认旧标',hints:['单盏绿灯正压在白浪边上','沿它往右找船，窗户亮着']},
    '7/1':{watcher:0,targets:['ship'],caption:'在变动的浪影中取得船位',hints:['驾驶台在船中部，天线朝那排窗']},
    '8/2':{watcher:1,targets:['buoy','stump'],caption:'从船尾的角度排除浅槽',hints:['先看旧浮标，顶上有一盏灯','向右找缺掉半截的黑桩，桩顶缠着两圈铁箍']},
    '11/0':{watcher:0,targets:['stump','ship'],caption:'锁定转向点和船首方位',hints:['海图十字落在双环断桩','我看到船影越过桩，再找船上的亮窗']}
  };
  function reset(g){
    const task=watch[g.index+'/'+g.stage];
    g.watch=task?{task,done:false,step:0,yaw:0,pitch:-.13,seen:null,marked:null,settle:0}:null;
  }
  const marks={buoy:{x:-42,z:-120},stump:{x:-30,z:-116},ship:{x:-17,z:-110}};
  // Matches the four displacement waves in the ocean vertex shader.
  function swell(x,z,t){
    return .46*Math.sin(x*.23+z*.11+t*1.12)+.34*Math.sin(-x*.17+z*.29-t*.88)+.18*Math.sin(x*.49-z*.41+t*1.42)+.09*Math.sin(x*.81+z*.62-t*1.64);
  }
  function vessel(g,t){
    if(g.index===11)return TideLastPass.vessel(g,t);
    if(g.survey)return TideSoundings.vessel(g,t);
    if(g.relay)return TideRelay.vessel(g,t);
    if(g.signal){const p=TideSignal.ship(g,t);return [p.x,p.y,p.z];}
    const f=g.cues.rescue;
    const x=marks.ship.x+(g.index===9?9.5:0)-16*f+Math.sin(t*.055)*1.8,z=marks.ship.z-(g.index===9?6:0)-12*f;
    return [x,g.cues.water+.5*(swell(x-3,z,t)+swell(x+3,z,t)),z];
  }
  function point(g,id){
    const t=g.time,w=g.cues.water;
    if(id==='buoy')return [marks.buoy.x,w+(g.survey?TideSoundings.swell:swell)(marks.buoy.x,marks.buoy.z,t)+2.97,marks.buoy.z];
    if(id==='stump')return [marks.stump.x,g.survey||g.index===11?-2.52:-1.16,marks.stump.z];
    const position=vessel(g,t);position[1]+=3.7;return position;
  }
  // Telescopes sit beyond the outer rail, clear of the overhead crane and tower walls.
  function camera(g){
    const w=g.watch,side=w.task.watcher;
    const e=g.world.relay?.eye;
    const eye=g.survey?TideSoundings.stern(g):e?[e.x,e.y,e.z]:g.signal?TideSignal.scope(g):[side?-21.3:-37.3,side?4.35:5.15,-89.8];
    const base=g.survey?Math.atan2(-36-eye[0],eye[2]+118):e?Math.atan2(-20-e.x,e.z+110):g.signal?Math.atan2(-26-eye[0],eye[2]+113):Math.atan2(-32-eye[0],117+eye[2]);
    const yaw=base+w.yaw,pitch=w.pitch;
    return {eye,at:[eye[0]+Math.sin(yaw)*Math.cos(pitch),eye[1]+Math.sin(pitch),eye[2]-Math.cos(yaw)*Math.cos(pitch)],yaw,pitch};
  }
  function active(g){return !!g.watch&&!g.watch.done&&g.field.done;}
  function observe(g,inputs,dt){
    const w=g.watch,d=w.task.watcher,k=inputs[d];
    if(g.engaged[d]){
      w.yaw=clamp(w.yaw+k.x*dt*.53,-1.35,1.35);
      w.pitch=clamp(w.pitch-k.z*dt*.34,-.54,.21);
    }
    const {eye,yaw,pitch}=camera(g);
    w.seen=null;
    let best=.021;
    for(const id of Object.keys(labels)){
      if(g.survey&&(id==='ship'||id==='stump'&&!TideSoundings.exposed(g)))continue;
      const [x,y,z]=point(g,id),dx=x-eye[0],dz=z-eye[2];
      const error=Math.hypot(Math.atan2(dx,-dz)-yaw,Math.atan2(y-eye[1],Math.hypot(dx,dz))-pitch);
      if(error<best){best=error;w.seen=id;}
    }
    return {eye,yaw};
  }
  function interact(g,inputs,dt){
    if(!active(g))return false;
    const w=g.watch,task=w.task,d=task.watcher,rec=1-d;
    const {yaw}=observe(g,inputs,dt);
    const expected=task.targets[w.step];
    const waiting=w.marked!==null;
    g.set(d,waiting?'保持视线，等同伴把观测记入记录簿':'按住操作键看镜，前后左右移动准星，按跳跃键报出目标',{
      caption:'视场 '+Math.round(yaw*180/Math.PI)+'°　'+(w.seen?labels[w.seen]:'扫视海面')});
    g.set(rec,task.hints[w.step],{caption:waiting?'收到「'+labels[w.marked]+'」。按跳跃键核对记录':'观测记录 '+(w.step+1)+' / '+task.targets.length+'　请同伴找'+labels[expected]});
    if(g.commit(d,inputs)&&!waiting){
      if(w.seen){w.marked=w.seen;g.sound(540,.08);}
      else g.alert(g.survey&&expected==='stump'?'浪沫会遮住铁箍，等波谷露桩再报。':'准星里只有海面，沿水平线继续扫视',1.7);
    }
    if(waiting&&g.commit(rec,inputs)){
      if(w.marked!==expected){g.alert('观测物与海图不符，再核对外形和位置');}
      else if(++w.step===task.targets.length){w.done=true;g.alert(task.caption+'　·　双方已记录');g.sound(650,.16);}
      else g.alert('位置已记入，寻找下一个观测物');
      w.marked=null;
    }
    return true;
  }
  return {reset,point,camera,active,observe,interact,labels,marks,vessel,swell};
})();
