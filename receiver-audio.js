// Both the physical field-strength needle and this audio filter follow the loop's bearing.
const TideReceiverAudio=(()=>{
  let loading=null;
  function loadQuay(){
    if(window.TideQuayAudio)return Promise.resolve(window.TideQuayAudio);
    if(!loading)loading=new Promise(resolve=>{
      const script=document.createElement('script');script.src='assets/cablequay-audio.js';
      script.onload=()=>resolve(window.TideQuayAudio);
      script.onerror=()=>{loading=null;script.remove();resolve(null);};
      document.head.appendChild(script);
    });
    return loading;
  }
  function create(ctx,output){
    const buffers={},pending=new Set();
    let preview=null,call=null,ratchet=null,previousStroke=0;
    let story=null,storyKey='',lastKey=false,relay=null;
    async function decode(key){
      if(buffers[key]||pending.has(key))return;
      pending.add(key);
      try{
        const stock=(key==='receiver'||key==='hoist')?TideBreakwaterAudio:await loadQuay();
        if(!stock)return;
        const bytes=Uint8Array.from(atob(stock[key]),v=>v.charCodeAt(0));
        buffers[key]=await ctx.decodeAudioData(bytes.buffer);
      }finally{pending.delete(key);}
    }
    function play(key,volume,at=0,repeat=false){
      const buffer=buffers[key];if(!buffer||at>=buffer.duration-.03)return null;
      const source=ctx.createBufferSource(),gain=ctx.createGain(),filter=ctx.createBiquadFilter();
      source.buffer=buffer;source.loop=repeat;
      if(repeat){source.loopStart=.04;source.loopEnd=2.2;}
      filter.type='lowpass';filter.frequency.value=6400;gain.gain.value=volume;
      source.connect(filter).connect(gain).connect(output);
      const clip={source,gain,filter,start:ctx.currentTime-at};
      source.onended=()=>{source.disconnect();filter.disconnect();gain.disconnect();};
      source.start(ctx.currentTime,at);return clip;
    }
    function end(clip){
      if(clip){clip.gain.gain.setTargetAtTime(.0001,ctx.currentTime,.012);try{clip.source.stop(ctx.currentTime+.045);}catch{}}
      return null;
    }
    function stop(){preview=end(preview);call=end(call);ratchet=end(ratchet);previousStroke=0;story=end(story);storyKey='';relay=end(relay);lastKey=false;}
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
  return {create,loadQuay};
})();
