const $=id=>document.getElementById(id);
const info=$('info'),game=$('game'),overlay=$('overlay'),canvas=$('canvas');
let progress=0,resume=null,pocketTape=[];
try{pocketTape=TideTinMemory.readTakes(JSON.parse(localStorage.getItem('tide-childhood-takes')));}catch{}
const journal=[];
try {
  progress=Math.max(0,Math.min(levels.length,Math.floor(Number(localStorage.getItem('tide-progress'))||0)));
  const save=JSON.parse(localStorage.getItem('tide-3d-checkpoint'));
  if(save && Number.isInteger(save.index) && save.index===progress && Number.isInteger(save.stage) && (save.stage>0||save.stage===0&&(save.index===0&&['moored','upper','exit','done'].includes(save.fenders?.berth)||save.index===3&&['inspect','board'].includes(save.cistern?.phase)||save.index===5&&save.glass?.keyed||save.index===10&&save.fog?.key||save.index===8&&save.survey?.taken||save.index===7&&save.relay?.low||save.index===1&&save.cable?.signalled===true||save.index===2&&save.signal?.starter==='latched'||save.index===9&&(save.lantern?.far===true||['middle','stairs','file','inside'].includes(save.lantern?.gallery))||save.index===4&&save.archive?.count>0)) && save.stage<TideMissions.chapters[save.index]?.length)resume=save;
} catch {}
const sound=new HarborSound();
let wantsAudio=true;try{wantsAudio=localStorage.getItem('tide-audio')!=='off';}catch{}
const keys=new Set(),jumps=[false,false],toolTaps=[false,false],gamepadDown=[false,false];
let tideTicket=null;
try{tideTicket=TideGallery.validTicket(JSON.parse(localStorage.getItem('tide-survey-ticket')));}catch{}
let session=null,view=null,index=0,mode='menu',last=0,remainder=0,redraw=0,voice=false;
const padSlots=TideCrewInput.slots,cameraButtons=[false,false],pointTaps=[false,false];
let seatPanel=null;
let menuPadState=new Set();
function gamepads(){
  return TideWindows.pads().filter(p=>p.connected);
}
TideHud.build($('split'));
function showInfo(html) {
  $('info-content').innerHTML = html;
  if (!info.open) info.showModal();
}

function storedMark(save){return save.fenders||save.swing||save.cistern||save.glass||save.pass||save.fog||save.survey||save.relay||save.cable||save.landfall||save.lantern||save.signal||save.archive;}
function campaign() {
  $('count').textContent = String(progress).padStart(2,'0')+' / 12';
  $('start').innerHTML = progress===12 ? '<span>▶</span> 重玩行动' : progress||resume ? '<span>▶</span> 继续行动' : '<span>▶</span> 开始行动';
  $('chapters').replaceChildren(...acts.map((act,i)=>{
    const button = document.createElement('button');
    button.className = 'act-card'+(Math.floor(Math.min(progress,11)/3)===i?' current':'');
    button.style.setProperty('--scene','url(assets/'+act.image+'.jpg)');
    button.innerHTML = '<div><span class="act-index">ACT 0'+(i+1)+' &nbsp; / &nbsp; '+act.range+'</span><strong>'+act.name+'</strong><small>'+act.sub+'</small></div><b aria-hidden="true">›</b>';
    button.onclick = () => {
      showInfo('<h2>'+act.name+'</h2><p>'+act.summary+'</p><div id="level-list"></div>');
      for (let n=i*3;n<i*3+3;n++) {
        const entry = document.createElement('button');
        entry.className = 'level-link';
        entry.disabled = n>progress;
        entry.textContent = String(n+1).padStart(2,'0')+' · '+levels[n].name+(n<progress?'　✓ 已通关':n>progress?'　· 待解锁':'　›');
        entry.onclick = () => resume?.index===n?openLevel(n,resume.stage,storedMark(resume)):openLevel(n);
        $('level-list').append(entry);
      }
      if(i===3&&progress===12){
        const reply=document.createElement('button');reply.className='level-link';
        reply.textContent='尾声 · 顾岚的回件';reply.onclick=()=>openFiling(true);$('level-list').append(reply);
      }
    };
    return button;
  }));
}

function savePoint(g){
  const takes=g.archive?.memory?.takes;
  if(takes?.length===2&&pocketTape!==takes){
    pocketTape=takes;try{localStorage.setItem('tide-childhood-takes',JSON.stringify(takes));}catch{}
  }
  if(g.index!==progress)return;
  const fenders=TideFenders.checkpoint(g),landfall=TideLandfall.checkpoint(g),mark=TideLantern.checkpoint(g)||TideGallery.checkpoint(g),signal=TideSignal.checkpoint(g),archive=TideArchive.checkpoint(g);
  const swing=TideSwing.checkpoint(g),cistern=TideCistern.checkpoint(g),cable=TideCableQuay.checkpoint(g),relay=TideRelay.checkpoint(g),survey=TideSoundings.checkpoint(g),glass=TideGlass.checkpoint(g),fog=TideFogSignal.checkpoint(g),pass=TideLastPass.checkpoint(g);
  if(!g.stage&&!fenders&&!signal&&!cistern&&!mark&&!archive&&!cable&&!relay&&!survey&&!fog&&!glass)return;
  resume={index:g.index,stage:g.stage,...(fenders?{fenders}:{}),...(swing?{swing}:{}),...(cistern?{cistern}:{}),...(glass?{glass}:{}),...(pass?{pass}:{}),...(fog?{fog}:{}),...(survey?{survey}:{}),...(relay?{relay}:{}),...(cable?{cable}:{}),...(landfall?{landfall}:{}),...(mark?{lantern:mark}:{}),...(signal?{signal}:{}),...(archive?{archive}:{})};
  try{localStorage.setItem('tide-3d-checkpoint',JSON.stringify(resume));}catch{}
}
function clearInput(){
  TideCrewInput.clear();
  if(view)view.lastTick=null;
  view?.pointing?.cancel();pointTaps.fill(false);keys.clear();jumps.fill(false);toolTaps.fill(false);gamepadDown.fill(false);cameraButtons.fill(false);last=0;remainder=0;
}
function note(line){
  if(line && journal.at(-1)!==line)journal.push(line);
  if(journal.length>40)journal.shift();
}
function addJournal(parent,lines){
  if(!lines.length)return;
  const details=document.createElement('details'),summary=document.createElement('summary');
  details.className='logbook';summary.textContent='翻阅值班记录';details.append(summary);
  for(const line of lines){
    const p=document.createElement('p');p.textContent=line;details.append(p);
  }
  parent.append(details);
}
function say(line){
  if(!sound.enabled)return;
  sound.radio();
  if(!voice||!('speechSynthesis' in window))return;
  speechSynthesis.cancel();
  const utter=new SpeechSynthesisUtterance(line.replace(/\n/g,'。'));utter.lang='zh-CN';utter.rate=1.05;
  speechSynthesis.speak(utter);
}
function radio(line,duration=5){
  if(!session)return;
  session.notice=line;session.noticeUntil=session.time+duration;say(line);
}
function onStage(g){
  view?.pointing?.clear();savePoint(g);const line=TideFenders.active(g)?TideFenders.briefing:g.spec.radio;note(line);g.notice=line;g.noticeUntil=g.time+6;
  if(mode==='playing'&&!TideFenders.active(g)&&!g.swing?.voice&&!g.cistern?.voice)say(line);
}
let race=null,sharedRenderer=null,loadingRace=null,raceEntry=0;
function fieldRenderer(){return sharedRenderer??=TideHarbor.makeRenderer(canvas);}
function poolModule(){
  if(typeof TideRegattaPool!=='undefined')return Promise.resolve();
  return loadingRace??=new Promise((ok,bad)=>{
    const tag=document.createElement('script');tag.src='regatta-pool.js';
    tag.onload=()=>{tag.remove();ok();};tag.onerror=()=>{tag.remove();loadingRace=null;bad(Error('未能读取试船池场景'));};document.head.append(tag);
  });
}
async function enterRegatta(fromMemory=false){
  if(race||mode==='regatta-loading')return;
  const entry=++raceEntry;if(info.open)info.close();if(!game.open)game.showModal();
  if(wantsAudio)sound.enable(true).then(updateAudio);
  clearInput();sound.stopScene();window.speechSynthesis?.cancel();
  mode='regatta-loading';$('split').hidden=$('film').hidden=true;overlay.replaceChildren();
  $('act').textContent='夏日回忆　/　北岬试船池';$('level-title').textContent='瓶盖杯';$('elapsed').textContent='';
  showStatus('正在把船模放进水里');$('pause').disabled=true;
  function leave(winner=null){
    race?.dispose();race=null;clearInput();menuPadState=new Set(gamepads().flatMap(p=>p.buttons.flatMap((b,j)=>b.pressed?[j]:[])));
    if(fromMemory&&session){
      if(Number.isInteger(winner))session.archive.memory.poolResult=winner;
      view.w=0;view.snap=true;$('act').textContent=acts[Math.floor(index/3)].name+'　/　'+String(index+1).padStart(2,'0')+' OF 12';
      $('level-title').textContent=levels[index].name;startPlaying(false);
    }else game.close();
  }
  try{
    await poolModule();if(raceEntry!==entry||!game.open)return;
    race=TideRegattaUI.create(fieldRenderer(),fromMemory,leave);mode='regatta';$('pause').disabled=false;$('pause').textContent='暂停';TideWindows.focus(canvas);
  }catch(error){
    if(raceEntry!==entry||!game.open)return;
    showStatus('试船池暂时无法显示。'+error.message);const back=document.createElement('button');
    back.textContent=fromMemory?'回到录音桌':'返回行动档案';back.onclick=leave;overlay.replaceChildren(back);
  }
}
function openLevel(n,stage=0,mark=null){
  closeFiling();if(info.open)info.close();
  if(!game.open)game.showModal();
  sound.stopScene();window.speechSynthesis?.cancel();$('film').hidden=true;$('pause').disabled=true;
  journal.length=0;
  clearInput();index=n;mode='loading';
  $('split').hidden=true;showStatus('正在准备场景');
  overlay.innerHTML='<div class="story"><h3>正在进入北岬</h3></div>';
  try{
    view??=new TideHarbor.WorldView(canvas,(i,kind)=>sound.tone(kind==='seen'?(i?820:740):(i?690:518),kind==='seen'?.16:.10,'sine',.11,i?.58:-.58),fieldRenderer());
    if(n===0){TideReceiverAudio.loadFender();if(!stage&&!mark){TideReceiverAudio.loadArrival();TideReceiverAudio.loadPlate();}}
    if(n===6)TideReceiverAudio.loadSwing();
    if(n===3)TideReceiverAudio.loadCistern();
    if(n===5)TideReceiverAudio.loadGlass();
    if(n===10){TideReceiverAudio.loadFog();TideReceiverAudio.loadHaul();}
    if(n===11)TideReceiverAudio.loadPass();
    if(n===9&&!stage&&(!mark||mark.gallery))TideReceiverAudio.loadGallery();
    if(n===8)TideReceiverAudio.loadSoundings();
    if(n===7)TideReceiverAudio.loadRelay();
    if(n===1)TideReceiverAudio.loadQuay();
    if(n===2){TideRainApron.load();TideReceiverAudio.loadTransit();if(!stage)TideReceiverAudio.loadShift();}
    if(n===4){TideTapeAudio.load();TideReceiverAudio.loadTin();}
    session=new TideCoop.Session(n,{
      stage:onStage,checkpoint:savePoint,log:note,alert:line=>{
        if(/^(小林澈|小沈遥|林澈|沈遥|阿棠|梁青|海雁复述|值班员|测潮员|哐啷)/.test(line)){
          note(line);if(voice&&!session?.signal?.voice&&!session?.archive?.memory?.voice)say(line);
        }
      },success:()=>sound.tone(580,.23,'triangle'),sound:(f,d)=>sound.tone(f,d),
      reset:side=>{view.snap=true;sound.cue('reset',side);},finish:finishLevel
    });
    if(n===11){try{session.savedSpacing=JSON.parse(localStorage.getItem('tide-foghorn-spacing'));}catch{}}
    if(stage){
      session.stage=stage;const sec=session.section;session.checkpoints=sec.starts.slice();session.players=sec.starts.map(TideTraversal.spawn);session.begin();
      for(let k=0;k<stage;k++)TideDrawbridge.restore(session.world.sections[k]);
      for(let k=0;k<stage;k++)for(const deck of session.world.sections[k].returnDecks){
        deck.active=true;if(deck.hinge!==undefined){deck.unlocked=true;deck.hinge=1;}
      }
    }
    session.pocketTape=pocketTape;
    if(n===9)session.tideTicket=tideTicket;
    if(n===9&&!stage&&(!mark||mark.gallery))TideGallery.begin(session,mark);
    if(mark&&!mark.gallery){if(mark.berth)TideFenders.restore(session,mark);else if(session.swing)TideSwing.restore(session,mark);else if(session.cistern)TideCistern.restore(session,mark);else if(session.glass)TideGlass.restore(session,mark);else if(session.lastPass)TideLastPass.restore(session,mark);else if(session.fog)TideFogSignal.restore(session,mark);else if(session.survey)TideSoundings.restore(session,mark);else if(session.relay)TideRelay.restore(session,mark);else if(session.cable)TideCableQuay.restore(session,mark);else if(session.world.landfall)TideLandfall.restore(session,mark);else if(session.archive)TideArchive.restore(session,mark);else if(session.signal)TideSignal.restore(session,mark);else TideLantern.restore(session,mark);savePoint(session);}
    if(n===0&&!stage&&!mark)TideArrival.begin(session);
    view.load(session);
  }catch(err){
    console.error(err);mode='error';
    overlay.innerHTML='<div class="story"><h3>三维场景未能启动</h3><p>请在支持 WebGL 的桌面浏览器中开启图形加速后重试。</p><p id="error-detail"></p><button class="secondary">返回档案</button></div>';
    $('error-detail').textContent=err.message;overlay.querySelector('button').onclick=()=>game.close();return;
  }
  const level=levels[n],act=acts[Math.floor(n/3)];mode='story';
  $('act').textContent=act.name+'　/　'+String(n+1).padStart(2,'0')+' OF 12';$('level-title').textContent=level.name;
  $('elapsed').textContent='';showStatus('两名玩家 · 独立视角');
  overlay.innerHTML='<div class="story"><small>行动简报</small><h3>'+level.name+'</h3><p>'+level.story+'</p><blockquote>'+level.quote+'</blockquote><div id="brief-seats"></div><button class="primary">'+(stage||mark?'从检查点继续':n===0?'登上交通艇':'进入关卡')+'　›</button></div>';
  seatPanel=TideCrewInput.panel($('brief-seats'),TideArrival.active(session)?session.arrival.radio:null);
  overlay.querySelector('.primary').onclick=()=>startPlaying(true);
  TideWindows.focus(overlay.querySelector('.primary'));view.draw(session,0,false);
}
function startPlaying(announce){
  seatPanel=null;clearInput();
  const connected=gamepads();assignPads(connected);
  for(let i=0;i<2;i++)gamepadDown[i]=!!connected.find(p=>p.index===padSlots[i])?.buttons[0]?.pressed;
  overlay.replaceChildren();$('split').hidden=false;mode='playing';$('pause').disabled=false;$('pause').textContent='暂停';TideWindows.focus(canvas);
  if(wantsAudio&&!sound.enabled)sound.enable(true).then(updateAudio);
  if(announce&&!TideGallery.active(session)&&!TideFenders.active(session)&&!session.swing?.voice&&!session.cistern?.voice)radio(TideFenders.active(session)?TideFenders.briefing:session.cable?TideCableQuay.briefing(session):session.landfall?(session.landfall.pinned?'沈遥：门销扣好了。来听船上的信号。':'沈遥：我在门后插销。你在这里握住链子。'):session.spec.radio,6);
  TideHud.update(session,padSlots);redraw=0;
}
function finishLevel(g){
  $('pause').disabled=true;clearInput();sound.stopScene();window.speechSynthesis?.cancel();
  if(g.survey?.ack){
    const readings=TideGallery.validTicket(g.survey.readings);
    if(readings){tideTicket=readings;try{localStorage.setItem('tide-survey-ticket',JSON.stringify(readings));}catch{}}
  }
  if(g.fog?.seen){try{localStorage.setItem('tide-foghorn-spacing',JSON.stringify(g.fog.gaps));}catch{}}
  progress=Math.max(progress,index+1);
  if(resume?.index===index)resume=null;
  try{
    localStorage.setItem('tide-progress',String(progress));
    if(!resume)localStorage.removeItem('tide-3d-checkpoint');
  }catch{}
  campaign();
  if(view.cinema.begin('chapter-end')){
    mode='cinema';$('split').hidden=true;$('film').hidden=false;TideWindows.focus($('skip'));
    showStatus('无线电回话');$('subtitle').textContent='';drawFilm(0);return;
  }
  showDebrief(g);
}
function drawFilm(dt){
  const film=view.cinema, before=film.time;
  if(index===4&&sound.enabled){
    const recordingTime=sound.tape?.filmTime(film.time);
    if(recordingTime!=null)dt=Math.max(0,recordingTime-film.time);
  }
  if(!film.step(dt)){showDebrief(session);return;}
  if(index===11 && before<5.2 && film.time>=5.2)sound.cue('ending');
  if(index===6&&sound.enabled)sound.receiver?.update({swing:TideSwing.film(film.time)});
  if(index===3&&sound.enabled)sound.receiver?.update({cistern:TideCistern.film(film.time)});
  if(index===5&&sound.enabled)sound.receiver?.update({glass:TideGlass.film(film.time)});
  view.draw(session,dt,false);
  $('film').classList.toggle('two-shots',!film.shared);
  const line=film.subtitle();
  if($('subtitle').textContent!==line){
    $('subtitle').textContent=line;
    if(index!==3&&index!==4&&index!==5&&index!==6&&voice&&sound.enabled&&line) say(line.split('　').at(-1));
  }
}
function showDebrief(g){
  sound.tape?.stop();sound.receiver?.stop();mode='won';$('film').hidden=true;$('split').hidden=true;
  const final=index===11;showStatus(final?'救援完成':'已保存章节进度');
  const coda='天亮后，两人把旧报告和自己的更正发给港口、渡轮与事故家属。阿棠寄来十秒钟的声音：绳子绷紧，杯盖落地，有人笑。沈遥在新带盒上写下了「北岬，第二盘」。';
  overlay.innerHTML='<div class="story"><small>无线电回话</small><h3>'+(final?'天亮之后':'行动完成')+'</h3><p>'+levels[index].after+'</p>'+(final?'<p>'+coda+'</p>':'')+'<p class="hint">用时 '+timeLabel(g.time)+'　·　安全索回收 '+g.setbacks+' 次</p><button class="primary">'+(final?'返回行动档案':'前往下一关')+'　›</button></div>';
  overlay.querySelector('button').onclick=()=>final?game.close():openLevel(index+1);
  if(final){
    const reply=document.createElement('button');reply.className='secondary';reply.textContent='打开顾岚的回件';
    reply.onclick=()=>openFiling(false);overlay.querySelector('.story').append(reply);
  }
  TideWindows.focus(overlay.querySelector('button'));say(levels[index].after);
}
let filing=null;
function openFiling(fromArchive=false){
  if(fromArchive){openLevel(11);if(mode==='error')return;}
  clearInput();sound.stopScene();window.speechSynthesis?.cancel();
  mode='receipt';$('split').hidden=true;$('film').hidden=true;$('pause').disabled=true;
  overlay.replaceChildren();
  const book=view.cinema.openReceipt(),panel=$('filing');
  try{if(localStorage.getItem('tide-gu-lan-filed')==='1')book.restore();}catch{}
  const reply=new Audio('assets/gu-lan-reply.mp3');reply.volume=.79;
  panel.hidden=false;
  panel.innerHTML='<div class="file-exit"><button data-act="close">合上档案　Esc</button></div>'+
    '<div class="file-side"><small>林澈　／　见证位置</small><p id="bay-label"></p><div><button data-act="left" aria-label="上一栏">‹ A</button><button data-act="right" aria-label="下一栏">D ›</button><button data-act="clip"></button></div></div>'+
    '<div class="file-side"><small>沈遥　／　顾岚的回件</small><p>“'+TideReceipt.testimony+'”</p><div><button data-act="listen">重听留言</button><button data-act="file">附入原话　Enter</button></div></div><p id="file-note" role="status"></p>';
  filing={book,reply,fromArchive,down:new Set()};
  // Ignore the press that opened the archive until each pad releases it.
  filing.down=receiptButtons(gamepads());
  panel.onclick=e=>{const a=e.target.closest('button')?.dataset.act;if(a)fileAction(a);};
  fileFeedback();TideWindows.focus(canvas);showStatus('天亮之后　／　收件人的回话');
  if(wantsAudio){sound.enable(true).then(updateAudio);reply.play().catch(()=>{});}
  view.draw(session,0,false);
}
function fileFeedback(){
  const s=filing.book.state,panel=$('filing');
  $('bay-label').textContent=TideReceipt.bays[s.bay]+(s.held?'　·　签页已夹住':'　·　移动签页到她当时站的位置');
  const pad=padSlots[0]!==null;
  panel.querySelector('[data-act=clip]').textContent=(s.held?'松夹':'扣夹')+(pad?'　RT':'　E');
  panel.querySelector('[data-act=left]').textContent=pad?'◂':'‹ A';panel.querySelector('[data-act=right]').textContent=pad?'▸':'D ›';
  panel.querySelector('[data-act=file]').textContent='附入原话　'+(padSlots[1]!==null?'RT':'Enter');
  for(const a of ['left','right'])panel.querySelector('[data-act='+a+']').disabled=s.held;
  for(const a of ['file','clip'])panel.querySelector('[data-act='+a+']').disabled=s.filed;
  $('file-note').textContent=s.filed?'后甲板　／　顾岚的原话已随更正稿归档。':s.pending===1?'沈遥：“纸还在动。把你这边的夹子扣上。”':s.pending===2?'沈遥：“她说自己当时站在哪儿？把夹子松开，再看一眼。”':'';
}
function fileAction(action){
  if(!filing)return;
  const {book,reply,fromArchive}=filing;
  if(action==='close'){
    closeFiling();if(fromArchive){game.close();return;}showDebrief(session);return;
  }
  if(action==='listen'){
    if(!wantsAudio){wantsAudio=true;try{localStorage.setItem('tide-audio','on');}catch{}sound.enable(true).then(updateAudio);}
    reply.currentTime=0;reply.play().catch(()=>{});return;
  }
  if(action==='clip')book.clip();
  else if(action==='file'){
    book.file();
    if(book.state.filed)try{localStorage.setItem('tide-gu-lan-filed','1');}catch{}
  }
  else book.change(action==='left'?-1:1);
  sound.cue(book.state.filed?'ending':'radio',action==='file'?1:0);
  fileFeedback();
}
function closeFiling(){
  if(!filing)return;
  filing.reply.pause();filing=null;view.cinema.skip();$('filing').hidden=true;
  $('filing').replaceChildren();$('filing').onclick=null;
}
function receiptButtons(pads){
  const held=new Set();
  assignPads(pads);
  for(const p of pads){
    const side=padSlots.indexOf(p.index);if(side<0)continue;
    if(p.buttons[1]?.pressed)held.add('close');
    if(side===0){
      if(p.buttons[14]?.pressed||p.axes[0]<-.55)held.add('left');
      if(p.buttons[15]?.pressed||p.axes[0]>.55)held.add('right');
      if(p.buttons[7]?.pressed||p.buttons[0]?.pressed)held.add('clip');
    }else{
      if(p.buttons[0]?.pressed||p.buttons[7]?.pressed)held.add('file');
      if(p.buttons[4]?.pressed)held.add('listen');
    }
  }return held;
}
function drawFiling(dt,pads){
  const oldSlots=padSlots.slice(),down=receiptButtons(pads),prev=filing.down;filing.down=down;
  if(oldSlots.some((id,i)=>id!==padSlots[i]))fileFeedback();
  for(const action of down)if(!prev.has(action))fileAction(action);
  if(filing)view.draw(session,dt,false);
}

function showStatus(text){if($('status').textContent!==text)$('status').textContent=text;}
function timeLabel(t){return Math.floor(t/60)+':'+String(Math.floor(t%60)).padStart(2,'0');}
function pause(){
  if(race){race.pause();return;}
  if(mode==='paused'){startPlaying(false);return;}
  if(mode!=='playing')return;
  mode='paused';clearInput();sound.stopScene();window.speechSynthesis?.cancel();
  $('pause').textContent='继续';
  const arrival=TideArrival.active(session),gallery=TideGallery.active(session);
  const hint=gallery?'西台与背风台各有一架手轮。握住操作键左右转轮，松手停车；另一人从黄边起跳。过白漆台后，两人沿梯进灯室。':arrival&&session.arrival.radio==='line'?'林澈移动缆圈，瞄准岸桩后投缆。沈遥收油回空挡，等船慢下来后按住操作键停机；林澈才拉得动缆绳。':arrival?'无线电的工作频道刻在舵座。掌舵的人按住操作键俯身，再左右擦开铜牌。船首的人听到频道后调台，按住发话键等自己说完。':'站到彩色光圈内，按住操作键使用设备。操作时可左右微调，按跳跃键确认。拖动各自的画面调整视角，双击可回正。';
  overlay.innerHTML='<div class="story"><h3>行动暂停</h3><p>'+levels[index].name+'　/　'+(gallery?(session.gallery.phase==='file'?'灯室潮尺原数联':'绕塔检修台'):arrival?'交通艇进港':TideFenders.active(session)?'护舷井登岸':session.cable?TideCableQuay.title(session):session.spec.title)+'</p><p class="hint">'+hint+'</p><div class="pause-options"><button id="unpause">继续行动</button><button id="retry">重试此段</button><button id="quit">返回档案</button><button id="voice"></button><button id="quality"></button></div></div>';
  seatPanel=TideCrewInput.panel(overlay.querySelector('.story'),arrival?session.arrival.radio:null);
  addJournal(overlay.querySelector('.story'),journal);
  $('unpause').onclick=()=>startPlaying(false);$('quit').onclick=()=>game.close();$('retry').onclick=()=>openLevel(index,session.stage,TideLantern.checkpoint(session)||TideGallery.checkpoint(session)||TideFenders.checkpoint(session)||TideSwing.checkpoint(session)||TideCistern.checkpoint(session)||TideGlass.checkpoint(session)||TideLastPass.checkpoint(session)||TideFogSignal.checkpoint(session)||TideSoundings.checkpoint(session)||TideRelay.checkpoint(session)||TideCableQuay.checkpoint(session)||TideLandfall.checkpoint(session)||TideSignal.checkpoint(session)||TideArchive.checkpoint(session));
  const update=()=>{$('voice').textContent='设备语音　'+(voice?'开':'关');$('quality').textContent='画质　'+(view.quality===1?'高':'流畅');};update();
  $('voice').onclick=()=>{voice=!voice;if(voice&&!sound.enabled)toggleAudio();update();};
  $('quality').onclick=()=>{view.quality=view.quality===1?.72:1;update();};TideWindows.focus($('unpause'));
}
function updateAudio(){
  $('field-audio').textContent=sound.enabled?'音效 开':'音效 关';$('sound').setAttribute('aria-pressed',String(sound.enabled));
}
async function toggleAudio(){
  wantsAudio=!wantsAudio;
  try{localStorage.setItem('tide-audio',wantsAudio?'on':'off');}catch{}
  if(filing&&!wantsAudio)filing.reply.pause();
  await sound.enable(wantsAudio);updateAudio();
  if(sound.enabled)sound.tone(440);else window.speechSynthesis?.cancel();
}
function recenter(i){view.yaws[i]=session.players[i].yaw;view.pitch[i]=0;}
const assignPads=TideCrewInput.assign;
function pollInputs(now,connected){
  assignPads(connected);
  return [0,1].map(i=>{
    const pad=connected.find(p=>p.index===padSlots[i]);
    const right=i?'ArrowRight':'KeyD',left=i?'ArrowLeft':'KeyA',back=i?'ArrowDown':'KeyS',front=i?'ArrowUp':'KeyW';
    const dead=v=>Math.abs(v||0)>.17?v:0;
    const down=!!pad?.buttons[0]?.pressed;
    const jump=jumps[i]||down&&!gamepadDown[i];gamepadDown[i]=down;
    const orbit=Number(keys.has(i?'Period':'KeyR'))-Number(keys.has(i?'Comma':'KeyQ'));
    view.yaws[i]-=orbit*now*2.30;
    const center=!!pad?.buttons[11]?.pressed;if(center&&!cameraButtons[i])recenter(i);cameraButtons[i]=center;
    if(pad){view.yaws[i]-=dead(pad.axes[2])*now*2.4;view.pitch[i]=TideTraversal.clamp(view.pitch[i]+dead(pad.axes[3])*now*2,-1.15,2.1);}
    const x=TideTraversal.clamp(Number(keys.has(right))-Number(keys.has(left))+dead(pad?.axes[0]),-1,1);
    const z=TideTraversal.clamp(Number(keys.has(back))-Number(keys.has(front))+dead(pad?.axes[1]),-1,1);
    const pointing=view.pointing.input(i,pointTaps[i]||keys.has(i?'Semicolon':'KeyF')||!!pad?.buttons[4]?.pressed,x,z,now,session.time);
    pointTaps[i]=false;
    const use=toolTaps[i]||keys.has(i?'Enter':'KeyE')||!!pad?.buttons[7]?.pressed;
    const cameraInput=orbit||center||keys.has(i?'Backslash':'KeyC')||dead(pad?.axes[2])||dead(pad?.axes[3])||TideWindows.dragging(i);
    view.pointing.request(i,keys.has(i?'Quote':'KeyG')||!!pad?.buttons[5]?.pressed,Boolean(pointing||x||z||use||jump||cameraInput),!!pad);
    return {x:pointing?0:x,z:pointing?0:z,use,jumpHeld:(i?keys.has('Slash')||keys.has('ShiftRight'):keys.has('Space'))||down,jump};
  });
}
function padMenus(pads){
  const pressed=new Set();
  for(const pad of pads){
    for(const n of [0,1,9,12,13,14,15])if(pad.buttons[n]?.pressed)pressed.add(n);
  }
  const tapped=n=>pressed.has(n)&&!menuPadState.has(n);
  const back=tapped(1),start=tapped(9),accept=tapped(0);
  const direction=tapped(13)||tapped(15)?1:tapped(12)||tapped(14)?-1:0;
  menuPadState=pressed;
  if(start&&game.open&&(mode==='playing'||mode==='paused')){pause();return;}
  if(game.open&&mode==='playing')return;
  if(back){
    if(info.open)info.close();
    else if(mode==='paused')startPlaying(false);
    else if(mode==='cinema')$('skip').click();
    else if(game.open)game.close();
    return;
  }
  if(!direction&&!accept&&!start)return;
  const root=game.open?game:info.open?info:document;
  const choices=[...root.querySelectorAll('button:not(:disabled),a[href]')].filter(n=>n.getClientRects().length);
  const selected=choices.indexOf(TideWindows.active());
  if(direction&&choices.length){TideWindows.focus(choices[(Math.max(selected,0)+direction+choices.length)%choices.length]);return;}
  const fallback=game.open?(mode==='cinema'?$('skip'):(overlay.querySelector('.primary')||overlay.querySelector('button'))):info.open?choices[0]:$('start');
  (choices[selected]||fallback)?.click();
}
function frame(now){
  TideWindows.schedule(frame);
  if(!TideWindows.visible())return;
  const resized=TideWindows.needsDraw();
  const pads=gamepads();
  if(seatPanel&&seatPanel.box.isConnected)seatPanel.update(pads);
  if(mode==='regatta'&&race){if(resized)race.redraw();race.frame(now,pads);return;}
  if(mode==='regatta-loading')return;
  if(mode!=='receipt'&&(pads.length||menuPadState.size))padMenus(pads);
  if(!game.open||!session||!view||mode==='error')return;
  const dt=last?Math.min((now-last)/1000,.10):0;last=now;
  if(mode==='receipt'){drawFiling(dt,pads);return;}
  if(mode==='cinema'){drawFilm(dt);return;}
  if(mode!=='playing'){
    if(resized||mode==='story'&&(!redraw||now-redraw>450)){view.draw(session,0,mode==='paused');redraw=now;}
    return;
  }
  remainder+=dt;
  if(remainder>=1/60){
    const inputs=pollInputs(Math.floor(remainder*60)/60,pads);jumps.fill(false);toolTaps.fill(false);
    while(remainder>=1/60 && mode==='playing'){
      view.rememberPose(session);
      session.tick(1/60,inputs,TideGallery.active(session)?view.yaws.map((yaw,i)=>TideGallery.movementYaw(session,i,yaw)):view.yaws);remainder-=1/60;
      for(const input of inputs)input.jump=false;
    }
  }
  if(mode!=='playing')return;
  if(session.archive?.memory?.poolRequested){session.archive.memory.poolRequested=false;enterRegatta(true);return;}
  view.draw(session,dt,true,remainder*60);
  if(sound.enabled){sound.scene?.update(session,dt);sound.tape?.update(session);sound.receiver?.update(session);}
  if(!redraw||now-redraw>55){
    TideHud.update(session,padSlots);
    showStatus((TideGallery.active(session)&&(session.gallery.subtitle||(session.noticeUntil>session.time&&session.notice.startsWith('安全索')?session.notice:session.gallery.phase==='file'?'灯室　／　潮尺原数联':'塔外廊　／　绕塔检修台')))||(TideArrival.active(session)&&(session.arrival.caption||'北岬交通艇　／　进港靠泊'))||(session.stage===0&&session.fenders?.subtitle)||(session.archive?.memory?.voice&&TideTinLines[session.archive.memory.voice].line)||(session.stage===0&&session.signal?.caption)||(session.stage>0&&session.signal?.voice&&TideTransitSpeech[session.signal.voice].line)||session.swing?.subtitle||session.cistern?.subtitle||session.glass?.subtitle||(!session.lastPass?.occupied&&session.lastPass?.subtitle)||session.pilotHorn?.subtitle||session.fog?.subtitle||(session.fog?.haul?'雾号所　／　轮坑接应':'')||session.survey?.subtitle||session.relay?.subtitle||session.cable?.subtitle||session.cable?.warp.subtitle||(session.noticeUntil>session.time?session.notice.replace(/\n/g,'　'):(TideFenders.active(session)?'护舷井登岸':session.cable?TideCableQuay.title(session):session.landfall?'防潮门值班间':session.spec.title)+'　·　靠近角色颜色的目标'));
    $('elapsed').textContent=timeLabel(session.time)+'　/　'+(session.stage+1)+' of 3';
    redraw=now;
  }
}
TideWindows.schedule(frame);

$('start').onclick=()=>openLevel(progress===12?0:progress,resume?.index===progress?resume.stage:0,resume?.index===progress?storedMark(resume):null);
$('skip').onclick=()=>{if(mode==='cinema'){view.cinema.skip();showDebrief(session);}};
$('pause').onclick=pause;$('sound').onclick=$('field-audio').onclick=toggleAudio;
$('expand').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else if(game.requestFullscreen)await game.requestFullscreen();}catch{showStatus('当前窗口已使用可用的最大画面');}};
$('brief').onclick=()=>{showInfo('<h2>北岬灯塔 · 紧急任务</h2><p>海雁号失去动力。机修员林澈和信号员沈遥必须在潮水吞没北礁前恢复电台，找出灯塔旧档案里的误判，重新校准光束。</p><p>十二关贯穿四幕。两人各自操作一名角色，共用同一个三维世界。</p><p><a href="story.html" target="_blank" rel="noopener">阅读原作调研、原创故事与十二关设计（含剧透）</a></p>');addJournal($('info-content'),levels.slice(0,progress).map((l,i)=>'第 '+(i+1)+' 关　'+l.name+'　'+l.after));};
$('help').onclick=()=>showInfo('<h2>双人操作指南</h2><p>林澈用 WASD 移动、空格跳跃，按住 E 操作。沈遥用方向键移动、斜杠 / 或右 Shift 跳跃，按住 Enter 操作。轻点跳跃可以越过短阶，按住则跳得更高。</p><p>林澈用 Q / R 转镜头，C 回到人物身后。沈遥用逗号 / 句号转镜头，反斜杠回正。两人可以同时转动各自的镜头。</p><p>要给同伴指路，林澈按住 F，沈遥按住分号，手柄按住 LB。用移动键或左摇杆瞄准实物，松开即可。也可以在自己的半屏右击。标记会跟着甲板或船移动。自由行动时站稳，林澈按住 G，沈遥按住单引号键，手柄按住 RB，看向同伴刚指出的实物。看清后对方会收到回应。松开回到原视角。</p><p>跟随各自画面内的设备标记。在光圈里按住操作键，左右键调节仪器，跳跃键确认读数或发送信号。站在移动甲板上会随甲板运动，可从边缘跃向对岸。</p><p>点右上角「双窗口」，可把沈遥的画面拖到另一块显示器。关掉副窗口或点「合回同屏」即可接着玩。在任一窗口按键均可控制两人。拖动自己的画面可转镜头，双击回正。标准手柄使用左摇杆移动、A 跳跃、RT 操作、右摇杆转动视角、按下回到身后。轻推摇杆，行动简报与暂停菜单会亮起对应角色。只有一只手柄时可把它交给任意一边，两只手柄也可互换。方向键选菜单，A 确认，B 返回，Start 或 Esc 暂停，章节与段落检查点保存在此浏览器。</p>');
const moveCodes=new Set(['KeyW','KeyA','KeyS','KeyD','KeyE','Space','ArrowUp','ArrowLeft','ArrowDown','ArrowRight','Enter','Slash','ShiftRight','KeyQ','KeyR','KeyC','Comma','Period','Backslash','KeyF','Semicolon','KeyG','Quote']);
function keyDown(e){
  if(!game.open)return;
  if(mode==='paused'||mode==='story'||mode==='regatta')TideCrewInput.key(e.code,true);
  if(race){race.key(e);return;}
  if(mode==='receipt'){
    const action={KeyA:'left',KeyD:'right',KeyE:'clip',Enter:'file',Escape:'close'}[e.code];
    if(action&&!(e.code==='Enter'&&e.target.closest('button'))){e.preventDefault();if(!e.repeat)fileAction(action);}
    return;
  }
  if(e.code==='Escape'&&(mode==='playing'||mode==='paused')){e.preventDefault();if(!e.repeat)pause();return;}
  if(mode!=='playing'||!moveCodes.has(e.code))return;
  e.preventDefault();keys.add(e.code);
  if(!e.repeat&&(e.code==='KeyF'||e.code==='Semicolon'))pointTaps[e.code==='KeyF'?0:1]=true;
  if(!e.repeat&&(e.code==='KeyC'||e.code==='Backslash'))recenter(e.code==='KeyC'?0:1);
  if(!e.repeat&&e.code==='KeyE'&&TideArrival.active(session))toolTaps[0]=true;
  if(!e.repeat&&session?.cable&&((session.stage===0&&e.code==='KeyE')||
    (session.stage===2&&session.cable.patched>=0&&!session.cable.backTest&&e.code==='Enter')))toolTaps[e.code==='KeyE'?0:1]=true;
  if(!e.repeat && ['Space','Slash','ShiftRight'].includes(e.code))jumps[e.code==='Space'?0:1]=true;
}
function keyUp(e){TideCrewInput.key(e.code,false);keys.delete(e.code);race?.up(e.code);}
document.addEventListener('keydown',keyDown);document.addEventListener('keyup',keyUp);
TideWindows.bind({
  down:keyDown,up:keyUp,
  orbit(i,dx,dy){if(!view||mode!=='playing')return;view.yaws[i]-=dx*.005;view.pitch[i]=Math.max(-1.15,Math.min(2.1,view.pitch[i]+dy*.008));},
  center(i){if(view&&mode==='playing')recenter(i);},
  point(i,x,y){if(mode!=='playing')return false;view.pointing.place(i,x,y,session.time);return true;},
  release(){clearInput();race?.release();},
  blur(){race?.pause(true);if(mode==='playing')pause();else clearInput();},
  hidden(){race?.pause(true);filing?.reply.pause();if(mode==='playing')pause();
    if(mode==='cinema'){sound.tape?.stop();sound.receiver?.stop();}clearInput();}
});
game.addEventListener('close',()=>{if(!game.open){TideWindows.close();seatPanel=null;raceEntry++;race?.dispose();race=null;closeFiling();mode='menu';clearInput();sound.stopScene();window.speechSynthesis?.cancel();view?.free();session=null;}});
game.addEventListener('cancel',e=>{
  if(race){e.preventDefault();race.pause();return;}
  if(mode==='cinema'){e.preventDefault();$('skip').click();}
  else if(mode==='playing'||mode==='paused'){e.preventDefault();pause();}
});
canvas.tabIndex=-1;
$('field-audio').textContent=wantsAudio?'音效 开':'音效 关';
$('sound').setAttribute('aria-pressed',String(wantsAudio));
campaign();

$('regatta-open').onclick=()=>enterRegatta(false);
if(new URLSearchParams(location.search).get('play')==='regatta')enterRegatta(false);
