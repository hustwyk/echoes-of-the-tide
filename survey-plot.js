// Two observations from a drifting stern give an approximate fix. Each pencil stroke
// retains the direction actually set by the chart operator, including its small error.
const TideSurveyPlot=(()=>{
  const marks=['buoy','stump'],width=52,height=46,degree=Math.PI/180;
  const {clamp}=TideTraversal;
  const angle=yaw=>Math.atan2(Math.sin(yaw),Math.cos(yaw));
  const label=yaw=>String((Math.round(yaw/degree)%360+360)%360).padStart(3,'0')+'°';
  function anchor(index){
    const mark=TideLookout.marks[marks[index]],pile=TideLookout.marks.stump;
    return {u:.669+(mark.x-pile.x)/width,v:.38+(mark.z-pile.z)/height};
  }
  function line(index,yaw){
    return {...anchor(index),du:-Math.sin(yaw)/width,dv:Math.cos(yaw)/height};
  }
  function crossing(first,second){
    const a=line(0,first),b=line(1,second),det=a.du*b.dv-a.dv*b.du;
    if(Math.abs(det)<.000015)return null;
    const t=((b.u-a.u)*b.dv-(b.v-a.v)*b.du)/det;
    const other=((b.u-a.u)*a.dv-(b.v-a.v)*a.du)/det;
    if(t<0||other<0)return null;
    return {u:a.u+t*a.du,v:a.v+t*a.dv};
  }
  function create(){
    return {reports:[],lines:[],seat:0,dial:-1.61,pinned:false,legacy:false,feedback:[null,null],cue:'',serial:0,at:0};
  }
  function tickCue(g,cue){
    const p=g.survey.plotter;p.cue=cue;p.serial++;p.at=g.time;
  }
  function miss(g,side,detail,short){
    g.survey.plotter.feedback[side]={short,until:g.time+2};
    g.alert(detail,2);
  }
  function reading(g,side,normal){
    const message=g.survey.plotter.feedback[side];
    return message&&g.time<message.until?message.short:normal;
  }
  function briefing(g){
    const p=g.survey?.plotter;
    if(g.stage!==2||!p||p.legacy)return '';
    if(g.survey.fixed)return '船位和水深都已压在图上。岸上握住图台。船尾再看一次双环断桩，等它露出水面时确认，把水深报给驾驶台。';
    if(p.pinned)return '船位已有铅笔圈。把透明十字移到候选测深点，核对哪条槽的深度够渡轮通过。';
    if(p.lines.length===2)return '两道铅线都在纸上。把透明十字压在交点，再用这次实测的水位选航道。';
    if(p.lines.length===1)return '旧绿标的第一笔已经留下。把尺脚移到双环断桩，照船尾的第二个读数画线。';
    return '船尾看旧绿标和双环断桩，报出罗经度数。岸上把尺脚移到相应物标，转尺照数画线。';
  }
  function cueText(reports){
    return reports.map((n,i)=>(i?'桩 ':'标 ')+label(n)).join('　');
  }
  function observe(g,input,dt,say,save){
    const r=g.survey,p=r.plotter,w=g.watch;
    const cam=TideLookout.observe(g,input,dt);
    let next=p.reports.length;
    if(next<2&&g.commit(1,input)){
      if(w.seen===marks[next]){
        p.reports.push(cam.yaw);p.feedback[1]=null;next++;
        if(next===1)say(g,'reciprocal');
        else{r.sight={x:cam.eye[0],z:cam.eye[2],yaw:cam.yaw};say(g,'rings');}
        save(g);
      }else miss(g,1,w.seen?'报到的是'+TideLookout.labels[w.seen]+'，请复核另一个物标。':next?'浪沫会盖住桩顶，等两道铁箍露出再报。':'让十字对上旧浮标的灯，再锁读。',w.seen?'报错物标，再找一遍':'目标还没对上十字');
    }
    const i=p.lines.length,oldSeat=p.seat;
    if(g.engaged[0]){
      p.dial=angle(p.dial+input[0].x*dt*.78);
      p.seat=clamp(p.seat+input[0].z*dt*1.10,0,1);
      if(oldSeat!==p.seat&&(p.seat===0||p.seat===1))tickCue(g,'plotPin');
    }
    w.marked=next>i?marks[i]:null;
    const seat=p.seat<.055?'旧绿标':p.seat>.945?'双环桩':'两标之间',expected=w.task.targets[i];
    g.set(0,'前后移尺脚到物标，左右转尺，对准船尾报来的度数，按确认划线。',{
      caption:reading(g,0,(i?'第二笔':'第一笔')+'　'+seat+'　尺 '+label(p.dial)+(p.reports.length>i?'　已报数':'　等船尾报数'))});
    g.set(1,next<2?(next?'向右找断桩，等浪谷露出铁箍。':'先找旧绿标的灯。')+'对准后按确认锁读，把度数念给岸上。':'把两笔读数念给林澈。铅线从物标朝船画。',{
      caption:reading(g,1,(next<2?'罗经 '+label(cam.yaw)+'　':'已报　')+cueText(p.reports))});
    if(!g.commit(0,input))return;
    if(p.reports.length<=i){miss(g,0,'船尾还没报这一笔。可以先移尺、对度数。','等船尾锁读');return;}
    if(Math.abs(p.seat-i)>.055){miss(g,0,'这笔要从'+TideLookout.labels[expected]+'起线。前后移尺脚，让它落到针孔里。','尺脚应移到'+TideLookout.labels[expected]);return;}
    if(Math.abs(angle(p.dial-p.reports[i]))>1.1*degree){miss(g,0,'尺的度数和船尾读数不同。再听一次，左右微调。','方位不合　·　尺 '+label(p.dial));return;}
    if(i===1){
      const fix=crossing(p.lines[0],p.dial);
      if(!fix||fix.u<.055||fix.u>.945||fix.v<.065||fix.v>.935){
        // A very late second sight or two marginal aim points can carry the
        // intersection off the sheet. Re-observe; the two tide readings survive.
        p.lines=[];p.reports=[];w.marked=null;w.step=0;r.sight=null;save(g);
        g.alert('两条延长线在图外才相交。船在漂，趁相邻两次露标重新连测。',3.3);return;
      }
    }
    p.feedback[0]=null;p.seat=i;p.lines.push(p.dial);w.step=p.lines.length;w.marked=p.reports.length>w.step?marks[w.step]:null;w.done=w.step===2;
    tickCue(g,'plotPencil');save(g);
    g.alert(w.done?'两笔都落下了。把透明十字移到铅线交点，压出船位。':'绿标反方位线已留下。移尺到双环断桩，保留第一笔。',2.6);
  }
  function pin(g,input,say,save){
    const r=g.survey,p=r.plotter,fix=crossing(...p.lines);
    g.set(0,'沿两道铅线找交点。移动图台十字，按确认留下船位。',{caption:reading(g,0,'两道反方位线　·　待压船位')});
    g.set(1,'把两处真方位读给岸台。等林澈在图上压下船位，才比对两条航道。',{caption:cueText(p.reports)});
    if(g.commit(0,input)){
      if(fix&&Math.hypot((fix.u-r.plot[0])*width,(fix.v-r.plot[1])*height)<1.26){
        p.pinned=true;tickCue(g,'plotPin');save(g);say(g,'intersection');
      }else miss(g,0,'图针还没压住两笔铅线的交点。','图针偏离交点');
    }
  }
  function visual(p,show){
    const a=anchor(0),b=anchor(1);
    return {show:show&&!p.legacy&&p.lines.length<2,anchor:{u:a.u+(b.u-a.u)*p.seat,v:a.v+(b.v-a.v)*p.seat},
      dial:p.dial,marks:p.lines.map((yaw,i)=>({anchor:anchor(i),yaw})),fix:p.pinned?crossing(...p.lines):null};
  }
  function checkpoint(p){
    if(p.legacy)return {legacy:true};
    return {reports:p.reports.slice(),lines:p.lines.slice(),dial:p.dial,seat:p.seat,pinned:p.pinned};
  }
  function restore(p,s,w){
    if(!s||s.legacy){p.legacy=w.step>0;return;}
    const angles=a=>Array.isArray(a)?a.slice(0,2).filter(v=>Number.isFinite(v)&&Math.abs(v)<=Math.PI):[];
    p.reports=angles(s.reports);p.lines=angles(s.lines).slice(0,p.reports.length);
    if(p.lines.length===2&&!crossing(...p.lines))p.lines.pop();
    p.dial=Number.isFinite(s.dial)?angle(s.dial):p.dial;p.seat=clamp(Number.isFinite(s.seat)?s.seat:0,0,1);
    p.pinned=p.lines.length===2&&s.pinned===true;
    w.step=p.lines.length;w.done=w.step===2;w.marked=p.reports.length>w.step?marks[w.step]:null;
  }
  return {create,observe,pin,briefing,visual,crossing,anchor,line,width,height,checkpoint,restore};
})();
