// The operator reads a number on the float; the mechanic checks his own shore copy.
const TideLightRegister=(()=>{
  const entries=[
    {id:'04',name:'东栈桥口',frame:'双柱架',mark:'短梯在柱间'},
    {id:'07',name:'外港旧标',frame:'四脚塔架',mark:'号牌在梯旁'},
    {id:'11',name:'西汊口',frame:'单柱架',mark:'环梯绕灯座'}
  ];
  function create(){return {page:0,leaf:0,held:0,repeatAt:0,reported:false,readable:false,signedAt:null,matchPending:false,cue:'',at:0,serial:0,feedback:['',''],until:[0,0]};}
  function active(g){return !!g.signal&&g.stage===1&&g.field.done&&g.watch?.step===0&&!g.watch.done;}
  function feedback(g,i,msg){
    const b=g.signal.register;b.feedback[i]=msg;b.until[i]=g.time+2.3;g.alert(msg,2.3);
  }
  function foley(g,id){
    const b=g.signal.register;b.cue=id;b.at=g.time;b.serial++;
  }
  function operate(g,k,dt){
    const b=g.signal.register,w=g.watch,cam=TideLookout.observe(g,k,dt);
    const eye=cam.eye,p=TideBuoyMotion.plate(g,eye),dx=p[0]-eye[0],dz=p[2]-eye[2],dist=Math.hypot(dx,dz);
    const difference=Math.atan2(dx,-dz)-cam.yaw,side=Math.atan2(Math.sin(difference),Math.cos(difference));
    b.readable=g.engaged[1]&&Math.abs(side)<Math.atan(.34/dist)+.003&&Math.abs(Math.atan2(p[1]-eye[1],dist)-w.pitch)<Math.atan(.12/dist)+.004;
    if(b.readable)w.seen='buoy';
    const direction=g.engaged[0]&&Math.abs(k[0].x)>.43?Math.sign(k[0].x):0;
    if(direction&&(direction!==b.held||g.time>=b.repeatAt)){
      const next=TideTraversal.clamp(b.page+direction,0,entries.length-1);
      if(next!==b.page){b.page=next;foley(g,'leafTurn');}
      b.repeatAt=g.time+.62;
    }
    b.held=direction;b.leaf+=(b.page-b.leaf)*(1-Math.exp(-dt*11));
    if(!b.reported&&g.commit(1,k)){
      if(!b.readable)feedback(g,1,w.seen==='buoy'?'看到的是灯。往下找塔脚的搪瓷号牌。':'十字里没有号牌。先找海上绿灯，再往下看。');
      else{b.reported=true;w.marked='buoy';b.until.fill(0);TideTransit.speak(g,'bookCall');g.events.checkpoint?.(g);}
    }
    if(g.commit(0,k)){
      if(!b.reported)feedback(g,0,'等观测窗读清号牌，再按下簿页。');
      else if(Math.abs(b.leaf-b.page)>.075)feedback(g,0,'簿页还在翻，等纸落平。');
      else if(entries[b.page].id!=='07')feedback(g,0,'这一页与海上的标号不符。保留来报，再翻一页。');
      else{
        w.step=1;w.marked=null;b.until[0]=0;b.signedAt=g.time;foley(g,'pencilTick');
        if(g.signal.voice==='bookCall')b.matchPending=true;
        else TideTransit.speak(g,'bookMatch');
        g.events.checkpoint?.(g);return;
      }
    }
    const page=entries[b.page];
    g.set(0,'握住灯标簿，左右翻页。听同伴报号，等相符的卡页落平后按确认。',{
      caption:b.until[0]>g.time?b.feedback[0]:page.id+'　'+page.name+'　·　'+(b.reported?'观测窗已报号':'待核标号')});
    g.set(1,b.reported?'把标号念给林澈，让他在簿里找到同一座标。':'用观测镜找到旧绿标。顺塔脚往下看，十字对准号牌后确认。',{
      caption:b.until[1]>g.time?b.feedback[1]:b.reported?'已报　北岬 07':b.readable?'号牌入镜　·　北岬 07':'查找塔脚号牌'});
  }
  function checkpoint(g){
    const b=g.signal.register,w=g.watch;
    if(!w||(!b.reported&&!w.step))return null;
    return {lightBook:true,page:b.page,reported:b.reported,step:w.step,yaw:w.yaw,pitch:w.pitch};
  }
  function restore(g,m){
    const b=g.signal.register,w=g.watch,site=g.world.signal;
    w.step=TideTraversal.clamp(m.step|0,0,2);w.done=w.step===2;b.signedAt=w.step?-1:null;
    b.page=b.leaf=TideTraversal.clamp(m.page|0,0,2);b.reported=!!m.reported||w.step>0;w.marked=!w.step&&b.reported?'buoy':null;
    w.yaw=Number.isFinite(m.yaw)?TideTraversal.clamp(m.yaw,-1.35,1.35):0;w.pitch=Number.isFinite(m.pitch)?TideTraversal.clamp(m.pitch,-.54,.21):-.13;
    const a=w.done?site.cutout:site.register;g.section.sites[0]=a;
    g.players=[a,site.radio].map(s=>({...TideTraversal.spawn(site.gallery),x:s.x,y:s.y,z:s.z,yaw:TideSignal.yaw}));
    g.checkpoints=[site.gallery,site.gallery];
  }
  return {entries,create,active,operate,checkpoint,restore};
})();
