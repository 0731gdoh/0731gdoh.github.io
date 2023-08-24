"use strict";

var TAG_TYPE = {
  CATEGORY: 0,
  BUFF: 1,
  DEBUFF: 2,
  STATIC: 3,
  ONE_SHOT: 4,
  WEAPON: 5,
  SKILL: 6,
  SKIP: 7,
  IRREMOVABLE_BUFF: 8,
  IRREMOVABLE_DEBUFF: 9,
  STATUS_GROUP: 10,

  ALL_BUFFS: 12,
  ALL_DEBUFFS: 13,
  A_BONUS: 14,
  D_BONUS: 15,
  SPECIAL: 16,
  UNKNOWN: 17,
  CWT_GROUP: 18
};

var TAG_FLAG_NUM = {
  SELF: 0,
  ALLY: 1,
  ENEMY: 2,
  BONUS_A: 3,
  BONUS_D: 4,
  NULLIFY: 5,
  STATIC: 6
};

function Tag(index, x, category, subset, bonusTarget){
  this.index = index;
  this.name = x[0];
  this.reading = x[1];
  this.type = x[2];
  this.category = category;
  this.subset = subset;
  this.bonusTarget = bonusTarget;
  this.flags = [];
  if(index < 3){
    this.sortkey = 0;
  }else{
    switch(this.type){
      case TAG_TYPE.STATUS_GROUP:
        this.sortkey = 2;
        break;
      case TAG_TYPE.ONE_SHOT:
        this.sortkey = 3;
        break;
      case TAG_TYPE.WEAPON:
        this.sortkey = 4;
        break;
      case TAG_TYPE.SKILL:
        this.sortkey = (x[0].indexOf("名の付くスキル") === -1) ? 3 : 4;
        break;
      case TAG_TYPE.SPECIAL:
        this.sortkey = 5;
        break;
      case TAG_TYPE.CATEGORY:
        if(this.reading[0][0] !== "ん"){
          this.sortkey = 6;
        }else{
          this.sortkey = 7;
        }
        break;
      case TAG_TYPE.A_BONUS:
        this.sortkey = 3;
        this.type = TAG_TYPE.STATIC;
        break;
      case TAG_TYPE.D_BONUS:
        this.sortkey = 5;
        this.type = TAG_TYPE.STATIC;
        break;
      default:
        this.sortkey = 1;
    }
  }
}
Tag.prototype = {
  toString: function(){
    if(this.type !== TAG_TYPE.CATEGORY) return t(this.name);
    if(this.name) return t("カテゴリ：/Category: ") + t(this.name);
    return "－";
  },
  setFlag: function(n, b){
    this.flags[n] = (this.flags[n] || 0) | b;
  },
  checkFlag: function(n, b){
    return (this.flags[n] || 0) & b;
  }
};
Tag.createList = function(a){
  var table = new Map();
  var tget = function(x){
    return table.get(x);
  };
  var buff = [];
  var debuff = [];
  var result = [];
  var orderData = [];
  var order = [];
  var labels = [];
  var k = [];
  var en = false;
  var f = function(a, b){
    var x = result[a];
    var y = result[b];
    if(x.sortkey !== y.sortkey) return x.sortkey - y.sortkey;
    if(x.reading === y.reading) return x.index - y.index;
    if(en && k[a] !== k[b]) return k[a] < k[b] ? -1 : 1;
    return x.reading < y.reading ? -1 : 1;
  };
  a.forEach(function(v, i){
    table.set(t(v[0], 0), i);
    if(v[2] === TAG_TYPE.BUFF) buff.push(i);
    if(v[2] === TAG_TYPE.DEBUFF) debuff.push(i);
  });
  a.forEach(function(v, i){
    var tag;
    var c = [];
    var s = [];
    if(v[3]) c = v[3].split("/").map(tget);
    if(v[4]) s = v[4].split("/").map(tget);
    switch(v[2]){
      case TAG_TYPE.ALL_BUFFS:
        s = buff;
        break;
      case TAG_TYPE.ALL_DEBUFFS:
        s = debuff;
        break;
      case TAG_TYPE.BUFF:
        c.push(table.get("強化"));
        c.push(table.get("強化(解除可)"));
        break;
      case TAG_TYPE.IRREMOVABLE_BUFF:
        c.push(table.get("強化"));
        c.push(table.get("強化(解除不可)"));
        break;
      case TAG_TYPE.DEBUFF:
        c.push(table.get("弱体"));
        c.push(table.get("弱体(解除可)"));
        break;
      case TAG_TYPE.IRREMOVABLE_DEBUFF:
        c.push(table.get("弱体"));
        c.push(table.get("弱体(解除不可)"));
        break;
    }
    tag = new Tag(i, v, c, s, tget(v[5]));
    result.push(tag);
    if(i && tag.reading){
      var o = orderData[tag.sortkey] || [];
      o.push(i);
      orderData[tag.sortkey] = o;
    }
    if(tag.type === TAG_TYPE.WEAPON){
      k.push("");
    }else{
      k.push(t(v[0], 1).replace(/ *\(.+/, "").replace(/Type:.+/, "Type").toUpperCase());
    }
  });
  for(var i = 0; i < 2; i++){
    order.push(orderData.reduce(function(a, x, i){
      if([3, 5, 6].indexOf(i) !== -1) a.push(0);
      return a.concat(x.sort(f))
    }, [0]));
    en = true;
  }
  result.ORDER = order;
  labels[TAG_FLAG_NUM.BONUS_A] = ["状態変化/Status Effect", "スキル/Skill", "特殊/Special", ""];
  labels[TAG_FLAG_NUM.SELF] = labels[TAG_FLAG_NUM.ALLY] = labels[TAG_FLAG_NUM.ENEMY] = ["状態変化/Status Effect", "単発効果/One-Shot Effect", "", "カテゴリ/Category"];
  labels[TAG_FLAG_NUM.STATIC] = ["一般/General", "特攻/Attack Advantage", "特防/Defense Advantage", "カテゴリ/Category"];
  result.LABELS = labels;
  result.table = table;
  return result;
};

var TAG_MAX = 10000;

var TAG = Tag.createList(
  [["", "", TAG_TYPE.CATEGORY]
  ,["全ての強化/All buffs", "すへきよ", TAG_TYPE.ALL_BUFFS]
  ,["全ての弱体/All debuffs", "すへしや", TAG_TYPE.ALL_DEBUFFS]
  ,["移動不能になる状態/Status that cause immobility", "いと", TAG_TYPE.STATUS_GROUP, "", "威圧/恐怖/崩し/不動/マヒ"]
  ,["攻撃力が低下する状態/Status that lower attack", "こうてい", TAG_TYPE.STATUS_GROUP, "", "疑念/強化反転/暗闇/幻惑/束縛/呪い/マヒ"]
  ,["スキルが封印される状態/Skill sealing status", "すき", TAG_TYPE.STATUS_GROUP, "", "スキル封印/束縛/二重封印"]
  ,["被ダメージが増加する状態/Status that increase received damage", "ひた", TAG_TYPE.STATUS_GROUP, "", "強化反転/崩し/契約の代償/激怒/激怒+/劫火/弱点/凍結/発狂/暴走/暴走+/烙印"]
  ,["防御力が上昇する状態/Status that raise defense", "ほう", TAG_TYPE.STATUS_GROUP, "", "頑強/金剛/守護/聖油/防御強化"]
  ,["CP減少/Deplete CP", "CPけ", TAG_TYPE.ONE_SHOT, "CP減少系"]
  ,["CP増加/Increase CP", "CPそ", TAG_TYPE.ONE_SHOT, "CP増加系"]
  ,["CS封印/CS Lock", "CSふ", TAG_TYPE.DEBUFF, "CS封印系"]
  ,["CS変更/Change CS Type", "CSへ", TAG_TYPE.BUFF]
  ,["CS変更：打撃/Change CS Type: Blow", "CSへ3", TAG_TYPE.BUFF, "CS変更"]
  ,["CS変更：魔法/Change CS Type: Magic", "CSへ5", TAG_TYPE.BUFF, "CS変更"]
  ,["CS変更：横一文字/Change CS Type: Long Slash", "CSへ6", TAG_TYPE.BUFF, "CS変更"]
  ,["CS変更：全域/Change CS Type: All", "CSへ8", TAG_TYPE.BUFF, "CS変更"]
  ,["HP回復/Restore HP", "HPか", TAG_TYPE.ONE_SHOT, "HP回復系"]
  ,["HP減少/Decrease HP", "HPけ", TAG_TYPE.ONE_SHOT, "HP減少系"]
  ,["悪魔の契約/Deal with the Devil", "あく", TAG_TYPE.IRREMOVABLE_BUFF, "攻撃増加系/防御増加系/CP増加系"]
  ,["威圧/Oppression", "いあ", TAG_TYPE.DEBUFF, "移動封印系"]
  ,["怒時強化/Anger Strengthening", "いか", TAG_TYPE.IRREMOVABLE_BUFF, "攻撃増加系"]
  ,["意気/Spirit", "いき", TAG_TYPE.BUFF, "攻撃増加系"]
  ,["移動力増加/Increase movement", "いとそう", TAG_TYPE.STATIC]
  ,["移動力増加(縦)/Increase movement (vertical)", "いとそう1", TAG_TYPE.STATIC, "移動力増加"]
  ,["移動力増加(横)/Increase movement (horizontal)", "いとそう2", TAG_TYPE.STATIC, "移動力増加"]
  ,["移動力増加(全)/Increase movement (all)", "いとそう3", TAG_TYPE.STATIC, "移動力増加/移動力増加(縦)/移動力増加(横)"]
  ,["祈り/Prayer", "いの", TAG_TYPE.BUFF, "発動率増加系"]
  ,["祈り時強化[クルースニク]", "", TAG_TYPE.IRREMOVABLE_BUFF, "祈り時強化/HP回復系"]
  ,["温泉/Hot Springs", "おん", TAG_TYPE.IRREMOVABLE_BUFF, "CP増加系"]
  ,["回避/Evasion", "かいひ", TAG_TYPE.BUFF, "防御増加系"]
  ,["回避時強化/Evasion Strengthening", "かいひしき", TAG_TYPE.IRREMOVABLE_BUFF, "発動率増加系"]
  ,["回避に貫通/Ignore Evasion", "かいひにか", TAG_TYPE.STATIC, "特攻/貫通系"]
  ,["獲得経験値アップ/XP Bonus", "かくとくけいあ", TAG_TYPE.STATIC, "報酬増加系"]
  ,["獲得コインアップ/Coin Bonus", "かくとくこい", TAG_TYPE.STATIC, "報酬増加系"]
  ,["加速/Acceleration", "かそ", TAG_TYPE.BUFF, "CP増加系"]
  ,["加速時強化[AR]", "", TAG_TYPE.IRREMOVABLE_BUFF, "加速時強化/CP増加系"]
  ,["加速時強化[ジェド]", "", TAG_TYPE.IRREMOVABLE_BUFF, "加速時強化/発動率増加系"]
  ,["頑強/Tenacity", "かん", TAG_TYPE.BUFF, "防御増加系"]
  ,["頑強時強化[タンガロア]", "", TAG_TYPE.IRREMOVABLE_BUFF, "頑強時強化/攻撃増加系"]
  ,["頑強に貫通/Ignore Tenacity", "かんにか", TAG_TYPE.STATIC, "特攻/貫通系"]
  ,["疑念/Doubt", "きね", TAG_TYPE.DEBUFF, "攻撃増加系/攻撃減少系"]
  ,["強化解除/Remove buff", "きようかか", TAG_TYPE.ONE_SHOT]
  ,["強化解除(単)/Remove buff (single)", "きようかか1", TAG_TYPE.ONE_SHOT, "強化解除"]
  ,["強化解除(複)/Remove buff (multiple)", "きようかか2", TAG_TYPE.ONE_SHOT, "強化解除"]
  ,["強化解除(全)/Remove buff (all)", "きようかか3", TAG_TYPE.ONE_SHOT, "強化解除"]
  ,["強化奪取/Steal buff", "きようかた", TAG_TYPE.ONE_SHOT]
  ,["強化奪取(単)/Steal buff (single)", "きようかた1", TAG_TYPE.ONE_SHOT, "強化奪取/強化解除/強化解除(単)/強化を複製"]
  ,["強化奪取(複)/Steal buff (multiple)", "きようかた2", TAG_TYPE.ONE_SHOT, "強化奪取/強化解除/強化解除(複)/強化を複製"]
  ,["強化転写/Transfer buff", "きようかて", TAG_TYPE.ONE_SHOT]
  ,["強化転写(複)/Transfer buff (multiple)", "きようかて2", TAG_TYPE.ONE_SHOT, "強化転写"]
  ,["強化転写(全)/Transfer buff (all)", "きようかて3", TAG_TYPE.ONE_SHOT, "強化転写"]
  ,["強化反転/Buff Reversal", "きようかは", TAG_TYPE.DEBUFF, "攻撃減少系/防御減少系"]
  ,["強化無効/Nullify Buff", "きようかむ", TAG_TYPE.DEBUFF]
  ,["強化を複製/Copy buff", "きようかをふ", TAG_TYPE.ONE_SHOT]
  ,["強化を貼付(味方から)/Paste buff (from ally)", "きようかをち1", TAG_TYPE.ONE_SHOT]
  ,["強化を貼付(敵から)/Paste buff (from enemy)", "きようかをち2", TAG_TYPE.ONE_SHOT]
  ,["強制移動無効(後)/Nullify forced movement (backward)", "きようせ1", TAG_TYPE.STATIC]
  ,["強制移動無効(全)/Nullify forced movement (all)", "きようせ2", TAG_TYPE.STATIC, "強制移動無効(後)"]
  ,["恐怖/Fear", "きようふ", TAG_TYPE.DEBUFF, "CP減少系/移動封印系"]
  ,["極限/Limit", "きよく", TAG_TYPE.BUFF, "攻撃増加系"]
  ,["崩し/Break", "くす", TAG_TYPE.DEBUFF, "防御減少系/移動封印系"]
  ,["暗闇/Darkness", "くら", TAG_TYPE.DEBUFF, "攻撃減少系/CS封印系"]
  ,["暗闇時強化[シヴァ]", "", TAG_TYPE.IRREMOVABLE_BUFF, "暗闇時強化/攻撃増加系/防御増加系"]
  ,["クリティカル/Crit", "くり", TAG_TYPE.BUFF, "攻撃増加系"]
  ,["クリティカル強化/Critical Strengthening", "くりき", TAG_TYPE.IRREMOVABLE_BUFF, "攻撃増加系"]
  ,["クリティカル+/Crit+", "くり+", TAG_TYPE.BUFF, "攻撃増加系"]
  ,["クリティカル++/Crit++", "くり++", TAG_TYPE.BUFF, "攻撃増加系"]
  ,["契約の代償/Price of Contract", "けいや", TAG_TYPE.IRREMOVABLE_DEBUFF, "防御減少系/発動率減少系"]
  ,["係留/Anchor", "けいり", TAG_TYPE.BUFF]
  ,["激怒/Rage", "けき", TAG_TYPE.BUFF, "攻撃増加系/防御減少系"]
  ,["激怒+/Rage+", "けき+", TAG_TYPE.BUFF, "攻撃増加系/防御減少系"]
  ,["激怒+時強化/Rage+ Strengthening", "けきしき+", TAG_TYPE.IRREMOVABLE_BUFF, "発動率増加系"]
  ,["幻惑/Dazzle", "けん", TAG_TYPE.DEBUFF, "攻撃減少系"]
  ,["劫火/Conflagration", "こうか", TAG_TYPE.DEBUFF, "防御減少系"]
  ,["劫火時強化#1", "", TAG_TYPE.IRREMOVABLE_BUFF, "劫火時強化/防御増加系/CP増加系"]
  ,["攻撃強化/ATK Up", "こうけきき", TAG_TYPE.BUFF, "攻撃増加系"]
  ,["攻撃力減少/Reduced ATK", "こうけきりよくけ", TAG_TYPE.IRREMOVABLE_DEBUFF, "攻撃減少系"]
  ,["攻撃力低下/ATK Reduction", "こうけきりよくて", TAG_TYPE.IRREMOVABLE_DEBUFF, "攻撃減少系"]
  ,["攻撃力微増[AR]", "", TAG_TYPE.IRREMOVABLE_BUFF, "攻撃力微増/攻撃増加系"]
  ,["攻撃力微増[セト]", "", TAG_TYPE.IRREMOVABLE_BUFF, "攻撃力微増/攻撃増加系"]
  ,["剛力/Brawn", "こうり", TAG_TYPE.BUFF, "攻撃増加系"]
  ,["剛力時強化/Brawn Strengthening", "こうりしき", TAG_TYPE.IRREMOVABLE_BUFF, "攻撃増加系"]
  ,["告死/Countdown", "こく", TAG_TYPE.DEBUFF, "HP減少系"]
  ,["金剛/Adamantine", "こんこ", TAG_TYPE.BUFF, "防御増加系"]
  ,["金剛時強化/Adamantine Strengthening", "こんこしき", TAG_TYPE.IRREMOVABLE_BUFF, "攻撃増加系"]
  ,["金剛に貫通/Ignore Adamantine", "こんこにか", TAG_TYPE.STATIC, "特攻/貫通系"]
  ,["根性/Guts", "こんし", TAG_TYPE.BUFF]
  ,["根性時強化[浅草AR]", "", TAG_TYPE.IRREMOVABLE_BUFF, "根性時強化/攻撃増加系"]
  ,["根性時強化[マガン]", "", TAG_TYPE.IRREMOVABLE_BUFF, "根性時強化/攻撃増加系"]
  ,["再生/Regeneration", "さい", TAG_TYPE.BUFF, "HP回復系"]
  ,["弱体解除/Remove debuff", "しやくたいか", TAG_TYPE.ONE_SHOT]
  ,["弱体解除(単)/Remove debuff (single)", "しやくたいか1", TAG_TYPE.ONE_SHOT, "弱体解除"]
  ,["弱体解除(複)/Remove debuff (multiple)", "しやくたいか2", TAG_TYPE.ONE_SHOT, "弱体解除"]
  ,["弱体解除(全)/Remove debuff (all)", "しやくたいか3", TAG_TYPE.ONE_SHOT, "弱体解除"]
  ,["弱体時強化[マガン]", "", TAG_TYPE.IRREMOVABLE_BUFF, "弱体時強化/HP回復系/CP増加系"]
  ,["弱体時強化[ヴォルフ]", "", TAG_TYPE.IRREMOVABLE_BUFF, "弱体時強化/防御増加系"]
  ,["弱体奪取/Steal debuff", "しやくたいた", TAG_TYPE.ONE_SHOT]
  ,["弱体奪取(複)/Steal debuff (multiple)", "しやくたいた2", TAG_TYPE.ONE_SHOT, "弱体奪取/弱体解除/弱体解除(複)/弱体を複製(味方に)"]
  ,["弱体転写(全)/Transfer debuff (all)", "しやくたいて3", TAG_TYPE.ONE_SHOT, "弱体転写/弱体を貼付"]
  ,["弱体反射/Reflect Debuff", "しやくたいは", TAG_TYPE.BUFF, "弱体無効系"]
  ,["弱体無効/Nullify Debuff", "しやくたいむ", TAG_TYPE.BUFF, "弱体無効系"]
  ,["弱体を複製(味方に)/Copy debuff (to ally)", "しやくたいをふ1", TAG_TYPE.ONE_SHOT]
  ,["弱体を複製(敵に)/Copy debuff (to enemy)", "しやくたいをふ2", TAG_TYPE.ONE_SHOT]
  ,["弱体を貼付/Paste debuff", "しやくたいをち", TAG_TYPE.ONE_SHOT]
  ,["弱点/Weakness", "しやくて", TAG_TYPE.DEBUFF, "防御減少系"]
  ,["集中/Concentration", "しゆう", TAG_TYPE.BUFF, "攻撃増加系/発動率増加系"]
  ,["祝福/Blessing", "しゆく", TAG_TYPE.BUFF, "HP回復系"]
  ,["祝福時強化[チョウジ]", "", TAG_TYPE.IRREMOVABLE_BUFF, "祝福時強化/攻撃増加系"]
  ,["祝福時弱化[メフィストフェレス]", "", TAG_TYPE.IRREMOVABLE_DEBUFF, "祝福時弱化/HP減少系"]
  ,["守護/Protection", "しゆこ", TAG_TYPE.BUFF, "防御増加系"]
  ,["守護に貫通/Ignore Protection", "しゆこにか", TAG_TYPE.STATIC, "特攻/貫通系"]
  ,["守護無効化/Nullify Protection", "しゆこむこ", TAG_TYPE.IRREMOVABLE_DEBUFF, "防御減少系"]
  ,["滋養/Nourishment", "しよう", TAG_TYPE.BUFF, "攻撃増加系/HP回復系"]
  ,["滋養時強化[アシガラ]", "", TAG_TYPE.IRREMOVABLE_BUFF, "滋養時強化/攻撃増加系/防御増加系"]
  ,["スキル封印/Skill Lock", "すきるふ", TAG_TYPE.DEBUFF, "スキル封印系"]
  ,["聖油/Unction", "せい", TAG_TYPE.BUFF, "防御増加系/HP回復系"]
  ,["聖油時弱化/Unction Weakening", "せいしし", TAG_TYPE.IRREMOVABLE_DEBUFF, "防御減少系"]
  ,["聖油に貫通/Ignore Unction", "せいにか", TAG_TYPE.STATIC, "特攻/貫通系"]
  ,["全方向移動力増加/Increased movement range (all directions)", "せんほ1", TAG_TYPE.BUFF, "移動力増加系"]
  ,["全方向移動力大増/Greatly increase own movement range (all directions)", "せんほ2", TAG_TYPE.IRREMOVABLE_BUFF, "移動力増加系"]
  ,["束縛/Bind", "そく", TAG_TYPE.DEBUFF, "攻撃減少系/スキル封印系"]
  ,["束縛時強化/Bind Strengthening", "そくしき", TAG_TYPE.IRREMOVABLE_BUFF, "攻撃増加系"]
  ,["脱力/Drain", "たつ", TAG_TYPE.DEBUFF, "CP減少系/発動率減少系"]
  ,["注目/Taunt", "ちゆ", TAG_TYPE.BUFF]
  ,["注目時強化[オンブレティグレ]", "", TAG_TYPE.IRREMOVABLE_BUFF, "注目時強化/発動率増加系"]
  ,["デメリット[0.25]/Demerit[0.25]", "てめ", TAG_TYPE.A_BONUS]
  ,["凍結/Freeze", "とうけ", TAG_TYPE.DEBUFF, "防御減少系/HP減少系"]
  ,["凍結時弱化[イツァムナー]", "", TAG_TYPE.IRREMOVABLE_DEBUFF, "凍結時弱化/発動率減少系"]
  ,["闘志/Vigor", "とうし", TAG_TYPE.BUFF, "攻撃増加系"]
  ,["毒/Poison", "とく", TAG_TYPE.DEBUFF, "HP減少系"]
  ,["毒反転/Poison Reversal", "とくは", TAG_TYPE.BUFF, "攻撃増加系/防御増加系/HP回復系"]
  ,["特防/D.Advantage", "とくほ", TAG_TYPE.D_BONUS]
  ,["特防[0.3]/D.Advantage[0.3]", "とくほ03", TAG_TYPE.D_BONUS, "特防"]
  ,["特防[0.5]/D.Advantage[0.5]", "とくほ05", TAG_TYPE.D_BONUS, "特防"]
  ,["特防[0.6]/D.Advantage[0.6]", "とくほ06", TAG_TYPE.D_BONUS, "特防"]
  ,["特防[0.7]/D.Advantage[0.7]", "とくほ07", TAG_TYPE.D_BONUS, "特防"]
  ,["特防[0.8]/D.Advantage[0.8]", "とくほ08", TAG_TYPE.D_BONUS, "特防"]
  ,["特攻/A.Advantage", "とつ", TAG_TYPE.A_BONUS]
  ,["特攻[1.3]/A.Advantage[1.3]", "とつ13", TAG_TYPE.A_BONUS, "特攻"]
  ,["特攻[1.4]/A.Advantage[1.4]", "とつ14", TAG_TYPE.A_BONUS, "特攻"]
  ,["特攻[1.5]/A.Advantage[1.5]", "とつ15", TAG_TYPE.A_BONUS, "特攻"]
  ,["特攻[1.6]/A.Advantage[1.6]", "とつ16", TAG_TYPE.A_BONUS, "特攻"]
  ,["特攻[1.67]/A.Advantage[1.67]", "とつ167", TAG_TYPE.A_BONUS, "特攻"]
  ,["特攻[2.0]/A.Advantage[2.0]", "とつ2", TAG_TYPE.A_BONUS, "特攻"]
  ,["特攻[2.3]/A.Advantage[2.3]", "とつ23", TAG_TYPE.A_BONUS, "特攻"]
  ,["特攻[2.5]/A.Advantage[2.5]", "とつ25", TAG_TYPE.A_BONUS, "特攻"]
  ,["特攻[3.0]/A.Advantage[3.0]", "とつ3", TAG_TYPE.A_BONUS, "特攻"]
  ,["特攻[4.0]/A.Advantage[4.0]", "とつ4", TAG_TYPE.A_BONUS, "特攻"]
  ,["特攻[6.0]/A.Advantage[6.0]", "とつ6", TAG_TYPE.A_BONUS, "特攻"]
  ,["二重封印/Double Lock", "にし", TAG_TYPE.DEBUFF, "スキル封印系/CS封印系"]
  ,["熱情/Ardor", "ねつ", TAG_TYPE.BUFF, "攻撃増加系/CP増加系"]
  ,["呪い/Curse", "のろ", TAG_TYPE.DEBUFF, "攻撃減少系"]
  ,["呪い時強化[ヴォルフ]", "", TAG_TYPE.IRREMOVABLE_BUFF, "呪い時強化/攻撃増加系"]
  ,["発狂/Madness", "はつ", TAG_TYPE.DEBUFF, "防御減少系/移動力減少系"]
  ,["非加速時強化/Non-Acceleration Strengthening", "ひかそ", TAG_TYPE.IRREMOVABLE_BUFF, "防御増加系"]
  ,["引き寄せ/Draw", "ひきよせ", TAG_TYPE.ONE_SHOT]
  ,["引き寄せ(1マス)/Draw (1 square)", "ひきよせ1", TAG_TYPE.ONE_SHOT, "強制移動系/引き寄せ"]
  ,["引き寄せ(2マス)/Draw (2 squares)", "ひきよせ2", TAG_TYPE.ONE_SHOT, "強制移動系/引き寄せ"]
  ,["引き寄せ(3マス)/Draw (3 squares)", "ひきよせ3", TAG_TYPE.ONE_SHOT, "強制移動系/引き寄せ"]
  ,["引き寄せ(4マス)/Draw (4 squares)", "ひきよせ4", TAG_TYPE.ONE_SHOT, "強制移動系/引き寄せ"]
  ,["非祈り時強化/Non-Prayer Strengthening", "ひい", TAG_TYPE.IRREMOVABLE_BUFF, "攻撃増加系"]
  ,["非強化時弱化/Non-Buff Weakening", "ひきようしし", TAG_TYPE.IRREMOVABLE_DEBUFF, "防御減少系"]
  ,["非根性時強化/Non-Guts Strengthening", "ひこ", TAG_TYPE.IRREMOVABLE_BUFF, "防御増加系"]
  ,["非弱体時強化[モリタカ]", "", TAG_TYPE.IRREMOVABLE_BUFF, "非弱体時強化/発動率増加系"]
  ,["非弱体時弱化/Non-Debuff Weakening", "ひししし", TAG_TYPE.IRREMOVABLE_DEBUFF, "攻撃減少系/防御減少系"]
  ,["非憑依時弱化/Non-Possession Weakening", "ひひ", TAG_TYPE.IRREMOVABLE_DEBUFF, "攻撃減少系"]
  ,["憑依/Possession", "ひよ", TAG_TYPE.DEBUFF]
  ,["憑依時強化[エリイ]", "", TAG_TYPE.IRREMOVABLE_BUFF, "憑依時強化/攻撃増加系"]
  ,["閃き/Glint", "ひら", TAG_TYPE.BUFF, "発動率増加系"]
  ,["武器種変更/Change Weapon Type", "ふきし", TAG_TYPE.CWT_GROUP, "", "武器種変更：打撃"]
  ,["武器種変更：斬撃/Change Weapon Type: Slash", "ふきし1", TAG_TYPE.BUFF, "武器種変更"]
  ,["武器種変更：突撃/Change Weapon Type: Trust", "ふきし2", TAG_TYPE.BUFF, "武器種変更"]
  ,["武器種変更：打撃/Change Weapon Type: Blow", "ふきし3", TAG_TYPE.BUFF, "武器種変更"]
  ,["武器種変更：魔法/Change Weapon Type: Magic", "ふきし5", TAG_TYPE.BUFF, "武器種変更"]
  ,["武器種変更：横一文字/Change Weapon Type: Long Slash", "ふきし6", TAG_TYPE.BUFF, "武器種変更"]
  ,["武器種変更：狙撃/Change Weapon Type: Snipe", "ふきし7", TAG_TYPE.BUFF, "武器種変更"]
  ,["武器種変更：全域/Change Weapon Type: All", "ふきし8", TAG_TYPE.BUFF, "武器種変更"]
  ,["武器種変更：無/Change Weapon Type: None", "ふきし9", TAG_TYPE.BUFF, "武器種変更"]
  ,["吹き飛ばし(縦)/Blast (back)", "ふきと1", TAG_TYPE.ONE_SHOT]
  ,["吹き飛ばし(1マス)/Blast (1 square)", "ふきと11", TAG_TYPE.ONE_SHOT, "強制移動系/吹き飛ばし(縦)"]
  ,["吹き飛ばし(2マス)/Blast (2 squares)", "ふきと12", TAG_TYPE.ONE_SHOT, "強制移動系/吹き飛ばし(縦)"]
  ,["吹き飛ばし(3マス)/Blast (3 squares)", "ふきと13", TAG_TYPE.ONE_SHOT, "強制移動系/吹き飛ばし(縦)"]
  ,["吹き飛ばし(右)/Blast (right)", "ふきと2", TAG_TYPE.ONE_SHOT, "強制移動系"]
  ,["吹き飛ばし(左)/Blast (left)", "ふきと3", TAG_TYPE.ONE_SHOT, "強制移動系"]
  ,["不動/Immobility", "ふと", TAG_TYPE.BUFF, "CP増加系/移動封印系"]
  ,["奮起/Arousal", "ふん", TAG_TYPE.BUFF, "CP増加系"]
  ,["妨害/Obstruct", "ほうか", TAG_TYPE.DEBUFF, "発動率減少系"]
  ,["防御強化/DEF Up", "ほうきよき", TAG_TYPE.BUFF, "防御増加系"]
  ,["防御強化に貫通/Ignore DEF Up", "ほうきよきにか", TAG_TYPE.STATIC, "特攻/貫通系"]
  ,["防御強化無効化/Nullify DEF Up", "ほうきよきむこ", TAG_TYPE.IRREMOVABLE_DEBUFF, "防御減少系"]
  ,["暴走/Berserk", "ほうそ", TAG_TYPE.BUFF, "攻撃増加系/防御減少系"]
  ,["暴走+/Berserk+", "ほうそ+", TAG_TYPE.BUFF, "攻撃増加系/防御減少系"]
  ,["暴走時強化/Berserk Strengthening", "ほうそしき", TAG_TYPE.IRREMOVABLE_BUFF, "発動率増加系"]
  ,["暴走+時強化/Berserk+ Strengthening", "ほうそしき+", TAG_TYPE.IRREMOVABLE_BUFF, "攻撃増加系/防御増加系"]
  ,["マヒ/Paralysis", "まひ", TAG_TYPE.DEBUFF, "攻撃減少系/移動封印系"]
  ,["マヒ時弱化/Paralysis Weakening", "まひしし", TAG_TYPE.IRREMOVABLE_DEBUFF, "発動率減少系"]
  ,["魅了/Charm", "みり", TAG_TYPE.DEBUFF]
  ,["魅了時弱化[シヴァ]", "", TAG_TYPE.IRREMOVABLE_DEBUFF, "魅了時弱化/発動率減少系"]
  ,["無窮/Infinitude", "むき", TAG_TYPE.BUFF, "攻撃増加系/HP減少系"]
  ,["猛毒/Fatal Poison", "もう", TAG_TYPE.DEBUFF, "HP減少系"]
  ,["火傷/Burn", "やけ", TAG_TYPE.DEBUFF, "HP減少系"]
  ,["火傷時弱化[ジェド]", "", TAG_TYPE.IRREMOVABLE_DEBUFF, "火傷時弱化/防御減少系"]
  ,["友情時強化/Friendship Strengthening", "ゆうしよ", TAG_TYPE.IRREMOVABLE_BUFF, "攻撃増加系"]
  ,["烙印/Stigma", "らく", TAG_TYPE.DEBUFF, "防御減少系/HP減少系"]
  ,["連撃/Combo", "れん", TAG_TYPE.BUFF, "攻撃増加系"]
  ,["斬撃/Slash", "1", TAG_TYPE.WEAPON]
  ,["突撃/Thrust", "2", TAG_TYPE.WEAPON]
  ,["打撃/Blow", "3", TAG_TYPE.WEAPON]
  ,["射撃/Shot", "4", TAG_TYPE.WEAPON]
  ,["魔法/Magic", "5", TAG_TYPE.WEAPON]
  ,["狙撃/Snipe", "7", TAG_TYPE.WEAPON]
  ,["横一文字/Long Slash", "6", TAG_TYPE.WEAPON]
  ,["全域/All", "8", TAG_TYPE.WEAPON]
  ,["無/None", "9", TAG_TYPE.WEAPON]
  ,["鬼系スキル", "", TAG_TYPE.SKIP, "", "鬼道の衆/鬼子連れのヤンキー/鬼道を束ねる者/鬼気迫る者/愚直なる血鬼"]
  ,["獣系スキル", "", TAG_TYPE.SKIP, "", "獣の末裔/黄昏に弾く獣/首狩りの獣/忠玉の八犬士/ラビリンスの獣/獣蹄のサマリヤ王/獣皮を巻く者/無垢なる獣"]
  ,["チートと名の付くスキル/Cheat skills", "ちい", TAG_TYPE.SKILL, "", "チート系勇者/チートなる者"]
  ,["魔王と名の付くスキル/Load skills", "まお", TAG_TYPE.SKILL, "", "僥倖の魔王/混沌の魔王/退廃の魔王/第四天魔王の子/大力の魔王/常闇の魔王/墓場の魔王/魔王"]
  ,["愛を囚う者/Love Trapper", "あい", TAG_TYPE.SKILL]
  ,["アスリート/Athlete", "あす", TAG_TYPE.SKILL, "", "歓呼のアスリート/直感のアスリート"]
  ,["海を航る者/Seafarer", "うみ", TAG_TYPE.SKILL]
  ,["泳達者/Swimmer", "えい", TAG_TYPE.SKILL]
  ,["大筒の支配者/Ruler of Munition", "おお", TAG_TYPE.SKILL]
  ,["歓呼のアスリート/Jubilant Athlete", "かん", TAG_TYPE.SKILL]
  ,["鬼気迫る者/Frightful Imp", "きき", TAG_TYPE.SKILL]
  ,["鬼道の衆/Oni Brethren", "きとうの", TAG_TYPE.SKILL, "", "鬼子連れのヤンキー"]
  ,["鬼道を束ねる者/Ruler of Ogres", "きとうを", TAG_TYPE.SKILL]
  ,["僥倖の魔王/Fortuitous Dark Lord", "きようこ", TAG_TYPE.SKILL]
  ,["狂戦士/Berserker", "きようせ", TAG_TYPE.SKILL]
  ,["巨人なる者/Giant", "きよし", TAG_TYPE.SKILL]
  ,["首狩りの獣/Head Hunter", "くひ", TAG_TYPE.SKILL]
  ,["獣の末裔/Blood of the Beast", "けも", TAG_TYPE.SKILL, "", "首狩りの獣/獣蹄のサマリヤ王/黄昏に弾く獣/忠玉の八犬士/ラビリンスの獣"]
  ,["骨肉の天地創造者/Creator of Flesh and Bone", "こつ", TAG_TYPE.SKILL]
  ,["混沌の魔王/Lord of Chaos", "こん", TAG_TYPE.SKILL]
  ,["支配者/Ruler", "しは", TAG_TYPE.SKILL, "", "大筒の支配者"]
  ,["島に生きる者/Islander", "しま", TAG_TYPE.SKILL, "", "秘島に生きる怪物"]
  ,["獣皮を巻く者/In Beast's Clothing", "しゆうひ", TAG_TYPE.SKILL]
  ,["須弥山に篭る者/Mt. Meru Dweller", "しゆみ", TAG_TYPE.SKILL]
  ,["戦争屋/Warmonger", "せん", TAG_TYPE.SKILL]
  ,["大雪山に篭る者/Mt. Daisetsu Dweller", "たいせ", TAG_TYPE.SKILL]
  ,["退廃の魔王/Lord of Degeneration", "たいは", TAG_TYPE.SKILL]
  ,["第四天魔王の子/Daughter of the Fourth Heaven's Lord", "たいよ", TAG_TYPE.SKILL]
  ,["大力の魔王/Hulking Lord", "たいり", TAG_TYPE.SKILL]
  ,["黄昏に弾く獣/Wolf of Ragnarok", "たそ", TAG_TYPE.SKILL]
  ,["祟られし者/The Cursed", "たた", TAG_TYPE.SKILL]
  ,["チート系勇者/Cheat Hero", "ちいとけ", TAG_TYPE.SKILL]
  ,["チートなる者/Cheater", "ちいとな", TAG_TYPE.SKILL]
  ,["忠玉の八犬士/Loyal Dog Warrior", "ちゆ", TAG_TYPE.SKILL]
  ,["直感のアスリート/Intuitive Athlete", "ちよ", TAG_TYPE.SKILL]
  ,["翼持つ者/Winged One", "つはさもつも", TAG_TYPE.SKILL, "", "翼持つアイドル"]
  ,["天地創造者/Great Creator", "てん", TAG_TYPE.SKILL, "", "骨肉の天地創造者"]
  ,["常闇の魔王/Lord of Eternal Darkness", "とこ", TAG_TYPE.SKILL]
  ,["轟き奔る者/Thundering Runner", "ととろき", TAG_TYPE.SKILL]
  ,["轟く者/Thunderer", "ととろく", TAG_TYPE.SKILL, "", "轟き奔る者"]
  ,["墓場の魔王/Lord of the Graveyard", "はか", TAG_TYPE.SKILL]
  ,["不死身なる者/Immortal", "ふしみな", TAG_TYPE.SKILL, "", "不死身の密林王"]
  ,["不死身の密林王/Immortal King of The Jungle", "ふしみの", TAG_TYPE.SKILL]
  ,["魔王/Dark Lord", "まお", TAG_TYPE.SKILL, "", "第四天魔王の子"]
  ,["マシンボディ/Mechaman", "まし", TAG_TYPE.SKILL, "", "生存のマシンボディ"]
  ,["緑を育む者/Gardener", "みと", TAG_TYPE.SKILL]
  ,["山に篭る者/Mountain Dweller", "やま", TAG_TYPE.SKILL, "", "須弥山に篭る者/大雪山に篭る者"]
  ,["有尾の悪魔/Tailed Demon", "ゆう", TAG_TYPE.SKILL]
  ,["雷光を現す者/Living Lightning", "らいこうを", TAG_TYPE.SKILL, "", "雷光の装填者"]
  ,["ラビリンスの獣/Beast of the Labyrinth", "らひ", TAG_TYPE.SKILL]
  ,["竜を継ぐ者/Dragonborn", "りゆ", TAG_TYPE.SKILL]
  ,["霊体/Wraith", "れいた", TAG_TYPE.SKILL]
  ,["攻撃増加系/ATK Up", "こう1", TAG_TYPE.CATEGORY]
  ,["攻撃減少系/ATK Down", "こう2", TAG_TYPE.CATEGORY]
  ,["防御増加系/DEF Up", "ほうき1", TAG_TYPE.CATEGORY]
  ,["防御減少系/DEF Down", "ほうき2", TAG_TYPE.CATEGORY]
  ,["HP回復系/Restore HP", "HP1", TAG_TYPE.CATEGORY]
  ,["HP減少系/Decrease HP", "HP2", TAG_TYPE.CATEGORY]
  ,["CP増加系/Increase CP", "CP1", TAG_TYPE.CATEGORY]
  ,["CP減少系/Deplete CP", "CP2", TAG_TYPE.CATEGORY]
  ,["弱体無効系/Nullify Debuff", "しや", TAG_TYPE.CATEGORY]
  ,["発動率増加系/Increase Probability", "はつ1", TAG_TYPE.CATEGORY]
  ,["発動率減少系/Decrease Probability", "はつ2", TAG_TYPE.CATEGORY]
  ,["移動力増加系/Increased Movement", "いとうり1", TAG_TYPE.CATEGORY]
  ,["強制移動系/Forced Move", "きよ", TAG_TYPE.CATEGORY]
  ,["移動封印系/Move Lock", "いとうふ", TAG_TYPE.CATEGORY]
  ,["スキル封印系/Skill Lock", "すき", TAG_TYPE.CATEGORY]
  ,["CS封印系/CS Lock", "CS", TAG_TYPE.CATEGORY]
  ,["貫通系/Ignore", "かん", TAG_TYPE.CATEGORY]
  ,["強化/Buff", "ん1", TAG_TYPE.CATEGORY]
  ,["弱体/Debuff", "ん4", TAG_TYPE.CATEGORY]
  ,["CS威力増加/Increase CS Damage", "CSい", TAG_TYPE.STATIC]
  ,["CS威力増加(+1)/Increase CS Damage (+1)", "CSい1", TAG_TYPE.STATIC, "CS威力増加"]
  ,["CS威力増加(+2)/Increase CS Damage (+2)", "CSい2", TAG_TYPE.STATIC, "CS威力増加"]
  ,["獲得経験値集約/Concentrate gathered XP", "かくとくけいし", TAG_TYPE.STATIC, "報酬増加系"]
  ,["獲得戦友ポイントアップ/Bonus to Ally Points", "かくとくせん", TAG_TYPE.STATIC, "報酬増加系"]
  ,["獲得ランク経験値アップ", "かくとくらん", TAG_TYPE.STATIC, "報酬増加系"]
  ,["暴走時防御強化/DEF Up when Berserk", "ほうそしほ", TAG_TYPE.IRREMOVABLE_BUFF, "防御増加系"]
  ,["暴走+時防御強化/DEF Up when Berserk+", "ほうそしほ+", TAG_TYPE.IRREMOVABLE_BUFF, "防御増加系"]
  ,["魅了時弱化[AR]", "", TAG_TYPE.IRREMOVABLE_DEBUFF, "魅了時弱化/防御減少系"]
  ,["報酬増加系/Bonus Upon Victory", "ほうし", TAG_TYPE.CATEGORY]
  ,["滋養時強化[AR]", "", TAG_TYPE.IRREMOVABLE_BUFF, "滋養時強化/防御増加系"]
  ,["非妨害時弱化/Non-Obstruct Weakening", "ひほ", TAG_TYPE.IRREMOVABLE_DEBUFF, "防御減少系"]
  ,["祝福時弱化[サンダユウ]", "", TAG_TYPE.IRREMOVABLE_DEBUFF, "祝福時弱化/発動率減少系"]
  ,["滋養時弱化/Nourishment Weakening", "しようしし", TAG_TYPE.IRREMOVABLE_DEBUFF, "発動率減少系"]
  ,["移動力減少/Decrease movement", "いとけん", TAG_TYPE.STATIC]
  ,["移動力減少(全)/Decrease movement (all)", "いとけん3", TAG_TYPE.STATIC, "移動力減少/移動力減少(縦)/移動力減少(横)"]
  ,["魅了時弱化[カトブレパス]", "", TAG_TYPE.IRREMOVABLE_DEBUFF, "魅了時弱化/防御減少系"]
  ,["暗闇時弱化[カトブレパス]", "", TAG_TYPE.IRREMOVABLE_DEBUFF, "暗闇時弱化/発動率減少系"]
  ,["スキル発動率激増/Major Skill Rate Increase", "すきるはけ", TAG_TYPE.BUFF, "発動率増加系"]
  ,["HPが回復する状態/HP restoring status", "HPか", TAG_TYPE.STATUS_GROUP, "", "再生/祝福/滋養/聖油"]
  ,["HPが減少する弱体/HP reducing debuffs", "HPけん", TAG_TYPE.STATUS_GROUP, "", "告死/凍結/毒/猛毒/火傷/烙印"]
  ,["特攻[1.2]/A.Advantage[1.2]", "とつ12", TAG_TYPE.A_BONUS, "特攻"]
  ,["特攻[5.0]/A.Advantage[5.0]", "とつ5", TAG_TYPE.A_BONUS, "特攻"]
  ,["魅了耐性/Charm Resistance", "みりたいせ", TAG_TYPE.BUFF, "状態耐性系"]
  ,["被弾時強化解除/Remove Buff when Damaged", "ひたきよ", TAG_TYPE.IRREMOVABLE_DEBUFF]
  ,["非強化時強化/Non-Buff Strengthening", "ひきようしき", TAG_TYPE.IRREMOVABLE_BUFF, "防御増加系"]
  ,["呪い時強化[ジュウゴ]", "", TAG_TYPE.IRREMOVABLE_BUFF, "呪い時強化/攻撃増加系"]
  ,["烙印時強化/Stigma Strengthening", "らくしき", TAG_TYPE.IRREMOVABLE_BUFF, "防御増加系"]
  ,["告死時強化/Countdown Strengthening", "こくしき", TAG_TYPE.IRREMOVABLE_BUFF, "発動率増加系"]
  ,["状態耐性系/Status Resistance", "しよ", TAG_TYPE.CATEGORY]
  ,["火傷耐性/Burn Resistance", "やけたいせ", TAG_TYPE.BUFF, "状態耐性系"]
  ,["防御力上昇解除/Remove all defense buffs", "ほうきより", TAG_TYPE.UNKNOWN, "状態耐性系"]
  ,["射撃弱点/Weakness to shoot damage", "しやけし", TAG_TYPE.IRREMOVABLE_DEBUFF, "武器種弱点系/防御減少系"]
  ,["火傷時強化[テュポーン]", "", TAG_TYPE.IRREMOVABLE_BUFF, "火傷時強化/攻撃増加系"]
  ,["対ダメージ敵HPCP超激減/Counter: Massive HP%%CP reduction", "たいためてきHPCP", TAG_TYPE.IRREMOVABLE_BUFF]
  ,["CS変更：射撃/Change CS Type: Shot", "CSへ4", TAG_TYPE.BUFF, "CS変更"]
  ,["注目時強化[ツァトグァ]", "", TAG_TYPE.BUFF, "注目時強化/発動率増加系"]
  ,["移動後回避付与/Evasion Post-Move", "いとうこかい", TAG_TYPE.IRREMOVABLE_BUFF]
  ,["移動後クリティカル付与/Critical Post-Move", "いとうこくり", TAG_TYPE.IRREMOVABLE_BUFF]
  ,["退場時味方HP回復/HP Recovery on Defeat", "たいしよみか", TAG_TYPE.IRREMOVABLE_BUFF]
  ,["呪い耐性/Curse Resistance", "のろたい", TAG_TYPE.BUFF, "状態耐性系"]
  ,["HP吸収/Absorb HP", "HPき", TAG_TYPE.ONE_SHOT, "HP減少"]
  ,["CP吸収/Absorb CP", "CPき", TAG_TYPE.ONE_SHOT, "CP減少"]
  ,["弱体HP減/Debuff HP Reduction", "しやくたいHP", TAG_TYPE.IRREMOVABLE_DEBUFF]
  ,["無垢なる獣/Pure Beast", "むく", TAG_TYPE.SKILL]
  ,["浄化/Purification", "しようか", TAG_TYPE.BUFF]
  ,["滋養時強化[サルタヒコ]", "", TAG_TYPE.IRREMOVABLE_BUFF, "滋養時強化/攻撃増加系"]
  ,["凍結耐性/Freeze Resistance", "とうたい", TAG_TYPE.BUFF, "状態耐性系"]
  ,["弱体転写/Transfer debuff", "しやくたいて", TAG_TYPE.ONE_SHOT]
  ,["弱体転写(単)/Transfer debuff (single)", "しやくたいて1", TAG_TYPE.ONE_SHOT, "弱体転写/弱体を貼付"]
  ,["霊験者/Worker of Miracles", "れいけ", TAG_TYPE.SKILL]
  ,["頭陀袋の霊験者/Miraculous Bag Bearer", "すた", TAG_TYPE.SKILL]
  ,["霊系スキル", "", TAG_TYPE.SKIP, "", "霊体/霊験者/頭陀袋の霊験者"]
  ,["全弱体特攻/Advantage vs all debuffs", "せんし", TAG_TYPE.IRREMOVABLE_BUFF, "特攻追加系/攻撃増加系", , "全ての弱体"]
  ,["継続回復強化/Continuous HP recovery boosted", "けいそくか", TAG_TYPE.IRREMOVABLE_BUFF]
  ,["継続ダメージ強化/Increase Continuous Damage", "けいそくた", TAG_TYPE.IRREMOVABLE_DEBUFF]
  ,["強化を再付与/Bestow the removed buffs again", "きようかをさ", TAG_TYPE.ONE_SHOT]
  ,["弱体を再付与/Inflict the removed debuffs again", "しやくたいをさ", TAG_TYPE.ONE_SHOT]
  ,["呪い時強化[トウジ]", "", TAG_TYPE.IRREMOVABLE_BUFF, "呪い時強化/攻撃増加系"]
  ,["注目時強化[限定アールプ]", "", TAG_TYPE.IRREMOVABLE_BUFF, "注目時強化/攻撃増加系/発動率増加系"]
  ,["注目全解除/Remove all Taunt", "ちゆせん", TAG_TYPE.UNKNOWN, "状態耐性系"]
  ,["武器種変更：横一文字[弱体]", "", TAG_TYPE.DEBUFF, "武器種変更/武器種変更：横一文字"]
  ,["攻撃力微増[アザトース]", "", TAG_TYPE.IRREMOVABLE_BUFF, "攻撃力微増/攻撃増加系"]
  ,["根性解除/Remove Guts", "こんしかい", TAG_TYPE.UNKNOWN, "状態耐性系"]
  ,["根性耐性/Guts Resistance", "こんしたい", TAG_TYPE.BUFF, "状態耐性系"]
  ,["攻撃力低下耐性/ATK Reduction Resistance", "こうけきりよくてたい", TAG_TYPE.BUFF, "状態耐性系"]
  ,["種獲得率アップ/Increase drop rate of Seeds", "たね", TAG_TYPE.STATIC, "報酬増加系"]
  ,["ARトークン獲得率アップ/Increase drop rate of AR Tokens", "AR", TAG_TYPE.STATIC, "報酬増加系"]
  ,["加速[ナタ]", "", TAG_TYPE.IRREMOVABLE_BUFF, "加速/CP増加系"]
  ,["閃き[バートロ]", "", TAG_TYPE.IRREMOVABLE_BUFF, "閃き/発動率増加系"]
  ,["注目[アールプ]", "", TAG_TYPE.IRREMOVABLE_BUFF, "注目"]
  ,["強化(解除可)/Buff (can be removed)", "ん2", TAG_TYPE.CATEGORY]
  ,["強化(解除不可)/Buff (cannot be removed)", "ん3", TAG_TYPE.CATEGORY]
  ,["弱体(解除可)/Debuff (can be removed)", "ん5", TAG_TYPE.CATEGORY]
  ,["弱体(解除不可)/Debuff (cannot be removed)", "ん6", TAG_TYPE.CATEGORY]
  ,["移動力減少(縦)/Decrease movement (vertical)", "いとけん1", TAG_TYPE.STATIC, "移動力減少"]
  ,["移動力減少(横)/Decrease movement (horizontal)", "いとけん2", TAG_TYPE.STATIC, "移動力減少"]
  ,["特防[2.0]/D.Advantage[2.0]", "とくほ20", TAG_TYPE.D_BONUS, "特防"]
  ,["特防[1.3]/D.Advantage[1.3]", "とくほ13", TAG_TYPE.D_BONUS, "特防"]
  ,["遠距離特攻/Advantage vs Distant Foes", "えん", TAG_TYPE.UNKNOWN]
  ,["距離に応じて/based on distance", "きよ", TAG_TYPE.SPECIAL]
  ,["CS封印全解除/Remove all CS Lock", "CSせん", TAG_TYPE.UNKNOWN, "状態耐性系"]
  ,["CS封印[ワカン∞]", "", TAG_TYPE.IRREMOVABLE_DEBUFF, "CS封印"]
  ,["弱体奪取(単)/Steal debuff (single)", "しやくたいた1", TAG_TYPE.ONE_SHOT, "弱体奪取/弱体解除/弱体解除(単)/弱体を複製(味方に)"]
  ,["弱体時強化[タンガロア∞]", "", TAG_TYPE.IRREMOVABLE_BUFF, "弱体時強化/攻撃増加系/防御増加系/発動率増加系"]
  ,["攻撃力強化解除/Remove all attack-rising status effects", "こうけきりよくき", TAG_TYPE.UNKNOWN, "状態耐性系"]
  ,["魅了時弱化[シンヤ]", "", TAG_TYPE.IRREMOVABLE_DEBUFF, "魅了時弱化/発動率減少系"]
  ,["加速時強化/Acceleration Strengthening", "かそしき", TAG_TYPE.IRREMOVABLE_BUFF]
  ,["攻撃力微増/Minor ATK Increase", "こうけきりよくひ", TAG_TYPE.IRREMOVABLE_BUFF]
  ,["根性時強化/Guts Strengthening", "こんししき", TAG_TYPE.IRREMOVABLE_BUFF]
  ,["弱体時強化/Debuff Strengthening", "しやくたいしき", TAG_TYPE.IRREMOVABLE_BUFF]
  ,["祝福時弱化/Blessing Weakening", "しゆくしし", TAG_TYPE.IRREMOVABLE_DEBUFF]
  ,["滋養時強化/Nourishment Strengthening", "しようしき", TAG_TYPE.IRREMOVABLE_BUFF]
  ,["注目時強化/Taunt Strengthening", "ちゆしき", TAG_TYPE.UNKNOWN]
  ,["呪い時強化/Curse Strengthening", "のろしき", TAG_TYPE.IRREMOVABLE_BUFF]
  ,["魅了時弱化/Charm Weakening", "みりしし", TAG_TYPE.IRREMOVABLE_DEBUFF]
  ,["HP減少反転/HP Decrease Reversal", "HPけはん", TAG_TYPE.BUFF]
  ,["HP回復反転/HP Recovery Reversal", "HPかはん", TAG_TYPE.DEBUFF]
  ,["ダメージ反転/Damage Reversal", "ためはん", TAG_TYPE.BUFF, "防御増加系"]
  ,["防御貫通/Pierce Defense", "ほうきよか", TAG_TYPE.IRREMOVABLE_BUFF, "特攻追加系/攻撃増加系"]
  ,["恐怖大特攻/Big Advantage vs Fear", "きようふたいと", TAG_TYPE.IRREMOVABLE_BUFF, "特攻追加系/攻撃増加系", , "恐怖"]
  ,["打撃と斬撃と横一文字への大特防/Reduce Blow%%Slash%%Long-Slash damage", "たけきとさ", TAG_TYPE.IRREMOVABLE_BUFF, "特防追加系/防御増加系"]
  ,["射撃と狙撃への大特防/Reduce Shot%%Snipe damage", "しやけと", TAG_TYPE.IRREMOVABLE_BUFF, "特防追加系/防御増加系"]
  ,["特防[0.1]/D.Advantage[0.1]", "とくほ01", TAG_TYPE.D_BONUS, "特防"]
  ,["崩し耐性/Break Resistance", "くすたい", TAG_TYPE.BUFF, "状態耐性系"]
  ,["威圧特攻[AR]", "", TAG_TYPE.IRREMOVABLE_BUFF, "威圧特攻/特攻追加系/攻撃増加系", , "威圧"]
  ,["閃き時強化[リチョウ]", "", TAG_TYPE.IRREMOVABLE_BUFF, "閃き時強化/発動率増加系"]
  ,["退場時強化全転写/Transfer all buffs on Defeat", "たいしよきよ", TAG_TYPE.IRREMOVABLE_BUFF]
  ,["退場時敵強化全解除/Remove all buffs on Defeat", "たいしよてきき", TAG_TYPE.IRREMOVABLE_BUFF]
  ,["確率発狂/Latent Madness", "かくりつはつ", TAG_TYPE.IRREMOVABLE_DEBUFF]
  ,["発狂時弱化/Madness Weakening", "はつしし", TAG_TYPE.IRREMOVABLE_DEBUFF, "防御減少系"]
  ,["ダメージ時頑強/Tenacity when damaged", "ためしかん", TAG_TYPE.IRREMOVABLE_BUFF]
  ,["次ターン強化/Increase ATK next turn", "つききよ", TAG_TYPE.IRREMOVABLE_BUFF]
  ,["攻撃力増加[次ターン]", "", TAG_TYPE.IRREMOVABLE_BUFF, "攻撃力増加/攻撃増加系"]
  ,["攻撃力増加[ターン毎減少]", "", TAG_TYPE.IRREMOVABLE_BUFF, "攻撃力増加/攻撃増加系"]
  ,["攻撃力増加[イツァムナー]", "", TAG_TYPE.IRREMOVABLE_BUFF, "攻撃力増加/攻撃増加系"]
  ,["熱情拡散/Ardor Diffusion", "ねつかく", TAG_TYPE.IRREMOVABLE_BUFF]
  ,["頑強拡散/Tenacity Diffusion", "かんかく", TAG_TYPE.IRREMOVABLE_BUFF]
  ,["集中拡散/Concentration Diffusion", "しゆうかく", TAG_TYPE.IRREMOVABLE_BUFF]
  ,["攻撃力増加/ATK Increase", "こうけきりよくそ", TAG_TYPE.IRREMOVABLE_BUFF]
  ,["スキル発動率大増/Big Skill Rate Increase", "すきるはた", TAG_TYPE.IRREMOVABLE_BUFF, "発動率増加系"]
  ,["スキル発動率増加/Skill Rate Increase", "すきるはそ", TAG_TYPE.IRREMOVABLE_BUFF, "発動率増加系"]
  ,["次ターン引き寄せ[味方]/Draw in next turn[allies]", "つきひき", TAG_TYPE.IRREMOVABLE_BUFF]
  ,["次ターン引き寄せ[敵味方]/Draw in next turn[enemies & allies]", "つきひき", TAG_TYPE.IRREMOVABLE_BUFF]
  ,["根性時強化[桜の山AR]", "", TAG_TYPE.IRREMOVABLE_BUFF, "根性時強化/CP増加系"]
  ,["挺身の構え/Stance of the Volunteer", "てい", TAG_TYPE.IRREMOVABLE_BUFF]
  ,["攻撃力が上昇する状態/Status that raise attack", "こうしよ", TAG_TYPE.STATUS_GROUP, "", "意気/疑念/極限/クリティカル/クリティカル+/クリティカル++/激怒/激怒+/攻撃強化/剛力/集中/滋養/闘志/毒反転/熱情/暴走/暴走+/無窮"]
  ,["移動力増加(縦+2)/Increase movement (vertical +2)", "いとそう12", TAG_TYPE.STATIC, "移動力増加/移動力増加(縦)"]
  ,["移動力増加(横+2)/Increase movement (horizontal +2)", "いとそう22", TAG_TYPE.STATIC, "移動力増加/移動力増加(横)"]
  ,["横移動力減少/Reduced horizontal movement range", "よこけん1", TAG_TYPE.IRREMOVABLE_DEBUFF, "移動力減少系"]
  ,["横移動力大減少/Greatly reduced horizontal movement range", "よこけん2", TAG_TYPE.IRREMOVABLE_DEBUFF, "移動力減少系"]
  ,["移動力減少系/Reduced Movement", "いとうり2", TAG_TYPE.CATEGORY]
  ,["非移動後HP激減/Non-Movement Major HP Decrease", "ひいとうHPけ", TAG_TYPE.IRREMOVABLE_DEBUFF]
  ,["弱体無効・反射解除/Remove Nullify%%Reflect Debuff", "しやくたいむこうはんしやか", TAG_TYPE.UNKNOWN, "状態耐性系"]
  ,["毒時弱化/Poison Weakening", "とくしし", TAG_TYPE.IRREMOVABLE_DEBUFF, "HP減少系"]
  ,["ロジックボム/Logic Bomb", "ろし", TAG_TYPE.IRREMOVABLE_DEBUFF]
  ,["混乱/Confusion", "こんら", TAG_TYPE.DEBUFF, "移動力減少系"]
  ,["弱体後CT/CT When Debuffed", "しやくたいこCT", TAG_TYPE.IRREMOVABLE_BUFF]
  ,["弱体後CT++/CT++ When Debuffed", "しやくたいこCT++", TAG_TYPE.IRREMOVABLE_BUFF]
  ,["愛時強化/Love Strengthening", "あい", TAG_TYPE.IRREMOVABLE_BUFF, "HP回復系"]
  ,["魅了時弱化[ペルーン]", "", TAG_TYPE.IRREMOVABLE_DEBUFF, "魅了時弱化/防御減少系"]
  ,["告死時弱化[ペルーン]", "", TAG_TYPE.IRREMOVABLE_DEBUFF, "告死時弱化/発動率減少系"]
  ,["武器種変更：射撃/Change Weapon Type: Shot", "ふきし4", TAG_TYPE.BUFF, "武器種変更"]
  ,["斬撃・横一文字弱点/Slash%%Long-Slash Weakness", "さん", TAG_TYPE.IRREMOVABLE_DEBUFF, "武器種弱点系/防御減少系"]
  ,["火傷時弱化/Burn Weakening", "やけしし", TAG_TYPE.IRREMOVABLE_DEBUFF]
  ,["火傷時弱化[ヨシトウ]", "", TAG_TYPE.IRREMOVABLE_DEBUFF, "火傷時弱化/発動率減少系"]
  ,["からくりぼでぃ/Clockwork Assassin", "からほ", TAG_TYPE.SKILL]
  ,["からくり義体/Clockwork Eliminator", "からき", TAG_TYPE.SKILL]
  ,["マシン系スキル", "", TAG_TYPE.SKIP, "", "マシンボディ/からくりぼでぃ/からくり義体/仰天のマシンボディ/生存のマシンボディ"]
  ,["被回復増加/Increased Recovery", "ひかい", TAG_TYPE.BUFF]
  ,["特防[1.2]/D.Advantage[1.2]", "とくほ12", TAG_TYPE.D_BONUS, "特防"]
  ,["移動力増加(全+3)/Increase movement (all +3)", "いとそう33", TAG_TYPE.STATIC, "移動力増加/移動力増加(縦)/移動力増加(横)/移動力増加(全)/移動力増加(縦+2)/移動力増加(横+2)"]
  ,["火傷時強化/Burn Strengthening", "やけしき", TAG_TYPE.IRREMOVABLE_BUFF]
  ,["火傷時強化[タダトモ]", "", TAG_TYPE.IRREMOVABLE_BUFF, "火傷時強化/HP回復系"]
  ,["弱体無効時強化/Nullify Debuff Strengthening", "しやくたいむしき", TAG_TYPE.IRREMOVABLE_BUFF]
  ,["弱体無効時強化[☆3]", "", TAG_TYPE.IRREMOVABLE_BUFF, "弱体無効時強化/攻撃増加系"]
  ,["弱体無効時強化[☆5]", "", TAG_TYPE.IRREMOVABLE_BUFF, "弱体無効時強化/攻撃増加系"]
  ,["恐怖耐性/Fear Resistance", "きようふたいせ", TAG_TYPE.BUFF, "状態耐性系"]
  ,["全方向移動力増加[2T]", "", TAG_TYPE.IRREMOVABLE_BUFF, "全方向移動力増加/移動力増加系"]
  ,["全域特防[タイシャクテン]", "", TAG_TYPE.IRREMOVABLE_BUFF, "全域特防/特防追加系/防御増加系"]
  ,["スキル発動率激増[アイザック]", "", TAG_TYPE.IRREMOVABLE_BUFF, "スキル発動率激増/発動率増加系"]
  ,["マシンボディ付与/Mechaman[Buff]", "まし", TAG_TYPE.IRREMOVABLE_BUFF]
  ,["愚直なる血鬼/Naive Vampire", "くち", TAG_TYPE.SKILL]
  ,["横移動力増加/Increased horizontal movement", "よこそう", TAG_TYPE.BUFF, "移動力増加系"]
  ,["花獲得率アップ/Increase drop rate of Blossoms", "はな", TAG_TYPE.STATIC, "報酬増加系"]
  ,["外壁/Outer Wall", "かいへ", TAG_TYPE.IRREMOVABLE_BUFF, "防御増加系"]
  ,["弱点特攻/Advantage vs Weakness", "しやくてと", TAG_TYPE.IRREMOVABLE_BUFF, "特攻追加系/攻撃増加系", , "弱点"]
  ,["係留時強化/Anchor Strengthening", "けいりしき", TAG_TYPE.IRREMOVABLE_BUFF, "攻撃増加系"]
  ,["弱点耐性/Weakness Resistance", "しやくてたい", TAG_TYPE.BUFF, "状態耐性系"]
  ,["防御強化時回復/Heal while DEF Up", "ほうきよきしか", TAG_TYPE.IRREMOVABLE_BUFF, "HP回復系"]
  ,["強化後回復付与/HP Recovery Post-Buff", "きようかこか", TAG_TYPE.IRREMOVABLE_BUFF]
  ,["マシンボディ特攻/Advantage vs Mechaman", "ましんと", TAG_TYPE.IRREMOVABLE_BUFF, "特攻追加系/攻撃増加系", , "マシン系スキル"]
  ,["注目耐性/Taunt Resistance", "ちゆたい", TAG_TYPE.BUFF, "状態耐性系"]
  ,["非火傷時強化/Non-Burn Strengthening", "ひや", TAG_TYPE.IRREMOVABLE_BUFF, "攻撃増加系"]
  ,["火傷時強化[アキハゴンゲン]", "", TAG_TYPE.IRREMOVABLE_BUFF, "火傷時強化/CP増加系"]
  ,["魅了時弱化[アキハゴンゲン]", "", TAG_TYPE.IRREMOVABLE_DEBUFF, "魅了時弱化/HP減少系"]
  ,["縦移動力増加/Increased vertical movement", "たてそう", TAG_TYPE.BUFF, "移動力増加系"]
  ,["意気時強化/Spirit Strengthening", "いきしき", TAG_TYPE.IRREMOVABLE_BUFF, "攻撃増加系"]
  ,["対ダメージ攻撃強化付与/Counter: ATK Up", "たいためこう", TAG_TYPE.IRREMOVABLE_BUFF]
  ,["退場時HP激減/Major HP decrease on Defeat", "たいしよHP", TAG_TYPE.IRREMOVABLE_BUFF]
  ,["退場時CP激減/Major CP decrease on Defeat", "たいしよCP", TAG_TYPE.IRREMOVABLE_BUFF]
  ,["回避貫通/Ignore Evasion[Buff]", "かいひか", TAG_TYPE.IRREMOVABLE_BUFF, "特攻追加系/攻撃増加系"]
  ,["退場時攻撃強化付与/ATK Up on Defeat", "たいしよこう", TAG_TYPE.IRREMOVABLE_BUFF]
  ,["退場時防御強化付与/DEF Up on Defeat", "たいしよほう", TAG_TYPE.IRREMOVABLE_BUFF]
  ,["回避耐性/Evasion Resistance", "かいひたい", TAG_TYPE.BUFF, "状態耐性系"]
  ,["攻撃後強化単体奪取/Steal Buff Post-attack", "こうけきこきよ", TAG_TYPE.IRREMOVABLE_BUFF]
  ,["攻撃後弱点付与/Weakness Post-attack", "こうけきこしや", TAG_TYPE.IRREMOVABLE_BUFF]
  ,["攻撃後CP吸収/Absorb CP Post-attack", "こうけきこCP", TAG_TYPE.IRREMOVABLE_BUFF]
  ,["連撃時強化/Combo Strengthening", "れんしき", TAG_TYPE.IRREMOVABLE_BUFF, "攻撃増加系"]
  ,["暗闇時弱化/Darkness Weakening", "くらしし", TAG_TYPE.IRREMOVABLE_DEBUFF]
  ,["暗闇時弱化[エリイ]", "", TAG_TYPE.IRREMOVABLE_DEBUFF, "暗闇時弱化/HP減少系"]
  ,["ターン開始時憑依/Possession Start of Turn", "たあひよ", TAG_TYPE.IRREMOVABLE_DEBUFF]
  ,["攻撃後HP吸収/Absorb HP Post-attack", "こうけきこHPき", TAG_TYPE.IRREMOVABLE_BUFF]
  ,["攻撃時極限付与/Limit when attacking", "こうけきしきよ", TAG_TYPE.IRREMOVABLE_BUFF]
  ,["空振り時CP減少/Decrease CP on miss", "からCP", TAG_TYPE.IRREMOVABLE_DEBUFF]
  ,["攻撃後HP回復/Restore HP post-attack", "こうけきこHPか", TAG_TYPE.IRREMOVABLE_BUFF]
  ,["空振り時烙印付与/Stigma on miss", "かららく", TAG_TYPE.IRREMOVABLE_DEBUFF]
  ,["強化後集中付与/Concentration Post-Buff", "きようかこし", TAG_TYPE.IRREMOVABLE_BUFF]
  ,["横移動力増加[解除不可]", "", TAG_TYPE.IRREMOVABLE_BUFF, "横移動力増加/移動力増加系"]
  ,["ダメージ時回避付与", "ためしかい", TAG_TYPE.IRREMOVABLE_BUFF]
  ,["ダメージ後回避耐性付与", "ためこかい", TAG_TYPE.IRREMOVABLE_DEBUFF]
  ,["獣蹄のサマリヤ王", "しゆうて", TAG_TYPE.SKILL]
  ,["厄災の連鎖/Chains of Calamity", "やく", TAG_TYPE.IRREMOVABLE_DEBUFF]
  ,["崩し特攻/Advantage vs Break", "くすしと", TAG_TYPE.IRREMOVABLE_BUFF, "特攻追加系/攻撃増加系", , "崩し"]
  ,["全域特防[ビッグフット]", "", TAG_TYPE.IRREMOVABLE_BUFF, "全域特防/特防追加系/防御増加系"]
  ,["HPが継続回復する状態/Healing status", "HPけい", TAG_TYPE.STATUS_GROUP, "", "再生/祝福/滋養/聖油"]
  ,["凍結時弱化/Freeze Weakening", "とうけしし", TAG_TYPE.IRREMOVABLE_DEBUFF]
  ,["祝福時強化/Blessing Strengthening", "しゆくしき", TAG_TYPE.IRREMOVABLE_BUFF]
  ,["凍結時弱化[バートロ]", "", TAG_TYPE.IRREMOVABLE_DEBUFF, "凍結時弱化/防御減少系"]
  ,["祝福時強化[バートロ]", "", TAG_TYPE.IRREMOVABLE_BUFF, "祝福時強化/攻撃増加系/防御増加系"]
  ,["継続ダメージを受ける状態", "けいをう", TAG_TYPE.STATUS_GROUP, "", "告死/凍結/毒/無窮/猛毒/火傷/烙印"]
  ,["祝福時強化[シュクユウ]", "", TAG_TYPE.IRREMOVABLE_BUFF, "祝福時強化/防御増加系"]
  ,["威圧特攻/Advantage vs Oppression", "いあと", TAG_TYPE.IRREMOVABLE_BUFF]
  ,["威圧特攻[シームルグ]", "", TAG_TYPE.IRREMOVABLE_BUFF, "威圧特攻/特攻追加系/攻撃増加系", , "威圧"]
  ,["攻撃力微増[シームルグ]", "", TAG_TYPE.IRREMOVABLE_BUFF, "攻撃力微増/攻撃増加系"]
  ,["威圧耐性/Oppression Resistance", "いあたい", TAG_TYPE.BUFF, "状態耐性系"]
  ,["友時強化/Friendship Strengthening", "ゆうしき", TAG_TYPE.IRREMOVABLE_BUFF, "HP回復系"]
  ,["攻撃力増加[装備者CP]", "", TAG_TYPE.IRREMOVABLE_BUFF, "攻撃力増加/攻撃増加系"]
  ,["呪い時弱化/Curse Weakening", "のろしし", TAG_TYPE.IRREMOVABLE_DEBUFF, "防御減少系"]
  ,["確率束縛/Latent Bind", "かくりつそく", TAG_TYPE.IRREMOVABLE_DEBUFF]
  ,["闘志時強化/Vigor Strengthening", "とうししき", TAG_TYPE.IRREMOVABLE_BUFF, "防御増加系"]
  ,["威圧時弱化/Oppression Weakening", "いあしし", TAG_TYPE.IRREMOVABLE_DEBUFF, "攻撃減少系"]
  ,["威圧特攻[ギリメカラ]", "", TAG_TYPE.IRREMOVABLE_BUFF, "威圧特攻/特攻追加系/攻撃増加系", , "威圧"]
  ,["暗闇時強化/Darkness Strengthening", "くらしき", TAG_TYPE.IRREMOVABLE_BUFF]
  ,["暗闇時強化[ジェイコフ]", "", TAG_TYPE.IRREMOVABLE_BUFF, "暗闇時強化/HP回復系"]
  ,["攻撃力微増[ジェイコフ]", "", TAG_TYPE.IRREMOVABLE_BUFF, "攻撃力微増/攻撃増加系"]
  ,["特防[0.65]/D.Advantage[0.65]", "とくほ065", TAG_TYPE.D_BONUS, "特防"]
  ,["武器種弱点系/Weapon Type Weakness", "ふき", TAG_TYPE.CATEGORY]
  ,["魔法弱点/Shot Weakness", "まほし", TAG_TYPE.IRREMOVABLE_DEBUFF, "武器種弱点系/防御減少系"]
  ,["確率マヒ/Latent Paralysis", "かくりつまひ", TAG_TYPE.IRREMOVABLE_BUFF]
  ,["魅了時強化/Charm Strengthening", "みりしき", TAG_TYPE.IRREMOVABLE_BUFF, "防御増加系"]
  ,["確率強化解除/Latent Buff Removal", "かくりつきようかか", TAG_TYPE.IRREMOVABLE_DEBUFF]
  ,["ダメージ時HP激減/Major HP Decrease when attacked", "ためしHP", TAG_TYPE.IRREMOVABLE_DEBUFF]
  ,["非連撃時強化/Non-Combo Strengthening", "ひれ", TAG_TYPE.IRREMOVABLE_BUFF, "攻撃増加系"]
  ,["束縛時弱化/Bind Weakening", "そくしし", TAG_TYPE.IRREMOVABLE_DEBUFF, "攻撃減少系"]
  ,["確率強化単体解除/Latent Remove one buff", "かくりつきようかた", TAG_TYPE.IRREMOVABLE_DEBUFF]
  ,["継続ダメージの発生する状態", "けいのは", TAG_TYPE.STATUS_GROUP, "", "告死/凍結/毒/無窮/猛毒/火傷/烙印"]
  ,["確率弱体単体解除/Latent Remove one debuff", "かくりつしや", TAG_TYPE.IRREMOVABLE_BUFF]
  ,["クリティカル耐性/Critical Resistance", "くりたい", TAG_TYPE.BUFF]
  ,["祝福時強化[ノブミチ]", "", TAG_TYPE.IRREMOVABLE_BUFF, "祝福時強化/防御増加系"]
  ,["魅了時弱化[アムブスキアス]", "", TAG_TYPE.IRREMOVABLE_DEBUFF, "魅了時弱化/防御減少系"]
  ,["注目時回復/Heal when Taunt", "ちゆしか", TAG_TYPE.IRREMOVABLE_BUFF, "HP回復系"]
  ,["注目時強化[アムブスキアス]", "", TAG_TYPE.IRREMOVABLE_BUFF, "注目時強化/攻撃増加系"]
  ,["全域弱点/All Weakness", "せんいし", TAG_TYPE.IRREMOVABLE_DEBUFF, "武器種弱点系/防御減少系"]
  ,["対ダメージ敵HP減少/Counter: HP reduction", "たいためてきHPけ", TAG_TYPE.IRREMOVABLE_BUFF]
  ,["不動時強化/Immobility Strengthening", "ふとしき", TAG_TYPE.IRREMOVABLE_BUFF, "防御増加系"]
  ,["憑依時強化/Possession Strengthening", "ひよしき", TAG_TYPE.IRREMOVABLE_BUFF]
  ,["頑強時強化/Tenacity Strengthening", "かんしき", TAG_TYPE.IRREMOVABLE_BUFF]
  ,["憑依時強化[ユーマ]", "", TAG_TYPE.IRREMOVABLE_BUFF, "憑依時強化/防御増加系"]
  ,["頑強時強化[ユーマ]", "", TAG_TYPE.IRREMOVABLE_BUFF, "頑強時強化/攻撃増加系"]
  ,["幻惑耐性/Dazzle Resistance", "けんたい", TAG_TYPE.IRREMOVABLE_BUFF, "状態耐性系"]
  ,["猛毒時強化/Fatal Poison Strengthening", "もうしき", TAG_TYPE.IRREMOVABLE_BUFF, "攻撃増加系"]
  ,["加速時強化[R-19#1]", "", TAG_TYPE.IRREMOVABLE_BUFF, "加速時強化/攻撃増加系"]
  ,["加速時強化[R-19#2]", "", TAG_TYPE.IRREMOVABLE_BUFF, "加速時強化/CP増加系"]
  ,["ダメージ時守護/Protection when damaged", "ためししゆ", TAG_TYPE.IRREMOVABLE_BUFF]
  ,["暗闇耐性時強化/Darkness Resistance Strengthening", "くらたいしき", TAG_TYPE.IRREMOVABLE_BUFF, "発動率増加系"]
  ,["暗闇耐性/Darkness Resistance", "くらたい", TAG_TYPE.BUFF, "状態耐性系"]
  ,["非弱体時強化/Non-Debuff Strengthening", "ひししき", TAG_TYPE.IRREMOVABLE_BUFF]
  ,["非弱体時強化[ブレイク]", "", TAG_TYPE.IRREMOVABLE_BUFF, "非弱体時強化/攻撃増加系"]
  ,["劫火時強化/Conflagration Strengthening", "こうかしき", TAG_TYPE.IRREMOVABLE_BUFF]
  ,["劫火時強化#2", "", TAG_TYPE.IRREMOVABLE_BUFF, "劫火時強化/攻撃増加系"]
  ,["仰天のマシンボディ", "きよ", TAG_TYPE.SKILL]
  ,["雷光の装填者", "らいこうの", TAG_TYPE.SKILL]
  ,["生存のマシンボディ", "せい", TAG_TYPE.SKILL]
  ,["集中時強化[実験AR]", "", TAG_TYPE.IRREMOVABLE_BUFF, "集中時強化/攻撃増加系"]
  ,["妨害時強化/Obstruct Strengthening", "ほうかしき", TAG_TYPE.IRREMOVABLE_BUFF, "発動率増加系"]
  ,["魅了耐性[解除不可]", "", TAG_TYPE.IRREMOVABLE_BUFF, "魅了耐性/状態耐性系"]
  ,["火傷特攻/Advantage vs Burn", "やけと", TAG_TYPE.IRREMOVABLE_BUFF, "特攻追加系/攻撃増加系", , "火傷"]
  ,["火傷大特攻/Big Advantage vs Burn", "やけたいと", TAG_TYPE.IRREMOVABLE_BUFF, "特攻追加系/攻撃増加系", , "火傷"]
  ,["劫火大特攻/Big Advantage vs Conflagration", "こうかたいと", TAG_TYPE.IRREMOVABLE_BUFF, "特攻追加系/攻撃増加系", , "劫火"]
  ,["幻惑特攻/Advantage vs Dazzle", "けんと", TAG_TYPE.IRREMOVABLE_BUFF, "特攻追加系/攻撃増加系", , "幻惑"]
  ,["烙印特攻/Advantage vs Stigma", "らくと", TAG_TYPE.IRREMOVABLE_BUFF, "特攻追加系/攻撃増加系", , "烙印"]
  ,["妨害特攻/Advantage vs Obstruct", "ほうかと", TAG_TYPE.IRREMOVABLE_BUFF, "特攻追加系/攻撃増加系", , "妨害"]
  ,["幻惑時弱化/Dazzle Weakening", "けんしし", TAG_TYPE.IRREMOVABLE_DEBUFF, "防御減少系"]
  ,["全域特防/Reduce All damage", "せんいと", TAG_TYPE.IRREMOVABLE_BUFF]
  ,["魅了大特攻/Big Advantage vs Charm", "みりたいと", TAG_TYPE.IRREMOVABLE_BUFF, "特攻追加系/攻撃増加系", , "魅了"]
  ,["祈り時強化/Prayer Strengthening", "いのしき", TAG_TYPE.IRREMOVABLE_BUFF]
  ,["CS変更：突撃/Change CS Type: Thrust", "CSへ2", TAG_TYPE.BUFF, "CS変更"]
  ,["祈り時強化[ジェイコフ]", "", TAG_TYPE.IRREMOVABLE_BUFF, "祈り時強化/攻撃増加系"]
  ,["打撃特防/Reduce Blow damage", "たけきとく", TAG_TYPE.IRREMOVABLE_BUFF, "特防追加系/防御増加系"]
  ,["混乱時弱化/Confusion Weakening", "こんらしし", TAG_TYPE.IRREMOVABLE_DEBUFF, "防御減少系"]
  ,["注目時強化[アールプ☆4]", "", TAG_TYPE.IRREMOVABLE_BUFF, "注目時強化/防御増加系"]
  ,["翼持つアイドル", "つはさもつあ", TAG_TYPE.SKILL]
  ,["鬼子連れのヤンキー", "おに", TAG_TYPE.SKILL]
  ,["終わりの巨人", "おわ", TAG_TYPE.SKILL]
  ,["終焉のロプト", "しゆうえ", TAG_TYPE.SKILL]
  ,["巨人系スキル", "", TAG_TYPE.SKIP, "", "巨人なる者/終わりの巨人/終焉のロプト"]
  ,["熱情時強化/Ardor Strengthening", "ねつしき", TAG_TYPE.IRREMOVABLE_BUFF]
  ,["熱情時強化[AR]", "", TAG_TYPE.IRREMOVABLE_BUFF, "熱情時強化/攻撃増加系"]
  ,["集中時強化/Concentration Strengthening", "しゆうしき", TAG_TYPE.IRREMOVABLE_BUFF]
  ,["集中時強化[パジャマAR]", "", TAG_TYPE.IRREMOVABLE_BUFF, "集中時強化/防御増加系"]
  ,["爆発スイカ", "はく", TAG_TYPE.IRREMOVABLE_DEBUFF]
  ,["特攻追加系/Additional Attack Advantage", "とつこ", TAG_TYPE.CATEGORY]
  ,["特防追加系/Additional Defense Advantage", "とくほ", TAG_TYPE.CATEGORY]
  ,["脱力特攻/Advantage vs Drain", "たつと", TAG_TYPE.IRREMOVABLE_BUFF, "特攻追加系/攻撃増加系", , "脱力"]
  ,["暗闇特攻/Advantage vs Darkness", "くらと", TAG_TYPE.IRREMOVABLE_BUFF, "特攻追加系/攻撃増加系", , "暗闇"]
  ,["祝福時強化[アステリオス]", "", TAG_TYPE.IRREMOVABLE_BUFF, "祝福時強化/発動率増加系"]
  ,["クリティカル++耐性/Critical++ Resistance", "くり++たい", TAG_TYPE.IRREMOVABLE_BUFF]
  ,["秘島に生きる怪物", "ひと", TAG_TYPE.SKILL]
  ,["根性時強化[レイヴ]", "", TAG_TYPE.IRREMOVABLE_BUFF, "根性時強化/攻撃増加系"]
  ,["告死時弱化/Countdown Weakening", "こくしし", TAG_TYPE.IRREMOVABLE_DEBUFF]
  ,["告死時弱化[ブギーマン]", "", TAG_TYPE.IRREMOVABLE_DEBUFF, "告死時弱化/攻撃減少系"]
  ,["幻惑時強化/Dazzle Strengthening", "けんしき", TAG_TYPE.IRREMOVABLE_BUFF, "攻撃増加系"]
  ,["攻撃時味方HP回復", "こうけきしみかたHP", TAG_TYPE.IRREMOVABLE_BUFF]
  ,["攻撃時味方CP増加", "こうけきしみかたCP", TAG_TYPE.IRREMOVABLE_BUFF]
  ,["閃き時強化/Glint Strengthening", "ひらしき", TAG_TYPE.IRREMOVABLE_BUFF]
  ,["閃き時強化[ヘカテー]", "", TAG_TYPE.IRREMOVABLE_BUFF, "閃き時強化/防御増加系"]
  ,["退場時敵HP大回復", "たいしよてきHP", TAG_TYPE.IRREMOVABLE_BUFF]
  ,["注目時強化[シパクトリ]", "", TAG_TYPE.IRREMOVABLE_BUFF, "注目時強化/防御増加系"]
  ,["激怒耐性/Rage Resistance", "けきたい", TAG_TYPE.IRREMOVABLE_BUFF]
  ,["祝福時強化[AR]", "", TAG_TYPE.IRREMOVABLE_BUFF, "祝福時強化/攻撃増加系"]
  ,["奮起時強化/Arousal Strengthening", "ふんしき", TAG_TYPE.IRREMOVABLE_BUFF, "攻撃増加系"]
  ,["閃き時強化[AR]", "", TAG_TYPE.IRREMOVABLE_BUFF, "閃き時強化/発動率増加系"]
  ,["非弱体時強化[アルジャーノン]", "", TAG_TYPE.IRREMOVABLE_BUFF, "非弱体時強化/攻撃増加系"]
  ,["攻撃力増加[オンブレティグレ]", "", TAG_TYPE.IRREMOVABLE_BUFF, "攻撃力増加/攻撃増加系"]
  ,["根性時強化[ヤマサチヒコ]", "", TAG_TYPE.IRREMOVABLE_BUFF, "根性時強化/防御増加系"]
]);
