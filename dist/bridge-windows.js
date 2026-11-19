// A cut-through wheelhouse for the live Hai Yan. The measuring edge is the
// forward starboard jamb at (1.626, 4.12, -3.96) in the original ship frame.
const TideBridgeWindows=(()=>{
  'use strict';
  function create(ship){
    const T=THREE,root=new T.Group(),owned=new Set(),keep=a=>(owned.add(a),a),TAU=Math.PI*2;
    root.name='海雁号 · 航海驾驶室';ship.add(root);
    const pt=new T.Vector3(),norm=new T.Vector3(),a=new T.Vector3(),b=new T.Vector3(),c=new T.Color(),pale=new T.Color(),transform=new T.Object3D(),nm=new T.Matrix3();
    const boxShape=new T.BoxGeometry(),ball=new T.SphereGeometry(1,20,14),pipe=new T.CylinderGeometry(1,1,1,10),finePipe=new T.CylinderGeometry(1,1,1,8);
    const bead=new T.SphereGeometry(1,7,5),fitting=new T.SphereGeometry(1,11,7);
    const geometries=[boxShape,ball,bead,fitting,pipe,finePipe],axisY=new T.Vector3(0,1,0);
    const apron='#b0b7a9',enamel='#c9cbb8',seam='#6d776d',steel='#7a857b',rubber='#354641';
    const originalShell=ship.getObjectByName('wheelhouseShell');
    const originalVisible=originalShell?.visible;
    if(originalShell)originalShell.visible=false;
    let disposed=false;
    function random(x,y){let h=Math.imul(x+15,1597334677)^Math.imul(y+73,3812015801);h=Math.imul(h^(h>>>15),1103515245);return(h>>>0)/4294967295;}
    // Local seamless paint grain with restrained vertical salt streaks. This
    // texture is generated once, shared by the entire exposed surround.
    function makePaint(){
      const n=192,pix=new Uint8Array(n*n*4);
      for(let y=0;y<n;y++)for(let x=0;x<n;x++){
        const u=x*TAU/n,v=y*TAU/n,g=random(x,y);
        const film=Math.pow(Math.max(0,Math.cos(14*u+.27*Math.cos(v*2)+.20*Math.sin(7*u+v))),9)*(.5+.5*Math.sin(v+3*u))**2;
        const shade=235+g*12+3.5*Math.cos(u*6+v*4)-19*film;
        pix.set([shade,shade,shade*.978,255],4*(y*n+x));
      }
      const m=keep(new T.DataTexture(pix,n,n));m.generateMipmaps=true;m.minFilter=T.LinearMipmapLinearFilter;m.magFilter=T.LinearFilter;m.wrapS=m.wrapT=T.RepeatWrapping;m.colorSpace=T.SRGBColorSpace;m.needsUpdate=true;m.anisotropy=4;return m;
    }
    const paint=makePaint();
    const shell=keep(new T.MeshStandardMaterial({vertexColors:true,map:paint,roughness:.53,metalness:.18}));
    const inside=keep(new T.MeshStandardMaterial({vertexColors:true,roughness:.70,metalness:.05}));
    const person=keep(new T.MeshStandardMaterial({vertexColors:true,roughness:.79}));
    const localCamera=new T.Vector3(),shipInverse=new T.Matrix4(),shipWorld=new T.Matrix4();
    function interiorShader(mat,avoid){
      mat.onBeforeCompile=sh=>{
        sh.uniforms.uCabinInv={value:shipInverse};sh.uniforms.uCabinWorld={value:shipWorld};
        sh.vertexShader=sh.vertexShader.replace('#include <common>',`#include <common>
          uniform mat4 uCabinInv,uCabinWorld;varying vec3 roomPoint;varying float locShade;attribute float cabinLight;`)
          .replace('#include <project_vertex>',`vec4 workWorld=modelMatrix*vec4(transformed,1.0);vec3 localC=(uCabinInv*vec4(cameraPosition,1.)).xyz;
            roomPoint=(uCabinInv*workWorld).xyz;locShade=cabinLight;vec3 travel=normalize(roomPoint-localC);
            // A flat slab has two interfaces. The emerging ray is parallel
            // to the incident ray, with a lateral displacement of a few mm.
            vec3 face=abs(localC.x/1.61)>abs((localC.z+2.45)/1.74)?vec3(sign(localC.x),0.,0.):vec3(0.,0.,sign(localC.z+2.45));
            if((abs(localC.x)>1.62||abs(localC.z+2.45)>1.80)&&dot(travel,face)<-.06){
              vec3 through=refract(travel,face,1./1.515);
              vec3 offset=.0076*(through/max(.04,-dot(through,face))-travel/max(.04,-dot(travel,face)));
              workWorld.xyz-=mat3(uCabinWorld)*offset;
            }
            vec4 mvPosition=viewMatrix*workWorld;gl_Position=projectionMatrix*mvPosition;`);
        sh.fragmentShader=sh.fragmentShader.replace('#include <common>',`#include <common>
          varying vec3 roomPoint;varying float locShade;uniform mat4 uCabinInv;`)
          .replace('#include <opaque_fragment>',`vec3 lampDirection=roomPoint-vec3(1.10,4.245,-2.54);
            float pool=exp(-3.6*length(lampDirection))*(1.-smoothstep(-.29,.14,lampDirection.y));
            vec3 reading=roomPoint-vec3(1.05,4.35,-3.34);
            float faceLight=exp(-1.65*length(reading));
            outgoingLight=outgoingLight*.77+diffuseColor.rgb*(vec3(.34,.23,.135)*faceLight+vec3(.99,.58,.24)*pool+vec3(.13,.092,.067))*locShade;
            outgoingLight+=diffuseColor.rgb*max(0.,locShade-1.6)*.83;
            ${avoid?'if(distance((uCabinInv*vec4(cameraPosition,1.)).xyz,vec3(.98,4.12,-3.52))<.40)discard;':''}
            #include <opaque_fragment>`);
      };mat.customProgramCacheKey=()=>avoid?'wheelhouse-captain-36':'wheelhouse-interior-36';
    }
    interiorShader(inside,false);interiorShader(person,true);
    const groups=[];
    function batch(parent,material,label){
      const p=[],n=[],uv=[],col=[],ix=[],power=[];
      const append=(shape,tint,x,y,z,sx,sy,sz,rx=0,ry=0,rz=0,bright=1)=>{
        transform.position.set(x,y,z);transform.rotation.set(rx,ry,rz);transform.scale.set(sx,sy,sz);transform.updateMatrix();nm.getNormalMatrix(transform.matrix);
        c.set(tint);const at=p.length/3,pa=shape.attributes.position,na=shape.attributes.normal,ua=shape.attributes.uv;
        for(let i=0;i<pa.count;i++){
          pt.fromBufferAttribute(pa,i).applyMatrix4(transform.matrix);norm.fromBufferAttribute(na,i).applyMatrix3(nm).normalize();
          p.push(pt.x,pt.y,pt.z);n.push(norm.x,norm.y,norm.z);
          if(material===shell){const side=Math.abs(norm.x)>.65,top=Math.abs(norm.y)>.65;uv.push((side?pt.z:pt.x)*2.6,(top?pt.z:pt.y)*2.6);}
          else uv.push(ua?ua.getX(i):0,ua?ua.getY(i):0);
          const shade=shape.attributes.color,face=shade?1:bright<.6?.88:1;
          col.push(c.r*(shade?shade.getX(i):face),c.g*(shade?shade.getY(i):face),c.b*(shade?shade.getZ(i):face));power.push(bright);
        }
        const idx=shape.index?.array;if(idx){for(const i of idx)ix.push(i+at);}else for(let i=0;i<pa.count;i++)ix.push(i+at);
      };
      const box=(x,y,z,w,h,d,color,rx=0,ry=0,rz=0,l=1)=>append(boxShape,color,x,y,z,w,h,d,rx,ry,rz,l);
      const oval=(x,y,z,rx,ry,rz,color,tx=0,ty=0,tz=0,l=1)=>{
        const radius=Math.max(rx,ry,rz),shape=radius<.012 ? bead : radius<.050 ? fitting : ball;
        append(shape,color,x,y,z,rx,ry,rz,tx,ty,tz,l);
      };
      const rod=(x,y,z,xx,yy,zz,rad,color,l=1)=>{
        a.set(xx-x,yy-y,zz-z);const len=a.length();transform.quaternion.setFromUnitVectors(axisY,a.normalize());
        append(rad<.013?finePipe:pipe,color,(x+xx)/2,(y+yy)/2,(z+zz)/2,rad,len,rad,transform.rotation.x,transform.rotation.y,transform.rotation.z,l);
      };
      const flush=()=>{
        const g=keep(new T.BufferGeometry());g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('normal',new T.Float32BufferAttribute(n,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setAttribute('color',new T.Float32BufferAttribute(col,3));
        if(material!==shell)g.setAttribute('cabinLight',new T.Float32BufferAttribute(power,1));g.setIndex(ix);g.computeBoundingSphere();
        const mesh=new T.Mesh(g,material);mesh.name=label;mesh.castShadow=material===shell;mesh.receiveShadow=material===shell;parent.add(mesh);groups.push(mesh);return mesh;
      };return {box,oval,rod,append,flush};
    }
    const ext=batch(root,shell,'驾驶楼外板、窗沿和滴水檐'),room=batch(root,inside,'驾驶台内板、海图灯和舵机');
    // Steel sides and a low sole leave the interior hollow below the sill.
    // The old solid lid would otherwise cut through the seated operator.
    ext.box(0,3.181,-2.40,2.96,.142,3.30,apron);
    for(const side of [-1,1]){
      ext.box(side*1.442,3.492,-2.40,.076,.554,3.30,apron);
      ext.box(0,3.492,-2.40+side*1.612,2.88,.554,.076,apron);
      ext.box(side*1.549,3.76,-2.46,.082,.18,3.43,enamel);
      ext.box(0,3.76,-2.46+side*1.674,3.02,.18,.082,enamel);
    }
    ext.box(0,4.457,-2.46,3.18,.106,3.43,enamel);
    ext.box(0,4.065,-.775,3.18,.69,.060,enamel);
    // Long recessed window channels. The 1.626 m outer face and the middle
    // of the 10 mm bright return are the gameplay's actual ranging mark.
    for(const s of [-1,1]){
      ext.box(s*1.551,4.122,-4.079,.076,.582,.195,enamel);
      ext.box(s*1.551,4.122,-.904,.076,.582,.318,enamel);
      ext.box(s*1.551,4.122,-3.015,.076,.582,.131,enamel);
      ext.box(s*1.551,4.122,-2.005,.076,.582,.131,enamel);
      ext.box(s*1.589,4.429,-2.50,.082,.030,3.14,'#9fa697');
      ext.box(s*1.620,4.442,-2.50,.12,.018,3.17,'#d1c9aa',0,0,-s*.09);
      ext.box(s*1.596,3.827,-2.50,.074,.038,3.14,'#889184',0,0,s*.18);
      for(let j=0;j<3;j++){
        const z=-3.52+1.01*j;
        for(const side of [-1,1]){
          const xz=z+side*.44;
          ext.box(s*1.590,4.12,xz,.065,.577,.044,'#8e998e');
          ext.box(s*1.606,4.12,xz-side*.021,.023,.548,.022,rubber);
          ext.box(s*1.621,4.12,xz,.010,.565,.015,j===0&&side===-1?'#dfd8b5':'#abb3a4');
          ext.box(s*1.548,4.12,xz-side*.015,.014,.532,.020,'#485a50');
          for(const y of [3.866,4.135,4.377])ext.oval(s*1.625,y,xz,.0023,.006,.005,'#66796d');
        }
        for(const [y,depth,col] of [[3.845,.034,'#a5ab97'],[4.395,.034,'#9fa99c'],[3.865,.016,rubber],[4.376,.016,rubber]]){
          ext.box(s*1.595,y,z,.050,depth,.880,col);
        }
        room.box(s*1.48,3.817,z,.207,.031,.904,'#655e4c');
        for(const d of [-.38,.29])ext.box(s*1.598,3.788,z+d,.004,.092,.0039,'#7b877b');
      }
      ext.box(s*1.517,3.695,-2.46,.025,.035,3.20,'#a3aa9b');
      ext.box(s*1.72,4.505,-2.49,.045,.053,3.60,'#414e48');
      ext.rod(s*1.723,4.492,-4.21,s*1.703,4.495,-.78,.009,'#a0a89a');
    }
    // Five true forward lights share the shallow slope of the old wipers.
    for(let j=0;j<5;j++){
      const x=-1.24+.62*j;
      for(const s of [-1,1]){
        ext.box(x+s*.294,4.118,-4.191,.049,.667,.092,'#87968b',-.10);
        ext.box(x+s*.270,4.119,-4.209,.016,.598,.055,rubber,-.10);
      }
      for(const s of [-1,1]){
        const y=4.118+s*.302,z=-4.191-s*.029;
        ext.box(x,y,z,.595,.047,.084,'#a4afa0',-.10);
        ext.box(x,y-s*.022,z-.018,.545,.016,.047,rubber,-.10);
      }
    }
    ext.box(0,4.479,-4.168,3.21,.054,.109,enamel);
    for(const s of [-1,1])ext.box(s*1.567,4.123,-4.154,.073,.644,.110,enamel);
    // A slight profile to the original canopy: rolled gutters and narrow
    // rain seams rather than a new roof silhouette over the bridge wing.
    ext.box(0,4.519,-4.310,3.48,.042,.043,'#596b62');
    for(const x of [-1.14,-.47,.30,.99])ext.rod(x,4.610,-4.28,x,4.610,-.68,.0084,'#819186');
    ext.flush();
    // Dark corners establish actual cabin depth. The chart desk and the
    // opposite half-curtain appear behind different panes as the boat rolls.
    room.box(0,4.476,-2.45,3.05,.04,3.37,'#72776a',0,0,0,.55);
    room.box(0,3.275,-2.42,2.885,.06,3.23,'#584e41',0,0,0,.75);
    for(let i=0;i<12;i++)room.box(-1.32+i*.244,3.307,-2.42,.007,.004,3.20,'#383f37',0,0,0,.69);
    for(const s of [-1,1]){
      room.box(s*1.420,3.560,-2.44,.055,.51,3.19,'#777569',0,0,0,.78);
      room.box(s*1.388,3.477,-2.44,.040,.025,3.14,'#625e50');
      room.box(0,3.560,-2.41+s*1.587,2.84,.51,.055,'#6f6d61',0,0,0,.78);
    }
    room.box(0,4.10,-.824,3.03,.75,.040,'#795d44',0,0,0,.86);
    room.box(-.79,4.125,-1.065,1.31,.61,.392,'#4b574a',0,0,0,.79);
    for(let i=0;i<7;i++){
      room.box(-1.36+i*.17,4.102,-1.277,.112,.405,.032,i%2?'#766f59':'#827c65',0,0,(i%3-1)*.035);
      room.box(-1.365+i*.17,4.215,-1.298,.063,.039,.005,'#b0a88c');
    }
    for(let j=0;j<4;j++)room.box(.49+j*.26,4.13,-.875,.231,.406,.043,j%2?'#587061':'#5d7368');
    room.box(0,4.287,-.917,2.8,.025,.035,'#b0a589');
    room.rod(-1.28,3.986,-3.875,1.34,3.986,-3.875,.027,'#8b7357');
    room.box(0,3.868,-3.938,2.79,.24,.352,'#4d5c55',-.19);
    room.box(.65,3.995,-3.907,1.07,.035,.32,'#8a7757',-.19);
    for(let j=0;j<6;j++){
      const x=-.98+j*.31;room.oval(x,3.991,-3.866,.055,.019,.050,'#a0997d',.18);
      room.oval(x,4.001,-3.857,.037,.013,.035,j%2?'#7c775d':'#526b5f',.18);
    }
    // Chart shelf visible in the second starboard light, zinc lamp overhead.
    room.box(.99,3.908,-2.50,1.04,.072,.80,'#80674b',.035);
    for(const x of [.54,1.41])room.box(x,3.615,-2.50,.049,.565,.705,'#5d5948',0,0,0,.81);
    room.box(.99,3.807,-2.50,.88,.099,.64,'#625540',0,0,0,.88);
    room.rod(.76,3.817,-2.169,.91,3.817,-2.169,.007,'#9a977d');
    room.box(1.08,3.956,-2.52,.76,.008,.57,'#c9b58b',.035,0,.028,1.72);
    for(let j=0;j<6;j++)room.rod(.78,3.967,-2.72+j*.070,1.34,3.963,-2.59+j*.054,.0033,'#8b8471');
    room.rod(.96,3.973,-2.75,1.18,3.969,-2.31,.010,'#b3a17d');
    room.rod(1.38,3.96,-2.41,1.38,4.19,-2.41,.014,'#806b49');
    room.rod(1.38,4.19,-2.41,1.22,4.252,-2.53,.013,'#a18b62');
    room.oval(1.19,4.232,-2.54,.095,.054,.075,'#485a48',0,0,.18);
    room.oval(1.183,4.211,-2.54,.086,.016,.064,'#f7d391',0,0,.18,3.60);
    room.rod(.15,3.954,-1.19,1.43,3.954,-1.19,.018,'#ad9e7d');
    for(const z of [-3.95,-2.93,-1.90])room.box(-1.439,4.157,z,.045,.50,.095,'#897d61',0,-.09,.035);
    // A half-drawn wool blackout folded into the stern jamb, leaving real sky
    // through the far lights and the captain's sightline unobstructed.
    for(let j=0;j<6;j++)room.box(-1.415+(j%2)*.027,4.13,-1.08-.052*j,.038,.50-.018*(j%3),.093,j%2?'#70674f':'#91876c',.025);
    const helmYaw=-.56,helmOrigin=[.985,4.026,-3.515];
    const helm=(x,y,z)=>[helmOrigin[0]+x*Math.cos(helmYaw)+z*Math.sin(helmYaw),helmOrigin[1]+y,helmOrigin[2]+z*Math.cos(helmYaw)-x*Math.sin(helmYaw)];
    for(let i=0;i<28;i++){
      const theta=TAU*i/28,after=theta+TAU/28;
      room.rod(...helm(.153*Math.cos(theta),-.091+.153*Math.sin(theta),-.31),...helm(.153*Math.cos(after),-.091+.153*Math.sin(after),-.31),.012,'#937858');
      if(i%7===0)room.rod(...helm(0,-.091,-.318),...helm(.146*Math.cos(theta),-.091+.146*Math.sin(theta),-.31),.0078,'#af9b76');
    }
    room.rod(...helm(0,-.091,-.46),...helm(0,-.091,-.293),.021,'#756f5b');
    room.flush();
    const pilot=new T.Group();pilot.name='梁青 · 值舵';pilot.position.fromArray(helmOrigin);pilot.rotation.y=helmYaw;root.add(pilot);
    const headPivot=new T.Group();headPivot.position.set(0,.005,-.009);headPivot.name='梁青 · 望船首';pilot.add(headPivot);
    const garment=batch(pilot,person,'驾驶服和掌舵双手'),face=batch(headPivot,person,'船长面部、鬓发和旧制帽');
    function ringMesh(rows,segments,surface){
      const p=[],uv=[],idx=[],col=[];
      for(let j=0;j<rows.length;j++){
        const [y,wide,deep,centre=0]=rows[j];
        for(let k=0;k<=segments;k++){
          const an=k*TAU/segments,sn=Math.sin(an),cs=Math.cos(an),v=surface?surface(y,wide*sn,centre-deep*cs,sn,cs,j):[wide*sn,y,centre-deep*cs,1];
          p.push(v[0],v[1],v[2]);const tone=v[3]??1;col.push(tone,tone*.999,tone*.985);
          uv.push(k/segments,j/(rows.length-1));
          if(j<rows.length-1&&k<segments){const id=j*(segments+1)+k;idx.push(id,id+segments+1,id+1,id+1,id+segments+1,id+segments+2);}
        }
      }
      const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('color',new T.Float32BufferAttribute(col,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();
      const normals=g.attributes.normal;for(let j=0;j<rows.length;j++){const i=j*(segments+1);a.fromBufferAttribute(normals,i).add(b.fromBufferAttribute(normals,i+segments)).normalize();normals.setXYZ(i,a.x,a.y,a.z);normals.setXYZ(i+segments,a.x,a.y,a.z);}
      return g;
    }
    const coatRows=[[-.53,.163,.116,.034],[-.43,.177,.116,.034],[-.30,.178,.119,.027],[-.20,.181,.127,.019],[-.145,.193,.135,.013],[-.108,.207,.129,.009],[-.080,.198,.117,.008],[-.059,.155,.099,.005],[-.043,.087,.068,-.001]];
    const coat=ringMesh(coatRows,36,(y,x,z,sn,cs)=>[x*(1+.018*Math.sin(6*sn+y*25)),y,z+.004*Math.sin(4*y+6*sn)*cs,.92+.05*cs]);
    garment.append(coat,'#586761',0,0,0,1,1,1,0,0,0,1.15);coat.dispose();
    garment.oval(0,-.018,-.010,.044,.061,.046,'#b18c71',0,0,0,1.16);
    garment.oval(0,-.058,-.004,.068,.032,.056,'#454f4c',.05);
    garment.oval(0,-.054,-.030,.038,.027,.039,'#776e5a',.10);
    garment.rod(-.093,-.06,-.065,-.025,-.164,-.127,.021,'#354a48');
    garment.rod(.093,-.06,-.065,.024,-.161,-.127,.021,'#40544f');
    garment.rod(0,-.157,-.128,0,-.387,-.097,.0056,'#b29965');
    for(const s of [-1,1]){
      const elbow=[s*.205,-.275,-.097],hand=[s*.135,-.066+(s>0?.018:0),-.308];
      garment.oval(s*.176,-.110,-.004,.068,.085,.072,'#52665e',.045,0,s*-.2,1.11);
      garment.rod(s*.160,-.098,-.006,...elbow,.055,'#50615c');garment.oval(...elbow,.055,.063,.06,'#495c57');
      garment.rod(...elbow,hand[0],hand[1]-.018,hand[2]+.034,.046,'#53655e');
      garment.oval(...hand,.038,.044,.033,'#ba9478',.11,0,s*.24,1.28);
      garment.rod(s*.148,-.067,-.059,s*.194,-.085,-.039,.015,'#394a48');
      for(let bar=0;bar<3;bar++)garment.rod(s*(.165+bar*.008),-.071-bar*.002,-.068,s*(.166+bar*.008),-.069-bar*.002,-.048,.0029,'#c7ad75');
    }
    garment.flush();
    const skull=[
      [-.017,.045,.044,.010],[.009,.048,.045,.004],[.027,.041,.044,-.007],[.034,.035,.050,-.011],
      [.045,.052,.061,-.009],[.063,.063,.067,-.004],[.079,.071,.072,.001],[.098,.075,.078,.002],
      [.118,.077,.081,.004],[.142,.078,.084,.006],[.164,.078,.086,.007],[.190,.077,.086,.009],
      [.213,.071,.080,.012],[.234,.057,.065,.012],[.249,.035,.041,.012],[.254,.0008,.002,.012]
    ];
    function row(y){
      let j=0;while(j<skull.length-2&&skull[j+1][0]<y)j++;
      const lo=skull[j],hi=skull[j+1],f=Math.min(1,Math.max(0,(y-lo[0])/(hi[0]-lo[0])));
      return lo.map((v,k)=>v+(hi[k]-v)*f);
    }
    const bell=(x,s)=>Math.exp(-x*x/(s*s));
    function anatomy(x,y){
      const cheek=.0092*bell(Math.abs(x)-.047,.024)*bell(y-.118,.024);
      const orbit=-.0087*bell(Math.abs(x)-.035,.019)*bell(y-.150,.012);
      const brow=.0054*bell(Math.abs(x)-.034,.026)*bell(y-.166,.012);
      const nose=(.017*bell(y-.142,.036)+.026*bell(y-.109,.012))*bell(x,.0102);
      const lips=.0041*bell(x,.019)*bell(y-.077,.014);
      return cheek+orbit+brow+nose+lips;
    }
    function frontZ(x,y){const q=row(y);return q[3]-q[2]*Math.sqrt(Math.max(.001,1-(x/q[1])**2))-anatomy(x,y);}
    const headRows=[];for(let y=-.017;y<.253;y+=.0057)headRows.push(row(y));headRows.push(skull.at(-1));
    const skin=ringMesh(headRows,50,(y,x,z,sn,cs)=>{
      const faceWeight=Math.max(cs,0),d=anatomy(x,y)*faceWeight;
      const patina=.96+.042*faceWeight+.052*bell(y-.118,.024)*Math.abs(sn)-.051*bell(y-.068,.014)*faceWeight;
      return [x,y,z-d,patina];
    });
    face.append(skin,'#d0a184',0,0,0,1,1,1,0,0,0,1.43);skin.dispose();
    for(const s of [-1,1]){
      face.oval(.073*s,.125,.012,.014,.027,.013,'#c38970',.13,0,s*.09,1.23);
      face.oval(.081*s,.124,.011,.005,.015,.006,'#9f715d',.13,0,s*.09,1.17);
      const x=s*.032,j=.147,z=frontZ(x,j);
      face.oval(x,j,z-.0007,.017,.0049,.0028,'#d4ba9d',0,s*-.30,s*.012,1.24);
      face.oval(x+s*.0007,j+.0001,z-.0032,.0047,.0048,.0021,'#453e36',0,s*-.30,0,1.07);
      face.oval(x+.001,j+.0014,z-.0052,.0010,.0011,.0008,'#d5c9ac',0,0,0,1.21);
      for(const [y,rad,color] of [[.153,.0014,'#79584b'],[.161,.0022,'#564b43']]){
        for(let k=0;k<5;k++){
          const x0=s*(.015+.0074*k),x1=s*(.015+.0074*(k+1));
          const y0=y+.0034*Math.sin(k*Math.PI/5),y1=y+.0034*Math.sin((k+1)*Math.PI/5);
          face.rod(x0,y0,frontZ(x0,y0)-.0009,x1,y1,frontZ(x1,y1)-.0009,rad,color,1.15);
        }
      }
      face.oval(s*.0092,.105,frontZ(s*.0092,.105)-.003,.008,.0058,.008,'#ca967c',0,0,s*.10,1.25);
      face.oval(s*.0069,.1018,frontZ(s*.0069,.103)-.006,.0037,.0016,.0021,'#805d4d',0,0,0,1.08);
    }
    face.oval(0,.0768,frontZ(0,.0768)-.0019,.022,.0052,.0034,'#ae7865',0,0,.015,1.27);
    face.oval(0,.0787,frontZ(0,.079)-.005,.020,.0014,.0016,'#8b6154',0,0,0,1.20);
    // Silver hair at both temples and a low knot beneath a navy officer's
    // watch cap. The brim and nose give a readable profile at shore distance.
    face.oval(0,.153,.061,.069,.084,.042,'#494943',-.21);
    face.oval(.006,.112,.095,.046,.039,.045,'#454641',.28,0,0,1.13);
    for(const s of [-1,1]){
      face.oval(s*.07,.170,-.002,.012,.043,.031,'#56544a',-.43,0,s*.13);
      for(let j=0;j<6;j++)face.rod(s*(.077-j*.00057),.18+j*.0018,-.018+j*.006,s*.077,.147+j*.001,.005+j*.0045,.0012,j%2?'#969082':'#76766c',1.14);
    }
    const cap=ringMesh([[.176,.078,.082,.008],[.183,.083,.090,.007],[.202,.090,.101,.006],[.217,.096,.102,.008],[.235,.086,.097,.006],[.245,.067,.079,.005],[.249,.001,.003,.004]],42);
    face.append(cap,'#4f5b59',0,0,0,1,1,1,0,0,0,1.25);cap.dispose();
    face.oval(0,.180,-.061,.088,.009,.075,'#2d3b3c',-.10,0,0,1.09);
    face.rod(-.060,.184,-.055,.060,.184,-.055,.005,'#b4a078',1.38);
    face.oval(0,.209,-.091,.011,.013,.003,'#d5bd80',-.12,0,0,1.50);
    face.flush();
    // Wet glazing, one draw. Reflected rays sample the same equirectangular
    // sky used by this coast. Downward rays strike the rolling sea before
    // sampling that sky, so the reflected horizon responds to the ship.
    function wetNormal(){
      const n=192,height=new Float32Array(n*n),rgba=new Uint8Array(n*n*4),wrap=i=>(i+n)%n;
      for(let j=0;j<105;j++){
        const x0=n*random(j,1),y0=n*random(j,2),r=.65+random(j,3)**2*3.1,trail=j%7===0?5+12*random(j,4):0;
        for(let y=Math.floor(y0-r-2);y<y0+r+trail+2;y++)for(let x=Math.floor(x0-r-2);x<=x0+r+2;x++){
          const dx=x-x0,dy=y-y0,body=Math.sqrt(Math.max(0,1-(dx/r)**2-(dy/(r*1.33))**2));
          const track=trail&&dy>0&&dy<trail?Math.max(0,1-Math.abs(dx-.37*Math.sin(dy*.34))/.93)*(1-dy/trail)*.28:0;
          const k=wrap(x)+n*wrap(y);height[k]=Math.max(height[k],body,track);
        }
      }
      for(let y=0;y<n;y++)for(let x=0;x<n;x++){
        const k=y*n+x,dx=.90*(height[wrap(x-1)+n*y]-height[wrap(x+1)+n*y]),dy=.90*(height[x+n*wrap(y-1)]-height[x+n*wrap(y+1)]),m=1/Math.hypot(1,dx,dy);
        const veil=28+110*height[k]+18*(.5+.5*Math.cos(TAU*x/n*17+.23*Math.sin(TAU*y/n)))**9;
        rgba.set([128+127*dx*m,128+127*dy*m,127.5+127.5*m,veil],k*4);
      }
      const im=keep(new T.DataTexture(rgba,n,n));im.wrapS=im.wrapT=T.RepeatWrapping;im.magFilter=T.LinearFilter;im.minFilter=T.LinearMipmapLinearFilter;im.generateMipmaps=true;im.anisotropy=4;im.needsUpdate=true;return im;
    }
    const skyFallback=keep(new T.DataTexture(new Uint8Array([120,133,137,255]),1,1));skyFallback.needsUpdate=true;
    const gu={uSky:{value:skyFallback},uWet:{value:wetNormal()},uSkyOn:{value:0},uWater:{value:-3.35},uTime:{value:0}};
    const glass=keep(new T.ShaderMaterial({uniforms:gu,transparent:true,depthWrite:false,side:T.FrontSide,
      vertexShader:`varying vec2 st;varying vec3 wp;varying vec3 upAxis;varying vec3 across;varying vec3 normalW;
        void main(){vec4 w=modelMatrix*vec4(position,1.);wp=w.xyz;st=uv;normalW=normalize(mat3(modelMatrix)*normal);
          upAxis=normalize(mat3(modelMatrix)*vec3(0,1,0));across=normalize(cross(upAxis,normalW));
          gl_Position=projectionMatrix*viewMatrix*w;}`,
      fragmentShader:`uniform sampler2D uSky,uWet;uniform float uWater,uTime,uSkyOn;varying vec2 st;varying vec3 wp;varying vec3 upAxis;varying vec3 across;varying vec3 normalW;
        const float pi=3.14159265;
        vec3 sky(vec3 ray){
          vec2 uv=vec2(atan(ray.z,ray.x)/(2.*pi)+.5,asin(clamp(ray.y,-1.,1.))/pi+.5);
          vec3 coast=texture2D(uSky,uv).rgb;
          return mix(mix(vec3(.20,.29,.31),vec3(.41,.48,.46),max(0.,ray.y)),coast,.90*uSkyOn);
        }
        void main(){
          vec4 wet=texture2D(uWet,st*vec2(1.45,1.02));
          vec3 N=normalize(normalW+across*.24*(wet.r*2.-1.)+upAxis*.24*(wet.g*2.-1.));
          vec3 I=normalize(wp-cameraPosition),R=reflect(I,N);
          float NoV=clamp(dot(-I,N),0.,1.),fresnel=.042+.958*pow(1.-NoV,5.);
          vec3 image=sky(R);
          if(R.y<.015){
            float dist=clamp((wp.y-uWater)/max(.023,-R.y),0.,160.);
            vec2 sea=wp.xz+dist*R.xz;
            vec2 slope=.11*vec2(cos(dot(sea,vec2(.62,.24))+uTime*1.02),sin(dot(sea,vec2(.25,.76))-uTime*1.09));
            slope+=.041*vec2(cos(sea.y*2.9+uTime*1.4),sin(sea.x*3.20+uTime*.93));
            vec3 rn=normalize(vec3(-slope.x,1.,-slope.y));
            vec3 reflected=sky(normalize(reflect(R,rn)));
            vec3 water=mix(vec3(.034,.081,.084),reflected,.26+.32*pow(1.-max(0.,-R.y),4.));
            image=mix(water,image,smoothstep(-.035,.015,R.y));
          }
          float edge=min(min(st.x,1.-st.x),min(st.y,1.-st.y));
          float salt=(1.-smoothstep(.0,.052,edge))*(.8+.20*sin(142.*st.x+83.*st.y));
          float cover=clamp(.095+fresnel*.72+wet.a*.047+salt*.07,.095,.71);
          gl_FragColor=vec4(image*1.22+vec3(.016,.023,.021)*(1.-NoV)+salt*.075,cover);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`}));
    const vp=[],vn=[],vu=[],vi=[];
    function pane(centre,horizontal,vertical){
      const i0=vp.length/3;
      a.fromArray(horizontal);b.fromArray(vertical);norm.crossVectors(a,b).normalize();
      for(const [x,y] of [[-.5,-.5],[.5,-.5],[.5,.5],[-.5,.5]]){
        pt.fromArray(centre).addScaledVector(a,x).addScaledVector(b,y);vp.push(pt.x,pt.y,pt.z);
        vn.push(norm.x,norm.y,norm.z);vu.push(x+.5,y+.5);
      }
      vi.push(i0,i0+1,i0+2,i0,i0+2,i0+3);
    }
    for(const s of [-1,1])for(let i=0;i<3;i++){pane([s*1.601,4.12,-3.52+i*1.01],[0,0,-s*.841],[0,.513,0]);}
    for(let i=0;i<5;i++)pane([-1.24+i*.62,4.118,-4.204],[-.534,0,0],[0,.570,-.057]);
    const glassGeo=keep(new T.BufferGeometry());glassGeo.setAttribute('position',new T.Float32BufferAttribute(vp,3));glassGeo.setAttribute('normal',new T.Float32BufferAttribute(vn,3));glassGeo.setAttribute('uv',new T.Float32BufferAttribute(vu,2));glassGeo.setIndex(vi);glassGeo.computeBoundingSphere();
    const windows=new T.Mesh(glassGeo,glass);windows.name='夹层风暴玻璃 · 十一扇';windows.renderOrder=2;root.add(windows);
    windows.onBeforeRender=(renderer,scene)=>{const environment=scene.environment;gu.uSkyOn.value=environment?.isTexture&&environment.image?1:0;gu.uSky.value=gu.uSkyOn.value?environment:skyFallback;};
    for(const g of geometries)g.dispose();
    function update(g,t){
      if(disposed)return;const time=Number.isFinite(t)?t:g?.time||0;
      ship.updateWorldMatrix(true,false);shipWorld.copy(ship.matrixWorld);shipInverse.copy(shipWorld).invert();
      gu.uTime.value=time;gu.uWater.value=g?.cues?.water??-3.35;
      const listening=g?.lastPass?.voice==='standby'||g?.lastPass?.voice==='turn',search=g?.rangeWatch?.phase==='light';
      // A restrained watch on the bow, a look toward the light, then eyes
      // back to the opening. Her hands continue to bear on the same wheel.
      const glance=.5+.5*Math.sin(time*.63+1.60);
      headPivot.rotation.set(.030+.10*glance-((listening||search) ? .092 : 0),
        -.19-.24*glance-(listening ? .16 : 0),.016*Math.sin(time*.83));
      pilot.rotation.z=-.017*Math.sin(time*.86);headPivot.position.y=.005+.0025*Math.sin(time*1.64);
    }
    function dispose(){if(disposed)return;disposed=true;root.removeFromParent();
      if(originalShell)originalShell.visible=originalVisible;
      for(const a of owned)a.dispose();owned.clear();
    }
    update(null,0);return {update,dispose};
  }
  return {create};
})();
