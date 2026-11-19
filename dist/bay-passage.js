// The helmswoman rounds the point on a starboard turn and straightens
// between the entrance marks. Distances and clearance are in world metres.
const TideBayPassage=(()=>{
  const entry=-2.19,exit=-4.15;
  const forwardX=-Math.sin(exit),forwardZ=-Math.cos(exit);
  const arcX=Math.cos(entry)-Math.cos(exit),arcZ=Math.sin(exit)-Math.sin(entry);
  const dx=-8.4,dz=14.8,det=arcX*forwardZ-arcZ*forwardX;
  const radius=(dx*forwardZ-dz*forwardX)/det,leg=(arcX*dz-arcZ*dx)/det;
  const arc=radius*(entry-exit),total=arc+leg;
  const route=f=>{
    const t=Math.max(0,Math.min(1,f))*total,bend=Math.min(arc,t),a=entry-bend/radius,s=Math.max(0,t-arc);
    return {yaw:a,x:radius*(Math.cos(entry)-Math.cos(a))+s*forwardX,z:radius*(Math.sin(a)-Math.sin(entry))+s*forwardZ};
  };
  const harborX=-30-11.07*Math.sin(entry)-5.1*Math.cos(entry)+dx-12*forwardX;
  const harborZ=-116-11.07*Math.cos(entry)+5.1*Math.sin(entry)+dz-12*forwardZ;
  const acrossX=Math.cos(exit),acrossZ=-Math.sin(exit);
  const marks=[-1,1].map(side=>({x:harborX+side*15*acrossX,z:harborZ+side*15*acrossZ,side}));
  function distance(x,z){return (x-harborX)*forwardX+(z-harborZ)*forwardZ;}
  function clearance(g,i){
    const corner=TideLastPass.onDeck(g,i?1.90:-1.90,1.40,8.70);
    const bow=TideLastPass.bowPoint(g);
    // On approach the stern initially points across the entrance. Both ends
    // have to be inside and the vessel must actually be heading into the bay.
    return Math.min(distance(corner[0],corner[2]),distance(bow[0],bow[2]));
  }
  function create(){return {side:1,pan:1,scope:0,checked:[false,false],feedback:'',until:-1};}
  function watch(g,k,dt){
    const r=g.lastPass,w=r.bay;
    if(r.arrived)return;
    if(k.x<-.24)w.side=0;else if(k.x>.24)w.side=1;
    w.pan+=(w.side-w.pan)*(1-Math.exp(-dt*7.8));
    w.scope+=((r.occupied?0:k.magnify||0)-w.scope)*(1-Math.exp(-dt*12));
    if(!k.jump||r.occupied||r.voice)return;
    const side=w.side,name=side?'右舷':'左舷';
    if(w.scope<.72||Math.abs(w.pan-side)>.12)w.feedback='靠住艉栏，从这一舷望过去再报。';
    else if(clearance(g,side)<.18)w.feedback=name+'的艉角还在湾界外，'+(route(g.cues.rescue).yaw>exit+.01?'等船转直，再看界桩。':'再等一段尾流。');
    else if(w.checked[side])w.feedback=name+'已核过，换到另一舷看艉角。';
    else{
      w.checked[side]=true;
      w.feedback=name+'已过湾界。'+(w.checked[1-side]?'两舷都进来了。':'换另一舷。');
      r.watch.raise=1;r.watch.cue='deckKey';r.watch.at=g.time;r.watch.serial++;
      g.events.checkpoint?.(g);
    }
    w.until=g.time+2.0;g.alert(w.feedback,2);
  }
  function shot(g){
    const w=g.lastPass.bay;
    if(w.scope<.06||g.lastPass.occupied)return null;
    // Place the eye directly over the plane of the transom. With the camera
    // forward of this plane a post 15 m away appears past the rail too early.
    const side=w.pan*2-1,eyeX=side*.51,angle=side*Math.PI*.50;
    const eye=TideLastPass.onDeck(g,eyeX,2.59,8.70);
    const at=TideLastPass.onDeck(g,eyeX+4*Math.sin(angle),1.94,8.70+4*Math.cos(angle));
    return {eye,at,fov:69,handsOnly:true};
  }
  return {entry,route,marks,distance,clearance,create,watch,shot};
})();
