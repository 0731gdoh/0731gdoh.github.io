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
  CCT: 10,
  CWT: 11,
  ALL_BUFFS: 12,
  ALL_DEBUFFS: 13,
  STATUS_GROUP: 14
};

function Tag(index, x, category, subset){
  this.index = index;
  this.name = x[0];
  this.reading = x[1];
  this.type = x[2];
  this.category = category;
  this.subset = subset;
  this.flags = [];
  if(index < 3){
    this.sortkey = 0;
  }else{
    switch(this.type){
      case TAG_TYPE.STATUS_GROUP:
        this.sortkey = 2;
        break;
      case TAG_TYPE.WEAPON:
        this.sortkey = 3;
        break;
      case TAG_TYPE.SKILL:
        this.sortkey = 4;
        break;
      case TAG_TYPE.CATEGORY:
        this.sortkey = 5;
        break;
      default:
        this.sortkey = 1;
    }
  }
}
Tag.prototype = {
  toString: function(){
    if(this.type !== TAG_TYPE.CATEGORY) return t(this.name);
    if(this.name) return t("[カテゴリ：/[Category: ") + t(this.name) + "]";
    return LINE;
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
  var order = [[], []];
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
    order[0].push(i);
    order[1].push(i);
    if(v[2] === TAG_TYPE.BUFF) buff.push(i);
    if(v[2] === TAG_TYPE.DEBUFF) debuff.push(i);
  });
  a.forEach(function(v, i){
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
      case TAG_TYPE.IRREMOVABLE_BUFF:
      case TAG_TYPE.CCT:
      case TAG_TYPE.CWT:
        c.push(table.get("強化"));
        break;
      case TAG_TYPE.DEBUFF:
      case TAG_TYPE.IRREMOVABLE_DEBUFF:
        c.push(table.get("弱体"));
        break;
    }
    result.push(new Tag(i, v, c, s));
    k.push(t(v[0], 1).replace(/ *[\(:].+/, ""));
  });
  order[0].sort(f);
  en = true;
  order[1].sort(f);
  result.ORDER = order;
  result.table = table;
  return result;
};

var TAG_MAX = 10000;

var TAG = Tag.createList(
  [["", "", TAG_TYPE.CATEGORY]
  ,["全ての強化/All buffs", "", TAG_TYPE.ALL_BUFFS]
  ,["全ての弱体/All debuffs", "", TAG_TYPE.ALL_DEBUFFS]

  ,["移動不能になる状態/Status that cause immobility", "いと", TAG_TYPE.STATUS_GROUP, "", "威圧/恐怖/崩し/不動/マヒ"]
  ,["攻撃力が低下する状態/Status that lower attack", "こう", TAG_TYPE.STATUS_GROUP, "", "疑念/強化反転/暗闇/幻惑/束縛/呪い/マヒ"]
  ,["スキルが封印される状態/Skill sealing status", "すき", TAG_TYPE.STATUS_GROUP, "", "スキル封印/束縛/二重封印"]
  ,["被ダメージが増加する状態", "ひた", TAG_TYPE.STATUS_GROUP, "", "強化反転/崩し/契約の代償/激怒/激怒+/劫火/弱点/凍結/発狂/暴走/暴走+/烙印"]
  ,["防御力が上昇する状態/Status that raise defense", "ほう", TAG_TYPE.STATUS_GROUP, "", "頑強/金剛/守護/聖油/防御強化"]
  ,["CP減少/Deplete CP", "CPけ", TAG_TYPE.ONE_SHOT, "CP減少系"]
  ,["CP増加/Increase CP", "CPそ", TAG_TYPE.ONE_SHOT, "CP増加系"]
  ,["CS封印/CS Lock", "CSふ", TAG_TYPE.DEBUFF, "CS封印系"]
  ,["CS変更/Change CS Type", "CSへ", TAG_TYPE.BUFF]
  ,["CS変更：打撃/Change CS Type: Blow", "CSへ3", TAG_TYPE.CCT, "CS変更"]
  ,["CS変更：魔法/Change CS Type: Magic", "CSへ5", TAG_TYPE.CCT, "CS変更"]
  ,["CS変更：横一文字/Change CS Type: Long Slash", "CSへ7", TAG_TYPE.CCT, "CS変更"]
  ,["CS変更：全域/Change CS Type: All", "CSへ8", TAG_TYPE.CCT, "CS変更"]
  ,["HP回復/Restore HP", "HPか", TAG_TYPE.ONE_SHOT, "HP回復系"]
  ,["HP減少/Decrease HP", "HPけ", TAG_TYPE.ONE_SHOT, "HP減少系"]
  ,["悪魔の契約", "あく", TAG_TYPE.IRREMOVABLE_BUFF, "攻撃増加系/防御増加系/CP増加系"]
  ,["威圧/Oppression", "いあ", TAG_TYPE.DEBUFF, "移動封印系"]
  ,["怒時強化", "いか", TAG_TYPE.IRREMOVABLE_BUFF, "攻撃増加系"]
  ,["意気/Spirit", "いき", TAG_TYPE.BUFF, "攻撃増加系"]
  ,["移動力増加/Increase movement", "いとそう", TAG_TYPE.STATIC]
  ,["移動力増加(縦)/Increase movement (vertical)", "いとそう1", TAG_TYPE.STATIC, "移動力増加"]
  ,["移動力増加(横)/Increase movement (horizontal)", "いとそう2", TAG_TYPE.STATIC, "移動力増加"]
  ,["移動力増加(全)/Increase movement (all)", "いとそう3", TAG_TYPE.STATIC, "移動力増加/移動力増加(縦)/移動力増加(横)"]
  ,["祈り/Prayer", "いの", TAG_TYPE.BUFF, "発動率増加系"]
  ,["祈り時強化", "いのしき", TAG_TYPE.IRREMOVABLE_BUFF, "HP回復系"]
  ,["温泉/Hot Springs", "おん", TAG_TYPE.IRREMOVABLE_BUFF, "CP増加系"]
  ,["回避/Evasion", "かい", TAG_TYPE.BUFF, "防御増加系"]
  ,["回避時強化", "かいしき", TAG_TYPE.IRREMOVABLE_BUFF, "発動率増加系"]
  ,["回避に貫通/Ignore Evasion", "かいにか", TAG_TYPE.STATIC, "特攻/貫通系"]
  ,["獲得経験値アップ/XP Bonus", "かくけいあ", TAG_TYPE.STATIC, "報酬増加系"]
  ,["獲得コインアップ/Coin Bonus", "かくこい", TAG_TYPE.STATIC, "報酬増加系"]
  ,["加速/Acceleration", "かそ", TAG_TYPE.BUFF, "CP増加系"]
  ,["加速時強化[AR]", "かそしきAR", TAG_TYPE.IRREMOVABLE_BUFF, "CP増加系"]
  ,["加速時強化[ジェド]/加速時強化[Ded]", "かそしきしえ", TAG_TYPE.IRREMOVABLE_BUFF, "発動率増加系"]
  ,["頑強/Tenacity", "かん", TAG_TYPE.BUFF, "防御増加系"]
  ,["頑強時強化", "かんしき", TAG_TYPE.IRREMOVABLE_BUFF, "攻撃増加系"]
  ,["頑強に貫通/Ignore Tenacity", "かんにか", TAG_TYPE.STATIC, "特攻/貫通系"]
  ,["疑念", "きね", TAG_TYPE.DEBUFF, "攻撃増加系/攻撃減少系"]
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
  ,["強化反転", "きようかは", TAG_TYPE.DEBUFF, "攻撃減少系/防御減少系"]
  ,["強化無効/Nullify Buff", "きようかむ", TAG_TYPE.DEBUFF, ""]
  ,["強化を複製/Copy buff", "きようかをふ", TAG_TYPE.ONE_SHOT, ""]
  ,["強化を貼付(味方から)/Paste buff (from ally)", "きようかをち1", TAG_TYPE.ONE_SHOT, ""]
  ,["強化を貼付(敵から)/Paste buff (from enemy)", "きようかをち2", TAG_TYPE.ONE_SHOT, ""]
  ,["強制移動無効(後)/Nullify forced movement (backward)", "きようせ1", TAG_TYPE.STATIC, ""]
  ,["強制移動無効(全)/Nullify forced movement (all)", "きようせ2", TAG_TYPE.STATIC, "強制移動無効(後)"]
  ,["恐怖/Fear", "きようふ", TAG_TYPE.DEBUFF, "CP減少系/移動封印系"]
  ,["極限/Limit", "きよく", TAG_TYPE.BUFF, "攻撃増加系"]
  ,["崩し/Break", "くす", TAG_TYPE.DEBUFF, "防御減少系/移動封印系"]
  ,["暗闇/Darkness", "くら", TAG_TYPE.DEBUFF, "攻撃減少系/CS封印系"]
  ,["暗闇時強化", "くらしき", TAG_TYPE.IRREMOVABLE_BUFF, "攻撃増加系/防御増加系"]
  ,["クリティカル/Crit", "くり", TAG_TYPE.BUFF, "攻撃増加系"]
  ,["クリティカル強化", "くりき", TAG_TYPE.IRREMOVABLE_BUFF, "攻撃増加系"]
  ,["クリティカル+/Crit+", "くり+", TAG_TYPE.BUFF, "攻撃増加系"]
  ,["クリティカル++/Crit++", "くり++", TAG_TYPE.BUFF, "攻撃増加系"]
  ,["契約の代償", "けいや", TAG_TYPE.IRREMOVABLE_DEBUFF, "防御減少系/発動率減少系"]
  ,["係留/Anchor", "けいり", TAG_TYPE.BUFF, ""]
  ,["激怒/Rage", "けき", TAG_TYPE.BUFF, "攻撃増加系/防御減少系", "激怒+"]
  ,["激怒+/Rage+", "けき+", TAG_TYPE.BUFF, "攻撃増加系/防御減少系"]
  ,["激怒+時強化", "けきしき+", TAG_TYPE.IRREMOVABLE_BUFF, "発動率増加系"]
  ,["幻惑/Dazzle", "けん", TAG_TYPE.DEBUFF, "攻撃減少系"]
  ,["劫火", "こうか", TAG_TYPE.DEBUFF, "防御減少系"]
  ,["劫火時強化", "こうかしき", TAG_TYPE.IRREMOVABLE_BUFF, "防御増加系/CP増加系"]
  ,["攻撃強化/ATK Up", "こうけきき", TAG_TYPE.BUFF, "攻撃増加系"]
  ,["攻撃力減少", "こうけきりよくけ", TAG_TYPE.IRREMOVABLE_DEBUFF, "攻撃減少系"]
  ,["攻撃力低下", "こうけきりよくて", TAG_TYPE.IRREMOVABLE_DEBUFF, "攻撃減少系"]
  ,["攻撃力微増[AR]", "こうけきりよくひAR", TAG_TYPE.IRREMOVABLE_BUFF, "攻撃増加系"]
  ,["攻撃力微増[セト]/攻撃力微増[Seth]", "こうけきりよくひせと", TAG_TYPE.IRREMOVABLE_BUFF, "攻撃増加系"]
  ,["剛力/Brawn", "こうり", TAG_TYPE.BUFF, "攻撃増加系"]
  ,["剛力時強化", "こうりしき", TAG_TYPE.IRREMOVABLE_BUFF, "攻撃増加系"]
  ,["告死/Countdown", "こく", TAG_TYPE.DEBUFF, "HP減少系"]
  ,["金剛/Adamantine", "こんこ", TAG_TYPE.BUFF, "防御増加系"]
  ,["金剛時強化", "こんこしき", TAG_TYPE.IRREMOVABLE_BUFF, "攻撃増加系"]
  ,["金剛に貫通/Ignore Adamantine", "こんこにか", TAG_TYPE.STATIC, "特攻/貫通系"]
  ,["根性/Guts", "こんし", TAG_TYPE.BUFF, ""]
  ,["根性時強化[AR]", "こんししきAR", TAG_TYPE.IRREMOVABLE_BUFF, "攻撃増加系"]
  ,["根性時強化[マガン]/根性時強化[Macan]", "こんししきまか", TAG_TYPE.IRREMOVABLE_BUFF, "攻撃増加系"]
  ,["再生/Regeneration", "さい", TAG_TYPE.BUFF, "HP回復系"]
  ,["弱体解除/Remove debuff", "しやくたいか", TAG_TYPE.ONE_SHOT]
  ,["弱体解除(単)/Remove debuff (single)", "しやくたいか1", TAG_TYPE.ONE_SHOT, "弱体解除"]
  ,["弱体解除(複)/Remove debuff (multiple)", "しやくたいか2", TAG_TYPE.ONE_SHOT, "弱体解除"]
  ,["弱体解除(全)/Remove debuff (all)", "しやくたいか3", TAG_TYPE.ONE_SHOT, "弱体解除"]
  ,["弱体時強化[マガン]/弱体時強化[Macan]", "しやくたいしきまか", TAG_TYPE.IRREMOVABLE_BUFF, "HP回復系/CP増加系"]
  ,["弱体時強化[ヴォルフ]/弱体時強化[Volkh]", "しやくたいしきうお", TAG_TYPE.IRREMOVABLE_BUFF, "防御増加系"]
  ,["弱体奪取/Steal debuff", "しやくたいた", TAG_TYPE.ONE_SHOT]
  ,["弱体奪取(複)/Steal debuff (multiple)", "しやくたいた2", TAG_TYPE.ONE_SHOT, "弱体奪取/弱体解除/弱体解除(複)/弱体を複製(味方に)"]
  ,["弱体転写(全)/Transfer debuff (all)", "しやくたいた3", TAG_TYPE.ONE_SHOT, "弱体を貼付"]
  ,["弱体反射/Reflect Debuff", "しやくたいは", TAG_TYPE.BUFF, "弱体無効系"]
  ,["弱体無効/Nullify Debuff", "しやくたいむ", TAG_TYPE.BUFF, "弱体無効系"]
  ,["弱体を複製(味方に)/Copy debuff (to ally)", "しやくたいをふ1", TAG_TYPE.ONE_SHOT, ""]
  ,["弱体を複製(敵に)/Copy debuff (to enemy)", "しやくたいをふ2", TAG_TYPE.ONE_SHOT, ""]
  ,["弱体を貼付/Paste debuff", "しやくたいをち", TAG_TYPE.ONE_SHOT, ""]
  ,["弱点/Weakness", "しやくて", TAG_TYPE.DEBUFF, "防御減少系"]
  ,["集中/Concentration", "しゆう", TAG_TYPE.BUFF, "攻撃増加系/発動率増加系"]
  ,["祝福/Blessing", "しゆく", TAG_TYPE.BUFF, "HP回復系"]
  ,["祝福時強化", "しゆくしき", TAG_TYPE.IRREMOVABLE_BUFF, "攻撃増加系"]
  ,["祝福時弱化[メフィストフェレス]/祝福時弱化[Mephistopheles]", "しゆくししめふ", TAG_TYPE.IRREMOVABLE_DEBUFF, "HP減少系"]
  ,["守護/Protection", "しゆこ", TAG_TYPE.BUFF, "防御増加系"]
  ,["守護に貫通/Ignore Protection", "しゆこにか", TAG_TYPE.STATIC, "特攻/貫通系"]
  ,["守護無効化", "しゆこむこ", TAG_TYPE.IRREMOVABLE_DEBUFF, "防御減少系"]
  ,["滋養/Nourishment", "しよ", TAG_TYPE.BUFF, "攻撃増加系/HP回復系"]
  ,["滋養時強化[アシガラ]/滋養時強化[Ashigara]", "しよしきあし", TAG_TYPE.IRREMOVABLE_BUFF, "攻撃増加系/防御増加系"]
  ,["スキル封印/Skill Lock", "すきるふ", TAG_TYPE.DEBUFF, "スキル封印系"]
  ,["聖油/Unction", "せい", TAG_TYPE.BUFF, "防御増加系/HP回復系"]
  ,["聖油時弱化", "せいしし", TAG_TYPE.IRREMOVABLE_DEBUFF, "防御減少系"]
  ,["聖油に貫通/Ignore Unction", "せいにか", TAG_TYPE.STATIC, "特攻/貫通系"]
  ,["全方向移動力増加/Movement expansion in all directions", "せん1", TAG_TYPE.BUFF, "移動力増加系"]
  ,["全方向移動力大増", "せん2", TAG_TYPE.IRREMOVABLE_BUFF, "移動力増加系"]
  ,["束縛/Bind", "そく", TAG_TYPE.DEBUFF, "攻撃減少系/スキル封印系"]
  ,["束縛時強化", "そくしき", TAG_TYPE.IRREMOVABLE_BUFF, "攻撃増加系"]
  ,["脱力/Drain", "たつ", TAG_TYPE.DEBUFF, "CP減少系/発動率減少系"]
  ,["注目/Taunt", "ちゆ", TAG_TYPE.BUFF, ""]
  ,["注目時強化", "ちゆしき", TAG_TYPE.IRREMOVABLE_BUFF, "発動率増加系"]
  ,["デメリット[0.25]", "てめ", TAG_TYPE.STATIC, ""]
  ,["凍結/Freeze", "とうけ", TAG_TYPE.DEBUFF, "防御減少系/HP減少系"]
  ,["凍結時弱化", "とうけしし", TAG_TYPE.IRREMOVABLE_DEBUFF, "発動率減少系"]
  ,["闘志/Vigor", "とうし", TAG_TYPE.BUFF, "攻撃増加系"]
  ,["毒/Poison", "とく", TAG_TYPE.DEBUFF, "HP減少系"]
  ,["毒反転/Poison Reversal", "とくは", TAG_TYPE.BUFF, "攻撃増加系/防御増加系/HP回復系"]
  ,["特防/D.Bonus", "とくほ", TAG_TYPE.STATIC]
  ,["特防[0.3]/D.Bonus[0.3]", "とくほ3", TAG_TYPE.STATIC, "特防"]
  ,["特防[0.5]/D.Bonus[0.5]", "とくほ5", TAG_TYPE.STATIC, "特防"]
  ,["特防[0.6]/D.Bonus[0.6]", "とくほ6", TAG_TYPE.STATIC, "特防"]
  ,["特防[0.7]/D.Bonus[0.7]", "とくほ7", TAG_TYPE.STATIC, "特防"]
  ,["特防[0.8]/D.Bonus[0.8]", "とくほ8", TAG_TYPE.STATIC, "特防"]
  ,["特攻/A.Bonus", "とつ", TAG_TYPE.STATIC]
  ,["特攻[1.3]/A.Bonus[1.3]", "とつ13", TAG_TYPE.STATIC, "特攻"]
  ,["特攻[1.4]/A.Bonus[1.4]", "とつ14", TAG_TYPE.STATIC, "特攻"]
  ,["特攻[1.5]/A.Bonus[1.5]", "とつ15", TAG_TYPE.STATIC, "特攻"]
  ,["特攻[1.6]/A.Bonus[1.6]", "とつ16", TAG_TYPE.STATIC, "特攻"]
  ,["特攻[1.67]/A.Bonus[1.67]", "とつ167", TAG_TYPE.STATIC, "特攻"]
  ,["特攻[2.0]/A.Bonus[2.0]", "とつ2", TAG_TYPE.STATIC, "特攻"]
  ,["特攻[2.3]/A.Bonus[2.3]", "とつ23", TAG_TYPE.STATIC, "特攻"]
  ,["特攻[2.5]/A.Bonus[2.5]", "とつ25", TAG_TYPE.STATIC, "特攻"]
  ,["特攻[3.0]/A.Bonus[3.0]", "とつ3", TAG_TYPE.STATIC, "特攻"]
  ,["特攻[4.0]/A.Bonus[4.0]", "とつ4", TAG_TYPE.STATIC, "特攻"]
  ,["特攻[6.0]/A.Bonus[6.0]", "とつ6", TAG_TYPE.STATIC, "特攻"]
  ,["二重封印/Double Lock", "にし", TAG_TYPE.DEBUFF, "スキル封印系/CS封印系"]
  ,["熱情/Ardor", "ねつ", TAG_TYPE.BUFF, "攻撃増加系/CP増加系"]
  ,["呪い/Curse", "のろ", TAG_TYPE.DEBUFF, "攻撃減少系"]
  ,["呪い時強化", "のろしき", TAG_TYPE.IRREMOVABLE_BUFF, "攻撃増加系"]
  ,["発狂", "はつ", TAG_TYPE.DEBUFF, "防御減少系"]
  ,["非加速時強化", "ひか", TAG_TYPE.IRREMOVABLE_BUFF, "防御増加系"]
  ,["引き寄せ/Draw", "ひきよせ", TAG_TYPE.ONE_SHOT]
  ,["引き寄せ(1マス)/Draw (1 square)", "ひきよせ1", TAG_TYPE.ONE_SHOT, "強制移動系/引き寄せ"]
  ,["引き寄せ(2マス)/Draw (2 squares)", "ひきよせ2", TAG_TYPE.ONE_SHOT, "強制移動系/引き寄せ"]
  ,["引き寄せ(3マス)/Draw (3 squares)", "ひきよせ3", TAG_TYPE.ONE_SHOT, "強制移動系/引き寄せ"]
  ,["引き寄せ(4マス)/Draw (4 squares)", "ひきよせ4", TAG_TYPE.ONE_SHOT, "強制移動系/引き寄せ"]
  ,["非祈り時強化", "ひい", TAG_TYPE.IRREMOVABLE_BUFF, "攻撃増加系"]
  ,["非強化時弱化", "ひきよう", TAG_TYPE.IRREMOVABLE_DEBUFF, "防御減少系"]
  ,["非根性時強化", "ひこ", TAG_TYPE.IRREMOVABLE_BUFF, "防御増加系"]
  ,["非弱体時強化", "ひししき", TAG_TYPE.IRREMOVABLE_BUFF, "発動率増加系"]
  ,["非弱体時弱化", "ひししし", TAG_TYPE.IRREMOVABLE_DEBUFF, "攻撃減少系/防御減少系"]
  ,["非憑依時弱化", "ひひ", TAG_TYPE.IRREMOVABLE_DEBUFF, "攻撃減少系"]
  ,["憑依/Possession", "ひよ", TAG_TYPE.DEBUFF, ""]
  ,["憑依時強化", "ひよしき", TAG_TYPE.IRREMOVABLE_BUFF, "攻撃増加系"]
  ,["閃き/Glint", "ひら", TAG_TYPE.BUFF, "発動率増加系"]
  ,["武器種変更/Change Weapon Type", "ふきし", TAG_TYPE.BUFF]
  ,["武器種変更：斬撃/Change Weapon Type: Slash", "ふきし1", TAG_TYPE.CWT, "武器種変更"]
  ,["武器種変更：突撃/Change Weapon Type: Trust", "ふきし2", TAG_TYPE.CWT, "武器種変更"]
  ,["武器種変更：打撃/Change Weapon Type: Blow", "ふきし3", TAG_TYPE.CWT, "武器種変更"]
  ,["武器種変更：魔法/Change Weapon Type: Magic", "ふきし5", TAG_TYPE.CWT, "武器種変更"]
  ,["武器種変更：横一文字/Change Weapon Type: Long Slash", "ふきし6", TAG_TYPE.CWT, "武器種変更"]
  ,["武器種変更：狙撃/Change Weapon Type: Snipe", "ふきし7", TAG_TYPE.CWT, "武器種変更"]
  ,["武器種変更：全域/Change Weapon Type: All", "ふきし8", TAG_TYPE.CWT, "武器種変更"]
  ,["武器種変更：無/Change Weapon Type: None", "ふきし9", TAG_TYPE.CWT, "武器種変更"]
  ,["吹き飛ばし(縦)/Blast (back)", "ふきと1", TAG_TYPE.ONE_SHOT]
  ,["吹き飛ばし(1マス)/Blast (1 square)", "ふきと11", TAG_TYPE.ONE_SHOT, "強制移動系/吹き飛ばし(縦)"]
  ,["吹き飛ばし(2マス)/Blast (2 squares)", "ふきと12", TAG_TYPE.ONE_SHOT, "強制移動系/吹き飛ばし(縦)"]
  ,["吹き飛ばし(3マス)/Blast (3 squares)", "ふきと13", TAG_TYPE.ONE_SHOT, "強制移動系/吹き飛ばし(縦)"]
  ,["吹き飛ばし(右)/Blast (right)", "ふきと2", TAG_TYPE.ONE_SHOT, "強制移動系"]
  ,["吹き飛ばし(左)/Blast (left)", "ふきと3", TAG_TYPE.ONE_SHOT, "強制移動系"]
  ,["不動/Immobility", "ふと", TAG_TYPE.BUFF, "CP増加系/移動封印系"]
  ,["奮起/Arousal", "ふん", TAG_TYPE.BUFF, "CP増加系"]
  ,["妨害/Obstruct", "ほうか", TAG_TYPE.DEBUFF, "発動率減少系"]
  ,["防御強化/DEF Up", "ほうき", TAG_TYPE.BUFF, "防御増加系"]
  ,["防御強化に貫通/Ignore DEF Up", "ほうきにk", TAG_TYPE.STATIC, "特攻/貫通系"]
  ,["防御強化無効化", "ほうきむこ", TAG_TYPE.IRREMOVABLE_DEBUFF, "防御減少系"]
  ,["暴走/Berserk", "ほうそ", TAG_TYPE.BUFF, "攻撃増加系/防御減少系", "暴走+"]
  ,["暴走+/Berserk+", "ほうそ+", TAG_TYPE.BUFF, "攻撃増加系/防御減少系"]
  ,["暴走時強化", "ほうそしき", TAG_TYPE.IRREMOVABLE_BUFF, "発動率増加系"]
  ,["暴走+時強化", "ほうそしき+", TAG_TYPE.IRREMOVABLE_BUFF, "攻撃増加系/防御増加系"]
  ,["マヒ/Paralysis", "まひ", TAG_TYPE.DEBUFF, "攻撃減少系/移動封印系"]
  ,["マヒ時弱化", "まひしし", TAG_TYPE.IRREMOVABLE_DEBUFF, "発動率減少系"]
  ,["魅了/Charm", "みり", TAG_TYPE.DEBUFF, ""]
  ,["魅了時弱化[シヴァ]/魅了時弱化[Shiva]", "みりしししう", TAG_TYPE.IRREMOVABLE_DEBUFF, "発動率減少系"]
  ,["無窮/Infinitude", "むき", TAG_TYPE.BUFF, "攻撃増加系/HP減少系"]
  ,["猛毒/Fatal Poison", "もう", TAG_TYPE.DEBUFF, "HP減少系"]
  ,["火傷/Burn", "やけ", TAG_TYPE.DEBUFF, "HP減少系"]
  ,["火傷時弱化", "やけしし", TAG_TYPE.IRREMOVABLE_DEBUFF, "防御減少系"]
  ,["友情時強化", "ゆう", TAG_TYPE.IRREMOVABLE_BUFF, "攻撃増加系"]
  ,["烙印/Stigma", "らく", TAG_TYPE.DEBUFF, "防御減少系/HP減少系"]
  ,["連撃/Combo", "れん", TAG_TYPE.BUFF, "攻撃増加系"]

  ,["斬撃/Slash", "", TAG_TYPE.WEAPON]
  ,["突撃/Thrust", "", TAG_TYPE.WEAPON]
  ,["打撃/Blow", "", TAG_TYPE.WEAPON]
  ,["射撃/Shot", "", TAG_TYPE.WEAPON]
  ,["魔法/Magic", "", TAG_TYPE.WEAPON]
  ,["狙撃/Snipe", "", TAG_TYPE.WEAPON]
  ,["横一文字/Long Slash", "", TAG_TYPE.WEAPON]
  ,["全域/All", "", TAG_TYPE.WEAPON]
  ,["無/None", "", TAG_TYPE.WEAPON]

  ,["鬼系スキル", "", TAG_TYPE.SKIP, "", "鬼道の衆/鬼道を束ねる者/鬼気迫る者"]
  ,["獣系スキル", "", TAG_TYPE.SKIP, "", "首狩りの獣/獣の末裔/獣皮を巻く者/黄昏に弾く獣/忠玉の八犬士/ラビリンスの獣"]
  ,["チートと名の付くスキル", "", TAG_TYPE.SKIP, "", "チート系勇者/チートなる者"]
  ,["魔王と名の付くスキル", "", TAG_TYPE.SKIP, "", "僥倖の魔王/混沌の魔王/退廃の魔王/第四天魔王の子/大力の魔王/常闇の魔王/墓場の魔王/魔王"]

  ,["愛を囚う者/Love Trapper", "あい", TAG_TYPE.SKILL]
  ,["アスリート/Athlete", "あす", TAG_TYPE.SKILL, "", "歓呼のアスリート/直感のアスリート"]
  ,["海を航る者/Seafarer", "うみ", TAG_TYPE.SKILL]
  ,["泳達者/Swimmer", "えい", TAG_TYPE.SKILL]
  ,["大筒の支配者", "おお", TAG_TYPE.SKILL]
  ,["歓呼のアスリート", "かん", TAG_TYPE.SKILL]
  ,["鬼気迫る者/Frightful Imp", "きき", TAG_TYPE.SKILL]
  ,["鬼道の衆/Oni Brethren", "きとうの", TAG_TYPE.SKILL]
  ,["鬼道を束ねる者/Ruler of Ogres", "きとうを", TAG_TYPE.SKILL]
  ,["僥倖の魔王/Fortuitous Dark Lord", "きようこ", TAG_TYPE.SKILL]
  ,["狂戦士/Berserker", "きようせ", TAG_TYPE.SKILL]
  ,["巨人なる者/Giant", "きよし", TAG_TYPE.SKILL]
  ,["首狩りの獣/Head Hunter", "くひ", TAG_TYPE.SKILL]
  ,["獣の末裔/Blood of the Beast", "けも", TAG_TYPE.SKILL, "", "首狩りの獣/黄昏に弾く獣/忠玉の八犬士/ラビリンスの獣"]
  ,["骨肉の天地創造者/Creator of Flesh and Bone", "こつ", TAG_TYPE.SKILL]
  ,["混沌の魔王/Lord of Chaos", "こん", TAG_TYPE.SKILL]
  ,["支配者/Ruler", "しは", TAG_TYPE.SKILL, "", "大筒の支配者"]
  ,["島に生きる者/Islander", "しま", TAG_TYPE.SKILL]
  ,["獣皮を巻く者/In Beast's Clothing", "しゆう", TAG_TYPE.SKILL]
  ,["須弥山に篭る者/Mt.Meru Dweller", "しゆみ", TAG_TYPE.SKILL]
  ,["戦争屋/Warmonger", "せん", TAG_TYPE.SKILL]
  ,["大雪山に篭る者", "たいせ", TAG_TYPE.SKILL]
  ,["退廃の魔王", "たいは", TAG_TYPE.SKILL]
  ,["第四天魔王の子/Daughter of the Fourth Heaven", "たいよ", TAG_TYPE.SKILL]
  ,["大力の魔王/Hulking Lord", "たいり", TAG_TYPE.SKILL]
  ,["黄昏に弾く獣/Wolf of Ragnarok", "たそ", TAG_TYPE.SKILL]
  ,["祟られし者/The Cursed", "たた", TAG_TYPE.SKILL]
  ,["チート系勇者", "ちいとけ", TAG_TYPE.SKILL]
  ,["チートなる者", "ちいとな", TAG_TYPE.SKILL]
  ,["忠玉の八犬士/Loyal Dog Warrior", "ちゆ", TAG_TYPE.SKILL]
  ,["直感のアスリート/Intuitive Athlete", "ちよ", TAG_TYPE.SKILL]
  ,["翼持つ者/Winged One", "つは", TAG_TYPE.SKILL]
  ,["天地創造者/Creator", "てん", TAG_TYPE.SKILL, "", "骨肉の天地創造者"]
  ,["常闇の魔王/Lord of Eternal Darkness", "とこ", TAG_TYPE.SKILL]
  ,["轟き奔る者", "ととろき", TAG_TYPE.SKILL]
  ,["轟く者/Thunderer", "ととろく", TAG_TYPE.SKILL, "", "轟き奔る者"]
  ,["墓場の魔王/Lord of the Graveyard", "はか", TAG_TYPE.SKILL]
  ,["不死身なる者/Immortal", "ふしみな", TAG_TYPE.SKILL, "", "不死身の密林王"]
  ,["不死身の密林王", "ふしみの", TAG_TYPE.SKILL]
  ,["魔王/Dark Lord", "まお", TAG_TYPE.SKILL, "", "第四天魔王の子"]
  ,["マシンボディ/Mechaman", "まし", TAG_TYPE.SKILL]
  ,["緑を育む者/Gardener", "みと", TAG_TYPE.SKILL]
  ,["山に篭る者/Mountain Dweller", "やま", TAG_TYPE.SKILL, "", "須弥山に篭る者/大雪山に篭る者"]
  ,["有尾の悪魔/Tailed Demon", "ゆう", TAG_TYPE.SKILL]
  ,["雷光を現す者/Living Lightning", "らい", TAG_TYPE.SKILL]
  ,["ラビリンスの獣/Beast of the Labyrinth", "らひ", TAG_TYPE.SKILL]
  ,["竜を継ぐ者/Dragonborn", "りゆ", TAG_TYPE.SKILL]
  ,["霊体/Wraith", "れい", TAG_TYPE.SKILL]

  ,["攻撃増加系/ATK Up", "こう1", TAG_TYPE.CATEGORY]
  ,["攻撃減少系/ATK Down", "こう2", TAG_TYPE.CATEGORY]
  ,["防御増加系/DEF Up", "ほう1き", TAG_TYPE.CATEGORY]
  ,["防御減少系/DEF Down", "ほうき2", TAG_TYPE.CATEGORY]
  ,["HP回復系/Restore HP", "HP1", TAG_TYPE.CATEGORY]
  ,["HP減少系/Decrease HP", "HP2", TAG_TYPE.CATEGORY]
  ,["CP増加系/Increase CP", "CP1", TAG_TYPE.CATEGORY]
  ,["CP減少系/Deplete CP", "CP2", TAG_TYPE.CATEGORY]
  ,["弱体無効系/Nullify Debuff", "しや", TAG_TYPE.CATEGORY]
  ,["発動率増加系/Increase Probability", "はつ1", TAG_TYPE.CATEGORY]
  ,["発動率減少系/Decrease Probability", "はつ2", TAG_TYPE.CATEGORY]
  ,["移動力増加系/Movement Expansion", "いとうり1", TAG_TYPE.CATEGORY]
  ,["強制移動系/Forced Move", "きよ", TAG_TYPE.CATEGORY]
  ,["移動封印系/Move Lock", "いとうふ", TAG_TYPE.CATEGORY]
  ,["スキル封印系/Skill Lock", "すき", TAG_TYPE.CATEGORY]
  ,["CS封印系/CS Lock", "CS", TAG_TYPE.CATEGORY]
  ,["貫通系/Ignore", "かん", TAG_TYPE.CATEGORY]
  ,["強化/Buff", "ん", TAG_TYPE.CATEGORY]
  ,["弱体/Debuff", "ん", TAG_TYPE.CATEGORY]

  ,["CS威力増加/Increase CS Damage", "CSい", TAG_TYPE.STATIC, ""]
  ,["CS威力増加(+1)/Increase CS Damage (+1)", "CSい1", TAG_TYPE.STATIC, "CS威力増加"]
  ,["CS威力増加(+2)/Increase CS Damage (+2)", "CSい2", TAG_TYPE.STATIC, "CS威力増加"]
  ,["獲得経験値集約", "かくけいし", TAG_TYPE.STATIC, "報酬増加系"]
  ,["獲得戦友ポイントアップ", "かくせん", TAG_TYPE.STATIC, "報酬増加系"]
  ,["獲得ランク経験値アップ", "かくらん", TAG_TYPE.STATIC, "報酬増加系"]
  ,["暴走時防御強化", "ほうそしほ", TAG_TYPE.IRREMOVABLE_BUFF, "防御増加系"]
  ,["暴走+時防御強化", "ほうそしほ+", TAG_TYPE.IRREMOVABLE_BUFF, "防御増加系"]
  ,["魅了時弱化[AR]", "みりししAR", TAG_TYPE.IRREMOVABLE_DEBUFF, "防御減少系"]
  ,["報酬増加系/Bonus Upon Victory", "ほうし", TAG_TYPE.CATEGORY]
  ,["滋養時強化[AR]", "しよしきAR", TAG_TYPE.IRREMOVABLE_BUFF, "防御増加系"]
  ,["非妨害時弱化", "ひほ", TAG_TYPE.IRREMOVABLE_DEBUFF, "防御減少系"]
  ,["祝福時弱化[サンダユウ]/祝福時弱化[Sandayu]", "しゆくししさん", TAG_TYPE.IRREMOVABLE_DEBUFF, "発動率減少系"]
  ,["滋養時弱化", "しよしし", TAG_TYPE.IRREMOVABLE_DEBUFF, "発動率減少系"]
  ,["移動力減少", "いとけん", TAG_TYPE.STATIC]
  ,["移動力減少(全)", "いとけん3", TAG_TYPE.STATIC, "移動力減少"]
  ,["魅了時弱化[カトブレパス]/魅了時弱化[Catoblepas]", "みりししかと", TAG_TYPE.IRREMOVABLE_DEBUFF, "防御減少系"]
  ,["暗闇時弱化", "くらしし", TAG_TYPE.IRREMOVABLE_DEBUFF, "発動率減少系"]
  ,["スキル発動率激増", "すきるは", TAG_TYPE.BUFF, "発動率増加系"]
  ,["HPが回復する状態", "HPか", TAG_TYPE.STATUS_GROUP, "", "再生/祝福/滋養/聖油"]
  ,["HPが減少する弱体", "HPけ", TAG_TYPE.STATUS_GROUP, "", "告死/凍結/毒/猛毒/火傷/烙印"]
  ,["特攻[1.2]/A.Bonus[1.2]", "とつ12", TAG_TYPE.STATIC, "特攻"]
]);

var TAG_FLAG_NUM = {
  SELF: 0,
  ALLY: 1,
  ENEMY: 2,
  BONUS_A: 3,
  BONUS_D: 4,
  NULLIFY: 5,
  STATIC: 6
};

function generateTagData(s, flagNum, arTiming){
  var z = [];
  var r = new Map();
  s.forEach(function(x){
    var sf = (x[0].slice(0, 3) !== "全ての");
    var v = x[1];
    var tag = TAG[v];
    var timing = arTiming || x[2];
    var g = 0;
    if(timing & TIMING_FLAG.CS){
      g = TAG_MAX;
      if(timing & TIMING_FLAG.NOT_CS){
        timing = timing & TIMING_FLAG.NOT_CS;
      }
    }
    if(tag.type !== TAG_TYPE.CATEGORY){
      var f = (tag.type === TAG_TYPE.STATIC) ? TAG_FLAG_NUM.STATIC : flagNum;
      var b = (f < 3) ? timing : (timing || 1);
      if(tag.type !== TAG_TYPE.SKIP){
        if(r.has(v + g)){
          r.set(v + g, r.get(v + g) | timing);
        }else{
          r.set(v + g, timing);
        }
        tag.setFlag(f, b);
      }
      (flagNum < 3 ? tag.category : tag.subset).forEach(function(c){
        if(r.has(c + g)){
          r.set(c + g, r.get(c + g) | timing);
        }else{
          r.set(c + g, timing);
        }
        if(sf) TAG[c].setFlag(f, b);
      });
    }
  });
  r.forEach(function(value, key){
    z.push([key, value]);
  });
  return z;
}
