// Each hull has its own motor, with the propeller pitch following the drive demand.
const TideRegattaAudio=(()=>{
  let media;
  function load(){
    if(window.TideRegattaMedia)return Promise.resolve(window.TideRegattaMedia);
    return media??=new Promise(resolve=>{
      const tag=document.createElement('script');tag.src='assets/regatta-media.js';
      tag.onload=()=>{tag.remove();resolve(window.TideRegattaMedia);};
      tag.onerror=()=>{tag.remove();media=null;resolve({});};document.head.append(tag);
    });
  }
  const buffers=new WeakMap();
  function samples(ctx){
    if(!buffers.has(ctx))buffers.set(ctx,load().then(async data=>{
      const result={};await Promise.all(Object.keys(data).map(async key=>{
        const bytes=Uint8Array.from(atob(data[key]),c=>c.charCodeAt(0));
        try{result[key]=await ctx.decodeAudioData(bytes.buffer);}catch{}
      }));return result;
    }));return buffers.get(ctx);
  }
  function create(ctx,master){
    const bus=ctx.createGain();bus.connect(master);
    const channel=pan=>{const n=ctx.createStereoPanner();n.pan.value=pan;n.connect(bus);return n;};
    const pans=[channel(-.64),channel(.64),channel(0)];
    const motors=pans.slice(0,2).map((p,i)=>{
      const volume=ctx.createGain(),filter=ctx.createBiquadFilter(),motor=ctx.createOscillator(),prop=ctx.createOscillator();
      volume.gain.value=0;filter.type='lowpass';filter.Q.value=.55;filter.frequency.value=550;
      motor.type='sawtooth';prop.type='triangle';motor.frequency.value=50+i*3;prop.frequency.value=98+i*6;
      motor.connect(filter);prop.connect(filter);filter.connect(volume);volume.connect(p);motor.start();prop.start();return {motor,prop,volume,filter};
    });
    let clips={},serial=0,lastVoice='',voice=null,dead=false,live=new Set();samples(ctx).then(x=>{if(!dead)clips=x;});
    function play(id,i,gain=1,offset=0){
      const buffer=clips[id];if(!buffer||offset>=buffer.duration)return null;
      const src=ctx.createBufferSource(),v=ctx.createGain();v.gain.value=gain;src.buffer=buffer;
      src.connect(v);v.connect(pans[i<0?2:i]);live.add(src);src.onended=()=>{live.delete(src);src.disconnect();v.disconnect();};src.start(ctx.currentTime,Math.max(0,offset));return src;
    }
    function quiet(){for(const s of live){try{s.stop();}catch{}}voice=null;lastVoice='';for(const m of motors)m.volume.gain.setTargetAtTime(0,ctx.currentTime,.025);}
    function update(r,id,age){
      const t=ctx.currentTime;
      for(const [i,b] of r.boats.entries()){
        const m=motors[i],v=r.phase==='race'&&b.time===null?Math.abs(b.throttle):0;
        const f=42+i*4+v*52+b.speed*27+b.boost*25;
        m.motor.frequency.setTargetAtTime(f,t,.07);m.prop.frequency.setTargetAtTime(f*2.018,t,.05);
        m.filter.frequency.setTargetAtTime(260+v*650+b.boost*270,t,.09);
        m.volume.gain.setTargetAtTime(v*(.027+.012*b.boost),t,.09);
      }
      for(const e of r.events)if(e.id>serial){
        if(['bump','rub','lift'].includes(e.key))play('knock',e.i,.30+.35*e.force);
        if(['go','lap','finish'].includes(e.key))play('bell',e.i,e.key==='go'?.67:.36);
        serial=e.id;
      }
      if(id!==lastVoice){if(voice){try{voice.stop();}catch{}voice=null;}lastVoice='';if(!id||clips[id]){lastVoice=id;if(id)voice=play(id,-1,.90,age);}}
    }
    function dispose(){dead=true;quiet();for(const m of motors){m.motor.stop();m.prop.stop();for(const n of Object.values(m))n.disconnect();}pans.forEach(p=>p.disconnect());bus.disconnect();}
    return {update,quiet,dispose};
  }
  return {create,load};
})();
