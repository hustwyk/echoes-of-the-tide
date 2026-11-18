// The pawl holds the last tooth while the carrier resets the handle. The
// shore operator's free cable bounds the next pull before the drum can move.
const TideWarping=(()=>{
  const {clamp}=TideTraversal,run=4.97;
  const phaseSite={kind:'warp',label:'链渡浮台',index:0};
  function create(){return {phase:'near',travel:0,stroke:0,purchase:0,clipped:false,released:false,work:false,pass:'',handAt:-10,load:0,grip:null,returning:false,catchAt:-10,releasedAt:-10,heard:{},queue:[],voice:'',clock:0,line:-1,subtitle:''};}
  function needed(g){return g.stage===1&&g.cable.hooks===1&&g.cable.carried&&(!g.cable.warp.released||!!g.cable.warp.pass);}
  function attach(g){return TideFloating.point(g.world.cableQuay.floatPose,.60,.66,.06);}
  function stance(g){return TideFloating.point(g.world.cableQuay.floatPose,.02,0,.06);}
  function site(g){
    const w=g.world.cableQuay,s=g.cable.warp;
    Object.assign(w.handle,stance(g),{label:s.returning?'等浮台回岸':s.phase==='far'?'浮台接头夹':s.clipped?'往复牵链':'浮台瓷夹'});
    return w.handle;
  }
  function build(w){
    w.handle={...phaseSite};w.floatPose=TideFloating.make([w.float],-3.50,-.17,-15.31,.95,.82,1.31);
  }
  function position(g,dt){
    const w=g.world.cableQuay,s=g.cable.warp;
    if(s.returning){s.travel=Math.max(0,s.travel-dt*.27);if(s.travel===0){s.returning=false;s.phase='near';}}
    TideFloating.step(w.floatPose,g.players,g.cable.water,g.time,dt,-3.50-.03*s.travel,-15.31-run*s.travel);
  }
  function lose(g){
    const s=g.cable.warp;s.clipped=s.released=s.work=false;s.pass='';s.grip=null;s.load=0;s.stroke=s.purchase=0;
    s.returning=s.travel>0;s.phase=s.returning?'cross':'near';
  }
  function docked(g){
    const s=g.cable.warp;s.phase='far';s.travel=1;s.returning=false;
  }
  function reach(g){
    const p=g.players[0],w=g.world.cableQuay;
    return !g.cable.warp.returning&&p.grounded&&p.ground===w.float&&Math.hypot(p.x-w.float.x,p.z-w.float.z)<1.13;
  }
  function cue(s,id){
    if(!s.heard[id]){s.heard[id]=true;s.queue.push(id);}
  }
  function narrate(g,dt){
    const a=g.cable,s=a.warp;
    if(a.overhead>=0||a.radio==='sending'||a.radio==='reply')return;
    if(!s.voice)s.voice=s.queue.shift()||'';
    if(!s.voice){s.subtitle='';return;}
    const clip=TideWarpSpeech[s.voice];s.clock+=dt;
    while(s.line+1<clip.lines.length&&s.clock>=clip.lines[s.line+1][0]){
      s.subtitle=clip.lines[++s.line][1];g.events.log?.(s.subtitle);
    }
    if(s.clock>=clip.duration){s.voice='';s.clock=0;s.line=-1;s.subtitle='';}
  }
  function work(g,k,dt){
    const a=g.cable,s=a.warp;
    s.work=g.engaged[0];s.grip=s.work&&s.clipped?'chain':null;
    if(s.pass){
      s.work=false;s.grip=null;
      g.set(0,s.pass==='take'?'握住接头，从瓷夹提起':'将接头压入瓷夹');
      if(g.time-s.handAt>=.38){if(s.pass==='take')s.releasedAt=g.time;s.pass='';}
      return;
    }
    if(!s.clipped){
      if(s.returning){g.set(0,'回缆正在收浮台。等它靠稳，再带接头上船');return;}
      g.set(0,s.returning?'在第一道鞍旁等回缆把浮台牵近':'带接头跳上浮台，在瓷夹旁按住操作再按跳跃扣住');
      if(s.work&&k.jump){s.clipped=true;s.pass='park';s.handAt=g.time;s.phase='cross';s.catchAt=g.time;cue(s,'report');g.alert('接头已入瓷夹。下层拉链，上层放线。',2.2);}
      return;
    }
    if(s.phase==='far'){
      g.set(0,'浮台抵住护木。按住操作再按跳跃取回接头，跃上对岸');
      if(s.work&&k.jump){s.clipped=false;s.released=true;s.releasedAt=g.time;s.pass='take';s.handAt=g.time;s.work=false;s.grip=null;g.alert('林澈：我拿到了。再给半臂线，我上岸扣鞍。',3);}
      return;
    }
    const start=TideCableQuay.anchor(g),clip=attach(g),free=a.payout-TideCableQuay.fixed(g);
    const span=Math.hypot(start.x-clip.x,start.y-clip.y,start.z-clip.z);
    const room=Math.max(0,free-span+.035);s.load=clamp(1-room/.42,0,1);
    if(s.work){
      const change=k.z*dt*1.42;
      if(change<0){
        s.stroke=clamp(s.stroke+change,0,1);if(s.stroke<=.045)s.purchase=s.stroke;
      }else if(change>0){
        const requested=clamp(s.stroke+change,0,1);
        const end=Math.min(requested,s.purchase+room/.91);
        s.stroke=end;
        if(end>s.purchase){s.travel=clamp(s.travel+(end-s.purchase)*.91/run,0,1);s.purchase=end;}
        if(s.travel>=.999){docked(g);s.catchAt=g.time;cue(s,'landing');g.alert('船头进了靠槽，先取接头再上岸。',2.5);}
      }
    }
    const instruction=room<.045?'线快绷直了，等上廊放线':s.stroke>=.96||s.stroke<s.purchase?'向前把把手送到底，让棘齿重新咬住':'按住操作并向后拉链，拉到底再向前回把';
    g.set(0,instruction,{vis:'dial',value:s.stroke,caption:'离接收槽 '+((1-s.travel)*run).toFixed(1)+' m'});
  }
  return {create,needed,attach,stance,site,build,position,lose,docked,reach,work,narrate};
})();
