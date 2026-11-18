// The landward side of the first breakwater has a gravity shutter and a battery receiver.
const TideLandfall=(()=>{
  const {clamp,spawn}=TideTraversal;
  const opening=1.82,doorZ=-7.5,notch=2.35;
  function build(world){
    const origin=world.sections[2].mid;
    const point=(x,z,kind,label)=>({x:origin.x+x,y:origin.y,z:origin.z+z,kind,label});
    for(const [z,w,d] of [[-4.15,10.2,6.9],[-11.15,8.8,7.3]]){
      world.floors.push({...point(0,z),w,d,active:true,landfall:true});
    }
    world.landfall={origin,chain:point(-3.8,-4.34,'chain','外侧手链'),
      sill:point(.24,-6.65,'sill','防潮门'),pin:point(2.62,-8.56,'pin','内侧止回销'),
      plug:point(-1.44,-12.87,'plug','扬声器插孔'),loop:point(1.32,-12.92,'loop','接收环'),
      entry:[point(-3.3,-2.1),point(2.6,-2.1)],safe:[point(-2.8,-10.4),point(2.5,-10.4)]};
  }
  function start(g,save=true){
    const w=g.world.landfall;
    g.landfall={height:0,stroke:0,pinned:false,plugged:false,angle:-.48,strength:0,tuned:0,heard:0,receiving:false,line:-1};
    g.checkpoints=w.entry.slice();if(save)g.events.checkpoint?.(g);
    g.alert('沈遥：门销在里面。我过去接住门，你再松链。',4);
  }
  function targets(g){
    const a=g.landfall,w=g.world.landfall;
    return a.pinned?[w.plug,w.loop]:[w.chain,w.pin];
  }
  function near(g,i){
    const w=g.world.landfall,a=g.landfall,p=g.players[i],site=targets(g)[i];
    return p.grounded&&Math.hypot(p.x-site.x,p.z-site.z)<1.19&&Math.abs(p.y-site.y)<.45&&
      (a.pinned||!i||p.z<w.origin.z+doorZ-.53);
  }
  function target(g,i){
    const w=g.world.landfall,a=g.landfall,p=g.players[i];
    const t=i&&!a.pinned&&p.z>w.origin.z+doorZ+.4?w.sill:targets(g)[i];
    return {p:t,name:t.label};
  }
  function collide(g,p,oldZ){
    const w=g.world.landfall,o=w.origin,door=o.z+doorZ;
    if(p.z<o.z-14.46){p.z=o.z-14.46;p.vz=Math.max(p.vz,0);}
    // The radio cabinet meets the rear wall. Its front stays just beyond either operator's feet.
    const sideX=p.x-o.x,face=o.z-13.04;
    if(Math.abs(sideX)<2.21&&p.z<face){
      if(face-p.z<2.21-Math.abs(sideX)){p.z=face;p.vz=Math.max(0,p.vz);}
      else{const sign=sideX<0?-1:1;p.x=o.x+sign*2.21;p.vx=sign*Math.max(0,sign*p.vx);}
    }
    if(Math.abs(p.z-door)>.62)return;
    const shoulder=.27,limit=opening-shoulder,x=p.x-o.x,top=p.y-o.y+1.78;
    const inside=Math.abs(x)<=limit&&g.landfall&&g.landfall.height>=top+.05;
    if(inside)return;
    const side=oldZ>=door?1:-1;
    if(side*(p.z-door)<.48){p.z=door+side*.48;p.vz=side*Math.max(0,p.vz*side);}
  }
  function stance(g,i,dt){
    const p=g.players[i],site=targets(g)[i],k=1-Math.exp(-dt*7);
    p.x+=(site.x-p.x)*k;p.z+=(site.z-p.z)*k;
    p.yaw+=Math.atan2(Math.sin(-p.yaw),Math.cos(p.yaw))*Math.min(1,dt*12);
  }
  function strength(g){
    const w=g.world.landfall,ship=TideLookout.vessel(g,g.time);
    // A loop has two opposite lobes. Its scale is marked relative to east along the quay.
    const bearing=Math.atan2(ship[2]-w.loop.z,ship[0]-w.loop.x);
    return Math.pow(Math.abs(Math.cos(g.landfall.angle-bearing)),9);
  }
  function gate(g,inputs,dt){
    const a=g.landfall,w=g.world.landfall,previous=a.stroke;
    if(g.engaged[0]){
      a.stroke=clamp(a.stroke+inputs[0].z*dt*1.72,0,1);
      a.height=clamp(a.height+Math.max(0,a.stroke-previous)*.91,0,2.88);
      if(previous<1&&a.stroke===1)g.sound(184,.09);
    }else{
      a.stroke=Math.max(0,a.stroke-dt*1.72);
      const occupied=g.players.some(p=>Math.abs(p.z-w.origin.z-doorZ)<.53&&Math.abs(p.x-w.origin.x)<opening);
      const foot=occupied?Math.min(a.height,2.02):0;
      a.height=Math.max(foot,a.height-dt*.55);
    }
    const offset=a.height-notch,aligned=Math.abs(offset)<.17;
    g.set(0,'按住操作键。后拉收链，前推换手；握住能停，松手会溜链。',{
      vis:'dial',value:a.stroke,caption:a.stroke>.97?'手已到底　·　前推换手':'外侧手链　·　听里面报销孔'});
    const behind=g.players[1].z<w.origin.z+doorZ-.56;
    g.set(1,behind?'在门后握住止回销。让同伴收放手链，销孔对齐时确认。':'沿中线走到门前，门底越过肩高时穿过去。',{
      caption:behind?(aligned?'销孔对齐':(offset>0?'门偏高，松链降 ':'门偏低，再升 ')+Math.round(Math.abs(offset)*100)+' cm'):'门底净高 '+Math.round(a.height*100)+' cm'});
    if(g.commit(1,inputs)){
      if(!aligned){g.alert('止回销顶住了铁板。照销旁的刻线报高低。');g.sound(142,.08);return;}
      a.pinned=true;a.height=notch;g.sound(325,.19);g.checkpoints=[w.entry[0],w.safe[1]];
      g.events.checkpoint?.(g);g.alert('沈遥：销子进去了。松手，进来！',3.6);
    }
  }
  function receiver(g,inputs,dt){
    const a=g.landfall,w=g.world.landfall;
    if(!a.plugged&&g.commit(0,inputs)){
      a.plugged=true;g.checkpoints=w.safe.slice();g.events.checkpoint?.(g);g.sound(276,.12);
    }
    if(!a.receiving&&g.engaged[1])a.angle=clamp(a.angle+inputs[1].x*dt*.91,-1.38,1.38);
    a.strength=a.plugged?strength(g):0;
    if(!a.receiving){
      a.tuned=a.strength>.85&&g.engaged[1]?a.tuned+dt:0;
      if(a.tuned>.63){a.receiving=true;a.heard=0;g.events.checkpoint?.(g);}
    }
    g.set(0,a.plugged?'听扬声器里的呼叫，把清晰度报给调环的人。':'走进门，握住扬声器插头，按确认插入收听孔。',{
      vis:'dial',value:a.strength,caption:a.plugged?'扬声器　·　场强 '+Math.round(a.strength*10)+'/10':'应急干电池　·　扬声器断开'});
    g.set(1,a.receiving?'保持收听。驾驶台还不知道岸上有人。':'按住操作键，左右缓转天线环。在同伴报出最清楚的位置停住。',{
      caption:'应急收听　·　环角 '+Math.round(a.angle*180/Math.PI)+'°'});
    if(!a.receiving)return;
    a.heard+=dt;
    const idx=TideLandfallMessage.lines.reduce((n,row,i)=>a.heard>=row[0]?i:n,-1);
    if(idx!==a.line){a.line=idx;const line=TideLandfallMessage.lines[idx][1];
      g.notice='梁青：'+line;g.noticeUntil=g.time+(TideLandfallMessage.lines[idx+1]?.[0]??TideLandfallMessage.duration)-a.heard+.18;
      g.events.log?.(g.notice);
    }
    if(a.heard>=TideLandfallMessage.duration){g.alert('沈遥：她还在叫我们。去码头把发射机接上。',4);g.advance();}
  }
  function interact(g,inputs,dt){
    if(g.landfall.pinned)receiver(g,inputs,dt);else gate(g,inputs,dt);
  }
  function checkpoint(g){
    const a=g.landfall;return a?{pinned:a.pinned,plugged:a.plugged,receiving:a.receiving,angle:a.angle}:null;
  }
  function restore(g,mark){
    if(!g.world.landfall||g.stage!==2||!mark||typeof mark.pinned!=='boolean')return;
    start(g,false);const a=g.landfall,w=g.world.landfall;
    g.state.latch=true;g.state.ferry=1;g.rig.lit=g.rig.landed=true;
    for(const slab of g.section.returnDecks)Object.assign(slab,{hinge:1,unlocked:true,active:true});
    if(mark.pinned){
      a.pinned=true;a.height=notch;g.checkpoints=[w.entry[0],w.safe[1]];
      if(mark.plugged){a.plugged=true;g.checkpoints=w.safe.slice();}
      a.receiving=a.plugged&&mark.receiving===true;
      if(Number.isFinite(mark.angle))a.angle=clamp(mark.angle,-1.38,1.38);
    }
    g.players=g.checkpoints.map(spawn);
  }
  return {build,start,targets,near,target,collide,stance,interact,strength,checkpoint,restore};
})();
