// Original periodic short-wave height spectrum and crest coverage, North Cape.
window.TideWindSea = (() => {
  'use strict';
  const shared = new WeakMap();
  const size = 256;
  const mask = size - 1;
  const tau = Math.PI * 2;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  function smooth(a, b, v) {
    const q = clamp((v - a) / (b - a), 0, 1);
    return q * q * (3 - 2 * q);
  }

  function makeSpectrum(T) {
    let seed = 0xa3cd21e;
    function rand() {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed / 4294967296;
    }
    const heights = new Float32Array(size * size);
    const sin = new Float32Array(size);
    const cos = new Float32Array(size);
    for (let i = 0; i < size; i++) {
      sin[i] = Math.sin(tau * i / size);
      cos[i] = Math.cos(tau * i / size);
    }
    // Random phase, directional spreading and falling high-frequency energy.
    // Integer wave vectors make both the field and its derivatives periodic.
    for (let band = 0; band < 3; band++) {
      const count = [20, 28, 24][band];
      for (let n = 0; n < count; n++) {
        const k = [3, 6, 12][band] * (1 + 1.10 * rand());
        const phi = (rand() + rand() - 1) * [1.25, 1.10, 1.03][band];
        const kx = Math.max(1, Math.round(k * Math.cos(phi)));
        const ky = Math.round(k * Math.sin(phi));
        const phase = rand() * tau;
        const a = (0.6 + 0.8 * rand()) * [0.43, 0.21, 0.075][band] / Math.sqrt(count);
        const cp = Math.cos(phase) * a, sp = Math.sin(phase) * a;
        for (let z = 0; z < size; z++) {
          const row = z * size;
          let theta = ky * z;
          for (let x = 0; x < size; x++, theta += kx) {
            heights[row + x] += cp * cos[theta & mask] - sp * sin[theta & mask];
          }
        }
      }
    }
    function idx(x, z) { return (x & mask) + size * (z & mask); }
    function at(field, x, z) {
      const i = Math.floor(x), j = Math.floor(z), u = x - i, v = z - j;
      const low = field[idx(i,j)] * (1-u) + field[idx(i+1,j)] * u;
      const high = field[idx(i,j+1)] * (1-u) + field[idx(i+1,j+1)] * u;
      return low * (1-v) + high * v;
    }
    const warped = new Float32Array(heights.length);
    // A slow cross-front current bends the fronts. The bound second harmonic
    // narrows their rounded tops while keeping the troughs comparatively open.
    let variance = 0;
    for (const h of heights) variance += h*h;
    const invHeight = Math.sqrt(heights.length / variance);
    for (let z = 0; z < size; z++) for (let x = 0; x < size; x++) {
      const bend = 4.4*sin[(x+z+19)&mask] + 3.4*sin[(3*z-x)&mask] + 1.5*sin[(2*x+2*z)&mask];
      const skew = 2.6*sin[(x-2*z)&mask] + 2.0*cos[(2*x+z+35)&mask];
      const h = at(heights, x+bend, z+skew)*invHeight;
      warped[idx(x,z)] = h + 0.100*(h*h-1);
    }
    let slopePower = 0;
    for (let z = 0; z < size; z++) for (let x = 0; x < size; x++) {
      const dh = (warped[idx(x+1,z)]-warped[idx(x-1,z)])*.5;
      slopePower += dh*dh;
    }
    const invSlope = Math.sqrt(heights.length / slopePower);
    const pixels = new Uint8Array(heights.length*4);
    for (let z = 0; z < size; z++) for (let x = 0; x < size; x++) {
      const k = idx(x,z), h = warped[k];
      const a = warped[idx(x-1,z)], b = warped[idx(x+1,z)];
      const sx = (b-a)*.5*invSlope;
      const sz = (warped[idx(x,z+1)]-warped[idx(x,z-1)])*.5*invSlope;
      const curl = (2*h-a-b)*invSlope;
      // Crest foam forms on only a fraction of the exposed lips. Bake
      // its occupied AREA into alpha, so distant mip levels carry energy.
      const tear = at(heights, 3*x+21, 3*z+29)*invHeight;
      const grain = at(heights, 7*x+9, 5*z+31)*invHeight;
      const onset = smooth(.55,1.65,h+.30*tear);
      const ridge = (1-smooth(.16,.90,Math.abs(sx+.36)))*smooth(.015,.29,curl);
      const shoulder = smooth(.12,.85,-sx)*smooth(.04,.32,curl);
      const holes = smooth(-.62,.65,.62*tear+.38*grain);
      const lip = onset*holes*(.89*ridge+.25*shoulder);
      const o=k*4;
      pixels[o]   = Math.round(clamp(.5+sx/7.0,0,1)*255);
      pixels[o+1] = Math.round(clamp(.5+sz/7.0,0,1)*255);
      pixels[o+2] = Math.round(clamp(.5+h/6.5,0,1)*255);
      pixels[o+3] = Math.round(clamp(lip,0,1)*255);
    }
    const texture = new T.DataTexture(pixels, size, size, T.RGBAFormat, T.UnsignedByteType);
    texture.name = '北岬短重力波·斜率与碎沫';
    texture.wrapS = texture.wrapT = T.RepeatWrapping;
    texture.magFilter = T.LinearFilter;
    texture.minFilter = T.LinearMipmapLinearFilter;
    texture.generateMipmaps = true;
    texture.anisotropy = 4;
    texture.colorSpace = T.NoColorSpace;
    texture.needsUpdate = true;
    return texture;
  }

  const declarations = `
    uniform sampler2D uWindSea;
  `;
  const surface = `
      // Three advected bands share one band-limited periodic slope atlas.
      vec2 wind=vec2(.872,.49),crosswind=vec2(-.49,.872);
      vec2 wsAxes=vec2(dot(p,wind),dot(p,crosswind));
      vec4 wsLong=texture2D(uWindSea,wsAxes/18.73-vec2(.071,.0053)*t);
      // Turn the shorter trains across the long ones and bend their phase
      // through the slower underlying swell. Each has its own phase speed.
      vec2 wsMidX=vec2(.925,-.380),wsMidY=vec2(.380,.925);
      vec2 wsMidUV=vec2(dot(wsAxes,wsMidX),dot(wsAxes,wsMidY))/6.87;
      wsMidUV+=vec2(.024,-.013)*(wsLong.b-.5)+vec2(.237,.491)-vec2(.105,.007)*t;
      vec4 wsMid=texture2D(uWindSea,wsMidUV);
      vec2 wsFineX=vec2(.948,.318),wsFineY=vec2(-.318,.948);
      vec2 wsFineUV=vec2(dot(wsAxes,wsFineX),dot(wsAxes,wsFineY))/2.46;
      wsFineUV+=vec2(.037,-.024)*(wsMid.b-.5)+vec2(.032,.755)-vec2(.170,-.011)*t;
      vec4 wsFine=texture2D(uWindSea,wsFineUV);
      // Facets crossing a pixel within one exposure broaden the reflection
      // instead of intermittently swinging its entire contribution. Calculate
      // coverage in metres per pixel to retain a resolved telephoto band.
      float wsPixel;
      #if __VERSION__ >= 300
        vec2 wsPx=dFdx(wsAxes),wsPy=dFdy(wsAxes);
        wsPixel=max(length(wsPx*vec2(1.,.58)),length(wsPy*vec2(1.,.58)));
      #else
        wsPixel=.0009*dist/max(.085,abs(eye.y));
      #endif
      vec3 wsSpan=vec3(1.8,6.8,21.)*wsPixel;
      vec3 wsResolved=inversesqrt(vec3(1.)+wsSpan*wsSpan);
      vec2 wsGradient=(wsLong.rg-.5)*(.93*wsResolved.x);
      wsGradient+=(wsMidX*(wsMid.r-.5)+wsMidY*(wsMid.g-.5))*(.61*wsResolved.y);
      wsGradient+=(wsFineX*(wsFine.r-.5)+wsFineY*(wsFine.g-.5))*(.32*wsResolved.z);
      // A changing lee face shelters the centimetre-to-decimetre wavelets.
      float wsExposure=.87+.16*(wsLong.b-.5)+.14*clamp(vHeight,-1.,1.);
      // The long swell carries into the entrance. Short wind seas lose their
      // steep faces progressively inside both yellow marks.
      vec2 wsPort=p-uBayLine.xy;
      float wsLee=smoothstep(0.,12.,dot(wsPort,uBayLine.zw))*
        (1.-smoothstep(10.,20.,abs(dot(wsPort,vec2(-uBayLine.w,uBayLine.z)))));
      vec2 wsSlope=(wind*wsGradient.x+crosswind*wsGradient.y)*wsExposure*(1.-.54*wsLee);
      vec3 normal=normalize(vec3(-dx-wsSlope.x,1.,-dz-wsSlope.y));
  `;
  // Replaces the baseline two sky-mix lines. Keep the following projective
  // reflection branch so real piers, deck and hull can mask the sky normally.
  const reflection = `
      // A reflected ray pointing down meets another wave face. Low-angle
      // rays also see the horizon over a finite capillary slope distribution.
      float wsRayHeight=reflected.y;
      r.y=sqrt(max(wsRayHeight,0.)*max(wsRayHeight,0.)+.00058);
      vec2 wsSkyUV=envUV(normalize(r));
      vec3 wsSkyLight;
      #if __VERSION__ >= 300
        vec2 wsSkySize=vec2(textureSize(uSky,0));
        vec2 wsDu=dFdx(wsSkyUV), wsDv=dFdy(wsSkyUV);
        wsDu.x-=floor(wsDu.x+.5); wsDv.x-=floor(wsDv.x+.5);
        float wsFoot=max(length(wsDu*wsSkySize),length(wsDv*wsSkySize));
        // Minimum angular pixel footprint is in radians, independent of
        // panorama size. Preserve resolved cloud shapes further up the sky.
        float wsRadius=mix(.041,.018,smoothstep(.02,.56,wsRayHeight))+.008*(1.-wsResolved.z);
        float wsMip=log2(max(1.,max(wsFoot,wsSkySize.y*wsRadius/PI)));
        wsSkyLight=textureLod(uSky,wsSkyUV,wsMip).rgb;
      #else
        wsSkyLight=texture2D(uSky,wsSkyUV,2.8).rgb;
      #endif
      wsSkyLight=mix(vec3(.30,.42,.47),wsSkyLight,uHasSky);
      // The masking transition is continuous across the geometric horizon.
      // The leeward face returns dark sea fill rather than a clamped copy of the sun.
      float wsSkyOpen=smoothstep(-.17,.16,wsRayHeight);
      float wsHaze=.17*(1.-smoothstep(.01,.24,wsRayHeight));
      vec3 wsLeeward=mix(vec3(.024,.055,.061),vec3(.043,.083,.086),wsLong.b);
      vec3 sky=mix(wsLeeward,mix(wsSkyLight,uFog*.78,wsHaze),wsSkyOpen);
  `;

  const breaking = `
      // Break the exposed short trains at the top of the broad travelling
      // swell. Pre-filtered coverage leaves disconnected pale marks at range.
      float crest=smoothstep(-.12,.88,vHeight+.37*(wsLong.b-.5));
      float wsExposed=smoothstep(-.22,.22,-dot(vec2(dx,dz),wind)+.33*(wsLong.b-.5));
      float wsLiveLip=wsLong.a*(.12+.71*crest+.17*wsExposed);
      float wsSpill=wsMid.a*smoothstep(.54,.83,wsLong.b+.15*vHeight)*(.28+.72*crest);
      float foam=clamp(wsLiveLip*.92+wsSpill*.52,0.,.90);
      vec3 wsBubbles=mix(vec3(.30,.39,.385),vec3(.62,.71,.67),.23+.60*wsMid.b);
      float wsBack=crest*(.27+.73*smoothstep(-.10,.28,dot(normal.xz,wind)));
      lit+=vec3(.002,.023,.022)*wsBack;
      lit=mix(lit,wsBubbles,foam*.79*(1.-.73*wsLee));
  `;

  function create(T) {
    let entry = shared.get(T);
    if (!entry) {
      entry = {texture:makeSpectrum(T), refs:0};
      shared.set(T,entry);
    }
    entry.refs++;
    const uniforms={uWindSea:{value:entry.texture}};
    let disposed=false;
    return {
      uniforms,
      dispose() {
        if (disposed) return;
        disposed=true;
        uniforms.uWindSea.value=null;
        if (--entry.refs === 0) {
          entry.texture.dispose();
          entry.texture=null;
          shared.delete(T);
        }
      }
    };
  }
  return {create, declarations, surface, reflection, breaking};
})();
