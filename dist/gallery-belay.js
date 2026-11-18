// Fall-arrest runners and the two lanyards on their independent trolley eyes.
const TideGalleryBelay=(()=>{
  const T=THREE,L=TideLantern;
  function create(scene,g){
    const root=new T.Group(),assets=[];root.name='环轨上方的双人防坠钢索';scene.add(root);
    const own=x=>(assets.push(x),x);
    const steel=own(new T.MeshStandardMaterial({color:0xb1af99,metalness:.78,roughness:.40}));
    const iron=own(new T.MeshStandardMaterial({color:0x51645f,metalness:.62,roughness:.67}));
    const cyl=own(new T.CylinderGeometry(1,1,1,8));
    const at=(a,r,h)=>{const v=L.coords(r*Math.sin(a),h,r*Math.cos(a));return new T.Vector3(v.x,v.y,v.z);};
    const lo=TideGallery.westAngle-.20,hi=TideGallery.eastAngle+.20;
    const points=Array.from({length:43},(_,j)=>at(lo+(hi-lo)*j/42,5.55,-1.95));
    const rail=new T.Mesh(own(new T.TubeGeometry(new T.CatmullRomCurve3(points),52,.018,7,false)),steel);root.add(rail);
    const upr=new T.Vector3(0,1,0),axis=new T.Vector3(),mid=new T.Vector3(),q=new T.Quaternion(),mx=new T.Matrix4(),size=new T.Vector3();
    const braces=new T.InstancedMesh(cyl,iron,10);root.add(braces);let n=0;
    function brace(a,b,r){
      axis.subVectors(b,a);mid.copy(a).lerp(b,.5);size.set(r,axis.length(),r);q.setFromUnitVectors(upr,axis.normalize());
      braces.setMatrixAt(n++,mx.compose(mid,q,size));
    }
    for(let i=0;i<5;i++){
      const a=lo+(hi-lo)*i/4,eye=at(a,5.55,-1.95);
      brace(at(a,3.85,-.65),eye,.032);brace(at(a+.085,3.72,-.61),eye,.021);
    }
    const eyeGeo=own(new T.TorusGeometry(.069,.016,7,14));
    const cords=[0,1].map(i=>{
      const mat=own(new T.MeshStandardMaterial({color:i?0x69a89c:0xd49b56,roughness:.80,metalness:.05}));
      const rope=new T.InstancedMesh(cyl,mat,10),eye=new T.Mesh(eyeGeo,steel);
      rope.frustumCulled=false;root.add(rope,eye);return {rope,eye};
    });
    const v=new T.Vector3(),end=new T.Vector3(),prev=new T.Vector3(),next=new T.Vector3();
    function update(game){
      const a=game.gallery;for(let i=0;i<2;i++){
        const {rope,eye}=cords[i],p=game.players[i],show=TideGallery.active(game)&&a.phase!=='file'&&p.y<L.height-2.45&&a.home[i]!==game.world.gallery.east;
        eye.visible=rope.visible=show;if(!show)continue;
        const along=TideGallery.anchor(p);v.set(along.x,along.y-.047,along.z);eye.position.copy(v);eye.rotation.y=Math.atan2(p.x-14,p.z+91);
        end.set(p.x+.13*Math.sin(p.yaw),p.y+1.12,p.z+.13*Math.cos(p.yaw));
        const sag=a.arrests[i] ? .025 : p.grounded ? .21 : .075;prev.copy(v);
        for(let j=0;j<10;j++){
          const t=(j+1)/10;next.copy(v).lerp(end,t);next.y-=4*sag*t*(1-t);
          axis.subVectors(next,prev);size.set(.011,axis.length()+.002,.011);mid.copy(prev).lerp(next,.5);
          q.setFromUnitVectors(upr,axis.normalize());rope.setMatrixAt(j,mx.compose(mid,q,size));prev.copy(next);
        }
        rope.instanceMatrix.needsUpdate=true;
      }
    }
    return {update,dispose(){root.removeFromParent();for(const x of assets)x.dispose();}};
  }
  return {create};
})();
