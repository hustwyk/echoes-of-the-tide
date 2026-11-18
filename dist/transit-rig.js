// Gallery-operated temporary test shutter for the existing North Cape rear light.
// The gallery, lamp and staff use TideSignal's frame. Y is true elevation.
const TideTransitRig=(()=>{
  const T=THREE,TAU=2*Math.PI,up=new T.Vector3(0,1,0),unit=[1,1,1],flat=[0,0,0];
  const v=(x=0,y=0,z=0)=>new T.Vector3(x,y,z),sat=n=>Math.max(0,Math.min(1,Number(n)||0));
  function create(scene,g){
    const root=new T.Group(),origin=TideSignal.point(0,0,0);root.name='北岬后灯 · 低位试遮传动';root.position.set(origin.x,origin.y,origin.z);root.rotation.y=TideSignal.yaw;scene.add(root);
    const res=new Set(),own=o=>(res.add(o),o),sources=new Set(),src=o=>(sources.add(o),o),plans=[],cache=new Map(),toruses=new Map();
    const dummy=new T.Object3D(),nm=new T.Matrix3(),qp=new T.Quaternion(),a=v(),b=v(),p=v(),n=v(),tint=new T.Color();
    let seed=893457;const rand=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
    function surface(w,h,draw){
      const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);
      const t=own(new T.CanvasTexture(c));if('colorSpace' in t)t.colorSpace=T.SRGBColorSpace;else t.encoding=T.sRGBEncoding;t.anisotropy=6;return t;
    }
    const grit=surface(256,256,(c,W,H)=>{
      c.fillStyle='#e2e0d3';c.fillRect(0,0,W,H);
      for(let i=0;i<11300;i++){c.fillStyle=rand()>.63?'rgba(88,68,46,.31)':'rgba(248,244,215,.34)';c.fillRect(rand()*W,rand()*H,.6+rand()**2*5,.55+rand()**2*2.4);}
      for(let i=0;i<43;i++){const u=rand()*W,v=rand()*H,r=1+rand()**2*12,G=c.createRadialGradient(u,v,.1,u,v,r);
        G.addColorStop(0,'rgba(105,71,40,.27)');G.addColorStop(1,'rgba(111,80,51,0)');c.fillStyle=G;c.fillRect(u-r,v-r,2*r,2*r);}
    });grit.wrapS=grit.wrapT=T.RepeatWrapping;
    const metal=own(new T.MeshStandardMaterial({vertexColors:true,map:grit,metalness:.61,roughness:.44}));
    const paint=own(new T.MeshStandardMaterial({vertexColors:true,map:grit,metalness:.29,roughness:.58}));
    if(window.TideBridgeSteel?.[0]?.[1]){
      const t=own(new T.TextureLoader().load(window.TideBridgeSteel[0][1]));t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=6;paint.normalMap=t;paint.normalScale.set(.26,.26);
    }
    const rubber=own(new T.MeshStandardMaterial({vertexColors:true,map:grit,roughness:.61,metalness:.05}));
    const sea='#526c61',dark='#404d48',bronze='#a78b60',polished='#c1ae80',red='#b66a4a',gun='#4c5650',edge='#a9afa2',chalk='#d9d1a9';
    const boxGeo=src(new T.BoxGeometry(1,1,1)),cy=src(new T.CylinderGeometry(1,1,1,22)),nut=src(new T.CylinderGeometry(1,1,1,6));
    function batch(parent,name,x=0,y=0,z=0){
      const node=new T.Group();node.name=name;node.position.set(x,y,z);parent.add(node);const group={node,sets:new Map()};plans.push(group);return group;
    }
    const fixed=batch(root,'外廊导架及机丝'),base=batch(root,'铸铁试遮机座',-5.55,.66,5.738);
    function put(G,geo,color,mat,at,scale=unit,rot=flat,quaternion=null){
      let ar=cache.get(geo);if(!ar){ar=(geo.index?src(geo.toNonIndexed()):geo).attributes;cache.set(geo,ar);}
      let dst=G.sets.get(mat);if(!dst){dst={p:[],n:[],c:[],uv:[]};G.sets.set(mat,dst);}
      dummy.position.set(...at);dummy.scale.set(...scale);if(quaternion)dummy.quaternion.copy(quaternion);else dummy.rotation.set(...rot);dummy.updateMatrix();
      nm.getNormalMatrix(dummy.matrix);tint.set(color);
      for(let i=0;i<ar.position.count;i++){
        p.fromBufferAttribute(ar.position,i).applyMatrix4(dummy.matrix);n.fromBufferAttribute(ar.normal,i).applyNormalMatrix(nm);
        dst.p.push(p.x,p.y,p.z);dst.n.push(n.x,n.y,n.z);dst.c.push(tint.r,tint.g,tint.b);
        if(Math.abs(n.y)>.64)dst.uv.push(p.x*1.82,p.z*1.82);else if(Math.abs(n.x)>.65)dst.uv.push(p.z*1.82,p.y*1.82);else dst.uv.push(p.x*1.82,p.y*1.82);
      }
    }
    function block(G,x,y,z,W,H,D,c,m=paint,rx=0,ry=0,rz=0){put(G,boxGeo,c,m,[x,y,z],[W,H,D],[rx,ry,rz]);}
    function disc(G,x,y,z,r,h,c,axis='y',geo=cy,mat=metal){put(G,geo,c,mat,[x,y,z],[r,h,r],axis==='y'?flat:axis==='z'?[Math.PI/2,0,0]:[0,0,Math.PI/2]);}
    function bar(G,A,B,r,c,m=metal,xwidth=null){
      a.set(...A);b.set(...B).sub(a);const L=b.length();qp.setFromUnitVectors(up,b.normalize());a.addScaledVector(b,L*.5);put(G,xwidth?boxGeo:nut,c,m,a.toArray(),[xwidth||r,L,r],flat,qp);
    }
    function ring(G,x,y,z,r,s,c,axis='z',mat=metal){
      const k=r+','+s;if(!toruses.has(k))toruses.set(k,src(new T.TorusGeometry(r,s,6,r>.17?48:24)));
      put(G,toruses.get(k),c,mat,[x,y,z],unit,axis==='y'?[Math.PI/2,0,0]:axis==='x'?[0,Math.PI/2,0]:flat);
    }
    function bolt(G,x,y,z,r,axis='y'){
      disc(G,x,y,z,r*1.38,.005,dark,axis);const c=[x,y,z];c['xyz'.indexOf(axis)]+=.008;disc(G,...c,r,.016,edge,axis,nut);
    }
    function pipe(G,points,s,c,mat=metal,t=20){const g=src(new T.TubeGeometry(new T.CatmullRomCurve3(points.map(u=>v(...u))),t,s,6,false));put(G,g,c,mat,flat);}
    function plate(G,x,y,z,w,h,r,d,c){
      const W=w/2,H=h/2,S=new T.Shape();S.moveTo(-W+r,-H);S.lineTo(W-r,-H);S.quadraticCurveTo(W,-H,W,-H+r);
      S.lineTo(W,H-r);S.quadraticCurveTo(W,H,W-r,H);S.lineTo(-W+r,H);S.quadraticCurveTo(-W,H,-W,H-r);S.lineTo(-W,-H+r);S.quadraticCurveTo(-W,-H,-W+r,-H);S.closePath();
      const ge=src(new T.ExtrudeGeometry(S,{depth:d,bevelEnabled:true,bevelSize:.0035,bevelThickness:.0035,bevelSegments:1,curveSegments:4}));
      put(G,ge,c,paint,[x,y,z]);
    }
    function panel(node,texture,w,h,x,y,z,opts={}){
      const m=new T.Mesh(own(new T.PlaneGeometry(w,h)),own(new T.MeshStandardMaterial({map:texture,roughness:.70,metalness:.07,...opts})));m.position.set(x,y,z);m.receiveShadow=true;node.add(m);return m;
    }
    function finish(G){
      for(const [mat,d] of G.sets){
        const bg=own(new T.BufferGeometry());for(const [k,arr,size] of [['position',d.p,3],['normal',d.n,3],['color',d.c,3],['uv',d.uv,2]])bg.setAttribute(k,new T.Float32BufferAttribute(arr,size));
        bg.computeBoundingSphere();const m=new T.Mesh(bg,mat);m.castShadow=m.receiveShadow=true;G.node.add(m);
      }G.sets.clear();
    }
    // The frame sits just inside the existing front rail; the motion rods run outside it and below its first bar.
    block(base,0,.028,.023,.480,.056,.285,'#805a42');
    for(const x of [-.187,.187])for(const z of [-.074,.122])bolt(base,x,.059,z,.016);
    for(const x of [-.151,.151]){
      bar(base,[x,.056,.104],[x,.478,.015],.047,sea,paint,.055);
      bar(base,[x,.058,-.091],[x,.476,.015],.047,sea,paint,.055);
      disc(base,x,.493,0,.085,.075,sea,'x');disc(base,x+.032,.493,0,.061,.023,bronze,'x');
    }
    block(base,.01,.197,-.015,.349,.094,.149,dark);disc(base,0,.493,0,.028,.469,edge,'x');
    const handle=batch(base.node,'试遮手柄及驱动曲拐',0,.493,0);
    disc(handle,0,0,0,.081,.150,sea,'x');disc(handle,.124,0,0,.040,.019,polished,'x',nut);
    for(const xx of [-.066,.066]){
      bar(handle,[xx,.026,-.015],[xx,.375,.024],.027,sea,paint,.038);
      bar(handle,[xx,.093,-.036],[xx,.351,.024],.011,bronze);
    }
    pipe(handle,[[-.067,.311,.015],[-.067,.417,.027],[-.049,.458,.030],[.069,.459,.030],[.172,.458,.030]],.017,bronze);
    bar(handle,[-.257,.469,.034],[.257,.469,.034],.014,polished);
    for(const x of [-.144,.144]){
      disc(handle,x,.469,.034,.029,.172,'#6b5943','x',cy,rubber);
      for(const d of [-.079,-.061,-.040,0,.040,.061,.079])ring(handle,x+d,.469,.034,.026,.0038,d===0?'#857259':dark,'x',metal);
    }
    for(const x of [-.247,.247])disc(handle,x,.469,.034,.028,.014,polished,'x',nut);
    bar(handle,[-.158,.028,0],[-.158,-.195,-.026],.029,red,paint,.039);
    disc(handle,-.158,-.195,-.026,.035,.064,bronze,'x');disc(handle,-.195,-.195,-.026,.017,.017,edge,'x',nut);
    // The paper instrument is sealed behind a rolled copper bezel. Its moving pointer is carried by the same lever shaft.
    const indicator=batch(base.node,'纸质行程刻度',-.334,.517,.067);indicator.node.rotation.y=-.27;
    bar(base,[-.147,.445,-.020],[-.326,.464,.047],.023,bronze);bar(base,[-.147,.387,.002],[-.330,.447,.041],.018,sea,paint);
    plate(indicator,0,0,0,.271,.302,.028,.027,sea);
    const paper=surface(456,500,(c,W,H)=>{
      c.fillStyle='#d7cba4';c.fillRect(0,0,W,H);
      const g=c.createLinearGradient(0,0,W,H);g.addColorStop(0,'rgba(154,123,72,.17)');g.addColorStop(.56,'rgba(255,247,207,.15)');g.addColorStop(1,'rgba(95,80,52,.21)');c.fillStyle=g;c.fillRect(0,0,W,H);
      c.strokeStyle='#716649';c.lineWidth=4;c.strokeRect(11,10,W-22,H-21);c.fillStyle='#3d4c43';c.textAlign='center';c.font='bold 74px serif';c.fillText('试 遮',W*.50,91);
      const ox=W*.5,oy=H*.815,R=H*.46;c.lineCap='butt';
      for(let i=0;i<=24;i++){
        const u=i/24,rad=-.83+1.66*u,dx=Math.sin(rad),dy=-Math.cos(rad),r2=R-(i%4?14:30);
        c.strokeStyle=i>=20?'#8d4936':'#4f594a';c.lineWidth=i%4?2.4:4.2;c.beginPath();c.moveTo(ox+dx*r2,oy+dy*r2);c.lineTo(ox+dx*R,oy+dy*R);c.stroke();
      }
      c.font='bold 34px serif';c.fillText('通光',69,352);c.fillStyle='#8f4937';c.fillText('遮光',W-68,352);
      c.fillStyle='#545948';c.font='24px serif';c.fillText('回 位 弹 簧',W*.5,H-36);
      for(let j=0;j<1210;j++){c.fillStyle=rand()>.5?'rgba(103,85,56,.12)':'rgba(242,235,197,.23)';c.fillRect(rand()*W,rand()*H,.6+rand()**2*4,1.2);}
    });
    panel(indicator.node,paper,.246,.276,0,.003,.037);
    const pointer=batch(indicator.node,'试遮机械行程指针',0,-.084,.047);
    block(pointer,0,.059,0,.007,.123,.006,'#9a5038',metal);disc(indicator,0,-.084,.052,.014,.009,bronze,'z');
    for(const x of [-.116,.116])for(const y of [-.133,.133])bolt(indicator,x,y,.039,.006,'z');
    // Two right-angle bell cranks couple the bronze push rod to the sheathed, tension-only wire along the west edge of the stair.
    const B1=[-5.947,.921,5.345],B2=[-1.349,.921,5.345],rz=.146,rx=.237;
    function bell(x,y,z,id){
      const o=batch(root,id,x,y,z);disc(fixed,x,y-.039,z,.077,.061,sea);disc(fixed,x,y-.002,z,.050,.044,bronze);
      disc(o,0,0,0,.049,.030,sea);
      bar(o,[0,0,0],[rx,0,0],.036,bronze,metal,.047);
      bar(o,[0,0,0],[0,0,rz],.036,bronze,metal,.044);
      for(const d of [[rx,0],[0,rz]]){disc(o,d[0],0,d[1],.027,.050,bronze,'y');bolt(o,d[0],.025,d[1],.015);}
      return o;
    }
    for(const [x,y,z] of [B1,B2]){
      block(fixed,x,.707,5.562,.247,.083,.081,sea);for(const u of [-.085,.085])bolt(fixed,x+u,.757,5.563,.013);
      bar(fixed,[x,.694,5.533],[x,y-.038,z],.044,sea,paint,.050);block(fixed,x,y-.045,z,.160,.037,.132,sea);
    }
    const left=bell(...B1,'西端摇臂'),right=bell(...B2,'梯边转向摇臂');
    // Guide brasses are open-ended; the polished rod actually slides through their holes.
    for(const x of [-5.37,-4.30,-3.18,-2.18]){
      block(fixed,x,.704,5.561,.123,.077,.082,sea);bar(fixed,[x,.715,5.560],[x,.884,5.490],.025,sea,paint,.045);
      ring(fixed,x,.921,5.487,.025,.0065,bronze,'x');bolt(fixed,x,.752,5.585,.013);
    }
    function telescopic(name,thick){
      const group=batch(root,name);
      put(group,cy,polished,metal,[0,.5,0],[thick,1,thick]);
      return group.node;
    }
    const pullRod=telescopic('手柄叉头连杆',.013),galleryRod=telescopic('外廊黄铜长拉杆',.018),shackle=telescopic('转向器短拉索',.009);
    function sheave(G,x,y,z,R,axis='x'){
      disc(G,x,y,z,R,.038,dark,axis);
      for(const d of [-.022,.022]){const xx=axis==='x'?x+d:x,zz=axis==='z'?z+d:z;ring(G,xx,y,zz,R,.008,bronze,axis);}
      disc(G,x,y,z,R*.37,.077,bronze,axis);disc(G,x,y,z,R*.17,.102,edge,axis,nut);
    }
    // No overhead crossing. The control wire starts beyond the stair and stays at least 0.28 m outside its western rail.
    const launch=[-1.107,.893,5.174],middle=[-1.092,2.18,2.94],land=[-.964,3.424,-.027];
    sheave(fixed,...launch,.072);
    bar(fixed,[-1.174,.685,5.543],[-1.174,.891,5.174],.028,sea,paint,.046);
    bar(fixed,[-1.065,.686,5.522],[-1.065,.886,5.174],.028,sea,paint,.046);
    pipe(fixed,[[launch[0],launch[1]+.069,launch[2]],middle,[land[0],land[1]+.061,land[2]]],.008,edge,metal,30);
    sheave(fixed,...land,.071);for(const xx of [land[0]-.049,land[0]+.048]){bar(fixed,[xx,3.09,.04],[xx,land[1],land[2]],.031,sea,paint,.040);block(fixed,xx,3.054,.034,.090,.043,.160,sea);}
    pipe(fixed,[[land[0],land[1]+.062,land[2]],[land[0]+.017,3.512,-.313],[-.868,3.599,-.595]],.0075,edge,metal,16);
    // The sector is outboard of the open storm-shutter leaves (maximum radius about 0.72 m).
    // Its two lifted cheeks are linked by the same crosshead. Either side of the optical track can see the trial.
    const drum=batch(root,'遮片回索鼓及止动盘',-.864,3.502,-.607);
    disc(drum,0,0,0,.089,.085,gun,'x');
    for(const xx of [-.049,.049])ring(drum,xx,0,0,.093,.010,bronze,'x');
    for(let j=0;j<8;j++)ring(drum,-.033+j*.009,0,0,.091,.0034,edge,'x');
    disc(drum,.078,0,0,.199,.026,sea,'x');ring(drum,.094,0,0,.178,.008,bronze,'x');
    for(let j=0;j<6;j++){const u=TAU*j/6;bar(drum,[.095,0,0],[.095,.173*Math.cos(u),.173*Math.sin(u)],.011,bronze);}
    for(const xx of [-.919,-.726]){
      block(fixed,xx,3.063,-.607,.107,.054,.255,sea);bar(fixed,[xx,3.091,-.536],[xx,3.50,-.607],.045,sea,paint,.056);
      disc(fixed,xx,3.502,-.607,.047,.064,bronze,'x');
    }
    const cz=-.82,rad=.758,yStow=3.615,travel=.688,angleA=Math.PI-.980,angleB=Math.PI+.980;
    const blade=batch(root,'海向试遮扇片',0,yStow,cz);
    // The rolled sector rests below the lowest glass lens. Its width covers the complete glass silhouette as seen from the ship.
    const profile=[[-.409,.000],[-.409,.018],[.306,.018],[.326,.012],[.326,.000]];
    function rollSheet(section,start,end,segs){
      const P=[],UV=[];const L=section.length;
      function at(j,k){const a=start+(end-start)*j/segs,point=section[k];return [Math.sin(a)*(rad+point[1]),point[0],Math.cos(a)*(rad+point[1])];}
      function tri(A,B,C){P.push(...A,...B,...C);UV.push(A[0],A[1],B[0],B[1],C[0],C[1]);}
      for(let i=0;i<segs;i++)for(let k=0;k<L;k++){
        const h=(k+1)%L,A=at(i,k),B=at(i+1,k),C=at(i+1,h),D=at(i,h);
        tri(A,B,C);tri(A,C,D);
      }
      for(const j of [0,segs])for(let k=1;k<L-1;k++){const A=at(j,0),B=at(j,k),C=at(j,k+1);if(j===0)tri(A,B,C);else tri(A,C,B);}
      const gg=src(new T.BufferGeometry());gg.setAttribute('position',new T.Float32BufferAttribute(P,3));gg.setAttribute('uv',new T.Float32BufferAttribute(UV,2));gg.computeVertexNormals();return gg;
    }
    put(blade,rollSheet(profile,angleA,angleB,28),'#46504b',paint,flat);
    function curveAt(r,y,a){return [r*Math.sin(a),y,r*Math.cos(a)];}
    for(const y of [-.373,.279]){
      const curve=[];for(let j=0;j<=24;j++)curve.push(curveAt(rad+.028,y,angleA+(angleB-angleA)*j/24));pipe(blade,curve,.012,'#9b8b68',metal,30);
    }
    for(const frac of [.025,.25,.75,.975]){
      const a=angleA+(angleB-angleA)*frac,rx=Math.sin(a),rz=Math.cos(a);
      bar(blade,curveAt(rad+.022,-.373,a),curveAt(rad+.022,.278,a),.010,gun,metal);
      for(const y of [-.373,-.167,.15,.279]){
        const ge=src(new T.SphereGeometry(1,9,5));put(blade,ge,polished,metal,[(rad+.027)*rx,y,(rad+.027)*rz],[.012,.010,.012]);
      }
    }
    // Runners at the sides leave the optic and climbing route clear. The sector has its own trip spring, independent of handle reset.
    const sx=.675,sz=cz-.412;
    for(const sign of [-1,1]){
      const x=sign*sx;
      block(fixed,x,3.090,sz,.157,.093,.154,sea);
      disc(fixed,x,3.144,sz,.037,.035,bronze);
      bar(fixed,[x,3.155,sz],[x,4.65,sz],.012,edge);
      block(fixed,x,4.647,sz,.070,.032,.063,bronze);
      for(const yy of [-.220,.185]){disc(blade,x,yy,sz-cz,.029,.082,bronze);bar(blade,[x,yy,sz-cz],[sign*.608,yy,-.495],.014,bronze);}
    }
    const tripSpring=batch(root,'遮片跳脱回位卷簧',-.863,3.502,-.606);
    const spiral=[];for(let j=0;j<=118;j++){const u=j/118,a=TAU*3.7*u,R=.030+.105*u;spiral.push([-.089,R*Math.sin(a),R*Math.cos(a)]);}
    pipe(tripSpring,spiral,.0052,polished,metal,115);bar(tripSpring,[-.091,.003,.026],[-.091,.020,.052],.009,bronze);
    const release=batch(root,'弹回扇片偏心拨臂',-.694,3.543,-1.231);
    disc(release,0,0,0,.116,.033,bronze,'x');ring(release,.019,0,0,.097,.009,polished,'x');
    disc(release,.037,.017,-.079,.023,.036,bronze,'x');
    const lifting=telescopic('扇片提升索',.0084);
    // The return runs on the protected western cheek of the light base.
    sheave(fixed,-.676,4.628,-1.239,.048);bar(fixed,[-.709,3.58,-1.235],[-.709,4.633,-1.238],.016,sea);
    pipe(fixed,[[-.822,3.607,-.608],[-.784,3.659,-.735],[-.744,3.667,-1.087],[-.695,3.622,-1.224]],.008,polished,metal,19);
    bar(fixed,[-.676,3.567,-1.287],[-.676,4.627,-1.287],.0065,edge);
    for(const G of plans)finish(G);for(const s of sources)s.dispose();sources.clear();cache.clear();toruses.clear();
    const A=v(),B=v(),C=v(),D=v(),L=v(),R=v(),hand=[v(),v()],localHands=[v(-.146,.469,.034),v(.146,.469,.034)];
    const endpoint=(obj,local,out)=>out.copy(local).applyMatrix4(obj.matrix);
    function segment(node,start,end){C.subVectors(end,start);const d=C.length();node.position.copy(start);node.quaternion.setFromUnitVectors(up,C.multiplyScalar(1/Math.max(.0001,d)));node.scale.set(1,d,1);}
    let disposed=false,lastStroke=-1,lastFlag=-1;
    function update(game,t){
      if(disposed)return;
      const s=game.signal||{},on=game.stage===1&&s.heard,stroke=on?sat(s.testStroke):0,flag=on?sat(s.flag):0;
      if(stroke===lastStroke&&flag===lastFlag)return;lastStroke=stroke;lastFlag=flag;
      handle.node.rotation.x=-.215+.754*stroke;handle.node.updateMatrix();
      const rot=-.336+.652*stroke;
      left.node.rotation.y=right.node.rotation.y=rot;left.node.updateMatrix();right.node.updateMatrix();
      pointer.node.rotation.z=.83-1.66*stroke;drum.node.rotation.x=-1.68*stroke;
      const tip=A.set(-.158,-.195,-.026).applyMatrix4(handle.node.matrix).add(base.node.position);
      endpoint(left.node,L.set(rx,0,0),B);segment(pullRod,tip,B);
      endpoint(left.node,L.set(0,0,rz),A);endpoint(right.node,R.set(0,0,rz),B);segment(galleryRod,A,B);
      endpoint(right.node,L.set(rx,0,0),A);B.set(launch[0],launch[1]+.069,launch[2]);segment(shackle,A,B);
      blade.node.position.y=yStow+travel*flag;
      release.node.rotation.x=flag*3.65;
      tripSpring.node.rotation.x=-.18*stroke+.49*flag;
      A.set(-.676,4.628,-1.192);D.set(-sx,blade.node.position.y+.185,sz);segment(lifting,A,D);
    }
    function hands(game,side){
      if(disposed||side!==0||game.stage!==1||!game.signal?.heard||!game.engaged?.[0])return null;
      handle.node.updateWorldMatrix(true,false);for(let i=0;i<2;i++)hand[i].copy(localHands[i]).applyMatrix4(handle.node.matrixWorld);return hand;
    }
    update(g);
    return {update,hands,dispose(){if(disposed)return;disposed=true;if(root.parent)root.parent.remove(root);for(const r of res)r.dispose();res.clear();root.clear();}};
  }
  return {create};
})();
