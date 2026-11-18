// Original articulated characters and the Hai Yan. Geometry is batched per joint:
// each joint has one draw per surface finish, including its seams and hardware.
(() => {
  'use strict';
  const T = window.THREE;
  const TAU = Math.PI * 2;
  const sphere = new T.SphereGeometry(1, 16, 12);
  const cube = new T.BoxGeometry(1, 1, 1);
  const cylinder = new T.CylinderGeometry(1, 1, 1, 12);
  const cordRing = new T.TorusGeometry(1, .115, 6, 32);
  const fatRing = new T.TorusGeometry(1, .27, 8, 36);
  const transform = new T.Object3D();
  const normalMatrix = new T.Matrix3();
  const v = new T.Vector3();
  const n = new T.Vector3();
  const color = new T.Color();
  const colors = ['#e4a04c', '#58afa9'];
  const shellColors = ['#cf8842', '#428d89'];
  const dark = '#293637';
  const rubber = '#23292a';
  const webbing = '#3b4140';
  const pale = '#dfd9ae';
  const steel = '#8d9c94';

  function grain() {
    // A tileable micro-relief shared by both workers' waterproof fabric.
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 96;
    const context = canvas.getContext('2d');
    if (!context) return null;
    const pixels = context.createImageData(96, 96);
    let seed = 49421;
    for (let y = 0; y < 96; y++) {
      for (let x = 0; x < 96; x++) {
        seed = (Math.imul(1664525, seed) + 1013904223) >>> 0;
        const value = 96 + (seed >>> 28) + (x % 3 === 0 ? 12 : 0) + (y % 3 === 0 ? 10 : 0);
        const i = (y*96+x)*4;
        pixels.data.set([value, value, value, 255], i);
      }
    }
    context.putImageData(pixels, 0, 0);
    const texture = new T.CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = T.RepeatWrapping;
    texture.repeat.set(4, 4);
    return texture;
  }

  function clothPattern() {
    const canvas=document.createElement('canvas');
    canvas.width=512;canvas.height=512;
    const ctx=canvas.getContext('2d');
    if (!ctx) return null;
    const image=ctx.createImageData(512,512);
    let state=139;
    const random=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
    // An irregular warp, filling and the small reinforced squares of ripstop.
    // Faint variation in the dye keeps the broad jacket panels from looking molded.
    for(let y=0;y<512;y++) {
      for(let x=0;x<512;x++) {
        const ripple=Math.sin(TAU*(x/512*4+Math.sin(TAU*y/512)*.5))*
          Math.sin(TAU*(y/512*3+Math.sin(TAU*x/512)));
        const weave=((x+y)%3===0?3:0)+(y%16<2||x%16<2?4:0);
        const value=230+random()*15+weave+ripple*6;
        image.data.set([value,value,Math.max(0,value-2),255],(y*512+x)*4);
      }
    }
    ctx.putImageData(image,0,0);
    for(let i=0;i<1450;i++){
      const x=random()*512,y=random()*512;
      ctx.strokeStyle=i%3?'rgba(63,53,45,.065)':'rgba(255,255,248,.15)';
      ctx.lineWidth=random()*.9+.45;
      ctx.beginPath();ctx.moveTo(x,y);
      ctx.lineTo(x+random()*4-2,y+random()*7);ctx.stroke();
    }
    const texture=new T.CanvasTexture(canvas);
    texture.colorSpace=T.SRGBColorSpace;
    texture.wrapS=texture.wrapT=T.RepeatWrapping;
    return texture;
  }

  const finishes = {
    fabric: new T.MeshStandardMaterial({vertexColors:true, roughness:.67, map:clothPattern(), bumpMap:grain(), bumpScale:.003}),
    satin: new T.MeshStandardMaterial({vertexColors:true, roughness:.44, metalness:.13}),
    metal: new T.MeshStandardMaterial({vertexColors:true, roughness:.32, metalness:.6}),
    glass: new T.MeshStandardMaterial({vertexColors:true, roughness:.16, metalness:.52}),
    skin: new T.MeshStandardMaterial({vertexColors:true, roughness:.71}),
    lamp: new T.MeshBasicMaterial({vertexColors:true, toneMapped:false}),
  };

  // Shapes arrive in the local coordinates of their joint. Flatten them once;
  // the finished geometry and materials are shared by later character clones.
  class Batch {
    constructor() { this.parts = new Map(); }

    add(shape, tint, finish, at, size, rotation) {
      let data = this.parts.get(finish);
      if (!data) {
        data = {position:[], normal:[], color:[], uv:[], index:[]};
        this.parts.set(finish,data);
      }
      transform.position.fromArray(at);
      transform.scale.fromArray(size);
      transform.rotation.set(...(rotation || [0,0,0]));
      transform.updateMatrix();
      normalMatrix.getNormalMatrix(transform.matrix);
      const first = data.position.length/3;
      const a = shape.attributes;
      color.set(tint);
      for (let i=0;i<a.position.count;i++) {
        v.fromBufferAttribute(a.position,i).applyMatrix4(transform.matrix);
        n.fromBufferAttribute(a.normal,i).applyMatrix3(normalMatrix).normalize();
        data.position.push(v.x,v.y,v.z);
        data.normal.push(n.x,n.y,n.z);
        data.color.push(color.r,color.g,color.b);
        data.uv.push(a.uv?.getX(i) || 0,a.uv?.getY(i) || 0);
      }
      if (shape.index) {
        for (const i of shape.index.array) data.index.push(first+i);
      } else {
        for (let i=0;i<a.position.count;i++) data.index.push(first+i);
      }
    }

    oval(tint,at,size,finish='fabric',rot) { this.add(sphere,tint,finish,at,size,rot); }
    box(tint,at,size,finish='satin',rot) { this.add(cube,tint,finish,at,size,rot); }
    tube(tint,from,to,r,finish='metal') {
      const a=new T.Vector3().fromArray(from);
      const b=new T.Vector3().fromArray(to);
      const direction=b.clone().sub(a);
      const length=direction.length();
      const quat=new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),direction.normalize());
      const rot=new T.Euler().setFromQuaternion(quat);
      this.add(cylinder,tint,finish,a.lerp(b,.5).toArray(),[r,length,r],[rot.x,rot.y,rot.z]);
    }
    ring(tint,at,size,rot,thick=false,finish='satin') {
      this.add(thick?fatRing:cordRing,tint,finish,at,size,rot);
    }
    loft(tint,rings,finish='fabric',folds=0,offset=[0,0,0]) {
      const shape=ellipticLoft(rings,folds);
      this.add(shape,tint,finish,offset,[1,1,1]);
      shape.dispose();
    }
    flush(group) {
      for (const [finish,d] of this.parts) {
        const shape = new T.BufferGeometry();
        shape.setAttribute('position',new T.Float32BufferAttribute(d.position,3));
        shape.setAttribute('normal',new T.Float32BufferAttribute(d.normal,3));
        shape.setAttribute('color',new T.Float32BufferAttribute(d.color,3));
        shape.setAttribute('uv',new T.Float32BufferAttribute(d.uv,2));
        shape.setIndex(d.index);
        shape.computeBoundingSphere();
        const mesh = new T.Mesh(shape, finishes[finish]);
        mesh.castShadow=finish!=='lamp'; mesh.receiveShadow=true;
        group.add(mesh);
      }
    }
  }

  // A ring is [y, half-width, half-depth, center-z, center-x]. Fabric folds
  // stay aligned longitudinally through a sleeve, with a slight spiral at cuffs.
  function ellipticLoft(rings,folds) {
    const seg=24, positions=[], uvs=[], indices=[];
    for (let j=0;j<rings.length;j++) {
      const [y,w,d,z=0,x=0]=rings[j];
      for (let k=0;k<=seg;k++) {
        const a=TAU*k/seg;
        const f=1+folds*(.7*Math.sin(6*a+j*.46)+.3*Math.sin(9*a-j*.3));
        positions.push(x+w*Math.sin(a)*f,y,z-d*Math.cos(a)*f);
        uvs.push(k/seg,j/(rings.length-1));
        if (j<rings.length-1 && k<seg) {
          const v0=j*(seg+1)+k, v1=v0+seg+1;
          indices.push(v0,v1,v0+1,v1,v1+1,v0+1);
        }
      }
    }
    for (let k=1;k<seg-1;k++) {
      const top=(rings.length-1)*(seg+1);
      indices.push(0,k,k+1,top,top+k+1,top+k);
    }
    const geo=new T.BufferGeometry();
    geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));
    geo.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));
    geo.setIndex(indices); geo.computeVertexNormals();
    return geo;
  }

  function joint(owner,name,x,y,z) {
    const group=new T.Group();
    group.name=name; group.position.set(x,y,z); owner.add(group);
    return group;
  }

  function torso(group,side) {
    const b=new Batch(), shell=shellColors[side], trim=colors[side];
    const body=[
      [-.108,.163,.127,.012],[-.093,.177,.136,.012],[-.079,.175,.132,.012],[-.055,.179,.135,.011],[-.027,.174,.132,.009],[.020,.169,.128,.008],
      [.075,.174,.137,.008],[.140,.154,.120,.007],[.220,.163,.120,.010],
      [.305,.189,.130,.011],[.386,.206,.125,.006],[.433,.196,.116],
      [.470,.147,.102],[.497,.085,.084]];
    b.loft(shell,body,'fabric',.055);
    b.loft(dark,[[-.108,.163,.127,.012],[-.097,.178,.136,.012]],'fabric',.035);
    b.loft('#72817b',[[.292,.189,.131,.011],[.305,.193,.133,.011]],'satin');
    b.loft(dark,[[.431,.109,.092,.018],[.465,.125,.097,.022],[.527,.088,.085,.012]]);
    // Hood gathered below the helmet and a sealed front zip.
    b.oval(trim,[0,.451,.073],[.151,.077,.085]);
    b.tube('#343d38',[0,.02,-.130],[0,.43,-.118],.009,'satin');
    b.box(steel,[.005,.368,-.134],[.014,.026,.009],'metal');
    b.loft(webbing,[[.060,.175,.137,.007],[.089,.177,.140,.007]],'fabric');
    b.box('#7c8882',[0,.079,-.136],[.038,.027,.012],'metal');
    for (const s of [-1,1]) {
      b.oval(trim,[s*.112,.128,-.103],[.059,.067,.019],'fabric',[0,s*.42,s*.10]);
      b.box('#727d72',[s*.119,.124,-.126],[.008,.045,.004],'satin',[0,-s*.31,-s*.06]);
      b.tube('#9a855e',[s*.165,.133,-.072],[s*.162,.150,-.080],.003,'fabric');
      b.tube(trim,[s*.168,.234,-.046],[s*.184,.354,-.055],.006,'fabric');
      b.tube('#737364',[s*.063,.172,-.119],[s*.151,.19,-.10],.006,'satin');
      b.tube(webbing,[s*.118,.443,-.09],[s*.153,.213,-.074],.021,'fabric');
      b.tube(pale,[s*.126,.400,-.103],[s*.139,.318,-.10],.011,'satin');
      b.tube(webbing,[s*.120,.431,.086],[s*.151,.119,.095],.017,'fabric');
    }
    // A canvas tool roll versus the signal operator's field radio.
    if (side===0) {
      b.oval('#665544',[0,.241,.14],[.130,.171,.079]);
      b.box('#5a5346',[0,.251,.167],[.228,.227,.083],'fabric');
      b.oval('#806c53',[0,.336,.185],[.125,.054,.052]);
      b.tube('#303636',[-.111,.180,.207],[.111,.180,.207],.012,'fabric');
      b.box('#9b794d',[0,.227,.216],[.065,.037,.008],'satin');
      for(const s of [-1,1]) {
        b.box('#545746',[s*.072,.215,.209],[.020,.175,.016],'fabric');
        b.box(steel,[s*.072,.202,.223],[.031,.029,.009],'metal');
      }
      b.oval('#655541',[.146,.03,.016],[.045,.083,.065]);
      b.tube('#a4aba2',[.164,.02,.028],[.177,.17,.051],.012);
    } else {
      b.box('#35494a',[0,.255,.159],[.201,.268,.089],'satin');
      b.box('#455a56',[0,.287,.213],[.171,.125,.025],'metal');
      for(let k=0;k<8;k++)
        b.box('#273635',[0,.242+k*.012,.230],[.13,.005,.003],'satin');
      b.box('#acc7b3',[.016,.352,.212],[.070,.028,.004],'satin');
      b.tube('#414d47',[-.067,.371,.156],[-.091,.613,.170],.007);
      b.oval('#232f31',[-.092,.616,.170],[.009,.014,.009],'satin');
      b.box('#677c70',[0,.156,.211],[.118,.042,.010],'satin');
      b.tube('#36423f',[.085,.366,.165],[.143,.380,.116],.008,'fabric');
      b.tube('#36423f',[.143,.380,.116],[.158,.418,.028],.008,'fabric');
      b.tube('#36423f',[.158,.418,.028],[.135,.379,-.107],.008,'fabric');
      b.box('#273f41',[.135,.371,-.111],[.049,.083,.037],'satin',[0,-.2,-.15]);
      b.box('#c9c3a7',[.135,.389,-.133],[.031,.008,.006],'satin');
    }
    b.flush(group);
  }

  function head(group,side) {
    const b=new Batch();
    const skin=side?'#b9886c':'#ae7d63';
    const shadow=side?'#96684f':'#91644d';
    b.oval(skin,[0,.023,.003],[.063,.077,.061],'skin');
    b.loft(skin,[[.032,.041,.037,-.029],[.048,.062,.062,-.016],
      [.069,.071,.068,-.009],[.091,.079,.073,-.005],[.118,.086,.077,-.001],
      [.155,.088,.079,.004],[.192,.086,.078,.011],[.222,.069,.062,.011],
      [.232,.047,.046,.009]],'skin');
    for(const s of [-1,1]){
      b.oval(skin,[s*.083,.116,.004],[.016,.028,.016],'skin');
      b.oval(shadow,[s*.089,.116,.002],[.010,.016,.010],'skin');
      b.oval('#b4a79a',[s*.034,.133,-.071],[.018,.006,.006],'skin');
      b.oval('#38332e',[s*.034,.133,-.077],[.008,.0055,.003],'skin');
      b.oval('#473c34',[s*.035,.149,-.071],[.023,.0045,.005],'skin',[0,s*.2,-s*.1]);
      b.tube(dark,[s*.071,.171,-.008],[s*.068,.062,-.026],.005,'fabric');
    }
    b.oval(skin,[0,.165,-.061],[.063,.018,.018],'skin');
    b.oval(skin,[0,.116,-.075],[.012,.029,.015],'skin');
    b.oval(shadow,[0,.099,-.084],[.017,.011,.010],'skin');
    b.oval('#785148',[0,.078,-.077],[.023,.003,.003],'skin');
    // Ridged hard hat and the radio officer's lower-profile climbing helmet.
    const hat=side?'#dad9c9':'#deb46b';
    b.loft('#443b34',[[.143,.082,.077,.013],[.175,.094,.090,.01],[.199,.083,.084,.007]],'fabric');
    if (side) b.oval('#4d4037',[0,.126,.078],[.047,.059,.043],'fabric');
    b.loft(hat,[[.156,.096,.090,.011],[.165,.106,.098,.010],
      [.184,.105,.103,.011],[.211,.096,.096,.016],[.232,.079,.078,.018],
      [.248,.047,.055,.014],[.251,.019,.026,.013]],'satin');
    b.oval(hat,[0,.164,-.028],[.108,.010,side?.089:.105],'satin');
    for (const s of [-1,1]) {
      b.tube(hat,[s*.031,.240,-.026],[s*.031,.240,.056],.007,'satin');
      b.box(pale,[s*.094,.188,.008],[.003,.014,.053],'satin',[0,0,s*.24]);
    }
    b.loft('#313e3b',[[.170,.106,.098,.009],[.180,.107,.099,.009]],'fabric');
    b.box('#475453',[0,.181,-.091],[.053,.034,.023],'metal');
    b.box('#fff2c4',[0,.181,-.104],[.039,.018,.003],'lamp');
    b.flush(group);
  }

  function leg(hip,knee,ankle,sign,side) {
    const b=new Batch();
    const pant=side?'#38484b':'#414443';
    b.loft(pant,[[-.418,.057,.064,.002],[-.384,.068,.070,.003],[-.347,.069,.074,.005],[-.328,.076,.080,.006],[-.292,.067,.072,.007],[-.279,.075,.079,.005],[-.237,.073,.078],
      [-.116,.089,.095,.003],[-.035,.095,.103,.004],[.045,.083,.092,.008]],'fabric',.055);
    b.oval('#4d5550',[sign*.060,-.157,.009],[.030,.088,.067]);
    b.tube('#85897d',[sign*.087,-.117,-.042],[sign*.086,-.116,.052],.005,'satin');
    b.flush(hip);
    const c=new Batch();
    c.loft(pant,[[-.345,.056,.062,.004],[-.315,.061,.064,.005],[-.299,.057,.060,.005],[-.286,.066,.068,.005],[-.205,.064,.075,.014],
      [-.138,.073,.082,.018],[-.066,.065,.068,.006],[.038,.070,.073,.009]],'fabric',.06);
    c.oval('#424b49',[0,-.018,-.047],[.057,.079,.030],'satin');
    c.loft('#adb29b',[[-.218,.068,.071,.013],[-.195,.069,.075,.015]],'satin');
    c.flush(knee);
    const d=new Batch();
    d.oval(rubber,[0,.009,-.044],[.075,.068,.144],'satin');
    d.box('#272d2c',[0,-.035,-.054],[.137,.031,.217],'satin');
    d.oval('#414745',[0,.038,-.073],[.065,.034,.074],'satin');
    for(let j=0;j<3;j++) d.tube('#6b6657',[-.034,.060,-.052-j*.018],[.033,.060,-.056-j*.018],.003,'fabric');
    d.flush(ankle);
  }

  function arm(shoulder,elbow,sign,side) {
    const b=new Batch(), shell=shellColors[side];
    b.oval(shell,[sign*.002,-.028,.003],[.081,.086,.079]);
    b.loft(shell,[[-.254,.053,.056,-.002],[-.239,.055,.059,-.002],[-.222,.052,.055,.003],[-.212,.060,.063,.003],[-.172,.058,.064,.003],[-.134,.064,.069],
      [-.046,.080,.082],[.013,.071,.074]],'fabric',.055);
    b.loft(pale,[[-.151,.065,.071],[-.131,.066,.071]],'satin',.028);
    b.box('#344443',[sign*.061,-.096,.013],[.013,.058,.052],'fabric');
    b.flush(shoulder);
    const c=new Batch();
    c.loft(shell,[[-.215,.039,.044,-.003],[-.174,.048,.050],[-.123,.052,.056,.003],
      [-.058,.059,.064],[.02,.052,.054]],'fabric',.055);
    c.loft(dark,[[-.211,.043,.045],[-.193,.045,.047]],'fabric');
    c.oval('#49453b',[0,-.254,-.008],[.046,.064,.034],'satin');
    c.oval('#5b5848',[-sign*.032,-.237,-.019],[.020,.030,.019],'satin');
    for(let j=0;j<4;j++)
      c.oval('#424139',[(j-1.5)*.017,-.294,-.011],[.010,.021-.002*Math.abs(j-1.5),.014],'satin');
    c.flush(elbow);
  }

  const badgeTextures=new Map();
  function plaque(parent,lines,paint,at,rot,width,height) {
    const key=lines.join('|')+paint.join('|');
    let material=badgeTextures.get(key);
    if(!material) {
      const canvas=document.createElement('canvas');canvas.width=512;canvas.height=192;
      const ctx=canvas.getContext('2d');
      if (!ctx) return;
      ctx.fillStyle=paint[0];ctx.fillRect(0,0,512,192);
      ctx.fillStyle=paint[2];ctx.fillRect(0,0,15,192);
      ctx.strokeStyle=paint[1];ctx.lineWidth=3;ctx.strokeRect(23,8,482,176);
      ctx.fillStyle=paint[1];ctx.font='bold 80px "PingFang SC",sans-serif';
      ctx.fillText(lines[0],39,97,445);
      ctx.font='bold 44px monospace';ctx.fillText(lines[1],40,157,445);
      const map=new T.CanvasTexture(canvas);map.colorSpace=T.SRGBColorSpace;
      material=new T.MeshStandardMaterial({map,roughness:.68,polygonOffset:true,polygonOffsetFactor:-1});
      badgeTextures.set(key,material);
    }
    const mesh=new T.Mesh(new T.PlaneGeometry(width,height),material);
    mesh.position.fromArray(at);mesh.rotation.set(...rot);
    mesh.receiveShadow=true;parent.add(mesh);
  }

  function makePerson(side) {
    const root=new T.Group();
    const hips=joint(root,'hips',0,.904,0);
    const pelvis=new Batch();
    pelvis.oval('#3a4343',[0,-.003,.012],[.154,.107,.102]);pelvis.flush(hips);
    const chest=joint(hips,'chest',0,.087,0);
    torso(chest,side);
    const patch=side?['北岬 02','SIGNAL  /  K-2']:['北岬 01','ENGINE  /  K-1'];
    const patchColor=['#47534b','#d6d7b7',colors[side]];
    plaque(chest,patch,patchColor,[0,.263,side?.233:.213],[0,0,0],.12,.046);
    plaque(chest,patch,patchColor,[-.071,.343,-.116],[0,Math.PI-.30,0],.076,.030);
    const neck=joint(chest,'head',0,.501,0);
    head(neck,side);
    for(let i=0;i<2;i++) {
      const sign=i===0?-1:1;
      const hip=joint(hips,'thigh'+i,sign*.087,-.060,0);
      const knee=joint(hip,'shin'+i,0,-.398,0);
      const ankle=joint(knee,'boot'+i,0,-.395,0);
      leg(hip,knee,ankle,sign,side);
      const shoulder=joint(chest,'arm'+i,sign*.185,.398,0);
      const elbow=joint(shoulder,'forearm'+i,sign*.015,-.231,0);
      arm(shoulder,elbow,sign,side);
    }
    root.scale.setScalar(1.06);
    return root;
  }

  const crew=[];
  function person(side) {
    const id=side===1?1:0;
    crew[id] ||= makePerson(id);
    const root=crew[id].clone(true);
    const bones={};
    root.traverse(node=>{ if(node.isGroup && node.name) bones[node.name]=node; });
    root.userData.rig={bones,phase:id*Math.PI,pace:0,work:0,air:0,id};
    root.name=id?'沈遥':'林澈';
    animate(root,{speed:0,grounded:true,operating:false},0,0);
    return root;
  }

  function animate(actor,motion,dt,time) {
    const rig=actor.userData.rig;
    const b=rig.bones;
    const s=Math.max(0,Math.min(.12,dt||0));
    const blend=1-Math.exp(-12*s);
    rig.pace+=((Math.min(1,Math.abs(motion.speed||0)/4.7))-rig.pace)*blend;
    rig.work+=((motion.operating?1:0)-rig.work)*blend;
    rig.air+=((motion.grounded===false?1:0)-rig.air)*blend;
    rig.phase+=rig.pace*9.1*s;
    const {phase,pace,air,work}=rig;
    const groundPace=pace*(1-air);
    const breath=Math.sin(time*2.1+rig.id*2);
    b.hips.position.y=.904+groundPace*(.019*Math.cos(2*phase)-.014);
    b.hips.rotation.y=Math.sin(phase)*.068*groundPace;
    b.chest.rotation.set(-.028-.052*pace-.075*work,-.083*Math.sin(phase)*groundPace,.025*Math.cos(phase)*groundPace);
    b.chest.position.y=.087+breath*.0025;
    b.head.rotation.set(.015+.017*Math.cos(2*phase)*groundPace-.08*work,
      Math.sin(time*.55+rig.id)*.05*(1-pace),-b.chest.rotation.z*.6);
    for(let i=0;i<2;i++) {
      const angle=phase+i*Math.PI;
      const stride=Math.sin(angle);
      b['thigh'+i].rotation.x=.48*stride*groundPace+.035+air*(i===0?.44:.15);
      b['shin'+i].rotation.x=-.065-.66*Math.max(0,stride)*groundPace-air*(i===0?.65:.4);
      b['boot'+i].rotation.x=.035+.12*Math.max(0,stride)*groundPace+.12*air;
      const arm=b['arm'+i],forearm=b['forearm'+i];
      arm.rotation.x=.065-.42*stride*groundPace+.4*air+.55*work;
      arm.rotation.z=(i===0?-1:1)*(.086+.27*air+.09*work);
      forearm.rotation.x=.135+.20*pace+.16*air+(.36+.20*Math.sin(time*4.3+i*Math.PI))*work;
    }
  }

  // Stations go from the pointed stem to the transom. Cross sections narrow
  // below the waterline and flare towards the rub rail.
  const stations=[
    [-9.2,.06,1.85],[-8.35,1.24,1.69],[-6.8,2.04,1.5],[-4.6,2.32,1.39],
    [-1,2.38,1.35],[3.9,2.36,1.34],[6.9,2.20,1.34],[8.7,1.90,1.40]
  ];
  function hullPanel(b,tint,points,finish) {
    const geo=new T.BufferGeometry();
    geo.setAttribute('position',new T.Float32BufferAttribute(points.flat(),3));
    geo.setAttribute('uv',new T.Float32BufferAttribute([0,0,1,0,1,1,0,1],2));
    geo.setIndex([0,1,2,0,2,3]);
    geo.computeVertexNormals();
    b.add(geo,tint,finish,[0,0,0],[1,1,1]);
    geo.dispose();
  }
  function hull(b) {
    const levels=[[-1.02,.22,'#713c36'],[-.56,.72,'#874638'],[-.18,.88,'#4d524c'],
      [.07,.94,'#345555'],[.30,.98,'#354c4e'],[.91,1,'#c0c6b7'],[1,1,'#b2b6a8']];
    function edge(station,side,i) {
      const [z,w,deck]=station,[height,width]=levels[i];
      const y=i>=levels.length-2?deck-(i===levels.length-2?.12:0):height;
      return [side*w*width,y,z];
    }
    for(let i=1;i<stations.length;i++) {
      const fore=stations[i-1], aft=stations[i], last=levels.length-1;
      for(const side of [-1,1]) {
        for(let j=0;j<last;j++) {
          const points=[edge(fore,side,j),edge(fore,side,j+1),edge(aft,side,j+1),edge(aft,side,j)];
          hullPanel(b,levels[j][2],side===1?points:points.reverse(),'satin');
        }
        for(const [height,r,tint] of [[.24,.052,'#242e2d'],[.31,.021,'#8a9186']]) {
          const a=edge(fore,side,last),z=edge(aft,side,last);
          a[1]-=height; z[1]-=height;
          b.tube(tint,a,z,r,'satin');
        }
      }
      hullPanel(b,'#647675',[edge(fore,-1,last),edge(aft,-1,last),edge(aft,1,last),edge(fore,1,last)],'satin');
    }
    const stern=stations[stations.length-1], last=levels.length-1;
    for(let i=0;i<last;i++) hullPanel(b,levels[i][2],
      [edge(stern,-1,i),edge(stern,1,i),edge(stern,1,i+1),edge(stern,-1,i+1)],'satin');
    for(const side of [-1,1]) {
      for(let z=-6.4;z<8.0;z+=1.65) {
        const w=z<-5?2.11:z>6?2.15:2.35;
        b.oval('#1f302f',[side*w,.78,z],[.025,.15,.18],'glass');
        b.tube('#27322f',[side*(w-.01),1.31,z+.36],[side*(w+.11),.75,z+.36],.023,'fabric');
        b.oval('#232a27',[side*(w+.1),.75,z+.36],[.125,.27,.12],'satin');
      }
    }
  }

  function rails(b) {
    for(const side of [-1,1]) {
      let last=null;
      for(const [z,w,deck] of stations) {
        const now=[side*(w-.06),deck+.7,z];
        b.tube('#a6aea2',[now[0],deck,now[2]],now,.031);
        if(last) {
          b.tube(steel,now,last,.030);
          b.tube('#8d9a90',[now[0],now[1]-.33,z],[last[0],last[1]-.33,last[2]],.018);
          const len=Math.abs(last[2]-z);
          for(let k=1;k<Math.ceil(len/1.5);k++){
            const f=k/Math.ceil(len/1.5);
            const x=now[0]+(last[0]-now[0])*f;
            const y=now[1]+(last[1]-now[1])*f;
            const pz=z+(last[2]-z)*f;
            b.tube(steel,[x,y-.7,pz],[x,y,pz],.022);
          }
        }
        last=now;
      }
    }
    for(let y=1.75;y<=2.11;y+=.35) b.tube(steel,[-1.86,y,8.7],[1.86,y,8.7],.027);
  }

  let shipTemplate;
  function ferry() {
    if (shipTemplate) return shipTemplate.clone(true);
    const ship=new T.Group();
    ship.name='海雁号';
    const b=new Batch();
    hull(b);rails(b);
    // Two passenger decks, a raised wheelhouse with slanted front glazing.
    b.box('#879c93',[0,1.47,.60],[3.64,.24,10.85]);
    b.box('#ced0bc',[0,2.22,.43],[3.43,1.49,10.51]);
    b.box('#44706e',[0,1.74,.43],[3.48,.24,10.54]);
    b.box('#a59f87',[0,2.99,.38],[3.75,.13,10.82]);
    b.box('#47716f',[0,3.07,.4],[3.78,.07,10.80]);
    for(const side of [-1,1]){
      for(let j=0;j<10;j++) {
        const z=-4.14+j*.99;
        b.box('#747e74',[side*1.72,2.35,z],[.040,.72,.87],'metal');
        b.box(j%4===0?'#c0a572':'#596f6a',[side*1.744,2.36,z],[.016,.621,.767],'glass');
        b.box('#84938b',[side*1.756,2.36,z+.016],[.018,.62,.032],'metal');
        if(j%3===2) b.box('#ffdaa0',[side*1.757,2.65,z],[.018,.033,.44],'lamp');
      }
      for(let j=0;j<2;j++) {
        const z=3.06+j*2.30;
        b.ring('#d3653e',[side*1.84,2.02,z],[.24,.24,.24],[0,Math.PI/2,0],true);
        for(let k=0;k<4;k++){
          const a=k*Math.PI/2+.32;
          b.box('#ded8c2',[side*1.85,2.02+.237*Math.sin(a),z+.237*Math.cos(a)],[.122,.081,.087],'satin',[a,0,0]);
        }
      }
      b.oval('#dcdccd',[side*1.25,3.32,2.7],[.32,.26,1.22],'satin');
      for(let j=0;j<3;j++)b.box('#697772',[side*1.25,3.34,1.97+j*.70],[.635,.23,.055],'satin');
    }
    b.box('#b0b7a9',[0,3.54,-2.4],[2.96,.86,3.30]);
    b.box('#d4d2bb',[0,4.09,-2.46],[3.18,.84,3.43]);
    for(let i=0;i<5;i++){
      b.box('#515e59',[-1.24+.62*i,4.11,-4.19],[.60,.64,.046],'metal',[-.10,0,0]);
      b.box('#3d514e',[-1.24+.62*i,4.12,-4.22],[.53,.56,.027],'glass',[-.10,0,0]);
      b.tube('#263532',[-1.39+.62*i,3.90,-4.25],[-1.16+.62*i,4.13,-4.235],.010);
    }
    for(const side of [-1,1]) {
      for(let j=0;j<3;j++)b.box('#405755',[side*1.608,4.12,-3.52+j*1.01],[.024,.55,.88],'glass');
      b.box('#917a59',[side*1.51,3.54,-1.01],[.055,.79,.60],'satin');
      b.box('#273b3b',[side*1.55,3.70,-1.02],[.025,.30,.36],'glass');
      b.box('#303d36',[side*1.65,4.49,-2.66],[.22,.13,.34],'metal');
      b.oval(side===1?'#8af6ac':'#f38767',[side*1.72,4.54,-2.68],[.085,.055,.10],'lamp');
    }
    b.box('#66736c',[0,4.56,-2.49],[3.52,.10,3.68],'metal');
    b.add(cylinder,'#cdcfbb','satin',[0,5.30,-2.22],[.067,1.54,.067]);
    b.tube(steel,[-.70,5.53,-2.22],[.70,5.53,-2.22],.031);
    b.box('#edeadb',[0,6.10,-2.22],[.82,.10,.20],'satin');
    b.tube(steel,[.58,4.59,-1.15],[.65,6.38,-1.10],.017);
    b.oval('#ffe2ab',[0,5.85,-2.24],[.08,.08,.08],'lamp');
    b.add(cylinder,'#7d8278','metal',[0,3.70,.48],[.32,1.20,.27],[.08,0,0]);
    b.add(cylinder,'#47524d','satin',[0,4.21,.53],[.34,.20,.29],[.08,0,0]);
    // Foredeck mooring fittings, stern boarding gate, equipment and coiled line.
    b.box('#888d81',[0,1.56,-6.26],[1.15,.22,.82],'metal');
    b.add(cylinder,'#414f49','metal',[0,1.83,-6.3],[.29,.34,.29]);
    for(let k=0;k<4;k++)b.ring('#88765a',[.76,1.56+k*.055,-5.82],[.33,.33,.33],[Math.PI/2,0,0],false,'fabric');
    for(const s of [-1,1]) {
      for(const z of [-6.8,6.94]){
        b.add(cylinder,'#626960','metal',[s*1.15,1.55,z],[.12,.36,.12]);
        b.add(cylinder,'#848d7e','metal',[s*1.15,1.76,z],[.17,.07,.17]);
      }
      b.tube(steel,[s*.25,1.45,6.05],[s*.25,3.1,5.45],.03);
    }
    for(let j=0;j<7;j++)b.tube(steel,[-.25,1.55+j*.228,6.01-j*.084],[.25,1.55+j*.228,6.01-j*.084],.022);
    b.flush(ship);
    for(const side of [-1,1]){
      plaque(ship,['海 雁','HAI YAN  /  04'],['#3c5452','#e3d9b8','#a6724c'],[side*2.376,.52,2.75],[0,side*Math.PI/2,0],1.59,.48);
    }
    plaque(ship,['海 雁','NORTH CAPE FERRY'],['#b9c1b1','#384d4e','#986d45'],[0,2.14,-4.837],[0,Math.PI,0],1.75,.63);
    shipTemplate=ship;
    return ship.clone(true);
  }

  window.TideActors=Object.freeze({person,animate,ferry});
})();
