// A close focus for the dialogue camera. Each half keeps its own depth and focus distance.
const TideLens=(()=>{
  const T=THREE;
  function create(renderer){
    const hdr=renderer.extensions.has('EXT_color_buffer_float');
    const target=new T.WebGLRenderTarget(1,1,{type:hdr?T.HalfFloatType:T.UnsignedByteType,depthBuffer:true});
    target.depthTexture=new T.DepthTexture(1,1,T.UnsignedShortType);
    const uniforms={frame:{value:target.texture},depth:{value:target.depthTexture},pixel:{value:new T.Vector2()},
      lens:{value:new T.Vector4()}};
    const material=new T.ShaderMaterial({uniforms,depthTest:false,depthWrite:false,
      vertexShader:'varying vec2 st;void main(){st=uv;gl_Position=vec4(position.xy,0.,1.);}',
      fragmentShader:`uniform sampler2D frame,depth;uniform vec2 pixel;uniform vec4 lens;varying vec2 st;
        float distanceAt(vec2 uv){float d=texture2D(depth,uv).r;return lens.x*lens.y/(lens.y-d*(lens.y-lens.x));}
        void main(){
          float center=distanceAt(st),focus=lens.z;
          float blur=clamp((abs(center-focus)-.060)/max(center,.05),0.,1.)*lens.w;
          vec3 color=texture2D(frame,st).rgb;
          if(blur>.50){
            vec3 sum=color;float weights=1.;
            for(int i=0;i<16;i++){
              float k=float(i)+.5,angle=k*2.3999632;
              vec2 uv=st+vec2(cos(angle),sin(angle))*sqrt(k/16.)*blur*pixel;
              float d=distanceAt(uv);
              float weight=1.-step(d+.075,center)*(1.-smoothstep(.055,.18,abs(d-focus)));
              sum+=texture2D(frame,uv).rgb*weight;weights+=weight;
            }
            color=sum/weights;
          }
          gl_FragColor=vec4(color,1.);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`});
    const scene=new T.Scene(),geometry=new T.PlaneGeometry(2,2);
    scene.add(new T.Mesh(geometry,material));const flat=new T.Camera();
    function render(world,camera,start,w,h,focus){
      const dpr=renderer.getPixelRatio(),width=Math.max(1,Math.round(w*dpr)),height=Math.max(1,Math.round(h*dpr));
      target.setSize(width,height);uniforms.pixel.value.set(1/width,1/height);
      uniforms.lens.value.set(camera.near,camera.far,focus,Math.min(12,.0105*height));
      renderer.setRenderTarget(target);renderer.render(world,camera);
      renderer.setRenderTarget(null);renderer.setViewport(start,0,w,h);renderer.setScissor(start,0,w,h);
      renderer.render(scene,flat);
    }
    function dispose(){target.dispose();geometry.dispose();material.dispose();}
    return {render,dispose};
  }
  return {create};
})();
