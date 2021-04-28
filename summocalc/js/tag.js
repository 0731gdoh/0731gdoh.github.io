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
  CWT: 11
};

function Tag(index, x, category, subset){
  this.index = index;
  this.name = x[0];
  this.type = x[1];
  this.category = category;
  this.subset = subset;
  this.flags = [];
  if(index < 3){
    this.sortkey = 0;
  }else if(x[1] === TAG_TYPE.WEAPON){
    this.sortkey = 2;
  }else if(x[1] === TAG_TYPE.SKILL){
    this.sortkey = 3;
  }else if(x[1] === TAG_TYPE.CATEGORY){
    this.sortkey = 4;
  }else{
    this.sortkey = 1;
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
  var f = function(x){
    return table.get(x);
  };
  var buff = [];
  var debuff = [];
  var result = [];
  var order = [[], []];
  var k = [];
  a.forEach(function(v, i){
    table.set(t(v[0], 0), i);
    order[0].push(i);
    order[1].push(i);
    if(v[1] === TAG_TYPE.BUFF) buff.push(i);
    if(v[1] === TAG_TYPE.DEBUFF) debuff.push(i);
  });
  a.forEach(function(v, i){
    var c = [];
    var s = [];
    switch(v[0]){
      case "全ての強化/All buffs":
        s = buff;
        break;
      case "全ての弱体/All debuffs":
        s = debuff;
        break;
      default:
        if(v[2]) c = v[2].split("/").map(f);
        if(v[3]) s = v[3].split("/").map(f);
    }
    switch(v[1]){
      case TAG_TYPE.BUFF:
      case TAG_TYPE.IRREMOVABLE_BUFF:
      case TAG_TYPE.CCT:
      case TAG_TYPE.CWT:
        c.push(table.get("強化"));
        break;
      case TAG_TYPE.DEBUFF:
      case TAG_TYPE.IRREMOVABLE_DEBUFF:
        c.push(table.get("弱体"));
    }
    result.push(new Tag(i, v, c, s));
    k.push(t(v[0], 1).replace(/ *[\(:].+/, ""));
  });
  order[1].sort(function(a, b){
    var x = result[a];
    var y = result[b];
    if(x.sortkey !== y.sortkey) return x.sortkey - y.sortkey;
    if(!(x.sortkey & 1) || k[a] === k[b]) return x.index - y.index;
    return k[a] < k[b] ? -1 : 1;
  });
  result.ORDER = order;
  result.table = table;
  return result;
};

var TAG_MAX = 10000;

var TAG = Tag.createList(
  [["", TAG_TYPE.CATEGORY]
  ,["全ての強化/All buffs", TAG_TYPE.IRREMOVABLE_BUFF]
  ,["全ての弱体/All debuffs", TAG_TYPE.IRREMOVABLE_DEBUFF]
  ,["移動不能状態", TAG_TYPE.SKIP, "", "威圧/恐怖/崩し/不動/マヒ"]
  ,["攻撃力低下状態", TAG_TYPE.SKIP, "", "強化反転/暗闇/幻惑/束縛/呪い/マヒ"]
  ,["スキル封印状態", TAG_TYPE.SKIP, "", "スキル封印/束縛/二重封印"]
  ,["被ダメージ増加状態", TAG_TYPE.SKIP, "", "強化反転/崩し/激怒/激怒+/弱点/凍結/暴走/暴走+/烙印"]
  ,["防御力増加状態", TAG_TYPE.SKIP, "", "頑強/金剛/守護/聖油/防御強化"]
  ,["CP減少/Deplete CP", TAG_TYPE.ONE_SHOT, "CP減少系"]
  ,["CP増加/Increase CP", TAG_TYPE.ONE_SHOT, "CP増加系"]
  ,["CS封印/CS Lock", TAG_TYPE.DEBUFF, "CS封印系"]
  ,["CS変更/Change CS Type", TAG_TYPE.BUFF]
  ,["CS変更：打撃/Change CS Type: Blow", TAG_TYPE.CCT, "CS変更"]
  ,["CS変更：魔法/Change CS Type: Magic", TAG_TYPE.CCT, "CS変更"]
  ,["CS変更：横一文字/Change CS Type: Long Slash", TAG_TYPE.CCT, "CS変更"]
  ,["CS変更：全域/Change CS Type: All", TAG_TYPE.CCT, "CS変更"]
  ,["HP回復/Restore HP", TAG_TYPE.ONE_SHOT, "HP回復系"]
  ,["HP減少/Decrease HP", TAG_TYPE.ONE_SHOT, "HP減少系"]
  ,["悪魔の契約", TAG_TYPE.IRREMOVABLE_BUFF, "攻撃増加系/防御増加系/CP増加系"]
  ,["威圧/Oppression", TAG_TYPE.DEBUFF, "移動封印系"]
  ,["怒時強化", TAG_TYPE.IRREMOVABLE_BUFF, "攻撃増加系"]
  ,["意気/Spirit", TAG_TYPE.BUFF, "攻撃増加系"]
  ,["移動力増加/Increase movement", TAG_TYPE.STATIC]
  ,["移動力増加(縦)/Increase movement (vertical)", TAG_TYPE.STATIC, "移動力増加"]
  ,["移動力増加(横)/Increase movement (horizontal)", TAG_TYPE.STATIC, "移動力増加"]
  ,["移動力増加(全)/Increase movement (all)", TAG_TYPE.STATIC, "移動力増加/移動力増加(縦)/移動力増加(横)"]
  ,["祈り/Prayer", TAG_TYPE.BUFF, "発動率増加系"]
  ,["祈り時強化", TAG_TYPE.IRREMOVABLE_BUFF, "HP回復系"]
  ,["温泉/Hot Springs", TAG_TYPE.IRREMOVABLE_BUFF, "CP増加系"]
  ,["回避/Evasion", TAG_TYPE.BUFF, "防御増加系"]
  ,["回避時強化", TAG_TYPE.IRREMOVABLE_BUFF, "発動率増加系"]
  ,["回避に貫通/Ignore Evasion", TAG_TYPE.STATIC, "特攻/貫通系"]
  ,["獲得経験値アップ/XP Bonus", TAG_TYPE.STATIC, ""]
  ,["獲得コインアップ/Coin Bonus", TAG_TYPE.STATIC, ""]
  ,["加速/Acceleration", TAG_TYPE.BUFF, "CP増加系"]
  ,["加速時強化", TAG_TYPE.IRREMOVABLE_BUFF, "発動率増加系"]
  ,["頑強/Tenacity", TAG_TYPE.BUFF, "防御増加系"]
  ,["頑強に貫通/Ignore Tenacity", TAG_TYPE.STATIC, "特攻/貫通系"]
  ,["疑念", TAG_TYPE.DEBUFF, "攻撃増加系/攻撃減少系"]
  ,["強化解除/Remove buff", TAG_TYPE.ONE_SHOT]
  ,["強化解除(単)/Remove buff (single)", TAG_TYPE.ONE_SHOT, "強化解除"]
  ,["強化解除(複)/Remove buff (multiple)", TAG_TYPE.ONE_SHOT, "強化解除"]
  ,["強化解除(全)/Remove buff (all)", TAG_TYPE.ONE_SHOT, "強化解除"]
  ,["強化奪取/Steal buff", TAG_TYPE.ONE_SHOT]
  ,["強化奪取(単)/Steal buff (single)", TAG_TYPE.ONE_SHOT, "強化奪取/強化解除/強化解除(単)/強化を複製"]
  ,["強化奪取(複)/Steal buff (multiple)", TAG_TYPE.ONE_SHOT, "強化奪取/強化解除/強化解除(複)/強化を複製"]
  ,["強化転写/Transfer buff", TAG_TYPE.ONE_SHOT]
  ,["強化転写(複)/Transfer buff (multiple)", TAG_TYPE.ONE_SHOT, "強化転写"]
  ,["強化転写(全)/Transfer buff (all)", TAG_TYPE.ONE_SHOT, "強化転写"]
  ,["強化反転", TAG_TYPE.DEBUFF, "攻撃減少系/防御減少系"]
  ,["強化無効/Nullify Buff", TAG_TYPE.DEBUFF, ""]
  ,["強化を複製/Copy buff", TAG_TYPE.ONE_SHOT, ""]
  ,["強化を貼付(味方から)/Paste buff (from ally)", TAG_TYPE.ONE_SHOT, ""]
  ,["強化を貼付(敵から)/Paste buff (from enemy)", TAG_TYPE.ONE_SHOT, ""]
  ,["強制移動無効(後)/Nullify forced movement (backward)", TAG_TYPE.STATIC, ""]
  ,["強制移動無効(全)/Nullify forced movement (all)", TAG_TYPE.STATIC, "強制移動無効(後)"]
  ,["恐怖/Fear", TAG_TYPE.DEBUFF, "CP減少系/移動封印系"]
  ,["極限/Limit", TAG_TYPE.BUFF, "攻撃増加系"]
  ,["崩し/Break", TAG_TYPE.DEBUFF, "防御減少系/移動封印系"]
  ,["暗闇/Darkness", TAG_TYPE.DEBUFF, "攻撃減少系/CS封印系"]
  ,["暗闇時強化", TAG_TYPE.IRREMOVABLE_BUFF, "攻撃増加系/防御増加系"]
  ,["クリティカル/Crit", TAG_TYPE.BUFF, "攻撃増加系"]
  ,["クリティカル強化", TAG_TYPE.IRREMOVABLE_BUFF, "攻撃増加系"]
  ,["クリティカル+/Crit+", TAG_TYPE.BUFF, "攻撃増加系"]
  ,["クリティカル++/Crit++", TAG_TYPE.BUFF, "攻撃増加系"]
  ,["契約の代償", TAG_TYPE.IRREMOVABLE_DEBUFF, "防御減少系/発動率減少系"]
  ,["係留/Anchor", TAG_TYPE.BUFF, ""]
  ,["激怒/Rage", TAG_TYPE.BUFF, "攻撃増加系/防御減少系", "激怒+"]
  ,["激怒+/Rage+", TAG_TYPE.BUFF, "攻撃増加系/防御減少系"]
  ,["激怒+時強化", TAG_TYPE.IRREMOVABLE_BUFF, "発動率増加系"]
  ,["幻惑/Dazzle", TAG_TYPE.DEBUFF, "攻撃減少系"]
  ,["劫火", TAG_TYPE.DEBUFF, "防御減少系"]
  ,["攻撃強化/ATK Up", TAG_TYPE.BUFF, "攻撃増加系"]
  ,["攻撃力減少", TAG_TYPE.IRREMOVABLE_DEBUFF, "攻撃減少系"]
  ,["攻撃力低下", TAG_TYPE.IRREMOVABLE_DEBUFF, "攻撃減少系"]
  ,["攻撃力微増[1.13]", TAG_TYPE.IRREMOVABLE_BUFF, "攻撃増加系"]
  ,["攻撃力微増[1.2]", TAG_TYPE.IRREMOVABLE_BUFF, "攻撃増加系"]
  ,["剛力/Brawn", TAG_TYPE.BUFF, "攻撃増加系"]
  ,["剛力時強化", TAG_TYPE.IRREMOVABLE_BUFF, "攻撃増加系"]
  ,["告死/Countdown", TAG_TYPE.DEBUFF, "HP減少系"]
  ,["金剛/Adamantine", TAG_TYPE.BUFF, "防御増加系"]
  ,["金剛時強化", TAG_TYPE.IRREMOVABLE_BUFF, "攻撃増加系"]
  ,["金剛に貫通/Ignore Adamantine", TAG_TYPE.STATIC, "特攻/貫通系"]
  ,["根性/Guts", TAG_TYPE.BUFF, ""]
  ,["根性時強化[1.5]", TAG_TYPE.IRREMOVABLE_BUFF, "攻撃増加系"]
  ,["根性時強化[2.0]", TAG_TYPE.IRREMOVABLE_BUFF, "攻撃増加系"]
  ,["再生/Regeneration", TAG_TYPE.BUFF, "HP回復系"]
  ,["弱体解除/Remove debuff", TAG_TYPE.ONE_SHOT]
  ,["弱体解除(単)/Remove debuff (single)", TAG_TYPE.ONE_SHOT, "弱体解除"]
  ,["弱体解除(複)/Remove debuff (multiple)", TAG_TYPE.ONE_SHOT, "弱体解除"]
  ,["弱体解除(全)/Remove debuff (all)", TAG_TYPE.ONE_SHOT, "弱体解除"]
  ,["弱体時強化[HP&CP]", TAG_TYPE.IRREMOVABLE_BUFF, "HP回復系/CP増加系"]
  ,["弱体時強化[防御]/弱体時強化[Defense]", TAG_TYPE.IRREMOVABLE_BUFF, "防御増加系"]
  ,["弱体奪取/Steal debuff", TAG_TYPE.ONE_SHOT]
  ,["弱体奪取(複)/Steal debuff (multiple)", TAG_TYPE.ONE_SHOT, "弱体奪取/弱体解除/弱体解除(複)/弱体を複製(味方に)"]
  ,["弱体転写(全)/Transfer debuff (all)", TAG_TYPE.ONE_SHOT, "弱体を貼付"]
  ,["弱体反射/Reflect Debuff", TAG_TYPE.BUFF, "弱体無効系"]
  ,["弱体無効/Nullify Debuff", TAG_TYPE.BUFF, "弱体無効系"]
  ,["弱体を複製(味方に)/Copy debuff (to ally)", TAG_TYPE.ONE_SHOT, ""]
  ,["弱体を複製(敵に)/Copy debuff (to enemy)", TAG_TYPE.ONE_SHOT, ""]
  ,["弱体を貼付/Paste debuff", TAG_TYPE.ONE_SHOT, ""]
  ,["弱点/Weakness", TAG_TYPE.DEBUFF, "防御減少系"]
  ,["集中/Concentration", TAG_TYPE.BUFF, "攻撃増加系/発動率増加系"]
  ,["祝福/Blessing", TAG_TYPE.BUFF, "HP回復系"]
  ,["祝福時強化", TAG_TYPE.IRREMOVABLE_BUFF, "攻撃増加系"]
  ,["祝福時弱化", TAG_TYPE.IRREMOVABLE_DEBUFF, "HP減少系"]
  ,["守護/Protection", TAG_TYPE.BUFF, "防御増加系"]
  ,["守護に貫通/Ignore Protection", TAG_TYPE.STATIC, "特攻/貫通系"]
  ,["守護無効化", TAG_TYPE.IRREMOVABLE_DEBUFF, "防御減少系"]
  ,["滋養/Nourishment", TAG_TYPE.BUFF, "攻撃増加系/HP回復系"]
  ,["スキル封印/Skill Lock", TAG_TYPE.DEBUFF, "スキル封印系"]
  ,["聖油/Unction", TAG_TYPE.BUFF, "防御増加系/HP回復系"]
  ,["聖油時弱化", TAG_TYPE.IRREMOVABLE_DEBUFF, "防御減少系"]
  ,["聖油に貫通/Ignore Unction", TAG_TYPE.STATIC, "特攻/貫通系"]
  ,["全方向移動力増加/Movement expansion in all directions", TAG_TYPE.BUFF, "移動力増加系"]
  ,["全方向移動力大増", TAG_TYPE.IRREMOVABLE_BUFF, "移動力増加系"]
  ,["束縛/Bind", TAG_TYPE.DEBUFF, "攻撃減少系/スキル封印系"]
  ,["束縛時強化", TAG_TYPE.IRREMOVABLE_BUFF, "攻撃増加系"]
  ,["脱力/Drain", TAG_TYPE.DEBUFF, "CP減少系/発動率減少系"]
  ,["注目/Taunt", TAG_TYPE.BUFF, ""]
  ,["注目時強化", TAG_TYPE.IRREMOVABLE_BUFF, "発動率増加系"]
  ,["デメリット[0.25]", TAG_TYPE.STATIC, ""]
  ,["凍結/Freeze", TAG_TYPE.DEBUFF, "防御減少系/HP減少系"]
  ,["凍結時弱化", TAG_TYPE.IRREMOVABLE_DEBUFF, "発動率減少系"]
  ,["闘志/Vigor", TAG_TYPE.BUFF, "攻撃増加系"]
  ,["毒/Poison", TAG_TYPE.DEBUFF, "HP減少系"]
  ,["毒反転/Poison Reversal", TAG_TYPE.BUFF, "攻撃増加系/防御増加系/HP回復系"]
  ,["特防/D.Bonus", TAG_TYPE.STATIC]
  ,["特防[0.3]/D.Bonus[0.3]", TAG_TYPE.STATIC, "特防"]
  ,["特防[0.5]/D.Bonus[0.5]", TAG_TYPE.STATIC, "特防"]
  ,["特防[0.6]/D.Bonus[0.6]", TAG_TYPE.STATIC, "特防"]
  ,["特防[0.7]/D.Bonus[0.7]", TAG_TYPE.STATIC, "特防"]
  ,["特防[0.8]/D.Bonus[0.8]", TAG_TYPE.STATIC, "特防"]
  ,["特攻/A.Bonus", TAG_TYPE.STATIC]
  ,["特攻[1.3]/A.Bonus[1.3]", TAG_TYPE.STATIC, "特攻"]
  ,["特攻[1.4]/A.Bonus[1.4]", TAG_TYPE.STATIC, "特攻"]
  ,["特攻[1.5]/A.Bonus[1.5]", TAG_TYPE.STATIC, "特攻"]
  ,["特攻[1.6]/A.Bonus[1.6]", TAG_TYPE.STATIC, "特攻"]
  ,["特攻[1.67]/A.Bonus[1.67]", TAG_TYPE.STATIC, "特攻"]
  ,["特攻[2.0]/A.Bonus[2.0]", TAG_TYPE.STATIC, "特攻"]
  ,["特攻[2.3]/A.Bonus[2.3]", TAG_TYPE.STATIC, "特攻"]
  ,["特攻[2.5]/A.Bonus[2.5]", TAG_TYPE.STATIC, "特攻"]
  ,["特攻[3.0]/A.Bonus[3.0]", TAG_TYPE.STATIC, "特攻"]
  ,["特攻[4.0]/A.Bonus[4.0]", TAG_TYPE.STATIC, "特攻"]
  ,["特攻[6.0]/A.Bonus[6.0]", TAG_TYPE.STATIC, "特攻"]
  ,["二重封印/Double Lock", TAG_TYPE.DEBUFF, "スキル封印系/CS封印系"]
  ,["熱情/Ardor", TAG_TYPE.BUFF, "攻撃増加系/CP増加系"]
  ,["呪い/Curse", TAG_TYPE.DEBUFF, "攻撃減少系"]
  ,["呪い時強化", TAG_TYPE.IRREMOVABLE_BUFF, "攻撃増加系"]
  ,["非加速時強化", TAG_TYPE.IRREMOVABLE_BUFF, "防御増加系"]
  ,["引き寄せ/Draw", TAG_TYPE.ONE_SHOT]
  ,["引き寄せ(1マス)/Draw (1 square)", TAG_TYPE.ONE_SHOT, "強制移動系/引き寄せ"]
  ,["引き寄せ(2マス)/Draw (2 squares)", TAG_TYPE.ONE_SHOT, "強制移動系/引き寄せ"]
  ,["引き寄せ(3マス)/Draw (3 squares)", TAG_TYPE.ONE_SHOT, "強制移動系/引き寄せ"]
  ,["引き寄せ(4マス)/Draw (4 squares)", TAG_TYPE.ONE_SHOT, "強制移動系/引き寄せ"]
  ,["非祈り時強化", TAG_TYPE.IRREMOVABLE_BUFF, "攻撃増加系"]
  ,["非強化時弱化", TAG_TYPE.IRREMOVABLE_DEBUFF, "防御減少系"]
  ,["非根性時強化", TAG_TYPE.IRREMOVABLE_BUFF, "防御増加系"]
  ,["非弱体時強化", TAG_TYPE.IRREMOVABLE_BUFF, "発動率増加系"]
  ,["非弱体時弱化", TAG_TYPE.IRREMOVABLE_DEBUFF, "攻撃減少系/防御減少系"]
  ,["非憑依時弱化", TAG_TYPE.IRREMOVABLE_DEBUFF, "攻撃減少系"]
  ,["憑依/Possession", TAG_TYPE.DEBUFF, ""]
  ,["憑依時強化", TAG_TYPE.IRREMOVABLE_BUFF, "攻撃増加系"]
  ,["閃き/Glint", TAG_TYPE.BUFF, "発動率増加系"]
  ,["武器種変更/Change Weapon Type", TAG_TYPE.BUFF]
  ,["武器種変更：斬撃/Change Weapon Type: Slash", TAG_TYPE.CWT, "武器種変更"]
  ,["武器種変更：突撃/Change Weapon Type: Trust", TAG_TYPE.CWT, "武器種変更"]
  ,["武器種変更：打撃/Change Weapon Type: Blow", TAG_TYPE.CWT, "武器種変更"]
  ,["武器種変更：魔法/Change Weapon Type: Magic", TAG_TYPE.CWT, "武器種変更"]
  ,["武器種変更：横一文字/Change Weapon Type: Long Slash", TAG_TYPE.CWT, "武器種変更"]
  ,["武器種変更：狙撃/Change Weapon Type: Snipe", TAG_TYPE.CWT, "武器種変更"]
  ,["武器種変更：全域/Change Weapon Type: All", TAG_TYPE.CWT, "武器種変更"]
  ,["武器種変更：無/Change Weapon Type: None", TAG_TYPE.CWT, "武器種変更"]
  ,["吹き飛ばし(縦)/Blast (back)", TAG_TYPE.ONE_SHOT]
  ,["吹き飛ばし(1マス)/Blast (1 square)", TAG_TYPE.ONE_SHOT, "強制移動系/吹き飛ばし(縦)"]
  ,["吹き飛ばし(2マス)/Blast (2 squares)", TAG_TYPE.ONE_SHOT, "強制移動系/吹き飛ばし(縦)"]
  ,["吹き飛ばし(3マス)/Blast (3 squares)", TAG_TYPE.ONE_SHOT, "強制移動系/吹き飛ばし(縦)"]
  ,["吹き飛ばし(右)/Blast (right)", TAG_TYPE.ONE_SHOT, "強制移動系"]
  ,["吹き飛ばし(左)/Blast (left)", TAG_TYPE.ONE_SHOT, "強制移動系"]
  ,["不動/Immobility", TAG_TYPE.BUFF, "CP増加系/移動封印系"]
  ,["奮起/Arousal", TAG_TYPE.BUFF, "CP増加系"]
  ,["妨害/Obstruct", TAG_TYPE.DEBUFF, "発動率減少系"]
  ,["防御強化/DEF Up", TAG_TYPE.BUFF, "防御増加系"]
  ,["防御強化に貫通/Ignore DEF Up", TAG_TYPE.STATIC, "特攻/貫通系"]
  ,["防御強化無効化", TAG_TYPE.IRREMOVABLE_DEBUFF, "防御減少系"]
  ,["暴走/Berserk", TAG_TYPE.BUFF, "攻撃増加系/防御減少系", "暴走+"]
  ,["暴走+/Berserk+", TAG_TYPE.BUFF, "攻撃増加系/防御減少系"]
  ,["暴走時強化", TAG_TYPE.IRREMOVABLE_BUFF, "発動率増加系"]
  ,["暴走+時強化", TAG_TYPE.IRREMOVABLE_BUFF, "攻撃増加系/防御増加系"]
  ,["マヒ/Paralysis", TAG_TYPE.DEBUFF, "攻撃減少系/移動封印系"]
  ,["魅了/Charm", TAG_TYPE.DEBUFF, ""]
  ,["魅了時弱化[発動率]", TAG_TYPE.IRREMOVABLE_DEBUFF, "発動率減少系"]
  ,["無窮/Infinitude", TAG_TYPE.BUFF, "攻撃増加系/HP減少系"]
  ,["猛毒/Fatal Poison", TAG_TYPE.DEBUFF, "HP減少系"]
  ,["火傷/Burn", TAG_TYPE.DEBUFF, "HP減少系"]
  ,["火傷時弱化", TAG_TYPE.IRREMOVABLE_DEBUFF, "防御減少系"]
  ,["友情時強化", TAG_TYPE.IRREMOVABLE_BUFF, "攻撃増加系"]
  ,["烙印/Stigma", TAG_TYPE.DEBUFF, "防御減少系/HP減少系"]
  ,["連撃/Combo", TAG_TYPE.BUFF, "攻撃増加系"]

  ,["斬撃/Slash", TAG_TYPE.WEAPON]
  ,["突撃/Thrust", TAG_TYPE.WEAPON]
  ,["打撃/Blow", TAG_TYPE.WEAPON]
  ,["射撃/Shot", TAG_TYPE.WEAPON]
  ,["魔法/Magic", TAG_TYPE.WEAPON]
  ,["狙撃/Snipe", TAG_TYPE.WEAPON]
  ,["横一文字/Long Slash", TAG_TYPE.WEAPON]
  ,["全域/All", TAG_TYPE.WEAPON]
  ,["無/None", TAG_TYPE.WEAPON]

  ,["鬼系スキル", TAG_TYPE.SKIP, "", "鬼道の衆/鬼道を束ねる者/鬼気迫る者"]
  ,["獣系スキル", TAG_TYPE.SKIP, "", "首狩りの獣/獣の末裔/獣皮を巻く者/黄昏に弾く獣/忠玉の八犬士"]
  ,["チート系スキル", TAG_TYPE.SKIP, "", "チート系勇者/チートなる者"]
  ,["魔王系スキル", TAG_TYPE.SKIP, "", "僥倖の魔王/混沌の魔王/退廃の魔王/第四天魔王の子/大力の魔王/常闇の魔王/墓場の魔王/魔王"]

  ,["愛を囚う者/Love Trapper", TAG_TYPE.SKILL]
  ,["アスリート/Athlete", TAG_TYPE.SKILL, "", "歓呼のアスリート/直感のアスリート"]
  ,["海を航る者/Seafarer", TAG_TYPE.SKILL]
  ,["泳達者/Swimmer", TAG_TYPE.SKILL]
  ,["大筒の支配者", TAG_TYPE.SKILL]
  ,["歓呼のアスリート", TAG_TYPE.SKILL]
  ,["鬼気迫る者/Frightful Imp", TAG_TYPE.SKILL]
  ,["鬼道の衆/Oni Brethren", TAG_TYPE.SKILL]
  ,["鬼道を束ねる者/Ruler of Ogres", TAG_TYPE.SKILL]
  ,["僥倖の魔王/Fortuitous Dark Lord", TAG_TYPE.SKILL]
  ,["狂戦士/Berserker", TAG_TYPE.SKILL]
  ,["巨人なる者/Giant", TAG_TYPE.SKILL]
  ,["首狩りの獣/Head Hunter", TAG_TYPE.SKILL]
  ,["獣の末裔/Blood of the Beast", TAG_TYPE.SKILL, "", "首狩りの獣/黄昏に弾く獣/忠玉の八犬士"]
  ,["混沌の魔王/Lord of Chaos", TAG_TYPE.SKILL]
  ,["支配者/Ruler", TAG_TYPE.SKILL, "", "大筒の支配者"]
  ,["島に生きる者/Islander", TAG_TYPE.SKILL]
  ,["獣皮を巻く者/In Beast's Clothing", TAG_TYPE.SKILL]
  ,["須弥山に篭る者/Mt.Meru Dweller", TAG_TYPE.SKILL]
  ,["戦争屋/Warmonger", TAG_TYPE.SKILL]
  ,["大雪山に篭る者", TAG_TYPE.SKILL]
  ,["退廃の魔王", TAG_TYPE.SKILL]
  ,["第四天魔王の子/Daughter of the Fourth Heaven", TAG_TYPE.SKILL]
  ,["大力の魔王/Hulking Lord", TAG_TYPE.SKILL]
  ,["黄昏に弾く獣", TAG_TYPE.SKILL]
  ,["祟られし者/The Cursed", TAG_TYPE.SKILL]
  ,["チート系勇者", TAG_TYPE.SKILL]
  ,["チートなる者", TAG_TYPE.SKILL]
  ,["忠玉の八犬士", TAG_TYPE.SKILL]
  ,["直感のアスリート/Intuitive Athlete", TAG_TYPE.SKILL]
  ,["翼持つ者/Winged One", TAG_TYPE.SKILL]
  ,["天地創造者/Creator", TAG_TYPE.SKILL]
  ,["常闇の魔王/Lord of Eternal Darkness", TAG_TYPE.SKILL]
  ,["轟き奔る者", TAG_TYPE.SKILL]
  ,["轟く者/Thunderer", TAG_TYPE.SKILL, "", "轟き奔る者"]
  ,["墓場の魔王/Lord of the Graveyard", TAG_TYPE.SKILL]
  ,["不死身なる者/Immortal", TAG_TYPE.SKILL, "", "不死身の密林王"]
  ,["不死身の密林王", TAG_TYPE.SKILL]
  ,["魔王/Dark Lord", TAG_TYPE.SKILL, "", "第四天魔王の子"]
  ,["マシンボディ/Mechaman", TAG_TYPE.SKILL]
  ,["緑を育む者/Gardener", TAG_TYPE.SKILL]
  ,["山に篭る者/Mountain Dweller", TAG_TYPE.SKILL, "", "須弥山に篭る者/大雪山に篭る者"]
  ,["有尾の悪魔/Tailed Demon", TAG_TYPE.SKILL]
  ,["雷光を現す者/Living Lightning", TAG_TYPE.SKILL]
  ,["竜を継ぐ者/Dragonborn", TAG_TYPE.SKILL]
  ,["霊体/Wraith", TAG_TYPE.SKILL]

  ,["攻撃増加系/ATK Up", TAG_TYPE.CATEGORY]
  ,["攻撃減少系/ATK Down", TAG_TYPE.CATEGORY]
  ,["防御増加系/DEF Up", TAG_TYPE.CATEGORY]
  ,["防御減少系/DEF Down", TAG_TYPE.CATEGORY]
  ,["HP回復系/Restore HP", TAG_TYPE.CATEGORY]
  ,["HP減少系/Decrease HP", TAG_TYPE.CATEGORY]
  ,["CP増加系/Increase CP", TAG_TYPE.CATEGORY]
  ,["CP減少系/Deplete CP", TAG_TYPE.CATEGORY]
  ,["弱体無効系/Nullify Debuff", TAG_TYPE.CATEGORY]
  ,["発動率増加系/Increase Probability", TAG_TYPE.CATEGORY]
  ,["発動率減少系/Decrease Probability", TAG_TYPE.CATEGORY]
  ,["移動力増加系/Movement Expansion", TAG_TYPE.CATEGORY]
  ,["強制移動系/Forced Move", TAG_TYPE.CATEGORY]
  ,["移動封印系/Move Lock", TAG_TYPE.CATEGORY]
  ,["スキル封印系/Skill Lock", TAG_TYPE.CATEGORY]
  ,["CS封印系/CS Lock", TAG_TYPE.CATEGORY]
  ,["貫通系/Ignore", TAG_TYPE.CATEGORY]
  ,["強化/Buff", TAG_TYPE.CATEGORY]
  ,["弱体/Debuff", TAG_TYPE.CATEGORY]
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

function generateTagData(s, flagNum){
  var z = [];
  var r = new Map();
  s.forEach(function(x){
    var sf = (x[0].slice(0, 3) !== "全ての");
    var v = x[1];
    var tag = TAG[v];
    var timing = x[2];
    var g = 0;
    if(timing & TIMING.CS){
      g = TAG_MAX;
      if(timing & TIMING.NOT_CS){
        timing = timing & TIMING.NOT_CS;
      }
    }
    if(tag.type !== TAG_TYPE.CATEGORY){
      var f = (tag.type === TAG_TYPE.STATIC) ? TAG_FLAG_NUM.STATIC : flagNum;
      var b = (f < 3) ? timing : 1;
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
