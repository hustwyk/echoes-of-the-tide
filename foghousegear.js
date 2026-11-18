// North Cape fog signal house. Times are received from the chapter clock.
const TideFoghouseGear=(()=>{
  const T=THREE,TAU=2*Math.PI,clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
  const v=(x=0,y=0,z=0)=>new T.Vector3(x,y,z);
  function rng(seed){return ()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}
  function create(parent){
    const root=new T.Group();root.name='North Cape / fog-signal regulators';parent.add(root);
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
    const cream='#ddd3b6',linen='#beb69c',ebony='#403e35',amber='#c99157',teal='#698b79',ink='#3a4d46',wood='#80624a';
    const glaze=own(new T.MeshStandardMaterial({color:0xffffff,map:grain,vertexColors:true,roughness:.30,metalness:.20}));
    const bulbGeo=own(new T.SphereGeometry(1,18,10)),globs=new Map(),contacts=new Map();
    function ceramic(o,xyz,r,h,c){
      const points=[[.50,0],[.72,.08],[.89,.12],[.92,.25],[.55,.34],[.54,.58],[.92,.65],[1,.76],[.84,.86],[.49,.94],[.44,1]].map(([x,y])=>new T.Vector2(x*r,y*h));
      part(o,own(new T.LatheGeometry(points,24)),c,xyz,[1,1,1],[0,0,0],glaze);
    }
    function pair(kind,index,a,pa,b,pb){
      const key=kind+index;contacts.set(key,[a,v(...pa),b,v(...pb)]);globs.set(key,[v(),v()]);
    }
    function oval(o,pos,scale,col){part(o,bulbGeo,col,pos,scale,[0,0,0],glaze);}
    function grip(o,x,y,z,width){
      for(const a of [x-width*.5,x+width*.5]){rod(o,[a,y,z-.05],[a,y,z+.03],.013,p.chrome);disc(o,[a,y,z-.037],.023,.024,p.bronze);}
      rod(o,[x-width*.5,y,z+.037],[x+width*.5,y,z+.037],.018,p.marine);
    }
    function label(title,code){
      return map(600,126,(c,w,h)=>{c.fillStyle='#40544b';c.fillRect(0,0,w,h);c.strokeStyle='#abac8d';c.lineWidth=3;c.strokeRect(5,5,w-10,h-10);
        c.textAlign='left';c.fillStyle='#ded4b3';c.font='bold 37px sans-serif';c.fillText(title,26,54,w-52);c.fillStyle='#b8c5af';c.font='22px monospace';c.fillText(code,27,96,w-54);
        for(const x of [12,w-12])for(const y of [12,h-12]){c.fillStyle='#b8bba6';c.beginPath();c.arc(x,y,3.8,0,TAU);c.fill();}
      });
    }
    function jewel(o,x,y,z,r,c){
      disc(o,[x,y,z-.013],r*1.17,.030,p.gap);ring(o,[x,y,z+.002],r*1.03,.004,p.bronze);
      const m=own(new T.MeshStandardMaterial({color:c,emissive:c,emissiveIntensity:0,roughness:.23,metalness:.09}));
      const obj=new T.Mesh(bulbGeo,m);obj.position.set(x,y,z+.006);obj.scale.set(r,r,r*.49);o.g.add(obj);
      const off=new T.Color(c).multiplyScalar(.20),on=new T.Color(c);
      return val=>{const f=clamp(Number(val)||0);m.color.copy(off).lerp(on,.14+.75*f);m.emissiveIntensity=.02+f*1.49;};
    }
    function wheel(parent,pos,r,name){
      const o=batch(parent,...pos,name);
      ring(o,[0,0,0],r,.010,p.bronze);ring(o,[0,0,.008],r*.967,.003,p.chrome);
      for(let j=0;j<4;j++){const a=j*TAU/4;rod(o,[0,0,0],[r*.91*Math.cos(a),r*.91*Math.sin(a),0],r*.061,p.edge);}
      disc(o,[0,0,.001],r*.22,.034,p.chrome);disc(o,[r*.80,0,.035],.011,.079,p.bronze);disc(o,[r*.80,0,.073],.018,.074,ebony);return o;
    }
    function notchplate(o,x,y,z,r,start,span,n){
      for(let i=0;i<=n;i++){
        const a=start+span*i/n,major=i%4===0;block(o,[x+Math.sin(a)*r,y+Math.cos(a)*r,z],.004,major?.024:.013,.006,major?cream:p.edge,0,0,-a);
      }
    }
    const bronze='#b08a50',brass='#c5a771',copper='#b97c53',darkIron='#414b45',verdigris='#5a7767',biscuit='#e3d7b5';
    function skin(c,w,h,base,seed){
      const rr=rng(seed);c.fillStyle=base;c.fillRect(0,0,w,h);
      for(let i=0;i<12000;i++){c.fillStyle=i%3?'rgba(82,69,46,.075)':'rgba(251,250,215,.25)';c.fillRect(rr()*w,rr()*h,.6+rr()**2*3,.5+rr()**2*2);}
    }
    function slot(w,h){const can=document.createElement('canvas');can.width=w;can.height=h;const tx=own(new T.CanvasTexture(can));tx.colorSpace=T.SRGBColorSpace;tx.anisotropy=4;return {can,c:can.getContext('2d'),tx};}
    function cast(o,shape,pos,depth,col,bevel=.003){
      const geo=own(new T.ExtrudeGeometry(shape,{depth,bevelEnabled:bevel>0,bevelSize:bevel,bevelThickness:bevel,bevelSegments:1,curveSegments:16}));part(o,geo,col,pos);
    }
    function legStand(o,w,d,y,z=-.160){
      for(const x of [-.40*w,.40*w])for(const zz of [-.37*d,.37*d]){
        block(o,[x,y*.50,z+zz],.060,y,.056,p.deep);block(o,[x,.034,z+zz],.139,.062,.129,p.iron);bolt(o,x+.036,.070,z+zz,.011,'y');
      }
      for(const xx of [-.40*w,.40*w])rod(o,[xx,.235,z-.37*d],[xx,.235,z+.37*d],.019,p.edge);
      block(o,[0,y,z],w,.071,d,p.marine);block(o,[0,y+.011,z+d*.5+.009],w+.006,.021,.022,p.edge);
    }
    function keyPair(kind,a,pa,b,pb){pair(kind,0,a,pa,b,pb);}
    const rack=batch(root,-4.90,0,4.08,'Square cam key cabinet');
    for(const x of [-.193,.193]){block(rack,[x,.035,-.027],.141,.065,.291,p.iron);block(rack,[x,.653,-.085],.051,1.240,.085,verdigris);bolt(rack,x,.074,.062,.012,'y');}
    plate(rack,[0,1.149,-.171],.510,.438,.136,.035,wood);
    plate(rack,[0,1.149,-.029],.488,.415,.024,.026,p.deep);
    boltGrid(rack,0,1.149,.002,.426,.351,.010);
    for(const x of [-.084,.084]){rod(rack,[x,1.143,-.014],[x,1.143,.112],.010,p.bronze);rod(rack,[x,1.143,.112],[x,1.164,.109],.010,p.chrome);}
    plate(rack,[.008,1.189,-.002],.121,.117,.019,.008,p.iron);
    for(const x of [-.031,.031])block(rack,[.008+x,1.189,.021],.014,.071,.009,bronze);
    for(const y of [-.030,.030])block(rack,[.008,1.189+y,.021],.066,.014,.009,bronze);
    block(rack,[.008,1.189,.018],.044,.044,.002,p.gap);
    texPlane(rack.g,0,1.010,.004,.362,.077,label('调速凸轮方钥','C-11   /   CAM KEY'));
    const keyCarrier=group(root,0,0,0,'Carried cam key');
    const key=batch(root,0,0,0,'Machined square-drive cam key');
    // The stem enters along -Z; the triangular bow is actually pierced.
    block(key,[0,0,-.060],.044,.044,.217,bronze);block(key,[0,0,-.141],.038,.038,.068,brass);
    disc(key,[0,0,.024],.040,.033,brass);ring(key,[0,0,.039],.034,.004,p.chrome);
    const bow=shape(.194,.092,.023),hole=shape(.109,.037,.014);
    bow.holes.push(new T.Path(hole.getPoints(20)));
    cast(key,bow,[0,0,.046],.025,brass,.003);
    for(const x of [-.073,.073])disc(key,[x,0,.074],.010,.009,p.chrome,'z',hex);
    grip(rack,-.057,.914,.062,.143);
    keyPair('rack',rack.g,[-.057,.914,.099],key.g,[.048,0,.071]);
    keyPair('carry',key.g,[-.016,0,-.048],key.g,[.046,.003,.073]);
    // Multi-plate friction clutch; free drum, pressure pack and toggle are separate rigid moving assemblies.
    const clutch=batch(root,1.55,0,3.15,'Carrier friction clutch');
    for(const xx of [-.345,.345])for(const zz of [-.226,.138]){
      block(clutch,[xx,.038,zz],.151,.070,.148,p.iron);bolt(clutch,xx+.044,.078,zz,.015,'y');rod(clutch,[xx,.080,zz],[xx*.67,.872,zz],.046,p.marine);
    }
    for(const zz of [-.226,.138]){rod(clutch,[-.319,.284,zz],[.319,.284,zz],.026,p.edge);plate(clutch,[0,.838,zz-.026],.467,.162,.054,.020,p.deep);}
    const free=batch(clutch.g,0,.925,-.061,'Friction drum and worm');
    disc(free,[0,0,0],.144,.282,p.damp);for(const zz of [-.150,.152]){disc(free,[0,0,zz],.180,.016,p.marine);ring(free,[0,0,zz+.009],.172,.006,p.bronze);}
    const rope=[];for(let j=0;j<=190;j++){const t=j/190,a=t*TAU*14;rope.push([.144*Math.sin(a),.144*Math.cos(a),-.139+t*.277]);}hose(free,rope,.008,'#8c7658',190);
    const pack=batch(clutch.g,0,.925,.112,'Clutch pressure and friction plates');
    for(let j=0;j<5;j++){disc(pack,[0,0,j*.017],.133+j%2*.012,.012,j%2?p.edge:p.oxide);ring(pack,[0,0,j*.017+.007],.131+j%2*.012,.003,bronze);}
    disc(pack,[0,0,.087],.052,.039,p.chrome,'z',hex);
    const lever=batch(clutch.g,.239,.940,.145,'Clutch over-centre toggle');
    disc(lever,[0,0,.002],.052,.039,p.bronze);rod(lever,[0,0,.025],[.041,.184,.057],.016,p.chrome);
    disc(lever,[.041,.184,.082],.027,.069,ebony);
    grip(clutch,-.229,.870,.172,.128);
    plate(clutch,[0,.632,.117],.352,.104,.030,.008,p.marine);
    texPlane(clutch.g,0,.632,.154,.321,.077,label('转盘摩擦离合','TRANSFER   /   CLUTCH'));
    keyPair('clutch',clutch.g,[-.229,.870,.209],lever.g,[.041,.184,.085]);
    const gov=batch(root,-3.40,0,-7.16,'Optical fog-signal governor');
    legStand(gov,1.271,.625,.758,-.150);
    plate(gov,[.030,1.248,-.338],1.119,.982,.349,.066,verdigris);
    plate(gov,[.030,1.248,.020],1.099,.960,.029,.054,p.deep);boltGrid(gov,.030,1.248,.056,.998,.860,.018);
    const cx=.130,cy=1.294,R=.351;
    disc(gov,[cx,cy,.068],R+.036,.051,p.iron);ring(gov,[cx,cy,.095],R+.029,.013,brass);
    for(let i=0;i<36;i++){const a=TAU*i/36;block(gov,[cx+Math.sin(a)*(R+.025),cy+Math.cos(a)*(R+.025),.111],.004,i%3?.010:.018,.006,i%3?p.edge:biscuit,0,0,-a);}
    const cam=batch(gov.g,cx,cy,.113,'Profiled timing cam and occulting sector');
    const camShape=new T.Shape(),phaseNotch=.30;
    function radiusFor(f){
      const dist=Math.abs(((f-phaseNotch+.5+1)%1)-.5);
      if(dist>=.025)return R;
      if(dist<.012)return R-.033;
      return R-.033*(1-(dist-.012)/.013);
    }
    for(let i=0;i<=240;i++){const f=i/240,a=TAU*f,r=radiusFor(f),x=r*Math.sin(a),y=r*Math.cos(a);if(i===0)camShape.moveTo(x,y);else camShape.lineTo(x,y);}camShape.closePath();
    cast(cam,camShape,[0,0,0],.023,'#958a6d',.0027);
    const dialFace=map(900,900,(c,w,h)=>{
      const rand=rng(712),o=w/2;
      c.save();c.beginPath();c.arc(o,o,o,0,TAU);c.clip();skin(c,w,h,'#a8ac91',713);
      const metal=c.createLinearGradient(0,0,w,h);metal.addColorStop(0,'rgba(249,237,175,.26)');metal.addColorStop(.40,'rgba(109,117,94,.04)');metal.addColorStop(.77,'rgba(81,88,76,.25)');metal.addColorStop(1,'rgba(240,230,191,.14)');c.fillStyle=metal;c.fillRect(0,0,w,h);
      for(let j=0;j<150;j++){c.strokeStyle=j%2?'rgba(71,83,70,.1)':'rgba(233,233,199,.17)';c.lineWidth=.72;c.beginPath();c.arc(o,o,25+j*2.75,0,TAU);c.stroke();}
      const px=(f,r)=>[o+Math.sin(TAU*f)*r,o-Math.cos(TAU*f)*r];
      for(let j=0;j<100;j++){
        const major=j%10===0,f=j/100,inner=major?.84:.895,[x,y]=px(f,inner*o),[xx,yy]=px(f,.939*o);
        c.strokeStyle=major?'#43544b':'#58665b';c.lineWidth=major?4:1.8;c.beginPath();c.moveTo(x,y);c.lineTo(xx,yy);c.stroke();
        if(major){const [tx,ty]=px(f,.761*o);c.save();c.translate(tx,ty);c.rotate(TAU*f);c.fillStyle='#425249';c.font='bold 36px monospace';c.textAlign='center';c.fillText(String(j).padStart(2,'0'),0,13);c.restore();}
      }
      for(let j=0;j<190;j++){const x=rand()*w,y=rand()*h;c.strokeStyle='rgba(79,78,60,.19)';c.beginPath();c.moveTo(x,y);c.lineTo(x+rand()*18,y+rand()*2);c.stroke();}c.restore();
    });
    const m=own(new T.MeshStandardMaterial({map:dialFace,roughness:.41,metalness:.33}));
    const diskFace=new T.Mesh(own(new T.CircleGeometry(R-.041,96)),m);diskFace.position.z=.026;cam.g.add(diskFace);
    function sectorShape(lo,hi,inner,outer){
      const q=new T.Shape();function p(f,r){return [Math.sin(f*TAU)*r,Math.cos(f*TAU)*r];}
      q.moveTo(...p(lo,inner));q.lineTo(...p(lo,outer));
      for(let j=1;j<=54;j++)q.lineTo(...p(lo+(hi-lo)*j/54,outer));
      q.lineTo(...p(hi,inner));for(let j=53;j>=0;j--)q.lineTo(...p(lo+(hi-lo)*j/54,inner));q.closePath();return q;
    }
    cast(cam,sectorShape(.43,.83,.167,.307),[0,0,.028],.009,'#343a34',.0018);
    for(const f of [.43,.83]){
      const a=TAU*f;rod(cam,[.166*Math.sin(a),.166*Math.cos(a),.041],[.311*Math.sin(a),.311*Math.cos(a),.041],.004,biscuit);
    }
    for(const f of [.442,.817]){
      const a=TAU*f;bolt(cam,.280*Math.sin(a),.280*Math.cos(a),.042,.006);
    }
    // The prelight insert follows the actual recess in the outer circumference.
    cast(cam,sectorShape(.289,.311,.285,.315),[0,0,.028],.014,copper,.0018);
    for(const [i,f] of [.26,.69].entries()){
      const a=f*TAU,xx=.225*Math.sin(a),yy=.225*Math.cos(a);
      disc(cam,[xx,yy,.045],.028,.010,i?teal:'#a65d42');
      const tx=map(80,80,(c,w,h)=>{c.fillStyle=i?'#536f63':'#96634b';c.fillRect(0,0,w,h);c.fillStyle='#eee3bf';c.font='bold 55px monospace';c.textAlign='center';c.fillText(i?'C':'B',w/2,60);});
      const sign=texPlane(cam.g,xx,yy,.055,.040,.040,tx,{metalness:.08,roughness:.50});sign.rotation.z=-a;
    }
    disc(cam,[0,0,.061],.116,.065,p.deep);ring(cam,[0,0,.097],.091,.006,p.chrome);
    block(cam,[0,0,.099],.053,.053,.011,ebony);block(cam,[0,0,.106],.040,.040,.012,p.gap);
    const fixedNeedle=new T.Shape();fixedNeedle.moveTo(-.018,.001);fixedNeedle.lineTo(0,-.049);fixedNeedle.lineTo(.018,.001);fixedNeedle.closePath();
    cast(gov,fixedNeedle,[cx,cy+R+.041,.174],.004,biscuit,.001);
    block(gov,[cx,cy+R+.056,.133],.111,.044,.075,p.marine);
    const follower=batch(gov.g,cx,cy+R+.010,.112,'Notch reader');
    disc(follower,[0,0,0],.013,.019,p.bronze);
    rod(follower,[0,.004,-.005],[.068,.068,-.023],.010,p.chrome);
    // Independent flyweights rise and move out as the governor speeds up.
    const fly=batch(gov.g,-.573,1.120,-.011,'Centrifugal weights');
    plate(gov,[-.531,1.061,-.089],.200,.107,.091,.017,p.marine);rod(gov,[-.472,.913,-.049],[-.581,1.056,-.049],.019,p.edge);
    rod(gov,[-.573,1.068,-.052],[-.573,.81,-.052],.025,p.deep);
    disc(gov,[-.573,1.080,-.011],.071,.091,p.marine,'y');
    rod(fly,[0,-.042,0],[0,.431,0],.013,p.chrome);disc(fly,[0,.370,0],.030,.045,p.bronze,'y');
    const flyWeights=[];
    for(const sign of [-1,1]){
      const arm=batch(fly.g,0,.362,0,'Centrifugal hinged arm');
      rod(arm,[0,0,0],[sign*.028,-.178,0],.008,p.chrome);oval(arm,[sign*.028,-.178,0],[.038,.039,.038],bronze);
      const link=batch(fly.g,0,0,0,'Sliding governor linkage');
      rod(link,[0,0,0],[0,1,0],.0065,brass);flyWeights.push({arm,link,sign});
    }
    const collar=batch(fly.g,0,.114,0,'Governor sliding collar');disc(collar,[0,0,0],.029,.056,p.bronze,'y');
    // Left telegraph trigger and right friction-brake wheel stay clear of the dial's readout.
    const trigger=batch(gov.g,-.272,.878,.116,'Telegraph trigger');
    disc(trigger,[0,0,.013],.038,.074,p.bronze,'x');block(trigger,[0,.019,.060],.037,.023,.156,p.chrome);oval(trigger,[0,.038,.137],[.048,.020,.037],ebony);
    const brake=wheel(gov.g,[.303,.836,.151],.097,'Governor brake wheel');
    disc(gov,[.303,.836,.096],.069,.069,p.iron);
    keyPair('drive',trigger.g,[0,.051,.137],brake.g,[.077,0,.071]);
    const camPilot=jewel(gov,-.187,1.666,.079,.031,'#edab61');
    texPlane(gov.g,-.404,1.558,.058,.205,.073,label('预 灯 缺 口','PHASE    .30'));
    texPlane(gov.g,-.405,1.417,.058,.207,.083,label('遮 光 三 秒','DARK  .43–.83'));
    const sectorLegend=map(470,105,(c,w,h)=>{c.clearRect(0,0,w,h);c.font='bold 52px sans-serif';c.textAlign='center';c.fillStyle='#d2cbb0';c.fillText('遮 光　3 s',w/2,72);});
    const sa=TAU*.595;const darkLabel=texPlane(cam.g,Math.sin(sa)*.224,Math.cos(sa)*.224,.042,.167,.040,sectorLegend,{transparent:true,depthWrite:false,roughness:.70,metalness:.06});
    darkLabel.rotation.z=-sa;
    // The two rows are independent interval gauges, each representing the time elapsed since the preceding call.
    const bench=batch(root,3.90,0,-.16,'Horn interval timing bench');
    legStand(bench,1.532,.792,.828,-.204);
    const panel=batch(bench.g,0,1.090,-.206,'Slope of timing and receipt bench');panel.g.rotation.x=-.922;
    plate(panel,[0,0,-.043],1.430,.839,.042,.033,wood);plate(panel,[0,0,.003],1.383,.806,.013,.018,p.deep);
    boltGrid(panel,0,0,.024,1.305,.723,.010);
    const graphSlot=slot(1430,474),graph=texPlane(panel.g,0,.193,.034,1.233,.365,graphSlot.tx,{metalness:.015,roughness:.76,emissive:0x18190f,emissiveIntensity:.27});
    for(const x of [-.635,.635]){block(panel,[x,.198,.032],.024,.373,.032,p.edge);disc(panel,[x,.203,.059],.016,.012,p.bronze,'z',hex);}
    function safeTimeList(raw){
      if(!raw||!Array.isArray(raw)&&!ArrayBuffer.isView(raw))return [];
      return Array.from(raw).filter(t=>typeof t==='number'&&Number.isFinite(t)&&t>=0);
    }
    function plotTrace(tr,length){
      const c=graphSlot.c,w=graphSlot.can.width,h=graphSlot.can.height;skin(c,w,h,'#e0d6b8',978);
      const x0=235,x1=w-53,y0=89,y1=394,scale=(x1-x0)/length;
      c.fillStyle='#354a3f';c.font='bold 43px sans-serif';c.fillText('三线实录',33,55);c.font='24px monospace';c.fillText('STATION  /  STERN  /  BRIDGE',243,53);
      c.strokeStyle='#8d9c82';c.lineWidth=2;c.strokeRect(13,13,w-26,h-26);
      c.textAlign='center';
      const division=length<=5?.20:length<=10?.50:1;
      for(let j=0;j*division<=length+.001;j++){
        const t=j*division,x=x0+t*scale,major=j%4===0;c.strokeStyle=major?'#9fa38b':'#c0bfa5';c.lineWidth=major?2:1;c.beginPath();c.moveTo(x,y0-9);c.lineTo(x,y1+5);c.stroke();
        if(major||Math.abs(t-length)<.001){c.fillStyle='#59675a';c.font='22px monospace';c.fillText(t.toFixed(1),x,y1+43);}
      }
      c.textAlign='left';const names=['本地','船尾','驾驶台'],colors=['#78432e','#345a49','#345561'];
      for(let row=0;row<3;row++){
        const yy=y0+68+row*101;c.fillStyle=colors[row];c.font='bold 44px sans-serif';c.fillText(names[row],36,yy-6);
        c.font='18px monospace';c.fillText(['SOURCE','STERN','BRIDGE'][row],44,yy+22);
        c.strokeStyle='#adb29a';c.lineWidth=1.5;c.beginPath();c.moveTo(x0,yy);c.lineTo(x1,yy);c.stroke();
        c.strokeStyle=colors[row];c.lineWidth=5;c.beginPath();c.moveTo(x0,yy);
        for(const t of tr[row]){
          if(t>length)continue;
          const x=clamp(x0+t*scale,x0,x1),wd=Math.min(15,scale*.036);
          c.lineTo(x,yy);c.lineTo(x,yy-44);c.lineTo(Math.min(x1,x+wd*.42),yy-38);c.lineTo(Math.min(x1,x+wd),yy);c.lineTo(Math.min(x1,x+1.3*wd),yy);
        }
        c.lineTo(x1,yy);c.stroke();
      }
      c.font='22px sans-serif';c.fillStyle='#536654';c.textAlign='right';c.fillText('秒',w-18,h-23);graphSlot.tx.needsUpdate=true;
    }
    const gapMin=.48,gapMax=1.22,trackSpan=.908,trackX=.035;
    const gapX=g=>trackX+((clamp(g,gapMin,gapMax)-gapMin)/(gapMax-gapMin)-.5)*trackSpan;
    const scaleSkin=map(1280,328,(c,w,h)=>{
      skin(c,w,h,'#c9c3a2',514);const mapx=g=>((gapX(g)+.639)/1.278)*w;
      c.fillStyle='#536256';c.font='bold 27px sans-serif';c.fillText('定 时 柱',20,41);c.font='23px monospace';c.fillText('Δt / s',37,86);
      c.font='bold 47px sans-serif';c.fillText('B',48,167);c.fillText('C',48,289);
      const xMark=mapx(.85);c.strokeStyle='#935c43';c.lineWidth=3;c.setLineDash([7,4]);c.beginPath();c.moveTo(xMark,42);c.lineTo(xMark,h-12);c.stroke();c.setLineDash([]);
      c.font='bold 35px sans-serif';c.fillStyle='#784b32';c.fillText('驾驶台复位约 0.85 s',xMark+14,37);
      c.textAlign='center';
      for(let j=0;j<=37;j++){
        const val=.48+j*.02,x=mapx(val),major=j===0||j===37||j%5===1;const named=j===0||j===37||j===6||j===11||j===21||j===26;
        for(const y of [132,251]){
          c.strokeStyle=major?'#526357':'#83917a';c.lineWidth=major?2.4:1.6;c.beginPath();c.moveTo(x,y);c.lineTo(x,y-(major?20:10));c.stroke();
          if(named){c.font='bold 22px monospace';c.fillStyle='#394d41';c.fillText(val.toFixed(2),x,y-26);}
        }
      }
    });
    texPlane(panel.g,0,-.180,.030,1.278,.333,scaleSkin,{roughness:.62,metalness:.17});
    const railsY=[-.142,-.264],studs=[],readouts=[];
    for(let i=0;i<2;i++){
      const y=railsY[i];
      rod(panel,[gapX(.48)-.052,y,.053],[gapX(1.22)+.052,y,.053],.0083,p.chrome);
      for(const x of [gapX(.48)-.046,gapX(1.22)+.046]){block(panel,[x,y,.045],.038,.045,.027,p.bronze);bolt(panel,x,y+.011,.061,.0047);}
      const slide=batch(panel.g,0,y,.057,'Sliding calibrated '+(i?'C':'B')+' interval stud');
      plate(slide,[0,0,0],.078,.054,.016,.007,i?teal:'#ad7953');
      disc(slide,[0,0,.027],.022,.024,p.chrome);disc(slide,[0,0,.051],.017,.032,p.bronze);
      const lock=batch(slide.g,0,0,.063,'Wing lock');
      block(lock,[0,0,0],.074,.014,.013,p.chrome,0,0,.26);
      for(const x of [-.031,.031])oval(lock,[x,x*.26,.001],[.015,.013,.008],bronze);
      const tip=new T.Shape();tip.moveTo(-.009,.030);tip.lineTo(0,.049);tip.lineTo(.009,.030);tip.closePath();cast(slide,tip,[0,0,.017],.003,biscuit,.0005);
      const tiny=jewel(panel,.595,y,.048,.016,i?'#98c6a1':'#e0af75');studs.push({slide,lock,tiny});
      const d=slot(285,109);readouts.push(d);
      plate(panel,[-.553,y,.031],.137,.056,.005,.004,p.iron);
      texPlane(panel.g,-.553,y,.044,.129,.047,d.tx,{metalness:.04,roughness:.55});
      pair('bench',i,slide.g,[-.035,-.012,.016],lock.g,[.029,.011,.009]);
    }
    const chartFeed=batch(panel.g,-.653,.191,.043,'Paper-drive ratchet');
    disc(chartFeed,[0,0,0],.043,.047,p.bronze,'x');
    for(let j=0;j<14;j++){const a=j*TAU/14;block(chartFeed,[0,.042*Math.sin(a),.042*Math.cos(a)],.049,.007,.007,j%4===0?biscuit:p.edge,-a);}
    const pen=batch(panel.g,-.535,.020,.055,'Return strip print carriage');
    block(pen,[0,0,0],.056,.021,.013,p.edge);block(pen,[0,.014,.005],.006,.024,.006,p.bronze);
    // Pneumatic station. The pilot valve, pressure manifold and long bronze lift lever have no loudspeaker cone.
    const horn=batch(root,3.18,0,-4.85,'Pneumatic fog key and incoming ship slips');
    legStand(horn,1.556,.777,.797,-.221);
    const px=-.265,py=.928,pz=-.063;
    for(const x of [-.496,-.029]){block(horn,[x,.847,pz],.143,.076,.249,p.marine);disc(horn,[x,.925,pz],.064,.153,bronze,'x');}
    disc(horn,[px,py,pz],.116,.523,bronze,'x');
    for(const x of [-.501,-.126,-.018]){
      disc(horn,[x,py,pz],.144,.033,p.bronze,'x');
      for(let i=0;i<6;i++){const a=i*TAU/6;disc(horn,[x+.020,py+.110*Math.sin(a),pz+.110*Math.cos(a)],.011,.012,p.chrome,'x',hex);}
    }
    disc(horn,[px,py+.087,pz],.099,.099,p.deep,'y');disc(horn,[px,py+.145,pz],.058,.055,p.bronze,'y');
    disc(horn,[px,py+.194,pz],.028,.083,p.chrome,'y');
    const handle=batch(horn.g,px,py+.191,pz+.015,'Bronze pilot-air lever');
    disc(handle,[0,0,.003],.061,.154,p.bronze,'x');disc(handle,[.083,0,.003],.045,.027,p.chrome,'x',hex);
    rod(handle,[0,0,0],[-.011,.205,.059],.025,brass);
    rod(handle,[-.011,.205,.059],[.003,.336,.102],.025,brass);
    disc(handle,[.003,.338,.103],.024,.202,bronze,'x');
    for(const x of [-.102,.102])disc(handle,[x,.338,.103],.031,.014,p.chrome,'x');
    grip(horn,-.510,.875,.091,.157);
    keyPair('horn',horn.g,[-.510,.875,.128],handle.g,[.039,.338,.105]);
    // Pipe and Bourdon manometer. The printed arc is in percent of working pressure, not fictional engineering units.
    hose(horn,[[-.413,1.026,-.091],[-.461,1.106,-.178],[-.477,1.304,-.292],[-.424,1.433,-.307]],.015,p.copper,24);
    const gx=-.424,gy=1.580,gz=-.300;
    disc(horn,[gx,gy,gz],.158,.084,p.iron);ring(horn,[gx,gy,gz+.045],.146,.010,p.bronze);
    const pressureSkin=map(562,562,(c,w,h)=>{
      const x=w/2,y=h/2;skin(c,w,h,'#dfd4b3',874);c.textAlign='center';c.fillStyle='#48574c';c.font='bold 52px sans-serif';c.fillText('风　压',x,y+89);c.font='28px monospace';c.fillText('% WORKING',x,y+125);
      for(let j=0;j<=40;j++){const a=(-127+j*254/40)*Math.PI/180,r=w*.406,r0=r-(j%4?12:23);
        c.strokeStyle=j>=33?'#946450':'#4e574a';c.lineWidth=j%4?2:4;c.beginPath();c.moveTo(x+Math.sin(a)*r0,y-Math.cos(a)*r0);c.lineTo(x+Math.sin(a)*r,y-Math.cos(a)*r);c.stroke();
        if(j%8===0){c.fillStyle=c.strokeStyle;c.font='bold 27px monospace';c.fillText(String(j*2.5),x+Math.sin(a)*(r-43),y-Math.cos(a)*(r-43)+8);}
      }
      c.strokeStyle='#7a846e';c.lineWidth=2;c.beginPath();c.arc(x,y,w*.446,0,TAU);c.stroke();});
    const pm=own(new T.MeshStandardMaterial({map:pressureSkin,metalness:.023,roughness:.63}));
    const pg=new T.Mesh(own(new T.CircleGeometry(.139,56)),pm);pg.position.set(gx,gy,gz+.049);horn.g.add(pg);
    const pressureHand=batch(horn.g,gx,gy,gz+.054,'Working pressure needle');
    block(pressureHand,[0,.050,0],.0035,.103,.002,p.gap);disc(pressureHand,[0,0,.003],.008,.007,p.bronze);
    // The counters show local output immediately. The ship's two printed counts only exist after their replies.
    plate(horn,[.351,1.107,-.386],.781,.463,.267,.031,p.marine);
    plate(horn,[.351,1.107,-.114],.754,.435,.022,.018,p.deep);boltGrid(horn,.351,1.107,-.081,.675,.359,.010);
    const contact=jewel(horn,.587,1.265,-.078,.036,'#e99537');
    const pilot=jewel(horn,-.002,1.340,-.072,.040,'#f1ad57');
    const sourceLamps=[];
    for(let j=0;j<3;j++){sourceLamps.push(jewel(horn,.144+j*.106,1.267,-.078,.030,'#e0ac69'));}
    const tally=slot(1030,366);
    const paper=texPlane(horn.g,.379,1.097,-.082,.607,.221,tally.tx,{roughness:.80,metalness:.02,emissive:0x17170e,emissiveIntensity:.27});
    for(const x of [.064,.694]){
      block(horn,[x,1.100,-.073],.019,.222,.023,p.bronze);
      for(const yy of [1.019,1.181])disc(horn,[x,yy,-.057],.008,.010,p.chrome,'z',hex);
    }
    const receiveFeed=batch(horn.g,.704,1.099,-.064,'Ship return paper roller');
    disc(receiveFeed,[0,0,0],.033,.037,p.bronze,'x');
    for(let j=0;j<12;j++){const a=j*TAU/12;block(receiveFeed,[0,.031*Math.sin(a),.031*Math.cos(a)],.034,.004,.006,p.edge,-a);}
    const serialJack=[.092,.154];for(const xx of serialJack){disc(horn,[xx,.936,-.077],.016,.022,p.bronze);disc(horn,[xx,.936,-.059],.010,.010,p.gap);}
    hose(horn,[[.093,.935,-.051],[.067,.887,-.010],[.094,.858,.021],[.166,.877,.013],[.154,.936,-.052]],.005,ebony,30);
    texPlane(horn.g,.421,.938,-.081,.358,.047,label('雾号 · 收报口','AFT   /   BRIDGE'));
    const shutter=batch(horn.g,-.002,1.340,-.047,'Sliding prelight shutter');
    plate(shutter,[0,0,0],.101,.096,.010,.009,p.deep);
    rod(horn,[-.065,1.268,-.056],[-.065,1.444,-.056],.004,p.chrome);
    function printTally(local,aft,bridge,showA,showB){
      const c=tally.c,w=tally.can.width,h=tally.can.height;skin(c,w,h,'#ddd6ba',622);
      c.fillStyle='#65705c';c.font='bold 27px sans-serif';c.fillText('气阀及船端回执',29,43);c.font='18px monospace';c.textAlign='right';c.fillText('HORN RECORD   /   11',w-30,42);
      c.textAlign='left';c.strokeStyle='#9da388';c.lineWidth=1.5;c.strokeRect(12,10,w-24,h-20);
      const ns=[local,aft,bridge],shown=[true,showA,showB];
      for(let i=0;i<3;i++){
        const yy=73+i*92;c.strokeStyle='#a2aa93';c.beginPath();c.moveTo(25,yy);c.lineTo(w-25,yy);c.stroke();
        c.fillStyle=['#8b5948','#4d705e','#4f6570'][i];c.font='bold 42px sans-serif';c.fillText(['本地','船尾','驾驶台'][i],37,yy+58);
        if(shown[i]){c.font='bold 44px monospace';c.fillText(String(ns[i]),267,yy+57);c.font='30px sans-serif';c.fillText('响',322,yy+56);
          for(let j=0;j<ns[i];j++){const x=481+j*145;c.fillRect(x,yy+38,12,24);c.fillRect(x+12,yy+19,31,43);c.fillRect(x+43,yy+39,12,23);}}
        else{c.font='33px sans-serif';c.fillStyle='#727c68';c.fillText('待船上回报',264,yy+55);}
      }tally.tx.needsUpdate=true;
    }
    for(const o of templates)finish(o);templates.clear();
    for(const [src,plain] of repeatGeo)for(const g of [src,plain])if(g!==bulbGeo&&resources.delete(g))g.dispose();
    repeatGeo.clear();torusCache.clear();
    const anchor=v(),end=v(),direction=v();
    let previousKey='',lastPrint='',lastTrace='',lastGaps=[-1,-1],activeStud=0;
    const number=(a,d=0)=>typeof a==='number'&&Number.isFinite(a)?a:d;
    const cycle=a=>((a%1)+1)%1;
    function update(s={}){
      const phase=cycle(number(s.phase)),service=cycle(number(s.service)),displayPhase=s.editing?service:phase;
      const speed=Math.abs(number(s.speed)),balance=clamp(number(s.balance),-1,1);
      const state=s.keyState==='seated'||s.keyState==='carry'?s.keyState:'rack';
      if(state!==previousKey){
        previousKey=state;
        if(state==='rack'){rack.g.add(key.g);key.g.position.set(.008,1.189,.085);key.g.rotation.set(.075,0,-.025);}
        else if(state==='seated'){cam.g.add(key.g);key.g.position.set(0,0,.218);key.g.rotation.set(0,0,0);}
        else{keyCarrier.add(key.g);key.g.position.set(.170,1.077,-.240);key.g.rotation.set(-.36,-.32,.17);}
      }
      if(state==='carry'&&s.carrier){
        if(s.haul){key.g.position.set(.19,.91,.03);key.g.rotation.set(.22,0,-1.27);}
        else{key.g.position.set(.170,1.077,-.240);key.g.rotation.set(-.36,-.32,.17);}
        keyCarrier.position.set(s.carrier[0],s.carrier[1],s.carrier[2]);keyCarrier.rotation.y=number(s.carrier[3]);}
      const engaged=typeof s.clutch==='boolean'?Number(s.clutch):clamp(number(s.clutch));
      const travel=Number.isFinite(s.travel)?clamp(s.travel):phase;
      free.g.rotation.z=travel*TAU*3;pack.g.rotation.z=free.g.rotation.z;pack.g.position.z=.112-engaged*.042;
      lever.g.rotation.z=.39-engaged*1.12;
      cam.g.rotation.z=displayPhase*TAU;
      follower.g.position.y=cy+radiusFor(displayPhase)+.011;
      fly.g.rotation.y=phase*TAU*6;
      const force=clamp(speed/.29),rise=.068+force*.054;
      collar.g.position.y=.084+rise;
      for(const item of flyWeights){
        const a=(.13+force*.72)*item.sign;item.arm.g.rotation.z=a;item.arm.g.updateMatrix();
        end.set(item.sign*.028,-.178,0).applyMatrix4(item.arm.g.matrix);
        anchor.set(0,collar.g.position.y+.012,0);direction.subVectors(end,anchor);const len=direction.length();
        item.link.g.position.copy(anchor);item.link.g.quaternion.setFromUnitVectors(up,direction.normalize());item.link.g.scale.set(1,len,1);
      }
      trigger.g.rotation.x=s.ready?.14:-.07;brake.g.rotation.z=balance*1.62+(s.editing?service*TAU:0);
      const notch=Math.abs(((displayPhase-phaseNotch+1.5)%1)-.5)<.026;
      camPilot(s.dark?0:s.ready?1:notch?.65:0);
      activeStud=s.stud===1?1:0;
      for(let i=0;i<2;i++){
        const gap=clamp(number(s.gaps?.[i],gapMin),gapMin,gapMax),locked=!!s.locks?.[i],o=studs[i];
        o.slide.g.position.x=gapX(gap);
        o.lock.g.rotation.z=locked?-1.16:.05;o.lock.g.position.z=locked?.058:.069;
        o.tiny(locked?1:i===activeStud?.48:.02);
        const ticks=Math.round(gap*100);
        if(ticks!==lastGaps[i]){
          const d=readouts[i],c=d.c;c.fillStyle='#35453d';c.fillRect(0,0,d.can.width,d.can.height);
          c.fillStyle='#e6dbb6';c.font='bold 59px monospace';c.textAlign='center';c.fillText((i?'C ':'B ')+(ticks/100).toFixed(2),d.can.width/2,76);
          d.tx.needsUpdate=true;lastGaps[i]=ticks;
        }
      }
      const len=clamp(number(s.trace?.length,3.2),.4,60),tr=[safeTimeList(s.trace?.source),safeTimeList(s.trace?.aft),safeTimeList(s.trace?.bridge)];
      const tf=String(len)+'|'+tr.map(row=>row.map(t=>t.toFixed(3)).join(',')).join('|');
      if(tf!==lastTrace){
        plotTrace(tr,len);lastTrace=tf;let last=0,total=0;
        for(const row of tr)for(const t of row){last=Math.max(last,t);total++;}
        const f=clamp(last/len);pen.g.position.x=-.535+f*1.068;chartFeed.g.rotation.x=f*TAU*2.2;
        graph.position.y=.191-Math.min(total,12)*.0008;
      }
      const valve=clamp(number(s.valve)),press=clamp(number(s.pressure)),storm=clamp(number(s.storm));
      handle.g.rotation.x=.10+valve*1.13;
      pressureHand.g.rotation.z=(.5-press)*(254*Math.PI/180)+.012*storm*Math.sin(phase*TAU*7);
      contact(s.contact?1:.02);pilot(s.ready?1:0);shutter.g.position.y=1.340+(s.dark?0:.094);
      const counts=[s.localCount,s.aftCount,s.bridgeCount].map(n=>Math.round(clamp(number(n),0,3)));
      for(let i=0;i<3;i++)sourceLamps[i](i<counts[0]?1:0);
      const showA=!!s.showAft,showB=!!s.showBridge,cf=[...counts,showA,showB].join('|');
      if(cf!==lastPrint){lastPrint=cf;printTally(...counts,showA,showB);receiveFeed.g.rotation.x=(counts[0]+(showA?counts[1]:0)+(showB?counts[2]:0))*.58;}
    }
    function hands(kind,index){
      const id=Number.isInteger(index)?index:kind==='bench'?activeStud:0;
      const name=kind+id,pts=contacts.get(name);if(!pts)return null;
      const out=globs.get(name);for(let i=0;i<2;i++){const g=pts[i*2];g.updateWorldMatrix(true,false);out[i].copy(pts[2*i+1]).applyMatrix4(g.matrixWorld);}return out;
    }
    function dispose(){root.removeFromParent();root.clear();resources.forEach(r=>r.dispose());resources.clear();globs.clear();contacts.clear();}
    update();return {update,hands,dispose};
  }return {create};
})();
if(typeof window!=='undefined')window.TideFoghouseGear=TideFoghouseGear;
