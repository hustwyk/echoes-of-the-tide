// North Cape fender coping. Geometry, wetting, wear, shoe rubs and bent iron are original.
// Local source photographs: Sandstone Cracks (Rob Tuytel) and Concrete Floor 01
// and Green Metal Rust (Rob Tuytel), all via Poly Haven, CC0. Embedded WebP derivatives.
// https://polyhaven.com/a/sandstone_cracks  https://polyhaven.com/a/concrete_floor_01
const TideCoping=(()=>{
  let source;
  function loadMaps(){
    if(window.TideCopingMaps)return Promise.resolve(window.TideCopingMaps);
    if(!source)source=new Promise((resolve,reject)=>{
      const script=document.createElement('script');script.src='assets/coping-stone.js';
      script.onload=()=>resolve(window.TideCopingMaps);
      script.onerror=()=>{source=null;script.remove();reject(new Error('Coping surfaces unavailable'));};
      document.head.appendChild(script);
    });
    return source;
  }
  function create(parent){
    const T=THREE,owned=new Set(),own=o=>(owned.add(o),o),root=new T.Group();root.name='Landward coping / boarding stones and bullnose';parent.add(root);
    const loading=[],maps=loadMaps();
    let disposed=false;
    function image(k,srgb){
      const canvas=document.createElement('canvas');canvas.width=canvas.height=1;
      const c=canvas.getContext('2d');
      c.fillStyle=k.includes('normal')?'#8080ff':k.includes('rough')?'#dedede':k.includes('arm')?'#14bd7a':'#89877c';c.fillRect(0,0,1,1);
      const t=own(new T.Texture(canvas));t.anisotropy=8;t.needsUpdate=true;
      if(srgb)t.colorSpace=T.SRGBColorSpace;
      loading.push(maps.then(async bank=>{
        if(disposed)return;
        const img=new Image();img.src=bank[k];await img.decode();
        if(!disposed){t.dispose();t.image=img;t.needsUpdate=true;}
      }).catch(()=>{}));
      return t;
    }
    const stone=own(new T.MeshStandardMaterial({map:image('stone',true),normalMap:image('normal',false),
      roughnessMap:image('rough',false),metalness:.026,roughness:.97,vertexColors:true}));
    stone.normalScale.set(.80,.80);
    const arm=image('steel-arm',false),iron=own(new T.MeshStandardMaterial({map:image('steel',true),roughnessMap:arm,metalnessMap:arm,metalness:1,roughness:.96,vertexColors:true}));
    iron.normalMap=image('steel-normal',false);iron.normalScale.set(.15,.15);
    const detail=own(new T.MeshStandardMaterial({color:0xffffff,metalness:.60,roughness:.50,vertexColors:true}));
    const mortar=own(new T.MeshStandardMaterial({color:0xffffff,metalness:.015,roughness:.94,vertexColors:true}));
    const V=(x,y,z)=>new T.Vector3(x,y,z),Y=V(0,1,0),X=V(1,0,0),Z=V(0,0,1),TAU=Math.PI*2;
    const data=new Map(),tint=new T.Color(),unit=V(1,1,1),v=V(0,0,0),normal=V(0,0,0);
    function bucket(mat){if(!data.has(mat))data.set(mat,{pos:[],n:[],uv:[],col:[]});return data.get(mat);}
    function put(part,p,n,uv,c){
      part.pos.push(p.x,p.y,p.z);part.n.push(n.x,n.y,n.z);part.uv.push(uv[0],uv[1]);part.col.push(c.r,c.g,c.b);
    }
    function face(mat,a,b,c,d,uv,out,color=0xffffff){
      const part=bucket(mat),vv=[a,b,c,d],n=V(0,0,0).crossVectors(b.clone().sub(a),c.clone().sub(a)).normalize();
      const reverse=n.dot(out)<0;if(reverse)n.negate();
      tint.set(color);for(const i of reverse?[0,2,1,0,3,2]:[0,1,2,0,2,3])put(part,vv[i],n,uv[i],tint);
    }
    const texStone=(zz,q)=>[(zz-8.57)/3.34,1-(q+.244)/.975];
    const square=[[0,0],[1,0],[1,1],[0,1]];
    const template=[],keep=g=>(template.push(g),g),cube=keep(new T.BoxGeometry()),hex=keep(new T.CylinderGeometry(1,1,1,6)),round=keep(new T.CylinderGeometry(1,1,1,12));
    const quat=new T.Quaternion(),rot=new T.Euler(),matrix=new T.Matrix4(),nmat=new T.Matrix3();
    function add(mat,geo,where,size=unit,rotation=quat.identity(),color=0xffffff){
      const dest=bucket(mat),att=geo.attributes,ix=geo.index,count=ix?ix.count:att.position.count;
      matrix.compose(where,rotation,size);nmat.getNormalMatrix(matrix);tint.set(color);
      for(let i=0;i<count;i++){const j=ix?ix.getX(i):i;v.fromBufferAttribute(att.position,j).applyMatrix4(matrix);
        normal.fromBufferAttribute(att.normal,j).applyNormalMatrix(nmat);put(dest,v,normal,att.uv?[att.uv.getX(j),att.uv.getY(j)]:[0,0],tint);}
    }
    function block(mat,x,y,z,w,h,d,color,rx=0,ry=0,rz=0){add(mat,cube,V(x,y,z),V(w,h,d),quat.setFromEuler(rot.set(rx,ry,rz)),color);}
    function stud(mat,x,y,z,r,depth,axis,color,geometry=hex){
      add(mat,geometry,V(x,y,z),V(r,depth,r),quat.setFromUnitVectors(Y,axis),color);
    }
    function rod(mat,a,b,r,color){
      const d=b.clone().sub(a);add(mat,round,a.clone().lerp(b,.5),V(r,d.length(),r),quat.setFromUnitVectors(Y,d.normalize()),color);
    }
    const joints=[8.57,9.19,10.115,10.812,11.438,11.91], shades=[0xe9e7da,0xf5f4e8,0xf1f0de,0xe8ecdf,0xefede4];
    const spalls=[[8.661,.051,.026],[9.192,.039,.012],[9.442,.062,.014],[10.123,.058,.027],[10.543,.068,.021],[10.804,.052,.033],[11.006,.085,.018],[11.525,.048,.024],[11.822,.054,.014]];
    const sat=t=>Math.min(1,Math.max(0,t));
    function weather(z){
      let cut=0;
      for(const [a,w,d] of spalls)cut+=Math.max(0,1-Math.abs(z-a)/w)*d;
      return cut;
    }
    // Continuous palm land at x=-.780, below the rounded arris. Larger chips mostly
    // affect the top bevel and leave a protected, dry lip underneath the facing.
    function ring(z,k,t){
      const chip=weather(z),waves=.0031*Math.sin(z*23.31)+.0019*Math.sin(z*69.12+1.10);
      const zz=(q)=>{
        const twist=n=>.0043*Math.sin(q*17.8+n*1.95)+.0024*Math.cos(q*6+n);
        return z+(k===0?0:twist(k))*(1-t)+(k===joints.length-2?0:twist(k+1))*t;
      };
      const corners=[
        [-1.416,.677+.12*waves],[-1.304,.680+.24*waves],[-1.108,.680+.17*waves],[-.948,.680+.15*waves],[-.861,.680+.18*waves],
        [-.813-chip*.80-waves*.53,.679-chip*.16],[-.792-chip*.68-waves*.39,.673-chip*.43],
        [-.780-chip*.16,.660-chip*.23],[-.780-chip*.11,.638+waves*.18],[-.790-chip*.14,.626+waves*.31],
        [-.810-chip*.18,.620+waves*.38],[-.836-chip*.48,.609+waves],[-.838-chip*.51,.522+waves*.8],
        [-.866,.508+waves],[-1.413,.506]
      ];
      return corners.map(([x,y])=>V(x,y,zz(-.780-x)));
    }
    const capDir=[Y,Y,Y,Y,Y,V(.25,.96,0),V(.72,.70,0),X,X,V(.45,-.82,0),V(.38,-.9,0),X,V(.69,-.30,0),V(0,-1,0),V(-1,0,0)];
    function sQ(p,i){
      if(i<6)return -.780-p.x;
      if(i<=8)return .014+(p.y-.648)*.72;
      return p.y-.680;
    }
    for(let j=0;j<joints.length-1;j++){
      const lo=joints[j]+(j?.0045:0),hi=joints[j+1]-(j===joints.length-2?0:.0045),n=Math.ceil((hi-lo)/.026);
      let previous=ring(lo,j,0);
      for(let k=1;k<=n;k++){
        const t=k/n,current=ring(lo+(hi-lo)*t,j,t);
        for(let i=0;i<current.length;i++){
          const ii=(i+1)%current.length,p=[previous[i],current[i],current[ii],previous[ii]],uv=p.map(a=>texStone(a.z,sQ(a,i)));
          face(stone,...p,uv,capDir[i],shades[j]);
        }
        previous=current;
      }
      for(const side of [-1,1]){
        const z=side<0?lo:hi,ar=ring(z,j,side<0?0:1),center=V(-1.115,.581,z);
        for(let i=0;i<ar.length;i++){
          const a=ar[i],b=ar[(i+1)%ar.length],uv=[a,b,center,center].map(p=>texStone(z+.34*p.y-.190,-.78-p.x));
          face(stone,a,b,center,center,uv,V(0,0,side),j===0&&side<0?0xc8c9b9:0xb5b8ac);
        }
      }
    }
    // Lime packing is recessed at each joint rather than drawn over the hewn stone.
    for(const z of joints.slice(1,-1))block(mortar,-1.101,.592,z,.610,.129,.013,0x595a50);
    // Puddled-iron shoes are shrunk onto three raised ashlar ends. The lowest
    // return is .75m; the finger land below remains on the original stone face.
    const profile=[[-1.235,.688],[-1.235,.748],[-1.225,.805],[-1.204,.895],[-1.186,.973],[-1.156,1.026],
      [-1.119,1.057],[-1.078,1.068],[-1.035,1.066],[-.982,1.046],[-.928,1.012],[-.883,.959],
      [-.851,.898],[-.833,.833],[-.830,.797],[-.835,.771],[-.850,.753],[-.890,.748],[-.926,.748],[-.936,.688]];
    const curveLen=[0];for(let i=1;i<profile.length;i++)curveLen.push(curveLen[i-1]+Math.hypot(profile[i][0]-profile[i-1][0],profile[i][1]-profile[i-1][1]));
    function endFactor(z){const t=sat((z-10.343)/.112);return t*t*(3-2*t);}
    function boot(z,inset=0,yInset=0){
      const s=endFactor(z),wear=.00012*Math.sin(z*22)+.0010*Math.sin(z*9);
      return profile.map(([x,y],i)=>{
        const exposed=i>2&&i<17,mm=exposed?wear:0,nx=-1.035+(x+1.035)*(1-inset);
        return V(nx+mm,.682+(y-.682)*s-yInset+mm*.40,z);
      });
    }
    const capCuts=[[10.344,10.838],[10.846,11.354],[11.363,11.910]];
    for(const [j,[lo,hi]] of capCuts.entries()){
      const count=Math.ceil((hi-lo)/.024);let previous=boot(lo);
      for(let k=1;k<=count;k++){
        const z=lo+(hi-lo)*(k/count),current=boot(z);
        for(let i=0;i<profile.length;i++){
          const ii=(i+1)%profile.length,[ax,ay]=profile[i],[bx,by]=profile[ii];
          const p=[previous[i],current[i],current[ii],previous[ii]],nx=ay-by,ny=bx-ax;
          const uv=p.map((a,n)=>[(a.z-10.343)/1.567,1-curveLen[n<2?i:ii]/curveLen.at(-1)]);
          const dirs=[i,i,ii,ii].map((idx,k)=>{
            if(idx===0||idx===profile.length-1)return V(nx,ny,0).normalize();
            const point=p[k],s=endFactor(point.z),a=profile[idx-1],b=profile[idx+1];
            const dx=b[0]-a[0],dy=(b[1]-a[1])*s,grad=(endFactor(point.z+.0004)-endFactor(point.z-.0004))/.0008;
            return V(-dy,dx,-dx*grad*(profile[idx][1]-.682)).normalize();
          });
          const target=bucket(iron),c0=new T.Color(j===1?0xe1e5de:0xfffdf3);
          const nn=V(0,0,0).crossVectors(p[1].clone().sub(p[0]),p[2].clone().sub(p[0]));
          for(const n0 of nn.dot(V(nx,ny,0))<0?[0,2,1,0,3,2]:[0,1,2,0,2,3])put(target,p[n0],dirs[n0],uv[n0],c0);
        }
        previous=current;
      }
      for(const sign of [-1,1]){
        const z=sign<0?lo:hi,points=boot(z),height=endFactor(z),center=V(-1.050,.683+.18*height,z);
        for(let i=0;i<points.length;i++){
          const p=[points[i],points[(i+1)%points.length],center,center];
          face(iron,...p,p.map(a=>[(a.x+1.235)/.405,(a.y-.68)/.39]),V(0,0,sign),0xb8b7a5);
        }
      }
    }
    // Lap seams stand just below the neighboring shoulders and show oxide through the gap.
    for(const mid of [10.842,11.358]){
      const a=boot(mid-.016,.032,.003),b=boot(mid+.016,.032,.003);
      for(let i=0;i<a.length-1;i++){
        const [ax,ay]=profile[i],[bx,by]=profile[i+1];
        face(iron,a[i],b[i],b[i+1],a[i+1],square,V(ay-by,bx-ax,0),0xa49d8b);
      }
    }
    // Flush fixings sit in the lower return rather than above its polished crown.
    for(const z of [10.514,10.754,10.946,11.254,11.463,11.805]){
      stud(detail,-.831,.808,z,.0235,.005,X,0x6b5c4b,round);
      stud(detail,-.828,.808,z,.015,.009,X,0x8f8978);
      stud(detail,-1.234,.768,z,.018,.005,V(-1,0,0),0x766953,round);
    }
    // Formerly a lifting eye for the shoreward stone. Its shank and pin lie
    // flush in an oval leaded socket; only the worn top of the fold-down eye shows.
    const ex=-1.267,ez=8.894;
    const oval=keep(new T.CylinderGeometry(1,1,1,36));
    add(detail,oval,V(ex,.6814,ez),V(.058,.002,.087),quat.identity(),0x575851);
    add(detail,oval,V(ex,.6828,ez),V(.048,.002,.076),quat.identity(),0x353b37);
    const eye=[];
    for(let i=0;i<=24;i++){
      const a=-Math.PI*.53+(i/24)*Math.PI*1.68;
      eye.push(V(ex+.034*Math.sin(a),.684+.0009*Math.cos(a),ez+.056*Math.cos(a)));
    }
    for(let i=1;i<eye.length;i++)rod(detail,eye[i-1],eye[i],.0062,i>6&&i<16?0x9d9f91:0x777b6e);
    rod(detail,V(ex-.034,.682,ez-.034),V(ex+.020,.682,ez-.046),.009,0x686956);
    // Iron cramps bridge two joints, level with the walking face.
    for(const [z,x] of [[9.19,-1.304],[10.115,-1.199]]){
      block(detail,x,.682,z,.023,.003,.115,0x797765,0,.045);
      for(const s of [-1,1])block(detail,x,.6819,z+s*.052,.045,.003,.019,0x706e60,0,s*.12);
    }
    // Small recessed nose on the seaward end face. It stays behind the walking line.
    const base=V(-1.057,.862,11.910),eyez=11.911;
    stud(detail,base.x,base.y,eyez,.059,.005,Z,0x5e5a4b,round);
    stud(detail,base.x,base.y,eyez+.002,.041,.004,Z,0x343b36,round);
    for(let i=0;i<24;i++){
      const a=i*TAU/24,b=(i+1)*TAU/24;
      rod(detail,V(base.x+.035*Math.sin(a),base.y+.032*Math.cos(a),eyez+.0010),
        V(base.x+.035*Math.sin(b),base.y+.032*Math.cos(b),eyez+.0010),.005,0x868477);
    }
    // The receiving wall stops at -2.28. Dressed headers and stretchers return a
    // short way around its seaward corners; no stone is carried into the rubber.
    const endStone=own(new T.MeshStandardMaterial({map:image('end',true),normalMap:image('end-normal',false),
      roughnessMap:image('end-rough',false),roughness:.995,metalness:.018,vertexColors:true}));
    endStone.normalScale.set(.83,.83);
    const xMin=-2.663,xMax=-1.414,faceZ=11.910,baseY=-2.279,ceiling=.680;
    const endUV=p=>[(p.x+2.674)/1.272,1-(.69-p.y)/2.99];
    const rand=n=>{const v=Math.sin(n*172.37+.17)*1337.61;return v-Math.floor(v);};
    const aShades=[0xe7e9dc,0xf7f3e2,0xd4d8c8,0xe3e1ce,0xf2f0df,0xdad9c8];
    const courses=[baseY,-1.76,-1.24,-.74,-.178,.289,ceiling];
    const partitions=[[-2.20,-1.704],[-1.89],[-2.293,-1.664],[-1.883],[-2.219,-1.678],[-1.986]];
    // Undressed bedding is set well back at open joints; visible only between stones.
    block(mortar,(xMin+xMax)*.5,(baseY+ceiling)*.5,faceZ+.008,(xMax-xMin)-.004,ceiling-baseY-.007,.016,0x656150);
    for(let j=0;j<courses.length-1;j++){
      const splits=[xMin,...partitions[j],xMax],low=courses[j]+(j?.004:0),hi=courses[j+1]-(j===5?0:.005);
      for(let k=0;k<splits.length-1;k++){
        const id=10*j+k,xa=splits[k]+(k?.004:0),xb=splits[k+1]-(k<splits.length-2?.004:0),ww=xb-xa,hh=hi-low;
        const corners=[[.04,.00],[.49,.008],[.96,.001],[1,.067],[.992,.48],[1,.925],[.96,1],[.43,.993],[.024,1],[0,.934],[.007,.45],[0,.079]];
        const center=V((xa+xb)*.5,(low+hi)*.5,faceZ+.047+rand(id+3)*.011);
        const outline=corners.map(([u,vv],i)=>V(xa+ww*u+(i%3===1?.005*(rand(id*3+i)-.5):0),
          low+hh*vv+.0036*Math.sin((xa+ww*u)*11.2+j*1.3),faceZ+.029+rand(id+1.17)*.009));
        const fronts=outline.map((p,i)=>V(center.x+(p.x-center.x)*(.970+rand(id+i+2)*.011),
            center.y+(p.y-center.y)*(.964+rand(id+i+9)*.016),center.z+.006*(rand(id*13+i+3)-.5)));
        for(let i=0;i<outline.length;i++){
          const n=(i+1)%outline.length,a=outline[i],b=outline[n],f=fronts[i],h=fronts[n],ab=b.clone().sub(a),
            side=V(ab.y,-ab.x,0).normalize(),rest=a.clone();rest.z=faceZ-.001;const rb=b.clone();rb.z=faceZ-.001;
          face(endStone,rest,rb,b,a,[rest,rb,b,a].map(endUV),side,aShades[(id+3)%aShades.length]);
          face(endStone,a,b,h,f,[a,b,h,f].map(endUV),V(side.x*.6,side.y*.6,1),aShades[(j+k)%aShades.length]);
          face(endStone,f,h,center,center,[f,h,center,center].map(endUV),Z,aShades[(j+k)%aShades.length]);
        }
        // Quarried return at either corner, preserving the maintenance witness along the west side.
        if(k===0||k===splits.length-2){
          const dir=k===0?-1:1,X0=k===0?xa:xb;
          const front=faceZ+.023,back=k===0?11.856:11.886;
          const p=[V(X0+dir*.003,low+.011,front),V(X0+dir*.003,hi-.009,front),V(X0+dir*.003,hi-.009,back),V(X0+dir*.003,low+.011,back)];
          face(endStone,...p,p.map(e=>[(e.z-11.76)/1.272,1-(.69-e.y)/2.99]),V(dir,0,0),aShades[j]);
        }
      }
    }
    // The top stones return into the existing quay drain, with the old upper-scale wall untouched.
    for(const [lo,hi] of [[xMin,-1.990],[-1.981,xMax]]){
      const p=[V(lo,.6830,11.740),V(hi,.6830,11.740),V(hi,.683,11.937),V(lo,.683,11.937)];
      face(stone,...p,p.map(a=>texStone(9.07+a.x-xMin,.11+a.z-11.740)),Y,0xe3e1d2);
    }
    // Forged, pear-shaped mooring ring. The shackle passes through a separate
    // transverse bronze-bushed eye and bears against the wet stone under load.
    const bx=-2.165,by=-.30,bz=11.995;
    const plate=[[-.108,-.109],[.073,-.120],[.108,-.074],[.112,.074],[.077,.115],[-.071,.122],[-.115,.073],[-.112,-.071]];
    const center=V(bx,by,bz-.009);
    for(let i=0;i<plate.length;i++){
      const n=(i+1)%plate.length,a=V(bx+plate[i][0],by+plate[i][1],bz-.009),b=V(bx+plate[n][0],by+plate[n][1],bz-.009);
      face(iron,a,b,center,center,[a,b,center,center].map(v=>[(v.x-bx)/.24+.5,(v.y-by)/.26+.5]),Z,0xd0c7ac);
      const aa=a.clone();aa.z-=.025;const bb=b.clone();bb.z-=.025;
      face(detail,aa,bb,b,a,square,V((a.x+b.x)*.5-bx,(a.y+b.y)*.5-by,0),0x585447);
    }
    for(const x of [-.076,.076])for(const y of [-.080,.080])stud(detail,bx+x,by+y,bz-.005,.0134,.013,Z,0x928671);
    rod(detail,V(bx,by+.018,bz-.010),V(bx,by+.010,bz+.066),.037,0x716b58);
    const shackle=[];
    for(let i=0;i<=32;i++){const a=i/32*TAU;
      shackle.push(V(bx,by-.003+.043*Math.sin(a),bz+.071+.035*Math.cos(a)));}
    const bush=keep(new T.TubeGeometry(new T.CatmullRomCurve3(shackle.slice(0,-1),true),32,.0135,10,true));
    add(iron,bush,V(0,0,0),unit,quat.identity(),0xe0e2d8);
    const hang=[];
    for(let i=0;i<=52;i++){
      const a=i*TAU/52,scale=.87-.135*Math.cos(a);
      hang.push(V(bx+.147*scale*Math.sin(a),by-.222+.189*Math.cos(a),bz+.052+.030*Math.cos(a)+.009*Math.sin(a)));
    }
    const tube=keep(new T.TubeGeometry(new T.CatmullRomCurve3(hang.slice(0,-1),true),58,.021,10,true));
    add(iron,tube,V(0,0,0),unit,quat.identity(),0xf2ede1);
    // Partial polished faces show the strand that wore against a hawser.
    for(let i=20;i<33;i++){const a=hang[i].clone(),b=hang[i+1].clone();a.z+=.016;b.z+=.016;
      rod(detail,a,b,.0046,0x9e977f);}

    for(const [mat,part] of data){
      const g=own(new T.BufferGeometry());g.setAttribute('position',new T.Float32BufferAttribute(part.pos,3));g.setAttribute('normal',new T.Float32BufferAttribute(part.n,3));
      g.setAttribute('uv',new T.Float32BufferAttribute(part.uv,2));g.setAttribute('color',new T.Float32BufferAttribute(part.col,3));
      g.computeBoundingSphere();const m=new T.Mesh(g,mat);m.name=mat===endStone?'Seaward coursed facing':mat===stone?'Dressed boarding stones':mat===iron?'Wet iron cap and undercut':mat===detail?'Inlaid eyes and cramps':'Recessed mortar joints';
      m.castShadow=mat!==mortar;m.receiveShadow=true;root.add(m);
    }
    data.clear();template.forEach(g=>g.dispose());
    return {ready:Promise.all(loading),dispose(){if(disposed)return;disposed=true;parent.remove(root);owned.forEach(o=>o.dispose());owned.clear();}};
  }
  return {create};
})();
