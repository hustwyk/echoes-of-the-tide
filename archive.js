// Counters measure seconds of physical tape. A stretched radio copy has its own
// zero and scale. Only a pair of marks can register a reply to a mechanical sound.
const TideArchive=(()=>{
  const {clamp}=TideTraversal,seconds=15;
  const rolls=[
    {zero:.50,stretch:1.02,window:.74,pins:[
      [3.0,.48,'盒盖碰桌','再来一遍。','从盒盖碰桌的那一下开始。'],
      [9.4,.54,'两颗螺丝先后落下','我知道，是饼干盒。','再找两颗小东西先后落下的声音。']]},
    {zero:1.04,stretch:.92,window:.55,pins:[
      [3.4,.38,'单次吸合','机房试车。','值班页第一行记了单独一声吸合。'],
      [7.0,.62,'触点回弹两下','触点已合。','下一行有两枚很近的回弹印。'],
      [11.4,.46,'马达开始连续回转','灯机回转正常。','最后一行记着马达连续回转。']]},
    {zero:.40,stretch:1.17,window:.43,pins:[
      [2.8,.70,'话筒开关轻响','水尺还在涨。','先找开麦的人在报水位。'],
      [7.4,.35,'尺脚敲了三下','北线还要复测。','这一栏要听清「复测」前面那几个字。'],
      [12.0,.56,'铁柜门闩落下','原图，丙三柜。','最后找她报出草图放在哪里。']]}
  ];
  const site=(x,z,label,kind='tape')=>({x,y:0,z,label,kind});
  function layout(){
    const desks=[site(-2.05,1.60,'机房轨读带机'),site(2.05,1.60,'电台轨读带机','radio')];
    const keyRack=[site(-4.78,-3.77,'草图柜钥匙板'),desks[1]];
    const shelves=[site(-4.78,-3.48,'机房值班带'),site(4.78,-3.48,'电台值班带与记录卡')];
    const entry=[site(-2.05,5.40,'入口'),site(2.05,5.40,'入口')];
    const floor={x:0,y:0,z:.5,w:13,d:11.8,kind:'archivefloor',active:true};
    const sections=TideMissions.chapters[4].map((spec,i)=>({spec,starts:i?desks:entry,ends:desks,
      sites:desks.map(s=>({...s})),mid:floor,paths:[[],[]],returnDecks:[],danger:[],ferry:null}));
    return {floors:[floor],sections,style:'archive',archive:{desks,shelves,keyRack,floor}};
  }
  const toHead=(roll,id,t)=>id?roll.zero+t*roll.stretch:t;
  const fromHead=(roll,id,t)=>id?(t-roll.zero)/roll.stretch:t;
  function samples(g){
    const r=rolls[g.stage];
    return g.archive.head.map((v,i)=>fromHead(r,i,v));
  }
  function select(g,id,which){
    const a=g.archive;
    Object.assign(g.section.sites[id],g.world.archive[which][id]);
    if(a.location[id]!==which){g.near[id]=false;g.engaged[id]=false;}
    a.location[id]=which;
  }
  function begin(g){
    if(!g.world.archive)return;
    const ready=g.stage!==1;
    g.archive={head:[0,0],speed:[0,0],tuning:.51,count:0,pending:null,fetched:[g.stage===2,g.stage===2],mounted:[ready,ready],
      sourceLoaded:ready,memory:null,location:['desks','desks'],mistake:'',againAfter:0,review:null,keys:null,
      take:0,preview:[null,null],captions:['','']};
    for(let i=0;i<2;i++)select(g,i,ready?'desks':'shelves');
  }
  function collide(g,p){
    p.x=clamp(p.x,-6.12,6.12);p.z=clamp(p.z,-4.02,6.06);
    for(const s of g.world.archive.desks){
      const x=p.x-s.x,z=p.z-(s.z-.90),overX=1.11-Math.abs(x),overZ=.64-Math.abs(z);
      if(overX<=0||overZ<=0||p.y>1.38)continue;
      if(overX<overZ){p.x+=Math.sign(x||1)*overX;p.vx=0;}
      else{p.z+=Math.sign(z||1)*overZ;p.vz=0;}
    }
  }
  function near(g,i){
    const p=g.players[i],s=g.section.sites[i];
    return p.grounded&&Math.abs(p.y-s.y)<.4&&p.z>=s.z-.26&&Math.hypot(p.x-s.x,p.z-s.z)<1.35;
  }
  function stance(g,i,dt){
    const p=g.players[i],s=g.section.sites[i],k=1-Math.exp(-8*dt);
    const z=s.z-(g.archive.location[i]==='desks'?0:.20);
    p.x+=(s.x-p.x)*k;p.z+=(z-p.z)*k;
    p.yaw+=Math.atan2(-Math.sin(p.yaw),Math.cos(p.yaw))*k;
  }
  function closest(roll,t){
    let index=0;
    for(let n=1;n<roll.pins.length;n++)if(Math.abs(roll.pins[n][0]-t)<Math.abs(roll.pins[index][0]-t))index=n;
    return index;
  }
  function clarity(g,t){
    const a=g.archive,r=rolls[g.stage],pin=r.pins[closest(r,t)];
    return clamp(1-Math.abs(a.tuning-pin[1])/(g.stage===0?.52:.35),0,1);
  }
  function monitor(g,i){
    const a=g.archive,r=rolls[g.stage],review=a.review;
    if(a.memory)return {time:0,speed:0,quality:0};
    if(a.keys){
      const t=g.time-a.keys.replay;
      return i&&g.engaged[i]&&t<3.65?{time:11.20+t,speed:1,quality:1}:{time:seconds,speed:0,quality:1};
    }
    if(review!==null)return {time:review,speed:a.take?1:0,quality:1};
    if(!a.sourceLoaded||!g.engaged[i])return {time:0,speed:0,quality:0};
    const pre=a.preview[i],elapsed=pre?g.time-pre.when:Infinity;
    let time=samples(g)[i],speed=a.speed[i]/(i?r.stretch:1);
    if(pre&&elapsed<pre.duration){time=pre.time+elapsed;speed=1;}
    else if(pre&&elapsed<pre.duration+(pre.duration-.085)/3){
      time=pre.time+pre.duration-(elapsed-pre.duration)*3;speed=-3;
    }
    return {time,speed,quality:i?clarity(g,time):1};
  }
  function caption(g,i,head){
    const r=rolls[g.stage],timings=typeof TideArchiveMedia!=='undefined'?TideArchiveMedia[g.stage][i].events:null;
    const n=r.pins.findIndex((p,j)=>{
      const start=i&&timings?timings[j][1]:p[0],end=i&&timings?timings[j][2]+.15:p[0]+(i?1.95:1.25);
      return head.time>=start-.10&&head.time<end;
    });
    if(n<0||head.time<0||head.time>seconds)return '';
    return i?(head.quality>.64?'「'+r.pins[n][3]+'」':head.quality>.31?'……人声夹着沙沙响……':'……杂音……'):r.pins[n][2];
  }
  function markView(g,i){
    const a=g.archive,p=monitor(g,i),r=rolls[g.stage],focus=r.pins[closest(r,p.time)],delta=a.tuning-focus[1];
    const wave=typeof TideArchiveMedia!=='undefined'?TideArchiveMedia[g.stage][i].wave:null;
    const idx=clamp(Math.floor(p.time/seconds*(wave?.length||1)),0,(wave?.length||1)-1);
    return {position:clamp((Math.abs(p.speed)>.065?toHead(r,i,p.time):a.head[i])/toHead(r,i,seconds),0,1),speed:p.speed,tuning:a.tuning,
      level:Math.abs(p.speed)<.065?0:wave?(wave[idx]/255)*(i?.16+.84*p.quality:1):Math.exp(-Math.abs(p.time-focus[0])*3.8),
      marked:a.count,monitor:!!g.engaged[i],stage:g.stage,clock:g.time,delta};
  }
  function transport(g,k,dt){
    const a=g.archive,r=rolls[g.stage];
    for(let i=0;i<2;i++){
      const input=k[i],engaged=g.engaged[i];
      let target=0;
      if(engaged){
        if(i===1){a.tuning=clamp(a.tuning+input.x*dt*.42,0,1);target=-input.z*(input.z>0?2.35:1.18);}
        else target=input.x*3.1+(input.z<0?-input.z:0);
      }
      if(Math.abs(target)>.05){
        if(a.preview[i]){
          const now=monitor(g,i);if(Math.abs(now.speed)>.065)a.head[i]=toHead(r,i,now.time);
          a.preview[i]=null;
        }
        if(a.pending?.side===i)a.pending=null;
      }
      const brake=!engaged||!i&&input.z>.5;
      if(brake)target=0;
      a.speed[i]+=(target-a.speed[i])*(1-Math.exp(-dt*(brake?23:Math.abs(target)>.05?8.5:14)));
      const end=toHead(r,i,seconds);
      a.head[i]=clamp(a.head[i]+a.speed[i]*dt,0,end);
      if((a.head[i]===end&&a.speed[i]>0)||(a.head[i]===0&&a.speed[i]<0))a.speed[i]=0;
    }
  }
  function listenBack(g,i,at){
    const a=g.archive;a.speed[i]=0;a.head[i]=toHead(rolls[g.stage],i,at);
    a.preview[i]={time:Math.max(0,at-.085),when:g.time,duration:2.06};
  }
  function reject(g,message){
    const a=g.archive;
    if(a.againAfter>g.time&&a.mistake===message)return;
    a.mistake=message;a.againAfter=g.time+1.4;g.alert(message,2.4);g.sound(124,.075);
  }
  function filePair(g,n){
    const a=g.archive,p=rolls[g.stage].pins[n];
    a.count++;a.pending=null;a.mistake='';a.againAfter=g.time+1.35;
    for(let i=0;i<2;i++)listenBack(g,i,p[0]);
    g.sound(434,.085);g.events.checkpoint?.(g);
    if(a.count===rolls[g.stage].pins.length){
      if(g.stage===2){a.review=0;a.take=0;g.alert('两条轨都找回来了。两人松开压带杆，从头听完这十五秒。',4);}
      else {g.alert(g.stage===0?'沈遥：你那时明明猜对了，还要我再录一次。':'林澈：这是机房的回话。再翻面，听测潮员说了什么。',4);}
    }else g.alert('两轨对上了。'+p[2]+'　／　'+p[3],2.8);
  }
  function punch(g,keys){
    const a=g.archive,r=rolls[g.stage],lead=g.stage===2?1:0,follow=1-lead,t=samples(g);
    // A click can be parked on a different sound, but the mate must identify
    // the matching event on their own track before the grease mark becomes permanent.
    for(const i of [lead,follow]){
      if(!g.commit(i,keys))continue;
      const n=closest(r,t[i]),p=r.pins[n],err=t[i]-p[0];
      if(Math.abs(err)>r.window){reject(g,i?'回话针扎在了底噪上，倒一点再听。':'这个位置只有带底声，拨轮寻找触点。');continue;}
      if(i&&clarity(g,t[i])<.65){reject(g,'话音还听不清。留住这个位置，左右调监听头。');continue;}
      if(i===lead){
        a.pending={side:i,index:n,error:err};listenBack(g,i,p[0]);
      }else if(!a.pending)reject(g,g.stage===2?'等沈遥先在电台轨压针。':'先让林澈在机房轨压针。');
      else if(a.pending.index!==n||n!==a.count){
        a.pending=null;reject(g,'两处印记和这行记录对不上。已经配好的行仍在，听听另一处。');
      }else if(Math.abs(a.pending.error-err)>r.window*1.30)reject(g,'能听见同一组声音，但两个起点错开了半拍。倒一点再碰针。');
      else {filePair(g,n);return;}
    }
  }
  function mount(g,k){
    const a=g.archive;
    for(let i=0;i<2;i++){
      if(!a.fetched[i]){
        g.set(i,i?'从档案架取出电台值班卷和压在盒底的记录卡':'从档案架取出机房值班卷',{caption:'在架前握住操作键，再按确认'});
        if(g.commit(i,k)){a.fetched[i]=true;select(g,i,'desks');g.events.checkpoint?.(g);}
      }else if(!a.mounted[i]){
        g.set(i,i?'把电台卷装上监听台，扣紧压带轮':'带回机房值班卷，把带头穿过读头',{caption:'返回自己的读带机，握住操作键并确认'});
        if(g.commit(i,k)){a.mounted[i]=true;g.events.checkpoint?.(g);}
      }else g.set(i,'带头已经穿好，等另一轨装上再回放',{caption:'等待另一盘值班带'});
    }
    a.sourceLoaded=a.mounted.every(Boolean);
  }
  function review(g,dt){
    const a=g.archive;
    if(!a.take&&!g.engaged.some(Boolean)&&g.players.every((p,i)=>near(g,i)))a.take=1;
    if(a.take)a.review=Math.min(seconds,a.review+dt);
    const roll=rolls[g.stage];
    for(let i=0;i<2;i++){
      a.head[i]=toHead(roll,i,a.review);a.captions[i]=caption(g,i,monitor(g,i));
      g.set(i,a.take?'听完原带，记下草图柜号':'两人都松开操作键，让两盘带子同期转动',{
        vis:'archive',wave:g.stage,side:i,head:a.review,scale:i?roll.stretch:1,zero:i?roll.zero:0,clarity:1,marks:roll.pins.map(p=>p[0]),
        caption:a.captions[i]||'十五秒原带　'+a.review.toFixed(1)+' 秒'});
    }
    if(a.review>=seconds){
      setKeys(g,0,0);g.events.checkpoint?.(g);g.alert('林澈：钥匙还挂在左边。你把她说的柜号再念一次。',3.4);
    }
  }
  const columns=['甲','乙','丙'],rows=['一','二','三'];
  function setKeys(g,col,row){
    const a=g.archive;a.keys={x:col,z:row,col,row,held:false,replay:-20,accepted:false};a.review=seconds;
    select(g,0,'keyRack');
  }
  function chooseKey(g,k,dt){
    const a=g.archive,keys=a.keys,roll=rolls[g.stage];
    if(g.engaged[0]&&!keys.held){
      keys.x=clamp(keys.x+k[0].x*dt*2.0,0,2);keys.z=clamp(keys.z+k[0].z*dt*2.0,0,2);
      keys.col=Math.round(keys.x);keys.row=Math.round(keys.z);
    }
    const name=columns[keys.col]+rows[keys.row],p=monitor(g,1);
    g.set(0,keys.held?'钥匙已提起，等沈遥核对柜号':'沿钥匙板左右选列、前后选层。把录音里那把钥匙提起来',{
      caption:'钥匙牌　'+name+(keys.held?'　·　已提起':'　·　按确认提起')});
    g.set(1,keys.held?'对照原录音。按确认登记林澈手里的钥匙，向前推可重听':'按确认重放末句，把听到的柜号告诉钥匙板前的同伴',{
      vis:'archive',wave:g.stage,side:1,head:p.time,clarity:1,marks:roll.pins.map(p=>p[0]),
      caption:caption(g,1,p)||(keys.held?'林澈提起了「'+name+'」':'电台轨末段　原带可重听')});
    if(g.commit(0,k)){keys.held=!keys.held;g.sound(keys.held?496:330,.09);}
    if(g.engaged[1]&&k[1].z<-.50&&g.time-keys.replay>3.65)keys.replay=g.time;
    if(!g.commit(1,k))return;
    if(!keys.held){keys.replay=g.time;return;}
    if(keys.col!==2||keys.row!==2){
      keys.held=false;keys.replay=g.time;g.alert('这把是'+name+'。先放回去，再听一遍她报的柜号。',3.2);return;
    }
    keys.accepted=true;g.alert('沈遥：丙三，记下了。原图还在那间玻璃室里。',3);g.advance();
  }
  function readings(g){
    const a=g.archive,r=rolls[g.stage],lead=g.stage===2?1:0,n=Math.min(a.count,r.pins.length-1);
    for(let i=0;i<2;i++){
      const h=monitor(g,i),pos=samples(g)[i],stageDone=a.count===r.pins.length;
      const text=stageDone?'听这段已经配好的回放':i===lead?
        (a.pending?'位置已留住，等同伴配上另一轨':'听到起音时按确认，把印记留在磁带上'):
        (a.pending?'同伴已压针。找到对应起音，按确认配对':r.pins[n][4]);
      const cc=caption(g,i,h);a.captions[i]=cc;
      const m=markView(g,i),tail=i?(h.quality>.65?'话音清楚':m.delta<0?'调谐向右':'调谐向左'):'机房轨';
      g.set(i,text,{vis:'archive',wave:g.stage,side:i,head:Math.abs(h.speed)>.065?h.time:pos,scale:i?r.stretch:1,zero:i?r.zero:0,clarity:i?clarity(g,pos):1,marks:r.pins.slice(0,a.count).map(p=>p[0]),
        provisional:a.pending?.side===i?r.pins[a.pending.index][0]:null,
        caption:(cc||tail)+'　·　'+a.count+' / '+r.pins.length});
    }
  }
  function interact(g,k,dt){
    const a=g.archive;
    if(!a.sourceLoaded){mount(g,k);return;}
    if(a.keys){chooseKey(g,k,dt);return;}
    if(a.review!==null){review(g,dt);return;}
    if(a.count===rolls[g.stage].pins.length){readings(g);if(g.time>=a.againAfter+.75){
      if(g.stage===0&&!a.memory){TideTinMemory.create(g);g.events.checkpoint?.(g);}
      else if(!a.memory||a.memory.done)g.advance();
    }return;}
    transport(g,k,dt);punch(g,k);readings(g);
  }
  function checkpoint(g){
    const a=g.archive;if(!a)return null;
    return a.count||g.stage===1&&a.fetched.some(Boolean)?{count:a.count,fetched:a.fetched.slice(),mounted:a.mounted.slice(),...(a.memory?{takes:a.memory.takes}:{}),...(a.keys?{keyRack:true}:{})}:null;
  }
  function restore(g,m){
    const a=g.archive;if(!a||!m||!Number.isInteger(m.count))return;
    const r=rolls[g.stage];a.count=clamp(m.count,0,r.pins.length);
    if(g.stage===1){
      for(let i=0;i<2;i++){
        a.fetched[i]=a.count>0||m.fetched?.[i]===true;
        a.mounted[i]=a.fetched[i]&&(a.count>0||m.mounted?.[i]===true);
        select(g,i,a.fetched[i]?'desks':'shelves');
      }
      a.sourceLoaded=a.mounted.every(Boolean);
    }
    if(a.count){const t=r.pins[a.count-1][0];a.head=[t,toHead(r,1,t)];}
    if(a.count===r.pins.length&&g.stage===0&&Array.isArray(m.takes))TideTinMemory.create(g,m.takes);
    if(a.count===r.pins.length&&g.stage===2){if(m.keyRack===true)setKeys(g,0,0);else a.review=0;}
  }
  function shot(g,i){
    if(TideTinMemory.active(g))return TideTinMemory.shot(g,i);
    if(!g.engaged[i]&&(g.archive.review===null||g.archive.keys))return null;
    const s=g.section.sites[i],side=i?1:-1;
    if(g.archive.location[i]==='keyRack')return {eye:[s.x+.015,1.73,-3.15],at:[s.x,1.66,-4.72],fov:48,handsOnly:true};
    if(g.archive.location[i]==='shelves')return {eye:[s.x+side*.17,1.61,s.z-.38],at:[s.x,1.07,-4.50],fov:57,handsOnly:true};
    return {eye:[s.x+side*.78,2.26,s.z+.63],at:[s.x-side*.055,1.02,s.z-.85],fov:56};
  }
  return {layout,begin,collide,near,stance,interact,markView,monitor,checkpoint,restore,shot,rolls,samples,seconds};
})();
