// The crew member's signed statement is filed from two sides of the same desk.
const TideReceipt=(()=>{
  const bays=['驾驶台','机房','后甲板'];
  const testimony='十三年前，我站在后甲板。灯亮，我看得见。船头往哪边转，我从这儿看不见。';
  function create(desk,kit){
    const {group,box,disc,material,label,ring,rod}=kit;
    const folder=group(desk,0,.023,.13);
    folder.visible=false;
    const leather=material(0x4b5b50,.06,.87),brass=material(0xa28454,.73,.32);
    const card=material(0xd6c8a5,.01,.90),dark=material(0x41423a,.48,.54);
    box(folder,-.35,.014,0,.66,.026,.61,leather);
    box(folder,.35,.017,0,.68,.026,.61,leather);
    box(folder,0,.023,0,.027,.019,.59,dark);
    for(const side of [-1,1]){
      for(let i=0;i<4;i++)box(folder,side*.35,.032+i*.003,-i*.001,.625,.003,.563,card);
    }
    const spine=material(0x928675,.83,.35);
    box(folder,0,.043,0,.055,.012,.494,spine);
    for(const z of [-.205,.205]){
      const loop=ring(folder,0,.065,z,.036,.0043,spine);loop.scale.y*=.78;
      for(const x of [-.032,.032])disc(folder,x,.049,z,.010,.003,dark);
      disc(folder,0,.051,z*.80,.006,.004,brass);
    }
    function page(ctx,w,h){
      ctx.fillStyle='#e5d7b6';ctx.fillRect(0,0,w,h);
      let seed=93501;
      for(let j=0;j<4800;j++){
        seed=(Math.imul(seed,1664525)+1013904223)>>>0;
        const x=seed%w;
        seed=(Math.imul(seed,1664525)+1013904223)>>>0;
        ctx.fillStyle=j%3?'#6d592e0e':'#fff7db50';ctx.fillRect(x,seed%h,1+(seed%5),1);
      }
      const edge=ctx.createRadialGradient(w*.48,h*.45,w*.17,w*.43,h*.44,w*.71);
      edge.addColorStop(0,'rgba(255,252,228,.12)');edge.addColorStop(.73,'rgba(151,133,86,.035)');edge.addColorStop(1,'rgba(88,68,34,.35)');
      ctx.fillStyle=edge;ctx.fillRect(0,0,w,h);
      for(let n=0;n<38;n++){const x=(n*141.41)%w,y=(n*79.63)%h;
        ctx.strokeStyle=n%3?'rgba(113,92,60,.09)':'rgba(255,255,243,.32)';ctx.lineWidth=.6;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+8+n%17,y+.7);ctx.stroke();}
      ctx.strokeStyle='#778477';ctx.lineWidth=2;ctx.strokeRect(12,12,w-24,h-24);
    }
    function rule(ctx,y,w){
      ctx.strokeStyle='#92927e';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(29,y);ctx.lineTo(w-29,y);ctx.stroke();
    }
    label(folder,-.35,.047,0,.615,.552,(c,w,h)=>{
      page(c,w,h);c.fillStyle='#2d4945';c.font='bold 25px serif';c.fillText('北岬港　／　见证位置',29,54);rule(c,70,w);
      bays.forEach((name,i)=>{const x=w*(.19+i*.31);c.strokeStyle='#7c8472';c.strokeRect(x-60,111,120,h-166);
        c.textAlign='center';c.fillStyle='#354841';c.font='24px serif';c.fillText(name,x,151);
        c.font='15px monospace';c.fillText('0'+(i+1),x,h-76);});
      c.textAlign='left';c.font='16px serif';c.fillText('目击者签页　·　按当时所在位置归入',29,h-22);
    });
    label(folder,.35,.048,0,.615,.552,(c,w,h)=>{
      page(c,w,h);c.fillStyle='#354b49';c.font='bold 27px serif';c.fillText('北岬站转　　顾岚亲述',29,56);rule(c,73,w);
      c.fillStyle='#494942';c.font='24px "Kaiti SC",serif';
      ['那天我站在后甲板。','灯亮，我看得见。','船头往哪边转，','我从这儿看不见。'].forEach((line,i)=>{const y=119+i*48;c.fillText(line,39,y);rule(c,y+12,w);});
      c.textAlign='right';c.fillText('顾 岚',w-43,h-44);
    });
    const tab=group(folder,0,.057,.018);
    box(tab,0,.004,0,.136,.008,.189,material(0xcabea0,.02,.77));
    label(tab,0,.009,0,.131,.18,(c,w,h)=>{page(c,w,h);c.fillStyle='#353f42';c.font='bold 110px serif';c.textAlign='center';c.fillText('顾岚',w/2,h*.57);});
    const clamp=group(tab,0,.029,-.071);
    box(clamp,0,0,0,.130,.022,.028,brass);
    for(const x of [-.047,.047])disc(clamp,x,.013,0,.008,.005,dark);
    const stamp=group(folder,.71,.078,.11);
    const walnut=material(0x68422c,.06,.48),pad=material(0x603831,.03,.82);
    box(stamp,0,.025,0,.188,.042,.078,walnut);box(stamp,0,.003,0,.177,.006,.070,pad);
    disc(stamp,0,.057,0,.027,.030,brass);disc(stamp,0,.098,0,.023,.064,walnut);
    disc(stamp,0,.142,0,.040,.026,walnut);
    const wire=material(0x79766a,.74,.44);
    for(const x of [-.048,.048])rod(clamp,[x,.003,.01],[x,.015,.039],.0021,wire);
    rod(clamp,[-.048,.015,.039],[.048,.015,.039],.0021,wire);
    const received=label(folder,.49,.05,.134,.17,.064,(c,w,h)=>{
      c.strokeStyle=c.fillStyle='#984f37';c.lineWidth=12;c.strokeRect(8,8,w-16,h-16);
      c.font='bold 82px serif';c.textAlign='center';c.fillText('原话附入',w/2,h*.67);
    });
    received.material.transparent=true;received.material.depthWrite=false;received.visible=false;
    const state={bay:0,held:false,filed:false,pending:0,stamp:0};
    let x=-.54;
    function reset(){Object.assign(state,{bay:0,held:false,filed:false,pending:0,stamp:0});x=-.54;update(0);}
    function change(direction){
      if(state.held||state.filed)return;
      state.bay=Math.max(0,Math.min(2,state.bay+direction));state.pending=0;
    }
    function clip(){
      if(state.filed)return;
      state.held=!state.held;state.pending=0;
      if(state.held)x=-.54+.19*state.bay;
    }
    function restore(){Object.assign(state,{bay:2,held:true,filed:true,pending:0,stamp:1});x=-.16;update(0);}
    function file(){
      if(state.filed)return;
      if(!state.held){state.pending=1;return;}
      if(state.bay!==2){state.pending=2;return;}
      state.filed=true;state.pending=0;
    }
    function update(dt){
      const target=-.54+.19*state.bay;
      x+=(target-x)*(1-Math.exp(-dt*15));
      tab.position.x=x;clamp.rotation.x=state.held?0:-.56;
      if(state.filed)state.stamp=Math.min(1,state.stamp+dt*1.25);
      const reach=Math.sin(Math.PI*state.stamp)**2;
      stamp.position.set(.705-.215*reach,.07+.12*Math.sin(2*Math.PI*state.stamp)**2-.018*reach,.11+.024*reach);
      stamp.rotation.z=-.12*(1-reach);
      received.visible=state.stamp>=.5;
    }
    return {folder,state,reset,restore,change,clip,file,update};
  }
  return {create,bays,testimony};
})();
