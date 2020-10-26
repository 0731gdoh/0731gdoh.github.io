const quests = [
  {
    id: 0,
    name: "力を求めてA級",
    stamina: 18,
    heroExp: 810,
    heroBand: 360,
    drops: [
      {
        label: "MIN",
        expItems: [300, 150, 100],
        bandItems: [150],
        coins: [720],
        eventItems: [],
        otherItems: [],
        probability: 0
      }, {
        label: "",
        expItems: [300, 150, 100, 160],
        bandItems: [150],
        coins: [720],
        eventItems: [],
        otherItems: [],
        probability: 0
      }, {
        label: "MAX",
        expItems: [300, 150, 100, 160, 200],
        bandItems: [150],
        coins: [720],
        eventItems: [],
        otherItems: [],
        probability: 0
      }
    ],
    eventRate: 1
  }, {
    id: 1,
    name: "強制捜査！A級",
    stamina: 16,
    heroExp: 420,
    heroBand: 300,
    drops: [
      {
        label: "MIN",
        expItems: [],
        bandItems: [],
        coins: [],
        eventItems: [50, 30, 20],
        otherItems: [],
        probability: 0
      }, {
        label: "MAX",
        expItems: [],
        bandItems: [],
        coins: [],
        eventItems: [50, 30, 20, 20],
        otherItems: [],
        probability: 0
      }
    ],
    eventRate: 6
  }, {
    id: 2,
    name: "更なる力を求めて",
    stamina: 20,
    heroExp: 1000,
    heroBand: 420,
    drops: [
      {
        label: "固定",
        expItems: [1000, 700, 450],
        bandItems: [],
        coins: [400],
        eventItems: [],
        otherItems: [],
        probability: 0
      }
    ],
    eventRate: 1
  }, {
    id: 3,
    name: "更なる絆を求めて",
    stamina: 20,
    heroExp: 420,
    heroBand: 1000,
    drops: [
      {
        label: "固定",
        expItems: [],
        bandItems: [1000, 700, 450],
        coins: [400],
        eventItems: [],
        otherItems: [],
        probability: 0
      }
    ],
    eventRate: 1
  }, {
    id: 4,
    name: "次なるランクへ（銀）",
    stamina: 10,
    heroExp: 0,
    heroBand: 0,
    drops: [
      {
        label: "固定",
        expItems: [],
        bandItems: [],
        coins: [400],
        eventItems: [],
        otherItems: [200],
        probability: 0
      }
    ],
    eventRate: 6
  }, {
    id: 5,
    name: "次なるランクへ（金）",
    stamina: 30,
    heroExp: 0,
    heroBand: 0,
    drops: [
      {
        label: "固定",
        expItems: [],
        bandItems: [],
        coins: [1800],
        eventItems: [],
        otherItems: [1000],
        probability: 0
      }
    ],
    eventRate: 6
  }, {
    id: 6,
    name: "更なる（属性）への挑戦",
    stamina: 22,
    heroExp: 250,
    heroBand: 250,
    drops: [
      {
        label: "MSSS",
        expItems: [],
        bandItems: [],
        coins: [],
        eventItems: [],
        otherItems: [120, 60, 60, 60],
        probability: 0
      }, {
        label: "MMSSS",
        expItems: [],
        bandItems: [],
        coins: [],
        eventItems: [],
        otherItems: [120, 120, 60, 60, 60],
        probability: 0
      }, {
        label: "LMMSSS",
        expItems: [],
        bandItems: [],
        coins: [],
        eventItems: [],
        otherItems: [240, 120, 120, 60, 60, 60],
        probability: 0
      }
    ],
    eventRate: 6
  }
];
