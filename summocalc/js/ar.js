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
    return t(this.name) || "－－－－－－－－－－－－－－－";
  },
  getValue: function(lv){
    return this.value.mul(100 + lv, 100);
  }
};
Record.createList = function(a){
  var c = 1000;
  var ids = [];
  return a.map(function(v, i){
    var id = v.splice(1, 1)[0];
    if(id === undefined) id = ++c;
    if(ids.indexOf(id) !== -1) throw new Error("AR IDが重複しています（" + id + "）");
    ids.push(id);
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
      if(z[1] && z[1] !== EQUIP.ANY){
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

var EQUIP = {
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
  ,["見習い使い魔の応援/Support of the Apprentice Familiar", 1, "", 50, 0, EQUIP.ALLROUND, 0, ""]
  ,["深淵の門番の破片/Shard of the Abyssal Gatekeeper", 2, "", 75, 0, EQUIP.NETHER, 0, ""]
  ,["遠雷の闘士の破片", 3, "", 200, 0, EQUIP.AETHER, 0, ""]
  ,["今、ここだけにしかない物語", 101, "", 300, EQUIP.ANY, 0, 0, ""]
  ,["お宝目指して何処までも", 107, "", 200, EQUIP.ANY, 0, 0, ""]
  ,["教えの庭にも", 108, "", 200, EQUIP.ANY, 0, 0, ""]
  ,["拮抗の例外処理？/Exception of Antagonism?", 102, "", 150, 0, EQUIP.WATER, 0, ""]
  ,["魔王と魔王/Dark Lords", 103, "", 150, EQUIP.ANY, 0, 0, ""]
  ,["仰げば尊し", 104, "", 100, EQUIP.ANY, 0, 0, ""]
  ,["聖夜のダブル・ヒーロー！", 105, "", 150, 0, 0, EQUIP.SLASH|EQUIP.THRUST|EQUIP.BLOW, "タウラスマスク/クランプス"]
  ,["ギュウマオウ式OJT！/OJT: The Gyumao Way", 106, "", 0, 0, 0, EQUIP.LONGSLASH|EQUIP.MAGIC, "ギュウマオウ/セト"]
  ,["友情のコンビネーション！", 109, "友情時強化", 200, EQUIP.ANY, 0, 0, ""]
  ,["開拓の誓い", , "", 100, 0, EQUIP.NETHER, 0, "主人公/シロウ"]
  ,["無窮の誓い", , "クリティカル", 400, 0, EQUIP.AETHER, 0, "主人公/ケンゴ"]
  ,["豊穣の誓い", , "", 0, 0, EQUIP.WOOD, 0, "主人公/リョウタ"]
  ,["根絶の誓い", , "", 250, 0, EQUIP.WATER, 0, "主人公/トウジ"]
  ,["結合の誓い", , "", 300, 0, EQUIP.FIRE, 0, "主人公/アルク"]
  ,["犬どもの戦場", , "", 300, 0, EQUIP.FIRE|EQUIP.WATER, 0, "モリタカ/タダトモ/シノ"]
  ,["ミッションコンプリート", , "クリティカル", 200, 0, 0, EQUIP.SHOT|EQUIP.SNIPE, "コタロウ/オセ"]
  ,["計り知れざる永劫の", , "特攻[1.4]", 100, 0, 0, EQUIP.MAGIC, "シロウ"]
  ,["先輩と後輩の時間", , "", 400, 0, 0, EQUIP.BLOW|EQUIP.LONGSLASH, "グンゾウ/ワカン・タンカ"]
  ,["従者並びて", , "", 0, 0, EQUIP.FIRE|EQUIP.WOOD, 0, "オニワカ/カーシー"]
  ,["シューティングスターズ", , "回避に貫通/連撃", 300, 0, 0, EQUIP.THRUST|EQUIP.SHOT, "イクトシ/バティム"]
  ,["幼馴染の流儀", , "", 200, 0, EQUIP.AETHER|EQUIP.NETHER, 0, "シロウ/ケンゴ", 1]
  ,["魔王の温泉郷へようこそ", , "", 100, 0, EQUIP.NETHER, 0, "アンドヴァリ/チェルノボーグ"]
  ,["大江山の鬼たち", , "", 400, 0, EQUIP.FIRE|EQUIP.WATER|EQUIP.WOOD, 0, "シュテン/イバラキ", 1]
  ,["新宿ポリスアカデミー", , "", 200, 0, EQUIP.WOOD|EQUIP.VALIANT, 0, "タヂカラオ/ホウゲン"]
  ,["ナンパの心得", , "特攻[1.4]", 300, 0, EQUIP.WATER, 0, "ゴウリョウ/テュポーン"]
  ,["山の熊さんたち", , "特攻[1.4]", 150, 0, EQUIP.WOOD, 0, "アシガラ/バーゲスト"]
  ,["都会の隠れ家", , "特攻[1.4]", 75, 0, EQUIP.AETHER, 0, "ガンダルヴァ/サンダーバード"]
  ,["東京カジノへようこそ", , "特攻[1.4]", 225, 0, 0, EQUIP.SHOT|EQUIP.SNIPE, "ハクメン/ショロトル"]
  ,["次なる聖夜のために", , "", 0, 0, EQUIP.AETHER|EQUIP.NETHER, 0, "ジェド/タングリスニル"]
  ,["或る島での1ページ", , "", 75, 0, EQUIP.NETHER, 0, "アステリオス/ロビンソン"]
  ,["夏の新メニュー開発！", , "特攻[1.4]", 0, 0, EQUIP.FIRE|EQUIP.WOOD, 0, "リョウタ/チョウジ"]
  ,["休日のカラオケロード！", , "特攻[1.4]", 50, 0, EQUIP.AETHER|EQUIP.NETHER, 0, "ベヒモス/ジズ"]
  ,["糾える縄の如し", , "特攻[1.4]", 225, 0, EQUIP.NETHER, 0, "ケンタ/バーゲスト"]
  ,["OH, MY POPSTAR！", , "特攻[1.4]", 150, 0, 0, EQUIP.SHOT|EQUIP.SNIPE, "ニャルラトテプ/アザトース"]
  ,["ある家族の肖像", , "特攻[1.4]", 150, 0, EQUIP.FIRE, 0, "ハーロット/スルト"]
  ,["はじめてのオムライス！", , "特攻[1.4]", 75, 0, EQUIP.WATER, 0, "モリタカ/アギョウ"]
  ,["鍛錬あるのみ！", , "特攻[1.4]", 175, 0, EQUIP.FIRE|EQUIP.INFERNAL, 0, "クロガネ/アマツマラ/ヘパイストス"]
  ,["バディの絆", , "特攻[1.4]", 75, 0, 0, EQUIP.MAGIC, "レイヴ/カーシー"]
  ,["ようこそ池袋の劇場へ", , "特攻[1.4]", 225, 0, 0, EQUIP.SLASH, "クロード/スノウ"]
  ,["飢野学園の指導", , "特攻[1.4]", 300, 0, 0, EQUIP.SHOT|EQUIP.SNIPE, "アールプ/レイヴ"]
  ,["全ては筋肉より始まる", , "特攻[1.4]", 300, 0, 0, EQUIP.BLOW, "アマツマラ/スルト"]
  ,["父と子と", , "特攻[1.4]", 150, 0, 0, EQUIP.SHOT|EQUIP.SNIPE, "アルク/スルト"]
  ,["出発！真夏の水中冒険", , "特攻[1.4]", 225, 0, EQUIP.WATER, 0, "エイタ/テュポーン"]
  ,["おお山の喜びよ", , "特攻[1.4]", 250, 0, 0, EQUIP.BLOW, "ザオウ/チェルノボーグ"]
  ,["どっちの味方なの！？", , "特攻[1.4]", 175, 0, 0, EQUIP.MAGIC|EQUIP.LONGSLASH, "リヒト/クニヨシ/ベンテン"]
  ,["深淵の海より来たりて", , "", 250, 0, EQUIP.WATER|EQUIP.INFERNAL, 0, "トリトン/ダゴン", 2]
  ,["サン・アンド・オイル！", , "特攻[1.4]", 0, 0, EQUIP.WOOD|EQUIP.WORLD, 0, "クロガネ/タンガロア"]
  ,["サモナーズのX'MAS", , "", 200, 0, EQUIP.WATER|EQUIP.WOOD|EQUIP.ALLROUND, 0, "リョウタ/トウジ", 2]
  ,["同じ月が見ている", , "", 0, 0, 0, EQUIP.MAGIC, "マリア/ジブリール"]
  ,["夕暮れ時の青春は", , "", 200, 0, 0, EQUIP.THRUST|EQUIP.SHOT, "グンゾウ/キュウマ", 1]
  ,["バレンタイン・ドッグス！", , "", 250, 0, EQUIP.FIRE|EQUIP.NETHER, EQUIP.SLASH, "モリタカ/タダトモ"]
  ,["ショコラは深淵より来たり", , "特攻[1.6]", 0, 0, EQUIP.FIRE|EQUIP.NETHER, 0, "シロウ/シトリー"]
  ,["硬派を気取ったあの頃は", , "", 400, 0, EQUIP.AETHER, EQUIP.BLOW, "ケンゴ/シトリー"]
  ,["チョコレート・ダイナマイト！", , "", 0, 0, 0, EQUIP.MAGIC|EQUIP.SNIPE, "チョウジ/エビス"]
  ,["砂漠のプライベート・レッスン/Private Lesson in the Desert?", , "", 100, 0, EQUIP.VALIANT|EQUIP.WATER, 0, "セト/ゴウリョウ"]
  ,["蒲田ギルドの師弟/A Teacher and Student from Kamata", , "攻撃力微増", 500, 0, EQUIP.FIRE|EQUIP.WOOD, 0, "アマツマラ/クロガネ"]
  ,["サバイバルリゾート/Survival Resort", , "特攻[1.6]", 100, 0, 0, EQUIP.SHOT|EQUIP.SNIPE, "ハヌマン/ツァトグァ"]
  ,["剣豪と刀鍛冶の攻防/Battle between Swordsmith and Swordsman", , "", 300, 0, EQUIP.ALLROUND|EQUIP.FIRE, EQUIP.SLASH, "ムサシ/アマツマラ"]
  ,["寂しがりの猛牛たち/Single Bulls Club", , "", 500, 0, EQUIP.WOOD|EQUIP.NETHER, 0, "ワカン・タンカ/テツギュウ", 2]
  ,["流れ者の集う街/City of Drifters", , "", 100, 0, 0, EQUIP.SLASH|EQUIP.THRUST, "スズカ/テツギュウ"]
  ,["いつかどうして夢の鬼/Ogresses' Dream - A Different Time, A Different Place", , "", 100, 0, EQUIP.FIRE|EQUIP.AETHER, 0, "スズカ/イバラキ"]
  ,["剣の道は尚遙か/The Way of the Sword Has Just Begun", , "特攻[1.3]", 300, 0, 0, EQUIP.SLASH|EQUIP.LONGSLASH, "ホウゲン/トウジ"]
  ,["歓楽の鬼/Ogres' Nightlife", , "", 0, 0, 0, EQUIP.BLOW|EQUIP.SHOT, "スズカ/イバラキ"]
  ,["おお温泉の喜びよ", , "", 0, 0, 0, EQUIP.SLASH|EQUIP.THRUST, "ザオウ/チェルノボーグ"]
  ,["法の代行者たち", , "特攻[1.5]", 300, 0, EQUIP.FIRE|EQUIP.WOOD|EQUIP.VALIANT, 0, "ザバーニーヤ/アルスラーン"]
  ,["きょうだい弟子の組手", , "連撃", 300, 0, 0, EQUIP.THRUST|EQUIP.BLOW, "イクトシ/カグツチ", 1]
  ,["ワンダーフォーゲル！", , "", 200, 0, EQUIP.INFERNAL, EQUIP.MAGIC, "ザオウ/ドゥルガー"]
  ,["嵐を呼ぶMCバトル！/An Electrifying MC Battle!", , "", 250, 0, 0, EQUIP.BLOW|EQUIP.THRUST, "ベンテン/エーギル"]
  ,["制御できるならやってみろ！/Stop Me if You Can!", , "", 300, 0, EQUIP.AETHER|EQUIP.NETHER, 0, "フェンリル/ジャンバヴァン"]
  ,["打ち上げLIVE！/Celebration Live!", , "意気", 150, 0, EQUIP.WATER, EQUIP.BLOW|EQUIP.LONGSLASH, "ベンテン/エビス"]
  ,["奪取Theサマー/Seize the Summer!", , "", 100, 0, EQUIP.WATER, 0, "テュポーン/ベンテン"]
  ,["成果は現場にあり！/Success Must Be Sought After", , "特攻[2.0]", 100, 0, EQUIP.WOOD|EQUIP.NETHER, 0, "アリス/ヴォーロス"]
  ,["ジェノサイド・ハロウィン/Genociders' Halloween", , "クリティカル+", 500, 0, 0, EQUIP.SLASH|EQUIP.LONGSLASH, "ハーロット/スルト"]
  ,["今月の得真道学園/The Theme of the Month", , "", 400, 0, 0, EQUIP.SLASH|EQUIP.THRUST|EQUIP.MAGIC, "リチョウ/サナト・クマラ"]
  ,["ウマミチカンフージェネレーション/Umamichi Kung-Fu Generation", , "特攻[1.6]", 300, 0, EQUIP.FIRE|EQUIP.WOOD, 0, "ハヌマン/ナタ"]
]);
