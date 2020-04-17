function Record(index, id, x){
  this.index = index;
  this.id = id;
  this.name = x[0];
  this.effects = splitEffects(x[1]);
  this.value = new Fraction(x[2]);
  this.rarity = x[3];
  this.attribute = x[4];
  this.weapon = x[5];
  this.chara = splitCharaNames(x[6]);
  this.csBoost = x[7] || 0;
  this.csWeapon = x[8] || 0;
}
Record.prototype = {
  toString: function(){
    return t(this.name) || "－－－－－－－－－－－－－－－－－－";
  },
  getValue: function(lv){
    return this.value.mul(100 + lv, 100);
  }
};
Record.createList = function(a){
  var c = 1000;
  return a.map(function(v, i){
    var id = v.splice(1, 1)[0];
    if(id === undefined) id = ++c;
    return new Record(i, id, v);
  });
};
Record.csv = function(list, x){
  return list.map(function(v){
    var e = [];
    if(!v.name) return t("#,名前,装備制限,ATK,効果,CS倍率,CSタイプ/#,Name,Limitation,ATK,Effects,CSRate,CSType", x);
    v.chara.forEach(function(z){
      var name = t(CARD[z].name, x);
      if(name !== e[e.length - 1]) e.push(name);
    });
    [
      [RARITY, v.rarity],
      [ATTRIBUTE, v.attribute],
      [WEAPON, v.weapon]
    ].forEach(function(z){
      if(z[1] && z[1] !== FLAG.ANY){
        z[0].forEach(function(w, i){
          if(z[1] & (1 << i)) e.push(t(w.name, x));
        });
      }
    });
    if(!e.length) e.push(t("(制限なし)/(No limit)", x));
    return [
      v.index,
      '"' + t(v.name, x) + '"',
      e.join("|"),
      v.value - 0,
      v.effects.map(function(n){return t(EFFECT[n].name, x)}).join("/"),
      ["", "(+1)", "(+2)"][v.csBoost],
      t(WEAPON[v.csWeapon].name, x)
    ].join(",");
  }).join("\n");
};

var FLAG = {
  ANY: 0x1FF,
  RARE1: 1 << 1,
  RARE2: 1 << 2,
  RARE3: 1 << 3,
  RARE4: 1 << 4,
  RARE5: 1 << 5,
  SLASH: 1 << 1,
  THRUST: 1 << 2,
  BLOW: 1 << 3,
  SHOT: 1 << 4,
  MAGIC: 1 << 5,
  SNIPE: 1 << 6,
  LONGSLASH: 1 << 7,
  ALL: 1 << 8,
  NONE: 1 << 9,
  ALLROUND: 1 << 1,
  FIRE: 1 << 2,
  WATER: 1 << 3,
  WOOD: 1 << 4,
  AETHER: 1 << 5,
  NETHER: 1 << 6,
  INFERNAL: 1 << 7,
  VALIANT: 1 << 8,
  WORLD: 1 << 9
};

var AR = Record.createList(
  //名前, id, 補正効果, ATK基本値, レア度指定, 属性指定, 武器タイプ指定, キャラ指定[, CS倍率補正[, CSタイプ変更]]
  [["", 0, "", 0, 0, 0, 0, ""]
  ,["見習い使い魔の応援/Support of the Apprentice Familiar", 1, "", 50, 0, FLAG.ALLROUND, 0, ""]
  ,["深淵の門番の破片/Shard of the Abyssal Gatekeeper", 2, "", 75, 0, FLAG.NETHER, 0, ""]
  ,["遠雷の闘士の破片", 3, "", 200, 0, FLAG.AETHER, 0, ""]
  ,["今、ここだけにしかない物語", 101, "", 300, FLAG.ANY, 0, 0, ""]
  ,["拮抗の例外処理？/Exception of Antagonism?", 102, "", 150, 0, FLAG.WATER, 0, ""]
  ,["魔王と魔王/Dark Lords", 103, "", 150, FLAG.ANY, 0, 0, ""]
  ,["仰げば尊し", 104, "", 100, FLAG.ANY, 0, 0, ""]
  ,["聖夜のダブル・ヒーロー！", 105, "", 150, 0, 0, FLAG.SLASH|FLAG.THRUST|FLAG.BLOW, "タウラスマスク/クランプス"]
  ,["開拓の誓い", , "", 100, 0, FLAG.NETHER, 0, "主人公/シロウ"]
  ,["無窮の誓い", , "クリティカル", 400, 0, FLAG.AETHER, 0, "主人公/ケンゴ"]
  ,["豊穣の誓い", , "", 0, 0, FLAG.WOOD, 0, "主人公/リョウタ"]
  ,["根絶の誓い", , "", 250, 0, FLAG.WATER, 0, "主人公/トウジ"]
  ,["結合の誓い", , "", 300, 0, FLAG.FIRE, 0, "主人公/アルク"]
  ,["犬どもの戦場", , "", 300, 0, FLAG.FIRE|FLAG.WATER, 0, "モリタカ/タダトモ/シノ"]
  ,["ミッションコンプリート", , "クリティカル", 200, 0, 0, FLAG.SHOT|FLAG.SNIPE, "コタロウ/オセ"]
  ,["計り知れざる永劫の", , "特攻[1.4]", 100, 0, 0, FLAG.MAGIC, "シロウ"]
  ,["先輩と後輩の時間", , "", 400, 0, 0, FLAG.BLOW|FLAG.LONGSLASH, "グンゾウ/ワカン・タンカ"]
  ,["従者並びて", , "", 0, 0, FLAG.FIRE|FLAG.WOOD, 0, "オニワカ/カーシー"]
  ,["シューティングスターズ", , "回避に貫通/連撃", 300, 0, 0, FLAG.THRUST|FLAG.SHOT, "イクトシ/バティム"]
  ,["幼馴染の流儀", , "", 200, 0, FLAG.AETHER|FLAG.NETHER, 0, "シロウ/ケンゴ", 1]
  ,["魔王の温泉郷へようこそ", , "", 100, 0, FLAG.NETHER, 0, "アンドヴァリ/チェルノボーグ"]
  ,["大江山の鬼たち", , "", 400, 0, FLAG.FIRE|FLAG.WATER|FLAG.WOOD, 0, "シュテン/イバラキ", 1]
  ,["新宿ポリスアカデミー", , "", 200, 0, FLAG.WOOD|FLAG.VALIANT, 0, "タヂカラオ/ホウゲン"]
  ,["ナンパの心得", , "特攻[1.4]", 300, 0, FLAG.WATER, 0, "ゴウリョウ/テュポーン"]
  ,["山の熊さんたち", , "特攻[1.4]", 150, 0, FLAG.WOOD, 0, "アシガラ/バーゲスト"]
  ,["都会の隠れ家", , "特攻[1.4]", 75, 0, FLAG.AETHER, 0, "ガンダルヴァ/サンダーバード"]
  ,["東京カジノへようこそ", , "特攻[1.4]", 225, 0, 0, FLAG.SHOT|FLAG.SNIPE, "ハクメン/ショロトル"]
  ,["次なる聖夜のために", , "", 0, 0, FLAG.AETHER|FLAG.NETHER, 0, "ジェド/タングリスニル"]
  ,["或る島での１ページ", , "", 75, 0, FLAG.NETHER, 0, "アステリオス/ロビンソン"]
  ,["夏の新メニュー開発！", , "特攻[1.4]", 0, 0, FLAG.FIRE|FLAG.WOOD, 0, "リョウタ/チョウジ"]
  ,["休日のカラオケロード！", , "特攻[1.4]", 50, 0, FLAG.AETHER|FLAG.NETHER, 0, "ベヒモス/ジズ"]
  ,["糾える縄の如し", , "特攻[1.4]", 225, 0, FLAG.NETHER, 0, "ケンタ/バーゲスト"]
  ,["OH, MY POPSTAR！", , "特攻[1.4]", 150, 0, 0, FLAG.SHOT|FLAG.SNIPE, "ニャルラトテプ/アザトース"]
  ,["ある家族の肖像", , "特攻[1.4]", 150, 0, FLAG.FIRE, 0, "ハーロット/スルト"]
  ,["はじめてのオムライス！", , "特攻[1.4]", 75, 0, FLAG.WATER, 0, "モリタカ/アギョウ"]
  ,["鍛錬あるのみ！", , "特攻[1.4]", 175, 0, FLAG.FIRE|FLAG.INFERNAL, 0, "クロガネ/アマツマラ/ヘパイストス"]
  ,["バディの絆", , "特攻[1.4]", 75, 0, 0, FLAG.MAGIC, "レイヴ/カーシー"]
  ,["ようこそ池袋の劇場へ", , "特攻[1.4]", 225, 0, 0, FLAG.SLASH, "クロード/スノウ"]
  ,["飢野学園の指導", , "特攻[1.4]", 300, 0, 0, FLAG.SHOT|FLAG.SNIPE, "アールプ/レイヴ"]
  ,["全ては筋肉より始まる", , "特攻[1.4]", 300, 0, 0, FLAG.BLOW, "アマツマラ/スルト"]
  ,["父と子と", , "特攻[1.4]", 150, 0, 0, FLAG.SHOT|FLAG.SNIPE, "アルク/スルト"]
  ,["出発！真夏の水中冒険", , "特攻[1.4]", 225, 0, FLAG.WATER, 0, "エイタ/テュポーン"]
  ,["おお山の喜びよ", , "特攻[1.4]", 250, 0, 0, FLAG.BLOW, "ザオウ/チェルノボーグ"]
  ,["どっちの味方なの！？", , "特攻[1.4]", 175, 0, 0, FLAG.MAGIC|FLAG.LONGSLASH, "リヒト/クニヨシ/ベンテン"]
  ,["深淵の海より来たりて", , "", 250, 0, FLAG.WATER|FLAG.INFERNAL, 0, "トリトン/ダゴン", 2]
  ,["サン・アンド・オイル！", , "特攻[1.4]", 0, 0, FLAG.WOOD|FLAG.WORLD, 0, "クロガネ/タンガロア"]
  ,["サモナーズのX'MAS", , "", 200, 0, FLAG.WATER|FLAG.WOOD|FLAG.ALLROUND, 0, "リョウタ/トウジ", 2]
  ,["同じ月が見ている", , "", 0, 0, 0, FLAG.MAGIC, "マリア/ジブリール"]
  ,["夕暮れ時の青春は", , "", 200, 0, 0, FLAG.THRUST|FLAG.SHOT, "グンゾウ/キュウマ", 1]
  ,["バレンタイン・ドッグス！", , "", 250, 0, FLAG.FIRE|FLAG.NETHER, FLAG.SLASH, "モリタカ/タダトモ"]
  ,["ショコラは深淵より来たり", , "特攻[1.6]", 0, 0, FLAG.FIRE|FLAG.NETHER, 0, "シロウ/シトリー"]
  ,["硬派を気取ったあの頃は", , "", 400, 0, FLAG.AETHER, FLAG.BLOW, "ケンゴ/シトリー"]
  ,["チョコレート・ダイナマイト！", , "", 0, 0, 0, FLAG.MAGIC|FLAG.SNIPE, "チョウジ/エビス"]
]);