import type { CharacterProfile, PlayerAction, StoryEvent } from "./types";

export const period_labels: Record<string, string> = {
  daytime: "白天",
  evening: "晚自习",
  night: "睡前"
};

export const scene_labels: Record<string, string> = {
  classroom: "教室",
  bedroom: "卧室",
  track: "操场",
  office: "办公室",
  home: "家里",
  canteen: "食堂"
};

export const character_profiles: CharacterProfile[] = [
  {
    id: "steady",
    name: "稳定型",
    summary: "基础均衡，情绪也还算稳。你习惯把事情放进计划里，一格一格地完成。",
    opening: "开学第一天，你把新发的倒计时表压在透明桌垫下。纸边还很平整，像某种尚未被揉皱的决心。",
    stats: { score: 58, energy: 72, mindset: 68, health: 72, relations: 60, family: 58 },
    hidden: { focus: 64, pressure: 45, phone_dependency: 32, resilience: 60 }
  },
  {
    id: "biased",
    name: "偏科型",
    summary: "强项能给你底气，弱项总在深夜冒出来提醒你。",
    opening: "你翻开错题本，最厚的那一叠总是某一科。你不是不知道问题在哪里，只是每次靠近它，都像推开一扇很重的门。",
    stats: { score: 54, energy: 70, mindset: 60, health: 70, relations: 58, family: 55 },
    hidden: { focus: 60, pressure: 52, phone_dependency: 34, resilience: 62 }
  },
  {
    id: "strained",
    name: "压力型",
    summary: "成绩不错，但你已经很久没有真正放松过。",
    opening: "黑板上的倒计时还没写完，胸口先替你数了一遍。你知道自己能考好，也知道这种知道有时候很累。",
    stats: { score: 66, energy: 58, mindset: 42, health: 62, relations: 52, family: 48 },
    hidden: { focus: 68, pressure: 70, phone_dependency: 30, resilience: 46 }
  },
  {
    id: "loose",
    name: "松散型",
    summary: "你不讨厌学习，只是总会被很多更轻的东西带走。",
    opening: "你在课桌角落贴了一张新的便利贴，写着“这次认真一点”。字迹很好看，像每一次重新开始时的你。",
    stats: { score: 45, energy: 76, mindset: 72, health: 74, relations: 66, family: 60 },
    hidden: { focus: 42, pressure: 38, phone_dependency: 58, resilience: 56 }
  },
  {
    id: "comeback",
    name: "逆袭型",
    summary: "起点不高，但你还有很多没有被证明过的可能。",
    opening: "你坐在靠窗的位置，看见阳光落在卷子空白处。那一瞬间你忽然觉得，空白也不全是坏事，它至少还能被写上东西。",
    stats: { score: 38, energy: 74, mindset: 64, health: 72, relations: 56, family: 54 },
    hidden: { focus: 50, pressure: 46, phone_dependency: 40, resilience: 72 }
  }
];

export const player_actions: PlayerAction[] = [
  {
    id: "listen_and_mark",
    label: "跟住课堂，标出听不懂的地方",
    description: "收益不夸张，但能把白天从混乱里拉回来。",
    periods: ["daytime"],
    scene: "classroom",
    effects: { stats: { score: 3, energy: -8 }, hidden: { focus: 4, pressure: -1 } },
    narration: "你没有逼自己当场全懂，只是在课本边缘画下小小的问号。它们像一排路标，提醒你还可以回头。",
    tags: ["study"]
  },
  {
    id: "ask_teacher",
    label: "课后找老师问一道卡住的题",
    description: "会有一点尴尬，但常常比独自耗一小时更有效。",
    periods: ["daytime", "evening"],
    scene: "office",
    effects: { stats: { score: 4, energy: -10, relations: 2 }, hidden: { focus: 5, pressure: -4 } },
    narration: "你站在办公室门口犹豫了几秒。老师接过卷子时没有评价你，只是把题目拆成了你终于能看见的几步。",
    tags: ["study", "reflection"]
  },
  {
    id: "run_track",
    label: "去操场慢跑三圈",
    description: "牺牲一点学习时间，换回身体和呼吸。",
    periods: ["daytime", "evening"],
    scene: "track",
    effects: { stats: { energy: 8, mindset: 6, health: 7, score: -1 }, hidden: { pressure: -6, resilience: 2 } },
    narration: "风从校服袖口灌进去。你跑得不快，却久违地听见自己的心跳不是因为紧张，而是因为还活着。",
    tags: ["rest", "exercise"]
  },
  {
    id: "math_set",
    label: "限时刷一组数学选择填空",
    description: "短期提分明显，但很吃状态。",
    periods: ["daytime", "evening"],
    scene: "classroom",
    effects: { stats: { score: 5, energy: -14, mindset: -2 }, hidden: { focus: 2, pressure: 4 } },
    narration: "计时器亮着，你把草稿纸翻得哗哗响。做对时有一点亮光，做错时也有一点刺痛。",
    tags: ["study"]
  },
  {
    id: "mistake_book",
    label: "整理错题，写下真正错因",
    description: "没有刷题爽，但后劲更稳。",
    periods: ["evening", "night"],
    scene: "classroom",
    effects: { stats: { score: 4, energy: -9, mindset: 1 }, hidden: { focus: 5, pressure: -2, resilience: 2 } },
    narration: "你把“粗心”划掉，改成“条件没有转化”。那一笔很轻，却像把锅从自己身上搬回了题目本身。",
    tags: ["study", "reflection"]
  },
  {
    id: "nap",
    label: "趴在桌上睡二十分钟",
    description: "很普通的休息，有时候普通正是稀缺。",
    periods: ["daytime"],
    scene: "classroom",
    effects: { stats: { energy: 14, mindset: 3, health: 2 }, hidden: { pressure: -2, focus: 2 } },
    narration: "你醒来时脸上有校服袖子的压痕。黑板还在，卷子还在，但脑子里那团雾淡了一点。",
    tags: ["rest"]
  },
  {
    id: "friend_talk",
    label: "和朋友去食堂慢慢吃饭",
    description: "不一定解决问题，但会让你记得自己不是孤岛。",
    periods: ["daytime", "evening"],
    scene: "canteen",
    effects: { stats: { relations: 7, mindset: 5, energy: -4, score: -1 }, hidden: { pressure: -5, resilience: 2 } },
    narration: "你们聊了题，也聊了食堂今天过咸的汤。笑声很小，却刚好够撑过下一节课。",
    tags: ["social", "rest"]
  },
  {
    id: "phone_scroll",
    label: "刷一会儿手机，把脑子关掉",
    description: "立刻轻松一点，也更难停下来一点。",
    periods: ["daytime", "night"],
    scene: "bedroom",
    effects: { stats: { energy: 4, mindset: 5, score: -2 }, hidden: { phone_dependency: 7, focus: -6, pressure: 2 } },
    narration: "屏幕滑过很多人的生活。你短暂地不用面对自己的，但放下手机时，时间像被谁悄悄抽走了一截。",
    tags: ["phone", "rest"]
  },
  {
    id: "parent_chat",
    label: "和父母认真聊十分钟",
    description: "可能温暖，也可能笨拙，但关系需要被练习。",
    periods: ["night"],
    scene: "home",
    effects: { stats: { family: 6, mindset: 3, energy: -3 }, hidden: { pressure: -4, resilience: 1 } },
    narration: "你没有把话说得很漂亮，只是说最近有点累。沉默停了一会儿，最后没有变成争吵。",
    tags: ["family", "reflection"]
  },
  {
    id: "early_sleep",
    label: "提前睡觉，明天再战",
    description: "放弃今晚的加成，保护明天的自己。",
    periods: ["night"],
    scene: "bedroom",
    effects: { stats: { energy: 18, health: 8, mindset: 4, score: -1 }, hidden: { pressure: -6, focus: 3 } },
    narration: "你关灯时还有几道题没做。黑暗没有责怪你，只是把房间轻轻盖住。",
    tags: ["rest"]
  },
  {
    id: "late_drill",
    label: "熬夜再刷一套卷",
    description: "今晚会有数字上的进步，明天会来收账。",
    periods: ["night"],
    scene: "bedroom",
    effects: { stats: { score: 6, energy: -22, health: -8, mindset: -5 }, hidden: { pressure: 8, focus: -3 } },
    narration: "台灯把卷面照得很白。你把困意按下去，也把身体的提醒一起按了下去。",
    tags: ["study", "late"]
  },
  {
    id: "quiet_journal",
    label: "写三行日记，承认今天的感受",
    description: "不会直接提分，但会让心里那根线松一点。",
    periods: ["night"],
    scene: "bedroom",
    effects: { stats: { mindset: 7, energy: -2 }, hidden: { pressure: -7, resilience: 4, focus: 1 } },
    narration: "你写下“今天也有点难”。这句话没有让难消失，但它终于不用在心里反复撞墙。",
    tags: ["reflection", "rest"]
  },
  {
    id: "recite_english",
    label: "背一组英语高频词",
    description: "小而确定的进步，适合碎片时间。",
    periods: ["daytime", "night"],
    scene: "classroom",
    effects: { stats: { score: 2, energy: -5 }, hidden: { focus: 2 } },
    narration: "你把单词念得很轻，像给未来某篇阅读埋下一粒小小的钉子。",
    tags: ["study"]
  },
  {
    id: "make_plan",
    label: "给明天排一个现实一点的计划",
    description: "不是把一天塞满，而是给自己留出能做到的路。",
    periods: ["night"],
    scene: "bedroom",
    effects: { stats: { mindset: 4, energy: -3 }, hidden: { focus: 5, pressure: -3 } },
    narration: "你删掉了两个过于漂亮的目标。留下来的计划不宏大，但像一双合脚的鞋。",
    tags: ["reflection"]
  }
];

export const story_events: StoryEvent[] = [
  {
    id: "friend_breakdown",
    title: "朋友把草稿纸揉成一团",
    body: "晚自习下课后，朋友低声问你能不能陪他走一会儿。他说自己好像怎么学都没有用。",
    scene: "track",
    trigger: { min_day: 3, max_stats: { relations: 80 } },
    choices: [
      {
        id: "walk",
        label: "陪他绕操场走一圈",
        effects: { stats: { relations: 9, mindset: 3, energy: -6, score: -1 }, hidden: { resilience: 3, pressure: -2 } },
        after_text: "你们没有说出什么大道理。只是走到第三圈时，他终于把那口气慢慢吐出来。你也一样。"
      },
      {
        id: "brief",
        label: "简单安慰后回去订正",
        effects: { stats: { score: 2, relations: -2, energy: -3 }, hidden: { focus: 2 } },
        after_text: "他点点头说没事。你回到座位时题目做得很快，只是某个瞬间会想起他那个点头。"
      },
      {
        id: "ignore",
        label: "假装没听见",
        effects: { stats: { relations: -7, mindset: -3 }, hidden: { pressure: 2 } },
        after_text: "你低头收拾书包。那句话像粉笔灰一样落在身后，轻，却没有完全散掉。"
      }
    ]
  },
  {
    id: "parent_target",
    title: "餐桌上的目标大学",
    body: "父母忽然提起一个更高的目标。他们说是为你好，语气却像把饭桌也变成了讲台。",
    scene: "home",
    trigger: { min_day: 4, max_stats: { family: 70 } },
    choices: [
      {
        id: "explain",
        label: "说出自己的真实想法",
        effects: { stats: { family: 5, mindset: 4, energy: -5 }, hidden: { pressure: -5, resilience: 2 } },
        after_text: "你的声音有点发抖，但没有退回沉默里。父母未必完全懂，却第一次听见你把目标说成自己的。"
      },
      {
        id: "accept",
        label: "点头答应，先不争",
        effects: { stats: { family: 2, mindset: -4 }, hidden: { pressure: 7 } },
        after_text: "饭桌恢复安静。你夹起一筷子菜，忽然分不清自己吞下去的是晚饭还是压力。"
      },
      {
        id: "argue",
        label: "直接顶回去",
        effects: { stats: { family: -8, mindset: -3, energy: -4 }, hidden: { pressure: 4 } },
        after_text: "话出口之后谁都没赢。你回房间关门时，门板的声音比你想象中更重。"
      }
    ]
  },
  {
    id: "teacher_notice",
    title: "班主任在走廊叫住你",
    body: "他说你最近上课总盯着同一页书，不像是在看题，更像是在撑着。",
    scene: "office",
    trigger: { min_day: 5, max_stats: { energy: 45 } },
    choices: [
      {
        id: "admit",
        label: "承认最近有点撑不住",
        effects: { stats: { mindset: 5, relations: 3 }, hidden: { pressure: -6, resilience: 3 } },
        after_text: "他说先把睡眠补回来，题不会因为你休息一晚就跑掉。你有点想笑，也有点想哭。"
      },
      {
        id: "deny",
        label: "说自己没事",
        effects: { stats: { energy: -2, mindset: -3 }, hidden: { pressure: 4 } },
        after_text: "你说得很熟练，像很多次对别人和自己说过一样。老师没有拆穿，只是让你别太晚睡。"
      }
    ]
  },
  {
    id: "rank_jump",
    title: "排行榜旁边的人群",
    body: "有人进步很快，名字贴在你前面。你听见同学小声讨论，心里某个地方紧了一下。",
    scene: "classroom",
    trigger: { min_day: 6 },
    choices: [
      {
        id: "analyze",
        label: "回座位分析自己的失分点",
        effects: { stats: { score: 3, mindset: 1, energy: -5 }, hidden: { focus: 4, pressure: -2 } },
        after_text: "你把视线从排名移回卷子。名字会变，错因更诚实。"
      },
      {
        id: "compare",
        label: "反复看排名",
        effects: { stats: { mindset: -5, energy: -3 }, hidden: { pressure: 7, focus: -2 } },
        after_text: "你看了很久，数字没有再变。变的是你接下来一整节课的呼吸。"
      },
      {
        id: "ask_method",
        label: "去问对方最近怎么学的",
        effects: { stats: { relations: 4, score: 2, energy: -4 }, hidden: { focus: 3, pressure: -1 } },
        after_text: "对方也有点不好意思，但还是把方法讲给你听。原来进步不是魔法，是很多笨办法终于叠起来了。"
      }
    ]
  },
  {
    id: "late_insomnia",
    title: "凌晨一点，天花板很亮",
    body: "你明明很困，却睡不着。白天没做完的题、没说出口的话，都在黑暗里排队。",
    scene: "bedroom",
    trigger: { min_day: 7, min_hidden: { pressure: 62 } },
    choices: [
      {
        id: "breathe",
        label: "放下手机，慢慢数呼吸",
        effects: { stats: { energy: 6, mindset: 4, health: 2 }, hidden: { pressure: -6, phone_dependency: -2 } },
        after_text: "你没有立刻睡着，但心跳一点点慢下来。夜晚终于不再像一张追着你跑的卷子。"
      },
      {
        id: "phone",
        label: "拿起手机转移注意力",
        effects: { stats: { mindset: 3, energy: -7, health: -3 }, hidden: { phone_dependency: 8, focus: -5 } },
        after_text: "屏幕很亮，亮到你看不见窗外。等你放下它，睡意已经走远了一截。"
      },
      {
        id: "study",
        label: "干脆起来背书",
        effects: { stats: { score: 2, energy: -10, health: -4 }, hidden: { pressure: 3 } },
        after_text: "你把书翻开，像是在和失眠谈判。它让出一点时间，也拿走一点明天。"
      }
    ]
  },
  {
    id: "small_kindness",
    title: "同桌递来一颗薄荷糖",
    body: "你揉眼睛的时候，同桌把糖推到你桌角，说：别皱眉了，卷子又不会被你吓跑。",
    scene: "classroom",
    trigger: { min_day: 8 },
    choices: [
      {
        id: "smile",
        label: "笑一下，收下这点好意",
        effects: { stats: { relations: 4, mindset: 4 }, hidden: { pressure: -3 } },
        after_text: "糖很凉。你忽然发现，有些支撑不是轰轰烈烈来的，只是被轻轻放在桌角。"
      },
      {
        id: "wave",
        label: "摆摆手，继续做题",
        effects: { stats: { score: 1, relations: -1 }, hidden: { focus: 1 } },
        after_text: "你没有抬头。题目做完后，那颗糖还在边上，像一个被错过的小课间。"
      }
    ]
  },
  {
    id: "phone_pull",
    title: "短视频停不下来",
    body: "你只是想看五分钟。再抬头时，台灯旁边的影子已经换了位置。",
    scene: "bedroom",
    trigger: { min_day: 8, min_hidden: { phone_dependency: 60 } },
    choices: [
      {
        id: "delete_shortcut",
        label: "把应用移出首页",
        effects: { stats: { mindset: 2 }, hidden: { phone_dependency: -10, focus: 5, pressure: -2 } },
        after_text: "手指有点舍不得，但图标消失后，桌面空出一小块安静。"
      },
      {
        id: "continue",
        label: "再看最后一个",
        effects: { stats: { energy: -8, health: -2, mindset: -2 }, hidden: { phone_dependency: 8, focus: -7, pressure: 4 } },
        after_text: "最后一个后面还有最后一个。你知道这句话不可信，却还是点了下去。"
      }
    ]
  },
  {
    id: "found_subject",
    title: "某一科忽然开了个口",
    body: "你发现最近的错题集中在同一种题型。它不再像一整片雾，而像一扇能推开的门。",
    scene: "classroom",
    trigger: { min_day: 11, min_hidden: { focus: 55 } },
    choices: [
      {
        id: "breakthrough",
        label: "连续三天盯住这个题型",
        effects: { stats: { score: 6, energy: -8, mindset: 3 }, hidden: { focus: 3, pressure: -2 } },
        after_text: "你没有突然变聪明，只是终于不再用一整片焦虑面对一个具体问题。"
      },
      {
        id: "leave",
        label: "先记下来，今天不处理",
        effects: { stats: { mindset: 1 }, hidden: { pressure: 1 } },
        after_text: "你把它写进计划本。那扇门还在那里，等你下次真的伸手。"
      }
    ]
  },
  {
    id: "rainy_evening",
    title: "晚自习外面下雨",
    body: "窗户上有细细的水痕。教室里只有翻书声，像一艘在雨里慢慢前进的船。",
    scene: "classroom",
    trigger: { min_day: 12 },
    choices: [
      {
        id: "quiet_study",
        label: "借着雨声安静做题",
        effects: { stats: { score: 3, energy: -5 }, hidden: { focus: 4, pressure: -1 } },
        after_text: "雨声把世界隔远了一点。你难得没有被别人的进度拖着跑。"
      },
      {
        id: "look_out",
        label: "看一会儿窗外",
        effects: { stats: { mindset: 5, energy: 2, score: -1 }, hidden: { pressure: -4 } },
        after_text: "你看见操场积水反着光。原来日子不只有倒计时，也有被雨洗亮的十分钟。"
      }
    ]
  },
  {
    id: "home_silence",
    title: "家里今晚格外安静",
    body: "父母没有催你，也没有问排名。客厅的灯留着，像一句不太会说出口的关心。",
    scene: "home",
    trigger: { min_day: 14, min_stats: { family: 55 } },
    choices: [
      {
        id: "sit",
        label: "在客厅坐一会儿",
        effects: { stats: { family: 5, mindset: 4, energy: -2 }, hidden: { pressure: -4 } },
        after_text: "你们聊得很碎，天气、饭菜、明天要不要带伞。没有一句是答案，却都像缓冲垫。"
      },
      {
        id: "room",
        label: "直接回房间学习",
        effects: { stats: { score: 2, family: -1, energy: -4 }, hidden: { focus: 2 } },
        after_text: "你关上门，听见外面电视声调小了一点。那份小心你听见了，只是暂时没有回应。"
      }
    ]
  },
  {
    id: "mock_whisper",
    title: "有人说这次模拟卷很难",
    body: "消息从前排传到后排，像一阵小风。还没考试，教室里的肩膀已经紧了起来。",
    scene: "classroom",
    trigger: { min_day: 18, min_hidden: { pressure: 50 } },
    choices: [
      {
        id: "routine",
        label: "按原计划复习，不追着传言跑",
        effects: { stats: { mindset: 4 }, hidden: { focus: 4, pressure: -5 } },
        after_text: "你把传言留在空气里，把笔落回纸上。难不难都是明天的事，今晚只处理今晚。"
      },
      {
        id: "panic",
        label: "临时加刷两套难题",
        effects: { stats: { score: 3, energy: -13, mindset: -4, health: -3 }, hidden: { pressure: 7 } },
        after_text: "你做得很快，也错得很快。夜里躺下时，脑子还在自动翻页。"
      }
    ]
  },
  {
    id: "body_warning",
    title: "早上起来嗓子有点疼",
    body: "你把校服拉链拉到最上面，还是觉得身体像一台被连续使用太久的机器。",
    scene: "bedroom",
    trigger: { min_day: 15, max_stats: { health: 45 } },
    choices: [
      {
        id: "slow",
        label: "今天降低强度，多喝水",
        effects: { stats: { health: 9, energy: 5, score: -2 }, hidden: { pressure: -3 } },
        after_text: "你没有把自己逼到极限。身体像是终于被听见了一次，虽然只是很小声地回应。"
      },
      {
        id: "push",
        label: "照常冲刺",
        effects: { stats: { score: 3, health: -8, energy: -8, mindset: -2 }, hidden: { pressure: 5 } },
        after_text: "你把不舒服压进领口里。它没有消失，只是在下午用更沉的脑袋回来找你。"
      }
    ]
  },
  {
    id: "future_form",
    title: "志愿意向表发下来了",
    body: "那张纸很薄，却让未来突然有了格子。城市、专业、分数线，每一栏都像在问你：你想去哪？",
    scene: "classroom",
    trigger: { min_day: 22 },
    choices: [
      {
        id: "self",
        label: "认真写下自己的排序",
        effects: { stats: { mindset: 5, family: 1 }, hidden: { focus: 3, pressure: -3 } },
        after_text: "你写得很慢。不是因为不知道答案，而是第一次把答案写得像自己的。"
      },
      {
        id: "parents",
        label: "按父母期待先填",
        effects: { stats: { family: 3, mindset: -3 }, hidden: { pressure: 5 } },
        after_text: "表格填完了，你心里却空出一栏。那一栏没有名字，只写着“以后再说”。"
      },
      {
        id: "avoid",
        label: "先塞进书包，晚点再想",
        effects: { stats: { mindset: -1 }, hidden: { pressure: 4 } },
        after_text: "纸角在书包里折了一下。未来不会因为被塞起来就变轻，但今天你确实暂时不用看它。"
      }
    ]
  },
  {
    id: "last_week",
    title: "倒计时牌只剩个位数",
    body: "红色数字像压低了声音。大家都比平时安静，连椅子挪动的声音都显得小心。",
    scene: "classroom",
    trigger: { min_day: 24 },
    choices: [
      {
        id: "steady",
        label: "只复盘基础和错题",
        effects: { stats: { score: 3, mindset: 4, energy: -4 }, hidden: { focus: 4, pressure: -5 } },
        after_text: "你没有再贪多。那些被你反复捡起的基础题，终于在最后几天变成脚下的地。"
      },
      {
        id: "sprint",
        label: "尽可能多刷题",
        effects: { stats: { score: 4, energy: -14, health: -4, mindset: -4 }, hidden: { pressure: 8 } },
        after_text: "你想把每一种可能都抓住。可手攥得太紧时，有些东西也会从指缝里漏掉。"
      },
      {
        id: "breathe",
        label: "每天留半小时散步",
        effects: { stats: { mindset: 7, health: 4, score: -1 }, hidden: { pressure: -7, resilience: 3 } },
        after_text: "你沿着操场边慢慢走。树影落在路上，像把一整年切成可以承受的小段。"
      }
    ]
  }
];
