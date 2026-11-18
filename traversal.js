const TideTraversal = (() => {
  const clamp=(n,lo,hi)=>Math.max(lo,Math.min(hi,n));
  const mix=(a,b,t)=>a+(b-a)*t;
  const smooth=t=>t*t*(3-2*t);
  // Distance between landings, outward bows and vertical relief follow the shore,
  // the flooded room, the damaged bridge and the lantern maintenance galleries.
  const routes=[
    {length:[11,17,12],bow:[0,0],lift:[0,0]},
    {length:[18,22,23],bow:[3,1.6],lift:[-.45,.75]},
    {length:[17,22,18],bow:[2.6,3.4],lift:[.72,-.26]},
    {length:[12,13,12],bow:[0,0],lift:[0,0]},
    {length:[16,20,18],bow:[1.4,2.8],lift:[.12,.55]},
    {length:[16,18,21],bow:[2.4,1.4],lift:[.2,.32]},
    {length:[14,15,17],bow:[1.8,1.5],lift:[-.25,.38]},
    {length:[24,26,22],bow:[2.7,3.8],lift:[1.18,-.64]},
    {length:[22,24,24],bow:[3.9,2.4],lift:[-.72,1.45]},
    {length:[22,24,26],bow:[4.3,3.4],lift:[.95,1.25]},
    {length:[20,23,26],bow:[2.5,3.3],lift:[1.12,-.45]},
    {length:[24,26,21],bow:[3.3,2.4],lift:[.70,1.17]}
  ];
  // Two routes share all solid geometry. Wide landings make swapping sides possible.
  function build(index) {
    const specs=TideMissions.chapters[index];
    const floors=[],sections=[];
    const style=['dock','pump','bridge','lens'][Math.floor(index/3)];
    let z=3, height=0;
    let centers=[-3.7,3.7];
    function floor(x,y,z,w,d,kind=style) {
      const slab={x,y,z,w,d,kind,active:true};
      floors.push(slab);
      return slab;
    }
    function dock(xs,y,z) {
      const landingStyle=index===0||index===3?'quay':style;
      return xs.map(x=>floor(x,y,z,5.8,5.6,landingStyle));
    }
    let starts=dock(centers,height,z);
    floor(0,height,z,5,3.4);
    for(let k=0;k<specs.length;k++) {
      const s=specs[k];
      const route=routes[index];
      const length=s.length || route.length[k];
      const destZ=z-length;
      const destY=height+(s.rise ?? [.1,.6,-.45][(index+k)%3]);
      const nextCenters=[-4.1-Math.sin(index*.9+k)*1.5,4.2+Math.cos(index+k*.75)*1.35];
      const ends=dock(nextCenters,destY,destZ);
      const mid=floor((nextCenters[0]+nextCenters[1])/2,destY,destZ,Math.abs(nextCenters[1]-nextCenters[0]),2.8);
      const section={spec:s,starts,ends,sites:[],paths:[[],[]],ferry:null,returnDecks:[],danger:[],mid};
      for(let side=0;side<2;side++) {
        const a=starts[side],b=ends[side],ride=s.type==='ride';
        // Three-dimensional stepped paths have authored changes in width, height and direction.
        const count=Math.max(3,Math.round(length/3.6)-1);
        const spacing=(length-4)/count;
        for(let j=0;j<count;j++) {
          const f=(2+spacing*(j+.5))/length;
          const arch=Math.sin(f*Math.PI), sign=side?1:-1;
          const bend=ride?0:sign*arch*route.bow[side]+Math.sin(f*2*Math.PI)*Math.sin(index+k)*1.1;
          const relief=ride?0:arch*route.lift[side];
          const x=mix(a.x,b.x,f)+bend, y=mix(height,destY,f)+relief;
          let gap=0;
          if (!ride && s.type!=='paper' && s.type!=='quiet' && (j+side+k)%2===1) gap=.9+(.3*(s.rough||0));
          const deck=floor(x,y,z-f*length,ride?3.5:3.3-.25*(s.rough||0),spacing+.15-gap);
          section.paths[side].push(deck);
          if(ride) {
            deck.active=false;
            if(side===s.driver) section.returnDecks.push(deck);
          } else if(s.rough && j===count-2 && side===(k%2)) section.danger.push(deck);
        }
        const home=ride && side===s.driver?a:(s.cross?ends[1-side]:b);
        const workX=s.type==='paper'?mid.x+Math.sign(home.x-mid.x)*1.16:home.x;
        section.sites.push({x:workX,y:home.y,z:home.z+(ride&&side===s.driver?-.5:.55),kind:s.tools[side]});
      }
      if(s.type==='ride') {
        const r=1-s.driver,a=starts[r],b=ends[r];
        const m=floor(a.x,a.y-.05,a.z-3.95,3.2,3.1,s.mode);
        m.dynamic=true;
        section.ferry={deck:m,from:{x:a.x,y:a.y-.05,z:a.z-3.95},to:{x:b.x,y:b.y-.12,z:b.z+4.1}};
      }
      sections.push(section);
      z=destZ; height=destY; centers=nextCenters; starts=ends;
    }
    return {floors,sections,style};
  }
  function spawn(s) {
    return {x:s.x,y:s.y,z:s.z+.65,vx:0,vz:0,vy:0,yaw:0,ground:s,grounded:true,grace:.1,jumpBuffer:0,speed:0};
  }
  function surfaceHeight(d,x,z){
    const a=d.axes,dx=x-d.x,dz=z-d.z;
    if(!a)return Math.abs(dx)<=d.w*.5+.08&&Math.abs(dz)<=d.d*.5+.08?d.y:-Infinity;
    const det=a.ux*a.vz-a.uz*a.vx;
    const u=(dx*a.vz-dz*a.vx)/det,v=(a.ux*dz-a.uz*dx)/det;
    if(d.gap&&v>d.gap[0]&&v<d.gap[1]&&Math.abs(u)<d.w*.5-.19)return -Infinity;
    return Math.abs(u)<=d.w*.5+.08&&Math.abs(v)<=d.d*.5+.08?d.y+u*a.uy+v*a.vy:-Infinity;
  }
  function surface(world,x,z,maxY) {
    let best=null,top=-Infinity;
    for(const d of world.floors)if(d.active){
      if(!d.axes&&(d.y<=top||d.y>maxY))continue;
      const height=surfaceHeight(d,x,z);
      if(height<=maxY&&height>top){best=d;top=height;}
    }
    return best;
  }
  function move(p,input,dt,world,yaw,operating) {
    const dx=operating?0:input.x, dz=operating?0:input.z;
    const mag=Math.max(1,Math.hypot(dx,dz));
    const vx=(dx*Math.cos(yaw)+dz*Math.sin(yaw))/mag*5.9;
    const vz=(dz*Math.cos(yaw)-dx*Math.sin(yaw))/mag*5.9;
    const accel=1-Math.exp(-(p.grounded?18:7)*dt);
    p.vx=mix(p.vx,vx,accel);p.vz=mix(p.vz,vz,accel);
    p.speed=Math.hypot(p.vx,p.vz);
    if(p.speed>.1) {
      const angle=Math.atan2(-p.vx,-p.vz)-p.yaw;
      p.yaw+=Math.atan2(Math.sin(angle),Math.cos(angle))*Math.min(1,dt*15);
    }
    if(input.jump&&!operating)p.jumpBuffer=.14;
    if(p.jumpBuffer>0 && p.grace>0){
      p.vy=7.2;p.grace=p.jumpBuffer=0;p.grounded=false;p.ground=null;
    }
    p.jumpBuffer-=dt;
    const oldY=p.y;
    p.x+=p.vx*dt;p.z+=p.vz*dt;p.vy-=19.5*dt;p.y+=p.vy*dt;
    const floor=surface(world,p.x,p.z,oldY+(p.grace>0&&p.vy<=0?.48:.055));
    const top=floor?surfaceHeight(floor,p.x,p.z):-Infinity;
    const descending=floor?.axes&&p.ground===floor&&p.grounded&&oldY-top<.40;
    if(floor && p.vy<=0 && (p.y<=top+.012||descending)) {
      p.y=top;p.vy=0;p.ground=floor;p.grounded=true;p.grace=.095;
    } else {p.grounded=false;p.ground=null;p.grace-=dt;}
  }
  return {build,spawn,move,surfaceHeight,surface,clamp,mix};
})();
