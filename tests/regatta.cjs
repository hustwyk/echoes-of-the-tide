const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const game=vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../dist/regatta.js'),'utf8')+'\nTideRegatta');
const idle=()=>({x:0,z:0,boost:false,reset:false}),hz=1/60;
function helm(inner){
  let target=0;
  const points=[[1.40,1.41],[1.88,1.39],[2.31,1.05],[2.52,.50],[2.51,-.30],[2.34,-1.05],[1.76,-1.56],
    [1.02,inner?-1.13:-1.70],[.18,inner?-1.04:-1.72],[-.53,inner?-1.02:-1.70],[-1.58,-1.53],[-2.20,-1.12],
    [-2.48,-.55],[-2.50,.33],[-2.28,.96],[-1.79,1.34],[-.46,1.40]];
  return b=>{
    let [x,z]=points[target];if(Math.hypot(x-b.x,z-b.z)<.32){target=(target+1)%points.length;[x,z]=points[target];}
    const angle=Math.atan2(x-b.x,-(z-b.z)),error=Math.atan2(Math.sin(angle-b.h),Math.cos(angle-b.h));
    return {x:Math.max(-1,Math.min(1,2.3*error-.23*b.omega)),z:Math.abs(error)>.6?-.53:-.91,boost:false,reset:false};
  };
}
function go(round=0){const r=game.create(round);game.confirm(r,0);assert.equal(r.phase,'ready');game.confirm(r,1);
  for(let i=0;i<180;i++)game.step(r,[idle(),idle()],hz);assert.equal(r.phase,'race');return r;}
function ride(separate){
  const r=go(),drivers=[helm(false),helm(true)];
  for(let tick=0;tick<60*100&&r.phase==='race';tick++)game.step(r,r.boats.map((b,i)=>separate&&i===1?idle():drivers[i](b)),hz);
  return r;
}
if(require.main===module){
  const r=ride(false);assert.equal(r.phase,'result',JSON.stringify(r.boats.map(b=>[b.x,b.z,b.gate,b.lap])));
  assert.ok(r.boats.every(b=>b.splits.length===2));assert.equal(r.boats[0].outer,2);assert.equal(r.boats[1].inner,2);
  const solo=ride(true);assert.equal(solo.boats[1].gate,0);assert.equal(solo.boats[1].time,null);assert.equal(solo.winner,0);
  const start=go(),p=start.boats[0],standby=idle(),drive={...idle(),z:-1,boost:true};
  for(let n=0;n<126;n++)game.step(start,[drive,standby],hz);
  assert.equal(p.hot,true);assert.equal(p.gate,1);
  for(let n=0;n<112;n++)game.step(start,[standby,standby],hz);
  assert.equal(p.hot,false);assert.ok(p.charge>.28);
  const gate=p.gate;
  for(let n=0;n<120;n++)game.step(start,[{...standby,reset:true},standby],hz);
  assert.equal(p.penalty,2);assert.equal(p.gate,gate);assert.equal(p.x,p.anchor.x);
  const tie=go();tie.boats.forEach((b,i)=>Object.assign(b,{lap:1,gate:4,x:-.763,z:1.1+i*.5,h:Math.PI/2,vx:1}));
  game.step(tie,[drive,drive],hz);assert.equal(tie.winner,-1);assert.equal(tie.phase,'result');
  const reverse=go();Object.assign(reverse.boats[0],{x:1.154,z:1.42,h:-Math.PI/2,vx:-1});
  game.step(reverse,[drive,standby],hz);assert.equal(reverse.boats[0].gate,0);
  assert.equal(game.create(1).boats[0].z,game.create(0).boats[1].z);
  console.log('Both routes, two laps, solo timeout, reverse crossing, tie, battery, penalty and lane exchange passed.',r.boats.map(b=>b.time.toFixed(2)));
}
module.exports={helm};
