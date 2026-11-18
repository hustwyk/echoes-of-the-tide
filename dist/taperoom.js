// Flood line archive. Geometry, typography, corrosion, glazing and dressing made for 北岬.
// Concrete scans reuse the site's existing TideConcrete / TideSlabMaps shared texture cache.
const TideTapeRoom = (() => {
  'use strict';
  const T=THREE, TAU=Math.PI*2;
  function create(scene) {
    const root=new T.Group();
    root.name='北岬下层磁带档案室';
    scene.add(root);
    const resources=new Set();
    const own=v=>(resources.add(v),v);
    let seed=32127,disposed=false;
    function noise(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;}
    const lerp=T.MathUtils.lerp;
    const cube=own(new T.BoxGeometry(1,1,1)), tube=own(new T.CylinderGeometry(1,1,1,16));
    const disk=own(new T.CylinderGeometry(1,1,1,40));
    const round=own(new T.SphereGeometry(1,20,12));
    const makeMat=(color,roughness,metalness,extra={})=>own(new T.MeshStandardMaterial({color,roughness,metalness,...extra}));
    const paint=makeMat(0xffffff,.68,.32),metal=makeMat(0xffffff,.45,.68),soft=makeMat(0xffffff,.88,.04);
    const brass=0xa28b5c,iron=0x48544d,old=0x596f66,coal=0x232d2c,red=0x8d503d,wood=0x8d7354;
    const v=(x,y,z)=>new T.Vector3(x,y,z), q=new T.Quaternion(),up=v(0,1,0);
    const batches=new Map(), matrix=new T.Matrix4(),euler=new T.Euler();
    const toruses=new Map();
    const items=[new T.Group(),new T.Group()],childhood=new T.Group();
    items[0].name='机房值班卷盒';items[1].name='电台卷与记录卡';
    root.add(...items,childhood);
    function emit(geo,mat,color,pos,scale,rot,layer=root){
      const key=geo.uuid+mat.uuid+layer.uuid;
      let entry=batches.get(key);
      if(!entry){entry={geo,mat,layer,transforms:[],colors:[]};batches.set(key,entry);}
      if(Array.isArray(rot))q.setFromEuler(euler.set(...rot));else if(rot)q.copy(rot);else q.identity();
      matrix.compose(v(...pos),q,v(...scale));
      entry.transforms.push(matrix.clone());entry.colors.push(color);
    }
    function box(x,y,z,a,b,c,col,mat=paint,rot=null,layer=root){emit(cube,mat,col,[x,y,z],[a,b,c],rot,layer);}
    function rod(a,b,r,col,mat=metal,layer=root){
      const start=v(...a),end=v(...b),delta=end.clone().sub(start),len=delta.length();
      if(len<.0001)return;
      const orientation=new T.Quaternion().setFromUnitVectors(up,delta.divideScalar(len));
      emit(tube,mat,col,start.lerp(end,.5).toArray(),[r,len,r],orientation,layer);
    }
    function cyl(x,y,z,r,h,col,rot=null,mat=metal,layer=root){emit(disk,mat,col,[x,y,z],[r,h,r],rot,layer);}
    function tor(x,y,z,r,wire,col,rot=null,mat=metal,layer=root){
      const id=Math.round(1000*wire/r);
      if(!toruses.has(id))toruses.set(id,own(new T.TorusGeometry(1,wire/r,8,48)));
      emit(toruses.get(id),mat,col,[x,y,z],[r,r,r],rot,layer);
    }
    function blob(x,y,z,a,b,c,col,mat=paint,rot=null,layer=root){emit(round,mat,col,[x,y,z],[a,b,c],rot,layer);}
    function mesh(geo,mat,x=0,y=0,z=0){
      const o=new T.Mesh(geo,mat);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;root.add(o);return o;
    }
    function concrete(color,water=1.03){
      return typeof TideConcrete==='undefined'?makeMat(color,.86,.08):own(TideConcrete.material(color,water));
    }
    function solid(geo,mat,x,y,z,sx,sy,sz){
      const o=mesh(geo,mat,x,y,z);o.scale.set(sx,sy,sz);return o;
    }
    const slab=concrete(0xb3aaa0,.95);
    const wall=concrete(0xa8ac9f,1.05),curb=concrete(0xa2a89e,.60);
    solid(cube,slab,0,-.23,.52,13.53,.46,12.32);
    for(const s of [-1,1])solid(cube,wall,s*6.65,2.00,.36,.32,4.25,11.99);
    // Shape with two true openings. The glass and sea remain visible through the masonry.
    const bulkhead=new T.Shape();
    bulkhead.moveTo(-6.60,-.25);bulkhead.lineTo(6.60,-.25);bulkhead.lineTo(6.60,4.17);bulkhead.lineTo(-6.60,4.17);bulkhead.closePath();
    const ports=[-3.74,3.74], portY=2.63, portR=.690;
    for(const x of ports){
      const hole=new T.Path();hole.absarc(x,portY,portR,0,TAU,true);bulkhead.holes.push(hole);
    }
    const bulkGeo=own(new T.ExtrudeGeometry(bulkhead,{depth:.34,bevelEnabled:false,curveSegments:40}));
    mesh(bulkGeo,wall,0,0,-5.79);
    solid(cube,curb,0,.11,-5.345,13.25,.22,.22);
    for(const s of [-1,1])solid(cube,curb,s*6.39,.097,.30,.24,.19,11.75);
    // Pipework and frames are held back against the perimeter. Ground-level walkways are open.
    for(const s of [-1,1]){
      box(s*6.43,3.74,.40,.22,.23,11.92,old);
      box(s*6.43,3.60,.40,.33,.06,11.92,iron);
      for(const z of [-4.93,-2.49,.03,2.55,5.05]){
        box(s*6.42,2.00,z,.19,3.77,.16,old);
        box(s*6.338,1.87,z,.031,3.23,.23,iron);
        for(const y of [.44,1.19,2.08,2.91,3.55])cyl(s*6.306,y,z,.031,.033,brass,[0,0,Math.PI/2]);
      }
    }
    box(0,3.80,-5.31,13.24,.32,.25,old);
    for(const y of [3.62,3.99])box(0,y,-5.29,13.29,.060,.34,iron);
    for(const x of [-6.06,-4.8,-3.11,-1.64,0,1.64,3.11,4.81,6.06]){
      box(x,3.80,-5.13,.10,.33,.05,old);
      for(const y of [3.69,3.91])cyl(x,y,-5.09,.028,.023,brass,[Math.PI/2,0,0]);
    }
    // All archive lettering, gauge faces and close-up paper art share one filtered atlas.
    const atlas=document.createElement('canvas');atlas.width=2048;atlas.height=2048;
    const ac=atlas.getContext('2d');let ax=3,ay=3,row=0;
    const atlasTex=own(new T.CanvasTexture(atlas));atlasTex.colorSpace=T.SRGBColorSpace;atlasTex.anisotropy=8;
    const signing=makeMat(0xffffff,.83,.07,{map:atlasTex,polygonOffset:true,polygonOffsetFactor:-1});
    const quadData=new Map();
    function tile(w,h,draw) {
      if(ax+w+4>atlas.width){ax=3;ay+=row+6;row=0;}
      if(ay+h+4>atlas.height)throw Error('Archive texture atlas is full.');
      const x=ax,y=ay;ax+=w+6;row=Math.max(row,h);
      ac.save();ac.beginPath();ac.rect(x,y,w,h);ac.clip();ac.translate(x,y);draw(ac,w,h);ac.restore();
      atlasTex.needsUpdate=true;
      return [(x+.5)/2048,1-(y+h-.5)/2048,(x+w-.5)/2048,1-(y+.5)/2048];
    }
    function sign(rect,x,y,z,w,h,rx=0,ry=0,rz=0,layer=root){
      if(!quadData.has(layer))quadData.set(layer,{p:[],uv:[],n:[],index:[]});
      const a=quadData.get(layer),start=a.p.length/3;
      const rot=new T.Quaternion().setFromEuler(new T.Euler(rx,ry,rz)),normal=v(0,0,1).applyQuaternion(rot);
      for(const [kx,ky] of [[-.5,-.5],[.5,-.5],[.5,.5],[-.5,.5]]){
        a.p.push(...v(kx*w,ky*h,0).applyQuaternion(rot).add(v(x,y,z)).toArray());a.n.push(...normal.toArray());
      }
      const [u0,v0,u1,v1]=rect;a.uv.push(u0,v0,u1,v0,u1,v1,u0,v1);
      a.index.push(start,start+1,start+2,start,start+2,start+3);
    }
    function scuff(c,w,h,level=1){
      c.save();
      for(let i=0;i<Math.floor(w*h*.015*level);i++){
        const x=noise()*w,y=noise()*h;
        c.fillStyle=i%3?'rgba(52,47,37,.15)':'rgba(243,224,180,.43)';
        c.fillRect(x,y,.30+noise()*1.7,.35+noise()*1.3);
      }
      for(let i=0;i<35*level;i++){
        const y=noise()*h,x=noise()*w;
        c.strokeStyle='rgba(49,48,38,.17)';c.lineWidth=.6;c.beginPath();c.moveTo(x,y);c.lineTo(x+noise()*18,y+noise()*2);c.stroke();
      }
      c.restore();
    }
    function plaque(main,sub,w,h,ink='#dee2cc',paper='#3a5551',extra=''){
      return tile(w,h,(c,w,h)=>{
        c.fillStyle=paper;c.fillRect(0,0,w,h);
        c.strokeStyle=ink;c.lineWidth=2;c.strokeRect(5,5,w-10,h-10);
        c.fillStyle=ink;c.textBaseline='middle';c.textAlign='center';
        c.font='bold '+Math.floor(h*.46)+'px "Songti SC",serif';c.fillText(main,w*.5,h*.42,w*.91);
        c.font='bold '+Math.floor(h*.14)+'px "PingFang SC",sans-serif';c.fillText(sub,w*.5,h*.76,w*.89);
        if(extra){c.textAlign='right';c.font='bold 12px monospace';c.fillText(extra,w-10,14);}
        scuff(c,w,h,.7);
      });
    }
    const hall=plaque('北 岬 音 讯 档 案 室','港 务 段　／　灯 塔 下 层　   •　 1 9 8 6',760,125,'#e8dea9','#3a5250');
    const leftPlate=plaque('机 房','动力值班档案　A—03',294,77);
    const rightPlate=plaque('电 台','通联值班档案　B—03',294,77);
    const little=plaque('十秒钟北岬','非值班带  /  短录 A',260,88,'#433d33','#d0bd8e');
    const duty=plaque('机房／值班','北岬·动力组  19:40—22:00',260,88,'#383f39','#d3cbb0');
    const log=plaque('电台／值班','北岬·通联组　晚班',260,88,'#393f3a','#cec1aa');
    const labels=[];
    for(const [txt,sub] of [['航 标','89 · 磁带库'],['北线','90 · 记录'],['雨汛','88 · 气象组'],['交接','主站／副带'],['听抄','北岬三卷'],['封存','档 字 049']])
      labels.push(plaque(txt,sub,105,56,'#403f33','#c8ba95'));
    sign(hall,0,3.34,-5.264,3.78,.62);
    for(const x of [-1.65,1.65])for(const y of [3.15,3.54])cyl(x,y,-5.249,.021,.025,brass,[Math.PI/2,0,0]);
    function gaugeFace(tag,color){
      return tile(192,192,(c,w,h)=>{
        c.fillStyle='#514e41';c.fillRect(0,0,w,h);c.translate(w/2,h/2);
        const gr=c.createRadialGradient(-12,-15,12,0,0,94);
        gr.addColorStop(0,'#e6ddba');gr.addColorStop(.82,'#c9c6a6');gr.addColorStop(1,'#7f8068');
        c.fillStyle=gr;c.beginPath();c.arc(0,0,95,0,TAU);c.fill();
        c.strokeStyle='#7b533e';c.lineWidth=5;c.beginPath();c.arc(0,0,75,-.64,.24);c.stroke();
        for(let i=0;i<=46;i++){
          const a=lerp(2.40,TAU+.74,i/46),r=i%5?73:68;
          c.strokeStyle='#41473c';c.lineWidth=i%5?1.25:3;
          c.beginPath();c.moveTo(Math.cos(a)*r,Math.sin(a)*r);c.lineTo(Math.cos(a)*81,Math.sin(a)*81);c.stroke();
          if(i%10===0){c.font='bold 13px serif';c.textAlign='center';c.fillStyle='#3c453d';c.fillText(String(i/10*2),Math.cos(a)*55,Math.sin(a)*55+4);}
        }
        c.textAlign='center';c.fillStyle='#474a3c';c.font='bold 12px serif';c.fillText(tag,0,42);c.font='8px monospace';c.fillText('NORTH CAPE · II',0,53);
        c.strokeStyle=color;c.lineWidth=3;c.beginPath();c.moveTo(8,7);c.lineTo(-43,-43);c.stroke();
        c.fillStyle='#5a5543';c.beginPath();c.arc(0,0,6,0,TAU);c.fill();
      });
    }
    const gaugeA=gaugeFace('库内湿度','#824838'),gaugeB=gaugeFace('排水水压','#344439');
    // The circular gauge art sits in a recessed round bezel.
    const dialMat=makeMat(0xffffff,.48,.08,{map:atlasTex,polygonOffset:true,polygonOffsetFactor:-1});
    function gauge(x,y,z,r,rect){
      cyl(x,y,z,r,.091,iron,[Math.PI/2,0,0]);
      tor(x,y,z+.061,r*.90,.023,brass);
      const discGeo=own(new T.CircleGeometry(r*.86,40)),uv=discGeo.getAttribute('uv');
      for(let i=0;i<uv.count;i++)uv.setXY(i,lerp(rect[0],rect[2],uv.getX(i)),lerp(rect[1],rect[3],uv.getY(i)));
      mesh(discGeo,dialMat,x,y,z+.064);
    }
    box(0,2.23,-5.333,1.86,1.12,.20,iron);
    box(0,2.23,-5.221,1.75,1.02,.047,0x6d7f71);
    gauge(-.43,2.36,-5.144,.271,gaugeA);gauge(.40,2.36,-5.144,.271,gaugeB);
    sign(plaque('排水记录','PUMP SECTION　　Ⅱ',255,58),0,1.90,-5.177,.83,.19);
    for(const x of [-.76,.76])for(const y of [1.82,2.65])cyl(x,y,-5.183,.026,.022,brass,[Math.PI/2,0,0]);
    for(const x of [-.49,.46])rod([x,1.77,-5.29],[x,.36,-5.29],.041,brass);
    for(const x of [-1.62,1.62]){
      box(x,2.24,-5.357,.14,2.15,.13,old);
      for(const y of [1.34,2.06,2.81])box(x,y,-5.269,.20,.050,.045,iron);
    }
    // Real open reel flanges, winding pack, hub and radial winding holes.
    const reelShape=new T.Shape();reelShape.absarc(0,0,1,0,TAU,false);
    const hubHole=new T.Path();hubHole.absarc(0,0,.095,0,TAU,true);reelShape.holes.push(hubHole);
    for(let i=0;i<3;i++){
      const a=i*TAU/3+.11,cut=new T.Path();
      cut.absellipse(.54*Math.sin(a),.54*Math.cos(a),.20,.30,0,TAU,true,-a);reelShape.holes.push(cut);
    }
    const flange=own(new T.ExtrudeGeometry(reelShape,{depth:.036,bevelEnabled:false,curveSegments:18}));
    function reel(x,y,z,r,layer=root){
      emit(flange,metal,0xabaa93,[x,y,z],[r,r,r],null,layer);
      emit(flange,metal,0xa49e86,[x,y,z-.085],[r,r,r],null,layer);
      cyl(x,y,z-.044,r*.84,.071,0x543f31,[Math.PI/2,0,0],soft,layer);
      cyl(x,y,z+.011,r*.19,.027,iron,[Math.PI/2,0,0],metal,layer);
      tor(x,y,z+.015,r*.91,.005,0xc2b895,null,metal,layer);
    }
    const sources=[duty,log];
    const cabinetKey=tile(156,104,(c,w,h)=>{
      c.fillStyle='#887145';c.fillRect(0,0,w,h);c.strokeStyle='#3a4440';c.lineWidth=4;c.strokeRect(4,4,w-8,h-8);
      c.fillStyle='#3b4036';c.font='bold 45px "Songti SC",serif';c.fillText('丙三',28,56);
      c.font='11px monospace';c.fillText('C-03  ARCHIVE KEY',20,82);scuff(c,w,h,1.3);
    });
    for(let side=0;side<2;side++){
      const s=side?1:-1,x=s*4.78,z=-4.88;
      for(const dx of [-1.02,1.02])for(const dz of [-.38,.38])box(x+dx,.519,z+dz,.065,1.03,.075,iron);
      for(const level of [.24,.73,1.00]){
        box(x,level,z,2.16,.056,.91,0x62766a);
        box(x,level-.041,z+.44,2.19,.063,.052,iron);
        for(const dx of [-.80,-.40,0,.40,.80])cyl(x+dx,level-.046,z+.473,.010,.012,brass,[Math.PI/2,0,0]);
      }
      // Thin record sleeves, cardboard boxes, packing labels and brass shelf lips.
      for(let rowIndex=0;rowIndex<2;rowIndex++){
        const y=rowIndex?.904:.455,height=rowIndex?.25:.36;
        for(let n=0;n<14;n++){
          const xpos=x-.91+n*.126;
          const col=[0x847c67,0x9d936f,0x9d8c72,0x746f59,0xa09a7c,0x8d7c63][(n+side*2+rowIndex)%6];
          box(xpos,y,z+.08,.106,height,.54,col,soft);
          box(xpos,y+.015,z+.358,.082,height*.73,.006,0xbbad87,soft);
          box(xpos,y-.062,z+.366,.046,.011,.005,0x534d3e,soft);
          box(xpos,y+.067,z+.366,.046,.012,.005,n%4?0x6d6f58:red,soft);
          if(n%3===0)box(xpos+.029,y-.004,z+.369,.007,.092,.004,0x726950,soft);
        }
      }
      sign(side?rightPlate:leftPlate,x,.704,z+.479,.72,.19);
      const j=side?1:-1;
      // The childhood recording sits behind the removable duty package.
      const cx=x+j*.62,archiveLayer=side?root:childhood;
      box(cx,1.072,-4.92,.60,.10,.41,0x7a745d,soft,null,archiveLayer);
      sign(side?labels[5]:little,cx,1.076,-4.706,.53,.085,0,0,0,archiveLayer);
      sign(side?labels[5]:little,cx,1.124,-4.92,.47,.18,-Math.PI/2,0,0,archiveLayer);
      for(let i=0;i<3;i++){
        box(x-j*.75,1.037+i*.025,-4.77,.49,.022,.30,i%2?0x8d7158:0xa28c69,soft);
        sign(labels[(side+2*i)%labels.length],x-j*.75,1.095+i*.011,-4.77,.31,.137,-Math.PI/2);
      }
      const pick=items[side];
      if(side===0){
        box(x,1.055,-4.47,.60,.091,.38,0x8e866c,soft,null,pick);
        box(x,1.107,-4.47,.62,.021,.40,0x6e7868,soft,null,pick);
        sign(sources[0],x,1.121,-4.47,.48,.162,-Math.PI/2,0,0,pick);
        sign(sources[0],x,1.064,-4.271,.52,.079,0,0,0,pick);
        box(x+.21,1.124,-4.57,.052,.008,.128,0x9f8b59,metal,null,pick);
      }else{
        box(x,1.047,-4.47,.56,.071,.41,0xb0a181,soft,null,pick);
        box(x,1.092,-4.47,.58,.023,.42,0x656d5b,soft,null,pick);
        box(x-.265,1.104,-4.47,.029,.008,.41,0x79523b,soft,null,pick);
        sign(sources[1],x+.028,1.109,-4.46,.38,.16,-Math.PI/2,0,0,pick);
        sign(sources[1],x,1.053,-4.258,.50,.080,0,0,0,pick);
      }
      if(!side){
        sign(cabinetKey,x-.79,.714,-4.399,.17,.10);
        tor(x-.88,.66,-4.384,.026,.006,brass);
        rod([x-.88,.64,-4.384],[x-.88,.56,-4.384],.006,brass);
        box(x-.868,.566,-4.384,.023,.012,.01,brass);
      }
    }
    // The three columns and rows share the written coordinates from the recording.
    // Parallel guides make a physical X/Y selector; the magnetic ring pulls the bow clear of its peg.
    const rackX=-4.78,rackY=1.68,rackZ=-4.755,boardW=1.08,boardH=.94;
    const columnX=[-.235,.043,.321],rowY=[.216,-.014,-.244];
    const letters=['甲','乙','丙'],numbers=['一','二','三'];
    box(rackX,rackY,rackZ,boardW,boardH,.072,iron);
    for(const s of [-1,1]){
      box(rackX+s*.535,rackY,rackZ+.035,.029,.949,.041,brass);
      box(rackX,rackY+s*.464,rackZ+.035,1.081,.026,.041,brass);
      rod([rackX+s*.465,rackY+.31,-5.40],[rackX+s*.465,rackY+.31,rackZ-.041],.018,iron);
      rod([rackX+s*.465,rackY+.31,-5.38],[rackX+s*.465,rackY-.32,rackZ-.041],.022,iron);
      for(const dy of [-.413,.417])cyl(rackX+s*.487,rackY+dy,rackZ+.067,.014,.013,brass,[Math.PI/2,0,0]);
    }
    // Baked enamel grid with scratches, paper reference tabs and faded key witness marks.
    const face=tile(600,512,(c,w,h)=>{
      const px=x=>(x/boardW+.5)*w,py=y=>(.5-y/boardH)*h;
      const bg=c.createLinearGradient(0,0,w,h);bg.addColorStop(0,'#728379');bg.addColorStop(.50,'#48645b');bg.addColorStop(1,'#384e49');
      c.fillStyle=bg;c.fillRect(0,0,w,h);scuff(c,w,h,1.80);
      c.font='bold 35px "PingFang SC","Microsoft YaHei",sans-serif';c.textAlign='center';c.textBaseline='middle';
      const tab=(x,y,text,light)=>{
        const xx=px(x),yy=py(y),ww=60,hh=43;
        c.fillStyle='#2d413d';c.fillRect(xx-ww/2-3,yy-hh/2+2,ww+6,hh+4);
        c.fillStyle=light?'#dfcf9e':'#bfba90';c.fillRect(xx-ww/2,yy-hh/2,ww,hh);
        c.strokeStyle='#87764e';c.lineWidth=2;c.strokeRect(xx-ww/2+3,yy-hh/2+3,ww-6,hh-6);
        c.fillStyle='#313f37';c.fillText(text,xx,yy+1);
      };
      for(let i=0;i<3;i++){
        tab(columnX[i],.369,letters[i],true);tab(-.420,rowY[i]-.043,numbers[i],false);
        c.strokeStyle='rgba(193,184,140,.50)';c.lineWidth=1;
        c.beginPath();c.moveTo(px(-.339),py(rowY[i]-.158));c.lineTo(px(.456),py(rowY[i]-.158));c.stroke();
        c.beginPath();c.moveTo(px(columnX[i]-.129),py(.300));c.lineTo(px(columnX[i]-.129),py(-.407));c.stroke();
      }
      for(const x of columnX)for(const y of rowY){
        const xx=px(x),yy=py(y),shadow=c.createRadialGradient(xx,yy+32,3,xx,yy+35,53);
        shadow.addColorStop(0,'rgba(32,34,27,.46)');shadow.addColorStop(1,'rgba(64,53,34,0)');
        c.fillStyle=shadow;c.fillRect(xx-55,yy-21,110,115);
      }
      c.fillStyle='#d6cab0';c.font='9px monospace';c.fillText('北 岬',px(-.419),py(.367)-8);c.fillText('K · 03',px(-.419),py(.367)+5);
    });
    sign(face,rackX,rackY,rackZ+.038,boardW-.034,boardH-.030);
    // Each bit, shoulder length and open bow is cut from a distinctive extruded blank.
    const keyPatina=makeMat(0xffffff,.51,.52,{vertexColors:true});
    const keys=[];
    for(let row=0;row<3;row++)for(let col=0;col<3;col++){
      const index=row*3+col,shape=new T.Shape(),type=(index+1)%3;
      const rx=.038+col*.004,ry=.033+(row%2)*.005,shaft=.008,length=.113+(.005*((index*7)%5));
      function outline(a,hole){
        let wave=type===1?1+.12*Math.cos(a*3+Math.PI*.5):type===2?1+.11*Math.cos(4*a):1;
        if(hole)wave=.67*wave;
        return [Math.cos(a)*rx*wave,Math.sin(a)*ry*wave];
      }
      const a0=-Math.PI*.5+.21,a1=TAU-Math.PI*.5-.21;
      shape.moveTo(shaft,-ry*.92);
      for(let p=0;p<=48;p++){const pt=outline(lerp(a0,a1,p/48),false);shape.lineTo(...pt);}
      shape.lineTo(-shaft,-ry*.94);shape.lineTo(-shaft,-length);
      const edge=shaft+.024+index%3*.006;
      shape.lineTo(edge,-length);shape.lineTo(edge,-length+.010);
      for(let i=0;i<2+(index%2);i++){
        const yy=-length+.016+i*.009,deep=shaft+.002+((index+i*2)%4)*.004;
        shape.lineTo(deep,yy-.004);shape.lineTo(deep,yy);shape.lineTo(edge,yy);
      }
      shape.lineTo(edge,-length+.043);shape.lineTo(shaft,-length+.043);
      shape.lineTo(shaft,-ry*.91);shape.closePath();
      const opening=new T.Path();for(let p=0;p<=40;p++){const pt=outline(-p*TAU/40,true);if(!p)opening.moveTo(...pt);else opening.lineTo(...pt);}
      shape.holes.push(opening);
      const geo=own(new T.ExtrudeGeometry(shape,{depth:.0095,bevelEnabled:true,bevelSegments:2,bevelThickness:.0015,bevelSize:.0019,curveSegments:12}));
      const vertex=geo.getAttribute('position'),colorData=[],base=new T.Color([0xb79a61,0xab8a59,0xb89e69,0xc4ac74][index%4]);
      for(let k=0;k<vertex.count;k++){
        const x=vertex.getX(k),y=vertex.getY(k),z=vertex.getZ(k);
        const spot=.5+.5*Math.sin(181*x+233*y+90*z+index)*Math.sin(146*y-91*x);
        const age=spot>.64?(spot-.64)*1.1:0;
        colorData.push(base.r*(1-age*.85),base.g*(1-age*.46),base.b*(1-age*.16));
      }
      geo.setAttribute('color',new T.Float32BufferAttribute(colorData,3));
      const x=rackX+columnX[col],y=rackY+rowY[row],z=rackZ+.103;
      const key=mesh(geo,keyPatina,x,y,z);key.rotation.z=.035*Math.sin(index*2.43);key.name='档案钥匙 '+letters[col]+numbers[row];
      keys.push({object:key,baseY:y,baseZ:z,tilt:key.rotation.z,lift:0});
      cyl(x,y+.017,rackZ+.057,.021,.032,coal,[Math.PI/2,0,0]);
      rod([x,y+.017,rackZ+.054],[x,y+.017,rackZ+.119],.0068,brass);
      rod([x,y+.017,rackZ+.119],[x,y+.026,rackZ+.125],.0068,brass);
    }
    const horizontal=new T.Group(),vertical=new T.Group(),grip=new T.Group();
    horizontal.name='钥匙架横尺';vertical.name='钥匙架纵尺';grip.name='钥匙架取用环';
    root.add(horizontal,vertical,grip);horizontal.visible=vertical.visible=grip.visible=false;
    const amber=makeMat(0xc38b33,.34,.48,{emissive:0xf2aa48,emissiveIntensity:.72});
    const edgeGlow=makeMat(0xf2d599,.34,.32,{emissive:0xffc978,emissiveIntensity:1.08});
    box(.065,-.052,-.036,.79,.007,.004,0xe2c07d,amber,null,horizontal);
    box(-.306,-.052,-.030,.042,.028,.018,brass,metal,null,horizontal);
    box(.080,-.044,-.044,.006,.681,.005,0xecca80,amber,null,vertical);
    box(.080,.274,-.036,.040,.027,.019,brass,metal,null,vertical);
    tor(0,0,.018,.055,.0046,0xffffff,null,edgeGlow,grip);
    box(.065,0,.008,.025,.015,.012,brass,metal,null,grip);
    for(const s of [-1,1])box(s*.039,-.029,.012,.012,.024,.011,0xcdab6a,metal,null,grip);
    let rackActive=false,lastKeyTime;
    function updateRack(state,time){
      const now=Number.isFinite(time)?time:performance.now()*.001;
      const dt=Math.min(.12,Math.max(0,now-(lastKeyTime??now-.016)));lastKeyTime=now;
      const active=Number.isInteger(state?.col)&&Number.isInteger(state?.row)&&state.col>=0&&state.col<3&&state.row>=0&&state.row<3;
      horizontal.visible=vertical.visible=grip.visible=active;
      if(!active&&!rackActive)return;
      const blend=rackActive?1-Math.exp(-dt*23):1,selected=active?state.row*3+state.col:-1;
      for(let n=0;n<keys.length;n++){
        const k=keys[n],wanted=Number(n===selected&&state.held);
        k.lift=active?lerp(k.lift,wanted,blend):0;
        const amount=k.lift<.001?0:k.lift;
        k.object.position.y=k.baseY+.070*amount;k.object.position.z=k.baseZ+.094*amount;
        k.object.rotation.x=-.15*amount;k.object.rotation.z=k.tilt+.105*amount;
      }
      if(active){
        const key=keys[selected],x=key.object.position.x,y=key.baseY,z=key.baseZ;
        if(!rackActive){vertical.position.set(x,rackY,z);horizontal.position.set(rackX,y,z);grip.position.set(x,y,z);}
        vertical.position.x=lerp(vertical.position.x,x,blend);horizontal.position.y=lerp(horizontal.position.y,y,blend);
        grip.position.set(vertical.position.x,horizontal.position.y+(key.object.position.y-y),key.object.position.z);
        edgeGlow.emissiveIntensity=.98+.18*Math.sin(now*4.3)+(state.held?.46:0);
      }
      rackActive=active;
    }
    // Low card-index drawers and rolled chart rack between the two source shelves.
    for(const x of [-1.82,1.82]){
      box(x,.52,-5.04,1.48,.87,.55,old);
      for(let i=0;i<3;i++)for(let j=0;j<2;j++){
        const dx=x+(i-1)*.456,y=.363+j*.354,z=-4.748;
        box(dx,y,z,.438,.331,.054,0x738172);
        box(dx,y+.045,z+.045,.18,.082,.015,brass);
        sign(labels[(i+j)%6],dx,y+.045,z+.056,.156,.063);
        rod([dx-.051,y-.076,z+.071],[dx+.051,y-.076,z+.071],.014,iron);
      }
      box(x,.99,-5.04,1.53,.063,.65,wood,soft);
      reel(x+.30,1.23,-4.97,.220);
      for(let i=0;i<4;i++){
        const dx=x-.52+i*.080;
        box(dx,1.16,-5.00,.061,.307,.32,i%2?0x979278:0x85715d,soft);
        sign(labels[i],dx,1.18,-4.838,.050,.118,0,0,Math.PI*.5);
      }
    }
    // Tape hung to dry on a short rack; each ribbon twists on its own axis.
    const ribbonMat=makeMat(0x493d32,.40,.24,{side:T.DoubleSide});
    const tapeP=[],tapeI=[];
    for(const s of [-1,1]){
      const x=s*2.35,z=-5.04;
      rod([x-.59,2.60,z],[x+.59,2.60,z],.024,brass);
      for(const a of [-.48,.48])rod([x+a,2.60,z-.35],[x+a,2.60,z],.027,iron);
      for(let k=0;k<5;k++){
        const xx=x-.40+k*.21,long=.56+noise()*.59;
        box(xx,2.595,z+.003,.029,.088,.043,wood,soft);
        const start=tapeP.length/3;
        for(let j=0;j<=16;j++){
          const t=j/16, px=xx+.043*Math.sin(2.7*t+k)*t, py=2.57-long*t, pz=z+.054*Math.sin(t*4.5+k)*t;
          const angle=t*(2.4+k*.29)+k*.29+.22;
          for(const dir of [-1,1])tapeP.push(px+dir*.014*Math.cos(angle),py,pz+dir*.014*Math.sin(angle));
          if(j<16){const a=start+j*2;tapeI.push(a,a+1,a+2,a+1,a+3,a+2);}
        }
      }
    }
    const ribbonGeo=own(new T.BufferGeometry());ribbonGeo.setAttribute('position',new T.Float32BufferAttribute(tapeP,3));ribbonGeo.setIndex(tapeI);ribbonGeo.computeVertexNormals();mesh(ribbonGeo,ribbonMat);
    // Period drain and heating services on the side walls with wheel valves, clamps, short elbows and inspection labels.
    for(const s of [-1,1]){
      const a=s*6.228;
      rod([a,1.21,-5.10],[a,1.21,5.96],.079,old);
      rod([a,1.47,-5.15],[a,1.47,5.90],.036,brass);
      rod([a,3.12,-5.12],[a,3.12,6.11],.052,iron);
      for(const z of [-4.54,-2.95,-1.11,.87,2.81,4.76]){
        for(const y of [1.21,1.47,3.12]){
          const r=y===1.21?.099:y===1.47?.054:.069;
          cyl(a,y,z,r,.054,0x58615a,[Math.PI/2,0,0]);
          box(a+s*.103,y,z,.18,.049,.057,iron);
        }
      }
      const z=s===-1?-1.40:.01;
      rod([a,1.21,z],[a-s*.29,1.21,z],.092,iron);
      const wheelX=a-s*.334;
      tor(wheelX,1.21,z,.21,.027,red,[0,Math.PI/2,0]);
      for(let i=0;i<5;i++){
        const u=TAU*i/5;
        rod([wheelX,1.21,z],[wheelX,1.21+Math.cos(u)*.19,z+Math.sin(u)*.19],.010,red);
      }
      cyl(wheelX,1.21,z,.040,.09,brass,[0,0,Math.PI/2]);
      box(a+s*.10,2.12,z-.52,.09,.40,.49,old);
      sign(plaque(s<0?'回水':'泵房','管　线　阀　门',130,64),a+s*.049,2.12,z-.52,.41,.23,0,-s*Math.PI/2);
    }
    // Wide iron trench grates sit flush with the slab and never interrupt foot placement.
    for(const s of [-1,1]){
      const x=s*5.81;
      box(x,.009,.41,.29,.017,11.62,coal);
      for(const dx of [-.16,.16])box(x+dx,.020,.41,.033,.029,11.63,iron);
      for(let i=0;i<114;i++){
        const z=-5.34+i*.1022;
        box(x,.028,z,.285,.030,.033,i%11?0x566159:0x8d8270,metal);
      }
      for(const z of [-4.90,-2.95,-.97,1.01,2.99,4.93]){
        box(x,.034,z,.35,.03,.063,iron);
        for(const dx of [-.12,.12])cyl(x+dx,.052,z,.014,.012,brass);
      }
    }
    // Joints in the original sectional floor, tarred and patched after flood damage.
    for(const x of [-3.28,0,3.28])box(x,.005,.54,.011,.007,11.55,0x50564c,soft);
    for(const z of [-2.79,.02,2.86,5.64])box(0,.005,z,11.33,.007,.010,0x50564c,soft);
    function canvasMap(w,h,draw,colorSpace=true){
      const cv=document.createElement('canvas');cv.width=w;cv.height=h;draw(cv.getContext('2d'),w,h);
      const tex=own(new T.CanvasTexture(cv));if(colorSpace)tex.colorSpace=T.SRGBColorSpace;tex.anisotropy=4;return tex;
    }
    const salt=canvasMap(1024,192,(c,w,h)=>{
      const tide=x=>52+8*Math.sin(x/82+.2)+3.5*Math.sin(x/15.1)+2*Math.sin(x/5.3);
      for(let x=0;x<w;x+=2){
        const y=tide(x),drip=noise(),opacity=.135+noise()*.36;
        const gr=c.createLinearGradient(0,y-3,0,h);
        gr.addColorStop(0,'rgba(230,216,169,0)');gr.addColorStop(.035,'rgba(230,221,187,'+opacity+')');
        gr.addColorStop(.11,'rgba(99,100,78,.20)');gr.addColorStop(.60,'rgba(57,66,54,.09)');gr.addColorStop(1,'rgba(48,55,44,.08)');
        c.fillStyle=gr;c.fillRect(x,y-5,2,h);
        if(drip>.966){c.fillStyle='rgba(102,91,62,.33)';c.fillRect(x,y+5,2,12+noise()*37);}
      }
      for(let i=0;i<5100;i++){
        const x=noise()*w,y=tide(x)+(noise()-.21)*(noise()*43);
        c.fillStyle=i%4?'rgba(214,207,177,.34)':'rgba(123,123,95,.20)';c.fillRect(x,y,noise()*3+.3,.4+noise()*1.6);
      }
    });
    const saltMaterial=own(new T.MeshBasicMaterial({map:salt,transparent:true,opacity:.74,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2}));
    const unitPlane=own(new T.PlaneGeometry(1,1));
    function plane(mat,x,y,z,w,h,rx=0,ry=0,rz=0){
      const o=mesh(unitPlane,mat,x,y,z);o.scale.set(w,h,1);o.rotation.set(rx,ry,rz);o.castShadow=false;return o;
    }
    plane(saltMaterial,0,.795,-5.442,13.03,1.08);
    for(const s of [-1,1])plane(saltMaterial,s*6.482,.793,.42,11.8,1.08,0,-s*Math.PI/2);
    const glassMap=canvasMap(384,384,(c,w,h)=>{
      const g=c.createLinearGradient(0,0,0,h);g.addColorStop(0,'#527c85');g.addColorStop(.5,'#bdd4c7');g.addColorStop(.76,'#739b99');g.addColorStop(1,'#3d6367');c.fillStyle=g;c.fillRect(0,0,w,h);
      for(let j=0;j<610;j++){
        const x=noise()*w,y=noise()*h,r=.65+noise()*2.3,l=noise();
        c.strokeStyle='rgba(220,240,222,'+(.06+.31*l)+')';c.lineWidth=r*.60;c.beginPath();c.arc(x,y,r,.5,2.91);c.stroke();
        if(l>.87){c.fillStyle='rgba(52,82,82,.12)';c.fillRect(x,y+2,r*.60,3+noise()*29);}
      }
      for(let i=0;i<56;i++){
        const y=h*.66+noise()*h*.31;c.fillStyle='rgba(176,211,209,'+(.05+noise()*.2)+')';
        c.fillRect(noise()*w,y,5+noise()*47,.45+noise()*1.7);
      }
    });
    const frosted=makeMat(0xa3c8c8,.26,.20,{map:glassMap,emissive:0x81bac6,emissiveMap:glassMap,emissiveIntensity:.75,transparent:true,opacity:.71,depthWrite:false});
    const paneGeo=own(new T.CircleGeometry(.674,64));
    const daylight=canvasMap(256,384,(c,w,h)=>{
      const image=c.createImageData(w,h);
      for(let y=0;y<h;y++)for(let x=0;x<w;x++){
        const u=(x+.5)/w*2-1,t=(y+.5)/h;
        const radius=.32+.59*Math.sin(t*Math.PI*.841);
        const cover=Math.max(0,1-Math.pow(Math.abs(u)/radius,2.65))*Math.pow(Math.sin(t*Math.PI),.75);
        const frame=(.25+.75*Math.min(1,Math.abs(u+.10)*(12+9*t)))*(.42+.58*Math.min(1,Math.abs(t-.24)*16));
        const idx=(y*w+x)*4;image.data[idx]=134;image.data[idx+1]=199;image.data[idx+2]=222;
        image.data[idx+3]=Math.round(cover*frame*164*(.76+.24*noise()));
      }
      c.putImageData(image,0,0);
    });
    const spill=own(new T.MeshBasicMaterial({map:daylight,color:0xaabec1,transparent:true,opacity:.52,depthWrite:false,blending:T.AdditiveBlending,polygonOffset:true,polygonOffsetFactor:-2}));
    const lanternGlow=canvasMap(160,160,(c,w,h)=>{
      const gr=c.createRadialGradient(w/2,h/2,.05,w/2,h/2,w/2);gr.addColorStop(0,'rgba(255,226,168,1)');gr.addColorStop(.10,'rgba(255,199,119,.80)');gr.addColorStop(.36,'rgba(244,138,60,.20)');gr.addColorStop(.75,'rgba(210,112,48,.065)');gr.addColorStop(1,'rgba(185,89,39,0)');c.fillStyle=gr;c.fillRect(0,0,w,h);
    });
    const lampHalo=own(new T.MeshBasicMaterial({map:lanternGlow,transparent:true,opacity:.63,depthWrite:false,blending:T.AdditiveBlending}));
    const bulb=makeMat(0xffedbc,.31,.11,{emissive:0xffb557,emissiveIntensity:4.8});
    const mica=makeMat(0xf2ca82,.28,.24,{emissive:0xf3943e,emissiveIntensity:.74,transparent:true,opacity:.43,depthWrite:false});
    for(const x of ports){
      const signX=Math.sign(x);
      const g=mesh(paneGeo,frosted,x,portY,-5.606);g.castShadow=false;
      tor(x,portY,-5.424,.727,.101,old);
      tor(x,portY,-5.351,.665,.052,iron);
      tor(x,portY,-5.328,.629,.016,brass);
      for(let i=0;i<12;i++){
        const a=i*TAU/12,xx=x+.752*Math.cos(a),y=portY+.752*Math.sin(a);
        cyl(xx,y,-5.335,.030,.040,0xae9a73,[Math.PI/2,0,0]);
      }
      for(const offset of [-.30,.30]){
        const length=Math.sqrt(.645*.645-offset*offset);
        rod([x+offset,portY-length,-5.555],[x+offset,portY+length,-5.555],.017,iron);
      }
      rod([x-.642,portY,-5.555],[x+.642,portY,-5.555],.017,iron);
      plane(spill,x-signX*.29,.038,-2.89,1.8,4.36,-Math.PI/2,0,signX*.11);
      const lx=signX*5.72,ly=2.43,lz=-4.97;
      rod([lx,ly+.33,-5.405],[lx,ly+.33,lz],.035,iron);
      rod([lx,ly+.33,lz],[lx,ly+.213,lz],.035,iron);
      cyl(lx,ly+.156,lz,.115,.125,old);
      blob(lx,ly-.034,lz,.080,.156,.080,0xffffff,bulb);
      blob(lx,ly-.052,lz,.128,.197,.128,0xffffff,mica);
      tor(lx,ly-.23,lz,.09,.012,iron,[Math.PI/2,0,0]);
      tor(lx,ly-.077,lz,.139,.012,iron,[Math.PI/2,0,0]);
      for(let i=0;i<8;i++){
        const ang=i*TAU/8,xx=Math.cos(ang),zz=Math.sin(ang);
        rod([lx+.111*xx,ly+.104,lz+.111*zz],[lx+.137*xx,ly-.083,lz+.137*zz],.009,iron);
        rod([lx+.137*xx,ly-.083,lz+.137*zz],[lx+.090*xx,ly-.228,lz+.090*zz],.009,iron);
      }
      plane(lampHalo,lx,ly-.04,lz+.159,1.10,1.10);
      plane(lampHalo,lx,ly-.04,-5.417,2.40,2.38);
      const light=new T.PointLight(x<0?0xffb467:0xffcf85,x<0?24:21,6.5,1.95);light.position.set(lx,ly-.10,lz+.32);root.add(light);
    }
    // Damp pooled water reflects the existing scene environment without additional lights or capture passes.
    const wetMat=own(new T.MeshPhysicalMaterial({color:0x516664,roughness:.18,metalness:.23,clearcoat:.82,clearcoatRoughness:.13,transparent:true,opacity:.32,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2}));
    const rippleMat=own(new T.LineBasicMaterial({color:0x839a8e,transparent:true,opacity:.34,depthWrite:false}));
    const wetPos=[],wetIndex=[],ripple=[];
    function puddle(x,z,rx,rz){
      const start=wetPos.length/3;wetPos.push(x,.012,z);
      const key=noise()*TAU;
      for(let i=0;i<=64;i++){
        const a=i*TAU/64,rr=.82+.14*Math.sin(a*3+key)+.066*Math.sin(a*8+key*.7)+.034*Math.sin(a*13);
        const px=x+rx*rr*Math.cos(a),pz=z+rz*rr*Math.sin(a);
        wetPos.push(px,.012,pz);if(i<64)wetIndex.push(start,start+i+2,start+i+1);
        if(i>0&&(i<14||i>24&&i<39)){const prev=wetPos.length-6;ripple.push(wetPos[prev],.015,wetPos[prev+2],px,.015,pz);}
      }
    }
    for(const [x,z,rx,rz] of [[-4,-2.52,1.35,.67],[3.88,-2.82,1.58,.73],[-5.02,2.05,.49,1.53],[4.19,3.07,.89,.53],[.46,-.90,.76,.32],[-1.54,4.97,.71,.24]])puddle(x,z,rx,rz);
    const wet=own(new T.BufferGeometry());wet.setAttribute('position',new T.Float32BufferAttribute(wetPos,3));wet.setIndex(wetIndex);wet.computeVertexNormals();
    const wm=mesh(wet,wetMat);wm.castShadow=false;
    const rg=own(new T.BufferGeometry());rg.setAttribute('position',new T.Float32BufferAttribute(ripple,3));root.add(new T.LineSegments(rg,rippleMat));
    for(const [layer,data] of quadData){
      const geo=own(new T.BufferGeometry());geo.setAttribute('position',new T.Float32BufferAttribute(data.p,3));geo.setAttribute('uv',new T.Float32BufferAttribute(data.uv,2));geo.setAttribute('normal',new T.Float32BufferAttribute(data.n,3));geo.setIndex(data.index);
      const o=new T.Mesh(geo,signing);o.receiveShadow=true;layer.add(o);
    }
    for(const {geo,mat,layer,colors,transforms} of batches.values()){
      const o=own(new T.InstancedMesh(geo,mat,transforms.length));
      for(let i=0;i<transforms.length;i++){o.setMatrixAt(i,transforms[i]);o.setColorAt(i,new T.Color(colors[i]));}
      o.castShadow=mat!==bulb&&mat!==mica;o.receiveShadow=true;
      o.computeBoundingSphere();layer.add(o);
    }
    return {
      update(g){
        if(disposed)return;
        const archive=g?.archive;
        for(let i=0;i<items.length;i++){
          const item=items[i],carried=g.stage===1&&archive?.fetched[i]&&!archive.mounted[i];
          item.visible=carried||!archive?.fetched[i];
          if(carried){
            const p=g.players[i],s=Math.sin(p.yaw),c=Math.cos(p.yaw),shelfX=i?4.78:-4.78,shelfZ=-4.47;
            item.rotation.y=p.yaw;
            item.position.set(p.x-.30*s-c*shelfX-s*shelfZ,p.y+.01,p.z-.30*c+s*shelfX-c*shelfZ);
          }else{item.position.set(0,0,0);item.rotation.y=0;}
        }
        childhood.visible=g.stage>0;
        updateRack(archive?.keys,g?.time);
      },
      dispose(){
        if(disposed)return;disposed=true;root.removeFromParent();
        for(const obj of resources)obj.dispose();
        root.clear();resources.clear();
      }
    };
  }
  return {create};
})();
window.TideTapeRoom=TideTapeRoom;
