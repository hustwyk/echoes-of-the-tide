// A single scene and renderer keep lighting, moving decks and the ferry shared.
const TideHarbor = (() => {
  const T=THREE;
  const colors=[0xffad65,0x71e5db];
  const clamp=TideTraversal.clamp;
  const vector=new T.Vector3();
  function targetFor(g,i) {
    const sec=g.section, s=g.spec,q=g.state;
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
  class WorldView {
    constructor(canvas) {
      this.canvas=canvas;
      this.renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});
      this.renderer.outputColorSpace=T.SRGBColorSpace;
      this.renderer.toneMapping=T.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure=1.07;
      this.renderer.shadowMap.enabled=true;
      this.renderer.shadowMap.type=T.PCFSoftShadowMap;
      this.renderer.setScissorTest(true);
      this.equipment=TideEquipment.create();
      this.actors=[TideActors.person(0),TideActors.person(1)];
      this.coats=this.actors.map(a=>{
        const b=a.userData.rig.bones;
        return [...b.chest.children.filter(n=>n!==b.arm0&&n!==b.arm1),...b.arm0.children.filter(n=>n.isMesh),...b.arm1.children.filter(n=>n.isMesh)];
      });
      this.ship=TideActors.ferry();
      this.cameras=[0,1].map(()=>new T.PerspectiveCamera(57,1,.12,420));
      this.look=[new T.Vector3(),new T.Vector3()];
      this.yaws=[0,0];this.pitch=[0,0];this.quality=1;this.custom=new Set();
      this.haloGeo=new T.RingGeometry(.76,.83,48);this.dotGeo=new T.RingGeometry(.9,.93,48);
      this.haloMats=colors.map(c=>new T.MeshBasicMaterial({color:c,side:T.DoubleSide,transparent:true,opacity:.89,depthWrite:false}));
      this.pointer=null;
      canvas.addEventListener('pointerdown',e=>{
        if(e.button!==0)return;
        const b=canvas.getBoundingClientRect();
        this.pointer={id:e.pointerId,i:e.clientX-b.left<b.width/2?0:1,x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);
      });
      canvas.addEventListener('pointermove',e=>{
        const p=this.pointer;if(!p||p.id!==e.pointerId)return;
        this.yaws[p.i]-=(e.clientX-p.x)*.005;
        this.pitch[p.i]=clamp(this.pitch[p.i]+(e.clientY-p.y)*.008,-1.15,2.1);
        p.x=e.clientX;p.y=e.clientY;
      });
      canvas.addEventListener('lostpointercapture',()=>this.pointer=null);
      canvas.addEventListener('dblclick',e=>{
        const b=canvas.getBoundingClientRect(),i=e.clientX-b.left<b.width/2?0:1;
        this.yaws[i]=this.homeYaw;this.pitch[i]=0;
      });
    }
    free() {
      if(!this.scene)return;
      this.archiveStudio?.dispose();this.signalhouse?.dispose();this.lanternroom?.dispose();this.bridgework?.dispose();this.dockside?.dispose();this.cinema?.dispose();this.fieldProps?.dispose();this.coast?.dispose();
      for(const asset of this.custom)asset.dispose();
      this.custom.clear();this.scene.clear();this.scene=null;this.equipment.releaseDecks();
      this.lens?.dispose();this.lens=null;
    }
    own(asset){this.custom.add(asset);return asset;}
    load(g) {
      this.free();this.scene=new T.Scene();this.scene.background=new T.Color(0x597580);
      this.coast=g.archive?null:TideCoast.create(this.scene,Math.floor(g.index/3),g.index);
      this.floors=new Map();this.rigs=[];this.halos=[];
      const add=(m)=>{this.scene.add(m);return m;};
      for(const d of g.world.floors){
        const obj=d.axes||g.archive||d.kind==='tram'?new T.Group():this.equipment.deck(d.w,d.d,d.kind);
        obj.position.set(d.x,d.y,d.z);obj.visible=d.active;add(obj);this.floors.set(d,obj);
      }
      for(const section of g.world.sections) {
        section.devices=section.sites.map((site,i)=>{
          if(g.archive)return new T.Group();
          const obj=this.equipment.device(section.span?'brake':site.kind,i);
          obj.position.set(site.x,site.y,site.z-.95);
          if(g.world.lantern||g.signal||section.tram||section.spec.type==='paper')obj.visible=false;
          return add(obj);
        });
        if(section.field)section.field.devices=section.field.sites.map((site,i)=>{
          const obj=this.equipment.device(site.kind,i);obj.scale.setScalar(.88);obj.position.set(site.x,site.y,site.z-.95);return add(obj);
        });
        if(section.ferry&&!section.span)this.addRig(section);
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
      this.signalhouse=g.signal?TideSignalHouse.create(this.scene,g,this.equipment):null;
      this.archiveStudio=g.archive?TideArchiveStudio.create(this.scene,g,this.renderer):null;
      this.lanternroom=g.world.lantern?TideLanternRoom.create(this.scene,g):null;
      this.bridgework=TideBridgework.create(this.scene,g,this.floors,this.actors);
      this.ship.position.fromArray(TideLookout.vessel(g,g.time));if(!g.archive)add(this.ship);
      this.dockside=g.world.lantern||g.signal||g.archive?null:TideDockside.create(this.scene,g);
      this.fieldProps=g.archive?null:TideFieldProps.create(this.scene,g,this.actors);
      this.cinema=TideCinema.create(this.scene,g,{ship:this.ship,actors:this.actors,cameras:this.cameras,marker:this.coast?.marker});
      this.homeYaw=g.signal?TideSignal.yaw:g.world.lantern?TideLantern.yaw:0;
      this.yaws.fill(this.homeYaw);this.pitch.fill(0);this.snap=true;
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
    draw(g,dt,ready=true) {
      const e=this.renderer,t=g.time+(this.cinema.ended?0:this.cinema.time);
      const width=Math.round(this.canvas.clientWidth),height=Math.round(this.canvas.clientHeight);
      if(width<2||height<2)return;
      const dpr=Math.min(window.devicePixelRatio||1,1.5)*this.quality;
      if(this.w!==width||this.h!==height||this.dpr!==dpr){
        this.w=width;this.h=height;this.dpr=dpr;e.setPixelRatio(dpr);e.setSize(width,height,false);
      }
      this.coast?.update(t,g.cues);
      this.ship.position.fromArray(TideLookout.vessel(g,t));
      this.ship.rotation.set(.028*Math.sin(t*.78),g.signal?TideSignal.ship(g,t).yaw:1.12+g.cues.rescue*.7,.034*Math.sin(t*.91));
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
      this.archiveStudio?.update(g);this.signalhouse?.update(g);this.bridgework?.update();this.lanternroom?.update(g);
      const phase=g.hazardPhase();
      for(const {sec,mesh} of this.hazards){
        mesh.visible=sec===g.section;
        mesh.material.opacity=phase>.78?.87:phase>.55?.3+.4*Math.abs(Math.sin(t*10)):.20;
      }
      for(let i=0;i<2;i++){
        const p=g.players[i],obj=this.actors[i],acting=this.cinema.performance(i);
        const pose=acting||p;
        obj.position.set(pose.x,pose.y,pose.z);obj.rotation.y=pose.yaw;
        const goal=targetFor(g,i).p;this.halos[i].position.set(goal.x,goal.y+.065,goal.z);
        this.halos[i].scale.setScalar(1+.075*Math.sin(t*3+i));
        const drivingValve=g.spec.mode==='raft'&&i===g.spec.driver;
        const v=drivingValve ? .5+.45*g.rig.flow : g.spec.type==='ride'?g.state.ferry:g.state.dials[i];
        this.equipment.drive(g.section.devices[i],v,t);
        if(g.section.field)this.equipment.drive(g.section.field.devices[i],g.field.values[i],t);
        const using=!acting&&g.engaged[i],paper=using&&g.paper&&g.field.done;
        const device=g.field.done?g.section.devices[i]:g.section.field.devices[i];
        const span=g.section.span;
        const movingGrip=g.section.tram||span&&!span.seated&&i!==g.spec.driver;
        const carry=!acting&&g.archive&&g.stage===1&&g.archive.fetched[i]&&!g.archive.mounted[i];
        const grips=carry?this.archiveStudio.carryGrips(g,i):!using?null:g.archive?(g.archive.location[i]==='desks'?this.archiveStudio.desks[i].hands():this.archiveStudio.shelfGrips(g,i)):g.signal?this.signalhouse.hands(g,i):g.optic?this.lanternroom.hands(g,i):movingGrip?this.bridgework.hands(g.section,i):paper?this.paperGrips(g,i):this.equipment.grips(device);
        const workSpeed=g.optic?.mount&&!g.optic.mount.done&&using?g.optic.mount.speed||0:p.speed;
        TideActors.animate(obj,{speed:acting?0:workSpeed,grounded:p.grounded,operating:using||carry,grips,...acting},dt,t);
      }
      this.dockside?.update(g,dt);this.fieldProps?.update(g,dt);this.cinema.update(g,dt);
      // Cache the sun's shadow map between the two views.
      e.shadowMap.autoUpdate=false;e.shadowMap.needsUpdate=true;
      const count=this.cinema.shared?1:2;
      for(let i=0;i<count;i++){
        const start=Math.floor(width*i/count),end=Math.floor(width*(i+1)/count),vw=end-start;
        const cam=this.cameras[i],p=g.players[i],yaw=this.yaws[i];
        const inside=g.section.span?.lower&&p.ground===g.section.span.deck;
        const braking=g.section.span&&!g.section.span.seated&&i===g.spec.driver&&g.engaged[i];
        const angle=yaw+(braking?(i?.46:-.46):0);
        const cameraHeight=(g.archive?2.38:g.optic?2.44:inside?1.80:g.engaged[i]?2.7:3.55)+this.pitch[i];
        const radius=g.archive?3.5:g.optic?3.35:inside?2.95:braking?5.45:g.engaged[i]?4.15:5.25;
        vector.set(p.x+Math.sin(angle)*radius,p.y+cameraHeight,p.z+Math.cos(angle)*radius);
        if(g.optic){const arm=TideLantern.cameraArm(p,vector);vector.set(arm.x,arm.y,arm.z);}
        if(g.archive){vector.x=clamp(vector.x,-6.12,6.12);vector.z=Math.max(vector.z,-4.75);vector.y=Math.min(3.42,vector.y);}
        const blend=this.snap?1:1-Math.exp(-Math.max(dt,.001)*8);
        cam.position.lerp(vector,blend);
        vector.set(p.x-Math.sin(angle)*(braking?4:2),p.y+(inside?1.16:1.6),p.z-Math.cos(angle)*2);
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
        const paperView=ready&&g.paper&&g.field.done&&g.engaged[i];
        const lanternShot=ready&&g.optic?TideLantern.shot(g,i):null;
        const signalShot=ready&&g.signal?TideSignal.shot(g,i):null;
        const tapeShot=ready&&g.archive?TideArchive.shot(g,i):null;
        const shot=this.cinema.shot(g,i)||tapeShot||signalShot||lanternShot||(scoped?TideLookout.camera(g):paperView?TidePaper.camera(g,i):beam);
        cam.fov=tapeShot?tapeShot.fov:signalShot?signalShot.fov:lanternShot?lanternShot.fov:scoped?31:lighting?39:paperView?Math.max(54,2*Math.atan(1.19*height/(1.75*vw))*180/Math.PI):57;
        if(shot){cam.position.fromArray(shot.eye);cam.lookAt(vector.fromArray(shot.at));}
        cam.aspect=vw/height;cam.updateProjectionMatrix();
        if(paperView)for(let j=0;j<2;j++)this.actors[j].visible=!g.engaged[j];
        if(shot?.handsOnly)for(const part of this.coats[i])part.visible=false;
        if(lanternShot&&i===g.optic.observer&&(!g.optic.mount||g.optic.mount.done))this.actors[i].visible=false;
        e.setViewport(start,0,vw,height);e.setScissor(start,0,vw,height);
        if(shot?.focus&&this.quality>=.85&&e.capabilities.isWebGL2){
          this.lens ||= TideLens.create(e);this.lens.render(this.scene,cam,start,vw,height,shot.focus);
        }else e.render(this.scene,cam);
        if(shot?.handsOnly)for(const part of this.coats[i])part.visible=true;
        if(lanternShot)this.actors[i].visible=true;
        if(paperView)for(const actor of this.actors)actor.visible=true;
        if(ready)this.pin(g,i);
      }
      this.snap=false;
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
    pin(g,i){
      const {p,name}=targetFor(g,i),player=g.players[i],cam=this.cameras[i];
      const node=document.getElementById('pin'+i);
      const dist=Math.hypot(player.x-p.x,player.z-p.z);
      vector.set(p.x,p.y+2.05,p.z).project(cam);
      const behind=vector.z>1;
      node.style.left=clamp(behind?.5:(vector.x+1)/2,.13,.87)*100+'%';
      node.style.top=clamp(behind?.36:(1-vector.y)/2,.16,.70)*100+'%';
      const label=(behind?'↶ ':vector.x>1?'→ ':vector.x< -1?'← ':'◇ ')+name+'　'+Math.round(dist)+'m';
      if(node.textContent!==label)node.textContent=label;
      node.hidden=g.engaged[i] || dist<1.6 || (g.rig?.lightOn&&!g.rig.lit&&g.spec.driver!==i);
    }
  }
  return {WorldView,targetFor};
})();
