// A wire-bound field register. The three cards curl over a common top edge;
// the next leaf is already underneath, so moving the index backwards is continuous.
const TideRegisterDesk=(()=>{
  const T=THREE,W=.59,H=.385;
  function card(entry,index){
    const canvas=document.createElement('canvas');canvas.width=1200;canvas.height=780;
    const c=canvas.getContext('2d');let seed=1907+index;
    const rand=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
    const paper=c.createLinearGradient(0,0,1100,780);
    paper.addColorStop(0,'#c1b89c');paper.addColorStop(.16,'#e1d8b6');paper.addColorStop(.8,'#d7cfaf');paper.addColorStop(1,'#b7af92');
    c.fillStyle=paper;c.fillRect(0,0,1200,780);
    for(let k=0;k<26000;k++){
      const x=rand()*1200,y=rand()*780;
      c.fillStyle=k%4?'rgba(86,77,57,.073)':'rgba(255,250,216,.35)';c.fillRect(x,y,.55+rand()*4,.6+rand()*1.6);
    }
    c.strokeStyle='#5b6756';c.lineWidth=3;c.strokeRect(35,38,1130,699);
    c.strokeRect(42,45,1116,685);c.fillStyle='#354c42';c.fillRect(48,57,1104,117);
    c.fillStyle='#eee6c3';c.font='bold 52px serif';c.fillText('北岬站　灯标登记簿',78,116);
    c.font='20px monospace';c.fillText('NORTH CAPE   /   STATION LIGHT REGISTER',80,152);
    c.textAlign='right';c.fillText('水工值班副本',1125,147);c.textAlign='left';
    const line=(points,color='#43594c',weight=3)=>{
      c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.strokeStyle=color;c.lineWidth=weight;c.stroke();
    };
    const box=(x,y,w,h)=>{c.strokeStyle='#667560';c.lineWidth=2;c.strokeRect(x,y,w,h);};
    box(64,195,470,458);
    c.save();c.beginPath();c.rect(66,197,466,454);c.clip();
    for(let x=70;x<535;x+=24)line([[x,195],[x,655]],'rgba(93,117,95,.15)',1);
    for(let y=200;y<650;y+=24)line([[64,y],[534,y]],'rgba(93,117,95,.15)',1);
    // Side elevations share the datum at the painted waterline.
    const x=303;
    line([[155,516],[171,565],[203,590],[403,590],[435,561],[451,516],[155,516]],'#394f45',5);
    for(const y of [525,535,556,568])line([[170,y],[436,y]],'#657261',2);
    line([[116,569],[489,569]],'#7b8e7e',2);
    line([[186,510],[421,510],[437,516],[165,516],[186,510]],'#3c5045',4);
    const deckY=337;
    if(index===1){
      for(const sign of [-1,1]){
        line([[x+sign*98,509],[x+sign*37,deckY]],'#384e44',7);
        line([[x+sign*85,509],[x+sign*30,deckY]],'#75816d',2);
      }
      line([[231,440],[350,368],[256,368],[373,440],[231,440]],'#4f6556',4);
      for(let n=0;n<9;n++){const y=377+n*13;line([[347+(y-377)*.23,y],[365+(y-377)*.23,y]],'#3d5549',3);}
      line([[357,365],[391,507]],'#425e4f',3);
    }else if(!index){
      for(const u of [253,336]){line([[u,505],[u,338],[u+10,338],[u+10,505]],'#4b6252',4);}
      for(let y=363;y<508;y+=20)line([[267,y],[329,y]],'#5d705d',4);
    }else{
      line([[286,510],[294,337],[312,337],[321,510]],'#476250',5);
      for(let y=355;y<506;y+=22)line([[279,y+8],[328,y-5]],'#4c6654',5);
    }
    line([[251,337],[354,337],[348,328],[257,328],[251,337]],'#394f43',4);
    line([[271,328],[271,267],[331,267],[331,328]],'#3e5649',4);
    for(let y=279;y<327;y+=6)line([[277,y],[326,y]],'#556b59',2);
    line([[254,268],[273,257],[301,235],[332,256],[347,268],[254,268]],'#3b5346',4);
    c.restore();c.fillStyle='#485f50';c.font='22px monospace';c.fillText('立面   /   NO. '+entry.id,82,631);
    c.fillStyle='#354b41';c.font='bold 132px monospace';c.fillText(entry.id,577,347);
    c.font='bold 46px serif';c.fillText(entry.name,805,329);
    line([[567,379],[1125,379]],'#5e705d',3);
    for(const [row,[head,body]] of [['塔架',entry.frame],['识别',entry.mark],['光色','绿　常明']].entries()){
      const y=437+row*75;c.fillStyle='#687864';c.font='28px serif';c.fillText(head,574,y);
      c.fillStyle='#354a40';c.font='bold 35px serif';c.fillText(body,705,y);
      line([[565,y+20],[1123,y+20]],'rgba(75,92,70,.45)',1.5);
    }
    c.fillStyle='#62705f';c.font='22px serif';c.fillText('本簿登记实物形制。水深另见测潮簿。',66,703);
    c.save();c.translate(1031,684);c.rotate(-.065);c.strokeStyle='#995e48';c.lineWidth=3;c.strokeRect(-85,-21,170,45);
    c.fillStyle='#925b43';c.font='bold 24px serif';c.fillText('留 站 核 验',-68,11);c.restore();
    for(const x of [300,900]){
      c.beginPath();c.ellipse(x,26,10,7,-.14,0,Math.PI*2);c.fillStyle='#796e53';c.fill();
      c.beginPath();c.ellipse(x,23,6.5,5.1,0,0,Math.PI*2);c.fillStyle='#403e32';c.fill();
    }
    const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;texture.anisotropy=8;
    return texture;
  }
  function create(root,own){
    const desk=new T.Group();desk.position.set(-2.36,1.64,6.66);root.add(desk);
    const board=new T.Group();board.rotation.x=-.78;desk.add(board);
    const mat=(color,roughness,metalness,extra)=>own(new T.MeshStandardMaterial({color,roughness,metalness,...extra}));
    const frame=mat(0x344e48,.55,.52),brass=mat(0xac9463,.37,.67),edge=mat(0xab9e7b,.88,.02);
    const cube=own(new T.BoxGeometry(1,1,1));
    function bar(parent,x,y,z,sx,sy,sz,material){
      const mesh=new T.Mesh(cube,material);mesh.position.set(x,y,z);mesh.scale.set(sx,sy,sz);
      mesh.castShadow=mesh.receiveShadow=true;parent.add(mesh);return mesh;
    }
    for(const x of [-.245,.245]){
      bar(desk,x,-.516,-.095,.031,.92,.042,frame);bar(desk,x,-.964,-.085,.095,.026,.16,brass);
    }
    bar(desk,0,-.33,-.095,.53,.025,.022,frame);
    bar(board,0,0,-.031,W+.064,H+.07,.041,frame);
    bar(board,0,-.004,-.006,W+.013,H+.012,.014,edge);
    bar(board,0,H*.5-.002,.011,W+.022,.014,.024,brass);
    const ringGeo=own(new T.TorusGeometry(.018,.0038,8,40));
    for(const x of [-W*.25,W*.25]){
      const ring=new T.Mesh(ringGeo,brass);ring.rotation.y=Math.PI*.5;ring.position.set(x,H*.5-.012,.015);board.add(ring);
    }
    const back=mat(0xbfb494,.88,.02,{side:T.BackSide});
    const leaves=TideLightRegister.entries.map((entry,index)=>{
      const map=own(card(entry,index)),paper=mat(0xffffff,.84,.0,{map,polygonOffset:true,polygonOffsetFactor:-1});
      const geo=own(new T.PlaneGeometry(W,H,9,26)),front=new T.Mesh(geo,paper),rear=new T.Mesh(geo,back);
      front.receiveShadow=true;front.frustumCulled=rear.frustumCulled=false;
      board.add(front,rear);return {index,geo,front,rear,base:geo.attributes.position.array.slice(),last:-1};
    });
    const pencil=new T.Group();board.add(pencil);
    const graphite=mat(0x302f2c,.78,.06),cedar=mat(0xc49263,.81,.0),lacquer=mat(0xcba344,.45,.02);
    function pencilPart(bottom,top,length,height,material){
      const part=new T.Mesh(own(new T.CylinderGeometry(top,bottom,length,6)),material);
      part.position.y=height;part.castShadow=true;pencil.add(part);
    }
    pencilPart(0,.0018,.005,.0025,graphite);pencilPart(.0018,.0044,.012,.011,cedar);
    pencilPart(.0044,.0044,.116,.075, lacquer);pencilPart(.0045,.0045,.008,.137,brass);
    const nib=new T.Vector3(),axis=new T.Vector3(),vertical=new T.Vector3(0,1,0);
    const tick=[new T.Vector3(.111,-.131,.010),new T.Vector3(.119,-.14,.010),new T.Vector3(.143,-.118,.010)];
    const strokes=tick.slice(1).map(()=>bar(board,0,0,0,.0016,1,.0006,graphite));
    const hands=[new T.Vector3(),new T.Vector3()];
    let turn=0;
    function update(g){
      const reg=g.signal.register;
      turn=reg.leaf;
      for(const leaf of leaves){
        const f=T.MathUtils.clamp(turn-leaf.index,0,1);
        // Only the turning leaf and the top of each stack are exposed.
        leaf.front.visible=leaf.rear.visible=f<.999&&leaf.index<=Math.ceil(turn)+1;
        if(Math.abs(f-leaf.last)<.0002)continue;
        leaf.last=f;const pos=leaf.geo.attributes.position;
        for(let j=0;j<pos.count;j++){
          const x=leaf.base[j*3],v=H*.5-leaf.base[j*3+1],bend=Math.sin(Math.PI*f);
          const a=2*Math.PI*f+bend*(v/H*.32+x/W*.23);
          pos.setXYZ(j,x,H*.5-v*Math.cos(a),.006+(2-leaf.index)*.0009+v*Math.sin(a)+.004*bend);
        }
        pos.needsUpdate=true;leaf.geo.computeVertexNormals();
      }
      const elapsed=reg.signedAt===null?-1:g.time-reg.signedAt;
      const portions=[T.MathUtils.clamp((elapsed-.023)/.084,0,1),T.MathUtils.clamp((elapsed-.107)/.152,0,1)];
      for(let n=0;n<2;n++){
        const stroke=strokes[n],from=tick[n],to=tick[n+1],f=portions[n];
        stroke.visible=reg.page===1&&Math.abs(turn-1)<.075&&f>0;
        if(!stroke.visible)continue;
        axis.subVectors(to,from);stroke.scale.y=axis.length()*f;
        stroke.position.copy(from).addScaledVector(axis,f*.5);stroke.quaternion.setFromUnitVectors(vertical,axis.normalize());
      }
      const handling=Math.sin(Math.PI*(turn-Math.floor(turn)));
      const working=g.stage===1&&g.engaged[0]&&!g.watch.done;
      if(working){
        nib.set(.16,-.123+handling*.085,.043+handling*.065);
        if(elapsed>=0&&elapsed<.54){
          nib.copy(tick[0]).lerp(tick[1],portions[0]).lerp(tick[2],portions[1]);
          nib.z+=.045*T.MathUtils.clamp((elapsed-.26)/.28,0,1);
        }
        axis.set(.72,-.40,.69).normalize();
      }else{
        nib.set(.075,-H*.5-.014,.009);axis.set(1,0,0);
      }
      pencil.position.copy(nib);pencil.quaternion.setFromUnitVectors(vertical,axis);
    }
    function grips(){
      board.updateWorldMatrix(true,false);
      hands[0].set(-.24,-.12,.016).applyMatrix4(board.matrixWorld);
      hands[1].copy(nib).addScaledVector(axis,.047).applyMatrix4(board.matrixWorld);return hands;
    }
    return {update,grips};
  }
  return {create};
})();
