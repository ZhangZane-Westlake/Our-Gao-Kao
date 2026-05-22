import type { AssetRequirement, SceneId, SpeakerId, StatKey, VisualNovelScene } from "./types";

export const speaker_labels: Record<SpeakerId, string> = {
  narrator: "旁白",
  teacher: "班主任",
  protagonist: "主角",
  deskmate: "同桌",
  friend_1: "朋友1",
  friend_2: "朋友2",
  mother: "母亲",
  father: "父亲",
  courier: "快递员"
};

export const stat_labels: Record<StatKey, string> = {
  mindset: "心态",
  pressure: "压力",
  strategy: "策略",
  stability: "稳定",
  stamina: "体力",
  support: "支持",
  confidence: "信心",
  growth: "成长"
};

export const scene_order: SceneId[] = [
  "act_01_oath",
  "act_02_mock_failure",
  "act_03_review_unlock",
  "act_04_friend_boundary",
  "act_05_family_talk",
  "act_06_progress",
  "act_07_low_point",
  "act_08_exam_day",
  "act_09_admission"
];

export const visual_novel_scenes: VisualNovelScene[] = [
  {
    id: "act_01_oath",
    act: 1,
    title: "百日誓师，游戏开始",
    subtitle: "清晨的操场上，倒计时牌像一声被写出来的心跳。",
    days_left: 100,
    status_text: "迷茫",
    background_key: "scene_oath_playground",
    character_keys: ["protagonist_uniform_bag", "teacher_playground"],
    real_text: ["距离高考还有100天", "百日誓师大会"],
    ui_text: ["高三副本开启", "剩余时间：100天", "当前状态：迷茫", "请选择你的初始路线"],
    narration:
      "红色横幅在风里轻轻晃。你跟着人群举起拳头，声音混在几百个同龄人的宣誓里，却总觉得自己的那一句慢了半拍。",
    dialogue: [
      { speaker: "teacher", text: "最后一百天，你们不只是为了一个分数，更是为了知道自己能走到哪里。" },
      { speaker: "teacher", text: "你的目标是什么？" },
      { speaker: "protagonist", text: "……" },
      { speaker: "narrator", text: "你没有立刻回答，只是望向操场边的倒计时牌。数字很大，大到像把未来也照亮了一点。" }
    ],
    choice_prompt: "请选择你的初始路线",
    choice_mode: "single",
    next_scene_id: "act_02_mock_failure",
    choices: [
      {
        id: "hot_blood",
        label: "热血冲刺",
        quote: "我要拼一次，看看自己能不能再往前走。",
        consequence: "你把迷茫暂时压进胸口，用更响的宣誓声盖住了不安。接下来几天，你会更容易进入冲刺状态，也更容易忽略疲惫。",
        effects: { mindset: 6, pressure: 6, stamina: -4, confidence: 4 },
        unlocks: ["热血开局"],
        recommended: false
      },
      {
        id: "steady_start",
        label: "稳扎稳打",
        quote: "我先把今天能做好的事做好。",
        consequence: "你没有给自己喊很大的口号，只在心里把今天的任务排成一小列。它们不耀眼，但看起来能一步一步走完。",
        effects: { stability: 8, pressure: -2, strategy: 4, mindset: 3 },
        unlocks: ["每日计划"],
        recommended: false
      },
      {
        id: "search_answer",
        label: "寻找答案",
        quote: "我还不知道答案，但我想认真找一找。",
        consequence: "你承认自己还不知道目标。奇怪的是，说出这件事以后，胸口反而松了一点。至少，从今天开始你不再假装已经懂了。",
        effects: { growth: 8, mindset: 5, pressure: -3, strategy: 3 },
        unlocks: ["认真走完这一百天"],
        recommended: true
      }
    ]
  },
  {
    id: "act_02_mock_failure",
    act: 2,
    title: "一模碰壁",
    subtitle: "成绩单很薄，落在手里却有重量。",
    days_left: 82,
    status_text: "受挫",
    background_key: "scene_mock_score_classroom",
    character_keys: [],
    real_text: ["一模成绩"],
    ui_text: ["事件触发：一模失利", "心态 -12", "压力 +15", "请选择应对方式"],
    narration:
      "你确实努力过。清晨背书、晚自习刷题、深夜台灯下揉眼睛，这些画面一格一格闪回。可成绩单上的排名没有替它们作证。",
    dialogue: [
      { speaker: "teacher", text: "成绩只是反馈，不是判决。" },
      { speaker: "deskmate", text: "你还继续这么学吗？" },
      { speaker: "protagonist", text: "……" },
      { speaker: "narrator", text: "你看着成绩单，手指把纸边攥出浅浅的折痕。失望没有砸下来，只是慢慢坐到了你旁边。" }
    ],
    choice_prompt: "请选择应对方式",
    choice_mode: "single",
    next_scene_id: "act_03_review_unlock",
    choices: [
      {
        id: "push_harder",
        label: "继续硬拼",
        quote: "可能是我还不够努力。",
        consequence: "你把原因先归到努力不够上。短期里，这会让你重新动起来；但如果方向没有改变，疲惫也会跟着一起累积。",
        effects: { pressure: 12, stamina: -10, mindset: -4, confidence: 2 },
        unlocks: ["硬拼惯性"],
        recommended: false
      },
      {
        id: "begin_review",
        label: "开始复盘",
        quote: "先看看我到底错在哪里。",
        consequence: "你没有急着把下一套卷子摊开，而是把错题按原因分成几类。分数仍然刺眼，但它开始变得可拆解。",
        effects: { strategy: 12, stability: 5, pressure: -4, growth: 5 },
        unlocks: ["错因意识"],
        recommended: true
      },
      {
        id: "talk_teacher",
        label: "找老师聊聊",
        quote: "我需要知道问题出在哪里。",
        consequence: "你第一次带着成绩单走进办公室。问出口以前很难，问出口以后，问题忽然不再只属于你一个人。",
        effects: { support: 8, strategy: 8, pressure: -6, mindset: 3 },
        unlocks: ["老师建议"],
        recommended: false
      }
    ]
  },
  {
    id: "act_03_review_unlock",
    act: 3,
    title: "策略调整，解锁复盘",
    subtitle: "努力开始有方向，是从承认错因的那一刻开始的。",
    days_left: 76,
    status_text: "调整",
    background_key: "scene_review_classroom",
    character_keys: ["protagonist_review_uniform", "teacher_classroom"],
    real_text: ["审题错误", "基础漏洞", "时间不够", "计算失误", "最后一百天复习计划"],
    ui_text: ["技能解锁：错题复盘 Lv.1", "策略 +15", "稳定 +8", "请选择复习路线"],
    narration:
      "课后教室比晚自习安静。你把一模试卷摊开，第一次没有急着订正答案，而是追问每一个红叉为什么会出现。",
    dialogue: [
      { speaker: "teacher", text: "不要只问自己有没有努力，也要问努力有没有方向。" },
      { speaker: "teacher", text: "接下来，你想怎么重新安排？" },
      { speaker: "protagonist", text: "我想先把错的原因找出来。" },
      { speaker: "narrator", text: "错题本上的四个分类像四盏小灯。它们照不亮全部未来，但足够照见下一步。" }
    ],
    choice_prompt: "请选择复习路线",
    choice_mode: "single",
    next_scene_id: "act_04_friend_boundary",
    choices: [
      {
        id: "mistake_review_route",
        label: "错题复盘路线",
        quote: "每天整理错因，把同类问题彻底解决。",
        consequence: "你给错题本留出固定时间。它不总是让人有成就感，却让你越来越少在同一个地方摔倒。",
        effects: { strategy: 15, stability: 8, pressure: -4, growth: 6 },
        unlocks: ["错题复盘 Lv.1"],
        recommended: true
      },
      {
        id: "foundation_route",
        label: "基础重建路线",
        quote: "先把最容易丢分的基础补回来。",
        consequence: "你把那些看起来不够高级的基础题重新捡起来。它们很朴素，却让卷面慢慢有了底。",
        effects: { stability: 12, strategy: 9, confidence: 4, pressure: -2 },
        unlocks: ["基础重建"],
        recommended: false
      },
      {
        id: "peer_route",
        label: "同伴学习路线",
        quote: "和同学互相讲题，一起把问题讲明白。",
        consequence: "你发现讲给别人听时，自己也会听见漏洞。朋友的进度不再只是压力，也能成为参照和支撑。",
        effects: { support: 8, strategy: 8, growth: 7, stamina: -3 },
        unlocks: ["同伴讲题"],
        recommended: false
      }
    ]
  },
  {
    id: "act_04_friend_boundary",
    act: 4,
    title: "友情与边界",
    subtitle: "真正的关系，不一定要求你把自己全部交出去。",
    days_left: 69,
    status_text: "疲惫",
    background_key: "scene_after_evening_school",
    character_keys: ["protagonist_bag_notebook", "friend_1_uniform", "friend_2_uniform"],
    real_text: ["晚自习结束"],
    ui_text: ["支线事件：朋友的邀请", "体力：偏低", "心态：偏低", "请选择你的回应"],
    narration:
      "晚自习结束，教学楼还亮着一半。你抱着错题本走出教室，肩膀酸得像背了不止一个书包。",
    dialogue: [
      { speaker: "friend_1", text: "走啊，出去吃点东西，今晚别学了。" },
      { speaker: "friend_2", text: "就半小时，放松一下。" },
      { speaker: "protagonist", text: "可以，但半小时后我得回去。" },
      { speaker: "narrator", text: "你看着他们，也看着手里的错题本。你忽然明白，拒绝和答应之间，还可以有一种叫边界的东西。" }
    ],
    choice_prompt: "请选择你的回应",
    choice_mode: "single",
    next_scene_id: "act_05_family_talk",
    choices: [
      {
        id: "relax_together",
        label: "一起放松",
        quote: "好，今晚先不想学习了。",
        consequence: "热汤和笑声把一整天的紧绷泡开了。你确实轻松了一点，也把原本计划好的复盘留给了明天。",
        effects: { mindset: 9, support: 6, stamina: 4, strategy: -4 },
        unlocks: ["短暂喘息"],
        recommended: false
      },
      {
        id: "direct_refusal",
        label: "直接拒绝",
        quote: "不去了，我还有很多没做完。",
        consequence: "你守住了今晚的计划，却也看见朋友脸上一闪而过的失落。效率没有问题，心里却有一点空。",
        effects: { strategy: 5, stability: 4, support: -5, pressure: 3 },
        unlocks: ["独自推进"],
        recommended: false
      },
      {
        id: "time_boundary",
        label: "约定时间",
        quote: "可以，但半小时后我得回去。",
        consequence: "你们去吃了一点东西，也真的在半小时后回来了。你没有牺牲全部计划，也没有把自己从朋友那里撤走。",
        effects: { support: 8, mindset: 6, stability: 6, pressure: -3 },
        unlocks: ["清晰边界"],
        recommended: true
      }
    ]
  },
  {
    id: "act_05_family_talk",
    act: 5,
    title: "家庭沟通",
    subtitle: "有些支持不是天生就会发生，它需要被说出来。",
    days_left: 61,
    status_text: "试着说明",
    background_key: "scene_family_table",
    character_keys: [],
    real_text: ["本周复习计划", "错题分类", "睡眠时间"],
    ui_text: ["支线事件：家庭沟通", "家庭压力 ↓", "支持值 ↑", "请选择回应方式"],
    narration:
      "餐桌上的灯很暖，暖到你更难开口。父母没有催排名，只是把饭菜往你面前推了推。",
    dialogue: [
      { speaker: "mother", text: "最近是不是很累？" },
      { speaker: "father", text: "我们不是想给你压力，只是希望你别后悔。" },
      { speaker: "protagonist", text: "我现在也会紧张，但我有在调整。" },
      { speaker: "protagonist", text: "这是我接下来的复习安排。" },
      { speaker: "mother", text: "那我们一起配合你。" }
    ],
    choice_prompt: "请选择回应方式",
    choice_mode: "single",
    next_scene_id: "act_06_progress",
    choices: [
      {
        id: "avoid_silence",
        label: "沉默回避",
        quote: "我不想聊这个。",
        consequence: "你把话吞了回去，房间也跟着安静下来。压力没有爆发，却也没有找到出口。",
        effects: { pressure: 7, support: -5, mindset: -4, stamina: 1 },
        unlocks: ["未说出口"],
        recommended: false
      },
      {
        id: "honest_state",
        label: "说出真实状态",
        quote: "我现在有压力，但我有在调整。",
        consequence: "你没有把自己包装成完全没事。父母也没有立刻给答案，只是第一次更认真地听你说完。",
        effects: { pressure: -7, support: 7, mindset: 5, growth: 5 },
        unlocks: ["真实沟通"],
        recommended: false
      },
      {
        id: "show_plan",
        label: "展示计划表",
        quote: "这是我接下来的复习安排。",
        consequence: "计划表铺在餐桌上，像把你心里的混乱翻译成他们能看懂的语言。你们开始讨论几点睡、哪天少问成绩。",
        effects: { support: 12, pressure: -9, stability: 7, strategy: 5 },
        unlocks: ["家庭支持"],
        recommended: true
      }
    ]
  },
  {
    id: "act_06_progress",
    act: 6,
    title: "阶段性进步",
    subtitle: "进步不是烟花，更像每天准时亮起的一盏台灯。",
    days_left: 45,
    status_text: "回升",
    background_key: "scene_second_mock_classroom",
    character_keys: ["protagonist_clear_uniform", "teacher_classroom", "friend_1_uniform"],
    real_text: ["二模成绩", "错题复盘"],
    ui_text: ["阶段性进步", "信心 +12", "稳定 +8", "请选择下一步策略"],
    narration:
      "阳光从窗户落在桌面上。你看到自己的排名往前挪了一些，第一反应不是欢呼，而是不太确定地眨了眨眼。",
    dialogue: [
      { speaker: "teacher", text: "这次有些同学进步很明显，说明方法开始起作用了。" },
      { speaker: "friend_1", text: "你真的追上来了。" },
      { speaker: "protagonist", text: "先别飘，继续按节奏来。" },
      { speaker: "narrator", text: "你轻轻合上成绩单，又翻开错题本。原来信心也可以很安静。" }
    ],
    choice_prompt: "请选择下一步策略",
    choice_mode: "single",
    next_scene_id: "act_07_low_point",
    choices: [
      {
        id: "add_more",
        label: "继续加码",
        quote: "既然有效，那就再拼狠一点。",
        consequence: "你想抓住上升的势头，把计划又压紧了一层。短期里分数还会动，但身体和心态会开始提醒你别越线。",
        effects: { confidence: 8, strategy: 4, stamina: -10, pressure: 8 },
        unlocks: ["加码冲刺"],
        recommended: false
      },
      {
        id: "keep_rhythm",
        label: "保持节奏",
        quote: "按现在的方法继续，不盲目加速。",
        consequence: "你把进步当作反馈，而不是新的鞭子。节奏没有变快，却更稳了。",
        effects: { confidence: 8, stability: 10, pressure: -5, mindset: 5 },
        unlocks: ["稳定节奏"],
        recommended: true
      },
      {
        id: "help_friend",
        label: "帮助朋友",
        quote: "我也可以把懂的题讲给别人。",
        consequence: "你给朋友讲题时，发现自己也把思路重新走了一遍。被需要的感觉，让这段复习不再只剩下个人排名。",
        effects: { support: 8, growth: 8, strategy: 4, stamina: -4 },
        unlocks: ["互相照亮"],
        recommended: false
      }
    ]
  },
  {
    id: "act_07_low_point",
    act: 7,
    title: "考前低谷，学会稳定",
    subtitle: "最后二十天，最难的不是继续用力，而是别把自己用坏。",
    days_left: 20,
    status_text: "焦虑",
    background_key: "scene_rainy_low_classroom",
    character_keys: ["protagonist_exhausted_uniform", "teacher_classroom"],
    real_text: ["距离高考还有20天", "模拟测试"],
    ui_text: ["事件触发：考前低谷", "焦虑 +20", "体力 -15", "请选择最后阶段策略"],
    narration:
      "雨水顺着窗玻璃往下滑。模拟测试的红叉散在卷面上，你盯着它们太久，连太阳穴都开始发胀。",
    dialogue: [
      { speaker: "teacher", text: "你最近是不是太紧了？" },
      { speaker: "protagonist", text: "我怕最后掉下来。" },
      { speaker: "teacher", text: "最后这段时间，不是把自己逼到极限，而是把已经会的东西稳稳拿住。" },
      { speaker: "teacher", text: "最后二十天，你想继续冲，还是先把自己稳住？" }
    ],
    choice_prompt: "请选择最后阶段策略",
    choice_mode: "single",
    next_scene_id: "act_08_exam_day",
    choices: [
      {
        id: "late_sprint",
        label: "继续熬夜冲刺",
        quote: "我还想再多刷一点。",
        consequence: "你把夜晚也塞进复习里。题量增加了，可第二天的脑子像蒙了一层潮湿的纸。",
        effects: { strategy: 4, stamina: -15, pressure: 12, stability: -6 },
        unlocks: ["最后硬冲"],
        recommended: false
      },
      {
        id: "adjust_sleep",
        label: "调整作息",
        quote: "我先把状态稳住。",
        consequence: "你开始按时关灯，把最容易错的题留到清醒时处理。放慢一点以后，手反而稳了。",
        effects: { stamina: 12, stability: 12, pressure: -10, mindset: 6 },
        unlocks: ["稳定作息"],
        recommended: true
      },
      {
        id: "focus_key_points",
        label: "只抓重点",
        quote: "我只复习最容易丢分的地方。",
        consequence: "你不再试图覆盖所有可能，而是把最后的力气放到最常丢分的地方。焦虑还在，但范围变小了。",
        effects: { strategy: 10, stability: 7, pressure: -5, confidence: 3 },
        unlocks: ["重点清单"],
        recommended: false
      }
    ]
  },
  {
    id: "act_08_exam_day",
    act: 8,
    title: "高考当天，最终关卡",
    subtitle: "真正入场时，所有准备都会变成一次深呼吸。",
    days_left: 0,
    status_text: "可以上场",
    background_key: "scene_exam_gate",
    character_keys: ["protagonist_exam_uniform", "mother_exam_gate", "father_exam_gate"],
    real_text: ["高考加油", "考场入口", "准考证"],
    ui_text: ["最终关卡：高考", "已装备：错题复盘、稳定作息、家庭支持", "当前状态：可以上场", "请选择入场方式"],
    narration:
      "考点门口的人群很安静。透明文具袋贴着掌心，里面的准考证、身份证、铅笔和橡皮，都被你检查过不止一遍。",
    dialogue: [
      { speaker: "mother", text: "别想太多，正常考。" },
      { speaker: "father", text: "考完回来吃饭。" },
      { speaker: "protagonist", text: "嗯，我进去了。" },
      { speaker: "narrator", text: "你看了一眼考场入口。那不是终点的门，更像是这一百天终于交到你手里的门把。" }
    ],
    choice_prompt: "请选择入场方式",
    choice_mode: "single",
    next_scene_id: "act_09_admission",
    choices: [
      {
        id: "last_book",
        label: "最后翻书",
        quote: "再看一眼，说不定能碰到。",
        consequence: "你又扫了几页笔记。它带来一点安全感，也让心跳快了一点。你最终还是把书合上，走进人群。",
        effects: { strategy: 2, pressure: 5, stability: -3 },
        unlocks: ["最后一眼"],
        recommended: false
      },
      {
        id: "breathe_enter",
        label: "深呼吸入场",
        quote: "按平时的节奏来。",
        consequence: "你没有再往脑子里塞新的东西。吸气，呼气，抬头。你带着平时训练出的节奏走向考场。",
        effects: { stability: 8, pressure: -7, confidence: 6, mindset: 4 },
        unlocks: ["平时节奏"],
        recommended: true
      },
      {
        id: "check_items",
        label: "检查装备",
        quote: "准考证、身份证、文具，确认完毕。",
        consequence: "你把透明文具袋重新确认了一遍。每一样东西都在，像这一百天里被你一点点放回原位的自己。",
        effects: { stability: 7, pressure: -4, strategy: 3 },
        unlocks: ["装备确认"],
        recommended: false
      }
    ]
  },
  {
    id: "act_09_admission",
    act: 9,
    title: "录取通知书，下一站开启",
    subtitle: "高三留下的不只是分数，还有你终于确认过的自己。",
    days_left: 0,
    status_text: "下一站",
    background_key: "scene_admission_summer_room",
    character_keys: ["protagonist_summer_casual", "courier_summer"],
    real_text: ["录取通知书", "我想认真走完这一百天"],
    ui_text: ["高三副本完成", "分数已保存", "努力已保存", "勇气已保存", "友情已保存", "成长已保存", "下一站已开启"],
    narration:
      "夏天午后的阳光落在书桌上。错题本、计划表、透明文具袋和那张百日誓师时写下的纸条，都还安静地放在那里。",
    dialogue: [
      { speaker: "courier", text: "你的录取通知书到了。" },
      { speaker: "protagonist", text: "谢谢。" },
      { speaker: "protagonist", text: "原来高三留下的不只是分数。" },
      { speaker: "protagonist", text: "下一站，我会继续往前走。" }
    ],
    choice_prompt: "依次点亮你想保存的东西",
    choice_mode: "collect_all",
    choices: [
      {
        id: "save_effort",
        label: "保存努力",
        quote: "我知道自己认真奔跑过。",
        consequence: "那些清晨、晚自习和深夜台灯下的坚持，被轻轻收进心里。你不需要把它们夸大，它们已经足够真实。",
        effects: { confidence: 4, growth: 4 },
        unlocks: ["努力已保存"],
        recommended: true
      },
      {
        id: "save_courage",
        label: "保存勇气",
        quote: "我害怕过，但没有停下。",
        consequence: "你记得自己低谷时的害怕，也记得害怕之后还是把笔拿了起来。勇气不是不抖，是抖着也往前。",
        effects: { mindset: 4, growth: 4 },
        unlocks: ["勇气已保存"],
        recommended: true
      },
      {
        id: "save_growth",
        label: "保存成长",
        quote: "我不是满分，但我已经变得更好。",
        consequence: "你终于允许这段路不是满分作文。它有涂改、有空行、有突然明白的句子，也有你亲手写下的下一页。",
        effects: { growth: 6, pressure: -4 },
        unlocks: ["成长已保存"],
        recommended: true
      }
    ]
  }
];

export const asset_requirements: AssetRequirement[] = [
  {
    key: "scene_oath_playground",
    type: "scene",
    name: "百日誓师操场",
    description:
      "16:9 写实青春校园电影感，清晨操场，温暖阳光，中国高中生穿蓝白运动校服宣誓；红色横幅写“百日誓师大会”，倒计时牌写“距离高考还有100天”。",
    used_in_scene_ids: ["act_01_oath"]
  },
  {
    key: "scene_mock_score_classroom",
    type: "scene",
    name: "一模成绩公布教室",
    description:
      "16:9 写实高三教室，黑板角落写“一模成绩”，老师发成绩单，学生有人开心有人沉默，氛围压抑但不绝望。",
    used_in_scene_ids: ["act_02_mock_failure"]
  },
  {
    key: "scene_review_classroom",
    type: "scene",
    name: "课后错题复盘教室",
    description:
      "16:9 暖色教室灯光，讲台留有试卷，桌面摊开一模试卷和错题本；错题本文字包含“审题错误”“基础漏洞”“时间不够”“计算失误”，计划表标题“最后一百天复习计划”。",
    used_in_scene_ids: ["act_03_review_unlock"]
  },
  {
    key: "scene_after_evening_school",
    type: "scene",
    name: "晚自习结束后的教学楼",
    description:
      "16:9 晚自习结束后的校园，教学楼灯光仍亮，黑板或门口可见“晚自习结束”，夜风、树影、学生结伴离开，温暖但有选择压力。",
    used_in_scene_ids: ["act_04_friend_boundary"]
  },
  {
    key: "scene_family_table",
    type: "scene",
    name: "夜晚家庭餐桌",
    description:
      "16:9 写实家庭生活电影感，夜晚温暖餐桌，书包放在椅子旁；桌上计划表写“本周复习计划”“错题分类”“睡眠时间”，父母和主角克制沟通。",
    used_in_scene_ids: ["act_05_family_talk"]
  },
  {
    key: "scene_second_mock_classroom",
    type: "scene",
    name: "二模成绩公布教室",
    description:
      "16:9 阳光照进高三教室，黑板写“二模成绩”，桌上错题本封面写“错题复盘”，氛围克制励志。",
    used_in_scene_ids: ["act_06_progress"]
  },
  {
    key: "scene_rainy_low_classroom",
    type: "scene",
    name: "雨天考前低谷教室",
    description:
      "16:9 阴雨天高三教室，窗外雨水滑落，冷色灯光，墙上倒计时牌写“距离高考还有20天”，试卷上写“模拟测试”并有红叉。",
    used_in_scene_ids: ["act_07_low_point"]
  },
  {
    key: "scene_exam_gate",
    type: "scene",
    name: "高考考点入口",
    description:
      "16:9 高考当天早晨考点校门口，家长在警戒线外，横幅写“高考加油”，指示牌写“考场入口”，氛围安静紧张但温暖。",
    used_in_scene_ids: ["act_08_exam_day"]
  },
  {
    key: "scene_admission_summer_room",
    type: "scene",
    name: "夏日房间与录取通知书",
    description:
      "16:9 夏天午后明亮房间，桌上有录取通知书、错题本、计划表、透明文具袋、纸条“我想认真走完这一百天”，温暖成长感。",
    used_in_scene_ids: ["act_09_admission"]
  },
  {
    key: "protagonist_uniform_bag",
    type: "character",
    name: "主角：百日誓师校服背包",
    description:
      "17岁中国高三男生，黑色短发，身形偏瘦，蓝白色高中运动校服外套，白色T恤，深蓝校服长裤，白色运动鞋，背黑色双肩包，眼神迷茫紧张。",
    used_in_scene_ids: ["act_01_oath"]
  },
  {
    key: "protagonist_tired_uniform",
    type: "character",
    name: "主角：一模失利疲惫状态",
    description:
      "同一名男生，蓝白校服外套半敞，白色T恤，深蓝校服裤，白色运动鞋，头发略乱，眼神疲惫失落但没有崩溃。",
    used_in_scene_ids: ["act_02_mock_failure"]
  },
  {
    key: "protagonist_review_uniform",
    type: "character",
    name: "主角：错题复盘状态",
    description:
      "同一名男生，蓝白校服外套半敞，袖口微卷，白色T恤，深蓝校服裤，坐在座位上用彩色笔整理错题，神情认真。",
    used_in_scene_ids: ["act_03_review_unlock"]
  },
  {
    key: "protagonist_bag_notebook",
    type: "character",
    name: "主角：晚自习后拿错题本",
    description:
      "同一名男生，蓝白校服外套，黑色双肩包，手里拿错题本，晚自习后略疲惫但温和犹豫。",
    used_in_scene_ids: ["act_04_friend_boundary"]
  },
  {
    key: "protagonist_white_tshirt_home",
    type: "character",
    name: "主角：回家白T恤",
    description:
      "同一名男生，回家后脱下校服外套，穿白色T恤和深蓝校服裤，书包放椅子旁，拿出复习计划表。",
    used_in_scene_ids: ["act_05_family_talk"]
  },
  {
    key: "protagonist_clear_uniform",
    type: "character",
    name: "主角：阶段性进步清爽状态",
    description:
      "同一名男生，蓝白校服外套、白色T恤、深蓝校服裤，状态比之前清爽，看到成绩进步后安静微笑。",
    used_in_scene_ids: ["act_06_progress"]
  },
  {
    key: "protagonist_exhausted_uniform",
    type: "character",
    name: "主角：考前低谷疲惫状态",
    description:
      "同一名男生，蓝白校服外套略皱，白色T恤，深蓝校服裤，眼神疲惫，有轻微黑眼圈，看着模拟测试卷。",
    used_in_scene_ids: ["act_07_low_point"]
  },
  {
    key: "protagonist_exam_uniform",
    type: "character",
    name: "主角：高考入场",
    description:
      "同一名男生，整洁蓝白校服外套，白色T恤，深蓝校服裤，白色运动鞋，手拿透明文具袋，内有准考证、身份证、2B铅笔、橡皮、黑色签字笔。",
    used_in_scene_ids: ["act_08_exam_day"]
  },
  {
    key: "protagonist_summer_casual",
    type: "character",
    name: "主角：高三结束夏日便装",
    description:
      "同一名男生，不穿校服，白色T恤、浅色休闲裤、白色运动鞋，状态更轻松，打开录取通知书时安静微笑。",
    used_in_scene_ids: ["act_09_admission"]
  },
  {
    key: "teacher_classroom",
    type: "character",
    name: "班主任：教室/办公室",
    description:
      "中国高中班主任，温和坚定，真实校园教师气质，可站在讲台或学生桌边，表达克制不煽情。",
    used_in_scene_ids: ["act_02_mock_failure", "act_03_review_unlock", "act_06_progress", "act_07_low_point"]
  },
  {
    key: "teacher_playground",
    type: "character",
    name: "班主任：百日誓师操场",
    description: "同一位班主任，站在操场前方讲话，温和坚定，面向学生宣誓队伍。",
    used_in_scene_ids: ["act_01_oath"]
  },
  {
    key: "deskmate_uniform",
    type: "character",
    name: "同桌",
    description: "中国高三学生，蓝白运动校服，关心主角，一模后小声询问，表情克制。",
    used_in_scene_ids: ["act_02_mock_failure"]
  },
  {
    key: "friend_1_uniform",
    type: "character",
    name: "朋友1",
    description: "中国高三学生，蓝白运动校服，性格外向温暖，邀请主角放松，二模后替主角高兴。",
    used_in_scene_ids: ["act_04_friend_boundary", "act_06_progress"]
  },
  {
    key: "friend_2_uniform",
    type: "character",
    name: "朋友2",
    description: "中国高三学生，蓝白运动校服，语气轻松，晚自习后附和朋友邀请主角放松。",
    used_in_scene_ids: ["act_04_friend_boundary"]
  },
  {
    key: "mother_home",
    type: "character",
    name: "母亲",
    description: "中国母亲，夜晚餐桌和高考考点场景使用，温和关切，不夸张煽情。",
    used_in_scene_ids: ["act_05_family_talk", "act_08_exam_day"]
  },
  {
    key: "father_home",
    type: "character",
    name: "父亲",
    description: "中国父亲，认真但不严厉，餐桌上表达担心，高考当天以简短家常话支持主角。",
    used_in_scene_ids: ["act_05_family_talk", "act_08_exam_day"]
  },
  {
    key: "courier_summer",
    type: "character",
    name: "快递员",
    description: "夏日午后送来录取通知书的快递员，真实生活感，递出写有“录取通知书”的信封。",
    used_in_scene_ids: ["act_09_admission"]
  }
];
