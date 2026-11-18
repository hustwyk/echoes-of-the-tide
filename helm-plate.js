// Fixed harbour-watch tally. Its shoulder, rubbing track and lens share the moving launch frame.
const TideHelmPlate=(()=>{
  const T=THREE, W=.254,H=.143,slant=.39,strokeSpan=.146,TAU=Math.PI*2;
  const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
  const v=(x=0,y=0,z=0)=>new T.Vector3(x,y,z);
  const strokeY=x=>-.014+.0048*Math.sin((x+.052)*32)-.002*x/.073;
  function create(boat){
    const root=new T.Group(),face=new T.Group(),owned=new Set(),own=o=>(owned.add(o),o);
    root.name='交通艇 · 固定舵座铜牌';face.name='外港值班';boat.root.add(root);root.add(face);
    root.position.copy(boat.helmWheel.position).add(v(.097,.138,.300));root.rotation.y=-Math.PI/2;face.rotation.x=-slant;
    let seed=0x1837bb81;function random(){seed=(Math.imul(1664525,seed)+1013904223)>>>0;return seed/4294967296;}
    function canvas(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return c;}
    const color=(tex,space)=>{tex.colorSpace=space;tex.anisotropy=4;return own(tex);};
    const w=768,h=432,base=canvas(w,h),occluded=canvas(w,h),elevation=canvas(w,h);
    const ctx=base.getContext('2d'),ox=occluded.getContext('2d'),height=elevation.getContext('2d');
    const metal=ctx.createImageData(w,h),film=ox.createImageData(w,h),relief=height.createImageData(w,h);
    const noise=Array.from({length:4096},()=>random());function n(x,y){
      const ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy,a=fx*fx*(3-2*fx),b=fy*fy*(3-2*fy);
      const at=(i,j)=>noise[(i&63)+64*(j&63)],l=at(ix,iy)*(1-a)+at(ix+1,iy)*a,r=at(ix,iy+1)*(1-a)+at(ix+1,iy+1)*a;return l*(1-b)+r*b;
    }
    const assign=(arr,k,r,g,b)=>{arr[k]=r;arr[k+1]=g;arr[k+2]=b;arr[k+3]=255;};
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){
      const i=(y*w+x)*4,edge=Math.min(x,y,w-1-x,h-1-y);
      const broad=n(x/109,y/87),cloud=n(x/37+5,y/43),pits=n(x/8,y/7),grain=random()-.5;
      const corrode=clamp(.88-edge/39+.36*(pits-.45)+.4*(cloud-.5)),oxide=corrode*(.40+.52*broad);
      const stripe=(noise[(y+49)&4095]-.5)*2.1,lit=24*(broad-.45)+11*(cloud-.5)+grain*7+stripe;
      const a=metal.data;
      assign(a,i,186+lit-94*oxide,148+lit*.90-51*oxide,87+lit*.70-25*oxide);
      const smear=n(x/26+y*.018,y/11+13),salt=Math.pow(pits,3)*15;
      const ridge=n(x/19+cloud*3,y/17+broad*3),crystal=Math.exp(-Math.abs(ridge-.48)*22);
      const bloom=clamp((ridge*.29+cloud*.42+broad*.42-.46)*2.5),dry=29*bloom+11*crystal;
      const f=16*(broad-.5)+12*(smear-.5)+grain*6+salt;
      assign(film.data,i,121+f+dry,125+f*.95+dry*.94,105+f*.85+dry*.77);
      const ht=132+grain*9-oxide*(12+pits*19)+pits*4;assign(relief.data,i,ht,ht,ht);
    }
    ctx.putImageData(metal,0,0);ox.putImageData(film,0,0);height.putImageData(relief,0,0);
    // Rolled-brass polish lines, salt runs and nicked edges are unique to this casting.
    function line(c,x,y,xx,yy,col,lw){c.strokeStyle=col;c.lineWidth=lw;c.beginPath();c.moveTo(x,y);c.lineTo(xx,yy);c.stroke();}
    for(let i=0;i<1850;i++){const x=random()*w,y=random()*h,k=2+random()**2*65,dy=(random()-.6)*2.4;
      line(ctx,x,y,x+k,y+dy,random()>.45?'rgba(255,236,174,.12)':'rgba(52,42,30,.13)',.38+random()*.49);
      if(i%4===0)line(height,x,y,x+k,y+dy,'rgba(52,52,52,.26)',.57);
      if(i%7===0)line(ox,x,y,x+k*.5,y+dy,'rgba(192,188,145,.13)',.76);
    }
    for(let i=0;i<110;i++){const x=random()*w,y=random()*h,len=4+random()**2*33;
      line(ctx,x,y,x+len*.83,y-len*.41,'rgba(66,58,40,.24)',.89);line(ctx,x,y+1,x+len*.83,y-len*.41+1,'rgba(235,215,149,.29)',.7);}
    function neat(c,x,y,W,H,r){c.beginPath();c.moveTo(x+r,y);c.arcTo(x+W,y,x+W,y+H,r);c.arcTo(x+W,y+H,x,y+H,r);c.arcTo(x,y+H,x,y,r);c.arcTo(x,y,x+W,y,r);c.closePath();}
    for(const [off,col] of [[.5,'rgba(239,211,152,.68)'],[-1,'rgba(62,61,41,.86)']]){
      neat(ctx,19,18+off,w-38,h-36,17);ctx.strokeStyle=col;ctx.lineWidth=2.2;ctx.stroke();}
    const font='600 60px "Songti SC","Noto Serif CJK SC","STSong",serif';
    function title(c,col,dy){c.font=font;c.fillStyle=col;c.textAlign='center';c.textBaseline='middle';
      [...'外港值班'].forEach((s,i)=>c.fillText(s,w/2+(i-1.5)*76,80+dy));}
    title(ctx,'#8b693c',-2);title(ctx,'#e1c784',2);title(ctx,'#393c31',0);
    line(ctx,105,128,663,128,'#e1c280',2);line(ctx,106,126,662,126,'#736343',2);
    // The dies are hand-cut numerals with a small shoe on the one and a round counter on the two.
    const digits=new Path2D('M252 196 L299 155 L321 155 L321 327 L354 327 L354 346 L259 346 L259 327 L290 327 L290 199 L262 219 Z M390 208 C391 170 415 151 451 151 C489 151 513 173 513 208 C513 231 501 252 479 272 L432 317 L516 317 L516 346 L387 346 L387 324 L456 254 C472 238 483 224 483 210 C483 193 471 181 452 181 C434 181 422 191 419 211 Z');
    function stamp(c,dx,dy,clr){c.save();c.translate(w*.5+dx,dy);c.scale(1.33,1);c.translate(-w*.5,0);c.fillStyle=clr;c.fill(digits);c.restore();}
    stamp(ctx,0,3,'#eacf91');stamp(ctx,-1,-2,'#8c7445');stamp(ctx,0,0,'#39392f');
    // Hairline losses in the old dark infill reveal the brass wall of the incised number.
    ctx.save();ctx.translate(w*.5,0);ctx.scale(1.33,1);ctx.translate(-w*.5,0);ctx.clip(digits);for(let k=0;k<1270;k++){const x=240+random()*288,y=145+random()*204;
      line(ctx,x,y,x+random()**2*4,y-.28,'rgba(211,179,111,.29)',.56+random()*.65);}ctx.restore();
    for(let j=0;j<110;j++){const x=45+random()*(w-90),y=116+random()*(h-148),len=4+random()**2*27;
      ox.strokeStyle='rgba(51,69,62,'+(.04+random()*.11)+')';ox.lineWidth=.7+random()*1.3;ox.beginPath();ox.moveTo(x,y);ox.bezierCurveTo(x-1,y+len*.4,x+4,y+len*.9,x+1,y+len);ox.stroke();}
    // Capillary rings and tiny salt crystals scattered through the old deposit.
    for(let j=0;j<82;j++){
      const x=random()*w,y=97+random()*(h-100),rx=1+random()**2*11,ry=rx*(.7+random()*.53);
      ox.strokeStyle='rgba(210,209,172,'+(.11+.24*random())+')';ox.lineWidth=.43+random()*.82;
      ox.beginPath();ox.ellipse(x,y,rx,ry,random()*.6,random()*2,3.4+random()*2.2);ox.stroke();
    }
    for(let j=0;j<4200;j++){
      const x=random()*w,y=random()*h,size=.39+random()**3*1.4;ox.fillStyle=random()>.5?'rgba(235,225,184,.48)':'rgba(59,74,61,.29)';
      ox.fillRect(x,y,size,size*.64);
    }
    const clean=color(new T.CanvasTexture(base),T.SRGBColorSpace),dirt=color(new T.CanvasTexture(occluded),T.SRGBColorSpace);
    const bump=color(new T.CanvasTexture(elevation),T.NoColorSpace);
    const bytes=new Uint8Array(12*4);for(let i=0;i<12;i++)bytes[i*4+3]=255;
    const rub=own(new T.DataTexture(bytes,12,1,T.RGBAFormat));rub.minFilter=rub.magFilter=T.LinearFilter;rub.generateMipmaps=false;rub.needsUpdate=true;
    const faceMat=own(new T.MeshStandardMaterial({map:clean,bumpMap:bump,bumpScale:.00017,metalness:.50,roughness:.49}));
    const glsl=`
      uniform sampler2D tideCoverage;
      float tideWipe(vec2 uv) {
        float x = (uv.x-.5)*.254;
        float y = (uv.y-.5)*.143;
        float lane = x/.146+.5;
        float cov = texture2D(tideCoverage,vec2(clamp(lane,.0,1.),.5)).r;
        float track = -.014+.0048*sin((x+.052)*32.)-.002*x/.073;
        float smear = .0019*sin(uv.x*38.+sin(uv.y*11.))+.0019*sin(uv.x*72.3+uv.y*16.);
        float width = .009+.050*pow(cov,.82);
        float wiped = smoothstep(.025,.26,cov)*(1.-smoothstep(width-.006,width+.003,abs(y-track+smear)));
        // The unhandled cast edge and title remain visible when salt has filmed the numbers.
        float patchX = 1.-smoothstep(.062,.123,abs(x)+.006*sin(uv.y*16.+sin(uv.x*18.)));
        float lowerEdge = smoothstep(-.076,-.044,y+.003*sin(uv.x*46.));
        float upperEdge = 1.-smoothstep(.023,.053,y+.0032*sin(uv.x*21.)+.0018*sin(uv.x*49.));
        float fine = .040*pow(.5+.5*sin((y-track+smear)*5700.+uv.x*16.),5.);
        return (1.-wiped*(1.-fine))*patchX*lowerEdge*upperEdge;
      }`;
    faceMat.onBeforeCompile=s=>{
      s.uniforms.tideCoverage={value:rub};s.uniforms.tideSalt={value:dirt};
      s.fragmentShader=s.fragmentShader.replace('#include <common>','#include <common>\nuniform sampler2D tideSalt;\n'+glsl)
        .replace('#include <map_fragment>','#include <map_fragment>\nfloat tideFilm=tideWipe(vMapUv);\ndiffuseColor.rgb=mix(diffuseColor.rgb,texture2D(tideSalt,vMapUv).rgb,tideFilm);')
        .replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\nroughnessFactor=mix(roughnessFactor,.69,tideFilm);')
        .replace('#include <metalnessmap_fragment>','#include <metalnessmap_fragment>\nmetalnessFactor=mix(metalnessFactor,.10,tideFilm);');
    };
    // A single chamfered casting and hard mounting parts batch by finish, including each recessed screw slot.
    const solid=own(new T.MeshStandardMaterial({vertexColors:true,metalness:.58,roughness:.48}));
    const hardware={p:[],n:[],c:[],i:[]},matrix=new T.Matrix4(),q=new T.Quaternion(),unit=v(1,1,1),normal=new T.Matrix3(),tmp=v();
    root.updateMatrix();face.updateMatrix();
    function add(geometry,clr,at=v(),rot=[0,0,0],scale=unit,framed=true){
      const rgb=new T.Color(clr),bp=geometry.attributes.position,bn=geometry.attributes.normal,off=hardware.p.length/3;
      matrix.compose(at,q.setFromEuler(new T.Euler(...rot)),scale);if(framed)matrix.premultiply(face.matrix);normal.getNormalMatrix(matrix);
      for(let k=0;k<bp.count;k++){
        tmp.fromBufferAttribute(bp,k).applyMatrix4(matrix);hardware.p.push(tmp.x,tmp.y,tmp.z);
        tmp.fromBufferAttribute(bn,k).applyMatrix3(normal).normalize();hardware.n.push(tmp.x,tmp.y,tmp.z);hardware.c.push(rgb.r,rgb.g,rgb.b);}
      const idx=geometry.index?.array;if(idx)for(const id of idx)hardware.i.push(off+id);else for(let id=0;id<bp.count;id++)hardware.i.push(off+id);
      geometry.dispose();
    }
    function rounded(w,h,r){const s=new T.Shape(),a=-w*.5,b=-h*.5;
      s.moveTo(a+r,b);s.lineTo(-a-r,b);s.quadraticCurveTo(-a,b,-a,b+r);s.lineTo(-a,-b-r);s.quadraticCurveTo(-a,-b,-a-r,-b);s.lineTo(a+r,-b);s.quadraticCurveTo(a,-b,a,-b-r);s.lineTo(a,b+r);s.quadraticCurveTo(a,b,a+r,b);return s;}
    function slab(w,h,r,depth,z,col,bevel){add(new T.ExtrudeGeometry(rounded(w,h,r),{depth,curveSegments:6,bevelEnabled:bevel>0,bevelThickness:bevel,bevelSize:bevel,bevelSegments:2}),col,v(0,0,z));}
    slab(W+.009,H+.008,.012,.0042,-.009,'#404c45',.0017);slab(W+.002,H+.002,.010,.0055,-.0033,'#a88753',.0013);
    const shape=new T.ShapeGeometry(rounded(W,H,.0093),7),uv=shape.attributes.uv,ps=shape.attributes.position;
    for(let k=0;k<ps.count;k++)uv.setXY(k,ps.getX(k)/W+.5,ps.getY(k)/H+.5);
    const panel=new T.Mesh(own(shape),faceMat);panel.name='轮值号 · 盐膜擦痕';panel.position.z=.00365;panel.receiveShadow=true;face.add(panel);
    const box=(x,y,z,a,b,c,col,framed=true,rz=0)=>add(new T.BoxGeometry(a,b,c),col,v(x,y,z),[0,0,rz],unit,framed);
    const cyl=(x,y,z,r,rr,deep,col,axialZ=true,framed=true)=>add(new T.CylinderGeometry(r,rr,deep,18),col,v(x,y,z),[axialZ?Math.PI*.5:0,0,0],unit,framed);
    for(const x of [-.089,.089]){
      box(x,-.106,-.061,.039,.009,.129,'#555e52',false);box(x,-.101,-.061,.035,.005,.130,'#7c8067',false);
      const rib=new T.Shape();rib.moveTo(-.012,-.095);rib.lineTo(.088,-.095);rib.lineTo(.059,.033);rib.lineTo(.030,.038);rib.closePath();
      add(new T.ExtrudeGeometry(rib,{depth:.0052,bevelSize:.0008,bevelThickness:.0007,bevelSegments:1}), '#647465',v(x-.0025,0,0),[0,Math.PI/2,0],unit,false);
      cyl(x,-.095,-.107,.0053,.0062,.0073,'#8e8065',false,false);cyl(x,-.094,-.014,.0053,.0062,.0073,'#897b61',false,false);
    }
    for(const x of [-.110,.110])for(const y of [-.0555,.0555]){
      const brass=y<0?'#ad8851':'#b2996c',phi=(random()-.5)*1.7;
      add(new T.TorusGeometry(.006,.0009,7,20),'#5a604b',v(x,y,.00405));cyl(x,y,.0046,.00525,.00605,.0023,brass);
      cyl(x,y,.00585,.00485,.00525,.00155,'#655741');
      // Two pan-head lobes leave an actual open, recessed screwdriver slot.
      for(const s of [-1,1]){const zz=.0049,sl=.00068,rr=.00485,dy=Math.sqrt(rr*rr-sl*sl),a=Math.asin(sl/rr);
        const cap=new T.Shape();cap.moveTo(sl,-dy);cap.absarc(0,0,rr,-Math.PI/2+a,Math.PI/2-a,false);cap.lineTo(sl,-dy);
        add(new T.ExtrudeGeometry(cap,{depth:.0012,bevelEnabled:true,bevelThickness:.00036,bevelSize:.00022,bevelSegments:1,curveSegments:8}),brass,v(x,y,zz+.0012),[0,0,phi+(s<0?Math.PI:0)]);}
    }
    const geo=own(new T.BufferGeometry());for(const [nm,src] of [['position',hardware.p],['normal',hardware.n],['color',hardware.c]])geo.setAttribute(nm,new T.Float32BufferAttribute(src,3));geo.setIndex(hardware.i);geo.computeBoundingSphere();
    const body=new T.Mesh(geo,solid);body.name='黄铜件 · 螺杆与背托';body.castShadow=body.receiveShadow=true;root.add(body);
    // Droplets sit proud of the face and disappear under the same sweep that removes the salt.
    const drops=new T.InstancedMesh(own(new T.SphereGeometry(1,9,5)),own(new T.MeshPhysicalMaterial({color:0xb7b7a0,roughness:.11,metalness:.13,clearcoat:.8,clearcoatRoughness:.09,transparent:true,opacity:.52,depthWrite:false})),53);
    const db=[];for(let k=0;k<drops.count;k++){
      let x=(random()-.5)*(W-.017),y=(random()-.5)*(H-.014);
      const radius=.00070+random()**2*.00215;
      db.push([x,y,radius,radius*(1+random()*.50)]);}
    drops.name='盐水珠';drops.castShadow=false;drops.receiveShadow=false;drops.frustumCulled=false;face.add(drops);
    const tip=v(),aEye=v(),aAt=v(),alongVec=v(),normVec=v(),trans=v(),rot=new T.Quaternion();
    let cursor=.50,look=0,signature='',closed=false;
    function oilBeads(c){
      for(let j=0;j<db.length;j++){
        const [x,y,r,ry]=db[j],pos=clamp(x/strokeSpan+.5)*12-.5,k=Math.floor(pos),f=pos-k;
        const fraction=(c[clamp(k,0,11)]||0)*(1-f)+(c[clamp(k+1,0,11)]||0)*f;
        const wiped=Math.abs(x)<.082&&Math.abs(y-strokeY(x))<.008+.050*fraction&&fraction>.025?1-clamp((fraction-.025)*3.4):1;
        matrix.compose(trans.set(x,y,.00370),rot,unit.set(r*wiped,ry*wiped,r*.48*wiped));drops.setMatrixAt(j,matrix);}
      drops.instanceMatrix.needsUpdate=true;
    }
    function update(s,t){
      const p=s?.plate||{},raw=p.coverage||[],next=[];
      cursor=clamp(Number.isFinite(p.stroke)?p.stroke:.5);look=clamp(p.look||0);
      for(let j=0;j<12;j++)next.push(Math.round(clamp(raw[j]||0)*255));
      const key=next.join('.');if(key===signature)return;signature=key;
      for(let j=0;j<12;j++)bytes[j*4]=bytes[j*4+1]=bytes[j*4+2]=next[j];rub.needsUpdate=true;
      oilBeads(next.map(n=>n/255));
    }
    function touch(out=tip){
      const x=(cursor-.5)*strokeSpan;return face.localToWorld(out.set(x,strokeY(x),.0046));
    }
    function direction(out,x,y,z){face.updateWorldMatrix(true,false);return out.set(x,y,z).transformDirection(face.matrixWorld);}
    function shot(aspect=.80){
      const fov=36,d=Math.max(.35,.293/(2*Math.tan(fov*Math.PI/360)*Math.max(.34,aspect)));
      face.localToWorld(aAt.set(.001,-.004,.004));face.localToWorld(aEye.set(.040,.075,.004+d));
      return {eye:aEye.toArray(),at:aAt.toArray(),fov,focus:aEye.distanceTo(aAt),handsOnly:true};
    }
    update(null,0);return {root,update,touch,normal:(out=normVec)=>direction(out,0,0,1),along:(out=alongVec)=>direction(out,1,0,0),shot,dispose(){
      if(closed)return;closed=true;root.removeFromParent();drops.dispose();for(const o of owned)o.dispose();owned.clear();root.clear();}};
  }
  return {create};
})();
