// North Cape sounding station. All chart coordinates are local to its chapter parent.
const TideSoundingsGear=(()=>{
  const T=THREE,TAU=2*Math.PI,clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
  const v=(x=0,y=0,z=0)=>new T.Vector3(x,y,z);
  function rng(seed){return ()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}
  function create(parent){
    const root=new T.Group();root.name='North Cape / tide survey';parent.add(root);
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
    function canvasSlot(width,height){
      const can=document.createElement('canvas');can.width=width;can.height=height;
      const tx=own(new T.CanvasTexture(can));tx.colorSpace=T.SRGBColorSpace;tx.anisotropy=4;
      return {can,c:can.getContext('2d'),tx};
    }
    const socketPos=[[.43,-.76,-5.58],[1.48,-.92,-9.61]],displays=[],staffControls=[],scopes=[];
    // A two-section enamel staff. Each group of five short strokes is one decimetre in the installed position.
    function graduation(lower,upper,seed){
      const height=upper-lower,n=Math.ceil(height*515);
      return map(218,n,(c,w,h)=>{
        const r=rng(seed),g=c.createLinearGradient(0,0,w,0);g.addColorStop(0,'#b3b4a3');g.addColorStop(.10,'#e6e5cd');g.addColorStop(.46,'#ebeacd');g.addColorStop(.92,'#d5dbc1');g.addColorStop(1,'#9caa9b');
        c.fillStyle=g;c.fillRect(0,0,w,h);
        const py=y=>(upper-y)/height*h,dy=h/height;
        for(let dm=Math.ceil(lower*10);dm<=Math.floor(upper*10);dm++){
          const base=dm/10,y=py(base),bright=(Math.floor((dm+100)/10)%2===0);
          c.fillStyle=bright?'#974d3e':'#334e50';
          if(((dm+100)%2)===0){
            c.fillRect(15,y-.099*dy,13,.099*dy);
            for(let j=0;j<5;j++)c.fillRect(16,y-(j*2+1)*.010*dy,j===0||j===4?82:57,.010*dy);
          }else{
            c.fillRect(17,y-.014*dy,80,.014*dy);c.fillRect(17,y-.066*dy,47,.009*dy);
          }
          c.fillStyle='#40524b';
          if((dm+100)%5===0){
            c.font='bold 24px monospace';c.textAlign='right';c.fillText((base<0?'−':'+')+Math.abs(base).toFixed(1),205,y-7,101);
          }else{c.font='20px monospace';c.textAlign='right';c.fillText(String(Math.abs(dm)%10),178,y-6);}
        }
        for(let i=0;i<8400;i++){const x=r()*w,y=r()*h;c.fillStyle=i%4?'rgba(81,83,61,.065)':'rgba(251,254,228,.23)';c.fillRect(x,y,.5+r()*1.7,.6+r()*1.7);}
      });
    }
    const rodLow=-3.55,rodHigh=.50,fullLen=rodHigh-rodLow;
    const lowFace=graduation(-3.55,-1.29,291),hiFace=graduation(-1.29,.5,568);
    const carryRig=group(root,0,0,0,'Shouldered removable two-section staff');
    function staffBoard(par,name,portable){
      const o=batch(par,0,0,0,name);const length=portable?2.30:fullLen;
      block(o,[0,length/2,0],.162,length,.051,p.deep);
      for(const x of [-.085,.085])block(o,[x,length*.5,.017],.012,length,.022,p.bronze);
      if(portable){
        texPlane(o.g,0,1.137,.029,.157,2.255,lowFace,{metalness:.10,roughness:.40,side:T.DoubleSide});
        // The retracted upper blade and its own reinforcing rail remain visible from the rear.
        block(o,[0,1.26,-.036],.132,2.025,.027,p.edge);
        for(const y of [.38,1.76]){block(o,[0,y,-.050],.18,.035,.024,p.bronze);bolt(o,.054,y,.032,.006);}
      }else{
        texPlane(o.g,0,1.130,.029,.157,2.26,lowFace,{metalness:.10,roughness:.40});
        texPlane(o.g,0,2.26+.895,.029,.157,1.79,hiFace,{metalness:.10,roughness:.40});
        for(const yy of [2.22,2.27]){block(o,[-.083,yy,-.009],.025,.029,.081,p.bronze);block(o,[.083,yy,-.009],.025,.029,.081,p.bronze);}
      }
      block(o,[0,.019,0],.190,.037,.094,p.iron);
      plate(o,[0,length-.038,-.042],.179,.071,.058,.011,p.marine);
      for(const x of [-.067,.067])bolt(o,x,length-.045,.028,.007);
      return o;
    }
    const rack=batch(root,-3.30,1.56,3.65,'Removable tide staff work rack');
    for(const x of [-.218,.218]){
      block(rack,[x,.033,-.070],.138,.066,.343,p.iron);bolt(rack,x,.074,.047,.013,'y');
      block(rack,[x,1.20,-.120],.063,2.34,.089,p.marine);block(rack,[x,1.20,-.065],.018,2.31,.019,p.edge);
    }
    for(const y of [.34,1.09,1.87,2.26])block(rack,[0,y,-.089],.476,.061,.073,'#83705a');
    for(const y of [.32,1.74]){
      for(const x of [-.112,.112]){rod(rack,[x,y,-.08],[x,y,.097],.012,p.bronze);rod(rack,[x,y,.097],[x,y+.045,.096],.010,p.chrome);}
    }
    plate(rack,[.288,1.341,-.071],.277,.121,.049,.013,p.deep);
    texPlane(rack.g,.288,1.341,-.016,.252,.094,label('测 潮 尺','STAFF / T-09'));
    const portable=staffBoard(carryRig,'Retracted enamel tide staff',true);
    const installed=staffBoard(root,'Installed staff with metre and decimetre graduations',false);
    const jaw=batch(root,0,0,0,'Reading jaw and meniscus sight');
    for(const x of [-.106,.106]){block(jaw,[x,0,0],.028,.090,.102,p.bronze);disc(jaw,[x,.027,.063],.012,.022,p.chrome,'z',hex);}
    block(jaw,[0,.037,.045],.219,.010,.023,p.bronze);
    block(jaw,[0,-.037,.045],.219,.010,.023,p.bronze);
    rod(jaw,[-.104,0,.059],[.074,0,.059],.0025,'#ad5138');
    const pointShape=new T.Shape();pointShape.moveTo(.111,.015);pointShape.lineTo(.076,0);pointShape.lineTo(.111,-.015);pointShape.closePath();
    part(jaw,own(new T.ExtrudeGeometry(pointShape,{depth:.005,bevelEnabled:false})),cream,[0,0,.063]);
    block(jaw,[.146,.014,-.003],.090,.034,.037,p.edge);
    installed.g.rotation.y=jaw.g.rotation.y=Math.PI/2;
    const display=canvasSlot(438,118);
    function jawReadout(value){
      const c=display.c,w=display.can.width,h=display.can.height;c.fillStyle='#343e39';c.fillRect(0,0,w,h);
      c.fillStyle='#829786';c.font='20px sans-serif';c.fillText('夹 位　／　米',17,30);c.fillStyle='#e0d5af';c.font='bold 60px monospace';c.fillText((value<0?'−':'+')+Math.abs(value).toFixed(2),20,95);
      c.fillStyle='#99a895';c.font='25px monospace';c.fillText('m',356,89);display.tx.needsUpdate=true;
    }
    socketPos.forEach(([x,y,z],i)=>{
      const socket=batch(root,x,y,z,'Plumbed staff mounting socket '+(i?'B':'A'));
      const low=rodLow-y,high=rodHigh-y;
      const seaward=batch(socket.g,1.30,0,0,'Cantilever head over water '+(i?'B':'A'));seaward.g.rotation.y=Math.PI/2;
      for(const xx of [-.194,.191]){
        block(seaward,[xx,(low+high)*.50,-.052],.035,high-low,.059,p.edge);
        block(socket,[xx,.042,-.071],.146,.078,.162,p.marine);
        for(const zz of [-.107,-.032])bolt(socket,xx,.092,zz,.010,'y');
      }
      block(seaward,[0,low+.028,-.065],.415,.054,.099,p.deep);
      for(const yy of [low+.12,-.19,.75,high-.081])block(seaward,[0,yy,-.083],.415,.041,.062,p.marine);
      for(const yy of [low+.125,-.27,.54,high-.083]){disc(seaward,[.169,yy,.0],.021,.042,p.bronze,'y');}
      rod(seaward,[.169,low+.084,0],[.169,high-.105,0],.009,p.chrome);
      // The copper plumb bob hangs freely in front of two witness prongs.
      const top=high-.112,bot=top-.65;
      rod(seaward,[-.283,top,-.025],[-.177,top,-.025],.011,p.edge);
      rod(seaward,[-.283,top,-.025],[-.283,bot+.105,-.025],.0025,p.bronze);
      const bob=own(new T.ConeGeometry(.026,.091,16));part(seaward,bob,p.bronze,[-.283,bot+.055,-.025],[1,1,1],[0,0,Math.PI]);
      for(const xx of [-.305,-.263]){block(seaward,[xx,bot,-.026],.008,.045,.030,cream);rod(seaward,[xx,bot-.02,-.04],[-.190,bot-.02,-.051],.005,p.deep);}
      // The iron brackets carry the reading rod out past the edge of the concrete pier.
      // The operator and both of the drives remain on the walking surface.
      for(const zz of [-.186,.128]){
        block(socket,[.709,.103,zz],1.225,.064,.069,p.deep);
        block(socket,[.709,.145,zz],1.241,.021,.088,p.edge);
        rod(socket,[.248,.126,zz],[.971,.689,zz],.024,p.marine);
        rod(socket,[.971,.689,zz],[1.22,.713,zz],.023,p.marine);
        block(socket,[.185,.151,zz],.141,.077,.107,p.marine);
        for(const xx of [.144,.230])bolt(socket,xx,.190,zz,.010,'y');
      }
      for(const xx of [.34,.83,1.216])block(socket,[xx,.110,-.029],.055,.063,.375,p.marine);
      rod(socket,[.256,.921,-.069],[.256,.921,-.166],.016,p.bronze);
      rod(socket,[.256,.921,-.166],[1.303,.921,-.166],.013,p.chrome);
      for(const xx of [.371,.825,1.241]){disc(socket,[xx,.921,-.166],.031,.055,p.bronze,'x');rod(socket,[xx,.894,-.166],[xx,.696,-.166],.012,p.deep);}
      plate(socket,[1.300,.920,-.196],.094,.093,.061,.009,p.marine);
      const machine=batch(socket.g,0,.920,0,'Calibrated operator screw and jaw indicator');
      plate(machine,[.236,0,-.073],.204,.215,.146,.019,p.marine);
      disc(machine,[.233,-.007,.103],.054,.077,p.bronze);boltGrid(machine,.233,.003,.082,.155,.159,.009);
      const drive=wheel(machine.g,[.232,-.007,.153],.093,'Brass jaw thumbwheel');
      for(let j=0;j<26;j++){const a=TAU*j/26;block(drive,[.092*Math.sin(a),.092*Math.cos(a),.003],.004,.004,.013,j%5===0?cream:p.edge,0,0,-a);}
      plate(machine,[-.181,.147,-.058],.271,.106,.089,.014,p.deep);
      displays.push(texPlane(machine.g,-.181,.147,.038,.247,.083,display.tx,{metalness:.07,roughness:.47}));
      grip(machine,-.176,-.004,.090,.123);
      for(const xx of [-.304,.332]){block(socket,[xx,.569,-.071],.034,.588,.058,p.deep);rod(socket,[xx,.335,-.071],[xx*.61,.151,-.040],.024,p.edge);}
      const plateTx=label(i?'尺 座 B':'尺 座 A',i?'OUTER / B':'INNER / A');
      texPlane(machine.g,.231,.079,.083,.174,.038,plateTx);
      pair('staff',i,machine.g,[-.176,-.004,.127],drive.g,[.074,0,.075]);staffControls.push(drive);
    });
    pair('rack',0,portable.g,[-.064,1.188,.042],portable.g,[.061,.914,.053]);
    const pilePos=[[5.55,-15],[10.65,-2.15]],scopePos=[[2.85,1.56,.93],[5.96,1.56,4.01]];
    pilePos.forEach(([x,z],i)=>{
      const pile=batch(root,x,0,z,'Striped tide reference pile '+(i?'B':'A'));
      const body=own(new T.CylinderGeometry(.139,.167,3.62,14));part(pile,body,'#645b48',[0,-1.80,0]);
      for(let j=0;j<12;j++){const y=-3.49+j*.299;
        disc(pile,[0,y,0],.167-(j/12)*.021,.145,j%3===0?'#5c7669':j%2?'#a17458':'#c5bea1','y');}
      // Brass absolute datum is common to both. The outer sounding pile retains its second identifying collar.
      for(const y of (i?[-2.70,-2.47]:[-2.70])){
        disc(pile,[0,y,0],.182,.069,p.bronze,'y');ring(pile,[0,y+.025,0],.179,.005,cream,Math.PI*.5);ring(pile,[0,y-.025,0],.178,.004,p.oxide,Math.PI*.5);
      }
      disc(pile,[0,-.135,0],.167,.160,i?'#675b49':'#527c66','y');
      for(let j=0;j<(i?4:2);j++){
        const a=TAU*j/(i?4:2)+.26;rod(pile,[Math.sin(a)*.11,-.049,Math.cos(a)*.11],[Math.sin(a)*.105,.039+j*.023,Math.cos(a)*.107],.014,'#7e7058');
      }
      for(const y of [-2.88,-1.81,-1.17,-.43]){ring(pile,[0,y,0],.156,.004,p.iron,Math.PI*.5);disc(pile,[0,y,.144],.012,.028,p.bronze,'z',hex);}
    });
    scopePos.forEach(([x,y,z],i)=>{
      const stand=batch(root,x,y,z,'Optical tide reference stand '+(i?'B':'A'));
      const tubeOrigin=v(.13,1.56,-.06),to=v(pilePos[i][0]-x,-2.70-y,pilePos[i][1]-z).sub(tubeOrigin).normalize();
      for(const xx of [-.219,.219])for(const zz of [-.170,.142]){
        block(stand,[xx,.026,zz],.133,.051,.136,p.deep);bolt(stand,xx,.053,zz,.014,'y');
        rod(stand,[xx,.066,zz],[.111,1.084,-.057],.026,p.marine);
      }
      disc(stand,[.111,1.090,-.057],.108,.082,p.bronze,'y');
      disc(stand,[.111,1.167,-.057],.054,.148,p.edge,'y');
      for(const xx of [-.047,.307]){
        rod(stand,[.111,1.194,-.057],[xx,1.355,-.057],.023,p.marine);
        rod(stand,[xx,1.355,-.057],[xx,1.536,-.054],.021,p.edge);
        disc(stand,[xx,1.539,-.056],.040,.055,p.bronze,'x');
      }
      const tube=batch(stand.g,...tubeOrigin.toArray(),'Two-ended open datum sight '+(i?'B':'A'));
      tube.g.rotation.set(Math.asin(to.y),-Math.atan2(to.x,-to.z),0,'YXZ');
      // The true central ray passes through both rings and continues down to the brass collar.
      for(const zz of [-.338,.041]){
        ring(tube,[0,0,zz],.116,.009,p.bronze);ring(tube,[0,0,zz-.012],.108,.004,p.deep);
        for(const xx of [-.099,.099])bolt(tube,xx,-.035,zz+.006,.006);
      }
      for(const sign of [-1,1]){rod(tube,[sign*.102,-.048,.063],[sign*.102,-.048,-.365],.010,p.deep);
        rod(tube,[sign*.111,0,0],[sign*.164,-.008,-.005],.014,p.bronze);}
      for(const xx of [-.087,.087]){rod(tube,[xx,-.063,-.331],[xx,-.052,-.331],.0025,cream);}
      block(tube,[0,-.104,-.128],.066,.013,.460,p.marine);
      const hand=batch(stand.g,.129,1.168,.149,'Sighting stand fine adjustment');
      disc(hand,[0,0,.004],.084,.044,p.marine);notchplate(hand,0,0,.030,.074,-1.45,2.9,17);
      const dial=wheel(hand.g,[0,0,.062],.052,'Reference focus grip');
      grip(stand,-.087,1.173,.125,.134);
      plate(stand,[-.106,.988,.027],.243,.084,.052,.011,p.deep);
      texPlane(stand.g,-.106,.988,.085,.216,.065,label(i?'观 测 B':'观 测 A',i?'OUTER PILE':'INNER PILE'));
      pair('scope',i,stand.g,[-.087,1.173,.162],dial.g,[.042,0,.072]);scopes.push(dial);
    });
    // Original hydrographic plate. Its sounding surface is used for both the hypsometric tint and marching-square contours.
    const shallow=v=>.31+.062*Math.sin((v-.66)*6.64)+(.66-v)*.094;
    const deep=v=>.71+.065*Math.sin((v-.37)*6.24)+(.37-v)*.135;
    function depth(u,v0){
      const gauss=(x,s)=>Math.exp(-x*x/(s*s));
      return .56+2.50*gauss(u-shallow(v0),.112)+4.68*gauss(u-deep(v0),.112)
         -1.97*gauss(u+.012,.173)-1.84*gauss(u-.998,.128)
         -1.16*gauss(u-.118,.132)*gauss(v0-.193,.141)-.95*gauss(u-.872,.139)*gauss(v0-.804,.135)
         +.102*Math.sin(u*26+v0*8)*Math.sin(v0*15-u*11);
    }
    const cw=1460,ch=952;
    function drawChart(c,w,h){
      const rand=rng(19534);
      const small=document.createElement('canvas');small.width=430;small.height=291;const sc=small.getContext('2d'),im=sc.createImageData(small.width,small.height);
      const palette=[[-2,[189,172,136]],[-.4,[194,188,148]],[0,[202,199,161]],[.40,[202,215,192]],[1.7,[177,207,194]],[3,[154,195,187]],[5.2,[133,176,173]]];
      for(let j=0;j<small.height;j++)for(let i=0;i<small.width;i++){
        const d=depth(i/(small.width-1),j/(small.height-1));let n=1;
        while(n<palette.length-1&&d>palette[n][0])n++;
        const [el,cl]=palette[n-1],[eh,cu]=palette[n],f=clamp((d-el)/(eh-el)),grain=(rand()-.5)*6;
        const t=(i+j*small.width)*4;for(let k=0;k<3;k++)im.data[t+k]=cl[k]+(cu[k]-cl[k])*f+grain;im.data[t+3]=255;
      }
      sc.putImageData(im,0,0);c.drawImage(small,0,0,w,h);
      for(let j=0;j<17000;j++){const x=rand()*w,y=rand()*h;c.fillStyle=j%3?'rgba(83,91,69,.072)':'rgba(247,244,206,.17)';c.fillRect(x,y,.4+rand()*2,.5+rand());}
      // Land side engraving, following the gradient of the underlying survey plate.
      for(let j=0;j<3500;j++){
        const u=rand(),v0=rand();if(depth(u,v0)>-.05)continue;
        const ax=depth(u+.001,v0)-depth(u-.001,v0),ay=depth(u,v0+.001)-depth(u,v0-.001),l=Math.hypot(ax,ay)||1;
        c.strokeStyle='rgba(114,112,75,.27)';c.lineWidth=1;
        c.beginPath();c.moveTo(u*w,v0*h);c.lineTo(u*w+ax/l*9,v0*h+ay/l*9);c.stroke();
      }
      const nx=119,ny=76,grid=new Float32Array((nx+1)*(ny+1));
      for(let j=0;j<=ny;j++)for(let i=0;i<=nx;i++)grid[j*(nx+1)+i]=depth(i/nx,j/ny);
      for(const level of [-1.4,-.95,-.50,0,.30,.7,1.0,1.5,2.0,2.5,3.0,3.5,4.0,4.5,4.9]){
        c.beginPath();c.strokeStyle=level===0?'#807d5e':level<0?'rgba(133,124,86,.70)':level%1===0?'rgba(66,116,117,.80)':'rgba(82,133,131,.59)';
        c.lineWidth=level===0?3.1:level%1===0?1.7:.94;
        for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){
          const idx=j*(nx+1)+i,f=[grid[idx],grid[idx+1],grid[idx+nx+2],grid[idx+nx+1]];
          const pts=[],corners=[[i,j],[i+1,j],[i+1,j+1],[i,j+1]];
          for(let e=0;e<4;e++){const n=(e+1)%4;if((f[e]>=level)===(f[n]>=level))continue;
            const a=(level-f[e])/(f[n]-f[e]);
            pts.push([(corners[e][0]+(corners[n][0]-corners[e][0])*a)*w/nx,(corners[e][1]+(corners[n][1]-corners[e][1])*a)*h/ny]);}
          for(let e=0;e+1<pts.length;e+=2){c.moveTo(...pts[e]);c.lineTo(...pts[e+1]);}
        }c.stroke();
      }
      c.strokeStyle='rgba(78,100,86,.31)';c.lineWidth=1;
      for(let i=1;i<12;i++){c.beginPath();c.moveTo(i*w/12,0);c.lineTo(i*w/12,h);c.stroke();}
      for(let j=1;j<8;j++){c.beginPath();c.moveTo(0,j*h/8);c.lineTo(w,j*h/8);c.stroke();}
      // Older plotted red and green bearings are independent of the newly determined route.
      function bearing(x,y,u,v,col){c.strokeStyle=col;c.lineWidth=2.1;c.setLineDash([20,7,3,7]);c.beginPath();c.moveTo(x*w,y*h);c.lineTo(u*w,v*h);c.stroke();c.setLineDash([]);}
      bearing(.16,.99,.80,.12,'rgba(154,72,56,.76)');bearing(.88,.99,.19,.48,'rgba(55,112,85,.85)');
      for(let j=0;j<86;j++){
        const u=.08+rand()*.86,v0=.13+rand()*.73,d=depth(u,v0);
        if(d<.4||Math.hypot(u-.31,v0-.66)<.060||Math.hypot(u-.71,v0-.37)<.065)continue;
        c.fillStyle='rgba(57,97,94,.84)';c.font='italic 18px Georgia,serif';c.fillText(d.toFixed(1),u*w,v0*h);
      }
      c.strokeStyle='#496157';c.lineWidth=1.8;c.strokeRect(12,13,w-24,h-26);
      for(let j=0;j<48;j++){
        c.fillStyle=j%2?'#60776a':'#ddd5ae';const len=(w-26)/48;c.fillRect(13+j*len,13,len,5);c.fillRect(13+j*len,h-18,len,5);
      }
      const targets=[[.31,.66],[.71,.37]];
      for(let i=0;i<2;i++){
        const [u,v0]=targets[i],x0=u*w,y0=v0*h;
        c.strokeStyle='#384f4a';c.lineWidth=3.5;c.beginPath();c.arc(x0,y0,20,0,TAU);c.stroke();
        c.beginPath();c.moveTo(x0-34,y0);c.lineTo(x0-15,y0);c.moveTo(x0+15,y0);c.lineTo(x0+34,y0);c.moveTo(x0,y0-30);c.lineTo(x0,y0-14);c.moveTo(x0,y0+14);c.lineTo(x0,y0+30);c.stroke();
        c.font='bold 29px sans-serif';c.fillStyle='#364f4c';c.fillText(i?'候选 Ⅱ':'候选 Ⅰ',x0+37,y0-11);
        c.font='21px monospace';c.fillText('底 '+TideSoundings.channels[i].bed.toFixed(2),x0+37,y0+18);
      }
      // The compass sights and chart pins refer to the same physical landmarks.
      for(const [i,name] of ['旧绿标','双环断桩'].entries()){
        const a=TideSurveyPlot.anchor(i);c.save();c.translate(a.u*w,a.v*h);
        c.strokeStyle=i?'#594635':'#325845';c.fillStyle=i?'#795a40':'#547957';c.lineWidth=4;
        c.beginPath();
        if(i){c.moveTo(-7,-5);c.lineTo(-6,-30);c.lineTo(0,-23);c.lineTo(6,-34);c.lineTo(7,-5);}
        else{c.moveTo(-11,-8);c.lineTo(0,-32);c.lineTo(11,-8);c.closePath();}
        c.fill();c.stroke();
        if(i){c.strokeRect(-10,-11,20,3);c.strokeRect(-10,-19,20,3);}
        c.beginPath();c.arc(0,0,5.4,0,TAU);c.stroke();
        c.font='bold 22px sans-serif';c.textAlign=i?'right':'center';c.fillText(name,i?-16:0,i?-10:30);c.restore();
      }
      // Cartouche and hand-engraved compass rose.
      c.fillStyle='rgba(225,221,191,.88)';c.fillRect(31,31,507,112);c.strokeStyle='#91987f';c.strokeRect(31,31,507,112);
      c.font='bold 42px sans-serif';c.fillStyle='#3d554e';c.fillText('北岬北口 · 潮位复测图',51,87);
      c.font='20px monospace';c.fillText('SHEET 09  /  NORTH INLET  /  1:500',53,123);
      const xx=w-124,yy=116;c.strokeStyle='#556751';c.lineWidth=2;for(const rad of [34,41]){c.beginPath();c.arc(xx,yy,rad,0,TAU);c.stroke();}
      for(let j=0;j<8;j++){const a=j*Math.PI/4,rr=j%2?23:40;c.beginPath();c.moveTo(xx,yy);c.lineTo(xx+Math.sin(a)*rr,yy-Math.cos(a)*rr);c.stroke();}
      c.fillStyle='#4b5e50';c.font='bold 21px Georgia';c.fillText('N',xx-8,yy-49);
      c.fillStyle='rgba(225,221,191,.86)';c.fillRect(34,h-78,300,47);c.font='19px monospace';c.fillStyle='#485d50';c.fillText('0       5        10 m',50,h-47);
      for(let i=0;i<6;i++){c.fillStyle=i%2?'#ddcfaa':'#536d61';c.fillRect(47+i*43,h-42,43,5);}
    }
    const work=batch(root,-.70,1.56,2.92,'North inlet chart desk'),board=batch(work.g,0,1.024,-.137,'Inclined plotting frame');board.g.rotation.x=-.961;
    for(const x of [-.62,.82])for(const z of [-.403,.127]){
      block(work,[x,.039,z],.122,.071,.118,p.iron);const h=z>0?.700:.845;block(work,[x,.018+h*.5,z],.060,h,.063,p.deep);
    }
    for(const zz of [-.351,.079])block(work,[.102,.778,zz],1.717,.061,.060,p.marine);
    for(const x of [-.620,.820])rod(work,[x,.66,.099],[x,1.155,-.401],.022,p.edge);
    const mapW=1.286,mapH=.812,chartFace=map(cw,ch,drawChart);
    plate(board,[.139,0,-.065],1.731,.912,.062,.027,wood);
    plate(board,[0,0,-.012],mapW+.056,mapH+.058,.013,.015,p.marine);
    const textile={roughness:.83,metalness:.03,emissive:0x13180d,emissiveIntensity:.21};
    texPlane(board.g,0,0,.008,mapW,mapH,chartFace,textile);
    for(const i of [-1,1])for(const j of [-1,1]){block(board,[i*(mapW*.5-.010),j*(mapH*.5-.011),.018],.065,.040,.014,p.bronze);disc(board,[i*(mapW*.5-.010),j*(mapH*.5-.011),.029],.008,.006,p.chrome,'z',hex);}
    const band=canvasSlot(980,640),overlay=texPlane(board.g,0,0,.013,mapW,mapH,band.tx,{transparent:true,depthWrite:false,roughness:.86,metalness:0,side:T.DoubleSide});
    overlay.renderOrder=1;
    function drawBand(marked,solved,aa,bb,ray){
      const c=band.c,w=band.can.width,h=band.can.height;c.clearRect(0,0,w,h);
      if(solved){
        const mean=(aa+bb)*.5,wide=clamp(.048+(mean+2.55)*.012,.035,.066),dxy=clamp((aa-bb)*.013,-.020,.020);
        function ribbon(fn,half){
          c.beginPath();for(let i=0;i<=80;i++){const y=i/80,x=(fn(y)-half)*w;if(!i)c.moveTo(x,0);else c.lineTo(x,y*h);}
          for(let i=80;i>=0;i--){const y=i/80;c.lineTo((fn(y)+half)*w,y*h);}c.closePath();
        }
        const lead=t=>deep(t)+dxy*Math.sin((t-.37)*Math.PI);
        ribbon(shallow,.060);c.fillStyle='rgba(173,76,52,.19)';c.fill();c.strokeStyle='rgba(145,65,48,.70)';c.lineWidth=2;c.stroke();c.save();c.clip();
        for(let j=-h;j<w+h;j+=16){c.beginPath();c.moveTo(j,0);c.lineTo(j-h,h);c.strokeStyle='rgba(140,66,43,.38)';c.lineWidth=1.2;c.stroke();}c.restore();
        ribbon(lead,wide);c.fillStyle='rgba(71,136,102,.28)';c.fill();c.strokeStyle='rgba(49,105,76,.90)';c.lineWidth=2.8;c.stroke();
        c.strokeStyle='rgba(43,95,68,.86)';c.setLineDash([12,7]);c.lineWidth=1.8;c.beginPath();for(let i=0;i<=80;i++){const y=i/80,x=lead(y)*w;if(!i)c.moveTo(x,0);else c.lineTo(x,y*h);}c.stroke();c.setLineDash([]);
        c.fillStyle='rgba(224,221,187,.91)';c.fillRect(w*.484,h*.797,w*.367,h*.077);c.strokeStyle='#718a6e';c.strokeRect(w*.484,h*.797,w*.367,h*.077);c.fillStyle='#436450';c.font='bold 22px sans-serif';c.fillText('复测限行带　／　深槽',w*.501,h*.848);
      }
      if(marked&&ray){
        c.save();c.strokeStyle='rgba(82,61,44,.75)';c.lineWidth=3;c.setLineDash([15,6,4,6]);c.beginPath();
        c.moveTo(ray.u*w,ray.v*h);c.lineTo((ray.u+ray.du*75)*w,(ray.v+ray.dv*75)*h);c.stroke();c.restore();
      }
      if(marked||solved){
        c.strokeStyle='rgba(125,67,46,.85)';c.lineWidth=2.2;c.beginPath();c.ellipse(w*.669,h*.38,18,23,-.11,0,TAU);c.stroke();
      }
      band.tx.needsUpdate=true;
    }
    const rule=TideChartRule.create(board.g,mapW,mapH);
    const readSheet=canvasSlot(520,896);
    plate(board,[.841,0,-.009],.327,.813,.021,.016,'#948e74');
    texPlane(board.g,.841,0,.018,.308,.788,readSheet.tx,textile);
    for(const x of [.754,.922]){block(board,[x,.383,.023],.036,.045,.015,p.bronze);bolt(board,x,.380,.035,.006);}
    const format=h=>typeof h==='number'&&Number.isFinite(h)?(h<0?'−':'+')+Math.abs(h).toFixed(2):'—';
    function drawReadings(a,b,solved){
      const c=readSheet.c,w=readSheet.can.width,h=readSheet.can.height,r=rng(4219);c.fillStyle='#e1d7b6';c.fillRect(0,0,w,h);
      for(let j=0;j<5400;j++){c.fillStyle=j%2?'rgba(99,85,56,.065)':'rgba(247,242,210,.17)';c.fillRect(r()*w,r()*h,.5+r()*2,.9);}
      c.textAlign='left';c.fillStyle='#405848';c.font='bold 46px sans-serif';c.fillText('实测潮位',35,90);c.font='21px monospace';c.fillText('FIELD BOOK  /  METRES',36,132);c.strokeStyle='#89917b';c.lineWidth=2;c.strokeRect(25,25,w-50,h-50);
      for(const [i,reading] of [a,b].entries()){
        const y=207+i*183;c.font='bold 31px sans-serif';c.fillStyle=i?'#55705c':'#8d5144';c.fillText(i?'B　外侧标尺':'A　内侧标尺',38,y);c.font='bold 60px monospace';c.fillText(format(reading),47,y+83);
        c.font='26px monospace';c.fillText('m',424,y+83);c.strokeStyle='#a29f85';c.lineWidth=2;c.beginPath();c.moveTo(37,y+105);c.lineTo(w-37,y+105);c.stroke();
      }
      const x0=97,x1=456,y0=555,y1=754;const ordinate=n=>y1-clamp((n+3.6)/3.0)*(y1-y0);
      c.font='21px monospace';c.fillStyle='#627260';
      for(const n of [-1,-2,-3]){
        const yy=ordinate(n);c.fillText(String(n),39,yy+8);c.strokeStyle='#a3ac96';c.lineWidth=1;c.beginPath();c.moveTo(x0,yy);c.lineTo(x1,yy);c.stroke();
      }
      c.strokeStyle='#637562';c.lineWidth=2;c.strokeRect(x0,y0,x1-x0,y1-y0);
      if(a!==null&&b!==null){c.beginPath();c.moveTo(178,ordinate(a));c.lineTo(378,ordinate(b));c.lineWidth=4;c.strokeStyle='#5a7465';c.stroke();}
      for(const [i,r0] of [a,b].entries())if(r0!==null){c.beginPath();c.fillStyle=i?'#497755':'#9e5644';c.arc(i?378:178,ordinate(r0),9,0,TAU);c.fill();}
      c.fillStyle='#536954';c.font='bold 24px sans-serif';c.fillText('A',168,y1+36);c.fillText('B',367,y1+36);c.font='25px sans-serif';c.fillText(solved?'复核完成　附限行带':'基准　北岬站零点',37,848);
      readSheet.tx.needsUpdate=true;
    }
    // Sliding optical square: the glass can be seen through, and its hairline intersection is exactly plot[u,v].
    const slide=batch(board.g,0,0,.031,'Two-axis transparent plot cursor');
    const acetate=map(360,300,(c,w,h)=>{
      const g=c.createLinearGradient(0,0,w,h);g.addColorStop(0,'rgba(238,248,219,.13)');g.addColorStop(.36,'rgba(210,229,225,.06)');g.addColorStop(.41,'rgba(243,250,234,.21)');g.addColorStop(.57,'rgba(225,237,220,.07)');g.addColorStop(1,'rgba(244,247,228,.12)');c.fillStyle=g;c.fillRect(0,0,w,h);
    });
    const glass=texPlane(slide.g,0,0,0,.228,.184,acetate,{transparent:true,depthWrite:false,roughness:.15,metalness:.10,side:T.DoubleSide});glass.renderOrder=2;
    for(const xx of [-.115,.115])block(slide,[xx,0,0],.006,.189,.008,p.bronze);
    for(const yy of [-.094,.094])block(slide,[0,yy,0],.234,.006,.008,p.bronze);
    block(slide,[0,0,.007],.206,.0019,.0015,'#9d4635');block(slide,[0,0,.007],.0019,.168,.0015,'#9d4635');
    ring(slide,[0,0,.008],.020,.0017,'#9d4635');
    for(const xx of [-.113,.113])for(const yy of [-.090,.090])bolt(slide,xx,yy,.009,.004);
    const riderX=batch(board.g,0,mapH*.5+.018,.025,'Plot rail horizontal readback');
    disc(riderX,[0,0,0],.014,.033,p.bronze,'x');
    const riderY=batch(board.g,-mapW*.5-.018,0,.025,'Plot rail vertical readback');
    disc(riderY,[0,0,0],.014,.033,p.bronze,'y');
    for(const sign of [-1,1]){rod(board,[-mapW*.5,sign*(mapH*.5+.018),.023],[mapW*.5,sign*(mapH*.5+.018),.023],.0058,p.chrome);}
    rod(board,[-mapW*.5-.018,-mapH*.5,.023],[-mapW*.5-.018,mapH*.5,.023],.006,p.chrome);
    const plotWheels=[];
    for(const [i,x] of [-.239,.239].entries()){
      plate(work,[x,.755,.242],.151,.130,.042,.017,p.marine);
      disc(work,[x,.755,.291],.044,.044,p.bronze);
      const f=wheel(work.g,[x,.755,.328],.067,i?'Northing plot thumbwheel':'Easting plot thumbwheel');plotWheels.push(f);
    }
    pair('chart',0,plotWheels[0].g,[.053,0,.072],plotWheels[1].g,[.053,0,.072]);
    const radio=batch(root,3.15,1.56,5.23,'Survey service shore radio');
    for(const xx of [-.34,.34])for(const zz of [-.276,.059]){
      block(radio,[xx,.43,zz],.057,.86,.060,p.deep);block(radio,[xx,.029,zz],.135,.056,.130,p.iron);
    }
    block(radio,[0,.850,-.108],.971,.075,.535,wood);
    plate(radio,[0,1.069,-.332],.834,.330,.342,.033,p.marine);
    plate(radio,[0,1.067,.014],.801,.307,.017,.025,p.deep);
    boltGrid(radio,0,1.069,.039,.720,.236,.012);
    const spx=-.247,spy=1.099;disc(radio,[spx,spy,.047],.099,.017,p.gap);
    ring(radio,[spx,spy,.061],.093,.006,p.bronze);
    for(let i=-4;i<=4;i++){const yy=i*.017,half=Math.sqrt(.083**2-yy*yy);block(radio,[spx,spy+yy,.063],half*2,.006,.008,p.edge);}
    const lamp=jewel(radio,.220,1.125,.042,.027,'#96caa0');
    texPlane(radio.g,.026,1.154,.039,.214,.061,label('测 潮 专 线','SURVEY / RX'));
    for(const x of [-.085,.048]){disc(radio,[x,.996,.041],.035,.028,p.chrome);disc(radio,[x,.996,.067],.027,.042,ebony);block(radio,[x,1.010,.090],.003,.019,.003,cream);}
    const mic=batch(radio.g,.282,.996,.083,'Survey microphone');
    oval(mic,[.013,.062,.014],[.050,.053,.032],ebony);rod(mic,[.013,.035,.017],[-.015,-.069,.031],.022,ebony);
    for(let i=-2;i<=2;i++)block(mic,[.013,.063+i*.011,.042],.056-Math.abs(i)*.008,.003,.003,p.edge);
    hose(radio,[[.265,.930,.097],[.309,.837,.089],[.360,.868,.066],[.365,.968,.022]],.005,ebony,19);
    grip(radio,-.190,.932,.066,.150);
    pair('radio',0,radio.g,[-.190,.932,.103],mic.g,[-.011,-.041,.040]);
    for(const o of templates)finish(o);templates.clear();
    for(const [src,plain] of repeatGeo)for(const g of [src,plain])if(g!==bulbGeo&&resources.delete(g))g.dispose();
    repeatGeo.clear();torusCache.clear();
    let lastJaw=null,lastRead='',lastOverlay='';
    function update(s={}){
      rule.update(s.rule);
      const active=s.mount===0||s.mount===1,m=active?s.mount:-1,carrying=!!s.carry&&!active;
      carryRig.visible=!active&&(carrying||s.rack!==false);installed.g.visible=active;jaw.g.visible=active;
      if(carrying&&s.staff){
        const a=s.staff;
        carryRig.position.set(a[0],a[1],a[2]);carryRig.rotation.y=a[3]||0;
        portable.g.position.set(-.232,.08,-.058);portable.g.rotation.set(-.161,0,.074);
      }else{
        carryRig.position.set(-3.3,1.56,3.65);carryRig.rotation.y=0;
        portable.g.position.set(0,.06,.035);portable.g.rotation.set(.014,0,-.026);
      }
      const j=clamp(Number.isFinite(s.jaw)?s.jaw:-2.7,-3.45,-.80);
      if(active){const [x,,z]=socketPos[m];installed.g.position.set(x+1.30,rodLow,z);jaw.g.position.set(x+1.30,j,z);}
      staffControls.forEach((d,i)=>{d.g.rotation.z=active&&m===i?(j-rodLow)*TAU/.218:0;});
      for(let i=0;i<2;i++)displays[i].visible=i===m;
      const cm=Math.round(j*100)/100;
      if(cm!==lastJaw){jawReadout(cm);lastJaw=cm;}
      const uv=s.plot??[.50,.5],u=clamp(Number.isFinite(uv[0])?uv[0]:.5),v0=clamp(Number.isFinite(uv[1])?uv[1]:.5);
      slide.g.visible=!s.rule?.show;
      slide.g.position.x=(u-.5)*mapW;slide.g.position.y=(.5-v0)*mapH;riderX.g.position.x=slide.g.position.x;riderY.g.position.y=slide.g.position.y;
      plotWheels[0].g.rotation.z=s.rule?.show?s.rule.dial:-u*TAU*2.2;
      plotWheels[1].g.rotation.z=s.rule?.show?s.plotter.seat*TAU:v0*TAU*1.7;
      const reading=i=>typeof s.readings?.[i]==='number'&&Number.isFinite(s.readings[i])?Math.round(s.readings[i]*100)/100:null;
      const aa=reading(0),bb=reading(1),solved=!!s.solved,marked=!!s.marked;
      const rk=[aa,bb,solved].join('|');if(rk!==lastRead){drawReadings(aa,bb,solved);lastRead=rk;}
      const bk=[rk,marked].join('|');if(bk!==lastOverlay){drawBand(marked,solved,aa??-2.7,bb??-2.7,s.plotter?.legacy?s.sight:null);lastOverlay=bk;}
      scopes.forEach((o,i)=>{o.g.rotation.z=(s.readings?.[i]!=null ? .74 : 0)+(i&&marked ? .39 : 0);});
      lamp(solved?1:marked?.62:.02);mic.g.rotation.z=marked?-.055:0;
    }
    function hands(kind,index=0){
      const key=kind+(Number.isInteger(index)?index:0),q=contacts.get(key);if(!q)return null;
      const out=globs.get(key);for(let i=0;i<2;i++){const g=q[i*2];g.updateWorldMatrix(true,false);out[i].copy(q[i*2+1]).applyMatrix4(g.matrixWorld);}return out;
    }
    function dispose(){rule.dispose();root.removeFromParent();root.clear();resources.forEach(r=>r.dispose());resources.clear();globs.clear();contacts.clear();}
    update();return {update,hands,dispose};
  }
  return {create};
})();
if(typeof window!=='undefined')window.TideSoundingsGear=TideSoundingsGear;
