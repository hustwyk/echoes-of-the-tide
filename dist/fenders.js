// The outer berth has a suspended rubber shoe. Moving it shortens the gap and
// exposes the upper tread. Each wall contact consumes a fresh jump press.
const TideFenders = (() => {
  const {clamp,spawn,move}=TideTraversal;
  const left=-.78, clearance=.28, top=.68;
  const wheel={x:-3.06,y:-2.49,z:11.15},pawl={x:-2.14,y:top,z:9.10},ladder={x:-3.19,y:-2.49,z:9.63};
  const briefing='沈遥：岸梯冲走了。你看见那只黑护舷了吗？小时候我们从这儿上去。';
  function build(world){
    function slab(x,y,z,w,d,kind='quay'){
      const s={x,y,z,w,d,kind,active:true};world.floors.push(s);return s;
    }
    const boats=[slab(-3.08,-2.72,16.85,3.38,3.4,'dock'),slab(1.15,-2.62,16.85,4.15,3.4,'dock')];
    const lower=slab(-3.17,wheel.y,11.42,2.12,4.24);
    const shelf=slab(.55,-2.39,13.4,2.2,2.23);
    const boatLink=slab(-1.00,-2.67,16.85,1.02,2.20,'dock');
    const well=slab(.40,-2.60,10.86,2.38,3.63);
    const ledge=slab(-1.72,top,10.24,1.88,3.34);
    const sill=slab(-3.16,top,8.60,1.06,1.38);
    const landing=slab(-2.13,top,8.22,1.90,1.38);
    const steps=slab(-2.38,.34,7.05,2.86,1.22);
    slab(-2.38,.05,6.04,2.86,.94);
    const aftWalk=slab(-5.42,-2.61,16.85,1.36,2.92,'dock');
    const floatPose=TideFloating.make([...boats,boatLink,aftWalk],-.48,-2.67,16.85,3.78,1.39,1.34);
    world.fenders={floatPose,boats,boatLink,aftWalk,lower,shelf,well,ledge,sill,landing,steps};
  }
  function create(g){
    if(!g.world.fenders)return null;
    g.checkpoints=g.world.fenders.boats.slice();g.players=g.checkpoints.map(spawn);
    TideFloating.step(g.world.fenders.floatPose,g.players,g.cues.water,0,0);
    return {phase:'approach',setting:0,fenderX:2.67,fenderTop:-2.30,wheelSpin:0,ladder:0,pawl:false,onLadder:false,
      wall:null,lastFace:0,kicks:0,wallBuffer:0,previousJump:false,seen:[false,false],grip:[null,null],top:[false,false],voice:'shore',clock:0,line:-1,queue:[],subtitle:'',warned:false,heardPawl:false};
  }
  function active(g){return g.index===0&&g.stage===0&&!!g.fenders&&g.fenders.phase!=='done';}
  function close(p,site,r=.9){return p.grounded&&Math.abs(p.y-site.y)<.4&&Math.hypot(p.x-site.x,p.z-site.z)<r;}
  function target(g,i){
    const s=g.fenders,w=g.world.fenders;
    if(s.top[i]&&(i===0||s.ladder>=1))return {p:g.section.starts[0],name:'堤上吊篮码头'};
    if(!i)return s.ladder>=1?{p:ladder,name:'卷梯下端'}:{p:wheel,name:'护舷手绞轮'};
    if(s.top[1])return {p:pawl,name:'卷梯棘轮'};
    if(!s.seen[1])return {p:w.shelf,name:'落脚踏板'};
    return s.lastFace===1?{p:{x:s.fenderX,y:s.fenderTop-.68,z:10.68},name:'移动护舷'}:{p:{x:left,y:s.kicks?top:-1.62,z:10.68},name:s.kicks?'堤沿':'黑色固定护舷'};
  }
  function align(p,site,dt){
    const k=1-Math.exp(-10*dt);
    p.x+=(site.x-p.x)*k;p.z+=(site.z-p.z)*k;p.vx=p.vz=p.speed=0;
    p.yaw+=Math.atan2(Math.sin(-p.yaw),Math.cos(-p.yaw))*k;
  }
  function geometry(s){s.fenderX=2.67-1.53*s.setting;s.fenderTop=-2.30+3.08*s.setting;}
  function speak(g,line){g.alert(line,4);}
  function narrate(g,dt){
    const s=g.fenders;
    if(!s||g.stage!==0)return;
    if(!s.voice)s.voice=s.queue.shift()||'';
    if(!s.voice){s.subtitle='';return;}
    const clip=TideFenderSpeech[s.voice];s.clock+=dt;
    while(s.line+1<clip.lines.length&&s.clock>=clip.lines[s.line+1][0]){
      s.subtitle=clip.lines[++s.line][1];g.events.log?.(s.subtitle);
    }
    if(s.clock>=clip.duration){s.voice='';s.line=-1;s.clock=0;s.subtitle='';}
  }
  function clearWall(s){s.wall=null;s.lastFace=0;s.kicks=0;s.wallBuffer=0;}
  function swimmer(g,i,wet){
    const s=g.fenders,p=g.players[i];
    if(wet)g.cues.splash={x:p.x,z:p.z,at:g.time};
    Object.assign(p,TideFloating.spawn(g.checkpoints[i]));
    if(!i)s.onLadder=false;else clearWall(s);
    g.setbacks++;g.events.reset?.(i);g.alert('救生索收紧，'+(i?'沈遥':'林澈')+'回到落脚处',1.8);
  }
  function climber(g,input,yaw,dt){
    const s=g.fenders,p=g.players[1],oldX=p.x;
    const pressed=!!input.jump&&!s.previousJump;s.previousJump=!!input.jump;
    s.wallBuffer=Math.max(0,s.wallBuffer-dt);
    if(pressed&&!p.grounded)s.wallBuffer=.12;
    const dx=input.x*Math.cos(yaw)+input.z*Math.sin(yaw);
    const dz=input.z*Math.cos(yaw)-input.x*Math.sin(yaw);
    let wall=s.wall;
    if(wall?.phase==='hold'){
      const normal=wall.normalX,plane=normal>0?left:s.fenderX;
      wall.age+=dt;wall.planeX=plane;wall.topY=normal>0?.62:s.fenderTop;
      if(s.wallBuffer>0){
        p.vx=normal*5.6;p.vy=8.0;p.vz=dz*1.3;p.cast=true;p.grace=p.jumpBuffer=0;p.jumpRise=false;p.launch=1;
        s.wallBuffer=0;s.kicks++;s.lastFace=normal;wall.phase='kick';wall.age=0;
      }else if(p.y< -2.53||(normal<0&&p.y+.45>s.fenderTop)||dx*normal>.52&&wall.age>.12||p.z<9.10||p.z>11.9){
        s.wall=null;p.vx=normal*.9;p.cast=false;
      }else{
        p.x=plane+normal*clearance;p.z+=dz*1.55*dt;p.vy=Math.max(-.80,p.vy-12*dt);p.y+=p.vy*dt;
        p.yaw=Math.atan2(normal,0);p.speed=0;return;
      }
    }
    if(s.wall?.phase==='kick'){s.wall.age+=dt;if(s.wall.age>.27){s.wall=null;p.cast=false;}}
    move(p,{...input,jump:pressed&&p.grounded},dt,g.world,yaw,false);
    if(p.grounded)clearWall(s);
    if(p.z<9.05||p.z>11.95)return;
    for(const normal of [1,-1]){
      const plane=normal>0?left:s.fenderX,cap=normal>0?.62:s.fenderTop;
      if((oldX-plane)*normal<-.03||p.y>=cap-.015||(p.x-plane)*normal>clearance)continue;
      p.x=plane+normal*clearance;
      const inward=p.vx*normal<-.1||dx*normal<-.2;p.vx=normal*Math.max(0,p.vx*normal);
      const tread=normal>0?p.y> -1.80:p.y> -1.10&&p.y+.45<cap;
      if(!p.grounded&&inward&&tread&&s.lastFace!==normal&&p.y+.22<cap){
        s.wall={phase:'hold',normalX:normal,normalZ:0,planeX:plane,topY:cap,age:0};p.vy=Math.min(p.vy,.12);p.cast=false;p.grace=p.jumpBuffer=0;
        p.yaw=Math.atan2(normal,0);
      }
    }
  }
  function step(g,inputs,yaws,dt){
    const s=g.fenders,w=g.world.fenders,[a,b]=g.players,[ka,kb]=inputs;
    s.grip.fill(null);g.near.fill(false);g.engaged.fill(false);
    const winding=!s.top[0]&&close(a,wheel)&&ka.use&&!s.onLadder;
    s.pawl=s.top[1]&&close(b,pawl)&&kb.use&&s.ladder<1;
    const old=s.setting;
    s.setting=clamp(s.setting+(winding?clamp(-ka.z,-1,1)*.66:s.top[1]?0:-.24)*dt,0,1);
    s.wheelSpin+=(s.setting-old)*Math.PI*4;geometry(s);
    if(winding){align(a,wheel,dt);s.grip[0]='wheel';}
    if(s.seen[1]&&!s.warned&&s.setting>.38&&!s.top[1]){s.warned=true;s.queue.push('sole');}
    if(s.pawl){
      align(b,pawl,dt);s.grip[1]='pawl';
      const before=s.ladder;
      s.ladder=clamp(s.ladder+clamp(kb.z,-1,1)*dt*.56,0,1);
      if(before<.15&&s.ladder>=.15&&!s.heardPawl){s.heardPawl=true;s.queue.push('above');}
      if(s.ladder===1){s.phase='exit';s.pawl=false;g.alert('卷梯棘爪已锁定',1.8);g.events.checkpoint?.(g);}
    }
    if(!s.top[0]&&s.ladder>=1&&(s.onLadder||ka.use&&close(a,ladder,1.05))){
      s.onLadder=true;s.grip[0]='ladder';a.grounded=false;a.ground=null;
      a.x=ladder.x;a.z=ladder.z;a.yaw=0;a.vx=a.vy=a.vz=0;
      const climbing=ka.use?clamp(-ka.z,-1,1):0;
      a.y=clamp(a.y+climbing*1.85*dt,ladder.y,top);a.speed=Math.abs(climbing)*1.85;
      if(a.y>=top){Object.assign(a,spawn(w.sill),{z:9.15});s.onLadder=false;s.top[0]=true;g.checkpoints[0]=w.sill;}
      if(a.y<=ladder.y&&!ka.use){Object.assign(a,spawn(w.lower),{x:ladder.x,z:ladder.z});s.onLadder=false;}
    }else move(a,ka,dt,g.world,yaws[0],winding);
    if(!s.top[1])climber(g,kb,yaws[1],dt);else move(b,kb,dt,g.world,yaws[1],s.pawl);
    if(a.ground===w.lower&&!s.seen[0]){s.seen[0]=true;g.checkpoints[0]=w.lower;}
    if(b.ground===w.well&&!s.seen[1]){s.seen[1]=true;g.checkpoints[1]=w.well;s.phase='climb';}
    if(!s.top[1]&&b.ground===w.ledge){
      s.top[1]=true;s.phase='upper';clearWall(s);g.checkpoints[1]=w.ledge;
      g.events.checkpoint?.(g);
    }
    for(let i=0;i<2;i++){
      const p=g.players[i];
      const water=g.cues.water+TideFloating.swell(p.x,p.z,g.time);
      const wet=!p.grounded&&p.vy<0&&p.y<water-.17;
      if(wet||s.top[i]&&p.y<top-1.46)swimmer(g,i,wet);
      g.near[i]=!!s.grip[i]||close(g.players[i],target(g,i).p);g.engaged[i]=!!s.grip[i];
    }
    const leftText=s.top[0]?'从石阶下到吊篮码头':s.onLadder?'握紧梯档，向前爬；松手可停':s.ladder>=1?'到绞轮后面的卷梯，按住操作并向前爬':s.top[1]?'靠近回程梯，等沈遥放到底':s.seen[0]?'按住操作并向前收绳，等沈遥蹬上堤沿':'跑向手绞轮，在艇边起跳，长按跳得更高';
    const rightText=s.ladder>=1?'回身下石阶，在吊篮码头等林澈':s.top[1]?'站到棘轮前，按住操作并向后放梯':s.wall?.phase==='hold'?'脚掌贴住了，松开再按跳蹬向对面':s.lastFace===1?'接住升起的右护舷，再按跳蹬回左堤沿':s.seen[1]?'向左边黑护舷起跳，贴住后再按一次跳':'越过艇边水沟，沿窄踏板跑到两块护舷之间';
    g.set(0,leftText,s.grip[0]==='wheel'?{vis:'dial',value:s.setting,caption:'护舷升程 '+Math.round(100*s.setting)+'%'}:{});
    g.set(1,rightText,s.grip[1]==='pawl'?{vis:'dial',value:s.ladder,caption:'放梯 '+Math.round(100*s.ladder)+'%'}:{});
    if(s.top.every(Boolean)&&g.players.every(p=>p.grounded&&p.z<5.79)){
      s.phase='done';s.queue.push('return');g.checkpoints=g.section.starts.slice();g.engaged.fill(false);g.near.fill(false);
      g.events.checkpoint?.(g);speak(g,g.spec.radio);
    }
  }
  function checkpoint(g){
    if(!g.fenders||g.stage!==0)return null;
    if(!['done','exit','upper'].includes(g.fenders.phase))return g.fenders.moored?{berth:'moored'}:null;
    return {berth:g.fenders.phase};
  }
  function restore(g,mark){
    if(!g.fenders||g.stage!==0)return;
    if(mark?.berth==='moored'){g.fenders.moored=true;return;}
    if(!['done','exit','upper'].includes(mark?.berth))return;
    const s=g.fenders,w=g.world.fenders;s.phase=mark.berth;s.top[1]=true;s.seen.fill(true);s.setting=1;s.voice='';s.heardPawl=mark.berth!=='upper';s.clock=0;s.line=-1;s.queue=[];s.subtitle='';s.warned=true;geometry(s);
    s.ladder=s.phase==='upper'?0:1;s.top[0]=s.phase==='done';
    g.checkpoints=s.phase==='done'?g.section.starts.slice():[w.lower,w.ledge];g.players=g.checkpoints.map(spawn);
    g.notice=s.phase==='upper'?'沈遥已经登堤，卷梯棘轮在她手边':s.phase==='exit'?'卷梯已锁定，林澈可以攀上去':g.spec.radio;g.noticeUntil=g.time+4;
  }
  function shot(g,i,yaw,pitch){
    const s=g.fenders,p=g.players[i];
    if(Math.abs(yaw)>.85||(!s.grip[i]&&(i===0||!s.seen[1]||s.top[1])))return null;
    const x=i?(s.top[1]?-2.12:.10):p.x;
    const y=i&&!s.top[1]?Math.max(-.64,p.y+.72):p.y+1.12;
    const z=i&&!s.top[1]?10.72:p.z-.28;
    const offset=!i?(s.onLadder?-.95:-.87):s.top[1]?-.36:0;
    const radius=i&&!s.top[1]?5.6:3.45;
    return {eye:[x+Math.sin(yaw+offset)*radius,y+1.33+pitch,z+Math.cos(yaw+offset)*radius],at:[x,y,z],fov:56};
  }
  return {build,create,step,narrate,active,target,shot,checkpoint,restore,wheel,pawl,ladder,briefing};
})();
