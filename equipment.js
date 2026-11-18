// Models use metres. Deck origins lie on their walking surface; instrument faces point to +Z.
window.TideEquipment = (() => {
  const T = THREE;
  const PI = Math.PI;
  const TAU = PI * 2;
  const steel = '#52626a', edge = '#a6aaa2', charcoal = '#2b373b', rubber = '#222b2b';
  const rust = '#82533b', brass = '#bc905b', verdigris = '#54867b', enamel = '#577778';
  const ivory = '#ded2a8', dark = '#202c31';
  const accent = ['#ec9654', '#72c8bf'];

  function create() {
    const resources = new Set();
    const shapes = new Map(), models = new Map(), labels = new Map();
    const own = resource => (resources.add(resource), resource);
    function shape(id, make) {
      if (!shapes.has(id)) shapes.set(id, own(make()));
      return shapes.get(id);
    }
    function canvasMap(canvas, repeat = false) {
      const map = own(new T.CanvasTexture(canvas));
      map.colorSpace = T.SRGBColorSpace;
      map.anisotropy = 6;
      if (repeat) map.wrapS = map.wrapT = T.RepeatWrapping;
      return map;
    }
    let seed = 3119;
    const random = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
    function tiledAlbedo(source) {
      if (!source) return null;
      const map=own(new T.TextureLoader().load(source));
      map.colorSpace=T.SRGBColorSpace;
      map.wrapS=map.wrapT=T.RepeatWrapping;
      map.anisotropy=8;
      return map;
    }
    const paintMap=tiledAlbedo(window.TideEnamelAlbedo);
    const floorMap=tiledAlbedo(window.TideDeckAlbedo);
    const cast=own(new T.MeshStandardMaterial({
      vertexColors:true,map:paintMap,roughness:.48,metalness:.37,bumpMap:paintMap,bumpScale:.004
    }));
    const tread=own(new T.MeshStandardMaterial({
      vertexColors:true,map:floorMap,bumpMap:floorMap,bumpScale:.015,metalness:.48,roughness:.42
    }));
    const quay=own(TideConcrete.material(0xe3daca,-1.1));
    const lensGlass = own(new T.MeshPhysicalMaterial({color:0xb9e0cf,transparent:true,opacity:.64,metalness:.18,roughness:.16,clearcoat:1,depthWrite:false}));
    const lampMats = [0,1].map(i=>own(new T.MeshStandardMaterial({color:accent[i],emissive:accent[i],emissiveIntensity:2.1, roughness:.24})));

    // Bake the small components of a rigid assembly into one mesh, including its paint colors.
    // Feet, fastenings, seams and braces therefore do not add a draw call each.
    const boxShape = shape('box',()=>new T.BoxGeometry(1,1,1));
    const transform = new T.Object3D();
    const vertex = new T.Vector3(), direction = new T.Vector3(), normalMatrix = new T.Matrix3();
    const tint = new T.Color();
    function batch() {
      const position=[], normal=[], uv=[], color=[], indices=[];
      function add(geometry,xyz,scale,rotation,hex,uvSize) {
        transform.position.fromArray(xyz);
        transform.scale.fromArray(scale);
        if (rotation?.isQuaternion) transform.quaternion.copy(rotation);
        else transform.rotation.set(...(rotation || [0,0,0]));
        transform.updateMatrix();
        normalMatrix.getNormalMatrix(transform.matrix);
        const base=position.length/3, attr=geometry.attributes;
        tint.set(hex);
        if (!uvSize && paintMap) tint.multiplyScalar(1.45);
        for (let i=0; i<attr.position.count; i++) {
          vertex.fromBufferAttribute(attr.position,i).applyMatrix4(transform.matrix);
          direction.fromBufferAttribute(attr.normal,i).applyNormalMatrix(normalMatrix);
          position.push(vertex.x,vertex.y,vertex.z);
          normal.push(direction.x,direction.y,direction.z);
          if (uvSize) uv.push(vertex.x/uvSize, -vertex.z/uvSize);
          else uv.push(attr.uv.getX(i),attr.uv.getY(i));
          color.push(tint.r,tint.g,tint.b);
        }
        if (geometry.index) for (let i=0; i<geometry.index.count; i++) indices.push(base+geometry.index.getX(i));
        else for (let i=0; i<attr.position.count; i++) indices.push(base+i);
      }
      const box=(x,y,z,w,h,d,c,rx=0,ry=0,rz=0)=>add(boxShape,[x,y,z],[w,h,d],[rx,ry,rz],c);
      function cyl(x,y,z,rt,rb,h,c,rx=0,rz=0,n=20) {
        const r=Math.max(rt,rb,.001);
        const key='c'+[Math.round(rt/r*1000),Math.round(rb/r*1000),n];
        const geo=shape(key,()=>new T.CylinderGeometry(rt/r,rb/r,1,n));
        add(geo,[x,y,z],[r,h,r],[rx,0,rz],c);
      }
      function bar(a,b,r,c,n=8) {
        const delta = new T.Vector3(b[0]-a[0],b[1]-a[1],b[2]-a[2]);
        const length=delta.length();
        if (length<.0001) return;
        const quat=new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize());
        const geo=shape('c1000,1000,'+n,()=>new T.CylinderGeometry(1,1,1,n));
        add(geo,a.map((v,k)=>(v+b[k])*.5),[r,length,r],quat,c);
      }
      function ring(x,y,z,r,wire,c,rx=0,ry=0,n=32) {
        const key='t'+[Math.round(wire/r*1000),n];
        const geo=shape(key,()=>new T.TorusGeometry(1,wire/r,6,n));
        add(geo,[x,y,z],[r,r,r],[rx,ry,0],c);
      }
      function mesh(target,material=cast) {
        if (!position.length) return;
        const geo=own(new T.BufferGeometry());
        geo.setAttribute('position',new T.Float32BufferAttribute(position,3));
        geo.setAttribute('normal',new T.Float32BufferAttribute(normal,3));
        geo.setAttribute('color',new T.Float32BufferAttribute(color,3));
        geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));
        geo.setIndex(indices);
        geo.computeBoundingSphere();
        const m=new T.Mesh(geo,material);m.castShadow=true;m.receiveShadow=true;
        target.add(m);return m;
      }
      return {add,box,cyl,bar,ring,mesh};
    }

    function deck(width,depth,style='dock') {
      const w=Math.max(.08,width), d=Math.max(.08,depth);
      const key='deck:'+style+':'+w+':'+d;
      if (models.has(key)) return models.get(key).clone(true);
      const group=new T.Group(), frame=batch(), surface=batch();
      const r=w/2,f=d/2, rim=Math.min(.09,w*.04,d*.04);
      const bronze=style==='lens', floating=style==='raft', suspended=style==='basket', ladder=style==='ladder';
      const light=bronze?brass:edge;
      const beam=bronze?'#695747':style==='pump'?'#537574':'#465760';
      if (ladder) {
        for (const x of [-r+.05,r-.05]) frame.box(x,-.10,0,.11,.17,d,edge);
        const n=Math.max(2,Math.ceil(d/.40));
        for (let i=0;i<n;i++) frame.cyl(0,-.055,(i+.5)*d/n-f,.046,.046,Math.max(.1,w-.1),brass,0,PI/2,10);
      } else if(style==='quay') {
        surface.box(0,-1.48,0,w,2.96,d,ivory);
        // An inset trench drain runs along one edge of the poured landing.
        const drainX=r-.32;
        frame.box(drainX,.004,0,.27,.01,d-.30,charcoal);
        for(let z=-f+.22;z<f-.10;z+=.13)frame.box(drainX,.014,z,.249,.014,.036,steel);
        for(const z of [-f+.12,f-.12]) {
          for(const x of [-r+.34,r-.68]) {
            frame.box(x,.011,z,.47,.022,.16,'#bd9655');
            for(const offset of [-.15,.15])frame.cyl(x+offset,.030,z,.023,.028,.022,steel,0,0,6);
          }
        }
      } else {
        const plane=shape('floor',()=>new T.PlaneGeometry(1,1));
        surface.add(plane,[0,0,0],[w,d,1],[-PI/2,0,0],bronze?'#e0c4a1':floating?'#a7c1b3':'#d2dddc',1.65);
        frame.box(0,-.127,0,w,.24,d,beam);
        for (const x of [-r+rim/2,r-rim/2]) {
          frame.box(x,-.026,0,rim,.042,d,light);
          frame.box(x,-.345,0,rim*.68,.28,d,beam);
          frame.box(x,-.495,0,rim*1.7,.054,d,light);
        }
        for (const z of [-f+rim/2,f-rim/2]) frame.box(0,-.022,z,w,.035,rim,light);
        const cross=Math.min(14,Math.max(2,Math.ceil(d/2.9)));
        const decking = Math.min(14, Math.ceil(w/2.7));
        for (let i=1;i<cross;i++) {
          const z=-f+i*d/cross;
          frame.box(0,.002,z,w-rim,.005,.016,dark);
          frame.box(0,-.36,z,w-.04,.15,.085,beam);
        }
        for(let i=1;i<decking;i++) frame.box(-r+i*w/decking,.002,0,.017,.006,d,dark);
        for (let i=0;i<Math.min(35,Math.ceil(d/.78));i++) {
          const z=-f+(i+.5)*d/Math.min(35,Math.ceil(d/.78));
          for (const sign of [-1,1]) {
            const x=sign*(r-rim*1.9);
            frame.cyl(x,.006,z,.023,.027,.012,light,0,0,6);
          }
        }
        if (style==='bridge') {
          const spans=Math.min(12,Math.max(1,Math.round(d/2.2)));
          for (const x of [-r+.12,r-.12]) {
            frame.box(x,-.93,0,.12,.12,d,beam);
            for(let i=0;i<spans;i++) {
              const a=-f+i*d/spans,b=-f+(i+1)*d/spans;
              frame.bar([x,-.88,a],[x,-.22,(a+b)/2],.053,light);
              frame.bar([x,-.22,(a+b)/2],[x,-.88,b],.053,beam);
            }
          }
        } else if (floating) {
          for (const x of [-r*.69,r*.69]) {
            frame.cyl(x,-.55,0,.34,.34,d*.95,'#48635d',PI/2,0,12);
            for(const z of [-f*.65,f*.65])frame.ring(x,-.55,z,.344,.034,charcoal);
          }
        } else if (suspended) {
          for (const x of [-r+.11,r-.11]) for (const z of [-f+.11,f-.11]) {
            const top=[x*.72,2.83,z*.66];
            frame.bar([x,.01,z],top,.018,steel,6);
            frame.cyl(x,.07,z,.085,.085,.12,brass);
          }
          frame.bar([-r*.72,2.83,0],[r*.72,2.83,0],.045,charcoal);
          for(const side of [-1,1]) frame.bar([side*r*.72,2.83,-f*.66],[side*r*.72,2.83,f*.66],.042,charcoal);
        } else if (w>=2.3 && d>=2.3) {
          const drop=style==='dock'?3.0:1.3;
          for (const x of [-r*.78,r*.78]) for (const z of [-f*.77,f*.77]) {
            frame.cyl(x,-drop/2-.22,z,.105,.15,drop,style==='dock'?rust:beam,0,0,8);
            frame.cyl(x,-.45,z,.19,.19,.065,edge,0,0,8);
          }
        }
      }
      frame.mesh(group);surface.mesh(group,style==='quay'?quay:tread);
      models.set(key,group);return group.clone(true);
    }

    const instruments={
      winch:['吊篮绞盘','HOIST / 01'], radio:['船岸电台','VHF / 02'], breaker:['岸线配电','BUS / 03'],
      pump:['潮井排水','BILGE / 04'], tape:['双轨回放','TAPE / 05'], chart:['航测灯箱','CHART / 06'],
      brake:['吊桥制动','BRAKE / 07'], antenna:['定向中继','RELAY / 08'], gauge:['潮位标尺','TIDE / 09'],
      lens:['辅镜调焦','OPTIC / 10'], horn:['雾号电路','HORN / 11'], wheel:['灯轴手轮','AXIS / 12']
    };
    function faceMap(kind,side) {
      const key=kind+side;
      if (labels.has(key)) return labels.get(key);
      const sheet=document.createElement('canvas');
      sheet.width=512;sheet.height=256;
      const g=sheet.getContext('2d');
      g.fillStyle='#253638';g.fillRect(0,0,512,256);
      g.strokeStyle='#7b918b';g.lineWidth=4;g.strokeRect(5,5,502,246);
      g.fillStyle=accent[side];g.fillRect(13,13,8,230);
      g.fillStyle='#e4e6d9';g.font='bold 55px sans-serif';g.fillText(instruments[kind][0],40,90);
      g.font='30px monospace';g.fillText(instruments[kind][1],42,141);
      g.fillStyle='#a3c2b8';
      for (let i=0;i<32;i++) g.fillRect(43+i*13,177,2,i%4===0?38:17);
      for (const x of [16,494]) for (const y of [16,240]){
        g.fillStyle='#a0aaa2';g.beginPath();g.arc(x,y,4,0,TAU);g.fill();
      }
      const material=own(new T.MeshStandardMaterial({map:canvasMap(sheet),roughness:.57,metalness:.15}));
      labels.set(key,material);
      return material;
    }
    function chartMap() {
      if (labels.has('coastal-chart')) return labels.get('coastal-chart');
      const c=document.createElement('canvas');c.width=768;c.height=512;
      const g=c.getContext('2d');g.fillStyle='#c6d7b8';g.fillRect(0,0,768,512);
      g.strokeStyle='rgba(54,92,92,.38)';g.lineWidth=1;
      for(let k=0;k<24;k++) {g.beginPath();g.moveTo(k*32,0);g.lineTo(k*32,512);g.stroke();}
      for(let k=0;k<16;k++) {g.beginPath();g.moveTo(0,k*32);g.lineTo(768,k*32);g.stroke();}
      for(let k=0;k<17;k++){
        g.beginPath();
        for(let x=0;x<=768;x+=4){
          const y=85+9*k+Math.sin(x*.011+k*.09)*32+Math.sin(x*.022)*15
            +Math.pow(x/768,3)*98+Math.sin(x*.009-k*.09)*k*3;
          if(!x)g.moveTo(x,y);else g.lineTo(x,y);
        }
        g.strokeStyle=k%4===0?'#48797d':'#91aaaa';g.lineWidth=k%4===0?2.5:1.3;g.stroke();
        if(!k){g.lineTo(768,0);g.lineTo(0,0);g.fillStyle='#b8ae8b';g.fill();}
      }
      g.strokeStyle='#9a4b31';g.lineWidth=4;g.setLineDash([15,8]);g.beginPath();
      g.moveTo(18,450);g.bezierCurveTo(290,190,570,482,686,268);g.stroke();g.setLineDash([]);
      g.font='22px monospace';g.fillStyle='#355457';g.fillText('NORTH CAPE / SOUNDINGS',22,34);
      for(let n=0;n<31;n++){
        const x=20+random()*730,y=250+random()*220;
        g.font='15px monospace';g.fillText((.8+random()*6).toFixed(1),x,y);
      }
      const m=own(new T.MeshStandardMaterial({map:canvasMap(c),roughness:.57,emissive:0x272d1c}));
      labels.set('coastal-chart',m);return m;
    }
    // Locations are on the working parts, in metres relative to their named pivots.
    // A moving valve or crank carries its contact point around with the actual handle.
    const contacts={
      winch:[['',.40,.74,.045],['drum',.70,.22,0]],
      brake:[['pawl',0,.62,.19],['',.22,.44,.36]],
      pump:[['valve',-.145,0,.027],['valve',.145,0,.070]],
      radio:[['',-.27,.68,.35],['',.09,.68,.35]],
      breaker:[['toggle',-.048,.11,.12],['toggle',.048,.11,.12]],
      tape:[['',-.23,.59,.27],['',.23,.59,.27]],
      wheel:[['wheel',-.235,.12,0],['wheel',.235,-.12,0]],
      chart:[['cursor',0,.018,.23],['',.33,.946,.30]],
      antenna:[['receiver',-.24,.04,.11],['receiver',.24,.04,.11]],
      gauge:[['',-.17,.96,.08],['',.15,.89,.09]],
      lens:[['shutter',-.34,.08,0],['shutter',.34,.08,0]],
      horn:[['',-.19,.59,.20],['',.19,.59,.20]]
    };
    const workHands=new WeakMap();
    function grips(device){
      let hands=workHands.get(device);
      if(!hands){
        hands={nodes:[0,1].map(i=>device.getObjectByName('grip'+i)),points:[new T.Vector3(),new T.Vector3()]};
        workHands.set(device,hands);
      }
      for(let i=0;i<2;i++)hands.nodes[i].getWorldPosition(hands.points[i]);
      if((device.name==='wheel'||device.name==='pump')&&hands.points[0].x>hands.points[1].x)
        return [hands.points[1],hands.points[0]];
      return hands.points;
    }
    function device(kind,which=0) {
      if (!instruments[kind]) kind='breaker';
      const side=Number(which)===1?1:0;
      const key='device:'+kind+side;
      if (models.has(key)) {
        const copy=models.get(key).clone(true);
        drive(copy,0,0);
        return copy;
      }
      const g=new T.Group(), b=batch(), lamps=batch();
      const paint=side?'#467777':'#746c58';
      function plaque(x,y,z,w=.38,h=.148) {
        const m=new T.Mesh(shape('plaqueplane',()=>new T.PlaneGeometry(1,1)),faceMap(kind,side));
        m.scale.set(w,h,1);m.position.set(x,y,z+.002);g.add(m);
      }
      function mechanism(name,xyz,parts,act) {
        const root=new T.Group();root.name=name;root.position.fromArray(xyz);
        root.userData.motion={...act,origin:xyz.slice()};
        const component=batch();parts(component);
        component.mesh(root);g.add(root);return root;
      }
      function lamp(x,y,z,r=.034) {
        b.cyl(x,y,z,r*1.34,r*1.28,.042,charcoal,PI/2);
        lamps.cyl(x,y,z+.028,r,r,.014,ivory,PI/2);
      }
      function feet(w,d,h=.11) {
        b.box(0,h*.5,0,w,h,d,charcoal);
        for(const signX of [-1,1]) for(const signZ of [-1,1]){
          const x=signX*(w/2-.055),z=signZ*(d/2-.052);
          b.cyl(x,h+.008,z,.035,.039,.024,edge,0,0,6);
        }
      }
      function gauge(x,y,z,r=.12) {
        b.cyl(x,y,z,r*1.13,r*1.13,.045,brass,PI/2,0,28);
        b.cyl(x,y,z+.029,r,r,.019,ivory,PI/2,0,28);
        for(let i=0;i<13;i++){
          const a=-2.05+i*4.1/12,rad=r*.82;
          b.box(x+rad*Math.sin(a),y+rad*Math.cos(a),z+.044,.008,r*(i%3?.12:.21),.006,charcoal,0,0,-a);
        }
        mechanism('dial',[x,y,z+.056],v=>{
          v.box(0,r*.37,0,.014,r*.73,.007,'#a9492e');
          v.cyl(0,0,.006,r*.105,r*.105,.018,steel,PI/2);
        },{axis:'z',offset:1.7,travel:-3.4});
      }
      function handwheel(c,rad,mat=rust) {
        c.ring(0,0,0,rad,.027,mat,0,0,32);
        c.cyl(0,0,0,.07,.07,.11,brass,PI/2,0,16);
        for(let i=0;i<5;i++) {
          const a=TAU*i/5;
          c.bar([0,0,0],[Math.sin(a)*rad,Math.cos(a)*rad,0],.016,mat);
        }
        c.cyl(rad,0,.07,.021,.025,.14,edge,PI/2,0,12);
      }
      switch(kind) {
        case 'winch':
        case 'brake': {
          const brake=kind==='brake';
          feet(1.18,.84);
          b.box(0,.24,0,1.03,.27,.57,paint);
          for(const x of [-.44,.44]){
            b.box(x,.52,0,.115,.63,.36,paint);
            b.cyl(x,.76,0,.16,.16,.13,brass,0,PI/2);
          }
          mechanism('drum',[0,.73,0],v=>{
            v.cyl(0,0,0,.22,.22,.71,rubber,0,PI/2,26);
            for(let i=0;i<14;i++)v.ring(-.31+i*.047,0,0,.224,.016,steel,0,PI/2,26);
            for(const x of [-.34,.34])v.cyl(x,0,0,.295,.295,.055,paint,0,PI/2,28);
            v.cyl(.52,0,0,.048,.048,.33,edge,0,PI/2);
            v.bar([.64,0,0],[.64,.22,0],.025,brass);
            v.cyl(.7,.22,0,.042,.042,.15,rubber,0,PI/2);
          },{axis:'x',travel:TAU*5});
          b.cyl(0,.43,.365,.071,.071,.73,brass,0,PI/2);
          b.bar([-.18,.58,.13],[-.18,.46,.38],.021,steel);
          if(brake){
            mechanism('pawl',[-.46,.34,.18],v=>{
              v.bar([0,0,0],[0,.62,.19],.033,brass);
              v.cyl(0,.62,.19,.052,.052,.19,rust,0,PI/2);
            },{axis:'x',offset:-.1,travel:.53});
            for(let i=0;i<16;i++){
              const a=TAU*i/16;
              b.box(-.385,.73+.28*Math.sin(a),.28*Math.cos(a),.065,.078,.055,edge,-a,0,0);
            }
          }
          plaque(0,.24,.291,.42,.15);lamp(.368,.24,.30);break;
        }
        case 'radio': {
          feet(.83,.64);
          b.box(0,.25,0,.61,.39,.45,paint);
          b.box(0,.78,0,.85,.68,.53,charcoal);
          b.box(0,.78,.272,.78,.6,.038,'#445c5e');
          b.box(-.13,.89,.302,.39,.14,.029,'#162c2b');
          for(let i=0;i<13;i++)b.box(-.30+i*.028,.89,.32,.006,i%3?.039:.068,.005,ivory);
          mechanism('tuner',[-.29,.89,.331],v=>v.box(0,0,0,.012,.11,.006,accent[side]),{slide:'x',travel:.32});
          for(let j=0;j<7;j++)b.box(.259,.73+j*.031,.304,.155,.012,.025,dark);
          for(const x of [-.27,-.09,.08])b.cyl(x,.68,.32,.051,.051,.048,rubber,PI/2,0,16);
          b.bar([.29,1.1,-.19],[.36,1.62,-.23],.011,edge);
          b.box(-.50,.73,.09,.12,.27,.11,rubber,0,0,-.15);
          for(let j=0;j<5;j++)b.box(-.50,.77-j*.023,.149,.08,.008,.018,steel);
          for(let j=0;j<11;j++)b.ring(-.49,.57-j*.021,.10,.031,.006, rubber,PI/2,0,10);
          lamp(.1,1.02,.30);plaque(0,.25,.232);break;
        }
        case 'breaker': {
          feet(.85,.63);b.box(0,.70,0,.75,1.19,.48,paint);
          b.box(0,.73,.252,.68,1.02,.035,steel);
          gauge(-.12,1.03,.274,.118);lamp(.19,1.03,.28);
          b.box(0,.71,.289,.14,.30,.032,rubber);
          mechanism('toggle',[0,.72,.31],v=>{
            v.bar([0,0,0],[0,.106,.112],.028,brass);
            v.cyl(0,.11,.12,.038,.038,.15,accent[side],0,PI/2);
          },{axis:'x',offset:-.2,travel:1.55});
          for(const x of [-.21,.0,.21]){
            for(let j=0;j<4;j++)b.cyl(x,1.323+j*.032,0,.056,.041,.027,ivory);
            b.cyl(x,1.447,0,.023,.023,.061,brass);
          }
          plaque(0,.38,.277);break;
        }
        case 'pump': {
          feet(1.28,.90);b.box(0,.21,0,1.14,.20,.72,paint);
          b.cyl(-.29,.52,0,.24,.24,.42,enamel,0,PI/2,28);
          for(let j=0;j<8;j++)b.cyl(-.49+j*.053,.52,0,.265,.265,.019,verdigris,0,PI/2);
          b.cyl(.22,.53,0,.31,.31,.28,paint,0,PI/2,28);
          b.cyl(.39,.53,0,.23,.29,.13,rust,0,PI/2,22);
          b.cyl(.24,.82,0,.109,.109,.48,enamel);
          b.cyl(.24,1.02,0,.154,.154,.052,brass);
          b.bar([.24,1.04,0],[.24,1.04,-.33],.093,steel,16);
          b.cyl(.24,1.04,-.34,.14,.14,.052,brass,PI/2);
          b.bar([-.13,.64,.12],[-.13,.98,.14],.027,brass);
          gauge(-.13,1.03,.15,.12);
          mechanism('valve',[.25,.63,.35],v=>handwheel(v,.145, rust),{axis:'z',travel:TAU*2});
          plaque(-.13,.205,.363,.39,.112);lamp(.38,.21,.368,.024);break;
        }
        case 'tape': {
          feet(.92,.60);b.box(0,.27,0,.68,.40,.46,paint);
          b.box(0,.82,0,.87,.71,.39,steel);
          b.box(0,.82,.203,.81,.64,.027,'#797b6a');
          for(const x of [-.19,.19]){
            b.cyl(x,.94,.229,.164,.164,.042,rubber,PI/2,0,30);
            mechanism('reel',[x,.94,.26],v=>{
              v.ring(0,0,0,.155,.014,edge);
              for(let i=0;i<3;i++){
                const a=i*TAU/3;
                v.bar([0,0,0],[Math.cos(a)*.15,Math.sin(a)*.15,0],.022,edge);
              }
              v.cyl(0,0,.012,.043,.043,.039,brass,PI/2);
            },{axis:'z',travel:TAU*4});
          }
          b.bar([-.28,.83,.248],[-.14,.68,.248],.008,dark,5);
          b.bar([-.14,.68,.248],[.14,.68,.248],.008,dark,5);
          b.bar([.14,.68,.248],[.28,.83,.248],.008,dark,5);
          for(let k=0;k<6;k++) b.box(-.25+k*.097,.591,.25,.074,.043,.04,k===0?rust:ivory);
          plaque(0,.31,.233);lamp(.30,.72,.22,.025);break;
        }
        case 'chart': {
          feet(1.06,.64);
          for(const x of [-.40,.40]){
            b.box(x,.47,0,.09,.83,.12,paint);b.bar([x,.19,-.22],[x,.77,.24],.034,brass);
          }
          b.box(0,.88,0,1.12,.105,.8,paint);
          const mapPlane=new T.Mesh(shape('plaqueplane',()=>new T.PlaneGeometry(1,1)),chartMap());
          mapPlane.rotation.x=-PI/2;mapPlane.position.y=.938;mapPlane.scale.set(1.00,.70,1);g.add(mapPlane);
          mechanism('cursor',[-.45,.956,0],v=>{
            v.box(0,0,0,.022,.016,.69,brass);
            v.ring(0,0,0,.078,.008,rust,PI/2);
          },{slide:'x',travel:.90});
          for(const x of [-.48,.48]){
            b.cyl(x,.957,-.32,.018,.018,.046,brass);
            b.bar([x,.93,-.32],[x,1.16,-.27],.018,steel);
            b.bar([x,1.16,-.27],[x*.74,1.19,-.17],.021,steel);
            lamps.box(x*.74,1.18,-.17,.125,.035,.061,ivory);
          }
          plaque(0,.82,.405,.32,.085);break;
        }
        case 'antenna': {
          feet(.82,.78);
          b.box(0,.27,0,.56,.34,.45,paint);
          b.cyl(0,.71,0,.056,.086,.68,steel);
          for(const x of [-.28,.28]) {
            b.bar([x,.16,-.19],[0,.87,0],.027,brass);
            b.bar([x,.16,.19],[0,.87,0],.027,steel);
          }
          mechanism('receiver',[0,1.06,0],v=>{
            // Shallow mesh reflector with exposed ribs and tripod feed.
            const curve=[[.035,0],[.12,.011],[.21,.035],[.30,.068],[.38,.105]];
            const dish=shape('parabolic',()=>{
              const lip=curve.slice().reverse().map(([r,y])=>[r,y+.007]);
              return new T.LatheGeometry([...curve,...lip].map(([r,y])=>new T.Vector2(r,y)),36);
            });
            v.add(dish,[0,0,0],[1,1,1],[PI*.38,0,0],verdigris);
            const tip=[0,.118,.31];
            for(let i=0;i<12;i++){
              const angle=i*TAU/12;
              const x=.38*Math.cos(angle),y=.38*Math.sin(angle);
              const rim=[x,y*.93+.037,-y*.37+.10];
              v.bar([0,0,0],rim,.008,edge,6);
              if(i%4===0)v.bar(rim,tip,.011,brass,6);
            }
            v.ring(0,.037,.10,.382,.016,edge,-.38);
            v.cyl(...tip,.037,.043,.09,rubber,PI/2);
          },{axis:'y',offset:-.86,travel:1.72});
          plaque(0,.272,.231);lamp(.20,.41,.235,.021);break;
        }
        case 'gauge': {
          feet(.79,.67);
          b.box(-.13,.85,0,.21,1.48,.11,'#d7c6a3');
          b.box(-.13,.85,-.072,.29,1.49,.06,steel);
          for(let i=0;i<28;i++) {
            const length=i%5===0?.146:i%2?.068:.10;
            b.box(-.224+length/2,.15+i*.05,.065,length,.012,.012,(i%10<5)?dark:rust);
          }
          b.cyl(.14,.75,0,.022,.022,1.30,brass);
          mechanism('float',[.14,.20,0],v=>{
            v.cyl(0,0,0,.077,.092,.135,accent[side]);
            v.box(-.12,0,.087,.27,.018,.025,rust);
          },{slide:'y',travel:1.08});
          b.box(0,.17,.22,.54,.155,.12,paint);
          plaque(0,.18,.282,.37,.105);
          gauge(-.13,1.48,.07,.113);
          lamp(.19,.18,.284,.018);break;
        }
        case 'lens': {
          feet(.87,.84);
          b.cyl(0,.24,0,.34,.38,.22,paint);
          b.cyl(0,.405,0,.38,.33,.11,brass,0,0,32);
          b.cyl(0,1.23,0,.34,.37,.078,brass,0,0,32);
          b.cyl(0,1.31,0,.065,.32,.103,verdigris,0,0,32);
          const profile=[[.15,.46],[.21,.5],[.267,.61],[.309,.76],[.32,.84],[.30,.98],[.25,1.11],[.17,1.18]];
          const body=shape('optic-glass',()=>new T.LatheGeometry(profile.map(([r,y])=>new T.Vector2(r,y)),48));
          const glass=new T.Mesh(body,lensGlass);g.add(glass);
          for(let i=0;i<15;i++){
            const y=.50+i*.045;
            const radius=.182+.13*Math.sin(PI*(i+.9)/16);
            b.ring(0,y,0,radius,.008,'#a7cdba',PI/2,0,40);
          }
          for(let i=0;i<4;i++) {
            const a=i*TAU/4+PI/4;
            b.cyl(.335*Math.cos(a),.825,.335*Math.sin(a),.025,.025,.84,brass);
          }
          mechanism('shutter',[0,.82,0],v=>{
            for(const s of [-1,1]){
              const x=.34*s;
              v.box(x,0,0,.020,.70,.16,steel);
              for(let j=0;j<7;j++)v.box(x+s*.014,-.28+j*.091,0,.014,.016,.18,brass);
            }
          },{axis:'y',offset:-.7,travel:1.40});
          lamps.cyl(0,.82,0,.078,.08,.57,ivory,0,0,20);
          b.box(0,.25,.333,.38,.15,.088,paint);
          plaque(0,.25,.379,.32,.115);break;
        }
        case 'horn': {
          feet(1.00,.70); b.box(0,.36,0,.67,.49,.47,paint);
          gauge(-.12,.40,.252,.102);lamp(.18,.39,.26);
          b.cyl(0,.73,0,.09,.11,.32,brass);
          b.bar([-.34,.88,0],[.34,.88,0],.056,steel);
          mechanism('yoke',[0,.93,0],v=>{
            for (const s of [-1,1]) {
              const x=s*.235;
              v.cyl(x,0,-.15,.087,.084,.31,charcoal,PI/2);
              v.cyl(x,0,.06,.111,.062,.24,brass,PI/2);
              v.cyl(x,0,.24,.196,.11,.16,enamel,PI/2,0,30);
              v.cyl(x,0,.325,.175,.175,.014,dark,PI/2,0,30);
              v.ring(x,0,.34,.187,.016,brass);
              v.cyl(x,0,.342,.041,.060,.049,steel,PI/2);
              for(let i=-2;i<=2;i++) {
                const xx=i*.054;
                const yy=Math.sqrt(.168**2-xx**2);
                v.bar([x+xx,-yy,.34],[x+xx,yy,.34],.005,steel,5);
              }
            }
          },{axis:'x',offset:.02,travel:-.19});
          plaque(0,.20,.241,.35,.107);break;
        }
        case 'wheel': {
          feet(.90,.80);
          b.box(0,.32,0,.63,.42,.48,paint);
          b.cyl(0,.71,0,.132,.197,.57,enamel);
          b.cyl(0,.95,.04,.139,.139,.30,brass,PI/2);
          mechanism('wheel',[0,.95,.235],v=>{
            v.ring(0,0,0,.27,.032,'#79513b');
            v.ring(0,0,-.012,.248,.015,brass);
            v.cyl(0,0,0,.081,.081,.092,brass,PI/2);
            for(let k=0;k<6;k++){
              const dx=Math.cos(TAU*k/6),dy=Math.sin(TAU*k/6);
              v.bar([.07*dx,.07*dy,0],[.363*dx,.363*dy,0],.022,'#956b48');
              v.bar([.30*dx,.30*dy,0],[.37*dx,.37*dy,0],.029,brass);
            }
          },{axis:'z',travel:TAU*1.75});
          plaque(0,.35,.247);lamp(.22,.49,.25,.022);break;
        }
      }
      contacts[kind].forEach(([pivot,x,y,z],i)=>{
        const handle=new T.Object3D();handle.name='grip'+i;handle.position.set(x,y,z);
        (pivot?g.getObjectByName(pivot):g).add(handle);
      });
      if(kind==='horn')for(const x of [-.19,.19])b.bar([x,.55,.20],[x,.65,.20],.023,brass);
      b.mesh(g);
      const lit=lamps.mesh(g,lampMats[side]);
      if(lit){lit.castShadow=false;lit.receiveShadow=false;}
      g.name=kind;
      models.set(key,g);
      const result=g.clone(true);
      drive(result,0,0);
      return result;
    }
    function drive(group,value,time) {
      const setting=T.MathUtils.clamp(Number.isFinite(value)?value:0,0,1);
      for(const part of group.children) {
        const motion=part.userData.motion;
        if(!motion)continue;
        if(motion.slide) {
          const component = motion.slide==='x'?0:motion.slide==='y'?1:2;
          part.position[motion.slide]=motion.origin[component]+motion.travel*setting;
        } else {
          const tremor=part.name==='yoke' ? Math.sin(time*42)*.012*setting : 0;
          part.rotation[motion.axis]=(motion.offset||0)+motion.travel*setting+tremor;
        }
      }
    }
    function releaseDecks(){
      for(const [key,model] of models){
        if(!key.startsWith('deck:'))continue;
        model.traverse(m=>{
          if(m.isMesh&&resources.delete(m.geometry))m.geometry.dispose();
        });
        models.delete(key);
      }
    }
    function dispose() {
      resources.forEach(resource=>resource.dispose());
      resources.clear(); shapes.clear(); models.clear(); labels.clear();
    }
    return {deck,device,drive,grips,releaseDecks,dispose};
  }
  return {create};
})();
