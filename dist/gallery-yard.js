// Riveted galleries and a folding access bridge. All dimensions are in metres.
// The deck geometry uses the collision layout directly. Pivots, handrails and
// brackets are kept outside the clear width of each landing.
const TideGalleryYard=(()=>{
  const T=THREE;
  function create(scene,g){
    const layout=g.world?.gallery;
    if(!layout)return {update(){},dispose(){}};
    const root=new T.Group();root.name='北岬 · 悬挑钢廊与折桥';scene.add(root);
    const owned=new Set(),batches=new Map(),own=a=>(owned.add(a),a);
    const V=(x=0,y=0,z=0)=>new T.Vector3(x,y,z),up=V(0,1,0),unitX=V(1,0,0);
    const midpoint=(a,b)=>a.clone().lerp(b,.5);
    const W=d=>V(d.axes.ux,d.axes.uy||0,d.axes.uz),D=d=>V(d.axes.vx,d.axes.vy||0,d.axes.vz);
    const P=(d,u=0,y=0,v=0)=>V(d.x,d.y+y,d.z).addScaledVector(W(d),u).addScaledVector(D(d),v);
    const dim=(w,h,d)=>V(w,h,d),I=new T.Quaternion();
    const orient=(x,y=up)=>{const z=x.clone().cross(y).normalize();return new T.Quaternion().setFromRotationMatrix(new T.Matrix4().makeBasis(x,y,z));};
    const steel=TideSteel.material(0,own,true),tread=TideSteel.material(1,own,true);
    steel.name='钢廊 · 旧绿铅漆与露底铁';steel.roughness=.76;steel.metalness=.44;steel.normalScale.setScalar(.49);
    tread.name='钢廊 · 雨湿轧花板';tread.roughness=.65;tread.metalness=.55;tread.normalScale.setScalar(.72);
    // Retain the scan's colour at exposed primer flecks; salt-blanched rolled
    // surfaces lighten at abrasive points. Triplanar projection is assembly-local.
    const weather=steel.onBeforeCompile;
    steel.onBeforeCompile=function(s,renderer){
      weather.call(this,s,renderer);
      s.fragmentShader=s.fragmentShader.replace('diffuseColor.rgb*=mix(scanned,patina,surfaceBlend);',
        'float ox=clamp((scanned.r-scanned.g)*22.,0.,.68); diffuseColor.rgb=mix(diffuseColor.rgb*patina,vec3(.18,.065,.028)*(0.6+grain),ox);');
    };
    steel.customProgramCacheKey=()=>'tide-gallery-painted-iron24';
    const grain=tread.onBeforeCompile;
    tread.onBeforeCompile=function(s,renderer){
      grain.call(this,s,renderer);
      s.fragmentShader=s.fragmentShader.replace('diffuseColor.rgb*=mix(scanned,patina,surfaceBlend);',
        'float wear=clamp((grain-.009)*10.,0.,1.); vec3 rolled=mix(vec3(.30,.36,.33),vec3(1.22,1.24,1.17),smoothstep(.04,.83,wear)); diffuseColor.rgb*=rolled;');
    };
    tread.customProgramCacheKey=()=>'tide-gallery-tread24';
    const enamel=own(new T.MeshStandardMaterial({roughness:.43,metalness:.18,emissive:0x201e14,emissiveIntensity:.27}));
    const glow=own(new T.MeshBasicMaterial({color:0xffffff,toneMapped:false}));
    const cube=own(new T.BoxGeometry()),tube=own(new T.CylinderGeometry(.5,.5,1,10)),hex=own(new T.CylinderGeometry(.5,.5,1,6));
    const axisQ=v=>new T.Quaternion().setFromUnitVectors(up,v);
    const paint=0x768b81,iron=0x465552,edge=0x88958a,black=0x353e3d,bronze=0xa58d67,ochre=0xc6a262,white=0xdacfb3,oxide=0x965c44;
    const identity=V(),leaf=layout.bridge[0],bridgePivot=P(leaf,0,-.123,leaf.d*.5);
    const mobile=new T.Group();mobile.position.copy(bridgePivot);mobile.name='东座 · 铰接折桥';root.add(mobile);
    function add(node,geo,mat,col,world,size,q=I){
      const key=node.id+'/'+geo.id+'/'+mat.id;
      let batch=batches.get(key);
      if(!batch){batch={node,geo,mat,entries:[]};batches.set(key,batch);}
      const p=world.clone().sub(node===mobile?bridgePivot:identity);
      batch.entries.push([new T.Matrix4().compose(p,q,size),col]);
    }
    const block=(node,c,p,w,h,d,q=I,mat=steel)=>add(node,cube,mat,c,p,dim(w,h,d),q);
    function at(node,f,u,y,v,w,h,d,c,mat=steel){block(node,c,P(f,u,y,v),w,h,d,orient(W(f)),mat);}
    function rod(node,a,b,diam,c=paint,geo=tube,mat=steel){
      const delta=b.clone().sub(a),n=delta.length();if(n<.0001)return;
      add(node,geo,mat,c,midpoint(a,b),dim(diam,n,diam),axisQ(delta.divideScalar(n)));
    }
    function strip(node,a,b,width,height,color=iron){
      const delta=b.clone().sub(a),len=delta.length();if(len<.0001)return;
      const z=delta.divideScalar(len),x=up.clone().cross(z);
      if(x.lengthSq()<.001)x.copy(unitX);else x.normalize();
      const y=z.clone().cross(x);
      const q=new T.Quaternion().setFromRotationMatrix(new T.Matrix4().makeBasis(x,y,z));
      block(node,color,midpoint(a,b),width,height,len,q);
    }
    function ij(node,a,b,flange,h,c=paint){
      strip(node,a,b,.058,h,c);const v=b.clone().sub(a).normalize(),ax=up.clone().cross(v).normalize(),dy=v.clone().cross(ax).multiplyScalar(h*.48);
      strip(node,a.clone().add(dy),b.clone().add(dy),flange,.031,edge);
      strip(node,a.clone().sub(dy),b.clone().sub(dy),flange,.042,c);
    }
    const bolt=(node,p,normal,r=.030,c=bronze)=>rod(node,p.clone().addScaledVector(normal,-.008),p.clone().addScaledVector(normal,.020),2*r,c,hex);
    function treadpan(node,f,style){
      const w=f.w,d=f.d,h=style==='stair'?.076:.102;
      if(style==='stair'){
        // Deep pressed nosing conceals the lip over the preceding horizontal tread.
        at(node,f,0,-h/2,0,w,h,d,0xacb6ae,tread);
        at(node,f,0,-.016,-d*.5+.032,w,.032,.064,edge);
        at(node,f,0,-.0045,-d*.5+.072,w-.11,.012,.026,ochre,enamel);
        return;
      }
      const station=style==='dock',transverse=station?.26:0;
      const useful=d-transverse,rows=Math.max(1,Math.round(useful/1.11)),cols=Math.max(1,Math.round(w/1.32));
      const cw=w/cols,cd=useful/rows;
      for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){
        const u=-w/2+(i+.5)*cw,v=-d/2+(j+.5)*cd;
        at(node,f,u,-h/2,v,cw-.014,h,cd-.013,[0xa7b2a9,0x9ea9a1,0xa8b1a7][(i+j*2)%3],tread);
        for(const side of [-1,1])bolt(node,P(f,u+side*(cw*.5-.070),.003,v+side*(cd*.5-.055)),up,.021,0x6b766b);
      }
      if(station){
        const z=d/2-transverse*.5,nb=Math.ceil(w/.094);
        for(let i=0;i<nb;i++)at(node,f,-w*.5+(i+.5)*w/nb,-.023,z,.030,.046,transverse,0x8b9489);
        at(node,f,0,-.050,d*.5-.015,w,.09,.030,edge);
        at(node,f,0,-.046,d*.5-transverse,w,.088,.026,iron);
      }
      const halfW=w/2,halfD=d/2;
      for(const s of [-1,1]){
        ij(node,P(f,s*(halfW-.061),-.154,-halfD),P(f,s*(halfW-.061),-.154,halfD),.132,.204);
        ij(node,P(f,-halfW,-.157,s*(halfD-.065)),P(f,halfW,-.157,s*(halfD-.065)),.123,.197);
      }
      const lineCount=Math.max(2,Math.round(w/.33));
      for(let i=0;i<lineCount;i++){
        const u=(i+.5)*w/lineCount-halfW;
        bolt(node,P(f,u,-.155,halfD-.029),D(f),.026);
        if(i%2===0)bolt(node,P(f,u,-.162,-halfD+.028),D(f).multiplyScalar(-1),.024,0x827a60);
      }
      if(station){
        // Safety paint is contained in the plate with its upper face at the deck datum.
        at(node,f,0,-.0075,-halfD+.046,w-.035,.018,.070,ochre,enamel);
        for(const s of [-1,1])for(let i=0;i<3;i++)at(node,f,s*(halfW-.11-i*.12),-.0065,-halfD+.117,.058,.016,.051,black);
      }
    }
    function upright(node,p,h,railColor=paint){
      const down=p.clone().addScaledVector(up,-.115),top=p.clone().addScaledVector(up,h);
      rod(node,down,top,.057,railColor);rod(node,p.clone().addScaledVector(up,.011),p.clone().addScaledVector(up,.096),.115,iron);
      rod(node,p.clone().addScaledVector(up,h-.056),top,.079,edge);
    }
    function rail(node,a,b,h=.80,railColor=paint,allowPosts=true){
      const len=a.distanceTo(b);if(len<.36)return;
      const count=Math.max(1,Math.ceil(len/1.10));
      if(allowPosts)for(let i=0;i<=count;i++)upright(node,a.clone().lerp(b,i/count),h,railColor);
      for(const [dy,r,c] of [[h,.048,railColor],[h*.48,.027,0x728078]])
        rod(node,a.clone().addScaledVector(up,dy),b.clone().addScaledVector(up,dy),r,c);
    }
    const staticFloors=[layout.west,layout.middle,layout.east,leaf,...layout.stairs,...layout.landings];
    function distToFloor(p,d){
      const rel=p.clone().sub(V(d.x,d.y,d.z));
      return Math.hypot(Math.max(0,Math.abs(rel.dot(W(d)))-d.w*.5),Math.max(0,Math.abs(rel.dot(D(d)))-d.d*.5));
    }
    function cutRail(node,f,a,b,h=.82,c=paint){
      const n=Math.ceil(a.distanceTo(b)/.095),gap=.38;let run=-1;
      for(let j=0;j<=n;j++){
        const p=a.clone().lerp(b,Math.min(1,(j+.5)/n));
        const blocked=j===n||staticFloors.some(d=>d!==f&&Math.abs(p.y-d.y)<.64&&distToFloor(p,d)<gap);
        if(blocked&&run>=0){rail(node,a.clone().lerp(b,run/n),a.clone().lerp(b,j/n),h,c);run=-1;}
        if(!blocked&&run<0)run=j;
      }
    }
    const tower=V(14,0,-91);
    function onWall(p,y,penetration=.020){
      const radial=V(p.x-tower.x,0,p.z-tower.z).normalize();
      const radius=3.075-(y-4)*.24/3.52;
      return V(tower.x,y,tower.z).addScaledVector(radial,radius-penetration);
    }
    function wallPlate(p,w,h,index){
      const out=V(p.x-14,0,p.z+91).normalize(),tan=V(out.z,0,-out.x),face=orient(tan);
      block(root,iron,p,w,h,.115,face);
      block(root,paint,p.clone().addScaledVector(out,.066),w*.81,h*.89,.044,face);
      for(const s of [-1,1])for(const v of [-1,1])bolt(root,p.clone().addScaledVector(tan,s*(w/2-.063)).addScaledVector(up,v*(h/2-.072)).addScaledVector(out,.083),out,.047,index?0x858775:bronze);
    }
    const ringClear=layout.car.y-1.76,heelY=layout.car.y-4.57;
    function knee(point,y){
      const outward=V(point.x-tower.x,0,point.z-tower.z).normalize();
      return V(tower.x,y,tower.z).addScaledVector(outward,5.78);
    }
    function outrigger(head,wide){
      const high=onWall(head,ringClear),low=onWall(head,heelY);
      const bend=knee(head,ringClear),lower=knee(head,ringClear-.89);
      wallPlate(high,wide?.56:.48,.60,1);wallPlate(low,wide?.59:.49,.75);
      // Through the complete circular motion, both flanges stay below the car,
      // annulus and hand-wheel shafts. Only the outboard knee starts to rise.
      ij(root,high,bend,wide?.235:.21,.27,paint);
      ij(root,bend,head,wide?.226:.205,wide?.32:.27,paint);
      ij(root,low,lower,wide?.205:.162,.194,iron);
      ij(root,lower,head.clone().addScaledVector(up,-.12),wide?.19:.153,.18,iron);
      rod(root,bend,lower,.099,iron);
      const dir=V(bend.x-14,0,bend.z+91).normalize(),tangent=V(dir.z,0,-dir.x);
      block(root,paint,bend,.247,.32,.33,orient(tangent));
      for(const k of [-1,1])bolt(root,bend.clone().addScaledVector(tangent,k*.128),tangent.clone().multiplyScalar(k),.045);
      return {high,bend,low,lower};
    }
    function bracket(f,span){
      const pair=[];
      for(const s of [-1,1]){
        const crown=P(f,s*span,-.29,f.d*.5-.19);
        pair.push(outrigger(crown,false));
        const shoe=crown.clone().addScaledVector(up,-.062);
        block(root,edge,shoe,.29,.13,.36,orient(W(f)));
        const sideOut=W(f).multiplyScalar(s);
        for(const h of [-.41,-.29,-.15])bolt(root,P(f,s*(span+.117),h,f.d*.5-.20),sideOut,.033);
      }
      // In-plane wind bracing is entirely on the low, stationary frame.
      rod(root,pair[0].high,pair[1].bend.clone().addScaledVector(up,-.066),.05,black);
      rod(root,pair[1].high,pair[0].bend.clone().addScaledVector(up,-.095),.05,black);
    }
    function badge(f,i){
      const u=f.w*.5-.34,v=f.d*.5+.025,y=.80,col=[oxide,0x698176,0xb5b9a9][i];
      // Small double-sided, cast station numeral. The lamp sits on the outside cap.
      at(root,f,u,.281,v,.113,.70,.10,paint);at(root,f,u,.84,v,.47,.42,.068,col);
      for(const s of [-1,1]){
        const depth=v+s*.039;
        at(root,f,u,.84,depth,.434,.385,.014,0x4d5a53,enamel);
        at(root,f,u,.955,depth+s*.011,.082+i*.095,.022,.014,white,enamel);
        at(root,f,u,.724,depth+s*.011,.082+i*.095,.022,.014,white,enamel);
        for(let j=0;j<=i;j++)at(root,f,u+(j-i*.5)*.085,.840,depth+s*.011,.041,.232,.013,white,enamel);
        for(const k of [-1,1])bolt(root,P(f,u+k*.190,.981,depth),D(f).multiplyScalar(s),.012,bronze);
      }
      const p=P(f,u,0,v);
      rod(root,p.clone().addScaledVector(up,1.040),p.clone().addScaledVector(up,1.105),.146,black);
      rod(root,p.clone().addScaledVector(up,1.11),p.clone().addScaledVector(up,1.223),.084,[0xf0bd78,0xe4c995,0xddd9ac][i],tube,glow);
      rod(root,p.clone().addScaledVector(up,1.219),p.clone().addScaledVector(up,1.245),.145,paint);
      for(let j=0;j<4;j++){
        const q=P(f,u+.056*Math.cos(j*Math.PI*.5),1.105,v+.056*Math.sin(j*Math.PI*.5));
        rod(root,q,q.clone().addScaledVector(up,.12),.012,bronze);
      }
    }
    for(const [i,f] of [layout.west,layout.middle,layout.east].entries()){
      treadpan(root,f,'dock');bracket(f,f.w*.35);badge(f,i);
      const w=f.w/2,d=f.d/2,cap=[paint,0x70877b,0xb5b7a8][i];
      cutRail(root,f,P(f,-w-.015,.017,d+.018),P(f,w+.015,.017,d+.018),.79,cap);
      for(const s of [-1,1]){
        cutRail(root,f,P(f,s*(w+.018),.017,-d+.17),P(f,s*(w+.018),.017,d+.018),.79,cap);
        // A pair of painted fender shoes below the clear inward jumping edge.
        at(root,f,s*(w-.29),-.248,-d-.044,.19,.27,.112,black);
        at(root,f,s*(w-.29),-.217,-d-.09,.122,.21,.083,0x39403a);
      }
    }
    // Split splices in the two flat-iron masonry hoops can be read from the car.
    for(const y of [heelY,ringClear]){
      const rings=48;
      for(let j=0;j<rings;j++){
        const at=a=>onWall(V(14+Math.sin(a),0,-91+Math.cos(a)),y,-.019);
        const a=j*Math.PI*2/rings,b=(j+1)*Math.PI*2/rings;
        strip(root,at(a),at(b),.040,.125,0x5e6c61);
        if(j%8===0){const p=at(a),dir=V(Math.sin(a),0,Math.cos(a));
          block(root,edge,p.clone().addScaledVector(dir,.026),.24,.164,.043,orient(V(dir.z,0,-dir.x)));
          for(const s of [-1,1])bolt(root,p.clone().addScaledVector(V(dir.z,0,-dir.x),s*.086).addScaledVector(dir,.047),dir,.028);
        }
      }
    }
    // The leaf pivots at its eastern shoe, with the pin below the flush walking surface.
    treadpan(mobile,leaf,'bridge');
    for(const s of [-1,1]){
      const x=s*(leaf.w*.5+.027);
      rail(mobile,P(leaf,x,.005,-leaf.d*.5+.20),P(leaf,x,.005,leaf.d*.5-.23),.69,edge);
      const pin=P(leaf,x,-.123,leaf.d/2);
      rod(root,pin.clone().addScaledVector(W(leaf),-.15),pin.clone().addScaledVector(W(leaf),.15),.222,bronze);
      at(root,leaf,x,-.173,leaf.d/2+.066,.18,.30,.36,iron);
      const nose=P(leaf,x,-.192,-leaf.d/2);
      block(root,edge,nose,.155,.12,.292,orient(W(leaf)));
      for(const k of [-1,1])bolt(root,pin.clone().addScaledVector(W(leaf),s*.15).addScaledVector(up,.045*k),W(leaf).multiplyScalar(s),.029);
    }
    // Twin cast ballast boxes swing under the east deck as the leaf rises.
    // The riveted underside is exposed to the middle station while the leaf stands up.
    for(const s of [-1,1]){
      const u=s*(leaf.w*.5-.162),end=leaf.d*.5;
      ij(mobile,P(leaf,u,-.18,end-.59),P(leaf,u,-.26,end+.76),.124,.124,iron);
      at(mobile,leaf,u,-.353,end+.56,.221,.34,.46,0x778374);
      for(const offset of [-.148,.148])at(mobile,leaf,u,-.350,end+.56+offset,.233,.355,.037,black);
    }
    const sections=Math.max(2,Math.round(leaf.d/1.15));
    for(let i=0;i<=sections;i++){
      const v=-leaf.d*.5+.10+(leaf.d-.20)*i/sections;
      strip(mobile,P(leaf,-leaf.w*.45,-.218,v),P(leaf,leaf.w*.45,-.218,v),.068,.096,edge);
      if(i<sections){
        const next=v+(leaf.d-.20)/sections,sign=i%2===0?1:-1;
        rod(mobile,P(leaf,sign*leaf.w*.435,-.238,v),P(leaf,-sign*leaf.w*.435,-.238,next),.046,paint);
      }
    }
    // Straight flights share continuous inclined rails and stringers. The bend
    // is kept open at its entrance and exit; there is no rail through a tread.
    const flights=[];
    for(const f of layout.stairs){
      const last=flights[flights.length-1];
      if(!last||D(last[0]).dot(D(f))<.95)flights.push([f]);else last.push(f);
      treadpan(root,f,'stair');
    }
    for(const flight of flights){
      const first=flight[0],last=flight[flight.length-1];
      for(const s of [-1,1]){
        const w=s*(first.w*.5+.02),a=P(first,w,-first.riser*.5,-first.d/2),b=P(last,w,last.riser*.5,last.d/2);
        ij(root,a.clone().addScaledVector(up,-.208),b.clone().addScaledVector(up,-.208),.125,.19);
        let handStart=a;
        if(flight===flights[0]){
          // The lower steps overlap the east deck. Leave that full approach
          // open so a player crossing the bridge can turn straight up the stair.
          for(let j=0;j<=80;j++){
            handStart=a.clone().lerp(b,j/80);
            if(distToFloor(handStart,layout.east)>.41)break;
          }
        }
        rail(root,handStart,b,.79,edge,false);
        const count=Math.ceil((flight.length-1)/3);
        for(let i=0;i<=count;i++){
          const t=Math.min(1,Math.max(0,i/count));
          const p=handStart.clone().lerp(b,Math.min(.976,Math.max(.024,t)));
          upright(root,p,.79);
        }
        for(let i=1;i<flight.length;i+=2){
          const f=flight[i],p=P(f,s*(f.w/2+.078),-.15,0);
          bolt(root,p,W(f).multiplyScalar(s),.032);
        }
      }
    }
    for(const f of layout.landings){
      treadpan(root,f,'landing');
      const w=f.w*.5,d=f.d*.5;
      if(f!==layout.threshold){
        for(const s of [-1,1]){
          cutRail(root,f,P(f,s*(w+.015),.004,-d),P(f,s*(w+.015),.004,d));
          cutRail(root,f,P(f,-w,.004,s*(d+.015)),P(f,w,.004,s*(d+.015)));
        }
      }else{
        for(const s of [-1,1])cutRail(root,f,P(f,s*(w+.015),.004,-d+.24),P(f,s*(w+.015),.004,d));
      }
    }
    const turn=layout.landings[0],upper=layout.upper;
    if(turn){
      // The stair return is a genuine long outrigger. Extend its backstay to
      // the stone, below the rotating ring, and triangulate the landing itself.
      const at=P(turn,0,-.30,0),frame=outrigger(at,true);
      for(const side of [-1,1])rod(root,frame.lower,P(turn,side*turn.w*.38,-.37,side*.44),.085,iron);
    }
    if(upper){
      const at=P(upper,0,-.36,.29),frame=outrigger(at,true);
      for(const side of [-1,1])rod(root,frame.lower,P(upper,side*upper.w*.34,-.35,.38),.075,iron);
    }
    for(const {node,geo,mat,entries} of batches.values()){
      const mesh=new T.InstancedMesh(geo,mat,entries.length),c=new T.Color();
      entries.forEach(([matrix,col],i)=>{mesh.setMatrixAt(i,matrix);mesh.setColorAt(i,c.setHex(col));});
      mesh.castShadow=mat!==glow;mesh.receiveShadow=mat!==glow;mesh.computeBoundingSphere();node.add(mesh);own(mesh);
    }
    batches.clear();
    const hinge=W(leaf),raise=hinge.clone().cross(D(leaf).multiplyScalar(-1)).y>=0?1:-1;
    function update(game){
      const opening=T.MathUtils.clamp(game?.gallery?.opening??1,0,1);
      mobile.quaternion.setFromAxisAngle(hinge,raise*(1-opening)*1.42);
    }
    update(g);
    return {update,dispose(){root.removeFromParent();for(const item of owned)item.dispose();owned.clear();root.clear();}};
  }
  return {create};
})();
