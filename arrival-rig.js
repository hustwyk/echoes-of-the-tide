// The radio rides the forward work deck. The heaving-line loop travels in world space.
const TideArrivalRig=(()=>{
  const T=THREE;
  function create(scene,boat,g){
    const owned=[],track=o=>(owned.push(o),o);
    const station=new T.Group();station.name='交通艇 · 便携值班台';boat.root.add(station);
    station.position.set(.35,-2.62,16.51);
    const cube=track(new T.BoxGeometry(1,1,1)),cyl=track(new T.CylinderGeometry(1,1,1,16));
    const iron=track(new T.MeshStandardMaterial({color:0x455a58,metalness:.62,roughness:.47}));
    const bronze=track(new T.MeshStandardMaterial({color:0xb79758,metalness:.62,roughness:.39}));
    const rubber=track(new T.MeshStandardMaterial({color:0x454944,roughness:.85}));
    const mesh=(par,geo,mat,x,y,z,w,h,d)=>{
      const o=new T.Mesh(geo,mat);o.position.set(x,y,z);o.scale.set(w,h,d);o.castShadow=true;o.receiveShadow=true;par.add(o);return o;
    };
    mesh(station,cube,iron,0,1.02,0,.55,.026,.34);
    for(const x of [-.208,.208])for(const z of [-.126,.126]){
      mesh(station,cyl,iron,x,.51,z,.012,1.02,.012);
      mesh(station,cyl,rubber,x,.020,z,.029,.035,.029);
      mesh(station,cyl,bronze,x,1.036,z,.009,.006,.009);
    }
    const fairlead=new T.Group();boat.root.add(fairlead);fairlead.position.set(1.63,-2.45,15.19);
    mesh(fairlead,cube,iron,0,0,0,.28,.032,.14);
    for(const side of [-1,1]){
      mesh(fairlead,cyl,bronze,side*.10,.064,0,.032,.12,.032).rotation.z=-side*.24;
      mesh(fairlead,cyl,iron,side*.102,.022,.048,.013,.013,.013);
    }
    const radio=TidePocketSet.create(station);radio.root.position.y=1.037;
    const plate=TideHelmPlate.create(boat);
    const sternGear=TideSternGear.create(scene),sternWater=TideSternWater.create(scene);let sternPose=null;
    const board=new T.Group(),post=TideArrival.cleat(g);board.position.set(post.x+.07,post.y-.14,post.z-.65);board.rotation.y=-.40;scene.add(board);
    const paintOff=track(new T.MeshStandardMaterial({color:0xd6c7a2,roughness:.72})),red=track(new T.MeshStandardMaterial({color:0x8e4c3b,roughness:.62}));
    mesh(board,cube,iron,0,.015,0,.23,.04,.19);
    for(let j=0;j<4;j++)mesh(board,cube,j%2?red:paintOff,0,.13+j*.215,0,.088,.218,.079);
    const textMap=track(new T.CanvasTexture((()=>{
      const c=document.createElement('canvas');c.width=384;c.height=186;const v=c.getContext('2d');
      v.fillStyle='#cabd93';v.fillRect(0,0,384,186);v.strokeStyle='#794d36';v.lineWidth=9;v.strokeRect(9,8,366,170);
      v.fillStyle='#514532';v.textAlign='center';v.font='bold 84px serif';v.fillText('首　缆',192,104);v.font='28px monospace';v.fillText('N.06 · BOW',192,148);return c;
    })()));textMap.colorSpace=T.SRGBColorSpace;
    mesh(board,cube,iron,0,.85,0,.46,.228,.030);
    const face=new T.Mesh(track(new T.PlaneGeometry(.45,.218)),track(new T.MeshStandardMaterial({map:textMap,roughness:.74})));
    face.position.set(0,.85,.017);board.add(face);
    for(const x of [-.17,.17])mesh(board,cyl,bronze,x,.85,.022,.008,.009,.008).rotation.x=Math.PI*.5;
    const root=new T.Group();root.name='靠泊 · 首缆';scene.add(root);
    const cord=track(new T.MeshStandardMaterial({color:0xbc996b,roughness:.82,metalness:.01}));
    const sections=30,sides=7,pos=new T.BufferAttribute(new Float32Array(sections*sides*3),3).setUsage(T.DynamicDrawUsage);
    const normal=new T.BufferAttribute(new Float32Array(sections*sides*3),3).setUsage(T.DynamicDrawUsage);
    const colors=[],indices=[];
    for(let j=0;j<sections;j++)for(let i=0;i<sides;i++){
      const shade=.72+.26*Math.cos((i/7+j/9)*Math.PI*6);colors.push(shade,shade,shade);
      if(j===sections-1)continue;const a=j*sides+i,b=j*sides+(i+1)%sides;
      indices.push(a,b+sides,a+sides,a,b,b+sides);
    }
    const geo=track(new T.BufferGeometry());geo.setAttribute('position',pos);geo.setAttribute('normal',normal);
    geo.setAttribute('color',new T.Float32BufferAttribute(colors,3));geo.setIndex(indices);cord.vertexColors=true;
    const rope=new T.Mesh(geo,cord);rope.frustumCulled=false;rope.castShadow=true;root.add(rope);
    const eye=TideBowEye.create(T,root);
    const wash=TideBowWash.create(T,scene);
    // A short row of chalk-white dots follows the trajectory for the current
    // arm stroke. It has no target lock and disappears as the rope leaves.
    const dotShape=track(new T.SphereGeometry(1,8,6));
    const dotPaint=track(new T.MeshBasicMaterial({color:0xffe7c3,transparent:true,opacity:.65,depthWrite:false}));
    const dots=new T.InstancedMesh(dotShape,dotPaint,14);dots.frustumCulled=false;root.add(dots);
    const dot=new T.Object3D();
    const p=new T.Vector3(),tangent=new T.Vector3(),cross=new T.Vector3(),axis=new T.Vector3();
    const points=Array.from({length:sections},()=>new T.Vector3()),hands=[new T.Vector3(),new T.Vector3()],wipePoint=new T.Vector3();
    function vec(a){return new T.Vector3(a.x,a.y,a.z);}
    function world(x,y,z){return vec(TideArrival.deck(g,x,y,z));}
    function bowContacts(s,t){
      const at=world(1.61,-1.57,15.48),dir=world(1.63,-2.36,15.19).sub(at).normalize();
      for(let n=0;n<2;n++){
        const f=.5+.5*Math.cos(t*4.4+n*Math.PI);
        hands[n].copy(at).addScaledVector(dir,s.haul?.06+f*.22:.08+n*.085);
        hands[n].x+=(n?.063:-.063);
      }
      return hands;
    }
    function shape(from,end,slack,bow){
      let fraction=1,edge=null;
      if(bow){
        const start=bow[3],shelf=g.world.fenders.shelf;
        // Trace from the eye on the post toward the boat; the rope crosses the
        // top of the quay before it can droop into the span over open water.
        for(const [key,span] of [['x',shelf.w],['z',shelf.d]]){
          const delta=start[key]-end[key];
          if(Math.abs(delta)>.0001)fraction=Math.min(fraction,(shelf[key]+Math.sign(delta)*span*.5-end[key])/delta);
        }
        fraction=Math.max(0,Math.min(1,1-fraction));
        edge=new T.Vector3().lerpVectors(start,end,fraction);edge.y=Math.max(edge.y,shelf.y+.031);
      }
      for(let j=0;j<sections;j++){
        const t=j/(sections-1),v=points[j];
        if(bow&&t<.53){
          const k=t/.53*3,a=Math.min(2,Math.floor(k));v.lerpVectors(bow[a],bow[a+1],k-a);
        }else{
          const u=bow?(t-.53)/.47:t;
          if(bow&&u>=fraction){
            v.lerpVectors(edge,end,(u-fraction)/Math.max(.0001,1-fraction));
          }else{
            const f=bow?u/Math.max(fraction,.0001):u;
            v.lerpVectors(bow?bow[3]:from,bow?edge:end,f);v.y+=slack*Math.sin(f*Math.PI);
            const shelf=g.world.fenders.shelf;
            if(Math.abs(v.x-shelf.x)<shelf.w*.5&&Math.abs(v.z-shelf.z)<shelf.d*.5)v.y=Math.max(v.y,shelf.y+.022);
          }
        }
      }
      for(let j=0;j<sections;j++){
        tangent.subVectors(points[Math.min(sections-1,j+1)],points[Math.max(0,j-1)]).normalize();
        axis.set(0,1,0);if(Math.abs(tangent.y)>.96)axis.set(1,0,0);
        axis.cross(tangent).normalize();cross.crossVectors(tangent,axis);
        for(let i=0;i<sides;i++){
          const theta=i*Math.PI*2/sides;p.copy(axis).multiplyScalar(Math.cos(theta)).addScaledVector(cross,Math.sin(theta));
          const k=j*sides+i;normal.setXYZ(k,p.x,p.y,p.z);p.multiplyScalar(.018).add(points[j]);pos.setXYZ(k,p.x,p.y,p.z);
        }
      }
      pos.needsUpdate=normal.needsUpdate=true;
    }
    function update(t){
      const s=g.arrival,playing=TideArrival.active(g);root.visible=playing&&s.atBow>.6&&!s.moored;
      sternPose=TideSternLine.equipment(g);sternGear.update(sternPose);
      sternWater.update({...sternPose,active:playing&&!!s?.stern,time:t,water:g.cues.water});
      wash.update({active:playing,impact:s?.bow?.impact,water:g.cues.water,time:t});
      if(!playing)return;
      plate.update(s,t);
      const speech=TideArrival.speech(s.voice),level=s.voice==='captain'?(speech.mouth?.levels[Math.floor(s.voiceAt*20)]||0)/100:0;
      radio.update({tune:(s.dial-6)/10,level,power:true,rx:s.voice==='captain',ptt:s.radio==='test'&&s.use?1:0,tx:false,silent:true},t);
      if(!root.visible)return;
      const b=s.bow,from=world(1.50,-1.55,15.45);
      eye.update(TideBowCast.frame(g));
      dots.visible=!s.attached&&(b.phase==='ready'||b.phase==='wind');
      if(dots.visible){
        const f=TideBowCast.launch(g,b.power),end=TideArrival.cleat(g),span=TideBowCast.crossing(f,end.y);
        for(let n=0;n<dots.count;n++){
          const at=span*(n+1)/(dots.count+1),v=TideBowCast.position(f,at);
          dot.position.set(v.x,v.y,v.z);dot.scale.setScalar(.018+(n%3===2?.008:0));dot.updateMatrix();dots.setMatrixAt(n,dot.matrix);
        }
        dots.instanceMatrix.needsUpdate=true;
      }
      let bow=null;
      if(s.stern){
        const grip=bowContacts(s,t);
        // The crew draw the standing part over the low bronze guide. The
        // bight stays on deck while the long span sags toward the shore post.
        bow=[world(1.48,-2.55,15.94),grip[1],grip[0],world(1.63,-2.36,15.19)];
      }
      shape(from,eye.knot,s.attached?(s.haul?-.055:-.34):b.phase==='air'?-.27:b.phase==='retrieve'?-.22:-.09,bow);
    }
    function grips(i){
      const s=g.arrival;if(!TideArrival.active(g)||s.moored)return null;
      if(i&&s.stern){
        if(!sternPose?.poleVisible||s.stern.phase==='fast')return null;
        return TideSternPose.grips(g,sternPose,hands);
      }
      if(!i&&s.stern)return bowContacts(s,g.time);
      if(!i&&s.atBow<.23)return radio.contacts();
      if(!i){
        if(s.atBow<.78)return null;
        const b=s.bow;
        const feed=b.phase==='retrieve'?.085*Math.sin(b.reels*5.8+Math.PI):0;
        hands[0].copy(world(1.50,-1.55+feed,15.45+feed));
        hands[1].copy(vec(TideBowCast.hand(g,TideBowCast.stroke(b))));return hands;
      }
      const w=boat.helmWheel;w.updateWorldMatrix(true,false);
      hands[0].set(-.004,.072,-.152).applyMatrix4(w.matrixWorld);
      if(Math.abs(s.drive)>.1){boat.throttleLever.updateWorldMatrix(true,false);hands[1].set(-.07,.204,0).applyMatrix4(boat.throttleLever.matrixWorld);}
      else hands[1].set(-.004,.072,.152).applyMatrix4(w.matrixWorld);
      if(s.plate.look>.01)hands[1].lerp(plate.touch(wipePoint),s.plate.look);
      return hands;
    }
    function shot(i,yaw,pitch,ready,aspect){
      const s=g.arrival;if(!TideArrival.active(g))return null;
      const look=clampPan(yaw),rise=Math.max(-.4,Math.min(.6,pitch));
      let eye,at,fov;
      if(i){
        eye=world(-8.70,-.39+rise,18.63+look*.86);
        at=world(-.38,-1.39,15.37+look*2.2);fov=59;
      }else{
        eye=world(.46+look*.09,-1.11+rise*.18,17.00);
        at=world(.35,-1.445,16.53);fov=44;
        const b=s.atBow;if(b>0){
          const pivot=vec(TideBowCast.hand(g,0)),yaw=TideBowCast.turn(g);
          const forward=new T.Vector3(Math.sin(yaw),0,-Math.cos(yaw)),right=new T.Vector3(Math.cos(yaw),0,Math.sin(yaw));
          const shoulder=pivot.clone().addScaledVector(forward,-2.43).addScaledVector(right,.82+look*.35);
          shoulder.y+=1.28+rise*.74;
          const shore=vec(TideArrival.cleat(g)).sub(pivot).clampLength(0,5.4).add(pivot);
          const sight=pivot.clone().addScaledVector(forward,2.2).lerp(shore,.53);sight.y-=.10;
          eye.lerp(shoulder,b);at.lerp(sight,b);fov+=(Math.max(54,Math.min(70,65-.75*(aspect||1)))-fov)*b;
        }
      }
      let entry=ready?Math.min(1,g.time/1.55):0;entry=entry*entry*(3-2*entry);
      if(!i&&entry<1){
        eye.lerp(world(3.32,.44,19.57),1-entry);
        at.lerp(world(-1.60,-1.30,16.05),1-entry);
      }
      if(i)at.lerp(vec(TideArrival.cleat(g)).add(new T.Vector3(0,.55,0)),.23);
      if(i&&s.stern){
        const progress=s.stern.travel,weight=progress*progress*(3-2*progress);
        const target=vec(sternPose.pivot).lerp(vec(sternPose.eye),.38);target.y+=.05;
        const shoulder=world(-3.19+look*.24,-.51+rise*.32,16.82);
        const inspect=s.stern.look*s.stern.look*(3-2*s.stern.look);
        if(inspect>0){
          shoulder.lerp(world(-3.56+look*.18,-.92+rise*.29,16.49),inspect);
          const opening=vec(sternPose.eye).lerp(vec(sternPose.tip),.27);opening.y+=.07;
          target.lerp(opening,inspect);
        }
        eye.lerp(shoulder,weight);at.lerp(target,weight);fov+=(53-11*inspect-fov)*weight;
      }
      if(!i&&s.stern){
        const f=s.stern.travel;
        eye.lerp(world(2.32+look*.25,-.79+rise*.24,16.46),f);
        at.lerp(world(1.62,-1.98,15.04),f);fov+=(57-fov)*f;
      }
      const glance=i?s.plate.look:0;
      if(glance>0){
        const closeup=plate.shot(aspect),blend=glance*glance*(3-2*glance);
        eye.lerp(new T.Vector3().fromArray(closeup.eye),blend);at.lerp(new T.Vector3().fromArray(closeup.at),blend);
        fov+=(closeup.fov-fov)*blend;
      }
      const close=!i&&s.atBow<.65&&entry>.91;

      return {eye:eye.toArray(),at:at.toArray(),fov,handsOnly:close||glance>.82,focus:close&&s.atBow<.05?eye.distanceTo(at):0};
    }
    function seat(){
      const s=g.arrival;if(!TideArrival.active(g)||s.stern?.travel>=.24)return null;
      return {weight:Math.max(0,1-(s.stern?.travel||0)/.24),hip:world(-5.907,-2.0456,16.65),
        feet:[world(-5.556,-2.486,16.45),world(-5.514,-2.486,16.85)]};
    }
    function clampPan(v){return Math.max(-1,Math.min(1,Math.sin(v)));}
    return {update,grips,shot,seat,plate,get stern(){return sternPose;},dispose(){dots.dispose();eye.dispose();wash.dispose();sternWater.dispose();sternGear.dispose();plate.dispose();radio.dispose();fairlead.removeFromParent();station.removeFromParent();board.removeFromParent();root.removeFromParent();for(const o of owned)o.dispose();}};
  }
  return {create};
})();
