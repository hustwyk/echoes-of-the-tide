// Portable North Cape quay radio. Datum under its shoes, front facing +Z, knobs toward the observer.
const TidePocketSet=(()=>{
  const T=THREE,TAU=Math.PI*2,V=(x=0,y=0,z=0)=>new T.Vector3(x,y,z),clamp=x=>Math.max(0,Math.min(1,x));
  function create(parent){
    const assets=new Set(),own=o=>(assets.add(o),o),forms=new Set(),form=o=>(forms.add(o),o);
    const root=new T.Group();root.name='北岬 · 船用防水电台';parent.add(root);
    function group(p,x=0,y=0,z=0){const o=new T.Group();o.position.set(x,y,z);p.add(o);return o}
    const face=group(root,0,.126,.071);face.rotation.x=-.205;
    let seed=4107;const random=()=>((seed=(1664525*seed+1013904223)>>>0)/4294967296);
    function paint(w,h,draw,colour=true,repeat=false){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);
      const tx=own(new T.CanvasTexture(c));if(colour)tx.colorSpace=T.SRGBColorSpace;if(repeat)tx.wrapS=tx.wrapT=T.RepeatWrapping;tx.anisotropy=4;return tx}
    const finish=(color,roughness,metalness,opts={})=>own(new T.MeshStandardMaterial({color,roughness,metalness,vertexColors:true,...opts}));
    const grain=paint(256,256,(c,w,h)=>{const image=c.createImageData(w,h);for(let y=0;y<h;y++)for(let x=0;x<w;x++){
      const a=140+random()*62+9*Math.sin(.19*x+.30*Math.sin(y*.12));image.data.set([a,a,a,255],(y*w+x)*4);}
      c.putImageData(image,0,0);for(let i=0;i<165;i++){const x=random()*w,y=random()*h;c.strokeStyle='rgba(15,15,15,.17)';c.lineWidth=random()*1.2+.3;c.beginPath();c.moveTo(x,y);c.lineTo(x+3+random()*20,y-1+random()*4);c.stroke();}
    },false,true);
    const stipple=paint(256,256,(c,w,h)=>{const im=c.createImageData(w,h);for(let y=0;y<h;y++)for(let x=0;x<w;x++){
      const mottling=4*Math.sin(x*.071+2*Math.cos(y*.094))+3*Math.cos((x+y)*.047),shade=238+mottling+(random()-.5)*18;
      im.data.set([shade,shade+1,shade-2,255],(y*w+x)*4)}c.putImageData(im,0,0);
      for(let j=0;j<260;j++){const x=random()*w,y=random()*h;c.fillStyle=j%4?'rgba(221,225,207,.23)':'rgba(82,73,55,.27)';c.fillRect(x,y,random()*1.9+.4,random()*1.9+.3);}
    },true,true);
    const steel=finish(0xffffff,.47,.56,{roughnessMap:grain}),enamel=finish(0xffffff,.58,.32,{map:stipple,roughnessMap:grain,bumpMap:grain,bumpScale:.000065}),
      rubber=finish(0xffffff,.77,.045,{roughnessMap:grain}),bright=finish(0xffffff,.34,.72,{roughnessMap:grain});
    const atlasCanvas=document.createElement('canvas');atlasCanvas.width=2048;atlasCanvas.height=1024;
    const atlasCtx=atlasCanvas.getContext('2d'),atlas=own(new T.CanvasTexture(atlasCanvas));
    atlas.colorSpace=T.SRGBColorSpace;atlas.anisotropy=6;
    const artwork=finish(0xffffff,.61,.13,{map:atlas}),cells=[[4,4],[1212,4],[1212,289],[1212,485],[1212,760],[4,802]];let cell=0;
    function art(w,h,draw){
      const tex=document.createElement('canvas');tex.width=w;tex.height=h;draw(tex.getContext('2d'),w,h);
      const [x,y]=cells[cell++];atlasCtx.drawImage(tex,x,y);
      atlasCtx.drawImage(tex,0,0,w,1,x,y-2,w,2);atlasCtx.drawImage(tex,0,h-1,w,1,x,y+h,w,2);
      atlasCtx.drawImage(tex,0,0,1,h,x-2,y,2,h);atlasCtx.drawImage(tex,w-1,0,1,h,x+w,y,2,h);
      return {region:[x,y,w,h]};
    }
    const glass=own(new T.MeshPhysicalMaterial({color:0xabbcaf,roughness:.15,metalness:.06,clearcoat:1,transparent:true,opacity:.12,depthWrite:false}));
    function xyPath(c,x,y,w,h,r){c.beginPath();c.moveTo(x+r,y);c.lineTo(x+w-r,y);c.quadraticCurveTo(x+w,y,x+w,y+r);c.lineTo(x+w,y+h-r);c.quadraticCurveTo(x+w,y+h,x+w-r,y+h);c.lineTo(x+r,y+h);c.quadraticCurveTo(x,y+h,x,y+h-r);c.lineTo(x,y+r);c.quadraticCurveTo(x,y,x+r,y);c.closePath();}
    const letter=(c,s,x,y,size,font='sans-serif',colour='#d2cdaf',align='center')=>{c.fillStyle=colour;c.textAlign=align;c.textBaseline='middle';c.font='600 '+size+'px '+font;c.fillText(s,x,y)};
    // All front panels are printed on a single UV atlas, with a separate physical brass needle and channel hairline.
    const plate=art(1200,792,(c,w,h)=>{
      const image=c.createImageData(w,h);for(let i=0;i<w*h;i++){const x=i%w,y=i/w|0,p=5*Math.sin(x*.021+Math.cos(y*.015))+(random()-.5)*13,
        fade=9*(1-y/h)+5*Math.sin(x/w*Math.PI);image.data.set([48+p+fade,66+p+fade,61+p+fade,255],i*4)}c.putImageData(image,0,0);
      for(let i=0;i<600;i++){const x=random()*w,y=random()*h;c.strokeStyle=i%3?'rgba(164,156,131,.12)':'rgba(19,23,21,.18)';c.lineWidth=random()*2+.25;
        c.beginPath();c.moveTo(x,y);c.lineTo(x+1+random()*18,y+random()*4);c.stroke();}
      c.strokeStyle='#859589';c.lineWidth=2;xyPath(c,15,15,w-30,h-30,40);c.stroke();c.strokeStyle='#35463d';xyPath(c,23,23,w-46,h-46,36);c.stroke();
      letter(c,'北岬  船用收发机',74,94,48,'sans-serif','#e2dcc1','left');letter(c,'V H F   ·   0 4 7',75,146,26,'monospace','#c3cbb1','left');
      letter(c,'信道',823,268,28);
      letter(c,'接收',610,682,27);letter(c,'发话',743,682,27);letter(c,'调谐',965,699,30);
      c.lineWidth=4;c.strokeStyle='#bcbca0';for(let i=0;i<7;i++){const x=825+i*40;c.beginPath();c.moveTo(x,332+i%2*6);c.lineTo(x+7,324+i%2*6);c.stroke();}
      c.lineWidth=2;c.strokeStyle='#748379';c.beginPath();c.moveTo(464,625);c.lineTo(770,625);c.stroke();
    });
    const speaker=art(420,280,(c,w,h)=>{c.fillStyle='#4d5350';c.fillRect(0,0,w,h);
      for(let row=-1;row<h/12;row++)for(let col=-1;col<w/13;col++){const x=col*13+(row%2)*6.5,y=row*12;c.fillStyle='#798078';c.beginPath();c.arc(x,y+1.2,3.8,0,TAU);c.fill();c.fillStyle='#191f1e';c.beginPath();c.arc(x,y,3.65,0,TAU);c.fill();}
      const v=c.createLinearGradient(0,0,w*.18,h);v.addColorStop(0,'rgba(65,67,59,.45)');v.addColorStop(.48,'rgba(29,39,34,.04)');v.addColorStop(1,'rgba(14,18,18,.45)');c.fillStyle=v;c.fillRect(0,0,w,h);
    });
    const bands=art(768,192,(c,w,h)=>{const grad=c.createLinearGradient(0,0,0,h);grad.addColorStop(0,'#4a554c');grad.addColorStop(.4,'#7e8a70');grad.addColorStop(.75,'#aeb394');grad.addColorStop(1,'#67765f');c.fillStyle=grad;c.fillRect(0,0,w,h);
      for(let i=0;i<=50;i++){const x=67+i*(w-134)/50;c.fillStyle='#26382d';const tall=i%5?17:34;c.fillRect(x,154-tall,i%5?2:4,tall)}
      for(let i=0;i<11;i++)letter(c,String(6+i).padStart(2,'0'),67+i*(w-134)/10,76,39,'monospace','#23382e');
    });
    const vu=art(640,270,(c,w,h)=>{const grad=c.createLinearGradient(0,0,0,h);grad.addColorStop(0,'#afa38a');grad.addColorStop(.24,'#e9dbb2');grad.addColorStop(.72,'#ddd3ac');grad.addColorStop(1,'#ac9d80');c.fillStyle=grad;c.fillRect(0,0,w,h);
      for(let i=0;i<1500;i++){c.fillStyle=i%5?'#b2a5844a':'#78674549';c.fillRect(random()*w,random()*h,1+random()*2,random()*2)}
      const cx=320,cy=265,rx=184,ry=207;for(let j=0;j<=30;j++){const a=(-57+j*(114/30))*Math.PI/180,x=cx+rx*Math.sin(a),y=cy-ry*Math.cos(a),R=j%5?12:22;c.beginPath();c.moveTo(x,y);c.lineTo(x+Math.sin(a)*R,y-Math.cos(a)*R);c.strokeStyle=j>23?'#9d392b':'#3a4034';c.lineWidth=j%5?2:4;c.stroke()}
      const labels=['−20','−10','−5','0','+3'];for(let j=0;j<labels.length;j++){const a=(-52+j*26)*Math.PI/180;letter(c,labels[j],cx+(rx+15)*Math.sin(a),cy-(ry+41)*Math.cos(a),30,'serif',j===4?'#914332':'#3b4038')}
      letter(c,'声级 · dB',320,170,27,'serif','#353b31');c.fillStyle='#4f5142';c.fillRect(51,243,98,2);c.fillRect(491,243,98,2);
    });
    const batches=new Map(),transform=new T.Object3D(),nmat=new T.Matrix3(),p=V(),n=V(),tint=new T.Color(),up=V(0,1,0),dir=V(),tmpQ=new T.Quaternion();
    const cube=form(new T.BoxGeometry(1,1,1)),plane=form(new T.PlaneGeometry(1,1)),cyl=new Map(),rings=new Map();
    function poly(rad,tube){const k=[rad,tube];const id=k.join(':');if(!rings.has(id))rings.set(id,form(new T.TorusGeometry(rad,tube,8,48)));return rings.get(id)}
    function pipe(n){if(!cyl.has(n))cyl.set(n,form(new T.CylinderGeometry(1,1,1,n)));return cyl.get(n)}
    function add(par,g,mat,col,x=0,y=0,z=0,sx=1,sy=1,sz=1,rot=null){
      const owner=par.userData.bakeInto||par;if(!batches.has(owner))batches.set(owner,new Map());const map=batches.get(owner);if(!map.has(mat))map.set(mat,{p:[],n:[],uv:[],c:[],i:[]});const b=map.get(mat);
      transform.position.set(x,y,z);transform.scale.set(sx,sy,sz);if(rot?.isQuaternion)transform.quaternion.copy(rot);else transform.rotation.set(...(rot||[0,0,0]));transform.updateMatrix();if(owner!==par){par.updateMatrix();transform.matrix.premultiply(par.matrix);}nmat.getNormalMatrix(transform.matrix);tint.set(col);
      const a=g.attributes,base=b.p.length/3;for(let j=0;j<a.position.count;j++){p.fromBufferAttribute(a.position,j).applyMatrix4(transform.matrix);n.fromBufferAttribute(a.normal,j).applyNormalMatrix(nmat);b.p.push(p.x,p.y,p.z);b.n.push(n.x,n.y,n.z);b.uv.push(a.uv?.getX(j)||0,a.uv?.getY(j)||0);b.c.push(tint.r,tint.g,tint.b)}
      const ix=g.index;for(let i=0,len=ix?.count||a.position.count;i<len;i++)b.i.push(base+(ix?ix.getX(i):i));}
    function box(par,x,y,z,w,h,d,colour,mat=steel,r=null){add(par,cube,mat,colour,x,y,z,w,h,d,r);}
    function tube(par,a,b,r,colour,mat=steel,sides=14){const A=V(...a),B=V(...b);dir.subVectors(B,A);const length=dir.length();tmpQ.setFromUnitVectors(up,dir.multiplyScalar(1/length));A.lerp(B,.5);add(par,pipe(sides),mat,colour,A.x,A.y,A.z,r,length,r,tmpQ)}
    function disc(par,x,y,z,r,h,col,mat=steel,sides=32){add(par,pipe(sides),mat,col,x,y,z,r,h,r,[Math.PI/2,0,0])}
    function tor(par,x,y,z,r,t,col,mat=steel,rot=null){add(par,poly(r,t),mat,col,x,y,z,1,1,1,rot)}
    function graphic(par,x,y,z,w,h,mat){
      if(!mat.region){add(par,plane,mat,0xffffff,x,y,z,w,h,1);return}
      const g=form(plane.clone()),uv=g.attributes.uv,[sx,sy,sw,sh]=mat.region;
      for(let i=0;i<uv.count;i++)uv.setXY(i,(sx+uv.getX(i)*sw)/atlasCanvas.width,1-(sy+(1-uv.getY(i))*sh)/atlasCanvas.height);
      add(par,g,artwork,0xffffff,x,y,z,w,h,1);
    }
    // A rounded rectangle in the XY face. Separate concentric rings form rolled case seams and recessed glazing.
    function outline(w,h,r){const pts=[];for(const [cx,cy,a] of [[w/2-r,h/2-r,0],[-w/2+r,h/2-r,.5],[-w/2+r,-h/2+r,1],[w/2-r,-h/2+r,1.5]]){
      for(let j=0;j<=7;j++){const u=(a+j/14)*Math.PI;pts.push([cx+r*Math.cos(u),cy+r*Math.sin(u)])}}return pts}
    function shell(par,x,y,profiles,colour,mat){const rows=profiles.map(([w,h,r,z])=>[outline(w,h,r),z]),P=[],U=[],I=[],N=rows[0][0].length;
      for(const [pts,z] of rows){let walk=0;for(let j=0;j<=N;j++){const v=pts[j%N],previous=pts[(j-1+N)%N];if(j)walk+=Math.hypot(v[0]-previous[0],v[1]-previous[1]);P.push(v[0],v[1],z);U.push(walk*8,z*8);}}
      for(let i=1;i<rows.length;i++)for(let j=0;j<N;j++){const l=(i-1)*(N+1)+j,k=l+1;I.push(l,k,k+N+1,l,k+N+1,l+N+1)}
      function cap(k,reverse){const [row,z]=rows[k],start=P.length/3;for(const [x,y] of row){P.push(x,y,z);U.push(x*8+.5,y*8+.5);}
        for(let j=1;j<N-1;j++)I.push(start,reverse?start+j+1:start+j,reverse?start+j:start+j+1)}
      cap(0,true);cap(rows.length-1,false);
      const g=form(new T.BufferGeometry());g.setAttribute('position',new T.Float32BufferAttribute(P,3));g.setAttribute('uv',new T.Float32BufferAttribute(U,2));g.setIndex(I);g.computeVertexNormals();add(par,g,mat,colour,x,y,0);}
    const olive='#45625a',olive2='#597168',iron='#414d48',alu='#a4aaa0',brass='#ae9364',dark='#292f2d',seal='#363b35',black='#242927',bone='#e0d7b8';
    shell(face,0,0,[[.268,.166,.02,-.137],[.293,.192,.021,-.125],[.303,.20,.019,-.111],[.303,.20,.019,-.010],[.302,.20,.019,-.004]],olive,enamel);
    shell(face,0,0,[[.306,.204,.022,-.009],[.311,.209,.023,-.005],[.311,.209,.023,.002],[.304,.201,.020,.006]],seal,rubber);
    shell(face,0,0,[[.302,.20,.019,.001],[.304,.201,.020,.005],[.297,.194,.018,.011],[.293,.190,.017,.0125]],olive2,enamel);
    graphic(face,0,0,.0127,.281,.179,plate);
    // The hole cloth is behind actual cast louvres; individual holes appear again between the vanes at grazing angles.
    const sx=-.073,sy=.005;
    shell(face,sx,sy,[[.107,.059,.006,.0131],[.108,.061,.005,.0162],[.104,.056,.004,.018]],iron,steel);
    graphic(face,sx,sy,.0182,.101,.053,speaker);
    for(let j=0;j<5;j++){const y=sy-.022+j*.0107;box(face,sx,y,.0224,.099,.0034,.0074,olive2,enamel,[-.28,0,0]);box(face,sx,y+.0017,.0251,.092,.0005,.0010,'#889286',steel)}
    // Four panel captive screws with real coin slots. Oxide varies along the edge interrupted by tools.
    function screw(par,x,y,z,r=.0046,a=0){disc(par,x,y,z,r,.0014,iron,steel,24);disc(par,x,y,z+.0011,r*.78,.0011,alu,bright,20);box(par,x,y,z+.00172,r*1.08,.00064,.0003,'#3b423e',rubber,[0,0,a]);}
    for(const x of [-.134,.134])for(const y of [-.081,.081])screw(face,x,y,.0137,.0047,x*14+y*7);
    for(let i=0;i<65;i++){const along=random(),side=i%4;let x,y,w,h;if(side<2){x=(along-.5)*.258;y=(side?.0957:-.0957)+(random()-.5)*.0012;w=.0009+random()**2*.008;h=.00022+random()*.00065;}else{x=side===2?-.149:.149;y=(along-.5)*.158;w=.0005+random()*.0004;h=.0007+random()**2*.0062}box(face,x,y,.0070,w,h,.0003,i%6?'#899187':'#744c36',steel);}
    const bx=.057,by=.056;
    shell(face,bx,by,[[.137,.042,.005,.013],[.140,.044,.006,.016],[.137,.042,.005,.0193]],'#4a554f',steel);
    shell(face,bx,by,[[.132,.036,.003,.019],[.132,.036,.003,.0205]],'#26362f',rubber);
    graphic(face,bx,by,.0208,.124,.030,bands);
    const hair=group(face,bx,by,.022);box(hair,0,0,0,.00095,.028,.00055,'#9d4026',bright);box(hair,0,.0148,0,.003,.0017,.0011,brass,bright);
    const meterX=-.071,meterY=-.053;
    shell(face,meterX,meterY,[[.100,.041,.006,.0129],[.104,.044,.006,.017],[.101,.042,.004,.020]],'#605b48',bright);
    shell(face,meterX,meterY,[[.095,.036,.004,.019],[.096,.037,.004,.021]],'#353b35',rubber);
    graphic(face,meterX,meterY,.0213,.090,.0335,vu);
    const needle=group(face,meterX,meterY-.016,.0222);
    const needleGeo=form(new T.BufferGeometry());needleGeo.setAttribute('position',new T.Float32BufferAttribute([-.00105,0,0,.00105,0,0,.00040,.0258,0,-.00040,.0258,0],3));needleGeo.setIndex([0,1,2,0,2,3]);needleGeo.computeVertexNormals();add(needle,needleGeo,steel,'#252923');disc(face,meterX,meterY-.016,.0228,.0029,.0008,brass,bright,18);
    for(const [x,y,w,h,z] of [[bx,by,.124,.031,.0237],[meterX,meterY,.092,.0336,.0243]]){
      graphic(face,x,y,z,w,h,glass);
      box(face,x,y+h*.47,z+.0002,w*.93,.00038,.00035,'#a6afa6',bright);
    }
    const dx=.085,dy=-.026;
    disc(face,dx,dy,.017,.035,.006,iron,steel,64);tor(face,dx,dy,.021,.0324,.0020,brass,bright);disc(face,dx,dy,.022,.027,.008,'#343d38',rubber);
    const dial=group(face,dx,dy,.024);
    disc(dial,0,0,.006,.0278,.015,'#303733',rubber,64);disc(dial,0,0,.0144,.0253,.0030,'#3f4740',rubber,64);
    for(let i=0;i<34;i++){const a=TAU*i/34;box(dial,Math.sin(a)*.0269,Math.cos(a)*.0269,.0079,.0026,.0022,.0122,'#515951',rubber,[0,0,-a]);}
    tor(dial,0,0,.0154,.0233,.0010,'#74786c',steel);tor(dial,0,0,.0160,.0163,.0005,'#555d54',rubber);
    box(dial,0,.017,.0164,.0020,.0135,.0010,bone,enamel);disc(dial,0,0,.0159,.0072,.0024,'#62695e',steel,32);
    for(const x of [-.117,.117])for(const [z,h] of [[-.024,.013],[.064,.028]]){box(root,x,h/2,z,.025,h,.028,dark,rubber);box(root,x,.0024,z,.029,.0048,.031,seal,rubber);}
    // Neoprene thumb key travels into a gasket. A knuckle guard protects both ends against the companionway wall.
    const key=group(face,-.152,-.003,-.007);
    box(face,-.151,-.004,-.007,.009,.081,.036,'#29342e',rubber);
    for(const y of [-.047,.042])box(face,-.153,y,-.007,.018,.007,.043,olive2,enamel,[0,0,y<0?.10:-.10]);
    box(key,-.0055,0,0,.014,.067,.031,'#63483b',rubber);box(key,-.0128,0,0,.0022,.056,.026,'#8f5e47',rubber);
    for(let i=0;i<8;i++)box(key,-.0141,-.0245+i*.0070,.0006,.0016,.0020,.024,'#a17453',rubber);
    // Rubber-ended folding handle on real hinge lugs mounted on the top casting.
    for(const x of [-.077,.069]){
      box(face,x,.098,-.061,.018,.016,.032,olive2,enamel);tube(face,[x-.012,.103,-.058],[x+.012,.103,-.058],.0065,brass,bright);
    }
    tube(face,[-.077,.104,-.058],[-.078,.132,-.078],.0045,alu,steel);
    tube(face,[.069,.104,-.058],[.070,.132,-.078],.0045,alu,steel);
    tube(face,[-.078,.132,-.078],[.070,.132,-.078],.0055,alu,bright,20);
    tube(face,[-.064,.132,-.078],[.057,.132,-.078],.0088,'#514a39',rubber,26);
    for(let j=0;j<16;j++){const x=-.061+j*.0077;tube(face,[x,.132,-.078],[x+.0013,.132,-.078],.0090,j%4?'#635840':'#79705b',rubber,22);}
    // Spring whip folds against the back so both hands remain clear of the tuner.
    const aero=[.110,.108,-.09],tip=[.140,.315,-.167];tube(face,[.110,.086,-.085],aero,.010,iron,steel,20);
    const A=V(...aero),B=V(...tip),P=V(),Q=V();
    for(const [a,b,r,co,mat] of [[0,.078,.0074,brass,bright],[.078,.29,.0046,dark,rubber],[.29,.80,.00218,'#97998c',bright],[.80,.985,.00155,'#aaafa3',bright],[.985,1,.0029,dark,rubber]]){
      P.lerpVectors(A,B,a);Q.lerpVectors(A,B,b);tube(face,P.toArray(),Q.toArray(),r,co,mat,16);
    }
    for(let j=0;j<9;j++){const a=.083+.019*j;P.lerpVectors(A,B,a);Q.lerpVectors(A,B,a+.009);tube(face,P.toArray(),Q.toArray(),.0052,'#51564a',rubber,16);}
    // The builder's plate, side carry eyes and salt streaks remain visible to the player behind the radio.
    const serial=art(480,252,(c,w,h)=>{c.fillStyle='#888b79';c.fillRect(0,0,w,h);c.fillStyle='#4f5b50';c.fillRect(11,11,w-22,h-22);
      c.strokeStyle='#afb099';c.lineWidth=2;c.strokeRect(17,17,w-34,h-34);letter(c,'北岬港务工段',w/2,60,43,'serif','#d3cfac');
      c.fillStyle='#a8a88b';c.fillRect(49,98,w-98,2);letter(c,'船岸电台   ·   047',w/2,145,38,'sans-serif','#d5d1b4');
      letter(c,'12 V    防泼水',w/2,202,27,'monospace','#afb59e');
      for(let j=0;j<580;j++){c.fillStyle=j%4?'#aba88f44':'#59524055';c.fillRect(random()*w,random()*h,2+random()*4,random()*2);}
    });
    const side=group(face,.1519,-.022,-.064);side.rotation.y=Math.PI/2;side.userData.bakeInto=face;
    box(side,0,0,0,.069,.037,.0013,'#707b6d',steel);graphic(side,0,0,.00084,.067,.034,serial);
    for(const x of [-.0305,.0305])for(const y of [-.0132,.0132])screw(side,x,y,.001,.0018,x*41+y*11);
    for(const sign of [-1,1]){const x=sign*.150;
      box(face,x,.050,-.081,.006,.029,.032,iron,steel);tube(face,[x,.052,-.094],[x+sign*.009,.052,-.094],.0034,alu,bright);
      tube(face,[x+sign*.009,.052,-.094],[x+sign*.009,.052,-.068],.0034,alu,bright);tube(face,[x+sign*.009,.052,-.068],[x,.052,-.068],.0034,alu,bright);}
    const track=art(350,200,(c,w,h)=>{c.fillStyle='#c0b691';c.fillRect(0,0,w,h);c.strokeStyle='#354136';c.lineWidth=4;c.strokeRect(10,10,w-20,h-20);
      letter(c,'电池仓',w/2,63,48,'sans-serif','#374337');letter(c,'扣紧再出港',w/2,134,39,'serif','#42483c');
      for(let j=0;j<160;j++){c.fillStyle='#4d4f3955';c.fillRect(random()*w,random()*h,2+random()*3,random()*2);}
    });
    const rearLabel=group(face,-.037,.019,-.146);rearLabel.rotation.y=Math.PI;rearLabel.userData.bakeInto=face;graphic(rearLabel,0,0,0,.058,.030,track);
    // Rear batteries, pack clasp and drains remain modelled for the other player's view.
    shell(face,0,-.011,[[.212,.112,.010,-.141],[.221,.12,.013,-.138],[.221,.12,.013,-.135]],'#45544b',enamel);
    for(const x of [-.104,.104]){box(face,x,.002,-.143,.012,.042,.009,alu,steel);box(face,x,.014,-.148,.016,.011,.004,iron,steel);}
    for(let j=0;j<4;j++)box(face,0,-.038+j*.014,-.144,.125,.0022,.004,olive2,enamel);
    const pilotMat=(co)=>own(new T.MeshStandardMaterial({color:co,emissive:co,roughness:.22,metalness:.08,emissiveIntensity:0}));
    const receive=pilotMat(0x95ae76),transmit=pilotMat(0xd46c47),lensGeo=own(new T.SphereGeometry(1,16,10,0,TAU,0,Math.PI/2));
    for(const [x,mat] of [[.003,receive],[.036,transmit]]){const y=-.051;disc(face,x,y,.017,.0095,.006,iron,steel,28);tor(face,x,y,.020,.0074,.0014,brass,bright);
      const lens=new T.Mesh(lensGeo,mat);lens.position.set(x,y,.0195);lens.scale.set(.0067,.0038,.0067);lens.rotation.x=Math.PI/2;face.add(lens);}
    // Two millimetres of pooled rain at the handle cleats, switch foot and meter rim.
    const dropMat=own(new T.MeshPhysicalMaterial({color:0x91a69b,roughness:.12,metalness:.32,clearcoat:1,transparent:true,opacity:.36,depthWrite:false,vertexColors:true}));
    const bead=form(new T.SphereGeometry(1,9,6));for(let j=0;j<27;j++){const x=(random()-.5)*.270,y=j%3?.076+random()*.016:-.083+random()*.005,r=.00038+random()**2*.0013;add(face,bead,dropMat,0xb6c4b4,x,y,.0133,r,r*(1.0+random()*.9),r*.5);}
    for(const [par,set] of batches)for(const [mat,b] of set){const g=own(new T.BufferGeometry());for(const [key,data,size] of [['position',b.p,3],['normal',b.n,3],['color',b.c,3],['uv',b.uv,2]])g.setAttribute(key,new T.Float32BufferAttribute(data,size));
      g.setIndex(b.i);g.computeBoundingSphere();const m=new T.Mesh(g,mat);m.castShadow=!mat.transparent;m.receiveShadow=!mat.transparent;if(mat.transparent)m.renderOrder=2;par.add(m)}
    for(const g of forms)g.dispose();forms.clear();batches.clear();side.removeFromParent();rearLabel.removeFromParent();
    // Contacts sit on the moving boot and the front edge of the real tuning knob.
    const left=group(key,-.014,.000,.0068),right=group(dial,.018,.015,.0166),keySupport=group(face,-.121,-.042,.010),tuneSupport=group(face,.125,-.050,.012);
    const markers={left,right,ptt:left,tune:right,keySupport,tuneSupport};root.userData.radioContacts=markers;
    let previousTime=null,lastStep=-1,level=0,press=0,velocity=0,previousCtx,lastClick=-Infinity,disposed=false;
    function click(s,step){
      if(typeof s.onDetent==='function'){s.onDetent(step,6+step);return}
      const ctx=s.audioContext,master=s.audioDestination;if(!ctx||!master||ctx.state!=='running'||s.muted)return;
      if(previousCtx!==ctx){previousCtx=ctx;lastClick=-Infinity}
      const at=ctx.currentTime;if(at-lastClick<.016)return;lastClick=at;
      const a=ctx.createOscillator(),b=ctx.createGain(),c=ctx.createOscillator(),d=ctx.createGain();
      a.type='triangle';a.frequency.setValueAtTime(2050+step*38,at);a.frequency.exponentialRampToValueAtTime(680,at+.012);
      b.gain.setValueAtTime(.029,at);b.gain.exponentialRampToValueAtTime(.0001,at+.019);
      c.type='sine';c.frequency.setValueAtTime(470+step*7,at+.001);c.frequency.exponentialRampToValueAtTime(173,at+.031);d.gain.setValueAtTime(.021,at+.001);d.gain.exponentialRampToValueAtTime(.0001,at+.037);
      a.connect(b).connect(master);c.connect(d).connect(master);a.onended=()=>{a.disconnect();b.disconnect()};c.onended=()=>{c.disconnect();d.disconnect()};a.start(at);a.stop(at+.020);c.start(at+.001);c.stop(at+.038);
    }
    function update(state={},t=0){
      const s=state||{},dt=previousTime===null?0:Math.max(0,Math.min(.08,t-previousTime));const init=previousTime===null||t<previousTime;previousTime=t;
      const tuning=clamp(Number.isFinite(s.tune)?s.tune:.5),down=clamp(Number(s.ptt)||0),powered=s.power!==false,signal=powered?clamp(Number(s.level)||0):0;
      const step=Math.round(tuning*10);if(!init&&lastStep!==-1&&step!==lastStep&&!s.silent)click(s,step);lastStep=step;
      // End-stops are ±118 degrees about the panel normal. The glass hairline reads the same channel as the notch.
      dial.rotation.z=(.5-tuning)*236*Math.PI/180;hair.position.x=bx+(tuning-.5)*.10237;
      if(init){press=down;velocity=0;level=signal}else if(dt){const k=39,e=Math.exp(-k*dt),d=press-down;press=down+(d+(velocity+k*d)*dt)*e;velocity=(velocity-k*(velocity+k*d)*dt)*e;
        level+=(signal-level)*(1-Math.exp(-dt*(signal>level?20:7)))}
      key.position.x=-.152+press*.0051;key.rotation.z=-.033*press;
      needle.rotation.z=(1-2*level)*.99;
      const receiving=powered&&!!s.rx,sending=powered&&(s.tx===undefined?down>.5:!!s.tx);
      receive.color.setHex(receiving?0x8ba674:0x384337);receive.emissiveIntensity=receiving?1.10+signal*.44:0;
      transmit.color.setHex(sending?0xd46c47:0x4d2923);transmit.emissiveIntensity=sending?1.29:0;
    }
    function contacts(){return [left.getWorldPosition(V()),right.getWorldPosition(V())]}
    update({},0);previousTime=null;
    return {root,update,contacts,markers,dispose(){if(disposed)return;disposed=true;root.removeFromParent();root.clear();for(const a of assets)a.dispose();assets.clear();}};
  }
  return {create};
})();
