// Mechanical bearing repeater for the shore light. The station comes directly from
// the final section: the lantern axis itself remains at the lighthouse, out to sea.
const TidePilotStand=(()=>{
  function create(scene,g){
    const T=THREE,section=g.world.sections[2],s=section.sites[0],root=new T.Group(),owned=new Set();
    const own=o=>(owned.add(o),o);root.name='Shore pilot repeater';root.position.set(s.x+.16,s.y,s.z-.86);scene.add(root);
    const Y=new T.Vector3(0,1,0),Z=new T.Vector3(0,0,1),V=(x,y,z)=>new T.Vector3(x,y,z),q=new T.Quaternion(),tau=Math.PI*2;
    function group(p,x,y,z){const o=new T.Group();o.position.set(x,y,z);p.add(o);return o;}
    const ops=[],templates=new Set(),std=(c,r,m)=>own(new T.MeshStandardMaterial({color:c,roughness:r,metalness:m}));
    function texture(w,h,draw){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);
      const t=own(new T.CanvasTexture(c));if('colorSpace'in t)t.colorSpace=T.SRGBColorSpace;else t.encoding=T.sRGBEncoding;t.anisotropy=6;return t;}
    let seed=1797;const rr=()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296);
    const weather=texture(384,384,(c,w,h)=>{c.fillStyle='#668686';c.fillRect(0,0,w,h);
      for(let i=0;i<28000;i++){const x=rr()*w,y=rr()*h;c.fillStyle=i%3?'rgba(194,213,190,.14)':'rgba(39,55,46,.26)';c.fillRect(x,y,.4+rr()*3,.7+rr()*5);}
      for(let i=0;i<86;i++){const x=rr()*w,y=rr()*h;
        for(let j=0;j<27;j++){const a=rr()*tau,r=rr()**2*13;c.fillStyle=j%5?'rgba(97,72,49,.60)':'rgba(169,138,84,.59)';c.fillRect(x+Math.cos(a)*r,y+Math.sin(a)*r,.5+rr()*2,.8+rr()*3);}
        c.strokeStyle='rgba(83,72,49,.17)';c.beginPath();c.moveTo(x,y);c.lineTo(x+.5,y+rr()*18);c.stroke();}
    });
    const blue=std(0xc3d2cb,.62,.40);blue.map=weather;blue.bumpMap=weather;blue.bumpScale=.0014;
    const iron=std(0x424b47,.65,.39),gun=std(0x64675a,.53,.56),brass=std(0xc4a368,.36,.64),worn=std(0x9a7945,.46,.55),
      zinc=std(0xc9c9af,.38,.52),wood=std(0x776449,.55,.12),red=std(0x9c4c37,.49,.31);
    const cube=new T.BoxGeometry(),hex=new T.CylinderGeometry(1,1,1,6),cyl=new T.CylinderGeometry(1,1,1,32),pipe=new T.CylinderGeometry(1,1,1,12);
    [cube,hex,cyl,pipe].forEach(a=>templates.add(a));
    function mesh(p,geo,m,x=0,y=0,z=0){templates.add(geo);const o=new T.Mesh(geo,m);o.position.set(x,y,z);p.add(o);ops.push(o);return o;}
    function box(p,x,y,z,w,h,d,m){const o=mesh(p,cube,m,x,y,z);o.scale.set(w,h,d);return o;}
    function cylinder(p,x,y,z,r,h,axis,m,shape=cyl){const o=mesh(p,shape,m,x,y,z);o.quaternion.setFromUnitVectors(Y,axis);o.scale.set(r,h,r);return o;}
    function shaft(p,a,b,r,m){const d=b.clone().sub(a),o=mesh(p,pipe,m);o.position.copy(a).lerp(b,.5);o.scale.set(r,d.length(),r);o.quaternion.setFromUnitVectors(Y,d.normalize());return o;}
    function torus(p,x,y,z,r,t,m){return mesh(p,new T.TorusGeometry(r,t,10,72),m,x,y,z);}
    function casebox(p,x,y,z,w,h,d,r,m){
      const sh=new T.Shape(),a=w/2,b=h/2;sh.moveTo(-a+r,-b);sh.lineTo(a-r,-b);sh.quadraticCurveTo(a,-b,a,-b+r);sh.lineTo(a,b-r);
      sh.quadraticCurveTo(a,b,a-r,b);sh.lineTo(-a+r,b);sh.quadraticCurveTo(-a,b,-a,b-r);sh.lineTo(-a,-b+r);sh.quadraticCurveTo(-a,-b,-a+r,-b);
      return mesh(p,new T.ExtrudeGeometry(sh,{depth:d,bevelEnabled:true,bevelSize:.007,bevelThickness:.004,bevelSegments:2,curveSegments:5}),m,x,y,z);}
    // Continuous gripping foundation and connected shaft; firm on the existing grated platform.
    box(root,0,.017,0,.82,.034,.60,iron);
    for(const x of [-.344,.344])for(const z of [-.238,.238]){
      cylinder(root,x,.041,z,.032,.012,Y,gun);cylinder(root,x,.053,z,.021,.018,Y,zinc,hex);}
    casebox(root,0,.44,-.176,.474,.82,.322,.047,blue);
    for(const x of [-.224,.224]){shaft(root,V(x,.080,.174),V(x,.524,.133),.018,gun);
      box(root,x,.071,.146,.079,.060,.147,blue);}
    const head=group(root,0,1.042,-.008);head.rotation.x=-.28;
    casebox(head,0,.085,-.145,.827,.563,.264,.065,blue);
    casebox(head,0,.080,.111,.789,.518,.018,.053,iron);
    casebox(head,0,.080,.139,.762,.489,.012,.044,blue);
    for(const x of [-.341,.341])for(const yy of [-.112,.273])cylinder(head,x,yy,.162,.012,.014,Z,zinc,hex);
    const wh=group(head,-.070,-.025,.278);
    cylinder(head,-.070,-.025,.188,.102,.097,Z,gun);cylinder(head,-.070,-.025,.237,.077,.080,Z,worn);
    torus(wh,0,0,.012,.290,.023,brass);torus(wh,0,0,-.002,.288,.008,worn);
    for(let i=0;i<5;i++){
      const a=i*tau/5,x=Math.sin(a),y=Math.cos(a),X=Math.sin(a+.14),Y0=Math.cos(a+.14);
      shaft(wh,V(.062*x,.062*y,-.017),V(.21*X,.21*Y0,.012),.0135,worn);
      shaft(wh,V(.208*X,.208*Y0,.012),V(.287*x,.287*y,.012),.0128,brass);
      cylinder(wh,x*.060,y*.060,.017,.008,.012,Z,zinc,hex);}
    cylinder(wh,0,0,0,.083,.054,Z,worn);cylinder(wh,0,0,.034,.057,.018,Z,brass);cylinder(wh,0,0,.052,.018,.025,Z,gun,hex);
    const handle=group(wh,.240,.163,.024);
    cylinder(handle,0,0,.050,.016,.103,Z,zinc);
    cylinder(handle,0,0,.110,.028,.100,Z,wood);
    for(const zz of [.068,.151])cylinder(handle,0,0,zz,.030,.013,Z,worn);
    // The angle window is raised above the rim so a hand cannot obscure both scales.
    const gauge=group(head,.245,.251,.218);gauge.rotation.x=.065;const radius=.203;
    cylinder(gauge,0,0,-.026,radius+.014,.085,Z,blue);cylinder(gauge,0,0,.024,radius,.044,Z,gun);
    torus(gauge,0,0,.053,radius-.003,.010,zinc);torus(gauge,0,0,.054,radius-.015,.0043,worn);
    const min=-95,max=-25,needleAngle=d=>(d+60)*Math.PI/180*2.28;
    const dial=texture(768,768,(c,w,h)=>{const mid=w/2;c.translate(mid,mid);
      const grad=c.createLinearGradient(0,-mid,0,mid);grad.addColorStop(0,'#dcddc9');grad.addColorStop(.47,'#d0ccae');grad.addColorStop(1,'#a9a68b');
      c.fillStyle=grad;c.fillRect(-mid,-mid,w,h);
      for(let j=0;j<8000;j++){c.fillStyle=j%2?'rgba(255,252,233,.20)':'rgba(40,47,37,.16)';c.fillRect(rr()*w-mid,rr()*h-mid,.5+rr()*2,1);}
      for(let d=min;d<=max;d++){
        const a=needleAngle(d),ss=Math.sin(a),cc=-Math.cos(a),major=d%5===0,r1=mid*.900,r2=r1-(major?31:13);
        c.strokeStyle=d===-55?'#994e35':'#333b31';c.lineWidth=major?4:2;
        c.beginPath();c.moveTo(r1*ss,r1*cc);c.lineTo(r2*ss,r2*cc);c.stroke();
        if(d%10===0||d===-55){c.save();c.fillStyle=d===-55?'#934631':'#37423a';c.textAlign='center';c.textBaseline='middle';c.font='bold 34px sans-serif';c.fillText(String(d).replace('-','−'),(r2-27)*ss,(r2-27)*cc);c.restore();}
      }
      c.fillStyle='#394a3e';c.textAlign='center';c.font='bold 43px sans-serif';c.fillText('灯轴方位',0,85);
      c.strokeStyle='#7d8270';c.lineWidth=2;c.beginPath();c.arc(0,0,mid*.927,Math.PI*.87,Math.PI*2.13);c.stroke();
    });
    const printed=std(0xffffff,.64,.16);printed.map=dial;
    const disk=mesh(gauge,new T.CircleGeometry(radius-.013,64),printed,0,0,.051);
    const needle=group(gauge,0,0,.060),needleShape=new T.Shape();
    needleShape.moveTo(-.004,-.032);needleShape.lineTo(.006,-.032);needleShape.lineTo(.003,.131);needleShape.lineTo(0,.176);needleShape.lineTo(-.003,.131);needleShape.closePath();
    mesh(needle,new T.ShapeGeometry(needleShape),red);cylinder(gauge,0,0,.065,.012,.009,Z,worn);
    const glass=own(new T.MeshPhysicalMaterial({color:0xd8e5d9,metalness:.08,roughness:.16,transparent:true,opacity:.09,depthWrite:false}));
    mesh(gauge,new T.CircleGeometry(radius-.013,64),glass,0,0,.074);
    const valueCanvas=document.createElement('canvas');valueCanvas.width=384;valueCanvas.height=116;const vc=valueCanvas.getContext('2d'),vm=own(new T.CanvasTexture(valueCanvas));
    if('colorSpace'in vm)vm.colorSpace=T.SRGBColorSpace;else vm.encoding=T.sRGBEncoding;
    const valueMat=std(0xffffff,.55,.08);valueMat.map=vm;
    box(gauge,0,-.097,.060,.167,.062,.012,iron);mesh(gauge,new T.PlaneGeometry(.153,.048),valueMat,0,-.097,.067);
    let last=Infinity;const left=V(-.230,.176,.017),right=V(0,0,.132),tmp=V(0,0,0);
    function update(session){
      const r=session.lastPass;root.visible=!!r;if(!r)return;
      const degrees=r.wheel*180/Math.PI,detent=Math.round(degrees);
      wh.rotation.z=(r.wheel+.96)*-4.8;needle.rotation.z=-needleAngle(degrees);
      if(detent!==last){last=detent;vc.fillStyle='#223832';vc.fillRect(0,0,384,116);vc.fillStyle='#e5dfbe';vc.font='bold 101px monospace';
        vc.textAlign='center';vc.textBaseline='middle';vc.fillText(String(detent).replace('-','−')+'°',192,64);vm.needsUpdate=true;}
    }
    function hands(session){return session.lastPass&&session.engaged[0]?[wh.localToWorld(left.clone()),handle.localToWorld(right.clone())]:null;}
    function shot(session,aspect=.82){
      if(!session.lastPass||!session.engaged[0])return null;
      const p=TideLastPass.vessel(session,session.time),eye=[s.x+.88,s.y+1.90,s.z+1.13];
      const boatYaw=Math.atan2(p[0]-eye[0],eye[2]-p[2]),heading=boatYaw*.68-.22*.32;
      const pitch=-.235;const at=[eye[0]+4*Math.sin(heading),eye[1]+4*Math.tan(pitch),eye[2]-4*Math.cos(heading)];
      return {eye,at,fov:aspect<.76?58:53,handsOnly:false};
    }
    // Merge rigid metalwork per material/group; the crank, dial and knob retain independent frames.
    for(const p of [root,head,wh,handle,gauge]){
      const by=new Map();for(const m of p.children.filter(o=>o.isMesh)){
        const list=by.get(m.material)||[];list.push(m);by.set(m.material,list);}
      for(const [mat,ms] of by){if(ms.length<2)continue;const pp=[],nn=[],uu=[],matN=new T.Matrix3(),vv=new T.Vector3();
        for(const m of ms){m.updateMatrix();matN.getNormalMatrix(m.matrix);const a=m.geometry.attributes,ix=m.geometry.index,n=ix?ix.count:a.position.count;
          for(let i=0;i<n;i++){const j=ix?ix.getX(i):i;vv.fromBufferAttribute(a.position,j).applyMatrix4(m.matrix);pp.push(vv.x,vv.y,vv.z);
            vv.fromBufferAttribute(a.normal,j).applyNormalMatrix(matN);nn.push(vv.x,vv.y,vv.z);uu.push(a.uv?a.uv.getX(j):0,a.uv?a.uv.getY(j):0);}p.remove(m);}
        const geo=own(new T.BufferGeometry());geo.setAttribute('position',new T.Float32BufferAttribute(pp,3));geo.setAttribute('normal',new T.Float32BufferAttribute(nn,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uu,2));p.add(new T.Mesh(geo,mat));
      }
    }
    for(const t of templates)own(t);update(g);let disposed=false;return {update,shot,hands,dispose(){if(disposed)return;disposed=true;scene.remove(root);owned.forEach(o=>o.dispose());owned.clear();}};
  }
  return {create};
})();
