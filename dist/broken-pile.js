// Timber, ironwork, growth and fracture geometry original to North Cape.
// Surface photography: Rough Wood, Rob Tuytel, CC0. https://polyhaven.com/a/rough_wood
// Load beside broken-pile-maps.js. No maps, object URLs or scene instances are cached by this module.
(() => {
  'use strict';
  const mapURL = new URL('broken-pile-maps.js', document.currentScript?.src || document.baseURI).href;
  const TAU = Math.PI * 2;
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  function smooth(a, b, v) {
    const s = clamp((v - a) / (b - a));
    return s*s*(3-2*s);
  }
  function gaussian(v,w) { return Math.exp(-v*v/(w*w)); }
  function diff(a,b) { return Math.atan2(Math.sin(a-b),Math.cos(a-b)); }
  function create(parent) {
    const T = THREE, root = new T.Group(), owned = [], loaded = [];
    root.name = 'Sounding mark · scarred ironbound timber';
    parent.add(root);
    let disposed = false, seed = 73908;
    const rand = () => ((seed = (Math.imul(1664525,seed)+1013904223)>>>0) / 4294967296);
    const own = value => (owned.push(value),value);
    const material = options => own(new T.MeshStandardMaterial(options));
    const wood = material({color:0xcfbe9f, roughness:1, metalness:0, vertexColors:true});
    const crown = material({color:0xae9573, roughness:.78, vertexColors:true, side:T.DoubleSide});
    const strap = material({color:0x70706a, roughness:.59, metalness:.48, vertexColors:true});
    const reef = material({color:0xffffff, roughness:.73, metalness:.07, vertexColors:true});
    const asRGB = (color,scale = 1) => { const c = new T.Color(color); return [c.r*scale,c.g*scale,c.b*scale]; };
    function batch() {
      const pos=[], uv=[], color=[], index=[];
      function point(p,u,v,c=[1,1,1]) { const i=pos.length/3;pos.push(...p);uv.push(u,v);color.push(...c);return i; }
      function quad(a,b,c,d) { index.push(a,b,c,a,c,d); }
      function matrix(rows,cols,vertex,reverse=false) {
        let prev;
        for(let row=0;row<=rows;row++) {
          const current=[];
          for(let col=0;col<=cols;col++) current.push(vertex(row,col));
          if(prev) for(let j=0;j<cols;j++) {
            if(reverse)quad(prev[j+1],prev[j],current[j],current[j+1]);
            else quad(prev[j],prev[j+1],current[j+1],current[j]);
          }
          prev=current;
        }
      }
      function finish(mat,name) {
        const geom=own(new T.BufferGeometry());
        geom.setAttribute('position',new T.Float32BufferAttribute(pos,3));
        geom.setAttribute('uv',new T.Float32BufferAttribute(uv,2));
        geom.setAttribute('color',new T.Float32BufferAttribute(color,3));
        geom.setIndex(index);geom.computeVertexNormals();geom.computeBoundingSphere();
        const mesh=new T.Mesh(geom,mat); mesh.castShadow=true;mesh.receiveShadow=true;mesh.name=name;root.add(mesh);
      }
      return {point,quad,matrix,finish,tri:(a,b,c)=>index.push(a,b,c)};
    }
    // Radial checks widen close to the broken end and die into the intact lower shaft.
    const checks = [[.18,.009,-3.46],[.89,.010,-3.01],[1.32,.013,-2.81],[1.81,.019,-3.35],[2.20,.012,-3.44],[2.99,.009,-3.67],[4.28,.018,-3.02],[4.51,.015,-2.86],[5.70,.012,-3.37]];
    function center(y) {
      const f=smooth(-4.9,-2.83,y), h=smooth(-2.63,-1.9,y);
      return [-.022+.023*f+.015*h,.020-.019*f-.035*h];
    }
    function radial(a,y,forBand=false) {
      const high=smooth(-3.53,-2.41,y);
      const dry=smooth(-2.43,-2.07,y);
      let r=.326+.050*high+.014*gaussian(y+3.43,.57)-.016*dry;
      r+=.0072*Math.cos(2*a-.50)+.0034*Math.sin(3*a+.60)+.002*Math.cos(7*a+y*.4);
      if(!forBand) {
        r+=.0017*Math.sin(21*a+.9*y)+.0013*Math.sin(37*a-1.5*y);
        for(const [ang,w,start] of checks) {
          const d=diff(a,ang+.015*Math.sin(3.7*y+ang)+.005*Math.sin(14*y));
          r-=(.007+.018*dry)*gaussian(d,.017+w)*smooth(start,start+.45,y);
        }
        // A face cleaved away under the broken hoop. Old intact metal spans the check.
        r-=.029*gaussian(diff(a,1.72+.10*Math.sin(4*y)),.46)*smooth(-2.79,-2.48,y);
      }
      return r;
    }
    function position(a,y,r=radial(a,y)) {
      const [x,z]=center(y);return [x+Math.sin(a)*r,y,z+Math.cos(a)*r];
    }
    // Asymmetric cross-grain failure. A long high blade sits at the back of an uneven diagonal fracture.
    function crownY(a,f=1) {
      const x=Math.sin(a)*f,z=Math.cos(a)*f;
      const split=x+.15*z+.04*Math.sin(4*z);
      const ledge=(at,amp,span)=>amp*(.5+.5*Math.tanh((split-at)/span));
      const remnant=gaussian(x+.68,.19)*gaussian(z+.34,.60);
      const fine=.008*Math.sin(25*split+z*3)+.005*Math.sin(44*split-z)+.0025*Math.cos(68*split+2*z);
      const rag=smooth(.82,1,f)*(.010*Math.sin(17*a+1.4)+.009*Math.cos(25*a-.6)+.005*Math.sin(37*a));
      return -2.134-.083*x+.035*z+fine+rag+.097*remnant
        +ledge(-.41,.039,.063)-ledge(-.22,.064,.041)+ledge(.22,.024,.039)
        -.030*gaussian(split-.03,.10)*(.52+.4*z);
    }
    const shaft=batch(), rows=[-5.04,-4.74,-4.46,-4.17,-3.89,-3.65,-3.45,-3.29,-3.18,-3.10,-3.02,-2.96,-2.90,-2.84,-2.80,-2.76,-2.71,-2.67,-2.62,-2.58,-2.54,-2.50,-2.46,-2.42,-2.38,-2.34,-2.30];
    const count=132;
    shaft.matrix(rows.length+3,count,(j,k)=>{
      const a=k*TAU/count;
      const y=j<rows.length?rows[j]:-2.30+(crownY(a)+2.30)*(j-rows.length+1)/4;
      const light=.91+.08*Math.sin(a*5+y)+.028*Math.sin(13*a+2*y);
      return shaft.point(position(a,y),k/count,(y+5.04)/3.38,[light,light,.01+light]);
    });
    shaft.finish(wood,'Single weathered shaft with vertical checks and old tide mark');
    const cap=batch();
    cap.matrix(21,count,(j,k)=>{
      const a=k*TAU/count, f=1-j/21, y=crownY(a,f);
      const outer=position(a,crownY(a)),c=center(-2.13),x=c[0]+(outer[0]-c[0])*f,z=c[1]+(outer[2]-c[1])*f;
      const d=1.00-.28*smooth(.58,1,f)+.065*Math.sin(17.2*(x+.11*z))+.056*Math.sin(37*(x+.12*z));
      return cap.point([x,y,z],.50+x*1.30,.50+z*1.30,[d,d,d]);
    });
    // A handful of still-attached torn fibres; different cross sections emerge inside the fracture.
    for(const [x,z,span,h,lean] of [[-.245,-.108,.105,.152,-.018],[-.161,-.221,.068,.105,-.008],[.158,-.221,.081,.099,.003]]) {
      const a=Math.atan2(x,z),f=Math.hypot(x,z)/.36,base=crownY(a,f)-.046;
      const orig=[[x-span*.58,base,z-span*.23],[x+span*.46,base-.022,z-span*.39],[x+span*.43,base+.012,z+span*.26],[x-span*.53,base+.025,z+span*.34]];
      const top1=[x+lean-span*.26,base+h+.002,z-.012],top2=[x+lean+span*.20,base+h-.033,z+.001];
      for (let j=0;j<4;j++) {
        const c=[.86+j*.035,.86+j*.031,.82+j*.035];
        const pts=[orig[j],orig[(j+1)%4],j<2?top2:top1,top1].map((p,i)=>cap.point(p,.49+p[0]*1.1+i*.025,.50+p[2]*1.10+(p[1]-base)*.60,c));
        cap.quad(...pts);
      }
    }
    cap.finish(crown,'Revealed growth rings and torn interior end grain');
    const iron=batch();
    function paint(k){return [k,k*.99,k*.96];}
    function belt(y,from,to,segments,partial,lap=false) {
      const edges=[[-.053,0],[-.050,.009],[-.041,.014],[.039,.014],[.049,.009],[.052,0],[.045,-.0035],[-.047,-.0035],[-.053,0]];
      const rings=[];
      for(let i=0;i<=segments;i++) {
        const s=i/segments, nominal=from+(to-from)*s;
        const tip=partial?Math.max(gaussian(s,.04),gaussian(1-s,.042)):0;
        const row=[];
        for(const [h,thick] of edges) {
          const angle=nominal+tip*(i<segments/2?-.055:.036)*h/.052;
          const shift=(partial?-.015:0)*tip+.005*Math.sin(3*angle+.7)+.0035*Math.sin(9*angle+2.3)+.0021*Math.cos(17*angle);
          const yy=y+h+shift;
          // Follow the dressed timber but keep the forged strip straight across the individual checks.
          const r=radial(angle,y,true)+.0052+thick+(partial?.016*tip:0)+(lap?.016:0);
          const shade=(h<-.050?.79:h>.045?1.18:1.01)+.027*Math.sin(nominal*11);
          row.push(iron.point(position(angle,yy,r), (nominal/(TAU)+(partial?.01:.354))%2,(h+.053)/.105,paint(shade)));
        }
        if(i)for(let n=0;n<row.length-1;n++)iron.quad(rings[i-1][n],row[n],row[n+1],rings[i-1][n+1]);
        rings.push(row);
      }
      for(const k of [0,segments])for(let i=1;i<edges.length-2;i++){
        const row=rings[k];
        if(k===0)iron.tri(row[0],row[i],row[i+1]);else iron.tri(row[0],row[i+1],row[i]);
      }
    }
    belt(-2.77,0,TAU,120,false);
    belt(-2.50,145*Math.PI/180,(360+45)*Math.PI/180,100,true);
    // Forged lap and two rivet heads across each actual joint, hidden on the opposite side of the break.
    for(const [y,a] of [[-2.77,.115],[-2.50,3.45]]) {
      belt(y,a-.17,a+.18,10,false,true);
      for(const aa of [a-.075,a+.097]) {
        const cy=y+.002, rim=radial(aa,y,true)+.035;
        iron.matrix(4,12,(j,k)=>{
          const b=k*TAU/12,size=.0125*Math.cos(j*Math.PI/8),an=aa+Math.sin(b)*size/rim;
          return iron.point(position(an,cy+Math.cos(b)*size,rim+.0057*Math.sin(j*Math.PI/8)),.35,.89,paint(.87+j*.047));
        });
      }
    }
    iron.finish(strap,'Complete lower hoop and torn overlapping upper collar');
    // Sessile animals congregate in the damp side of the shaft: irregular low conical cups, dark openings.
    const shells=batch();
    const clusters=[[.04,-2.91,9],[.66,-3.08,6],[1.11,-2.86,4],[2.90,-2.97,7],[4.15,-2.89,7],[5.35,-3.17,9],[.33,-3.21,4]];
    for(const [a0,y0,n] of clusters)for(let i=0;i<n;i++) {
      const a=a0+(rand()-.5)*.49,y=y0+(rand()-.5)*.16,size=.008+rand()*.018;
      const r=radial(a,y),sz=size*(.74+.42*rand()),h=size*(.35+rand()*.49),rot=rand()*TAU;
      const cream=asRGB([0xb3aa89,0xaaa991,0xaaa28a,0x938d74,0xbab7a0][Math.floor(rand()*5)]);
      const wobble=Array.from({length:8},()=>.85+.27*rand());
      shells.matrix(4,8,(j,k)=>{
        const b=k*TAU/8+rot,fac=[1,.87,.45,.30,.25][j]*wobble[k%8];
        const ang=a+(Math.sin(b)*size*fac+.15*h*smooth(0,4,j))/r;
        const yy=y+Math.cos(b)*sz*fac+.14*h*smooth(0,4,j);
        const rr=r+[-.003,.20*h,.86*h,h,.28*h][j];
        const tint=[.59,.81,1.09,.83,.27][j]*(1+.052*Math.cos(b*4));
        return shells.point(position(ang,yy,rr),.1,.1,cream.map(c=>c*tint));
      });
    }
    shells.finish(reef,'Clustered intertidal barnacles');
    // A transient payload works on file:// and HTTP. Only this live scene owns the decoded images.
    const tag=document.createElement('script');tag.async=true;tag.src=mapURL;
    let finish;
    const ready=new Promise(resolve=>{finish=resolve;});
    const settle=ok=>{tag.remove();if(finish){finish(ok);finish=null;}};
    const decode=uri=>new Promise(resolve=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=()=>resolve(null);im.src=uri;});
    tag.addEventListener('pile-maps',async event=>{
      const slots=[[wood,'map','wood'],[wood,'bumpMap','relief'],[wood,'roughnessMap','rough'],[crown,'map','cap'],[strap,'map','iron']];
      const images=await Promise.all(slots.map(v=>decode(event.detail[v[2]])));
      if(disposed)return;
      slots.forEach(([mat,slot,key],i)=>{
        if(!images[i])return;
        const tex=new T.Texture(images[i]);tex.wrapS=T.RepeatWrapping;tex.anisotropy=4;
        if(slot==='map')tex.colorSpace=T.SRGBColorSpace;
        tex.needsUpdate=true;mat[slot]=tex;
        if(slot==='map')mat.color.setHex(0xffffff);
        if(slot==='bumpMap')mat.bumpScale=.0039;
        mat.needsUpdate=true;loaded.push(tex);
      });
      settle(images.every(Boolean));
    },{once:true});
    tag.onerror=()=>settle(false);document.head.append(tag);
    return {ready,dispose() {
      if(disposed)return;disposed=true;settle(false);
      root.removeFromParent();
      for(const tex of loaded){tex.dispose();tex.image=null;}
      for(const item of owned)item.dispose();
      root.clear();owned.length=loaded.length=0;
    }};
  }
  window.TideBrokenPile={create};
})();
