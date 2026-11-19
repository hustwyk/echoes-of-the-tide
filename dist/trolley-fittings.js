// Captive landing bolt and fixed keeper. Local coordinates are metres in the relay mast frame.
// The caller owns the travelling platform's transform and the physics of alignment.
const TideTrolleyFittings=(()=>{
  function create(parent,car){
    const T=THREE,resources=new Set(),own=a=>(resources.add(a),a),tau=Math.PI*2;
    const V=(x=0,y=0,z=0)=>new T.Vector3(x,y,z),Y=V(0,1,0),Z=V(0,0,1),X=V(1,0,0);
    const buckets=[],nodes=[];
    function assembly(parent,name,x=0,y=0,z=0){const n=new T.Group();n.name=name;n.position.set(x,y,z);parent.add(n);buckets.push(n);return n;}
    const rider=assembly(car,'索车 · 捕获销'),station=assembly(parent,'桅梯 · 承口与绞车附具');
    nodes.push(rider,station);
    function surface(w,h,painter){const c=document.createElement('canvas');c.width=w;c.height=h;painter(c.getContext('2d'),w,h);
      const t=own(new T.CanvasTexture(c));if('colorSpace'in t)t.colorSpace=T.SRGBColorSpace;else t.encoding=T.sRGBEncoding;t.anisotropy=4;return t;}
    let seed=0x6721f3;const random=()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296);
    const skin=surface(256,256,(c,w,h)=>{
      const d=c.createImageData(w,h);for(let i=0;i<d.data.length;i+=4){const q=227+(random()+random()-1)*22;d.data[i]=q;d.data[i+1]=q;d.data[i+2]=q-1;d.data[i+3]=255;}c.putImageData(d,0,0);
      for(let j=0;j<49;j++){const x=random()*w,y=random()*h;
        for(let k=0;k<19;k++){const a=random()*tau,r=random()**2*7;c.fillStyle=k%5?'rgba(107,92,67,.28)':'rgba(253,248,219,.48)';c.fillRect(x+r*Math.cos(a),y+r*Math.sin(a),.6+random()*1.25,.8+random()*2);}
        c.strokeStyle='rgba(85,80,63,.10)';c.beginPath();c.moveTo(x,y);c.lineTo(x+random()*.8,y+3+14*random());c.stroke();}
    });
    const brush=surface(256,128,(c,w,h)=>{c.fillStyle='#deded6';c.fillRect(0,0,w,h);
      for(let i=0;i<1400;i++){const y=random()*h,x=random()*w;c.strokeStyle=i%3?'rgba(136,134,115,.17)':'rgba(253,250,229,.25)';c.lineWidth=.25+random()*.75;c.beginPath();c.moveTo(x,y);c.lineTo(x+random()*41+1,y+random()*.24);c.stroke();}});
    const std=(tex,r,m)=>own(new T.MeshStandardMaterial({vertexColors:true,color:0xffffff,map:tex,roughness:r,metalness:m}));
    const cast=std(skin,.61,.44),metal=std(brush,.39,.61),rubber=std(skin,.84,.045);
    const paint='#647572',dark='#364240',smoke='#4c5450',red='#9a5643',line='#e1dec1',brz='#b79a5d',brzD='#8c734b',silver='#bec3b5',polish='#e0dcca',grease='#524933',umber='#805d41',ebony='#333b34';
    const white=new T.Color(0xffffff),cube=own(new T.BoxGeometry()),cyl=own(new T.CylinderGeometry(1,1,1,32)),little=own(new T.CylinderGeometry(1,1,1,12)),hex=own(new T.CylinderGeometry(1,1,1,6));
    function part(p,geo,mat,col,x=0,y=0,z=0){const m=new T.Mesh(geo,mat);m.userData.tint=col;m.position.set(x,y,z);p.add(m);return m;}
    function box(p,x,y,z,w,h,d,mat,col){const o=part(p,cube,mat,col,x,y,z);o.scale.set(w,h,d);return o;}
    function disk(p,x,y,z,r,h,axis,mat,col,geo=cyl){const o=part(p,geo,mat,col,x,y,z);o.scale.set(r,h,r);o.quaternion.setFromUnitVectors(Y,axis);return o;}
    function rod(p,a,b,r,mat,col,geo=little){const v0=V(...a),d=V(...b).sub(v0),length=d.length(),o=disk(p,0,0,0,r,length,d.multiplyScalar(1/length),mat,col,geo);o.position.copy(v0).addScaledVector(d,length*.5);return o;}
    function rounded(path,w,h,r){const a=w*.5,b=h*.5;path.moveTo(-a+r,-b);path.lineTo(a-r,-b);path.quadraticCurveTo(a,-b,a,-b+r);path.lineTo(a,b-r);path.quadraticCurveTo(a,b,a-r,b);path.lineTo(-a+r,b);path.quadraticCurveTo(-a,b,-a,b-r);path.lineTo(-a,-b+r);path.quadraticCurveTo(-a,-b,-a+r,-b);return path;}
    function plate(p,x,y,z,w,h,d,r,mat,col,hole){
      const sh=rounded(new T.Shape(),w,h,r);if(hole){const cut=new T.Path();cut.absellipse(0,0,hole[0],hole[1],0,tau,true,0);sh.holes.push(cut);}
      const geo=own(new T.ExtrudeGeometry(sh,{depth:d,curveSegments:7,bevelEnabled:true,bevelSegments:2,bevelThickness:.002,bevelSize:.003}));
      return part(p,geo,mat,col,x,y,z);}
    function bolt(p,x,y,z,r,axis=Z){disk(p,x,y,z,r*1.43,.004,axis,metal,brzD,little);
      const a=V(x,y,z).addScaledVector(axis,.005);disk(p,a.x,a.y,a.z,r,.009,axis,metal,silver,hex);}
    function ring(p,x,y,z,r,t,mat,col){return part(p,own(new T.TorusGeometry(r,t,7,40)),mat,col,x,y,z);}
    // Closed cross-section through an open elliptical throat. The back surface cannot fill the hole.
    function liner(p,x,y,z,profile,mat,tints){
      const pos=[],norm=[],uv=[],colors=[],idx=[],seg=48;
      const arc=(r,s,d,power,a)=>{const c=Math.cos(a),q=Math.sin(a);return V(r*Math.sign(c)*Math.abs(c)**(2/power),s*Math.sign(q)*Math.abs(q)**(2/power),d);};
      for(let k=0;k<profile.length-1;k++){
        const [ax,ay,az,ea=2]=profile[k],[bx,by,bz,eb=2]=profile[k+1],shade=new T.Color(tints[k]||tints[0]),base=pos.length/3;
        for(let i=0;i<=seg;i++){const a=tau*i/seg,p0=arc(ax,ay,az,ea,a),p1=arc(bx,by,bz,eb,a);
          const du=arc(ax,ay,az,ea,a+.0007).sub(arc(ax,ay,az,ea,a-.0007)),n=du.cross(p1.clone().sub(p0)).normalize();
          for(const p of [p0,p1]){pos.push(p.x,p.y,p.z);norm.push(n.x,n.y,n.z);uv.push(i/seg,p.z*8+.5);colors.push(shade.r,shade.g,shade.b);}
          if(i<seg){const a0=base+i*2;idx.push(a0,a0+2,a0+1,a0+1,a0+2,a0+3);}
        }
      }
      const geo=own(new T.BufferGeometry());geo.setAttribute('position',new T.Float32BufferAttribute(pos,3));geo.setAttribute('normal',new T.Float32BufferAttribute(norm,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.setAttribute('color',new T.Float32BufferAttribute(colors,3));geo.setIndex(idx);
      return part(p,geo,mat,null,x,y,z);}
    // Shaft offsets are from the travelling pointed tip toward the operator in +Z.
    function turned(p,x,y,z,profile,mat,col){
      const seg=40,pts=profile.map(([d,r])=>new T.Vector2(r,d)),geo=own(new T.LatheGeometry(pts,seg));
      const o=part(p,geo,mat,col,x,y,z);o.rotation.x=Math.PI*.5;return o;}
    function hose(p,points,r,mat,col,n=24){
      const path=new T.CatmullRomCurve3(points.map(pt=>V(...pt)),false,'centripetal');
      return part(p,own(new T.TubeGeometry(path,n,r,6,false)),mat,col);}
    const cradle=assembly(rider,'螺栓底座与青铜滑瓦');
    for(const x of [-.092,.092]){
      box(cradle,x,.020,-.398,.098,.034,.314,cast,dark);
      for(const z of [-.502,-.305])bolt(cradle,x,.044,z,.014,Y);
      box(cradle,x,.267,-.424,.043,.455,.133,cast,paint);
      box(cradle,x,.273,-.489,.052,.455,.014,metal,smoke);
      rod(cradle,[x,.052,-.278],[x,.475,-.421],.016,cast,paint);}
    box(cradle,0,.478,-.426,.220,.057,.131,cast,paint);box(cradle,0,.524,-.413,.160,.052,.205,cast,paint);
    // Offset saddle caps leave both the rod and its witness band visible between the bearings.
    for(const z of [-.471,-.307]){
      plate(cradle,0,.630,z-.024,.191,.149,.046,.020,cast,dark,[.043,.041]);
      liner(cradle,0,.630,z,[[.046,.045,-.027],[.053,.051,-.027],[.053,.051,.026],[.047,.045,.031],[.039,.039,.031],[.0375,.0375,.020],[.0375,.0375,-.026],[.046,.045,-.027]],metal,[brzD,brzD,brz,polish,brz,grease,brzD]);
      for(const x of [-.070,.070]){bolt(cradle,x,.625,z+.029,.009);disk(cradle,x,.712,z,.011,.015,Y,metal,silver,hex);}
    }
    // Oil cup on the field-replaceable rear bush.
    disk(cradle,-.050,.718,-.307,.011,.018,Y,metal,brz);disk(cradle,-.050,.728,-.307,.015,.006,Y,metal,brzD);
    const boltHead=assembly(rider,'捕获销 · 推柄与削尖销头',0,.63,-.54);
    turned(boltHead,0,0,0,[[0,0],[.002,.008],[.013,.013],[.075,.031],[.088,.0330],[.548,.0330],[.555,.029],[.599,.029],[.601,.033],[.645,.033],[.654,.026],[.654,0]],metal,silver);
    for(const d of [.093,.107,.513,.520])ring(boltHead,0,0,d,.0327,.0012,metal,d<.2?grease:brzD);
    turned(boltHead,0,0,.586,[[0,.029],[.003,.0361],[.042,.0361],[.045,.031]],metal,brz);
    // The lock stripe sits in a turned recess, protected from wiping against the two guide bushes.
    turned(boltHead,0,0,.566,[[0,.029],[.001,.0300],[.018,.0300],[.019,.029]],rubber,'#f5efd4');
    ring(boltHead,0,0,.566,.0294,.0011,metal,smoke);
    // Captive return cover: its narrow slot follows the crank take-off, so the witness stripe
    // is concealed in the home position and emerges into the gap between bushes near full travel.
    const hoodP=[],hoodN=[],hoodUV=[],hoodIX=[],na=35;
    for(let j=0;j<=na;j++){const a=1.48+(tau-1.40)*j/na,c=Math.cos(a),v=Math.sin(a);
      for(const z of [-.280,.100]){hoodP.push(.052*c,.63+.052*v,z);hoodN.push(c,v,0);hoodUV.push(j/na,z*4+.5);}
      if(j<na){const i=j*2;hoodIX.push(i,i+2,i+1,i+1,i+2,i+3);}}
    const hood=own(new T.BufferGeometry());hood.setAttribute('position',new T.Float32BufferAttribute(hoodP,3));hood.setAttribute('normal',new T.Float32BufferAttribute(hoodN,3));hood.setAttribute('uv',new T.Float32BufferAttribute(hoodUV,2));hood.setIndex(hoodIX);part(cradle,hood,cast,dark);
    for(const a of [1.48,1.48+tau-1.40])rod(cradle,[.052*Math.cos(a),.63+.052*Math.sin(a),-.280],[.052*Math.cos(a),.63+.052*Math.sin(a),.100],.003,metal,smoke);
    rod(cradle,[0,.580,.077],[0,.472,-.258],.017,cast,paint);
    // A cranked integral handle clears the rod. A short T-grip travels with the pin along the entire 400 mm stroke.
    rod(boltHead,[.016,.012,.612],[.110,.099,.641],.016,metal,smoke);
    rod(boltHead,[.110,.099,.641],[.148,.178,.671],.014,metal,silver);
    disk(boltHead,.148,.185,.671,.021,.094,X,rubber,ebony);for(const x of [.102,.194])disk(boltHead,x,.185,.671,.020,.008,X,metal,brz);
    const brace=assembly(rider,'车上左侧固定扶把');
    for(const z of [-.415,-.187]){disk(brace,-.188,.414,z,.025,.022,X,metal,brzD);rod(brace,[-.09,.414,z],[-.189,.414,z],.014,cast,paint);}
    hose(brace,[[-.189,.415,-.415],[-.189,.795,-.415],[-.189,.847,-.386],[-.189,.866,-.317],[-.189,.866,-.234],[-.189,.840,-.198],[-.189,.795,-.187],[-.189,.415,-.187]],.016,metal,brz,36);
    rod(brace,[-.189,.865,-.313],[-.189,.865,-.239],.019,rubber,ebony);
    // Narrow spring-loaded verification pawl physically drops into the travelling pin's reduced rear groove.
    const pawl=assembly(rider,'落锁簧爪',.057,.720,-.359);
    rod(pawl,[0,0,0],[-.050,-.065,-.003],.010,metal,brz);
    box(pawl,-.050,-.066,-.003,.021,.023,.015,metal,smoke);disk(pawl,0,0,0,.014,.045,X,metal,silver);
    const keeper=assembly(station,'桅梯锁座 · 向艇一侧开口',-1.52,2.65,-2.20);
    // The existing side strings are at ±.32 and z+.15. The cast ears stay below the next ladder rung.
    for(const s of [-1,1]){
      box(keeper,s*.256,-.018,.005,.197,.086,.041,cast,paint);
      rod(keeper,[s*.201,-.053,.006],[s*.307,-.087,.148],.017,cast,dark);
      rod(keeper,[s*.230,.017,.006],[s*.322,.017,.135],.014,metal,smoke);
      box(keeper,s*.32,.003,.117,.076,.082,.018,cast,smoke);
      hose(keeper,[[s*.349,.002,.107],[s*.349,.002,.157],[s*.342,.002,.177],[s*.319,.002,.183],[s*.297,.002,.172],[s*.291,.002,.146],[s*.291,.002,.105]],.0064,metal,silver,22);
      for(const u of [-.028,.028])bolt(keeper,s*.32+u,.002,.107,.008,V(0,0,-1));
    }
    plate(keeper,0,0,-.085,.364,.248,.042,.023,cast,red,[.145,.110]);
    for(const x of [-.153,.153])for(const y of [-.088,.088])bolt(keeper,x,y,-.036,.010);
    liner(keeper,0,0,0,[[.119,.089,-.134,4.4],[.132,.097,-.134,3.8],[.135,.101,-.052,3.8],[.148,.113,-.019,3.4],[.152,.117,-.003,3.4],[.148,.113,.008,3.4],[.128,.093,.008,4.2],[.117,.087,-.015,5],[.111,.082,-.075,6],[.111,.082,-.133,6],[.119,.089,-.134,4.4]],metal,
      [smoke,brzD,brzD,brz,brz,polish,brz,brzD,grease,brzD]);
    // Opposed enamel witness marks align with the scraped sleeve centre, without painting over the hole.
    for(const dir of [-1,1]){box(keeper,0,dir*.104,.011,.013,.014,.004,rubber,'#f4eed5');
      box(keeper,dir*.138,0,.011,.016,.008,.004,rubber,'#f4eed5');}
    box(cradle,0,.706,-.455,.012,.004,.039,cast,line);
    // Bolted on the old winch, above its existing wheel. Scale and pointer share one calibrated pivot.
    const meter=assembly(station,'绞车行程表',-.104,1.405,2.772);
    for(const s of [-1,1]){rod(meter,[s*.156,-.030,-.029],[s*.155,-.478,-.145],.014,cast,paint);
      rod(meter,[s*.154,-.066,-.035],[s*.206,-.482,.052],.011,metal,smoke);}
    plate(meter,0,0,-.066,.394,.267,.093,.026,cast,paint);
    plate(meter,0,0,.025,.367,.242,.013,.017,metal,smoke);
    const face=surface(768,492,(c,w,h)=>{
      const grad=c.createLinearGradient(0,0,w*.12,h);grad.addColorStop(0,'#e2dfc7');grad.addColorStop(.62,'#c7c3a6');grad.addColorStop(1,'#aba58d');c.fillStyle=grad;c.fillRect(0,0,w,h);
      for(let j=0;j<6600;j++){c.fillStyle=j%2?'rgba(71,66,42,.15)':'rgba(250,249,219,.24)';c.fillRect(random()*w,random()*h,.5+random()*1.4,.7+random());}
      const gx=w*.5,gy=h*.86,rad=h*.732,angle=t=>-1.06+2.12*t,px=(v,r)=>gx+Math.sin(angle(v))*r,py=(v,r)=>gy-Math.cos(angle(v))*r;
      c.strokeStyle='#494a3e';c.lineWidth=1.8;c.beginPath();c.arc(gx,gy,rad,-Math.PI/2-1.06,-Math.PI/2+1.06);c.stroke();
      c.strokeStyle='#8c493a';c.lineWidth=14;c.beginPath();c.arc(gx,gy,rad+7,angle(.786)-Math.PI/2,angle(.834)-Math.PI/2);c.stroke();
      for(let j=0;j<=50;j++){const t=j/50,m=j%5===0,r=rad-(m?38:j%2?16:23);c.strokeStyle='#313b32';c.lineWidth=m?4:2;c.beginPath();c.moveTo(px(t,rad-2),py(t,rad-2));c.lineTo(px(t,r),py(t,r));c.stroke();
        if(j%10===0){c.fillStyle='#2c3630';c.textAlign='center';c.textBaseline='middle';c.font='bold 33px monospace';c.fillText(String(j*2),px(t,r-27),py(t,r-27));}}
      c.fillStyle='#904833';c.font='bold 28px sans-serif';c.textAlign='center';c.fillText('靠梯',px(.81,rad+38),py(.81,rad+38));
      c.fillStyle='#434c3e';c.font='bold 39px serif';c.fillText('索车行程',w*.5,h*.61);c.font='21px sans-serif';c.fillText('百分刻度',w*.5,h*.705);
    });
    const print=own(new T.MeshStandardMaterial({map:face,color:0xffffff,roughness:.78,metalness:.08}));
    part(meter,own(new T.PlaneGeometry(.344,.220)),print,null,0,0,.042);
    for(const x of [-.172,.172])for(const y of [-.106,.106])bolt(meter,x,y,.042,.0055);
    const dial=assembly(meter,'行程机械指针',0,-.0792,.051);
    const triangle=new T.Shape();triangle.moveTo(-.005,-.021);triangle.lineTo(.006,-.021);triangle.lineTo(.003,.139);triangle.lineTo(0,.162);triangle.lineTo(-.0025,.138);
    part(dial,own(new T.ShapeGeometry(triangle)),metal,'#743526');
    disk(dial,0,0,.003,.009,.006,Z,metal,brz);
    const glass=own(new T.MeshPhysicalMaterial({color:0xd4e2ce,roughness:.12,metalness:.10,transparent:true,opacity:.052,depthWrite:false}));
    part(meter,own(new T.PlaneGeometry(.345,.220)),glass,null,0,0,.061);
    // The screw-adjusted brake shoe bears directly on the exposed rear drum flange, separate from the wheel.
    const brakeBase=assembly(station,'独立手制动',-.05,0,2.70);
    rod(brakeBase,[.183,.740,-.191],[.315,.809,.168],.015,cast,paint);
    rod(brakeBase,[.177,.898,.135],[.319,.813,.160],.018,metal,smoke);
    plate(brakeBase,.306,.821,.129,.099,.111,.047,.015,cast,dark);
    disk(brakeBase,.305,.821,.174,.024,.028,X,metal,brz);bolt(brakeBase,.336,.821,.169,.014,X);
    const lever=assembly(brakeBase,'制动柄 · 工作行程',.305,.821,.166);
    rod(lever,[0,-.044,-.055],[0,.198,.019],.0125,metal,silver);rod(lever,[0,.195,.018],[0,.237,.060],.013,metal,smoke);
    disk(lever,0,.239,.077,.018,.092,X,rubber,ebony);for(const x of [-.046,.046])disk(lever,x,.239,.077,.015,.006,X,metal,brzD);
    // Spring sits between a fixed lug and the live lever. Its helix pitch extends as the handle moves.
    const spring=assembly(brakeBase,'制动回簧'),spA=V(.305,.718,-.004),spB=V(),leverTie=V(0,.090,.010);
    const helix=[];for(let i=0;i<=114;i++){const t=i/114,a=tau*9*t;helix.push([.0132*Math.cos(a),t*.195,.0132*Math.sin(a)]);}
    hose(spring,helix,.0031,metal,smoke,136);
    disk(brakeBase,spA.x,spA.y,spA.z,.009,.036,X,metal,brz);
    const link=assembly(brakeBase,'刹瓦调节拉杆'),stop=V(.157,.866,-.196),tie=V(0,-.042,-.050);
    rod(link,[0,0,0],[0,1,0],.0062,metal,silver);
    disk(brakeBase,stop.x,stop.y,stop.z,.010,.040,Z,metal,smoke);
    hose(brakeBase,[[.155,.861,-.196],[.179,.904,-.196],[.184,.952,-.196],[.174,.989,-.196]],.0115,metal,brzD,15);
    // Compact each rigid part into a mesh per finish; position/normal/UVs are transformed once.
    function compact(g){
      const sets=new Map(),tint=new T.Color(),v=V(),nrm=new T.Matrix3();
      for(const o of g.children.filter(v=>v.isMesh)){
        if(!o.material.vertexColors)continue;const arr=sets.get(o.material)||[];arr.push(o);sets.set(o.material,arr);}
      for(const [mat,parts] of sets){const pos=[],norm=[],uv=[],colors=[],indices=[];
        for(const obj of parts){
          obj.updateMatrix();nrm.getNormalMatrix(obj.matrix);const src=obj.geometry.attributes,ind=obj.geometry.index,base=pos.length/3;
          tint.copy(obj.userData.tint?new T.Color(obj.userData.tint):white);
          for(let k=0;k<src.position.count;k++){
            v.fromBufferAttribute(src.position,k).applyMatrix4(obj.matrix);pos.push(v.x,v.y,v.z);v.fromBufferAttribute(src.normal,k).applyNormalMatrix(nrm);norm.push(v.x,v.y,v.z);
            uv.push(src.uv?.getX(k)||0,src.uv?.getY(k)||0);if(src.color)colors.push(src.color.getX(k)*tint.r,src.color.getY(k)*tint.g,src.color.getZ(k)*tint.b);
            else colors.push(tint.r,tint.g,tint.b);}
          if(ind)for(let k=0;k<ind.count;k++)indices.push(base+ind.getX(k));else for(let k=0;k<src.position.count;k++)indices.push(base+k);
          g.remove(obj);}
        const geo=own(new T.BufferGeometry());geo.setAttribute('position',new T.Float32BufferAttribute(pos,3));geo.setAttribute('normal',new T.Float32BufferAttribute(norm,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.setAttribute('color',new T.Float32BufferAttribute(colors,3));geo.setIndex(indices);geo.computeBoundingSphere();
        const m=new T.Mesh(geo,mat);m.castShadow=m.receiveShadow=true;g.add(m);}
    }
    for(const group of buckets)compact(group);
    const reuse=[V(),V()],reuseBrake=V(),bracePoint=V(-.189,.865,-.272),drivePoint=V(.148,.185,.671),brakePoint=V(0,.239,.077),q=V();
    const sat=x=>Math.min(1,Math.max(0,Number(x)||0));
    function stretch(group,a,b,authoredLength=1){q.copy(b).sub(a);const len=q.length();group.position.copy(a);group.scale.set(1,len/authoredLength,1);group.quaternion.setFromUnitVectors(Y,q.multiplyScalar(1/len));}
    function update(state={}){
      const travel=sat(state.travel),brake=sat(state.brake),stroke=sat(state.bolt);
      boltHead.position.z=-.54-.40*stroke;dial.rotation.z=1.06-2.12*travel;
      lever.rotation.x=-.43+.98*brake;pawl.rotation.x=state.locked?0:-.65;
      lever.updateMatrix();spB.copy(leverTie).applyMatrix4(lever.matrix);stretch(spring,spA,spB,.195);
      spB.copy(tie).applyMatrix4(lever.matrix);stretch(link,stop,spB);
    }
    function grip(out=reuse){brace.localToWorld(out[0].copy(bracePoint));boltHead.localToWorld(out[1].copy(drivePoint));return out;}
    function brakeGrip(out=reuseBrake){return lever.localToWorld(out.copy(brakePoint));}
    let freed=false;update();
    return {update,grip,brakeGrip,dispose(){if(freed)return;freed=true;for(const n of nodes)n.removeFromParent();for(const r of resources)r.dispose();resources.clear();}};
  }
  return {create};
})();
