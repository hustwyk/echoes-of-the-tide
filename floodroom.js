const TideFloodRoom=(()=>{
  function create(scene,w){
    const root=new THREE.Group(),o=w.origin;root.position.set(o.x,o.y,o.z);scene.add(root);
    const quay=TideFloodQuay.create(root),gear=TideFloodGear.create(root);
    function update(g){
      const a=g.landfall;
      gear.update(a?.height||0,a?.pinned||false,a?.stroke||0,a?.angle??-.48,a?.plugged||false,a?.strength||0);
      quay.update(g.time,a?.height||0);
    }
    function shot(g,i){
      const a=g.landfall,p=g.players[i],x=p.x-o.x,z=p.z-o.z;
      const lens=(eye,at,fov)=>({eye:[o.x+eye[0],o.y+eye[1],o.z+eye[2]],at:[o.x+at[0],o.y+at[1],o.z+at[2]],fov});
      if(g.engaged[i]){
        if(!a.pinned)return i?lens([1.42,1.65,-8.02],[2.30,1.17,-9.05],52):
          lens([-5.48,2.46,-2.65],[-2.07,1.48,-6.85],57);
        return i?lens([3.25,1.96,-11.63],[.93,1.36,-13.56],47):lens([-3.36,1.96,-11.43],[-1.11,1.22,-13.57],50);
      }
      if(z<=-7.92){
        // The portrait camera fits entirely beyond the wall, even just past the threshold.
        return lens([Math.max(-3.62,Math.min(3.62,x-1.28)),2.67,Math.min(-8.0,z+3.3)],
          [x+.14,1.10,z-1.48],64);
      }
      return null;
    }
    return {update,shot,hands:kind=>gear.hands(kind),dispose(){gear.dispose();quay.dispose();root.removeFromParent();}};
  }
  return {create};
})();
