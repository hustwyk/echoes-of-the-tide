// Distances are metres on the light box. Once the first brass pin seats, the
// tracing rotates around that physical hole. The operator on the far side sees the second mark.
const TidePaper=(()=>{
  const holes=[[-.725,.351],[.699,.338],[-.692,-.292]];
  const order=[[0,1],[2,1],[1,0]];
  const titles=['装订孔','折痕和朱印','裁边下的铅笔痕'];
  const readings=['同一枚订书钉穿过两张纸','灯机验收联只盖过左半个印章','北线待测，须以当潮复测'];
  const clamp=TideTraversal.clamp;
  function create(g){
    if(g.spec.type!=='paper')return null;
    const n=g.stage;
    return {holder:g.spec.cross?1:0,offset:[[-.23,.16],[.24,-.16],[-.22,-.19]][n].slice(),
      angle:[.19,-.29,.25][n],light:.49,lightTarget:[.31,.67,.26][n],
      pin:holes[order[n][0]],mark:holes[order[n][1]],pinned:false,revealed:false};
  }
  function residual(p,hole){
    const [x,y]=hole,c=Math.cos(p.angle),s=Math.sin(p.angle);
    return [p.offset[0]+c*x-s*y-x,p.offset[1]+s*x+c*y-y];
  }
  function lockOrigin(p){
    const [dx,dy]=residual(p,p.pin);p.offset[0]-=dx;p.offset[1]-=dy;
  }
  function directions(dx,dy){
    if(Math.hypot(dx,dy)<.049)return '孔内透出一圈完整的白光';
    const x=Math.abs(dx)>.038?(dx>0?'向左':'向右'):'';
    const y=Math.abs(dy)>.038?(dy>0?'向下':'向上'):'';
    return '红圈还要'+x+y+'移';
  }
  function interact(g,input,dt){
    const p=g.paper,h=p.holder,r=1-h;
    if(g.engaged[r]){
      p.light=clamp(p.light-input[r].z*dt*.42,0,1);
      p.angle=clamp(p.angle-input[r].x*dt*.45,-.65,.65);
    }
    if(p.pinned)lockOrigin(p);
    else if(g.engaged[h]){
      p.offset[0]=clamp(p.offset[0]+input[h].x*dt*.50,-.72,.72);
      p.offset[1]=clamp(p.offset[1]-input[h].z*dt*.50,-.56,.56);
    }
    const [dx,dy]=residual(p,p.pin);
    const second=residual(p,p.mark),match=Math.hypot(...second)<.050;
    const lit=Math.abs(p.light-p.lightTarget)<.115;
    p.revealed=p.pinned&&match&&lit&&g.engaged[r];
    g.state.dials[h]=clamp(.5+p.offset[0],0,1);g.state.dials[r]=clamp(.5+p.angle*.7,0,1);
    g.set(h,p.pinned?'按住操作键稳住铜针，听同伴读完批注':'按住操作键，前后左右推移透明图，把铜孔套在白孔上；确认可别住纸角',{
      caption:p.pinned?'第一孔已固定　·　另一侧正在验印':directions(dx,dy)});
    const vertical=p.light<p.lightTarget?'抬高掠射灯':'压低掠射灯';
    g.set(r,!p.pinned?'等同伴别上第一枚针。两孔重叠时提醒他确认':'左右旋纸，前后抬低侧灯。辨出纸面批注后确认',{
      caption:!p.pinned?'观察第一孔　·　'+directions(dx,dy):!match?(p.angle>0?'红线还需顺时针转回':'红线还需逆时针转回'):!lit?vertical+'，直到笔痕显出来':g.glass&&g.stage===2?'两道裁边重合，框外留有压纹':readings[g.stage]});
    if(!p.pinned&&g.commit(h,input)){
      if(Math.hypot(dx,dy)<.049){p.pinned=true;lockOrigin(p);if(g.glass)g.events.checkpoint?.(g);g.sound(610,.10);g.alert('铜针穿过两层，另一侧可以绕针转纸');}
      else g.alert('铜针碰到了纸边　·　'+directions(dx,dy),1.7);
    }
    if(p.pinned&&g.commit(r,input)){
      if(p.revealed&&g.engaged[h]){g.alert(g.glass&&g.stage===2?'裁边下还有字。':readings[g.stage],3);if(g.glass)TideGlass.registered(g);else g.advance();}
      else g.alert(!g.engaged[h]?'请同伴扶住铜针，再读一遍':!match?'印痕仍有两道，沿铜针旋转底片':vertical+'，掠过纸面再确认',1.7);
    }
  }
  function board(g){
    const mid=g.section.mid;return {x:mid.x,y:mid.y+1.20,z:mid.z-.58};
  }
  function camera(g,side){
    const b=board(g),p=g.paper,focus=side===p.holder?p.pin:p.mark;
    const edge=Math.sign(g.section.sites[side].x-b.x);
    return {eye:[b.x+edge*.53,b.y+(side===p.holder?.66:.30),b.z+1.83],at:[b.x+focus[0]*.24,b.y+focus[1]*.13,b.z]};
  }
  return {create,residual,interact,board,camera,titles,readings};
})();
