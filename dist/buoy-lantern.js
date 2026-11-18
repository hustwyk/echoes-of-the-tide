// A fixed green buoy light. Dimensions are metres measured from the marker waterline.
const TideBuoyLantern=(()=>{
  function create(parent){
    const T=THREE, tau=Math.PI*2, focus=2.99, root=new T.Group();
    root.position.y=focus;root.name='旧绿标 · 定光灯器';parent.add(root);
    const materials=[],geometries=[],textures=[];
    function trackMaterial(m){materials.push(m);return m;}
    function batch(){return {p:[],n:[],c:[],u:[],indices:[]};}
    const body=batch(),emitter=batch(),glass=batch(),palette=new Map();
    const vector=(x,y,z)=>new T.Vector3(x,y,z);
    const color=hex=>{
      if(!palette.has(hex))palette.set(hex,new T.Color(hex));
      return palette.get(hex);
    };
    function vertex(b,x,y,z,nx,ny,nz,tint,u,v,value=1){
      const c=color(tint);b.p.push(x,y,z);b.n.push(nx,ny,nz);b.c.push(c.r*value,c.g*value,c.b*value);
      b.u.push(u,v);return b.p.length/3-1;
    }
    function mesh(b,m,name){
      const geom=new T.BufferGeometry();
      geom.setAttribute('position',new T.Float32BufferAttribute(b.p,3));
      geom.setAttribute('normal',new T.Float32BufferAttribute(b.n,3));
      geom.setAttribute('uv',new T.Float32BufferAttribute(b.u,2));
      if(m.vertexColors)geom.setAttribute('color',new T.Float32BufferAttribute(b.c,3));
      geom.setIndex(b.indices);geom.computeBoundingSphere();
      const o=new T.Mesh(geom,m);o.name=name;root.add(o);geometries.push(geom);return o;
    }
    // Pressings, rolled beads and optical cuts share this lathe. Each profile
    // edge has its own normal at the corner; switching slope really changes a glint.
    function turn(b,profile,tint,segs=32,cx=0,cz=0,start=0,arc=tau){
      for(let i=0;i<profile.length-1;i++){
        const [ra,ya,shade]=profile[i],[rb,yb]=profile[i+1],dy=yb-ya,dr=rb-ra;
        const len=Math.hypot(dy,dr),nr=dy/len,ny=-dr/len,l=b.p.length/3;
        for(let j=0;j<=segs;j++){
          const a=start+arc*j/segs,s=Math.sin(a),c=Math.cos(a),u=j/segs;
          const patina=.968+.032*Math.cos(2*a+.8*Math.sin(3*a+.74));
          vertex(b,cx+ra*c,ya,cz+ra*s,nr*c,ny,nr*s,shade||tint,u,ya*8,patina);
          vertex(b,cx+rb*c,yb,cz+rb*s,nr*c,ny,nr*s,shade||tint,u,yb*8,patina);
          if(j<segs){const h=l+2*j;b.indices.push(h,h+1,h+3,h,h+3,h+2);}
        }
      }
    }
    function tube(b,points,r,tint,sides=7){
      const first=b.p.length/3;
      // A single reference normal avoids twisting a rib where it turns down under the hood.
      const chord=points.at(-1).clone().sub(points[0]).normalize();
      const ref=Math.abs(chord.y)<.72?vector(0,1,0):vector(1,0,0);
      for(let i=0;i<points.length;i++){
        const p=points[i],t=points[Math.min(points.length-1,i+1)].clone().sub(points[Math.max(0,i-1)]).normalize();
        const u=ref.clone().cross(t);if(u.lengthSq()<.006)u.copy(vector(0,0,1)).cross(t);u.normalize();
        const v=t.clone().cross(u);
        for(let j=0;j<=sides;j++){
          const a=tau*j/sides,n=u.clone().multiplyScalar(Math.cos(a)).addScaledVector(v,Math.sin(a));
          vertex(b,p.x+r*n.x,p.y+r*n.y,p.z+r*n.z,n.x,n.y,n.z,tint,j/sides,i*.4);
          if(i<points.length-1&&j<sides){const h=first+i*(sides+1)+j;b.indices.push(h,h+1,h+sides+2,h,h+sides+2,h+sides+1);}
        }
      }
    }
    function ring(b,r,y,d,w,tint,segments=30){
      turn(b,[[r-d,y-w],[r+d*.50,y-w],[r+d,y-w*.46],[r+d,y+w*.42],[r+d*.54,y+w],[r-d,y+w]],tint,segments);
    }
    const paint=0x364f47,shadowGreen=0x223932,edge=0x526961,bronze=0x766750,black=0x1b2926;
    // Bed flange, rain recess, bolted retaining collar, two rubber compression gaskets.
    turn(body,[[.02,-.312],[.262,-.312],[.295,-.304],[.302,-.287],[.300,-.279],[.277,-.273],
      [.245,-.273],[.234,-.238],[.241,-.232],[.256,-.230],[.258,-.212],[.247,-.201],[.222,-.199]],paint);
    ring(body,.246,-.208,.006,.0045,bronze);ring(body,.224,-.193,.006,.006,black);
    for(let j=0;j<8;j++){const a=tau*(j+.18)/8,cx=.270*Math.cos(a),cz=.270*Math.sin(a);
      turn(body,[[.014,-.276],[.015,-.271],[.0125,-.268],[.0125,-.255],[.009,-.252],[0,-.252]],j%3===0?bronze:edge,6,cx,cz,a);}
    // The underside of an old cap stays pale; the outer crest is black-green enamel.
    ring(body,.234,.204,.008,.006,black);
    turn(body,[[.211,.206],[.251,.207],[.257,.215],[.258,.228],[.270,.229],[.276,.241],
      [.273,.247],[.256,.252],[.240,.262],[.220,.275],[.191,.282],[.158,.286]],paint);
    ring(body,.252,.222,.004,.0065,bronze);
    // Real open vent slots between a dark core flue and the button-cap skirt.
    turn(body,[[.132,.279],[.132,.366],[.110,.383],[.083,.426]],black,32);
    for(let j=0;j<12;j++){
      const a=tau*j/12+.08;
      turn(body,[[.153,.280],[.151,.357],[.134,.368]],edge,3,0,0,a,.175);
    }
    turn(body,[[.082,.356],[.162,.357],[.182,.368],[.180,.379],[.164,.387],[.139,.413],
      [.100,.431],[.065,.439],[.060,.446],[.039,.456],[.014,.458],[0,.459]],shadowGreen);
    ring(body,.159,.379,.005,.0037,edge);
    // Four spring guards bow out around the optical drum. There is a clear wide
    // face between guards, including at the low sight angle from the stern.
    for(let j=0;j<4;j++){
      const a=tau*(j+.34)/4,c=Math.cos(a),s=Math.sin(a);
      const stations=[[.235,-.226],[.259,-.214],[.270,-.192],[.272,-.144],
        [.272,.135],[.266,.183],[.257,.205],[.238,.224]];
      tube(body,stations.map(([r,y])=>vector(r*c,y,r*s)),.0083,j===2?edge:shadowGreen,7);
      const cx=.255*c,cz=.255*s;
      turn(body,[[.011,-.229],[.013,-.212],[.010,-.205]],bronze,7,cx,cz);
    }
    ring(body,.272,.105,.0035,.0038,shadowGreen);
    // A single small lifting eye over the vent has a real open centre.
    const lift=[];for(let j=0;j<=20;j++){const a=Math.PI*j/20;lift.push(vector(.068*Math.cos(a),.450+.103*Math.sin(a),.008));}
    tube(body,lift,.009,edge,7);
    turn(body,[[.044,-.198],[.052,-.198],[.052,-.173],[.038,-.167],[.033,-.120],
      [.038,-.115],[.037,-.088],[.026,-.081],[.020,-.060]],bronze,20);
    for(const s of [-1,1])tube(body,[vector(.017*s,-.118,0),vector(.022*s,-.075,.003),
      vector(.021*s,-.013,.006)],.0035,bronze,5);
    // The true steady light is at the centre, inside the annular optic.
    turn(emitter,[[.025,-.071,0x659d73],[.040,-.055,0xafdfac],[.047,-.017,0xd0ffbc],
      [.050,.017,0xd9ffbf],[.041,.048,0xc4fbb3],[.029,.065,0x92c99b],[.012,.084,0x627f71],[0,.084]],0xcdffba,20);
    const coil=[];for(let j=0;j<=34;j++){const a=j*.82;coil.push(vector(.053*Math.cos(a),-.023+.00176*j,.053*Math.sin(a)));}
    tube(emitter,coil,.0028,0xf0ffdf,5);
    // A single cast lens, with eleven shallow annular prisms. The tall central
    // band is continuously bowed. Caps above and below hide both open ends.
    const profile=[[.216,-.203],[.224,-.194]];
    const band=.032;for(let j=0;j<5;j++){
      const y=-.192+j*band;profile.push([.231,y],[.222,y+.008],[.231,y+band-.002]);
    }
    profile.push([.229,-.030],[.233,-.020],[.236,-.007],[.236,.007],[.233,.020],[.229,.030]);
    for(let j=0;j<5;j++){const y=.032+j*band;profile.push([.231,y+.001],[.222,y+band-.008],[.231,y+band]);}
    profile.push([.226,.198],[.216,.204]);turn(glass,profile,0xffffff,36);
    // Salt pinholes in the paint catch light. No external images or frame callbacks.
    const size=64,patina=new Uint8Array(size*size*4);let seed=641;
    const random=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};
    for(let j=0;j<size;j++)for(let i=0;i<size;i++){
      const h=160+34*Math.sin(j*.16+.61*Math.sin(i*.13))+random()*48;
      const v=Math.min(255,Math.round(h+(random()>.976?52:0))),q=4*(j*size+i);
      patina[q]=patina[q+1]=patina[q+2]=v;patina[q+3]=255;
    }
    const film=new T.DataTexture(patina,size,size);film.wrapS=film.wrapT=T.RepeatWrapping;
    film.minFilter=T.LinearMipmapLinearFilter;film.magFilter=T.LinearFilter;film.generateMipmaps=true;film.needsUpdate=true;textures.push(film);
    const iron=trackMaterial(new T.MeshStandardMaterial({vertexColors:true,metalness:.56,roughness:.75,
      roughnessMap:film,bumpMap:film,bumpScale:.00084}));
    const cover=mesh(body,iron,'铸罩、通风孔和防撞条');cover.castShadow=cover.receiveShadow=true;
    mesh(emitter,trackMaterial(new T.MeshBasicMaterial({vertexColors:true,toneMapped:false})),'灯泡与灯丝');
    // A single transparent front surface avoids overdraw/sorting between several
    // glass cylinders. The mapped ray intersects the focal band inside the optic.
    // Copper fasteners and the far guards remain visible through the dark facets.
    const lens=trackMaterial(new T.ShaderMaterial({transparent:true,depthWrite:false,side:T.FrontSide,fog:true,
      uniforms:T.UniformsUtils.merge([T.UniformsLib.fog]),
      vertexShader:`
        varying vec3 vLocal;varying vec3 vView;varying vec3 vFacet;
        #include <fog_pars_vertex>
        void main(){
          vec4 mvPosition=modelViewMatrix*vec4(position,1.0);vec3 eye=-mvPosition.xyz;
          vLocal=position;vFacet=normal;
          vView=vec3(dot(eye,modelViewMatrix[0].xyz),dot(eye,modelViewMatrix[1].xyz),dot(eye,modelViewMatrix[2].xyz));
          gl_Position=projectionMatrix*mvPosition;
          #include <fog_vertex>
        }`,
      fragmentShader:`
        varying vec3 vLocal;varying vec3 vView;varying vec3 vFacet;
        #include <fog_pars_fragment>
        void main(){
          vec3 v=normalize(vView),n=normalize(vFacet);vec2 xy=vLocal.xz;
          vec2 eyeXZ=v.xz/max(length(v.xz),.001);float edge=clamp(dot(normalize(xy),eyeXZ),0.,1.);
          float across=abs(xy.x*eyeXZ.y-xy.y*eyeXZ.x);
          float h=vLocal.y-v.y*dot(xy,eyeXZ)/max(length(v.xz),.18);
          float central=exp(-pow(across/.084,2.))*exp(-pow(h/.061,2.));
          float forward=pow(edge,1.45);float lip=pow(1.-edge,3.);
          float gather=exp(-pow(h/.168,2.))*(.42+.58*forward);
          float ring=(.58+.42*clamp(.48+2.4*dot(n,vec3(-.37,.83,.32)),0.,1.));
          float theta=atan(xy.y,xy.x);float streak=.5+.5*sin(theta*13.+.7*sin(theta*9.)+.3*sin(vLocal.y*14.));
          vec3 refl=reflect(-v,n);float sky=smoothstep(-.24,.56,refl.y);
          float cloud=pow(max(dot(normalize(vec3(-.60,.41,-.68)),refl),0.),38.);
          vec3 rgb=mix(vec3(.009,.064,.044),vec3(.043,.17,.107),sky)*(.57+.43*ring);
          rgb+=vec3(.069,.57,.22)*gather*ring+vec3(.26,1.02,.39)*central;
          rgb+=vec3(.057,.099,.088)*lip+vec3(.51,.67,.59)*cloud+vec3(.012,.046,.023)*streak*gather;
          float alpha=.42+.26*lip+.17*gather+.10*cloud;
          gl_FragColor=vec4(rgb,alpha);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
          #include <fog_fragment>
        }`}));
    mesh(glass,lens,'绿色菲涅耳透镜');let disposed=false;
    return {dispose(){if(disposed)return;disposed=true;parent.remove(root);
      geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());}};
  }
  return {create};
})();
