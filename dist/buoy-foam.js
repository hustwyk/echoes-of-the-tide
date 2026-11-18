/* Water displaced by the old harbour buoy. No proxy water or foam geometry. */
window.TideBuoyFoam=(()=>{
  'use strict';
  const T=THREE,slots=6,clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
  const bindings=new WeakMap();
  const stations=[[-.78,.650],[-.52,.870],[-.29,1.020],[-.18,1.055],[-.13,1.083],[-.035,1.091],[.025,1.090],[.070,1.080],[.105,1.064],[.390,1.057],[.435,1.034],[.476,.974],[.490,.895],[.515,.846]];
  function radiusAt(h){
    let i=0;while(i<stations.length-2&&stations[i+1][0]<h)i++;
    const a=stations[i],b=stations[i+1];return a[1]+(b[1]-a[1])*clamp((h-a[0])/(b[0]-a[0]),0,1);
  }
  const normalAnchor='vec3 reflected=reflect(-eye,normal)';
  const colorAnchor='lit=mix(lit,lit*vec3(.26,.39,.40)+vec3(.004,.009,.010),uInside);';
  const declarations=`
    // North Cape buoy / tilted hull stations and capillary foam.
    uniform vec4 buoySurface,buoyFlow;
    uniform mat4 buoyLocal;
    uniform sampler2D buoyCells;
    uniform vec4 buoyPuffs[6],buoyDrifts[6];

    // Paired y/r stations from the plated float. The rubbing band is fullest
    // just below flotation. An oblique slice through this body is not circular.
    float buoyBreadth(float h){
      if(h<-.29){
        if(h<-.52)return mix(.650,.870,clamp((h+.78)/.26,0.,1.));
        return mix(.870,1.020,(h+.52)/.23);
      }
      if(h<-.13){
        if(h<-.18)return mix(1.020,1.055,(h+.29)/.11);
        return mix(1.055,1.083,(h+.18)/.05);
      }
      if(h<.105){
        if(h<-.035)return mix(1.083,1.091,(h+.13)/.095);
        if(h<.025)return mix(1.091,1.090,(h+.035)/.060);
        if(h<.070)return mix(1.090,1.080,(h-.025)/.045);
        return mix(1.080,1.064,(h-.070)/.035);
      }
      if(h<.435){
        if(h<.390)return mix(1.064,1.057,(h-.105)/.285);
        return mix(1.057,1.034,(h-.390)/.045);
      }
      if(h<.476)return mix(1.034,.974,(h-.435)/.041);
      if(h<.490)return mix(.974,.895,(h-.476)/.014);
      return mix(.895,.846,clamp((h-.490)/.025,0.,1.));
    }
  `;
  const normalPatch=`
      float buoyFroth=0.,buoyShade=0.;
      vec2 buoyOffset=p-buoySurface.xy;
      if(buoySurface.w>.5 && dist<142. && dot(buoyOffset,buoyOffset)<14.4){
        vec3 localBuoy=(buoyLocal*vec4(vSea,1.)).xyz;
        float radius=length(localBuoy.xz),sd=radius-buoyBreadth(localBuoy.y);
        float exterior=smoothstep(-.024,.012,sd);
        float contactHeight=smoothstep(-.81,-.74,localBuoy.y)*(1.-smoothstep(.510,.54,localBuoy.y));
        vec2 outward=buoyOffset/max(.01,length(buoyOffset));
        vec2 current=buoyFlow.xy,across=vec2(-current.y,current.x);
        float pressure=buoyFlow.z;
        float fwd=-dot(current,outward);
        float orient=smoothstep(-.81,.76,fwd);
        float visibility=1.-smoothstep(79.,142.,dist);
        // Keep the smallest film walls band-limited in grazing views.
        float aa=min(.103,.00035*dist/max(.119,abs(eye.y)));
        vec2 adv=buoyOffset-current*t*.089;
        vec2 torn=texture2D(uNoise,adv*.054+vec2(.189,.61)).rg;
        vec2 fibre=vec2(dot(adv,across),dot(adv,current));
        vec2 uv=fibre*vec2(.68,.47)+vec2(.103,.19)+.062*torn;
        vec3 lattice=texture2D(buoyCells,uv).rgb;
        vec3 grain=texture2D(uNoise,adv*.084+torn*.013).rgb;
        float film=mix(1.-smoothstep(.035,.19,abs(lattice.r-.50)),lattice.r,buoyFlow.w);
        float lace=clamp(.20+.69*film+.18*lattice.g,0.,1.);
        float tear=smoothstep(.27,.73,.48*torn.r+.26*grain.r+.26*grain.g);
        // Water folds onto the windward shoulder. On the lee side there is a
        // wet seam and isolated returning fragments instead of an outline.
        float climb=smoothstep(-.12,.15,localBuoy.y);
        float returning=smoothstep(.32,.71,.47*grain.r+.31*torn.g+.22*climb);
        float load=.31+.58*orient+.20*climb;
        float thick=.024+load*(.067+.143*pressure)*(.64+.92*tear);
        float line=smoothstep(-.02,.020,sd)*(1.-smoothstep(thick*.24,thick+aa,sd));
        float opening=smoothstep(.24,.68,.55*tear+.34*orient+.20*pressure+.14*climb);
        float patches=.72*returning*smoothstep(.34,.65,.45*torn.r+.40*grain.g+.15*climb);
        buoyFroth=line*load*max(opening,patches)*(.40+.67*lace)*(.76+.34*pressure)*contactHeight;
        buoyShade=.44*contactHeight*exterior*(1.-smoothstep(.009,.145+aa,sd))*(.60+.40*torn.r);
        vec2 tilt=vec2(0.);
        for(int k=0;k<6;k++){
          vec4 event=buoyPuffs[k],drift=buoyDrifts[k];
          float age=buoySurface.z-event.z;
          if(age>=0. && age<2.62){
            vec2 advected=event.xy+drift.xy*age;
            vec2 rel=p-advected;
            float along=dot(rel,current),side=dot(rel,across);
            float ageFade=smoothstep(0.,.20,age)*(1.-smoothstep(.59,2.62,age));
            float bend=dot(drift.zw,across)*(.045+.08*age)*sin(3.1*along+.73*age);
            float tail=along/(.23+.30*age);
            float narrow=(side-bend)/(.122+.102*age);
            float veil=exp(-1.75*tail*tail-1.95*narrow*narrow)*event.w*ageFade;
            if(veil>.006){
              vec2 foamUV=vec2(along*.55,side*.92)+vec2(.246*float(k),.41)+.10*torn;
              vec3 raft=texture2D(buoyCells,foamUV).rgb;
              float walls=mix(1.-smoothstep(.035,.18,abs(raft.r-.50)),raft.r,buoyFlow.w);
              float holes=smoothstep(.19,.64,.55*grain.r+.26*torn.g+.19*raft.g);
              buoyFroth+=veil*holes*clamp(.43+1.32*walls+.27*raft.g,0.,1.30);
            }
            // Short, broken fronts spread away from the particular shoulder
            // that shed this patch. Never continue one through the entire hull.
            vec2 d=p-(event.xy+drift.xy*age*.24);
            float rad=length(d),rr=(rad-(.095+.57*age))/(.039+.028*age+aa*.54);
            float sector=smoothstep(.05,.80,dot(d/max(rad,.018),drift.zw));
            if(abs(rr)<3.5&&sector>.0){
              float wave=rr*exp(-rr*rr)-.40*(rr+1.77)*exp(-(rr+1.77)*(rr+1.77));
              float broken=smoothstep(.28,.71,.48*torn.r+.52*grain.g);
              tilt+=d/max(rad,.018)*wave*sector*broken*event.w*ageFade*.50;
            }
          }
        }
        buoyFroth=clamp(buoyFroth*visibility*exterior,0.,.80);
        buoyShade*=visibility;
        normal=normalize(normal+vec3(tilt.x,0.,tilt.y)*visibility*exterior);
      }
  `;
  const colorPatch=`
      lit*=1.-buoyShade;
      lit=mix(lit,vec3(.51,.59,.555)*(.79+.19*max(dot(normal,uSun),0.)),buoyFroth);
  `;
  function create(parent,water){
    const position=new T.Vector3(),angles=new T.Euler(),rotation=new T.Quaternion(),unit=new T.Vector3(1,1,1);
    const inverse=new T.Matrix4(),where=new T.Vector4(),flow=new T.Vector4(.16,.987,0,0);
    const puffs=Array.from({length:slots},()=>new T.Vector4(0,0,-1e6,0));
    const drifts=Array.from({length:slots},()=>new T.Vector4());
    const uniforms={buoySurface:{value:where},buoyFlow:{value:flow},buoyLocal:{value:inverse},
      buoyPuffs:{value:puffs},buoyDrifts:{value:drifts},buoyCells:{value:null}};
    let material=null,done=false,last=-Infinity,lastEmit=-Infinity,cursor=0,sequence=0;
    function bind(){
      const sea=water||parent?.getObjectByName('潮汐海面');if(!sea?.material)return false;
      const m=sea.material;bindings.get(m)?.();
      const src=m.fragmentShader;
      if(!src?.includes(normalAnchor)||!src.includes(colorAnchor)||!m.uniforms?.uNoise)return false;
      material=m;bindings.set(m,dispose);Object.assign(m.uniforms,uniforms);uniforms.buoyCells.value=m.uniforms.uNoise.value;
      m.fragmentShader=declarations+src.replace(normalAnchor,normalPatch+normalAnchor).replace(colorAnchor,colorPatch+colorAnchor);
      m.needsUpdate=true;return true;
    }
    bind();
    function clear(){
      for(const p of puffs)p.z=-1e6;
      lastEmit=-Infinity;sequence=0;cursor=0;where.w=0;
    }
    function update(pose,surface,t){
      if(done)return;
      if(!pose||typeof surface!=='function'||!Number.isFinite(t+pose.x+pose.y+pose.z)){
        if(where.w)clear();last=-Infinity;return;
      }
      if(!material&&!bind())return;
      const {x,y,z}=pose;
      let dt=t-last;
      const reset=dt<0||dt>.65||Math.hypot(x-where.x,z-where.y)>1.6;
      if(reset){clear();dt=0;}
      position.set(x,y,z);angles.set(pose.rx||0,pose.ry||0,pose.rz||0,'XYZ');
      inverse.compose(position,rotation.setFromEuler(angles),unit).invert();
      const cells=material.uniforms.surfCell?.value;
      uniforms.buoyCells.value=cells||material.uniforms.uNoise.value;
      flow.w=cells?1:0;
      if(dt===0&&!reset){where.set(x,z,t,1);return;}
      const sample=.63,dx=(surface(x+sample,z,t)-surface(x-sample,z,t))/(2*sample);
      const dz=(surface(x,z+sample,t)-surface(x,z-sample,t))/(2*sample);
      const rise=(surface(x,z,t+.09)-surface(x,z,t-.09))/.18;
      if(!Number.isFinite(dx+dz+rise)){clear();last=t;return;}
      // Opposite the product of slope and vertical velocity is the direction
      // of advance of a progressive gravity wave. Smooth out orbital reversals.
      const survey=(material.uniforms.uSurvey?.value||0)>.5;
      const factor=survey?.11:.82;
      let fx=(survey?.158:-.939)-factor*dx*rise,fz=(survey?.987:.343)-factor*dz*rise;
      let length=Math.hypot(fx,fz);fx/=length;fz/=length;
      const ease=reset?1:1-Math.exp(-dt*1.02);
      flow.x+=(fx-flow.x)*ease;flow.y+=(fz-flow.y)*ease;length=Math.hypot(flow.x,flow.y);flow.x/=length;flow.y/=length;
      const push=surface(x-flow.x*.94,z-flow.y*.94,t)-y;
      const load=clamp(.20+.90*Math.max(0,push)+.44*Math.abs(rise)+.27*Math.hypot(dx,dz),.16,1);
      flow.z+= (load-flow.z)*(reset?1:1-Math.exp(-dt*3.9));where.set(x,z,t,1);
      if(reset){lastEmit=t-.19;last=t;return;}
      // A little fluid slips around either shoulder and survives for a few
      // seconds. The birth position stays in world coordinates as the buoy yaws.
      const delay=.55+.43*(1-flow.z)+.13*Math.sin(sequence*2.29);
      if(t-lastEmit>=delay && flow.z>.305){
        const side=sequence%2?1:-1,phase=Math.sin(sequence*4.11+.71);
        const c=.16+.25*phase,s=side*Math.sqrt(1-c*c);
        const nx=flow.x*c-flow.y*s,nz=flow.y*c+flow.x*s;
        let radius=1.085;
        for(let i=0;i<2;i++){
          const sx=x+nx*radius,sz=z+nz*radius;
          position.set(sx,surface(sx,sz,t),sz).applyMatrix4(inverse);
          radius-=Math.hypot(position.x,position.z)-radiusAt(position.y);
        }
        if(position.y>-.76&&position.y<.49){
          puffs[cursor].set(x+nx*(radius+.052),z+nz*(radius+.052),t,.62+.33*flow.z);
          const speed=.20+.25*flow.z;
          drifts[cursor].set(flow.x*speed+nx*.127,flow.y*speed+nz*.127,nx,nz);
          cursor=(cursor+1)%slots;
        }
        lastEmit=t;sequence++;
      }
      last=t;
    }
    function dispose(){
      if(done)return;done=true;
      if(material&&bindings.get(material)===dispose){
        bindings.delete(material);
        material.fragmentShader=material.fragmentShader.replace(declarations,'').replace(normalPatch,'').replace(colorPatch,'');
        for(const key of Object.keys(uniforms))delete material.uniforms[key];
        material.needsUpdate=true;
      }
    }
    return {update,dispose};
  }
  return {create};
})();
