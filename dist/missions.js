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
      step('cable','岸上试灯',['breaker','radio'],'林澈：铜牌上刻的是试灯的节拍。',{code:0}),
      step('cable','浅水支路',['breaker','radio'],'阿棠：我在船尾。绿标在一道白浪后面。',{code:2,rough:1}),
      step('cable','吊臂背面的接线柱',['breaker','radio'],'沈遥：从吊臂背面绕过去，看另一根线。',{code:1,rough:2})
    ],
    [
      step('power','启动飞轮',['wheel','breaker'],'林澈：先稳住电压，你看岸外那片水。',{value:.35}),
      step('power','向船上报灯',['wheel','radio'],'沈遥：北线已恢复。',{value:.71,rough:1}),
      step('blackout','遮光与叫停',['brake','radio'],'梁青：收到，北线可以进入。\n沈遥：等等！船在向碎浪转！')
    ],
    [
      step('ride','降下浮架',['pump','breaker'],'林澈：浮架在高处，先把水排下去。',{driver:0,mode:'raft',length:16,rise:-1.55}),
      step('ride','反注水越窗',['pump','brake'],'沈遥：导索锁住了。让水把我送上窗台。',{driver:0,mode:'raft',length:18,rise:2.3}),
      step('ride','旁通管与柜顶',['tape','pump'],'沈遥：旁通管交给我。你去拿柜顶的带子。',{driver:1,mode:'raft',length:16,rise:-1.2})
    ],
    [
      step('tape','校准带速',['tape','radio'],'磁带里的沈遥：猜一猜，这是什么声音？',{v:[.26,.67],clip:'哐啷。哐、哐……另一轨空了十秒。'}),
      step('tape','寻找继电器触点',['tape','radio'],'林澈：听见咔的一响再锁轨。',{v:[.63,.33],clip:'值班员：灯机回转正常。'}),
      step('tape','接回空白的十五秒',['tape','radio'],'沈遥：别替她补那半句话。',{v:[.78,.46],clip:'测潮员：北线……还要复测。'})
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
      step('radio','呼叫海雁号',['antenna','radio'],'梁青：这里是海雁，请报呼号。',{v:[.29,.65],answers:['北岬','东堤','南港'],answer:0}),
      step('radio','发送灯机验收项',['antenna','radio'],'林澈：只验了灯机。那个“只”字，要发清楚。',{v:[.57,.35],answers:['北线可用','只验灯机','船位已定'],answer:1,rough:1}),
      step('radio','发送更正项',['antenna','radio'],'沈遥：把北线说成恢复的人是我。',{v:[.71,.42],answers:['可以进入','全线正常','今晚未测'],answer:2,rough:2})
    ],
    [
      step('tide','在同一道浪里读尺',['gauge','gauge'],'沈遥：我看上标尺。浪谷到了就告诉你。',{lead:1}),
      step('tide','复测另一侧水线',['gauge','gauge'],'林澈：这次我先读，你记远处的浪。',{lead:0,rough:2}),
      step('post','从船尾找断桩',['chart','gauge'],'阿棠：我能看到双环的断桩，浪一退它就露头。',{rough:1})
    ],
    [
      step('optic','合并双影',['wheel','lens'],'沈遥：我在外环，看得见你调出来的重影。',{v:[.31,.68]}),
      step('optic','侧镜调焦',['lens','wheel'],'林澈：换我从检视孔看。你来调焦。',{v:[.71,.27],cross:true}),
      step('optic','锁住侧槽光带',['wheel','lens'],'梁青：现在只剩一道光。再往安全带里收一点。',{v:[.56,.79],rough:1})
    ],
    [
      step('rhythm','空载演练',['wheel','horn'],'沈遥：预备灯一亮，我就敲。',{period:6.3}),
      step('rhythm','等待驾驶台复述',['wheel','horn'],'梁青：我只收到两声。再来一轮，把间隔拉开。',{period:6.9,rough:1}),
      step('rhythm','变速试灯',['wheel','horn'],'阿棠：船尾就位。驾驶台请独立确认。',{period:6.4,irregular:true})
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
