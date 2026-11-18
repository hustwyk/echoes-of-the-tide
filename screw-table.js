// The childhood sound-effects table. Images and geometry are original procedural artwork.
// Table coordinates are metres; the board's local X and Z are the simulation's lane and forward axes.
const TideScrewTable=(()=>{
  const T=THREE,TAU=2*Math.PI,U=new T.Vector3(0,1,0),vec=(x=0,y=0,z=0)=>new T.Vector3(x,y,z);
  const white='#ffffff',zero=[0,0,0],one=[1,1,1],num=(a,b=0)=>Number.isFinite(a)?a:b;
  function create(scene){
    const root=new T.Group();root.name='1998 · 北岬的两颗螺丝';root.position.x=32;root.visible=false;scene.add(root);
    const ownSet=new Set(),own=o=>(ownSet.add(o),o),srcSet=new Set(),source=o=>(srcSet.add(o),o),batches=[],index=new Map(),toruses=new Map();
    const tx=new T.Object3D(),normalM=new T.Matrix3(),q=new T.Quaternion(),A=vec(),B=vec(),P=vec(),N=vec(),tint=new T.Color();
    let seed=1768341;function rand(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;}
    function blank(W,H){const c=document.createElement('canvas');c.width=W;c.height=H;return c;}
    function textured(c,color=true,wrap=false){
      const t=own(new T.CanvasTexture(c));if(color){if('colorSpace' in t)t.colorSpace=T.SRGBColorSpace;else t.encoding=T.sRGBEncoding;}
      if(wrap)t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=8;return t;
    }
    function atlas(w,h,draw,wrap=false){const c=blank(w,h);draw(c.getContext('2d'),w,h);return textured(c,true,wrap);}
    const grainCell=new Float32Array(257*257);for(let j=0;j<grainCell.length;j++)grainCell[j]=rand();
    function noise(x,y){
      const X=Math.floor(x),Y=Math.floor(y),i=X&255,j=Y&255,u=x-X,v=y-Y,s=u*u*(3-2*u),t=v*v*(3-2*v),a=j*257+i,b=((j+1)&255)*257+i;
      const m=grainCell[a]+(grainCell[j*257+((i+1)&255)]-grainCell[a])*s,n=grainCell[b]+(grainCell[((j+1)&255)*257+((i+1)&255)]-grainCell[b])*s;return m+(n-m)*t;
    }
    function wood(W,H,board){
      const c=blank(W,H),r=blank(W,H),n=blank(W,H),ctx=c.getContext('2d'),rc=r.getContext('2d'),nc=n.getContext('2d');
      const rgb=ctx.createImageData(W,H),rough=rc.createImageData(W,H),nm=nc.createImageData(W,H),bump=new Float32Array(W*H);
      const knots=board?[[.093,.368,.016,.054],[.873,.694,.026,.086],[.19,.907,.012,.043]]:[[.173,.151,.036,.106],[.655,.422,.042,.165],[.32,.769,.058,.158],[.867,.861,.028,.081]];
      for(let y=0;y<H;y++)for(let x=0;x<W;x++){
        const u=x/W,v=y/H,k=y*W+x,i=k*4;let routed=u+(.010+u*.013)*Math.sin(v*6.4+u*9)+.018*(noise(u*4,v*2.5)-.5),knot=0,eye=0;
        for(const [cx,cy,sx,sy] of knots){const dx=(u-cx)/sx,dy=(v-cy)/sy,d=dx*dx+dy*dy;
          if(d<17){const damp=Math.exp(-.27*d);routed+=(dx>0?1:-1)*.022*damp;const dist=Math.sqrt(d);knot+=Math.cos(19*dist)*damp;eye+=Math.exp(-2.9*d);}
        }
        const width=board?26:40,ring=routed*width+noise(u*7,v*3)*.93+noise(u*37,v*7)*.14+v*.53;
        const darkLine=Math.pow((Math.sin(TAU*ring)+1)*.5,7),fib=(noise(routed*(board?485:610),v*10)-.5),cloud=noise(u*4+31,v*7+18),fine=rand()-.5;
        const late=(.58+cloud*.63)*darkLine,offset=board?0:16*noise(u*26,v*8);
        const tone=(cloud-.50)*(board?23:38)-late*(board?7.4:18)+fib*(board?15:24)+knot*4-eye*(board?45:38)+fine*5+offset;
        const base=board?[193,157,108]:[147,111,76];
        rgb.data[i]=base[0]+tone;rgb.data[i+1]=base[1]+tone*.90;rgb.data[i+2]=base[2]+tone*.72;rgb.data[i+3]=255;
        bump[k]=.50-.15*late+.12*fib+.03*fine-.1*eye;
        const rr=(board?164:153)+.78*tone-27*noise(u*3+22,v*2+29);
        rough.data[i]=rough.data[i+1]=rough.data[i+2]=rr;rough.data[i+3]=255;
      }
      ctx.putImageData(rgb,0,0);rc.putImageData(rough,0,0);
      for(let y=0;y<H;y++)for(let x=0;x<W;x++){
        const i=y*W+x,k=i*4,dx=bump[y*W+Math.min(x+1,W-1)]-bump[y*W+Math.max(0,x-1)],dy=bump[Math.min(y+1,H-1)*W+x]-bump[Math.max(0,y-1)*W+x];
        nm.data[k]=128-dx*105;nm.data[k+1]=128+dy*105;nm.data[k+2]=253;nm.data[k+3]=255;
      }nc.putImageData(nm,0,0);
      for(let j=0;j<(board?390:1330);j++){
        const x=rand()*W,y=rand()*H,len=rand()**2*(board?34:67)+2;ctx.strokeStyle=rand()>.5?'rgba(243,219,171,.22)':'rgba(76,56,39,.17)';
        ctx.lineWidth=.4+.7*rand();ctx.beginPath();ctx.moveTo(x,y);ctx.quadraticCurveTo(x+len*.38,y-len*.06,x+len,y+len*(rand()-.48)*.26);ctx.stroke();
      }
      if(board){
        // Faded pencil measuring ticks, a date and two well-thumbed starting dots. Nothing separates the two live brass pins.
        ctx.save();ctx.globalAlpha=.62;ctx.strokeStyle='#5f625b';ctx.lineWidth=.9;ctx.translate(.091*W,.078*H);ctx.rotate(-.047);
        ctx.font='italic 18px serif';ctx.fillStyle='#4e5862';ctx.fillText('98. 7. 16',0,0);
        ctx.beginPath();ctx.moveTo(-3,5);ctx.quadraticCurveTo(40,7,111,3);ctx.stroke();ctx.restore();
        ctx.save();ctx.translate(W*.787,H*.090);ctx.rotate(.086);ctx.font='19px serif';ctx.fillStyle='rgba(66,80,83,.74)';ctx.fillText('十 秒',0,0);ctx.restore();
        for(let j=0;j<13;j++){const yy=H*(.215+j*.036);ctx.strokeStyle='rgba(62,64,57,.59)';ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(W*.071,yy);ctx.lineTo(W*(j%3?.089:.116),yy+2*rand()-1);ctx.stroke();}
        ctx.save();ctx.translate(W*.826,H*.863);ctx.rotate(-.06);ctx.fillStyle='rgba(84,83,67,.55)';ctx.font='italic 16px serif';ctx.fillText('14 ½',0,0);ctx.restore();
        for(const [u,v] of [[.759,.164],[.204,.864]]){
          ctx.strokeStyle='rgba(70,91,95,.48)';ctx.lineWidth=1.2;ctx.beginPath();ctx.arc(u*W,v*H,3.5,.4,5.9);ctx.stroke();
        }
        for(let i=0;i<36;i++){
          const x=rand()*W,y=(rand()>.54?rand()*.055:1-rand()*.06)*H;ctx.strokeStyle='rgba(87,68,49,.36)';ctx.lineWidth=.6+rand();ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+2+rand()*8,y+rand()*7);ctx.stroke();
        }
      }else{
        // Ghost outlines of an enamel cup and dried glue are part of the finish.
        for(const [x,y,R] of [[W*.31,H*.24,31],[W*.72,H*.62,51]]){
          for(let i=0;i<53;i++){const s=rand()*TAU;ctx.lineWidth=1+rand()*2.1;ctx.strokeStyle='rgba(65,49,35,.10)';ctx.beginPath();ctx.arc(x,y,R+rand()*3-1.5,s,s+rand()*.37);ctx.stroke();}
        }
      }
      return [textured(c,true,!board),textured(n,false,!board),textured(r,false,!board)];
    }
    const benchWood=wood(512,640,false),birchWood=wood(512,768,true);
    function woodMat(m){const mat=own(new T.MeshPhysicalMaterial({map:m[0],normalMap:m[1],roughnessMap:m[2],roughness:.88,vertexColors:true,metalness:.005,clearcoat:.19,clearcoatRoughness:.47}));mat.normalScale.set(.40,.40);return mat;}
    const oak=woodMat(benchWood),birch=woodMat(birchWood);
    const brushed=atlas(256,256,(c,W,H)=>{
      c.fillStyle='#e2ded0';c.fillRect(0,0,W,H);for(let j=0;j<9500;j++){c.fillStyle=rand()<.46?'rgba(102,99,81,.19)':'rgba(252,244,219,.38)';c.fillRect(rand()*W,rand()*H,1+26*rand()**4,.45+rand()*.76);}
    },true);
    const metal=own(new T.MeshStandardMaterial({vertexColors:true,map:brushed,roughness:.35,metalness:.68}));
    const coat=own(new T.MeshStandardMaterial({vertexColors:true,map:brushed,roughness:.55,metalness:.19}));
    const soft=own(new T.MeshStandardMaterial({vertexColors:true,roughness:.76,metalness:.012}));
    const ash='#bf9764',edge='#b0aea1',ivory='#ded9c4',brass='#c3a466',iron='#676c63',teal='#567c73',ochre='#b78d5b',dark='#373c39';
    const cube=source(new T.BoxGeometry(1,1,1)),cylinder=source(new T.CylinderGeometry(1,1,1,22)),hex=source(new T.CylinderGeometry(1,1,1,6)),orb=source(new T.SphereGeometry(1,16,10));
    function group(parent,name,x=0,y=0,z=0){const node=new T.Group();node.name=name;node.position.set(x,y,z);parent.add(node);const g={node,sets:new Map()};batches.push(g);return g;}
    function cast(g,geo,mat,color,at,sz=one,rot=zero,quat=null,proj=null){
      let ar=index.get(geo);if(!ar){ar=(geo.index?source(geo.toNonIndexed()):geo).attributes;index.set(geo,ar);}
      let dst=g.sets.get(mat);if(!dst){dst={p:[],n:[],c:[],uv:[]};g.sets.set(mat,dst);}
      tx.position.set(...at);tx.scale.set(...sz);if(quat)tx.quaternion.copy(quat);else tx.rotation.set(...rot);tx.updateMatrix();normalM.getNormalMatrix(tx.matrix);tint.set(color);
      for(let i=0;i<ar.position.count;i++){
        P.fromBufferAttribute(ar.position,i).applyMatrix4(tx.matrix);N.fromBufferAttribute(ar.normal,i).applyNormalMatrix(normalM);dst.p.push(P.x,P.y,P.z);dst.n.push(N.x,N.y,N.z);dst.c.push(tint.r,tint.g,tint.b);
        if(proj==='board')dst.uv.push(.5+P.x/.390,.5-P.z/.56);
        else if(proj==='bench')dst.uv.push(.55+P.z*.66+(Math.abs(N.y)<.52?P.y*.85:0),.62+P.x*.53);
        else if(proj==='uv'&&ar.uv)dst.uv.push(ar.uv.getX(i),ar.uv.getY(i));
        else if(Math.abs(N.y)>.67)dst.uv.push(P.x*2.9,P.z*2.9);else if(Math.abs(N.x)>.67)dst.uv.push(P.z*2.9,P.y*2.9);else dst.uv.push(P.x*2.9,P.y*2.9);
      }
    }
    function box(g,x,y,z,w,h,d,color,mat=metal,rx=0,ry=0,rz=0,proj){cast(g,cube,mat,color,[x,y,z],[w,h,d],[rx,ry,rz],null,proj);}
    function disc(g,x,y,z,r,d,c,axis='y',mat=metal,ge=cylinder){cast(g,ge,mat,c,[x,y,z],[r,d,r],axis==='x'?[0,0,-Math.PI/2]:axis==='z'?[Math.PI/2,0,0]:zero);}
    function ring(g,x,y,z,r,t,c,axis='z',mat=metal){
      const k=r+','+t;if(!toruses.has(k))toruses.set(k,source(new T.TorusGeometry(r,t,7,r>.058?48:28)));
      cast(g,toruses.get(k),mat,c,[x,y,z],one,axis==='y'?[Math.PI/2,0,0]:axis==='x'?[0,Math.PI*.5,0]:zero);
    }
    function rod(g,f,t,r,c,mat=metal,wd=null){
      A.set(...f);B.set(...t).sub(A);const L=B.length();q.setFromUnitVectors(U,B.normalize());A.addScaledVector(B,L*.5);
      cast(g,wd?cube:hex,mat,c,A.toArray(),[wd||r,L,r],zero,q);
    }
    function hose(g,points,r,color,mat=metal,n=18){
      cast(g,source(new T.TubeGeometry(new T.CatmullRomCurve3(points.map(x=>vec(...x))),n,r,7,false)),mat,color,zero);
    }
    function screwHead(g,x,y,z,r,c,heading=0){
      disc(g,x,y,z,r,.0026,c,'y',metal);box(g,x,y+.00148,z,r*1.62,.00035,r*.21,dark,soft,0,heading);
    }
    function seal(g){for(const [mat,k] of g.sets){
      const ge=own(new T.BufferGeometry());for(const [key,arr,dim] of [['position',k.p,3],['normal',k.n,3],['color',k.c,3],['uv',k.uv,2]])ge.setAttribute(key,new T.Float32BufferAttribute(arr,dim));ge.computeBoundingSphere();
      const m=new T.Mesh(ge,mat);m.castShadow=m.receiveShadow=true;g.node.add(m);
    }g.sets.clear();}
    const bench=group(root,'儿童工作桌'),deck=group(root,'活动夹板',0,.87,0),tin=group(root,'北岬海盐饼干小铁听'),under=group(root,'旧折页及柔性支点');
    const Ntop=8,boardW=1.6,boardD=1.65;
    for(let j=0;j<Ntop;j++){
      const dz=boardD/Ntop,z=-boardD*.5+(j+.5)*dz;
      box(bench,0,.617,z,boardW,.046,dz-.0018,['#dbd0b4','#d9d4c5','#cfcab8','#d5cfc0','#d7c5ab'][j%5],oak,0,0,0,'bench');
      for(const x of [-.738,.736])screwHead(bench,x,.640,z,.0055,j%2?iron:ochre,j*1.71+x);
    }
    for(const x of [-.717,.718])for(const z of [-.721,.723]){
      box(bench,x,.317,z,.066,.571,.068,ash,oak);box(bench,x,.033,z,.072,.047,.073,'#6c6a59',soft); 
      for(const h of [.473,.542])disc(bench,x+Math.sign(x)*.036,h,z,.0055,.004,bronzeColor(),'x',metal,hex);
    }
    function bronzeColor(){return '#947856';}
    for(const z of [-.724,.723]){box(bench,0,.541,z,1.49,.107,.045,ash,oak);box(bench,0,.245,z,1.44,.043,.035,ash,oak);}
    for(const x of [-.719,.717])box(bench,x,.536,0,.047,.12,1.46,ash,oak);
    // Two short legs and a loose universal-joint hinge support the board above the tin.
    box(under,0,.652,0,.142,.022,.118,'#ba925f',oak);
    for(const z of [-.047,.047]){box(under,0,.727,z,.097,.134,.017,'#ba9364',oak);for(const x of [-.034,.034])screwHead(under,x,.663,z,.0043,iron,.1);}
    for(const x of [-.050,.050]){box(under,x,.801,0,.012,.046,.066,iron);disc(under,x,.820,0,.013,.020,brass,'x');}
    cast(under,orb,metal,iron,[0,.834,0],[.029,.027,.029]);
    box(deck,0,-.014,0,.390,.027,.56,'#c79e69',coat);
    // Exposed laminated birch edges below the drawing face; the top follows the game's projected plane exactly.
    for(let k=0;k<6;k++)box(deck,0,-.027+k*.00395,0,.3905,.0021,.5602,k%2?'#aa8050':'#d4b27d',coat);
    box(deck,0,-.00185,0,.3895,.0037,.5595,white,birch,0,0,0,'board');
    for(const sign of [-1,1]){
      const x=sign*.191;
      box(deck,x,.0048,0,.008,.0096,.547,sign>0?'#be9f6c':'#bd9868',coat);
      for(const z of [-.240,.247]){
        screwHead(deck,x,.0107,z,.0022,'#a29169',z*31);box(deck,x,-.0011,z,.010,.002,.025,'#b2986e',metal);
      }
      // One staple holds the threadbare binding, outside the rolling lane.
      const z=-.176;hose(deck,[[x-.001,.008,z-.005],[x+.001,.0114,z-.005],[x+.001,.0114,z+.005],[x-.001,.0078,z+.005]],.00077,'#b2b2a4',metal,9);
    }
    for(const [x,z] of [[-.058,-.045],[.054,.122]]){
      disc(deck,x,.0024,z,.014,.0048,'#92744d');disc(deck,x,.0054,z,.0129,.0054,brass);
      cast(deck,orb,metal,'#bca071',[x,.0074,z],[.0128,.0044,.0128]);
      box(deck,x,.0113,z,.013,.00045,.0020,'#6b6758',soft,0,.40);
    }
    // Real hinge knuckles and countersunk screws appear beneath the short plywood sheet.
    for(const sign of [-1,1]){
      box(deck,sign*.036,-.032,0,.064,.008,.066,iron);
      for(const z of [-.022,.021])disc(deck,sign*.053,-.036,z,.0042,.003,brass);
    }
    for(let j=-2;j<=2;j++)disc(deck,j*.018,-.044,0,.009,.015,j%2?bronzeColor():iron,'x');
    function outline(w,d,r,k=7){
      const o=[];for(const [cx,cz,s] of [[w-r,-d+r,-.5],[w-r,d-r,0],[-w+r,d-r,.5],[-w+r,-d+r,1]])for(let j=0;j<=k;j++){
        const a=(s+j*.5/k)*Math.PI;o.push([cx+r*Math.cos(a),cz+r*Math.sin(a)]);
      }return o;
    }
    // Rolled edges have a real undercut and folded seam. The tin's join is visible on the narrow side.
    function loft(rings,inside=false,cap=false){
      const pts=rings.map(([w,d,r])=>outline(w,d,r)),K=pts[0].length,pos=[],uv=[],lengths=[0];let perimeter=0;
      for(let j=0;j<K;j++){const a=pts[0][j],b=pts[0][(j+1)%K];perimeter+=Math.hypot(a[0]-b[0],a[1]-b[1]);lengths.push(perimeter);}
      const emit=(v,t)=>{pos.push(...v);uv.push(...t);};
      function tri(A,B,C,uvA,uvB,uvC){if(inside){emit(A,uvA);emit(C,uvC);emit(B,uvB);}else{emit(A,uvA);emit(B,uvB);emit(C,uvC);}}
      const at=(j,i)=>[pts[i][j][0],rings[i][3],pts[i][j][1]];
      for(let i=1;i<rings.length;i++)for(let j=0;j<K;j++){
        const n=(j+1)%K,lo=i-1,hi=i,ulen=1-lengths[j]/perimeter,unext=1-lengths[j+1]/perimeter,v0=lo/(rings.length-1),v1=hi/(rings.length-1);
        const a=at(j,lo),b=at(j,hi),c=at(n,hi),d=at(n,lo);
        tri(a,b,c,[ulen,v0],[ulen,v1],[unext,v1]);tri(a,c,d,[ulen,v0],[unext,v1],[unext,v0]);
      }
      if(cap){const i=rings.length-1,w=rings[i][0],d=rings[i][1],y=rings[i][3];for(let j=0;j<K;j++){const a=at(j,i),b=at((j+1)%K,i);
        tri([0,y,0],b,a,[.5,.5],[.5+b[0]/(2*w),.5-b[2]/(2*d)],[.5+a[0]/(2*w),.5-a[2]/(2*d)]);
      }}
      const ge=source(new T.BufferGeometry());ge.setAttribute('position',new T.Float32BufferAttribute(pos,3));ge.setAttribute('uv',new T.Float32BufferAttribute(uv,2));ge.computeVertexNormals();return ge;
    }
    function paperSpecks(c,W,H,n){
      for(let j=0;j<n;j++){const x=rand()*W,y=rand()*H;c.fillStyle=rand()<.46?'rgba(224,210,164,.51)':'rgba(72,66,50,.34)';c.fillRect(x,y,.5+rand()**3*7,.55+rand()**2*2.4);}
    }
    function lighthouse(c,x,y,scale){
      c.save();c.translate(x,y);c.scale(scale,scale);c.fillStyle='#e3ca92';c.strokeStyle='#e3ca92';c.lineWidth=2;
      c.beginPath();c.moveTo(-9,24);c.lineTo(-5,-12);c.lineTo(5,-12);c.lineTo(9,24);c.closePath();c.fill();c.strokeRect(-6,-24,12,12);c.fillRect(-8,-13,16,3);
      c.beginPath();c.moveTo(-9,-24);c.lineTo(0,-33);c.lineTo(9,-24);c.closePath();c.fill();
      c.beginPath();c.moveTo(-34,29);c.quadraticCurveTo(-18,13,-3,22);c.quadraticCurveTo(15,14,37,29);c.stroke();
      c.fillStyle='#48736b';c.fillRect(-2,12,4,7);c.restore();
    }
    const tinPrint=atlas(1024,250,(c,W,H)=>{
      const grd=c.createLinearGradient(0,0,0,H);grd.addColorStop(0,'#476e67');grd.addColorStop(.3,'#678a76');grd.addColorStop(.72,'#557d73');grd.addColorStop(1,'#4e6c61');
      c.fillStyle=grd;c.fillRect(0,0,W,H);c.fillStyle='#cfb67e';c.fillRect(0,17,W,4);c.fillRect(0,H-29,W,3);c.fillStyle='#b68f65';c.fillRect(0,H-22,W,8);
      for(const x of [105,605]){
        lighthouse(c,x,H*.54,1.7);c.fillStyle='#dfd4ad';c.font='bold 45px serif';c.fillText('北 岬',x+71,116);c.font='28px serif';c.fillText('海盐饼干',x+62,163);
      }
      for(let i=0;i<7;i++){
        c.beginPath();c.strokeStyle='rgba(214,199,151,.55)';c.lineWidth=1.2;
        for(let x=0;x<W;x+=4){const y=183+i*3+3.2*Math.sin(x*.04+i*.56);if(x)c.lineTo(x,y);else c.moveTo(x,y);}c.stroke();
      }paperSpecks(c,W,H,5400);
    });
    const inkTin=own(new T.MeshStandardMaterial({vertexColors:true,map:tinPrint,roughness:.43,metalness:.39}));
    const interior=atlas(512,512,(c,W,H)=>{
      c.fillStyle='#c3bb9e';c.fillRect(0,0,W,H);
      for(let i=0;i<3400;i++){
        const x=rand()*W,y=rand()*H;c.strokeStyle=rand()>.5?'rgba(101,99,81,.23)':'rgba(247,231,192,.40)';c.lineWidth=.35+rand()*.64;const l=2+rand()**3*53;
        c.beginPath();c.moveTo(x,y);c.quadraticCurveTo(x+l*.60,y-1,x+l,y+l*(rand()-.6)*.18);c.stroke();
      }c.save();c.translate(W*.38,H*.65);c.rotate(-.12);c.strokeStyle='rgba(89,87,69,.46)';c.lineWidth=2;c.beginPath();c.moveTo(2,12);c.lineTo(20,-1);c.lineTo(17,16);c.lineTo(29,12);c.stroke();c.restore();
    });
    const tinFloor=own(new T.MeshStandardMaterial({vertexColors:true,map:interior,roughness:.42,metalness:.49}));
    function casing(g,rows,m,c=white,ins=false,cap=false){cast(g,loft(rows,ins,cap),m,c,zero,one,zero,null,'uv');}
    casing(tin,[[.061,.051,.010,.001],[.065,.055,.013,.004],[.0653,.0553,.014,.007]],metal,iron);
    casing(tin,[[.0647,.0547,.014,.008],[.0666,.0566,.015,.0572]],inkTin);
    casing(tin,[[.0639,.0539,.013,.011],[.0640,.0540,.013,.064]],metal,'#b6b7a3',true);
    casing(tin,[[.0639,.0539,.013,.010],[.0639,.0539,.013,.011]],tinFloor,white,false,true);
    casing(tin,[[.0666,.0566,.015,.055],[.0675,.0575,.015,.058],[.0679,.0579,.015,.0615],[.0669,.0569,.014,.0645],[.0653,.0553,.014,.065],[.064,.054,.013,.0637],[.064,.054,.013,.060]],metal,'#c3b18a');
    const baseTrace=outline(.056,.047,.009);for(let j=0;j<baseTrace.length;j++){
      const a=baseTrace[j],b=baseTrace[(j+1)%baseTrace.length];rod(tin,[a[0],.0116,a[1]],[b[0],.0116,b[1]],.0009,'#a7a38e');
    }
    // Thumb tabs are outside the true catch aperture.
    for(const s of [-1,1]){
      box(tin,s*.067,.046,0,.0022,.018,.036,teal,coat);
      hose(tin,[[s*.067,.048,-.016],[s*.078,.049,-.017],[s*.083,.049,-.010],[s*.083,.049,.011],[s*.078,.049,.017],[s*.067,.048,.016]],.0024,brass,metal,13);
    }
    const lidDesign=atlas(768,640,(c,W,H)=>{
      c.fillStyle='#688a79';c.fillRect(0,0,W,H);const ros=(x,y,rx,ry)=>{c.beginPath();c.ellipse(x,y,rx,ry,0,0,TAU);c.stroke();};
      c.strokeStyle='#b09465';c.lineWidth=16;c.strokeRect(20,20,W-40,H-40);c.strokeStyle='#dbc69a';c.lineWidth=4;c.strokeRect(43,43,W-86,H-86);
      c.strokeStyle='#cbb788';c.lineWidth=9;ros(W*.5,H*.51,W*.376,H*.335);c.lineWidth=2.5;ros(W*.5,H*.51,W*.362,H*.319);
      c.save();c.translate(W*.5,H*.28);lighthouse(c,0,0,1.14);c.restore();
      c.textAlign='center';c.fillStyle='#ede0b8';c.font='bold 98px serif';c.fillText('北 岬',W*.5,H*.53);
      c.fillStyle='#dec794';c.font='bold 37px serif';c.fillText('海 盐 饼 干',W*.5,H*.66);c.font='bold 17px monospace';c.fillText('1998',W*.5,H*.73);
      for(const x of [76,W-76])for(const y of [76,H-76]){
        c.strokeStyle='#d8c18c';c.lineWidth=3;ros(x,y,18,18);ros(x,y,7,7);
      }
      paperSpecks(c,W,H,19800);
    });
    const lidInk=own(new T.MeshStandardMaterial({map:lidDesign,vertexColors:true,roughness:.46,metalness:.27}));
    const lid=group(bench.node,'斜靠的饼听盖',-.446,.705,.277);lid.node.rotation.set(1.05,-.22,.08,'YXZ');
    // A closed, separate lid leans against the edge of the instruction card with its original lithography facing the bench.
    casing(lid,[[.0683,.0584,.015,-.004],[.0685,.0585,.015,.0046],[.067,.0573,.014,.007]],metal,teal);
    casing(lid,[[.0669,.0570,.014,.0069],[.065,.055,.013,.0080]],lidInk,white,false,true);
    for(const s of [-1,1]){barSupport(s);}
    function barSupport(s){rod(bench,[-.446+s*.028,.642,.228],[-.446+s*.028,.712,.251],.0037,'#8c8164');}
    // Beside the board, a low field microphone on a bent table clamp points toward the catch. A cloth lead leaves the children's hands free.
    const mic=group(bench.node,'桌面拾音话筒',-.354,.640,-.096);
    disc(mic,0,.004,0,.052,.008,'#5c655b');disc(mic,0,.011,0,.043,.012,'#828375');
    disc(mic,0,.051,0,.008,.076,brass);disc(mic,0,.032,0,.013,.018,iron);
    for(const x of [-.024,.024]){
      rod(mic,[x*.45,.081,0],[x,.119,.002],.0042,iron);
      disc(mic,x,.123,.002,.007,.007,brass,'x',metal,hex);
    }
    const capsule=group(mic.node,'穿孔拾音网罩',0,.124,0);capsule.node.rotation.set(0,1.04,-.08,'YXZ');
    const screen=atlas(256,168,(c,W,H)=>{
      c.fillStyle='#8b9086';c.fillRect(0,0,W,H);for(let j=0;j<=19;j++)for(let i=-1;i<=27;i++){
        const x=(i+(j%2)*.5)*10,y=j*9;c.fillStyle='#b6b7a8';c.beginPath();c.ellipse(x,y+.8,2.5,2.55,.23,0,TAU);c.fill();c.fillStyle='#404b45';c.beginPath();c.ellipse(x,y-.25,2.5,2.25,.23,0,TAU);c.fill();
      }
    },true);
    const meshMat=own(new T.MeshStandardMaterial({map:screen,vertexColors:true,metalness:.53,roughness:.42}));
    disc(capsule,0,0,-.025,.018,.078,'#515f57','z',coat);
    for(const z of [-.066,-.044,-.014])disc(capsule,0,0,z,.019,.004,bronzeColor(),'z');
    cast(capsule,orb,meshMat,white,[0,0,.030],[.026,.026,.031],zero,null,'uv');
    for(const z of [.003,.012])disc(capsule,0,0,z,.024,.0034,edge,'z');
    for(let i=0;i<3;i++)box(capsule,0,(i-1)*.0078,.0595,.031-(i===1?0:.003),.0012,.0015,'#999f91');
    hose(bench,[[-.398,.763,-.139],[-.417,.741,-.151],[-.425,.672,-.130],[-.462,.645,-.078],[-.502,.644,-.124],[-.551,.644,-.274],[-.669,.643,-.460],[-.795,.638,-.468],[-.819,.562,-.466],[-.821,.463,-.426]],.0028,'#423e36',soft,39);
    // The spare nails and pencil sit by the bench edge, away from the passing board and the receiver's path.
    const supplies=group(bench.node,'备用零件',.576,.640,-.569);supplies.node.rotation.y=.08;
    box(supplies,0,.004,0,.144,.007,.095,'#b09d73',coat);
    for(const s of [-1,1]){box(supplies,s*.073,.013,0,.003,.021,.096,'#9b8d70');box(supplies,0,.013,s*.048,.145,.021,.003,'#a69a75');}
    for(let j=0;j<3;j++)ring(supplies,-.035+j*.021,.010,.014+Math.sin(j)*.013,.007,.0012,'#9c9b89','y');
    const pencil=group(bench.node,'削短的青铅笔',-.392,.647,-.411);pencil.node.rotation.y=.73;
    disc(pencil,0,0,0,.0049,.119,'#517473','x',coat,hex);
    cast(pencil,source(new T.ConeGeometry(.0049,.016,6)),coat,'#d8b987',[-.067,0,0],one,[0,0,Math.PI/2]);cast(pencil,source(new T.ConeGeometry(.0015,.004,6)),soft,dark,[-.0768,0,0],one,[0,0,Math.PI/2]);
    disc(pencil,.061,0,0,.005,.009,brass,'x');disc(pencil,.069,0,0,.0046,.009,'#ad7364','x',soft);
    // The crest has three distinct flanks. It is a single advancing helix, not a stack of washers.
    function threadForm(length,core,crest,turns){
      const pos=[],uv=[],start=-.0161,steps=Math.ceil(turns*17),pitch=length/turns;
      function pt(i,j){
        const u=i/steps,a=TAU*turns*u,ax=start+u*length+[-.44,-.11,.04,.42][j]*pitch,taper=Math.min(1,.16+u*11,(1-u)*16+.38);
        const R=core+([0,.92,1,0][j])*(crest-core)*taper;
        return [ax,R*Math.cos(a),R*Math.sin(a)];
      }
      for(let i=0;i<steps;i++)for(let j=0;j<3;j++){
        const A=pt(i,j),B=pt(i+1,j),C=pt(i+1,j+1),D=pt(i,j+1);
        pos.push(...A,...B,...C,...A,...C,...D);uv.push(i/steps,j/3,(i+1)/steps,j/3,(i+1)/steps,(j+1)/3,i/steps,j/3,(i+1)/steps,(j+1)/3,i/steps,(j+1)/3);
      }
      const g=source(new T.BufferGeometry());g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.computeVertexNormals();return g;
    }
    const raisedThread=threadForm(.0256,.0034,.00535,8.75),headRadius=.0093,headSlot=.00109;
    const toolSteel=own(new T.MeshStandardMaterial({vertexColors:true,map:brushed,roughness:.39,metalness:.47}));
    const cutMetal=own(new T.MeshStandardMaterial({vertexColors:true,map:brushed,roughness:.29,metalness:.48}));
    function halfHead(lower){
      const r=headRadius,d=Math.asin(headSlot/r),a0=lower?Math.PI+d:d,a1=lower?TAU-d:Math.PI-d,sh=new T.Shape();
      sh.absarc(0,0,r,a0,a1,false);sh.closePath();return source(new T.ExtrudeGeometry(sh,{depth:.00135,bevelEnabled:true,bevelSize:.00033,bevelThickness:.00025,bevelSegments:2,curveSegments:10}));
    }
    const topHalves=[halfHead(false),halfHead(true)],shoulder=source(new T.CylinderGeometry(.00865,.0041,.0035,32));
    function machineScrew(g,j){
      const crest=j?'#b9c3c0':'#a5afa9',body=j?'#414d4c':'#424541',head=j?'#dde0d1':'#e6ce93';
      disc(g,-.0025,0,0,.0035,.0276,body,'x',toolSteel);cast(g,raisedThread,toolSteel,crest,zero);
      cast(g,source(new T.ConeGeometry(.00375,.0034,18)),toolSteel,body,[-.0171,0,0],one,[0,0,Math.PI/2]);
      disc(g,.0094,0,0,.0043,.0048,body,'x',toolSteel);cast(g,shoulder,toolSteel,head,[.0124,0,0],one,[0,0,-Math.PI/2]);
      disc(g,.0144,0,0,.00905,.0028,j?'#8a9792':'#b39762','x',toolSteel);
      ring(g,.0148,0,0,.0088,.00052,j?'#d6ded6':'#d7c190','x',cutMetal);
      disc(g,.01594,0,0,.0091,.00075,'#474b45','x',toolSteel);
      for(const shape of topHalves)cast(g,shape,cutMetal,head,[.01632,0,0],one,[0,Math.PI/2,0]);
      g.node.scale.set(1.32,1,1);
    }
    const screws=[group(root,'第一颗 · 旧黄铜一字螺钉'),group(root,'第二颗 · 镀锌一字螺钉')];screws.forEach(machineScrew);
    // Three short spare fasteners remain in the hardware tray, separate from the two playable screws.
    for(const [j,offset] of [[0,[-.030,.016,-.013]],[1,[.008,.016,-.013]],[2,[.041,.014,.010]]]){
      const dir=.32+j*.77,A=offset,B=[A[0]+Math.cos(dir)*.027,A[1]-.002,A[2]+Math.sin(dir)*.027];rod(supplies,A,B,.0021,iron);
      disc(supplies,A[0],A[1],A[2],.0037,.0038,brass,'y',metal,hex);
    }
    // Table scratches and the tin-bottom contact are visible even in the soft, diffuse light from the summer-room window.
    const rollingContact=atlas(192,80,(c,W,H)=>{
      const q=c.createImageData(W,H);
      function fall(x,y,rx,ry){return Math.exp(-(x*x/(rx*rx)+y*y/(ry*ry)));}
      for(let y=0;y<H;y++)for(let x=0;x<W;x++){
        const u=(x+.5)/W-.5,v=(y+.5)/H-.5,head=fall(u-.222,v,.094,.177),shaft=fall(u+.052,v,.275,.126),penumbra=fall(u-.006,v,.382,.239);
        const k=(y*W+x)*4;q.data[k]=45;q.data[k+1]=34;q.data[k+2]=25;q.data[k+3]=Math.round(255*Math.min(.78,.41*shaft+.47*head+.18*penumbra));
      }c.putImageData(q,0,0);
    });
    const smudge=atlas(144,112,(c,W,H)=>{const g=c.createRadialGradient(W*.5,H*.5,8,W*.5,H*.5,66);g.addColorStop(0,'rgba(38,31,24,.27)');g.addColorStop(.50,'rgba(47,37,29,.15)');g.addColorStop(1,'rgba(40,32,24,0)');c.fillStyle=g;c.fillRect(0,0,W,H);});
    const smudgeMat=own(new T.MeshBasicMaterial({map:smudge,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-.5})),smudgeG=own(new T.PlaneGeometry(1,1));
    function shade(parent,x,y,z,w,d){const mesh=new T.Mesh(smudgeG,smudgeMat);mesh.position.set(x,y,z);mesh.rotation.x=-Math.PI/2;mesh.scale.set(w,d,1);parent.add(mesh);return mesh;}
    shade(bench.node,0,.6405,0,.37,.31);shade(bench.node,-.354,.6405,-.096,.136,.106);
    const tinShadow=shade(root,0,.6405,0,.179,.149);
    const contact=screws.map(()=>{
      const m=new T.Mesh(smudgeG,own(new T.MeshBasicMaterial({map:rollingContact,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1})));
      m.renderOrder=1;root.add(m);return m;
    });
    for(const g of batches)seal(g);for(const o of srcSet)o.dispose();srcSet.clear();index.clear();toruses.clear();
    deck.node.matrixAutoUpdate=false;
    const lane=vec(),normal=vec(),forward=vec(),pivot=vec(),spareOffset=vec(),rot=vec();
    const rests=[{x:-.020,z:.019,angle:.46},{x:.014,z:-.017,angle:-.67}],seen=[false,false],lastCount={val:0};
    const clamp=(n,a,b)=>Math.min(b,Math.max(a,n)),mix=(a,b,k)=>a+(b-a)*k;
    let disposed=false;
    function update(game,t){
      if(disposed)return;
      const m=game.archive?.memory;root.visible=!!m&&!m.done;if(!root.visible)return;
      const dir=m.dir===-1?-1:1,phase=m.phase||'ready',count=Math.max(0,num(m.count)|0),handing=phase==='return',raw=handing?clamp(num(m.turned),0,1):0;
      if(count<lastCount.val){seen[0]=false;seen[1]=false;}lastCount.val=count;
      const e=raw*raw*(3-2*raw),arc=Math.sin(Math.PI*e),yaw=handing?Math.PI*e:(dir>0?0:Math.PI),cs=Math.cos(yaw),sn=Math.sin(yaw);
      const bank=num(m.bank)*(handing?1-e:1),slope=handing?mix(num(m.slope,.108),.108,e):num(m.slope,.108);
      lane.set(cs,bank,-sn);forward.set(sn,-slope,cs);normal.crossVectors(forward,lane).normalize();pivot.set(0,.87+.028*arc,0);
      deck.node.matrix.makeBasis(lane,normal,forward);deck.node.matrix.setPosition(pivot);deck.node.matrixWorldNeedsUpdate=true;
      let x=dir*num(m.catchX,.118),z=dir*num(m.catchZ,.362);
      if(handing){
        const fromX=num(m.catchX,.118),fromZ=num(m.catchZ,.362),a=mix(Math.atan2(fromX,fromZ),Math.atan2(.117,-.362),e),r=mix(Math.hypot(fromX,fromZ),Math.hypot(.117,.362),e)+.147*arc;
        x=r*Math.sin(a);z=r*Math.cos(a);
      }
      tin.node.position.set(x,.640+.096*arc,z);tin.node.rotation.y=yaw;tinShadow.position.x=x;tinShadow.position.z=z;
      tinShadow.scale.set(.179+.069*arc,.149+.069*arc,1);tinShadow.visible=arc<.74;
      const active=dir>0?0:1,settled=count===2||phase==='playback'||phase==='home';
      for(let j=0;j<2;j++){
        const mesh=screws[j].node,live=!settled&&!handing&&j===active;
        const darken=contact[j];mesh.visible=live||j<count;darken.visible=mesh.visible;if(!mesh.visible)continue;
        if(live){
          const u=num(m.x,dir>0?-.123:.124),w=num(m.z,-.229);
          mesh.position.set(dir*u,num(m.y,.87+bank*u-slope*w+.009),dir*w);
          const axisAngle=(j?-.41:.39)-.44*Math.atan2(num(m.vx),Math.max(.017,Math.abs(num(m.vz))));
          mesh.rotation.set(num(m.spin),yaw+axisAngle,.065,'YZX');
          if(phase==='ready'||phase==='roll'||(phase==='miss'&&Math.abs(w)<.279)){
            if(darken.parent!==deck.node)deck.node.add(darken);
            darken.position.set(u+.0011,.00046,w+.0012);darken.rotation.set(-Math.PI/2,axisAngle,0,'YXZ');darken.scale.set(.071,.030,1);darken.material.opacity=.91;
          }else{
            if(darken.parent!==root)root.add(darken);
            const inside=Math.abs(u-num(m.catchX))<=.057&&Math.abs(w-num(m.catchZ))<=.044;
            const floor=inside?.651:.640;const gap=Math.max(0,mesh.position.y-.0087-floor);
            darken.position.set(mesh.position.x+.001,floor+.00065,mesh.position.z+.001);darken.rotation.set(-Math.PI/2,yaw+axisAngle,0,'YXZ');
            darken.scale.set(.070+gap*.20,.028+gap*.19,1);darken.material.opacity=.85*Math.exp(-gap*29);darken.visible=darken.material.opacity>.026;
          }
          if(phase==='caught'){
            const at=rests[j];seen[j]=true;
            at.x=clamp(u-num(m.catchX),-.046,.046);at.z=clamp(w-num(m.catchZ),-.038,.038);
            at.angle=axisAngle;
          }
        }else{
          const at=rests[j];
          if(!seen[j]&&(phase==='return'&&j===0||count===2&&j===1)&&Number.isFinite(m.landX)&&Number.isFinite(m.landZ)){
            at.x=clamp(m.landX-m.catchX,-.046,.046);at.z=clamp(m.landZ+.030-m.catchZ,-.038,.038);
          }
          if(j===1&&Math.hypot(at.x-rests[0].x,at.z-rests[0].z)<.021)at.z=at.z>.004?at.z-.022:at.z+.022;
          spareOffset.set(at.x,.019,at.z);rot.set(cs*spareOffset.x+sn*spareOffset.z,spareOffset.y,-sn*spareOffset.x+cs*spareOffset.z);
          mesh.position.copy(tin.node.position).add(rot);
          mesh.rotation.set(.36+j*.33,yaw+at.angle,.046,'YZX');
          if(darken.parent!==tin.node)tin.node.add(darken);darken.position.set(at.x,.01165,at.z);darken.rotation.set(-Math.PI/2,at.angle,0,'YXZ');
          darken.scale.set(.068,.026,1);darken.material.opacity=.86;
        }
      }
    }
    return {update,dispose(){if(disposed)return;disposed=true;if(root.parent)root.parent.remove(root);for(const o of ownSet)o.dispose();ownSet.clear();root.clear();}};
  }
  return {create};
})();
