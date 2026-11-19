// Hai Yan's welded steel shell. All stations, chines and the transom remain on
// the actual passenger ferry loft. Measurements and UVs are in ship metres.
const TideFerryHull=(()=>{
  'use strict';
  const S=[[-9.2,.06,1.85],[-8.35,1.24,1.69],[-6.8,2.04,1.50],[-4.6,2.32,1.39],[-1,2.38,1.35],[3.9,2.36,1.34],[6.9,2.20,1.34],[8.7,1.90,1.40]];
  const chine=[-1.02,-.56,-.18,.07,.30],beam=[.22,.72,.88,.94,.98,1,1];
  const lift=(s,k)=>k<5?chine[k]:s[2]-(k===5?.12:0);
  const end=8.70,fore=-9.20,span=end-fore,ppm=107,top=1.90;
  const strips=[[8,6],[8,336],[8,666]],W=2048,H=1024;
  const blend=(a,b,t)=>a+(b-a)*t;
  function station(z){
    let i=0;while(i<6&&z>S[i+1][0])i++;
    const a=S[i],b=S[i+1],t=(z-a[0])/(b[0]-a[0]);
    return [z,blend(a[1],b[1],t),blend(a[2],b[2],t)];
  }
  function breadth(z,y){
    const s=station(z);let k=0;while(k<5&&y>lift(s,k+1))k++;
    return s[1]*blend(beam[k],beam[k+1],Math.min(1,Math.max(0,(y-lift(s,k))/(lift(s,k+1)-lift(s,k)))));
  }
  // Camera facing the starboard side (+X) sees the stem to its right.
  function along(face,h){return face===2?h+1.94:face===0?end-h:h-fore;}
  function width(face){return face===2?3.88:span;}
  function atlasUv(face,h,y){return [(strips[face][0]+ppm*along(face,h))/W,1-(strips[face][1]+ppm*(top-y))/H];}
  function generator(seed){return ()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);}
  function canvas(w,h){
    const c=document.createElement('canvas');c.width=w;c.height=h;return c;
  }
  function stock(T){
    const atlas=canvas(W,H),orm=canvas(W/2,H/2);
    const master=atlas.getContext('2d'),coat=orm.getContext('2d');
    master.fillStyle='#445d5c';master.fillRect(0,0,W,H);coat.fillStyle='rgb(126,156,23)';coat.fillRect(0,0,W,H);
    const grain=canvas(192,144),cg=grain.getContext('2d'),gr=cg.createImageData(grain.width,grain.height),rng=generator(61816);
    for(let i=0;i<gr.data.length;i+=4){
      const x=rng(),c=45+148*x+54*rng();gr.data[i]=c+4;gr.data[i+1]=c;gr.data[i+2]=c-4;gr.data[i+3]=255;
    }
    cg.putImageData(gr,0,0);
    for(let face=0;face<3;face++){
      const full=width(face),side=face<2,random=generator(4104+face*3031),
        zOf=l=>face===2?l-1.94:face===0?end-l:fore+l,
        deck=l=>side?station(zOf(l))[2]:1.40;
      const a=canvas(Math.ceil(ppm*full)+2,322),b=canvas(a.width,322),
        c=a.getContext('2d'),p=b.getContext('2d');
      function path(ctx,points,ink,w){
        ctx.strokeStyle=ink;ctx.lineWidth=w;ctx.beginPath();
        points.forEach(([l,y],i)=>i?ctx.lineTo(l,top-y):ctx.moveTo(l,top-y));ctx.stroke();
      }
      function circ(ctx,l,y,rx,ry,ink){
        ctx.fillStyle=ink;ctx.beginPath();ctx.ellipse(l,top-y,rx,ry,0,0,Math.PI*2);ctx.fill();
      }
      function tops(ctx,d,fill){
        ctx.beginPath();ctx.moveTo(-.02,-.05);ctx.lineTo(-.02,top-deck(0)+d);
        for(let i=0;i<=48;i++)ctx.lineTo(full*i/48,top-deck(full*i/48)+d);
        ctx.lineTo(full+.02,-.05);ctx.closePath();ctx.fillStyle=fill;ctx.fill();
      }
      c.scale(ppm,ppm);p.scale(ppm,ppm);
      const base=c.createLinearGradient(0,0,0,3);
      for(const [y,color] of [[1.9,'#60756c'],[1.30,'#546f69'],[.79,'#486968'],[.39,'#405f61'],[.19,'#3d5b5c'],[.12,'#3f514e'],[-.06,'#434c43'],[-.235,'#475047'],[-.28,'#745147'],[-.54,'#794538'],[-1.10,'#563c34']])
        base.addColorStop(Math.min(1,(top-y)/3),color);
      c.fillStyle=base;c.fillRect(0,0,full+.02,3.01);p.fillStyle='rgb(126,150,23)';p.fillRect(0,0,full+.02,3.01);
      // Longitudinal shell strakes, staggered butt welds and broken mill scale.
      const rows=[[-1.06,-.43,2.9],[-.43,.29,2.65],[.29,.92,2.40],[.92,1.93,3.1]];
      const plateEnds=[];
      for(let row=0;row<rows.length;row++){
        const [lo,hi,length]=rows[row];let l=-(row%2?length*.61:random()*.35);
        while(l<full){
          const next=l+length*(.84+random()*.31),v=.03+random()*.066;
          c.fillStyle=random()<.55?'rgba(184,181,145,'+v+')':'rgba(12,29,31,'+v+')';
          c.fillRect(l,top-hi,next-l,hi-lo);
          if(l>.08){
            const lean=(random()-.5)*.024,ls=[[l,lo],[l+lean*.45,(lo+hi)*.5],[l+lean,hi]];
            path(c,ls,'rgba(24,40,39,.55)',.009);path(c,ls.map(q=>[q[0]+.009,q[1]]),'rgba(174,178,150,.44)',.006);
            path(p,ls,'rgb(175,169,29)',.012);
            for(let d=lo;d<hi;d+=.025+random()*.08){
              const dx=l+lean*(d-lo)/(hi-lo);circ(c,dx,d,.004+random()*.007,.006+random()*.014,'rgba(136,105,74,.38)');
            }
            plateEnds.push([l,hi]);
          }
          l=next;
        }
        if(row>0){
          const line=[];for(let j=0;j<=54;j++)line.push([full*j/54,lo+.002*Math.sin(j*.86+row)]);
          path(c,line,'rgba(22,42,40,.52)',.011);path(c,line.map(q=>[q[0],q[1]+.009]),'rgba(185,178,141,.43)',.0065);
          path(p,line,'rgb(171,176,32)',.014);
        }
      }
      // The bootstripe oxidizes and picks up algae differently from the upper
      // enamel. Its broken line stays in ship coordinates through every roll.
      for(let i=0;i<full*175;i++){
        const l=random()*full,y=.05+.052*Math.sin(l*1.4+face)+.024*Math.sin(l*5.1)+(.5-random())*.38;
        const rx=.004+.085*random()**2,ry=.003+.013*random();
        const tone=random(),ink=tone<.38?'rgba(116,118,83,.31)':tone<.82?'rgba(37,48,37,.40)':'rgba(168,157,119,.38)';
        circ(c,l,y,rx,ry,ink);if(tone>.67)circ(p,l,y,rx,ry,'rgb(143,203,12)');
      }
      // Fairlead and scupper run-out travels down then feathers over the plate.
      function stain(l,y,h,w,strength){
        const g=c.createLinearGradient(0,top-y,0,top-y+h);
        g.addColorStop(0,'rgba(106,66,40,'+strength+')');g.addColorStop(.34,'rgba(126,86,50,'+(strength*.64)+')');g.addColorStop(.84,'rgba(124,101,66,'+(strength*.17)+')');g.addColorStop(1,'rgba(138,112,72,0)');
        c.fillStyle=g;c.beginPath();c.moveTo(l-w,top-y);c.quadraticCurveTo(l-w*.53,top-y+h*.23,l-w*.23,top-y+h*.7);
        c.lineTo(l+w*.08,top-y+h);c.quadraticCurveTo(l+w*.18,top-y+h*.4,l+w,top-y);c.fill();
        path(p,[[l,y],[l+w*.12,y-h*.8]],'rgba(122,190,16,.45)',Math.max(.004,w*.33));
      }
      const drains=side?[-4.95,-.6,3.42,7.56]:[-1.32,1.32];
      const sources=drains.map(z=>[along(face,z),side?station(z)[2]-.402:.91]);
      if(side)sources.push([along(face,-8.11),1.23]);
      for(const [l,y] of sources)for(let k=0;k<20;k++)stain(l+(random()-.5)*.28,y+.025,.18+random()**1.6*.75,.007+random()*.031,.17+random()*.33);
      for(const [l,y] of plateEnds)if(random()<.61)stain(l,Math.min(deck(l)-.26,y),.08+random()*.35,.009,.26);
      // A narrow sheer band follows the actual deck camber, including the bow.
      tops(c,.228,'#889993');tops(c,.198,'#d1cfb7');tops(c,.059,'#aeb8aa');
      tops(p,.224,'rgb(127,160,19)');tops(p,.058,'rgb(129,167,21)');
      for(let n=0;n<full*18;n++){
        const l=random()*full,w=.015+random()**3*.16,y=deck(l)-.21+random()*.14;
        path(c,[[l,y],[l+w,y+(random()-.5)*.014]],'rgba(71,78,64,.28)',.004+random()*.010);
      }
      // Raised local mill numbers have been repainted more than once. These
      // are hull markings, not freestanding planes in front of the bow.
      function writing(l,y,text,size,fit,color,font='bold'){
        c.save();c.fillStyle=color;c.textAlign='center';c.textBaseline='middle';
        c.translate(l,top-y);c.scale(.01,.01);
        c.font=font+' '+size*100+'px "Songti SC","Noto Serif CJK SC",serif';c.fillText(text,0,0,fit*100);c.restore();
      }
      if(side){
        const name=along(face,-7.31);
        writing(name,.954,'海 雁 号',.308,1.41,'#e3dfc7');
        writing(name,.694,'H A I   Y A N',.090,1.0,'#d7d0af','600');
        const l=along(face,-8.12),outer=face===0?-1:1;
        for(let d=0;d<7;d++){
          const y=-.42+d*.20,wide=d===2;
          path(c,[[l,y],[l+outer*(wide?.11:.071),y]],'#d5c9a8',.018);
          const decimetres=6+2*d;writing(l+outer*.153,y+.038,wide?'1M':String(decimetres%10),.094,wide?.135:.080,'#d3c7a5','700');
        }
        // The quay face bears longitudinal scratches at suspended fender height.
        for(let z=-6.4;z<8;z+=1.65){
          const l=along(face,z+.36);for(let k=0;k<21;k++){
            const j=l+(random()-.5)*.28,y=.68+random()*.28,len=.02+random()**2*.32;
            path(c,[[j,y],[j+len*.55,y+.005],[j+len,y+(random()-.5)*.032]],k%4?'rgba(32,47,45,.36)':'rgba(150,148,118,.49)',.004+random()*.013);
          }
        }
      }else{
        // Leave room for the separately modelled embossed transom nameplate.
        writing(full/2,.555,'北 岬 港',.125,.70,'#c1c4ac','600');
      }
      for(let n=0;n<full*130;n++){
        const l=random()*full,y=-.68+random()*2.35;
        if(y>deck(l))continue;
        const s=random(),rx=.004+random()**3*.048,dy=.002+random()*.009;
        const color=s<.38?'rgba(132,102,72,.58)':s<.74?'rgba(45,62,59,.38)':'rgba(175,177,146,.37)';
        path(c,[[l,y],[l+rx*.6,y+.002],[l+rx,y+dy*.42]],color,dy);
        if(s<.30)path(p,[[l,y],[l+rx,y]],'rgb(109,195,40)',dy);
      }
      for(let i=0;i<full*14;i++){
        const l=random()*full,y=deck(l)-.244-random()*.15,h=.035+.19*random()**3;
        stain(l,y,h,.005+random()*.009,.24);
      }
      // Soft broad brush patches and enamel orange peel use different scales.
      c.save();c.setTransform(1,0,0,1,0,0);c.globalCompositeOperation='soft-light';
      for(const [scale,opacity] of [[7,.27],[1.5,.15],[.47,.32]]){
        c.save();c.globalAlpha=opacity;c.scale(scale,scale);c.fillStyle=c.createPattern(grain,'repeat');c.fillRect(0,0,a.width/scale,a.height/scale);c.restore();
      }
      c.restore();
      const [x,y]=strips[face];master.drawImage(a,x,y);coat.drawImage(b,x/2,y/2,b.width/2,b.height/2);
      // Two-texel gutters keep the edges from sampling a neighbouring island.
      for(const [g,img,k] of [[master,a,1],[coat,b,.5]]){
        const h=img.height,w=img.width;
        g.drawImage(img,0,0,1,h,(x-3)*k,y*k,3*k,h*k);g.drawImage(img,w-1,0,1,h,(x+w)*k,y*k,3*k,h*k);
      }
    }
    function texture(image,srgb){
      const t=new T.CanvasTexture(image);if(srgb)t.colorSpace=T.SRGBColorSpace;
      t.anisotropy=6;t.generateMipmaps=true;return t;
    }
    return [texture(atlas,true),texture(orm,false)];
  }
  const positionKey=(x,y,z)=>[x,y,z].map(v=>Math.round(v*10000)).join('/');
  const triKey=(a,b,c)=>[a,b,c].sort().join(';');
  function faceTable(){
    const faces=new Map(),edge=(s,side,k)=>[s[1]*side*beam[k],lift(s,k),s[0]];
    function quad(corners,face,k){
      const vs=corners.map(p=>positionKey(...p));
      faces.set(triKey(vs[0],vs[1],vs[2]),[face,k]);faces.set(triKey(vs[0],vs[2],vs[3]),[face,k]);
    }
    for(let i=0;i<7;i++)for(const s of [-1,1])for(let k=0;k<6;k++){
      const a=S[i],b=S[i+1],points=[edge(a,s,k),edge(a,s,k+1),edge(b,s,k+1),edge(b,s,k)];
      quad(s===1?points:points.reverse(),s===1?0:1,k);
    }
    for(let k=0;k<6;k++){const s=S[7];quad([edge(s,-1,k),edge(s,1,k),edge(s,1,k+1),edge(s,-1,k+1)],2,k);}
    return faces;
  }
  function create(ship){
    const T=THREE,match=faceTable(),own=[],hidden=[];
    const kept=[],out={p:[],n:[],uv:[]},metal={p:[],n:[],c:[]};
    const normal=new T.Vector3(),N=new T.Vector3(),X=new T.Vector3(),Y=new T.Vector3();
    let original,patch,changed,disposed=false;
    function put(pos,face,k){
      const [x,y,z]=pos;
      if(face<2){
        const j=S.findIndex(s=>Math.abs(s[0]-z)<.00015),s=S[j];
        function slope(i){return (S[i+1][1]-S[i][1])/(S[i+1][0]-S[i][0]);}
        const run=j===0?slope(0):j===7?slope(6):.5*(slope(j-1)+slope(j));
        const rise=(beam[k+1]-beam[k])/(lift(s,k+1)-lift(s,k));
        normal.set(face===0?1:-1,-s[1]*rise,-Math.abs(x/s[1])*run).normalize();
      }else normal.set(0,0,1);
      out.p.push(x,y,z);out.n.push(...normal.toArray());out.uv.push(...atlasUv(face,face===2?x:z,y));
    }
    // Identify the 180 shell triangles in the shared finish batch from their
    // original station vertices. Leave all rails, cabin, deck and fenders intact.
    for(const node of ship.children){
      if(!node.isMesh||!node.geometry.index)continue;
      const src=node.geometry,pa=src.attributes.position,ix=src.index,keys=[];
      if(!pa||pa.count<300||Math.min(pa.getZ(0),pa.getZ(1),pa.getZ(2),pa.getZ(3))>fore+.001)continue;
      for(let j=0;j<pa.count;j++)keys.push(positionKey(pa.getX(j),pa.getY(j),pa.getZ(j)));
      const localKept=[],found=[];
      for(let i=0;i<ix.count;i+=3){
        const a=ix.getX(i),b=ix.getX(i+1),c=ix.getX(i+2),face=match.get(triKey(keys[a],keys[b],keys[c]));
        if(face)found.push([a,b,c,face]);else localKept.push(a,b,c);
      }
      if(found.length!==match.size)continue;
      for(const [a,b,c,face] of found)for(const k of [a,b,c])put([pa.getX(k),pa.getY(k),pa.getZ(k)],...face);
      original=src;changed=node;
      // Clone attributes as well as the index: disposing the copy must never
      // remove the template buffers used by another viewport or another ship.
      patch=src.clone();patch.setIndex(localKept);kept.push(patch);break;
    }
    if(!original)throw new Error('海雁号船体纵站不符，无法分离船壳');
    const group=new T.Group();group.name='海雁号 · 外板与舷孔';
    const [albedo,packed]=stock(T);own.push(albedo,packed);
    const finish=new T.MeshStandardMaterial({map:albedo,bumpMap:packed,bumpScale:.006,roughnessMap:packed,roughness:1,metalnessMap:packed,metalness:1});
    const water={value:new T.Vector3(-1e4,0,0)};
    finish.onBeforeCompile=s=>{
      s.uniforms.uHaiYanWater=water;
      s.vertexShader=s.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 hullWorld;')
        .replace('#include <project_vertex>','#include <project_vertex>\nhullWorld=(modelMatrix*vec4(transformed,1.)).xyz;');
      s.fragmentShader=s.fragmentShader.replace('#include <common>',`#include <common>
        uniform vec3 uHaiYanWater;
        varying vec3 hullWorld;
        ${TideCoast.swells}
        float hullWaterline(vec2 p,float t){
          if(uHaiYanWater.z>.5)return uHaiYanWater.x+surveySwell(p,t);
          vec2 q=p;
          q.x=p.x-.18*cos(dot(q,vec2(.23,.11))+t*1.12);
          q.x=p.x-.18*cos(dot(q,vec2(.23,.11))+t*1.12);
          return uHaiYanWater.x+swell(q,t);
        }`)
        .replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>
          float washLine=hullWaterline(hullWorld.xz,uHaiYanWater.y);
          float drainLine=hullWaterline(hullWorld.xz,uHaiYanWater.y-.65)-.13;
          float haiDamp=1.-smoothstep(-.02,.22,hullWorld.y-max(washLine,drainLine));
          roughnessFactor=mix(roughnessFactor,max(.24,roughnessFactor*.57),haiDamp);
          diffuseColor.rgb*=1.-.115*haiDamp;`);
    };
    finish.customProgramCacheKey=()=>'HaiYan-welded-plating-40-2';own.push(finish);
    // Close the 12 cm stem with the same plating on the original front plane.
    for(let k=0;k<6;k++){
      const s=S[0],edge=(side,j)=>[side*s[1]*beam[j],lift(s,j),s[0]];
      const a=edge(-1,k),b=edge(-1,k+1),c=edge(1,k+1),d=edge(1,k);
      for(const v of [a,b,c,a,c,d]){
        out.p.push(...v);out.n.push(0,0,-1);out.uv.push(...atlasUv(2,1.72+v[0],v[1]));
      }
    }
    const shape=new T.BufferGeometry();own.push(shape);
    const attr=(list,n)=>new T.Float32BufferAttribute(list,n);
    shape.setAttribute('position',attr(out.p,3));shape.setAttribute('normal',attr(out.n,3));shape.setAttribute('uv',attr(out.uv,2));shape.computeBoundingSphere();
    const coat=new T.Mesh(shape,finish);coat.name='实尺度水线和钢板';coat.castShadow=changed.castShadow;coat.receiveShadow=true;group.add(coat);
    // Cast oval hawse liners, scupper lips and recessed dark throats. The back
    // of each fitting lands within a few millimetres of the local hull facet.
    const col=new T.Color();
    function surf(side,l,y,bias){
      if(!side)return new T.Vector3(l,y,end+bias);
      return new T.Vector3(side*(breadth(l,y)+bias),y,l);
    }
    function addTri(a,b,c,direction,color){
      X.copy(b).sub(a);Y.copy(c).sub(a);N.crossVectors(X,Y).normalize();
      if(N.dot(direction)<0){const tmp=b;b=c;c=tmp;N.negate();}
      col.set(color);for(const v of [a,b,c]){metal.p.push(...v.toArray());metal.n.push(...N.toArray());metal.c.push(col.r,col.g,col.b);}
    }
    function eye(side,l,y,rx,ry,hawse){
      const vOut=side?new T.Vector3(side,0,-(breadth(l+.05,y)-breadth(l-.05,y))/.1).normalize():new T.Vector3(0,0,1);
      const rings=hawse?[[1.18,.003],[1.14,.022],[1,.043],[.85,.048],[.72,.029],[.65,.006]]:
        [[1.18,.003],[1.11,.014],[.94,.026],[.80,.022],[.73,.006]];
      const colors=hawse?['#41504c','#70736a','#99998a','#6c7066','#3b4541']:['#4b5e56','#79847b','#7c8274','#46574e'];
      const n=hawse?40:32;
      function pos(r,j){
        const a=2*Math.PI*j/n;return surf(side,l+rx*r[0]*Math.cos(a),y+ry*r[0]*Math.sin(a),r[1]);
      }
      for(let r=0;r<rings.length-1;r++)for(let j=0;j<n;j++){
        const a=pos(rings[r],j),b=pos(rings[r],j+1),c=pos(rings[r+1],j+1),d=pos(rings[r+1],j);
        addTri(a,b,c,vOut,colors[r]);addTri(a,c,d,vOut,colors[r]);
      }
      const center=surf(side,l,y,.006);for(let j=0;j<n;j++)addTri(center,pos(rings.at(-1),j),pos(rings.at(-1),j+1),vOut,'#202a27');
    }
    for(const side of [-1,1]){
      eye(side,-8.11,1.230,.143,.105,true);
      for(const z of [-4.95,-.6,3.42,7.56])eye(side,z,station(z)[2]-.402,.102,.033,false);
    }
    for(const x of [-1.32,1.32])eye(0,x,.91,.089,.034,false);
    const iron=new T.MeshStandardMaterial({vertexColors:true,roughness:.50,metalness:.54});
    const fittings=new T.BufferGeometry();own.push(iron,fittings);
    fittings.setAttribute('position',attr(metal.p,3));fittings.setAttribute('normal',attr(metal.n,3));fittings.setAttribute('color',attr(metal.c,3));fittings.computeBoundingSphere();
    const ports=new T.Mesh(fittings,iron);ports.castShadow=true;ports.receiveShadow=true;ports.name='铸钢导缆孔与排水孔';group.add(ports);
    for(const node of ship.children){
      if(node.geometry?.type==='PlaneGeometry'&&Math.abs(Math.abs(node.position.x)-2.376)<.002&&Math.abs(node.position.z-2.75)<.002){
        hidden.push([node,node.visible]);node.visible=false;
      }
    }
    changed.geometry=patch;ship.add(group);
    return {
      update(t,meanWater,index){water.value.set(Number.isFinite(meanWater)?meanWater:-1e4,t,index===8?1:0);},
      dispose(){
        if(disposed)return;disposed=true;
        if(changed.geometry===patch)changed.geometry=original;
        for(const [node,wasVisible] of hidden)node.visible=wasVisible;
        group.removeFromParent();for(const asset of [...own,...kept])asset.dispose();
      }
    };
  }
  return {create};
})();
