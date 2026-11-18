// Local ambient occlusion beneath the four articulated boots. The receiver's real
// fragments determine footprint coverage, including slots, rounded rims and slopes.
const TideFootlight=(()=>{
  const vertex=`
    vec4 tideFloorVertex=vec4(transformed,1.0);
    #ifdef USE_BATCHING
      tideFloorVertex=batchingMatrix*tideFloorVertex;
    #endif
    #ifdef USE_INSTANCING
      tideFloorVertex=instanceMatrix*tideFloorVertex;
    #endif
    vTideFloorWorld=(modelMatrix*tideFloorVertex).xyz;
  `;
  const contact=`
    float tideSole(vec3 foot,vec2 aim,vec3 position){
      vec3 d=foot-position;
      if(dot(d.xz,d.xz)>2.56 || d.y<-.11 || d.y>1.65)return 0.;
      float h=max(d.y,0.);
      vec2 local=vec2(dot(d.xz,vec2(-aim.y,aim.x)),dot(d.xz,aim));
      vec2 fine=local/vec2(.096+h*.40,.164+h*.42);
      vec2 broad=local/vec2(.26+h*.48,.31+h*.62);
      float close=.68*exp(-dot(fine,fine)*1.30-h*7.8);
      float soft=.27*exp(-dot(broad,broad)*.88-h*1.85);
      return (close+soft)*smoothstep(-.11,-.026,d.y);
    }
  `;
  function create(scene,actors){
    const T=THREE,centres=[],axes=[],joints=[],patched=new Map(),point=new T.Vector3();
    for(const a of actors)for(const b of [a.userData.rig.bones.boot0,a.userData.rig.bones.boot1]){
      joints.push(b);centres.push(new T.Vector3(1e4,1e4,1e4));axes.push(new T.Vector2(0,1));
    }
    function install(m){
      if(!m?.isMeshStandardMaterial||patched.has(m))return;
      const compile=m.onBeforeCompile,cache=m.customProgramCacheKey,earlier=cache.call(m);
      patched.set(m,{compile,cache});
      m.customProgramCacheKey=()=>earlier+'/boot-ambient-1';
      m.onBeforeCompile=function(s,renderer){
        compile.call(this,s,renderer);
        s.uniforms.tideFeet={value:centres};s.uniforms.tideAxes={value:axes};
        s.vertexShader=s.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vTideFloorWorld;')
          .replace('#include <project_vertex>','#include <project_vertex>\n'+vertex);
        s.fragmentShader=s.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vTideFloorWorld; uniform vec3 tideFeet[4]; uniform vec2 tideAxes[4];\n'+contact)
          .replace('#include <lights_fragment_end>',`#include <lights_fragment_end>
            float floorFacing=smoothstep(.22,.84,dot(normal,viewMatrix[1].xyz));
            if(floorFacing>.001){
              float lightLeft=1.;
              for(int ti=0;ti<4;ti++)lightLeft*=1.-tideSole(tideFeet[ti],tideAxes[ti],vTideFloorWorld);
              float occ=floorFacing*(1.-lightLeft);
              reflectedLight.indirectDiffuse*=1.-occ*.88;
              reflectedLight.indirectSpecular*=1.-occ*.80;
              reflectedLight.directDiffuse*=1.-occ*.39;
              reflectedLight.directSpecular*=1.-occ*.31;
            }`);
      };
      m.needsUpdate=true;
    }
    function visit(o){
      if(actors.includes(o))return;
      if(o.isMesh&&o.receiveShadow){if(Array.isArray(o.material))o.material.forEach(install);else install(o.material);}
      for(const c of o.children)visit(c);
    }
    visit(scene);
    function update(){
      for(let i=0;i<joints.length;i++){
        const b=joints[i];b.updateWorldMatrix(true,false);const mat=b.matrixWorld.elements;
        centres[i].copy(point.set(0,-.050,-.051).applyMatrix4(b.matrixWorld));
        axes[i].set(mat[8],mat[10]);if(axes[i].lengthSq()<.0001)axes[i].set(0,1);else axes[i].normalize();
      }
    }
    return {update,dispose(){
      for(const [m,a] of patched){m.onBeforeCompile=a.compile;m.customProgramCacheKey=a.cache;m.needsUpdate=true;}
      patched.clear();
    }};
  }
  return {create};
})();
