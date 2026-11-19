// Hai Yan stern fittings. Metres in the ferry's own frame. Attach to the live ferry,
// not the shared actor template. The nearby lantern and actors supply all scene light.
const TideAfterdeck=(()=>{
  const glyphs=[[{"p":[[142,99],[127,95],[131,87],[135,72],[151,76]],"parent":-1},{"p":[[49,110],[48,110],[46,100],[31,59],[22,42],[31,37],[41,29],[42,29],[47,50],[59,86],[64,98],[56,102]],"parent":-1},{"p":[[147,146],[132,143],[132,141],[136,134],[139,123],[156,126],[152,137]],"parent":-1},{"p":[[33,164],[23,149],[25,149],[40,141],[56,129],[66,144]],"parent":-1},{"p":[[46,218],[34,206],[52,193],[65,180],[78,192],[61,207]],"parent":-1},{"p":[[111,224],[108,216],[93,188],[79,168],[69,157],[76,155],[84,150],[95,164],[96,163],[91,118],[86,117],[85,118],[70,119],[70,103],[82,104],[83,105],[89,105],[90,104],[84,52],[98,53],[99,54],[170,54],[171,53],[170,48],[165,42],[156,39],[145,39],[152,30],[154,22],[169,25],[178,29],[183,34],[185,38],[186,49],[188,54],[196,54],[205,52],[205,69],[196,67],[189,67],[188,68],[190,104],[191,105],[213,104],[213,119],[203,117],[192,117],[191,118],[195,168],[193,167],[177,167],[176,166],[124,166],[123,167],[98,167],[97,168],[110,187],[200,187],[201,186],[210,186],[210,202],[195,201],[194,200],[120,200],[119,201],[124,208],[130,214],[133,214],[134,216],[114,222]],"parent":-1},{"p":[[105,103],[107,105],[174,105],[175,101],[174,100],[172,68],[171,67],[102,67],[101,69],[102,70]],"parent":5},{"p":[[111,153],[112,154],[177,154],[178,153],[178,141],[177,140],[176,118],[175,117],[108,117],[107,121],[108,122]],"parent":5}],[{"p":[[130,191],[125,168],[120,153],[110,133],[99,117],[104,112],[108,105],[117,118],[119,123],[121,125],[122,124],[122,50],[121,49],[120,29],[136,29],[136,45],[137,46],[204,46],[205,45],[211,45],[211,60],[206,60],[205,59],[177,59],[176,60],[176,82],[177,83],[202,82],[202,96],[197,95],[177,95],[176,96],[176,115],[177,116],[202,115],[202,129],[197,128],[177,128],[176,129],[176,148],[177,149],[207,148],[207,162],[202,162],[201,161],[138,161],[137,164],[144,179],[150,186],[149,187],[137,188]],"parent":-1},{"p":[[136,82],[137,83],[160,83],[161,82],[161,60],[160,59],[137,59],[136,60]],"parent":0},{"p":[[136,115],[137,116],[160,116],[161,115],[161,96],[160,95],[137,95],[136,96]],"parent":0},{"p":[[136,148],[137,149],[160,149],[161,148],[161,129],[160,128],[137,128],[136,129]],"parent":0},{"p":[[173,192],[160,184],[170,167],[184,177]],"parent":-1},{"p":[[207,211],[188,211],[187,210],[55,210],[54,211],[41,211],[42,178],[43,177],[43,115],[42,114],[42,101],[41,100],[40,84],[36,65],[25,38],[37,35],[42,32],[46,41],[53,64],[56,80],[56,86],[57,87],[59,114],[60,115],[67,108],[80,127],[81,126],[81,53],[80,52],[79,31],[96,31],[96,161],[103,175],[109,181],[109,183],[101,184],[89,188],[89,184],[79,153],[69,135],[60,123],[59,124],[59,133],[60,134],[60,196],[61,197],[172,197],[173,196],[207,195]],"parent":-1}]];
  const mapsURL=new URL('afterdeck-maps.js',document.currentScript?.src||document.baseURI).href;
  let pending;
  function stock(){
    if(window.TideAfterdeckMaps)return Promise.resolve(window.TideAfterdeckMaps);
    if(!pending)pending=new Promise((res,rej)=>{
      const s=document.createElement('script');s.src=mapsURL;s.async=true;
      s.onload=()=>window.TideAfterdeckMaps?res(window.TideAfterdeckMaps):rej(Error('Afterdeck maps missing'));
      s.onerror=()=>{pending=null;s.remove();rej(Error('Afterdeck maps unavailable'));};document.head.append(s);
    });
    return pending;
  }
  function create(ship){
    const T=THREE,owned=new Set(),own=o=>(owned.add(o),o),root=new T.Group();root.name='海雁 · 艉甲板';ship.add(root);
    const mat=(color,roughness,metalness)=>own(new T.MeshStandardMaterial({color,roughness,metalness,vertexColors:true}));
    const deck=mat(0x64796b,1,1),iron=mat(0x7e8070,.94,1),gear=mat(0xffffff,.42,.63),
      rail=mat(0x9fa99c,.58,.34),band=mat(0xdedec8,.64,.10),rope=mat(0x897752,.91,.015),paint=mat(0xffffff,.66,.17);
    let disposed=false;
    const ready=stock().then(async maps=>{
      if(disposed)return false;
      const l=new T.TextureLoader(),jobs=[];
      function load(id,col,wrap=false){
        let good,bad;jobs.push(new Promise((res,rej)=>{good=res;bad=rej;}));
        const t=own(l.load(maps[id],good,undefined,bad));t.anisotropy=8;
        if(col){if('colorSpace' in t && T.SRGBColorSpace)t.colorSpace=T.SRGBColorSpace;else if(T.sRGBEncoding)t.encoding=T.sRGBEncoding;}
        if(wrap)t.wrapS=t.wrapT=T.RepeatWrapping;return t;
      }
      const dm=load('deck',true),dn=load('deckNormal',false),da=load('deckArm',false);
      const sm=load('gear',true,true),sn=load('gearNormal',false,true),sa=load('gearArm',false,true);
      const cloth=load('rope',true,true),fibres=load('ropeNormal',false,true),cuffs=load('white',true),railMap=load('rail',true);
      await Promise.all(jobs);if(disposed)return false;
      Object.assign(deck,{map:dm,normalMap:dn,roughnessMap:da,metalnessMap:da});deck.normalScale.set(1.07,1.07);
      Object.assign(iron,{map:sm,normalMap:sn,roughnessMap:sa,metalnessMap:sa});iron.normalScale.set(.44,.44);
      Object.assign(rope,{map:cloth,normalMap:fibres});rope.normalScale.set(.63,.63);band.map=cuffs;rail.map=railMap;
      for(const m of [deck,iron,band,rope,rail]){m.color.set(0xffffff);m.needsUpdate=true;}
      return true;
    }).catch(()=>false);
    const v=(x,y,z)=>new T.Vector3(x,y,z),Y=v(0,1,0),Z=v(0,0,1),unit=v(1,1,1),tau=Math.PI*2;
    const tmp=v(0,0,0),nm=v(0,0,0),color=new T.Color(),q=new T.Quaternion(),rot=new T.Euler(),M=new T.Matrix4(),N=new T.Matrix3();
    const bucket=new Map();
    function grp(m){if(!bucket.has(m))bucket.set(m,{p:[],n:[],uv:[],c:[]});return bucket.get(m);}
    function put(g,p,n,uv,c){g.p.push(p.x,p.y,p.z);g.n.push(n.x,n.y,n.z);g.uv.push(uv[0],uv[1]);g.c.push(c.r,c.g,c.b);}
    function quad(m,pts,out,uv,tint=0xffffff,normals){
      const g=grp(m),normal=v(0,0,0).crossVectors(pts[1].clone().sub(pts[0]),pts[2].clone().sub(pts[0])).normalize();
      const flip=normal.dot(out)<0;if(flip)normal.negate();color.set(tint);
      for(const i of flip?[0,2,1,0,3,2]:[0,1,2,0,2,3])put(g,pts[i],normals?normals[i]:normal,uv[i],color);
    }
    const I=[[0,0],[1,0],[1,1],[0,1]],templates=[],keep=g=>(templates.push(g),g);
    const boxG=keep(new T.BoxGeometry()),barG=keep(new T.CylinderGeometry(1,1,1,12)),nutG=keep(new T.CylinderGeometry(1,1,1,6));
    function place(m,geo,point,scale=unit,quat=q.identity(),tint=0xffffff){
      const g=grp(m),aa=geo.attributes,ix=geo.index,count=ix?ix.count:aa.position.count;M.compose(point,quat,scale);N.getNormalMatrix(M);color.set(tint);
      for(let i=0;i<count;i++){const j=ix?ix.getX(i):i;tmp.fromBufferAttribute(aa.position,j).applyMatrix4(M);nm.fromBufferAttribute(aa.normal,j).applyNormalMatrix(N);
        put(g,tmp,nm,aa.uv?[aa.uv.getX(j),aa.uv.getY(j)]:[0,0],color);}
    }
    function box(m,x,y,z,w,h,d,tint=0xffffff,rx=0,ry=0,rz=0){
      place(m,boxG,v(x,y,z),v(w,h,d),q.setFromEuler(rot.set(rx,ry,rz)),tint);
    }
    function rod(m,a,b,r,tint=0xffffff){
      const axis=b.clone().sub(a);place(m,barG,a.clone().lerp(b,.5),v(r,axis.length(),r),q.setFromUnitVectors(Y,axis.normalize()),tint);
    }
    function pin(m,x,y,z,r,h,axis=Y,tint=0xffffff,shape=nutG){
      place(m,shape,v(x,y,z),v(r,h,r),q.setFromUnitVectors(Y,axis),tint);
    }
    const deckY=z=>1.34+(Math.max(0,z-6.9)/1.8)*.06;
    const beam=z=>z<=6.9?2.20+(6.9-z)*.16/3:2.20-(z-6.9)*.30/1.80;
    const uv=p=>[(p.x+2.28)/4.56,1-(p.z-5.88)/2.84];
    const y=z=>deckY(z)+.006;
    // Crown and transom taper match the exact two final stations of the base mesh.
    // Coplanar joins stay level with the characters' boots.
    for(const [lo,hi] of [[5.90,6.82],[6.82,6.90],[6.90,7.94],[7.94,8.699]]){
      const w0=beam(lo)-.009,w1=beam(hi)-.009;
      const start=[-w0,-w0+.133,-.38,w0-.133,w0],end=[-w1,-w1+.133,-.38,w1-.133,w1];
      for(let i=0;i<4;i++){
        const pts=[v(start[i],y(lo),lo),v(end[i],y(hi),hi),v(end[i+1],y(hi),hi),v(start[i+1],y(lo),lo)];
        quad(deck,pts,Y,pts.map(uv),i===0||i===3?0xe8eee6:0xffffff);
      }
    }
    // Aft boarding strip over the welded transom angle. There is no crosswise
    // threshold in the two people's walking path.
    const e=8.69,transomY=y(e);
    box(iron,0,transomY-.008,e,3.768,.030,.043,0xb3c3b5);
    for(const [j,z] of [6.22,6.90,7.80,8.69].entries())for(const side of [-1,1]){
      const x=side*(beam(z)-.060),h=y(z);
      box(iron,x,h+.006,z,.118,.012,.134,0xc5d0c0,0,side*(z>6.90?.164:.053));
      pin(gear,x,h+.018,z,.043,.016,Y,0x82897a,barG);
      for(const dz of [-.044,.044])for(const dx of [-.032,.032])pin(gear,x+dx,h+.015,z+dz,.0082,.008,Y,(j+Math.sign(dz))%2?0x9b9982:0x857764);
    }
    // A single port-of-centre stanchion holds this 3.72-m transom span. The
    // two starboard sighting bands and the aperture between them are free.
    const sx=-.17,sy=y(8.68);
    box(iron,sx,sy+.005,8.66,.156,.013,.078,0xc1c8b6);
    rod(iron,v(sx,sy+.007,8.671),v(sx,2.089,8.699),.022,0xf7f6e5);
    for(const dx of [-.052,.052])pin(gear,sx+dx,sy+.015,8.658,.0085,.007,Y,0xa29c88);
    // Existing physical tubes lie at y=1.75 / 2.10, r=.027. Thin weathered
    // outer skins have the same optical centreline even when the ship rolls.
    function railSkin(m,x0,x1,cy,cz,radius,tag,seed){
      const n=32,steps=tag?12:6;
      function coords(i,j){
        const u=i/steps,ang=j/n*tau,s=Math.sin(ang),c=Math.cos(ang);
        const lean=tag?.0025*Math.sin(ang*3+seed)+.0014*Math.sin(ang*7+.7):0;
        const w=tag?Math.min(1,i,steps-i):1,rad=radius+(tag?(w*.0004+.0005*Math.cos(u*tau*7+ang+seed)):0);
        return {p:v(x0+(x1-x0)*u+lean,cy+c*rad,cz+s*rad),n:v(0,c,s),uv:[u,1-j/n]};
      }
      for(let i=0;i<steps;i++)for(let j=0;j<n;j++){
        const cc=[coords(i,j),coords(i+1,j),coords(i+1,j+1),coords(i,j+1)];
        const clr=tag?0xffffff:m===iron?0xf5f6e6:0xffffff;
        quad(m,cc.map(a=>a.p),cc[0].n,cc.map(a=>a.uv),clr,cc.map(a=>a.n));
      }
    }
    railSkin(rail,-1.86,1.86,2.10,8.70,.0286,false,0);
    railSkin(rail,-1.86,1.86,1.75,8.70,.0282,false,0);
    for(const [i,x] of [.55,1.66].entries()){
      const width=i?.147:.158;
      railSkin(band,x-width/2,x+width/2,2.10,8.70,.0313,true,i?2.87:.80);
    }
    // Through-deck scupper gratings. The slots are open over black recessed cups;
    // their rounded rims and side bolts sit outside the playable corridor.
    for(const side of [-1,1])for(const [j,z] of [6.46,side<0?8.40:8.175].entries()){
      const x=side*(beam(z)-.18),h=y(z),a=z>6.9?side*.165:side*.052,w=.127,len=j?.257:.198;
      box(gear,x,h+.004,z,w+.033,.006,len+.032,0x726d54,0,a);
      box(paint,x,h+.008,z,w-.013,.002,len-.018,0x1a2624,0,a);
      function at(xx,zz,dy){return v(x+Math.cos(a)*xx+Math.sin(a)*zz,h+dy,z+Math.cos(a)*zz-Math.sin(a)*xx);}
      for(let k=0;k<7;k++){const zz=(-.42+k*.14)*len;
        rod(iron,at(-w*.5+.006,zz,.013),at(w*.5-.006,zz-.012,.013),.0052,0xc6c3a6);}
      for(const xx of [-1,1])for(const zz of [-1,1]){
        const p=at(xx*(w*.5+.006),zz*(len*.5+.003),.011);
        pin(gear,p.x,p.y,p.z,.005,.004,Y,0x97947f);
      }
    }
    // Double bits and their mooring line are stowed outside x=-1.55.
    const bitX=-1.845,forward=6.730,aft=7.157;
    function pad(x,z,w,d,h,base,tint){
      const poly=[[-.45,-.5],[.45,-.5],[.5,-.46],[.5,.46],[.45,.5],[-.45,.5],[-.5,.46],[-.5,-.46]].map(([a,b])=>v(x+w*a,base,z+d*b));
      const centre=v(x,base+h,z);for(let j=0;j<poly.length;j++){
        const k=(j+1)%poly.length,a=poly[j],b=poly[k],c=b.clone(),d=a.clone();c.y+=h;d.y+=h;
        const normalize=p=>[(p.x-x)/w+.5,(p.z-z)/.84+.5];
        quad(iron,[a,b,c,d],v((a.x+b.x)*.5-x,0,(a.z+b.z)*.5-z),[a,b,c,d].map(normalize),tint);
        quad(iron,[c,d,centre,centre],Y,[c,d,centre,centre].map(normalize),tint);
      }
    }
    pad(bitX,6.948,.398,.829,.014,deckY(6.96)+.004,0xdfddd0);
    pad(bitX,6.948,.376,.812,.033,deckY(6.96)+.015,0xf0eee1);
    const rings=[ [.000,.128],[.011,.151],[.025,.155],[.042,.137],[.061,.110],[.088,.096],[.150,.089],
      [.255,.092],[.277,.102],[.291,.131],[.305,.139],[.322,.134],[.331,.113],[.336,.079],[.340,.031],[.341,.0001] ];
    function latheBit(z){
      const h=deckY(z)+.046,radial=36;
      for(let i=0;i<rings.length-1;i++){
        const [y0,r0]=rings[i],[y1,r1]=rings[i+1];
        for(let k=0;k<radial;k++){
          const points=[[k,y0,r0],[k+1,y0,r0],[k+1,y1,r1],[k,y1,r1]].map(([k,y,r])=>{
            const t=k/radial*tau;return v(bitX+r*Math.sin(t),h+y,z+r*Math.cos(t));});
          const ns=[k,k+1,k+1,k].map(k=>v(Math.sin(k*tau/radial),(r0-r1)/(y1-y0),Math.cos(k*tau/radial)).normalize());
          const uv=[[k/radial,0.04+y0*2.6],[(k+1)/radial,.04+y0*2.6],[(k+1)/radial,.04+y1*2.6],[k/radial,.04+y1*2.6]];
          quad(i===9||i===10?gear:iron,points,ns[0],uv,i===9||i===10?0x95988a:i===0?0xa7ada0:0xf0efe6,ns);
        }
      }
      pin(gear,bitX,h+.342,z,.013,.003,Y,0x888c80,nutG);
      for(const dx of [-.138,.138])for(const dz of [-.137,.137])pin(gear,bitX+dx,h-.001,z+dz,.013,.015,Y,0x807967);
    }
    latheBit(forward);latheBit(aft);
    // Single continuous laid hawser, starting with a flat tapered Flemish coil,
    // then a turn around each bit. Each strand rotates with distance along it.
    const ropePts=[];
    for(let i=0;i<=175;i++){
      const u=i/175,a=u*5.5*tau,r=.030+.142*u,rz=.054+.270*u,z=7.80+rz*Math.cos(a);
      ropePts.push(v(-1.81+r*Math.sin(a),y(z)+.015+.0019*Math.sin(a*2.2+.3),z));
    }
    const rz=y(aft)+.105;
    ropePts.push(v(-1.915,y(7.392)+.017,7.392),v(-1.956,rz-.047,7.294));
    for(let i=0;i<=25;i++){const a=-1.14-(i/25)*Math.PI*1.62;
      ropePts.push(v(bitX+.105*Math.sin(a),rz+.019*i/25,aft+.105*Math.cos(a)));}
    ropePts.push(v(bitX+.073,rz+.026,7.003),v(bitX+.092,rz+.018,6.886));
    for(let i=0;i<=28;i++){const a=.60+(i/28)*Math.PI*1.69;
      ropePts.push(v(bitX+.109*Math.sin(a),rz+.013-.019*i/28,forward+.109*Math.cos(a)));}
    ropePts.push(v(bitX-.063,rz+.005,6.885),v(bitX-.040,rz+.031,6.981),v(bitX+.049,rz+.051,7.053),
      v(bitX+.087,rz+.049,7.121),v(bitX+.098,rz+.038,7.184));
    const path=new T.CatmullRomCurve3(ropePts,false,'centripetal'),ropeLen=path.getLength(),steps=355,segs=14;
    const fr=path.computeFrenetFrames(steps,false);let old=[];
    for(let i=0;i<=steps;i++){
      const u=i/steps,center=path.getPointAt(u),ring=[];
      for(let j=0;j<=segs;j++){
        const a=j/segs*tau,r=.0147*(.962+.061*Math.cos(3*a-u*ropeLen/.048*tau));
        const n=fr.normals[i].clone().multiplyScalar(Math.cos(a)).addScaledVector(fr.binormals[i],Math.sin(a));
        ring.push({p:center.clone().addScaledVector(n,r),n,uv:[u*ropeLen/.145,j/segs]});
      }
      if(i)for(let j=0;j<segs;j++){
        const p=[old[j],ring[j],ring[j+1],old[j+1]],clr=i<108?0xc2b499:i<steps*.7?0xd4c9af:0xdfdcc7;
        quad(rope,p.map(a=>a.p),p[0].n,p.map(a=>a.uv),clr,p.map(a=>a.n));
      }
      old=ring;
    }
    for(let k=0;k<5;k++){
      const u=(.002+k*.0046)/ropeLen,a=path.getPointAt(u),axis=path.getTangentAt(u);
      pin(paint,a.x,a.y,a.z,.0160,.0046,axis,0x756d59,barG);
    }
    for(let k=0;k<5;k++){
      const u=(ropeLen-.029+k*.0055)/ropeLen,a=path.getPointAt(u),axis=path.getTangentAt(u);
      pin(paint,a.x,a.y,a.z,.0158,.0039,axis,k===1?0x554f43:0x73674f,barG);
    }
    // Two die-formed characters have actual sides and counters. The main
    // transom lettering and a smaller inboard yard plate share the same die.
    function board(x,yy,z,w,h,yaw,legs){
      box(iron,x,yy,z,w,h,.019,0xe3e6d6,0,yaw);
      const f=Math.cos(yaw);
      box(paint,x,yy,z+f*.0091,w-.017,h-.016,.0046,0x384e48,0,yaw);
      if(legs)for(const u of [-.40,.40]){
        const xx=x+w*u;
        rod(iron,v(xx,deckY(z)+.009,z+.018),v(xx,1.746,z+.024),.0123,0xb4c5b6);
        box(iron,xx,1.725,z+.012,.029,.050,.047,0xc1c6aa);
      }
      for(const u of [-1,1])for(const t of [-1,1]){
        const xx=x+u*(w*.5-.020),cy=yy+t*(h*.5-.023);
        pin(gear,xx,cy,z+f*.0128,.0074,.005,v(0,0,f),0xb0a58a,barG);
      }
      const sz=h*1.01;
      glyphs.forEach((rings,i)=>{
        const gxy=points=>points.map(([cx,cy])=>new T.Vector2((cx/244-.5)*sz+(i-.5)*sz*1.10,(cy/244-.5)*sz));
        const shapes=[];
        rings.forEach((ring,j)=>{
          if(ring.parent!==-1||ring.p.length<3)return;
          const sh=new T.Shape(gxy(ring.p));sh.closePath();
          for(const child of rings.filter(r=>r.parent===j&&r.p.length>=3)){
            const hole=new T.Path(gxy(child.p));hole.closePath();sh.holes.push(hole);
          }
          shapes.push(sh);
        });
        const type=keep(new T.ExtrudeGeometry(shapes,{depth:legs?.0025:.0048,bevelEnabled:true,bevelThickness:legs?.0007:.0013,
          bevelSize:legs?.0005:.0009,bevelSegments:1,curveSegments:2}));
        place(paint,type,v(x,yy,z+f*.0125),unit,q.setFromAxisAngle(Y,yaw),legs?0xe1d7ac:0xe9e6cd);
      });
    }
    board(0,.849,8.706,.998,.365,0,false);
    board(-.83,1.618,8.639,.564,.206,Math.PI,true);
    for(const [m,a] of bucket){
      const g=own(new T.BufferGeometry());g.setAttribute('position',new T.Float32BufferAttribute(a.p,3));g.setAttribute('normal',new T.Float32BufferAttribute(a.n,3));
      g.setAttribute('color',new T.Float32BufferAttribute(a.c,3));g.setAttribute('uv',new T.Float32BufferAttribute(a.uv,2));g.computeBoundingSphere();
      const mesh=new T.Mesh(g,m);mesh.name=m===deck?'Riveted anti-slip afterdeck':m===rope?'Port Flemish coil':m===band?'Two painted stern sighting bands':m===rail?'Galvanized transom rail':
        m===iron?'Bitts, scuppers and stern rail':m===paint?'Embossed HAI YAN nameplates':'Rubbed fittings';
      mesh.castShadow=m!==deck&&m!==band;mesh.receiveShadow=true;root.add(mesh);
    }
    bucket.clear();templates.forEach(g=>g.dispose());
    return {ready,dispose(){if(disposed)return;disposed=true;ship.remove(root);owned.forEach(o=>o.dispose());owned.clear();}};
  }
  return {create};
})();
