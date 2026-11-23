// The launch carries a sliding gangboard at its aft boarding opening. Its tip
// follows the tide until the crew puts the shore pin through the sliding shoe.
const TideBerthBoard=(()=>{
  const {clamp}=TideTraversal;
  const seat={x:-3.16,y:-2.445,z:13.12}, width=.64;
  const shore={x:-3.67,y:-2.49,z:12.80};
  function create(world){
    const floor={x:-3.08,y:-2.49,z:15.3,w:width,d:.43,kind:'gangboard',active:false,dynamic:true};
    const ramp={...floor,d:.70},nose={...floor,d:.28};
    world.floors.push(floor,ramp,nose);
    return {floor,ramp,nose,fit:0,extension:0,aim:.18,locked:false,crossing:false,bank:[null,null],held:[null,null],
      cue:'',serial:0,rollAt:-1,lockedAt:-10,feedback:'',until:-1,lastJump:[false,false]};
  }
  function onBoat(g,x,y,z){
    const h=g.world.fenders.floatPose;
    return TideFloating.point(h,x-h.anchorX,y-h.anchorY,z-h.anchorZ);
  }
  const handle=g=>onBoat(g,-2.55,-2.72,16.00);
  function pose(g,freeTip=false){
    const s=g.fenders.board,a=onBoat(g,-3.08,-2.49,15.48);
    const span=.43+2.49*s.extension;
    let b=s.locked?{...seat}:onBoat(g,-3.08+Math.sin(s.aim)*span,-2.49-.18*span,15.48-Math.cos(s.aim)*span);
    const edge=g.world.fenders.lower.z+g.world.fenders.lower.d/2;
    if(!s.locked&&g.fenders.moored){
      // The end stop on the quay leaves a little overtravel past the pin.
      if(b.z<seat.z-.20){
        const fraction=(a.z-seat.z+.20)/(a.z-b.z);
        b={x:a.x+(b.x-a.x)*fraction,y:a.y+(b.y-a.y)*fraction,z:seat.z-.20};
      }
      const contact=clamp((edge+.25-b.z)/.25,0,1);
      b.y+=Math.max(0,seat.y-b.y)*contact;
      if(s.fit&&!freeTip){
        b={x:b.x+(seat.x-b.x)*s.fit,y:b.y+(seat.y-b.y)*s.fit,z:b.z+(seat.z-b.z)*s.fit};
      }
    }
    const dx=b.x-a.x,dy=b.y-a.y,dz=b.z-a.z,d=Math.hypot(dx,dz);
    const noseFraction=Math.min(.70/d,.36),u=1-noseFraction;
    const knuckle={x:a.x+dx*u,y:a.y+dy*u,z:a.z+dz*u};
    if(g.fenders.moored){
      const contact=clamp((edge+.18-b.z)/.18,0,1);
      knuckle.y+=Math.max(0,seat.y-knuckle.y)*contact;
    }
    const firstLength=Math.hypot(knuckle.x-a.x,knuckle.y-a.y,knuckle.z-a.z);
    const noseLength=Math.hypot(b.x-knuckle.x,b.y-knuckle.y,b.z-knuckle.z);
    const across={x:-dz/d,y:0,z:dx/d};
    return {a,b,knuckle,seat,across,width,length:firstLength+noseLength,noseLength,extension:s.extension,
      locked:s.locked,show:true,held:s.held.includes('boat'),ridden:g.players.some(p=>p.ground===s.floor||p.ground===s.nose)};
  }
  function surface(g,f,a,b,across){
    const length=Math.hypot(b.x-a.x,b.y-a.y,b.z-a.z);
    // A standing foot follows its material point, without stretching its
    // position when the other player slides an additional section out.
    const feet=g.players.map(p=>p.ground===f&&f.axes?{u:(p.x-f.start.x)*f.axes.ux+(p.y-f.start.y)*f.axes.uy+(p.z-f.start.z)*f.axes.uz,
      v:(p.x-f.start.x)*f.axes.vx+(p.y-f.start.y)*f.axes.vy+(p.z-f.start.z)*f.axes.vz}:null);
    const vx=(b.x-a.x)/length,vy=(b.y-a.y)/length,vz=(b.z-a.z)/length;
    // Right-handed surface normal always points towards the upper tread.
    const sign=across.z*vx-across.x*vz>0?1:-1;
    Object.assign(f,{start:a,x:(a.x+b.x)/2,y:(a.y+b.y)/2,z:(a.z+b.z)/2,d:length,active:g.fenders.moored,
      axes:{ux:across.x,uy:across.y,uz:across.z,vx,vy,vz,nx:(across.y*vz-across.z*vy)*sign,ny:(across.z*vx-across.x*vz)*sign,nz:(across.x*vy-across.y*vx)*sign}});
    feet.forEach((v,i)=>{if(v&&v.v<=length+.045)Object.assign(g.players[i],{
      x:a.x+across.x*v.u+vx*v.v,y:a.y+across.y*v.u+vy*v.v,z:a.z+across.z*v.u+vz*v.v});});
  }
  function footing(g){
    const s=g.fenders.board,v=pose(g),h=g.world.fenders.floatPose.axes;
    surface(g,s.ramp,onBoat(g,-3.08,-2.71,16.17),onBoat(g,-3.08,-2.49,15.49),{x:h.ux,y:h.uy,z:h.uz});
    surface(g,s.floor,v.a,v.knuckle,v.across);
    surface(g,s.nose,v.knuckle,v.b,v.across);
  }
  function cue(s,id){s.cue=id;s.serial++;}
  function near(g,i,which){
    const p=g.players[i],t=which==='boat'?handle(g):shore,w=g.world.fenders;
    return p.grounded&&(which==='boat'?w.floatPose.floors.includes(p.ground):p.ground===w.lower)
      &&Math.hypot(p.x-t.x,p.z-t.z)<.72;
  }
  function step(g,k,dt){
    const s=g.fenders.board;
    if(s.locked){
      for(let i=0;i<2;i++)if(!k[i].use||g.time-s.lockedAt>.85)s.held[i]=null;
    }else s.held.fill(null);
    if(!g.fenders.moored)return;
    const before=s.extension,oldAim=s.aim;
    if(!s.locked){
      for(const which of ['boat','shore']){
        const i=g.players.findIndex((_,j)=>k[j].use&&near(g,j,which));
        if(i<0)continue;
        s.held[i]=which;
        const actor=g.players[i],at=which==='boat'?handle(g):shore,blend=1-Math.exp(-dt*12);
        actor.x+=(at.x-actor.x)*blend;actor.z+=(at.z-actor.z)*blend;
        const yaw=which==='boat'?g.world.fenders.floatPose.yaw:Math.PI;
        actor.yaw+=Math.atan2(Math.sin(yaw-actor.yaw),Math.cos(yaw-actor.yaw))*blend;
        actor.vx=actor.vz=actor.speed=0;
        if(which==='boat'){
          s.extension=clamp(s.extension-k[i].z*dt*.53,0,1);
          s.aim=clamp(s.aim+k[i].x*dt*.35,-.36,.36);
        }
      }
      if(!s.held.includes('boat'))s.extension=Math.max(0,s.extension-.18*dt);
      if((Math.abs(s.extension-before)+Math.abs(s.aim-oldAim)>.00005)&&g.time-s.rollAt>.51){cue(s,'board-roll');s.rollAt=g.time;}
      // The flared shoe centres a nose that reaches its mouth. Players can
      // see it settle before the pin will fit, even as the boat keeps heaving.
      const raw=pose(g,true).b;
      const capture=s.held.includes('boat')&&Math.abs(raw.x-seat.x)<.125&&Math.abs(raw.z-seat.z)<.14&&Math.abs(raw.y-seat.y)<.145;
      s.fit+=((capture?1:0)-s.fit)*(1-Math.exp(-dt*8));
      const i=s.held.indexOf('shore');
      if(i>=0&&k[i].jump&&!s.lastJump[i]){
        const tip=pose(g).b,dx=tip.x-seat.x,dz=tip.z-seat.z;
        if(!s.held.includes('boat'))s.feedback='请艇上先握住手柄，板子还会往回滑。';
        else if(Math.abs(dx)>.125)s.feedback=dx>0?'板头偏东。让艇上往左摆。':'板头偏西。让艇上往右摆。';
        else if(Math.abs(dz)>.14)s.feedback=dz>0?'销眼还没到，再送一点。':'销眼过了，让艇上往回收一点。';
        else if(Math.abs(tip.y-seat.y)>.15)s.feedback='板头悬着，等浪把它放到岸靴上。';
        else if(s.fit<.83||Math.hypot(dx,dz,tip.y-seat.y)>.023)s.feedback='板头正在顺着喇叭口落座。等销孔合圆再压。';
        else{s.locked=true;s.lockedAt=g.time;s.feedback='岸销落锁，可以松手过板。';}
        cue(s,s.locked?'board-lock':'board-knock');s.until=g.time+2.3;g.alert(s.feedback,2.3);
        if(s.locked)g.events.checkpoint?.(g);
      }
    }
    s.lastJump=k.map(v=>!!v.jump);footing(g);
  }
  function hint(g,i){
    const s=g.fenders.board;if(s.locked&&g.time-s.lockedAt<.85&&s.held[i])return '岸销扣住了。松手，板头会留在岸上。';
    if(!g.fenders.moored||s.locked||g.fenders.top[i]||g.fenders.seen.every(Boolean))return '';
    if(s.held[i]==='shore')return g.time<s.until?s.feedback:'看板头和岸靴的圆孔。叫同伴微调；贴稳石台时，按跳键落销。';
    if(s.held[i]==='boat')return '向前送板，向后收回。左右摆正板头。岸上的人落销前请握住。';
    if(near(g,i,'shore'))return '这里够得着岸销。可按住操作接板，等两只孔合拢再落销。';
    if(near(g,i,'boat'))return '艉侧有伸缩板。可按住手柄送同伴上岸，也可以从黄漆口起跳。';
    if(i&&!g.fenders.seen[i]&&g.players[i].ground===g.world.fenders.boats[0])return '从舵台靠岸一侧走向艇首，跳上短踏板；也可先到黄漆口替林澈送板。';
    if(!i&&!g.fenders.seen[i]&&g.players[i].ground===g.world.fenders.boats[1])return '绞轮在艇尾对岸。绕过前面的小电台，沿甲板走到黄色栏口。';
    return '';
  }
  function shot(g,i){
    const role=g.fenders.board.held[i];if(!role)return null;
    const {a,b}=pose(g);
    if(role==='boat')return {eye:[a.x+1.05,a.y+1.94,a.z+1.0],at:[(a.x+b.x)*.5-.06,(a.y+b.y)*.5+.03,(a.z+b.z)*.5-.32],fov:58};
    return {eye:[-2.60,-1.25,11.92],at:[-3.09,-2.30,13.33],fov:54};
  }
  function start(g){
    const s=g.fenders.board,w=g.world.fenders;
    s.crossing=true;g.checkpoints=[w.boats[1],w.boats[0]];
    const starts=[TideArrival.castSite,TideSternLine.rail];starts.forEach((at,i)=>{
      const p=g.players[i],v=onBoat(g,at.x,at.y,at.z);
      Object.assign(p,v,{ground:g.checkpoints[i],grounded:true,vx:0,vy:0,vz:0,speed:0});
      p.y=TideTraversal.surfaceHeight(p.ground,p.x,p.z);
    });
    footing(g);
  }
  function guard(g,i){
    // Stop a walking character at the shell of the real radio table or wheel console.
    const w=g.world.fenders,p=g.players[i];if(!w.floatPose.floors.includes(p.ground))return;
    const h=w.floatPose,v=TideFloating.local(h,p.x,p.y,p.z);let x=v.x+h.anchorX,z=v.z+h.anchorZ;
    for(const [x0,x1,z0,z1] of [[-.07,.77,16.16,16.85],[-5.40,-4.54,15.87,17.56]]){
      if(x<=x0||x>=x1||z<=z0||z>=z1)continue;
      const d=Math.min(x-x0,x1-x,z-z0,z1-z);
      if(d===x-x0)x=x0;else if(d===x1-x)x=x1;else if(d===z-z0)z=z0;else z=z1;
      Object.assign(p,onBoat(g,x,v.y+h.anchorY,z));
    }
  }
  function recordBank(g){
    const s=g.fenders.board,w=g.world.fenders;
    if(!s.crossing)return;
    const bank=g.players.map((p,i)=>p.ground===w.lower?'lower':p.ground===w.shelf?'shelf':p.ground===w.well?'well':w.floatPose.floors.includes(p.ground)?null:s.bank[i]);
    if(bank.some((b,i)=>b!==s.bank[i])){
      for(let i=0;i<2;i++)if(bank[i]!==s.bank[i]&&!g.fenders.top[i])
        g.checkpoints[i]=bank[i]?w[bank[i]]:g.players[i].ground;
      s.bank=bank;g.events.checkpoint?.(g);
    }
  }
  function save(g){
    const s=g.fenders.board;
    return s.crossing||s.locked?{crossing:s.crossing,locked:s.locked,extension:s.locked?s.extension:0,aim:s.locked?s.aim:.18,bank:s.bank.slice()}:null;
  }
  function restore(g,m){
    if(!m)return;
    const s=g.fenders.board,w=g.world.fenders;
    if(m.crossing)start(g);
    s.locked=m.locked===true;s.fit=s.locked?1:0;
    if(s.locked){
      s.extension=Number.isFinite(m.extension)?clamp(m.extension,0,1):.78;
      s.aim=Number.isFinite(m.aim)?clamp(m.aim,-.36,.36):0;
    }
    footing(g);
    for(let i=0;i<2;i++){const k=m.bank?.[i];if(!['lower','shelf','well'].includes(k))continue;
      s.bank[i]=k;g.checkpoints[i]=w[k];g.players[i]=TideFloating.spawn(w[k]);
      if(k==='lower'&&!i||k==='well'&&i)g.fenders.seen[i]=true;
    }
  }
  return {create,pose,footing,step,start,restore,save,near,hint,shot,guard,recordBank,handle,shore,seat};
})();
