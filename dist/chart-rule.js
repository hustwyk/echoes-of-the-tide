// North Cape chart room. Local XY is the paper, and +Z is its outward normal.
const TideChartRule = (() => {
  function create(boardGroup, mapW, mapH) {
    const T = THREE;
    const turn = Math.PI * 2;
    const owned = new Set();
    const own = object => { owned.add(object); return object; };
    const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
    const valid = a => a && Number.isFinite(a.u) && Number.isFinite(a.v);
    const X = u => (u - .5) * mapW;
    const Y = v => (.5 - v) * mapH;
    function group(parent, name) {
      const g = new T.Group();
      g.name = name;
      parent.add(g);
      return g;
    }
    const root = group(boardGroup, 'Reciprocal bearing instrument');
    const active = group(root, 'Draughting rule in use');
    const foot = group(active, 'North-aligned index and pivot');
    const blade = group(foot, 'Reciprocal straightedge');
    const readout = group(active, 'Fixed bearing repeater');
    function standard(color, extra) {
      return own(new T.MeshStandardMaterial(Object.assign({color, roughness:.52, metalness:.31}, extra)));
    }
    function mesh(parent, geometry, material, x = 0, y = 0, z = 0) {
      const m = new T.Mesh(own(geometry), material);
      m.position.set(x,y,z);
      parent.add(m);
      return m;
    }
    function texture(w, h, draw) {
      const can = document.createElement('canvas');
      can.width=w; can.height=h;
      const ctx=can.getContext('2d');
      if(draw)draw(ctx,w,h);
      const map=own(new T.CanvasTexture(can));
      if('colorSpace' in map && T.SRGBColorSpace) map.colorSpace=T.SRGBColorSpace;
      else if(T.sRGBEncoding) map.encoding=T.sRGBEncoding;
      map.anisotropy=4;
      return {ctx,map,w,h};
    }
    function ink(map) {
      return standard(0xffffff,{map,transparent:true,depthWrite:false,roughness:.78,metalness:.015,
        emissive:0x141210,emissiveIntensity:.18,alphaTest:.006});
    }
    function print(parent,map,w,h,x,y,z,order) {
      const m=mesh(parent,new T.PlaneGeometry(w,h),ink(map),x,y,z);
      m.renderOrder=order;
      return m;
    }
    const bronze=standard(0xa78a52,{roughness:.43,metalness:.62});
    const steel=standard(0xb8b3a1,{roughness:.32,metalness:.71});
    const black=standard(0x414b45,{roughness:.61,metalness:.38});
    const yellow=standard(0xc7b985,{roughness:.47,metalness:.29});
    function pin(parent,mat,x,y,z,r1,r2,height,n) {
      const m=mesh(parent,new T.CylinderGeometry(r1,r2,height,n),mat,x,y,z);
      m.rotation.x=Math.PI*.5;
      return m;
    }
    function ring(parent,r,t,z,mat) {
      return mesh(parent,new T.TorusGeometry(r,t,7,80),mat,0,0,z);
    }
    function mountedPlate(parent,w,h,r,depth,material) {
      const shape=new T.Shape(),x=-w/2,y=-h/2;
      shape.moveTo(x+r,y);shape.lineTo(-x-r,y);shape.quadraticCurveTo(-x,y,-x,y+r);
      shape.lineTo(-x,-y-r);shape.quadraticCurveTo(-x,-y,-x-r,-y);
      shape.lineTo(x+r,-y);shape.quadraticCurveTo(x,-y,x,-y-r);
      shape.lineTo(x,y+r);shape.quadraticCurveTo(x,y,x+r,y);
      return mesh(parent,new T.ExtrudeGeometry(shape,{depth,bevelEnabled:true,bevelThickness:.0009,
        bevelSize:.0012,bevelSegments:1,curveSegments:4}),material);
    }
    // Paper degrees do not project to equal angular divisions on this chart.
    function paperBearing(a) {
      return Math.atan2(mapW*Math.sin(a)/52,mapH*Math.cos(a)/46);
    }
    function backRay(a,yaw) {
      const du=-Math.sin(yaw)/52, dv=Math.cos(yaw)/46;
      const u=clamp(a.u,0,1),v=clamp(a.v,0,1);
      const edge=(value,d)=>Math.abs(d)<1e-10?Infinity:((d>0?1:0)-value)/d;
      const t=Math.max(0,Math.min(edge(u,du),edge(v,dv)));
      return {u0:u,v0:v,u1:clamp(u+du*t,0,1),v1:clamp(v+dv*t,0,1)};
    }
    const radius=.119;
    const indexGlass=standard(0xb8c8ac,{transparent:true,opacity:.18,depthWrite:false,
      roughness:.23,metalness:.15});
    const annulus=mesh(foot,new T.RingGeometry(.082,radius,96),indexGlass,0,0,-.003);
    annulus.renderOrder=3;
    ring(foot,radius,.0015,-.0023,bronze);
    const head=texture(768,768,(c,w,h)=>{
      const cx=w/2,cy=h/2,R=w*.48;
      c.translate(cx,cy);
      for(let n=0;n<360;n+=2){
        const b=paperBearing(n*Math.PI/180),sx=Math.sin(b),sy=-Math.cos(b);
        const major=n%10===0,long=n%30===0;
        const tip=R-(long?35:major?26:13);
        c.strokeStyle=n===0?'#984735':major?'#23392e':'#506350';c.lineWidth=long?5:major?3.5:2;
        c.beginPath();c.moveTo(sx*R,sy*R);c.lineTo(sx*tip,sy*tip);c.stroke();
        if(long) {
          const letters={0:'N',90:'E',180:'S',270:'W'};
          c.save();c.translate(sx*(R-61),sy*(R-61));c.rotate(b+((n>90&&n<270)?Math.PI:0));
          c.textAlign='center';c.textBaseline='middle';c.font=letters[n]?'bold 40px Georgia':'bold 33px monospace';
          c.fillStyle=n===0?'#933e2d':'#223b32';
          c.strokeStyle='rgba(238,232,190,.83)';c.lineWidth=3;
          const str=letters[n]||String(n);c.strokeText(str,0,0);c.fillText(str,0,0);c.restore();
        }
      }
      c.lineWidth=1.4;c.strokeStyle='rgba(70,82,59,.55)';c.beginPath();c.arc(0,0,R-33,0,turn);c.stroke();
      // Sparing abrasion on the exposed upper face; open centre shows the depths.
      for(let j=0;j<16;j++) {
        const a=j*2.39996,rr=R-4-(j*29)%79;
        c.strokeStyle=j%2?'rgba(241,236,202,.65)':'rgba(69,83,70,.31)';
        c.beginPath();c.arc(0,0,rr,a,a+.021+(j%5)*.006);c.stroke();
      }
    });
    print(foot,head.map,radius*2/.96,radius*2/.96,0,0,.0003,5);

    // The graduated blade slides out of its brass tongue. Exposure is limited by
    // the edge of the paper; the graduations retain their actual physical pitch.
    const bladeMax=.565, half=.039;
    const scales=texture(256,2048,(c,w,h)=>{
      const len=.565,px=x=>(x/(2*half)+.5)*w,py=d=>d*h/len;
      const wash=c.createLinearGradient(0,0,w,0);
      wash.addColorStop(0,'rgba(45,86,66,.67)');wash.addColorStop(.035,'rgba(148,165,134,.22)');
      wash.addColorStop(.11,'rgba(223,238,207,.11)');wash.addColorStop(.42,'rgba(228,237,213,.05)');
      wash.addColorStop(.70,'rgba(246,247,218,.12)');wash.addColorStop(.96,'rgba(87,123,92,.23)');
      wash.addColorStop(1,'rgba(46,75,53,.68)');c.fillStyle=wash;c.fillRect(0,0,w,h);
      c.fillStyle='rgba(58,60,44,.85)';c.fillRect(px(-.00052),0,px(.00052)-px(-.00052),h);
      c.fillStyle='rgba(176,93,61,.74)';c.fillRect(px(.0020),0,2,h);
      for(let mill=0;mill<=565;mill+=2){
        const y=py(mill/1000),long=mill%10===0,dec=mill%50===0;
        c.fillStyle=dec?'#304537':long?'#3a4e3c':'#617259';
        c.fillRect(px(-half),y,px(-half+(dec?.017:long?.011:.0052)),dec?5.5:long?4.5:2.4);
        if(dec&&mill) {
          c.save();c.translate(px(-.017),y+3);c.rotate(-Math.PI*.5);
          c.font='bold 31px monospace';c.textAlign='center';c.textBaseline='middle';c.fillText(String(mill/10),0,0);c.restore();
        }
      }
      for(let j=0;j<34;j++){
        const x=(j*171)%w,y=(j*341)%h;
        c.strokeStyle='rgba(236,244,227,.23)';c.lineWidth=1.2;c.beginPath();c.moveTo(x,y);c.lineTo(x+7+(j%6),y-15-(j%23));c.stroke();
      }
    });
    // A shallow bevel remains visible edge-on. The top and bevel share one draw.
    const deck=new T.BufferGeometry();
    const coords=new Float32Array(12*3),uv=new Float32Array(12*2),indexes=[];
    for(let r=0;r<2;r++)for(let i=0;i<6;i++) {
      if(!r&&i>=1&&i<5)indexes.push(0,i+1,i);
      if(!r){const n=(i+1)%6;indexes.push(i,n,i+6,n,n+6,i+6);}
    }
    deck.setIndex(indexes);deck.setAttribute('position',new T.BufferAttribute(coords,3));
    deck.setAttribute('uv',new T.BufferAttribute(uv,2));deck.setAttribute('normal',new T.BufferAttribute(new Float32Array(36),3));
    const clearScale=ink(scales.map);
    clearScale.side=T.DoubleSide;clearScale.roughness=.23;
    const mainBlade=mesh(blade,deck,clearScale);
    mainBlade.renderOrder=6;mainBlade.frustumCulled=false;
    // Spring shoe grips the two arrises, leaving the centre of the lens open.
    mesh(blade,new T.BoxGeometry(.084,.008,.004),bronze,0,-.066,.0080);
    for(const side of [-1,1]){
      mesh(blade,new T.BoxGeometry(.006,.032,.005),bronze,side*.039,-.069,.0074);
      pin(blade,steel,side*.037,-.067,.011,.0034,.0037,.0014,12);
    }
    let exposure=-1;
    function expose(length){
      if(Math.abs(exposure-length)<.00004)return;
      exposure=length;
      const c=Math.min(.007,length*.22), shoulder=Math.min(.022,length*.38);
      const points=[[-half*.68,0],[half*.68,0],[half,-shoulder],[half,-length+c],[half-c,-length],[-half,-length]];
      for(let i=0;i<12;i++){
        const xy=points[i%6],bottom=i>=6,k=i*3,t=i*2;
        coords[k]=xy[0]*(bottom?1.018:1);coords[k+1]=xy[1];coords[k+2]=bottom?.0016:.0047;
        uv[t]=.5+xy[0]/(2*half);uv[t+1]=1+xy[1]/bladeMax;
      }
      deck.attributes.position.needsUpdate=true;deck.attributes.uv.needsUpdate=true;deck.computeVertexNormals();
      mainBlade.visible=length>.004;
    }
    // Pointer across the fixed azimuth ring, balanced by the ruler on its reciprocal.
    const pointer=texture(128,512,(c,w,h)=>{
      c.fillStyle='rgba(195,207,176,.25)';c.beginPath();c.moveTo(w*.50,0);c.lineTo(w*.85,h*.29);
      c.lineTo(w*.74,h);c.lineTo(w*.26,h);c.lineTo(w*.15,h*.29);c.closePath();c.fill();
      c.strokeStyle='#994d34';c.lineWidth=4.5;c.beginPath();c.moveTo(w*.5,17);c.lineTo(w*.5,h);c.stroke();
      c.fillStyle='#9c4a30';c.beginPath();c.moveTo(w*.50,3);c.lineTo(w*.715,43);c.lineTo(w*.285,43);c.closePath();c.fill();
    });
    print(blade,pointer.map,.026,radius-.01,0,(radius+.01)*.5,.0056,7);
    pin(foot,steel,0,0,-.011,.002,.0006,.024,12);
    pin(foot,bronze,0,0,.0042,.020,.022,.0065,36);
    pin(foot,black,0,0,.009,.0155,.0175,.005,38);
    const fluted=own(new T.CylinderGeometry(.0132,.0145,.008,64));
    const fp=fluted.attributes.position;
    for(let i=0;i<fp.count;i++) {
      const x=fp.getX(i),z=fp.getZ(i),angle=Math.atan2(x,z);
      if(x*x+z*z>.00002){const amount=.967+.033*Math.cos(angle*32);fp.setX(i,x*amount);fp.setZ(i,z*amount);}
    }
    fluted.computeVertexNormals();const crown=mesh(foot,fluted,bronze,0,0,.015);crown.rotation.x=Math.PI*.5;
    pin(foot,steel,0,0,.0194,.0058,.0070,.0024,18);
    const slot=mesh(foot,new T.BoxGeometry(.0085,.00135,.0008),black,0,0,.0206);slot.rotation.z=.27;

    // Fixed window on the bezel. The measured forward true bearing is displayed,
    // while the blade extends behind its pin. The drum only updates at a detent.
    readout.position.set(mapW*.5-.135,-mapH*.5+.006,.029);
    mountedPlate(readout,.208,.055,.007,.012,bronze);
    const well=mountedPlate(readout,.185,.043,.004,.006,black);well.position.z=.012;
    const dials=texture(640,146);
    print(readout,dials.map,.182,.041,0,0,.0205,7);
    for(const sign of [-1,1])pin(readout,yellow,sign*.098,0,.0137,.0034,.004,.0035,12);
    function updateDrum(degrees){
      const {ctx:c,w,h,map}=dials;
      c.clearRect(0,0,w,h);c.fillStyle='#283931';c.fillRect(0,0,w,h);
      c.fillStyle='#d2bc81';c.textAlign='center';c.textBaseline='middle';c.font='bold 47px sans-serif';
      c.fillText('真方位',107,h*.5);
      const n=String(degrees).padStart(3,'0');
      const shade=c.createLinearGradient(0,8,0,h-8);
      shade.addColorStop(0,'#9e916c');shade.addColorStop(.16,'#d3c5a1');shade.addColorStop(.49,'#f0e6c4');
      shade.addColorStop(.85,'#d5c5a3');shade.addColorStop(1,'#897e63');
      for(let i=0;i<3;i++){
        const x=229+i*102;
        c.fillStyle=shade;c.fillRect(x,10,96,h-20);c.fillStyle='#2e362e';c.font='bold 107px monospace';
        c.fillText(n[i],x+48,h*.54);
      }
      c.fillStyle='#dbc999';c.font='75px Georgia';c.fillText('°',582,62);
      map.needsUpdate=true;
    }
    // The committed pencil trace is on the paper, beneath the moving acrylic.
    const pencil=texture(1536,Math.round(1536*mapH/mapW));
    const marksMesh=print(root,pencil.map,mapW,mapH,0,0,.0163,2);
    marksMesh.name='Graphite on chart paper';
    let saved='',oldDegree=-1,disposed=false;
    function graphite(c,w,h,r,number){
      const x0=r.u0*w,y0=r.v0*h,dx=(r.u1-r.u0)*w,dy=(r.v1-r.v0)*h;
      const len=Math.hypot(dx,dy),count=Math.max(1,Math.ceil(len/5));
      const nx=-dy/(len||1),ny=dx/(len||1);
      for(let j=0;j<3;j++){
        c.strokeStyle=['rgba(57,56,45,.83)','rgba(77,66,48,.54)','rgba(84,80,66,.38)'][j];
        c.lineWidth=[2.8,1.65,.75][j];c.beginPath();
        for(let k=0;k<=count;k++){
          const p=k/count,grain=.30*Math.sin((k+number*7)*2.71)+.24*Math.sin(k*.67);
          const offset=(j===0?0:j===1?1.22:-1.53)+grain;
          const x=x0+dx*p+(k===0||k===count?0:nx*offset),y=y0+dy*p+(k===0||k===count?0:ny*offset);
          if(k)c.lineTo(x,y);else c.moveTo(x,y);
        }
        c.stroke();
      }
      // Small pinhole at the occupied landmark, with the lifted edge of paper.
      c.fillStyle='#746b50';c.beginPath();c.ellipse(x0,y0,2.8,2.3,-.28,0,turn);c.fill();
      c.strokeStyle='rgba(247,231,190,.82)';c.lineWidth=1.2;c.beginPath();c.arc(x0,y0,3,.2,2.65);c.stroke();
    }
    function drawMarks(marks,fix){
      const {ctx:c,w,h,map}=pencil;
      c.clearRect(0,0,w,h);c.save();c.beginPath();c.rect(0,0,w,h);c.clip();
      marks.forEach((m,i)=>graphite(c,w,h,backRay(m.anchor,m.yaw),i));
      if(fix){
        const x=w*fix.u,y=h*fix.v;
        c.save();c.translate(x,y);c.rotate(-.075);
        c.strokeStyle='rgba(130,60,44,.93)';c.lineWidth=2.9;
        c.beginPath();c.ellipse(0,0,12,10.8,0,.23,turn+.09);c.stroke();
        c.strokeStyle='rgba(127,67,48,.73)';c.lineWidth=1.8;c.beginPath();
        c.moveTo(9,-8);c.lineTo(17,-15);c.moveTo(-7,7);c.lineTo(-12,13);c.stroke();
        c.fillStyle='#614b36';c.beginPath();c.arc(0,0,1.8,0,turn);c.fill();c.restore();
      }
      c.restore();map.needsUpdate=true;
    }
    const guideMat=standard(0x8b7453,{transparent:true,opacity:.57,depthWrite:false,roughness:.91,metalness:0});
    const guide=mesh(blade,new T.PlaneGeometry(.00125,1),guideMat);
    guide.name='Uninked alignment hairline';guide.renderOrder=3;guide.position.z=-.012;
    // Each piece moves with one of three rigid bodies. Coalesce their metalwork
    // once, retaining its normals, metalness and finish in both player views.
    function batchMetal(parent){
      for(const material of [bronze,steel,black,yellow]) {
        const items=parent.children.filter(m=>m.isMesh&&m.material===material);
        if(items.length<2)continue;
        const pp=[],nn=[],v=new T.Vector3(),normalMatrix=new T.Matrix3();
        for(const m of items) {
          m.updateMatrix();normalMatrix.getNormalMatrix(m.matrix);
          const geom=m.geometry,index=geom.index,att=geom.attributes,ct=index?index.count:att.position.count;
          for(let i=0;i<ct;i++) {
            const j=index?index.getX(i):i;
            v.fromBufferAttribute(att.position,j).applyMatrix4(m.matrix);pp.push(v.x,v.y,v.z);
            v.fromBufferAttribute(att.normal,j).applyNormalMatrix(normalMatrix);nn.push(v.x,v.y,v.z);
          }
          parent.remove(m);owned.delete(geom);geom.dispose();
        }
        const merged=new T.BufferGeometry();
        merged.setAttribute('position',new T.Float32BufferAttribute(pp,3));merged.setAttribute('normal',new T.Float32BufferAttribute(nn,3));
        mesh(parent,merged,material);
      }
    }
    [foot,blade,readout].forEach(batchMetal);
    active.visible=false;marksMesh.visible=false;
    function update(s){
      if(disposed)return;
      s=s||{};
      const marks=(Array.isArray(s.marks)?s.marks:[]).slice(0,2)
        .filter(m=>m&&valid(m.anchor)&&Number.isFinite(m.yaw));
      const fix=valid(s.fix)?s.fix:null;
      const signature=marks.map(m=>m.anchor.u+','+m.anchor.v+','+m.yaw).join(';')+'|'+(fix?fix.u+','+fix.v:'');
      if(signature!==saved){drawMarks(marks,fix);saved=signature;}
      marksMesh.visible=!!(marks.length||fix);
      active.visible=!!(s.show&&valid(s.anchor)&&Number.isFinite(s.dial));
      if(!active.visible)return;
      const a=s.dial;
      const r=backRay(s.anchor,a);
      const len=Math.hypot((r.u1-r.u0)*mapW,(r.v1-r.v0)*mapH);
      foot.position.set(X(r.u0),Y(r.v0),.042);
      blade.rotation.z=-paperBearing(a);
      expose(Math.min(bladeMax,len));
      guide.position.y=-len*.5;guide.scale.y=len;guide.visible=len>exposure+.001;
      const deg=((Math.round(a*180/Math.PI)%360)+360)%360;
      if(deg!==oldDegree){updateDrum(deg);oldDegree=deg;}
    }
    return {update,dispose(){
      if(disposed)return;
      disposed=true;boardGroup.remove(root);owned.forEach(o=>o.dispose());owned.clear();
    }};
  }
  return {create};
})();
