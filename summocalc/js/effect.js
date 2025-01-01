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
  REVERSAL: 19
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
  ALT: 1 << 12,
  
  AFFILIATION: 1 << 14
};

var WEAPON_FLAG = {
  SLASH: 1 << 1,
  THRUST: 1 << 2,
  BLOW: 1 << 3,
  SHOT: 1 << 4,
  MAGIC: 1 << 5,
  SNIPE: 1 << 6,
  LONGSLASH: 1 << 7,
  ALL: 1 << 8,
  NONE: 1 << 9
};

var PROMPT_TYPE = {
  HP: 0,
  CP: 1,
  TURN: 2,
  SQUARE: 3
};

function Effect(index, x, link, equ){
  this.index = index;
  this.link = link;
  this.equ = equ;
  this.name = x[0].replace(/#\d/, "");
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
    if(v.length){
      this.baseValue.push(v[(this.flag & EFFECT_FLAG.NON_STATUS || [TYPE.NOT_BUFFED, TYPE.NOT_DEBUFFED].indexOf(this.type) !== -1) ? 1 : 0]);
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
  this.sortkey = 2;
  if(this.isToken()){
    this.sortkey = 4;
  }else if(this.event){
    this.sortkey = 7;
  }else if(this.gimmick){
    this.sortkey = 6;
  }else if(this.type === TYPE.BONUS){
    this.sortkey = 3;
  }else if(this.type === TYPE.CUSTOM){
    this.sortkey = 8;
  }else if(this.isAffiliation()){
    this.sortkey = 1;
  }else if(!this.reading){
    this.sortkey = 0;
  }else if(this.flag & EFFECT_FLAG.IRREMOVABLE){
    this.sortkey = 5;
  }
  switch(this.type){
    case TYPE.BONUS:
    case TYPE.IGNORE:
      if(!this.group) this.subset = new Map();
      break;
    case TYPE.WEAPON:
    case TYPE.CSWEAPON:
      this.weaponOrder = WEAPON.ORDER.indexOf(this.baseValue[1]);
      break;
  }
  this.csOnly = false;
}
Effect.prototype = {
  toString: function(){
    return (this.event ? "◎" : this.gimmick ? "☆" : "") + t(this.name) + (this.csOnly ? "[CS]" : "") || "－";
  },
  _getValue: function(m, lv, oldmode, condition){
    var value = this.value[m];
    if(this.type !== TYPE.DEBUFF_OVERWRITE){
      if(value.length){
        value = value[condition ? 0 : 1];
      }else if(this.link && !condition){
        value = new Fraction(0);
      }
    }
    if(oldmode && !m && this.canOld){
      return value.mul(100, 100 + lv);
    }else{
      return value.add(this.growth[m].mul(lv, 100));
    }
  },
  getValue: function(lv, oldmode, condition){
    if(this.promptData){
      return this.promptData.getValue(lv);
    }
    if(this.isAffiliation()) lv *= 10;
    return [
      this._getValue(0, lv, oldmode, condition),
      this._getValue(1, lv, oldmode, condition)
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
  isAlt: function(){
    return this.flag & EFFECT_FLAG.ALT;
  },
  isAffiliation: function(){
    return this.flag & EFFECT_FLAG.AFFILIATION;
  },
  hasHpRef: function(){
    if(this.promptData) return this.promptData.type === PROMPT_TYPE.HP;
    return this.type === TYPE.LIMIT
  }
};
Effect.createList = function(a, pd){
  var table = new Map();
  var result = [];
  var order = [];
  var orderData = [];
  var labels = [];
  var k = [];
  var ek = [];
  var en = false;
  var f = function(a, b){
    var x = result[a];
    var y = result[b];
    if(x.sortkey !== y.sortkey) return x.sortkey - y.sortkey;
    if(x.group !== y.group) return x.group - y.group;
    if(x.sortkey === 1 || x.sortkey > 6) return x.index - y.index;
    if(x.sortkey === 3 || !x.sortkey || k[a] === k[b]){
      if(x.weaponOrder && y.weaponOrder) return x.weaponOrder - y.weaponOrder;
      return x.baseValue[0] - y.baseValue[0] || x.baseValue[1] - y.baseValue[1] || x.index - y.index;
    }
    if(en) return ek[a] < ek[b] ? -1 : 1;
    if(x.reading === y.reading) return x.index - y.index;
    return x.reading < y.reading ? -1 : 1;
  };
  a.forEach(function(v, i){
    if(v.shift() !== i) throw new Error("効果のインデックスが正しくありません（" + i + "）");
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
    k.push(t(v[0], 0).replace(/(\[[^\]]+\]|：.+|[小中大]UP)$/, "") || v[1]);
    ek.push(t(v[0], 1).replace(/^(?:\[Nullify|Slight|Moderate|Drastic) (Multiple Evasion\]|ATK Up)$/, "$1").toUpperCase());
  });
  for(var i = 0; i < 2; i++){
    order.push(orderData.reduce(function(a, x){return a.concat(x.sort(f))}, []));
    en = true;
  }
  pd.forEach(function(v){
    result[table.get(v[0])].promptData = new PromptData(v);
  });
  result.LOCALE_ORDER = order;
  labels.push(["システム/System", "所属タグ/Affiliation", "一般/General", "特攻/Attack Advantage", "その他/Others", "解除不可/Irremovable", "クエストギミック/Quest Gimmick", "イベント/Event", "カスタム/Customizable"]);
  labels.push(["", "所属タグ/Affiliation", "一般/General", "特防/Defense Advantage"].concat(labels[0].slice(4)));
  result.LABELS = labels;
  result.table = table;
  return result;
};

function PromptData(x){
  var sum = 0;
  this.title = x[1];
  this.type = x[2];
  this.data = x[3].map(function(v){
    sum += v[0];
    return [v[0], [new Fraction(v[1] * 100, 100), new Fraction(v[2] * 100, 100)]];
  });
  switch(this.type){
    case PROMPT_TYPE.TURN:
      this.min = 1;
      this.max = 999;
      break;
    case PROMPT_TYPE.CP:
      this.min = 0;
      this.max = 100;
      break;
    case PROMPT_TYPE.SQUARE:
      this.min = 0;
      this.max = sum - 1;
      break;
  }
  if(this.max) this.threshold = this.min + sum;
}
PromptData.prototype = {
  prompt: function(ep){
    var lv = -1;
    if(this.type === PROMPT_TYPE.HP){
      return ep.hpPrompt(this.title) || null;
    }else{
      while(lv < this.min || lv > this.max || isNaN(lv)){
        lv = prompt(t(this.title) + t(" (※/\n(") + this.min + t("〜/-") + this.max + ")");
        if(!lv) return null;
        lv = parseInt(lv, 10);
      }
      return lv;
    }
  },
  getDataNum: function(lv){
    var n = 0;
    if(this.type === PROMPT_TYPE.HP) return lv;
    lv -= this.min;
    this.data.some(function(v, i){
      lv -= v[0];
      n = i;
      return lv < 0;
    });
    return n;
  },
  getDataNumFromHp: function(hp, maxHp){
    var n = 0;
    var p = hp * 100 / maxHp;
    this.data.some(function(v, i){
      if(v[0][0] === p || (v[0][1] < p && p < v[0][2])){
        n = i;
        return true;
      }
      return false;
    });
    return n;
  },
  getValue: function(lv){
    return this.data[this.getDataNum(lv)][1];
  },
  getLabel: function(ep){
    var pre = "[";
    var post = "";
    switch(this.type){
      case PROMPT_TYPE.HP:
        return "[HP:" + ep.hp + "/" + ep.maxHp + "]";
      case PROMPT_TYPE.CP:
        pre = "[CP:";
        break;
      case PROMPT_TYPE.TURN:
        pre = "[T:";
        break;
      case PROMPT_TYPE.SQUARE:
        post = t("マス/ square");
        break;
    }
    if(ep.lv < this.threshold) return pre + ep.lv + post + "]";
    return pre + this.threshold + post + "+]";
  }
};

var EFFECT_MAX = 10000;

var EFFECT = Effect.createList(
  //インデックス, 名前, 読み, グループ, 乗算基本値, 加算基本値, フラグ=0, タイプ=TYPE.NORMAL, 乗算成長率=undefined, 加算成長率=undefined
  [[0, "", "", -1, 1, 0]
  ,[1, "[ATKの種]/[ATK Seed]", "", 0, , , EFFECT_FLAG.FIXED, TYPE.SEED]
  ,[2, "結縁：怒/Affinity: Anger", "", 0, 1.1, , EFFECT_FLAG.LV1]
  ,[3, "意気/Spirit", "いき", 0, 0, 400]
  ,[4, "回避/Evasion", "かい", 1, 0.01]
  ,[5, "<*回避>に貫通/Ignore Evasion", "かい", 0, 100, , EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE, TYPE.IGNORE]
  ,[6, "頑強/Tenacity", "かん", 1, 0.9]
  ,[7, "<*頑強>に貫通/Ignore Tenacity", "かん", 0, 2.22, , EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE, TYPE.IGNORE]
  ,[8, "極限/Limit", "きよく", 0, 1, , , TYPE.LIMIT]
  ,[9, "崩し/Break", "くす", 1, 1.2]
  ,[10, "暗闇/Darkness", "くら", 0, 0.9]
  ,[11, "クリティカル/Critical", "くり", 0, 2]
  ,[12, "クリティカル+/Critical+", "くり", 0, 2.5]
  ,[13, "クリティカル++/Critical++", "くり", 0, 3]
  ,[14, "激怒/Rage", "けき", 0, 1.25]
  ,[15, "激怒/Rage", "けき", 1, 1.25]
  ,[16, "激怒+/Rage+", "けき+", 0, 1.25]
  ,[17, "激怒+/Rage+", "けき+", 1, 1.25, , EFFECT_FLAG.FIXED]
  ,[18, "幻惑/Dazzle", "けん", 0, 0.7]
  ,[19, "攻撃強化/ATK Up", "こうけ", 0, 1.1]
  ,[20, "剛力/Brawn", "こうり", 0, 1.15]
  ,[21, "金剛/Adamantine", "こん", 1, 0.9]
  ,[22, "<*金剛>に貫通/Ignore Adamantine", "こん", 0, 2.22, , EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE, TYPE.IGNORE]
  ,[23, "弱点/Weakness", "しや", 1, 1.2]
  ,[24, "集中/Concentration", "しゆう", 0, 1.1]
  ,[25, "守護/Protection", "しゆ", 1, 0.9]
  ,[26, "<*守護>に貫通/Ignore Protection", "しゆこ", 0, 2.22, , EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE, TYPE.IGNORE]
  ,[27, "滋養/Nourishment", "しよ", 0, 1.1, , , , 0.4]
  ,[28, "聖油/Unction", "せい", 1, 0.85]
  ,[29, "<*聖油>に貫通/Ignore Unction", "せい", 0, 2.35, , EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE, TYPE.IGNORE]
  ,[30, "束縛/Bind", "そく", 0, 0.9]
  ,[31, "×<*凍結>", "とう", 2]
  ,[32, "闘志/Vigor", "とう", 0, 1.2]
  ,[33, "毒反転/Poison Reversal", "とく", 0, 2, , EFFECT_FLAG.FIXED|EFFECT_FLAG.DEBUFF]
  ,[34, "毒反転/Poison Reversal", "とく", 1, 0.6, , EFFECT_FLAG.FIXED|EFFECT_FLAG.DEBUFF]
  ,[35, "特防[0.01]/Advantage[0.01]", "とくほ", 1, 0.01, , EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE|EFFECT_FLAG.GIMMICK, TYPE.BONUS]
  ,[36, "特防[0.1]/Advantage[0.1]", "とくほ", 1, 0.1, , EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE, TYPE.BONUS]
  ,[37, "特防[0.2]/Advantage[0.2]", "とくほ", 1, 0.2, , EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE|EFFECT_FLAG.GIMMICK, TYPE.BONUS]
  ,[38, "特防[0.3]/Advantage[0.3]", "とくほ", 1, 0.3, , EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE, TYPE.BONUS]
  ,[39, "特防[0.5]/Advantage[0.5]", "とくほ", 1, 0.5, , EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE, TYPE.BONUS]
  ,[40, "特防[0.6]/Advantage[0.6]", "とくほ", 1, 0.6, , EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE, TYPE.BONUS]
  ,[41, "特防[0.7]/Advantage[0.7]", "とくほ", 1, 0.7, , EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE, TYPE.BONUS]
  ,[42, "特防[0.8]/Advantage[0.8]", "とくほ", 1, 0.8, , EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE, TYPE.BONUS]
  ,[43, "特防[1.7]/Advantage[1.7]", "とくほ", 1, 1.7, , EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE|EFFECT_FLAG.GIMMICK, TYPE.BONUS]
  ,[44, "特防[10.0]/Advantage[10.0]", "とくほ", 1, 10, , EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE|EFFECT_FLAG.GIMMICK, TYPE.BONUS]
  ,[45, "特攻[1.4]/Advantage[1.4]", "とつ", 0, 1.4, , EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE, TYPE.BONUS]
  ,[46, "特攻[1.5]/Advantage[1.5]", "とつ", 0, 1.5, , EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE, TYPE.BONUS]
  ,[47, "特攻[1.6]/Advantage[1.6]", "とつ", 0, 1.6, , EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE, TYPE.BONUS]
  ,[48, "特攻[2.0]/Advantage[2.0]", "とつ", 0, 2, , EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE, TYPE.BONUS]
  ,[49, "特攻[2.3]/Advantage[2.3]", "とつ", 0, 2.3, , EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE, TYPE.BONUS]
  ,[50, "特攻[2.5]/Advantage[2.5]", "とつ", 0, 2.5, , EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE, TYPE.BONUS]
  ,[51, "特攻[3.0]/Advantage[3.0]", "とつ", 0, 3, , EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE, TYPE.BONUS]
  ,[52, "特攻[4.0]/Advantage[4.0]", "とつ", 0, 4, , EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE, TYPE.BONUS]
  ,[53, "熱情/Ardor", "ねつ", 0, 1.2]
  ,[54, "呪い/Curse", "のろ", 0, 0.8]
  ,[55, "武器種変更：斬撃/Weapon Change: Slash", "ふき", 0, 0, 1, EFFECT_FLAG.FIXED, TYPE.WEAPON]
  ,[56, "武器種変更：突撃/Weapon Change: Thrust", "ふき", 0, 0, 2, EFFECT_FLAG.FIXED, TYPE.WEAPON]
  ,[57, "武器種変更：打撃/Weapon Change: Blow", "ふき", 0, 0, 3, EFFECT_FLAG.FIXED, TYPE.WEAPON]
  ,[58, "武器種変更：魔法/Weapon Change: Magic", "ふき", 0, 0, 5, EFFECT_FLAG.FIXED, TYPE.WEAPON]
  ,[59, "武器種変更：狙撃/Weapon Change: Snipe", "ふき", 0, 0, 6, EFFECT_FLAG.FIXED, TYPE.WEAPON]
  ,[60, "武器種変更：横一文字/Weapon Change: Long Slash", "ふき", 0, 0, 7, EFFECT_FLAG.FIXED, TYPE.WEAPON]
  ,[61, "武器種変更：全域/Weapon Change: All", "ふき", 0, 0, 8, EFFECT_FLAG.FIXED, TYPE.WEAPON]
  ,[62, "武器種変更：無/Weapon Change: None", "ふき", 0, 0, 9, EFFECT_FLAG.FIXED, TYPE.WEAPON]
  ,[63, "防御強化/DEF Up", "ほうき", 1, 0.9]
  ,[64, "<*防御強化>に貫通/Ignore DEF Up", "ほうき", 0, 2.22, , EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE, TYPE.IGNORE]
  ,[65, "暴走/Berserk", "ほうそ", 0, 1.3]
  ,[66, "暴走/Berserk", "ほうそ", 1, 1.3]
  ,[67, "暴走+/Berserk+", "ほうそ+", 0, 1.3]
  ,[68, "暴走+/Berserk+", "ほうそ+", 1, 1.3, , EFFECT_FLAG.FIXED]
  ,[69, "マヒ/Paralysis", "まひ", 0, 0.9]
  ,[70, "×<無窮>", "むき", 2]
  ,[71, "烙印/Stigma", "らく", 1, 1.15]
  ,[72, "連撃/Combo", "れん", 0, 0.6, , EFFECT_FLAG.FIXED, TYPE.COMBO]
  ,[73, "攻撃力小UP/Slight ATK Up", "こうけ", 0, 0, 250, EFFECT_FLAG.BUFF|EFFECT_FLAG.GIMMICK]
  ,[74, "攻撃力中UP/Moderate ATK Up", "こうけ", 0, 0, 500, EFFECT_FLAG.BUFF|EFFECT_FLAG.GIMMICK]
  ,[75, "攻撃力大UP/Drastic ATK Up", "こうけ", 0, 0, 1000, EFFECT_FLAG.BUFF|EFFECT_FLAG.GIMMICK]
  ,[76, "CS変更：全域/Change CS: All", "CS", 0, 0, 8, EFFECT_FLAG.FIXED, TYPE.CSWEAPON]
  ,[77, "おせち/New Year's Feast", "おせ", 0, 1.2, 50, EFFECT_FLAG.STACKABLE|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.GIMMICK, , 0]
  ,[78, "おせち/New Year's Feast", "おせ", 1, 0.8, , EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.GIMMICK]
  ,[79, "負傷/Wound", "ふし", 0, 0.2, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.GIMMICK]
  ,[80, "ミンスパイ", "", 0, 1.5, , EFFECT_FLAG.EVENT|EFFECT_FLAG.FIXED]
  ,[81, "結縁：怒[ジェイル]/Affinity: Anger[V.Jail]", "", 0, 1.2, , EFFECT_FLAG.EVENT|EFFECT_FLAG.LV1]
  ,[82, "陣形：隊列歩行[L][ジャンダルム]/Formation: Single-File[L][Gendarme]", "", 0, 0.5, , EFFECT_FLAG.EVENT|EFFECT_FLAG.FIXED, TYPE.ATK]
  ,[83, "陣形：隊列歩行[M][ジャンダルム]/Formation: Single-File[M][Gendarme]", "", 1, 0.5, , EFFECT_FLAG.EVENT|EFFECT_FLAG.FIXED]
  ,[84, "陣形：トラバース[ジャンダルム]/Formation: Criss-Cross[Gendarme]", "", 0, 0.3, , EFFECT_FLAG.EVENT|EFFECT_FLAG.FIXED, TYPE.ATK]
  ,[85, "陣形：タクティクス[M][ジャンダルム]/Formation: Tactical[M][Gendarme]", "", 0, 0.5, , EFFECT_FLAG.EVENT|EFFECT_FLAG.FIXED, TYPE.ATK]
  ,[86, "陣形：シージ[L][ジャンダルム]/Formation: Siege[L][Gendarme]", "", 1, 0.5, , EFFECT_FLAG.EVENT|EFFECT_FLAG.FIXED]
  ,[87, "陣形：シージ[M][ジャンダルム]/Formation: Siege[M][Gendarme]", "", 1, 0.7, , EFFECT_FLAG.EVENT|EFFECT_FLAG.FIXED]
  ,[88, "剣豪フランクフルト", "", 0, 1, , EFFECT_FLAG.EVENT|EFFECT_FLAG.FIXED, TYPE.ATK]
  ,[89, "編成ボーナス[突撃]/編成ボーナス[Thrust]", "", 0, 0, 300, EFFECT_FLAG.EVENT|EFFECT_FLAG.FIXED, TYPE.ATK]
  ,[90, "試練の石・ATK減", "", 0, 0, -1000, EFFECT_FLAG.EVENT|EFFECT_FLAG.FIXED, TYPE.ATK]
  ,[91, "ATKボーナス[30%]", "", 0, 0.3, , EFFECT_FLAG.EVENT|EFFECT_FLAG.FIXED, TYPE.ATK]
  ,[92, "ATKボーナス[50%]", "", 0, 0.5, , EFFECT_FLAG.EVENT|EFFECT_FLAG.FIXED, TYPE.ATK]
  ,[93, "ATKボーナス[100%]", "", 0, 1, , EFFECT_FLAG.EVENT|EFFECT_FLAG.FIXED, TYPE.ATK]
  ,[94, "強化反転-<[その他の解除可能な強化]>/Buff Reversal", "きよう", 0, [0.25, 1], , EFFECT_FLAG.FIXED, TYPE.REVERSAL]
  ,[95, "強化反転-<*[その他の解除可能な強化]>/Buff Reversal", "きよ", 1, [2.5, 1], , EFFECT_FLAG.FIXED, TYPE.REVERSAL]
  ,[96, "攻撃力減少/Reduced ATK", "こうけけ", 0, 0.01, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE]
  ,[97, "特攻[6.0]/Advantage[6.0]", "とつ", 0, 6, , EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE, TYPE.BONUS]
  ,[98, "CS変更：魔法/Change CS: Magic", "CS", 0, 0, 5, EFFECT_FLAG.FIXED, TYPE.CSWEAPON]
  ,[99, "攻撃力微増[AR]/Minor ATK Increase[AR]", "こうけひ", 0, 1.13, , EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE|EFFECT_FLAG.IRREMOVABLE]
  ,[100, "[カスタム]/[Customizable]", "", 0, 1, , EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE, TYPE.CUSTOM]
  ,[101, "[カスタム]/[Customizable]", "", 1, 1, , EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE, TYPE.CUSTOM]
  ,[102, "<束縛>時強化/Bind Strengthening", "そくはくしき", 0, 10, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE]
  ,[103, "特攻[1.3]/Advantage[1.3]", "とつ", 0, 1.3, , EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE, TYPE.BONUS]
  ,[104, "<*守護>無効化/Nullify Protection", "しゆこ", 1, 2.22, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE]
  ,[105, "<*防御強化>無効化/Nullify DEF Up", "ほうきよき", 1, 2.22, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE]
  ,[106, "劫火-<*火傷>/Conflagration", "こう", 1, 0, 3000, EFFECT_FLAG.FIXED]
  ,[107, "<暴走+>時強化/Berserk+ Strengthening", "ほうそ+", 0, 2.6, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE]
  ,[108, "<*暴走+>時強化/Berserk+ Strengthening", "ほうそ+", 1, 0.77, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE]
  ,[109, "ダメージ無効/Nullify Damage", "ため", 1, 0, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.GIMMICK, TYPE.ZERO]
  ,[110, "<*守護>時強化[竜宮]/Protection Strengthening[Virtual]", "しゆこしき", 1, 0.01, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.GIMMICK]
  ,[111, "熱情時強化[竜宮]/Ardor Strengthening[Virtual]", "ねつ", 1, 0.01, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.BUFF|EFFECT_FLAG.GIMMICK]
  ,[112, "<*暴走>時防御強化/DEF Up when Berserk", "ほうそ", 1, 0.7, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE]
  ,[113, "<*暴走+>時防御強化/DEF Up when Berserk+", "ほうそ+", 1, 0.7, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE]
  ,[114, "<*聖油>時弱化/Unction Weakening", "せい", 1, 0, 10000, EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE]
  ,[115, "根性時強化[マガン]/Guts Strengthening[Macan]", "こんし", 0, 2, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.BUFF]
  ,[116, "非<*根性>時強化/Non-Guts Strengthening", "ひこ", 1, [1, 0.5], , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.NON_STATUS]
  ,[117, "CS変更：打撃/Change CS: Blow", "CS", 0, 0, 3, EFFECT_FLAG.FIXED, TYPE.CSWEAPON]
  ,[118, "CS変更：横一文字/Change CS: Long Slash", "CS", 0, 0, 7, EFFECT_FLAG.FIXED, TYPE.CSWEAPON]
  ,[119, "本格コルク銃", "", 0, 1, , EFFECT_FLAG.EVENT|EFFECT_FLAG.FIXED, TYPE.ATK]
  ,[120, "イカ焼き", "いか", 0, 37, , EFFECT_FLAG.FIXED|EFFECT_FLAG.BUFF|EFFECT_FLAG.GIMMICK]
  ,[121, "CS変更：無/Change CS: None", "CS", 0, 0, 9, EFFECT_FLAG.FIXED, TYPE.CSWEAPON]
  ,[122, "魅了時弱化[AR]/Charm Weakening[AR]", "みりようしし", 1, 3, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.DEBUFF]
  ,[123, "特殊耐性[0.05]/Special Resistance[0.05]", "とくし", 1, 0.05, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.GIMMICK]
  ,[124, "<暗闇>時強化[シヴァ]/Darkness Strengthening[Shiva]", "くらやみし", 0, 2.5, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE]
  ,[125, "暗闇時強化[シヴァ]/Darkness Strengthening[Shiva]", "くら", 1, 0.7, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.DEBUFF]
  ,[126, "<憑依>時強化[エリイ]/Possession Strengthening[Ellie]", "ひよ", 0, 91, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE]
  ,[127, "非<憑依>時弱化/Non-Possession Weakening", "ひひ", 0, [1, 0.1], , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.NON_STATUS]
  ,[128, "デメリット[0.25]/Demerit[0.25]", "てめ", 0, 0.25, , EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE, TYPE.BONUS]
  ,[129, "友情時強化/Friendship Strengthening", "ゆう", 0, 1.5, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE]
  ,[130, "回数回避/Multiple Evasion", "かい", 1, 0.01, , EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.GIMMICK]
  ,[131, "[<*回数回避>無効化]/[Nullify Multiple Evasion]", "かい", 1, 100, , EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.GIMMICK]
  ,[132, "強化時超弱体/Extreme Buff Weakening", "きよ", 0, 0.01, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.BUFF|EFFECT_FLAG.GIMMICK]
  ,[133, "非<*加速>時強化/Non-Acceleration Strengthening", "ひか", 1, [1, 0.6], , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.NON_STATUS]
  ,[134, "<*火傷>時弱化[ジェド]/Burn Weakening[Ded]", "やけ", 1, 1.5, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE]
  ,[135, "祝福時強化[チョウジ]/Blessing Strengthening[Choji]", "しゆく", 0, 2, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.BUFF]
  ,[136, "金剛時強化/Adamantine Strengthening", "こんこ", 0, 1.5, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.BUFF]
  ,[137, "悪い子弱体/Naughty Kid Weakening", "わる", 0, 0.01, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.GIMMICK]
  ,[138, "<クリティカル>強化/Critical Strengthening", "くり", 0, 2.5, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE]
  ,[139, "被ダメージ増加[2.0]/Increased Incoming Damage[2.0]", "ひた", 1, 2, , EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.GIMMICK]
  ,[140, "滋養時強化[一杯AR]/Nourishment Strengthening[Ventures AR]", "しよ", 1, 0.8, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.BUFF]
  ,[141, "根性時強化[浅草AR]/Guts Strengthening[Asakusa AR]", "こんし", 0, 1.5, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.BUFF]
  ,[142, "特殊耐性[0.1]/Special Resistance[0.1]", "とくし", 1, 0.1, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.GIMMICK]
  ,[143, "<剛力>時強化/Brawn Strengthening", "こうり", 0, 1.5, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE]
  ,[144, "攻撃力微増[セト]/Minor ATK Increase[Seth]", "こうけひ", 0, 1.2, , EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE|EFFECT_FLAG.IRREMOVABLE]
  ,[145, "無窮/Infinitude", "むき", 0, 1.3, , EFFECT_FLAG.STACKABLE|EFFECT_FLAG.ALT]
  ,[146, "チョコ", "ちよこ", 0, 3, , EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.GIMMICK]
  ,[147, "チョコ", "ちよ", 1, 0.3, , EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.GIMMICK]
  ,[148, "<*チョコ>に極大特攻", "ちよこに", 0, 100, , EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE|EFFECT_FLAG.GIMMICK]
  ,[149, "特防[0.05]/Advantage[0.05]", "とくほ", 1, 0.05, , EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE|EFFECT_FLAG.GIMMICK, TYPE.BONUS]
  ,[150, "特殊耐性[0.12]/Special Resistance[0.12]", "とくし", 1, 0.12, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.GIMMICK]
  ,[151, "悪魔の契約/Demonic Pact", "あく", 0, 6, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE]
  ,[152, "悪魔の契約-<*契約の代償>/Demonic Pact", "あく", 1, 0.3, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE]
  ,[153, "契約の代償-<*悪魔の契約>/Contractual Dues", "けいや", 1, 0, [0, 10000], EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.NON_STATUS]
  ,[154, "弱体時強化[ヴォルフ]/Debuff Strengthening[Volkh]", "しやく", 1, 0.1, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.DEBUFF]
  ,[155, "<呪い>時強化[ヴォルフ]/Curse Strengthening[Volkh]", "のろ", 0, 5, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE]
  ,[156, "攻撃力低下/ATK Reduction", "こうけて", 0, 0.7, , EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE|EFFECT_FLAG.IRREMOVABLE]
  ,[157, "非弱体時弱化/Non-Debuff Weakening", "ひしやくたいしし", 0, [1, 0.5], , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE, TYPE.NOT_DEBUFFED]
  ,[158, "非弱体時弱化/Non-Debuff Weakening", "ひし", 1, [1.9, 2.5], , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE, TYPE.NOT_DEBUFFED]
  ,[159, "特殊耐性[0.01]/Special Resistance[0.01]", "とくし", 1, 0.01, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.GIMMICK]
  ,[160, "憑依/Possession", "ひよ", 0, 1, , EFFECT_FLAG.FIXED|EFFECT_FLAG.TOKEN]
  ,[161, "疑念-<憑依>/Doubt", "きね", 0, [10, 0.1], , EFFECT_FLAG.FIXED]
  ,[162, "非祈り時強化/Non-Prayer Strengthening", "ひい", 0, 4, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.NON_STATUS]
  ,[163, "非強化時弱化[クニヨシ]/Non-Buff Weakening[Kuniyoshi]", "ひきようかしし", 1, [1, 2.5], , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE, TYPE.NOT_BUFFED]
  ,[164, "怒時強化-<結縁：怒>/Anger Strengthening", "いか", 0, 1.5, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE]
  ,[165, "特攻[1.67]/Advantage[1.67]", "とつ", 0, 1.67, , EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE, TYPE.BONUS]
  ,[166, "発狂/Madness", "はつ", 1, 0, 400]
  ,[167, "<*劫火>時強化#1/Conflagration Strengthening", "こうか", 1, 0.35, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE]
  ,[168, "×<*火傷>", "", 2, , , EFFECT_FLAG.FIXED|EFFECT_FLAG.TOKEN]
  ,[169, "根性/Guts", "こん", 1, 1, , EFFECT_FLAG.FIXED|EFFECT_FLAG.TOKEN]
  ,[170, "加速/Acceleration", "かそ", 1, 1, , EFFECT_FLAG.FIXED|EFFECT_FLAG.TOKEN]
  ,[171, "特殊耐性[0.05+2000]/Special Resistance[0.05+2000]", "とくし", 1, 0.05, 2000, EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.GIMMICK]
  ,[172, "見習い使い魔の応援/Support of Apprentice Familiar", "みな", 0, 10, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.GIMMICK]
  ,[173, "特防[0.4]/Advantage[0.4]", "とくほ", 1, 0.4, , EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE|EFFECT_FLAG.GIMMICK, TYPE.BONUS]
  ,[174, "<滋養>時強化[アシガラ]/Nourishment Strengthening[Ashigara]", "しよ", 0, 2, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE]
  ,[175, "滋養時強化[アシガラ]/Nourishment Strengthening[Ashigara]", "しよ", 1, 0.6, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.BUFF]
  ,[176, "頑強時強化[タンガロア]/Tenacity Strengthening[Tangaroa]", "かん", 0, 0, 1000, EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.BUFF]
  ,[177, "非<*妨害>時弱化/Non-Obstruct Weakening", "ひほ", 1, [1, 4], , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.NON_STATUS]
  ,[178, "妨害/Obstruct", "ほう", 1, 1, , EFFECT_FLAG.FIXED|EFFECT_FLAG.TOKEN]
  ,[179, "魅了時弱化[カトブレパス]/Charm Weakening[Catoblepas]", "みりようしし", 1, 1.5, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.DEBUFF]
  ,[180, "特攻[1.2]/Advantage[1.2]", "とつ", 0, 1.2, , EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE, TYPE.BONUS]
  ,[181, "特防[0.08]/Advantage[0.08]", "とくほ", 1, 0.08, , EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE|EFFECT_FLAG.GIMMICK, TYPE.BONUS]
  ,[182, "特防[2.0]/Advantage[2.0]", "とくほ", 1, 2, , EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE, TYPE.BONUS]
  ,[183, "特殊耐性[0.1+4000]/Special Resistance[0.1+4000]", "とくし", 1, 0.1, 4000, EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.GIMMICK]
  ,[184, "特殊耐性[0.2]/Special Resistance[0.2]", "とくし", 1, 0.2, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.GIMMICK]
  ,[185, "特攻[5.0]/Advantage[5.0]", "とつ", 0, 5, , EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE, TYPE.BONUS]
  ,[186, "非強化時強化/Non-Buff Strengthening", "ひきようかしき", 1, [1, 0.3], , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE, TYPE.NOT_BUFFED]
  ,[187, "<呪い>時強化[ジュウゴ]/Curse Strengthening[Jugo]", "のろ", 0, 6, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE]
  ,[188, "<*烙印>時強化/Stigma Strengthening", "らく", 1, 0.2, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE]
  ,[189, "射撃弱点[ソール]/Weakness to shoot damage[Sol]", "しやけきし", 1, 2.5, WEAPON_FLAG.SHOT, EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE, TYPE.WEAPON_WEAKNESS]
  ,[190, "<火傷>時強化[テュポーン]/Burn Strengthening[Typhon]", "やけとし", 0, 2.5, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE]
  ,[191, "CS変更：射撃/Change CS: Shot", "CS", 0, 0, 4, EFFECT_FLAG.FIXED, TYPE.CSWEAPON]
  ,[192, "汚れ", "よこ", 0, 0.5, , EFFECT_FLAG.FIXED|EFFECT_FLAG.DEBUFF|EFFECT_FLAG.GIMMICK]
  ,[193, "<滋養>時強化[サルタヒコ]/Nourishment Strengthening[Sarutahiko]", "しよ", 0, 2.5, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE]
  ,[194, "特殊耐性[0.01+4000]/Special Resistance[0.01+4000]", "とくし", 1, 0.01, 4000, EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.GIMMICK]
  ,[195, "全弱体特攻/Advantage vs all debuffs", "せん", 0, 1.4, , EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.BONUS_TO_DEBUFF]
  ,[196, "<呪い>時強化[トウジ]/Curse Strengthening[Toji]", "のろ", 0, 6, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE]
  ,[197, "注目時強化[限定アールプ]/Taunt Strengthening[Limited Alp]", "ちゆ", 0, 1.5, , EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE|EFFECT_FLAG.IRREMOVABLE]
  ,[198, "武器種変更：横一文字[弱体]/Weapon Change: Long Slash[Debuff]", "ふき", 0, 0, 7, EFFECT_FLAG.FIXED, TYPE.WEAPON]
  ,[199, "攻撃力微増[アザトース]/Minor ATK Increase[Azathoth]", "こうけひ", 0, 1.2, , EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE|EFFECT_FLAG.IRREMOVABLE]
  ,[200, "CS変更：横一文字[弱体]/Change CS: Long Slash[Debuff]", "CS", 0, 0, 7, EFFECT_FLAG.FIXED|EFFECT_FLAG.DEBUFF|EFFECT_FLAG.GIMMICK, TYPE.CSWEAPON]
  ,[201, "デバフをくれなきゃイタズラするぞ！/Debuff or trick!", "ては", 0, [1, 10], , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.GIMMICK, TYPE.NOT_DEBUFFED]
  ,[202, "デバフをくれなきゃイタズラするぞ！/Debuff or trick!", "ては", 1, [1, 0.01], , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.GIMMICK, TYPE.NOT_DEBUFFED]
  ,[203, "バフをくれなきゃイタズラするぞ！/Buff or Trick!", "はふ", 0, [1, 10], , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.GIMMICK, TYPE.NOT_BUFFED]
  ,[204, "バフをくれなきゃイタズラするぞ！/Buff or Trick!", "はふ", 1, [1, 0.01], , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.GIMMICK, TYPE.NOT_BUFFED]
  ,[205, "凍結/Freeze", "とう", 1, 1.1, , EFFECT_FLAG.STACKABLE|EFFECT_FLAG.ALT]
  ,[206, "火傷/Burn", "やけ", 1, 1, , EFFECT_FLAG.FIXED|EFFECT_FLAG.TOKEN|EFFECT_FLAG.STACKABLE]
  ,[207, "特防[1.3]/Advantage[1.3]", "とくほ", 1, 1.3, , EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE, TYPE.BONUS]
  ,[208, "弱体時強化[タンガロア∞]-<[その他の解除可能な弱体]>/Debuff Strengthening[Tangaroa∞]", "しやくたいし", 0, 1.3, 0.5, EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE, TYPE.DEBUFF_OVERWRITE]
  ,[209, "弱体時強化[タンガロア∞]-<*[その他の解除可能な弱体]>/Debuff Strengthening[Tangaroa∞]", "しやく", 1, 0.9, 0.9, EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE, TYPE.DEBUFF_OVERWRITE]
  ,[210, "[その他の解除可能な弱体]/[Other removable debuffs]", "んし", 0, 1, , EFFECT_FLAG.FIXED|EFFECT_FLAG.TOKEN|EFFECT_FLAG.STACKABLE|EFFECT_FLAG.DEBUFF]
  ,[211, "[その他の解除可能な弱体]/[Other removable debuffs]", "んし", 1, 1, , EFFECT_FLAG.FIXED|EFFECT_FLAG.TOKEN|EFFECT_FLAG.STACKABLE|EFFECT_FLAG.DEBUFF]
  ,[212, "恐怖大特攻/Big Advantage vs Fear", "きようふた", 0, 2.5, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.BONUS_TO_DEBUFF]
  ,[213, "特殊耐性[0.2+4000]/Special Resistance[0.2+4000]", "とくし", 1, 0.2, 4000, EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.GIMMICK]
  ,[214, "特殊耐性[0.01+1000]/Special Resistance[0.01+1000]", "とくし", 1, 0.01, 1000, EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.GIMMICK]
  ,[215, "攻撃力上昇[2.5]", "こうけし", 0, 2.5, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.GIMMICK]
  ,[216, "攻撃力上昇[3.0]", "こうけし", 0, 3, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.GIMMICK]
  ,[217, "攻撃力増加[ショーダウン]/ATK Increase[Showdown]", "こうけそ", 0, 1.1, 10000, EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.GIMMICK, , , 0]
  ,[218, "武器種変更：射撃/Weapon Change: Shot", "ふき", 0, 0, 4, EFFECT_FLAG.FIXED, TYPE.WEAPON]
  ,[219, "強化時防御力上昇", "きよ", 1, 0.05, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.BUFF|EFFECT_FLAG.GIMMICK]
  ,[220, "威圧特攻[AR]/Advantage vs Oppression[AR]", "いあつと", 0, 1.4, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.BONUS_TO_DEBUFF]
  ,[221, "<*発狂>時弱化/Madness Weakening", "はつ", 1, 3, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE]
  ,[222, "攻撃力増加[次ターン]/ATK Increase[Next turn]", "こうけそ", 0, 2, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE]
  ,[223, "×<攻撃力増加[ターン毎減少]>@1", "", 2, 1, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE]
  ,[224, "×<攻撃力増加[ターン毎減少]>@2", "", 2, 2, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE]
  ,[225, "×<攻撃力増加[ターン毎減少]>@3", "", 2, 3, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE]
  ,[226, "×<攻撃力増加[ターン毎減少]>@4", "", 2, 4, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE]
  ,[227, "×<攻撃力増加[ターン毎減少]>@5", "", 2, 5, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE]
  ,[228, "攻撃力増加[ターン毎減少]/ATK Increase[Wanes each turn]", "こうけそ", 0, 1.6, , EFFECT_FLAG.IRREMOVABLE]
  ,[229, "攻撃力増加[イツァムナー]/ATK Increase[Itzamna]", "こうけそ", 0, 3, , EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.ALT]
  ,[230, "ブレーメンにゃ！/Bremen meow!", "ふれ", 1, 0.3, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.GIMMICK]
  ,[231, "狼の応援（攻）", "おお", 0, 3, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.GIMMICK]
  ,[232, "狼の応援（防）", "おお", 1, 0.3, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.GIMMICK]
  ,[233, "攻撃力増加[バレ]/ATK Increase[Valentine]", "こうけそ", 0, 2, , EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE|EFFECT_FLAG.GIMMICK]
  ,[234, "防御力増加[バレ]/Defense Increase[Valentine]", "ほう", 1, 0.4, , EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE|EFFECT_FLAG.GIMMICK]
  ,[235, "食べちゃうぞ", "たへ", 1, 0.01, 10000, EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.GIMMICK]
  ,[236, "魅了時弱化[ペルーン]/Charm Weakening[Perun]", "みりようしし", 1, 3, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.DEBUFF]
  ,[237, "斬撃・横一文字弱点/Slash%%Long-Slash Weakness", "さんけきよ", 1, 1.2, WEAPON_FLAG.SLASH|WEAPON_FLAG.LONGSLASH, EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE, TYPE.WEAPON_WEAKNESS]
  ,[238, "特防[1.2]/Advantage[1.2]", "とくほ", 1, 1.2, , EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE, TYPE.BONUS]
  ,[239, "打撃と斬撃と横一文字への大特防/Reduce Blow%%Slash%%Long-Slash damage", "たけきとさ", 1, 0.1, WEAPON_FLAG.BLOW|WEAPON_FLAG.SLASH|WEAPON_FLAG.LONGSLASH, EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE, TYPE.WEAPON_WEAKNESS]
  ,[240, "射撃と狙撃への大特防/Reduce Shot%%Snipe damage", "しやけきと", 1, 0.1, WEAPON_FLAG.SHOT|WEAPON_FLAG.SNIPE, EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE, TYPE.WEAPON_WEAKNESS]
  ,[241, "弱体無効時強化[☆3]/Nullify Debuff Strengthening[☆3]", "しやくたいむ", 0, 3, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.BUFF]
  ,[242, "弱体無効時強化[☆5]/Nullify Debuff Strengthening[☆5]", "しやくたいむ", 0, 5, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.BUFF]
  ,[243, "全域特防[タイシャクテン]/Reduce All damage[Taishakuten]", "せんいきと", 1, 0.1, WEAPON_FLAG.ALL, EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE, TYPE.WEAPON_WEAKNESS]
  ,[244, "特殊耐性[0.01+10000]/Special Resistance[0.01+10000]", "とくし", 1, 0.01, 10000, EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.GIMMICK]
  ,[245, "特殊耐性[0.08+8000]/Special Resistance[0.08+8000]", "とくし", 1, 0.08, 8000, EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.GIMMICK]
  ,[246, "攻撃力増加[リフレイン]/ATK Increase[Refrain]", "こうけそ", 0, 1.4, , EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.GIMMICK]
  ,[247, "被ダメージ増加[リフレイン]/Increased Incoming Damage[Refrain]", "ひた", 1, 0, 20000, EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.GIMMICK]
  ,[248, "攻撃力増加[タンガロア∞]/ATK Increase[Tangaroa∞]", "こうけそ", 0, 2, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.GIMMICK]
  ,[249, "防御力増加[タンガロア∞]/Defense Increase[Tangaroa∞]", "ほう", 1, 0.5, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.GIMMICK]
  ,[250, "外壁/Outer Wall", "かい", 1, 0.9, , EFFECT_FLAG.IRREMOVABLE, , -0.15]
  ,[251, "<*弱点>特攻[オズ]/Advantage vs Weakness[Oz]", "しやくて", 0, 1.4, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE]
  ,[252, "係留時強化[スモーキーゴッド]/Anchor Strengthening[Smoky God]", "けい", 0, 1.5, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.BUFF]
  ,[253, "被ダメージ増加[1.2]/Increased Incoming Damage[1.2]", "ひた", 1, 1.2, , EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.GIMMICK]
  ,[254, "マシンボディ特攻/Advantage vs Mechaman", "まし", 0, 2, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE]
  ,[255, "<*火傷>時弱化[英雄の例外処理=ジェド]/Burn Weakening[Valiant Exception]", "やけ", 1, 1.5, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.GIMMICK]
  ,[256, "火傷/Burn", "やけ", 0, 1, , EFFECT_FLAG.FIXED|EFFECT_FLAG.TOKEN]
  ,[257, "非<火傷>時強化/Non-Burn Strengthening", "ひや", 0, [1, 2], , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.NON_STATUS]
  ,[258, "<意気>時強化[カトブレパス]/Spirit Strengthening[Catoblepas]", "いき", 0, 0, 1200, EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE]
  ,[259, "特殊耐性[0.01+1]/Special Resistance[0.01+1]", "とくし", 1, 0.01, 1, EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.GIMMICK]
  ,[260, "<*頑強>時弱化/Tenacity Weakening", "かん", 1, 3.5, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.GIMMICK]
  ,[261, "<*守護>時弱化/Protection Weakening", "しゆこしし", 1, 3.5, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.GIMMICK]
  ,[262, "[ATKの種+1000]/[ATK Seed +1000]", "", 0, , 1000, EFFECT_FLAG.FIXED, TYPE.SEED]
  ,[263, "[ATKの種+2000]/[ATK Seed +2000]", "", 0, , 2000, EFFECT_FLAG.FIXED, TYPE.SEED]
  ,[264, "<連撃>時強化/Combo Strengthening", "れん", 0, 2, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE]
  ,[265, "<*崩し>特攻/Advantage vs Break", "くす", 0, 1.5, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE]
  ,[266, "全域特防[ビッグフット]/Reduce All damage[Bigfoot]", "せんいきと", 1, 0.8, WEAPON_FLAG.ALL, EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE, TYPE.WEAPON_WEAKNESS]
  ,[267, "<*凍結>時弱化[バートロ]/Freeze Weakening[Bertro]", "とうけ", 1, 2.5, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE]
  ,[268, "祝福時強化[バートロ]/Blessing Strengthening[Bertro]", "しゆく", 0, 2.5, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.BUFF]
  ,[269, "祝福時強化[バートロ]/Blessing Strengthening[Bertro]", "しゆく", 1, 0.3, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.BUFF]
  ,[270, "祝福時強化[シュクユウ]/Blessing Strengthening[Zhurong]", "しゆく", 1, 0.3, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.BUFF]
  ,[271, "威圧特攻[シームルグ]/Advantage vs Oppression[Simurgh]", "いあつと", 0, 1.5, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.BONUS_TO_DEBUFF]
  ,[272, "攻撃力微増[シームルグ]/Minor ATK Increase[Simurgh]", "こうけひ", 0, 1.2, , EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE|EFFECT_FLAG.IRREMOVABLE]
  ,[273, "攻撃力増加[ギャングスター]/ATK Increase[Gangstar]", "こうけそ", 0, 1.4, , EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.GIMMICK]
  ,[274, "攻撃力上昇[ギャングスター]/攻撃力上昇[Gangstar]", "こうけし", 0, 3, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.GIMMICK]
  ,[275, "攻撃力増加[正月]/ATK Increase[New Year]", "こうけそ", 0, 3, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.GIMMICK]
  ,[276, "防御力増加[正月]/Defense Increase[New Year]", "ほう", 1, 0.3, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.GIMMICK]
  ,[277, "攻撃力増加[装備者CP]/ATK Increase[Equipper's CP]", "こうけそ", 0, 2, , EFFECT_FLAG.IRREMOVABLE]
  ,[278, "呪い時弱化/Curse Weakening", "のろ", 1, 1.5, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.DEBUFF]
  ,[279, "闘志時強化[ギリメカラ]/Vigor Strengthening[Girimekra]", "とうし", 1, 0.6, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.BUFF]
  ,[280, "威圧時弱化[ギリメカラ]/Oppression Weakening[Girimekra]", "いあつし", 0, 0.75, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.DEBUFF]
  ,[281, "威圧特攻[ギリメカラ]/Advantage vs Oppression[Girimekra]", "いあつと", 0, 1.5, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.BONUS_TO_DEBUFF]
  ,[282, "攻撃力微増[ジェイコフ]/Minor ATK Increase[Jacob]", "こうけひ", 0, 1.2, , EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE|EFFECT_FLAG.IRREMOVABLE]
  ,[283, "特防[0.65]/Advantage[0.65]", "とくほ", 1, 0.65, , EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE, TYPE.BONUS]
  ,[284, "魔法弱点/Magic Weakness", "まほ", 1, 2.5, WEAPON_FLAG.MAGIC, EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE, TYPE.WEAPON_WEAKNESS]
  ,[285, "魅了時強化/Charm Strengthening", "みりようしき", 1, 0.3, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.DEBUFF]
  ,[286, "非<連撃>時強化/Non-Combo Strengthening", "ひれ", 0, [1.5, 3], , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.NON_STATUS]
  ,[287, "<束縛>時弱化/Bind Weakening", "そくはくしし", 0, 0, -999999, EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE]
  ,[288, "祝福時強化[ノブミチ=シュクユウ]/Blessing Strengthening[Nobumichi]", "しゆく", 1, 0.3, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.BUFF]
  ,[289, "魅了時弱化[アムブスキアス]/Charm Weakening[Amduscias]", "みりようしし", 1, 1.4, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.DEBUFF]
  ,[290, "注目時強化[アムブスキアス]/Taunt Strengthening[Amduscias]", "ちゆ", 0, 4, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.BUFF]
  ,[291, "全域弱点/All Weakness", "せんいきし", 1, 2, WEAPON_FLAG.ALL, EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE, TYPE.WEAPON_WEAKNESS]
  ,[292, "不動時強化[グランガチ]/Immobility Strengthening[Gurangatch]", "ふと", 1, 0.5, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.BUFF]
  ,[293, "憑依時強化[ユーマ]/Possession Strengthening[Yuma]", "ひよ", 1, 0.1, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.DEBUFF]
  ,[294, "頑強時強化[ユーマ]/Tenacity Strengthening[Yuma]", "かん", 0, 3, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.BUFF]
  ,[295, "猛毒時強化/Fatal Poison Strengthening", "もう", 0, 2, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.DEBUFF]
  ,[296, "加速時強化[R-19#1]/Acceleration Strengthening[R-19]", "かそ", 0, 2, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.BUFF]
  ,[297, "非弱体時強化[ブレイク]/Non-Debuff Strengthening[Breke]", "ひしやくたいしき", 0, [1, 1.5], , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE, TYPE.NOT_DEBUFFED]
  ,[298, "劫火時強化#2/Conflagration Strengthening", "こうかし", 0, 2, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.DEBUFF]
  ,[299, "<集中>時強化[実験AR]/Concentration Strengthening[Experiment AR]", "しゆう", 0, 2, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE]
  ,[300, "<*火傷>特攻[アフラ・マズダ]/Advantage vs Burn[Ahura Mazda]", "やけとと", 0, 1.5, , EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE|EFFECT_FLAG.IRREMOVABLE]
  ,[301, "<*火傷>大特攻/Big Advantage vs Burn", "やけとた", 0, 2, , EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE|EFFECT_FLAG.IRREMOVABLE]
  ,[302, "<*劫火>大特攻/Big Advantage vs Conflagration", "こうかた", 0, 2, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE]
  ,[303, "幻惑特攻[タンガロア∞]/Advantage vs Dazzle[Tangaroa∞]", "けんわくと", 0, 1.5, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.BONUS_TO_DEBUFF]
  ,[304, "<*烙印>特攻/Advantage vs Stigma", "らく", 0, 1.5, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE]
  ,[305, "<*妨害>特攻/Advantage vs Obstruct", "ほうか", 0, 1.5, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE]
  ,[306, "幻惑時弱化/Dazzle Weakening", "けん", 1, 3, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.DEBUFF]
  ,[307, "支援効果[攻撃・防御]/Affiliation Effects[ATK%%DEF]", "", 0, 1.5, , EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.AFFILIATION]
  ,[308, "支援効果[攻撃・防御]/Affiliation Effects[ATK%%DEF]", "", 1, 0.95, , EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.AFFILIATION, ,-0.5]
  ,[309, "支援効果[ステータス]/Affiliation Effects[Basic Stats]", "", 0, 0.05, , EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.AFFILIATION, TYPE.ATK, 1.5]
  ,[310, "全域特防[零の例外処理]/Reduce All damage[Null Exception]", "せんいきと", 1, 0.1, WEAPON_FLAG.ALL, EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.GIMMICK, TYPE.WEAPON_WEAKNESS]
  ,[311, "魅了大特攻[ジブリール]/Big Advantage vs Charm[Gabriel]", "みり", 0, 2, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.BONUS_TO_DEBUFF]
  ,[312, "CS変更：突撃/Change CS: Thrust", "CS", 0, 0, 2, EFFECT_FLAG.FIXED, TYPE.CSWEAPON]
  ,[313, "祈り時強化[ジェイコフ]/Prayer Strengthening[Jacob]", "いの", 0, 2, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.BUFF]
  ,[314, "打撃特防/Reduce Blow damage", "たけきとく", 1, 0.5, WEAPON_FLAG.BLOW, EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE, TYPE.WEAPON_WEAKNESS]
  ,[315, "混乱時弱化/Confusion Weakening", "こんら", 1, 1.5, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.DEBUFF]
  ,[316, "注目時強化[アールプ☆4]/Taunt Strengthening[Alp ☆4]", "ちゆうもくしき", 1, 0.75, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.BUFF]
  ,[317, "<熱情>時強化[AR]/Ardor Strengthening[AR]", "ねつ", 0, 1.5, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE]
  ,[318, "集中時強化[パジャマAR]/Concentration Strengthening[Pajama AR]", "しゆう", 1, 0.75, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.BUFF]
  ,[319, "脱力特攻/Advantage vs Drain", "たつ", 0, 1.5, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.BONUS_TO_DEBUFF]
  ,[320, "暗闇特攻[アステリオス]/Advantage vs Darkness[Asterius]", "くらやみと", 0, 1.5, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.BONUS_TO_DEBUFF]
  ,[321, "根性時強化[レイヴ]/Guts Strengthening[Leib]", "こんし", 0, 2, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.BUFF]
  ,[322, "告死時弱化[ブギーマン]/Countdown Weakening[Boogeyman]", "こく", 0, 0.5, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.DEBUFF]
  ,[323, "<幻惑>時強化/Dazzle Strengthening", "けんわくし", 0, 4, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE]
  ,[324, "閃き時強化[ヘカテー]/Glint Strengthening[Hecate]", "ひら", 1, 0.75, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.BUFF]
  ,[325, "注目時強化[シパクトリ]/Taunt Strengthening[Cipactli]", "ちゆうもくしき", 1, 0.75, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.BUFF]
  ,[326, "祝福時強化[AR]/Blessing Strengthening[AR]", "しゆく", 0, 2, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.BUFF]
  ,[327, "攻撃力激減", "こうけけ", 0, 0.1, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.GIMMICK]
  ,[328, "全域特防[ジュラ]/Reduce All damage[Jurassic]", "せんいきと", 1, 0.1, WEAPON_FLAG.ALL, EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.GIMMICK, TYPE.WEAPON_WEAKNESS]
  ,[329, "奮起時強化/Arousal Strengthening", "ふん", 0, 1.5, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.BUFF]
  ,[330, "非弱体時強化[アルジャーノン]/Non-Debuff Strengthening[Algernon]", "ひしやくたいしき", 0, [1, 1.5], , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE, TYPE.NOT_DEBUFFED]
  ,[331, "攻撃力増加[オンブレティグレ]/ATK Increase[Hombre Tigre]", "こうけそ", 0, 3, , EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.ALT]
  ,[332, "<*根性>時強化[ヤマサチヒコ]/Guts Strengthening[Yamasachihiko]", "こんし", 1, 0.7, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE]
  ,[333, "攻防低下", "こうほ", 0, 0.5, , EFFECT_FLAG.IRREMOVABLE]
  ,[334, "攻防低下", "こうほ", 1, 3, , EFFECT_FLAG.IRREMOVABLE]
  ,[335, "攻撃力増加[ベヒモス]/ATK Increase[Behemoth]", "こうけそ", 0, 4, , EFFECT_FLAG.IRREMOVABLE]
  ,[336, "<火傷>時強化[ハヌマン]/Burn Strengthening[Hanuman]", "やけとし", 0, 3, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE]
  ,[337, "幻惑特攻[セト]/Advantage vs Dazzle[Seth]", "けんわくと", 0, 1.5, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.BONUS_TO_DEBUFF]
  ,[338, "係留時強化[セト]/Anchor Strengthening[Seth]", "けいり", 1, 0.5, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.BUFF]
  ,[339, "毒時強化[AR]/Poison Strengthening[AR]", "とくし", 0, 1.5, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.DEBUFF]
  ,[340, "幻惑特攻[AR=セト]/Advantage vs Dazzle[AR]", "けんわくと", 0, 1.5, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.BONUS_TO_DEBUFF]
  ,[341, "弱体時強化[AR]/Debuff Strengthening[AR]", "しやくたいし", 0, 1.5, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.DEBUFF]
  ,[342, "根性時強化[ハプニングAR]/Guts Strengthening[ハプニングAR]", "こんし", 0, 1.5, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.BUFF]
  ,[343, "<滋養>時強化[冥境AR]/Nourishment Strengthening[冥境AR]", "しよ", 0, 1.5, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE]
  ,[344, "<*火傷>特攻[ファヴニル]/Advantage vs Burn[Fafnir]", "やけとと", 0, 1.5, , EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE|EFFECT_FLAG.IRREMOVABLE]
  ,[345, "頑強時強化[ティンダロス]/Tenacity Strengthening[Tindalos]", "かん", 0, 2, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.BUFF]
  ,[346, "守護時強化[ティンダロス]/Protection Strengthening[Tindalos]", "しゆこ", 0, 2, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.BUFF]
  ,[347, "聖油時強化[ティンダロス]/Unction Strengthening[Tindalos]", "せい", 0, 2, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.BUFF]
  ,[348, "非強化時弱化[タローマティ]/Non-Buff Weakening[Taromaiti]", "ひきようかしし", 1, [1, 1.5], , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE, TYPE.NOT_BUFFED]
  ,[349, "被ダメージ増加[ナタ]/Increased Incoming Damage[Nezha]", "ひた", 1, 2.5, , EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.ALT]
  ,[350, "<*弱点>特攻[タケマル]/Advantage vs Weakness[Takemaru]", "しやくて", 0, 1.5, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE]
  ,[351, "祝福時強化[マサシ]/Blessing Strengthening[Masashi]", "しゆく", 0, 1.5, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.BUFF]
  ,[352, "毒大特攻/Big Advantage vs Poison", "とくた", 0, 2, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.BONUS_TO_DEBUFF]
  ,[353, "閃き大特攻/Big Advantage vs Glint", "ひらめきた", 0, 2, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.BONUS_TO_BUFF]
  ,[354, "<強化反転>時強化/Buff Reversal Strengthening", "きようか", 0, 12, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE]
  ,[355, "<*強化反転>時強化/Buff Reversal Strengthening", "きよ", 1, 0.01, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE]
  ,[356, "[その他の解除可能な強化]/[Other removable buffs]", "んき", 0, 1, , EFFECT_FLAG.FIXED|EFFECT_FLAG.TOKEN|EFFECT_FLAG.STACKABLE|EFFECT_FLAG.BUFF]
  ,[357, "[その他の解除可能な強化]/[Other removable buffs]", "んき", 1, 1, , EFFECT_FLAG.FIXED|EFFECT_FLAG.TOKEN|EFFECT_FLAG.STACKABLE|EFFECT_FLAG.BUFF]
  ,[358, "桃/Peach", "もも", 0, 3, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.GIMMICK]
  ,[359, "桃時弱化/Peach Weakening", "もも", 1, 10, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.GIMMICK]
  ,[360, "お年玉ですよ〜！/Ring In the New Year!", "おと", 0, 8.5, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.GIMMICK]
  ,[361, "特殊耐性[0.5]/Special Resistance[0.5]", "とくし", 1, 0.5, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.GIMMICK]
  ,[362, "<*外壁>に貫通/Ignore Outer Wall", "かいへ", 0, 1.33, , EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE, TYPE.IGNORE]
  ,[363, "奮起時弱化/Arousal Weakening", "ふん", 1, 2, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.BUFF]
  ,[364, "マヒ時弱化[ペルーン]/Paralysis Weakening[Perun]", "まひ", 1, 2, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.DEBUFF]
  ,[365, "聖油時強化[バロン=ティンダロス]/Unction Strengthening[Barong]", "せい", 0, 2, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.BUFF]
  ,[366, "非強化時弱化[ウランバートル]/Non-Buff Weakening[Ulaanbaatar]", "ひきようかしし", 1, [1, 1.5], , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE, TYPE.NOT_BUFFED]
  ,[367, "不動時強化[ゴウリョウ]/Immobility Strengthening[Ganglie]", "ふと", 0, 2, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.BUFF]
  ,[368, "<意気>時強化[ゴウリョウ]/Spirit Strengthening[Ganglie]", "いき", 0, 1.5, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE]
  ,[369, "恐怖特攻/Advantage vs Fear", "きようふと", 0, 1.5, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.BONUS_TO_DEBUFF]
  ,[370, "魅了大特攻[テュアリング]/Big Advantage vs Charm[Tuaring]", "みり", 0, 2, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.BONUS_TO_DEBUFF]
  ,[371, "威圧時弱化[タイシャクテン]/Oppression Weakening[Taishakuten]", "いあつし", 0, 0.4, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.DEBUFF]
  ,[372, "注目時強化[タイシャクテン]/Taunt Strengthening[Taishakuten]", "ちゆ", 0, 1.5, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.BUFF]
  ,[373, "注目時弱化/Taunt Weakening", "ちゆうもくしし", 1, 1.5, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.BUFF]
  ,[374, "閃き時強化[マサノリ]/Taunt Strengthening[Masanori]", "ひらめきし", 0, 2, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.BUFF]
  ,[375, "射撃弱点[エイタ=ソール]/Weakness to shoot damage[Eita]", "しやけきし", 1, 2.5, WEAPON_FLAG.SHOT, EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE, TYPE.WEAPON_WEAKNESS]
  ,[376, "射撃弱点[マサノリ]/Weakness to shoot damage[Masanori]", "しやけきし", 1, 2, WEAPON_FLAG.SHOT, EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE, TYPE.WEAPON_WEAKNESS]
  ,[377, "狙撃弱点/Snipe Weakness", "そけ", 1, 2, WEAPON_FLAG.SNIPE, EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE, TYPE.WEAPON_WEAKNESS]
  ,[378, "陣形：隊列歩行[L][サマー]/Formation: Single-File[L][Summer]", "", 0, 1, , EFFECT_FLAG.EVENT|EFFECT_FLAG.FIXED, TYPE.ATK]
  ,[379, "陣形：隊列歩行[M][サマー]/Formation: Single-File[M][Summer]", "", 1, 0.5, , EFFECT_FLAG.EVENT|EFFECT_FLAG.FIXED]
  ,[380, "陣形：トラバース[サマー]/Formation: Criss-Cross[Summer]", "", 0, 0.5, , EFFECT_FLAG.EVENT|EFFECT_FLAG.FIXED, TYPE.ATK]
  ,[381, "陣形：ブロッケン[M][サマー]/Formation: Brocken[M][Summer]", "", 1, 0.5, , EFFECT_FLAG.EVENT|EFFECT_FLAG.FIXED]
  ,[382, "陣形：ワンダーフォーゲル・改[L][サマー]/Formation: ワンダーフォーゲル・改[L][Summer]", "", 0, 2, , EFFECT_FLAG.EVENT|EFFECT_FLAG.FIXED, TYPE.ATK]
  ,[383, "陣形：ワンダーフォーゲル・改[L][サマー]/Formation: ワンダーフォーゲル・改[L][Summer]", "", 1, 0.5, , EFFECT_FLAG.EVENT|EFFECT_FLAG.FIXED]
  ,[384, "陣形：ワンダーフォーゲル・改[M][サマー]/Formation: ワンダーフォーゲル・改[M][Summer]", "", 0, 1, , EFFECT_FLAG.EVENT|EFFECT_FLAG.FIXED, TYPE.ATK]
  ,[385, "陣形：アルパイン[M][サマー]/Formation: Alpine[M][Summer]", "", 0, 2, , EFFECT_FLAG.EVENT|EFFECT_FLAG.FIXED, TYPE.ATK]
  ,[386, "暗闇特攻[ビッグフット]/Advantage vs Darkness[Bigfoot]", "くらやみと", 0, 1.5, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.BONUS_TO_DEBUFF]
  ,[387, "<火傷>時強化[クマノゴンゲン]/Burn Strengthening[Kumano Gongen]", "やけとし", 0, 2, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE]
  ,[388, "<*火傷>特攻[クマノゴンゲン=ファヴニル]/Advantage vs Burn[Kumano Gongen]", "やけとと", 0, 1.5, , EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE|EFFECT_FLAG.IRREMOVABLE]
  
  ,[389, "防御力微増/Minor DEF Increase", "ほうきより", 1, 0.8, , EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE|EFFECT_FLAG.IRREMOVABLE]
  ,[390, "<*加速>時強化[カレン]/Acceleration Strengthening[Curren]", "かそ", 1, 0.6, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE]
  ,[391, "守護時強化[ハスター]/Protection Strengthening[Hastur]", "しゆこ", 0, 1.5, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.BUFF]
  ,[392, "斬撃弱点/Slash Weakness", "さんけきし", 1, 2.5, WEAPON_FLAG.SLASH, EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE, TYPE.WEAPON_WEAKNESS]
  ,[393, "脱力時弱化/Drain Weakening", "たつ", 1, 1.5, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.DEBUFF]
  ,[394, "注目時強化[ダオジュン]/Taunt Strengthening[Tianzun]", "ちゆ", 0, 1.5, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.BUFF]
  ,[395, "毒時強化[イグ]/Poison Strengthening[Yig]", "とくし", 0, 3, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.DEBUFF]
],[
  ["攻撃力増加[ターン毎減少]", "TOTAL TURN", PROMPT_TYPE.TURN,
    [[1, 1.6]
    ,[1, 1.5]
    ,[1, 1.4]
    ,[1, 1.3]
    ,[0, 1.2]
  ]]
  ,["攻撃力増加[イツァムナー]", "イツァムナーのCP/Itzamna's CP", PROMPT_TYPE.CP,
    [[10, 1.2]
    ,[10, 1.4]
    ,[10, 1.6]
    ,[10, 1.8]
    ,[10, 2]
    ,[10, 2.2]
    ,[10, 2.4]
    ,[10, 2.6]
    ,[10, 2.8]
    ,[11, 3]
  ]]
  ,["攻撃力増加[装備者CP]", "装備者のCP/Equipper's CP", PROMPT_TYPE.CP,
    [[1, 1.1]
    ,[30, 1.3]
    ,[40, 1.5]
    ,[29, 1.8]
    ,[1, 2]
  ]]
  ,["攻撃力増加[オンブレティグレ]", "オンブレティグレの/Hombre Tigre's", PROMPT_TYPE.HP,
    [[[0, 0, 0], 1]
    ,[[100, 0, 0], 1.2]
    ,[[0, 50, 100], 1.5]
    ,[[0, 5, 50], 2]
    ,[[0, 0, 5], 3]
  ]]
  ,["攻防低下", "CP", PROMPT_TYPE.CP,
    [[31, 0.75]
    ,[30, 0.7]
    ,[39, 0.6]
    ,[1, 0.5]
  ]]
  ,["*攻防低下", "CP", PROMPT_TYPE.CP,
    [[31, 1.5]
    ,[30, 2]
    ,[39, 2.5]
    ,[1, 3]
  ]]
  ,["攻撃力増加[ベヒモス]", "ベヒモスのCP/Behemoth's CP", PROMPT_TYPE.CP,
    [[41, 2]
    ,[40, 3]
    ,[20, 4]
  ]]
  ,["*被ダメージ増加[ナタ]", "水平距離/Horizontal distance", PROMPT_TYPE.SQUARE,
    [[1, 1.3]
    ,[1, 1.5]
    ,[1, 1.8]
    ,[1, 2.0]
    ,[1, 2.5]
  ]]
]);