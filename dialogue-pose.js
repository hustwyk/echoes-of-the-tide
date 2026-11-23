// Original 20 Hz speech envelopes can drive both viewports, including muted play.
// The samples carry energy and spectral brightness, not a phoneme transcript.
const TideDialoguePose=(()=>{
  const cast=['林澈','沈遥'],decoded=new Map(),sample={speaker:-1,jaw:0,round:0};
  function read(bank,key,table,time){
    const clip=table[key];
    if(!clip||time<0||time>=clip.duration)return null;
    const lines=clip.lines||clip.captions;
    const line=lines?lines.findLast(row=>row[0]<=time)?.[1]:clip.line;
    const who=clip.speaker||line||'';
    const speaker=cast.findIndex(name=>who===name||who.startsWith(name+'：')||who.startsWith(name+'　'));
    if(speaker<0)return null;
    const packed=TideSpeechShapes[bank]?.[key];
    if(!packed)return null;
    let track=decoded.get(packed);
    if(!track){track=atob(packed);decoded.set(packed,track);}
    const frame=time*20,i=Math.floor(frame),mix=frame-i;
    const a=track.charCodeAt(i)||0,b=track.charCodeAt(i+1)||0;
    sample.speaker=speaker;
    sample.jaw=((a>>4)*(1-mix)+(b>>4)*mix)/15;
    sample.round=((a&15)*(1-mix)+(b&15)*mix)/15*sample.jaw;
    return sample;
  }
  function current(g){
    const a=g.arrival;
    if(a?.voice)return TidePlateSpeech[a.voice]?read('plate',a.voice,TidePlateSpeech,a.voiceAt):read('arrival',a.voice,TideArrivalSpeech,a.voiceAt);
    if(g.gallery?.voice)return read('gallery',g.gallery.voice,TideGallerySpeech,g.gallery.clock);
    if(g.stage===0&&g.fenders?.voice)return read('fender',g.fenders.voice,TideFenderSpeech,g.fenders.clock);
    if(g.cable){
      const c=g.cable;
      if(c.radio==='sending'||c.radio==='reply')return read('quay',c.radio==='sending'?'shore':'ship',TideQuaySpeech,c.clock);
      if(c.overhead>=0)return read('quay','overhear',TideQuaySpeech,c.overhead);
      if(c.warp.voice)return read('warp',c.warp.voice,TideWarpSpeech,c.warp.clock);
    }
    if(g.signal?.voice)return g.stage===0?read('shift',g.signal.voice,TideShiftSpeech,g.signal.clock):read('transit',g.signal.voice,TideTransitSpeech,g.signal.clock);
    if(g.archive?.memory?.voice)return read('tin',g.archive.memory.voice,TideTinLines,g.archive.memory.clock);
    if(g.swing?.voice)return read('swing',g.swing.voice,TideSwingSpeech,g.swing.clock);
    if(g.cistern?.voice)return read('cistern',g.cistern.voice,TideCisternSpeech,g.cistern.clock);
    if(g.glass?.voice)return read('glass',g.glass.voice,TideGlassSpeech,g.glass.clock);
    if(g.relay?.voice)return read('relay',g.relay.voice,TideRelaySpeech,g.relay.clock);
    if(g.survey?.voice)return read('soundings',g.survey.voice,TideSoundingsSpeech,g.survey.clock);
    if(g.rangeWatch?.voice)return read('range',g.rangeWatch.voice,TideRangeSpeech,g.rangeWatch.clock);
    if(g.lastPass?.voice&&!g.lastPass.occupied)return read('pass',g.lastPass.voice,TidePassSpeech,g.lastPass.clock);
    const horn=g.fog||g.pilotHorn;
    if(horn?.voice)return TideHaulSpeech[horn.voice]?read('haul',horn.voice,TideHaulSpeech,horn.clock):read('fog',horn.voice,TideFogSpeech,horn.clock);
    return null;
  }
  function listenerYaw(p,other,voice,side){
    if(!voice||voice.speaker===side||!p.grounded||p.speed>.65)return 0;
    const x=other.x-p.x,z=other.z-p.z,distance=Math.hypot(x,z);
    if(distance<.25||distance>8)return 0;
    const angle=Math.atan2(-x,-z)-p.yaw;
    return Math.max(-.48,Math.min(.48,Math.atan2(Math.sin(angle),Math.cos(angle))))*Math.min(1,(8-distance)/2);
  }
  return {current,listenerYaw,read};
})();
