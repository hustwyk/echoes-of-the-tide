// Spring filing board on the lantern apron. All card movement is in coordinates of the inclined wooden leaf.
const TideGallerySlip=(()=>{
  const T=THREE,TAU=Math.PI*2,V=(x=0,y=0,z=0)=>new T.Vector3(x,y,z),up=V(0,1,0),clamp=(n,l,h)=>Math.max(l,Math.min(h,n));
  function create(scene,g){
    const assets=new Set(),own=o=>(assets.add(o),o),shapes=new Set(),shape=o=>(shapes.add(o),o);
    function group(parent,x,y,z,name){const o=new T.Group();o.position.set(x,y,z);o.name=name||'';parent.add(o);return o}
    const datum=TideLantern.coords(-1.42,0,4.95),root=group(scene,datum.x,datum.y,datum.z,'灯室 · 潮尺原数联图案台');
    root.rotation.y=TideLantern.yaw;
    const board=group(root,0,.995,0,'倾斜木案');board.rotation.x=-.142;
    const jaw=group(board,0,.042,.149,'青铜图夹'),lever=group(board,-.555,.056,-.067,'图夹扳柄');
    const shuttle=group(board,.46,.015,-.197,'原数联双耳滑片');
    let seed=32415;const random=()=>((seed=(1664525*seed+1013904223)>>>0)/4294967296);
    function canvas(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return c}
    function tex(c,colour=true,repeat=false){const t=own(new T.CanvasTexture(c));if(colour)t.colorSpace=T.SRGBColorSpace;if(repeat)t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=6;return t}
    const woodC=canvas(1024,256),wc=woodC.getContext('2d'),grain=wc.createImageData(1024,256);
    for(let y=0;y<256;y++)for(let x=0;x<1024;x++){const wave=y+6*Math.sin(x*.010+y*.017)+3*Math.sin(x*.026+y*.04);
      const ring=Math.sin(wave*.58)*3+(1-Math.abs(Math.sin(wave*.16)))**8*19;
      const n=(random()-.5)*11+3*Math.cos(x*.004+wave*.32);grain.data.set([151+n-ring,123+n-ring*.88,84+n-ring*.72,255],(y*1024+x)*4)}wc.putImageData(grain,0,0);
    for(let j=0;j<1400;j++){const x=1024*random(),y=256*random();wc.strokeStyle=j%4?'rgba(50,39,27,.18)':'rgba(226,207,165,.22)';wc.lineWidth=.4+random()*1.4;wc.beginPath();wc.moveTo(x,y);wc.quadraticCurveTo(x+5,y-.2,x+8+random()*32,y+random());wc.stroke();}
    const wood=own(new T.MeshStandardMaterial({map:tex(woodC,true,true),vertexColors:true,roughness:.65,metalness:.08}));
    const iron=own(new T.MeshStandardMaterial({color:0xffffff,vertexColors:true,roughness:.65,metalness:.45})),metal=own(new T.MeshStandardMaterial({color:0xffffff,vertexColors:true,roughness:.36,metalness:.69})),
      rubber=own(new T.MeshStandardMaterial({vertexColors:true,roughness:.84,metalness:.06}));
    const cream='#e6d6a9',brass='#ae8b51',bright='#c5a96d',ironCol='#515f57',patina='#688477',red='#9b5140',raw='#9ca294';
    function paperCanvas(w,h,base,card=false){
      const c=canvas(w,h),gc=c.getContext('2d'),im=gc.createImageData(w,h);
      for(let y=0;y<h;y++)for(let x=0;x<w;x++){const speck=(random()-.48)*12,edge=Math.min(x,w-x,y,h-y);
        const crease=(card?0:Math.exp(-Math.abs(x-w*.63)*.20)*5+Math.exp(-Math.abs(y-h*.51)*.32)*4);
        const shade=3.3*Math.sin(x*.014+Math.cos(y*.017)*2.0)+2.0*Math.cos(x*.042-y*.023)+speck-Math.exp(-edge*.039)*14-crease;
        im.data.set([base[0]+shade,base[1]+shade,base[2]+shade,255],(y*w+x)*4)}gc.putImageData(im,0,0);
      for(let j=0;j<w*h/143;j++){const x=random()*w,y=random()*h;gc.strokeStyle=j%5?'rgba(119,105,72,.11)':'rgba(255,252,224,.19)';gc.lineWidth=random()*.78+.25;gc.beginPath();gc.moveTo(x,y);gc.lineTo(x+random()*3.5,y+random()*1.5);gc.stroke();}
      return c;
    }
    const paperBase=paperCanvas(1600,636,[218,214,183]),sheetC=canvas(1600,636),sheet=sheetC.getContext('2d');
    const cardBase=paperCanvas(728,424,[224,205,164],true),cardC=canvas(728,424),card=cardC.getContext('2d');
    const sheetT=tex(sheetC),cardT=tex(cardC);
    // Warm low-level spill preserves the high-albedo chart in the deep shade under the eave.
    const paperMat=t=>own(new T.MeshStandardMaterial({map:t,emissive:0x26251c,emissiveMap:t,emissiveIntensity:.35,vertexColors:true,roughness:.90,metalness:.035}));
    const chartMat=paperMat(sheetT),slipMat=paperMat(cardT);
    const ink='#384b4c',wax='#734b3d',graphite='#38454a';
    function line(c,pts,color,width=1,dash=[]){c.strokeStyle=color;c.lineWidth=width;c.setLineDash(dash);c.beginPath();for(let i=0;i<pts.length;i++)i?c.lineTo(...pts[i]):c.moveTo(...pts[i]);c.stroke();c.setLineDash([])}
    function txt(c,s,x,y,size,col=ink,align='left',font='sans-serif',weight=560){c.fillStyle=col;c.font=weight+' '+size+'px '+font;c.textAlign=align;c.textBaseline='middle';c.fillText(s,x,y)}
    function pencil(c,s,x,y,size,col,angle=0){
      c.save();c.translate(x,y);c.rotate(angle);c.font='italic 600 '+size+'px "Kaiti SC","STKaiti",serif';c.textAlign='left';c.textBaseline='middle';c.fillStyle=col;
      let advance=0;for(const [i,ch] of [...s].entries()){const dy=Math.sin(i*4.71+size)*1.15;c.save();c.translate(advance,dy);c.rotate(.014*Math.sin(i*3.1));c.fillText(ch,0,0);c.restore();advance+=c.measureText(ch).width+.6;}
      c.restore();
    }
    const boardW=1.72,boardD=.662;
    const px=x=>(.5-x/boardW)*1600,py=z=>(.5-z/boardD)*636;
    const fnum=n=>(n<0?'−':'+')+Math.abs(n).toFixed(2);
    let signature=null;
    function print(readings){
      const key=readings?readings.join('|'):'aisle-record';if(key===signature)return;signature=key;
      sheet.drawImage(paperBase,0,0);
      sheet.save();sheet.strokeStyle='#74877a';sheet.lineWidth=2;sheet.strokeRect(14,13,1572,608);sheet.strokeStyle='#92a094';sheet.lineWidth=1;sheet.strokeRect(20,19,1560,596);
      // Two press pockets lie over the ruled inboard half. The adjacent working chart carries the original spot soundings.
      for(const [track,center,bed] of [['浅槽',.665,-3.78],['侧槽',.255,-5.36]]){
        const x=px(center);const W=350;sheet.fillStyle='rgba(100,119,103,.07)';sheet.fillRect(x-W/2,32,W,558);sheet.strokeStyle='#7c8b7d';sheet.lineWidth=1.6;sheet.strokeRect(x-W/2,32,W,558);
        txt(sheet,track,x,59,39,ink,'center','serif',640);txt(sheet,'槽底   '+fnum(bed)+' m',x,110,32,ink,'center','serif',610);
        if(readings)txt(sheet,'净深   '+(Math.min(...readings)-bed).toFixed(2)+' m',x,147,26,wax,'center','serif',620);
        else txt(sheet,'基准面下',x,146,21,'#647568','center');
        for(let k=0;k<10;k++){const y=190+37*k;line(sheet,[[x-W/2+9,y],[x-W/2+(k%3?18:30),y]],'#899689',1.3);}
        line(sheet,[[x-W/2+28,553],[x+W/2-28,553]],'#849588',1.3,[6,4]);
      }
      const left=824,right=1540,top=125,bottom=475;sheet.save();sheet.beginPath();sheet.rect(left,top,right-left,bottom-top);sheet.clip();
      sheet.fillStyle='rgba(106,140,135,.08)';sheet.fillRect(left,top,right-left,bottom-top);
      for(let i=0;i<8;i++)line(sheet,[[left+i*100,top],[left+i*100,bottom]],'#acb4a2',.86);
      for(let i=0;i<5;i++)line(sheet,[[left,top+i*80],[right,top+i*80]],'#acb4a2',.86);
      function curve(c,index,color){const pts=[];for(let i=0;i<=140;i++){const t=i/140,rx=left+t*(right-left);
        const y=top+27+index*23+31*Math.sin(t*6.0+index*.07)+32*Math.cos(t*2.7-index*.029)+12*Math.sin(t*12.1+index*.12);
        pts.push([rx,y]);}line(c,pts,color,index%5===0?1.85:.88);}
      for(let n=-4;n<22;n++)curve(sheet,n,n%5===0?'#67847e':'#9aa89b');
      sheet.strokeStyle='#927354';sheet.lineWidth=2;sheet.fillStyle='rgba(170,144,105,.17)';sheet.beginPath();sheet.moveTo(860,360);sheet.bezierCurveTo(930,270,1040,260,1130,300);sheet.bezierCurveTo(1067,348,967,399,885,411);sheet.closePath();sheet.fill();sheet.stroke();
      for(let j=0;j<49;j++){const a=j*.89,r=Math.sqrt(j/49);const sx=989+112*r*Math.cos(a),sy=335+40*r*Math.sin(a);line(sheet,[[sx,sy],[sx+3,sy-2]],'#988767',1.3);}
      line(sheet,[[847,402],[962,372],[1049,327],[1190,245],[1329,192],[1508,167]],'#876343',3,[11,7]);
      line(sheet,[[848,430],[1012,419],[1206,371],[1344,280],[1513,203]],'#4d766d',4,[14,5]);
      for(const r of [6,11]){sheet.beginPath();sheet.strokeStyle='#425b55';sheet.lineWidth=2;sheet.arc(1327,290,r,0,TAU);sheet.stroke();}
      txt(sheet,'双环断桩',1353,294,21,'#4c5b50');pencil(sheet,'浅槽',968,290,24,'#7b5d48',-.16);pencil(sheet,'侧槽',1176,396,23,'#496454',-.09);sheet.restore();
      txt(sheet,'北岬外槽',830,55,44,ink,'left','serif',660);txt(sheet,'潮尺原数对照图',1076,63,29,'#54655d');
      if(readings){const low=Math.min(...readings);
        txt(sheet,'浅槽净深  '+(low+3.78).toFixed(2)+' m',832,100,28,'#84573e','left','serif',620);
        txt(sheet,'侧槽净深  '+(low+5.36).toFixed(2)+' m',1183,100,28,'#416553','left','serif',620);
      }
      txt(sheet,'海雁所需净深',844,529,24,'#4e645a');txt(sheet,'1.84 m',1035,526,36,wax,'left','serif',660);
      txt(sheet,'以较低浪谷水面计',1213,528,22,'#59695e');line(sheet,[[842,559],[1539,559]],'#8f9c87',1.2);
      txt(sheet,'槽底高程与水面读数共用潮尺基准',845,583,21,'#627268');
      sheet.restore();sheetT.needsUpdate=true;
      card.drawImage(cardBase,0,0);card.strokeStyle='#768277';card.lineWidth=2;card.strokeRect(17,16,694,391);
      line(card,[[38,96],[694,96]],'#586c63',2);txt(card,'北岬测潮',41,55,42,ink,'left','serif',640);txt(card,'原数联',674,58,34,'#57675d','right');
      if(readings){for(let i=0;i<2;i++){const y=162+i*110;txt(card,i?'乙尺':'甲尺',44,y,40,graphite);line(card,[[160,y+30],[677,y+30]],'#8b9886',1.5);
          pencil(card,fnum(readings[i])+' m',224,y-2,59,wax,i?.012:-.021);}}
      else{pencil(card,'旧档｜侧槽已核',73,202,53,wax,-.035);line(card,[[67,275],[664,275]],'#98a087',1.5);}
      line(card,[[43,332],[684,332]],'#83917e',1.2);txt(card,'浪谷同读',52,367,26,'#687466');cardT.needsUpdate=true;
    }
    const mat4=new T.Object3D(),normalM=new T.Matrix3(),col=new T.Color(),P=V(),N=V(),direction=V(),q=new T.Quaternion(),batches=new Map();
    const cube=shape(new T.BoxGeometry(1,1,1)),circle=new Map();
    function cylinder(k){if(!circle.has(k))circle.set(k,shape(new T.CylinderGeometry(1,1,1,k)));return circle.get(k)}
    function add(o,g,m,c,pos=[0,0,0],scale=[1,1,1],rot=null,art=false){
      if(!batches.has(o))batches.set(o,new Map());const set=batches.get(o);if(!set.has(m))set.set(m,{p:[],n:[],c:[],uv:[],ix:[]});
      const b=set.get(m),a=g.attributes,base=b.p.length/3;mat4.position.fromArray(pos);mat4.scale.fromArray(scale);if(rot?.isQuaternion)mat4.quaternion.copy(rot);else mat4.rotation.set(...(rot||[0,0,0]));mat4.updateMatrix();normalM.getNormalMatrix(mat4.matrix);col.set(c);
      for(let j=0;j<a.position.count;j++){P.fromBufferAttribute(a.position,j).applyMatrix4(mat4.matrix);N.fromBufferAttribute(a.normal,j).applyNormalMatrix(normalM);b.p.push(P.x,P.y,P.z);b.n.push(N.x,N.y,N.z);b.c.push(col.r,col.g,col.b);
        if(art)b.uv.push(a.uv.getX(j),a.uv.getY(j));else if(Math.abs(N.y)>.65)b.uv.push(P.x*.82,P.z*1.8);else if(Math.abs(N.z)>.70)b.uv.push(P.x*.82,P.y*1.8);else b.uv.push(P.z*.82,P.y*1.8);}
      const ix=g.index;for(let j=0,l=ix?.count||a.position.count;j<l;j++)b.ix.push(base+(ix?ix.getX(j):j));}
    const box=(o,x,y,z,w,h,d,c,m=iron,r=null)=>add(o,cube,m,c,[x,y,z],[w,h,d],r);
    const disc=(o,x,y,z,r,h,c,m=metal,axis='y',k=16)=>add(o,cylinder(k),m,c,[x,y,z],[r,h,r],axis==='x'?[0,0,Math.PI/2]:axis==='z'?[Math.PI/2,0,0]:null);
    function rod(o,a,b,r,c,m=metal,k=10){const A=V(...a),B=V(...b);direction.subVectors(B,A);const len=direction.length();q.setFromUnitVectors(up,direction.multiplyScalar(1/len));add(o,cylinder(k),m,c,A.lerp(B,.5).toArray(),[r,len,r],q);}
    function screw(o,x,y,z,r=.009){disc(o,x,y,z,r,.003,raw,metal,'y',18);box(o,x,y+.00165,z,r*1.25,.0005,.0016,'#4c5147',iron,[0,(x+z)*2,0])}
    function page(o,w,d,y,m,curl=false){
      const ge=shape(new T.BufferGeometry()),pos=[],uv=[],idx=[];const cols=curl?22:14,rows=curl?12:10;
      for(let j=0;j<=rows;j++)for(let i=0;i<=cols;i++){const u=i/cols,v=j/rows;const corner=curl?.005*Math.pow(Math.max(0,(u-.70)/.3),2)*Math.pow(Math.max(0,(.32-v)/.32),2):.0016*Math.sin(u*5)*Math.sin(v*3);
        pos.push((.5-u)*w,y+corner+(curl?.00065*Math.sin(u*8)*Math.sin(v*4):0),(v-.5)*d);uv.push(u,v);}
      for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){const k=j*(cols+1)+i;idx.push(k,k+1,k+cols+2,k,k+cols+2,k+cols+1);}
      ge.setAttribute('position',new T.Float32BufferAttribute(pos,3));ge.setAttribute('uv',new T.Float32BufferAttribute(uv,2));ge.setIndex(idx);ge.computeVertexNormals();add(o,ge,m,'#ffffff',[0,0,0],[1,1,1],null,true);}
    function spiral(o,x,y,z,r,len,turns,c){const pts=[];for(let i=0;i<=turns*13;i++){const a=TAU*i/13;pts.push(V(x+len*i/(turns*13),y+Math.cos(a)*r,z+Math.sin(a)*r));}
      const ge=shape(new T.TubeGeometry(new T.CatmullRomCurve3(pts),pts.length-1,.0026,6,false));add(o,ge,metal,c);}
    const bW=1.84,bD=.738;
    for(const x of [-.76,.76])for(const z of [-.249,.249]){box(root,x,.020,z,.146,.040,.131,ironCol);disc(root,x,.044,z,.025,.009,brass,metal,'y',6);
      box(root,x,.455,z,.069,.860,.072,'#c7b995',wood);box(root,x,.097,z,.079,.136,.081,patina);box(root,x,.859,z,.083,.083,.082,raw);}
    for(const x of [-.76,.76]){rod(root,[x,.31,-.25],[x,.78,.25],.016,patina,iron);rod(root,[x,.31,.25],[x,.78,-.25],.016,patina,iron);}
    for(const z of [-.25,.25]){box(root,0,.805,z,1.61,.090,.065,'#c4af87',wood);box(root,0,.85,z,1.6,.019,.060,raw);}
    box(board,0,-.049,0,bW,.095,bD,'#decfa4',wood);box(board,0,-.002,0,bW+.006,.022,bD+.006,'#bf9b67',wood);
    for(const z of [-bD/2+.009,bD/2-.009])box(board,0,.010,z,bW,.010,.015,brass,metal);
    for(const x of [-bW/2+.011,bW/2-.011])box(board,x,.010,0,.014,.010,bD,bright,metal);
    box(board,0,.013,0,boardW+.001,.0029,boardD,cream,rubber);page(board,boardW,boardD,.0177,chartMat);
    for(const x of [-.835,.835])for(const z of [-.31,.31]){box(board,x,.021,z,.046,.0035,.051,'#a19870',metal);screw(board,x,.0237,z,.0062);}
    // Corrosion-isolated rails have two discrete mouths. The card shuttle moves in X before slotting toward +Z.
    const shallow=.665,side=.255;
    for(const x of [shallow,side]){
      for(const sx of [-1,1]){const bx=x+sx*.155;box(board,bx,.021,.026,.012,.014,.274,brass,metal);
        box(board,bx-sx*.003,.033,.060,.017,.010,.189,bright,metal);screw(board,bx,.038,.105,.0043);}
      box(board,x,.044,.164,.303,.038,.031,'#7e8469');box(board,x,.049,.146,.293,.027,.005,'#414c43',rubber);
      for(const dx of [-.130,.130])screw(board,x+dx,.064,.163,.006);
    }
    box(board,.455,.021,-.223,.785,.009,.014,brass,metal);
    // A single eccentric shaft drives both clamp jaws. The spring-loaded left handle acts through a visible pushrod at the same end.
    for(const x of [-.552,-.04,.803]){
      box(board,x,.023,.149,.066,.033,.101,patina);
      disc(board,x,.049,.149,.032,.069,ironCol,iron,'x',28);
      for(const z of [.112,.190])screw(board,x,.042,z,.007);
    }
    rod(jaw,[-.588,.007,0],[.833,.007,0],.0116,bright,metal,24);
    for(const x of [shallow,side]){
      for(const dx of [-.11,.11]){
        disc(jaw,x+dx,.007,0,.020,.048,brass,metal,'x',20);
        box(jaw,x+dx,.005,-.019,.022,.010,.051,brass,metal,[-.17,0,0]);
        rod(jaw,[x+dx,.002,-.033],[x+dx,-.013,-.050],.007,bright,metal);
      }
      box(jaw,x,-.014,-.050,.271,.012,.013,'#8f855f',metal);box(jaw,x,-.022,-.050,.269,.005,.014,'#504b37',rubber);
      spiral(board,x-.040,.049,.149,.021,.075,8,brass);
      rod(board,[x+.038,.069,.148],[x+.064,.019,.194],.0032,brass);
    }
    disc(board,-.555,.056,-.067,.029,.108,patina,iron,'x',24);
    for(const x of [-.610,-.502]){box(board,x,.032,-.067,.028,.053,.083,ironCol);screw(board,x,.037,-.095,.005);}
    // Thumb pressing the handle opens the far jaws; the second hand can brace against the edge throughout the stroke.
    rod(lever,[0,.003,.037],[0,.029,-.178],.016,brass,metal,14);
    rod(lever,[-.063,.030,-.188],[.063,.030,-.188],.021,'#76654a',wood,28);
    for(const x of [-.069,.069])disc(lever,x,.030,-.188,.016,.012,bright,metal,'x');
    rod(jaw,[-.554,.009,0],[-.554,.046,-.055],.009,brass);
    rod(lever,[0,0,0],[0,.043,.041],.009,brass);
    const live=group(board,0,0,0,'图夹推杆');disc(live,0,0,0,.005,1,bright,metal);
    const pivotA=[0,.043,.041],pivotB=[-.554,.046,-.055],aPt=V(),bPt=V(),leverQ=new T.Quaternion(),jawQ=new T.Quaternion(),axisX=V(1,0,0);
    box(board,-.443,.026,-.305,.103,.020,.042,brass,metal);
    for(const x of [-.493,-.393])screw(board,x,.038,-.305,.006);
    // A paper original has rounded corner wear, a bowed sheet, side retainers and two brass ears below its lower edge.
    box(shuttle,0,.005,0,.291,.008,.189,'#71776a',metal);box(shuttle,0,.010,0,.279,.003,.177,'#ad956d',rubber);
    page(shuttle,.276,.177,.0128,slipMat,true);
    for(const x of [-.136,.136]){box(shuttle,x,.016,.012,.009,.008,.090,brass,metal);screw(shuttle,x,.021,.039,.0032);}
    for(const x of [-.082,.082]){box(shuttle,x,.006,-.105,.028,.012,.044,raw,metal);
      rod(shuttle,[x,.007,-.115],[x,.026,-.152],.006,brass);
      disc(shuttle,x,.028,-.153,.012,.019,'#91764a',metal,'x',18);}
    // A short wax pencil with a shaving-cut tip is tethered in the unused far corner.
    rod(board,[-.799,.023,.221],[-.693,.023,.249],.0061,'#8a5545',rubber,6);
    rod(board,[-.693,.023,.249],[-.681,.023,.252],.0038,'#ac926f',wood,6);
    rod(board,[-.681,.023,.252],[-.677,.023,.253],.0014,wax,iron,6);
    const gripsL=[group(board,-.443,.040,-.305,'支撑手心'),group(lever,.035,.032,-.188,'压夹手心')];
    // Looking from -Z, left is +X in this board's frame.
    const gripsR=[group(shuttle,.082,.029,-.153,'左滑耳'),group(shuttle,-.082,.029,-.153,'右滑耳')];
    for(const [par,set] of batches)for(const [material,b] of set){const ge=own(new T.BufferGeometry());for(const [k,ar,n] of [['position',b.p,3],['normal',b.n,3],['uv',b.uv,2],['color',b.c,3]])ge.setAttribute(k,new T.Float32BufferAttribute(ar,n));ge.setIndex(b.ix);ge.computeBoundingSphere();ge.computeBoundingBox();
      const m=new T.Mesh(ge,material);m.castShadow=material!==chartMat&&material!==slipMat;m.receiveShadow=true;par.add(m);}
    for(const v of shapes)v.dispose();shapes.clear();batches.clear();
    const hands=[[V(),V()],[V(),V()]],pair=a=>Array.isArray(a)&&a.length===2&&a.every(Number.isFinite);
    function update(game){
      const s=game.gallery,closed=!s||s.phase==='done',readings=pair(s?.ticket)?s.ticket:pair(game.tideTicket)?game.tideTicket:null;
      print(readings);
      const press=closed?0:clamp(s.press||0,0,1),rail=closed?1:clamp(s.rail||0,-1,1),insert=closed?1:clamp(s.insert||0,0,1);
      lever.rotation.x=.27-.45*press;
      const atMouth=clamp((insert-.875)*21,0,1);jaw.rotation.x=.61*press+.205*atMouth*(1-press);
      aPt.fromArray(pivotA).applyQuaternion(leverQ.setFromAxisAngle(axisX,lever.rotation.x)).add(lever.position);bPt.fromArray(pivotB).applyQuaternion(jawQ.setFromAxisAngle(axisX,jaw.rotation.x)).add(jaw.position);
      direction.subVectors(bPt,aPt);const length=direction.length();live.position.copy(aPt).lerp(bPt,.5);live.quaternion.setFromUnitVectors(up,direction.multiplyScalar(1/length));live.scale.y=length;
      shuttle.position.set(.46-.205*rail,.015,-.197+.232*insert);
    }
    function grips(game,i){if(game.gallery?.phase!=='file'||!game.gallery.grip?.[i])return null;
      const pair=i?gripsR:gripsL;for(let k=0;k<2;k++)pair[k].getWorldPosition(hands[i][k]);return hands[i];}
    let disposed=false;update(g);return {update,grips,dispose(){if(disposed)return;disposed=true;root.removeFromParent();root.clear();for(const a of assets)a.dispose();assets.clear();}};
  }
  return {create};
})();
