"use strict";

function Record(index, id, x){
  var skills = x.slice(1, 6).map(function(s){
    return splitSkills(s);
  });
  skills.splice(3, 0, skills[0]);
  this.index = index;
  this.id = id;
  this.name = x[0];
  this.effects = generateEffectData(skills[0], 0).concat(generateEffectData(skills[2], 1));
  this.tag = skills.map(function(s, i){
    return generateTagData(s, i, TIMING_FLAG.AR);
  });
  this.arRarity = x[6];
  this.value = new Fraction(x[7]);
  this.hp = x[6] * 100 - x[7];
  this.rarity = x[8];
  this.attribute = x[9];
  this.weapon = x[10];
  this.chara = splitCharaNames(x[11]);
  this.guilds = splitGuildNames(x[12]);
  this.schools = splitSchoolNames(x[13]);
  this.csBoost = x[14] || 0;
  this.csWeapon = x[15] || 0;
}
Record.prototype = {
  toString: function(){
    return t(this.name) || "－";
  },
  getValue: function(lv){
    return this.value.mul(100 + lv, 100);
  },
  getLimitation: function(lang){
    var e = [];
    var d = [
      [ATTRIBUTE, this.attribute],
      [WEAPON, this.weapon]
    ];
    this.chara.forEach(function(z){
      var name = t(CARD[z].name, lang);
      if(name !== e[e.length - 1]) e.push(name);
    });
    if(this.guilds) e = e.concat(affs2array(GUILD, this.guilds, lang));
    if(this.schools) e = e.concat(affs2array(SCHOOL, this.schools, lang));
    if(this.rarity && this.rarity !== EQUIP.ANY){
      var bit = this.rarity;
      var n = 0;
      var m = 0;
      while(!(bit & 1)){
        bit = bit >> 1;
        n++;
      }
      m = n - 1;
      while(bit & 1){
        bit = bit >> 1;
        m++;
      }
      if(!bit && n < 5 && m === 5){
        e.push(t(RARITY[n].name, lang) + t("以上/Over", lang));
      }else if(!bit && n === 1 && m > 1){
        e.push(t(RARITY[m].name, lang) + t("以下/Under", lang));
      }else{
        d.unshift([RARITY, this.rarity]);
      }
    }
    d.forEach(function(z){
      if(z[1] && z[1] !== EQUIP.ANY){
        z[0].forEach(function(w, i){
          if(z[1] & (1 << i)) e.push(t(w.name, lang));
        });
      }
    });
    if(!e.length) e.push(t("(制限なし)/(No limit)", lang));
    return e;
  },
  getInfo: function(){
    var r = [
      RARITY[this.arRarity] + " " + this,
      "[HP+" + this.hp + " / ATK+" + (this.value - 0) + "]",
      "■ " + this.getLimitation().join(" OR ")
    ];
    var s = [
      ["自身に/", "/ to Self"],
      ["味方に/", "/ to Ally"],
      ["敵に/", "/ to Enemy"],
      ["/A.Bonus to ", "に特攻/"],
      ["/D.Bonus from ", "に特防/"],
      ["/Nullify ", "無効/"]
    ];
    this.tag.forEach(function(x, i){
      var ex = [];
      var c = [];
      var tags = x.map(function(d){
        var tag = TAG[d[0] % TAG_MAX];
        if(i < 3 && tag.category.length) ex = ex.concat(tag.category);
        if(i > 2 && tag.subset.length) ex = ex.concat(tag.subset);
        if(tag.name.indexOf("に貫通") !== -1){
          s[3][0] = "/Ignore ";
          s[3][1] = s[3][1].replace("特攻", "貫通");
          return 0;
        }
        if(ex.indexOf(tag.index) !== -1) return 0;
        if(tag.name[0] === "特"){
          var w = "攻防".indexOf(tag.name[1]);
          if(w !== -1){
            var v = tag.name.slice(2, tag.name.indexOf("/"));
            s[w + 3][0] = s[w + 3][0].replace(" ", v + " ");
            s[w + 3][1] = s[w + 3][1].replace("/", v + "/");
            return 0;
          }
        }
        if(tag.type === TAG_TYPE.STATIC){
          c.push(tag);
          return 0;
        }
        return tag;
      }).filter(function(x){return x});
      if(c.length) r.push(c.join("/"));
      if(tags.length) r.push(t(s[i][0]) + tags.join("/") + t(s[i][1]));
    });
    return r.join("\n");
  }
};
Record.createList = function(a){
  var c = 1000;
  var ids = [];
  var order = [];
  var result = a.map(function(v, i){
    var id = v.splice(1, 1)[0];
    if(id === undefined) id = ++c;
    if(ids.indexOf(id) !== -1) throw new Error("AR IDが重複しています（" + id + "）");
    ids.push(id);
    if(id === 101 || id === 1001) order.push(0);
    order.push(i);
    if(v[14]){
      var cb = "CS威力増加(+" + v[14] + ")";
      v[1] += v[1] ? "/" + cb : cb;
    }
    return new Record(i, id, v);
  });
  result.ORDER = order;
  result.LABELS = ["クエスト報酬/Quest Reward", "ショップ・イベント/Shop or Event", "AR召喚/AR Summons"];
  return result;
};
Record.csv = function(list, x){
  return list.map(function(v){
    if(!v.name){
      return t("#,レア度,名前,HP,ATK,ダメージ補正,効果(自身),効果(味方),効果(敵),特攻,特防,状態無効,CS倍率,CSタイプ,装備制限/#,Rarity,Name,HP,ATK,DamageModifier,Effects(Self),Effects(Ally),Effects(Enemy),AttackBonus,DefenseBonus,NullifyStatus,CSRate,CSType,Limitation", x);
    }else{
      var e = v.getLimitation(x);
      var r = [
        v.index,
        v.arRarity,
        '"' + t(v.name, x) + '"',
        v.hp,
        v.value - 0,
        v.effects.map(function(n){return t(EFFECT[n].name, x)}).join("/")
      ];
      v.tag.forEach(function(z){
        r.push(z.map(function(a){
          var tag = TAG[a[0] % TAG_MAX];
          if(tag.type === TAG_TYPE.CATEGORY) return 0;
          return timing2str(a[1], x, a[0] > TAG_MAX) + t(tag.name, x);
        }).filter(function(n){return n}).join("/"));
      });
      r.push(["", "(+1)", "(+2)"][v.csBoost], t(WEAPON[v.csWeapon].name, x), e.join("|"));
      return r.join(",");
    }
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
  WORLD: 1 << 9,
  INFINITY: 1 << 10,
  ZERO: 1 << 11
};

var AR = Record.createList(
  //名前, id, 効果(自身), 効果(味方), 効果(敵), 特防, 耐性, レア度, ATK基本値, レア度指定, 属性指定, 武器タイプ指定, キャラ指定, ギルド指定, 学園指定[, CS倍率補正[, CSタイプ変更]]
  [["", 0, "", "", "", "", "", 0, 0, 0, 0, 0, "", "", ""]
  ,["見習い使い魔の応援/Support of the Apprentice Familiar/みならいつかいまのおうえん", 1, "CP増加", "", "", "", "", 1, 50, 0, EQUIP.ALLROUND, 0, "", "", ""]
  ,["深淵の門番の破片/Shard of the Abyssal Gatekeeper/しんえんのもんばんのはへん", 2, "", "", "", "", "恐怖", 2, 75, 0, EQUIP.NETHER, 0, "", "", ""]
  ,["遠雷の闘士の破片/遠雷の闘士の破片/えんらいのとうしのはへん", 3, "", "", "", "", "マヒ", 2, 200, 0, EQUIP.AETHER, 0, "", "", ""]
  ,["長途の待人の破片/長途の待人の破片/ちょうとのまちびとのはへん", 4, "", "", "", "", "告死", 2, 0, 0, EQUIP.WOOD, 0, "", "", ""]
  ,["今、ここだけにしかない物語/今、ここだけにしかない物語/いま、ここだけにしかないものがたり", 101, "HP回復/獲得ランク経験値アップ", "", "", "", "", 4, 300, EQUIP.ANY, 0, 0, "", "", ""]
  ,["お宝目指して何処までも/お宝目指して何処までも/おたからめざしてどこまでも", 107, "獲得コインアップ", "", "呪い", "", "", 4, 200, EQUIP.ANY, 0, 0, "", "", ""]
  ,["教えの庭にも/教えの庭にも/おしえのにわにも", 108, "獲得経験値アップ/獲得ランク経験値アップ", "", "", "", "", 4, 200, EQUIP.ANY, 0, 0, "", "", ""]
  ,["放課後の工房/Afterschool Workshop/ほうかごのこうぼう", 119, "種獲得率アップ", "", "根性解除/根性耐性", "", "", 4, 300, EQUIP.ANY, 0, 0, "", "", ""]
  ,["拮抗の例外処理？/Exception of Antagonism?/きっこうのれいがいしょり？", 102, "強制移動無効(後)", "", "HP減少", "", "", 2, 150, 0, EQUIP.WATER, 0, "", "", ""]
  ,["魔王と魔王/Dark Lords/まおうとまおう", 103, "", "", "", "", "毒/猛毒", 3, 150, EQUIP.ANY, 0, 0, "", "", ""]
  ,["仰げば尊し/仰げば尊し/あおげばとうとし", 104, "獲得経験値集約/獲得経験値アップ", "", "", "", "", 4, 100, EQUIP.ANY, 0, 0, "", "", ""]
  ,["聖夜のダブル・ヒーロー！/Christmas Eve's Heroic Duo!/せいやのだぶる・ひーろー！", 105, "根性/特防[0.8]", "", "", "打撃", "", 3, 150, 0, 0, EQUIP.SLASH|EQUIP.THRUST|EQUIP.BLOW, "タウラスマスク/クランプス", "", ""]
  ,["ギュウマオウ式OJT！/OJT: The Gyumao Way/ぎゅうまおうしきOJT！", 106, "特防[0.8]", "弱体解除(単)", "", "突撃", "", 3, 0, 0, 0, EQUIP.LONGSLASH|EQUIP.MAGIC, "ギュウマオウ/セト", "", ""]
  ,["友情のコンビネーション！/Made Along the Way/ゆうじょうのこんびねーしょん！", 109, "獲得戦友ポイントアップ/友情時強化", "", "", "", "", 4, 200, EQUIP.ANY, 0, 0, "", "", ""]
  ,["はぐれ者の幕間/はぐれ者の幕間/はぐれもののまくま", 110, "弱体解除(単)", "", "", "", "劫火", 3, 0, 0, EQUIP.FIRE|EQUIP.WATER|EQUIP.AETHER, 0, "トムテ/テツヤ", "", ""]
  ,["初湯のひととき/First Soak of the Year/はつゆのひととき", 111, "HP回復", "", "", "", "", 4, 0, 0, 0, EQUIP.THRUST|EQUIP.LONGSLASH|EQUIP.NONE, "ギュウマオウ/シンノウ", "", ""]
  ,["曙光に燃える/In the Fires of Daybreak/しょこうにもえる", 112, "", "弱体解除(単)", "", "", "", 4, 400, 0, EQUIP.FIRE|EQUIP.WOOD|EQUIP.WORLD, 0, "タウラスマスク/ワカン・タンカ", "", "", 1]
  ,["しゃかりき稼ぐぜ海の家/Money-Making Beach House/しゃかりきかせぐぜうみのいえ", 113, "奮起", "HP回復", "", "", "", 3, 200, 0, EQUIP.FIRE|EQUIP.WATER, 0, "ノーマッド/タダトモ", "", ""]
  ,["我ら今は共に歩みて/我ら今は共に歩みて/われらいまはともにあゆみて", 114, "獲得ランク経験値アップ/獲得戦友ポイントアップ", "奮起", "", "", "", 5, 250, EQUIP.RARE1|EQUIP.RARE2, 0, 0, "", "バーサーカーズ/ミッショネルズ/タイクーンズ", ""]
  ,["東方の賢者たち/Wisemen of the East/とうほうのけんじゃたち", 115, "獲得コインアップ", "", "弱点", "", "", 5, 250, EQUIP.RARE1|EQUIP.RARE2, EQUIP.WORLD, 0, "", "ワイズメン", ""]
  ,["冒険に祝杯を/Cheers to Adventure/ぼうけんにしゅくはいを", 116, "魔王と名の付くスキルに特攻[1.4]/弱体無効", "", "", "", "", 3, 150, 0, 0, EQUIP.MAGIC|EQUIP.SNIPE, "ネクロス&バッカス/ソール/オルグス", "", ""]
  ,["ようこそ地獄の温泉郷/ようこそ地獄の温泉郷/ようこそじごくのおんせんきょう", 117, "凍結耐性/弱体解除(単)", "凍結耐性", "", "", "凍結", 3, 0, 0, 0, EQUIP.SLASH|EQUIP.BLOW|EQUIP.MAGIC, "ダイコク/サルタヒコ", "", ""]
  ,["スウィート・ドリームス/スウィート・ドリームス/すうぃーと・どりーむす", 118, "獲得経験値アップ", "閃き", "", "", "", 5, 200, 0, 0, EQUIP.MAGIC|EQUIP.SNIPE, "", "ビーストテイマーズ", ""]
  ,["レッツ・クラフト！/It's Crafting Time!/れっつ・くらふと！", 120, "ARトークン獲得率アップ", "攻撃力低下耐性", "", "", "", 4, 200, EQUIP.ANY, 0, 0, "", "", ""]
  ,["隣を駆ける者ども/隣を駆ける者ども/となりをかけるものども", 121, "", "崩し耐性/CP増加", "", "", "", 3, 150, 0, EQUIP.AETHER|EQUIP.VALIANT, 0, "タングリスニル/グリンブルスティ", "", ""]
  ,["虎たちの乾杯/虎たちの乾杯/とらたちのかんぱい", 122, "CP増加/威圧特攻/特攻[1.4]", "威圧特攻", "", "", "", 4, 200, 0, 0, EQUIP.THRUST|EQUIP.MAGIC, "ノーマッド/ドゥルガー/リチョウ", "", ""]
  ,["クイーン・オブ・カブキチョウ/クイーン・オブ・カブキチョウ/くいーん・おぶ・かぶきちょう", 123, "種獲得率アップ", "", "魅了", "", "", 5, 100, 0, EQUIP.NETHER|EQUIP.INFERNAL, 0, "", "アウトローズ", ""]
  ,["猫たちの憩いの場/A Place Where the Cats Can Dream/ねこたちのいこいのば", 124, "HP回復/CP増加", "", "", "", "", 3, 0, 0, 0, EQUIP.SLASH|EQUIP.MAGIC|EQUIP.NONE, "テスカトリポカ/ケットシー", "", ""]
  ,["バレンタインアドベンチャー/バレンタインアドベンチャー/ばれんたいんあどべんちゃー", 125, "HP回復", "", "", "", "疑念", 3, 200, 0, EQUIP.FIRE|EQUIP.WATER|EQUIP.WOOD, 0, "キュウマ/アキハゴンゲン", "", ""]
  ,["その日は、桜の山で/その日は、桜の山で/そのひは、さくらのやまで", 126, "根性時強化[桜の山AR]/CP増加", "CP増加", "", "", "", 4, 100, 0, EQUIP.WOOD|EQUIP.AETHER, 0, "ザオウ/シュテン", "", ""]
  ,["クラフターズの日課/クラフターズの日課/くらふたーずのにっか", 127, "ARトークン獲得率アップ/CP増加", "", "", "", "", 5, 500, 0, 0, EQUIP.THRUST|EQUIP.SHOT, "", "クラフターズ", ""]
  ,["アチアチ・ホットキャンプ！/Piping-Hot Camp!/あちあち・ほっときゃんぷ！", 128, "浄化/弱体解除(単)/滋養に特攻[1.3]", "", "", "", "", 3, 100, 0, EQUIP.FIRE|EQUIP.WOOD, 0, "カグツチ/シロウ/アイゼン", "", ""]
  ,["N番目の祝宴/N番目の祝宴/Nばんめのしゅくえん", 129, "特防[0.8]/祝福", "", "", "狙撃", "", 3, 0, 0, 0, EQUIP.LONGSLASH|EQUIP.THRUST|EQUIP.SLASH, "ヤスヨリ/オンブレティグレ", "", ""]
  ,["母と子と/母と子と/ははとこと", 130, "花獲得率アップ", "HP回復", "", "", "", 5, 100, 0, EQUIP.FIRE|EQUIP.NETHER, 0, "", "ジェノサイダーズ", ""]
  ,["夏の日の一枚/夏の日の一枚/なつのひのいちまい", 131, "意気", "", "", "", "魅了", 3, 150, 0, EQUIP.ALLROUND|EQUIP.WATER|EQUIP.INFERNAL, 0, "ベイブ・バニヤン/シュクユウ", "", ""]
  ,["ある安らぎの日/ある安らぎの日/あるやすらぎのひ", 132, "獲得コインアップ/獲得ランク経験値アップ", "", "", "", "", 5, 400, EQUIP.RARE1|EQUIP.RARE2, EQUIP.FIRE|EQUIP.WATER, 0, "", "タイクーンズ", ""]
  ,["シークレット・エージェンツ/シークレット・エージェンツ/しーくれっと・えーじぇんつ", 133, "", "", "恐怖", "", "崩し", 3, 300, 0, 0, EQUIP.SHOT|EQUIP.SLASH|EQUIP.MAGIC, "", "エージェンツ", ""]
  ,["開拓の誓い/開拓の誓い/かいたくのちかい", , "", "CP増加", "", "", "恐怖", 5, 100, 0, EQUIP.NETHER, 0, "主人公/シロウ", "", ""]
  ,["無窮の誓い/無窮の誓い/むきゅうのちかい", , "クリティカル", "", "", "", "マヒ", 5, 400, 0, EQUIP.AETHER, 0, "主人公/ケンゴ", "", ""]
  ,["豊穣の誓い/豊穣の誓い/ほうじょうのちかい", , "HP回復", "", "", "", "告死", 5, 0, 0, EQUIP.WOOD, 0, "主人公/リョウタ", "", ""]
  ,["根絶の誓い/根絶の誓い/こんぜつのちかい", , "回避", "", "", "", "憑依", 5, 250, 0, EQUIP.WATER, 0, "主人公/トウジ", "", ""]
  ,["結合の誓い/結合の誓い/けつごうのちかい", , "祈り", "", "", "", "束縛", 5, 300, 0, EQUIP.FIRE, 0, "主人公/アルク", "", ""]
  ,["犬どもの戦場/犬どもの戦場/いぬどものせんじょう", , "CP増加/特防[0.7]", "", "", "斬撃", "", 4, 300, 0, EQUIP.FIRE|EQUIP.WATER, 0, "モリタカ/タダトモ/シノ", "", ""]
  ,["ミッションコンプリート/ミッションコンプリート/みっしょんこんぷりーと", , "クリティカル/特防[0.8]", "", "", "射撃/狙撃", "", 4, 200, 0, 0, EQUIP.SHOT|EQUIP.SNIPE, "コタロウ/オセ", "", ""]
  ,["計り知れざる永劫の/計り知れざる永劫の/はかりしれざるえいごうの", , "恐怖に特攻[1.4]", "", "恐怖", "", "", 4, 100, 0, 0, EQUIP.MAGIC, "シロウ", "", ""]
  ,["先輩と後輩の時間/Mentoring Time/せんぱいとこうはいのじかん", , "HP回復/特防[0.7]", "", "", "打撃", "", 4, 400, 0, 0, EQUIP.BLOW|EQUIP.LONGSLASH, "グンゾウ/ワカン・タンカ", "", ""]
  ,["従者並びて/従者並びて/じゅうしゃならびて", , "弱体反射/HP回復", "", "", "", "", 4, 0, 0, EQUIP.FIRE|EQUIP.WOOD, 0, "オニワカ/カーシー", "", ""]
  ,["シューティングスターズ/シューティングスターズ/しゅーてぃんぐすたーず", , "回避に貫通/連撃", "", "", "", "", 4, 300, 0, 0, EQUIP.THRUST|EQUIP.SHOT, "イクトシ/バティム", "", ""]
  ,["幼馴染の流儀/幼馴染の流儀/おさななじみのりゅうぎ", , "", "", "", "", "弱点", 4, 200, 0, EQUIP.AETHER|EQUIP.NETHER, 0, "シロウ/ケンゴ", "", "", 1]
  ,["魔王の温泉郷へようこそ/Welcome to the Dark Lord's Hot Springs/まおうのおんせんきょうへようこそ", , "弱体解除(単)", "", "", "", "崩し", 4, 100, 0, EQUIP.NETHER, 0, "アンドヴァリ/チェルノボーグ", "", ""]
  ,["大江山の鬼たち/大江山の鬼たち/おおえやまのおにたち", , "", "", "", "", "威圧", 4, 400, 0, EQUIP.FIRE|EQUIP.WATER|EQUIP.WOOD, 0, "シュテン/イバラキ", "", "", 1]
  ,["新宿ポリスアカデミー/新宿ポリスアカデミー/しんじゅくぽりすあかでみー", , "CP増加", "", "", "", "スキル封印", 4, 200, 0, EQUIP.WOOD|EQUIP.VALIANT, 0, "タヂカラオ/ホウゲン", "", ""]
  ,["ナンパの心得/ナンパの心得/なんぱのこころえ", , "崩しに特攻[1.4]", "", "HP減少", "", "", 3, 300, 0, EQUIP.WATER, 0, "ゴウリョウ/テュポーン", "", ""]
  ,["山の熊さんたち/山の熊さんたち/やまのくまさんたち", , "根性に特攻[1.4]/係留", "", "", "", "", 3, 150, 0, EQUIP.WOOD, 0, "アシガラ/バーゲスト", "", ""]
  ,["都会の隠れ家/都会の隠れ家/とかいのかくれが", , "加速に特攻[1.4]/加速", "", "", "", "", 3, 75, 0, EQUIP.AETHER, 0, "ガンダルヴァ/サンダーバード", "", ""]
  ,["東京カジノへようこそ/東京カジノへようこそ/とうきょうかじのへようこそ", , "闘志に特攻[1.4]", "", "HP減少", "", "", 3, 225, 0, 0, EQUIP.SHOT|EQUIP.SNIPE, "ハクメン/ショロトル", "", ""]
  ,["次なる聖夜のために/次なる聖夜のために/つぎなるせいやのために", , "特防[0.8]/CP増加", "", "", "魔法", "", 3, 0, 0, EQUIP.AETHER|EQUIP.NETHER, 0, "ジェド/タングリスニル", "", ""]
  ,["或る島での1ページ/A Page from an Island Journal/あるしまでの1ぺーじ", , "特防[0.8]/係留", "", "", "打撃", "", 3, 75, 0, EQUIP.NETHER, 0, "アステリオス/ロビンソン", "", ""]
  ,["夏の新メニュー開発！/夏の新メニュー開発！/なつのしんめにゅーかいはつ！", , "HP回復/祝福に特攻[1.4]", "", "", "", "", 3, 0, 0, EQUIP.FIRE|EQUIP.WOOD, 0, "リョウタ/チョウジ", "", ""]
  ,["休日のカラオケロード！/休日のカラオケロード！/きゅうじつのからおけろーど", , "HP回復/脱力に特攻[1.4]", "", "", "", "", 3, 50, 0, EQUIP.AETHER|EQUIP.NETHER, 0, "ベヒモス/ジズ", "", ""]
  ,["糾える縄の如し/糾える縄の如し/あざなえるなわのごとし", , "CP増加/呪いに特攻[1.4]", "", "", "", "", 3, 225, 0, EQUIP.NETHER, 0, "ケンタ/バーゲスト", "", ""]
  ,["OH, MY POPSTAR！/OH, MY POPSTAR！", , "恐怖に特攻[1.4]/閃き", "", "", "", "", 3, 150, 0, 0, EQUIP.SHOT|EQUIP.SNIPE, "ニャルラトテプ/アザトース", "", ""]
  ,["ある家族の肖像/ある家族の肖像/あるかぞくのしょうぞう", , "CP増加/祝福に特攻[1.4]", "", "", "", "", 3, 150, 0, EQUIP.FIRE, 0, "ハーロット/スルト", "", ""]
  ,["はじめてのオムライス！/はじめてのオムライス！/はじめてのおむらいす！", , "HP回復/呪いに特攻[1.4]", "", "", "", "", 3, 75, 0, EQUIP.WATER, 0, "モリタカ/アギョウ", "", ""]
  ,["鍛錬あるのみ！/鍛錬あるのみ！/たんれんあるのみ！", , "CP増加/頑強に特攻[1.4]", "", "", "", "", 3, 175, 0, EQUIP.FIRE|EQUIP.INFERNAL, 0, "クロガネ/アマツマラ/ヘパイストス", "", ""]
  ,["バディの絆/バディの絆/ばでぃのきずな", , "HP回復/頑強に特攻[1.4]", "", "", "", "", 3, 75, 0, 0, EQUIP.MAGIC, "レイヴ/カーシー", "", ""]
  ,["ようこそ池袋の劇場へ/ようこそ池袋の劇場へ/ようこそいけぶくろのげきじょうへ", , "CP増加/熱情に特攻[1.4]", "", "", "", "", 3, 225, 0, 0, EQUIP.SLASH, "クロード/スノウ", "", ""]
  ,["飢野学園の指導/飢野学園の指導/うえのがくえんのしどう", , "閃きに特攻[1.4]/集中に特攻[1.4]", "", "", "", "", 3, 300, 0, 0, EQUIP.SHOT|EQUIP.SNIPE, "アールプ/レイヴ", "", ""]
  ,["全ては筋肉より始まる/全ては筋肉より始まる/すべてはきんにくよりはじまる", , "剛力に特攻[1.4]", "", "HP減少", "", "", 3, 300, 0, 0, EQUIP.BLOW, "アマツマラ/スルト", "", ""]
  ,["父と子と/父と子と/ちちとこと", , "CP増加/再生に特攻[1.4]", "", "", "", "", 3, 150, 0, 0, EQUIP.SHOT|EQUIP.SNIPE, "アルク/スルト", "", ""]
  ,["出発！真夏の水中冒険/出発！真夏の水中冒険/しゅっぱつ！まなつのすいちゅうぼうけん", , "CP増加/防御強化に特攻[1.4]", "", "", "", "", 3, 225, 0, EQUIP.WATER, 0, "エイタ/テュポーン", "", ""]
  ,["おお山の喜びよ/The Mountain's Bounty/おおやまのよろこびよ", , "CP増加/凍結に特攻[1.4]", "", "", "", "", 3, 250, 0, 0, EQUIP.BLOW, "ザオウ/チェルノボーグ", "", ""]
  ,["どっちの味方なの！？/どっちの味方なの！？/どっちのみかたなの！？", , "CP増加/幻惑に特攻[1.4]", "", "", "", "", 3, 175, 0, 0, EQUIP.MAGIC|EQUIP.LONGSLASH, "リヒト/クニヨシ/ベンテン", "", ""]
  ,["深淵の海より来たりて/From the Depths/しんえんのうみよりきたりて", , "弱体反射", "弱体反射", "", "", "", 5, 250, 0, EQUIP.WATER|EQUIP.INFERNAL, 0, "トリトン/ダゴン", "", "", 2]
  ,["サン・アンド・オイル！/Sun and Oil!/さん・あんど・おいる！", , "聖油に特攻[1.4]", "CP増加", "", "", "", 4, 0, 0, EQUIP.WOOD|EQUIP.WORLD, 0, "クロガネ/タンガロア", "", ""]
  ,["サモナーズのX'MAS/サモナーズのX'MAS/さもなーずのX'MAS", , "HP回復", "", "", "", "", 5, 200, 0, EQUIP.WATER|EQUIP.WOOD|EQUIP.ALLROUND, 0, "リョウタ/トウジ", "", "", 2]
  ,["同じ月が見ている/同じ月が見ている/おなじつきがみている", , "弱体無効/HP回復", "", "", "", "", 4, 0, 0, 0, EQUIP.MAGIC, "マリア/ジブリール", "", ""]
  ,["夕暮れ時の青春は/夕暮れ時の青春は/ゆうぐれどきのせいしゅんは", , "HP回復", "", "", "", "", 4, 200, 0, 0, EQUIP.THRUST|EQUIP.SHOT, "グンゾウ/キュウマ", "", "", 1]
  ,["バレンタイン・ドッグス！/Valentine's Dogs!/ばれんたいん・どっぐす！", , "根性/CP増加", "", "", "", "", 5, 250, 0, EQUIP.FIRE|EQUIP.NETHER, EQUIP.SLASH, "モリタカ/タダトモ", "", ""]
  ,["ショコラは深淵より来たり/Abyssal Confectionery/しょこらはしんえんよりきたり", , "呪いに特攻[1.6]", "", "", "", "魅了", 4, 0, 0, EQUIP.FIRE|EQUIP.NETHER, 0, "シロウ/シトリー", "", ""]
  ,["硬派を気取ったあの頃は/Acting Tough/こうはをきどったあのころは", , "特防[0.7]/CP増加", "", "", "打撃", "", 4, 400, 0, EQUIP.AETHER, EQUIP.BLOW, "ケンゴ/シトリー", "", ""]
  ,["チョコレート・ダイナマイト！/Chocolate Dynamite!/ちょこれーと・だいなまいと！", , "特防[0.8]", "HP回復", "", "横一文字", "", 3, 0, 0, 0, EQUIP.MAGIC|EQUIP.SNIPE, "チョウジ/エビス", "", ""]
  ,["砂漠のプライベート・レッスン？/Private Lesson in the Desert?/さばくのぷらいべーと・れっすん？", , "", "", "魅了", "", "火傷", 5, 100, 0, EQUIP.VALIANT|EQUIP.WATER, 0, "セト/ゴウリョウ", "", ""]
  ,["蒲田ギルドの師弟/A Teacher and Student from Kamata/かまたぎるどのしてい", , "攻撃力微増[AR]", "", "", "", "脱力", 5, 500, 0, EQUIP.FIRE|EQUIP.WOOD, 0, "アマツマラ/クロガネ", "", ""]
  ,["サバイバルリゾート/Survival Resort/さばいばるりぞーと", , "熱情に特攻[1.6]", "", "脱力", "", "", 4, 100, 0, 0, EQUIP.SHOT|EQUIP.SNIPE, "ハヌマン/ツァトグァ", "", ""]
  ,["剣豪と刀鍛冶の攻防/Battle between Swordsmith and Swordsman/けんごうとかたなかじのこうぼう", , "特防[0.8]", "", "強化解除(単)", "斬撃/横一文字", "", 4, 300, 0, EQUIP.ALLROUND|EQUIP.FIRE, EQUIP.SLASH, "ムサシ/アマツマラ", "", ""]
  ,["寂しがりの猛牛たち/Single Bulls Club/さびしがりのもうぎゅうたち", , "CP増加", "", "", "", "", 5, 500, 0, EQUIP.WOOD|EQUIP.NETHER, 0, "ワカン・タンカ/テツギュウ", "", "", 2]
  ,["流れ者の集う街/City of Drifters/ながれもののつどうまち", , "回避/特防[0.7]", "", "", "斬撃/突撃", "", 5, 100, 0, 0, EQUIP.SLASH|EQUIP.THRUST, "スズカ/テツギュウ", "", ""]
  ,["いつかどうして夢の鬼/Ogresses' Dream - A Different Time, A Different Place/いつかどうしてゆめのおに", , "特防[0.7]", "閃き", "", "魔法", "", 4, 100, 0, EQUIP.FIRE|EQUIP.AETHER, 0, "スズカ/イバラキ", "", ""]
  ,["剣の道は尚遙か/The Way of the Sword Has Just Begun/けんのみちはなおはるか", , "スキルが封印される状態に特攻[1.3]", "", "引き寄せ(1マス)", "", "", 4, 300, 0, 0, EQUIP.SLASH|EQUIP.LONGSLASH, "ホウゲン/トウジ", "", ""]
  ,["歓楽の鬼/Ogres' Nightlife/かんらくのおに", , "", "", "魅了", "", "妨害", 4, 0, 0, 0, EQUIP.BLOW|EQUIP.SHOT, "スズカ/イバラキ", "", ""]
  ,["おお温泉の喜びよ/Hot Spring Fun/おおおんせんのよろこびよ", , "温泉", "", "", "", "凍結", 5, 0, 0, 0, EQUIP.SLASH|EQUIP.THRUST, "ザオウ/チェルノボーグ", "", ""]
  ,["法の代行者たち/The Representatives of Principle/ほうのだいこうしゃたち", , "HPが回復する状態に特攻[1.5]", "", "祝福", "", "", 5, 300, 0, EQUIP.FIRE|EQUIP.WOOD|EQUIP.VALIANT, 0, "ザバーニーヤ/アルスラーン", "", ""]
  ,["きょうだい弟子の組手/Sparring Brethren/きょうだいでしのくみて", , "連撃", "", "", "", "", 4, 300, 0, 0, EQUIP.THRUST|EQUIP.BLOW, "イクトシ/カグツチ", "", "", 1]
  ,["ワンダーフォーゲル！/Mountaineering!/わんだーふぉーげる！", , "奮起/根性", "", "", "", "", 4, 200, 0, EQUIP.INFERNAL, EQUIP.MAGIC, "ザオウ/ドゥルガー", "", ""]
  ,["嵐を呼ぶMCバトル！/An Electrifying MC Battle!/あらしをよぶMCばとる！", , "強制移動無効(全)", "", "HP減少", "", "", 5, 250, 0, 0, EQUIP.BLOW|EQUIP.THRUST, "ベンテン/エーギル", "", ""]
  ,["制御できるならやってみろ！/Stop Me if You Can!/せいぎょできるならやってみろ！", , "弱体解除(単)/暴走時防御強化/暴走+時防御強化", "", "", "", "", 4, 300, 0, EQUIP.AETHER|EQUIP.NETHER, 0, "フェンリル/ジャンバヴァン", "", ""]
  ,["打ち上げLIVE！/Celebration Live!/うちあげLIVE！", , "意気", "CP増加", "", "", "", 3, 150, 0, EQUIP.WATER, EQUIP.BLOW|EQUIP.LONGSLASH, "ベンテン/エビス", "", ""]
  ,["奪取Theサマー/Seize the Summer!/だっしゅTheさまー", , "CP増加", "", "CP減少", "", "", 3, 100, 0, EQUIP.WATER, 0, "テュポーン/ベンテン", "", ""]
  ,["成果は現場にあり！/Success Must Be Sought After/せいかはげんじょうにあり！", , "閃き/幻惑に特攻[2.0]", "", "", "", "", 5, 100, 0, EQUIP.WOOD|EQUIP.NETHER, 0, "アリス/ヴォーロス", "", ""]
  ,["ジェノサイド・ハロウィン/Genociders' Halloween/じぇのさいど・はろうぃん", , "クリティカル+", "", "", "", "強化無効", 5, 500, 0, 0, EQUIP.SLASH|EQUIP.LONGSLASH, "ハーロット/スルト", "", ""]
  ,["今月の得真道学園/The Theme of the Month/こんげつのうまみちがくえん", , "魅了時弱化[AR]/根性", "", "", "", "", 4, 400, 0, 0, EQUIP.SLASH|EQUIP.THRUST|EQUIP.MAGIC, "リチョウ/サナト・クマラ", "", ""]
  ,["ウマミチカンフージェネレーション/Umamichi Kung-Fu Generation/うまみちかんふーじぇねれーしょん", , "暴走に特攻[1.6]/暴走+に特攻[1.6]", "係留", "", "", "", 4, 300, 0, EQUIP.FIRE|EQUIP.WOOD, 0, "ハヌマン/ナタ", "", ""]
  ,["コリーダ・デ・トーロス/Corrida de Toros/こりーだ・で・とーろす", , "CP増加", "", "引き寄せ(2マス)", "", "", 5, 250, 0, EQUIP.WOOD|EQUIP.AETHER, 0, "アステリオス/タウラスマスク", "", ""]
  ,["上質の一杯/To Successful Ventures/じょうしつのいっぱい", , "滋養/滋養時強化[AR]", "滋養時強化[AR]", "", "", "", 5, 200, 0, 0, EQUIP.BLOW|EQUIP.SLASH|EQUIP.LONGSLASH, "スノウ/ギュウマオウ", "", ""]
  ,["浅草ダウンタウンボーイズ/Asakusa Downtown Boys/あさくさだうんたうんぼーいず", , "根性時強化[浅草AR]", "", "", "", "猛毒", 4, 200, 0, 0, EQUIP.THRUST|EQUIP.BLOW, "テツギュウ/ハヌマン", "", ""]
  ,["昼休みの購買部闘争！/School Lunchtime Battle!/ひるやすみのこうばいぶとうそう！", , "全方向移動力増加/加速", "", "", "", "", 4, 400, 0, 0, EQUIP.BLOW, "ナタ/テツギュウ", "", ""]
  ,["鬼も、福も/Ogres and Fortune/おにも、ふくも", , "鬼道の衆に特攻[2.0]", "CP増加", "", "", "", 5, 100, 0, EQUIP.FIRE|EQUIP.INFERNAL, 0, "タケマル/モトスミ", "", ""]
  ,["禅の心/Spirit of Zen/ぜんのこころ", , "集中", "", "", "", "CS封印", 5, 0, 0, EQUIP.VALIANT, EQUIP.THRUST, "オニワカ/シュテン", "", ""]
  ,["浅草の愚連隊/Asakusa Gang/あさくさのぐれんたい", , "剛力時強化", "", "", "", "呪い", 4, 200, 0, 0, EQUIP.THRUST|EQUIP.MAGIC, "モトスミ/リチョウ", "", ""]
  ,["フィスト・ファイト！/Fist Fight!/ふぃすと・ふぁいと！", , "威圧に特攻[1.4]", "", "威圧", "", "", 4, 400, 0, 0, EQUIP.BLOW, "オニワカ/イバラキ", "", ""]
  ,["父の思い出/Like Father, Like Son/ちちのおもいで", , "火傷に特攻[2.0]", "クリティカル", "", "", "", 5, 100, 0, 0, EQUIP.SLASH|EQUIP.MAGIC|EQUIP.LONGSLASH, "マルコシアス/タダトモ", "", ""]
  ,["バレンタイン・ライブ！/Live on Valentine's Day!/ばれんたいん・らいぶ！", , "CP増加", "CP増加", "", "", "", 5, 200, 0, EQUIP.WATER|EQUIP.AETHER, 0, "ジブリール/マーナガルム", "", "", 2]
  ,["愛の牢獄/Prison of Love/あいのろうごく", , "", "", "係留/束縛", "", "", 4, 200, 0, EQUIP.FIRE|EQUIP.WOOD|EQUIP.AETHER, 0, "ショロトル/ハクメン", "", ""]
  ,["鉄血のバージンロード/Blushing Beloved of Blood and Steel/てっけつのばーじんろーど", , "", "HP回復/CP増加", "", "", "", 4, 300, 0, 0, EQUIP.MAGIC, "クロード/スノウ", "", ""]
  ,["再生のキャンバス/Can't Spell Heart Without Art/さいせいのきゃんばす", , "", "CP増加/HP回復", "", "", "", 3, 0, 0, 0, EQUIP.SHOT|EQUIP.SNIPE|EQUIP.NONE, "リヒト/イツァムナー", "", ""]
  ,["神宿学園の食いしん坊番長/Shinjuku Academy's Chancellors of Chow/しんじゅくがくえんのくいしんぼうばんちょう", , "滋養に特攻[1.4]/HP回復", "", "", "", "", 3, 150, 0, EQUIP.WOOD|EQUIP.NETHER, 0, "ベヒモス/リョウタ", "", ""]
  ,["黄金の実り/Golden Harvest/おうごんのみのり", , "連撃", "HP回復", "", "", "", 5, 300, 0, 0, EQUIP.THRUST, "ヴォーロス/ゴエモン", "", ""]
  ,["お宝にはご用心/Eyes on the Prize/おたからにはごようじん", , "CP増加", "", "", "", "", 5, 200, 0, 0, EQUIP.MAGIC|EQUIP.NONE, "アンドヴァリ/コタロウ", "", "", 2]
  ,["アタックオブザウォーターメロン/Attack of the Killer Watermelons/あたっくおぶざうぉーたーめろん", , "", "", "HP減少", "", "", 4, 400, 0, EQUIP.FIRE|EQUIP.WOOD, 0, "チョウジ/ヴォーロス", "", ""]
  ,["Surf the wave/Surfing the Wave", , "妨害に特攻[1.6]", "", "引き寄せ(1マス)", "", "", 4, 200, 0, 0, EQUIP.BLOW, "セト/ゴエモン", "", ""]
  ,["青春は君をおって/In the Flower of Youth/せいしゅんはきみをおって", , "", "奮起", "", "", "", 5, 300, 0, EQUIP.FIRE|EQUIP.INFERNAL, 0, "ドゥルガー/グンゾウ", "", "", 2]
  ,["おいでよぼくらのもふもふ王国/Welcome to the Furry Kingdom!/おいでよぼくらのもふもふおうこく", , "", "", "引き寄せ(1マス)/魅了", "", "", 5, 200, 0, 0, EQUIP.THRUST|EQUIP.MAGIC, "クニヨシ/カーシー", "", ""]
  ,["出会いは決定的に/Treasure Every Meeting/であいはけっていてきに", , "怒時強化", "", "", "", "", 4, 400, 0, EQUIP.WATER|EQUIP.WOOD|EQUIP.NETHER, 0, "クニヨシ/ベンテン", "", "", 1]
  ,["寂しがりのプランクスター/The Lonely Prankster/さびしがりのぷらんくすたー", , "CP増加/注目", "", "", "", "", 3, 100, 0, 0, EQUIP.BLOW, "アールプ/カーシー", "", ""]
  ,["夢のもふもふ大激突！/The Great Fluffy Clash of Dreams!/ゆめのもふもふだいげきとつ！", , "獣の末裔に特攻[1.5]/獣皮を巻く者に特攻[1.5]/HP回復", "", "", "", "", 3, 300, 0, EQUIP.WOOD|EQUIP.NETHER, 0, "クニヨシ/アールプ", "", ""]
  ,["芸術は光と陰に/All in Art is Light and Dark/げいじゅつはひかりとかげに", , "", "CP増加", "CP減少", "", "", 3, 150, 0, EQUIP.AETHER|EQUIP.NETHER, 0, "クニヨシ/リヒト", "", ""]
  ,["夏の島の夜の踊り/Nocturnal Dance/なつのしまのよるのおどり", , "意気/HP回復", "意気/HP回復", "", "", "", 5, 250, 0, EQUIP.WORLD|EQUIP.ALLROUND, 0, "タンガロア/キジムナー", "", ""]
  ,["夢に見た力比べ/The Strength I dream of/ゆめにみたちからくらべ", , "", "", "威圧", "", "", 5, 350, 0, 0, EQUIP.SLASH|EQUIP.NONE, "アステリオス/アスタロト", "", "", 2]
  ,["巨いなる供物/A Great Offering/おおいなるくもつ", , "HP回復", "", "HP減少", "", "", 4, 100, 0, EQUIP.WOOD|EQUIP.INFERNAL|EQUIP.WORLD, 0, "タンガロア/ダゴン", "", ""]
  ,["お手柄！うみのこ探検隊/Accomplished Ocean Explorers/おてがら！うみのこたんけんたい", , "特防[0.8]/加速時強化[AR]", "", "", "射撃", "", 3, 150, 0, 0, EQUIP.THRUST|EQUIP.MAGIC, "キジムナー/エイタ", "", ""]
  ,["宿命のグラップル！/Grapple With Destiny!/しゅくめいのぐらっぷる！", , "回避に貫通/防御力が上昇する状態に貫通", "", "崩し", "", "", 5, 500, 0, 0, EQUIP.THRUST|EQUIP.BLOW, "アルスラーン/アヴァルガ", "", ""]
  ,["研究棟の夜は終わらず/Endless Night of Research/けんきゅうとうのよるはおわらず", , "根性/HP減少", "", "", "", "", 5, 100, 0, EQUIP.WOOD|EQUIP.AETHER, 0, "レイヴ/ジャンバヴァン", "", ""]
  ,["餅つきと喧嘩はひとりで出来ぬ/Can't Fight or Make Rice Cakes Alone/もちつきとけんかはひとりでできぬ", , "HP回復", "", "HP減少", "", "", 4, 300, 0, EQUIP.FIRE|EQUIP.AETHER, 0, "ケンゴ/オニワカ", "", ""]
  ,["ゲヘナの腸/The Bowels of Gehenna/げへなのはらわた", , "HPが減少する弱体に特攻[1.2]", "", "猛毒", "", "", 4, 200, 0, EQUIP.NETHER|EQUIP.INFERNAL, 0, "ルキフゲ/バエル", "", ""]
  ,["そこにお世話のある限り！/As Long As Someone's There to Help!/そこにおせわのあるかぎり！", , "", "HP回復/CP増加", "", "", "", 3, 0, 0, EQUIP.WATER|EQUIP.VALIANT|EQUIP.ALLROUND, 0, "ホロケウカムイ/トムテ", "", ""]
  ,["星よ！太陽よ！/O Stars! O Sun!/ほしよ！たいようよ！", , "注目に特攻[1.4]/注目", "", "", "", "", 3, 300, 0, EQUIP.WORLD, EQUIP.THRUST|EQUIP.SHOT, "テスカトリポカ/オンブレティグレ", "", ""]
  ,["苦楽は汗と共に/Sweating Together, Through Good and Bad/くらくはあせとともに", , "弱体解除(単)/HP回復", "", "", "", "", 5, 400, 0, 0, EQUIP.SLASH|EQUIP.LONGSLASH, "モリタカ/オルグス", "", ""]
  ,["最高のパフォーマンスを/The Ultimate Performance/さいこうのぱふぉーまんすを", , "特防[0.6]", "根性", "", "全域", "", 5, 0, 0, EQUIP.WOOD, 0, "リョウタ/ソール", "", ""]
  ,["ある日の一幕/Snapshot of That Day/あるひのいちまく", , "特防[0.8]", "", "強化解除(単)", "打撃/射撃", "", 4, 200, 0, 0, EQUIP.BLOW|EQUIP.SHOT|EQUIP.MAGIC, "ケンゴ/勇者", "", ""]
  ,["夏の海にはこれ一本！/This One's for the Summer Seas!/なつのうみにはこれいっぽん！", , "HP回復/火傷耐性", "HP回復/火傷耐性", "", "", "火傷", 4, 0, 0, EQUIP.NETHER|EQUIP.INFERNAL, 0, "アンドヴァリ/スルト", "", ""]
  ,["バーサーカーズのクリスマス！/バーサーカーズのクリスマス！/ばーさーかーずのくりすます！", , "クリティカル+/祝福に特攻[2.0]", "", "", "", "", 5, 400, 0, 0, EQUIP.THRUST|EQUIP.BLOW|EQUIP.SHOT, "バティム/ポルックス", "", ""]
  ,["サウナの作法！？/サウナの作法！？/さうなのさほう！？", , "HP回復/弱体解除(単)", "弱体解除(単)", "", "", "", 5, 200, 0, 0, EQUIP.BLOW|EQUIP.NONE, "フェンリル/シトリー", "", ""]
  ,["池袋クリスマス・場外乱闘！/池袋クリスマス・場外乱闘！/いけぶくろくりすます・じょうがいらんとう！", , "", "", "HP減少", "", "", 4, 400, 0, EQUIP.WATER, EQUIP.SLASH|EQUIP.SNIPE, "スノウ/メリュジーヌ", "", ""]
  ,["親父さん見てる！？/親父さん見てる！？/おやじさんみてる！？", , "", "激怒+/CP増加", "", "", "", 4, 0, 0, EQUIP.FIRE|EQUIP.NETHER, 0, "バティム/シトリー", "", ""]
  ,["骨董市の品定め/Shopping at the Antique Market/こっとういちのしなさだめ", , "", "CS封印/次ターン強化/攻撃力増加[次ターン]", "", "", "", 5, 0, 0, EQUIP.WOOD|EQUIP.NETHER, 0, "フルフミ/リヒト", "", ""]
  ,["金魚すくいレクチャー！/A Lesson in Goldfish Scooping/きんぎょすくいれくちゃー！", , "攻撃力増加[ターン毎減少]", "", "", "", "", 5, 300, 0, EQUIP.WATER, 0, "リョウタ/リチョウ/ケットシー", "", "", 2]
  ,["祭りの日の出会い/An Encounter at the Festival/まつりのひのであい", , "閃き", "CP増加", "", "", "", 4, 100, 0, EQUIP.FIRE|EQUIP.WOOD|EQUIP.AETHER, 0, "リチョウ/フルフミ", "", ""]
  ,["同盟者からのサプライズ/A Surprise from a Comrade/どうめいしゃからのさぷらいず", , "暗闇に特攻[1.6]/スキル発動率大増", "", "", "", "", 4, 200, 0, EQUIP.INFERNAL|EQUIP.VALIANT|EQUIP.WORLD, 0, "テスカトリポカ/バロール", "", ""]
  ,["悪魔式ティータイム/A Devilish Teatime/あくましきてぃーたいむ", , "毒/再生", "毒/再生", "毒/再生", "", "", 5, 200, 0, EQUIP.AETHER|EQUIP.NETHER|EQUIP.INFERNAL, 0, "アスタロト/バエル", "", ""]
  ,["がんばれ貧乏探偵！/がんばれ貧乏探偵！/がんばれびんぼうたんてい！", , "スキル発動率増加", "回避", "", "", "", 5, 300, 0, EQUIP.FIRE|EQUIP.AETHER, 0, "ジブリール/ノーマッド", "", ""]
  ,["ファンクラブの友たち/ファンクラブの友たち/ふぁんくらぶのともたち", , "", "CP増加/意気", "", "", "", 4, 400, 0, 0, EQUIP.SLASH|EQUIP.BLOW|EQUIP.LONGSLASH, "カルキ/マーナガルム", "", ""]
  ,["六本木のフィクサーたち/六本木のフィクサーたち/ろっぽんぎのふぃくさーたち", , "移動不能になる状態に特攻[1.3]", "", "", "", "不動", 4, 200, 0, 0, EQUIP.SLASH|EQUIP.SHOT, "ハクメン/ツァトグァ", "", ""]
  ,["汝、何処へ行き給う/Where are you going?/なんじ、いずこへいきたまう", , "弱体解除(単)/HP回復", "", "", "", "", 5, 100, 0, EQUIP.AETHER|EQUIP.NETHER, 0, "マリア/アザゼル", "", ""]
  ,["雪解けの甘くとろけたる/A Melting Snow-like Delight/ゆきどけのあまくとろけたる", , "被回復増加", "被回復増加/HP回復", "", "", "", 5, 250, 0, EQUIP.VALIANT|EQUIP.ALLROUND, 0, "ホロケウカムイ/キムンカムイ", "", ""]
  ,["聖者の休息/A Break for a Saint/せいじゃのきゅうそく", , "", "HP回復", "武器種変更：無", "", "", 4, 300, 0, 0, EQUIP.MAGIC|EQUIP.THRUST, "ソール/キムンカムイ", "", ""]
  ,["我が盟友の為ならば/For My Sworn Friend/わがめいゆうのためならば", , "熱情に特攻[1.6]", "CP増加", "", "", "", 4, 150, 0, 0, EQUIP.SLASH|EQUIP.SHOT, "アイゼン/カルキ", "", ""]
  ,["衣装の心得/Tips on Clothing/いしょうのこころえ", , "魅了耐性/魅了に特攻[2.0]", "", "", "", "魅了", 5, 300, 0, 0, EQUIP.BLOW|EQUIP.SHOT|EQUIP.NONE, "アラクネ/カトブレパス", "", ""]
  ,["ようこそ、夜の宝石たち/Welcome, Gems of the Night/ようこそ、よるのほうせきたち", , "", "", "引き寄せ(1マス)", "", "", 4, 200, 0, EQUIP.AETHER|EQUIP.INFERNAL, 0, "ツクヨミ/スズカ", "", "", 1]
  ,["腹の底から高らかに/Hearty Singing/はらのそこからたからかに", , "回避に貫通/HP回復", "HP回復", "", "", "", 4, 300, 0, 0, EQUIP.BLOW|EQUIP.SLASH|EQUIP.LONGSLASH, "アラクネ/スズカ", "", ""]
  ,["サマータイム・シャワー/Summertime Shower/さまーたいむ・しゃわー", , "注目/熱情に特攻[1.4]", "", "", "", "", 3, 0, 0, 0, EQUIP.BLOW|EQUIP.THRUST, "ワカン・タンカ/ザバーニーヤ", "", ""]
]);
