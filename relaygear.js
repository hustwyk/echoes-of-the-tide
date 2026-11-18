// North Cape relay office. All fixtures below are local to the chapter parent.
const TideRelayGear=(()=>{
  const T=THREE,TAU=2*Math.PI,clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
  const v=(x=0,y=0,z=0)=>new T.Vector3(x,y,z);
  function rng(seed){return ()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}
  function create(parent){
    const root=new T.Group();root.name='North Cape / corrective message office';parent.add(root);
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
    const haul=batch(root,-.05,0,2.70,'Transfer trolley index winch');
    for(const x of [-.312,.312])for(const z of [-.235,.120]){
      block(haul,[x,.034,z],.15,.065,.14,p.iron);bolt(haul,x+.045,.070,z,.014,'y');
      rod(haul,[x,.075,z],[x*.65,.843,z],.044,p.marine);
    }
    for(const s of [-1,1])rod(haul,[s*.31,.26,-.235],[s*.31,.26,.12],.022,p.edge);
    disc(haul,[0,.902,-.063],.045,.581,p.chrome);
    for(const z of [-.252,.135]){
      plate(haul,[0,.873,z-.027],.452,.219,.05,.031,p.deep);boltGrid(haul,0,.873,z+.034,.34,.123,.012);
    }
    const reel=batch(haul.g,0,.927,-.051,'Cable barrel and retaining flanges');
    disc(reel,[0,0,0],.155,.272,'#625a49');
    for(const z of [-.147,.147]){disc(reel,[0,0,z],.185,.018,p.marine);ring(reel,[0,0,z+.008],.177,.006,p.bronze);}
    const twists=[];for(let j=0;j<=210;j++){const f=j/210,a=TAU*14*f;twists.push([.155*Math.cos(a),.155*Math.sin(a),-.138+.272*f]);}hose(reel,twists,.008,'#8c7d60',210);
    const indexed=wheel(haul.g,[.049,.932,.172],.221,'Indexed transfer wheel');
    for(let i=0;i<19;i++){const a=i*TAU/19;block(indexed,[Math.sin(a)*.215,Math.cos(a)*.215,.015],.008,i%3===0?.019:.011,.005,i%3===0?cream:p.edge,0,0,-a);}
    plate(haul,[.05,1.201,.129],.119,.067,.041,.010,p.deep);block(haul,[.05,1.182,.176],.007,.047,.006,amber);
    grip(haul,-.236,.834,.153,.120);
    plate(haul,[0,.643,.109],.337,.112,.042,.014,p.deep);
    texPlane(haul.g,0,.643,.158,.311,.086,label('摆 渡 索 车','TRAVEL   /   INDEX'));
    pair('haul',0,haul.g,[-.236,.834,.190],indexed.g,[.177,0,.075]);
    // Offset Yagi. The camera/sight ray through the gimbal origin is intentionally an unobstructed line.
    const mast=batch(root,-2.74,4.56,-3.66,'Relay mast traversing stand'),boresight=1.470;
    disc(mast,[0,.034,0],.277,.064,p.marine,'y');
    for(let j=0;j<6;j++){const a=j*TAU/6;bolt(mast,.219*Math.cos(a),.070,.219*Math.sin(a),.017,'y');}
    const pole=[[.211,.061],[.201,.089],[.134,.162],[.111,.211],[.093,.979],[.131,1.029],[.168,1.046]];
    part(mast,own(new T.LatheGeometry(pole.map(q=>new T.Vector2(...q)),36)),p.green,[0,0,0]);
    disc(mast,[0,1.072,0],.17,.074,p.bronze,'y');ring(mast,[0,1.112,0],.162,.007,p.chrome,Math.PI*.5);
    for(let j=0;j<36;j++){const a=j*TAU/36;block(mast,[.145*Math.sin(a),1.111,.145*Math.cos(a)],.004,.004,j%3?.015:.027,j%3?p.edge:cream,0,a);}
    const yaw=batch(mast.g,0,boresight,0,'Azimuth bearing');
    disc(yaw,[0,-.323,0],.119,.090,p.iron,'y');
    for(const x of [-.231,.231]){
      rod(yaw,[0,-.334,.033],[x,-.179,.028],.030,p.marine);
      rod(yaw,[x,-.179,.028],[x,0,.016],.026,p.edge);
      disc(yaw,[x,0,.016],.047,.075,p.bronze,'x');
    }
    block(yaw,[.102,-.347,.093],.064,.016,.017,amber,0,.78);
    const elevation=batch(yaw.g,0,0,0,'Yagi elevation trunnions and open sight');
    rod(elevation,[-.233,0,.016],[-.162,-.029,.016],.020,p.chrome);
    rod(elevation,[.232,0,.016],[.348,.171,.016],.026,p.edge);
    rod(elevation,[.349,.174,.614],[.349,.174,-1.109],.018,p.chrome);
    for(const [j,z] of [.467,.288,.04,-.176,-.387,-.596,-.816,-1.038].entries()){
      const half=.569-j*.034;
      if(j===1){
        // The driven element is folded back on itself with a visible insulation break.
        const h=half;hose(elevation,[[.349-.035,.224,z],[.349-h,.224,z],[.349-h-.018,.224,z-.037],[.349-h,.224,z-.071],[.349+h,.224,z-.071],[.349+h+.018,.224,z-.037],[.349+h,.224,z],[.349+.035,.224,z]],.0065,p.copper,68);
        ceramic(elevation,[.349,.182,z],.029,.062,cream);
      }else{
        rod(elevation,[.349-half,.218,z],[.349+half,.218,z],.0075,p.chrome);
        for(const x of [.349-half,.349+half])oval(elevation,[x,.218,z],[.009,.009,.009],ebony);
        block(elevation,[.349,.200,z],.044,.043,.061,p.marine);bolt(elevation,.349,.226,z,.008,'y');
      }
    }
    for(const z of [.124,.391]){rod(elevation,[-.156,-.033,z],[-.156,-.088,z],.011,p.edge);ring(elevation,[-.156,-.008,z],.050,.006,p.bronze);}
    // Two U-shaped open-backed sight rings leave the optical axis and upper field clear.
    rod(elevation,[-.156,-.083,.414],[-.156,-.083,.084],.010,p.deep);
    rod(elevation,[.096,-.046,.136],[.345,.153,.136],.016,p.deep);
    plate(elevation,[.339,.118,.245],.115,.094,.101,.011,p.deep);
    hose(elevation,[[.348,.155,.296],[.367,.111,.417],[.322,.045,.351],[.244,-.052,.212]],.006,ebony,22);
    const trainers=[-.187,.195].map((x,i)=>{
      rod(mast,[x*.24,.905,.016],[x,1.052,.191],.034,p.deep);
      disc(mast,[x,1.055,.195],.071,.071,p.iron);
      const wh=wheel(mast.g,[x,1.055,.237],.091,i?'Azimuth thumb wheel':'Elevation tracking wheel');
      notchplate(mast,x,1.055,.215,.106,-1.7,3.4,21);
      return wh;
    });
    pair('mast',0,trainers[0].g,[.073,0,.072],trainers[1].g,[.073,0,.072]);
    plate(mast,[-.287,1.029,.134],.16,.244,.070,.020,p.deep);
    const throat=batch(mast.g,-.291,1.065,.212,'Mast dictation microphone');
    oval(throat,[0,.042,.016],[.057,.066,.036],ebony);
    for(let k=-3;k<=3;k++)block(throat,[0,.043+k*.011,.049],.066-Math.abs(k)*.009,.003,.003,p.edge);
    block(throat,[0,-.039,0],.045,.094,.043,ebony,0,0,-.07);block(throat,[-.025,-.017,.004],.009,.044,.024,p.bronze);
    hose(mast,[[-.288,.981,.213],[-.341,.805,.201],[-.266,.747,.178],[-.213,.891,.112]],.005,ebony,28);
    pair('throat',0,throat.g,[-.010,-.013,.037],trainers[1].g,[.073,0,.072]);
    const titles=['旧事故摘要','本次交接联（六日前）','今夜值班簿'],sheetMaps=[];
    function paperBed(c,w,h,tint,seed){
      const r=rng(seed);c.fillStyle=tint;c.fillRect(0,0,w,h);
      for(let i=0;i<18500;i++){c.fillStyle=i%2?'rgba(255,251,227,.13)':'rgba(99,90,62,.095)';c.fillRect(r()*w,r()*h,.5+r()**2*3,.5+r()*1.5);}
      const bleed=c.createLinearGradient(0,0,w,0);bleed.addColorStop(0,'rgba(117,105,76,.24)');bleed.addColorStop(.036,'rgba(117,105,76,0)');bleed.addColorStop(.95,'rgba(117,105,76,0)');bleed.addColorStop(1,'rgba(117,105,76,.13)');c.fillStyle=bleed;c.fillRect(0,0,w,h);
      for(let i=0;i<8;i++){const x=r()*w,y=r()*h,rad=(.03+r()**3*.11)*w,g=c.createRadialGradient(x,y,0,x,y,rad);g.addColorStop(0,'rgba(127,110,68,.070)');g.addColorStop(1,'rgba(127,110,68,0)');c.fillStyle=g;c.fillRect(x-rad,y-rad,rad*2,rad*2);}
    }
    function documentMap(k){
      const form=[{tint:'#d6c099',accent:'#704d39',archive:'N·C / A-018',date:'旧事故当年',rows:[['作业','灯机复起，转动正常。'],['航线','北线水深仍待复测。'],['附件','随卷收存测深簿。']],foot:'归档联　/　事故调查室'},
        {tint:'#ebe2c8',accent:'#456057',archive:'N·C / H-206',date:'六日前 · 本次交班',rows:[['验收','灯机试转　正常'],['验收人','林澈'],['交班确认','沈遥']],foot:'交接导出联　/　第一联'},
        {tint:'#d2dcc8',accent:'#455e61',archive:'N·C / N-043',date:'今夜 · 北岬值守',rows:[['收报','海雁号已接入岸台。'],['驾驶台','梁青等候更正稿。'],['船尾','阿棠在位，等候问讯。']],foot:'值班记录　/　续记于背页'}][k];
      return map(1100,922,(c,w,h)=>{
        paperBed(c,w,h,form.tint,996+k*314);const a=form.accent;
        c.fillStyle=a;c.font='bold 22px monospace';c.textAlign='left';c.fillText(form.archive,93,85);c.textAlign='right';c.font='25px sans-serif';c.fillText('北岬航标站　／　中继办公室',1023,85);
        c.strokeStyle=a;c.lineWidth=4;c.beginPath();c.moveTo(87,111);c.lineTo(1020,111);c.stroke();c.textAlign='left';
        c.fillStyle=a;c.font='bold '+(k===1?64:78)+'px sans-serif';c.fillText(titles[k],89,238,925);
        c.font='36px sans-serif';c.fillText('日期　'+form.date,95,314,908);
        for(let i=0;i<4;i++){const y=359+i*107;c.strokeStyle=k===1?'#a4aea0':'#ab9f83';c.lineWidth=i===0?3:2;c.beginPath();c.moveTo(88,y);c.lineTo(1020,y);c.stroke();}
        c.beginPath();c.moveTo(307,359);c.lineTo(307,680);c.stroke();
        for(let i=0;i<3;i++){const [key,val]=form.rows[i],y=430+i*107;c.font='32px sans-serif';c.fillStyle=a;c.fillText(key,104,y,182);c.font=k===1&&i>0?'italic 47px serif':'43px sans-serif';c.fillStyle=k===1?'#314a49':'#454b43';c.fillText(val,332,y,660);}
        if(k===1){
          // The heading survives the clipping of the carbon original. The pencil nick lies in unprinted paper.
          c.save();c.strokeStyle='rgba(88,93,82,.26)';c.lineWidth=3;c.beginPath();c.moveTo(726,715);c.quadraticCurveTo(777,710,807,725);c.stroke();c.strokeStyle='rgba(255,251,221,.80)';c.beginPath();c.moveTo(726,718);c.quadraticCurveTo(780,714,807,727);c.stroke();c.restore();
          c.fillStyle='rgba(81,103,92,.35)';c.fillRect(89,740,935,2);c.font='22px monospace';c.fillText('复写纸 第一联   /   1 OF 2',96,783);
        }else{
          c.save();c.translate(800,756);c.rotate(-.065);c.strokeStyle=k===0?'rgba(142,63,47,.67)':'rgba(66,102,85,.65)';c.lineWidth=4;c.strokeRect(-65,-29,188,58);c.fillStyle=c.strokeStyle;c.font='bold 35px sans-serif';c.fillText(k===0?'归　档':'值　夜',-41,12);c.restore();
        }
        c.fillStyle=a;c.font='23px sans-serif';c.fillText(form.foot,91,851);
        for(let i=0;i<6;i++){c.fillStyle='rgba(84,86,65,.22)';c.beginPath();c.arc(47,162+i*111,6,0,TAU);c.fill();}
      });
    }
    const refs=batch(root,3.40,0,.18,'Angled document trestle');
    for(const xx of [-1.58,0,1.58]){
      for(const zz of [-.207,.228]){
        block(refs,[xx,.036,zz],.143,.067,.129,p.iron);
        rod(refs,[xx,.071,zz],[xx,.838,zz*.56],.031,p.deep);
      }
      rod(refs,[xx,.61,-.16],[xx,.74,.20],.023,p.edge);
    }
    for(const zz of [-.115,.133])block(refs,[0,.798,zz],3.79,.069,.066,p.marine);
    const files=[],fileX=[2.05,3.40,4.75],boardPitch=-.937;
    for(let i=0;i<3;i++){
      const s=batch(root,fileX[i],.94,.18,'File rack '+(i+1));s.g.rotation.x=boardPitch;
      plate(s,[0,0,-.047],.835,.740,.042,.020,i===0?wood:i===1?p.deep:'#657969');block(s,[0,-.350,.004],.832,.030,.059,p.bronze);
      const file=batch(s.g,0,0,.006,'Working archive original '+(i+1));
      const deckColors=['#b6a183','#c0bda6','#a7b49d'];plate(file,[0,0,-.001],.733,.642,.007,.007,deckColors[i]);
      block(file,[-.373,0,.001],.028,.659,.017,i===0?'#6f5344':i===1?'#697a6d':'#536765');
      const tx=documentMap(i);sheetMaps.push(tx);
      texPlane(file.g,0,0,.012,.724,.634,tx,{metalness:.01,roughness:.84,emissive:0x14140c,emissiveIntensity:.31});
      for(const y of [-.215,.206]){disc(file,[-.359,y,.009],.011,.009,p.chrome);disc(file,[-.359,y,.016],.005,.007,p.gap);}
      for(const x of [-.267,.267]){disc(s,[x,.297,.021],.012,.018,p.bronze);block(s,[x,.325,.017],.031,.057,.010,p.edge);}
      block(s,[.384,.147,.006],.050,.126,.019,[p.red,p.bronze,teal][i]);files.push(file);
      pair('file',i,file.g,[-.244,-.231,.019],file.g,[.242,-.237,.018]);
    }
    // The station is a physical six-position paper transmitter and a separate marine radio in a field-office desk.
    const desk=batch(root,3.70,0,-4.70,'Correction office strip transmitter');
    for(const x of [-.84,.84]){
      for(const z of [-.558,.043]){
        block(desk,[x,.387,z],.076,.77,.083,p.deep);
        block(desk,[x,.029,z],.145,.053,.141,p.iron);
      }
      rod(desk,[x,.244,-.558],[x,.244,.044],.025,p.edge);
    }
    block(desk,[0,.771,-.246],1.968,.119,.787,wood);block(desk,[0,.835,-.246],1.986,.047,.802,'#88745b');
    block(desk,[0,.778,.151],1.981,.042,.029,p.bronze);
    for(const x of [-.650,.650]){
      plate(desk,[x,.620,-.353],.479,.187,.387,.015,'#7e6b53');
      for(const xx of [x-.071,x+.071])rod(desk,[xx,.624,.037],[xx,.624,.075],.007,p.chrome);
      rod(desk,[x-.071,.624,.075],[x+.071,.624,.075],.009,p.chrome);
    }
    const panel=batch(desk.g,.036,1.169,-.272,'Type bed and message gate');
    panel.g.rotation.x=-.817;
    plate(panel,[0,.007,-.100],1.212,.741,.085,.040,p.marine);
    plate(panel,[0,.007,-.010],1.174,.710,.014,.028,p.deep);
    boltGrid(panel,0,.014,.016,1.102,.653,.009);
    block(panel,[0,.304,.004],1.065,.062,.015,p.green);
    const chunks=['林澈','只验了','灯机','北线','没有','复测'],punct=['','','；','','','。'];
    function stripBorders(c,w,h,fill){
      const g=c.createLinearGradient(0,0,0,h);g.addColorStop(0,'#b5ab87');g.addColorStop(.12,fill);g.addColorStop(.80,fill);g.addColorStop(1,'#b3a888');c.fillStyle=g;c.fillRect(0,0,w,h);
      for(let i=0;i<41;i++){const x=(i+.45)*w/41;c.fillStyle='#78735e';c.fillRect(x,3,3,4);c.fillRect(x,h-7,3,4);}
    }
    const original=map(1344,142,(c,w,h)=>{
      stripBorders(c,w,h,'#e6dfc9');
      c.fillStyle='#465a50';c.font='bold 19px sans-serif';c.fillText('更正原稿　／　发信留底',39,33);
      c.textAlign='center';c.font='bold 57px sans-serif';c.fillStyle='#3a463d';
      for(let i=0;i<6;i++)c.fillText(chunks[i]+punct[i],(i+.50)*w/6,105,w/6-9);
    });
    const paperMaterial={metalness:.015,roughness:.81,emissive:0x141209,emissiveIntensity:.34,side:T.DoubleSide};
    texPlane(panel.g,0,.199,.028,1.044,.133,original,paperMaterial);
    for(const x of [-.545,.545]){
      for(const y of [.214,-.081]){disc(panel,[x,y,.026],.036,.062,p.bronze,'x');ring(panel,[x,y,.033],.034,.003,p.chrome,0,Math.PI*.5);}
      plate(panel,[x,.106,.009],.072,.315,.017,.012,p.marine);
    }
    // A window in the carriage frames one word. The lower punch traverses the full length during the actual call.
    for(const y of [.115,.276])rod(panel,[-.553,y,.047],[.553,y,.047],.0048,p.chrome);
    const selector=batch(panel.g,0,.198,.049,'Ratchet type-selector carriage');
    for(const x of [-.081,.081]){
      block(selector,[x,0,0],.010,.145,.007,p.bronze);
      for(const y of [-.076,.076])block(selector,[x,y,.002],.020,.014,.011,p.chrome);
    }
    for(const y of [-.070,.072])block(selector,[0,y,0],.158,.007,.006,'#b19063');
    const flag=new T.Shape();flag.moveTo(-.013,-.088);flag.lineTo(.013,-.088);flag.lineTo(0,-.073);flag.closePath();
    part(selector,own(new T.ShapeGeometry(flag)),'#c48a52',[0,0,.005]);
    rod(panel,[-.526,.086,.037],[.526,.086,.037],.010,p.bronze);
    for(let j=0;j<51;j++)block(panel,[-.504+j*.020,.086,.047],.003,.017,.006,p.edge,0,0,-.48);
    const scan=batch(panel.g,-.500,.057,.037,'Perforator scanning head');
    plate(scan,[0,0,0],.080,.047,.011,.009,p.edge);block(scan,[0,-.020,.013],.009,.038,.007,p.bronze);
    const typeJaws=own(new T.InstancedMesh(own(new T.BoxGeometry(.070,.027,.014)),own(new T.MeshStandardMaterial({color:0xc2b18a,metalness:.51,roughness:.38})),6));
    panel.g.add(typeJaws);typeJaws.frustumCulled=false;typeJaws.instanceMatrix.setUsage(T.DynamicDrawUsage);
    for(let j=0;j<6;j++){
      const x=(j-2.5)*1.044/6;plate(panel,[x,.005,.006],.130,.060,.013,.008,p.iron);
      for(const xx of [x-.046,x+.046]){block(panel,[xx,.008,.027],.011,.045,.019,p.edge);disc(panel,[xx,.007,.038],.004,.005,p.bronze);}
    }
    // A separate transport prints the words actually returned, preserving a visible blank for each dropped group.
    const receiptCanvas=document.createElement('canvas');receiptCanvas.width=1344;receiptCanvas.height=164;
    const receiptCtx=receiptCanvas.getContext('2d'),receiptTx=own(new T.CanvasTexture(receiptCanvas));receiptTx.colorSpace=T.SRGBColorSpace;receiptTx.anisotropy=4;
    const receipt=texPlane(panel.g,0,-.101,.031,1.042,.142,receiptTx,paperMaterial);
    function drawReceipt(mask,tried){
      const c=receiptCtx,w=receiptCanvas.width,h=receiptCanvas.height;
      stripBorders(c,w,h,'#d1dbc7');c.textAlign='left';c.fillStyle='#465f55';c.font='bold 23px sans-serif';c.fillText('海雁号　／　来信回读',40,37);
      if(!tried.some(Boolean)){c.fillStyle='#687d6c';c.font='38px sans-serif';c.fillText('等候回执',46,115);}
      else{
        c.textAlign='center';c.font='bold 59px sans-serif';
        for(let i=0;i<6;i++){
          const x=(i+.50)*w/6;
          if(mask[i]){c.fillStyle='#354a40';c.fillText(chunks[i]+punct[i],x,121,w/6-10);}
          else if(tried[i]){c.strokeStyle='#995638';c.lineWidth=5;c.strokeRect(x-23,72,46,46);}
        }
      }
      receiptTx.needsUpdate=true;
    }
    const signatureCanvas=document.createElement('canvas');signatureCanvas.width=1344;signatureCanvas.height=148;
    const signCtx=signatureCanvas.getContext('2d'),signTx=own(new T.CanvasTexture(signatureCanvas));signTx.colorSpace=T.SRGBColorSpace;signTx.anisotropy=4;
    texPlane(panel.g,0,-.265,.023,1.035,.126,signTx,paperMaterial);
    function drawSign(flags){
      const c=signCtx,w=signatureCanvas.width,h=signatureCanvas.height;
      stripBorders(c,w,h,'#ddd2b4');
      for(let i=0;i<2;i++){
        const x=i*w/2;const title=i?'沈遥 · 航线通报':'林澈 · 灯机验收';
        c.textAlign='left';c.font='bold 46px sans-serif';c.fillStyle='#474e43';c.fillText(title,x+34,65,w/2-56);
        c.strokeStyle='#9e9b81';c.lineWidth=2;c.beginPath();c.moveTo(x+35,117);c.lineTo(x+585,117);c.stroke();
        c.font='24px serif';c.fillStyle='#747b68';c.fillText('具名',x+35,111);
        if(flags[i]){c.font='italic 41px serif';c.fillStyle=i?'#43615f':'#3d4e58';c.fillText(i?'沈遥':'林澈',x+129,112);
          c.save();c.translate(x+441,103);c.rotate(-.066);c.strokeStyle='#915945';c.lineWidth=2.4;c.strokeRect(-10,-26,116,35);c.fillStyle=c.strokeStyle;c.font='bold 22px sans-serif';c.fillText('已记入',3,-1);c.restore();}
      }
      c.strokeStyle='#a69c7f';c.beginPath();c.moveTo(w/2,19);c.lineTo(w/2,h-15);c.stroke();signTx.needsUpdate=true;
    }
    const feeds=[];
    for(const x of [-.552,.552]){
      const f=batch(panel.g,x,-.093,.048,'Return-strip feed sprocket');
      disc(f,[0,0,0],.052,.050,p.bronze,'x');
      for(let j=0;j<19;j++){const a=j*TAU/19;block(f,[0,Math.sin(a)*.051,Math.cos(a)*.051],.048,.007,.007,j%4===0?cream:p.edge,-a);}
      feeds.push(f);
    }
    const penDocks=[];
    for(const [i,x] of [-.189,.194].entries()){
      const g=batch(panel.g,x,-.335,.039,'Mechanical author register');
      disc(g,[0,0,.012],.025,.035,p.bronze);disc(g,[0,0,.034],.015,.027,i?teal:p.oxide);
      penDocks.push(g);
    }
    // A tethered thumb selector lets the left hand commute through the six groups. The right hand runs the paper feed.
    plate(desk,[.017,.914,.036],.917,.124,.122,.012,p.marine);
    const thumb=batch(desk.g,-.266,.942,.175,'Selector thumb lever');
    disc(thumb,[0,0,0],.049,.050,p.bronze);
    rod(thumb,[0,0,.018],[.020,.080,.057],.011,p.chrome);
    disc(thumb,[.020,.080,.083],.023,.052,ebony);
    const feedWheel=wheel(desk.g,[.246,.976,.169],.086,'Fine paper advance wheel');
    pair('desk',0,thumb.g,[.020,.080,.084],feedWheel.g,[.069,0,.071]);
    // Source folder tray to the left of the type bed. The actual selected form appears here when it has been loaded.
    const tray=batch(desk.g,-.795,1.058,-.230,'Accepted source-document tray');tray.g.rotation.x=-.855;
    plate(tray,[0,0,-.023],.352,.482,.029,.018,p.marine);
    for(const x of [-.170,.170])block(tray,[x,0,.026],.014,.462,.045,p.edge);
    block(tray,[0,-.222,.024],.348,.017,.056,p.bronze);
    const source=texPlane(tray.g,0,.013,.018,.320,.388,sheetMaps[1],paperMaterial);
    block(tray,[0,.201,.027],.138,.031,.028,p.bronze);boltGrid(tray,0,.199,.044,.088,.024,.005);
    const sourceLegend=label('来 稿 夹','SOURCE   /   IN');
    texPlane(tray.g,0,-.195,.055,.207,.044,sourceLegend);
    // Weatherproof receiver chassis and handset from the old harbour office.
    plate(desk,[.790,1.096,-.489],.343,.421,.374,.027,p.marine);
    plate(desk,[.790,1.092,-.112],.325,.404,.025,.014,p.deep);
    boltGrid(desk,.790,1.093,-.076,.255,.337,.009);
    const lampTx=jewel(desk,.715,1.235,-.074,.028,'#e19653'),lampRx=jewel(desk,.849,1.235,-.074,.028,'#85d39d');
    const meterMap=map(480,178,(c,w,h)=>{
      const g=c.createLinearGradient(0,0,0,h);g.addColorStop(0,'#c2b288');g.addColorStop(.54,'#efe1b5');g.addColorStop(1,'#c4b994');c.fillStyle=g;c.fillRect(0,0,w,h);c.fillStyle='#555646';c.textAlign='center';c.font='bold 19px monospace';c.fillText('LINK   /   S',w/2,37);
      for(let j=0;j<25;j++){const a=(-142+j*104/24)*Math.PI/180,r=119,rr=r-(j%4?7:14);
        c.strokeStyle=j>18?'#9c593e':'#555849';c.lineWidth=j%4?2:3;c.beginPath();c.moveTo(w/2+Math.cos(a)*rr,185+Math.sin(a)*rr);c.lineTo(w/2+Math.cos(a)*r,185+Math.sin(a)*r);c.stroke();
      }
      c.fillStyle='#616553';c.font='15px monospace';c.fillText('H-08   RECEIVER',w/2,147);
    });
    plate(desk,[.784,1.124,-.073],.225,.103,.012,.011,p.bronze);
    texPlane(desk.g,.784,1.124,-.054,.207,.087,meterMap,{roughness:.56,metalness:.02});
    const needle=batch(desk.g,.784,1.073,-.050,'Link strength meter needle');
    block(needle,[0,.032,0],.0022,.066,.002,p.gap);
    block(desk,[.784,1.068,-.045],.228,.014,.012,p.marine);
    const handset=batch(desk.g,.748,1.018,-.021,'Desk microphone with press key');
    hose(handset,[[-.095,-.009,-.003],[-.064,.006,.017],[-.015,.011,.031],[.060,.014,.022],[.100,.029,.004]],.024,ebony,22);
    for(const [i,x] of [-.106,.109].entries()){
      const y=i?.033:-.007;oval(handset,[x,y,.014],[.044,.042,.032],ebony);
      ring(handset,[x,y,.042],.024,.0028,p.edge);
      for(let k=0;k<5;k++){const a=k*TAU/5;disc(handset,[x+.014*Math.cos(a),y+.014*Math.sin(a),.045],.0023,.004,p.gap);}
    }
    block(handset,[.013,.026,.043],.069,.012,.012,p.bronze);
    for(const x of [.663,.844]){rod(desk,[x,.973,-.092],[x,.973,.005],.012,p.chrome);rod(desk,[x,.973,.005],[x,1.002,.006],.009,p.chrome);}
    const coils=[];for(let j=0;j<=120;j++){const t=j/120,a=t*TAU*9;coils.push([.634+.045*t+.012*Math.cos(a),1.003-.116*Math.sin(Math.PI*t),-.007+.041*t+.008*Math.sin(a)]);}hose(desk,coils,.005,ebony,120);
    grip(desk,.454,.905,.118,.150);
    // Both versions of the desk contact refer to its microphone, with the other hand steadying the paper.
    pair('sign',0,desk.g,[.454,.905,.155],handset.g,[.019,.024,.051]);
    pair('sign',1,desk.g,[.454,.905,.155],handset.g,[.019,.024,.051]);
    const stageTab=batch(panel.g,-.369,.310,.026,'Message phase index tab');
    block(stageTab,[0,0,0],.076,.014,.011,amber);
    for(let i=0;i<3;i++)block(panel,[-.369+i*.368,.307,.016],.089,.006,.005,p.edge);
    for(const o of templates)finish(o);templates.clear();
    for(const [src,plain] of repeatGeo)for(const g of [src,plain])if(g!==bulbGeo&&resources.delete(g))g.dispose();
    repeatGeo.clear();torusCache.clear();
    let lastReceipt='',lastSign='',lastFile=-2;
    function update(s={}){
      const t=clamp(Number(s.travel)||0),y=Number(s.yaw)||0,pitch=Number(s.pitch)||0;
      reel.g.rotation.z=t*TAU*3.25;indexed.g.rotation.z=-t*TAU*.84;
      yaw.g.rotation.y=-y;elevation.g.rotation.x=pitch;
      trainers[0].g.rotation.z=pitch*4.4+.4;trainers[1].g.rotation.z=-y*2.1+.2;
      const f=Number.isInteger(s.file)?s.file:-1,loaded=!!s.loaded;
      for(let i=0;i<3;i++){
        const selected=i===f,pg=files[i].g;
        pg.visible=!selected;pg.position.y=selected?.044:0;pg.position.z=selected?.032:.006;pg.rotation.z=selected?-.025:0;
      }
      source.visible=loaded&&f>=0&&f<3;
      if(f!==lastFile&&f>=0&&f<3){source.material.map=sheetMaps[f];source.material.needsUpdate=true;}lastFile=f;
      const cursor=Math.round(clamp(Number(s.cursor)||0,0,5)),head=clamp(Number(s.head)||0);
      selector.g.position.x=(cursor-2.5)*(1.044/6);scan.g.position.x=-.499+.998*head;
      thumb.g.rotation.z=(cursor-2.5)*-.192;feedWheel.g.rotation.z=-head*TAU*2.3;
      const tried=Array.isArray(s.attempted)?s.attempted:Array(6).fill(false),attempted=tried.some(Boolean);
      const mask=Array.from({length:6},(_,i)=>!!s.mask?.[i]),mkey=tried.map(Number).join('')+mask.map(Number).join('');
      if(mkey!==lastReceipt){drawReceipt(mask,tried);lastReceipt=mkey;}
      for(let i=0;i<6;i++){
        const x=(i-2.5)*1.044/6,pressed=i===cursor&&s.tx;
        tmp.position.set(x,.006,pressed?.026:.038);tmp.scale.set(1,1,1);tmp.rotation.set(pressed?-.24:.12,0,0);tmp.updateMatrix();typeJaws.setMatrixAt(i,tmp.matrix);
      }
      typeJaws.instanceMatrix.needsUpdate=true;
      receipt.position.y=-.098-head*.009-(attempted?.008:0);
      for(const f of feeds)f.g.rotation.x=head*TAU*2.23+(attempted?.20:0);
      const flags=[!!s.signed?.[0],!!s.signed?.[1]],skey=flags.map(Number).join('');
      if(skey!==lastSign){drawSign(flags);lastSign=skey;}
      penDocks.forEach((g,i)=>{g.g.position.z=flags[i]?.028:.047;});
      stageTab.g.position.x=-.369+clamp(Number(s.stage)||0,0,2)*.368;
      handset.g.position.y=1.018+(s.tx||s.rx ? .019 : 0);
      handset.g.rotation.z=s.tx?-.055:0;throat.g.rotation.z=flags[0]?-.080:0;
      lampTx(s.tx?1:0);lampRx(s.rx?1:0);needle.g.rotation.z=(.5-clamp(Number(s.strength)||0))*1.52;
    }
    function hands(kind,index=0){
      const key=kind+(Number.isInteger(index)?index:0),q=contacts.get(key);if(!q)return [];
      const out=globs.get(key);for(let i=0;i<2;i++){const g=q[i*2];g.updateWorldMatrix(true,false);out[i].copy(q[2*i+1]).applyMatrix4(g.matrixWorld);}return out;
    }
    function dispose(){root.removeFromParent();root.clear();resources.forEach(r=>r.dispose());resources.clear();globs.clear();contacts.clear();}
    update();return {update,hands,dispose};
  }
  return {create};
})();
if(typeof window!=='undefined')window.TideRelayGear=TideRelayGear;
