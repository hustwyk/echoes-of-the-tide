// The offshore relay landing, with static ironwork in instance batches and a completely open optical sector.
const TideRelayEnv=(()=>{
  'use strict';
  function create(parent,world){
    const T=THREE,root=new T.Group();root.name='北岬海床 · 八号中继台';parent.add(root);
    const owned=new Set(),keep=v=>(owned.add(v),v),geometries=new Map(),batches=new Map(),waterlines=[];
    const TAU=2*Math.PI,v=(x,y,z)=>new T.Vector3(x,y,z),q=new T.Quaternion(),e=new T.Euler(),yAxis=v(0,1,0);
    let seed=8172031,disposed=false;
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
    const china=mat(0xffffff,.22,.12),char=0x3d4f50,grey=0x7b8d86,zinc=0x9bada5,drab=0x6e847e,warm=0x948365,rust=0x95674a;
    function slab(color,line){
      const m=typeof TideConcrete==='undefined'?mat(color,.84,.04):keep(TideConcrete.material(color,line));
      if(m.userData.waterline)waterlines.push([m.userData.waterline,line]);return m;
    }
    const concrete=slab(0xb9beb0,-.41),rock=slab(0x9ca99d,-.51);
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
    // The right run of the apron is dressed as successive precast panels; its eastern outer edge drains to sea.
    box(-.15,-.36,.50,13.30,.718,13.0,concrete);
    box(-.15,-.79,.50,12.94,.20,12.72,rock);
    for(const x of [-6.66,-3.34,-.05,3.22,6.36])box(x,.0004,.50,.011,.002,12.90,rubber,0x657067);
    for(const z of [-5.80,-3.06,-.32,2.43,5.17])box(-.15,.0008,z,13.12,.0016,.012,rubber,0x687169);
    for(const sx of [-1,1]){
      const x=sx<0?-6.70:6.40,xx=sx<0?-6.34:6.05;
      box(x,-.12,.5,.19,.239,12.99,rock);
      box(xx,.0006,.48,.169,.002,12.52,rubber,0x3e504e);
      for(let i=0;i<110;i++)box(xx,.006,-5.68+i*.113,.185,.014,.030,steel,i%11?0x71837a:zinc);
      for(const z of [-5.16,-2.02,1.20,4.52]){
        box(x+sx*.018,-.70,z,.32,.28,.43,paint,drab);
        box(x-sx*.09,-2.29,z,.271,3.87,.29,rock);
        for(const y of [-.42,-.67])rivet(x+sx*.126,y,z,.035,'x');
      }
    }
    for(const z of [-5.21,-1.99,1.19,4.50])box(-.15,-.75,z,13.34,.235,.24,paint,drab);
    for(const x of [-6.46,-3.34,-.14,3.04,6.14]){
      box(x,-1.79,6.77,.29,3.42,.33,rock);box(x,-.74,6.77,.55,.27,.53,rock);
    }
    // Roofless high landing and smaller lower shelf. All accessible edges around the transfer path stay open.
    function grating(x,y,z,w,d){
      for(const sx of [-1,1])box(x+sx*(w*.5-.037),y-.073,z,.08,.145,d,paint,grey);
      for(const sz of [-1,1])box(x,y-.074,z+sz*(d*.5-.038),w,.145,.084,paint,grey);
      const count=Math.max(4,Math.round(w/.102));
      for(let i=0;i<count;i++)box(x-w*.5+(i+.5)*w/count,y-.025,z,.028,.049,d-.06,steel,i%5?zinc:grey);
      for(let i=0;i<Math.ceil(d/.18);i++)box(x,y-.055,z-d*.5+(i+.5)*d/Math.ceil(d/.18),w-.08,.021,.023,paint,drab);
      for(const s of [-1,1])for(const u of [-1,1])rivet(x+s*(w*.5-.12),y+.001,z+u*(d*.5-.12),.020,'y');
    }
    function fence(a,b,h,railCount=2){
      const start=v(...a),end=v(...b),dist=start.distanceTo(end),step=Math.max(1,Math.ceil(dist/1.65));
      for(let i=0;i<=step;i++){
        const p=start.clone().lerp(end,i/step);box(p.x,p.y+.023,p.z,.152,.045,.151,steel,grey);
        beam(p.toArray(),[p.x,p.y+h,p.z],.025,.025,paint,drab,true);
      }
      for(let s=1;s<=railCount;s++){const dy=h*s/railCount;beam([a[0],a[1]+dy,a[2]],[b[0],b[1]+dy,b[2]],s===railCount?.029:.016,s===railCount?.029:.016,steel,s===railCount?zinc:grey,true);}
    }
    grating(-5.40,2.04,-1.48,1.28,1.76);
    grating(-2.68,4.56,-3.37,4.02,2.20);
    for(const x of [-6.005,-4.82])for(const z of [-2.28,-.74]){
      box(x,.966,z,.096,1.95,.115,paint,grey);box(x,.063,z,.28,.115,.28,concrete);
    }
    for(const x of [-4.54,-.826])for(const z of [-4.29,-2.48]){
      // The right-hand fore post is pulled in toward the back of the upper deck for a clear climb camera.
      const rz=x>-.9&&z>-3?-3.07:z;
      box(x,2.23,rz,.126,4.48,.142,paint,drab);
      box(x,.106,rz,.32,.21,.34,rock);
      for(const dx of [-.096,.096])rivet(x+dx,.22,rz,.019,'y');
    }
    for(const x of [-4.54,-.826]){
      beam([x,.24,-4.23],[x,3.72,-2.62],.061,.069,paint,drab);
      box(x,4.33,-3.37,.138,.23,2.19,paint,grey);
    }
    fence([-5.98,2.04,-2.29],[-5.98,2.04,-.99],.71);
    fence([-4.61,4.56,-4.40],[-4.61,4.56,-2.46],.71);
    fence([-4.53,4.56,-4.41],[-.78,4.56,-4.41],.59);
    fence([-.75,4.56,-4.30],[-.75,4.56,-3.13],.70);
    fence([-6.70,0,1.85],[-6.70,0,5.59],.61);
    fence([6.37,0,.03],[6.37,0,2.42],.58);
    // Head-rail only. The chapter's separate carriage travels between the clear posts below it.
    for(const x of [-6.17,-.45]){
      const foot=x< -1?-6.35:-.32,z=-1.47;
      beam([foot,0,z-.45],[x,5.83,z],.133,.163,paint,grey);
      beam([foot,0,z+.52],[x,5.83,z],.105,.124,paint,drab);
      box(foot,.077,z-.45,.30,.15,.33,rock);box(foot,.077,z+.52,.30,.15,.33,rock);
      box(x,5.85,z,.30,.27,.32,steel,zinc);
      for(const y of [.63,1.37,2.16,3.03,3.82,4.63,5.41])rivet(x,y,z-.04,.024);
    }
    box(-3.31,5.97,-1.47,6.05,.252,.134,paint,drab);
    for(const y of [5.851,6.098])box(-3.31,y,-1.47,6.11,.043,.293,steel,zinc);
    for(const x of [-5.91,-4.84,-3.73,-2.63,-1.53,-.70]){
      box(x,5.977,-1.47,.049,.23,.193,steel,grey);
      for(const y of [5.923,6.031])rivet(x,y,-1.356,.021);
    }
    // Former +Z cablebridge: a disconnected span hangs below the apron lip, outboard of the entry.
    const formerX=-4.42;
    for(const s of [-1,1]){
      const x=formerX+s*.76;
      beam([x,-.37,6.79],[x,-.98,9.73],.12,.15,paint,grey);
      box(x,-1.06,8.92,.136,1.91,.17,paint,drab);
      beam([x,-.71,7.67],[x,-1.61,8.91],.072,.067,steel,grey);
    }
    for(let i=0;i<8;i++)if(i!==4&&i!==5){
      const z=7.36+i*.305,y=-.44-(z-7.36)*.16;box(formerX,y,z,1.57,.053,.17,steel,i%3?drab:grey,[-.13,0,0]);
    }
    // The mast stands outside the west parapet. Its tapered double-angle legs and arched braces leave the NE bearing empty.
    const mastX=-7.91,mastZ=-4.57;
    const tiers=[{y:.77,r:1.19},{y:3.67,r:1.00},{y:6.49,r:.805},{y:9.22,r:.642},{y:11.86,r:.502},{y:14.36,r:.361},{y:16.65,r:.219},{y:18.02,r:.112}];
    function corner(s,i){return [mastX+(i===0||i===3?-1:1)*s.r,s.y,mastZ+(i<2?1:-1)*s.r];}
    for(let i=0;i<4;i++){
      const c=corner(tiers[0],i);box(c[0],-1.58,c[2],.745,4.26,.75,rock);
      box(c[0],.535,c[2],.935,.21,.94,concrete);box(c[0],.674,c[2],.59,.065,.59,steel,char);
      for(const sx of [-1,1])for(const sz of [-1,1])rivet(c[0]+sx*.205,.718,c[2]+sz*.205,.041,'y',warm);
    }
    const plateProfile=new T.Shape();plateProfile.moveTo(-.5,-.26);plateProfile.lineTo(.5,-.26);plateProfile.lineTo(.5,-.10);plateProfile.lineTo(.16,.25);plateProfile.lineTo(-.16,.25);plateProfile.lineTo(-.5,-.10);plateProfile.closePath();
    for(const x of [-.224,0,.224]){const hole=new T.Path();hole.absarc(x,-.091,.087,0,TAU,true);plateProfile.holes.push(hole);}
    const pierced=geo('perforated gusset',()=>new T.ExtrudeGeometry(plateProfile,{depth:.054,curveSegments:11,bevelEnabled:false}));
    for(let j=0;j<tiers.length;j++){
      const t=tiers[j],next=tiers[j+1];
      for(let n=0;n<4;n++){
        const a=corner(t,n),b=corner(t,(n+1)%4);
        beam(a,b,.087,.084,paint,j%2?drab:grey);
        if(!next)continue;
        const c=corner(next,n),d=corner(next,(n+1)%4),height=next.y-t.y;
        beam(a,c,j<3?.146:.097,j<3?.145:.094,paint,j<3?0x7b9188:zinc);
        beam([a[0]+.043,a[1],a[2]+.043],[c[0]+.032,c[1],c[2]+.032],.046,.048,steel,zinc);
        if(j%2===0){
          // Small pointed arches form the wide upper half of each historic tower bay.
          const mid=[(c[0]+d[0])*.5,c[1]-.16*height,(c[2]+d[2])*.5];
          const kneea=[a[0]*.75+b[0]*.25,t.y+height*.55,a[2]*.75+b[2]*.25];
          const kneeb=[a[0]*.25+b[0]*.75,t.y+height*.55,a[2]*.25+b[2]*.75];
          beam(a,kneea,.060,.056,steel,grey);beam(kneea,mid,.060,.056,steel,grey);
          beam(b,kneeb,.060,.056,steel,grey);beam(kneeb,mid,.060,.056,steel,grey);
          beam(kneea,d,.037,.038,paint,drab);beam(kneeb,c,.037,.038,paint,drab);
        }else{
          beam(a,d,.051,.046,steel,grey);beam(b,c,.050,.046,paint,drab);
        }
        if(n===0&&j<6){
          part(pierced,paint,grey,[mastX,t.y+.13,mastZ+t.r+.020],[t.r*.98,.82,.62],null);
          for(const xx of [-.32,.32])rivet(mastX+xx*t.r,t.y+.022,mastZ+t.r+.064,.024,'z');
        }
      }
    }
    // Broad ceramic-insulated booms at two different heights form the mast silhouette.
    for(const [j,y,reach] of [[0,11.92,3.12],[1,15.14,2.06]]){
      for(const s of [-1,1]){
        const end=mastX+s*reach,z=mastZ+j*.14-.03;
        beam([mastX,y,z],[end,y+.29,z],.114,.116,steel,zinc);
        beam([mastX,y-1.34,z],[end,y+.28,z],.075,.08,paint,grey);
        beam([mastX+s*.96,y-.82,z],[mastX+s*1.03,y+.10,z],.053,.064,paint,drab);
        beam([end,y+.23,z-.38],[end,y+.23,z+.38],.081,.080,paint,grey);
        for(const sz of [-1,1]){
          const zz=z+sz*.30;cylinder(end,y+.53,zz,.064,.39,steel,grey);
          for(let k=0;k<5;k++){
            const yy=y+.40+k*.088;
            part(ball,china,k%2?0xa5b4a7:0x9fb7ae,[end,yy,zz],[.131-k*.006,.039,.131-k*.006],null);
            cylinder(end,yy+.044,zz,.049,.041,china,0xb8c1ae);
          }
          cylinder(end,y+.816,zz,.055,.051,steel,warm);
        }
      }
    }
    cylinder(mastX,18.94,mastZ,.043,1.87,steel,zinc);
    ring(mastX,18.04,mastZ,.172,.026,steel,zinc,[Math.PI/2,0,0]);
    const redLamp=mat(0xc56850,.34,.14,{emissive:0xc24b31,emissiveIntensity:1.22});
    part(ball,redLamp,0xffffff,[mastX,18.42,mastZ],[.079,.101,.079],null);
    // Actual three-strand cable. This uses a single material and geometry for all stays.
    const ropePos=[],ropeNorm=[],ropeIdx=[];
    function braided(a,b,r){
      const start=v(...a),end=v(...b),len=start.distanceTo(end),steps=Math.min(78,Math.max(20,Math.round(len*3.4))),axis=end.clone().sub(start).normalize();
      const n1=axis.clone().cross(yAxis).normalize(),n2=axis.clone().cross(n1).normalize();
      for(let s=0;s<3;s++){
        const begin=ropePos.length/3;
        for(let j=0;j<=steps;j++){
          const t=j/steps,center=start.clone().lerp(end,t);center.y-=.17*Math.sin(t*Math.PI);
          const twist=t*len*2.0+s*TAU/3;center.addScaledVector(n1,r*.45*Math.cos(twist));center.addScaledVector(n2,r*.45*Math.sin(twist));
          for(let k=0;k<5;k++){
            const angle=k*TAU/5+twist,nn=n1.clone().multiplyScalar(Math.cos(angle)).addScaledVector(n2,Math.sin(angle));
            ropeNorm.push(...nn.toArray());ropePos.push(...center.clone().addScaledVector(nn,r*.66).toArray());
            if(j<steps){const u=begin+j*5+k,u2=begin+j*5+(k+1)%5;ropeIdx.push(u,u2,u+5,u2,u2+5,u+5);}
          }
        }
      }
      const p=start.clone().lerp(end,.89),q=start.clone().lerp(end,.935);
      beam(p.toArray(),q.toArray(),r*2.15,r*2.15,steel,warm,true);
      const mount=end.toArray();box(mount[0],mount[1]-.18,mount[2],.60,.27,.65,rock);
      cylinder(end.x,end.y-2.42,end.z,.222,4.40,rock,0xffffff);
      cylinder(end.x,end.y-.49,end.z,.248,.125,steel,drab);
      for(const s of [-1,1])beam([end.x+s*.18,end.y-.30,end.z],[end.x+s*.061,end.y-1.07,end.z+.10],.041,.041,paint,drab);
      for(const dx of [-.19,.19])rivet(end.x+dx,end.y-.028,end.z,.033,'y');
    }
    braided([mastX-.31,14.38,mastZ+.19],[-12.3,-.22,4.95],.029);
    braided([mastX+.23,14.40,mastZ-.15],[-6.88,-.15,-12.80],.027);
    braided([mastX-.63,9.18,mastZ-.44],[-13.28,-.27,-10.86],.031);
    function indexed(pos,norm,idx){
      const g=keep(new T.BufferGeometry());g.setAttribute('position',new T.Float32BufferAttribute(pos,3));if(norm)g.setAttribute('normal',new T.Float32BufferAttribute(norm,3));g.setIndex(idx);if(!norm)g.computeVertexNormals();return g;
    }
    const guyMat=mat(0x75827c,.48,.61);
    mesh(indexed(ropePos,ropeNorm,ropeIdx),guyMat);
    // Rear office. The front and east-facing work area are open; the two back windows are genuine openings.
    const office=slab(0x94a59d,-.39),ow=5.26,ox=3.81,back=-6.09;
    box(ox,.52,back,ow,1.04,.20,office);
    box(ox,2.96,back,ow,.74,.20,office);
    for(const [x,w] of [[1.51,.66],[3.69,2.09],[6.20,.48]])box(x,1.82,back,w,1.59,.20,office);
    // Upper flashing and perimeter eaves; the interior sky is exposed above the work surface.
    box(ox,3.27,back,ow+.08,.15,.32,paint,char);
    box(ox,3.87,back-.025,ow+.16,.18,.48,paint,grey);
    for(const x of [1.17,6.47]){
      box(x,1.90,back,.13,3.77,.245,paint,drab);
      box(x,.113,back,.35,.225,.36,rock);
    }
    box(6.47,1.65,-5.51,.17,3.29,1.20,office);
    box(6.46,3.875,-5.32,.24,.18,1.66,paint,grey);
    for(const x of [2.245,5.36]){
      const wid=x<3?.798:1.18;
      for(const s of [-1,1]){
        box(x+s*wid*.5,1.83,back+.035,.057,1.63,.135,paint,drab);
        box(x,1.83+s*.778,back+.023,wid+.12,.061,.18,paint,drab);
      }
      box(x,1.82,back+.037,.026,1.53,.070,steel,zinc);
      box(x,1.99,back+.037,wid,.036,.070,steel,drab);
      box(x,1.011,back+.084,wid+.18,.065,.285,steel,grey);
    }
    const windowMap=texture(256,256,(c,w,h)=>{
      const g=c.createLinearGradient(0,0,0,h);g.addColorStop(0,'#879ea2');g.addColorStop(.61,'#c0cbc0');g.addColorStop(1,'#65838a');c.fillStyle=g;c.fillRect(0,0,w,h);
      for(let i=0;i<680;i++){
        const xx=random()*w,yy=random()*h,r=random()*2.0+.55;c.strokeStyle='rgba(213,225,218,'+(.1+random()*.21)+')';c.lineWidth=.5;c.beginPath();c.arc(xx,yy,r,.3,2.62);c.stroke();
        if(i%16===0){c.fillStyle='rgba(77,104,106,.19)';c.fillRect(xx,yy+1,.75,r*7);}
      }
    });
    const glass=mat(0xb6c6c6,.21,.18,{map:windowMap,emissive:0x99b9c0,emissiveMap:windowMap,emissiveIntensity:.33,transparent:true,opacity:.42,depthWrite:false});
    for(const [x,w] of [[2.245,.77],[5.36,1.15]])part(plane,glass,0xffffff,[x,1.82,back+.004],[w,1.52,1],null);
    // Off-white raised-seam wall panels, flaking duct shroud and original concealed copper conduit.
    for(const x of [1.38,1.64,2.90,3.16,3.42,3.68,3.94,4.20,4.46,6.11,6.35]){
      box(x,1.79,back+.115,.020,1.51,.031,paint,0x8c9d92);
      for(const yy of [1.14,2.44])rivet(x,yy,back+.138,.012);
    }
    for(const y of [.68,.76])beam([1.30,y,back+.18],[6.34,y,back+.18],.018,.018,steel,warm,true);
    for(const x of [1.53,2.84,4.61,6.12])box(x,.72,back+.19,.058,.15,.048,paint,drab);
    box(6.03,2.78,back+.17,.48,.40,.114,paint,drab);
    for(let i=0;i<5;i++)box(6.03,2.64+i*.066,back+.243,.405,.026,.04,steel,grey,[-.3,0,0]);
    // Period paint and station lettering are composed into one atlas of drawings and transparent weather marks.
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
    const stationSign=tile(656,133,(c,w,h)=>{
      c.fillStyle='#394e51';c.fillRect(0,0,w,h);c.strokeStyle='#c9be9d';c.lineWidth=2;c.strokeRect(6,6,w-12,h-12);
      c.fillStyle='#dfd6b7';c.font='bold 48px "Songti SC","Microsoft YaHei",serif';c.textAlign='center';c.textBaseline='middle';c.fillText('北岬港　八号中继台',w/2,49,w-40);
      c.fillStyle='#bdc7b8';c.font='bold 17px monospace';c.fillText('NORTH CAPE  /  OFFSHORE RELAY VIII',w/2,96);wear(c,w,h);
    });
    box(3.78,2.93,back+.133,2.34,.478,.077,paint,char);stamp(stationSign,3.78,2.93,back+.18,2.28,.425);
    for(const dx of [-1.08,1.08])for(const dy of [-.16,.16])rivet(3.78+dx,2.93+dy,back+.192,.018);
    const clearance=tile(290,94,(c,w,h)=>{
      c.fillStyle='#b6b398';c.fillRect(0,0,w,h);c.fillStyle='#574e3f';c.font='bold 28px "Songti SC",serif';c.fillText('转运梁　限载二人',12,39);
      c.font='13px monospace';c.fillText('吊运通道  /  CLEAR BELOW',15,73);wear(c,w,h);
    });
    box(-3.32,6.13,-1.312,1.25,.255,.037,paint,char);stamp(clearance,-3.32,6.13,-1.282,1.17,.219);
    const metalTag=tile(220,100,(c,w,h)=>{
      c.fillStyle='#967e4f';c.fillRect(0,0,w,h);c.strokeStyle='#4b5348';c.lineWidth=3;c.strokeRect(5,5,w-10,h-10);
      c.fillStyle='#344741';c.font='bold 32px "Songti SC",serif';c.fillText('海侧接地',19,46);c.font='12px monospace';c.fillText('RF EARTH TERMINAL · VIII',18,74);wear(c,w,h);
    });
    stamp(metalTag,-6.92,3.72,mastZ+1.037,.46,.20);
    const serial=tile(302,100,(c,w,h)=>{
      c.fillStyle='#baaa81';c.font='bold 37px sans-serif';c.fillText('旧缆桥　封闭',8,46);c.font='14px monospace';c.fillText('CLOSED SPAN  /  03',10,77);wear(c,w,h);
    });
    stamp(serial,-4.42,.003,6.65,1.66,.49,-Math.PI/2);
    const compass=tile(448,448,(c,w,h)=>{
      c.translate(w/2,h/2);c.strokeStyle='#b1b3a1';c.fillStyle='#b6b8a4';c.globalAlpha=.86;c.lineWidth=2;
      for(const r of [144,166,173]){c.beginPath();c.arc(0,0,r,0,TAU);c.stroke();}
      for(let i=0;i<64;i++){const a=i*TAU/64;c.lineWidth=i%8?1.7:3.0;c.beginPath();c.moveTo(Math.sin(a)*(i%8?155:141),Math.cos(a)*(i%8?155:141));c.lineTo(Math.sin(a)*172,Math.cos(a)*172);c.stroke();}
      for(let i=0;i<8;i++){c.save();c.rotate(i*TAU/8);c.beginPath();c.moveTo(0,-(i%2?72:112));c.lineTo(9,-19);c.lineTo(0,-5);c.stroke();c.beginPath();c.moveTo(0,-(i%2?72:112));c.lineTo(-9,-19);c.lineTo(0,-5);c.closePath();c.fill();c.restore();}
      c.font='bold 21px serif';c.textAlign='center';c.fillText('N',0,-183);c.fillText('S',0,198);c.fillText('E',189,7);c.fillText('W',-189,7);
      c.translate(-w/2,-h/2);wear(c,w,h,.014);
    });
    stamp(compass,1.32,.003,4.74,2.67,2.67,-Math.PI/2);
    const salt=tile(480,120,(c,w,h)=>{
      const line=x=>41+6*Math.sin(x*.022)+2.4*Math.sin(x*.141);
      for(let x=0;x<w;x++){const y=line(x)+random()*1.7,g=c.createLinearGradient(0,y-3,0,y+64);g.addColorStop(0,'rgba(222,215,180,0)');g.addColorStop(.075,'rgba(224,221,189,'+(.22+random()*.36)+')');g.addColorStop(.23,'rgba(122,146,117,.23)');g.addColorStop(1,'rgba(61,78,62,0)');c.fillStyle=g;c.fillRect(x,y-3,1,71);}
      for(let i=0;i<2500;i++){const x=random()*w;c.fillStyle='rgba(215,210,174,.34)';c.fillRect(x,line(x)+(random()-.3)*random()*32,.4+random()*2.2,.4+random()*1.1);}
    });
    stamp(salt,-.15,-.39,7.001,13.24,.49);
    stamp(salt,-6.802,-.38,.51,12.96,.51,0,-Math.PI/2);
    stamp(salt,6.502,-.38,.51,12.96,.51,0,Math.PI/2);
    stamp(salt,3.83,.50,back+.102,5.11,.48);
    const dg=indexed(decals.p,decals.n,decals.i);dg.setAttribute('uv',new T.Float32BufferAttribute(decals.uv,2));mesh(dg,decalMat).castShadow=false;
    // Small shallow puddles have rough dried rims, low roughness in the centre and no extra reflection pass.
    const wet=keep(new T.MeshPhysicalMaterial({color:0x506463,roughness:.15,metalness:.38,clearcoat:.83,clearcoatRoughness:.13,transparent:true,opacity:.39,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2}));
    const waterPos=[],waterIdx=[];
    function puddle(x,z,rx,rz){
      const n=waterPos.length/3;waterPos.push(x,.0024,z);const phase=random()*TAU;
      for(let i=0;i<=50;i++){
        const a=i*TAU/50,r=.82+.12*Math.sin(3*a+phase)+.070*Math.sin(8*a-phase)+.031*Math.cos(13*a);
        waterPos.push(x+rx*r*Math.cos(a),.0024,z+rz*r*Math.sin(a));if(i<50)waterIdx.push(n,n+i+2,n+i+1);
      }
    }
    for(const args of [[-5.77,4.45,.50,1.32],[-2.4,1.11,.91,.36],[5.36,1.11,.62,1.35],[2.03,-3.32,1.13,.41],[4.61,-3.36,.64,.32],[-2.82,-4.81,1.15,.45]])puddle(...args);
    mesh(indexed(waterPos,null,waterIdx),wet).castShadow=false;
    const shell=mat(0xced1b8,.37,.26),bulb=mat(0xf3d399,.31,.10,{emissive:0xffa958,emissiveIntensity:3});
    const lx=1.88,ly=2.82,lz=-5.66;
    beam([lx,ly+.29,back+.12],[lx,ly+.29,lz],.027,.027,steel,drab,true);
    cylinder(lx,ly+.16,lz,.065,.21,paint,char);
    part(geo('lampshade',()=>new T.ConeGeometry(.217,.19,26,1,true)),shell,0xffffff,[lx,ly+.078,lz],[1,1,1],null);
    part(ball,bulb,0xffffff,[lx,ly-.06,lz],[.067,.105,.067],null);
    for(const s of [-1,1])beam([lx+s*.085,ly+.018,lz+.025],[lx+s*.059,ly-.149,lz+.031],.008,.008,steel,grey,true);
    ring(lx,ly-.146,lz,.059,.008,steel,grey,[Math.PI/2,0,0]);
    const amber=keep(new T.PointLight(0xffb76b,20,6.0,2));amber.position.set(lx,ly-.18,lz+.12);root.add(amber);
    const haloMap=texture(128,128,(c,w,h)=>{
      const r=w/2,g=c.createRadialGradient(r,r,0,r,r,r);g.addColorStop(0,'rgba(254,231,178,1)');g.addColorStop(.13,'rgba(255,194,107,.7)');g.addColorStop(.37,'rgba(230,143,67,.25)');g.addColorStop(.76,'rgba(224,127,60,.052)');g.addColorStop(1,'rgba(210,113,55,0)');c.fillStyle=g;c.fillRect(0,0,w,h);
    });
    const halo=keep(new T.MeshBasicMaterial({map:haloMap,transparent:true,opacity:.68,depthWrite:false,blending:T.AdditiveBlending}));
    part(plane,halo,0xffffff,[lx,ly-.063,back+.112],[2.69,2.13,1],null);
    part(plane,halo,0xffffff,[lx,ly-.063,lz+.080],[.61,.66,1],null);
    // Wind is visible through the torn hems of the relay pennants. Geometry moves only on these small patches.
    const clothTex=texture(336,112,(c,w,h)=>{
      c.fillStyle='#c4855d';c.fillRect(0,0,w,h);
      c.fillStyle='#d7cba3';for(let x=31;x<w;x+=105)c.fillRect(x,0,26,h);
      for(let i=0;i<h;i+=3){c.fillStyle='rgba(45,55,48,.15)';c.fillRect(0,i,w,.8);}
      for(let i=0;i<w;i+=4){c.fillStyle='rgba(244,227,186,.18)';c.fillRect(i,0,.7,h);}
      c.strokeStyle='#cfc2a1';c.lineWidth=1.5;c.setLineDash([5,4]);c.strokeRect(6,6,w-12,h-12);
      wear(c,w,h,.006);
    });
    const cloth=mat(0xe9e1c7,.90,.03,{map:clothTex,side:T.DoubleSide});
    const flags=[];
    function flag(x,y,z,len,h,dir,phase){
      const nx=22,ny=5,p=[],uv=[],index=[];
      for(let ix=0;ix<=nx;ix++)for(let j=0;j<=ny;j++){
        const u=ix/nx,vv=j/ny;p.push(0,0,0);uv.push(u,vv);
        if(ix<nx&&j<ny&&!(ix===nx-1&&(j===1||j===4))){
          const a=ix*(ny+1)+j,b=a+ny+1;index.push(a,b,a+1,b,b+1,a+1);
        }
      }
      const g=keep(new T.BufferGeometry());const attr=new T.Float32BufferAttribute(p,3);attr.setUsage(T.DynamicDrawUsage);g.setAttribute('position',attr);g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(index);
      g.boundingSphere=new T.Sphere(v(dir*len*.5,-h*.45,0),len*.80+h);
      const o=mesh(g,cloth,x,y,z);o.castShadow=false;
      flags.push({g,attr,len,h,dir,phase,nx,ny});
    }
    beam([-6.69,.06,4.02],[-6.69,2.89,4.02],.034,.034,steel,zinc,true);
    flag(-6.69,2.83,4.02,1.37,.32,-1,.63);
    flag(mastX-.57,9.25,mastZ+.41,1.73,.43,-1,1.74);
    beam([6.32,3.56,-5.44],[6.32,4.08,-5.44],.025,.025,steel,zinc,true);
    flag(6.32,4.0,-5.44,.98,.24,1,3.21);
    const mistMap=texture(256,76,(c,w,h)=>{
      const im=c.createImageData(w,h);
      for(let y=0;y<h;y++)for(let x=0;x<w;x++){
        const u=x/w,vv=y/h,ix=(y*w+x)*4;
        const env=Math.pow(Math.max(0,Math.sin(u*Math.PI)),1.45)*Math.pow(Math.max(0,Math.sin(vv*Math.PI)),1.62);
        const n=.55+.25*Math.sin(19*u+5*vv)*Math.cos(4*u-4*vv)+.15*Math.sin(37*u+8*vv+.4);
        im.data[ix]=178;im.data[ix+1]=195;im.data[ix+2]=191;im.data[ix+3]=Math.round(135*n*env);
      }c.putImageData(im,0,0);
    });
    const mistMat=keep(new T.MeshBasicMaterial({map:mistMap,transparent:true,opacity:.20,depthWrite:false,side:T.DoubleSide}));
    const mist=[];
    for(const [x,y,z,w,h,angle] of [[-9.64,-2.12,-7.18,6.9,.85,-.40],[-8.22,-2.37,.86,5.4,.51,.73],[8.70,-2.33,-7.70,6.15,.70,.42]]){
      const o=mesh(plane,mistMat,x,y,z);o.scale.set(w,h,1);o.rotation.y=angle;o.castShadow=false;mist.push({o,x,y,z});
    }
    for(const b of batches.values()){
      const o=keep(new T.InstancedMesh(b.g,b.m,b.x.length));
      for(let i=0;i<b.x.length;i++){o.setMatrixAt(i,b.x[i]);o.setColorAt(i,new T.Color(b.t[i]));}
      o.castShadow=b.m!==halo&&b.m!==bulb&&b.m!==redLamp&&b.m!==glass;o.receiveShadow=true;o.computeBoundingSphere();root.add(o);
    }
    const worldPos=new T.Vector3();
    function update(time=0){
      if(disposed)return;const t=Number.isFinite(time)?time:0;
      root.getWorldPosition(worldPos);for(const [uniform,local] of waterlines)uniform.value=worldPos.y+local;
      for(const f of flags){
        const {nx,ny,len,h,dir,attr,phase}=f;
        for(let i=0;i<=nx;i++){
          const u=i/nx,wave1=Math.sin(u*8.8-t*5.6+phase),wave2=Math.sin(u*15.1-t*7.1+phase);
          for(let j=0;j<=ny;j++){
            const v=j/ny,taper=1-.52*u,slit=i===nx?(.045*Math.sin(j*2.97)):0;
            attr.setXYZ(i*(ny+1)+j,dir*(u*len-slit),-(1-v)*h*taper-.108*u*u+.038*u*wave1,u*((.134+.022*v)*wave1+.037*wave2)+.033*u*(v-.5));
          }
        }
        attr.needsUpdate=true;f.g.computeVertexNormals();
      }
      for(let i=0;i<mist.length;i++){const {o,x,y,z}=mist[i],a=t*.34+i*1.84;o.position.set(x+.95*Math.sin(a),y+.10*Math.sin(a*.79),z+.32*Math.cos(a));}
      redLamp.emissiveIntensity=.78+.58*Math.pow(.5+.5*Math.cos(t*1.09),3);
      amber.intensity=19.3+.48*Math.sin(t*1.63)+.21*Math.sin(t*4.84);
    }
    update(0);
    return {update,dispose(){
      if(disposed)return;disposed=true;root.removeFromParent();for(const r of owned)r.dispose();root.clear();owned.clear();
    }};
  }
  return {create};
})();
