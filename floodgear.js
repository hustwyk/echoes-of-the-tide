// North Cape tidal lock. Y is the walking datum. The wet side looks down -Z.
const TideFloodGear=(()=>{
  const T=THREE,TAU=2*Math.PI,clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
  const v=(x=0,y=0,z=0)=>new T.Vector3(x,y,z);
  function rng(seed){return ()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}
  function create(parent){
    const root=new T.Group();root.name='North Cape / No. 1 floodgate';parent.add(root);
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
    const torusCache=new Map(),primitives=new Set(),templates=new Set();
    const tmp=new T.Object3D(),color=new T.Color(),local=v(),normal=v(),up=v(0,1,0);
    function group(par,x,y,z,name){
      const g=new T.Group();g.name=name;g.position.set(x,y,z);par.add(g);return g;
    }
    function batch(par,x,y,z,name){const g=group(par,x,y,z,name);const o={g,mats:new Map()};templates.add(o);return o;}
    function part(o,geo,tint,pos,size=[1,1,1],rot=[0,0,0],material=metal,quat=null){
      primitives.add(geo);
      if(!o.mats.has(material))o.mats.set(material,{p:[],n:[],c:[],uv:[],indices:[]});
      const a=geo.attributes,b=o.mats.get(material),offset=b.p.length/3;
      const index=geo.index,count=index?index.count:a.position.count;
      for(let i=0;i<count;i++)b.indices.push(offset+(index?index.getX(i):i));
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
        g.setIndex(b.indices);g.computeBoundingSphere();const m=new T.Mesh(g,mat);m.castShadow=true;m.receiveShadow=true;o.g.add(m);
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
    // Distinct paint strata, swept high-water marks and vertical oxide bleed from the upper seam.
    const bladeSkin=map(1408,1000,(c,w,h)=>{
      const r=rng(3107),grad=c.createLinearGradient(0,0,0,h);
      grad.addColorStop(0,'#705b50');grad.addColorStop(.055,'#a07860');grad.addColorStop(.27,'#8c584d');grad.addColorStop(.69,'#805247');grad.addColorStop(.79,'#5e6659');grad.addColorStop(1,'#434f47');
      c.fillStyle=grad;c.fillRect(0,0,w,h);
      for(let k=0;k<90;k++){
        const x=r()*w,y=r()*h,rz=18+r()**2*150,bl=c.createRadialGradient(x,y,0,x,y,rz);
        bl.addColorStop(0,k%2?'rgba(75,81,67,.20)':'rgba(212,166,112,.10)');bl.addColorStop(1,'rgba(89,86,64,0)');c.fillStyle=bl;c.fillRect(x-rz,y-rz,rz*2,rz*2);
      }
      for(let i=0;i<57500;i++){
        const x=r()*w,y=r()*h,t=r();c.fillStyle=t>.75?'rgba(224,194,145,.15)':t>.56?'rgba(57,57,48,.21)':'rgba(140,91,62,.20)';c.fillRect(x,y,.55+r()**2*4,.55+r()**3*5);
      }
      for(let i=0;i<1450;i++){
        const x=r()*w,y=r()*h,hh=2+r()**4*95;
        c.strokeStyle=i%4?'rgba(55,57,47,.11)':'rgba(207,157,105,.19)';c.lineWidth=.4+r()**3*2.4;
        c.beginPath();c.moveTo(x,y);c.bezierCurveTo(x+.9,y+hh*.3,x-1.4,y+hh*.6,x-.1,y+hh);c.stroke();
      }
      for(let i=0;i<5;i++){c.beginPath();for(let x=0;x<=w;x+=7){const y=h*(.78+i*.014)+Math.sin(x*.013)*5+Math.sin(x*.071)*1.7+i;if(!x)c.moveTo(x,y);else c.lineTo(x,y);}
        c.strokeStyle=i%2?'rgba(195,195,163,.21)':'rgba(62,75,60,.25)';c.lineWidth=i+1;c.stroke();}
      c.textAlign='center';c.fillStyle='rgba(222,212,176,.81)';c.font='bold 161px Arial, sans-serif';c.fillText('01',w*.50,h*.507);
      c.font='600 23px sans-serif';c.fillText('北 岬  止 水 闸',w*.50,h*.548);c.font='17px monospace';c.fillText('N. CAPE  /  SLUICE',w*.50,h*.577);
      // Scraped paint interruptions continue through the stencilled numerals.
      for(let i=0;i<630;i++){const x=w*(.418+r()*.164),y=h*(.375+r()*.205);c.fillStyle='rgba(123,84,67,.61)';c.fillRect(x,y,r()**2*5+.4,.4+r()**2*2.3);}
    });
    const portal=batch(root,0,0,-7.5,'Cast-steel guide rails and overhead winding gear');
    for(const side of [-1,1]){
      const x=side*1.957;
      block(portal,[x,3.14,0],.205,6.28,.30,p.deep);block(portal,[x,3.14,.169],.255,6.28,.047,p.marine);
      block(portal,[x+side*.117,3.14,.194],.022,6.28,.035,p.chrome);
      block(portal,[x,3.14,-.170],.244,6.28,.04,p.edge);
      for(let k=0;k<8;k++){const y=.34+k*.79;bolt(portal,x+side*.054,y,.200,.023);block(portal,[x-side*.068,y+.12,.198],.049,.20,.006,k%3?p.bronze:p.amber,0,0,side*.30);}
      for(const y of [.12,3.02,5.94]){block(portal,[x+side*.11,y,0],.31,.16,.53,p.iron);boltGrid(portal,x+side*.11,y,.276,.23,.08,.015);}
      disc(portal,[x,5.90,-.01],.29,.16,p.deep);
    }
    for(const zz of [-.17,.20])block(portal,[0,6.17,zz],4.93,.091,.15,p.edge);
    block(portal,[0,6.17,.016],4.94,.284,.079,p.marine);
    for(const x of [-2.08,-1.59,-.8,0,.8,1.59,2.08]){block(portal,[x,6.16,.04],.062,.26,.36,p.iron);bolt(portal,x,6.17,.22,.018);}
    for(const x of [-1.18,1.58,2.27]){
      disc(portal,[x,5.97,0],.237,.141,p.iron);ring(portal,[x,5.97,.078],.202,.022,p.chrome);
      for(let j=0;j<5;j++){const a=j*TAU/5;rod(portal,[x,5.97,.077],[x+Math.cos(a)*.17,5.97+Math.sin(a)*.17,.077],.016,p.edge);}
      disc(portal,[x,5.97,.093],.052,.036,p.bronze);
    }
    for(const x of [-1.18,1.58,2.27]){
      const right=x>2,arcPoints=[];
      for(let i=0;i<8;i++){const a=(right?0:Math.PI)+(right?1:-1)*Math.PI*.5*i/7;arcPoints.push([x+Math.cos(a)*.20,5.97+Math.sin(a)*.20,.014]);}
      hose(portal,arcPoints,.015,p.damp,14);
    }
    rod(portal,[-1.18,6.17,.014],[2.27,6.17,.014],.014,p.damp);
    // Paired guides keep the counterweight entirely outside the foot passage.
    for(const x of [2.19,2.75]){block(portal,[x,2.94,-.035],.045,5.84,.083,p.edge);
      for(const y of [.24,2.68,5.42]){block(portal,[x,y,-.10],.15,.075,.16,p.iron);bolt(portal,x,y,.018,.012);}}
    const blade=batch(root,0,0,-7.50,'Ribbed riveted sliding shutter');
    plate(blade,[0,1.44,-.104],3.765,2.845,.179,.025,p.red);
    const wetness=map(384,280,(c,w,h)=>{
      const r=rng(1560),g=c.createLinearGradient(0,0,0,h);
      g.addColorStop(0,'#b6b6b6');g.addColorStop(.66,'#9f9f9f');g.addColorStop(.83,'#595959');g.addColorStop(1,'#424242');c.fillStyle=g;c.fillRect(0,0,w,h);
      for(let i=0;i<290;i++){const x=r()*w,y=r()*h;c.fillStyle='rgba(39,39,39,.15)';c.fillRect(x,y,.6+r()**2*2,3+r()**3*54);}
    });wetness.colorSpace=T.NoColorSpace;
    texPlane(blade.g,0,1.441,.083,3.744,2.825,bladeSkin,{roughnessMap:wetness,roughness:.88,metalness:.31});
    for(const x of [-1.81,1.81]){block(blade,[x,1.43,.102],.079,2.83,.078,p.oxide);block(blade,[x,1.43,-.136],.080,2.83,.072,p.edge);}
    for(const y of [.22,.91,1.92,2.65]){
      block(blade,[0,y,.110],3.66,.109,.087,p.oxide);
      block(blade,[0,y+.047,.155],3.70,.028,.098,y<.5?p.damp:p.red);
      block(blade,[0,y-.059,.145],3.65,.019,.073,p.damp);
      block(blade,[0,y,-.141],3.65,.090,.097,p.iron);
      for(const x of [-1.61,-1.08,-.54,0,.54,1.08,1.61])bolt(blade,x,y,.161,.021);
    }
    for(const x of [-1.20,1.20]){
      block(blade,[x,1.46,.089],.062,2.61,.045,p.oxide);
      for(const y of [.58,1.42,2.27])bolt(blade,x,y,.124,.018);
    }
    for(const s of [-1,1])for(const zz of [-.16,.13]){
      rod(blade,[s*.67,.30,zz],[s*1.77,.83,zz],.033,p.damp);
      rod(blade,[s*1.67,1.01,zz],[s*1.17,1.84,zz],.036,p.oxide);
    }
    block(blade,[0,.048,.005],3.78,.094,.242,p.black,0,0,0,dull);
    for(const x of [-1.38,1.38]){
      plate(blade,[x,2.77,.02],.291,.27,.077,.029,p.edge);
      ring(blade,[x,2.855,.026],.065,.020,p.bronze);boltGrid(blade,x,2.75,.105,.166,.13,.020);
    }
    const counter=batch(root,2.47,0,-7.54,'Stacked cast-iron counterweight');
    for(let i=0;i<5;i++){plate(counter,[0,.097+i*.167,-.11],.462,.155,.23,.026,i===0?p.damp:i===3?p.oxide:p.iron);}
    for(const x of [-.144,.144]){rod(counter,[x,.025,.14],[x,.86,.14],.019,p.bronze);disc(counter,[x,.884,.14],.040,.032,p.chrome,'y',hex);}
    ring(counter,[0,.881,0],.078,.024,p.bronze);
    disc(counter,[.234,.217,-.014],.061,.043,p.bronze,'x');disc(counter,[.258,.217,-.014],.043,.007,p.gap,'x');
    const ct=map(370,112,(c,w,h)=>{c.fillStyle='#535b51';c.fillRect(0,0,w,h);c.strokeStyle='#a69e80';c.strokeRect(5,5,w-10,h-10);
      c.font='bold 43px monospace';c.fillStyle='#c4b999';c.textAlign='center';c.fillText('C.W.  240 kg',w*.5,73);});
    texPlane(counter.g,0,.427,.127,.226,.076,ct);
    const cordGeom=own(new T.CylinderGeometry(1,1,1,7)),cords=own(new T.InstancedMesh(cordGeom,own(new T.MeshStandardMaterial({color:0x5f5847,metalness:.58,roughness:.45})),3));
    cords.frustumCulled=false;root.add(cords);
    function strand(i,x,y1,y2,z){tmp.position.set(x,(y1+y2)*.5,z);tmp.rotation.set(0,0,0);tmp.scale.set(.018,Math.max(.002,y2-y1),.018);tmp.updateMatrix();cords.setMatrixAt(i,tmp.matrix);}
    const station=batch(root,-3.8,0,-4.85,'Shore-side hand-chain winch');
    for(const x of [-.285,.285]){
      block(station,[x,.040,-.07],.21,.077,.48,p.iron);for(const z of [-.23,.085])bolt(station,x,.086,z,.025,'y');
      rod(station,[x,.083,-.205],[x*.78,1.71,-.092],.052,p.marine);
      rod(station,[x,.080,.088],[x*.78,1.49,-.095],.040,p.green);
    }
    block(station,[0,.39,-.13],.59,.085,.12,p.marine);
    plate(station,[0,1.58,-.24],.433,.47,.230,.060,p.deep);
    disc(station,[0,1.71,.025],.226,.081,p.edge);
    for(const x of [-.23,.23]){block(station,[x,1.60,.083],.040,.30,.092,p.iron);bolt(station,x,1.62,.138,.018);}
    const wheel=batch(station.g,0,1.71,.090,'Forged chain sheave');
    ring(wheel,[0,0,0],.160,.026,p.oxide);ring(wheel,[0,0,.027],.163,.014,p.edge);ring(wheel,[0,0,-.027],.166,.011,p.deep);
    for(let j=0;j<7;j++){const a=j*TAU/7;rod(wheel,[0,0,.006],[Math.cos(a)*.15,Math.sin(a)*.15,.006],.018,p.marine);}
    disc(wheel,[0,0,.037],.047,.058,p.chrome);disc(wheel,[0,0,.085],.021,.025,p.bronze,'z',hex);
    // Drive shaft crosses to the vertical reduction gear outside the western side of the walkway.
    rod(station,[0,1.65,-.22],[0,1.65,-2.59],.036,p.bronze);
    for(const z of [-.35,-1.45,-2.54]){disc(station,[0,1.65,z],.071,.107,p.iron);block(station,[0,1.54,z],.18,.10,.12,p.marine);}
    plate(station,[0,1.67,-2.75],.281,.262,.19,.042,p.deep);
    rod(station,[0,1.72,-2.63],[0,5.94,-2.63],.032,p.iron);
    for(const y of [2.0,3.75,5.69]){block(station,[0,y,-2.73],.19,.11,.14,p.deep);disc(station,[0,y,-2.625],.064,.11,p.edge,'y');}
    rod(station,[0,5.96,-2.63],[2.62,5.96,-2.63],.040,p.iron);
    disc(station,[0,5.96,-2.64],.123,.14,p.marine);
    const chainTag=map(450,188,(c,w,h)=>{
      c.fillStyle='#596157';c.fillRect(0,0,w,h);c.strokeStyle='#b2aa89';c.lineWidth=4;c.strokeRect(6,6,w-12,h-12);
      c.textAlign='center';c.fillStyle='#d9c9a0';c.font='bold 40px sans-serif';c.fillText('手 拉 起 闸',w/2,79);c.font='22px monospace';c.fillText('HAND CHAIN   /   W-01',w/2,134);
    });
    plate(station,[-.29,1.42,-.113],.334,.145,.076,.012,p.marine);
    texPlane(station.g,-.29,1.42,-.030,.304,.121,chainTag);
    const radius=.172,low=.306,high=1.71,span=high-low,arc=Math.PI*radius,loopLength=2*(span+arc),linkCount=82;
    const linkGeo=own(new T.TorusGeometry(1,.19,5,12));
    const chain=own(new T.InstancedMesh(linkGeo,own(new T.MeshStandardMaterial({color:0x9e9580,metalness:.64,roughness:.48})),linkCount));chain.frustumCulled=false;chain.instanceMatrix.setUsage(T.DynamicDrawUsage);station.g.add(chain);
    const xy={};
    function chainPoint(d){
      let t=(d+loopLength)%loopLength;
      if(t<span){xy.x=-radius;xy.y=high-t;xy.dx=0;xy.dy=-1;}
      else if((t-=span)<arc){const a=Math.PI+t/radius;xy.x=Math.cos(a)*radius;xy.y=low+Math.sin(a)*radius;xy.dx=-Math.sin(a);xy.dy=Math.cos(a);}
      else if((t-=arc)<span){xy.x=radius;xy.y=low+t;xy.dx=0;xy.dy=1;}
      else {t-=span;const a=t/radius;xy.x=Math.cos(a)*radius;xy.y=high+Math.sin(a)*radius;xy.dx=-Math.sin(a);xy.dy=Math.cos(a);}
      return xy;
    }
    const safety=batch(root,2.45,0,-9.15,'Dry-side locking quadrant');
    block(safety,[0,.042,-.067],.55,.084,.44,p.deep);boltGrid(safety,0,.059,.166,.36,.054,.017);
    for(const x of [-.15,.15])block(safety,[x,.476,-.070],.081,.805,.19,p.marine);
    plate(safety,[0,.886,-.14],.497,.374,.225,.040,p.marine);
    plate(safety,[.04,.906,.090],.404,.290,.044,.023,p.deep);boltGrid(safety,.04,.906,.146,.30,.20,.016);
    const pivot=[.061,.940,.152],lever=batch(safety.g,...pivot,'Over-centre lock handle');
    disc(lever,[0,0,.009],.09,.078,p.edge);
    rod(lever,[0,0,.040],[.402,.053,.105],.028,p.bronze);
    disc(lever,[.402,.053,.131],.024,.092,p.chrome);
    disc(lever,[.402,.053,.204],.046,.116,p.black);
    for(let j=0;j<4;j++)ring(lever,[.402,.053,.17+j*.021],.045,.003,p.edge);
    disc(lever,[.402,.053,.271],.034,.011,p.bronze);
    // Fixed left grab is paired with the sprung hand lever to the east.
    for(const y of [.858,1.021])rod(safety,[-.164,y,.13],[-.164,y,.266],.019,p.chrome);
    rod(safety,[-.164,.858,.266],[-.164,1.021,.266],.023,p.marine);
    rod(safety,[.10,.70,-.04],[.10,.52,.34],.027,p.bronze);
    rod(safety,[.10,.52,.34],[.10,.52,1.39],.026,p.edge);
    disc(safety,[.10,.52,1.39],.076,.12,p.iron);
    rod(safety,[.10,.52,1.39],[.434,.52,1.38],.023,p.bronze);
    rod(safety,[.434,.52,1.38],[.434,1.056,1.47],.024,p.bronze);
    block(portal,[2.907,1.056,-.204],.236,.15,.292,p.edge);
    const lockBolt=batch(portal.g,2.75,1.056,-.056,'Counterweight keeper bolt');
    rod(lockBolt,[-.40,0,0],[.11,0,0],.053,p.bronze);disc(lockBolt,[-.37,0,0],.056,.065,p.chrome,'x');
    const telltale=own(new T.MeshStandardMaterial({color:0xb26845,emissive:0x3b1405,emissiveIntensity:.55,roughness:.3}));
    const lockLight=new T.Mesh(own(new T.SphereGeometry(.032,16,8)),telltale);lockLight.scale.z=.55;lockLight.position.set(-.103,.999,.146);safety.g.add(lockLight);ring(safety,[-.103,.999,.144],.035,.005,p.bronze);
    // A mechanically reduced witness rod copies the displacement of the shutter. Both bores share a centre at 2.35 m.
    const gaugeX=-.37,datum=1.365,travelRatio=.207;
    for(const y of [.900,1.206])rod(safety,[-.148,y,-.01],[gaugeX,y,.005],.030,p.deep);
    plate(safety,[gaugeX,1.141,-.047],.307,.914,.064,.024,p.marine);
    plate(safety,[gaugeX,1.147,.023],.253,.850,.017,.014,p.gap);
    for(const xx of [-.113,.113]){
      rod(safety,[gaugeX+xx,.762,.082],[gaugeX+xx,1.539,.082],.012,p.chrome);
      for(const yy of [.763,1.531]){block(safety,[gaugeX+xx,yy,.062],.055,.055,.070,p.deep);bolt(safety,gaugeX+xx,yy,.101,.008);}
    }
    for(let i=0;i<=12;i++){
      const y=datum+(i*.25-2.35)*travelRatio,len=i%2?.023:.046;
      block(safety,[gaugeX+.107-len*.5,y,.056],len,.004,.006,p.ivory);
    }
    disc(safety,[gaugeX,datum,.062],.061,.022,p.iron);
    disc(safety,[gaugeX,datum,.082],.046,.016,'#425649');
    disc(safety,[gaugeX,datum,.093],.029,.012,'#526c5d');
    disc(safety,[gaugeX,datum,.103],.013,.009,'#c2e4b8');
    for(const sign of [-1,1]){
      const tip=new T.Shape();
      tip.moveTo(0,0);tip.lineTo(sign*.054,.017);tip.lineTo(sign*.054,-.017);tip.closePath();
      part(safety,own(new T.ExtrudeGeometry(tip,{depth:.006,bevelEnabled:false})),p.ivory,[gaugeX+sign*.070,datum,.144]);
    }
    const gaugeLabel=map(504,152,(c,w,h)=>{
      c.fillStyle='#3f524b';c.fillRect(0,0,w,h);c.strokeStyle='#9a9c77';c.lineWidth=4;c.strokeRect(4,4,w-8,h-8);
      c.textAlign='center';c.fillStyle='#dfdab7';c.font='bold 52px sans-serif';c.fillText('合 销 位',w/2,66);c.font='bold 38px monospace';c.fillText('2.35 m',w/2,122);
    });texPlane(safety.g,gaugeX,1.554,.108,.229,.069,gaugeLabel);
    const follower=batch(safety.g,gaugeX,datum,.111,'Pierced brass height follower');
    const ribbon=shape(.137,.295,.014),aperture=new T.Path();aperture.absarc(0,0,.048,0,TAU,true);ribbon.holes.push(aperture);
    const ribbonGeo=own(new T.ExtrudeGeometry(ribbon,{depth:.012,bevelEnabled:true,bevelSegments:1,bevelThickness:.0016,bevelSize:.0016,curveSegments:24}));
    part(follower,ribbonGeo,p.bronze,[0,0,0]);
    ring(follower,[0,0,.014],.053,.005,'#dc9854');ring(follower,[0,0,.017],.047,.002,p.chrome);
    rod(follower,[0,-.240,.002],[0,-.127,.002],.009,p.bronze);
    for(const yy of [-.097,.097]){bolt(follower,0,yy,.015,.008);block(follower,[0,yy+(yy>0?.022:-.022),.017],.068,.003,.003,'#665843');}
    // The landward desk is a sealed enamel cabinet with separate patch and direction-finding assemblies.
    const desk=batch(root,0,0,-13.25,'Landward emergency receive-only cabinet');
    for(const x of [-1.70,1.70])for(const z of [-.14,-.81]){
      block(desk,[x,.090,z],.122,.18,.127,p.deep);block(desk,[x,.027,z],.20,.051,.184,p.edge);bolt(desk,x+.069,.060,z,.011,'y');
    }
    for(const x of [-1.78,1.78])block(desk,[x,.489,-.484],.079,.819,.822,p.marine);
    block(desk,[0,.50,-.51],3.53,.766,.77,p.deep);block(desk,[0,.145,-.482],3.61,.088,.84,p.edge);
    for(const x of [-1.33,-.45,.45,1.33]){
      plate(desk,[x,.525,-.120],.851,.625,.043,.027,p.green);plate(desk,[x,.525,-.072],.789,.563,.009,.018,p.marine);
      for(const y of [.355,.685])disc(desk,[x-.393,y,-.055],.020,.097,p.edge,'y');
      disc(desk,[x+.289,.571,-.045],.045,.025,p.iron);block(desk,[x+.289,.542,-.024],.022,.073,.019,p.chrome,0,0,-.18);
      for(let i=0;i<5;i++){block(desk,[x,.446+i*.035,-.059],.347,.012,.011,p.deep);block(desk,[x,.450+i*.035,-.051],.355,.008,.022,p.edge);}
    }
    block(desk,[0,.907,-.477],3.76,.105,.936,p.green);block(desk,[0,.882,-.012],3.77,.053,.029,p.chrome);
    block(desk,[0,.988,-.883],3.71,.137,.063,p.deep);
    // Small faded working labels are attached to the instrument cheeks.
    function plateLegend(top,sub,warm=true){
      return map(540,130,(c,w,h)=>{
        c.fillStyle=warm?'#464b3e':'#4c5a4d';c.fillRect(0,0,w,h);c.strokeStyle=warm?'#a38e63':'#92a48a';c.lineWidth=3;c.strokeRect(4,4,w-8,h-8);
        c.fillStyle='#d8c9a3';c.textAlign='left';c.font='bold 37px sans-serif';c.fillText(top,31,56);c.fillStyle='#bbb99d';c.font='21px monospace';c.fillText(sub,32,99);
        for(const x of [13,w-13])for(const y of [13,h-13]){c.beginPath();c.arc(x,y,3.8,0,TAU);c.fill();}
      });
    }
    // Left: recessed bronze socket, break strain gland, removable bayonet and service lead.
    const jackX=-1.35,jackY=1.228,jackZ=-.157;
    plate(desk,[-1.33,1.152,-.677],.790,.365,.492,.045,p.marine);
    plate(desk,[-1.33,1.154,-.186],.751,.344,.021,.031,p.deep);
    boltGrid(desk,-1.33,1.154,-.155,.65,.25,.015);
    disc(desk,[jackX,jackY,jackZ],.122,.036,p.bronze);disc(desk,[jackX,jackY,-.121],.091,.028,p.copper);
    disc(desk,[jackX,jackY,-.103],.060,.014,p.gap);
    ring(desk,[jackX,jackY,-.090],.062,.008,p.chrome);
    for(let i=0;i<6;i++){const a=i*TAU/6;bolt(desk,jackX+.099*Math.cos(a),jackY+.099*Math.sin(a),-.128,.008);}
    for(const y of [1.046,1.254])rod(desk,[-1.640,y,-.15],[-1.640,y,-.041],.013,p.bronze);
    rod(desk,[-1.640,1.045,-.041],[-1.640,1.255,-.041],.019,p.edge);
    texPlane(desk.g,-1.327,1.049,-.153,.31,.074,plateLegend('应急听线','AUDIO INPUT  /  MONO'));
    plate(desk,[-1.733,.553,-.053],.107,.119,.019,.014,p.edge);
    disc(desk,[-1.733,.553,-.020],.044,.075,p.black);
    const plug=batch(desk.g,0,0,0,'Bronze bayonet with strain-relief boot');
    disc(plug,[0,0,-.109],.027,.13,p.chrome);disc(plug,[0,0,-.155],.030,.011,p.black);disc(plug,[0,0,-.180],.020,.025,p.bronze);
    disc(plug,[0,0,-.039],.050,.062,p.copper);disc(plug,[0,0,.013],.057,.061,p.bronze);
    for(let i=0;i<24;i++){const a=i*TAU/24;block(plug,[.057*Math.cos(a),.057*Math.sin(a),.015],.006,.005,.049,i%2?p.chrome:p.copper,0,0,a);}
    disc(plug,[0,0,.069],.043,.069,p.black);
    for(let i=0;i<5;i++)ring(plug,[0,0,.072+i*.012],.043-i*.0039,.004,p.iron);
    disc(plug,[0,0,.123],.025,.048,p.black);
    // Right: yaw-calibrated, nested copper loop on insulated ceramic feet.
    const antX=1.35,antZ=-.472,antBase=1.095;
    for(const x of [-.25,.25])block(desk,[antX+x,1.005,antZ],.086,.084,.41,p.deep);
    disc(desk,[antX,1.061,antZ],.302,.105,p.marine,'y');
    disc(desk,[antX,1.120,antZ],.272,.032,p.bronze,'y');ring(desk,[antX,1.139,antZ],.236,.007,p.chrome,Math.PI*.5);
    for(let i=0;i<42;i++){const a=i*TAU/42,large=i%3===0;block(desk,[antX+Math.sin(a)*.25,1.138,antZ+Math.cos(a)*.25],.005,.005,large?.037:.021,large?p.ivory:p.iron,0,a);}
    const loop=batch(desk.g,antX,antBase,antZ,'Gimballed copper direction-finding loop');
    disc(loop,[0,.087,0],.173,.090,p.iron,'y');
    disc(loop,[0,.165,0],.067,.131,p.chrome,'y');
    for(const x of [-.111,.111]){block(loop,[x,.168,0],.045,.200,.084,p.deep);disc(loop,[x,.248,0],.050,.055,p.bronze,'x');}
    rod(loop,[-.104,.248,0],[.104,.248,0],.031,p.chrome);
    const loopY=.785;
    const shapePts=[[-.17,-.44],[-.39,-.23],[-.39,.20],[-.14,.449],[.14,.449],[.39,.20],[.39,-.23],[.17,-.44],[-.17,-.44]];
    for(let i=0;i<4;i++){
      const sc=1-i*.071,z=i%2?.008:-.008;
      const pts=shapePts.map(([x,y])=>v(x*sc,loopY+y*sc,z));
      const curve=new T.CatmullRomCurve3(pts.slice(0,-1),true,'catmullrom',.12);
      part(loop,own(new T.TubeGeometry(curve,80,i===0?.016:.0095,6,true)),i===0?p.bronze:p.copper,[0,0,0]);
    }
    for(const [x,y] of [[0,.392],[0,-.395],[-.344,0],[.344,0]]){
      const a=Math.atan2(y,x);
      block(loop,[x,loopY+y,0],.145,.043,.043,'#91866a',0,0,a);
      disc(loop,[x,loopY+y,.027],.014,.010,p.chrome);
    }
    for(const x of [-.103,.103]){disc(loop,[x,.309,0],.030,.097,p.ivory,'y');rod(loop,[x,.334,0],[x*.9,.399,0],.014,p.copper);}
    rod(loop,[0,.095,.082],[.146,.13,.229],.015,p.bronze);
    disc(loop,[.146,.174,.229],.030,.093,p.black,'y');
    // A fixed steady grip lies immediately forward of the azimuth scale.
    for(const x of [1.025,1.206])rod(desk,[x,1.064,-.182],[x,1.064,-.058],.014,p.edge);
    rod(desk,[1.025,1.064,-.058],[1.206,1.064,-.058],.021,p.deep);
    texPlane(desk.g,1.32,.688,-.052,.405,.092,plateLegend('定 向 环','BEARING  /  RX',false));
    // Sealed receiver above the desk. The iron loudspeaker grille and the meter survive saltwater spray.
    plate(desk,[-.12,1.218,-.829],1.50,.466,.508,.048,p.deep);
    plate(desk,[-.12,1.218,-.324],1.466,.432,.038,.034,p.marine);
    block(desk,[-.12,1.46,-.533],1.59,.046,.647,p.green);
    block(desk,[-.12,1.437,-.203],1.58,.060,.034,p.edge);
    boltGrid(desk,-.12,1.221,-.277,1.355,.321,.017);
    const speakerX=-.551,speakerY=1.243;
    disc(desk,[speakerX,speakerY,-.274],.141,.027,p.gap);
    ring(desk,[speakerX,speakerY,-.249],.134,.011,p.bronze);
    ring(desk,[speakerX,speakerY,-.253],.086,.005,p.iron);
    for(let i=-5;i<=5;i++){
      const y=i*.020,half=Math.sqrt(.123**2-y*y);
      block(desk,[speakerX,speakerY+y,-.243],half*2,.008,.010,p.edge);
    }
    const mx=-.086,my=1.253;
    plate(desk,[mx,my,-.281],.435,.205,.029,.023,p.gap);
    plate(desk,[mx,my,-.252],.413,.188,.014,.016,p.bronze);
    const meter=map(610,249,(c,w,h)=>{
      const g=c.createLinearGradient(0,0,0,h);g.addColorStop(0,'#a69570');g.addColorStop(.17,'#d4cbb0');g.addColorStop(.59,'#e2d8b9');g.addColorStop(1,'#b8ad89');
      c.fillStyle=g;c.fillRect(0,0,w,h);c.textAlign='center';c.fillStyle='#5c5849';c.font='bold 18px sans-serif';c.fillText('RECEIVED SIGNAL',w/2,44);
      const cx=w/2,cy=284,r=170,a=j=>(-137+j*94/30)*Math.PI/180;
      for(let i=0;i<=30;i++){
        const ang=a(i),lo=r-(i%5?9:19);c.beginPath();c.moveTo(cx+Math.cos(ang)*lo,cy+Math.sin(ang)*lo);c.lineTo(cx+Math.cos(ang)*r,cy+Math.sin(ang)*r);
        c.strokeStyle=i>23?'#944b2e':'#504d3f';c.lineWidth=i%5?2:3;c.stroke();
        if(i%5===0){c.font='17px Georgia';c.fillStyle=c.strokeStyle;c.fillText(String(i/5),cx+Math.cos(ang)*(r+20),cy+Math.sin(ang)*(r+20));}
      }
      c.beginPath();c.arc(cx,cy,r,a(0),a(30));c.lineWidth=2;c.strokeStyle='#5f5946';c.stroke();
      c.fillStyle='#72705a';c.font='20px monospace';c.fillText('N. CAPE    /    μA',w/2,203);
    });
    texPlane(desk.g,mx,my,-.228,.392,.164,meter,{emissive:0x171409,emissiveIntensity:.30,roughness:.67,metalness:.07});
    const needle=batch(desk.g,mx,my-.100,-.223,'Moving-coil signal needle');
    block(needle,[0,.058,0],.0028,.118,.002,p.gap);
    block(desk,[mx,my-.097,-.217],.431,.025,.010,p.deep);
    const glass=map(450,140,(c,w,h)=>{
      const g=c.createLinearGradient(0,0,w,h);g.addColorStop(0,'rgba(236,245,209,.11)');g.addColorStop(.32,'rgba(226,242,219,.015)');g.addColorStop(.45,'rgba(229,238,211,.13)');g.addColorStop(.55,'rgba(213,238,217,.025)');g.addColorStop(1,'rgba(210,242,215,.045)');c.fillStyle=g;c.fillRect(0,0,w,h);
      for(let i=0;i<7;i++){c.fillStyle='rgba(159,205,187,.16)';c.fillRect(i*4,0,2,h);c.fillRect(w-i*4-2,0,2,h);}
    });
    const face=new T.Mesh(own(new T.PlaneGeometry(.391,.164)),own(new T.MeshBasicMaterial({map:glass,transparent:true,depthWrite:false})));face.position.set(mx,my,-.212);face.renderOrder=3;desk.g.add(face);
    texPlane(desk.g,-.104,1.087,-.279,.408,.076,plateLegend('岸 站 应 急 接 收','LANDWARD  /  RX ONLY'));
    const lampX=.343,lampY=1.273;
    plate(desk,[lampX,lampY,-.278],.130,.216,.028,.027,p.deep);
    const lampMat=own(new T.MeshStandardMaterial({color:'#79917a',emissive:'#9fdda5',emissiveIntensity:.03,metalness:.08,roughness:.27}));
    const jewel=new T.Mesh(own(new T.SphereGeometry(1,20,12)),lampMat);jewel.scale.set(.036,.069,.022);jewel.position.set(lampX,lampY,-.238);desk.g.add(jewel);
    for(let i=-2;i<=2;i++)block(desk,[lampX+i*.012,lampY,-.215],.002,.105-Math.abs(i)*.015,.002,'#abc1a3');
    for(let i=0;i<4;i++){disc(desk,[.22+i*.084,1.078,-.258],.022,.038,p.black);disc(desk,[.22+i*.084,1.078,-.235],.014,.009,p.chrome,'z',hex);}
    for(const o of templates)finish(o);templates.clear();primitives.clear();
    // Curved lead deforms at its plug end; the lower gland and the hanging loop stay in place.
    const hoseSegments=34,sides=7,liveGeo=own(new T.BufferGeometry()),pts=new Float32Array((hoseSegments+1)*(sides+1)*3),nr=new Float32Array(pts.length),idx=[];
    for(let i=0;i<hoseSegments;i++)for(let j=0;j<sides;j++){const a=i*(sides+1)+j,b=a+sides+1;idx.push(a,a+1,b,b,a+1,b+1);}
    const attr=new T.BufferAttribute(pts,3),norm=new T.BufferAttribute(nr,3);attr.setUsage(T.DynamicDrawUsage);norm.setUsage(T.DynamicDrawUsage);
    liveGeo.setIndex(idx);liveGeo.setAttribute('position',attr);liveGeo.setAttribute('normal',norm);
    const lead=new T.Mesh(liveGeo,own(new T.MeshStandardMaterial({color:'#383b31',roughness:.53,metalness:.11,side:T.DoubleSide})));desk.g.add(lead);lead.frustumCulled=false;
    const tail=v(),h1=v(),h2=v(),h3=v(-1.56,.467,.184),h4=v(-1.744,.345,.113),h5=v(-1.733,.553,.016);
    const curve=new T.CatmullRomCurve3([tail,h1,h2,h3,h4,h5]),axis=v(),normX=v(),normY=v(),point=v(),basis=v(0,0,1),basisX=v(1,0,0);
    function deformLead(){
      plug.g.updateMatrix();tail.set(0,0,.139).applyMatrix4(plug.g.matrix);h1.set(0,0,.222).applyMatrix4(plug.g.matrix);
      h2.copy(h1);h2.x-=.035;h2.y-=.20;h2.z+=.025;
      let k=0;
      for(let i=0;i<=hoseSegments;i++){
        const t=i/hoseSegments;curve.getPoint(t,point);curve.getTangent(t,axis);normX.crossVectors(axis,Math.abs(axis.z)>.94?basisX:basis).normalize();normY.crossVectors(axis,normX).normalize();
        for(let j=0;j<=sides;j++){
          const a=j*TAU/sides,ca=Math.cos(a),sa=Math.sin(a),x=normX.x*ca+normY.x*sa,y=normX.y*ca+normY.y*sa,z=normX.z*ca+normY.z*sa;
          pts[k]=point.x+x*.016;nr[k++]=x;pts[k]=point.y+y*.016;nr[k++]=y;pts[k]=point.z+z*.016;nr[k++]=z;
        }
      }attr.needsUpdate=true;norm.needsUpdate=true;
    }
    const chainHands=[v(),v()],worldHands={chain:[v(),v()],pin:[v(),v()],plug:[v(),v()],loop:[v(),v()]};
    let previousStroke=-4,oldPlug=null;
    function update(height=0,pinned=false,stroke=0,receiverAngle=0,plugged=false,signal=0){
      const h=clamp(Number(height)||0,0,2.9),f=clamp(Number(stroke)||0);
      blade.g.position.y=h;counter.g.position.y=.29+2.90-h;
      follower.g.position.y=datum+(h-2.35)*travelRatio;
      for(const [i,x] of [-1.38,1.38].entries())strand(i,x,h+2.89,5.969,-7.474);
      strand(2,2.47,counter.g.position.y+.92,5.969,-7.54);cords.instanceMatrix.needsUpdate=true;
      if(Math.abs(f-previousStroke)>1e-5){
        previousStroke=f;
        const travel=f*.522,spacing=loopLength/linkCount;
        wheel.g.rotation.z=travel/radius;
        for(let i=0;i<linkCount;i++){
          const xy=chainPoint(i*spacing+travel);tmp.position.set(xy.x,xy.y,.115);
          tmp.rotation.order='ZXY';tmp.rotation.set(0,i%2?1.080:-.20,Math.atan2(-xy.dx,xy.dy),'ZXY');tmp.scale.set(.023,.037,.023);tmp.updateMatrix();chain.setMatrixAt(i,tmp.matrix);
        }
        chain.instanceMatrix.needsUpdate=true;
        for(let i=0;i<2;i++){
          const y=i?1.127-.187*f:1.225+.145*f,dist=i?span+arc+y-low:high-y;
          const q=chainPoint(Math.round((dist-travel)/spacing)*spacing+travel);
          chainHands[i].set(q.x,q.y,.119);
        }
      }
      lever.g.rotation.z=pinned?-.79:.49;lockBolt.g.position.x=pinned?2.75:3.15;
      telltale.color.set(pinned?0x93bb8a:0xb26845);telltale.emissive.set(pinned?0x437a42:0x3b1405);
      loop.g.rotation.y=clamp(Number(receiverAngle)||0,-1.38,1.38);
      if(oldPlug!==!!plugged){
        oldPlug=!!plugged;
        plug.g.position.set(jackX+(plugged?0:-.144),jackY+(plugged?0:-.172),plugged?-.035:.102);
        plug.g.rotation.set(plugged?0:.68,plugged?0:-.51,plugged?0:-.16);deformLead();
      }
      const strength=clamp(Number(signal)||0);needle.g.rotation.z=(.5-strength)*1.63;
      lampMat.emissiveIntensity=plugged?.20+strength*.98:.028;
    }
    function contact(g,target,x,y,z){g.updateWorldMatrix(true,false);target.set(x,y,z).applyMatrix4(g.matrixWorld);}
    function hands(kind){
      const outHands=worldHands[kind];if(!outHands)return [];
      if(kind==='chain'){station.g.updateWorldMatrix(true,false);for(let i=0;i<2;i++)outHands[i].copy(chainHands[i]).applyMatrix4(station.g.matrixWorld);}
      else if(kind==='pin'){contact(safety.g,outHands[0],-.164,.949,.267);contact(lever.g,outHands[1],.402,.053,.215);}
      else if(kind==='plug'){contact(desk.g,outHands[0],-1.640,1.131,-.041);contact(plug.g,outHands[1],0,0,.050);}
      else if(kind==='loop'){contact(desk.g,outHands[0],1.112,1.064,-.058);contact(loop.g,outHands[1],.146,.174,.229);}
      return outHands;
    }
    function dispose(){root.removeFromParent();root.clear();resources.forEach(o=>o.dispose());resources.clear();}
    update();return {update,hands,dispose};
  }
  return {create};
})();
if(typeof window!=='undefined')window.TideFloodGear=TideFloodGear;
