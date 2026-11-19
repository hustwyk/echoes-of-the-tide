// Original articulated characters and the Hai Yan. Geometry is batched per joint:
// each joint has one draw per surface finish, including its seams and hardware.
(() => {
  'use strict';
  const T = window.THREE;
  const TAU = Math.PI * 2;
  const sphere = new T.SphereGeometry(1, 16, 12);
  const cube = new T.BoxGeometry(1, 1, 1);
  const cylinder = new T.CylinderGeometry(1, 1, 1, 12);
  const cordRing = new T.TorusGeometry(1, .115, 6, 32);
  const fatRing = new T.TorusGeometry(1, .27, 8, 36);
  const transform = new T.Object3D();
  const normalMatrix = new T.Matrix3();
  const v = new T.Vector3();
  const n = new T.Vector3();
  const color = new T.Color();
  const colors = ['#e4a04c', '#58afa9'];
  const shellColors = ['#cf8842', '#428d89'];
  const dark = '#293637';
  const rubber = '#23292a';
  const webbing = '#3b4140';
  const pale = '#dfd9ae';
  const steel = '#8d9c94';

  function weaveMap(uri) {
    const map=new T.TextureLoader().load(uri);map.wrapS=map.wrapT=T.RepeatWrapping;
    map.repeat.set(2.1,1.7);map.anisotropy=6;return map;
  }

  function clothPattern() {
    const canvas=document.createElement('canvas');
    canvas.width=512;canvas.height=512;
    const ctx=canvas.getContext('2d');
    if (!ctx) return null;
    const image=ctx.createImageData(512,512);
    let state=139;
    const random=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
    // An irregular warp, filling and the small reinforced squares of ripstop.
    // Faint variation in the dye keeps the broad jacket panels from looking molded.
    for(let y=0;y<512;y++) {
      for(let x=0;x<512;x++) {
        const ripple=Math.sin(TAU*(x/512*4+Math.sin(TAU*y/512)*.5))*
          Math.sin(TAU*(y/512*3+Math.sin(TAU*x/512)));
        const weave=((x+y)%3===0?3:0)+(y%16<2||x%16<2?4:0);
        const value=230+random()*15+weave+ripple*6;
        image.data.set([value,value,Math.max(0,value-2),255],(y*512+x)*4);
      }
    }
    ctx.putImageData(image,0,0);
    for(let i=0;i<1450;i++){
      const x=random()*512,y=random()*512;
      ctx.strokeStyle=i%3?'rgba(63,53,45,.065)':'rgba(255,255,248,.15)';
      ctx.lineWidth=random()*.9+.45;
      ctx.beginPath();ctx.moveTo(x,y);
      ctx.lineTo(x+random()*4-2,y+random()*7);ctx.stroke();
    }
    const texture=new T.CanvasTexture(canvas);
    texture.colorSpace=T.SRGBColorSpace;
    texture.wrapS=texture.wrapT=T.RepeatWrapping;
    return texture;
  }

  // Small chips pick up a different sheen from the moulded shell beneath them.
  function shellFinish(){
    const c=document.createElement('canvas');c.width=768;c.height=384;
    const g=c.getContext('2d');g.fillStyle='#eae7dc';g.fillRect(0,0,c.width,c.height);
    let seed=603;
    const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
    for(let i=0;i<8500;i++){
      const x=random()*c.width,y=random()*c.height;
      g.strokeStyle=i%6?'rgba(85,74,57,.12)':'rgba(255,255,244,.74)';
      g.lineWidth=.32+random()*.75;g.beginPath();g.moveTo(x,y);
      g.quadraticCurveTo(x-1,y+2,x+random()*5-3,y+random()*(i%13?3:16));g.stroke();
    }
    const rim=g.createLinearGradient(0,0,0,c.height);
    rim.addColorStop(0,'rgba(153,140,100,.02)');rim.addColorStop(.87,'rgba(88,71,42,0)');
    rim.addColorStop(1,'rgba(83,68,44,.30)');g.fillStyle=rim;g.fillRect(0,0,c.width,c.height);
    const m=new T.CanvasTexture(c);m.colorSpace=T.SRGBColorSpace;m.anisotropy=6;
    return new T.MeshPhysicalMaterial({map:m,vertexColors:true,roughness:.55,clearcoat:.30,clearcoatRoughness:.32});
  }

  const finishes = {
    shell:shellFinish(),
    fabric: new T.MeshPhysicalMaterial({vertexColors:true,roughness:.77,map:clothPattern(),
      normalMap:weaveMap(TideWeave[0]),normalScale:new T.Vector2(.50,.50),
      roughnessMap:weaveMap(TideWeave[1]),clearcoat:.24,clearcoatRoughness:.37}),
    satin: new T.MeshStandardMaterial({vertexColors:true, roughness:.44, metalness:.13}),
    metal: new T.MeshStandardMaterial({vertexColors:true, roughness:.32, metalness:.6}),
    glass: new T.MeshStandardMaterial({vertexColors:true, roughness:.16, metalness:.52}),
    lamp: new T.MeshBasicMaterial({vertexColors:true, toneMapped:false}),
  };

  // A 15 cm swatch of rubberised cross-woven sailcloth. Dye, surface finish
  // and normals are separate so a passing lamp lights individual water beads.
  function rainSwatch(){
    const size=256, length=size*size, height=new Float32Array(length), drop=new Float32Array(length);
    const surface=new Uint8Array(length*4), normal=new Uint8Array(length*4);
    let seed=50712;
    const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
    const wrap=n=>(n+size)&255;
    for(let i=0;i<105;i++){
      const cx=random()*size,cy=random()*size,r=.7+random()**2*2.55;
      const tail=i%11===0?5+random()*8:0,ry=r*(1.05+random()*.55);
      for(let iy=Math.floor(-ry-1);iy<=ry+tail+1;iy++)for(let ix=Math.floor(-r-2);ix<=r+2;ix++){
        const y=Math.floor(cy)+iy,x=Math.floor(cx)+ix,dx=x-cx,dy=y-cy;
        const head=1-dx*dx/(r*r)-dy*dy/(ry*ry);
        const trace=tail&&dy>0&&dy<tail?Math.max(0,1-Math.abs(dx+.21*Math.sin(dy*.65))/.78)*(1-dy/tail)*.25:0;
        const k=wrap(y)*size+wrap(x);drop[k]=Math.max(drop[k],Math.sqrt(Math.max(0,head)),trace);
      }
    }
    for(let y=0;y<size;y++)for(let x=0;x<size;x++){
      const k=y*size+x,ax=x*TAU/size,ay=y*TAU/size;
      const X=x+.35*Math.sin(ay*7)+.15*Math.sin(ay*15),Y=y+.20*Math.sin(ax*8);
      const warp=Math.cos(TAU*X/4),weft=Math.cos(TAU*Y/4);
      const over=.5+.46*Math.sin(Math.PI*X/4)*Math.sin(Math.PI*Y/4);
      const thread=(warp*over+weft*(1-over))*.5+.5;
      const rip=Math.max(0,warp)*(Math.cos(TAU*X/32)>.87?1:0)+Math.max(0,weft)*(Math.cos(TAU*Y/32)>.87?1:0);
      const cloud=.5+.25*Math.sin(3*ax+.67*Math.cos(2*ay))+.25*Math.sin(2*ay+Math.sin(ax*3));
      const wet=drop[k],speck=random();
      height[k]=(.16*thread+.075*rip+.05*speck)*(1-wet)+wet*.65;
      surface[k*4]=Math.min(255,179+35*thread+10*rip+11*cloud+9*speck);
      surface[k*4+1]=Math.max(18,151+34*thread+25*cloud+6*speck-133*wet);
      surface[k*4+2]=Math.min(255,wet*255);surface[k*4+3]=255;
    }
    for(let y=0;y<size;y++)for(let x=0;x<size;x++){
      const i=(y*size+x)*4;
      const dx=(height[y*size+wrap(x-1)]-height[y*size+wrap(x+1)])*.96;
      const dy=(height[wrap(y-1)*size+x]-height[wrap(y+1)*size+x])*.96;
      const s=127.5/Math.hypot(dx,dy,1);
      normal[i]=127.5+dx*s;normal[i+1]=127.5+dy*s;normal[i+2]=127.5+s;normal[i+3]=255;
    }
    const tile=pixels=>{
      const tex=new T.DataTexture(pixels,size,size);tex.wrapS=tex.wrapT=T.RepeatWrapping;
      tex.minFilter=T.LinearMipmapLinearFilter;tex.magFilter=T.LinearFilter;tex.generateMipmaps=true;tex.anisotropy=4;tex.needsUpdate=true;return tex;
    };
    return {finish:tile(surface),normal:tile(normal)};
  }

  const coatSheet=new T.TextureLoader().load(TideJacketAtlas),swatch=rainSwatch();
  coatSheet.colorSpace=T.SRGBColorSpace;coatSheet.anisotropy=8;
  const jacket=new T.MeshPhysicalMaterial({vertexColors:true,map:coatSheet,normalMap:swatch.normal,
    roughnessMap:swatch.finish,normalScale:new T.Vector2(.82,.82),roughness:1,
    clearcoat:.85,clearcoatRoughness:.26,ior:1.46});
  jacket.name='Waxed raincloth and harness';
  jacket.onBeforeCompile=shader=>{
    shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nattribute vec4 tailoring;attribute float backPanel;attribute vec4 coating;varying vec4 garmentUV;varying vec4 garmentFinish;varying float panelMix;')
      .replace('#include <uv_vertex>','#include <uv_vertex>\ngarmentUV=tailoring;panelMix=backPanel;garmentFinish=coating;');
    shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying vec4 garmentUV;varying vec4 garmentFinish;varying float panelMix;')
      .replace('#include <map_fragment>',`
        vec3 finishTex=texture2D(roughnessMap,vRoughnessMapUv).rgb;
        float exposure=garmentFinish.x;
        float rub=garmentFinish.y;
        float web=garmentFinish.z;
        float bead=finishTex.b*exposure;float foldHeight=0.0;
        float wet=clamp(exposure*(.76+.20*finishTex.r)+bead*.41,0.0,1.0);
        if(web<.5){
          vec3 cloth=mix(texture2D(map,garmentUV.xy).rgb,texture2D(map,garmentUV.zw).rgb,panelMix);
          float value=dot(cloth,vec3(.2126,.7152,.0722));
          float dye=clamp(.16+3.45*value,.14,1.53);
          foldHeight=.00265*value*garmentFinish.w;
          wet=clamp(wet+.13*(1.0-smoothstep(.065,.20,value))*garmentFinish.w,0.0,1.0);
          diffuseColor.rgb*=mix(1.0,dye,garmentFinish.w)*(.85+.18*finishTex.r)*(1.04-.19*wet);
          diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.32,.32,.27),rub*.13);
        }else{
          float edge=min(garmentUV.x,1.0-garmentUV.x);
          float cord=1.0-smoothstep(.045,.125,edge);
          float stitch=(1.0-smoothstep(.018,.053,abs(edge-.16)))*(.48+.52*smoothstep(-.65,.35,cos(garmentUV.y*1570.8)));
          float ribs=cos(garmentUV.y*1700.0+3.0*abs(garmentUV.x-.5));
          ribs*=1.0-smoothstep(.00095,.0025,fwidth(garmentUV.y));
          diffuseColor.rgb*=.91+ribs*.105+cord*.22+stitch*.76;
        }
      `)
      .replace('#include <roughnessmap_fragment>','float roughnessFactor=clamp(finishTex.g*.37+.52-wet*.29+rub*.12-bead*.23+web*.08,.15,.92);')
      .replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
        vec3 coatDX=dFdx(-vViewPosition),coatDY=dFdy(-vViewPosition);
        vec3 crossX=cross(coatDY,normal),crossY=cross(normal,coatDX);
        float coatDet=dot(coatDX,crossX);
        vec3 gradient=crossX*dFdx(foldHeight)+crossY*dFdy(foldHeight);
        normal=normalize(normal-sign(coatDet)*gradient/max(abs(coatDet),.00000001));
      `)
      .replace('#include <clearcoat_normal_fragment_maps>','#include <clearcoat_normal_fragment_maps>\nclearcoatNormal=normalize(mix(nonPerturbedNormal,normal,.17+.75*bead));')
      .replace('#include <lights_physical_fragment>','#include <lights_physical_fragment>\nmaterial.clearcoat*=clamp(.11+wet*.72+bead*.35-web*.18-rub*.14,.04,1.0);material.clearcoatRoughness=clamp(.50-wet*.24-bead*.17+rub*.10+web*.09,.09,.55);');
  };
  finishes.jacket=jacket;
  function panelUV(point,panel,sign){
    let fx,bx,py;
    if(panel==='body'){
      fx=196-point.x*565;bx=577+point.x*565;
      py=T.MathUtils.clamp(487-(point.y+.108)*738,18,489);
      const narrow=T.MathUtils.smoothstep(py,54,108);
      const width=47+65*narrow,fit=.61+.39*narrow;
      fx=196+(fx-196)*fit;bx=577+(bx-577)*fit;
      fx=T.MathUtils.clamp(fx,196-width,196+width);bx=T.MathUtils.clamp(bx,577-width,577+width);
    }else{
      const upper=panel==='sleeve',t=T.MathUtils.clamp(upper?(.035-point.y)/.29:(.019-point.y)/.23,0,1);
      const offset=upper?118+31*t:149+13*t;
      fx=196-sign*offset-point.x*298;bx=577+sign*offset+point.x*298;
      py=upper?109+170*t:278+176*t;
      if(upper){
        const edge=11*(1-t),center=196-sign*offset;
        fx=T.MathUtils.clamp(fx,center-21+edge,center+21-edge);
        bx=T.MathUtils.clamp(bx,577+sign*offset-21+edge,577+sign*offset+21-edge);
      }
    }
    return [fx/768,1-py/512,bx/768,1-py/512];
  }

  // Shapes arrive in the local coordinates of their joint. Flatten them once;
  // the finished geometry and materials are shared by later character clones.
  class Batch {
    constructor(panel='body',sign=0) { this.parts=new Map();this.panel=panel;this.sign=sign; }

    add(shape, tint, finish, at, size, rotation) {
      const harness=finish==='webbing';
      if(harness)finish='jacket';
      let data = this.parts.get(finish);
      if (!data) {
        data = {position:[], normal:[], color:[], uv:[], tailoring:[], backPanel:[], coating:[], index:[]};
        this.parts.set(finish,data);
      }
      transform.position.fromArray(at);
      transform.scale.fromArray(size);
      transform.rotation.set(...(rotation || [0,0,0]));
      transform.updateMatrix();
      normalMatrix.getNormalMatrix(transform.matrix);
      const first = data.position.length/3;
      const a = shape.attributes;
      color.set(tint);
      for (let i=0;i<a.position.count;i++) {
        v.fromBufferAttribute(a.position,i).applyMatrix4(transform.matrix);
        n.fromBufferAttribute(a.normal,i).applyMatrix3(normalMatrix).normalize();
        data.position.push(v.x,v.y,v.z);
        data.normal.push(n.x,n.y,n.z);
        data.color.push(color.r,color.g,color.b);
        const u=a.uv?.getX(i)||0,w=a.uv?.getY(i)||0;
        if(finish==='jacket'){
          const body=this.panel==='body',upper=this.panel==='sleeve',sign=this.sign;
          if(harness){
            data.uv.push(u*.21,w/.15);data.tailoring.push(u,w,u,w);
            data.backPanel.push(0);data.coating.push(.37+.19*Math.max(0,n.y),.12,1,0);
          }else{
            const shell=body&&v.y<.481,outer=sign*n.x;
            data.uv.push(u*(body?6:upper?3:2)+(body?.10:sign*.22),(v.y+(upper?.43:body?.03:.17))/.15);
            data.tailoring.push(...panelUV(v,this.panel,this.sign));
            data.backPanel.push(T.MathUtils.smoothstep(n.z,-.53,.53));
            const hem=body?.08:upper?-.21:-.17;
            const edge=Math.exp(-Math.abs(v.y-hem)*30);
            const yoke=body?T.MathUtils.smoothstep(v.y,.29,.48):upper?T.MathUtils.smoothstep(v.y,-.16,.05):0;
            const pool=Math.max(0,n.y)*.54,distribution=.33+.13*Math.sin(v.x*24+v.y*11+v.z*31);
            const wet=T.MathUtils.clamp(distribution+.30*yoke+pool+.12*edge+.07*outer,0,1);
            const rub=T.MathUtils.clamp(.11+.24*edge+Math.max(0,outer)*.14+.08*Math.sin(v.y*48+v.z*24),0,.65);
            data.coating.push(wet,rub,0,body?(shell?1.0:.24):.57);
          }
        }else data.uv.push(u,w);
      }
      if (shape.index) {
        for (const i of shape.index.array) data.index.push(first+i);
      } else {
        for (let i=0;i<a.position.count;i++) data.index.push(first+i);
      }
    }

    oval(tint,at,size,finish='fabric',rot) { this.add(sphere,tint,finish,at,size,rot); }
    box(tint,at,size,finish='satin',rot) { this.add(cube,tint,finish,at,size,rot); }
    tube(tint,from,to,r,finish='metal') {
      const a=new T.Vector3().fromArray(from);
      const b=new T.Vector3().fromArray(to);
      const direction=b.clone().sub(a);
      const length=direction.length();
      const quat=new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),direction.normalize());
      const rot=new T.Euler().setFromQuaternion(quat);
      this.add(cylinder,tint,finish,a.lerp(b,.5).toArray(),[r,length,r],[rot.x,rot.y,rot.z]);
    }
    ring(tint,at,size,rot,thick=false,finish='satin') {
      this.add(thick?fatRing:cordRing,tint,finish,at,size,rot);
    }
    loft(tint,rings,finish='fabric',folds=0,offset=[0,0,0]) {
      const shape=ellipticLoft(rings,folds,finish==='jacket'?this.panel:null,this.sign);
      this.add(shape,tint,finish,offset,[1,1,1]);
      shape.dispose();
    }
    flush(group) {
      for (const [finish,d] of this.parts) {
        const shape = new T.BufferGeometry();
        shape.setAttribute('position',new T.Float32BufferAttribute(d.position,3));
        shape.setAttribute('normal',new T.Float32BufferAttribute(d.normal,3));
        shape.setAttribute('color',new T.Float32BufferAttribute(d.color,3));
        shape.setAttribute('uv',new T.Float32BufferAttribute(d.uv,2));
        if(d.tailoring.length){
          shape.setAttribute('tailoring',new T.Float32BufferAttribute(d.tailoring,4));
          shape.setAttribute('backPanel',new T.Float32BufferAttribute(d.backPanel,1));
          shape.setAttribute('coating',new T.Float32BufferAttribute(d.coating,4));
        }
        shape.setIndex(d.index);
        shape.computeBoundingSphere();
        const mesh = new T.Mesh(shape, finishes[finish]);
        mesh.castShadow=finish!=='lamp'; mesh.receiveShadow=true;
        group.add(mesh);
      }
    }
  }

  // A ring is [y, half-width, half-depth, center-z, center-x]. Fabric folds
  // stay aligned longitudinally through a sleeve, with a slight spiral at cuffs.
  // Tension follows the shoulder panel and the taped seams. The released cloth
  // forms slanted, interrupted compression folds near the belt and elbows.
  function oilskinRadius(a,h,panel,sign,folds){
    const arm=panel!=='body',side=arm?sign:1;
    const sideSeam=Math.sin(a);
    const face=Math.cos(a),outer=sideSeam*side;
    const ease=T.MathUtils.smoothstep, hem=1-ease(h,.09,.48);
    const tension=arm?1-ease(h,.70,.98):1-ease(h,.61,.95);
    const shift=.065*Math.sin(a*2+1.2)+.084*Math.sin(a-.4)*side;
    const waves=h*(arm?2.18:2.65)+shift+.12*Math.sin(h*5+sideSeam*1.4);
    const crest=Math.max(0,Math.cos(TAU*waves))**2.5;
    const shadow=Math.max(0,Math.cos(TAU*waves+.96))**2;
    const sector=.52+.44*Math.sin(a*2.0+h*6.8+.35*side);
    const gather=(.53*Math.sin(5*a+2.2*h)+.29*Math.sin(3*a-3.5*h))*(.39+hem*.79);
    const joint=arm?(.68+.32*outer):(.91-.19*face);
    const seam=Math.exp(-Math.min((sideSeam-.92)**2,(sideSeam+.92)**2)*58);
    const puckered=.055*Math.sin(a*3+h*3)+.054*Math.sin(a-h*2)+.065*outer;
    const diagonal=TAU*(h*(arm?2.7:3.65)+puckered);
    const ridge=Math.max(0,Math.cos(diagonal))**4;
    const hollow=Math.max(0,Math.cos(diagonal+.78))**3;
    return 1+folds*(gather+tension*joint*sector*(2.10*crest-.90*shadow)+seam*.23*Math.sin(h*TAU*13)+
      (arm?.74:.95)*(.36+hem*.73)*(1.65*ridge-.62*hollow));
  }

  function ellipticLoft(rings,folds,cut=null,sign=0) {
    const cloth=folds>0&&rings.length>5;
    const seg=cut?42:cloth?56:40,positions=[],uvs=[],indices=[];
    const original=rings;
    if(cloth){
      rings=[];
      for(let j=0;j<original.length-1;j++){
        const a=original[j],b=original[j+1],parts=Math.max(1,Math.ceil((b[0]-a[0])/(cut?.013:.009)));
        for(let m=0;m<parts;m++)rings.push(Array.from({length:5},(_,i)=>(a[i]||0)+((b[i]||0)-(a[i]||0))*m/parts));
      }
      rings.push(original.at(-1));
    }
    for (let j=0;j<rings.length;j++) {
      const [y,w,d,z=0,x=0]=rings[j];
      for (let k=0;k<=seg;k++) {
        const a=TAU*k/seg;
        const h=(y-rings[0][0])/(rings.at(-1)[0]-rings[0][0]||1);
        const gather=(1-h)*.64+.27;
        const seam=Math.sin(a*4.0+h*4.9)*.036+Math.sin(a*2.0-h*5)*.029;
        const diagonal=(h+seam+.11*Math.sin(a+.7))*Math.PI*8.0;
        const compression=Math.max(0,Math.cos(diagonal))**5;
        const f=cut?oilskinRadius(a,h,cut,sign,folds):1+folds*(.56*Math.sin(5*a+h*5)+.28*Math.sin(9*a-h*2)+
          (cloth?gather*(1.55*compression-.33*Math.cos(diagonal-.95)):0));
        positions.push(x+w*Math.sin(a)*f,y,z-d*Math.cos(a)*f);
        uvs.push(k/seg,(y-rings[0][0])/(rings.at(-1)[0]-rings[0][0]||1));
        if (j<rings.length-1 && k<seg) {
          const v0=j*(seg+1)+k, v1=v0+seg+1;
          indices.push(v0,v1,v0+1,v1,v1+1,v0+1);
        }
      }
    }
    for (let k=1;k<seg-1;k++) {
      const top=(rings.length-1)*(seg+1);
      indices.push(0,k,k+1,top,top+k+1,top+k);
    }
    const geo=new T.BufferGeometry();
    geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));
    geo.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));
    geo.setIndex(indices); geo.computeVertexNormals();
    if(cut){
      const normals=geo.attributes.normal,first=new T.Vector3(),last=new T.Vector3();
      for(let j=0;j<rings.length;j++){
        const start=j*(seg+1),end=start+seg;
        first.fromBufferAttribute(normals,start).add(last.fromBufferAttribute(normals,end)).normalize();
        normals.setXYZ(start,first.x,first.y,first.z);normals.setXYZ(end,first.x,first.y,first.z);
      }
    }
    return geo;
  }

  function joint(owner,name,x,y,z) {
    const group=new T.Group();
    group.name=name; group.position.set(x,y,z); owner.add(group);
    return group;
  }

  function torso(group,side) {
    const b=new Batch(), shell=shellColors[side], trim=colors[side];
    const body=[
      [-.108,.163,.127,.012],[-.093,.177,.136,.012],[-.079,.175,.132,.012],[-.055,.179,.135,.011],[-.027,.174,.132,.009],[.020,.169,.128,.008],
      [.075,.174,.137,.008],[.140,.154,.120,.007],[.220,.163,.120,.010],
      [.305,.189,.130,.011],[.386,.206,.125,.006],[.433,.196,.116],
      [.470,.147,.102],[.497,.085,.084]];
    b.loft(shell,body,'jacket',.055);
    const ease=T.MathUtils.smoothstep;
    function shellAt(x,y,back=false){
      let j=0;while(j<body.length-2&&body[j+1][0]<y)j++;
      const a=body[j],n=body[j+1],t=T.MathUtils.clamp((y-a[0])/(n[0]-a[0]),0,1);
      const width=a[1]+(n[1]-a[1])*t,depth=a[2]+(n[2]-a[2])*t;
      const h=(y-body[0][0])/(body.at(-1)[0]-body[0][0]);
      let f=1,angle=0;
      for(let k=0;k<4;k++){
        angle=Math.asin(T.MathUtils.clamp(x/(width*f),-.996,.996));
        if(back)angle=Math.PI-angle;
        f=oilskinRadius(angle,h,'body',0,.055);
      }
      return (a[3]||0)+((n[3]||0)-(a[3]||0))*t-depth*Math.cos(angle)*f;
    }
    const front=(x,y)=>shellAt(x,y)-.003;
    // Convex textile ribbons. Their edges, centre, webbing ribs and both rows
    // of thread have real width, including across the top of each shoulder.
    function ribbon(length,sample,tint){
      const pos=[],uv=[],idx=[],mid=new T.Vector3();let arc=0;
      for(let i=0;i<=length;i++){
        const t=i/length,center=sample(t,0),q=new T.Vector3().fromArray(center);
        if(i)arc+=mid.distanceTo(q);mid.copy(q);
        for(let k=0;k<=4;k++){
          const s=k*.5-1;pos.push(...sample(t,s));uv.push(k/4,arc);
          if(i<length&&k<4){const k0=i*5+k;idx.push(k0,k0+5,k0+1,k0+1,k0+5,k0+6);}
        }
      }
      const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));
      g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();
      b.add(g,tint,'webbing',[0,0,0],[1,1,1]);g.dispose();
    }
    function binding(points,radius,tint,finish='fabric'){
      const pos=[],uv=[],idx=[],rad=5;
      const p=new T.Vector3(),along=new T.Vector3(),across=new T.Vector3(),up=new T.Vector3(),ref=new T.Vector3();
      for(let i=0;i<points.length;i++){
        p.fromArray(points[i]);along.fromArray(points[Math.min(i+1,points.length-1)]).sub(ref.fromArray(points[Math.max(0,i-1)])).normalize();
        ref.set(0,0,1);if(Math.abs(along.z)>.93)ref.set(1,0,0);
        across.crossVectors(along,ref).normalize();up.crossVectors(along,across);
        for(let k=0;k<=rad;k++){
          const angle=k/rad*TAU,point=p.clone().addScaledVector(across,radius*Math.cos(angle)).addScaledVector(up,radius*Math.sin(angle));
          pos.push(...point.toArray());uv.push(k/rad,i*.13);
          if(i<points.length-1&&k<rad){const x=i*(rad+1)+k;idx.push(x,x+1,x+rad+1,x+1,x+rad+2,x+rad+1);}
        }
      }
      const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();b.add(g,tint,finish,[0,0,0],[1,1,1]);g.dispose();
    }
    // The lower hem turns back on itself. Its worn rim still catches a thin line of light.
    b.loft('#5c5d49',[[-.106,.168,.130,.012],[-.101,.172,.133,.012],[-.096,.176,.136,.012]],'jacket',.019);
    // Standing storm collar with an open throat and a dark textile lining.
    const collarPos=[],collarUV=[],collarIdx=[];const span=36;
    function collarPoint(k,l,inside){
      const gap=.095+.245*l, a=gap+(TAU-2*gap)*k/span;
      const frontEdge=T.MathUtils.smoothstep(Math.min(k,span-k),0,5);
      const w=(.108-.018*l)*(1+.017*l*Math.cos(3*a)),d=(.093-.012*l)*(1+.026*l*Math.sin(2*a));
      const height=.460+l*(.072-.016*Math.cos(a)+.005*Math.sin(a*2)-.012*(1-frontEdge));
      const r=inside?.962:1;
      return [r*Math.sin(a)*w,height,.008-r*Math.cos(a)*d];
    }
    for(const inside of [false,true]){
      collarPos.length=0;collarUV.length=0;collarIdx.length=0;
      for(let k=0;k<=span;k++)for(let j=0;j<=3;j++){
        collarPos.push(...collarPoint(k,j/3,inside));collarUV.push(k/span,j/3);
        if(k<span&&j<3){const n=k*4+j;collarIdx.push(...(inside?[n,n+4,n+1,n+4,n+5,n+1]:[n,n+1,n+4,n+4,n+1,n+5]));}
      }
      const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(collarPos,3));g.setAttribute('uv',new T.Float32BufferAttribute(collarUV,2));
      g.setIndex(collarIdx);g.computeVertexNormals();b.add(g,inside?'#515448':shell,inside?'fabric':'jacket',[0,0,0],[1,1,1]);g.dispose();
    }
    b.loft('#3b4943',[[.471,.113,.092,.008],[.484,.106,.089,.008],[.492,.095,.080,.007],[.500,.079,.067,.006],[.513,.070,.059,.006]],'fabric',.016);
    for(const k of [0,span])binding([collarPoint(k,0,false),collarPoint(k,.5,false),collarPoint(k,1,false)],.0018,side?'#42675e':'#92724e');
    binding(Array.from({length:span+1},(_,i)=>collarPoint(i,1,false)),.0017,side?'#55716a':'#8f754e');
    b.loft(shell,[[.362,.035,.012,.123],[.378,.077,.028,.125],[.396,.111,.041,.125],
      [.412,.143,.051,.115],[.431,.141,.050,.097],[.447,.139,.042,.092],[.463,.109,.036,.084],[.475,.083,.026,.080]],'jacket',.043);
    // A covered zip sits below the open collar. Only the slider and its loop are exposed.
    const seamColor=side?'#487974':'#a57643',pipeColor=side?'#405f59':'#826647';
    const run=(steps,fn)=>Array.from({length:steps+1},(_,i)=>fn(i/steps));
    const placket=run(28,t=>{
      const y=-.092+t*.561,x=.008+.0007*Math.sin(22*t);
      return [x,y,front(x,y)-.001];
    });
    ribbon(35,(t,e)=>{
      const y=-.092+t*.561,x=.003+e*.008;
      return [x,y,front(x,y)-.0022-.0008*(1-e*e)];
    },side?'#395f57':'#786144');
    binding(placket,.0016,seamColor);
    for(const s of [-1,1]){
      const yoke=(t,offset)=>{
        const y=.455-.090*t+.014*Math.sin(t*Math.PI)+offset,x=s*(.073+.107*t);
        return [x,y,shellAt(x,y)-.0012];
      };
      for(const range of [[0,.19],[.74,.93]]){
        const span=range[1]-range[0];
        binding(run(6,t=>yoke(range[0]+span*t,0)),.00095,seamColor);
        binding(run(6,t=>yoke(range[0]+span*t,.0028)),.00055,pipeColor);
      }
      ribbon(11,(t,e)=>{
        const x=s*(.048+.063*t),y=.188+.015*t-s*e*.0033;
        return [x,y,shellAt(x,y)-.0017];
      },side?'#4b635a':'#85704f');
    }
    b.box('#837b63',[.004,.402,front(.004,.402)-.006],[.011,.017,.005],'metal');
    b.tube('#70644e',[.005,.398,front(.005,.398)-.012],[.012,.369,front(.012,.369)-.008],.0025,'metal');
    const belt=.076;
    // At the side and over the pack anchors, the belt follows the jacket folds.
    ribbon(74,(t,e)=>{
      const a=-t*TAU,yy=belt+e*.013-.003*Math.cos(2*a);
      const h=(yy-body[0][0])/(body.at(-1)[0]-body[0][0]);
      const f=oilskinRadius(a,h,'body',0,.055);
      const upper=yy>.075,portion=upper?(yy-.075)/.065:(yy-.02)/.055;
      const w=upper?.174-.020*portion:.169+.005*portion,d=upper?.137-.017*portion:.128+.009*portion;
      return [Math.sin(a)*(w*f+.0035),yy,.008-Math.cos(a)*(d*f+.0035)];
    },'#36403c');
    b.box('#81877a',[0,belt,-.143],[.038,.030,.010],'metal');
    b.box('#424b45',[0,belt,-.149],[.025,.017,.004],'satin');
    for(const s of [-1,1]){
      const center=y=>s*(.145-.023*ease(y,.065,.425));
      const start=.083,end=.469;
      const strapPoint=(y,e,back=false)=>{
        const x=center(y)+e*.017;
        return [x,y,shellAt(x,y,back)+(back?1:-1)*(.0042+.0021*(1-e*e))];
      };
      ribbon(50,(t,e)=>{
        if(t<.43)return strapPoint(start+(end-start)*t/.43,e);
        if(t>.57)return strapPoint(end-(end-.11)*(t-.57)/.43,e,true);
        const u=(t-.43)/.14,frontEnd=strapPoint(end,e),rearEnd=strapPoint(end,e,true);
        const x=frontEnd[0],z=frontEnd[2]+(rearEnd[2]-frontEnd[2])*u;
        let lo=end,hi=.502;
        for(let k=0;k<9;k++){
          const m=(lo+hi)*.5,w=.147-(m-.470)/.027*.062;
          if(Math.abs(x)<w&&z>=shellAt(x,m)&&z<=shellAt(x,m,true))lo=m;else hi=m;
        }
        return [x,lo+.0036*Math.sin(u*Math.PI),z];
      },'#36403c');
      // Reflective yarn is sewn into the strap and sits on the same surface.
      ribbon(8,(t,e)=>{
        const y=.319+t*.057,x=center(y)+e*.009;
        return [x,y,front(x,y)-.0064+.0005*e*e];
      },'#aeb9ab');
      const yy=.177,cx=center(yy),z=front(cx,yy)-.010;
      for(const a of [-1,1]){
        b.tube('#777e71',[cx-.018,yy+a*.009,z],[cx+.018,yy+a*.009,z],.0024,'metal');
        b.tube('#777e71',[cx+a*.018,yy-.009,z],[cx+a*.018,yy+.009,z],.0024,'metal');
      }
      b.tube('#626c60',[cx-.015,yy-.001,z-.002],[cx+.015,yy+.001,z-.002],.0021,'metal');
    }
    // A canvas tool roll versus the signal operator's field radio.
    if (side===0) {
      b.oval('#665544',[0,.241,.14],[.130,.171,.079]);
      b.box('#5a5346',[0,.251,.167],[.228,.227,.083],'fabric');
      b.oval('#806c53',[0,.336,.185],[.125,.054,.052]);
      b.tube('#303636',[-.111,.180,.207],[.111,.180,.207],.012,'fabric');
      b.box('#9b794d',[0,.227,.216],[.065,.037,.008],'satin');
      for(const s of [-1,1]) {
        b.box('#545746',[s*.072,.215,.209],[.020,.175,.016],'fabric');
        b.box(steel,[s*.072,.202,.223],[.031,.029,.009],'metal');
      }
      b.oval('#655541',[.146,.03,.016],[.045,.083,.065]);
      b.tube('#a4aba2',[.164,.02,.028],[.177,.17,.051],.012);
    } else {
      b.box('#35494a',[0,.255,.159],[.201,.268,.089],'satin');
      b.box('#455a56',[0,.287,.213],[.171,.125,.025],'metal');
      for(let k=0;k<8;k++)
        b.box('#273635',[0,.242+k*.012,.230],[.13,.005,.003],'satin');
      b.box('#acc7b3',[.016,.352,.212],[.070,.028,.004],'satin');
      b.tube('#414d47',[-.067,.371,.156],[-.091,.613,.170],.007);
      b.oval('#232f31',[-.092,.616,.170],[.009,.014,.009],'satin');
      b.box('#677c70',[0,.156,.211],[.118,.042,.010],'satin');
      b.tube('#36423f',[.085,.366,.165],[.143,.380,.116],.008,'fabric');
      b.tube('#36423f',[.143,.380,.116],[.158,.418,.028],.008,'fabric');
      b.tube('#36423f',[.158,.418,.028],[.135,.379,-.107],.008,'fabric');
      b.box('#273f41',[.135,.371,-.111],[.049,.083,.037],'satin',[0,-.2,-.15]);
      b.box('#c9c3a7',[.135,.389,-.133],[.031,.008,.006],'satin');
    }
    b.flush(group);
  }

  function head(group,side) {
    const b=new Batch();
    TideCrew.face(group,side);
    const helmet=joint(group,'helmet',0,.012,0);
    for(const sign of [-1,1]){
      b.tube('#363c38',[sign*.080,.177,-.019],[sign*.066,.067,-.029],.003,'fabric');
      b.tube('#363c38',[sign*.066,.067,-.029],[sign*.035,.038,-.045],.0027,'fabric');
    }
    b.flush(group);
    const shell=new Batch();
    const hat=side?'#d4d4c4':'#d5a453';
    shell.loft('#35332d',[[.151,.087,.080,.010],[.163,.096,.092,.010],[.184,.093,.088,.008]],'fabric');
    shell.loft(hat,[[.158,.096,.089,.009],[.160,.102,.097,.007],[.169,.104,.101,.008],
      [.181,.104,.102,.009],[.196,.102,.099,.009],[.212,.096,.094,.011],[.227,.084,.084,.012],
      [.239,.069,.071,.013],[.247,.050,.056,.013],[.252,.029,.035,.011],[.254,.008,.015,.010]],'shell');
    shell.oval(hat,[0,.163,-.023],[.108,.0057,side?.097:.116],'shell',[.027,0,0]);
    shell.loft('#3d4946',[[.175,.105,.103,.009],[.184,.106,.104,.010]],'fabric');
    for(const s of [-1,1]){
      for(let j=0;j<7;j++){
        const a=-.83+j*.23,b=a+.23;
        const p=t=>[s*(.034+.010*Math.cos(t)),.246-.018*Math.sin(t)**2,.011+.082*Math.sin(t)];
        shell.tube(hat,p(a),p(b),.0034,'shell');
      }
      for(let j=0;j<3;j++){
        const z=-.020+j*.016;
        shell.oval('#565a50',[s*.097,.202,z],[.002,.0035,.006],'satin',[.15,0,0]);
      }
      shell.box(pale,[s*.103,.186,.026],[.0025,.009,.044],'shell',[0,s*.15,s*.15]);
      shell.box('#605c4e',[s*.104,.173,-.020],[.004,.020,.023],'metal');
      shell.oval('#c0bbb0',[s*.107,.174,-.020],[.002,.003,.003],'metal');
    }
    shell.box('#37423f',[0,.187,-.092],[.049,.032,.018],'satin',[.085,0,0]);
    shell.tube('#728079',[0,.187,-.099],[0,.187,-.113],.018,'metal');
    shell.ring('#2c3938',[0,.187,-.113],[.014,.014,.013],[0,0,0],true,'satin');
    shell.oval('#acae96',[0,.187,-.113],[.012,.012,.003],'glass');
    shell.oval('#fff4cd',[0,.187,-.116],[.0048,.0048,.002],'lamp');
    for(const s of [-1,1])shell.box('#a7b3a4',[s*.020,.189,-.103],[.0025,.012,.0027],'metal');
    shell.flush(helmet);joint(helmet,'headlamp',0,.187,-.121);
  }

  function leg(hip,knee,ankle,sign,side) {
    const b=new Batch();
    const pant=side?'#38484b':'#414443';
    b.loft(pant,[[-.418,.057,.064,.002],[-.384,.068,.070,.003],[-.347,.069,.074,.005],[-.328,.076,.080,.006],[-.292,.067,.072,.007],[-.279,.075,.079,.005],[-.237,.073,.078],
      [-.116,.089,.095,.003],[-.035,.095,.103,.004],[.045,.083,.092,.008]],'fabric',.055);
    b.oval('#4d5550',[sign*.060,-.157,.009],[.030,.088,.067]);
    b.tube('#85897d',[sign*.087,-.117,-.042],[sign*.086,-.116,.052],.005,'satin');
    b.flush(hip);
    const c=new Batch();
    c.loft(pant,[[-.345,.056,.062,.004],[-.315,.061,.064,.005],[-.299,.057,.060,.005],[-.286,.066,.068,.005],[-.205,.064,.075,.014],
      [-.138,.073,.082,.018],[-.066,.065,.068,.006],[.038,.070,.073,.009]],'fabric',.06);
    c.oval('#424b49',[0,-.018,-.047],[.057,.079,.030],'satin');
    c.loft('#adb29b',[[-.218,.068,.071,.013],[-.195,.069,.075,.015]],'satin');
    c.flush(knee);
    const d=new Batch();
    d.oval(rubber,[0,.009,-.044],[.075,.068,.144],'satin');
    d.box('#272d2c',[0,-.035,-.054],[.137,.031,.217],'satin');
    d.oval('#414745',[0,.038,-.073],[.065,.034,.074],'satin');
    for(let j=0;j<3;j++) d.tube('#6b6657',[-.034,.060,-.052-j*.018],[.033,.060,-.056-j*.018],.003,'fabric');
    d.flush(ankle);
  }

  // A single morph folds the three spare
  // fingers about their two knuckles while straightening the index finger.
  function fingerFrame(i,sign,distal){
    const index=i===(sign===1?3:0),x=(i-1.5)*.0172;
    const angle=index?-.273:.73+.095*Math.abs(i-1.5);
    const origin=new T.Vector3(x,-.067,-.002),knuckle=new T.Vector3(x,-.092,-.009);
    const base=new T.Matrix4().makeTranslation(origin.x,origin.y,origin.z)
      .multiply(new T.Matrix4().makeRotationX(angle)).multiply(new T.Matrix4().makeTranslation(-origin.x,-origin.y,-origin.z));
    if(!distal)return base;
    const moved=knuckle.clone().applyMatrix4(base);
    // The extended distal phalanx follows the finished index's centreline.
    const distalAngle=index?-Math.atan2(.0098,.0248):1.78;
    return new T.Matrix4().makeTranslation(moved.x,moved.y,moved.z)
      .multiply(new T.Matrix4().makeRotationX(distalAngle))
      .multiply(new T.Matrix4().makeTranslation(-knuckle.x,-knuckle.y,-knuckle.z));
  }

  // One swatch, one material, four gloves. The two halves of this weatherproof
  // hide/cloth swatch have different grains, highlights and moisture uptake.
  function workGloveFinish(){
    const size=256,half=size/2,heights=new Float32Array(size*size),base=new Uint8Array(size*size*4),normal=new Uint8Array(size*size*4);
    const hash=(x,y)=>{let n=Math.imul(x+37,1597334677)^Math.imul(y+71,3812015801);n^=n>>>14;n=Math.imul(n,1103515245);return (n>>>0)/4294967296;};
    const wrap=(p,n)=>(p%n+n)%n;
    for(let y=0;y<size;y++)for(let x=0;x<size;x++){
      const i=y*size+x,cloth=x>=half,u=x%half,g=hash(u,y);
      const xx=u/5,yy=y/5,ix=Math.floor(xx),iy=Math.floor(yy);
      let d0=5,d1=5;
      for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
        const cx=ix+dx,cy=iy+dy;
        const px=cx+.09+.82*hash(cx%26,cy%51),py=cy+.09+.82*hash((cx+13)%26,(cy+29)%51);
        const dst=(xx-px)*(xx-px)+(yy-py)*(yy-py);
        if(dst<d0){d1=d0;d0=dst;}else if(dst<d1)d1=dst;
      }
      const valley=Math.exp(-5.7*Math.abs(Math.sqrt(d1)-Math.sqrt(d0))),mottling=Math.sin(u*.099+.55*Math.sin(y*.069))*Math.cos(y*.082);
      const warp=(1+Math.cos(Math.PI*.5*u+.36*Math.sin(TAU*y/32)))*.5,
        fill=(1+Math.cos(TAU*y/3.2+.20*Math.cos(TAU*u/32)))*.5,over=((u>>2)+(y>>2))%2;
      heights[i]=cloth?.19+(over?.45*warp+.15*fill:.16*warp+.44*fill)+.102*g:.61-.28*valley+.19*g+.064*mottling;
      const tone=cloth?206+13*(warp+fill-1)+13*g:213-24*valley+17*g+9*mottling;
      const rough=cloth?241-11*warp:202+25*valley+9*mottling;
      base.set([tone,tone,Math.max(0,tone-2),rough],i*4);
    }
    for(let y=0;y<size;y++)for(let x=0;x<size;x++){
      const offset=x<half?0:half,u=x%half;
      const sample=(xx,yy)=>heights[wrap(yy,size)*size+offset+wrap(xx,half)];
      const nx=(sample(u-1,y)-sample(u+1,y))*1.28,ny=(sample(u,y-1)-sample(u,y+1))*1.28,s=1/Math.hypot(nx,ny,1);
      normal.set([Math.round(127.5*(1+nx*s)),Math.round(127.5*(1+ny*s)),Math.round(127.5*(1+s)),255],4*(y*size+x));
    }
    const swatch=(pixels,srgb)=>{
      const tx=new T.DataTexture(pixels,size,size,T.RGBAFormat);tx.wrapS=tx.wrapT=T.RepeatWrapping;
      tx.colorSpace=srgb?T.SRGBColorSpace:T.NoColorSpace;tx.magFilter=T.LinearFilter;tx.generateMipmaps=true;tx.minFilter=T.LinearMipmapLinearFilter;tx.anisotropy=4;tx.needsUpdate=true;return tx;
    };
    const mat=new T.MeshPhysicalMaterial({vertexColors:true,map:swatch(base,true),normalMap:swatch(normal,false),
      normalScale:new T.Vector2(.58,.58),roughness:1,metalness:0,clearcoat:.095,clearcoatRoughness:.41});
    mat.name='驾驶与机修 · 湿鞣皮与棉帆布';
    mat.onBeforeCompile=s=>{
      s.fragmentShader=s.fragmentShader.replace('#include <map_fragment>','vec4 gloveSwatch=texture2D(map,vMapUv);diffuseColor.rgb*=gloveSwatch.rgb;')
        .replace('#include <roughnessmap_fragment>','float roughnessFactor=gloveSwatch.a;');
    };
    mat.customProgramCacheKey=()=>'tide-continuous-workglove-28';return mat;
  }

  function workGlove(wrist,sign,side){
    const material=finishes.workGlove||(finishes.workGlove=workGloveFinish());
    const pos=[],curl=[],pressed=[],rgb=[],uv=[],indices=[];
    const rayRoot=new T.Vector3(),rayTip=new T.Vector3();
    const rest=new T.Vector3(),p0=new T.Vector3(),p1=new T.Vector3(),c=new T.Color();
    const poses=Array.from({length:4},(_,i)=>[fingerFrame(i,sign,false),fingerFrame(i,sign,true)]);
    const smooth=T.MathUtils.smoothstep,clamp=T.MathUtils.clamp,mix=T.MathUtils.lerp;
    const lerpArr=(rings,y)=>{
      const k=rings.findIndex(r=>r[0]>=y);
      if(k<=0)return rings[k<0?rings.length-1:0];
      const a=rings[k-1],b=rings[k],t=(y-a[0])/(b[0]-a[0]);return a.map((a0,i)=>mix(a0,b[i],t));
    };
    const dorsal=side?'#787869':'#797564',hide=side?'#79745e':'#827359',gusset=side?'#5f6354':'#666151';
    const patch=side?'#6b7368':'#716e5b',thread=side?'#9b9980':'#ab9878',stain='#5d5c4e';
    function point(x,y,z,tint,cloth,u,vv,digit=-1,fade=1){
      rest.set(x,y,z);pos.push(x,y,z);p0.copy(rest);
      if(digit>=0){
        const [prox,dist]=poses[digit];p1.copy(rest).applyMatrix4(prox);
        p0.lerp(p1,smooth(-y,.054,.078));p1.copy(rest).applyMatrix4(dist);p0.lerp(p1,smooth(-y,.085,.100));
      }
      curl.push(p0.x,p0.y,p0.z);
      // This is the contact convention used by the fender climb and brass plate.
      const zBelow=Math.max(0,-.012-z),splay=.10*smooth(-y,.052,.107);
      pressed.push(x*(1+splay),y,(zBelow?-.012-.011*(1-Math.exp(-zBelow/.0055)):z)-.024*smooth(-y,.012,.046));
      c.set(tint);rgb.push(c.r*fade,c.g*fade,c.b*fade);
      uv.push((cloth?.555:.055)+.39*u,vv);
      return pos.length/3-1;
    }
    const pair=(a,b,c,d,flip=false)=>{if(flip)indices.push(a,c,b,a,d,c);else indices.push(a,b,c,a,c,d);};
    // All ring arrays run from distal to proximal, with +Z on the back of
    // the glove. Low knuckle relief is continuous across the skin of each tube.
    function sleeve(rings,lookup,n=20){
      const start=pos.length/3;
      for(let j=0;j<rings.length;j++)for(let i=0;i<=n;i++){
        const a=TAU*i/n,out=lookup(rings[j],a,j);
        point(...out);
        if(i<n&&j<rings.length-1){const k=start+j*(n+1)+i;pair(k,k+1,k+n+2,k+n+1);}
      }
      // The distal welt closes over the final pad. Adjacent skin shares these
      // vertices, including both absolute deformation targets.
      for(let i=1;i<n-1;i++)indices.push(start,start+i+1,start+i);
    }
    const palm=[[-.084,.014,.006,-.007],[-.081,.031,.011,-.005],[-.075,.037,.015,-.0038],[-.066,.0394,.018,-.0025],[-.053,.0413,.021,-.0015],[-.039,.0408,.0223,.0001],[-.027,.0384,.0225,.001],[-.015,.0347,.020,.0018],[-.004,.0305,.019,.0015],[.009,.029,.019,.0005],[.019,.0282,.019,.0002]];
    const exp=(v,p)=>Math.sign(v)*Math.pow(Math.abs(v),p);
    function backZ(x,y){
      const r=lerpArr(palm,y),d=clamp(x/r[1],-.999,.999);
      return r[3]+r[2]*Math.pow(Math.max(0,1-Math.pow(Math.abs(d),2/.78)),.78/2);
    }
    sleeve(palm,(r,a)=>{
      const si=Math.sin(a),co=Math.cos(a),isBack=co>.02,y=r[0],x=r[1]*exp(si,.78),z=r[3]+r[2]*exp(co,.78);
      const tint=y>-.009?gusset:isBack?dorsal:hide;
      return [x,y,z,tint,isBack,(a/TAU),y*9+.71,-1,.99+.044*Math.sin(4*a+y*71)];
    },36);
    function strip(line,width,tint,cloth,digit=-1,lift=.0002){
      const first=pos.length/3;
      for(let i=0;i<line.length;i++){
        const a=line[Math.max(0,i-1)],b=line[Math.min(line.length-1,i+1)],p=line[i],len=Math.hypot(b[0]-a[0],b[1]-a[1])||1;
        const dx=(b[1]-a[1])/len*width/2,dy=-(b[0]-a[0])/len*width/2;
        point(p[0]-dx,p[1]-dy,p[2]+lift,tint,cloth,.20,i*.12,digit);
        point(p[0]+dx,p[1]+dy,p[2]+lift,tint,cloth,.24,i*.12,digit);
        if(i){const k=first+2*i;pair(k-2,k-1,k+1,k);}
      }
    }
    // A crescent yoke and two long curved seams follow the actual domed back
    // and wrap toward the thumb. The panel is under a millimetre proud.
    const rows=[[-.075,.020],[-.072,.030],[-.067,.034],[-.061,.035],[-.055,.036],[-.048,.0355],[-.037,.0332],[-.024,.0285],[-.018,.022],[-.016,.012]];
    const panelStart=pos.length/3;
    function yoke(x,y,w){
      return backZ(x,y)+.0005+.0015*Math.max(0,1-(x/w)**2)+.0005*Math.cos((y+.05)*101);
    }
    for(let j=0;j<rows.length;j++){
      const [y,w]=rows[j];
      for(let i=0;i<=12;i++){
        const t=i/12,x=(2*t-1)*w,yy=y-.0017*Math.cos(Math.PI*x/w);
        point(x,yy,yoke(x,yy,w),patch,true,t,yy*9,-1,.98+.05*Math.sin(t*Math.PI));
        if(j&&i){const v=panelStart+j*13+i;pair(v-14,v-13,v,v-1);}
      }
    }
    for(const s of [-1,1]){
      const yokeEdge=rows.map(([yy,w])=>{const y=yy+.0017,x=s*w;return [x,y,yoke(x,y,w)];});
      strip(yokeEdge,.0013,stain,false);
      const stitch=(a,b,i)=>{const p=(k,j)=>mix(a[j],b[j],k);return [[p(.18,0)-s*.0017,p(.18,1),p(.18,2)+.0005],[p(.69,0)-s*.0017,p(.69,1),p(.69,2)+.0005]];};
      for(let j=1;j<yokeEdge.length;j++)strip(stitch(yokeEdge[j-1],yokeEdge[j],j),.00065,thread,false);
    }
    const widths=[.0082,.0090,.0092,.0085],maxLengths=[.109,.1184,.122,.1168];
    for(let i=0;i<4;i++){
      const radial=sign>0?i:3-i,index=radial===3,x=(i-1.5)*.0172;
      const r=widths[radial],tip=maxLengths[radial];
      const rings=[
        [-tip,.0014,.0017,-.0188],
        [-tip+.0022,r*.67,.0044,-.0190],
        [-tip+.0048,r*.86,.00615,-.0190],
        [-.1105,r*.96,.00750,-.01950],
        [-.1052,r*1.02,.0081,-.0173],[-.0980,r*1.05,.0084,-.0130],[-.0943,r*.99,.0082,-.0108],
        [-.0920,r*.98,.0083,-.0095],[-.0894,r*1.05,.0087,-.0084],[-.0864,r*1.07,.0089,-.0075],
        [-.0811,r*1.04,.0090,-.0060],[-.0765,r*1.02,.010,-.0044],[-.071,r*1.08,.012,-.0028],
        [-.064,r*1.12,.0136,-.0018],[-.059,r,.012,-.0011]
      ].filter((q,j)=>j<3||q[0]>-tip+.0049).sort((a,b)=>a[0]-b[0]);
      // Keep the historically calibrated pad as an actual vertex even when a
      // neighbouring finger is shorter. The -X centre slot is used by the helm.
      if(i===1&&!rings.some(q=>q[0]===-.1105))rings.push([-.1105,r*.95,.00750,-.01950]);
      rings.sort((a,b)=>a[0]-b[0]);
      const fingerStart=pos.length/3;
      sleeve(rings,(q,a)=>{
        const [y,rx,rz,cz]=q,si=Math.sin(a),co=Math.cos(a),edge=Math.abs(si);
        const t=smooth(-y,.068,.112),shift=i===1?0:(i-1.5)*.00049*t;
        const xx=x+shift+rx*exp(si,.88),zz=cz+rz*exp(co,.87);
        const tone=co>.25?(y<-.094?hide:patch):edge>.87?gusset:hide;
        const crease=(.5+.5*Math.cos(a*2))*Math.exp(-(((y+.092)/.0028)**2));
        return [xx,y,zz,tone,co>.25&&y>-.094,a/TAU,y*10.3+i*.17,i,1.05-.073*crease+.022*Math.cos(3*a+39*y)];
      },20);
      if(index){
        // Opposite vertices of an actual cross-section locate the fabric's
        // pointing axis, even with a curved fingertip and a shallow side welt.
        const center=(j,out)=>{
          const a=3*(fingerStart+21*j),b=a+30;
          return out.set((curl[a]+curl[b])*.5,(curl[a+1]+curl[b+1])*.5,(curl[a+2]+curl[b+2])*.5);
        };
        center(rings.findIndex(q=>q[0]===-.071),rayRoot);center(0,rayTip);
      }
      // Edge stitching runs along the welt instead of dividing a digit into
      // rings. Two short flexible folds dimple the dorsal face above the joint.
      for(const s of [-1,1]){
        const nodes=rings.filter(r=>r[0]<-.069&&r[0]>-tip+.0022).map(q=>{
          const [y,rx,rz,cz]=q,sh=i===1?0:(i-1.5)*.00049*smooth(-y,.068,.112);
          return [x+sh+s*.811*rx,y,cz+.704*rz];
        });
        strip(nodes,.0010,stain,false,i,.00023);
        for(let j=2;j<nodes.length;j+=2)strip([nodes[j-1],nodes[j]],.00056,thread,false,i,.00040);
      }
      for(const yy of [-.0895,-.0942]){
        const q=lerpArr(rings,yy),line=[];
        for(let k=0;k<=5;k++){
          const xx=(k/5-.5)*1.02*q[1],y=yy+.00155*(xx/q[1])**2+sign*.00026*k;
          const qr=lerpArr(rings,y),co=Math.pow(1-Math.min(.999,(Math.abs(xx)/qr[1])**(2/.88)),.87/2);
          line.push([x+xx,y,qr[3]+qr[2]*co+.00014]);
        }
        strip(line,.00065,stain,false,i,.00015);
      }
    }
    // The thenar gusset widens into the thumb, rather than leaving a second
    // disconnected tube on the outside of the palm.
    const thumb=[
      [-.079,.0020,.0026,-.033,.0338],[-.0773,.0067,.0069,-.0335,.0341],[-.073,.0097,.0088,-.033,.0356],
      [-.067,.0108,.0093,-.0298,.0392],[-.061,.0113,.0107,-.0263,.0426],[-.056,.0119,.0112,-.0229,.0437],
      [-.050,.0131,.0127,-.0188,.0420],[-.044,.0142,.015,-.0144,.0380],[-.037,.0145,.016,-.011,.0330],
      [-.031,.013,.0163,-.0087,.0284],[-.026,.011,.014,-.007,.0250],[-.022,.005,.007,-.005,.0240]
    ];
    sleeve(thumb,(q,a)=>{
      const [y,rx,rz,cz,cx]=q,co=Math.cos(a),si=Math.sin(a),x=sign*cx+rx*si,z=cz+rz*co;
      return [x,y,z,co>.54?dorsal:hide,co>.54,a/TAU,y*8+.38,-1,.965+.055*Math.cos(a+y*27)];
    },24);
    const thumbSeam=thumb.slice(1,-1).map(([y,rx,rz,cz,cx])=>[sign*(cx+.40*rx),y,cz+.925*rz]);
    strip(thumbSeam,.00112,gusset,false);
    for(let j=2;j<thumbSeam.length;j+=2)strip([thumbSeam[j-1],thumbSeam[j]],.00067,thread,false,-1,.00042);

    function geometry(p){
      const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setIndex(indices);g.computeVertexNormals();
      // Seam vertices have separate UVs. Average exactly coincident normals so
      // grazing sun does not draw an artificial meridian across the fingertip.
      const attr=g.attributes.normal,merged=new Map(),keys=[];
      for(let i=0;i<attr.count;i++){
        const key=Math.round(p[3*i]*1e6)+','+Math.round(p[3*i+1]*1e6)+','+Math.round(p[3*i+2]*1e6);keys.push(key);
        let n=merged.get(key);if(!n)merged.set(key,n=new T.Vector3());n.add(p0.fromBufferAttribute(attr,i));
      }
      merged.forEach(n=>n.normalize());for(let i=0;i<keys.length;i++){const n=merged.get(keys[i]);attr.setXYZ(i,n.x,n.y,n.z);}
      return g;
    }
    const base=geometry(pos),bent=geometry(curl),flat=geometry(pressed);
    base.morphAttributes.position=[bent.attributes.position,flat.attributes.position];base.morphAttributes.normal=[bent.attributes.normal,flat.attributes.normal];
    base.setAttribute('color',new T.Float32BufferAttribute(rgb,3));base.setAttribute('uv',new T.Float32BufferAttribute(uv,2));base.computeBoundingSphere();
    base.userData.pointBase=rayRoot;base.userData.pointAxis=rayTip.sub(rayRoot).normalize();
    bent.dispose();flat.dispose();const mesh=new T.Mesh(base,material);mesh.name='workGlove';mesh.castShadow=mesh.receiveShadow=true;wrist.add(mesh);
  }

  function arm(shoulder,elbow,wrist,sign,side) {
    const b=new Batch('sleeve',sign), shell=shellColors[side];
    const upper=[[-.259,.051,.052,-.003],[-.245,.057,.060,-.003],[-.229,.054,.055,-.001],[-.212,.060,.063,.002],[-.172,.058,.065,.003],[-.130,.065,.071,.002],[-.074,.072,.075,.003],[-.033,.080,.082,.004],[.006,.074,.076,.003],[.031,.060,.060,.003],[.047,.038,.037,.003],[.054,.010,.012,.003]];
    for(const ring of upper)ring[4]=-sign*.023*T.MathUtils.smoothstep(ring[0],-.029,.053);
    b.loft(shell,upper,'jacket',.065);
    // Stitched reflective band follows the sleeve rather than piercing it at a fold.
    const band=(y,w,d)=>{
      const pos=[],uv=[],index=[],count=40;
      for(let j=0;j<3;j++)for(let k=0;k<=count;k++){
        const a=TAU*k/count,yy=y+(j-1)*.008+.004*Math.sin(a-.5);
        let q=0;while(q<upper.length-2&&upper[q+1][0]<yy)q++;
        const r=upper[q],s=upper[q+1],t=(yy-r[0])/(s[0]-r[0]);
        const h=(yy-upper[0][0])/(upper.at(-1)[0]-upper[0][0]),f=oilskinRadius(a,h,'sleeve',sign,.065);
        pos.push(Math.sin(a)*((r[1]+(s[1]-r[1])*t)*f+w),yy,(r[3]||0)+((s[3]||0)-(r[3]||0))*t-Math.cos(a)*((r[2]+(s[2]-r[2])*t)*f+d));
        uv.push(k/count,j*.5);
        if(j<2&&k<count){const n=j*(count+1)+k;index.push(n,n+count+1,n+1,n+count+1,n+count+2,n+1);}
      }
      const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(index);g.computeVertexNormals();
      b.add(g,'#b5c1ad','satin',[0,0,0],[1,1,1]);g.dispose();
    };
    band(-.143,.0015,.0015);
    b.box('#424f4a',[sign*.066,-.103,.003],[.007,.043,.042],'fabric',[0,0,sign*.08]);
    b.flush(shoulder);
    const c=new Batch('forearm',sign);
    c.loft(shell,[[-.216,.038,.041,-.003],[-.204,.046,.049,-.003],[-.190,.046,.051,-.003],[-.181,.043,.047,-.001],[-.166,.050,.052],[-.149,.049,.054,.002],[-.118,.053,.056,.003],[-.065,.057,.063,.004],[-.010,.056,.062,.002],[.013,.054,.055],[.029,.045,.045],[.039,.030,.029],[.041,.013,.015]],'jacket',.068);
    c.loft('#414d46',[[-.217,.039,.042,-.003],[-.212,.041,.045,-.003],[-.207,.041,.045,-.003]],'fabric',.016);
    c.loft('#686552',[[-.197,.0465,.0505,-.003],[-.193,.0475,.0525,-.003],[-.188,.0475,.0525,-.002]],'fabric',.018);
    c.oval('#686954',[sign*.047,-.190,-.003],[.0035,.006,.006],'fabric');
    c.flush(elbow);
    workGlove(wrist,sign,side);
  }

  const badgeTextures=new Map();
  function plaque(parent,lines,paint,at,rot,width,height) {
    const key=lines.join('|')+paint.join('|');
    let material=badgeTextures.get(key);
    if(!material) {
      const canvas=document.createElement('canvas');canvas.width=512;canvas.height=192;
      const ctx=canvas.getContext('2d');
      if (!ctx) return;
      ctx.fillStyle=paint[0];ctx.fillRect(0,0,512,192);
      ctx.fillStyle=paint[2];ctx.fillRect(0,0,15,192);
      ctx.strokeStyle=paint[1];ctx.lineWidth=3;ctx.strokeRect(23,8,482,176);
      ctx.fillStyle=paint[1];ctx.font='bold 80px "PingFang SC",sans-serif';
      ctx.fillText(lines[0],39,97,445);
      ctx.font='bold 44px monospace';ctx.fillText(lines[1],40,157,445);
      const map=new T.CanvasTexture(canvas);map.colorSpace=T.SRGBColorSpace;
      material=new T.MeshStandardMaterial({map,roughness:.68,polygonOffset:true,polygonOffsetFactor:-1});
      badgeTextures.set(key,material);
    }
    const mesh=new T.Mesh(new T.PlaneGeometry(width,height),material);
    mesh.position.fromArray(at);mesh.rotation.set(...rot);
    mesh.receiveShadow=true;parent.add(mesh);
  }

  function makePerson(side) {
    const root=new T.Group();
    const hips=joint(root,'hips',0,.904,0);
    const pelvis=new Batch();
    pelvis.oval('#3a4343',[0,-.003,.012],[.154,.107,.102]);pelvis.flush(hips);
    const chest=joint(hips,'chest',0,.087,0);
    torso(chest,side);
    const patch=side?['北岬 02','SIGNAL  /  K-2']:['北岬 01','ENGINE  /  K-1'];
    const patchColor=['#47534b','#d6d7b7',colors[side]];
    plaque(chest,patch,patchColor,[0,.263,side?.233:.213],[0,0,0],.12,.046);
    plaque(chest,patch,patchColor,[-.049,.304,-.130],[0,Math.PI-.20,0],.076,.030);
    const neck=joint(chest,'head',0,.501,0);
    head(neck,side);
    for(let i=0;i<2;i++) {
      const sign=i===0?-1:1;
      const hip=joint(hips,'thigh'+i,sign*.087,-.060,0);
      const knee=joint(hip,'shin'+i,0,-.398,0);
      const ankle=joint(knee,'boot'+i,0,-.395,0);
      leg(hip,knee,ankle,sign,side);
      const shoulder=joint(chest,'arm'+i,sign*.185,.398,0);
      const elbow=joint(shoulder,'forearm'+i,sign*.015,-.231,0);
      const wrist=joint(elbow,'wrist'+i,0,-.208,0);
      arm(shoulder,elbow,wrist,sign,side);
    }
    if(side){chest.scale.x=.94;hips.scale.x=.97;}
    root.scale.setScalar(side?1.035:1.07);
    return root;
  }

  const crew=[];
  function person(side) {
    const id=side===1?1:0;
    crew[id] ||= makePerson(id);
    const root=crew[id].clone(true);
    const bones={};
    root.traverse(node=>{ if(node.isGroup && node.name) bones[node.name]=node; });
    root.userData.rig={bones,face:root.getObjectByName('face'),phase:id*Math.PI,pace:0,work:0,air:0,id};
    root.name=id?'沈遥':'林澈';
    animate(root,{speed:0,grounded:true,operating:false},0,0);
    return root;
  }

  const axis=new T.Vector3(),pole=new T.Vector3(),elbowAt=new T.Vector3(),reach=new T.Vector3();
  const palmOffset=new T.Vector3(0,-.263,-.005),armRotation=new T.Quaternion(),foreRotation=new T.Quaternion();
  function handleArm(chest,arm,fore,goal,side,weight,end=palmOffset,maxDistance=Infinity){
    // Solve both hinges against the handle after it has moved. The elbow pole
    // points out and back so a hand crossing the torso takes a natural path.
    reach.copy(goal);chest.worldToLocal(reach);reach.sub(arm.position);
    const l1=fore.position.length(),l2=end.length(),dist=T.MathUtils.clamp(reach.length(),.08,Math.min(maxDistance,l1+l2-.0002));
    axis.copy(reach).normalize();pole.set(side?1:-1,-.24,.54);
    pole.addScaledVector(axis,-pole.dot(axis)).normalize();
    const along=(l1*l1-l2*l2+dist*dist)/(2*dist);
    elbowAt.copy(axis).multiplyScalar(along).addScaledVector(pole,Math.sqrt(Math.max(0,l1*l1-along*along)));
    armRotation.setFromUnitVectors(reach.copy(fore.position).normalize(),axis.copy(elbowAt).normalize());
    reach.copy(goal);chest.worldToLocal(reach);reach.sub(arm.position).setLength(dist).sub(elbowAt).normalize().applyQuaternion(foreRotation.copy(armRotation).invert());
    foreRotation.setFromUnitVectors(elbowAt.copy(end).normalize(),reach);
    arm.quaternion.slerp(armRotation,weight);fore.quaternion.slerp(foreRotation,weight);
  }

  // Scratch space for the two leg chains. Targets are in actor metres before the root scale.
  const legDown=new T.Vector3(0,-1,0),legUp=new T.Vector3(0,1,0);
  const footGoal=new T.Vector3(),legAxis=new T.Vector3(),kneePole=new T.Vector3(),kneePoint=new T.Vector3();
  const anklePlane=new T.Vector3(),palmMid=new T.Vector3(),shoulderMid=new T.Vector3();
  const inversePelvis=new T.Matrix4(),localRotation=new T.Quaternion(),soleRotation=new T.Quaternion();
  const soleEuler=new T.Euler(0,0,0,'YXZ');
  const gaitClamp=T.MathUtils.clamp,gaitMix=T.MathUtils.lerp;
  const easeStep=(a,b,x)=>T.MathUtils.smoothstep(x,a,b);
  const wrapAngle=x=>Math.atan2(Math.sin(x),Math.cos(x));

  function placeLeg(b,i,x,y,z,plane,pitch,yaw,roll,pole=null,maxDistance=Infinity) {
    const thigh=b['thigh'+i],shin=b['shin'+i],boot=b['boot'+i];
    footGoal.set(x,y,z).applyMatrix4(inversePelvis).sub(thigh.position);
    const upper=-shin.position.y,lower=-boot.position.y;
    const length=gaitClamp(footGoal.length(),.18,Math.min(maxDistance,upper+lower-.00005));
    legAxis.copy(footGoal).normalize();
    if(pole)kneePole.copy(pole);else kneePole.set(i?.065:-.065,0,-1);
    kneePole.addScaledVector(legAxis,-kneePole.dot(legAxis)).normalize();
    const along=(upper*upper-lower*lower+length*length)/(2*length);
    kneePoint.copy(legAxis).multiplyScalar(along).addScaledVector(kneePole,Math.sqrt(Math.max(0,upper*upper-along*along)));
    thigh.quaternion.setFromUnitVectors(legDown,footGoal.copy(kneePoint).normalize());
    footGoal.copy(legAxis).multiplyScalar(length).sub(kneePoint).normalize().applyQuaternion(localRotation.copy(thigh.quaternion).invert());
    shin.quaternion.setFromUnitVectors(legDown,footGoal);
    soleRotation.setFromUnitVectors(legUp,plane).multiply(localRotation.setFromEuler(soleEuler.set(pitch,yaw,roll,'YXZ')));
    localRotation.copy(b.hips.quaternion).multiply(thigh.quaternion).multiply(shin.quaternion).invert();
    boot.quaternion.copy(localRotation.multiply(soleRotation));
  }

  // The real boot has a rounded tread under the instep and a flat heel/toe slab.
  // Compensate for the changing support point when the heel rolls off the ground.
  function treadHeight(pitch){
    const c=Math.cos(pitch),s=Math.sin(pitch);
    return Math.max(Math.hypot(.068*c,.144*s)-.009*c-.044*s,.035*c-.054*s+.0155*Math.abs(c)+.1085*Math.abs(s));
  }

  const signalTarget=new T.Vector3(),signalShoulder=new T.Vector3(),signalPalm=new T.Vector3(),signalEnd=new T.Vector3();
  const signalFrame=new T.Quaternion();
  // Triggered by the player's world marker. Equipment takes over both hands
  // immediately. When the marker simply expires, lower the arm over a few frames.
  function pointGesture(actor,m,dt){
    const rig=actor.userData.rig,b=rig.bones,target=m.pointAt;
    const free=m.grounded!==false&&!m.climbing&&!m.grips&&!m.operating&&!m.swing;
    const mark=free&&target&&Number.isFinite(target.x)&&Number.isFinite(target.y)&&Number.isFinite(target.z);
    let sight=rig.pointing;
    if(!sight&&!mark)return;
    if(!sight)sight=rig.pointing={weight:0,side:1,goal:new T.Vector3()};
    if(mark){
      if(sight.weight<.025){
        signalTarget.copy(target);actor.worldToLocal(signalTarget);
        sight.side=signalTarget.x<-.045?0:1;
      }
      sight.goal.copy(target);
    }
    sight.weight=free?gaitMix(sight.weight,mark?1:0,1-Math.exp(-dt*(mark?12:15))):0;
    const weight=sight.weight,side=sight.side,arm=b['arm'+side],fore=b['forearm'+side],wrist=b['wrist'+side];
    for(let i=0;i<2;i++)for(const part of b['wrist'+i].children){
      if(part.morphTargetInfluences)part.morphTargetInfluences[0]=side===i?weight:0;
    }
    if(weight<.001){if(!mark)rig.pointing=null;return;}
    signalTarget.copy(sight.goal);b.hips.worldToLocal(signalTarget);
    signalTarget.sub(b.chest.position);signalTarget.y-=b.arm0.position.y+.16;
    const yaw=Math.atan2(-signalTarget.x,-signalTarget.z),pitch=Math.atan2(signalTarget.y,Math.hypot(signalTarget.x,signalTarget.z));
    const turn=gaitClamp(yaw*.53,-.92,.92);
    b.chest.rotation.y+=turn*weight;
    b.head.rotation.y=gaitMix(b.head.rotation.y,gaitClamp(yaw-turn,-1.03,1.03),weight);
    b.head.rotation.x=gaitMix(b.head.rotation.x,gaitClamp(pitch,-.60,.53),weight);
    b.chest.updateWorldMatrix(true,false);
    signalTarget.copy(sight.goal);b.chest.worldToLocal(signalTarget);
    signalShoulder.copy(arm.position);
    signalPalm.copy(signalTarget).sub(signalShoulder);
    const distance=signalPalm.length();
    if(distance<.001)return;
    signalPalm.multiplyScalar(Math.min(.466,distance)/distance).add(signalShoulder);
    b.chest.localToWorld(signalPalm);handleArm(b.chest,arm,fore,signalPalm,side,weight);
    signalEnd.copy(sight.goal);fore.worldToLocal(signalEnd);signalEnd.sub(wrist.position);
    if(signalEnd.lengthSq()>.00001){
      const pointing=wrist.children[0].geometry.userData;
      signalFrame.setFromUnitVectors(pointing.pointAxis,signalEnd.normalize());
      // Offset the axis to the root of the index finger, especially at short range.
      signalEnd.copy(pointing.pointBase).applyQuaternion(signalFrame);
      signalTarget.copy(sight.goal);fore.worldToLocal(signalTarget);
      signalTarget.sub(wrist.position).sub(signalEnd);
      if(signalTarget.lengthSq()>.00001)signalFrame.setFromUnitVectors(pointing.pointAxis,signalTarget.normalize());
      wrist.quaternion.slerp(signalFrame,weight);
    }
  }

  // A hold stores four contact points in the world. During the first fraction
  // of the rebound the character moves away from those points and extends the
  // two leg chains before folding back into the normal airborne animation.
  const wallRoot=new T.Vector3(),wallNormal=new T.Vector3(),wallTangent=new T.Vector3();
  const wallLocalNormal=new T.Vector3(),wallLocalUp=new T.Vector3(),wallPoint=new T.Vector3(),wallGoal=new T.Vector3();
  const wallX=new T.Vector3(),wallY=new T.Vector3(),wallZ=new T.Vector3(),wallOffset=new T.Vector3(),wallPole=new T.Vector3();
  const wallBasis=new T.Matrix4(),wallTranspose=new T.Matrix3(),wallQuat=new T.Quaternion(),wallEase=new T.Quaternion();
  const wallEuler=new T.Euler(0,0,0,'YXZ'),savedRotations=Array.from({length:3},()=>new T.Quaternion());
  const wallLimbs=['arm0','forearm0','wrist0','thigh0','shin0','boot0','arm1','forearm1','wrist1','thigh1','shin1','boot1'];
  const worldUp=new T.Vector3(0,1,0),gloveDepth=.047;

  function clearWall(rig){
    if(!rig.wallPose)return;
    for(const wrist of [rig.bones.wrist0,rig.bones.wrist1]){
      for(const mesh of wrist.children)if(mesh.morphTargetInfluences)mesh.morphTargetInfluences[1]=0;
    }
    rig.wallPose=null;
  }

  // Orient a glove so its pressed face is parallel to the wall even on the
  // signal operator's non-uniformly scaled chest. The fingers point upwards.
  function flatGlove(fore,wrist,n,tangent,sign){
    fore.updateWorldMatrix(true,false);
    wallTranspose.setFromMatrix4(fore.matrixWorld).transpose();
    wallZ.copy(n).applyMatrix3(wallTranspose);
    const depthScale=wallZ.length();wallZ.normalize();
    wallX.copy(worldUp).multiplyScalar(-1).addScaledVector(tangent,-sign*.15);
    wallBasis.copy(fore.matrixWorld).invert();
    wallY.copy(wallX).transformDirection(wallBasis);
    wallY.addScaledVector(wallZ,-wallY.dot(wallZ)).normalize();
    wallX.crossVectors(wallY,wallZ).normalize();
    wrist.quaternion.setFromRotationMatrix(wallBasis.makeBasis(wallX,wallY,wallZ));
    return depthScale;
  }

  function wallArm(b,i,contact,n,tangent,bodyScale,weight,limit,heldWrist,hold){
    const arm=b['arm'+i],fore=b['forearm'+i],wrist=b['wrist'+i],sign=i?1:-1;
    savedRotations[0].copy(arm.quaternion);savedRotations[1].copy(fore.quaternion);savedRotations[2].copy(wrist.quaternion);
    let support=gloveDepth*bodyScale;
    for(let j=0;j<2;j++){
      wallGoal.copy(contact).addScaledVector(n,support);
      handleArm(b.chest,arm,fore,wallGoal,i,1,wrist.position,limit);
      support=gloveDepth*flatGlove(fore,wrist,n,tangent,sign);
    }
    wallOffset.copy(wallGoal);b.chest.worldToLocal(wallOffset);const extension=wallOffset.distanceTo(arm.position);
    arm.quaternion.slerp(savedRotations[0],1-weight);fore.quaternion.slerp(savedRotations[1],1-weight);
    if(hold)heldWrist.copy(wrist.quaternion);
    else wrist.quaternion.copy(heldWrist);
    wrist.quaternion.slerp(savedRotations[2],1-weight);
    for(const mesh of wrist.children)if(mesh.morphTargetInfluences)mesh.morphTargetInfluences[1]=weight;
    return extension;
  }

  // Straightening an elbow or knee at constant endpoint speed approaches a
  // two-link singularity. Release tension by extending at a finite joint rate;
  // the toes can break contact while the silhouette keeps opening naturally.
  function releasedLength(initial,upper,lower,t,interval){
    const start=Math.acos(gaitClamp((initial*initial-upper*upper-lower*lower)/(2*upper*lower),-1,1));
    const bend=gaitMix(start,Math.min(.25,start),easeStep(0,interval,t));
    return Math.sqrt(upper*upper+lower*lower+2*upper*lower*Math.cos(bend));
  }

  function wallPose(actor,m,dt){
    const rig=actor.userData.rig,b=rig.bones,w=m.wall;
    const free=m.grounded===false&&!m.grips&&!m.operating&&!m.climbing&&!m.swing;
    const active=free&&w&&(w.phase==='hold'||w.phase==='kick')&&Number.isFinite(w.planeX)&&Math.hypot(w.normalX||0,w.normalZ||0)>.5;
    let state=rig.wallPose;
    if(!free||(!active&&!state)){clearWall(rig);return;}
    actor.updateWorldMatrix(true,false);wallRoot.setFromMatrixPosition(actor.matrixWorld);
    const scale=actor.getWorldScale(wallOffset).y,hold=active&&w.phase==='hold';
    if(active)wallNormal.set(w.normalX||0,0,w.normalZ||0).normalize();
    if(!state||active&&(wallNormal.dot(state.normal)<.70||Math.abs(w.planeX-state.px)>.55)){
      state=rig.wallPose={normal:wallNormal.clone(),px:w.planeX,pz:Number.isFinite(w.planeZ)?w.planeZ:wallRoot.z,
        shift:0,age:0,prevPose:wallLimbs.map(()=>new T.Quaternion()),hasPose:false,phase:'hold',valid:false,wrists:[new T.Quaternion(),new T.Quaternion()],armLengths:[.37,.37],legLengths:[.63,.63],hands:[new T.Vector3(),new T.Vector3()],feet:[new T.Vector3(),new T.Vector3()]};
    }
    if(hold){
      state.normal.copy(wallNormal);state.px=w.planeX;
      if(Number.isFinite(w.planeZ))state.pz=w.planeZ;
    }
    wallNormal.copy(state.normal);wallTangent.set(wallNormal.z,0,-wallNormal.x);
    const dist=(wallRoot.x-state.px)*wallNormal.x+(wallRoot.z-state.pz)*wallNormal.z;
    if(hold){state.phase='hold';state.age=0;}
    else{
      const previous=state.phase==='kick'?state.age:0;
      state.age=active&&Number.isFinite(w.age)?Math.max(0,w.age):previous+dt;
      state.phase='kick';
    }
    const age=state.age;
    const bodyWeight=hold?1:1-easeStep(.045,.36,age);
    if(bodyWeight<.0001){clearWall(rig);return;}
    const spring=hold?0:easeStep(.028,.160,age),handWeight=hold?1:1-easeStep(.025,.240,age);
    const legsWeight=hold?1:1-easeStep(.09,.36,age);
    const settle=hold?easeStep(0,.145,Math.max(0,w.age||0)):1;
    const preload=hold&&w.normalX<0?TideFenderCoping.charge(w):0;
    const leftHigh=(wallNormal.x>0)!==!!rig.id;
    if(hold||!state.valid){
      const headroom=active&&Number.isFinite(w.topY)?(w.topY-wallRoot.y)/scale:Infinity;
      const highPalm=Math.min(1.425,headroom-.126);
      const lowering=gaitClamp(1.425-highPalm,0,1.46);
      state.lowEdge=easeStep(.03,.91,lowering);state.crouch=lowering*.67;
      const highFoot=Math.min(.511-state.crouch,headroom-.207);
      state.shift=gaitClamp(.446-.025*state.lowEdge-.093*preload-dist/scale,-.48,.48);
      wallPoint.copy(wallRoot).addScaledVector(wallNormal,-dist);
      for(let i=0;i<2;i++){
        const sign=i?1:-1,high=(i===0)===leftHigh;
        state.hands[i].copy(wallPoint).addScaledVector(wallTangent,sign*(high?.211:.235)*scale);
        state.hands[i].y+=(highPalm-(high?0:.195-.118*state.lowEdge))*scale;
        state.feet[i].copy(wallPoint).addScaledVector(wallTangent,sign*(high?.165:.185)*scale);
        state.feet[i].y+=(highFoot-(high?.186:0))*scale;
      }
      state.valid=true;
    }
    actor.getWorldQuaternion(wallQuat).invert();
    wallLocalNormal.copy(wallNormal).applyQuaternion(wallQuat).normalize();
    wallLocalUp.copy(worldUp).applyQuaternion(wallQuat).normalize();
    const yaw=Math.atan2(wallLocalNormal.x,wallLocalNormal.z);
    wallGoal.copy(wallLocalNormal).multiplyScalar(state.shift);
    wallGoal.addScaledVector(wallLocalUp,.843-.052*settle+.083*spring-state.crouch-.070*preload);
    b.hips.position.lerp(wallGoal,bodyWeight);
    b.hips.quaternion.slerp(wallEase.setFromEuler(wallEuler.set(.043+.060*spring,yaw,leftHigh?.027:-.027)),bodyWeight);
    b.chest.quaternion.slerp(wallEase.setFromEuler(wallEuler.set(-.23-.066*settle+.34*spring-.36*state.lowEdge,leftHigh?.052:-.052,leftHigh?-.034:.034)),bodyWeight);
    b.head.rotation.x=gaitMix(b.head.rotation.x,.205-.12*spring+.18*state.lowEdge,bodyWeight);
    b.head.rotation.y=gaitMix(b.head.rotation.y,leftHigh?-.14:.14,bodyWeight);
    b.hips.updateMatrix();inversePelvis.copy(b.hips.matrix).invert();
    for(let i=0;i<2;i++){
      const sign=i?1:-1,thigh=b['thigh'+i],shin=b['shin'+i],boot=b['boot'+i];
      const armLimit=hold?Infinity:releasedLength(state.armLengths[i],b['forearm'+i].position.length(),b['wrist'+i].position.length(),age,.16);
      const armLength=wallArm(b,i,state.hands[i],wallNormal,wallTangent,scale,handWeight,armLimit,state.wrists[i],hold||!state.hasPose);
      if(hold)state.armLengths[i]=armLength;
      savedRotations[0].copy(thigh.quaternion);savedRotations[1].copy(shin.quaternion);savedRotations[2].copy(boot.quaternion);
      wallGoal.copy(state.feet[i]).addScaledVector(wallNormal,.059*scale);actor.worldToLocal(wallGoal);
      wallPole.set(sign*(1.03-.20*spring),.42,-.33);
      if(hold)state.legLengths[i]=wallOffset.copy(wallGoal).applyMatrix4(inversePelvis).distanceTo(thigh.position);
      const legLimit=hold?Infinity:releasedLength(state.legLengths[i],-shin.position.y,-boot.position.y,age,.135);
      placeLeg(b,i,wallGoal.x,wallGoal.y,wallGoal.z,wallLocalNormal,0,0,0,wallPole,legLimit);
      wallZ.copy(wallLocalUp).multiplyScalar(-1);wallX.crossVectors(wallLocalNormal,wallZ).normalize();
      wallEase.setFromRotationMatrix(wallBasis.makeBasis(wallX,wallLocalNormal,wallZ));
      boot.quaternion.copy(wallQuat.copy(b.hips.quaternion).multiply(thigh.quaternion).multiply(shin.quaternion).invert().multiply(wallEase));
      thigh.quaternion.slerp(savedRotations[0],1-legsWeight);shin.quaternion.slerp(savedRotations[1],1-legsWeight);
      boot.quaternion.slerp(savedRotations[2],1-legsWeight);
    }
    // The physics impulse can move the root 16 cm in one 60 Hz tick. Let the
    // elbow and shin rotate out of compression over several ticks.
    const turnRate=(13.5+easeStep(.19,.32,age)*22)*dt;
    for(let j=0;j<wallLimbs.length;j++){
      const pose=b[wallLimbs[j]].quaternion,previous=state.prevPose[j];
      if(!hold&&state.hasPose&&age<.33)pose.copy(previous.rotateTowards(pose,turnRate));
      else previous.copy(pose);
    }
    state.hasPose=true;
  }

  // Lock a tread in the collision surface's own metric frame. Floating decks
  // supply two sloping axes; the signal rotors supply just horizontal U and V.
  function soleCoordinates(f,x,z,out){
    const a=f.axes,dx=x-f.x,dz=z-f.z;
    if(a){const det=a.ux*a.vz-a.uz*a.vx;out.u=(dx*a.vz-dz*a.vx)/det;out.v=(a.ux*dz-a.uz*dx)/det;}
    else{out.u=dx;out.v=dz;}
    out.deck=f;
  }
  function soleWorld(p,out){
    const f=p.deck,a=f.axes;
    out.x=f.x+(a?p.u*a.ux+p.v*a.vx:p.u);out.z=f.z+(a?p.u*a.uz+p.v*a.vz:p.v);
    return out;
  }
  const frameYaw=f=>f.axes?Math.atan2(f.axes.vx,f.axes.vz):0;
  const floorPoint=new T.Vector3(),surfaceNormal=new T.Vector3();
  function supportAt(world,x,z,rootY){
    // Check the same finite polygons as traversal. Neighbouring platforms can
    // overlap in plan, even well inside the footprint of the lower one.
    const deck=TideTraversal.surface(world,x,z,rootY+.405);
    return deck&&TideTraversal.surfaceHeight(deck,x,z)>rootY-.425?deck:null;
  }
  function floorNormal(d,x,z,out){
    if(d.axes){
      const a=d.axes;out.set(a.vy*a.uz-a.vz*a.uy,a.vz*a.ux-a.vx*a.uz,a.vx*a.uy-a.vy*a.ux).normalize();
      // The local forward of a signal ramp and lantern gallery points north.
      if(out.y<0)out.negate();return out;
    }
    if(d.sag){const h=.028;return out.set((TideTraversal.netHeight(d,x-h,z)-TideTraversal.netHeight(d,x+h,z))/(2*h),1,
      (TideTraversal.netHeight(d,x,z-h)-TideTraversal.netHeight(d,x,z+h))/(2*h)).normalize();}
    return out.set(0,1,0);
  }
  function prepareSupport(actor,st,m,reset,dt){
    const frame=m.groundFloor;
    if(!frame||!Number.isFinite(frame.w)||!Number.isFinite(frame.d)||!m.groundWorld||st.helm?.w>.00001||m.grounded===false||m.grips||m.operating||m.climbing||m.swing||m.wall){
      if(st.support){st.support=null;for(const f of st.feet)f.planted=false;}
      return null;
    }
    if(!st.support||reset){
      const feet=[0,1].map(()=>({deck:null,planted:false,hasPoint:false,settle:0,swingStart:1,normal:new T.Vector3()}));
      st.support={previous:{deck:null},feet,dx:0,dz:0,travel:0,still:0};for(const f of st.feet)f.planted=false;
      if(!st.ground&&st.flight>.22&&!reset){
        // Let the leading sole take the impact. The other knee finishes its
        // descent from the actual previous pose over the following frames.
        const i=1-st.leftLead,foot=feet[i],boot=actor.userData.rig.bones['boot'+i];
        boot.localToWorld(floorPoint.set(0,-.055,0));
        foot.settle=.0001;foot.landing=true;foot.startX=floorPoint.x;foot.startZ=floorPoint.z;
        foot.startY=actor.position.y;foot.startLift=gaitClamp((floorPoint.y-foot.startY)/actor.scale.y,0,.40);
      }
    }
    const support=st.support,prev=support.previous;
    const same=prev.deck===frame,oldU=prev.u,oldV=prev.v;
    if(prev.deck){soleWorld(prev,floorPoint);support.dx=actor.position.x-floorPoint.x;support.dz=actor.position.z-floorPoint.z;}
    else support.dx=support.dz=0;
    soleCoordinates(frame,actor.position.x,actor.position.z,prev);
    support.travel=same?Math.hypot(prev.u-oldU,prev.v-oldV):Math.hypot(support.dx,support.dz);
    support.still=support.travel>.00008?0:support.still+dt;
    return support;
  }
  function stepFeet(actor,m,st,support,dt,cycle,stance,move,run,speed,co,si,dirX,dirZ){
    const world=m.groundWorld,feet=support.feet;
    const root=actor.position,sx=actor.scale.x,sy=actor.scale.y,sz=actor.scale.z,yaw=Math.atan2(si,co);
    const walking=speed>.105&&move>.045&&support.still<.085;
    let maxHips=Infinity;
    for(let i=0;i<2;i++){
      const f=feet[i],sign=i?1:-1,u=(st.phase+i*.5)%1,stanceNow=u<stance,sw=gaitClamp((u-stance)/(1-stance),0,1);
      const k=gaitClamp(u/stance,0,1),L=cycle*stance,step=stanceNow?L*(.5-k):
        L*(easeStep(0,1,sw)-.5)-Math.min(.47,cycle*(1-stance))*sw*(1-sw)*(1-2*sw);
      const localX=sign*(.093+.010*st.brake)*sx,localZ=sign*.012*sz;
      const neutralX=root.x+co*localX+si*localZ,neutralZ=root.z-si*localX+co*localZ;
      let x=neutralX+(walking?dirX*step*move:0),z=neutralZ+(walking?dirZ*step*move:0);
      let lift=walking&&!stanceNow?(.106+.175*run)*Math.pow(Math.sin(Math.PI*sw),1.32)*move:0;
      let pitch=walking?(stanceNow?.095*(1-easeStep(.02,.29,k))-.27*easeStep(.67,1,k):
        -.27*(1-easeStep(0,.49,sw))+.095*easeStep(.62,.98,sw))*move:0;
      let lock=(!walking||stanceNow)&&!f.settle;
      if(f.planted&&(!f.deck||!f.deck.active))f.planted=false;
      if(f.planted){
        soleWorld(f,floorPoint);
        const dist=Math.hypot(floorPoint.x-neutralX,floorPoint.z-neutralZ);
        if(lock&&!walking&&feet[1-i].planted&&!feet[1-i].settle&&
          (dist>.165||Math.abs(wrapAngle(f.heading+frameYaw(f.deck)-yaw))>.63)){
          f.settle=.0001;f.startX=floorPoint.x;f.startZ=floorPoint.z;f.startY=f.surfaceY;
          lock=false;
        }
        if(!lock){f.planted=false;f.swingStart=sw;f.offsetX=floorPoint.x-x;f.offsetZ=floorPoint.z-z;f.startY=f.surfaceY;}
        else{x=floorPoint.x;z=floorPoint.z;}
      }
      if(!walking&&!f.planted&&!f.settle&&f.hasPoint&&
        (Math.hypot(f.lastX-x,f.lastZ-z)>.018||f.lift>.008)){
        f.settle=.0001;f.startX=f.lastX;f.startZ=f.lastZ;f.startY=f.surfaceY;f.startLift=f.lift;
        lock=false;
      }
      if(f.settle){
        f.settle=Math.min(1,f.settle+dt/(f.landing?.148:.205));const e=easeStep(0,1,f.settle);
        x=gaitMix(f.startX,f.landing?x:neutralX,e);z=gaitMix(f.startZ,f.landing?z:neutralZ,e);
        lift=(f.startLift||0)*(1-e)+(f.landing?0:.060)*Math.sin(Math.PI*f.settle);pitch=-.105*Math.sin(Math.PI*f.settle);
        if(f.settle>=1){f.settle=0;f.startLift=0;f.landing=false;lock=true;}
        else lock=false;
      }else if(walking&&!stanceNow&&!f.planted){
        const e=1-easeStep(f.swingStart,1,sw);x+=(f.offsetX||0)*e;z+=(f.offsetZ||0)*e;
      }
      let d=f.planted?f.deck:supportAt(world,x,z,root.y);
      if(!d&&lock){
        // At a sill or cut-out, put the edge of the tread on a real support.
        const ex=x,ez=z;
        for(let n=1;n<=4&&!d;n++){x=gaitMix(ex,root.x,n*.22);z=gaitMix(ez,root.z,n*.22);d=supportAt(world,x,z,root.y);}
      }
      let h=d?TideTraversal.surfaceHeight(d,x,z):root.y;
      if(!Number.isFinite(h)){d=null;h=root.y;f.planted=false;}
      if(lock&&d&&!f.planted){soleCoordinates(d,x,z,f);f.heading=yaw-frameYaw(d);f.planted=true;f.offsetX=f.offsetZ=0;}
      // On a rising tread the swing first clears its target; on descent it
      // leaves the previous stair before lowering. Stance always uses the real height.
      if(!lock&&f.hasPoint&&f.startY!==undefined){const p=f.settle?f.settle:sw;h=Math.max(h,gaitMix(f.startY,h,easeStep(.12,.88,p)));}
      const nrm=d?floorNormal(d,x,z,surfaceNormal):surfaceNormal.set(0,1,0);
      const radius=treadHeight(pitch)*sy;
      const ax=x+nrm.x*radius-root.x,az=z+nrm.z*radius-root.z;
      f.x=(co*ax-si*az)/sx;f.z=(si*ax+co*az)/sz;f.y=(h-root.y+nrm.y*radius)/sy+lift;
      f.normal.set(co*nrm.x-si*nrm.z,nrm.y,si*nrm.x+co*nrm.z).normalize();
      f.pitch=pitch;f.yaw=f.planted?gaitClamp(wrapAngle(f.heading+frameYaw(d)-yaw),-.76,.76):0;
      f.lastX=x;f.lastZ=z;f.surfaceY=h;f.lift=lift;f.hasPoint=true;
      // Both knees must be able to reach their own tread, including the lower
      // of two stair steps. Solve the pelvis before the two hip/knee chains.
      if(f.planted){
        const lateral=f.x-sign*.087;
        maxHips=Math.min(maxHips,f.y+.060+Math.sqrt(Math.max(.08,.786*.786-lateral*lateral-f.z*f.z)));
      }
    }
    return maxHips;
  }

  const seatVector=new T.Vector3(),seatNormal=new T.Vector3();
  const seatTilt=new T.Quaternion(),seatFrame=new T.Quaternion(),seatHeel=new T.Vector3();
  function seatPoint(out,p){return Array.isArray(p)?out.fromArray(p):out.set(p.x,p.y,p.z);}
  // Pan and tread points are actual world-space surfaces, including all of a
  // pitching launch's motion. Store actor-local goals for a brief stand-up after
  // the controls release, without pinning the old boat to the character.
  function helmPose(actor,m,st,dt,reset){
    const supplied=m.helmSeat;
    if(m.grounded===false||m.swing||m.climbing||m.wall||(!supplied&&(reset||m.grips||m.operating))){
      st.helm=null;return null;
    }
    let h=st.helm;
    const want=supplied?gaitClamp(supplied.weight??1,0,1):0;
    if(!h){
      if(!want)return null;
      h=st.helm={blend:reset||!dt?want:0,w:0,pan:new T.Vector3(),feet:[new T.Vector3(),new T.Vector3()],up:new T.Vector3(),
        hands:[0,1].map(()=>({aim:new T.Vector3(),actual:new T.Vector3(),delta:new T.Vector3(),world:new T.Vector3(),known:false,t:1,hold:0}))};
    }
    if(supplied){
      actor.worldToLocal(seatPoint(h.pan,supplied.hip));
      for(let i=0;i<2;i++)actor.worldToLocal(seatPoint(h.feet[i],supplied.feet[i]));
      if(supplied.up)seatPoint(seatNormal,supplied.up).normalize();
      else{const x=m.slopeX||0,z=m.slopeZ||0;seatNormal.set(x,Math.sqrt(Math.max(.10,1-x*x-z*z)),z).normalize();}
      h.up.copy(seatNormal).applyQuaternion(actor.getWorldQuaternion(seatFrame).invert()).normalize();
      h.pan.addScaledVector(h.up,.163);
    }
    for(let i=0;i<2;i++){
      const hand=h.hands[i];
      if(m.grips){
        actor.worldToLocal(seatVector.copy(m.grips[i]));
        if(hand.known&&seatVector.distanceToSquared(hand.aim)>.20*.20){
          // Switching to the throttle is a reach across the console. Use the
          // live lever position all the way through the reach and after contact.
          hand.delta.subVectors(hand.actual,seatVector);hand.t=0;
        }
        hand.aim.copy(seatVector);hand.t=Math.min(1,hand.t+dt/.225);
        hand.actual.copy(hand.aim).addScaledVector(hand.delta,1-easeStep(0,1,hand.t));
        hand.actual.y+=.036*Math.sin(Math.PI*hand.t);
        hand.hold=1;hand.known=true;
      }else if(hand.known)hand.hold=Math.max(0,hand.hold-dt/.225);
      if(hand.hold>0)actor.localToWorld(hand.world.copy(hand.actual));
    }
    // Already seated at a teleport or an opening shot. For subsequent entries
    // the operator bends over several frames; a zero-weight handoff also eases.
    if(reset&&supplied)h.blend=want;
    else h.blend+=gaitClamp(want-h.blend,-dt*5.65,dt*4.30);
    h.w=h.blend*h.blend*(3-2*h.blend);
    if(h.w<.000001&&!want){st.helm=null;return null;}
    return h;
  }

  function animate(actor,motion,dt,time) {
    const rig=actor.userData.rig,b=rig.bones;
    TideCrew.express(rig.face,rig.id,time,!!motion.talking);
    const s=gaitClamp(Number.isFinite(dt)?dt:0,0,.12),blend=1-Math.exp(-s*14),slow=1-Math.exp(-s*8.5);
    const ground=motion.grounded!==false,grips=motion.grips,hang=motion.swing;
    const ride=!!(hang&&hang.phase==='ride'&&grips),reaching=!!(hang&&hang.phase==='reach'&&grips);
    const yaw=Number.isFinite(motion.yaw)?motion.yaw:actor.rotation.y,co=Math.cos(yaw),si=Math.sin(yaw);
    let speed=Math.max(0,Number.isFinite(motion.speed)?Math.abs(motion.speed):Math.hypot(motion.vx||0,motion.vz||0));
    const st=rig.locomotion||(rig.locomotion={
      phase:rig.id*.5+.17,ground,flight:0,vy:0,impact:0,impactAge:1,launch:0,launchHeld:false,leftLead:rig.id,
      x:actor.position.x,y:actor.position.y,z:actor.position.z,yaw,vx:0,vz:0,travelX:0,travelZ:0,
      run:0,move:0,brake:0,tilt:0,sway:0,reach:0,hangOffset:new T.Vector3(),
      feet:[{planted:false},{planted:false}]
    });
    const dx=actor.position.x-st.x,dz=actor.position.z-st.z,measured=Math.hypot(dx,dz);
    const reset=measured>Math.max(1.2,speed*s*3+.31)||Math.abs(actor.position.y-st.y)>1.65;
    const vx=Number.isFinite(motion.vx)?motion.vx:-si*speed,vz=Number.isFinite(motion.vz)?motion.vz:-co*speed;
    const horizontal=Math.hypot(vx,vz),dirX=horizontal>.025?vx/horizontal:-si,dirZ=horizontal>.025?vz/horizontal:-co;
    const vy=Number.isFinite(motion.vy)?motion.vy:s>.00001&&!reset?(actor.position.y-st.y)/s:0;
    const seated=helmPose(actor,motion,st,s,reset);
    const support=prepareSupport(actor,st,motion,reset,s);
    if(support&&support.still>=.085)speed=0;
    let distance=0;
    if(Number.isFinite(motion.strideDistance))distance=Math.max(0,motion.strideDistance);
    else if(support&&speed>.025&&!reset){distance=support.travel;}
    else if(speed>.025&&!reset){
      if(Number.isFinite(motion.vx)&&Number.isFinite(motion.vz)){
        // Input can keep a velocity while a wall prevents any actual step.
        distance=Math.min(Math.max(0,dx*dirX+dz*dirZ),horizontal*s*1.22);
      }else distance=measured>.00001?measured:speed*s;
    }
    if(reset){distance=0;st.feet.forEach(f=>{f.planted=false;});st.hangOffset.set(0,0,0);st.impact=0;st.launch=0;}
    if(!s||!ground||ride||motion.climbing)distance=0;
    if(!support)distance=Math.min(distance,Math.max(.025,s*(speed+2.5)));
    const wasGround=st.ground;
    const launchHeld=motion.launch===true||motion.launch>.50;
    const launching=(!ground&&wasGround&&!ride)||(launchHeld&&!st.launchHeld);
    if(launching){st.launch=1;st.leftLead=st.phase<.5?0:1;}
    else st.launch*=Math.exp(-s*9);
    st.launchHeld=launchHeld;
    if(ground&&!wasGround&&!ride&&!motion.climbing&&!reset){
      st.impact=Math.max(.15,gaitClamp((-st.vy-1.0)/6.9,0,1),gaitClamp(Number(motion.landing)||0,0,1));
      st.impactAge=0;st.phase=st.leftLead===0?.035:.535;st.feet[0].planted=st.feet[1].planted=false;
    }else st.impactAge+=s;
    const impactPhase=gaitClamp(st.impactAge/.32,0,1);
    const suppliedImpact=gaitClamp(Number(motion.landing)||0,0,1);
    const impact=ground?Math.max(st.impact*Math.sin(Math.PI*impactPhase)*(1-.37*impactPhase),suppliedImpact*.53):0;
    const deltaSpeed=s>.00001&&!reset?(horizontal-Math.hypot(st.vx,st.vz))/s:0;
    const turn=s>.00001&&!reset?wrapAngle(yaw-st.yaw)/s:0;
    const previousSpeed=Math.hypot(st.vx,st.vz);
    const reversal=previousSpeed>.8&&horizontal>.5?Math.max(0,-(vx*st.vx+vz*st.vz)/(previousSpeed*horizontal)):0;
    st.brake=Math.max(st.brake*Math.exp(-s*7.6),ground?gaitClamp(-deltaSpeed/33,0,1)*Math.min(1,previousSpeed/2.0):0,ground?reversal*.81:0);
    st.tilt+=((ground?gaitClamp(deltaSpeed/32,-1,1):0)-st.tilt)*slow;
    st.sway+=(gaitClamp(turn*horizontal*.058,-1,1)-st.sway)*slow;
    st.run+=(easeStep(2.05,5.30,speed)-st.run)*blend;
    st.move+=(easeStep(.045,1.04,speed)-st.move)*blend;
    st.flight+=((ground?0:1)-st.flight)*(1-Math.exp(-s*(ground?21:19)));
    rig.work+=((motion.operating||ride||reaching?1:0)-rig.work)*blend;
    const work=rig.work,run=st.run,move=st.move,air=st.flight;
    const cycle=gaitMix(1.15,1.35,easeStep(.35,2.05,speed))+1.51*run;
    const stance=gaitMix(.577,.302,run);
    st.phase=(st.phase+distance/cycle)%1;st.travelX+=dirX*distance;st.travelZ+=dirZ*distance;
    rig.phase=st.phase*TAU;rig.pace=move;rig.air=air;
    const phase=rig.phase,stride=Math.sin(phase),turnLean=ground?st.sway*move:0;
    const rise=easeStep(.16,4.1,vy),fall=easeStep(.21,5.6,-vy),apex=1-Math.max(rise,fall);
    const sky=ride?1:air,unloaded=1-sky;
    const handY=grips?Math.min(grips[0].y,grips[1].y)-actor.position.y:1.2;
    const squat=grips&&!ride&&!reaching?gaitClamp(1.39-(handY+.28)/actor.scale.y,0,.50)*work:0;
    const breath=Math.sin(time*2.1+rig.id*2);
    const effort=hang?gaitClamp(hang.effort||0,-1,1):0,angle=hang?gaitClamp(hang.angle||0,-1.30,1.30):0,angular=hang?gaitClamp(hang.omega||0,-4,4):0;
    const nx=ground?gaitClamp(motion.slopeX||0,-.85,.85):0,nz=ground?gaitClamp(motion.slopeZ||0,-.85,.85):0;
    const ny=Math.sqrt(Math.max(.10,1-nx*nx-nz*nz));
    // Make room for the farther, downhill support foot without lengthening either shin.
    const slopeDrop=Math.min(.19,(.073+.255*move)*Math.hypot(nx,nz)/ny);
    const contactWave=Math.cos(phase*2-stance*TAU);
    b.hips.position.set(0,.891-(.069+.052*run)*move*unloaded+(.013+.020*run)*contactWave*move*unloaded
      -.166*impact-.064*st.brake-.044*air-.012*apex*air-squat-slopeDrop,0);
    b.hips.rotation.set(0,.065*stride*move*unloaded,turnLean*.020);
    b.chest.position.set(0,.087+breath*.0026,0);
    b.chest.rotation.set(-.024-(.049+.115*run)*move*unloaded-.044*st.tilt+.11*st.brake-.18*impact
      -.083*work-.35*squat+air*(-.16*rise+.055*fall),-.094*stride*move*unloaded,
      .023*Math.cos(phase)*move*unloaded+turnLean*.077);
    b.head.rotation.set(.014-.075*work-(motion.incline||0)-b.chest.rotation.x*.24-.067*st.launch+.054*fall*air,
      Math.sin(time*.55+rig.id)*.05*(1-move)+(motion.gaze||0),-b.chest.rotation.z*.68);
    if(ride||reaching){
      st.reach=ride?1:Math.min(1,st.reach+s*9.5);
      const weight=st.reach,hangPitch=gaitClamp(angle*.51-angular*.038,-.70,.70);
      b.chest.rotation.x=gaitMix(b.chest.rotation.x,-.035-hangPitch*.41-effort*.089,weight);
      b.chest.rotation.y*=1-weight;b.chest.rotation.z*=1-weight;
      b.hips.rotation.set(0,b.hips.rotation.y*(1-weight),0);
      // Match the shoulder midpoint to the known moving ring, including body scale, before solving either arm.
      palmMid.copy(grips[0]).add(grips[1]).multiplyScalar(.5);actor.worldToLocal(palmMid);
      b.chest.updateMatrix();b.hips.updateMatrix();
      shoulderMid.set(0,b.arm0.position.y,0).applyMatrix4(b.chest.matrix).applyMatrix4(b.hips.matrix);
      palmMid.y-=.399*Math.cos(hangPitch);palmMid.z+=.399*Math.sin(hangPitch);
      st.hangOffset.copy(palmMid.sub(shoulderMid)).multiplyScalar(weight);
      b.head.rotation.x+=(-.11+hangPitch*.20)*weight;
    }else{
      st.reach=0;st.hangOffset.multiplyScalar(Math.exp(-s*18));
      if(st.hangOffset.lengthSq()<.0000003)st.hangOffset.set(0,0,0);
    }
    if(support){
      const maxY=stepFeet(actor,motion,st,support,s,cycle,stance,move,run,speed,co,si,dirX,dirZ);
      b.hips.position.y=Math.min(b.hips.position.y,maxY);
    }
    if(seated){
      const h=seated,w=h.w;
      b.hips.position.lerp(h.pan,w);
      seatTilt.setFromUnitVectors(legUp,h.up);
      b.hips.quaternion.slerp(seatTilt,w);
      let shift=0,reach=0;
      if(grips){
        actor.worldToLocal(seatVector.copy(grips[1]));
        shift=gaitClamp((seatVector.x-h.pan.x-.13)*.80,-.27,.32);
        reach=gaitClamp((h.pan.z-seatVector.z-.23)*.62,-.03,.20);
      }
      b.chest.rotation.set(gaitMix(b.chest.rotation.x,-.235-reach,w),
        gaitMix(b.chest.rotation.y,-.23*shift,w),gaitMix(b.chest.rotation.z,-.41*shift,w));
      b.head.rotation.x=gaitMix(b.head.rotation.x,.084+reach*.55,w);
    }
    b.hips.position.add(st.hangOffset);
    b.hips.updateMatrix();inversePelvis.copy(b.hips.matrix).invert();
    anklePlane.set(co*nx-si*nz,ny,si*nx+co*nz).normalize();
    const localDX=co*dirX-si*dirZ,localDZ=si*dirX+co*dirZ;
    for(let i=0;i<2;i++){
      const sign=i?1:-1,u=(st.phase+i*.5)%1,onGround=u<stance,sw=gaitClamp((u-stance)/(1-stance),0,1);
      const supportLength=cycle*stance,foot=st.feet[i];
      const advance=onGround?supportLength*(.5-u/stance):
        supportLength*(easeStep(0,1,sw)-.5)-Math.min(.47,cycle*(1-stance))*sw*(1-sw)*(1-2*sw);
      let x=sign*(.093+.010*st.brake)+localDX*advance*move/actor.scale.x;
      let z=sign*.012+localDZ*advance*move/actor.scale.z;
      let footYaw=0;
      if(support){foot.planted=support.feet[i].planted;}
      else if(ground&&!motion.climbing&&!ride&&!reaching&&move>.12&&speed>.18&&onGround){
        if(!foot.planted){
          foot.x=st.travelX+co*x*actor.scale.x+si*z*actor.scale.z;
          foot.z=st.travelZ-si*x*actor.scale.x+co*z*actor.scale.z;
          foot.yaw=yaw;foot.planted=true;
        }
        const px=foot.x-st.travelX,pz=foot.z-st.travelZ;
        x=(co*px-si*pz)/actor.scale.x;z=(si*px+co*pz)/actor.scale.z;
        footYaw=gaitClamp(wrapAngle(foot.yaw-yaw),-.49,.49);
      }else foot.planted=false;
      const sphase=gaitClamp(u/stance,0,1);
      let pitch=(onGround?.095*(1-easeStep(.02,.29,sphase))-.27*easeStep(.67,1,sphase):
        -.27*(1-easeStep(0,.49,sw))+.095*easeStep(.62,.98,sw))*move;
      const localFloor=ground?-(nx*(co*x*actor.scale.x+si*z*actor.scale.z)+nz*(-si*x*actor.scale.x+co*z*actor.scale.z))/(ny*actor.scale.y):0;
      let y=treadHeight(pitch)/ny+localFloor+(!onGround?(.106+.175*run)*Math.pow(Math.sin(Math.PI*sw),1.32)*move:0);
      if(!ground&&air>.0001){
        const lead=i===st.leftLead,fore=lead?-1:1;
        const lift=.162+(lead?.193:.135)*rise+.107*apex-(lead?.086:.056)*fall;
        x=gaitMix(x,sign*(.100+.018*fall),air);y=gaitMix(y,lift,air);
        z=gaitMix(z,fore*(.066+.125*rise+.057*apex+.016*fall),air);
        pitch=gaitMix(pitch,-.21*rise-.10*apex+.060*fall+(lead?0:-.053),air);
      }
      if(ride||reaching){
        const weight=st.reach,legArc=gaitClamp(angle*.41+angular*.043-effort*.28,-.58,.58);
        const tucked=.075+.085*Math.abs(effort)+.051*easeStep(.2,2.5,Math.abs(angular));
        x=gaitMix(x,b.hips.position.x+sign*.108,weight);
        y=gaitMix(y,b.hips.position.y-.71+tucked+(i===st.leftLead?.046:0)+.075*(1-Math.cos(legArc)),weight);
        z=gaitMix(z,b.hips.position.z+Math.sin(legArc)*.58+(i===st.leftLead?-.074:.034),weight);
        pitch=gaitMix(pitch,-.21-.12*easeStep(.1,.8,effort),weight);
      }else if(!ground){y+=st.hangOffset.y;z+=st.hangOffset.z;x+=st.hangOffset.x;}
      if(motion.climbing){
        const k=(1+Math.sin(actor.position.y*Math.PI/.29+i*Math.PI))*.5;
        b['thigh'+i].rotation.set(.26+.72*k,0,0);b['shin'+i].rotation.set(-.44-1.17*k,0,0);
        b['boot'+i].rotation.set(.18+.38*k,0,0);
      }else if(seated){
        const w=seated.w,h=seated;
        const toeYaw=sign*.088;
        seatTilt.setFromUnitVectors(legUp,h.up).multiply(seatFrame.setFromEuler(soleEuler.set(0,toeYaw,0,'YXZ')));
        // The deepest point of the rounded tread is 44 mm towards the toe.
        seatHeel.set(0,-.059,-.044).applyQuaternion(seatTilt);
        seatVector.copy(h.feet[i]).sub(seatHeel);
        seatNormal.copy(anklePlane).lerp(h.up,w).normalize();
        placeLeg(b,i,gaitMix(x,seatVector.x,w),gaitMix(y,seatVector.y,w),gaitMix(z,seatVector.z,w),
          seatNormal,pitch*(1-w),gaitMix(footYaw,toeYaw,w),0);
      }else if(support){const f=support.feet[i];placeLeg(b,i,f.x,f.y,f.z,f.normal,f.pitch,f.yaw,0);}
      else placeLeg(b,i,x,y,z,anklePlane,pitch,footYaw,0);
      const arm=b['arm'+i],forearm=b['forearm'+i],wrist=b['wrist'+i];
      const armSwing=Math.cos(u*TAU-Math.PI*stance);
      arm.rotation.set(.065-(.30+.38*run)*armSwing*move*unloaded+.49*work+.17*st.brake
        +air*(.25+.18*rise+(i===st.leftLead?-.23:.20)),0,sign*(.081+.075*work+.16*air+.19*fall*air+.061*Math.abs(turnLean)));
      forearm.rotation.set(.148+.47*run*move+.13*air+.23*rise*air+(.32+.15*Math.sin(time*4.3+i*Math.PI))*work,0,0);
      wrist.rotation.set(grips?0:.08*work+.035*run*move,0,0);
      if(seated&&seated.hands[i].hold>0){
        const hand=seated.hands[i],weight=grips?Math.max(seated.w,work):easeStep(0,1,hand.hold)*seated.w;
        handleArm(b.chest,arm,forearm,hand.world,i,weight);
      }else if(grips)handleArm(b.chest,arm,forearm,grips[i],i,ride?1:reaching?st.reach:work);
    }
    if(motion.pointAt||rig.pointing)pointGesture(actor,motion,s);
    if(motion.wall||rig.wallPose)wallPose(actor,motion,s);
    if(motion.ledge||rig.copingPose)TideMantlePose.apply(actor,motion,s);
    st.x=actor.position.x;st.y=actor.position.y;st.z=actor.position.z;st.yaw=yaw;st.vx=vx;st.vz=vz;st.vy=vy;st.ground=ground;
  }

  // Stations go from the pointed stem to the transom. Cross sections narrow
  // below the waterline and flare towards the rub rail.
  const stations=[
    [-9.2,.06,1.85],[-8.35,1.24,1.69],[-6.8,2.04,1.5],[-4.6,2.32,1.39],
    [-1,2.38,1.35],[3.9,2.36,1.34],[6.9,2.20,1.34],[8.7,1.90,1.40]
  ];
  function hullPanel(b,tint,points,finish) {
    const geo=new T.BufferGeometry();
    geo.setAttribute('position',new T.Float32BufferAttribute(points.flat(),3));
    geo.setAttribute('uv',new T.Float32BufferAttribute([0,0,1,0,1,1,0,1],2));
    geo.setIndex([0,1,2,0,2,3]);
    geo.computeVertexNormals();
    b.add(geo,tint,finish,[0,0,0],[1,1,1]);
    geo.dispose();
  }
  function hull(b) {
    const levels=[[-1.02,.22,'#713c36'],[-.56,.72,'#874638'],[-.18,.88,'#4d524c'],
      [.07,.94,'#345555'],[.30,.98,'#354c4e'],[.91,1,'#c0c6b7'],[1,1,'#b2b6a8']];
    function edge(station,side,i) {
      const [z,w,deck]=station,[height,width]=levels[i];
      const y=i>=levels.length-2?deck-(i===levels.length-2?.12:0):height;
      return [side*w*width,y,z];
    }
    for(let i=1;i<stations.length;i++) {
      const fore=stations[i-1], aft=stations[i], last=levels.length-1;
      for(const side of [-1,1]) {
        for(let j=0;j<last;j++) {
          const points=[edge(fore,side,j),edge(fore,side,j+1),edge(aft,side,j+1),edge(aft,side,j)];
          hullPanel(b,levels[j][2],side===1?points:points.reverse(),'satin');
        }
        for(const [height,r,tint] of [[.24,.052,'#242e2d'],[.31,.021,'#8a9186']]) {
          const a=edge(fore,side,last),z=edge(aft,side,last);
          a[1]-=height; z[1]-=height;
          b.tube(tint,a,z,r,'satin');
        }
      }
      hullPanel(b,'#647675',[edge(fore,-1,last),edge(aft,-1,last),edge(aft,1,last),edge(fore,1,last)],'satin');
    }
    const stern=stations[stations.length-1], last=levels.length-1;
    for(let i=0;i<last;i++) hullPanel(b,levels[i][2],
      [edge(stern,-1,i),edge(stern,1,i),edge(stern,1,i+1),edge(stern,-1,i+1)],'satin');
    for(const side of [-1,1]) {
      for(let z=-6.4;z<8.0;z+=1.65) {
        const w=z<-5?2.11:z>6?2.15:2.35;
        b.oval('#1f302f',[side*w,.78,z],[.025,.15,.18],'glass');
        b.tube('#27322f',[side*(w-.01),1.31,z+.36],[side*(w+.11),.75,z+.36],.023,'fabric');
        b.oval('#232a27',[side*(w+.1),.75,z+.36],[.125,.27,.12],'satin');
      }
    }
  }

  function rails(b) {
    for(const side of [-1,1]) {
      let last=null;
      for(const [z,w,deck] of stations) {
        const now=[side*(w-.06),deck+.7,z];
        b.tube('#a6aea2',[now[0],deck,now[2]],now,.031);
        if(last) {
          b.tube(steel,now,last,.030);
          b.tube('#8d9a90',[now[0],now[1]-.33,z],[last[0],last[1]-.33,last[2]],.018);
          const len=Math.abs(last[2]-z);
          for(let k=1;k<Math.ceil(len/1.5);k++){
            const f=k/Math.ceil(len/1.5);
            const x=now[0]+(last[0]-now[0])*f;
            const y=now[1]+(last[1]-now[1])*f;
            const pz=z+(last[2]-z)*f;
            b.tube(steel,[x,y-.7,pz],[x,y,pz],.022);
          }
        }
        last=now;
      }
    }
    for(let y=1.75;y<=2.11;y+=.35) b.tube(steel,[-1.86,y,8.7],[1.86,y,8.7],.027);
  }

  let shipTemplate;
  function ferry() {
    if (shipTemplate) return shipTemplate.clone(true);
    const ship=new T.Group();
    ship.name='海雁号';
    const b=new Batch();
    hull(b);rails(b);
    // Two passenger decks, a raised wheelhouse with slanted front glazing.
    b.box('#879c93',[0,1.47,.60],[3.64,.24,10.85]);
    b.box('#ced0bc',[0,2.22,.43],[3.43,1.49,10.51]);
    b.box('#44706e',[0,1.74,.43],[3.48,.24,10.54]);
    b.box('#a59f87',[0,2.99,.38],[3.75,.13,10.82]);
    b.box('#47716f',[0,3.07,.4],[3.78,.07,10.80]);
    for(const side of [-1,1]){
      for(let j=0;j<10;j++) {
        const z=-4.14+j*.99;
        b.box('#747e74',[side*1.72,2.35,z],[.040,.72,.87],'metal');
        b.box(j%4===0?'#c0a572':'#596f6a',[side*1.744,2.36,z],[.016,.621,.767],'glass');
        b.box('#84938b',[side*1.756,2.36,z+.016],[.018,.62,.032],'metal');
        if(j%3===2) b.box('#ffdaa0',[side*1.757,2.65,z],[.018,.033,.44],'lamp');
      }
      for(let j=0;j<2;j++) {
        const z=3.06+j*2.30;
        b.ring('#d3653e',[side*1.84,2.02,z],[.24,.24,.24],[0,Math.PI/2,0],true);
        for(let k=0;k<4;k++){
          const a=k*Math.PI/2+.32;
          b.box('#ded8c2',[side*1.85,2.02+.237*Math.sin(a),z+.237*Math.cos(a)],[.122,.081,.087],'satin',[a,0,0]);
        }
      }
      b.oval('#dcdccd',[side*1.25,3.32,2.7],[.32,.26,1.22],'satin');
      for(let j=0;j<3;j++)b.box('#697772',[side*1.25,3.34,1.97+j*.70],[.635,.23,.055],'satin');
    }
    b.box('#b0b7a9',[0,3.54,-2.4],[2.96,.86,3.30]);
    b.box('#d4d2bb',[0,4.09,-2.46],[3.18,.84,3.43]);
    for(let i=0;i<5;i++){
      b.box('#515e59',[-1.24+.62*i,4.11,-4.19],[.60,.64,.046],'metal',[-.10,0,0]);
      b.box('#3d514e',[-1.24+.62*i,4.12,-4.22],[.53,.56,.027],'glass',[-.10,0,0]);
      b.tube('#263532',[-1.39+.62*i,3.90,-4.25],[-1.16+.62*i,4.13,-4.235],.010);
    }
    for(const side of [-1,1]) {
      for(let j=0;j<3;j++)b.box('#405755',[side*1.608,4.12,-3.52+j*1.01],[.024,.55,.88],'glass');
      b.box('#917a59',[side*1.51,3.54,-1.01],[.055,.79,.60],'satin');
      b.box('#273b3b',[side*1.55,3.70,-1.02],[.025,.30,.36],'glass');
      b.box('#303d36',[side*1.65,4.49,-2.66],[.22,.13,.34],'metal');
      b.oval(side===1?'#8af6ac':'#f38767',[side*1.72,4.54,-2.68],[.085,.055,.10],'lamp');
    }
    b.box('#66736c',[0,4.56,-2.49],[3.52,.10,3.68],'metal');
    b.add(cylinder,'#cdcfbb','satin',[0,5.30,-2.22],[.067,1.54,.067]);
    b.tube(steel,[-.70,5.53,-2.22],[.70,5.53,-2.22],.031);
    b.box('#edeadb',[0,6.10,-2.22],[.82,.10,.20],'satin');
    b.tube(steel,[.58,4.59,-1.15],[.65,6.38,-1.10],.017);
    b.oval('#ffe2ab',[0,5.85,-2.24],[.08,.08,.08],'lamp');
    b.add(cylinder,'#7d8278','metal',[0,3.70,.48],[.32,1.20,.27],[.08,0,0]);
    b.add(cylinder,'#47524d','satin',[0,4.21,.53],[.34,.20,.29],[.08,0,0]);
    // Foredeck mooring fittings, stern boarding gate, equipment and coiled line.
    b.box('#888d81',[0,1.56,-6.26],[1.15,.22,.82],'metal');
    b.add(cylinder,'#414f49','metal',[0,1.83,-6.3],[.29,.34,.29]);
    for(let k=0;k<4;k++)b.ring('#88765a',[.76,1.56+k*.055,-5.82],[.33,.33,.33],[Math.PI/2,0,0],false,'fabric');
    for(const s of [-1,1]) {
      for(const z of [-6.8,6.94]){
        b.add(cylinder,'#626960','metal',[s*1.15,1.55,z],[.12,.36,.12]);
        b.add(cylinder,'#848d7e','metal',[s*1.15,1.76,z],[.17,.07,.17]);
      }
      b.tube(steel,[s*.25,1.45,6.05],[s*.25,3.1,5.45],.03);
    }
    for(let j=0;j<7;j++)b.tube(steel,[-.25,1.55+j*.228,6.01-j*.084],[.25,1.55+j*.228,6.01-j*.084],.022);
    b.flush(ship);
    for(const side of [-1,1]){
      plaque(ship,['海 雁','HAI YAN  /  04'],['#3c5452','#e3d9b8','#a6724c'],[side*2.376,.52,2.75],[0,side*Math.PI/2,0],1.59,.48);
    }
    plaque(ship,['海 雁','NORTH CAPE FERRY'],['#b9c1b1','#384d4e','#986d45'],[0,2.14,-4.837],[0,Math.PI,0],1.75,.63);
    shipTemplate=ship;
    return ship.clone(true);
  }

  window.TideActors=Object.freeze({person,animate,ferry});
})();
