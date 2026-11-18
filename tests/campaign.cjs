// Exercise the shipping simulation solely via movement, jump and tool inputs.
// Run with node tests/campaign.cjs from any directory.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const box=vm.createContext({});
for(const name of ['missions','traversal','passage','rigging','drawbridge','fieldwork','lookout','paper','lantern','cooperation']){
  vm.runInContext(fs.readFileSync(path.join(__dirname,'../dist',name+'.js'),'utf8'),box);
}
const {Session,near,surface,lookout,ridePressure,TideLantern}=vm.runInContext('({Session:TideCoop.Session,near:TideCoop.near,surface:TideTraversal.surface,lookout:TideLookout,ridePressure:TideCoop.ridePressure,TideLantern})',box);
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
function control(g){
  const out=[empty(),empty()],sec=g.section,s=g.spec,q=g.state;
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
        case 'cable':move(1,.74-.13*step);break;
        case 'tape':out[0].jump=Math.abs((g.time%3.3)/3.3-.24-step*.19)<.07;out[1].jump=f.trained;break;
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
    const w=g.watch,d=w.task.watcher,cam=lookout.camera(g);
    const target=w.task.targets[w.step],pos=lookout.point(g,target);
    const [dx,dy,dz]=pos.map((x,j)=>x-cam.eye[j]);
    const axis=n=>Math.max(-1,Math.min(1,n*13));
    out[d].x=axis(Math.atan2(dx,-dz)-cam.yaw);
    out[d].z=-axis(Math.atan2(dy,Math.hypot(dx,dz))-cam.pitch);
    out[d].jump=w.seen===target;out[1-d].jump=!!w.marked;
    return out;
  }
  switch(s.type){
    case 'cable':trim(1,(s.code+.5)/3);out[0].jump=g.time-q.pulseAt>2;out[1].jump=Math.min(2,Math.floor(q.dials[1]*3))===s.code;break;
    case 'power':trim(0,s.value+.012);break;
    case 'paper':{
      const p=g.paper,h=p.holder,r=1-h,[x,y]=p.pin;
      const dx=p.offset[0]+Math.cos(p.angle)*x-Math.sin(p.angle)*y-x,dy=p.offset[1]+Math.sin(p.angle)*x+Math.cos(p.angle)*y-y;
      const axis=n=>Math.max(-1,Math.min(1,n*16));
      if(!p.pinned){out[h].x=axis(-dx);out[h].z=axis(dy);out[h].jump=Math.hypot(dx,dy)<.037;}
      else{out[r].x=axis(p.angle);out[r].z=axis(p.light-p.lightTarget);out[r].jump=p.revealed;}
      break;
    }
    case 'tape':case 'optic':
      for(let i=0;i<2;i++)trim(i,s.v[i]+(g.index===11?.095*Math.sin(g.time*.49+i):0));break;
    case 'radio':out[0].jump=q.received>0;trim(0,s.v[0]+Math.sin(g.time*.42)*.105);trim(1,(s.answer+.5)/3);
      out[1].jump=Math.floor(q.dials[1]*3)===s.answer && Math.abs(q.dials[0]-s.v[0]-Math.sin(g.time*.42)*.105)<.075;break;
    case 'tide':out[s.lead].jump=Math.abs(g.time%5/5-.74)<.08;out[1-s.lead].jump=g.time-q.readAt<.7;break;
    case 'post':trim(0,.5);out[1].jump=true;out[0].jump=g.time-q.mark<2;break;
    case 'rhythm':{
      const phase=(q.age+(s.irregular?.3*Math.sin(q.age*.9):0))%s.period/s.period;
      out[0].jump=q.nextShot===0&&Math.abs(phase-.24)<.05;
      const interval=g.index===10&&g.stage===0?.5:.72;
      out[1].jump=q.nextShot===2||q.nextShot===1&&Math.abs(g.time-q.pulseAt-.6-q.received*interval)<.05;break;
    }
    case 'quiet':{
      const taps=q.taps||[],answer=q.answer||[];
      if(taps.length<3)out[0].jump=!taps.length||g.time-taps.at(-1)>(taps.length===1?.62:1.08);
      else out[1].jump=!answer.length||g.time-answer[0]>=taps[answer.length]-taps[0];break;
    }
    case 'release':out[1].use=q.mode!==1;out[0].jump=q.mode===2&&g.cues.rescue===1;break;
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

  const pump=new Session(3);
  reach(pump,()=>pump.rig.guider);
  const startLevel=pump.rig.water;
  for(let j=0;j<300;j++){
    const inputs=control(pump);inputs[pump.spec.driver].x=1;
    pump.tick(step,inputs);
  }
  const keeper=pump.players[pump.spec.driver],valve=pump.section.sites[pump.spec.driver];
  assert.ok(Math.abs(keeper.x-(valve.x+.22))<.05&&Math.abs(keeper.z-(valve.z-.512))<.05);
  assert.ok(keeper.grounded,'The pump operator needs a solid footing throughout a valve change.');
  assert.ok(pump.rig.water>startLevel+.70);
  assert.ok(!pump.rig.opened&&pump.state.ferry<=.50);
  const sea=pump.cues.water;
  reach(pump,()=>pump.stage===1);
  assert.equal(pump.cues.water,sea);

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
  assert.ok(!tram.departed&&bridge.players[1].ground===tram.deck);
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
  assert.ok(bridge.complete&&bridge.skipTin,'Both passengers may walk off together without making a recording.');

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
  // Holding the cooperation switches backwards together skips the private recording.
  const quiet=new Session(6);
  for(let j=0;j<60*120&&!quiet.complete;j++){
    const inputs=control(quiet);
    if(quiet.spec.type==='quiet'&&inputs.every(i=>i.use)){
      for(const key of inputs){key.jump=false;key.z=1;}
    }
    quiet.tick(1/60,inputs);
  }
  assert.ok(quiet.complete&&quiet.skipTin);
  console.log('Verified both roles, basket mark, hydraulic sill, two drawbridge catches, folding staff, shared cable car, lantern shutters, optical carriage and saved guide positions, paper registration, final radio release and optional recording.');
}
