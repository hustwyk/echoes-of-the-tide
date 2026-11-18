// Original procedural sound design. Pass a live AudioContext (or an OfflineAudioContext)
// and the game mixer. update receives a TideCoop.Session and elapsed seconds.
window.TideAudioScene = (() => {
  'use strict';
  const clamp = (v, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
  const panFor = side => side === 0 ? -.48 : side === 1 ? .48 : 0;
  const disconnect = node => node.disconnect();

  function generator(seed) {
    return () => {
      seed ^= seed << 13;
      seed ^= seed >>> 17;
      seed ^= seed << 5;
      return (seed >>> 0) / 4294967296;
    };
  }

  function makeNoise(ctx) {
    const random = generator(0xc47100be);
    const length = Math.ceil(ctx.sampleRate * 3.73);
    const white = ctx.createBuffer(1, length, ctx.sampleRate);
    const pink = ctx.createBuffer(1, length, ctx.sampleRate);
    const w = white.getChannelData(0), p = pink.getChannelData(0);
    let slow = 0, mid = 0, fast = 0;
    for (let i = 0; i < length; i++) {
      const n = random() * 2 - 1;
      slow = slow * .996 + n * .075;
      mid = mid * .963 + n * .18;
      fast = fast * .64 + n * .59;
      w[i] = n;
      p[i] = (slow + mid + fast + n * .18) * .51;
    }
    // Smooth just the wrap in the correlated noise; retain the transients elsewhere.
    const seam = p[length - 1] - p[0];
    for (let i = 0; i < 160; i++) p[i] += seam * (1 - i / 160);
    return {white, pink};
  }

  function create(ctx, output) {
    const random = generator(0x791b24d1);
    const range = (a, b) => a + random() * (b - a);
    const noise = makeNoise(ctx);
    let run = null, dead = false, previous = null;
    const filter = (type, hz, q = .7) => {
      const node = ctx.createBiquadFilter();
      node.type = type;
      node.frequency.value = clamp(hz, 16, ctx.sampleRate * .47);
      node.Q.value = q;
      return node;
    };
    const gain = value => {
      const node = ctx.createGain();
      node.gain.value = value;
      return node;
    };
    const stereo = position => {
      if (!ctx.createStereoPanner) return gain(1);
      const node = ctx.createStereoPanner();
      node.pan.value = clamp(position, -1, 1);
      return node;
    };
    function bufferSource(color) {
      const node = ctx.createBufferSource();
      node.buffer = noise[color];
      node.loop = true;
      return node;
    }
    function oscillator(type, frequency) {
      const node = ctx.createOscillator();
      node.type = type;
      node.frequency.value = frequency;
      return node;
    }
    function finishRun(mix) {
      mix.nodes.forEach(disconnect);
      mix.nodes.length = 0;
    }
    function register(source, nodes) {
      const owner = run;
      owner.sources.add(source);
      source.onended = () => {
        source.disconnect();
        nodes.forEach(disconnect);
        owner.sources.delete(source);
        if (owner.stopped && !owner.sources.size) finishRun(owner);
      };
    }
    function getRun() {
      if (run) return run;
      const master = gain(.86), dry = gain(.9), send = gain(.7);
      const safety = ctx.createDynamicsCompressor();
      safety.threshold.value = -12;
      safety.knee.value = 12;
      safety.ratio.value = 3.2;
      safety.attack.value = .012;
      safety.release.value = .22;
      dry.connect(safety).connect(master).connect(output);
      run = {master, dry, send, sources:new Set(), nodes:[dry, send, safety, master],
        layers:null, stopped:false, nextMix:0, nextDrop:0, nextGust:0, endingUntil:-1};
      // Early reflections on steel and masonry, kept clear of dialogue in the center.
      for (const [seconds, volume, cutoff, pan] of [[.067,.20,2600,-.74],[.137,.12,1800,.66],[.27,.06,1100,-.2]]) {
        const delay = ctx.createDelay(.5), shade = filter('lowpass', cutoff), wall = gain(volume), place = stereo(pan);
        delay.delayTime.value = seconds;
        send.connect(delay).connect(shade).connect(wall).connect(place).connect(dry);
        run.nodes.push(delay, shade, wall, place);
      }
      return run;
    }
    function placeVoice(source, shape, envelope, pan, wet, when, duration) {
      const pos = stereo(pan);
      const nodes = [envelope, pos];
      if (shape) {
        source.connect(shape).connect(envelope);
        nodes.push(shape);
      } else source.connect(envelope);
      envelope.connect(pos).connect(run.dry);
      if (wet) {
        const room = gain(wet);
        pos.connect(room).connect(run.send);
        nodes.push(room);
      }
      register(source, nodes);
      if (source.buffer) source.start(when, random() * source.buffer.duration);
      else source.start(when);
      source.stop(when + duration + .012);
    }
    function envelope(when, attack, release, level) {
      const node = gain(0), v = node.gain;
      v.setValueAtTime(0, when);
      v.linearRampToValueAtTime(level, when + attack);
      v.exponentialRampToValueAtTime(.00002, when + attack + release);
      v.linearRampToValueAtTime(0, when + attack + release + .006);
      return node;
    }
    function ring(when, freq, release, level, pan, options = {}) {
      const {end = freq, attack = .003, type = 'sine', wet = .37} = options;
      const src = oscillator(type, freq);
      src.frequency.setValueAtTime(freq, when);
      if (end !== freq) src.frequency.exponentialRampToValueAtTime(end, when + attack + release);
      placeVoice(src, null, envelope(when, attack, release, level), pan, wet, when, attack + release);
    }
    function brush(when, color, mode, freq, q, attack, release, level, pan, wet = .34, end = freq) {
      const shape = filter(mode, freq, q);
      shape.frequency.setValueAtTime(freq, when);
      if (freq !== end) shape.frequency.exponentialRampToValueAtTime(end, when + attack + release);
      placeVoice(bufferSource(color), shape, envelope(when, attack, release, level), pan, wet, when, attack + release);
    }
    function foot(when, pan, surface, weight, heel) {
      const metal = ['bridge','leaf','tram','ladder','lens','basket'].includes(surface);
      const wood = surface === 'dock' || surface === 'raft';
      const pitch = range(.93,1.07) * (heel ? .96 : 1.03);
      const body = (wood ? 128 : metal ? 159 : 101) * pitch;
      ring(when, body, .12, .24 * weight, pan, {end:body * .57});
      brush(when + .008, 'pink', 'lowpass', wood ? 820 : 1190, .55, .005, .105, .55 * weight, pan);
      brush(when + .042, 'white', 'bandpass', metal ? 3100 : 1740, .8, .018, .085, .17 * weight, pan);
      if (metal || wood) ring(when + .013, (metal ? 523 : 218) * pitch, metal ? .27 : .13, .057 * weight, pan);
      if (metal) ring(when + .017, 847 * pitch, .12, .022 * weight, pan);
    }
    function click(when, pan, size = 1) {
      brush(when, 'white', 'bandpass', 1880, 1.05, .0015, .051, .42 * size, pan);
      ring(when + .004, range(366,390), .065, .12 * size, pan, {end:272});
      ring(when + .019, 1010, .038, .038 * size, pan);
    }
    function wheel(when, pan, size = 1) {
      brush(when, 'pink', 'bandpass', 774, 1.65, .022, .13, .24 * size, pan, .45, 520);
      ring(when + .008, range(108,125), .13, .085 * size, pan, {end:93});
      click(when + .038, pan, .36 * size);
    }
    function paper(when, pan) {
      brush(when, 'white', 'bandpass', 2890, 1.1, .023, .13, .22, pan, .06, 1740);
      brush(when + .085, 'white', 'highpass', 3340, .4, .005, .05, .055, pan, .05);
    }
    function tape(when, pan) {
      click(when, pan, .65);
      for (const [offset, hz, end, level] of [[.04,335,172,.066],[.14,270,142,.048],[.3,224,290,.032]]) {
        ring(when + offset, hz, .105, level, pan, {type:'triangle', end, attack:.009, wet:.17});
        brush(when + offset, 'pink', 'bandpass', 1420, .8, .010, .12, .17, pan, .15, 850);
      }
    }
    function squelch(when, pan, size = 1) {
      brush(when, 'white', 'bandpass', 1980, 1.25, .004, .15, .34 * size, pan, .12, 860);
      click(when + .034, pan, .31 * size);
    }
    function horn(when, pan) {
      // Two beating reeds speak at slightly different pressures above breath noise.
      brush(when, 'pink', 'bandpass', 420, .9, .028, .38, .24, pan, .9);
      for (const [freq, level] of [[83,.21],[84.2,.075],[166,.17],[249,.072],[330,.046],[495,.018]]) {
        const src = oscillator('sine', freq), env = gain(0), end = when + .44;
        src.frequency.setValueAtTime(freq * .963, when);
        src.frequency.exponentialRampToValueAtTime(freq, when + .082);
        src.frequency.exponentialRampToValueAtTime(freq * .986, end);
        env.gain.setValueAtTime(0,when);
        env.gain.linearRampToValueAtTime(level,when + .06);
        env.gain.linearRampToValueAtTime(level * .87,when + .25);
        env.gain.exponentialRampToValueAtTime(.0001,end);
        placeVoice(src, null, env, pan, .93, when, .44);
      }
    }
    function tinRoll(when, pan, lid = false) {
      const hits = lid ? [0,.22,.364,.46,.531,.585,.63,.668] : [0,.135,.239,.325,.395,.45,.494,.53];
      const modes = lid ? [478,918,1427] : [612,1083,1722];
      hits.forEach((offset, i) => {
        const level = .20 * Math.pow(.77, i), pos = clamp(pan + i * .048, -.9, .9);
        const pitch = 1 - .012 * i + range(-.009,.009);
        brush(when + offset, 'white', 'highpass', 1450, .6, .0016, .03, level * .72, pos, .54);
        modes.forEach((freq, mode) => ring(when + offset + mode * .001, freq * pitch,
          [.21,.12,.089][mode], level * [1,.53,.3][mode], pos, {wet:.65}));
      });
      brush(when + hits[hits.length-1], 'pink', 'bandpass', lid ? 920 : 1520,
        2.5, .035, .25, .10, pan + .26, .5, 630);
    }
    function rope(when, pan) {
      brush(when, 'pink', 'bandpass', 1080, 1.5, .19, .6, .43, pan, .4, 360);
      brush(when + .19, 'white', 'bandpass', 1830, 3, .09, .38, .2, pan, .23, 750);
      ring(when + .24, 243, .34, .078, pan, {attack:.11, end:147, type:'triangle'});
      foot(when + .75, pan, 'dock', .88, true);
    }
    function softLaugh(when, pan) {
      // A breath-driven glottal source with vocal-tract resonances. No speech or samples.
      [0,.21,.46,.71].forEach((offset, i) => {
        const t = when + offset, dur = .13 + i * .008, level = [1,.91,.7,.40][i];
        const src = oscillator('sawtooth', 195), mouth = gain(0), pos = stereo(pan);
        src.frequency.setValueAtTime(202 - i * 9, t);
        src.frequency.linearRampToValueAtTime(239 - i * 11, t + .047);
        src.frequency.exponentialRampToValueAtTime(153 - i * 5, t + dur);
        mouth.gain.setValueAtTime(0,t);
        mouth.gain.linearRampToValueAtTime(.20 * level,t + .035);
        mouth.gain.exponentialRampToValueAtTime(.0001,t + dur);
        const nodes = [mouth,pos];
        for (const [hz,q,a] of [[640,3.4,1],[1140,4,.5],[2580,5,.14]]) {
          const formant = filter('bandpass', hz, q), amp = gain(a);
          src.connect(formant).connect(amp).connect(mouth);
          nodes.push(formant,amp);
        }
        mouth.connect(pos).connect(run.dry);
        register(src,nodes);
        src.start(t);
        src.stop(t + dur + .01);
        brush(t, 'pink', 'bandpass', 1200, .9, .024, .145, .19 * level, pan, .17, 750);
      });
    }
    function ending(when) {
      if (when < run.endingUntil) return;
      run.endingUntil = when + 10;
      click(when, -.13, .55);
      // The ship's ten-second field recording has its own ambience after gameplay stops.
      brush(when + .055, 'pink', 'lowpass', 810, .55, .23, 9.6, .37, -.34, .09);
      brush(when + .07, 'white', 'bandpass', 1740, .8, .25, 9.58, .082, .44, .10);
      rope(when + 1.06, -.40);
      brush(when + 2.15, 'pink', 'bandpass', 680, .75, .48, 1.3, .29, .32);
      tinRoll(when + 3.73, -.20, true);
      foot(when + 5.22, .26, 'dock', .55, false);
      softLaugh(when + 6.02, .34);
      brush(when + 7.48, 'pink', 'lowpass', 850, .6, .34, 1.83, .29, -.17);
      squelch(when + 9.70, .08, .62);
      click(when + 9.88, -.1, .32);
    }
    function makeLayer(source, shape, pan) {
      const env = gain(0), pos = stereo(pan);
      source.connect(shape).connect(env).connect(pos).connect(run.dry);
      register(source,[shape,env,pos]);
      if (source.buffer) source.start(ctx.currentTime, random() * source.buffer.duration);
      else source.start();
      return {env:env.gain, tone:shape.frequency, source};
    }
    function installLayers() {
      const bed = (color, type, hz, q, pan) => makeLayer(bufferSource(color), filter(type,hz,q), pan);
      const hum = (hz, type, pan) => makeLayer(oscillator(type,hz),filter('lowpass',480,.6),pan);
      run.layers = {
        wind:bed('pink','lowpass',880,.54,-.25),
        lee:bed('pink','bandpass',620,1.8,.7),
        surf:bed('pink','lowpass',280,.66,.12),
        foam:bed('white','bandpass',1280,.7,-.57),
        rain:bed('white','highpass',3700,.63,.47),
        pump:bed('pink','bandpass',166,1.8,-.53),
        drive:hum(48,'triangle',-.32),
        rotor:hum(96,'sine',-.4),
        wire:bed('pink','bandpass',890,13,.61),
        harmonic:hum(275,'sine',.65),
        radio:bed('white','bandpass',1530,2.1,.39),
        reel:bed('pink','bandpass',870,1.9,-.32)
      };
    }
    function setLayer(layer, time, level, hz, lag = .18) {
      layer.env.setTargetAtTime(level,time,lag);
      if (hz) layer.tone.setTargetAtTime(hz,time,lag);
    }
    function weather(g, now) {
      const t = g.time, index = g.index, act = Math.floor(index / 3), q = g.state;
      const type = g.spec.type, wetDeck = act === 0, cellar = act === 1, high = act >= 2;
      const secluded = type === 'quiet', exposed = secluded ? .19 : cellar ? .22 : act === 3 ? .57 : 1;
      const gust = clamp(.47 + .25 * Math.sin(t * .37 + index) + .18 * Math.sin(t * .171 + 1.8) + .09 * Math.sin(t * .83));
      const tide = type === 'tide' ? (1 + Math.cos(t * 2 * Math.PI / 5 - 1.5)) / 2 : .5 + .5 * Math.sin(t * .83 + .75 * Math.sin(t * .29));
      const both = g.engaged[0] || g.engaged[1], tuning = type === 'radio' || type === 'tape';
      const pumpLoad = g.cistern ? .13+.67*Math.abs(g.cistern.flow)+.15*g.cistern.bypass : g.spec.mode==='raft' ? .23+.70*Math.abs(g.rig?.flow||0) : cellar ? .51 : type==='power'&&both ? .72 : 0;
      const blade = .77 + .23 * Math.sin(t * (7.7 + pumpLoad));
      const whistle = high ? Math.pow(gust,2.2) * (secluded ? .13 : 1) : 0;
      const layers = run.layers;
      setLayer(layers.wind,now,exposed * (.12 + gust * .24),590 + gust * 930);
      setLayer(layers.lee,now,exposed * (.045 + gust * .10),385 + gust * 416);
      setLayer(layers.surf,now,(cellar ? .05 : wetDeck ? .38 : .24) * (.52 + tide * .84),165 + tide * 204);
      setLayer(layers.foam,now,(cellar ? .013 : secluded ? .02 : wetDeck ? .17 : .11) * Math.pow(tide,1.7),660 + tide * 1380);
      setLayer(layers.rain,now,(cellar ? .008 : secluded ? .014 : act === 3 ? .022 : .044) * (.63 + gust),2950 + gust * 970);
      setLayer(layers.pump,now,pumpLoad * blade * .32,107 + pumpLoad * 65);
      setLayer(layers.drive,now,pumpLoad * .092,400);
      setLayer(layers.rotor,now,pumpLoad * blade * .036,480);
      layers.drive.source.frequency.setTargetAtTime(42 + pumpLoad * 14,now,.42);
      layers.rotor.source.frequency.setTargetAtTime(84.6 + pumpLoad * 28.13,now,.39);
      setLayer(layers.wire,now,whistle * .44,562 + gust * 620);
      setLayer(layers.harmonic,now,whistle * .022,480);
      layers.harmonic.source.frequency.setTargetAtTime(211 + 21 * gust + 3 * Math.sin(.73*t),now,.3);
      let interference = 0;
      if (type === 'radio') {
        const target = g.spec.v[0] + Math.sin(t * .42) * .105;
        interference = g.engaged[0] ? .029 + clamp(Math.abs(q.dials[0] - target) * 5) * .16 : .025;
      } else if ((type === 'release' || tuning) && both) interference = .044;
      setLayer(layers.radio,now,interference,1460 + 240 * Math.sin(t * 1.7));
      const winding = type === 'ride' && g.engaged[g.spec.driver] && !q.latch;
      setLayer(layers.reel,now,type === 'tape' && both ? .12 : winding ? .10 : 0,620 + (q.ferry + q.dials[0]) * 460);
      run.send.gain.setTargetAtTime(cellar ? .98 : high ? .65 : .51, now,.35);
      if (t >= run.nextDrop) {
        run.nextDrop = t + range(cellar ? 1.65 : .7,cellar ? 3.6 : 2.3);
        const p = range(-.84,.84), vol = range(.016,.042) * (secluded ? .32 : 1);
        ring(now,range(cellar ? 720 : 910,1590),range(.055,.13),vol,p,{end:range(475,665),wet:cellar ? .85 : .29});
      }
      if (t >= run.nextGust) {
        run.nextGust = t + range(3,8);
        if (high && !secluded) brush(now,'pink','bandpass',range(830,1250),7,.44,.85,.11 + gust * .19,range(-.82,.82),.6,range(490,790));
      }
    }
    function equipment(kind, when, pan) {
      switch (kind) {
        case 'tape': tape(when,pan); break;
        case 'chart': paper(when,pan); break;
        case 'radio': squelch(when,pan); break;
        case 'antenna': case 'lens': case 'wheel': case 'winch': case 'pump': wheel(when,pan); break;
        default: click(when,pan,.72);
      }
    }
    function snapshot(g) {
      return {game:g, section:g.state,
        well:g.cistern?{caught:g.cistern.caught,stowed:g.cistern.cupKept,stroke:Math.floor(g.cistern.stroke*2),ports:g.cistern.ports,
          blocked:g.cistern.blocked,moored:g.cistern.moored,basket:g.cistern.tape,hoist:Math.floor(g.cistern.hoist*8)}:null,
        stamp:g.optic?.stamp??0, guide:g.optic?.mount?.gate??0, notch:g.section.span?.notch, impact:g.section.span?.impact, cableBay:0,
        walkers:g.players.map(p => ({ground:p.grounded, fall:0, distance:0, heel:false})),
        dials:g.state.dials.slice(), traveled:[0,0], engaged:[false,false], ratchetAt:[0,0],
        ferry:g.state.ferry, latch:g.state.latch, received:g.state.received, yes:g.state.yes[0],
        release:g.state.mode, pulse:g.state.pulseAt, read:g.state.readAt, done:g.state.doneAt};
    }
    function motion(g, dt, now, side) {
      const p = g.players[side], last = previous.walkers[side];
      const pan = panFor(side), material = p.ground?.kind || g.world?.style || 'dock';
      if (p.grounded) {
        if (!last.ground) {
          const impact = clamp(-last.fall / 6, .48, 1.46);
          foot(now,pan,material,impact,true);
          last.distance = 0;
        } else if (p.speed > .46 && !g.engaged[side]) {
          last.distance += p.speed * dt;
          if (last.distance >= 1.76) {
            last.distance %= 1.76;
            last.heel = !last.heel;
            foot(now,pan + (last.heel ? -.027 : .027),material,clamp(.38 + p.speed * .071,.42,.84),last.heel);
          }
        } else last.distance = Math.min(last.distance,.5);
        last.fall = 0;
      } else last.fall = Math.min(last.fall, p.vy);
      last.ground = p.grounded;
    }
    function instruments(g, now, side) {
      const q = g.state, spec = g.spec, kind = spec.tools[side], pan = panFor(side);
      const active = g.engaged[side];
      if (active && !previous.engaged[side] && !(spec.type === 'quiet' && side === 0)) equipment(kind,now,pan);
      if (!active && previous.engaged[side] && kind === 'radio') squelch(now,pan,.45);
      const driving = spec.type === 'ride' && side === spec.driver;
      const delta = driving ? (q.ferry - previous.ferry) * 1.8 : q.dials[side] - previous.dials[side];
      if (active) previous.traveled[side] += Math.abs(delta);
      else previous.traveled[side] = 0;
      if (previous.traveled[side] >= .078 && now >= previous.ratchetAt[side]) {
        previous.traveled[side] %= .078;
        previous.ratchetAt[side] = now + .17;
        if (kind === 'tape') brush(now,'pink','bandpass',1780,2,.011,.13,.24,pan,.15,650);
        else if (kind === 'chart') paper(now,pan);
        else if (kind === 'radio') click(now,pan,.29);
        else wheel(now,pan,.60);
      }
      previous.dials[side] = q.dials[side];
      previous.engaged[side] = active;
    }
    function changes(g, now) {
      const q = g.state, spec = g.spec, type = spec.type;
      if(g.cistern){
        const s=g.cistern,last=previous.well,stroke=Math.floor(s.stroke*2),link=Math.floor(s.hoist*8);
        if(s.caught&&!last.caught){ring(now,1114,.25,.085,.54);ring(now+.026,1725,.13,.045,.50);}
        if(s.cupKept&&!last.stowed){ring(now,878,.33,.13,.56);ring(now+.054,1291,.20,.073,.54);}
        if(stroke!==last.stroke)brush(now,'pink','bandpass',520,1.6,.014,.19,.12,.40,.32,160);
        if(s.blocked&&!last.blocked){click(now,.35,.76);ring(now+.02,228,.26,.11,.36);}
        if(s.moored&&!last.moored){click(now,.40,1.02);ring(now+.06,578,.25,.10,.45);}
        if(s.ports>last.ports)brush(now,'white','bandpass',1580,.87,.012,.69,.31,-.53,.63,480);
        if(s.tape!==last.basket&&s.tape==='basket'){click(now,.14,.82);ring(now+.037,336,.19,.13,.15);}
        if(link!==last.hoist)wheel(now,.42,.56);
        Object.assign(last,{caught:s.caught,stowed:s.cupKept,stroke,ports:s.ports,blocked:s.blocked,moored:s.moored,basket:s.tape,hoist:link});
      }
      const optic=g.optic;
      if(optic){
        if(optic.stamp>previous.stamp){
          const pan=panFor(optic.observer);
          ring(now,811,.28,.20,pan);ring(now+.18,811,.37,.18,pan);
        }
        if(optic.mount&&optic.mount.gate>previous.guide)wheel(now,.10,.84);
        previous.stamp=optic.stamp;previous.guide=optic.mount?.gate??0;
      }
      const b=g.section.span,c=g.section.tram;
      if(b){
        const pan=panFor(1-spec.driver);
        if(b.impact>previous.impact){
          brush(now,'pink','bandpass',640,1.2,.01,.45,.37,-pan,.57,180);
          ring(now+.045,108,.65,.25,pan,{end:84});
        }
        if(b.notch>previous.notch){
          click(now,pan,1.15);ring(now+.063,b.seated?248:354,.40,.17,pan);
        }
        previous.impact=b.impact;previous.notch=b.notch;
      }
      if(c){
        const bay=Math.floor(c.travel*7);
        if(bay>previous.cableBay){wheel(now,-.14,.58);wheel(now+.19,.14,.38);}
        previous.cableBay=bay;
      }
      if (type === 'rhythm') {
        if (q.pulseAt > previous.pulse) click(now,panFor(0));
        if (q.received > previous.received) horn(now,.22);
      }
      if (type === 'quiet' && !g.swing && q.yes[0] && !previous.yes) tinRoll(now,-.32);
      if (type === 'ride' && q.latch && !previous.latch) {
        click(now,.22,1.1);
        ring(now+.03,176,.32,.20,.15,{end:157});
      }
      if (type === 'release' && q.mode === 2 && previous.release === 1) squelch(now,.41,.68);
      if (type === 'cable' && q.pulseAt > previous.pulse) click(now,-.44,.9);
      if (type === 'tide' && q.readAt > previous.read) click(now,panFor(spec.lead),.6);
      if (type === 'tape' && previous.done === null && q.doneAt !== null) {
        if (g.stage === 0) tinRoll(now,.12);
        else click(now,.05,1.05);
      }
      previous.done = q.doneAt;
      previous.ferry = q.ferry;
      previous.latch = q.latch;
      previous.received = q.received;
      previous.yes = q.yes[0];
      previous.release = q.mode;
      previous.pulse = q.pulseAt;
      previous.read = q.readAt;
    }
    function update(g, dt) {
      if (dead || !g || g.complete) return;
      const mix = getRun(), now = ctx.currentTime;
      if (!mix.layers) installLayers();
      if (!previous || previous.game !== g || previous.section !== g.state) {
        previous = snapshot(g);
        mix.nextMix = 0;
        mix.nextDrop = g.time + range(.45,1.7);
        mix.nextGust = g.time + range(1.6,4.4);
      }
      for (let i = 0; i < 2; i++) {
        motion(g,clamp(Number(dt) || 0,0,.16),now,i);
        if(!g.archive)instruments(g,now,i);
      }
      changes(g,now);
      if (now >= mix.nextMix) {
        mix.nextMix = now + .085;
        weather(g,now);
      }
    }
    function cue(kind, side) {
      if (dead) return;
      getRun();
      const now = ctx.currentTime, pan = panFor(side);
      switch (kind) {
        case 'ending': ending(now); break;
        case 'rope': rope(now,pan); break;
        case 'screw': tinRoll(now,pan); break;
        case 'lid': tinRoll(now,pan,true); break;
        case 'horn': horn(now,pan); break;
        case 'threeHorns': [0,.72,1.44].forEach(offset => horn(now + offset,pan)); break;
        case 'land': foot(now,pan,'bridge',1,true); break;
        case 'footstep': foot(now,pan,'dock',.75,false); break;
        case 'reset': rope(now,pan); break;
        default: equipment(kind,now,pan);
      }
    }
    function stop() {
      previous = null;
      if (!run) return;
      const mix = run, now = ctx.currentTime;
      run = null;
      mix.stopped = true;
      mix.master.gain.setTargetAtTime(0,now,.008);
      for (const source of mix.sources) source.stop(now + .046);
      if (!mix.sources.size) finishRun(mix);
    }
    function dispose() { stop(); dead = true; }
    return {update, cue, stop, dispose};
  }
  return {create};
})();
