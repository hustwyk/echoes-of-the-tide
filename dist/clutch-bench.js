// North Cape generator house. Rigid machine parts share a skinned draw while the beds remain static.
const TideClutchBench=(()=>{
  const T=THREE,PI=Math.PI,TAU=PI*2,clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
  const sx=3.70,sz=12.11,V=(x=0,y=0,z=0)=>new T.Vector3(x,y,z);
  function create(parent,register){
    const retained=new Set(),keep=o=>{if(register)register(o);else retained.add(o);return o;};
    const root=new T.Group();root.name='北岬机房 · 离合试灯台';
    let seed=0x2ac174a;const rng=()=>((seed=(Math.imul(1664525,seed)+1013904223)>>>0)/4294967296);
    const metal={
      enamel:['#345851',.33,.47],dark:['#283b39',.44,.47],raised:['#638279',.49,.43],
      iron:['#353e3d',.66,.53],wear:['#8b9080',.74,.34],steel:['#aab3a3',.78,.27],
      bright:['#d3d4b8',.69,.27],recess:['#172522',.28,.64],rubber:['#29312e',.05,.76],
      brass:['#b28b51',.71,.36],matt:['#876642',.59,.50],copper:['#a86a47',.68,.45],
      rust:['#784b36',.33,.69],red:['#a04432',.34,.44],amber:['#c49449',.45,.42],
      cream:['#d4ccaa',.23,.51],fiber:['#714f39',.05,.83],blue:['#46706f',.35,.50],
      grip:['#654331',.14,.43],pale:['#c5c4ad',.37,.48],black:['#222b29',.37,.43]
    };
    const cv=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;};
    const toTex=(canvas,srgb,repeat=false)=>{const t=keep(new T.CanvasTexture(canvas));t.colorSpace=srgb?T.SRGBColorSpace:T.NoColorSpace;t.anisotropy=4;if(repeat)t.wrapS=t.wrapT=T.RepeatWrapping;return t;};
    const grain=cv(384,384),bump=cv(384,384),gc=grain.getContext('2d'),bc=bump.getContext('2d');
    const grainData=gc.createImageData(384,384),bumpData=bc.createImageData(384,384),n=Array.from({length:256},()=>rng());
    function field(x,y,sz){const f=x/sz,g=y/sz,i=Math.floor(f),j=Math.floor(g),u=f-i,v=g-j,a=u*u*(3-2*u),b=v*v*(3-2*v);
      const noise=(i,j)=>n[(i&15)+16*(j&15)];return (noise(i,j)*(1-a)+noise(i+1,j)*a)*(1-b)+(noise(i,j+1)*(1-a)+noise(i+1,j+1)*a)*b;}
    for(let y=0;y<384;y++)for(let x=0;x<384;x++){
      const k=(y*384+x)*4,f=field(x,y,24),c=field(x,y,96),pr=rng(),v=225+15*(f-.4)+10*(c-.4)+(pr-.5)*15,scale=132+(pr-.5)*11+f*10-Math.max(0,.28-f)*70;
      grainData.data.set([v,v,v-1,255],k);bumpData.data.set([scale,scale,scale,255],k);
    }
    gc.putImageData(grainData,0,0);bc.putImageData(bumpData,0,0);
    for(let j=0;j<1350;j++){
      const x=rng()*384,y=rng()*384,x1=x+(rng()-.2)**2*25,y1=y+(rng()-.5)*3;
      for(const [c,col] of [[gc,rng()>.45?'rgba(255,255,245,.37)':'rgba(65,61,51,.22)'],[bc,'rgba(33,33,33,.30)']]){
        c.strokeStyle=col;c.lineWidth=.4+rng()*.65;c.beginPath();c.moveTo(x,y);c.lineTo(x1,y1);c.stroke();}}
    const texture=toTex(grain,true,true),relief=toTex(bump,false,true);
    const mat=keep(new T.MeshStandardMaterial({map:texture,bumpMap:relief,bumpScale:.00042,vertexColors:true,metalness:1,roughness:1}));
    mat.onBeforeCompile=sh=>{sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nattribute vec2 machining; varying vec2 vMachining;')
      .replace('#include <begin_vertex>','#include <begin_vertex>\nvMachining=machining;');
      sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nvarying vec2 vMachining;')
      .replace('#include <metalnessmap_fragment>','#include <metalnessmap_fragment>\nmetalnessFactor*=vMachining.x;')
      .replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\nroughnessFactor*=vMachining.y;');};
    const bones=[],bind=new Map(),fixed={p:[],n:[],uv:[],i:[],c:[],m:[]},moving={p:[],n:[],uv:[],i:[],c:[],m:[],ids:[],weights:[]},axisY=V(0,1,0),vv=V(),nn=V(),M=new T.Matrix4(),N=new T.Matrix3(),quat=new T.Quaternion(),one=V(1,1,1);
    const tree=new T.Bone();tree.name='机台连杆系';bones.push(tree);bind.set(tree,new T.Matrix4());
    function hinge(name,x,y,z,par=tree,tilt=0){
      const b=new T.Bone();b.name=name;b.position.set(x,y,z);b.rotation.x=tilt;par.add(b);bones.push(b);
      b.updateMatrix();bind.set(b,new T.Matrix4().multiplyMatrices(bind.get(par),b.matrix));return b;
    }
    const templates=new Map(),geo=(id,make)=>{if(!templates.has(id))templates.set(id,make());return templates.get(id);};
    const unitBox=geo('box',()=>new T.BoxGeometry(1,1,1)),sphere=geo('ball',()=>new T.SphereGeometry(1,22,12));
    function stamp(b,g,type,loc,scale=one,rot=[0,0,0]){
      const bucket=b?moving:fixed,idx=b?bones.indexOf(b):0;M.compose(loc,rot.isQuaternion?rot:quat.setFromEuler(new T.Euler(...rot)),scale);if(b)M.premultiply(bind.get(b));N.getNormalMatrix(M);
      const off=bucket.p.length/3,cs=metal[type]||type,color=new T.Color(cs[0]),cp=g.attributes.position,cn=g.attributes.normal;
      for(let j=0;j<cp.count;j++){vv.fromBufferAttribute(cp,j).applyMatrix4(M);nn.fromBufferAttribute(cn,j).applyMatrix3(N).normalize();
        bucket.p.push(vv.x,vv.y,vv.z);bucket.n.push(nn.x,nn.y,nn.z);const ax=Math.abs(nn.x),ay=Math.abs(nn.y),az=Math.abs(nn.z);
        const u=ax>ay&&ax>az?vv.z:vv.x,v=ay>az&&ay>ax?-vv.z:vv.y;
        bucket.uv.push(u*2.9,v*2.9);bucket.c.push(color.r,color.g,color.b);bucket.m.push(cs[1],cs[2]);if(b){bucket.ids.push(idx,0,0,0);bucket.weights.push(1,0,0,0);}}
      if(g.index)for(const j of g.index.array)bucket.i.push(off+j);else for(let j=0;j<cp.count;j++)bucket.i.push(off+j);
    }
    const box=(b,t,x,y,z,w,h,d,rx=0,ry=0,rz=0)=>stamp(b,unitBox,t,V(x,y,z),V(w,h,d),[rx,ry,rz]);
    const ell=(b,t,x,y,z,rx,ry,rz)=>stamp(b,sphere,t,V(x,y,z),V(rx,ry,rz));
    function cyl(b,t,x,y,z,r,d,axis='y',seg=32,top=1){
      const g=geo('c'+seg+'s'+top,()=>new T.CylinderGeometry(top,1,1,seg));stamp(b,g,t,V(x,y,z),V(r,d,r),axis==='x'?[0,0,-PI/2]:axis==='z'?[PI/2,0,0]:[0,0,0]);}
    function tor(b,t,x,y,z,r,tube,axis='z',seg=48){const frac=+(tube/r).toFixed(4),g=geo('t'+frac+'s'+seg,()=>new T.TorusGeometry(1,frac,7,seg));
      stamp(b,g,t,V(x,y,z),V(r,r,r),axis==='x'?[0,PI/2,0]:axis==='y'?[PI/2,0,0]:[0,0,0]);}
    function rod(b,t,a,end,rad,n=14){
      const from=V(...a),to=V(...end),dir=to.clone().sub(from),len=dir.length(),q=new T.Quaternion().setFromUnitVectors(axisY,dir.normalize());
      const g=geo('c'+n+'s1',()=>new T.CylinderGeometry(1,1,1,n));stamp(b,g,t,from.lerp(to,.5),V(rad,len,rad),q);}
    function bend(b,t,pts,r,sub=24){const g=new T.TubeGeometry(new T.CatmullRomCurve3(pts.map(p=>V(...p))),sub,r,8,false);stamp(b,g,t,V());g.dispose();}
    function lathe(b,t,x,y,z,profile,axis='z',n=40){
      const g=new T.LatheGeometry(profile.map(p=>new T.Vector2(p[0],p[1])),n);
      stamp(b,g,t,V(x,y,z),one,axis==='z'?[PI/2,0,0]:axis==='x'?[0,0,-PI/2]:[0,0,0]);g.dispose();}
    function form(b,t,pts,thick,x,y,z,bevel=.002,rotation=[0,0,0]){
      const shape=new T.Shape();shape.moveTo(...pts[0]);pts.slice(1).forEach(a=>shape.lineTo(...a));shape.closePath();
      const g=new T.ExtrudeGeometry(shape,{depth:thick,bevelEnabled:bevel>0,bevelThickness:bevel,bevelSize:bevel,bevelSegments:2,curveSegments:4});
      stamp(b,g,t,V(x,y,z),one,rotation);g.dispose();}
    function bolt(b,t,x,y,z,r,axis='y'){
      const pos=[x,y,z],id=axis==='x'?0:axis==='y'?1:2;cyl(b,'iron',...pos,r*1.34,r*.24,axis,18);
      pos[id]+=r*.29;cyl(b,t,...pos,r,r*.62,axis,6);}
    const sides=[-1,1],none=null;
    // Open-bottom cast frame, hand holes, oil tray, drain cock and bolted hinge straps.
    for(const xx of [-.49,.53])for(const zz of [-.331,.131]){
      box(none,'iron',xx,.036,zz,.182,.064,.137);box(none,'enamel',xx,.072,zz,.104,.06,.113);
      box(none,'enamel',xx,.362,zz,.062,.58,.070);box(none,'raised',xx+.028,.367,zz,.009,.55,.075);
      for(const off of [-.063,.063])bolt(none,'wear',xx+off,.073,zz,.014);
    }
    box(none,'dark',.021,.166,-.096,1.102,.056,.447);box(none,'enamel',.021,.218,-.303,1.109,.067,.038);
    for(const x of [-.48,.51])rod(none,'dark',[x,.217,-.307],[x,.554,.118],.015);
    form(none,'enamel',[[-.615,.12],[-.584,.04],[-.434,0],[.451,0],[.609,.07],[.633,.188],[.593,.328],[-.595,.328]],.43,0,.54,-.319,.012);
    box(none,'raised',0,.870,-.110,1.259,.032,.502);box(none,'iron',0,.894,-.110,1.25,.016,.509);
    box(none,'dark',-.187,.709,.124,.731,.232,.025);box(none,'enamel',-.187,.71,.139,.685,.202,.018);
    for(const xx of [-.505,.131])for(const y of [.644,.784])bolt(none,'brass',xx,y,.155,.012,'z');
    for(let i=0;i<5;i++)box(none,'recess',-.454+i*.035,.716,.158,.018,.058,.006);
    for(let k=0;k<2;k++){const x=.315+k*.155;box(none,'enamel',x,.703,.131,.128,.168,.021);box(none,'iron',x,.675,.146,.081,.011,.011);}
    const sxC=.44,syC=1.242,szC=-.175;
    // Slit across the coupling's guard gives a direct view of the two facings during a stroke.
    for(const x of [.035,.574]){
      form(none,'enamel',[[-.097,0],[.099,0],[.089,.188],[.059,.259],[-.058,.259],[-.088,.205]],.064,x-.032,.896,szC,.004,[0,PI/2,0]);
      cyl(none,'enamel',x,syC,szC,.09,.101,'x');tor(none,'iron',x+.055,syC,szC,.071,.012,'x');
      for(const z of [-.283,-.068])bolt(none,'wear',x,.910,z,.014);
    }
    for(const yy of [.972,1.02])box(none,'dark',.321,yy,-.301,.611,.030,.046);
    box(none,'enamel',.312,1.024,-.357,.692,.238,.021);
    for(const x of [-.008,.630]){
      form(none,'raised',[[0,0],[.33,0],[.32,.08],[.21,.17],[.02,.20]],.013,x,.930,-.036,.003,[0,PI/2,0]);
      cyl(none,'iron',x,.986,.054,.017,.071,'x');}
    // Folded inspection door catches oil below the open drums.
    box(none,'dark',.314,.951,.011,.668,.026,.204,.155);box(none,'enamel',.31,.964,.019,.643,.012,.182,.155);
    for(const x of [0,.623]){box(none,'wear',x,.987,.097,.028,.021,.040);cyl(none,'matt',x,.961,-.079,.019,.071,'x');}
    bend(none,'copper',[[.579,1.314,-.170],[.597,1.375,-.177],[.612,1.382,-.228],[.613,1.334,-.258]],.0065);
    lathe(none,'brass',.573,1.361,-.178,[[.012,-.055],[.015,-.043],[.024,-.027],[.026,-.004],[.029,0],[.029,.008],[.013,.012]],'y',28);
    for(const s of sides){const x=.302+s*.185;for(let j=0;j<2;j++)bolt(none,'wear',x,.979,.046+j*.036,.007);}
    bend(none,'copper',[[.37,.616,.143],[.37,.535,.152],[.423,.516,.177],[.471,.523,.202]],.011);
    cyl(none,'brass',.461,.521,.201,.019,.05,'x',6);cyl(none,'dark',.489,.519,.201,.012,.012,'x',16);
    // Shaft, witness-painted rim, riveted friction lining and sliding pressure plate. Axial gap closes at full travel.
    const inp=hinge('主动盘',sxC,syC,szC),out=hinge('从动盘',sxC,syC,szC),pressure=hinge('滑动压盘',.271,syC,szC),collar=hinge('分离轴承',.158,syC,szC);
    cyl(inp,'steel',-.313,0,0,.035,.334,'x');cyl(inp,'iron',-.238,0,0,.066,.04,'x');cyl(inp,'steel',-.051,0,0,.029,.082,'x');
    for(let k=0;k<10;k++){const a=k*TAU/10,rr=.037;box(inp,'wear',-.208,Math.cos(a)*rr,Math.sin(a)*rr,.210,.014,.012,a);}
    const disk=(b,type,x,r,d)=>{cyl(b,type,x,0,0,r,d,'x',72);tor(b,'wear',x+d*.48,0,0,r-.004,.004,'x',72);};
    disk(pressure,'iron',0,.146,.040);disk(pressure,'wear',.019,.142,.009);tor(pressure,'dark',-.020,0,0,.127,.013,'x');
    cyl(pressure,'iron',-.069,0,0,.059,.093,'x',36);cyl(pressure,'steel',-.105,0,0,.071,.022,'x');
    for(let j=0;j<7;j++){
      const a=j*TAU/7,cy=Math.cos(a),sn=Math.sin(a);
      rod(pressure,'enamel',[-.039,.067*cy,.067*sn],[-.012,.130*cy,.130*sn],.011,10);
      cyl(pressure,'matt',.024,.115*cy,.115*sn,.007,.004,'x',12);}
    for(const dx of [-.025,-.014,.008,.023])disk(collar,dx<0?'matt':'brass',dx,.079,.009);
    cyl(collar,'steel',0,0,0,.060,.049,'x');tor(collar,'recess',-.003,0,0,.063,.006,'x');
    // Three preloaded spring packs turn with the input. Engaging the collar unloads them axially.
    const packs=hinge('压簧与导柱',.201,syC,szC);
    disk(inp,'dark',.201-sxC,.102,.009);
    for(let k=0;k<3;k++){
      const phase=.56+TAU*k/3,y=.087*Math.cos(phase),z=.087*Math.sin(phase);
      const path=[];for(let i=0;i<=63;i++){const f=i/63,a=f*TAU*5;path.push(V(.047*f,y+.012*Math.cos(a),z+.012*Math.sin(a)));}
      const coil=new T.TubeGeometry(new T.CatmullRomCurve3(path),63,.0038,6,false);
      stamp(packs,coil,'wear',V());coil.dispose();
      cyl(inp,'matt',.201-sxC,y,z,.018,.009,'x',18);cyl(pressure,'steel',-.023,y,z,.017,.009,'x',18);
      cyl(inp,'iron',.249-sxC,y,z,.0057,.081,'x',10);
    }
    // Driven wheel with buff fibre segments and a concentric bronze outer register stripe.
    const faceX=-.048;
    disk(out,'enamel',faceX+.018,.158,.039);disk(out,'fiber',faceX-.006,.151,.012);
    for(let j=0;j<12;j++){
      const a=j*TAU/12,rr=.131,z=Math.sin(a)*rr,y=Math.cos(a)*rr;
      cyl(out,'brass',faceX-.013,y,z,.006,.004,'x',12);
      // Gaps around the friction ring and its rivets are visible even when unloaded.
      box(out,'recess',faceX-.007,Math.cos(a)*.149,Math.sin(a)*.149,.012,.008,.010,a);
    }
    cyl(out,'iron',.052,0,0,.069,.101,'x');cyl(out,'steel',.133,0,0,.037,.232,'x');cyl(out,'brass',.18,0,0,.048,.019,'x');
    tor(out,'brass',faceX+.04,0,0,.094,.006,'x');tor(out,'iron',faceX+.038,0,0,.13,.009,'x');
    for(let j=0;j<7;j++){const a=j*TAU/7;rod(out,'raised',[faceX+.040,.055*Math.cos(a),.055*Math.sin(a)],[faceX+.042,.145*Math.cos(a+.22),.145*Math.sin(a+.22)],.010,12);}
    function marks(b,x,r,pairs,t,depth,angle){
      for(const d of pairs){const a=d+angle;box(b,t,x,r*Math.cos(a),r*Math.sin(a),depth,.0035,.020,a);
        box(b,t,x+depth*.48,(r-.022)*Math.cos(a),(r-.022)*Math.sin(a),.003,.043,.017,a);}}
    marks(pressure,0,.147,[0,.25,PI],'cream',.037,-.21);marks(out,faceX+.02,.159,[0,TAU/3,TAU*2/3],'amber',.032,.48);
    // Follower fork rocks on a keyed lower spindle; pins ride the outer thrust bearing.
    const fork=hinge('离合拨叉',.158,.979,szC),lever=hinge('前推离合柄',.249,.837,.249);
    cyl(none,'enamel',.158,.979,szC,.043,.301,'z');cyl(fork,'brass',0,0,0,.029,.324,'z');
    for(const side of sides){const a=side;
      bend(fork,'matt',[[0,.015,a*.081],[0,.086,a*.102],[0,.168,a*.108],[0,.224,a*.079],[0,.263,a*.071]],.014,24);
      cyl(fork,'brass',0,.260,a*.069,.016,.025,'z',18);}
    rod(fork,'enamel',[0,.001,.160],[-.107,-.007,.167],.013);
    // Main hand lever and the shaft linkage sit beneath the operators' palms.
    for(const x of [.181,.307]){
      form(none,'enamel',[[-.062,0],[.061,0],[.044,.140],[.026,.176],[-.029,.176],[-.047,.135]],.021,x-.011,.667,.274,.004,[0,PI/2,0]);
      bolt(none,'brass',x,.684,.225,.010);}
    cyl(none,'dark',.249,.837,.249,.062,.175,'x',32);cyl(lever,'brass',0,0,0,.036,.195,'x',24);
    form(lever,'red',[[-.021,-.010],[.025,-.010],[.015,.163],[.008,.219],[-.013,.219],[-.016,.114]],.016,-.008,0,0,.002,[0,PI/2,0]);
    bend(lever,'iron',[[0,.165,0],[0,.234,-.003],[.006,.263,-.007]],.013,14);
    cyl(lever,'brass',.006,.264,-.007,.020,.135,'x');
    lathe(lever,'grip',.006,.264,-.007,[[.008,-.081],[.023,-.080],[.027,-.069],[.025,-.044],[.024,.047],[.027,.069],[.023,.079],[.011,.080]],'x',30);
    for(const x of [-.064,-.058,.061,.067])tor(lever,'matt',x,.264,-.007,.025,.0016,'x',30);
    rod(lever,'enamel',[-.088,.006,0],[-.088,.059,-.091],.012);cyl(lever,'brass',-.088,.059,-.091,.015,.029,'x');
    const rodPin=hinge('开合推杆',0,0,0);cyl(rodPin,'wear',0,.5,0,.007,1,'y',12);
    // Service scars are concentrated at tool contact points and the oil lip, not uniformly along all faces.
    for(let j=0;j<200;j++){
      const x=-.603+rng()*1.22,front=.142+rng()*.004,y=.872+rng()*.009;
      if(rng()>.55&&Math.sin(x*29)<-.15)continue;
      const c=rng()<.66?'wear':rng()<.63?'rust':'matt',w=.001+rng()**2*.021;
      form(none,c,[[-w/2,0],[w*.22,-.0006-rng()*.0019],[w*.5,.0002],[w*.09,.001+rng()*.0014]],.0003,x,y,front,0);
    }
    for(const x of [-.51,.55])for(let j=0;j<16;j++){
      const y=.11+rng()*.43;box(none,rng()>.62?'rust':'matt',x+.028,y,.167,.002,.003+rng()*.013,.001);
    }
    bend(none,'black',[[-.39,1.28,-.166],[-.44,1.25,-.202],[-.459,1.10,-.29],[-.39,.988,-.338],[-.042,.965,-.331],[-.014,1.13,-.272],[.015,1.20,-.218]],.0105,38);
    for(const x of [-.36,-.19,-.048]){box(none,'steel',x,.970,-.324,.011,.026,.024);bolt(none,'matt',x,.974,-.312,.006,'z');}
    // Recessed calibrating handwheel is a separate, left-hand input.
    const trim=hinge('微调手轮',-.209,.972,.244,tree,-.18);
    const handL=V(-.068,.048,.048),handR=V(.006,.264,-.007);
    cyl(none,'enamel',-.209,.970,.170,.091,.105,'z');
    cyl(trim,'matt',0,0,.003,.035,.057,'z');
    tor(trim,'brass',0,0,.020,.088,.010,'z');tor(trim,'grip',0,0,.026,.091,.011,'z');
    for(let j=0;j<3;j++){const a=j*TAU/3+.31;
      rod(trim,'brass',[.018*Math.cos(a),.018*Math.sin(a),.010],[.084*Math.cos(a+.18),.084*Math.sin(a+.18),.022],.007);
    }
    cyl(trim,'steel',0,0,.035,.017,.017,'z',6);cyl(trim,'brass',handL.x,handL.y,.039,.012,.028,'z');
    lathe(trim,'black',handL.x,handL.y,.053,[[.009,-.009],[.017,-.003],[.019,.009],[.018,.024],[.012,.029],[.008,.030]],'z',24);
    // Shock-mounted clock, separately adjustable red set hand, long black live needle.
    const dx=-.277,dy=1.322,dz=-.055,dialTilt=-.13;
    const dial=hinge('比较转速计表座',dx,dy,dz,tree,dialTilt);
    form(none,'enamel',[[-.13,0],[.13,0],[.089,.155],[.057,.20],[-.078,.20]],.108,dx,.891,-.203,.009);
    for(const x of [dx-.094,dx+.094])bolt(none,'brass',x,.911,-.090,.014);
    lathe(dial,'enamel',0,0,0,[[.113,-.122],[.169,-.10],[.198,-.054],[.218,-.022],[.221,.001],[.213,.013],[.198,.022]],'z',88);
    tor(dial,'dark',0,0,.003,.215,.014,'z',96);tor(dial,'brass',0,0,.022,.204,.010,'z',96);tor(dial,'iron',0,0,.030,.197,.0042,'z',88);
    for(let k=0;k<8;k++){const a=k*PI/4+.18;cyl(dial,'matt',.215*Math.sin(a),.215*Math.cos(a),.020,.0063,.006,'z',16);}
    const rpmN=hinge('实速黑针',0,0,.049,dial),trimN=hinge('微调红针',0,0,.054,dial);
    form(rpmN,'black',[[-.004,-.039],[-.007,.014],[-.004,.145],[0,.176],[.003,.146],[.005,.012],[.005,-.039]],.0024,0,0,0,.00045);
    ell(rpmN,'black',0,-.040,.000,.010,.015,.0032);
    // The set needle has an open diamond tip: the longer black tip stays visible at coincidence.
    rod(trimN,'red',[0,-.024,0],[0,.120,0],.0026,9);
    for(const side of sides){rod(trimN,'red',[0,.117,0],[side*.005,.135,0],.0021,8);rod(trimN,'red',[side*.005,.135,0],[0,.146,0],.0018,8);}
    cyl(dial,'iron',0,0,.058,.014,.010,'z',24);cyl(dial,'brass',0,0,.065,.009,.008,'z',18);
    // Ribbed amber jewel with brass retainer. It is powered by the actual linked state.
    const lampX=-.011,lampY=1.417,lampZ=-.128;
    rod(none,'dark',[lampX,1.009,-.240],[lampX,1.414,-.240],.015);
    cyl(none,'enamel',lampX,lampY,lampZ-.024,.050,.139,'z',32);
    cyl(none,'brass',lampX,lampY,lampZ+.043,.054,.013,'z',42);tor(none,'iron',lampX,lampY,lampZ+.052,.045,.0034,'z');
    const lampMat=keep(new T.MeshStandardMaterial({color:0x9a6830,emissive:0xffa849,emissiveIntensity:.02,metalness:.17,roughness:.22}));
    const lg=keep(new T.SphereGeometry(1,40,16)),lamp=new T.Mesh(lg,lampMat);lamp.name='试灯琥珀透镜';lamp.scale.set(.041,.041,.022);lamp.position.set(lampX,lampY,lampZ+.053);root.add(lamp);
    for(const r of [.035,.027,.019])tor(none,'matt',lampX,lampY,lampZ+.053+.022*Math.sqrt(1-(r/.041)**2),r,.0011,'z',42);
    // Original paper and enamel markings share one atlas. No floating text panel.
    const paper=cv(1024,768),c=paper.getContext('2d');c.fillStyle='#363a34';c.fillRect(0,0,1024,768);
    const D=608,dc=304;const wash=c.createRadialGradient(271,196,40,dc,dc,307);
    wash.addColorStop(0,'#eee2bb');wash.addColorStop(.74,'#d9caa5');wash.addColorStop(.92,'#c9ba94');wash.addColorStop(1,'#a19070');
    c.fillStyle=wash;c.fillRect(0,0,D,D);
    for(let j=0;j<15080;j++){const x=rng()*D,y=rng()*D;c.fillStyle=rng()>.4?'rgba(56,58,42,.14)':'rgba(255,251,213,.38)';c.fillRect(x,y,rng()*1.35+.23,rng()*1.35+.23);}
    const sweep=2.19,angle=t=>-sweep+2*sweep*t;
    const near=(a,r)=>[dc+Math.sin(a)*r,dc-Math.cos(a)*r];
    function arc(t0,t1,rad,width,col){c.beginPath();c.arc(dc,dc,rad,angle(t0)-PI/2,angle(t1)-PI/2);c.lineWidth=width;c.strokeStyle=col;c.stroke();}
    arc(0,1,269,1.8,'#655f4e');arc(0,1,247,3,'#797260');arc(.50,.82,256,17,'#567258');arc(.82,1,256,4.3,'#a15f47');
    function text(str,x,y,size,ink,font='Arial'){c.fillStyle=ink;c.textAlign='center';c.textBaseline='middle';c.font='bold '+size+'px '+font;c.fillText(str,x,y);}
    for(let j=0;j<=100;j++){
      const a=angle(j/100),m=j%10===0,half=j%5===0,from=near(a,268),to=near(a,m?235:half?244:254);
      c.strokeStyle='#363d34';c.lineWidth=m?4.2:half?2.7:1.3;c.beginPath();c.moveTo(...from);c.lineTo(...to);c.stroke();
      if(m){const p=near(a,211);text(String(j),p[0],p[1]+4,31,'#343b33','"Arial Narrow",Arial');}
    }
    text('飞轮转速',dc,210,29,'#414339','"Songti SC","Noto Serif CJK SC",serif');text('转 / 分',dc,242,19,'#5c5a48');
    text('黑   实 速',dc-63,404,23,'#343a32','"Songti SC",serif');text('红   微 调',dc+61,404,23,'#963f2d','"Songti SC",serif');
    c.strokeStyle='#8a8064';c.lineWidth=1;c.strokeRect(190,377,228,54);
    for(const x of [147,461]){c.fillStyle='#9c8e71';c.beginPath();c.arc(x,dc+60,4.7,0,TAU);c.fill();c.strokeStyle='#685f50';c.lineWidth=1.1;c.beginPath();c.moveTo(x-3,dc+62);c.lineTo(x+3,dc+58);c.stroke();}
    function tag(x,y,w,h,words,bg,ink,size){
      c.fillStyle=bg;c.fillRect(x,y,w,h);c.strokeStyle=ink;c.lineWidth=2.6;c.strokeRect(x+5,y+5,w-10,h-10);
      for(const xx of [x+12,x+w-12])for(const yy of [y+12,y+h-12]){c.beginPath();c.arc(xx,yy,2.5,0,TAU);c.stroke();}
      text(words,x+w*.5,y+h*.52,size,ink,'"Songti SC","Noto Serif CJK SC",serif');
      for(let i=0;i<w*h/160;i++){c.fillStyle=rng()>.5?'rgba(89,70,47,.28)':'rgba(237,224,182,.25)';c.fillRect(x+3+rng()*(w-6),y+3+rng()*(h-6),rng()*2+.5,.7);}
    }
    tag(0,624,494,116,'机 房　／　试 灯 离 合','#47605a','#dad2b5',42);
    tag(627,8,385,82,'主 动　　 从 动','#b5a37c','#393e30',36);
    tag(627,111,176,72,'微  调','#293c37','#d4c8a3',32);tag(817,111,194,72,'离  合','#293c37','#d4c8a3',32);
    tag(627,216,140,65,'试 灯','#b8a888','#534e3a',27);
    const atlasMat=keep(new T.MeshStandardMaterial({map:toTex(paper,true),metalness:.12,roughness:.64}));
    const sheet={p:[],n:[],uv:[],idx:[]};
    function card(x,y,z,w,h,rect,rx=0,circle=false){
      const shape=circle?new T.CircleGeometry(.5,88):new T.PlaneGeometry(1,1),a=shape.attributes.position,uv=shape.attributes.uv,off=sheet.p.length/3;
      const nx=Math.sin(rx),co=Math.cos(rx);for(let j=0;j<a.count;j++){const yy=a.getY(j)*h;
        sheet.p.push(x+a.getX(j)*w,y+yy*co,z+yy*nx);sheet.n.push(0,-nx,co);
        sheet.uv.push((rect[0]+uv.getX(j)*rect[2])/1024,1-(rect[1]+(1-uv.getY(j))*rect[3])/768);}
      for(const id of shape.index.array)sheet.idx.push(off+id);shape.dispose();
    }
    card(dx,dy-.031*Math.sin(dialTilt),dz+.031*Math.cos(dialTilt),.394,.394,[0,0,608,608],dialTilt,true);
    card(-.088,.714,.153,.408,.094,[0,624,494,116]);
    card(.316,1.043,-.029,.296,.061,[627,8,385,82],-.25);
    box(none,'dark',.316,1.038,-.041,.309,.068,.020,-.25);
    card(-.382,.934,.136,.096,.040,[627,111,176,72],-.12);
    card(.428,.913,.141,.106,.040,[817,111,194,72],-.12);card(lampX,lampY-.064,lampZ+.024,.070,.031,[627,216,140,65]);
    for(const [x,y,z,w,h] of [[-.382,.934,.125,.105,.048],[.428,.913,.129,.113,.049],[lampX,lampY-.064,lampZ+.016,.080,.038]])box(none,'dark',x,y,z,w,h,.012);
    const ga=keep(new T.BufferGeometry());ga.setAttribute('position',new T.Float32BufferAttribute(sheet.p,3));ga.setAttribute('normal',new T.Float32BufferAttribute(sheet.n,3));ga.setAttribute('uv',new T.Float32BufferAttribute(sheet.uv,2));ga.setIndex(sheet.idx);
    const markings=new T.Mesh(ga,atlasMat);markings.name='铆印与刻度';markings.receiveShadow=true;root.add(markings);
    function merged(s,skin){const g=keep(new T.BufferGeometry());for(const [name,ar,dim] of [['position',s.p,3],['normal',s.n,3],['uv',s.uv,2],['color',s.c,3],['machining',s.m,2]])g.setAttribute(name,new T.Float32BufferAttribute(ar,dim));
      g.setIndex(s.i);if(skin){g.setAttribute('skinIndex',new T.Uint16BufferAttribute(s.ids,4));g.setAttribute('skinWeight',new T.Float32BufferAttribute(s.weights,4));}g.computeBoundingBox();g.computeBoundingSphere();return g;}
    const stand=new T.Mesh(merged(fixed,false),mat),machine=new T.SkinnedMesh(merged(moving,true),mat);
    stand.name='灰铸铁机架与油盘';machine.name='同步离合系';stand.castShadow=stand.receiveShadow=machine.castShadow=machine.receiveShadow=true;
    machine.add(tree);machine.updateMatrixWorld(true);const skeleton=keep(new T.Skeleton(bones));machine.bind(skeleton);
    // Travel stays inside this compact conservative box at every shift and trim position.
    machine.boundingBox=new T.Box3(V(-.58,.65,-.405),V(.74,1.61,.47));machine.boundingSphere=machine.boundingBox.getBoundingSphere(new T.Sphere());
    root.add(stand,machine);root.position.set(sx,0,sz);parent.add(root);for(const g of templates.values())g.dispose();templates.clear();
    const pL=V(),pF=V(),diff=V(),forkTop=.263,travel=.083,barQ=new T.Quaternion();
    const wheelQ=new T.Quaternion().setFromAxisAngle(V(1,0,0),-.18),rotZ=new T.Quaternion(),Z=V(0,0,1);
    function update(r,t=0){if(!r)return;
      const shift=clamp(Number.isFinite(r.shift)?r.shift:r.linked?1:0),set=clamp(r.trim||0);
      const actual=clamp(r.rpm||0),angleIn=r.spin||0,angleOut=Number.isFinite(r.drivenSpin)?r.drivenSpin:r.linked?angleIn:0;
      inp.rotation.x=angleIn;pressure.rotation.x=angleIn;out.rotation.x=angleOut;packs.rotation.x=angleIn;packs.scale.x=1+travel*shift/.047;
      collar.position.x=.158+travel*shift;pressure.position.x=.271+travel*shift;
      fork.rotation.z=-Math.asin(travel*shift/forkTop);lever.rotation.x=.36-.80*shift;
      trim.quaternion.copy(wheelQ).multiply(rotZ.setFromAxisAngle(Z,-(set-.5)*3.52));
      rpmN.rotation.z=sweep*(1-2*actual);trimN.rotation.z=sweep*(1-2*set);
      lampMat.emissiveIntensity=r.linked?1.50:.018+.036*Math.max(0,actual-.25);
      // Rod joins the actual moving clevis pins. A keyed bellcrank changes axial motion into fork rotation.
      pL.set(-.088,.059,-.091).applyQuaternion(lever.quaternion).add(lever.position);
      pF.set(-.107,-.007,.167).applyQuaternion(fork.quaternion).add(fork.position);
      diff.subVectors(pF,pL);const len=diff.length();rodPin.position.copy(pL);rodPin.quaternion.copy(barQ.setFromUnitVectors(axisY,diff.normalize()));rodPin.scale.set(1,len,1);
    }
    const hv=[V(),V()];function hands(){hv[0].copy(handL);hv[0].z+=.016;trim.localToWorld(hv[0]);lever.localToWorld(hv[1].copy(handR));return hv;}
    function shot(aspect=.80){
      const fov=41,target=[sx+.020,1.18,sz-.042],factor=2*Math.tan(fov*PI/360);
      // Allow space for the right-side oil line and for the operator to lean into the last detent.
      const distance=Math.max(1.85,1.515/(factor*clamp(aspect,.36,2.3)));
      const dir=V(.68,.59,.84).normalize();
      return {eye:[target[0]+distance*dir.x,target[1]+distance*dir.y,target[2]+distance*dir.z],at:target,fov,handsOnly:false};
    }
    update({rpm:.13,trim:.48},0);let ended=false;
    return {root,update,hands,shot,dispose(){if(ended)return;ended=true;root.removeFromParent();for(const o of retained)o.dispose();retained.clear();}};
  }
  return {create};
})();
