// Physical stops, loading landings and controls for the cliff lift and pump wells.
const TideRigging=(()=>{
  const clamp=(n,lo,hi)=>Math.max(lo,Math.min(hi,n));
  const signs=['双斜线','圆环','三角'];
  function build(world){
    for(const [k,sec] of world.sections.entries()){
      const s=sec.spec;
      if(s.mode!=='basket'&&s.mode!=='raft')continue;
      const rider=1-s.driver,dock=sec.ends[rider],f=sec.ferry;
      sec.sites[rider].x+=rider?1.18:-1.18;
      const slot=s.mode==='basket'?[1,2,0][k]:[0,2,1][k];
      const ledge={x:dock.x+(slot-1)*1.55,y:dock.y,z:dock.z+3.38,
        w:s.mode==='basket'?1.78:1.96,d:1.75,kind:s.mode==='basket'?'bridge':'pump',active:true};
      world.floors.push(ledge);
      if(s.mode==='basket')sec.returnDecks.forEach((slab,j,all)=>{
        const fromNear=j<Math.ceil(all.length/2),base=fromNear?all[0]:all.at(-1);
        slab.kind='ladder';slab.w=2.05;slab.hinge=0;slab.unlocked=false;
        slab.hingeDirection=fromNear?-1:1;
        slab.hingeZ=base.z-slab.hingeDirection*base.d*.50;
        slab.hingeX=base.x;
      });
      f.to.z=dock.z+6.5;f.to.x=ledge.x+(k===1?-.48:.30);
      sec.rig={slot,ledge,marks:[0,1,2].map(n=>({x:dock.x+(n-1)*1.55,y:dock.y+1.06,z:dock.z+2.56}))};
    }
  }
  function reset(g){
    if(!g.section.rig)return null;
    if(g.spec.mode==='raft'){
      const f=g.section.ferry;
      g.cues.basin=f.from.y-.38;
      g.cues.basinBounds=[(f.from.x+f.to.x)*.5,(f.from.z+f.to.z)*.5,2.48,(Math.abs(f.from.z-f.to.z)+3.84)*.5];
    }
    return {aim:0,lit:false,landed:false,lightOn:false,wrong:-1,reversing:false,
      lift:0,water:g.section.ferry.from.y-.38,flow:0,guider:false,opened:false};
  }
  function lighting(g,side,input){
    return g.spec.mode==='basket' && side!==g.spec.driver && !g.rig.lit && input.use&&
      g.players[side].ground===g.section.ferry.deck;
  }
  function ray(g){
    const sec=g.section,p=g.players[1-g.spec.driver],marks=sec.rig.marks;
    return {eye:[p.x,p.y+1.58,p.z-.06],at:[marks[1].x+g.rig.aim,marks[1].y,marks[1].z]};
  }
  function moveDeck(g,x,y,z){
    const deck=g.section.ferry.deck;
    for(const p of g.players)if(p.ground===deck){
      p.x+=x-deck.x;p.y+=y-deck.y;p.z+=z-deck.z;
    }
    Object.assign(deck,{x,y,z});
  }
  function recordLanding(g){
    const sec=g.section,r=1-g.spec.driver,rig=g.rig;
    if(!rig.landed && (rig.lit||rig.opened) && g.players[r].ground===sec.rig.ledge){
      rig.landed=true;g.checkpoints[r]=sec.rig.ledge;g.sound(570,.13);
      g.alert(g.spec.mode==='raft'?'窗沿接住了浮架，去开另一头的旁通闸。':'横梁踩稳了。去松开折梯的棘爪。',2.5);
    }
  }
  function basket(g,input,dt,pressure,target,onCourse){
    const s=g.spec,q=g.state,sec=g.section,rig=g.rig,d=s.driver,r=1-d;
    const f=sec.ferry,aboard=g.players[r].ground===f.deck;
    rig.lightOn=lighting(g,r,input[r]);
    if(rig.lightOn){
      const p=g.players[r],mark=sec.rig.marks[1],angle=Math.atan2(p.x-mark.x-rig.aim,p.z-mark.z);
      p.yaw+=Math.atan2(Math.sin(angle-p.yaw),Math.cos(angle-p.yaw))*Math.min(1,dt*10);
    }
    if(rig.lightOn){
      rig.aim=clamp(rig.aim+input[r].x*2.15*dt,-2,2);
      if(input[r].jump){
        const selected=Math.round(rig.aim/1.55)+1;
        if(Math.abs(rig.aim-(selected-1)*1.55)>.34)g.alert('光斑还没落在反光牌上');
        else if(selected!==sec.rig.slot){rig.wrong=g.time;g.alert('这个记号和绞盘铭牌不合，再问一次同伴');g.sound(165,.12);}
        else{rig.lit=true;g.sound(630,.18);g.alert('落点反光牌已锁定，绞盘可以越过限位');}
      }
    }
    if(g.engaged[d]){
      if(input[d].jump)rig.reversing=!rig.reversing;
      rig.lift=clamp(rig.lift-input[d].z*.95*dt,-1.1,1.8);
      if((aboard||q.ferry>.005)&&onCourse){
        const limit=rig.lit?1:.42;
        q.ferry=clamp(q.ferry+dt*(rig.reversing?-.22:.16),0,limit);
      }
    }
    const t=q.ferry,blend=t*t*(3-2*t),wind=Math.sin(g.time*1.48);
    const swing=(s.swing||.35)*wind*Math.sin(Math.PI*t*.65);
    const drop=[.22,1.52,1.23][g.stage]*blend;
    const y=f.from.y+(f.to.y-f.from.y)*blend+Math.sin(Math.PI*t)*.9+rig.lift-drop;
    moveDeck(g,f.from.x+(f.to.x-f.from.x)*blend+swing,y,f.from.z+(f.to.z-f.from.z)*blend);
    const gap=sec.rig.ledge.y-y, cm=Math.round(gap*100),sign=signs[sec.rig.slot];
    g.set(d,!rig.lit?'把绞盘上的着陆记号报给同伴':'左右稳张力，前推升篮、后拉降篮。确认键切换收放',{
      vis:'dial',value:pressure,caption:'铭牌 '+sign+'　·　张力 '+Math.round(pressure*100)+'%　·　'+(rig.reversing?'收回':'放出')+' '+Math.round(t*100)+'%'});
    const selected=Math.round(rig.aim/1.55)+1;
    const spot=Math.abs(rig.aim-(selected-1)*1.55)<.34?signs[selected]:'牌间';
    const riderText=!rig.lit?(aboard?'按住操作键照向横梁，左右移光，确认同伴报出的记号':'先跳进吊篮，站稳后打开头灯'):
      rig.landed?'沿横梁去松开折梯棘爪':t<.84?'向同伴报出张力，让吊篮靠岸':gap>.90?'篮底偏低，请同伴升篮后再跳':'看准亮起的横梁，松开操作键，向前跳出吊篮';
    g.set(r,riderText,{vis:rig.lit?'dial':'',value:pressure,target,band:.18,
      caption:!rig.lit?'头灯 '+(rig.lightOn?spot:'关'):'所需张力 '+Math.round(target*100)+'%　·　横梁比篮底'+(cm>=0?'高 ':'低 ')+Math.abs(cm)+' cm'});
    recordLanding(g);
  }
  function pump(g,input,dt){
    const s=g.spec,q=g.state,sec=g.section,rig=g.rig,d=s.driver,r=1-d;
    const f=sec.ferry,aboard=g.players[r].ground===f.deck, sill=sec.rig.ledge.y;
    if(aboard&&input[r].use&&!rig.guider){rig.guider=true;g.sound(450,.13);g.alert('浮架导索已锁。给泵房报窗台刻度。');}
    const upstream=Math.sign(f.to.y-f.from.y);
    // A reversible valve retains its water level at neutral. A separate guide line
    // hauls the float horizontally only while its rail shoes fit the window.
    const valve=g.engaged[d]?clamp(input[d].x,-1,1):0;
    rig.flow+=(valve-rig.flow)*(1-Math.exp(-dt*5));
    if(rig.guider)rig.water=clamp(rig.water+rig.flow*.96*dt,Math.min(f.from.y,sill)-1.68,Math.max(f.from.y,sill)+1.02);
    const deckY=rig.water+.38+.045*Math.sin(g.time*1.52),gap=sill-deckY;
    const fit=Math.abs(gap)<.36;
    if(rig.guider&&aboard&&input[r].use){
      if(input[r].z>.55)q.ferry=clamp(q.ferry-dt*.21,0,1);
      else q.ferry=clamp(q.ferry+dt*.22,0,fit||rig.opened?1:Math.max(.50,q.ferry));
    }
    if(fit&&q.ferry>.77&&!rig.opened){rig.opened=true;g.sound(560,.12);g.alert('浮架导轮穿过水窗，窗闩已开');}
    const t=q.ferry,fraction=t*t*(3-2*t);
    moveDeck(g,f.from.x+(f.to.x-f.from.x)*fraction,deckY,f.from.z+(f.to.z-f.from.z)*fraction);
    g.cues.basin=rig.water;
    const cm=Math.round(gap*100);
    g.set(d,rig.guider?'左右转阀，向左排水、向右注水。松开方向键即封阀':'等同伴在浮架上锁住导索',{
      vis:'dial',value:.5+rig.flow*.47,target:.5,band:.08,caption:(rig.flow<-.08?'排水':rig.flow>.08?'注水':'封阀')+'　·　井尺 '+Math.round(rig.water*100)+' cm'});
    g.set(r,rig.landed?'沿上廊去开旁通闸':!aboard&&q.ferry<.76?'从井口跳上浮架，按住操作键扣紧导索':rig.opened&&q.ferry>.93?'松开导索，从浮架向前跳上窗沿':
      !fit?'按住导索，告诉同伴该'+(gap>0?'注水升高':'排水降低')+'多少':'刻线齐平。让同伴封阀，按住导索把浮架拖过窗口',{
        vis:'dial',value:clamp(.5-gap*.25,0,1),target:.5,band:.09,
        caption:'窗沿比浮架'+(cm>=0?'高 ':'低 ')+Math.abs(cm)+' cm　·　导索 '+Math.round(q.ferry*100)+'%　·　'+(upstream>0?'高窗':'低窗')});
    recordLanding(g);
  }
  function lower(slab){
    if(slab.hinge===undefined)slab.active=true;
    else slab.unlocked=true;
  }
  function updateLadders(section,dt){
    for(const slab of section.returnDecks)if(slab.unlocked && slab.hinge<1){
      slab.hinge=Math.min(1,slab.hinge+dt*1.48);
      slab.active=slab.hinge===1;
    }
  }
  function fall(g){
    const rig=g.rig;
    if(!rig||rig.landed)return;
    g.state.ferry=0;rig.lift=0;rig.reversing=false;rig.flow=0;rig.guider=false;rig.opened=false;
    const f=g.section.ferry;rig.water=f.from.y-.38;moveDeck(g,f.from.x,f.from.y,f.from.z);
  }
  return {build,reset,lighting,ray,basket,pump,fall,signs,lower,updateLadders};
})();
