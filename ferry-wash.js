// A small world-space field holds disturbed water left by the stern. Its two
// shoulders spread and drift from their old positions as the hull changes course.
const TideFerryWash=(()=>{
  const size=160,extent=60,scale=size/extent;
  function create(T){
    const data=new Uint8Array(size*size*4),trace=new T.DataTexture(data,size,size,T.RGBAFormat);
    trace.name='海雁号 · 尾流留痕';trace.minFilter=trace.magFilter=T.LinearFilter;trace.needsUpdate=true;
    const inverse=new T.Matrix4(),bounds=new T.Vector4(0,0,1/extent,0),state=new T.Vector4(),line=new T.Vector4();
    const uniforms={uFerryTrail:{value:trace},uFerryLocal:{value:inverse},uFerryRegion:{value:bounds},
      uFerryWater:{value:state},uBayLine:{value:line}};
    let last=-100;
    function stamp(x,z,s,c,width,length,strength,ch){
      if(strength<.008)return;
      const u=(x-bounds.x)*scale-.5,v=(z-bounds.y)*scale-.5;
      const rx=scale*(Math.abs(width*c)+Math.abs(length*s)),rz=scale*(Math.abs(width*s)+Math.abs(length*c));
      const loX=Math.max(0,Math.floor(u-rx)),hiX=Math.min(size-1,Math.ceil(u+rx));
      const loZ=Math.max(0,Math.floor(v-rz)),hiZ=Math.min(size-1,Math.ceil(v+rz));
      for(let j=loZ;j<=hiZ;j++)for(let i=loX;i<=hiX;i++){
        const dx=(i-u)/scale,dz=(j-v)/scale;
        const across=(dx*c-dz*s)/width,along=(dx*s+dz*c)/length;
        const f=1-across*across-along*along;
        if(f<=0)continue;
        const k=4*(size*j+i)+ch;
        data[k]=Math.max(data[k],255*strength*f*f*(3-2*f));
      }
    }
    function update(g,t,ship){
      ship.updateWorldMatrix(true,false);inverse.copy(ship.matrixWorld).invert();
      const center=ship.position,swell=g.survey?TideSoundings.swell:TideLookout.swell;
      const climb=(swell(center.x,center.z,t+.10)-swell(center.x,center.z,t-.10))*5;
      const trail=g.ferryTrail,latest=trail?.points[trail.head];
      state.set(center.x,center.z,climb,latest?.amount||0);
      if(g.index===11){
        const a=TideBayPassage.marks[0],b=TideBayPassage.marks[1],dx=b.x-a.x,dz=b.z-a.z,d=Math.hypot(dx,dz);
        line.set((a.x+b.x)*.5,(a.z+b.z)*.5,dz/d,-dx/d);
      }else line.set(0,0,0,0);
      if(t>=last&&t-last<.078)return;
      last=t;
      const cx=Math.round(center.x*2)*.5,cz=Math.round(center.z*2)*.5;
      bounds.set(cx-extent/2,cz-extent/2,1/extent,1);data.fill(0);
      if(trail)for(const q of trail.points){
        const age=t-q.t;if(age<0||age>14||(q.amount<.045&&q.thrust<.02))continue;
        const open=1-Math.exp(-age*.46),fade=Math.max(0,1-age/14);
        const shift=.22*age+q.thrust*3.2*open;
        const x=q.x+q.s*shift-age*.072,z=q.z+q.c*shift+age*.035;
        const breadth=1.62+age*(.13+.08*q.amount);
        for(const side of [-1,1]){
          stamp(x+q.c*side*breadth,z-q.s*side*breadth,q.s,q.c,.46+.16*age,1.4+.13*age,q.amount*fade,0);
          if(q.thrust>.02)stamp(x+q.c*side*(.82+.17*age),z-q.s*side*(.82+.17*age),q.s,q.c,
            .59+.19*age,2.15+.13*age,q.thrust*fade,1);
        }
      }
      trace.needsUpdate=true;
    }
    return {uniforms,update,dispose(){trace.dispose();}};
  }
  const declarations=`
    uniform mat4 uFerryLocal;
    uniform vec4 uFerryRegion,uFerryWater,uBayLine;
    uniform sampler2D uFerryTrail;
    vec2 ferryStation(float z){
      vec2 s=vec2(.06,1.85);
      s=mix(s,vec2(1.24,1.69),clamp((z+9.2)/.85,0.,1.));
      s=mix(s,vec2(2.04,1.50),clamp((z+8.35)/1.55,0.,1.));
      s=mix(s,vec2(2.32,1.39),clamp((z+6.80)/2.2,0.,1.));
      s=mix(s,vec2(2.38,1.35),clamp((z+4.60)/3.60,0.,1.));
      s=mix(s,vec2(2.36,1.34),clamp((z+1.)/4.9,0.,1.));
      s=mix(s,vec2(2.20,1.34),clamp((z-3.9)/3.,0.,1.));
      return mix(s,vec2(1.90,1.4),clamp((z-6.9)/1.8,0.,1.));
    }
    float ferryBeam(vec2 shape,float h){
      float beam=mix(.22,.72,clamp((h+1.02)/.46,0.,1.));
      beam=mix(beam,.88,clamp((h+.56)/.38,0.,1.));
      beam=mix(beam,.94,clamp((h+.18)/.25,0.,1.));
      beam=mix(beam,.98,clamp((h-.07)/.23,0.,1.));
      return shape.x*mix(beam,1.,clamp((h-.3)/(shape.y-.42),0.,1.));
    }
  `;
  const disturbance=`
      float shipShade=0.,shipLace=0.,shipBubbles=0.;
      vec2 wakeUV=(p-uFerryRegion.xy)*uFerryRegion.z;
      if(uFerryRegion.w>.5&&all(greaterThan(wakeUV,vec2(.0)))&&all(lessThan(wakeUV,vec2(1.)))){
        vec2 curl=vec2(wsLong.b-.5,wsMid.b-.5);
        vec2 mark=texture2D(uFerryTrail,wakeUV+curl*.013).rg;
        // Sheared films stretch along the wake. Air caught below them remains
        // green for a few seconds after the bright surface bubbles collapse.
        float broken=smoothstep(.21,.72,wsMid.b*.40+noiseA.g*.31+wsFine.b*.29);
        float cells=1.-smoothstep(.015,.15,abs(wsFine.b+.28*noiseB.g-.65));
        shipLace=mark.r*(.22+.78*broken)*(.34+.66*cells);
        shipBubbles=mark.g*(.44+.56*broken);
        normal=normalize(vec3(normal.x+.07*curl.x*mark.r,normal.y,normal.z+.08*curl.y*mark.r));
        vec3 f=(uFerryLocal*vec4(vSea,1.)).xyz;
        if(abs(f.z)<12.&&abs(f.x)<5.3&&f.y>-1.1&&f.y<1.72){
          vec2 dim=ferryStation(f.z);
          float side=abs(f.x)-ferryBeam(dim,f.y);
          vec2 limits=vec2(side,max(f.z-8.7,-9.2-f.z));
          float sd=length(max(limits,0.))+min(max(limits.x,limits.y),0.);
          float rise=smoothstep(-.74,.81,f.y*.78+uFerryWater.z*.28+.30*(wsLong.b-.5));
          float forwardLoad=(1.-smoothstep(-8.8,-3.5,f.z))*uFerryWater.w;
          float load=clamp(.14+.73*rise+forwardLoad*.65,0.,1.);
          float blot=smoothstep(.21,.73,.58*wsLong.b+.22*noiseA.r+.20*wsMid.b);
          float fringe=.047+.36*load*(.4+1.2*blot);
          float wet=smoothstep(-.97,-.76,f.y)*(1.-smoothstep(dim.y-.10,dim.y+.03,f.y));
          shipShade=wet*(1.-smoothstep(.005,.25,sd))*.31;
          shipLace=max(shipLace,(1.-smoothstep(-.005,fringe,sd))*(.12+.88*blot)*(.39+.61*cells)*(.38+.70*load)*wet);
          shipBubbles=max(shipBubbles,.22*load*(1.-smoothstep(.12,.79,sd))*wet*broken);
        }
      }
  `;
  const color=`
      lit*=1.-shipShade;
      lit=mix(lit,vec3(.115,.255,.24),min(.64,shipBubbles*.63));
      lit=mix(lit,vec3(.75,.84,.79),min(.90,shipLace*.99+shipBubbles*.48));
  `;
  return {create,declarations,disturbance,color};
})();
