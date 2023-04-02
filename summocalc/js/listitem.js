"use strict";

function ListItem(index, x){
  this.index = index;
  this.name = x[0];
  this.value = new Fraction(x[1] * 100, 100);
}
ListItem.prototype = {
  toString: function(){
    return t(this.name) || "－";
  },
  getValue: function(){
    return this.value;
  }
};
ListItem.createList = function(a){
  return a.map(function(v, i){
    return new ListItem(i, v);
  });
};

var WEAPON = ListItem.createList(
  [["", 0]
  ,["斬撃/Slash", 0.45]
  ,["突撃/Thrust", 0.55]
  ,["打撃/Blow", 1]
  ,["射撃/Shot", 0.45]
  ,["魔法/Magic", 0.28]
  ,["狙撃/Snipe", 0.26]
  ,["横一文字/Long Slash", 0.32]
  ,["全域/All", 0.1]
  ,["無/None", 0]
]);
WEAPON.ORDER = [0, 1, 2, 3, 4, 5, 7, 6, 8, 9];

var ATTRIBUTE = ListItem.createList(
  [["", 0]
  ,["全/All-round", 2]
  ,["火/Fire", 4]
  ,["水/Water", 8]
  ,["木/Wood", 16]
  ,["天/Aether", 32]
  ,["冥/Nether", 64]
  ,["魔/Infernal", 128]
  ,["英雄/Valiant", 256]
  ,["世界/World", 512]
  ,["無限/無限(Infinite)", 1024]
  ,["零/Null", 2048]
]);
ATTRIBUTE.ORDER = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

var MULTIPLIER = ListItem.createList(
  [[""]
  ,["x2.0", 2]
  ,["x1.5", 1.5]
  ,["x1.0", 1]
  ,["x0.5", 0.5]
  ,["→全/ → All-round", 1]
  ,["→火/ → Fire", 2]
  ,["→水/ → Water", 3]
  ,["→木/ → Wood", 4]
  ,["→天/ → Aether", 5]
  ,["→冥/ → Nether", 6]
  ,["→魔/ → Infernal", 7]
  ,["→英雄/ → Valiant", 8]
  ,["→世界/ → World", 9]
  ,["→無限/ → 無限(Infinite)", 10]
  ,["→零/ → Null", 11]
]);
MULTIPLIER.ORDER = [0, 1, 2, 3, 4, 0, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115];
MULTIPLIER.LABELS = ["倍率/Multiplier", "属性/Attribute"];

var RARITY = ListItem.createList(
  [[""]
  ,["☆1", 2]
  ,["☆2", 4]
  ,["☆3", 8]
  ,["☆4", 16]
  ,["☆5", 32]
]);

var CS = ListItem.createList(
  [["", 0]
  ,["☆1-", 1]
  ,["☆1", 2]
  ,["☆1+", 3]
  ,["☆1++", 4]
  ,["☆1+++", 0]
  ,["☆2-", 0]
  ,["☆2", 2]
  ,["☆2+", 3]
  ,["☆2++", 4]
  ,["☆2+++", 0]
  ,["☆3-", 0]
  ,["☆3", 2]
  ,["☆3+", 3]
  ,["☆3++", 4]
  ,["☆3+++", 0]
  ,["☆4-", 0]
  ,["☆4", 3]
  ,["☆4+", 4]
  ,["☆4++", 5]
  ,["☆4+++", 6]
  ,["☆5-", 3]
  ,["☆5", 4]
  ,["☆5+", 5]
  ,["☆5++", 6]
  ,["☆5+++", 7]
  ,["", 8]
  ,["", 9]
  ,["シヴァ☆5/Shiva ☆5", 10]
  ,["シヴァ☆5+/Shiva ☆5+", 11]
  ,["シヴァ☆5++/Shiva ☆5++", 12]
]);
CS.ORDER = [0, 2, 7, 12, 17, 22, 18, 23, 1, 21, 28];

var VERSION = ListItem.createList(
  [["旧計算式/Old Formula"]
  ,["通常/Normal"]
  ,["エネミー/Enemy"]
]);

var RANGE = ListItem.createList(
  [["自身に/to self"]
  ,["味方に/to ally"]
  ,["敵に/to enemy"]
]);

var THEME = ListItem.createList(
  [["自動/Auto"]
  ,["ライト/Light"]
  ,["ダーク/Dark"]
]);

var VARIANT = ListItem.createList(
  [[""]
  ,["バレ/Valentine"]
  ,["バレ17/Valentine17"]
  ,["海洋/Ocean"]
  ,["臨海/Seaside"]
  ,["ハロ/Halloween"]
  ,["ハロ17/Halloween17"]
  ,["秘島/Island"]
  ,["聖夜/Xmas"]
  ,["聖夜17/Xmas17"]
  ,["バレ18/Valentine18"]
  ,["山/Gendarme"]
  ,["夏祭/Festival"]
  ,["砂旅/Journey"]
  ,["宝船/T.Ship"]
  ,["聖夜18/Xmas18"]
  ,["節分/Setsubun"]
  ,["バレ19/Valentine19"]
  ,["夢/Nightmare"]
  ,["渚/Fashionista"]
  ,["海家/Beach"]
  ,["ハロ19/Halloween19"]
  ,["カナーン/Canaan"]
  ,["聖夜19/Xmas19"]
  ,["バレ20/Valentine20"]
  ,["野営/Jamboree"]
  ,["竜宮/Virtual"]
  ,["福祭/Illusion"]
  ,["聖夜20/Xmas20"]
  ,["バレ21/Valentine21"]
  ,["星空/Nightglows"]
  ,["川/River"]
  ,["地獄/Onsen"]
  ,["ハロ21/Halloween21"]
  ,["聖夜21/Xmas21"]
  ,["バレ22/Valentine22"]
  ,["13章/Ch.13"]
  ,["プール/Pool"]
  ,["浜辺/Dynamis"]
  ,["夜祭/NightFest"]
  ,["聖夜22/Xmas22"]
  ,["バレ23/Valentine23"]
  ,["[期間限定]/[Limited]"]
  ,["[恒常]/[Permanent]"]
]);

var LIMITED_AR = ListItem.createList(
  [[""]
  ,["期間限定/Limited"]
  ,["恒常/Permanent"]
]);
