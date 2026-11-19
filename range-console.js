// Sealed coastal stereo-comparator. The video texture belongs to the optical renderer.
const TideRangeConsole=(()=>{
  function create(scene,g){
    const T=THREE,s=g.world.sections[0].sites[1],root=new T.Group(),owned=new Set();
    root.name='北岬岸台 · 双路比较显像器';const stationZ=s.z-.47;root.position.set(s.x,s.y,stationZ);root.userData.rangeOpticsOmit=true;scene.add(root);
    const own=o=>(owned.add(o),o),V=(x,y,z)=>new T.Vector3(x,y,z),tau=Math.PI*2;
    const Y=V(0,1,0),Z=V(0,0,1),X=V(1,0,0),groups=[root];
    const group=(p,x,y,z)=>{const o=new T.Group();o.position.set(x,y,z);p.add(o);groups.push(o);return o;};
    const standard=(c,r,m)=>own(new T.MeshStandardMaterial({color:c,roughness:r,metalness:m}));
    function surface(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;
      const tex=own(new T.CanvasTexture(c));if('colorSpace'in tex)tex.colorSpace=T.SRGBColorSpace;else tex.encoding=T.sRGBEncoding;
      tex.anisotropy=4;return {ctx:c.getContext('2d'),tex,w,h};}
    function texture(w,h,fn){const m=surface(w,h);fn(m.ctx,w,h);m.tex.needsUpdate=true;return m.tex;}
    let seed=19781103;const rand=()=>((seed=(Math.imul(1664525,seed)+1013904223)>>>0)/4294967296);
    const finish=texture(384,384,(c,w,h)=>{
      c.fillStyle='#a6b2a1';c.fillRect(0,0,w,h);const data=c.getImageData(0,0,w,h);
      for(let j=0;j<data.data.length;j+=4){const d=(rand()+rand()-1)*22;data.data[j]+=d;data.data[j+1]+=d;data.data[j+2]+=d;}c.putImageData(data,0,0);
      for(let i=0;i<48;i++){const x=w*rand(),y=h*rand();for(let j=0;j<21;j++){const a=rand()*tau,r=Math.pow(rand(),2)*9;
        c.fillStyle=j%4?'rgba(89,72,48,.57)':'rgba(185,174,127,.70)';c.fillRect(x+Math.cos(a)*r,y+Math.sin(a)*r,.5+2*rand(),.5+3*rand());}
        c.fillStyle='rgba(105,76,46,.14)';c.fillRect(x,y,1,4+14*rand());}
    });
    const enamel=standard(0x8daba3,.53,.31);enamel.map=finish;enamel.bumpMap=finish;enamel.bumpScale=.00065;
    const edge=standard(0x67756d,.48,.51),black=standard(0x303932,.69,.13),gun=standard(0x586458,.41,.61),brass=standard(0xbaa578,.41,.52),steel=standard(0xabae98,.40,.55);
    const paper=standard(0xffffff,.91,.015),cream=standard(0xffffff,.67,.14),wood=standard(0x9c814d,.60,.03),graphite=standard(0x36382e,.75,.16);
    const cube=own(new T.BoxGeometry()),cyl=own(new T.CylinderGeometry(1,1,1,32)),pin=own(new T.CylinderGeometry(1,1,1,10)),hex=own(new T.CylinderGeometry(1,1,1,6));
    function mesh(p,geo,mat,x=0,y=0,z=0){const a=new T.Mesh(geo,mat);a.position.set(x,y,z);p.add(a);return a;}
    function box(p,x,y,z,w,h,d,mat){const o=mesh(p,cube,mat,x,y,z);o.scale.set(w,h,d);return o;}
    function tube(p,x,y,z,r,len,axis,mat,geo=cyl){const m=mesh(p,geo,mat,x,y,z);m.scale.set(r,len,r);m.quaternion.setFromUnitVectors(Y,axis);return m;}
    function rod(p,a,b,r,mat){const dir=b.clone().sub(a),len=dir.length(),m=tube(p,0,0,0,r,len,dir.multiplyScalar(1/len),mat,pin);m.position.copy(a).lerp(b,.5);return m;}
    function shapePath(path,w,h,r){const a=w/2,b=h/2;path.moveTo(-a+r,-b);path.lineTo(a-r,-b);path.quadraticCurveTo(a,-b,a,-b+r);
      path.lineTo(a,b-r);path.quadraticCurveTo(a,b,a-r,b);path.lineTo(-a+r,b);path.quadraticCurveTo(-a,b,-a,b-r);path.lineTo(-a,-b+r);path.quadraticCurveTo(-a,-b,-a+r,-b);return path;}
    function casting(p,x,y,z,w,h,d,r,mat,hole){const sh=shapePath(new T.Shape(),w,h,r);
      if(hole)sh.holes.push(shapePath(new T.Path(),hole[0],hole[1],hole[2]));
      return mesh(p,own(new T.ExtrudeGeometry(sh,{depth:d,bevelEnabled:true,bevelThickness:.0025,bevelSize:.003,bevelSegments:2,curveSegments:6})),mat,x,y,z);}
    function plane(p,x,y,z,w,h,mat){return mesh(p,own(new T.PlaneGeometry(w,h)),mat,x,y,z);}
    const bolt=(p,x,y,z,r=.008)=>{tube(p,x,y,z,r,.009,Z,steel,hex);box(p,x,y,z+.005,r*.88,.0018,.0011,black).rotation.z=.49;};

    // Four bolted feet and a removable tube tray. Cabling exits through two independent glands.
    for(const x of [-.344,.344])for(const z of [-1.037,-.685]){
      box(root,x,.018,z,.113,.036,.109,edge);tube(root,x+.035,.043,z,.012,.018,Y,steel,hex);
      box(root,x,.415,z,.040,.773,.043,edge);box(root,x,.434,z+.019,.034,.761,.009,enamel);}
    box(root,0,.242,-1.035,.723,.045,.041,edge);
    for(const d of [-1,1]){rod(root,V(.324*d,.081,-1.045),V(-.324*d,.715,-1.045),.012,gun);
      rod(root,V(.333*d,.055,-.70),V(.333*d,.732,-1.04),.012,gun);}
    const bodyX=.0,sy=1.368,sz=-.841,sw=.68,sh=.51;
    casting(root,0,1.195,-1.13,.85,.868,.245,.044,enamel);
    // The cowl shelters only the perimeter of the glass. Its dripped edge is rolled galvanized metal.
    const roof=box(root,0,1.695,-.934,.901,.024,.435,edge);roof.rotation.x=.033;
    for(const x of [-.437,.437]){box(root,x,1.64,-.935,.016,.098,.363,enamel);rod(root,V(x,1.67,-1.12),V(x,1.657,-.744),.006,steel);}
    box(root,0,1.678,-.716,.904,.025,.014,edge);
    for(const x of [-.41,.41])for(const y of [1.13,1.60])bolt(root,x,y,-.875);
    // Visible pressed facets and the capacious dark CRT mask around a curved 4:3 face.
    casting(root,bodyX,sy,sz-.054,.805,.624,.039,.058,enamel,[.712,.541,.043]);
    casting(root,bodyX,sy,sz-.023,.741,.567,.025,.050,black,[sw-.003,sh-.003,.031]);
    const idle=texture(256,192,(c,w,h)=>{const grad=c.createRadialGradient(w*.48,h*.45,2,w*.5,h*.5,w*.7);
      grad.addColorStop(0,'#35483e');grad.addColorStop(1,'#14241f');c.fillStyle=grad;c.fillRect(0,0,w,h);
      c.fillStyle='rgba(45,56,48,.24)';for(let j=0;j<h;j+=3)c.fillRect(0,j,w,1);});
    const phosphor=own(new T.MeshBasicMaterial({map:idle,color:0xffffff,fog:false,toneMapped:false}));
    function glass(){const p=[],uv=[],ix=[],nx=32,ny=24,R=.032;
      for(let j=0;j<=ny;j++){const v=j/ny,y=(v-.5)*sh,yturn=Math.max(0,Math.abs(y)-(sh*.5-R));
        const hx=sw*.5-R+Math.sqrt(Math.max(0,R*R-yturn*yturn));
        for(let i=0;i<=nx;i++){const x=(i/nx-.5)*2*hx,u=x/sw+.5;
          p.push(x,y,-.004+.010*(1-((x/(sw*.5))**2+(y/(sh*.5))**2)*.51));uv.push(u,v);
          if(i<nx&&j<ny){const a=j*(nx+1)+i;ix.push(a,a+1,a+nx+1,a+1,a+nx+2,a+nx+1);}}}
      const geo=own(new T.BufferGeometry());geo.setAttribute('position',new T.Float32BufferAttribute(p,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.setIndex(ix);geo.computeVertexNormals();
      const o=mesh(root,geo,phosphor,bodyX,sy,sz);o.name='客观像面 · 4:3';o.userData.rangeOpticsOmit=true;}
    glass();
    for(const x of [-.382,.382])for(const y of [sy-.275,sy+.275])bolt(root,x,y,sz-.008,.0062);
    for(const x of [-.418,.418])for(let j=0;j<8;j++)box(root,x,1.10+j*.041,-.994,.010,.009,.148,black);
    for(let j=0;j<2;j++){const x=-.23+j*.119;tube(root,x,.849,-1.143,.034,.065,Z,black);tube(root,x,.849,-1.183,.026,.047,Z,brass,hex);
      rod(root,V(x,.849,-1.202),V(x,.66,-1.266-j*.018),.011,black);rod(root,V(x,.66,-1.266-j*.018),V(x,.036,-1.252-j*.018),.011,black);}

    // Sloped instrument apron, spring press, meters and pin-pricked two-line notebook.
    const panel=group(root,0,1.044,-.730);panel.rotation.x=-.30;panel.scale.y=.82;
    casting(panel,0,.001,-.210,.85,.302,.184,.027,enamel);
    casting(panel,0,.006,-.024,.810,.268,.018,.018,edge);
    for(const x of [-.383,.383])for(const y of [-.097,.109])bolt(panel,x,y,0,.0063);
    const dialPrint=surface(700,259),readMat=standard(0xffffff,.56,.18);readMat.map=dialPrint.tex;
    casting(panel,.042,.038,.002,.163,.087,.013,.007,black);
    plane(panel,.042,.038,.018,.151,.075,readMat);
    const plateTex=texture(1024,130,(c,w,h)=>{c.fillStyle='#2e3b34';c.fillRect(0,0,w,h);c.fillStyle='#e0d9b6';c.font='bold 58px sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText('双像测距仪',w*.39,h*.47);c.font='35px monospace';c.fillText('B–II',w*.83,h*.53);
      c.strokeStyle='#82856a';c.lineWidth=3;c.strokeRect(6,7,w-12,h-14);});
    const plateMat=standard(0xffffff,.63,.22);plateMat.map=plateTex;
    plane(root,.172,1.066,-.872,.214,.028,plateMat);
    for(const x of [.073,.272])bolt(root,x,1.066,-.867,.0026);
    const note=surface(640,354);paper.map=note.tex;const pad=group(panel,-.211,.032,.008);
    box(pad,0,-.004,0,.27,.151,.011,black);
    for(let j=0;j<3;j++)box(pad,j*.0009,j*.0008,.006+j*.0015,.259-j*.001,.140,.0018,cream);
    plane(pad,0,0,.012,.254,.139,paper);
    box(pad,-.116,0,.016,.008,.122,.004,brass);
    for(const y of [-.043,.042])tube(pad,-.115,y,.020,.0035,.004,Z,gun);
    const pencil=group(panel,-.101,-.078,.038);pencil.rotation.z=.10;
    tube(pencil,0,0,0,.0046,.136,X,wood,hex);tube(pencil,.062,0,0,.0053,.016,X,brass);
    rod(pencil,V(-.068,0,0),V(-.079,0,0),.002,graphite);for(const x of [-.145,-.067])box(panel,x,-.077,.030,.006,.018,.018,gun);
    // Drum axis points to the operator. Detents and rim remain connected to the driven wheel.
    const wx=.237,wy=.023,wr=.066,scaleP=group(panel,wx,wy,.028);
    tube(scaleP,0,0,0,.100,.045,Z,black);tube(scaleP,0,0,.028,.090,.020,Z,brass);
    const face=texture(512,512,(c,w,h)=>{c.translate(w/2,h/2);c.fillStyle='#b9b69b';c.fillRect(-w/2,-h/2,w,h);
      const a0=-2.10,a1=2.10;for(let j=0;j<=45;j++){const a=a0+(a1-a0)*j/45,ss=Math.sin(a),cc=-Math.cos(a),maj=j%5===0,
        r=246,ri=maj?202:225;c.strokeStyle='#303b30';c.lineWidth=maj?4.5:2.5;c.beginPath();c.moveTo(ss*r,cc*r);c.lineTo(ss*ri,cc*ri);c.stroke();
        if(maj){c.textAlign='center';c.textBaseline='middle';c.font='bold 27px monospace';c.fillStyle='#243329';c.fillText(String(15+j),ss*180,cc*180);}}
      c.textAlign='center';c.fillStyle='#3e4738';c.font='bold 32px sans-serif';c.fillText('近    远',0,156);});
    const scaleMat=standard(0xffffff,.65,.09);scaleMat.map=face;mesh(scaleP,own(new T.CircleGeometry(.087,48)),scaleMat,0,0,.040);
    const wheel=group(scaleP,0,0,.065);
    tube(wheel,0,0,0,wr,.048,Z,black);tube(wheel,0,0,.029,.048,.014,Z,gun);
    tube(wheel,0,0,.040,.037,.010,Z,black);
    for(let i=0;i<34;i++){const a=i*tau/34;const k=box(wheel,Math.sin(a)*.065,Math.cos(a)*.065,.003,.0055,.0047,.041,gun);k.rotation.z=-a;}
    rod(wheel,V(0,.050,.023),V(0,.082,.020),.0027,brass);
    const crank=group(wheel,.037,.012,.048);tube(crank,0,0,.066,.0065,.132,Z,brass);
    tube(crank,0,0,.137,.017,.080,Z,wood);tube(crank,0,0,.176,.014,.005,Z,brass);
    tube(crank,0,0,.098,.018,.006,Z,brass);
    const selector=group(panel,.058,-.045,.038);
    for(const x of [-.042,.042])tube(panel,.058+x,-.045,.028,.0068,.008,Z,brass);
    box(panel,.058,-.045,.029,.092,.010,.013,black);
    rod(selector,V(0,0,0),V(.015,-.029,.087),.0065,steel);
    rod(selector,V(.015,-.029,.087),V(0,.018,.263),.006,gun);
    tube(selector,0,.018,.273,.019,.047,X,wood);tube(selector,-.023,.018,.273,.016,.005,X,brass);
    const index=group(pad,0,0,.019);
    // A brass reading cursor runs on the left margin without covering the handwritten figures.
    box(index,-.110,0,0,.008,.021,.004,brass);rod(index,V(-.111,.008,0),V(-.094,0,0),.0018,brass);rod(index,V(-.111,-.008,0),V(-.094,0,0),.0018,brass);
    const left=group(panel,-.267,-.099,.053);
    for(const x of [-.043,.043]){rod(left,V(x,0,-.026),V(x,0,.108),.0073,gun);rod(left,V(x,0,.108),V(x,.019,.248),.0068,gun);tube(left,x,0,-.022,.012,.011,Z,brass);}
    tube(left,0,.019,.248,.015,.099,X,black);
    let oldDigits='',oldTicket='',lastCount=0;const punch=group(pad,.085,.046,.022);
    tube(punch,0,0,.009,.0037,.029,Z,gun);box(punch,.015,0,.015,.034,.005,.005,brass);
    function writeRange(value,angle,selected){
      const light=Number.isFinite(angle),read=light?(angle<0?'−':'')+Math.abs(angle).toFixed(1):value.toFixed(1),sig=read+'/'+(light?selected:'m');
      if(oldDigits===sig)return;oldDigits=sig;const c=dialPrint.ctx,w=dialPrint.w,h=dialPrint.h;
      c.fillStyle='#252d25';c.fillRect(0,0,w,h);c.fillStyle='#d0cead';c.textAlign='center';c.font='bold 39px sans-serif';c.fillText(light?(selected?'前窗 · 灯轴':'断桩 · 灯轴'):'斜距',light?w*.35:w*.23,53);
      c.font='bold 150px monospace';c.textAlign='right';c.fillStyle='#e5dfbf';c.fillText(read,w*.83,h*.82);c.font='bold 42px monospace';c.fillText(light?'°':'m',w*.94,h*.81);
      c.fillStyle='rgba(211,207,164,.13)';c.fillRect(22,h*.53,w-44,2);dialPrint.tex.needsUpdate=true;
    }
    function writeTicket(rows){
      const fmt=(n,k=1)=>Number.isFinite(n)?Number(n).toFixed(k):'—';
      const data=rows.slice(0,2).map(r=>[r.id==='ship'?'前窗':'断桩',fmt(r.distance),Number.isFinite(r.bearing)?String((Math.round(r.bearing*180/Math.PI)%360+360)%360).padStart(3,'0')+'°':'—']);
      const sig=JSON.stringify(data);if(oldTicket===sig)return;oldTicket=sig;const c=note.ctx,w=note.w,h=note.h;
      c.fillStyle='#d6cfb2';c.fillRect(0,0,w,h);let k=5021;for(let j=0;j<2600;j++){k=(Math.imul(48271,k)>>>0)+11;c.fillStyle=j%2?'rgba(126,111,81,.11)':'rgba(253,248,219,.16)';c.fillRect(k%w,(k>>>12)%h,1.8,1.3);}
      c.fillStyle='#51594a';c.textAlign='left';c.font='bold 43px serif';c.fillText('岸 台 测 距 抄 数 联',41,62);c.fillStyle='#626b57';c.font='bold 27px sans-serif';
      c.fillText('物标',44,119);c.fillText('斜距 / m',218,119);c.fillText('方位',440,119);
      c.strokeStyle='#898a70';c.lineWidth=2;for(const y of [78,133,221,310]){c.beginPath();c.moveTo(26,y);c.lineTo(619,y);c.stroke();}
      for(const x of [191,411]){c.beginPath();c.moveTo(x,85);c.lineTo(x,310);c.stroke();}
      for(let i=0;i<data.length;i++){const y=194+i*88;c.save();c.translate(49,y);c.rotate(i?.009:-.013);c.fillStyle='#424438';c.font='italic 45px serif';c.fillText(data[i][0],0,0);c.fillText(data[i][1],173,0);c.fillText(data[i][2],390,0);c.restore();
        c.fillStyle='#8e8262';c.beginPath();c.arc(572,y-17,7,0,tau);c.fill();c.fillStyle='#433d31';c.beginPath();c.arc(570,y-16,4.2,0,tau);c.fill();c.strokeStyle='#f6e7bb';c.beginPath();c.arc(572,y-17,6,.2,2.1);c.stroke();}
      note.tex.needsUpdate=true;
    }
    function compact(p){
      const by=new Map();for(const m of p.children.filter(o=>o.isMesh)){const a=by.get(m.material)||[];a.push(m);by.set(m.material,a);}
      for(const [mat,ls] of by){if(ls.length<2)continue;const p0=[],n0=[],u0=[],M=new T.Matrix3(),v=new T.Vector3();
        for(const m of ls){m.updateMatrix();M.getNormalMatrix(m.matrix);const a=m.geometry.attributes,ix=m.geometry.index,count=ix?ix.count:a.position.count;
          for(let j=0;j<count;j++){const i=ix?ix.getX(j):j;v.fromBufferAttribute(a.position,i).applyMatrix4(m.matrix);p0.push(v.x,v.y,v.z);
            v.fromBufferAttribute(a.normal,i).applyNormalMatrix(M);n0.push(v.x,v.y,v.z);u0.push(a.uv?a.uv.getX(i):0,a.uv?a.uv.getY(i):0);}p.remove(m);}
        const geo=own(new T.BufferGeometry());geo.setAttribute('position',new T.Float32BufferAttribute(p0,3));geo.setAttribute('normal',new T.Float32BufferAttribute(n0,3));geo.setAttribute('uv',new T.Float32BufferAttribute(u0,2));mesh(p,geo,mat);}}
    for(const a of groups)compact(a);
    let strikeAt=-100,lastTime=-100;function update(game){const r=game.rangeWatch;
      const value=Math.min(60,Math.max(15,Number.isFinite(r?.range)?r.range:15)),rows=r?.samples||[],now=Number(game.time)||0;
      root.visible=game.index===11;
      const light=r?.phase==='light'&&rows.length===2,selection=light&&r.selection===1?1:0;
      const rec=rows[selection],angle=light&&typeof TideRangeWatch!=='undefined'&&Number.isFinite(rec.pitch)?TideRangeWatch.lampBearing(game,rec)*180/Math.PI:null;
      wheel.rotation.z=2.1-(value-15)/45*4.2;writeRange(value,angle,selection);writeTicket(rows);
      const step=1-Math.exp(-28*Math.max(0,Math.min(.25,now-lastTime)));lastTime=now;
      selector.position.x+=(.058+(light?(selection?.037:-.037):0)-selector.position.x)*step;
      index.visible=light;index.position.y=selection?-.036:-.001;
      if(rows.length>lastCount)strikeAt=now;lastCount=rows.length;
      const age=now-strikeAt,press=Math.max(0,1-Math.abs(age-.09)/.12);
      left.rotation.x=.084*press;
      punch.position.y=rows.length===0||rows.length===1&&age<.30?-.001:-.035;
      punch.position.z=.028-.010*press;}
    const lh=V(0,.019,.248),rh=V(0,0,.158),selectorHand=V(0,.018,.273);
    function grips(game){if(!game.rangeWatch||game.engaged?.[1]===false)return null;return [left.localToWorld(lh.clone()),game.rangeWatch.phase==='light'?selector.localToWorld(selectorHand.clone()):crank.localToWorld(rh.clone())];}
    function shot(game,aspect=.82){if(!game.rangeWatch)return null;
      const a=Math.max(.45,Math.min(2.7,Number(aspect)||.82)),wide=Math.max(0,Math.min(1,(a-.93)/.37));
      // An undivided landscape window looks down into the instrument apron from above the operator.
      // This keeps the paper, drum and CRT in one composition as the screen becomes shallower.
      const landscape=Math.max(0,Math.min(1,(a-1.30)/.48)),dist=.539+.181*landscape;
      const eyeY=1.383+.517*landscape,atY=1.195+.071*wide+.044*landscape;
      const slope=(atY-eyeY)/dist,depth=(dist+(sy-eyeY)*slope)/Math.hypot(1,slope);
      const targetHeight=a<=1.3?Math.max(.869,1.03/a):Math.max(.485,sw*dist/(depth*a*(.610-.009*landscape)));
      const fov=2*Math.atan(targetHeight/(2*dist))*180/Math.PI;
      return {eye:[s.x+.015,s.y+eyeY,stationZ+sz+dist],at:[s.x,s.y+atY,stationZ+sz],fov,handsOnly:false};}
    function setScreen(tex){const use=tex||idle;if(phosphor.map===use)return;phosphor.map=use;phosphor.needsUpdate=true;}
    let disposed=false;update(g);return {update,shot,grips,setScreen,dispose(){if(disposed)return;disposed=true;root.removeFromParent();owned.forEach(o=>o.dispose());owned.clear();}};
  }
  return {create};
})();
