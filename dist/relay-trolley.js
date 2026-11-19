// The rail carries the running gear. The pin rides on the load suspended below it.
const TideRelayTrolley=(()=>{
  const {clamp}=TideTraversal;
  const railStart=-3.65,railLength=2.63,ladderX=-1.52,notch=(ladderX-railStart)/railLength;
  const railX=t=>railStart+railLength*t;
  function create(){
    return {speed:0,angle:0,omega:0,tilt:0,brake:0,bolt:0,locked:false,blocked:false,missed:false,dialogue:0,
      cue:null,cueAt:-1,cueCount:0,
      dx:0,dy:0,contact:.48,noseSpeed:0,driver:false,aligned:false};
  }
  function pose(g,dt){
    const r=g.relay,h=r.trolley,c=g.world.relay.car;
    const anchor=TideRelay.point(railX(r.travel),2.02,-1.47),angle=h.angle;
    const tilt=angle*.38,ux=Math.cos(tilt),uy=Math.sin(tilt);
    const x=anchor.x+1.83*Math.sin(angle),y=anchor.y+1.83*(1-Math.cos(angle)),z=anchor.z;
    const last=c.axes?.ux||1;
    for(const p of g.players)if(p.ground===c){
      const u=(p.x-c.x)/last;
      p.x=x+u*ux;p.y+=y+u*uy-c.y-u*(c.axes?.uy||0);p.z+=z-c.z;
    }
    c.x=x;c.y=y;c.z=z;c.axes={ux,uy,uz:0,vx:0,vy:0,vz:1};h.tilt=tilt;
    const socket=TideRelay.point(ladderX,2.65,-2.20),prev=h.dx;
    h.dx=x-.63*uy-socket.x;h.dy=y+.63*ux-socket.y;
    h.contact=clamp((z-.54-socket.z)/.40,.15,.90);
    h.noseSpeed=dt?(h.dx-prev)/dt:0;
    h.aligned=Math.abs(h.dx)<.074&&Math.abs(h.dy)<.045;
  }
  function cue(g,h,id){h.cue=id;h.cueAt=g.time;h.cueCount++;}
  function reset(g,docked){
    const r=g.relay;
    Object.assign(r.trolley,create(),{locked:docked,bolt:docked?1:0,dialogue:docked?2:0});
    r.travel=docked?notch:0;pose(g,0);
  }
  function move(g,k,dt){
    const r=g.relay,h=r.trolley,c=g.world.relay.car;
    r.boarded=g.players[0].ground===c;
    h.driver=!r.top&&r.climb!=='upper'&&k.use&&TideRelay.near(g,1)&&TideRelay.target(g,1)===g.world.relay.haul;
    const axis=h.driver?k.x:0,braking=h.driver&&Math.abs(axis)<.16;
    const oldBrake=h.brake;
    h.brake+=(Number(braking)-h.brake)*(1-Math.exp(-dt*(braking?10:20)));
    if(braking&&oldBrake<.78&&h.brake>=.78)cue(g,h,'trolleyBrake');
    if(!h.locked){
      const wanted=h.driver&&!braking?axis*(r.boarded?.39:.50):0,old=h.speed;
      h.speed+=(wanted-old)*(1-Math.exp(-dt*(braking?10:h.driver?4.8:2.5)));
      const next=clamp(r.travel+h.speed*dt,0,1);
      if(next===1||next===0)h.speed=0;
      r.travel=next;
      const accel=clamp((h.speed-old)*railLength/dt,-6,6);
      const gust=.081*Math.sin(g.time*1.13)+.045*Math.sin(g.time*1.78);
      h.omega+=dt*(-8.9*Math.sin(h.angle)-(1.55+1.6*h.brake)*h.omega-accel*.45+gust);
      h.angle=clamp(h.angle+h.omega*dt,-.25,.25);
    }
    pose(g,dt);
  }
  function insert(g,k,dt){
    const r=g.relay,h=r.trolley,c=g.world.relay.car;
    if(h.locked)return;
    const onLever=g.engaged[0]&&g.players[0].ground===c,command=onLever?-k.z:0;
    if(h.bolt<h.contact-.10)h.blocked=h.missed=false;
    const seated=h.aligned&&h.driver&&h.brake>.78&&Math.abs(h.noseSpeed)<.13;
    const next=clamp(h.bolt+(command>.18?command*1.25:command<-.18?command*2:-.72)*dt,0,1);
    if(next>=h.contact){
      if(Math.abs(h.dx)>.23)h.missed=true;
      else if(!seated||h.missed||h.blocked){
        if(!h.blocked)cue(g,h,'boltStrike');
        h.blocked=true;h.bolt=h.contact;return;
      }
    }
    h.bolt=next;
    if(next<1||!seated||h.missed||h.blocked)return;
    h.locked=true;h.bolt=1;h.speed=h.omega=0;
    cue(g,h,'boltSeated');
    g.checkpoints[0]=c;g.alert('销尾的白环露出来了。按住操作键，再按跳跃换手接梯。',3);
    g.events.checkpoint?.(g);
  }
  function direction(h){
    if(h.aligned)return Math.abs(h.noseSpeed)>.13?'对上了，等踏板停摆':h.brake>.78?'孔位已对正':'对上了，请沈遥抱闸';
    return '梯座在销尖'+(h.dx<0?'右':'左')+'侧 '+Math.round(Math.abs(h.dx)*100)+' 厘米';
  }
  return {create,reset,move,insert,direction,notch,railX};
})();
