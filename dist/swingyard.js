// Wet service gear below the bridge, the load-bearing net and the car's open bow.
const TideSwingYard=(()=>{
  const T=THREE,V=(x=0,y=0,z=0)=>new T.Vector3(x,y,z),up=V(0,1,0);
  function create(scene,g){
    const w=g.world.swing,o=w.o,c=w.car,root=new T.Group(),car=new T.Group(),owned=new Set(),own=v=>(owned.add(v),v);
    root.position.set(o.x,o.y,o.z);scene.add(root);root.add(car);
    const gear=TideSwingGear.create(root),box=own(new T.BoxGeometry(1,1,1)),rod=own(new T.CylinderGeometry(1,1,1,10));
    const mat=(color,metalness,roughness)=>own(new T.MeshStandardMaterial({color,metalness,roughness}));
    const steel=mat(0x566865,.61,.54),brass=mat(0xb5a36e,.55,.44),hemp=mat(0xb1a486,.09,.84),white=mat(0xe1e3c7,.20,.60),yellow=mat(0xc3a265,.29,.67);
    const groups=new Map(),tr=new T.Object3D();
    const plank=(parent,m,x,y,z,sx,sy,sz)=>instance(parent,m,box,x,y,z,sx,sy,sz);
    function instance(parent,m,shape,x,y,z,sx,sy,sz,q){
      tr.position.set(x,y,z);tr.quaternion.identity();if(q)tr.quaternion.copy(q);tr.scale.set(sx,sy,sz);tr.updateMatrix();
      const key=[parent.id,m.id,shape.id].join('/');if(!groups.has(key))groups.set(key,{parent,m,shape,mats:[]});groups.get(key).mats.push(tr.matrix.clone());
    }
    function pipe(p,m,a,b,r){const v=V(...a),u=V(...b),d=u.clone().sub(v);v.lerp(u,.5);instance(p,m,rod,v.x,v.y,v.z,r,d.length(),r,new T.Quaternion().setFromUnitVectors(up,d.normalize()));}
    const net=w.net,nx=net.x-o.x,nz=net.z-o.z,ny=net.y-o.y,load=[V(),V()];
    const verts=[],norms=[],indices=[];
    function stitch(along,total,count,fixed,row,radius){
      const positions=[],steps=count*2;
      for(let i=0;i<=steps;i++){
        const fraction=i/steps,u=along?fixed:(fraction-.5)*total,v=along?(fraction-.5)*total:fixed;
        const x=nx+u,z=nz+v,y=TideTraversal.netHeight(net,x+o.x,z+o.z)-o.y;
        positions.push(V(x,y+(along?1:-1)*.010*Math.cos((i*.5+row)*Math.PI),z));
      }
      for(let i=0;i<positions.length;i++){
        const p=positions[i],d=positions[Math.min(i+1,steps)].clone().sub(positions[Math.max(0,i-1)]).normalize();
        const a=V().crossVectors(d,up).normalize(),b=V().crossVectors(a,d).normalize(),ix=verts.length/3;
        for(let j=0;j<5;j++){
          const t=j*Math.PI*.4,n=a.clone().multiplyScalar(Math.cos(t)).addScaledVector(b,Math.sin(t));
          verts.push(p.x+radius*n.x,p.y+radius*n.y,p.z+radius*n.z);norms.push(n.x,n.y,n.z);
        }
        if(i)for(let j=0;j<5;j++){const k=(j+1)%5;indices.push(ix-5+j,ix+j,ix-5+k,ix-5+k,ix+j,ix+k);}
      }
    }
    for(let i=0;i<=23;i++)stitch(true,net.d,32,(i/23-.5)*net.w,i,i===0||i===23?.042:.018);
    for(let i=0;i<=32;i++)stitch(false,net.w,23,(i/32-.5)*net.d,i,i===0||i===32?.042:.018);
    const geom=own(new T.BufferGeometry());geom.setAttribute('position',new T.Float32BufferAttribute(verts,3));geom.setAttribute('normal',new T.Float32BufferAttribute(norms,3));geom.setIndex(indices);
    const netMat=mat(0x9d9772,.06,.89);netMat.side=T.DoubleSide;
    netMat.onBeforeCompile=p=>{
      p.uniforms.netLoad={value:load};p.uniforms.netShape={value:new T.Vector4(nx,nz,net.w,net.d)};
      p.vertexShader=p.vertexShader.replace('#include <common>','#include <common>\nuniform vec3 netLoad[2];uniform vec4 netShape;')
        .replace('#include <begin_vertex>',`#include <begin_vertex>
          vec2 uvNet=2.*(position.xz-netShape.xy)/netShape.zw;
          float edge=max(0.,1.-uvNet.x*uvNet.x)*max(0.,1.-uvNet.y*uvNet.y);
          for(int j=0;j<2;j++){vec2 sep=position.xz-netLoad[j].xz;transformed.y-=netLoad[j].y*edge*exp(-1.65*dot(sep,sep));}`);
    };
    const strands=new T.Mesh(geom,netMat);strands.receiveShadow=true;root.add(strands);
    for(const a of [-1,1])for(const b of [-1,1]){
      const x=nx+a*net.w*.5,z=nz+b*net.d*.5;pipe(root,steel,[x,ny,z],[x+a*.79,ny+.78,z+b*.40],.045);
      pipe(root,steel,[x+a*.79,ny-1.1,z+b*.40],[x+a*.79,4.05,z+b*.40],.102);
      for(let j=0;j<4;j++)pipe(root,brass,[x+a*(.10+j*.13),ny+.10+j*.13,z+b*.09],[x+a*(.23+j*.13),ny+.23+j*.13,z+b*.11],.056);
    }
    // Both ladders meet the net. The outside car ladder is paid out after the first boarding.
    const farLadder=new T.Group();root.add(farLadder);
    for(const [i,end] of w.steps.entries()){
      const dest=i?{x:c.from.x-1.46,y:c.from.y,z:c.from.z+1.33}:w.shore;
      const par=i?farLadder:root,bottom=[end.x-o.x,ny-.10,end.z-o.z],top=[dest.x-o.x,dest.y-o.y+.46,dest.z-o.z];
      for(const a of [-1,1])pipe(par,hemp,[bottom[0]+a*.26,bottom[1],bottom[2]],[top[0]+a*.26,top[1],top[2]],.022);
      for(let j=0;j<=10;j++){
        const t=j/10,x=bottom[0]+(top[0]-bottom[0])*t,y=bottom[1]+(top[1]-bottom[1])*t,z=bottom[2]+(top[2]-bottom[2])*t;
        pipe(par,j===10?yellow:brass,[x-.30,y,z],[x+.30,y,z],.031);
      }
    }
    for(const x of TideSwing.entryX){
      for(let n=-2;n<=2;n++)plank(root,yellow,x+.13*n,.018,-1.78,.078,.012,.26);
      plank(root,brass,x,.026,-1.94,.72,.016,.032);
    }
    const opening=w.land.x-c.from.x;
    for(const [x0,x1] of [[-2.26,opening-.73],[opening+.73,2.26]]){
      for(const y of [.51,1.14])pipe(car,steel,[x0,y,1.86],[x1,y,1.86],.038);
      for(const x of [x0,x1]){
        pipe(car,steel,[x,.02,1.86],[x,1.20,1.86],.046);
        pipe(car,white,[x,.74,1.86],[x,1.14,1.86],.052);
      }
    }
    for(const sign of [-1,1]){
      const x=opening+sign*.59;plank(car,white,x,.017,1.26,.066,.013,1.12);
      for(let j=0;j<4;j++)plank(car,white,x+sign*.10,.017,.83+j*.24,.17,.013,.046);
    }
    for(const {parent,m,shape,mats} of groups.values()){
      const batch=new T.InstancedMesh(shape,m,mats.length);mats.forEach((a,i)=>batch.setMatrixAt(i,a));batch.castShadow=batch.receiveShadow=true;parent.add(batch);
    }
    function update(g){
      const s=g.swing,d=c.deck,p=g.players[0];car.position.set(d.x-o.x,d.y-o.y,d.z-o.z);
      farLadder.visible=s.crossed[1]&&!c.departed;
      net.loads.forEach((a,i)=>load[i].set(a.x-o.x,a.a,a.z-o.z));
      s.car=car.position;s.mail={x:w.mail.x-o.x,y:w.mail.y-o.y,z:w.mail.z-o.z};
      s.staffVisible=g.stage===2;s.staffFrom=s.staffVisible?{x:p.x-o.x,y:p.y-o.y,z:p.z-o.z,yaw:p.yaw}:null;
      gear.update(s,g.time);
    }
    function hands(g,i){
      const s=g.swing;
      if(s.occupied&&i===s.rider)return gear.hands('bar');
      if(!g.engaged[i])return null;
      const k=TideSwing.target(g,i).kind;return gear.hands(k);
    }
    const lens=(e,a,fov,focus)=>({eye:[o.x+e[0],o.y+e[1],o.z+e[2]],at:[o.x+a[0],o.y+a[1],o.z+a[2]],fov,focus});
    function shot(g,i){
      const s=g.swing,p=g.players[i],x=p.x-o.x,y=p.y-o.y,z=p.z-o.z,t=TideSwing.target(g,i);
      if(s.climb[i]||p.ground===net)return null;
      if(s.phase==='cross'&&i===s.rider){
        if(s.occupied||s.flight)return lens([x-2.52,Math.max(1.55,y+2.15),z+3.57],[x+.13,y+.97,z-1.70],64);
        if(Math.hypot(x-TideSwing.entryX[i],z+1.76)<1.04&&g.engaged[1-i])return lens([x+1.45,2.65,1.06],[x-.28,1.51,-3.10],62);
      }
      if(!g.engaged[i])return null;
      if(t.kind==='near')return lens([-4.06,2.38,.12],[-.36,1.31,-4.82],62);
      if(t.kind==='far')return lens([-.97,2.46,-13.61],[-.99,1.00,-8.47],62);
      if(s.phase==='stow'){const cx=car.position.x,cy=car.position.y,cz=car.position.z;
        return i?lens([cx+.05,cy+1.79,cz-.36],[cx-1.54,cy+.94,cz-1.04],53):lens([cx-.64,cy+2.14,cz-.07],[cx-1.68,cy+.96,cz-.98],54);}
      if(s.phase==='report'){const m=s.mail;if(s.report>.75)return paperShot(i);return i?lens([m.x+.65,m.y+1.89,m.z+.64],[m.x+.09,m.y+1.03,m.z+.26],47):lens([m.x-.88,m.y+1.57,m.z+1.45],[m.x-.25,m.y+.96,m.z+.35],54);}
      return null;
    }
    function paperShot(i){
      const m=g.swing.mail;
      return i?lens([m.x,m.y+1.23,m.z+.86],[m.x,m.y+1.113,m.z+.655],98):
        lens([m.x+.03,m.y+1.78,m.z+1.97],[m.x,m.y+1.11,m.z+.65],52);
    }
    return {update,hands,shot,filmShot:paperShot,dispose(){gear.dispose();root.traverse(n=>{if(n.isInstancedMesh)n.dispose();});root.removeFromParent();for(const resource of owned)resource.dispose();}};
  }
  return {create};
})();
