// Moving hazards and recoverable platform challenges within the working harbour.
const TidePassage = (() => {
  const TAU=Math.PI*2;
  function build(g){
    g.crossings=[];
    if(g.world.lantern){g.solidSites=[];return;}
    g.solidSites=g.world.sections.flatMap(section=>section.tram?[]:section.sites.concat(section.field?.sites||[]));
    const act=Math.floor(g.index/3);
    for(let stage=0;stage<g.world.sections.length;stage++){
      const section=g.world.sections[stage],s=section.spec;
      if(s.type==='ride'||s.type==='paper'||s.type==='quiet')continue;
      for(let i=0;i<2;i++){
        const path=section.paths[i];
        // Preserve the junction that leads to the observation gallery.
        const candidates=path.filter((d,j)=>!section.field || j!==Math.floor(path.length*.5));
        if(candidates.length===0)continue;
        const d=candidates[(stage+i)%candidates.length];
        const amplitude=s.rough===2?1.24:s.rough?.86:.58;
        const type=act===0?'pontoon':act===1?'float':act===2?'sling':'carriage';
        d.dynamic=true;
        g.crossings.push({stage,side:i,deck:d,x:d.x,y:d.y,z:d.z,type,amplitude,phase:stage*1.2+i*2.35});
      }
    }
  }
  function update(g) {
    for(const c of g.crossings){
      const d=c.deck,w=Math.sin(g.time*(c.type==='carriage'?.78:.95)+c.phase);
      const x=c.x+w*c.amplitude*(c.type==='float'?.25:1);
      const y=c.y+Math.sin(g.time*1.14+c.phase)*(.14+(c.type==='float'?.24:0));
      for(const p of g.players)if(p.ground===d){p.x+=x-d.x;p.y+=y-d.y;}
      d.x=x;d.y=y;
    }
  }
  // Push occupants out of the solid casings. The control ring is in front of each panel.
  function collide(g,p){
    if(!p.grounded)return;
    const c=g.section.tram;
    if(c&&p.ground===c.deck){
      const x=p.x-c.deck.x,z=p.z-c.deck.z;
      // The tin sits on one narrow central desk. The two exits flank it.
      if(Math.abs(x)<.96&&z<-.32&&z>-1.40){
        const xGuard=.96-Math.abs(x),zGuard=Math.min(-.32-z,z+1.40);
        if(xGuard<zGuard){p.x=c.deck.x+(x<0?-.96:.96);p.vx=0;}
        else{p.z=c.deck.z+(z>-.86?-.32:-1.40);p.vz=0;}
      }
      if(c.departed&&!c.arrived){
        p.x=c.deck.x+Math.max(-2.08,Math.min(2.08,p.x-c.deck.x));
        p.z=c.deck.z+Math.max(-1.62,Math.min(1.64,p.z-c.deck.z));
      }
    }
    for(const site of g.solidSites){
      if(Math.abs(p.y-site.y)>.6)continue;
      const dx=p.x-site.x,dz=p.z-site.z+.95,d=Math.hypot(dx,dz);
      if(d>=.46)continue;
      const nx=d>.001?dx/d:0,nz=d>.001?dz/d:1;
      p.x=site.x+nx*.46;p.z=site.z-.95+nz*.46;
      const toward=p.vx*nx+p.vz*nz;
      if(toward<0){p.vx-=toward*nx;p.vz-=toward*nz;}
    }
  }
  return {build,update,collide};
})();
