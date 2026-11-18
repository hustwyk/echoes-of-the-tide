// Two separate bodies of water share the old pump. The service well empties only
// after the two air cocks on its stair are vented at their own elevations.
const TideCistern=(()=>{
  const {clamp,spawn}=TideTraversal,origin={x:0,y:0,z:0};
  const point=(x,y,z)=>({x:x+origin.x,y:y+origin.y,z:z+origin.z});
  const site=(kind,label,x,y,z,face=0)=>({...point(x,y,z),kind,label,face});
  const lowWater=.69,highWater=2.48,beamZ=-.65;
  const stops=[{water:.80,open:.31},{water:.19,open:.63},{water:-.48,open:1}];
  function layout(){
    const floors=[];
    function floor(id,x,y,z,w,d){
      const f={...point(x,y,z),w,d,id,kind:'cistern',active:true};floors.push(f);return f;
    }
    const west=floor('west',-4.38,1.25,4.32,3.35,5.48),east=floor('east',4.92,1.18,4.24,2.76,4.85);
    const raft=floor('raft',2.16,1.94,3.18,2.3,2.10);raft.dynamic=true;raft.cutout={x0:.12,x1:1.17,z0:-.28,z1:.88};
    const gallery=floor('gallery',4.72,2.85,-6.12,3.00,3.56);
    floor('windowWalk',2.95,2.85,-5.15,.74,.86);
    const lip=floor('lip',2.13,2.85,-5.43,1.55,1.12);
    const stairs=[floor('step1',-4.36,.93,.60,2.29,2.08),floor('step2',-4.36,.61,-1.33,2.22,1.96),floor('step3',-4.36,.29,-3.16,2.19,1.86)];
    const bottom=floor('bottom',-1.39,-.05,-5.91,8.22,3.84);
    const pump=site('pump','双向泵阀',-4.35,1.25,3.55),rake=site('rake','格栅捞杆',4.05,1.18,3.65,1.55);
    const bypass=site('bypass','高廊旁通阀',4.34,2.85,-5.88);
    const cocks=[site('vent','头级放气旋塞',-4.34,.93,.52),site('vent','下级放气旋塞',-4.34,.29,-3.13)];
    const cabinet=site('cabinet','档案柜封存盒',-1.22,-.05,-5.85);
    const load=site('basket','升降筐下导绳',2.04,-.05,-5.88,-1.19),haul=site('hoist','高廊收绳盘',3.43,2.85,-6.04,1.28);
    const embark=site('embark','登架刻线',3.72,1.18,2.58),top=site('lip','高窗接收沿',2.18,2.85,-5.56);
    const starts=[west,east],ends=[[pump,raft],[pump,gallery],[load,haul]];
    const sections=TideMissions.chapters[3].map((spec,i)=>({spec,mid:gallery,starts:i?ends[i-1]:starts,ends:ends[i],sites:i===2?[cabinet,bypass]:[pump,rake],paths:[[],[]],returnDecks:[],danger:[]}));
    return {style:'pump',floors,sections,cistern:{west,east,raft,gallery,lip,stairs,bottom,pump,rake,bypass,cocks,cabinet,load,haul,top,embark}};
  }
  function create(g){return g.world.cistern?{phase:'grate',water:1.62,well:1.67,deckY:1.94,raftX:2.16,raftZ:3.18,flow:0,valve:0,pressure:.93,
    hookX:3.30,hookZ:3.96,cupX:2.88,cupY:1.68,cupZ:3.80,catchLift:0,cupTurn:0,caught:false,cupKept:false,eddy:0,guided:false,
    stroke:0,blocked:false,passed:false,moored:false,bypass:0,vent:0,ports:0,lid:0,tape:'cabinet',hoist:1,lineHeld:false,
    voice:'',clock:0,subtitle:'',line:-1,queue:[]}:null;}
  function speak(s,id){if(!s.voice){s.voice=id;s.clock=0;s.line=-1;s.subtitle='';}else if(id!==s.voice&&!s.queue.includes(id))s.queue.push(id);}
  function narrate(g,dt){
    const s=g.cistern;if(!s.voice)return;
    const clip=TideCisternSpeech[s.voice];s.clock+=dt;
    const line=clip.lines.findLastIndex(a=>a[0]<=s.clock);
    if(line>=0&&line!==s.line){s.line=line;s.subtitle=clip.lines[line][1];g.events.log?.(s.subtitle);}
    if(s.clock>=clip.duration){s.voice='';s.subtitle='';if(s.queue.length)speak(s,s.queue.shift());}
  }
  const save=g=>g.events.checkpoint?.(g);
  function raftDeck(g){
    const s=g.cistern,d=g.world.cistern.raft,oldY=d.y,oldX=d.x,oldZ=d.z;
    s.deckY=s.water+.32+.023*Math.sin(g.time*1.55);d.x=origin.x+s.raftX;d.y=origin.y+s.deckY;d.z=origin.z+s.raftZ;
    for(const p of g.players)if(p.ground===d){p.x+=d.x-oldX;p.y+=d.y-oldY;p.z+=d.z-oldZ;}
  }
  function begin(g){
    const s=g.cistern,w=g.world.cistern;if(!s)return;
    if(!g.stage){speak(s,'cup');}
    if(g.stage>0){s.cupTurn=1;s.cupX=4.06;s.cupY=2.38;s.cupZ=3.29;}
    if(g.stage===1){
      const enteredOnRaft=g.players[1].ground===w.raft&&s.guided;
      Object.assign(s,{phase:'tow',cupKept:true,caught:true,catchLift:1,guided:true,water:enteredOnRaft?s.water:lowWater,pressure:0,flow:0,raftZ:3.18});
      g.checkpoints=[w.west,w.raft];speak(s,'beam');
    }
    if(g.stage===2){
      Object.assign(s,{phase:'drain',cupKept:true,caught:true,catchLift:1,guided:true,passed:true,moored:true,water:highWater,flow:0,pressure:0,raftX:2.32,raftZ:-4.20});
      g.checkpoints=[w.west,w.gallery];speak(s,'pipe');
    }
    raftDeck(g);
  }
  function rail(g){
    const s=g.cistern;
    return site('line','浮架导索',s.raftX,s.deckY,s.raftZ-.12);
  }
  function target(g,i){
    const s=g.cistern,w=g.world.cistern;
    if(!g.stage)return !i?w.pump:['grate','inspect'].includes(s.phase)?w.rake:g.players[1].ground===w.raft?rail(g):s.water>.89?w.embark:site('board','浮架前横梁',s.raftX+.25,s.deckY,s.raftZ-.68);
    if(g.stage===1)return !i?w.pump:s.moored?w.top:rail(g);
    if(i)return ['drain','cabinet'].includes(s.phase)?w.bypass:w.haul;
    if(s.phase==='drain')return w.cocks[Math.min(1,s.ports)];
    return s.tape==='cabinet'?w.cabinet:w.load;
  }
  function near(g,i){
    const p=g.players[i],t=target(g,i),s=g.cistern,w=g.world.cistern;
    if(t.kind==='line')return p.grounded&&p.ground===w.raft&&Math.hypot(p.x-t.x,p.z-t.z)<1.21;
    if(['embark','board','lip'].includes(t.kind))return false;
    if(t.kind==='vent'&&(s.ports===2||p.ground!==w.stairs[s.ports?2:0]))return false;
    return p.grounded&&Math.abs(p.y-t.y)<.20&&Math.hypot(p.x-t.x,p.z-t.z)<.75;
  }
  function stance(g,i,dt){const p=g.players[i],t=target(g,i),k=1-Math.exp(-dt*9);
    p.x+=(t.x-p.x)*k;p.z+=(t.z-p.z)*k;p.yaw+=Math.atan2(Math.sin(t.face-p.yaw),Math.cos(t.face-p.yaw))*k;
  }
  function collide(g,p,oldZ){
    const w=g.world.cistern,s=g.cistern;
    p.x=clamp(p.x,origin.x-6.03,origin.x+6.04);p.z=clamp(p.z,origin.z-7.85,origin.z+7.66);
    // The slab beneath the cabinet is walkable, its steel front is solid.
    if(Math.abs(p.x-origin.x+1.22)<.86&&p.z<origin.z-6.11&&p.z>origin.z-7.3&&p.y<origin.y+.97){p.z=origin.z-6.11;p.vz=Math.max(0,p.vz);}
    if(p.ground===w.raft&&s.guided&&g.stage===1&&!s.moored&&p.x<origin.x+1.14){p.x=origin.x+1.14;p.vx=Math.max(0,p.vx);}
    const atBeam=Math.abs(p.z-origin.z-beamZ)<.56&&Math.abs(p.x-origin.x-2.16)<1.60;
    if(atBeam&&p.y+1.70>origin.y+2.88&&p.y<origin.y+3.25){
      const side=oldZ>=origin.z+beamZ?1:-1;p.z=origin.z+beamZ+side*.57;p.vz=0;
    }
  }
  function submerged(g,p){const s=g.cistern,w=g.world.cistern,x=p.x-origin.x,z=p.z-origin.z,y=p.y-origin.y;
    if(p.ground===w.raft||p.ground===w.east||p.ground===w.west||p.ground===w.gallery||p.ground===w.lip)return false;
    if(x>=.73&&x<=3.52&&z>=-5.30&&z<=5.95)return y<s.water-.12;
    return z<1.64&&z>-7.36&&x>-5.55&&x<2.96&&y<s.well-.13;
  }
  function fall(g,i){
    const s=g.cistern,w=g.world.cistern,p=g.players[i],c=g.checkpoints[i];
    if(c===w.raft)Object.assign(p,spawn(w.raft),{x:w.raft.x,z:w.raft.z});
    if(!i&&s.tape==='carried'&&g.stage===2)Object.assign(p,spawn(w.bottom),{x:w.cabinet.x,z:w.cabinet.z});
  }
  function cup(g,k,dt){
    const s=g.cistern,h=g.engaged;
    const vent=h[0]&&k[0].z>.32;
    s.valve=vent?-1:0;s.pressure+=((vent?.06:.93)-s.pressure)*(1-Math.exp(-dt*2.05));
    s.eddy+=dt*(.74+2.25*s.pressure);
    if(!s.caught){
      s.cupX=2.88+.31*Math.sin(s.eddy);s.cupZ=3.55+.25*Math.cos(s.eddy);s.cupY=s.water+.065;
      if(h[1]){s.hookX=clamp(s.hookX+k[1].x*dt*.84,2.25,3.46);s.hookZ=clamp(s.hookZ+k[1].z*dt*.84,2.96,4.14);}
      const gap=Math.hypot(s.hookX-s.cupX,s.hookZ-s.cupZ);
      if(g.commit(1,k)){
        if(vent&&s.pressure<.27&&gap<.205){s.caught=true;s.startCup=[s.cupX,s.cupZ];g.sound(588,.11);speak(s,'name');}
        else g.alert(s.pressure>=.27?'负压还压着杯沿。让泵台先泄压。':'杆头碰到了篦条。把钩尖移进杯把再提。',1.4);
      }
    }else{
      if(h[1]&&vent)s.catchLift=clamp(s.catchLift+dt*.63,0,1);
      const u=s.catchLift*s.catchLift*(3-2*s.catchLift);
      s.cupX=s.startCup[0]+(4.06-s.startCup[0])*u;s.cupZ=s.startCup[1]+(3.29-s.startCup[1])*u;s.cupY=s.water+.065+(2.38-s.water-.065)*u+.14*Math.sin(Math.PI*u);
      s.hookX=s.cupX;s.hookZ=s.cupZ;
      if(s.catchLift===1){s.cupKept=true;s.phase='inspect';s.cupTurn=0;save(g);}
    }
    g.set(0,'在西泵台握住阀柄，向后拉住泄压。等她把杯子提过篦条再松。',{vis:'dial',value:s.pressure,caption:'吸水负压 '+Math.round(s.pressure*100)+'%'});
    g.set(1,s.caught?'握住捞杆，等杯把越过篦条。':'握住捞杆，方向键移动钩尖。听同伴报低压，对准杯把按确认。',{caption:s.caught?'杯沿已钩住':'搪瓷杯　·　'+(s.pressure<.27?'杯子已经浮起':'杯底贴住吸水篦')});
  }
  function inspect(g,k,dt){
    const s=g.cistern;
    pump(g,k,dt);
    if(g.engaged[1])s.cupTurn=clamp(s.cupTurn+k[1].x*dt*.76,0,1);
    g.set(1,'握住杯柄，向右转到杯底。读完按确认，把它挂回东台。',{caption:s.cupTurn>.84?'杯底　·　林澈　沈遥':'杯沿　·　向右翻看'});
    g.set(0,'杯子已经离开格栅。现在可以向左排水，让浮架降到东岸刻线。',{caption:'泵压已卸　·　池深 '+Math.round(s.water*100)+' cm'});
    if(s.cupTurn>.84&&g.commit(1,k)){s.phase='board';s.cupTurn=1;speak(s,'smile');save(g);}
  }
  function pump(g,k,dt){
    const s=g.cistern,w=g.world.cistern;
    s.valve=g.engaged[0]?k[0].x:0;s.flow+=(s.valve-s.flow)*(1-Math.exp(-dt*4.8));
    const under=Math.abs(s.raftZ-beamZ)<1.54&&g.stage===1;
    s.water=clamp(s.water+s.flow*.77*dt,.38,under?.81:2.64);raftDeck(g);
    g.set(0,'左右控阀，左排水、右注水；松方向键关阀。听浮架上的人报净空。',{vis:'dial',value:.5+.48*s.flow,caption:(s.flow<-.08?'排水':s.flow>.08?'注水':'封阀')+'　·　池深 '+Math.round(s.water*100)+' cm'});
    if(!g.stage){
      const level=Math.abs(s.deckY-1.18)<.22,aboard=g.players[1].ground===w.raft;
      g.set(1,aboard?'站在浮架绳鼓边握住导绳。两根黄线平齐时，按确认扣上导轮。':'沿东侧矮台走到池边，等浮架靠近靴底再跳过去。',{caption:'浮架比登架线'+(s.deckY>1.18?'高 ':'低 ')+Math.round(Math.abs(s.deckY-1.18)*100)+' cm'});
      if(s.phase==='board'&&g.commit(1,k)&&aboard&&level){s.guided=true;g.checkpoints[1]=w.raft;g.advance();}
      return;
    }
    if(!s.moored){
      const old=s.raftZ,on=g.engaged[1]&&g.players[1].ground===w.raft;
      const trim=on?k[1].x:0;
      const sideCurrent=(2.16-s.raftX)*.46+.039*Math.sin(g.time*1.13)+s.flow*.035;
      s.raftX=clamp(s.raftX+(trim*.49+sideCurrent)*dt,1.88,2.39);
      const next=clamp(old+(on?k[1].z*1.80*dt:0),-4.20,3.18);
      s.offTrack=Math.abs(s.raftX-1.97)>.105;
      s.blocked=old>beamZ+1.50&&next<=beamZ+1.54&&(s.deckY>1.14||s.offTrack);
      if(!s.blocked)s.raftZ=next;
      if(on)s.stroke+=Math.abs(s.raftZ-old)*2.7;
      raftDeck(g);
      if(!s.passed&&s.raftZ<beamZ-1.55){s.passed=true;speak(s,'sill');save(g);}
      const fit=s.raftZ<-4.01&&Math.abs(s.deckY-2.85)<.19&&Math.abs(s.raftX-2.32)<.095;
      g.set(1,s.blocked?(s.deckY>1.14?'上方压梁碰到了导轮。先让同伴降水。':'左侧铜槽没有咬合。摆左导绳，把架头铜针对进槽内。'):s.raftZ>-2.19?'握住导绳，左右使架针对齐左侧铜槽。前推穿梁，后拉退出。':s.raftZ>-4.01?'压梁已经过了。继续把浮架拉到北窗下。':'让同伴注水，左右调绳对准右侧窗槽。两道刻线齐平时按确认。',{caption:s.raftZ>-2.2?'梁底净空 '+Math.round((2.88-s.deckY)*100)+' cm　·　左槽偏差 '+Math.round((s.raftX-1.97)*100)+' cm':'窗沿比浮架'+(2.85>s.deckY?'高 ':'低 ')+Math.abs(Math.round((2.85-s.deckY)*100))+' cm　·　右槽偏差 '+Math.round((s.raftX-2.32)*100)+' cm'});
      if(g.commit(1,k)&&fit){s.moored=true;s.flow=0;s.raftZ=-4.2;s.water=highWater;raftDeck(g);g.sound(550,.12);save(g);}
    }else{
      s.water=highWater;s.flow=0;raftDeck(g);
      g.set(1,'松开导索，从架头跳上高窗，往右走到旁通管。',{caption:'浮架已扣在北窗'});
      g.set(0,'等她越过高窗。旁通阀通到你脚下的检修井。',{caption:'两条水路　·　切换到检修井'});
      if([w.gallery,w.lip].includes(g.players[1].ground))g.advance();
    }
  }
  function drain(g,k,dt){
    const s=g.cistern,w=g.world.cistern,stage=stops[s.ports],tip=s.ports===2?'底档已通，放净柜前积水':'等水线退过脚背，握住楼梯外侧的放气旋塞，前推放气';
    if(g.engaged[1])s.bypass=clamp(s.bypass+k[1].x*dt*.49,0,1);
    const delta=s.bypass-stage.open,fit=Math.abs(delta)<.085;
    const outflow=Math.min(s.bypass,stage.open)*.99;
    s.well=Math.max(stage.water,s.well-outflow*dt);
    const dry=s.well<=stage.water+.035;
    if(s.ports<2){
      if(g.engaged[0]&&g.engaged[1]&&k[0].z<-.25&&fit&&dry)s.vent=clamp(s.vent+dt*.83,0,1);
      if(s.vent===1){s.vent=0;s.ports++;g.sound(496,.13);g.checkpoints[0]=w.stairs[s.ports===1?0:2];save(g);}
    }else if(dry){s.phase='cabinet';g.checkpoints[0]=w.stairs[2];save(g);}
    g.set(0,tip,{caption:s.ports<2?'井壁刻线 '+Math.round(stage.open*100)+'　·　'+(dry?'旋塞已露出':'水线正在退'):'沿露出的台阶下到柜前'});
    g.set(1,'握住旁通轮，左右调开度。让楼下报他那一级的刻线，稳住等他放气。',{vis:'dial',value:s.bypass,caption:'旁通轮 '+Math.round(s.bypass*100)+'　·　下层水尺 '+Math.round(s.well*100)+' cm'});
  }
  function retrieve(g,k,dt){
    const s=g.cistern;
    if(s.phase==='cabinet'){
      if(g.engaged[0])s.lid=clamp(s.lid+k[0].z*dt*.76,0,1);
      g.set(0,'下到柜前，后拉把盖子翻开。按确认取出装着两盘录音的封存盒。',{caption:s.lid>.91?'值班带　／　十秒钟北岬':'档案柜　·　盒盖 '+Math.round(s.lid*100)+'%'});
      g.set(1,'留在上廊。柜前水线已经退下，等同伴取出盒子。');
      if(s.lid>.91&&g.commit(0,k)){s.tape='carried';s.phase='hoist';g.checkpoints[0]=g.world.cistern.bottom;save(g);}
      return;
    }
    s.lineHeld=g.engaged[0];
    if(g.engaged[1]){
      const speed=k[1].z;
      if(s.tape==='carried'&&speed>0)s.hoist=clamp(s.hoist-speed*dt*.40,0,1);
      if(s.tape==='basket'&&s.lineHeld)s.hoist=clamp(s.hoist-speed*dt*.32,0,1);
    }
    if(s.tape==='carried'&&s.hoist<.05&&g.commit(0,k)){s.tape='basket';g.sound(438,.10);save(g);}
    g.set(0,s.tape==='carried'?'把盒子带到吊筐旁。等楼上把空筐放到手边，按确认装筐。':'握住下导绳。你一松手，收绳盘上的止坠爪就会咬住。',{caption:s.tape==='carried'?'从柜前沿底廊向东走':'下导绳　·　'+(s.lineHeld?'已张紧':'等待握紧')});
    g.set(1,s.tape==='carried'?'从旁通轮走到收绳盘。后推放下空筐。':'等下面的人张紧导绳，前推收筐。到手边时按确认接盒。',{caption:'升降筐高度 '+Math.round((.36+s.hoist*3.19)*100)+' cm'});
    if(s.tape==='basket'&&s.lineHeld&&s.hoist>.96&&g.commit(1,k)){s.tape='received';s.hoist=1;g.advance();}
  }
  function interact(g,k,dt){
    const s=g.cistern;
    if(s.phase==='grate')cup(g,k,dt);
    else if(s.phase==='inspect')inspect(g,k,dt);
    else if(g.stage<2)pump(g,k,dt);
    else if(s.phase==='drain')drain(g,k,dt);
    else retrieve(g,k,dt);
  }
  function checkpoint(g){
    const s=g.cistern;if(!s||(!g.stage&&!s.cupKept))return null;
    return {stage:g.stage,phase:s.phase,cupTurn:s.cupTurn,water:s.water,well:s.well,raftX:s.raftX,raftZ:s.raftZ,passed:s.passed,moored:s.moored,
      bypass:s.bypass,ports:s.ports,lid:s.lid,tape:s.tape,hoist:s.hoist};
  }
  function restore(g,m){
    const s=g.cistern,w=g.world.cistern;
    if(!s||m?.stage!==g.stage||![['inspect','board'],['tow'],['drain','cabinet','hoist']][g.stage].includes(m.phase))return;
    const num=(n,l,h,f)=>Number.isFinite(n)?clamp(n,l,h):f;
    s.phase=m.phase;s.cupTurn=m.phase==='inspect'?num(m.cupTurn,0,1,0):1;s.cupKept=s.caught=true;s.catchLift=1;s.cupX=4.06;s.cupY=2.38;s.cupZ=3.29;
    s.raftX=num(m.raftX,1.88,2.39,2.16);s.water=num(m.water,.38,2.64,lowWater);s.raftZ=num(m.raftZ,-4.20,3.18,3.18);
    s.passed=g.stage>1||m.passed===true;s.moored=g.stage>1||m.moored===true;
    s.bypass=num(m.bypass,0,1,0);s.ports=Math.floor(num(m.ports,0,2,0));s.well=num(m.well,-.48,1.67,1.67);
    s.lid=num(m.lid,0,1,0);s.tape=['carried','basket'].includes(m.tape)?m.tape:'cabinet';s.hoist=num(m.hoist,0,1,1);
    if(g.stage===2)g.checkpoints=[s.phase==='hoist'?w.bottom:s.ports?w.stairs[s.ports===1?0:2]:w.west,w.gallery];
    raftDeck(g);
    g.players.forEach((p,i)=>{const cp=g.checkpoints[i];Object.assign(p,spawn(cp));if(cp===w.raft)Object.assign(p,{x:cp.x,z:cp.z});});
    s.queue=[];s.voice='';s.subtitle='';
  }
  const ending=['box','reply'];
  const filmLength=()=>ending.reduce((n,id)=>n+TideCisternSpeech[id].duration+.24,.40);
  function film(t){let clock=t-.25;
    for(const [actor,id] of ending.entries()){const a=TideCisternSpeech[id];if(clock<0)break;
      if(clock<a.duration+.24)return {voice:clock<a.duration?id:'',clock,actor,subtitle:a.lines.findLast(row=>row[0]<=clock)?.[1]||''};
      clock-=a.duration+.24;}
    return {voice:'',clock:0,actor:-1,subtitle:''};
  }
  return {layout,create,begin,target,near,stance,collide,submerged,fall,interact,checkpoint,restore,narrate,film,filmLength,origin,point,stops};
})();
