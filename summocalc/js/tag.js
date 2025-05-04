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
  WEAPON_GROUP: 11,
  ALL_BUFFS: 12,
  ALL_DEBUFFS: 13,
  A_BONUS: 14,
  D_BONUS: 15,
  SPECIAL: 16,
  UNKNOWN: 17,
  REWARD: 18
};

var TAG_FLAG_NUM = {
  SELF: 0,
  ALLY: 1,
  ENEMY: 2,
  BONUS_A: 3,
  BONUS_D: 4,
  NULLIFY: 5,
  STATIC: 6,
  AR: 7
};

function Tag(index, x, category, subset, targetType, target, variant, bonus, timing, link, irremovable){
  this.index = index;
  this.name = x[0].replace(/#\d/, "");
  this.reading = x[1];
  this.description = x[2];
  this.type = x[3];
  this.category = category;
  this.subset = subset;
  this.targetType = targetType;
  this.target = target;
  this.variant = variant;
  this.bonus = bonus;
  this.timing = timing;
  this.link = link;
  this.irremovable = irremovable;
  this.flags = [];
  if(!index){
    this.sortkey = 0;
  }else{
    switch(this.type){
      case TAG_TYPE.ALL_BUFFS:
      case TAG_TYPE.ALL_DEBUFFS:
        this.sortkey = 0;
        break;
      case TAG_TYPE.STATUS_GROUP:
        this.sortkey = 2;
        break;
      case TAG_TYPE.ONE_SHOT:
      case TAG_TYPE.WEAPON:
        this.sortkey = 3;
        break;
      case TAG_TYPE.WEAPON_GROUP:
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
      case TAG_TYPE.REWARD:
        this.sortkey = 3;
        this.type = TAG_TYPE.STATIC;
        break;
      case TAG_TYPE.A_BONUS:
        this.sortkey = 5;
        this.type = TAG_TYPE.STATIC;
        break;
      case TAG_TYPE.D_BONUS:
        this.sortkey = 6;
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
  },
  getTarget: function(type){
    if(this.targetType === type) return this.target;
    return 0;
  },
  checkCategory: function(c){
    if(!c) return true;
    return this.category.indexOf(c) !== -1;
  }
};
Tag.createList = function(a){
  var table = new Map();
  var tget = function(x){
    if(!x) return 0;
    return table.get(x);
  };
  var buff = [];
  var debuff = [];
  var result = [];
  var orderData = [];
  var order = [];
  var labels = [];
  var wcs = [[], []];
  var k = [];
  var en = false;
  var re = /^(?:(非)?.+時(?:防御)?(強化|回復|(弱化))|(.+変更)(?:：.+)?)(?:\[.+\]|#\d)?$/;
  var f = function(a, b){
    var x = result[a];
    var y = result[b];
    if(x.sortkey !== y.sortkey) return x.sortkey - y.sortkey;
    if(en && x.sortkey !== 7 && k[a] !== k[b]) return k[a] < k[b] ? -1 : 1;
    if(x.reading === y.reading) return x.index - y.index;
    return x.reading < y.reading ? -1 : 1;
  };
  a.forEach(function(v, i){
    if(v.shift() !== i) throw new Error("タグのインデックスが正しくありません（" + i + "）");
    table.set(t(v[0], 0), i);
    switch(v[3]){
      case TAG_TYPE.BUFF:
        buff.push(i);
        break;
      case TAG_TYPE.DEBUFF:
        debuff.push(i);
        break;
    }
  });
  a.forEach(function(v, i){
    var tag;
    var c = [];
    var s = [];
    var variant = [];
    var targetType = 0;
    var target = 0;
    var bonus = 0;
    var match = re.exec(t(v[0], 0));
    var timing = 0;
    var link = t(v[2], 2).split(",").map(function(x){return tget(x)});
    var irremovable = false;
    if(v[6]){
      targetType = v[6][0];
      target = tget(v[6][1]);
      bonus = tget(v[6][2]);
    }
    if(v[4]){
      c = v[4].split("/").map(function(x){
        var n = tget(x);
        if(x[0] === "[") timing = n;
        return n;
      });
    }
    if(v[5]) s = v[5].split("/").map(tget);
    if(v[7]) variant = v[7].split("/").map(tget);
    if(match && v[3] !== TAG_TYPE.CATEGORY){
      if(match[2]){
        c.push(tget((match[1] || "") + "○○時" + (match[3] ? "弱化" : "強化")));
      }
      if(match[4]) c.push(tget(match[4] + "系"));
    }
    switch(v[3]){
      case TAG_TYPE.ALL_BUFFS:
        s = buff;
        break;
      case TAG_TYPE.ALL_DEBUFFS:
        s = debuff;
        break;
      case TAG_TYPE.BUFF:
        c.push(tget("強化"));
        c.push(tget("強化(解除可)"));
        break;
      case TAG_TYPE.IRREMOVABLE_BUFF:
        c.push(tget("強化"));
        c.push(tget("強化(解除不可)"));
        irremovable = true;
        break;
      case TAG_TYPE.DEBUFF:
        c.push(tget("弱体"));
        c.push(tget("弱体(解除可)"));
        break;
      case TAG_TYPE.IRREMOVABLE_DEBUFF:
        c.push(tget("弱体"));
        c.push(tget("弱体(解除不可)"));
        irremovable = true;
        break;
    }
    tag = new Tag(i, v, c, s, targetType, target, variant, bonus, timing, link, irremovable);
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
  result.LOCALE_ORDER = order;
  labels[TAG_FLAG_NUM.BONUS_A] = ["状態変化/Status Effect", "スキル/Skill", "特殊/Special", ""];
  labels[TAG_FLAG_NUM.SELF] = labels[TAG_FLAG_NUM.ALLY] = labels[TAG_FLAG_NUM.ENEMY] = ["状態変化/Status Effect", "単発効果/One-Shot Effect", "", "カテゴリ/Category"];
  labels[TAG_FLAG_NUM.STATIC] = ["一般/General", "報酬増加/Bonus Upon Victory", "特攻/Attack Advantage", "特防/Defense Advantage"];
  result.LABELS = labels;
  result.table = table;
  WEAPON.forEach(function(w, i){
    var wn = t(w.name, 0);
    var wc = tget("武器種変更：" + wn);
    var cc = tget("CS変更：" + wn);
    if(wc) wcs[0][i] = wc;
    if(cc) wcs[1][i] = cc;
  });
  result.WCS = wcs;
  return result;
};

var TAG_MAX = 10000;

var TAG = Tag.createList(
  [[0, "", "", "", TAG_TYPE.CATEGORY]
  ,[1, "全ての強化/All buffs", "すへきよ", "", TAG_TYPE.ALL_BUFFS]
  ,[2, "すべての解除可能な弱体/All removable debuffs", "すへしや", "", TAG_TYPE.ALL_DEBUFFS]
  ,[3, "移動不能になる状態/Status that cause immobility", "いと1", "", TAG_TYPE.STATUS_GROUP, "", "威圧/恐怖/崩し/不動/マヒ"]
  ,[4, "攻撃力が低下する状態/Status that lower attack", "こうりよくてい", "", TAG_TYPE.STATUS_GROUP, "", "疑念/強化反転/暗闇/幻惑/束縛/呪い/マヒ"]
  ,[5, "スキルが封印される状態/Skill sealing status", "すきるか", "", TAG_TYPE.STATUS_GROUP, "", "スキル封印/束縛/二重封印"]
  ,[6, "被ダメージが増加する状態/Status that increase received damage", "ひた", "", TAG_TYPE.STATUS_GROUP, "", "強化反転/崩し/契約の代償/激怒/激怒+/劫火/弱点/照準/凍結/発狂/暴走/暴走+/烙印"]
  ,[7, "防御力が上昇する状態/Status that raise defense", "ほう1", "", TAG_TYPE.STATUS_GROUP, "", "外壁/頑強/金剛/守護/聖油/防御強化"]
  ,[8, "CP減少/Deplete CP", "CPけ", "", TAG_TYPE.ONE_SHOT, "CP減少系"]
  ,[9, "CP増加/Increase CP", "CPそ", "", TAG_TYPE.ONE_SHOT, "CP増加系"]
  ,[10, "CS封印/CS Lock", "CSふ", "CS封印/CS Lock", TAG_TYPE.DEBUFF, "CS封印系", "", "", "CS封印[解除不可]"]
  ,[11, "CS変更/Change CS", "CSへ", "", TAG_TYPE.BUFF]
  ,[12, "CS変更：打撃/Change CS: Blow", "CSへ3", "", TAG_TYPE.BUFF, "CS変更"]
  ,[13, "CS変更：魔法/Change CS: Magic", "CSへ5", "", TAG_TYPE.BUFF, "CS変更"]
  ,[14, "CS変更：横一文字/Change CS: Long Slash", "CSへ6", "", TAG_TYPE.BUFF, "CS変更"]
  ,[15, "CS変更：全域/Change CS: All", "CSへ8", "", TAG_TYPE.BUFF, "CS変更"]
  ,[16, "HP回復/Restore HP", "HPか", "", TAG_TYPE.ONE_SHOT, "HP回復系"]
  ,[17, "HP減少/Decrease HP", "HPけ", "", TAG_TYPE.ONE_SHOT, "HP減少系"]
  ,[18, "悪魔の契約/Demonic Pact", "あく", "与ダメx6.0\n被ダメx0.3\nCP増加\n[@$]/Deal x6.0\nTake x0.3\nIncrease CP\n[@$]/契約の代償", TAG_TYPE.IRREMOVABLE_BUFF, "攻撃増加系/防御増加系/CP増加系"]
  ,[19, "威圧/Oppression", "いあ", "移動不可/Cannot Move", TAG_TYPE.DEBUFF, "移動封印系"]
  ,[20, "怒時強化/Anger Strengthening", "いか", "与ダメx1.5\n[@$]/Deal x1.5\n[@$]/結縁：怒", TAG_TYPE.IRREMOVABLE_BUFF, "攻撃増加系"]
  ,[21, "意気/Spirit", "いき", "与ダメ+400~800/Deal +400~800", TAG_TYPE.BUFF, "与ダメージ追加系"]
  ,[22, "移動力増加/Increase movement", "いとそう", "", TAG_TYPE.STATIC]
  ,[23, "移動力増加(縦)/Increase movement (vertical)", "いとそう1", "", TAG_TYPE.STATIC, "移動力増加"]
  ,[24, "移動力増加(横)/Increase movement (horizontal)", "いとそう2", "", TAG_TYPE.STATIC, "移動力増加"]
  ,[25, "移動力増加(全)/Increase movement (all)", "いとそう3", "", TAG_TYPE.STATIC, "移動力増加/移動力増加(縦)/移動力増加(横)"]
  ,[26, "祈り/Prayer", "いの", "発動率+10%/Skill Rate +10%", TAG_TYPE.BUFF, "発動率増加系"]
  ,[27, "祈り時強化[クルースニク]/Prayer Strengthening[Kresnik]", "いのしき く", "HP回復1000\n[@$]/Restore HP 1000\n[@$]/祈り", TAG_TYPE.IRREMOVABLE_BUFF, "祈り時強化/HP回復系"]
  ,[28, "温泉/Hot Springs", "おん", "CP増加/Increase CP", TAG_TYPE.IRREMOVABLE_BUFF, "CP増加系"]
  ,[29, "回避/Evasion", "かいひ", "被ダメx0.01~0.005/Take 0.01~0.005x", TAG_TYPE.BUFF, "防御増加系"]
  ,[30, "回避時強化/Evasion Strengthening", "かいひしき", "発動率+80%\n[@$]/Skill Rate +80%\n[@$]/回避", TAG_TYPE.IRREMOVABLE_BUFF, "発動率増加系"]
  ,[31, "回避に貫通/Ignore Evasion", "かんかいひ", "100.0", TAG_TYPE.A_BONUS, "特攻/貫通"]
  ,[32, "獲得経験値アップ/XP Bonus", "かくとくけいあ", "", TAG_TYPE.REWARD]
  ,[33, "獲得コインアップ/Coin Bonus", "かくとくこい", "", TAG_TYPE.REWARD]
  ,[34, "加速/Acceleration", "かそ", "CP増加/Increase CP", TAG_TYPE.BUFF, "CP増加系", "", "", "加速[重複可]"]
  ,[35, "加速時強化[AR]/Acceleration Strengthening[AR]", "かそしき A", "CP増加\n[@$]/Increase CP\n[@$]/加速", TAG_TYPE.IRREMOVABLE_BUFF, "加速時強化/CP増加系"]
  ,[36, "加速時強化[ジェド]/Acceleration Strengthening[Ded]", "かそしき し", "発動率+20%\n[@$]/Skill Rate +20%\n[@$]/加速", TAG_TYPE.IRREMOVABLE_BUFF, "加速時強化/発動率増加系"]
  ,[37, "頑強/Tenacity", "かん", "被ダメx0.9~0.45/Take 0.9~0.45x", TAG_TYPE.BUFF, "防御増加系"]
  ,[38, "頑強時強化[タンガロア]/Tenacity Strengthening[Tangaroa]", "かんしき た", "与ダメ+1000\n[@$]/Deal +1000\n[@$]/頑強", TAG_TYPE.IRREMOVABLE_BUFF, "頑強時強化/与ダメージ追加系"]
  ,[39, "頑強に貫通/Ignore Tenacity", "かんかん", "2.22", TAG_TYPE.A_BONUS, "特攻/貫通"]
  ,[40, "疑念/Doubt", "きね", "与ダメx10.0\n[@$]\n\n与ダメx0.1\n[非 @$]/Deal x10.0\n[@$]\n\nDeal x0.1\n[Not @$]/憑依", TAG_TYPE.DEBUFF, "攻撃増加系/攻撃減少系"]
  ,[41, "強化解除/Remove buff", "きようかか", "", TAG_TYPE.ONE_SHOT, "状態解除系"]
  ,[42, "強化解除(単)/Remove buff (single)", "きようかか1", "", TAG_TYPE.ONE_SHOT, "強化解除/状態解除系"]
  ,[43, "強化解除(複)/Remove buff (multiple)", "きようかか2", "", TAG_TYPE.ONE_SHOT, "強化解除/状態解除系"]
  ,[44, "強化解除(全)/Remove buff (all)", "きようかか3", "", TAG_TYPE.ONE_SHOT, "強化解除/状態解除系"]
  ,[45, "強化奪取/Steal buff", "きようかた", "", TAG_TYPE.ONE_SHOT, "状態解除系/複製・貼付系"]
  ,[46, "強化奪取(単)/Steal buff (single)", "きようかた1", "", TAG_TYPE.ONE_SHOT, "強化奪取/強化解除/強化解除(単)/強化を複製/状態解除系/複製・貼付系"]
  ,[47, "強化奪取(複)/Steal buff (multiple)", "きようかた2", "", TAG_TYPE.ONE_SHOT, "強化奪取/強化解除/強化解除(複)/強化を複製/状態解除系/複製・貼付系"]
  ,[48, "強化転写/Transfer buff", "きようかて", "", TAG_TYPE.ONE_SHOT, "複製・貼付系"]
  ,[49, "強化転写(複)/Transfer buff (multiple)", "きようかて2", "", TAG_TYPE.ONE_SHOT, "強化転写/複製・貼付系"]
  ,[50, "強化転写(全)/Transfer buff (all)", "きようかて3", "", TAG_TYPE.ONE_SHOT, "強化転写/複製・貼付系"]
  ,[51, "強化反転/Buff Reversal", "きようかは", "与ダメx0.25\n被ダメx2.5\n[@$]/Deal 0.25x\nTake 2.5x\n[@$]/強化(解除可)", TAG_TYPE.DEBUFF, "攻撃減少系/防御減少系"]
  ,[52, "強化無効/Nullify Buff", "きようかむ", "", TAG_TYPE.DEBUFF, "強化無効系"]
  ,[53, "強化を複製/Copy buff", "きようかをふ", "", TAG_TYPE.ONE_SHOT, "複製・貼付系"]
  ,[54, "強化を貼付(味方から)/Paste buff (from ally)", "きようかをち1", "", TAG_TYPE.ONE_SHOT, "複製・貼付系"]
  ,[55, "強化を貼付(敵から)/Paste buff (from enemy)", "きようかをち2", "", TAG_TYPE.ONE_SHOT, "複製・貼付系"]
  ,[56, "強制移動無効(後)/Nullify forced movement (backward)", "きようせ1", "", TAG_TYPE.STATIC, "強制移動無効"]
  ,[57, "強制移動無効(全)/Nullify forced movement (all)", "きようせ2", "", TAG_TYPE.STATIC, "強制移動無効"]
  ,[58, "恐怖/Fear", "きようふ", "CP減少\n移動不可/Deplete CP\nCannot Move", TAG_TYPE.DEBUFF, "CP減少系/移動封印系"]
  ,[59, "極限/Limit", "きよく", "与ダメx1.0~2.0 x(2-現在HP%%最大HP)/Deal 1.0~2.0x (2-CurHP%%MaxHP)x", TAG_TYPE.BUFF, "攻撃増加系"]
  ,[60, "崩し/Break", "くす", "被ダメx1.2~2.4\n移動不可/Take 1.2~2.4x\nCannot Move", TAG_TYPE.DEBUFF, "防御減少系/移動封印系"]
  ,[61, "暗闇/Darkness", "くら", "与ダメx0.9~0.45\nCS封印/Deal 0.9~0.45x\nCS Lock", TAG_TYPE.DEBUFF, "攻撃減少系/CS封印系"]
  ,[62, "暗闇時強化[シヴァ]/Darkness Strengthening[Shiva]", "くらしき しう", "与ダメx2.5\n被ダメx0.7\n[@$]/Deal 2.5x\nTake 0.7x\n[@$]/暗闇", TAG_TYPE.IRREMOVABLE_BUFF, "暗闇時強化/攻撃増加系/防御増加系"]
  ,[63, "クリティカル/Critical", "くり", "与ダメx2.0~4.0/Deal 2.0~4.0x", TAG_TYPE.BUFF, "攻撃増加系"]
  ,[64, "クリティカル強化/Critical Strengthening", "くりき", "与ダメx2.5\n[@$]/Deal 2.5x\n[@$]/クリティカル", TAG_TYPE.IRREMOVABLE_BUFF, "攻撃増加系"]
  ,[65, "クリティカル+/Critical+", "くり+", "与ダメx2.5~5.0/Deal 2.5~5.0x", TAG_TYPE.BUFF, "攻撃増加系"]
  ,[66, "クリティカル++/Critical++", "くり++", "与ダメx3.0~6.0/Deal 3.0~6.0x", TAG_TYPE.BUFF, "攻撃増加系"]
  ,[67, "契約の代償/Contractual Dues", "けいやた", "被ダメ+10000\n発動率-100%\n[非 @$]/Take +10000\nSkill Rate -100%\n[Not @$]/悪魔の契約", TAG_TYPE.IRREMOVABLE_DEBUFF, "被ダメージ追加系/発動率減少系"]
  ,[68, "係留/Anchor", "けいり", "$/$/強制移動無効(全)", TAG_TYPE.BUFF, "強制移動無効系", , [-1, , "強制移動無効(全)"]]
  ,[69, "激怒/Rage", "けき", "与ダメx1.25~2.5\n被ダメx1.25~2.5/Deal 1.25~2.5x\nTake 1.25~2.5x", TAG_TYPE.BUFF, "攻撃増加系/防御減少系"]
  ,[70, "激怒+/Rage+", "けき+", "与ダメx1.25~2.5\n被ダメx1.25/Deal 1.25~2.5x\nTake 1.25x", TAG_TYPE.BUFF, "攻撃増加系/防御減少系"]
  ,[71, "激怒+時強化/Rage+ Strengthening", "けきしき+", "発動率+30%\n[@$]/Skill Rate +30%\n[@$]/激怒+", TAG_TYPE.IRREMOVABLE_BUFF, "発動率増加系"]
  ,[72, "幻惑/Dazzle", "けん", "与ダメx0.7~0.35/Deal 0.7~0.35x", TAG_TYPE.DEBUFF, "攻撃減少系"]
  ,[73, "劫火/Conflagration", "こうか", "被ダメ+3000\n[@$]/Take +3000\n[@$]/火傷", TAG_TYPE.DEBUFF, "被ダメージ追加系"]
  ,[74, "劫火時強化#1/Conflagration Strengthening", "こうかしき 1", "被ダメx0.35\nCP増加\n[@$]/Take 0.35x\nIncrease CP\n[@$]/劫火", TAG_TYPE.IRREMOVABLE_BUFF, "劫火時強化/防御増加系/CP増加系"]
  ,[75, "攻撃強化/ATK Up", "こうけきき", "与ダメx1.1~2.2/Deal 1.1~2.2x", TAG_TYPE.BUFF, "攻撃増加系"]
  ,[76, "攻撃力減少/Reduced ATK", "こうけきりよくけん", "与ダメx0.01/Deal 0.01x", TAG_TYPE.IRREMOVABLE_DEBUFF, "攻撃減少系"]
  ,[77, "攻撃力低下/ATK Reduction", "こうけきりよくて", "", TAG_TYPE.IRREMOVABLE_DEBUFF, "攻撃減少系"]
  ,[78, "攻撃力微増[AR]", "", "与ダメx1.13\n[重複可x4]/Deal 1.13x\n[Stackable 4x]", TAG_TYPE.IRREMOVABLE_BUFF, "攻撃力微増/攻撃増加系"]
  ,[79, "攻撃力微増[セト]", "", "与ダメx1.2\n[重複可x6]/Deal 1.2x\n[Stackable 6x]", TAG_TYPE.IRREMOVABLE_BUFF, "攻撃力微増/攻撃増加系"]
  ,[80, "剛力/Brawn", "こうり", "与ダメx1.15~2.3/Deal 1.15~2.3x", TAG_TYPE.BUFF, "攻撃増加系"]
  ,[81, "剛力時強化/Brawn Strengthening", "こうりしき", "与ダメx1.5\n[@$]/Deal 1.5x\n[@$]/剛力", TAG_TYPE.IRREMOVABLE_BUFF, "攻撃増加系"]
  ,[82, "告死/Countdown", "こく", "HP減少10000~20000/Decrease HP 10000~20000", TAG_TYPE.DEBUFF, "HP減少系"]
  ,[83, "金剛/Adamantine", "こんこ", "被ダメx0.9~0.45/Take 0.9~0.45x", TAG_TYPE.BUFF, "防御増加系"]
  ,[84, "金剛時強化/Adamantine Strengthening", "こんこしき", "与ダメx1.5\n[@$]/Deal 1.5x\n[@$]/金剛", TAG_TYPE.IRREMOVABLE_BUFF, "攻撃増加系"]
  ,[85, "金剛に貫通/Ignore Adamantine", "かんこん", "2.22", TAG_TYPE.A_BONUS, "特攻/貫通"]
  ,[86, "根性/Guts", "こんし", "HP1で復活/Revive with 1 HP", TAG_TYPE.BUFF, "復活系"]
  ,[87, "根性時強化[浅草AR]/Guts Strengthening[Asakusa AR]", "こんししき Aあ", "与ダメx1.5\n[@$]/Deal 1.5x\n[@$]/根性", TAG_TYPE.IRREMOVABLE_BUFF, "根性時強化/攻撃増加系"]
  ,[88, "根性時強化[マガン]/Guts Strengthening[Macan]", "こんししき ま", "与ダメx2.0\n[@$]/Deal 2.0x\n[@$]/根性", TAG_TYPE.IRREMOVABLE_BUFF, "根性時強化/攻撃増加系"]
  ,[89, "再生/Regeneration", "さい", "HP回復400~800/Restore HP 400~800", TAG_TYPE.BUFF, "HP回復系"]
  ,[90, "弱体解除/Remove debuff", "しやくたいか", "", TAG_TYPE.ONE_SHOT, "状態解除系"]
  ,[91, "弱体解除(単)/Remove debuff (single)", "しやくたいか1", "", TAG_TYPE.ONE_SHOT, "弱体解除/状態解除系"]
  ,[92, "弱体解除(複)/Remove debuff (multiple)", "しやくたいか2", "", TAG_TYPE.ONE_SHOT, "弱体解除/状態解除系"]
  ,[93, "弱体解除(全)/Remove debuff (all)", "しやくたいか3", "", TAG_TYPE.ONE_SHOT, "弱体解除/状態解除系"]
  ,[94, "弱体時強化[マガン]/Debuff Strengthening[Macan]", "しやくたいしき ま", "HP回復400\nCP増加\n[@$]/Restore HP 400\nIncrease CP\n[@$]/弱体(解除可)", TAG_TYPE.IRREMOVABLE_BUFF, "弱体時強化/HP回復系/CP増加系"]
  ,[95, "弱体時強化[ヴォルフ]/Debuff Strengthening[Volkh]", "しやくたいしき う", "被ダメx0.1\n[@$]/Take 0.1x\n[@$]/弱体(解除可)", TAG_TYPE.IRREMOVABLE_BUFF, "弱体時強化/防御増加系"]
  ,[96, "弱体奪取/Steal debuff", "しやくたいた", "", TAG_TYPE.ONE_SHOT, "状態解除系/複製・貼付系"]
  ,[97, "弱体奪取(複)/Steal debuff (multiple)", "しやくたいた2", "", TAG_TYPE.ONE_SHOT, "弱体奪取/弱体解除/弱体解除(複)/弱体を複製(味方に)/状態解除系/複製・貼付系"]
  ,[98, "弱体転写(全)/Transfer debuff (all)", "しやくたいて3", "", TAG_TYPE.ONE_SHOT, "弱体転写/弱体を貼付/複製・貼付系"]
  ,[99, "弱体反射/Reflect Debuff", "しやくたいは", "", TAG_TYPE.BUFF, "弱体無効系"]
  ,[100, "弱体無効/Nullify Debuff", "しやくたいむ", "", TAG_TYPE.BUFF, "弱体無効系"]
  ,[101, "弱体を複製(味方に)/Copy debuff (to ally)", "しやくたいをふ1", "", TAG_TYPE.ONE_SHOT, "複製・貼付系"]
  ,[102, "弱体を複製(敵に)/Copy debuff (to enemy)", "しやくたいをふ2", "", TAG_TYPE.ONE_SHOT, "複製・貼付系"]
  ,[103, "弱体を貼付/Paste debuff", "しやくたいをち", "", TAG_TYPE.ONE_SHOT, "複製・貼付系"]
  ,[104, "弱点/Weakness", "しやくて", "被ダメx1.2~2.4/Take 1.2~2.4x", TAG_TYPE.DEBUFF, "防御減少系"]
  ,[105, "集中/Concentration", "しゆう", "与ダメx1.1~2.2\n発動率+10%/Deal 1.1~2.2x\nSkill Rate +10%", TAG_TYPE.BUFF, "攻撃増加系/発動率増加系"]
  ,[106, "祝福/Blessing", "しゆく", "HP回復300~600/Restore HP 300~600", TAG_TYPE.BUFF, "HP回復系"]
  ,[107, "祝福時強化[チョウジ]/Blessing Strengthening[Choji]", "しゆくしき ち", "与ダメx2.0\n[@$]/Deal 2.0x\n[@$]/祝福", TAG_TYPE.IRREMOVABLE_BUFF, "祝福時強化/攻撃増加系"]
  ,[108, "祝福時弱化[メフィストフェレス]/Blessing Weakening[Mephistopheles]", "しゆくしし め", "HP減少1200\n[@$]/Decrease HP 1200\n[@$]/祝福", TAG_TYPE.IRREMOVABLE_DEBUFF, "祝福時弱化/HP減少系"]
  ,[109, "守護/Protection", "しゆこ", "被ダメx0.9~0.45/Take 0.9~0.45x", TAG_TYPE.BUFF, "防御増加系"]
  ,[110, "守護に貫通/Ignore Protection", "かんしゆ", "2.22", TAG_TYPE.A_BONUS, "特攻/貫通"]
  ,[111, "守護無効化/Nullify Protection", "しゆこむこ", "被ダメx2.22\n[@$]/Take 2.22x\n[@$]/守護", TAG_TYPE.IRREMOVABLE_DEBUFF, "防御減少系"]
  ,[112, "滋養/Nourishment", "しよう", "与ダメx1.1~1.5\nHP回復150~300/Deal 1.1~1.5x\nRestore HP 150~300", TAG_TYPE.BUFF, "攻撃増加系/HP回復系"]
  ,[113, "滋養時強化[アシガラ]/Nourishment Strengthening[Ashigara]", "しようしき あ", "与ダメx2.0\n被ダメx0.6\n[@$]/Deal 2.0x\nTake 0.6x\n[@$]/滋養", TAG_TYPE.IRREMOVABLE_BUFF, "滋養時強化/攻撃増加系/防御増加系"]
  ,[114, "スキル封印/Skill Lock", "すきるふ", "スキル封印/Skill Lock", TAG_TYPE.DEBUFF, "スキル封印系"]
  ,[115, "聖油/Unction", "せい", "被ダメx0.85~0.425\nHP回復150~300/Take 0.85~0.425x\nRestore HP 150~300", TAG_TYPE.BUFF, "防御増加系/HP回復系"]
  ,[116, "聖油時弱化/Unction Weakening", "せいしし", "被ダメ+10000\n[@$]/Take +10000\n[@$]/聖油", TAG_TYPE.IRREMOVABLE_DEBUFF, "被ダメージ追加系"]
  ,[117, "聖油に貫通/Ignore Unction", "かんせい", "2.35", TAG_TYPE.A_BONUS, "特攻/貫通"]
  ,[118, "全方向移動力増加/Increased movement range (all directions)", "せんほ1", "$/$/移動力増加(全)", TAG_TYPE.BUFF, "移動力増加系"]
  ,[119, "全方向移動力大増/Greatly Increased movement range (all directions)", "せんほ2", "$/$/移動力増加(全+4)", TAG_TYPE.IRREMOVABLE_BUFF, "移動力増加系"]
  ,[120, "束縛/Bind", "そく", "与ダメx0.9~0.45\nスキル封印/Deal 0.9~0.45x\nSkill Lock", TAG_TYPE.DEBUFF, "攻撃減少系/スキル封印系"]
  ,[121, "束縛時強化/Bind Strengthening", "そくしき", "与ダメx10.0\n[@$]/Deal 10.0x\n[@$]/束縛", TAG_TYPE.IRREMOVABLE_BUFF, "攻撃増加系"]
  ,[122, "脱力/Drain", "たつ", "CP減少\n発動率-10%/Deplete CP\nSkill Rate -10%", TAG_TYPE.DEBUFF, "CP減少系/発動率減少系"]
  ,[123, "注目/Taunt", "ちゆ", "ヘイト値+10000/Aggro +10000", TAG_TYPE.BUFF, "ヘイト操作系", "", "", "注目[重複可]"]
  ,[124, "注目時強化[オンブレティグレ]/Taunt Strengthening[Hombre Tigre]", "ちゆしき お", "発動率+30%\n[@$]/Skill Rate +30%\n[@$]/注目", TAG_TYPE.IRREMOVABLE_BUFF, "注目時強化/発動率増加系"]
  ,[125, "デメリット[0.25]/Demerit[0.25]", "てめ", "0.25", TAG_TYPE.A_BONUS]
  ,[126, "凍結/Freeze", "とうけ", "被ダメx1.1~2.2\nHP減少200~400/Take 1.1~2.2x\nDecrease HP 200~400", TAG_TYPE.DEBUFF, "防御減少系/HP減少系"]
  ,[127, "凍結時弱化[イツァムナー]/Freeze Weakening[Itzamna]", "とうけしし い", "発動率-50%\n[@$]/Skill Rate -50%\n[@$]/凍結", TAG_TYPE.IRREMOVABLE_DEBUFF, "凍結時弱化/発動率減少系"]
  ,[128, "闘志/Vigor", "とうし", "与ダメx1.2~2.4/Deal 1.2~2.4x", TAG_TYPE.BUFF, "攻撃増加系"]
  ,[129, "毒/Poison", "とく", "HP減少100~200/Decrease HP 100~200", TAG_TYPE.DEBUFF, "HP減少系"]
  ,[130, "毒反転/Poison Reversal", "とくは", "与ダメx2.0\n被ダメx0.6\nHP回復400\n[@$]/Deal 2.0x\nTake 0.6x\nRestore HP 400[@$]/毒", TAG_TYPE.BUFF, "攻撃増加系/防御増加系/HP回復系"]
  ,[131, "特防/D.Advantage", "とくほ", "", TAG_TYPE.D_BONUS]
  ,[132, "特防[0.3]/D.Advantage[0.3]", "とくほ03", "0.3", TAG_TYPE.D_BONUS, "特防"]
  ,[133, "特防[0.5]/D.Advantage[0.5]", "とくほ05", "0.5", TAG_TYPE.D_BONUS, "特防"]
  ,[134, "特防[0.6]/D.Advantage[0.6]", "とくほ06", "0.6", TAG_TYPE.D_BONUS, "特防"]
  ,[135, "特防[0.7]/D.Advantage[0.7]", "とくほ07", "0.7", TAG_TYPE.D_BONUS, "特防"]
  ,[136, "特防[0.8]/D.Advantage[0.8]", "とくほ08", "0.8", TAG_TYPE.D_BONUS, "特防"]
  ,[137, "特攻/A.Advantage", "とつ", "", TAG_TYPE.A_BONUS]
  ,[138, "特攻[1.3]/A.Advantage[1.3]", "とつ13", "1.3", TAG_TYPE.A_BONUS, "特攻"]
  ,[139, "特攻[1.4]/A.Advantage[1.4]", "とつ14", "1.4", TAG_TYPE.A_BONUS, "特攻"]
  ,[140, "特攻[1.5]/A.Advantage[1.5]", "とつ15", "1.5", TAG_TYPE.A_BONUS, "特攻"]
  ,[141, "特攻[1.6]/A.Advantage[1.6]", "とつ16", "1.6", TAG_TYPE.A_BONUS, "特攻"]
  ,[142, "特攻[1.67]/A.Advantage[1.67]", "とつ167", "1.67", TAG_TYPE.A_BONUS, "特攻"]
  ,[143, "特攻[2.0]/A.Advantage[2.0]", "とつ2", "2.0", TAG_TYPE.A_BONUS, "特攻"]
  ,[144, "特攻[2.3]/A.Advantage[2.3]", "とつ23", "2.3", TAG_TYPE.A_BONUS, "特攻"]
  ,[145, "特攻[2.5]/A.Advantage[2.5]", "とつ25", "2.5", TAG_TYPE.A_BONUS, "特攻"]
  ,[146, "特攻[3.0]/A.Advantage[3.0]", "とつ3", "3.0", TAG_TYPE.A_BONUS, "特攻"]
  ,[147, "特攻[4.0]/A.Advantage[4.0]", "とつ4", "4.0", TAG_TYPE.A_BONUS, "特攻"]
  ,[148, "特攻[6.0]/A.Advantage[6.0]", "とつ6", "6.0", TAG_TYPE.A_BONUS, "特攻"]
  ,[149, "二重封印/Double Lock", "にし", "スキル封印\nCS封印/Skill Lock\nCS Lock", TAG_TYPE.DEBUFF, "スキル封印系/CS封印系"]
  ,[150, "熱情/Ardor", "ねつ", "与ダメx1.2~2.4\nCP増加/Deal 1.2~2.4x\nIncrease CP", TAG_TYPE.BUFF, "攻撃増加系/CP増加系"]
  ,[151, "呪い/Curse", "のろ", "与ダメx0.8~0.4/Deal 0.8~0.4x", TAG_TYPE.DEBUFF, "攻撃減少系"]
  ,[152, "呪い時強化[ヴォルフ]/Curse Strengthening[Volkh]", "のろしき う", "与ダメx5.0\n[@$]/Deal 5.0x\n[@$]/呪い", TAG_TYPE.IRREMOVABLE_BUFF, "呪い時強化/攻撃増加系"]
  ,[153, "発狂/Madness", "はつ", "被ダメ+400~800\n$/Take +400~800\n$/移動力減少(縦)", TAG_TYPE.DEBUFF, "被ダメージ追加系/移動力減少系"]
  ,[154, "非加速時強化/Non-Acceleration Strengthening", "ひかそ", "被ダメx0.6\n[非 @$]/Take 0.6x\n[Not @$]/加速", TAG_TYPE.IRREMOVABLE_BUFF, "防御増加系"]
  ,[155, "引き寄せ(縦)/Draw (forward)", "ひきよせ1", "", TAG_TYPE.ONE_SHOT, "強制移動系/強制移動系(縦)"]
  ,[156, "引き寄せ(1マス)/Draw (1 square)", "ひきよせ11", "", TAG_TYPE.ONE_SHOT, "引き寄せ(縦)/強制移動系/強制移動系(縦)"]
  ,[157, "引き寄せ(2マス)/Draw (2 squares)", "ひきよせ12", "", TAG_TYPE.ONE_SHOT, "引き寄せ(縦)/強制移動系/強制移動系(縦)"]
  ,[158, "引き寄せ(3マス)/Draw (3 squares)", "ひきよせ13", "", TAG_TYPE.ONE_SHOT, "引き寄せ(縦)/強制移動系/強制移動系(縦)"]
  ,[159, "引き寄せ(4マス)/Draw (4 squares)", "ひきよせ14", "", TAG_TYPE.ONE_SHOT, "引き寄せ(縦)/強制移動系/強制移動系(縦)"]
  ,[160, "非祈り時強化/Non-Prayer Strengthening", "ひい", "与ダメx4.0\n[非 @$]/Deal 4.0x\n[Not @$]/祈り", TAG_TYPE.IRREMOVABLE_BUFF, "攻撃増加系"]
  ,[161, "非強化時弱化[クニヨシ]/Non-Buff Weakening[Kuniyoshi]", "ひきようしし く", "被ダメx2.5\n[非 @$]/Take 2.5x\n[Not @$]/強化(解除可)", TAG_TYPE.IRREMOVABLE_DEBUFF, "非強化時弱化/防御減少系"]
  ,[162, "非根性時強化/Non-Guts Strengthening", "ひこ", "被ダメx0.5\n[非 @$]/Take 0.5x\n[Not @$]/根性", TAG_TYPE.IRREMOVABLE_BUFF, "防御増加系"]
  ,[163, "非弱体時強化[モリタカ]/Non-Debuff Strengthening[Moritaka]", "ひししき も", "発動率+30%\n[非 @$]/Skill Rate +30%\n[Not @$]/弱体(解除可)", TAG_TYPE.IRREMOVABLE_BUFF, "非弱体時強化/発動率増加系"]
  ,[164, "非弱体時弱化/Non-Debuff Weakening", "ひししし", "被ダメx1.9\n[@$]\n\n与ダメx0.5\n被ダメx2.5\n[非 @$]/Take 1.9x\n[@$]\n\nDeal 0.5x\nTake 2.5x\n[Not @$]/弱体(解除可)", TAG_TYPE.IRREMOVABLE_DEBUFF, "攻撃減少系/防御減少系"]
  ,[165, "非憑依時弱化/Non-Possession Weakening", "ひひ", "与ダメx0.1\n[非 @$]/Deal 0.1x\n[Not @$]/憑依", TAG_TYPE.IRREMOVABLE_DEBUFF, "攻撃減少系"]
  ,[166, "憑依/Possession", "ひよ", "味方を攻撃/Attack allies", TAG_TYPE.DEBUFF, "攻撃不可系"]
  ,[167, "憑依時強化[エリイ]/Possession Strengthening[Ellie]", "ひよしき え", "与ダメx91.0\n[@$]/Deal 91.0x\n[@$]/憑依", TAG_TYPE.IRREMOVABLE_BUFF, "憑依時強化/攻撃増加系"]
  ,[168, "閃き/Glint", "ひら", "発動率+10%/Skill Rate +10%", TAG_TYPE.BUFF, "発動率増加系", "", "", "閃き[重複可]"]
  ,[169, "武器種変更/Weapon Change", "ふきし", "", TAG_TYPE.BUFF, "", "武器種変更：打撃", "", "武器種変更[弱体]"]
  ,[170, "武器種変更：斬撃/Weapon Change: Slash", "ふきし1", "", TAG_TYPE.BUFF, "武器種変更"]
  ,[171, "武器種変更：突撃/Weapon Change: Trust", "ふきし2", "", TAG_TYPE.BUFF, "武器種変更"]
  ,[172, "武器種変更：打撃/Weapon Change: Blow", "ふきし3", "", TAG_TYPE.BUFF, "武器種変更"]
  ,[173, "武器種変更：魔法/Weapon Change: Magic", "ふきし5", "", TAG_TYPE.BUFF, "武器種変更"]
  ,[174, "武器種変更：横一文字/Weapon Change: Long Slash", "ふきし6", "", TAG_TYPE.BUFF, "武器種変更"]
  ,[175, "武器種変更：狙撃/Weapon Change: Snipe", "ふきし7", "", TAG_TYPE.BUFF, "武器種変更"]
  ,[176, "武器種変更：全域/Weapon Change: All", "ふきし8", "", TAG_TYPE.BUFF, "武器種変更"]
  ,[177, "武器種変更：無/Weapon Change: None", "ふきし9", "", TAG_TYPE.BUFF, "武器種変更/攻撃不可系"]
  ,[178, "吹き飛ばし(縦)/Blast (backward)", "ふきと1", "", TAG_TYPE.ONE_SHOT, "強制移動系/強制移動系(縦)"]
  ,[179, "吹き飛ばし(1マス)/Blast (1 square)", "ふきと11", "", TAG_TYPE.ONE_SHOT, "吹き飛ばし(縦)/強制移動系/強制移動系(縦)"]
  ,[180, "吹き飛ばし(2マス)/Blast (2 squares)", "ふきと12", "", TAG_TYPE.ONE_SHOT, "吹き飛ばし(縦)/強制移動系/強制移動系(縦)"]
  ,[181, "吹き飛ばし(3マス)/Blast (3 squares)", "ふきと13", "", TAG_TYPE.ONE_SHOT, "吹き飛ばし(縦)/強制移動系/強制移動系(縦)"]
  ,[182, "吹き飛ばし(右)/Blast (right)", "ふきと2", "", TAG_TYPE.ONE_SHOT, "強制移動系/強制移動系(横)"]
  ,[183, "吹き飛ばし(左)/Blast (left)", "ふきと3", "", TAG_TYPE.ONE_SHOT, "強制移動系/強制移動系(横)"]
  ,[184, "不動/Immobility", "ふと", "CP増加\n移動不可/Increase CP\nCannot Move", TAG_TYPE.BUFF, "CP増加系/移動封印系"]
  ,[185, "奮起/Arousal", "ふん", "CP増加/Increase CP", TAG_TYPE.BUFF, "CP増加系"]
  ,[186, "妨害/Obstruct", "ほうか", "発動率-15%/Skill Rate -15%", TAG_TYPE.DEBUFF, "発動率減少系"]
  ,[187, "防御強化/DEF Up", "ほうきよき", "被ダメx0.9~0.45/Take 0.9~0.45x", TAG_TYPE.BUFF, "防御増加系"]
  ,[188, "防御強化に貫通/Ignore DEF Up", "かんほう", "2.22", TAG_TYPE.A_BONUS, "特攻/貫通"]
  ,[189, "防御強化無効化/Nullify DEF Up", "ほうきよきむこ", "被ダメx2.22\n[@$]/Take 2.22x\n[@$]/防御強化", TAG_TYPE.IRREMOVABLE_DEBUFF, "防御減少系"]
  ,[190, "暴走/Berserk", "ほうそ", "与ダメx1.3~2.6\n被ダメx1.3~2.6/Deal 1.3~2.6x\nTake 1.3~2.6x", TAG_TYPE.BUFF, "攻撃増加系/防御減少系"]
  ,[191, "暴走+/Berserk+", "ほうそ+", "与ダメx1.3~2.6\n被ダメx1.3/Deal 1.3~2.6x\nTake 1.3x", TAG_TYPE.BUFF, "攻撃増加系/防御減少系"]
  ,[192, "暴走時強化[オズ]/Berserk Strengthening[Oz]", "ほうそしき お", "発動率+50%\n[@$]/Skill Rate +50%\n[@$]/暴走", TAG_TYPE.IRREMOVABLE_BUFF, "暴走時強化/発動率増加系"]
  ,[193, "暴走+時強化[スノウ]/Berserk+ Strengthening[Snow]", "ほうそしき+ す", "与ダメx2.6\n被ダメx0.77\n[@$]/Deal 2.6x\nTake 0.77x\n[@$]/暴走+", TAG_TYPE.IRREMOVABLE_BUFF, "暴走+時強化/攻撃増加系/防御増加系"]
  ,[194, "マヒ/Paralysis", "まひ", "与ダメx0.9~0.45\n移動不可/Deal 0.9~0.45x\nCannot Move", TAG_TYPE.DEBUFF, "攻撃減少系/移動封印系"]
  ,[195, "マヒ時弱化[星空]/Paralysis Weakening[Nightglows]", "まひしし ほ", "発動率-50%\n[@$]/Skill Rate -50%\n[@$]/マヒ", TAG_TYPE.IRREMOVABLE_DEBUFF, "マヒ時弱化/発動率減少系"]
  ,[196, "魅了/Charm", "みり", "攻撃不可/Cannot attack", TAG_TYPE.DEBUFF, "攻撃不可系"]
  ,[197, "魅了時弱化[シヴァ]/Charm Weakening[Shiva]", "みりしし しう", "発動率-80%\n[@$]/Skill Rate -80%\n[@$]/魅了", TAG_TYPE.IRREMOVABLE_DEBUFF, "魅了時弱化/発動率減少系"]
  ,[198, "無窮/Infinitude", "むき", "与ダメx1.3~2.6\nHP減少400~800/Deal 1.3~2.6x\nDecrease HP 400~800", TAG_TYPE.BUFF, "攻撃増加系/HP減少系"]
  ,[199, "猛毒/Fatal Poison", "もう", "HP減少200~400/Decrease HP 200~400", TAG_TYPE.DEBUFF, "HP減少系"]
  ,[200, "火傷/Burn", "やけ", "HP減少300~600/Decrease HP 300~600", TAG_TYPE.DEBUFF, "HP減少系"]
  ,[201, "火傷時弱化[ジェド]/Burn Weakening[Ded]", "やけしし し", "被ダメx1.5\n[@$]/Take 1.5x\n[@$]/火傷", TAG_TYPE.IRREMOVABLE_DEBUFF, "火傷時弱化/防御減少系"]
  ,[202, "友情時強化/Friendship Strengthening", "ゆうしよ", "与ダメx1.5\n[@$]/Deal 1.5x\n[@$]/結縁：友", TAG_TYPE.IRREMOVABLE_BUFF, "攻撃増加系"]
  ,[203, "烙印/Stigma", "らく", "被ダメx1.15~2.3\nHP減少150~300/Take 1.15~2.3x\nDecrease HP 150~300", TAG_TYPE.DEBUFF, "防御減少系/HP減少系"]
  ,[204, "連撃/Combo", "れん", "二回攻撃\n非CS時与ダメx0.6/Attack twice\nDeal 0.6x except CS", TAG_TYPE.BUFF, "攻撃増加系"]
  ,[205, "斬撃/Slash", "1", "", TAG_TYPE.WEAPON]
  ,[206, "突撃/Thrust", "2", "", TAG_TYPE.WEAPON]
  ,[207, "打撃/Blow", "3", "", TAG_TYPE.WEAPON]
  ,[208, "射撃/Shot", "4", "", TAG_TYPE.WEAPON]
  ,[209, "魔法/Magic", "5", "", TAG_TYPE.WEAPON]
  ,[210, "狙撃/Snipe", "7", "", TAG_TYPE.WEAPON]
  ,[211, "横一文字/Long Slash", "6", "", TAG_TYPE.WEAPON]
  ,[212, "全域/All", "8", "", TAG_TYPE.WEAPON]
  ,[213, "無/None", "9", "", TAG_TYPE.WEAPON]
  ,[214, "鬼系スキル", "", "", TAG_TYPE.SKIP, "", "鬼道の衆/大江山の鬼頭領/鬼子連れのヤンキー/鬼道を束ねる者/鬼気迫る者/愚直なる血鬼"]
  ,[215, "獣系スキル", "", "", TAG_TYPE.SKIP, "", "獣の末裔/黄昏に弾く獣/首狩りの獣/忠玉の八犬士/ラビリンスの獣/獣蹄のサマリヤ王/獣道の渡世人/獣皮を巻く者/無垢なる獣"]
  ,[216, "チートと名の付くスキル/Cheat skills", "ちい", "", TAG_TYPE.SKILL, "", "チート系勇者/チートなる者"]
  ,[217, "魔王と名の付くスキル/Load skills", "まお", "", TAG_TYPE.SKILL, "", "僥倖の魔王/混沌の魔王/退廃の魔王/第四天魔王の子/大力の魔王/常闇の魔王/墓場の魔王/魔王"]
  ,[218, "愛を囚う者/Love Trapper", "あい", "", TAG_TYPE.SKILL]
  ,[219, "アスリート/Athlete", "あす", "", TAG_TYPE.SKILL, "", "歓呼のアスリート/直感のアスリート"]
  ,[220, "海を航る者/Seafarer", "うみ", "", TAG_TYPE.SKILL]
  ,[221, "泳達者/Swimmer", "えい", "", TAG_TYPE.SKILL]
  ,[222, "大筒の支配者/Ruler of Munition", "おおつ", "", TAG_TYPE.SKILL]
  ,[223, "歓呼のアスリート/Jubilant Athlete", "かん", "", TAG_TYPE.SKILL]
  ,[224, "鬼気迫る者/Frightful Imp", "きき", "", TAG_TYPE.SKILL]
  ,[225, "鬼道の衆/Oni Brethren", "きとうの", "", TAG_TYPE.SKILL, "", "大江山の鬼頭領/鬼子連れのヤンキー"]
  ,[226, "鬼道を束ねる者/Ruler of Ogres", "きとうを", "", TAG_TYPE.SKILL]
  ,[227, "僥倖の魔王/Fortuitous Dark Lord", "きようこ", "", TAG_TYPE.SKILL]
  ,[228, "狂戦士/Berserker", "きようせ", "", TAG_TYPE.SKILL]
  ,[229, "巨人なる者/Giant", "きよしんな", "", TAG_TYPE.SKILL, "", "巨人に戴かれる者"]
  ,[230, "首狩りの獣/Head Hunter", "くひ", "", TAG_TYPE.SKILL]
  ,[231, "獣の末裔/Blood of the Beast", "けものの", "", TAG_TYPE.SKILL, "", "首狩りの獣/獣道の渡世人/獣蹄のサマリヤ王/黄昏に弾く獣/忠玉の八犬士/ラビリンスの獣"]
  ,[232, "骨肉の天地創造者/Creator of Flesh and Bone", "こつ", "", TAG_TYPE.SKILL]
  ,[233, "混沌の魔王/Lord of Chaos", "こん", "", TAG_TYPE.SKILL]
  ,[234, "支配者/Ruler", "しは", "", TAG_TYPE.SKILL, "", "大筒の支配者"]
  ,[235, "島に生きる者/Islander", "しま", "", TAG_TYPE.SKILL, "", "秘島に生きる怪物"]
  ,[236, "獣皮を巻く者/In Beast's Clothing", "しゆうひ", "", TAG_TYPE.SKILL]
  ,[237, "須弥山に篭る者/Mt. Meru Dweller", "しゆみ", "", TAG_TYPE.SKILL]
  ,[238, "戦争屋/Warmonger", "せん", "", TAG_TYPE.SKILL]
  ,[239, "大雪山に篭る者/Mt. Daisetsu Dweller", "たいせ", "", TAG_TYPE.SKILL]
  ,[240, "退廃の魔王/Lord of Degeneration", "たいは", "", TAG_TYPE.SKILL]
  ,[241, "第四天魔王の子/Daughter of the Fourth Heaven's Lord", "たいよ", "", TAG_TYPE.SKILL]
  ,[242, "大力の魔王/Hulking Lord", "たいり", "", TAG_TYPE.SKILL]
  ,[243, "黄昏に弾く獣/Wolf of Ragnarok", "たそ", "", TAG_TYPE.SKILL]
  ,[244, "祟られし者/The Cursed", "たたられしも", "", TAG_TYPE.SKILL, "", "祟られし仕置人/祟られし指輪の主"]
  ,[245, "チート系勇者/Cheat Hero", "ちいとけ", "", TAG_TYPE.SKILL]
  ,[246, "チートなる者/Cheater", "ちいとな", "", TAG_TYPE.SKILL]
  ,[247, "忠玉の八犬士/Loyal Dog Warrior", "ちゆ", "", TAG_TYPE.SKILL]
  ,[248, "直感のアスリート/Intuitive Athlete", "ちよ", "", TAG_TYPE.SKILL]
  ,[249, "翼持つ者/Winged One", "つはさもつも", "", TAG_TYPE.SKILL, "", "翼持つアイドル"]
  ,[250, "天地創造者/Great Creator", "てん", "", TAG_TYPE.SKILL, "", "骨肉の天地創造者"]
  ,[251, "常闇の魔王/Lord of Eternal Darkness", "とこ", "", TAG_TYPE.SKILL]
  ,[252, "轟き奔る者/Thundering Runner", "ととろき", "", TAG_TYPE.SKILL]
  ,[253, "轟く者/Thunderer", "ととろく", "", TAG_TYPE.SKILL, "", "轟き奔る者"]
  ,[254, "墓場の魔王/Lord of the Graveyard", "はか", "", TAG_TYPE.SKILL]
  ,[255, "不死身なる者/Immortal", "ふしみな", "", TAG_TYPE.SKILL, "", "不死身の密林王"]
  ,[256, "不死身の密林王/Immortal King of The Jungle", "ふしみの", "", TAG_TYPE.SKILL]
  ,[257, "魔王/Dark Lord", "まお", "", TAG_TYPE.SKILL, "", "第四天魔王の子"]
  ,[258, "マシンボディ/Mechaman", "まし", "", TAG_TYPE.SKILL, "", "生存のマシンボディ"]
  ,[259, "緑を育む者/Gardener", "みと", "", TAG_TYPE.SKILL]
  ,[260, "山に篭る者/Mountain Dweller", "やま", "", TAG_TYPE.SKILL, "", "須弥山に篭る者/大雪山に篭る者"]
  ,[261, "有尾の悪魔/Tailed Demon", "ゆう", "", TAG_TYPE.SKILL]
  ,[262, "雷光を現す者/Living Lightning", "らいこうを", "", TAG_TYPE.SKILL, "", "雷光の装填者"]
  ,[263, "ラビリンスの獣/Beast of the Labyrinth", "らひ", "", TAG_TYPE.SKILL]
  ,[264, "竜を継ぐ者/Dragonborn", "りゆ", "", TAG_TYPE.SKILL]
  ,[265, "霊体/Wraith", "れいた", "", TAG_TYPE.SKILL]
  ,[266, "攻撃増加系/ATK Up", "こうけ1", "", TAG_TYPE.CATEGORY]
  ,[267, "攻撃減少系/ATK Down", "こうけ2", "", TAG_TYPE.CATEGORY]
  ,[268, "防御増加系/DEF Up", "ほうき1", "", TAG_TYPE.CATEGORY]
  ,[269, "防御減少系/DEF Down", "ほうき2", "", TAG_TYPE.CATEGORY]
  ,[270, "HP回復系/HP Restoration", "HP1", "", TAG_TYPE.CATEGORY]
  ,[271, "HP減少系/HP Decrease", "HP2", "", TAG_TYPE.CATEGORY]
  ,[272, "CP増加系/CP Increase", "CP1", "", TAG_TYPE.CATEGORY]
  ,[273, "CP減少系/CP Depletion", "CP2", "", TAG_TYPE.CATEGORY]
  ,[274, "弱体無効系/Nullify Debuff", "しや", "", TAG_TYPE.CATEGORY]
  ,[275, "発動率増加系/Skill Rate Increase", "はつ1", "", TAG_TYPE.CATEGORY]
  ,[276, "発動率減少系/Skill Rate Decrease", "はつ2", "", TAG_TYPE.CATEGORY]
  ,[277, "移動力増加系/Increased Movement", "いとうり1", "", TAG_TYPE.CATEGORY]
  ,[278, "強制移動系/Forced Move", "きようせ1", "", TAG_TYPE.CATEGORY]
  ,[279, "移動封印系/Move Lock", "いとうふ", "", TAG_TYPE.CATEGORY]
  ,[280, "スキル封印系/Skill Lock", "すき", "", TAG_TYPE.CATEGORY]
  ,[281, "CS封印系/CS Lock", "CSふ", "", TAG_TYPE.CATEGORY]
  ,[282, "貫通/Ignore", "かん", "", TAG_TYPE.A_BONUS]
  ,[283, "強化/Buff", "ん11", "", TAG_TYPE.CATEGORY]
  ,[284, "弱体/Debuff", "ん21", "", TAG_TYPE.CATEGORY]
  ,[285, "CS威力増加/Increase CS Damage", "CSい", "", TAG_TYPE.STATIC]
  ,[286, "CS威力増加(+1)/Increase CS Damage (+1)", "CSい1", "", TAG_TYPE.STATIC, "CS威力増加"]
  ,[287, "CS威力増加(+2)/Increase CS Damage (+2)", "CSい2", "", TAG_TYPE.STATIC, "CS威力増加"]
  ,[288, "獲得経験値集約/Concentrate gathered XP", "かくとくけいし", "", TAG_TYPE.REWARD]
  ,[289, "獲得戦友ポイントアップ/Bonus to Ally Points", "かくとくせん", "", TAG_TYPE.REWARD]
  ,[290, "獲得ランク経験値アップ/Rank XP Bonus", "かくとくらん", "", TAG_TYPE.REWARD]
  ,[291, "暴走時防御強化/DEF Up when Berserk", "ほうそしほ", "被ダメx0.7\n[@$]/Take 0.7x\n[@$]/暴走", TAG_TYPE.IRREMOVABLE_BUFF, "防御増加系"]
  ,[292, "暴走+時防御強化/DEF Up when Berserk+", "ほうそしほ+", "被ダメx0.7\n[@$]/Take 0.7x\n[@$]/暴走+", TAG_TYPE.IRREMOVABLE_BUFF, "防御増加系"]
  ,[293, "魅了時弱化[AR]/Charm Weakening[AR]", "みりしし A", "被ダメx3.0\n[@$]/Take 3.0x\n[@$]/魅了", TAG_TYPE.IRREMOVABLE_DEBUFF, "魅了時弱化/防御減少系"]
  ,[294, "報酬増加系/Bonus Upon Victory", "ほうし", "", TAG_TYPE.CATEGORY]
  ,[295, "滋養時強化[一杯AR]/Nourishment Strengthening[Ventures AR]", "しようしき Aい", "被ダメx0.8\n[@$]/Take 0.8x\n[@$]/滋養", TAG_TYPE.IRREMOVABLE_BUFF, "滋養時強化/防御増加系"]
  ,[296, "非妨害時弱化/Non-Obstruct Weakening", "ひほ", "被ダメx4.0\n[非 @$]/Take 4.0x\n[Not @$]/妨害", TAG_TYPE.IRREMOVABLE_DEBUFF, "防御減少系"]
  ,[297, "祝福時弱化[サンダユウ]/Blessing Weakening[Sandayu]", "しゆくしし さ", "発動率-50%\n[@$]/Skill Rate -50%\n[@$]/祝福", TAG_TYPE.IRREMOVABLE_DEBUFF, "祝福時弱化/発動率減少系"]
  ,[298, "滋養時弱化[サンダユウ]/Nourishment Weakening[Sandayu]", "しようしし さ", "発動率-50%\n[@$]/Skill Rate -50%\n[@$]/滋養", TAG_TYPE.IRREMOVABLE_DEBUFF, "滋養時弱化/発動率減少系"]
  ,[299, "移動力減少/Decrease movement", "いとけん", "", TAG_TYPE.STATIC]
  ,[300, "移動力減少(全)/Decrease movement (all)", "いとけん3", "", TAG_TYPE.STATIC, "移動力減少/移動力減少(縦)/移動力減少(横)"]
  ,[301, "魅了時弱化[カトブレパス]/Charm Weakening[Catoblepas]", "みりしし か", "被ダメx1.5\n[@$]/Take 1.5x\n[@$]/魅了", TAG_TYPE.IRREMOVABLE_DEBUFF, "魅了時弱化/防御減少系"]
  ,[302, "暗闇時弱化[カトブレパス]/Darkness Weakening[Catoblepas]", "くらしし か", "発動率-50%\n[@$]/Skill Rate -50%\n[@$]/暗闇", TAG_TYPE.IRREMOVABLE_DEBUFF, "暗闇時弱化/発動率減少系"]
  ,[303, "スキル発動率激増/Major Skill Rate Increase", "すきるはけ", "発動率+50%/Skill Rate +50%", TAG_TYPE.BUFF, "発動率増加系"]
  ,[304, "HPが回復する状態/HP restoring status", "HPか", "", TAG_TYPE.STATUS_GROUP, "", "再生/祝福/滋養/聖油"]
  ,[305, "HPが減少する弱体/HP reducing debuffs", "HPけん", "", TAG_TYPE.STATUS_GROUP, "", "告死/凍結/毒/猛毒/火傷/烙印"]
  ,[306, "特攻[1.2]/A.Advantage[1.2]", "とつ12", "1.2", TAG_TYPE.A_BONUS, "特攻"]
  ,[307, "特攻[5.0]/A.Advantage[5.0]", "とつ5", "5.0", TAG_TYPE.A_BONUS, "特攻"]
  ,[308, "魅了耐性/Charm Resistance", "みりたいせ", "", TAG_TYPE.BUFF, "状態耐性系", , [TAG_FLAG_NUM.NULLIFY, "魅了"]]
  ,[309, "被弾時強化解除/Remove Buff when Damaged", "ひたんきよ", "", TAG_TYPE.IRREMOVABLE_DEBUFF, "[ダメージ時]"]
  ,[310, "非強化時強化/Non-Buff Strengthening", "ひきようしき", "被ダメx0.3\n[非 @$]/Take 0.3x\n[Not @$]/強化(解除可)", TAG_TYPE.IRREMOVABLE_BUFF, "防御増加系"]
  ,[311, "呪い時強化[ジュウゴ]/Curse Strengthening[Jugo]", "のろしき し", "与ダメx6.0\n[@$]/Deal 6.0x\n[@$]/呪い", TAG_TYPE.IRREMOVABLE_BUFF, "呪い時強化/攻撃増加系"]
  ,[312, "烙印時強化/Stigma Strengthening", "らくしき", "被ダメx0.2\n[@$]/Take 0.2x\n[@$]/烙印", TAG_TYPE.IRREMOVABLE_BUFF, "防御増加系"]
  ,[313, "告死時強化/Countdown Strengthening", "こくしき", "発動率+80%\n[@$]/Skill Rate +80%\n[@$]/告死", TAG_TYPE.IRREMOVABLE_BUFF, "発動率増加系"]
  ,[314, "状態耐性系/Status Resistance", "しよたい", "", TAG_TYPE.CATEGORY]
  ,[315, "火傷耐性/Burn Resistance", "やけたいせ", "", TAG_TYPE.BUFF, "状態耐性系", , [TAG_FLAG_NUM.NULLIFY, "火傷"]]
  ,[316, "防御力上昇解除/Remove all defense buffs", "ほうきよりし", "", TAG_TYPE.UNKNOWN, "状態耐性系/状態解除系"]
  ,[317, "射撃弱点[ソール]", "", "", TAG_TYPE.IRREMOVABLE_DEBUFF, "射撃弱点/武器種弱点系/防御減少系", , [TAG_FLAG_NUM.BONUS_D, "", "武器種弱点[2.5]"]]
  ,[318, "火傷時強化[テュポーン]/Burn Strengthening[Typhon]", "やけしき て", "与ダメx2.5\n[@$]/Deal 2.5x\n[@$]/火傷", TAG_TYPE.IRREMOVABLE_BUFF, "火傷時強化/攻撃増加系"]
  ,[319, "対ダメージ敵HPCP超激減/Counter: Massive HP%%CP reduction", "たいためてきHPCP", "", TAG_TYPE.IRREMOVABLE_BUFF, "[対ダメージ]"]
  ,[320, "CS変更：射撃/Change CS: Shot", "CSへ4", "", TAG_TYPE.BUFF, "CS変更"]
  ,[321, "注目時強化[ツァトグァ]/Taunt Strengthening[Tsathoggua]", "ちゆしき つ", "発動率+60%\n[@$]\n\nダメージ後解除/Skill Rate +60%\n[@$]\n\nCanceled Post-Damage/注目", TAG_TYPE.BUFF, "注目時強化/発動率増加系"]
  ,[322, "移動後回避付与/Evasion Post-Move", "いとうこかい", "", TAG_TYPE.IRREMOVABLE_BUFF, "[移動後]"]
  ,[323, "移動後クリティカル付与/Critical Post-Move", "いとうこくり", "", TAG_TYPE.IRREMOVABLE_BUFF, "[移動後]"]
  ,[324, "退場時味方HP回復/HP Recovery on Defeat", "たいしよみか", "", TAG_TYPE.IRREMOVABLE_BUFF, "[退場時]"]
  ,[325, "呪い耐性/Curse Resistance", "のろたい", "", TAG_TYPE.BUFF, "状態耐性系", , [TAG_FLAG_NUM.NULLIFY, "呪い"]]
  ,[326, "HP吸収/Absorb HP", "HPき", "", TAG_TYPE.ONE_SHOT, "HP減少/HP減少系"]
  ,[327, "CP吸収/Absorb CP", "CPき", "", TAG_TYPE.ONE_SHOT, "CP減少/CP減少系"]
  ,[328, "弱体HP減/Debuff HP Reduction", "しやくたいHP", "", TAG_TYPE.IRREMOVABLE_DEBUFF, "[弱体後]"]
  ,[329, "無垢なる獣/Pure Beast", "むく", "", TAG_TYPE.SKILL]
  ,[330, "浄化/Purification", "しようか", "自身に$/$ from self/弱体解除(単)", TAG_TYPE.BUFF, "[ターン開始時]"]
  ,[331, "滋養時強化[サルタヒコ]/Nourishment Strengthening[Sarutahiko]", "しようしき さ", "与ダメx2.5\n[@$]/Deal 2.5x\n[@$]/滋養", TAG_TYPE.IRREMOVABLE_BUFF, "滋養時強化/攻撃増加系"]
  ,[332, "凍結耐性/Freeze Resistance", "とうけたい", "", TAG_TYPE.BUFF, "状態耐性系", , [TAG_FLAG_NUM.NULLIFY, "凍結"]]
  ,[333, "弱体転写/Transfer debuff", "しやくたいて", "", TAG_TYPE.ONE_SHOT, "複製・貼付系"]
  ,[334, "弱体転写(単)/Transfer debuff (single)", "しやくたいて1", "", TAG_TYPE.ONE_SHOT, "弱体転写/弱体を貼付/複製・貼付系"]
  ,[335, "霊験者/Worker of Miracles", "れいけ", "", TAG_TYPE.SKILL]
  ,[336, "頭陀袋の霊験者/Miraculous Bag Bearer", "すたふくろのれ", "", TAG_TYPE.SKILL, "", "頭陀袋の大風狂僧"]
  ,[337, "霊系スキル", "", "", TAG_TYPE.SKIP, "", "霊体/霊験者/頭陀袋の霊験者/頭陀袋の大風狂僧"]
  ,[338, "全弱体特攻/Advantage vs all debuffs", "せんし", "", TAG_TYPE.IRREMOVABLE_BUFF, "特攻付与系/攻撃増加系", , [TAG_FLAG_NUM.BONUS_A, "すべての解除可能な弱体", "特攻[1.4]"]]
  ,[339, "継続回復強化/Continuous HP recovery boosted", "けいそくか", "状態変化のHP回復量x2.0/Restore HP by status effect 2.0x", TAG_TYPE.IRREMOVABLE_BUFF, "効果増強系"]
  ,[340, "継続ダメージ強化/Increase Continuous Damage", "けいそくた", "状態変化のHP減少量x3.0/Decrease HP by status effect 3.0x", TAG_TYPE.IRREMOVABLE_DEBUFF, "効果増強系"]
  ,[341, "強化を再付与/Bestow the removed buffs again", "きようかをさ", "", TAG_TYPE.ONE_SHOT, "複製・貼付系"]
  ,[342, "弱体を再付与/Inflict the removed debuffs again", "しやくたいをさ", "", TAG_TYPE.ONE_SHOT, "複製・貼付系"]
  ,[343, "呪い時強化[トウジ]/Curse Strengthening[Toji]", "のろしき と", "与ダメx6.0\n[@$]/Deal 6.0x\n[@$]/呪い", TAG_TYPE.IRREMOVABLE_BUFF, "呪い時強化/攻撃増加系"]
  ,[344, "注目時強化[限定アールプ]/Taunt Strengthening[Limited Alp]", "ちゆしき ああ3", "与ダメx1.5\n発動率+20%\n[@$ 1つにつき]/Deal 1.5x\nSkill Rate +20%\n[for each @$]/注目", TAG_TYPE.IRREMOVABLE_BUFF, "注目時強化/攻撃増加系/発動率増加系"]
  ,[345, "注目全解除/Remove all Taunt", "ちゆせん", "", TAG_TYPE.UNKNOWN, "状態耐性系/状態解除系"]
  ,[346, "武器種変更：横一文字[弱体]/Weapon Change: Long Slash[Debuff]", "ふきし61", "", TAG_TYPE.DEBUFF, "武器種変更/武器種変更[弱体]/武器種変更：横一文字"]
  ,[347, "攻撃力微増[アザトース]", "", "与ダメx1.2\n[重複可x6]/Deal 1.2x\n[Stackable 6x]", TAG_TYPE.IRREMOVABLE_BUFF, "攻撃力微増/攻撃増加系"]
  ,[348, "根性解除/Remove Guts", "こんしかい", "", TAG_TYPE.UNKNOWN, "状態耐性系/状態解除系"]
  ,[349, "根性耐性/Guts Resistance", "こんしたい", "", TAG_TYPE.BUFF, "状態耐性系", , [TAG_FLAG_NUM.NULLIFY, "根性"]]
  ,[350, "攻撃力低下耐性/ATK Reduction Resistance", "こうけきりよくてたい", "", TAG_TYPE.BUFF, "状態耐性系", , [TAG_FLAG_NUM.NULLIFY, "攻撃力が低下する状態"]]
  ,[351, "種獲得率アップ/Increase drop rate of Seeds", "たね", "", TAG_TYPE.REWARD]
  ,[352, "ARトークン獲得率アップ/Increase drop rate of AR Tokens", "AR", "", TAG_TYPE.REWARD]
  ,[353, "加速[重複可]/Acceleration[Stackable]", "かそs", "CP増加\n[重複可x3]/Increase CP\n[Stackable 3x]", TAG_TYPE.IRREMOVABLE_BUFF, "加速/CP増加系"]
  ,[354, "閃き[重複可]/Glint[Stackable]", "ひらs", "発動率+10%\n[重複可x2]/Skill Rate +10%\n[Stackable 2x]", TAG_TYPE.IRREMOVABLE_BUFF, "閃き/発動率増加系"]
  ,[355, "注目[重複可]/Taunt[Stackable]", "ちゆs", "ヘイト値+10000\n[重複可x5]/Aggro +10000\n[Stackable 5x]", TAG_TYPE.IRREMOVABLE_BUFF, "注目/ヘイト操作系"]
  ,[356, "強化(解除可)/Buff (Removable)", "ん12", "", TAG_TYPE.CATEGORY]
  ,[357, "強化(解除不可)/Buff (Irremovable)", "ん13", "", TAG_TYPE.CATEGORY]
  ,[358, "弱体(解除可)/Debuff (Removable)", "ん22", "", TAG_TYPE.CATEGORY]
  ,[359, "弱体(解除不可)/Debuff (Irremovable)", "ん23", "", TAG_TYPE.CATEGORY]
  ,[360, "移動力減少(縦)/Decrease movement (vertical)", "いとけん1", "", TAG_TYPE.STATIC, "移動力減少"]
  ,[361, "移動力減少(横)/Decrease movement (horizontal)", "いとけん2", "", TAG_TYPE.STATIC, "移動力減少"]
  ,[362, "武器種弱点[2.0]/Weapon Weakness[2.0]", "ふき20", "2.0", TAG_TYPE.D_BONUS, "武器種弱点"]
  ,[363, "武器種弱点[1.3]/Weapon Weakness[1.3]", "ふき13", "1.3", TAG_TYPE.D_BONUS, "武器種弱点"]
  ,[364, "遠距離特攻/Advantage vs Distant Foes", "えん", "", TAG_TYPE.UNKNOWN]
  ,[365, "距離に応じて/based on distance", "きよ", "", TAG_TYPE.SPECIAL]
  ,[366, "CS封印全解除/Remove all CS Lock", "CSふせん", "", TAG_TYPE.UNKNOWN, "状態耐性系/状態解除系"]
  ,[367, "CS封印[解除不可]", "", "CS封印/CS Lock", TAG_TYPE.IRREMOVABLE_DEBUFF, "CS封印/CS封印系"]
  ,[368, "弱体奪取(単)/Steal debuff (single)", "しやくたいた1", "", TAG_TYPE.ONE_SHOT, "弱体奪取/弱体解除/弱体解除(単)/弱体を複製(味方に)/状態解除系/複製・貼付系"]
  ,[369, "弱体時強化[タンガロア∞]/Debuff Strengthening[Tangaroa∞]", "しやくたいしき た", "解除可能な各弱体の与ダメ・被ダメ・発動率を上書き/Overwrite Deal%%Take%%Skill Rate for each removable debuff", TAG_TYPE.IRREMOVABLE_BUFF, "弱体時強化/攻撃増加系/防御増加系/発動率増加系"]
  ,[370, "攻撃力強化解除/Remove all attack-rising status effects", "こうけきりよくき", "", TAG_TYPE.UNKNOWN, "状態耐性系/状態解除系"]
  ,[371, "魅了時弱化[シンヤ]/Charm Weakening[Shinya]", "みりしし しん", "発動率-??%\n[@$]/Skill Rate -??%\n[@$]/魅了", TAG_TYPE.IRREMOVABLE_DEBUFF, "魅了時弱化/発動率減少系"]
  ,[372, "加速時強化/Acceleration Strengthening", "かそしき", "", TAG_TYPE.IRREMOVABLE_BUFF]
  ,[373, "攻撃力微増/Minor ATK Increase", "こうけきりよくひ", "", TAG_TYPE.IRREMOVABLE_BUFF, "攻撃増加系"]
  ,[374, "根性時強化/Guts Strengthening", "こんししき", "", TAG_TYPE.IRREMOVABLE_BUFF]
  ,[375, "弱体時強化/Debuff Strengthening", "しやくたいしき", "", TAG_TYPE.IRREMOVABLE_BUFF]
  ,[376, "祝福時弱化/Blessing Weakening", "しゆくしし", "", TAG_TYPE.IRREMOVABLE_DEBUFF]
  ,[377, "滋養時強化/Nourishment Strengthening", "しようしき", "", TAG_TYPE.IRREMOVABLE_BUFF]
  ,[378, "注目時強化/Taunt Strengthening", "ちゆしき", "", TAG_TYPE.UNKNOWN]
  ,[379, "呪い時強化/Curse Strengthening", "のろしき", "", TAG_TYPE.IRREMOVABLE_BUFF]
  ,[380, "魅了時弱化/Charm Weakening", "みりしし", "", TAG_TYPE.IRREMOVABLE_DEBUFF]
  ,[381, "HP減少反転/HP Decrease Reversal", "HPけはん", "HP減少効果を回復に反転/HP decrease effect reverses to HP recovery", TAG_TYPE.BUFF, "増減反転系"]
  ,[382, "HP回復反転/HP Recovery Reversal", "HPかはん", "HP回復効果を減少に反転/HP recovery effect reverses to HP decrease", TAG_TYPE.DEBUFF, "増減反転系"]
  ,[383, "ダメージ反転/Damage Reversal", "ためはん", "敵からのダメージを回復に反転/Enemy damage reverses to recovery", TAG_TYPE.BUFF, "防御増加系/増減反転系"]
  ,[384, "防御貫通/Pierce Defense", "ほうきよか", "", TAG_TYPE.IRREMOVABLE_BUFF, "特攻付与系/攻撃増加系"]
  ,[385, "恐怖大特攻/Big Advantage vs Fear", "きようふたいと", "", TAG_TYPE.IRREMOVABLE_BUFF, "特攻付与系/攻撃増加系", , [TAG_FLAG_NUM.BONUS_A, "恐怖", "特攻[2.5]"]]
  ,[386, "打撃と斬撃と横一文字への大特防/Reduce Blow%%Slash%%Long-Slash damage", "たけきとさ", "", TAG_TYPE.IRREMOVABLE_BUFF, "特防付与系/防御増加系", , [TAG_FLAG_NUM.BONUS_D, "近接武器", "特防[0.1]"]]
  ,[387, "射撃と狙撃への大特防/Reduce Shot%%Snipe damage", "しやけと", "", TAG_TYPE.IRREMOVABLE_BUFF, "特防付与系/防御増加系", , [TAG_FLAG_NUM.BONUS_D, "射狙撃", "特防[0.1]"]]
  ,[388, "特防[0.1]/D.Advantage[0.1]", "とくほ01", "0.1", TAG_TYPE.D_BONUS, "特防"]
  ,[389, "崩し耐性/Break Resistance", "くすたい", "", TAG_TYPE.BUFF, "状態耐性系", , [TAG_FLAG_NUM.NULLIFY, "崩し"]]
  ,[390, "威圧特攻[AR]", "", "", TAG_TYPE.IRREMOVABLE_BUFF, "威圧特攻/特攻付与系/攻撃増加系", , [TAG_FLAG_NUM.BONUS_A, "威圧", "特攻[1.4]"]]
  ,[391, "閃き時強化[リチョウ]/Glint Strengthening[Licho]", "ひらしき り", "発動率+10%\n[@$]/Skill Rate +10%\n[@$]/閃き", TAG_TYPE.IRREMOVABLE_BUFF, "閃き時強化/発動率増加系"]
  ,[392, "退場時強化全転写/Transfer all buffs on Defeat", "たいしよきよ", "", TAG_TYPE.IRREMOVABLE_BUFF, "[退場時]"]
  ,[393, "退場時敵強化全解除/Remove all buffs on Defeat", "たいしよてきき", "", TAG_TYPE.IRREMOVABLE_BUFF, "[退場時]"]
  ,[394, "確率発狂/Latent Madness", "かくりつはつ", "", TAG_TYPE.IRREMOVABLE_DEBUFF, "[ダメージ時]"]
  ,[395, "発狂時弱化[ニャルラトテプ☆4]/Madness Weakening[Nyarlathotep ☆4]", "はつしし に2", "被ダメx3.0\n[@$]/Take 3.0x\n[@$]/発狂", TAG_TYPE.IRREMOVABLE_DEBUFF, "発狂時弱化/防御減少系"]
  ,[396, "ダメージ時頑強/Tenacity when damaged", "ためしかん", "", TAG_TYPE.IRREMOVABLE_BUFF, "[ダメージ時]"]
  ,[397, "次ターン強化/Increase ATK next turn", "つききよ", "", TAG_TYPE.IRREMOVABLE_BUFF, "[ターン開始時]"]
  ,[398, "攻撃力増加[次ターン]", "", "与ダメx2.0/Deal 2.0x", TAG_TYPE.IRREMOVABLE_BUFF, "攻撃力増加/攻撃増加系"]
  ,[399, "攻撃力増加[ターン毎減少]", "", "与ダメx1.6 → x1.2/Deal 1.6x → 1.2x", TAG_TYPE.IRREMOVABLE_BUFF, "攻撃力増加/攻撃増加系"]
  ,[400, "攻撃力増加[イツァムナー]", "", "与ダメx1.2 → x3.0/Deal 1.2x → 3.0x", TAG_TYPE.IRREMOVABLE_BUFF, "攻撃力増加/攻撃増加系"]
  ,[401, "熱情拡散/Ardor Diffusion", "ねつかく", "", TAG_TYPE.IRREMOVABLE_BUFF, "[移動フェーズ終了後]"]
  ,[402, "頑強拡散/Tenacity Diffusion", "かんかく", "", TAG_TYPE.IRREMOVABLE_BUFF, "[移動フェーズ終了後]"]
  ,[403, "集中拡散/Concentration Diffusion", "しゆうかく", "", TAG_TYPE.IRREMOVABLE_BUFF, "[移動フェーズ終了後]"]
  ,[404, "攻撃力増加/ATK Increase", "こうけきりよくそ", "", TAG_TYPE.IRREMOVABLE_BUFF, "攻撃増加系"]
  ,[405, "スキル発動率大増/Big Skill Rate Increase", "すきるはた", "発動率+30%/Skill Rate +30%", TAG_TYPE.IRREMOVABLE_BUFF, "発動率増加系"]
  ,[406, "スキル発動率増加/Skill Rate Increase", "すきるはそ", "発動率+20%/Skill Rate +20%", TAG_TYPE.IRREMOVABLE_BUFF, "発動率増加系"]
  ,[407, "次ターン引き寄せ[味方]/Draw in next turn[allies]", "つきひき", "", TAG_TYPE.IRREMOVABLE_BUFF, "[ターン開始時]"]
  ,[408, "次ターン引き寄せ[敵味方]/Draw in next turn[enemies\nallies]", "つきひき", "", TAG_TYPE.IRREMOVABLE_BUFF, "[ターン開始時]"]
  ,[409, "根性時強化[桜の山AR]/Guts Strengthening[Mountain AR]", "こんししき Aさ", "CP増加\n[@$]/Increase CP\n[@$]/根性", TAG_TYPE.IRREMOVABLE_BUFF, "根性時強化/CP増加系"]
  ,[410, "挺身の構え/Stance of the Volunteer", "てい", "", TAG_TYPE.IRREMOVABLE_BUFF, "[ダメージ時]"]
  ,[411, "攻撃力が上昇する状態(解除可能)/Status that raise attack (removable)", "こうりよくしよ", "", TAG_TYPE.STATUS_GROUP, "", "意気/疑念/極限/クリティカル/クリティカル+/クリティカル++/激怒/激怒+/攻撃強化/剛力/集中/滋養/闘志/毒反転/熱情/暴走/暴走+/無窮"]
  ,[412, "移動力増加(縦+2)/Increase movement (vertical +2)", "いとそう12", "", TAG_TYPE.STATIC, "移動力増加/移動力増加(縦)"]
  ,[413, "移動力増加(横+2)/Increase movement (horizontal +2)", "いとそう22", "", TAG_TYPE.STATIC, "移動力増加/移動力増加(横)"]
  ,[414, "横移動力減少/Reduced horizontal movement range", "よこけん1", "", TAG_TYPE.IRREMOVABLE_DEBUFF, "移動力減少系"]
  ,[415, "横移動力大減少/Greatly reduced horizontal movement range", "よこけん2", "", TAG_TYPE.IRREMOVABLE_DEBUFF, "移動力減少系"]
  ,[416, "移動力減少系/Reduced Movement", "いとうり2", "", TAG_TYPE.CATEGORY]
  ,[417, "非移動後HP激減/Non-Movement Major HP Decrease", "ひいとうHPけ", "", TAG_TYPE.IRREMOVABLE_DEBUFF, "[非移動後]"]
  ,[418, "弱体無効・反射解除/Remove Nullify%%Reflect Debuff", "しやくたいむはん", "", TAG_TYPE.UNKNOWN, "状態耐性系/状態解除系"]
  ,[419, "毒時弱化/Poison Weakening", "とくしし", "", TAG_TYPE.IRREMOVABLE_DEBUFF]
  ,[420, "ロジックボム/Logic Bomb", "ろし", "", TAG_TYPE.IRREMOVABLE_DEBUFF, "[ダメージ時]"]
  ,[421, "混乱/Confusion", "こんら", "周囲1マスにHP減少\n(1000)\n\n$/Decrease HP of 1 square in all directions\n(1000)\n\n$/移動力減少(横)", TAG_TYPE.DEBUFF, "移動力減少系/[攻撃後]"]
  ,[422, "弱体後CT/CT When Debuffed", "しやくたいこCT", "", TAG_TYPE.IRREMOVABLE_BUFF, "[弱体後]"]
  ,[423, "弱体後CT++/CT++ When Debuffed", "しやくたいこCT++", "", TAG_TYPE.IRREMOVABLE_BUFF, "[弱体後]"]
  ,[424, "愛時強化[ヘカテー]/Love Strengthening[Hecate]", "あい へ", "HP回復300\n[@$]/Restore HP 300\n[@$]/結縁：愛", TAG_TYPE.IRREMOVABLE_BUFF, "愛時強化/HP回復系"]
  ,[425, "魅了時弱化[ペルーン]/Charm Weakening[Perun]", "みりしし へ", "被ダメx3.0\n[@$]/Take 3.0x\n[@$]/魅了", TAG_TYPE.IRREMOVABLE_DEBUFF, "魅了時弱化/防御減少系"]
  ,[426, "告死時弱化[ペルーン]/Countdown Weakening[Perun]", "こくしし へ", "発動率-50%\n[@$]/Skill Rate -50%\n[@$]/告死", TAG_TYPE.IRREMOVABLE_DEBUFF, "告死時弱化/発動率減少系"]
  ,[427, "武器種変更：射撃/Weapon Change: Shot", "ふきし4", "", TAG_TYPE.BUFF, "武器種変更"]
  ,[428, "斬撃・横一文字弱点/Slash%%Long-Slash Weakness", "さんよ", "", TAG_TYPE.IRREMOVABLE_DEBUFF, "武器種弱点系/防御減少系", , [TAG_FLAG_NUM.BONUS_D, "", "武器種弱点[1.2]"]]
  ,[429, "火傷時弱化/Burn Weakening", "やけしし", "", TAG_TYPE.IRREMOVABLE_DEBUFF]
  ,[430, "火傷時弱化[ヨシトウ]/Burn Weakening[Yoshito]", "やけしし よ", "発動率-50%\n[@$]/Skill Rate -50%\n[@$]/火傷", TAG_TYPE.IRREMOVABLE_DEBUFF, "火傷時弱化/発動率減少系"]
  ,[431, "からくりぼでぃ/Clockwork Assassin", "からほ", "", TAG_TYPE.SKILL]
  ,[432, "からくり義体/Clockwork Eliminator", "からき", "", TAG_TYPE.SKILL]
  ,[433, "マシン系スキル", "", "", TAG_TYPE.SKIP, "", "マシンボディ/からくりぼでぃ/からくり義体/仰天のマシンボディ/生存のマシンボディ"]
  ,[434, "被回復増加/Increased Recovery", "ひかい", "", TAG_TYPE.BUFF, "効果増強系"]
  ,[435, "武器種弱点[1.2]/Weapon Weakness[1.2]", "ふき12", "1.2", TAG_TYPE.D_BONUS, "武器種弱点"]
  ,[436, "移動力増加(全+4)/Increase movement (all +4)", "いとそう34", "", TAG_TYPE.STATIC, "移動力増加/移動力増加(縦)/移動力増加(横)/移動力増加(全)/移動力増加(縦+2)/移動力増加(横+2)/移動力増加(全+2)"]
  ,[437, "火傷時強化/Burn Strengthening", "やけしき", "", TAG_TYPE.IRREMOVABLE_BUFF]
  ,[438, "火傷時強化[タダトモ]/Burn Strengthening[Tadatomo]", "やけしき た", "HP回復1000\n[@$]/Restore HP 1000\n[@$]/火傷", TAG_TYPE.IRREMOVABLE_BUFF, "火傷時強化/HP回復系"]
  ,[439, "弱体無効時強化/Nullify Debuff Strengthening", "しやくたいむしき", "", TAG_TYPE.IRREMOVABLE_BUFF]
  ,[440, "弱体無効時強化[ウランバートル☆3]/Nullify Debuff Strengthening[Ulaanbaatar ☆3]", "しやくたいむしき う3", "与ダメx3.0\n[@$]/Deal 3.0x\n[@$]/弱体無効", TAG_TYPE.IRREMOVABLE_BUFF, "弱体無効時強化/攻撃増加系"]
  ,[441, "弱体無効時強化[ウランバートル☆5]/Nullify Debuff Strengthening[Ulaanbaatar ☆5]", "しやくたいむしき う5", "与ダメx5.0\n[@$]/Deal 5.0x\n[@$]/弱体無効", TAG_TYPE.IRREMOVABLE_BUFF, "弱体無効時強化/攻撃増加系"]
  ,[442, "恐怖耐性/Fear Resistance", "きようふたいせ", "", TAG_TYPE.BUFF, "状態耐性系", , [TAG_FLAG_NUM.NULLIFY, "恐怖"]]
  ,[443, "全方向移動力増加[解除不可]", "", "$/$/移動力増加(全)", TAG_TYPE.IRREMOVABLE_BUFF, "全方向移動力増加/移動力増加系"]
  ,[444, "全域特防[タイシャクテン]", "", "", TAG_TYPE.IRREMOVABLE_BUFF, "全域特防/特防付与系/防御増加系", , [TAG_FLAG_NUM.BONUS_D, "全域", "特防[0.1]"]]
  ,[445, "スキル発動率激増[アイザック]", "", "発動率+60%/Skill Rate +60%", TAG_TYPE.IRREMOVABLE_BUFF, "スキル発動率激増/発動率増加系"]
  ,[446, "マシンボディ付与/Mechaman[Buff]", "まし", "", TAG_TYPE.IRREMOVABLE_BUFF, "[ダメージ時]"]
  ,[447, "愚直なる血鬼/Naive Vampire", "くち", "", TAG_TYPE.SKILL]
  ,[448, "横移動力増加/Increased horizontal movement", "よこそう", "$/$/移動力増加(横)", TAG_TYPE.BUFF, "移動力増加系"]
  ,[449, "花獲得率アップ/Increase drop rate of Blossoms", "はな", "", TAG_TYPE.REWARD]
  ,[450, "外壁/Outer Wall", "かいへ", "被ダメx0.9~0.75/Take 0.9~0.75x", TAG_TYPE.IRREMOVABLE_BUFF, "防御増加系"]
  ,[451, "弱点特攻[オズ]", "", "", TAG_TYPE.IRREMOVABLE_BUFF, "弱点特攻/特攻付与系/攻撃増加系", , [TAG_FLAG_NUM.BONUS_A, "弱点", "特攻[1.4]"]]
  ,[452, "係留時強化[スモーキーゴッド]/Anchor Strengthening[Smoky God]", "けいりしき す", "与ダメx1.5\n[@$]/Deal 1.5x\n[@$]/係留", TAG_TYPE.IRREMOVABLE_BUFF, "係留時強化/攻撃増加系"]
  ,[453, "弱点耐性/Weakness Resistance", "しやくてたい", "", TAG_TYPE.BUFF, "状態耐性系", , [TAG_FLAG_NUM.NULLIFY, "弱点"]]
  ,[454, "防御強化時回復/Heal while DEF Up", "ほうきよきしか", "HP回復400\n[@$]/Restore HP 400\n[@$]/防御強化", TAG_TYPE.IRREMOVABLE_BUFF, "HP回復系"]
  ,[455, "強化後回復付与/HP Recovery Post-Buff", "きようかこか", "", TAG_TYPE.IRREMOVABLE_BUFF, "[強化後]"]
  ,[456, "マシンボディ特攻/Advantage vs Mechaman", "ましんと", "", TAG_TYPE.IRREMOVABLE_BUFF, "特攻付与系/攻撃増加系", , [TAG_FLAG_NUM.BONUS_A, "マシン系スキル", "特攻[2.0]"]]
  ,[457, "注目耐性/Taunt Resistance", "ちゆたい", "", TAG_TYPE.BUFF, "状態耐性系", , [TAG_FLAG_NUM.NULLIFY, "注目"]]
  ,[458, "非火傷時強化/Non-Burn Strengthening", "ひや", "与ダメx2.0\n[非 @$]/Deal 2.0x\n[Not @$]/火傷", TAG_TYPE.IRREMOVABLE_BUFF, "攻撃増加系"]
  ,[459, "火傷時強化[アキハゴンゲン]/Burn Strengthening[Akiha Gongen]", "やけしき あ", "CP増加\n[@$]/Increase CP\n[@$]/火傷", TAG_TYPE.IRREMOVABLE_BUFF, "火傷時強化/CP増加系"]
  ,[460, "魅了時弱化[アキハゴンゲン]/Charm Weakening[Akiha Gongen]", "みりしし あき", "HP減少600\n[@$]/Decrease HP 600\n[@$]/魅了", TAG_TYPE.IRREMOVABLE_DEBUFF, "魅了時弱化/HP減少系"]
  ,[461, "縦移動力増加/Increased vertical movement", "たてそう", "$/$/移動力増加(縦)", TAG_TYPE.BUFF, "移動力増加系"]
  ,[462, "意気時強化[カトブレパス]/Spirit Strengthening[Catoblepas]", "いきしき か", "与ダメ+1200\n[@$]/Deal +1200\n[@$]/意気", TAG_TYPE.IRREMOVABLE_BUFF, "意気時強化/与ダメージ追加系"]
  ,[463, "対ダメージ攻撃強化付与/Counter: ATK Up", "たいためこう", "", TAG_TYPE.IRREMOVABLE_DEBUFF, "[対ダメージ]"]
  ,[464, "退場時HP激減/Major HP decrease on Defeat", "たいしよHPけ", "", TAG_TYPE.IRREMOVABLE_BUFF, "[退場時]"]
  ,[465, "退場時CP激減/Major CP decrease on Defeat", "たいしよCPけ", "", TAG_TYPE.IRREMOVABLE_BUFF, "[退場時]"]
  ,[466, "回避貫通/Ignore Evasion[Buff]", "かいひか", "", TAG_TYPE.IRREMOVABLE_BUFF, "特攻付与系/攻撃増加系", , [TAG_FLAG_NUM.BONUS_A, "回避", "回避に貫通"]]
  ,[467, "退場時攻撃強化付与/ATK Up on Defeat", "たいしよこう", "", TAG_TYPE.IRREMOVABLE_BUFF, "[退場時]"]
  ,[468, "退場時防御強化付与/DEF Up on Defeat", "たいしよほう", "", TAG_TYPE.IRREMOVABLE_BUFF, "[退場時]"]
  ,[469, "回避耐性/Evasion Resistance", "かいひたい", "", TAG_TYPE.BUFF, "状態耐性系", , [TAG_FLAG_NUM.NULLIFY, "回避"]]
  ,[470, "攻撃後強化単体奪取/Steal Buff Post-attack", "こうけきこきよ", "", TAG_TYPE.IRREMOVABLE_BUFF, "[攻撃後]"]
  ,[471, "攻撃後弱点付与/Weakness Post-attack", "こうけきこしや", "", TAG_TYPE.IRREMOVABLE_BUFF, "[攻撃後]"]
  ,[472, "攻撃後CP吸収/Absorb CP Post-attack", "こうけきこCP", "", TAG_TYPE.IRREMOVABLE_BUFF, "[攻撃後]"]
  ,[473, "連撃時強化/Combo Strengthening", "れんしき", "与ダメx2.0\n[@$]/Deal 2.0x\n[@$]/連撃", TAG_TYPE.IRREMOVABLE_BUFF, "攻撃増加系"]
  ,[474, "暗闇時弱化/Darkness Weakening", "くらしし", "", TAG_TYPE.IRREMOVABLE_DEBUFF]
  ,[475, "暗闇時弱化[エリイ]/Darkness Weakening[Ellie]", "くらしし え", "HP減少500\n[@$]/Decrease HP 500\n[@$]/暗闇", TAG_TYPE.IRREMOVABLE_DEBUFF, "暗闇時弱化/HP減少系"]
  ,[476, "ターン開始時憑依/Possession Start of Turn", "たあひよ", "", TAG_TYPE.IRREMOVABLE_DEBUFF, "[ターン開始時]"]
  ,[477, "攻撃後HP吸収/Absorb HP Post-attack", "こうけきこHPき", "", TAG_TYPE.IRREMOVABLE_BUFF, "[攻撃後]"]
  ,[478, "攻撃時極限付与/Limit when attacking", "こうけきしきよ", "", TAG_TYPE.IRREMOVABLE_BUFF, "[攻撃時]"]
  ,[479, "空振り時CP減少/Decrease CP on miss", "からCP", "", TAG_TYPE.IRREMOVABLE_DEBUFF, "[空振り時]"]
  ,[480, "攻撃後HP回復/Restore HP post-attack", "こうけきこHPか", "", TAG_TYPE.IRREMOVABLE_BUFF, "[攻撃後]"]
  ,[481, "空振り時烙印付与/Stigma on miss", "かららく", "", TAG_TYPE.IRREMOVABLE_DEBUFF, "[空振り時]"]
  ,[482, "強化後集中付与/Concentration Post-Buff", "きようかこし", "", TAG_TYPE.IRREMOVABLE_BUFF, "[強化後]"]
  ,[483, "横移動力増加[解除不可]", "", "$/$/移動力増加(横)", TAG_TYPE.IRREMOVABLE_BUFF, "横移動力増加/移動力増加系"]
  ,[484, "ダメージ時回避付与", "ためしかい", "", TAG_TYPE.IRREMOVABLE_BUFF, "[ダメージ時]"]
  ,[485, "ダメージ後回避耐性付与", "ためこかい", "", TAG_TYPE.IRREMOVABLE_DEBUFF, "[ダメージ後]"]
  ,[486, "獣蹄のサマリヤ王/Beastly Samalian King", "しゆうて", "", TAG_TYPE.SKILL]
  ,[487, "厄災の連鎖/Chains of Calamity", "やく", "確率で隣接1マス内に$&$&$\n(発動時解除)/Chanse of $, $, and $ on self and adjacent squares\n(remove upon activation)/スキル封印,猛毒,妨害", TAG_TYPE.IRREMOVABLE_DEBUFF, "[ダメージ時]"]
  ,[488, "崩し特攻/Advantage vs Break", "くすと", "", TAG_TYPE.IRREMOVABLE_BUFF, "特攻付与系/攻撃増加系", , [TAG_FLAG_NUM.BONUS_A, "崩し", "特攻[1.5]"]]
  ,[489, "全域特防[ビッグフット]", "", "", TAG_TYPE.IRREMOVABLE_BUFF, "全域特防/特防付与系/防御増加系", , [TAG_FLAG_NUM.BONUS_D, "全域", "特防[0.8]"]]
  ,[490, "HPが継続回復する状態/Healing status", "HPけい", "", TAG_TYPE.STATUS_GROUP, "", "再生/祝福/滋養/聖油"]
  ,[491, "凍結時弱化/Freeze Weakening", "とうけしし", "", TAG_TYPE.IRREMOVABLE_DEBUFF]
  ,[492, "祝福時強化/Blessing Strengthening", "しゆくしき", "", TAG_TYPE.IRREMOVABLE_BUFF]
  ,[493, "凍結時弱化[バートロ]/Freeze Weakening[Bertro]", "とうけしし は", "被ダメx2.5\n[@$]/Take 2.5x\n[@$]/凍結", TAG_TYPE.IRREMOVABLE_DEBUFF, "凍結時弱化/防御減少系"]
  ,[494, "祝福時強化[バートロ]/Blessing Strengthening[Bertro]", "しゆくしき は", "与ダメx2.5\n被ダメx0.3\n[@$]/Deal 2.5x\nTake 0.3x\n[@$]/祝福", TAG_TYPE.IRREMOVABLE_BUFF, "祝福時強化/攻撃増加系/防御増加系"]
  ,[495, "継続ダメージを受ける状態(解除可能)/Continuous damage status (removable)", "けいをう", "", TAG_TYPE.STATUS_GROUP, "", "告死/凍結/毒/無窮/猛毒/火傷/烙印"]
  ,[496, "祝福時強化[シュクユウ]/Blessing Strengthening[Zhurong]", "しゆくしき しゆ", "被ダメx0.3\n[@$]/Take 0.3x\n[@$]/祝福", TAG_TYPE.IRREMOVABLE_BUFF, "祝福時強化/防御増加系"]
  ,[497, "威圧特攻/Advantage vs Oppression", "いあと", "", TAG_TYPE.IRREMOVABLE_BUFF, "特攻付与系/攻撃増加系"]
  ,[498, "威圧特攻[シームルグ]", "", "", TAG_TYPE.IRREMOVABLE_BUFF, "威圧特攻/特攻付与系/攻撃増加系", , [TAG_FLAG_NUM.BONUS_A, "威圧", "特攻[1.5]"]]
  ,[499, "攻撃力微増[シームルグ]", "", "与ダメx1.2\n[重複可x3]/Deal 1.2x\n[Stackable 3x]", TAG_TYPE.IRREMOVABLE_BUFF, "攻撃力微増/攻撃増加系"]
  ,[500, "威圧耐性/Oppression Resistance", "いあたい", "", TAG_TYPE.BUFF, "状態耐性系", , [TAG_FLAG_NUM.NULLIFY, "威圧"]]
  ,[501, "友時強化[イナバ]/Friendship Strengthening[Inaba]", "ゆうしき い", "HP回復500\n[@$]/Restore HP 500\n[@$]/結縁：友", TAG_TYPE.IRREMOVABLE_BUFF, "友時強化/HP回復系"]
  ,[502, "攻撃力増加[装備者CP]", "", "与ダメx1.1 → x2.0/Deal 1.1x → 2.0x", TAG_TYPE.IRREMOVABLE_BUFF, "攻撃力増加/攻撃増加系"]
  ,[503, "呪い時弱化/Curse Weakening", "のろしし", "被ダメx1.5\n[@$]/Take 1.5x\n[@$]/呪い", TAG_TYPE.IRREMOVABLE_DEBUFF, "防御減少系"]
  ,[504, "確率束縛/Latent Bind", "かくりつそく", "", TAG_TYPE.IRREMOVABLE_DEBUFF, "[ダメージ後]"]
  ,[505, "闘志時強化[ギリメカラ]/Vigor Strengthening[Girimekra]", "とうししき き", "被ダメx0.6\n[@$]/Take 0.6x\n[@$]/闘志", TAG_TYPE.IRREMOVABLE_BUFF, "闘志時強化/防御増加系"]
  ,[506, "威圧時弱化[ギリメカラ]/Oppression Weakening[Girimekra]", "いあしし き", "与ダメx0.75\n[@$]/Deal 0.75x\n[@$]/威圧", TAG_TYPE.IRREMOVABLE_DEBUFF, "威圧時弱化/攻撃減少系"]
  ,[507, "威圧特攻[ギリメカラ]", "", "", TAG_TYPE.IRREMOVABLE_BUFF, "威圧特攻/特攻付与系/攻撃増加系", , [TAG_FLAG_NUM.BONUS_A, "威圧", "特攻[1.5]"]]
  ,[508, "暗闇時強化/Darkness Strengthening", "くらしき", "", TAG_TYPE.IRREMOVABLE_BUFF]
  ,[509, "暗闇時強化[ジェイコフ]/Darkness Strengthening[Jacob]", "くらしき しえ", "HP回復1000\n[@$]/Restore HP 1000\n[@$]/暗闇", TAG_TYPE.IRREMOVABLE_BUFF, "暗闇時強化/HP回復系"]
  ,[510, "攻撃力微増[ジェイコフ]", "", "与ダメx1.2\n[重複可x3]/Deal 1.2x\n[Stackable 3x]", TAG_TYPE.IRREMOVABLE_BUFF, "攻撃力微増/攻撃増加系"]
  ,[511, "特防[0.65]/D.Advantage[0.65]", "とくほ065", "0.65", TAG_TYPE.D_BONUS, "特防"]
  ,[512, "武器種弱点系/Weapon Weakness", "ふきしや", "", TAG_TYPE.CATEGORY]
  ,[513, "魔法弱点/Magic Weakness", "まほし", "", TAG_TYPE.IRREMOVABLE_DEBUFF, "武器種弱点系/防御減少系", , [TAG_FLAG_NUM.BONUS_D, "", "武器種弱点[2.5]"]]
  ,[514, "確率マヒ/Latent Paralysis", "かくりつまひ", "", TAG_TYPE.IRREMOVABLE_BUFF, "[攻撃時]"]
  ,[515, "魅了時強化/Charm Strengthening", "みりしき", "被ダメx0.3\n[@$]/Take 0.3x\n[@$]/魅了", TAG_TYPE.IRREMOVABLE_BUFF, "防御増加系"]
  ,[516, "確率強化解除/Latent Buff Removal", "かくりつきようかか", "", TAG_TYPE.IRREMOVABLE_DEBUFF, "[ダメージ時]"]
  ,[517, "ダメージ時HP激減/Major HP Decrease when attacked", "ためしHPけき", "", TAG_TYPE.IRREMOVABLE_DEBUFF, "[ダメージ時]"]
  ,[518, "非連撃時強化/Non-Combo Strengthening", "ひれ", "与ダメx3.0\n[非 @$]\n\n与ダメx1.5\n[@$]/Deal 3.0x\n[Not @$]\n\nDeal 1.5x\n[@$]/連撃", TAG_TYPE.IRREMOVABLE_BUFF, "攻撃増加系"]
  ,[519, "束縛時弱化/Bind Weakening", "そくしし", "与ダメ-999999\n[@$]/Deal -999999\n[@$]/束縛", TAG_TYPE.IRREMOVABLE_DEBUFF, "攻撃減少系"]
  ,[520, "確率強化単体解除/Latent Remove one buff", "かくりつきようかた", "", TAG_TYPE.IRREMOVABLE_DEBUFF, "[ダメージ時]"]
  ,[521, "継続ダメージの発生する状態/Status that inflict Continuous Damage", "けいのは", "", TAG_TYPE.STATUS_GROUP, "", "告死/凍結/毒/無窮/猛毒/火傷/烙印"]
  ,[522, "確率弱体単体解除/Latent Remove one debuff", "かくりつしや", "", TAG_TYPE.IRREMOVABLE_BUFF, "[弱体後]"]
  ,[523, "クリティカル耐性/Critical Resistance", "くりたい", "", TAG_TYPE.BUFF, "状態耐性系", , [TAG_FLAG_NUM.NULLIFY, "クリティカル"]]
  ,[524, "祝福時強化[ノブミチ]/Blessing Strengthening[Nobumichi]", "しゆくしき の", "被ダメx0.3\n[@$]/Take 0.3x\n[@$]/祝福", TAG_TYPE.IRREMOVABLE_BUFF, "祝福時強化/防御増加系"]
  ,[525, "魅了時弱化[アムブスキアス]/Charm Weakening[Amduscias]", "みりしし あむ", "被ダメx1.4\n[@$]/Take 1.4x\n[@$]/魅了", TAG_TYPE.IRREMOVABLE_DEBUFF, "魅了時弱化/防御減少系"]
  ,[526, "注目時回復/Heal when Taunt", "ちゆしか", "HP回復600\n[@$]/Restore HP 600\n[@$]/注目", TAG_TYPE.IRREMOVABLE_BUFF, "HP回復系"]
  ,[527, "注目時強化[アムブスキアス]/Taunt Strengthening[Amduscias]", "ちゆしき あむ", "与ダメx4.0\n[@$]/Deal 4.0x\n[@$]/注目", TAG_TYPE.IRREMOVABLE_BUFF, "注目時強化/攻撃増加系"]
  ,[528, "全域弱点/All Weakness", "せんいし", "", TAG_TYPE.IRREMOVABLE_DEBUFF, "武器種弱点系/防御減少系", , [TAG_FLAG_NUM.BONUS_D, "", "武器種弱点[2.0]"]]
  ,[529, "対ダメージ敵HP減少/Counter: HP reduction", "たいためてきHPけ", "", TAG_TYPE.IRREMOVABLE_BUFF, "[対ダメージ]"]
  ,[530, "不動時強化[グランガチ]/Immobility Strengthening[Gurangatch]", "ふとしき く", "被ダメx0.5\n[@$]/Take 0.5x\n[@$]/不動", TAG_TYPE.IRREMOVABLE_BUFF, "不動時強化/防御増加系"]
  ,[531, "憑依時強化/Possession Strengthening", "ひよしき", "", TAG_TYPE.IRREMOVABLE_BUFF]
  ,[532, "頑強時強化/Tenacity Strengthening", "かんしき", "", TAG_TYPE.IRREMOVABLE_BUFF]
  ,[533, "憑依時強化[ユーマ]/Possession Strengthening[Yuma]", "ひよしき ゆ", "被ダメx0.1\n[@$]/Take 0.1x\n[@$]/憑依", TAG_TYPE.IRREMOVABLE_BUFF, "憑依時強化/防御増加系"]
  ,[534, "頑強時強化[ユーマ]/Tenacity Strengthening[Yuma]", "かんしき ゆ", "与ダメx3.0\n[@$]/Deal 3.0x\n[@$]/頑強", TAG_TYPE.IRREMOVABLE_BUFF, "頑強時強化/攻撃増加系"]
  ,[535, "幻惑耐性[解除不可]", "", "", TAG_TYPE.IRREMOVABLE_BUFF, "幻惑耐性/状態耐性系", , [TAG_FLAG_NUM.NULLIFY, "幻惑"]]
  ,[536, "猛毒時強化/Fatal Poison Strengthening", "もうしき", "与ダメx2.0\n[@$]/Deal 2.0x\n[@$]/猛毒", TAG_TYPE.IRREMOVABLE_BUFF, "攻撃増加系"]
  ,[537, "加速時強化[R-19#1]/Acceleration Strengthening[R-19]", "かそしき R1", "与ダメx2.0\n[@$]/Deal 2.0x\n[@$]/加速", TAG_TYPE.IRREMOVABLE_BUFF, "加速時強化/攻撃増加系"]
  ,[538, "加速時強化[R-19#2]/Acceleration Strengthening[R-19]", "かそしき R2", "CP増加\n[@$]/Increase CP\n[@$]/加速", TAG_TYPE.IRREMOVABLE_BUFF, "加速時強化/CP増加系"]
  ,[539, "ダメージ時守護/Protection when damaged", "ためししゆ", "", TAG_TYPE.IRREMOVABLE_BUFF, "[ダメージ時]"]
  ,[540, "暗闇耐性時強化/Darkness Resistance Strengthening", "くらたいしき", "発動率+10%\n[@$]/Skill Rate +10%\n[@$]/暗闇耐性", TAG_TYPE.IRREMOVABLE_BUFF, "発動率増加系"]
  ,[541, "暗闇耐性/Darkness Resistance", "くらたい", "", TAG_TYPE.BUFF, "状態耐性系", , [TAG_FLAG_NUM.NULLIFY, "暗闇"]]
  ,[542, "非弱体時強化/Non-Debuff Strengthening", "ひししき", "", TAG_TYPE.IRREMOVABLE_BUFF]
  ,[543, "非弱体時強化[ブレイク]/Non-Debuff Strengthening[Breke]", "ひししき ふ", "与ダメx1.5\n[非 @$]/Deal 1.5x\n[Not @$]/弱体(解除可)", TAG_TYPE.IRREMOVABLE_BUFF, "非弱体時強化/攻撃増加系"]
  ,[544, "劫火時強化/Conflagration Strengthening", "こうかしき", "", TAG_TYPE.IRREMOVABLE_BUFF]
  ,[545, "劫火時強化#2/Conflagration Strengthening", "こうかしき 2", "与ダメx2.0\n[@$]/Deal 2.0x\n[@$]/劫火", TAG_TYPE.IRREMOVABLE_BUFF, "劫火時強化/攻撃増加系"]
  ,[546, "仰天のマシンボディ", "きよ", "", TAG_TYPE.SKILL]
  ,[547, "雷光の装填者/Lightning Loader", "らいこうの", "", TAG_TYPE.SKILL]
  ,[548, "生存のマシンボディ/Living Mechaman", "せい", "", TAG_TYPE.SKILL]
  ,[549, "集中時強化[実験AR]/Concentration Strengthening[Experiment AR]", "しゆうしき Aし", "与ダメx2.0\n[@$]/Deal 2.0x\n[@$]/集中", TAG_TYPE.IRREMOVABLE_BUFF, "集中時強化/攻撃増加系"]
  ,[550, "妨害時強化/Obstruct Strengthening", "ほうかしき", "発動率+20%\n[@$]/Skill Rate +20%\n[@$]/妨害", TAG_TYPE.IRREMOVABLE_BUFF, "発動率増加系"]
  ,[551, "魅了耐性[解除不可]", "", "", TAG_TYPE.IRREMOVABLE_BUFF, "魅了耐性/状態耐性系", , [TAG_FLAG_NUM.NULLIFY, "魅了"]]
  ,[552, "火傷特攻[アフラ・マズダ]", "", "", TAG_TYPE.IRREMOVABLE_BUFF, "火傷特攻/特攻付与系/攻撃増加系", , [TAG_FLAG_NUM.BONUS_A, "火傷", "特攻[1.5]"]]
  ,[553, "火傷大特攻/Big Advantage vs Burn", "やけたいと", "", TAG_TYPE.IRREMOVABLE_BUFF, "特攻付与系/攻撃増加系", , [TAG_FLAG_NUM.BONUS_A, "火傷", "特攻[2.0]"]]
  ,[554, "劫火大特攻/Big Advantage vs Conflagration", "こうかたいと", "", TAG_TYPE.IRREMOVABLE_BUFF, "特攻付与系/攻撃増加系", , [TAG_FLAG_NUM.BONUS_A, "劫火", "特攻[2.0]"]]
  ,[555, "幻惑特攻[タンガロア∞]", "", "", TAG_TYPE.IRREMOVABLE_BUFF, "幻惑特攻/特攻付与系/攻撃増加系", , [TAG_FLAG_NUM.BONUS_A, "幻惑", "特攻[1.5]"]]
  ,[556, "烙印特攻[タンガロア∞]", "", "", TAG_TYPE.IRREMOVABLE_BUFF, "烙印特攻/特攻付与系/攻撃増加系", , [TAG_FLAG_NUM.BONUS_A, "烙印", "特攻[1.5]"]]
  ,[557, "妨害特攻/Advantage vs Obstruct", "ほうかと", "", TAG_TYPE.IRREMOVABLE_BUFF, "特攻付与系/攻撃増加系", , [TAG_FLAG_NUM.BONUS_A, "妨害", "特攻[1.5]"]]
  ,[558, "幻惑時弱化/Dazzle Weakening", "けんしし", "被ダメx3.0\n[@$]/Take 3.0x\n[@$]/幻惑", TAG_TYPE.IRREMOVABLE_DEBUFF, "防御減少系"]
  ,[559, "全域特防/Reduce All damage", "せんいと", "", TAG_TYPE.IRREMOVABLE_BUFF, "特防付与系/防御増加系"]
  ,[560, "魅了大特攻[ジブリール]", "", "", TAG_TYPE.IRREMOVABLE_BUFF, "魅了大特攻/特攻付与系/攻撃増加系", , [TAG_FLAG_NUM.BONUS_A, "魅了", "特攻[2.0]"]]
  ,[561, "祈り時強化/Prayer Strengthening", "いのしき", "", TAG_TYPE.IRREMOVABLE_BUFF]
  ,[562, "CS変更：突撃/Change CS: Thrust", "CSへ2", "", TAG_TYPE.BUFF, "CS変更"]
  ,[563, "祈り時強化[ジェイコフ]/Prayer Strengthening[Jacob]", "いのしき し", "与ダメx2.0\n[@$]/Deal 2.0x\n[@$]/祈り", TAG_TYPE.IRREMOVABLE_BUFF, "祈り時強化/攻撃増加系"]
  ,[564, "打撃特防/Reduce Blow damage", "たけきとく", "", TAG_TYPE.IRREMOVABLE_BUFF, "特防付与系/防御増加系", , [TAG_FLAG_NUM.BONUS_D, "打撃", "特防[0.5]"]]
  ,[565, "混乱時弱化/Confusion Weakening", "こんらしし", "被ダメx1.5\n[@$]/Take 1.5x\n[@$]/混乱", TAG_TYPE.IRREMOVABLE_DEBUFF, "防御減少系"]
  ,[566, "注目時強化[アールプ☆4]/Taunt Strengthening[Alp ☆4]", "ちゆしき ああ2", "被ダメx0.75\n[@$]/Take 0.75x\n[@$]/注目", TAG_TYPE.IRREMOVABLE_BUFF, "注目時強化/防御増加系"]
  ,[567, "翼持つアイドル/Winged Idol", "つはさもつあ", "", TAG_TYPE.SKILL]
  ,[568, "鬼子連れのヤンキー/Punk with Wild Child", "おに", "", TAG_TYPE.SKILL]
  ,[569, "終わりの巨人/Giant of the End", "おわ", "", TAG_TYPE.SKILL]
  ,[570, "終焉のロプト/Loptr of the End", "しゆうえ", "", TAG_TYPE.SKILL]
  ,[571, "巨人系スキル", "", "", TAG_TYPE.SKIP, "", "巨人なる者/巨人に戴かれる者/終わりの巨人/終焉のロプト"]
  ,[572, "熱情時強化/Ardor Strengthening", "ねつしき", "", TAG_TYPE.IRREMOVABLE_BUFF]
  ,[573, "熱情時強化[AR]/Ardor Strengthening[AR]", "ねつしき A", "与ダメx1.5\n[@$]/Deal 1.5x\n[@$]/熱情", TAG_TYPE.IRREMOVABLE_BUFF, "熱情時強化/攻撃増加系"]
  ,[574, "集中時強化/Concentration Strengthening", "しゆうしき", "", TAG_TYPE.IRREMOVABLE_BUFF]
  ,[575, "集中時強化[パジャマAR]/Concentration Strengthening[Pajama AR]", "しゆうしき Aは", "被ダメx0.75\n[@$]/Take 0.75x\n[@$]/集中", TAG_TYPE.IRREMOVABLE_BUFF, "集中時強化/防御増加系"]
  ,[576, "爆発スイカ/Exploding Watermelon", "はく", "確率で距離3マス内に$&$\n(発動時解除)/Chanse of $ and $ on self and a diamond radius of 3 squares\n(remove upon activation)/崩し,脱力", TAG_TYPE.IRREMOVABLE_DEBUFF, "[ダメージ時]"]
  ,[577, "特攻付与系/Bestow Attack Advantage", "と1", "", TAG_TYPE.CATEGORY]
  ,[578, "特防付与系/Bestow Defense Advantage", "と2", "", TAG_TYPE.CATEGORY]
  ,[579, "脱力特攻/Advantage vs Drain", "たつと", "", TAG_TYPE.IRREMOVABLE_BUFF, "特攻付与系/攻撃増加系", , [TAG_FLAG_NUM.BONUS_A, "脱力", "特攻[1.5]"]]
  ,[580, "暗闇特攻[アステリオス]", "", "", TAG_TYPE.IRREMOVABLE_BUFF, "暗闇特攻/特攻付与系/攻撃増加系", , [TAG_FLAG_NUM.BONUS_A, "暗闇", "特攻[1.5]"]]
  ,[581, "祝福時強化[アステリオス]/Blessing Strengthening[Asterius]", "しゆくしき あ", "発動率+30%\n[@$]/Skill Rate +30%\n[@$]/祝福", TAG_TYPE.IRREMOVABLE_BUFF, "祝福時強化/発動率増加系"]
  ,[582, "クリティカル++耐性/Critical++ Resistance", "くり++たい", "", TAG_TYPE.IRREMOVABLE_BUFF, "状態耐性系", , [TAG_FLAG_NUM.NULLIFY, "クリティカル++"]]
  ,[583, "秘島に生きる怪物/Hidden Island Monster", "ひと", "", TAG_TYPE.SKILL]
  ,[584, "根性時強化[レイヴ]/Guts Strengthening[Leib]", "こんししき れ", "与ダメx2.0\n[@$]/Deal 2.0x\n[@$]/根性", TAG_TYPE.IRREMOVABLE_BUFF, "根性時強化/攻撃増加系"]
  ,[585, "告死時弱化/Countdown Weakening", "こくしし", "", TAG_TYPE.IRREMOVABLE_DEBUFF]
  ,[586, "告死時弱化[ブギーマン]/Countdown Weakening[Boogeyman]", "こくしし ふ", "与ダメx0.5\n[@$]/Deal 0.5x\n[@$]/告死", TAG_TYPE.IRREMOVABLE_DEBUFF, "告死時弱化/攻撃減少系"]
  ,[587, "幻惑時強化/Dazzle Strengthening", "けんしき", "与ダメx4.0\n[@$]/Deal 4.0x\n[@$]/幻惑", TAG_TYPE.IRREMOVABLE_BUFF, "攻撃増加系"]
  ,[588, "攻撃時味方HP回復", "こうけきしみかたHP", "", TAG_TYPE.IRREMOVABLE_BUFF, "[攻撃時]"]
  ,[589, "攻撃時味方CP増加", "こうけきしみかたCP", "", TAG_TYPE.IRREMOVABLE_BUFF, "[攻撃時]"]
  ,[590, "閃き時強化/Glint Strengthening", "ひらしき", "", TAG_TYPE.IRREMOVABLE_BUFF]
  ,[591, "閃き時強化[ヘカテー]/Glint Strengthening[Hecate]", "ひらしき へ", "被ダメx0.75\n[@$]/Take 0.75x\n[@$]/閃き", TAG_TYPE.IRREMOVABLE_BUFF, "閃き時強化/防御増加系"]
  ,[592, "退場時敵HP大回復", "たいしよてきHP", "", TAG_TYPE.IRREMOVABLE_BUFF, "[退場時]"]
  ,[593, "注目時強化[シパクトリ]/Taunt Strengthening[Cipactli]", "ちゆしき し", "被ダメx0.75\n[@$]/Take 0.75x\n[@$]/注目", TAG_TYPE.IRREMOVABLE_BUFF, "注目時強化/防御増加系"]
  ,[594, "激怒耐性/Rage Resistance", "けきたい", "", TAG_TYPE.IRREMOVABLE_BUFF, "状態耐性系", , [TAG_FLAG_NUM.NULLIFY, "激怒"]]
  ,[595, "祝福時強化[AR]/Blessing Strengthening[AR]", "しゆくしき A", "与ダメx2.0\n[@$]/Deal 2.0x\n[@$]/祝福", TAG_TYPE.IRREMOVABLE_BUFF, "祝福時強化/攻撃増加系"]
  ,[596, "奮起時強化/Arousal Strengthening", "ふんしき", "与ダメx1.5\n[@$]/Deal 1.5x\n[@$]/奮起", TAG_TYPE.IRREMOVABLE_BUFF, "攻撃増加系"]
  ,[597, "閃き時強化[AR]/Glint Strengthening[AR]", "ひらしき A", "発動率+5%\n[@$]/Skill Rate +5%\n[@$]/閃き", TAG_TYPE.IRREMOVABLE_BUFF, "閃き時強化/発動率増加系"]
  ,[598, "非弱体時強化[アルジャーノン]/Non-Debuff Strengthening[Algernon]", "ひししき ある", "与ダメx1.5\n[非 @$]/Deal 1.5x\n[Not @$]/弱体(解除可)", TAG_TYPE.IRREMOVABLE_BUFF, "非弱体時強化/攻撃増加系"]
  ,[599, "攻撃力増加[オンブレティグレ]", "", "与ダメx1.2 → x3.0/Deal 1.2x → 3.0x", TAG_TYPE.IRREMOVABLE_BUFF, "攻撃力増加/攻撃増加系"]
  ,[600, "根性時強化[ヤマサチヒコ]/Guts Strengthening[Yamasachihiko]", "こんししき や", "被ダメx0.7\n[@$]/Take 0.7x\n[@$]/根性", TAG_TYPE.IRREMOVABLE_BUFF, "根性時強化/防御増加系"]
  ,[601, "攻撃時回避/Evasion When Attacking", "こうけきしかい", "", TAG_TYPE.IRREMOVABLE_BUFF, "[攻撃時]"]
  ,[602, "ターン開始時CPに応じて攻防低下/ATK\nDEF Down Based on CP at Turn Start", "たあCP", "", TAG_TYPE.IRREMOVABLE_DEBUFF, "[ターン開始時]"]
  ,[603, "攻防低下/ATK\nDEF Down", "こうほ", "与ダメx0.75 → x0.5\n被ダメx1.5 → x3.0/Deal 0.75x → 0.5x\nTake 1.5x → 3.0x", TAG_TYPE.IRREMOVABLE_DEBUFF, "攻撃減少系/防御減少系"]
  ,[604, "攻撃力増加[ベヒモス]", "", "与ダメx2.0 → x4.0/Deal 2.0x → 4.0x", TAG_TYPE.IRREMOVABLE_BUFF, "攻撃力増加/攻撃増加系"]
  ,[605, "聖油時強化[アルスラーン]/Unction Strengthening[Arsalan]", "せいしき あ", "CP増加\n[@$]/Increase CP\n[@$]/聖油", TAG_TYPE.IRREMOVABLE_BUFF, "聖油時強化/CP増加系"]
  ,[606, "CPが減少する弱体", "CPけんしや", "", TAG_TYPE.STATUS_GROUP, "", "恐怖/脱力"]
  ,[607, "攻撃不可にされる状態/Status that prevent attacking", "こうふか", "", TAG_TYPE.STATUS_GROUP, "", "憑依/魅了"]
  ,[608, "武器種変更[弱体]/Weapon Change[Debuff]", "", "", TAG_TYPE.DEBUFF, "武器種変更"]
  ,[609, "ダメージ時HP減少/Reduce HP on Damage", "ためしHPけん", "", TAG_TYPE.IRREMOVABLE_DEBUFF, "[ダメージ時]"]
  ,[610, "火傷時強化[ハヌマン]/Burn Strengthening[Hanuman]", "やけしき は", "与ダメx3.0\n[@$]/Deal 3.0x\n[@$]/火傷", TAG_TYPE.IRREMOVABLE_BUFF, "火傷時強化/攻撃増加系"]
  ,[611, "幻惑特攻/Advantage vs Dazzle", "けんと", "", TAG_TYPE.IRREMOVABLE_BUFF, "特攻付与系/攻撃増加系"]
  ,[612, "幻惑特攻[セト]", "", "", TAG_TYPE.IRREMOVABLE_BUFF, "幻惑特攻/特攻付与系/攻撃増加系", , [TAG_FLAG_NUM.BONUS_A, "幻惑", "特攻[1.5]"]]
  ,[613, "係留時強化/Anchor Strengthening", "けいりしき", "", TAG_TYPE.IRREMOVABLE_BUFF]
  ,[614, "係留時強化[セト]/Anchor Strengthening[Seth]", "けいりしき せ", "被ダメx0.5\n[@$]/Take 0.5x\n[@$]/係留", TAG_TYPE.IRREMOVABLE_BUFF, "係留時強化/防御増加系"]
  ,[615, "毒時強化[AR]/Poison Strengthening[AR]", "とくしき A", "与ダメx1.5\n[@$]/Deal 1.5x\n[@$]/毒", TAG_TYPE.IRREMOVABLE_BUFF, "毒時強化/攻撃増加系"]
  ,[616, "幻惑特攻[AR]", "", "", TAG_TYPE.IRREMOVABLE_BUFF, "幻惑特攻/特攻付与系/攻撃増加系", , [TAG_FLAG_NUM.BONUS_A, "幻惑", "特攻[1.5]"]]
  ,[617, "巨人に戴かれる者/Crowned by Giants", "きよしんに", "", TAG_TYPE.SKILL]
  ,[618, "獣道の渡世人/Beast Path Gangster", "けものみ", "", TAG_TYPE.SKILL]
  ,[619, "弱体時強化[AR]/Debuff Strengthening[AR]", "しやくたいしき A", "与ダメx1.5\n[@$]/Deal 1.5x\n[@$]/弱体(解除可)", TAG_TYPE.IRREMOVABLE_BUFF, "弱体時強化/攻撃増加系"]
  ,[620, "スキル封印耐性/Skill Lock Resistance", "すきるふたい", "", TAG_TYPE.BUFF, "状態耐性系", , [TAG_FLAG_NUM.NULLIFY, "スキル封印"]]
  ,[621, "浄化時強化/Purification Strengthening", "しようかしき", "", TAG_TYPE.IRREMOVABLE_BUFF]
  ,[622, "浄化時強化[AR]/Purification Strengthening[AR]", "しようかしき A", "発動率+10%\n[@$]/Skill Rate +10%\n[@$]/浄化", TAG_TYPE.IRREMOVABLE_BUFF, "浄化時強化/発動率増加系"]
  ,[623, "根性時強化[ハプニングAR]/Guts Strengthening[ハプニングAR]", "こんししき Aは", "与ダメx1.5\n[@$]/Deal 1.5x\n[@$]/根性", TAG_TYPE.IRREMOVABLE_BUFF, "根性時強化/攻撃増加系"]
  ,[624, "滋養時強化[冥境AR]/Nourishment Strengthening[冥境AR]", "しようしき Aめ", "与ダメx1.5\n[@$]/Deal 1.5x\n[@$]/滋養", TAG_TYPE.IRREMOVABLE_BUFF, "滋養時強化/攻撃増加系"]
  ,[625, "強化転写(単)/Transfer buff (single)", "きようかて1", "", TAG_TYPE.ONE_SHOT, "強化転写/複製・貼付系"]
  ,[626, "火傷特攻/Advantage vs Burn", "やけと", "", TAG_TYPE.IRREMOVABLE_BUFF, "特攻付与系/攻撃増加系"]
  ,[627, "火傷特攻[ファヴニル]", "", "", TAG_TYPE.IRREMOVABLE_BUFF, "火傷特攻/特攻付与系/攻撃増加系", , [TAG_FLAG_NUM.BONUS_A, "火傷", "特攻[1.5]"]]
  ,[628, "ギルド新加入認印獲得率アップ/Increase drop rate of Guild Membership Seal", "きる", "", TAG_TYPE.REWARD]
  ,[629, "守護時強化/Protection Strengthening", "しゆこしき", "", TAG_TYPE.IRREMOVABLE_BUFF]
  ,[630, "聖油時強化/Unction Strengthening", "せいしき", "", TAG_TYPE.IRREMOVABLE_BUFF]
  ,[631, "頑強時強化[ティンダロス]/Tenacity Strengthening[Tindalos]", "かんしき てい", "与ダメx2.0\n[@$]/Deal 2.0x\n[@$]/頑強", TAG_TYPE.IRREMOVABLE_BUFF, "頑強時強化/攻撃増加系"]
  ,[632, "守護時強化[ティンダロス]/Protection Strengthening[Tindalos]", "しゆこしき て", "与ダメx2.0\n[@$]/Deal 2.0x\n[@$]/守護", TAG_TYPE.IRREMOVABLE_BUFF, "守護時強化/攻撃増加系"]
  ,[633, "聖油時強化[ティンダロス]/Unction Strengthening[Tindalos]", "せいしき て", "与ダメx2.0\n[@$]/Deal 2.0x\n[@$]/聖油", TAG_TYPE.IRREMOVABLE_BUFF, "聖油時強化/攻撃増加系"]
  ,[634, "非強化時弱化/Non-Buff Weakening", "ひきようしし", "", TAG_TYPE.IRREMOVABLE_DEBUFF]
  ,[635, "非強化時弱化[タローマティ]/Non-Buff Weakening[Taromaiti]", "ひきようしし た", "被ダメx1.5\n[非 @$]/Take 1.5x\n[Not @$]/強化(解除可)", TAG_TYPE.IRREMOVABLE_DEBUFF, "非強化時弱化/防御減少系"]
  ,[636, "空振り時HP激減/Major HP Decrease on Missed Attack", "からHPけき", "", TAG_TYPE.IRREMOVABLE_DEBUFF, "[空振り時]"]
  ,[637, "退場時崩し付与/Break on Defeat", "たいしよくす", "", TAG_TYPE.IRREMOVABLE_DEBUFF, "[退場時]"]
  ,[638, "被ダメージ増加/Increased Incoming Damage", "ひため", "", TAG_TYPE.IRREMOVABLE_DEBUFF, "防御減少系"]
  ,[639, "被ダメージ増加[ナタ]", "", "被ダメx1.3 → x2.5/Take 1.3x → 2.5x", TAG_TYPE.IRREMOVABLE_DEBUFF, "被ダメージ増加/防御減少系"]
  ,[640, "弱点特攻/Advantage vs Weakness", "しやくてと", "", TAG_TYPE.IRREMOVABLE_BUFF, "特攻付与系/攻撃増加系"]
  ,[641, "弱点特攻[タケマル]", "", "", TAG_TYPE.IRREMOVABLE_BUFF, "弱点特攻/特攻付与系/攻撃増加系", , [TAG_FLAG_NUM.BONUS_A, "弱点", "特攻[1.5]"]]
  ,[642, "祝福時強化[シトリー]/Blessing Strengthening[Sitri]", "しゆくしき しと", "発動率+10%\n[@$]/Skill Rate +10%\n[@$]/祝福", TAG_TYPE.IRREMOVABLE_BUFF, "祝福時強化/発動率増加系"]
  ,[643, "祝福時強化[マサシ]/Blessing Strengthening[Masashi]", "しゆくしき ま", "与ダメx1.5\n[@$]/Deal 1.5x\n[@$]/祝福", TAG_TYPE.IRREMOVABLE_BUFF, "祝福時強化/攻撃増加系"]
  ,[644, "強化後HP激減/Major HP Decrease When Buffed", "きようかこHP", "", TAG_TYPE.IRREMOVABLE_DEBUFF, "[強化後]"]
  ,[645, "ブラックボックス/Black Box", "ふら", "味方全体に$&$&$\n(発動時解除)/$, $, and $ on all allies\n(remove upon activation)/毒,混乱,暗闇", TAG_TYPE.IRREMOVABLE_DEBUFF, "[ダメージ時]"]
  ,[646, "毒大特攻/Big Advantage vs Poison", "とくたいと", "", TAG_TYPE.IRREMOVABLE_BUFF, "特攻付与系/攻撃増加系", , [TAG_FLAG_NUM.BONUS_A, "毒", "特攻[2.0]"]]
  ,[647, "混乱耐性/Confusion Resistance", "こんらたい", "", TAG_TYPE.BUFF, "状態耐性系", , [TAG_FLAG_NUM.NULLIFY, "混乱"]]
  ,[648, "閃き大特攻/Big Advantage vs Glint", "ひらたいと", "", TAG_TYPE.IRREMOVABLE_BUFF, "特攻付与系/攻撃増加系", , [TAG_FLAG_NUM.BONUS_A, "閃き", "特攻[2.0]"]]
  ,[649, "非弱体時強化[アマノジャク]/Non-Debuff Strengthening[Amanojaku]", "ひししき あま", "CP増加\n[非 @$]/Increase CP\n[Not @$]/弱体(解除可)", TAG_TYPE.IRREMOVABLE_BUFF, "非弱体時強化/CP増加系"]
  ,[650, "強化反転時強化/Buff Reversal Strengthening", "きようかはしき", "与ダメx12.0\n被ダメx0.01\n[@$]/Deal 12.0x\nTake 0.01x\n[@$]/強化反転", TAG_TYPE.IRREMOVABLE_BUFF, "攻撃増加系/防御増加系"]
  ,[651, "外壁に貫通/Ignore Outer Wall", "かんかいへ", "1.33", TAG_TYPE.A_BONUS, "特攻/貫通"]
  ,[652, "ダメージ時隣接1マスに毒/Poison on adjacent squares when attacked", "ためしりんとく", "", TAG_TYPE.IRREMOVABLE_DEBUFF, "[ダメージ時]"]
  ,[653, "ダメージ時隣接1マスに脱力/Drain on adjacent squares when attacked", "ためしりんたつ", "", TAG_TYPE.IRREMOVABLE_DEBUFF, "[ダメージ時]"]
  ,[654, "弱体後敵にCP増加/CP Increase on enemy post-debuff", "しやくたいこてきCP", "", TAG_TYPE.IRREMOVABLE_DEBUFF, "[弱体後]"]
  ,[655, "弱体後確率クリティカル付与/Chance of Bestow Crit post-debuff", "しやくたいこかくくり", "", TAG_TYPE.IRREMOVABLE_BUFF, "[弱体後]"]
  ,[656, "弱体後確率極限付与/Chance of Bestow Limit post-debuff", "しやくたいこかくきよく", "", TAG_TYPE.IRREMOVABLE_BUFF, "[弱体後]"]
  ,[657, "弱体後HP減少/HP reduction post-debuff", "しやくたいこHPけん", "", TAG_TYPE.IRREMOVABLE_DEBUFF, "[弱体後]"]
  ,[658, "弱体後確率強化解除/Chance of buff removal post-debuff", "しやくたいこかくきよう", "", TAG_TYPE.IRREMOVABLE_DEBUFF, "[弱体後]"]
  ,[659, "奮起時弱化/Arousal Weakening", "ふんしし", "被ダメx2.0\n[@$]/Take 2.0x\n[@$]/奮起", TAG_TYPE.IRREMOVABLE_DEBUFF, "防御減少系"]
  ,[660, "マヒ時弱化/Paralysis Weakening", "まひしし", "", TAG_TYPE.IRREMOVABLE_DEBUFF]
  ,[661, "マヒ時弱化[ペルーン]/Paralysis Weakening[Perun]", "まひしし へ", "被ダメx2.0\n[@$]/Take 2.0x\n[@$]/マヒ", TAG_TYPE.IRREMOVABLE_DEBUFF, "マヒ時弱化/防御減少系"]
  ,[662, "対ダメージ強化状態転写/Transfer buffs when attacked", "たいためきよ", "", TAG_TYPE.IRREMOVABLE_DEBUFF, "[対ダメージ]"]
  ,[663, "吹き飛ばし(ランダム)/Blast (random)", "ふきと4", "", TAG_TYPE.ONE_SHOT, "強制移動系"]
  ,[664, "聖油時強化[バロン]/Unction Strengthening[Barong]", "せいしき は", "与ダメx2.0\n[@$]/Deal 2.0x\n[@$]/聖油", TAG_TYPE.IRREMOVABLE_BUFF, "聖油時強化/攻撃増加系"]
  ,[665, "非移動後敵にHP回復/Non-Movement Restore HP on enemy", "ひいとうて", "", TAG_TYPE.IRREMOVABLE_DEBUFF, "[非移動後]"]
  ,[666, "虚飾/Flamboyance", "きよしよ", "効果なし/No Effect", TAG_TYPE.DEBUFF]
  ,[667, "移動フェーズ終了後熱情付与/Bestow Ardor at end of movement phase", "いとうふねつ", "", TAG_TYPE.IRREMOVABLE_BUFF, "[移動フェーズ終了後]"]
  ,[668, "弱体後CP増加/Increase CP when debuffed", "しやくたいこCP", "", TAG_TYPE.IRREMOVABLE_BUFF, "[弱体後]"]
  ,[669, "移動不能になる状態(解除可能)", "いと2", "", TAG_TYPE.STATUS_GROUP, "", "威圧/恐怖/崩し/不動/マヒ"]
  ,[670, "防御力が上昇する状態(解除可能)/Status that raise defense (removable)", "ほう2", "", TAG_TYPE.STATUS_GROUP, "", "回避/頑強/金剛/守護/聖油/毒反転/防御強化"]
  ,[671, "非強化時弱化[ウランバートル]/Non-Buff Weakening[Ulaanbaatar]", "ひきようしし う", "被ダメx1.5\n[非 @$]/Take 1.5x\n[Not @$]/強化(解除可)", TAG_TYPE.IRREMOVABLE_DEBUFF, "非強化時弱化/防御減少系"]
  ,[672, "不動時強化/Immobility Strengthening", "ふとしき", "", TAG_TYPE.IRREMOVABLE_BUFF]
  ,[673, "意気時強化/Spirit Strengthening", "いきしき", "", TAG_TYPE.IRREMOVABLE_BUFF]
  ,[674, "不動時強化[ゴウリョウ]/Immobility Strengthening[Ganglie]", "ふとしき こ", "与ダメx2.0\n[@$]/Deal 2.0x\n[@$]/不動", TAG_TYPE.IRREMOVABLE_BUFF, "不動時強化/攻撃増加系"]
  ,[675, "意気時強化[ゴウリョウ]/Spirit Strengthening[Ganglie]", "いきしき こ", "与ダメx1.5\n[@$]/Deal 1.5x\n[@$]/意気", TAG_TYPE.IRREMOVABLE_BUFF, "意気時強化/攻撃増加系"]
  ,[676, "恐怖特攻/Advantage vs Fear", "きようふと", "", TAG_TYPE.IRREMOVABLE_BUFF, "特攻付与系/攻撃増加系", , [TAG_FLAG_NUM.BONUS_A, "恐怖", "特攻[1.5]"]]
  ,[677, "束縛耐性/Bind Resistance", "そくたい", "", TAG_TYPE.BUFF, "状態耐性系", , [TAG_FLAG_NUM.NULLIFY, "束縛"]]
  ,[678, "頑強時強化[テュアリング]/Tenacity Strengthening[Tuaring]", "かんしき てゆ", "発動率+10%\n[@$]/Skill Rate +10%\n[@$]/頑強", TAG_TYPE.IRREMOVABLE_BUFF, "頑強時強化/発動率増加系"]
  ,[679, "移動後強化転写/Post-Move Transfer Buff", "いとうこきよう", "", TAG_TYPE.IRREMOVABLE_BUFF, "[移動後]"]
  ,[680, "魅了大特攻/Big Advantage vs Charm", "みりたいと", "", TAG_TYPE.IRREMOVABLE_BUFF, "特攻付与系/攻撃増加系"]
  ,[681, "魅了大特攻[テュアリング]", "", "", TAG_TYPE.IRREMOVABLE_BUFF, "魅了大特攻/特攻付与系/攻撃増加系", , [TAG_FLAG_NUM.BONUS_A, "魅了", "特攻[2.0]"]]
  ,[682, "威圧時弱化/Oppression Weakening", "いあしし", "", TAG_TYPE.IRREMOVABLE_DEBUFF]
  ,[683, "威圧時弱化[タイシャクテン]/Oppression Weakening[Taishakuten]", "いあしし た", "与ダメx0.4\n[@$]/Deal 0.4x\n[@$]/威圧", TAG_TYPE.IRREMOVABLE_DEBUFF, "威圧時弱化/攻撃減少系"]
  ,[684, "注目時強化[タイシャクテン]/Taunt Strengthening[Taishakuten]", "ちゆしき たい", "与ダメx1.5\n[@$]/Deal 1.5x\n[@$]/注目", TAG_TYPE.IRREMOVABLE_BUFF, "注目時強化/攻撃増加系"]
  ,[685, "注目時弱化[クランプス]/Taunt Weakening[Krampus]", "ちゆしし く", "被ダメx1.5\n[@$]/Take 1.5x\n[@$]/注目", TAG_TYPE.IRREMOVABLE_DEBUFF, "注目時弱化/防御減少系"]
  ,[686, "闘志時強化/Vigor Strengthening", "とうししき", "", TAG_TYPE.IRREMOVABLE_BUFF]
  ,[687, "闘志時強化[クランプス]/Vigor Strengthening[Krampus]", "とうししき く", "CP増加\n[@$]/Increase CP\n[@$]/闘志", TAG_TYPE.IRREMOVABLE_BUFF, "闘志時強化/CP増加系"]
  ,[688, "閃き時強化[マサノリ]/Glint Strengthening[Masanori]", "ひらしき ま", "与ダメx2.0\n[@$]/Deal 2.0x\n[@$]/閃き", TAG_TYPE.IRREMOVABLE_BUFF, "閃き時強化/攻撃増加系"]
  ,[689, "射撃弱点/Shot Weakness", "しやけし", "", TAG_TYPE.IRREMOVABLE_DEBUFF, "武器種弱点系/防御減少系"]
  ,[690, "射撃弱点[エイタ]", "", "", TAG_TYPE.IRREMOVABLE_DEBUFF, "射撃弱点/武器種弱点系/防御減少系", , [TAG_FLAG_NUM.BONUS_D, "", "武器種弱点[2.5]"]]
  ,[691, "射撃弱点[マサノリ]", "", "", TAG_TYPE.IRREMOVABLE_DEBUFF, "射撃弱点/武器種弱点系/防御減少系", , [TAG_FLAG_NUM.BONUS_D, "", "武器種弱点[2.0]"]]
  ,[692, "狙撃弱点/Snipe Weakness", "そけし", "", TAG_TYPE.IRREMOVABLE_DEBUFF, "武器種弱点系/防御減少系", , [TAG_FLAG_NUM.BONUS_D, "", "武器種弱点[2.0]"]]
  ,[693, "与ダメージ追加系/Additional Damage Dealt", "つい1", "", TAG_TYPE.CATEGORY]
  ,[694, "被ダメージ追加系/Additional Damage Taken", "つい2", "", TAG_TYPE.CATEGORY]
  ,[695, "暗闇特攻/Advantage vs Darkness", "くらと", "", TAG_TYPE.IRREMOVABLE_BUFF, "特攻付与系/攻撃増加系"]
  ,[696, "暗闇特攻[ビッグフット]", "", "", TAG_TYPE.IRREMOVABLE_BUFF, "暗闇特攻/特攻付与系/攻撃増加系", , [TAG_FLAG_NUM.BONUS_A, "暗闇", "特攻[1.5]"]]
  ,[697, "根性時強化[ザオウ]/Guts Strengthening[Zao]", "こんししき さ", "CP増加\n[@$]/Increase CP\n[@$]/根性", TAG_TYPE.IRREMOVABLE_BUFF, "根性時強化/CP増加系"]
  ,[698, "火傷時強化[クマノゴンゲン]/Burn Strengthening[Kumano Gongen]", "やけしき く", "与ダメx2.0\n[@$]/Deal 2.0x\n[@$]/火傷", TAG_TYPE.IRREMOVABLE_BUFF, "火傷時強化/攻撃増加系"]
  ,[699, "火傷特攻[クマノゴンゲン]", "", "", TAG_TYPE.IRREMOVABLE_BUFF, "火傷特攻/特攻付与系/攻撃増加系", , [TAG_FLAG_NUM.BONUS_A, "火傷", "特攻[1.5]"]]
  ,[700, "対ダメージ烙印/Stigma when attacked", "たいためらく", "", TAG_TYPE.IRREMOVABLE_BUFF, "[対ダメージ]"]
  ,[701, "防御力微増/Minor DEF Increase", "ほうきよりひ", "被ダメx0.8\n[重複可x3]/Take 0.8x\n[Stackable 3x]", TAG_TYPE.IRREMOVABLE_BUFF, "防御増加系"]
  ,[702, "シンギュラリティ", "しん", "(CPが100の時)\n自身に$&$/(when CP is 100)\n$ and $ on self/HP減少,CS変更：無", TAG_TYPE.IRREMOVABLE_DEBUFF, "[ターン開始時]"]
  ,[703, "加速時強化[カレン]/Acceleration Strengthening[Curren]", "かそしき かれ", "被ダメx0.6\n[@$]/Take 0.6x\n[@$]/加速", TAG_TYPE.IRREMOVABLE_BUFF, "加速時強化/防御増加系"]
  ,[704, "CS変更：無/Change CS: None", "CSへ9", "", TAG_TYPE.BUFF, "CS変更/攻撃不可系"]
  ,[705, "強制移動系(縦)/Forced Move (vertical)", "きようせ2", "", TAG_TYPE.CATEGORY]
  ,[706, "強制移動系(横)/Forced Move (horizontal)", "きようせ3", "", TAG_TYPE.CATEGORY]
  ,[707, "引き寄せ(右)/Draw (right)", "ひきよせ2", "", TAG_TYPE.ONE_SHOT, "強制移動系/強制移動系(横)"]
  ,[708, "引き寄せ(左)/Draw (left)", "ひきよせ3", "", TAG_TYPE.ONE_SHOT, "強制移動系/強制移動系(横)"]
  ,[709, "引き寄せ(右3マス)/Draw (right 3 squares)", "ひきよせ23", "", TAG_TYPE.ONE_SHOT, "引き寄せ(右)/強制移動系/強制移動系(横)"]
  ,[710, "引き寄せ(左3マス)/Draw (left 3 squares)", "ひきよせ33", "", TAG_TYPE.ONE_SHOT, "引き寄せ(左)/強制移動系/強制移動系(横)"]
  ,[711, "契約の指輪", "けいやゆ", "自身に$&$/$ and $ on self/悪魔の契約,契約の代償", TAG_TYPE.IRREMOVABLE_BUFF, "[ターン開始時]"]
  ,[712, "移動後加速付与", "いとうこかそ", "", TAG_TYPE.IRREMOVABLE_BUFF, "[移動後]"]
  ,[713, "守護時強化[ハスター]/Protection Strengthening[Hastur]", "しゆこしき は", "与ダメx1.5\n[@$]/Deal 1.5x\n[@$]/守護", TAG_TYPE.IRREMOVABLE_BUFF, "守護時強化/攻撃増加系"]
  ,[714, "斬撃弱点/Slash Weakness", "さんし", "", TAG_TYPE.IRREMOVABLE_DEBUFF, "武器種弱点系/防御減少系", , [TAG_FLAG_NUM.BONUS_D, "", "武器種弱点[2.5]"]]
  ,[715, "脱力時弱化/Drain Weakening", "たつしし", "被ダメx1.5\n[@$]/Take 1.5x\n[@$]/脱力", TAG_TYPE.IRREMOVABLE_DEBUFF, "防御減少系"]
  ,[716, "注目時強化[ダオジュン]/Taunt Strengthening[Tianzun]", "ちゆしき たお", "与ダメx1.5\n[@$]/Deal 1.5x\n[@$]/注目", TAG_TYPE.IRREMOVABLE_BUFF, "注目時強化/攻撃増加系"]
  ,[717, "CPが減少する状態", "CPけんしよ", "", TAG_TYPE.STATUS_GROUP, "", "恐怖/脱力"]
  ,[718, "移動後極限付与", "いとうこきよく", "", TAG_TYPE.IRREMOVABLE_BUFF, "[移動後]"]
  ,[719, "毒時強化/Poison Strengthening", "とくしき", "", TAG_TYPE.IRREMOVABLE_BUFF]
  ,[720, "毒時強化[イグ]/Poison Strengthening[Yig]", "とくしき い", "与ダメx3.0\n[@$]/Deal 3.0x\n[@$]/毒", TAG_TYPE.IRREMOVABLE_BUFF, "毒時強化/攻撃増加系"]
  ,[721, "アジテーション", "あし", "確率で距離2マス内に$\n(発動時解除)/Chanse of $ on self and a diamond radius of 2 squares\n(remove upon activation)/疑念", TAG_TYPE.IRREMOVABLE_DEBUFF, "[ダメージ時]"]
  ,[722, "魅了時弱化[バティム]/Charm Weakening[Bathym]", "みりしし は", "被ダメx2.0\n[@$]/Take 2.0x\n[@$]/魅了", TAG_TYPE.IRREMOVABLE_DEBUFF, "魅了時弱化/防御減少系"]
  ,[723, "マヒ大特攻/Big Advantage vs Paralysis", "まひたいと", "", TAG_TYPE.IRREMOVABLE_BUFF, "特攻付与系/攻撃増加系", , [TAG_FLAG_NUM.BONUS_A, "マヒ", "特攻[2.0]"]]
  ,[724, "移動フェーズ終了後奮起付与", "いとうふふん", "", TAG_TYPE.IRREMOVABLE_BUFF, "[移動フェーズ終了後]"]
  ,[725, "烙印特攻/Advantage vs Stigma", "らくと", "", TAG_TYPE.IRREMOVABLE_BUFF, "特攻付与系/攻撃増加系"]
  ,[726, "烙印特攻[ハクメン]", "", "", TAG_TYPE.IRREMOVABLE_BUFF, "烙印特攻/特攻付与系/攻撃増加系", , [TAG_FLAG_NUM.BONUS_A, "烙印", "特攻[1.5]"]]
  ,[727, "暴走+時強化/Berserk+ Strengthening", "ほうそしき+", "", TAG_TYPE.IRREMOVABLE_BUFF]
  ,[728, "暴走+時強化[ハクメン]/Berserk+ Strengthening[Hakumen]", "ほうそしき+ は", "CP増加\n[@$]/Increase CP\n[@$]/暴走+", TAG_TYPE.IRREMOVABLE_BUFF, "暴走+時強化/CP増加系"]
  ,[729, "スキル発動率が減少する状態", "すきるは", "", TAG_TYPE.STATUS_GROUP, "", "脱力/妨害"]
  ,[730, "CSが封印される状態", "CS", "", TAG_TYPE.STATUS_GROUP, "", "CS封印/暗闇/二重封印"]
  ,[731, "注目時強化[サトルヌス]/Taunt Strengthening[Saturnus]", "ちゆしき さと", "与ダメx2.0\n[@$]/Deal 2.0x\n[@$]/注目", TAG_TYPE.IRREMOVABLE_BUFF, "注目時強化/攻撃増加系"]
  ,[732, "ターン開始時防御貫通", "たあほう", "", TAG_TYPE.IRREMOVABLE_BUFF, "[ターン開始時]"]
  ,[733, "照準", "しようしゆ", "自身に$\n\n被ダメx1.5~3.0/$ on self\n\nTake 1.5~3.0x/照準解除", TAG_TYPE.IRREMOVABLE_DEBUFF, "防御減少系/[ダメージ後]"]
  ,[734, "照準解除", "しようしゆか", "", TAG_TYPE.UNKNOWN, "状態耐性系/状態解除系"]
  ,[735, "閃き時強化[トムテ]/Glint Strengthening[Tomte]", "ひらしき と", "与ダメx2.0\n[@$]/Deal 2.0x\n[@$]/閃き", TAG_TYPE.IRREMOVABLE_BUFF, "閃き時強化/攻撃増加系"]
  ,[736, "対ダメージCP増加", "たいためCP", "", TAG_TYPE.IRREMOVABLE_DEBUFF, "[対ダメージ]"]
  ,[737, "祈り時強化[エーコー]/Prayer Strengthening[Echo]", "いのしき え", "被ダメx0.1\n[@$]/Take 0.1x\n[@$]/祈り", TAG_TYPE.IRREMOVABLE_BUFF, "祈り時強化/防御増加系"]
  ,[738, "退場時HP回復", "たいしよHPか", "", TAG_TYPE.IRREMOVABLE_DEBUFF, "[退場時]"]
  ,[739, "退場時CP増加", "たいしよCPそ", "", TAG_TYPE.IRREMOVABLE_DEBUFF, "[退場時]"]
  ,[740, "射狙撃", "", "", TAG_TYPE.SKIP, "", "射撃/狙撃"]
  ,[741, "遠距離武器/Ranged weapons", "えん", "", TAG_TYPE.WEAPON_GROUP, "", "射撃/魔法/狙撃/全域"]
  ,[742, "近接武器/Close-range weapons", "きん", "", TAG_TYPE.WEAPON_GROUP, "", "斬撃/打撃/横一文字"]
  ,[743, "武器種弱点/Weapon Weakness", "ふき", "", TAG_TYPE.D_BONUS]
  ,[744, "武器種弱点[2.5]/Weapon Weakness[2.5]", "ふき25", "2.5", TAG_TYPE.D_BONUS, "武器種弱点"]
  ,[745, "加速時強化[ガルム#1]/Acceleration Strengthening[Garmr]", "かそしき かる1", "与ダメx4.0\n[@$]/Deal 4.0x\n[@$]/加速", TAG_TYPE.IRREMOVABLE_BUFF, "加速時強化/攻撃増加系"]
  ,[746, "加速時強化[ガルム#2]/Acceleration Strengthening[Garmr]", "かそしき かる2", "被ダメx0.5\n[@$]/Take 0.5x\n[@$]/加速", TAG_TYPE.IRREMOVABLE_BUFF, "加速時強化/防御増加系"]
  ,[747, "ターン開始時回避/Gain Evasion at turn start", "たあかい", "", TAG_TYPE.IRREMOVABLE_BUFF, "[ターン開始時]"]
  ,[748, "弱体後確率弱体解除/Chance of Remove Debuff Post-Debuff", "しやくたいこかくしや", "", TAG_TYPE.IRREMOVABLE_BUFF, "[弱体後]"]
  ,[749, "発狂時強化/Madness Strengthening", "はつしき", "与ダメx8.0\n[@$]/Deal 8.0x\n[@$]/発狂", TAG_TYPE.IRREMOVABLE_BUFF, "攻撃増加系"]
  ,[750, "ターン開始時強化解除/Turn Start Buff Removal", "たあきよう", "", TAG_TYPE.IRREMOVABLE_DEBUFF, "[ターン開始時]"]
  ,[751, "発狂時弱化/Madness Weakening", "はつしし", "", TAG_TYPE.IRREMOVABLE_DEBUFF]
  ,[752, "発狂時弱化[限定ニャルラトテプ]/Madness Weakening[Limited Nyarlathotep]", "はつしし に3", "与ダメx0.5\n[@$]/Deal 0.5x\n[@$]/発狂", TAG_TYPE.IRREMOVABLE_DEBUFF, "発狂時弱化/攻撃減少系"]
  ,[753, "非移動後CP増加/Post-No Move CP Increase", "ひいとうCP", "", TAG_TYPE.IRREMOVABLE_BUFF, "[非移動後]"]
  ,[754, "ダメージ時確率スキル封印/Chance of Skill Lock when attacked", "ためしかく", "", TAG_TYPE.IRREMOVABLE_DEBUFF, "[ダメージ時]"]
  ,[755, "ダメージ時味方全体烙印/Stigma on all allies when attacked", "ためしみか", "味方全体に$\n(発動時解除)/$ on all allies\n(remove upon activation)/烙印", TAG_TYPE.IRREMOVABLE_DEBUFF, "[ダメージ時]"]
  ,[756, "火傷特攻[ミカイール]", "", "", TAG_TYPE.IRREMOVABLE_BUFF, "火傷特攻/特攻付与系/攻撃増加系", , [TAG_FLAG_NUM.BONUS_A, "火傷", "特攻[1.5]"]]
  ,[757, "脱力時強化/Drain Strengthening", "たつしき", "発動率+??%\n[@$]/Skill Rate +??%\n[@$]/脱力", TAG_TYPE.IRREMOVABLE_BUFF, "発動率増加系"]
  ,[758, "移動力が減少する状態/Status that reduce own movement range", "いと", "", TAG_TYPE.STATUS_GROUP, "", "混乱/発狂"]
  ,[759, "ロシアンルーレット/Russian Roulette", "ろし", "", TAG_TYPE.IRREMOVABLE_DEBUFF, "[ダメージ時]"]
  ,[760, "脱力耐性/Drain Resistance", "たつたい", "", TAG_TYPE.BUFF, "状態耐性系", , [TAG_FLAG_NUM.NULLIFY, "脱力"]]
  ,[761, "妨害耐性/Obstruct Resistance", "ほうかたい", "", TAG_TYPE.BUFF, "状態耐性系", , [TAG_FLAG_NUM.NULLIFY, "妨害"]]
  ,[762, "注目時強化[サンゾウ]/Taunt Strengthening[Sanzo]", "ちゆしき さん", "被ダメx0.75\n[@$]/Take 0.75x\n[@$]/注目", TAG_TYPE.IRREMOVABLE_BUFF, "注目時強化/防御増加系"]
  ,[763, "○○時強化/Status Strengthening", "ん14", "", TAG_TYPE.CATEGORY]
  ,[764, "○○時弱化/Status Weakening", "ん24", "", TAG_TYPE.CATEGORY]
  ,[765, "非○○時強化/Non-Status Strengthening", "ん15", "", TAG_TYPE.CATEGORY]
  ,[766, "非○○時弱化/Non-Status Weakening", "ん25", "", TAG_TYPE.CATEGORY]
  ,[767, "武器種変更系/Weapon Change", "ふきへん", "", TAG_TYPE.CATEGORY]
  ,[768, "CS変更系/Change CS", "CSへ", "", TAG_TYPE.CATEGORY]
  ,[769, "不動時強化[ハーロット#1]/Immobility Strengthening[Babalon]", "ふとしき は1", "CP増加\n[@$]/Increase CP\n[@$]/不動", TAG_TYPE.IRREMOVABLE_BUFF, "不動時強化/CP増加系"]
  ,[770, "不動時強化[ハーロット#2]/Immobility Strengthening[Babalon]", "ふとしき は2", "与ダメx1.5\n[@$]/Deal 1.5x\n[@$]/不動", TAG_TYPE.IRREMOVABLE_BUFF, "不動時強化/攻撃増加系"]
  ,[771, "火傷時強化[プロメテウス]/Burn Strengthening[Prometheus]", "やけしき ふ", "与ダメx1.5\n被ダメx0.7\n[@$]/Deal 1.5x\nTake 0.7x\n[@$]/火傷", TAG_TYPE.IRREMOVABLE_BUFF, "火傷時強化/攻撃増加系/防御増加系"]
  ,[772, "祝福時強化[ベルフェゴール]/Blessing Strengthening[Belphegor]", "しゆくしき へ", "CP増加\n[@$]/Increase CP\n[@$]/祝福", TAG_TYPE.IRREMOVABLE_BUFF, "祝福時強化/CP増加系"]
  ,[773, "友時強化/Friendship Strengthening", "ゆうしき", "", TAG_TYPE.IRREMOVABLE_BUFF]
  ,[774, "友時強化[ベルフェゴール]/Friendship Strengthening[Belphegor]", "ゆうしき へ", "CP増加\n[@$]/Increase CP\n[@$]/結縁：友", TAG_TYPE.IRREMOVABLE_BUFF, "友時強化/CP増加系"]
  ,[775, "暴走時強化/Berserk Strengthening", "ほうそしき", "", TAG_TYPE.IRREMOVABLE_BUFF]
  ,[776, "暴走時強化[アメノウズメ]/Berserk Strengthening[Ame-no-Uzume]", "ほうそしき あ", "被ダメx0.3\n[@$]/Take 0.3x\n[@$]/暴走", TAG_TYPE.IRREMOVABLE_BUFF, "暴走時強化/防御増加系"]
  ,[777, "暴走+時強化[アメノウズメ]/Berserk+ Strengthening[Ame-no-Uzume]", "ほうそしき+ あ", "被ダメx0.3\n[@$]/Take 0.3x\n[@$]/暴走+", TAG_TYPE.IRREMOVABLE_BUFF, "暴走+時強化/防御増加系"]
  ,[778, "ターン開始時HP回復/Restore HP at Turn Start", "たあHPか", "", TAG_TYPE.IRREMOVABLE_BUFF, "[ターン開始時]"]
  ,[779, "攻撃力増加[チョウジ]", "", "与ダメx2.0 → x1.2/Deal 2.0x → 1.2x", TAG_TYPE.IRREMOVABLE_BUFF, "攻撃力増加/攻撃増加系"]
  ,[780, "防御耐性/Defense Resistance", "ほうきよた", "", TAG_TYPE.IRREMOVABLE_BUFF, "状態耐性系", , [TAG_FLAG_NUM.NULLIFY, "防御力が上昇する状態"]]
  ,[781, "弱体後HP激減/Post-Debuff Great HP Decrease", "しやくたいこHPけき", "", TAG_TYPE.IRREMOVABLE_DEBUFF, "[弱体後]"]
  ,[782, "加速時強化[ウィリー]/Acceleration Strengthening[Willie]", "かそしき う", "与ダメx1.5\n[@$]/Deal 1.5x\n[@$]/加速", TAG_TYPE.IRREMOVABLE_BUFF, "加速時強化/攻撃増加系"]
  ,[783, "弱体無効耐性/Nullify Debuff Resistance", "しやくたいむたい", "", TAG_TYPE.IRREMOVABLE_BUFF, "状態耐性系", , [TAG_FLAG_NUM.NULLIFY, "弱体無効"]]
  ,[784, "斬撃特防/Reduce Slash damage", "さんと", "", TAG_TYPE.IRREMOVABLE_BUFF, "特防付与系/防御増加系", , [TAG_FLAG_NUM.BONUS_D, "斬撃", "特防[0.7]"]]
  ,[785, "凍結特攻/Advantage vs Freeze", "とうけと", "", TAG_TYPE.IRREMOVABLE_BUFF, "特攻付与系/攻撃増加系", , [TAG_FLAG_NUM.BONUS_A, "凍結", "特攻[1.5]"]]
  ,[786, "加速時強化[グンゾウ]/Acceleration Strengthening[Gunzo]", "かそしき く", "与ダメx1.5\n[@$]/Deal 1.5x\n[@$]/加速", TAG_TYPE.IRREMOVABLE_BUFF, "加速時強化/攻撃増加系"]
  ,[787, "攻撃時二重封印付与", "こうけきしにし", "", TAG_TYPE.IRREMOVABLE_BUFF, "[攻撃時]"]
  ,[788, "強化後烙印付与/Inflict Stigma When Buffed", "きようかこら", "", TAG_TYPE.IRREMOVABLE_DEBUFF, "[強化後]"]
  ,[789, "ターン開始時HP大回復/Great HP Restoration at Turn Start", "たあHPた", "", TAG_TYPE.IRREMOVABLE_BUFF, "[ターン開始時]"]
  ,[790, "恐怖時弱化[ニャルラトテプ]/Fear Weakening[Nyarlathotep]", "きようふしし に", "発動率-??%\n[@$]/Skill Rate -??%\n[@$]/恐怖", TAG_TYPE.IRREMOVABLE_DEBUFF, "恐怖時弱化/発動率減少系"]
  ,[791, "魅了時弱化[ツァトグァ]/Charm Weakening[Tsathoggua]", "みりしし つ", "被ダメx2.0\n[@$]/Take 2.0x\n[@$]/魅了", TAG_TYPE.IRREMOVABLE_DEBUFF, "魅了時弱化/防御減少系"]
  ,[792, "注目時弱化/Taunt Weakening", "ちゆしし", "", TAG_TYPE.IRREMOVABLE_DEBUFF]
  ,[793, "注目時弱化[テスカトリポカ]/Taunt Weakening[Tezcatlipoca]", "ちゆしし て", "発動率-??%\n[@$]/Skill Rate -??%\n[@$]/注目", TAG_TYPE.IRREMOVABLE_DEBUFF, "注目時弱化/発動率減少系"]
  ,[794, "[フェーズ開始時]/[Phase Start]", "ん001", "", TAG_TYPE.CATEGORY]
  ,[795, "[ターン開始時]/[Turn Start]", "ん002", "", TAG_TYPE.CATEGORY]
  ,[796, "[敵ターン開始時]/[Enemy Turn Start]", "ん003", "", TAG_TYPE.CATEGORY]
  ,[797, "[移動後]/[Post-Move]", "ん004", "", TAG_TYPE.CATEGORY]
  ,[798, "[移動フェーズ終了後]/[End of Movement Phase]", "ん005", "", TAG_TYPE.CATEGORY]
  ,[799, "[非移動後]/[Post-No Move]", "ん006", "", TAG_TYPE.CATEGORY]
  ,[800, "[攻撃時]/[Attacking]", "ん007", "", TAG_TYPE.CATEGORY]
  ,[801, "[攻撃後]/[Post-Attack]", "ん008", "", TAG_TYPE.CATEGORY]
  ,[802, "[空振り時]/[Missed Attack]", "ん009", "", TAG_TYPE.CATEGORY]
  ,[803, "[ダメージ時]/[Attacked]", "ん010", "", TAG_TYPE.CATEGORY]
  ,[804, "[対ダメージ]/[Counter]", "ん011", "", TAG_TYPE.CATEGORY]
  ,[805, "[ダメージ後]/[Post-Damage]", "ん012", "", TAG_TYPE.CATEGORY]
  ,[806, "[強化後]/[Post-Buff]", "ん013", "", TAG_TYPE.CATEGORY]
  ,[807, "[弱体後]/[Post-Debuff]", "ん014", "", TAG_TYPE.CATEGORY]
  ,[808, "[退場時]/[Defeat]", "ん015", "", TAG_TYPE.CATEGORY]
  ,[809, "滋養時弱化/Nourishment Weakening", "しようしし", "", TAG_TYPE.IRREMOVABLE_DEBUFF]
  ,[810, "滋養時弱化[リョウタ]/Nourishment Weakening[Ryota]", "しようしし り", "与ダメx0.6\n[@$]/Deal 0.6x\n[@$]/滋養", TAG_TYPE.IRREMOVABLE_DEBUFF, "滋養時弱化/攻撃減少系"]
  ,[811, "熱情時強化[ノブハル]/Ardor Strengthening[Nobuharu]", "ねつしき の", "与ダメx1.5\n[@$]/Deal 1.5x\n[@$]/熱情", TAG_TYPE.IRREMOVABLE_BUFF, "熱情時強化/攻撃増加系"]
  ,[812, "確率崩し", "かくりつくす", "", TAG_TYPE.IRREMOVABLE_DEBUFF, "[ダメージ時]"]
  ,[813, "集中時強化[ジャンバヴァン]/Concentration Strengthening[Jambavan]", "しゆうしき し", "被ダメx0.7\n[@$]/Take 0.7x\n[@$]/集中", TAG_TYPE.IRREMOVABLE_BUFF, "集中時強化/防御増加系"]
  ,[814, "弱体無効時強化[イクトシ]/Nullify Debuff Strengthening[Ikutoshi]", "しやくたいむしき い", "被ダメx0.7\n[@$]/Take 0.7x\n[@$]/弱体無効", TAG_TYPE.IRREMOVABLE_BUFF, "弱体無効時強化/防御増加系"]
  ,[815, "ターン開始時極限/Limit at Turn Start", "たあきよく", "", TAG_TYPE.IRREMOVABLE_BUFF, "[ターン開始時]"]
  ,[816, "威圧特攻[イクトシ]", "", "", TAG_TYPE.IRREMOVABLE_BUFF, "威圧特攻/特攻付与系/攻撃増加系", , [TAG_FLAG_NUM.BONUS_A, "威圧", "特攻[1.5]"]]
  ,[817, "烙印時弱化/Stigma Weakening", "らくしし", "被ダメx2.0\n[@$]/Take 2.0x\n[@$]/烙印", TAG_TYPE.IRREMOVABLE_DEBUFF, "防御減少系"]
  ,[818, "浄化時強化[サルタヒコ]/Purification Strengthening[Sarutahiko]", "しようかしき さ", "CP増加\n[@$]/Increase CP\n[@$]/浄化", TAG_TYPE.IRREMOVABLE_BUFF, "浄化時強化/CP増加系"]
  ,[819, "凍結時防御弱化/Freeze Weakened Defense", "とうけしほ", "被ダメ+10000\n[@$]/Take +10000\n[@$]/凍結", TAG_TYPE.IRREMOVABLE_DEBUFF, "被ダメージ追加系"]
  ,[820, "加速時強化[ゴウリョウ]/Acceleration Strengthening[Ganglie]", "かそしき こ", "与ダメx6.0\n[@$]/Deal 6.0x\n[@$]/加速", TAG_TYPE.IRREMOVABLE_BUFF, "加速時強化/攻撃増加系"]
  ,[821, "虚飾時弱化/Flamboyance Weakening", "きよしよしし", "被ダメx2.0\n[@$]/Take 2.0x\n[@$]/虚飾", TAG_TYPE.IRREMOVABLE_DEBUFF, "防御減少系"]
  ,[822, "ダメージ時HP超激減/Enormously deplete HP when attacked", "ためしHPちよ", "", TAG_TYPE.IRREMOVABLE_DEBUFF, "[ダメージ時]"]
  ,[823, "非弱体時強化[スズカ]/Non-Debuff Strengthening[Suzuka]", "ひししき す", "与ダメx2.0\n[非 @$]/Deal 2.0x\n[Not @$]/弱体(解除可)", TAG_TYPE.IRREMOVABLE_BUFF, "非弱体時強化/攻撃増加系"]
  ,[824, "攻撃時HP激減/Major HP Decrease When Attacking", "こうけきしHP", "", TAG_TYPE.IRREMOVABLE_DEBUFF, "[攻撃時]"]
  ,[825, "非移動後クリティカル", "ひいとうく", "", TAG_TYPE.IRREMOVABLE_BUFF, "[非移動後]"]
  ,[826, "弱点時強化/Weakness Strengthening", "しやくてしき", "被ダメx0.4\n[@$]/Take 0.4x\n[@$]/弱点", TAG_TYPE.IRREMOVABLE_BUFF, "防御増加系"]
  ,[827, "滋養時強化[ジブリール]/Nourishment Strengthening[Gabriel]", "しようしき し", "CP増加\n[@$]/Increase CP\n[@$]/滋養", TAG_TYPE.IRREMOVABLE_BUFF, "滋養時強化/CP増加系"]
  ,[828, "恐怖時弱化/Fear Weakening", "きようふしし", "", TAG_TYPE.IRREMOVABLE_DEBUFF]
  ,[829, "恐怖時弱化[シロウ]/Fear Weakening[Shiro]", "きようふしし し", "被ダメx2.0\n[@$]/Take 2.0x\n[@$]/恐怖", TAG_TYPE.IRREMOVABLE_DEBUFF, "恐怖時弱化/防御減少系"]
  ,[830, "頭陀袋の大風狂僧", "すたふくろのた", "", TAG_TYPE.SKILL]
  ,[831, "祟られし仕置人", "たたられしし", "", TAG_TYPE.SKILL]
  ,[832, "祟られし指輪の主", "たたられしゆ", "", TAG_TYPE.SKILL]
  ,[833, "増減反転系/Increase%%Decrease Reversal", "そう", "", TAG_TYPE.CATEGORY]
  ,[834, "攻撃不可系/Prevent Attacking", "こうけ3", "", TAG_TYPE.CATEGORY]
  ,[835, "状態解除系/Remove Status", "しよかい", "", TAG_TYPE.CATEGORY]
  ,[836, "複製・貼付系/Copy%%Paste", "ふく", "", TAG_TYPE.CATEGORY]
  ,[837, "効果増強系/Effect Enhancement", "こうか", "", TAG_TYPE.CATEGORY]
  ,[838, "強化無効系/Nullify Buff", "きようか", "", TAG_TYPE.CATEGORY]
  ,[839, "強制移動無効系/Nullify Forced Movement", "きようせ4", "", TAG_TYPE.CATEGORY]
  ,[840, "強制移動無効/Nullify forced movement", "きようせ", "", TAG_TYPE.STATIC]
  ,[841, "ヘイト操作系/Aggro Control", "へい", "", TAG_TYPE.CATEGORY]
  ,[842, "復活系/Revive", "ふつ", "", TAG_TYPE.CATEGORY]
  ,[843, "虚飾時強化/Flamboyance Strengthening", "きよしよしき", "被ダメx0.5\n[@$]/Take 0.5x\n[@$]/虚飾", TAG_TYPE.IRREMOVABLE_BUFF, "防御増加系"]
  ,[844, "攻撃力激減/ATK Vastly Down", "こうけきりよくけき", "", TAG_TYPE.IRREMOVABLE_DEBUFF, "攻撃減少系"]
  ,[845, "攻撃力激減[ボヘミオ]", "", "与ダメx0.01/Deal 0.01x", TAG_TYPE.IRREMOVABLE_DEBUFF, "攻撃力激減/攻撃減少系"]
  ,[846, "吹き飛ばし(5マス)/Blast (5 squares)", "ふきと15", "", TAG_TYPE.ONE_SHOT, "吹き飛ばし(縦)/強制移動系/強制移動系(縦)"]
  ,[847, "ダメージ時幻惑付与", "ためしけん", "", TAG_TYPE.IRREMOVABLE_DEBUFF, "[ダメージ時]"]
  ,[848, "HP回復(%)/Restore HP (%)", "HPか%", "", TAG_TYPE.ONE_SHOT, "HP回復/HP回復系"]
  ,[849, "移動力増加(全+2)/Increase movement (all +2)", "いとそう32", "", TAG_TYPE.STATIC, "移動力増加/移動力増加(縦)/移動力増加(横)/移動力増加(全)/移動力増加(縦+2)/移動力増加(横+2)"]
  ,[850, "攻撃力低下[ベイブ]//攻撃力低下", "", "与ダメx0.7\n[重複可x6]/Deal 0.7x\n[Stackable 6x]", TAG_TYPE.IRREMOVABLE_DEBUFF, "攻撃力低下/攻撃減少系"]
  ,[851, "攻撃力低下[ペルーン]//攻撃力低下", "", "与ダメx0.7\n[重複可x3]/Deal 0.7x\n[Stackable 3x]", TAG_TYPE.IRREMOVABLE_DEBUFF, "攻撃力低下/攻撃減少系"]
  ,[852, "凍結[重複可]/Freeze [Stackable]/凍結", "とうけs", "被ダメx1.1~2.2\nHP減少200~400\n[重複可x4]/Take 1.1~2.2x\nDecrease HP 200~400\n[Stackable 4x]", TAG_TYPE.DEBUFF, "凍結/防御減少系/HP減少系"]
  ,[853, "無窮[重複可]/Infinitude [Stackable]/無窮", "むきs", "与ダメx1.3~2.6\nHP減少400~800\n[重複可x2]/Deal 1.3~2.6x\nDecrease HP 400~800\n[Stackable 2x]", TAG_TYPE.BUFF, "無窮/攻撃増加系/HP減少系"]
  ,[854, "毒時弱化[テュアリング]/Poison Weakening[Tuaring]", "とくしし て", "HP減少1000\n[@$]/Decrease HP 1000\n[@$]/毒", TAG_TYPE.IRREMOVABLE_DEBUFF, "毒時弱化/HP減少系"]
  ,[855, "毒時弱化[クアンタム]/Poison Weakening[Quantum]", "とくしし く", "HP減少10000\n[@$]/Decrease HP 10000\n[@$]/毒", TAG_TYPE.IRREMOVABLE_DEBUFF, "毒時弱化/HP減少系"]
  ,[856, "結縁：友/Affinity: Friendship", "", "", TAG_TYPE.UNKNOWN, "発動率増加系"]
  ,[857, "結縁：怒/Affinity: Anger", "", "", TAG_TYPE.UNKNOWN, "攻撃増加系"]
  ,[858, "結縁：愛/Affinity: Love", "", "", TAG_TYPE.UNKNOWN, "HP回復系"]
  ,[859, "結縁：妬/Affinity: Envy", "", "", TAG_TYPE.UNKNOWN, "CP増加系"]
  ,[860, "空振り時HP減少", "からHPけん", "自身に$/$ on self/HP減少", TAG_TYPE.IRREMOVABLE_DEBUFF, "[空振り時]"]
  ,[861, "空振り時HP超激減", "からHPち", "自身に$/$ on self/HP減少", TAG_TYPE.IRREMOVABLE_DEBUFF, "[空振り時]"]
  ,[862, "威圧時強化/Oppression Strengthening", "いあしき", "与ダメx8.0\n[@$]/Deal 8.0x\n[@$]/威圧", TAG_TYPE.IRREMOVABLE_BUFF, "攻撃増加系"]
  ,[863, "マヒ時強化/Paralysis Strengthening", "まひしき", "与ダメx8.0\n[@$]/Deal 8.0x\n[@$]/マヒ", TAG_TYPE.IRREMOVABLE_BUFF, "攻撃増加系"]
  ,[864, "恐怖時強化/Fear Strengthening", "きようふしき", "与ダメx8.0\n[@$]/Deal 8.0x\n[@$]/恐怖", TAG_TYPE.IRREMOVABLE_BUFF, "攻撃増加系"]
  ,[865, "不動時強化[ガーゴイル]/Immobility Strengthening[Gargoyle]", "ふとしき か", "与ダメx8.0\n[@$]/Deal 8.0x\n[@$]/不動", TAG_TYPE.IRREMOVABLE_BUFF, "不動時強化/攻撃増加系"]
  ,[866, "崩し時強化/Break Strengthening", "くすしき", "与ダメx8.0\n[@$]/Deal 8.0x\n[@$]/崩し", TAG_TYPE.IRREMOVABLE_BUFF, "攻撃増加系"]
  ,[867, "CS変更：狙撃/Change CS: Snipe", "CSへ6", "", TAG_TYPE.BUFF, "CS変更"]
  ,[868, "HP減少(%)/Decrease HP (%)", "HPけ%", "", TAG_TYPE.ONE_SHOT, "HP減少/HP減少系"]
  ,[869, "ダメージ時HP減少[ジャージーデビル]", "", "自身に$\n(10%)/$ on self\n(10%)/HP減少", TAG_TYPE.IRREMOVABLE_DEBUFF, "ダメージ時HP減少/[ダメージ時]"]
  ,[870, "祝福時弱化[ジゾウ]/Blessing Weakening[Ksitigarbha]", "しゆくしし し", "与ダメx0.5\n[@$]/Deal 0.5x\n[@$]/祝福", TAG_TYPE.IRREMOVABLE_DEBUFF, "祝福時弱化/攻撃減少系"]
  ,[871, "愛時強化/Love Strengthening", "あい", "", TAG_TYPE.IRREMOVABLE_BUFF]
  ,[872, "愛時強化[ニュージェン#1]/Love Strengthening[ニュージェン]", "あい に1", "発動率+??%\n[@$]/Skill Rate +??%\n[@$]/結縁：愛", TAG_TYPE.IRREMOVABLE_BUFF, "愛時強化/発動率増加系"]
  ,[873, "愛時強化[ニュージェン#2]/Love Strengthening[ニュージェン]", "あい に2", "HP回復\n[@$]/Restore HP\n[@$]/結縁：愛", TAG_TYPE.IRREMOVABLE_BUFF, "愛時強化/HP回復系"]
  ,[874, "友時強化[ニュージェン]/Friendship Strengthening[ニュージェン]", "ゆうしき に", "発動率+10%\n[@$]/Skill Rate +10%\n[@$]/結縁：友", TAG_TYPE.IRREMOVABLE_BUFF, "友時強化/発動率増加系"]
  ,[875, "非弱体時強化[ウランバートル#1]/Non-Debuff Strengthening[Ulaanbaatar]", "ひししき う1", "被ダメx0.3\n[非 @$]/Take 0.3x\n[Not @$]/弱体(解除可)", TAG_TYPE.IRREMOVABLE_BUFF, "非弱体時強化/防御増加系"]
  ,[876, "非弱体時強化[ウランバートル#2]/Non-Debuff Strengthening[Ulaanbaatar]", "ひししき う2", "発動率+30%\n[非 @$]/Skill Rate +30%\n[Not @$]/弱体(解除可)", TAG_TYPE.IRREMOVABLE_BUFF, "非弱体時強化/発動率増加系"]
  ,[877, "幻惑耐性/Dazzle Resistance", "けんたい", "", TAG_TYPE.BUFF, "状態耐性系", , [TAG_FLAG_NUM.NULLIFY, "幻惑"]]
  ,[878, "大江山の鬼頭領", "おおえ", "", TAG_TYPE.SKILL]
  ,[879, "ロシアンルーレット[☆3]/Russian Roulette[☆3]", "ろし 3", "確率で自身に$&$\n(発動時解除)/Chanse of $ and $ on self\n(remove upon activation)/弱点,烙印", TAG_TYPE.IRREMOVABLE_DEBUFF, "ロシアンルーレット/[ダメージ時]"]
  ,[880, "ロシアンルーレット[☆4]/Russian Roulette[☆5]", "ろし 4", "確率で自身に$&$&$\n(発動時解除)/Chanse of $, $, and $ on self\n(remove upon activation)/弱点,烙印,凍結", TAG_TYPE.IRREMOVABLE_DEBUFF, "ロシアンルーレット/[ダメージ時]"]
  ,[881, "ロジックボム[☆3]/Logic Bomb[☆3]", "ろし 3", "確率で距離3マス内に$&$\n(発動時解除)/Chanse of $ and $ from self and a diamond radius of 3 squares\n(remove upon activation)/HP減少,強化解除(単)", TAG_TYPE.IRREMOVABLE_DEBUFF, "ロジックボム/[ダメージ時]"]
  ,[882, "ロジックボム[☆5]/Logic Bomb[☆5]", "ろし 5", "確率で距離3マス内に$&$&$\n(発動時解除)/Chanse of $, $, and $ from self and a diamond radius of 3 squares\n(remove upon activation)/HP減少,崩し,強化解除(単)", TAG_TYPE.IRREMOVABLE_DEBUFF, "ロジックボム/[ダメージ時]"]
]);
