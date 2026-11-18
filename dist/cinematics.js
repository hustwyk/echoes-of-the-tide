// Original in-world story props and short end-of-chapter sequences. Only step()
// advances a film; update() is safe to call during ordinary gameplay and pauses.
window.TideCinema = (() => {
  'use strict';
  const T = window.THREE;
  const TAU = Math.PI * 2;
  const durations = {2:6.2,3:5.4,4:14.5,5:8.6,6:7.1,7:6.0,11:15.3};
  const clamp = T.MathUtils.clamp;
  const lerp = T.MathUtils.lerp;
  const smooth = n => {n=clamp(n,0,1);return n*n*(3-2*n);};

  function create(scene, game, assets) {
    const {ship}=assets, idx=game.index;
    const root=new T.Group();
    root.name='北岬 · 实物与演出';
    scene.add(root);
    const geos=new Map(), mats=new Map(), owned=new Set();
    const hub=game.world.sections[game.world.sections.length-1];
    const shelf=new T.Group(); root.add(shelf);
    // Beside the last instrument, beyond the operator's normal standing space.
    const at=hub.sites[idx===7?1:0];
    shelf.position.set(at.x+.98,at.y+.85,at.z-1.15);
    if(idx===4)shelf.position.set(0,.85,-3.42);
    if(idx===5){shelf.position.x+=2.15;shelf.position.y+=.23;}
    let clock=0, duration=0, playing=false, disposed=false;
    let cupboard, cup, tape, tin, screw, sheet, packet, green, marker;
    let tender, cable, workroom, paperStrip, hand, newLabel, voiceCoils;
    let sternSet;
    let renderedText='';
    const scratch=new T.Vector3(), end=new T.Vector3();
    const filmTime=()=>playing?clock:0;

    function group(parent,x=0,y=0,z=0) {
      const node=new T.Group();parent.add(node);node.position.set(x,y,z);return node;
    }
    function geometry(key,make) {
      if(!geos.has(key))geos.set(key,make());
      return geos.get(key);
    }
    function material(tint,metal=0,rough=.65,emission=0) {
      const id=[tint,metal,rough,emission].join('/');
      if(!mats.has(id))mats.set(id,new T.MeshStandardMaterial({color:tint,metalness:metal,roughness:rough,emissive:tint,emissiveIntensity:emission}));
      return mats.get(id);
    }
    function part(parent,geo,mat,x,y,z,sx=1,sy=1,sz=1) {
      const mesh=new T.Mesh(geo,mat);
      mesh.position.set(x,y,z);mesh.scale.set(sx,sy,sz);
      mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
    }
    const cube=geometry('cube',()=>new T.BoxGeometry(1,1,1));
    const cyl=geometry('cylinder',()=>new T.CylinderGeometry(1,1,1,24));
    const sphere=geometry('sphere',()=>new T.SphereGeometry(1,16,12));
    const flat=geometry('label',()=>new T.PlaneGeometry(1,1));
    const metal=material(0x80908d,.73,.38);
    const rail=material(0x394f4f,.7,.48);
    const cork=material(0x9c7653,.12,.61);
    const oxide=material(0x84543d,.27,.81);
    const rubber=material(0x202a2c,.12,.72);
    const ivory=material(0xd2c9ad,.22,.42);
    const box=(p,x,y,z,w,h,d,m)=>part(p,cube,m,x,y,z,w,h,d);
    const disc=(p,x,y,z,r,h,m)=>part(p,cyl,m,x,y,z,r,h,r);
    function ring(p,x,y,z,r,minor,m) {
      const key='ring'+Math.round(minor/r*1000);
      const geo=geometry(key,()=>new T.TorusGeometry(1,minor/r,7,40));
      return part(p,geo,m,x,y,z,r,r,r);
    }
    function rod(p,a,b,r,m) {
      const first=new T.Vector3(...a),last=new T.Vector3(...b);
      const delta=last.clone().sub(first);
      const node=part(p,cyl,m,0,0,0,r,delta.length(),r);
      node.position.copy(first.lerp(last,.5));
      node.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize());
      return node;
    }
    function label(p,x,y,z,w,h,paint,top=true,updatable=false) {
      const cv=document.createElement('canvas');cv.width=512;cv.height=Math.max(64,Math.round(512*h/w));
      const ctx=cv.getContext('2d');
      paint(ctx,cv.width,cv.height);
      const texture=new T.CanvasTexture(cv);
      texture.colorSpace=T.SRGBColorSpace;
      texture.anisotropy=4;
      const mat=new T.MeshStandardMaterial({map:texture,roughness:.81,metalness:.06,side:T.DoubleSide,polygonOffset:true,polygonOffsetFactor:-2});
      owned.add(texture);owned.add(mat);
      const plane=part(p,flat,mat,x,y,z,w,h,1);plane.castShadow=false;
      if(top)plane.rotation.x=-Math.PI/2;
      if(updatable)plane.userData.repaint=()=>{paint(ctx,cv.width,cv.height);texture.needsUpdate=true;};
      return plane;
    }
    function printed(title,small,paper='#cec6b0',ink='#293f40') {
      return (ctx,w,h)=>{
        ctx.fillStyle=paper;ctx.fillRect(0,0,w,h);
        ctx.strokeStyle=ink;ctx.lineWidth=3;ctx.strokeRect(10,9,w-20,h-18);
        ctx.fillStyle=ink;ctx.textBaseline='middle';
        ctx.font='bold '+Math.round(h*.36)+'px "PingFang SC",sans-serif';ctx.fillText(title,26,h*.39,w-52);
        ctx.font=Math.round(h*.17)+'px monospace';ctx.fillText(small,27,h*.76,w-55);
      };
    }
    function makeDesk(p,w,d,height=0) {
      box(p,0,height-.09,0,w,.17,d,material(0x635748,.03,.63));
      const wood=material(0x8b775d,.04,.59);
      if(!wood.map){
        const cv=document.createElement('canvas');cv.width=512;cv.height=128;
        const ctx=cv.getContext('2d');ctx.fillStyle='#d1c6ab';ctx.fillRect(0,0,512,128);
        let seed=590;
        function random(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;}
        for(let k=0;k<440;k++){
          const y=random()*128,x=random()*580-68,length=28+random()*250,wobble=random()*6-3;
          ctx.beginPath();ctx.moveTo(x,y);ctx.bezierCurveTo(x+length*.31,y+wobble,x+length*.72,y-wobble,x+length,y+.6);
          ctx.lineWidth=.25+random()*1.35;ctx.strokeStyle=k%7?'rgba(83,61,46,.095)':'rgba(246,234,196,.42)';ctx.stroke();
        }
        const tex=new T.CanvasTexture(cv);tex.colorSpace=T.SRGBColorSpace;tex.anisotropy=4;
        wood.map=tex;wood.bumpMap=tex;wood.bumpScale=.006;wood.needsUpdate=true;owned.add(tex);
      }
      for(let j=0;j<7;j++)box(p,0,height+.005,-d*.5+d*(j+.5)/7,w-.012,.026,d/7-.007,wood);
      for(const s of [-1,1])for(const r of [-1,1])
        box(p,s*(w/2-.05),height-.48,r*(d/2-.05),.075,.80,.075,rail);
    }
    function enamel(p) {
      const m=group(p);
      const body=geometry('enamel',()=>new T.LatheGeometry([
        [.001,.007],[.088,.007],[.093,.027],[.099,.160],[.103,.179],
        [.103,.186],[.095,.186],[.091,.174],[.085,.031],[.001,.031]
      ].map(([x,y])=>new T.Vector2(x,y)),40));
      part(m,body,material(0xdce1c7,.18,.37),0,0,0);
      ring(m,0,.185,0,.099,.006,material(0x304e54,.43,.35)).rotation.x=Math.PI/2;
      const handle=ring(m,.106,.104,0,.056,.010,ivory);
      handle.scale.y*=1.20;
      for(let i=0;i<12;i++){
        const a=i*2.386;
        part(m,sphere,oxide,.099*Math.sin(a),i%3===0?.182:.041+.060*(i%3),.099*Math.cos(a),.003+(i%3)*.001,.003,.004);
      }
      label(m,0,.004,0,.141,.087,printed('林＋沈','北岬值班室','#c6ccb6','#405967')).rotation.x=Math.PI/2;
      return m;
    }
    function cassette(p,name) {
      const g=group(p);
      const shell=material(0x3b4849,.26,.45);
      box(g,0,.025,0,.237,.047,.150,shell);
      box(g,0,.051,-.012,.213,.007,.106,material(0xb5ae94,.08,.59));
      box(g,0,.055,.013,.175,.004,.055,rubber);
      const spools=[];
      for(const sign of [-1,1]) {
        const reel=disc(g,sign*.065,.058,.013,.024,.006,ivory);
        disc(reel,0,.69,0,.62,.56,rubber);
        for(let j=0;j<6;j++){
          const ang=j*TAU/6;
          const tab=box(reel,.51*Math.sin(ang),.97,.51*Math.cos(ang),.20,.15,.24,ivory);
          tab.rotation.y=ang;
        }
        spools.push(reel);
        for(const z of [-.059,.060])disc(g,sign*.100,.050,z,.004,.005,metal);
      }
      label(g,0,.058,-.039,.195,.032,printed(name,'C-60 ◀ 北岬录音组','#d0bc93'));
      g.userData.spools=spools;
      return g;
    }
    function biscuitTin(p) {
      const m=group(p);
      const teal=material(0x5a8078,.59,.40);
      box(m,0,.02,0,.48,.028,.31,teal);
      for(const sign of [-1,1]){
        box(m,sign*.236,.065,0,.012,.095,.31,teal);
        box(m,0,.065,sign*.151,.48,.095,.012,teal);
        box(m,0,.115,sign*.151,.488,.008,.019,metal);
      }
      box(m,0,.120,-.252,.49,.027,.326,teal).rotation.x=1.04;
      const art=label(m,0,.150,-.27,.414,.24,printed('北 岬','海盐饼干  /  1998','#809e84','#3a544b'));
      art.rotation.x=-.52;
      return m;
    }
    function makeScrew(p) {
      const m=group(p);
      rod(m,[-.031,0,0],[.037,0,0],.009,metal);
      for(let i=0;i<8;i++)ring(m,-.026+i*.007,0,0,.009,.0018,rail).rotation.y=Math.PI/2;
      const head=disc(m,.040,0,0,.019,.012,metal);head.rotation.z=Math.PI/2;
      box(m,.047,.001,0,.0015,.004,.027,rubber);return m;
    }
    if([3,4,5,6].includes(idx)){
      makeDesk(shelf,1.52,1.03);
      if(idx===3){
        cup=enamel(shelf);cup.position.set(-.16,.022,0);
        cupboard=cassette(shelf,'值班录音');cupboard.position.set(.23,.021,-.03);
      }else if(idx===4){
        tape=cassette(shelf,'灯机房 / 电台');tape.position.set(.05,.077,.02);tape.scale.setScalar(1.55);
        box(shelf,.06,.043,.02,.67,.082,.40,rubber);
        box(shelf,-.19,.09,.04,.073,.026,.22,ivory);
        disc(shelf,.27,.10,.08,.036,.035,metal);
        label(shelf,.05,.092,-.139,.35,.066,printed('合听副本','机房  +  电台','#60746d','#dde1c9'));
        cup=enamel(shelf);cup.position.set(-.55,.02,-.12);
      }else if(idx===5){
        // The photocopy physically covers the original survey's pencil annotation.
        box(shelf,0,.021,0,1.15,.034,.78,rail);
        label(shelf,0,.048,0,1.10,.72,(c,w,h)=>{
          c.fillStyle='#d6d1ae';c.fillRect(0,0,w,h);c.strokeStyle='#8b9e91';c.lineWidth=1;
          for(let x=0;x<w;x+=26){c.beginPath();c.moveTo(x,0);c.lineTo(x,h);c.stroke();}
          for(let y=0;y<h;y+=26){c.beginPath();c.moveTo(0,y);c.lineTo(w,y);c.stroke();}
          for(let n=0;n<5;n++){
            c.strokeStyle=n===2?'#547a78':'#92977e';c.lineWidth=n===2?3:1.3;c.beginPath();
            for(let x=0;x<w;x+=3){const y=h*.40+n*13+27*Math.sin(x*.012)+5*Math.sin(x*.06);x?c.lineTo(x,y):c.moveTo(x,y);}c.stroke();
          }
          c.fillStyle='#384e49';c.font='bold 23px sans-serif';c.fillText('北岬　当潮实测草图',30,42);
          c.save();c.translate(w*.42,h*.78);c.rotate(-.06);c.fillStyle='#913d35';c.font='bold 26px serif';c.fillText('北线待测',0,0);c.restore();
          c.fillStyle='#474c3f';for(const x of [42,66]){c.beginPath();c.arc(x,64,4,0,Math.PI*2);c.fill();}
        });
        sheet=group(shelf,0,.009,0);
        label(sheet,.055,.045,.12,.79,.45,printed('灯机回转正常','六天前　/　设备交接联　　签收　林澈','#bebca6','#394d4b'));
        packet=group(shelf);label(packet,-.40,.067,.20,.17,.18,printed('06','档　案','#81887a','#293a39'));
      }else if(idx===6){
        tin=biscuitTin(shelf);tin.position.set(-.16,.024,.04);
        screw=makeScrew(tin);tape=cassette(shelf,'十秒钟北岬');tape.position.set(.34,.022,-.01);

      }
    }

    if(idx===7){
      // On the stern, the sailor brings the handheld up from below the rail.
      sternSet=group(ship,-1.48,2.55,7.01);sternSet.rotation.y=1.33;sternSet.visible=false;
      const shell=material(0x53645b,.29,.55),glove=material(0x55504a,.12,.82);
      box(sternSet,0,0,0,.105,.171,.047,rubber);
      box(sternSet,0,.008,.017,.090,.14,.028,shell);
      for(let j=0;j<6;j++)box(sternSet,0,-.05+j*.008,.034,.069,.003,.004,rubber);
      label(sternSet,0,.033,.035,.077,.038,printed('海雁','甲板  02','#acb298','#303a36'),false);
      for(const [x,h] of [[-.035,.02],[.032,.027]])disc(sternSet,x,.091,0,.012,h,rail);
      rod(sternSet,[.010,.085,-.004],[.015,.243,-.018],.0038,rubber);
      disc(sternSet,-.034,.070,.017,.005,.01,material(0xe3a35c,.16,.45,.47));
      part(sternSet,sphere,glove,.042,-.033,-.013,.053,.068,.034);
      for(let i=0;i<4;i++){
        const y=.015-i*.024;
        rod(sternSet,[.062,y,-.012],[.066,y-.003,.021],.011,glove);
        rod(sternSet,[.066,y-.003,.021],[.039,y-.011,.037],.010,glove);
      }
      rod(sternSet,[.026,.011,.037],[-.037,-.019,.039],.013,glove);
      rod(sternSet,[.057,-.077,-.027],[.089,-.120,-.026],.038,glove);
      rod(sternSet,[.070,-.092,-.027],[.213,-.220,.007],.045,material(0xa78445,.10,.68));
      rod(sternSet,[.122,-.140,-.013],[.141,-.160,-.009],.047,ivory);
    }
    if(idx===2 && assets.marker){
      marker=assets.marker;
    }else if(idx===2){
      marker=group(root,1,-4,-66);
      const q=marker;
      disc(q,0,.17,0,.61,.36,rubber);disc(q,0,.38,0,.53,.15,rail);
      disc(q,0,1.15,0,.085,1.51,oxide);
      disc(q,0,1.80,0,.22,.10,rail);
      green=disc(q,0,1.97,0,.15,.27,material(0x43cda0,.1,.27,2));
      disc(q,0,2.13,0,.192,.08,rail);
      // Keep a visible white cap on the reef beside the obsolete marker.
      for(let k=0;k<4;k++){
        const cap=part(q,sphere,material(0xd2dfd2,.04,.51),1.5+k*.87,.04,-2+k*.27,.68,.095,.36);
        cap.rotation.y=k*.57;
      }
    }
    function launch() {
      const m=group(root);m.name='救援艇';
      const stations=[[-3.65,.04],[-2.75,.74],[-1.70,1.12],[.72,1.20],[2.94,.96]];
      const pos=[],tri=[];
      for(const [z,w] of stations){
        pos.push(-w,.78,z,-w*.81,.02,z,-w*.32,-.38,z,w*.32,-.38,z,w*.81,.02,z,w,.78,z);
      }
      for(let k=0;k<stations.length-1;k++)
        for(let j=0;j<6;j++){
          const a=k*6+j,b=k*6+(j+1)%6;tri.push(a,b,a+6,b,b+6,a+6);
        }
      const last=(stations.length-1)*6;
      for(let j=1;j<5;j++)tri.push(0,j+1,j,last,last+j,last+j+1);
      const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(pos,3));geo.setIndex(tri);geo.computeVertexNormals();owned.add(geo);
      const hull=material(0xb46f43,.38,.51);hull.side=T.DoubleSide;
      part(m,geo,hull,0,0,0);
      box(m,0,1.08,.0,1.66,.64,2.26,ivory);
      box(m,0,1.60,-.14,1.71,.47,1.94,material(0x465e61,.40,.27));
      box(m,0,1.86,-.12,1.91,.09,2.05,rail);
      for(const s of [-1,1]) {
        for(const z of [-.96,-.16,.72])box(m,s*.861,1.61,z,.046,.51,.055,metal);
        rod(m,[s*1.07,.80,1.2],[s*1.02,1.36,1.2],.024,rail);
        rod(m,[s*.89,.79,2.49],[s*.89,1.36,2.49],.024,rail);
        rod(m,[s*1.02,1.36,1.2],[s*.89,1.36,2.49],.024,rail);
        for(let k=1;k<stations.length;k++){
          const [z0,w0]=stations[k-1],[z1,w1]=stations[k];
          rod(m,[s*w0,.77,z0],[s*w1,.77,z1],.063,rubber);
          rod(m,[s*w0,.59,z0],[s*w1,.59,z1],.026,ivory);
        }
        const lifering=ring(m,s*.61,1.11,1.165,.192,.049,material(0xc1633c,.08,.75));
        for(let a=0;a<4;a++){
          const angle=a*Math.PI/2;
          box(lifering,Math.sin(angle),Math.cos(angle),.14,.26,.46,.54,ivory).rotation.z=-angle;
        }
      }
      const beacon=material(0xffbf66,.15,.27,1.0);
      disc(m,0,2,0,.13,.20,beacon);
      box(m,0,1.56,1.135,.55,.33,.024,rail);
      box(m,0,1.56,1.157,.47,.27,.019,material(0x385257,.3,.24));
      label(m,0,1.09,1.16,.49,.19,printed('北岬救援','RESCUE 07','#d6caad','#344742'),false);
      rod(m,[.58,1.91,-.45],[.61,2.73,-.56],.014,metal);
      for(let a=0;a<5;a++)ring(m,-.39,.81+a*.031,2.10,.21+a*.003,.020,cork).rotation.x=Math.PI/2;
      disc(m,.64,.90,2.3,.09,.26,rail);disc(m,.64,1.07,2.3,.14,.08,metal);
      return m;
    }
    function setupFinal(){
      if(workroom)return;
      tender=launch();tender.visible=false;
      cable=group(root);
      const lineMat=material(0xb4a98b,.04,.83);
      for(let i=0;i<12;i++)part(cable,cyl,lineMat,0,0,0,.047,1,.047);
      cable.visible=false;
      workroom=group(root,174,25,-125);workroom.visible=false;
      const wall=material(0x526965,.05,.86), strut=material(0x304543,.27,.61);
      box(workroom,0,-.12,0,7,.24,6,material(0x70675a,.08,.69));
      box(workroom,-3.36,1.6,0,.22,3.2,6,wall);
      box(workroom,3.36,1.6,0,.22,3.2,6,wall);
      box(workroom,0,.48,-2.90,6.65,.96,.16,wall);
      box(workroom,0,2.72,-2.90,6.65,1.02,.16,wall);
      box(workroom,0,1.52,2.92,6.66,3.12,.18,wall);
      box(workroom,0,.64,2.80,6.65,.064,.10,strut);
      const notice=group(workroom,.35,1.64,2.79);notice.rotation.y=Math.PI;
      box(notice,0,0,0,1.64,.95,.085,rail);
      label(notice,0,0,.047,1.54,.85,(c,w,h)=>{
        c.fillStyle='#bbc6ae';c.fillRect(0,0,w,h);
        c.fillStyle='#395764';c.font='bold 23px sans-serif';c.fillText('北岬港  /  引航水域',18,32);
        c.strokeStyle='#889b91';c.lineWidth=1;
        for(let x=20;x<w;x+=31){c.beginPath();c.moveTo(x,48);c.lineTo(x,h-16);c.stroke();}
        for(let y=48;y<h;y+=27){c.beginPath();c.moveTo(16,y);c.lineTo(w-18,y);c.stroke();}
        c.fillStyle='#a19075';c.beginPath();c.moveTo(0,72);c.lineTo(53,81);
        c.lineTo(96,116);c.lineTo(127,111);c.lineTo(155,156);c.lineTo(201,162);
        c.lineTo(221,200);c.lineTo(185,220);c.lineTo(193,h);c.lineTo(0,h);c.fill();
        c.strokeStyle='#926657';c.lineWidth=3;c.setLineDash([10,7]);c.beginPath();
        c.moveTo(68,59);c.lineTo(167,90);c.lineTo(237,150);c.lineTo(321,142);c.lineTo(443,201);c.stroke();
      },false);
      const cabinet=group(workroom,2.07,1.33,2.64);
      box(cabinet,0,0,0,.83,1.61,.30,strut);
      for(const x of [-.197,.197]){
        box(cabinet,x,0,-.163,.374,1.54,.034,material(0x71847c,.46,.65));
        for(let j=0;j<4;j++)box(cabinet,x,.53+.039*j,-.186,.22,.012,.014,rail);
        box(cabinet,x*.31,.018,-.202,.020,.16,.045,metal);
      }
      const railHook=group(workroom,-1.61,1.69,2.76);
      ring(railHook,0,0,0,.26,.068,material(0xc97955,.11,.74));
      for(const a of [0,Math.PI*.5,Math.PI,Math.PI*1.5]){
        box(railHook,.26*Math.sin(a),.26*Math.cos(a),-.013,.085,.135,.13,ivory).rotation.z=-a;
      }
      for(const x of [-2.8,-1.4,0,1.4,2.8])box(workroom,x,1.58,-2.9,.075,1.32,.20,strut);
      for(const y of [1.03,2.21])box(workroom,0,y,-2.9,6.65,.07,.22,strut);
      box(workroom,0,3.22,0,6.65,.1,6,material(0xbfb69a,0,.89));
      // The cabin windows look through real geometry at the same generated sky.
      const glassMat=material(0x9bc7c1,.15,.21);
      glassMat.transparent=true;glassMat.opacity=.19;glassMat.depthWrite=false;
      box(workroom,0,1.59,-2.96,6.6,1.22,.02,glassMat);
      let seed=1249;
      for(let i=0;i<24;i++){
        seed=(Math.imul(seed,1664525)+1013904223)>>>0;
        const x=(seed/4294967296-.5)*6.2,y=1.22+(i%5)*.17;
        const drop=part(workroom,sphere,glassMat,x,y,-2.935,.004,.01+(i%4)*.012,.005);
        drop.rotation.z=.11;
      }
      const lampshade=material(0xe5b177,.30,.35,.5);
      rod(workroom,[-1.72,2.4,-2.77],[-1.72,2.4,-2.24],.045,rail);
      part(workroom,geometry('shade',()=>new T.ConeGeometry(.27,.22,24)),lampshade,-1.72,2.34,-2.24);
      const cabinLight=new T.PointLight(0xffe3ac,15,9,1.9);cabinLight.position.set(-1.1,2.3,1.4);workroom.add(cabinLight);
      const windowLight=new T.PointLight(0xb9e6f2,11,8,1.9);windowLight.position.set(1.2,2.05,-2.14);workroom.add(windowLight);
      const d=group(workroom,0,.89,-.69);makeDesk(d,2.92,1.09);
      const tin1=biscuitTin(d);tin1.position.set(.28,.027,.06);tin1.rotation.y=-.07;
      const one=cassette(d,'十秒钟北岬');one.position.set(-.31,.036,-.10);one.rotation.y=.27;
      const blank=cassette(d,'');blank.position.set(.27,.058,.064);
      const brew=enamel(d);brew.position.set(-1.01,.025,-.11);brew.rotation.y=.48;
      const second=enamel(d);second.position.set(1.06,.025,.12);second.rotation.y=-.9;
      paperStrip=group(d,-.72,.035,.05);
      box(paperStrip,0,.024,.0,.34,.06,.35,ivory);
      label(paperStrip,0,.058,0,.31,.30,printed('已 收','港口 · 海雁 · 家属','#d8c9a5','#5c644f'));
      const set=group(d,.80,.06,-.21);
      box(set,0,.11,0,.41,.22,.21,rubber);
      for(let j=0;j<7;j++)box(set,-.11+.023*j,.13,.11,.010,.105,.009,metal);
      box(set,.112,.152,.108,.088,.043,.008,material(0xb9c695,.08,.39,1.4));
      rod(set,[-.16,.20,-.055],[-.19,.53,-.072],.007,metal);
      newLabel=label(blank,0,.061,-.039,.205,.044,(ctx,w,h)=>{
        ctx.fillStyle='#e8d5aa';ctx.fillRect(0,0,w,h);
        ctx.strokeStyle='#9a513e';ctx.lineWidth=3;ctx.strokeRect(6,5,w-12,h-10);
        ctx.font='bold '+Math.round(h*.55)+'px "Kaiti SC","Songti SC",serif';
        ctx.textBaseline='middle';ctx.fillStyle='#253a40';ctx.fillText(renderedText,18,h*.51,w-37);
      },true,true);
      hand=group(d);
      rod(hand,[0,0,0],[.037,.19,-.045],.007,material(0x345952,.29,.49));
      part(hand,geometry('pencil',()=>new T.ConeGeometry(.008,.031,8)),cork,.001,.012,0).rotation.z=Math.PI-.17;
      const glove=material(0x77634b,.02,.87), sleeve=material(0xab6a38,.07,.77);
      part(hand,sphere,glove,.076,.094,.040,.048,.029,.054).rotation.y=.4;
      for(let j=0;j<3;j++)rod(hand,[.078+j*.012,.087,.03+j*.010],[.018+j*.009,.063,.004+j*.009],.010,glove);
      rod(hand,[.059,.103,.045],[.021,.077,-.014],.012,glove);
      rod(hand,[.089,.106,.06],[.25,.186,.26],.046,sleeve);
      rod(hand,[.101,.115,.078],[.124,.127,.108],.048,rubber);
      voiceCoils=[];
      for(const [i,x] of [-.74,.74].entries()){
        const person=window.TideActors?.person(i);
        if(person){
          person.position.set(x,0,.25+(i===0?.12:0));person.rotation.y=i===0?-.41:.47;
          workroom.add(person);voiceCoils.push(person);
        }
      }
    }

    const shipA=new T.Vector3(), ropeStart=new T.Vector3(), ropeEnd=new T.Vector3();
    const from=new T.Vector3(), to=new T.Vector3(), tangent=new T.Vector3(), up=new T.Vector3(0,1,0);
    function finalAt(t,dt){
      const boat=t<8.1;
      tender.visible=boat;cable.visible=boat&&t>=1.8;workroom.visible=!boat;
      ship.updateWorldMatrix(true,false);
      shipA.set(9.8,.04,5.4).applyMatrix4(ship.matrixWorld);
      tender.position.copy(shipA);tender.rotation.y=ship.rotation.y+Math.PI-.19;
      tender.position.y+=Math.sin(t*1.2)*.13;
      tender.rotation.z=Math.sin(t*1.5)*.039;tender.updateWorldMatrix(true,false);
      if(cable.visible){
        ropeStart.set(1.15,1.75,6.94).applyMatrix4(ship.matrixWorld);
        ropeEnd.set(.64,1.12,2.3).applyMatrix4(tender.matrixWorld);
        const flight=smooth((t-1.8)/1.7),pull=smooth((t-3.64)/2.45);
        const trip=.7*Math.sin(flight*Math.PI);
        const slack=lerp(1.45,.20,pull);
        function point(k,out){
          const f=k*flight;
          out.copy(ropeStart).lerp(ropeEnd,f);
          out.y+=Math.sin(Math.PI*k)*(trip-(1-trip)*slack*flight);
        }
        for(let i=0;i<cable.children.length;i++){
          point(i/12,from);point((i+1)/12,to);tangent.subVectors(to,from);
          const node=cable.children[i];node.visible=tangent.lengthSq()>.001;
          if(node.visible){
            node.scale.y=tangent.length();node.position.copy(from).lerp(to,.5);
            node.quaternion.setFromUnitVectors(up,tangent.normalize());
          }
        }
      }
      if(workroom.visible){
        for(const person of voiceCoils)window.TideActors.animate(person,{speed:0,grounded:true,operating:true},dt,t);
        const write=smooth((t-10.7)/3.75),chars=Array.from('北岬，第二盘');
        const value=chars.slice(0,Math.floor(write*chars.length+.01)).join('');
        if(renderedText!==value){renderedText=value;newLabel.userData.repaint();}
        hand.visible=t>9.4;
        hand.position.set(.17+.182*write,.122+.13*(1-smooth((t-9.45)/1.14))+.14*smooth((t-14.48)/.64),.026+Math.sin(t*17)*.002);
        paperStrip.position.z=.05+.075*smooth((t-8.25)/1.05);
      }
    }

    function update(g,dt) {
      if(sternSet){
        sternSet.visible=playing;
        sternSet.position.y=2.48+.14*smooth(clock/1.6)+.005*Math.sin(clock*2.5);
        sternSet.rotation.z=-.18+.08*smooth(clock/1.6);
      }
      if(disposed)return;
      const t=g.time+filmTime();
      if(idx===2){
        // The lamp on the buoy is independent of the player's guide light.
        if(green){
          marker.position.y=g.cues.water+.14*Math.sin(t*.8);marker.rotation.z=.055*Math.sin(t*1.2);
          green.material.emissiveIntensity=.7+2.8*Math.pow(Math.max(0,Math.sin(t*2.5)),6);
        }
      }else if(idx===3){
        const float=g.stage===0 && !playing;
        cup.position.set(float?.15*Math.sin(t*.44):-.16,float?Math.max(.05,(g.cues.basin??g.cues.water)-shelf.position.y+.11):.024,float?.12*Math.cos(t*.36):.07);
        if(float){
          const water=g.section.ferry?.deck;
          if(water)cup.position.set(water.x-shelf.position.x+1.43,(g.cues.basin??g.cues.water)-shelf.position.y+.05,water.z-shelf.position.z-.44);
        }
        cup.rotation.set(float?.095*Math.sin(t):0,1.2+.11*Math.sin(t*.32),float?.115*Math.sin(t*.82):0);
        if(playing){
          const lift=smooth((clock-.65)/1.1)*(1-smooth((clock-3.0)/1.05));
          cup.position.y=.024+lift*.28;cup.rotation.x=-lift*(Math.PI*.74);
        }
      }else if(idx===4 || idx===6){
        if(hub.tram){const d=hub.tram.deck;shelf.position.set(d.x,d.y+.85,d.z-.88);}
        const spin=g.archive?((g.archive.review||0)+(playing?clock:0))*2.7:(playing?1:Math.max(.16,g.state.dials[0]||0))*(t*2.7);
        tape.userData.spools.forEach(r=>r.rotation.y=spin);
        if(screw){
          const roll=.12*Math.sin(t*2.8)*Math.cos(t*.24);
          screw.position.set(roll,.055,.025+.04*Math.cos(t*1.4));
          screw.rotation.set(t*3.4,Math.sin(t*.81)*.6,Math.PI*.04);
        }
      }else if(idx===5){
        const lift=playing?smooth((clock-.9)/3.4):0;
        sheet.position.set(-.46*lift,.009+Math.sin(lift*Math.PI)*.13,-.15*lift);
        sheet.rotation.set(-.14*Math.sin(lift*Math.PI),.12*lift,.018*lift);
      }else if(idx===11&&playing)finalAt(clock,dt);
    }

    function relative(node,a){
      node.updateWorldMatrix(true,false);
      return scratch.set(...a).applyMatrix4(node.matrixWorld).toArray();
    }
    function subject(node,eye,at){return {eye:relative(node,eye),at:relative(node,at)};}
    function deckview(eye,at){return subject(ship,eye,at);}
    // Mark the partners on the shared landing for the short exchange after a task.
    // The active game keeps ownership of both actors and resumes from its checkpoints.
    function performance(side){
      if(!playing)return null;
      if(idx===4){
        const p=game.players[side];return {x:p.x,y:p.y,z:p.z,yaw:p.yaw,talking:!side&&clock<2.8,
          gaze:side?-.14:.16,incline:side?.075:.045};
      }
      if(![5,6].includes(idx))return null;
      const t=clock,mid=hub.tram?.deck||hub.mid,hand=side?1:-1;
      const speaking=idx===5?(side===0?t<2.67:t>=2.74&&t<5.53):
        idx===6?(side===0?t<3.23:t>=3.42&&t<6.65):(side===0&&t<2.65);
      const listening=t>=(idx===5?5.65:7);
      return {x:mid.x+hand*.58,y:mid.y,z:mid.z+.29+side*.04,yaw:hand*.48,
        talking:speaking,gaze:hand*(listening?-.12:.29),incline:listening?.045:.085+.045*Math.sin(t*.92+side)};
    }
    function portrait(side,t){
      const a=assets.actors[side],s=side?1:-1;
      const shot=subject(a,[s*(.19+.035*Math.sin(t*.46)),1.67,-.55-.035*Math.cos(t*.35)],[0,1.605,-.012]);
      const eyeLine=relative(a,[0,1.636,-.068]);
      shot.focus=Math.hypot(...eyeLine.map((v,i)=>v-shot.eye[i]));return shot;
    }
    function shot(g,side) {
      if(!playing || disposed)return null;
      const t=clock,f=t/duration,i=side?1:0;
      if(idx===2){
        if(!i)return deckview([-9.3+f*.9,4.6+f*.5,-11.6],[-.16,1.68,-1.8]);
        const view=deckview([2.4,4.33,-3.7],[0,1,-12]);
        marker.getWorldPosition(end);end.y+=.93;view.at=end.toArray();
        return view;
      }
      if(idx===3)return !i?subject(shelf,[-.46+f*.17,.47,.54],[-.16,.12+.18*Math.sin(f*Math.PI),.07]):
        subject(shelf,[.58,.50,.40],[.22,.07,-.035]);
      if(idx===4){
        if(!i&&t<3.0)return portrait(0,t);
        if(i&&t>3.0)return portrait(1,t);
        if(!i)return {eye:[-4.41,1.97,-3.89],at:[-4.53,1.51,-4.67],fov:46,handsOnly:true};
        return subject(shelf,[.39-f*.12,.43,.48],[.06,.10,-.014]);
      }
      if(idx===5){
        if(!i&&t>=2.7)return portrait(1,t);
        if(i&&t<2.7)return portrait(0,t);
        return !i?subject(shelf,[sheet.position.x*.90,1.1,.54],[sheet.position.x+.055,.06,.10]):
          subject(shelf,[.28-f*.07,.76,.41],[.12,.05,.13]);
      }
      if(idx===6)return i?portrait(t<3.36?0:1,t):subject(tin,[-.22+f*.17,.36,.34],[.008,.055,.03]);
      if(idx===7){
        if(!i)return t<2.8?{eye:[-38.82,6.20,-85.86],at:[-36.72,5.78,-86.40],fov:48}:{eye:[-33.16,3.62,-86.68],at:[-30.29,1.13,-87.93],fov:47};
        const view=deckview([-.96,2.86,7.18],[-1.73,2.60+.17*smooth(t/duration),6.99]);
        view.fov=46;return view;
      }
      if(idx===11){
        if(t<2.55)return i?deckview([3.8,2.6,6.7],[8.2,1.05,4.8]):deckview([-10,4.6,-15],[0,1.55,-2.5]);
        if(t<5.2)return i?subject(tender,[2.22,2.22,4.18],[.60,1.08,2.2]):deckview([3.05,2.66,8.89],[2.29,1.38,6.41]);
        if(t<8.1){
          const s=smooth((t-5.2)/2.4), target=deckview([6.3,4.6+f,15.8],[4.2,1.33,5.85]);
          const start=i?subject(tender,[2.22,2.22,4.18],[.60,1.08,2.2]):deckview([3.05,2.66,8.89],[2.29,1.38,6.41]);
          return {eye:start.eye.map((a,k)=>lerp(a,target.eye[k],s)),at:start.at.map((a,k)=>lerp(a,target.at[k],s))};
        }
        if(t<10.65)return subject(workroom,[-2.02+(t-8.1)*.11,1.74,-2.14],[-.03,1.22,.06]);
        const s=smooth((t-10.65)/3.2);
        return subject(workroom,[.56-.19*s,1.58-.19*s,-.22-.17*s],[.26,1.01,-.65]);
      }
      return null;
    }
    function subtitle(){
      if(!playing)return '';
      const t=clock;
      if(idx===2)return t<2.8?'梁青　灯灭了，我看见了。':'沈遥　她已经漂进内流。我们得找到另一条路。';
      if(idx===3)return t<2.7?'林澈　杯底还有两个名字。':'沈遥　柜顶上，那是值班带。';
      if(idx===4){
        const captions=window.TideArchiveMedia?.coda?.captions||[[0,'林澈　丙三柜。我去拿原图。'],[3.0,'梁青　阿棠，从船尾再看一眼。'],[6.2,'阿棠　旧标和白浪，叠在一起了。'],[10,'梁青　我这边错开半扇窗。两处都记上。']];
        let line='';for(const [at,text] of captions){if(t<at)break;line=text;}return line;
      }
      if(idx===5)return t<2.7?'林澈　我看见备注没印出来。还在这儿划了一下。':t<5.65?'沈遥　我替我们两个人，按了那个确认。':'梁青　要是还不知道，就告诉我不知道。我可以给你们报浪。';
      if(idx===6)return t<3.4?'林澈　那次你猜的是雷声。':'沈遥　铁皮饼干盒。想再听一遍才故意猜错的。';
      if(idx===7)return t<2.8?'阿棠　船尾收到。让我再看一眼。':'阿棠　白浪后面有截断桩。等浪落下去，我再给你们报。';
      if(idx===11){
        if(t<2.55)return '阿棠　断桩露出来了。';
        if(t<5.2)return '梁青　靠上来了。接缆！';
        if(t<8.1)return '海雁号　四十一位。全员到齐。';
        if(t<10.65)return '天亮后，港口、渡轮和家属发来了回执。';
        return t<13.4?'阿棠　船上录了十秒。猜猜是什么？':'沈遥　北岬，第二盘。';
      }
      return '';
    }
    function begin(kind){
      if(disposed||kind!=='chapter-end'||!durations[idx])return false;
      clock=0;duration=(idx===4?window.TideArchiveMedia?.coda?.duration:null)||durations[idx];playing=true;renderedText='';
      if(idx===11){setupFinal();newLabel.userData.repaint();}
      return true;
    }
    function skip(){
      clock=duration;playing=false;
      if(workroom){workroom.visible=false;tender.visible=false;cable.visible=false;}
    }
    function step(dt){
      if(!playing)return false;
      clock+=Math.max(0,Number.isFinite(dt)?dt:0);
      if(clock>=duration)skip();
      return playing;
    }
    function dispose(){
      sternSet?.removeFromParent();
      if(disposed)return;
      disposed=true;skip();root.removeFromParent();
      for(const obj of owned)obj.dispose();
      for(const obj of mats.values())obj.dispose();
      for(const obj of geos.values())obj.dispose();
      root.clear();
    }
    return {begin,step,update,shot,performance,subtitle,skip,dispose,get ended(){return !playing;},
      get shared(){return playing&&idx===11&&clock>=7.72;},
      get duration(){return duration;},get time(){return clock;}};
  }
  return {create};
})();
