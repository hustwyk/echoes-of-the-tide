const TideHud=(()=>{
  const roles=['林澈 · 机修员','沈遥 · 信号员'];
  const pix=['#efad70','#85d6cf'];
  function build(root){
    root.innerHTML=roles.map((name,i)=>'<div class="viewport role'+i+'"><div class="pname"><b>'+('0'+(i+1))+'</b>'+name+'</div><div class="reticle" hidden aria-hidden="true"><i></i></div><span class="pin" id="pin'+i+'"></span><div class="instrument"><div class="tool"></div><div class="instruction"></div><canvas class="meter" width="600" height="82" hidden></canvas><div class="reading"></div><div class="control-hint"></div></div></div>').join('');
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
      v.querySelector('.reticle').hidden=!(TideLookout.active(g)&&g.watch.task.watcher===i&&g.engaged[i]);
      const here=close||riding||!!g.section.tram,tag=TideHarbor.targetFor(g,i).name;
      const title=g.state.doneAt!==null?'已完成 · '+s.title:(g.stage+1)+' / '+g.world.sections.length+'　'+s.title;
      set(v.querySelector('.tool'),title);
      set(v.querySelector('.instruction'),here?r.text||'靠近设备开始操作':g.optic?'沿塔顶外环前往'+tag:'前往'+tag+'，沿灯带通过栈桥');
      const m=v.querySelector('.meter'),reading=v.querySelector('.reading');
      m.hidden=!here||!r.vis;reading.hidden=!here||!r.caption;
      if(!m.hidden)meter(m,r,i,g.time);
      set(reading,r.caption||'');
      const tips=pads[i]!=null?'左摇杆移动　A 跳跃/确认　RT 操作　右摇杆视角':k.use+' 操作　'+k.jump+' 跳跃 / 操作中确认　'+k.trim+' 微调';
      set(v.querySelector('.control-hint'),tips);
    }
  }
  return {build,update};
})();
