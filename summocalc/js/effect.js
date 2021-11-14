var TYPE = {
  NORMAL: 1,
  ATK: 2,
  WEAPON: 5,
  COMBO: 7,
  LIMIT: 8,
  SEED: 9,
  CSWEAPON: 10,
  BONUS: 11,
  CUSTOM: 13,
  ZERO: 14,
  NOT_BUFFED: 15,
  NOT_DEBUFFED: 16,
  WEAPON_WEAKNESS: 17
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
  NON_STATUS: 1 << 11
};

function Effect(index, x, link){
  this.index = index;
  this.link = link;
  this.name = x[0];
  this.reading = x[1];
  this.group = x[2];
  this.value = [];
  for(var i = 3; i < 5; i++){
    var v = x[i] || 0;
    if(link && v.length){
      this.value.push([
        new Fraction(v[0] * 100, 100),
        new Fraction(v[1] * 100, 100)
      ]);
    }else{
      this.value.push(new Fraction(v * 100, 100));
    }
  }
  this.flag = x[5] || 0;
  this.type = x[6] || TYPE.NORMAL;
  this.event = this.flag & EFFECT_FLAG.EVENT;
  this.gimmick = this.flag & EFFECT_FLAG.GIMMICK;
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
  if(this.event){
    this.sortkey = 5;
  }else if(this.gimmick){
    this.sortkey = 4;
  }else if(this.type === TYPE.CUSTOM){
    this.sortkey = 6;
  }else if(!this.reading){
    this.sortkey = 0;
  }else if(this.flag & EFFECT_FLAG.IRREMOVABLE){
    this.sortkey = 2;
  }
  if(this.type === TYPE.BONUS) this.subset = new Map();
}
Effect.prototype = {
  toString: function(){
    return (this.event ? "◎" : this.gimmick ? "☆" : "") + t(this.name) || LINE;
  },
  _getValue: function(m, lv, oldmode, es){
    var value = this.value[m];
    if(this.link){
      var loop = es[this.link].loop;
      if(value.length){
        value = value[loop ? 0 : 1];
      }else if(!loop){
        value = new Fraction(0);
      }
    }
    if(oldmode && this.growth[m] < 0){
      return value.mul(100, 100 + lv);
    }else{
      return value.add(this.growth[m].mul(lv, 100));
    }
  },
  getValue: function(lv, oldmode, es){
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
  }
};
Effect.createList = function(a){
  var table = new Map();
  var result = [];
  var order = [[], []];
  var k = [];
  var en = false;
  var f = function(a, b){
    var x = result[a];
    var y = result[b];
    if(x.sortkey !== y.sortkey) return x.sortkey - y.sortkey;
    if(x.sortkey > 4 || !x.sortkey) return x.index - y.index;
    if(k[a] === k[b] && x.group === y.group) return x.value[1] - y.value[1] || x.value[0] - y.value[0] || x.index - y.index;
    if(en) return t(x.name, 1).toUpperCase() < t(y.name, 1).toUpperCase() ? -1 : 1;
    if(x.reading === y.reading) return x.index - y.index;
    return x.reading < y.reading ? -1 : 1;
  };
  a.forEach(function(v, i){
    var key = t(v[0], 0).replace(/-<[^>]+>/, "");
    var tagIndex = TAG.table.get(key);
    if(v[2]) key = "*" + key;
    if(table.has(key)) throw Error(["攻撃", "防御"][v[2]] + "側補正効果「" + key + "」が重複しています\n（" + v[0] + "）");
    table.set(key, i);
    order[0].push(i);
    order[1].push(i);
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
    var link = 0;
    v[0] = v[0].replace(/(-?)<([^>]+)>/, function(match, p1, p2){
      link = table.get(p2) || 0;
      if(!link) throw Error(["攻撃", "防御"][p1.length] + "側補正効果「" + p2 + "」は存在しません\n（" + v[0] + "）");
      if(p1.length) return "";
      return p2.replace(/\*+/, "");
    });
    result.push(new Effect(i, v, link));
    k.push(t(v[0], 0).replace(/(\[[^\]]+\]|：.+|[小中大]UP)$/, ""))
  });
  order[0].sort(f);
  en = true;
  order[1].sort(f);
  result.ORDER = order;
  result.table = table;
  return result;
};

var EFFECT_MAX = 10000;

var EFFECT = Effect.createList(
  //名前, 読み, グループ, 乗算基本値, 加算基本値, フラグ=0, タイプ=TYPE.NORMAL, 乗算成長率=undefined, 加算成長率=undefined
  [["", "", -1, 1, 0]
  ,["[ATKの種]/[ATK Seed]", "", 0, 0, 1000, EFFECT_FLAG.FIXED, TYPE.SEED]
  ,["怒/Anger", "いかり", 0, 1.1, , EFFECT_FLAG.LV1]
  ,["意気/Spirit", "いき", 0, 0, 400]
  ,["回避/Evasion", "かいひ", 1, 0.01]
  ,["<*回避>に貫通/Ignore Evasion", "かいひ", 0, 100, , EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE]
  ,["頑強/Tenacity", "かん", 1, 0.9]
  ,["<*頑強>に貫通/Ignore Tenacity", "かん", 0, 2.22, , EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE]
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
  ,["<*金剛>に貫通/Ignore Adamantine", "こんこ", 0, 2.22, , EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE]
  ,["弱点/Weakness", "しやくて", 1, 1.2]
  ,["集中/Concentration", "しゆう", 0, 1.1]
  ,["守護/Protection", "しゆこ", 1, 0.9]
  ,["<*守護>に貫通/Ignore Protection", "しゆこに", 0, 2.22, , EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE]
  ,["滋養/Nourishment", "しよ", 0, 1.1, , , , 0.4]
  ,["聖油/Unction", "せい", 1, 0.85]
  ,["<*聖油>に貫通/Ignore Unction", "せい", 0, 2.35, , EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE]
  ,["束縛/Bind", "そく", 0, 0.9]
  ,["凍結/Freeze", "とうけ", 1, 1.1]
  ,["闘志/Vigor", "とうし", 0, 1.2]
  ,["毒反転/Poison Reversal", "とくは", 0, 2, , EFFECT_FLAG.FIXED]
  ,["毒反転/Poison Reversal", "とくは", 1, 0.6, , EFFECT_FLAG.FIXED]
  ,["特防[0.01]/Bonus[0.01]", "とくほ", 1, 0.01, , EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE|EFFECT_FLAG.GIMMICK, TYPE.BONUS]
  ,["特防[0.1]/Bonus[0.1]", "とくほ", 1, 0.1, , EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE|EFFECT_FLAG.GIMMICK, TYPE.BONUS]
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
  ,["<*防御強化>に貫通/Ignore DEF Up", "ほうき", 0, 2.22, , EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE]
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
  ,["[ジェイル]怒/[V.Jail]Anger", "", 0, 1.2, , EFFECT_FLAG.EVENT|EFFECT_FLAG.LV1]
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
  ,["強化反転", "きようかは", 0, 0.25, , EFFECT_FLAG.FIXED]
  ,["強化反転", "きようかは", 1, 2.5, , EFFECT_FLAG.FIXED]
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
  ,["<*守護>時強化", "しゆこし", 1, 0.01, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.GIMMICK]
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
  ,["デメリット[0.25]", "てめ", 0, 0.25, , EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE|EFFECT_FLAG.IRREMOVABLE, TYPE.BONUS]
  ,["友情時強化", "ゆう", 0, 1.5, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE]
  ,["回数回避", "かいす", 1, 0.01, , EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.GIMMICK]
  ,["<*回数回避>無効化", "かいす", 1, 100, , EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.GIMMICK]
  ,["強化時超弱体", "きようかし", 0, 0.01, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.BUFF|EFFECT_FLAG.GIMMICK]
  ,["非<*加速>時強化", "ひか", 1, [1, 0.6], , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.NON_STATUS]
  ,["<*火傷>時弱化", "やけ", 1, 1.5, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE]
  ,["祝福時強化", "しゆく", 0, 2, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.BUFF]
  ,["金剛時強化", "こんこ", 0, 1.5, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.BUFF]
  ,["悪い子弱体", "わる", 0, 0.01, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.GIMMICK]
  ,["<クリティカル>強化", "くり", 0, 2.5, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE]
  ,["被ダメージ増加", "ひた", 1, 2, , EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.GIMMICK]
  ,["滋養時強化[AR]", "しよ", 1, 0.8, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.BUFF]
  ,["根性時強化[AR]", "こんし", 0, 1.5, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.BUFF]
  ,["特殊耐性[0.1]", "とくし", 1, 0.1, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.GIMMICK]
  ,["<剛力>時強化", "こうり", 0, 1.5, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE]
  ,["攻撃力微増[セト]/攻撃力微増[Seth]", "こうけひ", 0, 1.2, , EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE|EFFECT_FLAG.IRREMOVABLE]
  ,["無窮/Infinitude", "むき", 0, 1.3, , EFFECT_FLAG.STACKABLE]
  ,["チョコ", "ちよ", 0, 3, , EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.GIMMICK]
  ,["チョコ", "ちよ", 1, 0.3, , EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.GIMMICK]
  ,["<*チョコ>に極大特攻", "ちよ", 0, 100, , EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE|EFFECT_FLAG.GIMMICK]
  ,["特防[0.05]/Bonus[0.05]", "とくほ", 1, 0.05, , EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE|EFFECT_FLAG.GIMMICK, TYPE.BONUS]
  ,["特殊耐性[0.12]", "とくし", 1, 0.12, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.GIMMICK]
  ,["悪魔の契約", "あく", 0, 6, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE]
  ,["悪魔の契約-<*契約の代償>", "あく", 1, 0.3, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE]
  ,["契約の代償-<*悪魔の契約>", "けい", 1, 0, [0, 10000], EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.NON_STATUS]
  ,["弱体時強化[ヴォルフ]/弱体時強化[Volkh]", "しやくた", 1, 0.1, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.DEBUFF]
  ,["<呪い>時強化[ヴォルフ]/呪い時強化[Volkh]", "のろ", 0, 5, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE]
  ,["攻撃力低下", "こうけて", 0, 0.7, , EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE|EFFECT_FLAG.IRREMOVABLE]
  ,["非弱体時弱化", "ひし", 0, 0.5, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE, TYPE.NOT_DEBUFFED]
  ,["非弱体時弱化", "ひし", 1, 2.5, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE, TYPE.NOT_DEBUFFED]
  ,["特殊耐性[0.01]", "とくし", 1, 0.01, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.GIMMICK]
  ,["憑依/Possession", "ひよ", 0, 1, , EFFECT_FLAG.FIXED|EFFECT_FLAG.TOKEN]
  ,["疑念-<憑依>", "きね", 0, [10, 0.1], , EFFECT_FLAG.FIXED]
  ,["非祈り時強化", "ひい", 0, 4, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.NON_STATUS]
  ,["非強化時弱化", "ひきようかしし", 1, 2.5, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE, TYPE.NOT_BUFFED]
  ,["<怒>時強化", "いかり", 0, 1.5, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE]
  ,["特攻[1.67]/Bonus[1.67]", "とつ", 0, 1.67, , EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE, TYPE.BONUS]
  ,["発狂", "はつ", 1, 0, 400]
  ,["<*劫火>時強化", "こうか", 1, 0.35, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE]
  ,["火傷/Burn", "やけ", 1, 1, , EFFECT_FLAG.FIXED|EFFECT_FLAG.TOKEN]
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
  ,["特防[2.0]/Bonus[2.0]", "とくほ", 1, 2, , EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE|EFFECT_FLAG.GIMMICK, TYPE.BONUS]
  ,["特殊耐性[0.1+4000]", "とくし", 1, 0.1, 4000, EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.GIMMICK]
  ,["特殊耐性[0.2]", "とくし", 1, 0.2, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.GIMMICK]
  ,["特攻[5.0]/Bonus[5.0]", "とつ", 0, 5, , EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE, TYPE.BONUS]
  ,["非強化時強化", "ひきようかしき", 1, 0.3, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE, TYPE.NOT_BUFFED]
  ,["<呪い>時強化[ジュウゴ]/呪い時強化[Jugo]", "のろ", 0, 6, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE]
  ,["<*烙印>時強化", "らく", 1, 0.2, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE]
  ,["射撃弱点/Weakness against shot", "しやけ", 1, 2.5, 4, EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE, TYPE.WEAPON_WEAKNESS]
  ,["火傷時強化", "やけ", 0, 2.5, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.DEBUFF]
  ,["CS変更：射撃/Change CS Type: Shot", "CS", 0, 0, 4, EFFECT_FLAG.FIXED, TYPE.CSWEAPON]
  ,["汚れ", "よこ", 0, 0.5, , EFFECT_FLAG.FIXED|EFFECT_FLAG.DEBUFF|EFFECT_FLAG.GIMMICK]
  ,["<滋養>時強化[サルタヒコ]/滋養時強化[Sarutahiko]", "しよ", 0, 2.5, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE]
  ,["特殊耐性[0.01+4000]", "とくし", 1, 0.01, 4000, EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.GIMMICK]
  ,["全弱体特攻", "せん", 0, 1.4, , EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE|EFFECT_FLAG.IRREMOVABLE|EFFECT_FLAG.BONUS_TO_DEBUFF]
  ,["<呪い>時強化[トウジ]/呪い時強化[Toji]", "のろ", 0, 6, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE]
  ,["注目時強化[アールプ]/注目時強化[Alp]", "ちゆ", 0, 1.5, , EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE|EFFECT_FLAG.IRREMOVABLE]
  ,["武器種変更：横一文字[アザトース]/Change Weapon Type: Long Slash [Azathoth]", "ふき", 0, 0, 7, EFFECT_FLAG.FIXED, TYPE.WEAPON]
  ,["攻撃力微増[アザトース]/攻撃力微増[Azathoth]", "こうけひ", 0, 1.2, , EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE|EFFECT_FLAG.IRREMOVABLE]
]);

function generateEffectData(s, group){
  var result = [];
  s.forEach(function(value){
    var name = value[0];
    var g = (value[2] & TIMING_FLAG.CS) ? EFFECT_MAX : 0;
    for(var i = 1; i < EFFECT.length; i++){
      if(t(EFFECT[i].name, 0) === name && (group === undefined || EFFECT[i].group === group)){
        if(!EFFECT[i].isToken()){
          var n = i;
          if(value[3]){
            n = EFFECT[i].subset.get(value[3]);
            if(!n) n = registerBonusEffect(i, value);
          }
          result.push(n + g);
        }
        break;
      }
    }
  });
  return result;
}

function registerBonusEffect(i, value){
  var tag = TAG[value[3]];
  var o = Object.create(EFFECT[i]);
  var flag = EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE;
  [[6, "極大特攻/極大特攻"]
  ,[3, "超特攻/超特攻"]
  ,[2, "大特攻/Greater bonus"]
  ,[1, "特攻/Bonus"]
  ,[0, "与ダメージ減少/Decrease"]
  ].some(function(x){
    if(o.value[0] >= x[0]){
      o.name = value[4] + "に" + x[1] + " damage against " + t(tag.name, 1);
      return true;
    }
    return false;
  });
  o.index = EFFECT.length;
  o.link = EFFECT.table.get("*" + value[4]) || 0;
  o.subset.set(value[3], o.index);
  o.subset = null;
  o.sp = [i, value[3]];
  if(!o.link){
    switch(tag.type){
      case TAG_TYPE.BUFF:
      case TAG_TYPE.ALL_BUFFS:
        flag = flag | EFFECT_FLAG.BONUS_TO_BUFF;
        break;
      case TAG_TYPE.DEBUFF:
      case TAG_TYPE.ALL_DEBUFFS:
        flag = flag | EFFECT_FLAG.BONUS_TO_DEBUFF;
    }
  }
  o.flag = flag;
  EFFECT.push(o);
  return o.index;
}

function splitEffects(s){
  return generateEffectData(splitSkills(s));
}
