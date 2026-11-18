// Seawater pump room, dual reservoirs, sampling gear and dry recording chest.
const TideCisternGear=(()=>{
  const T=THREE,TAU=2*Math.PI,clamp=(x,a=0,b=1)=>Math.min(b,Math.max(a,x));
  const v=(x=0,y=0,z=0)=>new T.Vector3(x,y,z),mix=(a,b,t)=>a+(b-a)*t;
  function rng(seed){return ()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}
  function create(parent){
    const root=new T.Group();root.name='北岬双室潮泵及打捞设备';parent.add(root);
    const resources=new Set(),own=x=>(resources.add(x),x),p={iron:'#4a5350',chrome:'#b9b8a2'};
    const shell='#496258',green='#73887a',edge='#99a191',brass='#c29b64',bronze='#987a53',red='#a45d4c',ox='#77513f',steel='#909a93',dark='#404942',ink='#323f38',enamel='#e4dfc4',wood='#7b6350',rubber='#454942',post='#788079';
    function map(w,h,draw){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=own(new T.CanvasTexture(c));if('colorSpace' in t)t.colorSpace=T.SRGBColorSpace;else t.encoding=T.sRGBEncoding;t.anisotropy=4;return t;}
    const grain=map(256,256,(c,w,h)=>{
      const r=rng(923);c.fillStyle='#e8e7df';c.fillRect(0,0,w,h);
      for(let i=0;i<11500;i++){c.fillStyle=r()>.40?'rgba(75,66,50,.21)':'rgba(250,247,226,.35)';c.fillRect(r()*w,r()*h,.65+r()**2*6,.65+r()*.95);}
      for(let i=0;i<105;i++){const x=r()*w,y=r()*h,sz=1+r()**3*12;const g=c.createRadialGradient(x,y,.1,x,y,sz);g.addColorStop(0,'rgba(95,76,49,.20)');g.addColorStop(1,'rgba(113,97,62,0)');c.fillStyle=g;c.fillRect(x-sz,y-sz,sz*2,sz*2);}
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
        c.font='bold '+Math.floor(H*(sub?.43:.64))+'px serif';c.fillText(title,W*.5,H*(sub?.36:.51),W-45);
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
    function flange(o,axis,center,rad,h=.07){
      const [x,y,z]=center;disc(o,center,rad,h,green,axis);
      const ringRot=axis==='x'?[0,Math.PI/2]:axis==='y'?[Math.PI/2,0]:[0,0];
      ring(o,center,rad*.83,rad*.032,bronze,...ringRot);
      for(let i=0;i<8;i++){const a=i*TAU/8+Math.PI/8,u=rad*.814*Math.cos(a),q=rad*.814*Math.sin(a);
        const at=axis==='x'?[x+h*.55,y+u,z+q]:axis==='y'?[x+u,y+h*.55,z+q]:[x+u,y+q,z+h*.55];disc(o,at,rad*.073,h*.40,steel,axis,hex);}
    }
    function timber(seed){
      const tx=map(768,180,(c,w,h)=>{const r=rng(seed);c.fillStyle='#82745a';c.fillRect(0,0,w,h);
        for(let i=0;i<1340;i++){let y=r()*h,x=-200+r()*980;c.strokeStyle=i%5?'rgba(53,52,42,'+(.07+r()*.21)+')':'rgba(202,186,135,.30)';c.lineWidth=.6+r()*2;c.beginPath();c.moveTo(x,y);c.bezierCurveTo(x+80,y+r()*4-2,x+168,y+r()*3-2,x+200+r()*370,y+r()*3-2);c.stroke();}
        for(let i=0;i<38;i++){const x=r()*w,y=r()*h;c.fillStyle='rgba(62,64,49,.23)';c.fillRect(x,y,7+r()*67,.7+r()*2);}
      });return tx;
    }
    const timbers=[timber(832),timber(65),timber(431)].map(tx=>own(new T.MeshStandardMaterial({map:tx,roughness:.39,metalness:.08})));
    const flat=own(new T.PlaneGeometry(1,1));
    function topPrint(g,m,x,y,z,w,d,rz=0){const mesh=new T.Mesh(flat,m);mesh.position.set(x,y,z);mesh.scale.set(w,d,1);mesh.rotation.set(-Math.PI/2,0,rz);mesh.receiveShadow=true;g.add(mesh);return mesh;}
    const staticParts=batch(root,0,0,0,'Cast support and pressure mains');
    const contacts=new Map();function grip(kind,g,left,right){contacts.set(kind,[g,v(...left),v(...right)]);}
    function gauge(o,x,y,z,r,title,markA=0,markB=6){
      disc(o,[x,y,z],r*1.12,.087,dark);disc(o,[x,y,z+.047],r*1.049,.023,bronze);
      const tx=map(384,384,(c,w,h)=>{c.fillStyle='#d5d2b7';c.fillRect(0,0,w,h);
        c.textAlign='center';c.fillStyle='#35473e';c.strokeStyle='#415149';const cx=w*.5,cy=h*.5,scale=139;
        for(let i=0;i<=48;i++){
          const a=(135+i*270/48)*Math.PI/180,k=i%8===0?1:i%4===0?.74:.42;
          c.lineWidth=i%8===0?4:2;c.beginPath();c.moveTo(cx+scale*Math.cos(a),cy+scale*Math.sin(a));c.lineTo(cx+(scale-19*k)*Math.cos(a),cy+(scale-19*k)*Math.sin(a));c.stroke();
          if(i%8===0){c.font='bold 21px serif';c.fillText(String(Math.round(mix(markA,markB,i/48))),cx+104*Math.cos(a),cy+104*Math.sin(a)+6);}
        }
        c.font='bold 23px serif';c.fillText(title,cx,cy+58);c.font='15px monospace';c.fillText('N.C. · 海务',cx,cy+83);
      });
      const m=own(new T.MeshStandardMaterial({map:tx,roughness:.34,metalness:.11}));const face=new T.Mesh(own(new T.CircleGeometry(r*.94,48)),m);face.position.set(x,y,z+.063);o.g.add(face);ring(o,[x,y,z+.064],r*.966,.008,brass);
      const n=batch(o.g,x,y,z+.068,'Pressure instrument needle');
      rod(n,[-r*.19,0,0],[r*.72,0,0],r*.017,'#703f30');bulb(n,0,0,.004,[r*.072,r*.072,.009],bronze);return n.g;
    }
    // The flywheel drives a flanged split volute and a ribbed seawater motor.
    const pump=batch(root,-4.35,1.25,2.87,'Seawater transfer hand valve');
    for(const x of [-.69,.57]){block(pump,[x,.054,-.13],.28,.10,.52,ox);for(const z of [-.28,.02])bolt(pump,x,.101,z,.022,'y');}
    block(pump,[-.03,.126,-.15],1.62,.13,.51,shell);
    for(const x of [-.36,.10])rod(pump,[x,.19,.04],[x*.78,.52,-.03],.069,green);
    bulb(pump,-.23,.57,-.17,[.41,.448,.285],shell);disc(pump,[-.23,.57,-.03],.365,.235,shell);flange(pump,'z',[-.23,.57,.099],.352,.043);
    for(const rr of [.17,.235,.295])ring(pump,[-.23,.57,.127],rr,.009,green);
    hose(pump,[[-.46,.60,-.14],[-.67,.70,-.13],[-.81,.80,-.12],[-1.0,.80,-.12]],.127,shell);flange(pump,'x',[-.937,.80,-.12],.174);
    hose(pump,[[-.96,.80,-.12],[-1.15,.80,-.13],[-1.29,.63,-.17],[-1.29,.19,-.19],[-1.29,-.07,-.19]],.117,shell);flange(pump,'y',[-1.29,.32,-.19],.155);
    disc(pump,[.36,.54,-.24],.241,.55,green,'x');bulb(pump,.637,.54,-.24,[.073,.238,.238],shell);
    for(let i=0;i<22;i++){
      const a=TAU*i/22,ry=.231*Math.cos(a),rz=.231*Math.sin(a);
      rod(pump,[.108,.54+ry,-.24+rz],[.61,.54+ry,-.24+rz],.017,edge);
    }
    for(const x of [.13,.62])flange(pump,'x',[x,.54,-.24],.24,.042);
    block(pump,[.29,.24,-.24],.51,.17,.29,shell);block(pump,[.33,.817,-.24],.25,.13,.21,dark);
    hose(pump,[[.42,.82,-.32],[.59,.76,-.44],[.853,.53,-.48],[.84,.17,-.48],[.82,.04,-.36]],.023,rubber);
    hose(pump,[[-.25,.87,-.13],[-.18,1.02,-.105],[.02,1.03,-.047],[.03,1.03,.073]],.075,green);
    disc(pump,[.03,1.005,.109],.122,.225,shell);flange(pump,'z',[.03,1.005,.144],.142,.038);
    const pumpWheel=batch(pump.g,.03,1.005,.231,'Indexed intake and drain wheel');wheel(pumpWheel,.239,5,'#a4604d');
    rod(pumpWheel,[.158,-.166,.006],[.158,-.166,.091],.019,bronze);disc(pumpWheel,[.158,-.166,.091],.028,.074,wood);
    grip('pump',pumpWheel.g,[-.208,.104,.008],[.166,-.166,.093]);
    // Waxed brass index remains fixed to the body.
    const needlePlate=batch(pump.g,.03,1.005,.174,'Transfer valve scale');
    for(let i=-5;i<=5;i++){const a=Math.PI/2+i*.23;rod(needlePlate,[.262*Math.cos(a),.262*Math.sin(a),0],[.282*Math.cos(a),.282*Math.sin(a),0],i%5===0?.007:.003,i===0?brass:edge);}
    rod(pumpWheel,[0,.176,0],[0,.260,.006],.012,enamel);
    nameplate(pump,-.55,1.09,.036,.304,.125,'排　 注','双向滑阀');
    const pressureNeedle=gauge(pump,.47,1.04,.052,.141,'水 压',0,6);
    nameplate(pump,.35,.303,.081,.302,.103,'潮　泵','二号机　／　北岬');
    const rotor=batch(pump.g,-.23,.57,.162,'Pump shaft and bronze spider');disc(rotor,[0,0,.006],.114,.027,bronze);
    for(let j=0;j<4;j++){const a=j*TAU/4;rod(rotor,[.03*Math.cos(a),.03*Math.sin(a),.024],[.096*Math.cos(a+.34),.096*Math.sin(a+.34),.024],.009,edge);}
    // The intake grate is fixed to the foot of the east well, five centimetres below the starting waterline.
    const grateHinge=batch(root,3.490,1.57,3.55,'Articulated strainer hinge');
    const grate=batch(grateHinge.g,-.610,0,0,'Open circular intake strainer');
    for(const [r,t,c] of [[.581,.037,shell],[.544,.019,edge],[.474,.012,green],[.217,.010,green]])ring(grate,[0,0,0],r,t,c,Math.PI/2);
    for(let j=-6;j<=6;j++){
      const q=j*.076,d=Math.sqrt(.541*.541-q*q);
      rod(grate,[q,-.014,-d],[q,-.014,d],.009,edge);
      rod(grate,[-d,-.023,q],[d,-.023,q],.008,green);
    }
    for(let j=0;j<10;j++){const a=j*TAU/10;disc(grate,[.570*Math.cos(a),.018,.570*Math.sin(a)],.020,.015,bronze,'y',hex);}
    for(const zz of [3.37,3.73]){
      rod(staticParts,[3.51,1.585,zz],[3.54,.18,zz],.031,shell);
      disc(staticParts,[3.49,1.57,zz],.038,.096,bronze,'z');
      rod(grate,[.49,0,zz-3.55],[.612,0,zz-3.55],.017,steel);
    }
    disc(staticParts,[2.88,.13,3.55],.375,.072,shell,'y');ring(staticParts,[2.88,.17,3.55],.37,.018,bronze,Math.PI/2);
    // Angled grating provides a dry rack on which the cup can be hung with its marks outward.
    const hanger=batch(root,4.06,2.32,3.29,'Salvaged cup rest');
    hanger.g.rotation.y=.76;
    for(const x of [-.17,.17])rod(hanger,[x,-.47,-.097],[x,.17,-.097],.017,green);
    for(const yy of [-.29,-.14,.015,.13])rod(hanger,[-.18,yy,-.097],[.18,yy,-.097],.009,bronze);
    hose(hanger,[[.09,-.14,-.10],[.09,-.088,-.05],[.09,-.035,.016],[.09,.018,.026]],.009,brass,12);
    const rodOrigin=v(4.04,2.04,3.55),poleRig=batch(root,0,0,0,'Boat hook pivot');
    const pullShaft=batch(poleRig.g,0,0,0,'Waxed boat hook shaft');
    disc(pullShaft,[0,.50,0],.018,1.00,wood,'y');
    for(const [yy,l,rr] of [[.075,.15,.024],[.232,.132,.020],[.957,.085,.0205]])disc(pullShaft,[0,yy,0],rr,l,yy>.9?brass:'#5f5a46','y');
    for(let i=0;i<18;i++){const yy=.03+i*.011;ring(pullShaft,[0,yy,0],.022,.0027,'#9c916e',Math.PI/2);}
    const hook=batch(poleRig.g,0,0,0,'Galvanized hook end');
    hose(hook,[[0,-.16,0],[0,-.123,0],[.028,-.094,0],[.061,-.054,0],[.054,-.012,0],[.024,.008,0],[0,0,0]],.008,steel,24);
    disc(hook,[0,-.134,0],.020,.066,'#b4b4a3','y');bulb(hook,0,0,0,[.008,.011,.008],brass);
    const cup=batch(root,0,0,0,'Enamel sampling mug');
    const profile=[[.0001,-.084],[.072,-.084],[.080,-.08],[.085,-.066],[.092,.065],[.096,.077],[.096,.085],[.092,.090],[.086,.087],[.086,.079],[.081,-.059],[.073,-.073],[.0001,-.073]];
    const mug=own(new T.LatheGeometry(profile.map(q=>new T.Vector2(...q)),48));
    part(cup,mug,enamel,[0,0,0],[1,1,1],[0,0,0],wet);ring(cup,[0,.084,0],.092,.005,'#527176',Math.PI/2);
    ring(cup,[0,-.077,0],.078,.005,'#73776b',Math.PI/2);
    hose(cup,[[.082,.059,0],[.122,.061,0],[.145,.041,0],[.144,.004,0],[.127,-.028,0],[.086,-.042,0]],.008,'#d5d5b9',25);
    for(const yy of [-.042,.059])bulb(cup,.085,yy,0,[.012,.012,.012],green);
    const flecks=rng(373);for(let i=0;i<42;i++){const a=flecks()*TAU,yy=.074+flecks()*.012,r=.094;bulb(cup,r*Math.cos(a),yy,r*Math.sin(a),[.001+flecks()*.003,.0013,.002+flecks()*.004],i%4?ox:'#525752');}
    const nameMark=map(768,768,(c,w,h)=>{
      c.fillStyle='#c5c2a6';c.fillRect(0,0,w,h);const r=rng(734);
      for(let i=0;i<2900;i++){c.strokeStyle=i%2?'rgba(68,64,53,.16)':'rgba(242,234,191,.33)';c.lineWidth=.4+r()*1.5;c.beginPath();const x=r()*w,y=r()*h;c.moveTo(x,y);c.lineTo(x+r()*20,y-4+r()*10);c.stroke();}
      c.strokeStyle='#838a75';c.lineWidth=7;c.beginPath();c.arc(384,384,346,0,TAU);c.stroke();
      c.font='bold 145px "Kaiti SC","KaiTi",serif';c.textAlign='center';c.textBaseline='middle';
      for(const [ch,x,y,a] of [['林',235,266,-.091],['澈',419,254,.034],['沈',314,477,-.076],['遥',496,460,.061]]){
        c.save();c.translate(x,y);c.rotate(a);c.transform(1,.036,-.08,1,0,0);c.lineWidth=4;c.strokeStyle='#eee1bb';c.strokeText(ch,-2,2);c.fillStyle='#555d4e';c.fillText(ch,0,0);c.restore();}
      c.strokeStyle='#70775f';c.lineWidth=3;c.beginPath();c.moveTo(239,406);c.lineTo(466,354);c.stroke();
    });
    const cupMark=new T.Mesh(own(new T.CircleGeometry(.0725,48)),own(new T.MeshStandardMaterial({map:nameMark,roughness:.51,metalness:.18,emissive:0x28281e,emissiveIntensity:.22})));
    cupMark.rotation.x=Math.PI/2;cupMark.position.y=-.0846;cup.g.add(cupMark);
    const floatPose=new T.Quaternion().setFromEuler(new T.Euler(.40,-.37,-.22));
    const faceN=v(.68,.39,.63).normalize(),faceR=v().crossVectors(up,faceN).normalize(),faceU=v().crossVectors(faceN,faceR);
    const showPose=new T.Quaternion().setFromRotationMatrix(new T.Matrix4().makeBasis(faceR,faceU,faceN)).multiply(new T.Quaternion().setFromAxisAngle(v(1,0,0),-Math.PI/2));
    const sidePose=new T.Quaternion().setFromAxisAngle(up,-1.85).multiply(showPose);
    const raft=batch(root,2.16,0,3.18,'Twin-ended timber and iron float');
    for(const [x,z,l] of [[-.742,0,1.83],[-.081,0,1.83],[.72,-.655,.58]]){
      disc(raft,[x,-.238,z],.181,l,shell,'z');for(const a of [-1,1])bulb(raft,x,-.238,z+a*l*.501,[.179,.179,.033],green);
      for(const a of [-.39,-.13,.13,.39])ring(raft,[x,-.235,z+a*l],.183,.015,bronze);
    }
    // Open starboard sampling recess, identical bounds to the walking surface.
    for(const [x,z,w,d] of [[-.515,0,1.27,2.10],[.635,-.665,1.03,.77],[.635,.965,1.03,.17]])block(raft,[x,-.094,z],w,.142,d,dark);
    const bands=[[-1.05,-.86],[-.86,-.66],[-.66,-.46],[-.46,-.28],[-.28,-.09],[-.09,.10],[.10,.30],[.30,.50],[.50,.69],[.69,.88],[.88,1.05]];
    bands.forEach(([lo,hi],i)=>{
      const recess=lo>=-.28&&hi<=.88,left=-1.15,right=recess?.12:1.15,w=right-left,z=(lo+hi)*.5;
      block(raft,[(left+right)*.5,-.026,z],w,.052,hi-lo-.006,i%3===1?'#7b705b':wood);
      topPrint(raft.g,timbers[i%3],(left+right)*.5,.001,z,w-.019,hi-lo-.012);
      for(const x of [left+.062,right-.062])disc(raft,[x,.0023,z],.011,.006,edge,'y',hex);
    });
    block(raft,[.114,-.025,.30],.019,.083,1.16,green);
    for(const z of [-.281,.881])block(raft,[.642,-.025,z],1.03,.083,.019,green);
    for(const z of [-1.006,1.006]){block(raft,[0,.052,z],2.29,.119,.049,green);
      for(const x of [-1,-.61,-.24,.24,.61,1])disc(raft,[x,.058,z+.026],.014,.01,brass,'z',hex);}
    for(const x of [-1.13,1.13])for(const z of (x>0?[-.827]:[-.827,.827])){block(raft,[x,.044,z],.043,.101,.390,shell);
      rod(raft,[x,.03,z-.151],[x,.128,z-.151],.014,green);rod(raft,[x,.03,z+.151],[x,.128,z+.151],.014,green);
      rod(raft,[x,.128,z-.151],[x,.128,z+.151],.014,brass);}
    block(raft,[0,.063,-1.010],.100,.085,.078,bronze);rod(raft,[0,.105,-1.01],[0,.56,-1.01],.014,brass);
    bulb(raft,0,.585,-1.01,[.031,.035,.031],brass);rod(raft,[0,.579,-1.01],[0,.625,-1.01],.010,enamel);
    const guide=batch(raft.g,0,0,-.49,'Raft rope grip and fairlead');
    for(const x of [-.185,.185]){block(guide,[x,.04,-.13],.178,.05,.263,green);block(guide,[x,.164,-.13],.038,.236,.138,green);
      for(const z of [-.206,-.066])bolt(guide,x,.067,z,.013,'y');}
    disc(guide,[0,.209,-.13],.087,.378,bronze,'x');
    for(let i=0;i<13;i++)ring(guide,[-.134+i*.022,.209,-.13],.085,.007,'#aca079',0,Math.PI/2);
    const guideGrip=batch(guide.g,0,.11,-.13,'Ratchet rope lever');
    rod(guideGrip,[.20,0,0],[.20,.61,.158],.023,shell);rod(guideGrip,[.20,.61,.158],[-.175,.61,.158],.022,wood);
    for(const x of [.2,-.175])bulb(guideGrip,x,.61,.158,[.032,.032,.032],brass);
    grip('guide',guideGrip.g,[-.141,.61,.158],[.143,.61,.158]);
    // The exposed bottom of the overhead pipe is the actual clearance plane at 2.88 m.
    const overhead=batch(root,2.16,3.125,-.65,'Low cast-iron transverse main');
    disc(overhead,[0,0,0],.245,3.28,shell,'x');
    for(const xx of [-1.55,-.67,.67,1.55])flange(overhead,'x',[xx,0,0],xx===-.67||xx===.67?.242:.276,.059);
    for(const xx of [-1.55,1.55]){rod(overhead,[xx,.172,-.112],[xx,.69,-.112],.025,green);rod(overhead,[xx,.172,.112],[xx,.69,.112],.025,green);}
    for(const x of [-.96,.01,.96]){const y=-.093,z=.220;
      rod(overhead,[x-.083,y,z],[x+.083,y,z],.009,brass);}
    const bypass=batch(root,4.34,2.85,-6.47,'Return bypass and receiver stand');
    for(const x of [-.27,.28]){block(bypass,[x,.051,-.12],.20,.09,.35,ox);for(const z of [-.25,.02])bolt(bypass,x,.101,z,.015,'y');}
    for(const x of [-.24,.24]){rod(bypass,[x,.111,-.12],[x*.57,.916,-.15],.044,shell);}
    disc(bypass,[0,.792,-.16],.109,.75,green,'x');for(const x of [-.34,.34])flange(bypass,'x',[x,.792,-.16],.16,.040);
    hose(bypass,[[-.34,.792,-.16],[-.54,.77,-.16],[-.68,.59,-.20],[-.68,-.08,-.22]],.078,shell);
    disc(bypass,[0,.963,-.068],.123,.326,shell,'z');flange(bypass,'z',[0,.963,.047],.135,.041);
    const bypassWheel=batch(bypass.g,0,.963,.119,'Bypass wheel and spindle');wheel(bypassWheel,.223,6,'#91764b');
    rod(bypassWheel,[.196,-.100,.004],[.196,-.100,.104],.014,brass);disc(bypassWheel,[.196,-.100,.116],.021,.097,wood);
    grip('bypass',bypassWheel.g,[-.171,.141,.004],[.196,-.100,.133]);
    nameplate(bypass,-.38,1.02,-.098,.292,.118,'旁通','下室退水');
    const wellNeedle=gauge(bypass,.384,1.07,-.056,.115,'下 室',0,3);
    const scaleTx=map(144,1050,(c,w,h)=>{
      c.fillStyle='#d3d1b8';c.fillRect(0,0,w,h);const colors=['#3e6258','#8e5546'];
      for(let j=0;j<30;j++){
        const y=j*h/30;c.fillStyle=colors[Math.floor(j/10)%2];
        if(j%2===0)c.fillRect(11,y,53,h/32);
        c.fillRect(11,y,10,h/30+.5);
        if(j%5===0){c.fillRect(10,y,77,3);c.font='bold 25px monospace';c.fillText(String(30-j),83,y+26);}
      }
    });
    // Two staff plates stand on the wet side, with a narrow fixed reading frame above each pool.
    const waterScales=[];
    for(const [xx,zz,y0,y1] of [[3.46,-4.69,-.11,2.88],[-3.02,-4.04,-.48,1.70]]){
      const h=y1-y0;block(staticParts,[xx,(y0+y1)*.5,zz],.167,h+.04,.043,dark);
      texPlane(staticParts.g,xx,(y0+y1)*.5,zz+.024,.141,h,scaleTx,{roughness:.42,metalness:.07});
      for(const yy of [y0+.040,y1-.036])bolt(staticParts,xx+.060,yy,zz+.029,.009);
      const w=batch(root,xx,0,zz,'Tide staff float witness');
      hose(w,[[-.113,0,.018],[-.093,.019,.075],[.093,.019,.075],[.113,0,.018]],.010,brass,12);
      for(const x of [-.1,.10])bulb(w,x,0,.018,[.023,.02,.031],green);waterScales.push(w.g);
    }
    const cabinet=batch(root,-1.22,-.05,-6.52,'Floodproof voice record cabinet');
    block(cabinet,[0,.086,-.071],1.085,.142,.606,dark);block(cabinet,[0,.432,-.07],1.04,.644,.565,shell);
    for(const x of [-.497,.497]){
      block(cabinet,[x,.44,.226],.042,.65,.044,bronze);
      for(const yy of [.164,.714])bolt(cabinet,x,yy,.252,.014);
    }
    plate(cabinet,[0,.421,.221],.932,.536,.024,.042,green);plate(cabinet,[0,.426,.250],.735,.339,.014,.035,shell);
    nameplate(cabinet,0,.490,.274,.398,.143,'原始录音','B 区积水档案　／　北岬');
    for(const x of [-.316,.316]){disc(cabinet,[x,.318,.284],.041,.037,bronze);rod(cabinet,[x-.039,.312,.314],[x+.039,.329,.314],.008,brass);}
    block(cabinet,[0,.751,-.06],1.066,.048,.628,bronze);block(cabinet,[0,.779,-.057],.949,.027,.536,'#666950');
    const chest=batch(root,0,0,0,'Watertight two-tape carrier');
    // The two reels share this single gasketed transit case.
    const cw=.662,cd=.391;
    block(chest,[0,.015,0],cw,.030,cd,green);
    for(const x of [-(cw/2-.012),cw/2-.012]){block(chest,[x,.076,0],.025,.131,cd,green);block(chest,[x,.139,0],.033,.012,cd,bronze);}
    for(const z of [-(cd/2-.011),cd/2-.011]){block(chest,[0,.076,z],cw-.02,.132,.022,shell);block(chest,[0,.139,z],cw-.01,.010,.025,bronze);}
    for(const x of [-.273,.273])plate(chest,[x,.085,.197],.051,.092,.009,.007,brass);
    hose(chest,[[-.108,.089,.206],[-.100,.089,.246],[-.068,.089,.264],[.063,.089,.264],[.103,.089,.244],[.106,.089,.204]],.010,dark,17);
    for(const [i,x,title,col] of [[0,-.158,'值班','#b7c6a8'],[1,.158,'十秒钟北岬','#d4b68a']]){
      const tape=batch(chest.g,x,.040,-.002,'Original reel cassette '+title);block(tape,[0,.036,0],.287,.068,.291,i?'#8b6652':'#5a6656');
      block(tape,[0,.066,0],.271,.011,.277,col);
      const tx=map(544,432,(c,w,h)=>{
        c.fillStyle=col;c.fillRect(0,0,w,h);const r=rng(i+452);
        for(let k=0;k<2900;k++){c.fillStyle=k%2?'rgba(255,245,211,.21)':'rgba(90,74,53,.13)';c.fillRect(r()*w,r()*h,.6+r()*3,1);}
        c.lineWidth=5;c.strokeStyle=i?'#805c48':'#4e685c';c.strokeRect(13,14,w-26,h-28);
        c.fillStyle=i?'#6a4637':'#344e43';c.textAlign='center';c.textBaseline='middle';c.font='bold '+(i?77:95)+'px serif';c.fillText(title,w/2,113,w-38);
        c.font='22px monospace';c.fillText(i?'私人录音　·　手录':'岸台原带　·　值班室',w*.5,h-66);
        c.fillRect(29,176,w-58,3);
      });const tm=own(new T.MeshStandardMaterial({map:tx,metalness:.09,roughness:.58}));topPrint(tape.g,tm,0,.0725,0,.268,.270);
      for(const xx of [-.063,.063]){disc(tape,[xx,.075,.020],.038,.005,ink,'y');disc(tape,[xx,.079,.020],.022,.005,i?'#d4c9ac':'#bac2ad','y');
        for(let q=0;q<3;q++){const a=TAU*q/3;disc(tape,[xx+.012*Math.cos(a),.083,.020+.012*Math.sin(a)],.004,.002,dark,'y');}}
    }
    const lid=batch(chest.g,0,.143,-.194,'Hinged seal and tape case cover');
    block(lid,[0,.009,.194],cw,.020,cd,shell);
    for(const x of [-.318,.318])block(lid,[x,.001,.195],.021,.029,.333,bronze);
    for(const z of [.021,.367])block(lid,[0,.021,z],.588,.014,.021,green);
    for(const x of [-.291,.291])for(const z of [.039,.351])bolt(lid,x,.026,z,.008,'y');
    for(const x of [-.16,.16])disc(chest,[x,.140,-.193],.021,.129,brass,'x');
    grip('cabinet',cabinet.g,[-.225,.886,.234],[.225,.886,.234]);
    const basket=batch(root,2.70,.36,-6,'Open hoist basket');
    block(basket,[0,-.036,0],.793,.053,.525,green);
    for(const x of [-.381,.381])for(const z of [-.242,.242]){rod(basket,[x,-.051,z],[x,.276,z],.016,green);bulb(basket,x,.277,z,[.021,.021,.021],bronze);}
    for(const z of [-.246,.246]){rod(basket,[-.382,.276,z],[.382,.276,z],.016,green);rod(basket,[-.382,.106,z],[.382,.106,z],.01,bronze);}
    for(const x of [-.382,.382]){rod(basket,[x,.276,-.242],[x,.276,.242],.016,green);rod(basket,[x,.106,-.242],[x,.106,.242],.010,bronze);
      hose(basket,[[x,.278,-.216],[x*.77,.432,-.142],[x*.46,.606,-.06],[0,.718,0]],.010,steel,12);
      hose(basket,[[x,.278,.216],[x*.77,.432,.142],[x*.46,.606,.06],[0,.718,0]],.010,steel,12);}
    ring(basket,[0,.748,0],.035,.009,brass);
    const winch=batch(root,3.13,2.85,-6.05,'Hoist drum and pawl');
    winch.g.rotation.y=.5*Math.PI;
    block(winch,[0,.044,-.055],.47,.077,.388,shell);
    for(const x of [-.153,.153]){block(winch,[x,.447,-.037],.060,.791,.143,green);bolt(winch,x,.087,.088,.015,'y');}
    disc(winch,[0,.805,-.05],.089,.391,bronze,'x');
    for(const x of [-.172,.172])disc(winch,[x,.805,-.05],.136,.021,green,'x');
    for(let i=0;i<16;i++)ring(winch,[-.137+i*.018,.805,-.05],.094,.009,'#9d977d',0,Math.PI/2);
    const hoistWheel=batch(winch.g,0,.90,.081,'Receiving crank');
    wheel(hoistWheel,.147,4,green);rod(hoistWheel,[.077,.113,0],[.077,.113,.091],.012,brass);disc(hoistWheel,[.077,.113,.091],.018,.049,wood);
    grip('hoist',hoistWheel.g,[-.125,-.060,.010],[.077,.113,.107]);
    // A low east-facing cleat gives the worker on the drained gallery somewhere to hold the tail.
    const cleat=batch(root,2.25,-.05,-6.00,'Basket tail rope cleat');
    cleat.g.rotation.y=-Math.PI/2;rod(cleat,[0,.015,0],[0,.804,0],.050,shell);
    rod(cleat,[-.126,.80,0],[.126,.80,0],.023,brass);rod(cleat,[-.07,.76,.049],[.07,.76,.049],.014,wood);
    grip('basket',cleat.g,[-.059,.76,.049],[.062,.80,0]);
    block(staticParts,[3.22,2.875,-6.43],.254,.055,.225,shell);
    for(const x of [3.135,3.305])for(const z of [-6.50,-6.36])bolt(staticParts,x,2.906,z,.013,'y');
    block(staticParts,[3.22,3.93,-6.43],.081,2.075,.105,green);
    rod(staticParts,[3.22,4.941,-6.43],[2.70,4.941,-6.0],.050,shell);
    rod(staticParts,[3.22,4.31,-6.43],[2.74,4.91,-6.04],.027,green);
    for(const pos of [[3.22,4.93,-6.43],[3.22,4.32,-6.43],[2.75,4.90,-6.03]])disc(staticParts,pos,.037,.091,bronze,'z',hex);
    const sheave=batch(root,2.70,4.90,-6.0,'Elevated rope block');
    for(const z of [-.069,.069]){plate(sheave,[0,.021,z],.181,.245,.017,.060,shell);bolt(sheave,0,.035,z+.023,.020);}
    disc(sheave,[0,0,.011],.105,.100,bronze);
    hose(staticParts,[[2.79,4.91,-6],[2.89,4.87,-6],[2.98,4.67,-6.03],[3.07,3.65,-6.06]],.009,'#9a9883',20);
    function cable(name,color,rad,steps=24){
      const n=6,pos=new Float32Array((steps+1)*n*3),norm=new Float32Array(pos.length),ids=[];
      for(let i=0;i<steps;i++)for(let j=0;j<n;j++){const a=i*n+j,b=i*n+(j+1)%n;ids.push(a,b,a+n,b,b+n,a+n);}
      const geo=own(new T.BufferGeometry());const pa=new T.BufferAttribute(pos,3),na=new T.BufferAttribute(norm,3);
      pa.setUsage(T.DynamicDrawUsage);na.setUsage(T.DynamicDrawUsage);geo.setAttribute('position',pa);geo.setAttribute('normal',na);geo.setIndex(ids);
      const m=new T.Mesh(geo,own(new T.MeshStandardMaterial({color,metalness:.23,roughness:.71})));m.name=name;m.frustumCulled=false;root.add(m);
      const tangent=v(),axis=v(),around=v(),direction=v(),ref=v(0,0,1);
      return (a,b,sag)=>{
        direction.copy(b).sub(a);
        for(let i=0;i<=steps;i++){
          const t=i/steps,curve=4*t*(1-t)*sag,cx=mix(a.x,b.x,t),cy=mix(a.y,b.y,t)-curve,cz=mix(a.z,b.z,t);
          tangent.copy(direction);tangent.y-=4*(1-2*t)*sag;tangent.normalize();
          ref.set(0,Math.abs(tangent.z)>.94?1:0,Math.abs(tangent.z)>.94?0:1);axis.crossVectors(tangent,ref).normalize();around.crossVectors(tangent,axis);
          for(let j=0;j<n;j++){const k=i*n+j,a0=j*TAU/n,cs=Math.cos(a0),sn=Math.sin(a0),nx=axis.x*cs+around.x*sn,ny=axis.y*cs+around.y*sn,nz=axis.z*cs+around.z*sn;
            pa.setXYZ(k,cx+rad*nx,cy+rad*ny,cz+rad*nz);na.setXYZ(k,nx,ny,nz);}
        }
        pa.needsUpdate=na.needsUpdate=true;
      };
    }
    const suspension=cable('Hoist wire','#a6a992',.009,16),tail=cable('Cotton tag line','#b4a57e',.010,22),tow=cable('Raft guide rope','#a89a71',.013,36);
    const waterColorChunk=T.ShaderChunk.colorspace_fragment?'colorspace_fragment':'encodings_fragment';
    function reservoir(name,rects,depth){
      const verts=[],tris=[];for(const [x1,x2,z1,z2] of rects){
        const offset=verts.length/3,cols=Math.ceil((x2-x1)*4),rows=Math.ceil((z2-z1)*4);
        for(let j=0;j<=rows;j++)for(let i=0;i<=cols;i++)verts.push(mix(x1,x2,i/cols),0,mix(z1,z2,j/rows));
        for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){const a=offset+j*(cols+1)+i,b=a+1,c=a+cols+1;tris.push(a,c,b,b,c,c+1);}
      }
      const geo=own(new T.BufferGeometry());geo.setAttribute('position',new T.Float32BufferAttribute(verts,3));geo.setIndex(tris);geo.computeBoundingSphere();
      const uniforms={roomCube:{value:null},probeLive:{value:0},elevation:{value:0},probeLocal:{value:v(.20,2.34,-.78)},
        dirToRoom:{value:new T.Matrix3()},dirToWorld:{value:new T.Matrix3()},clock:{value:0},moving:{value:0},intake:{value:depth?0:1},pool:{value:depth?0:1},disturb:{value:new T.Vector2(2.88,3.55)},rail:{value:new T.Vector2(2.16,3.18)}};
      const common=`
        uniform float clock,moving,intake,pool;uniform vec2 disturb,rail;
        float wave(vec2 p){
          float tm=clock;
          float d=distance(p,disturb),r=distance(p,rail);
          float swirl=.011*sin(d*40.-tm*5.4)*exp(-d*2.9)*intake+.006*sin(r*29.-tm*2.)*exp(-abs(r-1.05)*3.)*pool;
          return .010*sin(p.y*4.7+p.x*1.5+tm*1.06)+.005*sin(p.x*7.2-p.y*3.8-tm*.77)+.003*sin(p.y*12.+p.x*10.6+tm*1.25)+swirl+.008*abs(moving)*sin(p.y*8.1+p.x*3.4+tm*3.2);
        }`;
      const m=own(new T.ShaderMaterial({uniforms,side:T.DoubleSide,transparent:true,depthWrite:false,
        vertexShader:common+`
          varying vec2 q;varying vec3 surface;
          void main(){q=position.xz;vec3 p=position;p.y+=wave(q);vec4 w=modelMatrix*vec4(p,1.);surface=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}`,
        fragmentShader:common+`
          varying vec2 q;varying vec3 surface;
          uniform samplerCube roomCube;uniform float probeLive,elevation;uniform vec3 probeLocal;
          uniform mat3 dirToRoom,dirToWorld;
          // Box projection retains the position of windows and beams as each split camera moves across the pool.
          vec3 roomReflection(vec3 ray){
            vec3 localRay=normalize(dirToRoom*ray);
            vec3 safeRay=(step(vec3(0.),localRay)*2.-1.)*max(abs(localRay),vec3(.0001));
            vec3 pos=vec3(q.x,elevation+wave(q),q.y);
            vec3 t0=(vec3(-6.40,-1.15,-8.30)-pos)/safeRay,t1=(vec3(6.40,5.90,8.30)-pos)/safeRay;
            vec3 exitT=max(t0,t1);float travel=max(.001,min(exitT.x,min(exitT.y,exitT.z)));
            vec3 sampleDir=normalize(dirToWorld*(pos+localRay*travel-probeLocal));
            vec3 room=textureCube(roomCube,sampleDir).rgb;
            // Saturated lamp filaments become short rippling highlights rather than a white wall of fog.
            return min(vec3(1.01,.97,.82),room/(vec3(1.)+.62*room))*vec3(.80,.91,.87);
          }
          float noise(vec2 V){vec2 i=floor(V),f=fract(V);f=f*f*(3.-2.*f);vec2 a=vec2(127.1,311.7);return mix(mix(fract(sin(dot(i,a))*43758.545),fract(sin(dot(i+vec2(1,0),a))*43758.545),f.x),mix(fract(sin(dot(i+vec2(0,1),a))*43758.545),fract(sin(dot(i+vec2(1,1),a))*43758.545),f.x),f.y);}
          void main(){
            float h=wave(q);float eps=.021;
            vec2 micro=vec2(noise(q*19.+vec2(.24,-.14)*clock),noise(q*24.+vec2(-.17,.12)*clock))-.50;
            vec3 n=normalize(vec3(-(wave(q+vec2(eps,0))-h)/eps+micro.x*.078,1.,-(wave(q+vec2(0,eps))-h)/eps+micro.y*.078));
            vec3 e=normalize(cameraPosition-surface),refl=reflect(-e,n);
            float f=.060+.90*pow(1.-clamp(dot(n,e),0.,1.),3.);
            float turb=noise(q*.73+clock*.023)*.38+noise(q*.19)*.62;
            vec3 bed=mix(vec3(.007,.031,.026),vec3(.031,.079,.054),turb);
            if(pool<.5)bed=mix(bed,vec3(.041,.074,.048),.29);
            // Broken reflections of the tall eastern fanlights, diffused with a second reflection of the storm glass.
            float lobe=exp(-15.*pow(refl.x-.68,2.)-4.*pow(refl.y-.52,2.));
            float bars=smoothstep(.015,.18,abs(sin((q.y+.48*refl.z+.15*noise(q*2.))*1.39)));
            float soft=exp(-5.*pow(refl.x+.50,2.)-10.*pow(refl.z+.44,2.));
            vec3 sky=mix(vec3(.021,.054,.055),vec3(.11,.18,.16),clamp(refl.y*.75+.23,0.,1.));
            sky+=vec3(.30,.28,.185)*lobe*(.17+.83*bars)+soft*vec3(.085,.12,.12);
            if(probeLive>.5){sky=mix(sky,roomReflection(refl),.955);}
            float glint=pow(max(0.,dot(refl,normalize(vec3(.61,.60,-.46)))),42.);
            float drain=length(q-disturb);float eddy=intake*exp(-drain*3.6)*(.5+.5*sin(drain*57.-clock*5.8));
            float mirror=probeLive>.5?clamp(.32+.58*f+.06*lobe,0.,.89):clamp(.19+.59*f+.08*lobe,0.,.76);
            vec3 col=mix(bed,sky,mirror)+glint*vec3(.20,.18,.13)+eddy*.032;
            float grateReveal=pool*exp(-pow(drain/.74,4.))*intake;
            float alpha=clamp(.86+.105*f+.018*turb-.51*grateReveal,.34,.974);
            gl_FragColor=vec4(col,alpha);
            #include <tonemapping_fragment>
            #include <`+waterColorChunk+`>
          }`}));
      const mesh=new T.Mesh(geo,m);mesh.name=name;mesh.renderOrder=2;mesh.position.y=0;root.add(mesh);
      return {mesh,u:uniforms};
    }
    const channel=reservoir('East pump flume',[[.73,3.52,-5.30,5.95]],false);
    const well=reservoir('Lower archive settling well',[[-5.52,.73,-7.32,1.62],[.73,2.94,-7.32,-5.30]],true);
    // Thin caustic ribbons on the submerged sides of the cast dividing wall.
    function causticPlane(x,z,width,flip){
      const u={clock:{value:0}},mat=own(new T.ShaderMaterial({transparent:true,side:T.DoubleSide,depthWrite:false,uniforms:u,
        vertexShader:'varying vec2 q;void main(){q=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
        fragmentShader:`uniform float clock;varying vec2 q;void main(){float h=q.y+.072*sin(q.x*40.+clock*1.1)+.044*sin(q.x*73.-clock*1.27);
          float bank=exp(-pow((h-.68)*7.7,2.))*.08+exp(-pow((h-.74)*32.,2.))*.18;float breaks=.37+.63*pow(abs(sin(q.x*39.+sin(q.x*107.+clock*.83))),.7);gl_FragColor=vec4(.50,.62,.47,bank*breaks);}`}));
      const m=new T.Mesh(own(new T.PlaneGeometry(width,.255)),mat);m.position.set(x,0,z);m.rotation.y=flip?-Math.PI/2:Math.PI/2;m.renderOrder=3;root.add(m);return {m,u};
    }
    const gleam=causticPlane(.778,.22,10.83,false),eastGleam=causticPlane(3.493,-1.27,6.06,true);
    for(const o of templates)finish(o);templates.clear();
    for(const [src,plain] of repeatGeo)for(const geo of [src,plain])if(resources.delete(geo))geo.dispose();
    repeatGeo.clear();torusCache.clear();
    const handCache=new Map();for(const kind of ['pump','bypass','line','rake','cabinet','basket','hoist','carry','receive'])handCache.set(kind,[v(),v()]);
    contacts.set('line',contacts.get('guide'));
    grip('rake',pullShaft.g,[-.012,.20,0],[.012,.059,0]);grip('carry',chest.g,[-.19,.115,.185],[.19,.115,.185]);contacts.set('receive',contacts.get('carry'));
    const updatedTip=v(),axis=v(),endpointA=v(),endpointB=v(),chestA=v(),chestB=v(),heldQuat=new T.Quaternion();
    const get=(x,def=0)=>Number.isFinite(x)?x:def,smooth=t=>t*t*(3-2*t);
    let lastTime=null,spindle=0,disposed=false;
    function heldPose(h,out){const a=get(h?.yaw),x=get(h?.x,-1.22),y=get(h?.y,-.05),z=get(h?.z,-5.85);
      out.set(x-.38*Math.sin(a),y+.935,z-.38*Math.cos(a));return a;}
    function update(s={},time=0){
      if(disposed)return;const tm=get(time),dt=lastTime===null?0:clamp(tm-lastTime,0,.16);lastTime=tm;
      const water=get(s.water,1.62),wellY=get(s.well,1.67),deck=get(s.deckY,water+.32),rx=get(s.raftX,2.16),rz=get(s.raftZ,3.18),flow=clamp(get(s.flow),-1,1),valve=clamp(get(s.valve),-1,1),lift=clamp(get(s.catchLift)),kept=!!s.cupKept;
      const hole=get(s.grateClear,0)||kept||s.grateClear===true;
      const pressure=clamp(get(s.pressure,.93)),stroke=clamp(get(s.stroke)),byp=clamp(get(s.bypass)),hoist=clamp(get(s.hoist,1));
      pumpWheel.g.rotation.z=-valve*1.46;spindle+=dt*(flow*8.2+(valve<-.05&&pressure>.01?-pressure*2.3:0));rotor.g.rotation.z=spindle;
      pressureNeedle.rotation.z=(-135-270*pressure)*Math.PI/180;
      bypassWheel.g.rotation.z=-byp*TAU*.76;wellNeedle.rotation.z=(-135-270*clamp((wellY+.48)/2.15))*Math.PI/180;
      raft.g.position.set(rx,deck,rz);guideGrip.g.rotation.x=-.26+.64*stroke;hoistWheel.g.rotation.z=hoist*TAU*2.65;
      const cx=kept?4.06:get(s.cupX,2.88),cy=kept?2.38:get(s.cupY,water+.065),cz=kept?3.29:get(s.cupZ,3.8);
      cup.g.position.set(cx,cy,cz);
      if(lift<=0&&!kept){cup.g.rotation.set(.36+.083*Math.sin(tm*1.57),-.36+.094*Math.sin(tm*.76),-.22+.095*Math.cos(tm*1.31));}
      else if(kept)cup.g.quaternion.copy(sidePose).slerp(showPose,smooth(clamp(get(s.cupTurn))));
      else cup.g.quaternion.copy(floatPose).slerp(sidePose,smooth(lift));
      grateHinge.g.rotation.z=-1.62*(hole?1:smooth(clamp((lift-.45)/.55)));
      // During the lifting beat the tip follows the recovering bail. It is racked once the mug is hung.
      updatedTip.set(get(s.hookX,3.30),water+.08,get(s.hookZ,3.96));
      if(lift>0||kept||s.caught===true){
        const handle=v(.134,.03,0).applyQuaternion(cup.g.quaternion).add(cup.g.position);
        updatedTip.lerp(handle,kept?1:smooth(clamp(lift/.22)));
      }
      axis.copy(updatedTip).sub(rodOrigin);const length=axis.length();poleRig.g.position.copy(rodOrigin);
      poleRig.g.quaternion.setFromUnitVectors(up,axis.normalize());hook.g.position.y=length;pullShaft.g.scale.y=Math.max(.02,length-.134);
      const basketY=.36+3.19*hoist;basket.g.position.y=basketY;
      suspension(endpointA.set(2.70,4.89,-6.0),endpointB.set(2.70,basketY+.784,-6),0);
      tail(endpointA.set(2.25,.742,-5.99),endpointB.set(2.324,basketY+.246,-5.773),s.lineHeld?.035:.18);
      tow(endpointA.set(2.16,2.82,-5.41),endpointB.set(rx,deck+.218,rz-.63),s.guided?.06:.19);
      const mode=s.tape||'cabinet',lidAmount=clamp(get(s.lid));
      chest.g.rotation.set(0,0,0);
      if(mode==='cabinet'){chest.g.position.set(-1.22,.743,-6.584);lid.g.rotation.x=-1.95*smooth(lidAmount);}
      else if(mode==='carried'){const a=heldPose(s.carrier,chestA);chest.g.position.copy(chestA);chest.g.rotation.y=a;lid.g.rotation.x=0;}
      else{
        chest.g.position.set(2.70,basketY-.006,-6.0);lid.g.rotation.x=0;
        if(mode==='received'){
          const t=smooth(clamp(get(s.receipt))),a=heldPose(s.receiver||{x:3.43,y:2.85,z:-6.04,yaw:1.28},chestB);
          chest.g.position.lerp(chestB,t);chest.g.position.y+=.105*Math.sin(Math.PI*t);heldQuat.setFromAxisAngle(up,a);chest.g.quaternion.slerp(heldQuat,t);
        }
      }
      channel.mesh.position.y=water;well.mesh.position.y=wellY;channel.u.elevation.value=water;well.u.elevation.value=wellY;
      for(const body of [channel,well]){body.u.clock.value=tm;body.u.moving.value=body===channel?flow:byp*.38;body.u.rail.value.set(rx,rz);body.u.disturb.value.set(2.88,3.55);}
      channel.u.intake.value=kept?0:1;waterScales[0].position.y=water;waterScales[1].position.y=wellY;
      for(const g of [gleam,eastGleam]){g.m.position.y=water-.072;g.u.clock.value=tm;}
    }
    function hands(kind){
      if(disposed)return null;const alias=kind==='guided'?'line':kind,entry=contacts.get(alias);if(!entry)return null;
      const pair=handCache.get(alias)||[v(),v()];pair[0].copy(entry[1]);pair[1].copy(entry[2]);entry[0].localToWorld(pair[0]);entry[0].localToWorld(pair[1]);return pair;
    }
    // The caller owns the cube target and may regenerate or clear it without rebuilding the basin.
    function reflect(texture,position){
      const tex=texture?.isWebGLCubeRenderTarget?texture.texture:texture;
      root.updateWorldMatrix(true,false);const worldBasis=new T.Matrix3().setFromMatrix4(root.matrixWorld);
      const localBasis=worldBasis.clone().invert();
      for(const body of [channel,well]){
        const u=body.u;u.roomCube.value=tex||null;u.probeLive.value=tex?1:0;
        const p0=u.probeLocal.value;if(Array.isArray(position))p0.fromArray(position);
        else if(position)p0.set(position.x,position.y,position.z);
        u.dirToWorld.value.copy(worldBasis);u.dirToRoom.value.copy(localBasis);
      }
    }
    function waterVisible(visible){for(const mesh of [channel.mesh,well.mesh,gleam.m,eastGleam.m])mesh.visible=!!visible;}
    update();
    return {update,hands,reflect,waterVisible,dispose(){if(disposed)return;disposed=true;if(root.parent)root.parent.remove(root);for(const r of resources)r.dispose();resources.clear();root.clear();}};
  }
  return {create};
})();
