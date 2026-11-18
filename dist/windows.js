// One simulation and one WebGL renderer feed both windows. The partner window
// contains a presentation surface and forwards human input to the same session.
const TideWindows=(()=>{
  const game=document.getElementById('game'),board=game.querySelector('.board');
  const canvas=document.getElementById('canvas'),toggle=document.getElementById('detach');
  let partner=null,surface=null,remoteBoard=null,context=null,observer=null,callbacks={};
  const drags=new Map();
  let opening=false,returnUntil=0,hiddenTimer=0,activeWindow=window,partnerResize=null;
  let copies=new WeakMap(),sources=new WeakMap(),dirty=true,focusTimer=0,noteTimer=0;
  let frameJob=null,frameWindow=null,frameHandle=0;
  function connected(){return !!partner&&!partner.closed;}
  function visible(){return !document.hidden||(connected()&&!partner.document.hidden);}
  function clockWindow(){return document.hidden&&connected()&&!partner.document.hidden?partner:window;}
  function schedule(fn){
    frameJob=fn;frameWindow=clockWindow();
    frameHandle=frameWindow.requestAnimationFrame(stamp=>{
      const origin=frameWindow.performance.timeOrigin;
      frameJob=null;frameWindow=null;frameHandle=0;fn(stamp+(origin-performance.timeOrigin));
    });
  }
  function visibility(){
    if(frameJob&&frameWindow!==clockWindow()){
      frameWindow?.cancelAnimationFrame(frameHandle);schedule(frameJob);
    }
    clearTimeout(hiddenTimer);
    if(visible())return;
    const delay=Math.max(connected()?150:0,returnUntil-performance.now());
    if(delay>0)hiddenTimer=setTimeout(()=>{if(!visible())callbacks.hidden?.();},delay);
    else callbacks.hidden?.();
  }
  function blur(){
    if(partner&&partner.closed)detachEnded();
    if(performance.now()<returnUntil)return;
    if(!connected()&&!opening){drags.clear();callbacks.blur?.();return;}
    clearTimeout(focusTimer);
    focusTimer=setTimeout(()=>{
      if(!document.hasFocus()&&(!connected()||!partner.document.hasFocus())){drags.clear();callbacks.blur?.();}
    },120);
  }
  function note(message){
    const n=document.getElementById('window-note');n.textContent=message;n.hidden=false;
    clearTimeout(noteTimer);noteTimer=setTimeout(()=>{n.hidden=true;},6500);
  }
  function changed(){dirty=true;}
  function needsDraw(){const update=dirty;dirty=false;return update;}
  function detachEnded(){
    if(!partner)return;
    const old=partner;observer?.disconnect();observer=null;
    clearTimeout(focusTimer);returnUntil=performance.now()+650;
    partnerResize?.disconnect();partnerResize=null;activeWindow=window;
    partner=null;surface=null;context=null;remoteBoard=null;
    copies=new WeakMap();sources=new WeakMap();
    game.removeAttribute('data-seat');canvas.style.removeProperty('width');canvas.style.removeProperty('height');
    toggle.textContent='双窗口';toggle.setAttribute('aria-expanded','false');
    drags.clear();callbacks.release?.();changed();visibility();
    if(!old.closed)old.close();
    if(game.open)window.focus();
  }
  function clone(source,doc){
    const copy=doc.importNode(source,false);copies.set(source,copy);sources.set(copy,source);
    if(source===canvas){
      copy.id='partner-canvas';copy.removeAttribute('style');
      copy.setAttribute('aria-label','玩家二的三维视角');surface=copy;return copy;
    }
    if(source===game)copy.dataset.seat='1';
    for(const child of source.childNodes)copy.appendChild(clone(child,doc));
    return copy;
  }
  function sync(records){
    if(!connected())return;
    const children=new Set();
    for(const {target,type,attributeName:key} of records){
      const copy=copies.get(target);if(!copy||target===canvas)continue;
      if(type==='characterData'){copy.data=target.data;continue;}
      if(type==='childList'){children.add(target);continue;}
      if(target===game&&key==='data-seat')continue;
      if(target.hasAttribute(key))copy.setAttribute(key,target.getAttribute(key));else copy.removeAttribute(key);
    }
    for(const parent of children){
      const copy=copies.get(parent);
      for(let i=0;i<parent.childNodes.length;i++){
        const source=parent.childNodes[i],node=copies.get(source)||clone(source,partner.document);
        if(copy.childNodes[i]!==node)copy.insertBefore(node,copy.childNodes[i]||null);
      }
      while(copy.childNodes.length>parent.childNodes.length)copy.lastChild.remove();
    }
  }
  function bindSurface(target){
    const key=e=>(target===canvas?'home-':'partner-')+e.pointerId;
    function rect(){return target===surface?remoteBoard.getBoundingClientRect():board.getBoundingClientRect();}
    function hit(e){
      const b=rect(),u=(e.clientX-b.left)/b.width;
      const side=connected()?(target===surface?1:0):+(u*b.width>=Math.floor(b.width/2));
      const start=connected()||!side?0:Math.floor(b.width/2);
      const w=connected()?b.width:side?b.width-start:Math.floor(b.width/2);
      return {side,x:2*(u*b.width-start)/w-1,y:1-2*(e.clientY-b.top)/b.height};
    }
    target.addEventListener('pointerdown',e=>{
      if(e.button!==0)return;
      drags.set(key(e),{side:hit(e).side,x:e.clientX,y:e.clientY});
      target.setPointerCapture(e.pointerId);
    });
    target.addEventListener('pointermove',e=>{
      const p=drags.get(key(e));if(!p)return;
      callbacks.orbit?.(p.side,e.clientX-p.x,e.clientY-p.y);p.x=e.clientX;p.y=e.clientY;
    });
    target.addEventListener('lostpointercapture',e=>drags.delete(key(e)));
    target.addEventListener('dblclick',e=>callbacks.center?.(hit(e).side));
    target.addEventListener('contextmenu',e=>{
      const p=hit(e);if(callbacks.point?.(p.side,p.x,p.y))e.preventDefault();
    });
  }
  function open(){
    if(connected()){detachEnded();return;}
    if(partner)detachEnded();
    let w;opening=true;
    try{
      w=window.open('','_blank','popup,width='+Math.max(580,Math.min(1120,board.clientWidth))+',height='+Math.max(460,Math.min(900,window.innerHeight)));
      if(!w){note('浏览器拦住了第二个窗口。允许本站弹出窗口后，再点一次「双窗口」。');return;}
      partner=w;
      const doc=w.document;doc.documentElement.lang='zh-CN';doc.title='沈遥 · 玩家二 | 潮汐回声';
      const meta=doc.createElement('meta');meta.name='viewport';meta.content='width=device-width,initial-scale=1';doc.head.append(meta);
      for(const sheet of document.querySelectorAll('link[rel="stylesheet"]')){
        const link=doc.createElement('link');link.rel='stylesheet';link.href=sheet.href;link.onload=changed;doc.head.append(link);
      }
      document.getElementById('window-note').hidden=true;
      game.dataset.seat='0';toggle.textContent='合回同屏';toggle.setAttribute('aria-expanded','true');
      const replica=clone(game,doc);doc.body.replaceChildren(replica);
      remoteBoard=replica.querySelector('.board');context=surface.getContext('2d',{alpha:false});
      if(!context)throw Error('canvas');
      observer=new MutationObserver(sync);observer.observe(game,{subtree:true,childList:true,characterData:true,attributes:true});
      doc.addEventListener('click',e=>{
        const button=e.target.closest('button');if(!button)return;
        if(button.id==='expand'){
          if(doc.fullscreenElement)doc.exitFullscreen?.().catch(()=>{});
          else replica.requestFullscreen?.().catch(()=>{});
        }else sources.get(button)?.click();
      });
      doc.addEventListener('keydown',e=>{
        callbacks.down?.(e);
        if(e.code==='Escape'&&!e.defaultPrevented){
          e.preventDefault();
          if(game.dispatchEvent(new Event('cancel',{cancelable:true})))game.close();
        }
      });
      doc.addEventListener('keyup',e=>callbacks.up?.(e));
      bindSurface(surface);rememberInput(w);activeWindow=w;
      partnerResize=new w.ResizeObserver(changed);partnerResize.observe(remoteBoard);
      w.addEventListener('pagehide',()=>{if(partner===w)detachEnded();},{once:true});
      w.addEventListener('resize',changed);w.addEventListener('blur',blur);
      doc.addEventListener('visibilitychange',visibility);
      const instrument=game.querySelector('.role1 .meter:not([hidden])');
      if(instrument)meter(instrument);
      changed();visibility();
      const first=replica.querySelector('#overlay .primary,#unpause,.rg-1 .rg-ready:not([hidden]):not(:disabled)');
      (first||surface).focus({preventScroll:true});
    }catch{
      if(partner)detachEnded();else if(w&&!w.closed)w.close();
      note('第二个窗口无法显示。可以继续在同一块屏幕游玩。');
    }finally{opening=false;}
  }
  function layout(){
    if(partner&&!connected())detachEnded();
    const left=board.clientWidth,h0=board.clientHeight;
    if(!connected()){
      const mid=Math.floor(left/2);
      return {w:left,h:h0,panes:[{x:0,w:mid,h:h0},{x:mid,w:left-mid,h:h0}],separate:false};
    }
    const right=Math.max(1,remoteBoard.clientWidth),h1=Math.max(1,remoteBoard.clientHeight);
    const w=left+right,h=Math.max(h0,h1);
    if(canvas.style.width!==w+'px')canvas.style.width=w+'px';
    if(canvas.style.height!==h+'px')canvas.style.height=h+'px';
    return {w,h,panes:[{x:0,w:left,h:h0},{x:left,w:right,h:h1}],separate:true};
  }
  function present(layout,ratio){
    if(!layout.separate||!connected())return;
    const pane=layout.panes[1],sx=Math.floor(pane.x*ratio),sw=canvas.width-sx,sh=Math.floor(pane.h*ratio);
    if(sw<1||sh<1)return;
    if(surface.width!==sw)surface.width=sw;
    if(surface.height!==sh)surface.height=sh;
    context.drawImage(canvas,sx,canvas.height-sh,sw,sh,0,0,sw,sh);
  }
  function meter(source){
    const copy=connected()&&copies.get(source);
    if(copy)copy.getContext('2d').drawImage(source,0,0);
  }
  function pads(){
    const list=w=>{try{return [...(w.navigator.getGamepads?.()||[])].filter(Boolean);}catch{return [];}};
    const main=list(window);
    if(!connected())return main;
    const other=list(partner),first=partnerActive()?other:main;
    return first.concat((first===other?main:other).filter(p=>!first.some(q=>q.index===p.index)));
  }
  function rememberInput(w){
    const select=()=>{activeWindow=w;};
    w.addEventListener('focus',select);
    w.document.addEventListener('pointerdown',select,true);
    w.document.addEventListener('keydown',select,true);
  }
  function partnerActive(){
    return connected()&&partner.document.hasFocus()&&(!document.hasFocus()||activeWindow===partner);
  }
  function density(){
    return Math.min(1.5,Math.max(window.devicePixelRatio||1,connected()?partner.devicePixelRatio||1:1));
  }
  function focus(node){
    if(!node)return;
    if(connected()&&partnerActive()){
      sync(observer?.takeRecords()||[]);
      const copy=copies.get(node);
      if(copy){copy.focus({preventScroll:true});return;}
    }
    node.focus({preventScroll:true});
  }
  function active(){
    if(connected()&&partnerActive())return sources.get(partner.document.activeElement)||document.activeElement;
    return document.activeElement;
  }
  function dragging(i){for(const p of drags.values())if(p.side===i)return true;return false;}
  new ResizeObserver(changed).observe(board);rememberInput(window);
  toggle.addEventListener('click',open);bindSurface(canvas);
  window.addEventListener('pagehide',detachEnded);window.addEventListener('resize',changed);
  window.addEventListener('blur',blur);document.addEventListener('visibilitychange',visibility);
  return {layout,present,meter,pads,visible,density,active,focus,dragging,schedule,needsDraw,close:detachEnded,bind:handlers=>{callbacks=handlers;}};
})();
