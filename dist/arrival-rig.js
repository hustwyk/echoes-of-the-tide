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
    const radio=TidePocketSet.create(station);radio.root.position.y=1.037;
    const plate=TideHelmPlate.create(boat);
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
    const loop=new T.Group();root.add(loop);
    const eyelet=new T.CatmullRomCurve3([[0,-.245,0],[-.18,-.13,.009],[-.245,.05,.018],[-.16,.214,-.004],
      [.052,.255,.013],[.226,.119,.019],[.197,-.071,-.008],[.039,-.215,0]].map(a=>new T.Vector3(...a)),true);
    const braids=[0xb09870,0xcab287,0x958462].map(color=>track(new T.MeshStandardMaterial({color,roughness:.82})));
    for(let strand=0;strand<3;strand++){
      const path=[];for(let k=0;k<240;k++){const t=k/240,p=eyelet.getPointAt(t),tan=eyelet.getTangentAt(t),angle=t*2*Math.PI*17+strand*2*Math.PI/3;
        p.x+=tan.y*.007*Math.cos(angle);p.y-=tan.x*.007*Math.cos(angle);p.z+=.007*Math.sin(angle);path.push(p);}
      loop.add(new T.Mesh(track(new T.TubeGeometry(new T.CatmullRomCurve3(path,true),240,.009,5,true)),braids[strand]));
    }
    for(let k=0;k<5;k++)mesh(loop,cyl,braids[k%3],.008,-.230-k*.009,0,.023,.012,.023);
    const knot=new T.Vector3();
    const ghost=new T.Mesh(track(new T.TorusGeometry(.28,.009,6,40)),track(new T.MeshBasicMaterial({color:0xf3df9e,transparent:true,opacity:.73,depthWrite:false})));
    ghost.rotation.x=-Math.PI*.5;root.add(ghost);
    const p=new T.Vector3(),tangent=new T.Vector3(),cross=new T.Vector3(),axis=new T.Vector3();
    const points=Array.from({length:sections},()=>new T.Vector3()),hands=[new T.Vector3(),new T.Vector3()],wipePoint=new T.Vector3();
    function vec(a){return new T.Vector3(a.x,a.y,a.z);}
    function world(x,y,z){return vec(TideArrival.deck(g,x,y,z));}
    function shape(from,end,slack){
      for(let j=0;j<sections;j++){
        const t=j/(sections-1);points[j].copy(from).lerp(end,t);points[j].y+=slack*Math.sin(t*Math.PI);
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
      if(!playing)return;
      plate.update(s,t);
      const speech=TideArrival.speech(s.voice),level=s.voice==='captain'?(speech.mouth?.levels[Math.floor(s.voiceAt*20)]||0)/100:0;
      radio.update({tune:(s.dial-6)/10,level,power:true,rx:s.voice==='captain',ptt:s.radio==='test'&&s.use?1:0,tx:false,silent:true},t);
      if(!root.visible)return;
      const target=TideArrival.cleat(g),end=TideArrival.endPoint(g);
      const from=world(1.50,-1.55,15.45);
      const throwSite=world(1.68,-1.69,15.39);
      loop.position.copy(throwSite);loop.rotation.set(-1.12,0,.45);ghost.visible=!s.attached&&!s.flight;
      // The aiming loop rests on the dock or the live water, in the same space as the cast.
      const shelf=g.world.fenders.shelf,over=Math.abs(end.x-shelf.x)<shelf.w*.5+.17&&Math.abs(end.z-shelf.z)<shelf.d*.5+.17;
      ghost.position.set(end.x,over?shelf.y+.17:g.cues.water+TideFloating.swell(end.x,end.z,t)+.10,end.z);
      ghost.material.opacity=.64+.16*Math.sin(t*4);
      if(s.flight){
        const f=s.flight,k=Math.min(1,f.age/.70);
        loop.position.copy(vec(f.from)).lerp(vec(f.to),k);
        loop.position.y+=1.06*4*k*(1-k);
        loop.rotation.set(-1.16-.35*k,0,.45*(1-k));
        if(!f.hit&&k>=1){loop.position.lerp(throwSite,Math.min(1,(f.age-.7)/.46));}
      }else if(s.attached){loop.position.copy(vec(target));loop.rotation.set(-Math.PI*.5,0,0);}
      loop.updateWorldMatrix(true,false);knot.set(.008,-.267,0).applyMatrix4(loop.matrixWorld);
      shape(from,knot,s.attached?-.19:s.flight?-.44:-.12);
    }
    function grips(i){
      const s=g.arrival;if(!TideArrival.active(g)||s.moored)return null;
      if(!i&&s.atBow<.23)return radio.contacts();
      if(!i){
        if(s.atBow<.78)return null;
        const a=g.players[0],ext=s.flight?Math.sin(Math.min(1,s.flight.age/.45)*Math.PI):0;
        hands[0].copy(world(1.48,-1.56,15.45));hands[1].copy(world(1.74,-1.67+ext*.28,15.37-ext*.20));return hands;
      }
      const w=boat.helmWheel;w.updateWorldMatrix(true,false);
      hands[0].set(-.004,.072,-.152).applyMatrix4(w.matrixWorld);
      if(Math.abs(s.drive)>.1){boat.throttleLever.updateWorldMatrix(true,false);hands[1].set(-.07,.204,0).applyMatrix4(boat.throttleLever.matrixWorld);}
      else hands[1].set(-.004,.072,.152).applyMatrix4(w.matrixWorld);
      if(s.plate.look>.01)hands[1].lerp(plate.touch(wipePoint),s.plate.look);
      return hands;
    }
    function shot(i,yaw,pitch,ready,aspect){
      const s=g.arrival;if(!TideArrival.active(g)||s.moored&&s.walking>.60)return null;
      const look=clampPan(yaw),rise=Math.max(-.4,Math.min(.6,pitch));
      let eye,at,fov;
      if(i){
        eye=world(-8.70,-.39+rise,18.63+look*.86);
        at=world(-.38,-1.39,15.37+look*2.2);fov=59;
      }else{
        eye=world(.46+look*.09,-1.11+rise*.18,17.00);
        at=world(.35,-1.445,16.53);fov=44;
        const b=s.atBow;if(b>0){
          eye.lerp(world(2.45,.07+rise,18.45+look*.65),b);
          at.lerp(vec(TideArrival.endPoint(g)).lerp(world(1.65,-1.5,15.62),.38),b);
          fov+=12*b;
        }
      }
      let entry=ready?Math.min(1,g.time/1.55):0;entry=entry*entry*(3-2*entry);
      if(!i&&entry<1){
        eye.lerp(world(3.32,.44,19.57),1-entry);
        at.lerp(world(-1.60,-1.30,16.05),1-entry);
      }
      if(i)at.lerp(vec(TideArrival.cleat(g)).add(new T.Vector3(0,.55,0)),.23);
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
      const s=g.arrival;if(!TideArrival.active(g)||s.walking>.17)return null;
      return {weight:Math.max(0,1-s.walking/.15),hip:world(-5.907,-2.0456,16.65),
        feet:[world(-5.556,-2.486,16.45),world(-5.514,-2.486,16.85)]};
    }
    function clampPan(v){return Math.max(-1,Math.min(1,Math.sin(v)));}
    return {update,grips,shot,seat,plate,dispose(){plate.dispose();radio.dispose();station.removeFromParent();board.removeFromParent();root.removeFromParent();for(const o of owned)o.dispose();}};
  }
  return {create};
})();
