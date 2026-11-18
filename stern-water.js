/* Wet hemp eye and boat-hook contact at the south face of the North Cape quay. */
window.TideSternWater = (() => {
  'use strict';
  const T = THREE;
  const edge = {left:-4.15, right:-3.15, near:13.58, far:14.70};
  const limit = (v,low,high) => Math.min(high, Math.max(low,v));
  const count = 8, life = .91;
  const declarations = `
    uniform vec4 sternWaterHits[8];
    uniform vec2 sternWaterClock;
  `;
  // Change the normal of the visible sea fragment itself. The same small wave
  // then reflects the sky, hull or quay appropriate to each split camera.
  const ripples = `
      if(sternWaterClock.y>.5 && dist<30. &&
         p.x>-4.15 && p.x< -3.15 && p.y>13.58 && p.y<14.70){
        vec2 inset=min(p-vec2(-4.15,13.58),vec2(-3.15,14.70)-p);
        float wetEdge=smoothstep(.003,.035,min(inset.x,inset.y));
        vec2 slope=vec2(0.);
        for(int n=0;n<8;n++){
          vec4 hit=sternWaterHits[n];
          float age=sternWaterClock.x-hit.z;
          if(age>=0. && age<.91){
            vec2 d=p-hit.xy-vec2(.019,.007)*age;
            float radius=length(d);
            float front=.012+(.36+.13*hit.w)*age;
            float width=.010+.015*age;
            float q=(radius-front)/width;
            if(q> -5. && q<2.8){
              float ripple=q*exp(-q*q)-.53*(q+2.44)*exp(-.86*(q+2.44)*(q+2.44));
              float fade=(1.-smoothstep(.07,.91,age))*smoothstep(.0,.056,age);
              slope+=d/max(.009,radius)*ripple*hit.w*fade*.91;
            }
          }
        }
        normal=normalize(normal+vec3(slope.x,0.,slope.y)*wetEdge);
      }
  `;
  const marker = 'vec3 reflected=reflect(-eye,normal)';
  const openWater = (x,z) => x>edge.left && x<edge.right && z>edge.near && z<edge.far;
  function seaHeight(x,z,t,base) {
    if(typeof TideFloating!=='undefined') return base+TideFloating.swell(x,z,t);
    // Same two-step orbital inversion as the launch physics, for isolated previews.
    let p=x;
    for(let i=0;i<2;i++) p=x-.18*Math.cos(.23*p+.11*z+1.12*t);
    return base+.46*Math.sin(.23*p+.11*z+1.12*t)+.34*Math.sin(-.17*p+.29*z-.88*t)
      +.18*Math.sin(.49*p-.41*z+1.42*t)+.09*Math.sin(.81*p+.62*z-1.64*t);
  }
  function create(scene) {
    let mat=null, lastTime=null, lastActive=false, lastCaught=false, cursor=0, ringUntil=-Infinity;
    let serial=9341, disposed=false;
    function noise() { serial=(Math.imul(1664525,serial)+1013904223)>>>0; return serial/4294967296; }
    const samples=Array.from({length:count},()=>new T.Vector4(0,0,-1e6,0));
    const clock=new T.Vector2();
    const states=[newProbe(),newProbe()];
    function newProbe(){
      return {x:0,y:0,z:0,h:0,present:false,inWater:false,reserve:0,due:Infinity,
        lastMark:-Infinity,markX:0,markZ:0};
    }
    const beads=Array.from({length:14},()=>({live:false,x:0,y:0,z:0,vx:0,vy:0,vz:0,r:0}));
    const profile=[[0,-1.08],[.63,-.85],[.94,-.43],[1,.04],[.83,.50],[.40,.98],[0,1.29]]
      .map(([r,h])=>new T.Vector2(r,h));
    const geo=new T.LatheGeometry(profile,8);
    const sheen=new T.ShaderMaterial({
      transparent:true,depthWrite:false,
      vertexShader:`
        varying vec3 sternN,sternV;
        void main(){
          vec4 world=modelMatrix*instanceMatrix*vec4(position,1.);
          mat3 basis=mat3(modelMatrix*instanceMatrix);
          sternN=basis*(normal/vec3(dot(basis[0],basis[0]),dot(basis[1],basis[1]),dot(basis[2],basis[2])));
          sternV=cameraPosition-world.xyz;
          gl_Position=projectionMatrix*viewMatrix*world;
        }`,
      fragmentShader:`
        varying vec3 sternN,sternV;
        void main(){
          vec3 n=normalize(sternN), v=normalize(sternV);
          vec3 mirrored=reflect(-v,n);
          float rim=pow(1.-clamp(dot(v,n),0.,1.),2.);
          float sky=smoothstep(-.18,.31,mirrored.y);
          float glint=pow(max(0.,dot(mirrored,normalize(vec3(-.42,.82,-.39)))),14.);
          vec3 tint=mix(vec3(.025,.069,.084),vec3(.53,.65,.65),sky)+glint*vec3(.72,.67,.53);
          gl_FragColor=vec4(tint,.27+.32*rim+.27*sky+.14*glint);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`
    });
    const drops=new T.InstancedMesh(geo,sheen,beads.length);
    drops.name='艉缆下缘 · 水滴';drops.visible=false;drops.count=0;
    drops.instanceMatrix.setUsage(T.DynamicDrawUsage);drops.frustumCulled=false;
    scene.add(drops);
    const transform=new T.Matrix4(), local=new T.Vector3();
    function bindSea(){
      const sea=scene.getObjectByName('潮汐海面');
      if(!sea?.material.fragmentShader?.includes(marker))return;
      mat=sea.material;
      mat.uniforms.sternWaterHits={value:samples};mat.uniforms.sternWaterClock={value:clock};
      mat.fragmentShader=declarations+mat.fragmentShader.replace(marker,ripples+marker);
      mat.needsUpdate=true;
    }
    // The installed launch contact module already has the tilted hull's cross-sections.
    // Reuse its live waterline. This also suppresses drops under the deck on approach.
    function outsideHull(x,y,z){
      const u=mat?.uniforms, tex=u?.csHull?.value?.image;
      if(!tex?.data||!u.csBoat?.value||!u.csToLocal)return true;
      const bounds=u.csHullBounds.value, shape=u.csShape.value;
      local.set(x,y,z).applyMatrix4(u.csToLocal.value);
      if(local.x<bounds.x||local.x>bounds.y)return true;
      const px=limit(Math.round((local.x-bounds.x)/(bounds.y-bounds.x)*(tex.width-1)),0,tex.width-1);
      const py=limit(Math.round((local.y-bounds.z)/(bounds.w-bounds.z)*(tex.height-1)),0,tex.height-1);
      const offset=4*(py*tex.width+px),width=tex.data[offset]*shape.x/255;
      const keel=bounds.z+tex.data[offset+1]*(bounds.w-bounds.z)/255;
      return local.y<keel-.015 || Math.abs(local.z-shape.y)>width+.015;
    }
    function mark(x,z,t,strength){
      if(!openWater(x,z))return;
      samples[cursor].set(x,z,t,strength);
      cursor=(cursor+1)%count;ringUntil=t+life;
    }
    function release(x,y,z,vx,vy,vz,t,w,fromEye){
      const d=beads.find(b=>!b.live);
      if(!d)return;
      const sx=x+(noise()-.5)*(fromEye?.027:.009),sz=z+(noise()-.5)*.014;
      const level=seaHeight(sx,sz,t,w);
      if(y-level<.015||!openWater(sx,sz)||!outsideHull(sx,level,sz))return;
      d.live=true;d.x=sx;d.y=y;d.z=sz;d.r=(fromEye?.0049:.0037)+noise()*.0028;
      d.vx=limit(vx*.30,-.35,.35)+(noise()-.45)*.10;
      d.vz=limit(vz*.30,-.35,.35)+(noise()-.50)*.08;
      d.vy=limit(vy*.15,-.65,.35)-.10;
    }
    function probe(s,pos,fromEye,caught,t,w,dt){
      if(!pos||!Number.isFinite(pos.x+pos.y+pos.z)){s.present=false;return;}
      const x=pos.x, y=pos.y-(fromEye?.248:0), z=pos.z, level=seaHeight(x,z,t,w),h=y-level;
      if(!openWater(x,z)||!outsideHull(x,level,z)){s.present=false;s.due=Infinity;return;}
      const first=!s.present;
      const vx=first||dt===0?0:(x-s.x)/dt,vy=first||dt===0?0:(y-s.y)/dt,vz=first||dt===0?0:(z-s.z)/dt;
      if(first){
        s.inWater=h<0;s.reserve=fromEye?4:0;s.lastMark=-Infinity;s.markX=x;s.markZ=z;s.due=Infinity;
      }
      const entering=!first&&!s.inWater&&h<-.006, emerging=!first&&s.inWater&&h>.015;
      const immersed=s.inWater?!emerging:(entering||h<-.006);
      if(entering||emerging){
        // Linear interpolation puts a fast glancing contact at its crossing, including moving swell.
        const a=limit(s.h/(s.h-h),0,1),cx=s.x+(x-s.x)*a,cz=s.z+(z-s.z)*a;
        if(t-s.lastMark>.11){mark(cx,cz,t-dt*(1-a),fromEye?.72:.89);s.lastMark=t;}
        s.markX=x;s.markZ=z;
      }else if(immersed&&h>-.12&&t-s.lastMark>.24&&Math.hypot(x-s.markX,z-s.markZ)>.09){
        mark(x,z,t,fromEye?.49:.65);s.lastMark=t;s.markX=x;s.markZ=z;
      }
      if(immersed){s.reserve=fromEye?5:2;s.due=Infinity;}
      const justCaught=fromEye&&caught&&!lastCaught;
      const lifting=fromEye&&!first&&vy>.22&&(h-s.h)>.15*dt;
      if(!immersed&&s.reserve>0&&!Number.isFinite(s.due)&&(justCaught||emerging||lifting)){
        s.due=t+.025+noise()*.048;
      }
      if(!immersed&&h>.014&&s.reserve>0&&t>=s.due){
        release(x,y,z,vx,vy,vz,t,w,fromEye);
        s.reserve--;s.due=s.reserve?t+.075+.115*noise()+.055*(4-s.reserve):Infinity;
      }
      s.x=x;s.y=y;s.z=z;s.h=h;s.present=true;s.inWater=immersed;
    }
    function reset(){
      lastActive=false;lastCaught=false;ringUntil=-Infinity;
      for(const sample of samples)sample.z=-1e6;
      for(const d of beads)d.live=false;
      for(const s of states)s.present=false;
      drops.visible=false;drops.count=0;clock.y=0;
    }
    function update(input){
      if(disposed||!input||!Number.isFinite(input.time+input.water))return;
      const t=input.time,w=input.water;
      let dt=lastTime===null?0:t-lastTime;
      if(dt<0||dt>.40){reset();dt=0;}
      lastTime=t;
      const active=!!input.active&&!input.fast;
      if(active){
        if(!mat)bindSea();
        if(!lastActive)for(const s of states)s.present=false;
        probe(states[0],input.eye,true,!!input.caught,t,w,dt);
        probe(states[1],input.tip,false,false,t,w,dt);
      }
      lastCaught=!!input.caught;lastActive=active;
      let n=0;
      for(const b of beads){
        if(!b.live)continue;
        const oldX=b.x,oldY=b.y,oldZ=b.z;
        b.x+=b.vx*dt;b.z+=b.vz*dt;b.y+=b.vy*dt-4.905*dt*dt;b.vy-=9.81*dt;
        const level=seaHeight(b.x,b.z,t,w);
        if(!openWater(b.x,b.z)||!outsideHull(b.x,level,b.z)){b.live=false;continue;}
        if(b.y<=level){
          const prev=oldY-seaHeight(oldX,oldZ,t-dt,w),a=limit(prev/Math.max(.00001,prev+level-b.y),0,1);
          mark(oldX+(b.x-oldX)*a,oldZ+(b.z-oldZ)*a,t-dt*(1-a),limit(.36+Math.abs(b.vy)*.05,.38,.63));
          b.live=false;continue;
        }
        const length=1+Math.min(.74,Math.abs(b.vy)*.16);
        transform.makeScale(b.r,b.r*length,b.r);transform.setPosition(b.x,b.y,b.z);
        drops.setMatrixAt(n++,transform);
      }
      drops.count=n;drops.visible=n>0;if(n)drops.instanceMatrix.needsUpdate=true;
      clock.set(t,t<ringUntil?1:0);
    }
    function dispose(){
      if(disposed)return;
      disposed=true;scene.remove(drops);drops.dispose();geo.dispose();sheen.dispose();
      if(mat?.uniforms.sternWaterClock?.value===clock){
        mat.fragmentShader=mat.fragmentShader.replace(declarations,'').replace(ripples,'');
        delete mat.uniforms.sternWaterHits;delete mat.uniforms.sternWaterClock;mat.needsUpdate=true;
      }
    }
    return {update,dispose};
  }
  return {create};
})();
