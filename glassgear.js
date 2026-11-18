// Coastal archive flat-file cabinet, detachable cradle and twin-handle delivery cart.
const TideGlassGear=(()=>{
  const T=THREE,TAU=2*Math.PI,clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
  const v=(x=0,y=0,z=0)=>new T.Vector3(x,y,z);
  function rng(seed){return ()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}
  function create(parent){
    const root=new T.Group();root.name='North Cape / plan archive';parent.add(root);
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
    const teak='#765941',darkWood='#55483a',brass='#b7915d',bronze='#997c53',chrome='#bcb8a0',shell='#52665a',verdigris='#718577',ink='#38463d',vellum='#e0d5b5',umber='#a57850';
    const pearl=own(new T.MeshStandardMaterial({color:0xffffff,vertexColors:true,map:grain,metalness:.09,roughness:.44}));
    const sphere=own(new T.SphereGeometry(1,18,10)),parts=new Map(),handCache=new Map();
    function grips(kind,index,g0,p0,g1,p1){const k=kind+index;parts.set(k,[g0,v(...p0),g1,v(...p1)]);handCache.set(k,[v(),v()]);}
    function cast(o,s,pos,d,c,b=.002){part(o,own(new T.ExtrudeGeometry(s,{depth:d,bevelEnabled:b>0,bevelSize:b,bevelThickness:b,bevelSegments:1,curveSegments:17})),c,pos);}
    function oval(o,pos,r,c){part(o,sphere,c,pos,r,[0,0,0],pearl);}
    function roller(o,pos,r,h,c,axis='x'){disc(o,pos,r,h,c,axis);disc(o,pos,r*.38,h+.016,chrome,axis,hex);}
    function timber(seed,warm){
      return map(1024,276,(c,w,h)=>{
        const r=rng(seed),g=c.createLinearGradient(0,0,0,h);
        g.addColorStop(0,warm?'#9b7855':'#887054');g.addColorStop(.26,warm?'#8c694b':'#7d664e');g.addColorStop(.76,warm?'#9b7351':'#826a50');g.addColorStop(1,warm?'#7e6249':'#735f4a');c.fillStyle=g;c.fillRect(0,0,w,h);
        const knot=190+r()*600,cy=40+r()*145;
        for(let i=0;i<1500;i++){
          const y=r()*h,phase=r()*6.28,len=56+r()*980,start=r()*w-250,n=Math.ceil(len/9.3);
          c.lineWidth=.38+r()**2*1.65;c.strokeStyle=i%4?'rgba(57,43,29,'+(.08+r()*.21)+')':'rgba(211,181,130,'+(.08+r()*.18)+')';c.beginPath();
          for(let j=0;j<=n;j++){const x=start+j*len/n,near=Math.exp(-(((x-knot)/205)**2));const def=y+Math.sin(x*.012+phase)*1.65+Math.sin(x*.029+phase/2)*.8+11*near*Math.sin((y-cy)*.064);
            if(!j)c.moveTo(x,def);else c.lineTo(x,def);}
          c.stroke();
        }
        for(let j=0;j<8;j++){c.strokeStyle='rgba(74,52,30,'+(.11+j*.018)+')';c.lineWidth=.8;c.beginPath();c.ellipse(knot,cy,17+j*10,1.8+j*1.4,-.017,0,TAU);c.stroke();}
        for(let j=0;j<12000;j++){c.fillStyle=j%3?'rgba(53,42,29,.12)':'rgba(244,222,171,.16)';c.fillRect(r()*w,r()*h,.6+r()**2*4,.6+r());}
        const worn=c.createLinearGradient(0,0,0,h);worn.addColorStop(0,'rgba(207,176,125,.30)');worn.addColorStop(.04,'rgba(207,176,125,0)');worn.addColorStop(.94,'rgba(58,43,30,0)');worn.addColorStop(1,'rgba(58,43,30,.29)');c.fillStyle=worn;c.fillRect(0,0,w,h);
      });
    }
    const woodMaps=[timber(6142,true),timber(8564,false),timber(8832,true)];
    const woodMats=woodMaps.map(tx=>own(new T.MeshStandardMaterial({map:tx,roughness:.48,metalness:.06})));
    const unitPlane=own(new T.PlaneGeometry(1,1));
    function veneer(g,idx,x,y,z,w,h,rx=0,ry=0,rz=0){
      const panel=new T.Mesh(unitPlane,woodMats[idx%woodMats.length]);panel.position.set(x,y,z);panel.rotation.set(rx,ry,rz);panel.scale.set(w,h,1);panel.receiveShadow=true;g.add(panel);
    }
    const labelCache=new Map();
    function card(title,suffix,variant=0){
      const cacheKey=title+'|'+suffix+'|'+variant;if(labelCache.has(cacheKey))return labelCache.get(cacheKey);
      const tx=map(620,129,(c,w,h)=>{
        const colors=variant===2?['#3d5149','#d6d0ad']:variant===1?['#c7c9ac','#475c53']:['#d4c5a0','#544f3f'];
        c.fillStyle=colors[0];c.fillRect(0,0,w,h);
        const r=rng(title.length*71+suffix.length*19);for(let j=0;j<3100;j++){c.fillStyle=j%2?'rgba(81,70,48,.08)':'rgba(248,239,193,.14)';c.fillRect(r()*w,r()*h,.6+r()**2*3,.7);}
        c.strokeStyle=colors[1];c.lineWidth=2;c.strokeRect(6,6,w-12,h-12);c.textAlign='left';c.font='bold 47px sans-serif';c.fillStyle=colors[1];c.fillText(title,28,63,w-53);
        c.font='22px monospace';c.fillText(suffix,30,103,w-58);
      });labelCache.set(cacheKey,tx);return tx;
    }
    function transferTag(title,active){
      return map(570,111,(c,w,h)=>{
        c.fillStyle=active?'#7b4235':'#d5ca9f';c.fillRect(0,0,w,h);
        c.fillStyle=active?'#ead5ac':'#3e5144';c.textAlign='center';c.textBaseline='middle';
        c.font='bold '+(active?83:77)+'px serif';c.fillText(title,w*.5,h*.54,w-42);
        c.lineWidth=2;c.strokeStyle=active?'#c3a17b':'#84917d';c.strokeRect(7,6,w-14,h-12);
      });
    }
    function tagged(o,x,y,z,w,h,tx){
      plate(o,[x,y,z],w+.016,h+.016,.010,.005,bronze);
      texPlane(o.g,x,y,z+.015,w,h,tx,{metalness:.08,roughness:.64,emissive:0x14150b,emissiveIntensity:.20});
      for(const xx of [-1,1])disc(o,[x+xx*(w*.5+.001),y,z+.014],.005,.005,chrome,'z',hex);
    }
    function rest(o,x,y,z,w=.20){
      for(const a of [x-w*.5,x+w*.5]){disc(o,[a,y,z-.023],.015,.031,bronze);rod(o,[a,y,z-.018],[a,y,z+.027],.009,chrome);}
      rod(o,[x-w*.5,y,z+.031],[x+w*.5,y,z+.031],.013,brass);
    }
    function pull(o,x,y,z,width){
      const d=width*.5;for(const sx of [x-d,x+d]){plate(o,[sx,y,z],.039,.046,.010,.006,bronze);bolt(o,sx,y+.010,z+.014,.004);}
      hose(o,[[x-d,y,z+.010],[x-d,y-.011,z+.038],[x-d+.029,y-.033,z+.049],[x+d-.029,y-.033,z+.049],[x+d,y-.011,z+.038],[x+d,y,z+.010]],.009,brass,27);
    }
    // Flat-file cabinet: full-width drying drawers surround a separate, narrow transferable C3 cradle.
    const cabinet=batch(root,0,0,5.90,'Coastal chart cabinet');cabinet.g.rotation.y=Math.PI;
    for(const x of [-1.069,1.069])for(const z of [-.547,.542]){
      block(cabinet,[x,.055,z],.185,.100,.177,p.deep);block(cabinet,[x,.113,z],.142,.084,.127,darkWood);
    }
    block(cabinet,[0,.152,0],2.354,.116,1.353,darkWood);
    for(const x of [-1.153,1.153]){
      block(cabinet,[x,.803,0],.097,1.282,1.327,shell);block(cabinet,[x,.819,.667],.096,1.271,.069,darkWood);
      for(const z of [-.598,.565])block(cabinet,[x+Math.sign(x)*.052,.834,z],.019,1.251,.079,p.edge);
      for(const y of [.220,1.380]){
        block(cabinet,[x+Math.sign(x)*.055,y,-.009],.020,.061,1.244,p.marine);
        for(const z of [-.566,.532])bolt(cabinet,x+Math.sign(x)*.067,y,z,.010,'x');
      }
    }
    block(cabinet,[0,.801,-.625],2.281,1.251,.102,'#524b3c');
    block(cabinet,[0,1.440,-.005],2.432,.095,1.395,darkWood);
    veneer(cabinet.g,0,0,1.491,0,2.405,1.347,-Math.PI/2);
    veneer(cabinet.g,1,0,1.445,.696,2.393,.058);
    for(const x of [-1.182,1.182]){plate(cabinet,[x,1.441,.670],.071,.094,.032,.008,bronze);bolt(cabinet,x,1.443,.707,.009);}
    // The shadows between faces are actual recesses. The C3 slot remains open after withdrawal.
    const rows=[.260,.437,.613,.790,.966,1.143,1.319],activeRow=4;
    const labels=[['乙二','测站副卷'],['乙三','潮位录条'],['丙一','港口底图'],['丙二','水工作业'],['丙三','灯机验收原联'],['丙四','铜版底样'],['丁一','岸台附页']];
    for(let i=0;i<rows.length;i++){
      const y=rows[i];block(cabinet,[0,y-.084,-.023],2.239,.027,1.297,'#5e5241');
      block(cabinet,[0,y-.081,.663],2.254,.022,.056,i%3===0?bronze:darkWood);
      if(i===activeRow)continue;
      plate(cabinet,[0,y,.607],2.210,.147,.069,.013,i%2?darkWood:'#725d47');
      veneer(cabinet.g,i,0,y,.682,2.169,.121);
      for(const x of [-.729,.729])pull(cabinet,x,y+.012,.687,.194);
      // Smaller catalogue number plates are genuine carrier labels, not floating signage.
      tagged(cabinet,.053,y,.684,.226,.071,card(labels[i][0],labels[i][1],i%2));
    }
    tagged(cabinet,-.825,1.432,.699,.391,.063,card('北岬档案房','FLAT-FILE  /  C',2));
    for(const x of [-.914,.914]){
      plate(cabinet,[x,rows[activeRow],.596],.453,.148,.077,.012,'#79694b');
      veneer(cabinet.g,2,x,rows[activeRow],.678,.422,.126);
    }
    // Left hand station (cabinet local +X is world −X): warded barrel and turning bit, with a visible drive bolt.
    const lockX=.838,lockY=1.014,faceZ=.700;
    plate(cabinet,[lockX,lockY,.682],.283,.186,.020,.020,p.deep);
    for(const a of [-1,1])for(const b of [-1,1])bolt(cabinet,lockX+a*.115,lockY+b*.066,.710,.007);
    disc(cabinet,[lockX,lockY,.721],.070,.041,bronze);ring(cabinet,[lockX,lockY,.748],.061,.005,brass);
    const key=batch(cabinet.g,lockX,lockY,.750,'Ward cylinder and C3 release key');
    disc(key,[0,0,0],.048,.022,brass);block(key,[0,0,.013],.019,.039,.004,ink);
    block(key,[0,0,.043],.016,.018,.088,chrome);disc(key,[0,0,.091],.017,.020,bronze);
    const bow=shape(.113,.068,.017),slot=shape(.064,.029,.010);
    bow.holes.push(new T.Path(slot.getPoints(18)));cast(key,bow,[0,0,.096],.011,brass,.0016);
    disc(key,[.041,0,.110],.005,.007,chrome);
    const latch=batch(cabinet.g,.690,.996,.687,'Door-bolt witness');block(latch,[0,0,0],.072,.017,.015,bronze);
    rest(cabinet,.665,.915,.724,.124);
    grips('cabinet',0,cabinet.g,[.665,.915,.755],key.g,[.043,.009,.110]);
    // The twin receiving tongues travel through the fixed right-hand escutcheon at reduced stroke.
    plate(cabinet,[-.865,.942,.675],.416,.136,.028,.013,p.deep);
    for(const x of [-.958,-.766]){
      const b=.016;block(cabinet,[x,.946,.711],b*2,.061,.016,p.gap);bolt(cabinet,x,.902,.711,.006);
    }
    const reference=batch(cabinet.g,-1.075,1.02,.721,'Drawer height witness');
    block(cabinet,[-1.08,1.002,.706],.073,.338,.015,p.deep);
    for(let j=0;j<=14;j++)block(cabinet,[-1.070,.841+j*.0214,.720],j%2?.024:.044,.003,.006,p.edge);
    block(reference,[0,0,.017],.079,.013,.012,brass);
    const receiver=batch(cabinet.g,-.864,.952,.711,'Receiving tabs and lock travel');
    for(const x of [-.094,.094]){
      block(receiver,[x,0,.030],.023,.035,.604,p.edge);
      plate(receiver,[x,.020,.325],.084,.049,.019,.009,bronze);
      disc(receiver,[x,.020,.352],.022,.043,brass);ring(receiver,[x,.020,.377],.020,.004,chrome);
    }
    rod(receiver,[-.094,.012,.275],[.094,.012,.275],.010,p.bronze);
    // Both tabs start against the case and pull to the edge of the operators' reach.
    grips('cabinet',1,receiver.g,[-.094,.020,.351],receiver.g,[.094,.020,.351]);
    const railStage=batch(cabinet.g,0,.911,0,'Nested bronze extraction rails');
    for(const side of [-1,1]){
      const x=side*.558;
      block(cabinet,[x,.906,.005],.050,.047,1.250,p.deep);
      block(railStage,[x,.003,.058],.033,.024,1.218,chrome);
      for(const z of [-.451,.411])roller(railStage,[x,0,z],.030,.055,bronze);
    }
    const drawer=batch(cabinet.g,0,rows[activeRow],0,'Opening C3 transfer drawer');
    // Open-front carrier lets the damp bundle cross the threshold without cutting through a solid fascia.
    block(drawer,[0,-.046,.070],1.167,.031,1.156,p.marine);
    for(const x of [-.578,.578]){
      block(drawer,[x,-.008,.063],.027,.087,1.173,verdigris);block(drawer,[x,.035,.063],.027,.009,1.164,brass);
      for(const zz of [-.442,.013,.546])bolt(drawer,x,.040,zz,.006,'y');
    }
    block(drawer,[0,-.012,-.506],1.157,.077,.023,verdigris);
    block(drawer,[0,-.030,.654],1.217,.096,.074,darkWood);
    veneer(drawer.g,0,0,-.030,.696,1.197,.072);
    for(const x of [-.461,.461])roller(drawer,[x,.024,.653],.025,.144,brass);
    tagged(drawer,0,-.029,.699,.112,.070,transferTag('丙三',true));
    tagged(drawer,-.263,-.029,.699,.369,.070,transferTag('灯机验收原联',false));
    tagged(drawer,.263,-.029,.699,.369,.070,transferTag('北岬测潮手稿',false));
    for(const x of [-.528,.528])pull(drawer,x,-.025,.698,.099);
    // Stowage frame is under 1.28 × 1.10 m. Only the deliberately paired handles overhang it.
    const cart=batch(root,0,0,3.52,'Twin-grip pattern-room trolley');
    const cartTop=.893;
    for(const x of [-.548,.548])for(const z of [-.426,.426]){
      block(cart,[x,.546,z],.040,.626,.042,p.deep);
      block(cart,[x,.258,z],.084,.041,.078,verdigris);
      for(const yy of [.291,.794])bolt(cart,x,yy,z+.024,.009);
    }
    for(const z of [-.416,.416]){
      block(cart,[0,.241,z],1.151,.051,.047,p.deep);rod(cart,[-.547,.310,z],[.548,.733,z],.014,p.marine);
    }
    for(const xx of [-.549,.549]){block(cart,[xx,.243,0],.047,.050,.877,p.deep);rod(cart,[xx,.278,-.400],[xx,.518,.365],.013,p.edge);}
    block(cart,[0,cartTop-.045,0],1.220,.072,1.008,p.marine);
    block(cart,[0,cartTop-.002,0],1.207,.020,.982,darkWood);
    for(const [j,xx] of [-.390,0,.390].entries())veneer(cart.g,j,xx,cartTop+.010,0,.943,.386,-Math.PI/2,0,Math.PI/2);
    for(const xx of [-.614,.614]){block(cart,[xx,cartTop+.010,0],.032,.045,1.008,verdigris);block(cart,[xx,cartTop+.034,0],.021,.007,1.006,chrome);}
    block(cart,[0,cartTop+.001,-.500],1.220,.038,.022,verdigris);
    // The cabinet-facing edge has load rollers in place of a high obstructive sill.
    for(const x of [-.411,.411]){block(cart,[x,cartTop-.005,.476],.185,.035,.083,p.deep);roller(cart,[x,cartTop+.013,.502],.022,.122,brass);}
    for(const side of [-1,1]){
      const x=side*.790,a=x-.102,b=x+.102;
      const p0=[a,.995,.38],p1=[b,.995,.38];
      for(const xx of [a,b]){
        const inner=side*.557;
        hose(cart,[[inner,.738,.279],[inner,.809,.298],[inner+side*.035,.850,.31],[xx-side*.014,.922,.345],[xx,.986,.379]],.014,p.edge,17);
      }
      rod(cart,p0,p1,.015,chrome);rod(cart,[a+.011,.995,.38],[b-.011,.995,.38],.0225,'#4b4a3e');
      for(const xx of [a+.009,b-.009])disc(cart,[xx,.995,.380],.023,.014,brass,'x');
      const k=side<0?0:1;grips('cart',k,cart.g,[x-.070,.995,.380],cart.g,[x+.070,.995,.380]);
    }
    const bogies=[],wheelRadius=.095;
    const tire=own(new T.TorusGeometry(.077,.018,8,38));tire.rotateY(Math.PI*.5);
    for(const xx of [-.480,.480])for(const zz of [-.366,.366]){
      plate(cart,[xx,.216,zz-.036],.128,.058,.074,.010,p.iron);
      disc(cart,[xx,.221,zz],.052,.044,p.bronze,'y');
      const swivel=batch(cart.g,xx,.192,zz,'Caster swivel');
      disc(swivel,[0,-.008,0],.050,.046,p.iron,'y');
      for(const side of [-1,1]){
        rod(swivel,[side*.029,-.018,.003],[side*.039,-.094,.038],.012,chrome);
        disc(swivel,[side*.043,-.096,.035],.018,.014,brass,'x',hex);
      }
      const wheel=batch(swivel.g,0,-.096,.035,'Individually rolling caster');
      part(wheel,tire,'#3d4037',[0,0,0],[1,1,1],[0,0,0],dull);
      disc(wheel,[0,0,0],.075,.028,p.green,'x');disc(wheel,[0,0,0],.030,.055,p.bronze,'x');
      for(let j=0;j<4;j++){
        const a=j*TAU/4;rod(wheel,[.015,.023*Math.sin(a),.023*Math.cos(a)],[.015,.065*Math.sin(a+.17),.065*Math.cos(a+.17)],.005,chrome);
      }
      block(wheel,[.025,.074,0],.006,.013,.008,brass);
      bogies.push({xx,zz,swivel,wheel,head:0,angle:0,lastX:0,lastZ:0});
    }
    function paperBase(c,w,h,seed,base){
      const r=rng(seed);c.fillStyle=base;c.fillRect(0,0,w,h);
      for(let j=0;j<20500;j++){c.fillStyle=j%3?'rgba(95,85,54,.095)':'rgba(255,248,208,.23)';c.fillRect(r()*w,r()*h,.6+r()**2*3,.55+r()**3*2.8);}
      // Runnels and tide marks wick inward from the damp lower edge, following the paper fibres.
      for(let k=0;k<5;k++){
        const start=.73+k*.026;c.beginPath();for(let x=0;x<=w;x+=3){
          const y=h*(start+.055*Math.sin(x/w*7.2+.25)+.029*Math.sin(x/w*26.3)+.009*Math.cos(x/w*142));
          if(!x)c.moveTo(x,y);else c.lineTo(x,y);
        }c.lineTo(w,h);c.lineTo(0,h);c.closePath();c.fillStyle='rgba(130,112,72,.052)';c.fill();c.strokeStyle=k%2?'rgba(135,104,59,.22)':'rgba(200,182,127,.24)';c.lineWidth=k%2?1.5:2;c.stroke();
      }
      for(const frac of [.34,.675]){
        const f=c.createLinearGradient(w*(frac-.014),0,w*(frac+.014),0);f.addColorStop(0,'rgba(71,70,56,0)');f.addColorStop(.44,'rgba(100,91,68,.19)');f.addColorStop(.51,'rgba(255,250,211,.54)');f.addColorStop(1,'rgba(243,230,182,0)');c.fillStyle=f;c.fillRect(w*(frac-.015),0,w*.031,h);
      }
      const edge=c.createLinearGradient(0,0,w,0);edge.addColorStop(0,'rgba(110,93,53,.37)');edge.addColorStop(.04,'rgba(110,93,53,0)');edge.addColorStop(.94,'rgba(110,93,53,0)');edge.addColorStop(1,'rgba(117,96,54,.21)');c.fillStyle=edge;c.fillRect(0,0,w,h);
      return r;
    }
    const manuscript=map(1160,748,(c,w,h)=>{
      const rand=paperBase(c,w,h,6317,'#d8d2b0');c.fillStyle='#394e47';c.font='bold 65px serif';c.fillText('北岬测潮手稿',65,112);
      c.font='21px monospace';c.fillText('NORTH CAPE   /   SOUNDING SHEET',68,151);
      c.strokeStyle='#82897a';c.lineWidth=2;c.strokeRect(35,34,w-70,h-69);
      for(let x=55;x<w-40;x+=71){c.beginPath();c.strokeStyle='rgba(78,103,95,.37)';c.lineWidth=1;c.moveTo(x,180);c.lineTo(x,h-56);c.stroke();}
      for(let y=182;y<h-55;y+=60){c.beginPath();c.moveTo(50,y);c.lineTo(w-50,y);c.stroke();}
      for(let k=0;k<13;k++){
        c.beginPath();for(let x=42;x<=w-40;x+=4){
          const u=x/w,y=h*(.44+.104*Math.sin(u*5.8)+.045*Math.cos(u*18.2))+(k-3)*(11+6*Math.sin(u*6+k*.03));
          if(x===42)c.moveTo(x,y);else c.lineTo(x,y);
        }
        c.strokeStyle=k===3?'#586858':k%3===0?'#60776b':'#82988c';c.lineWidth=k===3?3.5:k%3===0?2.1:1.25;c.stroke();
        if(k===0){c.lineTo(w-40,183);c.lineTo(42,183);c.closePath();c.fillStyle='rgba(175,163,122,.32)';c.fill();}
      }
      c.font='italic 18px serif';c.fillStyle='#607c73';for(let j=0;j<46;j++){const x=70+rand()*(w-140),y=h*(.48+rand()*.38);c.fillText((1.4+rand()*11).toFixed(1),x,y);}
      c.strokeStyle='#9b6555';c.lineWidth=3;c.setLineDash([18,10]);c.beginPath();c.moveTo(75,h*.80);c.bezierCurveTo(316,374,735,596,w-110,h*.55);c.stroke();c.setLineDash([]);
      const x0=985,y0=126;c.strokeStyle='#5d7263';c.lineWidth=2;c.beginPath();c.arc(x0,y0,37,0,TAU);c.stroke();
      for(let k=0;k<8;k++){const a=k*Math.PI/4;c.beginPath();c.moveTo(x0,y0);c.lineTo(x0+Math.sin(a)*(k%2?24:41),y0+Math.cos(a)*(k%2?24:41));c.stroke();}
      c.font='bold 22px Georgia';c.fillStyle='#526655';c.fillText('N',x0-8,y0-44);
      c.font='21px serif';c.fillText('测点抄录　／　原稿',66,h-74);
      for(let j=0;j<3;j++){c.save();c.globalCompositeOperation='destination-out';c.beginPath();c.arc(24,204+j*179,8,0,TAU);c.fill();c.restore();}
    });
    const acceptance=map(690,765,(c,w,h)=>{
      paperBase(c,w,h,1621,'#e6ddbd');c.strokeStyle='#798572';c.lineWidth=2;c.strokeRect(26,25,w-52,h-53);
      c.fillStyle='#344d44';c.font='bold 22px monospace';c.fillText('NC / 灯机房      C–3',48,80);
      c.font='bold 61px serif';c.fillText('灯机验收原联',48,163,w-92);
      c.font='23px sans-serif';c.fillText('机房验收记录　·　原始联',52,211);c.strokeStyle='#97a38d';c.lineWidth=2;
      for(let j=0;j<5;j++){const y=257+j*80;c.beginPath();c.moveTo(47,y);c.lineTo(w-46,y);c.stroke();}
      c.beginPath();c.moveTo(230,257);c.lineTo(230,577);c.stroke();
      const data=[['项目','灯轴定位'],['运转','试转正常'],['签收','林澈'],['附页','原图同存']];
      for(let j=0;j<4;j++){c.fillStyle='#617461';c.font='28px sans-serif';c.fillText(data[j][0],65,309+j*80);c.fillStyle='#495d51';c.font='34px serif';c.fillText(data[j][1],248,309+j*80);}
      c.save();c.translate(529,638);c.rotate(-.078);c.strokeStyle='#93614c';c.lineWidth=4;c.strokeRect(-66,-26,133,53);c.fillStyle='#995f4c';c.font='bold 31px sans-serif';c.fillText('留　存',-50,12);c.restore();
      c.font='17px monospace';c.fillStyle='#71816c';c.fillText('原联编号　C / 03',53,h-62);
      for(let j=0;j<2;j++){c.save();c.globalCompositeOperation='destination-out';c.beginPath();c.arc(128+j*412,43,8,0,TAU);c.fill();c.restore();}
    });
    const bridge=batch(drawer.g,0,-.035,.286,'Two-stage brass unloading shoes');
    for(const x of [-.401,.401]){
      block(bridge,[x,0,0],.047,.024,.595,chrome);disc(bridge,[x,.014,.274],.021,.065,brass,'x');
      for(const z of [-.208,-.081,.062])block(bridge,[x,.013,z],.026,.003,.013,'#897953');
    }
    const packet=batch(root,0,0,0,'Detachable damp-chart carrier');
    block(packet,[0,.011,0],1.035,.022,.682,verdigris);
    for(const x of [-.507,.507]){
      block(packet,[x,.026,0],.018,.035,.676,p.edge);block(packet,[x,.043,.004],.025,.009,.661,chrome);
      for(const z of [-.254,.242])disc(packet,[x,.051,z],.008,.007,bronze,'y',hex);
    }
    for(const z of [-.332,.332])block(packet,[0,.029,z],1.026,.035,.016,p.marine);
    // Rolled return handles belong to the removable cradle and move with the manuscripts.
    for(const xx of [-.411,.411]){
      for(const zz of [-.295,-.235])rod(packet,[xx,.032,zz],[xx,.062,zz],.006,p.chrome);
      rod(packet,[xx,.062,-.296],[xx,.062,-.234],.007,brass);
    }
    function foldedPaper(tx,w,d,x,y,z,turn,seed,edgeColor,amplitude){
      const nx=39,nz=28,positions=[],uv=[],idx=[],rand=rng(seed),edge=new Float32Array(nx+1),side=new Float32Array(nz+1);
      for(let i=0;i<=nx;i++)edge[i]=(rand()-.5)*.003;for(let i=0;i<=nz;i++)side[i]=(rand()-.5)*.002;
      for(let j=0;j<=nz;j++)for(let i=0;i<=nx;i++){
        const u=i/nx,q=j/nz,fold1=Math.exp(-(((u-.34)/.032)**2)),fold2=Math.exp(-(((u-.675)/.026)**2));
        const diagonal=clamp((u+.85*q-1.54)*4.2),curl=(.002+.006*(.5+.5*Math.cos(q*8)))*(u**13+(1-u)**12)+(q**12)*(.004+.006*Math.sin(u*11));
        const lift=amplitude*(.009*fold1+.012*fold2+.017*diagonal**2+curl+.002*Math.sin(u*12+q*7));
        const px=(u-.5)*w+(i===0||i===nx?side[j]:0),pz=(q-.5)*d+(j===0||j===nz?edge[i]:0);
        positions.push(px,lift,pz);uv.push(u,1-q);
        if(j<nz&&i<nx){const a=j*(nx+1)+i,b=a+1,c0=a+nx+1;idx.push(a,c0,b,b,c0,c0+1);}
      }
      const geo=own(new T.BufferGeometry());geo.setIndex(idx);geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.computeVertexNormals();
      const mat=own(new T.MeshStandardMaterial({map:tx||null,color:tx?0xffffff:edgeColor,side:T.DoubleSide,alphaTest:tx ? .30 : 0,metalness:0,roughness:.59,emissive:tx?0x16160e:0x080805,emissiveIntensity:.3}));
      const sheet=new T.Mesh(geo,mat);sheet.position.set(x,y,z);sheet.rotation.y=turn;sheet.castShadow=true;sheet.receiveShadow=true;packet.g.add(sheet);return sheet;
    }
    foldedPaper(null,.855,.550,.037,.026,-.020,.005,773,'#b5ae91',.08);
    foldedPaper(null,.823,.539,.049,.029,-.026,-.023,814,'#c5b99a',.15);
    foldedPaper(manuscript,.813,.535,.058,.038,-.027,-.012,983,'#d3cdb3',1);
    foldedPaper(null,.285,.404,-.287,.047,.062,Math.PI+.099,334,'#bdad8b',.33);
    foldedPaper(acceptance,.277,.393,-.287,.052,.063,Math.PI+.095,395,'#e0d3b5',.64);
    // Archival cotton tape, a brass tension buckle and a curled end keep the chart folded.
    block(packet,[.254,.059,-.025],.024,.003,.533,'#8d9a80',0,-.035,0,dull);
    for(const xx of [.242,.266])rod(packet,[xx,.063,-.064],[xx,.063,.003],.0026,brass);
    for(const zz of [-.061,-.03,0])rod(packet,[.240,.063,zz],[.269,.063,zz],.0023,brass);
    const clip=batch(packet.g,-.383,.052,.196,'Folded file leaf spring clip');
    block(clip,[0,.005,0],.060,.008,.034,bronze);rod(clip,[-.023,.009,0],[-.020,.013,.039],.0028,chrome);
    rod(clip,[-.020,.013,.039],[.019,.014,.039],.0028,chrome);rod(clip,[.019,.014,.039],[.023,.009,.003],.0028,chrome);
    for(const o of templates)finish(o);templates.clear();
    // Only the finished spatial batches and live paper surfaces need GPU/CPU geometry after assembly.
    for(const [src,plain] of repeatGeo)for(const g of [src,plain])if(g!==unitPlane&&resources.delete(g))g.dispose();
    repeatGeo.clear();torusCache.clear();
    const num=(n,d=0)=>typeof n==='number'&&Number.isFinite(n)?n:d;
    const mix=(a,b,t)=>a+(b-a)*t,ease=t=>t*t*(3-2*t),turnDiff=(a,b)=>Math.atan2(Math.sin(a-b),Math.cos(a-b));
    const cartLen=1.155;
    let initialized=false,previousRoll=0,previousPhase='';
    function update(state={}){
      const phase=state.phase||'cabinet',open=clamp(num(state.drawer)),transfer=clamp(num(state.lift)),keyTurn=clamp(num(state.keyTurn));
      const c=state.cart||[0,3.52,0],x=num(c[0]),z=num(c[1],3.52),yaw=num(c[2]);
      cart.g.position.set(x,0,z);cart.g.rotation.y=yaw;
      key.g.rotation.z=keyTurn*1.51;latch.g.position.x=.690+keyTurn*.049;
      const ext=open*cartLen;drawer.g.position.z=ext;railStage.g.position.z=ext*.49;
      const support=clamp(num(state.support,.34+.27*open));
      reference.g.position.y=.841+.30*(.34+.27*open);
      receiver.g.position.z=.711+.166*open;receiver.g.position.y=.841+.30*support+.020*(phase==='cabinet'?transfer:0);
      bridge.g.position.z=.286+(phase==='cabinet'?ease(transfer)*.585:0);
      const co=Math.cos(yaw),si=Math.sin(yaw),roll=num(state.roll),phaseReset=phase==='cabinet'&&previousPhase&&previousPhase!=='cabinet'&&open<.02;
      for(const bogie of bogies){
        const wx=x+co*bogie.xx+si*bogie.zz,wz=z-si*bogie.xx+co*bogie.zz;
        const dx=wx-bogie.lastX,dz=wz-bogie.lastZ,dist=Math.hypot(dx,dz);
        if(initialized&&!phaseReset){
          if(dist>1e-5&&dist<1.15){
            const lx=co*dx-si*dz,lz=si*dx+co*dz,heading=Math.atan2(-lx,-lz);
            const delta=turnDiff(heading,bogie.head);bogie.head+=delta*Math.min(1,dist/.070);
            bogie.angle-=dist*Math.cos(delta)/wheelRadius;
          }else if(dist<1.15&&Math.abs(roll-previousRoll)>1e-4){bogie.angle-=clamp(roll-previousRoll,-.74,.74);}
        }else{bogie.angle=0;bogie.head=0;}
        bogie.swivel.g.rotation.y=bogie.head;bogie.wheel.g.rotation.x=bogie.angle;
        bogie.lastX=wx;bogie.lastZ=wz;
      }
      initialized=true;previousRoll=roll;previousPhase=phase;
      packet.g.visible=phase==='cabinet'||phase==='cart'||phase==='unload';
      if(phase==='cabinet'){
        const t=ease(transfer);
        packet.g.position.set(mix(0,x,t),mix(.942,cartTop+.017,t)+.155*Math.sin(t*Math.PI),mix(5.90-.130-ext,z,t));
        packet.g.rotation.order='YXZ';packet.g.rotation.y=turnDiff(yaw,0)*t;packet.g.rotation.x=.055*Math.sin(t*TAU);packet.g.rotation.z=-.018*Math.sin(t*Math.PI);
      }else if(phase==='unload'){
        const t=ease(clamp(num(state.unload)));
        packet.g.position.set(x*(1-t),mix(cartTop+.017,1.18,t)+.17*Math.sin(Math.PI*t),mix(z,-4.53,t));
        packet.g.rotation.set(1.33*t,yaw*(1-t),0,'YXZ');
      }else if(phase==='cart'){
        packet.g.position.set(x,cartTop+.017,z);packet.g.rotation.set(0,yaw,0,'YXZ');
      }
    }
    function hands(kind,index=0){
      const id=kind+(Number.isInteger(index)?index:0),point=parts.get(id);if(!point)return null;
      const result=handCache.get(id);for(let i=0;i<2;i++){const g=point[i*2];g.updateWorldMatrix(true,false);result[i].copy(point[2*i+1]).applyMatrix4(g.matrixWorld);}
      return result;
    }
    function dispose(){root.removeFromParent();root.clear();resources.forEach(q=>q.dispose());resources.clear();parts.clear();handCache.clear();labelCache.clear();}
    update();return {update,hands,dispose};
  }
  return {create};
})();
if(typeof window!=='undefined')window.TideGlassGear=TideGlassGear;
