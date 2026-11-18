// Original North Cape survey pumping chamber. All maps are generated locally, with no asset or network dependencies.
const TideCisternEnv=(()=>{
  'use strict';
  function create(parent){
    const T=THREE,root=new T.Group();root.name='北岬 · 水线以下的航测泵房';parent.add(root);
    const owned=new Set(),keep=x=>(owned.add(x),x),geos=new Map(),layers=new Map(),waterLevel={value:.58};
    const TAU=Math.PI*2,unitY=new T.Vector3(0,1,0),v=(x,y,z)=>new T.Vector3(x,y,z);
    const baked=new T.Matrix4(),q=new T.Quaternion(),eu=new T.Euler(),normalMat=new T.Matrix3(),p0=v(0,0,0),n0=v(0,0,0),tint=new T.Color();
    const legacy=Number(T.REVISION)<155;
    let state=4163079,disposed=false;
    function rnd(){state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;}
    function canvas(w,h,fn){const o=document.createElement('canvas');o.width=w;o.height=h;fn(o.getContext('2d'),w,h);return o;}
    function tex(c,srgb=true,repeat=true){
      const t=keep(new T.CanvasTexture(c));if(srgb){if(T.SRGBColorSpace)t.colorSpace=T.SRGBColorSpace;else t.encoding=T.sRGBEncoding;}
      if(repeat)t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=6;return t;
    }
    function geometry(id,make){if(!geos.has(id))geos.set(id,keep(make()));return geos.get(id);}
    const cube=geometry('box',()=>new T.BoxGeometry(1,1,1)),tube=geometry('cylinder',()=>new T.CylinderGeometry(1,1,1,16)),hex=geometry('nut',()=>new T.CylinderGeometry(1,1,1,6));
    const sphere=geometry('sphere',()=>new T.SphereGeometry(1,18,12)),plane=geometry('plane',()=>new T.PlaneGeometry(1,1));
    // Tileable hand-built fields feed all the original PBR color and relief maps.
    const values=Array.from({length:4096},rnd);
    function noise(x,y,period){
      const xx=Math.floor(x),yy=Math.floor(y),fx=x-xx,fy=y-yy;
      const a=fx*fx*(3-2*fx),b=fy*fy*(3-2*fy);
      const at=(i,j)=>values[((j%period+period)%period*51+(i%period+period)%period*103)%4096];
      return (at(xx,yy)*(1-a)+at(xx+1,yy)*a)*(1-b)+(at(xx,yy+1)*(1-a)+at(xx+1,yy+1)*a)*b;
    }
    function masonryMaps(kind){
      const W=512,H=512,col=canvas(W,H,()=>{}),relief=canvas(W,H,()=>{}),ctx=col.getContext('2d'),br=relief.getContext('2d');
      const im=ctx.createImageData(W,H),bp=br.createImageData(W,H);
      for(let y=0;y<H;y++)for(let x=0;x<W;x++){
        const k=(y*W+x)*4,u=x/W,vv=y/H,grain=rnd(),n=noise(u*8,vv*8,8),large=noise(u*4,vv*4,4),fine=noise(u*32,vv*32,32);
        let R,G,B,ht;
        if(kind==='brick'){
          const cols=6,rows=12,cy=Math.floor(vv*rows),bx=u*cols+(cy%2)*.5,cx=Math.floor(bx),gx=bx-cx,gy=vv*rows-cy;
          const dist=Math.min(gx,1-gx,(gy<.5?gy:1-gy)*.46),rough=.006*(fine-.5);
          const mortar=Math.max(0,Math.min(1,(.028+rough-dist)*67)),wear=Math.max(0,Math.min(1,(dist-.016)*38));
          const hue=values[(cy*41+(cx+cols)%cols*97)%4096],stain=(n-.5)*17+(large-.5)*16+(grain-.48)*16;
          const lime=Math.max(0,(noise(u*16+3,vv*16,16)-.55)*1.9);
          R=119+hue*32+stain+lime*19;G=108+hue*25+stain+lime*22;B=91+hue*23+stain+lime*22;
          R=R*(1-mortar)+(149+stain*.63)*mortar;G=G*(1-mortar)+(150+stain*.63)*mortar;B=B*(1-mortar)+(131+stain*.65)*mortar;
          ht=67+wear*118+(grain-.5)*22+fine*20;
        }else if(kind==='stone'){
          const cloudy=(large-.45)*35+(n-.5)*25+(fine-.5)*15+(grain-.5)*22,chip=grain>.982?-32:grain<.017?22:0;
          R=146+cloudy+chip;G=147+cloudy+chip;B=132+cloudy+chip;ht=141+(fine-.5)*38+(grain-.5)*46+chip;
        }else{
          const chip=Math.max(0,Math.min(1,(n*.50+fine*.25+large*.25-.568)*8.0)),dust=(grain-.5)*24+(n-.5)*17;
          R=171+dust+chip*7;G=180+dust-chip*32;B=170+dust-chip*45;ht=157+(grain-.5)*26+fine*20-chip*49;
        }
        im.data[k]=R;im.data[k+1]=G;im.data[k+2]=B;im.data[k+3]=255;
        bp.data[k]=bp.data[k+1]=bp.data[k+2]=ht;bp.data[k+3]=255;
      }
      ctx.putImageData(im,0,0);br.putImageData(bp,0,0);
      if(kind==='stone'||kind==='metal')for(let i=0;i<(kind==='stone'?36:81);i++){
        const x=rnd()*W,y=rnd()*H;ctx.strokeStyle=kind==='stone'?'rgba(81,86,70,.24)':'rgba(104,82,61,.32)';ctx.lineWidth=.35+rnd()*.82;
        ctx.beginPath();ctx.moveTo(x,y);let xx=x,yy=y;for(let k=0;k<4;k++){xx+=rnd()*8+2;yy+=rnd()*8-3;ctx.lineTo(xx,yy);}ctx.stroke();
      }
      return [tex(col),tex(relief,false)];
    }
    const bricks=masonryMaps('brick'),stone=masonryMaps('stone'),scrape=masonryMaps('metal');
    function surface(rough,metal,options={},scale=null,wet=false){
      const m=keep(new T.MeshStandardMaterial({color:0xffffff,roughness:rough,metalness:metal,vertexColors:true,...options}));m.userData.uvMeters=scale;
      if(wet){
        m.onBeforeCompile=s=>{
          s.uniforms.cisternWaterY=waterLevel;
          s.vertexShader=s.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 cisternLocal;').replace('#include <begin_vertex>','#include <begin_vertex>\ncisternLocal=position;');
          s.fragmentShader=s.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 cisternLocal; uniform float cisternWaterY;')
            .replace('#include <color_fragment>',`#include <color_fragment>
              float saltVariation=.05*sin(.84*cisternLocal.x+1.31*cisternLocal.z)+.024*sin(4.37*cisternLocal.x+3.61*cisternLocal.z);
              float damp=1.-smoothstep(cisternWaterY-.11,cisternWaterY+.29+saltVariation,cisternLocal.y);
              float oldTide=1.-smoothstep(.65+saltVariation,1.46+saltVariation,cisternLocal.y);
              diffuseColor.rgb*=mix(vec3(1.),vec3(.76,.87,.78),oldTide)*mix(vec3(1.),vec3(.48,.65,.60),damp);`)
            .replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\nroughnessFactor=clamp(roughnessFactor-.28*damp,.24,.97);');
        };
        m.customProgramCacheKey=()=>'cisternLocalWet';
      }return m;
    }
    const brick=surface(.81,.034,{map:bricks[0],bumpMap:bricks[1],bumpScale:.018},[2.05,1.58],true);
    const ashlar=surface(.78,.043,{map:stone[0],bumpMap:stone[1],bumpScale:.020},[1.61,1.61],true);
    const cured=surface(.68,.28,{map:scrape[0],bumpMap:scrape[1],bumpScale:.012},[1.13,1.13],true);
    const iron=surface(.42,.63,{map:scrape[0],bumpMap:scrape[1],bumpScale:.006},[.81,.81],true);
    const dark=surface(.82,.07),darkMetal=surface(.62,.40);
    const teal=0x71867e,blue=0x657c7f,zinc=0x9ba799,brass=0xa99875,rust=0x997355;
    // Metric UVs are baked after transforms. Static parts using the same material share a draw call.
    function emit(g,m,c,position,scale,rotation=null){
      let b=layers.get(m);if(!b){b={p:[],n:[],uv:[],co:[],index:[]};layers.set(m,b);}
      if(Array.isArray(rotation))q.setFromEuler(eu.set(...rotation));else if(rotation)q.copy(rotation);else q.identity();
      baked.compose(v(...position),q,v(...scale));normalMat.getNormalMatrix(baked);tint.set(c);
      const p=g.attributes.position,n=g.attributes.normal,uv=g.attributes.uv,start=b.p.length/3,meters=m.userData.uvMeters;
      for(let i=0;i<p.count;i++){
        p0.fromBufferAttribute(p,i).applyMatrix4(baked);n0.fromBufferAttribute(n,i).applyMatrix3(normalMat).normalize();
        b.p.push(p0.x,p0.y,p0.z);b.n.push(n0.x,n0.y,n0.z);b.co.push(tint.r,tint.g,tint.b);
        if(meters){
          let a,d;if(Math.abs(n0.y)>.74){a=p0.x;d=-p0.z;}else if(Math.abs(n0.x)>Math.abs(n0.z)){a=n0.x>0?-p0.z:p0.z;d=p0.y;}else{a=n0.z>0?p0.x:-p0.x;d=p0.y;}b.uv.push(a/meters[0],d/meters[1]);
        }else b.uv.push(uv?uv.getX(i):0,uv?uv.getY(i):0);
      }
      if(g.index){for(let i=0;i<g.index.count;i++)b.index.push(start+g.index.getX(i));}
      else {for(let i=0;i<p.count;i++)b.index.push(start+i);}
    }
    const box=(x,y,z,w,h,d,m,c,r)=>emit(cube,m,c,[x,y,z],[w,h,d],r);
    const cylinder=(x,y,z,r,h,m,c,rot=null)=>emit(tube,m,c,[x,y,z],[r,h,r],rot);
    const bolt=(x,y,z,r,axis,c=brass)=>emit(hex,iron,c,[x,y,z],[r,r*.69,r],axis==='x'?[0,0,Math.PI/2]:axis==='z'?[Math.PI/2,0,0]:null);
    function rod(a,b,w,d,m,c,round=false){
      const p=v(...a),e=v(...b),delta=e.clone().sub(p),L=delta.length();
      if(L>.0001)emit(round?tube:cube,m,c,p.lerp(e,.5).toArray(),[w,L,d],new T.Quaternion().setFromUnitVectors(unitY,delta.divideScalar(L)));
    }
    function ring(x,y,z,r,wire,m,c,rotation=null){const key='ring'+Math.round(wire/r*1000);emit(geometry(key,()=>new T.TorusGeometry(1,wire/r,8,40)),m,c,[x,y,z],[r,r,r],rotation);}
    function raw(p,n,idx,uv){const g=keep(new T.BufferGeometry());g.setAttribute('position',new T.Float32BufferAttribute(p,3));if(n)g.setAttribute('normal',new T.Float32BufferAttribute(n,3));if(uv)g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);if(!n)g.computeVertexNormals();return g;}
    function mesh(g,m){const o=new T.Mesh(g,m);o.castShadow=true;o.receiveShadow=true;root.add(o);return o;}
    // Lime-rich casting at the bottom of the basin with a full uninterrupted floor at -1.15.
    box(0,-1.362,.04,13.04,.424,16.88,ashlar,0xa5b2a8);
    for(const x of [-4.78,-2.37,.04,2.43,4.83])box(x,-1.148,0,.014,.003,16.39,dark,0x657267);
    for(const z of [-6.24,-3.93,-1.62,.69,3.0,5.31,7.62])box(0,-1.148,z,12.63,.003,.012,dark,0x657267);
    // Walls are actual extruded masonry, not textures painted to look like windows.
    const spring=3.66,sill=2.37,radius=1.20,sides=[-5.47,-.03,5.40],north=-8.30;
    function arcHole(a,y0,y1,w,h){
      const path=new T.Path();path.moveTo(a-w,y0);path.lineTo(a+w,y0);path.lineTo(a+w,y1);
      for(let k=1;k<=36;k++){const rad=k*Math.PI/36;path.lineTo(a+w*Math.cos(rad),y1+h*Math.sin(rad));}
      path.lineTo(a-w,y0);return path;
    }
    function wallForm(w,holes){
      const s=new T.Shape();s.moveTo(-w*.5,-1.28);s.lineTo(w*.5,-1.28);s.lineTo(w*.5,5.91);s.lineTo(-w*.5,5.91);s.closePath();
      for(const h of holes)s.holes.push(arcHole(...h));return keep(new T.ExtrudeGeometry(s,{depth:.384,bevelEnabled:false,curveSegments:24}));
    }
    const sideForm=wallForm(16.62,sides.map(z=>[z,sill,spring,radius,1.19]));
    for(const side of [-1,1]){
      emit(sideForm,brick,side<0?0xb9c7b5:0xc8c5ad,[side<0?-6.397:6.781,0,0],[1,1,1],[0,-Math.PI/2,0]);
      box(side*6.29,-.298,0,.187,1.71,16.60,ashlar,0x9caaa0);
      box(side*6.29,.584,0,.241,.097,16.65,ashlar,0xc1c3a8);
    }
    const ax=.60,ar=1.79,as=3.55,ah=1.05,ab=2.30;
    emit(wallForm(13.03,[[ax,ab,as,ar,ah]]),brick,0xbbc4b0,[0,0,-8.684],[1,1,1],null);
    box(0,-.298,-8.191,12.87,1.71,.210,ashlar,0x97a69b);
    box(0,.585,-8.190,12.88,.100,.236,ashlar,0xbec2ac);
    // Recessed slab bands and genuine tie pockets. No pipework, devices or walkways occupy the room.
    for(const side of [-1,1]){
      for(const z of [-7.65,-4.05,-2.71,.92,2.74,6.41,7.84]){
        box(side*6.18,-.22,z,.016,1.51,.011,dark,0x5b6a5f);
        for(const h of [-.70,-.14,.38])cylinder(side*6.191,h,z+.30,.021,.014,darkMetal,0x5b6860,[0,0,Math.PI/2]);
      }
    }
    for(const x of [-6.15,-3.52,-.99,1.36,3.68,6.05])box(x,-.22,-8.081,.012,1.52,.017,dark,0x5b6a5f);
    function segment(w,h,t,a,b){
      const g=new T.Shape();g.moveTo(w*Math.cos(a),h*Math.sin(a));
      const mid=(a+b)/2;g.lineTo(w*Math.cos(mid),h*Math.sin(mid));g.lineTo(w*Math.cos(b),h*Math.sin(b));
      g.lineTo((w+t)*Math.cos(b),(h+t)*Math.sin(b));g.lineTo((w+t)*Math.cos(mid),(h+t)*Math.sin(mid));g.lineTo((w+t)*Math.cos(a),(h+t)*Math.sin(a));g.closePath();
      return keep(new T.ExtrudeGeometry(g,{depth:.215,bevelEnabled:false}));
    }
    function archTrim(w,h,n,key){
      return Array.from({length:n},(_,i)=>segment(w,h,i===(n-1)/2?.27:.188,i*Math.PI/n+.006,(i+1)*Math.PI/n-.006));
    }
    const vault=archTrim(radius,1.19,17),archiveVault=archTrim(ar,ah,21);
    const rain=tex(canvas(384,384,(c,w,h)=>{
      const light=c.createLinearGradient(0,0,0,h);light.addColorStop(0,'#9aafb3');light.addColorStop(.42,'#aec3c1');light.addColorStop(.73,'#77969c');light.addColorStop(1,'#586e79');c.fillStyle=light;c.fillRect(0,0,w,h);
      for(let i=0;i<1150;i++){
        const x=rnd()*w,y=rnd()*h,r=.5+Math.pow(rnd(),1.5)*2.5,l=rnd();
        c.save();c.translate(x,y);c.scale(1,1.2+.56*l);c.lineWidth=.45+1.0*l;c.strokeStyle='rgba(219,239,229,'+(.11+.43*l)+')';c.beginPath();c.arc(0,0,r,.14,2.78);c.stroke();
        if(l>.925){c.strokeStyle='rgba(69,94,98,.21)';c.lineWidth=.5+r*.4;c.beginPath();c.moveTo(0,1);c.quadraticCurveTo(.2,12,1.5,18+rnd()*21);c.stroke();}
        c.restore();
      }
    }),true,false);
    const glass=surface(.20,.15,{map:rain,emissive:0x88b6c3,emissiveMap:rain,emissiveIntensity:.49,transparent:true,opacity:.48,side:T.DoubleSide,depthWrite:false});
    const rearGlass=surface(.30,.12,{map:rain,emissive:0xa5bcb5,emissiveMap:rain,emissiveIntensity:.27,transparent:true,opacity:.57,side:T.DoubleSide,depthWrite:false});
    function archPane(w,h,sillY,springY){
      const sh=new T.Shape();sh.moveTo(-w,0);sh.lineTo(w,0);sh.lineTo(w,springY-sillY);
      for(let i=1;i<=38;i++){const a=i*Math.PI/38;sh.lineTo(w*Math.cos(a),springY-sillY+h*Math.sin(a));}
      sh.closePath();const g=keep(new T.ShapeGeometry(sh)),pos=g.attributes.position,uv=g.attributes.uv;
      for(let j=0;j<uv.count;j++)uv.setXY(j,.5+pos.getX(j)/w*.5,pos.getY(j)/(springY-sillY+h));
      return g;
    }
    const pale=0xcdd0b8,paneSide=archPane(radius,1.19,sill,spring);
    for(const side of [-1,1])for(const z of sides){
      for(let i=0;i<vault.length;i++)emit(vault[i],ashlar,i===8?0xd8d5bc:i%3?0xc1c6b2:0xb7c1b1,[side<0?-6.235:6.449,spring,z],[1,1,1],[0,-Math.PI/2,0]);
      const xp=side*6.48;emit(paneSide,glass,0xffffff,[xp,sill,z],[1,1,1],[0,-Math.PI/2,0]);
      for(const off of [-1,1]){
        box(side*6.31,(sill+spring)*.5,z+off*(radius+.098),.221,spring-sill,.193,ashlar,pale);
        for(const y of [2.68,3.11,3.56])box(side*6.193,y,z+off*(radius+.100),.014,.012,.188,dark,0x6c7363);
        box(side*6.44,(sill+spring)*.5,z+off*(radius-.019),.113,spring-sill,.055,cured,teal);
      }
      box(side*6.251,sill-.067,z,.394,.139,2.88,ashlar,pale);
      box(side*6.23,sill-.157,z,.295,.042,2.80,ashlar,0xa4afa0);
      box(side*6.455,spring,z,.096,.051,radius*2,cured,teal);
      box(side*6.455,2.90,z,.075,.039,radius*2,cured,blue);
      for(const off of [-.62,0,.62]){
        const high=spring+1.18*Math.sqrt(1-(off/radius)**2);
        box(side*6.453,(sill+high)*.5,z+off,.081,high-sill,.042,cured,teal);
      }
      // Radial transom bars and an inner coping, including genuine voids between panes.
      for(const a of [.55,Math.PI*.5,Math.PI-.55])rod([side*6.45,spring,z],[side*6.45,spring+1.15*Math.sin(a),z+1.16*Math.cos(a)],.020,.020,iron,blue,true);
      for(let i=0;i<18;i++){
        const a=i*Math.PI/18,b=(i+1)*Math.PI/18;
        rod([side*6.44,spring+1.179*Math.sin(a),z+1.179*Math.cos(a)],[side*6.44,spring+1.179*Math.sin(b),z+1.179*Math.cos(b)],.029,.029,cured,teal,true);
      }
    }
    // A deep archive opening with a second glazed plane, reveals and the visible end grain of dry record sleeves behind it.
    const archiveZ=-9.26;
    for(let i=0;i<archiveVault.length;i++)emit(archiveVault[i],ashlar,i===10?0xded6b6:i%3?0xc7c7b2:0xb3bcac,[ax,as,-8.398],[1,1,1],null);
    for(const s of [-1,1]){
      box(ax+s*(ar+.093),(ab+as)*.5,-8.287,.19,as-ab,.31,ashlar,pale);
      box(ax+s*(ar+.012),(ab+as)*.5,-8.794,.139,as-ab,.858,ashlar,0xa2afa0);
      box(ax+s*(ar-.029),(ab+as)*.5,archiveZ,.066,as-ab,.13,cured,teal);
    }
    box(ax,ab-.083,-8.756,3.99,.167,1.51,ashlar,pale);
    box(ax,ab-.096,-8.059,4.04,.092,.161,iron,brass);
    const deepPane=archPane(ar,ah,ab,as);emit(deepPane,rearGlass,0xf0f1d9,[ax,ab,archiveZ],[1,1,1],null);
    for(const off of [-1.04,-.35,.35,1.04]){
      const h=as+ah*Math.sqrt(1-(off/ar)**2);
      box(ax+off,(ab+h)*.5,archiveZ+.067,.051,h-ab,.092,cured,teal);
    }
    box(ax,as,archiveZ+.06,2*ar,.058,.112,cured,teal);
    box(ax,2.81,archiveZ+.060,2*ar,.044,.093,cured,teal);
    box(ax,ab-.061,-9.63,4.05,.10,.74,ashlar,0xb0af97);
    for(const x of [ax-1.54,ax+1.40]){
      box(x,2.71,-9.63,.408,.684,.234,dark,0x706e56);
      for(let j=0;j<4;j++)box(x-.142+j*.089,2.726,-9.497,.065,.545,.012,dark,j%2?0xb0a483:0x958b72);
    }
    // Roof slab with two actual openings. Its underside and supporting flanges remain high above the working deck.
    const roof=new T.Shape();roof.moveTo(-6.63,-8.53);roof.lineTo(6.63,-8.53);roof.lineTo(6.63,8.42);roof.lineTo(-6.63,8.42);roof.closePath();
    const wells=[[-3.41,.03,1.57,3.61],[2.76,-4.47,1.74,2.53]];
    for(const [x,z,w,d] of wells){
      const cut=new T.Path();cut.moveTo(x-w/2,z-d/2);cut.lineTo(x-w/2,z+d/2);cut.lineTo(x+w/2,z+d/2);cut.lineTo(x+w/2,z-d/2);cut.closePath();roof.holes.push(cut);
    }
    emit(keep(new T.ExtrudeGeometry(roof,{depth:.19,bevelEnabled:false})),ashlar,0x8c9d91,[0,6.09,0],[1,1,1],[Math.PI/2,0,0]);
    for(const [x,z,w,d] of wells){
      emit(plane,glass,0xffffff,[x,6.094,z],[w,d,1],[-Math.PI/2,0,0]);
      for(const s of [-1,1]){
        box(x+s*w*.5,5.962,z,.082,.164,d+.11,cured,blue);
        box(x,5.962,z+s*d*.5,w+.15,.161,.082,cured,blue);
      }
      for(let i=1;i<4;i++)box(x,6.011,z-d*.5+d*i/4,w,.044,.036,iron,zinc);
      box(x,6.012,z,.044,.051,d,iron,blue);
    }
    for(const z of [-8.11,-2.80,2.66,8.03]){
      for(const side of [-1,1]){
        const x=side*6.269;
        box(x,2.37,z,.256,6.88,.343,ashlar,0xb4b8a2);
        box(x,.088,z,.313,2.46,.412,ashlar,0xb9c4ad);
        box(x,3.12,z,.281,.156,.401,ashlar,0xc1c5ae);
        box(x,5.43,z,.334,.638,.455,ashlar,pale);
        box(side*6.062,5.41,z,.226,.467,.373,cured,blue);
        rod([side*6.139,4.91,z],[side*5.425,5.615,z],.107,.119,cured,teal);
        for(const y of [5.30,5.54])bolt(side*5.932,y,z,.027,'x');
      }
      box(0,5.68,z,12.30,.327,.160,cured,blue);
      for(const y of [5.526,5.823])box(0,y,z,12.34,.053,.294,iron,zinc);
      for(let i=0;i<13;i++){
        const x=-5.79+i*.965;box(x,5.682,z,.042,.285,.211,cured,blue);
        for(const y of [5.602,5.749])bolt(x,y,z+.126,.021,'z',brass);
      }
    }
    for(const x of [-5.35,-1.51,1.54,5.27])box(x,5.851,.05,.097,.097,16.49,cured,teal);
    // Original transparent salt, rust and mould overlays cross the brick courses rather than being baked into their repetition.
    const salt=tex(canvas(512,160,(c,w,h)=>{
      const line=x=>41+7*Math.sin(x*.027)+3*Math.sin(x*.131+.5)+2*Math.sin(x*.288);
      for(let x=0;x<w;x++){
        const yy=line(x)+rnd()*2.2,g=c.createLinearGradient(0,yy-3,0,yy+84);
        g.addColorStop(0,'rgba(219,221,187,0)');g.addColorStop(.052,'rgba(227,224,195,'+(.27+.40*rnd())+')');
        g.addColorStop(.14,'rgba(191,195,158,.29)');g.addColorStop(.45,'rgba(78,99,70,.21)');g.addColorStop(1,'rgba(45,68,54,0)');
        c.fillStyle=g;c.fillRect(x,yy-3,1,87);
      }
      for(let i=0;i<4700;i++){const x=rnd()*w,y=line(x)+(rnd()-.28)*rnd()*43;c.fillStyle=i%4?'rgba(219,216,187,.34)':'rgba(94,118,83,.21)';c.fillRect(x,y,.5+rnd()*2.35,.35+rnd()*1.9);}
    }),true,false);
    const oxides=tex(canvas(240,256,(c,w,h)=>{
      for(let j=0;j<126;j++){
        const x=w*(.12+.76*rnd()),length=h*(.11+.88*Math.pow(rnd(),1.8)),s=1.2+rnd()*7;
        const g=c.createLinearGradient(0,0,0,length);g.addColorStop(0,'rgba(119,82,56,'+(.09+.21*rnd())+')');g.addColorStop(.54,'rgba(119,90,60,.072)');g.addColorStop(1,'rgba(112,91,61,0)');
        c.fillStyle=g;c.fillRect(x,0,s,length);
      }
    }),true,false);
    const stain=surface(.88,.014,{map:salt,transparent:true,opacity:.77,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2});
    const drips=surface(.83,.034,{map:oxides,transparent:true,opacity:.81,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2});
    for(const side of [-1,1]){
      for(const z of [-6.20,-2.08,2.04,6.16]){
        emit(plane,stain,0xffffff,[side*6.388,.995,z],[4.12,.67,1],[0,-side*Math.PI/2,0]);
        emit(plane,stain,0x95a58c,[side*6.178,-.40,z],[4.12,.44,1],[0,-side*Math.PI/2,0]);
      }
      for(const z of sides)for(const offset of [-.87,.94])emit(plane,drips,0xffffff,[side*6.389,1.80,z+offset],[.32,.84,1],[0,-side*Math.PI/2,0]);
    }
    for(const x of [-4.33,0,4.33]){
      emit(plane,stain,0xffffff,[x,1.139,-8.293],[4.34,.78,1],null);
      emit(plane,stain,0x98aa93,[x,-.28,-8.076],[4.34,.56,1],null);
    }
    for(const x of [ax-1.65,ax+1.58])emit(plane,drips,0xffffff,[x,1.70,-8.290],[.52,1.06,1],null);
    // A faded survey witness mark at the historic line and a few chipped cast-in repair straps.
    const ruling=tex(canvas(256,120,(c,w,h)=>{
      c.strokeStyle='#b5ad96';c.fillStyle='#beb499';c.globalAlpha=.8;c.lineWidth=3;c.beginPath();c.moveTo(11,85);c.lineTo(w-9,85);c.stroke();
      for(let j=0;j<12;j++){c.fillRect(15+j*20,85-(j%5?9:20),2,j%5?9:20);}
      c.font='bold 18px serif';c.fillText('测　03',20,51);c.font='12px monospace';c.fillText('H.W.',170,63);
      c.globalCompositeOperation='destination-out';for(let i=0;i<620;i++){c.fillStyle='rgba(0,0,0,.72)';c.fillRect(rnd()*w,rnd()*h,.5+rnd()*4,.5+rnd()*2);}
    }),true,false);
    const stencil=surface(.91,.01,{map:ruling,transparent:true,opacity:.79,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2});
    emit(plane,stencil,0xffffff,[-3.61,1.47,-8.289],[.64,.28,1],null);
    for(const side of [-1,1]){
      for(const z of [-3.22,3.11,7.66]){
        box(side*6.378,1.48,z,.036,.41,.27,cured,blue);
        for(const y of [1.35,1.60])bolt(side*6.349,y,z,.031,'x',rust);
        emit(plane,drips,0xffffff,[side*6.388,.971,z],[.34,.60,1],[0,-side*Math.PI/2,0]);
      }
    }
    // Original caged incandescent fittings and high, wall-hugging electrical conduits.
    const bulb=surface(.27,.12,{emissive:0xffac59,emissiveIntensity:2.1});
    const cover=surface(.25,.22,{emissive:0xf4a251,emissiveIntensity:.33,transparent:true,opacity:.30,depthWrite:false});
    const haloTex=tex(canvas(128,128,(c,w,h)=>{
      const r=w/2,g=c.createRadialGradient(r,r,0,r,r,r);g.addColorStop(0,'rgba(255,231,166,1)');g.addColorStop(.115,'rgba(255,188,100,.76)');g.addColorStop(.35,'rgba(231,130,59,.26)');g.addColorStop(.73,'rgba(219,115,49,.068)');g.addColorStop(1,'rgba(210,106,45,0)');c.fillStyle=g;c.fillRect(0,0,w,h);
    }),true,false);
    const halo=keep(new T.MeshBasicMaterial({map:haloTex,color:0xffffff,vertexColors:true,transparent:true,opacity:.64,blending:T.AdditiveBlending,depthWrite:false,side:T.DoubleSide}));
    function lamp(x,y,z,northFace){
      const nx=northFace?0:-1,nz=northFace?1:0;
      const rise=.289,yy=y+.23;
      rod([x-nx*.28,yy+rise,z-nz*.28],[x,yy+rise,z],.035,.035,iron,blue,true);
      rod([x,yy+rise,z],[x,yy,z],.033,.033,iron,blue,true);
      cylinder(x,y+.191,z,.127,.10,cured,blue);
      emit(sphere,bulb,0xffe6ac,[x,y-.01,z],[.082,.146,.082],null);
      emit(sphere,cover,0xffd287,[x,y-.026,z],[.135,.198,.135],null);
      for(const dy of [-.219,-.070,.116])ring(x,y+dy,z,dy<-.2?.091:.143,.010,iron,brass,[Math.PI/2,0,0]);
      for(let i=0;i<8;i++){
        const a=i*TAU/8,ex=Math.cos(a),ez=Math.sin(a);
        rod([x+.126*ex,y+.132,z+.126*ez],[x+.142*ex,y-.069,z+.142*ez],.009,.009,iron,blue,true);
        rod([x+.142*ex,y-.069,z+.142*ez],[x+.091*ex,y-.216,z+.091*ez],.009,.009,iron,blue,true);
      }
      emit(plane,halo,0xffffff,[x+nx*.152,y-.017,z+nz*.152],[.94,.94,1],[0,northFace?0:-Math.PI/2,0]);
      emit(plane,halo,0xffd5a5,[x-nx*.325,y+.023,z-nz*.325],[2.63,2.63,1],[0,northFace?0:-Math.PI/2,0]);
    }
    lamp(-4.70,3.02,-7.95,true);lamp(6.04,2.98,-3.54,false);
    rod([-5.96,4.02,-8.17],[-3.03,4.02,-8.17],.026,.026,cured,teal,true);
    rod([-4.70,4.02,-8.17],[-4.70,3.50,-8.17],.026,.026,iron,brass,true);
    rod([6.306,4.02,-4.02],[6.306,4.02,-2.96],.026,.026,cured,teal,true);
    rod([6.306,4.02,-3.54],[6.306,3.46,-3.54],.026,.026,iron,brass,true);
    for(const x of [-5.79,-4.93,-4.08,-3.25])box(x,4.02,-8.168,.056,.084,.072,cured,blue);
    const warmLight=new T.PointLight(0xffb66c,legacy?1.85:20.5,7.20,2);warmLight.position.set(-4.67,2.88,-7.64);root.add(warmLight);
    const coolLight=new T.PointLight(0xadcedd,legacy?1.28:16.0,8.65,2);coolLight.position.set(5.88,3.97,-.08);root.add(coolLight);
    // Fine curtain shafts down the window reveals and a fragmented skylight reflection projected on the deep basin floor.
    const beamTex=tex(canvas(192,320,(c,w,h)=>{
      const im=c.createImageData(w,h);for(let y=0;y<h;y++)for(let x=0;x<w;x++){
        const u=(x+.5)/w,vv=(y+.5)/h,k=(y*w+x)*4;
        const edge=Math.pow(Math.max(0,Math.sin(u*Math.PI)),1.72),length=Math.pow(Math.max(0,Math.sin(vv*Math.PI)),.67),frame=.72+.18*Math.cos(u*18)+.10*Math.sin(33*u+vv*3);
        im.data[k]=153;im.data[k+1]=198;im.data[k+2]=211;im.data[k+3]=Math.round(edge*length*frame*96);
      }c.putImageData(im,0,0);
    }),true,false);
    const shafts=keep(new T.MeshBasicMaterial({map:beamTex,color:0xc6dedb,vertexColors:true,transparent:true,opacity:.50,blending:T.AdditiveBlending,depthWrite:false,side:T.DoubleSide}));
    for(const side of [-1,1])for(const z of sides){
      emit(plane,shafts,0xffffff,[side*5.08,2.53,z+.18],[2.16,4.98,1],[.04,.92,side*.37]);
    }
    const floorGlow=tex(canvas(256,320,(c,w,h)=>{
      const im=c.createImageData(w,h);for(let y=0;y<h;y++)for(let x=0;x<w;x++){
        const u=(x+.5)/w,vv=(y+.5)/h,k=(y*w+x)*4,edge=Math.min(u,1-u,vv,1-vv);
        const mask=Math.max(0,Math.min(1,edge*18))*(.25+.75*Math.min(1,Math.abs(u-.50)*30))*(.33+.67*Math.min(1,Math.abs(vv-.40)*16));
        im.data[k]=153;im.data[k+1]=199;im.data[k+2]=204;im.data[k+3]=Math.round(mask*(1-vv*.76)*126);
      }c.putImageData(im,0,0);
    }),true,false);
    const spill=keep(new T.MeshBasicMaterial({map:floorGlow,vertexColors:true,transparent:true,opacity:.43,blending:T.AdditiveBlending,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2}));
    for(const [x,z,w,d] of wells){
      emit(plane,spill,0xffffff,[x+.87,-1.146,z+.63],[w*1.5,d*1.56,1],[-Math.PI/2,0,-.12]);
      emit(plane,shafts,0xffffff,[x+.36,4.59,z+.11],[w*1.09,3.15,1],[.24,.19,-.28]);
    }
    // Keep transparent and opaque surfaces in their own render passes.
    for(const [material,b] of layers){
      const g=raw(b.p,b.n,b.index,b.uv);g.setAttribute('color',new T.Float32BufferAttribute(b.co,3));g.computeBoundingSphere();
      const o=mesh(g,material);o.castShadow=!material.transparent&&material!==bulb;
    }
    function update(time=0,waterLocalY=.58){
      if(disposed)return;
      const t=Number.isFinite(time)?time:0;waterLevel.value=Number.isFinite(waterLocalY)?waterLocalY:.58;
      warmLight.intensity=(legacy?1.85:20.5)*(1+.014*Math.sin(2.17*t)+.008*Math.sin(5.19*t+.8));
      coolLight.intensity=(legacy?1.28:16.0)*(.985+.024*Math.sin(t*.39+.25));
      shafts.opacity=.49+.028*Math.sin(t*.33);
    }
    update();
    return {update,dispose(){
      if(disposed)return;disposed=true;
      parent.remove(root);for(const r of owned)if(typeof r.dispose==='function')r.dispose();
      if(typeof warmLight.dispose==='function')warmLight.dispose();if(typeof coolLight.dispose==='function')coolLight.dispose();
      root.clear();layers.clear();owned.clear();geos.clear();
    }};
  }
  return {create};
})();
