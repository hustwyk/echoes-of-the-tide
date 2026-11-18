// The hull, looking glass and field book refer to one moored light. Sample the
// water over the float's beam: a steel drum cannot pitch with every capillary.
const TideBuoyMotion=(()=>{
  const lampHeight=2.99,angles=[0,Math.PI/2,Math.PI,-Math.PI/2];
  const plates=angles.map(a=>({x:.515*Math.sin(a),y:1.24,z:.515*Math.cos(a),nx:Math.sin(a),nz:Math.cos(a)}));
  function pose(index,t,level){
    const mark=TideLookout.marks.buoy,swell=index===8?TideSoundings.swell:TideLookout.swell;
    const x=mark.x+.145*Math.sin(.38*t+.43)+.065*Math.sin(.81*t);
    const z=mark.z+.115*Math.sin(.36*t-.28)+.062*Math.sin(.72*t+.26);
    const cx=swell(x,z,t),port=swell(x-.89,z,t-.16),starboard=swell(x+.89,z,t-.16);
    const bow=swell(x,z-.89,t-.16),aft=swell(x,z+.89,t-.16);
    const rx=-Math.atan((aft-bow)/1.78)*.81,rz=Math.atan((starboard-port)/1.78)*.81;
    return {x,y:level+.40*cx+.15*(port+starboard+bow+aft),z,rx,ry:.50+.055*Math.sin(t*.27),rz};
  }
  // Three.js intrinsic XYZ Euler, applied to a point on the actual tilting tower.
  function local(p,x,y,z){
    const ca=Math.cos(p.rx),sa=Math.sin(p.rx),cb=Math.cos(p.ry),sb=Math.sin(p.ry),cc=Math.cos(p.rz),sc=Math.sin(p.rz);
    const u=x*cc-y*sc,v=x*sc+y*cc,w=z*cb-u*sb;
    return [p.x+u*cb+z*sb,p.y+v*ca-w*sa,p.z+v*sa+w*ca];
  }
  function lamp(g){return local(pose(g.index,g.time,g.cues.water),0,lampHeight,0);}
  function plate(g,eye){
    const p=pose(g.index,g.time,g.cues.water);
    let best=-Infinity,point;
    for(const a of plates){
      const pos=local(p,a.x,a.y,a.z),normal=local(p,a.nx,0,a.nz);
      const facing=(eye[0]-pos[0])*(normal[0]-p.x)+(eye[1]-pos[1])*(normal[1]-p.y)+(eye[2]-pos[2])*(normal[2]-p.z);
      if(facing>best){best=facing;point=pos;}
    }
    return point;
  }
  return {pose,local,lamp,plate,plates,lampHeight};
})();
