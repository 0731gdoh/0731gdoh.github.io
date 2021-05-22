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
  this.guilds = splitGuildNames(x[7]);
  this.schools = splitSchoolNames(x[8]);
  this.csBoost = x[9] || 0;
  this.csWeapon = x[10] || 0;
}
Record.prototype = {
  toString: function(){
    return t(this.name) || "－－－－－－－－－－－－－－－－－";
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
    if(v.guilds) e = e.concat(affs2array(GUILD, v.guilds, x));
    if(v.schools) e = e.concat(affs2array(SCHOOL, v.schools, x));
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
  //名前, id, 補正効果, ATK基本値, レア度指定, 属性指定, 武器タイプ指定, キャラ指定, ギルド指定, 学園指定[, CS倍率補正[, CSタイプ変更]]
  [["", 0, "", 0, 0, 0, 0, "", "", ""]
  ,["見習い使い魔の応援/Support of the Apprentice Familiar", 1, "", 50, 0, EQUIP.ALLROUND, 0, "", "", ""]
  ,["深淵の門番の破片/Shard of the Abyssal Gatekeeper", 2, "", 75, 0, EQUIP.NETHER, 0, "", "", ""]
  ,["遠雷の闘士の破片", 3, "", 200, 0, EQUIP.AETHER, 0, "", "", ""]
  ,["長途の待人の破片", 4, "", 0, 0, EQUIP.WOOD, 0, "", "", ""]
  ,["今、ここだけにしかない物語", 101, "", 300, EQUIP.ANY, 0, 0, "", "", ""]
  ,["お宝目指して何処までも", 107, "", 200, EQUIP.ANY, 0, 0, "", "", ""]
  ,["教えの庭にも", 108, "", 200, EQUIP.ANY, 0, 0, "", "", ""]
  ,["拮抗の例外処理？/Exception of Antagonism?", 102, "", 150, 0, EQUIP.WATER, 0, "", "", ""]
  ,["魔王と魔王/Dark Lords", 103, "", 150, EQUIP.ANY, 0, 0, "", "", ""]
  ,["仰げば尊し", 104, "", 100, EQUIP.ANY, 0, 0, "", "", ""]
  ,["聖夜のダブル・ヒーロー！", 105, "", 150, 0, 0, EQUIP.SLASH|EQUIP.THRUST|EQUIP.BLOW, "タウラスマスク/クランプス", "", ""]
  ,["ギュウマオウ式OJT！/OJT: The Gyumao Way", 106, "", 0, 0, 0, EQUIP.LONGSLASH|EQUIP.MAGIC, "ギュウマオウ/セト", "", ""]
  ,["友情のコンビネーション！", 109, "友情時強化", 200, EQUIP.ANY, 0, 0, "", "", ""]
  ,["はぐれ者の幕間", 110, "", 0, 0, EQUIP.FIRE|EQUIP.WATER|EQUIP.AETHER, 0, "トムテ/テツヤ", "", ""]
  ,["初湯のひととき", 111, "", 0, 0, 0, EQUIP.THRUST|EQUIP.LONGSLASH|EQUIP.NONE, "ギュウマオウ/シンノウ", "", ""]
  ,["曙光に燃える", 112, "", 400, 0, EQUIP.FIRE|EQUIP.WOOD|EQUIP.WORLD, 0, "タウラスマスク/ワカン・タンカ", "", "", 1]
  ,["しゃかりき稼ぐぜ海の家/Money-Making Beach House", 113, "", 200, 0, EQUIP.FIRE|EQUIP.WATER, 0, "ノーマッド/タダトモ", "", ""]
  ,["我ら今は共に歩みて", 114, "", 250, EQUIP.RARE1|EQUIP.RARE2, 0, 0, "", "バーサーカーズ/ミッショネルズ/タイクーンズ", ""]
  ,["開拓の誓い", , "", 100, 0, EQUIP.NETHER, 0, "主人公/シロウ", "", ""]
  ,["無窮の誓い", , "クリティカル", 400, 0, EQUIP.AETHER, 0, "主人公/ケンゴ", "", ""]
  ,["豊穣の誓い", , "", 0, 0, EQUIP.WOOD, 0, "主人公/リョウタ", "", ""]
  ,["根絶の誓い", , "", 250, 0, EQUIP.WATER, 0, "主人公/トウジ", "", ""]
  ,["結合の誓い", , "", 300, 0, EQUIP.FIRE, 0, "主人公/アルク", "", ""]
  ,["犬どもの戦場", , "", 300, 0, EQUIP.FIRE|EQUIP.WATER, 0, "モリタカ/タダトモ/シノ", "", ""]
  ,["ミッションコンプリート", , "クリティカル", 200, 0, 0, EQUIP.SHOT|EQUIP.SNIPE, "コタロウ/オセ", "", ""]
  ,["計り知れざる永劫の", , "恐怖に特攻[1.4]", 100, 0, 0, EQUIP.MAGIC, "シロウ", "", ""]
  ,["先輩と後輩の時間", , "", 400, 0, 0, EQUIP.BLOW|EQUIP.LONGSLASH, "グンゾウ/ワカン・タンカ", "", ""]
  ,["従者並びて", , "", 0, 0, EQUIP.FIRE|EQUIP.WOOD, 0, "オニワカ/カーシー", "", ""]
  ,["シューティングスターズ", , "回避に貫通/連撃", 300, 0, 0, EQUIP.THRUST|EQUIP.SHOT, "イクトシ/バティム", "", ""]
  ,["幼馴染の流儀", , "", 200, 0, EQUIP.AETHER|EQUIP.NETHER, 0, "シロウ/ケンゴ", "", "", 1]
  ,["魔王の温泉郷へようこそ", , "", 100, 0, EQUIP.NETHER, 0, "アンドヴァリ/チェルノボーグ", "", ""]
  ,["大江山の鬼たち", , "", 400, 0, EQUIP.FIRE|EQUIP.WATER|EQUIP.WOOD, 0, "シュテン/イバラキ", "", "", 1]
  ,["新宿ポリスアカデミー", , "", 200, 0, EQUIP.WOOD|EQUIP.VALIANT, 0, "タヂカラオ/ホウゲン", "", ""]
  ,["ナンパの心得", , "崩しに特攻[1.4]", 300, 0, EQUIP.WATER, 0, "ゴウリョウ/テュポーン", "", ""]
  ,["山の熊さんたち", , "根性に特攻[1.4]", 150, 0, EQUIP.WOOD, 0, "アシガラ/バーゲスト", "", ""]
  ,["都会の隠れ家", , "加速に特攻[1.4]", 75, 0, EQUIP.AETHER, 0, "ガンダルヴァ/サンダーバード", "", ""]
  ,["東京カジノへようこそ", , "闘志に特攻[1.4]", 225, 0, 0, EQUIP.SHOT|EQUIP.SNIPE, "ハクメン/ショロトル", "", ""]
  ,["次なる聖夜のために", , "", 0, 0, EQUIP.AETHER|EQUIP.NETHER, 0, "ジェド/タングリスニル", "", ""]
  ,["或る島での1ページ", , "", 75, 0, EQUIP.NETHER, 0, "アステリオス/ロビンソン", "", ""]
  ,["夏の新メニュー開発！", , "祝福に特攻[1.4]", 0, 0, EQUIP.FIRE|EQUIP.WOOD, 0, "リョウタ/チョウジ", "", ""]
  ,["休日のカラオケロード！", , "脱力に特攻[1.4]", 50, 0, EQUIP.AETHER|EQUIP.NETHER, 0, "ベヒモス/ジズ", "", ""]
  ,["糾える縄の如し", , "呪いに特攻[1.4]", 225, 0, EQUIP.NETHER, 0, "ケンタ/バーゲスト", "", ""]
  ,["OH, MY POPSTAR！", , "恐怖に特攻[1.4]", 150, 0, 0, EQUIP.SHOT|EQUIP.SNIPE, "ニャルラトテプ/アザトース", "", ""]
  ,["ある家族の肖像", , "祝福に特攻[1.4]", 150, 0, EQUIP.FIRE, 0, "ハーロット/スルト", "", ""]
  ,["はじめてのオムライス！", , "呪いに特攻[1.4]", 75, 0, EQUIP.WATER, 0, "モリタカ/アギョウ", "", ""]
  ,["鍛錬あるのみ！", , "頑強に特攻[1.4]", 175, 0, EQUIP.FIRE|EQUIP.INFERNAL, 0, "クロガネ/アマツマラ/ヘパイストス", "", ""]
  ,["バディの絆", , "頑強に特攻[1.4]", 75, 0, 0, EQUIP.MAGIC, "レイヴ/カーシー", "", ""]
  ,["ようこそ池袋の劇場へ", , "熱情に特攻[1.4]", 225, 0, 0, EQUIP.SLASH, "クロード/スノウ", "", ""]
  ,["飢野学園の指導", , "閃きに特攻[1.4]/集中に特攻[1.4]", 300, 0, 0, EQUIP.SHOT|EQUIP.SNIPE, "アールプ/レイヴ", "", ""]
  ,["全ては筋肉より始まる", , "剛力に特攻[1.4]", 300, 0, 0, EQUIP.BLOW, "アマツマラ/スルト", "", ""]
  ,["父と子と", , "再生に特攻[1.4]", 150, 0, 0, EQUIP.SHOT|EQUIP.SNIPE, "アルク/スルト", "", ""]
  ,["出発！真夏の水中冒険", , "防御強化に特攻[1.4]", 225, 0, EQUIP.WATER, 0, "エイタ/テュポーン", "", ""]
  ,["おお山の喜びよ", , "凍結に特攻[1.4]", 250, 0, 0, EQUIP.BLOW, "ザオウ/チェルノボーグ", "", ""]
  ,["どっちの味方なの！？", , "幻惑に特攻[1.4]", 175, 0, 0, EQUIP.MAGIC|EQUIP.LONGSLASH, "リヒト/クニヨシ/ベンテン", "", ""]
  ,["深淵の海より来たりて", , "", 250, 0, EQUIP.WATER|EQUIP.INFERNAL, 0, "トリトン/ダゴン", "", "", 2]
  ,["サン・アンド・オイル！", , "聖油に特攻[1.4]", 0, 0, EQUIP.WOOD|EQUIP.WORLD, 0, "クロガネ/タンガロア", "", ""]
  ,["サモナーズのX'MAS", , "", 200, 0, EQUIP.WATER|EQUIP.WOOD|EQUIP.ALLROUND, 0, "リョウタ/トウジ", "", "", 2]
  ,["同じ月が見ている", , "", 0, 0, 0, EQUIP.MAGIC, "マリア/ジブリール", "", ""]
  ,["夕暮れ時の青春は", , "", 200, 0, 0, EQUIP.THRUST|EQUIP.SHOT, "グンゾウ/キュウマ", "", "", 1]
  ,["バレンタイン・ドッグス！/Valentine's Dogs!", , "", 250, 0, EQUIP.FIRE|EQUIP.NETHER, EQUIP.SLASH, "モリタカ/タダトモ", "", ""]
  ,["ショコラは深淵より来たり/Abyssal Confectionery", , "呪いに特攻[1.6]", 0, 0, EQUIP.FIRE|EQUIP.NETHER, 0, "シロウ/シトリー", "", ""]
  ,["硬派を気取ったあの頃は/Acting Tough", , "", 400, 0, EQUIP.AETHER, EQUIP.BLOW, "ケンゴ/シトリー", "", ""]
  ,["チョコレート・ダイナマイト！/Chocolate Dynamite!", , "", 0, 0, 0, EQUIP.MAGIC|EQUIP.SNIPE, "チョウジ/エビス", "", ""]
  ,["砂漠のプライベート・レッスン/Private Lesson in the Desert?", , "", 100, 0, EQUIP.VALIANT|EQUIP.WATER, 0, "セト/ゴウリョウ", "", ""]
  ,["蒲田ギルドの師弟/A Teacher and Student from Kamata", , "攻撃力微増[1.13]", 500, 0, EQUIP.FIRE|EQUIP.WOOD, 0, "アマツマラ/クロガネ", "", ""]
  ,["サバイバルリゾート/Survival Resort", , "熱情に特攻[1.6]", 100, 0, 0, EQUIP.SHOT|EQUIP.SNIPE, "ハヌマン/ツァトグァ", "", ""]
  ,["剣豪と刀鍛冶の攻防/Battle between Swordsmith and Swordsman", , "", 300, 0, EQUIP.ALLROUND|EQUIP.FIRE, EQUIP.SLASH, "ムサシ/アマツマラ", "", ""]
  ,["寂しがりの猛牛たち/Single Bulls Club", , "", 500, 0, EQUIP.WOOD|EQUIP.NETHER, 0, "ワカン・タンカ/テツギュウ", "", "", 2]
  ,["流れ者の集う街/City of Drifters", , "", 100, 0, 0, EQUIP.SLASH|EQUIP.THRUST, "スズカ/テツギュウ", "", ""]
  ,["いつかどうして夢の鬼/Ogresses' Dream - A Different Time, A Different Place", , "", 100, 0, EQUIP.FIRE|EQUIP.AETHER, 0, "スズカ/イバラキ", "", ""]
  ,["剣の道は尚遙か/The Way of the Sword Has Just Begun", , "スキル封印に特攻[1.3]/束縛に特攻[1.3]/二重封印に特攻[1.3]", 300, 0, 0, EQUIP.SLASH|EQUIP.LONGSLASH, "ホウゲン/トウジ", "", ""]
  ,["歓楽の鬼/Ogres' Nightlife", , "", 0, 0, 0, EQUIP.BLOW|EQUIP.SHOT, "スズカ/イバラキ", "", ""]
  ,["おお温泉の喜びよ", , "", 0, 0, 0, EQUIP.SLASH|EQUIP.THRUST, "ザオウ/チェルノボーグ", "", ""]
  ,["法の代行者たち", , "再生に特攻[1.5]/祝福に特攻[1.5]/滋養に特攻[1.5]/聖油に特攻[1.5]", 300, 0, EQUIP.FIRE|EQUIP.WOOD|EQUIP.VALIANT, 0, "ザバーニーヤ/アルスラーン", "", ""]
  ,["きょうだい弟子の組手", , "連撃", 300, 0, 0, EQUIP.THRUST|EQUIP.BLOW, "イクトシ/カグツチ", "", "", 1]
  ,["ワンダーフォーゲル！", , "", 200, 0, EQUIP.INFERNAL, EQUIP.MAGIC, "ザオウ/ドゥルガー", "", ""]
  ,["嵐を呼ぶMCバトル！/An Electrifying MC Battle!", , "", 250, 0, 0, EQUIP.BLOW|EQUIP.THRUST, "ベンテン/エーギル", "", ""]
  ,["制御できるならやってみろ！/Stop Me if You Can!", , "", 300, 0, EQUIP.AETHER|EQUIP.NETHER, 0, "フェンリル/ジャンバヴァン", "", ""]
  ,["打ち上げLIVE！/Celebration Live!", , "意気", 150, 0, EQUIP.WATER, EQUIP.BLOW|EQUIP.LONGSLASH, "ベンテン/エビス", "", ""]
  ,["奪取Theサマー/Seize the Summer!", , "", 100, 0, EQUIP.WATER, 0, "テュポーン/ベンテン", "", ""]
  ,["成果は現場にあり！/Success Must Be Sought After", , "幻惑に特攻[2.0]", 100, 0, EQUIP.WOOD|EQUIP.NETHER, 0, "アリス/ヴォーロス", "", ""]
  ,["ジェノサイド・ハロウィン/Genociders' Halloween", , "クリティカル+", 500, 0, 0, EQUIP.SLASH|EQUIP.LONGSLASH, "ハーロット/スルト", "", ""]
  ,["今月の得真道学園/The Theme of the Month", , "", 400, 0, 0, EQUIP.SLASH|EQUIP.THRUST|EQUIP.MAGIC, "リチョウ/サナト・クマラ", "", ""]
  ,["ウマミチカンフージェネレーション/Umamichi Kung-Fu Generation", , "暴走に特攻[1.6]/暴走+に特攻[1.6]", 300, 0, EQUIP.FIRE|EQUIP.WOOD, 0, "ハヌマン/ナタ", "", ""]
  ,["コリーダ・デ・トーロス", , "", 250, 0, EQUIP.WOOD|EQUIP.AETHER, 0, "アステリオス/タウラスマスク", "", ""]
  ,["上質の一杯", , "滋養", 200, 0, 0, EQUIP.BLOW|EQUIP.SLASH|EQUIP.LONGSLASH, "スノウ/ギュウマオウ", "", ""]
  ,["浅草ダウンタウンボーイズ/Asakusa Downtown Boys", , "根性時強化[1.5]", 200, 0, 0, EQUIP.THRUST|EQUIP.BLOW, "テツギュウ/ハヌマン", "", ""]
  ,["昼休みの購買部闘争！/School Lunchtime Battle!", , "", 400, 0, 0, EQUIP.BLOW, "ナタ/テツギュウ", "", ""]
  ,["鬼も、福も/Ogres and Fortune", , "鬼道の衆に特攻[2.0]", 100, 0, EQUIP.FIRE|EQUIP.INFERNAL, 0, "タケマル/モトスミ", "", ""]
  ,["禅の心/Spirit of Zen", , "集中", 0, 0, EQUIP.VALIANT, EQUIP.THRUST, "オニワカ/シュテン", "", ""]
  ,["浅草の愚連隊/Asakusa Gang", , "剛力時強化", 200, 0, 0, EQUIP.THRUST|EQUIP.MAGIC, "モトスミ/リチョウ", "", ""]
  ,["フィスト・ファイト！/Fist Fight!", , "威圧に特攻[1.4]", 400, 0, 0, EQUIP.BLOW, "オニワカ/イバラキ", "", ""]
  ,["父の思い出", , "火傷に特攻[2.0]", 100, 0, 0, EQUIP.SLASH|EQUIP.MAGIC|EQUIP.LONGSLASH, "マルコシアス/タダトモ", "", ""]
  ,["バレンタイン・ライブ！", , "", 200, 0, EQUIP.WATER|EQUIP.AETHER, 0, "ジブリール/マーナガルム", "", "", 2]
  ,["愛の牢獄", , "", 200, 0, EQUIP.FIRE|EQUIP.WOOD|EQUIP.AETHER, 0, "ショロトル/ハクメン", "", ""]
  ,["鉄血のバージンロード", , "", 300, 0, 0, EQUIP.MAGIC, "クロード/スノウ", "", ""]
  ,["再生のキャンバス", , "", 0, 0, 0, EQUIP.SHOT|EQUIP.SNIPE|EQUIP.NONE, "リヒト/イツァムナー", "", ""]
  ,["神宿学園の食いしん坊番長", , "滋養に特攻[1.4]", 150, 0, EQUIP.WOOD|EQUIP.NETHER, 0, "ベヒモス/リョウタ", "", ""]
  ,["黄金の実り/Golden Harvest", , "連撃", 300, 0, 0, EQUIP.THRUST, "ヴォーロス/ゴエモン", "", ""]
  ,["お宝にはご用心/Eyes on the Prize", , "", 200, 0, 0, EQUIP.MAGIC|EQUIP.NONE, "アンドヴァリ/コタロウ", "", "", 2]
  ,["アタックオブザウォーターメロン/Attack of the Killer Watermelons", , "", 400, 0, EQUIP.FIRE|EQUIP.WOOD, 0, "チョウジ/ヴォーロス", "", ""]
  ,["Surf the wave/Surfing the Wave", , "妨害に特攻[1.6]", 200, 0, 0, EQUIP.BLOW, "セト/ゴエモン", "", ""]
  ,["青春は君をおって/In the Flower of Youth", , "", 300, 0, EQUIP.FIRE|EQUIP.INFERNAL, 0, "ドゥルガー/グンゾウ", "", "", 2]
  ,["おいでよぼくらのもふもふ王国/Welcome to the Furry Kingdom!", , "", 200, 0, 0, EQUIP.THRUST|EQUIP.MAGIC, "クニヨシ/カーシー", "", ""]
  ,["出会いは決定的に/Treasure Every Meeting", , "怒時強化", 400, 0, EQUIP.WATER|EQUIP.WOOD|EQUIP.NETHER, 0, "クニヨシ/ベンテン", "", "", 1]
  ,["寂しがりのプランクスター/The Lonely Prankster", , "", 100, 0, 0, EQUIP.BLOW, "アールプ/カーシー", "", ""]
  ,["夢のもふもふ大激突！/The Great Fluffy Clash of Dreams!", , "獣の末裔に特攻[1.5]/獣皮を巻く者に特攻[1.5]", 300, 0, EQUIP.WOOD|EQUIP.NETHER, 0, "クニヨシ/アールプ", "", ""]
  ,["芸術は光と陰に/All in Art is Light and Dark", , "", 150, 0, EQUIP.AETHER|EQUIP.NETHER, 0, "クニヨシ/リヒト", "", ""]
]);
