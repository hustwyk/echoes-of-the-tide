// A single fixed lattice for both views, including binoculars. Allocate rows
// by the coast that players can reach or observe, not by either camera's pose.
const TideOceanGrid=(()=>{
  function axis(lo,hi,segments,intervals){
    const cumulative=[0],step=2,n=Math.ceil((hi-lo)/step),dx=(hi-lo)/n;
    for(let j=0;j<n;j++){
      const p=lo+(j+.5)*dx;
      let gap=Infinity;
      for(const [a,b] of intervals)gap=Math.min(gap,Math.max(0,a-p,p-b));
      cumulative.push(cumulative[j]+dx/Math.min(26,.82+.12*gap));
    }
    const coordinates=[],total=cumulative[n];let cell=0;
    for(let j=0;j<=segments;j++){
      const mass=j*total/segments;
      while(cell+1<n&&cumulative[cell+1]<mass)cell++;
      coordinates.push(lo+dx*(cell+(mass-cumulative[cell])/(cumulative[cell+1]-cumulative[cell])));
    }
    return coordinates;
  }
  function create(T,floors,index){
    const bands=[[[ -52,2]],[[-143,-92]]];
    for(const [axisName,width,i] of [['x','w',0],['z','d',1]]){
      let a=Infinity,b=-Infinity;
      for(const d of floors||[]){
        if(!Number.isFinite(d[axisName])||!Number.isFinite(d[width]))continue;
        a=Math.min(a,d[axisName]-d[width]*.5);b=Math.max(b,d[axisName]+d[width]*.5);
      }
      if(Number.isFinite(a))bands[i].push([a-5,b+5]);
    }
    if(index===0)bands[1].push([-6,25]);
    const cols=216,rows=192,x=axis(-553,503,cols,bands[0]),z=axis(-649,470,rows,bands[1]);
    const mesh=new T.PlaneGeometry(1,1,cols,rows).rotateX(-Math.PI/2);
    const p=mesh.attributes.position;
    // Existing sea contact, hook splash and reflected-camera row culling all
    // read these very vertices. Every ring and drop meets the visible triangle.
    for(let j=0;j<=rows;j++)for(let i=0;i<=cols;i++)p.setXYZ(j*(cols+1)+i,x[i],0,z[j]);
    mesh.computeBoundingBox();mesh.computeBoundingSphere();
    return mesh;
  }
  return {create};
})();
