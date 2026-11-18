// Full-size service lantern and calibrated viewing windows. A ray is measured at
// the same two ranges on the ocean, on the etched glass and in the interlock.
const TideLanternRoom=(()=>{
  const T=THREE,L=TideLantern,TAU=Math.PI*2,up=new T.Vector3(0,1,0);
  function create(scene,g){
    const owned=new Set(),batch=new Map(),o=new T.Object3D(),col=new T.Color();
    const own=x=>(owned.add(x),x),vec=(...v)=>new T.Vector3(...v);
    function group(p,name,x=0,y=0,z=0){const n=new T.Group();p.add(n);n.position.set(x,y,z);n.name=name;return n;}
    const root=group(scene,'北岬灯室',14,L.height,-91);root.rotation.y=L.yaw;
    const cube=own(new T.BoxGeometry()),rod=own(new T.CylinderGeometry(.5,.5,1,20)),bolt=own(new T.CylinderGeometry(.5,.5,1,6));
    const torus=own(new T.TorusGeometry(1,.063,9,64)),band=own(new T.TorusGeometry(1,.019,8,78));
    const shell=TideSteel.material(0,own,true);shell.roughness=.83;
    const brass=shell.clone();own(brass);brass.onBeforeCompile=shell.onBeforeCompile;brass.roughness=.58;brass.normalScale.setScalar(.29);
    const trim=own(new T.MeshStandardMaterial({metalness:.20,roughness:.68}));
    const halo=own(new T.MeshBasicMaterial({toneMapped:false}));
    const pewter=0x677771,patina=0x557b71,copper=0xaf8654,gilt=0xd7b372,iron=0x354544,ivory=0xf2e3bf,black=0x232c2c;
    function add(p,geom,m,color,x,y,z,w,h,d,rotation){
      const key=[p.id,geom.id,m.id].join('/');
      if(!batch.has(key))batch.set(key,{p,geom,m,parts:[]});
      o.position.set(x,y,z);o.scale.set(w,h,d);o.rotation.set(0,0,0);
      if(rotation?.isQuaternion)o.quaternion.copy(rotation);else if(rotation)o.rotation.set(...rotation);
      o.updateMatrix();batch.get(key).parts.push([o.matrix.clone(),color]);
    }
    const box=(p,x,y,z,w,h,d,m=shell,c=pewter,r)=>add(p,cube,m,c,x,y,z,w,h,d,r);
    const cyl=(p,x,y,z,r,h,m=shell,c=pewter,rot,geo=rod)=>add(p,geo,m,c,x,y,z,2*r,h,2*r,rot);
    const rim=(p,x,y,z,r,m,c,rotation,geo=torus)=>add(p,geo,m,c,x,y,z,r,r,r,rotation);
    function bar(p,a,b,w,m=shell,c=pewter,square=false){
      const A=vec(...a),B=vec(...b),axis=B.clone().sub(A),len=axis.length();A.lerp(B,.5);
      add(p,square?cube:rod,m,c,A.x,A.y,A.z,w,len,w,new T.Quaternion().setFromUnitVectors(up,axis.normalize()));
    }
    function mesh(p,geo,mat,x=0,y=0,z=0){const n=new T.Mesh(geo,mat);p.add(n);n.position.set(x,y,z);return n;}
    function plate(p,text,sub,x,y,z,w,h){
      const canvas=document.createElement('canvas');canvas.width=768;canvas.height=224;
      const c=canvas.getContext('2d');c.fillStyle='#334640';c.fillRect(0,0,768,224);
      c.strokeStyle='#ac9570';c.lineWidth=7;c.strokeRect(9,9,750,206);
      c.fillStyle='#ede0b8';c.textAlign='center';c.font='bold 73px "PingFang SC", sans-serif';c.fillText(text,384,110);
      c.font='34px monospace';c.fillText(sub,384,175);
      const t=own(new T.CanvasTexture(canvas));t.colorSpace=T.SRGBColorSpace;t.anisotropy=8;
      const m=own(new T.MeshStandardMaterial({map:t,metalness:.24,roughness:.46}));
      mesh(p,own(new T.PlaneGeometry(w,h)),m,x,y,z);
    }
    const loader=new T.TextureLoader(),[albedo,normal,arm]=window.TideBridgeSteel[1].map((v,i)=>{
      const t=own(loader.load(v));if(!i)t.colorSpace=T.SRGBColorSpace;t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(2,2);t.anisotropy=8;return t;
    });
    const tread=own(new T.MeshStandardMaterial({map:albedo,normalMap:normal,roughnessMap:arm,roughness:.87,metalness:.64}));
    for(const d of g.world.floors){
      const at=L.local(d),cols=Math.ceil(d.w/1.21),rows=Math.ceil(d.d/1.15);
      for(let j=0;j<rows;j++)for(let k=0;k<cols;k++){
        const w=d.w/cols,h=d.d/rows,x=at.x+(k+.5)*w-d.w*.5,z=at.z+(j+.5)*h-d.d*.5;
        box(root,x,-.072,z,w-.014,.14,h-.014,tread,0xc5ccba);
        for(const s of [-1,1])cyl(root,x+s*(w*.5-.096),.009,z+s*(h*.5-.096),.026,.014,brass,copper,null,bolt);
      }
    }
    const outline=[[-5.08,-5.71],[5.08,-5.71],[6.08,-3.38],[6.08,3.38],[5.08,5.71],[-5.08,5.71],[-6.08,3.38],[-6.08,-3.38]];
    const glass=own(new T.MeshPhysicalMaterial({color:0xb7d6ce,transparent:true,opacity:.23,roughness:.085,metalness:.24,clearcoat:1,depthWrite:false,side:T.DoubleSide}));
    const paneDrops=document.createElement('canvas');paneDrops.width=384;paneDrops.height=384;
    const rain=paneDrops.getContext('2d');rain.fillStyle='#808080';rain.fillRect(0,0,384,384);
    for(let i=1;i<=285;i++){
      const frac=n=>n-Math.floor(n),x=384*frac(Math.sin(i*19.83)*19223.4),y=384*frac(Math.sin(i*5.19)*10075.9);
      const radius=.4+frac(Math.sin(i*17.21)*7923.3)*1.5;
      rain.fillStyle='#949494';rain.beginPath();rain.ellipse(x,y,radius,radius*1.45,.13,0,TAU);rain.fill();
      if(i%8===0){rain.strokeStyle='#858585';rain.lineWidth=radius*.8;rain.beginPath();rain.moveTo(x,y);rain.quadraticCurveTo(x+2,y-11,x-1,y-23);rain.stroke();}
    }
    const paneMap=own(new T.CanvasTexture(paneDrops));paneMap.wrapS=paneMap.wrapT=T.RepeatWrapping;paneMap.repeat.set(4,1.6);
    glass.bumpMap=paneMap;glass.bumpScale=.0026;glass.opacity=.10;
    for(let j=0;j<outline.length;j++){
      const [x,z]=outline[j],[ex,ez]=outline[(j+1)%outline.length],length=Math.hypot(ex-x,ez-z),segs=Math.ceil(length/1.43);
      for(const h of [-.28,1.06,3.72])if(j!==0||h!==1.06)bar(root,[x,h,z],[ex,h,ez],h<0?.27:h>3?.15:.064,shell,h<0?iron:patina,h<0);
      for(let i=0;i<segs;i++){
        const f=i/segs,px=x+(ex-x)*f,pz=z+(ez-z)*f;
        if(j===0&&Math.abs(Math.abs(px)-3.55)<.91)continue;
        cyl(root,px,.51,pz,.044,1.08,brass,copper);
        cyl(root,px,.056,pz,.088,.098,shell,iron);
      }
      cyl(root,x,1.89,z,.088,3.8,shell,patina);
      for(const h of [.14,.94,1.22,3.29]){cyl(root,x,h,z,.118,.063,brass,copper);cyl(root,x,h+.039,z,.122,.017,shell,iron);}
      for(let f=1;f<=4;f++){
        const v=f/5,px=x+(ex-x)*v,pz=z+(ez-z)*v;
        bar(root,[px,3.81,pz],[px*.10,5.02,pz*.10],.036,brass,copper);
      }cyl(root,x,3.64,z,.145,.15,brass,copper);
      bar(root,[x,3.75,z],[0,5.1,0],.092,shell,patina,true);
      if(z>-4&&ez>-4){
        const panel=mesh(root,own(new T.PlaneGeometry(length-.13,2.30)),glass,(x+ex)/2,2.40,(z+ez)/2);
        panel.rotation.y=-Math.atan2(ez-z,ex-x);
        bar(root,[x,1.2,z],[ex,1.2,ez],.073,brass,copper);
      }
    }
    for(const [a,b] of [[-5.08,-4.45],[-2.70,2.70],[4.45,5.08]]){
      bar(root,[a,1.06,-5.71],[b,1.06,-5.71],.064,shell,patina);
      for(const x of [a,b])cyl(root,x,.53,-5.71,.045,1.07,brass,copper);
    }
    // Roofing panels leave the forward sight sector open below the eaves.
    const roofVertices=[];
    for(let i=0;i<outline.length;i++){
      const [a,b]=outline[i],[c,d]=outline[(i+1)%outline.length];roofVertices.push(0,5.14,0,a,3.79,b,c,3.79,d);
    }
    const roof=own(new T.BufferGeometry());roof.setAttribute('position',new T.Float32BufferAttribute(roofVertices,3));roof.computeVertexNormals();
    const roofMaterial=own(new T.MeshStandardMaterial({color:0x63786c,metalness:.50,roughness:.72,side:T.DoubleSide}));
    mesh(root,roof,roofMaterial);
    cyl(root,0,5.15,0,.49,.15,brass,patina);
    cyl(root,0,5.30,0,.19,.23,brass,copper);cyl(root,0,5.57,0,.044,.51,brass,patina);
    for(const x of [-3.65,3.65]){
      box(root,x,.09,5.4,1.13,.18,.53,shell,iron);
      for(let j=0;j<5;j++)bar(root,[x-.53,-.30-j*.35,5.46],[x+.53,-.30-j*.35,5.46],.06,brass,copper);
    }
    const horizontal=[Math.PI/2,0,0];
    // Cut a concentric sawtooth profile like a stepped bull's-eye Fresnel panel.
    function fresnel(radius,rings){
      const pts=[new T.Vector2(.008,.21*radius)];
      for(let j=1;j<=rings;j++){
        const r=j/rings*radius,depth=.21*radius*(1-(j/rings)**1.6);
        pts.push(new T.Vector2(r-.006,depth),new T.Vector2(r,depth-.046),new T.Vector2(r+.002,depth+.012));
      }
      pts.push(new T.Vector2(radius,-.081),new T.Vector2(.008,-.081));return own(new T.LatheGeometry(pts,80));
    }
    const opticGlass=own(new T.MeshPhysicalMaterial({color:0xbde6d9,roughness:.075,metalness:.30,clearcoat:1,clearcoatRoughness:.07,transparent:true,opacity:.78,side:T.DoubleSide,depthWrite:false,envMapIntensity:1.55}));
    for(const [y,r,h,m,c] of [[.15,1.31,.30,shell,iron],[.43,.96,.35,shell,patina],[.67,1.12,.19,brass,copper],[.83,.92,.18,shell,iron],[1.04,1.07,.18,brass,gilt],[3.35,1.02,.16,brass,copper],[3.54,.68,.18,shell,patina]])
      cyl(root,0,y,0,r,h,m,c);
    for(let i=0;i<48;i++){
      const a=TAU*i/48;box(root,Math.sin(a)*1.025,.74,Math.cos(a)*1.025,.07,.12,.18,brass,i%4?copper:gilt,[0,a,0]);
    }
    for(let i=0;i<6;i++){
      const a=i*TAU/6+.24,x=Math.sin(a)*.96,z=Math.cos(a)*.96;
      cyl(root,x,2.18,z,.055,2.18,brass,patina);cyl(root,x,1.19,z,.095,.15,brass,copper);
    }
    for(let j=0;j<18;j++){
      const y=1.26+j*.112,r=.82+.14*Math.sin(j/17*Math.PI);
      rim(root,0,y,0,r,j%6===0?brass:opticGlass,j%6===0?copper:0xd6f6ef,horizontal,band);
    }
    const filament=own(new T.MeshBasicMaterial({color:0xffeab5,toneMapped:false}));
    for(let j=0;j<12;j++)rim(root,0,2.12+j*.033,0,.115,filament,0xffe4a1,horizontal);
    const workLight=own(new T.PointLight(0xffc785,19,9,2));workLight.position.set(0,2.44,0);root.add(workLight);
    const glassHead=group(root,'有裂纹的主透镜',0,2.25,-.84);
    const front=mesh(glassHead,fresnel(.91,19),opticGlass);front.rotation.x=-Math.PI/2;
    rim(glassHead,0,0,-.02,.94,brass,copper);
    for(const [a,b] of [[[.09,.84,-.11],[.18,.47,-.16]],[[.18,.47,-.16],[-.02,.21,-.19]],[[-.02,.21,-.19],[.13,-.08,-.21]],[[.13,-.08,-.21],[-.22,-.73,-.13]],[[.18,.47,-.16],[.48,.39,-.14]]])bar(glassHead,a,b,.014,trim,ivory);
    const mask=group(root,'遮光叶片',0,2.24,-1.02);box(mask,-.58,0,0,.83,1.84,.04,shell,0x3e4a45);
    for(const k of [-1,1])box(root,k*1.03,2.23,-1.05,.068,2.04,.08,brass,copper);
    // The drive-side backing plate obscures the sea. The rim and glass remain visible above it.
    const bench=group(root,'机房背板',0,0,1.72);
    box(bench,0,.65,0,1.46,1.31,.52,shell,patina);
    box(bench,0,1.82,-.23,2.74,1.98,.09,shell,0x435950);
    for(const x of [-1.24,1.24])for(const y of [1.03,1.77,2.64])
      cyl(bench,x,y,-.17,.054,.037,brass,copper,horizontal,bolt);
    plate(bench,'北岬　灯器室','SECTOR LIGHT  /  No. 04',0,2.39,-.171,1.28,.32);
    const dial=group(bench,'双速凸轮',0,1.08,.39);
    for(const [r,z] of [[.48,-.041],[.422,-.022]])cyl(dial,0,0,z,r,.048,brass,r>.45?copper:ivory,horizontal);
    for(let j=0;j<=30;j++){
      const a=(j/30-.5)*4.62;
      box(dial,.39*Math.sin(a),.39*Math.cos(a),.006,.010,j%5?.041:.085,.009,trim,black,[0,0,-a]);
    }
    const face=document.createElement('canvas');face.width=face.height=1024;
    const ink=face.getContext('2d');ink.translate(512,512);
    const dialShade=ink.createRadialGradient(-110,-90,40,0,0,505);
    dialShade.addColorStop(0,'#ecdfbb');dialShade.addColorStop(.82,'#cfc7ad');dialShade.addColorStop(1,'#a79a78');
    ink.fillStyle=dialShade;ink.fillRect(-512,-512,1024,1024);
    let inkSeed=722;const random=()=>((inkSeed=1664525*inkSeed+1013904223>>>0)/4294967296);
    for(let i=0;i<4200;i++){ink.fillStyle='rgba(74,54,31,'+(.03+random()*.13)+')';ink.fillRect(random()*1024-512,random()*1024-512,1+random()*2,.5+random()*2);}
    for(let i=0;i<=100;i++){
      const a=(i/100-.5)*4.62,major=i%10===0;ink.save();ink.rotate(a);
      ink.lineWidth=major?4:1.5;ink.strokeStyle='#383b36';ink.beginPath();ink.moveTo(0,-464);ink.lineTo(0,major?-406:-446);ink.stroke();
      if(major){ink.fillStyle='#333a35';ink.font='38px Georgia';ink.textAlign='center';ink.fillText(String(i),0,-364);}ink.restore();
    }
    ink.fillStyle='#4d554d';ink.textAlign='center';ink.font='32px Georgia';ink.fillText('Nº  0214',0,202);
    ink.font='21px monospace';ink.fillText('B E I  J I A   /   1 9 5 8',0,246);
    const faceMap=own(new T.CanvasTexture(face));faceMap.colorSpace=T.SRGBColorSpace;faceMap.anisotropy=8;
    const faceMat=own(new T.MeshStandardMaterial({map:faceMap,roughness:.67,metalness:.12}));
    mesh(dial,own(new T.CircleGeometry(.419,80)),faceMat,0,0,.014);
    const pointer=group(dial,'行程针');box(pointer,0,.183,.026,.020,.362,.021,trim,0x9d502d);
    const wheel=group(dial,'手轮',0,0,.15);
    rim(wheel,0,0,0,.30,brass,copper);
    for(let j=0;j<3;j++){const a=j*TAU/3;
      bar(wheel,[0,0,0],[Math.sin(a)*.29,Math.cos(a)*.29,0],.040,brass,patina);}
    cyl(wheel,0,0,.018,.074,.075,brass,gilt,horizontal);
    cyl(wheel,.28,0,.058,.039,.133,trim,black,horizontal);
    const lampCase=group(bench,'窗口回铃',.96,1.49,-.13);
    cyl(lampCase,0,0,.018,.115,.087,brass,copper,horizontal);
    const indicator=own(new T.MeshStandardMaterial({color:0x7f8b65,emissive:0xffce73,emissiveIntensity:.02,roughness:.27,metalness:.22}));
    const lens=mesh(lampCase,own(new T.SphereGeometry(.080,24,14)),indicator,0,0,.070);lens.scale.z=.46;
    for(let j=0;j<3;j++)box(lampCase,(j-1)*.052,0,.113,.008,.126,.010,brass,copper);
    plate(bench,'回　铃','SIGNAL',.96,1.28,-.168,.32,.093);
    // A rack follower and the return bell can be read from the shaded side.
    box(bench,-.09,1.84,-.12,1.08,.245,.077,brass,copper);
    box(bench,-.09,1.84,-.071,.99,.16,.042,trim,black);
    for(let i=0;i<=20;i++)box(bench,-.54+i*.045,1.875,-.036,.009,i%5?.041:.075,.012,brass,ivory);
    const follower=group(bench,'凸轮从动杆',-.09,1.84,-.018);
    box(follower,0,-.021,0,.034,.15,.036,brass,gilt);box(follower,-.25,-.083,0,.52,.042,.045,shell,pewter);
    for(const x of [-.58,.40])for(const y of [1.74,1.94])cyl(bench,x,y,-.062,.025,.022,shell,pewter,horizontal,bolt);
    const gearbox=group(bench,'减速箱端盖',-.53,.60,.18);
    cyl(gearbox,0,0,0,.23,.29,shell,patina,horizontal);
    cyl(gearbox,0,0,.157,.198,.040,shell,pewter,horizontal);
    for(let j=0;j<8;j++){const a=j*TAU/8;cyl(gearbox,.172*Math.sin(a),.172*Math.cos(a),.19,.026,.021,brass,copper,horizontal,bolt);}
    const knob=group(bench,'落销',.64,.95,.27);box(knob,0,.13,0,.089,.30,.086,brass,copper);box(knob,0,.28,.03,.13,.069,.11,trim,black);
    plate(bench,'收 ◀　　▶ 放','COURSE        FINE',0,.44,.27,.76,.18);
    const src=group(root,'辅镜移送架');
    for(const z of [-.47,.21])box(root,-3.19,.059,z,3.73,.11,.085,brass,pewter);
    for(let j=0;j<9;j++)box(root,-4.91+.421*j,.021,-.13,.08,.05,.97,shell,iron);
    box(src,0,.237,-.13,.56,.20,.88,shell,patina);
    for(const x of [-.18,.18])for(const z of [-.47,.21])cyl(src,x,.159,z,.102,.10,brass,copper,horizontal);
    const holder=group(src,'辅镜转架',0,1.08,-.13);
    const spare=mesh(holder,fresnel(.62,16),opticGlass);spare.rotation.x=Math.PI/2;
    rim(holder,0,0,.024,.655,brass,copper);rim(holder,0,0,-.067,.662,brass,patina);
    for(const k of [-1,1])box(holder,k*.65,0,0,.069,1.4,.13,shell,patina);
    for(const s of [-1,1]){
      bar(src,[0,.37,-.13],[0,.88,-.13+s*.60],.065,brass,copper);
      bar(src,[-.25,.89,-.13+s*.62],[.25,.89,-.13+s*.62],.074,trim,black);
    }
    const jaws=L.gauges.map(({at,angle})=>{
      const n=group(root,'镜缘导靴',L.trolley(at),0,-.13);n.rotation.y=angle;
      for(const s of [-1,1]){
        box(n,s*.73,.26,0,.12,.49,.35,shell,patina);
        for(const j of [-1,1])box(n,s*.71,.52,j*.11,.19,.18,.074,brass,gilt);
        box(n,s*.71,.63,0,.23,.024,.032,halo,0xf8dd90);
      }return n;
    });
    const ports=g.section.ports.map((site,k)=>{
      const pose=L.sight(g,k),eye=vec(pose.eye.x,pose.eye.y,pose.eye.z),at=vec(pose.at.x,pose.at.y,pose.at.z);
      const dir=at.sub(eye).normalize();const port=group(scene,k?'远窗检视镜':'近窗检视镜');
      port.position.copy(eye).addScaledVector(dir,.84);port.lookAt(eye);
      rim(port,0,0,0,.235,brass,copper);rim(port,0,0,-.088,.253,shell,patina);
      for(let i=0;i<8;i++){const a=i*TAU/8;cyl(port,.237*Math.cos(a),.237*Math.sin(a),.013,.011,.023,brass,gilt,horizontal,bolt);}
      for(const x of [-.082,.082])box(port,x,-.16,0,.043,.16,.052,brass,patina);
      box(port,0,-.25,0,.25,.045,.092,shell,pewter);
      for(const x of [-.048,.048])box(port,x*.25,0,0,.0019,.052,.0018,trim,ivory);
      for(const s of [-1,1])box(port,.032*s,0,0,.037,.0018,.003,trim,ivory);
      const sliding=group(port,'随水位调节的横丝');box(sliding,0,0,.009,.078,.0019,.002,trim,0xe6b458);
      for(let j=-3;j<=3;j++)box(port,.107,j*.018,0,j%2?.010:.021,.002,.002,trim,ivory);
      port.updateWorldMatrix(true,false);
      const bottom=port.localToWorld(vec(0,-.29,0)),mark=L.local(bottom),tip=bottom.y-L.height;
      cyl(root,mark.x,tip*.50,mark.z,.046,Math.max(.12,tip),shell,patina);
      bar(root,[mark.x,Math.min(.18,tip*.4),mark.z+.68],[mark.x,tip*.77,mark.z],.046,brass,copper);
      for(const u of [-.18,.18])box(port,u,-.095,.04,.052,.16,.066,trim,black);
      plate(port,k?'远窗':'近窗',k?'FAR':'NEAR',0,-.216,.041,.133,.043);
      return {port,sliding};
    });
    // Small witness floats carry the two surveyed levels used on the chart.
    const floats=L.range.map(d=>{
      const n=group(root,'随浪浮环',.98,-L.height-4,-d);
      cyl(n,0,-.11,0,.205,.60,shell,patina);
      cyl(n,0,.038,0,.221,.076,trim,ivory);
      cyl(n,0,.31,0,.050,.36,brass,copper);
      box(n,0,.46,0,.20,.056,.071,trim,0x8d5339);
      return n;
    });
    const worldPoint=(node,x,y,z)=>{const a=group(node,'握点',x,y,z);return a;};
    const controlHands=[worldPoint(bench,-.205,1.21,.57),worldPoint(bench,.208,1.19,.57)];
    const mountHands=[[-1,1].map(s=>worldPoint(src,s*.20,.90,-.75)),[-1,1].map(s=>worldPoint(src,s*.20,.90,.49))];
    const stationHands=ports.map(({port})=>[-1,1].map(s=>worldPoint(port,s*.18,-.08,.065)));
    const handPoints=[[vec(),vec()],[vec(),vec()]];
    const fans=[0,1].map(i=>{
      const n=15,geom=own(new T.BufferGeometry()),pos=new Float32Array(n*6*3),fade=new Float32Array(n*6);
      geom.setAttribute('position',new T.BufferAttribute(pos,3).setUsage(T.DynamicDrawUsage));geom.setAttribute('strength',new T.BufferAttribute(fade,1).setUsage(T.DynamicDrawUsage));
      const fog=own(new T.ShaderMaterial({uniforms:{tint:{value:new T.Color(i?0xf3ac4d:0xece0af)}},side:T.DoubleSide,transparent:true,depthWrite:false,blending:T.AdditiveBlending,
        vertexShader:'attribute float strength;varying float s;void main(){s=strength;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
        fragmentShader:'uniform vec3 tint;varying float s;void main(){gl_FragColor=vec4(tint,s);}' }));
      const f=mesh(root,geom,fog);f.frustumCulled=false;return {n,pos,fade,geom};
    });
    for(const {p,geom,m,parts} of batch.values()){
      const n=own(new T.InstancedMesh(geom,m,parts.length));parts.forEach(([mx,c],i)=>{n.setMatrixAt(i,mx);n.setColorAt(i,col.set(c));});
      n.castShadow=m!==halo&&!m.transparent;n.receiveShadow=true;n.computeBoundingSphere();p.add(n);
    }
    batch.clear();
    function update(s){
      const o=s.optic,k=o.phase,m=o.mount,data=L.viewData(s),setting=o.axes[k];
      indicator.emissiveIntensity=o.tag?(Math.sin(s.time*TAU*2)>.15?1.9:.38):.04;
      follower.position.x=-.55+setting*.91;
      pointer.rotation.z=-(setting-.50)*4.62;wheel.rotation.z=-setting*TAU*1.35;knob.rotation.x=o.tag?-.28:.10;
      mask.position.x=s.stage===0?(o.settings.zero[0]-o.axes[0])*.78-.13:-.10;
      mask.rotation.z=s.stage===0?(o.axes[1]-.5)*.38:.07;
      src.position.x=L.trolley(s.stage===0?0:m?m.travel:1);
      holder.rotation.y=m?m.angle:s.stage===0?0:-.55;
      jaws.forEach((n,j)=>{n.visible=s.stage===1&&!m.done;n.position.y=m?.gate>j?-.42:0;});
      for(const [j,{sliding}] of ports.entries()){
        const pose=L.sight(s,j),d=Math.hypot(pose.at.x-pose.eye.x,pose.at.y-pose.eye.y,pose.at.z-pose.eye.z);
        const vy=(pose.at.y-pose.eye.y)/d,rise=j===k?o.reticle:0;
        sliding.position.y=rise*.84*Math.sqrt(1-vy*vy)/(d+rise*vy);
        const mark=L.chart(0,L.range[j]);
        floats[j].position.y=s.cues.water-L.height+TideLookout.swell(mark.x,mark.z,s.time);
        floats[j].rotation.z=.071*Math.sin(s.time*.81+j);
      }
      for(let i=0;i<fans.length;i++){
        const {n,pos,fade,geom}=fans[i];let offset=0;
        const [a,b]=data.images;
        for(let j=0;j<n;j++){
          const v=j/(n-1),depth=30+32*v,w=T.MathUtils.clamp((depth-36)/19,0,1);
          const x=T.MathUtils.lerp(i?a.twin:a.x,i?b.twin:b.x,w);
          const spread=.25+T.MathUtils.lerp(a.width,b.width,w)*.64,y=s.cues.water-L.height;
          const brightness=T.MathUtils.lerp(i?a.ghost:a.power,i?b.ghost:b.power,w);
          const amount=(i?.037:.033)*brightness*Math.sin(Math.PI*v);
          for(const [xx,yy,zz,f] of [[0,2.5,-.3,.0007],[x-spread,y,-depth,0],[x,y,-depth,amount],[0,2.5,-.3,.0007],[x,y,-depth,amount],[x+spread,y,-depth,0]]){
            pos[offset*3]=xx;pos[offset*3+1]=yy;pos[offset*3+2]=zz;fade[offset++]=f;
          }
        }
        geom.attributes.position.needsUpdate=true;geom.attributes.strength.needsUpdate=true;
      }
    }
    function hands(s,i){
      const o=s.optic,a=o.mount&&!o.mount.done?mountHands[i]:i===o.op?controlHands:stationHands[o.phase];
      a.forEach((n,j)=>n.getWorldPosition(handPoints[i][j]));return handPoints[i];
    }
    function dispose(){root.removeFromParent();for(const {port} of ports)port.removeFromParent();for(const a of owned)a.dispose();}
    update(g);return {update,hands,dispose};
  }
  return {create};
})();
