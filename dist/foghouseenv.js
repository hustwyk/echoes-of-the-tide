// Original stationary fog signal terrace. Shared concrete scans are supplied by TideConcrete.
const TideFoghouseEnv=(()=>{
  'use strict';
  function create(parent){
    const T=THREE,root=new T.Group();root.name='北岬 · 东堤雾号所';parent.add(root);
    const owned=new Set(),keep=v=>(owned.add(v),v),geometries=new Map(),batches=new Map(),waterlines=[];
    const TAU=2*Math.PI,v=(x,y,z)=>new T.Vector3(x,y,z),q=new T.Quaternion(),e=new T.Euler(),yAxis=v(0,1,0);
    let seed=118038,disposed=false;
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
    const concrete=slab(0xb3b9ae,-.58),rock=slab(0x84968e,-.85),nose=slab(0xc6c4ad,-.25);
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
      if(ax+w+4>2048){ax=4;ay+=th+6;th=0;}if(ay+h+3>1024)throw Error('Fog signal atlas capacity exceeded');
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
    const blue=0x617a80,deep=0x435d64,copper=0x829889,verdigris=0x698a7d,bronze=0x9e8a66;
    function deck(x,y,z,w,d){
      box(x,y-.275,z,w,.55,d,concrete);
      box(x,y-.65,z,w-.11,.20,d-.09,rock);
      const n=Math.max(1,Math.ceil(w/3.25)),m=Math.max(1,Math.ceil(d/3.25));
      for(let i=1;i<n;i++)box(x-w*.5+i*w/n,y+.0006,z,.012,.0011,d-.03,rubber,0x63766a);
      for(let j=1;j<m;j++)box(x,y+.0006,z-d*.5+j*d/m,w-.03,.0011,.011,rubber,0x63766a);
    }
    deck(0,0,4.80,13.60,4.40);deck(3.70,0,-2.15,6.20,9.50);deck(-3.40,0,-6.63,2.85,1.70);
    for(const [x,z,w,d] of [[-6.716,4.80,.166,4.37],[6.716,.06,.166,13.87],[-3.125,2.681,7.36,.16],[3.81,-6.818,6.0,.16],[-3.4,-7.423,2.78,.118]]){
      box(x,-.079,z,w,.155,d,nose);
    }
    // The entire swept volume between the apron, the two transfer rotors and the remote landing stays open.
    // All cross-bay steel, uppermost flange included, stays below -2.16 m.
    for(const z of [.75,-3.32]){
      for(const x of [-5.75,-.49]){
        box(x,-7.98,z,.67,10.96,.79,rock);box(x,-2.49,z,.88,.47,.92,concrete);
        box(x,-2.24,z,.78,.083,.87,steel,deep);
        for(const dx of [-.26,.26])for(const dz of [-.31,.31])rivet(x+dx,-2.190,z+dz,.036,'y',bronze);
      }
      box(-3.04,-2.49,z,6.53,.40,.19,paint,blue);
      for(const y of [-2.694,-2.279])box(-3.04,y,z,6.54,.055,.39,steel,grey);
      for(let i=0;i<9;i++){const x=-6.0+i*.749;box(x,-2.49,z,.053,.38,.24,steel,blue);rivet(x,-2.48,z+.146,.027,'z',bronze);}
    }
    for(const x of [-5.73,-.48])beam([x,-2.73,.65],[x,-4.49,-3.22],.12,.13,paint,blue);
    for(const [x,z] of [[-6.38,3.08],[-6.38,6.62],[-2.70,6.62],[.95,6.62],[4.51,6.62],[6.29,3.07],[.97,1.98],[.97,-2.03],[.97,-6.39],[6.27,-6.39],[6.27,-2.03],[-4.45,-6.57],[-2.33,-6.57]]){
      box(x,-6.26,z,.296,11.56,.334,rock);
      box(x,-.64,z,.586,.28,.61,nose);box(x,-1.24,z,.326,.142,.365,steel,grey);
    }
    // Historic edging and guarded downpipes hug fixed edges, leaving the working stations unobstructed.
    function drain(x,z,w,d){
      box(x,.001,z,w,.002,d,rubber,0x43534e);
      const alongZ=d>w,len=alongZ?d:w,count=Math.max(1,Math.ceil(len/.117));
      for(let i=0;i<count;i++){
        const u=(i+.5)*len/count-len/2;
        box(x+(alongZ?0:u),.003,z+(alongZ?u:0),alongZ?w:.027,.005,alongZ?.027:d,steel,i%9?0x78867b:0x8f907a);
      }
    }
    drain(6.34,.02,.166,13.54);drain(-2.48,6.66,7.87,.147);
    for(const z of [-6.24,-3.04,.26,4.05,6.60]){
      box(6.805,-.34,z,.086,.53,.268,paint,blue);
      for(const y of [-.16,-.51])rivet(6.858,y,z,.026,'x',bronze);
    }
    function fence(a,b,h){
      const p=v(...a),r=v(...b),n=Math.max(1,Math.ceil(p.distanceTo(r)/1.74));
      for(let i=0;i<=n;i++){const pos=p.clone().lerp(r,i/n);
        box(pos.x,pos.y+.018,pos.z,.155,.035,.15,steel,blue);
        beam(pos.toArray(),[pos.x,pos.y+h,pos.z],.027,.027,paint,blue,true);
      }
      for(const frac of [.49,1])beam([a[0],a[1]+h*frac,a[2]],[b[0],b[1]+h*frac,b[2]],frac===1?.029:.015,frac===1?.029:.015,steel,grey,true);
    }
    fence([-6.68,0,5.23],[-6.68,0,6.81],.68);
    fence([-1.89,0,6.86],[.04,0,6.86],.64);
    fence([6.67,0,3.34],[6.67,0,5.42],.72);
    // The brick compressor shed has two arched, genuinely open compressor bays toward the deck.
    const bx=8.64,bz=-1.47,face=6.985,far=10.30,z0=-4.47,z1=1.53;
    box(bx,-.32,bz,3.75,.62,6.32,concrete);box(bx,.064,bz,3.59,.125,6.09,nose);
    for(const z of [-4.28,-1.44,1.32]){
      box(9.84,-6.30,z,.55,11.93,.59,rock);box(9.84,-.64,z,.83,.34,.82,nose);
    }
    const brickTex=texture(512,256,(c,w,h)=>{
      c.fillStyle='#817d6d';c.fillRect(0,0,w,h);
      for(let row=0;row<12;row++){
        const dh=h/12;for(let col=-1;col<7;col++){
          const dw=w/6,xx=(col+(row%2)*.5)*dw,yy=row*dh+1,shade=Math.floor(112+random()*27);
          c.fillStyle='rgb('+Math.round(shade*1.18)+','+Math.round(shade*.99)+','+Math.round(shade*.83)+')';c.fillRect(xx+1,yy,dw-2,dh-2);
          c.strokeStyle='rgba(203,184,151,.45)';c.lineWidth=1;c.strokeRect(xx+1.3,yy+1,dw-3,dh-3);
        }
      }
      for(let i=0;i<3700;i++){c.fillStyle=i%3?'rgba(61,66,57,.18)':'rgba(215,204,168,.27)';c.fillRect(w*random(),h*random(),.3+random()*2.4,.3+random()*1.5);}
    });
    const brick=mat(0xffffff,.87,.035,{map:brickTex,bumpMap:brickTex,bumpScale:.025});
    box(far,1.68,bz,.24,3.24,5.99,brick,0xb4aca0);
    for(const z of [z0,z1])box(bx,1.61,z,3.40,3.08,.21,brick,0xc4bbae);
    for(const z of [z0,bz,z1]){
      box(face,.18,z,.353,.35,.42,nose);
      box(face,1.41,z,.238,2.35,.271,paint,blue);
      for(const sz of [-1,1])box(face-.033,1.43,z+sz*.12,.187,2.31,.039,steel,grey);
      box(face,2.60,z,.36,.26,.403,paint,blue);
      for(const y of [.40,.98,1.56,2.21,2.59])rivet(face-.151,y,z,.024,'x',bronze);
    }
    // Segmented rubble arch profiles in the Y/Z façade, with flared keystones.
    for(const z of [bz-1.50,bz+1.50]){
      for(let i=0;i<19;i++){
        const a=(i+.5)*Math.PI/19,zz=z+1.50*Math.cos(a),yy=2.50+.76*Math.sin(a);
        const dx=-1.50*Math.sin(a),dy=.76*Math.cos(a),tilt=-Math.atan2(dy,dx);
        const extent=Math.hypot(dx,dy)*Math.PI/19+.015;
        box(face,yy,zz,i===9?.343:.274,i===9?.260:.166,extent, i===9?nose:brick, i===9?0xffffff:0xc2b7a3,[tilt,0,0]);
      }
      for(const sz of [-1,1]){
        beam([face-.025,2.41,z+sz*1.37],[face-.025,2.97,z+sz*.87],.059,.066,paint,blue);
        beam([face-.033,2.74,z+sz*1.17],[face-.033,2.93,z+sz*1.27],.042,.050,steel,grey);
      }
    }
    // Clerestory and smoke vent above a weathered standing-seam copper roof.
    box(bx,3.305,bz,3.57,.225,6.24,paint,blue);
    const run=1.91,rise=.75,len=Math.hypot(run,rise),ang=Math.atan2(rise,run),peak=4.23;
    for(const s of [-1,1]){
      box(bx+s*run*.5,peak-rise*.5,bz,len,.109,6.46,paint,verdigris,[0,0,-s*ang]);
      for(let j=0;j<17;j++){const z=bz-3.15+j*.393;beam([bx,peak+.055,z],[bx+s*run,peak-rise+.055,z],.027,.030,steel,copper);}
      box(bx+s*run,peak-rise-.012,bz,.096,.14,6.48,paint,blue);
      cylinder(bx+s*run,peak-rise-.099,bz,.071,6.48,steel,copper,[Math.PI/2,0,0]);
    }
    cylinder(bx,peak+.058,bz,.077,6.51,steel,copper,[Math.PI/2,0,0]);
    const ridge=new T.Shape();ridge.moveTo(-1.82,0);ridge.lineTo(1.82,0);ridge.lineTo(0,.70);ridge.closePath();
    const gable=geo('plastered gable',()=>new T.ExtrudeGeometry(ridge,{depth:.12,bevelEnabled:false}));
    for(const z of [z0-.04,z1-.04])part(gable,nose,0xbcbdae,[bx,3.45,z],[1,1,1],null);
    const stackX=9.54,stackZ=-3.42;
    box(stackX,4.38,stackZ,.67,2.65,.70,brick,0xb3a490);
    for(const y of [4.15,4.73,5.26])box(stackX,y,stackZ,.696,.073,.723,steel,0x707b69);
    box(stackX,5.78,stackZ,.80,.19,.82,brick,0xac9c83);box(stackX,5.889,stackZ,.72,.032,.74,soft,0x485249);
    for(const z of [-3.10,-.04]){
      box(far-.146,1.82,z,.093,1.34,1.43,paint,deep);
      for(let j=0;j<11;j++)box(far-.211,1.25+j*.113,z,.056,.039,1.32,steel,grey,[0,0,.23]);
    }
    // High-pressure service main and its flanges. No handles or operating gear here.
    const hp=0x658276,flange=0x72877c;
    function line(a,b,r,c=hp){beam(a,b,r,r,paint,c,true);}
    function collar(a,b,r){beam(a,b,r,r,steel,flange,true);}
    const feedY=.76,feedX=7.58;
    line([feedX,feedY,-3.93],[feedX,feedY,-7.06],.153);
    for(const z of [-4.52,-5.73,-6.78]){collar([feedX,feedY,z-.043],[feedX,feedY,z+.043],.203);for(const s of [-1,1])rivet(feedX+s*.172,feedY,z-.046,.021,'z',bronze);}
    function elbow(center,r,from,to,shape,m,col){
      let prev;for(let j=0;j<=9;j++){const a=from+(to-from)*j/9,p=shape(center,r,a);if(prev)beam(prev,p,m,m,paint,col,true);prev=p;}
    }
    elbow([7.28,feedY,-7.06],.30,0,-Math.PI/2,(p,r,a)=>[p[0]+r*Math.cos(a),p[1],p[2]+r*Math.sin(a)],.152,hp);
    line([7.28,feedY,-7.36],[4.99,feedY,-7.36],.153);
    for(const x of [6.84,6.11,5.39])collar([x-.041,feedY,-7.36],[x+.041,feedY,-7.36],.20);
    // Twin first-order fog trumpets. Each bell is double-walled all the way to the throat,
    // curves upwards on its own axis and uses rolled seams, a return lip and radial rivet rows.
    const shells=mat(0xffffff,.43,.54,{vertexColors:true}),backs=mat(0xffffff,.65,.33,{vertexColors:true});
    const sPos=[],sNorm=[],sCol=[],sIndices=[],iPos=[],iNorm=[],iCol=[],iIndices=[];
    const zAxis=v(0,0,1),inDark=new T.Color(0x263b3d),inLip=new T.Color(0x718b83);
    for(let side=0;side<2;side++){
      const sign=side?1:-1,x0=side?5.72:5.00,z0=-7.15+(side?-.12:0),h0=side?1.59:1.39,L=side?2.29:1.98,R=side?.548:.465;
      line([x0,feedY,-7.36],[x0,h0-.05,-7.36],.108);
      line([x0,h0-.04,-7.36],[x0,h0,z0+.09],.108);
      collar([x0,1.005,-7.36],[x0,1.065,-7.36],.153);
      cylinder(x0,h0,z0+.103,.157,.174,steel,bronze,[Math.PI/2,0,0]);
      cylinder(x0,h0,z0+.014,.135,.027,paint,0x3c5558,[Math.PI/2,0,0]);
      // Neck, body and hand-riveted flared skirt. The front ring stays genuinely open.
      const radius=t=>.106+R*(.12*t+.88*Math.pow(t,2.9));
      const center=t=>v(x0+sign*.232*Math.pow(t,1.31),h0+.140*t+.545*t*t,z0-L*t);
      function frame(t){
        const p=center(t),dir=v(sign*.3039*Math.pow(Math.max(t,.0001),.31),.14+1.09*t,-L).normalize(),right=dir.clone().cross(yAxis).normalize(),rise=right.clone().cross(dir).normalize();
        return {p,dir,right,rise};
      }
      function surface(t,a){
        const f=frame(t),rr=radius(t),radial=f.right.clone().multiplyScalar(Math.cos(a)).addScaledVector(f.rise,Math.sin(a));
        return {p:f.p.clone().addScaledVector(radial,rr),f,radial};
      }
      const skin=new T.Color(side?0x83998a:0x718c7f),rustTone=new T.Color(0x9b7858),patina=new T.Color(0x517368);
      const nt=32,na=60;
      for(const inner of [false,true]){
        const P=inner?iPos:sPos,N=inner?iNorm:sNorm,C=inner?iCol:sCol,I=inner?iIndices:sIndices,base=P.length/3;
        for(let it=0;it<=nt;it++){
          const t=it/nt,rr=radius(t),f=frame(t),slope=R*(.12+2.552*Math.pow(t,1.9))/Math.sqrt(L*L+(.14+1.09*t)**2);
          for(let j=0;j<=na;j++){
            const a=j*TAU/na,rad=f.right.clone().multiplyScalar(Math.cos(a)).addScaledVector(f.rise,Math.sin(a));
            const pn=f.p.clone().addScaledVector(rad,rr-(inner?.0105:0)),nn=rad.clone().addScaledVector(f.dir,-slope).normalize();if(inner)nn.negate();
            P.push(...pn.toArray());N.push(...nn.toArray());
            const age=.54+.30*Math.sin(a*9+t*4.5)*Math.sin(a*4-t*2.8)+.16*Math.cos(a*17-t*11.1);
            const col=inner?inDark.clone().lerp(inLip,Math.max(0,(t-.45)*1.52)).multiplyScalar(.78+.18*age):skin.clone().lerp(patina,Math.max(0,age-.46)*.71).lerp(rustTone,Math.max(0,.31-age)*1.45).multiplyScalar(.90+.14*Math.cos(a*2+.5)+.045*Math.sin(a*15+t*22));
            C.push(col.r,col.g,col.b);
            if(it<nt&&j<na){const n=base+it*(na+1)+j,m=n+na+1;
              if(inner)I.push(n,n+1,m,n+1,m+1,m);else I.push(n,m,n+1,n+1,m,m+1);
            }
          }
        }
      }
      // Deep rear termination inside the bore stands a full horn length away from the mouth.
      const throat=frame(.008);
      part(geo('bore end',()=>new T.CircleGeometry(1,42)),rubber,0x283737,throat.p.toArray(),[.100,.100,1],new T.Quaternion().setFromUnitVectors(zAxis,throat.dir));
      for(const [t,wire] of [[.04,.014],[.30,.012],[.54,.015],[.73,.016],[.87,.014],[.986,.020],[1,.024]]){
        const f=frame(t),rr=radius(t);ring(...f.p.toArray(),rr,wire,steel,t>.98?0x9b9e85:copper,new T.Quaternion().setFromUnitVectors(zAxis,f.dir));
      }
      for(let j=0;j<10;j++){
        const a=j*TAU/10+.09;
        for(let k=0;k<6;k++){
          const t=.34+k*.102,t2=t+.103,s=surface(t,a),s2=surface(t2,a);
          beam(s.p.toArray(),s2.p.toArray(),.009,.009,steel,0x829286,true);
        }
      }
      for(const t of [.55,.875,.964]){
        const n=t>.9?37:t>.8?31:23;
        for(let j=0;j<n;j++){
          const s=surface(t,(j+(side?.38:0))*TAU/n),rr=t>.80?.014:.012;
          part(nut,steel,j%5?0xa7a389:bronze,s.p.addScaledVector(s.radial,.0060).toArray(),[rr,.013,rr],new T.Quaternion().setFromUnitVectors(yAxis,s.radial));
        }
      }
      // Welded outboard brackets beneath the bell are separate from both walkable slabs and controls.
      for(const t of [.23,.65]){
        const f=frame(t),p=f.p,rr=radius(t);
        for(const s of [-1,1])beam([p.x+s*.18,-.36,-6.66],[p.x+s*.12,p.y-rr-.025,p.z],.072,.084,paint,deep);
        box(p.x,p.y-rr-.060,p.z,.51,.123,.22,steel,drab);
        const arcCenter=f.p,prev={p:null};
        for(let j=0;j<=14;j++){
          const aa=Math.PI+j*Math.PI/14,pt=arcCenter.clone().addScaledVector(f.right,(rr+.014)*Math.cos(aa)).addScaledVector(f.rise,(rr+.014)*Math.sin(aa)).toArray();
          if(prev.p)beam(prev.p,pt,.024,.024,steel,bronze,true);prev.p=pt;
        }
      }
    }
    const gh=indexed(sPos,sNorm,sIndices),gi=indexed(iPos,iNorm,iIndices);
    gh.setAttribute('color',new T.Float32BufferAttribute(sCol,3));gi.setAttribute('color',new T.Float32BufferAttribute(iCol,3));
    mesh(gh,shells);mesh(gi,backs);
    // Art is all part of the environment: marine engineering nameplates, maintenance stencils and salt rings.
    const bayName=tile(650,136,(c,w,h)=>{
      c.fillStyle='#394f55';c.fillRect(0,0,w,h);c.strokeStyle='#c7bd9a';c.lineWidth=3;c.strokeRect(7,7,w-14,h-14);
      c.fillStyle='#e4d9bd';c.font='bold 52px "Songti SC","Microsoft YaHei",serif';c.textAlign='center';c.textBaseline='middle';c.fillText('北岬港　东堤雾号所',w/2,48,w-42);
      c.font='bold 15px monospace';c.fillStyle='#b8c6bc';c.fillText('EAST HEAD  /  FOG SIGNAL STATION',w/2,101);wear(c,w,h);
    });
    box(face-.105,3.126,bz,.078,.382,2.00,paint,deep);stamp(bayName,face-.155,3.126,bz,1.95,.341,0,-Math.PI/2);
    const maker=tile(310,96,(c,w,h)=>{
      c.fillStyle='#ae9970';c.fillRect(0,0,w,h);c.strokeStyle='#596352';c.lineWidth=2;c.strokeRect(5,5,w-10,h-10);
      c.fillStyle='#40574c';c.font='bold 29px serif';c.fillText('双音铁号　东嘴',14,42);c.font='12px monospace';c.fillText('CAST IRON / NORTH CAPE DOCK',16,73);wear(c,w,h);
    });
    box(5.41,-.177,-6.902,1.13,.235,.031,steel,drab);stamp(maker,5.41,-.177,-6.926,1.07,.207,0,Math.PI);
    const caisson=tile(395,76,(c,w,h)=>{
      c.fillStyle='#b9b399';c.font='bold 38px "Songti SC",serif';c.fillText('海 侧　／　转 运 湾',6,43);c.font='12px monospace';c.fillText('WEST TRANSFER BASIN',9,66);wear(c,w,h);
    });
    stamp(caisson,-3.39,-.29,2.597,1.45,.247,0,Math.PI);
    const danger=tile(295,83,(c,w,h)=>{
      c.fillStyle='#bba988';c.font='bold 34px "Songti SC",serif';c.fillText('静 听 区',10,43);c.font='12px monospace';c.fillText('SOUNDING FLOOR　11',11,69);wear(c,w,h);
    });
    stamp(danger,4.76,.002,-4.97,.83,.22,-Math.PI/2);
    const wave=tile(460,128,(c,w,h)=>{
      const tide=x=>45+6*Math.sin(x*.024)+2.7*Math.sin(x*.119);
      for(let x=0;x<w;x++){const y=tide(x)+random()*1.8,g=c.createLinearGradient(0,y-2,0,y+64);
        g.addColorStop(0,'rgba(219,220,183,0)');g.addColorStop(.07,'rgba(221,216,177,'+(.19+random()*.38)+')');g.addColorStop(.27,'rgba(122,142,111,.23)');g.addColorStop(1,'rgba(58,77,60,0)');c.fillStyle=g;c.fillRect(x,y-2,1,70);}
      for(let j=0;j<2600;j++){const x=random()*w;c.fillStyle='rgba(217,207,168,.33)';c.fillRect(x,tide(x)+(random()-.31)*random()*30,.4+random()*2,.4+random()*1.3);}
    });
    stamp(wave,-3.10,-.29,2.594,7.26,.436,0,Math.PI);stamp(wave,.596,-.29,-2.15,9.40,.436,0,-Math.PI/2);
    stamp(wave,-3.40,-.30,-7.483,2.79,.417,0,Math.PI);
    stamp(wave,bx,.43,z1+.107,3.3,.45);stamp(wave,bx,.43,z0-.107,3.3,.45,0,Math.PI);
    const decalGeo=indexed(decals.p,decals.n,decals.i);decalGeo.setAttribute('uv',new T.Float32BufferAttribute(decals.uv,2));mesh(decalGeo,decalMat).castShadow=false;
    // Patches of direct sky occupy small rain pools. Long narrow ones follow the runnels; the rotor bay remains empty.
    const wet=keep(new T.MeshPhysicalMaterial({color:0x526967,roughness:.15,metalness:.36,clearcoat:.97,clearcoatRoughness:.11,transparent:true,opacity:.39,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2}));
    const waterP=[],waterI=[];
    function pool(x,z,rx,rz){
      const start=waterP.length/3,phase=random()*TAU;waterP.push(x,.0021,z);
      for(let j=0;j<=46;j++){const a=j*TAU/46,r=.81+.12*Math.sin(3*a+phase)+.066*Math.sin(8*a-phase)+.026*Math.sin(13*a);waterP.push(x+rx*r*Math.cos(a),.0021,z+rz*r*Math.sin(a));if(j<46)waterI.push(start,start+j+2,start+j+1);}
    }
    for(const a of [[-5.42,3.07,.97,.19],[-2.58,5.67,1.12,.44],[.56,5.59,.67,.38],[1.28,.32,.27,1.12],[5.76,1.53,.46,1.15],[4.78,-2.51,.72,.38],[1.88,-5.45,.40,.89],[-3.48,-6.26,.81,.24]])pool(...a);
    mesh(indexed(waterP,null,waterI),wet).castShadow=false;
    // Cage lantern and two windows of borrowed lamplight in the open-faced shed.
    const lamp=mat(0xf4d2a0,.28,.16,{emissive:0xffaf63,emissiveIntensity:2.43});
    const lampX=7.14,lampY=2.40,lampZ=.60;
    beam([lampX,3.16,lampZ],[lampX,lampY+.19,lampZ],.026,.026,steel,blue,true);
    part(geo('reflector',()=>new T.ConeGeometry(.201,.17,24,1,true)),paint,deep,[lampX,lampY+.109,lampZ],[1,1,1],null);
    part(ball,lamp,0xffffff,[lampX,lampY-.015,lampZ],[.077,.132,.077],null);
    for(const s of [-1,1])beam([lampX-.069,lampY+.06,lampZ+s*.065],[lampX-.054,lampY-.149,lampZ+s*.055],.007,.007,steel,grey,true);
    ring(lampX,lampY-.151,lampZ,.065,.008,steel,grey,[Math.PI/2,0,0]);
    const light=keep(new T.PointLight(0xffbc78,19.2,7.3,2));light.position.set(lampX-.21,lampY-.11,lampZ);root.add(light);
    // The atmospheric haze is local to the outside cliff wall and below the working deck.
    const hazeMap=texture(192,80,(c,w,h)=>{
      const im=c.createImageData(w,h);for(let y=0;y<h;y++)for(let x=0;x<w;x++){
        const u=x/w,v=y/h,i=(y*w+x)*4,env=Math.pow(Math.max(0,Math.sin(u*Math.PI)),1.5)*Math.pow(Math.max(0,Math.sin(v*Math.PI)),1.6);
        const n=.52+.24*Math.sin(u*16+v*5)*Math.cos(4*u-v*3)+.19*Math.cos(u*29+v*9);
        im.data[i]=170;im.data[i+1]=190;im.data[i+2]=188;im.data[i+3]=Math.round(125*env*n);
      }c.putImageData(im,0,0);
    });
    const haze=keep(new T.MeshBasicMaterial({map:hazeMap,transparent:true,opacity:.17,depthWrite:false,side:T.DoubleSide}));
    const sprays=[];
    for(const [x,y,z,w,h,angle] of [[-7.68,-3.72,-1.27,6.1,.65,.42],[-5.68,-4.78,-8.38,6.81,.84,-.25],[8.80,-3.95,-8.85,6.3,.67,.13]]){
      const o=mesh(plane,haze,x,y,z);o.scale.set(w,h,1);o.rotation.y=angle;o.castShadow=false;sprays.push({o,x,y,z});
    }
    for(const b of batches.values()){
      const object=keep(new T.InstancedMesh(b.g,b.m,b.x.length));
      for(let i=0;i<b.x.length;i++){object.setMatrixAt(i,b.x[i]);object.setColorAt(i,new T.Color(b.t[i]));}
      object.castShadow=b.m!==lamp;object.receiveShadow=true;object.computeBoundingSphere();root.add(object);
    }
    const worldPos=v(0,0,0);
    function update(time=0,storm01=0){
      if(disposed)return;
      const t=Number.isFinite(time)?time:0,storm=T.MathUtils.clamp(Number.isFinite(storm01)?storm01:0,0,1);
      root.getWorldPosition(worldPos);for(const [uniform,local] of waterlines)uniform.value=worldPos.y+local;
      wet.opacity=.36+.19*storm;wet.roughness=.17-.055*storm;haze.opacity=.16+.26*storm;
      for(let i=0;i<sprays.length;i++){const {o,x,y,z}=sprays[i],a=t*(.28+.22*storm)+i*1.79;o.position.set(x+Math.sin(a)*(.59+.42*storm),y+.11*Math.sin(a*.78),z+.37*Math.cos(a));}
      light.intensity=18.85+.38*Math.sin(t*2.19)+.17*Math.sin(t*5.03);
    }
    update(0,0);
    return {update,dispose(){if(disposed)return;disposed=true;root.removeFromParent();for(const r of owned)r.dispose();root.clear();owned.clear();}};
  }
  return {create};
})();
