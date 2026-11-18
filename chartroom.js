// Local axes stay fixed to the room. Each porter pushes one wheel on the wet-plan cart.
const TideGlass=(()=>{
  const {clamp}=TideTraversal,origin={x:-57,y:3.2,z:-98},limits={x:5.78,z0:-6.6,z1:6.82};
  const at=(x,z,y=0)=>({x:origin.x+x,y:origin.y+y,z:origin.z+z});
  const site=(kind,label,x,z,face=0)=>({...at(x,z),kind,label,face});
  const racks=[{x:-2.85,z:1.79,hx:2.94,hz:.26},{x:3.65,z:-1.85,hx:2.18,hz:.26}];
  const solids=[...racks,{x:0,z:5.94,hx:1.68,hz:.74},{x:0,z:-4.95,hx:1.28,hz:.43}];
  const cards=[[[.23,.67,.38],[.47,.21,.72],[.65,.49,.24]],[[.65,.49,.24],[.37,.74,.27],[.24,.53,.75]]];
  const copies=[['泵轴压力','收件票根','灯机验收联'],['潮图附件','材料领单','测深草签']];
  const captions=['验收联右缘','航测附件左缘'];
  const words=[['北线可通','灯机回转正常','侧槽已经复测'],['北线须以当潮复测','侧槽永久可通','北标已经失灵']];
  function layout(){
    const floor={...at(0,.10),kind:'glassFloor',w:12,d:13.8,active:true};
    const box=[site('cabinet','丙三柜 · 铜钥',-.82,4.48,Math.PI),site('cabinet','丙三柜 · 承托带',.82,4.48,Math.PI)];
    const stations=[site('desk','透光台 · 西侧',-1.10,-3.94),site('desk','透光台 · 东侧',1.10,-3.94)];
    const frames=[site('proof',captions[0],-4.85,-.05,Math.PI/2),site('proof',captions[1],4.85,-.05,-Math.PI/2)];
    const starts=[at(-2.1,3.49),at(2.13,3.51)],mid=at(0,-4.07);
    const sections=TideMissions.chapters[5].map((spec,k)=>({spec,mid,starts:k?stations:starts,ends:k===2?stations.slice().reverse():stations,sites:k===2?stations.slice().reverse():stations,paths:[[],[]],returnDecks:[],danger:[],ferry:null}));
    return {style:'pump',floors:[floor],sections,glass:{floor,box,stations,frames}};
  }
  function create(g){return g.world.glass?{phase:'cabinet',keyTurn:0,drawer:0,lift:.28,transfer:0,receiving:false,keyed:false,
    cart:{x:0,z:3.52,a:0,roll:0},leg:0,blocked:false,unload:0,docked:false,slide:[0,1],clipped:[false,false],stamp:false,
    mask:.09,beam:.13,rake:.45,rubs:[false,false],handExplained:false,fragment:0,entry:[0,2],signed:[false,false],voice:'',clock:0,line:-1,subtitle:'',queue:[]}:null;}
  function say(r,id){if(!r.voice){r.voice=id;r.clock=0;r.line=-1;r.subtitle='';}else if(!r.queue.includes(id)&&r.voice!==id)r.queue.push(id);}
  function narrate(g,dt){
    const r=g.glass;if(!r.voice)return;const clip=TideGlassSpeech[r.voice];
    r.clock+=dt;const i=clip.lines.findLastIndex(row=>row[0]<=r.clock);
    if(i>=0&&i!==r.line){r.line=i;r.subtitle=clip.lines[i][1];g.events.log?.(r.subtitle);}
    if(r.clock>=clip.duration){
      if(r.voice==='marginAnswer'){r.handExplained=true;snap(g);}
      r.voice='';r.subtitle='';r.clock=0;if(r.queue.length)say(r,r.queue.shift());
    }
  }
  function begin(g){
    const r=g.glass;if(!r)return;
    if(g.stage){r.docked=true;Object.assign(r.cart,{x:0,z:-3.05,a:0});r.drawer=1;r.keyed=true;r.keyTurn=1;
      r.phase=g.stage===1?'proof':'desk';if(g.stage===2){r.stamp=true;r.clipped=[true,true];}}
    g.cues.water=-3.50;
  }
  const local=(p)=>({x:p.x-origin.x,z:p.z-origin.z});
  function carried(c,x,z){const co=Math.cos(c.a),si=Math.sin(c.a);return {x:c.x+x*co+z*si,z:c.z-x*si+z*co};}
  function grip(c,i){const p=carried(c,i?.96:-.96,.67);return site('cart',i?'图车右柄':'图车左柄',p.x,p.z,c.a+(i?.48:-.48));}
  function target(g,i){
    const r=g.glass,w=g.world.glass;
    if(r.phase==='cabinet')return w.box[i];
    if(r.phase==='cart'||r.phase==='unload')return grip(r.cart,i);
    if(r.phase==='proof')return w.frames[i];
    const s=r.phase==='desk'?g.section.sites[i]:w.stations[i];return r.phase==='desk'?s:{...s,kind:r.phase,label:r.phase==='margin'?(i?'掠射灯与压纹纸':'复印遮框'):(i?'航测结论':'验收结论')};
  }
  function near(g,i){const p=g.players[i],s=target(g,i);return p.grounded&&Math.abs(p.y-s.y)<.31&&Math.hypot(p.x-s.x,p.z-s.z)<.83;}
  function stance(g,i,dt){
    const p=g.players[i],s=target(g,i),k=1-Math.exp(-11*dt);
    p.x+=(s.x-p.x)*k;p.z+=(s.z-p.z)*k;p.yaw+=Math.atan2(Math.sin(s.face-p.yaw),Math.cos(s.face-p.yaw))*k;
  }
  function collide(g,p,old){
    const now=local(p),before=local(old),margin=.22;
    now.x=clamp(now.x,-limits.x,limits.x);now.z=clamp(now.z,limits.z0,limits.z1);
    for(const o of solids){
      const dx=now.x-o.x,dz=now.z-o.z,w=o.hx+margin,d=o.hz+margin;
      if(Math.abs(dx)>=w||Math.abs(dz)>=d)continue;
      if(Math.abs(before.x-o.x)>=w-.01||Math.abs(before.z-o.z)<d-.01&&w-Math.abs(dx)<d-Math.abs(dz)){now.x=o.x+(dx<0?-w:w);p.vx=0;}
      else{now.z=o.z+(dz<0?-d:d);p.vz=0;}
    }
    const c=g.glass.cart,co=Math.cos(c.a),si=Math.sin(c.a),dx=now.x-c.x,dz=now.z-c.z;
    let u=co*dx-si*dz,v=si*dx+co*dz;
    if(Math.abs(u)<.80&&Math.abs(v)<.69){
      if(.80-Math.abs(u)<.69-Math.abs(v))u=u<0?-.80:.80;else v=v<0?-.69:.69;
      Object.assign(now,carried(c,u,v));
    }
    p.x=origin.x+now.x;p.z=origin.z+now.z;
  }
  // Four separating axes test the rotating load against the fixed drying racks.
  function fits(c){
    const co=Math.cos(c.a),si=Math.sin(c.a),ac=Math.abs(co),as=Math.abs(si),hx=.73,hz=.60;
    for(const rack of solids){
      const dx=c.x-rack.x,dz=c.z-rack.z;
      if(Math.abs(dx)<rack.hx+hx*ac+hz*as&&Math.abs(dz)<rack.hz+hx*as+hz*ac&&
        Math.abs(dx*co-dz*si)<hx+rack.hx*ac+rack.hz*as&&Math.abs(dx*si+dz*co)<hz+rack.hx*as+rack.hz*ac)return false;
    }
    for(const x of [-.96,.96]){
      const h=carried(c,x,.67);if(Math.abs(h.x)>limits.x-.03||h.z>limits.z1||h.z<limits.z0)return false;
      if(solids.some(o=>Math.abs(h.x-o.x)<o.hx+.21&&Math.abs(h.z-o.z)<o.hz+.21))return false;
    }
    return Math.abs(c.x)<5.02&&c.z>=-4.43&&c.z<5.88;
  }
  const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
  const hookHeight=r=>.34+r.drawer*.27;
  const parked=c=>Math.hypot(c.x,c.z+3.05)<.29&&Math.abs(wrap(c.a))<.18;
  const snap=g=>g.events.checkpoint?.(g);
  function cabinet(g,keys,dt){
    const r=g.glass,on=g.engaged,level=hookHeight(r);
    if(on[1])r.lift=clamp(r.lift-keys[1].z*dt*.36,0,1);
    if(!r.keyed&&on[0]){r.keyTurn=clamp(r.keyTurn+keys[0].x*dt*.60,0,1);if(r.keyTurn>=.99){r.keyed=true;say(r,'key');snap(g);g.sound(430,.09);}}
    const support=on[1]&&Math.abs(r.lift-level)<.095;
    if(!r.receiving&&r.keyed&&on[0]&&support)r.drawer=clamp(r.drawer+keys[0].z*dt*.43,0,1);
    g.set(0,r.keyed?'向后拉图屉。托带失去支撑时，停止拉动，等同伴重新托平。':'握住丙三铜钥，向右转到底。',{vis:'dial',value:r.keyed?r.drawer:r.keyTurn,caption:r.keyed?'图屉 '+Math.round(r.drawer*100)+'%　·　'+(support?'两边持平':'等承托带'):'丙三 · 锁芯'});
    g.set(1,'握住柜前托带，前后抬低，让原稿沿滑槽平稳滑出。抽屉到底后按确认接纸。',{vis:'dial',value:r.lift,target:level,band:.095,caption:r.drawer>=.997?'图匣已露出　·　确认接纸':'承托带 '+Math.round(r.lift*100)+'　·　图屉高度 '+Math.round(level*100)});
    if(r.drawer>=.997&&support&&on[0]&&g.commit(1,keys))r.receiving=true;
    if(r.receiving){
      for(let i=0;i<2;i++)g.set(i,'一起握稳托带，让湿稿沿前滚轮滑到图车上。',{caption:'纸匣移交 '+Math.round(100*r.transfer)+'%'});
      if(on.every(Boolean))r.transfer=Math.min(1,r.transfer+dt*.78);
      if(r.transfer===1){r.phase='cart';say(r,'care');g.sound(560,.08);snap(g);}
    }
  }
  function drive(g,keys,dt){
    const r=g.glass,c=r.cart,joined=g.engaged.every(Boolean);r.blocked=false;
    if(joined){
      const left=-keys[0].z,right=-keys[1].z,speed=(left+right)*1.03,turn=(right-left)*1.08;
      const a=wrap(c.a+turn*dt),x=c.x-Math.sin(a)*speed*dt,z=c.z-Math.cos(a)*speed*dt;
      if(fits({x,z,a})){c.x=x;c.z=z;c.a=a;c.roll+=speed*dt;}
      else{r.blocked=true;if(fits({...c,a}))c.a=a;}
      for(let i=0;i<2;i++){const s=grip(c,i);Object.assign(g.players[i],{x:s.x,z:s.z,yaw:s.face,speed:Math.abs(speed),vx:0,vz:0});}
      if(r.leg===0&&c.z<.67||r.leg===1&&c.z<-2.68){r.leg++;snap(g);}
    }
    const text=parked(c)?'两柄都要握住。按确认把纸匣推上灯台。':r.blocked?'车架抵住晾纸架。退一点，让另一人原地转车。':'同时前推才会直行。一边前推、一边后拉可原地转向。沿地面铜轨绕过两排晾纸架。';
    for(let i=0;i<2;i++)g.set(i,text,{caption:(i?'右':'左')+'轮　·　'+(joined?(r.leg===2?'透光台白线':r.leg?'过第二排左端':'过第一排右端'):'等两人同时握柄')});
    if(joined&&parked(c)&&(g.commit(0,keys)||g.commit(1,keys))){r.phase='unload';g.sound(510,.13);snap(g);}
  }
  function unload(g,dt){
    const r=g.glass,c=r.cart;
    if(g.engaged.every(Boolean)){
      r.unload=Math.min(1,r.unload+dt*.47);const k=1-Math.exp(-dt*4);
      c.x+=(0-c.x)*k;c.z+=(-3.05-c.z)*k;c.a+=wrap(-c.a)*k;
      if(r.unload===1){Object.assign(c,{x:0,z:-3.05,a:0});r.phase='desk';r.docked=true;snap(g);}
    }
    for(let i=0;i<2;i++)g.set(i,'握稳两只车柄，让托盘从倾斜的导轨送上透光台。',{caption:'图匣入座 '+Math.round(r.unload*100)+'%'});
  }
  function proof(g,keys,dt){
    const r=g.glass;
    for(let i=0;i<2;i++){
      if(g.engaged[i]&&!r.clipped[i])r.slide[i]=clamp(r.slide[i]+keys[i].x*dt*1.45,0,2);
      const k=Math.round(r.slide[i]);
      g.set(i,i?'在三张附件存根里找另一半。上下分布的三处裂口，必须与西墙的样张逐一接上。':'左右移样张，找机修员签过的验收联。把断边的三处凹口报给东墙的同伴。',{
        caption:captions[i]+'　'+copies[i][k]+'　·　'+(r.clipped[i]?'已夹紧，再按可松开':'确认夹紧')});
      if(g.commit(i,keys)){
        if(Math.abs(r.slide[i]-k)>.19){g.alert('样张还夹在两道刻度之间，稍移到槽口再夹。');continue;}
        r.slide[i]=k;r.clipped[i]=!r.clipped[i];g.sound(410+70*i,.08);
      }
    }
    if(!r.clipped.every(Boolean))return;
    const a=cards[0][r.slide[0]],b=cards[1][r.slide[1]];
    if(a.some((n,i)=>n!==b[i])){r.clipped=[false,false];g.alert('断口的三个纤维结对不上。保留这组位置，换一张再比。');return;}
    r.phase='desk';r.stamp=true;say(r,'seal');snap(g);
  }
  const bands=[{x:.34,mask:.40,rake:.31,word:'北线待测'},{x:.77,mask:.85,rake:.64,word:'须以当潮复测'}];
  function light(r,i){
    const b=bands[i];return clamp((r.mask-b.mask+.10)*9,0,1)*clamp(1-Math.abs(r.beam-b.x)/.23,0,1)*clamp(1-Math.abs(r.rake-b.rake)/.22,0,1);
  }
  function explainHand(r){say(r,'marginAsk');say(r,'marginAnswer');}
  function margin(g,keys,dt){
    const r=g.glass,i=r.fragment,b=bands[i];
    if(g.engaged[0])r.mask=clamp(r.mask+keys[0].x*dt*.4,0,1);
    if(g.engaged[1]){r.beam=clamp(r.beam+keys[1].x*dt*.47,0,1);r.rake=clamp(r.rake-keys[1].z*dt*.40,0,1);}
    const n=light(r,i);
    g.set(0,'向右推开复印遮框，确认挡光边已经越过要读的纸纹，再握住不动。',{caption:'原件露出 '+Math.round(r.mask*100)+'%　·　已拓 '+i+' / 2'});
    g.set(1,'左右沿纸缘扫灯，前后改变入射角。凹下去的一行变清楚后，按确认拓印。',{caption:n>.55?b.word:r.mask<b.mask?'还有一截压在框下':Math.abs(r.beam-b.x)>.095?'沿纸边寻找下一行':r.rake<b.rake?'抬高手灯，让影子变短':'压低手灯，让笔槽投影'});
    if(g.commit(1,keys)){
      if(!g.engaged[0]||n<.56){g.alert('拓印缺笔。请同伴稳住遮框，把掠射灯移回字槽。');return;}
      r.rubs[i]=true;g.sound(560+i*70,.11);
      if(i===0)r.fragment=1;
      else{
        r.phase='record';explainHand(r);
      }
      snap(g);
    }
  }
  function record(g,keys,dt){
    const r=g.glass;
    for(let i=0;i<2;i++){
      if(g.engaged[i]&&!r.signed[i])r.entry[i]=clamp(r.entry[i]+keys[i].x*dt*1.65,0,2);
      const selected=Math.round(r.entry[i]);g.set(i,i?'给梁青写航测结论。只签你刚从纸边读回来的那一句。':'给梁青写设备验收结论。核对谁签了字，验的是什么。',{caption:words[i][selected]+'　·　'+(r.signed[i]?'已署名':'左右选句，确认署名')});
      if(g.commit(i,keys)&&!r.signed[i]){
        if(selected!==(i?0:1)){g.alert(i?'那句话超出了潮图原稿。对照纸边的两条拓印。':'这个结论不在灯机验收印下。再看左侧留样。');continue;}
        r.entry[i]=selected;r.signed[i]=true;snap(g);g.sound(518,.10);
      }
    }
    if(r.signed.every(Boolean)&&!r.voice)g.advance();
  }
  function registered(g){const r=g.glass;if(g.stage<2){g.advance();return;}r.phase='margin';say(r,'margin');snap(g);}
  function interact(g,keys,dt){
    const r=g.glass;
    switch(r.phase){
      case 'cabinet':cabinet(g,keys,dt);break;
      case 'cart':drive(g,keys,dt);break;
      case 'desk':TidePaper.interact(g,keys,dt);break;
      case 'unload':unload(g,dt);break;
      case 'proof':proof(g,keys,dt);break;
      case 'margin':margin(g,keys,dt);break;
      case 'record':record(g,keys,dt);break;
    }
  }
  function checkpoint(g){
    const r=g.glass;if(!r||(!g.stage&&!r.keyed))return null;
    const p=g.paper;
    return {stage:g.stage,phase:r.phase,keyed:r.keyed,drawer:r.drawer,lift:r.lift,cart:{...r.cart},unload:r.unload,leg:r.leg,stamp:r.stamp,rubs:r.rubs.slice(),handExplained:r.handExplained,signed:r.signed.slice(),entry:r.entry.slice(),
      mask:r.mask,beam:r.beam,rake:r.rake,paper:p.pinned?{angle:p.angle,offset:p.offset.slice(),light:p.light}:null};
  }
  const num=(n,lo,hi,f)=>Number.isFinite(n)?clamp(n,lo,hi):f;
  function restore(g,s){
    if(!g.glass||s?.stage!==g.stage||!['cabinet','cart','unload','desk','proof','margin','record'].includes(s.phase))return;
    const r=g.glass,phases=[['cabinet','cart','unload','desk'],['proof','desk'],['desk','margin','record']];
    if(!phases[g.stage].includes(s.phase))return;
    r.phase=s.phase;r.keyed=s.keyed===true;r.keyTurn=r.keyed?1:0;r.drawer=num(s.drawer,0,1,r.keyed?1:0);r.lift=num(s.lift,0,1,.43);
    r.unload=num(s.unload,0,1,0);r.docked=g.stage>0||r.phase==='desk';r.leg=num(s.leg,0,2,0);r.stamp=g.stage===2||s.stamp===true;
    if(r.docked)Object.assign(r.cart,{x:0,z:-3.05,a:0});
    else if(s.cart&&['x','z','a'].every(k=>Number.isFinite(s.cart[k]))&&fits(s.cart))Object.assign(r.cart,{x:s.cart.x,z:s.cart.z,a:wrap(s.cart.a)});
    if(r.stamp){r.slide=[2,0];r.clipped=[true,true];}
    if(g.stage===2){r.rubs=[s.rubs?.[0]===true,s.rubs?.[1]===true];r.fragment=r.rubs[0]?1:0;
      for(const key of ['mask','beam','rake'])r[key]=num(s[key],0,1,r[key]);
      r.signed=[s.signed?.[0]===true,s.signed?.[1]===true];r.entry=[0,1].map(i=>num(s.entry?.[i],0,2,i?2:0));}
    if(r.phase==='record'){r.handExplained=s.handExplained===true;if(!r.handExplained)explainHand(r);}
    if(s.paper&&r.docked){const p=g.paper;p.angle=num(s.paper.angle,-.65,.65,0);p.pinned=true;
      const [dx,dy]=TidePaper.residual(p,p.pin);p.offset[0]-=dx;p.offset[1]-=dy;p.light=num(s.paper.light,0,1,p.lightTarget);}
    g.checkpoints=[target(g,0),target(g,1)];g.players=g.checkpoints.map((s,i)=>({...TideTraversal.spawn(s),x:s.x,z:s.z,ground:g.world.glass.floor,yaw:s.face}));
  }
  const ending=['admit','reply','undecided','offer'];
  const filmLength=()=>ending.reduce((n,id)=>n+TideGlassSpeech[id].duration+.23,.35);
  function film(time){
    if(time<.25)return {voice:'',clock:0,subtitle:'',actor:0};
    let clock=time-.25;
    for(const voice of ending){const c=TideGlassSpeech[voice];
      if(clock<c.duration+.23){const row=c.lines.findLast(l=>l[0]<=clock);
        return {voice:clock<c.duration?voice:'',clock,subtitle:row?.[1]||'',actor:voice==='admit'?0:voice==='offer'?-1:1};}
      clock-=c.duration+.23;
    }
    return {voice:'',clock:0,subtitle:'',actor:-1};
  }
  return {film,filmLength,layout,origin,at,create,begin,narrate,target,near,stance,collide,grip,carried,fits,parked,hookHeight,interact,registered,checkpoint,restore,light,cards,copies,words,bands,racks};
})();
