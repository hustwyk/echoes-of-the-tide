/* North Cape hand-bearing compass. Angles are world radians, clockwise from -Z. */
window.TideSternCompass = (() => {
  'use strict';
  const T=THREE, layer=12, turn=2*Math.PI;
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  const numeral=n=>String(((n%360)+360)%360).padStart(3,'0');
  function create(scene){
    const root=new T.Group(), instrument=new T.Group(), card=new T.Group(), bug=new T.Group();
    root.name='后甲板 · 手持测向罗经';root.add(instrument);
    instrument.add(card,bug);root.visible=false;root.matrixAutoUpdate=false;scene.add(root);
    const geometries=new Set(),materials=new Set(),maps=new Set();
    const own=(s,v)=>(s.add(v),v);
    function tex(w,h,draw,colour=true){
      const c=document.createElement('canvas');c.width=w;c.height=h;const ctx=c.getContext('2d');draw(ctx,w,h);
      const im=own(maps,new T.CanvasTexture(c));if(colour)im.colorSpace=T.SRGBColorSpace;
      im.anisotropy=4;return im;
    }
    const solid=(color,metalness,roughness,options={})=>own(materials,new T.MeshStandardMaterial({color,metalness,roughness,...options}));
    const ink=(options)=>own(materials,new T.MeshBasicMaterial(options));
    function mesh(parent,geo,mat,x=0,y=0,z=0,name=''){
      const m=new T.Mesh(own(geometries,geo),mat);
      m.name=name;m.position.set(x,y,z);parent.add(m);return m;
    }
    const box=(parent,mat,x,y,z,w,h,d)=>mesh(parent,new T.BoxGeometry(w,h,d),mat,x,y,z);
    function shell(parent,mat,profile,n=96){
      return mesh(parent,new T.LatheGeometry(profile.map(p=>new T.Vector2(p[0],p[1])),n),mat);
    }
    function rod(parent,mat,a,b,r,n=10){
      const end=new T.Vector3(...b),start=new T.Vector3(...a),axis=end.sub(start),mid=start.clone().addScaledVector(axis,.5);
      const m=mesh(parent,new T.CylinderGeometry(r,r,axis.length(),n),mat,mid.x,mid.y,mid.z);
      m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),axis.normalize());return m;
    }
    function cyl(parent,mat,x,y,z,upper,lower,height,n=28){
      return mesh(parent,new T.CylinderGeometry(upper,lower,height,n),mat,x,y,z);
    }
    function flat(parent,m,r,y){
      const disk=mesh(parent,new T.CircleGeometry(r,100),m,0,y,0);disk.rotation.x=-Math.PI/2;return disk;
    }
    let seed=87102;
    const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
    const relief=tex(512,256,(c,w,h)=>{
      const a=c.createImageData(w,h);for(let i=0;i<a.data.length;i+=4){
        const k=130+Math.round((random()+random()-1)*83);
        a.data[i]=a.data[i+1]=a.data[i+2]=k;a.data[i+3]=255;
      }c.putImageData(a,0,0);
      for(let i=0;i<230;i++){
        const x=random()*w,y=random()*h;c.strokeStyle='rgba(36,36,36,.44)';c.lineWidth=.5+random()*.9;
        c.beginPath();c.moveTo(x,y);c.quadraticCurveTo(x+3,y+.6,x+3+7*random(),y-2.2+random()*5);c.stroke();
      }
    },false);relief.wrapS=relief.wrapT=T.RepeatWrapping;
    const aged=tex(1024,256,(c,w,h)=>{
      c.fillStyle='#c8c9b9';c.fillRect(0,0,w,h);
      for(let k=0;k<200;k++){
        const x=random()*w,y=random()*h,r=3+random()*32;
        const tint=c.createRadialGradient(x,y,0,x,y,r);tint.addColorStop(0,k%3?'#6a746b33':'#f5e8d044');tint.addColorStop(1,'#9a9f9000');
        c.fillStyle=tint;c.fillRect(x-r,y-r,r*2,r*2);
      }
      for(let k=0;k<540;k++){
        const x=random()*w,y=random()*h;c.strokeStyle=k%5?'#f7e9d424':'#535c5935';c.lineWidth=.38+random()*.91;
        c.beginPath();c.moveTo(x,y);c.quadraticCurveTo(x+2,y+1.2,x+2+random()*13,y+random()*4-2);c.stroke();
      }
    });aged.wrapS=T.RepeatWrapping;
    const rubber=solid(0x47534c,.04,.74,{map:aged,bumpMap:relief,bumpScale:.00018});
    const rubberLip=solid(0x1e2c2a,.07,.61);
    const oldBrass=solid(0xac8a58,.72,.44,{map:aged,bumpMap:relief,bumpScale:.000043});
    const machined=solid(0xc6a369,.80,.33);
    const gunmetal=solid(0x475454,.55,.46);
    const black=solid(0x273632,.38,.44),dark=solid(0x1b2522,.18,.64);
    const silver=solid(0xb7bbae,.80,.34);
    const ivory=solid(0xe6ddb7,.14,.46,{emissive:0x271f0c,emissiveIntensity:.22});
    const red=solid(0xb8573b,.44,.51,{emissive:0x2c0a04,emissiveIntensity:.21});
    const weave=tex(256,256,(c,w,h)=>{
      c.fillStyle='#a7afb3';c.fillRect(0,0,w,h);
      for(let y=0;y<h;y+=3)for(let x=-2;x<w;x+=4){
        c.fillStyle=(x+y)%3?'#bac0bc':'#98a4a3';c.fillRect(x+((y/3)%2)*2,y,2.9,1.45);
      }
    });weave.wrapS=weave.wrapT=T.RepeatWrapping;
    const cloth=solid(0x46555b,.01,.90,{map:weave,bumpMap:relief,bumpScale:.00024});
    const leather=solid(0x817254,.05,.72,{map:aged,bumpMap:relief,bumpScale:.00022});
    const thread=solid(0x86785d,.03,.88);
    // Ribbed compression jacket, slightly flattened at the original press marks.
    const jacket=shell(instrument,rubber,[[3,-16.3],[33,-16.3],[42.6,-13.2],[48.9,-8.6],
      [50.1,-4.5],[50.3,-1.6],[49.8,1.2],[49,3.1],[47.4,4.2],[45.2,3.4]],288);
    const pts=jacket.geometry.attributes.position;
    for(let i=0;i<pts.count;i++){
      const x=pts.getX(i),y=pts.getY(i),z=pts.getZ(i),r=Math.hypot(x,z),a=Math.atan2(x,z);
      const band=clamp((y+14)/8,0,1)*clamp((4.0-y)/5.5,0,1);
      const heel=Math.max(0,Math.cos(34*a+.12*Math.sin(a*4))-.11);
      const ding=Math.exp(-Math.pow((a-.61)/.08,2))+.65*Math.exp(-Math.pow((a+1.26)/.046,2));
      const k=r?(r+band*(heel*1.32-ding*1.2))/r:1;pts.setXYZ(i,x*k,y,z*k);
    }jacket.geometry.computeVertexNormals();
    shell(instrument,rubberLip,[[46.2,-10.3],[47.7,-9.7],[48.4,-8.7],[48.1,-8.1]]);
    shell(instrument,oldBrass,[[43.6,1.8],[47.1,3.7],[47.2,5.1],[46.7,5.9],[44.4,6.2],
      [43.6,5.4],[42.8,4.1],[42.4,2.25]]);
    shell(instrument,machined,[[43.45,5.28],[43.83,5.62],[44.15,5.86],[44.01,6.05]]);
    shell(instrument,black,[[42.45,2.2],[42.77,4.46],[42.52,4.82],[41.86,4.1],[41.44,2.24]]);
    const face=tex(1024,1024,(c,w,h)=>{
      const ox=w/2,oy=h/2;c.translate(ox,oy);
      const grad=c.createRadialGradient(-88,-114,21,0,0,510);grad.addColorStop(0,'#43514a');grad.addColorStop(.67,'#31413c');grad.addColorStop(1,'#25352f');
      c.fillStyle=grad;c.fillRect(-ox,-oy,w,h);
      function ring(r,col,l){c.strokeStyle=col;c.lineWidth=l;c.beginPath();c.arc(0,0,r,0,turn);c.stroke();}
      for(let j=0;j<7500;j++){c.fillStyle=random()>.53?'#c7c0a310':'#07141410';c.fillRect(random()*w-ox,random()*h-oy,1+random()*2,1);}
      ring(492,'#8c8f72',1.7);ring(408,'#898d73',1.3);ring(256,'#89947a',1.4);ring(242,'#687761',1);ring(74,'#819074',1.8);
      c.textAlign='center';c.textBaseline='middle';
      for(let d=0;d<360;d++){
        c.save();c.rotate(d*Math.PI/180);
        const major=d%10===0,minor=d%5===0;
        c.fillStyle=d===0?'#d69163':major?'#ede0b8':minor?'#cbbf99':'#b7baa0';
        const len=major?51:minor?40:22,l=major?4.2:minor?3:1.5;c.fillRect(-l/2,-488,l,len);
        if(major){
          c.font='600 '+(d%30===0?'34':'25')+'px Arial, sans-serif';
          c.fillText(numeral(d),0,-427);
        }
        c.restore();
      }
      const dirs=['N','NE','E','SE','S','SW','W','NW'];
      for(let i=0;i<8;i++){
        c.save();c.rotate(i*Math.PI/4);
        const far=i%2?244:301,wide=i%2?9:19;
        c.fillStyle=i===0?'#ce7857':'#bac1a4';c.beginPath();c.moveTo(0,-far);c.lineTo(0,-80);c.lineTo(-wide,-92);c.closePath();c.fill();
        c.fillStyle=i===0?'#95573f':'#6b7c67';c.beginPath();c.moveTo(0,-far);c.lineTo(wide,-92);c.lineTo(0,-80);c.closePath();c.fill();
        c.font=(i%2?'500 23':'600 47')+'px Arial, sans-serif';c.fillStyle=i===0?'#e29c70':'#dbd7af';c.fillText(dirs[i],0,i%2?-311:-354);c.restore();
      }
      c.font='500 14px Arial, sans-serif';c.fillStyle='#abae92';c.fillText('BEARING',0,131);c.fillText('No. 204',0,153);
    });
    flat(card,solid(0xffffff,.14,.70,{map:face,emissive:0xffffff,emissiveMap:face,emissiveIntensity:.12}),41.72,2.43);
    const glaze=tex(512,512,(c,w,h)=>{
      c.clearRect(0,0,w,h);
      const grad=c.createLinearGradient(0,0,w,h);grad.addColorStop(0,'rgba(192,215,203,.11)');grad.addColorStop(.35,'rgba(119,169,166,.015)');grad.addColorStop(.65,'rgba(123,159,149,.01)');grad.addColorStop(1,'rgba(125,157,139,.08)');c.fillStyle=grad;c.fillRect(0,0,w,h);
      for(let i=0;i<72;i++){
        const a=random()*turn,r=179+70*random(),x=256+r*Math.cos(a),y=256+r*Math.sin(a);
        c.strokeStyle='rgba(216,221,190,'+(.05+random()*.11)+')';c.lineWidth=.3+random()*.6;
        c.beginPath();c.moveTo(x,y);c.lineTo(x+3+random()*7,y+random()*4-2);c.stroke();
      }
    });
    flat(instrument,ink({map:glaze,transparent:true,depthWrite:false}),41.73,4.31);
    cyl(instrument,gunmetal,0,3.5,0,3.12,3.65,1.6);
    cyl(instrument,machined,0,4.75,0,2.00,2.79,1.08);
    cyl(instrument,black,0,5.4,0,.80,1.11,.58);
    for(const a of [.75,2.23,3.97,5.49]){
      const x=45.48*Math.sin(a),z=45.48*Math.cos(a);
      cyl(instrument,gunmetal,x,6.03,z,1.51,1.84,.57,18);
      const slot=box(instrument,dark,x,6.36,z,2.31,.16,.38);slot.rotation.y=a+.43;
    }
    // The red reporting rider turns with the card. Its position comes only from the last report.
    const fin=new T.Shape();fin.moveTo(-2.1,0);fin.lineTo(2.1,0);fin.lineTo(0,5.0);fin.closePath();
    const tab=mesh(bug,new T.ExtrudeGeometry(fin,{depth:.63,bevelEnabled:false}),red,0,5.43,-41.65);
    tab.rotation.x=Math.PI/2;
    box(bug,machined,0,5.77,-42.1,4.95,.65,1.54);
    bug.visible=false;
    // Low folding sight. Paired shoulders surround the free line of sight to sea.
    for(const dir of [-1,1]){
      const x=dir*11.4;
      cyl(instrument,oldBrass,x,6.28,-40,2.68,3.01,3.0);
      rod(instrument,gunmetal,[x,7.4,-40],[dir*8.9,16.8,-40.8],1.04,10);
      rod(instrument,machined,[dir*8.9,16.8,-40.8],[dir*7.2,17.9,-40.8],.95,10);
    }
    rod(instrument,gunmetal,[-7.2,17.9,-40.8],[7.2,17.9,-40.8],.62);
    rod(instrument,ivory,[0,8.05,-40.7],[0,17.57,-40.8],.23,8);
    box(instrument,red,0,6.48,-39.4,1.05,.54,6.02);
    // Rectangular brass optical frame with an actual recess around the bearing-card image.
    const prism=new T.Group();prism.position.set(0,11.5,22.6);prism.rotation.x=-.82;instrument.add(prism);
    function rounded(p,w,h,r){
      const x=w/2,y=h/2;p.moveTo(-x+r,-y);p.lineTo(x-r,-y);p.quadraticCurveTo(x,-y,x,-y+r);
      p.lineTo(x,y-r);p.quadraticCurveTo(x,y,x-r,y);p.lineTo(-x+r,y);p.quadraticCurveTo(-x,y,-x,y-r);
      p.lineTo(-x,-y+r);p.quadraticCurveTo(-x,-y,-x+r,-y);return p;
    }
    function frame(w,h,w2,h2,d,z,material){
      const shape=rounded(new T.Shape(),w,h,2.2);
      shape.holes.push(rounded(new T.Path(),w2,h2,1.02));
      return mesh(prism,new T.ExtrudeGeometry(shape,{depth:d,bevelEnabled:true,bevelSegments:2,
        bevelThickness:.32,bevelSize:.37,curveSegments:5}),material,0,0,z);
    }
    box(prism,black,0,0,-3.1,51.1,16.8,4.3);
    frame(51.8,17.1,46.3,12.2,2.3,-1.0,oldBrass);
    frame(47.24,13.1,44.3,10.2,1.23,-.64,gunmetal);
    // Twelve overlapping engraved sectors keep all 360 three-digit labels sharp
    // in the prism, including the 359/000 seam. The texture scrolls continuously.
    const sector=38,rowHeight=64,span=3.45;
    const strip=tex(2048,1024,(c,w,h)=>{
      c.fillStyle='#253b36';c.fillRect(0,0,w,h);c.textAlign='center';c.textBaseline='middle';
      for(let s=0;s<12;s++){
        const y=s*rowHeight,cell=w/sector;
        const grad=c.createLinearGradient(0,y,0,y+rowHeight);grad.addColorStop(0,'#263b34');grad.addColorStop(.40,'#405447');grad.addColorStop(.87,'#34473c');grad.addColorStop(1,'#253830');c.fillStyle=grad;c.fillRect(0,y,w,rowHeight);
        for(let k=-4;k<=34;k++){
          const deg=(s*30+k+360)%360,x=(k+4)*cell;c.fillStyle=deg===0?'#f2c196':'#f4e7ba';
          c.fillRect(x-1.3,y+5,2.6,deg%5===0?16:12);c.fillStyle='#afa98a';c.fillRect(x+.5*cell-.75,y+5,1.5,6);
          c.fillStyle=deg===0?'#ffe0af':'#f9edcc';c.font='600 25px Arial, sans-serif';c.fillText(numeral(deg),x,y+40);
        }
      }
    });
    strip.repeat.set(span/sector,54/1024);
    const optical=ink({map:strip,color:0xf5f5e7,toneMapped:false});
    mesh(prism,new T.PlaneGeometry(44.9,10.9),optical,0,0,-.22,'放大方位卡');
    const pointer=new T.Shape();pointer.moveTo(-1.43,1.4);pointer.lineTo(1.43,1.4);pointer.lineTo(0,-1.35);pointer.closePath();
    mesh(prism,new T.ShapeGeometry(pointer),ivory,0,5.26,2.18,'固定读数游标');
    const reportNotch=mesh(prism,new T.ShapeGeometry(pointer),red,0,-4.6,1.02);
    reportNotch.rotation.z=Math.PI;
    // Side focus spindle, its crimped keeper and a leather thumb passing under the rim.
    const extrusion=(parent,mat,path,sections=12)=>{
      const vs=[],uv=[],idx=[];let cumulative=0;
      for(let i=0;i<path.length;i++){
        const p=path[i],prev=path[Math.max(0,i-1)],next=path[Math.min(path.length-1,i+1)];
        const axis=new T.Vector3(next[0]-prev[0],next[1]-prev[1],next[2]-prev[2]).normalize();
        const u=new T.Vector3(1,0,0);u.addScaledVector(axis,-axis.x).normalize();const v=new T.Vector3().crossVectors(axis,u);
        if(i)cumulative+=Math.hypot(p[0]-prev[0],p[1]-prev[1],p[2]-prev[2]);
        for(let k=0;k<=sections;k++){
          const a=k*turn/sections,ca=Math.cos(a)*p[3],sa=Math.sin(a)*p[4];
          vs.push(p[0]+u.x*ca+v.x*sa,p[1]+u.y*ca+v.y*sa,p[2]+u.z*ca+v.z*sa);uv.push(k/sections,cumulative/45);
          if(i&&k){const j=i*(sections+1)+k;idx.push(j-sections-2,j-sections-1,j,j-sections-2,j,j-1);}
        }
      }
      const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(vs,3));
      geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.setIndex(idx);geo.computeVertexNormals();
      return mesh(parent,geo,mat);
    };
    const spindle=cyl(instrument,oldBrass,-30.4,5.4,21,4.2,4.2,8.4);spindle.rotation.z=Math.PI/2;
    const spindleEnd=cyl(instrument,gunmetal,-34.9,5.4,21,3.58,3.89,.97);spindleEnd.rotation.z=Math.PI/2;
    const palmPath=[[24,-12,12,10,7],[38,-13,23,15,10],[46,-16,34,18,13],[53,-22,48,17,13],[57,-27,59,15,12]];
    extrusion(instrument,leather,palmPath,20);
    extrusion(instrument,cloth,[[51,-21,46,14,12],[54,-22,51,18,15],[57,-26,59,18,15],[63,-32,70,15.8,13.6],
      [76,-46,88,17,16],[91,-73,117,22,20],[102,-100,143,24,22]],22);
    extrusion(instrument,leather,[[47,-11,26,9,7],[48,-4,18,9,7],[49,1.8,10,8.6,7.0],[46,5,4,7.4,6.3],
      [42.9,6.2,1.7,6.1,5.2],[40.6,6.6,.9,2.8,3.2],[40.2,6.6,.8,.30,.6]],18);
    const seam=[[53,1,22],[53.9,4.7,15.5],[51,8,8.4],[47.2,10.2,3.5],[44.9,11.45,1.8]];
    for(let j=1;j<seam.length;j++)rod(instrument,thread,seam[j-1],seam[j],.33,6);
    // Braze the stationary subassemblies into one draw per finish. The card,
    // report rider, finder window and its moving notch keep their own transforms.
    function batchFixed(){
      instrument.updateWorldMatrix(true,true);
      const inverse=instrument.matrixWorld.clone().invert(),basis=new T.Matrix4(),norm=new T.Matrix3(),v=new T.Vector3();
      const clusters=new Map(),fixed=[];
      function visit(obj){
        if(obj===card||obj===bug||obj===reportNotch||obj.name==='放大方位卡')return;
        if(obj.isMesh)fixed.push(obj);else for(const child of obj.children)visit(child);
      }
      visit(instrument);
      for(const m of fixed){
        if(!clusters.has(m.material))clusters.set(m.material,[]);
        clusters.get(m.material).push(m);
      }
      for(const [mat,list] of clusters){
        if(list.length<2)continue;
        const xyz=[],nrm=[],uv=[],indices=[];
        for(const m of list){
          const g=m.geometry,p=g.attributes.position,n=g.attributes.normal,q=g.attributes.uv,start=xyz.length/3;
          basis.multiplyMatrices(inverse,m.matrixWorld);norm.getNormalMatrix(basis);
          for(let k=0;k<p.count;k++){
            v.fromBufferAttribute(p,k).applyMatrix4(basis);xyz.push(v.x,v.y,v.z);
            v.fromBufferAttribute(n,k).applyNormalMatrix(norm);nrm.push(v.x,v.y,v.z);uv.push(q.getX(k),q.getY(k));
          }
          for(let k=0;k<(g.index?g.index.count:p.count);k++)indices.push(start+(g.index?g.index.getX(k):k));
          m.removeFromParent();g.dispose();geometries.delete(g);
        }
        const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(xyz,3));
        g.setAttribute('normal',new T.Float32BufferAttribute(nrm,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));
        g.setIndex(indices);mesh(instrument,g,mat);
      }
    }
    batchFixed();
    // On the dedicated bearing camera only. A mirrored camera may inherit layer
    // 12 from the main one. Empty its draw range for that pass and restore it.
    let owner=null,enabledByUs=false,disposed=false;
    root.traverse(o=>{
      o.layers.set(layer);if(!o.isMesh)return;
      o.castShadow=false;o.receiveShadow=false;o.raycast=()=>{};
      const g=o.geometry;let saved=0,skip=false;
      o.onBeforeRender=(_r,_s,c)=>{skip=c!==owner;if(skip){saved=g.drawRange.count;g.drawRange.count=0;}};
      o.onAfterRender=()=>{if(skip){g.drawRange.count=saved;skip=false;}};
    });
    const base=new T.Matrix4(),orient=new T.Quaternion(),position=new T.Vector3(),scale=new T.Vector3();
    orient.setFromAxisAngle(new T.Vector3(1,0,0),.62);
    let currentRow=-1;
    function releaseOwner(){
      if(owner&&enabledByUs)owner.layers.disable(layer);
      owner=null;enabledByUs=false;root.visible=false;
    }
    function view(camera,visible,liveYaw,reportedYaw){
      if(disposed)return;
      if(!camera||!visible||!Number.isFinite(liveYaw)){releaseOwner();return;}
      if(owner!==camera){
        releaseOwner();owner=camera;
        enabledByUs=!camera.layers.isEnabled(layer);
      }
      camera.layers.enable(layer);
      const yaw=(liveYaw%turn+turn)%turn,degree=yaw*180/Math.PI,row=Math.min(11,Math.floor(degree/30));
      strip.offset.x=(4+(degree-30*row)-span*.5)/sector;
      if(row!==currentRow){strip.offset.y=1-(row*rowHeight+59)/1024;currentRow=row;}
      card.rotation.y=yaw;bug.visible=Number.isFinite(reportedYaw);reportNotch.visible=false;
      if(bug.visible){
        const delta=Math.atan2(Math.sin(reportedYaw-yaw),Math.cos(reportedYaw-yaw));
        bug.rotation.y=-delta;
        const x=delta*180/Math.PI/span*44.9;
        if(Math.abs(x)<21.0){reportNotch.visible=true;reportNotch.position.x=x;}
      }
      const aspect=clamp(camera.aspect||1,.15,5.0);
      const zoom=camera.zoom||1,tan=Math.tan((camera.fov||31)*Math.PI/360)/zoom;
      const depth=Math.max(.50,2.75*camera.near),half=depth*tan;
      // Reserve the lower fifth for the two local instruction panels. Keep
      // the sight beneath horizontal centre even in tall/narrow detached views.
      const radiusRatio=Math.min(.357,.60*aspect),units=half*radiusRatio/51;
      const vertical=aspect<.74?-.503:-.554;
      position.set(0,vertical*half,-depth);scale.setScalar(units);
      base.compose(position,orient,scale);camera.updateWorldMatrix(true,false);
      root.matrix.copy(scene.matrixWorld).invert().multiply(camera.matrixWorld).multiply(base);
      root.matrixWorldNeedsUpdate=true;root.visible=true;
    }
    function dispose(){
      if(disposed)return;disposed=true;releaseOwner();scene.remove(root);
      for(const g of geometries)g.dispose();for(const m of materials)m.dispose();for(const im of maps)im.dispose();
    }
    return {view,dispose};
  }
  return {create};
})();
