// Original optical bloom for the bridge receiver. Layer 5 is enabled only on its camera.
window.TideTransitOptics = (() => {
  const layer = 5;
  function create(scene, g) {
    const T = THREE;
    const marker = scene.getObjectByName('旧绿标');
    if (!g.signal || !marker) return { update() {}, dispose() {} };

    // The rear lamp's PointLight and the lens centre in the floating lantern are the physical datums.
    const rear = TideSignal.point(0, 4.265, -.82);
    const shore = new T.Vector3(rear.x, rear.y, rear.z);
    const buoy = new T.Vector3();
    const geometry = new T.BufferGeometry();
    geometry.setAttribute('position', new T.Float32BufferAttribute([
      -1,-1,0, 1,-1,0, 1,1,0, -1,1,0,
      -1,-1,1, 1,-1,1, 1,1,1, -1,1,1
    ], 3));
    geometry.setIndex([0,1,2,0,2,3,4,5,6,4,6,7]);
    const uniforms = {
      rear: {value:shore}, buoy: {value:buoy}, rearPower: {value:0},
      density: {value:scene.fog?.density || 0}
    };
    const material = new T.ShaderMaterial({
      uniforms, transparent:true, depthTest:true, depthWrite:false, toneMapped:false,
      vertexShader:`
        uniform vec3 rear, buoy;
        uniform float rearPower, density;
        varying vec2 disc;
        varying float through;
        void main(){
          float i=position.z;
          vec3 lamp=mix(rear,buoy,i);
          vec3 toward=normalize(cameraPosition-lamp);
          // Put the camera-facing image on the lamp envelope, clear of its own glass.
          vec4 mv=viewMatrix*vec4(lamp+toward*mix(.55,.251,i),1.);
          mv.xy+=position.xy*mix(.78,.49,i);
          float path=density*length(cameraPosition-lamp);
          through=exp(-path*path)*mix(rearPower,1.,i);
          disc=position.xy;
          gl_Position=projectionMatrix*mv;
        }`,
      fragmentShader:`
        varying vec2 disc;
        varying float through;
        void main(){
          float r2=dot(disc,disc);
          float envelope=1.-smoothstep(.42,1.,r2);
          float alpha=through*envelope*(.36*exp(-r2*14.)+.18*exp(-r2*3.));
          gl_FragColor=vec4(.057,.95,.31,alpha);
          #include <colorspace_fragment>
        }`
    });
    const lens = new T.Mesh(geometry, material);
    lens.name='引导灯与旧标 · 受光玻璃';
    lens.layers.set(layer);
    lens.frustumCulled=false;
    lens.renderOrder=2;
    lens.userData.noSeaReflection=true;
    scene.add(lens);
    function update(g) {
      marker.localToWorld(buoy.set(0,TideBuoyMotion.lampHeight,0));
      uniforms.rearPower.value=T.MathUtils.clamp(g.cues.rangeGreen||0,0,1);
      uniforms.density.value=scene.fog?.density || 0;
    }
    update(g);
    return {update,dispose(){lens.removeFromParent();geometry.dispose();material.dispose();}};
  }
  return Object.freeze({create,layer});
})();
