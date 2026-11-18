// Play the magnetic sound under each real head, including backwards on a return
// stroke. The tape counter stays in simulation time across pause and resume.
const TideTapeAudio=(()=>{
  let loading=null;
  function load(){
    if(window.TideArchiveMedia)return Promise.resolve(window.TideArchiveMedia);
    if(!loading)loading=new Promise(resolve=>{
      const script=document.createElement('script');script.src='assets/archive-tapes.js';
      script.onload=()=>resolve(window.TideArchiveMedia);
      script.onerror=()=>{loading=null;script.remove();resolve(null);};
      document.head.appendChild(script);
    });
    return loading;
  }
  function create(ctx,output){
    const cache=new Map(),key=(stage,i)=>stage*2+i;
    let film=null,filmBuffer=null,filmRequest=null,retryFilm=0;
    function decodeOGG(encoded){
      const bytes=Uint8Array.from(atob(encoded),c=>c.charCodeAt(0));return ctx.decodeAudioData(bytes.buffer);
    }
    async function decode(stage,i){
      const media=await load();if(!media)throw Error('Archive recording unavailable');
      const forward=await decodeOGG(media[stage][i].audio);
      const backward=ctx.createBuffer(1,forward.length,forward.sampleRate);
      backward.getChannelData(0).set(forward.getChannelData(0));backward.getChannelData(0).reverse();
      return [forward,backward];
    }
    function request(stage,i){
      const k=key(stage,i),existing=cache.get(k);if(existing&&ctx.currentTime<existing.retryAt)return existing;
      const item={buffers:null,retryAt:Infinity};cache.set(k,item);
      decode(stage,i).then(b=>{item.buffers=b;}).catch(()=>{item.retryAt=ctx.currentTime+5;});
      return item;
    }
    const lanes=[null,null];
    function release(i){
      const l=lanes[i];if(!l)return;
      lanes[i]=null;const now=ctx.currentTime;
      l.gain.gain.cancelScheduledValues(now);l.gain.gain.setTargetAtTime(.0001,now,.010);
      try{l.source.stop(now+.055);}catch{}
    }
    function start(i,k,b,t,rate){
      const source=ctx.createBufferSource(),gain=ctx.createGain(),filter=ctx.createBiquadFilter();
      const pan=ctx.createStereoPanner?ctx.createStereoPanner():ctx.createGain();
      if(pan.pan)pan.pan.value=i?.57:-.57;
      const reverse=rate<0,buffer=b[reverse?1:0];
      source.buffer=buffer;source.playbackRate.value=Math.abs(rate);
      filter.type='lowpass';filter.Q.value=.55;gain.gain.value=.0001;
      source.connect(filter).connect(gain).connect(pan).connect(output);
      const when=ctx.currentTime;
      const lane={k,source,gain,filter,pan,time:t,ctxTime:when,rate,reverse};
      lanes[i]=lane;
      source.onended=()=>{source.disconnect();filter.disconnect();gain.disconnect();pan.disconnect();if(lanes[i]===lane)lanes[i]=null;};
      source.start(when,Math.min(buffer.duration-.003,Math.max(0,reverse?buffer.duration-t:t)));
      return lane;
    }
    function update(g){
      if(!g.archive){if(lanes[0]||lanes[1])stop();return;}
      for(let i=0;i<2;i++){
        const {time:t,speed,quality}=TideArchive.monitor(g,i);
        const item=request(g.stage,i),buffers=item.buffers;
        if(!buffers||Math.abs(speed)<.065||t<0||t>=buffers[0].duration-.004){release(i);continue;}
        const now=ctx.currentTime,k=key(g.stage,i),speedClamped=Math.sign(speed)*Math.min(3.6,Math.max(.10,Math.abs(speed)));
        let l=lanes[i];
        const predicted=l&&l.time+(now-l.ctxTime)*l.rate;
        if(!l||l.k!==k||l.reverse!==(speed<0)||Math.abs(t-predicted)>.135){
          release(i);l=start(i,k,buffers,t,speedClamped);
        }else{
          l.time=predicted;l.ctxTime=now;l.rate=speedClamped;
          l.source.playbackRate.setValueAtTime(Math.abs(speedClamped),now);
        }
        l.filter.frequency.setTargetAtTime(i?280+5600*quality*quality:6300,now,.035);
        l.gain.gain.setTargetAtTime(i?.07+1.12*quality:.83,now,.023);
      }
    }
    function filmTime(t){
      if(!filmBuffer){
        if(!filmRequest&&ctx.currentTime>=retryFilm){
          filmRequest=load().then(media=>decodeOGG(media.coda.audio)).then(b=>{filmBuffer=b;})
            .catch(()=>{retryFilm=ctx.currentTime+5;}).finally(()=>{filmRequest=null;});
        }
        return null;
      }
      if(!film){
        if(t>=filmBuffer.duration-.05)return null;
        const source=ctx.createBufferSource(),gain=ctx.createGain();
        source.buffer=filmBuffer;gain.gain.value=.98;source.connect(gain).connect(output);
        source.start(ctx.currentTime,t);film={source,gain,start:ctx.currentTime-t};
      }
      return ctx.currentTime-film.start;
    }
    function stop(){
      release(0);release(1);
      if(film){try{film.source.stop();}catch{}film.source.disconnect();film.gain.disconnect();film=null;}
    }
    return {update,stop,filmTime};
  }
  return {load,create};
})();
