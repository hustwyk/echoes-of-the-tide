// Original 34-centimetre homebuilt electric launches. All textures are painted locally at first use.
const TideRegattaBoats=(()=>{
  const T=THREE,TAU=2*Math.PI,V=(x=0,y=0,z=0)=>new T.Vector3(x,y,z),clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),up=V(0,1,0);
  let bank=null;
  function build(){
    const assets=new Set(),own=o=>(assets.add(o),o),forms=new Set(),form=o=>(forms.add(o),o);
    const art=document.createElement('canvas');art.width=2048;art.height=1024;const c=art.getContext('2d');
    let seed=4372991;const rng=()=>((seed=(Math.imul(1664525,seed)+1013904223)>>>0)/4294967296);
    const decks=[[3,3,502,1018],[512,3,502,1018]],sides=[[1022,3,1022,220],[1022,228,1022,220]],flags=[[1024,457,470,188],[1502,457,538,188]],
      hatch=[[1025,652,447,362],[1480,652,338,362]],timber=[1825,652,215,123],labels=[[1825,781,215,112],[1825,901,215,114]];
    function region(r,draw){const [x,y,w,h]=r;c.save();c.translate(x,y);c.beginPath();c.rect(0,0,w,h);c.clip();draw(w,h);c.restore();}
    function pixels(w,h,fn){const im=c.createImageData(w,h);for(let y=0;y<h;y++)for(let x=0;x<w;x++){const value=fn(x,y);const j=(y*w+x)*4;im.data[j]=value[0];im.data[j+1]=value[1];im.data[j+2]=value[2];im.data[j+3]=255;}
      const layer=document.createElement('canvas');layer.width=w;layer.height=h;layer.getContext('2d').putImageData(im,0,0);c.drawImage(layer,0,0);}
    function line(pts,color,width=1){c.strokeStyle=color;c.lineWidth=width;c.beginPath();for(let j=0;j<pts.length;j++)j?c.lineTo(...pts[j]):c.moveTo(...pts[j]);c.stroke();}
    function text(s,x,y,px,co,font='sans-serif',weight=640,align='center'){c.fillStyle=co;c.textAlign=align;c.textBaseline='middle';c.font=weight+' '+px+'px '+font;c.fillText(s,x,y);}
    function woodbase(w,h,base,cross=false){
      pixels(w,h,(x,y)=>{const u=cross?y:x,v=cross?x:y,grain=u+2.5*Math.sin(v*.011+u*.018)+.8*Math.sin(v*.051+u*.07);
        const late=Math.pow(.5+.5*Math.sin(grain*.33+2*Math.sin(grain*.047)),8),amber=Math.sin(grain*.046+v*.0009)*6,split=3*Math.sin(u*2.6+v*.013)+(rng()-.5)*12,val=amber+split;
        return[base[0]+val-late*18,base[1]+val-late*19,base[2]+val-late*13]});
      for(let j=0;j<w*h/730;j++){const x=rng()*w,y=rng()*h;c.strokeStyle=j%7?'rgba(65,44,28,.14)':'rgba(239,222,183,.27)';c.lineWidth=.6+rng()*1.6;c.beginPath();c.moveTo(x,y);c.lineTo(x+(cross?rng()*16:rng()*1.8),y+(cross?rng()*1.8:rng()*21));c.stroke();}}
    function ringText(n,x,y,r,bg,fg,diamond=false){c.save();c.translate(x,y);c.fillStyle=bg;c.strokeStyle=fg;c.lineWidth=Math.max(2,r*.041);c.beginPath();
      if(diamond){c.moveTo(0,-r);c.quadraticCurveTo(4,-r-2,r*.90,-r*.16);c.quadraticCurveTo(r*1.07,0,r*.89,r*.16);c.lineTo(0,r);c.lineTo(-r*.89,r*.16);c.quadraticCurveTo(-r*1.07,0,-r*.89,-r*.16);c.closePath();}
      else c.ellipse(0,0,r*.96,r,0,0,TAU);c.fill();c.stroke();
      // Hand-cut brush numbers have a split downstroke and deliberately imperfect paint edges.
      c.strokeStyle=fg;c.lineJoin='round';c.lineCap='square';c.lineWidth=r*.185;
      if(n===1){c.beginPath();c.moveTo(-r*.28,-r*.30);c.lineTo(.025*r,-.60*r);c.lineTo(.08*r,.57*r);c.stroke();line([[-.25*r,.58*r],[.35*r,.56*r]],fg,r*.114);}
      else{c.beginPath();c.moveTo(-.32*r,-.29*r);c.bezierCurveTo(-.36*r,-.66*r,.36*r,-.70*r,.34*r,-.27*r);c.bezierCurveTo(.33*r,.01*r,-.21*r,.27*r,-.29*r,.55*r);c.lineTo(.36*r,.55*r);c.stroke();}
      c.restore();}
    for(let k=0;k<2;k++)region(decks[k],(w,h)=>{
      woodbase(w,h,k?[131,158,143]:[181,135,77]);
      if(!k){for(let j=-1;j<9;j++){const x=j*69+11;line([[x-.9,0],[x+2,h*.38],[x,h]],'#4c3828',2.7);line([[x+2,0],[x+4,h]],'#c3a27a',1);}
        c.fillStyle='rgba(222,196,144,.15)';c.fillRect(31,0,61,h);c.fillRect(308,0,34,h);c.fillStyle='#554133';c.fillRect(w*.095,0,4,h);c.fillRect(w*.895,0,4,h);
        ringText(1,w*.50,h*.263,87,'#e5d6ac','#6b422c');}
      else{
        c.fillStyle='rgba(64,111,107,.58)';c.fillRect(0,0,w,h);for(let j=0;j<5;j++){const x=52+j*92;line([[x,0],[x+2,h*.42],[x-1,h]],'#58706a',2);}
        c.fillStyle='#c1cdb0';c.beginPath();c.moveTo(w*.44,0);c.lineTo(w*.18,h*.59);c.lineTo(w*.23,h*.58);c.lineTo(w*.52,0);c.fill();
        c.fillStyle='#468787';c.beginPath();c.moveTo(w*.54,0);c.lineTo(w*.76,h*.68);c.lineTo(w*.82,h*.71);c.lineTo(w*.60,0);c.fill();
        ringText(2,w*.50,h*.26,89,'#244c55','#e2dec1',true);}
      const grainScratches=390;for(let j=0;j<grainScratches;j++){const x=rng()*w,y=rng()*h;c.strokeStyle=j%5?'rgba(83,70,45,.14)':'rgba(217,201,165,.42)';c.lineWidth=rng()*1.1+.5;c.beginPath();c.moveTo(x,y);c.lineTo(x+rng()*2.5,y+1+rng()**2*18);c.stroke();}
      c.save();c.translate(w*(k?.54:.58),h*(k?.873:.920));c.rotate(k?-.051:.027);text(k?'沈 遥':'林 澈',0,0,35,k?'#d6d1ac':'#69482c','"Kaiti SC",serif',550);text('1998',0,33,23,k?'#d6d1ac':'#684c34','serif',550);c.restore();
    });
    for(let k=0;k<2;k++)region(sides[k],(w,h)=>{const upper=k?[69,125,125]:[213,193,150],lower=k?[43,68,77]:[98,65,43],stripe=k?[169,192,168]:[195,138,62];
      pixels(w,h,(x,y)=>{const seam=120+1.2*Math.sin(x*.014),row=y<seam?upper:y<seam+12?stripe:lower;
        const endgrain=2.7*Math.sin(y*.43+.8*Math.sin(x*.017))+.9*Math.sin(x*.056+y*.16),wear=(rng()-.50)*13+endgrain+Math.cos(y*.09+x*.005)*2;return row.map(v=>v+wear)});
      line([[0,119],[w*.3,120],[w,119]],k?'#cfd6bc':'#eee0bd',2.3);
      ringText(k+1,w*.53,64,39,k?'#214d56':'#dcc9a1',k?'#dadcbd':'#705036',!!k);
      for(let j=0;j<330;j++){const x=rng()*w,y=rng()*h;c.strokeStyle=y>124?'rgba(201,187,147,.23)':'rgba(99,76,47,.20)';c.lineWidth=rng()*1.4+.5;c.beginPath();c.moveTo(x,y);c.lineTo(x+2+rng()**2*25,y+rng()*2-1);c.stroke();}
      for(let j=0;j<13;j++){const x=20+j*82;c.fillStyle='rgba(89,77,54,.45)';c.beginPath();c.arc(x,28,1.5,0,TAU);c.fill();}
    });
    for(let k=0;k<2;k++)region(flags[k],(w,h)=>{pixels(w,h,(x,y)=>{const weave=(x%5<1?7:0)+(y%4===0?-8:0)+(rng()-.5)*15;return(k?[70,133,129]:[206,155,66]).map(v=>v+weave)});
      c.fillStyle=k?'#e1dbbd':'#eee0ba';c.beginPath();c.moveTo(w*.08,0);c.lineTo(w*.25,0);c.lineTo(w*.73,h);c.lineTo(w*.56,h);c.fill();
      line([[w*.062,0],[w*.062,h]],'#71694f',4);c.setLineDash([5,5]);line([[w*.09,0],[w*.09,h]],'#d7d1b6',2);c.setLineDash([]);});
    for(let k=0;k<2;k++)region(hatch[k],(w,h)=>{woodbase(w,h,k?[118,149,135]:[146,104,64]);c.strokeStyle=k?'#afbd9f':'#987753';c.lineWidth=4;c.strokeRect(12,12,w-24,h-24);
      for(const x of [19,w-19])for(const y of [20,h-20]){c.fillStyle='#8a8164';c.beginPath();c.arc(x,y,4,0,TAU);c.fill();}
      c.save();c.translate(w*.5,h*.49);c.rotate(k?.043:-.03);text(k?'2':'1',0,0,h*.55,k?'#dbcfa7':'#d9c496','serif',670);c.restore();});
    region(timber,(w,h)=>woodbase(w,h,[173,139,92],true));
    for(let k=0;k<2;k++)region(labels[k],(w,h)=>{pixels(w,h,(x,y)=>{const q=(rng()-.50)*21+3*Math.cos(x*.08+y*.11);return[206+q,200+q,171+q]});
      c.strokeStyle=k?'#486d61':'#7b6756';c.lineWidth=2;c.strokeRect(5,5,w-10,h-10);
      text('药房分装',w/2,h*.36,30,k?'#426453':'#655247','serif',660);line([[14,h*.57],[w-14,h*.57]],'#777a60',1.5);
      text('98  ·  04',w*.50,h*.75,18,'#666756','serif',560);
      for(let j=0;j<90;j++){const x=rng()*w,y=rng()*h;c.fillStyle='rgba(92,83,61,.11)';c.fillRect(x,y,1+rng()*2,rng()*2+.5);}
    });
    const atlas=own(new T.CanvasTexture(art));atlas.colorSpace=T.SRGBColorSpace;atlas.anisotropy=8;
    const finishC=document.createElement('canvas');finishC.width=768;finishC.height=384;const gc=finishC.getContext('2d');gc.drawImage(art,0,0,768,384);
    const micro=gc.getImageData(0,0,768,384),saved=micro.data.slice();for(let y=0;y<384;y++)for(let x=0;x<768;x++){
      const j=(y*768+x)*4,n=(y*768+Math.max(0,x-1))*4,edge=Math.min(60,Math.abs(saved[j]-saved[n])*.65),grey=176+edge+(rng()-.5)*26+4*Math.sin(y*.19+2*Math.sin(x*.09));
      micro.data.set([grey,grey,grey,255],j);}gc.putImageData(micro,0,0);const rough=own(new T.CanvasTexture(finishC));rough.anisotropy=4;
    const coat=own(new T.MeshPhysicalMaterial({map:atlas,roughnessMap:rough,bumpMap:rough,bumpScale:.000065,vertexColors:true,roughness:.78,metalness:.035,clearcoat:.35,clearcoatRoughness:.36}));
    const detail=own(new T.MeshStandardMaterial({vertexColors:true,roughness:.50,metalness:.27})),metal=own(new T.MeshStandardMaterial({vertexColors:true,roughness:.35,metalness:.69}));
    const cloth=own(new T.MeshStandardMaterial({map:atlas,side:T.DoubleSide,roughness:.9,metalness:0,vertexColors:false}));
    const clear=[0xb98543,0x54848a].map(color=>own(new T.MeshPhysicalMaterial({color,side:T.FrontSide,transparent:true,opacity:.74,roughness:.20,metalness:.06,clearcoat:1,clearcoatRoughness:.15,depthWrite:false})));
    function PUV(r,u,v){return[(r[0]+2+clamp(u,0,1)*(r[2]-4))/2048,1-(r[1]+2+clamp(v,0,1)*(r[3]-4))/1024]}
    function group(p,x=0,y=0,z=0,name=''){const o=new T.Group();o.position.set(x,y,z);o.name=name;if(p)p.add(o);return o}
    const batch=new Map(),cube=form(new T.BoxGeometry(1,1,1)),cyls=new Map(),qt=new T.Quaternion(),v=V(),pnt=V(),nrm=V(),nm=new T.Matrix3(),frame=new T.Object3D(),color=new T.Color();
    const cylinder=k=>{if(!cyls.has(k))cyls.set(k,form(new T.CylinderGeometry(1,1,1,k)));return cyls.get(k)};
    function geometry(pos,idx,uv){const g=form(new T.BufferGeometry());g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setIndex(idx);if(uv)g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.computeVertexNormals();return g}
    function add(o,g,m,col=0xffffff,pos=[0,0,0],size=[1,1,1],rot=null,slot=null){
      if(!batch.has(o))batch.set(o,new Map());const ms=batch.get(o);if(!ms.has(m))ms.set(m,{p:[],n:[],uv:[],c:[],ix:[]});const b=ms.get(m),base=b.p.length/3,a=g.attributes;
      frame.position.fromArray(pos);frame.scale.fromArray(size);if(rot?.isQuaternion)frame.quaternion.copy(rot);else frame.rotation.set(...(rot||[0,0,0]));frame.updateMatrix();nm.getNormalMatrix(frame.matrix);color.set(col);
      for(let j=0;j<a.position.count;j++){pnt.fromBufferAttribute(a.position,j).applyMatrix4(frame.matrix);nrm.fromBufferAttribute(a.normal,j).applyNormalMatrix(nm);b.p.push(pnt.x,pnt.y,pnt.z);b.n.push(nrm.x,nrm.y,nrm.z);b.c.push(color.r,color.g,color.b);
        if(slot)b.uv.push(...PUV(slot,a.uv?.getX(j)||0,1-(a.uv?.getY(j)||0)));else if(a.uv)b.uv.push(a.uv.getX(j),a.uv.getY(j));else b.uv.push(0,0);}
      const ix=g.index;for(let j=0,l=ix?.count||a.position.count;j<l;j++)b.ix.push(base+(ix?ix.getX(j):j));}
    const box=(o,x,y,z,w,h,d,c,m=detail,rot=null,slot=null)=>add(o,cube,m,c,[x,y,z],[w,h,d],rot,slot);
    function rod(o,a,b,r,c,m=metal,k=10){const A=V(...a),B=V(...b);v.subVectors(B,A);const len=v.length();qt.setFromUnitVectors(up,v.multiplyScalar(1/len));add(o,cylinder(k),m,c,A.lerp(B,.5).toArray(),[r,len,r],qt)}
    function disc(o,x,y,z,r,h,c,axis='y',m=metal,k=24){add(o,cylinder(k),m,c,[x,y,z],[r,h,r],axis==='x'?[0,0,Math.PI/2]:axis==='z'?[Math.PI/2,0,0]:null)}
    function cord(o,points,r,c,m=metal,k=6,segments=null){const g=form(new T.TubeGeometry(new T.CatmullRomCurve3(points.map(q=>V(...q))),segments||Math.max(6,points.length*3),r,k,false));add(o,g,m,c)}
    const sidesGeo=[[-.170,0,.065,-.002],[-.158,.013,.063,-.017],[-.138,.030,.062,-.025],[-.112,.044,.059,-.032],[-.078,.057,.055,-.035],[-.040,.065,.052,-.036],[0,.069,.050,-.036],[.039,.068,.049,-.035],[.079,.065,.049,-.033],[.116,.061,.050,-.029],[.146,.056,.051,-.024],[.170,.052,.052,-.020]];
    const sharp=[[-.170,0,.071,.001],[-.157,.009,.067,-.015],[-.137,.021,.063,-.025],[-.110,.034,.059,-.033],[-.078,.047,.056,-.036],[-.039,.060,.053,-.037],[.002,.067,.051,-.036],[.042,.069,.050,-.034],[.083,.066,.050,-.030],[.122,.059,.050,-.026],[.151,.048,.051,-.021],[.170,.040,.052,-.018]];
    const prototypes=[];
    function unit(k){
      const o=group(null,0,0,0,k?'二号 · 蓝绿瓶盖艇':'一号 · 琥珀瓶盖艇'),stations=k?sharp:sidesGeo;
      const brass='#aa8b5d',nickel='#a7b0a5',brown='#594731',dark='#38413c',ivory='#d7cfaf',accent=k?'#437e79':'#b78542';
      const camber=k?.0052:.0031;
      function deckAt(z,x=0){let j=0;while(j<stations.length-2&&stations[j+1][0]<z)j++;const a=stations[j],b=stations[j+1],t=clamp((z-a[0])/(b[0]-a[0]),0,1),w=a[1]+(b[1]-a[1])*t;
        return a[2]+(b[2]-a[2])*t+camber*(1-clamp(Math.abs(x)/Math.max(.0001,w),0,1)**2);}
      function prof(st,j){const [z,w,y,keel]=st;return (k?[[0,keel],[.52*w,keel*.67],[.82*w,.0004],[.937*w,.011],[w,y-.013],[.985*w,y]]:
        [[0,keel],[.57*w,keel*.65],[.88*w,-.004],[.969*w,.008],[w,y-.011],[.986*w,y]])[j];}
      for(const sign of [-1,1])for(let band=0;band<5;band++){const pos=[],uv=[],ix=[];
        for(let j=0;j<stations.length;j++){const st=stations[j],z=st[0];for(const h of [band,band+1]){const [x,y]=prof(st,h);pos.push(sign*x,y,z);uv.push(...PUV(sides[k],sign>0?.5-z/.34:.5+z/.34,(.064-y)/.106));}
          if(j){const a=j*2-2;const tris=[a,a+1,a+3,a,a+3,a+2];if(sign<0)for(let v=0;v<6;v+=3)[tris[v+1],tris[v+2]]=[tris[v+2],tris[v+1]];ix.push(...tris);}}
        add(o,geometry(pos,ix,uv),coat);}
      // The painted planks lie on a cambered balsa shell; a wide stern and a fine, rising forefoot distinguish the two carvings.
      {const pos=[],uv=[],ix=[],sections=8;for(let j=0;j<stations.length;j++){const [z,w]=stations[j];for(let h=0;h<=sections;h++){const x=(2*h/sections-1)*w*.986;pos.push(x,deckAt(z,x),z);uv.push(...PUV(decks[k],.5+x/.14,.5+z/.34));}
        if(j)for(let h=0;h<sections;h++){const a=(j-1)*(sections+1)+h,b=a+sections+1;ix.push(a,b,a+1,a+1,b,b+1);}}add(o,geometry(pos,ix,uv),coat);}
      function transom(){const st=stations.at(-1),pts=[],p=[],uv=[],ix=[];for(let i=0;i<6;i++){const [x,y]=prof(st,i);pts.push([x,y]);}pts.push([0,deckAt(st[0])]);for(let i=5;i>0;i--){const [x,y]=prof(st,i);pts.push([-x,y]);}
        p.push(0,.015,.170);uv.push(...PUV(sides[k],.82,.47));for(const [x,y] of pts){p.push(x,y,.170);uv.push(...PUV(sides[k],.82+x*2,(.064-y)/.106));}
        for(let i=0;i<pts.length;i++)ix.push(0,1+i,1+(i+1)%pts.length);add(o,geometry(p,ix,uv),coat);}transom();
      // Laminated gunwales and stem band carry wear at their outermost edge.
      for(const s of [-1,1]){const path=stations.map(([z,w,y])=>[s*w*.989,y-.0023,z]);cord(o,path,.0018,k?'#acb3a0':'#b79b68',detail,5,38);
        const rub=stations.slice(1).map(([z,w,y])=>[s*w*.999,y-.012,z]);cord(o,rub,.00125,k?'#355852':'#735a3b',detail,5,32);}
      cord(o,stations.slice(0,5).map(([z,w,y,keel])=>[0,keel+.0008,z]),.00125,'#947c52',metal,6,18);
      const hatchZ=k?.091:.105,hatchW=k?.068:.080,hatchD=k?.062:.070,yh=deckAt(hatchZ)+.002;
      box(o,0,yh-.0001,hatchZ,hatchW+.003,.003,hatchD+.003,'#4c5043');box(o,0,yh+.0014,hatchZ,hatchW,.0032,hatchD,'#f0e3bd',coat,null,hatch[k]);
      function topLabel(r,x,y,z,w,d){const p=[x-w/2,y,z+d/2,x+w/2,y,z+d/2,x+w/2,y,z-d/2,x-w/2,y,z-d/2],uv=[];for(const [a,b]of[[0,1],[1,1],[1,0],[0,0]])uv.push(...PUV(r,a,b));add(o,geometry(p,[0,1,2,0,2,3],uv),coat);}
      topLabel(hatch[k],0,yh+.00310,hatchZ,hatchW-.002,hatchD-.002);
      for(const s of [-1,1])for(const f of [-1,1]){
        const x=s*(hatchW*.5-.006),z=hatchZ+f*(hatchD*.5-.006);disc(o,x,yh+.0039,z,.00175,.0011,brass,'y',metal,10);
        box(o,x,yh+.00449,z,.0021,.00016,.00049,dark,detail,[0,(s-f)*.37,0]);}
      // Re-used medicine bottle, its screw neck and the roughed-up injection-moulded closure.
      const cy=k?.063:.060,centreZ=k?.005:.009,ax=k?1:-1,bodyX=k?.0285:.025,bodyY=k?.023:.0205;
      function bottle(profile,m,co){const nx=42,p=[],uv=[],idx=[];for(let j=0;j<profile.length;j++){const [z,r]=profile[j];for(let a=0;a<=nx;a++){const theta=TAU*a/nx;
          p.push(Math.cos(theta)*bodyX*r,cy+Math.sin(theta)*bodyY*r,centreZ+z*ax);uv.push(a/nx,j/(profile.length-1));}
        if(j)for(let i=0;i<nx;i++){const a=(j-1)*(nx+1)+i,b=a+nx+1;const f=[a,a+1,b+1,a,b+1,b];if(ax<0)for(let n=0;n<6;n+=3)[f[n+1],f[n+2]]=[f[n+2],f[n+1]];idx.push(...f);}}add(o,geometry(p,idx,uv),m,co);}
      bottle([[-.042,.01],[-.041,.78],[-.038,.98],[-.033,1],[.023,1],[.029,.94],[.036,.69],[.039,.68],[.040,.01]],clear[k],'#ffffff');
      // A torn remnant of the dispensary label hugs the salvaged bottle instead of floating above it.
      {const p=[],uv=[],ix=[],rows=7,cols=7;
        for(let j=0;j<=rows;j++)for(let i=0;i<=cols;i++){const u=i/cols,f=j/rows;
          const ang=k?Math.PI-(.19+f*.88):.19+f*.88;
          const tear=(j===rows||j===0)?.0013*Math.sin(i*2.37):0;
          const z=-.026+.033*u+(k?.0011:-.0010)*Math.sin(f*5+u*2);
          p.push(Math.cos(ang)*(bodyX+.00050),cy+Math.sin(ang)*(bodyY+.00050)+tear*.2,centreZ+z);
          uv.push(...PUV(labels[k],k?u:1-u,1-f));}
        for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){const a=j*(cols+1)+i,t=[a,a+cols+1,a+1,a+1,a+cols+1,a+cols+2];if(k)for(let n=0;n<6;n+=3)[t[n+1],t[n+2]]=[t[n+2],t[n+1]];ix.push(...t);}
        add(o,geometry(p,ix,uv),coat);}
      // Small motor, battery and copper leads are visible through the amber/blue fairing.
      disc(o,0,cy-.0007,centreZ,.0120,.051,'#93968a','z',metal,26);box(o,k?.011:-.009,cy-.003,centreZ-.012,.009,.011,.04,k?'#52645c':'#987859',detail);
      for(const s of [-1,1]){const x=s*.011;cord(o,[[x,cy+.002,centreZ+.017],[x+s*.004,cy+.006,centreZ+.03],[x+s*.007,.057,.064],[s*.018,.055,.079]],.0009,s>0?'#965a44':'#434c46',detail,6,12);}
      const capZ=centreZ+.044*ax,cap=k?'#c2c3a8':'#e1d4ae';
      disc(o,0,cy,capZ,.0202,.013,cap,'z',detail,48);
      for(let i=0;i<28;i++){const a=TAU*i/28;box(o,.0198*Math.cos(a),cy+.0198*Math.sin(a),capZ,.0018,.0010,.0105,k?'#d2d0b5':'#eee1bc',detail,[0,0,a]);}
      disc(o,0,cy,capZ+.0068*ax,.0187,.0012,k?'#a5ad97':'#d1bd96','z',detail,40);
      for(const f of [-1,1]){const z=centreZ+f*.023;const pts=[];for(let j=0;j<=16;j++){const a=-.11+j*(Math.PI+.22)/16;pts.push([Math.cos(a)*(bodyX+.0007),cy+Math.sin(a)*(bodyY+.0007),z]);}
        cord(o,pts,.00115,f===1?'#978e70':'#b8ae90',metal,6,16);
        for(const s of [-1,1]){const x=s*(bodyX+.0024);box(o,x,deckAt(z,x)+.0016,z,.006,.0024,.007,brass,metal);disc(o,x,deckAt(z,x)+.0033,z,.0012,.0009,nickel,'y',metal,8);}}
      // Forward towing eye, aft mooring cleats and a child's taped aerial are genuine miniature fittings.
      cord(o,[[-.0021,.059,-.145],[-.0018,.066,-.145],[0,.068,-.150],[.0022,.066,-.148],[.0022,.059,-.145]],.00085,brass,metal,7,14);
      for(const s of [-1,1]){const x=s*.039,z=.132,y=deckAt(z,x);box(o,x,y+.001,z,.006,.0018,.013,brass,metal);disc(o,x,y+.004,z,.0015,.006,nickel,'y',metal,10);
        rod(o,[x,y+.007,z-.0065],[x,y+.007,z+.0065],.00125,nickel,metal,8);}
      // Brass drain plug and countersunk hand-drill marks on the thin transom board.
      disc(o,k?-.024:.024,.007,.1705,.0036,.0014,brass,'z',metal,16);
      box(o,k?-.024:.024,.007,.1713,.0042,.0007,.0003,dark,detail,[0,0,k?.26:-.19]);
      for(const sign of [-1,1]){disc(o,sign*(k?.030:.041),.036,.1706,.00175,.0011,nickel,'z',metal,9);}
      const mastX=k?.034:-.038,mastZ=.088,mastY=deckAt(mastZ,mastX);
      disc(o,mastX,mastY+.002,mastZ,.0041,.0032,brass,'y',metal,16);
      rod(o,[mastX,mastY+.003,mastZ],[mastX+.003,mastY+.078,mastZ+.007],.00095,'#a49a80',metal,10);
      disc(o,mastX+.003,mastY+.0785,mastZ+.007,.0015,.0024,dark,'y',detail,12);
      // A drooping triangular flag and a forked blue pennant deform from their luff with separate per-clone morph weights.
      const fl=group(o,mastX+.0023,mastY+.052,mastZ+.0045,'旗杆系点'),rows=4,cols=15,PP=[],UU=[],II=[],M0=[],M1=[];
      for(let j=0;j<=rows;j++)for(let i=0;i<=cols;i++){const u=i/cols,f=j/rows,edge=k?1:.99*(1-u)+.035,drop=.0052*u*u,span=.0245*edge;
        const tip=k?.012*Math.max(0,1-Math.abs(f-.5)*2)*u**3:0;
        PP.push((k?1:-1)*(.014*u+.0026*Math.sin(u*6.4)),(f-.5)*span-drop,.051*u-tip);UU.push(...PUV(flags[k],u,1-f));
        M0.push(.006*u*Math.sin(9.2*u),.0012*u*Math.cos(u*7),-.0024*u*u);M1.push(.006*u*Math.cos(9.2*u),.0013*u*Math.sin(u*7),-.0014*u*u);}
      for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){const a=j*(cols+1)+i;II.push(a,a+1,a+cols+2,a,a+cols+2,a+cols+1);}
      const clothG=own(new T.BufferGeometry());clothG.setAttribute('position',new T.Float32BufferAttribute(PP,3));clothG.setAttribute('uv',new T.Float32BufferAttribute(UU,2));clothG.setIndex(II);
      clothG.morphAttributes.position=[new T.Float32BufferAttribute(M0,3),new T.Float32BufferAttribute(M1,3)];clothG.morphTargetsRelative=true;clothG.computeVertexNormals();clothG.computeBoundingSphere();const pen=new T.Mesh(clothG,cloth);pen.name='布旗';pen.castShadow=true;pen.receiveShadow=true;fl.add(pen);
      // Brass propeller shaft, separate pitched blades, and a soldered plate rudder. Deepest chine is 36–37mm below the water datum.
      rod(o,[0,-.016,.081],[0,-.030,.141],.0016,nickel,metal,10);rod(o,[0,-.021,.103],[0,-.029,.135],.0030,brass,metal,12);
      rod(o,[-.006,-.022,.124],[0,-.029,.133],.0014,brass,metal,8);
      const assembly=group(o,0,-.029,.142,'推进轴');assembly.rotation.x=.16;
      const prop=group(assembly,0,0,0,'螺旋桨');disc(prop,0,0,.0016,.0022,.0062,brass,'z',metal,16);
      for(let n=0;n<(k?3:2);n++){const base=TAU*n/(k?3:2),p=[],ix=[],N=9;
        // Riveted, pitched blades have a real thickness so their two surface normals do not cancel.
        for(const face of [-1,1])for(let i=0;i<N;i++){const f=i/(N-1),r=.0017+.0100*f;
          for(const edge of [-1,1]){const w=.16+.23*Math.sin(Math.PI*f),a=base+.26*f+edge*w;p.push(Math.cos(a)*r,Math.sin(a)*r,edge*(.0012+.0007*Math.sin(f*Math.PI))+.0007*f+face*.00028);}}
        for(let i=0;i<N-1;i++){const a=i*2,b=a+2*N;ix.push(a,a+1,a+2,a+1,a+3,a+2,b,b+2,b+1,b+1,b+2,b+3,a,a+2,b+2,a,b+2,b,a+1,b+1,b+3,a+1,b+3,a+3);}
        const end=2*N-2;ix.push(0,2*N,1,1,2*N,2*N+1,end,end+1,end+2*N+1,end,end+2*N+1,end+2*N);
        add(prop,geometry(p,ix),metal,k?'#b7a270':'#b39862');}
      const rud=group(o,0,-.018,.159,'活动舵叶');rod(rud,[0,.0758,0],[0,-.017,0],.0015,brass,metal,10);
      disc(o,0,.0545,.159,.0034,.0013,brass,'y',metal,16);disc(rud,0,.0758,0,.0026,.0023,nickel,'y',metal,12);
      rod(rud,[0,.075,0],[k?.014:-.014,.0745,-.002],.00145,brass,metal,9);
      disc(rud,k?.014:-.014,.0750,-.002,.0017,.0031,nickel,'y',metal,10);
      rod(o,[k?.018:-.018,.056,.120],[k?.014:-.014,.056,.147],.0008,brass,metal,8);
      const pp=[-.0011,0,0,-.0011,-.001,.006,-.0011,-.020,.007,-.0011,-.021,-.002,.0011,0,0,.0011,-.001,.006,.0011,-.020,.007,.0011,-.021,-.002],ii=[0,1,2,0,2,3,4,6,5,4,7,6,0,4,5,0,5,1,1,5,6,1,6,2,2,6,7,2,7,3,3,7,4,3,4,0];add(rud,geometry(pp,ii),metal,k?'#79958b':brass);
      return o;
    }
    for(let k=0;k<2;k++)prototypes.push(unit(k));
    const stand=group(null,0,0,0,'木制船托');for(const x of [-.120,.120]){
      box(stand,x,.0037,0,.101,.0074,.227,'#d6c49e',coat,null,timber);
      for(const z of [-.078,.078])for(const s of [-1,1]){
        box(stand,x+s*.027,.013,z,.044,.011,.014,'#c5b28e',coat,[0,0,-s*.38],timber);
        box(stand,x+s*.028,.0185,z,.037,.0028,.014,'#5a6551',detail,[0,0,-s*.38]);}}
    for(const [par,ms] of batch)for(const [m,b] of ms){const ge=own(new T.BufferGeometry());for(const [key,arr,k] of [['position',b.p,3],['normal',b.n,3],['uv',b.uv,2],['color',b.c,3]])ge.setAttribute(key,new T.Float32BufferAttribute(arr,k));ge.setIndex(b.ix);ge.computeBoundingSphere();ge.computeBoundingBox();
      const mesh=new T.Mesh(ge,m);mesh.castShadow=!m.transparent;mesh.receiveShadow=!m.transparent;if(m.transparent)mesh.renderOrder=1;par.add(mesh);}
    for(const f of forms)f.dispose();batch.clear();forms.clear();
    return{prototypes,stand,users:0,dispose(){for(const a of assets)a.dispose();assets.clear();}};
  }
  function mount(parent,onShelf){
    if(!bank)bank=build();const kit=bank;kit.users++;
    const root=new T.Group();root.name=onShelf?'瓶盖杯 · 两艇木托':'瓶盖杯 · 两艘遥控艇';parent.add(root);
    if(onShelf)root.add(kit.stand.clone(true));
    const boats=kit.prototypes.map((prototype,i)=>{const o=prototype.clone(true);root.add(o);if(onShelf)o.position.set(i?.120:-.120,.047,0);
      return {model:o,rudder:o.getObjectByName('活动舵叶'),prop:o.getObjectByName('螺旋桨'),flag:o.getObjectByName('布旗'),spin:0};});
    let disposed=false;function dispose(){if(disposed)return;disposed=true;root.removeFromParent();root.clear();if(--kit.users===0){kit.dispose();bank=null;}}
    return{root,boats,dispose};
  }
  function create(scene){const {root,boats,dispose}=mount(scene,false);root.visible=false;let lastT=null;
    function update(r,t=0){
      root.visible=!!r?.boats?.length;if(!root.visible){lastT=null;return;}
      const dt=lastT===null||t<lastT?0:Math.min(.16,t-lastT);lastT=t;
      for(const [i,o] of boats.entries()){const b=r.boats[i];o.model.visible=!!b;if(!b)continue;
        o.model.position.set(b.x||0,Number.isFinite(b.heave)?b.heave:0,b.z||0);o.model.rotation.set(b.pitch||0,-(b.h||0),b.roll||0,'YXZ');
        const throttle=clamp(b.throttle||0,-1,1),speed=clamp(Math.abs(b.speed||0),0,2),rudder=clamp(b.rudder||0,-1,1);
        o.rudder.rotation.y=rudder*.51;o.spin=(o.spin+dt*(throttle*89+speed*Math.sign(throttle||1)*12+(b.boost?22:0)))%TAU;o.prop.rotation.z=o.spin;
        const flutter=Math.min(.95,.27+speed*.48+Math.abs(throttle)*.24+(b.boost?.10:0)),wave=t*(7.8+speed*4)+i*2.68;
        o.flag.morphTargetInfluences[0]=flutter*Math.sin(wave);o.flag.morphTargetInfluences[1]=flutter*Math.cos(wave);
      }
    }
    return {root,update,dispose};
  }
  function createShelf(parent){const {root,dispose}=mount(parent,true);return{root,dispose}}
  function createCap(parent){
    const ring=new T.CylinderGeometry(.0143,.0158,.0064,42),pos=ring.attributes.position;
    for(let i=0;i<pos.count;i++){
      const x=pos.getX(i),z=pos.getZ(i),y=pos.getY(i);
      if(y<0){const flute=1+.065*Math.cos(21*Math.atan2(z,x));pos.setXYZ(i,x*flute,y,z*flute);}
    }
    ring.computeVertexNormals();
    const enamel=new T.MeshStandardMaterial({color:0xa64230,metalness:.55,roughness:.40});
    const foil=new T.MeshStandardMaterial({color:0xc2ae78,metalness:.76,roughness:.35});
    const model=new T.Mesh(ring,[foil,enamel,foil]);model.name='起点的汽水瓶盖';model.castShadow=model.receiveShadow=true;
    parent.add(model);return {model,dispose(){model.removeFromParent();ring.dispose();enamel.dispose();foil.dispose();}};
  }
  return {create,createShelf,createCap};
})();
