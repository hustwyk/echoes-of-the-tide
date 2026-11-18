// Original glass chart conservation room. Shared concrete scans are supplied by TideConcrete.
const TideGlassEnv=(()=>{
  'use strict';
  function create(parent){
    const T=THREE,root=new T.Group();root.name='北岬 · 风暴海图修复室';parent.add(root);
    const owned=new Set(),keep=v=>(owned.add(v),v),geometries=new Map(),batches=new Map(),waterlines=[];
    const TAU=2*Math.PI,v=(x,y,z)=>new T.Vector3(x,y,z),q=new T.Quaternion(),e=new T.Euler(),yAxis=v(0,1,0);
    let seed=655287,disposed=false;
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
    const concrete=slab(0xb0b8a8,-.42),rock=slab(0x758983,-.58);
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
      if(ax+w+4>2048){ax=4;ay+=th+6;th=0;}if(ay+h+3>1024)throw Error('Glass chart room atlas capacity exceeded');
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
    const blue=0x536b69,iron=0x5d726d,cream=0xb6b197,bronze=0x9c8864;
    const north=-6.80,south=7.0,left=-6.0,right=6.0,spanZ=13.80;
    // A 16-tile photograph-like mineral texture. Individually cracked stones and wet grout keep the scale visible from close cameras.
    const tileMap=texture(768,768,(c,w,h)=>{
      const image=c.createImageData(w,h),s=w/4,grain=[];
      for(let i=0;i<17*17;i++)grain.push(random());
      const hues=[];for(let i=0;i<16;i++)hues.push([-4+random()*12,-3+random()*9,-5+random()*8]);
      for(let y=0;y<h;y++)for(let x=0;x<w;x++){
        const i=(y*w+x)*4,t=(y/s|0)*4+(x/s|0),hue=hues[t];
        const u=x/48,vv=y/48,ix=u|0,iy=vv|0,a=u-ix,b=vv-iy;
        const clouds=(grain[iy*17+ix]*(1-a)+grain[iy*17+ix+1]*a)*(1-b)+(grain[(iy+1)*17+ix]*(1-a)+grain[(iy+1)*17+ix+1]*a)*b;
        const r=random(),n=(clouds-.47)*23+(r-.5)*16,xx=x%s,yy=y%s,edge=Math.min(xx,yy,s-1-xx,s-1-yy);
        const grout=edge<1.5?-31:edge<3?6:0,vein=1.3*Math.sin(x*.11+y*.066)*Math.cos(y*.092);
        const chip=r>.987?-32:r<.012?24:0,colour=146+n+grout+chip+vein;
        image.data[i]=colour-2+hue[0];image.data[i+1]=colour+3+hue[1];image.data[i+2]=colour-9+hue[2];image.data[i+3]=255;
      }
      c.putImageData(image,0,0);
      for(let i=0;i<26;i++){
        const x=random()*w,y=random()*h;c.strokeStyle=i%4?'rgba(76,87,74,.19)':'rgba(78,80,66,.37)';c.lineWidth=.4+random()*.70;c.beginPath();c.moveTo(x,y);
        let xx=x,yy=y;for(let j=0;j<5;j++){xx+=random()*9+2;yy+=random()*13-4;c.lineTo(xx,yy);}c.stroke();
      }
      for(let i=0;i<4400;i++){const x=random()*w,y=random()*h;c.fillStyle=i%4?'rgba(208,204,177,.27)':'rgba(81,78,67,.27)';c.fillRect(x,y,.35+random()*1.45,.35+random()*1.6);}
    });
    tileMap.wrapS=tileMap.wrapT=T.RepeatWrapping;tileMap.repeat.set(12/2.80,spanZ/2.80);
    const tiles=mat(0xd3d5c3,.47,.13,{map:tileMap,bumpMap:tileMap,bumpScale:.008});
    box(0,-.362,.1,12,.72,spanZ,concrete);
    part(plane,tiles,0xffffff,[0,0,.1],[12,spanZ,1],[-Math.PI/2,0,0]);
    // Narrow inlaid border and original collection channels, all flush with the walking surface.
    for(const x of [-5.705,5.705]){
      box(x,.001,.10,.105,.002,13.35,paint,iron);box(x-Math.sign(x)*.078,.002,.10,.016,.002,13.34,steel,bronze);
    }
    for(const z of [-6.50,6.70]){
      box(0,.001,z,11.51,.002,.105,paint,iron);box(0,.002,z-Math.sign(z)*.078,11.40,.002,.016,steel,bronze);
    }
    for(const x of [-5.866,5.866]){
      box(x,.0018,.10,.131,.002,13.52,rubber,0x384e49);
      for(let i=0;i<102;i++)box(x,.004,-6.55+i*.132,.131,.005,.028,steel,i%9?grey:bronze);
    }
    // Slender steel columns and painted timber sill above each weathered caisson face.
    const woodTex=texture(480,96,(c,w,h)=>{
      c.fillStyle='#c4b698';c.fillRect(0,0,w,h);
      for(let i=0;i<755;i++){
        const x=random()*w,y=random()*h,l=9+random()*163,b=random()*4.0;
        c.strokeStyle=i%4?'rgba(78,66,51,.19)':'rgba(236,221,184,.43)';c.lineWidth=.25+random()*.91;
        c.beginPath();c.moveTo(x,y);c.bezierCurveTo(x+l*.29,y+b,x+l*.71,y-b,x+l,y+random()*.7);c.stroke();
      }
    });
    const timber=mat(0xffffff,.70,.11,{map:woodTex,bumpMap:woodTex,bumpScale:.010});
    const sillColor=0x87968a,wallColor=0x687f78;
    for(const s of [-1,1]){
      box(s*6.016,.482,.10,.157,.964,spanZ,concrete);
      for(let i=0;i<5;i++){
        const y=.192+i*.158;
        box(s*5.946,y,.10,.093,.150,13.76,timber,i%2?sillColor:0x8b9b8b);
      }
      box(s*5.936,1.007,.10,.213,.108,13.81,timber,wallColor);
      box(s*5.975,.092,.10,.122,.145,13.81,paint,blue);
    }
    box(0,.482,north-.018,12.16,.964,.164,concrete);
    for(let i=0;i<5;i++)box(0,.192+i*.158,north+.058,12.05,.150,.092,timber,i%2?sillColor:0x8b9b8b);
    box(0,1.006,north+.053,12.14,.108,.202,timber,wallColor);
    // The southern elevation is sectioned down to its kick board in the central chase-camera area.
    box(0,.182,south+.012,12.11,.364,.153,rock);
    box(0,.352,south-.014,12.07,.069,.134,timber,wallColor);
    for(const s of [-1,1]){
      box(s*4.72,.648,south+.036,2.59,.588,.102,timber,sillColor);
      box(s*4.72,.964,south+.026,2.65,.062,.143,timber,wallColor);
    }
    for(const x of [-6.03,-3.12,-.06,3.02,6.03]){
      box(x,-2.56,north+.14,.237,4.39,.262,rock);
      box(x,-.67,north+.14,.464,.241,.477,rock);
      box(x,-2.25,south-.15,.252,4.12,.269,rock);
    }
    const rz=[-6.78,-4.48,-2.18,.12,2.42,4.72,6.98],rx=[-6.04,-4.02,-2.01,0,2.01,4.02,6.04];
    const topY=x=>4.13+1.13*(1-Math.abs(x)/6.04);
    const northZ=y=>north-.065-.063*(y-1.02),sideX=(s,y)=>s*(6.045+.071*(y-1.02));
    for(const x of rx){
      const h=topY(x),pz=northZ(h);
      beam([x,1.01,northZ(1.01)],[x,h,pz],.068,.108,paint,blue);
      beam([x+.034,1.04,northZ(1.01)+.043],[x+.034,h-.04,pz+.043],.021,.028,steel,zinc);
      box(x,1.103,north+.014,.128,.163,.145,steel,iron);
      for(const y of [1.45,2.52,3.37])rivet(x,y,northZ(y)+.068,.016,'z',bronze);
    }
    for(const s of [-1,1])for(const z of rz){
      const x=sideX(s,4.13);
      beam([sideX(s,1.01),1.01,z],[x,4.13,z],.109,.083,paint,blue);
      box(s*5.963,.533,z,.128,1.06,.098,timber,wallColor);
      box(s*5.969,1.11,z,.158,.165,.144,paint,iron);
      for(const y of [1.57,2.64,3.65])rivet(sideX(s,y)-s*.062,y,z,.016,'x',bronze);
    }
    // Actual outward-leaning glazing. Its lightly crazed, salt-clouded edges and rain have transparent centres.
    const rainTex=texture(512,512,(c,w,h)=>{
      c.fillStyle='rgba(145,178,183,.23)';c.fillRect(0,0,w,h);
      const fog=c.createLinearGradient(0,0,0,h);fog.addColorStop(0,'rgba(212,229,218,.25)');fog.addColorStop(.20,'rgba(171,198,192,.04)');fog.addColorStop(.71,'rgba(167,195,187,.02)');fog.addColorStop(1,'rgba(183,200,175,.27)');c.fillStyle=fog;c.fillRect(0,0,w,h);
      for(let i=0;i<1300;i++){
        const x=random()*w,y=random()*h,r=.45+Math.pow(random(),2)*2.72,l=random();
        c.save();c.translate(x,y);c.scale(1,1.15+l*.51);
        c.fillStyle='rgba(76,115,119,'+(.07+.12*l)+')';c.beginPath();c.arc(0,0,r,0,TAU);c.fill();
        c.lineWidth=.52+.34*l;c.strokeStyle='rgba(232,243,229,'+(.13+.43*l)+')';c.beginPath();c.arc(0,0,r,0.07,2.68);c.stroke();
        if(l>.92){c.strokeStyle='rgba(191,215,208,.22)';c.lineWidth=.4+r*.21;c.beginPath();c.moveTo(.1,0);c.bezierCurveTo(.5,random()*7,.9,11+r*2,1.43,15+random()*20);c.stroke();}
        c.restore();
      }
      for(let i=0;i<1800;i++){const x=random()*w,y=random()*h,edge=Math.min(x,y,w-x,h-y);
        if(edge>32)continue;c.fillStyle='rgba(196,194,152,.26)';c.fillRect(x,y,random()*2.2+.35,random()*1.4+.35);}
    });
    const glass=keep(new T.MeshPhysicalMaterial({color:0xbaccce,map:rainTex,roughness:.185,metalness:.10,clearcoat:1,clearcoatRoughness:.14,transparent:true,opacity:.74,depthWrite:false,side:T.DoubleSide}));
    const panels={p:[],uv:[],i:[]};
    function pane(a,b,c,d,flip){
      const j=panels.p.length/3;panels.p.push(...a,...b,...c,...d);panels.uv.push(...(flip?[1,0,0,0,0,1,1,1]:[0,0,1,0,1,1,0,1]));
      panels.i.push(j,j+1,j+2,j,j+2,j+3);
    }
    for(let j=0;j<rx.length-1;j++){
      const a=rx[j],b=rx[j+1],y0=1.056,y1=2.681;
      pane([a,y0,northZ(y0)],[b,y0,northZ(y0)],[b,y1,northZ(y1)],[a,y1,northZ(y1)],j%2);
      pane([a,y1,northZ(y1)],[b,y1,northZ(y1)],[b,topY(b),northZ(topY(b))],[a,topY(a),northZ(topY(a))],j%2);
      beam([a,topY(a),northZ(topY(a))],[b,topY(b),northZ(topY(b))],.135,.148,paint,blue);
      beam([a,topY(a)-.112,northZ(topY(a))+.03],[b,topY(b)-.112,northZ(topY(b))+.03],.040,.047,steel,zinc);
    }
    for(const y of [1.072,2.681,3.72])box(0,y,northZ(y),12.12,.060,.093,paint,blue);
    for(const s of [-1,1])for(let j=0;j<rz.length-1;j++){
      const a=rz[j],b=rz[j+1],y0=1.058,y1=2.70,hi=4.14;
      pane([sideX(s,y0),y0,a],[sideX(s,y0),y0,b],[sideX(s,y1),y1,b],[sideX(s,y1),y1,a],j%2);
      pane([sideX(s,y1),y1,a],[sideX(s,y1),y1,b],[sideX(s,hi),hi,b],[sideX(s,hi),hi,a],j%2);
    }
    for(const s of [-1,1])for(const y of [1.073,2.70,4.13])box(sideX(s,y),y,.10,.096,y>4?.146:.058,13.83,paint,blue);
    // A clear central opening in the opaque section preserves the south chase shot.
    // Glazed transoms, outboard mullions and timber backings still anchor the south end visually.
    for(const x of [-6.02,-3.40,3.40,6.02]){
      box(x,2.54,south+.055,.062,3.09,.079,paint,blue);
      box(x,1.066,south+.052,.098,.107,.116,steel,iron);
    }
    for(const [a,b] of [[-6.0,-3.40],[-3.40,0],[0,3.40],[3.40,6.0]]){
      const low=Math.abs(a+b)>6?.997:.392;
      pane([b,low,south+.088],[a,low,south+.088],[a,topY(a),south+.088],[b,topY(b),south+.088],a<0);
      beam([a,topY(a),south+.058],[b,topY(b),south+.058],.076,.092,paint,blue);
    }
    box(0,3.71,south+.062,12.07,.042,.056,paint,iron);
    const glassG=indexed(panels.p,null,panels.i);glassG.setAttribute('uv',new T.Float32BufferAttribute(panels.uv,2));const glazing=mesh(glassG,glass);glazing.castShadow=false;
    // Riveted roof frames span only overhead, with a glazed strip at the seaward eaves.
    const gusset=new T.Shape();gusset.moveTo(-.5,-.17);gusset.lineTo(.5,-.17);gusset.lineTo(.5,.03);gusset.lineTo(.045,.32);gusset.lineTo(-.5,.04);gusset.closePath();
    for(const x of [-.24,.04,.26]){const hole=new T.Path();hole.absarc(x,-.040,.06,0,TAU,true);gusset.holes.push(hole);}
    const splice=geo('punched roof splice',()=>new T.ExtrudeGeometry(gusset,{depth:.039,bevelEnabled:false}));
    const roofArt={p:[],uv:[],i:[]};
    function skyglass(a,b,c,d){const n=roofArt.p.length/3;roofArt.p.push(...a,...b,...c,...d);roofArt.uv.push(0,0,1,0,1,1,0,1);roofArt.i.push(n,n+1,n+2,n,n+2,n+3);}
    for(const z of [-6.85,-2.29,2.37,6.99]){
      for(const s of [-1,1]){
        beam([s*6.25,4.14,z],[0,5.27,z],.093,.109,paint,iron);
        beam([s*6.25,4.055,z],[0,5.18,z],.042,.045,steel,zinc);
        beam([s*5.99,3.64,z],[s*5.42,4.27,z],.060,.067,paint,iron);
        beam([s*4.16,4.13,z],[s*3.11,4.70,z],.035,.048,steel,grey);
        part(splice,steel,grey,[s*5.71,4.12,z-.032],[.72,.70,1],null);
        rivet(s*5.69,4.12,z+.012,.018,'z',bronze);
      }
      beam([-6.13,4.06,z],[6.12,4.06,z],.021,.021,steel,grey,true);
      beam([0,4.06,z],[0,5.235,z],.024,.024,paint,iron,true);
      ring(0,4.14,z,.083,.014,steel,bronze,null);
    }
    for(const s of [-1,1]){
      box(s*5.10,4.348,.10,.060,.073,13.91,paint,iron);
      for(let j=0;j<rz.length-1;j++){
        const a=rz[j],b=rz[j+1];
        skyglass([s*6.24,4.14,a],[s*6.24,4.14,b],[s*5.1,4.348,b],[s*5.1,4.348,a]);
        beam([s*6.24,4.14,a],[s*5.1,4.348,a],.080,.064,paint,iron);
      }
    }
    for(let i=0;i<rx.length-1;i++){
      const a=rx[i],b=rx[i+1];
      skyglass([a,topY(a),northZ(topY(a))],[b,topY(b),northZ(topY(b))],[b,topY(b)+.07,-5.95],[a,topY(a)+.07,-5.95]);
      beam([a,topY(a),northZ(topY(a))],[a,topY(a)+.07,-5.95],.04,.05,paint,iron);
    }
    // Complete, transparent storm roof. A clear skylight remains usable by high gameplay cameras.
    const roofRibs=[-5.10,-3.40,-1.70,0,1.70,3.40,5.10],roofRuns=[-5.95,-3.79,-1.63,.53,2.69,4.85,6.99];
    const roofY=x=>5.27-Math.abs(x)*.181;
    for(let j=0;j<roofRibs.length-1;j++)for(let k=0;k<roofRuns.length-1;k++){
      const a=roofRibs[j],b=roofRibs[j+1],near=roofRuns[k],far=roofRuns[k+1];
      skyglass([a,roofY(a),near],[b,roofY(b),near],[b,roofY(b),far],[a,roofY(a),far]);
    }
    for(const x of roofRibs)box(x,roofY(x),.50,.034,x===0?.078:.047,12.98,paint,iron);
    for(const z of [-3.79,-1.63,.53,2.69,4.85,6.99])for(const s of [-1,1])
      beam([s*5.10,roofY(5.10),z],[0,roofY(0),z],.033,.040,paint,iron);
    const roofG=indexed(roofArt.p,null,roofArt.i);roofG.setAttribute('uv',new T.Float32BufferAttribute(roofArt.uv,2));mesh(roofG,glass).castShadow=false;
    // A fastened exterior storm door occupies just the eastern end of the southern cutaway.
    const dx=4.95,dz=7.020;
    box(dx,1.03,dz+.053,1.26,2.06,.083,paint,blue);
    box(dx,.632,dz-.008,1.10,1.13,.052,timber,0x829183);
    for(let j=0;j<7;j++)box(dx-.472+j*.158,.65,dz-.043,.009,1.081,.012,timber,0x646f5e);
    box(dx,1.579,dz-.009,1.02,.635,.057,paint,char);
    const doorGlass=mat(0xb2c4b8,.25,.19,{map:rainTex,emissive:0x77979b,emissiveIntensity:.17,transparent:true,opacity:.69});
    box(dx,1.579,dz-.047,.94,.568,.014,doorGlass,0xffffff);
    for(const sx of [-1,1])box(dx+sx*.631,1.082,dz-.021,.083,2.14,.132,timber,wallColor);
    for(const yy of [1.192,1.925,2.113])box(dx,yy,dz-.032,1.27,.087,.145,timber,wallColor);
    box(dx,1.553,dz-.069,.035,.592,.050,steel,grey);
    box(dx,.913,dz-.079,1.32,.116,.076,timber,0x80705a,[0,0,.08]);
    for(const sx of [-1,1])box(dx+sx*.57,.915+sx*.047,dz-.13,.105,.188,.050,steel,iron);
    // Wall-mounted specimen drawer, well behind the transport aisle and separate from the mobile apparatus.
    const boxX=-4.58,boxY=.948,boxZ=6.79;
    box(boxX,boxY,boxZ,1.62,.88,.25,timber,0x807561);
    box(boxX,boxY+.47,boxZ,1.72,.075,.30,timber,0x92836a);
    for(let row=0;row<3;row++)for(let col=0;col<4;col++){
      const x=boxX-.582+col*.387,y=boxY-.266+row*.267;
      box(x,y,boxZ-.142,.367,.244,.071,timber,col%3?0x9c8e73:0x98866f);
      box(x,y+.044,boxZ-.186,.150,.068,.017,steel,bronze);
      box(x,y+.045,boxZ-.199,.126,.046,.006,soft,0xc6b89b);
      beam([x-.054,y-.063,boxZ-.215],[x+.054,y-.063,boxZ-.215],.012,.012,steel,warm,true);
    }
    // Small conservation office plate and the real archived cabinet's suspended C-3 locator.
    function plaque(title,small,w,h,paper='#415a56',ink='#e0d5ae'){
      return tile(w,h,(c,w,h)=>{
        c.fillStyle=paper;c.fillRect(0,0,w,h);c.strokeStyle=ink;c.lineWidth=2;c.strokeRect(6,6,w-12,h-12);
        c.fillStyle=ink;c.textAlign='center';c.textBaseline='middle';c.font='bold '+Math.floor(h*.43)+'px "Songti SC","Microsoft YaHei",serif';c.fillText(title,w*.50,h*.39,w-32);
        c.font='bold '+Math.max(9,Math.round(h*.14))+'px monospace';c.fillText(small,w*.50,h*.765,w-31);wear(c,w,h,.011);
      });
    }
    const roomName=plaque('北岬海图修复室','北岬港务段    /    CHART CONSERVATION',555,123);
    box(-3.69,3.94,northZ(3.94)+.078,1.99,.441,.065,paint,blue);
    stamp(roomName,-3.69,3.94,northZ(3.94)+.117,1.94,.395);
    for(const x of [-4.58,-2.80])for(const y of [3.79,4.09])rivet(x,y,northZ(3.94)+.130,.017,'z',bronze);
    const archiveID=plaque('丙三　图柜','C—3  /  原图寄存',326,99,'#c1b58d','#45574e');
    box(0,2.98,south-.044,1.02,.302,.058,paint,iron);
    stamp(archiveID,0,2.98,south-.083,.97,.265,0,Math.PI);
    for(const x of [-.37,.37])beam([x,3.13,south-.04],[x,4.07,south-.04],.012,.012,steel,iron,true);
    const close=plaque('风暴期间封闭','外 廊 门    /    STORM SHUTTER',247,76,'#bcac87','#46564a');
    stamp(close,dx,.713,dz-.077,.48,.145,0,Math.PI);
    const drawers=plaque('样本纸','纤维 · 布衬',160,71,'#c9bea0','#5e6652');
    stamp(drawers,boxX,boxY+.448,boxZ-.166,.45,.115,0,Math.PI);
    // Painted restoration rules and salt trapped at the very foot of the room, beneath all working displays.
    const tide=tile(406,111,(c,w,h)=>{
      const yy=x=>27+5*Math.sin(x*.029)+2*Math.sin(x*.151);
      for(let x=0;x<w;x++){const y=yy(x)+random()*2,g=c.createLinearGradient(0,y-2,0,y+64);
        g.addColorStop(0,'rgba(220,218,183,0)');g.addColorStop(.08,'rgba(217,215,175,'+(.18+.33*random())+')');g.addColorStop(.23,'rgba(120,140,104,.16)');g.addColorStop(1,'rgba(51,74,53,0)');c.fillStyle=g;c.fillRect(x,y-2,1,68);}
    });
    stamp(tide,0,.214,north+.112,11.88,.322);
    stamp(tide,-5.897,.212,-3.12,6.46,.31,0,Math.PI/2);
    stamp(tide,5.897,.212,3.24,6.46,.31,0,-Math.PI/2);
    const dg=indexed(decals.p,decals.n,decals.i);dg.setAttribute('uv',new T.Float32BufferAttribute(decals.uv,2));mesh(dg,decalMat).castShadow=false;
    // Sideward daylight through paired mullions leaves a soft rectangular pool at the edge of the room.
    const sunMap=texture(320,512,(c,w,h)=>{
      const im=c.createImageData(w,h);
      for(let y=0;y<h;y++)for(let x=0;x<w;x++){
        const u=(x+.5)/w,vv=(y+.5)/h,edgeX=Math.min(u,1-u),edgeY=Math.min(vv,1-vv);
        const env=Math.max(0,Math.min(1,edgeX/(.035+.07*vv),edgeY/.12))*(.85-.45*vv);
        const rib=(.22+.78*Math.min(1,Math.abs(u-.49)*33))*(.30+.70*Math.min(1,Math.abs(vv-.42)*24));
        const i=(y*w+x)*4;im.data[i]=174;im.data[i+1]=207;im.data[i+2]=211;im.data[i+3]=Math.round(137*env*rib*(.86+.14*random()));
      }c.putImageData(im,0,0);
    });
    const cast=keep(new T.MeshBasicMaterial({map:sunMap,color:0xb4c5bf,transparent:true,opacity:.39,depthWrite:false,blending:T.AdditiveBlending,polygonOffset:true,polygonOffsetFactor:-2}));
    for(const z of [-5.11,-2.78,-.48,1.82,4.12])part(plane,cast,0xffffff,[-4.25,.007,z],[1.88,3.48,1],[-Math.PI/2,0,Math.PI*.42]);
    for(const x of [-3.88,-1.76,.43,2.53])part(plane,cast,0xffffff,[x,.008,-5.13],[1.76,2.82,1],[-Math.PI/2,0,-.12]);
    // Volumetric-looking shafts use a softly tapered sheet only in the high window corners.
    const veilMap=texture(144,240,(c,w,h)=>{
      const im=c.createImageData(w,h);
      for(let y=0;y<h;y++)for(let x=0;x<w;x++){const u=(x+.5)/w,vv=(y+.5)/h,wgt=Math.pow(Math.max(0,Math.sin(u*Math.PI)),1.92)*Math.pow(Math.max(0,Math.sin(vv*Math.PI)),.94)*(1-.51*vv),i=(y*w+x)*4;im.data[i]=154;im.data[i+1]=195;im.data[i+2]=203;im.data[i+3]=Math.round(69*wgt*(.87+.08*Math.sin(23*u)+.05*Math.sin(41*u+3*vv)));}c.putImageData(im,0,0);
    });
    const veil=keep(new T.MeshBasicMaterial({map:veilMap,color:0xbfd9d8,transparent:true,opacity:.42,depthWrite:false,side:T.DoubleSide,blending:T.AdditiveBlending}));
    for(const [x,y,z,angle] of [[-5.44,2.24,-4.09,-.44],[-5.29,2.06,.58,-.49],[-3.28,2.77,-6.15,-.41]]){
      part(plane,veil,0xffffff,[x,y,z],[.95,3.46,1],[0,.65,angle]);
    }
    const wet=keep(new T.MeshPhysicalMaterial({color:0x59736d,metalness:.27,roughness:.128,clearcoat:.98,clearcoatRoughness:.11,transparent:true,opacity:.30,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2}));
    const wp=[],wi=[];
    function pool(x,z,rx,rz){
      const start=wp.length/3,ph=random()*TAU;wp.push(x,.003,z);
      for(let j=0;j<=48;j++){const a=j*TAU/48,r=.80+.128*Math.sin(3*a+ph)+.067*Math.sin(8*a-ph)+.032*Math.cos(13*a);wp.push(x+rx*r*Math.cos(a),.003,z+rz*r*Math.sin(a));if(j<48)wi.push(start,start+j+2,start+j+1);}
    }
    for(const p of [[-5.08,-4.35,.54,1.12],[-4.99,-1.35,.48,1.15],[-4.01,4.28,.99,.42],[-.83,-5.99,1.25,.29],[4.13,-5.07,.56,.76],[4.98,2.62,.52,1.03],[1.63,2.38,.60,.31]])pool(...p);
    mesh(indexed(wp,null,wi),wet).castShadow=false;
    // A shaded service lamp and its small storage rail are confined to the eastern bay, beyond the displays.
    const lx=5.66,ly=2.63,lz=3.50;
    beam([5.99,ly+.26,lz],[lx,ly+.26,lz],.029,.029,steel,bronze,true);
    cylinder(lx,ly+.144,lz,.054,.216,paint,blue);
    const enamel=mat(0xced0bb,.31,.32,{side:T.DoubleSide});
    part(geo('shade',()=>new T.ConeGeometry(.216,.18,28,1,true)),enamel,0xffffff,[lx,ly+.055,lz],[1,1,1],null);
    const warmBulb=mat(0xf0cf98,.28,.11,{emissive:0xffb764,emissiveIntensity:2.85});
    part(ball,warmBulb,0xffffff,[lx,ly-.055,lz],[.068,.103,.068],null);
    for(const sz of [-1,1])beam([lx-.042,ly+.02,lz+sz*.089],[lx-.042,ly-.144,lz+sz*.057],.008,.008,steel,grey,true);
    ring(lx,ly-.14,lz,.060,.009,steel,grey,[Math.PI/2,0,0]);
    const glowMap=texture(128,128,(c,w,h)=>{
      const r=w/2,g=c.createRadialGradient(r,r,0,r,r,r);g.addColorStop(0,'rgba(255,233,174,1)');g.addColorStop(.11,'rgba(254,193,104,.76)');g.addColorStop(.38,'rgba(228,139,68,.25)');g.addColorStop(.76,'rgba(219,121,56,.053)');g.addColorStop(1,'rgba(206,105,48,0)');c.fillStyle=g;c.fillRect(0,0,w,h);
    });
    const halo=keep(new T.MeshBasicMaterial({map:glowMap,transparent:true,opacity:.51,depthWrite:false,blending:T.AdditiveBlending}));
    part(plane,halo,0xffffff,[lx-.08,ly-.048,lz],[.69,.69,1],[0,-Math.PI/2,0]);
    const workLight=keep(new T.PointLight(0xffc279,15.4,6.7,2));workLight.position.set(lx-.15,ly-.132,lz);root.add(workLight);
    box(5.839,.91,3.47,.135,.035,1.66,timber,0x87795e);
    for(const z of [2.84,3.15,3.77,4.10]){
      beam([5.90,.86,z],[5.79,.75,z],.009,.009,steel,bronze,true);
      ring(5.799,.76,z,.036,.009,steel,bronze,[0,Math.PI/2,0]);
    }
    // A few moving runoff beads cross otherwise clear glass; simulation is confined to the panes themselves.
    const dropletMat=keep(new T.LineBasicMaterial({color:0xd2e4dc,transparent:true,opacity:.52,depthWrite:false}));
    const droplets=[],dripP=new Float32Array(68*6);
    for(let i=0;i<68;i++)droplets.push({axis:i%3===0?1:0,x:-5.91+random()*11.82,z:-6.65+random()*13.5,f:random(),v:.16+random()*.37,len:.032+random()*.098});
    const dripGeo=keep(new T.BufferGeometry()),dripAttr=new T.BufferAttribute(dripP,3);dripAttr.setUsage(T.DynamicDrawUsage);dripGeo.setAttribute('position',dripAttr);
    const drops=new T.LineSegments(dripGeo,dropletMat);drops.frustumCulled=false;root.add(drops);
    for(const b of batches.values()){
      const o=keep(new T.InstancedMesh(b.g,b.m,b.x.length));
      for(let i=0;i<b.x.length;i++){o.setMatrixAt(i,b.x[i]);o.setColorAt(i,new T.Color(b.t[i]));}
      o.castShadow=b.m!==veil&&b.m!==halo&&b.m!==cast&&b.m!==warmBulb&&b.m!==doorGlass;o.receiveShadow=true;o.computeBoundingSphere();root.add(o);
    }
    const wp0=new T.Vector3();
    function update(t=0){
      if(disposed)return;const sec=Number.isFinite(t)?t:0;
      root.getWorldPosition(wp0);for(const [u,line] of waterlines)u.value=wp0.y+line;
      for(let i=0;i<droplets.length;i++){
        const d=droplets[i],u=(d.f+sec*d.v*.125)%1,hi=d.axis?4.03:topY(d.x)-.083;
        const y=hi-(hi-1.08)*u,y2=Math.max(1.08,y-d.len);
        if(d.axis){const x0=sideX(-1,y)+.014,x1=sideX(-1,y2)+.014;dripAttr.setXYZ(i*2,x0,y,d.z);dripAttr.setXYZ(i*2+1,x1,y2,d.z+.0038);}
        else{dripAttr.setXYZ(i*2,d.x,y,northZ(y)+.014);dripAttr.setXYZ(i*2+1,d.x+.0051,y2,northZ(y2)+.014);}
      }
      dripAttr.needsUpdate=true;workLight.intensity=15.11+.31*Math.sin(sec*2.11)+.16*Math.sin(sec*5.32);
    }
    update();
    return {update,dispose(){if(disposed)return;disposed=true;root.removeFromParent();for(const r of owned)r.dispose();root.clear();owned.clear();}};
  }
  return {create};
})();
