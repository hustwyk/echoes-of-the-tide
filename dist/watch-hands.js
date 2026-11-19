// A Tang on Hai Yan's aft deck. All dimensions, reach targets, and pivots are
// ship-local metres. The viewport enables layer 13 only for this lookout's eyes.
const TideWatchHands=(()=>{
  'use strict';
  const layer=13,clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n)),mix=(a,b,t)=>a+(b-a)*t;
  function ramp(a,b,x){const f=clamp((x-a)/(b-a));return f*f*(3-2*f);}
  function create(ship){
    const T=THREE,V=()=>new T.Vector3(),Q=()=>new T.Quaternion(),U=Math.PI*2;
    const root=new T.Group();root.name='阿棠 · 艉栏近场';root.visible=false;ship.add(root);
    const geometries=new Set(),materials=new Set(),textures=new Set();
    const geo=g=>(geometries.add(g),g),mat=m=>(materials.add(m),m),map=t=>(textures.add(t),t);
    const newMat=(c,m,r,options)=>mat(new T.MeshStandardMaterial({color:c,metalness:m,roughness:r,...options}));
    const random=(x,y)=>{let v=Math.imul(x+913,1597334677)^Math.imul(y+613,3812015801);v=Math.imul(v^(v>>>16),1103515245);return(v>>>0)/4294967296;};
    const v0=V(),v1=V(),euler=new T.Euler(),basis=new T.Matrix4(),rot=Q();
    const frame=(x,y,z,q)=>q.setFromRotationMatrix(basis.makeBasis(x,y,z));
    const cloth=(()=>{
      const n=192,hi=new Float32Array(n*n),normal=new Uint8Array(4*n*n),grey=new Uint8Array(4*n*n);
      for(let y=0;y<n;y++)for(let x=0;x<n;x++){
        const k=y*n+x,warp=Math.cos(U*x/3+.36*Math.cos(U*y/12)),weft=Math.cos(U*y/4+.28*Math.cos(U*x/24)),over=(Math.floor(x/3)+Math.floor(y/4))%2;
        const speck=random(x,y),mott=.48*Math.cos(U*x/96+1.9*Math.sin(U*y/64))+.3*Math.sin(U*y/32);
        hi[k]=.27*(over?warp:weft)+.11*(over?weft:warp)+.19*speck+.058*mott;
        const c=220+8*(over?warp:weft)+12*speck+9*mott;
        grey.set([c,c,c,255],k*4);
      }
      for(let y=0;y<n;y++)for(let x=0;x<n;x++){
        const k=y*n+x,dx=hi[y*n+(x+n-1)%n]-hi[y*n+(x+1)%n],dy=hi[((y+1)%n)*n+x]-hi[((y+n-1)%n)*n+x],f=127/Math.hypot(dx,dy,1);
        normal.set([128+dx*f,128+dy*f,128+f,255],4*k);
      }
      const tx=(pixels,srgb)=>{const im=map(new T.DataTexture(pixels,n,n));im.colorSpace=srgb?T.SRGBColorSpace:T.NoColorSpace;im.wrapS=im.wrapT=T.RepeatWrapping;im.generateMipmaps=true;im.magFilter=T.LinearFilter;im.minFilter=T.LinearMipmapLinearFilter;im.anisotropy=4;im.needsUpdate=true;return im;};
      return mat(new T.MeshPhysicalMaterial({map:tx(grey,true),normalMap:tx(normal,false),vertexColors:true,normalScale:new T.Vector2(.31,.31),roughness:.565,metalness:0,clearcoat:.29,clearcoatRoughness:.27}));
    })();
    function tubeSleeve(group,length,upper){
      // Lightweight sewn shells, not cylinders. The elbow bellows fold into
      // their counterpart; the inside of the cuff closes around the hand.
      const rings=upper?[
        [-.02,.039,.042],[.0,.066,.066],[.055,.090,.090],[.17,.087,.091],[.37,.08,.083],[.59,.073,.079],
        [.75,.069,.071],[.79,.074,.075],[.83,.066,.066],[.90,.068,.072],[.97,.059,.060],[1.04,.049,.052]
      ]:[
        [-.050,.048,.053],[.017,.063,.066],[.096,.063,.069],[.158,.059,.062],[.19,.065,.069],[.235,.062,.065],
        [.34,.058,.065],[.46,.057,.063],[.51,.059,.064],[.546,.054,.057],[.56,.057,.062],[.62,.055,.061],
        [.67,.053,.056],[.705,.056,.060],[.755,.053,.058],[.79,.051,.055],[.811,.055,.057],[.835,.053,.054],
        [.886,.047,.050],[.909,.050,.052],[.932,.045,.046],[.947,.039,.043],[.986,.036,.038],[1.025,.035,.035],[1.033,.029,.032]
      ];
      if(!upper)rings.splice(rings.findIndex(r=>r[0]>.835));
      const cols=36,pos=[],uv=[],colors=[],idx=[],col=new T.Color();
      for(let j=0;j<rings.length;j++){
        const [s,rx,rz]=rings[j];
        for(let i=0;i<=cols;i++){
          const a=i*U/cols,sp=Math.sin(a),cp=Math.cos(a);
          const swell=1+.039*Math.cos(4*a+s*7)+.037*Math.sin(3*a-s*6.5)+.025*Math.cos(7*a+s*3);
          const seam=Math.exp(-Math.pow((Math.sin(a+.86)*(1+.2*cp))/.095,2));
          const trim=!upper&&s>=.909&&s<.932,knit=!upper&&s>=.947;
          const thread=knit?.0020*Math.cos(20*a):0;
          const fold=Math.sin(U*s*4.5-.6*Math.cos(a*2))*Math.cos(a-.24)*.0015;
          pos.push(sp*(rx*swell+thread),(upper?.002:.001)*Math.sin(3*a)+(-s*length)+fold,cp*(rz*swell+thread));
          col.set(knit?'#334b49':trim?'#a3a992':seam>.6?'#733f2b':'#a55e3d');
          const worn=.94+.042*Math.cos(3*a-3*s)+.045*Math.sin(a+1)*s+.034*Math.sin(j*.61+i*1.27);
          col.multiplyScalar(worn*(knit?1:1-.062*seam));colors.push(col.r,col.g,col.b);
          uv.push(i/cols*(knit?2.9:2.05),s*(upper?2.55:2.18));
          if(j<rings.length-1&&i<cols){const n=j*(cols+1)+i;idx.push(n,n+cols+1,n+1,n+1,n+cols+1,n+cols+2);}
        }
      }
      const g=geo(new T.BufferGeometry());g.setAttribute('position',new T.Float32BufferAttribute(pos,3));
      g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();
      const ns=g.attributes.normal;
      for(let j=0;j<rings.length;j++){const a=j*(cols+1),b=a+cols;v0.fromBufferAttribute(ns,a).add(v1.fromBufferAttribute(ns,b)).normalize();ns.setXYZ(a,v0.x,v0.y,v0.z);ns.setXYZ(b,v0.x,v0.y,v0.z);}
      const mesh=new T.Mesh(g,cloth);mesh.name=upper?'桔褐防水袖 · 上臂':'皱边袖口与内层罗纹';group.add(mesh);
    }
    const donor=TideActors.person(0);
    function glove(i,wrist){
      const original=donor.userData.rig.bones['wrist'+i].getObjectByName('workGlove');
      const base=geo(original.geometry.clone());base.morphAttributes={};
      const rest=base.attributes.position,count=rest.count,toGrip=new Float32Array(count*3),toKey=new Float32Array(count*3),tint=base.attributes.color;
      // The last 12 rings and their welt make up the continuous thenar gusset.
      // The source glove's seam and underside are deformed with the pads.
      const thumbStart=count-(12*25+20+16),isHandset=i===0;
      const radius=isHandset?.0300:.0274,cy=isHandset?-.050:-.0555,cz=isHandset?-.031:-.036;
      for(let k=0;k<count;k++){
        v0.fromBufferAttribute(rest,k);const x=v0.x,y=v0.y,z=v0.z,s=-y;
        const thumb=k>=thumbStart;
        let yy=y,zz=z,xx=x,dy=0;
        if(!thumb){
          const travel=Math.max(0,s+cy),angle=Math.min(2.48,travel/(isHandset?.0325:.0309));
          const offset=.0026+.016*ramp(.066,.117,s);
          const r=Math.max(radius,(isHandset?.036:.0374)+z+offset);
          const wrap=ramp(-.005,.010,travel);
          yy=mix(y,cy-r*Math.sin(angle),wrap);zz=mix(z,cz+r*Math.cos(angle),wrap);
          const dd=Math.hypot(yy-cy,zz-cz);if(dd<radius){yy=cy+(yy-cy)*radius/(dd||1);zz=cz+(zz-cz)*radius/(dd||1);}
        }else if(isHandset){
          const w=ramp(.036,.076,s);
          // Tip faces the handset's sprung side switch. The glove and its
          // thumb press together as a single mesh while the rubber key moves.
          yy-=.0066*w;zz+=.0027*w;dy=.0052*w;
        }else{
          const w=ramp(.035,.078,s);yy+=.019*w;zz-=.006*w;
          const rr=Math.hypot(yy-cy,zz-cz);if(rr<radius){yy=cy+(yy-cy)*radius/(rr||1);zz=cz+(zz-cz)*radius/(rr||1);}
        }
        toGrip.set([xx,yy,zz],3*k);toKey.set([xx,yy+dy,zz],3*k);
        const h=1+.055*Math.sin(x*196+Math.cos(y*81))+.031*Math.cos(y*37+x*78);
        tint.setXYZ(k,tint.getX(k)*.91*h,tint.getY(k)*1.05*h,tint.getZ(k)*1.10*h);
      }
      const norms=coordinates=>{
        const temp=new T.BufferGeometry();temp.setIndex(base.index);temp.setAttribute('position',new T.BufferAttribute(coordinates,3));temp.computeVertexNormals();const n=temp.attributes.normal;temp.dispose();return n;
      };
      base.morphAttributes.position=[new T.BufferAttribute(toGrip,3),new T.BufferAttribute(toKey,3)];base.morphAttributes.normal=[norms(toGrip),norms(toKey)];
      base.computeBoundingSphere();const glove=new T.Mesh(base,original.material);glove.name=isHandset?'阿棠左手 · 压手台侧键':'阿棠右手 · 扣艉栏';wrist.add(glove);
      return glove;
    }
    function makeGaiter(lower){
      // A closed knitted wrist sleeve between two moving openings. Its
      // straight elastic axis keeps the inside of the bend from folding
      // through itself, even at the ninety-degree transom grip.
      const count=40,pos=[],co=[],uv=[],idx=[],color=new T.Color();
      const profile=[[-.35,.002],[-.29,.033],[-.15,.046],[-.045,.054],[.02,.054],
        [.10,.053],[.135,.0534],[.18,.0517],[.23,.0506],[.28,.049],[.34,.047],
        [.40,.045],[.50,.043],[.63,.0405],[.75,.0386],[.87,.0364],[.97,.032],
        [1.06,.028],[1.15,.022],[1.22,.010],[1.24,.0005]];
      for(let j=0;j<profile.length;j++)for(let i=0;i<count;i++){
        const [t,r]=profile[j],a=i*U/count,knit=t>.28,sp=Math.sin(a),cp=Math.cos(a);
        const rib=knit?.00070*Math.cos(20*a):.0003*Math.cos(7*a+t*12);
        pos.push(sp*(r+rib),-t,cp*(r*(knit?.88:.98)+rib));
        color.set(t<.135?'#875039':t<.23?'#b2ad95':t<.30?'#77553e':'#394c49');
        color.multiplyScalar(.95+.049*Math.cos(a*20)+.029*Math.sin(j*2.3+a*8));
        co.push(color.r,color.g,color.b);uv.push(i/count*2.6,t*.40);
        if(j<profile.length-1){const n=j*count+i,k=j*count+(i+1)%count;idx.push(n,n+count,k,k,n+count,k+count);}
      }
      const g=geo(new T.BufferGeometry());g.setIndex(idx);g.setAttribute('position',new T.Float32BufferAttribute(pos,3));
      g.setAttribute('color',new T.Float32BufferAttribute(co,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));
      // Normals must describe the actual 4cm band, not the unit-length template.
      const pa=g.attributes.position;for(let i=0;i<pa.count;i++)pa.setY(i,pa.getY(i)*.054);
      g.computeVertexNormals();const mesh=new T.Mesh(g,cloth);mesh.name='防水袖口 · 弯腕罗纹';lower.add(mesh);
      const end=V(),axis=V(),down=new T.Vector3(0,-1,0);
      mesh.position.set(0,-.208,0);
      return wrist=>{
        end.set(0,-.013,0).applyQuaternion(wrist.quaternion).add(wrist.position);
        axis.subVectors(end,mesh.position);mesh.scale.y=axis.length()/.054;
        mesh.quaternion.setFromUnitVectors(down,axis.normalize());
      };
    }
    function makeArm(i){
      const upper=new T.Group(),lower=new T.Group(),wrist=new T.Group();
      upper.name=i?'右侧油布袖':'左侧油布袖';lower.name='屈肘';wrist.name='腕口';
      upper.add(lower);lower.add(wrist);root.add(upper);lower.position.y=-.285;wrist.position.y=-.253;
      tubeSleeve(upper,.285,true);tubeSleeve(lower,.253,false);
      return {upper,lower,wrist,sew:makeGaiter(lower),glove:glove(i,wrist)};
    }
    const arms=[makeArm(0),makeArm(1)];
    const radio=new T.Group();radio.name='海雁号夹持手台';root.add(radio);
    const shell=newMat(0x343e3d,.20,.57),rubber=newMat(0x202a29,.03,.71),steel=newMat(0x92948a,.67,.42),ivory=newMat(0xc5bda1,.05,.68);
    // Fine mould grain under the original engraving. One atlas is shared by
    // the thermoplastic case, tyre-like corner bumpers, boot and switch.
    {
      const n=128,grey=new Uint8Array(n*n*4),rough=new Uint8Array(n*n*4);
      for(let y=0;y<n;y++)for(let x=0;x<n;x++){
        const i=y*n+x,g=random(x,y),scratch=Math.cos((x+7*y)*.78)>.988&&random((x/19)|0,(y/5)|0)>.79;
        const c=221+27*g+(scratch?6:0);grey.set([c,c,c,255],i*4);
        const r=scratch?90:168+74*g;rough.set([r,r,r,255],i*4);
      }
      function skin(p,srgb){const t=map(new T.DataTexture(p,n,n));t.colorSpace=srgb?T.SRGBColorSpace:T.NoColorSpace;t.wrapS=t.wrapT=T.RepeatWrapping;t.magFilter=T.LinearFilter;t.minFilter=T.LinearMipmapLinearFilter;t.generateMipmaps=true;t.needsUpdate=true;return t;}
      const alb=skin(grey,true),rgh=skin(rough,false);
      for(const m of [shell,rubber]){m.map=alb;m.roughnessMap=rgh;m.bumpMap=rgh;m.bumpScale=.00022;m.needsUpdate=true;}
    }
    const lens=newMat(0x87523c,.17,.35,{emissive:0xff814b,emissiveIntensity:0});
    function mesh(parent,g,m,x,y,z){const o=new T.Mesh(g,m);o.position.set(x,y,z);parent.add(o);return o;}
    function box(parent,x,y,z,w,h,d,m){return mesh(parent,new T.BoxGeometry(w,h,d),m,x,y,z);}
    function roundBox(parent,x,y,z,w,h,d,r,m){
      const shape=new T.Shape();shape.moveTo(-w/2+r,-h/2);shape.lineTo(w/2-r,-h/2);shape.quadraticCurveTo(w/2,-h/2,w/2,-h/2+r);
      shape.lineTo(w/2,h/2-r);shape.quadraticCurveTo(w/2,h/2,w/2-r,h/2);shape.lineTo(-w/2+r,h/2);shape.quadraticCurveTo(-w/2,h/2,-w/2,h/2-r);
      shape.lineTo(-w/2,-h/2+r);shape.quadraticCurveTo(-w/2,-h/2,-w/2+r,-h/2);shape.closePath();
      return mesh(parent,new T.ExtrudeGeometry(shape,{depth:d-.003,bevelEnabled:true,bevelThickness:.0015,bevelSize:.0013,bevelSegments:2,curveSegments:5}),m,x,y,z-d*.5+.0015);
    }
    function cylinder(parent,x,y,z,r1,r2,h,m,segments=16){return mesh(parent,new T.CylinderGeometry(r1,r2,h,segments),m,x,y,z);}
    roundBox(radio,0,0,0,.057,.134,.035,.007,shell);
    roundBox(radio,0,-.049,.0001,.058,.036,.037,.004,rubber);
    roundBox(radio,0,.039,.0185,.051,.044,.004,.005,rubber);
    for(let j=0;j<8;j++){
      const w=.036*Math.sqrt(1-Math.pow((j-3.5)/5.3,2));
      roundBox(radio,.0003,.0253+j*.0039,.0213,w,.0015,.0016,.0006,shell);
    }
    for(const x of [-.024,.024])for(const y of [-.057,.059]){
      const pin=cylinder(radio,x,y,.019,.0014,.0014,.0017,steel,8);pin.rotation.x=Math.PI/2;
      box(radio,x,y,.0201,.0018,.00032,.0004,rubber).rotation.z=1.12*x*40;
    }
    cylinder(radio,-.016,.072,-.001,.007,.008,.010,steel);
    cylinder(radio,-.016,.106,-.001,.0046,.0062,.062,rubber);
    cylinder(radio,-.016,.139,-.001,.0028,.0048,.006,rubber);
    cylinder(radio,.012,.074,.001,.008,.008,.014,rubber,22);
    for(let j=0;j<8;j++){const a=U*j/8;box(radio,.012+Math.sin(a)*.0078,.074,.001+Math.cos(a)*.0078,.0018,.011,.0012,shell).rotation.y=a;}
    box(radio,.012,.081,.003,.0016,.001,.005,ivory);
    const lamp=cylinder(radio,.021,.061,.020,.00155,.00155,.0018,lens);lamp.rotation.x=Math.PI/2;
    roundBox(radio,0,-.019,.018,.050,.021,.0025,.0013,rubber);
    const canvas=document.createElement('canvas');canvas.width=256;canvas.height=100;
    const ctx=canvas.getContext('2d');ctx.fillStyle='#8f9682';ctx.fillRect(0,0,256,100);
    for(let i=0;i<1800;i++){ctx.fillStyle=random(i,91)>.44?'rgba(213,206,172,.19)':'rgba(49,54,45,.19)';ctx.fillRect(random(i,23)*256,random(i,25)*100,1+random(i,49)*3.7,1.1);}
    ctx.fillStyle='#303e3d';ctx.font='600 37px sans-serif';ctx.fillText('海 雁　03',17,45);ctx.font='19px monospace';ctx.fillText('DECK  /  AFT',19,76);
    const labelMap=map(new T.CanvasTexture(canvas));labelMap.colorSpace=T.SRGBColorSpace;labelMap.anisotropy=4;
    const labelMat=newMat(0xf7fcf2,.08,.73,{map:labelMap});
    mesh(radio,new T.PlaneGeometry(.045,.017),labelMat,0,-.019,.0200);
    // Squared bumper, flexible boot, and captured switch cap. The antenna and
    // speaker face remain part of the instrument when A Tang brings it to his mouth.
    roundBox(radio,.0288,.014,.001,.004,.046,.024,.0018,rubber);
    const button=roundBox(radio,.0328,.0105,-.001,.0042,.031,.016,.002,rubber);button.name='发射橡胶侧键';
    const movingKey=new T.Group();radio.add(movingKey);radio.remove(button);movingKey.add(button);
    for(let j=0;j<4;j++){box(movingKey,.0351,.0056+j*.0039,-.001,.0008,.00085,.009,rubber);}
    for(let j=0;j<6;j++)roundBox(radio,-.0294,-.037+j*.0062,-.004,.0012,.0018,.024,.0005,rubber);
    const keeper=mesh(radio,new T.TorusGeometry(.005,.0012,6,14),steel,-.019,-.067,.003);keeper.rotation.y=.71;
    function batch(parent,skip){
      const buckets=new Map();
      for(const o of parent.children.slice()){
        if(o===skip||!o.isMesh)continue;o.updateMatrix();
        const g=o.geometry,pos=g.attributes.position,norm=g.attributes.normal,uv=g.attributes.uv,index=g.index;
        let b=buckets.get(o.material);if(!b)buckets.set(o.material,b={p:[],n:[],u:[],i:[]});
        const off=b.p.length/3,normalMat=new T.Matrix3().getNormalMatrix(o.matrix);
        for(let i=0;i<pos.count;i++){
          v0.fromBufferAttribute(pos,i).applyMatrix4(o.matrix);b.p.push(v0.x,v0.y,v0.z);
          v0.fromBufferAttribute(norm,i).applyNormalMatrix(normalMat);b.n.push(v0.x,v0.y,v0.z);b.u.push(uv.getX(i),uv.getY(i));
        }
        const count=index?index.count:pos.count;for(let i=0;i<count;i++)b.i.push(off+(index?index.getX(i):i));
        parent.remove(o);g.dispose();
      }
      for(const [m,b] of buckets){const g=geo(new T.BufferGeometry());g.setIndex(b.i);g.setAttribute('position',new T.Float32BufferAttribute(b.p,3));g.setAttribute('normal',new T.Float32BufferAttribute(b.n,3));g.setAttribute('uv',new T.Float32BufferAttribute(b.u,2));g.computeBoundingSphere();parent.add(new T.Mesh(g,m));}
    }
    batch(radio,movingKey);batch(movingKey);
    root.traverse(o=>{o.layers.set(layer);if(o.isMesh){o.castShadow=false;o.receiveShadow=true;}});
    const yAxis=new T.Vector3(0,1,0),down=new T.Vector3(0,-1,0),railX=new T.Vector3(1,0,0),railY=new T.Vector3(0,0,-1);
    const railRoll=Q().setFromAxisAngle(railX,-.56),railFrame=frame(railX,railY,yAxis,Q()).premultiply(railRoll);
    const rimWrist=new T.Vector3(0,.036,-.0555).applyQuaternion(railRoll);
    const handOnRadio=frame(new T.Vector3(0,-1,0),new T.Vector3(-1,0,0),new T.Vector3(0,0,-1),Q());
    const radioWrist=new T.Vector3(-.043,-.024,-.035);
    const eye=V(),forward=V(),right=V(),back=V(),radioBack=V(),radioUp=V(),radioRight=V(),shoulder=V(),elbowDir=V(),goal=V(),rest=V(),handQ=Q(),refQ=Q();
    const direction=V(),hinge=V(),pole=V(),quat=Q(),from=V(),to=V();
    function solve(a,tip,handRot,body,poleWorld){
      const l=.285,k=.253;direction.subVectors(tip,body);
      const dist=clamp(direction.length(),l-k+.0001,l+k-.0002);
      direction.normalize();pole.copy(poleWorld).addScaledVector(direction,-poleWorld.dot(direction));
      if(pole.lengthSq()<.00001)pole.copy(yAxis).addScaledVector(direction,-direction.y);pole.normalize();
      const along=(l*l-k*k+dist*dist)/(2*dist);
      hinge.copy(direction).multiplyScalar(along).addScaledVector(pole,Math.sqrt(Math.max(0,l*l-along*along)));
      a.upper.position.copy(body);a.upper.quaternion.setFromUnitVectors(down,from.copy(hinge).normalize());
      to.copy(direction).multiplyScalar(dist).sub(hinge).normalize().applyQuaternion(quat.copy(a.upper.quaternion).invert());
      a.lower.quaternion.setFromUnitVectors(down,to);
      a.wrist.quaternion.copy(quat.copy(a.upper.quaternion).multiply(a.lower.quaternion).invert()).multiply(handRot);
      a.sew(a.wrist);return dist;
    }
    let heldX=null,regrip=null;
    function update(g){
      const f=g?.lastPass&&TideSternWatch.frame(g);root.visible=!!f;
      if(!f){heldX=null;regrip=null;return;}
      eye.fromArray(f.eye);forward.fromArray(f.at).sub(eye);forward.y=0;
      if(forward.lengthSq()<.000001)forward.set(1,0,0);else forward.normalize();
      right.crossVectors(forward,yAxis).normalize();back.copy(forward).negate();
      const brace=clamp(f.brace||0),call=clamp(f.raise||0),age=1-call,walk=clamp((f.speed||0)/1.5),step=f.step||0;
      // The simulation latches raise=1 on the key edge and decays it over
      // .93 s. Lift into the syllable before lowering; never teleport on press.
      const talk=call>0?ramp(0,.17,age)*(1-ramp(.59,1,age)):0;
      const pulse=Math.sin(step),a=clamp(brace*ramp(7.74,8.29,f.z)),settle=ramp(.03,.92,a);
      if(a<.44){heldX=null;regrip=null;}
      const safe=x=>x>.454&&x<.661?(x<.555?.454:.661):clamp(x,-1.64,1.54);
      const nearX=safe(f.x+.265);
      if(a>.91&&heldX===null)heldX=nearX;
      if(heldX!==null&&!regrip&&Math.abs(heldX-nearX)>.144){
        regrip={from:heldX,to:safe(nearX+.037*Math.sign(nearX-heldX)),at:g.time};
      }
      let railGrip=heldX===null?nearX:heldX,slip=0;
      if(regrip){
        const u=ramp(0,.245,g.time-regrip.at);
        railGrip=mix(regrip.from,regrip.to,u);slip=Math.sin(Math.PI*u);
        if(u>=1){heldX=regrip.to;regrip=null;}
      }
      const body=(i,out)=>{
        out.set(f.x,eye.y-mix(.205,.171,a),f.z+.13*a);
        return out.addScaledVector(forward,-.056+.075*a).addScaledVector(right,i?.169:-.169);
      };
      // The working hand carries a real handset, low on the march and up at
      // the left corner of the face when transmitting. Its speaker faces in.
      const pressure=call>0?ramp(0,.12,age)*(1-ramp(.64,.91,age)):0;
      radio.position.copy(eye).addScaledVector(forward,mix(.325,.324,talk)+pulse*walk*.035)
        .addScaledVector(right,-mix(.113,.091,talk)-.013*walk*Math.cos(step));
      radio.position.y+=mix(-mix(.414,.279,a),-.121,talk)+.025*walk*pulse;
      radioRight.copy(right);radioBack.copy(back).multiplyScalar(.96).addScaledVector(right,-.255+.085*talk).addScaledVector(yAxis,.095+.13*talk).normalize();
      radioRight.crossVectors(yAxis,radioBack).normalize();radioUp.crossVectors(radioBack,radioRight).normalize();
      frame(radioRight,radioUp,radioBack,radio.quaternion);
      radio.quaternion.multiply(rot.setFromEuler(euler.set(-.06+.108*talk,.015,-.127+.136*talk)));
      goal.copy(radioWrist).applyQuaternion(radio.quaternion).add(radio.position);handQ.copy(radio.quaternion).multiply(handOnRadio);
      body(0,shoulder);elbowDir.copy(right).multiplyScalar(-.41).addScaledVector(back,.38).addScaledVector(yAxis,-.95);
      solve(arms[0],goal,handQ,shoulder,elbowDir);
      arms[0].glove.morphTargetInfluences[0]=1-pressure;arms[0].glove.morphTargetInfluences[1]=pressure;
      movingKey.position.x=-.0040*pressure;lens.emissiveIntensity=.55*pressure;
      // The transom's top tube runs horizontally along local X. Hooking four
      // pads over it fixes both the wrist and the purchase to the moving hull.
      goal.copy(eye).addScaledVector(forward,.283-.083*walk*pulse).addScaledVector(right,.141);
      goal.y+=-.483-.045*walk*pulse;
      rest.set(railGrip,2.10+.027*slip,8.70-.018*slip).add(rimWrist);
      goal.lerp(rest,settle);
      body(1,shoulder);
      frame(right,yAxis,back,refQ).multiply(rot.setFromEuler(euler.set(-.17,.18,.035+.086*pulse*walk)));
      handQ.copy(refQ).slerp(railFrame,settle);
      elbowDir.copy(right).multiplyScalar(.59-.39*a).addScaledVector(back,.51).addScaledVector(yAxis,-.77);
      solve(arms[1],goal,handQ,shoulder,elbowDir);
      arms[1].glove.morphTargetInfluences[0]=settle*(1-.32*slip);arms[1].glove.morphTargetInfluences[1]=0;
      root.updateWorldMatrix(true,true);
    }
    return {update,dispose(){root.removeFromParent();for(const g of geometries)g.dispose();for(const m of materials)m.dispose();for(const t of textures)t.dispose();}};
  }
  return {layer,create};
})();
