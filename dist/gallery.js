// Exterior inspection cradle. Both consoles act on the same ring and travelling floor.
const TideGallery=(()=>{
  const L=TideLantern,{clamp}=TideTraversal;
  const westAngle=-1.26,middleAngle=0,eastAngle=1.24,radius=4.18,level=-4.80;
  function floor(x,z,y,w,d,angle,tag){
    const co=Math.cos(angle+L.yaw),si=Math.sin(angle+L.yaw);
    return {...L.coords(x,y,z),w,d,tag,kind:'gallery',active:true,
      axes:{ux:co,uy:0,uz:-si,vx:si,vy:0,vz:co}};
  }
  function polar(a,r,y,w,d,tag){return floor(r*Math.sin(a),r*Math.cos(a),y,w,d,a,tag);}
  function point(f,u,v){return {x:f.x+f.axes.ux*u+f.axes.vx*v,y:f.y,z:f.z+f.axes.uz*u+f.axes.vz*v};}
  function build(world){
    const west=polar(westAngle,7.45,level,4.48,2.64,'west');
    const middle=polar(middleAngle,7.45,level+.28,4.25,2.64,'middle');
    const east=polar(eastAngle,7.45,level+.50,3.90,2.64,'east');
    const car=polar(westAngle,radius,level,2.70,1.70,'car');
    const controls=[west,middle].map((f,i)=>({...point(f,i?-1.10:-1.20,.18),yaw:L.yaw+(i?middleAngle:westAngle)}));
    const latch={...point(east,-.22,.12),yaw:L.yaw+eastAngle+.84};
    // The leaf covers only the gap between the two dock edges.
    const A=L.local(point(middle,1.94,-.22)),B=L.local(point(east,-1.80,-.12));
    const dx=B.x-A.x,dz=B.z-A.z,length=Math.hypot(dx,dz);
    const leaf=floor((A.x+B.x)/2,(A.z+B.z)/2,level+.42,1.40,length+.12,Math.atan2(dx,dz),'leaf');
    const stairs=[],landings=[];
    function flight(x,z,endX,endZ,y,endY,count){
      const dx=endX-x,dz=endZ-z,angle=Math.atan2(dx,dz),rise=(endY-y)/count;
      for(let j=1;j<=count;j++){const t=(j-.5)/count;
        const tread=floor(x+t*dx,z+t*dz,y+j*rise,1.45,Math.hypot(dx,dz)/count+.035,angle,'step');
        tread.riser=rise;stairs.push(tread);}
    }
    flight(7.23,3.16,7.23,7.61,level+.50,-2.24,10);
    const turn=floor(7.23,8.28,-2.24,1.6,1.48,0,'landing');landings.push(turn);
    flight(6.48,8.28,2.08,8.28,-2.24,0,11);
    const upper=floor(1.73,8.28,0,1.65,1.65,0,'landing');landings.push(upper);
    const threshold=floor(1.73,6.53,0,1.50,2.20,0,'entry');landings.push(threshold);
    const paper=[-1.98,-.83].map(x=>({...L.coords(x,0,4.15),yaw:L.yaw+Math.PI}));
    world.gallery={paper,west,middle,east,car,controls,latch,bridge:[leaf],stairs,landings,upper,threshold};
    world.floors.push(west,middle,east,car,leaf,...stairs,...landings);
    return world.gallery;
  }
  const active=g=>!!g?.gallery&&g.gallery.phase!=='done';
  function place(p,f,site){
    Object.assign(p,TideTraversal.spawn(f),{x:site.x,z:site.z,y:f.y,yaw:site.yaw||0,ground:f,grounded:true});
  }
  function geometry(g,angle){
    const w=g.world.gallery,c=w.car,old=g.gallery.angle;
    const next=polar(angle,radius,level,c.w,c.d,'car');
    const diff=angle-old,co=Math.cos(diff),si=Math.sin(diff);
    for(const p of g.players)if(p.ground===c&&p.grounded){
      const dx=p.x-c.x,dz=p.z-c.z;
      p.x=next.x+co*dx+si*dz;p.z=next.z-si*dx+co*dz;p.yaw+=diff;
      p.deckMotion={x:g.gallery.velocity*(p.z+91),y:0,z:-g.gallery.velocity*(p.x-14)};
    }
    Object.assign(c,next);g.gallery.angle=angle;
  }
  function queue(g,key){
    const a=g.gallery;if(a.said.includes(key))return;
    a.said.push(key);a.queue.push(key);
  }
  function speak(g,dt){
    const a=g.gallery;
    if(!a.voice&&a.queue.length){a.voice=a.queue.shift();a.clock=0;a.line=-1;g.events.log?.(TideGallerySpeech[a.voice].line);}
    if(!a.voice){a.subtitle='';return;}
    const clip=TideGallerySpeech[a.voice];a.clock+=dt;
    const n=clip.lines.findLastIndex(x=>x[0]<=a.clock);
    if(n>=0)a.subtitle=clip.lines[n][1];
    if(a.clock>=clip.duration){a.voice='';a.subtitle='';}
  }
  function begin(g,mark){
    const w=g.world.gallery,saved=mark?.gallery;
    g.gallery={phase:'out',angle:westAngle,velocity:0,turns:[0,0],grip:[false,false],work:['',''],opening:0,latched:false,
      arrests:[null,null],press:0,rail:0,insert:0,rejected:false,ticket:validTicket(mark?.ticket)||validTicket(g.tideTicket),boarded:false,voice:'',clock:0,line:-1,subtitle:'',queue:[],said:[],cue:'',serial:0,home:[w.west,w.west],arrived:[false,false]};
    const a=g.gallery;
    w.bridge[0].active=false;geometry(g,westAngle);
    place(g.players[0],w.west,w.controls[0]);place(g.players[1],w.west,point(w.west,.87,-.22));
    if(saved==='middle'||saved==='stairs'||saved==='file'||saved==='inside'){
      a.phase=saved==='middle'?'return':saved==='stairs'?'stairs':saved==='file'?'file':'done';
      a.said=['log','west','relay'];
      a.home=[w.west,w.middle];place(g.players[1],w.middle,w.controls[1]);geometry(g,saved==='middle'?0:eastAngle);
      if(saved!=='middle'){
        a.latched=true;a.opening=1;w.bridge[0].active=true;a.home[0]=w.east;
        place(g.players[0],w.east,w.latch);
      }
      if(saved==='file'){a.arrived.fill(true);g.players.forEach((p,i)=>place(p,w.threshold,L.coords(i?2.12:1.32,0,5.49)));}
      if(saved==='inside'){a.rail=a.insert=1;}
      if(saved==='inside')g.section.starts.forEach((s,i)=>Object.assign(g.players[i],TideTraversal.spawn(s)));
    }else{queue(g,'log');queue(g,'west');}
    if(a.phase==='file')displayFile(g);else if(active(g))display(g);
  }
  function checkpoint(g){
    if(!g?.gallery||g.stage!==0)return null;
    const phase=g.gallery.phase;
    return phase==='out'?null:{...(g.gallery.ticket?{ticket:g.gallery.ticket.slice()}:{}),gallery:phase==='done'?'inside':phase==='file'?'file':phase==='stairs'?'stairs':'middle'};
  }
  function setPhase(g,phase){g.gallery.phase=phase;g.events.checkpoint?.(g);}
  function cue(a,key){a.cue=key;a.serial++;}
  const close=(p,s)=>p.grounded&&Math.abs(p.y-s.y)<.55&&Math.hypot(p.x-s.x,p.z-s.z)<.96;
  function target(g,i){
    const w=g.world.gallery,a=g.gallery,p=g.players[i],aboard=p.ground===w.car;
    if(a.phase==='file')return {p:w.paper[i],name:i?'潮尺原数联':'灯室图夹'};
    if(a.phase==='out')return i?{p:aboard?w.middle:w.car,name:aboard?'Ⅱ 背风台':'登上回转检修台'}:{p:w.controls[0],name:'Ⅰ 西台手轮'};
    if(a.phase==='return'||a.phase==='last')return i?{p:w.controls[1],name:'Ⅱ 背风台手轮'}:
      p.ground===w.east?{p:w.latch,name:'放下折桥'}:{p:aboard?w.east:w.car,name:aboard?'Ⅲ 白漆台':'接回检修台'};
    return {p:a.home[i]===w.middle?w.east:w.threshold,name:a.home[i]===w.middle?'过折桥去塔梯':'走楼梯进灯室'};
  }
  function display(g){
    const a=g.gallery,w=g.world.gallery;
    for(let i=0;i<2;i++){
      const station=target(g,i),aboard=g.players[i].ground===w.car;
      const instruction=a.phase==='out'?(i?(aboard?'跟着回转台到Ⅱ背风台。看准内沿，起跳登陆。':'从有黄边的开口跳上检修台，和同伴说一声站稳了。'):'在Ⅰ号台握住手轮，向右送台。松手刹车，等同伴跳过去。'):
        a.phase==='stairs'?(a.opening<1?'折桥正在放下，等钢鞋落座再过。':a.arrived[i]?'在灯室门内等同伴带记录上来。':a.home[i]===w.middle?'沿放下的折桥到白漆台，转身走梯。':'沿塔外两段楼梯上去，从敞开的门进入灯室。'):
        i?'在Ⅱ号台握轮。先向左接人，再向右越过背风台，送到Ⅲ号白漆台。':
        g.players[0].ground===w.east?'靠近扳柄，按住抬起桥闩，让沈遥沿桥过来。':aboard?'向白漆台的开口起跳，扳动靠墙的桥闩。':'等台子转回来，从黄边起跳。';
      const waiting=a.phase==='out'&&!a.boarded&&a.angle>westAngle+.16;
      g.set(i,a.arrests[i]?'安全索已受力。按住操作键辅助收索，回到上一处落脚台。':waiting?(i?'等检修台回到西台黄边，再起跳。':'检修台上还没人。向左摇轮，把格栅送回西台。'):instruction,{caption:station.name+(a.phase==='stairs'?'':'　／　环轨 '+Math.round((a.angle-westAngle)*180/Math.PI)+'°')});
    }
  }
  function anchor(p){
    const a=Math.atan2(p.x-14,p.z+91)-L.yaw;
    const angle=clamp(Math.atan2(Math.sin(a),Math.cos(a)),westAngle-.20,eastAngle+.20);
    return polar(angle,5.55,-1.95,.1,.1,'runner');
  }
  function catchFall(g,i){
    const p=g.players[i],a=g.gallery,f=a.home[i],w=g.world.gallery;
    const to=f===w.west?(i?point(f,.87,-.22):w.controls[0]):f===w.middle?w.controls[1]:f===w.east?w.latch:f;
    const angle=q=>Math.atan2(q.x-14,q.z+91);
    a.arrests[i]={clock:0,haul:0,y:p.y,from:angle(p),to:angle(to),radius:Math.hypot(p.x-14,p.z+91),
      endRadius:Math.hypot(to.x-14,to.z+91),site:to,floor:f,drop:clamp(-p.vy*.030,.12,.37)};
    p.ground=null;p.grounded=false;p.vx=p.vy=p.vz=p.speed=0;p.deckMotion=null;
    a.arrived[i]=false;if(i&&a.phase==='out')a.boarded=false;
    if(!i&&a.phase==='last'&&f===w.west)a.phase='return';
    g.setbacks++;g.alert('安全索刹住了。按住操作键可以更快收回，手轮仍可转动。',2.7);
    cue(a,'gear');
  }
  function recover(g,i,k,dt){
    const a=g.gallery,r=a.arrests[i],p=g.players[i];r.clock+=dt;
    if(r.clock>.36)r.haul=clamp(r.haul+dt*(k.use?.96:.64),0,1);
    const t=r.haul*r.haul*(3-2*r.haul),dist=r.radius+(r.endRadius-r.radius)*t;
    const delta=Math.atan2(Math.sin(r.to-r.from),Math.cos(r.to-r.from));
    const angle=r.from+delta*t;
    p.x=14+dist*Math.sin(angle);p.z=-91+dist*Math.cos(angle);
    p.y=r.y+(r.site.y-r.y)*t-r.drop*Math.sin(Math.min(1,r.clock/.60)*Math.PI)*(1-t)+.33*Math.sin(Math.PI*t);
    if(r.haul===1){place(p,r.floor,r.site);a.arrests[i]=null;}
  }
  function validTicket(value){
    return Array.isArray(value)&&value.length===2&&value.every(x=>Number.isFinite(x)&&x>=-3.50&&x<=-2.40)?value.slice():null;
  }
  function displayFile(g){
    const a=g.gallery,r=a.ticket;
    const depth=r?Math.min(...r)-(a.rail>=0?-5.36:-3.78):null;
    const info=r?'甲 '+r[0].toFixed(2)+'　乙 '+r[1].toFixed(2)+' m':'旧值班记录　／　侧槽已复测';
    g.set(0,!g.near[0]?'到灯室门旁的图板左侧。':a.insert>=.98?'读对图夹上的槽名和水深后，松手落夹。':'握紧图夹扳柄，给沈遥留出进纸的缝。',{caption:'海雁所需净深　1.84 m'});
    const guide=a.rejected?'浅槽余量不足。请同伴重新抬夹，向后抽纸，再换另一道槽。':
      a.press<.76?'在图板右侧握住原数联。等左边把弹簧夹抬起来。':
      a.insert>=.98?'原数联已推到底。请林澈读完后松夹。':'左右移到选定的纸槽；向前推入，向后抽回。';
    g.set(1,guide,{caption:info+(depth!==null&&Math.abs(a.rail)>.78?'　／　槽深 '+depth.toFixed(2)+' m':'')});
  }
  function fileStep(g,inputs,yaws,dt){
    const a=g.gallery,w=g.world.gallery,wasHeld=a.grip[0];
    for(let i=0;i<2;i++){
      const p=g.players[i],spot=w.paper[i];g.near[i]=close(p,spot);g.engaged[i]=g.near[i]&&inputs[i].use;
      a.grip[i]=g.engaged[i];a.work[i]=a.grip[i]?'paper':'';
      TideTraversal.move(p,inputs[i],dt,g.world,yaws[i],a.grip[i]);
      TideLantern.collide(p);
      if(a.grip[i]){const k=1-Math.exp(-dt*14);p.x+=(spot.x-p.x)*k;p.z+=(spot.z-p.z)*k;p.yaw=spot.yaw;}
      if(p.y<L.height-1.1){place(p,w.threshold,w.threshold);g.setbacks++;g.events.reset?.(i);}
    }
    a.press=clamp(a.press+(a.grip[0]?3.0:-4.4)*dt,0,1);
    if(a.press>.76&&a.grip[1]){
      if(a.insert<=.025)a.rail=clamp(a.rail+inputs[1].x*dt*1.55,-1,1);
      if(Math.abs(a.rail)>.80){
        a.insert=clamp(a.insert-inputs[1].z*dt*.80,0,1);
        if(a.insert>.025)a.rail=Math.sign(a.rail);
        if(a.insert<=.025)a.rejected=false;
      }
    }
    if(wasHeld&&!a.grip[0]&&a.insert>.98){
      const safe=a.rail>0&&(!a.ticket||Math.min(...a.ticket)+5.36>=1.84);
      if(safe){
        a.phase='done';a.press=0;a.work.fill('');a.grip.fill(false);g.engaged.fill(false);g.near.fill(false);
        g.checkpoints=g.section.starts.slice();g.events.checkpoint?.(g);g.alert('侧槽原数已夹好。林澈去遮片手轮，沈遥从近窗看海。',4);return;
      }
      a.rejected=true;g.alert('浅槽不能给海雁留下 1.84 米净深。抬夹，把原数联退回来。',3);
    }
    speak(g,dt);displayFile(g);
  }
  function step(g,inputs,yaws,dt){
    if(g.gallery.phase==='file'){fileStep(g,inputs,yaws,dt);return;}
    const a=g.gallery,w=g.world.gallery;
    const operator=a.phase==='out'?0:1;
    for(let i=0;i<2;i++){
      const p=g.players[i],rightStation=operator===i&&a.phase!=='stairs';
      const latch=i===0&&a.phase==='last'&&p.ground===w.east;
      const s=latch?w.latch:rightStation?w.controls[i]:null;
      g.near[i]=!!s&&close(p,s);g.engaged[i]=g.near[i]&&inputs[i].use;
      a.grip[i]=g.engaged[i];a.work[i]=a.grip[i]?(latch?'latch':i?'middle':'west'):'';
      if(g.engaged[i]){
        const k=1-Math.exp(-dt*16);p.x+=(s.x-p.x)*k;p.z+=(s.z-p.z)*k;
        p.yaw+=Math.atan2(Math.sin(s.yaw-p.yaw),Math.cos(s.yaw-p.yaw))*k;p.vx=p.vz=0;
      }
    }
    const drive=a.grip[operator]&&a.work[operator]!=='latch'?inputs[operator].x:0;
    const omega=drive*.74;
    a.velocity+=(omega-a.velocity)*(1-Math.exp(-dt*(drive?2.5:5.4)));
    const next=clamp(a.angle+a.velocity*dt,westAngle,eastAngle);
    if((next===westAngle||next===eastAngle)&&Math.abs(a.velocity)>.05&&a.angle!==next)cue(a,'gear');
    if(next===westAngle||next===eastAngle)a.velocity=0;
    a.turns[operator]+=(next-a.angle)*7.2;geometry(g,next);
    for(let i=0;i<2;i++){
      const p=g.players[i];
      if(a.arrests[i]){recover(g,i,inputs[i],dt);continue;}
      TideTraversal.move(p,inputs[i],dt,g.world,yaws[i],a.grip[i]);
      if(p.y<a.home[i].y-2.2){catchFall(g,i);continue;}
      if(p.grounded){
        if(a.phase==='stairs'&&(p.ground===w.east||w.landings.includes(p.ground)))a.home[i]=p.ground;
        if(a.phase==='last'&&!i&&p.ground===w.east)a.home[0]=w.east;
      }
    }
    if(a.phase==='out'&&g.players[1].ground===w.car)a.boarded=true;
    if(a.phase==='out'&&a.boarded&&g.players[1].ground===w.middle){a.home[1]=w.middle;a.velocity*=.25;cue(a,'gear');queue(g,'relay');setPhase(g,'return');}
    if(a.phase==='return'&&g.players[0].ground===w.car){a.phase='last';queue(g,'aboard');}
    if(a.phase==='last'&&a.work[0]==='latch'){
      a.latched=true;a.velocity=0;cue(a,'gear');setPhase(g,'stairs');
    }
    if(a.phase==='stairs'){
      a.opening=clamp(a.opening+dt*.53,0,1);
      if(a.opening===1&&!w.bridge[0].active){w.bridge[0].active=true;cue(a,'leaf');queue(g,'bridge');}
      for(let i=0;i<2;i++){
        const p=g.players[i],loc=L.local(p);
        if(p.grounded&&p.y>L.height-.10&&Math.abs(loc.x-1.73)<1.42&&loc.z<5.53&&loc.z>3.45){a.arrived[i]=true;a.home[i]=w.threshold;}
        if(loc.z>5.75||p.y<L.height-.30)a.arrived[i]=false;
      }
      if(a.arrived.every(Boolean)){
        a.grip.fill(false);g.engaged.fill(false);g.near.fill(false);setPhase(g,'file');displayFile(g);return;
      }
    }
    speak(g,dt);display(g);
  }
  function shot(g,i,yaw,pitch,ready=true){
    const p=g.players[i],w=g.world.gallery,a=g.gallery;
    if(a.phase==='file'&&(a.grip[i]||close(p,w.paper[i]))){
      const eye=L.coords(i?-.62:-1.92,i?1.76:1.97,i?4.45:4.26),target=L.coords(i?-.99:-1.46,1.02,4.96);
      return {eye:[eye.x,eye.y,eye.z],at:[target.x,target.y,target.z],fov:i?48:52,handsOnly:true};
    }
    const corner=Math.atan2(p.x-14,p.z+91),orbit=yaw-L.yaw;
    const driver=!['stairs','file'].includes(a.phase)&&i===(a.phase==='out'?0:1);
    const working=driver&&Math.hypot(p.x-w.controls[i].x,p.z-w.controls[i].z)<1.40;
    const bias=working?(i?.74:-.75):p.ground===w.car?-.38:0;
    const angle=corner+orbit+bias,rad=working?4.25:4.12;
    const ox=Math.sin(angle),oz=Math.cos(angle);
    const at=[p.x-.25*ox,p.y+(working?1.02:.92),p.z-.25*oz];
    if(working){
      const mix=.24*Math.max(0,Math.cos(orbit));
      at[0]+=(w.car.x-p.x)*mix;at[2]+=(w.car.z-p.z)*mix;
    }
    const eye=[p.x+ox*rad,p.y+(working?2.90:2.42)+pitch,p.z+oz*rad];
    if(!i&&!a.said.includes('relay')){
      const wait=ready?clamp(1-g.time/1.4,0,1):1;
      eye[0]+=wait*(ox*5.40-oz*2.4);eye[2]+=wait*(oz*5.40+ox*2.4);eye[1]+=wait*2.6;
      at[0]+=(14-at[0])*wait*.23;at[2]+=(-91-at[2])*wait*.23;
    }
    return {eye,at,fov:working?65:61};
  }
  function movementYaw(g,i,yaw){
    const {eye,at}=shot(g,i,yaw,0);
    return Math.atan2(eye[0]-at[0],eye[2]-at[2]);
  }
  return {build,begin,active,step,checkpoint,target,shot,movementYaw,validTicket,anchor,point,westAngle,middleAngle,eastAngle,radius};
})();
