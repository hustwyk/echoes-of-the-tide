// Fenders, tide stains, mooring gear, landing lights and wet boot impressions.
const TideDockside=(()=>{
  const T=THREE;
  function create(scene,g){
    const root=new T.Group();scene.add(root);
    const owned=new Set(),own=v=>(owned.add(v),v),batches=new Map(),o=new T.Object3D();
    const box=own(new T.BoxGeometry()),tube=own(new T.CylinderGeometry(1,1,1,14));
    const ring=own(new T.TorusGeometry(1,.29,7,22));
    const paint=own(new T.MeshStandardMaterial({color:0xffffff,metalness:.58,roughness:.52}));
    const rubber=own(new T.MeshStandardMaterial({color:0xffffff,metalness:.04,roughness:.76}));
    const base=own(new T.MeshStandardMaterial({color:0xffffff,metalness:.07,roughness:.92}));
    const lamp=own(new T.MeshBasicMaterial({color:0xffffff,toneMapped:false}));
    function part(geometry,material,color,x,y,z,sx,sy,sz,rx=0,ry=0,rz=0){
      const key=geometry.id+'/'+material.id;
      if(!batches.has(key))batches.set(key,{geometry,material,items:[]});
      o.position.set(x,y,z);o.rotation.set(rx,ry,rz);o.scale.set(sx,sy,sz);o.updateMatrix();
      batches.get(key).items.push({matrix:o.matrix.clone(),color});
    }
    const act=Math.floor(g.index/3),ends=[g.world.sections[0].starts,...g.world.sections.map(s=>s.ends)];
    const course=['#8c7859','#66766f','#6b7778','#859394'][act];
    for(let j=0;j<ends.length;j++)for(let i=0;i<2;i++){
      const d=ends[j][i],sign=i?1:-1,x=d.x+sign*(d.w/2-.24),z=d.z+.83;
      const fender=act<2 || act===2&&j===0;
      // Attach hardware outside the clear walking lane. The branch junction is farther inland.
      if(fender){
        part(box,base,course,x-sign*.23,d.y-.86,z,.64,1.45,3.36);
        for(let q=0;q<3;q++){
          const tz=z+(q-1)*1.16;
          part(box,base,'#566459',x-sign*.23,d.y-1.45,tz,.652,.23,1.13);
          part(ring,rubber,'#242a29',x+sign*.15,d.y-.62,tz,.34,.37,.32,.13,Math.PI/2,.16*(q-1));
          part(tube,paint,'#7f6f52',x+sign*.16,d.y-.29,tz-.1,.017,.43,.017,-.27);
          part(tube,paint,'#6f6854',x+sign*.16,d.y-.29,tz+.1,.017,.43,.017,.27);
        }
        part(tube,paint,'#555952',x-.06*sign,d.y+.063,z+1.44,.36,.12,.36);
        part(tube,paint,'#6c6a58',x-.06*sign,d.y+.23,z+1.44,.21,.30,.21);
        part(tube,paint,'#999078',x-.06*sign,d.y+.413,z+1.44,.32,.085,.32);
        for(let turn=0;turn<3;turn++)part(ring,rubber,'#9e805d',x-.06*sign,d.y+.13+.045*turn,z+1.44,.18,.18,.11,Math.PI/2);
      }else{
        for(let n=0;n<3;n++){
          const tz=z+.68*n;
          part(tube,paint,'#5d665e',x,d.y+.36,tz,.042,.72,.042);
          part(tube,paint,'#a9a17f',x,d.y+.72,tz+.31,.047,.7,.047,Math.PI/2);
        }
      }
      // Exposed bolts and slit lights remain visible in floor-level camera angles.
      for(const k of [-1,1]){
        const bx=d.x+k*(d.w*.5-.29);
        part(box,paint,'#4c5554',bx,d.y+.031,d.z-2.22,.38,.046,.54);
        part(box,lamp,i?'#a5d8cb':'#eab183',bx,d.y+.061,d.z-2.22,.09,.019,.36);
        part(tube,paint,'#9d957f',bx+.12,d.y+.06,d.z-2.05,.031,.015,.031);
      }
    }
    for(const sec of g.world.sections)if(sec.field)for(let i=0;i<2;i++){
      const d=sec.field.sites[i],a=d.approach,n=Math.floor(Math.abs(a.x-d.x)/1.55);
      for(let j=0;j<n;j++){
        const f=j/n;
        part(box,lamp,i?'#81bfb5':'#d8a779',a.x+(d.x-a.x)*f,a.y+(d.y-a.y)*Math.min(1,(j+.6)/(n-.5))+.10,a.z-.89,.13,.06,.13);
      }
    }
    for(const {geometry,material,items} of batches.values()){
      const inst=own(new T.InstancedMesh(geometry,material,items.length));inst.receiveShadow=true;
      items.forEach((v,i)=>{inst.setMatrixAt(i,v.matrix);inst.setColorAt(i,new T.Color(v.color));});
      root.add(inst);
    }
    const plane=own(new T.PlaneGeometry(1,1).rotateX(-Math.PI/2));
    function ink(draw){
      const c=document.createElement('canvas');c.width=c.height=96;draw(c.getContext('2d'));
      const map=own(new T.CanvasTexture(c));
      return own(new T.MeshBasicMaterial({map,color:0x393b34,transparent:true,opacity:.49,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2}));
    }
    const contact=ink(c=>{
      const r=c.createRadialGradient(48,48,3,48,48,44);r.addColorStop(0,'rgba(255,255,255,.85)');r.addColorStop(.55,'rgba(255,255,255,.38)');r.addColorStop(1,'rgba(255,255,255,0)');
      c.fillStyle=r;c.fillRect(0,0,96,96);
    });
    const tread=ink(c=>{
      c.fillStyle='white';c.beginPath();c.ellipse(47,61,18,20,-.07,0,Math.PI*2);c.fill();c.beginPath();c.ellipse(50,31,22,27,.13,0,Math.PI*2);c.fill();
      c.globalCompositeOperation='destination-out';c.lineWidth=3;
      for(let y=15;y<81;y+=8){c.beginPath();c.moveTo(20,y);c.lineTo(49,y+5);c.lineTo(75,y-1);c.stroke();}
    });
    const shadows=[0,1].map(()=>{const m=new T.Mesh(plane,contact);root.add(m);return m;});
    const marks=Array.from({length:28},()=>{const m=new T.Mesh(plane,tread);m.visible=false;root.add(m);return {m,until:0,deck:null};});
    const feet=[{distance:0,left:1},{distance:0,left:-1}];let cursor=0;
    function update(g,dt){
      for(let i=0;i<2;i++){
        const p=g.players[i],d=p.ground||TideTraversal.surface(g.world,p.x,p.z,p.y+.10),shadow=shadows[i];
        shadow.visible=!!d;if(d){const scale=1.0+.20*Math.max(0,p.y-d.y);shadow.position.set(p.x,d.y+.034,p.z);shadow.scale.set(scale,1,scale*.83);}
        const f=feet[i];
        if(!p.ground||p.speed<.18)continue;
        f.distance+=dt*p.speed;
        if(f.distance<.86)continue;
        f.distance%=.86;f.left=-f.left;
        const dot=marks[cursor];cursor=(cursor+1)%marks.length;
        dot.deck=d;dot.dx=p.x-d.x+f.left*.12*Math.cos(p.yaw);dot.dz=p.z-d.z-f.left*.12*Math.sin(p.yaw);
        dot.until=g.time+5.8;dot.m.rotation.y=p.yaw;dot.m.scale.set(.25,1,.38);dot.m.visible=true;
      }
      for(const dot of marks)if(dot.m.visible){
        if(dot.until<g.time||!dot.deck.active){dot.m.visible=false;continue;}
        dot.m.position.set(dot.deck.x+dot.dx,dot.deck.y+.036,dot.deck.z+dot.dz);
      }
    }
    return {update,dispose(){root.removeFromParent();for(const x of owned)x.dispose();}};
  }
  return {create};
})();
