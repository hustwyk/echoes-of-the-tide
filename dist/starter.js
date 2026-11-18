// The starter and the lamp generator have separate inertia until the friction plates lock.
const TideStarter=(()=>{
  const {clamp}=TideTraversal;
  function create(){
    return {stroke:0,armed:true,strokes:0,rpm:.13,spin:0,trim:.48,linked:false,
      shift:0,drivenRPM:0,drivenSpin:0,coupling:'open',slips:0,biteCalled:false,
      loaded:false,lines:[],caption:'',foley:{ratchet:-10,scrape:-10,seat:-10}};
  }
  function narrate(g,dt){
    const r=g.signal;
    if(r.voice){
      r.clock+=dt;
      if(r.clock>=TideShiftSpeech[r.voice].duration){r.voice='';r.clock=0;r.caption='';}
    }
    if(!r.voice&&r.lines.length){r.voice=r.lines.shift();r.clock=0;}
    if(!r.voice)return;
    const line=TideShiftSpeech[r.voice].lines.findLast(([at])=>at<=r.clock)?.[1]||'';
    if(line!==r.caption){r.caption=line;if(line)g.events.log?.(line);}
  }
  function recoil(g){
    const r=g.signal;
    r.coupling='return';r.slips++;r.foley.scrape=g.time;
    if(r.lines.includes('load')){r.loaded=false;r.lines=r.lines.filter(v=>v!=='load');}
    if(r.slips===1||!r.voice&&!r.lines.length)r.lines.push('slip');
  }
  function step(g,dt){
    const r=g.signal;
    narrate(g,dt);
    if(r.linked){
      r.rpm+=(.57-r.rpm)*(1-Math.exp(-dt*1.3));r.drivenRPM=r.rpm;
    }else{
      const pressure=clamp((r.shift-.19)/.54,0,1);
      const transfer=(r.rpm-r.drivenRPM)*pressure*1.96;
      r.rpm=clamp(r.rpm-(.019+.73*transfer)*dt,0,1);
      r.drivenRPM=clamp(r.drivenRPM+(transfer-.014-r.drivenRPM*.018)*dt,0,1);
    }
    r.drivenSpin+=r.drivenRPM*dt*10.7;
  }
  function work(g,k,dt){
    const r=g.signal,[left,right]=g.engaged;
    if(left&&!r.linked){
      r.stroke=clamp(r.stroke+k[0].z*dt*2.05,0,1);
      if(r.stroke<.12)r.armed=true;
      if(r.stroke>.88&&r.armed){
        r.strokes++;r.armed=false;r.rpm=Math.min(.99,r.rpm+.15);r.foley.ratchet=g.time;
      }
    }
    const green=r.rpm>=.50&&r.rpm<=.82;
    if(r.coupling==='open'){
      if(right)r.trim=clamp(r.trim+k[1].x*dt*.48,0,1);
      if(g.commit(1,k)){
        if(left&&green&&Math.abs(r.trim-r.rpm)<.105){
          r.coupling='feed';
        }else if(g.time-r.early>1.4){r.early=g.time;g.alert(!left?'等同伴先握住起动柄。':'黑针进绿弧，把红针对上去再解锁。',2);}
      }
    }else if(r.coupling==='feed'){
      r.shift=clamp(r.shift+(right?-k[1].z*.67:-1.7)*dt,0,1);
      if(!right&&r.shift<.01){r.shift=0;r.coupling='open';}
      else if(r.shift>.21&&!r.biteCalled){r.biteCalled=true;r.lines.push('bite');}
      else if(r.shift>.34&&!r.loaded){r.loaded=true;r.lines.push('load');}
      const difference=Math.abs(r.rpm-r.drivenRPM);
      if(r.shift>.72&&(difference>.18||r.rpm<.36))recoil(g);
      else if(r.shift>.965&&r.drivenRPM>=.46&&r.rpm>=.50&&difference<.105){
        r.coupling='latched';r.linked=true;r.shift=1;r.foley.seat=g.time;
        r.lines.push('ready','lamp');g.events.checkpoint?.(g);
      }
    }else if(r.coupling==='return'){
      r.shift=Math.max(0,r.shift-dt*2.75);
      if(r.shift===0&&(!right||k[1].z>=-.10))r.coupling='open';
    }else if(!r.voice&&!r.lines.length)g.advance();
    g.state.dials=[r.stroke,r.trim];
    if(r.linked){
      g.set(0,'飞轮已带住灯机，可以松手。',{caption:'留意对面的小灯'});
      g.set(1,'离合柄已落座，查看试灯。',{caption:'黄灯亮　·　外侧回路还断着'});return;
    }
    const feeding=r.coupling==='feed',returned=r.coupling==='return';
    g.set(0,feeding?'离合一沾上，飞轮会慢。回推起动柄，再补一程。':'握住起动柄，拉到底，再推回去扣住下一齿。',{
      caption:r.rpm>.82?'转得太快，让它空转一会儿':feeding&&r.rpm<.50?'转速落下来了，接着摇':green?'飞轮已进工作转速':!r.armed?'棘爪走到头，往前推回':'看对面的表，听飞轮起速'});
    g.set(1,returned?'离合柄弹回来了。松开前推，重新对针。':feeding?'向前送离合柄。两只轮盘速度不同时在中段停手，等同伴补摇；转齐后再推到底。':'握住操作台，左右转动红针。黑针进绿弧、两针相合时按确认解锁离合柄。',{
      caption:returned?'压盘正在退回':!feeding?(green?'看两针是否重合':'等黑针进绿弧'):r.shift<.30?'把柄送向中段，两只轮盘开始接触':Math.abs(r.rpm-r.drivenRPM)>.14?'两边的漆记一快一慢':r.drivenRPM<.46?'轮盘已跟上，飞轮还得再快一点':'两边的漆记已跟齐，可以继续送柄'});
  }
  return {create,step,work};
})();
