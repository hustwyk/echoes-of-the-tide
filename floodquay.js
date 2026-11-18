// Receiving alcove of the north breakwater. Everything is in metres, relative to the final quay.
// Cast concrete reuses the site's shared CC0 Poly Haven scan. No external image requests.
const TideFloodQuay=(()=>{
  'use strict';
  function create(parent){
    const T=THREE,root=new T.Group();root.name='北岬堤头 · 一号闸接报廊';parent.add(root);
    const owned=new Set(),keep=x=>(owned.add(x),x),TAU=Math.PI*2;
    const geometry=new Map(),batches=new Map(),saltLines=[];
    const up=new T.Vector3(0,1,0),quat=new T.Quaternion(),rot=new T.Euler(),mat4=new T.Matrix4();
    let seed=47381,disposed=false;
    function rand(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;}
    function geo(name,build){if(!geometry.has(name))geometry.set(name,keep(build()));return geometry.get(name);}
    const block=geo('block',()=>new T.BoxGeometry(1,1,1));
    const pipe=geo('pipe',()=>new T.CylinderGeometry(1,1,1,16));
    const nut=geo('hex nut',()=>new T.CylinderGeometry(1,1,1,6));
    const ball=geo('oval',()=>new T.SphereGeometry(1,20,12));
    const planeGeo=geo('plane',()=>new T.PlaneGeometry(1,1));
    function surf(tint,rough,metal,opt={}){return keep(new T.MeshStandardMaterial({color:tint,roughness:rough,metalness:metal,...opt}));}
    function concrete(tint,localLine){
      const m=typeof TideConcrete==='undefined'?surf(tint,.84,.035):keep(TideConcrete.material(tint,localLine));
      if(m.userData.waterline)saltLines.push([m.userData.waterline,localLine]);return m;
    }
    function batch(g,m,col,pos,scale,orientation){
      const id=g.uuid+m.uuid;let b=batches.get(id);if(!b){b={g,m,t:[],c:[]};batches.set(id,b);}
      if(Array.isArray(orientation))quat.setFromEuler(rot.set(...orientation));else if(orientation)quat.copy(orientation);else quat.identity();
      mat4.compose(new T.Vector3(...pos),quat,new T.Vector3(...scale));
      b.t.push(mat4.clone());b.c.push(col);
    }
    function box(x,y,z,sx,sy,sz,m,col=0xffffff,angle=null){batch(block,m,col,[x,y,z],[sx,sy,sz],angle);}
    function rod(a,b,r,m,col){
      const p=new T.Vector3(...a),q=new T.Vector3(...b),v=q.clone().sub(p),len=v.length();
      if(len>0)batch(pipe,m,col,p.lerp(q,.5).toArray(),[r,len,r],new T.Quaternion().setFromUnitVectors(up,v.divideScalar(len)));
    }
    function bolt(x,y,z,r,face,col=0xaaa17b){
      batch(nut,alloy,col,[x,y,z],[r,r*.75,r],face==='front'?[Math.PI/2,0,0]:face==='side'?[0,0,Math.PI/2]:null);
    }
    function tor(x,y,z,r,w,m,col,orientation=null){
      const k='ring'+Math.round(1000*w/r);
      batch(geo(k,()=>new T.TorusGeometry(1,w/r,8,40)),m,col,[x,y,z],[r,r,r],orientation);
    }
    function sheet(g,m,x=0,y=0,z=0){
      const o=new T.Mesh(g,m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;root.add(o);return o;
    }
    // A curved / polygonal transverse profile extruded along the harbour axis.
    function casting(points,z,depth,m){
      const shape=new T.Shape();shape.moveTo(...points[0]);for(const p of points.slice(1))shape.lineTo(...p);shape.closePath();
      const g=keep(new T.ExtrudeGeometry(shape,{depth,bevelEnabled:false}));return sheet(g,m,0,0,z);
    }
    function map(w,h,paint,space=true){
      const cv=document.createElement('canvas');cv.width=w;cv.height=h;paint(cv.getContext('2d'),w,h);
      const t=keep(new T.CanvasTexture(cv));if(space)t.colorSpace=T.SRGBColorSpace;t.anisotropy=6;return t;
    }
    const masonry=concrete(0xbac2b4,.65),cap=concrete(0xd1cbb9,.24),ground=concrete(0xa3a59b,.11),darkWall=concrete(0x7b8e89,.74);
    const wear=map(256,256,(c,w,h)=>{
      c.fillStyle='#c8c9ba';c.fillRect(0,0,w,h);
      for(let i=0;i<6200;i++){
        const x=rand()*w,y=rand()*h,k=rand();
        c.fillStyle=k>.82?'rgba(99,72,55,.44)':k>.58?'rgba(109,120,109,.36)':'rgba(238,226,203,.39)';
        c.fillRect(x,y,.4+rand()*2.7,.3+rand()*2.2);
      }
      for(let i=0;i<64;i++){
        const x=rand()*w,y=rand()*h;c.strokeStyle='rgba(98,82,68,.23)';c.lineWidth=.4+rand()*.8;c.beginPath();c.moveTo(x,y);c.lineTo(x+1.4+rand()*18,y+rand()*4-2);c.stroke();
      }
    });wear.wrapS=wear.wrapT=T.RepeatWrapping;
    const enamel=surf(0xffffff,.62,.38,{map:wear,bumpMap:wear,bumpScale:.010});
    const alloy=surf(0xffffff,.48,.64,{map:wear});
    const rubber=surf(0xffffff,.87,.055),ra=0x3e5351,br=0x9d916c,iron=0x535f5a,black=0x343f3c;
    const wetBlack=0x3a4542;
    // Slightly sunk slab surfaces leave the threshold plates and grated runnels flush at zero.
    box(0,-.602,-4.25,10.20,1.188,6.50,ground);
    box(0,-.602,-11.32,8.80,1.188,7.64,ground);
    for(const s of [-1,1]){
      box(s*5.025,-.55,-4.25,.15,.98,6.48,darkWall);
      box(s*4.335,-.56,-11.28,.13,1.02,7.38,darkWall);
      for(const z of [-2.05,-4.20,-6.35]){
        box(s*5.095,-.44,z,.034,.73,.13,enamel,ra);
        for(const y of [-.17,-.65])bolt(s*5.122,y,z,.030,'side');
      }
    }
    // Front façade: battered concrete abutments capped in dressed stone, a completely open bay between them.
    for(const s of [-1,1]){
      const profile=[[1.82,-.50],[5.10,-.50],[5.10,2.18],[4.80,2.22],[3.25,2.68],[2.52,3.17],[2.47,3.66],[1.82,3.66]];
      casting(profile.map(([x,y])=>[s*x,y]),-7.79,.58,masonry);
      const bevel=[[2.43,3.67],[2.51,3.11],[3.24,2.62],[4.81,2.16],[5.10,2.14],[5.10,2.28],[4.83,2.31],[3.31,2.78],[2.62,3.24],[2.60,3.73]];
      casting(bevel.map(([x,y])=>[s*x,y]),-7.85,.69,cap);
      box(s*2.13,1.72,-7.502,.53,3.47,.83,cap);
      box(s*2.12,.20,-7.49,.58,.40,.90,cap);
      box(s*2.12,3.46,-7.50,.60,.26,.87,cap);
      // Edge channels stay outside the opening, leaving the separate sliding leaf all the way clear.
      for(const z of [-7.045,-7.941]){
        box(s*1.873,1.65,z,.091,3.29,.068,enamel,ra);
        box(s*1.929,1.65,z,.029,3.29,.049,alloy,br);
        for(const y of [.18,.56,.95,1.34,1.76,2.17,2.55,2.98])bolt(s*1.872,y,z+(z>-7.5?.044:-.044),.022,'front');
      }
      // Recessed casting seams and old wall-tie holes.
      for(const x of [2.74,3.45,4.24,4.82])for(const y of [.40,1.11,1.87]){
        batch(pipe,rubber,0x525951,[s*x,y,-7.204],[.021,.007,.021],[Math.PI/2,0,0]);
        tor(s*x,y,-7.202,.022,.004,alloy,0x858573);
      }
      for(const y of [.47,1.36])box(s*3.79,y,-7.205,2.58,.010,.009,rubber,0x697167);
      box(s*4.57,1.07,-7.204,.009,2.07,.011,rubber,0x687166);
      // Short, low wing returns face inward at the edges of the receiving bay. They stop before the wheel and lever.
      const shape=new T.Shape(),pts=[[-7.77,-.35],[-14.93,-.35],[-14.93,2.28],[-13.94,2.18],[-12.89,1.60],[-10.05,.94],[-8.32,.89],[-7.77,1.06]];
      shape.moveTo(...pts[0]);for(const p of pts.slice(1))shape.lineTo(...p);shape.closePath();
      const g=keep(new T.ExtrudeGeometry(shape,{depth:.22,bevelEnabled:false}));
      // Shape x represents world z; positive extrusion thickness represents world x.
      const wall=sheet(g,darkWall,s*4.43,0,0);wall.rotation.y=-Math.PI/2;
      wall.position.x=s>0?4.65:-4.44;
      for(let i=2;i<pts.length-1;i++){
        const a=pts[i],b=pts[i+1];rod([s*4.54,a[1]+.013,a[0]],[s*4.54,b[1]+.013,b[0]],.060,enamel,iron);
      }
    }
    casting([[-2.48,3.32],[-1.78,3.25],[1.78,3.25],[2.48,3.32],[2.48,3.71],[2.33,3.83],[-2.33,3.83],[-2.48,3.71]],-7.865,.73,cap);
    box(0,3.795,-7.51,4.76,.12,.90,masonry);
    box(0,3.296,-7.131,3.62,.033,.053,enamel,ra);
    // Two large cast-in wall anchor plates carry circular blackened inspection plugs.
    for(const x of [-3.98,3.98]){
      box(x,.62,-7.165,.59,.64,.079,enamel,iron);
      batch(pipe,alloy,0x717971,[x,.62,-7.104],[.173,.078,.173],[Math.PI/2,0,0]);
      tor(x,.62,-7.052,.145,.025,enamel,ra);
      for(const dx of [-.22,.22])for(const dy of [-.24,.24])bolt(x+dx,.62+dy,-7.10,.028,'front');
    }
    // Radio alcove's back wall is low and roofless.
    box(0,1.22,-15.15,9.18,2.86,.35,darkWall);
    box(0,2.62,-15.13,9.23,.13,.43,cap);
    box(0,2.515,-14.944,9.16,.09,.026,enamel,ra);
    for(const x of [-4.19,-2.87,-1.42,0,1.42,2.87,4.19]){
      box(x,1.33,-14.962,.014,2.33,.028,rubber,0x4a5652);
      for(const y of [.45,1.98])batch(pipe,rubber,0x46504d,[x+.16,y,-14.960],[.027,.009,.027],[Math.PI/2,0,0]);
    }
    for(const x of [-3.19,3.19]){
      box(x,1.61,-14.87,.85,.64,.14,enamel,ra);
      box(x,1.61,-14.787,.73,.53,.031,alloy,black);
      for(let n=0;n<6;n++)box(x,1.40+n*.081,-14.754,.666,.028,.045,enamel,0x63716a,[-.24,0,0]);
      for(const dx of [-.39,.39])for(const dy of [-.27,.27])bolt(x+dx,1.61+dy,-14.786,.023,'front');
    }
    // Two lengths of original copper conduit lead to the existing radio position.
    for(const y of [1.99,2.08]){
      rod([-4.38,y,-14.900],[-.78,y,-14.900],.023,alloy,br);
      rod([.78,y,-14.900],[4.38,y,-14.900],.023,alloy,br);
      for(const x of [-4.04,-2.32,-1.50,1.5,2.32,4.04])box(x,y,-14.871,.046,.064,.047,enamel,iron);
    }
    rod([1.09,1.99,-14.90],[1.09,.58,-14.90],.024,alloy,br);
    rod([1.09,.58,-14.90],[.64,.58,-14.90],.024,alloy,br);
    tor(1.09,.57,-14.88,.058,.010,enamel,iron);
    // Every surface label, wall stain and pool of skylight goes into one transparent atlas.
    const atlasCanvas=document.createElement('canvas');atlasCanvas.width=2048;atlasCanvas.height=1024;
    const ac=atlasCanvas.getContext('2d');let cx=3,cy=3,row=0;
    const atlas=keep(new T.CanvasTexture(atlasCanvas));atlas.colorSpace=T.SRGBColorSpace;atlas.anisotropy=8;
    const labelMat=surf(0xffffff,.84,.06,{map:atlas,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2});
    const art={p:[],n:[],uv:[],i:[]};
    function patch(w,h,draw){
      if(cx+w+4>2048){cx=3;cy+=row+6;row=0;}if(cy+h+3>1024)throw Error('Flood quay atlas capacity exceeded');
      const x=cx,y=cy;cx+=w+6;row=Math.max(row,h);
      ac.save();ac.beginPath();ac.rect(x,y,w,h);ac.clip();ac.translate(x,y);draw(ac,w,h);ac.restore();
      atlas.needsUpdate=true;return [(x+.5)/2048,1-(y+h-.5)/1024,(x+w-.5)/2048,1-(y+.5)/1024];
    }
    function decal(rect,x,y,z,w,h,rx=0,ry=0,rz=0){
      const first=art.p.length/3,q=new T.Quaternion().setFromEuler(new T.Euler(rx,ry,rz));
      const normal=new T.Vector3(0,0,1).applyQuaternion(q);
      for(const [u,v] of [[-.5,-.5],[.5,-.5],[.5,.5],[-.5,.5]]){
        const p=new T.Vector3(u*w,v*h,0).applyQuaternion(q);art.p.push(x+p.x,y+p.y,z+p.z);art.n.push(...normal.toArray());
      }
      const [a,b,c,d]=rect;art.uv.push(a,b,c,b,c,d,a,d);art.i.push(first,first+1,first+2,first,first+2,first+3);
    }
    function chips(c,w,h,n){
      for(let i=0;i<n;i++){
        const x=rand()*w,y=rand()*h;c.fillStyle=i%4?'rgba(62,61,50,.23)':'rgba(190,162,122,.48)';c.fillRect(x,y,rand()*w*.006+.4,.5+rand()*2);
      }
      c.save();c.globalCompositeOperation='destination-out';for(let i=0;i<n*.13;i++){
        const x=rand()*w,y=rand()*h;c.fillStyle='rgba(0,0,0,.68)';c.fillRect(x,y,rand()*w*.008+.6,rand()*2+.4);
      }c.restore();
    }
    const header=patch(668,108,(c,w,h)=>{
      c.fillStyle='#3c524e';c.fillRect(0,0,w,h);c.strokeStyle='#c4b390';c.lineWidth=2;c.strokeRect(6,6,w-12,h-12);
      c.fillStyle='#e5d7b5';c.font='bold 49px "Songti SC","Microsoft YaHei",serif';c.textBaseline='middle';c.textAlign='center';c.fillText('北岬港　橫堤一号闸',w/2,42,w-52);
      c.fillStyle='#c0c4ac';c.font='bold 13px monospace';c.fillText('NORTH CAPE HARBOUR  ·  BREAKWATER  01',w/2,81);chips(c,w,h,1170);
    });
    box(0,3.544,-7.113,2.71,.43,.052,enamel,ra);decal(header,0,3.544,-7.078,2.65,.38);
    for(const x of [-1.277,1.277])for(const y of [3.411,3.678])bolt(x,y,-7.063,.018,'front');
    const warning=patch(290,127,(c,w,h)=>{
      c.fillStyle='#c4baa0';c.fillRect(0,0,w,h);c.fillStyle='#874d3d';c.fillRect(0,0,17,h);
      c.fillStyle='#4d5750';c.font='bold 37px "Songti SC",serif';c.fillText('当心闸槽',33,56);
      c.font='14px sans-serif';c.fillText('升降期间　禁止穿行',35,82);c.font='10px monospace';c.fillText('HARBOUR ENGINEERING / 01',36,105);
      c.strokeStyle='#746f58';c.lineWidth=2;c.strokeRect(4,4,w-8,h-8);chips(c,w,h,590);
    });
    box(-3.62,1.71,-7.190,.89,.39,.041,enamel,iron);decal(warning,-3.62,1.71,-7.161,.83,.351);
    const reception=patch(612,132,(c,w,h)=>{
      c.fillStyle='#405650';c.fillRect(0,0,w,h);c.strokeStyle='#b1aa88';c.lineWidth=2;c.strokeRect(8,8,w-16,h-16);
      c.fillStyle='#ded6bb';c.textAlign='center';c.textBaseline='middle';c.font='bold 50px "Songti SC",serif';c.fillText('堤 头 接 报 间',w*.50,56);
      c.fillStyle='#c5b18a';c.font='16px monospace';c.fillText('北岬港务段   ·   BREAKWATER WATCH',w*.50,99);chips(c,w,h,1090);
    });
    box(0,2.04,-14.932,1.72,.39,.049,enamel,ra);decal(reception,0,2.04,-14.894,1.67,.351);
    const ruler=patch(106,422,(c,w,h)=>{
      c.fillStyle='#d5ceb5';c.fillRect(0,0,w,h);
      for(let i=0;i<20;i++){
        const y=8+i*20;const dark=Math.floor(i/5)%2===0?'#4b5855':'#914f43';c.fillStyle=dark;
        c.fillRect(4,y,i%5===0?49:i%2?24:34,3);
        if(i%5===0){c.font='bold 23px monospace';c.fillText((2.5-i*.10).toFixed(1),51,y+17);}
      }
      c.fillStyle='#857a68';c.fillRect(2,0,3,h);chips(c,w,h,440);
    });
    box(2.53,1.42,-7.177,.246,1.65,.036,enamel,iron);decal(ruler,2.53,1.42,-7.150,.225,1.61);
    const arrow=patch(272,84,(c,w,h)=>{
      c.fillStyle='#cabc99';c.font='bold 36px "PingFang SC",sans-serif';c.fillText('接 报 间',5,41);
      c.fillRect(155,25,99,8);c.beginPath();c.moveTo(241,11);c.lineTo(263,29);c.lineTo(241,46);c.closePath();c.fill();
      c.font='13px monospace';c.fillText('WATCH STATION',8,66);chips(c,w,h,330);
    });
    decal(arrow,3.68,1.65,-7.193,1.03,.32);
    const band=patch(430,56,(c,w,h)=>{
      c.fillStyle='#4a5650';c.fillRect(0,0,w,h);c.fillStyle='#c3aa68';
      for(let x=-h;x<w+h;x+=72){c.beginPath();c.moveTo(x,0);c.lineTo(x+30,0);c.lineTo(x+30-h,h);c.lineTo(x-h,h);c.closePath();c.fill();}
      chips(c,w,h,610);
    });
    for(const s of [-1,1]){
      decal(band,s*2.132,.899,-7.072,.342,.10);
      decal(band,s*2.132,1.61,-7.072,.342,.10);
    }
    const salt=patch(530,140,(c,w,h)=>{
      const tide=x=>43+9*Math.sin(x*.018)+3*Math.sin(x*.067)+2*Math.sin(x*.331);
      for(let x=0;x<w;x++){
        const y=tide(x)+2*rand(),line=c.createLinearGradient(0,y-4,0,y+71);
        line.addColorStop(0,'rgba(216,216,177,0)');line.addColorStop(.075,'rgba(229,221,182,'+(.22+.35*rand())+')');
        line.addColorStop(.18,'rgba(152,158,127,.22)');line.addColorStop(.68,'rgba(55,70,57,.14)');line.addColorStop(1,'rgba(52,69,54,0)');
        c.fillStyle=line;c.fillRect(x,y-4,1,75);
      }
      for(let i=0;i<2700;i++){
        const x=rand()*w,y=tide(x)+(rand()-.35)*(rand()*35);
        c.fillStyle=i%5?'rgba(216,210,171,.31)':'rgba(104,117,91,.25)';c.fillRect(x,y,.7+rand()*2,.3+rand());
      }
    });
    for(const s of [-1,1]){
      decal(salt,s*3.78,.67,-7.196,2.62,.70);
      decal(salt,s*3.70,.68,-7.80,2.72,.70,0,Math.PI);
      decal(salt,s*4.423,.52,-11.38,6.95,.69,0,-s*Math.PI/2);
    }
    decal(salt,0,.63,-14.965,8.74,.84);
    // A second, thinner weathered observation record is still visible above the white line.
    const tideDate=patch(236,62,(c,w,h)=>{
      c.fillStyle='#9b7055';c.fillRect(0,38,w,4);c.beginPath();c.moveTo(3,34);c.lineTo(16,19);c.lineTo(28,34);c.fill();
      c.font='bold 20px "Songti SC",serif';c.fillText('大　潮　留　痕',48,28);chips(c,w,h,275);
    });
    decal(tideDate,4.48,1.09,-7.194,.72,.19);
    // Recessed steel drain channels and removable slotted drain covers.
    for(const [x,front,end] of [[-4.74,-1.27,-7.06],[4.74,-1.27,-7.06],[-4.02,-7.96,-14.62],[4.02,-7.96,-14.62]]){
      const len=front-end,z=(front+end)*.5;
      box(x,-.029,z,.247,.044,len,rubber,wetBlack);
      for(const dx of [-.128,.128])box(x+dx,-.009,z,.024,.016,len,alloy,iron);
      const n=Math.floor(len/.107);
      for(let i=0;i<n;i++)box(x,-.009,front-(i+.42)*len/n,.241,.017,.030,alloy,i%11?0x6a7369:0x837f68);
      for(let i=0;i<5;i++){
        const zz=front-.24-i*(len-.48)/4;box(x,-.007,zz,.262,.013,.056,alloy,iron);
      }
    }
    for(const x of [-3.24,0,3.24])box(x,-.006,-4.27,.009,.004,6.41,rubber,0x505951);
    for(const x of [-2.75,0,2.75])box(x,-.006,-11.33,.009,.004,7.13,rubber,0x505951);
    for(const z of [-2.52,-5.41,-10.02,-12.46])box(0,-.006,z,z<-7.5?7.85:9.21,.004,.011,rubber,0x505951);
    // Cast chequer-plate threshold; the brightest markings frame the slot instead of covering the walk line.
    box(0,-.022,-7.50,3.60,.039,.36,alloy,0x68736d);
    for(const z of [-7.652,-7.348])box(0,-.009,z,3.60,.016,.022,alloy,br);
    for(let i=0;i<47;i++){
      const x=-1.73+i*.075;
      for(const dz of [-.08,.08])box(x,-.0045,-7.50+dz,.036,.007,.010,alloy,0x959a87,[0,i%2?.65:-.65,0]);
    }
    for(const x of [-4.2,-2.87,2.87,4.2])for(const z of [-2.14,-6.63])bolt(x,-.007,z,.016,'floor');
    // Warm shielded bulkhead light, high to the side of the radio so that it never blocks the desk.
    const lampX=-1.43,lampY=1.98,lampZ=-14.76;
    const lampShell=surf(0xefc17f,.37,.20,{emissive:0xfb9d49,emissiveIntensity:.8});
    const lampCore=surf(0xffefd2,.30,.13,{emissive:0xffae58,emissiveIntensity:3.1});
    box(lampX,lampY,lampZ-.091,.33,.51,.135,enamel,ra);
    batch(ball,lampShell,0xffffff,[lampX,lampY,lampZ],[.116,.205,.084]);
    batch(ball,lampCore,0xffffff,[lampX,lampY,lampZ+.050],[.082,.172,.050]);
    for(const dy of [-.166,-.078,.015,.109,.164]){
      const width=.123*Math.sqrt(1-Math.pow(dy/.23,2));
      rod([lampX-width,lampY+dy,lampZ+.062],[lampX+width,lampY+dy,lampZ+.062],.0085,alloy,iron);
    }
    for(const dx of [-.067,.067])rod([lampX+dx,lampY-.17,lampZ+.067],[lampX+dx,lampY+.17,lampZ+.067],.0085,alloy,iron);
    box(lampX,lampY+.212,lampZ,.31,.045,.23,enamel,ra);
    for(const s of [-1,1])bolt(lampX+s*.135,lampY+.212,lampZ+.095,.016,'front');
    const radial=map(192,192,(c,w,h)=>{
      const r=w/2,g=c.createRadialGradient(r,r,0,r,r,r);g.addColorStop(0,'rgba(255,228,166,1)');g.addColorStop(.12,'rgba(255,194,104,.72)');g.addColorStop(.36,'rgba(236,143,65,.27)');g.addColorStop(.72,'rgba(233,128,65,.063)');g.addColorStop(1,'rgba(220,110,56,0)');c.fillStyle=g;c.fillRect(0,0,w,h);
    });
    const halo=keep(new T.MeshBasicMaterial({map:radial,transparent:true,opacity:.60,blending:T.AdditiveBlending,depthWrite:false}));
    function image(mat,x,y,z,w,h,rx=0){
      const o=sheet(planeGeo,mat,x,y,z);o.scale.set(w,h,1);o.rotation.x=rx;o.castShadow=false;return o;
    }
    image(halo,lampX,lampY,-14.957,2.70,2.08);
    image(halo,lampX,lampY,lampZ+.103,.61,.70);
    const lamp=new T.PointLight(0xffbd72,13.0,5.60,2);lamp.position.set(lampX,lampY,lampZ+.22);root.add(lamp);
    // Scattered surface water and faint irregular salt rims pick up the existing game environment.
    const wet=keep(new T.MeshPhysicalMaterial({color:0x4c635e,metalness:.24,roughness:.152,clearcoat:.88,clearcoatRoughness:.14,transparent:true,opacity:.39,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2}));
    const waterP=[],waterI=[],shore=[];
    function puddle(x,z,sx,sz){
      const start=waterP.length/3;waterP.push(x,-.004,z);const seed=rand()*TAU;
      for(let i=0;i<=58;i++){
        const a=i*TAU/58,r=.82+.13*Math.sin(3*a+seed)+.072*Math.sin(8*a-seed)+.033*Math.sin(12*a);
        const xx=x+sx*r*Math.cos(a),zz=z+sz*r*Math.sin(a);waterP.push(xx,-.004,zz);
        if(i<58)waterI.push(start,start+i+2,start+i+1);
        if(i>0&&Math.sin(a*4+seed)>.43){const k=waterP.length-6;shore.push(waterP[k],-.002,waterP[k+2],xx,-.002,zz);}
      }
    }
    for(const args of [[-3.78,-3.15,.95,.34],[3.75,-5.54,.59,1.0],[-1.36,-6.57,.90,.29],[2.23,-8.31,.72,.27],[-3.2,-10.90,.66,1.10],[-.55,-13.32,.93,.36]])puddle(...args);
    const basin=keep(new T.BufferGeometry());basin.setAttribute('position',new T.Float32BufferAttribute(waterP,3));basin.setIndex(waterI);basin.computeVertexNormals();sheet(basin,wet).castShadow=false;
    const rimGeo=keep(new T.BufferGeometry());rimGeo.setAttribute('position',new T.Float32BufferAttribute(shore,3));
    const rim=keep(new T.LineBasicMaterial({color:0x9aada0,transparent:true,opacity:.31,depthWrite:false}));root.add(new T.LineSegments(rimGeo,rim));
    const artGeo=keep(new T.BufferGeometry());artGeo.setAttribute('position',new T.Float32BufferAttribute(art.p,3));artGeo.setAttribute('normal',new T.Float32BufferAttribute(art.n,3));artGeo.setAttribute('uv',new T.Float32BufferAttribute(art.uv,2));artGeo.setIndex(art.i);
    const decals=sheet(artGeo,labelMat);decals.castShadow=false;
    for(const b of batches.values()){
      const o=keep(new T.InstancedMesh(b.g,b.m,b.t.length));
      for(let i=0;i<b.t.length;i++){o.setMatrixAt(i,b.t[i]);o.setColorAt(i,new T.Color(b.c[i]));}
      o.castShadow=b.m!==lampCore&&b.m!==lampShell;o.receiveShadow=true;o.computeBoundingSphere();root.add(o);
    }
    const position=new T.Vector3();
    function update(t=0,height=0){
      if(disposed)return;
      root.getWorldPosition(position);
      for(const [uniform,local] of saltLines)uniform.value=position.y+local;
      const progress=T.MathUtils.clamp(Number.isFinite(height)?height/3:0,0,1),time=Number.isFinite(t)?t:0;
      lamp.intensity=12.25+.85*progress+.22*Math.sin(time*2.19)+.10*Math.sin(time*5.24+.56);
    }
    update();
    return {update,dispose(){
      if(disposed)return;disposed=true;root.removeFromParent();for(const r of owned)r.dispose();root.clear();owned.clear();
    }};
  }
  return {create};
})();
