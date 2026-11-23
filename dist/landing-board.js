// A pair of nested, open-draining aluminium extrusions pays out from the launch.
// The sill and its drop-pawl are bolted to the quay; the heel can pitch and yaw.
const TideLandingBoard=(()=>{
  'use strict';
  const socket={x:-3.16,y:-2.445,z:13.12};
  function create(scene,g){
    const T=THREE,persistent=[],geo=[],clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
    const root=new T.Group(),boat=new T.Group(),shore=new T.Group(),span=new T.Group(),tipSpan=new T.Group();
    root.name='艉舷 · 滑动登岸板';boat.name='艇上开口与出板器';shore.name='低码头 · 接板滚座';span.name='艉舷过桥 · 实际两端';
    tipSpan.name='跟随岸缘的折鼻';root.add(boat,shore,span,tipSpan);scene.add(root);
    let seed=1729781;const rand=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
    function coat(tread=false){
      const N=256,base=document.createElement('canvas');base.width=base.height=N;
      const ctl=document.createElement('canvas');ctl.width=ctl.height=N;
      const c=base.getContext('2d'),p=ctl.getContext('2d'),rgb=c.createImageData(N,N),orm=p.createImageData(N,N);
      for(let j=0;j<N;j++)for(let i=0;i<N;i++){
        const n=rand(),b=rand(),u=i*2*Math.PI/N,v=j*2*Math.PI/N;
        const cloud=(Math.sin(u*3+Math.sin(v*2))*.22+Math.cos(v*4+Math.sin(u*9))*.17);
        const streak=(Math.cos(v*31+Math.sin(u*2))*.40+Math.cos(v*78+.6*Math.cos(u*5))*.38);
        const v0=(tread?198:221)+32*cloud+2.5*streak+(n-.5)*(tread?36:19),r=4*(j*N+i);
        rgb.data[r]=v0+2;rgb.data[r+1]=v0+1;rgb.data[r+2]=v0-3;rgb.data[r+3]=255;
        orm.data[r]=128+25*(b-.5)+7*streak;orm.data[r+1]=(tread?175:150)+34*cloud+25*n;orm.data[r+2]=(tread?132:143)+20*b;orm.data[r+3]=255;
      }
      c.putImageData(rgb,0,0);p.putImageData(orm,0,0);
      for(let i=0;i<(tread?870:350);i++){
        const x=rand()*N,y=rand()*N,s=.5+rand()**3*(tread?14:11);
        c.strokeStyle=rand()<.6?'rgba(78,88,82,.21)':'rgba(255,247,215,.48)';
        c.lineWidth=.45+rand()*.8;c.beginPath();c.moveTo(x,y);c.lineTo(x+s,y+(rand()-.46)*s*.23);c.stroke();
      }
      if(tread){
        // Punched lozenges with a worn top edge, alternating tooling direction.
        for(let y=0;y<=256;y+=16)for(let j=-1;j<18;j++){
          const x=j*16+((y/16)%2)*8,dir=(j+y/16)%2?1:-1;
          for(const [o,col,w] of [[1.1,'rgba(74,82,74,.65)',2.85],[-.4,'rgba(227,223,196,.83)',2.05]]){
            c.strokeStyle=col;c.lineWidth=w;c.lineCap='round';c.beginPath();c.moveTo(x-3,y+dir*2+o);c.lineTo(x+3,y-dir*2+o);c.stroke();
          }
          p.strokeStyle='rgb(169,139,161)';p.lineWidth=2.35;p.beginPath();p.moveTo(x-3,y+dir*2);p.lineTo(x+3,y-dir*2);p.stroke();
        }
      }
      function texture(im,srgb){const t=new T.CanvasTexture(im);t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=4;if(srgb)t.colorSpace=T.SRGBColorSpace;persistent.push(t);return t;}
      const tex=texture(base,true),a=texture(ctl,false);
      const material=new T.MeshStandardMaterial({vertexColors:true,map:tex,bumpMap:a,bumpScale:tread?.004:.0023,roughnessMap:a,roughness:1,metalnessMap:a,metalness:tread?.82:.88});
      persistent.push(material);return material;
    }
    const metal=coat(),plate=coat(true);
    const ink={paint:'#435b58',deep:'#344943',void:'#253331',steel:'#809086',shine:'#b9c1b6',alloy:'#bac0b1',tread:'#a6af9e',rim:'#c5c9b6',rubber:'#34423d',brass:'#bca36d',ochre:'#b89656',oxide:'#856949',clamp:'#656e61'};
    const v=(x=0,y=0,z=0)=>new T.Vector3(x,y,z),Y=v(0,1,0),V=v(),N=v(),mat4=new T.Matrix4(),normalMat=new T.Matrix3(),col=new T.Color(),q=new T.Quaternion(),eul=new T.Euler();
    const boxG=new T.BoxGeometry(1,1,1),tubeG=new T.CylinderGeometry(1,1,1,14),pinG=new T.CylinderGeometry(1,1,1,8),nutG=new T.CylinderGeometry(1,1,1,6),ballG=new T.SphereGeometry(1,10,7),templates=[boxG,tubeG,pinG,nutG,ballG];
    function batch(){
      const p=[],n=[],color=[],uv=[],ix=[];
      function put(shape,x,y,z,w,h,d,tint,quat,preserveUV=false){
        mat4.compose(v(x,y,z),quat||q.identity(),v(w,h,d));normalMat.getNormalMatrix(mat4);
        const a=shape.attributes,off=p.length/3;col.set(tint);
        for(let i=0;i<a.position.count;i++){
          V.fromBufferAttribute(a.position,i).applyMatrix4(mat4);N.fromBufferAttribute(a.normal,i).applyNormalMatrix(normalMat);
          p.push(V.x,V.y,V.z);n.push(N.x,N.y,N.z);color.push(col.r,col.g,col.b);
          if(preserveUV)uv.push(a.uv.getX(i),a.uv.getY(i));
          else if(Math.abs(N.y)>.61)uv.push(V.x*2.5,V.z*2.5);
          else if(Math.abs(N.x)>.7)uv.push(V.z*2.5,V.y*2.5);
          else uv.push(V.x*2.5,V.y*2.5);
        }
        if(shape.index)for(const i of shape.index.array)ix.push(i+off);else for(let i=0;i<a.position.count;i++)ix.push(i+off);
      }
      function box(x,y,z,w,h,d,clr,rot){put(boxG,x,y,z,w,h,d,clr,rot?q.setFromEuler(eul.set(...rot)):null);}
      function sphere(x,y,z,w,h,d,clr){put(ballG,x,y,z,w,h,d,clr);}
      function rod(from,to,r,clr,shape=tubeG){
        const A=v(...from),B=v(...to),D=B.clone().sub(A),l=D.length();if(!l)return;
        q.setFromUnitVectors(Y,D.divideScalar(l));A.lerp(B,.5);put(shape,A.x,A.y,A.z,r,l,r,clr,q);
      }
      function nut(x,y,z,r,h,clr=ink.shine){put(nutG,x,y,z,r,h,r,clr);}
      function quad(P,dir,tint){
        let order=[0,1,2,0,2,3];const nor=v().subVectors(P[1],P[0]).cross(v().subVectors(P[2],P[0])).normalize();
        if(nor.dot(dir)<0){order=[0,2,1,0,3,2];nor.negate();}
        const off=p.length/3;col.set(tint);
        for(const s of P){p.push(s.x,s.y,s.z);n.push(nor.x,nor.y,nor.z);color.push(col.r,col.g,col.b);
          uv.push(Math.abs(nor.x)>.6?s.z*2.5:s.x*2.5,Math.abs(nor.y)>.65?s.z*2.5:s.y*2.5);
        }
        for(const i of order)ix.push(off+i);
      }
      function geometry(){
        const obj=new T.BufferGeometry(),f=(a,k)=>new T.Float32BufferAttribute(a,k);
        obj.setAttribute('position',f(p,3));obj.setAttribute('normal',f(n,3));obj.setAttribute('uv',f(uv,2));obj.setAttribute('color',f(color,3));obj.setIndex(ix);obj.computeBoundingSphere();geo.push(obj);return obj;
      }
      function flush(parent,label,mat=metal){
        const mesh=new T.Mesh(geometry(),mat);mesh.name=label;mesh.castShadow=mesh.receiveShadow=true;parent.add(mesh);return mesh;
      }
      return {box,sphere,rod,nut,quad,geometry,flush};
    }
    // Boat frame origin is the heel pin. Rest attitude is computed from the
    // same YXZ buoyancy basis as the actual gunwale, including before mooring.
    const foot=batch();
    for(const sx of [-1,1]){
      const x=sx*.365;
      foot.box(x,-.199,.156,.133,.039,.58,ink.paint);
      for(const z of [-.077,.381]){
        foot.nut(x,-.172,z,.016,.013);
        foot.box(x,-.109,z,.068,.117,.076,ink.deep);
        foot.rod([x,-.159,z],[x,-.034,z-.049],.023,ink.paint);
      }
      foot.box(x,-.047,.092,.061,.074,.444,ink.paint);
      foot.box(x,-.015,.092,.062,.009,.44,ink.oxide);
      foot.rod([sx*.315,-.039,.0],[sx*.404,-.039,.0],.042,ink.brass);
      foot.rod([sx*.402,-.039,.0],[sx*.414,-.039,.0],.026,ink.steel,nutG);
    }
    // Flush operating sill and a grated approach sole leading from the timber
    // to the hinge (rise .205 m). Two narrow cheek plates carry the hinge load.
    const heelZ=.69;
    for(const sx of [-1,1]){
      const x=sx*.328;
      const A=v(x,-.214,heelZ),B=v(x,-.015,.029),C=v(x,-.105,.028),D=v(x,-.215,heelZ);
      foot.quad([A,B,C,D],v(sx,0,0),ink.steel);
      foot.rod([x,-.187,heelZ-.08],[x,-.035,.101],.021,ink.shine);
    }
    foot.rod([-.348,-.041,.003],[.348,-.041,.003],.036,ink.steel);
    for(let i=0;i<9;i++){
      const z=.057+i*.073,y=-.019-(z-.031)*.299;
      foot.box(0,y,z,.615,.023,.063,i%3?ink.tread:ink.alloy,[.29,0,0]);
      for(const x of [-.243,.243])foot.nut(x,y+.014,z,.010,.007,ink.clamp);
    }
    // The starboard bracing tube and short over-centre, spring-returned feed
    // handle both stay outboard of the clear 0.64 m deck.
    foot.box(.484,-.20,.145,.275,.046,.36,ink.paint);
    for(const x of [.394,.564])for(const z of [.051,.243])foot.nut(x,-.171,z,.017,.019);
    foot.rod([.446,-.178,.166],[.474,.385,.091],.027,ink.paint);
    foot.rod([.571,-.177,.252],[.515,.353,.095],.022,ink.steel);
    foot.rod([.457,.346,.093],[.595,.346,.093],.051,ink.paint);
    foot.rod([.588,.346,.093],[.612,.346,.093],.029,ink.brass,nutG);
    foot.rod([.334,-.152,.237],[.354,.608,.151],.025,ink.paint);
    foot.rod([.354,.608,.151],[.339,.689,.143],.028,ink.steel);
    foot.rod([.337,.689,.143],[.141,.689,.143],.023,ink.steel);
    foot.rod([.301,.689,.143],[.160,.689,.143],.028,ink.rubber);
    for(let k=0;k<6;k++)foot.rod([.17+.022*k,.689,.143],[.173+.022*k,.689,.143],.030,ink.clamp);
    foot.flush(boat,'舷座、坡踏与靠手');
    const feed=new T.Group();feed.position.set(.51,.346,.093);boat.add(feed);
    const handle=batch();handle.rod([.006,0,0],[.041,.236,.012],.023,ink.brass);handle.rod([.041,.236,.012],[.094,.359,-.001],.017,ink.shine);
    handle.rod([.002,.359,-.001],[.166,.359,-.001],.020,ink.brass);handle.rod([.029,.359,-.001],[.156,.359,-.001],.026,ink.rubber);
    for(const z of [.044,.065,.086,.107,.128])handle.rod([z,.359,-.001],[z+.004,.359,-.001],.028,ink.clamp);
    handle.rod([-.021,.012,0],[.027,.012,0],.046,ink.brass);
    handle.flush(feed,'送料压把');
    const boatLeft=new T.Object3D(),boatRight=new T.Object3D();boatLeft.position.set(.228,.689,.143);boatRight.position.set(.097,.359,-.001);boat.add(boatLeft);feed.add(boatRight);
    const bed=batch(),up=v(0,1,0);
    function eyeRing(b,x,y,z,rx,rz,ri,rj,h,clr){
      const n=40,outer=[],inner=[],low=[];
      for(let j=0;j<=n;j++){const a=Math.PI*2*j/n,s=Math.sin(a),c=Math.cos(a);outer.push(v(x+rx*s,y,z+rz*c));inner.push(v(x+ri*s,y,z+rj*c));low.push(v(x+ri*s,y-h,z+rj*c));}
      for(let j=0;j<n;j++){
        b.quad([outer[j],outer[j+1],inner[j+1],inner[j]],up,clr);
        b.quad([inner[j],inner[j+1],low[j+1],low[j]],v(x-inner[j].x,0,z-inner[j].z),ink.oxide);
        const a=outer[j],c=outer[j+1];b.quad([a,c,v(c.x,y-h,c.z),v(a.x,y-h,a.z)],v(a.x-x,0,a.z-z),ink.clamp);
      }
    }
    // A shallow, dark cast countersink is visible inside the fixed circle
    // while the incoming plate is off target. A bronze tongue swings clear
    // until the operator drops its peg through BOTH holes.
    bed.rod([0,-.043,0],[0,-.041,0],.112,ink.void,tubeG);
    eyeRing(bed,0,-.021,0,.153,.166,.098,.106,.019,ink.brass);
    for(const sx of [-1,1]){
      const x=sx*.341;
      bed.box(x,-.026,.019,.102,.036,.307,ink.paint);
      bed.rod([sx*.323,-.011,-.121],[sx*.354,-.011,.152],.016,ink.clamp);
      bed.rod([sx*.324,-.009,.027],[sx*.390,-.009,.027],.035,ink.brass,pinG);
      for(const z of [-.100,.124])bed.nut(x,-.002,z,.012,.010,ink.shine);
    }
    bed.box(-.554,-.022,-.088,.281,.040,.251,ink.paint);
    for(const x of [-.65,-.46])for(const z of [-.172,-.004])bed.nut(x,.007,z,.014,.016);
    bed.rod([-.548,0,-.08],[-.541,.48,-.08],.043,ink.paint);
    bed.rod([-.641,.008,-.155],[-.541,.34,-.082],.020,ink.steel);
    bed.rod([-.548,.46,-.08],[-.453,.59,-.080],.024,ink.paint);
    bed.rod([-.508,.628,-.080],[-.373,.628,-.080],.023,ink.shine);
    bed.rod([-.49,.628,-.080],[-.38,.628,-.080],.026,ink.rubber);
    bed.rod([-.454,.59,-.080],[-.441,.628,-.080],.022,ink.steel);
    bed.rod([-.586,.406,-.14],[-.584,.406,-.015],.055,ink.brass);
    bed.box(-.586,.309,-.077,.108,.132,.095,ink.paint);
    bed.rod([-.60,.01,-.071],[-.60,.302,-.074],.012,ink.shine);
    // Low under-sill tie from the lock pedestal to the foot of the swing strap.
    bed.rod([-.56,.004,-.078],[-.375,-.001,-.078],.021,ink.clamp);
    bed.rod([-.375,-.016,-.078],[-.375,.051,-.078],.031,ink.brass);
    bed.flush(shore,'岸靴喇叭口、埋件与解锁靠手');
    const latch=new T.Group();latch.position.set(-.375,0,-.078);shore.add(latch);
    const keeper=batch();keeper.rod([0,.030,0],[.375,.041,.078],.021,ink.brass,pinG);
    keeper.rod([.251,.037,.052],[.374,.042,.078],.032,ink.clamp);
    keeper.rod([.375,.033,.078],[.375,.054,.078],.051,ink.brass);keeper.flush(latch,'岸侧回转销舌');
    const pinGrou=new T.Group();latch.add(pinGrou);pinGrou.position.set(.375,0,.078);
    const peg=batch();peg.rod([0,-.009,0],[0,.079,0],.025,ink.shine);peg.rod([0,.067,0],[0,.082,0],.039,ink.brass,pinG);peg.flush(pinGrou,'垂落岸销');
    const handLever=new T.Group();handLever.position.set(-.585,.406,-.080);shore.add(handLever);
    const lever=batch();lever.rod([0,0,0],[-.065,.170,0],.022,ink.brass,pinG);
    lever.rod([-.065,.17,0],[-.109,.268,0],.020,ink.steel);lever.rod([-.174,.268,0],[-.054,.268,0],.025,ink.rubber);
    for(let i=0;i<5;i++)lever.rod([-.163+.023*i,.268,0],[-.159+.023*i,.268,0],.027,ink.clamp);
    lever.flush(handLever,'钢销手柄');
    const shoreLeft=new T.Object3D(),shoreRight=new T.Object3D();shoreLeft.position.set(-.433,.628,-.08);shoreRight.position.set(-.107,.268,0);shore.add(shoreLeft);handLever.add(shoreRight);
    // Extruded open-bottom channels grow in visible length as each nested
    // leaf emerges from the feed rollers. Fastenings and tread pitch stay
    // full-size; the first partial tread disappears inside the real sill.
    function rails(w,h,label,owner=span){
      const b=batch(),half=w/2;
      for(const sx of [-1,1]){
        const x=sx*(half-.015);
        b.box(x,-h*.52,-.5,.020,h,1,ink.steel);
        b.box(sx*(half-.034),-h+.006,-.5,.054,.012,1,ink.clamp);
        b.box(sx*(half-.021),.000,-.5,.041,.010,1,ink.shine);
        b.box(sx*(half-.019),-.038,-.5,.023,.005,1,ink.oxide);
      }
      for(const x of [-.151,.151])b.box(x,-h*.58,-.5,.021,h*.68,1,ink.deep);
      return b.flush(owner,label);
    }
    const outerRails=rails(.64,.087,'外板牵引槽'),innerRails=rails(.605,.063,'内板折边槽');
    // Slat's local footprint is 1 m along Z before instancing. Author the UV
    // in real metres for a full 120-mm extrusion without stretching the grain.
    function treads(w,label,owner=span){
      const strip=new T.Shape(),d=.118,h=d*.5,x=w*.5,c=.007;
      strip.moveTo(-x+c,-h);strip.lineTo(-x,-h+c);strip.lineTo(-x,h-c);strip.lineTo(-x+c,h);
      strip.lineTo(x-c,h);strip.lineTo(x,h-c);strip.lineTo(x,-h+c);strip.lineTo(x-c,-h);strip.closePath();
      for(const s of [-1,1]){
        const ctr=s*(x-.081),r=.008,l=ctr-.024,t=ctr+.024,slot=new T.Path();
        slot.moveTo(l,-r);slot.lineTo(t,-r);slot.absarc(t,0,r,-Math.PI*.5,Math.PI*.5,false);
        slot.lineTo(l,r);slot.absarc(l,0,r,Math.PI*.5,Math.PI*1.5,false);slot.closePath();strip.holes.push(slot);
      }
      const shape=new T.ExtrudeGeometry(strip,{depth:.021,bevelEnabled:false,steps:1,curveSegments:4});
      geo.push(shape);shape.rotateX(-Math.PI*.5);shape.translate(0,-.021,0);shape.scale(1,1,1/d);
      const map=shape.attributes.uv,pos=shape.attributes.position,nor=shape.attributes.normal,shade=[],ids=[];
      for(let i=0;i<map.count;i++){
        const top=nor.getY(i)>.65,wall=Math.abs(nor.getY(i))<.5;
        col.set(top?ink.tread:wall?ink.steel:ink.clamp);shade.push(col.r,col.g,col.b);ids.push(i);
        map.setXY(i,pos.getX(i)*2.45,pos.getZ(i)*d*2.45);
      }
      shape.clearGroups();shape.setAttribute('color',new T.Float32BufferAttribute(shade,3));shape.setIndex(ids);shape.computeBoundingSphere();
      const mesh=new T.InstancedMesh(shape,plate,38);mesh.name=label;mesh.receiveShadow=mesh.castShadow=true;mesh.frustumCulled=false;mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);
      owner.add(mesh);persistent.push(mesh);return mesh;
    }
    const wide=treads(.601,'外板冲压防滑踏条'),narrow=treads(.573,'内板冲压防滑踏条');
    const toeRails=rails(.605,.054,'翻鼻轻合金底梁',tipSpan),toeTreads=treads(.573,'翻鼻开孔踏条',tipSpan);
    const hinge=batch();
    for(const x of [-.279,-.153,0,.153,.279]){
      const w=Math.abs(x)>.2?.054:.078;hinge.rod([x-w*.5,-.011,0],[x+w*.5,-.011,0],.018,ink.brass);
      hinge.box(x,-.011,-.043,w,.018,.069,ink.steel);
      if(Math.abs(x)>.2)hinge.nut(x,-.001,-.057,.007,.008,ink.clamp);
    }
    hinge.rod([-.313,-.011,0],[.313,-.011,0],.011,ink.steel,pinG);
    hinge.flush(tipSpan,'铰鼻的五节铜套与通销');
    const nose=new T.Group();tipSpan.add(nose);
    const shoe=batch();
    // Fork the toe cap around the plate eye. The centre remains a real hole
    // from above and from the shore operator's three-quarter sightline.
    eyeRing(shoe,0,.011,0,.128,.090,.071,.051,.022,ink.brass);
    for(const sx of [-1,1]){
      const x=sx*.205;
      shoe.box(x,-.006,.048,.155,.043,.085,ink.alloy);
      shoe.rod([sx*.133,-.012,.008],[sx*.276,-.012,.020],.019,ink.shine,pinG);
      shoe.box(sx*.281,-.026,.114,.035,.065,.20,ink.steel);
      shoe.nut(sx*.235,.018,.053,.012,.009,ink.clamp);
      shoe.box(sx*.15,.018,.054,.027,.003,.067,ink.ochre);
    }
    shoe.flush(nose,'板头铜色销眼与防撞折角');
    const collar=new T.Group();span.add(collar);const clip=batch();
    for(const sx of [-1,1]){
      clip.box(sx*.300,-.014,.023,.046,.055,.126,ink.brass);
      clip.rod([sx*.266,-.048,-.008],[sx*.335,-.048,-.008],.024,ink.brass);
      clip.nut(sx*.299,.013,.046,.010,.010);
    }
    clip.flush(collar,'嵌套板止挡和燕尾导轮');
    const roll=new T.Group();roll.position.set(0,-.040,-.024);boat.add(roll);
    const drum=batch();
    for(const sx of [-1,1]){
      drum.rod([sx*.304,0,0],[sx*.360,0,0],.046,ink.rubber);drum.rod([sx*.360,0,0],[sx*.377,0,0],.048,ink.brass);
      for(let j=0;j<8;j++){const an=j*Math.PI/4;drum.rod([sx*.363,.039*Math.cos(an),.039*Math.sin(an)],[sx*.378,.039*Math.cos(an),.039*Math.sin(an)],.004,ink.shine,pinG);}
    }
    drum.flush(roll,'随板走的压送轮');
    for(const ge of templates)ge.dispose();
    const direction=v(),wx=v(),wy=v(),wz=v(),tmpM=new T.Matrix4(),br=new T.Matrix4(),zr=new T.Quaternion(),ctr=v(),size=v();
    const handBuf={boat:[v(),v()],shore:[v(),v()]};
    let oldLength=-1,oldToe=-1,oldWide=-1,progress=0,lastTime=null,prevExtension=0;
    function run(mesh,from,to,y){
      const step=.122,gap=.005,walk=.0025;
      let n=0,right=to;
      while(right-from>walk&&n<38){
        const left=Math.max(from,right-step),clear=right-left;
        if(clear>gap+.003){
          ctr.set(0,y,-.5*(left+right));size.set(1,1,clear-gap);
          tmpM.compose(ctr,zr,size);mesh.setMatrixAt(n++,tmpM);
        }
        right-=step;
      }
      mesh.count=n;mesh.instanceMatrix.needsUpdate=true;
    }
    function update(game){
      if(disposed)return;
      const h=game.world.fenders.floatPose,input=TideBerthBoard.pose(game),s=game.fenders.board;
      const a=input.a,b=input.b,bc=input.across,sc=input.seat||socket;
      boat.rotation.set(h.pitch,h.yaw,h.roll,'YXZ');boat.position.set(a.x,a.y,a.z);
      shore.position.set(sc.x,sc.y,sc.z);shore.visible=true;
      const width=input.width||.64,lock=!!input.locked;
      const total=Math.hypot(b.x-a.x,b.y-a.y,b.z-a.z)||.001;
      const tail=Math.min(.46,total*.40),u=1-tail/total;
      const knee=input.knuckle||{x:a.x+(b.x-a.x)*u,y:a.y+(b.y-a.y)*u,z:a.z+(b.z-a.z)*u};
      function orient(node,first,last){
        node.position.set(first.x,first.y,first.z);
        direction.set(last.x-first.x,last.y-first.y,last.z-first.z);
        const length=Math.max(.00001,direction.length());direction.divideScalar(length);
        wx.set(bc.x,bc.y,bc.z);wx.addScaledVector(direction,-direction.dot(wx)).normalize();
        wz.copy(direction).multiplyScalar(-1);wy.crossVectors(wz,wx).normalize();
        br.makeBasis(wx,wy,wz);node.quaternion.setFromRotationMatrix(br);return length;
      }
      const L=orient(span,a,knee),toe=orient(tipSpan,knee,b);
      const len1=Math.min(L,.31+.51*L),toeEnd=Math.max(0,toe-.088);
      outerRails.scale.set(width/.64,1,len1);innerRails.position.z=-len1+.014;
      innerRails.scale.set(width/.64,1,Math.max(.003,L-len1+.01));
      innerRails.visible=L>len1+.009;
      toeRails.scale.set(width/.64,1,Math.max(.003,toe-.016));
      if(Math.abs(L-oldLength)>.00045||Math.abs(toe-oldToe)>.00045||oldWide!==width){
        run(wide,0,Math.min(len1,L-.019),-.003);
        run(narrow,Math.min(len1+.002,L-.019),Math.max(0,L-.019),-.011);
        run(toeTreads,Math.min(.018,toeEnd),toeEnd,-.009);
        oldLength=L;oldToe=toe;oldWide=width;wide.scale.x=narrow.scale.x=toeTreads.scale.x=width/.64;
      }
      nose.position.z=-toe;collar.position.z=-len1;collar.visible=L>len1+.048;
      span.visible=tipSpan.visible=boat.visible=true;
      const time=game.time||0,dt=lastTime===null?0:clamp(time-lastTime,0,.16);
      const force=clamp((input.extension-prevExtension)/(dt||1)*1.5,-1,1);
      if(lastTime===null||time<lastTime)progress=lock?1:0;
      else if(dt>0)progress+=(Number(lock)-progress)*(1-Math.exp(-dt*15));
      if(dt>0||lastTime===null){
        const angle=input.held?-.21-.28*force:.16,steer=s.aim||0;
        feed.rotation.x+=(angle-feed.rotation.x)*(lastTime===null?1:1-Math.exp(-dt*10));
        feed.rotation.z=.30*steer;roll.rotation.x=-input.extension*2.49/.046;
      }
      const trying=s.held?.includes('shore') ? .075 : 0,miss=s.cue==='board-knock'&&time<(s.until||-1)?Math.max(0,1-(time-(s.until-2.3))/.26):0;
      const lockAction=Math.max(progress,miss*.15+trying*(1-progress));
      handLever.rotation.z=-.61*lockAction;handLever.rotation.x=.21*lockAction;
      latch.rotation.y=-1.39*(1-clamp(progress*1.55,0,1));pinGrou.position.y=.087*(1-clamp((progress-.57)/.43,0,1));
      lastTime=time;prevExtension=input.extension;
    }
    function hands(kind,out){
      if(kind!=='boat'&&kind!=='shore')return null;
      out=out||handBuf[kind];const a=kind==='boat'?boatLeft:shoreLeft,b=kind==='boat'?boatRight:shoreRight;
      a.getWorldPosition(out[0]);b.getWorldPosition(out[1]);return out;
    }
    let disposed=false;update(g);
    return {update,hands,dispose(){
      if(disposed)return;disposed=true;root.removeFromParent();for(const item of geo)item.dispose();for(const item of persistent)item.dispose();
    }};
  }
  return {create};
})();
