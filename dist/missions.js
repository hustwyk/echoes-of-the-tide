// Each step has a physical destination for each player. Negative Z leads inland.
const TideMissions = (() => {
  const step = (type, title, tools, radio, options={}) => ({type,title,tools,radio,...options});
  const chapters = [
    [
      step('ride','低台试吊',['winch','breaker'],'沈遥：吊篮到底了。我先过去，把那架梯子踢下来。',{driver:0,length:17,mode:'basket',rise:1.4}),
      step('ride','横渡浪沟',['winch','breaker'],'林澈：篮底会摆。看到对面的灯再跳。',{driver:0,length:23,mode:'basket',rise:1.8,swing:1.15}),
      step('ride','放梯接人',['ladder','winch'],'沈遥：这次我拉。你看到我再松手。',{driver:1,length:18,mode:'basket',rise:.65})
    ],
    [
      step('cable','岸上试灯',['key','post'],'林澈：铜牌上两道刻痕，一短一长。我敲给你。'),
      step('cable','浅水支路',['saddle','drum'],'沈遥：驾驶台又在呼叫。你走下面，我上去看着线。'),
      step('cable','吊臂背面的接线柱',['lamp','window'],'林澈：我们提上来的线头刻着缺月。去吊臂背后找另一半。')
    ],
    [
      step('power','启动飞轮',['wheel','breaker'],'林澈：我摇飞轮。两根针搭上，你接离合。',{value:.35}),
      step('power','向船上报灯',['wheel','radio'],'沈遥：我先找旧标和船，你帮我核对。',{value:.71,rough:1}),
      step('blackout','遮光与叫停',['brake','radio'],'沈遥：她真往那边转了！我提梯，你上去遮灯。')
    ],
    [
      step('cistern','取杯与下水',['pump','rake'],'沈遥：泵在响。格栅上的杯子一动不动，得先把它捞起来。'),
      step('cistern','低管与高窗',['pump','line'],'沈遥：我在架头。先给我留一人高的净空。'),
      step('cistern','旁通井与封存盒',['cabinet','bypass'],'林澈：上头是旁通阀，我下去看井壁的刻线。')
    ],
    [
      step('tape','童年的错带',['tape','radio'],'磁带里的沈遥：猜一猜，这是什么声音？'),
      step('tape','两盘值班带',['tape','radio'],'沈遥：左架机房，右架电台。记录卡就夹在盒子里。'),
      step('tape','接回空白的十五秒',['tape','radio'],'沈遥：翻到这一面，轮到我先找她什么时候开口。')
    ],
    [
      step('paper','装订孔',['chart','chart'],'沈遥：压住纸角。看看孔打在什么地方。',{v:[.24,.68]}),
      step('paper','折痕与印章',['chart','chart'],'林澈：复印件在这里齐边，原稿还多出一截。',{v:[.58,.32]}),
      step('paper','换边检查',['chart','chart'],'沈遥：你来照，我去看你刚才指的压痕。',{v:[.76,.55],cross:true})
    ],
    [
      step('ride','吊桥制动',['brake','gauge'],'林澈：我坐制动。你在配重车上看桥鼻。到线了跟我说。',{driver:0,mode:'bridge',length:21,rise:1.0,swing:1.2}),
      step('ride','桥腹接力',['gauge','brake'],'沈遥：棘轮我接住了。带潮尺从下层走。',{driver:1,mode:'bridge',length:24,rise:-1.6,swing:1.55}),
      step('quiet','背风的吊篮',['tape','tape'],'林澈：这段没风。你还记得最后一道题吗？',{length:25})
    ],
    [
      step('relay','登桅接通岸船',['antenna','radio'],'沈遥：我收踏板。林澈，你上去看看夹座里要的是哪张底联。'),
      step('relay','把缺掉的字补齐',['antenna','radio'],'梁青：驾驶台听见了。报的时候慢一点，风比你响。'),
      step('relay','两个人的落款',['antenna','radio'],'林澈：我签我验过的那一项。沈遥，那张通报要你自己说。')
    ],
    [
      step('soundings','甲尺 · 追上海上来浪',['gauge','gauge'],'沈遥：你带上长尺，从西边阶梯下去。我先看外海那根铜标。'),
      step('soundings','乙尺 · 把同一道浪报回来',['gauge','gauge'],'林澈：外边还有一只尺座。这次浪先到我这边，你听我报。'),
      step('soundings','船尾校核 · 把水深压到图上',['chart','radio'],'梁青：驾驶台这边两条槽像是一样深。阿棠，你到后面再看一眼。')
    ],
    [
      step('optic','合并双影',['wheel','lens'],'沈遥：我在外环，看得见你调出来的重影。',{v:[.31,.68]}),
      step('optic','侧镜调焦',['lens','wheel'],'林澈：扶住镜框，我来推车。等辅镜上座，我替你去窗边看。',{v:[.71,.27],cross:true}),
      step('optic','锁住侧槽光带',['wheel','lens'],'梁青：现在只剩一道光。再往安全带里收一点。',{v:[.56,.79],rough:1})
    ],
    [
      step('diaphone','轮缘对印与空载演练',['wheel','horn'],'林澈：把甲轮接到廊边，我带方头钥过去。'),
      step('diaphone','给回声留出间隔',['wheel','horn'],'沈遥：我拿到了两张船上回条。先比一比，哪儿少了一响。'),
      step('diaphone','雨窗目视复核',['wheel','horn'],'梁青：这次把风也算进去。三声过后，我自己抬头。')
    ],
    [
      step('optic','守住安全光带',['wheel','lens'],'梁青：海雁就要遮住基准了，看我的船首。',{v:[.65,.38],rough:2}),
      step('rhythm','正式转向提示',['wheel','horn'],'沈遥：看见安全带。给我预备灯。',{period:6.3,irregular:true}),
      step('release','把频道留给船长',['wheel','radio'],'阿棠：等一拍。我还看不见那根桩。')
    ]
  ];

  const names={winch:'吊篮绞盘',breaker:'接线闸',radio:'无线电台',wheel:'机械手轮',brake:'制动闸',pump:'水泵阀',tape:'磁带轮',chart:'透光台',antenna:'天线手轮',gauge:'观察尺',lens:'光学校准台',horn:'雾号',ladder:'折梯锁扣'};
  return {chapters,names};
})();
