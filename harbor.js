// A single scene and renderer keep lighting, moving decks and the ferry shared.
const TideHarbor = (() => {
  const T=THREE;
  const colors=[0xffad65,0x71e5db];
  const clamp=TideTraversal.clamp;
  const vector=new T.Vector3(),pinLimits={side:.88,up:.67,down:.40},pinScreen={};
  const pinArrows={向左:'←',向右:'→',上方:'↑',下方:'↓',左后方:'↶',右后方:'↷',身后:'↶'};
  function targetFor(g,i) {
    if(g.rangeWatch)return {p:g.section.sites[i],name:i?'双路接片台':'外礁镜转向器'};
    if(TideGallery.active(g))return TideGallery.target(g,i);
    const sec=g.section, s=g.spec,q=g.state;
    if(TideArrival.active(g))return {p:i?g.players[1]:TideArrival.cleat(g),name:i?'交通艇舵位':g.arrival.atBow>.5?'首缆岸桩':'艇载便携电台'};
    if(TideFenders.active(g))return TideFenders.target(g,i);
    if(TideSwing.active(g)){const s=TideSwing.target(g,i);return {p:s,name:s.label};}
    if(g.cistern){const s=TideCistern.target(g,i);return {p:s,name:s.label};}
    if(g.glass){const s=TideGlass.target(g,i);return {p:s,name:s.label};}
    if(g.fog){const site=TideFogSignal.target(g,i);return {p:site,name:site.label};}
    if(g.survey){const site=TideSoundings.guide(g,i);return {p:site,name:site.label};}
    if(g.relay){const site=TideRelay.target(g,i);return {p:site,name:site.label};}
    if(g.cable){const site=TideCableQuay.target(g,i);return {p:site,name:site.label};}
    if(g.landfall)return TideLandfall.target(g,i);
    if(g.optic||g.archive){const site=sec.sites[i];return {p:site,name:site.label};}
    if(!g.field.done){const site=sec.field.sites[i];return {p:site,name:site.label};}
    if(TideLookout.active(g))return {p:sec.sites[i],name:i===g.watch.task.watcher?'远望镜':'船位记录簿'};
    if(g.signal)return TideSignal.target(g,i);
    if(sec.tram){
      const c=sec.tram;
      if(!c.departed)return {p:c.deck,name:'同乘背风吊篮'};
      if(c.heard||g.skipTin)return {p:sec.mid,name:'桥头值班柜'};
      return {p:sec.sites[i],name:i?'监听录音机':'螺丝铁盒'};
    }
    if(s.type==='ride'){
      if(q.latch){
        if(i!==s.driver&&q.returnGate<2&&(s.mode!=='basket'||(g.index===0&&g.stage===1)))return {p:sec.sites[i],name:'回程闸'};
        return {p:sec.ends[i],name:'会合点'};
      }
      if(g.rig?.belay)return i===s.driver?{p:sec.sites[i],name:"救生绞盘"}:{p:sec.rig.ledge,name:"脱钩横梁"};
      if(sec.span){
        const b=sec.span;
        if(i===s.driver)return {p:sec.sites[i],name:'吊桥制动鼓'};
        if(!b.seated)return {p:b.grip,name:'桥面配重车'};
        return b.landed?{p:sec.sites[i],name:'桥头棘轮'}:{p:b.lip,name:'接收槽'};
      }
      if(g.rig && i!==s.driver && !g.rig.landed && q.ferry>.78)return {p:sec.rig.ledge,name:s.mode==='raft'?'水窗窗沿':'着陆横梁'};
      if(i!==s.driver && q.ferry<.78)return {p:sec.ferry.deck,name:s.mode==='raft'?'登上浮架':'登上吊篮'};
    }
    return {p:sec.sites[i],name:TideMissions.names[sec.sites[i].kind]};
  }
  function makeRenderer(canvas){
    const renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});
    renderer.outputColorSpace=T.SRGBColorSpace;
    renderer.toneMapping=T.ACESFilmicToneMapping;
    renderer.toneMappingExposure=1.07;
    renderer.shadowMap.enabled=true;
    renderer.shadowMap.type=T.PCFSoftShadowMap;
    renderer.setScissorTest(true);
    return renderer;
  }
  function viewport(renderer,start,width,height){
    // Three.js floors offset and width separately after converting CSS pixels.
    // Adjacent views must share the very same physical pixel boundary at any DPR.
    const ratio=renderer.getPixelRatio();
    const pixels=Math.floor((start+width)*ratio)-Math.floor(start*ratio);
    const span=(pixels+.125)/ratio;
    renderer.setViewport(start,0,span,height);renderer.setScissor(start,0,span,height);
  }
  class WorldView {
    constructor(canvas,onPoint,renderer=null) {
      this.onPoint=onPoint;
      this.canvas=canvas;
      this.renderer=renderer||makeRenderer(canvas);
      this.equipment=TideEquipment.create();
      this.actors=[TideActors.person(0),TideActors.person(1)];
      this.coats=this.actors.map(a=>{
        const b=a.userData.rig.bones;
        return [...b.chest.children.filter(n=>n!==b.arm0&&n!==b.arm1),...b.arm0.children.filter(n=>n.isMesh),...b.arm1.children.filter(n=>n.isMesh)];
      });
      this.ship=TideActors.ferry();
      this.cameras=[0,1].map(()=>new T.PerspectiveCamera(57,1,.12,420));
      this.look=[new T.Vector3(),new T.Vector3()];this.follow=[new T.Vector3(),new T.Vector3()];
      this.yaws=[0,0];this.pitch=[0,0];this.quality=1;this.custom=new Set();
      this.haloGeo=new T.RingGeometry(.76,.83,48);this.dotGeo=new T.RingGeometry(.9,.93,48);
      this.haloMats=colors.map(c=>new T.MeshBasicMaterial({color:c,side:T.DoubleSide,transparent:true,opacity:.89,depthWrite:false}));

    }
    releaseRange(){
      this.rangeConsole?.dispose();this.rangeImages?.dispose();this.reefFinder?.dispose();
      this.rangeConsole=this.rangeImages=this.reefFinder=null;
    }
    free() {
      if(!this.scene)return;
      this.releaseRange();
      this.ferryHull?.dispose();this.ferryHull=null;this.entrance?.dispose();this.entrance=null;
      this.bridgeWindows?.dispose();this.bridgeWindows=null;
      this.pilotStand?.dispose();this.pilotStand=null;
      this.afterdeck?.dispose();this.watchHands?.dispose();this.afterdeck=this.watchHands=null;
      this.staticPiers?.dispose();this.staticPiers=null;
      this.galleryWall?.dispose();this.galleryBelay?.dispose();this.gallerySlip?.dispose();this.galleryGear?.dispose();this.galleryYard?.dispose();
      this.shoreScans?.dispose();this.shoreScans=null;this.arrivalRig?.dispose();this.contactSurf?.dispose();this.boat?.dispose();this.fenderYard?.dispose();this.seaReflection?.dispose();this.pointing?.dispose();this.sightlines?.dispose();this.footlight?.dispose();this.swingYard?.dispose();this.cisternRoom?.dispose();this.glassRoom?.dispose();this.fogHouse?.dispose();this.tideStation?.dispose();this.sternCompass?.dispose();this.relayStation?.dispose();this.cableYard?.dispose();this.floodRoom?.dispose();this.childDuo?.dispose();this.screwTable?.dispose();this.summerRoom?.dispose();this.archiveStudio?.dispose();this.transitRig?.dispose();this.transitGlass?.dispose();this.transitOptics?.dispose();this.signalhouse?.dispose();this.lanternroom?.dispose();this.bridgework?.dispose();this.dockside?.dispose();this.cinema?.dispose();this.fieldProps?.dispose();this.coast?.dispose();
      for(const asset of this.custom)asset.dispose();
      this.custom.clear();this.lifeline=null;this.scene.clear();this.scene=null;this.equipment.releaseDecks();
      this.lens?.dispose();this.lens=null;this.partnerLens?.dispose();this.partnerLens=null;
    }
    own(asset){this.custom.add(asset);return asset;}
    load(g) {
      this.free();for(const cam of this.cameras)cam.layers.set(0);
      this.scene=new T.Scene();this.scene.background=new T.Color(0x597580);
      this.coast=g.cistern||g.archive?null:TideCoast.create(this.scene,Math.floor(g.index/3),g.index,g.world.floors);
      this.floors=new Map();this.rigs=[];this.halos=[];
      const add=(m)=>{this.scene.add(m);return m;};
      const pierCuts=TidePierDeck.layout(g.world.floors);
      for(const d of g.world.floors){
        const yard=g.world.fenders;
        const boatDeck=yard&&(yard.boats.includes(d)||d===yard.boatLink);
        const facing=d===yard?.ledge ? .63 : 0;
        const obj=boatDeck||d.sag||d.axes||d.landfall||g.cistern||g.glass||g.fog||g.survey||g.relay||g.cable||g.archive||d.kind==='tram'?new T.Group():this.equipment.deck(d.w-facing,d.d,d.kind,pierCuts.get(d));
        obj.position.set(d.x-facing*.5,d.y,d.z);obj.visible=d.active;add(obj);this.floors.set(d,obj);
      }
      for(const section of g.world.sections) {
        section.devices=section.sites.map((site,i)=>{
          if(g.cistern||g.glass||g.fog||g.survey||g.archive||g.cable||g.relay||section.spec.type==='range'||g.index===11&&section.spec.type==='release'&&i===0)return new T.Group();
          const obj=this.equipment.device(section.span?'brake':site.kind,i);
          obj.position.set(site.x,site.y,site.z-.95);
          if(g.world.lantern||g.signal||section.tram||section.spec.type==='paper')obj.visible=false;
          return add(obj);
        });
        if(section.field)section.field.devices=section.field.sites.map((site,i)=>{
          const obj=this.equipment.device(site.kind,i);obj.scale.setScalar(.88);obj.position.set(site.x,site.y,site.z-.95);return add(obj);
        });
        if(section.ferry&&!section.span)this.addRig(section);
        if(g.index===0&&section===g.world.sections[1])this.addLifeline(section);
      }
      this.hazards=[];
      const warningMat=this.own(new T.MeshBasicMaterial({color:0xff8840,transparent:true,opacity:.28,depthWrite:false}));
      for(const sec of g.world.sections) for(const d of sec.danger) {
        const stripeGeo=this.own(new T.PlaneGeometry(d.w*.92,.14));
        for(let j=-1;j<=1;j++){
          const mesh=new T.Mesh(stripeGeo,warningMat);
          mesh.rotation.x=-Math.PI/2;mesh.position.set(d.x,d.y+.035,d.z+j*.39);add(mesh);this.hazards.push({sec,mesh});
        }
      }
      for(let i=0;i<2;i++){
        add(this.actors[i]);const ring=new T.Group();
        for(const geo of [this.haloGeo,this.dotGeo]){
          const m=new T.Mesh(geo,this.haloMats[i]);m.rotation.x=-Math.PI/2;ring.add(m);
        }
        this.halos.push(add(ring));
      }
      this.swingYard=g.swing?TideSwingYard.create(this.scene,g):null;
      this.cisternRoom=g.cistern?TideCisternRoom.create(this.scene,g):null;
      this.glassRoom=g.glass?TideGlassRoom.create(this.scene,g):null;
      this.fogHouse=g.fog?TideFoghouse.create(this.scene,g):null;
      this.sternCompass=null;
      this.tideStation=g.survey?TideSurveyPier.create(this.scene,g):null;
      this.relayStation=g.relay?TideRelayStation.create(this.scene,g):null;
      this.cableYard=g.cable?TideCableYard.create(this.scene,g,this.equipment,this.actors):null;
      this.boat=g.fenders?TidePilotBoat.create(this.scene,g.world.fenders):null;
      this.arrivalRig=this.boat?TideArrivalRig.create(this.scene,this.boat,g):null;
      if(this.boat){
        const scene=this.scene;
        TideShoreScans.load().then(()=>{if(this.scene===scene)this.shoreScans=TideShoreScans.create(scene,g);}).catch(()=>{});
      }
      this.fenderYard=g.fenders?TideFenderYard.create(this.scene,g.world.fenders):null;
      this.floodRoom=g.world.landfall?TideFloodRoom.create(this.scene,g.world.landfall):null;
      this.transitRig=g.signal?TideTransitRig.create(this.scene,g):null;
      this.transitGlass=g.signal?TideTransitGlass.create(this.scene):null;
      this.transitOptics=g.signal?TideTransitOptics.create(this.scene,g):null;
      this.signalhouse=g.signal?TideSignalHouse.create(this.scene,g,this.equipment,this.renderer.capabilities.isWebGL2):null;
      this.childDuo=this.screwTable=this.summerRoom=null;
      this.archiveStudio=g.archive?TideArchiveStudio.create(this.scene,g,this.renderer):null;
      this.galleryWall=g.world.gallery?TideGalleryWall.create(this.scene,g):null;
      this.galleryBelay=g.world.gallery?TideGalleryBelay.create(this.scene,g):null;
      this.gallerySlip=g.world.gallery?TideGallerySlip.create(this.scene,g):null;
      this.galleryGear=g.world.gallery?TideGalleryGear.create(this.scene,g):null;
      this.galleryYard=g.world.gallery?TideGalleryYard.create(this.scene,g):null;
      this.lanternroom=g.world.lantern?TideLanternRoom.create(this.scene,g):null;
      this.bridgework=TideBridgework.create(this.scene,g,this.floors,this.actors);
      if(g.index===11){
        this.entrance=TideEntranceMarks.create(this.scene,TideBayPassage.marks);
        this.bridgeWindows=TideBridgeWindows.create(this.ship);
        this.pilotStand=TidePilotStand.create(this.scene,g);
        this.afterdeck=TideAfterdeck.create(this.ship);
        this.watchHands=TideWatchHands.create(this.ship);
      }
      this.ship.position.fromArray(TideLookout.vessel(g,g.time));if(this.coast){add(this.ship);this.ferryHull=TideFerryHull.create(this.ship);}
      this.dockside=g.cistern||g.glass||g.fog||g.survey||g.relay||g.cable||g.world.lantern||g.signal||g.archive?null:TideDockside.create(this.scene,g);
      this.fieldProps=g.cistern||g.fog||g.survey||g.relay||g.cable||g.archive?null:TideFieldProps.create(this.scene,g,this.actors);
      this.cinema=TideCinema.create(this.scene,g,{ship:this.ship,actors:this.actors,cameras:this.cameras,swingYard:this.swingYard,cisternRoom:this.cisternRoom,glassRoom:this.glassRoom,marker:this.coast?.marker});
      this.contactSurf=this.coast&&[0,1].includes(g.index)?TideContactSurf.create(this.scene,g,this.coast.water):null;
      this.seaReflection=this.coast&&[0,1,2,6,7,8,11].includes(g.index)?TideHarborReflection.create(this.renderer,this.scene,this.coast.water,this.halos):null;
      this.sightlines=TideSightlines.create(this.scene,[...this.actors,...this.halos]);
      this.pointing=TidePointing.create(this.sightlines,this.cameras,g,this.onPoint);
      this.footlight=TideFootlight.create(this.scene,this.actors);
      this.staticPiers=g.index===0||g.index===6?TideStaticPiers.create(this.scene,this.floors,g.world.sections):null;
      this.homeYaw=g.glass&&g.glass.phase==='cabinet'?Math.PI:g.signal?TideSignal.yaw:g.world.lantern?TideLantern.yaw:0;
      this.lastTick=null;this.renderPoses=[{},{}];this.recovered=[false,false];
      this.yaws.fill(this.homeYaw);this.pitch.fill(0);this.snap=true;
    }
    addLifeline(sec){
      const l=sec.rig.ledge;
      const bronze=this.own(new T.MeshStandardMaterial({color:0xc8a266,metalness:.67,roughness:.37}));
      const leg=new T.Mesh(this.own(new T.CylinderGeometry(.048,.074,2.45,10)),bronze);
      leg.position.set(l.x+.72,l.y+1.21,l.z+.98);this.scene.add(leg);
      const eye=new T.Mesh(this.own(new T.TorusGeometry(.115,.034,8,18)),bronze);
      eye.position.set(leg.position.x,l.y+2.42,leg.position.z);this.scene.add(eye);
      const line=new T.Mesh(this.own(new T.CylinderGeometry(.025,.025,1,8)),
        this.own(new T.MeshStandardMaterial({color:0xc78a42,roughness:.83})));
      this.scene.add(line);line.visible=false;this.lifeline={line,eye};
    }
    addRig(sec) {
      const f=sec.ferry,dx=f.to.x-f.from.x,dz=f.to.z-f.from.z;
      const material=this.own(new T.MeshStandardMaterial({color:0x3b4947,metalness:.7,roughness:.49}));
      const beam=(a,b,r)=>{
        const start=new T.Vector3(...a),end=new T.Vector3(...b),delta=end.clone().sub(start);
        const mesh=new T.Mesh(this.own(new T.CylinderGeometry(r,r,delta.length(),6)),material);
        mesh.position.copy(start).addScaledVector(delta,.5);mesh.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize());this.scene.add(mesh);
      };
      const h=Math.max(f.from.y,f.to.y)+6.8;
      for(const p of [f.from,f.to]){
        for(const side of [-1,1])beam([p.x+side*2.3,p.y-4,p.z],[p.x+side*2.3,h,p.z],.11);
        beam([p.x-2.45,h,p.z],[p.x+2.45,h,p.z],.13);
      }
      for(const side of [-1,1])beam([f.from.x+side*1.25,h,f.from.z],[f.from.x+dx+side*1.25,h,f.from.z+dz],.042);
      if(sec.spec.mode==='basket'){
        const ropes=[-1,1].map(s=>{
          const m=new T.Mesh(this.own(new T.CylinderGeometry(.028,.028,1,5)),material);this.scene.add(m);return {s,m};
        });this.rigs.push({deck:f.deck,h,ropes});
      }
    }
    freePose(g,p,i){
      const floor=p.ground;
      return !g.engaged[i]&&!floor?.dynamic&&!floor?.axes&&!floor?.sag&&!floor?.buoyant&&
        !(floor?.hinge!==undefined&&floor.hinge<1)&&!g.fenders?.grip[i]&&
        !(i?g.fenders?.wall:g.fenders?.onLadder)&&!(g.rig?.belay&&i!==g.spec.driver)&&
        !(i===0&&g.relay?.climb)&&!g.swing?.climb[i]&&!(g.swing?.occupied&&i===g.swing.rider)&&
        !(i===0&&g.cable?.carried)&&!(g.stage===1&&g.archive?.fetched[i]&&!g.archive.mounted[i]);
    }
    rememberPose(g){
      this.lastTick ||= [{},{}];
      for(let i=0;i<2;i++){
        const p=g.players[i];
        Object.assign(this.lastTick[i],{player:p,stage:g.stage,free:this.freePose(g,p,i),
          x:p.x,y:p.y,z:p.z,yaw:p.yaw});
      }
    }
    presented(g,i,alpha){
      const p=g.players[i],old=this.lastTick?.[i];
      if(alpha===undefined||this.snap||this.recovered[i]||!old?.free||old.player!==p||g.stage!==old.stage||
        !this.freePose(g,p,i)||Math.hypot(p.x-old.x,p.y-old.y,p.z-old.z)>.72)return p;
      const turn=p.yaw-old.yaw;
      const pose=this.renderPoses[i];
      pose.x=T.MathUtils.lerp(old.x,p.x,alpha);pose.y=T.MathUtils.lerp(old.y,p.y,alpha);
      pose.z=T.MathUtils.lerp(old.z,p.z,alpha);
      pose.yaw=old.yaw+alpha*Math.atan2(Math.sin(turn),Math.cos(turn));
      return pose;
    }
    draw(g,dt,ready=true,alpha) {
      const e=this.renderer,t=g.time+(this.cinema.ended?0:this.cinema.time);
      const layout=TideWindows.layout(),width=layout.w,height=layout.h;
      if(width<2||height<2)return;
      const dpr=TideWindows.density()*this.quality;
      if(this.w!==width||this.h!==height||this.dpr!==dpr){
        this.w=width;this.h=height;this.dpr=dpr;e.setPixelRatio(dpr);e.setSize(width,height,false);
      }
      this.coast?.update(t,g.cues,g.players);this.shoreScans?.update(g,t);
      this.ship.position.fromArray(TideLookout.vessel(g,t));
      this.ship.rotation.set(.028*Math.sin(t*.78),TideFerryTrail.yaw(g,t),.034*Math.sin(t*.91));
      this.coast?.wash.update(g,t,this.ship);this.ferryHull?.update(t,g.cues.water,g.index);
      this.bridgeWindows?.update(g,t);this.watchHands?.update(g);this.pilotStand?.update(g);
      if(!g.rangeWatch&&this.rangeConsole)this.releaseRange();
      if(g.rangeWatch&&!this.rangeConsole){
        this.reefFinder=TideReefFinder.create(this.scene,g);
        this.rangeConsole=TideRangeConsole.create(this.scene,g);
        this.rangeImages=TideRangeImages.create(e);
        this.rangeConsole.setScreen(this.rangeImages.texture);
      }
      this.reefFinder?.update(g);this.rangeConsole?.update(g);
      for(const [d,obj] of this.floors){
        obj.visible=d.active;
        if(d.hinge!==undefined){
          const angle=(1-d.hinge)*1.34;
          obj.visible=true;obj.rotation.x=d.hingeDirection*angle;
          obj.position.set(T.MathUtils.lerp(d.hingeX,d.x,d.hinge),d.y-Math.sin(angle)*d.d*.5,
            T.MathUtils.lerp(d.hingeZ+d.hingeDirection*d.d*.5*Math.cos(angle),d.z,d.hinge));
        }
        if(d.axes)obj.rotation.set(d.pitch,d.yaw,d.roll,'YXZ');
        if(d.dynamic)obj.position.set(d.x,d.y,d.z);
      }
      for(const {deck,h,ropes} of this.rigs)for(const {m,s} of ropes){
        const top=deck.y+.94;
        m.position.set(deck.x+s*1.25,(h+top)/2,deck.z);m.scale.y=h-top;
      }
      if(g.glass){
        if(this.chartPhase==='unload'&&g.glass.phase==='desk')this.yaws.fill(0);
        this.chartPhase=g.glass.phase;this.glassRoom.update(g);
      }this.boat?.update(g.world.fenders.floatPose,g.arrival);this.arrivalRig?.update(t);this.fenderYard?.update(g.fenders,t);this.swingYard?.update(g);this.cisternRoom?.update(g,this.cinema.ended?0:this.cinema.time);this.fogHouse?.update(g);this.tideStation?.update(g);this.relayStation?.update(g);this.cableYard?.update(g);this.floodRoom?.update(g);if(g.archive&&g.stage===0&&g.archive.count>0&&!this.summerRoom){
        this.summerRoom=TideSummerRoom.create(this.scene);
        this.screwTable=TideScrewTable.create(this.scene);
        this.childDuo=TideChildDuo.create(this.scene);
      }
      this.summerRoom?.update(g,t);this.screwTable?.update(g,t);this.childDuo?.update(g,t);
      this.archiveStudio?.update(g);this.signalhouse?.update(g);this.transitRig?.update(g,t);this.transitOptics?.update(g,t);this.bridgework?.update();this.lanternroom?.update(g);this.galleryBelay?.update(g);this.gallerySlip?.update(g);this.galleryGear?.update(g);this.galleryYard?.update(g);
      if(this.lifeline){
        const {line,eye}=this.lifeline,b=g.rig?.belay;
        line.visible=!!b;
        if(b){
          const p=g.players[1-g.spec.driver],belt=new T.Vector3(p.x,p.y+.99,p.z);
          const direction=eye.position.clone().sub(belt);
          line.position.copy(belt).addScaledVector(direction,.5);line.scale.y=direction.length();
          line.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),direction.normalize());
        }
      }
      const phase=g.hazardPhase();
      for(const {sec,mesh} of this.hazards){
        mesh.visible=sec===g.section;
        mesh.material.opacity=phase>.78?.87:phase>.55?.3+.4*Math.abs(Math.sin(t*10)):.20;
      }
      for(let i=0;i<2;i++){
        const p=g.players[i],obj=this.actors[i],acting=this.cinema.performance(i);
        const pose=acting||this.presented(g,i,alpha);
        obj.position.set(pose.x,pose.y,pose.z);obj.rotation.y=pose.yaw;
        const goal=targetFor(g,i).p;this.halos[i].position.set(goal.x,goal.y+.065,goal.z);
        this.halos[i].visible=g.fog?.haul||TideGallery.active(g)?false:TideFenders.active(g)?!g.near[i]&&!(i===1&&g.fenders.seen[1]&&!g.fenders.top[1]):(!g.glass&&!g.cistern)||!g.near[i];if((g.rangeWatch||g.lastPass)&&g.field.done&&g.near[i])this.halos[i].visible=false;if(g.cable?.warp.clipped&&g.near[i])this.halos[i].visible=false;if(g.signal&&g.stage===0&&g.near[i])this.halos[i].visible=false;this.halos[i].scale.setScalar(1+.075*Math.sin(t*3+i));
        const drivingValve=g.spec.mode==='raft'&&i===g.spec.driver;
        const v=g.pilotHorn?(i?g.pilotHorn.valve:g.pilotHorn.spin%1):g.lastPass&&!i?(g.lastPass.wheel+1.62)/1.19:drivingValve ? .5+.45*g.rig.flow : g.spec.type==='ride'?g.state.ferry:g.state.dials[i];
        this.equipment.drive(g.section.devices[i],v,t);
        if(g.section.field)this.equipment.drive(g.section.field.devices[i],g.field.values[i],t);
        const hanging=!acting&&g.rig?.belay&&i!==g.spec.driver;
        const using=!acting&&g.engaged[i],paper=using&&g.paper&&g.field.done;
        const device=g.field.done?g.section.devices[i]:g.section.field.devices[i];
        const span=g.section.span;
        const movingGrip=g.section.tram||span&&!span.seated&&i!==g.spec.driver;
        const carryingTester=!acting&&g.cable&&i===1&&!g.engaged[i]&&(g.stage===0||g.stage===2&&!g.cable.backTest);
        const carryingLead=!acting&&i===0&&g.cable?.carried&&(!g.cable.warp.clipped||!!g.cable.warp.pass);
        const carry=!acting&&g.archive&&g.stage===1&&g.archive.fetched[i]&&!g.archive.mounted[i];
        const transfer=TideSwing.active(g);
        const relayHands=transfer&&!acting?this.swingYard.hands(g,i):g.cistern?(acting?this.cisternRoom.filmHands(g,i,this.cinema.time):this.cisternRoom.hands(g,i)):g.glass&&!acting?this.glassRoom.hands(g,i):g.fog&&!acting?this.fogHouse.hands(g,i):g.survey&&!acting?this.tideStation.hands(g,i):g.relay&&!acting?this.relayStation.hands(g,i):null;
        const berth=TideFenders.active(g)&&!acting;
        const grips=!acting&&g.rangeWatch?(i?this.rangeConsole.grips(g):this.reefFinder.grips(g)):!i&&g.lastPass&&g.field.done&&!acting?this.pilotStand.hands(g):TideGallery.active(g)?(g.gallery.phase==='file'?this.gallerySlip.grips(g,i):this.galleryGear.grips(g,i)):TideArrival.active(g)?this.arrivalRig.grips(i):berth?(g.fenders.grip[i]?this.fenderYard.hands(g.fenders.grip[i],p):null):g.glass&&!acting?(relayHands||(using&&g.glass.phase==='desk'?this.paperGrips(g,i):null)):transfer||g.cistern||g.fog||g.survey||g.relay?relayHands:(carryingTester?this.cableYard.testerHands(g):carryingLead?this.cableYard.leadHands(g):using&&g.cable?this.cableYard.hands(g,i):hanging?this.belayGrips(p,g.rig.belay.anchor):carry?this.archiveStudio.carryGrips(g,i):!using?null:g.landfall?this.floodRoom.hands(TideLandfall.targets(g)[i].kind):g.archive?(g.archive.location[i]==='desks'?this.archiveStudio.desks[i].hands():this.archiveStudio.shelfGrips(g,i)):g.signal?(this.transitRig.hands(g,i)||this.signalhouse.hands(g,i)):g.optic?this.lanternroom.hands(g,i):movingGrip?this.bridgework.hands(g.section,i):paper?this.paperGrips(g,i):this.equipment.grips(device));
        const fenderLine=berth&&TideFenderSpeech[g.fenders.voice];
        const starterLine=g.signal&&(g.stage===0?TideShiftSpeech[g.signal.voice]:TideTransitSpeech[g.signal.voice]?.mouth&&TideTransitSpeech[g.signal.voice]);
        const haulLine=g.fog&&TideHaulSpeech[g.fog.voice];
        const workSpeed=g.optic?.mount&&!g.optic.mount.done&&using?g.optic.mount.speed||0:p.speed;
        TideActors.animate(obj, {speed:acting?0:workSpeed,vx:p.vx,vz:p.vz,vy:p.vy,yaw:pose.yaw,launch:p.launch,landing:p.landing,
          groundFloor:ready&&!acting?p.ground:null,groundWorld:g.world,
          slopeX:p.ground?.axes?.nx||0,slopeZ:p.ground?.axes?.nz||0,
          swing:transfer&&g.swing.occupied&&i===g.swing.rider?{angle:g.swing.angle,omega:g.swing.omega,phase:'ride',effort:g.swing.effort}:null,
          ledge:berth&&i?g.fenders.ledge:null,wall:berth&&i?g.fenders.wall:null,pointAt:!acting&&ready?this.pointing.pointAt(i,g.time):null,grounded:p.grounded,climbing:!!g.gallery?.arrests[i]||(berth&&!i&&g.fenders.onLadder)||(!i&&!!g.relay?.climb)||!!g.swing?.climb[i],operating:TideArrival.active(g)?!!grips:!!relayHands||using||carryingTester||carryingLead||carry||hanging,grips,helmSeat:i&&TideArrival.active(g)?this.arrivalRig.seat():null,talking:fenderLine?.mouth?fenderLine.speaker===(i?'沈遥':'林澈')&&(fenderLine.mouth.levels[Math.floor(g.fenders.clock*fenderLine.mouth.hz)]||0)>10:starterLine?starterLine.speaker===(i?'沈遥':'林澈')&&(starterLine.mouth.levels[Math.floor(g.signal.clock*starterLine.mouth.hz)]||0)>10:haulLine?haulLine.speaker===(i?'沈遥':'林澈')&&(haulLine.mouth?.levels[Math.floor(g.fog.clock*20)]||0)>10:TideGallery.active(g)?!!(g.gallery.voice&&TideGallerySpeech[g.gallery.voice].speaker===(i?'沈遥':'林澈')&&(TideGallerySpeech[g.gallery.voice].mouth?.levels[Math.floor(g.gallery.clock*20)]||0)>10):TideArrival.active(g)&&g.arrival.voice&&(TideArrival.speech(g.arrival.voice).speaker===(i?'沈遥':'林澈'))&&
            (TideArrival.speech(g.arrival.voice).mouth?.levels[Math.floor(g.arrival.voiceAt*20)]||0)>12,...acting},dt,t);
        if(g.stage===0&&g.signal&&!acting)TideStarterPose.apply(obj,g,i,dt,t,grips);
        if(i&&g.arrival&&!acting&&this.arrivalRig){
          TidePlatePose.apply(obj,g,dt,t,this.arrivalRig.plate);
          TideSternPose.apply(obj,g,this.arrivalRig.stern,dt);
        }
        if(!i&&g.fog&&!acting)TideHaulPose.apply(obj,g,dt,t,this.fogHouse.haul);
      }
      this.signalhouse?.apron.update(g,this.actors);
      this.contactSurf?.update(g,t);this.footlight.update();
      this.dockside?.update(g,dt);this.fieldProps?.update(g,dt);this.cinema.update(g,dt);
      this.sightlines.update();
      this.cisternRoom?.reflect(e,this.actors,this.halos);
      if(g.rangeWatch&&g.near[1])this.rangeImages.update(this.scene,TideRangeWatch.optics(g),g.time,this.quality);
      // Cache the sun's shadow map between the two views.
      e.shadowMap.autoUpdate=false;e.shadowMap.needsUpdate=true;
      const shared=this.cinema.shared;
      const panes=shared&&!layout.separate?[{x:0,w:width,h:height}]:layout.panes;
      for(const [i,pane] of panes.entries()){
        const start=pane.x,vw=pane.w,height=pane.h;
        const cam=this.cameras[i],p=g.players[i],yaw=this.yaws[i],followPose=this.presented(g,i,alpha);
        const inside=g.section.span?.lower&&p.ground===g.section.span.deck;
        const braking=g.section.span&&!g.section.span.seated&&i===g.spec.driver&&g.engaged[i];
        const angle=yaw+(braking?(i?.46:-.46):0);
        const cameraHeight=(g.archive?2.38:g.optic?2.44:inside?1.80:g.engaged[i]?2.7:3.55)+this.pitch[i];
        const radius=g.archive?3.5:g.optic?3.35:inside?2.95:braking?5.45:g.engaged[i]?4.15:5.25;
        vector.set(followPose.x+Math.sin(angle)*radius,followPose.y+cameraHeight,followPose.z+Math.cos(angle)*radius);
        if(g.optic){const arm=TideLantern.cameraArm(p,vector);vector.set(arm.x,arm.y,arm.z);}
        if(g.cistern)this.cisternRoom.cameraArm(vector);
        if(g.glass)this.glassRoom.cameraArm(p,vector);
        if(g.archive){vector.x=clamp(vector.x,-6.12,6.12);vector.z=Math.max(vector.z,-4.75);vector.y=Math.min(3.42,vector.y);}
        const snap=this.snap||this.recovered[i],blend=snap?1:1-Math.exp(-Math.max(dt,.001)*8);
        this.follow[i].lerp(vector,blend);cam.position.copy(this.follow[i]);
        vector.set(followPose.x-Math.sin(angle)*(braking?4:2),followPose.y+(inside?1.16:1.6),followPose.z-Math.cos(angle)*2);
        this.look[i].lerp(vector,blend);cam.lookAt(this.look[i]);
        const scoped=ready&&TideLookout.active(g)&&g.watch.task.watcher===i&&g.engaged[i];
        const lighting=ready&&g.rig?.lightOn&&!g.rig.lit&&g.spec.driver!==i;
        const beam=lighting?TideRigging.ray(g):null;
        if(beam){
          // Look over the lamp housing, clear of the occupant and the basket rail.
          this.actors[i].userData.rig.bones.headlamp.getWorldPosition(vector);
          const direction=this.look[i].clone().fromArray(beam.at).sub(vector).normalize();
          vector.addScaledVector(direction,.16);vector.y+=.035;beam.eye=vector.toArray();
        }
        const paperView=ready&&g.paper&&(!g.glass||g.glass.phase==='desk')&&g.field.done&&g.engaged[i];
        const lanternShot=ready&&g.optic&&!TideGallery.active(g)?TideLantern.shot(g,i):null;
        const signalShot=ready&&g.signal?(g.stage===0&&g.engaged[i]?this.signalhouse.shot(g,i,vw/height):TideSignal.shot(g,i,vw/height)):null;
        const floodShot=ready&&g.landfall?this.floodRoom.shot(g,i):null;
        const belay=g.rig?.belay;
        const ledge=belay?g.section.rig.ledge:null;
        const rescueShot=belay&&i!==g.spec.driver?{eye:[ledge.x+5.65,ledge.y+.84,ledge.z+1.80],
          at:[ledge.x+.15,(p.y+ledge.y)*.5+1.05,ledge.z+1.10]}:null;
        const cableShot=ready&&g.cable?this.cableYard.shot(g,i):null;
        const tapeShot=ready&&g.archive?TideArchive.shot(g,i):null;
        const relayShot=ready&&g.fog?this.fogHouse.shot(g,i,this.sightlines):ready&&g.survey?this.tideStation.shot(g,i,vw/height):ready&&g.relay?this.relayStation.shot(g,i,vw/height):null;
        const berthShot=TideFenders.active(g)&&ready?TideFenders.shot(g,i,yaw,this.pitch[i]):null;
        const atTin=g.section.tram&&!g.section.tram.heard&&g.engaged[i]&&g.state.taps?.length;
        const pocketShot=ready&&(g.state.pocket||atTin)?this.bridgework?.pocketShot(i):null;
        const cinemaShot=this.cinema.shot(g,shared?0:i);
        const rangeShot=ready&&g.rangeWatch&&g.engaged[i]?(i?this.rangeConsole.shot(g,vw/height):TideRangeWatch.shot(g,i,vw/height)):null;
        const shot=cinemaShot||rangeShot||(TideGallery.active(g)?TideGallery.shot(g,i,yaw,this.pitch[i],ready):null)||(TideArrival.active(g)?this.arrivalRig.shot(i,yaw,this.pitch[i],ready,vw/height):null)||pocketShot||berthShot||(ready&&TideSwing.active(g)?this.swingYard.shot(g,i):null)||(ready&&g.cistern?this.cisternRoom.shot(g,i):null)||(ready&&g.glass?this.glassRoom.shot(g,i):null)||(ready&&g.lastPass?(i?TideLastPass.shot(g,i):g.field.done&&this.pilotStand.shot(g,vw/height)):null)||relayShot||cableShot||rescueShot||floodShot||tapeShot||signalShot||lanternShot||(scoped?TideLookout.camera(g):paperView?TidePaper.camera(g,i):beam);
        cam.fov=shot?.fov|| (cableShot?cableShot.fov:floodShot?floodShot.fov:tapeShot?tapeShot.fov:signalShot?signalShot.fov:lanternShot?lanternShot.fov:scoped?31:lighting?39:paperView?Math.max(54,2*Math.atan(1.19*height/(1.75*vw))*180/Math.PI):57);
        if(ready&&!cinemaShot&&g.watch&&i===g.watch.task.watcher&&g.engaged[i]&&(scoped&&g.signal||g.survey&&g.stage===2)){
          cam.fov=2*Math.atan(Math.tan(cam.fov*Math.PI/360)/g.watch.magnification)*180/Math.PI;
        }
        if(shot){
          if(shot.blend<1)cam.position.lerp(vector.fromArray(shot.eye),shot.blend);
          else cam.position.fromArray(shot.eye);
          if(TideGallery.active(g)&&g.gallery.phase==='stairs'){
            this.sightlines.retract(i,p,cam.position,g.time,dt,snap);
          }
          vector.fromArray(shot.at);
          if(shot.blend<1){vector.lerp(this.look[i],1-shot.blend);cam.fov=57+(cam.fov-57)*shot.blend;}
          cam.lookAt(vector);
        }
        else{
          this.sightlines.retract(i,p,cam.position,g.time,dt,snap);
          cam.lookAt(this.look[i]);
        }
        cam.aspect=vw/height;cam.updateProjectionMatrix();
        const canLook=ready&&!shared&&!g.engaged[i]&&p.grounded&&(!shot||TideGallery.active(g)&&!shot.handsOnly&&!cinemaShot);
        const watching=this.pointing.follow(i,canLook,t,dt);
        if(paperView)for(let j=0;j<2;j++)this.actors[j].visible=!g.engaged[j];
        if(shot?.handsOnly)for(const part of this.coats[i])part.visible=false;
        if(lanternShot&&i===g.optic.observer&&(!g.optic.mount||g.optic.mount.done))this.actors[i].visible=false;
        this.childDuo?.setView?.(shot?.memory?i:-1);
        this.transitGlass?.update(g,cam,i,cam.aspect,Boolean(shot?.transit));
        if(this.watchHands){if(i===1&&shot?.aftWatch)cam.layers.enable(TideWatchHands.layer);else cam.layers.disable(TideWatchHands.layer);}
        if(this.transitOptics){if(shot?.transit)cam.layers.enable(TideTransitOptics.layer);else cam.layers.disable(TideTransitOptics.layer);}
        this.seaReflection?.use(i,cam,vw,height,t,this.quality);
        if(g.survey&&g.stage===2){
          const compassView=i===1&&ready&&g.engaged[1]&&!cinemaShot&&!g.survey.plotter.legacy;
          if(compassView)this.sternCompass??=TideSternCompass.create(this.scene);
          const reports=g.survey.plotter.reports;
          this.sternCompass?.view(cam,compassView,compassView?TideLookout.camera(g).yaw:0,reports.at(-1));
        }
        viewport(e,start,vw,height);
        if(shot?.focus&&this.quality>=.85&&e.capabilities.isWebGL2){
          const lens=layout.separate&&i===1?(this.partnerLens??=TideLens.create(e)):(this.lens??=TideLens.create(e));
          lens.render(this.scene,cam,start,vw,height,shot.focus,layout.separate?vw:Math.ceil(width/panes.length));
        }else e.render(this.scene,cam);
        if(shot?.handsOnly)for(const part of this.coats[i])part.visible=true;
        if(lanternShot)this.actors[i].visible=true;
        if(paperView)for(const actor of this.actors)actor.visible=true;
        if(ready){this.pin(g,i,watching);this.pointing.draw(i,g.time,p);}
      }
      this.childDuo?.setView?.(-1);
      TideWindows.present(layout,dpr);
      this.snap=false;this.recovered.fill(false);
    }
    belayGrips(p,anchor){
      this.lineHands||=[new T.Vector3(),new T.Vector3()];
      const rise=Math.max(.7,anchor.y-p.y-.99);
      for(const [i,h] of this.lineHands.entries()){
        const t=(i?.66:.49)/rise;
        h.set(p.x+(anchor.x-p.x)*t+(i?.043:-.043),p.y+.99+t*rise,p.z+(anchor.z-p.z)*t-.08);
      }
      return this.lineHands;
    }
    paperGrips(g,side){
      this.paperContacts ||= [[new T.Vector3(),new T.Vector3()],[new T.Vector3(),new T.Vector3()]];
      const hands=this.paperContacts[side],p=g.paper,b=TidePaper.board(g);
      const place=(hand,x,y,lift)=>hands[hand].set(b.x+x,b.y+y*.971+lift*.238,b.z-y*.238+lift*.971);
      if(side===p.holder){
        const c=Math.cos(p.angle),s=Math.sin(p.angle);
        const pinX=p.offset[0]+p.pin[0]*c-p.pin[1]*s,pinY=p.offset[1]+p.pin[0]*s+p.pin[1]*c;
        const pinHand=pinX>0?1:0;
        place(pinHand,pinX,pinY,.095);place(1-pinHand,pinX+(pinHand?-.26:.26),pinY-.12,.070);
      }else{
        place(0,.74,.09,.082);place(1,.94,.15+p.light*.58,.10+p.light*.27);
      }
      return hands;
    }
    pin(g,i,watching=false){
      const {p,name}=targetFor(g,i),player=g.players[i],cam=this.cameras[i];
      const node=document.getElementById('pin'+i);
      const dx=p.x-player.x,dz=p.z-player.z,dy=p.y-player.y,dist=Math.hypot(dx,dy,dz);
      node.hidden=watching||Boolean(i===1&&g.lastPass?.watch.aboard&&g.state.mode)||TideTinMemory.active(g)||g.engaged[i]||dist<1.6||(g.rig?.lightOn&&!g.rig.lit&&g.spec.driver!==i);
      if(node.hidden)return;
      vector.set(p.x,p.y+(p.w&&p.d ? .40 : 1.36),p.z);
      const s=TideBearings.project(vector,cam,pinLimits,pinScreen);
      node.classList.toggle('pin-left',s.x<-.58);node.classList.toggle('pin-right',s.x>.58);
      node.style.left=(s.x+1)*50+'%';node.style.top=(1-s.y)*50+'%';
      const level=Math.abs(dy)>2.1&&Math.hypot(dx,dz)<5?(dy>0?'高处':'低处'):'';
      const label=(pinArrows[s.direction]||'◇')+' '+name+'　'+[s.behind?s.direction:'',level,Math.round(dist)+' m'].filter(Boolean).join(' ');
      if(node.textContent!==label)node.textContent=label;
    }
  }
  return {WorldView,targetFor,makeRenderer,viewport};
})();
