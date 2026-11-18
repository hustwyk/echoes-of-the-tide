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

  function weaveMap(uri) {
    const map=new T.TextureLoader().load(uri);map.wrapS=map.wrapT=T.RepeatWrapping;
    map.repeat.set(2.1,1.7);map.anisotropy=6;return map;
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

  // Small chips pick up a different sheen from the moulded shell beneath them.
  function shellFinish(){
    const c=document.createElement('canvas');c.width=768;c.height=384;
    const g=c.getContext('2d');g.fillStyle='#eae7dc';g.fillRect(0,0,c.width,c.height);
    let seed=603;
    const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
    for(let i=0;i<8500;i++){
      const x=random()*c.width,y=random()*c.height;
      g.strokeStyle=i%6?'rgba(85,74,57,.12)':'rgba(255,255,244,.74)';
      g.lineWidth=.32+random()*.75;g.beginPath();g.moveTo(x,y);
      g.quadraticCurveTo(x-1,y+2,x+random()*5-3,y+random()*(i%13?3:16));g.stroke();
    }
    const rim=g.createLinearGradient(0,0,0,c.height);
    rim.addColorStop(0,'rgba(153,140,100,.02)');rim.addColorStop(.87,'rgba(88,71,42,0)');
    rim.addColorStop(1,'rgba(83,68,44,.30)');g.fillStyle=rim;g.fillRect(0,0,c.width,c.height);
    const m=new T.CanvasTexture(c);m.colorSpace=T.SRGBColorSpace;m.anisotropy=6;
    return new T.MeshPhysicalMaterial({map:m,vertexColors:true,roughness:.55,clearcoat:.30,clearcoatRoughness:.32});
  }

  const finishes = {
    shell:shellFinish(),
    fabric: new T.MeshPhysicalMaterial({vertexColors:true,roughness:.77,map:clothPattern(),
      normalMap:weaveMap(TideWeave[0]),normalScale:new T.Vector2(.50,.50),
      roughnessMap:weaveMap(TideWeave[1]),clearcoat:.24,clearcoatRoughness:.37}),
    satin: new T.MeshStandardMaterial({vertexColors:true, roughness:.44, metalness:.13}),
    metal: new T.MeshStandardMaterial({vertexColors:true, roughness:.32, metalness:.6}),
    glass: new T.MeshStandardMaterial({vertexColors:true, roughness:.16, metalness:.52}),
    lamp: new T.MeshBasicMaterial({vertexColors:true, toneMapped:false}),
  };

  const coatSheet=new T.TextureLoader().load(TideJacketAtlas);
  coatSheet.colorSpace=T.SRGBColorSpace;coatSheet.anisotropy=8;
  const jacket=finishes.fabric.clone();jacket.map=coatSheet;jacket.clearcoat=.30;
  jacket.onBeforeCompile=shader=>{
    shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nattribute vec4 tailoring;attribute float backPanel;varying vec4 garmentUV;varying float panelMix;')
      .replace('#include <uv_vertex>','#include <uv_vertex>\ngarmentUV=tailoring;panelMix=backPanel;');
    shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying vec4 garmentUV;varying float panelMix;')
      .replace('#include <map_fragment>',`vec3 cloth=mix(texture2D(map,garmentUV.xy).rgb,texture2D(map,garmentUV.zw).rgb,panelMix);
        diffuseColor.rgb*=clamp(dot(cloth,vec3(.2126,.7152,.0722))*3.3,.045,1.55);`);
  };
  finishes.jacket=jacket;
  function panelUV(point,panel,sign){
    let fx,bx,py;
    if(panel==='body'){
      fx=196-point.x*565;bx=577+point.x*565;
      py=T.MathUtils.clamp(487-(point.y+.108)*738,18,489);
      const narrow=T.MathUtils.smoothstep(py,54,108);
      const width=47+65*narrow,fit=.61+.39*narrow;
      fx=196+(fx-196)*fit;bx=577+(bx-577)*fit;
      fx=T.MathUtils.clamp(fx,196-width,196+width);bx=T.MathUtils.clamp(bx,577-width,577+width);
    }else{
      const upper=panel==='sleeve',t=T.MathUtils.clamp(upper?(.035-point.y)/.29:(.019-point.y)/.23,0,1);
      const offset=upper?118+31*t:149+13*t;
      fx=196-sign*offset-point.x*298;bx=577+sign*offset+point.x*298;
      py=upper?109+170*t:278+176*t;
      if(upper){
        const edge=11*(1-t),center=196-sign*offset;
        fx=T.MathUtils.clamp(fx,center-21+edge,center+21-edge);
        bx=T.MathUtils.clamp(bx,577+sign*offset-21+edge,577+sign*offset+21-edge);
      }
    }
    return [fx/768,1-py/512,bx/768,1-py/512];
  }

  // Shapes arrive in the local coordinates of their joint. Flatten them once;
  // the finished geometry and materials are shared by later character clones.
  class Batch {
    constructor(panel='body',sign=0) { this.parts=new Map();this.panel=panel;this.sign=sign; }

    add(shape, tint, finish, at, size, rotation) {
      let data = this.parts.get(finish);
      if (!data) {
        data = {position:[], normal:[], color:[], uv:[], tailoring:[], backPanel:[], index:[]};
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
        if(finish==='jacket'){
          data.tailoring.push(...panelUV(v,this.panel,this.sign));
          data.backPanel.push(T.MathUtils.smoothstep(n.z,-.30,.30));
        }
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
        if(d.tailoring.length){
          shape.setAttribute('tailoring',new T.Float32BufferAttribute(d.tailoring,4));
          shape.setAttribute('backPanel',new T.Float32BufferAttribute(d.backPanel,1));
        }
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
    const cloth=folds>0&&rings.length>5;
    const seg=cloth?56:40,positions=[],uvs=[],indices=[];
    const original=rings;
    if(cloth){
      rings=[];
      for(let j=0;j<original.length-1;j++){
        const a=original[j],b=original[j+1],parts=Math.max(1,Math.ceil((b[0]-a[0])/.009));
        for(let m=0;m<parts;m++)rings.push(Array.from({length:5},(_,i)=>(a[i]||0)+((b[i]||0)-(a[i]||0))*m/parts));
      }
      rings.push(original.at(-1));
    }
    for (let j=0;j<rings.length;j++) {
      const [y,w,d,z=0,x=0]=rings[j];
      for (let k=0;k<=seg;k++) {
        const a=TAU*k/seg;
        const h=(y-rings[0][0])/(rings.at(-1)[0]-rings[0][0]||1);
        const gather=(1-h)*.64+.27;
        const seam=Math.sin(a*4.0+h*4.9)*.036+Math.sin(a*2.0-h*5)*.029;
        const diagonal=(h+seam+.11*Math.sin(a+.7))*Math.PI*8.0;
        const compression=Math.max(0,Math.cos(diagonal))**5;
        const f=1+folds*(.56*Math.sin(5*a+h*5)+.28*Math.sin(9*a-h*2)+
          (cloth?gather*(1.55*compression-.33*Math.cos(diagonal-.95)):0));
        positions.push(x+w*Math.sin(a)*f,y,z-d*Math.cos(a)*f);
        uvs.push(k/seg,(y-rings[0][0])/(rings.at(-1)[0]-rings[0][0]||1));
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
    b.loft(shell,body,'jacket',.055);
    b.loft(dark,[[-.108,.163,.127,.012],[-.097,.178,.136,.012]],'fabric',.035);
    b.loft('#72817b',[[.292,.189,.131,.011],[.305,.193,.133,.011]],'satin');
    b.loft(shell,[[.432,.112,.095,.014],[.459,.117,.092,.013],[.481,.105,.085,.01],[.518,.089,.078,.004],[.529,.089,.078,.004]],'jacket',.034);
    // Hood gathered below the helmet and a sealed front zip.
    b.oval(shell,[0,.430,.089],[.145,.070,.071],'jacket',[.12,0,0]);
    function front(x,y){
      let j=0;while(j<body.length-2&&body[j+1][0]<y)j++;
      const a=body[j],b=body[j+1],t=(y-a[0])/(b[0]-a[0]);
      const w=a[1]+(b[1]-a[1])*t,d=a[2]+(b[2]-a[2])*t;
      return (a[3]||0)+((b[3]||0)-(a[3]||0))*t-d*Math.sqrt(Math.max(.045,1-(x/w)**2))-.009;
    }
    function strap(sign,from,to,width,tint,raise){
      const pos=[],uv=[],idx=[];
      for(let j=0;j<=18;j++){
        const f=j/18,y=from+(to-from)*f,m=(.15-.057*Math.sin((y-.07)/.38*1.28))*sign;
        for(const edge of [-1,1]){
          const x=m+edge*width*.5;pos.push(x,y,front(x,y)-raise);uv.push(edge*.5+.5,f*5);
        }
        if(j<18){const k=j*2;idx.push(k,k+2,k+1,k+1,k+2,k+3);}
      }
      const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();
      b.add(g,tint,'fabric',[0,0,0],[1,1,1]);g.dispose();
    }
    b.box(steel,[.003,.387,front(0,.387)-.004],[.009,.017,.005],'metal');
    b.loft(webbing,[[.060,.175,.137,.007],[.089,.177,.140,.007]],'fabric');
    b.box('#7c8882',[0,.079,-.136],[.038,.027,.012],'metal');
    for (const s of [-1,1]) {
      strap(s,.075,.452,.032,webbing,.002);
      strap(s,.328,.407,.018,'#aeb6a6',.0035);
      b.box('#777965',[s*.122,.189,front(s*.122,.189)-.004],[.034,.016,.004],'metal',[0,-s*.3,0]);
      b.tube('#9a855e',[s*.165,.133,-.072],[s*.162,.150,-.080],.003,'fabric');
      b.tube(trim,[s*.168,.234,-.046],[s*.184,.354,-.055],.006,'fabric');
      b.tube('#737364',[s*.063,.172,-.119],[s*.151,.19,-.10],.006,'satin');
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
    TideCrew.face(group,side);
    const helmet=joint(group,'helmet',0,.012,0);
    for(const sign of [-1,1]){
      b.tube('#363c38',[sign*.080,.177,-.019],[sign*.066,.067,-.029],.003,'fabric');
      b.tube('#363c38',[sign*.066,.067,-.029],[sign*.035,.038,-.045],.0027,'fabric');
    }
    b.flush(group);
    const shell=new Batch();
    const hat=side?'#d4d4c4':'#d5a453';
    shell.loft('#35332d',[[.151,.087,.080,.010],[.163,.096,.092,.010],[.184,.093,.088,.008]],'fabric');
    shell.loft(hat,[[.158,.096,.089,.009],[.160,.102,.097,.007],[.169,.104,.101,.008],
      [.181,.104,.102,.009],[.196,.102,.099,.009],[.212,.096,.094,.011],[.227,.084,.084,.012],
      [.239,.069,.071,.013],[.247,.050,.056,.013],[.252,.029,.035,.011],[.254,.008,.015,.010]],'shell');
    shell.oval(hat,[0,.163,-.023],[.108,.0057,side?.097:.116],'shell',[.027,0,0]);
    shell.loft('#3d4946',[[.175,.105,.103,.009],[.184,.106,.104,.010]],'fabric');
    for(const s of [-1,1]){
      for(let j=0;j<7;j++){
        const a=-.83+j*.23,b=a+.23;
        const p=t=>[s*(.034+.010*Math.cos(t)),.246-.018*Math.sin(t)**2,.011+.082*Math.sin(t)];
        shell.tube(hat,p(a),p(b),.0034,'shell');
      }
      for(let j=0;j<3;j++){
        const z=-.020+j*.016;
        shell.oval('#565a50',[s*.097,.202,z],[.002,.0035,.006],'satin',[.15,0,0]);
      }
      shell.box(pale,[s*.103,.186,.026],[.0025,.009,.044],'shell',[0,s*.15,s*.15]);
      shell.box('#605c4e',[s*.104,.173,-.020],[.004,.020,.023],'metal');
      shell.oval('#c0bbb0',[s*.107,.174,-.020],[.002,.003,.003],'metal');
    }
    shell.box('#37423f',[0,.187,-.092],[.049,.032,.018],'satin',[.085,0,0]);
    shell.tube('#728079',[0,.187,-.099],[0,.187,-.113],.018,'metal');
    shell.ring('#2c3938',[0,.187,-.113],[.014,.014,.013],[0,0,0],true,'satin');
    shell.oval('#acae96',[0,.187,-.113],[.012,.012,.003],'glass');
    shell.oval('#fff4cd',[0,.187,-.116],[.0048,.0048,.002],'lamp');
    for(const s of [-1,1])shell.box('#a7b3a4',[s*.020,.189,-.103],[.0025,.012,.0027],'metal');
    shell.flush(helmet);joint(helmet,'headlamp',0,.187,-.121);
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

  function arm(shoulder,elbow,wrist,sign,side) {
    const b=new Batch('sleeve',sign), shell=shellColors[side];
    b.oval(shell,[sign*.002,-.028,.003],[.081,.086,.079],'jacket');
    b.loft(shell,[[-.254,.053,.056,-.002],[-.239,.055,.059,-.002],[-.222,.052,.055,.003],[-.212,.060,.063,.003],[-.172,.058,.064,.003],[-.134,.064,.069],
      [-.046,.080,.082],[.013,.071,.074]],'jacket',.055);
    b.loft(pale,[[-.151,.065,.071],[-.131,.066,.071]],'satin',.028);
    b.box('#344443',[sign*.061,-.096,.013],[.013,.058,.052],'fabric');
    b.flush(shoulder);
    const c=new Batch('forearm',sign);
    c.loft(shell,[[-.215,.039,.044,-.003],[-.174,.048,.050],[-.123,.052,.056,.003],
      [-.058,.059,.064],[.02,.052,.054]],'jacket',.055);
    c.loft(dark,[[-.211,.043,.045],[-.193,.045,.047]],'fabric');
    c.flush(elbow);
    const hand=new Batch();
    hand.loft('#545144',[[-.085,.027,.018,-.008],[-.066,.038,.022,-.005],[-.034,.040,.025],
      [-.013,.033,.023],[.011,.031,.022]],'fabric',.017);
    hand.oval('#41443b',[0,-.048,.011],[.034,.033,.013],'fabric');
    for(let i=0;i<4;i++){
      const x=(i-1.5)*.0172,tip=-.113+.005*Math.abs(i-1.5);
      hand.tube('#525044',[x,-.067,-.002],[x,-.092,-.009],.0085,'fabric');
      hand.tube('#48483e',[x,-.092,-.009],[x,tip,-.019],.008,'fabric');
      hand.oval('#4a4b42',[x,tip,-.019],[.008,.009,.008],'fabric');
      hand.box('#697065',[x,-.066,.013],[.010,.006,.002],'satin');
    }
    hand.tube('#524f42',[-sign*.028,-.037,-.008],[-sign*.041,-.058,-.024],.012,'fabric');
    hand.tube('#47473c',[-sign*.041,-.058,-.024],[-sign*.035,-.075,-.034],.010,'fabric');
    hand.flush(wrist);
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
      const wrist=joint(elbow,'wrist'+i,0,-.208,0);
      arm(shoulder,elbow,wrist,sign,side);
    }
    if(side){chest.scale.x=.94;hips.scale.x=.97;}
    root.scale.setScalar(side?1.035:1.07);
    return root;
  }

  const crew=[];
  function person(side) {
    const id=side===1?1:0;
    crew[id] ||= makePerson(id);
    const root=crew[id].clone(true);
    const bones={};
    root.traverse(node=>{ if(node.isGroup && node.name) bones[node.name]=node; });
    root.userData.rig={bones,face:root.getObjectByName('face'),phase:id*Math.PI,pace:0,work:0,air:0,id};
    root.name=id?'沈遥':'林澈';
    animate(root,{speed:0,grounded:true,operating:false},0,0);
    return root;
  }

  const axis=new T.Vector3(),pole=new T.Vector3(),elbowAt=new T.Vector3(),reach=new T.Vector3();
  const palmOffset=new T.Vector3(0,-.263,-.005),armRotation=new T.Quaternion(),foreRotation=new T.Quaternion();
  function handleArm(chest,arm,fore,goal,side,weight){
    // Solve both hinges against the handle after it has moved. The elbow pole
    // points out and back so a hand crossing the torso takes a natural path.
    reach.copy(goal);chest.worldToLocal(reach);reach.sub(arm.position);
    const l1=fore.position.length(),l2=palmOffset.length(),dist=T.MathUtils.clamp(reach.length(),.08,l1+l2-.0002);
    axis.copy(reach).normalize();pole.set(side?1:-1,-.24,.54);
    pole.addScaledVector(axis,-pole.dot(axis)).normalize();
    const along=(l1*l1-l2*l2+dist*dist)/(2*dist);
    elbowAt.copy(axis).multiplyScalar(along).addScaledVector(pole,Math.sqrt(Math.max(0,l1*l1-along*along)));
    armRotation.setFromUnitVectors(reach.copy(fore.position).normalize(),axis.copy(elbowAt).normalize());
    reach.copy(goal);chest.worldToLocal(reach);reach.sub(arm.position).setLength(dist).sub(elbowAt).normalize().applyQuaternion(foreRotation.copy(armRotation).invert());
    foreRotation.setFromUnitVectors(elbowAt.copy(palmOffset).normalize(),reach);
    arm.quaternion.slerp(armRotation,weight);fore.quaternion.slerp(foreRotation,weight);
  }

  // Scratch space for the two leg chains. Targets are in actor metres before the root scale.
  const legDown=new T.Vector3(0,-1,0),legUp=new T.Vector3(0,1,0);
  const footGoal=new T.Vector3(),legAxis=new T.Vector3(),kneePole=new T.Vector3(),kneePoint=new T.Vector3();
  const anklePlane=new T.Vector3(),palmMid=new T.Vector3(),shoulderMid=new T.Vector3();
  const inversePelvis=new T.Matrix4(),localRotation=new T.Quaternion(),soleRotation=new T.Quaternion();
  const soleEuler=new T.Euler(0,0,0,'YXZ');
  const gaitClamp=T.MathUtils.clamp,gaitMix=T.MathUtils.lerp;
  const easeStep=(a,b,x)=>T.MathUtils.smoothstep(x,a,b);
  const wrapAngle=x=>Math.atan2(Math.sin(x),Math.cos(x));

  function placeLeg(b,i,x,y,z,plane,pitch,yaw,roll) {
    const thigh=b['thigh'+i],shin=b['shin'+i],boot=b['boot'+i];
    footGoal.set(x,y,z).applyMatrix4(inversePelvis).sub(thigh.position);
    const upper=-shin.position.y,lower=-boot.position.y;
    const length=gaitClamp(footGoal.length(),.18,upper+lower-.00005);
    legAxis.copy(footGoal).normalize();
    kneePole.set(i?.065:-.065,0,-1);
    kneePole.addScaledVector(legAxis,-kneePole.dot(legAxis)).normalize();
    const along=(upper*upper-lower*lower+length*length)/(2*length);
    kneePoint.copy(legAxis).multiplyScalar(along).addScaledVector(kneePole,Math.sqrt(Math.max(0,upper*upper-along*along)));
    thigh.quaternion.setFromUnitVectors(legDown,footGoal.copy(kneePoint).normalize());
    footGoal.copy(legAxis).multiplyScalar(length).sub(kneePoint).normalize().applyQuaternion(localRotation.copy(thigh.quaternion).invert());
    shin.quaternion.setFromUnitVectors(legDown,footGoal);
    soleRotation.setFromUnitVectors(legUp,plane).multiply(localRotation.setFromEuler(soleEuler.set(pitch,yaw,roll,'YXZ')));
    localRotation.copy(b.hips.quaternion).multiply(thigh.quaternion).multiply(shin.quaternion).invert();
    boot.quaternion.copy(localRotation.multiply(soleRotation));
  }

  // The real boot has a rounded tread under the instep and a flat heel/toe slab.
  // Compensate for the changing support point when the heel rolls off the ground.
  function treadHeight(pitch){
    const c=Math.cos(pitch),s=Math.sin(pitch);
    return Math.max(Math.hypot(.068*c,.144*s)-.009*c-.044*s,.035*c-.054*s+.0155*Math.abs(c)+.1085*Math.abs(s));
  }

  function animate(actor,motion,dt,time) {
    const rig=actor.userData.rig,b=rig.bones;
    TideCrew.express(rig.face,rig.id,time,!!motion.talking);
    const s=gaitClamp(Number.isFinite(dt)?dt:0,0,.12),blend=1-Math.exp(-s*14),slow=1-Math.exp(-s*8.5);
    const ground=motion.grounded!==false,grips=motion.grips,hang=motion.swing;
    const ride=!!(hang&&hang.phase==='ride'&&grips),reaching=!!(hang&&hang.phase==='reach'&&grips);
    const yaw=Number.isFinite(motion.yaw)?motion.yaw:actor.rotation.y,co=Math.cos(yaw),si=Math.sin(yaw);
    const speed=Math.max(0,Number.isFinite(motion.speed)?Math.abs(motion.speed):Math.hypot(motion.vx||0,motion.vz||0));
    const st=rig.locomotion||(rig.locomotion={
      phase:rig.id*.5+.17,ground,flight:0,vy:0,impact:0,impactAge:1,launch:0,launchHeld:false,leftLead:rig.id,
      x:actor.position.x,y:actor.position.y,z:actor.position.z,yaw,vx:0,vz:0,travelX:0,travelZ:0,
      run:0,move:0,brake:0,tilt:0,sway:0,reach:0,hangOffset:new T.Vector3(),
      feet:[{planted:false},{planted:false}]
    });
    const dx=actor.position.x-st.x,dz=actor.position.z-st.z,measured=Math.hypot(dx,dz);
    const reset=measured>Math.max(1.2,speed*s*3+.31)||Math.abs(actor.position.y-st.y)>1.65;
    const vx=Number.isFinite(motion.vx)?motion.vx:-si*speed,vz=Number.isFinite(motion.vz)?motion.vz:-co*speed;
    const horizontal=Math.hypot(vx,vz),dirX=horizontal>.025?vx/horizontal:-si,dirZ=horizontal>.025?vz/horizontal:-co;
    const vy=Number.isFinite(motion.vy)?motion.vy:s>.00001&&!reset?(actor.position.y-st.y)/s:0;
    let distance=0;
    if(Number.isFinite(motion.strideDistance))distance=Math.max(0,motion.strideDistance);
    else if(speed>.025&&!reset){
      if(Number.isFinite(motion.vx)&&Number.isFinite(motion.vz)){
        // Input can keep a velocity while a wall prevents any actual step.
        distance=Math.min(Math.max(0,dx*dirX+dz*dirZ),horizontal*s*1.22);
      }else distance=measured>.00001?measured:speed*s;
    }
    if(reset){distance=0;st.feet.forEach(f=>{f.planted=false;});st.hangOffset.set(0,0,0);st.impact=0;st.launch=0;}
    if(!s||!ground||ride||motion.climbing)distance=0;
    distance=Math.min(distance,Math.max(.025,s*(speed+2.5)));
    const wasGround=st.ground;
    const launchHeld=motion.launch===true||motion.launch>.50;
    const launching=(!ground&&wasGround&&!ride)||(launchHeld&&!st.launchHeld);
    if(launching){st.launch=1;st.leftLead=st.phase<.5?0:1;}
    else st.launch*=Math.exp(-s*9);
    st.launchHeld=launchHeld;
    if(ground&&!wasGround&&!ride&&!motion.climbing&&!reset){
      st.impact=Math.max(.15,gaitClamp((-st.vy-1.0)/6.9,0,1),gaitClamp(Number(motion.landing)||0,0,1));
      st.impactAge=0;st.phase=st.leftLead===0?.035:.535;st.feet[0].planted=st.feet[1].planted=false;
    }else st.impactAge+=s;
    const impactPhase=gaitClamp(st.impactAge/.32,0,1);
    const suppliedImpact=gaitClamp(Number(motion.landing)||0,0,1);
    const impact=ground?Math.max(st.impact*Math.sin(Math.PI*impactPhase)*(1-.37*impactPhase),suppliedImpact*.53):0;
    const deltaSpeed=s>.00001&&!reset?(horizontal-Math.hypot(st.vx,st.vz))/s:0;
    const turn=s>.00001&&!reset?wrapAngle(yaw-st.yaw)/s:0;
    const previousSpeed=Math.hypot(st.vx,st.vz);
    const reversal=previousSpeed>.8&&horizontal>.5?Math.max(0,-(vx*st.vx+vz*st.vz)/(previousSpeed*horizontal)):0;
    st.brake=Math.max(st.brake*Math.exp(-s*7.6),ground?gaitClamp(-deltaSpeed/33,0,1)*Math.min(1,previousSpeed/2.0):0,ground?reversal*.81:0);
    st.tilt+=((ground?gaitClamp(deltaSpeed/32,-1,1):0)-st.tilt)*slow;
    st.sway+=(gaitClamp(turn*horizontal*.058,-1,1)-st.sway)*slow;
    st.run+=(easeStep(2.05,5.30,speed)-st.run)*blend;
    st.move+=(easeStep(.045,1.04,speed)-st.move)*blend;
    st.flight+=((ground?0:1)-st.flight)*(1-Math.exp(-s*(ground?21:19)));
    rig.work+=((motion.operating||ride||reaching?1:0)-rig.work)*blend;
    const work=rig.work,run=st.run,move=st.move,air=st.flight;
    const cycle=gaitMix(1.15,1.35,easeStep(.35,2.05,speed))+1.51*run;
    const stance=gaitMix(.577,.302,run);
    st.phase=(st.phase+distance/cycle)%1;st.travelX+=dirX*distance;st.travelZ+=dirZ*distance;
    rig.phase=st.phase*TAU;rig.pace=move;rig.air=air;
    const phase=rig.phase,stride=Math.sin(phase),turnLean=ground?st.sway*move:0;
    const rise=easeStep(.16,4.1,vy),fall=easeStep(.21,5.6,-vy),apex=1-Math.max(rise,fall);
    const sky=ride?1:air,unloaded=1-sky;
    const handY=grips?Math.min(grips[0].y,grips[1].y)-actor.position.y:1.2;
    const squat=grips&&!ride&&!reaching?gaitClamp(1.39-(handY+.28)/actor.scale.y,0,.50)*work:0;
    const breath=Math.sin(time*2.1+rig.id*2);
    const effort=hang?gaitClamp(hang.effort||0,-1,1):0,angle=hang?gaitClamp(hang.angle||0,-1.30,1.30):0,angular=hang?gaitClamp(hang.omega||0,-4,4):0;
    const nx=ground?gaitClamp(motion.slopeX||0,-.85,.85):0,nz=ground?gaitClamp(motion.slopeZ||0,-.85,.85):0;
    const ny=Math.sqrt(Math.max(.10,1-nx*nx-nz*nz));
    // Make room for the farther, downhill support foot without lengthening either shin.
    const slopeDrop=Math.min(.19,(.073+.255*move)*Math.hypot(nx,nz)/ny);
    const contactWave=Math.cos(phase*2-stance*TAU);
    b.hips.position.set(0,.891-(.069+.052*run)*move*unloaded+(.013+.020*run)*contactWave*move*unloaded
      -.166*impact-.064*st.brake-.044*air-.012*apex*air-squat-slopeDrop,0);
    b.hips.rotation.set(0,.065*stride*move*unloaded,turnLean*.020);
    b.chest.position.set(0,.087+breath*.0026,0);
    b.chest.rotation.set(-.024-(.049+.115*run)*move*unloaded-.044*st.tilt+.11*st.brake-.18*impact
      -.083*work-.35*squat+air*(-.16*rise+.055*fall),-.094*stride*move*unloaded,
      .023*Math.cos(phase)*move*unloaded+turnLean*.077);
    b.head.rotation.set(.014-.075*work-(motion.incline||0)-b.chest.rotation.x*.24-.067*st.launch+.054*fall*air,
      Math.sin(time*.55+rig.id)*.05*(1-move)+(motion.gaze||0),-b.chest.rotation.z*.68);
    if(ride||reaching){
      st.reach=ride?1:Math.min(1,st.reach+s*9.5);
      const weight=st.reach,hangPitch=gaitClamp(angle*.51-angular*.038,-.70,.70);
      b.chest.rotation.x=gaitMix(b.chest.rotation.x,-.035-hangPitch*.41-effort*.089,weight);
      b.chest.rotation.y*=1-weight;b.chest.rotation.z*=1-weight;
      b.hips.rotation.set(0,b.hips.rotation.y*(1-weight),0);
      // Match the shoulder midpoint to the known moving ring, including body scale, before solving either arm.
      palmMid.copy(grips[0]).add(grips[1]).multiplyScalar(.5);actor.worldToLocal(palmMid);
      b.chest.updateMatrix();b.hips.updateMatrix();
      shoulderMid.set(0,b.arm0.position.y,0).applyMatrix4(b.chest.matrix).applyMatrix4(b.hips.matrix);
      palmMid.y-=.399*Math.cos(hangPitch);palmMid.z+=.399*Math.sin(hangPitch);
      st.hangOffset.copy(palmMid.sub(shoulderMid)).multiplyScalar(weight);
      b.head.rotation.x+=(-.11+hangPitch*.20)*weight;
    }else{
      st.reach=0;st.hangOffset.multiplyScalar(Math.exp(-s*18));
      if(st.hangOffset.lengthSq()<.0000003)st.hangOffset.set(0,0,0);
    }
    b.hips.position.add(st.hangOffset);
    b.hips.updateMatrix();inversePelvis.copy(b.hips.matrix).invert();
    anklePlane.set(co*nx-si*nz,ny,si*nx+co*nz).normalize();
    const localDX=co*dirX-si*dirZ,localDZ=si*dirX+co*dirZ;
    for(let i=0;i<2;i++){
      const sign=i?1:-1,u=(st.phase+i*.5)%1,onGround=u<stance,sw=gaitClamp((u-stance)/(1-stance),0,1);
      const supportLength=cycle*stance,foot=st.feet[i];
      const advance=onGround?supportLength*(.5-u/stance):
        supportLength*(easeStep(0,1,sw)-.5)-Math.min(.47,cycle*(1-stance))*sw*(1-sw)*(1-2*sw);
      let x=sign*(.093+.010*st.brake)+localDX*advance*move/actor.scale.x;
      let z=sign*.012+localDZ*advance*move/actor.scale.z;
      let footYaw=0;
      if(ground&&!motion.climbing&&!ride&&!reaching&&move>.12&&speed>.18&&onGround){
        if(!foot.planted){
          foot.x=st.travelX+co*x*actor.scale.x+si*z*actor.scale.z;
          foot.z=st.travelZ-si*x*actor.scale.x+co*z*actor.scale.z;
          foot.yaw=yaw;foot.planted=true;
        }
        const px=foot.x-st.travelX,pz=foot.z-st.travelZ;
        x=(co*px-si*pz)/actor.scale.x;z=(si*px+co*pz)/actor.scale.z;
        footYaw=gaitClamp(wrapAngle(foot.yaw-yaw),-.49,.49);
      }else foot.planted=false;
      const sphase=gaitClamp(u/stance,0,1);
      let pitch=(onGround?.095*(1-easeStep(.02,.29,sphase))-.27*easeStep(.67,1,sphase):
        -.27*(1-easeStep(0,.49,sw))+.095*easeStep(.62,.98,sw))*move;
      const localFloor=ground?-(nx*(co*x*actor.scale.x+si*z*actor.scale.z)+nz*(-si*x*actor.scale.x+co*z*actor.scale.z))/(ny*actor.scale.y):0;
      let y=treadHeight(pitch)/ny+localFloor+(!onGround?(.106+.175*run)*Math.pow(Math.sin(Math.PI*sw),1.32)*move:0);
      if(!ground&&air>.0001){
        const lead=i===st.leftLead,fore=lead?-1:1;
        const lift=.162+(lead?.193:.135)*rise+.107*apex-(lead?.086:.056)*fall;
        x=gaitMix(x,sign*(.100+.018*fall),air);y=gaitMix(y,lift,air);
        z=gaitMix(z,fore*(.066+.125*rise+.057*apex+.016*fall),air);
        pitch=gaitMix(pitch,-.21*rise-.10*apex+.060*fall+(lead?0:-.053),air);
      }
      if(ride||reaching){
        const weight=st.reach,legArc=gaitClamp(angle*.41+angular*.043-effort*.28,-.58,.58);
        const tucked=.075+.085*Math.abs(effort)+.051*easeStep(.2,2.5,Math.abs(angular));
        x=gaitMix(x,b.hips.position.x+sign*.108,weight);
        y=gaitMix(y,b.hips.position.y-.71+tucked+(i===st.leftLead?.046:0)+.075*(1-Math.cos(legArc)),weight);
        z=gaitMix(z,b.hips.position.z+Math.sin(legArc)*.58+(i===st.leftLead?-.074:.034),weight);
        pitch=gaitMix(pitch,-.21-.12*easeStep(.1,.8,effort),weight);
      }else if(!ground){y+=st.hangOffset.y;z+=st.hangOffset.z;x+=st.hangOffset.x;}
      if(motion.climbing){
        const k=(1+Math.sin(actor.position.y*Math.PI/.29+i*Math.PI))*.5;
        b['thigh'+i].rotation.set(.26+.72*k,0,0);b['shin'+i].rotation.set(-.44-1.17*k,0,0);
        b['boot'+i].rotation.set(.18+.38*k,0,0);
      }else placeLeg(b,i,x,y,z,anklePlane,pitch,footYaw,0);
      const arm=b['arm'+i],forearm=b['forearm'+i],wrist=b['wrist'+i];
      const armSwing=Math.cos(u*TAU-Math.PI*stance);
      arm.rotation.set(.065-(.30+.38*run)*armSwing*move*unloaded+.49*work+.17*st.brake
        +air*(.25+.18*rise+(i===st.leftLead?-.23:.20)),0,sign*(.081+.075*work+.16*air+.19*fall*air+.061*Math.abs(turnLean)));
      forearm.rotation.set(.148+.47*run*move+.13*air+.23*rise*air+(.32+.15*Math.sin(time*4.3+i*Math.PI))*work,0,0);
      wrist.rotation.set(grips?0:.08*work+.035*run*move,0,0);
      if(grips)handleArm(b.chest,arm,forearm,grips[i],i,ride?1:reaching?st.reach:work);
    }
    st.x=actor.position.x;st.y=actor.position.y;st.z=actor.position.z;st.yaw=yaw;st.vx=vx;st.vz=vz;st.vy=vy;st.ground=ground;
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
