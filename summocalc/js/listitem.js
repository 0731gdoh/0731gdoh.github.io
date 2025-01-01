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
  ,["無限/Infinity", 1024]
  ,["零/Null", 2048]
  ,["神/Divine", 4096]
]);
ATTRIBUTE.ORDER = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

var MULTIPLIER = ListItem.createList(
  [[""]
  ,["x2.0/2.0x", 2]
  ,["x1.5/1.5x", 1.5]
  ,["x1.0/1.0x", 1]
  ,["x0.5/0.5x", 0.5]
  ,["→全/ → All-round", 1]
  ,["→火/ → Fire", 2]
  ,["→水/ → Water", 3]
  ,["→木/ → Wood", 4]
  ,["→天/ → Aether", 5]
  ,["→冥/ → Nether", 6]
  ,["→魔/ → Infernal", 7]
  ,["→英雄/ → Valiant", 8]
  ,["→世界/ → World", 9]
  ,["→無限/ → Infinity", 10]
  ,["→零/ → Null", 11]
  ,["→神/ → Divine", 12]
]);
MULTIPLIER.ORDER = [0, 1, 2, 3, 4, 0, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116];
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

var LIMITED = ListItem.createList(
  [[""]
  ,["期間限定/Limited"]
  ,["恒常/Permanent"]
]);

var OBTAIN = ListItem.createList(
  [["転光召喚/Transient Summon"]
  ,["戦友召喚/Ally Summon"]
  ,["イベント/Event"]
  ,["メインクエスト/Main Quest"]
  ,["フリークエスト/Free Quest"]
  ,["アンドヴァリショップ/Andvari Shop"]
]);

var LIMITATION = ListItem.createList(
  [["キャラ/Character"]
  ,["ギルド/Guild"]
  ,["学園/School"]
  ,["レア度/Rarity"]
  ,["属性/Attribute"]
  ,["武器/Weapon"]
  ,["制限なし/No Limit"]
]);

var OR_AND = ListItem.createList(
  [["OR"]
  ,["AND"]
  ,["NOT"]
]);

function bit2array(list, n, lang){
  var i = 0;
  var r = [];
  while(n){
    if(n & 1) r.push(t(list[i].name, lang));
    i++;
    n >>= 1;
  }
  return r;
}
