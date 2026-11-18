// Shore-cable workshop. Fixture bases use the chapter walking surfaces.
const TideCableQuayGear=(()=>{
  const T=THREE,TAU=2*Math.PI,clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
  const v=(x=0,y=0,z=0)=>new T.Vector3(x,y,z);
  function rng(seed){return ()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}
  function create(scene,w){
    const root=new T.Group();root.name='North Cape / cable test yard';scene.add(root);
    const resources=new Set(),own=o=>(resources.add(o),o);
    const p={deep:'#31423f',marine:'#52665b',green:'#738a72',edge:'#92988a',steel:'#859090',iron:'#4a5551',oxide:'#735849',red:'#96584a',damp:'#454d43',chrome:'#c3c4aa',copper:'#c78c5a',bronze:'#a98854',ivory:'#ddcfab',black:'#323731',gap:'#242e2c',amber:'#cfa45d'};
    function map(w,h,draw){
      const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);
      const m=own(new T.CanvasTexture(c));m.colorSpace=T.SRGBColorSpace;m.anisotropy=4;return m;
    }
    const grain=map(256,256,(c,w,h)=>{
      const r=rng(923);c.fillStyle='#e8e7df';c.fillRect(0,0,w,h);
      for(let i=0;i<15500;i++){c.fillStyle=r()>.43?'rgba(80,76,63,.11)':'rgba(255,254,240,.29)';c.fillRect(r()*w,r()*h,.6+r()**2*13,.55+r()*.70);}
    });grain.wrapS=grain.wrapT=T.RepeatWrapping;
    const metal=own(new T.MeshStandardMaterial({color:0xffffff,map:grain,vertexColors:true,metalness:.44,roughness:.45}));
    const dull=own(new T.MeshStandardMaterial({color:0xffffff,map:grain,vertexColors:true,metalness:.23,roughness:.65}));
    const cube=own(new T.BoxGeometry(1,1,1)),cyl=own(new T.CylinderGeometry(1,1,1,24)),hex=own(new T.CylinderGeometry(1,1,1,6));
    const torusCache=new Map(),repeatGeo=new Map(),templates=new Set();
    const tmp=new T.Object3D(),color=new T.Color(),local=v(),normal=v(),up=v(0,1,0);
    function group(par,x,y,z,name){
      const g=new T.Group();g.name=name;g.position.set(x,y,z);par.add(g);return g;
    }
    function batch(par,x,y,z,name){const g=group(par,x,y,z,name);const o={g,mats:new Map()};templates.add(o);return o;}
    function part(o,geo,tint,pos,size=[1,1,1],rot=[0,0,0],material=metal,quat=null){
      if(!repeatGeo.has(geo))repeatGeo.set(geo,geo.index?own(geo.toNonIndexed()):geo);
      if(!o.mats.has(material))o.mats.set(material,{p:[],n:[],c:[],uv:[]});
      const a=repeatGeo.get(geo).attributes,b=o.mats.get(material);
      tmp.position.set(...pos);tmp.scale.set(...size);
      if(quat)tmp.quaternion.copy(quat);else tmp.rotation.set(...rot);
      tmp.updateMatrix();const nm=new T.Matrix3().getNormalMatrix(tmp.matrix);color.set(tint);
      for(let i=0;i<a.position.count;i++){
        local.fromBufferAttribute(a.position,i).applyMatrix4(tmp.matrix);normal.fromBufferAttribute(a.normal,i).applyNormalMatrix(nm);
        b.p.push(local.x,local.y,local.z);b.n.push(normal.x,normal.y,normal.z);b.c.push(color.r,color.g,color.b);
        const nx=Math.abs(normal.x),ny=Math.abs(normal.y),nz=Math.abs(normal.z);
        if(nz>nx&&nz>ny)b.uv.push(local.x*1.9,local.y*1.9);else if(ny>nx)b.uv.push(local.x*1.9,local.z*1.9);else b.uv.push(local.z*1.9,local.y*1.9);
      }
    }
    function finish(o){
      for(const [mat,b] of o.mats){
        const g=own(new T.BufferGeometry());for(const [key,ar,s] of [['position',b.p,3],['normal',b.n,3],['color',b.c,3],['uv',b.uv,2]])g.setAttribute(key,new T.Float32BufferAttribute(ar,s));
        g.computeBoundingSphere();const m=new T.Mesh(g,mat);m.castShadow=true;m.receiveShadow=true;o.g.add(m);
      }o.mats.clear();return o.g;
    }
    const block=(o,pos,w,h,d,c,rx=0,ry=0,rz=0,mat=metal)=>part(o,cube,c,pos,[w,h,d],[rx,ry,rz],mat);
    const disc=(o,pos,r,h,c,axis='z',sides=cyl)=>part(o,sides,c,pos,[r,h,r],axis==='y'?[0,0,0]:axis==='x'?[0,0,Math.PI*.5]:[Math.PI*.5,0,0]);
    function ring(o,pos,r,t,c,rx=0,ry=0){
      const key=r+'-'+t;if(!torusCache.has(key))torusCache.set(key,own(new T.TorusGeometry(r,t,6,r>.17?48:24)));
      part(o,torusCache.get(key),c,pos,[1,1,1],[rx,ry,0]);
    }
    function rod(o,a,b,r,c,mat=metal){
      const d=v(...b).sub(v(...a)),l=d.length(),q=new T.Quaternion().setFromUnitVectors(up,d.normalize());
      part(o,hex,c,v(...a).lerp(v(...b),.5).toArray(),[r,l,r],[0,0,0],mat,q);
    }
    function hose(o,pts,r,c,n=32){
      const g=own(new T.TubeGeometry(new T.CatmullRomCurve3(pts.map(q=>v(...q))),n,r,7,false));part(o,g,c,[0,0,0]);
    }
    function shape(w,h,rad){
      const s=new T.Shape(),x=w*.5,y=h*.5,r=Math.min(x,y,rad);
      s.moveTo(-x+r,-y);s.lineTo(x-r,-y);s.quadraticCurveTo(x,-y,x,-y+r);s.lineTo(x,y-r);s.quadraticCurveTo(x,y,x-r,y);
      s.lineTo(-x+r,y);s.quadraticCurveTo(-x,y,-x,y-r);s.lineTo(-x,-y+r);s.quadraticCurveTo(-x,-y,-x+r,-y);s.closePath();return s;
    }
    function plate(o,pos,w,h,d,r,c){
      const geo=own(new T.ExtrudeGeometry(shape(w,h,r),{depth:d,bevelEnabled:true,bevelSegments:1,bevelSize:Math.min(.005,r/3),bevelThickness:Math.min(.005,r/3),curveSegments:4}));
      part(o,geo,c,pos);
    }
    function bolt(o,x,y,z,size=.018,axis='z'){
      disc(o,[x,y,z],size*1.31,.006,p.iron,axis);const q=[x,y,z];q[axis==='z'?2:axis==='x'?0:1]+=.006;disc(o,q,size,.014,p.chrome,axis,hex);
    }
    function boltGrid(o,x,y,z,w,h,r=.012){for(const a of [-1,1])for(const b of [-1,1])bolt(o,x+a*w*.5,y+b*h*.5,z,r);}
    function texPlane(g,x,y,z,w,h,tx,opts={}){
      const mat=own(new T.MeshStandardMaterial({map:tx,roughness:.52,metalness:.23,...opts}));
      const m=new T.Mesh(own(new T.PlaneGeometry(w,h)),mat);m.position.set(x,y,z);m.receiveShadow=true;g.add(m);return m;
    }
    const glaze=own(new T.MeshPhysicalMaterial({color:0xffffff,vertexColors:true,map:grain,roughness:.32,metalness:.035,clearcoat:.56,clearcoatRoughness:.27}));
    const ceramic='#c7ccb3',salt='#e3dec4',bakelite='#4c3e31',mahogany='#80583e',turquoise='#80aa99';
    const sphere=own(new T.SphereGeometry(1,20,12));
    const pin=(o,pos,r,len,c,axis='z')=>disc(o,pos,r,len,c,axis,hex);
    function lathe(o,pos,profile,col,axis='y',m=glaze){
      const points=profile.map(([r,h])=>new T.Vector2(r,h));
      const geo=own(new T.LatheGeometry(points,30));
      part(o,geo,col,pos,[1,1,1],axis==='y'?[0,0,0]:axis==='x'?[0,0,-Math.PI/2]:[Math.PI/2,0,0],m);
    }
    function cast(o,s,col,pos,depth=.014,bevel=.002){
      const g=own(new T.ExtrudeGeometry(s,{depth,bevelEnabled:bevel>0,bevelSize:bevel,bevelThickness:bevel,bevelSegments:1,curveSegments:19}));part(o,g,col,pos);return g;
    }
    function dielectric(o,pos,scale=1,col=ceramic,axis='y'){
      const pp=[[.040,0],[.054,.004],[.063,.015],[.064,.023],[.047,.033],[.040,.059],[.062,.061],[.074,.071],[.075,.083],[.049,.096],[.041,.114],[.059,.118],[.060,.13],[.040,.144],[.029,.150]];
      lathe(o,pos,pp.map(([r,y])=>[r*scale,y*scale]),col,axis);
    }
    function mark(main,sub,bg='#48554c',fg='#e2d7b4'){
      return map(480,130,(c,w,h)=>{
        const r=rng(main.length*409+sub.length*3);c.fillStyle=bg;c.fillRect(0,0,w,h);
        c.strokeStyle=fg;c.lineWidth=2;c.strokeRect(5,5,w-10,h-10);c.fillStyle=fg;c.font='bold 37px Arial, sans-serif';c.fillText(main,23,54,w-46);
        c.font='21px monospace';c.fillText(sub,24,94,w-48);
        for(let i=0;i<1500;i++){c.fillStyle=i%3?'rgba(31,38,31,.085)':'rgba(243,238,206,.12)';c.fillRect(r()*w,r()*h,1+r()*2,.8);}
        for(const x of [11,w-11])for(const y of [12,h-12]){c.beginPath();c.fillStyle='#c4bca1';c.arc(x,y,3.3,0,TAU);c.fill();}
      });
    }
    function bail(o,x,y,z,width=.16){
      const a=x-width*.5,b=x+width*.5;
      for(const x0 of [a,b]){disc(o,[x0,y,z-.042],.021,.041,p.bronze);rod(o,[x0,y,z-.043],[x0,y,z+.042],.013,p.chrome);}
      rod(o,[a,y,z+.046],[b,y,z+.046],.018,p.edge);
    }
    function footStand(o,wide,depth,top,front=.10){
      const rear=front-depth,cz=(rear+front)*.5;
      block(o,[0,top-.033,cz],wide,.067,depth,p.marine);block(o,[0,top-.061,front+.008],wide+.006,.024,.026,p.edge);
      for(const x of [-wide*.39,wide*.39])for(const z of [front-.069,rear+.069]){
        block(o,[x,top*.50,z],.044,top,.044,p.deep);block(o,[x,.032,z],.126,.059,.119,p.iron);bolt(o,x+.036,.066,z,.009,'y');
      }
      for(const x of [-wide*.39,wide*.39])rod(o,[x,.22,rear+.07],[x,.22,front-.07],.019,p.iron);
      rod(o,[-wide*.39,.22,rear+.07],[wide*.39,.22,rear+.07],.020,p.iron);
    }
    function lamp(o,x,y,z,rad,col,shapeY=1){
      disc(o,[x,y,z-.011],rad*1.15,.026,p.gap);ring(o,[x,y,z+.005],rad*1.02,.004,p.bronze);
      if(rad>.024){
        for(const sign of [-1,1]){
          const xx=x+sign*rad*.54;
          rod(o,[xx,y-rad*.64,z+.014],[xx,y+rad*.64,z+.014],.0018,p.chrome);
        }
      }
      const lampMat=own(new T.MeshStandardMaterial({color:col,emissive:col,emissiveIntensity:.015,roughness:.23,metalness:.10}));
      const m=new T.Mesh(sphere,lampMat);m.position.set(x,y,z+.009);m.scale.set(rad,rad*shapeY,rad*.48);o.g.add(m);
      const dim=new T.Color(col).multiplyScalar(.23),lit=new T.Color(col);
      return (value)=>{const f=clamp(Number(value)||0);lampMat.color.copy(dim).lerp(lit,.17+f*.77);lampMat.emissiveIntensity=.012+f*1.65;};
    }
    const contacts=new Map(),worldHands=new Map();
    function pair(kind,index,a,pa,b,pb){
      const key=kind+index;contacts.set(key,[a,v(...pa),b,v(...pb)]);worldHands.set(key,[v(),v()]);
    }
    // Contact telegraph. A single steel rocker bridges the spring and the brass anvil.
    const key=batch(root,-3.35,0,-2,'Portable double-lamp cable key');
    footStand(key,.94,.63,.880,.122);
    plate(key,[0,.999,-.440],.835,.220,.410,.023,mahogany);
    plate(key,[0,.997,-.033],.827,.211,.025,.022,'#715443');
    block(key,[0,1.118,-.221],.84,.028,.45,p.bronze);
    block(key,[0,1.137,-.220],.799,.016,.427,bakelite);
    for(const xx of [-.383,.383])for(const zz of [-.408,-.044])bolt(key,xx,1.150,zz,.009,'y');
    for(const x of [-.06,.18]){
      disc(key,[x,1.155,-.145],.031,.024,p.chrome,'y');rod(key,[x,1.159,-.145],[x,1.231,-.145],.014,p.bronze);
    }
    disc(key,[.055,1.229,-.145],.020,.292,p.bronze,'x');
    disc(key,[.059,1.16,.006],.027,.026,p.chrome,'y');
    const rocker=batch(key.g,.057,1.229,-.145,'Bakelite telegraph key rocker');
    block(rocker,[0,0,.033],.045,.016,.279,p.bronze);
    disc(rocker,[0,-.028,.145],.016,.052,p.chrome,'y');
    disc(rocker,[0,.023,.151],.029,.033,p.edge,'y');
    part(rocker,sphere,bakelite,[0,.042,.152],[.062,.027,.057],[0,0,0],glaze);
    pin(rocker,[0,.013,-.085],.026,.030,p.chrome,'y');
    const springPoints=[];for(let i=0;i<=77;i++){const a=i/77*TAU*6;springPoints.push([.057+Math.cos(a)*.015,1.151+.061*i/77,-.15+Math.sin(a)*.015]);}hose(key,springPoints,.0027,p.chrome,77);
    for(const x of [-.188,-.054]){
      dielectric(key,[x,1.146,-.361],.44,salt);
      rod(key,[x,1.208,-.36],[x,1.258,-.36],.007,p.copper);
    }
    plate(key,[-.092,1.234,-.425],.512,.173,.069,.018,p.deep);
    const keySend=lamp(key,-.204,1.241,-.344,.040,'#f29749');
    const keyPilot=lamp(key,.020,1.241,-.344,.040,'#78cb98');
    bail(key,-.244,1.055,.004,.159);
    texPlane(key.g,.061,.999,-.003,.447,.090,mark('岸 缆 试 验 键','K-02  /  LINE TEST', '#4a4438'));
    pair('key',0,key.g,[-.244,1.055,.05],rocker.g,[0,.064,.150]);
    // Glazed return sockets. Their actual brass inlays encode long–short, short–long and short–short.
    const postLight=[],plugs=[],returnSockets=[];
    const returnZ=[1.4,-1.2,-3.8],patterns=[[1,0],[0,1],[0,0]];
    returnZ.forEach((z,i)=>{
      const s=batch(root,3.7,2.65,z,'Shore cable return terminal '+(i+1));
      const g=s.g;footStand(s,.61,.49,.823,.106);
      plate(s,[0,.991,-.279],.541,.296,.316,.026,i===1?'#6a766b':p.marine);
      plate(s,[0,.991,.047],.525,.283,.024,.021,p.deep);
      boltGrid(s,0,.994,.080,.459,.218,.010);
      for(const x of [-.118,.117]){dielectric(s,[x,1.145,-.181],.84,i%2?ceramic:salt);disc(s,[x,1.281,-.181],.026,.031,p.bronze,'y',hex);}
      rod(s,[-.118,1.291,-.18],[.118,1.291,-.18],.009,p.copper);
      ring(s,[0,1.017,.077],.070,.010,p.bronze);disc(s,[0,1.017,.077],.056,.023,p.gap);
      const plug=batch(g,0,1.017,.121,'Terminal latching banana plug');
      disc(plug,[0,0,-.021],.024,.095,p.chrome);disc(plug,[0,0,.049],.036,.078,i===1?p.red:bakelite);
      for(let j=0;j<5;j++)ring(plug,[0,0,.022+j*.012],.036,.0027,p.bronze);
      disc(plug,[0,0,.095],.020,.018,p.copper);
      plugs.push(plug);returnSockets.push(g);
      postLight.push(lamp(s,.161,1.034,.082,.031,'#97dfa8'));
      bail(s,-.163,.958,.093,.079);
      const serial=String(i+1).padStart(2,'0');
      texPlane(g,-.042,.898,.081,.266,.056,mark('回 线  '+serial,'RETURN   /   '+serial));
      const lengths=patterns[i].map(n=>n?.095:.031),width=lengths[0]+lengths[1]+.040;let x=-width*.5;
      for(const len of lengths){block(s,[x+len*.5,1.095,.084],len,.019,.008,p.amber);x+=len+.04;}
      pair('post',i,g,[-.163,.958,.139],plug.g,[0,0,.069]);
    });
    // Cable drum has pierced cast flanges, a moving layer of wound cable and a physical fairlead.
    const drum=batch(root,3.3,2.65,-11.2,'Payoff drum and brass level-wind');
    const axleY=.967;
    for(const zz of [-.26,.204]){
      for(const x of [-.298,.298]){
        block(drum,[x,.032,zz],.181,.060,.132,p.iron);bolt(drum,x+.054,.067,zz,.014,'y');
        rod(drum,[x,.063,zz],[x*.28,axleY,zz],.040,p.marine);
      }
      rod(drum,[-.29,.291,zz],[.29,.291,zz],.026,p.deep);
    }
    disc(drum,[0,axleY,-.300],.062,.145,p.chrome);disc(drum,[0,axleY,.188],.061,.109,p.chrome);
    const wheel=batch(drum.g,0,axleY,-.036,'Copper cable reel and hand crank');
    const flange=new T.Shape();flange.absarc(0,0,.349,0,TAU,false);
    for(let j=0;j<5;j++){
      const a=j*TAU/5+.20,start=a-.446,end=a+.446,inner=.105,outer=.284;
      const h=new T.Path();h.moveTo(Math.cos(start+.17)*inner,Math.sin(start+.17)*inner);
      h.lineTo(Math.cos(start)*outer,Math.sin(start)*outer);h.absarc(0,0,outer,start,end,false);
      h.lineTo(Math.cos(end-.17)*inner,Math.sin(end-.17)*inner);h.absarc(0,0,inner,end-.17,start+.17,true);h.closePath();flange.holes.push(h);
    }
    cast(wheel,flange,p.green,[0,0,-.171],.013,.003);
    cast(wheel,flange,'#8d8a72',[0,0,.147],.013,.003);
    for(const zz of [-.174,.164]){
      ring(wheel,[0,0,zz],.331,.006,p.edge);ring(wheel,[0,0,zz],.089,.007,p.chrome);
    }
    disc(wheel,[0,0,0],.090,.342,p.iron);disc(wheel,[0,0,.177],.064,.056,p.bronze);
    rod(wheel,[0,0,.21],[.154,.086,.220],.022,p.chrome);disc(wheel,[.154,.086,.264],.016,.100,p.chrome);
    disc(wheel,[.154,.086,.302],.031,.079,bakelite);ring(wheel,[.154,.086,.338],.029,.003,p.bronze);
    for(let j=0;j<5;j++){const a=j*TAU/5+1.05;bolt(wheel,Math.cos(a)*.300,Math.sin(a)*.300,.163,.008);}
    const pack=batch(drum.g,0,axleY,-.036,'Wound service cable');
    disc(pack,[0,0,0],.286,.295,'#50483b');
    const winding=[];for(let j=0;j<=288;j++){const t=j/288,a=t*TAU*14;
      winding.push([Math.cos(a)*.287,Math.sin(a)*.287,-.134+t*.270]);}
    hose(pack,winding,.009,'#806b4b',288);
    for(const x of [-.425,-.346]){
      block(drum,[x,.783,.028],.037,.307,.067,p.deep);disc(drum,[x,.917,.028],.034,.083,p.chrome,'y');
    }
    rod(drum,[-.386,.662,-.171],[-.386,.662,.070],.024,p.marine);
    bail(drum,-.245,.880,.225,.133);
    plate(drum,[.096,.552,.171],.297,.103,.026,.009,p.marine);
    texPlane(drum.g,.096,.552,.204,.270,.074,mark('手 轮 放 线','D-2  /  PAY OUT'));
    pair('drum',0,drum.g,[-.245,.880,.271],wheel.g,[.154,.086,.303]);
    // The wire rides the top of the glazed roller at local Y=.95, entering from the open eastern cheek.
    const saddles=[],saddlePos=[[-4.0,.04,-12.55],[-3.55,.41,-17.85]];
    saddlePos.forEach(([x,y,z],i)=>{
      const s=batch(root,x,y,z,'Open porcelain cable saddle '+(i+1));
      block(s,[0,.034,-.026],.374,.066,.329,p.deep);
      for(const xx of [-.128,.128])for(const zz of [-.129,.073])bolt(s,xx,.072,zz,.014,'y');
      block(s,[-.06,.414,-.033],.093,.748,.141,p.green);
      rod(s,[.115,.063,-.083],[-.050,.595,-.083],.029,p.iron);
      block(s,[-.024,.777,-.036],.291,.071,.201,p.bronze);
      dielectric(s,[-.114,.785,-.027],1.29,salt);
      const profile=[[.061,-.095],[.105,-.089],[.111,-.066],[.101,-.049],[.083,-.028],[.080,.008],[.082,.049],[.073,.078],[.060,.086]];
      lathe(s,[.015,.857,0],profile,i?'#c1c8b1':'#ddd9bc','x');
      disc(s,[.011,.857,0],.036,.212,p.bronze,'x');pin(s,[.128,.857,0],.038,.025,p.chrome,'x');
      const pivot=[-.116,1.018,.0],lever=batch(s.g,...pivot,'Swivelling cable keeper');
      disc(lever,[0,0,.032],.034,.088,p.bronze);rod(lever,[0,0,0],[.184,.003,0],.016,p.chrome);
      rod(lever,[.184,.003,0],[.184,-.073,0],.015,p.chrome);
      rod(lever,[.156,.003,.004],[.177,.005,.120],.010,p.bronze);
      disc(lever,[.183,.006,.165],.024,.099,i?p.marine:bakelite);
      bail(s,-.109,.817,.136,.13);
      plate(s,[-.065,.588,.045],.180,.095,.018,.008,p.deep);
      texPlane(s.g,-.065,.588,.068,.165,.076,mark('鞍 '+(i+1),'SADDLE '+(i+1)));
      saddles.push(lever);pair('saddle',i,s.g,[-.109,.817,.182],lever.g,[.183,.006,.166]);
    });
    // A worm on each dashboard wheel turns the azimuth and elevation gimbals. The optical centre is exactly the datum.
    const lampStand=batch(root,-3.35,.45,-22.2,'Traversing quay service searchlight'),opticY=1.51;
    const pedestal=[[.214,0],[.241,.012],[.243,.043],[.212,.066],[.156,.085],[.122,.223],[.091,.295],[.082,.860],[.114,.910],[.163,.953],[.169,1.021]];
    lathe(lampStand,[0,0,0],pedestal,p.marine,'y',metal);
    for(let j=0;j<6;j++){const a=j*TAU/6;bolt(lampStand,Math.cos(a)*.193,.055,Math.sin(a)*.193,.018,'y');}
    for(const y of [.29,.79,.924])ring(lampStand,[0,y,0],y>.90?.147:y>.50?.085:.089,.007,p.edge,Math.PI*.5);
    disc(lampStand,[0,1.036,0],.171,.049,p.bronze,'y');
    for(let j=0;j<30;j++){const a=j*TAU/30;block(lampStand,[.155*Math.sin(a),1.063,.155*Math.cos(a)],.004,.004,j%5?.010:.023,p.ivory,0,a);}
    for(const x of [-.205,.205]){
      rod(lampStand,[x*.20,.851,0],[x,.993,.197],.031,p.deep);
      disc(lampStand,[x,.988,.207],.065,.084,p.iron);
    }
    const wheels=[];
    for(const [i,x] of [-.205,.205].entries()){
      const w0=batch(lampStand.g,x,.988,.252,'Searchlight '+(i?'traverse wheel':'elevation wheel'));
      ring(w0,[0,0,0],.085,.011,p.bronze);disc(w0,[0,0,0],.020,.036,p.chrome);
      for(let j=0;j<3;j++){const a=j*TAU/3;rod(w0,[0,0,0],[.077*Math.cos(a),.077*Math.sin(a),0],.0065,p.edge);}
      disc(w0,[.073,0,.040],.012,.072,bakelite);wheels.push(w0);
    }
    pair('lamp',0,wheels[0].g,[.073,0,.044],wheels[1].g,[.073,0,.044]);
    const yaw=batch(lampStand.g,0,opticY,0,'Searchlight azimuth cradle');
    disc(yaw,[0,-.425,0],.117,.084,p.deep,'y');
    for(const x of [-.315,.315]){
      rod(yaw,[0,-.428,-.051],[x,-.285,-.043],.036,p.marine);
      rod(yaw,[x,-.285,-.043],[x,0,-.038],.034,p.edge);
      disc(yaw,[x,.001,-.037],.055,.087,p.bronze,'x');pin(yaw,[x+(x>0?.047:-.047),.001,-.037],.033,.024,p.chrome,'x');
    }
    const head=batch(yaw.g,0,0,0,'Tilting enameled searchlight shell');
    lathe(head,[0,0,0],[[.107,-.424],[.169,-.415],[.211,-.363],[.261,-.275],[.281,-.206],[.283,-.041],[.3,-.029],[.300,-.013]],p.green,'z',metal);
    disc(head,[0,0,-.414],.117,.043,p.deep);disc(head,[0,0,-.440],.079,.019,p.edge);
    for(const r0 of [.040,.059])ring(head,[0,0,-.455],r0,.003,p.iron);
    for(let k=0;k<8;k++){
      const a=k*TAU/8;
      rod(head,[.208*Math.cos(a),.208*Math.sin(a),-.354],[.281*Math.cos(a),.281*Math.sin(a),-.216],.008,p.edge);
      rod(head,[.281*Math.cos(a),.281*Math.sin(a),-.216],[.281*Math.cos(a),.281*Math.sin(a),-.059],.007,p.edge);
    }
    ring(head,[0,0,-.012],.291,.012,p.bronze);ring(head,[0,0,.002],.282,.009,p.deep);
    const opticSkin=map(480,480,(c,w,h)=>{
      const q=w*.5,rad=c.createRadialGradient(q*.82,q*.68,1,q,q,q);
      rad.addColorStop(0,'#f5e8bc');rad.addColorStop(.14,'#c4c8b4');rad.addColorStop(.30,'#95aa9c');rad.addColorStop(.62,'#b5ba9e');rad.addColorStop(.95,'#687d72');rad.addColorStop(1,'#374c44');
      c.fillStyle=rad;c.fillRect(0,0,w,h);
      for(let i=15;i<q;i+=7){c.beginPath();c.strokeStyle='rgba(59,73,61,.62)';c.lineWidth=1.8;c.arc(q,q,i,0,TAU);c.stroke();c.beginPath();c.strokeStyle='rgba(243,235,191,.52)';c.lineWidth=1.2;c.arc(q,q,i+2,0,TAU);c.stroke();}
      for(let i=0;i<24;i++){const a=i*TAU/24;c.beginPath();c.moveTo(q+Math.cos(a)*67,q+Math.sin(a)*67);c.lineTo(q+Math.cos(a+.024)*231,q+Math.sin(a+.024)*231);c.strokeStyle='rgba(85,93,72,.20)';c.lineWidth=1;c.stroke();}
    });
    const opticMat=own(new T.MeshStandardMaterial({map:opticSkin,emissive:'#ead196',emissiveMap:opticSkin,emissiveIntensity:.45,roughness:.23,metalness:.41}));
    const front=new T.Mesh(own(new T.CircleGeometry(.276,72)),opticMat);front.position.z=.001;head.g.add(front);
    for(const x of [-.145,0,.145]){const y=Math.sqrt(.275**2-x*x);rod(head,[x,-y,.018],[x,y,.018],.0047,p.iron);}
    for(const y of [-.13,.13]){const x=Math.sqrt(.275**2-y*y);rod(head,[-x,y,.022],[x,y,.022],.0045,p.edge);}
    for(const a of [0,Math.PI*.5,Math.PI,Math.PI*1.5]){const x=Math.cos(a)*.29,y=Math.sin(a)*.29;bolt(head,x,y,-.011,.010);}
    // A translucent diffuser sits between two independently cut metal faces. The ring's three bridges retain its central island.
    function apertures(k){
      const outline=shape(.49,.44,.032);
      if(k===0){
        for(let i=0;i<3;i++){
          const a=i*TAU/3+.057,b=(i+1)*TAU/3-.057,ro=.165,ri=.116,h=new T.Path();
          h.moveTo(ro*Math.cos(a),ro*Math.sin(a));h.absarc(0,0,ro,a,b,false);
          h.lineTo(ri*Math.cos(b),ri*Math.sin(b));h.absarc(0,0,ri,b,a,true);h.closePath();outline.holes.push(h);
        }
      }else if(k===1){
        for(const [i,x] of [-.084,0,.084].entries()){
          const h=new T.Path(),y=i===1?.152:.112,r=.021;
          h.moveTo(x-r,-y);h.absarc(x,-y,r,Math.PI,TAU,false);h.lineTo(x+r,y);h.absarc(x,y,r,0,Math.PI,false);h.closePath();outline.holes.push(h);
        }
      }else{
        const ro=.167,ri=.148,offset=.078;
        const xx=(ro*ro-ri*ri+offset*offset)/(2*offset),yy=Math.sqrt(ro*ro-xx*xx);
        const a=Math.atan2(yy,xx),b=Math.atan2(yy,xx-offset),h=new T.Path();
        h.moveTo(xx,yy);h.absarc(0,0,ro,a,TAU-a,false);h.absarc(offset,0,ri,-b,b,true);h.closePath();outline.holes.push(h);
      }
      return outline;
    }
    const frosting=map(282,256,(c,w,h)=>{
      const rand=rng(309),g=c.createLinearGradient(0,0,w,h);g.addColorStop(0,'#8ea99c');g.addColorStop(.46,'#e2dda8');g.addColorStop(1,'#7f9b8e');c.fillStyle=g;c.fillRect(0,0,w,h);
      for(let i=0;i<14500;i++){c.fillStyle=i%2?'rgba(255,252,204,.21)':'rgba(82,107,94,.11)';c.fillRect(rand()*w,rand()*h,rand()*1.7+.3,rand()*1.6+.3);}
      for(let i=0;i<47;i++){c.fillStyle='rgba(231,241,211,.12)';c.fillRect(i*6,0,1,h);}
    });
    const windowZ=[-24.5,-26.7,-28.9],diffusers=[],windowArms=[];
    windowZ.forEach((z,i)=>{
      const gate=batch(root,2.38,3.85,z,'Two-sided optical cable patch '+(i+1));gate.g.rotation.y=Math.PI*.5;
      for(const x of [-.238,.238]){
        block(gate,[x,-.690,0],.048,1.01,.088,p.deep);
        block(gate,[x,-1.169,-.025],.128,.057,.264,p.iron);
        bolt(gate,x,-1.134,.069,.012,'y');
        rod(gate,[x,-1.11,-.124],[x,-.693,-.021],.016,p.edge);
      }
      const plateShape=apertures(i);
      cast(gate,plateShape,p.marine,[0,0,-.035],.014,.002);
      cast(gate,plateShape,i===1?'#686d5d':p.deep,[0,0,.021],.014,.002);
      for(const x of [-.249,.249])block(gate,[x,0,0],.017,.437,.075,p.bronze);
      for(const y of [-.224,.224])block(gate,[0,y,0],.50,.017,.075,p.edge);
      for(const side of [-1,1])for(const x of [-.211,.211])for(const y of [-.18,.18])disc(gate,[x,y,.038*side],.013,.010,p.chrome,'z',hex);
      const mat=own(new T.MeshStandardMaterial({map:frosting,emissiveMap:frosting,color:'#7b9186',emissive:'#f8dca0',emissiveIntensity:.007,roughness:.38,metalness:.07,side:T.DoubleSide}));
      const diff=new T.Mesh(own(new T.PlaneGeometry(.472,.419)),mat);gate.g.add(diff);diffusers.push(mat);
      plate(gate,[0,-.327,-.052],.448,.137,.112,.017,p.marine);boltGrid(gate,0,-.327,.067,.385,.089,.008);
      bail(gate,-.131,-.324,.079,.113);
      disc(gate,[.124,-.324,.078],.053,.032,p.bronze);
      const lever=batch(gate.g,.124,-.324,.099,'Patch lug and retaining handle');
      rod(lever,[0,0,0],[.045,.064,.040],.012,p.chrome);disc(lever,[.045,.064,.071],.023,.078,i===2?p.red:bakelite);
      windowArms.push(lever);pair('window',i,gate.g,[-.131,-.324,.125],lever.g,[.045,.064,.074]);
      texPlane(gate.g,0,.246,.042,.179,.049,mark('窗 0'+(i+1),'OPTICAL  /  '+(i+1)));
    });
    // Shore transceiver: cast handset, PTT paddle, cloth helix and two separate pilot jewels.
    const radio=batch(root,3.7,2.65,-31,'Shore cable-yard radio handset');
    footStand(radio,1.13,.64,.866,.097);
    plate(radio,[0,1.073,-.516],.974,.322,.446,.035,p.green);
    plate(radio,[0,1.073,-.067],.950,.292,.027,.026,p.deep);
    for(const zz of [-.077,-.462])block(radio,[0,1.239,zz],.951,.013,.034,p.edge);
    boltGrid(radio,0,1.070,-.029,.864,.220,.011);
    for(let j=0;j<7;j++)block(radio,[.304,1.104+j*.014,-.028],.155,.006,.007,p.gap);
    const dialMap=map(600,150,(c,w,h)=>{
      const g=c.createLinearGradient(0,0,0,h);g.addColorStop(0,'#738171');g.addColorStop(.54,'#9ea895');g.addColorStop(1,'#69796b');c.fillStyle=g;c.fillRect(0,0,w,h);
      c.strokeStyle='#384d43';c.lineWidth=2;c.strokeRect(2,2,w-4,h-4);c.textAlign='center';
      for(let j=0;j<46;j++){const x=39+j*11.7;c.fillStyle='#394b3e';c.fillRect(x,59,2,j%5?14:29);
        if(j%5===0){c.font='17px monospace';c.fillText((2+j*.05).toFixed(2),x,49);}}
      c.fillStyle='#42594b';c.font='15px monospace';c.fillText('NORTH CAPE   /   HARBOUR BAND',w/2,121);
      c.fillStyle='#a75c3b';c.fillRect(281,21,3,80);
    });
    plate(radio,[-.080,1.137,-.025],.358,.099,.013,.009,p.bronze);
    const tuning=texPlane(radio.g,-.080,1.137,-.002,.337,.080,dialMap,{emissive:0x293324,emissiveIntensity:.1});tuning.material.emissiveMap=dialMap;
    texPlane(radio.g,-.065,.983,-.028,.298,.061,mark('港 务 岸 台','SHORE   /  TR-9'));
    const txLamp=lamp(radio,-.075,1.053,-.024,.017,'#e4a16e'),rxLamp=lamp(radio,-.014,1.053,-.024,.017,'#9bcca5');
    for(const x of [.155,.284]){
      disc(radio,[x,1.009,-.025],.041,.032,p.bronze);disc(radio,[x,1.009,.005],.033,.041,bakelite);
      block(radio,[x,1.027,.028],.003,.019,.003,p.ivory);
    }
    const handset=batch(radio.g,-.366,1.086,.052,'Handset and press-to-talk paddle');
    for(const y of [-.092,.109]){
      rod(radio,[-.366,1.086+y,-.047],[-.366,1.086+y,.033],.020,p.bronze);
      for(const x of [-.411,-.318])rod(radio,[x,1.086+y,-.002],[x,1.086+y,.057],.011,p.chrome);
    }
    const neck=[[-.016,-.086,0],[-.015,-.068,.026],[-.011,-.03,.038],[.001,.052,.040],[.011,.091,.030],[.015,.122,.007]];
    hose(handset,neck,.027,bakelite,22);
    for(const [i,y] of [-.103,.125].entries()){
      const x=i?.014:-.014;
      lathe(handset,[x,y,-.007],[[.025,-.021],[.036,-.010],[.047,.010],[.051,.027],[.049,.038],[.039,.043]],bakelite,'z',glaze);
      for(const rr of [.020,.035])ring(handset,[x,y,.038],rr,.0018,p.edge);
      for(let j=0;j<8;j++){const a=j*TAU/8;disc(handset,[x+Math.cos(a)*.023,y+Math.sin(a)*.023,.041],.0023,.004,p.gap);}
    }
    const ptt=batch(handset.g,-.006,.011,.063,'Transmit contact');block(ptt,[0,0,0],.028,.066,.018,p.bronze,0,0,-.05);
    const spiral=[];for(let j=0;j<=120;j++){
      const t=j/120,a=t*TAU*9;
      spiral.push([-.389+.123*t+.012*Math.cos(a),.982-.139*Math.sin(t*Math.PI)+.009*Math.sin(a),.058+.034*Math.sin(Math.PI*t)]);
    }hose(radio,spiral,.0045,p.black,120);
    const jumper=new T.Mesh(own(new T.CylinderGeometry(.005,.005,1,8)),own(new T.MeshStandardMaterial({color:p.black,roughness:.66})));
    radio.g.add(jumper);const coilEnd=v(-.377,.982,.058),tailEnd=v(),jumpDirection=v();
    bail(radio,.278,1.074,.035,.150);
    // The left hand closes the talk paddle, the right hand steadies the cabinet.
    pair('mic',0,ptt.g,[0,0,.012],radio.g,[.278,1.074,.081]);
    for(const o of templates)finish(o);templates.clear();
    // Primitive and de-indexed construction meshes have been copied into finished spatial batches.
    for(const [source,plain] of repeatGeo){
      for(const geo of [source,plain])if(geo!==sphere&&resources.delete(geo))geo.dispose();
    }
    torusCache.clear();repeatGeo.clear();
    const target=v(),localCentre=v(0,opticY,0);
    const minPayout=1.4,payoutRange=13.6,maxR=.286,coreR=.119,area=maxR**2-coreR**2;
    function update(s={}){
      const pressed=!!s.down;
      rocker.g.rotation.x=pressed?.136:-.072;keySend(pressed?1:0);keyPilot(s.pilot);
      for(let i=0;i<3;i++){
        postLight[i](s.returns?.[i]);const latched=s.route===i;
        plugs[i].g.position.z=latched?.091:.157;plugs[i].g.rotation.z=latched?.58:0;
      }
      const payout=clamp((Number(s.payout)||minPayout)-minPayout,0,payoutRange);
      const r=Math.sqrt(maxR*maxR-payout/payoutRange*area),ang=2*payoutRange*(maxR-r)/area;
      wheel.g.rotation.z=ang;pack.g.scale.set(r/maxR,r/maxR,1);pack.g.rotation.z=ang;
      for(let i=0;i<2;i++)saddles[i].g.rotation.z=(s.hooks??0)>i?-.03:1.065;
      const beam=s.beam;
      if(Array.isArray(beam)&&beam.length>=3)target.fromArray(beam);
      else if(beam&&Number.isFinite(beam.x))target.copy(beam);
      else target.set(2.38,3.85,-24.5);
      lampStand.g.updateWorldMatrix(true,false);lampStand.g.worldToLocal(target);target.sub(localCentre);
      const bearing=Math.atan2(target.x,target.z),elevation=Math.atan2(target.y,Math.hypot(target.x,target.z));
      yaw.g.rotation.y=bearing;head.g.rotation.x=-elevation;
      wheels[0].g.rotation.z=elevation*4.1+.6;wheels[1].g.rotation.z=-bearing*1.86-.2;
      const brightest=Math.max(0,...(s.windows||[0,0,0]));
      opticMat.emissiveIntensity=.65+.45*clamp(brightest);
      for(let i=0;i<3;i++){
        const amt=clamp(Number(s.windows?.[i])||0);
        diffusers[i].emissiveIntensity=.016+amt*2.7;
        diffusers[i].color.setRGB(.19+amt*.64,.26+amt*.47,.22+amt*.31);
        windowArms[i].g.rotation.z=s.patched===i?-.98-(s.backLight ? .20 : 0):.19;
      }
      const lift=clamp(Number(s.handsetLift)||0,0,1);
      handset.g.position.set(-.366+.211*lift,1.086+.349*lift,.052+.425*lift);
      handset.g.rotation.set(.09*lift,.93*lift,-.18*lift);ptt.g.position.z=s.tx?.054:.063;
      handset.g.updateMatrix();tailEnd.set(-.013,-.109,.007).applyMatrix4(handset.g.matrix);
      jumpDirection.subVectors(tailEnd,coilEnd);jumper.scale.y=Math.max(.001,jumpDirection.length());
      jumper.position.copy(tailEnd).lerp(coilEnd,.5);jumper.quaternion.setFromUnitVectors(up,jumpDirection.normalize());
      txLamp(s.tx?1:0);rxLamp(s.rx?1:0);tuning.material.emissiveIntensity=s.power?.84:.12;
    }
    function hands(kind,index=0){
      const key=kind+(Number.isInteger(index)?index:0),c=contacts.get(key);if(!c)return [];
      const out=worldHands.get(key);for(let i=0;i<2;i++){const g=c[i*2];g.updateWorldMatrix(true,false);out[i].copy(c[i*2+1]).applyMatrix4(g.matrixWorld);}
      return out;
    }
    function dispose(){root.removeFromParent();root.clear();resources.forEach(r=>r.dispose());resources.clear();contacts.clear();worldHands.clear();}
    update();return {update,hands,dispose};
  }
  return {create};
})();
if(typeof window!=='undefined')window.TideCableQuayGear=TideCableQuayGear;
