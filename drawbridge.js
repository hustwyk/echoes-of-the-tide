// The bridge leaf pivots at the near abutment. The same basis drives the collision
// plane, rolling ballast, docking marks and the steelwork drawn by both cameras.
const TideDrawbridge=(()=>{
  const {clamp,mix}=TideTraversal;
  function point(b,u,h,v){
    const a=b.axes;
    return {x:b.hinge.x+u*a.ux+h*a.nx+v*a.vx,y:b.hinge.y+u*a.uy+h*a.ny+v*a.vy,z:b.hinge.z+u*a.uz+h*a.nz+v*a.vz};
  }
  function coordinates(b,p){
    const a=b.axes,x=p.x-b.hinge.x,z=p.z-b.hinge.z,det=a.ux*a.vz-a.uz*a.vx;
    return {u:(x*a.vz-z*a.vx)/det,v:(z*a.ux-x*a.uz)/det};
  }
  function pose(b,players){
    const seated=b.deck,feet=players.map(p=>p.ground===seated?coordinates(b,p):null);
    const cy=Math.cos(b.yaw),sy=Math.sin(b.yaw),cp=Math.cos(b.pitch),sp=Math.sin(b.pitch),cr=Math.cos(b.roll),sr=Math.sin(b.roll);
    b.axes={ux:cy*cr+sy*sp*sr,uy:cp*sr,uz:-sy*cr+cy*sp*sr,
      nx:-cy*sr+sy*sp*cr,ny:cp*cr,nz:sy*sr+cy*sp*cr,vx:-sy*cp,vy:sp,vz:-cy*cp};
    Object.assign(seated,point(b,0,0,b.length*.5),{axes:b.axes,pitch:b.pitch,yaw:b.yaw,roll:b.roll});
    for(let i=0;i<players.length;i++)if(feet[i])Object.assign(players[i],point(b,feet[i].u,0,feet[i].v));
    b.grip=point(b,b.mass*.91,0,b.length*b.rail);b.tip=point(b,0,0,b.length);
  }
  function build(world){
    for(const sec of world.sections){
      const s=sec.spec;
      if(s.mode==='bridge'){
        const rider=1-s.driver,home=sec.starts[rider],end=sec.ends[rider],deck=sec.ferry.deck;
        const hinge={x:home.x,y:home.y-.028,z:home.z-2.58};
        const lip={x:home.x,y:end.y-.012,z:end.z+3.34,w:2.92,d:1.62,kind:'quay',active:true};
        world.floors.push(lip);
        const dz=hinge.z-(lip.z+.54),dy=lip.y-hinge.y,level=Math.atan2(dy,dz);
        const raised=level+(s.driver===0?.55:.46);
        const b={hinge,lip,deck,length:Math.hypot(dz,dy),level,raised,pitch:raised,
          yaw:0,roll:0,yawSpeed:0,payout:0,mass:0,notch:0,seated:false,landed:false,
          impact:-10,hit:false,rail:s.driver===0?.43:.52,lower:s.driver===1};
        Object.assign(deck,{w:s.driver===0?2.92:2.60,d:b.length,kind:'leaf'});
        for(const [j,slab] of sec.returnDecks.entries()){
          slab.kind='ladder';slab.w=2.15;slab.hinge=0;slab.unlocked=false;
          slab.hingeDirection=j<Math.ceil(sec.returnDecks.length/2)?-1:1;
          slab.hingeX=slab.x;slab.hingeZ=slab.z-slab.hingeDirection*slab.d*.5;
        }
        if(b.lower){
          b.gates=[b.length*.27,b.length*.83];b.folded=0;b.blockedAt=-10;
          deck.gap=[b.length*.64-b.length*.5,b.length*.739-b.length*.5];
        }
        sec.span=b;pose(b,[]);
      }
      if(s.type==='quiet'){
        for(const lane of sec.paths)for(const slab of lane)slab.active=false;
        const a=sec.starts[0],end=sec.mid;
        const from={x:(a.x+sec.starts[1].x)*.5,y:a.y-.08,z:a.z-3.22};
        const to={x:end.x,y:end.y-.08,z:end.z+3.08};
        // A short jetty reaches the central basket from either starting platform.
        world.floors.push({x:from.x,y:a.y,z:a.z-1.04,w:6.7,d:2.04,active:true,kind:'bridge'});
        const deck={...from,w:4.64,d:3.80,kind:'tram',dynamic:true,active:true};
        world.floors.push(deck);
        sec.tram={from,to,deck,travel:0,departed:false,ready:0,heard:false,arrived:false};
        tramSites(sec);
      }
    }
  }
  function restore(sec){
    if(!sec.span)return;
    const b=sec.span;Object.assign(b,{pitch:b.level,yaw:0,roll:0,payout:0,notch:2,seated:true,landed:true});pose(b,[]);
  }
  function onCart(g,side,input){
    const b=g.section.span;
    if(!b||b.seated||side===g.spec.driver||!input.use||g.players[side].ground!==b.deck)return false;
    const at=coordinates(b,g.players[side]);
    return Math.abs(at.v-b.length*b.rail)<1.12&&Math.abs(at.u-b.mass*.91)<1.45;
  }
  function advance(g,input,dt){
    const sec=g.section,b=sec.span,q=g.state,d=g.spec.driver,r=1-d;
    const rider=g.players[r],turning=onCart(g,r,input[r]);
    if(b.seated){
      b.pitch=mix(b.pitch,b.level,1-Math.exp(-9*dt));b.yaw*=Math.exp(-9*dt);b.roll*=Math.exp(-9*dt);
      pose(b,g.players);
      if(!b.landed&&(rider.ground===b.lip||rider.ground===sec.ends[r])){
        b.landed=true;g.checkpoints[r]=b.lip;g.sound(590,.12);g.alert('桥头落脚，接住对岸棘轮');
      }
      g.set(d,'制动已自锁，等同伴走到桥头接管棘轮',{caption:'桥鼻插销已入座'});
      g.set(r,b.landed?'在桥头握住棘轮，接替同伴':b.lower?(g.time-b.blockedAt<1?'潮尺顶住横梁。按住操作键把尺收平，再向前走':'带潮尺跳过缺板，压平尺身通过末端横梁'):'沿已经落稳的桥面走上对岸石座',{caption:'两道机械保险已闭合'});
      return;
    }
    if(turning){
      b.mass=clamp(b.mass+input[r].x*dt*.73,-1,1);
      const at=coordinates(b,rider),k=1-Math.exp(-8*dt);
      Object.assign(rider,point(b,mix(at.u,b.mass*.91,k),0,mix(at.v,b.length*b.rail+.32,k)));
      rider.vx=rider.vz=0;
    }
    const stop=b.notch===0?b.level+.205:b.level;
    const dropping=g.engaged[d]&&(rider.ground===b.deck||b.notch>0);
    const rate=!dropping?0:input[d].z>.4?-.14:input[d].z<-.4?.24:.081;
    b.payout=mix(b.payout,rate,1-Math.exp(-dt*(dropping?4.4:10)));
    const next=b.pitch-b.payout*dt;
    if(next<=stop&&b.payout>.15&&g.time-b.impact>1.0){
      b.pitch=stop+.085;b.payout=-.14;b.impact=g.time;b.yawSpeed+=(b.lower?-1:1)*.16;
      g.sound(123,.22);g.alert('制动滚筒弹回。放开快放杆，慢慢放到刻口。');
    }else{
      b.pitch=clamp(next,stop,b.notch===0?b.raised:b.level+.25);
      if(b.pitch<=stop+.0001)b.payout=Math.min(0,b.payout);
    }
    const dir=(b.notch?1:-1)*(b.lower?-1:1);
    const wind=dir*(b.lower?1.21:.98)+.19*Math.sin(g.time*.86+(b.lower?1:0));
    const targetYaw=-(wind-b.mass*1.65)/Math.max(4,b.length*Math.cos(b.pitch));
    b.yawSpeed+=((targetYaw-b.yaw)*5.7-b.yawSpeed*2.8)*dt;b.yaw+=b.yawSpeed*dt;
    const riderU=rider.ground===b.deck?coordinates(b,rider).u:0;
    const tilt=clamp((wind-b.mass*1.65)*.064-riderU*.015,-.14,.14);
    b.roll=mix(b.roll,tilt,1-Math.exp(-dt*3.4));pose(b,g.players);
    const error=b.tip.x-b.lip.x,tolerance=b.lower?.29:.38;
    const vertical=Math.abs(b.pitch-stop)<.018,fit=vertical&&Math.abs(error)<tolerance&&Math.abs(b.yawSpeed)<.08;
    b.aligned=fit;b.error=error;b.atStop=vertical;
    q.ferry=clamp((b.raised-b.pitch)/(b.raised-b.level),0,1);
    if(turning&&input[r].jump){
      if(fit){
        b.notch++;g.sound(b.notch===1?480:690,.15);
        if(b.notch===1)g.alert('上齿咬合。绳力已换向，看下一道桥鼻刻线。');
        else{b.seated=true;q.ferry=1;g.alert('桥鼻落座。放开配重手柄，沿桥面去对岸接闸。');}
      }else{
        g.alert(!vertical?'滚筒还没到刻口，请同伴继续慢放':Math.abs(error)>=tolerance?'销孔错开了，再横移配重':'等桥鼻止摆，再插销',1.55);
      }
    }
    const remaining=Math.max(0,Math.round((b.pitch-stop)*180/Math.PI));
    g.set(d,rider.ground!==b.deck&&!b.notch?'等同伴上桥，握住制动杆':'握住操作键慢放，前推快放、后拉收绳，松手制动',{
      vis:'dial',value:clamp(b.payout/.24,0,1),target:.33,band:.22,
      caption:(b.notch?'下齿':'上齿')+'　·　余角 '+remaining+'°　·　'+(vertical?'鼓轮停在刻口':b.payout>.15?'快放，请提前减速':'看滚筒读数')});
    const cm=Math.round(Math.abs(error)*100);
    g.set(r,!turning?(b.lower&&g.time-b.blockedAt<1.4?'尺顶碰到横梁。按住操作键收平潮尺，一边前进':'走上桥面的配重轨，按住操作键握把'):'左右推配重，对齐桥鼻和接收槽。停稳后按确认插销',{
      vis:'dial',value:clamp(.5+error*.26,0,1),target:.5,band:tolerance*.26,
      caption:fit?'两条刻线已合，确认插销':(Math.abs(error)<tolerance?'横向齐平':'桥鼻偏'+(error>0?'右 ':'左 ')+cm+' cm，配重往'+(error>0?'右':'左'))+'　·　'+(vertical?'已到刻口':'等同伴慢放')});
  }
  function carry(g,input,dt,previous){
    const b=g.section.span;
    if(!b?.lower||b.landed)return;
    const r=1-g.spec.driver,p=g.players[r],to=coordinates(b,p);
    const folding=input[r].use&&!onCart(g,r,input[r]);
    b.folded=mix(b.folded,folding?1:0,1-Math.exp(-dt*11));
    if(!previous||Math.abs(to.u)>b.deck.w*.5+.5)return;
    const floorY=point(b,to.u,0,to.v).y;
    if(p.y<floorY-.45||p.y>floorY+2.4)return;
    for(const gate of b.gates){
      const side=previous.v<gate?-1:1,edge=gate+side*.29;
      if((to.v-edge)*side>=0||(to.v-gate)*side<-.36||Math.abs(previous.v-gate)>.65)continue;
      if(b.folded>.78&&p.y-floorY<.32)continue;
      const halt=point(b,to.u,0,edge);
      p.x=halt.x;p.z=halt.z;if(p.ground===b.deck)p.y=halt.y;
      p.vx=p.vz=0;b.blockedAt=g.time;
    }
  }
  function catchRider(g,side){
    const b=g.section.span;
    if(!b||side===g.spec.driver||b.landed||!b.notch)return false;
    const p=g.players[side],safe=point(b,b.mass*.91,0,b.length*b.rail+.38);
    Object.assign(p,TideTraversal.spawn(b.deck),safe);return true;
  }
  function tramSites(sec){
    const d=sec.tram.deck;
    sec.sites.forEach((s,i)=>Object.assign(s,{x:d.x+(i?.80:-.80),y:d.y,z:d.z+.16}));
  }
  function tram(g,dt){
    const sec=g.section,c=sec.tram,aboard=g.players.map(p=>p.ground===c.deck);
    if(!c.departed){
      c.ready=aboard.every(Boolean)?c.ready+dt:0;
      if(c.ready>.42){c.departed=true;g.sound(370,.13);g.alert('两人都上车了。风被桥腹挡在外面。');}
    }
    if(!c.departed)return false;
    const old=c.deck,rate=g.skipTin?.26:1/(14.5+.08*Math.hypot(c.to.z-c.from.z,c.to.x-c.from.x));
    c.travel=clamp(c.travel+dt*rate,0,1);
    const f=c.travel*c.travel*(3-2*c.travel),arc=Math.sin(Math.PI*f);
    const x=mix(c.from.x,c.to.x,f)+arc*.60,y=mix(c.from.y,c.to.y,f)-arc*.75,z=mix(c.from.z,c.to.z,f);
    for(let i=0;i<2;i++)if(aboard[i]){g.players[i].x+=x-old.x;g.players[i].y+=y-old.y;g.players[i].z+=z-old.z;}
    Object.assign(old,{x,y,z});tramSites(sec);
    if(c.travel>=1&&!c.arrived){c.arrived=true;g.sound(540,.12);g.alert('吊篮到站，桥头柜就在门边。');}
    return true;
  }
  return {build,point,coordinates,onCart,carry,advance,restore,catchRider,tram};
})();
