// The two pairs of staffs observe one wave train in world coordinates.
// A crest identity stays attached to that wave as it travels across the pier.
const TideSoundings=(()=>{
  const {clamp}=TideTraversal,TAU=Math.PI*2,x0=-46,z0=-92;
  const point=(x,y,z)=>({x:x+x0,y,z:z+z0});
  const site=(name,label,x,y,z,i=0)=>({...point(x,y,z),kind:name,label,index:i});
  const period=5.8,celerity=4.48;
  function layout(){
    const floors=[],floor=(kind,x,y,z,w,d)=>{const f={...point(x,y,z),w,d,kind,active:true};floors.push(f);return f;};
    const upper=floor('surveyQuay',0,1.56,3.90,13.1,7),stairs=[];
    for(let k=0;k<8;k++)stairs.push(floor('surveyStair',-5.35,1.56-.29*(k+1),.12-.56*k,2.30,.56));
    const sill=floor('surveySill',-5.35,-.76,-4.74,2.30,1.44);
    const piers=[floor('surveySocket',.43,-.76,-5.03,2.04,1.90),floor('surveySocket',1.48,-.92,-9.04,1.90,1.84)];
    const floats=[[-3.37,-5.03,1.25,1.59],[-1.52,-5.12,1.19,1.62],[1.03,-7.01,1.34,1.38]].map(([x,z,w,d])=>{
      const f=floor('surveyFloat',x,-1.02,z,w,d);f.anchor=point(x,-1.02,z);f.dynamic=true;return f;
    });
    const rack=site('rack','伸缩潮尺',-3.30,1.56,4.22),chart=site('chart','双层测深图',-.70,1.56,3.48),radio=site('radio','船尾手持台',3.15,1.56,5.80);
    const sockets=piers.map((p,i)=>({...p,kind:'staff',index:i,label:i?'乙号尺脚':'甲号尺脚'}));
    const scopes=[site('scope','外海瞄准镜',2.85,1.56,1.50),site('scope','内湾瞄准镜',5.96,1.56,4.55,1)];
    const marks=[point(5.55,-2.70,-15),point(10.65,-2.70,-2.15)];
    const lenses=[point(2.85,3.12,.85),point(6.09,3.12,3.95)];
    const probes=[point(1.73,0,-5.58),point(2.78,0,-9.61)];
    const starts=[point(-3.2,1.56,5.65),point(3.30,1.56,5.70)];
    const positions=[[rack,scopes[0]],[sockets[0],scopes[1]],[chart,radio]];
    const ends=[[sockets[0],scopes[0]],[sockets[1],scopes[1]],[chart,radio]];
    const sections=TideMissions.chapters[8].map((spec,i)=>({spec,starts:i?ends[i-1]:starts,ends:ends[i],sites:positions[i],mid:upper,paths:[[],[]],danger:[],returnDecks:[],ferry:null}));
    return {floors,sections,style:'bridge',soundings:{upper,stairs,sill,piers,floats,sockets,scopes,marks,lenses,probes,rack,chart,radio}};
  }
  function mean(t){return -2.16+.10*Math.sin(t*.014);}
  function phase(x,z,t){return (t-((z-z0)+.16*(x-x0))/celerity)/period;}
  function swell(x,z,t){
    const q=phase(x,z,t),a=q*TAU;
    return -(.81+.075*Math.cos(a*.31))*Math.cos(a)+.085*Math.sin(2*a)+.037*Math.sin(x*.38-z*.27+t*.85);
  }
  function surface(x,z,t){return mean(t)+swell(x,z,t);}
  function wave(p,t){
    const q=phase(p.x,p.z,t),id=Math.round(q),height=surface(p.x,p.z,t);
    return {id,height,open:Math.abs(q-id)<.12&&height<-2.74};
  }
  function vessel(g,t){
    const x=-16.4+1.15*Math.sin(t*.041),z=-99.85+.71*Math.sin(t*.050+.71);
    return [x,mean(t)+.5*(swell(x-2.4,z-3.4,t)+swell(x+2.4,z+3.4,t)),z];
  }
  // The stern optic uses the same six-degree motion as the ferry mesh.
  const shipYaw=-2.30;
  function stern(g){
    const t=g.time,pos=vessel(g,t),a=.028*Math.sin(t*.78),b=shipYaw,c=.034*Math.sin(t*.91);
    const x=-.76*Math.cos(c)-3.14*Math.sin(c),y=-.76*Math.sin(c)+3.14*Math.cos(c);
    const z=-x*Math.sin(b)+8.14*Math.cos(b);
    return [pos[0]+x*Math.cos(b)+8.14*Math.sin(b),pos[1]+y*Math.cos(a)-z*Math.sin(a),pos[2]+y*Math.sin(a)+z*Math.cos(a)];
  }
  function create(g){
    return g.world.soundings?{carry:false,mount:-1,taken:false,jaw:-1.54,trim:[-.037,.041],readings:[null,null],
      ticket:null,plot:[.50,.54],fixed:false,voice:'',clock:0,subtitle:'',line:-1,settle:'',pending:[],safeLand:0,
      sight:null,ack:false,ashore:false}:null;
  }
  function begin(g){
    const r=g.survey;if(!r)return;
    r.ticket=null;r.pending=[];r.trim=[-.037,.041];r.settle='';r.voice='';r.subtitle='';r.line=-1;r.clock=0;
    if(g.stage){
      r.mount=g.stage-1;r.carry=false;r.taken=true;
      // Older checkpoints contain the chapter stage only. Recover the prior log sheet.
      for(let i=0;i<g.stage;i++)if(r.readings[i]==null)r.readings[i]=[-2.94,-2.98][i];
    }
    g.cues.water=mean(g.time);
  }
  function target(g,i){
    const w=g.world.soundings,r=g.survey;
    if(g.stage===2)return i?w.radio:w.chart;
    if(i)return w.scopes[g.stage];
    if(!r.taken)return w.rack;
    if(r.mount>=0&&r.mount!==g.stage&&!r.carry)return w.sockets[r.mount];
    return w.sockets[g.stage];
  }
  function guide(g,i){
    const w=g.world.soundings,r=g.survey,s=target(g,i);
    if(i||g.stage<2&&!r.carry||g.stage===2&&r.ashore)return s;
    const ground=g.players[0].ground||r.lastFoot,back=g.stage===2;
    const entrance={...w.stairs[0],label:'西梯口'},sill={...w.sill,label:'下层石槛'};
    if(ground===w.upper)return back?s:entrance;
    if(w.stairs.includes(ground))return back?entrance:sill;
    const path=[w.sill,w.floats[0],w.floats[1],w.piers[0],w.floats[2],w.piers[1]],at=path.indexOf(ground);
    const end=g.stage===0?3:5;
    if(at<0||!back&&at===end)return s;
    if(at===0&&back)return entrance;
    const next=path[at+(back?-1:1)];return next?{...next,label:next===w.sill?'下层石槛':w.floats.includes(next)?'系泊漂板':'检修平台'}:s;
  }
  function near(g,i){
    const s=target(g,i),p=g.players[i],w=g.world.soundings;
    if(s.kind==='staff'&&p.ground!==w.piers[s.index])return false;
    return p.grounded&&Math.abs(s.y-p.y)<.22&&Math.hypot(p.x-s.x,p.z-s.z)<(s.kind==='staff'?.84:1.00)&&p.z>=s.z-.24;
  }
  function stance(g,i,dt){
    const p=g.players[i],s=target(g,i),k=1-Math.exp(-8*dt);
    p.x+=(s.x-p.x)*k;p.z+=(s.z-p.z)*k;p.yaw+=Math.atan2(Math.sin(-p.yaw),Math.cos(p.yaw))*k;
  }
  function collide(g,p){
    const w=g.world.soundings;
    for(const s of [w.rack,...w.scopes,w.chart,w.radio,...w.sockets]){
      if(Math.abs(p.y-s.y)>.65)continue;
      const dx=p.x-s.x,dz=p.z-s.z+.63,d=Math.hypot(dx,dz),radius=s.kind==='chart'?.51:.31;
      if(d>=radius)continue;
      const nx=d?dx/d:0,nz=d?dz/d:1;p.x=s.x+nx*radius;p.z=s.z-.63+nz*radius;
      const dot=p.vx*nx+p.vz*nz;if(dot<0){p.vx-=dot*nx;p.vz-=dot*nz;}
    }
  }
  function secure(g){g.events.checkpoint?.(g);}
  function step(g,dt){
    const w=g.world.soundings,r=g.survey,t=g.time;g.cues.water=mean(t);
    w.floats.forEach((f,i)=>{
      const a=f.anchor,sea=surface(a.x,a.z,t),x=a.x+.14*Math.sin(t*.94+i),z=a.z+.10*Math.sin(t*.85+i*1.25);
      const y=sea+.82;
      for(const p of g.players)if(p.ground===f){p.x+=x-f.x;p.z+=z-f.z;p.y+=y-f.y;}
      Object.assign(f,{x,y,z});
    });
    const p=g.players[0];if(p.grounded)r.lastFoot=p.ground;
    if(g.stage===2&&!r.ashore&&p.ground===w.upper){r.ashore=true;g.checkpoints[0]=w.chart;secure(g);}
    if(p.grounded&&p.ground===w.sill&&g.stage<2&&r.safeLand===0){r.safeLand=1;g.checkpoints[0]=w.sill;secure(g);}
  }
  function say(g,id,next=''){
    const r=g.survey;
    if(r.voice){if(id!==r.voice&&!r.pending.some(row=>row[0]===id))r.pending.push([id,next]);return;}
    r.voice=id;r.clock=0;r.line=-1;r.subtitle='';r.settle=next;
  }
  function playback(g,dt){
    const r=g.survey;if(!r.voice)return;
    const c=TideSoundingsSpeech[r.voice];r.clock+=dt;const j=c.lines.findLastIndex(v=>v[0]<=r.clock);
    if(j>=0&&j!==r.line){r.line=j;r.subtitle=c.lines[j][1];g.events.log?.(r.subtitle);}
    if(r.clock<c.duration)return;
    const next=r.settle;r.voice='';r.clock=0;r.subtitle='';r.line=-1;r.settle='';
    if(next==='advance')g.advance();else if(r.pending.length)say(g,...r.pending.shift());
  }
  function scopeAim(g){
    const w=g.world.soundings,i=g.stage,r=g.survey,e=w.lenses[i],m=w.marks[i];
    const base=Math.atan2(m.x-e.x,e.z-m.z),pitch=Math.atan2(m.y-e.y,Math.hypot(m.x-e.x,m.z-e.z));
    const yaw=base+r.trim[0],angle=pitch+r.trim[1],dir=[Math.sin(yaw)*Math.cos(angle),Math.sin(angle),-Math.cos(yaw)*Math.cos(angle)];
    const eye=[e.x+.78*dir[0],e.y+.78*dir[1],e.z+.78*dir[2]];
    return {eye,at:eye.map((v,j)=>v+dir[j]),fov:i===1?22:15};
  }
  function install(g){
    const r=g.survey,w=g.world.soundings;
    if(!r.taken){r.taken=r.carry=true;secure(g);g.sound(345,.12);g.alert('潮尺已离架。沿西侧阶梯下去，从漂板跳到甲号尺座。');return;}
    if(r.mount>=0&&r.mount!==g.stage){r.mount=-1;r.carry=true;secure(g);g.sound(282,.09);return;}
    if(r.carry){
      r.carry=false;r.mount=g.stage;r.safeLand=g.stage+2;g.checkpoints[0]=w.sockets[g.stage];r.jaw=-2.04;
      g.sound(528,.15);secure(g);g.alert('尺脚已入槽。用滑钮让铜夹沿标尺跟住水面。');
    }
  }
  function measure(g,input,dt){
    const r=g.survey,w=g.world.soundings,n=g.stage,lead=n===0?1:0,peer=1-lead;
    const on=r.mount===n,probes=[w.probes[n],w.marks[n]],events=probes.map(p=>wave(p,g.time));
    if(g.engaged[1]){
      r.trim[0]=clamp(r.trim[0]+input[1].x*dt*.11,-.17,.17);
      r.trim[1]=clamp(r.trim[1]-input[1].z*dt*.10,-.18,.18);
    }
    if(on&&g.engaged[0])r.jaw=clamp(r.jaw-input[0].z*dt*1.24,-3.44,-.80);
    const precise=[Math.abs(r.jaw-events[0].height)<.155,Math.hypot(...r.trim)<.023];
    const valid=i=>g.engaged[i]&&events[i].open&&precise[i];
    const site=target(g,0);
    g.set(0,!on?!r.taken?'去西侧架子握住潮尺，按确认取下。':r.carry?'带潮尺沿检修平台前进，跳过漂板，在尺座握住操作键并确认。':'握住甲号尺座，按确认拔尺，带到外侧乙号座。':
      n===0?'前后调铜夹，贴住尺上的水线。听到高台报浪，在同一道浪的谷底确认。':'乙尺在迎浪的一面。铜夹贴住退下的水面后先报，让高台等这道浪。',{
      caption:on?'尺夹 '+r.jaw.toFixed(2)+' m　·　'+(precise[0]?'夹口贴水':r.jaw>events[0].height?'夹口在水线上方':'夹口已没入水下'):site.label});
    g.set(1,'握住瞄准镜，前后俯仰、左右转镜，让十字对准红白尺的黄铜横标。'+(n===0?'浪谷露出横标时先报。':'听到林澈报数后，在同一道浪露出横标时确认。'),{
      caption:!g.engaged[1]?target(g,1).label:(!precise[1]?'瞄环偏离铜标':events[1].open?'铜标已露出':'浪遮住铜标')+(r.ticket?'　·　同伴已报':'')});
    if(!on){if(g.commit(0,input))install(g);return;}
    if(r.readings[n]!=null||g.state.doneAt!==null)return;
    const a=events[lead],b=events[peer];
    if(r.ticket&&phase(probes[peer].x,probes[peer].z,g.time)>r.ticket.id+.125){
      r.ticket=null;g.alert('这道浪过去了。保留尺脚位置，等下一道。',1.8);
    }
    if(!r.ticket&&g.commit(lead,input)){
      if(valid(lead)){
        r.ticket={id:a.id,height:lead===0?r.jaw:a.height,from:lead};say(g,n?'low':'far');g.sound(587,.095);
      }else g.alert(!precise[lead]?(lead?'把瞄环对准铜标。':'把铜夹移到干湿交界。'):'黄铜横标还在浪下，等白边退开。',1.5);
    }
    if(r.ticket&&g.commit(peer,input)){
      if(!valid(peer)||r.ticket.id!==b.id){
        g.alert(!precise[peer]?(peer?'十字还不在横标上。':'铜夹和水面还有距离。'):'这不是同一道浪的谷底。',1.45);return;
      }
      r.readings[n]=lead===0?r.ticket.height:r.jaw;r.ticket=null;secure(g);g.sound(739,.16);
      if(n===0){if(r.voice)r.settle='advance';else g.advance();}else say(g,'overlay','advance');
    }
  }
  function exposed(g){const p=TideLookout.marks.stump;return surface(p.x,p.z,g.time)<-2.78;}
  function depth(g){const r=g.survey;return Math.min(...r.readings.filter(Number.isFinite));}
  const channels=[{u:.31,v:.66,bed:-3.78},{u:.71,v:.37,bed:-5.36}];
  function sightLine(r){
    if(!r.sight)return null;
    const {x,z,yaw}=r.sight;
    return {u:.669+(x-TideLookout.marks.stump.x)/32,v:.38+(z-TideLookout.marks.stump.z)/28,
      du:Math.sin(yaw)/32,dv:-Math.cos(yaw)/28};
  }
  function chart(g,input,dt){
    const r=g.survey,w=g.watch;
    if(TideLookout.active(g)){
      const previous=w.step,before=w.marked;
      TideLookout.interact(g,input,dt);
      if(!before&&w.marked==='stump'){
        const cam=TideLookout.camera(g);r.sight={x:cam.eye[0],z:cam.eye[2],yaw:cam.yaw};
      }
      if(w.step!==previous){if(w.done)say(g,'rings');secure(g);}
      return;
    }
    if(!r.fixed&&g.engaged[0]){
      r.plot[0]=clamp(r.plot[0]+input[0].x*dt*.38,.05,.95);
      r.plot[1]=clamp(r.plot[1]+input[0].z*dt*.38,.06,.94);
    }
    const dist=channels.map(c=>Math.hypot(c.u-r.plot[0],c.v-r.plot[1])),i=dist[1]<dist[0]?1:0;
    const line=sightLine(r),offset=line?Math.abs((r.plot[0]-line.u)*32*line.dv*28-(r.plot[1]-line.v)*28*line.du*32):0;
    const near=dist[i]<.060,under=depth(g)-channels[i].bed,water=depth(g);
    g.set(0,r.fixed?'保持图钉在侧槽，等船尾确认转向处。':'握住图台，移动透明十字。按双环断桩找测深点，把两次读数中更低的一笔压到图上。',{
      caption:'甲 '+r.readings[0].toFixed(2)+'　乙 '+r.readings[1].toFixed(2)+(near?'　·　槽深 '+under.toFixed(2)+' m':'　·　移到测深点')});
    g.set(1,r.fixed?'海图已钉好。在电台按确认，向驾驶台报出通行水深。':'守在船尾观察，给林澈报出两道铁箍。渡轮吃水连余量需要 1.84 米。',{
      caption:'船尾双环　·　最低水位 '+water.toFixed(2)+' m　·　'+(r.fixed?'等待发报':'等待岸上叠图')});
    if(r.ack)return;
    if(!r.fixed&&g.commit(0,input)){
      if(!near){g.alert('图针没压在测深点上。看断桩符号旁边的等深线。');return;}
      if(under<1.84){if(r.voice!=='shallow')say(g,'shallow');g.alert('浪谷里龙骨余量不足，检查双环断桩旁的槽口。');return;}
      if(offset>2.35){g.alert('图针离开船尾的实测方位线，往双环桩那一侧移一点。');return;}
      if(!g.engaged[1]){g.alert('船尾还没有人在听。');return;}
      r.fixed=true;secure(g);g.sound(521,.16);return;
    }
    if(r.fixed&&g.engaged[0]&&g.commit(1,input)){
      r.ack=true;secure(g);say(g,'safe','advance');
    }
  }
  function interact(g,input,dt){
    const r=g.survey;
    if(g.stage===2){
      if(!r.voice&&!r.announced&&g.engaged[1]&&!g.watch.done){r.announced=true;say(g,'stern');}
      chart(g,input,dt);
    }else measure(g,input,dt);
    playback(g,dt);
  }
  function checkpoint(g){
    const r=g.survey;if(!r?.taken)return null;
    return {taken:true,carry:r.carry,mount:r.mount,safeLand:r.safeLand,readings:r.readings.slice(),jaw:r.jaw,
      watch:g.watch?.step||0,plot:r.plot.slice(),fixed:r.fixed,ack:r.ack,sight:r.sight,ashore:r.ashore};
  }
  function restore(g,s){
    const r=g.survey,w=g.world.soundings;if(!r||!s?.taken)return;
    r.taken=true;r.safeLand=clamp(s.safeLand|0,0,3);r.mount=Number.isInteger(s.mount)?clamp(s.mount,-1,1):-1;
    r.carry=r.mount<0&&g.stage<2;r.jaw=clamp(Number.isFinite(s.jaw)?s.jaw:-1.54,-3.44,-.8);
    for(let i=0;i<2;i++)if(Number.isFinite(s.readings?.[i]))r.readings[i]=clamp(s.readings[i],-3.5,-2.4);
    const home=r.safeLand>=2?w.sockets[Math.min(1,r.safeLand-2)]:r.safeLand===1?w.sill:w.rack;
    r.ashore=s.ashore===true||s.watch>0;
    const a=g.stage===2&&r.ashore?w.chart:home,b=g.stage===2?w.radio:w.scopes[g.stage];
    g.checkpoints=[a,b];g.players=g.checkpoints.map(TideTraversal.spawn);
    Object.assign(g.players[0],{x:a.x,y:a.y,z:a.z,ground:g.stage===2&&r.ashore?w.upper:r.safeLand>=2?w.piers[r.safeLand-2]:r.safeLand===1?w.sill:w.upper});
    if(g.stage===2){
      g.watch.step=clamp(s.watch|0,0,2);g.watch.done=g.watch.step===2;
      if(Array.isArray(s.plot)&&s.plot.length===2&&s.plot.every(Number.isFinite))r.plot=s.plot.map(x=>clamp(x,0,1));
      r.sight=s.sight&&[s.sight.x,s.sight.z,s.sight.yaw].every(Number.isFinite)?s.sight:null;r.fixed=g.watch.done&&s.fixed===true;r.ack=r.fixed&&s.ack===true;
      if(r.ack)say(g,'safe','advance');
    }else if(r.readings[g.stage]!=null){if(g.stage===0)g.advance();else say(g,'overlay','advance');}
  }
  return {layout,create,begin,point,mean,phase,surface,swell,wave,step,target,guide,near,stance,collide,scopeAim,exposed,
    shipYaw,stern,vessel,sightLine,interact,checkpoint,restore,channels};
})();
