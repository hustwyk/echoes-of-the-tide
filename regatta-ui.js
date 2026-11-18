const TideRegattaUI=(()=>{
  const names=['林澈','沈遥'],mark=['①','②'];
  const keysBySide=[['KeyA','KeyD','KeyW','KeyS','KeyE','Space','KeyC'],['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Enter','Slash','Backslash']];
  const codes=new Set([...keysBySide.flat(),'ShiftRight']);
  const fmt=t=>Number.isFinite(t)?t.toFixed(2)+' 秒':'未完赛';
  function create(renderer,fromMemory,onExit){
    let r=TideRegatta.create(),view=TideRegattaView.create(renderer),audio=null,paused=false,quality=1;
    let last=0,carry=0,panePhase='',resultAt=0,activeVoice='',voiceAge=0,best=[null,null];
    try{const saved=JSON.parse(localStorage.getItem('tide-regatta-records'));if(Array.isArray(saved))best=best.map((_,i)=>Number.isFinite(saved[i])&&saved[i]>0?saved[i]:null);}catch{}
    const held=new Set(),padsLast=[new Set(),new Set()],layer=document.createElement('div');
    layer.className='rg-layer';canvas.parentElement.append(layer);
    const panes=names.map((name,i)=>{
      const p=document.createElement('section');p.className='rg-pane rg-'+i;
      p.innerHTML='<div class="rg-id"><b>'+mark[i]+' '+name+'</b><span></span></div><div class="rg-marker"></div><div class="rg-strip"><strong></strong><span></span><div class="rg-read"><i></i><small></small></div></div><button class="rg-ready"></button>';
      layer.append(p);const button=p.querySelector('button');button.onclick=()=>ready(i);
      return {p,id:p.querySelector('.rg-id span'),marker:p.querySelector('.rg-marker'),title:p.querySelector('.rg-strip strong'),
        text:p.querySelector('.rg-strip span'),bar:p.querySelector('.rg-read i'),charge:p.querySelector('small'),button};
    });
    const count=document.createElement('strong'),panel=document.createElement('div');
    count.className='rg-count';panel.className='rg-panel';layer.append(count,panel);panel.hidden=true;
    const out=fromMemory?'回到录音桌':'返回行动档案';
    function ensureSound(){if(wantsAudio&&!sound.enabled)sound.enable(true).then(updateAudio);}
    function ready(i){ensureSound();TideRegatta.confirm(r,i);canvas.focus();hud();}
    function setPanel(title,body,buttons){
      panel.hidden=false;panel.replaceChildren();
      const box=document.createElement('div'),h=document.createElement('h2');box.className='rg-card';h.textContent=title;box.append(h);
      for(const line of body){const p=document.createElement('p');p.textContent=line;box.append(p);}
      const controls=document.createElement('div');controls.className='rg-actions';box.append(controls);
      for(const [label,fn] of buttons){const b=document.createElement('button');b.textContent=label;b.onclick=fn;controls.append(b);}
      panel.append(box);controls.firstElementChild.focus({preventScroll:true});
    }
    function restart(){
      audio?.dispose();audio=null;r=TideRegatta.create(r.round+1);paused=false;held.clear();last=carry=0;panePhase='';activeVoice='';panel.hidden=true;
      $('pause').disabled=false;$('pause').textContent='暂停';hud();canvas.focus();
    }
    function pause(force=false){
      if(r.phase==='result'||force&&paused)return;
      paused=!paused;last=carry=0;held.clear();audio?.quiet();$('pause').textContent=paused?'继续':'暂停';
      if(!paused){panel.hidden=true;canvas.focus();hud();return;}
      const qualityButton=()=>{quality=quality===1?.72:1;panel.querySelectorAll('button')[1].textContent='画质　'+(quality===1?'高':'流畅');view.draw(r,quality);};
      setPanel('船停在这里', ['两艘船和计时都已暂停。'],[['继续比赛',()=>pause()],['画质　'+(quality===1?'高':'流畅'),qualityButton],['交换航道重赛',restart],[out,leave]]);
    }
    let lastResult=null;
    function leave(){if(!dead)onExit(lastResult);}
    function result(){
      lastResult=r.winner;
      resultAt=r.clock;$('pause').disabled=true;const b=r.boats;
      const lines=b.map((v,i)=>{
        const lap=v.splits.length?Math.min(...v.splits):null;
        if(lap!==null&&(best[i]===null||lap<best[i]))best[i]=lap;
        return mark[i]+' '+names[i]+'　'+fmt(v.time)+(lap===null?'':'　最快一圈 '+fmt(lap))+(v.penalty?'　含取船罚时 '+v.penalty+' 秒':'');
      });
      try{localStorage.setItem('tide-regatta-records',JSON.stringify(best));}catch{}
      setPanel(r.winner===-1?'瓶盖一人一半':names[r.winner]+'赢得瓶盖',lines,[['交换航道再来一场',restart],[out,leave]]);
    }
    function voice(){
      let key='',age=0;
      if(r.phase==='ready'){let next=.22;for(const id of ['pool','deal','rules']){const sec=TideRegattaSpeech[id].duration;
        if(r.clock>=next&&r.clock<next+sec){key=id;age=r.clock-next;break;}next+=sec+.28;}}
      if(r.phase==='result'){const id=r.winner<0?'tie':r.winner?'shen':'lin';age=r.clock-resultAt-.18;if(age>=0&&age<TideRegattaSpeech[id].duration)key=id;}
      activeVoice=key;voiceAge=age;r.voice=key;r.voiceTime=age;
    }
    function hud(){
      if(r.phase==='result'&&panePhase!=='result')result();panePhase=r.phase;
      voice();const intro=r.phase==='ready',waiting=r.phase==='count';
      count.hidden=!waiting;count.textContent=waiting?String(Math.max(1,Math.ceil(r.count))):'';
      for(const [i,b] of r.boats.entries()){
        const u=panes[i],k=i?'Enter':'E',g=TideRegatta.gates[b.gate],driving=r.phase==='race'&&b.time===null;
        u.id.textContent=intro?'船模 '+(i?'02':'01'):'第 '+Math.min(2,b.lap+1)+' / 2 圈';
        u.button.hidden=!intro;u.button.disabled=r.ready[i];u.button.textContent=r.ready[i]?'已就位，等另一人':'准备　'+k+' / 手柄 A';
        u.marker.hidden=!driving;
        if(driving){const to=view.target(r,i);u.marker.style.left=to.x*100+'%';u.marker.style.top=to.y*100+'%';u.marker.textContent=(to.edge?(to.x<.5?'← ':'→ '):'◇ ')+g.name;}
        u.title.textContent=intro?(i?'蓝绿艇 · 沈遥':'木甲板艇 · 林澈'):b.time!==null?'已过格旗线　'+fmt(b.time):'下一门　'+g.name;
        u.text.textContent=b.messageUntil>r.clock?b.message:intro?(best[i]?'个人最快圈　'+fmt(best[i]):'穿过五道门，绕完两圈。'):(i?'方向键驾驶 · Enter 直驱 · ＼ 俯看':'WASD 驾驶 · E 直驱 · C 俯看');
        const pct=Math.round(b.charge*100);u.bar.style.width=pct+'%';u.charge.textContent='电量 '+pct+'%';
      }
      if(paused)return;
      showStatus(activeVoice?TideRegattaSpeech[activeVoice].line:intro?'前推加油，后拉倒车。桥下有两个孔，可以选自己的路。':r.phase==='result'?'换边以后，两人的出发航道也会对调。':r.firstAt!==null&&r.phase==='race'?'领先艇已过线，另一艘还有 '+Math.max(0,Math.ceil(12-r.elapsed+r.firstAt))+' 秒。':'推左摇杆驾驶，RT 直驱，按右摇杆俯看。按住空格、斜杠或手柄 Y 取船，罚时两秒。');
      $('elapsed').textContent=(r.phase==='ready'?'两人分别准备':r.elapsed.toFixed(1)+' 秒');
    }
    function inputs(pads){
      assignPads(pads);
      return keysBySide.map(([left,right,up,down,boost,reset],i)=>{
        if(dead)return {x:0,z:0};
        const pad=pads.find(p=>p.index===padSlots[i]),buttons=new Set();
        pad?.buttons.forEach((b,j)=>{if(b.pressed)buttons.add(j);});
        const edge=j=>buttons.has(j)&&!padsLast[i].has(j);
        if(edge(9)&&r.phase!=='result')pause();
        else if(paused||r.phase==='result'){
          const options=[...panel.querySelectorAll('button')],pos=options.indexOf(document.activeElement);
          if(edge(1)){if(paused)pause();else leave();}
          else if(edge(12)||edge(14)||edge(13)||edge(15)){const dir=edge(12)||edge(14)?-1:1;options[(pos+dir+options.length)%options.length]?.focus();}
          else if(edge(0)&&options.includes(document.activeElement))document.activeElement.click();
        }else{
          if((edge(0)||edge(7))&&r.phase==='ready')ready(i);
          if(edge(11))view.toggle(i);
        }
        padsLast[i]=buttons;const axis=j=>Math.abs(pad?.axes[j]||0)>.14?pad.axes[j]:0;
        return {x:Math.max(-1,Math.min(1,+held.has(right)-held.has(left)+axis(0))),z:Math.max(-1,Math.min(1,+held.has(down)-held.has(up)+axis(1))),
          boost:held.has(boost)||buttons.has(7),reset:held.has(reset)||i===1&&held.has('ShiftRight')||buttons.has(3)};
      });
    }
    let dead=false;
    function frame(now,pads){
      const k=inputs(pads);if(dead||paused){last=0;return;}
      const delta=last?Math.min(.12,Math.max(0,(now-last)/1000)):0;last=now;carry+=delta;
      while(carry+1e-9>=1/60){TideRegatta.step(r,k,1/60);carry-=1/60;}
      hud();view.draw(r,quality);
      if(sound.enabled&&sound.ctx){audio??=TideRegattaAudio.create(sound.ctx,sound.master);audio.update(r,activeVoice,voiceAge);}
      else if(audio){audio.dispose();audio=null;}
    }
    function key(e){
      if(e.code==='Escape'){e.preventDefault();if(!e.repeat){if(r.phase==='result')leave();else pause();}return;}
      if(paused||r.phase==='result'||!codes.has(e.code))return;
      e.preventDefault();held.add(e.code);if(e.repeat)return;
      if(r.phase==='ready'&&['KeyE','Enter'].includes(e.code))ready(e.code==='Enter'?1:0);
      if(['KeyC','Backslash'].includes(e.code))view.toggle(e.code==='KeyC'?0:1);
    }
    function dispose(){dead=true;held.clear();audio?.dispose();view.dispose();layer.remove();$('pause').disabled=false;}
    TideRegattaAudio.load();hud();return {frame,key,up:code=>held.delete(code),pause,dispose};
  }
  return {create};
})();
