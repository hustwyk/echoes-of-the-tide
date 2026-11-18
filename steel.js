// Scan projection in assembly space keeps the wear on the moving metal.
const TideSteel=(()=>{
  const T=THREE;
  function material(i,own,weathered=false){
    const maps=window.TideBridgeSteel[i].map((uri,j)=>{
      const t=own(new T.TextureLoader().load(uri));if(!j)t.colorSpace=T.SRGBColorSpace;
      t.anisotropy=8;t.wrapS=t.wrapT=T.RepeatWrapping;return t;
    });
    const [diffuse,normal,arm]=maps;
    const m=own(new T.MeshStandardMaterial({map:diffuse,normalMap:normal,metalnessMap:arm,roughnessMap:arm,metalness:.82,roughness:.84}));
    m.normalScale.setScalar(.65);m.onBeforeCompile=s=>{
      s.uniforms.bridgeRepeat={value:i?1.65:.75};s.uniforms.surfaceBlend={value:weathered?1:0};
      s.vertexShader=s.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 assembly,faceDir;')
        .replace('#include <worldpos_vertex>',`#include <worldpos_vertex>
          mat3 ax=mat3(instanceMatrix);
          assembly=(instanceMatrix*vec4(transformed,1.)).xyz;
          faceDir=normalize(ax*(normal/vec3(dot(ax[0],ax[0]),dot(ax[1],ax[1]),dot(ax[2],ax[2]))));`);
      s.fragmentShader=s.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 assembly,faceDir;uniform float bridgeRepeat,surfaceBlend;')
        .replace('#include <map_fragment>',`vec3 a=abs(faceDir);vec2 localUV=bridgeRepeat*(a.y>.68?assembly.xz:(a.x>a.z?assembly.zy:assembly.xy));
          vec3 scanned=texture2D(map,localUV).rgb;
          float grain=dot(scanned,vec3(.30,.58,.12));
          vec3 patina=mix(vec3(.32,.45,.39),vec3(1.26,1.14,.98),smoothstep(.022,.36,grain));
          diffuseColor.rgb*=mix(scanned,patina,surfaceBlend);vec3 arm=texture2D(roughnessMap,localUV).rgb;diffuseColor.rgb*=mix(.78,1.,arm.r);`)
        .replace('#include <roughnessmap_fragment>','float roughnessFactor=clamp(roughness*arm.g,.23,.97);')
        .replace('#include <metalnessmap_fragment>','float metalnessFactor=metalness*mix(arm.b,.56+.37*arm.r,surfaceBlend);')
        .replace('#include <normal_fragment_begin>',T.ShaderChunk.normal_fragment_begin.replaceAll('vNormalMapUv','localUV'))
        .replace('#include <normal_fragment_maps>',T.ShaderChunk.normal_fragment_maps.replaceAll('vNormalMapUv','localUV'));
    };return m;
  }
  return {material};
})();
