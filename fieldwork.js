// Close-range work happens on the working floor and the observation gallery.
// Each instruction names an action that changes the other player's apparatus.
const TideFieldWork=(()=>{
  const clamp=TideTraversal.clamp;
  const designs={
    paper:{pair:['验收联','潮图底片'],first:['揭起纸角，让打孔透光','从灯箱另一侧寻找对应印痕'],response:'底片已固定，可以去透光台'},
    radio:{pair:['桅杆转台','发报稿夹'],first:['锁住桅杆底座','从夹页里抽出当前报文'],response:'接上桅杆馈线'},
    tide:{pair:['下标尺固定脚','上标尺基准'],first:['固定贴近水面的尺脚','对照上端的读数'],response:'同一把标尺已经归零'},
    optic:{pair:['凸轮定位销','检视镜'],first:['扣住凸轮上的基准孔','透过检视镜找重影'],response:'已取得侧镜基准'}
  };
  function build(world,index) {
    const decks=world.floors;
    for(let k=0;k<world.sections.length;k++){
      const sec=world.sections[k],s=sec.spec,design=designs[s.type];
      if(!design)continue;
      const sites=[];
      for(let i=0;i<2;i++){
        const lane=sec.paths[i],anchor=lane[Math.floor(lane.length*.5)];
        const sign=i?1:-1;
        const tiers=(s.type==='radio'&&i===0)||(s.type==='tide'&&i===1)||(s.type==='optic'&&i===1)?5:3;
        const rise=s.type==='tide'&&i===0?-.38:.35;
        const length=s.type==='paper'?1.3:1.55;
        for(let j=1;j<=tiers;j++)decks.push({x:anchor.x+sign*j*length,y:anchor.y+j*rise,z:anchor.z,w:length+.05,d:2.2,kind:world.style,active:true});
        const floor={x:anchor.x+sign*(tiers*length+2.1),y:anchor.y+tiers*rise,z:anchor.z,w:4.45,d:4.4,kind:world.style,active:true};
        decks.push(floor);
        sites.push({...floor,kind:s.tools[i],label:design.pair[i],approach:anchor,sign});
      }
      sec.field={design,sites};
    }
  }
  function reset(g){
    g.field={done:!g.section.field,values:[.5,.5],hold:0,latched:[false,false],phase:0,trained:false,active:[false,false]};
  }
  function interact(g,inputs,dt){
    const f=g.field,sc=g.section,job=sc.field;
    if(!job||f.done)return false;
    const s=sc.spec,step=g.stage;
    const use=job.sites.map((site,i)=>TideCoop.near(g.players[i],site)&&inputs[i].use);
    f.active=use;
    const tap=i=>use[i]&&inputs[i].jump;
    const goal=[.28+.16*step,.74-.13*step];
    const percent=v=>Math.round(v*100)+'%';
    for(let i=0;i<2;i++)if(use[i])f.values[i]=clamp(f.values[i]+inputs[i].x*dt*.44,0,1);
    let done=false;
    switch(s.type){
      case 'paper':{
        const level=f.values[0],lit=use[0]&&Math.abs(level-goal[0])<.10;
        g.set(0,'移动纸角，使斜光穿过装订孔',{vis:'chart',value:level,target:goal[0],band:.10,caption:lit?'透光孔已亮':'纸边与灯箱'});
        g.set(1,'看到印痕后按跳跃键固定底片',{vis:'chart',value:lit?.5:.18,target:.5,caption:lit?['两孔一线','折痕吻合','压痕已显'][step]:'纸面无清晰印痕'});
        done=lit&&tap(1);break;
      }
      case 'radio':{
        if(tap(0))f.latched[0]=true;
        const choice=Math.min(2,Math.floor(f.values[1]*3));
        g.set(0,'在桅座上按跳跃键插入定位销',{caption:f.latched[0]?'桅座已锁住':'锁紧馈线'});
        g.set(1,'翻找这一段要报的稿件，按跳跃键夹紧',{vis:'dial',value:f.values[1],caption:['呼号页','验收联','更正稿'][choice]+'　/　需要'+['呼号页','验收联','更正稿'][step]});
        if(tap(1)&&choice===step)f.latched[1]=true;
        done=f.latched.every(Boolean);break;
      }
      case 'tide':{
        const low=(g.time%4.8)/4.8;
        if(use[0]&&Math.abs(low-.74)<.15)f.latched[0]=true;
        g.set(0,'按住操作键，等浪退时把尺脚固定',{vis:'tide',value:low,target:.74,band:.15,caption:f.latched[0]?'尺脚已锁住':'干湿界线'});
        g.set(1,'看见固定信号后按跳跃键记下基准',{caption:f.latched[0]?'零点已固定':'等待下端锁定'});
        done=f.latched[0]&&tap(1);break;
      }
      case 'optic':{
        const observer=s.cross?0:1,operator=1-observer;
        const value=f.values[operator],aligned=Math.abs(value-goal[operator])<.085;
        g.set(operator,'转动凸轮定位销，听同伴报告偏差',{vis:'dial',value,caption:'机械行程 '+percent(value)});
        g.set(observer,'看见两线相合后按跳跃键确认',{vis:'optic',value:.5,peer:value,peerTarget:goal[operator],caption:'请同伴调至 '+percent(goal[operator])});
        done=use[operator]&&aligned&&tap(observer);break;
      }
    }
    if(done){
      f.done=true;g.sound(640,.18);g.alert(job.design.response+'　·　沿原路回主廊',3.5);
      // After an error on the main deck, the secured work is preserved.
      g.checkpoints=job.sites.slice();
    }
    return true;
  }
  return {build,reset,interact};
})();
