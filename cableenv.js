// North Cape cable wharf. All decks follow the collision slabs supplied by the chapter.
const TideCableQuayEnv=(()=>{
  'use strict';
  function create(scene,world){
    const T=THREE,root=new T.Group();root.name='北岬港 · 东缆码头';scene.add(root);
    const owned=new Set(),keep=v=>(owned.add(v),v),groups=new Map(),geos=new Map(),floors=[];
    const up=new T.Vector3(0,1,0),quat=new T.Quaternion(),rot=new T.Euler(),tmp=new T.Matrix4(),base=new T.Matrix4();
    const TAU=Math.PI*2;
    let id=21279,disposed=false;
    const rnd=()=>{id=(Math.imul(id,1664525)+1013904223)>>>0;return id/4294967296;};
    function geo(key,make){if(!geos.has(key))geos.set(key,keep(make()));return geos.get(key);}
    const boxGeo=geo('box',()=>new T.BoxGeometry(1,1,1)),cyl=geo('tube',()=>new T.CylinderGeometry(1,1,1,12));
    const nut=geo('rivet',()=>new T.CylinderGeometry(1,1,1,7)),sphere=geo('oval',()=>new T.SphereGeometry(1,16,10));
    const flat=geo('plane',()=>new T.PlaneGeometry(1,1));
    const mat=(col,rough,metal,opt={})=>keep(new T.MeshStandardMaterial({color:col,roughness:rough,metalness:metal,...opt}));
    function texture(w,h,draw){
      const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;draw(canvas.getContext('2d'),w,h);
      const t=keep(new T.CanvasTexture(canvas));t.colorSpace=T.SRGBColorSpace;t.anisotropy=8;return t;
    }
    const metalMap=texture(256,256,(c,w,h)=>{
      c.fillStyle='#d5cfc1';c.fillRect(0,0,w,h);
      for(let i=0;i<5600;i++){
        c.fillStyle=i%7===0?'rgba(91,67,50,.40)':i%3?'rgba(118,126,109,.30)':'rgba(241,230,196,.41)';
        c.fillRect(rnd()*w,rnd()*h,.45+rnd()*2.0,.3+rnd()*1.9);
      }
      for(let i=0;i<75;i++){
        const x=rnd()*w,y=rnd()*h;c.strokeStyle='rgba(81,75,60,.20)';c.lineWidth=.4+rnd()*.8;
        c.beginPath();c.moveTo(x,y);c.lineTo(x+1+rnd()*14,y+rnd()*10-5);c.stroke();
      }
    });metalMap.wrapS=metalMap.wrapT=T.RepeatWrapping;
    const painted=mat(0xffffff,.62,.38,{map:metalMap,bumpMap:metalMap,bumpScale:.009}),alloy=mat(0xffffff,.43,.63,{map:metalMap});
    const canvas=mat(0xffffff,.91,.05),rubber=mat(0xffffff,.72,.09);
    const woodMap=texture(512,96,(c,w,h)=>{
      c.fillStyle='#bea88d';c.fillRect(0,0,w,h);
      for(let i=0;i<580;i++){
        const y=h*rnd(),x=w*rnd(),len=10+rnd()*211,d=rnd()*5;c.lineWidth=rnd()*.95+.32;c.strokeStyle=i%4===0?'rgba(235,217,187,.36)':'rgba(75,56,46,.17)';
        c.beginPath();c.moveTo(x,y);c.bezierCurveTo(x+len*.23,y-d,x+len*.66,y+d,x+len,y+.7);c.stroke();
      }
    });
    const timber=mat(0xffffff,.75,.09,{map:woodMap,bumpMap:woodMap,bumpScale:.018});
    const slab=(tint,line)=>typeof TideConcrete==='undefined'?mat(tint,.82,.05):keep(TideConcrete.material(tint,line));
    const concrete=slab(0xb6b6a6,-.35),edge=slab(0x909e91,-.15);
    const dark=0x3f4d4b,rail=0x6c7d75,old=0x7b806e,rust=0xa07853,bolt=0xa59b81,ink=0x343e3b;
    // Shared instance batches keep draw counts constant as the number of pier sections grows.
    function part(g,m,tint,p,s,r,owner){
      const k=g.uuid+m.uuid;let b=groups.get(k);if(!b){b={g,m,t:[],c:[],owner:[],mesh:null,movable:false};groups.set(k,b);}
      if(Array.isArray(r))quat.setFromEuler(rot.set(...r));else if(r)quat.copy(r);else quat.identity();
      const matrix=new T.Matrix4().compose(new T.Vector3(...p),quat,new T.Vector3(...s));
      const i=b.t.length;b.t.push(matrix);b.c.push(tint);b.owner.push(owner||null);
      if(owner){owner.parts.push([b,i]);b.movable=true;}
    }
    function box(x,y,z,w,h,d,m,c=0xffffff,r=null,o=null){part(boxGeo,m,c,[x,y,z],[w,h,d],r,o);}
    function cylinder(x,y,z,r,h,m,c,rot=null,o=null){part(cyl,m,c,[x,y,z],[r,h,r],rot,o);}
    function rivet(x,y,z,r,axis=0,c=bolt,o=null){part(nut,alloy,c,[x,y,z],[r,r*.65,r],axis===1?[Math.PI/2,0,0]:axis===2?[0,0,Math.PI/2]:null,o);}
    function ring(x,y,z,r,w,m,c,rotation=null,o=null){
      const k='torus'+Math.round(1000*w/r);part(geo(k,()=>new T.TorusGeometry(1,w/r,8,36)),m,c,[x,y,z],[r,r,r],rotation,o);
    }
    function spar(a,b,w,d,m,c,o=null,circular=false){
      const p=new T.Vector3(...a),q=new T.Vector3(...b),v=q.clone().sub(p),len=v.length();if(len<.0001)return;
      part(circular?cyl:boxGeo,m,c,p.lerp(q,.5).toArray(),[w,len,d],new T.Quaternion().setFromUnitVectors(up,v.divideScalar(len)),o);
    }
    // Separate UV patches all use the same material. Each retains the correct floor owner.
    const atlasCanvas=document.createElement('canvas');atlasCanvas.width=2048;atlasCanvas.height=1024;
    const ac=atlasCanvas.getContext('2d'),atlas=keep(new T.CanvasTexture(atlasCanvas));atlas.colorSpace=T.SRGBColorSpace;atlas.anisotropy=8;
    const graphic=mat(0xffffff,.80,.06,{map:atlas,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2});
    let ax=3,ay=3,row=0;
    function patch(w,h,draw){
      if(ax+w+4>2048){ax=3;ay+=row+5;row=0;}if(ay+h+3>1024)throw Error('Cable wharf atlas overflow');
      const x=ax,y=ay;ax+=w+5;row=Math.max(row,h);ac.save();ac.beginPath();ac.rect(x,y,w,h);ac.clip();ac.translate(x,y);draw(ac,w,h);ac.restore();
      const g=keep(new T.PlaneGeometry(1,1)),uv=g.getAttribute('uv');
      for(let i=0;i<uv.count;i++){const u=uv.getX(i),v=uv.getY(i);uv.setXY(i,(x+.5+(w-1)*u)/2048,1-(y+.5+(h-1)*(1-v))/1024);}
      atlas.needsUpdate=true;return g;
    }
    function art(tile,x,y,z,w,h,rx=0,ry=0,rz=0,o=null){part(tile,graphic,0xffffff,[x,y,z],[w,h,1],[rx,ry,rz],o);}
    function scuff(c,w,h,n){
      for(let i=0;i<n;i++){c.fillStyle=i%4?'rgba(49,57,47,.23)':'rgba(220,188,140,.33)';c.fillRect(w*rnd(),h*rnd(),.4+rnd()*3,.5+rnd()*1.5);}
      c.save();c.globalCompositeOperation='destination-out';for(let i=0;i<n*.12;i++){c.fillStyle='rgba(0,0,0,.6)';c.fillRect(rnd()*w,rnd()*h,1+rnd()*6,.6+rnd()*1.3);}c.restore();
    }
    const name=patch(600,139,(c,w,h)=>{
      c.fillStyle='#465550';c.fillRect(0,0,w,h);c.strokeStyle='#c3b88d';c.lineWidth=3;c.strokeRect(8,8,w-16,h-16);
      c.fillStyle='#e4d7b2';c.font='bold 57px "Songti SC","Microsoft YaHei",serif';c.textAlign='center';c.textBaseline='middle';c.fillText('北 岬 港　 东 缆 码 头',w/2,51,w-51);
      c.fillStyle='#b3bdac';c.font='bold 16px monospace';c.fillText('EAST CABLE WHARF   /   NORTH CAPE',w/2,102);scuff(c,w,h,1400);
    });
    const cranePlate=patch(338,94,(c,w,h)=>{
      c.fillStyle='#c1ae81';c.fillRect(0,0,w,h);c.strokeStyle='#62604d';c.lineWidth=2;c.strokeRect(5,5,w-10,h-10);
      c.fillStyle='#3b4a46';c.font='bold 31px "Songti SC",serif';c.fillText('港务机修段　07',17,44);
      c.font='12px monospace';c.fillText('定柱式回转桅杆　／　北岬车间',19,70);scuff(c,w,h,690);
    });
    const stencil=patch(230,96,(c,w,h)=>{
      c.fillStyle='#d0c3a1';c.font='bold 42px sans-serif';c.fillText('东 廊',8,47);c.font='bold 16px monospace';c.fillText('EAST  /  02',10,75);scuff(c,w,h,530);
    });
    const floatMark=patch(235,89,(c,w,h)=>{
      c.fillStyle='#ccb587';c.font='bold 39px "Songti SC",serif';c.fillText('浮 栈　贰',7,44);c.font='bold 12px monospace';c.fillText('WORK LANDING · 02',9,68);scuff(c,w,h,480);
    });
    const salt=patch(436,130,(c,w,h)=>{
      const line=x=>42+4.8*Math.sin(x*.031)+2.3*Math.sin(x*.131);
      for(let x=0;x<w;x++){
        const y=line(x)+2*rnd(),v=c.createLinearGradient(0,y-2,0,y+64);
        v.addColorStop(0,'rgba(226,220,180,0)');v.addColorStop(.08,'rgba(223,217,178,'+(.28+rnd()*.32)+')');
        v.addColorStop(.23,'rgba(126,143,106,.23)');v.addColorStop(1,'rgba(58,72,56,0)');c.fillStyle=v;c.fillRect(x,y-3,1,69);
      }
      for(let i=0;i<2200;i++){const x=w*rnd();c.fillStyle='rgba(215,208,167,.35)';c.fillRect(x,line(x)+(rnd()-.40)*(rnd()*38),.5+rnd()*2.5,.4+rnd());}
    });
    const chevrons=patch(267,68,(c,w,h)=>{
      c.fillStyle='#5b6456';c.fillRect(0,0,w,h);c.fillStyle='#c3ad77';
      for(let x=-h;x<w+h;x+=58){c.beginPath();c.moveTo(x,0);c.lineTo(x+25,0);c.lineTo(x+25-h,h);c.lineTo(x-h,h);c.closePath();c.fill();}scuff(c,w,h,420);
    });
    const puddleTex=texture(256,128,(c,w,h)=>{
      const image=c.createImageData(w,h);
      for(let y=0;y<h;y++)for(let x=0;x<w;x++){
        const a=(x+.5)/w*2-1,b=(y+.5)/h*2-1,ang=Math.atan2(b,a),d=Math.sqrt(a*a+b*b);
        const margin=.79+.11*Math.sin(ang*3+1)+.047*Math.sin(ang*7)+.026*Math.cos(ang*13),fade=Math.min(1,Math.max(0,(margin-d)*48));
        const i=(y*w+x)*4;image.data[i]=111;image.data[i+1]=133;image.data[i+2]=129;image.data[i+3]=Math.round(fade*180*(.87+.13*rnd()));
      }c.putImageData(image,0,0);
    });
    const wet=keep(new T.MeshPhysicalMaterial({map:puddleTex,roughness:.12,metalness:.52,clearcoat:1,clearcoatRoughness:.11,transparent:true,depthWrite:false,opacity:.47,polygonOffset:true,polygonOffsetFactor:-2}));
    const reflection=(x,y,z,w,d,angle,o)=>part(flat,wet,0xffffff,[x,y,z],[w,d,1],[-Math.PI/2,0,angle],o);
    function concreteDeck(f,o){
      const w=f.w,d=f.d;
      box(0,-.307,0,w,.608,d,concrete,0xffffff,null,o);
      box(0,-.714,0,w*.96,.24,Math.max(.12,d-.12),edge,0xffffff,null,o);
      for(const side of [-1,1]){
        box(side*(w*.5-.048),-.125,0,.096,.24,d,edge,0xffffff,null,o);
        box(side*(w*.5-.21),-.002,0,.029,.004,Math.max(.05,d-.08),painted,0x9e9c82,null,o);
        art(salt,side*(w*.5+.002),-.356,0,d*.97,.40,0,side*Math.PI/2,0,o);
      }
      const dividers=Math.max(1,Math.ceil(d/3.6));
      for(let i=1;i<dividers;i++)box(0,-.0015,-d*.5+d*i/dividers,w-.06,.002,.011,rubber,0x4c594f,null,o);
      if(w>2.25){
        const channel=w*.5-.45;
        box(channel,-.0045,0,.178,.008,d-.06,rubber,0x3b4743,null,o);
        for(let n=0;n<Math.floor(d/.128);n++)box(channel,-.0015,-d*.5+.065+n*.128,.168,.004,.025,alloy,0x697366,null,o);
      }
      const n=Math.max(1,Math.floor(d/3.3));
      for(let i=0;i<n;i++){
        const z=(i+.43)*d/n-d*.5,x=-w*.11+(i%2)*w*.26;
        reflection(x,.0005,z,Math.min(w*.65,1.7),Math.min(1.46,d*.39),.23*Math.sin(i+f.z),o);
      }
      for(const s of [-1,1]){
        for(const u of [-1,1]){rivet(s*(w*.5-.18),-.006,u*(d*.5-.17),.023,0,bolt,o);}
      }
    }
    function galleryDeck(f,o){
      const w=f.w,d=f.d,band=Math.min(.13,w*.15);
      for(const x of [-(w-band)*.5,(w-band)*.5]){
        box(x,-.109,0,band,.214,d,painted,rail,null,o);
        box(x,-.016,0,band+.033,.029,d,alloy,0x9a9d85,null,o);
      }
      const plate=(f.kind+'').toLowerCase().includes('plate')||w>4.7;
      const n=Math.max(1,Math.ceil(d/2.14)),span=d/n;
      for(let panel=0;panel<n;panel++){
        const z=-d*.5+span*(panel+.5);
        for(const dz of [-1,1])box(0,-.048,z+dz*(span*.5-.026),w-band,.089,.052,alloy,ironColor(panel),null,o);
        if(plate&&panel%2===0){
          box(0,-.033,z,w-2*band,.062,span-.095,painted,0x68766c,null,o);
          for(let j=-1;j<=1;j++)box(j*w*.21,-.002,z,.019,.005,span-.19,alloy,0x889385,null,o);
          reflection(-w*.10,.001,z,Math.min(w*.71,1.48),span*.55,.05,o);
        }else{
          // Open to the sea between the real load bars; the thin transverse rods sit below the walking face.
          const count=Math.max(2,Math.round(w/.114)),dx=(w-2*band)/count;
          for(let i=0;i<count;i++)box(-w*.5+band+(i+.5)*dx,-.027,z,.025,.053,span-.06,alloy,((i+panel)%7?0x828e82:0x999b87),null,o);
          const cross=Math.max(1,Math.round(span/.187));
          for(let i=0;i<cross;i++)box(0,-.055,z-span*.5+(i+.5)*span/cross,w-2*band,.022,.018,painted,0x626e65,null,o);
        }
        for(const s of [-1,1])rivet(s*(w*.5-.07),0,z+.05,.019,0,bolt,o);
      }
      for(const x of [-w*.27,w*.27])box(x,-.211,0,.091,.18,d,painted,dark,null,o);
    }
    function ironColor(i){return i%3?0x66776f:0x7e8373;}
    function floatingDeck(f,o){
      const w=f.w,d=f.d;
      box(0,-.224,0,w-.02,.32,d-.04,painted,0x556b64,null,o);
      for(const s of [-1,1]){
        part(sphere,painted,0x475b58,[s*w*.291,-.57,0],[w*.21,.51,d*.47],null,o);
        box(s*(w*.5-.043),-.09,0,.077,.155,d,alloy,rail,null,o);
        for(const sign of [-1,1]){
          ring(s*(w*.5+.035),-.285,sign*d*.273,.235,.083,rubber,0x293635,[0,Math.PI/2,0],o);
          box(s*w*.46,-.16,sign*d*.273,.108,.19,.14,alloy,rust,null,o);
        }
      }
      const planks=Math.max(4,Math.round(d/.185)),space=d/planks;
      for(let i=0;i<planks;i++){
        const z=-d*.5+(i+.5)*space;colorPlank(i,z);
      }
      function colorPlank(i,z){
        box(0,-.039,z,w-.14,.075,space-.009,timber,([0x9a8669,0x9d8f70,0x83775d,0x8d8268])[i%4],null,o);
        for(const s of [-1,1])rivet(s*(w*.5-.17),-.003,z,.014,0,0x807961,o);
      }
      art(floatMark,0,-.25,d*.5-.012,Math.min(1.05,w*.70),.32,0,0,0,o);
      reflection(-w*.12,.002,0,.62*w,.31*d,-.1,o);
    }
    // Supports and rails are part of their parent slabs. Rail fragments only occur on the outside edge away from stations.
    const stationZ=[1.4,-1.2,-3.8,-11.2,-12.55,-15.4,-17.85,-22.2,-24.5,-26.7,-28.9];
    const west=[];
    for(const f of world.floors){
      const o={f,parts:[],x:null,y:null,z:null,active:null};floors.push(o);
      const isFloat=f.kind==='cableFloat',upper=!isFloat&&(f.x>1.2||f.y>1.75);
      if(isFloat){floatingDeck(f,o);continue;}
      if(upper)galleryDeck(f,o);else {concreteDeck(f,o);if(f.x<0)west.push(f);}
      const w=f.w,d=f.d,side=upper?1:-1,outer=side*(w*.5-.095),sections=Math.max(1,Math.ceil(d/5.50));
      for(let k=0;k<sections;k++){
        const z=-d*.5+(k+.5)*d/sections,pierH=Math.max(2.1,f.y+3.80),radius=upper?.126:.196;
        for(const s of [-1,1]){
          const px=s*w*.34;
          cylinder(px,-pierH*.5-.22,z,radius,pierH,upper?painted:edge,upper?0x586e69:0xffffff,null,o);
          if(upper){
            box(px,-.35,z,.36,.19,.34,painted,rail,null,o);
            cylinder(px,-pierH*.67,z,.163,.11,alloy,old,null,o);
          }else{
            box(px,-.74,z,.70,.32,.64,edge,0xffffff,null,o);
            cylinder(px,-1.17,z,.219,.15,alloy,0x56655a,null,o);
          }
        }
        box(0,-(upper?.36:.71),z,w*.97,upper?.208:.27,.31,upper?painted:edge,upper?dark:0xffffff,null,o);
        if(upper){
          spar([-w*.34,-pierH*.63,z],[w*.33,-.45,z],.060,.082,painted,rail,o);
          spar([w*.34,-pierH*.64,z],[-w*.33,-.45,z],.062,.080,painted,old,o);
        }else{
          if(d>1.85){
            const xx=-w*.5-.045;
            box(xx,-.37,z,.115,.56,.26,timber,0x696350,null,o);
            ring(xx-.076,-.42,z,.211,.078,rubber,0x2d3937,[0,Math.PI/2,.16],o);
            rivet(xx-.134,-.22,z,.028,2,brassTint(),o);
          }
        }
        // Rails sit along the seaward side only and break around the return pots, hoist and projection station.
        const gap=stationZ.some(zz=>Math.abs(f.z+z-zz)<1.65);
        const length=Math.min(1.62,d/sections-.55);
        if(!gap&&length>.55){
          for(const s of [-1,1]){
            const zz=z+s*length*.5,h=upper?.72:.42;
            box(outer,.015,zz,.16,.031,.18,alloy,ironColor(k),null,o);
            spar([outer,0,zz],[outer,h,zz],.024,.024,painted,rail,o,true);
          }
          spar([outer,upper?.72:.42,z-length*.5],[outer,upper?.72:.42,z+length*.5],.024,.024,alloy,old,o,true);
          if(upper)spar([outer,.35,z-length*.5],[outer,.35,z+length*.5],.014,.014,painted,dark,o,true);
        }
      }
      if(upper&&d>2.30){
        const u=Math.max(-w*.14,-.62);
        art(stencil,u,.005,d*.30,Math.min(.85,.46*w),.33,-Math.PI/2,0,0,o);
        art(chevrons,0,-.096,d*.5+.003,w*.51,.077,0,0,0,o);
      }else if(!upper&&d>2.65){
        for(const s of [-1,1])art(chevrons,s*(w*.5-.21),-.001,-d*.32,.16,.58,-Math.PI/2,0,Math.PI/2,o);
      }
    }
    function brassTint(){return 0x98907b;}
    // The pre-war crane is an open portal: only the two end bents carry loads between 1.38 and 4.45 m.
    // The entire inspection fan passes between the front and rear bents.
    const centerZ=-24.90,bents=[-21.57,-28.42];
    for(const zz of bents){
      for(const sx of [-1,1]){
        const x=sx*.60;
        box(x,-1.81,zz,.46,4.70,.51,edge);
        box(x,.68,zz,.49,.28,.54,concrete);
        box(x,.849,zz,.50,.065,.55,alloy,dark);
        for(const ex of [-.17,.17])for(const ez of [-.20,.20])rivet(x+ex,.885,zz+ez,.030);
        box(x,2.73,zz,.144,3.74,.174,painted,0x7c806a);
        for(const a of [-1,1])box(x,2.73,zz+a*.099,.225,3.74,.043,painted,0x64736a);
        for(const y of [1.11,1.37,1.78,2.23,2.67,3.12,3.56,4.0,4.39])rivet(x,y,zz+.132,.023,1,0xa19175);
        box(x,4.57,zz,.47,.23,.44,painted,0x55655d);
      }
      for(const y of [1.12,2.53,4.14])box(0,y,zz,1.22,.083,.114,painted,old);
      for(const sx of [-1,1]){
        spar([-.59,1.16,zz+sx*.10],[.59,2.51,zz+sx*.10],.045,.051,alloy,old);
        spar([.59,1.16,zz+sx*.10],[-.59,2.51,zz+sx*.10],.045,.051,alloy,rail);
        spar([-.59,2.59,zz+sx*.10],[.59,4.12,zz+sx*.10],.045,.051,alloy,rail);
        spar([.59,2.59,zz+sx*.10],[-.59,4.12,zz+sx*.10],.045,.051,alloy,old);
      }
    }
    for(const x of [-.655,.655]){
      box(x,4.74,centerZ,.145,.384,7.52,painted,rail);
      for(const y of [4.565,4.91])box(x,y,centerZ,.236,.061,7.55,alloy,old);
      for(let i=0;i<11;i++){
        const z=-28.44+i*.681;
        box(x,4.76,z,.183,.31,.039,painted,rail);
        for(const y of [4.65,4.85])rivet(x+Math.sign(x)*.096,y,z,.018,2,bolt);
      }
    }
    for(let j=0;j<12;j++)box(0,4.94,-28.37+j*.638,1.42,.10,.085,painted,rail);
    // Four tapering tower legs, three faces of triangulation visible from either walkway.
    const stages=[{y:5.0,r:.69},{y:6.56,r:.65},{y:8.15,r:.54},{y:9.68,r:.45},{y:10.96,r:.36}];
    function corner(stage,n){return [(n===0||n===3?-1:1)*stage.r,stage.y,centerZ+(n<2?1:-1)*stage.r];}
    for(let j=0;j<stages.length;j++){
      const a=stages[j],b=stages[j+1];
      for(let face=0;face<4;face++){
        const va=corner(a,face),vb=corner(a,(face+1)%4);
        spar(va,vb,.110,.105,painted,j%2?rail:old);
        if(b){
          const vc=corner(b,face),vd=corner(b,(face+1)%4);
          spar(va,vc,.117,.123,painted,j%2?0x858571:0x8b896e);
          spar(va,vd,.048,.040,alloy,j%2?old:rail);spar(vb,vc,.041,.045,painted,rail);
          const x=(va[0]+vd[0])*.5,y=(a.y+b.y)*.5,z=(va[2]+vd[2])*.5;
          box(x,y,z,face%2?.045:.168,.158,face%2?.168:.045,alloy,0x7e806b);
          if(face===0)rivet(x,y,z+.028,.025,1);
        }
      }
    }
    // Old gussets include literal holes. The dark sea and late sky read through them at walking distance.
    const profile=new T.Shape();profile.moveTo(-.5,-.255);profile.lineTo(.5,-.255);profile.lineTo(.5,.255);profile.lineTo(-.5,.255);profile.closePath();
    for(const x of [-.333,0,.333]){const h=new T.Path();h.absarc(x,0,.111,0,TAU,true);profile.holes.push(h);}
    const pierced=geo('perforated splice',()=>new T.ExtrudeGeometry(profile,{depth:.045,curveSegments:12,bevelEnabled:false}));
    for(const y of [5.0,6.56,8.15,9.68]){
      const s=stages.find(k=>k.y===y);
      part(pierced,painted,0x88917b,[0,y+.13,centerZ+s.r+.044],[s.r*1.62,.70,.6],null);
    }
    // Crane house and protected walkway sit well above the three optical paths.
    box(.34,5.40,centerZ+.39,.91,.81,1.44,painted,0x748276);
    for(const s of [-1,1])box(.34+s*.432,5.87,centerZ+.39,.052,.30,1.41,painted,old);
    box(.34,5.85,centerZ+1.082,.83,.31,.039,alloy,0x465956);
    box(.34,5.87,centerZ+1.104,.69,.212,.023,alloy,0x536965);
    for(const x of [.159,.51])box(x,5.86,centerZ+1.12,.026,.241,.024,painted,old);
    box(.34,6.045,centerZ+.39,1.07,.106,1.54,painted,dark);
    box(0,5.19,-21.6,1.67,.405,.071,painted,dark);art(name,0,5.197,-21.556,1.61,.35);
    for(const s of [-1,1])rivet(s*.73,5.19,-21.54,.022,1);
    box(0,4.98,-21.56,1.72,.049,.104,alloy,brassTint());
    art(cranePlate,0,5.34,centerZ+.713,.75,.205);
    cylinder(0,10.99,centerZ,.516,.197,painted,dark);cylinder(0,11.12,centerZ,.51,.070,alloy,old);
    for(let i=0;i<12;i++){const a=i*TAU/12;rivet(.43*Math.sin(a),11.166,centerZ+.43*Math.cos(a),.028);}
    // The triangulated triangular jib is rigid steel, with no rope or working cable in this asset.
    function jib(start,end,divisions,radius,finalRadius){
      const a=new T.Vector3(...start),b=new T.Vector3(...end),dir=b.clone().sub(a).normalize();
      const side=dir.clone().cross(up).normalize(),rise=side.clone().cross(dir).normalize();
      let prev;
      for(let i=0;i<=divisions;i++){
        const t=i/divisions,r=T.MathUtils.lerp(radius,finalRadius,t),c=a.clone().lerp(b,t);
        const tri=[c.clone().addScaledVector(side,-r),c.clone().addScaledVector(side,r),c.clone().addScaledVector(rise,r*1.18)].map(v=>v.toArray());
        for(let n=0;n<3;n++){
          spar(tri[n],tri[(n+1)%3],.068,.061,alloy,rail);
          if(prev){
            spar(prev[n],tri[n],.107,.105,painted,n===2?0x8d9178:0x7c887b);
            const k=i%2?(n+1)%3:(n+2)%3;spar(prev[n],tri[k],.043,.050,painted,n%2?rail:old);
          }
        }
        prev=tri;
      }
    }
    jib([0,11.23,centerZ],[-7.63,15.49,-29.28],9,.54,.122);
    jib([0,11.23,centerZ],[2.91,11.22,-23.0],4,.487,.423);
    box(2.93,10.81,-23.02,1.06,.56,1.15,edge);
    for(let i=0;i<3;i++)box(2.93,10.79,-23.46+i*.41,1.09,.59,.051,painted,dark);
    cylinder(-7.625,15.46,-29.27,.189,.14,alloy,old,[0,0,Math.PI/2]);ring(-7.55,15.46,-29.27,.16,.028,painted,rail,[0,Math.PI/2,0]);
    // Failed original timber dolphin piles outside the west wharf. Splintered tips and shell growth make the waterline readable.
    const piles=[];
    const foamTex=texture(128,128,(c,w,h)=>{
      const im=c.createImageData(w,h);
      for(let y=0;y<h;y++)for(let x=0;x<w;x++){
        const u=(x+.5)/w*2-1,v=(y+.5)/h*2-1,a=Math.atan2(v,u),r=Math.sqrt(u*u+v*v),i=(y*w+x)*4;
        const r0=.73+.08*Math.sin(a*6+.5)+.035*Math.sin(a*13),dist=Math.abs(r-r0);
        im.data[i]=183;im.data[i+1]=195;im.data[i+2]=182;im.data[i+3]=Math.round(Math.max(0,1-dist/.10)*Math.max(0,Math.sin(3*a+1)+.43)*(.20+rnd()*.57)*134);
      }c.putImageData(im,0,0);
    });
    const foam=keep(new T.MeshBasicMaterial({map:foamTex,transparent:true,opacity:.49,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2}));
    const saltGrowth=mat(0xffffff,.93,.025);
    function westEdgeAt(z){
      let outer=-5.0;
      for(const f of west)if(Math.abs(f.z-z)<f.d*.5+.66)outer=Math.min(outer,f.x-f.w*.5);
      return outer;
    }
    for(const [i,z] of [3.32,-.63,-5.71,-8.97,-11.71,-14.07,-16.64,-19.73,-21.79,-25.43,-28.44,-30.81].entries()){
      const x=westEdgeAt(z)-.59-.41*rnd(),top=.39+Math.sin(i*1.59)*.44,tilt=.075*Math.sin(i*1.17),r=.158+.045*rnd();
      spar([x-.17,-3.70,z],[x,top-.09,z+tilt],r,r,timber,i%3?0x736b54:0x697161,null,true);
      for(let j=0;j<5;j++){
        const a=j*TAU/5+.3,b=.04+rnd()*.18;
        const xx=x+.086*Math.cos(a),zz=z+tilt+.086*Math.sin(a);
        spar([xx,top-.21,zz],[xx+.05*Math.cos(a),top+b,zz+.045*Math.sin(a)],.043,.033,timber,0x9c926e);
      }
      for(const h of [-.52,-.31])ring(x-.01,h,z+tilt*.60,r+.017,.022,alloy,0x706d58,[Math.PI/2,0,0]);
      for(let j=0;j<12;j++){
        const a=rnd()*TAU,rr=r*.93;
        part(sphere,saltGrowth,j%4?0xa29c7f:0x737f68,[x+rr*Math.cos(a),-.81+rnd()*.37,z+rr*Math.sin(a)],[.025+rnd()*.020,.024+rnd()*.045,.033],null);
      }
      if(i%2===0){
        const fo=new T.Mesh(flat,foam);fo.rotation.x=-Math.PI/2;fo.position.set(x,-.84,z);fo.scale.set(1.26,1.09,1);fo.renderOrder=1;root.add(fo);piles.push(fo);
      }
    }
    // Caged, shielded lamps on the crane, their cones aimed at the wet harbour rather than the players.
    const burner=mat(0xf4c384,.41,.17,{emissive:0xf8a252,emissiveIntensity:2.70});
    const glowTex=texture(136,136,(c,w,h)=>{
      const r=w/2,g=c.createRadialGradient(r,r,0,r,r,r);g.addColorStop(0,'rgba(255,226,167,1)');g.addColorStop(.11,'rgba(255,188,99,.72)');g.addColorStop(.34,'rgba(235,134,60,.22)');g.addColorStop(.76,'rgba(213,109,45,.052)');g.addColorStop(1,'rgba(204,105,46,0)');c.fillStyle=g;c.fillRect(0,0,w,h);
    });
    const glaze=keep(new T.MeshBasicMaterial({map:glowTex,transparent:true,opacity:.52,blending:T.AdditiveBlending,depthWrite:false}));
    function shade(x,y,z,dir){
      box(x,y+.111,z,.265,.044,.242,painted,dark);
      part(sphere,burner,0xffffff,[x,y-.017,z],[.083,.146,.085],null);
      for(const dx of [-.071,.071])spar([x+dx,y+.093,z+dir*.065],[x+dx,y-.143,z+dir*.065],.009,.009,alloy,old,null,true);
      for(const yy of [y-.106,y-.027,y+.047])spar([x-.09,yy,z+dir*.074],[x+.09,yy,z+dir*.074],.008,.008,alloy,old,null,true);
      part(flat,glaze,0xffffff,[x,y,z+dir*.103],[.86,.89,1],[0,dir<0?Math.PI:0,0]);
    }
    shade(-.60,5.25,-21.37,1);shade(.64,5.42,-28.63,-1);
    const warm=new T.PointLight(0xffae68,12.45,8.0,2);warm.position.set(-.66,4.95,-21.14);root.add(warm);
    // One static transform per primitive, with a reverse index for the often-moving float.
    function matrixFor(b,i){
      const o=b.owner[i];if(!o)return b.t[i];const f=o.f;
      base.makeTranslation(f.x,(f.active===false?-10000:f.y),f.z);
      return tmp.multiplyMatrices(base,b.t[i]);
    }
    for(const b of groups.values()){
      const o=keep(new T.InstancedMesh(b.g,b.m,b.t.length));b.mesh=o;
      for(let i=0;i<b.t.length;i++){o.setMatrixAt(i,matrixFor(b,i));o.setColorAt(i,new T.Color(b.c[i]));}
      o.castShadow=b.m!==graphic&&b.m!==glaze&&b.m!==wet&&b.m!==burner;o.receiveShadow=true;
      o.computeBoundingSphere();o.frustumCulled=!b.movable;root.add(o);
    }
    for(const o of floors){o.x=o.f.x;o.y=o.f.y;o.z=o.f.z;o.active=o.f.active;}
    const dirty=new Set();
    return {update(t=0,water=-.85){
      if(disposed)return;
      const time=Number.isFinite(t)?t:0,level=Number.isFinite(water)?water:-.85;
      dirty.clear();
      for(const o of floors){
        const f=o.f;
        if(o.x===f.x&&o.y===f.y&&o.z===f.z&&o.active===f.active)continue;
        for(const [b,i] of o.parts){b.mesh.setMatrixAt(i,matrixFor(b,i));dirty.add(b);}
        o.x=f.x;o.y=f.y;o.z=f.z;o.active=f.active;
      }
      for(const b of dirty)b.mesh.instanceMatrix.needsUpdate=true;
      if(concrete.userData.waterline)concrete.userData.waterline.value=level+.09;
      if(edge.userData.waterline)edge.userData.waterline.value=level+.16;
      for(let i=0;i<piles.length;i++){const p=piles[i],a=time*1.27+i*.93;p.position.y=level+.025+.014*Math.sin(a);p.scale.x=1.28+.19*Math.sin(a);p.scale.y=1.11+.15*Math.sin(a-.44);}
      warm.intensity=12.1+.33*Math.sin(time*2.37+.42)+.11*Math.sin(time*5.32);
    },dispose(){
      if(disposed)return;disposed=true;root.removeFromParent();for(const r of owned)r.dispose();root.clear();owned.clear();dirty.clear();
    }};
  }
  return {create};
})();
