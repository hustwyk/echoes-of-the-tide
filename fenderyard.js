// Shore fenders with an inclined travelling shoe, capstan, brake and paying-out boarding ladder.
const TideFenderYard=(()=>{
  const T=THREE,TAU=2*Math.PI,clamp=(x,a=0,b=1)=>Math.min(b,Math.max(a,x));
  const v=(x=0,y=0,z=0)=>new T.Vector3(x,y,z),mix=(a,b,t)=>a+(b-a)*t;
  function rng(seed){return ()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}
  function create(scene,w={}){
    const root=new T.Group();root.name='北岬 · 外海护舷通道';scene.add(root);
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
    function bulb(o,x,y,z,s,tint){part(o,sphere,tint,[x,y,z],s);}
    const sphere=own(new T.SphereGeometry(1,18,10));
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
    const num=(x,d=0)=>Number.isFinite(x)?x:d,getTint=hex=>new T.Color(hex);
    const iron='#43524e',tired='#617671',machined='#a0aaa0',aged='#a58a61',fresh='#caba91',chalk='#cdc8a8',greenMark='#a8c9b8',amberMark='#dab97c',cord='#92846b';
    const staticGear=batch(root,0,0,0,'Fixed machinery and outside transmission');
    const handPart=new Map(),handCache=new Map();function grip(key,node,a,b){handPart.set(key,[node,v(...a),v(...b)]);handCache.set(key,[v(),v()]);}
    function beam(o,a,b,width,depth,tint){
      const A=v(...a),B=v(...b),d=B.clone().sub(A),len=d.length();if(len<.0001)return;
      part(o,cube,tint,A.lerp(B,.5).toArray(),[width,len,depth],[0,0,0],metal,new T.Quaternion().setFromUnitVectors(up,d.normalize()));
    }
    function crankTooth(o,x,y,z,radius,teeth,col,axis='z'){
      const s=new T.Shape();for(let i=0;i<teeth;i++)for(const [da,r] of [[0,.91],[.16,1],[.55,1],[.75,.91]]){
        const a=TAU*(i+da)/teeth,X=radius*r*Math.cos(a),Y=radius*r*Math.sin(a);if(!i&&!da)s.moveTo(X,Y);else s.lineTo(X,Y);
      }s.closePath();const geo=own(new T.ExtrudeGeometry(s,{depth:.021,bevelEnabled:true,bevelSize:.002,bevelThickness:.002,bevelSegments:1,curveSegments:2}));
      part(o,geo,col,[x,y,z],[1,1,1],axis==='x'?[0,Math.PI/2,0]:[0,0,0]);
    }
    if(window.TideBridgeSteel?.[0]?.[1]){
      const load=(uri)=>{const t=own(new T.TextureLoader().load(uri));t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=6;return t;};
      const [nm,arm]=[load(window.TideBridgeSteel[0][1]),load(window.TideBridgeSteel[0][2])];
      metal.normalMap=nm;metal.roughnessMap=arm;metal.normalScale.setScalar(.43);metal.roughness=.80;
    }
    // Carbon-black moulded rubber has subdued reflection and salts in its recesses. Separate maps keep abrasion off the highlights.
    const rubberMaps=(()=>{
      const W=512,coarse=Array.from({length:33*33},rng(6184)),seeded=rng(74170);
      function lattice(x,y,cell){const u=x/cell,vv=y/cell,i=Math.floor(u),j=Math.floor(vv),a=u-i,b=vv-j,sm=t=>t*t*(3-2*t);
        const h=(xx,yy)=>coarse[((yy%32)+32)%32*33+((xx%32)+32)%32];
        return mix(mix(h(i,j),h(i+1,j),sm(a)),mix(h(i,j+1),h(i+1,j+1),sm(a)),sm(b));}
      const base=document.createElement('canvas'),rough=document.createElement('canvas'),heights=new Float32Array(W*W);
      base.width=rough.width=W;base.height=rough.height=W;
      const bc=base.getContext('2d'),rc=rough.getContext('2d'),col=bc.createImageData(W,W),roughData=rc.createImageData(W,W);
      for(let j=0;j<W;j++)for(let i=0;i<W;i++){
        const k=j*W+i,fine=seeded(),v0=lattice(i,j,16),v1=lattice(i*.5,j,32),v2=lattice(i,j,4);
        const base=73+19*(v1-.5)+10*(v0-.5)+8*(v2-.5)+(fine-.5)*12;
        col.data.set([base,base+3,base+2,255],k*4);
        const rr=105+v0*35+v1*28+(fine-.5)*17;roughData.data.set([rr,rr,rr,255],k*4);
        heights[k]=.44*(v2-.5)+.29*(fine-.5)+.22*(v0-.5);
      }
      bc.putImageData(col,0,0);rc.putImageData(roughData,0,0);
      for(let i=0;i<790;i++){
        const x=seeded()*W,y=seeded()*W,len=2+seeded()**3*59;const dx=len,dy=len*(-.14+seeded()*.37);
        bc.strokeStyle=i%4?'rgba(30,32,29,.19)':'rgba(164,162,140,.29)';bc.lineWidth=.42+seeded()**2*1.38;
        bc.beginPath();bc.moveTo(x,y);bc.quadraticCurveTo(x+dx*.55,y+dy*.38+seeded()*3,x+dx,y+dy);bc.stroke();
        rc.strokeStyle=i%4?'rgba(70,70,70,.37)':'rgba(190,190,190,.56)';rc.lineWidth=bc.lineWidth+1;rc.beginPath();rc.moveTo(x,y);rc.lineTo(x+dx,y+dy);rc.stroke();
      }
      const normal=document.createElement('canvas');normal.width=normal.height=W;const nc=normal.getContext('2d'),ni=nc.createImageData(W,W);
      for(let j=0;j<W;j++)for(let i=0;i<W;i++){const q=j*W+i,dx=heights[j*W+(i+1)%W]-heights[j*W+(i+W-1)%W],dy=heights[((j+1)%W)*W+i]-heights[((j+W-1)%W)*W+i],vlen=Math.hypot(dx,dy,1);ni.data.set([128-100*dx/vlen,128+100*dy/vlen,128+127/vlen,255],4*q);}
      nc.putImageData(ni,0,0);
      return [base,normal,rough].map((c,i)=>{const t=own(new T.CanvasTexture(c));t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=8;if(!i){if('colorSpace' in t)t.colorSpace=T.SRGBColorSpace;else t.encoding=T.sRGBEncoding;}return t;});
    })();
    const rubberFace=own(new T.MeshPhysicalMaterial({map:rubberMaps[0],normalMap:rubberMaps[1],roughnessMap:rubberMaps[2],roughness:.72,metalness:.035,vertexColors:true,clearcoat:.53,clearcoatRoughness:.215}));
    rubberFace.normalScale.set(.37,.37);
    // The D-shaped hollow die extrusion has a broad flat contact land at X=0, rolled shoulders, a real upper aperture and the wear lip.
    function dieSection(width,height){
      const a=width*.5;
      const outer=[[-.442,-a+.052],[-.401,-a+.006],[-.326,-a],[-.205,-a*.995],[-.116,-a*.944],[-.055,-a*.86],[-.019,-a*.77],[-.007,-a*.68],[-.007,a*.68],[-.019,a*.77],[-.055,a*.86],[-.116,a*.944],[-.205,a*.995],[-.326,a],[-.401,a-.006],[-.442,a-.052]];
      const inner=outer.map(([x,z])=>[-.230+(x+.230)*.53,z*.46]);
      const positions=[],normals=[],uvs=[];
      const face=(A,B,C,D)=>{
        const p=v(...A),b=v(...B),c=v(...C),normal=b.sub(p).cross(c.sub(p)).normalize();
        for(const vertex of [A,B,C,A,C,D]){positions.push(...vertex);normals.push(normal.x,normal.y,normal.z);uvs.push(vertex[2]*1.25,vertex[1]*.84);}
      };
      const rings=[[0,.95],[-.019,1],[-.115,1],[-height+.11,1],[-height+.024,1],[-height,.95]];
      const V=(u,y,scale)=>[-.224+(u[0]+.224)*scale,y,u[1]*scale];
      for(let k=0;k<outer.length;k++){
        const j=(k+1)%outer.length;
        for(let l=0;l<rings.length-1;l++){
          const [y1,s1]=rings[l],[y2,s2]=rings[l+1];face(V(outer[k],y1,s1),V(outer[j],y1,s1),V(outer[j],y2,s2),V(outer[k],y2,s2));
        }
        face(V(inner[k],-height,1),V(inner[j],-height,1),V(inner[j],0,1),V(inner[k],0,1));
        face(V(outer[k],0,.95),V(inner[k],0,1),V(inner[j],0,1),V(outer[j],0,.95));
        face(V(outer[j],-height,.95),V(inner[j],-height,1),V(inner[k],-height,1),V(outer[k],-height,.95));
      }
      const g=own(new T.BufferGeometry());g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('normal',new T.Float32BufferAttribute(normals,3));g.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));return g;
    }
    function wheelPulley(o,pos,r,axis='x',col=bronze){
      disc(o,pos,r,.049,col,axis);disc(o,pos,r*.62,.068,iron,axis);disc(o,pos,r*.22,.093,machined,axis,hex);
      const [x,y,z]=pos,s=axis==='x';
      for(const sign of [-1,1]){
        const xx=x+(s?sign*.022:0),zz=z+(s?0:sign*.022);
        ring(o,[xx,y,zz],r*.90,.009,steel,0,s?Math.PI/2:0);
      }
    }
    const H=3.57;
    function fender(name,moving){
      const unit=batch(root,moving?2.67:-.78,moving?-2.30:.62,10.50,name);
      if(moving)unit.g.rotation.y=Math.PI;
      // Separate left and right tooling pigments are carried by material within the rubber surface.
      const mark=moving?greenMark:amberMark;
      block(unit,[-.449,-H/2,0],.055,H-.045,2.893,iron);
      for(const z of [-1.349,-.460,.460,1.349]){
        block(unit,[-.522,-H/2,z],.134,H-.045,.096,green);block(unit,[-.594,-H/2,z],.031,H-.04,.147,iron);
      }
      for(const y of [-.134,-1.032,-2.353,-3.39]){block(unit,[-.534,y,0],.161,.114,2.899,green);block(unit,[-.615,y+.053,0],.054,.035,2.870,machined);}
      for(const [i,z] of [-.967,0,.967].entries()){
        part(unit,dieSection(.958,H),i===1?'#c4c6b7':'#b5bcb6',[0,0,z],[1,1,1],[0,0,0],rubberFace);
        // Low moulded compound bands reach the simulation's contact plane without protruding into the lane.
        for(const y of [-.220,-.260,-1.475,-1.515,-2.799,-2.837]){
          block(unit,[-.008,y,z],.016,.017,.631,'#9daba3',0,0,0,rubberFace);
        }
        for(const y of [-.43,-2.15,-3.17]){
          for(const dz of [-.270,.270]){
            disc(unit,[-.0105,y,z+dz],.025,.006,'#4e5550','x');disc(unit,[-.009,y,z+dz],.012,.008,'#696f65','x',hex);
          }
        }
        for(const sign of [-1,1])for(const yy of [-.46,-1.77,-3.05]){
          const zz=z+sign*.458;disc(unit,[-.367,yy,zz],.038,.039,bronze,'z',hex);
        }
      }
      // Paint gets broken at the physical split between each casting. The worn dark areas are cut out of the transfer, not drawn on the water.
      const stripe=map(1024,256,(c,W,HH)=>{
        const rr=rng(moving?981:713);c.clearRect(0,0,W,HH);c.fillStyle=mark;c.fillRect(0,61,W,74);
        c.fillRect(0,159,W,10);for(const x of [77,903]){c.fillRect(x,37,21,132);}
        for(let i=0;i<11500;i++){const x=rr()*W,y=rr()*HH;c.clearRect(x,y,.5+rr()*10,.45+rr()**2*3);}
        for(let k=0;k<55;k++){let x=rr()*W,y=rr()*HH;c.clearRect(x,y,8+rr()*68,.8+rr()*3);}
      });
      const decal=own(new T.MeshStandardMaterial({map:stripe,transparent:true,alphaTest:.32,depthWrite:false,metalness:.07,roughness:.48,polygonOffset:true,polygonOffsetFactor:-1}));
      const decalG=own(new T.PlaneGeometry(.649,.163));
      for(const z of [-.967,0,.967]){
        const d=new T.Mesh(decalG,decal);d.position.set(-.0059,-.951,z);d.rotation.y=Math.PI/2;d.receiveShadow=true;unit.g.add(d);
      }
      // Open compression bays show at both passage ends, with rubbing shoes tucked behind the rubber envelope.
      for(const z of [-1.415,1.415])for(const y of [-.36,-2.32]){
        block(unit,[-.605,y,z],.203,.331,.046,shell);for(const x of [-.656,-.550])for(const yy of [y-.105,y+.105])disc(unit,[x,yy,z+.019],.020,.027,brass,'z',hex);
      }
      return unit;
    }
    const left=fender('Port fixed D fender',false),right=fender('Starboard inclined fender shoe',true);
    // Small curled toe scuffs remain below the first holding rib where the children pushed off.
    const shoeScuff=map(440,300,(c,W,H)=>{
      const r=rng(112052);
      c.translate(219,147);c.rotate(-.29);c.lineCap='round';
      for(let i=0;i<170;i++){
        const u=r()*2-1,lobe=1-u*u;let x=u*117,y=-lobe*34+31+(r()-.5)*23;
        c.strokeStyle=i%4?'rgba(189,188,155,'+(.052+.19*r())+')':'rgba(30,36,33,.44)';c.lineWidth=1.1+3.5*r();
        c.beginPath();c.moveTo(x,y);c.quadraticCurveTo(x+3+(r()-.5)*6,y+8,x+15+r()*16,y+18+19*lobe*r());c.stroke();
      }
      for(let i=0;i<6;i++){
        c.strokeStyle='rgba(44,48,41,'+(.30+r()*.15)+')';c.lineWidth=4.5;c.beginPath();
        c.moveTo(-78+i*25,-4);c.lineTo(-70+i*25,10);c.lineTo(-77+i*25,17);c.stroke();
      }
      c.setTransform(1,0,0,1,0,0);c.globalCompositeOperation='destination-out';
      for(let j=0;j<6400;j++){c.fillStyle='rgba(0,0,0,'+(.22+.75*r())+')';c.fillRect(r()*W,r()*H,.6+3*r(),.5+1.7*r());}
    });
    const toe=texPlane(left.g,-.0051,-2.084,.14,.391,.262,shoeScuff,{transparent:true,alphaTest:.035,depthWrite:false,roughness:.65,metalness:0,polygonOffset:true,polygonOffsetFactor:-1});toe.rotation.y=Math.PI/2;
    // Only diagonal guide hardware moves inward. Its stationary rails remain behind even the fully retracted shoe.
    const trackY=-.75,trackX=1.85,dx=-1.53,dy=3.08,angle=Math.atan2(-dx,dy);
    const localPt=(t,z)=>[2.67+trackX+dx*t,-2.30+trackY+dy*t,z];
    for(const zz of [9.19,11.81]){
      const from=localPt(-.065,zz),to=localPt(1.067,zz);
      // A true double-flanged rail. The living roller truck engages both polished bearing strips.
      beam(staticGear,from,to,.128,.118,iron);
      for(const dz of [-.073,.073]){
        const a=from.slice(),b=to.slice();a[2]+=dz;b[2]+=dz;beam(staticGear,a,b,.217,.038,green);
        a[0]-=.091;b[0]-=.091;beam(staticGear,a,b,.021,.042,machined);
      }
      beam(staticGear,[from[0]+.31,from[1]-.10,zz],[to[0]+.31,to[1]-.10,zz],.085,.069,iron);
      for(const k of [-.02,.25,.52,.78,1.04]){
        const a=localPt(k,zz);beam(staticGear,[a[0]+.03,a[1],zz],[a[0]+.42,a[1]-.12,zz],.04,.072,green);
        disc(staticGear,[a[0]+.18,a[1]-.047,zz+.046],.022,.020,bronze,'z',hex);
      }
      for(const t of [0,1]){
        const at=localPt(t,zz);block(staticGear,[at[0]+.305,at[1]-.168,zz],.305,.153,.267,iron,0,0,angle);
        for(const q of [-.068,.068])disc(staticGear,[at[0]+.345,at[1]-.143,zz+q],.020,.034,bronze,'x',hex);
      }
      // Outboard end frames remain against the sea; the deck lip and the centre of the player lane stay unobstructed.
      const end=localPt(1,zz);beam(staticGear,[4.81,-4.22,zz],[end[0]+.44,end[1]-.086,zz],.129,.134,green);
      beam(staticGear,[4.81,-4.09,zz],[4.84,-2.64,zz],.105,.109,iron);
    }
    const tGauge=batch(root,0,0,0,'Inclined guide ruler');
    const railStart=v(...localPt(0,11.902)),railEnd=v(...localPt(1,11.902));
    tGauge.g.position.copy(railStart);tGauge.g.quaternion.setFromUnitVectors(up,railEnd.clone().sub(railStart).normalize());
    const strokeLen=railStart.distanceTo(railEnd);
    block(tGauge,[.14,strokeLen*.5,0],.099,strokeLen+.07,.022,bronze);
    for(let i=0;i<=24;i++){
      const y=strokeLen*i/24,width=i%6===0?.089:i%3===0?.061:.028;
      block(tGauge,[.103+width*.5,y,.015],width,i%6===0?.013:.006,.007,i%6===0?chalk:machined);
    }
    for(const zz of [-1.307,1.307]){
      // Coordinates of these cantilevers are in the moving right casting's local frame (+X toward the lane).
      beam(right,[-.561,-.76,zz],[-trackX-.054,trackY,zz],.115,.108,green);
      beam(right,[-.569,-1.49,zz],[-trackX+.025,trackY,zz],.078,.081,shell);
      block(right,[-.742,-.78,zz],.31,.211,.146,iron);for(const x of [-.84,-.68])for(const yy of [-.85,-.71])disc(right,[x,yy,zz+.086],.024,.028,bronze,'z',hex);
      for(const zs of [-.126,.126]){
        block(right,[-trackX,trackY,zz+zs],.178,.653,.033,shell,0,0,-angle);
        for(const q of [-.20,.20]){const xx=-trackX+q*Math.sin(angle),yy=trackY+q*Math.cos(angle);
          disc(right,[xx,yy,zz+zs],.075,.054,steel);disc(right,[xx,yy,zz+zs+.037],.034,.018,brass,'z',hex);}
      }
    }
    // Current-height mechanical witness at the outboard dial.
    block(right,[-trackX-.071,trackY,-1.426],.163,.034,.034,amberMark);
    for(const z of [-1.13,1.13]){
      block(left,[-.727,-1.73,z],.179,3.32,.181,shell);
      for(const yy of [-.447,-1.76,-3.21]){
        beam(left,[-.579,yy,z],[-.912,yy-.19,z],.084,.086,green);
        block(left,[-.900,yy-.19,z],.13,.20,.184,iron);
      }
    }
    const station=batch(root,-3.06,-2.49,10.411,'Lower fender worm-drive capstan');
    block(station,[0,.048,-.077],.808,.096,.517,ox);
    block(station,[0,.118,-.077],.769,.084,.468,green);
    for(const xx of [-.311,.311])for(const zz of [-.232,.094])bolt(station,xx,.162,zz,.021,'y');
    for(const xx of [-.184,.184]){
      beam(station,[xx,.156,-.196],[xx*.55,1.002,-.082],.070,.101,shell);
      beam(station,[xx,.158,.037],[xx*.68,.569,-.077],.045,.077,green);
    }
    block(station,[0,.412,-.093],.367,.066,.171,green);
    const wireDrum=batch(station.g,0,.647,-.100,'Capstan wire drum');
    disc(wireDrum,[0,0,0],.128,.424,iron,'x');for(const x of [-.212,.212])disc(wireDrum,[x,0,0],.153,.024,bronze,'x');
    for(let j=0;j<21;j++)ring(wireDrum,[-.182+j*.018,0,0],.128,.009,cord,0,Math.PI/2);
    for(const x of [-.239,.239]){
      block(station,[x,.635,-.10],.051,.273,.225,green);disc(station,[x,.647,-.1],.090,.073,shell,'x');
      for(const zz of [-.159,-.040])bolt(station,x,.465,zz,.014,'y');
    }
    disc(station,[0,1.010,-.008],.152,.245,green);disc(station,[0,1.010,.117],.174,.051,shell);
    for(let i=0;i<7;i++){const a=TAU*i/7;bolt(station,.140*Math.cos(a),1.010+.140*Math.sin(a),.148,.010);}
    const rim=batch(station.g,0,1.010,.229,'Lower station bronze-index handwheel');wheel(rim,.249,5,'#a9604d');
    rod(rim,[.180,-.149,.006],[.180,-.149,.079],.014,bronze);disc(rim,[.180,-.149,.105],.022,.088,wood);
    grip('wheel',rim.g,[-.207,.122,.004],[.180,-.149,.106]);
    nameplate(station,-.218,.415,.007,.231,.096,'调　舷','收紧　／　放松');
    const needle=batch(station.g,.273,1.212,-.004,'Indexed shoe-position pointer');
    disc(station,[.273,1.212,-.037],.122,.065,iron);
    const scale=map(420,420,(c,W,H)=>{
      c.fillStyle='#c8c19e';c.fillRect(0,0,W,H);c.strokeStyle='#47574b';c.fillStyle='#3c5046';const cx=W*.5,cy=H*.49;
      c.textAlign='center';c.textBaseline='middle';for(let j=0;j<=24;j++){
        const a=(146+j*248/24)*Math.PI/180,r=152;
        c.lineWidth=j%6?2.1:4.8;c.beginPath();c.moveTo(cx+r*Math.cos(a),cy+r*Math.sin(a));c.lineTo(cx+(r-(j%6?11:24))*Math.cos(a),cy+(r-(j%6?11:24))*Math.sin(a));c.stroke();
        if(j%6===0){c.font='bold 22px monospace';c.fillText(String(j/6),cx+(r-44)*Math.cos(a),cy+(r-44)*Math.sin(a));}
      }
      c.strokeStyle='#627d62';c.lineWidth=9;c.beginPath();c.arc(cx,cy,160,319*Math.PI/180,338*Math.PI/180);c.stroke();
      c.font='bold 28px serif';c.fillText('滑座',cx,cy+68);
    });
    const dial=new T.Mesh(own(new T.CircleGeometry(.111,40)),own(new T.MeshStandardMaterial({map:scale,roughness:.36,metalness:.11})));dial.position.set(.273,1.212,.0004);station.g.add(dial);
    ring(station,[.273,1.212,.004],.111,.007,brass);rod(needle,[-.019,0,.014],[.081,0,.014],.0035,'#934d38');disc(needle,[0,0,.016],.009,.008,bronze);
    const returnLine=batch(root,0,0,0,'Outside rope race and covered chain fairleads');
    hose(returnLine,[[-3.255,-1.846,10.309],[-3.441,-1.855,10.309],[-3.527,-1.947,10.281],[-3.62,-2.168,10.15],[-3.648,-2.241,9.939]],.012,cord,18);
    rod(returnLine,[-3.648,-2.241,9.939],[-3.649,-3.31,8.703],.012,cord);
    wheelPulley(returnLine,[-3.63,-2.229,9.953],.098,'x');wheelPulley(returnLine,[-3.65,-3.31,8.672],.120,'z');
    rod(returnLine,[-3.648,-3.425,8.672],[4.202,-3.425,8.672],.012,cord);
    wheelPulley(returnLine,[4.205,-3.31,8.672],.119,'z');
    // Counterweight is on its own rails outside the north end. It drops as the right fender rises.
    for(const x of [4.013,4.395]){block(staticGear,[x,-1.97,8.507],.034,4.65,.042,green);}
    block(staticGear,[4.209,.344,8.503],.575,.114,.134,shell);
    beam(staticGear,[4.40,.29,8.52],[4.51,-.27,8.68],.064,.071,green);
    wheelPulley(staticGear,[4.208,.268,8.574],.130,'x');wheelPulley(staticGear,[3.231,.254,9.149],.108,'z');
    const counter=batch(root,4.208,-1.118,8.505,'Returning counterweight');
    for(let i=0;i<4;i++){block(counter,[0,-i*.137,0],.333,.117,.219,i===1?'#a69366':iron);}
    for(const x of [-.147,.147]){block(counter,[x,-.207,0],.042,.593,.246,bronzeDark());disc(counter,[x,-.205,.132],.018,.014,brass,'z',hex);}
    ring(counter,[0,.122,0],.049,.012,brass);rod(counter,[-.086,.068,0],[.086,.068,0],.013,steel);
    function bronzeDark(){return '#73624b';}
    const coping=TideCoping.create(root);
    // Workmen painted the fender's witness against this wall before the chain indicator was installed.
    // The datum at -2.30 and the surviving 0.1 m graduations share the moving shoe's true vertical travel.
    const wallW=2.83,wallH=2.87,wallX=-2.666,wallZ=10.43,wallTop=.645;
    const tieStubs=[[-.89,.175],[.61,.175],[.73,-.734]];
    const stain=map(1080,1096,(c,W,H)=>{
      const r=rng(57621),sx=q=>W*(.5+q/wallW),sy=q=>H*(wallTop-q)/wallH;
      function brush(x,y,rx,ry,value){
        if(rx<=0||ry<=0)return;
        c.save();c.translate(x,y);c.scale(rx,ry);
        const g=c.createRadialGradient(0,0,.02,0,0,1);g.addColorStop(0,value);g.addColorStop(1,'rgba(90,46,25,0)');
        c.fillStyle=g;c.fillRect(-1,-1,2,2);c.restore();
      }
      for(const [z,level] of tieStubs){
        const u=sx(z),v=sy(level);
        brush(u,v+19,48,84,'rgba(112,56,25,.46)');
        for(let j=0;j<52;j++){
          const x=u+(r()-.5)*(r()>.5?52:15),len=39+230*r()**1.7,wgt=.6+4*r()**2,dx=(r()-.5)*.95;
          for(let yy=0;yy<len;yy+=2.3){
            const t=yy/len;c.fillStyle='rgba('+Math.floor(87+45*r())+','+Math.floor(48+22*r())+',25,'+(.12*(1-t)**.43)+')';
            c.fillRect(x+dx*yy*.06+1.5*Math.sin(yy*.036),v+yy,wgt*(1-.44*t)+.4,4);
          }
        }
        brush(u,v,16,20,'rgba(85,41,29,.54)');
      }
      // Sponged-on oxide primer underneath a chalk-white scale. The bottom is eroded by salt and tugs' wash.
      const x=sx(-.29);c.fillStyle='rgba(132,56,35,.46)';c.fillRect(x-5,sy(.49),13,sy(-2.17)-sy(.49));
      c.fillStyle='rgba(228,211,166,.79)';c.fillRect(x,sy(.49),4.6,sy(-2.17)-sy(.49));
      c.font='bold 31px monospace';c.textAlign='left';c.textBaseline='middle';
      for(let j=2;j<=28;j++){
        const y=sy(-2.30+j*.1),major=j%5===0;
        c.fillStyle=major?'rgba(238,223,182,.87)':'rgba(228,205,153,.73)';
        c.fillRect(x,y,major?61:j%2===0?34:22,major?6:3.8);
        if(major)c.fillText((j*.1).toFixed(1),x+70,y+1);
      }
      c.fillStyle='rgba(70,79,66,.76)';c.fillRect(sx(.12),sy(.432),263,63);
      c.strokeStyle='rgba(205,185,134,.69)';c.lineWidth=2;c.strokeRect(sx(.12)+6,sy(.432)+6,251,51);
      c.font='bold 37px serif';c.fillStyle='rgba(234,217,173,.9)';
      c.fillText('护 舷 升 程',sx(.12)+17,sy(.432)+34,224);
      c.save();c.translate(sx(.10),sy(-1.575));c.rotate(-.055);c.font='italic 24px serif';
      c.fillStyle='rgba(210,204,174,.65)';c.fillText('九月校  ✓',0,0);c.restore();
      c.globalCompositeOperation='destination-out';
      for(let i=0;i<39500;i++){
        const x0=r()*W,y0=r()*H;c.fillStyle='rgba(0,0,0,'+(.13+.86*r())+')';
        c.fillRect(x0,y0,.55+5.8*r()**2,.5+4*r()**2);
      }
      for(let j=0;j<175;j++){const y0=r()*H;c.fillStyle='rgba(0,0,0,.42)';c.fillRect(r()*W,y0,8+32*r()**3,.8+2*r()**2);}
    });
    const marks=texPlane(root,wallX,wallTop-wallH*.5,wallZ,wallW,wallH,stain,{transparent:true,depthWrite:false,alphaTest:.035,polygonOffset:true,polygonOffsetFactor:-1,roughness:.96,metalness:0});
    marks.name='Tug berth witness, service paint and old anchorage';marks.rotation.y=-Math.PI*.5;
    for(const [dz,y] of tieStubs){
      const z=wallZ+dz;
      disc(staticGear,[wallX-.006,y,z],.048,.018,ox,'x');disc(staticGear,[wallX-.019,y,z],.033,.027,bronzeDark(),'x',hex);
      disc(staticGear,[wallX-.038,y,z],.014,.017,aged,'x'); 
    }
    // The spring pawl is a two-hand control. Its short grip sweeps toward the operator as the claw lifts clear of the teeth.
    const brake=batch(root,-2.14,.68,8.464,'Upper boarding-ladder brake pedestal');
    block(brake,[0,.041,-.071],.526,.086,.367,ox);
    for(const x of [-.191,.191])for(const zz of [-.189,.048])bolt(brake,x,.090,zz,.016,'y');
    for(const x of [-.151,.151]){
      beam(brake,[x,.081,-.151],[x*.73,.857,-.112],.061,.078,green);
      beam(brake,[x,.084,.050],[x*.77,.461,-.091],.039,.059,shell);
    }
    block(brake,[0,.314,-.109],.293,.053,.077,shell);disc(brake,[0,.745,-.101],.154,.319,gunTint(),'x');
    for(const xx of [-.161,.161])disc(brake,[xx,.745,-.101],.171,.026,bronze,'x');
    for(let i=0;i<16;i++)ring(brake,[-.132+i*.017,.745,-.101],.151,.007,'#9a9276',0,Math.PI/2);
    const ratchet=batch(brake.g,.188,.745,-.101,'Bronze boarding-ladder ratchet');
    crankTooth(ratchet,0,0,0,.185,23,brass,'x');
    const lever=batch(brake.g,0,.797,-.047,'Ladder brake release');
    for(const x of [-.119,.119]){
      rod(lever,[x,-.018,-.029],[x,.116,.128],.016,green);
      disc(lever,[x,0,0],.031,.046,steel,'x',hex);
    }
    rod(lever,[-.157,.135,.173],[.157,.135,.173],.020,wood);
    for(const x of [-.150,.150])disc(lever,[x,.135,.173],.025,.012,brass,'x');
    grip('pawl',lever.g,[-.099,.135,.173],[.099,.135,.173]);
    const claw=batch(brake.g,.198,.885,-.148,'Weighted ratchet pawl');
    block(claw,[.010,0,.033],.037,.030,.114,brass,-.39);
    rod(claw,[0,.010,0],[0,.067,-.053],.013,iron);disc(claw,[0,0,0],.020,.047,bronze,'x');
    hose(brake,[[.203,.884,-.151],[.234,.876,-.136],[.256,.849,-.129],[.264,.801,-.153]],.006,steel,12);
    nameplate(brake,-.011,.492,-.010,.267,.106,'回程卷梯','拉开放梯 · 松手止动');
    hose(staticGear,[[-2.272,1.391,8.353],[-2.419,1.376,8.353],[-2.504,1.158,8.425],[-2.58,.832,8.602],[-2.792,.647,8.947]],.012,cord,22);
    wheelPulley(staticGear,[-2.776,.644,8.959],.066,'x');
    // The upper ladder exit sits just seaward of the sill's exposed face (z=9.29). The rungs unroll continuously from a genuine drum.
    const ladderX=-3.19,lipY=.548,lipZ=9.411,rr=.250,drumY=lipY,drumZ=lipZ-rr,run=3.057,slant=.018;
    const ladderFrame=batch(root,ladderX,0,0,'Boarding ladder fairlead and cheeks');
    for(const sign of [-1,1]){
      const x=sign*.310;
      block(ladderFrame,[x,.655,9.187],.116,.043,.299,shell);
      for(const zz of [9.095,9.256])bolt(ladderFrame,x,.671,zz,.012,'y');
      beam(ladderFrame,[x,.643,9.293],[x,.500,9.371],.054,.052,green);
      disc(ladderFrame,[x,drumY,drumZ],.056,.096,bronze,'x');
      hose(ladderFrame,[[x,.636,9.120],[x,.855,9.106],[x,1.026,9.145],[x,1.050,9.211],[x,.967,9.265],[x,.664,9.303]],.022,machined,18);
    }
    const spool=batch(root,ladderX,drumY,drumZ,'Open boarding-ladder spool');
    disc(spool,[0,0,0],.105,.555,gunTint(),'x');disc(spool,[0,0,0],.034,.736,machined,'x');
    for(const sign of [-1,1]){
      const x=sign*.285;ring(spool,[x,0,0],.210,.019,bronze,0,Math.PI/2);
      for(let i=0;i<6;i++){const a=TAU*i/6;rod(spool,[x,0,0],[x,.198*Math.cos(a),.198*Math.sin(a)],.014,green);}
    }
    const climbingSteps=12,stepPitch=.252,stepPos=Array.from({length:climbingSteps},()=>v());
    function ladderPath(d,out){
      if(d>=0){out.set(0,lipY-d,lipZ+d*slant);return 0;}
      const t=-d,ang=t/rr,layers=rr-clamp(t/(TAU*rr),0,2.1)*.055;
      out.set(0,drumY+layers*Math.sin(ang),drumZ+layers*Math.cos(ang));return ang;
    }
    function instances(geo,mat,count,name){
      const mesh=new T.InstancedMesh(geo,mat,count);mesh.name=name;mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);mesh.frustumCulled=false;mesh.castShadow=mesh.receiveShadow=true;root.add(mesh);return mesh;
    }
    const rungMat=own(new T.MeshStandardMaterial({color:'#9c947e',map:grain,roughness:.59,metalness:.57}));
    const collarMat=own(new T.MeshStandardMaterial({color:'#7b6747',map:grain,roughness:.42,metalness:.53}));
    const rungGeo=own(new T.BoxGeometry(.542,.043,.066)),rungs=instances(rungGeo,rungMat,climbingSteps,'Rolled ladder / calibrated rungs');
    const ferruleGeo=own(new T.CylinderGeometry(.026,.027,.071,9)),ferrules=instances(ferruleGeo,collarMat,climbingSteps*2,'Rung rope ferrules');
    const antiGeo=own(new T.BoxGeometry(.451,.006,.009)),antiskid=instances(antiGeo,collarMat,climbingSteps*2,'Stamped non-slip rung ridges');
    // One pair of continuous lines wraps around the drum alongside the hidden part of the ladder.
    const fiberMat=own(new T.MeshStandardMaterial({color:'#a99d7a',roughness:.81,metalness:.07})),stiffMat=own(new T.MeshStandardMaterial({color:'#8d9383',roughness:.50,metalness:.51}));
    function line(name,section,segments,rad,mat){
      const N=segments+1,P=new Float32Array(N*section*3),V=new Float32Array(P.length),id=[];
      for(let i=0;i<segments;i++)for(let j=0;j<section;j++){const a=i*section+j,b=i*section+(j+1)%section;id.push(a,b,a+section,b,b+section,a+section);}
      const geo=own(new T.BufferGeometry()),p=new T.BufferAttribute(P,3),n=new T.BufferAttribute(V,3);
      p.setUsage(T.DynamicDrawUsage);n.setUsage(T.DynamicDrawUsage);geo.setAttribute('position',p);geo.setAttribute('normal',n);geo.setIndex(id);
      const m=new T.Mesh(geo,mat);m.name=name;m.castShadow=true;m.receiveShadow=true;m.frustumCulled=false;root.add(m);
      const nodes=Array.from({length:N},()=>v()),side=v(),around=v(),tan=v(),aux=v(1,0,0),ref=v(0,0,1);
      return sampler=>{
        for(let i=0;i<N;i++)sampler(i/segments,nodes[i]);
        for(let i=0;i<N;i++){
          const a=nodes[i];tan.copy(nodes[Math.min(N-1,i+1)]).sub(nodes[Math.max(0,i-1)]).normalize();
          side.crossVectors(tan,Math.abs(tan.x)>.93?ref:aux).normalize();around.crossVectors(tan,side);
          for(let j=0;j<section;j++){
            const q=TAU*j/section,cs=Math.cos(q),sn=Math.sin(q),k=i*section+j,nx=cs*side.x+sn*around.x,ny=cs*side.y+sn*around.y,nz=cs*side.z+sn*around.z;
            p.setXYZ(k,a.x+nx*rad,a.y+ny*rad,a.z+nz*rad);n.setXYZ(k,nx,ny,nz);
          }
        }p.needsUpdate=n.needsUpdate=true;
      };
    }
    const ladderRopes=[-1,1].map(sign=>({sign,write:line('Paying ladder side rope',7,76,.0125,fiberMat)}));
    const loadWire=line('Fender load wire',7,22,.012,stiffMat),fallWire=line('Returning counterweight wire',7,16,.009,stiffMat);
    hose(staticGear,[[4.211,.275,8.70],[4.165,.334,8.71],[3.357,.360,9.07],[3.242,.348,9.13]],.010,cord,18);
    // Small shipping fittings distinguish the two put-in platforms; all the raised hardware stays at their outer, aft corners.
    const ferries=w.boats||[];
    for(const [index,d] of ferries.entries()){
      const sign=index?1:-1,x=d.x+sign*(d.w/2-.172),z=d.z+d.d*.5-.245,y=d.y;
      block(staticGear,[x,y+.019,z],.234,.036,.267,shell);rod(staticGear,[x,y+.027,z],[x,y+.124,z],.037,bronze);
      hose(staticGear,[[x,y+.135,z-.158],[x,y+.153,z-.116],[x,y+.133,z-.056],[x,y+.133,z+.059],[x,y+.154,z+.119],[x,y+.138,z+.157]],.022,brass,19);
      for(const dz of [-.08,.08])for(const xx of [-.072,.072])bolt(staticGear,x+xx,y+.037,z+dz,.009,'y');
      const ox=d.x+sign*(d.w*.5+.059);
      for(const dz of [-.54,.49]){
        hose(staticGear,[[x,y+.04,z-.057],[ox-sign*.034,y-.034,z+dz],[ox,y-.196,z+dz+.071],[ox,y-.260,z+dz+.087]],.012,cord,15);
        part(staticGear,sphere,'#a0a6a0',[ox,y-.374,z+dz+.087],[.083,.165,.083],[.07,0,sign*.09],rubberFace);
      }
    }
    function gunTint(){return '#444d48';}
    for(const b of templates)finish(b);templates.clear();
    for(const g of primitives)if(resources.delete(g))g.dispose();
    primitives.clear();torusCache.clear();
    const lo=v(),hi=v(),M=new T.Object3D(),qStep=new T.Quaternion(),axisX=v(1,0,0),off=v();
    const ladderHands=[v(),v()];let deployed=0,disposed=false;
    let lastX,lastY,lastSet,lastPay,lastSpin,lastBrake,hasLadderPose=false;
    function update(s={},time=0){
      if(disposed)return;
      const set=clamp(num(s.setting)),x=num(s.fenderX,2.67+dx*set),y=num(s.fenderTop,-2.30+dy*set),pay=clamp(num(s.ladder)),spin=num(s.wheelSpin,set*2*TAU);
      const brakeOn=!!s.pawl;
      if(x===lastX&&y===lastY&&set===lastSet&&spin===lastSpin&&pay===lastPay&&brakeOn===lastBrake)return;
      lastX=x;lastY=y;lastSet=set;lastSpin=spin;lastPay=pay;lastBrake=brakeOn;
      right.g.position.set(x,y,10.50);
      rim.g.rotation.z=-spin;wireDrum.g.rotation.x=spin*.79;needle.g.rotation.z=(-146-248*set)*Math.PI/180;
      const weightY=-.761-.79*(y+2.30);
      counter.g.position.y=weightY;
      lo.set(3.241,.335,9.146);hi.set(x+trackX+.031,y+trackY+.235,9.190);
      // On a hard stop the final reach lies almost on the guide. The line always remains on the sea side of the rubbing shoe.
      loadWire((u,p)=>{p.copy(lo).lerp(hi,u);p.y-=.014*4*u*(1-u);});
      lo.set(4.208,.239,8.447);hi.set(4.208,weightY+.169,8.505);fallWire((u,p)=>p.copy(lo).lerp(hi,u));
      lever.g.rotation.x=brakeOn?.41:0;claw.g.rotation.x=brakeOn?-.46:0;
      if(deployed===pay*run&&hasLadderPose)return;
      deployed=pay*run;hasLadderPose=true;
      ratchet.g.rotation.x=pay*TAU*2.08;spool.g.rotation.x=deployed/rr;
      for(let j=0;j<climbingSteps;j++){
        const d=deployed-.089-j*stepPitch,ang=ladderPath(d,stepPos[j]);stepPos[j].x=ladderX;
        qStep.setFromAxisAngle(axisX,ang);M.position.copy(stepPos[j]);M.quaternion.copy(qStep);M.scale.set(1,1,1);M.updateMatrix();rungs.setMatrixAt(j,M.matrix);
        for(const [k,sign] of [-1,1].entries()){
          M.position.copy(stepPos[j]).add(off.set(sign*.247,0,0));M.updateMatrix();ferrules.setMatrixAt(j*2+k,M.matrix);
          M.position.copy(stepPos[j]).add(off.set(0,.022,sign*.018).applyQuaternion(qStep));M.updateMatrix();antiskid.setMatrixAt(j*2+k,M.matrix);
        }
      }
      rungs.instanceMatrix.needsUpdate=ferrules.instanceMatrix.needsUpdate=antiskid.instanceMatrix.needsUpdate=true;
      for(const rope of ladderRopes){rope.write((u,p)=>{ladderPath(deployed-u*(run+.16),p);p.x=ladderX+rope.sign*.246;});}
    }
    function hands(kind,p){
      if(disposed)return null;
      if(kind==='ladder'){
        if(deployed<.14)return null;
        root.updateWorldMatrix(true,false);
        const y=typeof p==='number'?p:num(p?.y,-2.49),targets=[y+1.30,y+1.05];
        for(let k=0;k<2;k++){
          if(targets[k]>lipY+.17){ladderHands[k].set(ladderX+(k?1:-1)*.310,clamp(targets[k],.700,1.022),9.260);}
          else{
            let winner=-1,error=1e9;
            for(let j=0;j<climbingSteps;j++){
              const d=deployed-.089-j*stepPitch;if(d<-.003)continue;
              const err=Math.abs(stepPos[j].y-targets[k]);if(err<error){error=err;winner=j;}
            }
            if(winner<0)return null;
            ladderHands[k].copy(stepPos[winner]);ladderHands[k].x+=(k?1:-1)*.165;
          }
          root.localToWorld(ladderHands[k]);
        }
        return ladderHands;
      }
      const reg=handPart.get(kind);if(!reg)return null;
      reg[0].updateWorldMatrix(true,false);const out=handCache.get(kind);
      out[0].copy(reg[1]);out[1].copy(reg[2]);reg[0].localToWorld(out[0]);reg[0].localToWorld(out[1]);return out;
    }
    update();root.updateWorldMatrix(true,true);
    return {update,hands,ready:coping.ready,dispose(){if(disposed)return;disposed=true;coping.dispose();if(root.parent)root.parent.remove(root);for(const m of [rungs,ferrules,antiskid])if(m.dispose)m.dispose();for(const r of resources)r.dispose();resources.clear();root.clear();}};
  }
  return {create};
})();
