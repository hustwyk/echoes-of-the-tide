// A single scene and renderer keep lighting, moving decks and the ferry shared.
const TideHarbor = (() => {
  const T=THREE;
  const colors=[0xffad65,0x71e5db];
  const clamp=TideTraversal.clamp;
  const vector=new T.Vector3();
  function targetFor(g,i) {
    const sec=g.section, s=g.spec,q=g.state;
    if(!g.field.done){const site=sec.field.sites[i];return {p:site,name:site.label};}
    if(TideLookout.active(g))return {p:sec.sites[i],name:i===g.watch.task.watcher?'远望镜':'船位记录簿'};
    if(s.type==='ride'){
      if(q.latch){
        if(i!==s.driver&&q.returnGate<2&&(s.mode!=='basket'||(g.index===0&&g.stage===1)))return {p:sec.sites[i],name:'回程闸'};
        return {p:sec.ends[i],name:'会合点'};
      }
      if(i!==s.driver && q.ferry<.78)return {p:sec.ferry.deck,name:s.mode==='raft'?'登上浮架':s.mode==='bridge'?'移动桥面':'登上吊篮'};
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
        this.yaws[i]=this.pitch[i]=0;
      });
    }
    free() {
      if(!this.scene)return;
      this.dockside?.dispose();this.cinema?.dispose();this.fieldProps?.dispose();this.coast?.dispose();
      for(const asset of this.custom)asset.dispose();
      this.custom.clear();this.scene.clear();this.scene=null;
    }
    own(asset){this.custom.add(asset);return asset;}
    load(g) {
      this.free();this.scene=new T.Scene();this.scene.background=new T.Color(0x597580);
      this.coast=TideCoast.create(this.scene,Math.floor(g.index/3),g.index);
      this.floors=new Map();this.rigs=[];this.halos=[];
      const add=(m)=>{this.scene.add(m);return m;};
      for(const d of g.world.floors){
        const obj=this.equipment.deck(d.w,d.d,d.kind);
        obj.position.set(d.x,d.y,d.z);obj.visible=d.active;add(obj);this.floors.set(d,obj);
      }
      for(const section of g.world.sections) {
        section.devices=section.sites.map((site,i)=>{
          const obj=this.equipment.device(site.kind,i);
          obj.position.set(site.x,site.y,site.z-.95);return add(obj);
        });
        if(section.field)section.field.devices=section.field.sites.map((site,i)=>{
          const obj=this.equipment.device(site.kind,i);obj.scale.setScalar(.88);obj.position.set(site.x,site.y,site.z-.95);return add(obj);
        });
        if(section.ferry)this.addRig(section);
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
      this.ship.position.set(14,-4,-61);add(this.ship);
      this.dockside=TideDockside.create(this.scene,g);
      this.fieldProps=TideFieldProps.create(this.scene,g);
      this.cinema=TideCinema.create(this.scene,g,{ship:this.ship,actors:this.actors,cameras:this.cameras,marker:this.coast.marker});
      this.yaws.fill(0);this.pitch.fill(0);this.snap=true;
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
      this.coast.update(t,g.cues);
      this.ship.position.set(12+g.cues.rescue*16+Math.sin(t*.055)*1.8,g.cues.water+.21*Math.sin(t*.95),-59-g.cues.rescue*12);
      this.ship.rotation.set(.028*Math.sin(t*.78),1.12+g.cues.rescue*.7,.034*Math.sin(t*.91));
      for(const [d,obj] of this.floors){
        obj.visible=d.active;
        if(d.dynamic)obj.position.set(d.x,d.y,d.z);
      }
      for(const {deck,h,ropes} of this.rigs)for(const {m,s} of ropes){
        const top=deck.y+.94;
        m.position.set(deck.x+s*1.25,(h+top)/2,deck.z);m.scale.y=h-top;
      }
      const phase=g.hazardPhase();
      for(const {sec,mesh} of this.hazards){
        mesh.visible=sec===g.section;
        mesh.material.opacity=phase>.78?.87:phase>.55?.3+.4*Math.abs(Math.sin(t*10)):.20;
      }
      for(let i=0;i<2;i++){
        const p=g.players[i],obj=this.actors[i];
        obj.position.set(p.x,p.y,p.z);obj.rotation.y=p.yaw;
        TideActors.animate(obj,{speed:p.speed,grounded:p.grounded,operating:g.engaged[i]},dt,t);
        const goal=targetFor(g,i).p;this.halos[i].position.set(goal.x,goal.y+.065,goal.z);
        this.halos[i].scale.setScalar(1+.075*Math.sin(t*3+i));
        const v=g.spec.type==='ride'?g.state.ferry:g.state.dials[i];
        this.equipment.drive(g.section.devices[i],v,t);
        if(g.section.field)this.equipment.drive(g.section.field.devices[i],g.field.values[i],t);
      }
      this.dockside.update(g,dt);this.fieldProps.update(g,dt);this.cinema.update(g,dt);
      // Cache the sun's shadow map between the two views.
      e.shadowMap.autoUpdate=false;e.shadowMap.needsUpdate=true;
      const count=this.cinema.shared?1:2;
      for(let i=0;i<count;i++){
        const start=Math.floor(width*i/count),end=Math.floor(width*(i+1)/count),vw=end-start;
        const cam=this.cameras[i],p=g.players[i],yaw=this.yaws[i];
        const cameraHeight=(g.engaged[i]?2.7:3.55)+this.pitch[i];
        const radius=g.engaged[i]?4.15:5.25;
        vector.set(p.x+Math.sin(yaw)*radius,p.y+cameraHeight,p.z+Math.cos(yaw)*radius);
        const blend=this.snap?1:1-Math.exp(-Math.max(dt,.001)*8);
        cam.position.lerp(vector,blend);
        vector.set(p.x-Math.sin(yaw)*2,p.y+1.6,p.z-Math.cos(yaw)*2);
        this.look[i].lerp(vector,blend);cam.lookAt(this.look[i]);
        const scoped=ready&&TideLookout.active(g)&&g.watch.task.watcher===i&&g.engaged[i];
        const shot=this.cinema.shot(g,i)||(scoped?TideLookout.camera(g):null);
        cam.fov=scoped?31:57;
        if(shot){cam.position.fromArray(shot.eye);cam.lookAt(vector.fromArray(shot.at));}
        cam.aspect=vw/height;cam.updateProjectionMatrix();
        e.setViewport(start,0,vw,height);e.setScissor(start,0,vw,height);e.render(this.scene,cam);
        if(ready)this.pin(g,i);
      }
      this.snap=false;
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
      node.hidden=g.engaged[i] || dist<1.6;
    }
  }
  return {WorldView,targetFor};
})();
