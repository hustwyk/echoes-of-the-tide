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
  const loadGallery=()=>loadData('TideGalleryMedia','assets/gallery-media.js');
  const loadShift=()=>loadData('TideShiftMedia','assets/shift-media.js');
  const loadPlate=()=>loadData('TidePlateMedia','assets/plate-media.js');
  const loadArrival=()=>loadData('TideArrivalMedia','assets/arrival-media.js');
  const loadTin=()=>loadData('TideTinVoices','assets/tin-voices.js');
  const loadTransit=()=>loadData('TideTransitMedia','assets/transit-media.js');
  const loadWarp=()=>loadData('TideWarpMedia','assets/warp-media.js');
  const loadQuay=()=>loadData('TideQuayAudio','assets/cablequay-audio.js');
  const loadRelay=()=>loadData('TideRelayMedia','assets/relay-media.js');
  const loadSoundings=()=>loadData('TideSoundingsMedia','assets/soundings-media.js');
  const loadHaul=()=>loadData('TideHaulMedia','assets/haul-media.js');
  const loadFog=()=>loadData('TideFogMedia','assets/fog-signal-media.js');
  const loadPass=()=>loadData('TidePassMedia','assets/final-pass-media.js');
  const loadCistern=()=>loadData('TideCisternMedia','assets/cistern-media.js');
  const loadSwing=()=>loadData('TideSwingMedia','assets/swing-media.js');
  const loadFender=()=>loadData('TideFenderMedia','assets/fender-media.js');
  const loadGlass=()=>loadData('TideGlassMedia','assets/glass-media.js');
  function create(ctx,output){
    const buffers={},pending=new Set();
    let air=null,echo=null,swingSource=null,swingSerial=0,swingFoley=null;
    let haulSource=null,haulSerial=0,haulFoley=null;
    let lipSource=null,lipSerial=0,lipFoley=null;
    let plotSource=null,plotSerial=0,plotFoley=null,bookSource=null,bookSerial=0,bookFoley=null;
    let deckSource=null,deckSerial=0,deckFoley=null;
    let starter=null;
    const starterHits=new Map();
    let plateSource=null,plateSerial=0,plateFoley=null;
    let arrivalSource=null,arrivalSerial=0,arrivalFoley=null;
    let preview=null,call=null,ratchet=null,previousStroke=0;
    let story=null,storyKey='',lastKey=false,relay=null;
    async function decode(key){
      if(buffers[key]||pending.has(key))return;
      pending.add(key);
      try{
        const mast=key.startsWith('mast/'),survey=key.startsWith('tide/'),horn=key.startsWith('horn/'),final=key.startsWith('pass/');
        const room=key.startsWith('room/'),well=key.startsWith('well/'),swing=key.startsWith('sway/');
        const berth=key.startsWith('dock/');
        const warp=key.startsWith('haul/');
        const transit=key.startsWith('test/');
        const tin=key.startsWith('spol/');
        const approach=key.startsWith('boat/'),gallery=key.startsWith('ring/');
        const snag=key.startsWith('snag/');
        const brass=key.startsWith('salt/');
        const clutch=key.startsWith('gear/');
        const stock=clutch?await loadShift():brass?await loadPlate():snag?await loadHaul():gallery?await loadGallery():approach?await loadArrival():tin?await loadTin():transit?await loadTransit():warp?await loadWarp():berth?await loadFender():swing?await loadSwing():well?await loadCistern():room?await loadGlass():final?await loadPass():horn?await loadFog():survey?await loadSoundings():mast?await loadRelay():(key==='receiver'||key==='hoist')?TideBreakwaterAudio:await loadQuay();
        if(!stock)return;
        const bytes=Uint8Array.from(atob(stock[clutch||brass||snag||mast||survey||horn||final||room||well||swing||berth||warp||transit||tin||approach||gallery?key.slice(5):key]),v=>v.charCodeAt(0));
        buffers[key]=await ctx.decodeAudioData(bytes.buffer);
      }finally{pending.delete(key);}
    }
    function play(key,volume,at=0,repeat=false){
      const buffer=buffers[key];if(!buffer||at>=buffer.duration-.03)return null;
      const source=ctx.createBufferSource(),gain=ctx.createGain(),filter=ctx.createBiquadFilter();
      source.buffer=buffer;source.loop=repeat;
      if(repeat){source.loopStart=key==='horn/diaphone'?.18:.04;source.loopEnd=key==='horn/diaphone'?1.7:2.2;}
      const pan=key.startsWith('pass/')?TidePassSpeech[key.slice(5)]?.pan:key.startsWith('boat/')?TideArrivalSpeech[key.slice(5)]?.pan:key.startsWith('tide/')?TideSoundingsSpeech[key.slice(5)]?.pan:key.startsWith('test/')?TideTransitSpeech[key.slice(5)]?.pan:undefined;
      const placement=Number.isFinite(pan)?ctx.createStereoPanner?.():null;
      filter.type='lowpass';filter.frequency.value=placement?8300:6400;gain.gain.value=volume;
      source.connect(filter).connect(gain);
      if(placement){placement.pan.value=pan;gain.connect(placement).connect(output);}
      else gain.connect(output);
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
      source.onended=()=>{source.disconnect();filter.disconnect();gain.disconnect();placement?.disconnect();};
      source.start(ctx.currentTime,at);return clip;
    }
    function end(clip){
      if(clip){clip.gain.gain.setTargetAtTime(.0001,ctx.currentTime,.012);try{clip.source.stop(ctx.currentTime+.045);}catch{}}
      return null;
    }
    function stop(){deckFoley=end(deckFoley);lipFoley=end(lipFoley);bookFoley=end(bookFoley);plotFoley=end(plotFoley);for(const hit of starterHits.values())hit.clip=end(hit.clip);plateFoley=end(plateFoley);haulFoley=end(haulFoley);arrivalFoley=end(arrivalFoley);swingFoley=end(swingFoley);air=end(air);if(echo){for(const node of Object.values(echo))node.disconnect();echo=null;}preview=end(preview);call=end(call);ratchet=end(ratchet);previousStroke=0;story=end(story);storyKey='';relay=end(relay);lastKey=false;}
    function quay(g){
      const a=g.cable,button=a.down||a.returnDown;
      if(button&&!lastKey){relay=end(relay);relay=play('relay',.72);}
      lastKey=button;
      const key=a.radio==='sending'?'shore':a.radio==='reply'?'ship':a.overhead>=0?'overhear':a.warp.voice?'haul/'+a.warp.voice:'';
      const t=key==='overhear'?a.overhead:key.startsWith('haul/')?a.warp.clock:a.clock;
      if(g.stage===1)for(const id of Object.keys(TideWarpSpeech)){const token='haul/'+id;if(!buffers[token]&&!pending.has(token))decode(token).catch(()=>{});}
      if(!buffers.relay&&!pending.has('relay'))decode('relay').catch(()=>{});
      if(key&&!buffers[key]&&!pending.has(key))decode(key).catch(()=>{});
      if(key!==storyKey||story&&Math.abs(ctx.currentTime-story.start-t)>.55){story=end(story);storyKey=key;}
      if(key&&!story)story=play(key,1.10,t);
    }
    function starterAudio(g){
      const r=g.signal;
      if(starter!==r){
        for(const hit of starterHits.values())end(hit.clip);
        starterHits.clear();starter=r;
      }
      for(const [id,at] of Object.entries(r.foley)){
        const key='gear/'+id;
        if(!buffers[key]){if(!pending.has(key))decode(key).catch(()=>{});continue;}
        const hit=starterHits.get(id);
        if(at<0||hit?.at===at)continue;
        end(hit?.clip);
        starterHits.set(id,{at,clip:play(key,id==='seat'?.9:.73,Math.max(0,g.time-at))});
      }
    }
    function update(g){
      if(TideGallery.active(g)){
        const a=g.gallery;
        if(arrivalSource!==a){arrivalSource=a;arrivalSerial=a.serial;}
        for(const id of Object.keys(TideGallerySpeech)){const key='ring/'+id;if(!buffers[key]&&!pending.has(key))decode(key).catch(()=>{});}
        if(arrivalSerial!==a.serial){arrivalSerial=a.serial;arrivalFoley=end(arrivalFoley);arrivalFoley=play('ring/'+a.cue,.78);}
        const key=a.voice?'ring/'+a.voice:'';
        if(key!==storyKey||story&&Math.abs(ctx.currentTime-story.start-a.clock)>.48){story=end(story);storyKey=key;}
        if(key&&!story)story=play(key,1.10,a.clock);
        return;
      }
      if(TideArrival.active(g)){
        const s=g.arrival;
        if(arrivalSource!==s){arrivalSource=s;arrivalSerial=s.serial;}
        for(const id of ['captain','heard','button','call','dark','pttDown','pttUp','dial','hull','sternOut','sternHold','sternCaught','sternFast','hookStone','wetLine','cleatDrop']){
          const key='boat/'+id;if(!buffers[key]&&!pending.has(key))decode(key).catch(()=>{});
        }
        if(s.serial!==arrivalSerial){arrivalSerial=s.serial;arrivalFoley=end(arrivalFoley);arrivalFoley=play('boat/'+s.cue,.71);}
        const plate=s.plate;
        if(plateSource!==plate){plateSource=plate;plateSerial=0;}
        for(const id of Object.keys(TidePlateSpeech)){
          const key='salt/'+id;if(!buffers[key]&&!pending.has(key))decode(key).catch(()=>{});
        }
        if(plate.serial!==plateSerial&&plate.cue&&buffers['salt/'+plate.cue]){
          plateSerial=plate.serial;plateFoley=end(plateFoley);
          plateFoley=play('salt/'+plate.cue,.63,Math.max(0,g.time-plate.cueAt));
        }
        const key=s.voice?(TidePlateSpeech[s.voice]?'salt/':'boat/')+s.voice:'';
        if(storyKey!==key||story&&Math.abs(ctx.currentTime-story.start-s.voiceAt)>.48){story=end(story);storyKey=key;}
        if(key&&!story)story=play(key,1.12,s.voiceAt);
        return;
      }
      const horn=g.pilotHorn||g.fog;
      const rescue=g.fog?.mode==='transport';
      if(rescue){
        if(haulSource!==horn){haulSource=horn;haulSerial=0;}
        for(const id of Object.keys(TideHaulSpeech)){const key='snag/'+id;if(!pending.has(key)&&!buffers[key])decode(key).catch(()=>{});}
        if(horn.haulCue&&haulSerial!==horn.haulSerial){
          const key='snag/'+horn.haulCue,age=Math.max(0,g.time-horn.haulCueAt);
          if(buffers[key]){haulSerial=horn.haulSerial;haulFoley=end(haulFoley);haulFoley=play(key,.76,age);}
        }
      }
      const berth=g.stage===0&&g.fenders;
      const memory=g.archive?.memory;
      if(memory||g.signal||berth||g.swing||g.cistern||g.glass||g.lastPass||horn||g.relay||g.survey){
        if(berth){
          if(lipSource!==berth){lipSource=berth;lipSerial=0;}
          const key='dock/'+berth.contactSound;
          if(lipSerial!==berth.contactSerial&&buffers[key]){
            lipSerial=berth.contactSerial;lipFoley=end(lipFoley);
            lipFoley=play(key,.81,Math.max(0,g.time-berth.contactAt));
          }
        }
        if(g.lastPass){
          const watch=g.lastPass.watch;
          if(deckSource!==watch){deckSource=watch;deckSerial=0;}
          if(watch.serial!==deckSerial&&buffers['pass/'+watch.cue]){
            deckSerial=watch.serial;deckFoley=end(deckFoley);
            const volume=watch.cue==='railTouch'?.84:watch.cue==='deckKey'?.77:.72;
            deckFoley=play('pass/'+watch.cue,volume,Math.max(0,g.time-watch.at));
          }
        }
        if(g.swing){
          if(swingSource!==g.swing){swingSource=g.swing;swingSerial=g.swing.cueSerial||0;}
          for(const id of ['strain','clasp','tin']){const key='sway/'+id;if(!buffers[key]&&!pending.has(key))decode(key).catch(()=>{});}
          if(g.swing.cueSerial&&g.swing.cueSerial!==swingSerial){const key='sway/'+g.swing.cue;swingFoley=end(swingFoley);swingFoley=play(key,g.swing.cue==='tin'?.76:.62);swingSerial=g.swing.cueSerial;}
        }
        if(horn){
          const key='horn/diaphone',r=horn;
          if(!buffers[key]&&!pending.has(key))decode(key).catch(()=>{});
          if(r.down&&!air)air=play(key,.56,0,true);
          if(!r.down&&air)air=end(air);
          if(air){air.filter.frequency.setTargetAtTime(840+r.valve*1480,ctx.currentTime,.023);air.gain.gain.setTargetAtTime(.19+.47*r.pressure,ctx.currentTime,.023);}
        }
        if(g.survey){
          const plot=g.survey.plotter;
          if(plotSource!==plot){plotSource=plot;plotSerial=0;}
          if(plot.serial!==plotSerial&&plot.cue&&buffers['tide/'+plot.cue]){
            plotSerial=plot.serial;plotFoley=end(plotFoley);
            plotFoley=play('tide/'+plot.cue,plot.cue==='plotPin'?.68:.82,Math.max(0,g.time-plot.at));
          }
        }
        if(g.signal&&g.stage===1){
          const book=g.signal.register;
          if(bookSource!==book){bookSource=book;bookSerial=0;}
          if(book.serial!==bookSerial&&book.cue&&buffers['test/'+book.cue]){
            bookSerial=book.serial;bookFoley=end(bookFoley);
            bookFoley=play('test/'+book.cue,.82,Math.max(0,g.time-book.at));
          }
        }
        const starting=g.signal&&g.stage===0;
        if(starting)starterAudio(g);
        const table=starting?TideShiftSpeech:memory?TideTinLines:g.signal?TideTransitSpeech:berth?TideFenderSpeech:g.swing?TideSwingSpeech:g.cistern?TideCisternSpeech:g.glass?TideGlassSpeech:g.lastPass?TidePassSpeech:rescue&&TideHaulSpeech[horn.voice]?TideHaulSpeech:horn?TideFogSpeech:g.survey?TideSoundingsSpeech:TideRelaySpeech,prefix=starting?'gear/':memory?'spol/':g.signal?'test/':berth?'dock/':g.swing?'sway/':g.cistern?'well/':g.glass?'room/':g.lastPass?'pass/':rescue&&TideHaulSpeech[horn.voice]?'snag/':horn?'horn/':g.survey?'tide/':'mast/';
        for(const id of Object.keys(table)){const key=prefix+id;if(!pending.has(key)&&!buffers[key])decode(key).catch(()=>{});}
        const r=memory||g.signal||berth||g.swing||g.cistern||g.glass||g.lastPass||horn||g.survey||g.relay,key=r.voice&&(g.swing||!r.occupied)?prefix+r.voice:'';
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
  return {create,loadGallery,loadArrival,loadShift,loadPlate,loadTin,loadTransit,loadQuay,loadRelay,loadSoundings,loadFog,loadHaul,loadPass,loadGlass,loadCistern,loadSwing,loadFender};
})();
