// Original fixed survey pier. Shared concrete scans are supplied by TideConcrete.
const TideSoundingsEnv=(()=>{
  'use strict';
  function create(parent,world){
    const T=THREE,root=new T.Group();root.name='北岬 · 旧验潮所';parent.add(root);
    const owned=new Set(),keep=v=>(owned.add(v),v),geometries=new Map(),batches=new Map(),waterlines=[];
    const TAU=2*Math.PI,v=(x,y,z)=>new T.Vector3(x,y,z),q=new T.Quaternion(),e=new T.Euler(),yAxis=v(0,1,0);
    let seed=935728,disposed=false;
    const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
    function geo(name,make){if(!geometries.has(name))geometries.set(name,keep(make()));return geometries.get(name);}
    const block=geo('block',()=>new T.BoxGeometry(1,1,1)),pipe=geo('pipe',()=>new T.CylinderGeometry(1,1,1,16)),nut=geo('nut',()=>new T.CylinderGeometry(1,1,1,6)),ball=geo('oval',()=>new T.SphereGeometry(1,18,12)),plane=geo('flat',()=>new T.PlaneGeometry(1,1));
    const mat=(t,rough,metal,opt={})=>keep(new T.MeshStandardMaterial({color:t,roughness:rough,metalness:metal,...opt}));
    function texture(w,h,draw){
      const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);
      const t=keep(new T.CanvasTexture(c));t.colorSpace=T.SRGBColorSpace;t.anisotropy=8;return t;
    }
    const mottled=texture(256,256,(c,w,h)=>{
      const image=c.createImageData(w,h);const coarse=[];
      for(let i=0;i<17*17;i++)coarse.push(random());
      for(let y=0;y<h;y++)for(let x=0;x<w;x++){
        const i=(w*y+x)*4,xx=x/16,yy=y/16,ix=xx|0,iy=yy|0,u=xx-ix,v=yy-iy;
        const d=(coarse[iy*17+ix]*(1-u)+coarse[iy*17+ix+1]*u)*(1-v)+(coarse[(iy+1)*17+ix]*(1-u)+coarse[(iy+1)*17+ix+1]*u)*v;
        const n=random(),val=157+47*d+39*n,ox=n>.964?28:0;
        image.data[i]=val+5;image.data[i+1]=val-ox*.62;image.data[i+2]=val-8-ox;image.data[i+3]=255;
      }
      c.putImageData(image,0,0);
      c.lineWidth=.70;for(let i=0;i<102;i++){
        const x=random()*w,y=random()*h;c.strokeStyle=i%3?'rgba(94,87,69,.23)':'rgba(242,237,210,.45)';
        c.beginPath();c.moveTo(x,y);c.lineTo(x+random()*13+2,y+random()*4-2);c.stroke();
      }
    });mottled.wrapS=mottled.wrapT=T.RepeatWrapping;
    const steel=mat(0xffffff,.49,.63,{map:mottled,bumpMap:mottled,bumpScale:.009}),paint=mat(0xffffff,.68,.34,{map:mottled}),soft=mat(0xffffff,.83,.086),rubber=mat(0xffffff,.76,.039);
    const char=0x3d4f50,grey=0x7b8d86,zinc=0x9bada5,drab=0x6e847e,warm=0x948365,rust=0x95674a;
    function slab(color,line){
      const m=typeof TideConcrete==='undefined'?mat(color,.84,.04):keep(TideConcrete.material(color,line));
      if(m.userData.waterline)waterlines.push([m.userData.waterline,line]);return m;
    }
    const concrete=slab(0xbab8a9,.08),rock=slab(0x87978c,-.04),nose=slab(0xc7c4ad,.03);
    function part(g,m,t,p,s,r){
      const k=g.uuid+m.uuid;let b=batches.get(k);if(!b){b={g,m,x:[],t:[]};batches.set(k,b);}
      if(Array.isArray(r))q.setFromEuler(e.set(...r));else if(r)q.copy(r);else q.identity();
      b.x.push(new T.Matrix4().compose(v(...p),q,v(...s)));b.t.push(t);
    }
    function box(x,y,z,w,h,d,m,c=0xffffff,r=null){part(block,m,c,[x,y,z],[w,h,d],r);}
    function cylinder(x,y,z,r,h,m,c,orientation=null){part(pipe,m,c,[x,y,z],[r,h,r],orientation);}
    function rivet(x,y,z,r,axis='z',c=0xa1a38b){part(nut,steel,c,[x,y,z],[r,r*.77,r],axis==='z'?[Math.PI/2,0,0]:axis==='x'?[0,0,Math.PI/2]:null);}
    function ring(x,y,z,r,wire,m,c,rotation=null){const k='ring'+Math.round(wire/r*1000);part(geo(k,()=>new T.TorusGeometry(1,wire/r,8,40)),m,c,[x,y,z],[r,r,r],rotation);}
    function beam(a,b,w,d,m,c,round=false){
      const p=v(...a),v2=v(...b),delta=v2.clone().sub(p),len=delta.length();if(len<.001)return;
      part(round?pipe:block,m,c,p.lerp(v2,.5).toArray(),[w,len,d],new T.Quaternion().setFromUnitVectors(yAxis,delta.divideScalar(len)));
    }
    function mesh(g,m,x=0,y=0,z=0){const o=new T.Mesh(g,m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;root.add(o);return o;}
    const tileCanvas=document.createElement('canvas');tileCanvas.width=2048;tileCanvas.height=1024;
    const ctx=tileCanvas.getContext('2d'),atlas=keep(new T.CanvasTexture(tileCanvas));atlas.colorSpace=T.SRGBColorSpace;atlas.anisotropy=8;
    const decalMat=mat(0xffffff,.84,.055,{map:atlas,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2});
    let ax=4,ay=4,th=0;const decals={p:[],uv:[],n:[],i:[]};
    function tile(w,h,draw){
      if(ax+w+4>2048){ax=4;ay+=th+6;th=0;}if(ay+h+3>1024)throw Error('Relay atlas overflow');
      const x=ax,y=ay;ax+=w+6;th=Math.max(th,h);ctx.save();ctx.beginPath();ctx.rect(x,y,w,h);ctx.clip();ctx.translate(x,y);draw(ctx,w,h);ctx.restore();
      atlas.needsUpdate=true;return [(x+.5)/2048,1-(y+h-.5)/1024,(x+w-.5)/2048,1-(y+.5)/1024];
    }
    function stamp(tile,x,y,z,w,h,rx=0,ry=0,rz=0){
      const n=decals.p.length/3,q=new T.Quaternion().setFromEuler(new T.Euler(rx,ry,rz)),norm=v(0,0,1).applyQuaternion(q);
      for(const [u,vv] of [[-.5,-.5],[.5,-.5],[.5,.5],[-.5,.5]]){
        const p=v(u*w,vv*h,0).applyQuaternion(q);decals.p.push(p.x+x,p.y+y,p.z+z);decals.n.push(...norm.toArray());
      }
      const [a,b,c,d]=tile;decals.uv.push(a,b,c,b,c,d,a,d);decals.i.push(n,n+1,n+2,n,n+2,n+3);
    }
    function wear(c,w,h,density=.012){
      for(let i=0;i<w*h*density;i++){c.fillStyle=i%3?'rgba(52,62,52,.25)':'rgba(237,219,177,.28)';c.fillRect(random()*w,random()*h,.4+random()*2.9,.4+random()*2);}
      c.save();c.globalCompositeOperation='destination-out';for(let i=0;i<w*h*density*.30;i++){c.fillStyle='rgba(0,0,0,.62)';c.fillRect(random()*w,random()*h,.5+random()*6,.5+random()*2.1);}c.restore();
    }
    function indexed(pos,norm,idx){
      const g=keep(new T.BufferGeometry());g.setAttribute('position',new T.Float32BufferAttribute(pos,3));if(norm)g.setAttribute('normal',new T.Float32BufferAttribute(norm,3));g.setIndex(idx);if(!norm)g.computeVertexNormals();return g;
    }
    // The upper apron sits on a massive sea caisson. Form joints, drain bores and steel tie plates give the tidal face a human scale.
    box(0,-1.100,3.90,13.10,5.32,7.00,concrete);
    for(const s of [-1,1]){
      box(s*6.455,1.457,3.90,.185,.202,6.99,nose);
      box(s*6.347,1.553,3.90,.045,.010,6.82,steel,zinc);
      for(const z of [.99,2.69,4.38,6.08])box(s*6.551,-.72,z,.008,3.79,.011,rubber,0x4f5d54);
    }
    for(const x of [-6.32,-3.25,0,3.28,6.31])box(x,1.5602,3.90,.009,.002,6.82,rubber,0x667067);
    for(const z of [.64,3.04,5.40])box(0,1.5604,z,12.62,.002,.011,rubber,0x667067);
    for(const x of [-3.98,-2.07,-.03,2.04,4.03,6.08]){
      box(x,-.96,.397,.014,4.76,.018,rubber,0x4e5d55);
      for(const y of [-1.60,-.63,.34,1.02]){
        cylinder(x+.30,y,.409,.037,.050,steel,grey,[Math.PI/2,0,0]);rivet(x+.30,y,.38,.021,'z',rust);
      }
    }
    for(const x of [-2.73,.56,3.69]){
      box(x,.36,.39,.46,.54,.047,paint,drab);ring(x,.36,.346,.149,.027,steel,warm);
      cylinder(x,.36,.358,.136,.027,rubber,0x344843,[Math.PI/2,0,0]);
      for(const dx of [-.155,.155])for(const dy of [-.197,.197])rivet(x+dx,.36+dy,.352,.019,'z');
    }
    for(const z of [.80,7.09]){
      box(1.08,1.5601,z,10.32,.001,.193,rubber,0x45534e);
      for(let i=0;i<93;i++)box(-4.04+i*.111,1.5602,z,.031,.003,.17,steel,i%9?grey:warm);
      for(const dz of [-.105,.105])box(1.08,1.5601,z+dz,10.34,.002,.018,steel,grey);
    }
    // Eight true treads with solid risers and individual hewn aggregate nosings.
    const sx=-5.35;
    for(let i=0;i<8;i++){
      const top=1.27-.29*i,z=.40-(i+.5)*.56,bottom=-3.16;
      box(sx,(top+bottom)*.5,z,2.30,top-bottom,.56,concrete);
      box(sx,top-.042,z-.240,2.296,.084,.080,nose);
      for(const x of [-6.423,-4.277])box(x,top-.039,z-.014,.087,.073,.46,nose);
      // Broken original anti-slip topping, inlaid flush with the stone.
      for(const dz of [-.193,-.146])box(sx,top-.0006,z+dz,1.91,.001,.016,steel,i<3?0x798275:0x658074);
      box(sx-.86,top-.181,z-.284,.183,.038,.009,paint,0x8b8a71);
    }
    box(-5.35,-1.956,-4.74,2.30,2.39,1.44,rock);
    box(-5.35,-.817,-4.74,2.299,.113,1.438,nose);
    // Different generations of survey sill. Both have an uninterrupted working face, with all fittings below the top.
    const surfaces=[{x:.43,y:-.76,z:-5.03,w:2.04,d:1.90},{x:1.48,y:-.92,z:-9.04,w:1.90,d:1.84}];
    for(const [i,f] of surfaces.entries()){
      box(f.x,f.y-.192,f.z,f.w,.384,f.d,i?rock:concrete);
      cylinder(f.x,f.y-1.72,f.z,i?.59:.68,2.99,rock,0xffffff);
      cylinder(f.x,f.y-.402,f.z,i?.76:.86,.210,nose,0xffffff);
      for(const sign of [-1,1]){
        box(f.x+sign*(f.w*.5-.036),f.y-.082,f.z,.071,.159,f.d-.012,steel,i?0x547366:0x837f67);
        box(f.x,f.y-.084,f.z+sign*(f.d*.5-.030),f.w-.095,.160,.060,steel,i?0x547366:0x847d66);
        for(const zz of [-.33,0,.33])rivet(f.x+sign*(f.w*.5+.003),f.y-.081,f.z+zz,.028,'x',rust);
      }
      for(const dx of [-.37,.37])for(const dz of [-.36,.36])rivet(f.x+dx,f.y-.005,f.z+dz,.018,'y');
    }
    // Rail fragments protect only the outer landward corners, keeping the two survey bearings and full stair width open.
    function rail(a,b,h){
      const p=v(...a),r=v(...b),n=Math.max(1,Math.ceil(p.distanceTo(r)/1.8));
      for(let i=0;i<=n;i++){
        const pt=p.clone().lerp(r,i/n);box(pt.x,pt.y+.02,pt.z,.145,.037,.149,steel,drab);
        beam(pt.toArray(),[pt.x,pt.y+h,pt.z],.026,.026,paint,grey,true);
      }
      for(const frac of [.48,1])beam([a[0],a[1]+h*frac,a[2]],[b[0],b[1]+h*frac,b[2]],frac===1?.030:.016,frac===1?.030:.016,steel,grey,true);
    }
    rail([-6.47,1.56,1.17],[-6.47,1.56,3.16],.76);
    rail([-2.81,1.56,7.27],[-.47,1.56,7.27],.63);
    rail([5.56,1.56,7.27],[6.40,1.56,7.27],.63);
    // Historic stilling-well hut, cantilevered to the west. Every wall and roof edge is outside the upper gameplay rectangle.
    const hx=-8.14,hz=5.31,hw=2.32,hd=2.76,roofY=4.22;
    cylinder(hx,-.99,hz,1.28,4.45,rock,0xffffff);
    cylinder(hx,1.25,hz,1.41,.30,nose,0xffffff);
    box(hx,1.41,hz,2.84,.26,3.16,concrete);
    box(hx,1.59,hz,hw+.18,.18,hd+.18,paint,0x687b71);
    const timberMap=texture(384,92,(c,w,h)=>{
      c.fillStyle='#ccc3a9';c.fillRect(0,0,w,h);
      for(let i=0;i<680;i++){
        const x=random()*w,y=random()*h,l=8+random()*188,sw=random()*4;
        c.strokeStyle=i%4?'rgba(91,77,59,.23)':'rgba(242,227,199,.43)';c.lineWidth=.31+random()*.85;
        c.beginPath();c.moveTo(x,y);c.bezierCurveTo(x+l*.32,y+sw,x+l*.72,y-sw,x+l,y+.50);c.stroke();
      }
    });
    const board=mat(0xffffff,.76,.12,{map:timberMap,bumpMap:timberMap,bumpScale:.012});
    const wallH=2.38,wallY=2.82,seaGreen=0x87978c;
    box(hx,wallY,hz-hd*.5,hw,wallH,.120,board,seaGreen);
    box(hx-hw*.5,wallY,hz,.12,wallH,hd,board,seaGreen);
    box(hx,wallY,hz+hd*.5,hw,wallH,.12,board,seaGreen);
    const east=hx+hw*.5;
    for(const [z,d] of [[hz-1.20,.37],[hz-.01,.38],[hz+1.11,.55]])box(east,wallY,z,.12,wallH,d,board,seaGreen);
    box(east,1.98,hz,.12,.74,hd,board,seaGreen);box(east,3.84,hz,.12,.34,hd,board,seaGreen);
    for(const x of [hx-hw*.5,hx+hw*.5])for(const z of [hz-hd*.5,hz+hd*.5])box(x,wallY,z,.142,wallH+.03,.149,board,0x819385);
    for(let j=0;j<15;j++){
      const y=1.74+j*.157;
      box(hx,y,hz-hd*.5-.066,hw-.04,.018,.020,board,0xa3ab96);
      box(hx,y,hz+hd*.5+.066,hw-.04,.018,.020,board,0xa3ab96);
      box(hx-hw*.5-.066,y,hz,.020,.018,hd-.04,board,0xa3ab96);
    }
    const pane=mat(0x638283,.23,.23,{emissive:0x64858c,emissiveIntensity:.20,transparent:true,opacity:.59});
    for(const zz of [hz-.595,hz+.54]){
      box(east+.033,3.01,zz,.025,1.245,.765,pane,0xffffff);
      for(const off of [-.412,0,.412])box(east+.076,3.01,zz+off,.088,1.31,off===0?.023:.058,board,0xb3b5a0);
      for(const h of [2.36,3.04,3.65])box(east+.081,h,zz,.092,.048,.864,board,0xb3b5a0);
      box(east+.113,2.31,zz,.18,.066,.94,steel,grey);
    }
    const front=hz+hd*.5;
    box(hx-.35,2.68,front+.076,.82,1.98,.067,board,0x788577);
    for(const xx of [-.76,.057])box(hx+xx,2.68,front+.12,.054,2.00,.047,board,0xa0aa96);
    box(hx-.35,3.68,front+.12,.86,.06,.047,board,0xa0aa96);
    for(const xx of [-.60,-.36,-.12])box(hx+xx,2.67,front+.114,.012,1.87,.022,board,0x667761);
    box(hx-.086,2.60,front+.148,.069,.145,.045,steel,warm);
    beam([hx-.11,2.60,front+.19],[hx-.22,2.60,front+.19],.015,.015,steel,warm,true);
    const gable=new T.Shape();gable.moveTo(-hw*.5,0);gable.lineTo(hw*.5,0);gable.lineTo(0,.82);gable.closePath();
    const roofEnd=geo('gable end',()=>new T.ExtrudeGeometry(gable,{depth:.081,bevelEnabled:false}));
    for(const z of [hz-hd*.5-.04,front-.04])part(roofEnd,board,0x98a593,[hx,4.0,z],[1,1,1],null);
    const run=1.405,rise=.79,hyp=Math.hypot(run,rise),angle=Math.atan2(rise,run),peak=4.84;
    for(const s of [-1,1]){
      box(hx+s*run*.5,peak-rise*.5,hz,hyp,.090,3.10,paint,0x64796e,[0,0,-s*angle]);
      for(let j=0;j<8;j++){
        const z=hz-1.46+j*.418;
        beam([hx,peak+.051,z],[hx+s*run,peak-rise+.051,z],.024,.027,steel,0x7d9185);
      }
      box(hx+s*run,peak-rise-.011,hz,.089,.12,3.12,board,0xa8b09b);
      for(const sz of [-1,1])beam([hx,peak+.004,hz+sz*1.552],[hx+s*run,peak-rise,hz+sz*1.552],.10,.088,board,0xb9bca5);
      cylinder(hx+s*run,peak-rise-.095,hz,.058,3.12,steel,0x7f9285,[Math.PI/2,0,0]);
    }
    cylinder(hx,peak+.056,hz,.064,3.12,steel,0x8ca190,[Math.PI/2,0,0]);
    const chimneyX=hx-.31,chimneyZ=hz-.71;
    cylinder(chimneyX,4.93,chimneyZ,.102,.57,paint,0x526e65);
    part(geo('vent cap',()=>new T.ConeGeometry(.172,.13,18)),steel,0x8c9f90,[chimneyX,5.26,chimneyZ],[1,1,1],null);
    cylinder(east+.143,2.62,front-.22,.032,2.76,steel,0x71887c);
    for(const y of [1.76,2.75,3.73])box(east+.123,y,front-.22,.091,.056,.080,paint,grey);
    // Historical tide-well intake and sacrificial fenders, entirely west of the traversable route.
    for(const z of [2.93,4.18,5.57,6.91]){
      const x=-6.68;
      box(x,-.05,z,.19,2.83,.29,board,0x6c7967);
      for(const y of [-.83,.58])box(x-.011,y,z,.20,.103,.306,steel,0x686d5c);
      ring(x-.15,-.19,z,.255,.079,rubber,0x343e37,[0,Math.PI/2,.05]);
    }
    for(const [x,z,hi,r] of [[-7.91,-.23,.52,.19],[-8.20,.07,.36,.154],[-8.03,.34,.12,.186],[-7.78,-5.08,-.24,.21],[-8.17,-5.36,-.38,.158]]){
      beam([x-.09,-4.65,z],[x,hi,z+.045],r,r,board,0x69725d,true);
      for(let i=0;i<4;i++){
        const a=i*TAU/4+.18;beam([x+.076*Math.sin(a),hi-.14,z+.076*Math.cos(a)],[x+.091*Math.sin(a),hi+.026+i*.023,z+.091*Math.cos(a)],.048,.044,board,0x989178);
      }
      for(const y of [hi-.25,hi-.40])ring(x,y,z+.03,r+.009,.024,steel,rust,[Math.PI/2,0,0]);
    }
    // Sediment-coated seams, weathered enamel plates and an extant bronze survey benchmark.
    const hutSign=tile(570,125,(c,w,h)=>{
      c.fillStyle='#465b52';c.fillRect(0,0,w,h);c.strokeStyle='#c4bf9c';c.lineWidth=3;c.strokeRect(7,7,w-14,h-14);
      c.fillStyle='#e6dbb8';c.font='bold 50px "Songti SC","Microsoft YaHei",serif';c.textAlign='center';c.textBaseline='middle';c.fillText('北 岬 旧 验 潮 所',w/2,47);
      c.font='bold 14px monospace';c.fillStyle='#c5cab3';c.fillText('NORTH CAPE · TIDAL OBSERVATORY',w/2,92);wear(c,w,h);
    });
    box(east+.099,3.865,hz,.060,.40,1.94,paint,char);stamp(hutSign,east+.137,3.865,hz,1.87,.369,0,Math.PI/2);
    const wellName=tile(280,84,(c,w,h)=>{
      c.fillStyle='#a49b7e';c.fillRect(0,0,w,h);c.fillStyle='#40554b';c.font='bold 29px "Songti SC",serif';c.fillText('旧潮井　贰',15,39);
      c.font='12px monospace';c.fillText('海床水文 / 井基',18,66);wear(c,w,h);
    });
    box(hx+.622,3.32,front+.086,.66,.227,.052,steel,grey);stamp(wellName,hx+.622,3.32,front+.122,.630,.197);
    const datum=tile(252,252,(c,w,h)=>{
      const r=w/2;c.translate(r,r);c.beginPath();c.arc(0,0,r-3,0,TAU);c.clip();
      const g=c.createRadialGradient(-18,-21,5,0,0,r);g.addColorStop(0,'#ae9c73');g.addColorStop(.83,'#918463');g.addColorStop(1,'#5f6a58');c.fillStyle=g;c.fillRect(-r,-r,w,h);
      c.strokeStyle='#4c5a49';c.lineWidth=4;for(const rr of [.77,.91]){c.beginPath();c.arc(0,0,r*rr,0,TAU);c.stroke();}
      c.fillStyle='#3c5044';c.font='bold 23px "Songti SC",serif';c.textAlign='center';c.fillText('北岬港务段',0,-48);c.font='bold 18px serif';c.fillText('永久水准点',0,60);
      c.lineWidth=5;c.beginPath();c.moveTo(-46,13);c.lineTo(0,-22);c.lineTo(46,13);c.closePath();c.stroke();c.beginPath();c.moveTo(-54,22);c.lineTo(54,22);c.stroke();
      c.translate(-r,-r);wear(c,w,h,.012);
    });
    cylinder(-4.14,1.566,1.70,.178,.013,steel,warm);stamp(datum,-4.14,1.574,1.70,.336,.336,-Math.PI/2);
    const marker=tile(265,81,(c,w,h)=>{
      c.fillStyle='#c0b298';c.font='bold 28px "Songti SC",serif';c.fillText('水 准 原 点',10,37);
      c.font='12px monospace';c.fillText('PERMANENT BENCH MARK',12,63);wear(c,w,h);
    });
    stamp(marker,-4.05,1.561,2.115,.62,.19,-Math.PI/2);
    const status=tile(236,77,(c,w,h)=>{
      c.fillStyle='#c9c2a2';c.fillRect(0,0,w,h);c.fillStyle='#3c5148';c.font='bold 32px serif';c.fillText('石 级 湿 滑',12,39);
      c.font='12px sans-serif';c.fillText('涨潮时请看清脚下',15,61);wear(c,w,h);
    });
    stamp(status,-6.37,1.5595,1.98,.31,.11,-Math.PI/2,0,Math.PI/2);
    const band=tile(480,126,(c,w,h)=>{
      const yAt=x=>37+5*Math.sin(x*.033)+2.7*Math.sin(x*.118);
      for(let x=0;x<w;x++){
        const y=yAt(x)+random()*2,g=c.createLinearGradient(0,y-3,0,y+74);g.addColorStop(0,'rgba(227,221,186,0)');g.addColorStop(.07,'rgba(224,217,181,'+(.29+random()*.36)+')');g.addColorStop(.21,'rgba(144,152,114,.25)');g.addColorStop(.64,'rgba(70,88,64,.18)');g.addColorStop(1,'rgba(44,65,51,0)');c.fillStyle=g;c.fillRect(x,y-3,1,77);
      }
      for(let i=0;i<2800;i++){const x=random()*w;c.fillStyle=i%4?'rgba(217,208,171,.35)':'rgba(83,100,72,.29)';c.fillRect(x,yAt(x)+(random()-.35)*random()*31,.4+random()*2.1,.4+random());}
    });
    stamp(band,1.17,-.25,.394,10.66,1.00,0,Math.PI);
    stamp(band,-6.552,-.21,3.91,6.92,.96,0,-Math.PI/2);stamp(band,6.552,-.21,3.91,6.92,.96,0,Math.PI/2);
    stamp(band,0,-.29,7.402,13.05,.91);
    for(const f of surfaces)for(const s of [-1,1])stamp(band,f.x,f.y-.268,f.z+s*(f.d*.5+.001),f.w-.032,.19,0,s>0?0:Math.PI);
    for(const [f,label] of surfaces.map((d,i)=>[d,i?'乙':'甲'])){
      const plaque=tile(140,86,(c,w,h)=>{
        c.fillStyle='#b1aa89';c.fillRect(0,0,w,h);c.strokeStyle='#67715c';c.lineWidth=3;c.strokeRect(5,5,w-10,h-10);c.fillStyle='#3e5348';c.font='bold 49px serif';c.textAlign='center';c.fillText(label,w/2,60);wear(c,w,h);
      });
      stamp(plaque,f.x+f.w*.30,f.y-.081,f.z+f.d*.5+.005,.172,.110);
    }
    const decalGeo=indexed(decals.p,decals.n,decals.i);decalGeo.setAttribute('uv',new T.Float32BufferAttribute(decals.uv,2));mesh(decalGeo,decalMat).castShadow=false;
    // Fucus-like fronds, dried sea wrack and intertidal shell clusters fix the scale on stone rather than the water.
    const leafPos=[],leafIdx=[],leafCol=[],seedNodes=[];
    function wrack(x,y,z,count,face,wet){
      const side=v(Math.cos(face),0,-Math.sin(face)),normal=v(Math.sin(face),0,Math.cos(face));
      for(let j=0;j<count;j++){
        const area=random(),length=(wet?.24:.19)+random()*(wet?.36:.42),spread=(random()-.5)*.34;
        const along=(random()-.5)*.31,out=.008+random()*.024,tint=new T.Color((wet?[0x495c3f,0x546446,0x4c603e,0x6c6d42]:[0x746443,0x897852,0x70613e,0x958558])[j%4]);
        const origin=v(x,y,z).addScaledVector(side,along).addScaledVector(normal,out);
        const start=leafPos.length/3,segments=8;
        function pos(t){
          const r=origin.clone().addScaledVector(side,t*spread+Math.sin(t*6+area*4)*.033*t);
          r.addScaledVector(normal,wet?.030+t*.084+Math.sin(t*5.7+area)*.031:Math.sin(t*Math.PI)*length*.24+.02);
          r.y+=wet?-t*length+.028*Math.sin(t*7+area):Math.sin(t*Math.PI)*.043-t*.047;
          return r;
        }
        for(let k=0;k<=segments;k++){
          const t=k/segments,pt=pos(t),leafW=(.004+.018*Math.pow(Math.sin(t*Math.PI),.70))*(1+.25*Math.sin(t*10+area));
          for(const s of [-1,1]){leafPos.push(...pt.clone().addScaledVector(side,s*leafW).toArray());leafCol.push(tint.r*(.85+.15*t),tint.g,tint.b*(.9+.1*t));}
          if(k<segments){const n=start+k*2;leafIdx.push(n,n+1,n+2,n+1,n+3,n+2);}
          if(k===5&&wet&&j%2===0)seedNodes.push(pos(t));
        }
      }
    }
    for(let i=0;i<29;i++){const x=-3.95+i*.36;wrack(x,-.46+random()*.29,.390,5,Math.PI,true);}
    for(let i=0;i<8;i++)wrack(-6.56,-.40,1.08+i*.81,5,-Math.PI/2,true);
    for(const f of surfaces)for(let i=0;i<6;i++)wrack(f.x-f.w*.40+i*f.w*.155,f.y-.13,f.z+f.d*.5+.008,4,0,true);
    for(let i=0;i<8;i++)wrack(-6.42,1.563,2.80+i*.42,4,-Math.PI/2,false);
    for(const [x,y,z,r] of [[-5.36,-.752,-4.12,.68],[-4.92,-.463,-3.10,.36],[-4.48,-.175,-2.64,.28]])for(let j=0;j<5;j++)wrack(x+(random()-.5)*r,y+.012,z,3,0,false);
    const leaves=indexed(leafPos,null,leafIdx);leaves.setAttribute('color',new T.Float32BufferAttribute(leafCol,3));
    const weedMat=mat(0xffffff,.42,.11,{vertexColors:true,side:T.DoubleSide});mesh(leaves,weedMat).castShadow=false;
    for(const p of seedNodes)part(ball,soft,0x66704b,p.toArray(),[.010,.019,.009],null);
    const limpet=geo('limpet',()=>new T.ConeGeometry(1,1,6));
    for(let i=0;i<118;i++){
      const x=-3.98+random()*10.18,y=-.87+random()*.59;
      part(limpet,soft,i%3?0xa7a78a:0x869078,[x,y,.389],[.021+random()*.017,.018,.023],[-Math.PI/2,0,0]);
    }
    const wet=keep(new T.MeshPhysicalMaterial({color:0x536b65,roughness:.135,metalness:.29,clearcoat:1,clearcoatRoughness:.12,transparent:true,opacity:.38,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2}));
    const wp=[],wi=[];
    function pool(x,y,z,rx,rz){
      const n=wp.length/3,ph=random()*TAU;wp.push(x,y,z);
      for(let i=0;i<=52;i++){
        const a=i*TAU/52,r=.81+.13*Math.sin(a*3+ph)+.065*Math.sin(a*8-ph)+.026*Math.sin(a*13);
        wp.push(x+rx*r*Math.cos(a),y,z+rz*r*Math.sin(a));if(i<52)wi.push(n,n+i+2,n+i+1);
      }
    }
    for(const t of [[-4.98,1.5603,1.08,.82,.26],[1.43,1.5603,1.28,.85,.28],[5.36,1.5603,3.94,.46,.71],[-2.31,1.5603,5.96,1.19,.46],[-5.29,-.756,-4.73,.83,.40]])pool(...t);
    for(let i=0;i<8;i++)pool(-5.35+.15*Math.sin(i),1.274-i*.29,.40-(i+.54)*.56,.58+.22*(i/7),.115);
    for(const f of surfaces)pool(f.x-.12,f.y+.003,f.z+.13,f.w*.40,f.d*.33);
    mesh(indexed(wp,null,wi),wet).castShadow=false;
    // Warm glass inside the lee wall is a small local contrast to the open seaward observation sector.
    const lx=east+.115,ly=3.17,lz=hz-.916;
    const lamp=mat(0xf6d399,.28,.12,{emissive:0xffc27d,emissiveIntensity:2.51});
    box(lx-.028,ly,lz,.078,.326,.212,paint,char);part(ball,lamp,0xffffff,[lx+.045,ly,lz],[.061,.122,.075],null);
    for(const sy of [-.081,.002,.085])beam([lx+.095,ly+sy,lz-.079],[lx+.095,ly+sy,lz+.079],.009,.009,steel,grey,true);
    for(const sz of [-.055,.055])beam([lx+.093,ly-.123,lz+sz],[lx+.093,ly+.124,lz+sz],.008,.008,steel,warm,true);
    const light=keep(new T.PointLight(0xffc17f,10.5,4.6,2));light.position.set(lx+.18,ly,lz);root.add(light);
    const glowMap=texture(112,112,(c,w,h)=>{
      const r=w/2,g=c.createRadialGradient(r,r,0,r,r,r);g.addColorStop(0,'rgba(255,235,180,1)');g.addColorStop(.12,'rgba(255,199,114,.70)');g.addColorStop(.37,'rgba(229,149,78,.20)');g.addColorStop(.75,'rgba(215,125,57,.065)');g.addColorStop(1,'rgba(210,117,60,0)');c.fillStyle=g;c.fillRect(0,0,w,h);
    });
    const halo=keep(new T.MeshBasicMaterial({map:glowMap,transparent:true,opacity:.48,depthWrite:false,blending:T.AdditiveBlending}));
    part(plane,halo,0xffffff,[lx+.11,ly,lz],[.57,.62,1],[0,Math.PI/2,0]);
    for(const b of batches.values()){
      const o=keep(new T.InstancedMesh(b.g,b.m,b.x.length));
      for(let i=0;i<b.x.length;i++){o.setMatrixAt(i,b.x[i]);o.setColorAt(i,new T.Color(b.t[i]));}
      o.castShadow=b.m!==halo&&b.m!==lamp&&b.m!==pane;o.receiveShadow=true;o.computeBoundingSphere();root.add(o);
    }
    const pos=new T.Vector3();
    function update(time=0,sea=-1.54){
      if(disposed)return;
      const sec=Number.isFinite(time)?time:0,h=Number.isFinite(sea)?sea:-1.54;
      root.getWorldPosition(pos);for(const [uniform,delta] of waterlines)uniform.value=pos.y+h+delta;
      weedMat.roughness=T.MathUtils.clamp(.42-(h+1.54)*.12,.28,.57);
      light.intensity=10.24+.25*Math.sin(sec*2.43)+.097*Math.sin(sec*5.2);
    }
    update();
    return {update,dispose(){if(disposed)return;disposed=true;root.removeFromParent();for(const r of owned)r.dispose();root.clear();owned.clear();}};
  }
  return {create};
})();
