// Coalesce the fixed pier's opaque material courses within one longitudinal bay.
// Call after the scene's picking/camera-query index has captured the individual floors.
const TideStaticPiers=(()=>{
  const T=THREE;
  function create(scene,floors,sections){
    const paths=new Set(sections.flatMap(s=>[...(s.paths||[]).flat(),...(s.returnDecks||[])]));
    const groups=new Map(),hidden=[],owned=[],root=new T.Group();
    root.name='Fixed pier courses by bay';root.matrixAutoUpdate=false;
    const vertex=new T.Vector3(),normal=new T.Vector3(),normalMatrix=new T.Matrix3();
    for(const [f,group] of floors){
      if(!f.active||paths.has(f)||f.dynamic||f.hinge!==undefined||f.sag||f.axes||f.landfall)continue;
      group.updateWorldMatrix(true,true);
      group.traverseVisible(o=>{
        const g=o.geometry,m=o.material;
        // The pier models contain opaque single-material meshes, without morphs, arrays, custom
        // depth materials or callbacks. Keep unfamiliar/new geometries on their original path.
        if(!o.isMesh||o.isInstancedMesh||o.isSkinnedMesh||!m||m.transparent||Array.isArray(m)||
           m.isShaderMaterial||m.displacementMap||o.customDepthMaterial||o.customDistanceMaterial||
           !o.frustumCulled||o.layers.mask!==1||!g?.attributes.position||!g.attributes.normal||
           Object.keys(g.morphAttributes).length||g.drawRange.start!==0||Number.isFinite(g.drawRange.count))return;
        const attrs=Object.keys(g.attributes).sort();
        if(attrs.some(s=>!['color','position','normal','uv','uv1'].includes(s)||g.attributes[s].isInterleavedBufferAttribute))return;
        if(o.matrixWorld.determinant()<=0)return;
        const bay=Math.floor((f.z+3.5)/7);
        const layout=attrs.map(s=>[s,g.attributes[s].array.constructor.name,g.attributes[s].itemSize,g.attributes[s].normalized].join('/')).join(',');
        const key=[bay,m.id,o.castShadow,o.receiveShadow,o.renderOrder,layout].join(':');
        if(!groups.has(key))groups.set(key,[]);groups.get(key).push(o);
      });
    }
    const inv=new T.Matrix4();scene.updateWorldMatrix(true,false);inv.copy(scene.matrixWorld).invert();
    for(const items of groups.values()){
      if(items.length<2)continue;
      let vertexCount=0,indexCount=0;
      for(const o of items){const g=o.geometry;vertexCount+=g.attributes.position.count;indexCount+=g.index?g.index.count:g.attributes.position.count}
      const first=items[0],shape=new T.BufferGeometry(),data={};
      const outIndex=vertexCount>65535?new Uint32Array(indexCount):new Uint16Array(indexCount);
      for(const [name,a] of Object.entries(first.geometry.attributes)){
        data[name]=new a.array.constructor(vertexCount*a.itemSize);
        shape.setAttribute(name,new T.BufferAttribute(data[name],a.itemSize,a.normalized));
      }
      let firstV=0,firstI=0;const transform=new T.Matrix4();
      for(const o of items){const g=o.geometry,p=g.attributes.position,n=g.attributes.normal,ix=g.index;
        transform.multiplyMatrices(inv,o.matrixWorld);normalMatrix.getNormalMatrix(transform);
        for(const [name,a] of Object.entries(g.attributes))if(name!=='position'&&name!=='normal')data[name].set(a.array,firstV*a.itemSize);
        for(let i=0;i<p.count;i++){
          vertex.fromBufferAttribute(p,i).applyMatrix4(transform);normal.fromBufferAttribute(n,i).applyNormalMatrix(normalMatrix);
          shape.attributes.position.setXYZ(firstV+i,vertex.x,vertex.y,vertex.z);shape.attributes.normal.setXYZ(firstV+i,normal.x,normal.y,normal.z);
        }
        for(let i=0,len=ix?ix.count:p.count;i<len;i++)outIndex[firstI++]=firstV+(ix?ix.getX(i):i);
        firstV+=p.count;hidden.push([o,o.layers.mask]);o.layers.disable(0);
      }
      shape.setIndex(new T.BufferAttribute(outIndex,1));shape.computeBoundingSphere();shape.computeBoundingBox();owned.push(shape);
      const batch=new T.Mesh(shape,first.material);batch.name=first.name;batch.castShadow=first.castShadow;batch.receiveShadow=first.receiveShadow;batch.renderOrder=first.renderOrder;batch.matrixAutoUpdate=false;root.add(batch);
    }
    scene.add(root);
    return {dispose(){
      root.removeFromParent();
      for(const [o,mask] of hidden)o.layers.mask=mask;
      for(const g of owned)g.dispose();
      hidden.length=owned.length=0;root.clear();
    }};
  }
  return {create};
})();
