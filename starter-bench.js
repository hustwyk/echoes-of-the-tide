// North Cape starter. Local machine u is toward the operator, v is up, z is along the shaft to port.
const TideStarterBench=(()=>{
  const T=THREE,tau=Math.PI*2,clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
  function create(parent,own){
    const V=(x=0,y=0,z=0)=>new T.Vector3(x,y,z),rot=(x=0,y=0,z=0)=>new T.Euler(x,y,z);
    const machine=new T.Group();machine.name='北岬手搖機 · 乙型';machine.position.set(-3.85,0,12.85);machine.rotation.y=-Math.PI/2;parent.add(machine);
    const frame=(p,x=0,y=0,z=0,name='')=>{const n=new T.Group();n.name=name;n.position.set(x,y,z);p.add(n);return n;};
    const paint=[0x466856,.43,.56,.91],lower=[0x3e5148,.54,.56,.77],rim=[0x654f3f,.66,.55,.68],
      iron=[0x4a4841,.66,.49,.56],bore=[0x302e2a,.48,.68,.49],steel=[0xb2ada0,.81,.30,.19],
      darkSteel=[0x77766b,.79,.39,.34],brass=[0xaa8554,.73,.43,.51],bronze=[0x906d47,.73,.52,.63],
      copper=[0x94613d,.61,.44,.49],cuDark=[0x66402c,.48,.51,.27],black=[0x282928,.21,.72,.06],
      enamel=[0xb5aa83,.32,.54,.56],grip=[0x593e32,.19,.62,.39],red=[0x8e4939,.50,.49,.78],
      glaze=[0xbbb6a4,.13,.31,.12];
    // One repeating original patina atlas: casting scale, flaked islands, oily dirt and fine tool scoring.
    const size=256,data=new Uint8Array(size*size*4);let seed=0x85415666;
    const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
    const grids=[4,8,16,32,64,128].map(n=>{const a=new Float32Array(n*n);for(let j=0;j<a.length;j++)a[j]=random();return {a,n};});
    const noise=(x,y,o)=>{const {a,n}=grids[o],fx=x*n/size,fy=y*n/size,ax=Math.floor(fx),ay=Math.floor(fy);
      const p=fx-ax,q=fy-ay,h=p*p*(3-2*p),k=q*q*(3-2*q),j=ax%n,l=ay%n,j1=(j+1)%n,l1=(l+1)%n;
      return (a[l*n+j]*(1-h)+a[l*n+j1]*h)*(1-k)+(a[l1*n+j]*(1-h)+a[l1*n+j1]*h)*k;};
    for(let y=0;y<size;y++)for(let x=0;x<size;x++){const j=(y*size+x)*4,a=noise(x,y,0),b=noise(x,y,1),c=noise(x,y,2),d=noise(x,y,3),e=noise(x,y,4),f=noise(x,y,5),g=random();
      data[j]=255*(a*.39+b*.26+c*.16+d*.09+e*.06+f*.04);data[j+1]=255*(c*.21+d*.24+e*.25+f*.19+g*.11);
      data[j+2]=255*(.60*f+.28*g+.12*Math.pow(Math.max(0,Math.cos((x+e*.74)*Math.PI*.5)),6));data[j+3]=255;
    }
    const patina=own(new T.DataTexture(data,size,size,T.RGBAFormat));patina.wrapS=patina.wrapT=T.RepeatWrapping;patina.magFilter=T.LinearFilter;patina.minFilter=T.LinearMipmapLinearFilter;patina.generateMipmaps=true;patina.needsUpdate=true;
    const mat=own(new T.MeshStandardMaterial({vertexColors:true,metalness:.65,roughness:.55,envMapIntensity:.92}));
    mat.onBeforeCompile=s=>{
      s.uniforms.capePatina={value:patina};
      s.vertexShader=s.vertexShader.replace('#include <common>','#include <common>\nattribute vec3 alloy; varying vec3 castInfo; varying vec3 castCoord; varying vec3 castN;')
        .replace('#include <begin_vertex>','#include <begin_vertex>\ncastInfo=alloy;castCoord=position;castN=normal;');
      s.fragmentShader=s.fragmentShader.replace('#include <common>','#include <common>\nuniform sampler2D capePatina;varying vec3 castInfo; varying vec3 castCoord; varying vec3 castN;')
        .replace('#include <color_fragment>',`#include <color_fragment>
        vec3 w=pow(abs(normalize(castN)),vec3(4.));w/=max(.0001,w.x+w.y+w.z);
        vec3 p=castCoord*2.05+vec3(.39,.27,.71);
        vec3 rust=texture2D(capePatina,p.yz).rgb*w.x+texture2D(capePatina,p.xz).rgb*w.y+texture2D(capePatina,p.xy).rgb*w.z;
        float flake=smoothstep(.60,.69,rust.r*.66+rust.g*.34)*castInfo.z;
        diffuseColor.rgb*=.81+.26*rust.g+.22*(rust.b-.40);
        diffuseColor.rgb=mix(diffuseColor.rgb,mix(vec3(.093,.038,.022),vec3(.23,.116,.061),rust.g),flake*.86);
        diffuseColor.rgb+=vec3(.015,.014,.012)*max(0.,rust.b-.64)*castInfo.x;`)
        .replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\nroughnessFactor=clamp(castInfo.y+(rust.g-.5)*.22+flake*.24,.17,.94);')
        .replace('#include <metalnessmap_fragment>','#include <metalnessmap_fragment>\nmetalnessFactor=castInfo.x*(1.-flake*.77);');
    };
    mat.customProgramCacheKey=()=>'cape-starter-foundry-1';
    // Stamp castings into one retained mesh per moving subassembly; vertex finish controls the PBR response.
    const batches=new Map(),dummy=new T.Object3D(),nt=new T.Matrix3(),v=V(),n=V(),shade=new T.Color(),dir=V();
    const geom={box:new T.BoxGeometry(1,1,1),cyl:new T.CylinderGeometry(1,1,1,32),pin:new T.CylinderGeometry(1,1,1,16),bolt:new T.CylinderGeometry(1,1,1,6),ball:new T.SphereGeometry(1,20,12)};
    function put(p,g,f,pos=[0,0,0],scale=[1,1,1],r=[0,0,0],q=null){
      let dest=batches.get(p);if(!dest){dest={pos:[],norm:[],color:[],alloy:[],idx:[]};batches.set(p,dest);}
      const i0=dest.pos.length/3;shade.setHex(f[0]);dummy.position.fromArray(pos);dummy.scale.fromArray(scale);dummy.rotation.set(...r);if(q)dummy.quaternion.copy(q);dummy.updateMatrix();nt.getNormalMatrix(dummy.matrix);
      const a=g.attributes.position,b=g.attributes.normal;for(let j=0;j<a.count;j++){v.fromBufferAttribute(a,j).applyMatrix4(dummy.matrix);n.fromBufferAttribute(b,j).applyMatrix3(nt).normalize();
        dest.pos.push(v.x,v.y,v.z);dest.norm.push(n.x,n.y,n.z);dest.color.push(shade.r,shade.g,shade.b);dest.alloy.push(f[1],f[2],f[3]);}
      const idx=g.index?.array;if(idx)for(const i of idx)dest.idx.push(i0+i);else for(let i=0;i<a.count;i++)dest.idx.push(i0+i);
    }
    function box(p,f,x,y,z,w,h,d,rz=0){put(p,geom.box,f,[x,y,z],[w,h,d],[0,0,rz]);}
    function pin(p,f,x,y,z,r,d,hex=false){put(p,hex?geom.bolt:r<.075?geom.pin:geom.cyl,f,[x,y,z],[r,d,r],[Math.PI/2,0,0]);}
    function ball(p,f,x,y,z,ax,ay,az){put(p,geom.ball,f,[x,y,z],[ax,ay,az]);}
    function rod(p,f,a,b,r,kind=geom.pin){
      const start=V(...a),end=V(...b);dir.copy(end).sub(start);const len=dir.length();if(!len)return;
      put(p,kind,f,start.lerp(end,.5).toArray(),[r,len,r],[0,0,0],new T.Quaternion().setFromUnitVectors(V(0,1,0),dir.normalize()));
    }
    function line(p,f,pts,r){const path=new T.CatmullRomCurve3(pts.map(a=>V(...a)));const g=new T.TubeGeometry(path,Math.max(12,pts.length*4),r,8,false);put(p,g,f);g.dispose();}
    function section(p,f,profile,x,y,z,segments=0){
      if(!segments)segments=Math.round(17+80*Math.sqrt(Math.max(...profile.map(a=>a[0]))));
      const g=new T.LatheGeometry(profile.map(([r,d])=>new T.Vector2(r,d)),segments);
      put(p,g,f,[x,y,z],[1,1,1],[Math.PI/2,0,0]);g.dispose();
    }
    function sleeve(p,f,x,y,z,ri,ro,d,edge=.003){section(p,f,[[ri,-d/2],[ro-edge,-d/2],[ro,-d/2+edge],[ro,d/2-edge],[ro-edge,d/2],[ri,d/2],[ri,-d/2]],x,y,z);}
    function extrude(p,f,shape,z,thick,bev=.004,x=0,y=0,rz=0){
      const g=new T.ExtrudeGeometry(shape,{depth:thick,curveSegments:10,bevelEnabled:bev>0,bevelSegments:2,bevelSize:bev,bevelThickness:bev});
      put(p,g,f,[x,y,z],[1,1,1],[0,0,rz]);g.dispose();
    }
    function outline(points){const sh=new T.Shape();sh.moveTo(...points[0]);for(let i=1;i<points.length;i++)sh.lineTo(...points[i]);sh.closePath();return sh;}
    function rounded(x,y,w,h,r){const a=x-w/2,b=y-h/2,c=x+w/2,d=y+h/2;const s=new T.Shape();s.moveTo(a+r,b);s.lineTo(c-r,b);s.quadraticCurveTo(c,b,c,b+r);s.lineTo(c,d-r);s.quadraticCurveTo(c,d,c-r,d);s.lineTo(a+r,d);s.quadraticCurveTo(a,d,a,d-r);s.lineTo(a,b+r);s.quadraticCurveTo(a,b,a+r,b);s.closePath();return s;}
    function bed(p,f,x,y,z,w,h,d,r){
      const g=new T.ExtrudeGeometry(rounded(0,0,w-.017,d-.017,r),{depth:h-.014,curveSegments:5,bevelEnabled:true,bevelSize:.0085,bevelThickness:.007,bevelSegments:2});
      put(p,g,f,[x,y-h/2+.007,z],[1,1,1],[-Math.PI/2,0,0]);g.dispose();
    }
    function footing(x,z,w,d){bed(machine,lower,x,.082,z,w,.124,d,.033);
      for(const side of [-1,1])for(const end of [-1,1]){
        const u=x+side*(w/2-.044),a=z+end*(d/2-.053);rod(machine,darkSteel,[u,.141,a],[u,.151,a],.033);
        rod(machine,iron,[u,.149,a],[u,.170,a],.025,geom.bolt);rod(machine,steel,[u,.17,a],[u,.177,a],.011);
      }}
    const F={x:-1.17,y:.984},H={x:-.444,y:.552},AR=.283,BASE=.243,teeth=22,pitch=tau/teeth;
    const motor=frame(machine,F.x,F.y,0,'發電機座');const rotor=frame(motor,0,0,0,'啟動側主軸 · 飛輪'),armature=frame(motor,0,0,0,'燈機側電樞');
    const lever=frame(machine,H.x,H.y,0,'起動搖桿'),rocker=frame(motor,0,0,.747,'棘爪搖臂'),pawl=frame(rocker,.252,.292,.106,'驅動棘爪');
    const truck=frame(machine,0,0,.757,'鍛鋼牽桿'),shift=frame(motor,0,0,0,'離合滑套');
    // Bedplate, mortised casting webs, levelling feet and bolted bearing caps.
    for(const u of [-1.68,-.59])footing(u,-.005,.37,1.91);
    bed(machine,lower,-1.134,.176,-.012,1.53,.104,1.82,.072);
    for(const z of [-.787,.392]){
      const sh=rounded(-1.155,.48,1.31,.54,.068);
      const hole=new T.Path();hole.moveTo(-1.64,.35);hole.lineTo(-.68,.35);hole.quadraticCurveTo(-.72,.50,-.88,.52);hole.lineTo(-1.45,.52);hole.quadraticCurveTo(-1.58,.51,-1.64,.35);sh.holes.push(hole);
      extrude(machine,paint,sh,z,.115,.017);
      for(const side of [-1,1]){const x=F.x+side*.405;extrude(machine,lower,outline([[x-.11,.235],[x+.11,.235],[x,.66],[x-.041,.66]]),z-.052,.165,.012);}
    }
    // Armature, end cage and varnished field winding under the ventilation openings.
    section(motor,paint,[[.12,-.82],[.361,-.80],[.454,-.72],[.469,-.60],[.47,-.04],[.451,.051],[.43,.144],[.354,.144]],0,0,0);
    for(const a of [-.686,-.635,-.57,-.50,-.43,-.36,-.29,-.22,-.15,-.08]){
      sleeve(motor,lower,0,0,a,.454,.487,.017,.004);
    }
    for(let i=0;i<16;i++){
      const a=i*tau/16;rod(motor,i%4===0?darkSteel:paint,[.46*Math.cos(a),.46*Math.sin(a),-.69],[.46*Math.cos(a),.46*Math.sin(a),.046],i%4===0?.012:.017);
      if(i%2===0){pin(motor,bronze,.428*Math.cos(a),.428*Math.sin(a),.145,.025,.030,true);pin(motor,iron,.428*Math.cos(a),.428*Math.sin(a),-.762,.025,.035,true);}
    }
    sleeve(motor,lower,0,0,.107,.371,.47,.074,.013);
    pin(armature,cuDark,0,0,.112,.325,.17);
    for(let j=0;j<28;j++){const a=tau*j/28,cu=j%4===0?cuDark:copper;
      rod(armature,cu,[.303*Math.cos(a),.303*Math.sin(a),.066],[.304*Math.cos(a+.10),.304*Math.sin(a+.10),.18],.023);}
    const frontArm=new T.Shape();frontArm.moveTo(.103,-.042);frontArm.quadraticCurveTo(.254,-.06,.376,-.102);frontArm.lineTo(.395,-.045);frontArm.quadraticCurveTo(.268,-.006,.118,.035);frontArm.closePath();
    for(let j=0;j<7;j++)extrude(motor,paint,frontArm,.168,.047,.008,0,0,tau*j/7);
    sleeve(motor,lower,0,0,.161,.374,.429,.071,.012);pin(motor,paint,0,0,.177,.132,.162);sleeve(motor,brass,0,0,.267,.065,.123,.035,.004);
    pin(rotor,darkSteel,0,0,.571,.066,.51);pin(armature,darkSteel,0,0,.216,.064,.147);
    sleeve(armature,bronze,0,0,.276,.075,.143,.023,.004);sleeve(armature,bore,0,0,.291,.086,.14,.006,.001);
    // Separate journal support keeps the heavy wheel just outside the bearing.
    const pedestal=outline([[F.x-.22,.245],[F.x+.22,.245],[F.x+.14,.397],[F.x+.087,.885],[F.x+.127,.936],[F.x+.13,1.004],[F.x-.127,1.004],[F.x-.138,.917],[F.x-.085,.872],[F.x-.13,.397]]);
    extrude(machine,paint,pedestal,.335,.162,.012);pin(motor,bronze,0,0,.419,.114,.176);
    box(motor,lower,0,.070,.417,.29,.071,.191);for(const k of [-1,1])rod(motor,darkSteel,[k*.114,.106,.419],[k*.114,.13,.419],.024,geom.bolt);
    // The flywheel's broad belt face has turned shoulders. Each spoke is a curved, filleted casting.
    section(rotor,rim,[[.609,.501],[.666,.501],[.690,.519],[.696,.544],[.696,.636],[.689,.651],[.67,.659],[.606,.659],[.590,.641],[.590,.526],[.609,.501]],0,0,0,108);
    sleeve(rotor,darkSteel,0,0,.588,.692,.698,.091,.002);
    sleeve(rotor,darkSteel,0,0,.658,.640,.680,.008,.0017);sleeve(rotor,steel,0,0,.664,.666,.672,.003,.0005);
    sleeve(rotor,bore,0,0,.660,.637,.642,.006,.001);
    for(let j=0;j<7;j++){
      const sh=new T.Shape();sh.moveTo(.12,-.071);sh.bezierCurveTo(.193,-.059,.276,.052,.384,.091);
      sh.bezierCurveTo(.451,.116,.568,.114,.605,.106);sh.lineTo(.624,.187);
      sh.bezierCurveTo(.482,.215,.350,.190,.261,.135);sh.bezierCurveTo(.192,.091,.171,.055,.112,.053);sh.closePath();
      extrude(rotor,paint,sh,.548,.061,.012,0,0,j*tau/7);
    }
    section(rotor,lower,[[.057,.495],[.127,.495],[.169,.529],[.185,.549],[.182,.614],[.160,.635],[.149,.653],[.106,.662],[.057,.662]],0,0,0);
    sleeve(rotor,bronze,0,0,.665,.068,.108,.031,.005);
    for(let j=0;j<7;j++){const a=j*tau/7;pin(rotor,darkSteel,.135*Math.cos(a),.135*Math.sin(a),.652,.023,.030,true);}
    const marker=outline([[.628,-.018],[.684,-.018],[.684,.006],[.625,.006]]);
    extrude(rotor,enamel,marker,.657,.002,0);
    const gearShape=new T.Shape(),knots=[[0,BASE],[.13,BASE],[.23,AR],[.32,AR],[1,BASE]],profile=[];
    for(let j=0;j<teeth;j++)for(let h=0;h<4;h++){const a=(j+knots[h][0])*pitch,rr=knots[h][1],xx=rr*Math.cos(a),yy=rr*Math.sin(a);profile.push({x:(rr+.0032)*Math.cos(a),y:(rr+.0032)*Math.sin(a)});if(!j&&!h)gearShape.moveTo(xx,yy);else gearShape.lineTo(xx,yy);}
    gearShape.closePath();const aperture=new T.Path();aperture.absarc(0,0,.079,0,tau,true);gearShape.holes.push(aperture);
    extrude(rotor,iron,gearShape,.820,.034,.002);
    sleeve(rotor,darkSteel,0,0,.858,.086,.169,.011,.002);
    sleeve(rotor,darkSteel,0,0,.856,.216,.240,.004,.001);
    const toothLand=outline([[.245*Math.cos(.163*pitch),.245*Math.sin(.163*pitch)],[.282*Math.cos(.230*pitch),.282*Math.sin(.230*pitch)],[.282*Math.cos(.312*pitch),.282*Math.sin(.312*pitch)],[.25*Math.cos(.252*pitch),.25*Math.sin(.252*pitch)]]);
    for(let j=0;j<teeth;j++)extrude(rotor,j%5===1?steel:darkSteel,toothLand,.855,.001,0,0,0,j*pitch);
    for(let j=0;j<5;j++){const a=tau*j/5;pin(rotor,bronze,.130*Math.cos(a),.130*Math.sin(a),.873,.017,.025,true);}
    pin(rotor,steel,0,0,.802,.060,.251);pin(rotor,iron,0,0,.912,.072,.028,true);pin(rotor,darkSteel,0,0,.934,.040,.022);
    // Crank cross-shaft; both hands grasp the same steel shaft between shoulders.
    for(const z of [-.37,.39]){
      const sh=outline([[H.x-.14,.19],[H.x+.155,.19],[H.x+.125,.30],[H.x+.063,.54],[H.x-.075,.555],[H.x-.082,.33]]);
      extrude(machine,lower,sh,z-.032,.071,.008);pin(machine,bronze,H.x,H.y,z,.086,.119);pin(machine,darkSteel,H.x,H.y,z,.066,.140);
    }
    pin(lever,iron,0,0,.162,.041,1.375);
    const h=.633;
    for(const z of [-.248,.248]){
      const sh=new T.Shape();sh.moveTo(-.064,-.035);sh.quadraticCurveTo(-.087,.049,-.045,.129);sh.lineTo(-.027,.489);sh.quadraticCurveTo(-.033,.56,-.044,.621);sh.quadraticCurveTo(-.032,.688,.025,.666);
      sh.lineTo(.045,.628);sh.lineTo(.024,.460);sh.lineTo(.036,.104);sh.quadraticCurveTo(.081,.068,.069,-.021);sh.quadraticCurveTo(.029,-.064,-.064,-.035);
      extrude(lever,red,sh,z-.012,.024,.004);pin(lever,darkSteel,0,0,z,.077,.056);
    }
    pin(lever,darkSteel,0,h,0,.022,.674);
    for(const sign of [-1,1]){
      const a=sign*.158;
      section(lever,grip,[[.013,-.104],[.030,-.101],[.034,-.086],[.032,-.067],[.031,-.034],[.034,.011],[.034,.047],[.031,.084],[.026,.097],[.013,.098]],0,h,a,40);
      for(const n of [-.076,-.067,-.058,.059,.068,.077])sleeve(lever,bore,0,h,a+n,.028,.032,.0027,.0004);
      for(const n of [-.103,.101])pin(lever,brass,0,h,a+n,.027,.009);
      pin(lever,darkSteel,0,h,sign*.293,.037,.025);
    }
    const pegs=[frame(lever,0,h,.153),frame(lever,0,h,-.153)],handVec=[V(),V()];
    // A parallel four-bar carries the lever stroke to the starter collar. Both end eyes remain pinned.
    const ux=.161,uy=.145,dx=F.x-H.x,dy=F.y-H.y;
    const driverShape=outline([[-.054,-.045],[.001,-.065],[.180,.093],[.215,.14],[.187,.193],[.152,.186],[.080,.117],[-.06,.042]]);
    extrude(lever,red,driverShape,.682,.044,.006);pin(lever,bronze,ux,uy,.726,.043,.068);
    sleeve(rocker,bronze,0,0,0,.075,.108,.063,.005);extrude(rocker,lower,driverShape,-.014,.048,.006);
    const carrier=outline([[-.079,-.03],[-.051,-.069],[.04,-.063],[.271,.210],[.294,.28],[.257,.326],[.205,.325],[.166,.259],[.019,.111],[-.066,.059]]);
    extrude(rocker,lower,carrier,-.015,.039,.007);pin(rocker,bronze,.252,.292,.063,.046,.128);
    const dist=Math.hypot(dx,dy),az=Math.atan2(dy,dx);
    const tie=rounded(dist/2,0,dist-.035,.045,.021);
    extrude(truck,darkSteel,tie,-.016,.025,.006,0,0,az);
    for(const [u,v] of [[0,0],[dx,dy]]){
      sleeve(truck,bronze,u,v,0,.022,.047,.052,.004);pin(truck,darkSteel,u,v,.035,.025,.028,true);pin(truck,steel,u,v,.049,.011,.003);
    }
    const toeProfile=[[-.226,-.012],[-.209,-.001],[-.185,.002],[-.101,-.005],[-.025,-.029],[.022,-.026]];
    const tooth=outline([[-.226,-.012],[-.216,.012],[-.171,.042],[-.061,.044],[-.023,.058],[.025,.049],[.038,.012],...toeProfile.slice(1).reverse()]);
    extrude(pawl,bronze,tooth,-.021,.037,.003);pin(pawl,darkSteel,0,0,.019,.023,.025,true);
    // A leaf spring holds the toe against the moving saw teeth, allowing an audible overrun in play.
    const leaf=outline([[.305,.130],[.324,.141],[.307,.229],[.262,.314],[.211,.342],[.159,.345],[.157,.339],[.213,.331],[.253,.303],[.293,.223]]);
    extrude(rocker,darkSteel,leaf,.115,.012,.0015);pin(rocker,darkSteel,.31,.142,.11,.017,.052);
    sleeve(shift,darkSteel,0,0,.349,.065,.14,.012,.002);sleeve(shift,brass,0,0,.365,.063,.102,.032,.004);
    for(const a of [.365,.381])sleeve(shift,darkSteel,0,0,a,.093,.109,.005,.001);
    // Oil cup, porcelain terminals, cloth-braided leads, brass unions and inspection card.
    for(const z of [-.67,.366]){
      const a=F.x+.02,y=z<0?1.437:1.091;
      rod(machine,brass,[a,y,z],[a,y+.101,z],.013);rod(machine,bronze,[a,y+.085,z],[a,y+.120,z],.033);
      ball(machine,brass,a,y+.113,z,.039,.019,.039);rod(machine,darkSteel,[a,y+.128,z],[a,y+.144,z],.011);
    }
    box(machine,lower,F.x+.085,1.455,-.30,.32,.145,.30);box(machine,paint,F.x+.085,1.525,-.30,.343,.038,.32);
    for(let j=0;j<2;j++){const a=-.357+j*.111,x=F.x+.082;for(let k=0;k<4;k++)rod(machine,glaze,[x,1.545+k*.012,a],[x,1.551+k*.012,a],.027-k*.001);
      rod(machine,brass,[x,1.553,a],[x,1.608,a],.012);
      line(machine,black,[[x,1.61,a],[x-.09,1.626,a],[x-.232,1.507,a-.018],[x-.43,1.19,a-.046],[x-.52,.55,a-.069],[x-.47,.255,a-.16]],.012);
    }
    box(machine,lower,-.834,.250,.785,.516,.112,.113);
    const foot=frame(machine,-.834,.269,.846,'製造銘板');
    box(foot,bronze,0,0,0,.455,.144,.016);const c=document.createElement('canvas');c.width=704;c.height=208;const ctx=c.getContext('2d');
    if(ctx){ctx.fillStyle='#484a3a';ctx.fillRect(0,0,c.width,c.height);ctx.strokeStyle='#bea478';ctx.lineWidth=5;ctx.strokeRect(11,11,682,186);
      ctx.fillStyle='#dfc997';ctx.textAlign='center';ctx.font='bold 62px serif';ctx.fillText('北 岬 機 械 廠',352,83);ctx.font='37px serif';ctx.fillText('乙式手搖機　 Nº 0271',352,151);
      const tex=own(new T.CanvasTexture(c));tex.colorSpace=T.SRGBColorSpace;tex.anisotropy=4;
      const plaque=new T.Mesh(own(new T.PlaneGeometry(.448,.138)),own(new T.MeshStandardMaterial({map:tex,roughness:.48,metalness:.41})));plaque.position.z=.009;foot.add(plaque);}
    for(const x of [-.204,.204])for(const y of [-.049,.049])pin(foot,brass,x,y,.011,.008,.009);
    for(const [p,b] of batches){
      const g=own(new T.BufferGeometry());g.setAttribute('position',new T.Float32BufferAttribute(b.pos,3));g.setAttribute('normal',new T.Float32BufferAttribute(b.norm,3));
      g.setAttribute('color',new T.Float32BufferAttribute(b.color,3));g.setAttribute('alloy',new T.Float32BufferAttribute(b.alloy,3));g.setIndex(b.idx);g.computeBoundingSphere();
      const mesh=new T.Mesh(g,mat);mesh.receiveShadow=true;mesh.castShadow=true;p.add(mesh);
    }
    for(const g of Object.values(geom))g.dispose();batches.clear();
    // Compute contact between the tooth flanks and the underside of the forged pawl.
    // A crest can lift the heel before the tip reaches the root. Both are tested.
    const gx=new Float64Array(profile.length+1),gy=new Float64Array(profile.length+1),near=new Uint8Array(profile.length);
    function contactAngle(relative){
      const c=Math.cos(relative),s=Math.sin(relative),count=profile.length;
      for(let j=0;j<count;j++){const p=profile[j];gx[j]=p.x*c-p.y*s-.252;gy[j]=p.x*s+p.y*c-.292;}
      gx[count]=gx[0];gy[count]=gy[0];let n=0;
      for(let j=0;j<count;j++)if(Math.max(gy[j],gy[j+1])>-.118&&Math.max(gx[j],gx[j+1])>-.244&&Math.min(gx[j],gx[j+1])<.043)near[n++]=j;
      const struck=a=>{
        const ca=Math.cos(a),sa=Math.sin(a);
        for(let j=0;j<n;j++){
          const i=near[j],x0=gx[i]*ca+gy[i]*sa,y0=gy[i]*ca-gx[i]*sa,x1=gx[i+1]*ca+gy[i+1]*sa,y1=gy[i+1]*ca-gx[i+1]*sa;
          for(let k=1;k<toeProfile.length;k++){
            const l=toeProfile[k-1],r=toeProfile[k],dx=r[0]-l[0];
            const xmin=Math.max(l[0],Math.min(x0,x1)),xmax=Math.min(r[0],Math.max(x0,x1));if(xmin>xmax)continue;
            const pawlSlope=(r[1]-l[1])/dx,ex=x1-x0;
            if(Math.abs(ex)<1e-8){if(Math.max(y0,y1)>=l[1]+(xmin-l[0])*pawlSlope-.001) return true;continue;}
            const gearSlope=(y1-y0)/ex,xx=gearSlope>pawlSlope?xmax:xmin;
            if(y0+(xx-x0)*gearSlope>=l[1]+(xx-l[0])*pawlSlope-.001)return true;
          }
        }
        return false;
      };
      let lo=-.23,hi=.37;
      for(let j=0;j<11;j++){const a=(lo+hi)*.5;if(struck(a))hi=a;else lo=a;}
      return lo;
    }
    function update(r,t){
      if(!r)return;const crank=.08-.61*clamp(r.stroke||0),spin=-(r.spin||0);
      lever.rotation.z=rocker.rotation.z=crank;rotor.rotation.z=spin;armature.rotation.z=-(r.drivenSpin??(r.linked?r.spin:0)??0);
      const c=Math.cos(crank),s=Math.sin(crank);truck.position.x=H.x+ux*c-uy*s;truck.position.y=H.y+ux*s+uy*c;
      pawl.rotation.z=contactAngle(spin-crank);
      shift.position.z=-.048*clamp(r.shift??(r.linked?1:0));shift.rotation.z=spin;
    }
    function shot(aspect=.82){
      const d=Math.max(1,Math.min(1.35,.80/Math.max(.46,aspect))),at=[-3.85,.99,12.02];
      return {eye:[at[0]-2.51*d,at[1]+1.22*d,at[2]+1.99*d],at,fov:44.5};
    }
    function hands(){for(let i=0;i<2;i++)pegs[i].getWorldPosition(handVec[i]);return handVec;}
    update({},0);return {root:machine,update,hands,shot,dispose(){machine.removeFromParent();}};
  }
  return {create};
})();
