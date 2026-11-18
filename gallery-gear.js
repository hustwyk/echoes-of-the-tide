// An exterior inspection cradle on a cast slewing rail. The walkable floor is supplied by TideGallery.
const TideGalleryGear=(()=>{
  const T=THREE,TAU=2*Math.PI,V=(x=0,y=0,z=0)=>new T.Vector3(x,y,z),up=V(0,1,0),clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  function create(scene,g){
    const world=g.world.gallery,car=world.car,center={x:14,z:-91},lampYaw=TideLantern.yaw;
    const assets=new Set(),own=o=>(assets.add(o),o),forms=new Set(),source=o=>(forms.add(o),o);
    function group(parent,x,y,z,name){const o=new T.Group();o.name=name||'';o.position.set(x,y,z);parent.add(o);return o}
    const root=group(scene,0,0,0,'塔外检修吊架'),hub=group(root,center.x,car.y,center.z,'墙圈轴承'),
      slewing=group(hub,0,0,0,'回转大齿圈'),traveller=group(root,car.x,car.y,car.z,'吊架车体'),hardware=new Map();
    const colors={cast:'#535e58',hull:'#536e6a',light:'#98a69d',edge:'#c0c1a9',raw:'#79847c',black:'#39443f',rubber:'#373c34',bronze:'#ad8252',bright:'#c6a777',oxide:'#824f39',red:'#a65b48',yellow:'#d6b16b'};
    let seed=78957;const random=()=>((seed=(1664525*seed+1013904223)>>>0)/4294967296);
    const canvas=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c};
    function texture(c,color,repeat=false){const tx=own(new T.CanvasTexture(c));if(color)tx.colorSpace=T.SRGBColorSpace;tx.anisotropy=6;if(repeat)tx.wrapS=tx.wrapT=T.RepeatWrapping;return tx}
    const grain=canvas(256,256),cr=grain.getContext('2d'),im=cr.createImageData(256,256);
    for(let j=0;j<256;j++)for(let i=0;i<256;i++){const mottling=Math.sin(i*.084+Math.cos(j*.11)*1.8)*5+Math.cos((i+j)*.14)*3;
      const v=229+mottling+random()*18;im.data.set([v,v-1,v-4,255],(j*256+i)*4)}cr.putImageData(im,0,0);
    for(let j=0;j<270;j++){const x=random()*256,y=random()*256;cr.strokeStyle=j%6?'rgba(80,68,54,.10)':'rgba(247,235,214,.30)';cr.lineWidth=.4+random();cr.beginPath();cr.moveTo(x,y);cr.lineTo(x+1+random()**2*14,y+random()*2);cr.stroke();}
    const map=texture(grain,true,true),base={vertexColors:true,map};
    // Use the local scan's normal and packed rough/metal channels on the metre-scaled UVs of the rigid batches.
    const scans=window.TideBridgeSteel?.[0],load=u=>{const tx=own(new T.TextureLoader().load(u));tx.wrapS=tx.wrapT=T.RepeatWrapping;tx.anisotropy=4;return tx};
    const nm=scans?.[1]?load(scans[1]):null,arm=scans?.[2]?load(scans[2]):null;
    const iron=own(new T.MeshStandardMaterial({...base,normalMap:nm,normalScale:new T.Vector2(.30,.30),roughnessMap:arm,roughness:.79,metalness:.54})),
      bright=own(new T.MeshStandardMaterial({...base,roughness:.37,metalness:.67})),
      soft=own(new T.MeshStandardMaterial({...base,roughness:.81,metalness:.11}));
    const printCanvas=canvas(1024,512),ink=printCanvas.getContext('2d');
    const lettering=own(new T.MeshStandardMaterial({map:texture(printCanvas,true),vertexColors:true,metalness:.33,roughness:.52}));
    function text(s,x,y,px,col,align='center'){ink.fillStyle=col;ink.textAlign=align;ink.textBaseline='middle';ink.font='600 '+px+'px sans-serif';ink.fillText(s,x,y)}
    function field(x,y,w,h,a,b){const grd=ink.createLinearGradient(x,y,x+w,y+h);grd.addColorStop(0,a);grd.addColorStop(1,b);ink.fillStyle=grd;ink.fillRect(x,y,w,h);
      for(let j=0;j<w*h/60;j++){ink.fillStyle=j%5?'rgba(27,37,32,.14)':'rgba(239,224,188,.23)';ink.fillRect(x+random()*w,y+random()*h,random()*2+.45,random()*1.2+.35)}}
    for(let k=0;k<2;k++){const y=k*125;field(0,y,492,120,'#9c8666','#766744');ink.strokeStyle='#3c4c40';ink.lineWidth=4;ink.strokeRect(8,y+8,476,104);text(k?'Ⅱ   背风台':'Ⅰ   西 台',246,y+39,34,'#29362e');text('检 修 台  回 转 手 轮',246,y+82,24,'#313e33');}
    field(0,258,492,116,'#858879','#a49a7f');text('Ⅲ  ·  折桥释放',246,295,36,'#2d3a33');text('拉起手柄   至钢鞋落座',246,341,24,'#3d453a');
    field(0,389,492,112,'#53675d','#43584f');ink.strokeStyle='#c4c5a7';ink.lineWidth=2;ink.strokeRect(8,397,475,95);text('北岬  ·  巡检吊架',246,443,39,'#d8d7b9');
    field(509,0,506,216,'#c1ba98','#8f967e');const gaugeW=496;
    for(let j=0;j<=36;j++){const x=533+(j/36)*(gaugeW-50),m=j%3===0;ink.fillStyle=j===0||j===36?'#873f2d':'#3b4b3d';ink.fillRect(x,137,m?3:1.5,m?43:21);}
    text('Ⅰ',537,98,36,'#684f35');text('Ⅱ',755,98,36,'#684f35');text('Ⅲ',974,98,36,'#684f35');text('检修台位置',754,38,26,'#364437');
    const atlasSlots={west:[0,0,492,120],middle:[0,125,492,120],latch:[0,258,492,116],name:[0,389,492,112],scale:[509,0,506,216]};
    const cube=source(new T.BoxGeometry(1,1,1)),plane=source(new T.PlaneGeometry()),cyls=new Map(),rings=new Map();
    const mat4=new T.Object3D(),N=new T.Matrix3(),P=V(),normal=V(),dir=V(),tint=new T.Color(),Q=new T.Quaternion();
    function cylinder(sides){if(!cyls.has(sides))cyls.set(sides,source(new T.CylinderGeometry(1,1,1,sides)));return cyls.get(sides)}
    function add(parent,geo,material,col,pos=[0,0,0],size=[1,1,1],rot=null,slot=null){
      if(!hardware.has(parent))hardware.set(parent,new Map());const mats=hardware.get(parent);if(!mats.has(material))mats.set(material,{p:[],n:[],c:[],uv:[],idx:[]});const b=mats.get(material),a=geo.attributes,off=b.p.length/3;
      mat4.position.fromArray(pos);mat4.scale.fromArray(size);if(rot?.isQuaternion)mat4.quaternion.copy(rot);else mat4.rotation.set(...(rot||[0,0,0]));mat4.updateMatrix();N.getNormalMatrix(mat4.matrix);tint.set(col);
      for(let j=0;j<a.position.count;j++){P.fromBufferAttribute(a.position,j).applyMatrix4(mat4.matrix);normal.fromBufferAttribute(a.normal,j).applyNormalMatrix(N);
        b.p.push(P.x,P.y,P.z);b.n.push(normal.x,normal.y,normal.z);b.c.push(tint.r,tint.g,tint.b);
        if(slot){const [x,y,w,h]=slot;b.uv.push((x+2+a.uv.getX(j)*(w-4))/1024,1-(y+2+(1-a.uv.getY(j))*(h-4))/512);}
        else{const nx=Math.abs(normal.x),ny=Math.abs(normal.y),nz=Math.abs(normal.z);if(ny>=nx&&ny>=nz)b.uv.push(P.x*1.35,P.z*1.35);else if(nz>=nx)b.uv.push(P.x*1.35,P.y*1.35);else b.uv.push(P.z*1.35,P.y*1.35);}
      }
      const ix=geo.index;for(let j=0,len=ix?.count||a.position.count;j<len;j++)b.idx.push(off+(ix?ix.getX(j):j));
    }
    const box=(o,x,y,z,w,h,d,col,mat=iron,rot=null)=>add(o,cube,mat,col,[x,y,z],[w,h,d],rot);
    const disc=(o,x,y,z,r,h,col,axis='y',mat=iron,sides=24)=>add(o,cylinder(sides),mat,col,[x,y,z],[r,h,r],axis==='z'?[Math.PI/2,0,0]:axis==='x'?[0,0,Math.PI/2]:null);
    function rod(o,a,b,r,col,mat=iron,k=12){const A=V(...a),B=V(...b);dir.subVectors(B,A);const len=dir.length();Q.setFromUnitVectors(up,dir.multiplyScalar(1/len));add(o,cylinder(k),mat,col,A.lerp(B,.5).toArray(),[r,len,r],Q);}
    function beam(o,a,b,width,depth,col,mat=iron){const A=V(...a),B=V(...b);dir.subVectors(B,A);const len=dir.length();Q.setFromUnitVectors(up,dir.multiplyScalar(1/len));add(o,cube,mat,col,A.lerp(B,.5).toArray(),[width,len,depth],Q);}
    function ring(o,x,y,z,r,t,c,mat=bright,rot=null){const key=r+'/'+t;if(!rings.has(key))rings.set(key,source(new T.TorusGeometry(r,t,8,Math.max(32,Math.ceil(r*80)))));add(o,rings.get(key),mat,c,[x,y,z],[1,1,1],rot);}
    function plate(o,x,y,z,w,h,id,angle=0){add(o,plane,lettering,0xffffff,[x,y,z],[w,h,1],[angle,0,0],atlasSlots[id]);}
    function bolt(o,x,y,z,r,axis='y',dark=false){disc(o,x,y,z,r*1.28,r*.20,colors.black,axis,iron,14);disc(o,x+(axis==='x'?r*.20:0),y+(axis==='y'?r*.20:0),z+(axis==='z'?r*.20:0),r,r*.70,dark?colors.raw:colors.bright,axis,bright,6);}
    function strips(o,profile,col,mat=iron,segments=124){
      const g=source(new T.BufferGeometry()),p=[],n=[],ix=[];
      // Distinct normals at the machined corners retain the stepped I-beam cross-section.
      for(let k=0;k<profile.length;k++){const [r,y]=profile[k],[R,Y]=profile[(k+1)%profile.length],dr=R-r,dy=Y-y,L=Math.hypot(dr,dy),base=p.length/3;
        for(let i=0;i<=segments;i++){const a=TAU*i/segments,s=Math.sin(a),c=Math.cos(a);p.push(r*s,y,r*c,R*s,Y,R*c);n.push(dy/L*s,-dr/L,dy/L*c,dy/L*s,-dr/L,dy/L*c);}
        for(let i=0;i<segments;i++){const a=base+i*2;ix.push(a,a+3,a+1,a,a+2,a+3);}}
      g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('normal',new T.Float32BufferAttribute(n,3));g.setIndex(ix);add(o,g,mat,col);
    }
    function polar(r,y,a){return [r*Math.sin(a),y,r*Math.cos(a)]}
    function radialBox(o,angle,r,y,w,h,d,c,mat=iron){box(o,Math.sin(angle)*r,y,Math.cos(angle)*r,w,h,d,c,mat,[0,angle,0]);}
    const dark=colors.black,pale=colors.edge,br=colors.bronze,silver=colors.raw,red=colors.red;
    // The static collar is bolted to the lighthouse masonry. At this gallery's elevation the masonry radius is 2.20m.
    const wallRadius=3.075-(car.y-4)*(.24/3.52),heel=Math.max(1.89,Math.min(2.52,wallRadius-.028));
    strips(hub,[[heel-.02,-.67],[heel+.11,-.67],[heel+.13,-.61],[heel+.13,-.28],[heel+.09,-.25],[heel-.02,-.25]],colors.hull);
    strips(hub,[[2.49,-.34],[2.71,-.34],[2.71,-.294],[2.63,-.294],[2.63,-.170],[2.71,-.170],[2.71,-.132],[2.49,-.132],[2.49,-.170],[2.57,-.170],[2.57,-.294],[2.49,-.294]],dark);
    strips(hub,[[2.522,-.134],[2.674,-.134],[2.674,-.123],[2.659,-.119],[2.537,-.119],[2.522,-.123]],'#a0a49a',bright);
    for(let k=0;k<25;k++){const a=TAU*k/25;radialBox(hub,a,heel+.090,-.46,.25,.41,.052,colors.hull);
      beam(hub,polar(heel+.05,-.61,a),polar(2.628,-.318,a),.066,.085,colors.raw);
      beam(hub,polar(heel+.04,-.335,a),polar(2.64,-.327,a),.093,.074,colors.hull);
      for(const t of [-.064,.064]){const pt=polar(heel+.121,-.50+t,a);rod(hub,pt,polar(heel+.140,-.50+t,a),.018,br,bright,6);}
      if(k%3===0){radialBox(hub,a,2.715,-.222,.40,.090,.012,colors.cast);for(const d of [-.13,-.052,.052,.13]){const an=a+d/2.72;rod(hub,polar(2.717,-.218,an),polar(2.733,-.218,an),.014,silver,bright,6);}}
    }
    // Gear teeth face out. The remote pinions push the annulus and its two bolted arm feet around the stationary rail.
    const toothCount=126;
    strips(slewing,[[2.658,-.555],[2.767,-.555],[2.791,-.53],[2.790,-.396],[2.762,-.383],[2.658,-.383]],'#745e47');
    for(let j=0;j<toothCount;j++){const a=TAU*j/toothCount;radialBox(slewing,a,2.797,-.470,.075,.109,.068,j%9?colors.bronze:'#827359',bright);}
    for(let j=0;j<15;j++){const a=TAU*j/15;radialBox(slewing,a,2.682,-.55,.38,.042,.19,colors.cast);if(j%3===0)radialBox(slewing,a,2.826,-.471,.060,.105,.012,colors.yellow);}
    const W=car.w,D=car.d,inner=-D*.5,outer=D*.5;
    // A see-through, two-section press-locked grating. All gripping bars are flush with the collision top.
    for(const x of [-W*.5+.047,W*.5-.047]){box(traveller,x,-.128,0,.073,.23,D+.007,colors.hull);box(traveller,x,-.246,0,.135,.029,D,colors.raw);
      box(traveller,x,-.017,0,.094,.034,D,pale,bright);}
    for(const z of [inner+.038,outer-.038]){box(traveller,0,-.110,z,W,.201,.067,colors.hull);box(traveller,0,-.211,z,W,.025,.113,silver);box(traveller,0,-.014,z,W,.027,.074,pale,bright);}
    for(const x of [-.91,0,.91])box(traveller,x,-.124,0,.091,.149,D-.08,colors.cast);
    for(let j=0;j<37;j++){const x=-W*.5+.111+(W-.222)*j/36;
      box(traveller,x,-.034,0,.021,.068,D-.12,j%5?colors.raw:'#9a9c86');
      for(const z of [-.58,-.31,.32,.59])if((j+Math.round(z*100))%4===0)box(traveller,x,-.0019,z,.021,.0035,.074,'#b5b4a0',bright);}
    for(let j=0;j<14;j++){const z=inner+.11+(D-.22)*j/13;rod(traveller,[-W*.5+.065,-.014,z],[W*.5-.065,-.014,z],.0065,'#8e9789',bright,6);}
    // Worn brass step noses highlight the open jumping edge. No rail, rod or truss intrudes into the jump volume.
    for(const x of [-.83,0,.83]){box(traveller,x,-.004,outer-.043,.51,.008,.083,colors.yellow);for(const dx of [-.215,.215])bolt(traveller,x+dx,-.001,outer-.042,.013,'y',true);}
    for(const side of [-1,1]){const x=side*(W*.5-.094);for(const z of [-.66,0,.66]){bolt(traveller,x,-.001,z,.0155);}}
    for(let j=0;j<12;j++)box(traveller,-1.14+j*.208,-.127,outer-.0005,.076,.024,.005,j%4?colors.oxide:colors.yellow,bright);
    plate(traveller,0,-.108,outer+.0003,.52,.096,'name');
    for(const x of [-.272,.272])bolt(traveller,x,-.108,outer+.0005,.014,'z');
    const wheels=[];
    for(const s of [-1,1]){
      const x=s*.66,nearZ=2.605-4.18;
      // A forked cast yoke, two flanged load wheels and opposing lower rollers brace the eccentric deck load.
      beam(traveller,[x,-.099,inner+.040],[s*.50,-.024,nearZ+.032],.132,.155,colors.hull);
      beam(traveller,[x,-.216,outer-.150],[s*.48,-.548,nearZ+.068],.092,.134,colors.cast);
      beam(traveller,[s*.51,-.019,nearZ+.018],[s*.48,-.484,nearZ+.057],.118,.128,colors.hull);
      beam(traveller,[s*1.18,-.188,inner+.17],[s*.46,-.48,nearZ+.12],.062,.085,silver);
      const angle=s*.51/2.61,realX=Math.sin(angle)*2.61,realZ=Math.cos(angle)*2.61-4.18;
      const ax=group(traveller,realX,.012,realZ,'承载轮');ax.rotation.y=angle;
      const roller=group(ax,0,0,0,'钢轮轴');wheels.push(roller);
      disc(roller,0,0,0,.131,.123,colors.raw,'z',bright,40);disc(roller,0,0,-.065,.151,.019,dark,'z',iron,40);
      disc(roller,0,0,.067,.088,.023,colors.hull,'z',iron,32);for(let k=0;k<5;k++){const a=k*TAU/5;bolt(roller,Math.sin(a)*.057,Math.cos(a)*.057,.083,.009,'z');}disc(roller,0,0,.077,.029,.051,br,'z',bright);
      box(traveller,realX,.004,realZ+.143,.190,.164,.060,colors.hull);
      for(const px of [-.069,.069])bolt(traveller,realX+px,.036,realZ+.181,.014,'z');
      disc(traveller,x,-.321,inner-.076,.075,.14,colors.raw,'x',iron,24);
    }
    beam(traveller,[-.44,-.50,-1.45],[.44,-.50,-1.45],.12,.13,colors.hull);
    // Two fixed jackshafts transmit hand-wheel effort below the decks, keeping both landing routes clear.
    const stations={},pinions=[];
    function wheelStation(key,site){
      const st=group(root,site.x,site.y,site.z,key==='west'?'西台手轮':'背风台手轮');st.rotation.y=site.yaw;
      const wz=-.49,shaftZ=-.58;
      for(const x of [-.15,.15])for(const z of [-.72,-.39]){box(st,x,.032,z,.143,.064,.145,dark);bolt(st,x,.070,z,.024);}
      box(st,0,.103,-.57,.40,.105,.41,colors.hull);box(st,0,.160,-.57,.315,.028,.324,silver);
      for(const x of [-.085,.085]){beam(st,[x*.77,.17,-.55],[x,.85,shaftZ],.091,.130,colors.hull);
        beam(st,[x*.80,.20,-.415],[x,.69,-.577],.053,.065,colors.cast);}
      box(st,0,.80,shaftZ,.230,.21,.190,colors.cast);
      disc(st,0,1.02,shaftZ,.146,.199,colors.hull,'z',iron,40);disc(st,0,1.02,-.490,.099,.041,silver,'z',bright,32);
      for(let k=0;k<8;k++){const a=k*TAU/8;bolt(st,Math.sin(a)*.117,1.02+Math.cos(a)*.117,-.474,.015,'z');}
      const wh=group(st,0,1.02,wz+.035,'带配重的铜轮');ring(wh,0,0,0,.255,.020,'#948263',bright);
      ring(wh,0,0,-.007,.255,.014,'#725f47');disc(wh,0,0,.004,.057,.064,br,'z',bright,32);
      for(let k=0;k<6;k++){const a=k*TAU/6,b=a+.18;rod(wh,[Math.sin(a)*.042,Math.cos(a)*.042,.010],[Math.sin(b)*.147,Math.cos(b)*.147,-.018],.013,colors.hull);
        rod(wh,[Math.sin(b)*.147,Math.cos(b)*.147,-.018],[Math.sin(a)*.250,Math.cos(a)*.250,-.005],.015,'#65796c');}
      box(wh,0,.255,.009,.023,.029,.025,pale,bright);disc(wh,0,0,.038,.019,.013,silver,'z',bright,6);
      // A damped linear repeater reads the true travel angle independently of the current detent and spoke.
      for(const x of [-.099,.099]){
        beam(st,[x*.62,1.095,-.661],[x*1.52,1.322,-.648],.035,.045,colors.hull);
        box(st,x*1.51,1.310,-.638,.083,.034,.066,silver);bolt(st,x*1.51,1.309,-.593,.011,'z');
      }
      rod(st,[-.092,.944,-.665],[-.160,1.345,-.658],.009,br,bright,12);
      box(st,0,1.402,-.627,.472,.191,.102,colors.hull);box(st,0,1.405,-.570,.439,.159,.017,'#8b805c',bright);
      plate(st,0,1.405,-.559,.402,.124,'scale');
      for(const x of [-.207,.207])for(const y of [1.340,1.469])bolt(st,x,y,-.558,.008,'z',true);
      const needle=group(st,0,1.404,-.551,'行程游标');box(needle,0,-.008,0,.004,.092,.004,red,bright);box(needle,0,.047,0,.017,.015,.012,br,bright);
      box(st,0,.495,-.486,.296,.090,.025,br,bright);plate(st,0,.496,-.470,.275,.071,key);
      // External brake shoes and release linkage; the fixed spring visibly relaxes as the carriage decelerates.
      const brake=group(st,.116,.786,-.555,'摩擦制动臂');
      rod(brake,[0,0,0],[.068,.107,.025],.014,br,bright);box(brake,.065,.116,.028,.067,.052,.050,'#685747',soft);
      for(let j=0;j<7;j++)disc(st,.124,.692+j*.011,-.547,.021,.0043,silver,'y',bright,12);
      const l=group(st,-.222,1.135,wz+.047,'左手轮缘'),r=group(st,.222,1.135,wz+.047,'右手轮缘');
      const Cx=site.x-Math.sin(site.yaw)*.58,Cz=site.z-Math.cos(site.yaw)*.58,az=Math.atan2(Cx-center.x,Cz-center.z),h=car.y-.474;
      const rEnd=2.98,ex=center.x+Math.sin(az)*rEnd,ez=center.z+Math.cos(az)*rEnd,under=car.y-1.065;
      disc(st,0,.060,shaftZ,.086,.145,colors.cast);rod(root,[Cx,site.y-.05,Cz],[Cx,under,Cz],.048,colors.black);
      rod(root,[Cx,under,Cz],[ex,under,ez],.038,silver,bright);
      rod(root,[ex,under,ez],[ex,h,ez],.037,silver,bright);
      for(const [x,z] of [[Cx,Cz],[ex,ez]]){disc(root,x,under,z,.089,.136,colors.cast);disc(root,x,under+.077,z,.063,.029,br,'y',bright);}
      for(const f of [.09,.49,.91]){const x=Cx+(ex-Cx)*f,z=Cz+(ez-Cz)*f;
        rod(root,[x-Math.sin(az)*.065,under,z-Math.cos(az)*.065],[x+Math.sin(az)*.065,under,z+Math.cos(az)*.065],.066,colors.hull);}
      const end=group(root,ex,h,ez,'外啮合传动');end.rotation.y=az;
      disc(end,0,.156,0,.102,.131,colors.cast);box(end,0,.196,-.109,.13,.080,.285,colors.hull);
      const gear=group(end,0,0,0,'传动小齿轮');disc(gear,0,0,0,.162,.109,br,'y',iron);
      for(let j=0;j<10;j++)radialBox(gear,j*TAU/10,.161,0,.070,.096,.057,colors.bright,bright);
      disc(gear,0,.071,0,.068,.044,colors.raw,'y',bright,6);
      stations[key]={st,wh,brake,needle,left:l,right:r};pinions.push(gear);
    }
    wheelStation('west',world.controls[0]);wheelStation('middle',world.controls[1]);
    const ls=world.latch,stand=group(root,ls.x,ls.y,ls.z,'折桥脱扣拉柄');stand.rotation.y=ls.yaw;
    for(const x of [-.14,.14])for(const z of [-.69,-.47]){box(stand,x,.031,z,.121,.062,.123,colors.cast);bolt(stand,x,.061,z,.021);}
    box(stand,0,.116,-.58,.33,.134,.32,colors.hull);box(stand,0,.437,-.607,.157,.630,.156,colors.hull);
    for(const x of [-.115,.115]){beam(stand,[x*.8,.20,-.555],[x,.767,-.63],.070,.083,silver);
      box(stand,x,.744,-.565,.068,.15,.157,colors.cast);disc(stand,x,.768,-.531,.053,.082,br,'x',bright);}
    box(stand,0,.52,-.512,.351,.116,.018,br,bright);plate(stand,0,.520,-.501,.324,.087,'latch');
    const handle=group(stand,0,.768,-.531,'折桥杠杆');for(const x of [-.086,.086])beam(handle,[x,0,0],[x,.304,.022],.039,.044,red);
    rod(handle,[-.205,.304,.022],[.205,.304,.022],.024,colors.bright,bright);
    for(const s of [-1,1])rod(handle,[s*.197,.304,.022],[s*.088,.304,.022],.029,'#655039',soft,24);
    const latchLeft=group(handle,-.145,.304,.022,'左握把'),latchRight=group(handle,.145,.304,.022,'右握把');
    const link=group(stand,.122,.717,-.626,'插销回缩');rod(link,[0,0,0],[0,-.286,-.034],.017,br,bright);
    for(let j=0;j<7;j++)disc(stand,.123,.431+j*.016,-.661,.029,.0052,silver,'y',bright,14);
    // Keep static solids material-batched within their own assembly so either eye can cull independent workstations.
    for(const [parent,mats] of hardware)for(const [mat,b] of mats){const ge=own(new T.BufferGeometry());
      for(const [name,a,s] of [['position',b.p,3],['normal',b.n,3],['color',b.c,3],['uv',b.uv,2]])ge.setAttribute(name,new T.Float32BufferAttribute(a,s));
      ge.setIndex(b.idx);ge.computeBoundingSphere();ge.computeBoundingBox();const m=new T.Mesh(ge,mat);m.castShadow=m.receiveShadow=true;parent.add(m);}
    hardware.clear();for(const v of forms)v.dispose();forms.clear();
    const out=[0,1].map(()=>[V(),V()]);const gears=[stations.west,stations.middle];
    const pose=(s,n)=>s?.turns?.[n]||0;
    function update(game){
      const s=game.gallery,f=game.world.gallery.car,angle=s?.angle??1.24;
      const heading=s?Math.atan2(f.axes?.vx??(f.x-center.x),f.axes?.vz??(f.z-center.z)):lampYaw+angle;
      const radius=s?Math.hypot(f.x-center.x,f.z-center.z):4.18;
      traveller.position.set(center.x+Math.sin(heading)*radius,f.y,center.z+Math.cos(heading)*radius);
      traveller.rotation.y=heading;hub.position.y=f.y;slewing.rotation.y=heading;
      const opening=clamp(s?.opening??1,0,1),vel=s?.velocity||0;
      for(const [i,st] of gears.entries()){
        const phase=pose(s,i),push=.43*Math.sin(phase);
        st.wh.rotation.z=-phase;st.brake.rotation.z=-.15*clamp(Math.abs(vel)*2.7,0,1);
        st.needle.position.x=-.177+clamp((angle+1.26)/2.5,0,1)*.354;pinions[i].rotation.y=-(angle+1.26)*12.6;
        for(const [side,o] of [st.left,st.right].entries()){const a=(side?1:-1)*1.12+push;
          o.position.x=.255*Math.sin(a);o.position.y=1.02+.255*Math.cos(a);}
      }
      for(const wheel of wheels)wheel.rotation.z=-(angle+1.26)*2.61/.131;
      handle.rotation.x=-.20+.77*opening;link.position.y=.717+.105*opening;
    }
    function gripsAt(kind,i=0){
      const station=stations[kind],hands=out[i]||out[0];
      const a=kind==='latch'?latchLeft:station?.left,b=kind==='latch'?latchRight:station?.right;
      if(!a||!b)return null;a.getWorldPosition(hands[0]);b.getWorldPosition(hands[1]);return hands;
    }
    function grips(game,i){const s=game.gallery;return s?.grip?.[i]?gripsAt(s.work?.[i],i):null;}
    let disposed=false;update(g);
    return {update,grips,gripsAt,dispose(){if(disposed)return;disposed=true;root.removeFromParent();root.clear();for(const a of assets)a.dispose();assets.clear();}};
  }
  return {create};
})();
