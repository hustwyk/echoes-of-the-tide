const TideHud=(()=>{
  const roles=['林澈 · 机修员','沈遥 · 信号员'];
  const pix=['#efad70','#85d6cf'];
  function build(root){
    root.innerHTML=roles.map((name,i)=>'<div class="viewport role'+i+'"><div class="pname"><b>'+('0'+(i+1))+'</b>'+name+'</div><div class="reticle" hidden aria-hidden="true"><i></i></div><span class="pin" id="pin'+i+'"></span><div class="point-cursor" aria-hidden="true" hidden><i></i><span></span></div><div class="partner-pin from-left" hidden><i></i><span></span></div><div class="partner-pin from-right" hidden><i></i><span></span></div><div class="instrument"><div class="tool"></div><div class="instruction"></div><canvas class="meter" width="600" height="82" hidden></canvas><div class="reading"></div><div class="control-hint"></div></div></div>').join('');
  }
  function line(ctx,color,x1,y1,x2,y2,width=2){
    ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();
  }
  function meter(canvas,r,i,t){
    const c=canvas.getContext('2d'),w=600,h=82,d=r.value??0;
    c.clearRect(0,0,w,h);c.fillStyle='#091719';c.fillRect(0,0,w,h);
    c.strokeStyle='#254044';c.lineWidth=1;
    for(let x=0;x<w;x+=30)line(c,'#294243',x,0,x,h,1);
    for(let y=0;y<h;y+=20)line(c,'#294243',0,y,w,y,1);
    if(r.vis==='archive'){
      const wave=window.TideArchiveMedia?.[r.wave]?.[r.side]?.wave;
      const scale=r.scale||1,zero=r.zero||0,horizon=7.2,counter=zero+r.head*scale;
      const start=Math.min(zero+15*scale-horizon,Math.max(0,counter-horizon*.42));
      const screen=t=>(zero+t*scale-start)*w/horizon;
      c.fillStyle=i?'#5b9991':'#af8b5b';
      for(let t=Math.ceil(start);t<=start+horizon;t++)line(c,'#465958',(t-start)*w/horizon,8,(t-start)*w/horizon,73,1);
      if(wave){
        for(let x=0;x<w;x+=2){
          const t=(start+x*horizon/w-zero)/scale;if(t<0)continue;
          const v=wave[Math.min(wave.length-1,Math.floor(t*wave.length/15))]/255;
          const height=(3+v*31)*(.4+.6*r.clarity);
          c.fillRect(x,41-height,1.6,2*height);
        }
      }
      for(const at of r.marks){
        const x=screen(at);line(c,'#c29455',x,0,x,h,3);
        c.fillStyle='#e2b77e';c.fillRect(x-5,0,10,8);
      }
      if(r.provisional!=null)line(c,'#f0e7c0',screen(r.provisional),0,screen(r.provisional),h,2);
      line(c,pix[i],screen(r.head),0,screen(r.head),h,3);
      return;
    }
    if(r.vis==='chart'){
      for(let layer=0;layer<2;layer++){
        const off=layer?(r.value-(r.target??.5))*135:0;
        c.strokeStyle=layer?pix[i]:'#9ba99c';c.lineWidth=2;c.beginPath();
        for(let x=0;x<=w;x+=4){const y=40+18*Math.sin(x*.016)+9*Math.cos(x*.037);x?c.lineTo(x+off,y):c.moveTo(x+off,y);}c.stroke();
        for(let k=0;k<3;k++){c.beginPath();c.arc(128+k*163+off,34,7,0,Math.PI*2);c.stroke();}
      }
    }else if(r.vis==='optic'){
      const miss=(r.peer-r.peerTarget)*w*.72;
      c.fillStyle='#4f795d';c.fillRect(w*.47,3,w*.06,h-6);
      for(const delta of [miss,miss*1.6]){const x=w*.5+delta;line(c,'#ffce9d99',x-12,78,x+12,5,8);}
    }else if(r.vis==='wave'||r.vis==='tide'){
      c.beginPath();c.strokeStyle=pix[i];c.lineWidth=2.3;
      for(let x=0;x<=w;x+=3){const pos=x/w,amp=r.vis==='tide'?20:8+18*Math.exp(-Math.pow((pos-.5)*5,2));
        const y=h/2+amp*Math.sin(x*(r.vis==='tide'?.018:.083)+d*12+(r.vis==='tide'?t:0));
        x?c.lineTo(x,y):c.moveTo(x,y);}c.stroke();
    }
    if(r.target!=null){
      const b=r.band??.05;c.fillStyle='#95d49b50';c.fillRect(w*Math.max(0,r.target-b),0,Math.min(1,2*b)*w,h);
    }
    if(r.vis!=='chart' && r.vis!=='optic'){line(c,'#f9dfac',clamp(d)*w,2,clamp(d)*w,h-2,4);}
    function clamp(x){return Math.max(.005,Math.min(.995,x));}
  }
  function set(node,value){if(node.textContent!==value)node.textContent=value;}
  function update(g,pads){
    const views=document.querySelectorAll('.viewport');
    for(let i=0;i<2;i++){
      const v=views[i],r=g.station[i],close=g.near[i],s=g.spec,q=g.state,k=TideCoop.roleKeys[i];
      const riding=s.type==='ride' && (s.driver!==i||q.latch);
      v.querySelector('.reticle').hidden=!(TideLookout.active(g)&&g.watch.task.watcher===i&&g.engaged[i]||g.relay?.top&&!i&&g.engaged[i]||g.survey&&i===1&&g.engaged[i]||g.fog?.mode==='spot'&&i===1&&g.engaged[i]);
      const here=TideGallery.active(g)||TideFenders.active(g)||TideSwing.active(g)||!!g.cistern||!!g.glass||!!g.fog||!!g.survey||!!g.relay||!!g.cable||close||g.signal&&g.stage===2&&i===0&&!g.signal.pinned||riding||!!g.section.tram,tag=TideHarbor.targetFor(g,i).name;
      const task=g.fog?.haul?(i?'离合柄':'轮坑黄环'):TideGallery.active(g)?(g.gallery.phase==='file'?'灯室原数联':'塔外检修台'):TideArrival.active(g)?'交通艇靠泊':TideTinMemory.active(g)?'十秒钟北岬 · 夏日录音':TideTransit.active(g)?'岸灯试光与船上报位':TideFenders.active(g)?'护舷井登岸':TideSwing.active(g)?(g.swing.phase==='report'?'桥头寄件柜':g.swing.phase==='stow'?'把尺交进吊篮':'桥下横移吊环'):g.cable?TideCableQuay.title(g):g.landfall?(g.landfall.pinned?'值班间收听':'防潮门'):g.rig?.belay?'浪沟接应':s.title;
      const title=g.state.doneAt!==null?'已完成 · '+task:(g.stage+1)+' / '+g.world.sections.length+'　'+task;
      set(v.querySelector('.tool'),title);
      set(v.querySelector('.instruction'),here?r.text||'靠近设备开始操作':g.archive?'前往'+tag:g.signal?'前往'+tag:g.optic?'沿塔顶外环前往'+tag:'前往'+tag+'，沿灯带通过栈桥');
      const m=v.querySelector('.meter'),reading=v.querySelector('.reading');
      m.hidden=!here||!r.vis;reading.hidden=!here||!r.caption;
      if(!m.hidden)meter(m,r,i,g.time);
      set(reading,r.caption||'');
      const role=v.querySelector('.pname').lastChild,roleName=TideTinMemory.active(g)?(i?'童年 · 沈遥':'童年 · 林澈'):TideTransit.active(g)&&i===1?'梁青 · 驾驶台左舷':g.lastPass&&i&&g.state.mode&&g.near[1]?(g.lastPass.turned?'海雁号 · 回望船尾':'阿棠 · 后甲板视角'):g.fog&&i===1&&['bridge','spot'].includes(g.fog.mode)?'梁青 · 驾驶台视角':g.survey&&i===1&&g.stage===2&&g.engaged[i]?'阿棠 · 船尾视角':roles[i];
      if(role.textContent!==roleName)role.textContent=roleName;
      const tips=pads[i]!=null?'左摇杆移动　A 跳跃/确认　RT 操作　右摇杆视角':k.use+' 操作　'+k.jump+' 跳跃 / 操作中确认　'+k.trim+' 微调';
      const work=g.archive&&here&&g.archive.sourceLoaded&&g.archive.review===null;
      const bindings=pads[i]!=null?(i?'RT 操作　上下走带　左右调谐　A 压针':'RT 操作　左右快拨　前推慢放　后拉刹带　A 压针'):
        (i?'Enter 操作　↑ 前进 / ↓ 倒带　← → 调谐　/ 压针':'E 操作　A / D 快拨　W 慢放　S 刹带　空格压针');
      const rack=g.archive?.keys&&here;
      const childSends=g.archive?.memory&&(g.archive.memory.dir===1?i===0:i===1);
      const childhood=pads[i]!=null?(childSends?'RT 扶板　左摇杆倾斜　A 放手':'RT 托盒　左摇杆移盒'):
        (i?'Enter ':'E ')+(childSends?'扶板　'+(i?'方向键倾斜　/':'WASD 倾斜　空格')+'放手':'托盒　'+(i?'方向键':'WASD')+'移盒');
      const arrivalHint=i?(pads[i]!=null?'左摇杆操舵与进退　RT 停机':'↑ 进车　↓ 倒车　← → 操舵　Enter 停机'):
        (g.arrival?.radio==='line'?(pads[i]!=null?'左摇杆移动落点　RT 抛缆 / 收缆':'WASD 移动落点　E 抛缆 / 收缆'):(pads[i]!=null?'左摇杆左右调台　RT 发话':'A / D 调台　E 发话'));
      const rescueHint=i?(pads[i]!=null?'RT 握柄　左摇杆左右盘车　回中抱闸':'Enter 握柄　← → 盘车　松开方向键抱闸'):
        (pads[i]!=null?'RT 抓环　左摇杆前推翻上　松开 RT 后 A 回收':'E 抓环　W 翻上　松开 E 后空格回收');
      set(v.querySelector('.control-hint'),g.fog?.haul?rescueHint:TideGallery.active(g)?(pads[i]!=null?'左摇杆移动 / 转轮　A 跳　RT 握柄':i?'方向键移动 / 转轮　/ 跳　Enter 握柄':'WASD 移动 / 转轮　空格 跳　E 握柄'):TideArrival.active(g)?arrivalHint:TideTinMemory.active(g)?childhood:TideTransit.active(g)&&i===1?(pads[1]!=null?'左摇杆转镜　A 报位':'方向键转镜　/ 报位'):rack?(i?'向前重听　操作中确认登记':'左右选列，前后选层　操作中确认提起 / 放回'):work?bindings:tips);
    }
  }
  return {build,update};
})();
