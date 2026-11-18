// North Cape stern warp. The supplied world points belong to the same launch and quay as the two players.
const TideSternGear=(()=>{
  const T=THREE,TAU=2*Math.PI,clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
  const V=(x=0,y=0,z=0)=>new T.Vector3(x,y,z),up=V(0,1,0);
  function create(scene){
    const root=new T.Group();root.name='交通艇 · 艉缆与钩篙';scene.add(root);
    const owned=new Set(),own=o=>(owned.add(o),o),temps=new Set();
    const group=(p,name)=>{const g=new T.Group();g.name=name;p.add(g);return g;};
    const pole=group(root,'伸向舷外的钩篙'),head=group(pole,'锻制钩口'),heel=group(pole,'杆尾胶箍'),eye=group(root,'绿缠线 · 拼接绳眼'),roller=group(root,'堤沿护缆滚子');
    const grips=[group(pole,'后手缠握区'),group(pole,'前手缠握区')];
    let seed=0xa99f20d;const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
    const cv=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;};
    function texture(c,srgb,repeat=true){const t=own(new T.CanvasTexture(c));if(srgb)t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;if(repeat)t.wrapS=t.wrapT=T.RepeatWrapping;return t;}
    const grain=cv(256,768),gc=grain.getContext('2d'),gd=gc.createImageData(256,768);
    const strand=cv(256,256),fc=strand.getContext('2d'),fd=fc.createImageData(256,256);
    const relief=cv(256,256),bc=relief.getContext('2d'),bd=bc.createImageData(256,256);
    const knots=Array.from({length:24},()=>[random(),random(),.004+random()*.013]);
    for(let y=0;y<768;y++)for(let x=0;x<256;x++){
      const i=(x+256*y)*4,u=x/256,h=y/768;
      const wriggle=.009*Math.sin(TAU*(u*4+h))+.009*Math.sin(TAU*(u-h*2))+.003*Math.cos(TAU*h*6);
      const k=u+wriggle,late=(.5+.5*Math.cos(TAU*(k*18+Math.sin(TAU*(h+u*2))*.28)))**7;
      const thread=Math.sin(TAU*k*88+1.5*Math.sin(TAU*h*2))*.5+.5,varnish=.5+.5*Math.cos(TAU*(h*2-u));
      let fleck=0;for(const [ox,oy,r] of knots){const xx=Math.min(Math.abs(u-ox),1-Math.abs(u-ox))/r,yy=Math.min(Math.abs(h-oy),1-Math.abs(h-oy))/(r*.91);if(xx<2&&yy<2)fleck=Math.max(fleck,(1-Math.min(1,xx*xx+yy*yy))*.9);}
      const l=11*Math.sin(TAU*k*4)+thread*5-late*28+(random()-.5)*8-fleck*23;
      gd.data.set([165+l+10*varnish,111+l*.83+9*varnish,67+l*.63+7*varnish,255],i);}
    gc.putImageData(gd,0,0);
    for(let i=0;i<1350;i++){const x=random()*256,y=random()*768,len=3+random()**2*62;gc.strokeStyle=random()>.40?'rgba(238,219,170,.22)':'rgba(70,50,36,.19)';gc.lineWidth=.4+random()*.67;gc.beginPath();gc.moveTo(x,y);gc.bezierCurveTo(x+1,y+len*.32,x+1.3,y+len*.68,x+.40,y+len);gc.stroke();}
    for(let y=0;y<256;y++)for(let x=0;x<256;x++){
      const i=(x+y*256)*4,u=x/256,k=y/256,tw=u*9-k*3,track=.5+.5*Math.cos(tw*TAU+.36*Math.sin(TAU*(k+u*3))),filament=.5+.5*Math.cos(TAU*(u*44-k*14+.15*Math.sin(TAU*k*4)));
      const v=155+52*track+32*filament+(random()-.5)*22,b=112+34*track+22*filament;
      fd.data.set([v,v*.98,v*.94,255],i);bd.data.set([b,b,b,255],i);}
    fc.putImageData(fd,0,0);bc.putImageData(bd,0,0);
    const woodMat=own(new T.MeshStandardMaterial({map:texture(grain,true),color:0xffffff,roughness:.40,metalness:.025}));woodMat.map.repeat.y=2;
    const cordMat=own(new T.MeshStandardMaterial({map:texture(strand,true),bumpMap:texture(relief,false),bumpScale:.00055,vertexColors:true,roughness:.67,metalness:.045}));
    const iron=own(new T.MeshStandardMaterial({vertexColors:true,metalness:.71,roughness:.40}));
    const worn=own(new T.MeshStandardMaterial({vertexColors:true,metalness:.19,roughness:.52}));
    const matrix=new T.Matrix4(),normalM=new T.Matrix3(),quat=new T.Quaternion(),va=V(),vn=V(),one=V(1,1,1),bins=new Map();
    const cube=new T.BoxGeometry(1,1,1);temps.add(cube);const sources=new Map();
    function ownTemplate(id,fn){if(!sources.has(id)){const q=fn();sources.set(id,q);temps.add(q);}return sources.get(id);}
    function stamp(node,m,g,hex,loc=V(),rot=[0,0,0],sc=one){
      let by=bins.get(node);if(!by){by=new Map();bins.set(node,by);}let b=by.get(m);if(!b){b={p:[],n:[],uv:[],c:[],i:[]};by.set(m,b);}
      const off=b.p.length/3,col=new T.Color(hex),p=g.attributes.position,n=g.attributes.normal,uv=g.attributes.uv;
      matrix.compose(loc,rot.isQuaternion?rot:quat.setFromEuler(new T.Euler(...rot)),sc);normalM.getNormalMatrix(matrix);
      for(let i=0;i<p.count;i++){va.fromBufferAttribute(p,i).applyMatrix4(matrix);vn.fromBufferAttribute(n,i).applyMatrix3(normalM).normalize();b.p.push(va.x,va.y,va.z);b.n.push(vn.x,vn.y,vn.z);b.c.push(col.r,col.g,col.b);b.uv.push(uv?.getX(i)||0,uv?.getY(i)||0);}
      if(g.index){for(const k of g.index.array)b.i.push(off+k);}else for(let k=0;k<p.count;k++)b.i.push(off+k);
    }
    function finalize(b){const g=new T.BufferGeometry();for(const [a,val,n] of [['position',b.p,3],['normal',b.n,3],['color',b.c,3],['uv',b.uv,2]])g.setAttribute(a,new T.Float32BufferAttribute(val,n));g.setIndex(b.i);g.computeBoundingSphere();return g;}
    function lathe(node,m,col,path,n=28,where=V(),rot=[0,0,0]){const g=new T.LatheGeometry(path.map(([r,y])=>new T.Vector2(r,y)),n);stamp(node,m,g,col,where,rot);g.dispose();}
    function cyl(node,m,col,x,y,z,rad,len,axis='y',n=24){const g=ownTemplate('c'+n,()=>new T.CylinderGeometry(1,1,1,n));stamp(node,m,g,col,V(x,y,z),axis==='x'?[0,0,-Math.PI*.5]:axis==='z'?[Math.PI*.5,0,0]:[0,0,0],V(rad,len,rad));}
    function box(node,m,col,x,y,z,w,h,d){stamp(node,m,cube,col,V(x,y,z),[0,0,0],V(w,h,d));}
    function tor(node,m,col,x,y,z,r,t,axis='y',n=32){const g=new T.TorusGeometry(r,t,6,n);stamp(node,m,g,col,V(x,y,z),axis==='y'?[Math.PI*.5,0,0]:axis==='x'?[0,Math.PI*.5,0]:[0,0,0]);g.dispose();}
    function tube(node,m,col,pts,r,seg=36,n=8,closed=false){const path=new T.CatmullRomCurve3(pts.map(p=>Array.isArray(p)?V(...p):p),closed,'centripetal');const g=new T.TubeGeometry(path,seg,r,n,closed);stamp(node,m,g,col);g.dispose();}
    function tapered(node,points,radii,baseColor,contact){
      const path=new T.CatmullRomCurve3(points.map(p=>V(...p))),segments=42,sides=14,frames=path.computeFrenetFrames(segments,false);
      const pos=[],uv=[],idx=[],colors=[],base=new T.Color(baseColor),light=new T.Color(contact),tint=new T.Color();
      for(let i=0;i<=segments;i++){const u=i/segments,center=path.getPointAt(u),j=u*(radii.length-1),k=Math.floor(j),r=T.MathUtils.lerp(radii[k],radii[Math.min(k+1,radii.length-1)],j-k);
        for(let h=0;h<=sides;h++){const a=h/sides*TAU,co=Math.cos(a),si=Math.sin(a);
          va.copy(center).addScaledVector(frames.normals[i],.79*r*co).addScaledVector(frames.binormals[i],1.12*r*si);
          pos.push(va.x,va.y,va.z);uv.push(h/sides,u);
          tint.copy(base).lerp(light,clamp(.13+.50*Math.max(0,si)+.51*(u**3)+.085*Math.sin(a*3+u*40),0,1));colors.push(tint.r,tint.g,tint.b);
          if(i<segments&&h<sides){const id=i*(sides+1)+h;idx.push(id,id+1,id+sides+1,id+1,id+sides+2,id+sides+1);}}}
      const g=own(new T.BufferGeometry());g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.setIndex(idx);g.computeVertexNormals();
      // Preserve the filed highlights when batching this forged piece with its socket.
      const p=g.attributes.position,n=g.attributes.normal,col=g.attributes.color;let by=bins.get(node);if(!by){by=new Map();bins.set(node,by);}let b=by.get(iron);if(!b){b={p:[],n:[],uv:[],c:[],i:[]};by.set(iron,b);}
      const start=b.p.length/3;for(let i=0;i<p.count;i++){b.p.push(p.getX(i),p.getY(i),p.getZ(i));b.n.push(n.getX(i),n.getY(i),n.getZ(i));b.c.push(col.getX(i),col.getY(i),col.getZ(i));b.uv.push(0,0);}for(const id of idx)b.i.push(start+id);
      owned.delete(g);g.dispose();
    }
    // Local Y runs from the exact butt to the player's indicated point. Metal socket covers the wood end.
    const shaftG=own(new T.LatheGeometry([[.018,0],[.019,.012],[.0186,.062],[.0175,.36],[.018,.70],[.0163,.92],[.016,.998]].map(p=>new T.Vector2(...p)),32));
    const shaft=new T.Mesh(shaftG,woodMat);shaft.name='浸油白蜡木钩杆';shaft.castShadow=shaft.receiveShadow=true;pole.add(shaft);
    lathe(heel,worn,'#45463c',[[.000,0],[.018,0],[.0201,.004],[.0208,.011],[.0207,.039],[.0191,.046]],26);
    tor(heel,worn,'#81745c',0,.036,0,.0206,.0015);tor(heel,worn,'#232f2b',0,.009,0,.0209,.0016);
    lathe(head,iron,'#8f805c',[[.0179,-.207],[.0201,-.205],[.0205,-.199],[.0198,-.193],[.0175,-.166],[.0165,-.136],[.014,-.111],[.010,-.105]],36);
    for(const y of [-.200,-.189])tor(head,iron,'#c4aa73',0,y,0,y<-.195?.0199:.0191,.0013);
    for(const y of [-.175,-.152]){cyl(head,iron,'#5f6657',0,y,0,.0037,.0372,'z',14);cyl(head,iron,'#b8aa82',0,y,.0185,.00315,.0014,'z',14);}
    // Bullnose on axis and a swept blunt crook. The clear mouth opens back toward the operator.
    tapered(head,[[0,-.137,0],[0,-.105,0],[-.004,-.064,0],[-.006,-.030,0],[-.003,-.009,0],[0,0,0]],[.0165,.0145,.0118,.0078,.005,.0020],'#777f70','#d3c9aa');
    tapered(head,[[0,-.118,0],[.013,-.081,.001],[.041,-.042,.002],[.073,-.019,.001],[.100,-.023,0],[.121,-.048,-.001],[.137,-.084,-.002],[.142,-.097,-.001]],[.0155,.016,.015,.014,.013,.0108,.007,.0051],'#67746a','#c1bca8');
    const cap=ownTemplate('nose',()=>new T.SphereGeometry(1,16,10));stamp(head,iron,cap,'#cac6b1',V(.142,-.097,-.001),[0,0,0],V(.0053,.0058,.0044));
    for(const grip of grips){
      lathe(grip,worn,'#544631',[[.0176,-.060],[.0191,-.059],[.0191,.051],[.0175,.055]],24);
      const winds=[];for(let k=0;k<=229;k++){const u=k/229,aa=u*TAU*15;winds.push(V(.0191*Math.cos(aa),-.055+u*.106,.0191*Math.sin(aa)));}
      tube(grip,worn,'#9d8863',winds,.00172,215,6);for(const y of [-.060,-.057,.052,.055])tor(grip,worn,'#695e49',0,y,0,.0189,.0014,'y',24);
    }
    // A Flemish eye spliced back into its standing part. Three laid strands keep the hole truly open.
    const path=new T.CatmullRomCurve3([[0,.243,0],[.077,.184,.007],[.135,.072,.008],[.143,-.063,.004],[.110,-.172,-.002],[.043,-.232,-.005],[-.041,-.236,-.003],[-.112,-.180,.003],[-.141,-.075,.004],[-.131,.075,0],[-.066,.189,-.005]].map(p=>V(...p)),true);
    const eyeCenters=path.getSpacedPoints(88);
    const crook=[[.077,-.018,.001,.013],[.090,-.019,0,.013],[.104,-.028,0,.012],[.116,-.041,0,.011],[.126,-.059,-.001,.010],[.133,-.074,-.002,.008],[.140,-.090,-.001,.006]];
    const samples=198,frames=path.computeFrenetFrames(samples,true),loops=9,eyeRadius=.0168;
    function ropePiece(par,line,palette,spanCount,twists,radius,closed=false){
      const centers=line.getSpacedPoints(spanCount),basis=line.computeFrenetFrames(spanCount,closed);
      tube(par,cordMat,palette[0],closed?centers.slice(0,-1):centers,radius*.62,spanCount,7,closed);
      for(let j=0;j<3;j++){const p=[];for(let i=0;i<(closed?spanCount:spanCount+1);i++){const a=TAU*(j/3+twists*i/spanCount);
        p.push(centers[i].clone().addScaledVector(basis.normals[i],radius*.46*Math.cos(a)).addScaledVector(basis.binormals[i],radius*.46*Math.sin(a)));}
        tube(par,cordMat,palette[j],p,radius*.61,spanCount,7,closed);}
    }
    const ropeColors=['#9d906d','#b2a27b','#8b8062'];
    ropePiece(eye,path,ropeColors,samples,loops,eyeRadius,true);
    const throat=new T.CatmullRomCurve3([V(-.032,.210,.001),V(-.009,.243,.001),V(-.004,.271,0),V(-.006,.305,-.003),V(-.008,.338,0)]);
    ropePiece(eye,throat,ropeColors,58,.96,.0179);
    // A tapered tucked end swells the throat; wet sailmaker's seizing is wrapped under load.
    tube(eye,cordMat,'#8d8162',[[.042,.195,.002],[.023,.224,.002],[.018,.245,.002],[.014,.265,.002],[.007,.282,.002]],.0127,32,7);
    for(const [start,len,r,turns] of [[.233,.062,.0254,17],[.300,.014,.0179,4]]){
      const p=[];for(let k=0;k<=turns*14;k++){const u=k/(turns*14),a=2.1+u*TAU*turns,d=.003*Math.sin(Math.PI*u);
        p.push(V(-.003+(r+d)*Math.cos(a),start+len*u,(r*.78+d)*Math.sin(a)));}
      tube(eye,cordMat,'#639881',p,.00215,turns*14,6);
    }
    tube(eye,cordMat,'#72a28d',[[.017,.236,.012],[.020,.250,.013],[.018,.274,.015],[.010,.298,.011],[.007,.304,.010]],.0025,28,6);
    // Replaceable green serving at the lower bight, with two dark binding rings.
    const part=[];for(let i=0;i<=48;i++){const t=.487+i/48*.086,at=path.getPointAt(t),a=TAU*(i/48*9),k=Math.round(t*samples);
      part.push(at.addScaledVector(frames.normals[k],eyeRadius*1.04*Math.cos(a)).addScaledVector(frames.binormals[k],eyeRadius*1.04*Math.sin(a)));}
    tube(eye,cordMat,'#547e6c',part,.0027,106,6);
    // Low bronze rubbing roller just seaward of the concrete lip. The bitt at the other end already exists.
    const rollY=-2.478,rollZ=13.507,guideX=-3.935,rr=.044,contact=rr+.0176;
    roller.position.set(guideX,rollY,rollZ);
    for(const x of [-.124,.124]){
      box(roller,iron,'#505a50',x,.005,-.071,.051,.020,.167);box(roller,iron,'#777c66',x,.008,-.027,.024,.044,.079);
      cyl(roller,iron,'#6d7364',x,.011,-.116,.010,.005,'y',16);cyl(roller,iron,'#a19b7d',x,.017,-.116,.0074,.009,'y',6);
      cyl(roller,iron,'#ae9b72',x,0,0,.017,.040,'x',8);
    }
    const spool=group(roller,'铜护索轮');lathe(spool,iron,'#ab8c60',[[.019,-.114],[.051,-.114],[.053,-.109],[.052,-.099],[.044,-.089],[.043,-.062],[.044,.062],[.044,.091],[.052,.100],[.053,.109],[.051,.114],[.019,.114]],42,V(),[0,0,-Math.PI*.5]);
    for(const x of [-.104,-.059,.065,.104])tor(spool,iron,'#7e7660',x,0,0,Math.abs(x)>.095?.052:.0435,.00125,'x',40);
    // One geometrically continuous lay via short repeated strand modules following the catenary.
    const former=group(new T.Group(),'工作缆股模板'),repeatLength=.122;
    {
      const line=new T.LineCurve3(V(0,0,0),V(0,repeatLength,0));ropePiece(former,line,ropeColors,14,1,eyeRadius);
    }
    let section;
    for(const [node,by] of bins)for(const [m,b] of by){
      const ge=own(finalize(b));if(node===former){section=ge;continue;}
      const o=new T.Mesh(ge,m);o.castShadow=o.receiveShadow=true;node.add(o);
    }
    for(const g of temps)g.dispose();temps.clear();bins.clear();
    const maxPieces=128,line=new T.InstancedMesh(section,cordMat,maxPieces);
    line.name='岸桩至绳眼的三股缆';line.instanceMatrix.setUsage(T.DynamicDrawUsage);line.castShadow=line.receiveShadow=true;line.frustumCulled=false;
    line.boundingBox=new T.Box3();line.boundingSphere=new T.Sphere();root.add(line);
    const neck=V(-.008,.338,0),mark=V(),handle=V(),a=V(),tip=V(),ctr=V(),side=V(),axis=V(),back=V(),east=V(),normal=V(),from=V(),to=V(),dy=V(),right=V(),cross=V(),ys=V(),sectionM=new T.Matrix4(),axisM=new T.Matrix4();
    const pts=Array.from({length:73},()=>V()),arc=new Float32Array(pts.length),pre=[0,.028,.061,.1,.15,.21,.29,.37,.444,.516,.60,.69,.77,.84,.91,.957,1];
    let paid=NaN,twist=0,disposed=false;
    function read(out,p){return out.set(p.x,p.y,p.z);}
    function updateLine(start,end,caught,fast){
      const arcStart=pts[16];arcStart.set(guideX,rollY+contact,rollZ);let n=0;
      // Before the edge, y is bounded by the slab at -2.49 m. The line then wraps the roller, outside the slab.
      for(const u of pre){pts[n].lerpVectors(start,arcStart,u);pts[n].y=Math.max(-2.469,pts[n].y-.049*Math.sin(Math.PI*u));n++;}
      const ddy=end.y-rollY,ddz=end.z-rollZ,ds=Math.hypot(ddy,ddz),angle=clamp(Math.atan2(ddz,ddy)-Math.acos(clamp(contact/Math.max(ds,contact),-1,1)),.08,Math.PI*.69);
      for(let i=1;i<=8;i++){const u=i/8,ph=angle*u;pts[n++].set(guideX,rollY+contact*Math.cos(ph),rollZ+contact*Math.sin(ph));}
      const exit=pts[n-1],span=Math.hypot(end.x-guideX,end.z-exit.z);
      const sag=Math.min(fast?.24:caught?.16:.080,span*(fast?.12:caught?.13:.20));
      for(let i=1;i<=48;i++){const u=i/48;pts[n].lerpVectors(exit,end,u);pts[n].y-=4*u*(1-u)*sag;n++;}
      arc[0]=0;for(let i=1;i<n;i++)arc[i]=arc[i-1]+pts[i].distanceTo(pts[i-1]);const len=arc[n-1];
      const count=clamp(Math.round(len/repeatLength),1,maxPieces);line.count=count;
      if(Number.isFinite(paid))twist+=(len-paid)/rr;paid=len;spool.rotation.x=twist%TAU;
      let idx=1;from.copy(start);line.boundingBox.makeEmpty().expandByPoint(start);
      right.set(1,0,0);
      for(let k=1;k<=count;k++){
        const s=len*k/count;while(idx<n-1&&arc[idx]<s)idx++;const u=clamp((s-arc[idx-1])/Math.max(.000001,arc[idx]-arc[idx-1]),0,1);
        to.lerpVectors(pts[idx-1],pts[idx],u);dy.subVectors(to,from);const d=dy.length();if(d<.000001)dy.set(0,1,0);else dy.multiplyScalar(1/d);
        side.copy(right).addScaledVector(dy,-right.dot(dy));if(side.lengthSq()<.001)side.set(0,0,1).addScaledVector(dy,-dy.z);side.normalize();
        right.copy(side);cross.crossVectors(side,dy).normalize();ys.copy(dy).multiplyScalar(d/repeatLength);
        sectionM.makeBasis(side,ys,cross).setPosition(from);line.setMatrixAt(k-1,sectionM);
        line.boundingBox.expandByPoint(to);from.copy(to);
      }
      line.boundingBox.expandByScalar(.025);line.boundingBox.getBoundingSphere(line.boundingSphere);line.instanceMatrix.needsUpdate=true;
    }
    const hang=new T.Quaternion(),dEye=V(),rolled=V(),cleat=V();
    // Roll the hook about its own shaft. The nose and butt stay on the player's points, while the real crook finds
    // the outside of the near rope strand. The closest point on each circular sweep has a closed-form bearing.
    function seatHook(weight){
      let best=Infinity,chosen=0;
      for(let k=0;k<eyeCenters.length;k++){
        dEye.copy(eyeCenters[k]).applyQuaternion(eye.quaternion).add(ctr).sub(tip);
        const az=dEye.dot(axis),a=dEye.dot(side),b=dEye.dot(back),rho=Math.hypot(a,b),phi=Math.atan2(b,a);
        for(const [x,y,z,r] of crook){
          const along=az-y,off=rho-Math.hypot(x,z),dist=Math.hypot(along,off),raw=phi-Math.atan2(z,x),rotation=Math.atan2(Math.sin(raw),Math.cos(raw));
          const loss=Math.abs(dist-(eyeRadius+r)*.68)+.004*(1-Math.cos(rotation))+.001*Math.abs(rotation);
          if(loss<best){best=loss;chosen=rotation;}
        }
      }
      const a=chosen*weight;rolled.copy(side).multiplyScalar(Math.cos(a)).addScaledVector(back,Math.sin(a));
      side.copy(rolled);back.crossVectors(side,axis).normalize();
    }
    const flatA=new T.Quaternion().setFromRotationMatrix(new T.Matrix4().makeBasis(V(0,0,1),V(1,0,0),V(0,1,0)));
    const flatB=new T.Quaternion().setFromRotationMatrix(new T.Matrix4().makeBasis(V(0,0,-1),V(-1,0,0),V(0,1,0)));
    function update(s){
      if(disposed)return;
      root.visible=!!s&&!!s.visible&&!!s.anchor&&!!s.eye;if(!root.visible)return;
      read(a,s.anchor);read(ctr,s.eye);eye.position.copy(ctr);const fast=!!s.fast;
      let lay=fast?1:0;
      if(!fast&&s.caught&&s.cleat&&s.tip){
        read(cleat,s.cleat);read(tip,s.tip);
        if(Math.hypot(ctr.x-cleat.x,ctr.z-cleat.z)<.020&&tip.distanceToSquared(ctr)>.00004)
          lay=clamp(1-(ctr.y-cleat.y)/.31,0,1);
      }
      eye.quaternion.copy(hang).slerp(a.x>=ctr.x?flatA:flatB,lay*lay*(3-2*lay));
      eye.updateWorldMatrix(true,false);mark.copy(neck).applyMatrix4(eye.matrixWorld);updateLine(a,mark,!!s.caught,fast);
      pole.visible=s.poleVisible!==false&&!!s.base&&!!s.tip&&!fast;if(!pole.visible)return;
      read(handle,s.base);read(tip,s.tip);axis.subVectors(tip,handle);const len=axis.length();
      if(len<.012){pole.visible=false;return;}axis.multiplyScalar(1/len);
      // Mouth is rolled outwards/upwards so the opening is visible from the deck as the socket enters the eye.
      east.crossVectors(axis,up);if(east.lengthSq()<.004)east.set(1,0,0).addScaledVector(axis,-axis.x);east.normalize();
      normal.copy(up).addScaledVector(axis,-axis.y);if(normal.lengthSq()<.001)normal.crossVectors(east,axis);normal.normalize();
      side.copy(east).multiplyScalar(.80).addScaledVector(normal,.60).normalize();back.crossVectors(side,axis).normalize();
      const d=tip.distanceTo(ctr),alignment=clamp(1-d/(s.caught?.18:.245),0,1);
      if(alignment>.01&&lay<.93)seatHook(alignment*alignment*(3-2*alignment)*(1-lay));
      axisM.makeBasis(side,axis,back);pole.position.copy(handle);pole.quaternion.setFromRotationMatrix(axisM);
      head.position.set(0,len,0);shaft.position.y=.003;shaft.scale.y=Math.max(.0001,len-.183);
      for(let i=0;i<2;i++)grips[i].position.y=len*(i?.43:.16);
    }
    root.visible=false;
    return {root,update,dispose(){if(disposed)return;disposed=true;root.removeFromParent();line.dispose();for(const r of owned)r.dispose();owned.clear();root.clear();}};
  }
  return {create};
})();
