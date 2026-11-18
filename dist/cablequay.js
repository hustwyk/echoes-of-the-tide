// The first powered link to the ferry runs between a wave-washed apron and a dry service gallery.
const TideCableQuay=(()=>{
  const {clamp}=TideTraversal,upper=2.65;
  const postZ=[1.4,-1.2,-3.8],windowZ=[-24.5,-26.7,-28.9],words=['长 短','短 长','短 短'];
  const durations=[[.72,.22],[.22,.72],[.22,.22]];
  const point=(x,y,z)=>({x,y,z});
  const site=(kind,label,x,y,z,index=0)=>({kind,label,x,y,z,index});
  const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
  function layout(){
    const floors=[];
    function slab(kind,x,y,z,w,d){const obj={kind,x,y,z,w,d,active:true};floors.push(obj);return obj;}
    const west=slab('cableQuay',-3.35,0,-1.23,4.1,14.54);
    slab('cableWash',-4.12,-.32,-9.72,3.18,3.46);
    slab('cableWash',-4.0,.04,-12.57,3.18,2.95);
    const float=slab('cableFloat',-3.50,-.17,-15.31,2.52,2.0);
    slab('cableWash',-3.55,.41,-22.86,3.50,2.78);
    slab('cableQuay',-3.35,.45,-28.12,4.12,8.16);
    const east=slab('cableGallery',3.48,upper,-13.14,3.18,38.10);
    const w={float,key:site('key','干线试灯键',-3.35,0,-1.41),
      posts:postZ.map((z,i)=>site('post','回闪插口 '+(i+1),3.70,upper,z+.55,i)),
      head:site('lead','取水线接头',-3.52,0,-7.14),
      saddles:[site('saddle','第一道瓷鞍',-4.0,.04,-12.00,0),site('saddle','第二道瓷鞍',-4.48,.41,-22.20,1)],
      eyes:[point(-4.0,.99,-12.55),point(-4.48,1.36,-22.75)],
      drum:site('drum','上廊放线筒',3.30,upper,-10.58),
      lamp:site('lamp','吊臂检修灯',-3.35,.45,-21.60),
      windows:windowZ.map((z,i)=>site('window','吊臂后窗 '+(i+1),3.03,upper,z,i)),
      breaker:site('breaker','岸台电源闸',-3.35,.45,-29.20),
      mic:site('mic','岸台话筒',3.70,upper,-30.40),
      source:point(-3.54,.57,-7.52),eye:point(-3.35,1.96,-22.20)};
    // The handle grips stand in front of each casing. Keep the service aisle open beside them.
    w.fixtures=[
      [-3.35,0,-2,.39],...postZ.map(z=>[3.70,upper,z,.38]),[3.3,upper,-11.2,.51],
      [-4,.04,-12.55,.24],[-4.48,.41,-22.75,.24],[-3.35,.45,-22.2,.47],
      [-3.35,.45,-29.92,.41],[3.7,upper,-31,.52]
    ];
    const entry=[point(-3.35,0,3.20),point(3.55,upper,4.15)];
    const pairs=[[w.key,w.posts[1]],[w.saddles[1],w.drum],[w.breaker,w.mic]];
    const sections=TideMissions.chapters[1].map((spec,k)=>({spec,starts:k?pairs[k-1]:entry,
      ends:pairs[k],sites:pairs[k],mid:k?east:west,paths:[[],[]],returnDecks:[],danger:[],ferry:null}));
    TideWarping.build(w);
    return {floors,sections,style:'dock',cableQuay:w};
  }
  function create(g){
    return g.world.cableQuay?{down:false,downAt:0,presses:[],signalled:false,lastSignal:-6,
      scan:-1,sample:0,survey:[false,false,false],route:-1,returns:[0,0,0],pilot:0,
      warp:TideWarping.create(),payout:1.4,hooks:0,carried:false,wet:0,contact:point(0,0,0),clearance:0,slack:0,pull:0,water:-1.55,
      scanZ:-24.3,scanY:3.07,windows:[0,0,0],exposed:0,patched:-1,blown:0,
      backTest:false,returnReady:false,returnDown:false,returnAt:0,missed:false,received:[],backLight:0,
      overhead:-1,overLine:-1,subtitle:'',power:false,radio:'idle',clock:0,line:-1}:null;
  }
  function begin(g){
    const a=g.cable;if(!a)return;
    if(g.stage===1)a.overhead=0;
    if(g.stage>0){a.signalled=true;a.route=1;}
    if(g.stage===2){TideWarping.docked(g);TideWarping.position(g,0);a.hooks=2;a.payout=fixed(g)+.45;}
    g.cues.water=a.water;
  }
  function nearest(p,places){
    return places.reduce((best,s)=>Math.hypot(p.x-s.x,p.z-s.z)<Math.hypot(p.x-best.x,p.z-best.z)?s:best,places[0]);
  }
  function target(g,i){
    const w=g.world.cableQuay,a=g.cable,p=g.players[i];
    if(g.stage===0)return i?nearest(p,w.posts):w.key;
    if(g.stage===1)return i?w.drum:TideWarping.needed(g)?TideWarping.site(g):a.carried?w.saddles[Math.min(1,a.hooks)]:a.hooks?w.saddles[a.hooks-1]:w.head;
    if(a.patched>=0)return i?(a.backTest?w.mic:w.windows[a.patched]):w.breaker;
    return i?nearest(p,w.windows):w.lamp;
  }
  function near(g,i){
    const s=target(g,i),p=g.players[i];
    if(s.kind==='warp')return TideWarping.reach(g);
    const reachable=s.kind==='window'?p.x>=2.62:s.kind==='lead'||p.z>=s.z-.48;
    return reachable&&p.grounded&&Math.abs(p.y-s.y)<.26&&Math.hypot(p.x-s.x,p.z-s.z)<(s.kind==='window'?.92:1.12);
  }
  function working(g,i,input){
    if(g.stage===1&&!i)return g.cable.carried&&near(g,0)&&(input.use||!!g.cable.warp.pass); // Grip the clamp to seat the ferrule.
    return input.use&&near(g,i);
  }
  function collide(g,p){
    for(const [x,y,z,r] of g.world.cableQuay.fixtures){
      if(p.y>y+1.46||p.y<y-.38)continue;
      const dx=p.x-x,dz=p.z-z,d=Math.hypot(dx,dz);
      if(d>=r)continue;
      const nx=d>.001?dx/d:0,nz=d>.001?dz/d:1;
      p.x=x+nx*r;p.z=z+nz*r;
      const into=p.vx*nx+p.vz*nz;
      if(into<0){p.vx-=into*nx;p.vz-=into*nz;}
    }
  }
  function pose(g,i,dt){
    const p=g.players[i],s=target(g,i),blend=1-Math.exp(-dt*9);
    p.x+=(s.x-p.x)*blend;p.z+=(s.z-p.z)*blend;
    const yaw=s.kind==='window'?Math.PI/2:s.kind==='warp'?g.world.cableQuay.float.yaw:0;
    p.yaw+=Math.atan2(Math.sin(yaw-p.yaw),Math.cos(yaw-p.yaw))*blend;
  }
  function tip(p){return point(p.x-.29*Math.sin(p.yaw),p.y+1.04,p.z-.29*Math.cos(p.yaw));}
  function anchor(g){const w=g.world.cableQuay;return g.cable.hooks?w.eyes[g.cable.hooks-1]:w.source;}
  function fixed(g){
    const w=g.world.cableQuay,a=g.cable;
    return (a.hooks>0?distance(w.source,w.eyes[0]):0)+(a.hooks>1?distance(w.eyes[0],w.eyes[1]):0);
  }
  function endpoint(g){
    const s=g.cable.warp,hand=tip(g.players[0]);
    if(!s.pass)return s.clipped?TideWarping.attach(g):hand;
    const peg=TideWarping.attach(g),u=clamp((g.time-s.handAt)/.38,0,1),smooth=u*u*(3-2*u),k=s.pass==='park'?smooth:1-smooth;
    return point(hand.x+(peg.x-hand.x)*k,hand.y+(peg.y-hand.y)*k+.085*Math.sin(Math.PI*k),hand.z+(peg.z-hand.z)*k);
  }
  function length(g){return fixed(g)+distance(anchor(g),endpoint(g));}
  function sag(chord,paid){return Math.sqrt(Math.max(0,paid*paid-chord*chord))*.44;}
  function update(g,dt){
    const a=g.cable,t=g.time,phase=t*1.21;
    a.water=-1.58+.37*Math.sin(phase)+.12*Math.sin(t*.53);g.cues.water=a.water;
    TideWarping.position(g,dt);TideWarping.narrate(g,dt);
    a.blown=Math.max(0,a.blown-dt);
    if(a.overhead>=0){
      a.overhead+=dt;
      caption(g,TideQuaySpeech.overhear,a.overhead,'overLine');
      if(a.overhead>=TideQuaySpeech.overhear.duration){a.overhead=-1;a.subtitle='';}
    }
  }
  function restrain(g){
    const a=g.cable;if(g.stage!==1||!a.carried||a.warp.clipped||a.warp.pass)return;
    const p=g.players[0],from=anchor(g),end=tip(p),free=Math.max(.40,a.payout-fixed(g));
    const dx=end.x-from.x,dz=end.z-from.z,h=Math.hypot(dx,dz),dy=end.y-from.y;
    const limit=Math.sqrt(Math.max(.12,free*free-dy*dy));
    if(h<=limit+.16)return;
    p.x=from.x+dx/h*(limit+.16);p.z=from.z+dz/h*(limit+.16)+.15;
    const pull=(p.vx*dx+p.vz*dz)/h;
    if(pull>0){p.vx-=pull*dx/h;p.vz-=pull*dz/h;}
  }
  function fall(g,i){
    const a=g.cable;if(i||!a.carried||g.stage!==1)return;
    TideWarping.lose(g);a.carried=false;a.wet=0;a.payout=fixed(g)+1.4;
    g.alert('林澈：接头挂回了上一只鞍。再给我一点余线。',3.2);
  }
  function flash(t,code){
    if(t<0)return 0;
    const u=t%2.65,[one,two]=durations[code];return u<one||u>=one+.27&&u<one+.27+two?1:0;
  }
  function pulse(g,input,dt){
    const a=g.cable,w=g.world.cableQuay,pressed=g.engaged[0];
    if(pressed&&!a.down){a.downAt=g.time;a.down=true;g.sound(428,.065);}
    if(!pressed&&a.down){
      const held=g.time-a.downAt;a.down=false;
      if(held>=.012&&held<2.8){
        const bit=held>=.46?1:0;
        a.presses.push(bit);
        if(a.presses.length===2){
          if(a.presses[0]===0&&a.presses[1]===1){
            if(!a.signalled){a.signalled=true;g.events.checkpoint?.(g);}
            a.lastSignal=g.time;a.sample=0;g.alert('试灯继电器吸合。上廊三只插座开始回闪。');
          }else g.alert('铜牌刻的是短、长。松开试灯键，再发两拍。');
          a.presses=[];
        }
      }else if(held>=2.8){a.presses=[];g.alert('长拍已经够长了。松开后重发短、长。');}
    }
    a.pilot=pressed?1:0;
    const reading=target(g,1).index;
    a.returns=durations.map((_,i)=>a.signalled?flash(g.time-a.lastSignal,i):0);
    if(a.scan!==reading||!g.engaged[1]){a.sample=0;a.scan=reading;}
    if(a.signalled&&g.engaged[1]){
      a.sample+=dt;
      if(a.sample>=2.65)a.survey[reading]=true;
    }
    const first=a.presses.length?'刚才发出'+(a.presses[0]?'长':'短')+'拍，继续第二拍':'先轻点，再按住约半秒后松手';
    g.set(0,a.signalled?'干线正在回闪。把刚才发出的两拍报给沈遥。':'在试灯键上亲手敲出铜牌的两拍。',{
      vis:'dial',value:pressed?clamp((g.time-a.downAt)/.75,0,1):0,caption:'铜牌　短 · 长　　'+(pressed?'线圈吸合':first)});
    g.set(1,'沿上廊走到不同插口，按住操作键读一轮回闪。与同伴的两拍相符再确认。',{
      vis:'dial',value:a.returns[reading],caption:'插口 '+(reading+1)+'　'+(a.survey[reading]?'回闪记录　'+words[reading]:a.signalled?'试灯 '+(a.returns[reading]?'亮':'灭'):'等待西岸送入两拍')});
    if(g.commit(1,input)){
      if(!a.survey[reading]){g.alert('先守住这一只插口，听完整轮回闪。');return;}
      if(reading!==1){a.blown=.50;g.sound(132,.10);g.alert('试验片弹回。这一路回闪和铜牌不同。');return;}
      a.route=reading;g.sound(628,.16);g.alert('沈遥：找到旧码头的回线了。线还泡在水里。');g.advance();
    }
  }
  function cable(g,input,dt){
    const a=g.cable,w=g.world.cableQuay,p=g.players[0];
    if(g.engaged[1]){
      const taut=a.carried?Math.min(a.payout,length(g)-.12):0;
      a.payout=clamp(a.payout+input[1].z*2.55*dt,Math.max(fixed(g)+.30,taut),21.0);
    }
    if(!a.carried&&near(g,0)&&input[0].use){
      a.carried=true;a.wet=0;g.sound(295,.10);g.alert('提着接头走。东廊后拉放线，前推收线。');
    }
    const paid=Math.max(0,a.payout-fixed(g)),from=anchor(g),end=a.carried?endpoint(g):from,chord=distance(from,end);
    a.slack=paid-chord;
    const hang=sag(chord,paid);let clearance=Infinity;
    for(let j=1;j<8;j++){
      const t=j/8,x=from.x+(end.x-from.x)*t,z=from.z+(end.z-from.z)*t;
      const y=from.y+(end.y-from.y)*t-hang*4*t*(1-t);
      const gap=y-a.water-TideFloating.swell(x,z,g.time);
      if(gap<clearance){clearance=gap;a.contact.x=x;a.contact.z=z;}
    }
    a.clearance=clearance;
    if(a.carried&&chord>1.5&&clearance<.10)a.wet+=dt;
    else a.wet=Math.max(0,a.wet-dt*1.8);
    a.pull=clamp((.4-a.slack)*2,0,1);
    if(a.wet>.90){
      TideWarping.lose(g);a.carried=false;a.payout=fixed(g)+1.4;a.wet=0;
      g.alert('线腹落水，接头滑回上一道托架。收短余线再提。',3.2);g.sound(149,.12);
    }
    const fitted=a.slack>=.22&&a.slack<=1.05;
    g.set(0,a.carried?'提线跑到瓷鞍前，报出松紧。留半臂余量，操作键加确认扣上鞍盖。':'沿下层湿台找到接头，按操作键提起。',{
      caption:'已挂 '+a.hooks+' / 2　·　'+(!a.carried?'接头在架':a.slack<.22?'绷紧，需要放线':a.slack>1.05?'线腹太低，请收线':'有余量，可以挂鞍')});
    g.set(1,'到上廊抓住卷筒。后拉放线让同伴往前走，前推收起要碰水的线腹。',{
      vis:'dial',value:clamp(clearance/2.6,0,1),caption:'放出 '+a.payout.toFixed(1)+' m　·　'+(a.carried?'线腹离潮面 '+Math.round(clearance*100)+' cm':'等下层提线')});
    if(TideWarping.needed(g)){TideWarping.work(g,input[0],dt);return;}
    if(a.warp.released&&p.ground===w.float){
      const rise=w.saddles[1].y-TideTraversal.surfaceHeight(w.float,p.x,p.z);
      g.set(0,rise>.83?'岸沿还高。等浪把甲板托起，松开操作再长按跳跃':'船边已接近石台。松开操作，向对岸起跳',{
        caption:'岸沿比脚下高 '+Math.round(rise*100)+' cm'});
    }else if(a.warp.returning&&p.ground===w.float)g.set(0,'接头落水了。留在甲板上，回缆会把你带回第一道鞍');
    if(a.carried&&near(g,0)&&input[0].use&&input[0].jump){
      if(!fitted){g.alert(a.slack<.22?'接头绷得扣不上。请上廊再放一点。':'余线抵住鞍盖，让上廊收半圈。');return;}
      const idx=a.hooks++;a.carried=false;a.payout=fixed(g)+.72;a.wet=0;
      g.checkpoints=[{...w.saddles[idx],x:w.saddles[idx].x+.18},w.drum];g.sound(532,.14);
      if(a.hooks===2){g.alert('林澈：线头铁圈里是个缺月。记住它，去找吊臂背面的套管。',4);g.advance();}
      else{g.events.checkpoint?.(g);g.alert('第一道鞍扣好。接头带上链渡，扣进船上的瓷夹。');}
    }
  }
  function beam(g){const a=g.cable;return [2.38,a.scanY,a.scanZ];}
  function lamps(g,input,dt){
    const a=g.cable,w=g.world.cableQuay;
    if(g.engaged[0]){
      a.scanZ=clamp(a.scanZ+input[0].x*dt*2.65,-30.1,-23.40);
      a.scanY=clamp(a.scanY-input[0].z*dt*1.55,2.7,4.98);
    }
    a.windows=windowZ.map(z=>g.engaged[0]?clamp(1-Math.hypot((z-a.scanZ)/.79,(3.85-a.scanY)/.55),0,1):0);
    const j=target(g,1).index,lit=a.windows[j]>.55&&g.engaged[1];
    a.exposed=lit?Math.min(1,a.exposed+dt*2.2):0;
    g.set(0,'抓住检修灯，左右扫灯、前后调高低。让沈遥指挥光斑停在哪扇背窗。',{
      caption:'线头套管　缺月　·　灯高 '+a.scanY.toFixed(1)+' m'});
    g.set(1,'从上廊走到吊臂背窗，把检流笔压在孔上。看清透光的记号，对上套管再接入。',{
      vis:'dial',value:a.windows[j],caption:'后窗 '+(j+1)+'　·　'+(a.exposed>=1?['圆环','三道栅','缺月'][j]:a.windows[j]>.55?'透光了':'背板无光')});
    if(!g.commit(1,input)||a.blown>0)return;
    if(a.exposed<1){g.alert('光没有照透这扇窗。给对岸报高低、前后。');return;}
    if(j!==2){a.blown=.85;g.alert('保险片弹回。这个记号和刚提上来的线头不合。');g.sound(126,.11);return;}
    a.patched=j;g.sound(676,.18);g.events.checkpoint?.(g);g.alert('两段干线接通。去岸闸送电，到话筒边等。',3.2);
  }
  function returnTest(g,dt){
    const a=g.cable;
    if(!g.engaged[1])a.returnReady=true;
    const send=a.returnReady&&g.engaged[1];
    if(send&&!a.returnDown){a.returnDown=true;a.returnAt=g.time;a.missed=!g.engaged[0];}
    if(send&&!g.engaged[0])a.missed=true;
    a.backLight=send?1:0;
    if(!send&&a.returnDown){
      a.returnDown=false;const held=g.time-a.returnAt;
      if(a.missed||!g.engaged[0]||held<.012||held>2.8){
        a.received=[];g.alert('回闪没录全。等林澈在岸闸压住检流片，再从短拍开始。');
      }else{
        a.received.push(held>=.46?1:0);g.sound(held>=.46?448:617,.08);
        if(a.received.length===2){
          a.backTest=a.received[0]===0&&a.received[1]===1;a.received=[];
          if(a.backTest){g.events.checkpoint?.(g);g.alert('林澈：短、长。两头是同一条线！我来送电。');}
          else g.alert('回码顺序不合。还是先短、再长。');
        }
      }
    }
    g.set(0,'到岸闸压住检流片，接住沈遥从背窗送回的两拍。',{
      vis:'dial',value:a.backLight,caption:'检流片 '+(g.engaged[0]?'已压紧':'待压紧')+'　·　窗口 '+(a.backLight?'亮':'灭')});
    g.set(1,'守在已接上的背窗，等林澈握好检流片。用操作键发回一次短亮、一次长亮。',{
      caption:(g.engaged[0]?'对岸检流片就位':'等对岸就位')+'　·　'+(a.returnDown?'回键已压下':a.received.length?'还差长拍':'短、长')});
  }
  function caption(g,recording,t,field){
    const a=g.cable,idx=recording.lines.findLastIndex(row=>t>=row[0]);
    if(idx===a[field])return;
    a[field]=idx;a.subtitle=idx<0?'':recording.lines[idx][1];
    if(a.subtitle)g.events.log?.(a.subtitle);
  }
  function air(g,input,dt){
    const a=g.cable;
    if(!a.power&&g.commit(0,input)){a.power=true;g.sound(566,.13);g.events.checkpoint?.(g);g.alert('发射灯亮了。现在船上能听见话筒。');}
    g.set(0,a.power?'在岸闸旁听回话。第一遍是谁听见了绿标的位置？':'到岸台电源闸握住合闸柄，确认送电。',{caption:a.power?'发射回路已上电':'只接通了线，发射机尚未上电'});
    g.set(1,a.radio==='sent'?'松开发话键，把频道交给船上。':a.radio==='reply'?'听驾驶台把手台递给后甲板。':'握住话筒，按确认呼叫海雁。说完再松开。',{
      caption:a.radio==='sending'?'发话中':a.radio==='reply'?'收听　海雁号':a.power?'岸台发射灯亮':'等待岸闸送电'});
    if(!a.power)return;
    if(a.radio==='idle'&&g.commit(1,input)){a.radio='sending';a.clock=0;a.line=-1;}
    if(a.radio==='sending'&&!g.engaged[1]){a.radio='idle';a.clock=0;a.line=-1;a.subtitle='';g.alert('发话提前断了。在话筒前把呼号说完。');return;}
    if(a.radio==='sent'&&!input[1].use){
      a.radio='reply';a.clock=0;a.line=-1;g.events.checkpoint?.(g);
    }
    if(a.radio!=='sending'&&a.radio!=='reply')return;
    const recording=TideQuaySpeech[a.radio==='sending'?'shore':'ship'];a.clock+=dt;
    caption(g,recording,a.clock,'line');
    if(a.clock>=recording.duration){
      a.subtitle='';
      if(a.radio==='sending'){a.radio='sent';g.alert('松开发话键。',1.8);}
      else{g.advance();}
    }
  }
  function interact(g,inputs,dt){
    if(g.stage===0)pulse(g,inputs,dt);else if(g.stage===1)cable(g,inputs,dt);
    else if(g.cable.patched<0)lamps(g,inputs,dt);else if(!g.cable.backTest)returnTest(g,dt);else air(g,inputs,dt);
  }
  function title(g){
    if(g.stage<2||g.cable.patched<0)return g.spec.title;
    return g.cable.backTest?'海雁，请回答':'回码验线';
  }
  function briefing(g){
    const a=g.cable;
    if(g.stage===0&&a.signalled)return '林澈：试灯正在回闪。去上廊找回了短、长的插口。';
    if(g.stage===1&&a.hooks)return '沈遥：第一道鞍还扣着。我在卷筒边，接着走。';
    if(a.radio==='reply')return '收听海雁号驾驶台。';
    if(a.power)return '沈遥：发射灯亮着，我来叫船。';
    if(a.backTest)return '林澈：回码验过了。我们可以合闸。';
    if(a.patched>=0)return '沈遥：缺月这头已经插好。我要把两拍发回去。';
    return g.spec.radio;
  }
  function checkpoint(g){
    const a=g.cable;if(!a||!a.signalled)return null;
    return {signalled:true,hooks:a.hooks,patched:a.patched,backTest:a.backTest,power:a.power,reply:a.radio==='reply'};
  }
  function restore(g,mark){
    if(!g.cable||mark?.signalled!==true)return;
    const a=g.cable,w=g.world.cableQuay;a.signalled=true;a.lastSignal=g.time;
    if(g.stage===1&&mark.hooks===1){
      a.overhead=-1;a.subtitle='';a.hooks=1;a.payout=fixed(g)+.72;g.checkpoints=[w.saddles[0],w.drum];
    }
    if(g.stage===2&&mark.patched===2){
      a.patched=2;a.backTest=mark.backTest===true||mark.power===true;a.power=mark.power===true;a.radio=a.power&&mark.reply?'reply':'idle';
      g.checkpoints=a.backTest?[w.breaker,w.mic]:[w.breaker,w.windows[2]];
    }
    g.players=g.checkpoints.map(TideTraversal.spawn);
  }
  return {layout,create,begin,target,near,working,collide,pose,update,restrain,fall,interact,title,briefing,checkpoint,restore,tip,anchor,fixed,length,endpoint,sag,beam,windowZ};
})();
