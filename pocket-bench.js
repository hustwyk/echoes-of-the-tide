// The archive field recorder and the family biscuit tin travel with the chapter-seven car.
const TidePocketBench=(()=>{
  const T=THREE,TAU=2*Math.PI,U=new T.Vector3(0,1,0),vec=(x=0,y=0,z=0)=>new T.Vector3(x,y,z);
  const white='#ffffff',zero=[0,0,0],one=[1,1,1],clamp=x=>Math.min(1,Math.max(0,x));
  function create(car){
    const root=new T.Group();root.name='背风吊篮 · 录音搁板';car.add(root);
    const ownSet=new Set(),own=o=>(ownSet.add(o),o),srcSet=new Set(),source=o=>(srcSet.add(o),o),batches=[],index=new Map(),toruses=new Map();
    const tx=new T.Object3D(),normalM=new T.Matrix3(),q=new T.Quaternion(),A=vec(),B=vec(),P=vec(),N=vec(),tint=new T.Color();
    let seed=817529;function rand(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;}
    function blank(W,H){const c=document.createElement('canvas');c.width=W;c.height=H;return c;}
    function textured(c,color=true,wrap=false){
      const t=own(new T.CanvasTexture(c));if(color){if('colorSpace' in t)t.colorSpace=T.SRGBColorSpace;else t.encoding=T.sRGBEncoding;}
      if(wrap)t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=8;return t;
    }
    function atlas(w,h,draw,wrap=false){const c=blank(w,h);draw(c.getContext('2d'),w,h);return textured(c,true,wrap);}
    const timber=atlas(768,256,(c,W,H)=>{
      const im=c.createImageData(W,H),pat=new Float32Array(170);for(let k=0;k<pat.length;k++)pat[k]=rand();
      for(let y=0;y<H;y++)for(let x=0;x<W;x++){
        const u=x/W,v=y/H,dx=(u-.26)*6,dy=(v-.506)*25,d=dx*dx+dy*dy,w=Math.exp(-d*.5);
        const bend=2.9*Math.sin(u*7.1+v*3.7)+1.4*Math.sin(u*15+v*11)+12*w*(dy>0?1:-1);
        const phase=v*126+bend,v0=Math.floor(phase),k=((v0%168)+168)%168,t=phase-v0,broad=pat[k]*(1-t)+pat[k+1]*t;
        const ring=(.5+.5*Math.sin(phase*1.47))**8,grain=15*(broad-.5)-8*ring+7*w*Math.sin(d*3.2)+(rand()-.5)*8+5*Math.sin(.29*v0+3*u);
        const i=4*(x+y*W);im.data.set([129+grain,105+grain*.90,77+grain*.78,255],i);
      }c.putImageData(im,0,0);
      for(let j=0;j<650;j++){
        const x=rand()*W,y=rand()*H;c.strokeStyle=rand()<.47?'rgba(75,67,53,.22)':'rgba(217,199,158,.33)';c.lineWidth=.35+rand();c.beginPath();c.moveTo(x,y);const len=3+76*rand()**3;
        c.quadraticCurveTo(x+len*.47,y+2*(rand()-.3),x+len,y+len*(rand()-.5)*.11);c.stroke();
      }
    },true);
    const fine=atlas(192,192,(c,W,H)=>{c.fillStyle='#e4e2d7';c.fillRect(0,0,W,H);for(let j=0;j<4700;j++){c.fillStyle=rand()<.43?'rgba(106,91,68,.25)':'rgba(247,238,211,.36)';c.fillRect(rand()*W,rand()*H,.65+rand()**2*7,.5+rand()*1.25);}},true);
    const oak=own(new T.MeshPhysicalMaterial({map:timber,bumpMap:timber,bumpScale:.0014,vertexColors:true,roughness:.63,metalness:.014,clearcoat:.27,clearcoatRoughness:.34}));
    const metal=own(new T.MeshStandardMaterial({vertexColors:true,map:fine,roughness:.42,metalness:.54}));
    const coat=own(new T.MeshStandardMaterial({vertexColors:true,map:fine,roughness:.54,metalness:.26}));
    const soft=own(new T.MeshStandardMaterial({vertexColors:true,map:fine,roughness:.77,metalness:.025}));
    const cream='#cec7ab',teal='#537368',loden='#495f58',brass='#aa9067',shiny='#c2b795',iron='#535c55',dark='#303c39',edge='#9ca59b';
    const cube=source(new T.BoxGeometry(1,1,1)),cylinder=source(new T.CylinderGeometry(1,1,1,22)),hex=source(new T.CylinderGeometry(1,1,1,6)),orb=source(new T.SphereGeometry(1,16,10));
    function group(parent,name,x=0,y=0,z=0){const node=new T.Group();node.name=name;node.position.set(x,y,z);parent.add(node);const g={node,sets:new Map()};batches.push(g);return g;}
    function cast(g,geo,mat,color,at,sz=one,rot=zero,quat=null,proj=null){
      let ar=index.get(geo);if(!ar){ar=(geo.index?source(geo.toNonIndexed()):geo).attributes;index.set(geo,ar);}
      let dst=g.sets.get(mat);if(!dst){dst={p:[],n:[],c:[],uv:[]};g.sets.set(mat,dst);}
      tx.position.set(...at);tx.scale.set(...sz);if(quat)tx.quaternion.copy(quat);else tx.rotation.set(...rot);tx.updateMatrix();normalM.getNormalMatrix(tx.matrix);tint.set(color);
      for(let i=0;i<ar.position.count;i++){
        P.fromBufferAttribute(ar.position,i).applyMatrix4(tx.matrix);N.fromBufferAttribute(ar.normal,i).applyNormalMatrix(normalM);dst.p.push(P.x,P.y,P.z);dst.n.push(N.x,N.y,N.z);dst.c.push(tint.r,tint.g,tint.b);
        if(proj==='board')dst.uv.push(.5+P.x/.390,.5-P.z/.56);
        else if(proj==='bench')dst.uv.push(.52+P.x*.58,.49+P.z*.83+(Math.abs(N.y)<.52?P.y*.71:0));
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

    const shelf=group(root,'旧折页搁板及支撑'),tin=group(root,'海盐铁盒 · 盒身',-.512,.859,-.694),lid=group(root,'海盐铁盒 · 盒盖',.512,.916,-.694);
    function casing(g,rows,m,c=white,inside=false,cap=false){cast(g,loft(rows,inside,cap),m,c,zero,one,zero,null,'uv');}
    for(let j=0;j<3;j++){
      const dz=.570/3,z=-.55-(j+.5)*dz;
      box(shelf,0,.841,z,1.52,.038,dz-.0029,['#d1ceb8','#d4c9ac','#c9c1ab'][j],oak,0,0,0,'bench');
      for(const x of [-.704,.704])screwHead(shelf,x,.8602,z,.006,iron,1.68*(j+1)+x);
    }
    for(const side of [-1,1]){
      const x=side*.671;
      box(shelf,x,.019,-1.125,.152,.038,.201,loden,coat);for(const dx of [-.052,.053])for(const dz of [-.063,.062])disc(shelf,x+dx,.044,-1.125+dz,.010,.010,brass,'y',metal,hex);
      box(shelf,x,.426,-1.136,.044,.784,.059,loden,coat);box(shelf,x,.825,-1.129,.107,.066,.067,loden,coat);
      disc(shelf,x,.817,-1.113,.027,.126,brass,'x');
      for(const t of [-.045,0,.045])disc(shelf,x+t,.817,-1.113,.029,.037,t===0?edge:loden,'x');
      box(shelf,x,.803,-.832,.040,.032,.514,iron);
      rod(shelf,[x,.440,-1.130],[x,.802,-.599],.020,loden,coat,.031);
      const mx=x+.015;rod(shelf,[mx,.513,-1.108],[mx,.711,-.773],.012,brass);
      for(const [y,z] of [[.440,-1.13],[.665,-.804],[.802,-.599]])disc(shelf,x+.006,y,z,.018,.056,edge,'x',metal,hex);
      box(shelf,side*.754,.831,-.835,.012,.050,.561,iron);
    }
    // A narrow cork saddle keeps the detached lid level with the rim of the tin when the children, now adults, tap in reply.
    for(const s of [-1,1]){
      const x=.512+s*.047;box(shelf,x,.879,-.695,.026,.038,.082,'#a1825c',oak);
      box(shelf,x,.9050,-.695,.027,.016,.078,'#91836b',soft);
      const px=-.512+s*.072;box(shelf,px,.864,-.694,.006,.008,.037,loden,coat);screwHead(shelf,px,.869,-.694,.0024,shiny,s*.72);
    }
    casing(tin,[[.061,.051,.010,.001],[.065,.055,.013,.004],[.0653,.0553,.014,.007]],metal,iron);
    casing(tin,[[.0647,.0547,.014,.008],[.0666,.0566,.015,.0572]],inkTin);
    casing(tin,[[.0639,.0539,.013,.011],[.064,.054,.013,.064]],metal,'#b6b19b',true);
    casing(tin,[[.0638,.0538,.012,.010],[.0638,.0538,.012,.011]],metal,'#c8bfa2',false,true);
    casing(tin,[[.0666,.0566,.015,.055],[.0675,.0575,.015,.058],[.0679,.0579,.015,.0615],[.0669,.0569,.014,.0645],[.0653,.0553,.014,.065],[.064,.054,.013,.0637]],metal,'#bda985');
    for(const s of [-1,1])hose(tin,[[s*.066,.048,-.016],[s*.078,.049,-.017],[s*.083,.049,-.011],[s*.083,.049,.011],[s*.078,.049,.017],[s*.066,.048,.016]],.0023,brass);
    casing(lid,[[.0683,.0584,.015,-.004],[.0685,.0585,.015,.0046],[.067,.0573,.014,.007]],metal,teal);
    casing(lid,[[.0669,.0570,.014,.0069],[.065,.055,.013,.0080]],lidInk,white,false,true);
    lid.node.rotation.y=-.035;
    for(const [i,x,z,theta] of [[0,-.020,-.014,.37],[1,.018,.018,-.55]]){
      const a=[x-.011*Math.cos(theta),.014,z-.011*Math.sin(theta)],b=[x+.016*Math.cos(theta),.015,z+.016*Math.sin(theta)];
      rod(tin,a,b,.0028,iron);cast(tin,orb,metal,i?edge:brass,b,[.005,.005,.005]);for(let j=1;j<7;j++){
        const f=j/9;cast(tin,orb,metal,i?'#8f988e':'#918977',[a[0]*(1-f)+b[0]*f,.0146,a[2]*(1-f)+b[2]*f],[.0031,.0033,.0032]);
      }
    }
    // The portable recorder leans on two rubber feet. The three transport keys, tape-window spindles, head guard and VU are independent physical parts.
    const audio=group(root,'袖珍采音机',0,.875,-.837);audio.node.rotation.set(.135,-.045,0,'YXZ');
    for(const xx of [-.100,.100])for(const zz of [-.064,.067]){
      const h=zz<0?.020:.009;box(shelf,xx,.86+h/2,-.837+zz,.024,h,.023,'#47473c',soft);
    }
    function shell(g,rows,m,c){casing(g,rows,m,c,false,true);}
    shell(audio,[[.130,.084,.016,0],[.136,.089,.018,.005],[.137,.09,.018,.042],[.134,.087,.017,.048]],coat,'#47544e');
    shell(audio,[[.134,.087,.017,.0468],[.133,.086,.016,.0515],[.130,.083,.014,.054]],metal,'#747b6d');
    shell(audio,[[.131,.084,.015,.0538],[.129,.082,.014,.056]],coat,'#565c50');
    for(const x of [-.12,.12])for(const z of [-.075,.076])screwHead(audio,x,.0567,z,.0033,'#b3b09b',x*40+z);
    // Speaker's crossed woven wires are struck down into a recessed oval; the holes stay open through the actual grille.
    const spx=.087,spz=-.012;
    cast(audio,orb,soft,'#232b28',[spx,.0569,spz],[.030,.0038,.046]);
    for(let row=-9;row<=9;row++){
      const x=row*.0030,L=.044*Math.sqrt(Math.max(0,1-(x/.030)**2));
      rod(audio,[spx+x,.0600,spz-L],[spx+x,.0600,spz+L],.00062,'#92958a');
    }
    for(let row=-14;row<=14;row++){
      const z=row*.0031,L=.029*Math.sqrt(Math.max(0,1-(z/.046)**2));
      rod(audio,[spx-L,.0608,spz+z],[spx+L,.0608,spz+z],.00054,'#8e8e7e');
    }
    const surround=source(new T.TorusGeometry(1,.039,7,48));
    cast(audio,surround,metal,'#9a9b88',[spx,.0585,spz],[.0312,.0473,.030],[Math.PI/2,0,0]);
    // Face of the tape well. The two hubs project slightly into the actual transparent cassette-cover outline.
    const cassette=group(audio.node,'外录拷贝 · 盒式录音带',-.037,.055,-.019);
    shell(cassette,[[.073,.045,.007,.001],[.075,.047,.007,.004]],coat,'#282d2a');
    shell(cassette,[[.067,.039,.005,.005],[.068,.040,.005,.010],[.067,.039,.005,.012]],coat,'#b3ac8c');
    for(const sx of [-.061,.061])for(const zz of [-.031,.031])screwHead(cassette,sx,.0124,zz,.0018,iron,sx*21);
    box(cassette,0,.0124,-.006,.097,.0014,.028,'#333b31',soft);box(cassette,0,.0133,-.005,.024,.001,.010,'#716b50',soft);
    const reels=[-.030,.030].map((x,i)=>{
      const reel=group(cassette.node,'磁带走带轮 '+(i+1),x,.014,-.005);
      disc(reel,0,0,0,.0126,.0016,'#58543e');disc(reel,0,.0013,0,.0098,.0025,'#d7cfaa');disc(reel,0,.0032,0,.0031,.0015,iron,'y',metal,hex);
      for(let j=0;j<5;j++){const a=j*TAU/5;box(reel,.0064*Math.cos(a),.0030,.0064*Math.sin(a),.0032,.0009,.0027,'#5f6252',soft,0,-a);}
      return reel.node;
    });
    function patch(G,w,d,x,y,z,texture,opt={}){
      const mat=own(new T.MeshStandardMaterial({map:texture,roughness:.63,metalness:.10,...opt}));const m=new T.Mesh(own(new T.PlaneGeometry(w,d)),mat);
      m.position.set(x,y,z);m.rotation.x=-Math.PI/2;m.receiveShadow=true;G.node.add(m);return m;
    }
    const tapeLabel=atlas(540,126,(c,W,H)=>{
      c.fillStyle='#d6cba8';c.fillRect(0,0,W,H);c.strokeStyle='#989575';c.lineWidth=2;c.strokeRect(3,3,W-6,H-6);
      c.strokeStyle='#a8a083';c.beginPath();c.moveTo(9,94);c.lineTo(W-9,94);c.stroke();
      c.save();c.translate(W*.5,H*.59);c.rotate(-.014);c.font='italic bold 76px "KaiTi","Songti SC",serif';c.textBaseline='middle';c.textAlign='center';c.fillStyle='#424d48';c.fillText('十秒钟北岬',0,0,W-36);c.restore();paperSpecks(c,W,H,540);
    });
    box(cassette,0,.0133,.0215,.109,.0018,.020,'#c2baa0',coat);
    const tagged=patch(cassette,.109,.022,0,.0148,.0215,tapeLabel);
    // The cover is a real hinged smoked rim with a small clear window over the revolving hubs.
    for(const s of [-1,1]){
      box(cassette,s*.071,.018,-.002,.004,.007,.085,loden,coat);box(cassette,0,.018,s*.0415,.142,.007,.0038,loden,coat);
      disc(cassette,s*.039,.0133,-.046,.004,.035,edge,'x');
    }
    box(cassette,0,.0195,.043,.026,.0035,.0049,brass);
    const glazing=own(new T.MeshPhysicalMaterial({color:'#c0d0b6',transparent:true,opacity:.083,metalness:.11,roughness:.25,depthWrite:false}));
    const glass=new T.Mesh(own(new T.BoxGeometry(.138,.001,.077)),glazing);glass.position.set(0,.0206,-.0006);cassette.node.add(glass);
    const VU=atlas(400,140,(c,W,H)=>{
      c.fillStyle='#d2c9a4';c.fillRect(0,0,W,H);const x=W*.48,y=H*1.30,R=H*1.02;
      for(let j=0;j<=24;j++){
        const a=-.97+j*1.94/24,r2=R-(j%3?10:20);c.strokeStyle=j>18?'#a25c40':'#464e40';c.lineWidth=j%3?2:3.4;
        c.beginPath();c.moveTo(x+Math.sin(a)*r2,y-Math.cos(a)*r2);c.lineTo(x+Math.sin(a)*R,y-Math.cos(a)*R);c.stroke();
      }
      c.textAlign='center';c.fillStyle='#495348';c.font='19px monospace';c.fillText('−20     −10      0    +3',W*.49,H*.86);
    });
    box(audio,-.049,.056,.049,.082,.003,.025,iron);patch(audio,.078,.022,-.049,.0584,.049,VU);
    const pointer=group(audio.node,'电平表针',-.049,.0601,.063);
    box(pointer,0,0,-.0107,.0013,.0010,.0236,'#aa5938');
    const meterLamp=own(new T.MeshStandardMaterial({color:'#bf9b64',emissive:0xffa849,emissiveIntensity:.016,metalness:.23,roughness:.24}));
    disc(audio,.006,.0573,.047,.0054,.0040,brass);const bulb=new T.Mesh(own(new T.SphereGeometry(1,12,8)),meterLamp);
    bulb.position.set(.006,.0601,.047);bulb.scale.set(.0033,.0026,.0033);audio.node.add(bulb);
    const play=group(audio.node,'播放键',.037,.062,.059);
    box(play,0,-.0005,0,.017,.007,.025,'#c9c4ad',coat);
    for(const [x,col] of [[.057,'#8c927e'],[.078,'#aaa691'],[.100,'#965f4b']])box(audio,x,.0615,.059,.017,.007,.025,col,coat);
    const arrow=source(new T.BufferGeometry());arrow.setAttribute('position',new T.Float32BufferAttribute([-.0031,.0032,-.0055,-.0031,.0032,.0055,.0042,.0032,0],3));arrow.computeVertexNormals();cast(play,arrow,soft,iron,zero);
    for(const x of [.057,.078,.100])box(audio,x,.0653,.059,.0042,.0004,.0062,x>.09?'#d5ad88':iron,soft);
    disc(audio,.140,.0315,.021,.012,.012,dark,'x');for(let j=0;j<12;j++){const a=j*TAU/12;box(audio,.144,.0315+.0118*Math.cos(a),.021+.0118*Math.sin(a),.009,.002,.002,iron);}
    ring(audio,-.137,.027,.019,.0065,.0019,brass,'x');
    // A short lanyard clips the recorder to a through-bolted eye; its free curve stays behind the controls.
    hose(shelf,[[-.128,.898,-.884],[-.157,.880,-.900],[-.206,.866,-.934],[-.232,.867,-.979],[-.194,.867,-1.016],[-.151,.875,-1.022],[-.143,.879,-1.018]],.0028,'#6c6952',soft,24);
    ring(shelf,-.147,.873,-1.019,.011,.003,brass);disc(shelf,-.147,.863,-1.019,.014,.005,iron,'y');screwHead(shelf,-.147,.867,-1.020,.0041,brass,.35);
    for(const g of batches)seal(g);for(const o of srcSet)o.dispose();srcSet.clear();index.clear();toruses.clear();
    let envelope=0,stamp=null,held=null,lastCursor=0,latest=-9,spin=0,disposed=false;
    function knock(times,t){
      const last=times?.[times.length-1];if(!Number.isFinite(last))return 0;
      const age=t-last;return age>=0&&age<.24?Math.sin(82*age)*Math.exp(-age*24):0;
    }
    function update(g,t){
      if(disposed)return;
      const now=Number.isFinite(t)?t:g.time||0,dt=stamp===null?1/60:Math.max(0,Math.min(.13,now-stamp));stamp=now;
      const s=g.state||{},available=g.pocketTape?.length===2,player=available?s.pocket:null;
      tagged.visible=available;
      if(player!==held){held=player;lastCursor=0;latest=-9;if(player)spin=0;}
      let peak=0;
      if(player){
        const elapsed=Number(player.elapsed)||0,cursor=player.cursor||0,trace=player.clip?.events;
        if(cursor>lastCursor)latest=elapsed;
        if(trace){for(let j=Math.max(0,cursor-6);j<cursor;j++){
          const event=trace[j];if(event){const age=elapsed-event[0];if(age>=0&&age<.46)peak+=event[2]*Math.exp(-age*(event[1]==='tin'?9:16));}
        }}else{const last=player.events?.[player.events.length-1];peak=(last?.gain||0)*Math.exp(-Math.max(0,elapsed-latest)*13);}
        lastCursor=cursor;spin=elapsed;reels[0].rotation.y=-spin*3.54;reels[1].rotation.y=-spin*4.62;
      }
      peak=clamp(peak);envelope+=(peak-envelope)*(1-Math.exp(-dt*(peak>envelope?36:13)));
      pointer.node.rotation.y=.89-envelope*1.64;meterLamp.emissiveIntensity=player ? .12+envelope*2.7 : .016;play.node.position.y=player ? .0585 : .062;
      tin.node.rotation.z=knock(s.taps,g.time)*.009;lid.node.rotation.x=knock(s.answer,g.time)*.013;
    }
    return {update,dispose(){if(disposed)return;disposed=true;if(root.parent)root.parent.remove(root);for(const o of ownSet)o.dispose();ownSet.clear();root.clear();}};
  }
  return {create};
})();
