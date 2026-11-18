// Two open-reel transcription machines for the North Cape archive.
// Scene coordinates are metres. The black oxide ribbon follows tangents to the working tape packs and rollers.
const TideTapeDesk=(()=>{
  const T=THREE,TAU=Math.PI*2,clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
  const W=1.60,H=1.06,deckAngle=-1.26,packRadius=.237,hubRadius=.089;
  function vec(x=0,y=0,z=0){return new T.Vector3(x,y,z);}
  function canvasMap(own,w,h,draw){
    const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
    draw(canvas.getContext('2d',{willReadFrequently:false}),w,h);
    const map=own(new T.CanvasTexture(canvas));map.colorSpace=T.SRGBColorSpace;
    map.anisotropy=4;return map;
  }
  function seeded(initial){
    let state=initial;
    return ()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
  }
  function makePanel(own,side){
    return canvasMap(own,1800,1192,(c,w,h)=>{
      const rand=seeded(19578+side),ink=side?'#e2e5cc':'#3c4540',muted=side?'#a0b5a5':'#6c7067';
      const uv=(x,y)=>[(x/W+.5)*w,(.5-y/H)*h];
      const px=n=>n/W*w;
      const text=(x,y,str,size=13,opt={})=>{
        const [u,v]=uv(x,y);c.font=(opt.bold?'600 ':'')+size+'px '+(opt.mono?'monospace':'Arial, sans-serif');
        c.fillStyle=opt.color||ink;c.textAlign=opt.align||'left';c.fillText(str,u,v);
      };
      const line=(x,y,x1,y1,color=muted,width=1)=>{
        const [a,b]=uv(x,y),[d,e]=uv(x1,y1);c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.moveTo(a,b);c.lineTo(d,e);c.stroke();
      };
      const rect=(x,y,ww,hh,color)=>{
        const [u,v]=uv(x-ww/2,y+hh/2);c.fillStyle=color;c.fillRect(u,v,px(ww),px(hh));
      };
      const grad=c.createLinearGradient(0,0,w,h);
      grad.addColorStop(0,side?'#40544c':'#c8c5aa');grad.addColorStop(.5,side?'#556a5e':'#d7d3b8');grad.addColorStop(1,side?'#3d4e48':'#b4b5a6');
      c.fillStyle=grad;c.fillRect(0,0,w,h);
      for(let i=0;i<23000;i++){const t=rand();c.fillStyle=t>.55?'rgba(248,239,202,.13)':'rgba(55,48,37,.12)';c.fillRect(rand()*w,rand()*h,.6+rand()*2.1,.6+rand());}
      for(let i=0;i<310;i++){
        const x=rand()*w,y=rand()*h,t=rand(),len=2+rand()**3*51;
        c.lineWidth=.45+rand()*.65;c.strokeStyle=t>.43?'rgba(244,239,203,.22)':'rgba(59,49,42,.19)';
        c.beginPath();c.moveTo(x,y);c.lineTo(x+len,y+len*(rand()-.5)*.28);c.stroke();
      }
      for(let i=0;i<6;i++){const rad=50+rand()*140,x=rand()*w,y=rand()*h;const smudge=c.createRadialGradient(x,y,0,x,y,rad);
        smudge.addColorStop(0,'rgba(45,38,27,.071)');smudge.addColorStop(1,'rgba(45,38,27,0)');c.fillStyle=smudge;c.fillRect(x-rad,y-rad,rad*2,rad*2);}
      // Instrument engravings, transport alignment marks and the copper works plate.
      rect(0,.46,1.53,.085,side?'#293a35':'#5a6256');
      text(-.738,.467,'NORTH CAPE   /   SOUND ARCHIVE',21,{bold:true,color:'#dfd8ba'});
      text(-.738,.44,side?'TYPE RF–72   •   FIELD RECEIVER':'TYPE MT–71   •   MECHANICAL TRANSCRIPTION',12,{mono:true,color:'#d0ceb3'});
      text(.739,.463,side?'RECEIVER    02':'TRANSPORT    01',20,{align:'right',bold:true,color:'#e6e0c6'});
      text(.739,.438,side?'北 岬 接 收 台    /    1974':'北 岬 机 房    /    1972',14,{align:'right',color:'#c1c5b1'});
      for(const [i,x] of [-.398,.398].entries()){
        for(let j=0;j<25;j++){const a=Math.PI*.13+j*Math.PI*.74/24;
          const inner=j%4?.256:.251;line(x+inner*Math.cos(a),.153+inner*Math.sin(a),x+.261*Math.cos(a),.153+.261*Math.sin(a),muted,j%4?1:1.5);}
        text(x,.398,i?'TAKE UP  /  B':'SUPPLY  /  A',12,{align:'center',mono:true});
      }
      text(-.755,-.01,'TENSION',11,{bold:true});text(-.748,-.026,'70 g',10,{mono:true});
      text(.751,-.03,'CAPSTAN',11,{bold:true,align:'right'});
      line(-.737,-.265,.737,-.265,ink,1.5);line(-.737,-.273,.737,-.273,muted,.7);
      text(-.708,-.302,side?'LOCAL OSC.':'HAND FEED',13,{bold:true});text(-.708,-.319,side?'调  谐':'手  摇',13);
      text(.685,-.304,side?'FINE TUNE':'MONITOR',13,{bold:true,align:'right'});
      text(.686,-.32,side?'精  调':'监听电平',13,{align:'right'});
      text(-.398,-.305,'HEAD / LEVEL',12,{mono:true});
      text(.207,-.302,'CUE REGISTER',13,{mono:true,align:'center'});
      text(.558,.028,'15  /  7½  IPS',10,{mono:true});
      text(0,.310,side?'无线电记录':'机房原录',16,{align:'center',bold:true});
      text(0,.289,side?'CHANNEL   B':'CHANNEL   A',10,{align:'center',mono:true});
      for(let k=0;k<3;k++)text(.106+k*.103,-.47,['I','II','III'][k],13,{mono:true,align:'center'});
      text(-.018,-.49,'N.C.  /  INSPECTED',9,{align:'center',mono:true});
      for(const x of [-.76,.76])for(let i=0;i<16;i++){
        const y=rand()*.98-.49;line(x+rand()*.01,y,x+rand()*.015,y+rand()*.012,'rgba(230,220,186,.32)',.9);}
    });
  }
  function makeMeter(own){
    return canvasMap(own,700,316,(c,w,h)=>{
      const warm=c.createLinearGradient(0,0,0,h);warm.addColorStop(0,'#ac9c77');warm.addColorStop(.17,'#e6dfc5');warm.addColorStop(.53,'#fff0cd');warm.addColorStop(1,'#cfc098');
      c.fillStyle=warm;c.fillRect(0,0,w,h);
      c.fillStyle='#605a4a';c.textAlign='center';c.font='600 23px Arial';c.fillText('VOLUME UNITS',w*.5,72);
      const ox=w/2,oy=381,r=247,a=n=>(-128+76*n)*Math.PI/180;
      for(let i=0;i<=30;i++){
        const rad=a(i/30),big=i%5===0,near=r-(big?26:13);
        c.lineWidth=big?4:2;c.strokeStyle=i>20?'#a53e25':'#3c392e';c.beginPath();
        c.moveTo(ox+Math.cos(rad)*near,oy+Math.sin(rad)*near);c.lineTo(ox+Math.cos(rad)*r,oy+Math.sin(rad)*r);c.stroke();
        if(big){c.font='21px Georgia';c.fillStyle=c.strokeStyle;c.fillText(['−20','10','7','3','0','+2','+3'][i/5],ox+Math.cos(rad)*(r+29),oy+Math.sin(rad)*(r+29)+5);}
      }
      c.strokeStyle='#49463a';c.lineWidth=2;c.beginPath();c.arc(ox,oy,r,a(0),a(.68));c.stroke();c.strokeStyle='#b6462d';c.lineWidth=7;c.beginPath();c.arc(ox,oy,r,a(.68),a(1));c.stroke();
      c.fillStyle='#574f40';c.font='italic 38px Georgia';c.fillText('vu',350,243);
      c.fillStyle='#8d8067';c.font='15px monospace';c.fillText('NCA / MOVING COIL     600 Ω',350,281);
    });
  }
  function spoolProfile(){
    const shape=new T.Shape(),R=.247;shape.absarc(0,0,R,0,TAU,false);
    const ring=(r,a)=>[Math.cos(a)*r,Math.sin(a)*r];
    for(let k=0;k<3;k++){
      const mid=k*TAU/3+.25,start=mid-.73,end=mid+.73,ri=.084,ro=.208;
      const hole=new T.Path(),[a,b]=ring(ri,start+.27);hole.moveTo(a,b);
      hole.lineTo(...ring(ro-.017,start));hole.quadraticCurveTo(...ring(ro,start),...ring(ro,start+.13));
      hole.absarc(0,0,ro,start+.13,end-.13,false);hole.quadraticCurveTo(...ring(ro,end),...ring(ro-.017,end));
      hole.lineTo(...ring(ri,end-.27));hole.absarc(0,0,ri,end-.27,start+.27,true);hole.closePath();shape.holes.push(hole);
    }
    return new T.ExtrudeGeometry(shape,{depth:.004,bevelEnabled:true,bevelSegments:1,steps:1,bevelSize:.0018,bevelThickness:.0018,curveSegments:24});
  }
  function create(scene,base,side){
    side=side===1||side==='radio'?1:0;
    const owned=new Set(),own=o=>(owned.add(o),o);
    const root=new T.Group();root.name=side?'Archive radio receiver RF-72':'Archive tape transport MT-71';
    root.position.set(base.x,base.y,base.z);scene.add(root);
    const board=new T.Group();board.position.set(0,1.015,-.858);board.rotation.x=deckAngle;root.add(board);
    const unit=own(new T.BoxGeometry(1,1,1)),cyl=own(new T.CylinderGeometry(1,1,1,32)), smallCyl=own(new T.CylinderGeometry(1,1,1,12));
    const ringCache=new Map(),smallRing=(r,t)=>{
      const key=r+'|'+t;if(!ringCache.has(key))ringCache.set(key,own(new T.TorusGeometry(r,t,5,r>.1?64:28)));return ringCache.get(key);
    };
    const standard=(roughness,metalness)=>own(new T.MeshStandardMaterial({vertexColors:true,roughness,metalness}));
    const enamel=standard(.55,.25),alloy=standard(.35,.72),rubber=standard(.79,.06);
    const brushed=canvasMap(own,512,512,(c,w,h)=>{
      const rand=seeded(908);c.fillStyle='#e5e5de';c.fillRect(0,0,w,h);
      for(let i=0;i<22000;i++){
        const x=rand()*w,y=rand()*h,len=3+rand()**2*103;
        c.fillStyle=rand()>.45?'rgba(92,92,81,.068)':'rgba(255,255,244,.15)';c.fillRect(x,y,len,.6+rand()*.58);
      }
      for(let j=0;j<45;j++){const x=rand()*w,y=rand()*h;
        c.strokeStyle='rgba(132,127,104,.21)';c.lineWidth=.72;c.beginPath();c.moveTo(x,y);c.lineTo(x+rand()*47,y+rand()*9);c.stroke();}
    });brushed.wrapS=brushed.wrapT=T.RepeatWrapping;alloy.map=brushed;

    const p={body:side?'#415349':'#7e8274',edge:side?'#617468':'#b6b6a0',base:'#35403e',black:'#262a29',metal:'#a9aea6',chrome:'#cbd0c5',brass:'#ae8754',copper:'#ad7050',rubber:'#3a3530',dark:'#303735',wood:'#604e41',ink:'#d3d3bb'};
    const transform=new T.Object3D(),color=new T.Color(),stageMap=new Map();
    const groups=new Map();
    function factory(material){
      if(!groups.has(material))groups.set(material,{positions:[],normals:[],colors:[],uv:[]});
      return groups.get(material);
    }
    function staticShape(parent,geometry,material,tint,pos,scale,rotation,quaternion){
      const bucket=factory(material),key=geometry.uuid;
      if(!stageMap.has(key))stageMap.set(key,geometry.index?own(geometry.toNonIndexed()):geometry);
      const geo=stageMap.get(key),attr=geo.attributes,position=attr.position,normal=attr.normal;
      transform.position.set(...pos);transform.scale.set(...scale);
      if(quaternion)transform.quaternion.copy(quaternion);else transform.rotation.set(...rotation);
      transform.updateMatrix();const mat=transform.matrix.clone();
      if(parent===board){board.updateMatrix();mat.premultiply(board.matrix);}
      const nm=new T.Matrix3().getNormalMatrix(mat),point=vec(),n=vec();color.set(tint);
      for(let i=0;i<position.count;i++){
        point.fromBufferAttribute(position,i).applyMatrix4(mat);n.fromBufferAttribute(normal,i).applyNormalMatrix(nm);
        bucket.positions.push(point.x,point.y,point.z);bucket.normals.push(n.x,n.y,n.z);bucket.colors.push(color.r,color.g,color.b);
        const nx=Math.abs(n.x),ny=Math.abs(n.y),nz=Math.abs(n.z);
        if(nz>nx&&nz>ny)bucket.uv.push(point.x*3,point.y*3);
        else if(ny>nx)bucket.uv.push(point.x*3,point.z*3);
        else bucket.uv.push(point.z*3,point.y*3);
      }
    }
    const b=(parent,pos,size,tint,mat=enamel,rot=[0,0,0])=>staticShape(parent,unit,mat,tint,pos,size,rot);
    const axle=(parent,x,y,z,r,d,tint,mat=alloy,low=false)=>staticShape(parent,low?smallCyl:cyl,mat,tint,[x,y,z],[r,d,r],[Math.PI/2,0,0]);
    const tor=(parent,x,y,z,r,t,tint,mat=alloy)=>staticShape(parent,smallRing(r,t),mat,tint,[x,y,z],[1,1,1],[0,0,0]);
    const up=vec(0,1,0),quat=new T.Quaternion();
    function rod(parent,a,b0,r,tint,mat=alloy){
      const start=vec(...a),finish=vec(...b0),dir=finish.clone().sub(start);const len=dir.length();quat.setFromUnitVectors(up,dir.normalize());
      staticShape(parent,smallCyl,mat,tint,start.lerp(finish,.5).toArray(),[r,len,r],[0,0,0],quat);
    }
    function rounded(w,h,r){
      const s=new T.Shape(),x=-w/2,y=-h/2;
      s.moveTo(x+r,y);s.lineTo(-x-r,y);s.quadraticCurveTo(-x,y,-x,y+r);s.lineTo(-x,-y-r);s.quadraticCurveTo(-x,-y,-x-r,-y);s.lineTo(x+r,-y);s.quadraticCurveTo(x,-y,x,-y-r);s.lineTo(x,y+r);s.quadraticCurveTo(x,y,x+r,y);s.closePath();return s;
    }
    function bevel(parent,x,y,z,w,h,d,r,tint,mat=enamel){
      const geo=own(new T.ExtrudeGeometry(rounded(w,h,r),{depth:d,curveSegments:4,bevelEnabled:true,bevelSize:.003,bevelThickness:.003,bevelSegments:1}));
      staticShape(parent,geo,mat,tint,[x,y,z],[1,1,1],[0,0,0]);
    }
    function screw(x,y,z,size=.011,a=.3){
      axle(board,x,y,z,size,.005,'#9a9d91',alloy,true);
      b(board,[x,y,z+.0035],[size*1.4,.0017,.0008],'#48504c',rubber,[0,0,a]);
    }
    function dynamic(parent,geo,mat){
      const m=new T.Mesh(geo,mat);parent.add(m);return m;
    }
    function mapped(map,props={}){
      return own(new T.MeshStandardMaterial({map,metalness:.27,roughness:.52,...props}));
    }
    function plane(parent,x,y,z,w,h,material){
      const obj=dynamic(parent,own(new T.PlaneGeometry(w,h)),material);obj.position.set(x,y,z);return obj;
    }
    // Folded stand, walnut bumper rails, detachable electronics drawer, flexible power and patch runs.
    b(root,[0,.58,-.86],[1.43,.37,.74],p.body);b(root,[0,.358,-.86],[1.36,.055,.67],p.base);
    b(root,[0,.385,-.474],[1.40,.045,.024],p.edge);b(root,[0,.738,-.478],[1.43,.029,.027],p.edge);
    b(root,[0,.551,-.481],[1.33,.268,.027],'#515d55');
    for(const x of [-.64,.64])for(const z of [-.535,-1.18]){
      b(root,[x,.207,z],[.060,.392,.060],p.base);b(root,[x-.018,.22,z+.031],[.009,.32,.006],p.edge);
      b(root,[x,.028,z],[.13,.047,.115],p.rubber,rubber);
    }
    for(const x of [-.64,.64])b(root,[x,.198,-.858],[.038,.056,.692],p.base);
    b(root,[0,.179,-1.17],[1.36,.051,.043],p.base);
    for(let i=0;i<38;i++)b(root,[-.46+i*.025,.568,-.462],[.012,.084,.004],p.dark,rubber);
    for(const x of [-.59,.59]){
      for(const y of [.534,.599])rod(root,[x,y,-.463],[x,y,-.421],.009,p.chrome);
      rod(root,[x,.532,-.418],[x,.600,-.418],.010,p.chrome);
    }
    function loom(points,r,tint){
      const curve=new T.CatmullRomCurve3(points.map(q=>vec(...q)));
      staticShape(root,own(new T.TubeGeometry(curve,25,r,6,false)),rubber,tint,[0,0,0],[1,1,1],[0,0,0]);
    }
    loom([[.48,.59,-1.23],[.58,.40,-1.27],[.43,.11,-1.30],[.40,.027,-1.33],[.63,.015,-1.46]],.010,p.black);
    loom([[.53,.58,-1.23],[.67,.33,-1.22],[.58,.16,-1.23],[.44,.16,-1.21],[.42,.42,-1.21]],.006,p.copper);
    bevel(board,0,0,-.18,1.63,1.085,.165,.043,p.body);
    bevel(board,0,0,-.016,1.619,1.079,.014,.035,p.base);
    plane(board,0,0,.0042,W,H,mapped(makePanel(own,side)));
    for(const x of [-.812,.812]){
      bevel(board,x,0,-.122,.040,1.045,.131,.017,p.wood);
      for(let i=0;i<4;i++)b(board,[x+.014*Math.sin(i*1.6),0,.011],[.0014,1.0-i*.004,.001],i%2?'#755d47':'#453e34',rubber);
    }
    for(const x of [-.773,.773])for(const y of [-.492,-.237,.036,.496])screw(x,y,.006,.0095,1.8+x+y);
    function bake(bucket){
      const g=own(new T.BufferGeometry());
      g.setAttribute('position',new T.Float32BufferAttribute(bucket.positions,3));
      g.setAttribute('normal',new T.Float32BufferAttribute(bucket.normals,3));
      g.setAttribute('color',new T.Float32BufferAttribute(bucket.colors,3));
      g.setAttribute('uv',new T.Float32BufferAttribute(bucket.uv,2));
      g.computeBoundingSphere();return g;
    }
    function bakePart(key){const out=bake(groups.get(key));groups.delete(key);return out;}
    const reelKey={},c1=-.397,c2=.397,cy=.151;
    const plate=own(spoolProfile());
    for(const depth of [.016,.068])staticShape(null,plate,reelKey,side?'#b6c1b5':'#cfccac',[0,0,depth],[1,1,1],[0,0,0]);
    for(const depth of [.018,.072]){
      tor(null,0,0,depth,.244,.0028,'#ced2c5',reelKey);
      tor(null,0,0,depth,.230,.0018,'#9fa598',reelKey);
      tor(null,0,0,depth,.076,.0033,'#a2a99c',reelKey);
    }
    axle(null,0,0,.052,.087,.062,'#929c91',reelKey);
    axle(null,0,0,.081,.065,.015,'#454b46',reelKey);
    tor(null,0,0,.090,.050,.004,'#b2b4a3',reelKey);
    axle(null,0,0,.093,.041,.015,'#788078',reelKey,true);axle(null,0,0,.105,.013,.017,'#d1c9ac',reelKey,true);
    for(let j=0;j<3;j++){
      const a=j*TAU/3+1.22;
      b(null,[Math.cos(a)*.054,Math.sin(a)*.054,.095],[.028,.016,.007],'#b8af88',reelKey,[0,0,a]);
      const rad=.218;b(null,[Math.cos(a)*rad,Math.sin(a)*rad,.075],[.029,.003,.002],j===0?'#894e39':'#646e60',reelKey,[0,0,a]);
      axle(null,Math.cos(a)*.108,Math.sin(a)*.108,.072,.005,.004,'#b7b6a3',reelKey,true);
    }
    const reels=own(new T.InstancedMesh(bakePart(reelKey),alloy,2));reels.instanceMatrix.setUsage(T.DynamicDrawUsage);reels.frustumCulled=false;board.add(reels);
    function tapeTexture(){
      return canvasMap(own,512,512,(c,w,h)=>{
        c.fillStyle='#73563e';c.fillRect(0,0,w,h);
        const rand=seeded(572);
        for(let j=0;j<255;j++){
          const tone=rand();c.strokeStyle=tone>.63?'rgba(205,171,112,.28)':tone>.2?'rgba(46,34,25,.24)':'rgba(131,101,73,.27)';
          c.lineWidth=.4+rand();c.beginPath();c.arc(256,256,j+.25,0,TAU);c.stroke();
        }
        for(let k=0;k<7;k++){
          const g=c.createRadialGradient(256,256,12,256,256,252);g.addColorStop(0,'rgba(230,201,157,.11)');g.addColorStop(1,'rgba(230,201,157,.02)');
          c.fillStyle=g;c.beginPath();c.moveTo(256,256);c.arc(256,256,256,k*.898,k*.898+.21);c.closePath();c.fill();
        }
      });
    }
    const packMat=mapped(tapeTexture(),{roughness:.57,metalness:.23});
    const packGeo=own(new T.CylinderGeometry(1,1,1,80));packGeo.rotateX(Math.PI/2);
    const packs=own(new T.InstancedMesh(packGeo,packMat,2));packs.frustumCulled=false;packs.instanceMatrix.setUsage(T.DynamicDrawUsage);board.add(packs);
    for(const x of [c1,c2]){
      axle(board,x,cy,.003,.248,.011,'#859083',alloy);tor(board,x,cy,.005,.249,.0025,'#29322c',rubber);
      for(const yy of [.405,-.113])screw(x,yy,.006,.006);
    }
    // Head assembly; polished re-pro and erase pole pieces touch the oxide face at running height.
    bevel(board,0,-.161,.009,.333,.108,.044,.015,p.base);
    for(const x of [-.093,.074]){
      bevel(board,x,-.172,.049,.095,.063,.021,.012,'#aeb2a5',alloy);
      b(board,[x,-.204,.063],[.071,.016,.041],'#949b8b',alloy);
      b(board,[x,-.214,.060],[.019,.0025,.041],p.dark,rubber);
      for(const sx of [-.034,.034])screw(x+sx,-.159,.073,.0046);
      for(let i=0;i<5;i++)b(board,[x+.052,-.155+i*.005,.057],[.009,.003,.021],p.copper,alloy);
    }
    for(const x of [-.172,.172]){axle(board,x,-.162,.043,.012,.071,p.chrome);screw(x,-.162,.082,.009);}
    const pulleys=[[-.693,-.020,.032],[-.507,-.181,.045],[-.220,-.163,.049],[.218,-.163,.050],[.550,-.138,.053],[.694,-.016,.031]];
    const armPivot=[-.535,-.102],tensionIndex=1;
    for(let k=0;k<pulleys.length;k++){
      if(k===tensionIndex)continue;
      const [x,y,r]=pulleys[k];axle(board,x,y,.020,r+.010,.019,p.metal);
      axle(board,x,y,.049,r,.044,k===4?p.black:p.chrome,k===4?rubber:alloy);
      axle(board,x,y,.074,r+.004,.007,p.metal);screw(x,y,.080,.0088);
    }
    axle(board,armPivot[0],armPivot[1],.013,.031,.018,p.metal);
    const armKey={},armDx=pulleys[1][0]-armPivot[0],armDy=pulleys[1][1]-armPivot[1];
    rod(null,[0,0,.023],[armDx,armDy,.023],.015,p.brass,armKey);
    axle(null,0,0,.025,.019,.037,p.chrome,armKey);
    axle(null,armDx,armDy,.031,.051,.015,p.brass,armKey);
    axle(null,armDx,armDy,.051,.045,.036,p.chrome,armKey);
    axle(null,armDx,armDy,.072,.049,.007,p.metal,armKey);
    axle(null,armDx,armDy,.079,.012,.009,p.brass,armKey,true);
    const arm=dynamic(board,bakePart(armKey),alloy);arm.position.set(armPivot[0],armPivot[1],0);
    const pathGeo=own(new T.BufferGeometry()),path=new Float32Array((pulleys.length*9+2)*2*3);
    const pathAttr=new T.BufferAttribute(path,3);pathAttr.setUsage(T.DynamicDrawUsage);
    pathGeo.setAttribute('position',pathAttr);
    const indices=[];for(let i=0;i<path.length/6-1;i++){const a=i*2;indices.push(a,a+2,a+1,a+1,a+2,a+3);}
    pathGeo.setIndex(indices);
    // Unlit diffuse on the brown ribbon keeps a ¼-inch tape legible edge-on, even under the green desk lamp.
    const tapeMat=own(new T.MeshBasicMaterial({color:'#67472f',side:T.DoubleSide}));
    const runningTape=dynamic(board,pathGeo,tapeMat);runningTape.frustumCulled=false;
    const centers=[{x:c1,y:cy,r:0},...pulleys.map(([x,y,r])=>({x,y,r})),{x:c2,y:cy,r:0}];
    const starts=new Float32Array(centers.length),ends=new Float32Array(centers.length);
    function thread(ra,rb,pivot){
      centers[0].r=ra;centers[centers.length-1].r=rb;
      const moving=centers[tensionIndex+1];
      moving.x=armPivot[0]+Math.cos(pivot)*armDx-Math.sin(pivot)*armDy;
      moving.y=armPivot[1]+Math.sin(pivot)*armDx+Math.cos(pivot)*armDy;
      for(let i=0;i<centers.length-1;i++){
        const a=centers[i],b=centers[i+1],dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy);
        const arg=Math.atan2(dy,dx)-Math.acos(clamp((a.r-b.r)/len,-1,1));
        ends[i]=arg;starts[i+1]=arg;
      }
      let k=0;
      function vertex(a,theta){
        const x=a.x+Math.cos(theta)*a.r,y=a.y+Math.sin(theta)*a.r;
        path[k++]=x;path[k++]=y;path[k++]=.037;
        path[k++]=x;path[k++]=y;path[k++]=.055;
      }
      vertex(centers[0],ends[0]);
      for(let i=1;i<centers.length-1;i++){
        const a=starts[i],delta=((ends[i]-a+Math.PI*3)%TAU)-Math.PI;
        for(let j=0;j<=8;j++)vertex(centers[i],a+delta*j/8);
      }
      vertex(centers[centers.length-1],starts[centers.length-1]);pathAttr.needsUpdate=true;
    }
    // Mechanical jog wheel with scalloped rim, three spokes and an off-axis finger cup.
    const handX=-.601,handY=-.402,handR=.105,knobX=.589,knobY=-.411;
    axle(board,handX,handY,.008,.119,.015,p.base);tor(board,handX,handY,.019,.113,.0036,p.chrome);
    const jogKey={};
    tor(null,0,0,.035,.097,.011,side?'#39423b':'#57534a',jogKey);
    tor(null,0,0,.047,.096,.003,'#9aa090',jogKey);
    axle(null,0,0,.036,.025,.028,p.chrome,jogKey);
    for(let i=0;i<3;i++){const a=i*TAU/3;rod(null,[Math.cos(a)*.018,Math.sin(a)*.018,.034],[Math.cos(a)*.09,Math.sin(a)*.09,.035],.009,p.chrome,jogKey);}
    for(let i=0;i<36;i++){
      const a=TAU*i/36;b(null,[Math.cos(a)*.102,Math.sin(a)*.102,.036],[.008,.006,.015],p.rubber,jogKey,[0,0,a]);
    }
    axle(null,.070,.02,.064,.009,.057,'#bfbda3',jogKey);
    axle(null,.070,.02,.098,.017,.049,p.black,jogKey);axle(null,.070,.02,.124,.014,.004,'#827e6e',jogKey);
    const jog=dynamic(board,bakePart(jogKey),alloy);jog.position.set(handX,handY,0);
    const dialKey={};axle(null,0,0,.036,.074,.061,p.black,dialKey);axle(null,0,0,.070,.060,.014,side?'#a8ac91':'#969d88',dialKey);
    tor(null,0,0,.080,.053,.002,p.chrome,dialKey);
    b(null,[0,.039,.079],[.005,.031,.004],'#e7e1b6',dialKey);
    for(let j=0;j<36;j++){const a=TAU*j/36;b(null,[.072*Math.cos(a),.072*Math.sin(a),.040],[.004,.006,.045],'#565c51',dialKey,[0,0,a]);}
    const dial=dynamic(board,bakePart(dialKey),alloy);dial.position.set(knobX,knobY,0);
    axle(board,knobX,knobY,.007,.091,.013,p.chrome);
    for(let j=0;j<=20;j++){
      const a=(-.22+1.44*j/20)*Math.PI;
      b(board,[knobX+Math.cos(a)*.099,knobY+Math.sin(a)*.099,.004],[j%5?.007:.015,.002,.002],p.dark,rubber,[0,0,a]);
    }
    // Three removable cue pins in phenolic bushings and one amber record-head witness jewel.
    const pinStart=.105,spacing=.103,pinY=-.393;
    for(let j=0;j<3;j++){
      const x=pinStart+j*spacing;axle(board,x,pinY,.009,.029,.013,p.dark,rubber);tor(board,x,pinY,.019,.025,.003,p.brass);
      screw(x+.035,pinY+.014,.007,.005);
    }
    const pinKey={};axle(null,0,0,.023,.007,.044,p.chrome,pinKey);
    axle(null,0,0,.049,.014,.019,'#ad7655',pinKey);tor(null,0,0,.059,.010,.002,'#caa171',pinKey);
    const pins=own(new T.InstancedMesh(bakePart(pinKey),alloy,3));pins.frustumCulled=false;board.add(pins);
    const witnessX=.005,witnessY=.134;
    axle(board,witnessX,witnessY,.018,.032,.020,p.base);
    tor(board,witnessX,witnessY,.030,.026,.004,p.chrome);
    const lampMat=own(new T.MeshStandardMaterial({color:side?'#936749':'#963b28',emissive:'#ff4120',emissiveIntensity:.14,metalness:.09,roughness:.25}));
    const witness=dynamic(board,own(new T.SphereGeometry(1,22,10)),lampMat);witness.scale.set(.023,.023,.015);witness.position.set(witnessX,witnessY,.033);
    // The optical face sits inside an actual recess. The needle pivots below the lower aperture.
    const meterX=-.254,meterY=-.396,meterW=.304,meterH=.134;
    bevel(board,meterX,meterY,.006,.337,.159,.017,.014,'#343a34',rubber);
    bevel(board,meterX,meterY,.024,.322,.149,.005,.012,p.brass);
    plane(board,meterX,meterY,.034,meterW,meterH,mapped(makeMeter(own),{metalness:.02,roughness:.73,emissive:side?0x191c11:0x282014,emissiveIntensity:.48}));
    const handKey={},pivotY=meterY-.093;
    // Moving-coil arm is physically masked by the lower lip under the glass.
    b(null,[0,.0545,0],[.002,.109,.0017],'#3b3629',handKey);
    axle(null,0,.0,0,.007,.002,'#746749',handKey);
    const needle=dynamic(board,bakePart(handKey),alloy);needle.position.set(meterX,pivotY,.037);
    b(board,[meterX,meterY-.078,.039],[.341,.024,.010],p.base);
    const glassT=canvasMap(own,256,112,(c,w,h)=>{
      const gr=c.createLinearGradient(28,0,172,107);gr.addColorStop(0,'rgba(222,243,223,.03)');gr.addColorStop(.38,'rgba(222,243,223,.03)');gr.addColorStop(.42,'rgba(232,246,220,.09)');gr.addColorStop(.56,'rgba(232,246,220,.04)');gr.addColorStop(.6,'rgba(223,243,231,.010)');gr.addColorStop(1,'rgba(226,240,229,.020)');c.fillStyle=gr;c.fillRect(0,0,w,h);
    });
    const glass=plane(board,meterX,meterY,.041,meterW,meterH,own(new T.MeshBasicMaterial({map:glassT,transparent:true,depthWrite:false})));glass.renderOrder=3;
    // Additional supply, output and head azimuth screws around the open machine bed.
    for(const y of [.04,.072,.105])for(const x of [-.034,.049])b(board,[x,y,.003],[.033,.003,.003],p.base,rubber);
    for(const x of [-.711,.715])for(const y of [-.205,.331])screw(x,y,.004,.011,x*7+y);
    for(const [mat,bucket] of groups){
      const m=dynamic(root,bake(bucket),mat);m.castShadow=true;m.receiveShadow=true;
    }
    groups.clear();stageMap.clear();
    const gripL=vec(),gripR=vec(),grips=[gripL,gripR];
    const scratch=new T.Object3D(),area=packRadius*packRadius-hubRadius*hubRadius;
    let lastClock=null,lastPos=null,adjustment=0,vu=0,wobble=0,latchFlash=0,lastMark=0;
    let pose={jog:0,tuning:.5,monitor:false};
    function stamp(mesh,index,x,y,z,angle,sx=1,sy=1,sz=1){
      scratch.position.set(x,y,z);scratch.rotation.set(0,0,angle);scratch.scale.set(sx,sy,sz);
      scratch.updateMatrix();mesh.setMatrixAt(index,scratch.matrix);
    }
    function update(data={}){
      const time=Number.isFinite(data.clock)?data.clock:0;
      const dt=lastClock===null?0:clamp(time-lastClock,0,.125);lastClock=time;
      const pos=clamp(Number.isFinite(data.position)?data.position:lastPos??0);
      const speed=clamp(Number.isFinite(data.speed)?data.speed:0,-8,8),tuning=clamp(data.tuning??.5);
      const level=clamp(data.level??0),marked=Math.round(clamp(data.marked??0,0,3)),monitor=!!data.monitor;
      const stage=Number.isFinite(data.stage)?data.stage:0;
      const ra=Math.sqrt(hubRadius*hubRadius+(1-pos)*area),rb=Math.sqrt(hubRadius*hubRadius+pos*area);
      // The integral of length / wound radius gives spindle rotation without a wrap or speed discontinuity after a seek.
      const tapeLength=44.0;
      if(lastPos!==null&&dt>0&&Math.abs(pos-lastPos)<1e-7&&Math.abs(speed)>.001)adjustment+=speed*dt*.22;
      lastPos=pos;
      const angles=[2*tapeLength*(packRadius-ra)/area+adjustment+.35,2*tapeLength*(rb-hubRadius)/area+adjustment+1.11];
      for(let i=0;i<2;i++){
        const x=i?c2:c1,r=i?rb:ra;
        stamp(reels,i,x,cy,0,angles[i]);
        stamp(packs,i,x,cy,.045,angles[i],r,r,.045);
      }
      reels.instanceMatrix.needsUpdate=true;packs.instanceMatrix.needsUpdate=true;
      const targetWobble=clamp(speed*.065,-.33,.33)+Math.sin(time*6.1)*Math.min(Math.abs(speed),1)*.028;
      wobble+=(targetWobble-wobble)*(dt>0?1-Math.exp(-12*dt):1);
      arm.rotation.z=wobble;thread(ra,rb,wobble);
      jog.rotation.z=(side?-.5+tuning*1.9:angles[0]*.24)-1.15;
      dial.rotation.z=(.5-tuning)*Math.PI*1.48;
      const targetVu=Math.sqrt(level);
      vu+=(targetVu-vu)*(dt>0?1-Math.exp(-dt*(targetVu>vu?15:4)):1);
      needle.rotation.z=(.5-vu)*1.32;
      if(marked>lastMark)latchFlash=time+.43;lastMark=marked;
      lampMat.emissiveIntensity=time<latchFlash?1.8:monitor?.54+.23*level:.035;
      for(let i=0;i<3;i++)stamp(pins,i,pinStart+i*spacing,pinY,marked>i?.023:-.020,0);
      pins.instanceMatrix.needsUpdate=true;
      pose.jog=jog.rotation.z;pose.tuning=dial.rotation.z;pose.monitor=monitor;pose.stage=stage;
    }
    function hands(){
      // Contact points are in world space, including any scene-parent transform.
      board.updateWorldMatrix(true,false);
      const a=pose.jog,j=.070,k=.020;
      gripL.set(handX+j*Math.cos(a)-k*Math.sin(a),handY+j*Math.sin(a)+k*Math.cos(a),.128).applyMatrix4(board.matrixWorld);
      const t=pose.tuning-.86;
      gripR.set(knobX+.065*Math.sin(t),knobY-.065*Math.cos(t),.093).applyMatrix4(board.matrixWorld);
      return grips;
    }
    function dispose(){root.removeFromParent();owned.forEach(o=>o.dispose());owned.clear();root.clear();}
    update({position:0,tuning:.5,level:0,clock:0});return {update,hands,dispose};
  }
  return {create};
})();
if(typeof window!=='undefined')window.TideTapeDesk=TideTapeDesk;
