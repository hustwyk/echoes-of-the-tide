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
    // Unwrap the die-cast body around its rounded rim. The rubbed band on the
    // lid follows the fold-down handle; chips expose pale alloy at raised edges.
    const skinW=512,skinH=256,wrapH=118,backW=303;
    function hullFinish(){
      const colorCanvas=document.createElement('canvas'),mixCanvas=document.createElement('canvas');
      for(const c of [colorCanvas,mixCanvas]){c.width=skinW;c.height=skinH;}
      const col=colorCanvas.getContext('2d'),mix=mixCanvas.getContext('2d');
      const cc=col.createImageData(skinW,skinH),mm=mix.createImageData(skinW,skinH);
      const line=outline(.303,.200,.019),sums=[0];
      for(let i=1;i<=line.length;i++)sums.push(sums[i-1]+Math.hypot(line[i%line.length][0]-line[i-1][0],line[i%line.length][1]-line[i-1][1]));
      const hash=(x,y)=>{let a=Math.imul(x+97,374761393)^Math.imul(y+269,668265263);a=Math.imul(a^(a>>>13),1274126177);return (a>>>0)/4294967295;};
      function noise(x,y){
        const i=Math.floor(x),j=Math.floor(y);let u=x-i,v=y-j;u=u*u*(3-2*u);v=v*v*(3-2*v);
        const a=hash(i,j),b=hash(i+1,j),c=hash(i,j+1),d=hash(i+1,j+1);
        return (a+(b-a)*u)*(1-v)+(c+(d-c)*u)*v;
      }
      const smooth=(a,b,t)=>{const f=clamp((t-a)/(b-a));return f*f*(3-2*f);};
      let seg=0;
      for(let i=0;i<skinW;i++){
        const walk=i/(skinW-1)*sums.at(-1);while(seg<line.length-1&&walk>sums[seg+1])seg++;
        const lo=line[seg],hi=line[(seg+1)%line.length],k=(walk-sums[seg])/(sums[seg+1]-sums[seg]);
        const sx=lo[0]+k*(hi[0]-lo[0]),sy=lo[1]+k*(hi[1]-lo[1]);
        for(let j=0;j<skinH;j++){
          const side=j<wrapH+3,x=side?sx:(i/backW-.5)*-.296,y=side?sy:(.5-(j-wrapH-7)/122)*.198,z=side?-.004-clamp((j-1)/(wrapH-2))*.133:-.137;
          const u=i*.036,v=j*.060,f=noise(u,v),fine=noise(i*.39,j*.39),r=hash(i+5,j-1),
            edge=side?Math.min(Math.abs(z+.009),Math.abs(z+.127),Math.abs(z+.113)*1.65):Math.min(.148-Math.abs(x),.098-Math.abs(y)),
            top=smooth(.078,.096,y),corner=smooth(.102,.148,Math.abs(x)),front=smooth(-.055,-.007,z);
          const hinge=Math.max(Math.exp(-((x+.077)**2/.00021+(z+.058)**2/.00016)),Math.exp(-((x-.069)**2/.00021+(z+.058)**2/.00016)))*top,
            folded=top*Math.exp(-(((z+.081)/.012)**2))*Math.exp(-((x/.071)**6)),
            hand=smooth(.065,.14,Math.abs(x))*front*.35+folded*.60+hinge*.31;
          const edgeWear=Math.exp(-Math.max(0,edge)/(.0009+.0019*corner))*(.46+.28*corner+.18*top),
            islands=f*.34+fine*.41+r*.25,chip=smooth(.865,.94,islands+edgeWear*.34+hinge*.065),
            primer=smooth(.78,.94,islands+edgeWear*.29+hinge*.07)*(.24+edgeWear*.69),
            salt=top*Math.max(0,1-Math.abs(Math.hypot((x+.076)/.018,(z+.06)/.022)-1)*3.1)*(.09+.47*fine)
              +top*Math.max(0,1-Math.abs(Math.hypot((x-.07)/.015,(z+.06)/.018)-1)*3.6)*(.09+.42*fine),
            blot=(f-.48)*15+(fine-.5)*10+(r-.5)*9;
          const rr=80+blot-hand*13+salt*31,gg=103+blot-hand*11+salt*31,bb=90+blot-hand*10+salt*27;
          const p=primer*(1-chip),al=chip*(.82+.14*r),off=(j*skinW+i)*4;
          cc.data[off]=(rr*(1-p)+(138+14*f)*p)*(1-al)+(162+29*f)*al;
          cc.data[off+1]=(gg*(1-p)+(132+14*f)*p)*(1-al)+(166+20*f)*al;
          cc.data[off+2]=(bb*(1-p)+(101+12*f)*p)*(1-al)+(158+18*f)*al;cc.data[off+3]=255;
          mm.data[off]=132+(fine-.5)*21+(r-.5)*12-p*12-chip*25+salt*10;
          mm.data[off+1]=160+18*f-hand*58-p*4-chip*39+salt*29;
          mm.data[off+2]=32+4*r+p*3+chip*137;mm.data[off+3]=255;
        }
      }
      col.putImageData(cc,0,0);mix.putImageData(mm,0,0);
      for(let j=0;j<460;j++){
        const x=random()*skinW,y=random()*wrapH,edge=Math.min(y,wrapH-y),s=.7+random()**2*(edge<9?8:3);
        col.strokeStyle=edge<10?'rgba(180,182,155,.46)':'rgba(136,150,135,.28)';col.lineWidth=.4+random()*.7;
        col.beginPath();col.moveTo(x,y);col.lineTo(x+s,y+(random()-.48)*s*.44);col.stroke();
      }
      const make=(canvas,srgb)=>{const t=own(new T.CanvasTexture(canvas));if(srgb)t.colorSpace=T.SRGBColorSpace;t.anisotropy=6;return t;};
      const a=make(colorCanvas,true),b=make(mixCanvas,false);
      return finish(0xffffff,1,1,{map:a,roughnessMap:b,metalnessMap:b,bumpMap:b,bumpScale:.00015});
    }
    const housing=hullFinish();
    const atlasCanvas=document.createElement('canvas');atlasCanvas.width=2048;atlasCanvas.height=1024;
    const atlasCtx=atlasCanvas.getContext('2d'),atlas=own(new T.CanvasTexture(atlasCanvas));
    atlas.colorSpace=T.SRGBColorSpace;atlas.anisotropy=6;
    const artwork=finish(0xffffff,.61,.13,{map:atlas}),cells=[[4,4],[1212,4],[4,802],[1212,485],[1212,760],[1212,289]];let cell=0;
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
      // Glove contacts form crescent-shaped polish around the selector and
      // waxy thumb key. Screw recesses drain narrow salt tracks downhill.
      const ox=963,oy=511,arc=(r,a)=>[ox+r*Math.sin(a),oy-r*Math.cos(a)];
      for(let i=0;i<310;i++){
        const a=(random()-.50)*5.0,rad=151+random()**1.7*36,len=.008+random()**2*.095;
        c.strokeStyle=i%4?'rgba(142,145,119,.18)':'rgba(25,43,39,.23)';c.lineWidth=.7+random()*1.7;
        const A=arc(rad,a),B=arc(rad,a+len);c.beginPath();c.moveTo(...A);c.lineTo(...B);c.stroke();
      }
      for(const [x,y] of [[37,49],[1162,49],[37,745],[1162,745]]){
        for(let i=0;i<21;i++){const xx=x+(random()-.5)*33,yy=y+random()*9,span=4+random()**2*37;
          const wash=c.createLinearGradient(0,yy,0,yy+span);wash.addColorStop(0,'rgba(172,170,131,.26)');wash.addColorStop(1,'rgba(165,161,127,0)');c.fillStyle=wash;c.fillRect(xx,yy,.8+random()*2,span);}
      }
      letter(c,'信 道',847,272,31,'sans-serif','#d0d3b5');
      letter(c,'接收',610,688,33,'sans-serif','#dbd9b9');letter(c,'发话',754,688,33,'sans-serif','#dbd9b9');letter(c,'调谐',960,729,32);
      for(let j=0;j<=10;j++){
        const a=(-118+j*23.6)*Math.PI/180,outer=j%5===0?184:178;
        const A=arc(168,a),B=arc(outer,a);c.strokeStyle=j%5===0?'#c8c6a6':'#aeb69d';c.lineWidth=j%5===0?4:3;
        c.beginPath();c.moveTo(...A);c.lineTo(...B);c.stroke();
      }
      c.lineWidth=2;c.strokeStyle='#748379';c.beginPath();c.moveTo(464,625);c.lineTo(770,625);c.stroke();
    });
    const speaker=art(420,280,(c,w,h)=>{c.fillStyle='#4d5350';c.fillRect(0,0,w,h);
      for(let row=-1;row<h/12;row++)for(let col=-1;col<w/13;col++){const x=col*13+(row%2)*6.5,y=row*12;c.fillStyle='#798078';c.beginPath();c.arc(x,y+1.2,3.8,0,TAU);c.fill();c.fillStyle='#191f1e';c.beginPath();c.arc(x,y,3.65,0,TAU);c.fill();}
      const v=c.createLinearGradient(0,0,w*.18,h);v.addColorStop(0,'rgba(65,67,59,.45)');v.addColorStop(.48,'rgba(29,39,34,.04)');v.addColorStop(1,'rgba(14,18,18,.45)');c.fillStyle=v;c.fillRect(0,0,w,h);
    });
    const bands=art(1200,200,(c,w,h)=>{
      const grad=c.createLinearGradient(0,0,0,h);
      for(const [offset,col] of [[0,'#777c67'],[.11,'#b9bda2'],[.35,'#d6d5b5'],[.72,'#ced0b1'],[.90,'#b9bea2'],[1,'#838b75']])grad.addColorStop(offset,col);
      c.fillStyle=grad;c.fillRect(0,0,w,h);
      for(let j=0;j<2300;j++){const x=random()*w,y=random()*h;c.fillStyle=j%4?'rgba(118,105,75,.085)':'rgba(245,235,196,.20)';c.fillRect(x,y,.8+random()*2,.6+random()*1.1);}
      const pitch=w/15;
      for(let channel=6;channel<=16;channel++){
        const x=(2.5+channel-6)*pitch;
        c.fillStyle='#213a34';c.textAlign='center';c.textBaseline='middle';c.font='bold 106px "Arial Narrow","Helvetica Neue",sans-serif';
        c.fillText(String(channel).padStart(2,'0'),x,88,68);
        for(let tick=0;tick<5;tick++){
          if(channel===16&&tick>0)continue;
          c.fillStyle='#435348';c.fillRect(x+tick*pitch/5-1,tick?164:148,tick?1.6:3.2,tick?10:23);
        }
      }
      for(const x of [pitch*1.87,pitch*13.13]){c.fillStyle='#7a805f';c.fillRect(x,34,2,138);}
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
      const a=g.attributes,base=b.p.length/3;for(let j=0;j<a.position.count;j++){p.fromBufferAttribute(a.position,j).applyMatrix4(transform.matrix);n.fromBufferAttribute(a.normal,j).applyNormalMatrix(nmat);b.p.push(p.x,p.y,p.z);b.n.push(n.x,n.y,n.z);b.uv.push(a.uv?.getX(j)||0,a.uv?.getY(j)||0);if(a.color)b.c.push(tint.r*a.color.getX(j),tint.g*a.color.getY(j),tint.b*a.color.getZ(j));
        else b.c.push(tint.r,tint.g,tint.b);}
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
      for(const [pts,z] of rows){let walk=0;const length=pts.reduce((l,xy,i)=>{const next=pts[(i+1)%N];return l+Math.hypot(next[0]-xy[0],next[1]-xy[1]);},0);for(let j=0;j<=N;j++){const v=pts[j%N],previous=pts[(j-1+N)%N];if(j)walk+=Math.hypot(v[0]-previous[0],v[1]-previous[1]);P.push(v[0],v[1],z);if(mat===housing)U.push((.5+walk/length*(skinW-1))/skinW,1-(1+clamp((-.004-z)/.133)*(wrapH-2))/skinH);else U.push(walk*8,z*8);}}
      for(let i=1;i<rows.length;i++)for(let j=0;j<N;j++){const l=(i-1)*(N+1)+j,k=l+1;I.push(l,k,k+N+1,l,k+N+1,l+N+1)}
      function cap(k,reverse){const [row,z]=rows[k],start=P.length/3;for(const [x,y] of row){P.push(x,y,z);if(mat===housing)U.push(clamp((.5-x/.296)*backW/skinW),1-(wrapH+7+(.5-y/.198)*122)/skinH);else U.push(x*8+.5,y*8+.5);}
        for(let j=1;j<N-1;j++)I.push(start,reverse?start+j+1:start+j,reverse?start+j:start+j+1)}
      cap(0,true);cap(rows.length-1,false);
      const g=form(new T.BufferGeometry());g.setAttribute('position',new T.Float32BufferAttribute(P,3));g.setAttribute('uv',new T.Float32BufferAttribute(U,2));g.setIndex(I);g.computeVertexNormals();add(par,g,mat,colour,x,y,0);}
    const olive='#45625a',olive2='#597168',iron='#414d48',alu='#a4aaa0',brass='#ae9364',dark='#292f2d',seal='#363b35',black='#242927',bone='#e0d7b8';
    shell(face,0,0,[[.268,.166,.02,-.137],[.293,.192,.021,-.125],[.303,.20,.019,-.111],[.303,.20,.019,-.010],[.302,.20,.019,-.004]],0xffffff,housing);
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
    // A geared scale drum advances behind a fixed glass reticle. The cut
    // window shows three neighbouring channels without a privileged station.
    const drumGeo=own(new T.BufferGeometry()),drumX=[],drumP=[],drumU=[],drumI=[];
    const drumN=12,tape=bands.region,visibleCells=3.42;
    for(let j=0;j<=drumN;j++){
      const u=j/drumN,xx=(u-.5)*.124,zz=.0214-.0020*(2*u-1)**2;
      for(let k=0;k<2;k++){
        drumP.push(bx+xx,by+(k-.5)*.0304,zz);drumX.push((u-.5)*visibleCells);
        drumU.push(0,1-(tape[1]+(k?1:tape[3]-1))/atlasCanvas.height);
      }
      if(j<drumN){const i=j*2;drumI.push(i,i+2,i+1,i+2,i+3,i+1);}
    }
    drumGeo.setAttribute('position',new T.Float32BufferAttribute(drumP,3));drumGeo.setAttribute('uv',new T.Float32BufferAttribute(drumU,2));drumGeo.setIndex(drumI);drumGeo.computeVertexNormals();
    const drumColor=new Float32Array(drumX.length*3).fill(1);drumGeo.setAttribute('color',new T.BufferAttribute(drumColor,3));
    const drumUV=drumGeo.attributes.uv;drumUV.setUsage(T.DynamicDrawUsage);const drum=new T.Mesh(drumGeo,artwork);drum.receiveShadow=true;face.add(drum);
    let drumRead=-100,drumFrame=-100;
    function moveScale(step,dt,init){
      if(init||dt===0)drumRead=step;else drumRead+=(step-drumRead)*(1-Math.exp(-dt*39));
      if(Math.abs(drumRead-step)<.01)drumRead=step;if(Math.abs(drumFrame-drumRead)<.0005)return;
      for(let i=0;i<drumX.length;i++)drumUV.setX(i,(tape[0]+(2.5+drumRead+drumX[i])*tape[2]/15)/atlasCanvas.width);
      drumUV.needsUpdate=true;drumFrame=drumRead;
    }
    box(face,bx,by-.0118,.0230,.0013,.0062,.0006,'#9d573a',bright);
    box(face,bx,by+.0131,.0231,.0014,.0037,.0006,'#9d573a',bright);
    box(face,bx,by-.0157,.0231,.0062,.0017,.00075,'#b4a582',bright);
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
    // Moulded finger scallops fade into the convex face. Thumb-polished
    // shoulders and little patches of graphite in the valleys rotate as one.
    const dx=.085,dy=-.026;
    disc(face,dx,dy,.0168,.0373,.0052,iron,steel,64);
    tor(face,dx,dy,.0198,.0350,.0017,'#9e8962',bright);
    disc(face,dx,dy,.0216,.0308,.0068,'#393f36',rubber);
    const dial=group(face,dx,dy,.024);
    const rimRows=[
      [.0015,.0265,.12],[.0025,.0296,.55],[.0040,.0328,.91],
      [.0064,.0340,1],[.0116,.0336,1],[.0140,.0314,.78],
      [.0150,.0287,.29],[.0157,.0266,.02],[.0165,.0195,0],[.0169,.0103,0],[.0168,0,0]
    ];
    const knobPos=[],K=[],UV=[],F=[],steps=144,bakelite=new T.Color();
    for(let j=0;j<rimRows.length;j++){
      const [z,rad,fluting]=rimRows[j];for(let i=0;i<=steps;i++){
        const a=TAU*i/steps,ridge=(1+Math.cos(a*18))*.5,valley=1-ridge,r=rad-.0036*fluting*valley**.76;
        const x=r*Math.sin(a),y=r*Math.cos(a);knobPos.push(x,y,z);
        const polish=ridge*fluting,grain=.5+.5*Math.cos(a*5.0+.4);
        bakelite.setRGB(.064+.035*polish+.008*grain,.074+.031*polish+.006*grain,.065+.027*polish+.006*grain);
        K.push(bakelite.r,bakelite.g,bakelite.b);UV.push(i/steps*2.0,j*.12);
        if(j<rimRows.length-1&&i<steps){const k=j*(steps+1)+i;F.push(k,k+steps+1,k+1,k+1,k+steps+1,k+steps+2);}
      }
    }
    const dialBody=form(new T.BufferGeometry());dialBody.setAttribute('position',new T.Float32BufferAttribute(knobPos,3));dialBody.setAttribute('uv',new T.Float32BufferAttribute(UV,2));dialBody.setAttribute('color',new T.Float32BufferAttribute(K,3));dialBody.setIndex(F);dialBody.computeVertexNormals();add(dial,dialBody,rubber,0xffffff);
    tor(dial,0,0,.01645,.0191,.00057,'#676c5d',steel);tor(dial,0,0,.01635,.0242,.00041,'#535748',rubber);
    // Inlaid bone index reaches over the shoulder. The satin collar and the
    // small darker slot remain visible on the upper half above a gloved hand.
    box(dial,0,.0220,.0164,.0028,.0141,.00066,bone,steel);
    box(dial,0,.0292,.0151,.0027,.0028,.00075,'#c9bc9c',steel,[.31,0,0]);
    disc(dial,0,0,.01675,.00625,.0018,'#95968a',steel,32);
    box(dial,0,0,.01780,.0066,.00087,.00027,'#464b43',rubber,[0,0,-.48]);
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
      dial.rotation.z=(.5-tuning)*236*Math.PI/180;moveScale(step,dt,init);
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
