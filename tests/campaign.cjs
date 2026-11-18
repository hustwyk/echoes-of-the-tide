// Exercise the shipping simulation solely via movement, jump and tool inputs.
// Run with node tests/campaign.cjs from any directory.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const box=vm.createContext({});
for(const name of ['missions','traversal','floating','warp-speech','warping','fender-speech','fenders','arrival-speech','arrival','passage','landfall-message','landfall','quay-speech','cablequay','rigging','drawbridge','fieldwork','lookout','cistern-speech','cistern','glass-speech','chartroom','paper','lantern','gallery-speech','gallery','transit-speech','transit','signal','tin-lines','tin-memory','archive','relay-speech','relay','soundings-speech','soundings','fog-speech','haul-speech','fog-recovery','fogsignal','pass-speech','lastpass','swing-speech','swing','cooperation']){
  vm.runInContext(fs.readFileSync(path.join(__dirname,'../dist',name+'.js'),'utf8'),box);
}
const {Session,near,surface,lookout,ridePressure,TideLantern,TideSignal,TideArchive,TideLandfall,TideCableQuay,TideRelay,TideSoundings,TideFogSignal,TideLastPass,TideSwing,TideCistern,TideGlass,TidePaper}=vm.runInContext('({Session:TideCoop.Session,near:TideCoop.near,surface:TideTraversal.surface,lookout:TideLookout,ridePressure:TideCoop.ridePressure,TideLantern,TideSignal,TideArchive,TideLandfall,TideCableQuay,TideRelay,TideSoundings,TideFogSignal,TideLastPass,TideSwing,TideCistern,TideGlass,TidePaper})',box);
const {TideFenders,TideWarping,TideFloating,TideArrival}=vm.runInContext('({TideFenders,TideWarping,TideFloating,TideArrival})',box);
const {TideTransit}=vm.runInContext('({TideTransit})',box);
const {TideTinMemory}=vm.runInContext('({TideTinMemory})',box);
const {TideGallery}=vm.runInContext('({TideGallery})',box);
const empty=()=>({x:0,z:0,use:false,jump:false});
function steer(g,i,target,keys){
  const p=g.players[i],dx=target.x-p.x,dz=target.z-p.z,dist=Math.hypot(dx,dz);
  if(dist<.22)return;
  keys.x=dx/Math.max(.8,dist);keys.z=dz/Math.max(.8,dist);
  // Brake in the air over a narrow landing when running on would overshoot it.
  if(!p.grounded&&p.vy<0){
    const landing=surface(g.world,p.x,p.z,p.y+.05);
    if(landing && p.y>landing.y+.04){
      const seconds=(p.vy+Math.sqrt(p.vy*p.vy+39*(p.y-landing.y)))/19.5;
      const end=surface(g.world,p.x+p.vx*(seconds+.08),p.z+p.vz*(seconds+.08),landing.y+.07);
      if(!end){keys.x=-p.vx*.15;keys.z=-p.vz*.15;return;}
    }
  }
  for(const reach of [.18,.42,.71,1.02,1.31]){
    if(dist<.20+reach)break;
    const next=surface(g.world,p.x+dx/dist*reach,p.z+dz/dist*reach,p.y+.5);
    if(!next || next.y>p.y+.37 || g.section.danger.includes(next)&&g.hazardPhase()>.51)keys.jump=p.grounded;
  }
  if(dist<3.6&&target.y-p.y>.5)keys.jump=p.grounded;
}
function routeTo(g,i,site,keys) {
  const sec=g.section,p=g.players[i];
  const branch=sec.field?.sites[i];
  if(branch && (p.x-branch.approach.x)*branch.sign>1.8 && Math.abs(p.z-branch.z)<2.2){
    steer(g,i,branch.approach,keys);return;
  }
  const deck=sec.paths[i].find(d=>d.active && p.z>d.z+.25);
  if(deck)steer(g,i,deck,keys);
  else if(p.z>sec.ends[i].z+.8)steer(g,i,sec.ends[i],keys);
  else steer(g,i,site,keys);
}
function aimScope(g,out){
    const w=g.watch,d=w.task.watcher,cam=lookout.camera(g);
    const target=w.task.targets[w.step],pos=lookout.point(g,target);
    const [dx,dy,dz]=pos.map((x,j)=>x-cam.eye[j]);
    const axis=n=>Math.max(-1,Math.min(1,n*13));
    out[d].x=axis(Math.atan2(dx,-dz)-cam.yaw);
    out[d].z=-axis(Math.atan2(dy,Math.hypot(dx,dz))-cam.pitch);
    out[d].jump=w.seen===target;out[1-d].jump=!!w.marked;
}
function signalInputs(g,out){
  const r=g.signal,w=g.world.signal,axis=v=>Math.max(-1,Math.min(1,v));
  for(let i=0;i<2;i++){
    const p=g.players[i],s=g.section.sites[i];
    if(i===0&&g.stage===2&&!r.pinned&&p.ground!==w.head){
      const at=TideSignal.local(p);
      let dest=TideSignal.point(0,.66,6.15);
      if(Math.abs(at.x)<.48||at.z<5.78){
        dest=r.angle>.39?w.shade:TideSignal.point(0,.66,5.96);
      }
      const dx=dest.x-p.x,dz=dest.z-p.z,k=Math.max(.6,Math.hypot(dx,dz));
      out[i].x=dx/k;out[i].z=dz/k;
      out[i].jump=r.walked&&p.grounded&&p.ground===w.bridge&&at.z<5.68-Math.cos(r.angle)*3.54;
    }else if(near(p,s))out[i].use=true;
    else steer(g,i,s,out[i]);
  }
  if(lookout.active(g)){if(out.every(k=>k.use))aimScope(g,out);return out;}
  if(TideTransit.active(g)){
    const delta=TideTransit.delta(TideTransit.camera(g),TideTransit.sources(g).shore);
    out[1].x=axis(-delta.x*32);out[1].z=axis(-delta.y*32);
    out[1].jump=r.observed&&!r.voice;
    if(out[0].use)out[0].z=r.tripReady?1:-1;
    return out;
  }
  if(g.stage===0){
    if(out[0].use)out[0].z=r.rpm<.66?(r.armed?1:-1):0;
    if(out[1].use){out[1].x=axis((r.rpm-r.trim)*8);out[1].jump=r.rpm>.55&&Math.abs(r.trim-r.rpm)<.09;}
  }else{
    if(g.stage===1&&out[0].use){out[0].x=axis((.68-r.trim)*9);out[0].jump=r.shutter===0&&r.rpm>.59&&r.rpm<.75;}
    if(g.stage===2&&!r.pinned){
      if(out[1].use)out[1].z=axis((.56-r.angle)*7);
      if(out[0].use)out[0].jump=r.onHead;
      return out;
    }
    if(g.stage===2&&out[0].use)out[0].z=1;
    if(out[1].use){
      out[1].jump=r.mic==='idle'&&(g.stage===1?r.glow>.86:r.closed&&r.glow<.06);
      if(r.mic==='sending'&&r.speech>=1||['readback','listening','receipt','answered'].includes(r.mic))out[1].use=false;
    }
  }
  return out;
}
function archiveInputs(g,out){
  if(TideTinMemory.active(g)){
    const m=g.archive.memory,sender=m.dir===1?0:1;
    const axis=n=>Math.max(-1,Math.min(1,n));
    if(m.phase==='playback'||m.phase==='home')return out;
    const give=out[sender],catcher=out[1-sender];
    give.use=true;catcher.use=true;
    give.z=-.46;give.jump=m.phase==='ready'&&m.age>.4;
    const flight=m.phase==='air'?Math.max(0,(m.vy+Math.sqrt(Math.max(0,m.vy*m.vy+19.62*(m.y-.713))))/9.81):.134;
    const endX=m.x+m.vx*flight,endZ=m.phase==='air'?m.z+m.vz*flight:.28+Math.max(.49,m.vz)*flight;
    catcher.x=axis((endX-m.catchX)*24);catcher.z=axis((endZ-m.catchZ)*24);
    return out;
  }
  const a=g.archive,roll=TideArchive.rolls[g.stage],sample=TideArchive.samples(g);
  const pin=roll.pins[Math.min(a.count,roll.pins.length-1)],lead=g.stage===2?1:0;
  for(let i=0;i<2;i++){
    const k=out[i],p=g.players[i],side=i?1:-1,site=g.section.sites[i];
    if(!TideArchive.near(g,i)){
      const far=a.location[i]!=='desks'&&p.z>-.10&&p.x*side<3.57;
      const behind=a.location[i]==='desks'&&p.z<1.39;
      steer(g,i,far?{x:side*3.84,y:0,z:2.05}:behind?{x:side*3.68,y:0,z:2.06}:site,k);
      continue;
    }
    if(a.keys){
      k.use=true;
      if(!i){k.x=a.keys.col<2?1:0;k.z=a.keys.row<2?1:0;k.jump=!a.keys.held&&a.keys.col===2&&a.keys.row===2;}
      else k.jump=a.keys.held;
      continue;
    }
    if(a.review!==null)continue;
    k.use=true;
    if(!a.sourceLoaded){k.jump=!a.mounted[i];continue;}
    if(a.count===roll.pins.length)continue;
    const diff=pin[0]-sample[i],axis=x=>Math.max(-1,Math.min(1,x));
    const mayPunch=i===lead?!a.pending:!!a.pending;
    if(i===0)k.x=Math.abs(diff)>.16?axis(diff*2.2):0;
    else{
      k.z=Math.abs(diff)>.16?-axis(diff*4):0;
      k.x=axis((pin[1]-a.tuning)*11);
    }
    k.jump=mayPunch&&Math.abs(diff)<.20&&(!i||Math.abs(a.tuning-pin[1])<.08);
  }
  return out;
}
const chainDirection=new WeakMap();
function landfallInputs(g,out){
  const a=g.landfall,w=g.world.landfall,o=w.origin,site=TideLandfall.targets(g);
  for(let i=0;i<2;i++){
    const p=g.players[i],k=out[i],z=p.z-o.z;
    if(TideLandfall.near(g,i)){k.use=true;continue;}
    let dest=site[i];
    // Approach the outer landing from either broken ladder; cross the shutter on its centre line.
    if(z>-.8)dest={x:o.x+(i?2.8:-3.1),y:o.y,z:o.z-1.05};
    else if(dest.z<o.z-8&&z>-8.5){
      dest={x:o.x+.23,y:o.y,z:o.z+(z>-6.17?-6.35:-8.9)};
    }
    steer(g,i,dest,k);
  }
  if(!a.pinned){
    if(out[0].use&&a.height<2.36)out[0].z=a.stroke>.985||chainDirection.get(g)&&a.stroke>.02?-1:1;
    chainDirection.set(g,out[0].z===-1);
    if(out[1].use)out[1].jump=Math.abs(a.height-2.35)<.15;
  }else{
    if(out[0].use)out[0].jump=!a.plugged;
    const pos=lookout.vessel(g,g.time),bearing=Math.atan2(pos[2]-w.loop.z,pos[0]-w.loop.x)+Math.PI;
    if(out[1].use&&!a.receiving)out[1].x=Math.max(-1,Math.min(1,(bearing-a.angle)*7));
  }
  return out;
}
function quayInputs(g,out){
  const a=g.cable,w=g.world.cableQuay,axis=x=>Math.max(-1,Math.min(1,x));
  const sites=g.stage===0?[w.key,w.posts[1]]:g.stage===1?[TideCableQuay.target(g,0),w.drum]:
    a.patched<0?[w.lamp,w.windows[2]]:[w.breaker,a.backTest?w.mic:w.windows[2]];
  for(let i=0;i<2;i++){
    const p=g.players[i],s=sites[i],k=out[i];
    if(TideCableQuay.near(g,i)&&TideCableQuay.target(g,i)===s){k.use=true;continue;}
    if(!i&&g.stage===1){
      const h=a.warp;
      if(h.returning&&(p.ground===w.float||s.kind==='warp'))continue;
      if(h.released&&p.ground===w.float){
        // Release the tool-confirm button before making a separate running jump.
        // Wait on the hull until the far apron is within a comfortable rising step.
        if(g.time-h.releasedAt<.18||p.vz>-.25&&w.saddles[1].y-p.y>.79)continue;
      }
    }
    let goal=s;
    for(const [fx,fy,fz,r] of w.fixtures){
      if(Math.abs(p.y-fy)>.9||p.z<fz-.24||p.z>fz+1.75||s.z>fz-.38)continue;
      if(Math.abs(p.x-fx)<r+.38)goal={x:fx+(i?.96:-.89),y:fy,z:fz-.35};
    }
    steer(g,i,goal,k);
  }
  if(g.stage===0){
    if(out[0].use)out[0].use=!a.signalled&&(!a.down||g.time-a.downAt<(a.presses.length?.62:.19));
    if(out[1].use)out[1].jump=a.survey[1];
  }else if(g.stage===1){
    if(out[1].use)out[1].z=axis((TideCableQuay.length(g)+.66-a.payout)*2.7);
    if(a.carried&&TideCableQuay.near(g,0)){
      const h=a.warp;out[0].use=true;
      if(TideWarping.needed(g)){
        out[0].jump=!h.clipped||h.phase==='far';
        if(h.clipped&&h.phase!=='far')out[0].z=h.stroke>=.988||h.stroke<h.purchase-.001?-1:1;
      }else out[0].jump=a.slack>.26&&a.slack<.95;
    }
  }else if(a.patched<0){
    if(out[0].use){out[0].x=axis((-28.9-a.scanZ)*4);out[0].z=axis((a.scanY-3.85)*4);}
    if(out[1].use)out[1].jump=a.exposed>=1;
  }else{
    if(!a.backTest){
      if(out[1].use)out[1].use=out[0].use&&(!a.returnDown||g.time-a.returnAt<(a.received.length?.64:.18));
      return out;
    }
    if(out[0].use)out[0].jump=!a.power;
    if(out[1].use){out[1].jump=a.radio==='idle'&&a.power;out[1].use=!['sent','reply'].includes(a.radio);}
  }
  return out;
}
function relayInputs(g,out){
  const r=g.relay,w=g.world.relay,p=g.players[0],axis=x=>Math.max(-1,Math.min(1,x));
  const dest=TideRelay.target(g,0),desk=TideRelay.target(g,1),s=desk.kind==='file'?w.files[1]:desk;
  if(r.climb||(!r.top&&dest===w.foot&&TideRelay.near(g,0))||dest===w.lift&&TideRelay.near(g,0)){
    out[0].use=true;out[0].z=-1;
  }else if(!r.top&&r.low&&p.y>1.25){
    if(p.ground===w.car||!p.grounded||r.travel<.06){
      steer(g,0,w.car,out[0]);out[0].jump=p.ground===w.lower&&r.travel<.06;
    }
  }else if(TideRelay.near(g,0))out[0].use=true;
  else steer(g,0,dest,out[0]);
  if(TideRelay.near(g,1)&&desk===s)out[1].use=true;
  else{
    const who=g.players[1],gap=TideRelay.point(4.08,0,.83);
    if(s===w.desk&&who.z>gap.z-.82&&who.z<gap.z+1.40&&Math.abs(who.x-gap.x)>.16)
      steer(g,1,{x:gap.x,y:0,z:who.z},out[1]);
    else steer(g,1,s,out[1]);
  }
  if(s===w.haul&&out[1].use)out[1].x=p.ground===w.car||r.boarded?1:-1;
  if(out[1].use&&(s.kind==='file'||s===w.desk&&!r.loaded))out[1].jump=true;
  if(!r.top)return out;
  if(lookout.active(g)){if(out.every(k=>k.use))aimScope(g,out);return out;}
  const b=TideRelay.bearing(g),wind=TideRelay.winds(g);
  if(out[0].use){out[0].x=axis((b.yaw-wind.yaw-r.yaw)*18);out[0].z=-axis((b.pitch-wind.pitch-r.pitch)*21);}
  if(g.stage===0){out[0].jump=r.loaded&&r.lock>=1&&!r.voice;}
  if(g.stage===1&&out[1].use){
    const next=r.mask.indexOf(false);
    if(next>=0){out[1].x=axis((next-r.cursor)*5);out[1].jump=Math.abs(next-r.cursor)<.25&&r.strength>.75;}
  }
  if(g.stage===2&&r.lock>=1&&!r.voice)out[r.signed[0]?1:0].jump=true;
  return out;
}
const surveyRoute=new WeakMap();
function surveyInputs(g,out){
  const r=g.survey,w=g.world.soundings,axis=x=>Math.max(-1,Math.min(1,x));
  const t=TideSoundings.target(g,0),p=g.players[0],other=TideSoundings.target(g,1);
  if(TideSoundings.near(g,1)){out[1].use=true;}else steer(g,1,other,out[1]);
  if(TideSoundings.near(g,0))out[0].use=true;
  else{
    const home=TideSoundings.point(-5.35,1.56,1.35),bottom=w.sill;
    const order=[home,bottom,w.floats[0],w.floats[1],w.piers[0],w.floats[2],w.piers[1]];
    const gettingOut=g.stage===2&&p.ground!==w.upper||g.stage===2&&p.z<TideSoundings.point(0,0,.4).z;
    const traverse=t.kind==='staff'&&r.carry||gettingOut,goalIndex=gettingOut?0:g.stage===1?6:4;
    let state=surveyRoute.get(g);
    if(!state||state.goal!==goalIndex||!traverse){
      const idx=order.indexOf(p.ground);
      state={goal:goalIndex,idx:Math.max(0,idx),jump:false};
      surveyRoute.set(g,state);
    }
    if(!traverse)steer(g,0,t,out[0]);
    else{
      if(!gettingOut&&state.idx===0&&p.ground===w.upper&&Math.hypot(p.x-home.x,p.z-home.z)<.42)state.idx=1;
      const at=order.indexOf(p.ground);
      if(at>=1){state.idx=at+(at===goalIndex?0:gettingOut?-1:1);}
      if(w.stairs.includes(p.ground))state.idx=gettingOut?0:1;
      const next=order[Math.max(0,Math.min(6,state.idx))];
      if(at===goalIndex)steer(g,0,t,out[0]);
      else{
        const dx=next.x-p.x,dz=next.z-p.z,len=Math.max(.68,Math.hypot(dx,dz));
        if(!(p.grounded&&at>=1&&next.y-p.y>.88&&!(gettingOut&&at===1))){
          out[0].x=dx/len;out[0].z=dz/len;
          out[0].jump=p.grounded&&at>=1&&at!==state.idx&&!(at===1&&gettingOut);
        }
      }
    }
  }
  if(g.stage<2){
    if(out[1].use){out[1].x=axis(-r.trim[0]*38);out[1].z=axis(r.trim[1]*38);}
    if(out[0].use&&r.mount!==g.stage){out[0].jump=true;return out;}
    if(r.mount!==g.stage)return out;
    const read=TideSoundings.wave(w.probes[g.stage],g.time),sight=TideSoundings.wave(w.marks[g.stage],g.time);
    if(out[0].use){out[0].z=axis((r.jaw-read.height)*14);out[0].jump=read.open&&Math.abs(r.jaw-read.height)<.135&&(g.stage===1||r.ticket?.id===read.id);}
    if(out[1].use)out[1].jump=sight.open&&Math.hypot(...r.trim)<.018&&(g.stage===0||r.ticket?.id===sight.id);
  }else if(out.every(k=>k.use)){
    if(lookout.active(g)){aimScope(g,out);}
    else{
      const p=TideSoundings.channels[1];
      out[0].x=axis((p.u-r.plot[0])*15);out[0].z=axis((p.v-r.plot[1])*15);
      out[0].jump=!r.fixed&&Math.hypot(p.u-r.plot[0],p.v-r.plot[1])<.046;
      out[1].jump=r.fixed&&!r.ack;
    }
  }
  return out;
}
function fogInputs(g,out){
  const r=g.fog,w=g.world.foghouse,p=g.players[0],clamp=n=>Math.max(-1,Math.min(1,n));
  function walk(i,site){
    const person=g.players[i];
    // Give the back of the cabinet room when walking from the seaward side.
    if(person.z<site.z-.28&&Math.abs(person.x-site.x)<1.32){
      out[i].x=1;return;
    }
    if(person.z<site.z+.08&&person.x>site.x+1.22){out[i].z=1;return;}
    steer(g,i,site,out[i]);
  }
  function jumpTo(q){
    const d=Math.hypot(q.x-p.x,q.z-p.z);
    out[0].x=(q.x-p.x)/Math.max(.75,d);out[0].z=(q.z-p.z)/Math.max(.75,d);
    out[0].jump=p.grounded&&p.ground!==q;
  }
  const right=TideFogSignal.target(g,1),left=TideFogSignal.target(g,0);
  if(TideFogSignal.near(g,1))out[1].use=true;else walk(1,right);
  if(r.mode==='transport'){
    const [a,b]=w.wheels,aboard=p.ground===a,bboard=p.ground===b;
    let stop=0;
    if(r.marks[1])stop=1;
    else if(r.marks[0])stop=bboard?.75:.50;
    else if(aboard)stop=.25;
    if(out[1].use)out[1].x=clamp((stop-r.travel)*14);
    if(r.key==='rack'){if(TideFogSignal.near(g,0))out[0].jump=out[0].use=true;else walk(0,w.rack);}
    else if(!r.marks[0]&&aboard||r.marks[0]&&!r.marks[1]&&bboard){
      out[0].use=true;out[0].jump=Math.abs(r.travel-stop)<.004&&Math.abs(out[1].x)<.08;
    }else if(r.marks[1]&&p.ground===w.outer){
      if(TideFogSignal.near(g,0))out[0].jump=out[0].use=true;else steer(g,0,w.drive,out[0]);
    }else if(r.marks[1]){if(r.travel>.982)jumpTo(w.outer);}
    else if(r.marks[0]){if(Math.abs(r.travel-.5)<.018)jumpTo(b);}
    else if(p.grounded&&p.z>w.rear.z-1.78){steer(g,0,{x:a.pivot.x,z:w.rear.z-1.84,y:w.rear.y},out[0]);}
    else if(r.travel<.032)jumpTo(a);
    return out;
  }
  if(TideFogSignal.near(g,0))out[0].use=true;else walk(0,left);
  if(r.mode==='edit'){
    const notch=r.stud?.69:.26;
    if(out[0].use)out[0].x=clamp((notch-r.service)*12);
    if(out[1].use){
      out[1].x=clamp((.98-r.gaps[r.stud])*12);
      out[1].jump=out[0].use&&Math.abs(notch-r.service)<.03&&r.gaps[r.stud]>.967;
    }
  }else{
    if(g.stage===2&&out[0].use)out[0].x=clamp((TideFogSignal.load(g)-r.balance)*11);
    if(r.mode==='ready')out[0].jump=out[0].use&&out[1].use&&!r.voice&&Math.abs(r.spin%1-.30)<.038&&TideFogSignal.wind(g)>.42;
    if(r.mode==='sending'&&out[1].use){
      const t=TideFogSignal.camTime(r),mark=TideFogSignal.slots(r)[r.trace.source.length];
      out[1].z=(r.down?g.time-r.opened<.212:Math.abs(t-mark)<.042)?-1:0;
    }
    if(['drain','aft','bridge'].includes(r.mode))out[1].use=false;
    if(r.mode==='ack')out[1].jump=out[1].use;
    if(r.mode==='spot'&&out[1].use){
      const c=TideFogSignal.cabin(g);
      out[1].x=clamp((c.base-c.yaw)*17);out[1].z=clamp((c.pitch-c.elev)*19);
      out[1].jump=r.fix>=1&&!r.voice;
    }
  }
  return out;
}
const cartRuns=new WeakMap();
function glassInputs(g,out){
  const r=g.glass,c=r.cart,axis=n=>Math.max(-1,Math.min(1,n)),wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
  for(let i=0;i<2;i++){
    const p=g.players[i],target=TideGlass.target(g,i),z=p.z-TideGlass.origin.z,x=p.x-TideGlass.origin.x;
    if(TideGlass.near(g,i)){out[i].use=true;continue;}
    let dest=target;
    // Pass through the open left end of the eastern drying rack.
    const tz=target.z-TideGlass.origin.z;
    if((z< -2.04&&tz> -1.2||z> -1.3&&tz< -2.4)&&x>1.03)dest=TideGlass.at(.83,z);
    else if(z> -2.49&&tz< -2.4&&target.x> TideGlass.origin.x+.8&&z< -1.25)dest=TideGlass.at(.83,-2.60);
    else if(z< -1.12&&tz> -1.12&&target.x>TideGlass.origin.x+1.2)dest=TideGlass.at(.83,-1.05);
    // Reach the desk along its ends, leaving room for the stowed plan cart.
    if(r.docked&&tz < -3.4&&Math.abs(x)<.89&&z> -3.60)dest=TideGlass.at(i?1.13:-1.13,z);
    const dx=dest.x-p.x,dz=dest.z-p.z,dist=Math.hypot(dx,dz);out[i].x=dx/Math.max(.75,dist);out[i].z=dz/Math.max(.75,dist);
  }
  if(r.phase==='cabinet'){
    if(out[0].use){out[0].x=1;out[0].z=r.keyed?1:0;}
    if(out[1].use){out[1].z=axis((r.lift-TideGlass.hookHeight(r))*16);out[1].jump=r.drawer>=.997;}
  }else if(r.phase==='cart'&&out.every(k=>k.use)){
    // Porters rotate in place at the tape ends, then push in parallel to the next bend.
    let plan=cartRuns.get(g);
    if(!plan){plan={i:r.leg===2?3:r.leg===1?1:0};cartRuns.set(g,plan);}
    const paths=[[2.22,3.52,-Math.PI/2],[2.22,-.08,0],[-.11,-.08,Math.PI/2],[-.11,-3.04,0]];
    const [x,z,a]=paths[plan.i],err=wrap(a-c.a),dist=(x-c.x)*(-Math.sin(a))+(z-c.z)*(-Math.cos(a));
    const turn=axis(err*3.0),speed=Math.abs(err)<.030?axis(dist*2.0):0;
    out[0].z=-axis(speed-turn);out[1].z=-axis(speed+turn);
    if(Math.abs(dist)<.055&&Math.abs(err)<.019&&plan.i<3)plan.i++;
    if(TideGlass.parked(c))out[0].jump=true;
  }else if(r.phase==='proof'){
    for(let i=0;i<2;i++)if(out[i].use&&!r.clipped[i]){
      const desired=i?0:2;out[i].x=axis((desired-r.slide[i])*10);out[i].jump=Math.abs(desired-r.slide[i])<.04;
    }
  }else if(r.phase==='desk'&&out.every(k=>k.use)){
    const p=g.paper,h=p.holder,reader=1-h,[dx,dy]=TidePaper.residual(p,p.pin);
    if(!p.pinned){out[h].x=axis(-dx*16);out[h].z=axis(dy*16);out[h].jump=Math.hypot(dx,dy)<.037;}
    else{out[reader].x=axis(p.angle*16);out[reader].z=axis((p.light-p.lightTarget)*16);out[reader].jump=p.revealed;}
  }else if(r.phase==='margin'){
    const b=TideGlass.bands[r.fragment];
    if(out[0].use)out[0].x=1;
    if(out[1].use){out[1].x=axis((b.x-r.beam)*17);out[1].z=axis((r.rake-b.rake)*17);out[1].jump=TideGlass.light(r,r.fragment)>.70&&out[0].use;}
  }else if(r.phase==='record'){
    for(let i=0;i<2;i++)if(out[i].use&&!r.signed[i]){const v=i?0:1;out[i].x=axis((v-r.entry[i])*15);out[i].jump=Math.abs(r.entry[i]-v)<.05;}
  }
  return out;
}
function cisternInputs(g,out){
  const s=g.cistern,w=g.world.cistern,axis=n=>Math.max(-1,Math.min(1,n));
  for(let i=0;i<2;i++){
    const k=out[i],p=g.players[i],t=TideCistern.target(g,i);
    if(TideCistern.near(g,i)){k.use=true;continue;}
    if(i&&g.stage===0&&s.phase==='board'&&p.ground!==w.raft&&s.water>1.00){steer(g,1,w.embark,k);continue;}
    if(!i&&g.stage===2&&s.phase==='drain'){
      if(s.ports===2)continue;
      if(s.ports===0&&s.well>.99||s.ports===1&&s.well>.55)continue;
    }
    if(!i&&g.stage===2&&p.z>w.bottom.z+1.78&&t.z<w.stairs[2].z-.45){steer(g,i,{x:w.stairs[2].x,y:w.bottom.y,z:w.bottom.z},k);continue;}
    if(i&&g.stage===1&&s.moored&&![w.gallery,w.lip].includes(p.ground)){
      steer(g,1,w.top,k);continue;
    }
    steer(g,i,t,k);
  }
  if(s.phase==='grate'){
    if(out[0].use)out[0].z=1;
    if(out[1].use){out[1].x=axis((s.cupX-s.hookX)*9);out[1].z=axis((s.cupZ-s.hookZ)*9);out[1].jump=!s.caught&&s.pressure<.24&&Math.hypot(s.hookX-s.cupX,s.hookZ-s.cupZ)<.16;}
  }else if(s.phase==='inspect'){
    if(out[0].use)out[0].x=axis((.82-s.water)*5-.28*s.flow);
    if(out[1].use){out[1].x=1;out[1].jump=s.cupTurn>.92;}
  }else if(g.stage<2){
    if(out[0].use)out[0].x=axis(((g.stage===0?.82:s.passed?2.50:.66)-s.water)*5-.28*s.flow);
    if(out[1].use){out[1].z=g.stage?-1:0;out[1].x=g.stage?axis(((s.passed?2.32:1.97)-s.raftX)*14):0;out[1].jump=g.stage?s.raftZ<-4.06&&Math.abs(s.deckY-2.85)<.13:Math.abs(s.deckY-1.18)<.16;}
  }else if(s.phase==='drain'){
    if(out[1].use)out[1].x=axis((TideCistern.stops[s.ports].open-s.bypass)*10);
    if(out[0].use)out[0].z=-1;
  }else if(s.phase==='cabinet'){
    if(out[0].use){out[0].z=1;out[0].jump=s.lid>.94;}
  }else{
    if(out[0].use)out[0].jump=s.tape==='carried'&&s.hoist<.03;
    if(out[1].use){out[1].z=s.tape==='carried'?1:-1;out[1].jump=s.tape==='basket'&&s.hoist>.98;}
  }
  return out;
}
function swingInputs(g,out){
  const w=g.world.swing,s=g.swing,c=g.section.tram,axis=n=>Math.max(-1,Math.min(1,n));
  for(let i=0;i<2;i++){
    const p=g.players[i],k=out[i],t=TideSwing.target(g,i);
    if(s.climb[i]||p.ground===w.net){
      if(s.climb[i]||Math.hypot(t.x-p.x,t.z-p.z)<.60){k.use=true;k.z=-1;}else steer(g,i,t,k);
      continue;
    }
    if(s.phase==='report'){
      if(p.ground===c.deck){
        const exitX=c.deck.x+(i?1.44:-1.44);
        steer(g,i,{x:exitX,y:c.deck.y,z:Math.abs(p.x-exitX)>.24?c.deck.z+.43:g.section.mid.z+.20},k);
      }else if(TideSwing.near(g,i)){k.use=true;k.z=i?-1:1;k.jump=i===1&&s.report>.95;}
      else steer(g,i,t,k);
      continue;
    }
    if(s.phase==='stow'){
      if(TideSwing.near(g,i)){k.use=true;k.z=i?1:-1;k.jump=i===1&&s.stow>.99;}
      else if(p.ground===c.deck&&p.z>c.deck.z-.29&&p.x>c.deck.x-1.15){steer(g,i,{x:c.deck.x-1.28,y:c.deck.y,z:c.deck.z+.30},k);}
      else steer(g,i,t,k);
      continue;
    }
    if(i!==s.rider){
      if(TideSwing.near(g,i)){
        k.use=true;k.x=axis(((s.occupied||s.flight?TideSwing.gateX:TideSwing.entryX[s.rider])-s.rail)*7.8-s.railV*.65);
      }else steer(g,i,t,k);
    }else if(s.occupied){
      k.z=s.omega<0?-1:1;
      k.jump=s.angle<-.55&&s.omega<-.55&&Math.abs(s.rail-TideSwing.gateX)<.37;
    }else if(s.flight){k.x=axis((w.land.x-p.x)*2-p.vx*.65);k.z=p.z>w.land.z?-.32:.95;}
    else{
      // Align on the existing pier before approaching its narrow maintenance jetty.
      if(Math.abs(p.x-t.x)>1&&p.z>t.z+.31)steer(g,i,{x:t.x,y:t.y,z:w.o.z-.66},k);
      else if(Math.hypot(t.x-p.x,t.z-p.z)>.24&&p.grounded)steer(g,i,t,k);
      else{k.use=true;k.jump=p.grounded&&s.latched&&Math.abs(s.rail-(p.x-w.o.x))<.39;}
    }
  }
  return out;
}
function fenderInputs(g,out){
  const s=g.fenders,w=g.world.fenders,[a,b]=g.players;
  const headOut=(i)=>{
    const p=g.players[i];
    if(p.z>8.4)steer(g,i,w.landing,out[i]);
    else if(p.z>7.2)steer(g,i,w.steps,out[i]);
    else steer(g,i,g.section.starts[0],out[i]);
  };
  if(s.top[0])headOut(0);
  else if(s.ladder>=1){
    if(s.onLadder||Math.hypot(a.x-TideFenders.ladder.x,a.z-TideFenders.ladder.z)<.83){out[0].use=true;out[0].z=-1;}
    else steer(g,0,TideFenders.ladder,out[0]);
  }else if(s.seen[0]&&Math.hypot(a.x-TideFenders.wheel.x,a.z-TideFenders.wheel.z)<.82){
    out[0].use=true;out[0].z=-1;
  }else steer(g,0,TideFenders.wheel,out[0]);
  if(s.ladder>=1)headOut(1);
  else if(s.top[1]){
    if(Math.hypot(b.x-TideFenders.pawl.x,b.z-TideFenders.pawl.z)<.8){out[1].use=true;out[1].z=1;}
    else steer(g,1,TideFenders.pawl,out[1]);
  }else if(!s.seen[1]){
    steer(g,1,b.z>14.33?w.shelf:w.well,out[1]);
  }else if(s.wall?.phase==='hold'){
    out[1].x=-s.wall.normalX;
    out[1].jump=s.wall.age>.025&&(!s.lastFace?s.setting>.88:true)&&!s.previousJump;
  }else if(s.lastFace)out[1].x=s.lastFace<0&&b.x<-.98?Math.max(-1,Math.min(1,(-1.72-b.x)*2-b.vx*.22)):s.lastFace;
  else if(b.z>11.35||b.z<9.55)steer(g,1,w.well,out[1]);
  else{
    out[1].x=-1;out[1].jump=b.grounded&&s.setting>.85;
  }
  return out;
}
function approachInputs(g,out){
  const a=g.arrival,h=g.world.fenders.floatPose,[radio,helm]=out;
  if(a.radio==='tune')radio.x=a.channel<12?1:a.channel>12?-1:0;
  if(a.radio==='wait')radio.use=true;
  if(a.radio==='test')radio.use=a.voice==='call';
  const gap=h.anchorX-a.x,angle=Math.atan2(a.z-h.anchorZ,Math.max(2.5,gap));
  helm.x=Math.max(-1,Math.min(1,(a.heading-Math.min(.53,angle))*3.7));
  helm.z=a.attached?0:-Math.max(-.55,Math.min(1,gap*.50));
  helm.use=a.attached;
  if(a.radio==='line'&&!a.attached){
    const end=TideArrival.cleat(g),target=TideFloating.local(h,end.x,end.y,end.z);
    const side=target.x+h.anchorX-TideArrival.castSite.x-a.lateral;
    const reach=TideArrival.castSite.z-h.anchorZ-target.z-a.reach;
    radio.x=Math.max(-1,Math.min(1,side*4));radio.z=Math.max(-1,Math.min(1,-reach*4));
    radio.use=(a.atBow||0)>.85&&Math.hypot(side,reach)<.32&&Math.abs(a.speed)<1.2;
  }
  if(a.attached)radio.use=true;
  return out;
}
function galleryInputs(g,out){
  const a=g.gallery,w=g.world.gallery,A=TideGallery;
  const on=(i,f)=>g.players[i].ground===f;
  const distance=(p,t)=>Math.hypot(t.x-p.x,t.z-p.z);
  function walk(i,to){
    const p=g.players[i],dx=to.x-p.x,dz=to.z-p.z,dist=Math.hypot(dx,dz);
    if(dist>.06){out[i].x=dx/Math.max(.36,dist);out[i].z=dz/Math.max(.36,dist);}
  }
  function grip(i,spot,direction){
    if(distance(g.players[i],spot)>.48)walk(i,spot);
    else {out[i].use=true;out[i].x=direction;}
  }
  function jump(i,from,to){
    const p=g.players[i];
    walk(i,to);
    if(on(i,from)){
      const gap=distance(p,to);
      out[i].jump=gap<3.58;out[i].jumpHeld=true;
    }else out[i].jumpHeld=true;
  }
  function wheel(i,target){
    const error=target-a.angle,drive=Math.max(-1,Math.min(1,(error-a.velocity*.20)*3.4));
    grip(i,w.controls[i],drive);
  }
  if(a.phase==='file'){
    for(let i=0;i<2;i++){
      if(distance(g.players[i],w.paper[i])>.48)walk(i,w.paper[i]);
      else out[i].use=i===1||a.insert<.98;
    }
    if(out[1].use){
      if(a.rail<.89)out[1].x=1;else out[1].z=-1;
    }
    return out;
  }
  if(a.phase==='out'){
    wheel(0,a.boarded?0:A.westAngle);
    if(on(1,w.west)&&a.angle<A.westAngle+.12||(!g.players[1].grounded&&a.angle<A.westAngle+.19))jump(1,w.west,w.car);
    else if(Math.abs(a.angle)<.085)jump(1,w.car,w.middle);
  }else if(a.phase==='return'||a.phase==='last'){
    wheel(1,a.phase==='last'?A.eastAngle:A.westAngle);
    if(on(0,w.east)){grip(0,w.latch,0);}
    else if(a.phase==='return'&&Math.abs(a.angle-A.westAngle)<.11)jump(0,w.west,w.car);
    else if(a.phase==='last'&&Math.abs(a.angle-A.eastAngle)<.10)jump(0,w.car,w.east);
  }else if(a.phase==='stairs'){
    if(a.opening<1)return out;
    for(let i=0;i<2;i++){
      const f=g.players[i].ground,st=w.stairs.indexOf(f);
      const pos=TideLantern.local(g.players[i]);
      if(a.arrived[i])continue;
      if(f===w.middle){
        const start=A.point(w.bridge[0],0,-w.bridge[0].d*.5);
        walk(i,distance(g.players[i],start)>.56?start:w.bridge[0]);
      }else if(f===w.bridge[0]){
        const end=A.point(w.bridge[0],0,w.bridge[0].d*.5);
        walk(i,distance(g.players[i],end)>.48?end:w.east);
      }
      else if(f===w.east)walk(i,w.stairs[2]);
      else if(st>=0&&st<9)walk(i,w.stairs[Math.min(9,st+3)]);
      else if(st===9)walk(i,w.landings[0]);
      else if(f===w.landings[0])walk(i,w.stairs[12]);
      else if(st>=10&&st<20)walk(i,w.stairs[Math.min(20,st+3)]);
      else if(st===20)walk(i,w.upper);
      else if(f===w.upper)walk(i,w.threshold);
      else if(f===w.threshold||pos.z<6.0)walk(i,TideLantern.coords(i?2.16:1.30,0,4.7));
    }
  }
  return out;
}
function control(g){
  const out=[empty(),empty()],sec=g.section,s=g.spec,q=g.state;
  if(TideGallery.active(g))return galleryInputs(g,out);
  if(g.arrival&&!g.arrival.done)return approachInputs(g,out);
  if(TideFenders.active(g))return fenderInputs(g,out);
  if(TideSwing.active(g))return swingInputs(g,out);
  if(g.cistern)return cisternInputs(g,out);
  if(g.glass)return glassInputs(g,out);
  if(g.fog)return fogInputs(g,out);
  if(g.survey)return surveyInputs(g,out);
  if(g.relay)return relayInputs(g,out);
  if(g.cable)return quayInputs(g,out);
  if(g.landfall)return landfallInputs(g,out);
  if(g.archive)return archiveInputs(g,out);
  if(g.signal)return signalInputs(g,out);
  if(g.optic){
    const o=g.optic,k=o.phase;
    for(let i=0;i<2;i++){
      const site=sec.sites[i],p=g.players[i];
      if(near(p,site)){out[i].use=true;continue;}
      // Walk around the central optic when crossing from the inside to the seaward apron.
      const {x:u,z:v}=TideLantern.local(p),{x:zu,z:zv}=TideLantern.local(site);
      const flank=(zu||u)<0?-2.3:2.3;
      if(Math.abs(u)<1.90&&v*zv<0){
        steer(g,i,TideLantern.coords(flank,0,v),out[i]);
      }else if(Math.abs(zu)<1.6&&v<2.3&&zv>2.3){
        const ux=u<0?-2.3:2.3;steer(g,i,TideLantern.coords(ux,0,2.65),out[i]);
      }else steer(g,i,site,out[i]);
    }
    if(o.mount&&!o.mount.done){
      const m=o.mount,angle=[.69,-.55,0][m.gate];if(out[0].use)out[0].z=-1;
      if(out[1].use)out[1].x=Math.max(-1,Math.min(1,(angle-m.angle)*12));return out;
    }
    if(out[o.op].use)out[o.op].x=Math.max(-1,Math.min(1,(o.settings.zero[k]-o.axes[k])*20));
    if(out[o.observer].use){
      const d=TideLantern.viewData(g);
      out[o.observer].z=Math.max(-1,Math.min(1,d.dy*8));out[o.observer].jump=o.stable>.28&&!o.tag;
    }
    out[o.op].jump=o.tag;return out;
  }
  if(!g.field.done){
    const f=g.field,job=sec.field,step=g.stage;
    for(let i=0;i<2;i++){
      const p=g.players[i],site=job.sites[i];
      if(near(p,site))out[i].use=true;
      else if(Math.abs(p.z-site.z)>.55 && Math.abs(p.x-site.approach.x)<3.4){
        const forward=p.z>site.z;
        const candidates=sec.paths[i].filter(d=>forward?d.z>site.z && d.z<p.z-.3:d.z<site.z && d.z>p.z+.3);
        steer(g,i,candidates.sort((a,b)=>forward?b.z-a.z:a.z-b.z)[0]||site.approach,out[i]);
      }else steer(g,i,site,out[i]);
    }
    if(out.every(o=>o.use)){
      const move=(i,v)=>{out[i].x=Math.max(-1,Math.min(1,(v-f.values[i])*25));};
      switch(s.type){
        case 'paper':move(0,.28+.16*step);out[1].jump=true;break;
        case 'radio':out[0].jump=true;move(1,(step+.5)/3);out[1].jump=true;break;
        case 'tide':out[1].jump=true;break;
        case 'optic':{const j=s.cross?1:0;move(j,[.28+.16*step,.74-.13*step][j]);out[1-j].jump=true;break;}
      }
    }
    return out;
  }
  if(s.type==='ride'){
    const d=s.driver,r=1-d,carrier=sec.ferry.deck;
    if(q.latch){
      if(q.returnGate||s.mode==='basket'&&!(g.index===0&&g.stage===1))routeTo(g,d,sec.ends[d],out[d]);
      if(q.returnGate===1 && g.players[d].z<=(sec.starts[d].z+sec.ends[d].z)/2+.65)out[d]=empty();
      if(near(g.players[r],sec.sites[r])){out[r].use=true;out[r].jump=true;}else steer(g,r,sec.sites[r],out[r]);
    }else if(sec.span){
      const b=sec.span;
      if(near(g.players[d],sec.sites[d]))out[d].use=true;
      else steer(g,d,sec.sites[d],out[d]);
      if(b.seated){
        if(b.landed&&near(g.players[r],sec.sites[r]))out[r].use=true;
        else {
          steer(g,r,b.landed?sec.sites[r]:b.lip,out[r]);
          if(b.lower&&!b.landed)out[r].use=true;
        }
      }else{
        const p=g.players[r],to=b.grip;
        if(p.ground===carrier&&Math.hypot(p.x-to.x,p.z-to.z)<.94){
          out[r].use=true;out[r].x=Math.max(-1,Math.min(1,(b.error||0)*1.6));out[r].jump=!!b.aligned;
        }else{
          const dx=to.x-p.x,dz=to.z-p.z,k=Math.max(.7,Math.hypot(dx,dz));out[r].x=dx/k;out[r].z=dz/k;if(b.lower&&p.ground===carrier)out[r].use=true;
        }
      }
    }else{
      if(!near(g.players[d],sec.sites[d]))steer(g,d,sec.sites[d],out[d]);else{out[d].use=true;out[d].x=Math.max(-1,Math.min(1,(ridePressure(s,q.ferry)-q.dials[d])*22));}
      if(s.mode==='raft'&&out[d].use){
        const delta=sec.rig.ledge.y-carrier.y;
        out[d].x=Math.max(-1,Math.min(1,delta*3.5));
      }
      if(s.mode==='basket'&&q.ferry>.52 && out[d].use){
        out[d].z=Math.max(-1,Math.min(1,(carrier.y-sec.rig.ledge.y)*3));
      }
      if(s.mode==='basket'&&!g.rig.lit&&g.players[r].ground===carrier){
        out[r].use=true;out[r].x=Math.max(-1,Math.min(1,((sec.rig.slot-1)*1.55-g.rig.aim)*9));
        out[r].jump=Math.abs((sec.rig.slot-1)*1.55-g.rig.aim)<.16;
      }else if(q.ferry>.96){
        if(g.rig&&!g.rig.landed){
          steer(g,r,sec.rig.ledge,out[r]);
          if(g.players[r].ground===carrier)out[r].jump=Math.abs(sec.rig.ledge.y-carrier.y)<.80;
        }else{
          steer(g,r,sec.sites[r],out[r]);if(g.players[r].ground===carrier)out[r].jump=true;
          if(near(g.players[r],sec.sites[r]))out[r].use=true;
        }
      }else {
        steer(g,r,carrier,out[r]);if(s.mode==='raft'&&g.players[r].ground===carrier)out[r].use=true;}
    }
    return out;
  }
  if(sec.tram){
    for(let i=0;i<2;i++){
      const p=g.players[i],site=sec.sites[i],c=sec.tram;
      if(p.ground!==c.deck){
        if(Math.abs(p.x-site.x)>1.6&&p.z>c.from.z+1.75)steer(g,i,{x:site.x,z:sec.starts[i].z,y:p.y},out[i]);
        else steer(g,i,site,out[i]);
      }else if(near(p,site))out[i].use=true;
      else steer(g,i,site,out[i]);
    }
    if(!out.every(k=>k.use))return out;
  }
  if(!sec.tram)for(let i=0;i<2;i++){
    if(!near(g.players[i],sec.sites[i]))routeTo(g,i,sec.sites[i],out[i]);
    else out[i].use=true;
  }
  const trim=(i,value)=>{if(out[i].use)out[i].x=Math.max(-1,Math.min(1,(value-q.dials[i])*24));};
  if(!out.every(k=>k.use))return out;
  if(lookout.active(g)){
    aimScope(g,out);
    return out;
  }
  switch(s.type){
    case 'paper':{
      const p=g.paper,h=p.holder,r=1-h,[x,y]=p.pin;
      const dx=p.offset[0]+Math.cos(p.angle)*x-Math.sin(p.angle)*y-x,dy=p.offset[1]+Math.sin(p.angle)*x+Math.cos(p.angle)*y-y;
      const axis=n=>Math.max(-1,Math.min(1,n*16));
      if(!p.pinned){out[h].x=axis(-dx);out[h].z=axis(dy);out[h].jump=Math.hypot(dx,dy)<.037;}
      else{out[r].x=axis(p.angle);out[r].z=axis(p.light-p.lightTarget);out[r].jump=p.revealed;}
      break;
    }
    case 'optic':
      for(let i=0;i<2;i++)trim(i,s.v[i]+(g.index===11?.095*Math.sin(g.time*.49+i):0));break;
    case 'radio':out[0].jump=q.received>0;trim(0,s.v[0]+Math.sin(g.time*.42)*.105);trim(1,(s.answer+.5)/3);
      out[1].jump=Math.floor(q.dials[1]*3)===s.answer && Math.abs(q.dials[0]-s.v[0]-Math.sin(g.time*.42)*.105)<.075;break;
    case 'tide':out[s.lead].jump=Math.abs(g.time%5/5-.74)<.08;out[1-s.lead].jump=g.time-q.readAt<.7;break;
    case 'post':trim(0,.5);out[1].jump=true;out[0].jump=g.time-q.mark<2;break;
    case 'rhythm':{
      const r=g.pilotHorn,axis=n=>Math.max(-1,Math.min(1,n));
      out[0].x=axis((TideFogSignal.load(g)-r.balance)*11);
      out[0].jump=r.mode==='ready'&&Math.abs(r.spin%1-.3)<.037&&TideFogSignal.wind(g)>.45;
      if(r.mode==='sending'){
        const t=TideFogSignal.camTime(r),slot=TideFogSignal.slots(r)[r.trace.source.length];
        out[1].z=(r.down?g.time-r.opened<.215:Math.abs(t-slot)<.046)?-1:0;
      }
      if(['drain','aft','bridge'].includes(r.mode))out[1].use=false;
      out[1].jump=r.mode==='ack';break;
    }
    case 'quiet':{
      const taps=q.taps||[],answer=q.answer||[];
      if(taps.length<3)out[0].jump=!taps.length||g.time-taps.at(-1)>(taps.length===1?.62:1.08);
      else out[1].jump=!answer.length||g.time-answer[0]>=taps[answer.length]-taps[0];break;
    }
    case 'release':{
      out[1].use=q.mode===0;
      const error=TideLastPass.bearing(g)-g.lastPass.wheel;
      out[0].x=Math.max(-1,Math.min(1,error*18));out[0].jump=g.lastPass.arrived&&Math.abs(error)<.043;break;
    }
  }
  return out;
}
function simulate(n){
  const g=new Session(n),step=1/60;
  const passed=new Set();
  for(let j=0;j<60*300 && !g.complete;j++){
    passed.add(g.stage);
    g.tick(step,control(g));
  }
  assert.ok(g.complete,'level '+(n+1)+' stalled: '+JSON.stringify({stage:g.stage,time:g.time,players:g.players.map(p=>[p.x,p.y,p.z]),state:g.state,targets:g.section.sites,falls:g.setbacks}));
  assert.equal(passed.size,3);return [n+1,Math.round(g.time),g.setbacks];
}
if(require.main===module)console.table(Array.from({length:12},(_,n)=>simulate(n)));
module.exports={simulate,control,Session};

if(require.main===module){
  // Neither role can replace the other. Exercise every opening with a missing partner.
  for(let n=0;n<12;n++)for(let missing=0;missing<2;missing++){
    const g=new Session(n);
    for(let j=0;j<60*30;j++){
      const inputs=control(g);inputs[missing]=empty();g.tick(1/60,inputs);
    }
    assert.equal(g.stage,0,'One operator cleared the introduction in '+(n+1));
  }
  // The rider's mark and basin height are real stops, including on a retry.
  const step=1/60;
  function reach(g,condition){
    for(let j=0;j<60*120&&!condition()&&!g.complete;j++)g.tick(step,control(g));
    assert.ok(condition(),'Did not reach checkpoint in chapter '+(g.index+1)+' stage '+g.stage);
  }
  {
    const readings=[-2.99,-3.18];
    const g=new Session(9);g.tideTicket=readings;TideGallery.begin(g);
    const w=g.world.gallery,a=g.gallery;
    assert.notEqual(a.ticket,readings);assert.deepEqual(Array.from(a.ticket),readings);
    // From a parked cradle, the rider alone cannot reach the opposite landing.
    for(let j=0;j<360;j++){const k=control(g);k[0]=empty();g.tick(step,k);}
    assert.equal(a.phase,'out');assert.equal(a.angle,TideGallery.westAngle);
    reach(g,()=>a.boarded);
    for(let j=0;j<16;j++){const k=control(g);k[0].use=true;k[0].x=1;g.tick(step,k);}
    const u=g.players[1],dx=u.x-w.car.x,dz=u.z-w.car.z;
    const side=dx*w.car.axes.ux+dz*w.car.axes.uz,across=dx*w.car.axes.vx+dz*w.car.axes.vz;
    for(let j=0;j<20;j++)g.tick(step,[{...empty(),use:true,x:1},empty()]);
    const moved=TideGallery.point(w.car,side,across);
    assert.ok(Math.hypot(u.x-moved.x,u.z-moved.z)<.015,'Rider must travel with the rotating grating');
    // Running off the outward edge catches this player and keeps the other at the handwheel.
    for(let j=0;j<180&&!g.setbacks;j++)g.tick(step,[empty(),{...empty(),x:w.car.axes.vx,z:w.car.axes.vz}]);
    assert.equal(g.setbacks,1);assert.ok(a.arrests[1]&&!u.grounded);
    for(let j=0;j<150&&a.arrests[1];j++)g.tick(step,[empty(),{...empty(),use:true}]);
    assert.equal(u.ground,w.west);assert.equal(g.players[0].ground,w.west);
    reach(g,()=>a.phase==='return');
    const reverse=TideGallery.checkpoint(g);assert.equal(reverse.gallery,'middle');
    const back=new Session(9);TideGallery.begin(back,reverse);
    assert.equal(back.players[1].ground,back.world.gallery.middle);assert.deepEqual(Array.from(back.gallery.ticket),readings);
    for(let j=0;j<250;j++){const k=control(back);k[1]=empty();back.tick(step,k);}
    assert.equal(back.gallery.phase,'return');assert.equal(back.gallery.angle,0);
    reach(g,()=>a.phase==='stairs');assert.ok(!w.bridge[0].active);
    reach(g,()=>w.bridge[0].active);assert.equal(a.opening,1);
    reach(g,()=>a.phase==='file');
    const card=new Session(9);TideGallery.begin(card,TideGallery.checkpoint(g));
    const s=card.gallery;reach(card,()=>s.grip.every(Boolean));
    for(let j=0;j<80;j++)card.tick(step,[empty(),{...empty(),use:true,x:-1,z:-1}]);
    assert.equal(s.insert,0,'Shut clip must prevent insertion');
    for(let j=0;j<170;j++)card.tick(step,[{...empty(),use:true},{...empty(),use:true,x:-1,z:-1}]);
    assert.equal(s.insert,1);assert.equal(s.rail,-1);
    card.tick(step,[empty(),empty()]);assert.ok(s.rejected&&s.phase==='file');
    for(let j=0;j<130;j++)card.tick(step,[{...empty(),use:true},{...empty(),use:true,z:1}]);
    assert.equal(s.insert,0);assert.ok(!s.rejected);
    reach(card,()=>s.phase==='done');assert.equal(s.rail,1);assert.equal(TideGallery.checkpoint(card).gallery,'inside');
    assert.equal(TideGallery.validTicket([23,null]),null);
    const old=new Session(9);TideGallery.begin(old,{gallery:'file'});
    assert.equal(old.gallery.ticket,null);reach(old,()=>old.gallery.phase==='done');
  }
  {
    const g=new Session(0);
    TideArrival.begin(g);
    const a=g.arrival;
    const idle=()=>[empty(),empty()];
    function run(frames,inputs){
      for(let j=0;j<frames;j++)g.tick(step,inputs());
    }
    function withoutPilot(){const input=control(g);input[1]=empty();return input;}
    // The pilot can reach the quay before anyone hears the distress call.
    const solo=new Session(0);TideArrival.begin(solo);
    for(let j=0;j<60*16;j++){const input=control(solo);input[0]=empty();solo.tick(step,input);}
    assert.equal(solo.arrival.channel,9);assert.equal(solo.arrival.radio,'tune');
    assert.equal(TideFenders.checkpoint(solo),null);

    for(let j=0;j<900&&a.radio!=='wait';j++)g.tick(step,withoutPilot());
    assert.equal(a.radio,'wait');
    g.tick(step,[{...empty(),use:true},empty()]);g.tick(step,idle());
    assert.equal(a.radio,'wait');assert.match(a.warning,/松键太早/);
    for(let j=0;j<600&&(a.atBow||0)<1;j++)g.tick(step,withoutPilot());
    assert.equal(a.radio,'line');assert.equal(a.atBow,1);
    g.tick(step,[{...empty(),use:true},empty()]);assert.equal(a.flight.hit,false);
    run(75,idle);assert.equal(a.attached,false);assert.match(a.warning,/落空/);

    // Stage a physically aligned cast with too much headway.
    const h=g.world.fenders.floatPose;
    a.x=h.anchorX;a.z=h.anchorZ;a.heading=0;a.speed=1.9;g.tick(step,idle());
    const end=TideArrival.cleat(g),local=TideFloating.local(h,end.x,end.y,end.z);
    a.lateral=local.x+h.anchorX-TideArrival.castSite.x;
    a.reach=TideArrival.castSite.z-h.anchorZ-local.z;
    g.tick(step,[{...empty(),use:true},empty()]);assert.ok(a.flight.fast&&!a.flight.hit);
    run(75,idle);assert.match(a.warning,/收油/);
    reach(g,()=>a.attached);
    run(150,()=>[{...empty(),use:true},empty()]);
    assert.ok(!a.secured&&!a.moored);
    run(150,()=>[empty(),{...empty(),use:true}]);
    assert.ok(a.secured&&!a.moored&&a.haul===0);
    reach(g,()=>a.done);
    assert.equal(TideFenders.checkpoint(g).berth,'moored');
    assert.ok(g.players.every(p=>p.grounded));
    const restored=new Session(0);TideFenders.restore(restored,TideFenders.checkpoint(g));
    assert.ok(restored.fenders.moored&&!TideArrival.active(restored));
  }
  {
    const g=new Session(0),s=g.fenders;
    reach(g,()=>s.wall?.phase==='hold'&&s.wall.normalX===1);
    const entry=g.players[1].y,crank=g.players[0];
    // A held jump cannot fire repeated kicks. The first kick requires a new press.
    for(let j=0;j<5;j++){const k=control(g);k[1].jump=false;k[1].jumpHeld=true;g.tick(step,k);}
    assert.equal(s.wall.phase,'hold');assert.ok(g.players[1].y<=entry+.01);
    reach(g,()=>s.wall?.phase==='hold'&&s.wall.normalX===-1);assert.equal(s.kicks,1);
    assert.ok(s.setting>.65);assert.ok(Math.abs(g.players[1].x-(s.fenderX-.28))<.03);
    reach(g,()=>s.top[1]);assert.ok(!s.top[0]);
    const upper=TideFenders.checkpoint(g);assert.equal(upper.berth,'upper');
    const saved=new Session(0);TideFenders.restore(saved,upper);
    assert.equal(saved.players[1].ground,saved.world.fenders.ledge);
    assert.equal(saved.players[0].ground,saved.world.fenders.lower);
    const upperFalls=saved.setbacks;
    for(let j=0;j<180&&saved.setbacks===upperFalls;j++)saved.tick(step,[empty(),{...empty(),x:1}]);
    assert.equal(saved.setbacks,upperFalls+1);assert.equal(saved.players[1].ground,saved.world.fenders.ledge);
    reach(g,()=>s.onLadder&&g.players[0].y>-1.12);
    const y=crank.y;
    for(let j=0;j<40;j++)g.tick(step,[empty(),empty()]);
    assert.equal(crank.y,y);assert.equal(s.ladder,1);assert.ok(!s.top[0]);
    reach(g,()=>s.phase==='done');assert.equal(g.stage,0);assert.equal(g.state.ferry,0);
    const docked=new Session(0);TideFenders.restore(docked,TideFenders.checkpoint(g));
    assert.equal(TideFenders.active(docked),false);reach(docked,()=>docked.stage===1);
    const solo=new Session(0);
    reach(solo,()=>solo.fenders.seen[1]);
    for(let j=0;j<500;j++){
      const a=control(solo);a[0]=empty();
      a[1].x=-1;a[1].jump=solo.players[1].grounded||solo.fenders.wall?.phase==='hold'&&j%5===0;
      solo.tick(step,a);
    }
    assert.ok(!solo.fenders.top[1]&&solo.fenders.setting===0);
    // Run straight over the seaward edge while the other player keeps the winch tension.
    const drop=new Session(0);reach(drop,()=>drop.fenders.seen[1]&&drop.fenders.setting>.70);
    const other=drop.players[0],sideX=other.x,falls=drop.setbacks;
    for(let j=0;j<240&&drop.setbacks===falls;j++)drop.tick(step,[{...empty(),use:true,z:-1},{...empty(),z:-1}]);
    assert.equal(drop.setbacks,falls+1);assert.equal(drop.players[1].ground,drop.world.fenders.well);
    assert.ok(Math.abs(other.x-sideX)<.1&&drop.fenders.setting>.7);
  }
  {
    const g=new Session(10),r=g.fog,w=g.world.foghouse;
    reach(g,()=>g.players[0].ground===w.wheels[0]&&Math.abs(r.travel-.25)<.04);
    for(let j=0;j<25;j++){
      const k=control(g);k[0].use=k[0].jump=true;k[1].use=false;
      g.tick(step,k);assert.equal(r.marks[0],false);
    }
    reach(g,()=>r.marks[0]);const travelSave=TideFogSignal.checkpoint(g);
    const back=new Session(10);TideFogSignal.restore(back,travelSave);
    assert.equal(back.players[0].ground,back.world.foghouse.wheels[0]);
    for(let j=0;j<240&&!g.setbacks;j++)g.tick(step,[{...empty(),x:-1},empty()]);
    assert.equal(g.setbacks,1);assert.equal(r.haul.phase,'catch');assert.equal(g.players[0].ground,null);
    const midFall=TideFogSignal.checkpoint(g),fromPit=new Session(10);
    TideFogSignal.restore(fromPit,midFall);
    assert.equal(fromPit.fog.haul,null);assert.equal(fromPit.players[0].ground,fromPit.world.foghouse.wheels[0]);
    const phases=new Set();
    for(let n=0;n<600&&r.haul;n++){phases.add(r.haul.phase);g.tick(step,[empty(),empty()]);}
    assert.ok(phases.has('wait')&&phases.has('rewind'));assert.equal(r.haul,null);
    assert.equal(g.players[0].ground,w.wheels[0]);assert.deepEqual(Array.from(r.marks),[true,false]);
    // Walk past the next wheel with the verified key. Neither person alone can hoist the rider.
    for(let n=0;n<130&&!r.haul;n++)g.tick(step,[{...empty(),z:-1},{...empty(),use:true}]);
    assert.equal(r.haul.wheel,1);assert.equal(g.setbacks,2);
    const h=r.haul,brake=((Math.PI-h.bearing)/(Math.PI*2)+1)%1;
    for(let n=0;n<160;n++)g.tick(step,[{...empty(),use:true,z:-1},empty()]);
    assert.equal(h.phase,'wait');
    for(let n=0;n<260&&(h.gap>.08||h.braked<.14);n++)
      g.tick(step,[empty(),{...empty(),use:true,x:Math.max(-1,Math.min(1,(brake-r.travel)*12))}]);
    assert.ok(h.gap<.10&&h.braked>=.14);
    for(let n=0;n<35;n++)g.tick(step,[{...empty(),use:true,z:-1},empty()]);
    assert.equal(h.phase,'wait');
    for(let n=0;n<40;n++)g.tick(step,[{...empty(),use:true},{...empty(),use:true}]);
    assert.equal(h.phase,'climb');assert.equal(h.pull,0);
    const locked=r.travel;
    for(let n=0;n<90&&r.haul;n++)g.tick(step,[{...empty(),use:true,z:-1},{...empty(),x:1,use:true}]);
    assert.equal(r.travel,locked);assert.equal(r.haul,null);assert.equal(g.players[0].ground,w.wheels[1]);
    assert.equal(r.voice,'aboard');assert.deepEqual(Array.from(r.marks),[true,false]);
    reach(g,()=>r.mode==='sending'&&r.down);
    g.tick(step,[{...empty(),use:true},{...empty(),use:true}]);
    assert.equal(r.mode,'ready');assert.equal(r.trace.source.length,0);
    reach(g,()=>r.mode==='sending'&&r.down);
    for(let j=0;j<32;j++)g.tick(step,[{...empty(),use:true},{...empty(),use:true,z:-1}]);
    assert.equal(r.mode,'ready');
    reach(g,()=>r.mode==='drain');
    for(let j=0;j<150;j++)g.tick(step,[{...empty(),use:true},{...empty(),use:true}]);
    assert.equal(r.mode,'drain');assert.equal(r.showAft,false);assert.equal(r.showBridge,false);
    assert.deepEqual(Array.from(r.trace.aft),Array.from(r.trace.source));
    assert.deepEqual(Array.from(r.trace.bridge),[r.trace.source[0],r.trace.source[2]]);
    reach(g,()=>r.mode==='ack');
    const received=TideFogSignal.checkpoint(g),again=new Session(10);
    TideFogSignal.restore(again,received);assert.equal(again.fog.trace.bridge.length,2);
    reach(g,()=>g.stage===1&&r.stud===1);
    const change=TideFogSignal.checkpoint(g),editor=new Session(10);editor.stage=1;editor.begin();
    TideFogSignal.restore(editor,change);assert.ok(editor.fog.locks[0]&&!editor.fog.locks[1]);
    assert.equal(editor.fog.gaps[0],r.gaps[0]);
    // Keep the old spacing on the third tooth, then send once with that assembly.
    let finalGapReport=false;
    for(let j=0;j<2000&&r.mode!=='ack';j++){
      if(r.voice==='last')finalGapReport=true;
      const k=control(g);
      if(r.mode==='edit'&&r.stud===1&&TideFogSignal.near(g,1)){k[1].x=0;k[1].jump=Math.abs(r.service-.69)<.03;}
      g.tick(step,k);
    }
    assert.equal(r.mode,'ack');assert.equal(r.trace.bridge.length,2);assert.ok(finalGapReport);
    reach(g,()=>r.mode==='edit');assert.equal(r.paper.bridge.length,2);
    reach(g,()=>g.stage===2&&r.mode==='spot'&&!r.voice);
    for(let j=0;j<180;j++){
      g.tick(step,[empty(),{...empty(),use:true,jump:true}]);assert.equal(r.seen,false);
    }
    reach(g,()=>r.fix>.90);assert.ok(r.storm<.23);
    reach(g,()=>r.seen);const last=TideFogSignal.checkpoint(g),look=new Session(10);look.stage=2;look.begin();
    TideFogSignal.restore(look,last);assert.equal(look.fog.voice,'seen');reach(look,()=>look.complete);
  }
  // A wave is identified at two different positions. A matching-looking trough one period later
  // must be rejected. The value recorded on the log sheet is the player's actual brass slider.
  {
    // A point follows the selected wave phase toward shore. A solid surface
    // nearer than the visible sea must prevent a mark passing through it.
    const shore=new Session(8),eye=TideSoundings.point(-2,4,-14);
    const mark=TideSoundings.pickWave(shore,eye,{x:0,y:-1,z:0},20);
    assert.ok(mark);assert.equal(TideSoundings.pickWave(shore,eye,{x:0,y:1,z:0},70),null);
    assert.equal(TideSoundings.pickWave(shore,eye,{x:0,y:-1,z:0},2),null);
    const stage=shore.stage,m0=TideSoundings.phase(mark.x,mark.z,shore.time);
    for(let j=0;j<75;j++)shore.tick(step,[empty(),empty()]);
    const pos={};TideSoundings.wavePosition(shore,mark,pos);
    assert.ok(pos.z>mark.z+5&&Math.abs(TideSoundings.phase(pos.x,pos.z,shore.time)-m0)<1e-10);
    assert.equal(pos.y,TideSoundings.surface(pos.x,pos.z,shore.time));assert.equal(shore.stage,stage);
    const g=new Session(8),r=g.survey,w=g.world.soundings;
    reach(g,()=>r.taken&&r.safeLand===1);
    const saved=TideSoundings.checkpoint(g),landing=new Session(8);TideSoundings.restore(landing,saved);
    assert.ok(landing.survey.carry&&landing.players[0].ground===landing.world.soundings.sill);
    reach(g,()=>g.players[0].ground===w.floats[0]);
    const f=w.floats[0];assert.ok(Math.abs(f.y-TideSoundings.surface(f.anchor.x,f.anchor.z,g.time)-.82)<.025);
    for(let j=0;j<280&&g.setbacks===0;j++)g.tick(step,[{...empty(),z:-1},empty()]);
    assert.ok(g.setbacks>0&&r.carry&&r.mount===-1);reach(g,()=>r.ticket?.from===1);
    const first=r.ticket.id;
    for(let j=0;j<700;j++){
      const k=control(g);k[1].jump=false;k[0].z=1;
      k[0].jump=TideSoundings.wave(w.probes[0],g.time).open;g.tick(step,k);
      if(TideSoundings.wave(w.probes[0],g.time).id>first&&TideSoundings.wave(w.probes[0],g.time).open)break;
    }
    assert.equal(r.ticket,null);assert.equal(r.readings[0],null);
    reach(g,()=>r.readings[0]!==null);assert.equal(r.readings[0],r.jaw);
    reach(g,()=>g.stage===1&&r.mount===1&&r.ticket?.from===0);const b=r.ticket.height;
    reach(g,()=>r.readings[1]!==null);assert.equal(r.readings[1],b);
    reach(g,()=>g.stage===2&&!r.ashore);const outer=new Session(8);outer.stage=2;outer.begin();TideSoundings.restore(outer,TideSoundings.checkpoint(g));
    assert.equal(outer.players[0].ground,outer.world.soundings.piers[1]);
    reach(g,()=>g.watch?.step===1);const deck=TideSoundings.checkpoint(g);assert.equal(deck.watch,1);assert.ok(deck.ashore);
    const onboard=new Session(8);onboard.stage=2;onboard.begin();TideSoundings.restore(onboard,deck);
    assert.ok(onboard.survey.ashore&&onboard.watch.step===1);
    reach(onboard,()=>onboard.watch.done);assert.ok(onboard.survey.sight);
    const shallow=TideSoundings.channels[0],plot=onboard.survey.plot;
    for(let j=0;j<160;j++){
      const k=control(onboard);k[0].x=Math.max(-1,Math.min(1,(shallow.u-plot[0])*14));k[0].z=Math.max(-1,Math.min(1,(shallow.v-plot[1])*14));
      k[0].jump=Math.hypot(shallow.u-plot[0],shallow.v-plot[1])<.035;onboard.tick(step,k);
    }
    assert.ok(!onboard.survey.fixed&&!onboard.complete&&onboard.notice.includes('余量不足'));
    reach(onboard,()=>onboard.survey.fixed);const pinned=new Session(8);pinned.stage=2;pinned.begin();TideSoundings.restore(pinned,TideSoundings.checkpoint(onboard));
    assert.ok(pinned.survey.fixed&&pinned.survey.sight);
    for(let j=0;j<220;j++){const k=control(pinned);k[1].jump=false;pinned.tick(step,k);}
    assert.ok(!pinned.complete&&!pinned.survey.ack);
    reach(pinned,()=>pinned.complete);assert.ok(pinned.survey.ack);
  }
  // The crew can lose exactly the negative in the second strip. Accepted words and
  // individual signatures must survive returning to the title screen mid-report.
  {
    const g=new Session(7),r=g.relay,w=g.world.relay;
    reach(g,()=>r.low);assert.equal(g.players[0].ground,w.lower);
    const lowerSave=TideRelay.checkpoint(g),lower=new Session(7);TideRelay.restore(lower,lowerSave);
    assert.equal(lower.players[0].ground,lower.world.relay.lower);
    reach(lower,()=>lower.players[0].ground===lower.world.relay.car);
    reach(g,()=>r.top||r.climb==='upper');
    for(let j=0;j<600&&r.file<0;j++){
      const k=control(g);k[1]=empty();const file=w.files[0];
      if(TideRelay.near(g,1)&&TideRelay.target(g,1)===file){k[1].use=k[1].jump=true;}
      else steer(g,1,file,k[1]);
      g.tick(step,k);
    }
    assert.equal(r.file,0);reach(g,()=>r.rejected);assert.equal(r.loaded,false);
    reach(g,()=>g.stage===1&&r.voice==='word4');
    for(let j=0;j<240&&r.voice!=='missing';j++){
      const k=control(g);if(r.voice==='word4')k[0].use=false;g.tick(step,k);
    }
    assert.equal(r.voice,'missing');assert.equal(r.mask.map(Number).join(''),'111101');
    const copy=TideRelay.checkpoint(g),again=new Session(7);again.stage=1;again.begin();TideRelay.restore(again,copy);
    assert.equal(again.relay.mask.map(Number).join(''),'111101');assert.ok(again.relay.tried.every(Boolean));assert.ok(again.watch.done);
    reach(again,()=>again.relay.voice==='word4');assert.equal(again.relay.message.length,1);
    reach(again,()=>again.relay.voice==='carback');assert.ok(again.relay.mask.every(Boolean));
    reach(again,()=>again.stage===2&&again.relay.lock>=1);
    for(let i=0;i<50;i++){const k=control(again);k[0].jump=false;k[1].jump=true;again.tick(step,k);}
    assert.equal(again.relay.voice,'');assert.equal(again.relay.signed[0],false);
    reach(again,()=>again.relay.signed[0]);const saved=TideRelay.checkpoint(again);
    const sign=new Session(7);sign.stage=2;sign.begin();TideRelay.restore(sign,saved);
    assert.equal(sign.relay.signed.map(Number).join(''),'10');
    for(let j=0;j<60;j++){const k=control(sign);k[0].jump=true;k[1].jump=false;sign.tick(step,k);}
    assert.equal(sign.relay.voice,'');assert.equal(sign.relay.signed[1],false);
    reach(sign,()=>sign.complete);assert.equal(sign.relay.signed.map(Number).join(''),'11');
  }
  // Each head is independent. A stationary key, unpaired punch or mismatched
  // reply cannot register tape. A correct grease mark survives winding and reload.
  const recorder=new Session(4);
  reach(recorder,()=>recorder.engaged.every(Boolean));
  const press=(side,jump=false)=>[0,1].map(i=>({...empty(),use:true,jump:i===side&&jump}));
  for(let n=0;n<240;n++)recorder.tick(step,press(-1,true));
  assert.equal(recorder.archive.count,0);
  function shuttle(g,side,to,tune,commit=false){
    const r=g.archive,axis=n=>Math.max(-1,Math.min(1,n));
    for(let n=0;n<3000;n++){
      const pos=TideArchive.samples(g)[side],diff=to-pos,k=press(-1);
      if(!side)k[0].x=Math.abs(diff)>.11?axis(diff*2.2):0;
      else{k[1].z=Math.abs(diff)>.11?-axis(diff*3.5):0;k[1].x=axis((tune-r.tuning)*10);}
      if(Math.abs(diff)<.14&&(!side||Math.abs(tune-r.tuning)<.025)){
        k[side].jump=commit;g.tick(step,k);return;
      }
      g.tick(step,k);
    }
    assert.fail('Tape head failed to find requested event.');
  }
  shuttle(recorder,1,3,.49,true);assert.equal(recorder.archive.count,0);
  shuttle(recorder,0,3,0,true);assert.equal(recorder.archive.pending.index,0);
  shuttle(recorder,1,9.4,.53,true);assert.equal(recorder.archive.pending,null);assert.equal(recorder.archive.count,0);
  reach(recorder,()=>recorder.archive.count===1);
  const grease=TideArchive.checkpoint(recorder),savedTape=new Session(4);TideArchive.restore(savedTape,grease);
  assert.equal(savedTape.archive.count,1);
  reach(savedTape,()=>TideTinMemory.active(savedTape));
  const table=savedTape.archive.memory;
  // The same release reaches the bare worktop when the catcher leaves the tin down.
  const old=t=>[t,empty()];
  for(let j=0;j<420&&table.phase!=='miss';j++)
    savedTape.tick(step,old({...empty(),use:true,z:-.63,jump:table.phase==='ready'}));
  assert.equal(table.phase,'miss');assert.equal(table.takes.length,0);
  assert.ok(table.events.some(e=>e.type==='wood')&&!table.events.some(e=>e.type==='tin'));
  reach(savedTape,()=>table.count===1);
  const originalTake=JSON.parse(JSON.stringify(table.takes[0]));
  const memoryMark=TideArchive.checkpoint(savedTape),childCopy=new Session(4);
  TideArchive.restore(childCopy,memoryMark);
  assert.equal(childCopy.archive.memory.dir,-1);
  assert.deepEqual(JSON.parse(JSON.stringify(childCopy.archive.memory.takes[0])),originalTake);
  // First sender cannot release the second screw from the opposite child's hand.
  for(let j=0;j<100;j++)childCopy.tick(step,old({...empty(),use:true,jump:true}));
  assert.equal(childCopy.archive.memory.attempts,0);
  reach(childCopy,()=>childCopy.archive.memory.phase==='playback');
  const copy=childCopy.archive.memory;
  for(let j=0;j<470;j++)childCopy.tick(step,[{...empty(),use:true},empty()]);
  assert.ok(copy.replay<0&&!copy.events.some(e=>e.replay));
  reach(childCopy,()=>copy.cursor===copy.heard.length&&copy.replay>0);
  assert.deepEqual(Array.from(copy.events.filter(e=>e.replay),e=>[e.type,e.gain,e.pan]),
    Array.from(copy.heard,([,id,gain,pan])=>[id,gain,pan]));
  assert.equal(copy.events.filter(e=>e.replay&&e.type==='tin').length,2);
  reach(savedTape,()=>savedTape.stage===1&&savedTape.archive.fetched.some(Boolean));
  const packed=TideArchive.checkpoint(savedTape),shelfCopy=new Session(4);
  shelfCopy.stage=1;shelfCopy.begin();TideArchive.restore(shelfCopy,packed);
  assert.deepEqual(TideArchive.checkpoint(shelfCopy),packed);
  reach(savedTape,()=>savedTape.archive.sourceLoaded&&savedTape.near.every(Boolean));
  shuttle(savedTape,0,3.4,0,true);shuttle(savedTape,1,3.4,.9,true);
  assert.equal(savedTape.archive.count,0);assert.ok(savedTape.archive.pending);
  shuttle(savedTape,1,3.4,.38,true);assert.equal(savedTape.archive.count,1);
  reach(savedTape,()=>savedTape.stage===2&&savedTape.archive.review!==null);
  for(let n=0;n<90;n++)savedTape.tick(step,press(-1));
  assert.equal(savedTape.archive.review,0);
  const released=[empty(),empty()];
  for(let n=0;n<450;n++)savedTape.tick(step,released);
  assert.ok(savedTape.archive.review>7&&savedTape.archive.review<8&&!savedTape.archive.keys);
  reach(savedTape,()=>!!savedTape.archive.keys);
  const keysSave=TideArchive.checkpoint(savedTape),restoredKeys=new Session(4);
  restoredKeys.stage=2;restoredKeys.begin();TideArchive.restore(restoredKeys,keysSave);
  assert.ok(restoredKeys.archive.keys&&restoredKeys.archive.count===3);
  reach(restoredKeys,()=>TideArchive.near(restoredKeys,0)&&TideArchive.near(restoredKeys,1));
  restoredKeys.tick(step,press(0,true));assert.ok(restoredKeys.archive.keys.held);
  restoredKeys.tick(step,press(1,true));
  assert.ok(!restoredKeys.archive.keys.held&&!restoredKeys.complete&&!restoredKeys.archive.keys.accepted);
  reach(restoredKeys,()=>restoredKeys.complete);assert.ok(restoredKeys.archive.keys.accepted);
  const station=new Session(2),range=station.signal,w=station.world.signal;
  reach(station,()=>station.near.every(Boolean));
  for(let n=0;n<300;n++)station.tick(step,[{...empty(),use:true,z:1},{...empty(),use:true,jump:true}]);
  assert.equal(range.strokes,1);assert.equal(station.stage,0);
  reach(station,()=>station.stage===1&&range.shutter===1&&range.glow>.80);
  assert.ok(station.watch.done&&!range.heard);
  while(range.glow<=.87)station.tick(step,[empty(),empty()]);
  const heading=TideSignal.ship(station,station.time).yaw;
  const keyed=(jump=false)=>[empty(),{...empty(),use:true,jump}];
  station.tick(step,keyed(true));for(let n=0;n<20;n++)station.tick(step,keyed());
  station.tick(step,[empty(),empty()]);assert.equal(range.mic,'idle');
  station.tick(step,keyed(true));for(let n=0;n<280;n++)station.tick(step,keyed());
  assert.equal(range.speech,1);assert.ok(!range.sent&&!range.heard);
  assert.equal(TideSignal.ship(station,station.time).yaw,heading);
  station.tick(step,[empty(),empty()]);assert.equal(range.mic,'listening');assert.equal(range.heard,false);
  reach(station,()=>range.heard&&range.turn>.16);
  assert.ok(TideSignal.ship(station,station.time).yaw>heading+.15);
  const evidence=TideSignal.checkpoint(station);
  assert.ok(evidence.transit);
  const bridgeWatch=new Session(2);bridgeWatch.stage=1;bridgeWatch.begin();TideSignal.restore(bridgeWatch,evidence);
  for(let j=0;j<470;j++){
    const [left,right]=control(bridgeWatch);left.z=0;right.jump=j%40===0;
    bridgeWatch.tick(step,[left,right]);
  }
  assert.equal(bridgeWatch.stage,1);assert.ok(!bridgeWatch.signal.observed&&!bridgeWatch.signal.marked);
  // A witnessed blink at the wrong buoy must not be accepted as the shore light.
  for(let j=0;j<360;j++){
    const [left,right]=control(bridgeWatch);
    const aim=TideTransit.delta(TideTransit.camera(bridgeWatch),TideTransit.sources(bridgeWatch).buoy);
    right.x=Math.max(-1,Math.min(1,-aim.x*32));right.z=Math.max(-1,Math.min(1,-aim.y*32));
    right.jump=j%40===0;bridgeWatch.tick(step,[left,right]);
  }
  assert.ok(bridgeWatch.signal.strokesTest>0&&!bridgeWatch.signal.observed&&!bridgeWatch.signal.marked);
  reach(bridgeWatch,()=>bridgeWatch.signal.marked);
  reach(station,()=>station.stage===2);
  for(let n=0;n<330;n++)station.tick(step,[empty(),control(station)[1]]);
  assert.ok(range.angle>.35&&!range.pinned&&!range.closed&&range.glow>.85);
  reach(station,()=>station.players[0].ground===w.bridge&&range.walked);
  const leg=station.players[0];assert.ok(leg.y>w.gallery.y+.5&&leg.y<w.head.y);
  reach(station,()=>range.pinned);assert.equal(station.players[0].ground,w.head);
  const markSignal=TideSignal.checkpoint(station),reloadSignal=new Session(2);
  reloadSignal.stage=2;reloadSignal.begin();TideSignal.restore(reloadSignal,markSignal);
  assert.deepEqual(TideSignal.checkpoint(reloadSignal),markSignal);
  reach(reloadSignal,()=>reloadSignal.signal.closed);
  const shutterSave=TideSignal.checkpoint(reloadSignal);
  const dark=new Session(2);dark.stage=2;dark.begin();TideSignal.restore(dark,shutterSave);
  assert.equal(dark.signal.glow,0);reach(dark,()=>dark.complete);assert.ok(dark.signal.arrest>.95);
  const basket=new Session(0);
  reach(basket,()=>basket.stage===1&&basket.players[1].ground===basket.section.ferry.deck);
  assert.equal(basket.section.rig.slot,2);
  for(let j=0;j<360;j++){
    const inputs=control(basket);
    inputs[1]={...empty(),use:true,jump:j===2};
    basket.tick(step,inputs);
  }
  assert.ok(basket.rig.wrong>=0&&!basket.rig.lit);
  assert.ok(basket.state.ferry>.36&&basket.state.ferry<=.42);
  reach(basket,()=>basket.stage===2);

  {
    const g=new Session(0),h=g.world.fenders.floatPose,crew=g.players;
    const marks=crew.map(p=>TideFloating.local(h,p.x,p.y,p.z));let low=Infinity,high=-Infinity,angle=0;
    for(let j=0;j<600;j++){
      g.tick(step,[empty(),empty()]);low=Math.min(low,h.y);high=Math.max(high,h.y);angle=Math.max(angle,Math.abs(h.pitch),Math.abs(h.roll));
      for(let i=0;i<2;i++){
        const p=crew[i],expected=TideFloating.point(h,marks[i].x,marks[i].y,marks[i].z);
        assert.equal(p.ground,g.world.fenders.boats[i]);assert.ok(Math.hypot(p.x-expected.x,p.y-expected.y,p.z-expected.z)<.00001);
      }
    }
    assert.ok(high-low>.44&&angle>.055);
    const expected=g.players[0].y;g.tick(step,[{...empty(),jump:true,jumpHeld:true},empty()]);
    assert.ok(!crew[0].grounded&&crew[0].y>expected&&crew[1].ground===g.world.fenders.boats[1]);
  }
  {
    const g=new Session(1),a=g.cable,s=a.warp,w=g.world.cableQuay;
    reach(g,()=>s.clipped);const firstSave=TideCableQuay.checkpoint(g);
    assert.equal(a.hooks,1);assert.equal(firstSave.hooks,1);
    // Lock the upper drum and hold one lower stroke. A held or jittering
    // handle cannot repeatedly advance the chain without gathering another bite.
    for(let i=0;i<180;i++)g.tick(step,[{...empty(),use:true,z:1},{...empty(),use:true,z:-1}]);
    assert.ok(s.travel<.23&&s.load>.6);const held=s.travel;
    for(let i=0;i<60;i++)g.tick(step,[{...empty(),use:true,z:1},empty()]);
    assert.ok(s.travel<held+.05);
    reach(g,()=>s.travel>.46&&s.clipped);const bought=s.travel;
    for(let i=0;i<45;i++)g.tick(step,[{...empty(),use:true},{...empty(),use:true}]);
    assert.equal(s.travel,bought);assert.equal(g.players[0].ground,w.float);
    const oldHook=g.checkpoints[0];
    for(let i=0;i<720&&s.clipped;i++)g.tick(step,[{...empty(),use:true},{...empty(),use:true,z:1}]);
    assert.ok(!a.carried&&s.returning&&a.hooks===1);
    const rider=g.players[0];for(let i=0;i<420&&s.returning;i++)g.tick(step,[empty(),empty()]);
    assert.equal(rider.ground,w.float);assert.equal(s.travel,0);assert.equal(g.checkpoints[0],oldHook);
    const retry=new Session(1);retry.stage=1;retry.begin();TideCableQuay.restore(retry,firstSave);
    reach(retry,()=>retry.cable.warp.travel>.35&&retry.cable.warp.clipped);
    const q=retry.cable,falls=retry.setbacks,other=retry.players[1];
    for(let i=0;i<300&&retry.setbacks===falls;i++)retry.tick(step,[{...empty(),x:-1},{...empty(),use:true}]);
    assert.equal(retry.setbacks,falls+1);assert.equal(q.hooks,1);assert.ok(!q.carried&&retry.cues.splash&&other.grounded);
    reach(retry,()=>q.warp.phase==='far'&&q.warp.clipped);
    assert.ok(!q.warp.released&&q.hooks===1);
    reach(retry,()=>q.warp.released&&q.carried);reach(retry,()=>retry.stage===2);
  }

  function verifyCableQuay(){
    const g=new Session(1),a=g.cable,w=g.world.cableQuay;
    const tick=(left,right)=>g.tick(step,[{...empty(),...left},{...empty(),...right}]);
    const run=(frames,left,right)=>{for(let n=0;n<frames;n++)tick(left,right);};
    reach(g,()=>TideCableQuay.near(g,0)&&a.down);
    run(48,{use:true},{});tick({},{});run(9,{use:true},{});tick({},{});
    assert.equal(a.signalled,false,'A reversed test pattern must leave the dry loop open');
    reach(g,()=>a.signalled);
    for(let n=0;n<500&&(!near(g.players[1],w.posts[0])||!a.survey[0]);n++){
      const k=empty();if(TideCableQuay.near(g,1)&&TideCableQuay.target(g,1).index===0)k.use=true;
      else{
        const p=g.players[1],post=w.posts[0];
        steer(g,1,p.z<post.z-.10?{x:post.x+.88,y:post.y,z:post.z+.16}:post,k);
      }
      tick({},k);
    }
    assert.equal(a.survey[0],true);tick({},{use:true,jump:true});
    assert.ok(a.blown>0&&g.stage===0&&a.route===-1);
    reach(g,()=>g.stage===1&&a.carried&&a.hooks===1&&g.players[0].z<-14.0);
    const checkpoint=TideCableQuay.checkpoint(g);
    for(let n=0;n<600&&a.carried;n++)tick({},{use:true,z:1});
    assert.ok(!a.carried&&a.hooks===1,'Sinking the free cable must preserve the last seated saddle');
    const again=new Session(1);again.stage=1;again.begin();TideCableQuay.restore(again,checkpoint);
    assert.ok(again.cable.hooks===1&&!again.cable.carried);
    reach(again,()=>again.stage===2&&again.players[1].grounded&&TideCableQuay.target(again,1).index===2&&TideCableQuay.near(again,1));
    for(let n=0;n<120;n++)again.tick(step,[empty(),{...empty(),use:true,jump:true}]);
    assert.equal(again.cable.patched,-1,'The unlit back of the glass cannot identify a return sleeve');
    reach(again,()=>again.cable.patched===2);
    for(let n=0;n<300;n++){
      const k=control(again);k[1]=empty();k[0].jump=true;again.tick(step,k);
    }
    assert.ok(!again.cable.power&&!again.cable.backTest,'No live shore breaker before the two-way return test');
    reach(again,()=>again.cable.radio==='sending');
    again.tick(step,[empty(),empty()]);
    assert.equal(again.cable.radio,'idle');
    reach(again,()=>again.cable.radio==='sent');
    for(let n=0;n<100;n++)again.tick(step,[empty(),{...empty(),use:true}]);
    assert.equal(again.cable.radio,'sent','The ship needs the shore microphone to be released');
    again.tick(step,[empty(),empty()]);assert.equal(again.cable.radio,'reply');
    const receipt=TideCableQuay.checkpoint(again),restored=new Session(1);
    restored.stage=2;restored.begin();TideCableQuay.restore(restored,receipt);
    assert.ok(restored.cable.power&&restored.cable.radio==='reply');
    reach(restored,()=>restored.complete);
  }
  verifyCableQuay();

  function verifyBreakwater(){
    // Walk off the actual moving basket. Both players must get the hanging rider back to the beam.
    const rescue=new Session(0);
    reach(rescue,()=>rescue.stage===1&&rescue.state.ferry>.955);
    for(let n=0;n<240&&!rescue.rig.belay;n++){
      const k=control(rescue);k[1]={...empty(),z:-1,x:.2};rescue.tick(step,k);
    }
    assert.ok(rescue.rig.belay);
    rescue.tick(step,[empty(),{...empty(),jump:true}]);
    assert.ok(rescue.rig.belay,'An early release cannot detach the lifeline');
    for(let n=0;n<540&&!rescue.rig.landed;n++){
      const b=rescue.rig.belay,p=rescue.players[1],l=rescue.section.rig.ledge;
      const k=[{...empty(),use:true,z:-1},empty()];
      k[1].x=Math.max(-1,Math.min(1,(l.x-p.x)*4));
      k[1].z=b?-.72:Math.max(-1,Math.min(1,(l.z-p.z)*3));
      k[1].jump=!!b&&p.y>l.y-.23&&Math.abs(p.z-l.z)<1.16&&Math.abs(p.x-l.x)<.60;
      rescue.tick(step,k);
    }
    assert.ok(rescue.rig.landed&&!rescue.rig.belay);
    assert.equal(rescue.setbacks,0);
    reach(rescue,()=>!!rescue.landfall&&TideLandfall.near(rescue,0));
    const a=rescue.landfall,w=rescue.world.landfall;
    for(let n=0;n<230;n++)rescue.tick(step,[{...empty(),use:true,z:1},{...empty(),z:-1}]);
    assert.ok(a.height>.8&&a.height<1.01&&!a.pinned,'One pull stops at the end of the chain stroke');
    assert.ok(rescue.players[1].z>w.origin.z-7.5,'A low gate stops an approaching character');
    for(let n=0;n<120;n++)rescue.tick(step,[empty(),empty()]);
    assert.equal(a.height,0,'The wet chain runs out when the brake is released');
    for(let n=0;n<2000&&!TideLandfall.near(rescue,1);n++){
      const k=control(rescue);k[1].jump=false;rescue.tick(step,k);
    }
    assert.ok(TideLandfall.near(rescue,1)&&!a.pinned);
    for(let n=0;n<100;n++)rescue.tick(step,[empty(),{...empty(),use:true}]);
    rescue.tick(step,[empty(),{...empty(),use:true,jump:true}]);
    assert.ok(!a.pinned,'Misaligned slots cannot accept the pin from the dry side');
    reach(rescue,()=>a.pinned);
    const mark=TideLandfall.checkpoint(rescue),saved=new Session(0);
    saved.stage=2;saved.begin();TideLandfall.restore(saved,mark);
    assert.ok(saved.landfall.pinned&&!saved.landfall.plugged);
    reach(saved,()=>saved.landfall.plugged);
    for(let n=0;n<180;n++)saved.tick(step,[empty(),empty()]);
    assert.ok(!saved.landfall.receiving,'The loudspeaker alone cannot resolve the ship');
    reach(saved,()=>saved.landfall.receiving);
    reach(saved,()=>saved.complete);
  }
  verifyBreakwater();

  {
    const g=new Session(3),w=g.world.cistern,s=g.cistern;
    reach(g,()=>g.engaged.every(Boolean));
    for(let j=0;j<75;j++){const k=control(g);k[0].z=0;k[1].jump=true;g.tick(step,k);}
    assert.ok(!s.caught&&s.pressure>.8);
    reach(g,()=>s.catchLift>.24);
    const lift=s.catchLift;
    for(let j=0;j<30;j++)g.tick(step,[empty(),{...empty(),use:true}]);assert.equal(s.catchLift,lift);
    reach(g,()=>s.cupKept);
    const saved=TideCistern.checkpoint(g),reload=new Session(3);TideCistern.restore(reload,saved);assert.equal(reload.cistern.phase,'inspect');
    reach(reload,()=>reload.cistern.phase==='board');assert.equal(reload.cistern.cupTurn,1);
    reach(g,()=>g.stage===1&&g.engaged.every(Boolean));
    for(let j=0;j<310;j++){
      const k=control(g);k[0].x=1;k[1].x=Math.max(-1,Math.min(1,(1.97-s.raftX)*14));
      g.tick(step,k);
    }
    assert.ok(s.blocked&&!s.passed&&s.raftZ>.84&&s.deckY>1.5&&!s.offTrack);
    for(let j=0;j<290;j++){
      const k=control(g);k[0].x=Math.max(-1,Math.min(1,(.68-s.water)*6));k[1].x=1;
      g.tick(step,k);
    }
    assert.ok(s.blocked&&!s.passed&&s.deckY<1.14&&s.offTrack);
    const sea=g.cues.water;
    reach(g,()=>s.passed);assert.equal(g.cues.water,sea);
    const crossing=TideCistern.checkpoint(g),back=new Session(3);back.stage=1;back.begin();TideCistern.restore(back,crossing);
    assert.equal(back.players[1].ground,back.world.cistern.raft);assert.equal(back.cistern.raftZ,crossing.raftZ);
    reach(g,()=>g.stage===2&&s.ports===1);
    assert.equal(g.checkpoints[0],w.stairs[0]);
    reach(g,()=>s.tape==='basket'&&s.hoist>.13);
    const held=s.hoist;
    for(let j=0;j<40;j++)g.tick(step,[empty(),{...empty(),use:true,z:-1}]);assert.equal(s.hoist,held);
    const cargo=TideCistern.checkpoint(g),last=new Session(3);last.stage=2;last.begin();TideCistern.restore(last,cargo);
    assert.equal(last.cistern.tape,'basket');reach(last,()=>last.complete);assert.equal(last.cistern.tape,'received');
  }

  const bridge=new Session(6),upper=bridge.section.span;
  reach(bridge,()=>bridge.engaged.every(Boolean));
  for(let j=0;j<300;j++){
    const a=[{...empty(),use:true,z:-1},{...empty(),use:true,x:1,jump:j%20===0}];
    bridge.tick(step,a);
  }
  assert.ok(upper.impact>0,'Fast payout must recoil at the upper tooth.');
  assert.equal(upper.notch,0,'A rider cannot insert the pin while the bridge nose is out of register.');
  reach(bridge,()=>upper.notch===1);
  bridge.resetPerson(1,'失足');
  assert.ok(bridge.players[1].ground===upper.deck&&upper.notch===1);
  reach(bridge,()=>bridge.stage===1);
  const lower=bridge.section.span,math=vm.runInContext('TideDrawbridge',box);
  for(let j=0;j<240;j++){
    const a=control(bridge);a[0].use=false;bridge.tick(step,a);
  }
  assert.ok(bridge.time-lower.blockedAt<.2,'An upright staff cannot pass through the first overhead brace.');
  const hole=math.point(lower,0,0,lower.length*.69);
  assert.equal(surface(bridge.world,hole.x,hole.z,hole.y+.04),null,'The missing middle panel has no collision surface.');
  reach(bridge,()=>bridge.stage===2);
  const tram=bridge.section.tram;
  for(let j=0;j<300;j++){
    const a=control(bridge);a[0]=empty();bridge.tick(step,a);
  }
  const swing=bridge.swing,net=bridge.world.swing.net;
  assert.ok(!tram.departed&&!swing.crossed.some(Boolean),'A lone passenger cannot move the trolley from the launch line.');
  reach(bridge,()=>swing.occupied&&swing.angle<.15);
  const early=control(bridge);early[1].jump=true;bridge.tick(step,early);
  assert.ok(swing.flight&&!swing.occupied);
  const setbacks=bridge.setbacks;
  reach(bridge,()=>bridge.players[1].ground===net);
  assert.equal(bridge.setbacks,setbacks,'The safety net supports a missed release.');
  assert.equal(swing.crossed[1],false);
  reach(bridge,()=>swing.climb[1]?.t>.20);
  const onRung=bridge.players[1].y;
  for(let j=0;j<40;j++)bridge.tick(step,[empty(),empty()]);
  assert.equal(bridge.players[1].y,onRung);
  reach(bridge,()=>swing.occupied&&TideSwing.clearsBow(bridge));
  const throwKey=control(bridge);throwKey[1].jump=true;bridge.tick(step,throwKey);
  assert.ok(swing.flight&&!bridge.players[1].jumpRise);
  for(let j=0;j<120&&!swing.crossed[1];j++){
    const k=control(bridge);k[1].jumpHeld=false;bridge.tick(step,k);
  }
  assert.ok(swing.crossed[1],'Releasing the physical jump key must preserve the ballistic release speed.');
  const passenger=TideSwing.checkpoint(bridge),back=new Session(6);
  back.stage=2;back.begin();TideSwing.restore(back,passenger);
  assert.ok(back.players[1].ground===back.section.tram.deck&&!back.swing.crossed[0]&&!back.section.tram.departed);
  reach(bridge,()=>swing.phase==='stow'&&swing.stow>.24);
  const depth=swing.stow;
  for(let j=0;j<40;j++)bridge.tick(step,[{...empty(),use:true,z:-1},empty()]);
  assert.equal(swing.stow,depth);assert.equal(tram.departed,false);
  reach(bridge,()=>tram.travel>.12);
  const seats=bridge.players.map(p=>p.x-tram.deck.x),origin=tram.deck.z;
  for(let j=0;j<220;j++)bridge.tick(step,[empty(),empty()]);
  assert.ok(tram.deck.z<origin-1);
  bridge.players.forEach((p,i)=>assert.ok(p.ground===tram.deck&&Math.abs(p.x-tram.deck.x-seats[i])<.15));
  for(let j=0;j<1100&&!tram.arrived;j++)bridge.tick(step,[empty(),empty()]);
  assert.ok(tram.arrived&&!bridge.complete);
  for(let j=0;j<240&&!bridge.complete;j++){
    const input=bridge.players.map((p,i)=>{
      const key=empty(),x=tram.to.x+(i?1.56:-1.56);
      steer(bridge,i,{x,y:tram.to.y,z:Math.abs(p.x-x)>.25?p.z:bridge.section.mid.z},key);
      return key;
    });
    bridge.tick(step,input);
  }
  assert.ok(bridge.skipTin&&!tram.heard&&swing.phase==='report','Both passengers may walk off without making a recording.');
  const reportSave=TideSwing.checkpoint(bridge);
  const reportBack=new Session(6);reportBack.stage=2;reportBack.begin();TideSwing.restore(reportBack,reportSave);
  assert.ok(reportBack.swing.phase==='report'&&reportBack.section.tram.arrived);
  reach(reportBack,()=>reportBack.swing.report>.27);
  const before=reportBack.swing.report;
  for(let j=0;j<30;j++)reportBack.tick(step,[empty(),{...empty(),use:true,z:-1,jump:true}]);
  assert.equal(reportBack.swing.report,before);
  reach(bridge,()=>bridge.complete);
  assert.ok(swing.drawer>.85&&swing.report===1);

  // Compare the two natural jump arcs on a flat deck at the simulation tick rate.
  {
    const physics=vm.runInContext('TideTraversal',box);
    const floor={x:0,y:0,z:0,w:15,d:15,active:true};
    function apex(hold){
      const p=physics.spawn(floor);let high=p.y;
      for(let f=0;f<95;f++){
        physics.move(p,{...empty(),x:.35,jump:f===0,jumpHeld:f<hold},step,{floors:[floor]},0,false);
        high=Math.max(p.y,high);
      }
      assert.equal(p.ground,floor);return high;
    }
    assert.ok(apex(60)-apex(1)>.43);
  }

  {
    const g=new Session(5),r=g.glass;
    reach(g,()=>r.keyed&&TideGlass.near(g,1));const atLock=TideGlass.checkpoint(g);
    for(let j=0;j<120;j++)g.tick(step,[{...empty(),use:true,z:1},empty()]);
    assert.equal(r.drawer,atLock.drawer);
    reach(g,()=>r.receiving&&r.transfer>.18);
    const transfer=r.transfer;for(let j=0;j<24;j++)g.tick(step,[{...empty(),use:true},empty()]);
    assert.equal(r.transfer,transfer);
    reach(g,()=>r.phase==='cart'&&g.engaged.every(Boolean));
    const c=r.cart,start={...c};
    for(let j=0;j<80;j++)g.tick(step,[{...empty(),use:true,z:-1},empty()]);
    assert.equal(c.x,start.x);assert.equal(c.z,start.z);
    for(let j=0;j<250;j++)g.tick(step,[{...empty(),use:true,z:-1},{...empty(),use:true,z:-1}]);
    assert.ok(r.blocked&&c.z>2.10&&c.z<3.50);assert.ok(TideGlass.fits(c));
    const transit=new Session(5);TideGlass.restore(transit,atLock);
    reach(transit,()=>transit.glass.leg===1);
    const saved=TideGlass.checkpoint(transit),resume=new Session(5);TideGlass.restore(resume,saved);
    assert.equal(resume.glass.cart.x,saved.cart.x);assert.equal(resume.glass.cart.z,saved.cart.z);
    reach(resume,()=>resume.glass.phase==='unload'&&resume.glass.unload>.15);
    const unloaded=resume.glass.unload;
    for(let j=0;j<30;j++)resume.tick(step,[{...empty(),use:true},empty()]);
    assert.equal(resume.glass.unload,unloaded);
    reach(resume,()=>resume.paper.pinned);const pin=TideGlass.checkpoint(resume),table=new Session(5);
    TideGlass.restore(table,pin);assert.ok(table.paper.pinned&&table.glass.docked);
    reach(table,()=>table.glass.phase==='proof'&&table.engaged.every(Boolean));
    for(let j=0;j<55;j++){const k=control(table);k[0].x=k[1].x=0;k[0].jump=k[1].jump=j===10;table.tick(step,k);}
    assert.equal(table.glass.phase,'proof');assert.ok(!table.glass.clipped.every(Boolean));
    reach(table,()=>table.stage===2&&table.glass.phase==='margin');
    assert.ok(table.section.sites[0].x>table.section.sites[1].x);
    for(let j=0;j<165;j++){const k=control(table);k[0].use=false;k[1].jump=true;table.tick(step,k);}
    assert.ok(!table.glass.rubs[0]);
    reach(table,()=>table.glass.rubs[0]);const first=TideGlass.checkpoint(table),evidence=new Session(5);evidence.stage=2;evidence.begin();
    TideGlass.restore(evidence,first);assert.equal(evidence.glass.fragment,1);assert.ok(!evidence.glass.rubs[1]);
    reach(evidence,()=>evidence.glass.phase==='record');
    for(let j=0;j<60;j++){const k=control(evidence);k[0].x=k[1].x=0;k[0].jump=k[1].jump=true;evidence.tick(step,k);}
    assert.deepEqual(Array.from(evidence.glass.signed),[false,false]);
    reach(evidence,()=>evidence.complete);assert.ok(evidence.glass.signed.every(Boolean));
  }
  const chart=new Session(5);
  reach(chart,()=>chart.paper.pinned);
  const h=chart.paper.holder,r=1-h;
  for(let j=0;j<80;j++){
    const inputs=control(chart);inputs[r].x=j<40?1:-1;inputs[r].jump=false;
    chart.tick(step,inputs);
    const p=chart.paper,[x,y]=p.pin;
    assert.ok(Math.hypot(p.offset[0]+Math.cos(p.angle)*x-Math.sin(p.angle)*y-x,
      p.offset[1]+Math.sin(p.angle)*x+Math.cos(p.angle)*y-y)<1e-9);
  }
  reach(chart,()=>chart.paper.revealed);
  const letGo=control(chart);letGo[h].use=false;letGo[r].jump=true;
  chart.tick(step,letGo);assert.equal(chart.state.doneAt,null);
  reach(chart,()=>chart.stage===1);

  const light=new Session(9);
  reach(light,()=>light.engaged.every(Boolean));
  for(let j=0;j<170;j++){
    const a=control(light);a[0].x=1;a[1].jump=true;light.tick(step,a);
  }
  assert.equal(light.optic.phase,0);
  assert.ok(TideLantern.viewData(light).images[0].ghost>.95,'Clipping too little leaves a second visible ray.');
  for(let j=0;j<240;j++){
    const a=control(light);a[0].x=-1;a[1].jump=true;light.tick(step,a);
  }
  assert.equal(light.optic.phase,0);
  assert.ok(TideLantern.viewData(light).images[0].power<.1,'Closing the shutter over the sound glass must extinguish the main band.');
  reach(light,()=>light.optic.stable>.22&&!light.optic.tag);
  const simultaneous=control(light);simultaneous[0].jump=simultaneous[1].jump=true;
  light.tick(step,simultaneous);
  assert.equal(light.optic.phase,0,'A simultaneous press cannot secure an observation before it is received.');
  assert.ok(light.optic.tag);
  const drop=control(light);drop[1].use=false;drop[0].jump=true;light.tick(step,drop);
  assert.ok(light.optic.phase===0&&!light.optic.tag,'The locking pin needs a current observation.');
  reach(light,()=>light.optic.phase===1);
  const mark=TideLantern.checkpoint(light),again=new Session(9);
  TideLantern.restore(again,JSON.parse(JSON.stringify(mark)));
  assert.equal(again.optic.phase,1);assert.equal(again.section.sites[1].label,'远端检视窗');
  assert.ok(Math.abs(again.optic.axes[0]-light.optic.axes[0])<.001);
  reach(light,()=>light.stage===1&&light.engaged.every(Boolean));
  for(let j=0;j<270;j++){
    const a=control(light);a[1].use=false;light.tick(step,a);
  }
  assert.ok(light.optic.mount.travel<.10,'The trolley cannot be pushed without its guide.');
  for(let j=0;j<420;j++){
    const a=control(light);a[1].x=-1;light.tick(step,a);
  }
  const m=light.optic.mount;
  assert.equal(m.gate,0);assert.ok(Math.abs(m.travel-TideLantern.gauges[0].at)<1e-8);
  reach(light,()=>m.gate===1);
  const savedMount=TideLantern.checkpoint(light);
  const resumeLamp=new Session(9);resumeLamp.stage=1;resumeLamp.begin();TideLantern.restore(resumeLamp,savedMount);
  assert.equal(resumeLamp.optic.mount.gate,1);assert.equal(resumeLamp.optic.mount.travel,TideLantern.gauges[0].at);
  reach(light,()=>m.done);assert.equal(light.optic.op,1);
  reach(light,()=>light.complete);
  assert.equal(light.optic.stamp,2);assert.equal(light.optic.phase,1);

  // The final radio remains occupied until the signal operator releases it.
  const final=new Session(11);
  let held=0;
  for(let j=0;j<60*120&&!final.complete;j++){
    const inputs=control(final);
    if(final.stage===2&&final.state.mode===1&&held<240){inputs[1].use=true;held++;}
    if(held>0&&held<240)assert.equal(final.state.mode,1);
    final.tick(1/60,inputs);
  }
  assert.equal(held,240);assert.ok(final.complete);
  {
    const g=new Session(11);g.savedSpacing=[1.12,.96];reach(g,()=>g.pilotHorn?.mode==='ack');
    assert.deepEqual(Array.from(g.pilotHorn.gaps),[1.12,.96]);
    assert.deepEqual(Array.from(g.pilotHorn.trace.bridge),Array.from(g.pilotHorn.trace.source));
    reach(g,()=>g.lastPass?.voice==='clear'&&g.lastPass.clock>.55);
    const r=g.lastPass;assert.ok(TideLastPass.along(g)>8.45);
    for(let j=0;j<48;j++){const k=control(g);k[1].use=true;g.tick(step,k);}
    assert.equal(r.clock,0);assert.equal(g.cues.rescue,0);
    reach(g,()=>r.cleared&&!r.turned);const saved=TideLastPass.checkpoint(g);
    const test=new Session(11);test.stage=2;test.begin();TideLastPass.restore(test,saved);
    for(let j=0;j<160;j++){const k=control(test);k[0].use=false;test.tick(step,k);}
    assert.equal(test.cues.rescue,0);assert.ok(!test.lastPass.turned);
    reach(test,()=>test.lastPass.voice==='turn'&&test.lastPass.clock>.6);assert.equal(test.cues.rescue,0);
    reach(test,()=>test.lastPass.arrived);const landed=TideLastPass.checkpoint(test);
    const moored=new Session(11);moored.stage=2;moored.begin();TideLastPass.restore(moored,landed);
    for(let j=0;j<100;j++){const k=control(moored);k[0].jump=false;k[0].x=1;moored.tick(step,k);}
    const wrong=control(moored);wrong[0].x=0;wrong[0].jump=true;moored.tick(step,wrong);
    assert.equal(moored.state.doneAt,null);reach(moored,()=>moored.complete);
  }
  // Holding the cooperation switches backwards together skips the private recording.
  const carried=new Session(6);
  carried.pocketTape=TideTinMemory.readTakes(JSON.parse(JSON.stringify(copy.takes)));
  assert.deepEqual(JSON.parse(JSON.stringify(carried.pocketTape)),JSON.parse(JSON.stringify(copy.takes)));
  assert.equal(TideTinMemory.readTakes([[[-1,'tin',.4,0]]]).length,0);
  for(let j=0;j<60*150&&!carried.state.pocket;j++){
    const k=control(carried);
    if(carried.swing.phase==='quiet'&&k.every(v=>v.use))for(const v of k){v.z=-1;v.jump=false;}
    carried.tick(step,k);
  }
  const savedPlayer=carried.state.pocket;assert.ok(savedPlayer,'Two riders can play their own archive copy');
  const pressPlay=[{...empty(),use:true,z:-1},{...empty(),use:true,z:-1}];
  for(let j=0;j<1600&&carried.state.pocket;j++)carried.tick(step,pressPlay);
  assert.deepEqual(Array.from(savedPlayer.events,e=>[e.type,e.gain,e.pan]),Array.from(copy.heard,([,id,gain,pan])=>[id,gain,pan]));
  assert.ok(!carried.state.pocket&&!carried.section.tram.heard);
  reach(carried,()=>carried.complete);
  const quiet=new Session(6);
  for(let j=0;j<60*120&&!quiet.complete;j++){
    const inputs=control(quiet);
    if(quiet.swing.phase==='quiet'&&inputs.every(i=>i.use)){
      for(const key of inputs){key.jump=false;key.z=1;}
    }
    quiet.tick(1/60,inputs);
  }
  assert.ok(quiet.complete&&quiet.skipTin);
  console.log('Verified rotating inspection shoes, foghorn valve duration, separate ship receivers, a failed cam repair, visual reacquisition, matching travelling troughs, a lost tide window, real staff readings, submerged stump, shallow-channel rejection, stern readback, mast climb, transfer car, wrong file, lost negative, individual signatures, both roles, short–long keying, cable drop and preserved saddle, unlit crane window, shore return loop, ferry readback, swinging belay, floodgate collision and pin, emergency radio reception, basket mark, the pump relief, enamel cup, lateral and vertical raft clearance, stair cocks and two-person tape hoist, two drawbridge catches, folding staff, trapeze release and catch net, arrested ladder recovery, two-person staff clip, shared cable car, receiving drawer, lantern shutters, optical carriage and saved guide positions, tape transport, wrong splices, cabinet keys, paper registration, final radio release and optional recording.');
}
