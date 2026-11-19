// A wet bowline strikes the sea with its leading bend first. Displace the light
// on the rendered ocean itself; the quay, hull and crest keep their ordinary depth.
(() => {
  'use strict';
  const life=1.26, owners=new WeakMap();
  const marker='vec3 reflected=reflect(-eye,normal)', foamMarker='float ledX=';
  const uniforms='\nuniform vec4 bowWashHit;uniform vec2 bowWashDir;\n';
  const detail=`
      float bowWashFoam=0.;
      if(bowWashHit.w>.5 && abs(p.x-bowWashHit.x)<1.15 && abs(p.y-bowWashHit.y)<1.15){
        float age=bowWashHit.z;
        vec2 d=p-bowWashHit.xy-bowWashDir*(.045*age);
        vec2 crossDir=vec2(-bowWashDir.y,bowWashDir.x);
        vec2 oval=vec2(dot(d,bowWashDir)/.89,dot(d,crossDir)/1.08);
        float radius=length(oval);
        vec2 axis=oval/max(.0008,radius);
        vec2 slope=axis.x*bowWashDir/.89+axis.y*crossDir/1.08;
        float theta=atan(oval.y,oval.x);
        float lobes=.33+.69*sin(2.*theta+.64)+.55*sin(5.*theta-1.11)+.25*sin(9.*theta+age*1.5);
        float breakUp=.035+.965*smoothstep(-.19,.54,lobes);
        float front=.452+.55*age/(1.+.47*age)+.013*sin(3.*theta+.3)+.007*sin(8.*theta+age)*smoothstep(.04,.29,age);
        float width=.019+.015*age;
        float a=(radius-front)/width, b=(radius-front+.067+.021*age)/(width*.84);
        float slopeWave=a*exp(-.85*a*a)+.58*b*exp(-.90*b*b)*smoothstep(.075,.25,age);
        float fade=smoothstep(-.005,.073,age)*(1.-smoothstep(.46,1.26,age));
        float slap=.64+.34*axis.x;
        normal=normalize(normal+vec3(slope.x,0.,slope.y)*slopeWave*(.70*breakUp*slap*fade));
        float early=(1.-smoothstep(.21,.59,age))*smoothstep(-.009,.046,age);
        float beads=.28+.72*smoothstep(.02,.82,sin(11.*theta+2.1*age)+.58*sin(25.*theta-.55));
        bowWashFoam=early*slap*beads*(.09+.91*breakUp)*(.62*exp(-a*a*1.52)+.13*exp(-b*b*1.1));
      }
      `;
  const lather='lit=mix(lit,vec3(.62,.72,.69),bowWashFoam);\n      ';
  function bind(mat,T){
    const existing=owners.get(mat);
    if(existing){existing.users++;return existing;}
    if(!mat?.fragmentShader?.includes(marker)||!mat.fragmentShader.includes(foamMarker))return null;
    const s={hit:new T.Vector4(0,0,0,0),dir:new T.Vector2(),owner:null,users:1};
    mat.uniforms.bowWashHit={value:s.hit};mat.uniforms.bowWashDir={value:s.dir};
    mat.fragmentShader=uniforms+mat.fragmentShader.replace(marker,detail+marker).replace(foamMarker,lather+foamMarker);
    mat.needsUpdate=true;owners.set(mat,s);return s;
  }
  function unbind(mat,s){
    if(!s||--s.users>0)return;
    // Remove only our own insertion. Other water effects may add code after us.
    mat.fragmentShader=mat.fragmentShader.replace(uniforms,'').replace(detail,'').replace(lather,'');
    if(mat.uniforms.bowWashHit?.value===s.hit)delete mat.uniforms.bowWashHit;
    if(mat.uniforms.bowWashDir?.value===s.dir)delete mat.uniforms.bowWashDir;
    mat.needsUpdate=true;owners.delete(mat);
  }
  function wave(x,z,t){
    return .46*Math.sin(.23*x+.11*z+1.12*t)+.34*Math.sin(-.17*x+.29*z-.88*t)+.18*Math.sin(.49*x-.41*z+1.42*t)+.09*Math.sin(.81*x+.62*z-1.64*t);
  }
  function physicsSurface(x,z,t,w){
    if(typeof TideFloating!=='undefined')return w+TideFloating.swell(x,z,t);
    const a=x-.18*Math.cos(.23*x+.11*z+1.12*t);return w+wave(x-.18*Math.cos(.23*a+.11*z+1.12*t),z,t);
  }
  function gridSurface(o) {
    const geo=o.geometry,pos=geo?.attributes.position,nx=(geo?.parameters?.widthSegments||0)+1,nz=(geo?.parameters?.heightSegments||0)+1;
    if(nx<2||nz<2||pos.count!==nx*nz)return physicsSurface;
    o.updateWorldMatrix(true,false);
    const m=o.matrixWorld.elements,xs=new Float64Array(nx),zs=new Float64Array(nz);
    if(m[1]||m[2]||m[4]||m[6]||m[8]||m[9]||m[0]<=0||m[10]<=0)return physicsSurface;
    for(let i=0;i<nx;i++)xs[i]=m[12]+pos.getX(i)*m[0];
    for(let j=0;j<nz;j++)zs[j]=m[14]+pos.getZ(j*nx)*m[10];
    if(xs[nx-1]<=xs[0]||zs[nz-1]<=zs[0])return physicsSurface;
    const bin=(range,n)=>{let a=0,b=range.length-1;while(b-a>1){const i=(a+b)>>1;if(range[i]<n)a=i;else b=i;}return a;};
    const ch=(x,z,t)=>x+.18*Math.cos(.23*x+.11*z+1.12*t);
    // TideFloating.swell inverts the continuous orbital displacement. The visible
    // coast triangulates those same waves. Interpolate its vertices beneath each drop.
    return (x,z,t,w)=>{
      const j=bin(zs,z),za=zs[j],zb=zs[j+1],v=(z-za)/(zb-za);
      let i=bin(xs,x-.18*Math.cos(.23*x+.11*z+1.12*t));
      for(let k=0;k<3;k++){
        const xa=xs[i],xb=xs[i+1],a=ch(xa,za,t),b=ch(xa,zb,t),c=ch(xb,zb,t),d=ch(xb,za,t);
        const left=a+(b-a)*v,right=d+(c-d)*v,mid=d+(b-d)*v;
        if(x<left&&i>0){i--;continue;}if(x>right&&i<nx-2){i++;continue;}
        if(x<=mid){const u=(x-left)/(d-a);return w+(1-v-u)*wave(xa,za,t)+v*wave(xa,zb,t)+u*wave(xb,za,t);}
        const u=(x-mid)/(c-b);return w+(1-v)*wave(xb,za,t)+(v-u)*wave(xa,zb,t)+u*wave(xb,zb,t);
      }
      return physicsSurface(x,z,t,w);
    };
  }
  const shelf={left:-.55,right:1.65,back:12.285,front:14.515,y:-2.39};
  function overStone(x,z){return x>=shelf.left&&x<=shelf.right&&z>=shelf.back&&z<=shelf.front;}
  function create(T,worldRoot){
    let mat=null,slot=null,sample=physicsSurface,disposed=false,impact=null,lookupAt=-Infinity;
    const owner={},root=new T.Group();root.name='船首缆眼 · 短时触水';root.visible=false;worldRoot.add(root);
    const shape=new T.LatheGeometry([[0,-1.1],[.72,-.86],[1,-.22],[.91,.27],[.57,.70],[0,1.24]].map(p=>new T.Vector2(...p)),7);
    const sheen=new T.ShaderMaterial({transparent:true,depthWrite:false,
      uniforms:{sky:{value:null},hasSky:{value:0}},
      vertexShader:`varying vec3 surfaceN,incident;void main(){
        mat4 transform=modelMatrix*instanceMatrix;vec4 w=transform*vec4(position,1.);
        mat3 axes=mat3(transform);
        surfaceN=normalize(axes*(normal/vec3(dot(axes[0],axes[0]),dot(axes[1],axes[1]),dot(axes[2],axes[2]))));
        incident=w.xyz-cameraPosition;gl_Position=projectionMatrix*viewMatrix*w;}`,
      fragmentShader:`uniform sampler2D sky;uniform float hasSky;varying vec3 surfaceN,incident;
        void main(){vec3 n=normalize(surfaceN),v=normalize(incident),r=reflect(v,n);
        float fres=.17+.71*pow(1.-abs(dot(n,v)),2.4);
        vec2 uv=vec2(.5+atan(r.z,r.x)/6.283185,.5+asin(clamp(r.y,-1.,1.))/3.141593);
        vec3 e=mix(vec3(.28,.38,.41)+.12*max(0.,r.y),texture2D(sky,uv).rgb,hasSky);
        vec3 glint=vec3(.83,.82,.71)*pow(max(dot(r,normalize(vec3(-.55,.63,-.35))),0.),18.);
        gl_FragColor=vec4(mix(vec3(.025,.064,.078),e,.34+.56*fres)+glint,.39+.41*fres);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`});
    const count=22,drops=new T.InstancedMesh(shape,sheen,count);drops.instanceMatrix.setUsage(T.DynamicDrawUsage);
    drops.frustumCulled=false;drops.visible=false;drops.name='缆圈拍水 · 短飞滴';root.add(drops);
    const prints=new T.PlaneGeometry(1.16,1.04).rotateX(-Math.PI/2);
    const wet=new T.ShaderMaterial({transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1,
      uniforms:{age:{value:0}},
      vertexShader:`varying vec2 uv0,posXZ;void main(){uv0=uv;vec4 p=modelMatrix*vec4(position,1.);posXZ=p.xz;gl_Position=projectionMatrix*viewMatrix*p;}`,
      fragmentShader:`varying vec2 uv0,posXZ;uniform float age;void main(){
        if(posXZ.x<-.548||posXZ.x>1.648||posXZ.y<12.287||posXZ.y>14.513)discard;
        vec2 p=(uv0-.5)*vec2(1.88,2.03);float a=atan(p.y,p.x);
        float radius=length(p)-(.789-.036*cos(a)+.034*sin(3.*a+.95)+.016*cos(7.*a));
        float grain=sin(a*19.+.6*sin(a*31.))*.27+.30*sin(a*4.+1.7)+.45*cos(a*3.-.3);
        float gaps=smoothstep(-.38,.48,grain);
        float stamp=(1.-smoothstep(.023,.077,abs(radius+.009*sin(a*32.))))*gaps;
        float fade=smoothstep(-.018,.081,age)*(1.-smoothstep(.34,1.26,age));
        float alpha=stamp*fade*.35;if(alpha<.005)discard;
        gl_FragColor=vec4(.023,.030,.028,alpha);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`});
    const stamp=new T.Mesh(prints,wet);stamp.name='搁台湿麻绳短印';stamp.visible=false;root.add(stamp);
    const pts=Array.from({length:count},()=>({}));const temp=new T.Matrix4(),inv=new T.Matrix4(),obj=new T.Object3D(),axis=new T.Vector3(),up=new T.Vector3(0,1,0);
    function findSea(t){
      if(slot||t<lookupAt)return;
      let world=worldRoot;while(world.parent)world=world.parent;
      const o=world.getObjectByName('潮汐海面');lookupAt=t+.30;
      if(!o?.material)return;
      const result=bind(o.material,T);if(!result)return;
      mat=o.material;slot=result;sample=gridSurface(o);
    }
    function mute(){
      if(slot?.owner===owner){slot.hit.w=0;slot.owner=null;}
      root.visible=stamp.visible=drops.visible=false;drops.count=0;
    }
    function launch(hit,t,w){
      const vx=Number.isFinite(hit.vx)?hit.vx:0,vz=Number.isFinite(hit.vz)?hit.vz:0;
      const len=Math.hypot(vx,vz),dx=len>.03?vx/len:.145,dz=len>.03?vz/len:-.98944;
      const k={x:hit.x,y:hit.y,z:hit.z,kind:hit.kind,start:t-hit.age,dx,dz};
      if(k.kind!=='water')return k;
      let seed=(Math.round(1024*hit.x)*73856093 ^ Math.round(1024*hit.z)*19349663 ^ 15739)>>>0;
      const rand=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
      for(let i=0;i<count;i++){
        const p=pts[i],front=i<count*.71,theta=front?(rand()-.5)*3.28:Math.PI+(rand()-.5)*3.22;
        const f=Math.cos(theta),s=Math.sin(theta),rad=.93+.12*rand();
        p.x=k.x+rad*(.405*f*dx-.49*s*dz);p.z=k.z+rad*(.405*f*dz+.49*s*dx);
        p.delay=.020+.095*rand()+.016*(1-f);
        p.y=sample(p.x,p.z,k.start+p.delay,w)+.012;
        const spread=.35+.67*rand();
        p.vx=(f*dx-s*dz)*spread+dx*(.24+.28*rand());p.vz=(f*dz+s*dx)*spread+dz*(.24+.28*rand());
        p.vy=.79+rand()*.91+(front?.25:0);p.r=.0065+.009*rand();p.width=.68+.36*rand();
      }
      return k;
    }
    function update(state){
      if(disposed)return;
      const t=state?.time,base=state?.water;
      if(!state?.active||!Number.isFinite(t)||!Number.isFinite(base)){impact=null;mute();return;}
      const h=state.impact;
      if(h&&(h.kind==='water'||h.kind==='stone'||h.kind==='horn')&&Number.isFinite(h.x+h.y+h.z+h.age)){
        if(h.age<0||h.age>=life){impact=null;mute();return;}
        if(h.kind==='water')findSea(t);
        if(!impact||impact.kind!==h.kind||Math.abs((t-h.age)-impact.start)>.045||Math.hypot(impact.x-h.x,impact.z-h.z)>.12){
          impact=launch(h,t,base);
        }
      }
      if(!impact){mute();return;}
      const a=t-impact.start;
      if(a<0||a>=life||impact.kind==='horn'){impact=null;mute();return;}
      root.visible=true;root.updateWorldMatrix(true,false);inv.copy(root.matrixWorld).invert();
      const {x,z,dx,dz}=impact;
      if(impact.kind==='stone'){
        if(!overStone(x,z)||Math.abs(impact.y-shelf.y)>.32){mute();return;}
        if(slot?.owner===owner){slot.hit.w=0;slot.owner=null;}
        drops.count=0;drops.visible=false;stamp.visible=true;
        obj.position.set(x,shelf.y+.003,z);obj.rotation.set(0,Math.atan2(dx,dz),0);obj.scale.set(1,1,1);obj.updateMatrix();
        stamp.matrixAutoUpdate=false;stamp.matrix.multiplyMatrices(inv,obj.matrix);stamp.matrixWorldNeedsUpdate=true;wet.uniforms.age.value=a;return;
      }
      stamp.visible=false;if(slot){slot.owner=owner;slot.hit.set(x,z,a,1);slot.dir.set(dx,dz);}
      const sky=mat?.uniforms?.uSky?.value;sheen.uniforms.sky.value=sky||null;sheen.uniforms.hasSky.value=sky&&mat.uniforms.uHasSky?.value>.5?1:0;
      let n=0;
      if(a<.71)for(const p of pts){
        const s=a-p.delay;if(s<=0||s>.58)continue;
        const xx=p.x+p.vx*s,zz=p.z+p.vz*s,h=p.y+p.vy*s-4.905*s*s;
        if(h<sample(xx,zz,t,base)+.006 || (overStone(xx,zz)&&h<shelf.y+.012))continue;
        obj.position.set(xx,h,zz);axis.set(p.vx,p.vy-9.81*s,p.vz);const speed=axis.length();
        if(speed>0)obj.quaternion.setFromUnitVectors(up,axis.multiplyScalar(1/speed));
        const sz=p.r*Math.min(1,s/.028);obj.scale.set(sz*p.width,sz*(1.05+.36*speed),sz);obj.updateMatrix();
        temp.multiplyMatrices(inv,obj.matrix);drops.setMatrixAt(n++,temp);
      }
      drops.count=n;drops.visible=n>0;if(n)drops.instanceMatrix.needsUpdate=true;
    }
    function dispose(){
      if(disposed)return;disposed=true;impact=null;mute();if(slot)unbind(mat,slot);
      root.removeFromParent();drops.dispose();shape.dispose();sheen.dispose();wet.dispose();prints.dispose();root.clear();mat=slot=null;
    }
    findSea(0);
    return {update,dispose};
  }
  window.TideBowWash={create};
})();
