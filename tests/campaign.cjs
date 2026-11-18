// Exercise the shipping simulation solely via movement, jump and tool inputs.
// Run with node tests/campaign.cjs from any directory.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const box=vm.createContext({});
for(const name of ['missions','traversal','passage','fieldwork','lookout','cooperation']){
  vm.runInContext(fs.readFileSync(path.join(__dirname,'../dist',name+'.js'),'utf8'),box);
}
const {Session,near,surface,lookout,ridePressure}=vm.runInContext('({Session:TideCoop.Session,near:TideCoop.near,surface:TideTraversal.surface,lookout:TideLookout,ridePressure:TideCoop.ridePressure})',box);
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
    }else{
      if(!near(g.players[d],sec.sites[d]))steer(g,d,sec.sites[d],out[d]);else{out[d].use=true;out[d].x=Math.max(-1,Math.min(1,(ridePressure(s,q.ferry)-q.dials[d])*22));}
      if(q.ferry>.96){
        steer(g,r,sec.sites[r],out[r]);if(g.players[r].ground===carrier)out[r].jump=true;
        if(near(g.players[r],sec.sites[r]))out[r].use=true;
      }else {const lean=s.mode==='bridge' && q.ferry>.08 && q.ferry<.94 ? Math.sin(q.ferry*9.8+(s.driver?1:0))*.77 : 0;
        steer(g,r,{...carrier,x:carrier.x+lean},out[r]);if(s.mode==='raft'&&g.players[r].ground===carrier)out[r].use=true;}
    }
    return out;
  }
  for(let i=0;i<2;i++){
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
    case 'tape':case 'paper':case 'optic':
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
  console.log('Verified both roles, final radio release and the optional recording.');
}
