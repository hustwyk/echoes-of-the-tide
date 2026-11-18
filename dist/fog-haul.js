// Retracting travelling lifeline over the two turning foghouse shoes. Coordinates are metres in the foghouse frame.
const TideFogHaul=(()=>{
  const T=THREE,TAU=Math.PI*2,V=(x=0,y=0,z=0)=>new T.Vector3(x,y,z),Y=V(0,1,0),clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
  function create(parent,g){
    const origin=parent.getWorldPosition(V()),rx=-1.17,railY=3.405,z0=-6.80,z1=5.10,nearStop=z1-.222,farStop=z0+.222;
    const owned=new Set(),own=x=>(owned.add(x),x),forms=new Set(),shape=x=>(forms.add(x),x),batches=new Map();
    function group(par,x=0,y=0,z=0,name=''){const o=new T.Group();o.name=name;o.position.set(x,y,z);par.add(o);return o}
    const root=group(parent,0,0,0,'雾号所 · 随行防坠索'),rail=group(root,rx,railY,0,'纵向工字轨'),car=group(root,rx,railY,nearStop,'防坠索走行车');
    const saddle=group(car,-.150,-.253,0,'速差卷筒座'),drum=group(saddle,0,0,0,'实绳卷筒'),keeper=group(saddle,.106,.018,.124,'离心制动标');
    const roller0=group(car,0,-.0205,-.129,'后轮对'),roller1=group(car,0,-.0205,.129,'前轮对'),nose=group(car,-.566,-.213,0,'出绳导轮');
    const connector=group(root,0,0,0,'防坠索锁扣'),web=group(root,0,0,0,'机修员肩背带扣'),aEye=group(web,0,.029,.014,'背带扣承力点');
    const ringGroups=[group(root,0,0,0,'甲轮外沿抓环'),group(root,0,0,0,'乙轮外沿抓环')];
    let seed=384497;const rand=()=>((seed=(Math.imul(1664525,seed)+1013904223)>>>0)/4294967296);
    function canvas(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return c}
    function tex(c,colour=true,wrap=false){const t=own(new T.CanvasTexture(c));if(colour)t.colorSpace=T.SRGBColorSpace;if(wrap)t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=6;return t}
    const grade=canvas(256,256),ctx=grade.getContext('2d'),im=ctx.createImageData(256,256);
    for(let y=0;y<256;y++)for(let x=0;x<256;x++){const k=(y*256+x)*4,v=228+(rand()-.48)*24+4*Math.sin((x+y)*.072+3*Math.sin(x*.047));im.data.set([v,v-1,v-3,255],k);}ctx.putImageData(im,0,0);
    for(let i=0;i<320;i++){const x=rand()*256,y=rand()*256;ctx.strokeStyle=i%5?'rgba(101,82,58,.18)':'rgba(242,237,203,.18)';ctx.lineWidth=.4+rand()*1.45;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+rand()*9,y+rand()*2);ctx.stroke();}
    const oxide=tex(grade,true,true),scan=window.TideBridgeSteel?.[0];
    let normalMap=null;if(scan?.[1]){normalMap=own(new T.TextureLoader().load(scan[1]));normalMap.wrapS=normalMap.wrapT=T.RepeatWrapping;normalMap.anisotropy=4;}
    const iron=own(new T.MeshStandardMaterial({map:oxide,vertexColors:true,metalness:.46,roughness:.65,normalMap,normalScale:new T.Vector2(.29,.29)})),
      machined=own(new T.MeshStandardMaterial({map:oxide,vertexColors:true,metalness:.70,roughness:.39})),
      soft=own(new T.MeshStandardMaterial({map:oxide,vertexColors:true,metalness:.075,roughness:.83}));
    const cordC=canvas(192,192),cc=cordC.getContext('2d'),cloth=cc.createImageData(192,192);
    for(let y=0;y<192;y++)for(let x=0;x<192;x++){
      const rep=(u,n)=>((u%n)+n)%n,wa=rep(x+2*y,48),wb=rep(x-2*y,48),over=rep(Math.floor((x+y*2)/48)+Math.floor((x-y*2)/48),2),
        trace=(over?wa:wb)<8&&rep(Math.floor((x+(over?2:-2)*y)/48),4)!==2,
        valley=(over?wa:wb)<3||wa>45&&wb>45?23:0,g=(rand()-.5)*15-valley+5*Math.cos((over?wa:wb)*.16),
        base=trace?[106,93,71]:[213,178,106];cloth.data.set([base[0]+g,base[1]+g,base[2]+g,255],(y*192+x)*4);}
    cc.putImageData(cloth,0,0);
    const ropeTex=tex(cordC,true,true),ropeMat=own(new T.MeshStandardMaterial({map:ropeTex,roughness:.74,metalness:.045}));
    const plateC=canvas(768,256),pc=plateC.getContext('2d');pc.fillStyle='#aa9b78';pc.fillRect(0,0,768,256);pc.fillStyle='#45574e';pc.fillRect(8,8,752,240);
    pc.strokeStyle='#c0ba99';pc.lineWidth=2.6;pc.strokeRect(17,17,734,222);pc.textAlign='center';pc.textBaseline='middle';pc.fillStyle='#e2d9b6';
    pc.font='600 74px "Songti SC",serif';pc.fillText('随 行 防 坠 索',384,88);pc.font='500 39px sans-serif';pc.fillText('卷筒制动   ·   东堤雾号所',384,181);
    for(let i=0;i<1700;i++){pc.fillStyle=i%5?'rgba(89,75,57,.2)':'rgba(224,212,171,.23)';pc.fillRect(rand()*768,rand()*256,rand()*3+.55,rand()*1.5+.3);}
    const tagMaterial=own(new T.MeshStandardMaterial({map:tex(plateC),roughness:.65,metalness:.26,vertexColors:true}));
    const base='#4f625b',deep='#3c4945',galv='#8b978e',salt='#aeb4a3',bronze='#b89766',rust='#815840',rubber='#41473e',yellow='#e5b24e';
    const unit=shape(new T.BoxGeometry(1,1,1)),discs=new Map(),q=new T.Quaternion(),nrm=new T.Matrix3(),o3=new T.Object3D(),v=V(),n=V(),dir=V(),tint=new T.Color();
    function cyl(k){if(!discs.has(k))discs.set(k,shape(new T.CylinderGeometry(1,1,1,k)));return discs.get(k)}
    function add(par,ge,mat,col,pos=[0,0,0],size=[1,1,1],rot=null,raw=false){
      if(!batches.has(par))batches.set(par,new Map());const m=batches.get(par);if(!m.has(mat))m.set(mat,{p:[],n:[],c:[],u:[],i:[]});const b=m.get(mat),a=ge.attributes,start=b.p.length/3;
      o3.position.fromArray(pos);o3.scale.fromArray(size);if(rot?.isQuaternion)o3.quaternion.copy(rot);else o3.rotation.set(...(rot||[0,0,0]));o3.updateMatrix();nrm.getNormalMatrix(o3.matrix);tint.set(col);
      for(let j=0;j<a.position.count;j++){v.fromBufferAttribute(a.position,j).applyMatrix4(o3.matrix);n.fromBufferAttribute(a.normal,j).applyNormalMatrix(nrm);b.p.push(v.x,v.y,v.z);b.n.push(n.x,n.y,n.z);b.c.push(tint.r,tint.g,tint.b);
        if(raw&&a.uv)b.u.push(a.uv.getX(j),a.uv.getY(j));else if(Math.abs(n.y)>.69)b.u.push(v.x*1.8,v.z*1.8);else if(Math.abs(n.z)>.69)b.u.push(v.x*1.8,v.y*1.8);else b.u.push(v.z*1.8,v.y*1.8);}
      const ix=ge.index;for(let i=0,count=ix?.count||a.position.count;i<count;i++)b.i.push(start+(ix?ix.getX(i):i));
    }
    const box=(o,x,y,z,w,h,d,c,m=iron,r=null)=>add(o,unit,m,c,[x,y,z],[w,h,d],r);
    const disc=(o,x,y,z,r,h,c,axis='y',m=machined,k=18)=>add(o,cyl(k),m,c,[x,y,z],[r,h,r],axis==='x'?[0,0,Math.PI/2]:axis==='z'?[Math.PI/2,0,0]:null);
    function connect(o,a,b,r,c,m=machined,k=12){const A=V(...a),B=V(...b);dir.subVectors(B,A);const len=dir.length();q.setFromUnitVectors(Y,dir.multiplyScalar(1/len));add(o,cyl(k),m,c,A.lerp(B,.5).toArray(),[r,len,r],q);}
    function beam(o,a,b,w,d,c,m=iron){const A=V(...a),B=V(...b);dir.subVectors(B,A);const len=dir.length();q.setFromUnitVectors(Y,dir.multiplyScalar(1/len));add(o,unit,m,c,A.lerp(B,.5).toArray(),[w,len,d],q);}
    function bend(o,coords,r,c,m=machined,k=8,seg=0){const ge=shape(new T.TubeGeometry(new T.CatmullRomCurve3(coords.map(a=>V(...a))),seg||coords.length*4,r,k,false));add(o,ge,m,c);}
    function nut(o,x,y,z,r,axis='y',colour=bronze){const d=axis==='x'?[1,0,0]:axis==='z'?[0,0,1]:[0,1,0];disc(o,x,y,z,r*1.19,r*.24,deep,axis,iron,14);disc(o,x+r*d[0]*.26,y+r*d[1]*.26,z+r*d[2]*.26,r,r*.67,colour,axis,machined,6);}
    // Three cantilevers terminate at existing gallery/apron foundations, clear of the two turning decks.
    for(const [j,z] of [-6.39,-2.03,4.92].entries()){
      const x=.97;
      box(root,x,.026,z,.275,.052,.267,deep);box(root,x,.076,z,.207,.047,.201,base);
      for(const sx of [-.097,.097])for(const sz of [-.091,.091])nut(root,x+sx,.062,z+sz,.020);
      box(root,x,1.756,z,.107,3.345,.099,base);for(const dz of [-.052,.052])box(root,x,1.754,z+dz,.145,3.326,.011,galv);
      box(root,x,2.675,z,.157,.107,.157,deep);box(root,x,3.488,z,.166,.078,.169,base);
      beam(root,[x+.040,3.48,z],[rx-.06,3.48,z],.085,.106,base);beam(root,[x-.022,2.691,z],[rx+.198,3.455,z],.067,.069,galv);
      box(root,rx,3.495,z,.203,.073,.231,base);for(const sx of [-.055,.055])nut(root,rx+sx,3.533,z,.0115);
      if(j===1){box(root,x,2.22,z+.055,.119,.070,.006,bronze,machined);}
    }
    // The carriage wheels roll independently on the polished top face of the bottom flange.
    const L=z1-z0,cz=(z0+z1)*.5;
    box(rail,0,.080,cz,.140,.015,L,base);box(rail,0,-.002,cz,.014,.159,L,base);
    box(rail,0,-.081,cz,.161,.015,L,deep);for(const x of [-.047,.047])box(rail,x,-.0715,cz,.046,.005,L-.062,galv,machined);
    for(const z of [-4.75,-.92,2.98]){for(const sx of [-.017,.017]){box(rail,sx,-.003,z,.013,.108,.285,galv);for(const dz of [-.092,.092])disc(rail,sx,-.003,z+dz,.019,.036,bronze,'x',machined,6);}}
    for(const z of [z0+.095,z1-.095]){box(rail,0,-.015,z,.194,.138,.071,base);box(rail,0,-.050,z+(z<0?.044:-.044),.174,.071,.044,rubber,soft);nut(rail,.094,-.007,z,.021,'x');}
    for(let k=0;k<29;k++){const z=z0+.20+k*.389;box(rail,-.0086,-.021,z,.003,.013,.072+rand()*.072,k%4?rust:salt,iron);}
    for(const r of [roller0,roller1]){
      for(const sx of [-1,1]){disc(r,sx*.0445,0,0,.051,.042,galv,'x',machined,32);disc(r,sx*.067,0,0,.060,.010,deep,'x',iron,28);
        disc(r,sx*.090,0,0,.029,.035,bronze,'x',machined,20);}
      for(const x of [-.105,.105])nut(r,x,0,0,.019,'x',salt);
    }
    for(const sx of [-1,1]){
      box(car,sx*.098,-.087,0,.014,.155,.338,base);
      for(const z of [-.128,.128])disc(car,sx*.105,-.019,z,.031,.015,galv,'x',machined,24);
    }
    box(car,0,-.157,0,.214,.045,.272,deep);
    for(const z of [-.080,.080]){
      beam(car,[.039,-.153,z],[-.593,-.168,z],.043,.032,base);
      beam(car,[-.040,-.342,z],[-.551,-.182,z],.029,.030,galv);
      beam(car,[-.044,-.151,z],[-.044,-.343,z],.037,.041,base);
      box(car,-.540,-.198,z,.088,.103,.025,base);nut(car,-.554,-.212,z,.018,'z');
    }
    // Axle along Z allows the running strand to leave the top of the drum tangentially toward the outer guide.
    disc(saddle,0,0,-.078,.143,.018,base,'z',iron,56);disc(saddle,0,0,.092,.124,.016,base,'z',iron,56);
    for(const z of [-.104,.112]){disc(saddle,0,0,z,.054,.032,galv,'z',machined,32);}
    disc(drum,0,0,0,.082,.149,deep,'z',iron,48);for(const z of [-.075,.075]){
      disc(drum,0,0,z,.138,.009,galv,'z',machined,48);
      for(let i=0;i<6;i++){const a=i*TAU/6;connect(drum,[.032*Math.cos(a),.032*Math.sin(a),z+.004],[.119*Math.cos(a),.119*Math.sin(a),z+.004],.0064,bronze,machined,9);}
    }
    disc(drum,0,0,.121,.038,.010,bronze,'z',machined,24);box(drum,0,.022,.128,.004,.018,.003,'#d2c399',machined);
    // An open sector of guard leaves the wound cable visible in side and three-quarter views.
    const guardpts=[];for(let j=0;j<=24;j++){const a=-2.26+j*2.05/24;guardpts.push([Math.cos(a)*.151,Math.sin(a)*.151,.068]);}
    bend(saddle,guardpts,.010,base,iron,8,28);for(const j of [0,8,16,24])connect(saddle,guardpts[j],[guardpts[j][0],guardpts[j][1],-.082],.009,base,iron);
    const latch=group(saddle,.106,.018,.124,'超速制动棘爪');
    connect(latch,[0,0,0],[.030,-.045,0],.009,rust,machined);box(keeper,.002,-.030,.005,.036,.041,.009,'#ba7745',iron);
    disc(saddle,.106,.018,.129,.012,.010,salt,'z',machined,14);
    box(car,-.183,-.086,.098,.185,.060,.010,bronze,machined);
    add(car,shape(new T.PlaneGeometry(.175,.052)),tagMaterial,0xffffff,[-.183,-.086,.104],[1,1,1],null,true);
    for(const px of [-.263,-.102])nut(car,px,-.086,.104,.0046,'z');
    disc(nose,0,0,0,.060,.041,bronze,'z',machined,36);for(const z of [-.025,.025]){disc(nose,0,0,z,.068,.007,galv,'z',machined,36);
      for(let j=0;j<5;j++){const a=j*TAU/5;disc(nose,.039*Math.cos(a),.039*Math.sin(a),z+.003,.007,.008,deep,'z',iron,12);}}
    // Recoil parking fork on the underside of the sheave carrier.
    for(const z of [-.033,.034]){bend(car,[[-.583,-.239,z],[-.612,-.260,z],[-.631,-.293,z],[-.640,-.311,z]],.006,galv,machined,8,12);}
    const RR=.1115,wraps=14,pitch=.0098,steps=wraps*36,around=6,coilP=[],coilN=[],coilUv=[],coilI=[];
    for(let j=0;j<=steps;j++){const a=TAU*j/36,C=Math.cos(a),S=Math.sin(a),z=-.069+pitch*j/36;
      for(let k=0;k<=around;k++){const b=TAU*k/around,cb=Math.cos(b),sb=Math.sin(b),wire=.0052;
        coilP.push((RR+wire*cb)*C,(RR+wire*cb)*S,z+wire*sb);coilN.push(C*cb,S*cb,sb);coilUv.push(k/around,j/36*10);}
      if(j)for(let k=0;k<around;k++){const m=(j-1)*(around+1)+k;coilI.push(m,m+around+1,m+1,m+1,m+around+1,m+around+2);}
    }
    const coil=own(new T.BufferGeometry());coil.setAttribute('position',new T.Float32BufferAttribute(coilP,3));coil.setAttribute('normal',new T.Float32BufferAttribute(coilN,3));coil.setAttribute('uv',new T.Float32BufferAttribute(coilUv,2));coil.setIndex(coilI);coil.computeBoundingSphere();
    const coilMesh=new T.Mesh(coil,ropeMat);coilMesh.name='排绳绕组';drum.add(coilMesh);coilMesh.castShadow=coilMesh.receiveShadow=true;
    // Both rung centrelines coincide with the simulation's catch locus. Nothing projects above either tread.
    for(const [k,r] of ringGroups.entries()){
      const path=[[-.322,.238,-.050],[-.322,.152,-.022],[-.322,.076,-.004],[-.313,.024,0],[-.283,.003,0],[-.245,0,0],[.245,0,0],[.283,.003,0],[.313,.024,0],[.322,.076,-.004],[.322,.152,-.022],[.322,.238,-.050]];
      // Use straight centre for hand contact, with two swept, formed end cheeks.
      bend(r,path.slice(0,6),.0205,yellow,iron,10,24);bend(r,path.slice(6),.0205,yellow,iron,10,24);
      connect(r,[-.245,0,0],[.245,0,0],.0205,yellow,iron,18);
      for(const x of [-.322,.322]){
        box(r,x,.255,-.050,.084,.102,.034,base);box(r,x,.277,-.088,.081,.024,.090,galv);
        disc(r,x,.251,-.028,.024,.018,bronze,'z',machined,20);
        for(const z of [-.102,-.066])nut(r,x,.292,z,.009,'y',salt);
      }
      for(const s of [-1,1]){
        connect(r,[s*.069,0,0],[s*.220,0,0],.0209,k?'#d8a248':'#e9b953',iron,18);
        for(const x of [.064,.217])connect(r,[s*x,0,0],[s*(x+.011),0,0],.0214,'#535348',iron,16);
        for(const x of [.099,.134,.179])connect(r,[s*x,-.0019,.001],[s*(x+.013),-.0019,.001],.0199,'#bfaf84',machined,14);
      }
    }
    // The shoulder adapter follows the actual jacket chest node, not a generic point suspended above the head.
    box(web,0,.000,.000,.040,.080,.008,'#605e45',soft,[0,0,-.075]);
    for(const x of [-.015,.015])box(web,x,.001,.005,.002,.064,.002,'#ac9b6b',soft);
    bend(web,[[-.016,.020,.004],[-.016,.034,.015],[-.012,.044,.019],[.010,.044,.019],[.016,.035,.013],[.016,.021,.004]],.0039,galv,machined,8,21);
    // Forged asymmetric pear connector; screw sleeve lies on the moving gate side.
    bend(connector,[[.011,.058,0],[.009,.071,0],[-.008,.077,0],[-.021,.065,0],[-.020,.046,0],[-.012,.016,0],[-.006,.004,0],[.003,.001,0],[.012,.010,0],[.014,.022,0]],.0045,galv,machined,9,30);
    connect(connector,[.014,.020,0],[.011,.060,0],.0034,galv,machined,9);connect(connector,[.013,.031,0],[.012,.048,0],.0068,bronze,machined,14);
    disc(connector,-.004,.073,.003,.0050,.004,bronze,'z',machined,12);
    bend(connector,[[-.010,.073,0],[-.014,.090,0],[-.007,.105,0],[.002,.098,0],[.005,.080,0]],.0046,'#b4a37c',soft,7,18);
    box(connector,-.006,.110,0,.013,.024,.011,'#766b52',soft,[0,0,-.10]);
    for(const [par,mats] of batches)for(const [m,b] of mats){const ge=own(new T.BufferGeometry());for(const [key,ar,stride] of [['position',b.p,3],['normal',b.n,3],['color',b.c,3],['uv',b.u,2]])ge.setAttribute(key,new T.Float32BufferAttribute(ar,stride));ge.setIndex(b.i);ge.computeBoundingBox();ge.computeBoundingSphere();
      const mesh=new T.Mesh(ge,m);mesh.castShadow=true;mesh.receiveShadow=true;par.add(mesh);}
    for(const f of forms)f.dispose();forms.clear();batches.clear();
    // A single continuously routed rope: helix tangency -> level winder -> nose pulley -> shoulder spliced eye.
    const N=34,K=8,count=(N+1)*(K+1),coords=new Float32Array(count*3),normals=new Float32Array(count*3),uv=new Float32Array(count*2),indices=[];
    for(let i=0;i<N;i++)for(let j=0;j<K;j++){const a=i*(K+1)+j;indices.push(a,a+1,a+K+1,a+1,a+K+2,a+K+1);}
    const lineGeo=own(new T.BufferGeometry()),P=new T.BufferAttribute(coords,3).setUsage(T.DynamicDrawUsage),NN=new T.BufferAttribute(normals,3).setUsage(T.DynamicDrawUsage),UV=new T.BufferAttribute(uv,2).setUsage(T.DynamicDrawUsage);
    lineGeo.setAttribute('position',P);lineGeo.setAttribute('normal',NN);lineGeo.setAttribute('uv',UV);lineGeo.setIndex(indices);
    // The line's real positions can travel through the whole pit. Supply finite bounds before the first sightline index is built.
    lineGeo.boundingBox=new T.Box3(V(-7.3,-4.1,-8.1),V(7.2,4.1,7.6));lineGeo.boundingSphere=new T.Sphere(V(-1,.1,-.4),12.8);
    const lineMesh=new T.Mesh(lineGeo,ropeMat);lineMesh.name='防坠主绳';lineMesh.castShadow=true;lineMesh.receiveShadow=true;root.add(lineMesh);
    const samples=Array.from({length:N+1},()=>V()),tan=V(),side=V(),bin=V(),lastSide=V(),boxPt=V(),cordStart=V(),exit=V(),goal=V(),tip=V(),belay=V(),stand=V(),wind=V(),mid=V(),
      bodyPoint=V(.117,.416,.113),worldTmp=V(),chestOff=V(),turnQ=new T.Quaternion(),worldQ=new T.Quaternion(),parInvQ=new T.Quaternion(),lastGoal=V(),clipDir=V();
    let actor=null;const locateActor=()=>parent.parent?.getObjectByName('林澈')||null;
    function garment(player){
      if(!actor?.parent)actor=locateActor();
      const chest=actor?.userData?.rig?.bones?.chest;
      if(chest){
        chest.updateWorldMatrix(true,false);actor.getWorldPosition(worldTmp);chestOff.copy(bodyPoint).applyMatrix4(chest.matrixWorld).sub(worldTmp);
        turnQ.setFromAxisAngle(Y,(player.yaw||0)-actor.rotation.y);chestOff.applyQuaternion(turnQ);
        web.position.set(player.x-origin.x,player.y-origin.y,player.z-origin.z).add(chestOff);
        chest.getWorldQuaternion(worldQ);parent.getWorldQuaternion(parInvQ).invert();
        web.quaternion.multiplyQuaternions(turnQ,worldQ).premultiply(parInvQ);
      }else{
        turnQ.setFromAxisAngle(Y,player.yaw||0);web.position.set(player.x-origin.x,player.y-origin.y,player.z-origin.z).add(chestOff.set(.124,1.503,.121).applyQuaternion(turnQ));web.quaternion.copy(turnQ);
      }
      goal.copy(aEye.position).applyQuaternion(web.quaternion).add(web.position);
    }
    const sin=[],cos=[];for(let k=0;k<=K;k++){sin.push(Math.sin(TAU*k/K));cos.push(Math.cos(TAU*k/K));}
    function knit(){
      let len=0;lastSide.set(0,0,1);for(let i=0;i<=N;i++){
        if(i)len+=samples[i].distanceTo(samples[i-1]);
        tan.subVectors(samples[Math.min(N,i+1)],samples[Math.max(0,i-1)]).normalize();
        // Parallel transport the frame so a vertical or horizontal transition cannot twist the painted tracer.
        side.copy(lastSide).addScaledVector(tan,-lastSide.dot(tan));if(side.lengthSq()<.00001)side.set(1,0,0).addScaledVector(tan,-tan.x);side.normalize();lastSide.copy(side);bin.crossVectors(tan,side).normalize();
        for(let j=0;j<=K;j++){const index=i*(K+1)+j;dir.copy(side).multiplyScalar(cos[j]).addScaledVector(bin,sin[j]);
          boxPt.copy(samples[i]).addScaledVector(dir,.0083);P.setXYZ(index,boxPt.x,boxPt.y,boxPt.z);NN.setXYZ(index,dir.x,dir.y,dir.z);UV.setXY(index,j/K,len/.139);}
      }
      P.needsUpdate=NN.needsUpdate=UV.needsUpdate=true;
    }
    const localShoulder=V(),lastNose=V(Infinity,0,0);
    let previousKey=null,stow=1,lastTime=null,atZ=nearStop,releaseZ=nearStop,braking=0,rollAngle=0,oldTravel=null,oldPaid=null,sheaveSpin=0;
    function update(game){
      const f=game?.fog,w=game?.world?.foghouse,p=game?.players?.[0];if(!w||!f||!p){root.visible=false;return;}root.visible=true;
      const time=Number.isFinite(game.time)?game.time:0,dt=lastTime===null||time<lastTime?0:Math.min(.15,time-lastTime);lastTime=time;
      for(let i=0;i<ringGroups.length;i++){const d=w.wheels[i],r=ringGroups[i],a=d.angle||0;
        r.position.set(d.x-origin.x+.55*Math.sin(a),d.y-origin.y-.32,d.z-origin.z+.55*Math.cos(a));r.rotation.y=a;}
      const carrying=f.key==='carry',working=!!f.haul&&carrying;web.visible=carrying;
      if(carrying){garment(p);atZ=clamp(goal.z,z0+.23,z1-.23);stow=0;releaseZ=atZ;lastGoal.copy(goal);}
      else{
        if(previousKey==='carry'){stow=0;releaseZ=atZ;}
        else if(previousKey===null||previousKey!==f.key){stow=1;releaseZ=f.key==='rack'?clamp(w.rack.z-origin.z,farStop,nearStop):clamp(w.drive.z-origin.z,farStop,nearStop);}
        atZ=releaseZ;
      }
      const load=working?1:carrying&&!p.grounded&&p.vy<-.55?.65:0;
      braking+= (load-braking)*(dt?1-Math.exp(-dt*(load>braking?23:9)):previousKey===null?1:0);
      latch.rotation.z=-.42*braking;keeper.rotation.z=latch.rotation.z;
      car.position.z=atZ;const yawZ=oldTravel===null?0:atZ-oldTravel;oldTravel=atZ;rollAngle+=yawZ/.051;roller0.rotation.x=roller1.rotation.x=rollAngle%TAU;
      cordStart.set(rx-.566,railY-.213,atZ);
      stand.set(cordStart.x-.063,cordStart.y-.271,atZ);if(!carrying){
        stow=clamp(stow+dt*1.26,0,1);const blend=stow*stow*(3-2*stow);goal.copy(lastGoal).lerp(stand,blend);
      }
      // Sag follows horizontal span and real body loading. The key carrier determines the endpoint even through rewind.
      const dx=goal.x-cordStart.x,dy=goal.y-cordStart.y,dz=goal.z-atZ;
      const radius=.061,ang=clamp(Math.atan2(-dx,-dy),-.66,1.25);
      const tangentAngle=Math.PI-ang,ex=cordStart.x+radius*Math.cos(tangentAngle),ey=cordStart.y+radius*Math.sin(tangentAngle);
      exit.set(ex,ey,atZ);clipDir.subVectors(exit,goal);if(clipDir.lengthSq()<1e-7)clipDir.set(0,1,0);else clipDir.normalize();connector.position.copy(goal);connector.quaternion.setFromUnitVectors(Y,clipDir);
      tip.copy(goal).addScaledVector(clipDir,.120);const span=Math.hypot(dx,dz),sag=Math.min(.16,.022+span*.033)*(1-.94*braking)*(carrying?1:1-stow);
      const distance=exit.distanceTo(tip),pay=Math.max(0,distance-.128+sag*.25);
      const remaining=clamp(wraps-pay/(TAU*RR),.60,wraps),step=Math.round(remaining*36),zWound=-.069+step/36*pitch;
      drum.rotation.z=(Math.PI/2+(wraps-remaining)*TAU)%TAU;coil.setDrawRange(0,step*around*6);
      if(oldPaid!==null)sheaveSpin+=(pay-oldPaid)/radius;oldPaid=pay;nose.rotation.z=sheaveSpin%TAU;
      if(!carrying&&stow===1&&lastNose.x===stand.x&&lastNose.z===stand.z&&previousKey===f.key){previousKey=f.key;return;}
      lastNose.copy(carrying||stow!==1?wind.set(Infinity,0,0):stand);
      // First three samples cross from the level-wound drum over the nose groove.
      wind.set(rx-.150,railY-.253+RR,atZ+zWound);
      const topOfWheel=localShoulder.set(cordStart.x,cordStart.y+radius,atZ);
      for(let j=0;j<=4;j++)samples[j].lerpVectors(wind,topOfWheel,j/4);
      for(let j=1;j<=7;j++){const a=Math.PI/2+(tangentAngle-Math.PI/2)*j/7;samples[4+j].set(cordStart.x+radius*Math.cos(a),cordStart.y+radius*Math.sin(a),atZ);}
      mid.copy(exit).lerp(tip,.50);mid.y-=2*sag;
      for(let j=1;j<=N-11;j++){const f=j/(N-11),u=1-f;samples[11+j].copy(exit).multiplyScalar(u*u).addScaledVector(mid,2*u*f).addScaledVector(tip,f*f);}
      knit();previousKey=f.key;
    }
    function attachment(out=V()){return parent.localToWorld(out.copy(goal));}
    function linePoint(distance=.24,out=V()){
      let remain=Math.max(0,distance)-.120;
      if(remain<=0)return parent.localToWorld(out.copy(goal).addScaledVector(clipDir,Math.max(0,distance)));
      for(let i=N;i>0;i--){const d=samples[i].distanceTo(samples[i-1]);if(remain<=d&&d>.000001)return parent.localToWorld(out.lerpVectors(samples[i],samples[i-1],remain/d));remain-=d;}
      return parent.localToWorld(out.copy(samples[0]));
    }
    function rung(i){return ringGroups[i]?.getWorldPosition(V())||null;}
    let disposed=false;update(g);
    return {update,attachment,linePoint,rung,dispose(){if(disposed)return;disposed=true;root.removeFromParent();root.clear();actor=null;for(const e of owned)e.dispose();owned.clear();}};
  }
  return {create};
})();
