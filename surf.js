/* Original North Cape surf. Input rock transforms and all tide heights are in world metres.
 * Install after TideCoast has batched the basalt. No external textures or dependencies beyond THREE. */
(function () {
  'use strict';
  const T = window.THREE;
  const CELL = .54, HALF_RANGE = 1.92, STEP = 1.28, MARGIN = 9;
  const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));

  function makeSections(group, material, mean) {
    const rocks = [], mat = new T.Matrix4(), local = new T.Matrix4(), v = new T.Vector3();
    let minX = Infinity, minZ = Infinity, maxX = -Infinity, maxZ = -Infinity;
    group.updateMatrixWorld(true);
    const inverseGroup = new T.Matrix4().copy(group.matrixWorld).invert();
    group.traverse(mesh => {
      if (!mesh.isInstancedMesh || mesh.material !== material) return;
      const pos = mesh.geometry.attributes.position, idx = mesh.geometry.index;
      const transformed = new Float32Array(pos.count * 3);
      for (let i = 0; i < mesh.count; i++) {
        mesh.getMatrixAt(i, mat);
        local.multiplyMatrices(inverseGroup, mesh.matrixWorld).multiply(mat);
        const e = local.elements, layers = [[], [], [], []];
        const rock = {x: e[12], z: e[14], layers};
        for (let j = 0; j < pos.count; j++) {
          v.fromBufferAttribute(pos, j).applyMatrix4(local).toArray(transformed, j * 3);
        }
        for (let j = 0, end = idx ? idx.count : pos.count; j < end; j += 3) {
          const a = (idx ? idx.getX(j) : j) * 3, b = (idx ? idx.getX(j + 1) : j + 1) * 3,
            c = (idx ? idx.getX(j + 2) : j + 2) * 3;
          const y0 = transformed[a + 1], y1 = transformed[b + 1], y2 = transformed[c + 1];
          const bottom = Math.min(y0, y1, y2), top = Math.max(y0, y1, y2);
          for (let l = 0; l < 4; l++) {
            const h = mean - HALF_RANGE + l * STEP;
            if (h <= bottom || h > top) continue;
            const segment = [];
            function cut(n, m) {
              const yn = transformed[n + 1], ym = transformed[m + 1];
              if ((yn < h) === (ym < h)) return;
              const f = (h - yn) / (ym - yn);
              segment.push(transformed[n] + (transformed[m] - transformed[n]) * f,
                transformed[n + 2] + (transformed[m + 2] - transformed[n + 2]) * f);
            }
            cut(a, b); cut(b, c); cut(c, a);
            if (segment.length !== 4) continue;
            layers[l].push(segment);
            minX = Math.min(minX, segment[0], segment[2]); maxX = Math.max(maxX, segment[0], segment[2]);
            minZ = Math.min(minZ, segment[1], segment[3]); maxZ = Math.max(maxZ, segment[1], segment[3]);
          }
        }
        if (layers[1].length || layers[2].length) rocks.push(rock);
      }
    });
    if (!rocks.length) throw new Error('TideSurf needs batched, intersecting basalt geometry');
    const x0 = Math.floor(minX - MARGIN), z0 = Math.floor(minZ - MARGIN);
    const w = Math.ceil((maxX + MARGIN - x0) / CELL), h = Math.ceil((maxZ + MARGIN - z0) / CELL);
    const data = new Uint8Array(w * h * 4), diag = Math.SQRT2;
    for (let l = 0; l < 4; l++) {
      const land = new Uint8Array(w * h), distance = new Float32Array(w * h);
      // Fill each closed section separately, then take their union. Overlapping stacks have no inner foam seam.
      for (const rock of rocks) {
        const rows = new Map();
        for (const [ax, az, bx, bz] of rock.layers[l]) {
          if (az === bz) continue;
          const first = Math.ceil((Math.min(az, bz) - z0) / CELL - .5);
          const last = Math.ceil((Math.max(az, bz) - z0) / CELL - .5);
          for (let z = first; z < last; z++) {
            const hit = ax + (bx - ax) * (z0 + (z + .5) * CELL - az) / (bz - az);
            let row = rows.get(z); if (!row) rows.set(z, row = []);
            row.push(hit);
          }
        }
        for (const [z, hits] of rows) {
          hits.sort((a, b) => a - b);
          for (let i = 0; i + 1 < hits.length; i += 2) {
            const left = Math.ceil((hits[i] - x0) / CELL - .5);
            const right = Math.ceil((hits[i + 1] - x0) / CELL - .5);
            land.fill(1, z * w + left, z * w + right);
          }
        }
      }
      distance.fill(120);
      for (let z = 1; z < h - 1; z++) for (let x = 1; x < w - 1; x++) {
        const i = z * w + x, v = land[i];
        if (v !== land[i - 1] || v !== land[i + 1] || v !== land[i - w] || v !== land[i + w]) distance[i] = .50;
      }
      for (let z = 1; z < h; z++) for (let x = 1; x < w - 1; x++) {
        const i = z * w + x;
        distance[i] = Math.min(distance[i], distance[i - 1] + 1, distance[i - w] + 1,
          distance[i - w - 1] + diag, distance[i - w + 1] + diag);
      }
      for (let z = h - 2; z >= 0; z--) for (let x = w - 2; x >= 1; x--) {
        const i = z * w + x;
        distance[i] = Math.min(distance[i], distance[i + 1] + 1, distance[i + w] + 1,
          distance[i + w + 1] + diag, distance[i + w - 1] + diag);
      }
      for (let i = 0; i < distance.length; i++) {
        const d = distance[i] * CELL * (land[i] ? -1 : 1);
        data[i * 4 + l] = Math.round(clamp((d + 7) / 16, 0, 1) * 255);
      }
    }
    function sample(x, z, l) {
      const fx = clamp((x - x0) / CELL - .5, 0, w - 1.01), fz = clamp((z - z0) / CELL - .5, 0, h - 1.01);
      const ix = Math.floor(fx), iz = Math.floor(fz), sx = fx - ix, sz = fz - iz;
      const i = (iz * w + ix) * 4 + l;
      return ((data[i] * (1 - sx) + data[i + 4] * sx) * (1 - sz)
        + (data[i + w * 4] * (1 - sx) + data[i + w * 4 + 4] * sx) * sz) * 16 / 255 - 7;
    }
    const texture = new T.DataTexture(data, w, h, T.RGBAFormat);
    texture.minFilter = texture.magFilter = T.LinearFilter; texture.needsUpdate = true;
    return {rocks, sample, texture, rect: new T.Vector4(x0, z0, 1 / (w * CELL), 1 / (h * CELL)), w, h};
  }

  function hash(x, y) {
    let i = Math.imul(x + 1, 1597334677) ^ Math.imul(y + 181, 3812015801);
    i = Math.imul(i ^ i >>> 16, 2246822507);
    return ((i ^ i >>> 13) >>> 0) / 4294967296;
  }

  // A seamless set of bubble films, collapsed cell walls and perforated bubbles at three scales.
  function bubbleTexture() {
    const size = 128, cells = 13, bytes = new Uint8Array(size * size * 4);
    const seeds = [];
    for (let j = 0; j < cells; j++) for (let i = 0; i < cells; i++)
      seeds.push([.13 + .74 * hash(i, j), .13 + .74 * hash(j + 53, i), hash(i + 217, j)]);
    for (let z = 0; z < size; z++) for (let x = 0; x < size; x++) {
      const u = x / size * cells, v = z / size * cells;
      let a = 9, b = 9, salt = 0;
      for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
        const ix = Math.floor(u) + dx, iz = Math.floor(v) + dz;
        const s = seeds[((iz + cells) % cells) * cells + ((ix + cells) % cells)];
        const d = Math.hypot(ix + s[0] - u, iz + s[1] - v);
        if (d < a) { b = a; a = d; salt = s[2]; } else b = Math.min(b, d);
      }
      const i = (z * size + x) * 4;
      bytes[i] = Math.round(clamp(1 - (b - a) * (5 + salt * 3), 0, 1) * 255);
      bytes[i + 1] = Math.round(clamp(1 - a * (1.05 + salt * .55), 0, 1) * 255);
      bytes[i + 2] = Math.round(salt * 255); bytes[i + 3] = 255;
    }
    const tex = new T.DataTexture(bytes, size, size);
    tex.wrapS = tex.wrapT = T.RepeatWrapping; tex.magFilter = T.LinearFilter;
    tex.minFilter = T.LinearMipmapLinearFilter; tex.generateMipmaps = true; tex.needsUpdate = true;
    return tex;
  }

  const declarations = `
    uniform float surfT,surfMean,surfSlice,surfSurvey,surfOn;
    float surfHeight(vec2 surface,float t) {
      if(surfSurvey>.5){
        float a=6.28318530718*((t-(surface.y+92.+.16*(surface.x+46.))/4.48)/5.8);
        return -(.81+.075*cos(a*.31))*cos(a)+.085*sin(2.*a)+.037*sin(surface.x*.38-surface.y*.27+t*.85);
      }
      // Undo the horizontal displacement of the source mesh to evaluate a fixed world-space contact.
      vec2 p=surface;
      p.x-=.18*cos(dot(p,vec2(.23,.11))+1.12*t);
      p.x=surface.x-.18*cos(dot(p,vec2(.23,.11))+1.12*t);
      return .46*sin(dot(p,vec2(.23,.11))+t*1.12)+.34*sin(dot(p,vec2(-.17,.29))-t*.88)
           +.18*sin(dot(p,vec2(.49,-.41))+t*1.42)+.09*sin(dot(p,vec2(.81,.62))-t*1.64);
    }
    float surfAge(vec2 p,float t) {
      if(surfSurvey>.5)return fract((t-(p.y+92.+.16*(p.x+46.))/4.48)/5.8-.35)*5.8;
      p.x-=.18*cos(dot(p,vec2(.23,.11))+1.12*t);
      return fract((dot(p,vec2(.23,.11))+1.12*t-.56)/6.28318530718)*5.60998688;
    }
    float surfSliceMix(vec4 d,float y){
      float k=clamp((y-surfSlice)/1.28,0.,3.);
      return mix(mix(mix(d.r,d.g,min(k,1.)),d.b,clamp(k-1.,0.,1.)),d.a,clamp(k-2.,0.,1.));
    }
  `;
  const waterDecl = `
    uniform sampler2D surfShore,surfCell;
    uniform vec4 surfRect;
    float surfDistance(vec2 p,float h){
      return surfSliceMix(texture2D(surfShore,(p-surfRect.xy)*surfRect.zw),h)*16.-7.;
    }
  `;
  const foamFragment = `
    if(surfOn>.5){
      float coast=surfDistance(p,vSea.y);
      if(coast<7.2){
        float age=surfAge(p,t);
        float cycle=smoothstep(0.,.6,age)*(1.-smoothstep(2.9,5.45,age));
        float pulse=clamp(.48+.74*vHeight,0.,1.);
        vec2 drift=vec2(.11,-.06)*t;
        float bleed=noiseA.g*.67+noiseB.b*.33;
        vec2 uvFoam=p*vec2(.094,.16)+vec2(.09*noiseA.b,.12*noiseB.r);
        vec3 cells=texture2D(surfCell,uvFoam+drift*.14).rgb;
        vec3 tears=texture2D(surfCell,p.yx*vec2(.048,.077)-drift*.06+vec2(.10*noiseB.b)).rgb;
        float rag=(bleed-.47)*1.65+(tears.g-.54)*.92;
        float lip=.56+.88*pulse+.46*cycle;
        float denseFoam=1.-smoothstep(.05,lip+.36,coast+rag);
        float edge=.8+2.75*(1.-exp(-age*.84))+rag;
        float ribbon=(1.-smoothstep(.08,1.00,abs(coast-edge)))*cycle;
        float decay=1.-smoothstep(.45,4.7+rag,coast);
        float lace=decay*(.15+.73*cycle)*(.14+.68*cells.r)*smoothstep(.30,.78,tears.g+.22*bleed);
        float churn=denseFoam*(.56+.40*cells.g)+ribbon*(.16+.49*cells.r)*smoothstep(.26,.70,tears.g)+lace;
        float protection=smoothstep(4.,9.,length(p-vec2(-42.,-120.)))*smoothstep(4.,10.,length(p-vec2(-30.,-116.)));
        float cover=clamp(churn,0.,.95)*mix(.20,1.,protection)*(1.-.47*smoothstep(65.,155.,dist));
        vec3 froth=mix(vec3(.36,.46,.45),vec3(.81,.88,.81),.27+.54*bleed+.16*cells.b);
        lit=mix(lit,froth,cover);
      }
    }
  `;
  const wetFragment = `
    if(surfOn>.5){
      vec3 srf=vBasalt/.24;
      float band=srf.y-surfMean;
      if(band<2.25 && band> -5.){
        float h=surfHeight(srf.xz,surfT);
        float previous=surfHeight(srf.xz,surfT-1.35);
        float waterfilm=max(h,previous*.85)+.17+.12*sin(srf.x*2.1+srf.z*.89);
        float wet=(1.-smoothstep(waterfilm-.12,waterfilm+.3,band));
        float patina=(1.-smoothstep(.69,1.68,band))*(1.-wet)*.36;
        diffuseColor.rgb*=mix(vec3(1.),vec3(.51,.62,.61),wet);
        diffuseColor.rgb*=mix(vec3(1.),vec3(.77,.88,.78),patina);
        roughnessFactor=mix(roughnessFactor,.27,wet*.91);
      }
    }
  `;

  function pickAnchors(atlas) {
    const result = [];
    for (let r = 0; r < atlas.rocks.length; r++) {
      const rock = atlas.rocks[r], candidates = [];
      for (const [ax, az, bx, bz] of rock.layers[1]) {
        let x = (ax + bx) * .5, z = (az + bz) * .5;
        const d = atlas.sample(x, z, 1);
        if (Math.abs(d) > .63 || Math.hypot(x + 42, z + 120) < 8 || Math.hypot(x + 30, z + 116) < 9) continue;
        let nx = atlas.sample(x + .85, z, 1) - atlas.sample(x - .85, z, 1);
        let nz = atlas.sample(x, z + .85, 1) - atlas.sample(x, z - .85, 1);
        const length = Math.hypot(nx, nz);
        if (length < 1.13) continue;
        nx /= length; nz /= length;
        x -= d * nx; z -= d * nz;
        if (atlas.sample(x + 2.6 * nx, z + 2.6 * nz, 1) < 1.7) continue;
        const offsets = [];
        for (let l = 0; l < 4; l++) {
          let a = -5.8, b = 5.8;
          if (atlas.sample(x + nx * a, z + nz * a, l) > 0 || atlas.sample(x + nx * b, z + nz * b, l) < 0) break;
          for (let k = 0; k < 7; k++) {
            const m = (a + b) / 2;
            if (atlas.sample(x + nx * m, z + nz * m, l) < 0) a = m; else b = m;
          }
          offsets.push((a + b) / 2);
        }
        if (offsets.length !== 4) continue;
        // Favor faces exposed to the incoming swell and the open water south of the lighthouse.
        const score = .60 * (nx * .71 + nz * .71) + .27 * nz + .15 * Math.min(length, 1.8)
          + .24 * hash(Math.round(x * .33), Math.round(z * .33))+.09*Math.min(Math.hypot(x-rock.x,z-rock.z),8);
        candidates.push({x, z, nx, nz, offsets, score, size: Math.hypot(x - rock.x, z - rock.z)});
      }
      candidates.sort((a, b) => b.score - a.score);
      let count = 0;
      for (const a of candidates) {
        if (result.some(o => Math.hypot(o.x - a.x, o.z - a.z) < 7.4)) continue;
        result.push(a); count++;
        if (count >= (a.size > 6.8 ? 2 : 1) || result.length >= 72) break;
      }
      if (result.length >= 72) break;
    }
    return result;
  }

  function makePlumes(anchors, uniforms) {
    const pos=[], coord=[], normal=[], offsets=[], shape=[], style=[], indices=[];
    function add(a,x,y,type,seed,side,width,height,delay){
      pos.push(a.x,0,a.z); coord.push(x,y); normal.push(a.nx,a.nz);
      offsets.push(...a.offsets); shape.push(side,width,height,delay); style.push(type,seed);
    }
    for(let k=0;k<anchors.length;k++){
      const a=anchors[k],width=clamp(a.size*.39,1.05,3.4),height=clamp(.68+a.size*.24,1.3,3.35);
      // Three connected scallops form a sheet. Narrow secondary lobes follow its leading edge.
      for(let lane=0;lane<5;lane++){
        const seed=hash(k,lane), side=(lane<3?lane-1:(lane===3?-.42:.49))*width*.48;
        const w=width*(lane<3?.69:.28)*(.85+seed*.32), h=height*(lane===1?1.07:.59+.36*seed);
        const start=pos.length/3;
        for(let row=0;row<4;row++)for(let col=0;col<5;col++){
          add(a,col*.5-1,row/3,0,seed,side,w,h,.06+lane*.063);
          if(row<3&&col<4){const i=start+row*5+col;indices.push(i,i+1,i+5,i+1,i+6,i+5);}
        }
      }
      // Sparse thrown water beads follow a short ballistic arc. Quads retain physical world scale.
      for(let j=0;j<18;j++){
        const seed=hash(k+17,j+56), start=pos.length/3, side=(2*hash(k,j+913)-1)*width*.88;
        const size=.026+.075*hash(k+19,j),h=height*(.55+.88*hash(k+3,j));
        for(const [x,y] of [[-1,0],[1,0],[-1,1],[1,1]])add(a,x,y,1,seed,side,size,h,.13+.22*hash(k+65,j));
        indices.push(start,start+1,start+2,start+1,start+3,start+2);
      }
    }
    const g=new T.BufferGeometry();
    for(const [key,data,n] of [['position',pos,3],['uv',coord,2],['sNormal',normal,2],['sOffsets',offsets,4],['sShape',shape,4],['sStyle',style,2]])
      g.setAttribute(key,new T.Float32BufferAttribute(data,n));
    g.setIndex(indices);
    const m=new T.ShaderMaterial({uniforms,transparent:true,depthWrite:false,side:T.DoubleSide,forceSinglePass:true,
      vertexShader: `
        ${declarations}
        attribute vec2 sNormal,sStyle;
        attribute vec4 sOffsets,sShape;
        varying vec2 vPatch;varying vec4 vSurf;varying float vDistance;
        void main(){
          vec2 base=position.xz,n=sNormal,tangent=vec2(-n.y,n.x);
          float age=surfAge(base,surfT)-sShape.w;
          float strength=smoothstep(-.29,.68,surfHeight(base,surfT-age+.25));
          float u=clamp(age/(1.03+.44*strength+.19*sStyle.y),0.,1.);
          float lift=4.*u*(1.-u),h=sShape.z*(.44+.84*strength);
          float sea=surfMean+surfHeight(base,surfT);
          float offset=surfSliceMix(sOffsets,sea);
          vec2 p=base+n*(offset+.20);
          float y;
          if(sStyle.x<.5){
            float crown=(1.-.63*pow(abs(uv.x),1.52))*(.90+.10*sin(uv.x*5.+sStyle.y*24.));
            float yrel=uv.y*crown*lift;
            p+=tangent*(sShape.x+uv.x*sShape.y*(.38+.68*sqrt(u))+.36*yrel*u);
            p+=n*(.14+.35*uv.y+.73*uv.y*h*u*u);
            p+=vec2(-.38,.13)*h*u*yrel;
            y=sea-.25+yrel*h;
          }else{
            p+=tangent*(sShape.x*(.58+u)+uv.x*sShape.y+.26*u*lift);
            p+=n*(.32+u*(.56+.78*sStyle.y))+vec2(-.26,.08)*h*u;
            y=sea-.14+h*lift+(uv.y-.5)*sShape.y*2.5;
          }
          vec3 world=vec3(p.x,y,p.y);
          vDistance=length(world-cameraPosition);
          vPatch=uv;
          vSurf=vec4(sStyle,smoothstep(.0,.11,u)*(1.-smoothstep(.49,1.,u))*(.43+.57*strength),u);
          gl_Position=projectionMatrix*viewMatrix*vec4(world,1.);
        }`,
      fragmentShader: `
        uniform sampler2D surfCell;uniform vec3 surfFog;uniform float surfDensity;
        varying vec2 vPatch;varying vec4 vSurf;varying float vDistance;
        void main(){
          vec2 st=vPatch;float alpha;
          if(vSurf.x<.5){
            vec2 flow=vec2(st.x*.28+vSurf.y,st.y*.21-vSurf.w*.18);
            vec3 veil=texture2D(surfCell,flow+vSurf.y*.64).rgb;
            float taper=smoothstep(0.,.19,st.y)*(1.-smoothstep(.55,1.,abs(st.x)));
            float rim=1.-smoothstep(.74+.19*veil.g,1.,st.y);
            alpha=taper*rim*(.18+.41*veil.g+.22*veil.r)*vSurf.z;
          }else{
            vec2 q=vec2(st.x,(st.y-.5)*2.);
            alpha=(1.-smoothstep(.22,1.,dot(q,q)))*vSurf.z*.79;
          }
          float air=exp(-surfDensity*surfDensity*vDistance*vDistance);
          alpha*=air*(1.-.60*smoothstep(80.,150.,vDistance))*smoothstep(.55,2.,vDistance);
          if(alpha<.018)discard;
          vec3 tint=mix(surfFog,mix(vec3(.55,.68,.69),vec3(.96,.99,.93),st.y*.64+.2),air);
          gl_FragColor=vec4(tint,alpha);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`});
    const mesh=new T.Mesh(g,m);mesh.name='Basalt impact sheets and salt drops';
    mesh.frustumCulled=false;mesh.renderOrder=1;
    return mesh;
  }

  function addAfter(source,token,code){
    if(!source.includes(token))throw new Error('TideSurf material hook missing '+token);
    return source.replace(token,token+'\n'+code);
  }

  function create(group,{water,rockMaterial,index,fog}){
    const started=performance.now(), mean=index===8?-2.16:-4, atlas=makeSections(group,rockMaterial,mean);
    const cells=bubbleTexture(), anchors=pickAnchors(atlas);
    const uniforms={surfT:{value:0},surfMean:{value:mean},surfSlice:{value:mean-HALF_RANGE},surfOn:{value:1},
      surfSurvey:{value:index===8?1:0},surfShore:{value:atlas.texture},surfCell:{value:cells},surfRect:{value:atlas.rect},
      surfFog:{value:fog?.color||new T.Color(.23,.29,.31)},surfDensity:{value:fog?.density||.0065}};
    const plume=makePlumes(anchors,uniforms);group.add(plume);
    let active=true;
    const stored=[];
    for(const [material,kind] of [[water.material,'water'],[rockMaterial,'rock']]){
      const ownHook=Object.hasOwn(material,'onBeforeCompile'),prev=material.onBeforeCompile;
      const ownKey=Object.hasOwn(material,'customProgramCacheKey'),previousKey=material.customProgramCacheKey;
      // Default three.js cache keys stringify the current hook; capture the upstream key before wrapping it.
      const prefix=previousKey.call(material);
      function hook(shader,renderer){
        prev.call(this,shader,renderer);
        if(!active)return;
        Object.assign(shader.uniforms,uniforms);
        if(kind==='water'){
          shader.fragmentShader=declarations+waterDecl+shader.fragmentShader;
          const token='lit=mix(lit,lit*vec3(.26,.39,.40)+vec3(.004,.009,.010),uInside);';
          if(!shader.fragmentShader.includes(token))throw new Error('TideSurf missing coastal water lighting');
          shader.fragmentShader=shader.fragmentShader.replace(token,foamFragment+'\n'+token);
        }else{
          shader.fragmentShader=addAfter(shader.fragmentShader,'#include <common>',declarations);
          shader.fragmentShader=addAfter(shader.fragmentShader,'#include <roughnessmap_fragment>',wetFragment);
        }
      }
      const key=()=>prefix+'|NorthCapeSurf17.'+kind;
      material.onBeforeCompile=hook;material.customProgramCacheKey=key;material.needsUpdate=true;
      stored.push({material,kind,ownHook,ownKey,prev,previousKey,hook,key});
    }
    const stats={rocks:atlas.rocks.length,anchors:anchors.length,atlas:[atlas.w,atlas.h],triangles:plume.geometry.index.count/3,
      initMs:performance.now()-started,examples:anchors.filter(a=>a.z< -80&&a.x> -5&&a.x<36).slice(-4).map(a=>[+a.x.toFixed(2),+a.z.toFixed(2)])};
    // The sliced contours were only needed for building the texture and impact mesh.
    atlas.rocks.length=0;delete atlas.sample;
    return {
      stats,
      update(t,level){uniforms.surfT.value=t;uniforms.surfMean.value=level;},
      setEnabled(on){uniforms.surfOn.value=on?1:0;plume.visible=on;},
      dispose(){
        if(!active)return;
        active=false;
        for(const {material,ownHook,ownKey,prev,previousKey,hook,key} of stored){
          if(material.onBeforeCompile===hook){ if(ownHook)material.onBeforeCompile=prev;else delete material.onBeforeCompile; }
          if(material.customProgramCacheKey===key){ if(ownKey)material.customProgramCacheKey=previousKey;else delete material.customProgramCacheKey; }
          if(material.uniforms){
            for(const name of Object.keys(uniforms))if(material.uniforms[name]===uniforms[name])delete material.uniforms[name];
          }
          material.needsUpdate=true;
        }
        group.remove(plume);plume.geometry.dispose();plume.material.dispose();atlas.texture.dispose();cells.dispose();
      }
    };
  }
  window.TideSurf={create};
})();
