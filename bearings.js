// Project a world point onto one player's camera. Behind the eye, screen projection
// reverses left and right, so use the camera-space bearing for those directions.
const TideBearings=(()=>{
  const relative=new THREE.Vector3(),projected=new THREE.Vector3();
  function project(point,cam,limits,out){
    relative.copy(point).applyMatrix4(cam.matrixWorldInverse);
    const behind=relative.z>=-cam.near,aspect=cam.aspect||1;
    let x,y;
    if(behind){
      x=relative.x/aspect;y=relative.y;
      // A point straight behind needs a turn, independent of numerical noise in x.
      if(Math.abs(x)+Math.abs(y)<.04)y=-1;
    }else{projected.copy(relative).applyMatrix4(cam.projectionMatrix);x=projected.x;y=projected.y;}
    const vertical=y>0?limits.up:limits.down;
    const edge=behind||Math.abs(x)>limits.side||Math.abs(y)>vertical;
    if(edge){
      const scale=1/Math.max(Math.abs(x)/limits.side,Math.abs(y)/vertical,1e-8);
      x*=scale;y*=scale;
    }
    out.x=x;out.y=y;out.edge=edge;out.behind=behind;out.bearing=Math.atan2(x*aspect,y);
    if(!edge)out.direction='';
    else if(behind)out.direction=Math.abs(relative.x)>.18*Math.max(.15,relative.z)?(relative.x<0?'左后方':'右后方'):'身后';
    else if(Math.abs(x)/limits.side>Math.abs(y)/vertical)out.direction=x<0?'向左':'向右';
    else out.direction=y>0?'上方':'下方';
    return out;
  }
  return {project};
})();
