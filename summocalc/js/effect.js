"use strict";

var TYPE = {
  NORMAL: 1,
  ATK: 2,
  WEAPON: 5,
  COMBO: 7,
  LIMIT: 8,
  SEED: 9,
  CSWEAPON: 10,
  BONUS: 11,
  IGNORE: 12,
  CUSTOM: 13,
  ZERO: 14,
  NOT_BUFFED: 15,
  NOT_DEBUFFED: 16,
  WEAPON_WEAKNESS: 17,
  DEBUFF_OVERWRITE: 18,
  PROMPT: 19
};

var EFFECT_FLAG = {
  EVENT: 1,
  FIXED: 1 << 1,
  STACKABLE: 1 << 2,
  IRREMOVABLE: 1 << 3,
  LV1: 1 << 4,
  TOKEN: 1 << 5,
  BUFF: 1 << 6,
  DEBUFF: 1 << 7,
  GIMMICK: 1 << 8,
  BONUS_TO_BUFF: 1 << 9,
  BONUS_TO_DEBUFF: 1 << 10,
  NON_STATUS: 1 << 11,
  ALT: 1 << 12
};

function Effect(index, x, link, equ){
  this.index = index;
  this.link = link;
  this.equ = equ;
  this.name = x[0];
  this.reading = x[1];
  this.group = x[2];
  this.flag = x[5] || 0;
  this.type = x[6] || TYPE.NORMAL;
  this.event = this.flag & EFFECT_FLAG.EVENT;
  this.gimmick = this.flag & EFFECT_FLAG.GIMMICK;
  this.baseValue = [];
  this.value = [];
  for(var i = 3; i < 5; i++){
    var v = x[i] || 0;
    if(link && v.length){
      this.baseValue.push(v[(this.flag & EFFECT_FLAG.NON_STATUS) ? 1 : 0]);
      this.value.push([
        new Fraction(v[0] * 100, 100),
        new Fraction(v[1] * 100, 100)
      ]);
    }else{
      this.baseValue.push(v);
      this.value.push(new Fraction(v * 100, 100));
    }
  }
  this.canOld = false;
  if(this.isFixed()){
    this.growth = [
      new Fraction(0),
      new Fraction(0)
    ];
  }else{
    if(x[7] !== undefined){
      this.growth = [new Fraction(x[7] * 100, 100)];
    }else if(x[3] < 1 && x[3] > 0){
      this.growth = [this.value[0].mul(-1, 2)];
      this.canOld = true;
    }else{
      this.growth = [this.value[0]];
    }
    if(x[8] !== undefined){
      this.growth.push(new Fraction(x[8] * 100, 100));
    }else{
      this.growth.push(this.value[1]);
    }
  }
  this.sortkey = 1;
  if(this.isToken()){
    this.sortkey = 3;
  }else if(this.event){
    this.sortkey = 6;
  }else if(this.gimmick){
    this.sortkey = 5;
  }else if(this.type === TYPE.BONUS){
    this.sortkey = 2;
  }else if(this.type === TYPE.CUSTOM){
    this.sortkey = 7;
  }else if(!this.reading){
    this.sortkey = 0;
  }else if(this.flag & EFFECT_FLAG.IRREMOVABLE){
    this.sortkey = 4;
  }
  if((this.type === TYPE.BONUS || this.type === TYPE.IGNORE) && !this.group) this.subset = new Map();
  this.csOnly = false;
}
Effect.prototype = {
  toString: function(){
    return (this.event ? "◎" : this.gimmick ? "☆" : "") + t(this.name) + (this.csOnly ? "[CS]" : "") || "－";
  },
  _getValue: function(m, lv, oldmode, es){
    var value = this.value[m];
    if(this.link && this.type !== TYPE.DEBUFF_OVERWRITE){
      var loop = es ? es[this.link].getLoopSum() : 1;
      if(value.length){
        value = value[loop ? 0 : 1];
      }else if(!loop){
        value = new Fraction(0);
      }
    }
    if(oldmode && !m && this.canOld){
      return value.mul(100, 100 + lv);
    }else{
      return value.add(this.growth[m].mul(lv, 100));
    }
  },
  getValue: function(lv, oldmode, es){
    if(this.promptData){
      return this.promptData.getValue(lv);
    }
    return [
      this._getValue(0, lv, oldmode, es),
      this._getValue(1, lv, oldmode, es)
    ];
  },
  isFixed: function(){
    return this.flag & EFFECT_FLAG.FIXED;
  },
  isStackable: function(){
    return this.flag & EFFECT_FLAG.STACKABLE;
  },
  isLv1: function(){
    return this.flag & EFFECT_FLAG.LV1;
  },
  isToken: function(){
    return this.flag & EFFECT_FLAG.TOKEN;
  },
  isBuff: function(group){
    if(this.group === group) return this.flag & EFFECT_FLAG.BUFF;
    return this.flag & EFFECT_FLAG.BONUS_TO_BUFF;
  },
  isDebuff: function(group){
    if(this.group === group) return this.flag & EFFECT_FLAG.DEBUFF;
    return this.flag & EFFECT_FLAG.BONUS_TO_DEBUFF;
  },
  isNonStatus: function(){
    return this.flag & EFFECT_FLAG.NON_STATUS;
  },
  hasAlt: function(){
    return this.flag & EFFECT_FLAG.ALT;
  }
};
Effect.createList = function(a, pd){
  var table = new Map();
  var result = [];
  var order = [];
  var orderData = [];
  var labels = [];
  var k = [];
  var en = false;
  var f = function(a, b){
    var x = result[a];
    var y = result[b];
    if(x.sortkey !== y.sortkey) return x.sortkey - y.sortkey;
    if(x.group !== y.group) return x.group - y.group;
    if(x.sortkey > 5) return x.index - y.index;
    if(x.sortkey === 2 || !x.sortkey || k[a] === k[b]) return x.baseValue[0] - y.baseValue[0] || x.baseValue[1] - y.baseValue[1] || x.index - y.index;
    if(en) return t(x.name, 1).toUpperCase() < t(y.name, 1).toUpperCase() ? -1 : 1;
    if(x.reading === y.reading) return x.index - y.index;
    return x.reading < y.reading ? -1 : 1;
  };
  a.forEach(function(v, i){
    var key = t(v[0], 0).replace(/-<[^>]+>|<\*?|>|=[^\]]+/g, "");
    var tagIndex = TAG.table.get(key);
    if(v[2]) key = "*" + key;
    if(table.has(key)) throw Error(["攻撃", "防御"][v[2]] + "側補正効果「" + key + "」が重複しています\n（" + v[0] + "）");
    table.set(key, i);
    if(tagIndex){
      switch(TAG[tagIndex].type){
        case TAG_TYPE.BUFF:
          v[5] = (v[5] || 0) | EFFECT_FLAG.BUFF;
          break;
        case TAG_TYPE.DEBUFF:
          v[5] = (v[5] || 0) | EFFECT_FLAG.DEBUFF;
      }
    }
  });
  a.forEach(function(v, i){
    var e;
    var link = 0;
    var equ = 0;
    v[0] = v[0].replace(/(-?)<([^>]+)>/, function(match, p1, p2){
      link = table.get(p2) || 0;
      if(!link) throw Error(["攻撃", "防御"][p1.length] + "側補正効果「" + p2 + "」は存在しません\n（" + v[0] + "）");
      if(p1.length) return "";
      return p2.replace(/\*+/, "");
    });
    v[0] = v[0].replace(/([^\[]+\[)([^=]+)=([^\]]+\])/, function(match, p1, p2, p3){
      equ = table.get(v[2] ? "*" + p1 + p3 : p1 + p3);
      return p1 + p2 + "]";
    });
    e = new Effect(i, v, link, equ);
    result.push(e);
    if(i){
      var o = orderData[e.sortkey] || [0];
      o.push(i);
      orderData[e.sortkey] = o;
    }
    k.push(t(v[0], 0).replace(/(\[[^\]]+\]|：.+|[小中大]UP)$/, ""))
  });
  for(var i = 0; i < 2; i++){
    order.push(orderData.reduce(function(a, x){return a.concat(x.sort(f))}, []));
    en = true;
  }
  pd.forEach(function(v){
    result[table.get(v[0])].promptData = new PromptData(v);
  });
  result.ORDER = order;
  labels.push(["システム/System", "一般/General", "特攻/Attack Bonus", "その他/Others", "解除不可/Irremovable", "クエストギミック/Quest Gimmick", "イベント/Event", "カスタム/Customizable"]);
  labels.push(["", "一般/General", "特防/Defense Bonus"].concat(labels[0].slice(3)));
  result.LABELS = labels;
  result.table = table;
  return result;
};

function PromptData(x){
  var threshold = x[3];
  this.title = x[1];
  this.label = "[" + x[2] + ":";
  this.min = threshold;
  this.max = x[4];
  this.data = x[5].map(function(v){
    threshold += v[0];
    return [v[0], [new Fraction(v[1] * 100, 100), new Fraction(v[2] * 100, 100)]];
  });
  this.threshold = threshold;
}
PromptData.prototype = {
  prompt: function(){
    var lv = -1;
    while(lv < this.min || lv > this.max || isNaN(lv)){
      lv = prompt(t(this.title) + t(" (※/\n(") + this.min + t("〜/-") + this.max + ")");
      if(!lv) return null;
      lv = parseInt(lv, 10);
    }
    return lv;
  },
  getDataNum: function(lv){
    var n;
    lv -= this.min;
    this.data.some(function(v, i){
      lv -= v[0];
      n = i;
      return lv < 0;
    });
    return n;
  },
  getValue: function(lv){
    return this.data[this.getDataNum(lv)][1];
  },
  getLabel: function(lv){
    if(lv < this.threshold) return this.label + lv + "]";
    return this.label + this.threshold + "+]";
  }
};

var EFFECT_MAX = 10000;

var EFFECT = Effect.createList(
  //名前, 読み, グループ, 乗算基本値, 加算基本値, フラグ=0, タイプ=TYPE.NORMAL, 乗算成長率=undefined, 加算成長率=undefined
  [["", "", -1, 1, 0]
  ,["[ATKの種]/[ATK Seed]", "", 0, , , EFFECT_FLAG.FIXED, TYPE.SEED]
  ,["結縁：怒/Affinity: Anger", "", 0, 1.1, , EFFECT_FLAG.LV1]
  ,["意気/Spirit", "いき", 0, 0, 400]
  ,["回避/Evasion", "かいひ", 1, 0.01]
  ,["<*回避>に貫通/Ignore Evasion", "かいひ", 0, 100, , EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE, TYPE.IGNORE]
  ,["頑強/Tenacity", "かん", 1, 0.9]
  ,["<*頑強>に貫通/Ignore Tenacity", "かん", 0, 2.22, , EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE, TYPE.IGNORE]
  ,["極限/Limit", "きよく", 0, 1, , , TYPE.LIMIT]
  ,["崩し/Break", "くす", 1, 1.2]
  ,["暗闇/Darkness", "くら", 0, 0.9]
  ,["クリティカル/Crit", "くり", 0, 2]
  ,["クリティカル+/Crit+", "くり", 0, 2.5]
  ,["クリティカル++/Crit++", "くり", 0, 3]
  ,["激怒/Rage", "けき", 0, 1.25]
  ,["激怒/Rage", "けき", 1, 1.25]
  ,["激怒+/Rage+", "けき+", 0, 1.25]
  ,["激怒+/Rage+", "けき+", 1, 1.25, , EFFECT_FLAG.FIXED]
  ,["幻惑/Dazzle", "けん", 0, 0.7]
  ,["攻撃強化/ATK Up", "こうけ", 0, 1.1]
  ,["剛力/Brawn", "こうり", 0, 1.15]
  ,["金剛/Adamantine", "こんこ", 1, 0.9]
  ,["<*金剛>に貫通/Ignore Adamantine", "こんこ", 0, 2.22, , EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE, TYPE.IGNORE]
  ,["弱点/Weakness", "しやくて", 1, 1.2]
  ,["集中/Concentration", "しゆう", 0, 1.1]
  ,["守護/Protection", "しゆこ", 1, 0.9]
  ,["<*守護>に貫通/Ignore Protection", "しゆこに", 0, 2.22, , EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE, TYPE.IGNORE]
  ,["滋養/Nourishment", "しよ", 0, 1.1, , , , 0.4]
  ,["聖油/Unction", "せい", 1, 0.85]
  ,["<*聖油>に貫通/Ignore Unction", "せい", 0, 2.35, , EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE, TYPE.IGNORE]
  ,["束縛/Bind", "そく", 0, 0.9]
  ,["×<*凍結>", "とうけ", 2]
  ,["闘志/Vigor", "とうし", 0, 1.2]
  ,["毒反転/Poison Reversal", "とくは", 0, 2, , EFFECT_FLAG.FIXED]
  ,["毒反転/Poison Reversal", "とくは", 1, 0.6, , EFFECT_FLAG.FIXED]
  ,["特防[0.01]/Bonus[0.01]", "とくほ", 1, 0.01, , EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE|EFFECT_FLAG.GIMMICK, TYPE.BONUS]
  ,["特防[0.1]/Bonus[0.1]", "とくほ", 1, 0.1, , EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE, TYPE.BONUS]
  ,["特防[0.2]/Bonus[0.2]", "とくほ", 1, 0.2, , EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE|EFFECT_FLAG.GIMMICK, TYPE.BONUS]
  ,["特防[0.3]/Bonus[0.3]", "とくほ", 1, 0.3, , EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE, TYPE.BONUS]
  ,["特防[0.5]/Bonus[0.5]", "とくほ", 1, 0.5, , EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE, TYPE.BONUS]
  ,["特防[0.6]/Bonus[0.6]", "とくほ", 1, 0.6, , EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE, TYPE.BONUS]
  ,["特防[0.7]/Bonus[0.7]", "とくほ", 1, 0.7, , EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE, TYPE.BONUS]
  ,["特防[0.8]/Bonus[0.8]", "とくほ", 1, 0.8, , EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE, TYPE.BONUS]
  ,["特防[1.7]/Bonus[1.7]", "とくほ", 1, 1.7, , EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE|EFFECT_FLAG.GIMMICK, TYPE.BONUS]
  ,["特防[10.0]/Bonus[10.0]", "とくほ", 1, 10, , EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE|EFFECT_FLAG.GIMMICK, TYPE.BONUS]
  ,["特攻[1.4]/Bonus[1.4]", "とつ", 0, 1.4, , EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE, TYPE.BONUS]
  ,["特攻[1.5]/Bonus[1.5]", "とつ", 0, 1.5, , EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE, TYPE.BONUS]
  ,["特攻[1.6]/Bonus[1.6]", "とつ", 0, 1.6, , EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE, TYPE.BONUS]
  ,["特攻[2.0]/Bonus[2.0]", "とつ", 0, 2, , EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE, TYPE.BONUS]
  ,["特攻[2.3]/Bonus[2.3]", "とつ", 0, 2.3, , EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE, TYPE.BONUS]
  ,["特攻[2.5]/Bonus[2.5]", "とつ", 0, 2.5, , EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE, TYPE.BONUS]
  ,["特攻[3.0]/Bonus[3.0]", "とつ", 0, 3, , EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE, TYPE.BONUS]
  ,["特攻[4.0]/Bonus[4.0]", "とつ", 0, 4, , EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE, TYPE.BONUS]
  ,["熱情/Ardor", "ねつ", 0, 1.2]
  ,["呪い/Curse", "のろ", 0, 0.8]
  ,["武器種変更：斬撃/Change Weapon Type: Slash", "ふき", 0, 0, 1, EFFECT_FLAG.FIXED, TYPE.WEAPON]
  ,["武器種変更：突撃/Change Weapon Type: Thrust", "ふき", 0, 0, 2, EFFECT_FLAG.FIXED, TYPE.WEAPON]
  ,["武器種変更：打撃/Change Weapon Type: Blow", "ふき", 0, 0, 3, EFFECT_FLAG.FIXED, TYPE.WEAPON]
  ,["武器種変更：魔法/Change Weapon Type: Magic", "ふき", 0, 0, 5, EFFECT_FLAG.FIXED, TYPE.WEAPON]
  ,["武器種変更：狙撃/Change Weapon Type: Snipe", "ふき", 0, 0, 6, EFFECT_FLAG.FIXED, TYPE.WEAPON]
  ,["武器種変更：横一文字/Change Weapon Type: Long Slash", "ふき", 0, 0, 7, EFFECT_FLAG.FIXED, TYPE.WEAPON]
  ,["武器種変更：全域/Change Weapon Type: All", "ふき", 0, 0, 8, EFFECT_FLAG.FIXED, TYPE.WEAPON]
  ,["武器種変更：無/Change Weapon Type: None", "ふき", 0, 0, 9, EFFECT_FLAG.FIXED, TYPE.WEAPON]
  ,["防御強化/DEF Up", "ほうき", 1, 0.9]
  ,["<*防御強化>に貫通/Ignore DEF Up", "ほうき", 0, 2.22, , EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE, TYPE.IGNORE]
  ,["暴走/Berserk", "ほうそ", 0, 1.3]
  ,["暴走/Berserk", "ほうそ", 1, 1.3]
  ,["暴走+/Berserk+", "ほうそ+", 0, 1.3]
  ,["暴走+/Berserk+", "ほうそ+", 1, 1.3, , EFFECT_FLAG.FIXED]
  ,["マヒ/Paralysis", "まひ", 0, 0.9]
  ,["×<無窮>", "むき", 2]
  ,["烙印/Stigma", "らく", 1, 1.15]
  ,["連撃/Combo", "れん", 0, 0.6, , EFFECT_FLAG.FIXED, TYPE.COMBO]
  ,["攻撃力小UP", "こうけ", 0, 0, 250, EFFECT_FLAG.BUFF|EFFECT_FLAG.GIMMICK]
  ,["攻撃力中UP", "こうけ", 0, 0, 500, EFFECT_FLAG.BUFF|EFFECT_FLAG.GIMMICK]
  ,["攻撃力大UP", "こうけ", 0, 0, 1000, EFFECT_FLAG.BUFF|EFFECT_FLAG.GIMMICK]
  ,["CS変更：全域/Change CS Type: All", "CS", 0, 0, 8, EFFECT_FLAG.FIXED, TYPE.CSWEAPON]
  ,["おせち", "おせ", 0, 1.2, 50, EFFECT_FLAG.STACKABLE|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.GIMMICK, , 0]
  ,["おせち", "おせ", 1, 0.8, , EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.GIMMICK]
  ,["負傷", "ふし", 0, 0.2, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.GIMMICK]
  ,["ミンスパイ", "", 0, 1.5, , EFFECT_FLAG.EVENT|EFFECT_FLAG.FIXED]
  ,["結縁：怒[ジェイル]/Affinity: Anger[V.Jail]", "", 0, 1.2, , EFFECT_FLAG.EVENT|EFFECT_FLAG.LV1]
  ,["隊列歩行[L]/Single-File[L]", "", 0, 0.5, , EFFECT_FLAG.EVENT|EFFECT_FLAG.FIXED, TYPE.ATK]
  ,["隊列歩行[M]/Single-File[M]", "", 1, 0.5, , EFFECT_FLAG.EVENT|EFFECT_FLAG.FIXED]
  ,["トラバース/Criss-Cross", "", 0, 0.3, , EFFECT_FLAG.EVENT|EFFECT_FLAG.FIXED, TYPE.ATK]
  ,["タクティクス[M]/Tactical", "", 0, 0.5, , EFFECT_FLAG.EVENT|EFFECT_FLAG.FIXED, TYPE.ATK]
  ,["シージ[L]/Siege[L]", "", 1, 0.5, , EFFECT_FLAG.EVENT|EFFECT_FLAG.FIXED]
  ,["シージ[M]/Siege[M]", "", 1, 0.7, , EFFECT_FLAG.EVENT|EFFECT_FLAG.FIXED]
  ,["剣豪フランクフルト", "", 0, 1, , EFFECT_FLAG.EVENT|EFFECT_FLAG.FIXED, TYPE.ATK]
  ,["編成ボーナス[突撃]/編成ボーナス[Thrust]", "", 0, 0, 300, EFFECT_FLAG.EVENT|EFFECT_FLAG.FIXED, TYPE.ATK]
  ,["試練の石・ATK減", "", 0, 0, -1000, EFFECT_FLAG.EVENT|EFFECT_FLAG.FIXED, TYPE.ATK]
  ,["ATKボーナス[30%]", "", 0, 0.3, , EFFECT_FLAG.EVENT|EFFECT_FLAG.FIXED, TYPE.ATK]
  ,["ATKボーナス[50%]", "", 0, 0.5, , EFFECT_FLAG.EVENT|EFFECT_FLAG.FIXED, TYPE.ATK]
  ,["ATKボーナス[100%]", "", 0, 1, , EFFECT_FLAG.EVENT|EFFECT_FLAG.FIXED, TYPE.ATK]
  ,["強化反転/Buff Reversal", "きようかは", 0, 0.25, , EFFECT_FLAG.FIXED]
  ,["強化反転/Buff Reversal", "きようかは", 1, 2.5, , EFFECT_FLAG.FIXED]
  ,["攻撃力減少", "こうけけ", 0, 0.01, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE]
  ,["特攻[6.0]/Bonus[6.0]", "とつ", 0, 6, , EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE, TYPE.BONUS]
  ,["CS変更：魔法/Change CS Type: Magic", "CS", 0, 0, 5, EFFECT_FLAG.FIXED, TYPE.CSWEAPON]
  ,["攻撃力微増[AR]", "こうけひ", 0, 1.13, , EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE|EFFECT_FLAG.IRREMOVABLE]
  ,["[カスタム]/[Customizable]", "", 0, 1, , EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE, TYPE.CUSTOM]
  ,["[カスタム]/[Customizable]", "", 1, 1, , EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE, TYPE.CUSTOM]
  ,["<束縛>時強化", "そく", 0, 10, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE]
  ,["特攻[1.3]/Bonus[1.3]", "とつ", 0, 1.3, , EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE, TYPE.BONUS]
  ,["<*守護>無効化/Nullify Protection", "しゆこむ", 1, 2.22, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE]
  ,["<*防御強化>無効化/Nullify DEF Up", "ほうき", 1, 2.22, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE]
  ,["劫火-<*火傷>/Conflagration", "こうか", 1, 0, 3000, EFFECT_FLAG.FIXED]
  ,["<暴走+>時強化", "ほうそ+", 0, 2.6, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE]
  ,["<*暴走+>時強化", "ほうそ+", 1, 0.77, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE]
  ,["ダメージ無効", "ため", 1, 0, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.GIMMICK, TYPE.ZERO]
  ,["<*守護>時強化", "しゆこしき", 1, 0.01, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.GIMMICK]
  ,["熱情時強化", "ねつ", 1, 0.01, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.BUFF|EFFECT_FLAG.GIMMICK]
  ,["<*暴走>時防御強化", "ほうそ", 1, 0.7, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE]
  ,["<*暴走+>時防御強化", "ほうそ+", 1, 0.7, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE]
  ,["<*聖油>時弱化", "せい", 1, 0, 10000, EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE]
  ,["根性時強化[マガン]/根性時強化[Macan]", "こんし", 0, 2, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.BUFF]
  ,["非<*根性>時強化", "ひこ", 1, [1, 0.5], , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.NON_STATUS]
  ,["CS変更：打撃/Change CS Type: Blow", "CS", 0, 0, 3, EFFECT_FLAG.FIXED, TYPE.CSWEAPON]
  ,["CS変更：横一文字/Change CS Type: Long Slash", "CS", 0, 0, 7, EFFECT_FLAG.FIXED, TYPE.CSWEAPON]
  ,["本格コルク銃", "", 0, 1, , EFFECT_FLAG.EVENT|EFFECT_FLAG.FIXED, TYPE.ATK]
  ,["イカ焼き", "いかや", 0, 37, , EFFECT_FLAG.FIXED|EFFECT_FLAG.BUFF|EFFECT_FLAG.GIMMICK]
  ,["CS変更：無/Change CS Type: None", "CS", 0, 0, 9, EFFECT_FLAG.FIXED|EFFECT_FLAG.BUFF|EFFECT_FLAG.GIMMICK, TYPE.CSWEAPON]
  ,["魅了時弱化[AR]", "みり", 1, 3, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.DEBUFF]
  ,["特殊耐性[0.05]", "とくし", 1, 0.05, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.GIMMICK]
  ,["<暗闇>時強化", "くら", 0, 2.5, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE]
  ,["暗闇時強化", "くら", 1, 0.7, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.DEBUFF]
  ,["<憑依>時強化", "ひよ", 0, 91, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE]
  ,["非<憑依>時弱化", "ひひ", 0, [1, 0.1], , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.NON_STATUS]
  ,["デメリット[0.25]", "てめ", 0, 0.25, , EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE, TYPE.BONUS]
  ,["友情時強化", "ゆう", 0, 1.5, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE]
  ,["回数回避", "かいす", 1, 0.01, , EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.GIMMICK]
  ,["<*回数回避>無効化", "かいす", 1, 100, , EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.GIMMICK]
  ,["強化時超弱体", "きようかし", 0, 0.01, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.BUFF|EFFECT_FLAG.GIMMICK]
  ,["非<*加速>時強化", "ひか", 1, [1, 0.6], , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.NON_STATUS]
  ,["<*火傷>時弱化[ジェド]/火傷時弱化[Ded]", "やけ", 1, 1.5, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE]
  ,["祝福時強化", "しゆく", 0, 2, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.BUFF]
  ,["金剛時強化", "こんこ", 0, 1.5, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.BUFF]
  ,["悪い子弱体", "わる", 0, 0.01, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.GIMMICK]
  ,["<クリティカル>強化", "くり", 0, 2.5, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE]
  ,["被ダメージ増加[2.0]", "ひた", 1, 2, , EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.GIMMICK]
  ,["滋養時強化[AR]", "しよ", 1, 0.8, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.BUFF]
  ,["根性時強化[浅草AR]/根性時強化[Asakusa AR]", "こんし", 0, 1.5, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.BUFF]
  ,["特殊耐性[0.1]", "とくし", 1, 0.1, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.GIMMICK]
  ,["<剛力>時強化", "こうり", 0, 1.5, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE]
  ,["攻撃力微増[セト]/攻撃力微増[Seth]", "こうけひ", 0, 1.2, , EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE|EFFECT_FLAG.IRREMOVABLE]
  ,["無窮/Infinitude", "むき", 0, 1.3, , EFFECT_FLAG.STACKABLE|EFFECT_FLAG.ALT]
  ,["チョコ", "ちよ", 0, 3, , EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.GIMMICK]
  ,["チョコ", "ちよ", 1, 0.3, , EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.GIMMICK]
  ,["<*チョコ>に極大特攻", "ちよ", 0, 100, , EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE|EFFECT_FLAG.GIMMICK]
  ,["特防[0.05]/Bonus[0.05]", "とくほ", 1, 0.05, , EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE|EFFECT_FLAG.GIMMICK, TYPE.BONUS]
  ,["特殊耐性[0.12]", "とくし", 1, 0.12, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.GIMMICK]
  ,["悪魔の契約", "あく", 0, 6, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE]
  ,["悪魔の契約-<*契約の代償>", "あく", 1, 0.3, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE]
  ,["契約の代償-<*悪魔の契約>", "けいや", 1, 0, [0, 10000], EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.NON_STATUS]
  ,["弱体時強化[ヴォルフ]/弱体時強化[Volkh]", "しやくたいし", 1, 0.1, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.DEBUFF]
  ,["<呪い>時強化[ヴォルフ]/呪い時強化[Volkh]", "のろ", 0, 5, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE]
  ,["攻撃力低下", "こうけて", 0, 0.7, , EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE|EFFECT_FLAG.IRREMOVABLE]
  ,["非弱体時弱化", "ひし", 0, 0.5, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE, TYPE.NOT_DEBUFFED]
  ,["非弱体時弱化", "ひし", 1, 2.5, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE, TYPE.NOT_DEBUFFED]
  ,["特殊耐性[0.01]", "とくし", 1, 0.01, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.GIMMICK]
  ,["憑依/Possession", "ひよ", 0, 1, , EFFECT_FLAG.FIXED|EFFECT_FLAG.TOKEN]
  ,["疑念-<憑依>/Doubt", "きね", 0, [10, 0.1], , EFFECT_FLAG.FIXED]
  ,["非祈り時強化", "ひい", 0, 4, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.NON_STATUS]
  ,["非強化時弱化", "ひきようかしし", 1, 2.5, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE, TYPE.NOT_BUFFED]
  ,["怒時強化-<結縁：怒>", "いかり", 0, 1.5, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE]
  ,["特攻[1.67]/Bonus[1.67]", "とつ", 0, 1.67, , EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE, TYPE.BONUS]
  ,["発狂", "はつ", 1, 0, 400]
  ,["<*劫火>時強化", "こうか", 1, 0.35, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE]
  ,["×<*火傷>", "", 2, , , EFFECT_FLAG.FIXED|EFFECT_FLAG.TOKEN]
  ,["根性/Guts", "こんし", 1, 1, , EFFECT_FLAG.FIXED|EFFECT_FLAG.TOKEN]
  ,["加速/Acceleration", "かそ", 1, 1, , EFFECT_FLAG.FIXED|EFFECT_FLAG.TOKEN]
  ,["特殊耐性[0.05+2000]", "とくし", 1, 0.05, 2000, EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.GIMMICK]
  ,["見習い使い魔の応援", "みな", 0, 10, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.GIMMICK]
  ,["特防[0.4]/Bonus[0.4]", "とくほ", 1, 0.4, , EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE|EFFECT_FLAG.GIMMICK, TYPE.BONUS]
  ,["<滋養>時強化[アシガラ]/滋養時強化[Ashigara]", "しよ", 0, 2, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE]
  ,["滋養時強化[アシガラ]/滋養時強化[Ashigara]", "しよ", 1, 0.6, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.BUFF]
  ,["頑強時強化", "かん", 0, 0, 1000, EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.BUFF]
  ,["非<*妨害>時弱化", "ひほ", 1, [1, 4], , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.NON_STATUS]
  ,["妨害/Obstruct", "ほうか", 1, 1, , EFFECT_FLAG.FIXED|EFFECT_FLAG.TOKEN]
  ,["魅了時弱化[カトブレパス]/魅了時弱化[Catoblepas]", "みり", 1, 1.5, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.DEBUFF]
  ,["特攻[1.2]/Bonus[1.2]", "とつ", 0, 1.2, , EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE, TYPE.BONUS]
  ,["特防[0.08]/Bonus[0.08]", "とくほ", 1, 0.08, , EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE|EFFECT_FLAG.GIMMICK, TYPE.BONUS]
  ,["特防[2.0]/Bonus[2.0]", "とくほ", 1, 2, , EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE, TYPE.BONUS]
  ,["特殊耐性[0.1+4000]", "とくし", 1, 0.1, 4000, EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.GIMMICK]
  ,["特殊耐性[0.2]", "とくし", 1, 0.2, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.GIMMICK]
  ,["特攻[5.0]/Bonus[5.0]", "とつ", 0, 5, , EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE, TYPE.BONUS]
  ,["非強化時強化", "ひきようかしき", 1, 0.3, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE, TYPE.NOT_BUFFED]
  ,["<呪い>時強化[ジュウゴ]/呪い時強化[Jugo]", "のろ", 0, 6, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE]
  ,["<*烙印>時強化", "らく", 1, 0.2, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE]
  ,["射撃弱点/Weakness against shot", "しやけきし", 1, 2.5, 1 << 4, EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE, TYPE.WEAPON_WEAKNESS]
  ,["<火傷>時強化[テュポーン]/火傷時強化[Typhon]", "やけ", 0, 2.5, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE]
  ,["CS変更：射撃/Change CS Type: Shot", "CS", 0, 0, 4, EFFECT_FLAG.FIXED, TYPE.CSWEAPON]
  ,["汚れ", "よこ", 0, 0.5, , EFFECT_FLAG.FIXED|EFFECT_FLAG.DEBUFF|EFFECT_FLAG.GIMMICK]
  ,["<滋養>時強化[サルタヒコ]/滋養時強化[Sarutahiko]", "しよ", 0, 2.5, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE]
  ,["特殊耐性[0.01+4000]", "とくし", 1, 0.01, 4000, EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.GIMMICK]
  ,["全弱体特攻", "せん", 0, 1.4, , EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.BONUS_TO_DEBUFF]
  ,["<呪い>時強化[トウジ]/呪い時強化[Toji]", "のろ", 0, 6, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE]
  ,["注目時強化[アールプ]/注目時強化[Alp]", "ちゆ", 0, 1.5, , EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE|EFFECT_FLAG.IRREMOVABLE]
  ,["武器種変更：横一文字[弱体]/Change Weapon Type: Long Slash[Debuff]", "ふき", 0, 0, 7, EFFECT_FLAG.FIXED, TYPE.WEAPON]
  ,["攻撃力微増[アザトース]/攻撃力微増[Azathoth]", "こうけひ", 0, 1.2, , EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE|EFFECT_FLAG.IRREMOVABLE]
  ,["CS変更：横一文字[弱体]/Change CS Type: Long Slash[Debuff]", "CS", 0, 0, 7, EFFECT_FLAG.FIXED|EFFECT_FLAG.DEBUFF|EFFECT_FLAG.GIMMICK, TYPE.CSWEAPON]
  ,["デバフをくれなきゃイタズラするぞ！", "ては", 0, 10, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.GIMMICK, TYPE.NOT_DEBUFFED]
  ,["デバフをくれなきゃイタズラするぞ！", "ては", 1, 0.01, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.GIMMICK, TYPE.NOT_DEBUFFED]
  ,["バフをくれなきゃイタズラするぞ！", "はふ", 0, 10, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.GIMMICK, TYPE.NOT_BUFFED]
  ,["バフをくれなきゃイタズラするぞ！", "はふ", 1, 0.01, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.GIMMICK, TYPE.NOT_BUFFED]
  ,["凍結/Freeze", "とうけ", 1, 1.1, , EFFECT_FLAG.STACKABLE|EFFECT_FLAG.ALT]
  ,["火傷/Burn", "やけ", 1, 1, , EFFECT_FLAG.FIXED|EFFECT_FLAG.TOKEN|EFFECT_FLAG.STACKABLE]
  ,["特防[1.3]/Bonus[1.3]", "とくほ", 1, 1.3, , EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE, TYPE.BONUS]
  ,["弱体時強化[タンガロア∞]-<[その他の解除可能な弱体]>/弱体時強化[Tangaroa∞]", "しやくたいし", 0, 1.3, 0.5, EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE, TYPE.DEBUFF_OVERWRITE]
  ,["弱体時強化[タンガロア∞]-<*[その他の解除可能な弱体]>/弱体時強化[Tangaroa∞]", "しやくたいし", 1, 0.9, 0.9, EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE, TYPE.DEBUFF_OVERWRITE]
  ,["[その他の解除可能な弱体]/[Other removable debuffs]", "ん", 0, 1, , EFFECT_FLAG.FIXED|EFFECT_FLAG.TOKEN|EFFECT_FLAG.STACKABLE|EFFECT_FLAG.DEBUFF]
  ,["[その他の解除可能な弱体]/[Other removable debuffs]", "ん", 1, 1, , EFFECT_FLAG.FIXED|EFFECT_FLAG.TOKEN|EFFECT_FLAG.STACKABLE|EFFECT_FLAG.DEBUFF]
  ,["恐怖大特攻", "きようふ", 0, 2.5, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.BONUS_TO_DEBUFF]
  ,["特殊耐性[0.2+4000]", "とくし", 1, 0.2, 4000, EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.GIMMICK]
  ,["特殊耐性[0.01+1000]", "とくし", 1, 0.01, 1000, EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.GIMMICK]
  ,["攻撃力上昇[2.5]", "こうけし", 0, 2.5, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.GIMMICK]
  ,["攻撃力上昇[3.0]", "こうけし", 0, 3, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.GIMMICK]
  ,["攻撃力増加[聖夜]/Increase ATK[Xmas]", "こうけそ", 0, 1.1, 10000, EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.GIMMICK, , , 0]
  ,["武器種変更：射撃/Change Weapon Type: Shot", "ふき", 0, 0, 4, EFFECT_FLAG.FIXED, TYPE.WEAPON]
  ,["強化時防御力上昇", "きようかし", 1, 0.05, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.BUFF|EFFECT_FLAG.GIMMICK]
  ,["威圧特攻", "いあつ", 0, 1.4, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.BONUS_TO_DEBUFF]
  ,["<*発狂>時弱化", "はつ", 1, 3, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE]
  ,["攻撃力増加[次ターン]/Increase ATK[Next turn]", "こうけそ", 0, 2, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE]
  ,["×<攻撃力増加[ターン毎減少]>@1", "", 2, 1, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE]
  ,["×<攻撃力増加[ターン毎減少]>@2", "", 2, 2, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE]
  ,["×<攻撃力増加[ターン毎減少]>@3", "", 2, 3, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE]
  ,["×<攻撃力増加[ターン毎減少]>@4", "", 2, 4, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE]
  ,["×<攻撃力増加[ターン毎減少]>@5", "", 2, 5, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE]
  ,["攻撃力増加[ターン毎減少]/Increase ATK[Wanes each turn]", "こうけそ", 0, 1.6, , EFFECT_FLAG.IRREMOVABLE, TYPE.PROMPT]
  ,["攻撃力増加[イツァムナー]/Increase ATK[Itzamna]", "こうけそ", 0, 3.0, , EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.ALT, TYPE.PROMPT]
  ,["ブレーメンにゃ！", "ふれ", 1, 0.3, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.GIMMICK]
  ,["狼の応援（攻）", "おお", 0, 3, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.GIMMICK]
  ,["狼の応援（防）", "おお", 1, 0.3, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.GIMMICK]
  ,["攻撃力増加[バレ]/Increase ATK[Valentine]", "こうけそ", 0, 2, , EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE|EFFECT_FLAG.GIMMICK]
  ,["防御力増加[バレ]/防御力増加[Valentine]", "ほうきそ", 1, 0.4, , EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE|EFFECT_FLAG.GIMMICK]
  ,["食べちゃうぞ", "たへ", 1, 0.01, 10000, EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.GIMMICK]
  ,["魅了時弱化[ペルーン]/魅了時弱化[Perun]", "みり", 1, 3, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.DEBUFF]
  ,["斬撃・横一文字弱点", "さんけ", 1, 1.2, (1 << 1) | (1 << 7), EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE, TYPE.WEAPON_WEAKNESS]
  ,["特防[1.2]/Bonus[1.2]", "とくほ", 1, 1.2, , EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE, TYPE.BONUS]
  ,["打撃と斬撃と横一文字への大特防", "たけ", 1, 0.1, (1 << 3) | (1 << 1) | (1 << 7), EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE, TYPE.WEAPON_WEAKNESS]
  ,["射撃と狙撃への大特防", "しやけきと", 1, 0.1, (1 << 4) | (1 << 6), EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE, TYPE.WEAPON_WEAKNESS]
  ,["弱体無効時強化[☆3]", "しやくたいむ", 0, 3, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.BUFF]
  ,["弱体無効時強化[☆5]", "しやくたいむ", 0, 5, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.BUFF]
  ,["全域大特防", "せん", 1, 0.1, (1 << 8), EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE, TYPE.WEAPON_WEAKNESS]
  ,["特殊耐性[0.01+10000]", "とくし", 1, 0.01, 10000, EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.GIMMICK]
  ,["特殊耐性[0.08+8000]", "とくし", 1, 0.08, 8000, EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.GIMMICK]
  ,["攻撃力増加[リフレイン]/Increase ATK[Refrain]", "こうけそ", 0, 1.4, , EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.GIMMICK]
  ,["被ダメージ増加[リフレイン]/被ダメージ増加[Refrain]", "ひた", 1, 0, 20000, EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.GIMMICK]
  ,["攻撃力増加[タンガロア∞]/Increase ATK[Tangaroa∞]", "こうけそ", 0, 2, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.GIMMICK]
  ,["防御力増加[タンガロア∞]/防御力増加[Tangaroa∞]", "ほうきそ", 1, 0.5, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.GIMMICK]
  ,["外壁", "かいへ", 1, 0.9, , EFFECT_FLAG.IRREMOVABLE, , -0.15]
  ,["<*弱点>特攻", "しやくて", 0, 1.4, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE]
  ,["係留時強化", "けいり", 0, 1.5, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.BUFF]
  ,["被ダメージ増加[1.2]", "ひた", 1, 1.2, , EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.GIMMICK]
  ,["マシンボディ特攻", "まし", 0, 2.0, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE]
  ,["<*火傷>時弱化[英雄の例外処理=ジェド]/火傷時弱化[Valiant Exception]", "やけ", 1, 1.5, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.GIMMICK]
  ,["火傷/Burn", "やけ", 0, 1, , EFFECT_FLAG.FIXED|EFFECT_FLAG.TOKEN]
  ,["非<火傷>時強化", "ひや", 0, [1, 2], , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.NON_STATUS]
  ,["<意気>時強化", "いき", 0, 0, 1200, EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE]
  ,["特殊耐性[0.01+1]", "とくし", 1, 0.01, 1, EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.GIMMICK]
  ,["<*頑強>時弱化", "かん", 1, 3.5, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.GIMMICK]
  ,["<*守護>時弱化", "しゆこしし", 1, 3.5, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.GIMMICK]
  ,["[ATKの種+1000]/[ATK Seed +1000]", "", 0, , 1000, EFFECT_FLAG.FIXED, TYPE.SEED]
  ,["[ATKの種+2000]/[ATK Seed +2000]", "", 0, , 2000, EFFECT_FLAG.FIXED, TYPE.SEED]
  ,["<連撃>時強化", "れん", 0, 2, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE]
],[
  ["攻撃力増加[ターン毎減少]", "TOTAL TURN", "T", 1, 999,
    [[1, 1.6]
    ,[1, 1.5]
    ,[1, 1.4]
    ,[1, 1.3]
    ,[0, 1.2]
  ]]
  ,["攻撃力増加[イツァムナー]", "イツァムナーのCP/Itzamna's CP", "CP", 0, 100,
    [[10, 1.2]
    ,[10, 1.4]
    ,[10, 1.6]
    ,[10, 1.8]
    ,[10, 2.0]
    ,[10, 2.2]
    ,[10, 2.4]
    ,[10, 2.6]
    ,[10, 2.8]
    ,[11, 3.0]
  ]]
]);