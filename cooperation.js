// Shared simulation for the two local players. Input edges are consumed once
// per simulation tick, including when a long video frame requires substeps.
const TideCoop = (() => {
  const {clamp,mix}=TideTraversal;
  const TAU=2*Math.PI;
  const percent=v=>Math.round(v*100)+'%';
  const near=(p,site)=>p.grounded && Math.hypot(p.x-site.x,p.z-site.z)<1.85 && Math.abs(p.y-site.y)<.65;
  const roleKeys=[{use:'E',jump:'空格',trim:'A / D'},{use:'Enter',jump:'/',trim:'← / →'}];
  function instrument(text,options={}) {
    return {text,vis:'',value:0,target:null,band:.05,caption:'',...options};
  }
  function approachInstrument(g,side,site,dt){
    const p=g.players[side];
    let x=site.x,z=site.z-.42;
    if(site.kind==='winch'){x+=.65;z-=.19;}
    if(site.kind==='brake')x-=.21;
    if(site.kind==='pump'){x+=.22;z-=.092;}
    if(site.kind==='wheel')z-=.065;
    if(g.spec.type==='paper'&&g.field.done){
      const table=TidePaper.board(g);
      x=table.x+(side===g.paper.holder?clamp(g.paper.pin[0]*.84,-.62,.43):.81);z=table.z+.37;
    }
    const k=1-Math.exp(-7*dt);
    // Walk the last fraction of a metre into the working stance on the same landing.
    const dx=x-p.x,dz=z-p.z,step=Math.min(k,2.3*dt/(Math.hypot(dx,dz)||1));
    const nx=p.x+dx*step,nz=p.z+dz*step;
    const floor=TideTraversal.surface(g.world,nx,nz,p.y+.15);
    if(floor&&Math.abs(floor.y-p.y)<.16){p.x=nx;p.z=nz;}
    p.yaw+=Math.atan2(Math.sin(-p.yaw),Math.cos(p.yaw))*Math.min(1,dt*12);
  }
  class Session {
    constructor(index,events={}) {
      this.index=index;this.world=index===3?TideCistern.layout():index===5?TideGlass.layout():index===10?TideFogSignal.layout():index===8?TideSoundings.layout():index===7?TideRelay.layout():index===1?TideCableQuay.layout():index===2?TideSignal.layout():index===4?TideArchive.layout():index===9?TideLantern.layout():TideTraversal.build(index);this.events=events;
      if(index===0){TideLandfall.build(this.world);TideFenders.build(this.world);}
      TideRigging.build(this.world);TideDrawbridge.build(this.world);if(index===6)TideSwing.build(this.world);if(!this.world.cistern&&!this.world.glass&&!this.world.foghouse&&!this.world.soundings&&!this.world.relay&&!this.world.cableQuay&&!this.world.lantern&&!this.world.signal&&!this.world.archive)TideFieldWork.build(this.world,index);
      this.time=0;this.stage=0;this.setbacks=0;this.complete=false;this.notice='';this.noticeUntil=0;
      this.cues={light:0,angle:0,water:-4,rescue:0,ghost:0};
      this.swing=TideSwing.create(this);this.cistern=TideCistern.create(this);this.glass=TideGlass.create(this);this.fog=TideFogSignal.create(this);this.survey=TideSoundings.create(this);this.relay=TideRelay.create(this);this.cable=TideCableQuay.create(this);this.signal=TideSignal.create(this);
      this.players=this.world.sections[0].starts.map(TideTraversal.spawn);
      this.checkpoints=this.world.sections[0].starts.slice();TidePassage.build(this);this.fenders=TideFenders.create(this);
      this.begin();
    }
    get section(){return this.world.sections[this.stage];}
    get spec(){return this.section.spec;}
    begin() {
      if(this.fenders&&this.stage>0){this.fenders.phase='done';this.fenders.ladder=1;}
      this.station=[instrument(''),instrument('')];
      this.near=[false,false];this.engaged=[false,false];this.ready=[false,false];
      this.state={dials:[.5,.5],yes:[false,false],age:0,hold:0,ferry:0,latch:false,doneAt:null,
        pulse:0,pulseAt:-10,nextShot:0,received:0,choice:0,word:null,mode:0,mark:-8,readAt:-8,
        returnGate:0,balance:0,warnUntil:0,buttonCooldown:0,releaseHeld:false,catchup:0};
      if(this.spec.type==='ride')this.state.dials[this.spec.driver]=.50;
      this.rig=TideRigging.reset(this);this.paper=TidePaper.create(this);this.optic=TideLantern.create(this);
      if(this.optic){this.cues.light=.97;this.cues.rays=TideLantern.viewData(this).images;}TideFieldWork.reset(this);TideCableQuay.begin(this);TideLookout.reset(this);TideRelay.begin(this);TideSoundings.begin(this);TideGlass.begin(this);TideCistern.begin(this);TideSwing.begin(this);TideFogSignal.begin(this);TideLastPass.begin(this);this.pilotHorn=TideFogSignal.formal(this);TideSignal.begin(this);TideArchive.begin(this);
      this.events.stage?.(this);
    }
    alert(text,seconds=2.5) {
      if(this.notice===text && this.noticeUntil>this.time)return;
      this.notice=text;this.noticeUntil=this.time+seconds;
      this.events.alert?.(text);
    }
    resetPerson(side,cause) {
      Object.assign(this.players[side],TideTraversal.spawn(this.checkpoints[side]));
      this.setbacks++;this.events.reset?.(side);this.alert(cause+' · 已回到安全台');
      if(this.swing)TideSwing.reset(this,side);
      if(this.cistern)TideCistern.fall(this,side);
      if(this.cable)TideCableQuay.fall(this,side);
      if(this.section.tram?.departed){
        const c=this.section.tram;Object.assign(this.players[side],TideTraversal.spawn(c.deck),{x:c.deck.x+(side?.72:-.72)});
      }
      if(this.spec.type==='ride'&&!this.state.latch && side!==this.spec.driver) {
        if(this.rig)TideRigging.fall(this);
        else if(this.section.span)TideDrawbridge.catchRider(this,side);
      }
    }
    advance() {
      if(this.state.doneAt!==null)return;
      this.state.doneAt=this.time;this.events.success?.(this);
    }
    tick(dt,inputs,yaws=[0,0]) {
      if(this.complete)return;
      this.time+=dt;if(this.world.fenders)TideFloating.step(this.world.fenders.floatPose,this.players,this.cues.water,this.time,dt);TideFenders.narrate(this,dt);if(this.swing)TideSwing.narrate(this,dt);if(this.cistern)TideCistern.narrate(this,dt);if(this.glass)TideGlass.narrate(this,dt);
      const q=this.state, section=this.section;
      q.age+=dt;TidePassage.update(this);TideRigging.updateLadders(section,dt);
      if(q.doneAt!==null && this.time-q.doneAt>1.15){
        if(this.stage+1===this.world.sections.length) {this.complete=true;this.events.finish?.(this);return;}
        this.checkpoints=section.ends.slice();this.stage++;this.begin();return;
      }
      if(TideFenders.active(this)){TideFenders.step(this,inputs,yaws,dt);return;}
      if(this.fog||this.pilotHorn)TideFogSignal.step(this,dt);
      if(this.survey)TideSoundings.step(this,dt);
      if(this.relay)TideRelay.step(this,dt);
      if(this.cable)TideCableQuay.update(this,dt);
      const transfer=TideSwing.active(this);
      const activeSites=this.field.done?section.sites:section.field.sites;
      this.near=this.players.map((p,i)=>transfer?TideSwing.near(this,i):this.cistern?TideCistern.near(this,i):this.glass?TideGlass.near(this,i):this.fog?TideFogSignal.near(this,i):this.survey?TideSoundings.near(this,i):this.relay?TideRelay.near(this,i):this.cable?TideCableQuay.near(this,i):this.landfall?TideLandfall.near(this,i):this.archive?TideArchive.near(this,i):near(p,activeSites[i]));
      if(this.signal&&this.stage===2)this.near[0]&&=this.players[0].ground===this.world.signal.head;
      const cart=this.spec.mode==='bridge'&&!section.span.seated;
      if(cart)this.near[1-this.spec.driver]=TideDrawbridge.onCart(this,1-this.spec.driver,{use:true});
      if(section.tram&&!transfer)this.near=this.near.map((v,i)=>v&&this.players[i].ground===section.tram.deck);
      this.engaged=this.near.map((ok,i)=>this.cable?TideCableQuay.working(this,i,inputs[i]):ok&&inputs[i].use);
      if(TideTransit.active(this))this.engaged[1]=true;
      if(this.signal)TideSignal.step(this,dt);
      const prevStaff=section.span?.lower?TideDrawbridge.coordinates(section.span,this.players[1-this.spec.driver]):null;
      for(let side=0;side<2;side++){
        const p=this.players[side],oldZ=p.z,oldX=p.x;
        if(transfer&&TideSwing.attached(this,side,inputs[side],dt))continue;
        if(this.relay&&!side&&TideRelay.climb(this,inputs[0],dt))continue;
        if(this.rig?.belay&&side!==this.spec.driver)continue;
        TideTraversal.move(p,inputs[side],dt,this.world,yaws[side],this.engaged[side]||TideRigging.lighting(this,side,inputs[side]));
        TidePassage.collide(this,p);
        if(this.world.landfall)TideLandfall.collide(this,p,oldZ);
        if(transfer){TideSwing.gate(this,p,oldZ);if(this.engaged[side])TideSwing.stance(this,side,dt);}
        else if(this.cistern){TideCistern.collide(this,p,oldZ);if(this.engaged[side])TideCistern.stance(this,side,dt);}
        else if(this.glass){TideGlass.collide(this,p,{x:oldX,z:oldZ});if(this.engaged[side])TideGlass.stance(this,side,dt);}
        else if(this.fog){TideFogSignal.collide(this,p);if(this.engaged[side])TideFogSignal.stance(this,side,dt);}
        else if(this.survey){TideSoundings.collide(this,p);if(this.engaged[side])TideSoundings.stance(this,side,dt);}
        else if(this.relay){
          TideRelay.collision(this,p);if(this.engaged[side])TideRelay.stance(this,side,dt);
          if(!side&&this.relay.top&&p.y<this.world.relay.upper.y-1.40)this.resetPerson(0,'桅顶安全索接住了你');
        }else if(this.cable){if(!side)TideCableQuay.restrain(this);TideCableQuay.collide(this,p);if(this.engaged[side])TideCableQuay.pose(this,side,dt);}
        else if(this.landfall){if(this.engaged[side])TideLandfall.stance(this,side,dt);}
        else if(this.archive){TideArchive.collide(this,p);if(this.engaged[side])TideArchive.stance(this,side,dt);}
        else if(this.signal){if(this.engaged[side])TideSignal.stand(this,side,dt);}
        else if(this.optic){TideLantern.collide(p);if(this.engaged[side])TideLantern.stance(this,side,dt);}
        else if(this.engaged[side]&&!(cart&&side!==this.spec.driver))approachInstrument(this,side,activeSites[side],dt);
        if(this.rig&&side!==this.spec.driver)TideRigging.catchLine(this);
        if(this.cistern&&TideCistern.submerged(this,p)){this.resetPerson(side,'救生索把你拉回上一处露水平台');}
        else if(this.fog&&!p.grounded&&p.vy<0&&p.y<this.world.foghouse.rear.y-1.65){
          this.resetPerson(side,'轮坑救生索接住了你');
          const c=this.checkpoints[side];
          if(this.world.foghouse.wheels.includes(c))Object.assign(p,{x:c.x,y:c.y,z:c.z,ground:c,grounded:true});
        }else if(this.survey&&!p.grounded&&p.vy<0&&p.y<TideSoundings.surface(p.x,p.z,this.time)-.22){
          this.resetPerson(side,'系在救生索上的尺和人一起回到检修台');
        }else if(this.cable&&!p.grounded&&p.vy<0&&p.y<this.cable.water+TideFloating.swell(p.x,p.z,this.time)-.34){
          this.cues.splash={x:p.x,z:p.z,at:this.time};
          this.resetPerson(side,'落水后，安全索把你拉了回来');
        }else if(p.y<Math.min(...section.starts.map(d=>d.y),...section.ends.map(d=>d.y))-4.2) {
          this.resetPerson(side,'安全索接住了你');
        } else if(p.ground && section.danger.includes(p.ground) && this.hazardPhase()>.78) {
          this.resetPerson(side,'浪头越过了踏板');
        }
      }
      if(prevStaff)TideDrawbridge.carry(this,inputs,dt,prevStaff);
      if(q.doneAt!==null)return;
      if(transfer){TideSwing.interact(this,inputs,dt);return;}
      if(this.cistern){TideCistern.interact(this,inputs,dt);return;}
      if(this.glass){TideGlass.interact(this,inputs,dt);return;}
      if(this.fog){TideFogSignal.interact(this,inputs,dt);return;}
      if(this.survey){TideSoundings.interact(this,inputs,dt);return;}
      if(this.relay){TideRelay.interact(this,inputs,dt);return;}
      if(this.cable){TideCableQuay.interact(this,inputs,dt);return;}
      if(this.landfall){TideLandfall.interact(this,inputs,dt);return;}
      if(this.archive){TideArchive.interact(this,inputs,dt);return;}
      if(this.optic){TideLantern.interact(this,inputs,dt);return;}
      if(this.signal){if(!TideLookout.interact(this,inputs,dt))TideSignal.interact(this,inputs,dt);return;}
      if(!TideFieldWork.interact(this,inputs,dt)&&!TideLookout.interact(this,inputs,dt))handlers[this.spec.type](this,inputs,dt);
    }
    hazardPhase(){return (this.time/(4.5-.08*this.index)+.16*this.stage)%1;}
    tune(i,input,dt,rate=.36) {
      if(this.engaged[i])this.state.dials[i]=clamp(this.state.dials[i]+input[i].x*rate*dt,0,1);
      return this.state.dials[i];
    }
    commit(side,inputs){return this.engaged[side]&&inputs[side].jump;}
    set(i,text,opts){this.station[i]=instrument(text,opts);}
    sound(f,d){this.events.sound?.(f,d);}
  }

  function ridePressure(s,travel){
    const amplitude=.27;
    return .5+amplitude*Math.sin(travel*Math.PI*2.4+(s.driver?1.2:0));
  }
  function ride(g,input,dt) {
    const s=g.spec,q=g.state,sc=g.section,d=s.driver,r=1-d;
    const rider=g.players[r];
    if(q.latch) {
      const activeRelay=(s.mode==='bridge'||s.mode==='raft'||(g.index===0&&g.stage===1));
      if(activeRelay&&q.returnGate<2){
        const halfway=(sc.starts[d].z+sc.ends[d].z)/2;
        const next=q.returnGate===0?0:1;
        const who=g.players[d];
        if(g.engaged[r] && (next===0 || who.z<=halfway+1) && input[r].jump){
          q.returnGate++;g.sound(490+q.returnGate*90,.13);
          g.alert(q.returnGate===1?'第一截落稳。到中间铆板再给同伴信号。':'第二截已锁住，可以过桥。');
        }
        const amount=q.returnGate===0?0:q.returnGate===1?Math.ceil(sc.returnDecks.length/2):sc.returnDecks.length;
        sc.returnDecks.slice(0,amount).forEach(TideRigging.lower);
        g.set(d,!q.returnGate?'回话给对岸同伴，等第一截桥面落下':'走到中间铆板，向对岸报出位置');
        g.set(r,!q.returnGate?'守住远端操作台，按跳跃键降下第一截桥面':who.z>halfway+1?'等同伴走到中间铆板':'再按一次跳跃键放下第二截桥面',{caption:'回程闸 '+q.returnGate+' / 2'});
      }else{
        sc.returnDecks.forEach(TideRigging.lower);
        g.set(d,'通道已展开，穿过桥面去找同伴');
        g.set(r,'在亮灯的平台接应同伴');
      }
      if(near(g.players[d],sc.ends[d])&&(near(rider,sc.ends[r])||near(rider,sc.sites[r]))&&(!activeRelay||q.returnGate===2)){
        if(g.world.landfall&&g.stage===2)TideLandfall.start(g);else g.advance();
      }
      return;
    }
    if(s.mode==='basket'){
      const target=ridePressure(s,q.ferry),pressure=g.tune(d,input,dt,.55);
      TideRigging.basket(g,input,dt,pressure,target,g.stage===0||Math.abs(pressure-target)<.18);
    }else if(s.mode==='raft'){
      TideRigging.pump(g,input,dt);
    }else TideDrawbridge.advance(g,input,dt);
    const ready=sc.span?sc.span.landed:q.ferry>.78&&g.rig.landed;
    if(ready&&g.engaged[r]){
      q.hold+=dt;if(q.hold>.4){q.latch=true;if(g.rig)g.rig.flow=0;g.checkpoints[r]=sc.ends[r];g.sound(510,.2);g.alert('棘爪已锁 · 回程通道展开');}
    } else q.hold=0;
  }
  function alignment(g,input,dt){
    const q=g.state,s=g.spec;
    const tolerance=.052;
    const strict=g.index===11;
    const targets=s.v.map((v,i)=>clamp(v+(strict?.095*Math.sin(g.time*.49+i):0),0,1));
    const vals=[g.tune(0,input,dt),g.tune(1,input,dt)];
    const ok=vals.map((v,i)=>Math.abs(v-targets[i])<tolerance);
    const two=g.engaged.every(Boolean);
    g.cues.light=.95;g.cues.angle=(vals[0]-.5)*.9;g.cues.ghost=Math.abs(vals[1]-targets[1])*.48;
    const instructions=['转动手轮，按同伴读数调光','调整焦距，观察光束落点'];
    for(let i=0;i<2;i++){
      const peer=1-i;
      g.set(i,instructions[i],{vis:'optic',
        value:vals[i],target:null,band:tolerance,
        peer:vals[peer],peerTarget:targets[peer],caption:'本端 '+percent(vals[i])+'　·　同伴应调至 '+percent(targets[peer]),ok:ok[i]});
    }
    q.hold=two&&ok.every(Boolean)?q.hold+dt:0;
    if(q.hold>(strict?1.7:1.05))g.advance();
  }
  function quiet(g,input,dt){
    const q=g.state,c=g.section.tram;
    if(!TideDrawbridge.tram(g,dt)){
      for(let i=0;i<2;i++)g.set(i,g.players[i].ground===c.deck?'在背风吊篮里等同伴':'走到中央栈桥，跨进同一个吊篮',{caption:'两人上车后，卷扬机会自行放行'});
      return;
    }
    if(c.arrived&&!c.heard&&g.players.every(p=>p.grounded&&p.ground!==c.deck&&Math.abs(p.z-g.section.mid.z)<3.75)){
      g.skipTin=true;TideSwing.openFile(g);return;
    }
    if(c.heard||g.skipTin){
      for(let i=0;i<2;i++)g.set(i,c.arrived?'吊篮已靠岸':'铁盒收好了，一起听吊轮经过桥腹',{caption:'吊篮行程 '+Math.round(c.travel*100)+'%'});
      if(c.arrived)TideSwing.openFile(g);
      return;
    }
    if(g.engaged.every(Boolean)&&input.every(k=>k.z>.55)){
      q.catchup+=dt;
      if(q.catchup>.75){g.skipTin=true;g.alert('两人一起合上了铁盒，吊篮向泊位滑去。');return;}
    }else q.catchup=0;
    q.taps??=[];q.answer??=[];
    const skip=c.arrived?'已靠岸，可从桌子两侧一起下车':'两人同时按住操作键和向后，可收起铁盒';
    if(g.engaged.every(Boolean)&&!c.heard)TideSwing.speak(g,'knock');
    if(q.taps.length<3){
      const n=q.taps.length;
      if(g.commit(0,input) && (!n||g.time-q.taps[n-1]>.37)){
        q.taps.push(g.time);q.yes[0]=true;TideSwing.cue(g.swing,'tin');
        if(q.taps.length===3){q.mark=g.time;g.alert('三声都收进了第一轨，轮到沈遥。',3);}
      }
      if(n&&g.time-q.taps[n-1]>2.6){q.taps=[];g.alert('录音留了太长的空白，再敲三下');}
      g.set(0,'按住操作键，按三次跳跃键，自己编一段敲铁盒的节奏',{vis:'dial',value:q.taps.length/3,caption:'录音 '+q.taps.length+' / 3　·　'+skip});
      g.set(1,'听同伴的三下敲击，看看两次停顿各有多长',{vis:'wave',value:n?g.time-q.taps[n-1]:0,caption:n&&g.time-q.taps[n-1]<.23?'●　铁盒响了':(c.arrived?skip:'监听')});
      return;
    }
    const gaps=[q.taps[1]-q.taps[0],q.taps[2]-q.taps[1]];
    const symbols=gaps.map(t=>t>.85?'长':'短').join(' · ');
    g.set(0,'现在换你听。再按跳跃键可以重放这段节奏',{caption:'原录音　● '+symbols+' ●　·　'+skip});
    g.set(1,'按住操作键，照刚才听见的间隔敲三下',{vis:'dial',value:q.answer.length/3,caption:'两次停顿 '+gaps.map(t=>t.toFixed(1)+' 秒').join(' / ')+'　·　回应 '+q.answer.length+' / 3'});
    if(g.commit(0,input)&&!q.replay){q.replay=1;q.mark=g.time;TideSwing.cue(g.swing,'tin');}
    if(q.replay&&g.time-q.mark>=q.taps[q.replay]-q.taps[0]){
      TideSwing.cue(g.swing,'tin');q.replay=q.replay===2?0:2;
    }
    if(g.commit(1,input)&&(!q.answer.length||g.time-q.answer.at(-1)>.24)){
      q.answer.push(g.time);TideSwing.cue(g.swing,'tin');
      if(q.answer.length===3){
        const matched=gaps.every((gap,i)=>Math.abs(q.answer[i+1]-q.answer[i]-gap)<.34+gap*.24);
        if(matched){c.heard=true;TideSwing.speak(g,'laugh');g.events.checkpoint?.(g);}
        else{q.answer=[];g.alert('第一轨还在。听清两次停顿，就能重新答。');}
      }
    }
  }
  const handlers={ride,paper:TidePaper.interact,optic:alignment,rhythm:TideFogSignal.interact,quiet,release:TideLastPass.release};
  return {Session,roleKeys,near,ridePressure};
})();
