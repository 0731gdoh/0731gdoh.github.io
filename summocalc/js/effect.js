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
  NOT_DEBUFFED: 15
};

var EFFECT_FLAG = {
  EVENT: 1,
  FIXED: 1 << 1,
  STACKABLE: 1 << 2,
  IRREMOVABLE: 1 << 3,
  LV1: 1 << 4,
  NO_MULTIPLIER: 1 << 5,
  BUFF: 1 << 6,
  DEBUFF: 1 << 7
};

function Effect(index, x, link){
  this.index = index;
  this.link = link;
  this.name = x[0];
  this.reading = x[1];
  this.group = x[2];
  this.value = [];
  if(link){
    if(!x[3]) x[3] = [0, 0];
    if(!x[4]) x[4] = [0, 0];
    this.value = [
      [
        new Fraction(x[3][0] * 100, 100),
        new Fraction(x[3][1] * 100, 100)
      ], [
        new Fraction(x[4][0] * 100, 100),
        new Fraction(x[4][1] * 100, 100)
      ]
    ];
  }else{
    this.value = [
      new Fraction((x[3] || 0) * 100, 100),
      new Fraction((x[4] || 0) * 100, 100)
    ]
  }
  this.flag = x[5] || 0;
  this.type = x[6] || TYPE.NORMAL;
  this.event = this.flag & EFFECT_FLAG.EVENT;
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
    this.sortkey = 6;
  }else if(this.type === TYPE.CUSTOM){
    this.sortkey = 5;
  }else if(!this.reading){
    if(this.type === TYPE.BONUS){
      this.sortkey = 3;
    }else{
      this.sortkey = 0;
    }
  }else if(this.name[0] === "[" || this.type === TYPE.ZERO){
    this.sortkey = 4;
  }else if(this.flag & EFFECT_FLAG.IRREMOVABLE){
    this.sortkey = 2;
  }
}
Effect.prototype = {
  toString: function(){
    return (this.event ? "◎" : "") + t(this.name) || LINE;
  },
  _getValue: function(m, lv, oldmode, es){
    var value = this.value[m];
    if(this.link) value = value[es[this.link].loop ? 0 : 1];
    if(oldmode && this.growth[m] < 0){
      return value.mul(100, 100 + lv);
    }else{
      return value.add(this.growth[m].mul(lv, 100));
    }
  },
  getMulValue: function(lv, oldmode, es){
    return this._getValue(0, lv, oldmode, es);
  },
  getAddValue: function(lv, oldmode, es){
    return this._getValue(1, lv, oldmode, es);
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
  isBuff: function(){
    return this.flag & EFFECT_FLAG.BUFF;
  },
  isDebuff: function(){
    return this.flag & EFFECT_FLAG.DEBUFF;
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
    if(x.sortkey > 3 || !x.sortkey) return x.index - y.index;
    if(k[a] === k[b] && x.group === y.group) return x.value[0] - y.value[0];
    if((x.type === TYPE.WEAPON || x.type === TYPE.CSWEAPON) && x.type === y.type) return x.value[1] - y.value[1];
    if(en) return t(x.name, 1).toUpperCase() < t(y.name, 1).toUpperCase() ? -1 : 1;
    if(x.reading === y.reading) return x.index - y.index;
    return x.reading < y.reading ? -1 : 1;
  };
  a.forEach(function(v, i){
    var key = t(v[0], 0).replace(/-<[^>]+>/, "");
    var tagIndex = TAG.table.get(key);
    while(table.get(key)) key = "*" + key;
    table.set(key, i);
    order[0].push(i);
    order[1].push(i);
    if(tagIndex){
      switch(TAG[tagIndex].type){
        case TAG_TYPE.BUFF:
        case TAG_TYPE.CCT:
        case TAG_TYPE.CWT:
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
      if(p1.length) return "";
      return p2.replace(/\*+/, "");
    });
    result.push(new Effect(i, v, link));
    k.push(t(v[0], 0).replace(/\[\d+\.\d+\]$/, ""))
  });
  order[0].sort(f);
  en = true;
  order[1].sort(f);
  result.ORDER = order;
  return result;
};

var EFFECT_MAX = 10000;

var EFFECT = Effect.createList(
  //名前, 読み, グループ, 乗算基本値, 加算基本値, フラグ=0, タイプ=TYPE.NORMAL, 乗算成長率=undefined, 加算成長率=undefined
  [["", "", -1, 1, 0]
  ,["[ATKの種]/[ATK Seed]", "", 0, 0, 1000, EFFECT_FLAG.FIXED, TYPE.SEED]
  ,["怒/Anger", "いか", 0, 1.1, , EFFECT_FLAG.LV1]
  ,["意気/Spirit", "いき", 0, 0, 400]
  ,["回避/Evasion", "かいひ", 1, 0.01]
  ,["<回避>に貫通/Ignore Evasion", "かいひ", 0, [100, 1], , EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE]
  ,["頑強/Tenacity", "かん", 1, 0.9]
  ,["<頑強>に貫通/Ignore Tenacity", "かん", 0, [2.22, 1], , EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE]
  ,["極限/Limit", "きよく", 0, 1, , , TYPE.LIMIT]
  ,["崩し/Break", "くす", 1, 1.2]
  ,["暗闇/Darkness", "くら", 0, 0.9]
  ,["クリティカル/Crit", "くり", 0, 2]
  ,["クリティカル+/Crit+", "くり", 0, 2.5]
  ,["クリティカル++/Crit++", "くり", 0, 3]
  ,["激怒/Rage", "けき", 0, 1.25]
  ,["激怒/Rage", "けき", 1, 1.25]
  ,["激怒+/Rage+", "けき", 0, 1.25]
  ,["激怒+/Rage+", "けき", 1, 1.25, , EFFECT_FLAG.FIXED]
  ,["幻惑/Dazzle", "けん", 0, 0.7]
  ,["攻撃強化/ATK Up", "こうけきき", 0, 1.1]
  ,["剛力/Brawn", "こうり", 0, 1.15]
  ,["金剛/Adamantine", "こんこ", 1, 0.9]
  ,["<金剛>に貫通/Ignore Adamantine", "こんこ", 0, [2.22, 1], , EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE]
  ,["弱点/Weakness", "しやくて", 1, 1.2]
  ,["集中/Concentration", "しゆう", 0, 1.1]
  ,["守護/Protection", "しゆこ", 1, 0.9]
  ,["<守護>に貫通/Ignore Protection", "しゆこに", 0, [2.22, 1], , EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE]
  ,["滋養/Nourishment", "しよ", 0, 1.1, , , , 0.4]
  ,["聖油/Unction", "せいゆ", 1, 0.85]
  ,["<聖油>に貫通/Ignore Unction", "せいゆに", 0, [2.35, 1], , EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE]
  ,["束縛/Bind", "そく", 0, 0.9]
  ,["凍結/Freeze", "とうけ", 1, 1.1]
  ,["闘志/Vigor", "とうし", 0, 1.2]
  ,["毒反転/Poison Reversal", "とくは", 0, 2, , EFFECT_FLAG.FIXED]
  ,["毒反転/Poison Reversal", "とくは", 1, 0.6, , EFFECT_FLAG.FIXED]
  ,["特防[0.01]/Bonus[0.01]", "とくほ", 1, 0.01, , EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE, TYPE.BONUS]
  ,["特防[0.1]/Bonus[0.1]", "とくほ", 1, 0.1, , EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE, TYPE.BONUS]
  ,["特防[0.2]/Bonus[0.2]", "とくほ", 1, 0.2, , EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE, TYPE.BONUS]
  ,["特防[0.3]/Bonus[0.3]", "とくほ", 1, 0.3, , EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE, TYPE.BONUS]
  ,["特防[0.5]/Bonus[0.5]", "とくほ", 1, 0.5, , EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE, TYPE.BONUS]
  ,["特防[0.6]/Bonus[0.6]", "とくほ", 1, 0.6, , EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE, TYPE.BONUS]
  ,["特防[0.7]/Bonus[0.7]", "とくほ", 1, 0.7, , EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE, TYPE.BONUS]
  ,["特防[0.8]/Bonus[0.8]", "とくほ", 1, 0.8, , EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE, TYPE.BONUS]
  ,["特防[1.7]/Bonus[1.7]", "", 1, 1.7, , EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE, TYPE.BONUS]
  ,["特防[10.0]/Bonus[10.0]", "", 1, 10, , EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE, TYPE.BONUS]
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
  ,["<防御強化>に貫通/Ignore DEF Up", "ほうき", 0, [2.22, 1], , EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE]
  ,["暴走/Berserk", "ほうそ", 0, 1.3]
  ,["暴走/Berserk", "ほうそ", 1, 1.3]
  ,["暴走+/Berserk+", "ほうそ+", 0, 1.3]
  ,["暴走+/Berserk+", "ほうそ+", 1, 1.3, , EFFECT_FLAG.FIXED]
  ,["マヒ/Paralysis", "まひ", 0, 0.9]
  ,["×<無窮>", "むき", 2]
  ,["烙印/Stigma", "らく", 1, 1.15]
  ,["連撃/Combo", "れん", 0, 0.6, , EFFECT_FLAG.FIXED, TYPE.COMBO]
  ,["[宝船]攻撃力小UP/[T.Ship]攻撃力小UP", "こうけきりよく1", 0, 0, 250]
  ,["[宝船]攻撃力中UP/[T.Ship]攻撃力中UP", "こうけきりよく2", 0, 0, 500]
  ,["[宝船]攻撃力大UP/[T.Ship]攻撃力大UP", "こうけきりよく3", 0, 0, 1000]
  ,["CS変更：全域/Change CS Type: All", "CS", 0, 0, 8, EFFECT_FLAG.FIXED, TYPE.CSWEAPON]
  ,["[子]おせち/[Osechi]おせち", "おせ", 0, 1.2, 50, EFFECT_FLAG.STACKABLE, , 0]
  ,["[子]おせち/[Osechi]おせち", "おせ", 1, 0.8, , EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE]
  ,["[第10章]負傷/[Ch.10]負傷", "ふし", 0, 0.2, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE]
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
  ,["攻撃力減少", "こうけきりよくけ", 0, 0.01, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE]
  ,["特攻[6.0]/Bonus[6.0]", "とつ", 0, 6, , EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE, TYPE.BONUS]
  ,["CS変更：魔法/Change CS Type: Magic", "CS", 0, 0, 5, EFFECT_FLAG.FIXED, TYPE.CSWEAPON]
  ,["攻撃力微増[1.13]", "こうけきりよくひ", 0, 1.13, , EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE|EFFECT_FLAG.IRREMOVABLE]
  ,["[カスタム]/[Customizable]", "", 0, 1, , EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE, TYPE.CUSTOM]
  ,["[カスタム]/[Customizable]", "", 1, 1, , EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE, TYPE.CUSTOM]
  ,["<束縛>時強化", "そく", 0, [10, 1], , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE]
  ,["特攻[1.3]/Bonus[1.3]", "とつ", 0, 1.3, , EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE, TYPE.BONUS]
  ,["<守護>無効化", "しゆこむ", 1, [2.22, 1], , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE]
  ,["<防御強化>無効化", "ほうき", 1, [2.22, 1], , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE]
  ,["劫火/Conflagration", "こうか", 1, 0, 3000, EFFECT_FLAG.FIXED]
  ,["<暴走+>時強化", "ほうそ+", 0, [2.6, 1], , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE]
  ,["<*暴走+>時強化", "ほうそ+", 1, [0.77, 1], , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE]
  ,["ダメージ無効", "ため", 1, 0, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE, TYPE.ZERO]
  ,["[竜宮]<守護>時強化/[Virtual]守護時強化", "しゆこし", 1, [0.01, 1], , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE]
  ,["[竜宮]熱情時強化/[Virtual]熱情時強化", "ねつ", 1, 0.01, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE]
  ,["<*暴走>時防御強化", "ほうそ", 1, [0.7, 1], , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE]
  ,["<*暴走+>時防御強化", "ほうそ+", 1, [0.7, 1], , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE]
  ,["<聖油>時弱化", "せいゆし", 1, 0, [10000, 0], EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE]
  ,["根性時強化[2.0]", "こんし2", 0, 2, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE]
  ,["非根性時強化", "ひこ", 1, 0.5, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE]
  ,["CS変更：打撃/Change CS Type: Blow", "CS", 0, 0, 3, EFFECT_FLAG.FIXED, TYPE.CSWEAPON]
  ,["CS変更：横一文字/Change CS Type: Long Slash", "CS", 0, 0, 7, EFFECT_FLAG.FIXED, TYPE.CSWEAPON]
  ,["本格コルク銃", "", 0, 1, , EFFECT_FLAG.EVENT|EFFECT_FLAG.FIXED, TYPE.ATK]
  ,["[福祭]イカ焼き/[Illusion]イカ焼き", "いか", 0, 37, , EFFECT_FLAG.FIXED]
  ,["CS変更：無/Change CS Type: None", "CS", 0, 0, 9, EFFECT_FLAG.FIXED, TYPE.CSWEAPON]
  ,["魅了時弱化[防御]/魅了時弱化[Defense]", "みり", 1, 3, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE]
  ,["特殊耐性[0.05]", "とくし", 1, 0.05, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE]
  ,["<暗闇>時強化", "くら", 0, [2.5, 1], , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE]
  ,["暗闇時強化", "くら", 1, 0.7, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE]
  ,["<憑依>時強化", "ひよ", 0, [91, 1], , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE]
  ,["非<憑依>時弱化", "ひひ", 0, [1, 0.1], , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE]
  ,["デメリット[0.25]", "", 0, 0.25, , EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE, TYPE.BONUS]
  ,["友情時強化", "ゆう", 0, 1.5, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE]
  ,["回数回避", "かいす", 1, 0.01, , EFFECT_FLAG.IRREMOVABLE]
  ,["<回数回避>無効化", "かいす", 1, [100, 1], , EFFECT_FLAG.IRREMOVABLE]
  ,["[第11章]強化時超弱体/[Ch.11]強化時超弱体", "きようかし", 0, 0.01, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE]
  ,["非加速時強化", "ひか", 1, 0.6, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE]
  ,["火傷時弱化", "やけ", 1, 1.5, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE]
  ,["祝福時強化", "しゆ", 0, 2, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE]
  ,["金剛時強化", "こんこ", 0, 1.5, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE]
  ,["[聖夜]悪い子弱体/[Xmas]悪い子弱体", "わる", 0, 0.01, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE]
  ,["<クリティカル>強化", "くり", 0, [2.5, 1], , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE]
  ,["被ダメージ増加", "ひだ", 1, 2, , EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE|EFFECT_FLAG.IRREMOVABLE]
  ,["滋養時強化", "しよ", 1, 0.8, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE]
  ,["根性時強化[1.5]", "こんし1", 0, 1.5, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE]
  ,["特殊耐性[0.1]", "とくし", 1, 0.1, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE]
  ,["<剛力>時強化", "こうり", 0, [1.5, 1], , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE]
  ,["攻撃力微増[1.2]", "こうけきりよくひ", 0, 1.2, , EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE|EFFECT_FLAG.IRREMOVABLE]
  ,["無窮/Infinitude", "むき", 0, 1.3, , EFFECT_FLAG.STACKABLE]
  ,["[コロッセオ]チョコ", "ちよ", 0, 3, , EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE|EFFECT_FLAG.IRREMOVABLE]
  ,["[コロッセオ]チョコ", "ちよ", 1, 0.3, , EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE|EFFECT_FLAG.IRREMOVABLE]
  ,["<*[コロッセオ]チョコ>特攻", "ちよ", 0, [100, 1], , EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE, TYPE.BONUS]
  ,["特防[0.05]/Bonus[0.05]", "とくほ", 1, 0.05, , EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE, TYPE.BONUS]
  ,["特殊耐性[0.12]", "とくし", 1, 0.12, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE]
  ,["悪魔の契約", "あく", 0, 6, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE]
  ,["悪魔の契約-<契約の代償>", "あく", 1, [0.3, 1], , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE]
  ,["契約の代償-<*悪魔の契約>", "けい", 1, 0, [0, 10000], EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE]
  ,["弱体時強化[防御]/弱体時強化[Defense]", "しやくた", 1, 0.1, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE]
  ,["<呪い>時強化", "のろ", 0, [5, 1], , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE]
  ,["攻撃力低下", "こうけきりよくて", 0, 0.7, , EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE|EFFECT_FLAG.IRREMOVABLE]
  ,["非弱体時弱化", "ひし", 0, 0.5, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE, TYPE.NOT_DEBUFFED]
  ,["非弱体時弱化", "ひし", 1, 2.5, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE, TYPE.NOT_DEBUFFED]
  ,["特殊耐性[0.01]", "とくし", 1, 0.01, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE]
  ,["憑依", "ひよ", 0, 1, , EFFECT_FLAG.FIXED|EFFECT_FLAG.TOKEN]
  ,["疑念-<憑依>", "きね", 0, [10, 0.1], , EFFECT_FLAG.FIXED]
  ,["非祈り時強化", "ひい", 0, 4, , EFFECT_FLAG.FIXED|EFFECT_FLAG.IRREMOVABLE]
]);

function generateEffectData(s, group){
  var result = [];
  s.forEach(function(value){
    var name = value[0];
    var g = (value[2] & TIMING.CS) ? EFFECT_MAX : 0;
    for(var i = 1; i < EFFECT.length; i++){
      if(t(EFFECT[i].name, 0) === name && (group === undefined || EFFECT[i].group === group)){
        if(!EFFECT[i].isToken()) result.push(i + g);
        break;
      }
    }
  });
  return result;
}

function splitEffects(s){
  return generateEffectData(splitSkills(s));
}
