// In-world instruments are driven by the same Session values as the operator HUD.
window.TideFieldProps=(()=>{
  const T=THREE, TAU=2*Math.PI;
  const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
  const v=(x,y,z)=>new T.Vector3(x,y,z);
  const hot='#ffd994', cool='#92eece', iron='#405258', worn='#94a6a3', copper='#aa7859', brass='#c3a16a';
  const grease='#252e2f', seal='#43433d';
  function create(scene,session,actors){
    const root=new T.Group();root.name='Mission apparatus';scene.add(root);
    const common=new Set(),temp=new Set(),animation=[];
    const permanent=obj=>(common.add(obj),obj);
    const local=obj=>(temp.add(obj),obj);
    const cube=permanent(new T.BoxGeometry(1,1,1)), cylinder=permanent(new T.CylinderGeometry(1,1,1,14));
    const torus=permanent(new T.TorusGeometry(1,.065,6,32)), disc=permanent(new T.CircleGeometry(1,48));
    const plane=permanent(new T.PlaneGeometry(1,1)), bulb=permanent(new T.SphereGeometry(1,12,8));
    const metal=permanent(new T.MeshStandardMaterial({color:0xffffff,metalness:.42,roughness:.5}));
    const metalPaint=new Map();
    const solid=hex=>{
      if(!metalPaint.has(hex))metalPaint.set(hex,permanent(new T.MeshStandardMaterial({color:hex,metalness:.34,roughness:.48})));
      return metalPaint.get(hex);
    };
    const unlit=new Map();
    const emit=hex=>{
      if(!unlit.has(hex))unlit.set(hex,permanent(new T.MeshBasicMaterial({color:hex,toneMapped:false})));
      return unlit.get(hex);
    };
    let section,staticParts,stage=-1;
    function mesh(geo,mat,p,w=1,h=1,d=1,parent=section){
      const m=new T.Mesh(geo,mat);m.scale.set(w,h,d);m.position.copy(p);parent.add(m);return m;
    }
    // Static hardware, including printed graduations and screws, uses a single instanced draw per shape.
    const transform=new T.Object3D(),up=v(0,1,0);
    function instance(geometry,p,scale,color,rx=0,ry=0,rz=0,quat=null) {
      const batch=staticParts.get(geometry)||[];
      transform.position.copy(p);transform.scale.set(...scale);
      if(quat)transform.quaternion.copy(quat);else transform.rotation.set(rx,ry,rz);
      transform.updateMatrix();
      batch.push([transform.matrix.clone(),color]);staticParts.set(geometry,batch);
    }
    const block=(p,w,h,d,c,rx=0,ry=0,rz=0)=>instance(cube,p,[w,h,d],c,rx,ry,rz);
    const tube=(p,r,h,c,rx=0,rz=0)=>instance(cylinder,p,[r,h,r],c,rx,0,rz);
    const rim=(p,r,c,rx=0,ry=0)=>instance(torus,p,[r,r,r],c,rx,ry);
    function rod(a,b,r,c) {
      const vec=b.clone().sub(a),length=vec.length();
      if(length<.001)return;
      const q=new T.Quaternion().setFromUnitVectors(up,vec.normalize());
      instance(cylinder,a.clone().lerp(b,.5),[r,length,r],c,0,0,0,q);
    }
    function offset(p,x,y,z){return v(p.x+x,p.y+y,p.z+z);}
    function shaft(parent,a,b,r,color){
      const m=mesh(cylinder,solid(color),a,1,1,1,parent);
      aimShaft(m,a,b,r);return m;
    }
    function aimShaft(m,a,b,r){
      const vec=b.clone().sub(a),d=vec.length();
      m.position.copy(a).lerp(b,.5);m.scale.set(r,Math.max(.001,d),r);
      m.quaternion.setFromUnitVectors(up,vec.normalize());
    }
    function cable(ctrl,radius,col,num=30){
      const c=new T.CatmullRomCurve3(ctrl, false, 'centripetal');
      const geo=local(new T.TubeGeometry(c,num,radius,6,false));
      mesh(geo,solid(col),v(0,0,0));return c;
    }
    function texture(w,h,draw){
      const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);
      const tex=local(new T.CanvasTexture(c));tex.colorSpace=T.SRGBColorSpace;tex.anisotropy=4;return tex;
    }
    function card(p,w,h,text,small,angle=-.08) {
      const tex=texture(512,176,(c,W,H)=>{
        c.fillStyle='#344949';c.fillRect(0,0,W,H);c.lineWidth=4;c.strokeStyle='#83918b';c.strokeRect(3,3,W-6,H-6);
        c.fillStyle='#ecd6ac';c.font='bold 53px sans-serif';c.fillText(text,33,78,450);c.fillStyle='#b2c5bf';c.font='26px monospace';c.fillText(small,34,131,451);
        for(const x of [13,W-13])for(const y of [13,H-13]){c.fillStyle='#b2b2a5';c.beginPath();c.arc(x,y,4,0,TAU);c.fill();}
      });
      const m=mesh(plane,local(new T.MeshStandardMaterial({map:tex,emissive:0x101514,roughness:.61,side:T.DoubleSide})),p,w,h);
      m.rotation.x=angle;return m;
    }
    function pilot(p,color,r=.09){
      tube(offset(p,0,0,-.03),r*1.45,.096,grease,Math.PI/2);
      rim(offset(p,0,0,.024),r*1.13,brass);
      const lamp=mesh(bulb,emit(color),offset(p,0,0,.044),r,r,r*.42);
      const dead=solid('#53615a'),lit=emit(color);
      return on=>{lamp.material=on?lit:dead;};
    }
    function bolted(p,w,h,d,c){
      block(p,w,h,d,c);
      for(const x of [-1,1])for(const y of [-1,1])
        tube(offset(p,x*(w/2-.052),y*(h/2-.045),d/2+.004),.025,.015,brass,Math.PI/2);
    }
    function stand(p,w,h){
      for(const x of [-w*.38,w*.38]){block(offset(p,x,h*.5,0),.06,h,.10,iron);block(offset(p,x,.034,.02),.27,.065,.38,worn);}
    }
    function arrow(p,sign=1){
      block(p,.1,.014,.38,brass);
      for(const k of [-1,1])block(offset(p,k*.089,0,-.16*sign),.065,.016,.23,brass,0,k*.73*sign);
    }
    function harborsideCable(g) {
      const sec=g.section, paths=sec.paths, ends=sec.sites;
      const nodeColors=['#594339','#37494c','#605342'];
      // Each feed follows a real path. Wet cable droops below hooks between dry landings.
      for(let side=0;side<2;side++){
        const points=[sec.starts[side],...paths[side],sec.ends[side]];
        const outer=side?1:-1, row=[];
        for(let j=0;j<points.length;j++){
          const p=points[j],x=outer*Math.max(.25,p.w*.5-.18);
          const eye=offset(p,x,.32,0);
          tube(offset(eye,0,-.15,0),.038,.50,iron);
          rim(eye,.09,brass,0,Math.PI*.5);
          if(j){const prev=row[row.length-1];row.push(prev.clone().lerp(eye,.5).add(v(0,-.38,0)));}
          row.push(eye);
        }
        cable(row,.035,nodeColors[(g.stage+side)%3],Math.max(18,row.length*4));
      }
      const p=offset(ends[1],.88,0,-.99);
      stand(p,.95,.87);bolted(offset(p,0,1.01,0),1.18,.41,.13,enamelColor(1));
      const pins=[],patterns=[[.17,.17],[.48,.18],[.18,.48]];
      for(let i=0;i<3;i++){
        const port=offset(p,(i-1)*.34,1.02,.10);
        tube(port,.09,.07,brass,Math.PI/2);rim(offset(port,0,0,.05),.059,grease);
        pins.push(pilot(offset(port,0,.135,.003),cool,.031));
      }
      const plug=mesh(cylinder,solid('#3c3932'),offset(p,0,1.02,.205),.05,.18,.05);
      plug.rotation.x=Math.PI*.5;
      const light=pilot(offset(ends[0],-.48,1.20,-1.02),hot,.08);
      const span=patterns[g.spec.code];
      animation.push(s=>{
        const elapsed=s.time-s.state.pulseAt,period=elapsed%1.4;
        const flash=elapsed<3.5&&(period<span[0] || (period>span[0]+.20 && period<span[0]+.20+span[1]));
        light(flash);const port=Math.min(2,Math.floor(s.state.dials[1]*3));
        pins.forEach((on,i)=>on(flash && i===s.spec.code));
        plug.position.x=p.x+(port-1)*.34;
      });
    }
    function enamelColor(side){return side?'#456763':'#70604a';}
    function landingLights(g){
      const sec=g.section,plates=sec.rig.marks,ledge=sec.rig.ledge;
      const symbols=['〃','○','△'],driver=sec.sites[g.spec.driver];
      card(offset(driver,g.spec.driver?.91:-.91,1.16,-1.16),.75,.40,symbols[sec.rig.slot],TideRigging.signs[sec.rig.slot]);
      const faces=plates.map((p,i)=>{
        const at=v(p.x,p.y,p.z);
        // The plates hang beyond the far edge, leaving the landing feet clear.
        block(offset(at,0,.56,0),.038,.78,.044,iron);
        bolted(at,.90,.66,.075,seal);
        const map=texture(320,224,(c,W,H)=>{
          c.fillStyle='#34453f';c.fillRect(0,0,W,H);
          for(let py=8;py<H-8;py+=7)for(let px=8;px<W-8;px+=7){
            c.fillStyle=(px+py)%3?'#4c5950':'#596258';c.fillRect(px,py,2,2);
          }
          c.strokeStyle='#ebdda3';c.lineWidth=6;c.strokeRect(9,9,W-18,H-18);
          c.strokeStyle='#f4e6ad';c.lineWidth=18;c.lineJoin='round';c.lineCap='round';c.beginPath();
          if(i===0){c.moveTo(94,165);c.lineTo(157,61);c.moveTo(164,165);c.lineTo(227,61);}
          else if(i===1)c.arc(160,113,62,0,TAU);
          else {c.moveTo(160,45);c.lineTo(232,169);c.lineTo(88,169);c.closePath();}
          c.stroke();
        });
        return mesh(plane,local(new T.MeshStandardMaterial({map,emissiveMap:map,emissive:0x383329,roughness:.46})),offset(at,0,0,.044),.87,.635);
      });
      rod(offset(plates[0],-.56,1,0),offset(plates[2],.56,1,0),.061,iron);
      for(const [i,dir] of [[0,-1],[2,1]]){
        rod(offset(plates[i],dir*.48,1,0),offset(plates[i],dir*.48,-1.15,0),.045,worn);
      }
      const spot=mesh(torus,local(new T.MeshBasicMaterial({color:0xffe8ba,transparent:true,opacity:.53,depthWrite:false,blending:T.AdditiveBlending})),v(0,0,0),.37,.37,.37);
      const cone=mesh(local(new T.ConeGeometry(1,1,30,1,true).translate(0,-.5,0)),local(new T.ShaderMaterial({
        transparent:true,side:T.DoubleSide,depthWrite:false,blending:T.AdditiveBlending,
        vertexShader:'varying vec2 st;void main(){st=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
        fragmentShader:'varying vec2 st;void main(){float a=.021+.042*pow(st.y,3.);gl_FragColor=vec4(1.,.88,.55,a);}'
      })),v(0,0,0));
      const lamp=new T.SpotLight(0xffdfaa,14,26,.15,.55,1.15);section.add(lamp,lamp.target);
      const bulbA=pilot(offset(ledge,-.71,.13,-.48),cool,.075),bulbB=pilot(offset(ledge,.71,.13,-.48),cool,.075);
      const origin=v(0,0,0),tip=v(0,0,0),axis=v(0,-1,0),delta=v(0,0,0);
      animation.push(s=>{
        const rig=s.rig,live=rig.lightOn&&!rig.lit;
        spot.visible=cone.visible=lamp.visible=live;bulbA(rig.lit);bulbB(rig.lit);
        faces.forEach((m,i)=>{
          const selected=Math.abs(rig.aim-(i-1)*1.55)<.34;
          m.material.emissive.setHex(rig.lit&&i===sec.rig.slot?0x457b69:live&&selected?0x766952:0x0d1418);
        });
        if(!live)return;
        const ray=TideRigging.ray(s);
        if(actors)actors[1-s.spec.driver].userData.rig.bones.headlamp.getWorldPosition(origin);
        else origin.fromArray(ray.eye);
        tip.fromArray(ray.at);delta.subVectors(tip,origin);
        lamp.position.copy(origin);lamp.target.position.copy(tip);
        const distance=delta.length();cone.position.copy(origin);cone.scale.set(.29,distance,.29);
        cone.quaternion.setFromUnitVectors(axis,delta.normalize());
        spot.position.copy(tip);spot.position.z+=.10;
      });
    }
    function waterWindow(g){
      const sec=g.section,ledge=sec.rig.ledge,f=sec.ferry;
      const z=f.to.z+1.32,x=ledge.x,y=ledge.y;
      // A flood gate spans the guide channel. Its lintel and rollers flank the working opening.
      const opening=2.22,lintel=y+3.25;
      for(const side of [-1,1]){
        const edge=v(x+side*opening,y,z);
        block(offset(edge,side*.45,-.31,0),.91,6.5,.62,'#596361');
        block(offset(edge,side*.16,.49,.34),.25,5.4,.11,iron);
        for(let j=0;j<7;j++){
          tube(offset(edge,side*.34,-1.7+j*.66,.35),.056,.045,brass,Math.PI/2);
          block(offset(edge,side*.07,-1.87+j*.59,.37),.18,.027,.058,worn);
        }
        bolted(offset(edge,0,.22,.37),.38,.65,.08,'#475955');
        const guideRoll=mesh(cylinder,solid(brass),offset(edge,0,.22,.48),.126,.17,.126);
        guideRoll.rotation.x=Math.PI/2;
        for(const h of [-.27,.27])block(offset(edge,-side*.14,h,.41),.23,.045,.09,'#dbb27f');
      }
      block(v(x,lintel,z),5.59,.53,.69,'#626b63');
      card(v(x,lintel+.03,z+.37),1.74,.37,'水位观察窗','NORTH CAPE  /  '+(g.stage+1));
      const flag=pilot(v(x+1.73,lintel,z+.37),cool,.119);
      const meshWidth=3.86;
      const gate=new T.Group();gate.position.set(x,y+2.12,z);section.add(gate);
      for(let j=0;j<6;j++){
        mesh(cube,solid('#627373'),v(0,j*.20,.04),meshWidth,.19,.124,gate);
        mesh(cube,solid('#859086'),v(0,j*.20-.066,.14),meshWidth,.025,.055,gate);
      }
      const gaugeX=x-opening+.29;
      const gauge=card(v(gaugeX,y+.03,z+.44),.36,2.21,'','',0);
      gauge.material.map=texture(192,960,(c,W,H)=>{
        c.fillStyle='#dfdbbd';c.fillRect(0,0,W,H);c.fillStyle='#3c5451';
        for(let j=0;j<21;j++){
          const h=25+j*45;c.fillRect(0,h,j%5?44:92,j%5?5:9);
          if(!(j%5)){c.font='bold 34px monospace';c.fillText(String(100-10*j),96,h+13);}
        }
        c.fillStyle='#a36149';c.fillRect(0,H*.50-4,W,8);
      });
      const float=mesh(torus,solid('#ddad68'),v(gaugeX,y,z+.50),.154,.154,.185);
      animation.push((s,dt)=>{
        const level=s.rig.water+.38,fit=Math.abs(ledge.y-level)<.36;
        flag(fit||s.rig.opened);float.position.y=clamp(level,y-1.1,y+1.1);
        const target=s.rig.opened?y+2.97:fit?y+2.42:y+1.78;
        gate.position.y+=(target-gate.position.y)*(1-Math.exp(-9*dt));
      });
    }
    function tug(g) {
      const sec=g.section, f=sec.ferry, d=sec.sites[g.spec.driver],deck=f.deck;
      const direction=g.spec.driver===0?-1:1;
      const anchor=offset(d,direction*.47,.66,-1.07);
      const overhead=v(f.from.x,Math.max(f.to.y,f.from.y)+5.45,f.from.z);
      rod(anchor,offset(anchor,direction*.88,1.95,-.38),.045,steelColor());
      const guide=offset(anchor,direction*.88,1.95,-.38);
      cable([guide,guide.clone().lerp(overhead,.4).add(v(0,-.2,0)),overhead],.03,grease,24);
      rim(guide,.19,brass,0,Math.PI/2);rim(overhead,.15,brass,0,Math.PI/2);
      const travelling=shaft(section,overhead,v(deck.x,deck.y+1,deck.z),.022,grease);
      const destination=sec.ends[1-g.spec.driver];
      for(let k=0;k<2;k++)arrow(offset(destination,0,.017,k*.62+.8));
      animation.push(()=>{
        const end=v(deck.x,deck.y+(g.spec.mode==='basket'?2.8:.32),deck.z);
        aimShaft(travelling,overhead,end,.026);
      });
      if(g.spec.mode==='basket')landingLights(g);
      if(g.spec.mode==='raft'){pumpWell(g);waterWindow(g);}
      if(g.spec.mode==='bridge'){
        for(const t of [-1,1]){
          const end=offset(destination,t*1.28,.36,1.9);
          tube(end,.065,.78,brass);
          rim(offset(end,0,.22,.01),.095,steelColor());
        }
        const strip=mesh(cube,solid('#d9b576'),v(deck.x,deck.y+.027,deck.z),.11,.017,2.50);
        animation.push(()=>strip.position.set(deck.x,deck.y+.027,deck.z));
      }
    }
    function steelColor(){return '#788483';}
    function pumpWell(g) {
      const f=g.section.ferry,d=f.deck,a=f.from,b=f.to;
      const cx=(a.x+b.x)/2,cz=(a.z+b.z)/2;
      const w=5.1,len=Math.abs(b.z-a.z)+3.85;
      const concrete=local(TideConcrete.material(0xc5c7b6,g.rig.water));
      for(const sign of [-1,1]){
        const x=cx+sign*w*.5;
        const top=Math.max(a.y,b.y)+1.04,bottom=Math.min(a.y,b.y)-2.27;
        mesh(cube,concrete,v(x,(top+bottom)*.5,cz),.26,top-bottom,len);
        block(v(x,top,cz),.35,.16,len,brass);
        for(let j=0;j<=4;j++){
          const zz=cz-len*.5+(j+.15)*len/4.3;
          block(v(x-sign*.16,(top+bottom)*.5,zz),.105,top-bottom,.145,'#475855');
          for(let k=0;k<5;k++)block(v(x-sign*.14,top-.26-k*.16,zz+.22),.035,.035,.29,worn);
        }
        const railA=v(x,a.y+2.05,a.z+.88),railB=v(x,b.y+2.05,b.z-.88);
        rod(railA,railB,.031,steelColor());
        for(const p of [railA,railB]){rod(p,p.clone().add(v(0,-3.52,0)),.056,iron);rim(p,.11,brass,Math.PI/2);}
      }
      const surface=local(new T.PlaneGeometry(w-.17,len,22,42));surface.rotateX(-Math.PI/2);
      const uniforms={clock:{value:0},load:{value:0},sky:{value:null},hasSky:{value:0},extent:{value:new T.Vector2(w-.17,len)}};
      const water=mesh(surface,local(new T.ShaderMaterial({uniforms,
        vertexShader:`
          uniform float clock,load;varying vec3 positionW;varying vec2 st;
          void main(){st=uv;vec3 p=position;
            p.y+=.023*sin(p.x*4.1+p.z*2.2+clock*2.)+.015*sin(p.z*3.4-p.x*.95-clock*2.4);
            positionW=(modelMatrix*vec4(p,1.)).xyz;gl_Position=projectionMatrix*viewMatrix*vec4(positionW,1.);}
        `,
        fragmentShader:`
          uniform float clock,load,hasSky;uniform vec2 extent;uniform sampler2D sky;varying vec3 positionW;varying vec2 st;
          void main(){
            vec2 p=positionW.xz;float t=clock;
            vec2 outlet=(st-vec2(.80,.67))*extent;float r=length(outlet);
            float wave=sin(r*15.-t*(3.+4.*load))*exp(-r*1.45);
            vec2 ripple=vec2(.115*cos(dot(p,vec2(4.1,2.2))+t*2.),.088*cos(dot(p,vec2(-.95,3.4))-t*2.4));
            ripple+=vec2(sin(p.y*13.+sin(p.x*9.)+t),cos(p.x*11.-t*2.1))*.033;
            ripple+=outlet/(r+.01)*wave*(.055+.16*load);
            vec3 n=normalize(vec3(ripple.x,1.,ripple.y)),eye=normalize(cameraPosition-positionW);
            vec3 refl=reflect(-eye,n);vec2 skyUV=vec2(.5+atan(refl.z,refl.x)/6.283185,.5+asin(clamp(refl.y,-1.,1.))/3.141593);
            vec3 env=mix(vec3(.17,.23,.22),texture2D(sky,skyUV).rgb,hasSky);
            float girder=smoothstep(.75,.95,abs(sin((p.y+refl.z*3.)*1.20)));
            env=mix(env*.48,vec3(.032,.051,.049),girder*.57);
            float fres=.11+.72*pow(1.-max(dot(n,eye),0.),2.5);
            vec3 col=mix(vec3(.022,.066,.061),env,fres);
            float spec=pow(max(dot(reflect(normalize(vec3(.4,-.82,-.38)),n),eye),0.),62.);
            col+=vec3(.60,.50,.29)*spec*.56;
            float edge=1.-smoothstep(0.,.043,min(st.x,1.-st.x));
            col+=vec3(.28,.37,.31)*(.40+.40*sin(p.y*15.+ripple.x*7.))*edge;
            col+=vec3(.15,.22,.18)*max(wave,0.)*(.18+load*.7);
            gl_FragColor=vec4(col,1.);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }`
      })),v(cx,d.y-.38,cz));
      const bubble=mesh(torus,emit('#7eb5a4'),v(cx,d.y-.28,cz),.25,.25,.25);bubble.rotation.x=Math.PI/2;
      animation.push(s=>{
        water.position.y=s.rig.water;concrete.userData.waterline.value=s.rig.water;uniforms.clock.value=s.time;uniforms.load.value=Math.abs(s.rig.flow);
        uniforms.hasSky.value=scene.environment?.isTexture?1:0;uniforms.sky.value=scene.environment;
        const phase=(s.time*.63)%1;
        bubble.position.set(cx+w*.34,water.position.y+.054,cz+len*.16);
        bubble.scale.setScalar(.10+.49*phase);bubble.visible=phase<.78;
      });
    }
    function powerPlant(g){
      const s=g.section.sites[0],p=offset(s,-1.02,.82,-1.40);
      const axle=mesh(cylinder,solid(brass),p,.12,.28,.12);axle.rotation.x=Math.PI/2;
      const wheel=new T.Group();section.add(wheel);wheel.position.copy(offset(p,0,0,.20));
      rim(p,.57,iron);mesh(torus,solid(copper),v(0,0,0),.53,.53,.53,wheel);
      for(let j=0;j<6;j++){
        const a=j*TAU/6;shaft(wheel,v(0,0,0),v(.49*Math.cos(a),.49*Math.sin(a),0),.033,worn);
      }
      block(offset(p,0,-.48,0),.16,.67,.18,iron);
      const gate=offset(g.section.sites[1],1.08,1.44,-1.40);
      bolted(gate,1.0,.75,.16,iron);stand(offset(g.section.sites[1],1.08,0,-1.4),.78,1.41);
      const light=mesh(plane,emit('#81efab'),offset(gate,0,0,.09),.78,.53);
      const shutter=mesh(cube,solid('#424e4b'),offset(gate,0,.55,.115),.86,.59,.055);
      const stencil=local(new T.ShapeGeometry((()=>{const shape=new T.Shape();shape.moveTo(-.07,0);shape.lineTo(-2.3,-11);shape.lineTo(2.3,-11);shape.lineTo(.07,0);shape.closePath();return shape;})()));
      const sheen=mesh(stencil,local(new T.MeshBasicMaterial({color:'#7de5ae',transparent:true,opacity:.12,blending:T.AdditiveBlending,depthWrite:false,side:T.DoubleSide})),offset(gate,0,-.23,-.2));
      sheen.rotation.x=Math.PI*.48;
      animation.push(s=>{
        const amount=clamp(s.cues.light);
        wheel.rotation.z=s.state.dials[0]*2.8*TAU+(s.engaged[0]&&s.spec.type==='power'?Math.sin(s.time*12)*.038:0);
        shutter.position.y=gate.y+.58*amount;light.visible=amount>.02;
        sheen.material.opacity=.18*amount;sheen.visible=amount>.03;
      });
    }
    function archiveStrip(g){
      const s=g.section.sites,p=offset(s[0],1.12,1.13,-1.4);
      stand(offset(p,0,-1.13,0),1.5,1.02);bolted(p,1.53,.72,.15,iron);
      const strip=texture(768,288,(c,W,H)=>{
        c.fillStyle='#192e32';c.fillRect(0,0,W,H);
        c.font='bold 20px monospace';c.fillStyle='#c7cbb7';c.fillText('A   MECHANISM',22,36);c.fillText('B   RADIO',22,168);
        for(let track=0;track<2;track++){
          c.strokeStyle=track?'#a3d9c2':'#ecc490';c.lineWidth=2;c.beginPath();
          for(let x=0;x<W;x++){
            const envelope=.18+Math.pow(Math.abs(Math.sin(x*.012+track*2)),5)*.82;
            const y=82+track*124+Math.sin(x*(track?.19:.38))*Math.cos(x*.07)*envelope*31;
            if(x===0)c.moveTo(x,y);else c.lineTo(x,y);
          }c.stroke();
          c.strokeStyle='#567a79';c.lineWidth=1;
          for(let j=0;j<30;j++)c.strokeRect(j*26,114+track*124,1,j%5?5:13);
        }
      });
      mesh(plane,local(new T.MeshStandardMaterial({map:strip,emissive:0x182122})),offset(p,0,0,.083),1.4,.56);
      const heads=[0,1].map((i)=>mesh(cube,emit(i?cool:hot),offset(p,0,.13-i*.27,.094),.013,.220,.006));
      const reels=[];
      for(const dx of [-.42,.42]){
        const p2=offset(s[1],dx,1.09,-1.61);
        tube(offset(p2,0,0,-.03),.23,.09,seal,Math.PI/2);rim(p2,.215,worn);
        const r=new T.Group();section.add(r);r.position.copy(offset(p2,0,0,.017));
        for(let k=0;k<3;k++)shaft(r,v(0,0,0),v(Math.cos(k*TAU/3)*.202,Math.sin(k*TAU/3)*.202,0),.020,worn);
        reels.push(r);
      }
      rod(offset(s[1],-.42,.892,-1.59),offset(s[1],.42,.892,-1.59),.009,'#4c3025');
      animation.push(s=>{
        for(let i=0;i<2;i++){
          heads[i].position.x=p.x+(s.state.dials[i]-.5)*1.38;
          reels[i].rotation.z=TAU*2*s.state.dials[i];
        }
      });
    }
    function chartSheet(copy,stage){
      return texture(860,540,(c,w,h)=>{
        let seed=(copy?781:1061)+stage*481;
        const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
        if(!copy){c.fillStyle='#ced0b1';c.fillRect(0,0,w,h);}
        else {c.fillStyle='rgba(245,236,192,.36)';c.fillRect(0,0,w,h);}
        c.strokeStyle=copy?'rgba(162,71,48,.67)':'#7c9790';c.lineWidth=2;
        for(let x=0;x<w;x+=60){c.beginPath();c.moveTo(x,0);c.lineTo(x,h);c.stroke();}
        for(let y=0;y<h;y+=60){c.beginPath();c.moveTo(0,y);c.lineTo(w,y);c.stroke();}
        if(!copy) {
          for(let j=0;j<9;j++){
            c.beginPath();
            for(let x=0;x<=w;x+=4){
              const y=206+Math.cos(x*.009+stage*.1)*48+Math.sin(x*.019)*22+j*14;
              if(x===0)c.moveTo(x,y);else c.lineTo(x,y);
            }
            c.strokeStyle=j%3===0?'#517f85':'#7fa4a1';c.lineWidth=j%3===0?3:1.5;c.stroke();
            if(!j){c.lineTo(w,0);c.lineTo(0,0);c.fillStyle='#c5b699';c.fill();}
          }
          c.font='italic 14px serif';c.fillStyle='#476b70';
          for(let j=0;j<36;j++){
            const x=42+random()*780,y=225+random()*193;
            c.fillText((2+random()*26).toFixed(1),x,y);
          }
          c.strokeStyle='#566d68';c.lineWidth=1.1;c.beginPath();c.arc(751,91,44,0,TAU);c.moveTo(751,40);c.lineTo(751,141);c.moveTo(701,91);c.lineTo(802,91);c.stroke();
          for(let j=0;j<24;j++){const a=j*TAU/24;c.beginPath();c.moveTo(751+Math.sin(a)*38,91+Math.cos(a)*38);c.lineTo(751+Math.sin(a)*44,91+Math.cos(a)*44);c.stroke();}
          c.font='bold 15px serif';c.fillText('N',744,36);c.font='14px monospace';c.fillText('36°14′ N',550,194);c.fillText('121°05′ E',637,194);
          for(let i=0;i<5;i++){c.fillStyle=i%2?'#e5d7b5':'#536965';c.fillRect(549+i*35,422,35,5);}
        }else{
          c.save();c.rotate(-.032);c.font='bold 43px sans-serif';c.fillStyle='#944f39';c.fillText(['北线　原始航测','潮位修正记录','北线　须复测'][stage%3],50,75);
          c.setLineDash([17,8]);c.strokeStyle='#a25140';c.lineWidth=4;c.beginPath();c.moveTo(70,429);c.bezierCurveTo(318,275,522,491,779,229);c.stroke();
          c.setLineDash([]);c.strokeRect(518,449,250,54);c.font='24px monospace';c.fillText('CHECK SOUNDINGS',535,485);c.restore();
        }
        for(let i=0;i<12500;i++){
          const x=random()*w,y=random()*h,t=random();
          c.fillStyle=t>.55?'rgba(102,75,50,.069)':'rgba(255,247,196,.086)';
          c.fillRect(x,y,t>.92?2.5:1,.65+random());
        }
        const wornEdge=c.createLinearGradient(0,0,0,h);
        wornEdge.addColorStop(0,'rgba(113,77,44,.28)');wornEdge.addColorStop(.055,'rgba(113,77,44,0)');
        wornEdge.addColorStop(.91,'rgba(113,77,44,0)');wornEdge.addColorStop(1,'rgba(113,77,44,.24)');c.fillStyle=wornEdge;c.fillRect(0,0,w,h);
        const fold=copy?301:302;
        c.strokeStyle=copy?'rgba(109,74,58,.66)':'rgba(91,94,82,.68)';c.lineWidth=3;
        c.beginPath();c.moveTo(fold,0);c.lineTo(fold+11,h);c.stroke();
        c.fillStyle=copy?'#864b36':'#485f63';
        c.font='20px monospace';c.fillText(copy?'B-13 / TRACE':'A-13 / NORTH CAPE',47,498);
        for(const [x,y] of [[100,108],[748,114],[115,405]]) {
          c.strokeStyle=copy?'#ac5036':'#2f5e62';c.lineWidth=3;c.beginPath();c.arc(x,y,16,0,TAU);c.stroke();
          c.save();c.globalCompositeOperation='destination-out';c.beginPath();c.arc(x,y,8,0,TAU);c.fill();c.restore();
          c.beginPath();c.moveTo(x-27,y);c.lineTo(x-13,y);c.moveTo(x,y-26);c.lineTo(x,y-15);c.stroke();
        }
      });
    }
    function lightTable(g){
      const maps=[chartSheet(false,g.stage),chartSheet(true,g.stage)];
      const paperMats=maps.map((map,i)=>local(new T.MeshStandardMaterial({map,side:T.DoubleSide,transparent:true,alphaTest:.015,depthWrite:i===0,roughness:.74,emissive:0x18170f})));
      const pos=TidePaper.board(g),p=v(pos.x,pos.y,pos.z);
      const board=new T.Group();board.position.copy(p);board.rotation.x=-.24;section.add(board);
      const backing=mesh(cube,solid('#607579'),v(0,0,-.043),2.13,1.37,.080,board);
      const ref=new T.Group(),folio=new T.Group();board.add(ref,folio);ref.position.z=.013;folio.position.z=.034;
      mesh(plane,paperMats[0],v(0,0,0),1.89,1.17,1,ref);
      mesh(plane,paperMats[1],v(0,0,0),1.89,1.17,1,folio).renderOrder=2;
      stand(offset(p,0,-1.20,-.26),1.65,1.16);
      for(const x of [-.625,.625])rod(offset(p,x,-.17,-.25),offset(p,x,-.14,-.072),.043,worn);
      for(const x of [-.86,.86])block(offset(p,x,-.54,.17),.16,.055,.07,brass);
      const state=g.paper;
      const mark=(parent,xy,color,r)=>{
        const m=mesh(torus,solid(color),v(xy[0],xy[1],.012),r,r,r,parent);return m;
      };
      for(const xy of [state.pin,state.mark]){
        mark(ref,xy,'#dfe5c6',.053);mark(folio,xy,'#944c35',.043);
      }
      const peg=mesh(cylinder,solid(brass),v(state.pin[0],state.pin[1],.097),.037,.116,.037,board);peg.rotation.x=Math.PI/2;
      const noteMap=texture(640,138,(c,w,h)=>{
        c.fillStyle='#e1dcc0';c.fillRect(0,0,w,h);c.lineWidth=3;c.strokeStyle='#a09673';c.strokeRect(3,3,w-6,h-6);
        c.fillStyle='#575e53';c.font='30px serif';c.fillText(TidePaper.readings[g.stage],19,83,w-38);
      });
      const noteMat=local(new T.MeshStandardMaterial({map:noteMap,transparent:true,depthWrite:false,opacity:0,roughness:.89}));
      const annotation=mesh(plane,noteMat,v(.03,-.40,.065),1.07,.21,1,board);annotation.renderOrder=3;
      const lamp=new T.Group();lamp.position.set(.94,.63,.16);board.add(lamp);
      mesh(cube,solid('#a89668'),v(0,0,0),.12,.13,.27,lamp);
      mesh(cube,emit('#ffebc1'),v(-.063,-.008,.025),.012,.075,.18,lamp);
      const clampFoot=v(1.025,-.05,-.01),elbow=v(1.12,.23,.16);
      mesh(cube,solid(iron),clampFoot,.12,.12,.16,board);
      shaft(board,clampFoot,elbow,.024,worn);
      mesh(bulb,solid(brass),elbow,.046,.046,.046,board);
      const arm=shaft(board,elbow,lamp.position,.022,worn);
      const grazingLamp=new T.SpotLight(0xffe8b5,1.7,3.0,.48,.65,2);
      lamp.add(grazingLamp);board.add(grazingLamp.target);
      animation.push(s=>{
        const p=s.paper;
        ref.rotation.z=0;folio.rotation.z=p.angle;folio.position.x=p.offset[0];folio.position.y=p.offset[1];
        peg.visible=p.pinned;lamp.position.y=.15+p.light*.58;lamp.position.z=.10+p.light*.27;
        grazingLamp.target.position.set(-.71,-.4+(p.light-p.lightTarget)*1.75,.04);
        lamp.rotation.z=-.18-p.light*.42;aimShaft(arm,elbow,lamp.position,.022);
        backing.material=solid(p.pinned?'#91b8a6':'#607579');
        const err=TidePaper.residual(p,p.mark);
        const grazing=Math.max(0,1-Math.abs(p.light-p.lightTarget)*6);
        noteMat.opacity=p.pinned?Math.max(0,1-Math.hypot(...err)*6)*grazing:0;
      });
    }
    function relay(g){
      const s=g.section.sites,p=offset(s[1],.95,1.0,-1.62);
      stand(offset(s[1],.95,0,-1.62),1.02,.98);
      bolted(p,1.39,.69,.17,iron);
      const tags=g.spec.answers.map((word,i)=>{
        const y=.18-i*.175;
        card(offset(p,.07,y,.092),.91,.15,word,'',0);
        return pilot(offset(p,-.50,y,.10),cool,.043);
      });
      const p2=offset(s[0],-.79,1.12,-1.37);
      tube(p2,.31,.06,iron,Math.PI/2);rim(offset(p2,0,0,.038),.28,brass);
      for(let k=-5;k<=5;k++){
        const t=k*.20;
        block(offset(p2,Math.sin(t)*.25,Math.cos(t)*.25,.047),.018,.05,.016,worn,0,0,-t);
      }
      const needle=new T.Group();section.add(needle);needle.position.copy(offset(p2,0,0,.069));
      mesh(cube,emit(hot),v(0,.115,0),.016,.25,.015,needle);
      const peak=new T.Group();section.add(peak);peak.position.copy(offset(p2,0,0,.061));
      mesh(cube,solid('#74a397'),v(0,.202,0),.048,.1,.015,peak);
      animation.push(s=>{
        const t=s.spec.v[0]+Math.sin(s.time*.42)*.105;
        needle.rotation.z=1.01-s.state.dials[0]*2.02;peak.rotation.z=1.01-t*2.02;
        const lock=s.engaged[0]&&Math.abs(s.state.dials[0]-t)<.085;
        const choice=Math.min(2,Math.floor(s.state.dials[1]*3));
        tags.forEach((lamp,i)=>lamp(i===choice&&(lock||Math.sin(s.time*9)>0)));
      });
    }
    function soundings(g){
      const sites=g.section.sites;
      const post= g.spec.type==='post';
      const staves=[];
      for(let i=0;i<2;i++){
        const side=i?1:-1,p=offset(sites[i],side*1.87,0,-1.48);
        const low=p.y-3.6,high=p.y+1.45;
        block(v(p.x,(high+low)/2,p.z),.25,high-low,.16,ivoryColor());
        for(let j=0;j<29;j++) {
          const big=j%5===0;
          block(v(p.x+(big?0:-.043),low+.16+j*.161,p.z+.088),big?.215:.114,big?.043:.028,.012,j%10<5?'#8f4737':iron);
        }
        rod(v(p.x+.24,low,p.z),v(p.x+.24,high,p.z),.032,brass);
        const float=mesh(cylinder,solid(i?cool:hot),v(p.x+.24,low+2,p.z),.10,.18,.10);
        const wake=mesh(torus,solid('#91b7a9'),v(p.x,low,p.z),.39,.39,.39);wake.rotation.x=Math.PI/2;
        staves.push({p,low,high,float,wake});
      }
      const z=g.section.ends[1].z-5.65,y=Math.min(sites[0].y,sites[1].y)-2.12;
      const stump=v(sites[1].x+.95,y,z);
      tube(stump,.151,2.90,'#705645');
      for(let i=0;i<2;i++)tube(offset(stump,0,.91+i*.21,0),.164,.076,'#d9bc78');
      rod(offset(stump,-.07,1.27,0),offset(stump,-.035,1.58,0),.034,copper);
      const wash=mesh(cylinder,local(new T.MeshStandardMaterial({color:'#78a7a3',transparent:true,opacity:.70,roughness:.31,metalness:.19})),stump.clone(),.72,.28,.55);
      const rings=[0,1,2].map(i=>{const r=mesh(torus,solid('#aec1b2'),stump.clone(),1+i*.17,1+i*.17,1);r.rotation.x=Math.PI/2;return r;});
      animation.push(s=>{
        const phase=post?(Math.sin(s.time*1.4)+1)/2:((Math.cos((s.time%5/5-.24)*TAU)+1)/2);
        for(const st of staves){
          st.float.position.y=st.low+.74+phase*2.6;
          st.wake.position.y=st.float.position.y-.065;st.wake.scale.setScalar(.35+.18*phase);
        }
        wash.position.y=stump.y+(post&&phase>.625?1.41:.19+.67*phase);
        wash.scale.x=.73+.40*phase;wash.scale.z=.54+.22*phase;
        rings.forEach((r,i)=>{r.position.y=wash.position.y+.13+i*.01;r.scale.setScalar(.52+i*.28+.15*phase);});
        if(post && s.time-s.state.mark<4 && s.state.mark>=0)wash.material.opacity=.28;
        else wash.material.opacity=.69;
      });
    }
    function ivoryColor(){return '#d6cbb0';}
    function glowTex(){
      return texture(128,128,(c,w,h)=>{
        const grad=c.createRadialGradient(w/2,h/2,0,w/2,h/2,w/2);
        grad.addColorStop(0,'rgba(255,255,238,1)');grad.addColorStop(.19,'rgba(246,250,219,.88)');
        grad.addColorStop(.39,'rgba(255,235,160,.45)');grad.addColorStop(.7,'rgba(237,201,117,.11)');grad.addColorStop(1,'rgba(200,220,170,0)');
        c.fillStyle=grad;c.fillRect(0,0,w,h);
      });
    }
    function optics(g){
      const p=g.section.sites[0],mid=g.section.mid,eye=offset(p,-1.0,1.0,-1.36);
      // Rim silhouette of the split Fresnel drum; beams terminate on the calibration glass.
      const radius=.31;
      for(let j=0;j<10;j++)rim(offset(eye,0,-.35+j*.077,0),radius-.052*Math.abs(j-4.5)/4.5,j%3? '#a3bcad':brass,Math.PI/2);
      tube(offset(eye,0,-.40,0),.39,.09,brass);tube(offset(eye,0,.39,0),.36,.07,brass);
      tube(offset(eye,0,-.64,0),.14,.46,iron);
      mesh(bulb,emit('#ffe0a2'),eye,.102,.30,.10);
      const target=offset(mid,0,1.65,-2.82);
      stand(offset(target,0,-1.65,0),2.00,1.5);
      bolted(target,3.54,1.40,.12,'#405657');
      for(let i=-7;i<=7;i++)block(offset(target,i*.218,0,.066),.009,i%3?.86:1.0,.008,'#8da09a');
      for(const j of [-.42,0,.42])block(offset(target,0,j,.066),3.29,.012,.009,worn);
      for(const a of [-.16,.16])block(offset(target,a,0,.074),.028,1.18,.013,'#ddc886');
      const textureOfSpot=glowTex();
      const spotMat=local(new T.MeshBasicMaterial({map:textureOfSpot,color:'#ffdd99',transparent:true,blending:T.AdditiveBlending,depthWrite:false,toneMapped:false}));
      const spots=[0,1].map(i=>mesh(plane,spotMat,offset(target,0,0,.092+i*.003),.52,.89));
      const beamMat=local(new T.MeshBasicMaterial({color:'#ecc07b',transparent:true,opacity:.085,blending:T.AdditiveBlending,depthWrite:false,side:T.DoubleSide}));
      const volume=local(new T.ConeGeometry(1,1,16,1,true));
      const beams=[0,1].map(()=>mesh(volume,beamMat,eye));
      animation.push(s=>{
        const strict=s.index===11;
        const targetX=clamp(s.spec.v[0]+(strict?.095*Math.sin(s.time*.49):0));
        const targetY=clamp(s.spec.v[1]+(strict?.095*Math.sin(s.time*.49+1):0));
        const centerX=(s.state.dials[0]-targetX)*2.45;
        const shift=(s.state.dials[1]-targetY)*1.8;
        for(let i=0;i<2;i++){
          const spot=spots[i],beam=beams[i];
          spot.position.x=target.x+centerX+(i?1:-1)*shift;
          spot.scale.set(.41+Math.abs(shift)*.27,.77+Math.abs(shift)*.21,1);
          const vec=eye.clone().sub(spot.position);
          beam.position.copy(eye).lerp(spot.position,.5);
          beam.scale.set(.15,vec.length(),.14);
          beam.quaternion.setFromUnitVectors(up,vec.normalize());
        }
      });
    }
    function signals(g){
      const p=g.section.sites[1],a=offset(p,0,1.51,-1.66);
      stand(offset(p,0,0,-1.66),1.24,1.54);
      bolted(a,1.65,.53,.16,iron);
      const lights=[-.45,0,.45].map(x=>pilot(offset(a,x,.028,.102),hot,.135));
      const prep=pilot(offset(a,.71,.43,.02),cool,.082);
      const p0=offset(g.section.sites[0],-.77,1.22,-1.30);
      tube(p0,.33,.1,grease,Math.PI/2);rim(offset(p0,0,0,.065),.328,brass);
      for(let i=0;i<20;i++){
        const rad=TAU*i/20;
        block(offset(p0,.285*Math.sin(rad),.285*Math.cos(rad),.058),.025,.064,.012,i>=2&&i<=7?'#bbac77':worn,0,0,-rad);
      }
      const hand=new T.Group();section.add(hand);hand.position.copy(offset(p0,0,0,.087));
      mesh(cube,solid(accentColor(0)),v(0,.14,0),.022,.28,.014,hand);
      animation.push(s=>{
        if(s.spec.type==='release'){
          prep(s.state.mode>0);lights.forEach((lamp,i)=>lamp(s.state.mode>=2||s.engaged[i%2]));
          hand.rotation.z=-s.cues.rescue*TAU;
        }else{
          const f=(s.state.age+(s.spec.irregular?.30*Math.sin(s.state.age*.9):0))%s.spec.period/s.spec.period;
          hand.rotation.z=-TAU*f;
          prep(s.state.nextShot===1);lights.forEach((lamp,i)=>lamp(i<s.state.received));
        }
      });
    }
    function accentColor(side){return side?'#90d4c6':'#e9ab65';}
    function keepsake(g){
      const p=offset(g.section.sites[0],.71,.83,-1.05);
      block(offset(p,0,-.39,0),.44,.73,.36,iron);
      block(offset(p,0,-.017,0),.48,.033,.33,worn);
      for(const x of [-.235,.235])block(offset(p,x,.04,0),.022,.095,.33,'#a88a64');
      for(const z of [-.155,.155])block(offset(p,0,.04,z),.48,.095,.02,'#af9676');
      block(offset(p,0,.187,-.234),.46,.34,.016,'#89978a',-.40);
      const screw=new T.Group();section.add(screw);
      mesh(cylinder,solid(steelColor()),v(0,0,0),.020,.11,.020,screw).rotation.z=Math.PI/2;
      mesh(cylinder,solid(brass),v(.052,0,0),.039,.014,.039,screw).rotation.z=Math.PI/2;
      animation.push(s=>{
        screw.position.copy(offset(p,s.state.yes[0]?Math.sin(s.time*4.9)*.13:0,.035,0));
        screw.rotation.x=s.state.yes[0]?Math.sin(s.time*4.9)*4.4:0;
      });
    }
    function fieldStation(g) {
      const job=g.section.field;
      if(!job)return;
      const [left,right]=job.sites.map((site,i)=>offset(site,(i?1:-1)*1.19,0,-1.24));
      const goal=[.28+.16*g.stage,.74-.13*g.stage];
      const kind=g.spec.type;
      if(kind==='cable'){
        const anchor=offset(left,-.77,1.46,0),end=offset(left,.87,1.08,0);
        for(const p of [anchor,end]){rod(p,offset(p,0,-1.74,0),.055,iron);rim(p,.11,brass,0,Math.PI*.5);}
        const chainTop=offset(left,-.09,1.92,0);
        rod(offset(anchor,-.02,.01,0),chainTop,.067,worn);
        const hook=new T.Group();section.add(hook);hook.position.copy(offset(left,0,.50,.04));
        const hookShape=[v(-.065,.30,0),v(-.04,.19,0),v(-.10,.035,0),v(-.05,-.07,0),v(.07,-.08,0),v(.14,.035,0)];
        const hookGeo=local(new T.TubeGeometry(new T.CatmullRomCurve3(hookShape),24,.033,8,false));
        mesh(hookGeo,solid(brass),v(0,0,0),1,1,1,hook);
        const chain=shaft(section,chainTop,hook.position,.018,worn);
        const segments=12;
        const hose=local(new T.InstancedMesh(cylinder,solid('#77573f'),segments));section.add(hose);
        hose.instanceMatrix.setUsage(T.DynamicDrawUsage);hose.frustumCulled=false;
        const control=[anchor.clone(),anchor.clone(),end.clone(),end.clone(),end.clone()];
        const curve=new T.CatmullRomCurve3(control);
        const last=v(0,0,0),next=v(0,0,0),vec=v(0,0,0);
        const drum=new T.Group();section.add(drum);drum.position.copy(offset(right,0,.88,0));
        mesh(cylinder,solid(grease),v(0,0,0),.22,.37,.22,drum).rotation.x=Math.PI/2;
        mesh(torus,solid(brass),v(0,0,.21),.30,.30,.30,drum);
        for(let i=0;i<4;i++){
          const a=TAU*i/4;shaft(drum,v(0,0,.22),v(Math.cos(a)*.27,Math.sin(a)*.27,.22),.026,worn);
        }
        stand(right,.61,.75);
        animation.push(s=>{
          const f=s.field,raised=f.done?1:clamp(f.hold/1.45);
          hook.position.y=left.y+.38+.67*raised;aimShaft(chain,chainTop,offset(hook.position,-.064,.31,0),.016);
          control[2].copy(hook.position).y-=.015;
          const sag=f.done?.08:.31-.18*f.values[1];
          control[1].copy(anchor).lerp(control[2],.5).y-=sag;
          control[3].copy(control[2]).lerp(end,.5).y-=sag;
          curve.getPoint(0,last);
          for(let i=0;i<segments;i++){
            curve.getPoint((i+1)/segments,next);
            vec.subVectors(next,last);transform.scale.set(.039,vec.length()+.012,.039);
            transform.quaternion.setFromUnitVectors(up,vec.normalize());
            transform.position.copy(last).lerp(next,.50);transform.updateMatrix();
            hose.setMatrixAt(i,transform.matrix);last.copy(next);
          }
          hose.instanceMatrix.needsUpdate=true;drum.rotation.z=TAU*(f.done?goal[1]:f.values[1]);
        });
      }else if(kind==='tape'){
        const p=offset(left,0,.78,0);stand(left,.73,.79);
        bolted(p,.90,.51,.13,iron);rod(offset(p,-.29,-.10,.102),offset(p,.29,-.10,.102),.020,brass);
        const contact=new T.Group();section.add(contact);contact.position.copy(offset(p,-.30,-.03,.13));
        shaft(contact,v(0,0,0),v(.47,.045,0),.026,copper);
        const l=pilot(offset(p,.30,.11,.11),hot,.049);
        const r=pilot(offset(right,0,1.07,0),cool,.075);
        animation.push(s=>{
          const phase=(s.time%3.3)/3.3,trig=.24+s.stage*.19;
          const closed=Math.abs(phase-trig)<.115;
          contact.rotation.z=closed?-.19:.39;l(closed);r(s.field.trained||s.field.done);
        });
      }else if(kind==='paper'){
        for(let i=0;i<2;i++){
          const base=i?right:left,p=offset(base,0,.95,0);
          stand(base,.82,.9);bolted(p,1.09,.76,.11,iron);
          const m=local(new T.MeshStandardMaterial({map:chartSheet(!!i,g.stage),transparent:true,alphaTest:.09,side:T.DoubleSide,roughness:.81}));
          const leaf=mesh(plane,m,offset(p,0,0,.070),1.01,.68);
          const hole=pilot(offset(p,-.38,.20,.065),hot,.041);
          animation.push(s=>{
            const level=s.field.done?goal[0]:s.field.values[0],aligned=s.field.done||s.field.active[0]&&Math.abs(level-goal[0])<.10;
            leaf.rotation.x=i?-.045:(level-goal[0])*.56;
            leaf.position.y=p.y+(i?0:(level-goal[0])*.10);hole(aligned);
          });
        }
      }else if(kind==='radio'){
        const base=offset(left,0,.77,0),paper=offset(right,0,.92,0);
        stand(left,.61,.78);tube(base,.35,.14,iron);
        rod(offset(base,-.03,0,0),offset(base,-.12,1.22,.03),.052,worn);
        rod(offset(base,-.12,.96,0),offset(base,.29,.96,.03),.026,brass);
        const pin=mesh(cylinder,solid(brass),offset(base,.18,.18,.069),.036,.22,.036);
        stand(right,.82,.82);bolted(paper,1.16,.78,.12,iron);
        const pages=['呼号页','验收联','更正稿'];
        const lights=pages.map((word,i)=>{
          const loc=offset(paper,.05,.235-i*.225,.080);card(loc,.84,.205,word,'',0);
          return pilot(offset(loc,-.48,0,0),hot,.039);
        });
        const latched=pilot(offset(base,.23,.085,.15),cool,.042);
        animation.push(s=>{
          const f=s.field,clasp=f.done||f.latched[0];pin.position.y=base.y+(clasp?.09:.29);latched(clasp);
          const picked=f.done?s.stage:Math.min(2,Math.floor(f.values[1]*3));lights.forEach((lamp,i)=>lamp(i===picked));
        });
      }else if(kind==='tide'){
        for(const [i,base] of [left,right].entries()){
          const p=offset(base,0,.38,0);
          block(p,.18,1.95,.13,ivoryColor());
          for(let j=0;j<13;j++)block(offset(p,0,j*.14-.83,.072),j%3?.089:.16,.018,.011,j%6>2?iron:'#97493e');
          const collar=mesh(cube,solid(brass),p,.24,.074,.21);
          const alert=pilot(offset(p,.21,.73,.05),cool,.057);
          animation.push(s=>{
            const phase=s.field.latched[0]||s.field.done?.74:s.time%4.8/4.8;
            collar.position.y=p.y+Math.sin((phase-.49)*TAU)*.5;
            alert(i?s.field.latched[0]||s.field.done:Math.abs(phase-.74)<.15);
          });
        }
      }else if(kind==='optic'){
        const observer=g.spec.cross?0:1,operator=1-observer;
        for(const [i,base] of [left,right].entries()){
          const p=offset(base,0,.95,0);stand(base,.65,.85);
          const radius=.33;rim(p,radius,brass);tube(offset(p,0,0,-.035),radius,.072,grease,Math.PI/2);
          const reticle=mesh(cube,emit('#f5c179'),offset(p,0,0,.063),.019,.5,.012);
          block(offset(p,0,0,.053),.014,.56,.012,cool);
          animation.push(s=>{
            const err=s.field.done?0:s.field.values[operator]-goal[operator];
            reticle.rotation.z=i===observer?0:err*1.96;reticle.position.x=p.x+(i===observer?err*.36:0);
          });
        }
      }
    }
    const builders={ride:tug,cable:harborsideCable,power:powerPlant,blackout:powerPlant,
      tape:archiveStrip,paper:lightTable,radio:relay,tide:soundings,post:soundings,optic:optics,rhythm:signals,release:signals,quiet:keepsake};
    function clearSection(){
      animation.length=0;
      if(section){section.removeFromParent();section.clear();}
      temp.forEach(resource=>resource.dispose());temp.clear();
    }
    function build(s) {
      clearSection();
      stage=s.stage;section=new T.Group();root.add(section);staticParts=new Map();
      const buildProps=builders[s.spec.type];
      if(buildProps)buildProps(s);
      fieldStation(s);
      for(const [geometry,data] of staticParts){
        const instances=local(new T.InstancedMesh(geometry,metal,data.length));
        const col=new T.Color();
        data.forEach(([matrix,color],i)=>{instances.setMatrixAt(i,matrix);instances.setColorAt(i,col.set(color));});
        instances.castShadow=false;instances.receiveShadow=true;
        instances.computeBoundingSphere();section.add(instances);
      }
      staticParts=null;
    }
    function update(s,dt) {
      if(stage!==s.stage)build(s);
      for(const fn of animation)fn(s,dt);
    }
    function dispose() {
      clearSection();root.removeFromParent();root.clear();
      common.forEach(resource=>resource.dispose());common.clear();metalPaint.clear();unlit.clear();
    }
    update(session,0);
    return {update,dispose};
  }
  return {create};
})();
