/* North Cape 06. A moored, open-cockpit harbour launch; all distances in metres.
 * The two rectangular working decks and the low centre crossover are owned by TideFenders. */
(function () {
  'use strict';
  const T=window.THREE, TAU=2*Math.PI;
  function create(scene,w) {
    function atRest(floor){
      const p=floor.rest||floor;return {x:p.x,y:p.y,z:p.z,w:floor.w,d:floor.d};
    }
    const [aft,fore]=w.boats.map(atRest), cz=aft.z, centre=(aft.y+fore.y)*.5;
    const a=aft.x-aft.w/2, splitA=aft.x+aft.w/2, splitF=fore.x-fore.w/2, f=fore.x+fore.w/2;
    const beam=Math.max(aft.d,fore.d)*.5, stern=a-1.33, stem=f+1.87, length=stem-stern;
    const root=new T.Group(),quay=new T.Group();root.name='北岬 06 · 系泊交通艇';quay.name='北岬 06 · 岸侧系泊';scene.add(root,quay);
    const resources=new Set(),owned=x=>(resources.add(x),x);
    const v=(x,y,z)=>new T.Vector3(x,y,z), unit=v(0,1,0), white='#ffffff';
    const M=new T.Matrix4(), Q=new T.Quaternion(), E=new T.Euler(), H=new T.Matrix3(), X=v(0,0,0), N=v(0,0,0), C=new T.Color();
    let seed=760818;
    function rand(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;}
    function canvas(width,height,paint){
      const c=document.createElement('canvas');c.width=width;c.height=height;paint(c.getContext('2d'),width,height);
      const t=owned(new T.CanvasTexture(c));t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;return t;
    }
    function metallic(roughness,metalness,other={}){return owned(new T.MeshStandardMaterial({vertexColors:true,roughness,metalness,...other}));}
    const enamel=metallic(.52,.28), hardware=metallic(.38,.68), rubber=metallic(.77,.035), cord=metallic(.78,.025);
    const pane=metallic(.13,.22,{transparent:true,opacity:.38,depthWrite:false,side:T.DoubleSide});
    const enamelWear=canvas(256,256,(c,W,H)=>{
      c.fillStyle='#e9e8dc';c.fillRect(0,0,W,H);
      for(let j=0;j<6500;j++){
        c.fillStyle=rand()>.54?'rgba(33,31,21,.105)':'rgba(255,254,228,.21)';
        c.fillRect(rand()*W,rand()*H,.3+rand()*1.3,.3+rand()*1.5);
      }
      for(let i=0;i<250;i++){
        const x=rand()*W,y=rand()*H;
        c.strokeStyle=rand()>.45?'rgba(77,70,46,.31)':'rgba(255,255,242,.38)';c.lineWidth=.3+rand()*.74;
        c.beginPath();c.moveTo(x,y);c.lineTo(x+rand()*rand()*15,y+rand()*2-.8);c.stroke();
      }
    });
    enamelWear.wrapS=enamelWear.wrapT=T.RepeatWrapping;enamel.map=enamelWear;
    const lamps=owned(new T.MeshBasicMaterial({vertexColors:true,toneMapped:false}));
    const paintA=canvas(1024,256,(c,W,H)=>{
      const g=c.createLinearGradient(0,0,0,H);
      for(const [u,col] of [[0,'#bcc6b4'],[.10,'#cad1bb'],[.123,'#a2ac9b'],[.13,'#30595b'],[.26,'#3e6567'],[.47,'#284b50'],[.51,'#253e40'],[.60,'#333b34'],[.655,'#583e32'],[.73,'#8c523e'],[.87,'#764438'],[1,'#513d36']])g.addColorStop(u,col);
      c.fillStyle=g;c.fillRect(0,0,W,H);
      // Parallel sanding marks, wet oxide runs, patchy old antifouling, then small chips through the finish.
      for(let j=0;j<700;j++){
        const x=rand()*W,y=10+rand()*228,drip=rand();
        c.fillStyle=drip>.55?'rgba(37,28,17,.055)':'rgba(197,182,135,.06)';
        c.fillRect(x,y,rand()*1.7+.35,1+rand()*rand()*32);
      }
      for(let j=0;j<13500;j++){
        const x=rand()*W,y=rand()*H;
        c.fillStyle=rand()<.49?'rgba(255,248,210,.085)':'rgba(13,21,19,.10)';
        c.fillRect(x,y,rand()*2.4+.28,rand()*1.2+.22);
      }
      c.fillStyle='#d1d2b9';c.font='bold 22px Arial';c.textAlign='center';
      c.fillText('NORTH CAPE   06',W*.71,H*.318);c.font='bold 13px sans-serif';c.fillText('北 岬   06',W*.25,H*.298);
      c.font='bold 8px Arial';c.fillText('PILOT  /  06',W*.25,H*.347);
      for(let j=0;j<440;j++){
        const x=rand()*W,y=rand()*H*.67,span=rand()*rand()*8+.5;
        c.fillStyle=rand()>.57?'rgba(91,63,44,.49)':'rgba(102,113,100,.45)';c.fillRect(x,y,span,rand()*1.25+.35);
      }
      for(let j=0;j<9;j++){
        const x=40+j*120; c.fillStyle='rgba(22,36,33,.18)';c.fillRect(x,7,1.3,224);
        c.fillStyle='rgba(224,211,175,.15)';c.fillRect(x+1.4,11,.8,211);
      }
    });
    const hullMaterial=metallic(.46,.34,{map:paintA,side:T.DoubleSide});
    const paintNorm=canvas(256,128,(c,W,H)=>{
      c.fillStyle='#858585';c.fillRect(0,0,W,H);
      for(let i=0;i<3400;i++){let g=109+rand()*47;c.fillStyle='rgb('+g+','+g+','+g+')';c.fillRect(rand()*W,rand()*H,1+rand()*2,1);}
      for(let j=0;j<7;j++){c.fillStyle='#9c9c9c';c.fillRect(j*39+6,0,1,H);}
    });paintNorm.colorSpace=T.NoColorSpace;hullMaterial.bumpMap=paintNorm;hullMaterial.bumpScale=.009;
    let water;
    scene.traverse(m=>{if(m.name==='潮汐海面'&&m.material?.uniforms?.uTime)water=m;});
    if(water){
      hullMaterial.onBeforeCompile=shader=>{
        shader.uniforms.pilotSeaT=water.material.uniforms.uTime;
        shader.uniforms.pilotSeaDatum={get value(){return water.position.y;}};
        shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 pilotShell;')
          .replace('#include <worldpos_vertex>','#include <worldpos_vertex>\npilotShell=(modelMatrix*vec4(transformed,1.)).xyz;');
        shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 pilotShell;uniform float pilotSeaT,pilotSeaDatum;')
          .replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>
            float t=pilotSeaT;vec2 p=pilotShell.xz;
            p.x-=.18*cos(dot(p,vec2(.23,.11))+t*1.12);
            float h=.46*sin(dot(p,vec2(.23,.11))+t*1.12)+.34*sin(dot(p,vec2(-.17,.29))-t*.88)
              +.18*sin(dot(p,vec2(.49,-.41))+t*1.42)+.09*sin(dot(p,vec2(.81,.62))-t*1.64);
            float rel=pilotShell.y-pilotSeaDatum-h;
            float wet=1.-smoothstep(.02,.39,rel);
            roughnessFactor=mix(roughnessFactor,.20,wet*.84);
            diffuseColor.rgb*=mix(vec3(1.),vec3(.66,.75,.74),wet*.74);`);
      };
    }
    let scanned=null;scene.traverse(m=>{if(!scanned&&m.name==='Salt-weathered hardwood course'&&m.material?.map)scanned=m.material;});
    const woodMap=scanned?.map||canvas(384,256,(c,W,H)=>{
      c.fillStyle='#aa8d63';c.fillRect(0,0,W,H);
      for(let i=0;i<900;i++){const x=rand()*W,y=rand()*H;c.strokeStyle=rand()>.4?'rgba(53,41,27,.21)':'rgba(222,211,168,.29)';c.lineWidth=rand()*1.5;
        c.beginPath();c.moveTo(x,y);c.bezierCurveTo(x+23,y+2.4,x+68,y-2,x+90*rand()+13,y);c.stroke();}
    });if(!scanned)woodMap.wrapS=woodMap.wrapT=T.RepeatWrapping;
    const wood=metallic(.59,.03,{map:woodMap,normalMap:scanned?.normalMap||null,roughnessMap:scanned?.roughnessMap||null});
    if(wood.normalMap)wood.normalScale.set(.43,.43);
    const plateMap=canvas(512,256,(c,W,H)=>{
      c.fillStyle='#c5c7ac';c.fillRect(0,0,W,H);c.strokeStyle='#48615e';c.lineWidth=5;c.strokeRect(5,5,W-10,H-10);
      c.textAlign='center';c.fillStyle='#294b4d';c.font='bold 104px sans-serif';c.fillText('北岬 06',W*.5,135);
      c.font='bold 35px Arial';c.fillText('NORTH CAPE  /  PILOT',W*.5,202);
      for(let i=0;i<800;i++){c.fillStyle=rand()>.49?'rgba(35,41,34,.12)':'rgba(221,215,186,.26)';c.fillRect(rand()*W,rand()*H,.4+rand()*3,rand()*2);}
    });
    const sign=metallic(.50,.23,{map:plateMap});
    // The boat uses a single draw for each surface type, including all the fastenings and cord.
    const hullBuckets=new Map(),shoreBuckets=new Map(),wheelBuckets=new Map(),throttleBuckets=new Map(),templates=new Map();
    let buckets=hullBuckets;
    const base=(key,make)=>{let g=templates.get(key);if(!g){g=make();templates.set(key,g);}return g;};
    const cube=base('box',()=>new T.BoxGeometry()), ball=base('ball',()=>new T.SphereGeometry(1,14,8));
    function bucket(mat){if(!buckets.has(mat))buckets.set(mat,{pos:[],norm:[],uv:[],col:[],idx:[]});return buckets.get(mat);}
    function primitive(g,mat,tint,x,y,z,sx,sy,sz,rot=[0,0,0]){
      const out=bucket(mat),start=out.pos.length/3,p=g.attributes.position,n=g.attributes.normal,u=g.attributes.uv;C.set(tint);
      if(rot.isQuaternion)Q.copy(rot);else Q.setFromEuler(E.set(...rot));
      M.compose(v(x,y,z),Q,v(sx,sy,sz));H.getNormalMatrix(M);
      for(let i=0;i<p.count;i++){
        X.fromBufferAttribute(p,i).applyMatrix4(M);N.fromBufferAttribute(n,i).applyMatrix3(H).normalize();
        out.pos.push(X.x,X.y,X.z);out.norm.push(N.x,N.y,N.z);out.uv.push(u?u.getX(i):0,u?u.getY(i):0);out.col.push(C.r,C.g,C.b);
      }
      if(g.index)for(const k of g.index.array)out.idx.push(start+k);else for(let i=0;i<p.count;i++)out.idx.push(start+i);
    }
    function box(mat,tint,x,y,z,w,h,d,rot){primitive(cube,mat,tint,x,y,z,w,h,d,rot);}
    function sphere(mat,tint,x,y,z,rx,ry,rz,rot){primitive(ball,mat,tint,x,y,z,rx,ry,rz,rot);}
    function rod(mat,tint,pt,end,radius,sides=9,radius2=radius){
      const A=v(...pt),B=v(...end),dir=B.clone().sub(A),len=dir.length();if(len<.00001)return;
      const g=base('tube'+sides+':'+radius2/radius,()=>new T.CylinderGeometry(radius2/radius,1,1,sides));
      primitive(g,mat,tint,(A.x+B.x)/2,(A.y+B.y)/2,(A.z+B.z)/2,radius,len,radius,new T.Quaternion().setFromUnitVectors(unit,dir.divideScalar(len)));
    }
    function line(mat,tint,points,rad,segments=14,sides=7){
      const curve=new T.CatmullRomCurve3(points.map(p=>v(...p)),false,'centripetal');
      const geo=new T.TubeGeometry(curve,segments,rad,sides,false);primitive(geo,mat,tint,0,0,0,1,1,1);geo.dispose();return curve;
    }
    function face(mat,col,points,coords,orientation){
      const out=bucket(mat),start=out.pos.length/3,arr=points.map(p=>v(...p));C.set(col);
      let d=arr[1].clone().sub(arr[0]).cross(arr[2].clone().sub(arr[0])).normalize();
      const reverse=d.dot(v(...orientation))<0;if(reverse)d.multiplyScalar(-1);
      for(let i=0;i<points.length;i++){out.pos.push(...points[i]);out.norm.push(d.x,d.y,d.z);out.col.push(C.r,C.g,C.b);out.uv.push(...coords[i]);}
      for(let i=1;i<points.length-1;i++)if(reverse)out.idx.push(start,start+i+1,start+i);else out.idx.push(start,start+i,start+i+1);
    }
    const brass='#b39965',galv='#a4b2a8',steel='#667874',gun='#414e4d',pale='#b9c4ac',
      ivory='#ccd0b6',red='#975546',yellow='#d8ad4e',black='#26302f',green='#456c65';
    const stations=[[stern,1.25,.16],[stern+.22,1.50,.12],[a-.41,beam+.11,.045],[a,beam+.18,0],
      [splitA,beam+.23,0],[splitF,beam+.23,0],[f-.77,beam+.21,.035],[f,beam+.15,.085],
      [f+.4,beam-.06,.13],[f+.9,beam-.48,.23],[f+1.36,.74,.37],[stem-.15,.22,.50],[stem,.035,.55]];
    function profile(x){
      let i=0;while(i+1<stations.length-1&&x>stations[i+1][0])i++;
      const l=stations[i],r=stations[i+1],t=Math.max(0,Math.min(1,(x-l[0])/(r[0]-l[0])));
      return {r:l[1]+(r[1]-l[1])*t,rise:l[2]+(r[2]-l[2])*t};
    }
    function sheer(x){
      const y= x<splitA?aft.y:x>splitF?fore.y:aft.y+(fore.y-aft.y)*(x-splitA)/(splitF-splitA);
      return y+profile(x).rise+.08;
    }
    const xList=[];
    for(let i=0;i<stations.length-1;i++){
      const lo=stations[i][0],hi=stations[i+1][0],n=Math.ceil((hi-lo)/.58);
      for(let j=0;j<n;j++)xList.push(lo+(hi-lo)*j/n);
    }xList.push(stem);
    const sections=xList.map(x=>{
      const {r,rise}=profile(x), top=sheer(x);
      const taper=Math.max(0,(x-f)/1.87), endLift=Math.max(0,(a-x)/1.33)*.24;
      return [[r,top],[r+.015,top-.16],[r*.92,centre-.78+rise*.38],[r*.75,centre-1.36+.35*taper+endLift],
        [r*.34,centre-1.91+.65*taper+endLift],[.022,centre-2.10+.84*taper+endLift]];
    });
    function hullUV(x,y,side){return [side>0?(x-stern)/length:1-(x-stern)/length,(y-(centre-2.13))/2.60];}
    for(const side of [-1,1]){
      for(let i=0;i<xList.length-1;i++){
        for(let j=0;j<sections[i].length-1;j++){
          const indices=[[i,j],[i+1,j],[i+1,j+1],[i,j+1]];
          const pts=indices.map(([ix,k])=>[xList[ix],sections[ix][k][1],cz+side*sections[ix][k][0]]);
          face(hullMaterial,white,pts,pts.map(p=>hullUV(p[0],p[1],side)),[0,-j*.19,side]);
        }
        const x=xList[i],xx=xList[i+1],A=sections[i][0],B=sections[i+1][0];
        const tint=i%5===0?'#343d39':'#303a36';
        rod(rubber,tint,[x,A[1]-.107,cz+side*(A[0]+.006)],[xx,B[1]-.107,cz+side*(B[0]+.006)],.082,10);
        rod(hardware,galv,[x,A[1]-.175,cz+side*(A[0]+.007)],[xx,B[1]-.175,cz+side*(B[0]+.007)],.017,7);
        rod(enamel,pale,[x,A[1]+.004,cz+side*(A[0]-.02)],[xx,B[1]+.004,cz+side*(B[0]-.02)],.040,8);
        const innerA=Math.min(beam-.065,A[0]*.94),innerB=Math.min(beam-.065,B[0]*.94);
        const pts=[[x,A[1],cz+side*A[0]],[xx,B[1],cz+side*B[0]],[xx,B[1],cz+side*innerB],[x,A[1],cz+side*innerA]];
        face(enamel,pale,pts,[[0,0],[1,0],[1,1],[0,1]],[0,1,0]);
      }
    }
    for(const ix of [0,xList.length-1]){
      const x=xList[ix],side=ix?1:-1,S=sections[ix];
      const pts=[...S.map(([r,y])=>[x,y,cz+r]),...S.slice().reverse().map(([r,y])=>[x,y,cz-r])];
      face(hullMaterial,'#acb4a5',pts,pts.map(p=>[.36+(p[2]-cz)*.027,(p[1]-(centre-2.13))/2.60]),[side,0,0]);
    }
    function flat(mat,col,x0,x1,y,z0,z1,uv=[[0,0],[1,0],[1,1],[0,1]]){
      face(mat,col,[[x0,y,z0],[x1,y,z0],[x1,y,z1],[x0,y,z1]],uv,[0,1,0]);
    }
    function timber(d){
      box(enamel,black,d.x,d.y-.072,d.z,d.w,.136,d.d);
      const count=Math.ceil(d.d/.143), dz=d.d/count;
      const boards=[.060,.168,.280,.393,.504,.616,.728,.841,.951];
      for(let i=0;i<count;i++){
        const z=d.z-d.d/2+dz*i,offset=rand(),boardIndex=Math.floor(rand()*8),startU=boards[boardIndex]+.006,endU=boards[boardIndex+1]-.006;
        // UV runs with the plank. Each pitch has a narrow caulk joint and staggered scarf joint.
        const x0=d.x-d.w/2+.014,x1=d.x+d.w/2-.014, joint=x0+.65+(i*.71)%(d.w-1.1);
        for(const [l,r] of [[x0,joint-.004],[joint+.004,x1]]){
          const uu=(r-l)*.49;
          const color=new T.Color().setRGB(.78+rand()*.14,.80+rand()*.10,.73+rand()*.1);
          const uv=scanned?[[startU,offset],[startU,offset+uu],[endU,offset+uu],[endU,offset]]
            :[[offset,.10],[offset+uu,.10],[offset+uu,.80],[offset,.80]];
          flat(wood,color,l,r,d.y,z+.004,z+dz-.004,uv);
        }
      }
      // Two wide, low hatch leaves and their recessed folding handles stay flush with the working floor.
      const hx=d.x+d.w*.18,hz=cz+.43,hw=Math.min(d.w*.47,1.26),hd=.82;
      for(const s of [-1,1]){
        box(hardware,gun,hx+hw*s/2,d.y+.006,hz,.020,.012,hd+.02);
        box(hardware,gun,hx,d.y+.006,hz+hd*s/2,hw,.012,.022);
        box(hardware,steel,hx+s*hw*.34,d.y+.010,hz+.28,.108,.014,.062);
        box(rubber,black,hx+s*hw*.34,d.y+.019,hz+.28,.074,.007,.029);
        for(const z of [hz-.34,hz+.34])rod(hardware,galv,[hx+hw*s*.5,d.y+.011,z],[hx+hw*s*.5,d.y+.017,z],.013,6);
      }
      // Worn ochre at the gunwale marks the gap in the lifelines on the shore side.
      const stripZ=cz-d.d*.5+.10;
      for(const side of [-1,1]){
        const x=d.x+side*.525;
        flat(enamel,yellow,x-.074,x+.074,d.y+.009,stripZ-.075,stripZ+.19);
      }
    }
    timber(aft);timber(fore);
    const cross=w.boatLink?atRest(w.boatLink):{x:-1,y:-2.67,z:cz,w:1.02,d:2.20};
    flat(enamel,'#455b57',cross.x-cross.w*.5,cross.x+cross.w*.5,cross.y,cross.z-cross.d*.5,cross.z+cross.d*.5);
    for(const side of [-1,1]){
      const z=cz+side*(beam-.28);
      box(rubber,black,(splitA+splitF)/2,centre-.29,z,splitF-splitA+.08,.14,.55);
      for(let j=0;j<5;j++)box(hardware,steel,splitA+.03+j*(splitF-splitA-.06)/4,centre-.195,z,.024,.048,.46);
    }
    // The bridge is small enough for an actual pressed tread pattern to read at the players' feet.
    for(let i=0;i<8;i++)for(let j=0;j<16;j++){
      box(hardware,i%3===1?'#858a76':'#667c72',cross.x+(i-3.5)*.116,cross.y+.002,cross.z+(j-7.5)*.133,.078,.010,.019,[0,(i+j)%2?.65:-.65,0]);
    }
    // Raised enclosed compartments fit outside the two collision rectangles.
    function peak(lo,hi){
      const xs=[lo,...xList.filter(x=>x>lo&&x<hi),hi];
      for(let k=0;k<xs.length-1;k++){
        const x=xs[k],xx=xs[k+1],A=profile(x),B=profile(xx),y=sheer(x)+.018,yy=sheer(xx)+.018;
        const pts=[[x,y,cz-A.r+.034],[xx,yy,cz-B.r+.034],[xx,yy,cz+B.r-.034],[x,y,cz+A.r-.034]];
        face(enamel,ivory,pts,pts.map(p=>[p[0]*.53,p[2]*.53]),[0,1,0]);
      }
    }
    peak(stern,a);peak(f,stem);
    for(const x of [a-.10,f+.12]){
      const h=sheer(x)+.07;
      box(enamel,green,x,h,cz,.14,.16,beam*1.72);
      rod(hardware,galv,[x,h+.08,cz-1.48],[x,h+.08,cz+1.48],.023,9);
    }
    function handrail(xs,side,height){
      const pts=[],zFor=x=>cz+side*(profile(x).r-.083),end=xs.length-1;
      for(let i=0;i<xs.length;i++){
        const x=xs[i],z=zFor(x),y=sheer(x),h=height*(i===0||i===end?.69:1);
        box(enamel,green,x,y+.011,z,.146,.032,.108);
        rod(hardware,galv,[x,y+.024,z],[x,y+h-.08,z],.024,10);
        for(const zz of [-.032,.032])rod(hardware,gun,[x-.037,y+.025,z+zz],[x-.037,y+.031,z+zz],.010,6);
        if(i===0)pts.push([x,y+h-.085,z]);
        pts.push([x+(i===0?.065:i===end?-.065:0),y+h,z]);
        if(i===end)pts.push([x,y+h-.085,z]);
      }
      line(hardware,'#acb8aa',pts,.028,Math.max(9,xs.length*5),10);
      if(xs.length>2)line(hardware,steel,xs.map(x=>[x,sheer(x)+height*.47,zFor(x)]),.015,xs.length*3,7);
    }
    handrail([stern+.15,a-.61,a+.28],-1,.57);
    handrail([splitA-.15,(splitA+splitF)*.5,splitF+.32],-1,.45);
    handrail([f-.36,f+.46,f+1.09,stem-.10],-1,.50);
    // The sea-side rail is interrupted opposite each camera so neither player has to look through a fence.
    handrail([stern+.17,a-.43,a+.08],1,.52);
    handrail([splitA-.24,splitF+.18],1,.38);
    handrail([f-.18,f+.52,f+1.16,stem-.10],1,.49);
    function cleat(x,y,z,scale=1){
      box(enamel,gun,x,y+.015,z,.27*scale,.03,.155*scale);
      for(const dx of [-.06,.06])rod(hardware,brass,[x+dx*scale,y+.016,z],[x+dx*scale,y+.105*scale,z],.034*scale,10);
      line(hardware,galv,[[x-.21*scale,y+.137*scale,z],[x-.15*scale,y+.105*scale,z],[x,y+.104*scale,z],[x+.15*scale,y+.106*scale,z],[x+.21*scale,y+.137*scale,z]],.033*scale,14,9);
    }
    for(const x of [a-.53,f+.62])for(const side of [-1,1])cleat(x,sheer(x)+.024,cz+side*(profile(x).r-.20),.96);
    // Pneumatic fenders with two fluted shoulders, end eyes, a valve and a separate short pendant.
    function fender(x,side,ang){
      const z=cz+side*(profile(x).r+.101),y=sheer(x)-.50;
      const loc=(dy,dx=0,offset=0)=>[x+dx+dy*Math.sin(ang),y+dy*Math.cos(ang),z+side*offset];
      rod(rubber,'#445351',loc(-.255),loc(.255),.116,16);
      for(const s of [-1,1]){
        sphere(rubber,'#3c4946',...loc(s*.24),.116,.121,.116,[0,0,-ang]);
        for(let j=0;j<3;j++)rod(rubber,'#4d5953',loc(s*(.158+j*.028)),loc(s*(.177+j*.028)),.120,16);
        sphere(rubber,'#2c3c3e',...loc(s*.348),.049,.079,.056,[0,0,-ang]);
      }
      line(cord,'#a49368',[loc(.361),[x-.055,sheer(x)-.026,cz+side*(profile(x).r+.043)],[x-.103,sheer(x)+.039,cz+side*(profile(x).r-.11)]],.015,9,6);
      sphere(hardware,brass,...loc(.263,.035,.098),.015,.015,.009);
    }
    for(const [x,s,ang] of [[a+.4,1,.19],[splitA+.04,1,-.11],[f-.23,1,.13],[a+.32,-1,.10],[splitF-.05,-1,-.26],[f+.41,-1,.22]])fender(x,s,ang);
    // The two standing parts bend between a fairlead on the launch and a
    // permanently bedded shore cleat. Only short eyes and hitches are rigid.
    const springs=[];
    const pitch=.17,mooringRadius=.025;
    function arcLength(horizontal,rise,dip){
      if(dip<.00001)return Math.hypot(horizontal,rise);
      const h=Math.max(.00001,horizontal),bend=4*dip;
      const primitive=q=>(q*Math.hypot(h,q)+h*h*Math.asinh(q/h))*.5;
      return (primitive(rise+bend)-primitive(rise-bend))/(2*bend);
    }
    function warp(x,site,farSide){
      if(!site)return;
      const d=atRest(site),z=cz-profile(x).r+.18,y=sheer(x)+.13;
      const end=v(d.x+farSide*(d.w*.5-.105),d.y+.145,d.z+(farSide<0?.54:-.22));
      const boatEye=v(x-.19,y-.046,z-.20);
      // A crossing turn takes the load round the horns before the rope passes
      // the polished gunwale. The shore eye stays around its own, bolted cleat.
      if(farSide>0)line(cord,'#a39673',[[x+.19,y+.017,z-.008],[x+.132,y+.037,z+.045],[x+.036,y+.015,z+.048],
        [x-.14,y+.012,z-.035],[x-.17,y+.057,z+.007],[x-.111,y+.043,z+.045],
        [x+.085,y+.010,z-.046],[x+.146,y+.028,z+.007],[x+.077,y+.047,z+.043],
        [x-.100,y+.020,z],boatEye.toArray()],.024,34,8);
      box(enamel,gun,x-.18,y-.117,z-.157,.28,.028,.114);
      for(const s of [-1,1]){
        line(hardware,galv,[[x-.18+s*.095,y-.104,z-.15],[x-.18+s*.092,y-.035,z-.158],
          [x-.18+s*.064,y-.009,z-.170]],.012,7,7);
      }
      buckets=shoreBuckets;
      cleat(end.x,d.y,end.z,.90);
      if(farSide>0)line(cord,'#ada181',[end.toArray(),[end.x+.086,d.y+.102,end.z+.049],
        [end.x+.158,d.y+.101,end.z+.032],[end.x+.173,d.y+.111,end.z-.024],
        [end.x+.093,d.y+.088,end.z-.047],[end.x-.104,d.y+.102,end.z+.048],
        [end.x-.158,d.y+.103,end.z+.027],[end.x-.137,d.y+.112,end.z-.028],
        [end.x-.045,d.y+.096,end.z-.043],[end.x+.024,d.y+.122,end.z-.005]],.020,29,7);
      buckets=hullBuckets;
      const h=Math.hypot(end.x-boatEye.x,end.z-boatEye.z);
      const length=arcLength(h,end.y-boatEye.y,.38);
      if(farSide>0)springs.push({boatEye,end,length,segments:Math.max(12,Math.min(36,Math.round(length/pitch)))});
    }
    warp(a-.52,w.lower,-1);warp(f+.63,w.shelf,1);

    // One repeat of a laid line. Instances let a surface marker on a moving
    // rope follow the strand, just as a marker on the deck follows its hull.
    const braidBuckets=new Map();
    buckets=braidBuckets;
    rod(cord,'#8d876a',[0,0,0],[0,pitch,0],mooringRadius*.91,9);
    for(let ply=0;ply<3;ply++){
      const points=[];
      for(let j=0;j<=14;j++){
        const t=j/14,angle=TAU*(t+ply/3);
        points.push([.0187*Math.cos(angle),pitch*t,.0187*Math.sin(angle)]);
      }
      line(cord,['#b4a981','#9b9370','#78765d'][ply],points,.0078,12,5);
    }
    buckets=hullBuckets;
    // Coiled heaving line, bent steel eyes and bow fairlead, outside the players' landing area.
    const bx=f+.65,by=sheer(bx)+.047;
    const coil=[];for(let j=0;j<=115;j++){const t=j/115,r=.083+.215*t,an=t*TAU*5.0;coil.push([bx+r*Math.cos(an),by+.014+.002*Math.sin(an*3),cz+.44+r*.79*Math.sin(an)]);}
    line(cord,'#c2ad76',coil,.018,125,7);
    line(cord,'#af9d69',[coil[coil.length-1],[bx+.35,by+.02,cz+.48],[bx+.42,by+.029,cz+.42],[bx+.62,by+.083,cz+.35]],.017,14,7);
    // Hinged anchor locker and a rounded non-slip soleplate follow the rise of the foredeck.
    const lockerX=f+.79,lockerZ=cz-.35, lockerY=sheer(lockerX)+.043, deckSlope=.20;
    const lockerPoints=[[lockerX-.37,lockerZ-.32],[lockerX+.37,lockerZ-.32],[lockerX+.43,lockerZ-.25],
      [lockerX+.43,lockerZ+.22],[lockerX+.35,lockerZ+.30],[lockerX-.38,lockerZ+.30],[lockerX-.44,lockerZ+.20],[lockerX-.44,lockerZ-.25]];
    const outline=lockerPoints.map(([x,z])=>[x,lockerY+(x-lockerX)*deckSlope,z]);
    face(enamel,'#8c9c8c',outline,outline.map(p=>[p[0]*2,p[2]*2]),[0,1,0]);
    for(let i=0;i<outline.length;i++)rod(rubber,gun,outline[i],outline[(i+1)%outline.length],.009,6);
    for(const x of [lockerX-.24,lockerX+.23]){
      const y=lockerY+(x-lockerX)*deckSlope;
      box(hardware,galv,x,y+.011,lockerZ-.30,.095,.020,.084,[0,0,deckSlope]);
      rod(hardware,steel,[x-.055,y+.019,lockerZ-.30],[x+.055,y+.019,lockerZ-.30],.018,8);
      for(const z of [lockerZ-.21,lockerZ-.10,lockerZ+.01,lockerZ+.12])box(enamel,'#687d73',x,y+.007,z,.21,.010,.022,[0,0,deckSlope]);
    }
    const ax=stem-.43;rod(hardware,gun,[ax,sheer(ax)+.07,cz-.26],[ax,sheer(ax)+.07,cz+.26],.054,12);
    for(const side of [-1,1])box(hardware,galv,ax,sheer(ax)+.079,cz+side*.25,.19,.131,.04);
    // Low side-console, a sloped windscreen, open instrument binnacle and rubber-rimmed wheel.
    const hx=a-.36,hy=sheer(a-.49)+.153,hz=cz-.14;
    box(enamel,green,hx+.075,hy+.22,hz,.444,.71,1.27);
    box(enamel,ivory,hx-.025,hy+.67,hz,.77,.22,1.35,[0,0,-.085]);
    const seatX=stern+.22,seatY=sheer(seatX)+.31;
    rod(hardware,galv,[seatX,sheer(seatX)+.03,hz],[seatX,seatY,hz],.049,11);
    box(enamel,gun,seatX,seatY+.026,hz,.33,.065,.58);
    const cushion=base('cushion',()=>new T.SphereGeometry(1,16,8));
    primitive(cushion,rubber,'#684c3b',seatX,seatY+.079,hz,.24,.087,.39);
    for(const side of [-1,1])rod(hardware,galv,[seatX-.13,seatY+.02,hz+side*.24],[seatX-.206,seatY+.41,hz+side*.26],.017,8);
    primitive(cushion,rubber,'#5d473c',seatX-.206,seatY+.35,hz,.052,.11,.32,[0,0,.14]);
    for(const side of [-1,1]){
      const z=hz+side*.68;
      face(enamel,pale,[[hx-.34,hy+.73,z],[hx+.37,hy+.78,z],[hx+.35,hy+.92,z],[hx-.32,hy+.80,z]],[[0,0],[1,0],[1,1],[0,1]],[0,0,side]);
      for(const yy of [.20,.40])box(hardware,gun,hx,hy+yy,z+side*.008,.35,.026,.026);
    }
    const front=hx+.30,topX=front-.17,glassTop=hy+1.34,glassBase=hy+.82;
    const glassPts=[[front,glassBase,hz-.67],[front,glassBase,hz+.67],[topX,glassTop,hz+.59],[topX,glassTop,hz-.59]];
    face(pane,'#8cb3ac',glassPts,[[0,0],[1,0],[1,1],[0,1]],[1,.1,0]);
    for(let i=0;i<4;i++)rod(hardware,galv,glassPts[i],glassPts[(i+1)%4],.024,10);
    rod(hardware,steel,[front,glassBase,hz],[topX,glassTop,hz],.017,8);
    for(const side of [-1,1]){
      const p0=[front,glassBase,hz+side*.67],p1=[topX,glassTop,hz+side*.59],p2=[hx-.30,hy+.88,hz+side*.66];
      face(pane,'#729e98',[p0,p1,p2],[[0,0],[.2,1],[1,0]],[0,0,side]);
      rod(hardware,galv,p2,p1,.018,9);rod(hardware,galv,p2,p0,.020,9);
    }
    const wheelX=hx-.53,wy=hy+.77,wz=hz-.18,rad=.177;
    const torus=base('wheel',()=>new T.TorusGeometry(1,.10,8,32));
    buckets=wheelBuckets;
    primitive(torus,rubber,black,wheelX,wy,wz,rad,rad,rad,[0,Math.PI/2,0]);
    for(let i=0;i<3;i++){const q=TAU*i/3;rod(hardware,galv,[wheelX+.048,wy,wz],[wheelX,wy+Math.sin(q)*rad,wz+Math.cos(q)*rad],.012,7);}
    buckets=hullBuckets;
    rod(hardware,gun,[wheelX-.025,wy,wz],[hx-.30,wy,wz],.043,12);
    // Recessed dials with hand-painted needles and a short throttle quadrant.
    for(let i=0;i<3;i++){
      const z=hz-.45+i*.22,x=hx-.392,y=hy+.72,rr=i===1?.078:.063;
      rod(hardware,galv,[x+.012,y,z],[x-.016,y,z],rr,16);rod(rubber,black,[x-.018,y,z],[x-.022,y,z],rr*.83,16);
      for(let j=0;j<6;j++){const q=-1.98+j*.78;rod(enamel,pale,[x-.026,y+rr*.59*Math.sin(q),z+rr*.59*Math.cos(q)],[x-.026,y+rr*.77*Math.sin(q),z+rr*.77*Math.cos(q)],.003,5);}
      rod(enamel,yellow,[x-.029,y,z],[x-.029,y+rr*.48,z+rr*.16],.004,5);
    }
    buckets=throttleBuckets;
    rod(hardware,galv,[hx-.413,hy+.705,hz+.358],[hx-.483,hy+.902,hz+.358],.018,9);
    sphere(rubber,black,hx-.483,hy+.905,hz+.358,.042,.041,.041);
    buckets=hullBuckets;
    box(enamel,green,hx-.29,hy+.66,hz+.36,.35,.09,.17);
    for(const [x,z] of [[-5.556,16.45],[-5.514,16.85]]){
      box(hardware,gun,x+.018,-2.5035,z,.30,.035,.15);
      for(let j=0;j<7;j++)box(rubber,black,x-.096+j*.038,-2.486,z,.016,.007,.128);
      rod(hardware,galv,[x-.06,-2.52,z],[x-.06,-2.64,z],.022,8);
    }
    // Both navigation lamps have opaque side shields and a small protected Fresnel lens.
    for(const side of [-1,1]){
      const x=hx+.16,z=hz+side*.713,y=hy+.83;
      box(enamel,gun,x,y,z,.19,.09,.065);
      for(const h of [-.038,.039])box(hardware,steel,x,y+h,z+side*.032,.205,.014,.075);
      sphere(lamps,side===-1?'#ee6752':'#67d3a0',x+.027,y,z+side*.040,.063,.029,.023);
      box(enamel,gun,x-.064,y,z+side*.045,.023,.078,.069);
    }
    const px=hx-.05,pz=hz+.649,py=hy+.40;
    face(sign,white,[[px-.28,py-.13,pz],[px+.28,py-.13,pz],[px+.28,py+.13,pz],[px-.28,py+.13,pz]],[[0,0],[1,0],[1,1],[0,1]],[0,0,1]);
    for(const x of [px-.24,px+.24])for(const y of [py-.095,py+.095])sphere(hardware,galv,x,y,pz+.004,.013,.013,.007);
    // Two recessed black gaskets and an aft-facing service hatch give the transom a scale cue from shore.
    for(const side of [-1,1]){
      const z=cz+side*.62,yy=centre-.67;
      sphere(rubber,black,stern-.024,yy,z,.025,.097,.15);
      sphere(hardware,galv,stern-.039,yy+.008,z,.021,.062,.102);
      for(let j=0;j<4;j++)box(rubber,black,stern-.058,yy-.032+j*.022,z,.012,.009,.145);
    }
    function geometry(b){
      const g=owned(new T.BufferGeometry());
      for(const [key,values,n] of [['position',b.pos,3],['normal',b.norm,3],['uv',b.uv,2],['color',b.col,3]])
        g.setAttribute(key,new T.Float32BufferAttribute(values,n));
      g.setIndex(b.idx);g.computeBoundingSphere();g.computeBoundingBox();return g;
    }
    const helmWheel=new T.Group(),throttleLever=new T.Group();
    helmWheel.position.set(wheelX,wy,wz);throttleLever.position.set(hx-.413,hy+.705,hz+.358);
    root.add(helmWheel,throttleLever);
    let triangles=0;
    for(const [set,owner] of [[hullBuckets,root],[shoreBuckets,quay],[wheelBuckets,helmWheel],[throttleBuckets,throttleLever]]){
      for(const [mat,b] of set){
        const geo=geometry(b);
        if(owner===helmWheel||owner===throttleLever)geo.translate(-owner.position.x,-owner.position.y,-owner.position.z);
        const m=new T.Mesh(geo,mat);
        m.name=owner===quay?'码头固定系缆羊角':mat===wood?'交通艇橡木舱面':mat===hullMaterial?'交通艇折角船壳':'交通艇舾装';
        m.castShadow=mat!==pane&&mat!==lamps&&mat!==cord;m.receiveShadow=mat!==pane&&mat!==lamps;
        owner.add(m);triangles+=b.idx.length/3;
      }
      set.clear();
    }
    const segments=springs.reduce((n,s)=>n+s.segments,0),braid=braidBuckets.get(cord);
    let moorings=null;
    if(segments){
      moorings=new T.InstancedMesh(geometry(braid),cord,segments);
      moorings.name='北岬 06 · 活动系缆';
      moorings.instanceMatrix.setUsage(T.DynamicDrawUsage);moorings.receiveShadow=true;
      moorings.boundingBox=new T.Box3();moorings.boundingSphere=new T.Sphere();
      quay.add(moorings);triangles+=segments*braid.idx.length/3;
    }
    braidBuckets.clear();
    for(const g of templates.values())g.dispose();templates.clear();
    root.userData.stats={draws:root.children.length+quay.children.length,triangles,wood:scanned?'shared pier scan':'generated grain'};
    const grip=v(0,0,0),chord=v(0,0,0),first=v(0,0,0),last=v(0,0,0);
    const side=v(0,0,0),along=v(0,0,0),back=v(0,0,0),frame=new T.Matrix4();
    function bend(spring,start){
      const h=Math.hypot(spring.end.x-start.x,spring.end.z-start.z),dy=spring.end.y-start.y;
      if(Math.hypot(h,dy)>=spring.length)return .012;
      let lo=.012,hi=Math.max(.40,spring.length*.54);
      for(let k=0;k<12;k++){
        const mid=(lo+hi)*.5;
        if(arcLength(h,dy,mid)<spring.length)lo=mid;else hi=mid;
      }
      return (lo+hi)*.5;
    }
    function updateLines(){
      if(!moorings)return;
      const bounds=moorings.boundingBox;bounds.makeEmpty();
      let index=0;
      for(const spring of springs){
        // The hull vertices and the two shore fittings share the scene's local
        // coordinate system; the hull matrix is their exact relative transform.
        grip.copy(spring.boatEye).applyMatrix4(root.matrix);
        const dip=bend(spring,grip);
        first.copy(grip);chord.subVectors(spring.end,grip);
        side.set(-chord.z,0,chord.x);
        if(side.lengthSq()<.000001)side.set(1,0,0);else side.normalize();
        bounds.expandByPoint(first);
        for(let j=1;j<=spring.segments;j++){
          const t=j/spring.segments;
          last.copy(grip).addScaledVector(chord,t);last.y-=4*t*(1-t)*dip;
          along.subVectors(last,first);const span=along.length();along.divideScalar(span||1);
          back.crossVectors(side,along).normalize();
          frame.makeBasis(side,along.multiplyScalar(span/pitch),back);frame.setPosition(first);
          moorings.setMatrixAt(index++,frame);bounds.expandByPoint(last);first.copy(last);
        }
      }
      bounds.expandByScalar(mooringRadius+.006);bounds.getBoundingSphere(moorings.boundingSphere);
      moorings.instanceMatrix.needsUpdate=true;
    }
    let disposed=false,ready=false;
    const previous=new T.Matrix4();
    function update(pose=w.floatPose,arrival){
      if(disposed)return;
      helmWheel.rotation.x=(arrival?.rudder||0)*1.56;
      throttleLever.rotation.z=-(arrival?.drive||0)*.55;
      if(moorings)moorings.visible=!arrival||arrival.moored;
      if(pose){
        root.rotation.set(pose.pitch,pose.yaw,pose.roll,'YXZ');
        root.position.set(-pose.anchorX,-pose.anchorY,-pose.anchorZ).applyQuaternion(root.quaternion);
        root.position.x+=pose.x;root.position.y+=pose.y;root.position.z+=pose.z;
      }else{root.rotation.set(0,0,0,'YXZ');root.position.set(0,0,0);}
      root.updateMatrix();
      if(ready&&previous.equals(root.matrix))return;
      previous.copy(root.matrix);ready=true;if(moorings?.visible)updateLines();
      root.updateWorldMatrix(true,true);quay.updateWorldMatrix(true,true);
    }
    update();
    return {root,helmWheel,throttleLever,update,dispose(){
      if(disposed)return;disposed=true;scene.remove(root,quay);moorings?.dispose();
      for(const r of resources)r.dispose();resources.clear();root.clear();quay.clear();
    }};
  }
  window.TidePilotBoat={create};
})();
