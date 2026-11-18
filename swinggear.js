// Bifilar traversing trolley, landing controls and secured folding survey staff.
const TideSwingGear=(()=>{
  const T=THREE,TAU=2*Math.PI,clamp=(x,a=0,b=1)=>Math.min(b,Math.max(a,x));
  const v=(x=0,y=0,z=0)=>new T.Vector3(x,y,z),mix=(a,b,t)=>a+(b-a)*t;
  function rng(seed){return ()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}
  function create(parent){
    const root=new T.Group();root.name='横移吊环 · 海务维保跨线器';parent.add(root);
    const resources=new Set(),own=x=>(resources.add(x),x),p={iron:'#4a5350',chrome:'#b9b8a2'};
    const shell='#3c5152',green='#647975',edge='#99a191',brass='#c9a36b',bronze='#987a53',red='#a45d4c',ox='#77513f',steel='#909a93',dark='#404942',ink='#323f38',enamel='#e4dfc4',wood='#7b6350',rubber='#454942',post='#788079';
    function map(w,h,draw){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=own(new T.CanvasTexture(c));if('colorSpace' in t)t.colorSpace=T.SRGBColorSpace;else t.encoding=T.sRGBEncoding;t.anisotropy=4;return t;}
    const grain=map(256,256,(c,w,h)=>{
      const r=rng(923);c.fillStyle='#e8e7df';c.fillRect(0,0,w,h);
      for(let i=0;i<11500;i++){c.fillStyle=r()>.40?'rgba(75,66,50,.21)':'rgba(250,247,226,.35)';c.fillRect(r()*w,r()*h,.65+r()**2*6,.65+r()*.95);}
      for(let i=0;i<49;i++){const x=r()*w,y=r()*h,sz=1+r()**3*12;const g=c.createRadialGradient(x,y,.1,x,y,sz);g.addColorStop(0,'rgba(95,76,49,.16)');g.addColorStop(1,'rgba(113,97,62,0)');c.fillStyle=g;c.fillRect(x-sz,y-sz,sz*2,sz*2);}
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
    function bulb(o,x,y,z,s,tint){part(o,sphere,tint,[x,y,z],s);}
    const sphere=own(new T.SphereGeometry(1,24,14)),wet=own(new T.MeshStandardMaterial({map:grain,color:0xffffff,vertexColors:true,metalness:.49,roughness:.28}));
    function nameplate(o,x,y,z,w,h,title,sub='',base='#d7ccaa',fg='#35483c'){
      const t=map(640,Math.max(104,Math.round(640*h/w)),(c,W,H)=>{
        c.fillStyle=base;c.fillRect(0,0,W,H);c.fillStyle=fg;c.strokeStyle=fg;c.lineWidth=3;c.strokeRect(8,8,W-16,H-16);c.textAlign='center';c.textBaseline='middle';
        c.font='bold '+Math.floor(H*(sub ? .43 : .64))+'px serif';c.fillText(title,W*.5,H*(sub ? .36 : .51),W-45);
        if(sub){c.font=Math.floor(H*.20)+'px monospace';c.fillText(sub,W*.5,H*.75,W-37);}
      });
      plate(o,[x,y,z],w+.016,h+.016,.009,.008,bronze);
      return texPlane(o.g,x,y,z+.014,w,h,t,{metalness:.1,emissive:0x171c11,emissiveIntensity:.18});
    }
    function wheel(o,r,n,tint){
      ring(o,[0,0,0],r,r*.080,tint);ring(o,[0,0,.002],r*.90,r*.022,bronze);disc(o,[0,0,-.026],r*.22,.085,bronze);
      for(let i=0;i<n;i++){
        const a=i*TAU/n,b=a+.14;hose(o,[[.05*Math.cos(a),.05*Math.sin(a),-.036],[r*.43*Math.cos(b),r*.43*Math.sin(b),-.060],[r*.82*Math.cos(b),r*.82*Math.sin(b),-.014],[r*.961*Math.cos(b),r*.961*Math.sin(b),0]],r*.044,tint,9);
        if(i%2===0)disc(o,[r*.948*Math.cos(a),r*.948*Math.sin(a),.013],r*.052,.009,edge);
      }
      disc(o,[0,0,.026],r*.128,.033,brass,'z',hex);
    }
    const gun='#3b4542',scar='#9a7652',edgePaint='#91a29b',oldWhite='#ddd8be',beech='#9d7752',bronzeDark='#8a6d46',caution='#c69b58';
    const stationary=batch(root,0,0,0,'Quarry gantry, splice plates and rope run');
    const car=group(root,0,0,-11,'Moving weather platform equipment');
    const handParts=new Map(),handCache=new Map();
    function grip(kind,obj,left,right){handParts.set(kind,[obj,v(...left),v(...right)]);handCache.set(kind,[v(),v()]);}
    function beam(o,a,b,w,d,c){
      const start=v(...a),end=v(...b),axis=v().subVectors(end,start),l=axis.length();
      const q=new T.Quaternion().setFromUnitVectors(up,axis.normalize());part(o,cube,c,start.lerp(end,.5).toArray(),[w,l,d],[0,0,0],metal,q);
    }
    function bracePlate(o,x,y,z,w,h,depth,col,cut=.03){
      const S=new T.Shape();S.moveTo(-w*.5+cut,-h*.5);S.lineTo(w*.5-cut,-h*.5);S.lineTo(w*.5,-h*.5+cut);
      S.lineTo(w*.5,h*.5-cut);S.lineTo(w*.5-cut,h*.5);S.lineTo(-w*.5+cut,h*.5);S.lineTo(-w*.5,h*.5-cut);S.lineTo(-w*.5,-h*.5+cut);S.closePath();
      const g=own(new T.ExtrudeGeometry(S,{depth,curveSegments:2,bevelEnabled:true,bevelSegments:1,bevelSize:.0025,bevelThickness:.0025}));part(o,g,col,[x,y,z]);
    }
    function ears(o,xx,yy,zz,w,h,spacing,col){
      for(const z of [zz-spacing,zz+spacing]){bracePlate(o,xx,yy,z,w,h,.010,col,.018);disc(o,[xx,yy,z+.009],.018,.018,brass,'z',hex);}
    }
    // Twin half-channels are spliced into a single I-section; the lower lip is the polished running surface.
    for(const z of [-6.122,-6.117])block(stationary,[0,6.572,z],7.30,.292,.024,shell);
    block(stationary,[0,6.744,-6.12],7.34,.054,.226,green);block(stationary,[0,6.403,-6.12],7.33,.063,.230,green);
    for(const z of [-6.215,-6.025])block(stationary,[0,6.436,z],7.20,.009,.031,steel);
    for(const x of [-2.85,-1.42,0,1.42,2.85]){
      for(const z of [-6.150,-6.095]){
        bracePlate(stationary,x,6.57,z,.185,.251,.015,green);
        for(const xx of [-.059,.059])for(const yy of [-.077,.077])bolt(stationary,x+xx,6.57+yy,z+.02,.014);
      }
    }
    // End cheeks terminate in side-mounted, outboard stays. The complete swing corridor remains clear.
    for(const sign of [-1,1]){
      const x=sign*3.52;
      for(const z of [-6.252,-6.012]){
        bracePlate(stationary,x,6.56,z,.226,.403,.025,shell,.046);
        for(const yy of [-.134,.134])for(const xx of [-.071,.071])bolt(stationary,x+xx,6.56+yy,z+.025,.016);
      }
      block(stationary,[sign*3.41,6.41,-6.12],.056,.182,.321,bronzeDark);
      for(const z of [-6.28,-5.96]){
        beam(stationary,[x,6.51,z],[sign*4.25,5.92,z-.15],.086,.064,green);
        rod(stationary,[x,6.731,z],[sign*4.38,7.12,z-.10],.019,steel);
      }
      for(const z of [-6.28,-5.96])rod(stationary,[sign*4.25,5.92,z-.15],[sign*4.38,7.12,z-.1],.037,shell);
      disc(stationary,[sign*3.54,6.48,-5.910],.105,.067,bronze);ring(stationary,[sign*3.54,6.48,-5.865],.091,.013,gun);
      for(const k of [-1,1])rod(stationary,[sign*3.54+k*.076,6.40,-5.913],[sign*3.54+k*.076,6.57,-5.913],.015,edge);
    }
    // Slender shore-mounted shear legs stand outside both jump lanes; the closing backstays return load to the bridgehead.
    for(const sign of [-1,1]){
      for(const [x,z] of [[3.13,-1.72],[3.10,.32]]){
        block(stationary,[sign*x,.019,z],.266,.038,.306,gun);
        for(const xx of [-.090,.090])for(const zz of [-.100,.100])bolt(stationary,sign*x+xx,.043,z+zz,.015,'y');
        ears(stationary,sign*x,.106,z,.128,.147,.044,green);
      }
      const bottom=[sign*3.13,.128,-1.72],head=[sign*3.62,6.52,-6.105],heel=[sign*3.10,.128,.32],crown=[sign*3.65,6.76,-6.13];
      beam(stationary,bottom,head,.102,.125,shell);rod(stationary,heel,crown,.022,steel);
      const pa=v(...heel),pb=v(...crown),q1=pa.clone().lerp(pb,.115),q2=pa.clone().lerp(pb,.171);
      rod(stationary,q1.toArray(),q2.toArray(),.037,bronze);
      for(const j of [0.22,.48,.74]){
        const from=v(...bottom).lerp(v(...head),j),to=v(...heel).lerp(v(...crown),j+.041);
        rod(stationary,from.toArray(),to.toArray(),.014,green);
        const near=from.clone().add(v(-.030*sign,-.008,.012));rod(stationary,near.toArray(),to.toArray(),.008,bronzeDark);
      }
    }
    // Cast underhung sills carry the handwheel just beyond the original jetty's north lip.
    for(const xx of [-2.915,-2.405]){
      block(stationary,[xx,-.069,-2.218],.079,.104,.891,shell);
      beam(stationary,[xx,-.317,-1.899],[xx,-.123,-2.628],.044,.050,green);
      block(stationary,[xx,.009,-1.889],.119,.018,.172,green);bolt(stationary,xx,.023,-1.891,.015,'y');
    }
    block(stationary,[-2.66,-.037,-2.398],.692,.047,.519,green);
    // Morse-size marks are painted on the iron, with a numbered zero plate. Their separation is in actual metres.
    for(let i=-11;i<=11;i++){
      const x=i*.2,L=i%5===0?.112:i%2?.038:.062;
      block(stationary,[x,6.640-L*.5,-6.097],i%5===0?.025:.010,L,.006,i===0?caution:oldWhite);
    }
    nameplate(stationary,0,6.569,-6.085,.332,.118,'横移零位','0 · 轨心','#96977f','#34453e');
    const truck=batch(root,0,6.25,-6.12,'Traversing four-wheel carrier');
    for(const z of [-.148,.129]){
      bracePlate(truck,0,.089,z,.749,.221,.021,shell,.055);block(truck,[0,.023,z+.018],.527,.015,.006,edgePaint);
      for(const x of [-.264,.264]){
        disc(truck,[x,.120,z+.012],.090,.066,gun);disc(truck,[x,.120,z+.047],.064,.019,bronze);disc(truck,[x,.120,z+.060],.029,.014,steel,'z',hex);
      }
    }
    // Four steel tires ride on the inside of the cheeks, each with its own brass hub cover and keeper.
    for(const z of [-.072,.072])for(const x of [-.256,.256]){
      disc(truck,[x,.248,z],.066,.040,steel);disc(truck,[x,.249,z+Math.sign(z)*.022],.080,.012,gun);
      rod(truck,[x,.234,z],[x,.102,z*1.89],.016,bronze);
    }
    for(const x of [-.313,.313])disc(truck,[x,.065,0],.021,.320,steel,'z');
    block(truck,[0,-.030,0],.579,.067,.240,green);for(const s of [-1,1]){bracePlate(truck,s*.205,-.070,.063,.132,.126,.024,brass,.028);
      bracePlate(truck,s*.205,-.070,-.088,.132,.126,.024,brass,.028);disc(truck,[s*.205,-.094,0],.023,.196,steel);}
    nameplate(truck,0,.080,.153,.264,.099,'行　车','07　/　横链','#b6aa85','#35443c');
    const pend=batch(truck.g,0,-.085,0,'Shackle rocker');
    for(const x of [-.206,.206]){
      disc(pend,[x,0,0],.029,.144,bronze,'z');
      hose(pend,[[x-.041,.004,0],[x-.044,-.041,0],[x-.025,-.083,0],[x,-.093,0],[x+.032,-.079,0],[x+.044,-.039,0],[x+.042,.005,0]],.013,steel,16);
      rod(pend,[x-.050,0,0],[x+.050,0,0],.013,brass);
    }
    // Clear brass indicator and separate protected rewind drum make the shore and cabin controls readable from opposing stances.
    const dialMap=map(688,688,(c,w,h)=>{
      const r=rng(286),cx=w/2,cy=h*.50;c.fillStyle='#bbaa83';c.fillRect(0,0,w,h);
      for(let i=0;i<6800;i++){c.fillStyle=i%2?'rgba(248,231,182,.23)':'rgba(75,69,51,.13)';c.fillRect(r()*w,r()*h,.7+r()*5,1);}
      c.textAlign='center';c.textBaseline='middle';
      for(let i=-23;i<=23;i++){
        const a=(-90+i*(116/23))*Math.PI/180,xx=Math.cos(a),yy=Math.sin(a),major=i%5===0||Math.abs(i)===23;
        c.strokeStyle=major?'#344439':'#65715c';c.lineWidth=i===0?8:major?5:2;
        c.beginPath();c.moveTo(cx+xx*248,cy+yy*248);c.lineTo(cx+xx*(major?208:230),cy+yy*(major?208:230));c.stroke();
        if(i%10===0){c.fillStyle='#33483c';c.font='bold 43px serif';c.fillText(i>0?'+'+(i/10):String(i/10),cx+xx*177,cy+yy*177);}
      }
      c.fillStyle='#30443a';c.font='bold 44px serif';c.fillText('横 移',cx,cy+87);c.font='23px monospace';c.fillText('米　·　m',cx,cy+134);
      c.strokeStyle='#817f63';c.lineWidth=3;c.beginPath();c.arc(cx,cy,277,0,TAU);c.stroke();
    });
    function gauge(o,x,y,z){
      const rad=.139;disc(o,[x,y,z],.155,.073,gun);disc(o,[x,y,z+.036],.153,.015,bronzeDark);
      const mat=own(new T.MeshStandardMaterial({map:dialMap,roughness:.39,metalness:.14,emissive:0x181a10,emissiveIntensity:.21}));
      const f=new T.Mesh(own(new T.CircleGeometry(rad,48)),mat);f.position.set(x,y,z+.049);o.g.add(f);ring(o,[x,y,z+.048],.142,.008,brass);
      const n=batch(o.g,x,y,z+.054,'Rail-displacement dial needle');
      rod(n,[0,-.025,0],[0,.098,0],.004,'#994d36');bulb(n,0,0,.003,[.011,.011,.005],bronze);return n.g;
    }
    function dialStand(parent,name,x,z,rotation,far){
      const o=batch(parent,x,0,z,name);o.g.rotation.y=rotation;
      const tx=far?'返送':'横移';
      block(o,[0,.036,-.090],.692,.073,.439,ox);
      bracePlate(o,0,.092,-.309,.651,.092,.409,shell,.020);
      for(const x of [-.258,.258])for(const zz of [-.239,.051]){disc(o,[x,.116,zz],.037,.008,bronzeDark,'y');bolt(o,x,.124,zz,.021,'y');}
      for(const sign of [-1,1]){
        const xx=.228*sign;
        beam(o,[xx,.125,-.071],[xx*.42,.955,-.095],.055,.091,green);
        beam(o,[xx,.125,-.226],[xx*.45,.692,-.074],.037,.063,shell);
      }
      block(o,[0,.368,-.084],.390,.060,.139,green);
      rod(o,[-.25,.584,-.184],[.25,.584,-.184],.040,bronze);
      for(const xx of [-.188,.188]){bracePlate(o,xx,.626,-.210,.075,.285,.091,green,.022);disc(o,[xx,.644,-.106],.054,.052,gun);}
      disc(o,[0,.661,-.135],.107,.335,gun,'x');for(const i of [-1,1])disc(o,[i*.162,.661,-.135],.146,.022,green,'x');
      for(let j=0;j<14;j++)ring(o,[-.143+j*.022,.661,-.135],.110,.010,'#958c6e',0,Math.PI/2);
      // Stamped cover with viewing aperture and open sides over the return capstan.
      beam(o,[-.214,.758,-.199],[-.214,.840,-.069],.027,.027,shell);
      beam(o,[.214,.758,-.199],[.214,.840,-.069],.027,.027,shell);
      for(const zz of [-.184,-.125,-.064])rod(o,[-.213,.821,zz],[.213,.821,zz],.009,steel);
      disc(o,[0,1.015,-.065],.144,.240,shell);disc(o,[0,1.015,.046],.161,.027,green);
      for(let i=0;i<6;i++){const a=TAU*i/6+Math.PI/6;bolt(o,.125*Math.cos(a),1.015+.125*Math.sin(a),.064,.013);}
      block(o,[0,1.096,-.095],.205,.299,.116,shell);
      beam(o,[.021,1.141,-.126],[.192,1.285,-.126],.046,.095,green);
      const pointer=gauge(o,.202,1.257,-.083);
      nameplate(o,-.183,.438,.002,.202,.104,tx,'绳轨　07','#cec1a0','#35463a');
      const wheelPart=batch(o.g,0,1.015,.138,far?'Cabin return wheel':'Shore traversing wheel');wheel(wheelPart,.232,5,far?'#9d7251':'#a2604a');
      rod(wheelPart,[.176,-.112,.009],[.176,-.112,.081],.012,bronze);
      disc(wheelPart,[.176,-.112,.093],.023,.085,beech);
      for(const rr of [-.007,.024])ring(wheelPart,[.176,-.112,.099+rr],.023,.003,brass);
      grip(far?'far':'near',wheelPart.g,[-.194,.109,.003],[.176,-.112,.096]);
      const brake=batch(o.g,-.183,.823,.045,'Over-centre brake latch');
      disc(brake,[0,0,0],.037,.035,bronze);rod(brake,[0,.005,.010],[-.047,.183,.028],.012,steel);
      disc(brake,[-.047,.185,.032],.020,.063,red,'x');
      for(const xx of [-.170,.170]){disc(o,[xx,.676,-.13],.127,.013,bronze,'x');}
      return {o:o.g,wheel:wheelPart.g,pointer,brake:brake.g};
    }
    // The torque shafts and grips lie half a metre ahead of each player's standing point.
    const near=dialStand(root,'Onshore directional capstan',-2.66,-2.294,0,false);
    const far=dialStand(car,'Basket compensating capstan',-1.68,1.622,Math.PI,true);
    const winchRun=batch(root,0,0,0,'Shore return and traverse wire');
    hose(winchRun,[[-2.81,.660,-2.43],[-3.06,.637,-2.43],[-3.40,.63,-2.46],[-3.58,.72,-2.62],[-3.63,1.05,-2.90]],.012,steel,16);
    rod(winchRun,[-3.63,1.05,-2.90],[-3.66,6.45,-6.11],.012,'#8c9186');
    for(const [x,y,z] of [[-3.57,.76,-2.67],[-3.64,6.47,-6.11]]){
      disc(winchRun,[x,y,z],.093,.087,bronze,'x');ring(winchRun,[x+.044,y,z],.085,.009,gun,0,Math.PI/2);}
    rod(winchRun,[-3.47,6.470,-5.924],[3.47,6.470,-5.924],.011,steel);
    rod(winchRun,[-3.49,6.355,-5.913],[3.48,6.355,-5.913],.010,'#726f61');
    const bar=batch(root,0,1.28,-3.82,'Double-handed swinging crossbar');
    disc(bar,[0,0,0],.021,.646,steel,'x');
    disc(bar,[0,0,0],.032,.075,bronze,'x');
    for(const x of [-.036,.036])disc(bar,[x,0,0],.033,.007,brass,'x');
    for(const sign of [-1,1]){
      const x=sign*.182;
      // Burnished turned grips, bound at the ferrules. Hand centres are the actual centres of the two sleeves.
      const profile=[[.020,-.095],[.028,-.090],[.032,-.077],[.035,-.043],[.036,.030],[.032,.076],[.027,.087],[.020,.092]];
      const lathe=own(new T.LatheGeometry(profile.map(t=>new T.Vector2(...t)),24));
      part(bar,lathe,sign<0?'#8f6845':'#a1784f',[x,0,0],[1,1,1],[0,0,Math.PI/2],dull);
      for(const dx of [-.090,.089])disc(bar,[x+dx,0,0],.030,.014,brass,'x');
      for(let j=-3;j<=3;j++)ring(bar,[x+j*.014,0,0],.0342,.0019,'#67513b',0,Math.PI/2);
      disc(bar,[sign*.308,0,0],.036,.032,gun,'x');disc(bar,[sign*.323,0,0],.025,.010,brass,'x',hex);
      const u=sign*.292;bracePlate(bar,u,.047,-.012,.053,.082,.022,steel,.013);
      ring(bar,[u,.090,0],.027,.009,bronze);disc(bar,[u,.059,.002],.012,.035,gun,'z',hex);
      hose(bar,[[u-.019,.136,0],[u-.023,.115,.004],[u-.016,.094,.006],[u,.090,.005],[u+.020,.102,.002],[u+.023,.122,-.002],[u+.012,.157,-.004],[u,.168,0]],.007,steel,18);
      rod(bar,[u-.019,.137,0],[u+.011,.156,-.004],.004,caution);
    }
    grip('bar',bar.g,[-.182,0,0],[.182,0,0]);
    // Inboard catch for a jointed tide board. The two spring jaws close round the board after it reaches the shoe.
    const rack=batch(car,-1.72,0,-1.04,'Tide staff shoe and spring clips');rack.g.rotation.y=Math.PI/2;
    block(rack,[0,.035,-.015],.319,.067,.234,shell);for(const x of [-.108,.108])for(const z of [-.080,.058])bolt(rack,x,.068,z,.012,'y');
    block(rack,[0,.612,-.063],.158,1.06,.042,green);block(rack,[0,.555,-.094],.074,1.02,.046,shell);
    for(const yy of [.29,.91]){
      bracePlate(rack,0,yy,-.044,.194,.142,.027,green,.026);
      boltGrid(rack,0,yy,-.008,.144,.091,.008);
    }
    block(rack,[0,.229,.023],.163,.025,.126,bronze);for(const x of [-.081,.081])block(rack,[x,.254,.031],.014,.060,.107,bronze);
    block(rack,[0,.263,.077],.171,.045,.018,brass);
    const clips=[];
    for(const sign of [-1,1]){
      const jaw=batch(rack.g,sign*.095,.832,-.009,'Spring staff retainer');
      ring(jaw,[0,0,0],.023,.005,brass,Math.PI/2);disc(jaw,[0,-.005,0],.015,.083,bronze,'y');
      hose(jaw,[[0,.004,0],[-sign*.001,.007,.039],[-sign*.007,.008,.078],[-sign*.029,.008,.090],[-sign*.050,.008,.088]],.008,brass,15);
      bulb(jaw,-sign*.050,.008,.088,[.013,.021,.013],rubber);clips.push(jaw.g);
    }
    nameplate(rack,0,1.073,-.035,.157,.066,'潮　尺','','#b7ac89','#38443a');
    grip('rack',rack.g,[-.066,.819,.071],[.066,.848,.071]);
    const staff=batch(root,0,0,0,'Three-leaf folding tide staff');
    const leafHeight=.804,leafWidth=.100;
    const staffMap=map(236,1136,(c,w,h)=>{
      c.fillStyle='#e7dfc2';c.fillRect(0,0,w,h);const r=rng(3262);
      for(let i=0;i<6400;i++){c.fillStyle=i%2?'rgba(96,79,58,.14)':'rgba(251,247,216,.26)';c.fillRect(r()*w,r()*h,.7+r()*3,.8+r()*5);}
      for(let d=0;d<8;d++){
        const y=d*h/8,hh=h/8;c.fillStyle=d%2?'#bf5747':'#435749';c.fillRect(15,y+4,17,hh-5);
        for(let j=0;j<5;j++)c.fillRect(31,y+4+j*hh*.2,j===0||j===4?91:59,hh*.085);
        c.fillStyle='#4b5648';c.font='bold 58px serif';c.textAlign='right';c.fillText(String(8-d),w-19,y+hh*.65);
      }
      c.fillStyle='#9b8866';c.fillRect(3,0,3,h);c.fillRect(w-9,0,4,h);
    });
    const faceMat=own(new T.MeshStandardMaterial({map:staffMap,roughness:.44,metalness:.14,emissive:0x191b13,emissiveIntensity:.16}));
    function blade(o,back){
      block(o,[0,leafHeight*.5,0],leafWidth,leafHeight,.020,oldWhite);
      const jcount=8;for(let i=0;i<jcount;i++){
        if(i%2===0)block(o,[0,(i+.5)*leafHeight/jcount,.001],leafWidth+.001,.100,.023,red);
      }
      for(const x of [-.049,.049])block(o,[x,leafHeight*.50,.011],.005,leafHeight,.004,scar);
      if(!back){const f=new T.Mesh(own(new T.PlaneGeometry(.092,leafHeight-.038)),faceMat);f.position.set(0,leafHeight*.5,.013);o.g.add(f);}
      for(const yy of [.018,leafHeight-.016]){block(o,[0,yy,-.002],.104,.023,.024,bronze);for(const x of [-.034,.034])disc(o,[x,yy,.013],.006,.006,brass,'z',hex);}
    }
    blade(staff,false);
    const middle=batch(staff.g,0,leafHeight,-.014,'Upper rule joint');blade(middle,true);
    const rear=batch(middle.g,0,leafHeight,-.014,'Lower return joint');blade(rear,true);
    for(const [o,yy] of [[staff,leafHeight],[middle,leafHeight],[rear,.0]]){
      for(const x of [-.034,.034])disc(o,[x,yy,-.010],.013,.025,brass,'x');
    }
    // Five-metre working lines: a three-lobed section, twisted texture and mild normal relief remain visible in the close camera.
    const ropePhoto=map(256,256,(c,w,h)=>{
      const r=rng(539);c.fillStyle='#ad986e';c.fillRect(0,0,w,h);
      for(let k=-23;k<47;k++){
        const xx=k*12;const grad=c.createLinearGradient(xx,0,xx+11,0);grad.addColorStop(0,'#736546');grad.addColorStop(.18,'#94805a');grad.addColorStop(.49,'#c1b189');grad.addColorStop(.70,'#cabe99');grad.addColorStop(1,'#8e7d58');
        c.fillStyle=grad;c.save();c.transform(1,0,-.48,1,0,0);c.fillRect(xx,0,12,h);c.restore();
      }
      for(let i=0;i<10800;i++){const xx=r()*w,yy=r()*h;c.strokeStyle=i%4?'rgba(65,57,40,.25)':'rgba(255,241,186,.49)';c.lineWidth=.50+r()*.6;c.beginPath();c.moveTo(xx,yy);c.lineTo(xx-1-r()*3,yy+2+r()*7);c.stroke();}
    });
    ropePhoto.wrapS=ropePhoto.wrapT=T.RepeatWrapping;
    const ropeM=own(new T.MeshStandardMaterial({color:'#dccda4',map:ropePhoto,bumpMap:ropePhoto,bumpScale:.0017,roughness:.84,metalness:.035}));
    function workingLine(sign){
      const levels=50,sectors=12,count=(levels+1)*(sectors+1),pos=new Float32Array(count*3),norm=new Float32Array(count*3),uv=new Float32Array(count*2),ids=[];
      for(let i=0;i<=levels;i++)for(let j=0;j<=sectors;j++){
        const k=i*(sectors+1)+j;uv[2*k]=j/sectors;uv[2*k+1]=i/levels*13;
        if(i<levels&&j<sectors){const a=k,b=k+1,c=a+sectors+1;ids.push(a,b,c,b,c+1,c);}
      }
      const geo=own(new T.BufferGeometry()),p=new T.BufferAttribute(pos,3),n=new T.BufferAttribute(norm,3);
      p.setUsage(T.DynamicDrawUsage);n.setUsage(T.DynamicDrawUsage);geo.setAttribute('position',p);geo.setAttribute('normal',n);geo.setAttribute('uv',new T.BufferAttribute(uv,2));geo.setIndex(ids);
      const mesh=new T.Mesh(geo,ropeM);mesh.castShadow=true;mesh.receiveShadow=true;mesh.frustumCulled=false;mesh.name=sign<0?'Port laid hemp rope':'Starboard laid hemp rope';root.add(mesh);
      const sleeve=batch(root,0,0,0,'Spliced linen and bronze upper collar');
      disc(sleeve,[0,.073,0],.028,.146,'#aa9871','y');
      for(let i=0;i<10;i++)ring(sleeve,[0,.014+i*.012,0],.028,.0025,i%3===0?'#756b51':'#c5b58c',Math.PI/2);
      disc(sleeve,[0,.146,0],.029,.012,bronze,'y');
      const guard=batch(root,0,0,0,'Lower leather chafe guard');
      disc(guard,[0,.072,0],.029,.144,'#795f46','y');
      for(const j of [0,.012,.115,.127])ring(guard,[0,.008+j,0],.029,.0034,'#bb9d71',Math.PI/2);
      const a=v(),b=v(),tan=v(),aside=v(),other=v(),ax=v(1,0,0),delta=v(),bend=v();
      const pa=v(sign*.206,-.094,0),pb=v(sign*.292,.167,0);
      function updateLine(t,taut){
        a.copy(pa).applyQuaternion(pend.g.quaternion).add(pend.g.position).add(truck.g.position);
        b.copy(pb).applyQuaternion(bar.g.quaternion).add(bar.g.position);
        delta.subVectors(b,a);
        const loose=1-clamp(taut);bend.set(.012*sign+loose*(.12+.066*Math.sin(t*.87+sign*.4)),loose*-.075,.027+loose*.105*Math.cos(t*.70+.22*sign));
        const roll=.4*sign+.06*Math.sin(t*.56);
        for(let i=0;i<=levels;i++){
          const u=i/levels,k=4*u*(1-u);tan.copy(delta).addScaledVector(bend,4*(1-2*u)).normalize();
          // Horizontal rail keeps the line frames away from the X-axis singularity.
          aside.crossVectors(tan,ax).normalize();other.crossVectors(tan,aside).normalize();
          const xx=a.x+u*delta.x+k*bend.x,yy=a.y+u*delta.y+k*bend.y,zz=a.z+u*delta.z+k*bend.z;
          for(let j=0;j<=sectors;j++){
            const ang=j*TAU/sectors,lay=ang*3-TAU*14*u+roll;
            const radius=.0197*(1+.092*Math.cos(lay)),twist=.17*Math.sin(lay),as=Math.cos(ang),bs=Math.sin(ang),an=Math.cos(ang+twist),bn=Math.sin(ang+twist);
            const idx=i*(sectors+1)+j;
            p.setXYZ(idx,xx+radius*(aside.x*as+other.x*bs),yy+radius*(aside.y*as+other.y*bs),zz+radius*(aside.z*as+other.z*bs));
            n.setXYZ(idx,aside.x*an+other.x*bn,aside.y*an+other.y*bn,aside.z*an+other.z*bn);
          }
        }
        p.needsUpdate=n.needsUpdate=true;
        tan.copy(delta).addScaledVector(bend,4).normalize();sleeve.g.position.copy(a);sleeve.g.quaternion.setFromUnitVectors(up,tan);
        tan.copy(delta).addScaledVector(bend,-4).normalize().negate();guard.g.position.copy(b);guard.g.quaternion.setFromUnitVectors(up,tan);
      }
      return updateLine;
    }
    const ropes=[workingLine(-1),workingLine(1)];
    const transit=batch(car,-1.68,0,1.622,'Return guide on basket edge');
    hose(transit,[[-.148,.665,.13],[-.30,.653,.145],[-.42,.533,.065],[-.467,.455,-.081]],.012,steel,20);
    const travellerCable=(()=>{
      const seg=20,side=6,pA=new Float32Array((seg+1)*side*3),nA=new Float32Array(pA.length),ids=[];
      for(let i=0;i<seg;i++)for(let j=0;j<side;j++){const a=i*side+j,b=i*side+(j+1)%side;ids.push(a,b,a+side,b,b+side,a+side);}
      const g=own(new T.BufferGeometry()),p=new T.BufferAttribute(pA,3),n=new T.BufferAttribute(nA,3);p.setUsage(T.DynamicDrawUsage);n.setUsage(T.DynamicDrawUsage);g.setAttribute('position',p);g.setAttribute('normal',n);g.setIndex(ids);
      const cable=new T.Mesh(g,own(new T.MeshStandardMaterial({color:'#91978a',metalness:.55,roughness:.53})));cable.name='Moving cabin return wire';cable.frustumCulled=false;root.add(cable);
      const a=v(-3.56,6.40,-5.916),b=v(),delta=v(),tan=v(),sideA=v(),sideB=v(),sag=v(),ax=v(1,0,0);
      return ()=>{
        b.set(car.position.x-2.147,car.position.y+.455,car.position.z+1.541);delta.subVectors(b,a);
        for(let i=0;i<=seg;i++){
          const u=i/seg,k=4*u*(1-u),dx=-.38,dy=-Math.min(.36,delta.length()*.033),dz=.04;
          sag.set(dx,dy,dz);tan.copy(delta).addScaledVector(sag,4*(1-2*u)).normalize();sideA.crossVectors(tan,ax).normalize();sideB.crossVectors(tan,sideA);
          for(let j=0;j<side;j++){const c=Math.cos(TAU*j/side),s=Math.sin(TAU*j/side),idx=i*side+j;
            const nx=sideA.x*c+sideB.x*s,ny=sideA.y*c+sideB.y*s,nz=sideA.z*c+sideB.z*s;
            n.setXYZ(idx,nx,ny,nz);p.setXYZ(idx,a.x+delta.x*u+dx*k+.008*nx,a.y+delta.y*u+dy*k+.008*ny,a.z+delta.z*u+dz*k+.008*nz);
          }
        }p.needsUpdate=n.needsUpdate=true;
      };
    })();
    // The packet at the receiving end is a world-space printed original with an intentionally blank address field.
    const mail=batch(root,0,0,0,'Bridgehead dispatch cabinet');
    block(mail,[0,.060,-.015],.823,.119,.524,gun);block(mail,[0,.531,-.016],.792,.841,.481,shell);
    for(const x of [-.376,.376]){
      block(mail,[x,.539,.224],.043,.858,.045,green);
      for(const y of [.173,.868])bolt(mail,x,y,.249,.014);
    }
    bracePlate(mail,0,.395,.222,.698,.486,.020,green,.023);
    for(const x of [-.279,.279])for(const y of [.205,.552])bolt(mail,x,y,.251,.010);
    nameplate(mail,0,.461,.246,.339,.132,'岸务寄件','封存件　／　北岬','#c6ba93','#374b3f');
    for(let i=0;i<5;i++){block(mail,[-.146+i*.072,.304,.244],.042,.008,.009,gun);}
    // A deep cast frame surrounds the dark slot. Both channel rails extend from the throat as the drawer opens.
    block(mail,[0,.983,-.014],.835,.085,.529,green);block(mail,[0,1.034,-.012],.853,.031,.542,bronzeDark);
    block(mail,[0,.808,.225],.686,.228,.018,gun);
    for(const x of [-.336,.336]){
      block(mail,[x,.803,.250],.021,.226,.046,bronze);block(mail,[x,.685,.250],.039,.024,.058,brass);}
    for(const yy of [.690,.921])block(mail,[0,yy,.254],.678,.021,.044,green);
    const drawerSlide=batch(mail.g,0,.764,0,'Twin telescopic dispatch rails');
    for(const x of [-.279,.279]){block(drawerSlide,[x,-.009,.075],.038,.062,.415,steel);block(drawerSlide,[x+.009,.020,.084],.012,.012,.426,brass);}
    const drawer=batch(mail.g,0,.764,0,'Register drawer');
    block(drawer,[0,.018,.011],.611,.036,.469,'#686752');
    for(const x of [-.306,.306]){block(drawer,[x,.047,.012],.018,.090,.470,green);block(drawer,[x,.092,.019],.021,.009,.471,brass);}
    bracePlate(drawer,0,.042,.237,.652,.190,.023,green,.018);boltGrid(drawer,0,.051,.269,.571,.112,.010);
    for(const x of [-.291,-.100]){plate(drawer,[x,.035,.260],.047,.052,.006,.005,bronze);disc(drawer,[x,.038,.280],.012,.020,brass);}
    hose(drawer,[[-.291,.033,.266],[-.291,.031,.309],[-.267,.012,.324],[-.123,.012,.324],[-.100,.031,.309],[-.100,.033,.266]],.009,brass,24);
    grip('drawer',drawer.g,[-.265,.014,.324],[-.125,.014,.324]);
    const packet=batch(drawer.g,0,.059,.158,'Folded lower copy in dispatch tray');
    block(packet,[0,.004,-.109],.392,.009,.257,'#b3a88a');block(packet,[.014,.012,-.105],.361,.007,.243,'#bdb294');
    const report=batch(drawer.g,0,.083,.199,'North Cape survey correction dispatch');
    const paperInk=map(1200,875,(c,w,h)=>{
      const r=rng(37281);c.fillStyle='#dfcfaa';c.fillRect(0,0,w,h);
      const darkEdge=c.createRadialGradient(w*.47,h*.47,73,w*.49,h*.53,w*.69);darkEdge.addColorStop(0,'rgba(248,237,196,.16)');darkEdge.addColorStop(.77,'rgba(162,140,89,.04)');darkEdge.addColorStop(1,'rgba(104,86,56,.39)');c.fillStyle=darkEdge;c.fillRect(0,0,w,h);
      for(let i=0;i<18000;i++){c.fillStyle=i%4?'rgba(89,76,51,.10)':'rgba(255,250,220,.25)';c.fillRect(r()*w,r()*h,1+r()**2*5,.5+r()*1.4);}
      c.strokeStyle='#797e65';c.lineWidth=3;c.strokeRect(35,29,w-70,h-60);c.lineWidth=1.5;c.strokeRect(45,39,w-90,h-80);
      c.fillStyle='#445449';c.font='bold 33px serif';c.fillText('北岬海务站　　寄递联',87,113);
      c.textAlign='right';c.font='27px monospace';c.fillText('N.C. / 07',w-91,111);
      c.textAlign='center';c.fillStyle='#344438';c.font='bold 101px serif';c.fillText('北岬航测更正',w*.5,290,w-174);
      c.strokeStyle='#636f5a';c.lineWidth=4;c.beginPath();c.moveTo(98,353);c.lineTo(w-98,353);c.stroke();
      c.textAlign='left';c.font='bold 66px serif';c.fillText('收件人',276,476);c.strokeStyle='#515d4e';c.lineWidth=3;c.beginPath();c.moveTo(504,483);c.lineTo(w-146,483);c.stroke();
      c.fillStyle='#415446';c.font='bold 55px serif';c.textAlign='right';c.fillText('附双轨值班记录',w-106,665);c.textAlign='left';
      c.font='25px monospace';c.fillStyle='#75816e';c.fillText('桥头寄件柜　／　留转原件',112,763);
      c.save();c.translate(965,731);c.rotate(-.081);c.strokeStyle='rgba(139,76,58,.77)';c.lineWidth=4;c.strokeRect(-92,-37,184,74);c.fillStyle='rgba(139,76,58,.8)';c.font='bold 38px serif';c.textAlign='center';c.fillText('转　递',0,14);c.restore();
      c.strokeStyle='rgba(123,100,65,.23)';c.lineWidth=2;c.beginPath();c.moveTo(51,h*.58);c.lineTo(w-40,h*.579);c.stroke();
    });
    const pg=(()=>{
      const cols=28,rows=17,pts=[],uv=[],ind=[];
      const W=.494,H=.352;
      for(let j=0;j<=rows;j++)for(let i=0;i<=cols;i++){
        const u=i/cols,t=j/rows;
        const lift=.003*Math.sin(Math.PI*t)+.008*Math.pow(t,6)*Math.pow(u,5)+.003*Math.sin(Math.PI*u)*Math.exp(-Math.pow((t-.38)/.061,2));
        pts.push((u-.5)*W,lift,-t*H);uv.push(u,t);
        if(i<cols&&j<rows){const a=j*(cols+1)+i,b=a+1,c=a+cols+1;ind.push(a,b,c,b,c+1,c);}
      }
      const g=own(new T.BufferGeometry());g.setAttribute('position',new T.Float32BufferAttribute(pts,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ind);g.computeVertexNormals();return g;
    })();
    const paperSurface=new T.Mesh(pg,own(new T.MeshStandardMaterial({map:paperInk,side:T.DoubleSide,roughness:.79,metalness:0,emissive:0x231f14,emissiveIntensity:.25})));
    paperSurface.castShadow=paperSurface.receiveShadow=true;report.g.add(paperSurface);
    // The right-hand margin includes two spring-loaded linen tabs. Both reading hands clear the printed address.
    for(const [yy,x0] of [[-.045,.245],[-.175,.247]]){
      block(report,[x0,.007,yy],.044,.012,.036,bronze);
      block(report,[x0+.024,.008,yy],.038,.008,.023,'#868267');
      for(const xx of [-.008,.005])disc(report,[x0+xx,.014,yy],.0045,.003,brass,'y');
    }
    grip('paper',report.g,[.251,.013,-.165],[.259,.013,-.041]);
    // Both workers can stay inboard of the rack. A short delivery yoke and a separate spring-pin lever act on the same shoe.
    hose(rack,[[.094,.428,-.04],[.175,.417,.02],[.184,.383,.243],[.184,.395,.526]],.017,green,14);
    rod(rack,[.182,.401,.526],[.182,.751,.526],.021,green);
    rod(rack,[.182,.696,.499],[.182,.696,.075],.014,bronze);
    const tripPin=batch(rack.g,.182,.760,.523,'Outboard clasp remote lever');
    disc(tripPin,[0,0,0],.037,.037,bronze,'x');rod(tripPin,[0,.024,0],[-.04,.159,.059],.012,steel);
    rod(tripPin,[-.097,.159,.061],[.023,.159,.061],.014,beech);
    grip('clip',tripPin.g,[-.084,.159,.061],[.014,.159,.061]);
    const feeder=batch(rack.g,-.102,.588,.298,'Folding rule feed yoke');
    rod(feeder,[0,0,0],[0,.217,.097],.018,bronze);rod(feeder,[0,.217,.097],[-.155,.217,.097],.015,beech);
    grip('rack',feeder.g,[-.146,.217,.097],[-.016,.217,.097]);
    for(const o of templates)finish(o);templates.clear();
    for(const [src,plain] of repeatGeo)for(const g of [src,plain])if(resources.delete(g))g.dispose();
    repeatGeo.clear();torusCache.clear();
    let disposed=false;
    const get=(n,f=0)=>Number.isFinite(n)?n:f,smooth=t=>t*t*(3-2*t),q0=new T.Quaternion(),q1=new T.Quaternion(),e0=new T.Euler(),stowPos=v(),fromPos=v();
    function position(out,obj,fx,fy,fz){return out.set(get(obj?.x??obj?.[0],fx),get(obj?.y??obj?.[1],fy),get(obj?.z??obj?.[2],fz));}
    function update(s={},time=0){
      if(disposed)return;
      const rail=clamp(get(s.rail),-2.34,2.34),ang=get(s.angle,.785);
      position(truck.g.position,s.anchor,rail,6.25,-6.12);position(car.position,s.car,-.50,-.08,-13.08);
      position(bar.g.position,s.grip,truck.g.position.x,truck.g.position.y-5.6*Math.cos(ang),truck.g.position.z+5.6*Math.sin(ang));
      const bearing=Math.atan2(truck.g.position.z-bar.g.position.z,truck.g.position.y-bar.g.position.y);
      bar.g.rotation.x=bearing;pend.g.rotation.x=bearing;
      const spin=get(s.spin,rail*3.86),taut=typeof s.occupied==='number'?clamp(s.occupied):s.occupied?1:0,braking=clamp(Math.abs(get(s.railV))*1.5);
      near.wheel.rotation.z=-spin;far.wheel.rotation.z=spin;
      // Both local dials are marked in the same global rail coordinate; the facing handwheels counter-rotate.
      near.pointer.rotation.z=far.pointer.rotation.z=-(rail/2.3)*116*Math.PI/180;
      near.brake.rotation.z=.13+.25*braking;far.brake.rotation.z=.13+.25*braking;
      for(const line of ropes)line(get(time),taut);
      travellerCable();
      const stow=clamp(get(s.stow)),t=smooth(stow),from=s.staffFrom;
      staff.g.visible=s.staffVisible!==false&&(!!from||stow>0||!!s.stowed);
      const finalX=car.position.x-1.72+.034,finalY=car.position.y+.244,finalZ=car.position.z-1.04;
      stowPos.set(finalX,finalY,finalZ);
      const yaw=get(from?.yaw??from?.[3]);const cx=get(from?.x??from?.[0],finalX+.31),cy=get(from?.y??from?.[1],car.position.y),cz=get(from?.z??from?.[2],finalZ+.14);
      // staffFrom is the carrier's local feet. At rest the nested leaves run from the hip toward the left shoulder.
      const offX=from?-.217:0,offZ=from?-.055:0;
      fromPos.set(cx+offX*Math.cos(yaw)+offZ*Math.sin(yaw),cy+.741,cz-offX*Math.sin(yaw)+offZ*Math.cos(yaw));
      staff.g.position.copy(fromPos).lerp(stowPos,t);staff.g.position.y+=.183*Math.sin(Math.PI*t);
      staff.g.position.x+=.093*Math.sin(Math.PI*t);
      q0.setFromEuler(e0.set(.065,yaw+Math.PI-.08,.15,'YXZ'));q1.setFromAxisAngle(up,Math.PI/2);
      staff.g.quaternion.copy(q0).slerp(q1,t);
      middle.g.rotation.x=-Math.PI+.052+.087*Math.sin(Math.PI*t);
      rear.g.rotation.x=Math.PI-.066-.075*Math.sin(Math.PI*t);
      const clasp=s.stowed?0:s.clip?1:smooth(clamp(stow/.20))*smooth(clamp((1-stow)/.12));
      clips.forEach((g,i)=>{g.rotation.y=(i?1:-1)*clasp*.81;});
      tripPin.g.rotation.x=-clasp*.55;feeder.g.rotation.x=-.17+.32*stow;
      mail.g.visible=!!s.mail;
      if(s.mail){position(mail.g.position,s.mail,0,0,0);mail.g.rotation.y=get(s.mail.yaw,0);}
      const dr=clamp(get(s.drawer)),pr=clamp(get(s.report));
      drawer.g.position.z=.483*smooth(dr);drawerSlide.g.position.z=.238*smooth(dr);
      const turn=smooth(pr);report.g.rotation.x=turn*1.055;report.g.position.y=.083+.128*turn+.022*Math.sin(Math.PI*turn);
      report.g.position.z=.199+.062*turn;
    }
    function hands(kind){
      if(disposed||((kind==='paper'||kind==='drawer')&&!mail.g.visible))return null;
      const entry=handParts.get(kind);if(!entry)return null;const pair=handCache.get(kind);
      entry[0].updateWorldMatrix(true,false);pair[0].copy(entry[1]);pair[1].copy(entry[2]);entry[0].localToWorld(pair[0]);entry[0].localToWorld(pair[1]);return pair;
    }
    update();root.updateWorldMatrix(true,true);
    return {update,hands,dispose(){if(disposed)return;disposed=true;if(root.parent)root.parent.remove(root);for(const r of resources)r.dispose();resources.clear();root.clear();}};
  }
  return {create};
})();
