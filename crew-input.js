// The two keyboard layouts are fixed. A pad keeps its actor while another pad comes or goes.
const TideCrewInput=(()=>{
  const slots=[null,null],names=['林澈','沈遥'];
  let firstSide=0;
  try{firstSide=localStorage.getItem('tide-first-pad-side')==='1'?1:0;}catch{}
  function assign(pads){
    for(let i=0;i<2;i++)if(slots[i]!==null&&!pads.some(p=>p.index===slots[i]))slots[i]=null;
    for(const pad of pads){
      if(slots.includes(pad.index))continue;
      const side=slots[firstSide]===null?firstSide:1-firstSide;
      if(slots[side]===null)slots[side]=pad.index;
    }
  }
  function swap(pads){
    assign(pads);const first=pads.find(p=>slots.includes(p.index));if(!first)return;
    slots.reverse();firstSide=slots.indexOf(first.index);
    try{localStorage.setItem('tide-first-pad-side',String(firstSide));}catch{}
  }
  const layouts=[
    ['KeyW','KeyA','KeyS','KeyD'],['ArrowUp','ArrowLeft','ArrowDown','ArrowRight']
  ];
  const previewKeys=new Set();
  function key(code,held){if(held)previewKeys.add(code);else previewKeys.delete(code);}
  function panel(parent,boat=null,pool=false){
    const box=document.createElement('div');box.className='crew-inputs';box.setAttribute('aria-label','左右屏操作分配');
    const rows=names.map((name,i)=>{
      const row=document.createElement('div');row.className='seat'+(i?' right':'');
      const title=document.createElement('strong'),input=document.createElement('span'),hint=document.createElement('span');
      title.textContent=(i?'右屏　':'左屏　')+name;hint.className='seat-keys';row.append(title,input,hint);box.append(row);
      return {row,input,hint};
    });
    const button=document.createElement('button');button.type='button';button.className='swap-pads';box.append(button);parent.append(box);
    const label=(element,text)=>{if(element.textContent!==text)element.textContent=text;};
    function update(pads){
      assign(pads);
      for(let i=0;i<2;i++){
        const {row,input,hint}=rows[i],pad=pads.find(p=>p.index===slots[i]);
        const labelPad=pads.length===1?'手柄':'手柄 '+(pads.indexOf(pad)+1);
        label(input,(pad?labelPad:'键盘')+' · '+(i?'方向键':'WASD'));
        const kb=boat==='stern'?(i?'方向键送钩　/ 挑起　Enter 握杆':'E 收首缆　松开回缆'):boat==='line'?(i?'↑ ↓ 进退车　Enter 停机':'A D 瞄准　W S 仰角　按住 E 后摆，松手抛'):boat?(i?'↑ ↓ 进退车　Enter 查牌':'A / D 调台　E 发话'):pool?(i?'Enter 准备':'E 准备'):(i?'/ 跳跃　Enter 操作':'空格跳跃　E 操作');
        const gp=boat==='stern'?(i?'左摇杆送钩　A 挑起　RT 握杆':'RT 收首缆　松开回缆'):boat==='line'?(i?'左摇杆掌舵　RT 停机':'左摇杆瞄准 / 仰角　按住 RT 后摆，松手抛'):boat?(i?'左摇杆掌舵　RT 查牌':'左摇杆调台　RT 发话'):pool?'A 准备　左摇杆驾驶':'左摇杆移动　A 跳　RT 操作';
        label(hint,pad?gp:kb);
        const active=layouts[i].some(k=>previewKeys.has(k))||!!pad&&(pad.axes.some(v=>Math.abs(v)>.22)||pad.buttons.some(b=>b.pressed));
        row.classList.toggle('input-seen',active);
      }
      const count=slots.filter(n=>n!==null).length;
      button.hidden=!count;
      label(button,count===1?'将手柄交给'+names[slots[0]===null?0:1]:'交换两人的手柄');
    }
    button.onclick=()=>{const pads=gamepads();swap(pads);update(pads);};
    update(gamepads());return {box,update};
  }
  return {assign,swap,slots,panel,key,clear:()=>previewKeys.clear()};
})();
