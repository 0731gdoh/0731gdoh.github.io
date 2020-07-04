var LIMITED = ["ジン", "トリトン", "ダゴン", "ベンテン", "キジムナー", "グリンブルスティ", "アラクネ", "アスタロト", "テンジン", "ランタン", "アルケミスト", "キョンシー", "トライヴ", "勇者", "オルグス", "ソール", "ネクロス&バッカス", "チラマンテプ"];

function Card(index, id, name, variant, x){
  this.index = index;
  this.id = id;
  this.name = name;
  this.variant = variant;
  this.rarity = x[1];
  this.maxLv = x[1] ? 45 + x[1] * 5 : 1;
  this.attribute = x[2];
  this.weapon = [x[3], x[4]];
  this.baseAtk = x[5] || 0;
  this.growth = new Fraction(x[6], 98);
  this.csBoost = x[7] || 0;
  this.effects = splitEffects(x[0]);
  this.limited = 1;
  if(!variant && LIMITED.indexOf(t(name, 0)) === -1) this.limited = 0;
  if(t(name, 0) === "トライヴ" && x[2] < 7) this.limited = 0;
}
Card.prototype = {
  toString: function(){
    var name = t(this.name) + t("/ ");
    if(!this.name) return LINE;
    if(!this.baseAtk) name = "× " + name;
    if(this.rarity < 3) return name + "(" + ATTRIBUTE[this.attribute] + ")";
    if(this.variant) return name + "(" + t(this.variant).slice(0, -2) + ")";
    return name + "☆" + this.rarity;
  },
  getValue: function(lv){
    return this.growth.mul((lv || 1) - 1, 1).add(this.baseAtk, 1).round();
  },
  canEquip: function(x){
    if(!this.index || !x.index) return true;
    if(x.chara.length && x.chara.indexOf(this.index) !== -1) return true;
    if(x.rarity & (1 << this.rarity)) return true;
    if(x.weapon & (1 << this.weapon[0])) return true;
    if(x.attribute & (1 << this.attribute)) return true;
    return false;
  }
};
Card.createList = function(a){
  var name = "";
  var effects = "";
  var idH = 0;
  var idL = 0;
  return a.map(function(v, i){
    var x = v.shift();
    var variant = "";
    if(x && x[0] !== "@"){
      name = x;
      idL = 0;
      idH++;
    }else{
      variant = x.slice(1);
    }
    if(!v[0]) v[0] = effects;
    effects = v[0];
    if(v[1] < 3){
      idL = v[2];
    }else{
      idL++;
    }
    return new Card(i, idH * 10 + idL, name, variant, v);
  });
};
Card.csv = function(list, x){
  return list.map(function(v){
    if(!v.name) return t("#,レア度,名前,バージョン,限定,属性,武器タイプ,CSタイプ,CS倍率,基礎ATK,成長率*98,最大Lv,ATK(最大Lv),ATK(最大Lv+10),効果/#,Rarity,Name,Variant,Limited,Attribute,WeaponType,CSType,CSRate,BaseATK,GrowthRate*98,MaxLv,ATK(MaxLv),ATK(MaxLv+10),Effects", x);
    return [
      v.index,
      v.rarity,
      t(v.name, x),
      t(v.variant, x),
      ["", "○"][v.limited],
      t(ATTRIBUTE[v.attribute].name, x),
      t(WEAPON[v.weapon[0]].name, x),
      t(WEAPON[v.weapon[1]].name, x),
      ["(-1)", "", "(+1)"][v.csBoost + 1],
      v.baseAtk,
      v.growth.muln(98),
      v.maxLv,
      v.getValue(v.maxLv),
      v.getValue(v.maxLv + 10),
      v.effects.map(function(n){
        return (n < 0 ? "{CS}" : "") + t(EFFECT[Math.abs(n)].name, x)
        }).join("/")
    ].join(",");
  }).join("\n");
};

var CARD = Card.createList(
  //名前, 補正効果, レア度, 属性, 武器タイプ, CSタイプ, 基礎ATK, 成長率*98[, CS倍率補正]
  [["", "-", 0, 0, 0, 0, 0, 0]
  ,["主人公/Protagonist", "クリティカル", 3, 1, 1, 1, 241, 5064]
  ,["", "クリティカル", 4, 1, 1, 1, 500, 5000]
  ,["シロウ/Shiro", "-", 3, 6, 5, 5, 175, 5324]
  ,["", "", 4, 6, 5, 5, 370, 4627]
  ,["@バレ17/Valentine17", "暴走/暴走+/滋養", 4, 2, 5, 5, 399, 3710]
  ,["@野営20/Jamboree20", "弱点/特攻[1.5]/意気", 5, 5, 5, 8, 720, 5650]
  ,["ケンゴ/Kengo", "c攻撃強化/特攻[1.5]/無窮/クリティカル", 3, 5, 3, 3, 248, 5253]
  ,["", "", 4, 5, 3, 3, 437, 6565]
  ,["", "", 5, 5, 2, 2, 825, 6299]
  ,["リョウタ/Ryota", "-", 3, 4, 5, 5, 192, 4804]
  ,["", "", 4, 4, 5, 5, 425, 5579]
  ,["@聖夜17/Xmas17", "", 5, 4, 5, 5, 777, 4800]
  ,["トウジ/Toji", "剛力", 3, 3, 1, 1, 234, 5071]
  ,["", "", 4, 3, 1, 1, 413, 6388]
  ,["@バレ19/Valentine19", "連撃/集中", 5, 3, 2, 2, 880, 6520]
  ,["オニワカ/Oniwaka", "暴走/暴走+", 3, 2, 2, 2, 198, 4799]
  ,["", "", 5, 2, 2, 2, 802, 4400]
  ,["@節分19/Setsubun19", "-", 5, 8, 7, 2, 675, 5325]
  ,["ハヌマン/Hanuman", "-", 3, 2, 2, 2, 203, 5696]
  ,["", "", 4, 2, 2, 2, 397, 5805]
  ,["@砂旅18/Journey18", "特攻[1.5]/剛力", 4, 5, 4, 6, 397, 6305]
  ,["クロード/Claude", "c攻撃強化", 3, 2, 5, 5, 201, 5500]
  ,["", "", 5, 2, 1, 5, 802, 5203]
  ,["@聖夜18/Xmas18", "c攻撃強化/熱情", 4, 3, 5, 5, 600, 5900]
  ,["リヒト/Licht", "闘志", 3, 6, 4, 4, 204, 5894]
  ,["", "", 5, 6, 4, 4, 799, 5701]
  ,["@バレ18/Valentine18", "集中/特攻[1.5]/強化反転/弱点/闘志", 4, 2, 4, 7, 436, 6341]
  ,["デュオ/Duo", "-", 3, 5, 5, 5, 199, 6299]
  ,["", "", 5, 5, 5, 5, 798, 5406]
  ,["マリア/Maria", "c烙印/烙印", 3, 6, 5, 5, 146, 3927]
  ,["", "", 4, 6, 5, 5, 330, 3766]
  ,["@臨海17/Summer17", "闘志/クリティカル", 4, 4, 1, 1, 452, 6747, 1]
  ,["クリスティーヌ/Christine", "c弱点/特攻[1.5]", 3, 1, 5, 5, 285, 5820]
  ,["", "", 4, 1, 5, 8, 468, 6070]
  ,["モリタカ/Moritaka", "攻撃強化", 3, 3, 1, 1, 198, 5305]
  ,["", "凍結/攻撃強化", 4, 3, 1, 1, 404, 5394]
  ,["@バレ17/Valentine17", "暴走/暴走+/攻撃強化", 5, 2, 1, 5, 850, 6391]
  ,["@野営20/Jamboree20", "c弱点/攻撃強化/連撃/集中/凍結", 5, 8, 4, 4, 1070, 4700]
  ,["フェンリル/Fenrir", "闘志", 3, 3, 3, 2, 255, 5701]
  ,["", "", 4, 3, 2, 2, 469, 6023]
  ,["@宝船18/T.Ship18", "c烙印/束縛時強化/特攻[1.5]", 4, 6, 7, 7, 432, 4989]
  ,["アシガラ/Ashigara", "剛力/崩し", 3, 3, 3, 5, 216, 5376]
  ,["", "", 4, 3, 5, 5, 420, 5270]
  ,["@臨海17/Summer17", "暴走/暴走+/崩し", 5, 5, 4, 6, 1068, 5653, 1]
  ,["アステリオス/Asterius", "暴走/暴走+/クリティカル", 3, 5, 3, 3, 200, 4900]
  ,["", "", 4, 5, 2, 2, 405, 5299]
  ,["@秘島17/Island17", "c崩し/クリティカル+/クリティカル", 4, 6, 1, 5, 448, 5671]
  ,["ゴウリョウ/Ganglie", "特攻[1.5]", 3, 3, 1, 1, 266, 5742]
  ,["", "", 4, 3, 1, 1, 455, 5744]
  ,["@砂旅18/Journey18", "特攻[1.5]/連撃/弱点/特攻[1.6]", 4, 3, 2, 5, 445, 5149]
  ,["イクトシ/Ikutoshi", "攻撃強化", 3, 4, 3, 3, 204, 5800]
  ,["", "攻撃強化/クリティカル++", 4, 4, 2, 2, 404, 6098]
  ,["@山18/Gendarme18", "特攻[1.5]/極限/攻撃強化", 4, 2, 1, 5, 410, 4895]
  ,["シンヤ/Shinya", "特攻[1.5]", 3, 5, 4, 4, 214, 6330]
  ,["", "", 4, 5, 4, 4, 428, 6591]
  ,["ケンタ/Kenta", "暴走/暴走+", 3, 6, 2, 2, 199, 5704]
  ,["", "", 4, 6, 2, 2, 399, 6106]
  ,["@バレ19/Valentine19", "クリティカル", 4, 4, 7, 7, 660, 4940]
  ,["コタロウ/Kotaro", "クリティカル/攻撃強化", 3, 2, 4, 5, 200, 5600]
  ,["", "クリティカル", 5, 2, 4, 5, 803, 5996]
  ,["@海家19/SeaHouse19", "cクリティカル+/c回避に貫通", 4, 3, 9, 8, 310, 5920, 1]
  ,["エイタ/Eita", "特攻[1.5]", 3, 3, 2, 2, 205, 5492]
  ,["", "", 4, 3, 2, 2, 398, 5004]
  ,["@海洋17/Ocean17", "回避に貫通/特攻[1.5]/熱情/頑強に貫通/金剛に貫通/守護に貫通/聖油に貫通/防御強化に貫通", 5, 3, 2, 4, 965, 6628]
  ,["チョウジ/Choji", "滋養", 3, 2, 5, 5, 196, 5308]
  ,["", "", 4, 2, 5, 5, 402, 4603]
  ,["ジュウゴ/Jugo", "クリティカル/闘志/崩し", 3, 2, 3, 2, 200, 4996]
  ,["", "", 4, 2, 2, 5, 405, 6100]
  ,["マガン/Macan", "c闘志/攻撃強化", 3, 4, 3, 2, 198, 5798]
  ,["", "c闘志/剛力", 5, 4, 2, 2, 805, 6195]
  ,["", "c束縛/攻撃強化", 4, 2, 3, 8, 469, 5650]
  ,["オピオーン/Ophion", "c連撃/クリティカル", 3, 5, 4, 4, 205, 5293]
  ,["", "c連撃/クリティカル/攻撃強化", 5, 5, 4, 4, 803, 4699]
  ,["テムジン/Temujin", "激怒/激怒+/クリティカル/回避に貫通", 3, 4, 4, 4, 203, 5801]
  ,["", "", 4, 4, 4, 4, 403, 6095]
  ,["ガルム/Garmr", "クリティカル+", 3, 6, 3, 2, 196, 6309]
  ,["", "", 4, 6, 2, 2, 402, 5903]
  ,["マカラ/Makara", "-", 3, 3, 3, 2, 198, 4900]
  ,["", "", 4, 3, 2, 2, 400, 5396]
  ,["アザゼル/Azazel", "-", 3, 5, 5, 5, 199, 4800]
  ,["", "弱点", 4, 5, 5, 5, 396, 4705]
  ,["カーシー/Cu Sith", "-", 3, 4, 3, 5, 196, 5405]
  ,["", "", 4, 4, 5, 5, 396, 6002]
  ,["@ハロ17/Halloween17", "特攻[1.5]/攻撃強化", 4, 6, 2, 4, 433, 5966]
  ,["グンゾウ/Gunzo", "暴走/暴走+", 3, 2, 2, 2, 196, 5600]
  ,["", "", 4, 2, 2, 2, 403, 5802]
  ,["@バレ17/Valentine17", "暴走/暴走+/闘志", 5, 5, 2, 5, 469, 6750]
  ,["マルコシアス/Marchosias", "-", 3, 2, 1, 1, 197, 5006]
  ,["", "", 4, 2, 1, 1, 398, 5400]
  ,["ノブハル/Nobuharu", "-", 3, 4, 3, 5, 200, 5200]
  ,["", "", 4, 4, 2, 5, 402, 4697]
  ,["@夏祭18/Festival18", "熱情", 4, 4, 6, 8, 584, 5947]
  ,["キュウマ/Kyuma", "闘志/クリティカル/回避に貫通", 3, 2, 4, 4, 199, 5304]
  ,["", "闘志/クリティカル/回避に貫通/熱情/集中", 4, 2, 4, 4, 403, 4801]
  ,["カグツチ/Kagutsuchi", "熱情", 3, 2, 3, 4, 200, 5802]
  ,["", "", 4, 2, 2, 4, 396, 5403]
  ,["@野営20/Jamboree20", "滋養", 4, 4, 2, 5, 510, 5540]
  ,["R-19", "クリティカル", 3, 5, 3, 5, 202, 6296]
  ,["", "", 4, 5, 4, 5, 399, 6097]
  ,["ジブリール/Gabriel", "-", 3, 5, 5, 5, 202, 6297]
  ,["", "", 5, 5, 5, 5, 804, 6099]
  ,["@バレ17/Valentine17", "暴走/暴走+/滋養", 4, 2, 5, 5, 395, 4598]
  ,["アリス/Alice", "特攻[1.5]", 3, 6, 5, 5, 204, 6294]
  ,["", "", 4, 6, 5, 5, 402, 5994]
  ,["@ハロ17/Halloween17", "特攻[1.5]/攻撃強化/武器種変更：魔法", 5, 6, 1, 5, 1145, 6445]
  ,["ジャンバヴァン/Jambavan", "-", 3, 5, 2, 5, 204, 5194]
  ,["", "", 4, 5, 5, 5, 399, 5067]
  ,["@夢19/Nightmare19", "暴走+/連撃", 4, 3, 2, 8, 600, 6200]
  ,["ルキフゲ/Lucifuge", "c攻撃強化", 3, 6, 4, 4, 225, 6287]
  ,["", "", 4, 6, 4, 4, 403, 5833]
  ,["マーナガルム/Hati", "暴走/暴走+/剛力", 3, 3, 3, 2, 204, 5594]
  ,["", "", 4, 3, 3, 2, 402, 5400]
  ,["バーゲスト/Barguest", "烙印/特攻[1.5]", 3, 6, 3, 5, 203, 4801]
  ,["", "", 4, 6, 5, 5, 405, 5699]
  ,["@バレ20/Valentine20", "c特攻[2.0]/特攻[1.5]", 4, 2, 1, 1, 672, 5258]
  ,["バティム/Bathym", "クリティカル", 3, 6, 3, 2, 197, 5702]
  ,["", "", 4, 6, 2, 2, 404, 5893]
  ,["@臨海17/Summer17", "-", 4, 3, 4, 6, 649, 6748, 1]
  ,["クニヨシ/Kuniyoshi", "特攻[1.5]/集中/特攻[2.5]", 3, 4, 5, 5, 203, 5797]
  ,["", "", 4, 4, 5, 5, 403, 5593]
  ,["@夢19/Nightmare19", "熱情/特攻[1.5]/特攻[2.5]", 5, 6, 5, 8, 1040, 5760]
  ,["モトスミ/Motosumi", "剛力", 3, 2, 3, 2, 200, 4802]
  ,["", "", 4, 2, 2, 2, 399, 6105]
  ,["@節分19/Setsubun19", "特攻[1.5]/剛力", 4, 5, 5, 3, 375, 6125]
  ,["カルキ/Kalki", "暴走/暴走+", 3, 5, 1, 1, 199, 4398]
  ,["", "", 4, 5, 1, 1, 403, 4796]
  ,["@聖夜19/Xmas19", "剛力/攻撃強化/闘志", 4, 6, 6, 6, 672, 4604]
  ,["ノーマッド/Nomad", "極限/激怒/激怒+", 3, 2, 3, 2, 199, 5101]
  ,["", "", 4, 2, 2, 2, 401, 5799]
  ,["@秘島17/Island17", "集中/極限", 4, 3, 2, 2, 563, 6165]
  ,["スノウ/Snow", "-", 3, 3, 3, 1, 197, 5306]
  ,["", "", 5, 3, 1, 1, 799, 4201]
  ,["@バレ20/Valentine20", "c集中/c連撃/闘志/クリティカル", 5, 5, 2, 4, 578, 6432]
  ,["ガンダルヴァ/Gandharva", "c暴走/クリティカル++", 3, 3, 3, 5, 202, 5402]
  ,["", "", 4, 3, 5, 5, 402, 5297]
  ,["ニャルラトテプ/Nyarlathotep", "極限/特攻[1.5]", 3, 4, 3, 5, 201, 5595]
  ,["", "", 4, 4, 5, 5, 400, 5704]
  ,["シュテン/Shuten", "剛力/クリティカル", 3, 3, 3, 4, 201, 5796]
  ,["", "", 4, 3, 2, 4, 399, 4802]
  ,["@山18/Gendarme18", "c熱情/特攻[1.5]/剛力", 4, 5, 1, 7, 521, 5881]
  ,["ポルックス/Pollux", "-", 3, 5, 3, 3, 197, 6107]
  ,["", "", 4, 5, 3, 3, 397, 6205]
  ,["@聖夜18/Xmas18", "闘志/連撃", 4, 6, 3, 2, 500, 7000]
  ,["タウラスマスク/Taurus Mask", "-", 3, 4, 3, 2, 203, 4800]
  ,["", "闘志", 4, 4, 2, 2, 403, 4794]
  ,["@聖夜17/Xmas17", "集中/熱情/意気", 4, 2, 2, 2, 504, 5604]
  ,["ジライヤ/Jiraiya", "剛力", 3, 3, 1, 4, 198, 5604]
  ,["", "", 4, 3, 4, 4, 407, 5593, 1]
  ,["@臨海17/Summer17", "剛力/クリティカル", 4, 5, 2, 5, 448, 6094, 1]
  ,["アンドヴァリ/Andvari", "クリティカル", 3, 6, 3, 5, 205, 5294]
  ,["", "", 4, 6, 2, 5, 397, 4601]
  ,["@海家19/SeaHouse19", "c烙印/クリティカル/集中", 5, 5, 5, 5, 954, 6366, -1]
  ,["スライム/Slime", "-", 1, 2, 3, 3, 24, 5178]
  ,["", "", 1, 3, 3, 3, 23, 5180]
  ,["", "", 1, 4, 3, 3, 24, 5175]
  ,["", "", 1, 5, 3, 3, 22, 5180]
  ,["", "", 1, 6, 3, 3, 23, 5181]
  ,["オニ/Oni", "c攻撃強化/剛力", 2, 2, 2, 2, 47, 5451]
  ,["", "", 2, 3, 2, 2, 54, 5447]
  ,["", "", 2, 4, 2, 2, 52, 5449]
  ,["", "", 2, 5, 2, 2, 50, 5451]
  ,["", "", 2, 6, 2, 2, 48, 5448]
  ,["エビル/Devil", "-", 1, 2, 4, 4, 51, 5652]
  ,["", "", 1, 3, 4, 4, 47, 5651]
  ,["", "", 1, 4, 4, 4, 50, 5655]
  ,["", "", 1, 5, 4, 4, 47, 5654]
  ,["", "", 1, 6, 4, 4, 54, 5647]
  ,["フェンサー/Fencer", "c攻撃強化", 1, 2, 1, 1, 51, 5850]
  ,["", "", 1, 3, 1, 1, 53, 5847]
  ,["", "", 1, 4, 1, 1, 47, 5851]
  ,["", "", 1, 5, 1, 1, 50, 5855]
  ,["", "", 1, 6, 1, 1, 54, 5846]
  ,["メイジ/Mage", "-", 1, 2, 5, 5, 50, 5447]
  ,["", "", 1, 3, 5, 5, 55, 5446]
  ,["", "", 1, 4, 5, 5, 48, 5452]
  ,["", "", 1, 5, 5, 5, 48, 5451]
  ,["", "", 1, 6, 5, 5, 54, 5446]
  ,["ウルフ/Wolf", "c攻撃強化/剛力", 1, 2, 2, 2, 41, 4964]
  ,["", "", 1, 3, 2, 2, 44, 4955]
  ,["", "", 1, 4, 2, 2, 43, 4955]
  ,["", "", 1, 5, 2, 2, 39, 4960]
  ,["", "", 1, 6, 2, 2, 38, 4958]
  ,["ゴースト/Ghost", "-", 1, 2, 5, 5, 36, 5969]
  ,["", "", 1, 3, 5, 5, 45, 5951]
  ,["", "", 1, 4, 5, 5, 37, 5968]
  ,["", "", 1, 5, 5, 5, 40, 5960]
  ,["", "", 1, 6, 5, 5, 42, 5955]
  ,["ヨウル/Yule", "特攻[1.5]/熱情", 3, 3, 3, 2, 230, 5764]
  ,["", "", 4, 3, 2, 2, 455, 5836]
  ,["ジェド/Ded", "-", 3, 5, 2, 5, 250, 5738]
  ,["", "クリティカル/特攻[1.5]", 5, 6, 4, 5, 880, 5605]
  ,["ハーロット/Babalon", "特攻[1.5]", 3, 6, 5, 5, 258, 6706]
  ,["", "特攻[1.5]/クリティカル+", 5, 6, 2, 5, 884, 6108]
  ,["@ハロ19/Halloween19", "cクリティカル+", 4, 4, 1, 2, 490, 5670]
  ,["イバラキ/Ibaraki", "クリティカル/剛力", 3, 2, 2, 4, 189, 5055]
  ,["", "", 4, 2, 4, 4, 456, 6143]
  ,["マネキネコ/Lucky Cat", "-", 1, 5, 3, 5, 10, 490, -1]
  ,["ホロケウカムイ/Horkeu Kamui", "c凍結/闘志", 3, 3, 3, 5, 215, 6287]
  ,["", "c凍結/滋養/闘志", 4, 3, 3, 5, 410, 6264]
  ,["", "c凍結/特攻[1.6]/闘志", 5, 8, 1, 5, 844, 6164]
  ,["タローマティ/Taromaiti", "特攻[1.5]", 3, 5, 2, 2, 215, 6287]
  ,["", "特攻[1.5]/弱点", 4, 5, 2, 2, 410, 6456]
  ,["エインヘリエル/Einherjar", "闘志", 2, 2, 1, 2, 51, 5850]
  ,["", "", 2, 3, 1, 2, 53, 5847]
  ,["", "", 2, 4, 1, 2, 47, 5851]
  ,["", "", 2, 5, 1, 2, 50, 5855]
  ,["", "", 2, 6, 1, 2, 54, 5846]
  ,["ヴァルキリー/Valkyrie", "攻撃強化", 2, 2, 5, 5, 50, 5447]
  ,["", "", 2, 3, 5, 5, 55, 5446]
  ,["", "", 2, 4, 5, 5, 48, 5452]
  ,["", "", 2, 5, 5, 5, 48, 5451]
  ,["", "", 2, 6, 5, 5, 54, 5446]
  ,["シトリー/Sitri", "特攻[1.5]", 3, 2, 3, 4, 305, 4994]
  ,["", "", 4, 2, 4, 4, 618, 4756]
  ,["@聖夜19/Xmas19", "c熱情/c連撃/闘志/特攻[1.4]", 4, 4, 2, 3, 464, 5660]
  ,["ツァトグァ/Tsathoggua", "-", 3, 3, 2, 4, 205, 6299]
  ,["", "", 5, 3, 4, 4, 780, 6178]
  ,["@渚19/Fashionista19", "", 4, 5, 9, 8, 120, 1880]
  ,["ホウゲン/Hogen", "クリティカル+", 3, 4, 1, 7, 263, 6221]
  ,["", "", 4, 4, 1, 7, 488, 6547]
  ,["@夏祭18/Festival18", "熱情/クリティカル+", 5, 8, 4, 7, 823, 6609]
  ,["ニンジャ/Ninja", "特攻[1.4]", 1, 2, 4, 5, 53, 6600,-1]
  ,["", "", 1, 3, 4, 5, 49, 6679,-1]
  ,["", "", 1, 4, 4, 5, 48, 6707,-1]
  ,["", "", 1, 5, 4, 5, 50, 6641,-1]
  ,["", "", 1, 6, 4, 5, 53, 6628,-1]
  ,["ザオウ/Zao", "闘志/特攻[1.5]", 3, 4, 3, 4, 281, 6109]
  ,["", "", 4, 4, 2, 4, 470, 6451]
  ,["@山18/Gendarme18", "滋養/特攻[1.6]/特攻[1.5]", 5, 4, 5, 5, 786, 4348]
  ,["チェルノボーグ/Chernobog", "凍結", 3, 6, 3, 3, 296, 6715]
  ,["", "凍結/特攻[1.5]", 5, 6, 1, 1, 960, 6275]
  ,["@海家19/SeaHouse19", "cクリティカル/凍結", 5, 2, 6, 4, 840, 6280]
  ,["メリュジーヌ/Melusine", "クリティカル", 3, 3, 4, 4, 258, 6253]
  ,["", "", 4, 3, 4, 4, 416, 6434]
  ,["@聖夜18/Xmas18", "弱点", 4, 2, 4, 4, 550, 6450]
  ,["ヒリュウ/Wyvern", "クリティカル/特攻[1.4]", 2, 2, 2, 4, 105, 7010]
  ,["", "", 2, 3, 2, 4, 108, 7013]
  ,["", "", 2, 4, 2, 4, 107, 7012]
  ,["", "", 2, 5, 2, 4, 104, 7014]
  ,["", "", 2, 6, 2, 4, 106, 7016]
  ,["ザバーニーヤ/Zabaniyya", "烙印/特攻[1.6]/特攻[1.4]", 3, 2, 2, 2, 296, 7238]
  ,["", "烙印/特攻[1.6]/攻撃強化", 5, 2, 2, 2, 989, 6718]
  ,["@渚19/Fashionista19", "c特攻[2.0]/烙印/攻撃強化", 5, 8, 4, 4, 890, 7010]
  ,["アルスラーン/Arsalan", "c聖油/闘志/特攻[1.5]", 3, 4, 3, 5, 238, 6000]
  ,["", "", 4, 4, 3, 5, 428, 6162]
  ,["@ハロ17/Halloween17", "c連撃/特攻[1.5]/攻撃強化", 4, 6, 3, 5, 442, 6245]
  ,["エンジェル/Angel", "c烙印/烙印/特攻[1.6]", 1, 2, 2, 5, 54, 7031]
  ,["", "", 1, 3, 2, 5, 53, 7039]
  ,["", "", 1, 4, 2, 5, 52, 7025]
  ,["", "", 1, 5, 2, 5, 51, 7040]
  ,["", "", 1, 6, 2, 5, 55, 7034]
  ,["イフリート/Ifrit", "-", 3, 2, 3, 5, 289, 6180]
  ,["", "", 4, 2, 4, 5, 449, 6576, 1]
  ,["@宝船18/T.Ship18", "c崩し/熱情", 4, 5, 3, 8, 453, 5527]
  ,["ハクメン/Hakumen", "特攻[1.4]", 3, 2, 1, 5, 242, 5739]
  ,["", "", 4, 2, 1, 5, 409, 5627, 1]
  ,["@バレ18/Valentine18", "特攻[1.5]", 4, 5, 4, 5, 380, 5518]
  ,["黒服/Mobster", "集中/弱点", 2, 2, 6, 6, 100, 6900]
  ,["", "", 2, 3, 6, 6, 100, 6900]
  ,["", "", 2, 4, 6, 6, 100, 6900]
  ,["", "", 2, 5, 6, 6, 100, 6900]
  ,["", "", 2, 6, 6, 6, 100, 6900]
  ,["メイド/Maid", "特攻[2.0]", 1, 2, 7, 7, 80, 6420]
  ,["", "", 1, 3, 7, 7, 80, 6420]
  ,["", "", 1, 4, 7, 7, 80, 6420]
  ,["", "", 1, 5, 7, 7, 80, 6420]
  ,["", "", 1, 6, 7, 7, 80, 6420]
  ,["ベンテン/Benten", "特攻[1.5]/特攻[1.4]", 3, 3, 4, 5, 261, 5273]
  ,["", "", 4, 3, 5, 5, 416, 5349]
  ,["エイハブ/Ahab", "特攻[1.5]/激怒/激怒+/闘志", 3, 3, 4, 4, 275, 5726]
  ,["", "", 5, 3, 4, 4, 877, 6052]
  ,["テュポーン/Typhon", "-", 3, 3, 2, 5, 283, 5851]
  ,["", "", 4, 3, 5, 5, 450, 6082]
  ,["@宝船18/T.Ship18", "闘志/特攻[1.5]", 5, 3, 5, 8, 1132, 6133]
  ,["パイレーツ/Pirate", "特攻[1.5]/闘志", 1, 2, 3, 5, 44, 6410]
  ,["", "", 1, 3, 5, 5, 48, 6408]
  ,["", "", 1, 4, 2, 5, 42, 6415]
  ,["", "", 1, 5, 4, 5, 46, 6409]
  ,["", "", 1, 6, 1, 5, 45, 6408]
  ,["マーメイド/Mermaid", "特攻[1.5]", 2, 2, 5, 5, 48, 5473]
  ,["", "", 2, 3, 5, 5, 53, 5495]
  ,["", "", 2, 4, 5, 5, 50, 5466]
  ,["", "", 2, 5, 5, 5, 51, 5477]
  ,["", "", 2, 6, 5, 5, 49, 5484]
  ,["マーマン/Merman", "回避に貫通/クリティカル+", 2, 2, 4, 6, 108, 7441]
  ,["", "", 2, 3, 4, 6, 107, 7411]
  ,["", "", 2, 4, 4, 6, 109, 7427]
  ,["", "", 2, 5, 4, 6, 110, 7412]
  ,["", "", 2, 6, 4, 6, 106, 7452]
  ,["ジン/Jinn", "闘志/熱情", 3, 2, 1, 5, 256, 6765]
  ,["", "闘志/攻撃強化/熱情", 5, 2, 5, 5, 898, 6791]
  ,["ショロトル/Xolotl", "攻撃強化", 3, 4, 4, 3, 253, 3823]
  ,["", "", 4, 4, 4, 3, 361, 4132]
  ,["タダトモ/Tadatomo", "激怒/激怒+", 3, 2, 1, 5, 256, 5921]
  ,["", "激怒/激怒+/劫火/特攻[1.6]", 4, 2, 5, 5, 698, 5841]
  ,["@バレ18/Valentine18", "特攻[1.5]/暴走/暴走+", 4, 6, 4, 5, 508, 6418]
  ,["ヴォーロス/Volos", "特攻[1.5]", 3, 4, 2, 4, 149, 4127]
  ,["", "", 4, 4, 4, 4, 326, 4117]
  ,["@海家19/SeaHouse19", "特攻[1.5]/クリティカル", 4, 8, 2, 5, 543, 6097]
  ,["タンガロア/Tangaroa", "特攻[1.5]/クリティカル", 3, 4, 2, 5, 229, 5767]
  ,["", "", 5, 4, 4, 5, 1092, 5564]
  ,["@秘島19/Island19", "滋養/闘志", 5, 9, 4, 8, 1128, 6492]
  ,["トリトン/Triton", "-", 3, 3, 5, 8, 266, 6283]
  ,["", "", 4, 3, 5, 8, 429, 6394]
  ,["キジムナー/Kijimuna", "特攻[1.5]", 3, 4, 2, 5, 153, 5429]
  ,["", "", 4, 4, 3, 5, 429, 5467]
  ,["@秘島19/Island19", "c滋養/崩し", 4, 9, 5, 8, 468, 5572]
  ,["トライヴ/Tribe", "c崩し", 2, 2, 2, 2, 112, 6134]
  ,["", "", 2, 3, 1, 1, 116, 6132]
  ,["", "", 2, 4, 2, 2, 115, 6130]
  ,["", "", 2, 5, 1, 1, 113, 6134]
  ,["", "", 2, 6, 1, 1, 114, 6130]
  ,["クロガネ/Kurogane", "c集中/弱点/特攻[1.5]", 3, 4, 4, 4, 231, 5457]
  ,["", "c集中/弱点/特攻[1.5]/集中/特攻[1.6]", 5, 4, 5, 4, 975, 5094]
  ,["ロビンソン/Robinson", "c連撃/特攻[1.5]/弱点/集中", 3, 6, 4, 6, 225, 6287]
  ,["", "", 4, 6, 4, 6, 403, 5833]
  ,["@秘島19/Island19", "c弱点/c回避に貫通/クリティカル/集中/連撃", 4, 1, 6, 6, 578, 6882]
  ,["クランプス/Krampus", "集中/烙印/特攻[1.5]", 3, 4, 1, 1, 308, 6517]
  ,["", "", 4, 6, 1, 1, 528, 6870]
  ,["@ハロ19/Halloween19", "c崩し/攻撃強化/極限/特攻[2.0]/烙印", 5, 2, 4, 4, 1080, 6160]
  ,["アギョウ/Agyo", "特攻[1.5]", 3, 3, 5, 4, 189, 5930]
  ,["", "", 4, 3, 4, 4, 411, 5795]
  ,["アイゼン/Aizen", "c集中/集中/特攻[1.5]", 3, 2, 1, 6, 268, 5911]
  ,["", "", 5, 2, 4, 6, 975, 5594]
  ,["@野営20/Jamboree20", "クリティカル+", 4, 5, 1, 7, 370, 5360]
  ,["ワカン・タンカ/Wakan Tanka", "cクリティカル+", 3, 4, 2, 3, 219, 5906]
  ,["", "cクリティカル+/剛力", 5, 4, 3, 3, 864, 6027]
  ,["@渚19/Fashionista19", "クリティカル/クリティカル+/熱情", 5, 9, 2, 3, 1094, 7206]
  ,["サンダーバード/Thunderbird", "集中/クリティカル/回避に貫通", 3, 5, 1, 5, 209, 5137]
  ,["", "", 4, 5, 4, 5, 437, 5613]
  ,["シノ/Shino", "特攻[1.5]", 3, 7, 1, 1, 263, 5346]
  ,["", "特攻[1.5]/特攻[4.0]", 5, 7, 2, 2, 736, 5665]
  ,["@バレ19/Valentine19", "cクリティカル+/極限", 5, 1, 4, 4, 810, 5290]
  ,["ムサシ/Musashi", "連撃/特攻[1.5]/弱点/集中/クリティカル+", 3, 1, 1, 1, 285, 5830]
  ,["", "", 4, 1, 1, 7, 461, 6081]
  ,["アマツマラ/Amatsumara", "集中/クリティカル", 3, 2, 3, 4, 230, 5642]
  ,["", "", 4, 2, 3, 8, 451, 5725]
  ,["@渚19/Fashionista19", "c弱点/集中/特攻[1.5]/連撃", 4, 5, 5, 5, 451, 6949]
  ,["ドゥルガー/Durga", "c極限/極限/回避に貫通", 3, 7, 3, 4, 315, 6588]
  ,["", "", 4, 7, 2, 6, 624, 6890]
  ,["@夢19/Nightmare19", "c激怒/c*激怒/弱点/熱情", 4, 2, 3, 8, 620, 5780]
  ,["テツギュウ/Tetsuox", "c連撃/闘志/クリティカル++", 3, 6, 2, 2, 268, 6637]
  ,["", "", 4, 6, 1, 5, 492, 6763]
  ,["@ハロ19/Halloween19", "c極限/武器種変更：魔法/クリティカル/熱情", 4, 4, 3, 5, 530, 5820]
  ,["シュウイチ/Shuichi", "弱点", 3, 4, 1, 5, 197, 5501]
  ,["", "", 4, 4, 5, 5, 396, 5406]
  ,["スズカ/Suzuka", "c特攻[2.0]/c連撃/闘志/特攻[1.5]", 3, 5, 1, 7, 268, 5870]
  ,["", "c特攻[2.0]/c連撃/闘志/特攻[1.5]/クリティカル+", 4, 5, 7, 7, 452, 6063]
  ,["@渚19/Fashionista19", "c崩し/集中", 4, 3, 3, 3, 726, 6474]
  ,["タヂカラオ/Tajikarao", "集中/剛力", 3, 4, 2, 2, 164, 6548]
  ,["", "集中/剛力/回避に貫通/頑強に貫通/金剛に貫通/守護に貫通/聖油に貫通/防御強化に貫通", 5, 4, 2, 2, 826, 6212]
  ,["ギョウブ/Gyobu", "闘志", 3, 4, 5, 5, 153, 5155]
  ,["", "弱点/特攻[1.6]/闘志", 4, 4, 5, 5, 412, 5195]
  ,["テンジン/Deity", "-", 2, 2, 3, 3, 98, 4888]
  ,["", "", 2, 3, 3, 3, 98, 4888]
  ,["", "", 2, 4, 3, 3, 98, 4888]
  ,["", "", 2, 5, 3, 3, 98, 4888]
  ,["", "", 2, 6, 3, 3, 98, 4888]
  ,["", "", 2, 7, 3, 3, 98, 4888]
  ,["ギュウマオウ/Gyumao", "クリティカル", 3, 2, 3, 7, 328, 4169]
  ,["", "c熱情/クリティカル+/崩し", 5, 2, 7, 8, 1504, 3604]
  ,["@バレ20/Valentine20", "-", 4, 6, 5, 8, 333, 5687]
  ,["セト/Seth", "特攻[1.5]", 3, 8, 5, 5, 178, 6032]
  ,["", "", 4, 8, 5, 5, 518, 5910]
  ,["@海家19/SeaHouse19", "-", 4, 3, 3, 3, 515, 5735]
  ,["エビス/Ebisu", "c崩し/特攻[1.5]/クリティカル++", 3, 3, 4, 4, 164, 5138]
  ,["", "", 4, 3, 6, 6, 389, 4433]
  ,["エーギル/Aegir", "特攻[1.5]", 3, 3, 2, 4, 324, 6687]
  ,["", "特攻[1.5]/攻撃強化", 5, 3, 2, 4, 1010, 6012]
  ,["@聖夜19/Xmas19", "c特攻[2.0]/剛力/特攻[1.5]", 5, 4, 4, 4, 1379, 6151]
  ,["ランタン/O'-Lantern", "-", 1, 2, 5, 5, 50, 6950]
  ,["", "", 1, 3, 5, 5, 50, 6950]
  ,["", "", 1, 4, 5, 5, 50, 6950]
  ,["", "", 1, 5, 5, 5, 50, 6950]
  ,["", "", 1, 6, 5, 5, 50, 6950]
  ,["ガヴァナー/Baron", "c特攻[1.5]", 2, 2, 9, 3, 50, 2950]
  ,["", "", 2, 3, 9, 3, 50, 2950]
  ,["", "", 2, 4, 9, 3, 50, 2950]
  ,["", "", 2, 5, 9, 3, 50, 2950]
  ,["", "", 2, 6, 9, 3, 50, 2950]
  ,["マーマン/Merman", "回避に貫通/クリティカル+", 2, 7, 4, 6, 112, 7450]
  ,["マーメイド/Mermaid", "特攻[1.5]", 2, 7, 5, 5, 55, 5495]
  ,["アルク/Arc", "c特攻[2.5]/特攻[1.6]/烙印", 3, 2, 4, 8, 202, 6298]
  ,["", "", 4, 2, 6, 8, 592, 6158]
  ,["アザトース/Azathoth", "c極限/c暴走", 3, 9, 4, 8, 312, 6713]
  ,["", "", 4, 9, 6, 8, 581, 6740]
  ,["スルト/Surtr", "c特攻[1.6]/c回避に貫通/c特攻[2.3]/暴走", 3, 7, 2, 1, 196, 5293]
  ,["", "", 5, 7, 7, 7, 748, 4744]
  ,["@バレ19/Valentine19", "特攻[1.5]/熱情", 4, 2, 6, 6, 650, 7150]
  ,["タングリスニル/Tanngrisnir", "-", 3, 5, 3, 4, 200, 3300]
  ,["", "", 5, 5, 2, 5, 400, 3600]
  ,["グリンブルスティ/Gullinbursti", "c特攻[1.5]/cマヒ/闘志/崩し", 3, 8, 3, 2, 300, 5700]
  ,["", "c特攻[1.5]/cマヒ/闘志/集中/崩し/意気", 4, 8, 1, 2, 700, 6300]
  ,["タケマル/Takemaru", "集中/暴走", 3, 7, 5, 5, 350, 3150]
  ,["", "集中", 5, 7, 3, 5, 350, 3150]
  ,["@聖夜19/Xmas19", "cクリティカル/熱情/弱点/特攻[1.5]", 5, 2, 2, 2, 1041, 5256]
  ,["ベヒモス/Behemoth", "崩し", 3, 6, 3, 5, 200, 6600]
  ,["", "崩し/熱情", 4, 6, 1, 8, 400, 5850]
  ,["ジズ/Ziz", "-", 3, 5, 4, 5, 150, 3850]
  ,["", "連撃", 4, 5, 5, 5, 230, 2770]
  ,["ミネアキ/Mineaki", "c弱点", 3, 3, 5, 5, 197, 4806]
  ,["", "", 4, 3, 5, 5, 401, 5896]
  ,["テツヤ/Tetsuya", "闘志/特攻[1.5]/激怒", 3, 6, 3, 3, 201, 4802]
  ,["", "", 4, 6, 1, 1, 396, 4806]
  ,["@聖夜19/Xmas19", "クリティカル", 4, 5, 5, 5, 525, 4555]
  ,["ブレイク/Breke", "攻撃強化/闘志", 3, 3, 1, 4, 240, 5770]
  ,["", "", 4, 3, 1, 4, 470, 5830]
  ,["アヴァルガ/Avarga", "c崩し/剛力/特攻[1.5]", 3, 4, 3, 3, 210, 6010]
  ,["", "", 4, 4, 2, 2, 490, 6410]
  ,["アルジャーノン/Algernon", "極限/連撃", 3, 8, 2, 4, 290, 6730]
  ,["", "極限/連撃/クリティカル/崩し", 4, 8, 2, 4, 540, 6760]
  ,["オセ/Ose", "c弱点/闘志", 3, 6, 4, 5, 270, 6410]
  ,["", "", 4, 6, 6, 5, 480, 6400]
  ,["オズ/Oz", "c闘志/剛力/暴走", 3, 4, 3, 5, 190, 5270]
  ,["", "", 4, 4, 5, 5, 340, 5340]
  ,["ツクヨミ/Tsukuyomi", "弱点", 3, 7, 1, 4, 220, 5740]
  ,["", "cクリティカル/弱点", 5, 7, 4, 8, 580, 5450]
  ,["コロポックル/Korpokkur", "凍結", 3, 9, 5, 5, 170, 4090]
  ,["", "", 5, 9, 5, 8, 460, 3900]
  ,["アールプ/Alp", "c武器種変更：全域", 3, 6, 3, 2, 220, 4980]
  ,["", "", 4, 6, 2, 5, 350, 5150]
  ,["レイヴ/Leib", "-", 3, 4, 4, 4, 200, 5300]
  ,["", "", 5, 4, 6, 5, 660, 3940]
  ,["アルケミスト/Alchemist", "c集中/意気", 2, 2, 3, 5, 85, 8995]
  ,["", "", 2, 3, 3, 5, 85, 8995]
  ,["", "", 2, 4, 3, 5, 85, 8995]
  ,["", "", 2, 5, 3, 5, 85, 8995]
  ,["", "", 2, 6, 3, 5, 85, 8995]
  ,["ヘパイストス/Hephaestus", "c集中/武器種変更：魔法/弱点/特攻[1.5]/クリティカル", 3, 2, 1, 4, 240, 5810]
  ,["", "c集中/武器種変更：魔法/弱点/特攻[1.5]/クリティカル/烙印", 5, 2, 2, 4, 920, 5130]
  ,["フルフミ/Furufumi", "烙印", 3, 4, 9, 8, 200, 2500]
  ,["", "", 4, 4, 9, 8, 200, 2500]
  ,["オンブレティグレ/Hombre Tigre", "c熱情/特攻[1.5]/意気/剛力", 3, 4, 3, 2, 280, 6920]
  ,["", "c熱情/特攻[1.5]/剛力", 4, 4, 2, 2, 510, 6740]
  ,["アラクネ/Arachne", "-", 3, 7, 4, 4, 450, 5600]
  ,["", "集中", 4, 7, 6, 6, 710, 4840]
  ,["ゴエモン/Goemon", "意気", 3, 2, 5, 5, 190, 5710]
  ,["", "意気/攻撃強化", 4, 2, 5, 5, 530, 5600]
  ,["リチョウ/Licho", "特攻[1.4]/剛力", 3, 5, 2, 5, 165, 5965]
  ,["", "", 4, 5, 5, 8, 495, 5925]
  ,["サナト・クマラ/Sanat Kumara", "烙印", 3, 7, 1, 6, 190, 4990]
  ,["", "熱情/烙印/クリティカル", 5, 7, 5, 6, 760, 5000]
  ,["キョンシー/Jiangshi", "-", 2, 2, 2, 2, 70, 4780]
  ,["", "", 2, 3, 2, 2, 70, 4780]
  ,["", "", 2, 4, 2, 2, 70, 4780]
  ,["", "", 2, 5, 2, 2, 70, 4780]
  ,["", "", 2, 6, 2, 2, 70, 4780]
  ,["アスタロト/Astaroth", "c武器種変更：無/c連撃/特攻[1.5]/攻撃強化", 3, 6, 5, 5, 152, 5068]
  ,["", "c武器種変更：魔法/c連撃/特攻[2.0]/弱点/攻撃強化", 4, 5, 9, 5, 768, 6412]
  ,["ダゴン/Dagon", "烙印", 3, 7, 1, 8, 194, 4786]
  ,["", "剛力/烙印", 5, 7, 1, 8, 684, 5246]
  ,["トライヴ/Tribe", "c崩し", 2, 7, 4, 4, 117, 6129]
  ,["", "", 2, 8, 4, 4, 116, 6132]
  ,["", "", 2, 9, 4, 4, 115, 6130]
  ,["トムテ/Tomte", "熱情", 3, 5, 2, 2, 164, 6056]
  ,["", "熱情/連撃", 4, 1, 9, 1, 464, 5856]
  ,["テスカトリポカ/Tezcatlipoca", "c弱点/攻撃強化/特攻[1.5]", 3, 7, 4, 5, 178, 6402]
  ,["", "c弱点/特攻[1.5]/攻撃強化/暴走+", 5, 9, 4, 5, 1460, 6430]
  ,["シンノウ/Shennong", "特攻[1.5]/毒反転", 3, 4, 2, 5, 154, 5716]
  ,["", "", 4, 8, 2, 5, 476, 5578]
  ,["ヤスヨリ/Yasuyori", "c闘志/崩し/特攻[1.5]", 3, 4, 1, 7, 101, 6119]
  ,["", "c闘志/崩し/特攻[1.5]/剛力", 4, 4, 7, 8, 735, 5685]
  ,["ジェイコフ/Jacob", "連撃/弱点/崩し", 3, 5, 3, 3, 144, 6066]
  ,["", "連撃/弱点/崩し/クリティカル", 5, 9, 3, 3, 431, 7239]
  ,["ジャイアント/Giant", "c剛力/崩し", 2, 7, 3, 2, 106, 6772]
  ,["エーコー/Echo", "武器種変更：狙撃/回避に貫通/弱点", 3, 4, 3, 6, 118, 5092]
  ,["", "武器種変更：全域/回避に貫通/意気/弱点", 4, 4, 3, 8, 432, 4783]
  ,["ヘラクレス/Heracles", "c激怒+/クリティカル", 3, 6, 9, 4, 255, 6057]
  ,["", "c激怒+/剛力/呪い/闘志/弱点/幻惑/クリティカル++/極限", 5, 6, 4, 4, 1024, 6665]
  ,["ホルス", "烙印", 3, 9, 2, 1, 165, 4845]
  ,["", "烙印/極限", 5, 9, 2, 7, 495, 4865]
  ,["クトゥグァ", "c特攻[1.5]/剛力/激怒", 3, 2, 3, 5, 220, 5100]
  ,["", "c特攻[3.0]/剛力/攻撃強化/激怒+", 5, 2, 1, 8, 785, 6055]
  ,["バエル", "*強化反転/特攻[1.5]/弱点", 3, 7, 5, 5, 155, 5135]
  ,["", "*強化反転/特攻[2.0]/弱点", 5, 7, 5, 5, 745, 5085]
  ,["リャナンシー", "-", 3, 3, 9, 6, 180, 1820]
  ,["", "", 4, 3, 9, 6, 200, 2100]
  ,["タネトモ", "特攻[1.5]/回避に貫通", 3, 8, 1, 4, 220, 4960]
  ,["", "", 4, 8, 4, 4, 445, 4935]
  ,["ダイコク", "武器種変更：狙撃", 3, 7, 9, 6, 145, 5655]
  ,["", "", 5, 7, 9, 6, 533, 5917]
  ,["ティダ", "c極限/熱情/攻撃力減少/剛力", 3, 2, 4, 8, 270, 6590]
  ,["", "c極限/熱情/攻撃力減少/剛力/攻撃強化", 4, 8, 6, 8, 579, 7040]
  ,["バロール", "c特攻[3.0]/CS変更：魔法/剛力/烙印", 3, 8, 3, 9, 235, 6305]
  ,["", "c特攻[6.0]/CS変更：全域/剛力/烙印", 4, 8, 3, 9, 550, 6430]
  ,["ナタ", "熱情/特攻[2.0]", 3, 2, 3, 2, 374, 6356]
  ,["", "cクリティカル/熱情/特攻[2.0]/特攻[1.5]", 4, 4, 3, 5, 867, 6313]
  ,["勇者", "c特攻[1.5]/攻撃強化/闘志", 3, 5, 1, 4, 160, 5950]
  ,["", "c特攻[2.0]/攻撃強化/闘志/熱情/クリティカル+", 4, 5, 4, 8, 670, 5650]
  ,["オルグス", "c闘志/剛力/武器種変更：無/熱情", 3, 2, 2, 2, 242, 6598]
  ,["", "c闘志/c特攻[1.5]/剛力/武器種変更：無/クリティカル", 4, 2, 7, 2, 570, 6510]
  ,["ソール", "守護を無効化/防御強化を無効化/回避に貫通", 3, 4, 3, 5, 311, 4699]
  ,["", "", 4, 4, 5, 5, 480, 5300]
  ,["ネクロス&バッカス", "cクリティカル/烙印", 3, 6, 5, 5, 235, 5431]
  ,["", "cクリティカル++/烙印/特攻[1.6]", 5, 6, 6, 8, 829, 6811]
  ,["キムンカムイ", "c武器種変更：無", 3, 2, 2, 4, 290, 5850]
  ,["", "c武器種変更：無/滋養/凍結", 4, 2, 2, 4, 590, 5820]
  ,["チラマンテプ", "c熱情/武器種変更：無/凍結/意気", 2, 2, 1, 1, 118, 6262]
  ,["", "", 2, 3, 1, 1, 118, 6262]
  ,["", "", 2, 4, 1, 1, 118, 6262]
  ,["", "", 2, 5, 1, 1, 118, 6262]
  ,["", "", 2, 6, 1, 1, 118, 6262]
  ,["", "", 2, 7, 1, 1, 118, 6262]
  ,["", "", 2, 8, 1, 1, 118, 6262]
  ,["", "", 2, 9, 1, 1, 118, 6262]
]);

function splitCharaNames(s){
  var r = [];
  s.split("/").forEach(function(x){
    var f = 0;
    for(var i = 1; i < CARD.length; i++){
      if(t(CARD[i].name, 0) === x){
        r.push(i);
        f = 1;
      }else if(f){
        break;
      }
    }
  });
  return r;
}
