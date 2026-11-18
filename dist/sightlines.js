// Shared solid-surface queries for camera clearance and pointing. Each instance
// keeps its own transform so a mark on a moving wheel follows that wheel.
const TideSightlines=(()=>{
  const T=THREE;
  const opaque=m=>m&&m.visible!==false&&!m.isShaderMaterial&&(!m.transparent||m.opacity>=.90)&&!m.wireframe;
  function create(scene,except){
    const entries=[],hierarchy=[],ray=new T.Raycaster(),proxy=new T.Mesh(),instance=new T.Matrix4(),scratch=new T.Vector3(),hits=[];
    function visit(o,parent){
      if(except.includes(o))return;
      const index=hierarchy.length;hierarchy.push({o,parent,shown:true});
      if(o.isMesh&&o.geometry?.attributes.position&&!o.isSkinnedMesh){
        const materials=Array.isArray(o.material)?o.material:[o.material];
        if(materials.some(opaque)){
          const geo=o.geometry;if(!geo.boundingBox)geo.computeBoundingBox();
          if(geo.boundingBox&&!geo.boundingBox.isEmpty()){
            const parts=Array.from({length:o.isInstancedMesh?o.count:1},()=>({box:new T.Box3(),matrix:new T.Matrix4()}));
            entries.push({o,index,parts,old:new T.Matrix4(),version:-1,init:false});
          }
        }
      }
      for(const c of o.children)visit(c,index);
    }
    visit(scene,-1);
    function update(){
      scene.updateMatrixWorld();
      for(const n of hierarchy)n.shown=n.o.visible&&(n.parent<0||hierarchy[n.parent].shown);
      for(const e of entries){
        const {o}=e;if(!hierarchy[e.index].shown)continue;
        const version=o.instanceMatrix?.version||0;
        if(e.init&&version===e.version&&e.old.equals(o.matrixWorld))continue;
        e.old.copy(o.matrixWorld);e.version=version;e.init=true;
        for(let j=0;j<e.parts.length;j++){
          const p=e.parts[j];p.matrix.copy(o.matrixWorld);
          if(o.isInstancedMesh){o.getMatrixAt(j,instance);p.matrix.multiply(instance);}
          p.box.copy(o.geometry.boundingBox).applyMatrix4(p.matrix);
        }
      }
    }
    function hit(origin,direction,far,near=.035){
      let result=null,limit=far;ray.set(origin,direction);ray.near=near;
      for(const e of entries){
        if(!hierarchy[e.index].shown||!e.init)continue;
        const o=e.o;proxy.geometry=o.geometry;proxy.material=o.material;
        for(let j=0;j<e.parts.length;j++){
          const p=e.parts[j];
          if(!ray.ray.intersectBox(p.box,scratch))continue;
          if(!p.box.containsPoint(origin)&&scratch.distanceToSquared(origin)>limit*limit)continue;
          proxy.matrixWorld.copy(p.matrix);ray.far=limit;hits.length=0;
          proxy.raycast(ray,hits);
          for(const h of hits){
            const m=Array.isArray(o.material)?o.material[h.face?.materialIndex||0]:o.material;
            if(h.distance>=limit||!opaque(m))continue;
            limit=h.distance;result={object:o,instance:o.isInstancedMesh?j:null,distance:limit,point:h.point};
          }
        }
      }
      return result;
    }
    const origin=new T.Vector3(),delta=new T.Vector3(),end=new T.Vector3(),dir=new T.Vector3(),right=new T.Vector3(),up=new T.Vector3(0,1,0);
    const probes=[[0,0],[.21,0],[-.21,0],[.61,0],[-.61,0],[0,.31],[0,-.27]];
    const arms=[0,1].map(()=>({fraction:1,checked:-1,eye:new T.Vector3(Infinity,0,0),body:new T.Vector3()}));
    function retract(i,p,eye,t,dt,snap){
      origin.set(p.x,p.y+1.45,p.z);delta.subVectors(eye,origin);const length=delta.length();if(length<.72)return;
      right.crossVectors(delta,up).normalize();const a=arms[i];
      if(snap||t-a.checked>.088||t<a.checked||eye.distanceToSquared(a.eye)>.14||origin.distanceToSquared(a.body)>.08){
        let f=1;
        for(const [side,lift] of probes){
          end.copy(eye).addScaledVector(right,side);end.y+=lift;
          dir.subVectors(end,origin);const distance=dir.length();dir.multiplyScalar(1/distance);
          const h=hit(origin,dir,distance,.26);
          if(h)f=Math.min(f,Math.max(.56/length,(h.distance-.22)/distance));
        }
        a.limit=f;a.checked=t;a.eye.copy(eye);a.body.copy(origin);
      }
      a.fraction=snap?a.limit:Math.min(a.limit,T.MathUtils.lerp(a.fraction,a.limit,1-Math.exp(-dt*6)));
      eye.copy(origin).addScaledVector(delta,a.fraction);
    }
    function anchor(h){
      const m=new T.Matrix4().copy(h.object.matrixWorld);
      if(h.instance!==null){h.object.getMatrixAt(h.instance,instance);m.multiply(instance);}
      return {o:h.object,id:h.instance,local:h.point.clone().applyMatrix4(m.invert())};
    }
    function locate(a,out){
      for(let n=a.o;n;n=n.parent)if(!n.visible)return false;
      out.copy(a.local);
      if(a.id!==null){if(a.id>=a.o.count)return false;a.o.getMatrixAt(a.id,instance);out.applyMatrix4(instance);}
      out.applyMatrix4(a.o.matrixWorld);return true;
    }
    return {update,hit,retract,anchor,locate,dispose(){entries.length=hierarchy.length=0;proxy.geometry=null;proxy.material=null;}};
  }
  return {create};
})();
