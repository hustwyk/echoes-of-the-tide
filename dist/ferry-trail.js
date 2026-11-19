// Samples are taken by the shared simulation. A second camera never advances the wake.
const TideFerryTrail=(()=>{
  const interval=.24,count=62;
  function yaw(g,t){
    if(g.index===11)return TideLastPass.yaw(g);
    if(g.fog)return TideFogSignal.shipYaw;
    if(g.survey)return TideSoundings.shipYaw;
    if(g.signal)return TideSignal.ship(g,t).yaw;
    return 1.12+g.cues.rescue*.7;
  }
  function create(){return {points:Array.from({length:count},()=>({t:-100})),head:-1,last:-100};}
  function update(g){
    const trace=g.ferryTrail,t=g.time;
    if(!trace||t-trace.last<interval)return;
    const p=TideLookout.vessel(g,t),angle=yaw(g,t),s=Math.sin(angle),c=Math.cos(angle);
    const x=p[0]+8.64*s,z=p[2]+8.64*c,prev=trace.points[trace.head];
    const dt=t-trace.last,dx=prev?x-prev.x:0,dz=prev?z-prev.z:0;
    const speed=Math.hypot(dx,dz)/dt;
    const thrust=g.lastPass?.turned&&!g.lastPass.arrived?g.lastPass.steer*(1-Math.max(0,(g.cues.rescue-.93)/.07)):0;
    const underway=dt<1&&speed<12?Math.min(1,speed*.33):0;
    const j=(trace.head+1)%count;
    Object.assign(trace.points[j],{x,z,t,s,c,amount:.77*underway,thrust});
    trace.head=j;trace.last=t;
  }
  return {create,update,yaw};
})();
