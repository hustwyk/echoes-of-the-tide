/* Local contact of the existing displaced sea with the North Cape launch, working float and piers. */
(function(){
  'use strict';
  const T=window.THREE, clamp=(v,a,b)=>Math.min(b,Math.max(a,v)), TAU=Math.PI*2;
  function rawTex(data,width,height){
    const tex=new T.DataTexture(data,width,height,T.RGBAFormat);
    tex.minFilter=tex.magFilter=T.LinearFilter;tex.needsUpdate=true;return tex;
  }
  // Stations match the six chine vertices used in the pilot boat's shell. Each horizontal cut stores the
  // actual half-breadth and the height of the solid keel. Sampling it at vSea.y follows the tilted boat.
  function launchLines(berth,mesh){
    const [aft,fore]=berth.boats.map(f=>({...f,...f.rest})),a=aft.x-aft.w/2,f=fore.x+fore.w/2,A=aft.x+aft.w/2,F=fore.x-fore.w/2;
    const beam=aft.d*.5,cy=(aft.y+fore.y)*.5,cz=aft.z,stern=a-1.33,bow=f+1.87;
    const stations=[ [stern,1.25,.16],[stern+.22,1.50,.12],[a-.41,beam+.11,.045],[a,beam+.18,0],
      [A,beam+.23,0],[F,beam+.23,0],[f-.77,beam+.21,.035],[f,beam+.15,.085],[f+.4,beam-.06,.13],
      [f+.9,beam-.48,.23],[f+1.36,.74,.37],[bow-.15,.22,.50],[bow,.035,.55] ];
    let cuts=stations.map(([x,r,rise])=>{
      const top=(x<A?aft.y:x>F?fore.y:aft.y+(fore.y-aft.y)*(x-A)/(F-A))+.08+rise;
      const taper=Math.max(0,(x-f)/1.87),end=Math.max(0,(a-x)/1.33)*.24;
      return [x,[[cy-2.10+.84*taper+end,.022],[cy-1.91+.65*taper+end,r*.34],
        [cy-1.36+.35*taper+end,r*.75],[cy-.78+rise*.38,r*.92],[top-.16,r+.015],[top,r]]];
    });
    if(mesh?.geometry?.attributes?.position){
      const sections=new Map(),p=mesh.geometry.attributes.position;
      for(let i=0;i<p.count;i++){
        const x=Math.round(p.getX(i)*10000)/10000,y=Math.round(p.getY(i)*10000)/10000,r=Math.abs(p.getZ(i)-cz);
        let ys=sections.get(x);if(!ys){ys=new Map();sections.set(x,ys);}ys.set(y,Math.max(ys.get(y)||0,r));
      }
      const actual=Array.from(sections,([x,ys])=>[x,[...ys].sort((l,r)=>l[0]-r[0])]).sort((l,r)=>l[0]-r[0]);
      if(actual.length>=stations.length&&Math.abs(actual[0][0]-stern)<.1)cuts=actual;
    }
    const minY=cy-2.30,maxY=cy+.82;
    const lerp=(a,b,t)=>a+(b-a)*t;
    function span(section,y){
      let i=0;while(i<section.length-2&&y>section[i+1][0])i++;
      const l=section[i],h=section[i+1];return lerp(l[1],h[1],clamp((y-l[0])/(h[0]-l[0]),0,1));
    }
    function cut(x,y){
      let i=0;while(i<cuts.length-2&&x>cuts[i+1][0])i++;
      const [l,ls]=cuts[i],[r,rs]=cuts[i+1],u=clamp((x-l)/(r-l),0,1);
      return [lerp(span(ls,y),span(rs,y),u),lerp(ls[0][0],rs[0][0],u),lerp(ls.at(-1)[0],rs.at(-1)[0],u)];
    }
    const W=176,H=72,data=new Uint8Array(W*H*4),radius=beam+.32;
    for(let iy=0;iy<H;iy++)for(let ix=0;ix<W;ix++){
      const [r,keel,top]=cut(lerp(stern,bow,ix/(W-1)),lerp(minY,maxY,iy/(H-1))),off=(iy*W+ix)*4;
      data[off]=Math.round(r/radius*255);data[off+1]=Math.round((keel-minY)*255/(maxY-minY));
      data[off+2]=Math.round((top-minY)*255/(maxY-minY));data[off+3]=255;
    }
    return {tex:rawTex(data,W,H),cut,stern,bow,cy,cz,minY,maxY,radius};
  }

  // The two welded ballast tanks in warpfloat.js have an asymmetric ten-corner section. Their
  // chamfer also varies with fore/aft station. Cut their actual triangle strips; preserve the
  // short diagonal at each quad so contact still follows a pitching, partially exposed end cap.
  function floatLines(){
    const section=[[-.31,-.176],[.31,-.176],[.479,-.387],[.487,-1.354],[.409,-1.850],[.215,-2.04],[-.227,-2.04],[-.429,-1.821],[-.487,-1.291],[-.479,-.389]];
    const stations=[[-.966,.74,.13],[-.775,.994,.019],[.682,1,0],[.959,.68,.165]];
    const rings=stations.map(([z,sc,lift])=>section.map(([x,y])=>[x*sc,y-(y+.18)*lift]));
    const rear=stations[0][0],front=stations.at(-1)[0],bottom=-2.15,ceiling=-.065,breadth=.52;
    function cut(z,y){
      let i=0;while(i<2&&z>stations[i+1][0])i++;
      const u=clamp((z-stations[i][0])/(stations[i+1][0]-stations[i][0]),0,1);
      const a=rings[i],b=rings[i+1];let left=2,right=-2;
      const lo=a[5][1]+u*(b[5][1]-a[5][1]),hi=a[0][1]+u*(b[0][1]-a[0][1]),h=clamp(y,lo+.00001,hi-.00001);
      function cross(ax,ay,bx,by){
        if((ay<h)===(by<h))return;
        const x=ax+(bx-ax)*(h-ay)/(by-ay);left=Math.min(left,x);right=Math.max(right,x);
      }
      for(let j=0;j<10;j++){
        const n=(j+1)%10;
        const x0=a[j][0]+u*(b[j][0]-a[j][0]),y0=a[j][1]+u*(b[j][1]-a[j][1]);
        const xd=a[j][0]+u*(b[n][0]-a[j][0]),yd=a[j][1]+u*(b[n][1]-a[j][1]);
        const x1=a[n][0]+u*(b[n][0]-a[n][0]),y1=a[n][1]+u*(b[n][1]-a[n][1]);
        cross(x0,y0,xd,yd);cross(xd,yd,x1,y1);
      }
      return [-left,right,lo,hi];
    }
    const W=176,H=72,data=new Uint8Array(W*H*4);
    for(let j=0;j<H;j++)for(let i=0;i<W;i++){
      const [left,right,lo,hi]=cut(rear+(front-rear)*i/(W-1),bottom+(ceiling-bottom)*j/(H-1)),k=(j*W+i)*4;
      data[k]=Math.round(left/breadth*255);data[k+1]=Math.round(right/breadth*255);
      data[k+2]=Math.round((lo-bottom)*255/(ceiling-bottom));data[k+3]=Math.round((hi-bottom)*255/(ceiling-bottom));
    }
    return {tex:rawTex(data,W,H),cut,rear,front,bottom,ceiling,breadth};
  }

  function quayChart(g){
    const boat=g.world.fenders,cable=g.world.cableQuay,slabs=[],posts=[],emitters=[];
    function slab(f,y0,w,d){slabs.push([f.x,f.z,w*.5,d*.5,y0,f.y]);}
    if(boat){
      for(const f of [boat.lower,boat.shelf,boat.well,boat.ledge,boat.sill,boat.landing,boat.steps].filter(Boolean)){
        const shaved=f===boat.ledge?.63:0;
        const actual={...f,x:f.x-shaved*.5};slab(actual,f.y-2.96,f.w-shaved,f.d);
      }
    }else{
      for(const f of g.world.floors){
        if(f===cable.float)continue;
        const upper=f.kind==='cableGallery'||f.x>1.2||f.y>1.75;
        if(!upper)slab(f,f.y-.831,f.w*.96,f.d-.1);
        const count=Math.max(1,Math.ceil(f.d/5.5));
        for(let k=0;k<count;k++){
          const z=f.z-f.d*.5+(k+.5)*f.d/count;
          for(const s of [-1,1])posts.push([f.x+s*f.w*.34,z,upper?.126:.196]);
        }
      }
    }
    const minX=boat?-10:-10,minZ=boat?2:-35,maxX=boat?9:8,maxZ=boat?23:8;
    const W=Math.ceil((maxX-minX)/.10),H=Math.ceil((maxZ-minZ)/.10),data=new Uint8Array(W*H*4);
    const sd=(d,x,z)=>{const X=Math.abs(x-d[0])-d[2],Z=Math.abs(z-d[1])-d[3];return Math.hypot(Math.max(X,0),Math.max(Z,0))+Math.min(Math.max(X,Z),0);};
    function distance(x,z){
      let rect=8,pile=8,bottom=-6,top=-5;
      for(const st of slabs){const d=sd(st,x,z);if(d<rect){rect=d;bottom=st[4];top=st[5];}}
      for(const [px,pz,r] of posts)pile=Math.min(pile,Math.hypot(x-px,z-pz)-r);
      return [pile,rect,bottom,top];
    }
    const packedDist=d=>Math.round(clamp((d+1.5)/4.5,0,1)*255),packedY=y=>Math.round(clamp((y+6)/9,0,1)*255);
    for(let z=0;z<H;z++)for(let x=0;x<W;x++){
      const [pile,rect,bottom,top]=distance(minX+(x+.5)*(maxX-minX)/W,minZ+(z+.5)*(maxZ-minZ)/H),i=(z*W+x)*4;
      data[i]=packedDist(pile);data[i+1]=packedDist(rect);data[i+2]=packedY(bottom);data[i+3]=packedY(top);
    }
    for(const rect of slabs)for(const u of [-.67,.04,.74]){
      const x=rect[0]+u*rect[2],z=rect[1]+rect[3];
      // Do not place a water plume on the interior seam between adjoining concrete slabs.
      if(distance(x,z+.26)[1]>.13)emitters.push({x,z,nx:0,nz:1,min:rect[4],max:rect[5]});
    }
    for(const [x,z,r] of posts)if(z< -8&&z> -27)emitters.push({x:x+.82*r,z:z+.57*r,nx:.82,nz:.57,min:-5.5,max:1});
    return {tex:rawTex(data,W,H),rect:new T.Vector4(minX,minZ,1/(maxX-minX),1/(maxZ-minZ)),emitters};
  }

  // Evaluate exactly the two original water mesh triangles under the point, including displaced vertex X.
  // The shader already has this interpolated value in vSea. Projectiles need the same height on the CPU.
  function waterSampler(water){
    const g=water.geometry, pos=g.attributes.position,nx=g.parameters?.widthSegments+1,nz=g.parameters?.heightSegments+1;
    const swell=(x,z,t)=>TideLookout.swell(x,z,t),x0=water.position.x,z0=water.position.z;
    if(!nx||!nz||nx*nz!==pos.count)return (x,z,t)=>water.position.y+swell(x-.18*Math.cos(x*.23+z*.11+t*1.12),z,t);
    const xs=[],zs=[];
    for(let i=0;i<nx;i++)xs.push(pos.getX(i)+x0);
    for(let j=0;j<nz;j++)zs.push(pos.getZ(j*nx)+z0);
    function bin(a,x){let l=0,h=a.length-1;while(l+1<h){const m=(l+h)>>1;if(a[m]<=x)l=m;else h=m;}return l;}
    return (x,z,t)=>{
      const j=bin(zs,z),za=zs[j],zb=zs[j+1],v=clamp((z-za)/(zb-za),0,1);
      let i=bin(xs,x-.18*Math.cos(x*.23+z*.11+t*1.12));
      const displaced=(p,q)=>p+.18*Math.cos(p*.23+q*.11+t*1.12);
      for(let pass=0;pass<3;pass++){
        const xa=xs[i],xb=xs[i+1],A=displaced(xa,za),B=displaced(xa,zb),C=displaced(xb,zb),D=displaced(xb,za);
        const left=A+(B-A)*v,division=D+(B-D)*v,right=D+(C-D)*v;
        if(x<left&&i>0){i--;continue;}if(x>right&&i<nx-2){i++;continue;}
        if(x<=division){const u=clamp((x-left)/(D-A),0,1-v);return water.position.y+(1-v-u)*swell(xa,za,t)+v*swell(xa,zb,t)+u*swell(xb,za,t);}
        const u=clamp((x-division)/(C-B),0,v);return water.position.y+(1-v)*swell(xb,za,t)+(v-u)*swell(xa,zb,t)+u*swell(xb,zb,t);
      }
      return water.position.y+swell(x,z,t);
    };
  }

  const header=`
    uniform sampler2D csQuay,csHull,csLace;
    uniform vec4 csRect,csHullBounds,csShape;
    uniform mat4 csToLocal;
    uniform vec4 csImpacts[4],csWakes[6];
    uniform float csBoat,csEnabled;
    float csBox(vec2 d){return length(max(d,0.))+min(max(d.x,d.y),0.);}
    vec2 csContact(vec3 point){
      vec2 uv=(point.xz-csRect.xy)*csRect.zw;
      vec4 chart=texture2D(csQuay,uv);
      float piles=4.5*chart.r-1.5,slab=4.5*chart.g-1.5;
      vec2 slabH=chart.ba*9.-6.;
      float dry=max(slabH.x-point.y,point.y-slabH.y);
      // The concrete top can be several metres above the sea; only its immersed piers make foam then.
      float shore=min(piles,mix(slab,3.,smoothstep(-.025,.13,dry)));
      vec3 p=(csToLocal*vec4(point,1.)).xyz;float body=5.;
      if(csBoat>.5){
        vec2 pos=clamp((p.xy-csHullBounds.xz)/(csHullBounds.yw-csHullBounds.xz),0.,1.);
        vec3 lines=texture2D(csHull,(pos*vec2(175.,71.)+.5)/vec2(176.,72.)).rgb;
        float width=lines.r*csShape.x,localZ=abs(p.z-csShape.y);
        float keel=mix(csHullBounds.z,csHullBounds.w,lines.g);
        float gunwale=mix(csHullBounds.z,csHullBounds.w,lines.b);
        body=csBox(vec2(max(csHullBounds.x-p.x,p.x-csHullBounds.y),localZ-width));
        body=mix(body,5.,smoothstep(-.025,.12,max(keel-p.y,p.y-gunwale)));
      }else{
        vec2 dims=csShape.zw;
        vec2 pos=clamp((p.zy-csHullBounds.xz)/(csHullBounds.yw-csHullBounds.xz),0.,1.);
        vec4 slices=texture2D(csHull,(pos*vec2(175.,71.)+.5)/vec2(176.,72.));
        vec2 rim=slices.rg*csShape.x;
        vec2 limit=mix(vec2(csHullBounds.z),vec2(csHullBounds.w),slices.ba);
        float across=p.x-(p.x>0.?csShape.y:-csShape.y);
        float tank=csBox(vec2(max(csHullBounds.x-p.z,p.z-csHullBounds.y),max(-across-rim.x,across-rim.y)));
        body=mix(tank,5.,smoothstep(-.025,.075,max(limit.x-p.y,p.y-limit.y)));
        float slabSd=csBox(abs(p.xz)-(dims*.5-vec2(.016,.025)));
        body=min(body,mix(slabSd,5.,smoothstep(-.018,.052,max(-.15-p.y,p.y-.015))));
      }
      return vec2(shore,body);
    }
  `;
  const paint=`
    vec2 csUV=(p-csRect.xy)*csRect.zw;
    if(csEnabled>.5&&all(greaterThanEqual(csUV,vec2(0.)))&&all(lessThanEqual(csUV,vec2(1.)))){
      vec2 nearContact=csContact(vSea);
      float edge=min(nearContact.x,nearContact.y);
      if(edge>=-.035){
        float impact=0.,trail=0.;
        for(int i=0;i<4;i++){
          vec4 hit=csImpacts[i];float age=t-hit.z;
          if(age>=0.&&age<2.7&&hit.w>0.){
            vec2 d=p-hit.xy;float a=atan(d.y,d.x);
            float r=length(d*vec2(.97,1.08)),jitter=.022*sin(a*5.+age*.63)+.045*(noiseB.g-.5);
            float radius=.105+1.68*(1.-exp(-1.06*age));
            float ring=1.-smoothstep(.018,.105+.032*age,abs(r+jitter-radius));
            float wakelet=(1.-smoothstep(.012,.075,abs(r-jitter-radius+.22)))*smoothstep(.14,.52,age);
            float broken=smoothstep(-.38,.75,.49*sin(a*2.4+.6*age)+.35*cos(a*5.-age)+noiseB.r*.46);
            impact+=(ring*(.15+.66*broken)+(.14+.32*broken)*wakelet)*exp(-1.18*age)*hit.w;
            impact+=exp(-r*r/(.029+age*.074))*exp(-age*4.4)*hit.w;
          }
        }
        for(int j=0;j<6;j++){
          vec4 q=csWakes[j];float age=t-q.z;
          if(q.w>0.&&age>=0.&&age<2.8){
            vec2 d=p-q.xy;float v=abs(length(d)-(.12+age*.48)+.06*(noiseB.r-.5));
            trail+=(1.-smoothstep(.02,.12+.05*age,v))*q.w*exp(-age*1.12);
          }
        }
        if(edge<1.65||impact+trail>.012){
          float closeBody=1.-smoothstep(.20,1.1,nearContact.y);
          float slope=.46*1.12*cos(dot(p,vec2(.23,.11))+t*1.12)-.34*.88*cos(dot(p,vec2(-.17,.29))-t*.88)
            +.18*1.42*cos(dot(p,vec2(.49,-.41))+t*1.42)-.09*1.64*cos(dot(p,vec2(.81,.62))-t*1.64);
          float crest=smoothstep(-.29,.63,vHeight+.36*slope);
          float wash=1.-smoothstep(-.40,.28,slope);
          float wobble=.082*sin(p.x*3.4-p.y*2.2+t*1.38)+.045*sin(p.x*5.9+p.y*4.1-t*1.6);
          float slip=dot(p,vec2(.37,-.32));
          vec2 laceUV=p*vec2(.30,.43)+vec2(t*.030+.093*noiseA.b,-t*.021+.118*noiseB.r);
          vec3 cells=texture2D(csLace,laceUV).rgb;
          vec3 holes=texture2D(csLace,p.yx*vec2(.091,.16)+vec2(-t*.019,slip*.05)).rgb;
          float torn=.095*(holes.g-.5)+.058*(cells.g-.5)+wobble;
          float lip=1.-smoothstep(.012,.15+.193*crest+.055*closeBody,edge+torn);
          float timing=.58+.42*sin(slip*1.7+t*1.49+1.36*noiseB.g);
          float outer=.19+.36*wash+.18*timing+.080*(holes.r-.5);
          float lace=(1.-smoothstep(.041,.19,abs(edge+torn-outer)))*(.19+.59*wash);
          float pockets=smoothstep(.24,.73,holes.g*.62+noiseB.b*.38);
          float strands=lace*(.15+.80*cells.r)*pockets;
          float beaten=lip*(.43+.53*crest+.13*closeBody)*(.39+.30*cells.g+.36*cells.r);
          float eddy=exp(-max(edge,.0)*3.1)*cells.r*(.17+.23*wash)*pockets;
          float seam=exp(-max(.0,edge)*12.)*(.56-.25*crest);
          lit*=mix(vec3(1.),vec3(.40,.51,.52),seam);
          float film=beaten+strands+eddy+impact*(.32+.29*cells.g+.40*cells.r)+trail*(.21+.43*cells.r);
          float coverage=clamp(film,0.,.9)*smoothstep(-.035,.035,edge)*(1.-.47*smoothstep(26.,74.,dist));
          vec3 froth=mix(vec3(.36,.47,.46),vec3(.81,.87,.78),clamp(.16+.57*noiseA.g+.22*crest+.12*cells.b,0.,1.));
          lit=mix(lit,froth,coverage);
        }
      }
    }
  `;

  function spray(scene,uniforms){
    const max=260,geom=new T.InstancedBufferGeometry(),template=new T.PlaneGeometry(1,1);
    geom.setAttribute('position',template.attributes.position);geom.setAttribute('uv',template.attributes.uv);geom.setIndex(template.index);
    const records=new Float32Array(max*8),loc=new Float32Array(max*4),motion=new Float32Array(max*4);
    const a=new T.InstancedBufferAttribute(loc,4),b=new T.InstancedBufferAttribute(motion,4);
    a.setUsage(T.DynamicDrawUsage);b.setUsage(T.DynamicDrawUsage);geom.setAttribute('cLaunch',a);geom.setAttribute('cTravel',b);
    const mat=new T.ShaderMaterial({uniforms,transparent:true,depthWrite:false,
      vertexShader:`
        attribute vec4 cLaunch,cTravel;uniform float csTime;
        varying vec2 filmUV;varying float opacity;
        void main(){
          float age=csTime-cLaunch.w,r=abs(cTravel.w);
          bool sheet=cTravel.w<0.;float life=clamp(2.*cTravel.y/9.81,.24,1.);
          vec3 centre=cLaunch.xyz+cTravel.xyz*age;centre.y-=4.905*age*age;
          vec4 eye=viewMatrix*vec4(centre,1.);
          float trail=sheet?1.45:1.+.82*abs(cTravel.y-9.81*age);
          eye.xy+=vec2(position.x*2.*r,position.y*r*trail);
          opacity=smoothstep(0.,.047,age)*(1.-smoothstep(life*.43,life,age))*(sheet?.50:.87);
          opacity*=1.-smoothstep(28.,80.,-eye.z);
          filmUV=uv;gl_Position=projectionMatrix*eye;
        }`,
      fragmentShader:`
        varying vec2 filmUV;varying float opacity;
        void main(){vec2 q=filmUV*2.-1.;float edge=1.-smoothstep(.12,1.,dot(q,q));
          float alpha=edge*opacity;if(alpha<.016)discard;
          gl_FragColor=vec4(mix(vec3(.50,.67,.69),vec3(.90,.95,.86),filmUV.y*.72),alpha);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`});
    const mesh=new T.Mesh(geom,mat);mesh.name='舷侧浪珠与救生索溅水';mesh.frustumCulled=false;mesh.userData.noSeaReflection=true;mesh.renderOrder=2;
    geom.instanceCount=0;mesh.visible=false;scene.add(mesh);
    let head=0,enabled=true;
    function bead(x,y,z,t,vx,vy,vz,r){const i=head*8;records.set([x,y,z,t,vx,vy,vz,r],i);head=(head+1)%max;}
    return {bead,clear(){records.fill(0);},setEnabled(on){enabled=on;if(!on)mesh.visible=false;},
      draw(t){
        let n=0;for(let i=0;i<max;i++){
          const k=i*8,age=t-records[k+3],vy=records[k+5];if(!vy||age<0||age>Math.min(1.,Math.max(.24,2*vy/9.81)))continue;
          for(let j=0;j<4;j++){loc[n*4+j]=records[k+j];motion[n*4+j]=records[k+4+j];}n++;
        }
        a.needsUpdate=b.needsUpdate=!!n;geom.instanceCount=n;mesh.visible=enabled&&n>0;return n;
      },
      dispose(){scene.remove(mesh);geom.dispose();template.dispose();mat.dispose();}
    };
  }

  function create(scene,g,water){
    const berth=g.world.fenders,cable=g.world.cableQuay;
    if(!water||(!berth&&!cable))return {update(){},dispose(){}};
    const material=water.material, hull=berth?scene.getObjectByName('交通艇折角船壳'):null;
    const section=berth?launchLines(berth,hull):null,tanks=berth?null:floatLines(),shore=quayChart(g),level=waterSampler(water);
    const bounds=section?new T.Vector4(section.stern,section.bow,section.minY,section.maxY):new T.Vector4(tanks.rear,tanks.front,tanks.bottom,tanks.ceiling);
    const shape=section?new T.Vector4(section.radius,section.cz,0,0):new T.Vector4(tanks.breadth,.718,cable.float.w,cable.float.d);
    const model=new T.Matrix4(),inverse=new T.Matrix4(),tmp=new T.Vector3(),offsetMatrix=new T.Matrix4(),angles=new T.Euler();
    const impacts=Array.from({length:4},()=>new T.Vector4(0,0,-80,0)),wakes=Array.from({length:6},()=>new T.Vector4(0,0,-80,0));
    const uniforms={csQuay:{value:shore.tex},csHull:{value:section?.tex||tanks.tex},csLace:{value:material.uniforms.surfCell?.value||material.uniforms.uNoise.value},
      csRect:{value:shore.rect},csHullBounds:{value:bounds},csShape:{value:shape},csToLocal:{value:inverse},csBoat:{value:berth?1:0},
      csEnabled:{value:1},csTime:{value:0},csImpacts:{value:impacts},csWakes:{value:wakes}};
    // A ShaderMaterial can reuse an already linked program after a rapid scene reconstruction.
    // Make the live bindings available even when three.js skips its onBeforeCompile callback.
    Object.assign(material.uniforms,uniforms);
    const wasOwn=Object.hasOwn(material,'onBeforeCompile'),hadKey=Object.hasOwn(material,'customProgramCacheKey');
    const prior=material.onBeforeCompile,priorKey=material.customProgramCacheKey,prefix=priorKey.call(material);
    let live=true;
    function hook(shader,renderer){
      prior.call(this,shader,renderer);if(!live)return;
      uniforms.csLace.value=shader.uniforms.surfCell?.value||material.uniforms.uNoise.value;
      Object.assign(shader.uniforms,uniforms);
      shader.fragmentShader=header+shader.fragmentShader;
      const token='lit=mix(lit,lit*vec3(.26,.39,.40)+vec3(.004,.009,.010),uInside);';
      if(!shader.fragmentShader.includes(token))throw new Error('Contact surf requires the coastal water shader');
      shader.fragmentShader=shader.fragmentShader.replace(token,paint+'\n'+token);
    }
    const key=()=>prefix+'|TideContactSurf19';
    material.onBeforeCompile=hook;material.customProgramCacheKey=key;material.needsUpdate=true;
    // Parent the world-space bead mesh to the sea. Hiding water for a mirror pass always hides beads too.
    const drops=spray(water,uniforms);
    const emitters=shore.emitters.slice();
    if(berth){
      for(const n of [.09,.26,.47,.66,.80,.92,.97])emitters.push({x:section.stern+(section.bow-section.stern)*n,local:true,side:1,nx:n>.78?.64:.12,nz:n>.78?.77:.99});
      for(const n of [.90,.96])emitters.push({x:section.stern+(section.bow-section.stern)*n,local:true,side:-1,nx:.9,nz:-.43});
    }else{
      for(const sign of [-1,1])for(const u of [-.64,.13,.78])
        emitters.push({local:true,sign,fraction:u,nx:.11,nz:.99,end:true});
      for(const z of [-.38,.43])emitters.push({local:true,sign:1,along:z,nx:1,nz:.06});
    }
    for(let i=0;i<emitters.length;i++){emitters[i].last=-90;emitters[i].previous=NaN;emitters[i].rising=0;}
    let seed=460193;const rand=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
    let count=0,lastT=-Infinity,lastSplash='',hitTail=0,wakeTail=0,lastWake=-99,lx=NaN,lz=NaN;
    const feet=[-99,-99];
    function event(x,y,z,t,nx,nz,force,splash){
      const n=splash?23:Math.round(3+5*force);for(let i=0;i<n;i++){
        const a=rand()*TAU,wide=(rand()-.5)*(splash?.50:.35);
        const dx=splash?Math.cos(a):nx*.64-nz*wide,dz=splash?Math.sin(a):nz*.64+nx*wide;
        const kick=(splash?.62:.26)+rand()*(splash?1.45:.62);
        const radius=splash&&i<4?-(.090+.042*rand()):(.010+.026*rand())*(.72+.5*force);
        drops.bead(x+dx*(.045+.055*rand()),y-.018+rand()*.038,z+dz*(.045+.055*rand()),t-rand()*.020,
          dx*kick-.12,1.00+(.35+rand())*(splash?2.12:1.03)*force,dz*kick,radius);
      }
    }
    function wake(x,z,t,amount){wakes[wakeTail].set(x,z,t,amount);wakeTail=(wakeTail+1)%wakes.length;}
    function update(state,t){
      if(!live)return;const dt=t-lastT;
      if(dt<0||dt>1.0){
        drops.clear();impacts.forEach(e=>e.w=0);wakes.forEach(e=>e.w=0);
        emitters.forEach(e=>{e.previous=NaN;e.rising=0;e.last=-90;});lastSplash='';lastWake=-99;lx=lz=NaN;feet.fill(-99);
      }
      uniforms.csTime.value=t;
      const f=cable?.float,pose=berth?.floatPose;
      if(berth){
        if(hull){hull.updateWorldMatrix(true,false);model.copy(hull.matrixWorld);}
        else if(pose){
          model.makeRotationFromEuler(angles.set(pose.pitch||0,pose.yaw||0,pose.roll||0,'YXZ')).setPosition(pose.x,pose.y,pose.z);
          model.multiply(offsetMatrix.makeTranslation(-pose.anchorX,-pose.anchorY,-pose.anchorZ));
        }else model.identity();
      }else model.makeRotationFromEuler(angles.set(f.pitch||0,f.yaw||0,f.roll||0,'YXZ')).setPosition(f.x,f.y,f.z);
      inverse.copy(model).invert();if(f){shape.z=f.w;shape.w=f.d;}
      if(dt!==0){
        for(const e of emitters){
          let x=e.x,z=e.z,nx=e.nx,nz=e.nz,valid=true,y;
          if(e.local){
            if(section){
              tmp.set(e.x,section.cy-1.17,section.cz+e.side*1.45).applyMatrix4(model);x=tmp.x;z=tmp.z;
              for(let j=0;j<2;j++){
                y=level(x,z,t);tmp.set(x,y,z).applyMatrix4(inverse);const [r,keel,top]=section.cut(e.x,tmp.y);
                valid=tmp.y>=keel+.025&&tmp.y<top-.18;tmp.set(e.x,tmp.y,section.cz+e.side*r).applyMatrix4(model);x=tmp.x;z=tmp.z;
              }
            }else{
              const localZ=e.end?tanks.front:e.along,mid=.718*e.sign;
              tmp.set(mid,-1.30,localZ).applyMatrix4(model);x=tmp.x;z=tmp.z;
              for(let j=0;j<2;j++){
                y=level(x,z,t);tmp.set(x,y,z).applyMatrix4(inverse);
                const [l,r,lo,hi]=tanks.cut(localZ,tmp.y);valid=tmp.y>lo+.025&&tmp.y<hi-.17;
                const dx=e.end?(e.fraction<0?l:r)*e.fraction:r;
                tmp.set(mid+dx,tmp.y,localZ).applyMatrix4(model);x=tmp.x;z=tmp.z;
              }
            }
          }else{y=level(x,z,t);valid=y>=e.min-.035&&y<e.max-.15;}
          y=level(x,z,t);
          // A crest starts throwing spray as it stalls against the windward face, not on every frame.
          const rising=Number.isFinite(e.previous)&&dt>0?(y-e.previous)/dt:0;
          if(valid&&e.rising>.003&&rising<=.003&&t-e.last>1.16&&y>water.position.y+.11){
            const force=clamp(.28+(y-water.position.y)*.82,0,1);event(x+nx*.045,y,z+nz*.045,t,nx,nz,force,false);e.last=t;
          }
          e.previous=y;e.rising=rising;
        }
        const cue=state.cues?.splash;
        if(cue&&Number.isFinite(cue.at)&&Number.isFinite(cue.x)&&Number.isFinite(cue.z)){
          const sig=cue.at+':'+cue.x+':'+cue.z;
          if(sig!==lastSplash&&t>=cue.at-.04&&t-cue.at<.7){
            impacts[hitTail].set(cue.x,cue.z,cue.at,1);hitTail=(hitTail+1)%impacts.length;
            event(cue.x,level(cue.x,cue.z,cue.at),cue.z,cue.at,1,0,1,true);lastSplash=sig;
          }
        }
        const cx=section?tmp.set((section.stern+section.bow)*.5,section.cy,section.cz).applyMatrix4(model).x:f.x;
        const cz=section?tmp.z:f.z;
        if(Number.isFinite(lx)&&dt>0){
          const vx=(cx-lx)/dt,vz=(cz-lz)/dt,speed=Math.hypot(vx,vz);
          if(speed>.10&&t-lastWake>.40){
            const nx=vx/speed,nz=vz/speed,xr=section?(section.bow-section.stern)*.46:f.w*.43,zr=section?1.48:f.d*.45;
            const r=1/Math.hypot(nx/xr,nz/zr);
            if(section)wake(cx-nx*(r+.03),cz-nz*(r+.03),t,clamp(speed*.82,0,.77));
            else for(const sign of [-1,1]){
              tmp.set(.718*sign-nx*.32,-1.30,-nz*(r+.09)).applyMatrix4(model);
              wake(tmp.x,tmp.z,t,clamp(speed*.60,0,.66));
            }
            lastWake=t;
          }
        }
        lx=cx;lz=cz;
        for(let i=0;i<(state.players?.length||0);i++){
          const p=state.players[i];if(t-feet[i]>.42&&p.speed>.65&&Math.abs(p.y-level(p.x,p.z,t))<.19&&!p.grounded){
            wake(p.x,p.z,t,.64);feet[i]=t;
          }
        }
      }
      count=drops.draw(t);lastT=t;
    }
    update(g,g.time||0);
    return {update,stats:()=>({anchors:emitters.length,activeDroplets:count,staticAtlas:[shore.tex.image.width,shore.tex.image.height]}),
      setEnabled(x){uniforms.csEnabled.value=x?1:0;drops.setEnabled(x);},
      dispose(){
        if(!live)return;live=false;drops.dispose();shore.tex.dispose();(section?.tex||tanks.tex).dispose();
        if(material.onBeforeCompile===hook){if(wasOwn)material.onBeforeCompile=prior;else delete material.onBeforeCompile;}
        if(material.customProgramCacheKey===key){if(hadKey)material.customProgramCacheKey=priorKey;else delete material.customProgramCacheKey;}
        for(const name of Object.keys(uniforms))if(material.uniforms[name]===uniforms[name])delete material.uniforms[name];
        material.needsUpdate=true;
      }};
  }
  window.TideContactSurf={create};
})();
