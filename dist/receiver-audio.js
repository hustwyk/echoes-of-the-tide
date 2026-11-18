// Both the physical field-strength needle and this audio filter follow the loop's bearing.
const TideReceiverAudio=(()=>{
  const loads={};
  function loadData(name,path){
    if(window[name])return Promise.resolve(window[name]);
    if(!loads[name])loads[name]=new Promise(resolve=>{
      const script=document.createElement('script');script.src=path;
      script.onload=()=>resolve(window[name]);
      script.onerror=()=>{delete loads[name];script.remove();resolve(null);};
      document.head.appendChild(script);
    });
    return loads[name];
  }
  const loadQuay=()=>loadData('TideQuayAudio','assets/cablequay-audio.js');
  const loadRelay=()=>loadData('TideRelayMedia','assets/relay-media.js');
  const loadSoundings=()=>loadData('TideSoundingsMedia','assets/soundings-media.js');
  const loadFog=()=>loadData('TideFogMedia','assets/fog-signal-media.js');
  const loadPass=()=>loadData('TidePassMedia','assets/final-pass-media.js');
  const loadCistern=()=>loadData('TideCisternMedia','assets/cistern-media.js');
  const loadGlass=()=>loadData('TideGlassMedia','assets/glass-media.js');
  function create(ctx,output){
    const buffers={},pending=new Set();
    let air=null,echo=null;
    let preview=null,call=null,ratchet=null,previousStroke=0;
    let story=null,storyKey='',lastKey=false,relay=null;
    async function decode(key){
      if(buffers[key]||pending.has(key))return;
      pending.add(key);
      try{
        const mast=key.startsWith('mast/'),survey=key.startsWith('tide/'),horn=key.startsWith('horn/'),final=key.startsWith('pass/');
        const room=key.startsWith('room/'),well=key.startsWith('well/');
        const stock=well?await loadCistern():room?await loadGlass():final?await loadPass():horn?await loadFog():survey?await loadSoundings():mast?await loadRelay():(key==='receiver'||key==='hoist')?TideBreakwaterAudio:await loadQuay();
        if(!stock)return;
        const bytes=Uint8Array.from(atob(stock[mast||survey||horn||final||room||well?key.slice(5):key]),v=>v.charCodeAt(0));
        buffers[key]=await ctx.decodeAudioData(bytes.buffer);
      }finally{pending.delete(key);}
    }
    function play(key,volume,at=0,repeat=false){
      const buffer=buffers[key];if(!buffer||at>=buffer.duration-.03)return null;
      const source=ctx.createBufferSource(),gain=ctx.createGain(),filter=ctx.createBiquadFilter();
      source.buffer=buffer;source.loop=repeat;
      if(repeat){source.loopStart=key==='horn/diaphone'?.18:.04;source.loopEnd=key==='horn/diaphone'?1.7:2.2;}
      filter.type='lowpass';filter.frequency.value=6400;gain.gain.value=volume;
      source.connect(filter).connect(gain).connect(output);
      if(key==='horn/diaphone'){
        if(!echo){
          const delay=ctx.createDelay(1),wall=ctx.createBiquadFilter(),bounce=ctx.createGain(),wet=ctx.createGain();
          delay.delayTime.value=.192;wall.type='lowpass';wall.frequency.value=940;
          bounce.gain.value=.51;wet.gain.value=.38;
          delay.connect(wall).connect(bounce).connect(delay);wall.connect(wet).connect(output);
          echo={delay,wall,bounce,wet};
        }
        gain.connect(echo.delay);
      }
      const clip={source,gain,filter,start:ctx.currentTime-at};
      source.onended=()=>{source.disconnect();filter.disconnect();gain.disconnect();};
      source.start(ctx.currentTime,at);return clip;
    }
    function end(clip){
      if(clip){clip.gain.gain.setTargetAtTime(.0001,ctx.currentTime,.012);try{clip.source.stop(ctx.currentTime+.045);}catch{}}
      return null;
    }
    function stop(){air=end(air);if(echo){for(const node of Object.values(echo))node.disconnect();echo=null;}preview=end(preview);call=end(call);ratchet=end(ratchet);previousStroke=0;story=end(story);storyKey='';relay=end(relay);lastKey=false;}
    function quay(g){
      const a=g.cable,button=a.down||a.returnDown;
      if(button&&!lastKey){relay=end(relay);relay=play('relay',.72);}
      lastKey=button;
      const key=a.radio==='sending'?'shore':a.radio==='reply'?'ship':a.overhead>=0?'overhear':'';
      const t=key==='overhear'?a.overhead:a.clock;
      if(!buffers.relay&&!pending.has('relay'))decode('relay').catch(()=>{});
      if(key&&!buffers[key]&&!pending.has(key))decode(key).catch(()=>{});
      if(key!==storyKey||story&&Math.abs(ctx.currentTime-story.start-t)>.55){story=end(story);storyKey=key;}
      if(key&&!story)story=play(key,1.10,t);
    }
    function update(g){
      const horn=g.pilotHorn||g.fog;
      if(g.cistern||g.glass||g.lastPass||horn||g.relay||g.survey){
        if(horn){
          const key='horn/diaphone',r=horn;
          if(!buffers[key]&&!pending.has(key))decode(key).catch(()=>{});
          if(r.down&&!air)air=play(key,.56,0,true);
          if(!r.down&&air)air=end(air);
          if(air){air.filter.frequency.setTargetAtTime(840+r.valve*1480,ctx.currentTime,.023);air.gain.gain.setTargetAtTime(.19+.47*r.pressure,ctx.currentTime,.023);}
        }
        const table=g.cistern?TideCisternSpeech:g.glass?TideGlassSpeech:g.lastPass?TidePassSpeech:horn?TideFogSpeech:g.survey?TideSoundingsSpeech:TideRelaySpeech,prefix=g.cistern?'well/':g.glass?'room/':g.lastPass?'pass/':horn?'horn/':g.survey?'tide/':'mast/';
        for(const id of Object.keys(table)){const key=prefix+id;if(!pending.has(key)&&!buffers[key])decode(key).catch(()=>{});}
        const r=g.cistern||g.glass||g.lastPass||horn||g.survey||g.relay,key=r.voice&&!r.occupied?prefix+r.voice:'';
        if(key!==storyKey||story&&Math.abs(ctx.currentTime-story.start-r.clock)>.50){story=end(story);storyKey=key;}
        if(key&&!story)story=play(key,1.06,r.clock);
        return;
      }
      if(g.cable){quay(g);return;}
      if(!g.landfall)return;
      const a=g.landfall;
      for(const key of ['hoist','receiver'])if(!buffers[key]&&!pending.has(key))decode(key).catch(()=>{});
      if(!a.pinned){
        if(a.stroke>.10&&previousStroke<=.10){ratchet=end(ratchet);ratchet=play('hoist',.59);}
        previousStroke=a.stroke;return;
      }
      if(!a.plugged)return;
      if(!a.receiving){
        if(!preview)preview=play('receiver',.045,0,true);
        if(preview){
          preview.gain.gain.setTargetAtTime(.045+.45*a.strength,ctx.currentTime,.05);
          preview.filter.frequency.setTargetAtTime(260+3300*a.strength,ctx.currentTime,.05);
        }
        return;
      }
      if(preview)preview=end(preview);
      if(call&&Math.abs((ctx.currentTime-call.start)-a.heard)>.55)call=end(call);
      if(!call)call=play('receiver',1.02,a.heard);
    }
    return {update,stop};
  }
  return {create,loadQuay,loadRelay,loadSoundings,loadFog,loadPass,loadGlass,loadCistern};
})();
