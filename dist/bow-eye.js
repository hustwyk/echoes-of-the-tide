// Laid flax casting eye. The supplied ellipse describes the CLEAR opening, not the rope centreline.
const TideBowEye=(()=>{
  function create(T,parent){
    const tau=Math.PI*2,lineRadius=.016,layTurns=19,rows=304,columns=24;
    const body=new T.Group(),splice=new T.Group();body.name='首缆 · 麻索套眼';body.matrixAutoUpdate=false;
    splice.name='回捻插接与尾扎';parent.add(body);body.add(splice);
    const allocated=new Set(),own=o=>(allocated.add(o),o);
    const V=(x=0,y=0,z=0)=>new T.Vector3(x,y,z);
    // Periodic scans of individual tow fibres generated from two interlaced thread families.
    // No image files are fetched; all yarns and salt flecks are authored here.
    function fibreFinish(){
      const w=256,h=128,c=new Uint8Array(w*h*4),n=new Uint8Array(w*h*4),bump=new Float32Array(w*h);
      let seed=60352;const rand=()=>((seed=Math.imul(1664525,seed)+1013904223>>>0)/4294967296);
      for(let y=0;y<h;y++)for(let x=0;x<w;x++){
        const i=y*w+x,u=x/w*tau,v=y/h*tau;
        const f=v*21+u*2+.43*Math.sin(u*2+v*2)+.13*Math.sin(u*6-v);
        const hair=.42*Math.sin(f)+.21*Math.sin(2*f+.25)+.12*Math.sin(37*v-3*u)+.15*(rand()-.5);
        const marl=.42*Math.sin(v*4-u)+.26*Math.sin(2*v+u*4)+.12*Math.sin(6*u+7*v);
        const shade=219+22*hair+7*marl+3*(rand()-.5);
        c[i*4]=shade+3;c[i*4+1]=shade;c[i*4+2]=shade-5;c[i*4+3]=255;bump[i]=hair;
      }
      for(let y=0;y<h;y++)for(let x=0;x<w;x++){
        const i=(y*w+x)*4,dx=bump[y*w+(x+1)%w]-bump[y*w+(x+w-1)%w];
        const dy=bump[((y+1)%h)*w+x]-bump[((y+h-1)%h)*w+x];
        const d=Math.hypot(dx*.43,dy*.64,1);n[i]=127.5*(1-dx*.43/d);n[i+1]=127.5*(1-dy*.64/d);n[i+2]=127.5*(1+1/d);n[i+3]=255;
      }
      function make(a,colour){const tex=own(new T.DataTexture(a,w,h,T.RGBAFormat));
        if(colour){if('colorSpace'in tex)tex.colorSpace=T.SRGBColorSpace;else tex.encoding=T.sRGBEncoding;}
        tex.magFilter=T.LinearFilter;tex.minFilter=T.LinearMipmapLinearFilter;tex.wrapS=tex.wrapT=T.RepeatWrapping;
        tex.generateMipmaps=true;tex.anisotropy=4;tex.needsUpdate=true;return tex;}
      return [make(c,true),make(n,false)];
    }
    const [map,normalMap]=fibreFinish(),mat=own(new T.MeshStandardMaterial({map,normalMap,vertexColors:true,roughness:.80,metalness:.012}));
    mat.normalScale.set(.34,.34);
    const straw=['#c9aa78','#dbc398','#af9671'].map(c=>new T.Color(c));
    const marker=new T.Color('#b99a53'),wax=new T.Color('#c2b78b'),tar=new T.Color('#485344'),rust=new T.Color('#aa6944');
    // The three-ply section is the exterior of three overlapping round strands.
    // Sampling in the rotating material frame preserves a separate ridge and trough between every pair of plies.
    function profile(a){
      const nearest=Math.round(a*3/tau),d=a-nearest*tau/3,dist=.465,rad=.535;
      const cs=Math.cos(d),sn=Math.sin(d),disc=Math.sqrt(rad*rad-dist*dist*sn*sn);
      return {r:dist*cs+disc,dr:(-dist*sn-dist*dist*sn*cs/disc)*Math.min(1,Math.max(0,(Math.PI/3-Math.abs(d))/.15)),ply:(nearest%3+3)%3,local:d};
    }
    const sector=Array.from({length:columns+1},(_,j)=>{const a=tau*j/columns;return {...profile(a),c:Math.cos(a),s:Math.sin(a)};});
    const N=(rows+1)*(columns+1),P=new Float32Array(N*3),norm=new Float32Array(N*3),uv=new Float32Array(N*2),col=new Float32Array(N*3),ix=[];
    const sn=new Float64Array(rows+1),cs=new Float64Array(rows+1),run=new Float64Array(rows+1);
    for(let i=0;i<=rows;i++){
      const a=tau*i/rows;sn[i]=Math.sin(a);cs[i]=Math.cos(a);
      for(let j=0;j<=columns;j++){
        const id=i*(columns+1)+j,v=sector[j],t=i/rows;
        const ropeShade=1+.050*Math.sin(3*a+v.ply*.9)+.034*Math.cos(a*7+j*.88);
        const c=straw[v.ply];
        // One thin flax/russet tracer is spun in one ply, never painted across the aperture.
        const witness=v.ply===2&&Math.abs(v.local-.524)<.08?.80:0;
        col[id*3]=(c.r*(1-witness)+marker.r*witness)*ropeShade;
        col[id*3+1]=(c.g*(1-witness)+marker.g*witness)*ropeShade;
        col[id*3+2]=(c.b*(1-witness)+marker.b*witness)*ropeShade;
        uv[2*id]=t*layTurns*1.3;uv[2*id+1]=j/columns;
        if(i<rows&&j<columns){const next=id+columns+1;ix.push(id,id+1,next,id+1,next+1,next);}
      }
    }
    const geo=own(new T.BufferGeometry()),pa=new T.BufferAttribute(P,3).setUsage(T.DynamicDrawUsage),na=new T.BufferAttribute(norm,3).setUsage(T.DynamicDrawUsage);
    geo.setAttribute('position',pa);geo.setAttribute('normal',na);geo.setAttribute('color',new T.BufferAttribute(col,3));geo.setAttribute('uv',new T.BufferAttribute(uv,2));geo.setIndex(ix);
    const loop=new T.Mesh(geo,mat);loop.name='三股右捻主眼';loop.castShadow=loop.receiveShadow=true;body.add(loop);
    // Use arclength for a uniform lay pitch around a strongly elongated ellipse.
    function form(rx,rz){
      let length=0;
      for(let i=1;i<=rows;i++){length+=Math.hypot(rx*(sn[i]-sn[i-1]),rz*(cs[i]-cs[i-1]));run[i]=length;}
      const twist=tau*layTurns/(length+tau*lineRadius);
      for(let i=0;i<=rows;i++){
        const vx=rx*cs[i],vz=rz*sn[i],d=Math.hypot(vx,vz),tx=vx/d,tz=vz/d;
        const nx=tz,nz=-tx,cx=rx*sn[i]+lineRadius*nx,cz=-rz*cs[i]+lineRadius*nz;
        const arc=run[i]/length,theta=tau*layTurns*arc,ct=Math.cos(theta),st=Math.sin(theta);
        const curvature=rx*rz/(d*d*d);
        for(let j=0;j<=columns;j++){
          const id=(i*(columns+1)+j)*3,v=sector[j],co=ct*v.c-st*v.s,si=st*v.c+ct*v.s;
          const r=v.r*lineRadius,dr=v.dr*lineRadius;
          P[id]=cx+r*co*nx;P[id+1]=r*si;P[id+2]=cz+r*co*nz;
          const outward=v.r*co+v.dr*si,up=v.r*si-v.dr*co;
          const tangent=dr*twist*v.r/Math.max(.18,1+curvature*(lineRadius+r*co));
          const ln=1/Math.hypot(outward,up,tangent);
          norm[id]=(outward*nx+tangent*tx)*ln;norm[id+1]=up*ln;norm[id+2]=(outward*nz+tangent*tz)*ln;
        }
      }
      pa.needsUpdate=na.needsUpdate=true;
      if(!geo.boundingSphere)geo.boundingSphere=new T.Sphere();geo.boundingSphere.center.set(0,0,0);geo.boundingSphere.radius=Math.max(rx,rz)+lineRadius*2;
      splice.position.z=rz+lineRadius;
    }

    // Side tuck, three staggered strand tails, and the standing leg. All parts are batched into a second draw.
    const kp=[],kn=[],kc=[],ku=[],ki=[];
    function thread(points,rad,tint,segments,sides=8,turns=0){
      const path=new T.CatmullRomCurve3(points.map(p=>V(...p)),false,'centripetal'),frames=path.computeFrenetFrames(segments,false);
      const base=kp.length/3,center=V(),u=V(),radial=V(),tangent=V();
      for(let i=0;i<=segments;i++){
        const t=i/segments,roll=turns*t*tau;path.getPointAt(t,center);const n=frames.normals[i],b=frames.binormals[i];tangent.copy(frames.tangents[i]);
        for(let j=0;j<=sides;j++){
          const a=j*tau/sides,co=Math.cos(a+roll),si=Math.sin(a+roll);
          const v=turns?profile(a):{r:1,dr:0,ply:0},r=(typeof rad==='function'?rad(t):rad);
          u.copy(n).multiplyScalar(co).addScaledVector(b,si);
          kp.push(center.x+r*v.r*u.x,center.y+r*v.r*u.y,center.z+r*v.r*u.z);
          radial.copy(n).multiplyScalar(v.r*co+v.dr*si).addScaledVector(b,v.r*si-v.dr*co);
          if(turns)radial.addScaledVector(tangent,r*turns*tau/path.getLength()*v.dr*v.r);
          radial.normalize();kn.push(radial.x,radial.y,radial.z);
          const col=Array.isArray(tint)?tint[v.ply]:tint,grain=.96+.055*Math.sin(i*.72+j*.69);
          kc.push(col.r*grain,col.g*grain,col.b*grain);ku.push(t*Math.max(1,Math.abs(turns))*1.2,j/sides);
          if(i<segments&&j<sides){const id=base+i*(sides+1)+j,bk=id+sides+1;ki.push(id,id+1,bk,id+1,bk+1,bk);}
        }
      }
    }
    // The collar and the last tuck remain outside the body's near edge at +Z.
    thread([[-.035,0,-.007],[-.019,.003,-.001],[-.006,.006,.013],[.004,.006,.035],[.004,.001,.070],[0,0,.112],[0,0,.130]],
      t=>.0143+.0031*Math.sin(Math.PI*t),straw,70,18,1.70);
    thread([[.038,-.003,-.005],[.029,-.003,.005],[.018,.002,.014],[.012,.007,.030],[.013,.009,.055],[.009,.003,.079]],t=>.0122*(1-.47*t),straw,48,15,1.42);
    for(let i=0;i<3;i++){
      const a=i*tau/3,start=.015+i*.011,rr=.0155;
      const pts=[];for(let j=0;j<=14;j++){
        const u=j/14,theta=a+u*3.2,z=start+u*(.037+i*.005),radius=rr*(1-.20*u);
        pts.push([.003+radius*Math.cos(theta),.004+radius*Math.sin(theta),z]);}
      thread(pts,t=>.0059*(1-t*.61),straw[(i+1)%3],28,7);
    }
    function seize(z0,z1,r,wind,tint){
      const pts=[];for(let j=0;j<=wind*11;j++){const t=j/(wind*11),a=t*tau*wind;
        pts.push([r*Math.cos(a),r*Math.sin(a),z0+(z1-z0)*t]);}
      thread(pts,.00145,tint,wind*13,6);
    }
    seize(.082,.095,.0158,7,wax);seize(.095,.100,.0159,3,rust);seize(.100,.106,.0157,3,wax);seize(.108,.112,.0157,2,tar);
    thread([[.009,.013,.080],[.008,.015,.087],[.006,.015,.096],[.005,.015,.106],[.002,.014,.116]],.00135,tar,14,6);
    const kg=own(new T.BufferGeometry());
    kg.setAttribute('position',new T.Float32BufferAttribute(kp,3));kg.setAttribute('normal',new T.Float32BufferAttribute(kn,3));
    kg.setAttribute('color',new T.Float32BufferAttribute(kc,3));kg.setAttribute('uv',new T.Float32BufferAttribute(ku,2));kg.setIndex(ki);kg.computeBoundingSphere();
    const tucks=new T.Mesh(kg,mat);tucks.name='缆尾逐股接入主绳';tucks.castShadow=tucks.receiveShadow=true;splice.add(tucks);
    const knot=V(),where=V(),unit=V(1,1,1),q=new T.Quaternion(),euler=new T.Euler(0,0,0,'YXZ'),world=new T.Matrix4(),dry=new T.Color(0xffffff),wetTint=new T.Color(0xb6afa2);
    let lastX=NaN,lastZ=NaN,lastWet=-1,freed=false;body.visible=false;
    function update(frame){
      const c=frame?.position||frame?.center||frame;
      if(!c||frame.visible===false||![c.x,c.y,c.z,frame.rx,frame.rz].every(Number.isFinite)||frame.rx<=0||frame.rz<=0){body.visible=false;return;}
      body.visible=true;
      if(lastX!==frame.rx||lastZ!==frame.rz){form(frame.rx,frame.rz);lastX=frame.rx;lastZ=frame.rz;}
      const wet=Math.min(1,Math.max(0,Number(frame.wet)||0));if(wet!==lastWet){
        mat.roughness=.82-.34*wet;mat.color.copy(dry).lerp(wetTint,.87*wet);lastWet=wet;}
      where.set(c.x,c.y,c.z);euler.set(Number(frame.tilt)||0,-(Number(frame.yaw)||0),0,'YXZ');
      q.setFromEuler(euler);world.compose(where,q,unit);parent.updateWorldMatrix(true,false);
      body.matrix.copy(parent.matrixWorld).invert().multiply(world);body.matrixWorldNeedsUpdate=true;
      knot.set(0,0,frame.rz+lineRadius+.130).applyMatrix4(world);
    }
    function dispose(){if(freed)return;freed=true;parent.remove(body);allocated.forEach(item=>item.dispose());allocated.clear();}
    return {update,knot,dispose};
  }
  return {create};
})();
