// Concrete Slab Wall, Poly Haven (CC0). Shared diffuse, OpenGL normal and packed
// occlusion/roughness maps span the quay in metres, including instanced walls.
const TideConcrete=(()=>{
  const T=THREE;
  let maps;
  function textures(){
    if(maps)return maps;
    const loader=new T.TextureLoader();
    maps=window.TideSlabMaps.map((uri,i)=>{
      const t=loader.load(uri);t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=8;
      if(i===0)t.colorSpace=T.SRGBColorSpace;
      return t;
    });
    return maps;
  }
  function material(tint,water=-2.8){
    const [albedo,normal,arm]=textures();
    const m=new T.MeshStandardMaterial({color:tint,map:albedo,normalMap:normal,roughnessMap:arm,roughness:.91,metalness:.025});
    m.normalScale.set(.76,.76);
    const line={value:water};m.userData.waterline=line;
    m.onBeforeCompile=shader=>{
      shader.uniforms.slabWater=line;
      shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 slabPosition,slabFace;')
        .replace('#include <worldpos_vertex>',`#include <worldpos_vertex>
          mat4 slabWorld=modelMatrix;
          #ifdef USE_INSTANCING
            slabWorld=slabWorld*instanceMatrix;
          #endif
          mat3 axes=mat3(slabWorld);
          slabFace=normalize(axes*(normal/vec3(dot(axes[0],axes[0]),dot(axes[1],axes[1]),dot(axes[2],axes[2]))));
          slabPosition=(slabWorld*vec4(transformed,1.)).xyz;`);
      shader.fragmentShader=shader.fragmentShader
        .replace('#include <common>','#include <common>\nuniform float slabWater;varying vec3 slabPosition,slabFace;')
        .replace('#include <map_fragment>',`vec3 face=abs(slabFace);
          vec2 wallUV=face.y>.72?slabPosition.xz:(face.x>face.z?slabPosition.zy:slabPosition.xy);
          wallUV/=2.3;
          vec3 aggregate=texture2D(map,wallUV).rgb;
          vec3 armSample=texture2D(roughnessMap,wallUV).rgb;
          float damp=1.-smoothstep(slabWater-.2,slabWater+.65+.18*sin(wallUV.x*5.9),slabPosition.y);
          float dirt=texture2D(map,wallUV*vec2(.3,.12)+.27).r;
          diffuseColor.rgb*=aggregate*(.80+.36*dirt)*mix(.77,1.,armSample.r)*mix(vec3(1.),vec3(.44,.62,.53),damp);`)
        .replace('#include <roughnessmap_fragment>','float roughnessFactor=clamp(roughness*armSample.g-.35*damp,.28,.96);')
        .replace('#include <normal_fragment_begin>',T.ShaderChunk.normal_fragment_begin.replaceAll('vNormalMapUv','wallUV'))
        .replace('#include <normal_fragment_maps>',T.ShaderChunk.normal_fragment_maps.replaceAll('vNormalMapUv','wallUV'));
    };
    return m;
  }
  return {material};
})();
