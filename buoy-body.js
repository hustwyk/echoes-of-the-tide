// Riveted North Cape spar buoy. Metres above the unloaded water plane of the marker.
const TideBuoyBody=(()=>{
  const TAU=Math.PI*2, hullLow=-1.12, hullHigh=.515;
  function generator(seed){return ()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296);}
  const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v));
  function canvas(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return c;}
  function makeField(nx,ny,w,h,rand){
    const grid=Float32Array.from({length:nx*(ny+1)},rand),ix=new Uint16Array(w),wx=new Float32Array(w);
    for(let i=0;i<w;i++){const n=i*nx/w,f=n%1;ix[i]=Math.floor(n);wx[i]=f*f*(3-2*f);}
    let y0,y1,yw;
    return {row(y){const n=y*ny/h,f=n%1;y0=Math.floor(n)*nx;y1=y0+nx;yw=f*f*(3-2*f);},
      at(x){const a=ix[x],b=(a+1)%nx,wx0=wx[x],p=grid[y0+a]*(1-wx0)+grid[y0+b]*wx0;
        return p*(1-yw)+(grid[y1+a]*(1-wx0)+grid[y1+b]*wx0)*yw;}};
  }
  function hullMaps(){
    const w=1536,h=384,paint=canvas(w,h),surface=canvas(w,h),relief=canvas(w,h);
    const ctx=paint.getContext('2d'),rc=surface.getContext('2d'),bc=relief.getContext('2d');
    const cp=ctx.createImageData(w,h),rp=rc.createImageData(w,h),bp=bc.createImageData(w,h);
    const rnd=generator(6703),sets=[[23,8],[76,24],[218,80],[490,131]].map(([a,b])=>makeField(a,b,w,h,rnd));
    const datum=new Float32Array(w),drip=new Float32Array(w);
    for(let x=0;x<w;x++){const a=x/w*TAU;datum[x]=.054+.017*Math.sin(a*6+.5)+.012*Math.sin(a*13)+.0048*Math.sin(a*37);}
    for(let j=0;j<58;j++){const xx=Math.floor(rnd()*w),size=1+Math.floor(rnd()*4),v=.3+rnd()*.7;
      for(let d=-size;d<=size;d++){const x=(xx+d+w)%w;drip[x]=Math.max(drip[x],v*(1-Math.abs(d)/(size+1)));}}
    for(let y=0,i=0;y<h;y++){
      sets.forEach(f=>f.row(y));const height=hullHigh-y/h*(hullHigh-hullLow);
      for(let x=0;x<w;x++,i+=4){
        const a=sets[0].at(x),b=sets[1].at(x),c=sets[2].at(x),d=sets[3].at(x);
        const noise=rnd(),chip=.28*a+.35*b+.26*c+.11*d,brine=height-datum[x];
        const worn=clamp((chip-.54)*4.1),light=9*(c-.5)+7*(noise-.5),under=height<-.27;
        let red=42+49*a+18*worn,green=85+46*a+19*worn,blue=62+40*a+15*worn;
        let rough=178+32*chip,metal=50,emboss=122+13*(d-.5);
        const streak=drip[x]*clamp((.48-height)*4.4)*clamp((height+.03)*7.8)*(.60+.4*b);
        red+=13*streak;green-=19*streak;blue-=15*streak;
        // Abrasion on the shoulder and a narrow band in which immersion repeatedly dries.
        const lip=clamp((height-.39)*10)*.075,corrosion=chip+lip+streak*.069;
        const rust=clamp((corrosion-.623)*18.5);
        if(rust>0){const oxide=45+54*d+14*b;red+=(oxide+10-red)*rust;green+=(oxide*.74-green)*rust;
          blue+=(oxide*.52-blue)*rust;metal-=rust*20;rough+=rust*16;emboss-=rust*21;}
        if(brine<.039){
          const wet=clamp((.039-brine)*22),shell=clamp((.043-Math.abs(brine+.013))*19)*clamp((b+c*.62-.64)*3),
            leafy=clamp((.045-Math.abs(brine+.098))*14)*clamp((a+.52*c-.58)*2.5);
          red+=(36+24*b-red)*wet;green+=(47+21*c-green)*wet;blue+=(36+16*b-blue)*wet;rough-=wet*49;
          red+=shell*(70+35*noise)+leafy*21;green+=shell*(61+27*noise)+leafy*12;blue+=shell*(36+20*noise)-leafy*5;
          emboss+=shell*(41+34*d)+leafy*16;
        }
        if(under){const t=clamp((-height-.27)*4.0);red+=(54+40*b-red)*t;green+=(50+22*c-green)*t;blue+=(37+15*d-blue)*t;}
        cp.data[i]=red+light;cp.data[i+1]=green+light;cp.data[i+2]=blue+light;cp.data[i+3]=255;
        rp.data[i]=255;rp.data[i+1]=clamp(rough+noise*8,45,247);rp.data[i+2]=metal;rp.data[i+3]=255;
        bp.data[i]=bp.data[i+1]=bp.data[i+2]=emboss+noise*9;bp.data[i+3]=255;
      }
    }
    ctx.putImageData(cp,0,0);rc.putImageData(rp,0,0);bc.putImageData(bp,0,0);
    const H=y=>(hullHigh-y)*h/(hullHigh-hullLow);
    // Welds follow the plate strakes, with narrow rust tails below occasional tacks.
    for(let j=0;j<12;j++){
      const x=w*(j+.12)/12;
      ctx.strokeStyle='rgba(38,44,34,.55)';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(x,H(.468));ctx.lineTo(x,H(-.51));ctx.stroke();
      for(let k=0;k<135;k+=3){const yy=H(.46)+k;ctx.fillStyle='rgba(195,165,114,.48)';ctx.fillRect(x+.6,yy,1.8,2);}
    }
    // Re-lettered by stencil on four quadrants; abrasion breaks the paint along the plate.
    const chars=canvas(w,h),lc=chars.getContext('2d');lc.textAlign='center';lc.textBaseline='middle';
    lc.font='900 61px "Arial Black","PingFang SC",sans-serif';
    for(let j=0;j<=4;j++){const x=w*j/4+.006*w,yy=H(.280);lc.fillStyle='#dad3a6';lc.fillText('北岬 07',x,yy);
      lc.save();lc.globalCompositeOperation='destination-out';lc.globalAlpha=.85;
      lc.fillRect(x+23,yy-27,1.8,54);lc.fillRect(x+58,yy,22,1.8);lc.fillRect(x-29,yy-27,1,49);lc.restore();}
    lc.globalCompositeOperation='destination-out';
    for(let i=0;i<12000;i++){lc.fillStyle='rgba(0,0,0,'+(.12+.46*rnd())+')';lc.fillRect(rnd()*w,H(.435)+rnd()*83,.6+rnd()*2.2,.4+rnd()*1.4);}
    ctx.drawImage(chars,0,0);
    return {paint,surface,relief};
  }
  function metalMaps(){
    const w=384,h=384,diff=canvas(w,h),arm=canvas(w,h),bump=canvas(w,h);
    const dc=diff.getContext('2d'),ac=arm.getContext('2d'),bc=bump.getContext('2d');
    const p=dc.createImageData(w,h),m=ac.createImageData(w,h),v=bc.createImageData(w,h),rnd=generator(707);
    const sets=[[7,5],[29,20],[81,87]].map(([a,b])=>makeField(a,b,w,h,rnd));
    for(let y=0,i=0;y<h;y++){
      sets.forEach(f=>f.row(y));
      for(let x=0;x<w;x++,i+=4){
        const a=sets[0].at(x),b=sets[1].at(x),c=sets[2].at(x),n=rnd(),patch=.34*a+.37*b+.29*c;
        const chip=clamp((patch-.657)*16),primer=clamp((patch-.614)*16)-chip,grit=9*(n-.5);
        p.data[i]=61+46*a+primer*29+chip*(57+26*c)+grit;
        p.data[i+1]=99+50*a+primer*8-chip*(37+14*a)+grit;
        p.data[i+2]=73+35*a+primer*6-chip*55+grit;p.data[i+3]=255;
        m.data[i]=255;m.data[i+1]=150+34*b+chip*47;m.data[i+2]=42+16*b+primer*47;m.data[i+3]=255;
        v.data[i]=v.data[i+1]=v.data[i+2]=140+14*n+10*c-chip*29;v.data[i+3]=255;
      }
    }
    dc.putImageData(p,0,0);ac.putImageData(m,0,0);bc.putImageData(v,0,0);
    return {diff,arm,bump};
  }
  function signMap(){
    const w=512,h=272,c=canvas(w,h),g=c.getContext('2d'),rand=generator(149);
    g.fillStyle='#537c64';g.fillRect(0,0,w,h);
    for(let i=0;i<16000;i++){g.fillStyle=i%3?'rgba(213,213,170,.12)':'rgba(24,53,37,.15)';
      g.fillRect(rand()*w,rand()*h,1+rand()*7,1+rand()*3);}
    g.strokeStyle='#a9ae82';g.lineWidth=4;g.strokeRect(8,8,w-16,h-16);
    g.font='bold 234px "Arial Narrow","Helvetica Neue",Arial,sans-serif';g.fillStyle='#e5dfb7';g.textAlign='center';g.textBaseline='middle';g.save();g.translate(w*.5,h*.566);g.scale(w*.765/g.measureText('07').width,1);g.fillText('07',0,0);g.restore();
    g.fillStyle='#567860';g.fillRect(180,36,4,202);g.fillRect(292,91,83,2);
    for(let i=0;i<1900;i++){g.fillStyle=i%2?'rgba(42,67,48,.36)':'rgba(109,91,57,.35)';
      g.fillRect(rand()*w,rand()*h,1+rand()*4,.7+rand()*1.2);}
    return c;
  }
  function create(parent){
    const T=THREE,root=new T.Group();root.name='North Cape 07 / riveted buoy hull';parent.add(root);
    const owned=new Set(),own=o=>(owned.add(o),o);
    function tx(c,color,tile=false){
      const t=own(new T.CanvasTexture(c));if(color){if('colorSpace'in t&&T.SRGBColorSpace)t.colorSpace=T.SRGBColorSpace;
        else if(T.sRGBEncoding)t.encoding=T.sRGBEncoding;}
      t.anisotropy=4;t.wrapS=T.RepeatWrapping;if(tile)t.wrapT=T.RepeatWrapping;return t;
    }
    const hm=hullMaps(),mm=metalMaps(),hArm=tx(hm.surface,false),mArm=tx(mm.arm,false,true);
    const green=own(new T.MeshStandardMaterial({map:tx(mm.diff,true,true),roughnessMap:mArm,metalnessMap:mArm,
      bumpMap:tx(mm.bump,false,true),bumpScale:.002,vertexColors:true,roughness:.98,metalness:.95}));
    const shell=own(new T.MeshStandardMaterial({map:tx(hm.paint,true),roughnessMap:hArm,metalnessMap:hArm,
      bumpMap:tx(hm.relief,false),bumpScale:.003,vertexColors:true,roughness:1,metalness:.95}));
    const iron=own(new T.MeshStandardMaterial({vertexColors:true,roughness:.63,metalness:.60,bumpMap:green.bumpMap,bumpScale:.0014}));
    const rubber=own(new T.MeshStandardMaterial({vertexColors:true,roughness:.49,metalness:.045,bumpMap:green.bumpMap,bumpScale:.0008}));
    const lettering=own(new T.MeshStandardMaterial({map:tx(signMap(),true),roughness:.64,metalness:.17,vertexColors:true}));
    const scale=own(new T.MeshStandardMaterial({vertexColors:true,roughness:.91,metalness:.025}));
    const meshParts=new Map(),col=new T.Color(),tmp=new T.Vector3(),nrm=new T.Matrix3(),m4=new T.Matrix4(),rot=new T.Quaternion(),normal=new T.Vector3(),up=new T.Vector3(0,1,0);
    const white=0xffffff,matPaint=0xffffff,shadowPaint=0xaec2b4,amberRust=0x745239,exposed=0x888778;
    const unit=new T.Vector3(1,1,1),v=(x,y,z)=>new T.Vector3(x,y,z);
    function batch(mat){if(!meshParts.has(mat))meshParts.set(mat,{p:[],n:[],uv:[],c:[]});return meshParts.get(mat);}
    function push(dst,pt,n,u,vv,color){
      dst.p.push(pt.x,pt.y,pt.z);dst.n.push(n.x,n.y,n.z);dst.uv.push(u,vv);dst.c.push(color.r,color.g,color.b);
    }
    function add(mat,geo,pos,quat=rot.identity(),size=unit,color=white){
      const out=batch(mat);col.set(color);m4.compose(pos,quat,size);nrm.getNormalMatrix(m4);
      const at=geo.attributes,ix=geo.index,count=ix?ix.count:at.position.count;
      for(let i=0;i<count;i++){const j=ix?ix.getX(i):i;tmp.fromBufferAttribute(at.position,j).applyMatrix4(m4);normal.fromBufferAttribute(at.normal,j).applyNormalMatrix(nrm);
        push(out,tmp,normal,at.uv?at.uv.getX(j):0,at.uv?at.uv.getY(j):0,col);}
    }
    const boxGeo=new T.BoxGeometry(1,1,1),tubeGeo=new T.CylinderGeometry(1,1,1,12),hexGeo=new T.CylinderGeometry(1,1,1,6),roundGeo=new T.CylinderGeometry(1,1,1,36),
      sphere=new T.SphereGeometry(1,8,4),flatGeo=new T.PlaneGeometry(1,1);
    const template=[boxGeo,tubeGeo,hexGeo,roundGeo,sphere,flatGeo];
    function box(mat,x,y,z,w,h,d,color=white,yaw=0){add(mat,boxGeo,v(x,y,z),rot.setFromAxisAngle(up,yaw),v(w,h,d),color);}
    function cylinder(mat,x,y,z,r,height,color=white,g=roundGeo){add(mat,g,v(x,y,z),rot.identity(),v(r,height,r),color);}
    function line(mat,a,b,r,color=white,rz=r){
      const delta=v(0,0,0).subVectors(b,a),length=delta.length(),center=v(0,0,0).copy(a).lerp(b,.5);
      add(mat,tubeGeo,center,rot.setFromUnitVectors(up,delta.normalize()),v(r,length,rz),color);
    }
    function face(mat,a,b,c,d,color,uv=[[0,0],[1,0],[1,1],[0,1]],reverse=false){
      const dst=batch(mat),cc=new T.Color(color),p=[a,b,c,d];
      const n=v(0,0,0).crossVectors(v(0,0,0).subVectors(b,a),v(0,0,0).subVectors(c,a)).normalize();
      if(reverse)n.negate();
      for(const i of reverse?[0,2,1,0,3,2]:[0,1,2,0,2,3])push(dst,p[i],n,uv[i][0],uv[i][1],cc);
    }
    function radial(theta,y,r){return v(r*Math.sin(theta),y,r*Math.cos(theta));}
    const prof=[[-1.12,.22],[-1.06,.46],[-.78,.65],[-.52,.87],[-.29,1.02],[-.18,1.055],[-.13,1.083],[-.035,1.091],
      [.025,1.090],[.070,1.080],[.105,1.064],[.39,1.057],[.435,1.034],[.476,.974],[.490,.895],[.515,.846]];
    const wall=batch(shell),wc=new T.Color(white),N=96;
    for(let i=0;i<prof.length-1;i++){
      const [y0,r0]=prof[i],[y1,r1]=prof[i+1],slope=(r0-r1)/(y1-y0);
      for(let n=0;n<N;n++){
        const u=n/N,b=(n+1)/N,pts=[radial(u*TAU,y0,r0),radial(b*TAU,y0,r0),radial(b*TAU,y1,r1),radial(u*TAU,y1,r1)];
        for(const j of [0,1,2,0,2,3]){
          const uu=j===1||j===2?b:u,yy=pts[j].y;
          normal.set(Math.sin(uu*TAU),slope,Math.cos(uu*TAU)).normalize();push(wall,pts[j],normal,uu,(yy-hullLow)/(hullHigh-hullLow),wc);
        }
      }
    }
    cylinder(green,0,.505,0,.848,.020,shadowPaint);
    cylinder(iron,0,-1.15,0,.278,.085,0x625341);
    // Segmented fender belting sits flush in a steel recess; clamp plates straddle the interruptions.
    for(let j=0;j<8;j++){
      const a=(j+.04)*TAU/8,b=(j+.89)*TAU/8;
      const section=[[-.147,1.081],[-.131,1.095],[-.098,1.100],[-.071,1.092],[-.048,1.099],[-.014,1.100],[.006,1.094],[.029,1.100],[.056,1.094],[.074,1.077]];
      for(let k=0;k<section.length-1;k++){
        const [y0,r0]=section[k],[y1,r1]=section[k+1];
        for(let m=0;m<10;m++){
          const t=a+(b-a)*m/10,t1=a+(b-a)*(m+1)/10;
          face(rubber,radial(t,y0,r0),radial(t1,y0,r0),radial(t1,y1,r1),radial(t,y1,r1),[0x32382e,0x3a3c32,0x262e29,0x34382f][(j+k+Math.floor(m/4))%4]);
        }
      }
      const cc=(j+.966)*TAU/8,q=radial(cc,-.028,1.091);
      box(iron,q.x,q.y,q.z,.055,.14,.012,0x776e54,cc);
      for(const yy of [-.079,.021]){
        const f=radial(cc,yy,1.099);add(iron,sphere,f,rot.setFromAxisAngle(up,cc),v(.011,.011,.005),exposed);
      }
    }
    // A curved doubler replaces a split shell seam across two original plates. Its
    // rivets and the run of weld end before the closest surviving hull stencil.
    function radiusAt(y){
      for(let k=1;k<prof.length;k++)if(y<=prof[k][0]){
        const [low,r0]=prof[k-1],[high,r1]=prof[k];return r0+(r1-r0)*clamp((y-low)/(high-low));
      }
      return prof[prof.length-1][1];
    }
    for(const [angle,width,bottom,top] of [[.816,.392,.132,.389],[-2.45,.272,.156,.357]]){
      const count=8;
      for(let i=0;i<count;i++){
        const t=angle+(i/count-.5)*width,t1=angle+((i+1)/count-.5)*width;
        const y0=bottom+.006*Math.sin(i/count*Math.PI),y1=top-.010*i/count;
        const a=radial(t,y0,radiusAt(y0)+.007),b=radial(t1,y0,radiusAt(y0)+.007),
          c=radial(t1,y1,radiusAt(y1)+.007),d=radial(t,y1,radiusAt(y1)+.007);
        face(green,a,b,c,d,0xa6b8a5,[[i/count*.86,0],[(i+1)/count*.86,0],[(i+1)/count*.86,.62],[i/count*.86,.62]]);
        line(iron,a,b,.0046,0x725d49);line(iron,d,c,.0042,0x7a674e);
        if(i===0)line(iron,a,d,.0045,0x8b7153);if(i===count-1)line(iron,b,c,.0045,0x8b7153);
      }
      for(const k of [-.39,0,.39])for(const y of [bottom+.026,top-.028]){
        const t=angle+k*width,p=radial(t,y,radiusAt(y)+.0115);
        add(iron,sphere,p,rot.setFromAxisAngle(up,t),v(.011,.011,.006),0x93826a);
      }
    }
    const basis=new T.Matrix4(),orient=new T.Quaternion();
    function angleBar(a,b,out,width,gauge,tint){
      const axis=v(0,0,0).subVectors(b,a).normalize(),u=v(0,0,0).crossVectors(axis,out).normalize(),n=v(0,0,0).crossVectors(u,axis).normalize();
      const mid=a.clone().lerp(b,.5),len=a.distanceTo(b);
      orient.setFromRotationMatrix(basis.makeBasis(u,axis,n));
      add(green,boxGeo,mid,orient,v(width,len,gauge),tint);
      add(green,boxGeo,mid.clone().addScaledVector(u,-.5*width+gauge*.5).addScaledVector(n,-.43*width),
        orient,v(gauge,len,width*.86),tint);
    }
    function boltTop(x,y,z,rad=.015,wear=exposed){cylinder(iron,x,y,z,rad,.014,wear,hexGeo);}
    // Bolted flanged deck, with raised radial tread bars on the boarding quadrant.
    for(let i=0;i<24;i++){
      const a=i*TAU/24,p=radial(a,.518,.792);boltTop(p.x,p.y,p.z,i%3?.011:.015,i%5===0?amberRust:0x838374);
      if(i%2===0){const aa=radial(a+.027,.510,.691),bb=radial(a+.027,.510,.818);line(green,aa,bb,.0052,matPaint);}
    }
    // Four outside angle uprights; second bay diagonals reverse above the knuckle.
    const signs=[[-1,-1],[1,-1],[1,1],[-1,1]], topY=2.582;
    function footAt(i,y){const [sx,sz]=signs[i%4],f=clamp((y-.546)/(topY-.546)),r=.484-.249*f;return v(sx*r,y,sz*r);}
    for(let i=0;i<4;i++){
      const [sx,sz]=signs[i],a=footAt(i,.546),b=footAt(i,topY),n=v(sx,0,sz).normalize();
      box(green,a.x,.537,a.z,.215,.042,.190,shadowPaint,0);
      box(iron,a.x,.520,a.z,.237,.010,.208,amberRust,0);
      for(const u of [-.074,.074])for(const w of [-.060,.060])boltTop(a.x+u,.563,a.z+w,.015);
      angleBar(a,b,n,.097,.012,matPaint);
      // Triangular cheeks resist the cantilevering moment where each post lands.
      for(const offs of [-.060,.060]){
        const m=footAt(i,.742),k=footAt(i,.564),dx=-sz*.087,dz=sx*.087;
        const q=v(k.x+sz*offs,.568,k.z-sx*offs),t=v(m.x+sz*offs,.753,m.z-sx*offs);
        face(green,q,v(q.x+dx,.568,q.z+dz),t,t,shadowPaint);
        face(green,q,v(q.x+dx,.568,q.z+dz),t,t,shadowPaint,undefined,true);
      }
      const j=(i+1)%4,midA=footAt(i,1.56),midB=footAt(j,1.56),out=midA.clone().lerp(midB,.5);out.y=0;out.normalize();
      angleBar(midA,midB,out,.055,.009,shadowPaint);
      angleBar(i%2?footAt(j,.62):footAt(i,.62),i%2?midA:midB,out,.061,.008,matPaint);
      angleBar(i%2?midA:midB,i%2?footAt(j,2.49):footAt(i,2.49),out,.054,.007,matPaint);
      const node=midA.clone().addScaledVector(n,.029);
      add(iron,sphere,node,rot.identity(),v(.023,.024,.019),0x796e51);
    }
    // Four enamel number boards on the tower post flanges, visible over broken water.
    for(let j=0;j<4;j++){
      const a=j*Math.PI/2,n=radial(a,0,1),u=radial(a+Math.PI*.5,0,1),p=radial(a,1.24,.515);
      add(lettering,flatGeo,p,rot.setFromAxisAngle(up,a),v(.78,.343,1));
      const rail=radial(a,1.24,.501);
      box(green,rail.x,rail.y,rail.z,.795,.355,.024,shadowPaint,a);
      for(const s of [-1,1]){
        const c=rail.clone().addScaledVector(u,s*.358);
        const lug=radial(a,1.393,.455).addScaledVector(u,s*.357);box(iron,lug.x,lug.y,lug.z,.034,.027,.10,0x655842,a);
        for(const y of [1.096,1.384]){c.y=y;const f=c.clone().addScaledVector(n,.017);
          add(iron,sphere,f,rot.setFromAxisAngle(up,a),v(.010,.010,.005),exposed);}
      }
    }
    // Inclined boarding ladder clears all four numbered faces, along the after quarter.
    const la=2.22,ln=radial(la,0,1),lu=radial(la+Math.PI/2,0,1);
    function lg(y,width=0){const radius=y<.48?1.088:.479+.609*(1-clamp((y-.48)/2.10));
      return radial(la,y,radius).addScaledVector(lu,width);}
    for(const side of [-.162,.162]){
      line(green,lg(-.31,side),lg(.48,side),.022,shadowPaint);
      line(green,lg(.48,side),lg(2.59,side),.023,matPaint);
      const lip=lg(2.59,side).addScaledVector(ln,-.010),tip=lg(2.635,side).addScaledVector(ln,-.077);
      line(green,lip,tip,.021);line(green,tip,lg(2.63,side).addScaledVector(ln,-.137),.019);
      for(const yy of [.50,1.44,2.34]){
        const a=lg(yy,side),b=a.clone().addScaledVector(ln,-(yy<.6?.20:yy<2?.25:.132));line(iron,a,b,.012,0x675f4f);
      }
    }
    for(let j=0;j<12;j++){
      const y=-.197+j*.237,a=lg(y,-.163),b=lg(y,.163);
      line(iron,a,b,y>.10?.0155:.017,j<2?0x514f39:j%4===1?0x97977f:0x737b67);
      for(const side of [-.125,.125]){const a=lg(y,side-.009),b=lg(y,side+.009);line(green,a,b,.018,shadowPaint);}
    }
    // Inspection manhole forward of the cage, with cam dogs and a replaceable gasket.
    const hatch=v(-.14,.524,.25);
    cylinder(iron,hatch.x,.528,hatch.z,.250,.026,0x595a49);
    cylinder(green,hatch.x,.556,hatch.z,.233,.038,shadowPaint);
    cylinder(green,hatch.x,.579,hatch.z,.198,.012,matPaint);
    for(let j=0;j<8;j++){
      const q=radial(j*TAU/8,.587,.215);boltTop(hatch.x+q.x,q.y,hatch.z+q.z,.013);
    }
    for(const s of [-1,1]){line(iron,v(-.14+s*.06,.584,.258),v(-.14+s*.06,.609,.258),.008,exposed);}
    line(iron,v(-.20,.609,.258),v(-.08,.609,.258),.0085,0x82887b);
    // Sealable instrument gland and the armored flexible conductor to the crown.
    let prior;
    for(let j=0;j<17;j++){
      const y=.58+2*j/16,p=footAt(1,y);p.x-=.045+.022*Math.cos(j*.43);p.z+=.082+.023*Math.sin(j*.55);
      if(prior)line(rubber,prior,p,.017,0x30372d);
      if([1,6,11,15].includes(j))line(iron,p.clone().add(v(-.025,0,-.013)),p.clone().add(v(.019,0,-.020)),.007,exposed);
      if(!j)cylinder(iron,p.x,.570,p.z,.038,.085,0x857954,hexGeo);
      prior=p;
    }
    // Lifting eyes cut from rolled plate, reinforced at the deck but open through the middle.
    const cheek=new T.Shape();cheek.moveTo(-.111,0);cheek.lineTo(-.101,.111);cheek.quadraticCurveTo(-.079,.190,0,.197);
    cheek.quadraticCurveTo(.083,.196,.100,.111);cheek.lineTo(.110,0);cheek.closePath();
    const hole=new T.Path();hole.absellipse(0,.118,.045,.041,0,TAU,true,0);cheek.holes.push(hole);
    const eye=new T.ExtrudeGeometry(cheek,{depth:.032,bevelEnabled:true,bevelSize:.005,bevelThickness:.005,bevelSegments:1,curveSegments:11});template.push(eye);
    for(const a of [-.92,Math.PI-.92]){
      const p=radial(a,.505,.754);add(green,eye,p,rot.setFromAxisAngle(up,a),unit,shadowPaint);box(iron,p.x,.518,p.z,.239,.018,.068,amberRust,a);
    }
    // Four bolted landing tabs carry a shallow openwork maintenance platform.
    cylinder(green,0,2.546,0,.354,.045,shadowPaint);
    for(const a of [0,Math.PI/2,Math.PI,Math.PI*1.5]){
      const p=radial(a,2.546,.429);box(iron,p.x,p.y,p.z,.134,.086,.160,0x626a59,a);
    }
    function annulus(y,r0,r1,depth,color){
      for(let i=0;i<64;i++){
        const a=i*TAU/64,b=(i+1)*TAU/64,uv=[[0,0],[.12,0],[.12,.30],[0,.30]];
        face(green,radial(a,y,r1),radial(b,y,r1),radial(b,y,r0),radial(a,y,r0),color,uv);
        face(green,radial(a,y-depth,r1),radial(b,y-depth,r1),radial(b,y,r1),radial(a,y,r1),shadowPaint,uv);
        face(green,radial(a,y-depth,r0),radial(a,y,r0),radial(b,y,r0),radial(b,y-depth,r0),shadowPaint,uv);
      }
    }
    annulus(2.648,.418,.512,.07,matPaint);
    for(let i=-5;i<=5;i++){
      const x=i*.069,l=Math.sqrt(.439*.439-x*x);
      box(green,x,2.618,0,.017,.045,2*l,shadowPaint);
    }
    cylinder(green,0,2.652,0,.330,.043,shadowPaint);
    cylinder(iron,0,2.675,0,.289,.015,0x687464);
    for(let i=0;i<12;i++){const p=radial(i*TAU/12,2.679,.304);boltTop(p.x,p.y,p.z,.0115);}
    // The decomposing shell ridge concentrates on the quieter sides and below rubbing patches.
    const rand=generator(191007),growth=batch(scale);
    const barnacles=[0x777452,0x92876b,0x66664f,0x656143,0x9d9478].map(t=>new T.Color(t));
    for(let j=0;j<172;j++){
      const a=rand()*TAU,y=-.056+rand()*.189,sz=.006+rand()*.011,quiet=(a/(TAU/8))%1;
      if(quiet>.08&&quiet<.85&&y<.060&&rand()>.24)continue;
      const rr=radiusAt(y)+(y<.073&&quiet>.045&&quiet<.89?.008:.001),n=radial(a,0,1),
        tangent=radial(a+Math.PI/2,0,1),base=radial(a,y,rr),delta=rand()*TAU,tilt=rand()*.4;
      const cap=base.clone().addScaledVector(n,sz*.36).addScaledVector(tangent,sz*tilt);
      for(let k=0;k<6;k++){
        const vertex=d=>base.clone().addScaledVector(tangent,sz*Math.cos(d)).addScaledVector(up,sz*.72*Math.sin(d));
        const p=vertex(k*TAU/6+delta),q=vertex((k+1)*TAU/6+delta);
        const nn=v(0,0,0).crossVectors(q.clone().sub(p),cap.clone().sub(p)).normalize();
        const color=barnacles[(j+Math.floor(k/2))%barnacles.length];
        push(growth,p,nn,0,0,color);push(growth,q,nn,1,0,color);push(growth,cap,nn,.5,1,color);
      }
    }
    for(const [mat,d] of meshParts){
      const geom=own(new T.BufferGeometry());geom.setAttribute('position',new T.Float32BufferAttribute(d.p,3));
      geom.setAttribute('normal',new T.Float32BufferAttribute(d.n,3));geom.setAttribute('uv',new T.Float32BufferAttribute(d.uv,2));
      geom.setAttribute('color',new T.Float32BufferAttribute(d.c,3));geom.computeBoundingSphere();
      const m=new T.Mesh(geom,mat);m.name=mat===shell?'Stamped hull and immersion band':mat===green?'Tower, boarding ladder and deck':
        mat===lettering?'North Cape 07 number boards':mat===rubber?'Segmented fenders':mat===scale?'Calcareous growth':'Unpainted fittings';
      m.castShadow=mat!==scale;m.receiveShadow=true;root.add(m);
    }
    template.forEach(geo=>geo.dispose());meshParts.clear();
    let disposed=false;
    return {dispose(){if(disposed)return;disposed=true;parent.remove(root);owned.forEach(o=>o.dispose());owned.clear();}};
  }
  return {create};
})();
