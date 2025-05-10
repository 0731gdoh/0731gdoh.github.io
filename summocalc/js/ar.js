"use strict";

function Record(index, id, x){
  var flag = 0;
  var skills = x[2].map(function(s){
    return splitSkills(s);
  });
  skills.push(skills[0], skills[0], skills[0]);
  this.index = index;
  this.id = id;
  this.name = x[0];
  this.effects = generateEffectData(skills[0], 0).concat(generateEffectData(skills[2], 1));
  this.tag = skills.map(function(s, i){
    return generateTagData(s, i, true);
  });
  this.limited = x[1];
  this.arRarity = x[3];
  this.value = new Fraction(x[4]);
  this.hp = x[3] * 100 - x[4];
  this.rarity = x[5];
  this.attribute = x[6];
  this.weapon = x[7];
  this.chara = splitCharaNames(x[8]);
  this.guilds = splitGuildNames(x[9]);
  this.schools = splitSchoolNames(x[10]);
  this.thumbnails = splitThumbnailNames(x[8], x[11]);
  this.csBoost = x[12] || 0;
  this.csWeapon = x[13] || 0;
  [this.chara.length, this.guilds, this.schools, this.rarity && this.rarity !== EQUIP.ANY, this.attribute, this.weapon, this.rarity === EQUIP.ANY].forEach(function(v, i){
    if(v) flag |= 1 << i;
  });
  this.limitationType = flag;
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
    if(this.guilds) e = e.concat(bit2array(GUILD, this.guilds, lang));
    if(this.schools) e = e.concat(bit2array(SCHOOL, this.schools, lang));
    if(this.rarity && this.rarity !== EQUIP.ANY){
      var bit = this.rarity;
      var n = 0;
      var m = 0;
      while(!(bit & 1)){
        bit >>= 1;
        n++;
      }
      m = n - 1;
      while(bit & 1){
        bit >>= 1;
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
  getInfo: function(hideTiming){
    var r = [
      RARITY[this.arRarity] + " " + this,
      "[HP+" + this.hp + " / ATK+" + (this.value - 0) + "]",
      "■ " + this.getLimitation().join(" OR ")
    ];
    var s = [
      ["自身に/", "/ to Self"],
      ["味方に/", "/ to Ally"],
      ["敵に/", "/ to Enemy"],
      ["/A.Advantage to ", "に特攻/"],
      ["/D.Advantage from ", "に特防/"],
      ["/Nullify ", "無効/"]
    ];
    if(this.csBoost) r.push(CS_PLUS[this.csBoost] + t("(+/ (+") + this.csBoost + ")");
    this.tag.forEach(function(x, i){
      var ex = [];
      var c = [];
      var tags = x.map(function(d){
        var tag = TAG[d[0] % TAG_MAX];
        if(!d[1]) return 0;
        if(i > 2){
          if(tag.subset.length) ex = ex.concat(tag.subset);
          if(tag.variant.length) ex = ex.concat(tag.variant);
        }else if(tag.category.length){
          ex = ex.concat(tag.category.slice(1));
          if(!tag.reading || tag.reading.indexOf(" ") !== -1) return 0;
          ex.push(tag.category[0]);
        }
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
        if(hideTiming) return tag;
        return timing2str(d[1]) + t(s[i][0]) + tag + t(s[i][1]);
      }).filter(function(x){return x});
      if(c.length) r.push(c.join("/"));
      if(tags.length){
        if(hideTiming){
          r.push(t(s[i][0]) + tags.join("/") + t(s[i][1]));
        }else{
          r.push(tags.join("/"));
        }
      }
      if(i === 2) hideTiming = true;
    });
    return r.join("\n");
  },
  getThumbnail: function(lang){
    return this.thumbnails.map(function(n){
      return t(THUMBNAIL[n].name, lang);
    });
  }
};
Record.createList = function(a){
  var ids = [];
  var order = [];
  var result = a.map(function(v, i){
    var id = v.shift();
    if(ids.indexOf(id) !== -1) throw new Error("AR IDが重複しています（" + id + "）");
    ids.push(id);
    if(id === 101 || id === 1001) order.push(0);
    order.push(i);
    return new Record(i, id, v);
  });
  result.ORDER = order;
  result.LABELS = ["クエスト報酬/Quest Reward", "ショップ・イベント/Shop%%Event", "AR召喚/AR Summons"];
  return result;
};
Record.csv = function(list, x){
  return list.map(function(v){
    if(!v.name){
      return t("#,レア度,名前,HP,ATK,ダメージ補正,効果(自身),効果(味方),効果(敵),特攻,特防,状態無効,CS倍率,CSタイプ,装備制限,サムネイル/#,Rarity,Name,HP,ATK,DamageModifier,Effects(Self),Effects(Ally),Effects(Enemy),AttackBonus,DefenseBonus,NullifyStatus,CSRate,CSType,Limitation,Thumbnail", x);
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
          return timing2str(a[1], x) + t(tag.name, x);
        }).filter(function(n){return n}).join("/"));
      });
      r.push(["", "(+1)", "(+2)"][v.csBoost], t(WEAPON[v.csWeapon].name, x), e.join("|"), v.getThumbnail(x).join("|"));
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
  NULL: 1 << 11,
  DIVINE: 1 << 12
};

function Thumbnail(index, name){
  this.index = index;
  this.name = name;
  this.value = 0;
}
Thumbnail.prototype = {
  toString: function(){
    var name = t(this.name) || "－";
    if(name[0] === "(") name = t(this.name, 0) + name;
    return name;
  },
  getValue: function(){
    return this.value;
  },
  count: function(){
    ++this.value;
    return this.index;
  }
};
Thumbnail.createList = function(m, a){
  var result = [];
  var n = 0;
  var table = new Map();
  var ex = new Map();
  var set = function(x){
    var tn = new Thumbnail(n++, x);
    result.push(tn);
    table.set(t(x, 0), tn);
  };
  m.forEach(function(v){
    ex.set(v[0], v[1]);
  });
  set("");
  CARD.table.forEach(function(v, k){
    var x = CARD[v[0]].name;
    if(x.indexOf("&") !== -1) x = x.split("/").map(function(s){
      return s.split("&")[0] + (s[0] === "(" ? ")" : "");
    }).join("/");
    set(x);
    if(ex.has(k)) set(ex.get(k));
  });
  a.forEach(function(x){
    set(x);
  });
  result.table = table;
  return result;
};
var THUMBNAIL = Thumbnail.createList(
  [["アスタロト", "アスタルテ/Astarte"]
  ,["ダイコク", "オオナムチ/Onamuchi"]
  ,["ネクロス&バッカス", "バッカス/Bacchus"]
],
  ["サロモンくん/Lil' Salomon/サロモンクン/アルス・アルマデル・サロモニス/Ars Almadel Salomonis"
  ,"ヨグソトース/Yog-Sothoth"
  ,"トール/Thor"
  ,"フィッシャーキング/Fisher King"
  ,"ユキムラ/Yukimura"
  ,"黒き暴風/The Black Storm/クロキボウフウ/リバイアサン/Leviathan"
]);

var AR = Record.createList(
  //id, 名前, 限定, スキル, レア度, ATK基本値, レア度指定, 属性指定, 武器タイプ指定, キャラ指定, ギルド指定, 学園指定, サムネイル[, CS倍率補正[, CSタイプ変更]]
  [[0, "", false, ["", "", ""], 0, 0, 0, 0, 0, "", "", "", ""]
  ,[1, "見習い使い魔の応援/Support of Apprentice Familiar/みならいつかいまのおうえん", false, ["jCP増加", "", ""], 1, 50, 0, EQUIP.ALLROUND, 0, "", "", "", "@サロモンくん"]
  ,[2, "深淵の門番の破片/Shard of the Abyssal Gatekeeper/しんえんのもんばんのはへん", false, ["恐怖x", "", ""], 2, 75, 0, EQUIP.NETHER, 0, "", "", "", "@ヨグソトース"]
  ,[3, "遠雷の闘士の破片/Shard of the Thunder Warrior/えんらいのとうしのはへん", false, ["マヒx", "", ""], 2, 200, 0, EQUIP.AETHER, 0, "", "", "", "@トール"]
  ,[4, "長途の待人の破片/Fragment of He Who Waits/ちょうとのまちびとのはへん", false, ["告死x", "", ""], 2, 0, 0, EQUIP.WOOD, 0, "", "", "", "@フィッシャーキング"]
  ,[5, "重来の武将の破片/Fragment of the Returning Warlord/ちょうらいのぶしょうのはへん", false, ["憑依x", "", ""], 2, 125, 0, EQUIP.WATER, 0, "", "", "", "@ユキムラ"]
  ,[101, "今、ここだけにしかない物語/Written in the Here and Now/いま、ここだけにしかないものがたり", false, ["pHP回復/獲得ランク経験値アップ", "", ""], 4, 300, EQUIP.ANY, 0, 0, "", "", "", "@サロモンくん"]
  ,[107, "お宝目指して何処までも/Any Length for Treasure/おたからめざしてどこまでも", false, ["獲得コインアップ", "", "ud呪い"], 4, 200, EQUIP.ANY, 0, 0, "", "", "", "@アンドヴァリ"]
  ,[108, "教えの庭にも/Over the Fields of Study/おしえのにわにも", false, ["獲得経験値アップ/獲得ランク経験値アップ", "", ""], 4, 200, EQUIP.ANY, 0, 0, "", "", "", "@ミネアキ"]
  ,[119, "放課後の工房/Afterschool Workshop/ほうかごのこうぼう", false, ["種獲得率アップ", "", "a根性解除/a根性耐性"], 4, 300, EQUIP.ANY, 0, 0, "", "", "", "@アマツマラ"]
  ,[134, "仕事終わりのひとときを/A Special Moment After Work/しごとおわりのひとときを", false, ["獲得コインアップ/j友情時強化", "", ""], 4, 100, EQUIP.ANY, 0, 0, "", "", "", "@クルースニク"]
  ,[144, "ラストプレイヤー・オンステージ/Last Performer - On Stage!/らすとぷれいやー・おんすてーじ", false, ["ARトークン獲得率アップ/j弱体時強化[AR]", "", ""], 4, 200, EQUIP.ANY, 0, 0, "", "", "", "@イフリート"]
  ,[153, "路地裏の事件簿/Back Alley Case Files/ろじうらのじけんぼ", false, ["花獲得率アップ", "em守護", ""], 4, 250, EQUIP.ANY, 0, 0, "", "", "", "@キョウマ"]
  ,[102, "拮抗の例外処理？/Exception of Antagonism?/きっこうのれいがいしょり？", true, ["強制移動無効(後)", "", "aHP減少"], 2, 150, 0, EQUIP.WATER, 0, "", "", "", "@黒き暴風"]
  ,[103, "魔王と魔王/Dark Lords/まおうとまおう", true, ["毒x/猛毒x", "", ""], 3, 150, EQUIP.ANY, 0, 0, "", "", "", "@タローマティ"]
  ,[104, "仰げば尊し/Revere Thy Teachers/あおげばとうとし", false, ["獲得経験値集約/獲得経験値アップ", "", ""], 4, 100, EQUIP.ANY, 0, 0, "", "", "", "@ジン"]
  ,[105, "聖夜のダブル・ヒーロー！/Christmas Eve's Heroic Duo!/せいやのだぶる・ひーろー！", true, ["j根性/打撃に特防[0.8]", "", ""], 3, 150, 0, 0, EQUIP.SLASH|EQUIP.THRUST|EQUIP.BLOW, "@タウラスマスク/クランプス", "", "", ""]
  ,[106, "ギュウマオウ式OJT！/OJT: The Gyumao Way/ぎゅうまおうしきOJT！", true, ["突撃に特防[0.8]", "pm弱体解除(単)", ""], 3, 0, 0, 0, EQUIP.LONGSLASH|EQUIP.MAGIC, "@ギュウマオウ/セト", "", "", ""]
  ,[109, "友情のコンビネーション！/Made Along the Way/ゆうじょうのこんびねーしょん！", false, ["獲得戦友ポイントアップ/j友情時強化", "", ""], 4, 200, EQUIP.ANY, 0, 0, "", "", "", "@グンゾウ"]
  ,[110, "はぐれ者の幕間/The Sweating of the Strays/はぐれもののまくま", true, ["劫火x/t弱体解除(単)", "", ""], 3, 0, 0, EQUIP.FIRE|EQUIP.WATER|EQUIP.AETHER, 0, "トムテ/@テツヤ", "", "", ""]
  ,[111, "初湯のひととき/First Soak of the Year/はつゆのひととき", true, ["ma&dHP回復", "", ""], 4, 0, 0, 0, EQUIP.THRUST|EQUIP.LONGSLASH|EQUIP.NONE, "ギュウマオウ/@シンノウ", "", "", ""]
  ,[112, "曙光に燃える/In the Fires of Daybreak/しょこうにもえる", true, ["", "pm弱体解除(単)", ""], 4, 400, 0, EQUIP.FIRE|EQUIP.WOOD|EQUIP.WORLD, 0, "タウラスマスク/@ワカン・タンカ", "", "", "", 1]
  ,[113, "しゃかりき稼ぐぜ海の家/Money-Making Beach House/しゃかりきかせぐぜうみのいえ", true, ["j&t奮起", "pmHP回復", ""], 3, 200, 0, EQUIP.FIRE|EQUIP.WATER, 0, "ノーマッド/@タダトモ", "", "", ""]
  ,[114, "我ら今は共に歩みて/A Temporary Alliance/われらいまはともにあゆみて", true, ["獲得ランク経験値アップ/獲得戦友ポイントアップ", "p奮起", ""], 5, 250, EQUIP.RARE1|EQUIP.RARE2, 0, 0, "", "バーサーカーズ/ミッショネルズ/タイクーンズ", "", "@クロード"]
  ,[115, "東方の賢者たち/Wisemen of the East/とうほうのけんじゃたち", true, ["獲得コインアップ", "", "p弱点"], 5, 250, EQUIP.RARE1|EQUIP.RARE2, EQUIP.WORLD, 0, "", "ワイズメン", "", "@デュオ"]
  ,[116, "冒険に祝杯を/Cheers to Adventure/ぼうけんにしゅくはいを", true, ["魔王と名の付くスキルに特攻[1.4]/j弱体無効", "", ""], 3, 150, 0, 0, EQUIP.MAGIC|EQUIP.SNIPE, "ネクロス&バッカス/ソール/オルグス", "", "", "@バッカス"]
  ,[117, "ようこそ地獄の温泉郷/Welcome to Hell's Hot Spring Town/ようこそじごくのおんせんきょう", true, ["j凍結耐性/ma弱体解除(単)", "j凍結耐性", ""], 3, 0, 0, 0, EQUIP.SLASH|EQUIP.BLOW|EQUIP.MAGIC, "ダイコク/@サルタヒコ", "", "", ""]
  ,[118, "スウィート・ドリームス/Sweet Dreams/すうぃーと・どりーむす", true, ["獲得経験値アップ", "p閃き", ""], 5, 200, 0, 0, EQUIP.MAGIC|EQUIP.SNIPE, "", "ビーストテイマーズ", "", "@カーシー"]
  ,[120, "レッツ・クラフト！/It's Crafting Time!/れっつ・くらふと！", false, ["ARトークン獲得率アップ", "p攻撃力低下耐性", ""], 4, 200, EQUIP.ANY, 0, 0, "", "", "", "@クロガネ"]
  ,[121, "隣を駆ける者ども/Running Neck and Neck/となりをかけるものども", true, ["", "pm崩し耐性/pmCP増加", ""], 3, 150, 0, EQUIP.AETHER|EQUIP.VALIANT, 0, "タングリスニル/@グリンブルスティ", "", "", ""]
  ,[122, "虎たちの乾杯/Toasting Tigers/とらたちのかんぱい", true, ["pmCP増加/pm威圧特攻[AR]", "pm威圧特攻[AR]", ""], 4, 200, 0, 0, EQUIP.THRUST|EQUIP.MAGIC, "@ノーマッド/ドゥルガー/リチョウ", "", "", ""]
  ,[123, "クイーン・オブ・カブキチョウ/The Queen of Kabukicho/くいーん・おぶ・かぶきちょう", true, ["種獲得率アップ", "", "p魅了"], 5, 100, 0, EQUIP.NETHER|EQUIP.INFERNAL, 0, "", "アウトローズ", "", "@エリイ"]
  ,[124, "猫たちの憩いの場/A Place Where the Cats Can Dream/ねこたちのいこいのば", true, ["nmHP回復/nmCP増加", "", ""], 3, 0, 0, 0, EQUIP.SLASH|EQUIP.MAGIC|EQUIP.NONE, "テスカトリポカ/@ケットシー", "", "", ""]
  ,[125, "バレンタインアドベンチャー/Valentine's Expedition/ばれんたいんあどべんちゃー", true, ["疑念x/tHP回復", "", ""], 3, 200, 0, EQUIP.FIRE|EQUIP.WATER|EQUIP.WOOD, 0, "@キュウマ/アキハゴンゲン", "", "", ""]
  ,[126, "その日は、桜の山で/Viewing the Mountain Cherry Blossoms/そのひは、さくらのやまで", true, ["j根性時強化[桜の山AR]/nmCP増加", "nmCP増加", ""], 4, 100, 0, EQUIP.WOOD|EQUIP.AETHER, 0, "@ザオウ/シュテン", "", "", ""]
  ,[127, "クラフターズの日課/The Crafter Daily Workout/くらふたーずのにっか", true, ["ARトークン獲得率アップ/tCP増加", "", ""], 5, 500, 0, 0, EQUIP.THRUST|EQUIP.SHOT, "", "クラフターズ", "", "@トヴァシュトリ"]
  ,[128, "アチアチ・ホットキャンプ！/Piping-Hot Camp!/あちあち・ほっときゃんぷ！", true, ["p浄化/t弱体解除(単)/滋養に特攻[1.3]", "", ""], 3, 100, 0, EQUIP.FIRE|EQUIP.WOOD, 0, "カグツチ/シロウ/@アイゼン", "", "", ""]
  ,[129, "N番目の祝宴/The Nth Celebration/Nばんめのしゅくえん", true, ["狙撃に特防[0.8]/j祝福", "", ""], 3, 0, 0, 0, EQUIP.LONGSLASH|EQUIP.THRUST|EQUIP.SLASH, "@ヤスヨリ/オンブレティグレ", "", "", ""]
  ,[130, "母と子と/Mother and Child/ははとこと", true, ["花獲得率アップ", "udHP回復", ""], 5, 100, 0, EQUIP.FIRE|EQUIP.NETHER, 0, "", "ジェノサイダーズ", "", "@アルク/@ハーロット"]
  ,[131, "夏の日の一枚/A Summer Photo/なつのひのいちまい", true, ["魅了x/t意気", "", ""], 3, 150, 0, EQUIP.ALLROUND|EQUIP.WATER|EQUIP.INFERNAL, 0, "@ベイブ・バニヤン/シュクユウ", "", "", ""]
  ,[132, "ある安らぎの日/A Peaceful Day/あるやすらぎのひ", true, ["獲得コインアップ/獲得ランク経験値アップ", "", ""], 5, 400, EQUIP.RARE1|EQUIP.RARE2, EQUIP.FIRE|EQUIP.WATER, 0, "", "タイクーンズ", "", "@リヒト"]
  ,[133, "シークレット・エージェンツ/Secret Agents/しーくれっと・えーじぇんつ", true, ["崩しx", "", "pm恐怖"], 3, 300, 0, 0, EQUIP.SHOT|EQUIP.SLASH|EQUIP.MAGIC, "", "エージェンツ", "", "@オセ"]
  ,[135, "ひとりだけのあなたへ/For You and Only You", false, ["花獲得率アップ", "pd弱体解除(単)", ""], 4, 200, EQUIP.ANY, 0, 0, "", "", "", "@アルク"]
  ,[136, "光輝成す刃たち/Radiant Blades/こうきなすやいばたち", true, ["p極限/ARトークン獲得率アップ", "", ""], 5, 500, 0, EQUIP.ALLROUND, EQUIP.SLASH, "", "サモナーズ", "", "@トウジ"]
  ,[137, "寒空の下、君を待って/Under the Wintry Sky, Waiting For You/さむぞらのした、きみをまって", true, ["凍結x", "t祝福", ""], 3, 100, 0, 0, EQUIP.MAGIC|EQUIP.THRUST|EQUIP.BLOW, "@シロウ/リョウタ", "", "", ""]
  ,[138, "聖拳の交わり/The Joining of Blessed Fists/せいけんのまじわり", true, ["aHP回復/獲得経験値アップ", "", "aHP吸収"], 5, 400, EQUIP.RARE1|EQUIP.RARE2, 0, EQUIP.BLOW, "", "ミッショネルズ", "", "@ジェイコフ"]
  ,[139, "届かじのペーパープレイン/Paper Plane to Nowhere/とどかじのぺーぱーぷれいん", true, ["pHP減少反転/idHP回復/種獲得率アップ", "pHP減少反転/idHP回復", ""], 5, 350, 0, EQUIP.AETHER|EQUIP.WORLD, 0, "", "クリエイターズ/インベイダーズ", "", "@テュアリング"]
  ,[140, "オペラ座の怪獣/Monster of the Opera/おぺらざのかいじゅう", true, ["j集中", "", "pm強化無効"], 3, 0, 0, 0, EQUIP.BLOW|EQUIP.THRUST|EQUIP.SLASH, "シパクトリ/@クリスティーヌ", "", "", ""]
  ,[141, "曇り無き氷の如く/Like Spotless Ice/くもりなきこおりのごとく", true, ["獲得コインアップ", "", "a凍結"], 5, 400, 0, 0, 0, "", "サモナーズ/バーサーカーズ", "", "@モリタカ"]
  ,[142, "まどろみの玉座/The Throne of Slumber/まどろみのぎょくざ", true, ["p幻惑特攻[AR]", "p幻惑特攻[AR]", "j幻惑"], 4, 300, 0, 0, EQUIP.SHOT|EQUIP.SNIPE|EQUIP.NONE, "ネクロス&バッカス", "", "", "@ネクロス"]
  ,[143, "聖夜の彩り/Christmas Decorations/せいやのいろどり", true, ["凍結x/jCP増加", "", ""], 3, 100, 0, 0, EQUIP.SHOT|EQUIP.SNIPE, "シトリー/@アギョウ/チェルノボーグ", "", "", ""]
  ,[145, "いつだってBuzz&Dream/Viral Influence, Forever & Ever", false, ["獲得戦友ポイントアップ", "", "p魅了"], 4, 100, EQUIP.ANY, 0, 0, "", "", "", "@ベンテン"]
  ,[146, "正義と憧れを胸に/Ideals and Admirations/せいぎとあこがれをむねに", true, ["p係留", "", "pm弱点"], 3, 100, 0, EQUIP.AETHER, EQUIP.THRUST|EQUIP.SHOT, "サンダーバード/@ホルス", "", "", ""]
  ,[147, "ライク・ア・ショウ/Like a Show/らいく・あ・しょう", true, ["花獲得率アップ", "", "p烙印"], 5, 100, 0, 0, EQUIP.MAGIC|EQUIP.NONE, "", "エンタティナーズ", "", "@ロキ/@オスカー"]
  ,[149, "新年に啜るは涙にあらず/No New Year's Tears/しんねんにすするはなみだにあらず", true, ["p係留/a祝福", "", ""], 4, 300, 0, EQUIP.WOOD|EQUIP.INFERNAL, 0, "@モウショウ/アマノジャク", "", "", ""]
  ,[148, "干支っ子たちの正月始め！/A Very Zodiac New Year/えとっこたちのしょうがつはじめ！", true, ["魔法に特防[0.8]/pd閃き", "", ""], 3, 50, 0, 0, EQUIP.SHOT|EQUIP.MAGIC, "アギョウ/@イナバ", "", "", ""]
  ,[150, "ぼくたちのチェックメイト/ぼくたちのチェックメイト/ぼくたちのちぇっくめいと", true, ["獲得戦友ポイントアップ/j攻撃強化", "j攻撃強化", ""], 5, 350, 0, EQUIP.INFERNAL|EQUIP.WORLD, 0, "", "ウォーモンガーズ", "", "@メフィストフェレス"]
  ,[151, "君と駆けた不思議の街よ/君と駆けた不思議の街よ/きみとかけたふしぎのまちよ", true, ["ギルド新加入認印獲得率アップ", "p集中", ""], 5, 150, 0, 0, EQUIP.THRUST|EQUIP.MAGIC, "", "ゲームマスターズ/未", "", "@ジャンバヴァン"]
  ,[152, "あれからのファザーフッド/あれからのファザーフッド/あれからのふぁざーふっど", true, ["獲得ランク経験値アップ", "", "em幻惑"], 5, 250, EQUIP.RARE1|EQUIP.RARE2, EQUIP.FIRE|EQUIP.AETHER, 0, "", "タオシーズ", "", "@モトスミ"]
  ,[154, "神宿より、あいを込めて/From Shinjuku, with Our All/しんじゅくより、あいをこめて", false, ["ギルド新加入認印獲得率アップ", "bHP回復", ""], 4, 150, EQUIP.ANY, 0, 0, "", "", "", "@キョウマ"]
  ,[155, "みず入らずの初詣/みず入らずの初詣/みずいらずのはつもうで", true, ["p剛力/獲得経験値アップ", "", ""], 5, 500, 0, 0, EQUIP.SLASH|EQUIP.SHOT|EQUIP.NONE, "", "", "神宿", "@キョウマ"]
  ,[156, "怪盗たちの入学式/怪盗たちの入学式/かいとうたちのにゅうがくしき", true, ["ギルド新加入認印獲得率アップ", "", "a幻惑"], 5, 400, 0, EQUIP.WATER|EQUIP.AETHER, 0, "", "", "中迦野", "@ヘルメス"]
  ,[1001, "開拓の誓い/Vow of Resurrection/かいたくのちかい", false, ["恐怖x", "pCP増加", ""], 5, 100, 0, EQUIP.NETHER, 0, "主人公/@シロウ", "", "", ""]
  ,[1002, "無窮の誓い/Vow of Infinitude/むきゅうのちかい", false, ["マヒx/tクリティカル", "", ""], 5, 400, 0, EQUIP.AETHER, 0, "主人公/@ケンゴ", "", "", ""]
  ,[1003, "豊穣の誓い/Vow of Abundance/ほうじょうのちかい", false, ["pHP回復/告死x", "", ""], 5, 0, 0, EQUIP.WOOD, 0, "主人公/@リョウタ", "", "", ""]
  ,[1004, "根絶の誓い/Vow of Eradication/こんぜつのちかい", false, ["p回避/憑依x", "", ""], 5, 250, 0, EQUIP.WATER, 0, "主人公/@トウジ", "", "", ""]
  ,[1005, "結合の誓い/Vow of Binding/けつごうのちかい", false, ["束縛x/j祈り", "", ""], 5, 300, 0, EQUIP.FIRE, 0, "主人公/@アルク", "", "", ""]
  ,[1006, "犬どもの戦場/Dogs of War/いぬどものせんじょう", false, ["pCP増加/斬撃に特防[0.7]", "", ""], 4, 300, 0, EQUIP.FIRE|EQUIP.WATER, 0, "@モリタカ/タダトモ/@シノ", "", "", ""]
  ,[1007, "ミッションコンプリート/Mission Complete/みっしょんこんぷりーと", false, ["tクリティカル/射狙撃に特防[0.8]", "", ""], 4, 200, 0, 0, EQUIP.SHOT|EQUIP.SNIPE, "コタロウ/@オセ", "", "", ""]
  ,[1008, "計り知れざる永劫の/Immeasurable and Eternal/はかりしれざるえいごうの", false, ["恐怖に特攻[1.4]", "", "pm恐怖"], 4, 100, 0, 0, EQUIP.MAGIC, "@シロウ", "", "", "@ヨグソトース"]
  ,[1009, "先輩と後輩の時間/Mentoring Time/せんぱいとこうはいのじかん", false, ["pHP回復/打撃に特防[0.7]", "", ""], 4, 400, 0, 0, EQUIP.BLOW|EQUIP.LONGSLASH, "グンゾウ/@ワカン・タンカ", "", "", ""]
  ,[1010, "従者並びて/With Retainer in Tow/じゅうしゃならびて", false, ["p弱体反射/baHP回復", "", ""], 4, 0, 0, EQUIP.FIRE|EQUIP.WOOD, 0, "@オニワカ/カーシー", "", "", ""]
  ,[1011, "シューティングスターズ/Shooting Stars/しゅーてぃんぐすたーず", false, ["回避に貫通/t連撃", "", ""], 4, 300, 0, 0, EQUIP.THRUST|EQUIP.SHOT, "イクトシ/@バティム", "", "", ""]
  ,[1012, "幼馴染の流儀/Just Like Old Friends/おさななじみのりゅうぎ", false, ["弱点x", "", ""], 4, 200, 0, EQUIP.AETHER|EQUIP.NETHER, 0, "シロウ/@ケンゴ", "", "", "", 1]
  ,[1013, "魔王の温泉郷へようこそ/Welcome to the Dark Lord's Hot Springs/まおうのおんせんきょうへようこそ", false, ["崩しx/t弱体解除(単)", "", ""], 4, 100, 0, EQUIP.NETHER, 0, "@アンドヴァリ/チェルノボーグ", "", "", ""]
  ,[1014, "大江山の鬼たち/The Ogres of Mt. Oe/おおえやまのおにたち", false, ["威圧x", "", ""], 4, 400, 0, EQUIP.FIRE|EQUIP.WATER|EQUIP.WOOD, 0, "@シュテン/イバラキ", "", "", "", 1]
  ,[1015, "新宿ポリスアカデミー/The Long Arm of the Law/しんじゅくぽりすあかでみー", false, ["スキル封印x/tCP増加", "", ""], 4, 200, 0, EQUIP.WOOD|EQUIP.VALIANT, 0, "タヂカラオ/@ホウゲン", "", "", ""]
  ,[1016, "ナンパの心得/The Player's Guide/なんぱのこころえ", false, ["崩しに特攻[1.4]", "", "paHP減少"], 3, 300, 0, EQUIP.WATER, 0, "@ゴウリョウ/@テュポーン", "", "", ""]
  ,[1017, "山の熊さんたち/Bears of the Mountain/やまのくまさんたち", false, ["根性に特攻[1.4]/j係留", "", ""], 3, 150, 0, EQUIP.WOOD, 0, "@アシガラ/@バーゲスト", "", "", ""]
  ,[1018, "都会の隠れ家/Underground Speakeasy/とかいのかくれが", false, ["加速に特攻[1.4]/j加速", "", ""], 3, 75, 0, EQUIP.AETHER, 0, "@ガンダルヴァ/サンダーバード", "", "", ""]
  ,[1019, "東京カジノへようこそ/Welcome to Tokyo Casino/とうきょうかじのへようこそ", false, ["闘志に特攻[1.4]", "", "paHP減少"], 3, 225, 0, 0, EQUIP.SHOT|EQUIP.SNIPE, "@ハクメン/ショロトル", "", "", ""]
  ,[1020, "次なる聖夜のために/Only 364 Days to Prepare/つぎなるせいやのために", false, ["魔法に特防[0.8]/tCP増加", "", ""], 3, 0, 0, EQUIP.AETHER|EQUIP.NETHER, 0, "@ジェド/タングリスニル", "", "", ""]
  ,[1021, "或る島での1ページ/A Page from an Island Journal/あるしまでの1ぺーじ", false, ["打撃に特防[0.8]/t係留", "", ""], 3, 75, 0, EQUIP.NETHER, 0, "アステリオス/@ロビンソン", "", "", ""]
  ,[1022, "夏の新メニュー開発！/Developing the Summer Menu/なつのしんめにゅーかいはつ！", false, ["pHP回復/祝福に特攻[1.4]", "", ""], 3, 0, 0, EQUIP.FIRE|EQUIP.WOOD, 0, "リョウタ/@チョウジ", "", "", ""]
  ,[1023, "休日のカラオケロード！/Karaoke Extravaganza/きゅうじつのからおけろーど", false, ["pHP回復/脱力に特攻[1.4]", "", ""], 3, 50, 0, EQUIP.AETHER|EQUIP.NETHER, 0, "ベヒモス/@ジズ", "", "", ""]
  ,[1024, "糾える縄の如し/Like a Box of Chocolates/あざなえるなわのごとし", false, ["pCP増加/呪いに特攻[1.4]", "", ""], 3, 225, 0, EQUIP.NETHER, 0, "ケンタ/@バーゲスト", "", "", ""]
  ,[1025, "OH, MY POPSTAR！/Oh, My Pop-star!", false, ["恐怖に特攻[1.4]/t閃き", "", ""], 3, 150, 0, 0, EQUIP.SHOT|EQUIP.SNIPE, "ニャルラトテプ/@アザトース", "", "", ""]
  ,[1026, "ある家族の肖像/Portrait of a Family/あるかぞくのしょうぞう", false, ["pCP増加/祝福に特攻[1.4]", "", ""], 3, 150, 0, EQUIP.FIRE, 0, "@ハーロット/スルト", "", "", ""]
  ,[1027, "はじめてのオムライス！/My First Omelet Rice!/はじめてのおむらいす！", false, ["pHP回復/呪いに特攻[1.4]", "", ""], 3, 75, 0, EQUIP.WATER, 0, "モリタカ/@アギョウ", "", "", ""]
  ,[1028, "鍛錬あるのみ！/Tempered Steel/たんれんあるのみ！", false, ["pCP増加/頑強に特攻[1.4]", "", ""], 3, 175, 0, EQUIP.FIRE|EQUIP.INFERNAL, 0, "クロガネ/アマツマラ/@ヘパイストス", "", "", ""]
  ,[1029, "バディの絆/Bonded Brothers/ばでぃのきずな", false, ["pHP回復/頑強に特攻[1.4]", "", ""], 3, 75, 0, 0, EQUIP.MAGIC, "@レイヴ/カーシー", "", "", ""]
  ,[1030, "ようこそ池袋の劇場へ/Welcome to the Ikebukuro Theater/ようこそいけぶくろのげきじょうへ", false, ["pCP増加/熱情に特攻[1.4]", "", ""], 3, 225, 0, 0, EQUIP.SLASH, "クロード/@スノウ", "", "", ""]
  ,[1031, "飢野学園の指導/Ueno Academy Guidance/うえのがくえんのしどう", false, ["閃きに特攻[1.4]/集中に特攻[1.4]", "", ""], 3, 300, 0, 0, EQUIP.SHOT|EQUIP.SNIPE, "@アールプ/レイヴ", "", "", ""]
  ,[1032, "全ては筋肉より始まる/It All Starts with Muscle!/すべてはきんにくよりはじまる", false, ["剛力に特攻[1.4]", "", "paHP減少"], 3, 300, 0, 0, EQUIP.BLOW, "@アマツマラ/スルト", "", "", ""]
  ,[1033, "父と子と/Father and Child/ちちとこと", false, ["pCP増加/再生に特攻[1.4]", "", ""], 3, 150, 0, 0, EQUIP.SHOT|EQUIP.SNIPE, "@アルク/スルト", "", "", ""]
  ,[1034, "出発！真夏の水中冒険/Midsummer Dive/しゅっぱつ！まなつのすいちゅうぼうけん", false, ["pCP増加/防御強化に特攻[1.4]", "", ""], 3, 225, 0, EQUIP.WATER, 0, "@エイタ/@テュポーン", "", "", ""]
  ,[1035, "おお山の喜びよ/The Mountain's Bounty/おおやまのよろこびよ", false, ["pCP増加/凍結に特攻[1.4]", "", ""], 3, 250, 0, 0, EQUIP.BLOW, "ザオウ/@チェルノボーグ", "", "", ""]
  ,[1036, "どっちの味方なの！？/Whose Side Are You On?!/どっちのみかたなの！？", false, ["pCP増加/幻惑に特攻[1.4]", "", ""], 3, 175, 0, 0, EQUIP.MAGIC|EQUIP.LONGSLASH, "@リヒト/クニヨシ/ベンテン", "", "", ""]
  ,[1037, "深淵の海より来たりて/From the Depths/しんえんのうみよりきたりて", false, ["p弱体反射", "p弱体反射", ""], 5, 250, 0, EQUIP.WATER|EQUIP.INFERNAL, 0, "@トリトン/ダゴン", "", "", "", 2]
  ,[1038, "サン・アンド・オイル！/Sun and Oil!/さん・あんど・おいる！", false, ["聖油に特攻[1.4]", "pCP増加", ""], 4, 0, 0, EQUIP.WOOD|EQUIP.WORLD, 0, "@クロガネ/タンガロア", "", "", ""]
  ,[1039, "サモナーズのX'MAS/A Very Summoner Xmas/さもなーずのX'MAS", false, ["pmHP回復", "", ""], 5, 200, 0, EQUIP.WATER|EQUIP.WOOD|EQUIP.ALLROUND, 0, "@リョウタ/トウジ", "", "", "", 2]
  ,[1040, "同じ月が見ている/Beneath the Same Moon/おなじつきがみている", false, ["p弱体無効/baHP回復", "", ""], 4, 0, 0, 0, EQUIP.MAGIC, "@マリア/ジブリール", "", "", ""]
  ,[1041, "夕暮れ時の青春は/Sunsets of Our Youth/ゆうぐれどきのせいしゅんは", false, ["paHP回復", "", ""], 4, 200, 0, 0, EQUIP.THRUST|EQUIP.SHOT, "@グンゾウ/キュウマ", "", "", "", 1]
  ,[1042, "バレンタイン・ドッグス！/Valentine's Dogs!/ばれんたいん・どっぐす！", false, ["p根性/pdCP増加", "", ""], 5, 250, 0, EQUIP.FIRE|EQUIP.NETHER, EQUIP.SLASH, "モリタカ/@タダトモ", "", "", ""]
  ,[1043, "ショコラは深淵より来たり/Abyssal Confectionery/しょこらはしんえんよりきたり", false, ["呪いに特攻[1.6]/魅了x", "", ""], 4, 0, 0, EQUIP.FIRE|EQUIP.NETHER, 0, "シロウ/@シトリー", "", "", ""]
  ,[1044, "硬派を気取ったあの頃は/Acting Tough/こうはをきどったあのころは", false, ["打撃に特防[0.7]/tCP増加", "", ""], 4, 400, 0, EQUIP.AETHER, EQUIP.BLOW, "@ケンゴ/シトリー", "", "", ""]
  ,[1045, "チョコレート・ダイナマイト！/Chocolate Dynamite!/ちょこれーと・だいなまいと！", false, ["横一文字に特防[0.8]", "pmHP回復", ""], 3, 0, 0, 0, EQUIP.MAGIC|EQUIP.SNIPE, "チョウジ/@エビス", "", "", ""]
  ,[1046, "砂漠のプライベート・レッスン？/Private Lesson in the Desert?/さばくのぷらいべーと・れっすん？", false, ["火傷x", "", "a魅了"], 5, 100, 0, EQUIP.VALIANT|EQUIP.WATER, 0, "@セト/ゴウリョウ", "", "", ""]
  ,[1047, "蒲田ギルドの師弟/A Teacher and Student from Kamata/かまたぎるどのしてい", false, ["t攻撃力微増[AR]/脱力x", "", ""], 5, 500, 0, EQUIP.FIRE|EQUIP.WOOD, 0, "アマツマラ/@クロガネ", "", "", ""]
  ,[1048, "サバイバルリゾート/Survival Resort/さばいばるりぞーと", false, ["熱情に特攻[1.6]", "", "a脱力"], 4, 100, 0, 0, EQUIP.SHOT|EQUIP.SNIPE, "ハヌマン/@ツァトグァ", "", "", ""]
  ,[1049, "剣豪と刀鍛冶の攻防/Battle between Swordsmith and Swordsman/けんごうとかたなかじのこうぼう", false, ["斬撃に特防[0.8]/横一文字に特防[0.8]", "", "pa強化解除(単)"], 4, 300, 0, EQUIP.ALLROUND|EQUIP.FIRE, EQUIP.SLASH, "@ムサシ/アマツマラ", "", "", ""]
  ,[1050, "寂しがりの猛牛たち/Single Bulls Club/さびしがりのもうぎゅうたち", false, ["bCP増加", "", ""], 5, 500, 0, EQUIP.WOOD|EQUIP.NETHER, 0, "ワカン・タンカ/@テツギュウ", "", "", "", 2]
  ,[1051, "流れ者の集う街/City of Drifters/ながれもののつどうまち", false, ["a回避/斬撃に特防[0.7]/突撃に特防[0.7]", "", ""], 5, 100, 0, 0, EQUIP.SLASH|EQUIP.THRUST, "@スズカ/テツギュウ", "", "", ""]
  ,[1052, "いつかどうして夢の鬼/Ogresses' Dream - A Different Time, A Different Place/いつかどうしてゆめのおに", false, ["魔法に特防[0.7]", "pm閃き", ""], 4, 100, 0, EQUIP.FIRE|EQUIP.AETHER, 0, "スズカ/@イバラキ", "", "", ""]
  ,[1053, "剣の道は尚遙か/The Way of the Sword Has Just Begun/けんのみちはなおはるか", false, ["スキルが封印される状態に特攻[1.3]", "", "pm引き寄せ(1マス)"], 4, 300, 0, 0, EQUIP.SLASH|EQUIP.LONGSLASH, "@ホウゲン/トウジ", "", "", ""]
  ,[1054, "歓楽の鬼/Ogres' Nightlife/かんらくのおに", false, ["妨害x", "", "cd魅了"], 4, 0, 0, 0, EQUIP.BLOW|EQUIP.SHOT, "スズカ/@イバラキ", "", "", ""]
  ,[1055, "おお温泉の喜びよ/Hot Spring Fun/おおおんせんのよろこびよ", false, ["凍結x/j温泉", "", ""], 5, 0, 0, 0, EQUIP.SLASH|EQUIP.THRUST, "@ザオウ/チェルノボーグ", "", "", ""]
  ,[1056, "法の代行者たち/The Representatives of Principle/ほうのだいこうしゃたち", false, ["HPが回復する状態に特攻[1.5]", "", "a祝福"], 5, 300, 0, EQUIP.FIRE|EQUIP.WOOD|EQUIP.VALIANT, 0, "ザバーニーヤ/@アルスラーン", "", "", ""]
  ,[1057, "きょうだい弟子の組手/Sparring Brethren/きょうだいでしのくみて", false, ["ma連撃", "", ""], 4, 300, 0, 0, EQUIP.THRUST|EQUIP.BLOW, "イクトシ/@カグツチ", "", "", "", 1]
  ,[1058, "ワンダーフォーゲル！/Mountaineering!/わんだーふぉーげる！", false, ["p奮起/t根性", "", ""], 4, 200, 0, EQUIP.INFERNAL, EQUIP.MAGIC, "ザオウ/@ドゥルガー", "", "", ""]
  ,[1059, "嵐を呼ぶMCバトル！/An Electrifying MC Battle!/あらしをよぶMCばとる！", false, ["強制移動無効(全)", "", "aHP減少"], 5, 250, 0, 0, EQUIP.BLOW|EQUIP.THRUST, "@ベンテン/エーギル", "", "", ""]
  ,[1060, "制御できるならやってみろ！/Stop Me if You Can!/せいぎょできるならやってみろ！", false, ["pm弱体解除(単)/j暴走時防御強化/j暴走+時防御強化", "", ""], 4, 300, 0, EQUIP.AETHER|EQUIP.NETHER, 0, "@フェンリル/ジャンバヴァン", "", "", ""]
  ,[1061, "打ち上げLIVE！/Celebration Live!/うちあげLIVE！", false, ["p意気", "pCP増加", ""], 3, 150, 0, EQUIP.WATER, EQUIP.BLOW|EQUIP.LONGSLASH, "ベンテン/@エビス", "", "", ""]
  ,[1062, "奪取Theサマー/Seize the Summer!/だっしゅTheさまー", false, ["paCP増加", "", "paCP減少"], 3, 100, 0, EQUIP.WATER, 0, "@テュポーン/ベンテン", "", "", ""]
  ,[1063, "成果は現場にあり！/Success Must Be Sought After/せいかはげんじょうにあり！/せいかはげんばにあり！", false, ["p閃き/幻惑に特攻[2.0]", "", ""], 5, 100, 0, EQUIP.WOOD|EQUIP.NETHER, 0, "@アリス/ヴォーロス", "", "", ""]
  ,[1064, "ジェノサイド・ハロウィン/Genociders' Halloween/じぇのさいど・はろうぃん", false, ["強化無効x/tクリティカル+", "", ""], 5, 500, 0, 0, EQUIP.SLASH|EQUIP.LONGSLASH, "ハーロット/@スルト", "", "", ""]
  ,[1065, "今月の得真道学園/The Theme of the Month/こんげつのうまみちがくえん", false, ["j魅了時弱化[AR]/ba根性", "", ""], 4, 400, 0, 0, EQUIP.SLASH|EQUIP.THRUST|EQUIP.MAGIC, "リチョウ/@サナト・クマラ", "", "", ""]
  ,[1066, "ウマミチカンフージェネレーション/Umamichi Kung-Fu Generation/うまみちかんふーじぇねれーしょん", false, ["暴走に特攻[1.6]/暴走+に特攻[1.6]", "pm係留", ""], 4, 300, 0, EQUIP.FIRE|EQUIP.WOOD, 0, "ハヌマン/@ナタ", "", "", ""]
  ,[1067, "コリーダ・デ・トーロス/Corrida de Toros/こりーだ・で・とーろす", false, ["paCP増加", "", "pm引き寄せ(2マス)"], 5, 250, 0, EQUIP.WOOD|EQUIP.AETHER, 0, "@アステリオス/タウラスマスク", "", "", ""]
  ,[1068, "上質の一杯/To Successful Ventures/じょうしつのいっぱい", false, ["pa滋養/j滋養時強化[一杯AR]", "j滋養時強化[一杯AR]", ""], 5, 200, 0, 0, EQUIP.BLOW|EQUIP.SLASH|EQUIP.LONGSLASH, "スノウ/@ギュウマオウ", "", "", ""]
  ,[1069, "浅草ダウンタウンボーイズ/Asakusa Downtown Boys/あさくさだうんたうんぼーいず", false, ["猛毒x/j根性時強化[浅草AR]", "", ""], 4, 200, 0, 0, EQUIP.THRUST|EQUIP.BLOW, "テツギュウ/@ハヌマン", "", "", ""]
  ,[1070, "昼休みの購買部闘争！/School Lunchtime Battle!/ひるやすみのこうばいぶとうそう！", false, ["pa全方向移動力増加/pa加速", "", ""], 4, 400, 0, 0, EQUIP.BLOW, "@ナタ/テツギュウ", "", "", ""]
  ,[1071, "鬼も、福も/Ogres and Fortune/おにも、ふくも", false, ["鬼道の衆に特攻[2.0]", "maCP増加", ""], 5, 100, 0, EQUIP.FIRE|EQUIP.INFERNAL, 0, "@タケマル/モトスミ", "", "", ""]
  ,[1072, "禅の心/Spirit of Zen/ぜんのこころ", false, ["p集中/CS封印x", "", ""], 5, 0, 0, EQUIP.VALIANT, EQUIP.THRUST, "オニワカ/@シュテン", "", "", ""]
  ,[1073, "浅草の愚連隊/Asakusa Gang/あさくさのぐれんたい", false, ["呪いx/j剛力時強化", "", ""], 4, 200, 0, 0, EQUIP.THRUST|EQUIP.MAGIC, "モトスミ/@リチョウ", "", "", ""]
  ,[1074, "フィスト・ファイト！/Fist Fight!/ふぃすと・ふぁいと！", false, ["威圧に特攻[1.4]", "", "pa威圧"], 4, 400, 0, 0, EQUIP.BLOW, "@オニワカ/イバラキ", "", "", ""]
  ,[1075, "父の思い出/Like Father, Like Son/ちちのおもいで", false, ["火傷に特攻[2.0]", "pmクリティカル", ""], 5, 100, 0, 0, EQUIP.SLASH|EQUIP.MAGIC|EQUIP.LONGSLASH, "@マルコシアス/タダトモ", "", "", ""]
  ,[1076, "バレンタイン・ライブ！/Live on Valentine's Day!/ばれんたいん・らいぶ！", false, ["pmCP増加", "pmCP増加", ""], 5, 200, 0, EQUIP.WATER|EQUIP.AETHER, 0, "@ジブリール/マーナガルム", "", "", "", 2]
  ,[1077, "愛の牢獄/Prison of Love/あいのろうごく", false, ["", "", "p係留/pa束縛"], 4, 200, 0, EQUIP.FIRE|EQUIP.WOOD|EQUIP.AETHER, 0, "@ショロトル/ハクメン", "", "", ""]
  ,[1078, "鉄血のバージンロード/Blushing Beloved of Blood and Steel/てっけつのばーじんろーど", false, ["", "tHP回復/tCP増加", ""], 4, 300, 0, 0, EQUIP.MAGIC, "@クロード/スノウ", "", "", ""]
  ,[1079, "再生のキャンバス/Can't Spell Heart Without Art/さいせいのきゃんばす", false, ["", "tCP増加/maHP回復", ""], 3, 0, 0, 0, EQUIP.SHOT|EQUIP.SNIPE|EQUIP.NONE, "リヒト/@イツァムナー", "", "", ""]
  ,[1080, "神宿学園の食いしん坊番長/Shinjuku Academy's Chancellors of Chow/しんじゅくがくえんのくいしんぼうばんちょう", false, ["滋養に特攻[1.4]/paHP回復", "", ""], 3, 150, 0, EQUIP.WOOD|EQUIP.NETHER, 0, "ベヒモス/@リョウタ", "", "", ""]
  ,[1081, "黄金の実り/Golden Harvest/おうごんのみのり", false, ["pa連撃", "paHP回復", ""], 5, 300, 0, 0, EQUIP.THRUST, "ヴォーロス/@ゴエモン", "", "", ""]
  ,[1082, "お宝にはご用心/Eyes on the Prize/おたからにはごようじん", false, ["pmCP増加", "", ""], 5, 200, 0, 0, EQUIP.MAGIC|EQUIP.NONE, "アンドヴァリ/@コタロウ", "", "", "", 2]
  ,[1083, "アタックオブザウォーターメロン/Attack of the Killer Watermelons/あたっくおぶざうぉーたーめろん", false, ["", "", "pd&udHP減少"], 4, 400, 0, EQUIP.FIRE|EQUIP.WOOD, 0, "チョウジ/@ヴォーロス", "", "", ""]
  ,[1084, "Surf the wave/Surfing the Wave", false, ["妨害に特攻[1.6]", "", "p引き寄せ(1マス)"], 4, 200, 0, 0, EQUIP.BLOW, "セト/@ゴエモン", "", "", ""]
  ,[1085, "青春は君をおって/In the Flower of Youth/せいしゅんはきみをおって", false, ["", "pm奮起", ""], 5, 300, 0, EQUIP.FIRE|EQUIP.INFERNAL, 0, "@ドゥルガー/グンゾウ", "", "", "", 2]
  ,[1086, "おいでよぼくらのもふもふ王国/Welcome to the Furry Kingdom!/おいでよぼくらのもふもふおうこく", false, ["", "", "t引き寄せ(1マス)/t魅了"], 5, 200, 0, 0, EQUIP.THRUST|EQUIP.MAGIC, "クニヨシ/@カーシー", "", "", ""]
  ,[1087, "出会いは決定的に/Treasure Every Meeting/であいはけっていてきに", false, ["j怒時強化", "", ""], 4, 400, 0, EQUIP.WATER|EQUIP.WOOD|EQUIP.NETHER, 0, "@クニヨシ/ベンテン", "", "", "", 1]
  ,[1088, "寂しがりのプランクスター/The Lonely Prankster/さびしがりのぷらんくすたー", false, ["jCP増加/t注目", "", ""], 3, 100, 0, 0, EQUIP.BLOW, "アールプ/@カーシー", "", "", ""]
  ,[1089, "夢のもふもふ大激突！/The Great Fluffy Clash of Dreams!/ゆめのもふもふだいげきとつ！", false, ["獣の末裔に特攻[1.5]/獣皮を巻く者に特攻[1.5]/tHP回復", "", ""], 3, 300, 0, EQUIP.WOOD|EQUIP.NETHER, 0, "クニヨシ/@アールプ", "", "", ""]
  ,[1090, "芸術は光と陰に/All in Art is Light and Dark/げいじゅつはひかりとかげに", false, ["", "tCP増加", "tCP減少"], 3, 150, 0, EQUIP.AETHER|EQUIP.NETHER, 0, "@クニヨシ/リヒト", "", "", ""]
  ,[1091, "夏の島の夜の踊り/Nocturnal Dance/なつのしまのよるのおどり", false, ["p意気/pHP回復", "p意気/pHP回復", ""], 5, 250, 0, EQUIP.WORLD|EQUIP.ALLROUND, 0, "@タンガロア/キジムナー", "", "", ""]
  ,[1092, "夢に見た力比べ/The Strength I dream of/ゆめにみたちからくらべ", false, ["", "", "t威圧"], 5, 350, 0, 0, EQUIP.SLASH|EQUIP.NONE, "アステリオス/アスタロト", "", "", "@アスタルテ", 2]
  ,[1093, "巨いなる供物/A Great Offering/おおいなるくもつ", false, ["pdHP回復", "", "cdHP減少"], 4, 100, 0, EQUIP.WOOD|EQUIP.INFERNAL|EQUIP.WORLD, 0, "タンガロア/@ダゴン", "", "", ""]
  ,[1094, "お手柄！うみのこ探検隊/Accomplished Ocean Explorers/おてがら！うみのこたんけんたい", false, ["射撃に特防[0.8]/j加速時強化[AR]", "", ""], 3, 150, 0, 0, EQUIP.THRUST|EQUIP.MAGIC, "@キジムナー/エイタ", "", "", ""]
  ,[1095, "宿命のグラップル！/Grapple With Destiny!/しゅくめいのぐらっぷる！", false, ["回避に貫通/防御力が上昇する状態に貫通", "", "pm崩し"], 5, 500, 0, 0, EQUIP.THRUST|EQUIP.BLOW, "アルスラーン/@アヴァルガ", "", "", ""]
  ,[1096, "研究棟の夜は終わらず/Endless Night of Research/けんきゅうとうのよるはおわらず", false, ["pd根性/tHP減少", "", ""], 5, 100, 0, EQUIP.WOOD|EQUIP.AETHER, 0, "レイヴ/@ジャンバヴァン", "", "", ""]
  ,[1097, "餅つきと喧嘩はひとりで出来ぬ/Can't Fight or Make Rice Cakes Alone/もちつきとけんかはひとりでできぬ", false, ["paHP回復", "", "aHP減少"], 4, 300, 0, EQUIP.FIRE|EQUIP.AETHER, 0, "ケンゴ/@オニワカ", "", "", ""]
  ,[1098, "ゲヘナの腸/The Bowels of Gehenna/げへなのはらわた", false, ["HPが減少する弱体に特攻[1.2]", "", "cd猛毒"], 4, 200, 0, EQUIP.NETHER|EQUIP.INFERNAL, 0, "ルキフゲ/@バエル", "", "", ""]
  ,[1099, "そこにお世話のある限り！/As Long As Someone's There to Help!/そこにおせわのあるかぎり！", false, ["", "tHP回復/tCP増加", ""], 3, 0, 0, EQUIP.WATER|EQUIP.VALIANT|EQUIP.ALLROUND, 0, "@ホロケウカムイ/トムテ", "", "", ""]
  ,[1100, "星よ！太陽よ！/O Stars! O Sun!/ほしよ！たいようよ！", false, ["注目に特攻[1.4]/pd注目", "", ""], 3, 300, 0, EQUIP.WORLD, EQUIP.THRUST|EQUIP.SHOT, "テスカトリポカ/@オンブレティグレ", "", "", ""]
  ,[1101, "苦楽は汗と共に/Sweating Together, Through Good and Bad/くらくはあせとともに", true, ["pa弱体解除(単)/paHP回復", "", ""], 5, 400, 0, 0, EQUIP.SLASH|EQUIP.LONGSLASH, "モリタカ/@オルグス", "", "", ""]
  ,[1102, "最高のパフォーマンスを/The Ultimate Performance/さいこうのぱふぉーまんすを", true, ["全域に特防[0.6]", "pm根性", ""], 5, 0, 0, EQUIP.WOOD, 0, "@リョウタ/@ソール", "", "", ""]
  ,[1103, "ある日の一幕/Snapshot of That Day/あるひのいちまく", true, ["打撃に特防[0.8]/射撃に特防[0.8]", "", "cd強化解除(単)"], 4, 200, 0, 0, EQUIP.BLOW|EQUIP.SHOT|EQUIP.MAGIC, "ケンゴ/@勇者", "", "", ""]
  ,[1104, "夏の海にはこれ一本！/This One's for the Summer Seas!/なつのうみにはこれいっぽん！", false, ["pmHP回復/pm火傷耐性", "pmHP回復/pm火傷耐性", ""], 4, 0, 0, EQUIP.NETHER|EQUIP.INFERNAL, 0, "アンドヴァリ/@スルト", "", "", ""]
  ,[1105, "バーサーカーズのクリスマス！/A Very Berserker Christmas!/ばーさーかーずのくりすます！", false, ["aクリティカル+/祝福に特攻[2.0]", "", ""], 5, 400, 0, 0, EQUIP.THRUST|EQUIP.BLOW|EQUIP.SHOT, "バティム/@ポルックス", "", "", ""]
  ,[1106, "サウナの作法！？/The Way of the Sauna?!/さうなのさほう！？", false, ["paHP回復/ma弱体解除(単)", "ma弱体解除(単)", ""], 5, 200, 0, 0, EQUIP.BLOW|EQUIP.NONE, "フェンリル/@シトリー", "", "", ""]
  ,[1107, "池袋クリスマス・場外乱闘！/A Christmas Off-Premise Altercation in Ikebukuro!/いけぶくろくりすます・じょうがいらんとう！", false, ["", "", "p&tHP減少"], 4, 400, 0, EQUIP.WATER, EQUIP.SLASH|EQUIP.SNIPE, "スノウ/@メリュジーヌ", "", "", ""]
  ,[1108, "親父さん見てる！？/Watchin', Pops?/おやじさんみてる！？", false, ["", "pm激怒+/pmCP増加", ""], 4, 0, 0, EQUIP.FIRE|EQUIP.NETHER, 0, "@バティム/シトリー", "", "", ""]
  ,[1109, "骨董市の品定め/Shopping at the Antique Market/こっとういちのしなさだめ", false, ["", "pmCS封印/pm次ターン強化/t攻撃力増加[次ターン]", ""], 5, 0, 0, EQUIP.WOOD|EQUIP.NETHER, 0, "@フルフミ/リヒト", "", "", ""]
  ,[1110, "金魚すくいレクチャー！/A Lesson in Goldfish Scooping/きんぎょすくいれくちゃー！", false, ["t攻撃力増加[ターン毎減少]", "", ""], 5, 300, 0, EQUIP.WATER, 0, "リョウタ/@リチョウ/ケットシー", "", "", "", 2]
  ,[1111, "祭りの日の出会い/An Encounter at the Festival/まつりのひのであい", false, ["ma閃き", "bCP増加", ""], 4, 100, 0, EQUIP.FIRE|EQUIP.WOOD|EQUIP.AETHER, 0, "@リチョウ/フルフミ", "", "", ""]
  ,[1112, "同盟者からのサプライズ/A Surprise from a Comrade/どうめいしゃからのさぷらいず", false, ["暗闇に特攻[1.6]/tスキル発動率大増", "", ""], 4, 200, 0, EQUIP.INFERNAL|EQUIP.VALIANT|EQUIP.WORLD, 0, "テスカトリポカ/@バロール", "", "", ""]
  ,[1113, "悪魔式ティータイム/A Devilish Teatime/あくましきてぃーたいむ", false, ["nm毒/nm再生", "nm毒/nm再生", "nm毒/nm再生"], 5, 200, 0, EQUIP.AETHER|EQUIP.NETHER|EQUIP.INFERNAL, 0, "@アスタロト/バエル", "", "", ""]
  ,[1114, "がんばれ貧乏探偵！/Hang In There, Poor Detective!/がんばれびんぼうたんてい！", false, ["pスキル発動率増加", "pm回避", ""], 5, 300, 0, EQUIP.FIRE|EQUIP.AETHER, 0, "@ジブリール/ノーマッド", "", "", ""]
  ,[1115, "ファンクラブの友たち/Friends in the Fan Club/ふぁんくらぶのともたち", false, ["", "paCP増加/pa意気", ""], 4, 400, 0, 0, EQUIP.SLASH|EQUIP.BLOW|EQUIP.LONGSLASH, "@カルキ/マーナガルム", "", "", ""]
  ,[1116, "六本木のフィクサーたち/Fixers of Roppongi/ろっぽんぎのふぃくさーたち", false, ["移動不能になる状態に特攻[1.3]/不動x", "", ""], 4, 200, 0, 0, EQUIP.SLASH|EQUIP.SHOT, "ハクメン/@ツァトグァ", "", "", ""]
  ,[1117, "汝、何処へ行き給う/Where are you going?/なんじ、いずこへいきたまう", false, ["t弱体解除(単)/dHP回復", "", ""], 5, 100, 0, EQUIP.AETHER|EQUIP.NETHER, 0, "マリア/@アザゼル", "", "", ""]
  ,[1118, "雪解けの甘くとろけたる/A Melting Snow-like Delight/ゆきどけのあまくとろけたる", false, ["p被回復増加", "p被回復増加/bHP回復", ""], 5, 250, 0, EQUIP.VALIANT|EQUIP.ALLROUND, 0, "ホロケウカムイ/@キムンカムイ", "", "", ""]
  ,[1119, "聖者の休息/A Break for a Saint/せいじゃのきゅうそく", true, ["", "maHP回復", "nm武器種変更：無"], 4, 300, 0, 0, EQUIP.MAGIC|EQUIP.THRUST, "@ソール/キムンカムイ", "", "", ""]
  ,[1120, "我が盟友の為ならば/For My Sworn Friend/わがめいゆうのためならば", false, ["熱情に特攻[1.6]", "emCP増加", ""], 4, 150, 0, 0, EQUIP.SLASH|EQUIP.SHOT, "@アイゼン/カルキ", "", "", ""]
  ,[1121, "衣装の心得/Tips on Clothing/いしょうのこころえ", false, ["p魅了耐性/魅了に特攻[2.0]", "", ""], 5, 300, 0, 0, EQUIP.BLOW|EQUIP.SHOT|EQUIP.NONE, "@アラクネ/カトブレパス", "", "", ""]
  ,[1122, "ようこそ、夜の宝石たち/Welcome, Gems of the Night/ようこそ、よるのほうせきたち", false, ["", "", "t引き寄せ(1マス)"], 4, 200, 0, EQUIP.AETHER|EQUIP.INFERNAL, 0, "@ツクヨミ/スズカ", "", "", "", 1]
  ,[1123, "腹の底から高らかに/Hearty Singing/はらのそこからたからかに", false, ["回避に貫通/bHP回復", "bHP回復", ""], 4, 300, 0, 0, EQUIP.BLOW|EQUIP.SLASH|EQUIP.LONGSLASH, "アラクネ/@スズカ", "", "", ""]
  ,[1124, "サマータイム・シャワー/Summertime Shower/さまーたいむ・しゃわー", false, ["p注目/熱情に特攻[1.4]", "", ""], 3, 0, 0, 0, EQUIP.BLOW|EQUIP.THRUST, "ワカン・タンカ/@ザバーニーヤ", "", "", ""]
  ,[1125, "我ら拳と魔眼を交え/A Fight of Fists and Evil Eyes/われらこぶしとまがんをまじえ", false, ["t攻撃力増加[装備者CP]", "", ""], 5, 400, 0, 0, EQUIP.BLOW|EQUIP.THRUST, "@シヴァ/@バロール", "", "", "", 2]
  ,[1126, "FUWAMOCO☆マジックショー！/Fluffy and Furry ☆ Magic Show!/FUWAMOCO☆まじっくしょー！", false, ["", "pm弱体無効", "pa混乱/idHP減少"], 5, 100, 0, EQUIP.INFERNAL|EQUIP.WOOD|EQUIP.WORLD, 0, "@テスカトリポカ/ケットシー", "", "", ""]
  ,[1127, "モノクロームシンドローム/Monochrome Syndrome/ものくろーむしんどろーむ", false, ["烙印に特攻[1.3]", "", "cd烙印"], 4, 300, 0, EQUIP.FIRE|EQUIP.NETHER|EQUIP.NULL, 0, "アルク/@キリト", "", "", ""]
  ,[1128, "無骨な漢の贈り物/A Present from an Uncouth Fellow/ぶこつなおとこのおくりもの", false, ["p攻撃強化/束縛x", "", ""], 4, 0, 0, EQUIP.WATER|EQUIP.VALIANT|EQUIP.FIRE, 0, "@シヴァ/ヘラクレス", "", "", ""]
  ,[1129, "あのサークルへ急げ！/Let's Check Out that Booth!/あのさーくるへいそげ！", false, ["恐怖x/j意気", "", ""], 3, 200, 0, EQUIP.WOOD|EQUIP.NETHER|EQUIP.WORLD, 0, "クニヨシ/@ヘカテー", "", "", ""]
  ,[1130, "大宇宙おいかけっこ/Wild-Space Chase/だいうちゅうおいかけっこ", false, ["em極限", "em極限", ""], 5, 500, 0, 0, EQUIP.SLASH|EQUIP.LONGSLASH, "ニャルラトテプ/@クトゥグァ", "", "", "", 2]
  ,[1131, "ドキドキ実験開始！/The Experiment Begins!/どきどきじっけんかいし！", false, ["p集中時強化[実験AR]", "p集中時強化[実験AR]/pa集中", ""], 5, 300, 0, EQUIP.VALIANT|EQUIP.WOOD, 0, "クロガネ/@ノーマッド", "", "", ""]
  ,[1132, "パイロットトレーニング/Pilot Training/ぱいろっととれーにんぐ", false, ["dHP回復", "", "pa妨害"], 4, 200, 0, EQUIP.WATER|EQUIP.FIRE|EQUIP.INFERNAL, 0, "@ブレイク/クトゥグァ", "", "", ""]
  ,[1133, "ドリームランドへようこそ/Welcome to the Dreamlands!/どりーむらんどへようこそ", false, ["発狂x", "", "a発狂"], 4, 300, 0, 0, EQUIP.BLOW|EQUIP.SHOT|EQUIP.SNIPE, "アザトース/@ノーデンス", "", "", ""]
  ,[1134, "D計画の少年たち/The Plan D Youth/Dけいかくのしょうねんたち", false, ["j妨害時強化", "a祝福/j妨害時強化", ""], 4, 0, 0, 0, EQUIP.SHOT|EQUIP.MAGIC|EQUIP.SNIPE, "@R-19/デュオ", "", "", ""]
  ,[1135, "胸騒ぎの旧校舎/The Rowdy Old Library/むなさわぎのきゅうこうしゃ", false, ["j熱情時強化[AR]", "pm熱情/j熱情時強化[AR]", ""], 5, 300, 0, EQUIP.FIRE|EQUIP.AETHER, 0, "リョウタ/@フルフミ", "", "", ""]
  ,[1136, "ウェルカムトゥサイバースペース/Welcome to Cyberspace!/うぇるかむとぅさいばーすぺーす", false, ["p弱体無効/全域に特防[0.6]", "p弱体無効", ""], 5, 250, 0, 0, EQUIP.SLASH|EQUIP.MAGIC|EQUIP.NONE, "@ティンダロス/エニグマ", "", "", ""]
  ,[1137, "パジャマパーティ・ランウェイ/Pajama Party Runway/ぱじゃまぱーてぃ・らんうぇい", false, ["paHP回復", "t集中時強化[パジャマAR]", ""], 4, 150, 0, 0, EQUIP.THRUST|EQUIP.SHOT|EQUIP.SNIPE, "ドゥルガー/@アラクネ", "", "", ""]
  ,[1138, "狩猟式トレイルランニング/Hunter-Style Training/しゅりょうしきとれいるらんにんぐ", false, ["pCP増加/崩しに特攻[1.2]", "", ""], 3, 200, 0, EQUIP.WOOD|EQUIP.AETHER|EQUIP.ALLROUND, 0, "@イシュバランケー/ヤマサチヒコ", "", "", ""]
  ,[1139, "炎天下のレッスルウォー/Wrestling in the Heat/えんてんかのれっするうぉー", false, ["打撃に特防[0.8]", "", "tHP減少"], 3, 300, 0, 0, EQUIP.BLOW|EQUIP.THRUST|EQUIP.LONGSLASH, "アヴァルガ/@ジュウゴ", "", "", ""]
  ,[1140, "カウボーイ・レッスン/Lessons in Cowboying/かうぼーい・れっすん", false, ["pa係留", "pa係留/ud根性", ""], 3, 150, 0, EQUIP.WATER|EQUIP.INFERNAL|EQUIP.NETHER, 0, "@ヴァプラ/ベイブ・バニヤン", "", "", ""]
  ,[1141, "カーテンコールをもう一度！/One More Curtain Call!/かーてんこーるをもういちど！", false, ["j祝福時強化[AR]", "j祝福時強化[AR]/udHP回復", ""], 5, 250, 0, 0, EQUIP.SHOT|EQUIP.LONGSLASH|EQUIP.NONE, "@レイヴ/ブギーマン", "", "", ""]
  ,[1142, "探究者たちのステージ/Explorers' Stage/たんきゅうしゃたちのすてーじ", false, ["pd頑強", "pm奮起", ""], 4, 200, 0, 0, EQUIP.SLASH|EQUIP.MAGIC, "@マクロイヒ/レイヴ/ヘカテー", "", "", ""]
  ,[1143, "放課後チョコレートマジック/Afterschool Chocolate Magic/ほうかごちょこれーとまじっく", false, ["em聖油", "tHP回復", ""], 4, 100, 0, EQUIP.AETHER|EQUIP.NETHER|EQUIP.ALLROUND, 0, "@ブギーマン/シュクユウ", "", "", ""]
  ,[1144, "限り無き大決戦！/The Infinite Final Battle/かぎりなきだいけっせん！", false, ["", "", "a烙印"], 5, 400, 0, EQUIP.INFERNAL|EQUIP.VALIANT|EQUIP.WORLD, 0, "マクロイヒ/@シパクトリ", "", "", "", 2]
  ,[1145, "上級生のおもてなし/Upperclassman Hospitality/じょうきゅうせいのおもてなし", false, ["魅了に特攻[2.0]/t回避", "", ""], 5, 250, 0, EQUIP.VALIANT|EQUIP.INFERNAL|EQUIP.AETHER, 0, "@アルジャーノン/ツクヨミ", "", "", ""]
  ,[1146, "真夏の浜辺の大闘争！/Battle on the Big Beach/まなつのはまべのだいとうそう！", false, ["j奮起時強化", "j奮起時強化/em奮起", ""], 5, 400, 0, EQUIP.FIRE|EQUIP.WOOD|EQUIP.WATER, 0, "@テスカトリポカ/オンブレティグレ", "", "", ""]
  ,[1147, "君と喜びの舞を/Our Dance of Joy/きみとよろこびのまいを", false, ["回避に貫通", "tHP回復", ""], 4, 200, 0, 0, EQUIP.MAGIC|EQUIP.SNIPE|EQUIP.BLOW|EQUIP.SHOT, "@オトヒメ/ヤマサチヒコ", "", "", ""]
  ,[1148, "家族の事が知りたくて/Family Talks/かぞくのことがしりたくて", false, ["マヒx/j閃き時強化[AR]", "", ""], 4, 250, 0, 0, EQUIP.THRUST|EQUIP.MAGIC, "クロガネ/@ヘパイストス", "", "", ""]
  ,[1149, "グリーンマジック/Green Magic/ぐりーんまじっく", false, ["魔法に特防[0.7]/bCP増加", "", ""], 4, 100, 0, 0, EQUIP.THRUST|EQUIP.SHOT|EQUIP.LONGSLASH, "シンノウ/@ヴォーロス", "", "", ""]
  ,[1150, "お仕置きサンタの特訓/Santa Training as Punishment/おしおきさんたのとっくん", false, ["a闘志/j根性", "j根性", ""], 5, 400, 0, 0, EQUIP.SLASH|EQUIP.SHOT, "ジェド/@クランプス", "", "", ""]
  ,[1151, "インソムニア・レメディ/Insomnia Remedy/いんそむにあ・れめでぃ", false, ["a毒時強化[AR]/t毒反転", "a毒時強化[AR]/t毒反転", ""], 5, 250, 0, EQUIP.WOOD|EQUIP.AETHER|EQUIP.VALIANT, 0, "シンノウ/@ヤスヨリ", "", "", ""]
  ,[1152, "スノー&シュガー/Snow and Sugar/すのー&しゅがー", true, ["p凍結耐性/jHP減少反転/idHP回復", "p凍結耐性", ""], 4, 100, 0, EQUIP.AETHER|EQUIP.NETHER, 0, "ジェド/ネクロス&バッカス", "", "", "@バッカス"]
  ,[1153, "思い出のXmasディナー/Christmas Dinner Memories/おもいでのXmasでぃなー", false, ["pm被回復増加/d守護", "pm被回復増加", ""], 4, 0, 0, EQUIP.FIRE|EQUIP.WOOD|EQUIP.AETHER, 0, "@チョウジ/リョウタ", "", "", ""]
  ,[1154, "辺獄の子らに愛を/Love for Limbo's Children/へんごくのこらにあいを", false, ["打撃に特防[0.8]", "", "pm脱力"], 3, 100, 0, 0, EQUIP.SLASH|EQUIP.MAGIC, "@ジズ/ハーロット", "", "", ""]
  ,[1155, "波乱のサンドアート教室/Sand Art Chaos/はらんのさんどあーときょうしつ", false, ["", "udHP回復/maCP増加", ""], 3, 150, 0, EQUIP.FIRE|EQUIP.WOOD|EQUIP.NETHER, 0, "イツァムナー/@ヴァプラ", "", "", ""]
  ,[1156, "鬼は十年一剣を磨く/Ogres' Time to Shine will Come/おにはじゅうねんいっけんをみがく", true, ["p熱情", "", "ma魅了"], 4, 150, 0, 0, EQUIP.BLOW|EQUIP.LONGSLASH|EQUIP.NONE, "@オルグス/@タケマル", "", "", ""]
  ,[1157, "六本木の最強ヤンキー同盟/Roppongi's Roughest Alliance/ろっぽんぎのさいきょうやんきーどうめい", false, ["pm連撃", "", "p引き寄せ(1マス)"], 5, 350, 0, EQUIP.FIRE|EQUIP.NETHER|EQUIP.VALIANT, 0, "ギュウマオウ/@セト", "", "", ""]
  ,[1158, "すぺしゃるちゃんこを召し上がれ/Special Stew Time/すぺしゃるちゃんこをめしあがれ", false, ["t意気", "j祝福", ""], 4, 100, 0, EQUIP.WATER|EQUIP.NETHER, 0, "バーゲスト/@アシガラ", "", "", ""]
  ,[1159, "ナイトバード・ラウンジ/Nightbird Lounge/ないとばーど・らうんじ", false, ["pmHP回復/t全方向移動力増加[解除不可]", "", ""], 4, 150, 0, 0, EQUIP.SHOT|EQUIP.MAGIC|EQUIP.NONE, "ガンダルヴァ/@サンダーバード", "", "", ""]
  ,[1160, "踊れや歌えやどんちゃん騒ぎ！/Dance! Sing!! Revel!!!/おどれやうたえやどんちゃんさわぎ！", false, ["aクリティカル/bCP増加", "", ""], 5, 400, 0, EQUIP.WATER|EQUIP.WORLD, 0, "@ゴウリョウ/@ウランバートル", "", "", ""]
  ,[1161, "ゆるっとミニふわクリスマス！/A Mini-Fluffy Christmas/ゆるっとみにふわくりすます！", false, ["p回避/pm祝福", "pm祝福", ""], 5, 200, 0, EQUIP.AETHER|EQUIP.NETHER, 0, "@オッター/ホルス/テュアリング", "", "", ""]
  ,[1162, "お控えなすって！/Stand Down!/おひかえなすって！", false, ["", "", "p崩し"], 4, 150, 0, 0, EQUIP.SLASH|EQUIP.LONGSLASH, "オッター/@ホルス", "", "", "", 1]
  ,[1163, "赤と白の格子暗号/Cipher of Red and White/あかとしろのこうしあんごう", false, ["baスキル封印耐性", "", "pa確率強化解除/id強化解除(単)"], 4, 200, 0, 0, EQUIP.SHOT|EQUIP.SNIPE, "テュアリング/@ウランバートル", "", "", ""]
  ,[1164, "花散らす犬士たち/花散らす犬士たち/はなちらすけんしたち", false, ["aHP回復/移動不能になる状態に特攻[1.5]", "", "aHP吸収"], 5, 250, 0, EQUIP.WOOD|EQUIP.VALIANT, 0, "ヤスヨリ/@タネトモ", "", "", ""]
  ,[1165, "折れし角、折れぬ心/折れし角、折れぬ心/おれしつの、おれぬこころ", false, ["p浄化/j浄化時強化[AR]", "p浄化", ""], 5, 0, 0, 0, EQUIP.THRUST|EQUIP.MAGIC, "@オニワカ/ヨリトモ", "", "", ""]
  ,[1166, "知略の武士ども/知略の武士ども/ちりゃくのぶしども", false, ["pCP増加", "", "cd恐怖"], 4, 0, 0, EQUIP.VALIANT|EQUIP.WORLD, 0, "@ヨリトモ/タネトモ", "", "", ""]
  ,[1167, "放課後ハプニング！/放課後ハプニング！/ほうかごはぷにんぐ！", false, ["aHP回復/j根性時強化[ハプニングAR]", "", ""], 4, 400, 0, 0, EQUIP.THRUST|EQUIP.BLOW, "@テツギュウ/ギリメカラ", "", "", ""]
  ,[1168, "博愛に満ちた季節/博愛に満ちた季節/はくあいにみちたきせつ", false, ["火傷に特攻[1.2]", "pCP増加", ""], 3, 100, 0, 0, EQUIP.THRUST|EQUIP.BLOW|EQUIP.SHOT, "@ジェイコフ/シンヤ", "", "", ""]
  ,[1169, "冥境にて世話をかく/冥境にて世話をかく/めいきょうにてせわをかく", false, ["pa弱体無効/j滋養時強化[冥境AR]", "j滋養時強化[冥境AR]", ""], 5, 400, 0, EQUIP.FIRE|EQUIP.WATER|EQUIP.VALIANT, 0, "ショロトル/@ホロケウカムイ", "", "", ""]
  ,[1170, "湯殿経営2人なら極楽/湯殿経営2人なら極楽/ゆどのけいえいふたりならごくらく", false, ["p祝福/t奮起", "p祝福", ""], 5, 250, 0, 0, EQUIP.THRUST|EQUIP.MAGIC|EQUIP.NONE, "ダイコク/サルタヒコ", "", "", "@オオナムチ"]
  ,[1171, "ふわもこな湯上がりに/ふわもこな湯上がりに/ふわもこなゆあがりに", false, ["熱情に特攻[1.5]", "pHP回復", ""], 4, 150, 0, EQUIP.ALLROUND|EQUIP.WATER, 0, "@ベイブ・バニヤン/@シュクユウ", "", "", ""]
  ,[1172, "菓子箱の中の夢/菓子箱の中の夢/かしばこのなかのゆめ", false, ["j意気", "tCP増加", ""], 3, 300, 0, 0, EQUIP.SLASH|EQUIP.BLOW, "バーゲスト/@シュクユウ", "", "", ""]
  ,[1173, "有馬の2人は三羽烏と/有馬の2人は三羽烏と/ありまのふたりはさんばがらすと", false, ["スキル封印に特攻[1.2]", "", "a幻惑"], 3, 150, 0, EQUIP.AETHER|EQUIP.NETHER, 0, "ミネアキ/@ダイコク", "", "", ""]
  ,[1174, "応援すること火の如し/応援すること火の如し/おうえんすることひのごとし", false, ["pHP減少反転/idHP回復/a集中", "pHP減少反転/idHP回復", ""], 5, 300, 0, 0, EQUIP.SHOT|EQUIP.SNIPE, "@ノブハル/イフリート", "", "", ""]
  ,[1175, "兵どもが星の下/兵どもが星の下/つわものどもがほしのもと/つわものどもがほしのした", false, ["ba根性", "pHP回復", ""], 5, 100, 0, EQUIP.FIRE|EQUIP.VALIANT, 0, "シンノウ/@オンブレティグレ", "", "", ""]
  ,[1176, "不夜城のおしごと！/不夜城のおしごと！/ふやじょうのおしごと！", false, ["t暗闇耐性", "pa滋養/t暗闇耐性", ""], 4, 150, 0, EQUIP.FIRE|EQUIP.INFERNAL, 0, "イバラキ/@ツクヨミ", "", "", ""]
  ,[1177, "忍×忍捕物帳！/忍×忍捕物帳！/にん×にんとりものちょう！", false, ["", "paCP増加/paHP回復", ""], 4, 250, 0, 0, EQUIP.SLASH|EQUIP.THRUST|EQUIP.SHOT, "@ジライヤ/ゴエモン", "", "", ""]
  ,[1178, "太陽の子らよ、廃墟を翔けよ/太陽の子らよ、廃墟を翔けよ/たいようのこらよ、はいきょをかけよ", false, ["全域に特防[0.8]", "aHP回復", ""], 3, 0, 0, EQUIP.WOOD|EQUIP.VALIANT, 0, "ティダ/@マルドゥック", "", "", ""]
  ,[1179, "廻り合わせの父たちへ/廻り合わせの父たちへ/めぐりあわせのちちたちへ", false, ["妨害に特攻[1.2]/j闘志", "", ""], 3, 300, 0, 0, EQUIP.SLASH|EQUIP.THRUST, "@シノ/マルコシアス", "", "", ""]
  ,[1180, "ドントストップ・サマージョイ！/ドントストップ・サマージョイ！/どんとすとっぷ・さまーじょい！", false, ["a&baHP回復", "baHP回復", "aHP吸収"], 5, 0, 0, 0, EQUIP.THRUST|EQUIP.SHOT|EQUIP.LONGSLASH, "@オオグチマガミ/タヂカラオ", "", "", ""]
  ,[1181, "リバーサイド・レスキュー/リバーサイド・レスキュー/りばーさいど・れすきゅー", false, ["et守護", "et守護", "p引き寄せ(1マス)"], 5, 250, 0, 0, EQUIP.BLOW|EQUIP.SHOT, "@シヴァ/ジュウゴ", "", "", ""]
  ,[1182, "アラクネコレクションSO24/アラクネコレクションSO24/あらくねこれくしょんSO24", false, ["p連撃/CS封印x", "", ""], 4, 100, 0, 0, EQUIP.BLOW|EQUIP.MAGIC|EQUIP.SNIPE, "アラクネ/@テュアリング", "", "", ""]
  ,[1183, "ウォーター・ストライク！/ウォーター・ストライク！/うぉーたー・すとらいく！", false, ["p係留/pd弱体無効", "", ""], 4, 0, 0, EQUIP.FIRE|EQUIP.VALIANT, 0, "@オオグチマガミ/シヴァ", "", "", ""]
  ,[1184, "祭り漢のお通りよお/祭り漢のお通りよお/まつりおとこのおとおりよお", false, ["pHP回復/熱情に特攻[1.4]", "", ""], 3, 100, 0, EQUIP.FIRE|EQUIP.WOOD|EQUIP.WORLD, 0, "@タヂカラオ/テスカトリポカ", "", "", ""]
  ,[1185, "お腹周りは引き締めて！/お腹周りは引き締めて！/おなかまわりはひきしめて！", false, ["", "pm注目/nmCP増加", ""], 3, 150, 0, EQUIP.WATER|EQUIP.AETHER, 0, "アラクネ/@サンダーバード", "", "", ""]
  ,[1186, "ダイブ・トゥ・ドリーム/ダイブ・トゥ・ドリーム/だいぶ・とぅ・どりーむ", false, ["p注目", "pm集中", ""], 5, 400, 0, 0, EQUIP.SHOT|EQUIP.SNIPE, "アールプ/@ホテイ", "", "", ""]
  ,[1187, "ウェアリング・モンスター/ウェアリング・モンスター/うぇありんぐ・もんすたー", false, ["jCP増加", "jCP増加", ""], 5, 150, 0, 0, EQUIP.THRUST|EQUIP.SHOT, "@アールプ/トウジ", "", "", "", 2]
  ,[1188, "鬼ごっこまたしても/鬼ごっこまたしても/おにごっこまたしても", false, ["p加速/射狙撃に特防[0.8]", "p加速", ""], 4, 300, 0, 0, EQUIP.SLASH|EQUIP.BLOW|EQUIP.LONGSLASH, "ケンゴ/@トウジ", "", "", ""]
  ,[1189, "ハロウィンポリスBack！/ハロウィンポリスBack！/はろうぃんぽりすBack！", false, ["再生に特攻[1.4]", "", "a再生"], 4, 200, 0, EQUIP.AETHER|EQUIP.NETHER, 0, "トウジ/@ホテイ", "", "", ""]
  ,[1190, "万聖節には合いの手を！/万聖節には合いの手を！/ばんせいせつにはあいのてを！", false, ["烙印に特攻[1.2]", "", "cdHP減少"], 3, 100, 0, 0, EQUIP.BLOW|EQUIP.LONGSLASH|EQUIP.SNIPE, "@アザトース/エビス", "", "", ""]
  ,[1191, "出雲に雷舞う如く！/出雲に雷舞う如く！/いずもにいかずちまうごとく！/いずもにかみなりまうごとく！", false, ["p弱体無効/回避に貫通/防御力が上昇する状態に貫通", "", ""], 5, 500, 0, EQUIP.ALLROUND|EQUIP.WATER|EQUIP.AETHER, 0, "タケミナカタ/@タイシャクテン", "", "", ""]
  ,[1192, "革命の犬たちへ/革命の犬たちへ/かくめいのいぬたちへ", false, ["", "tHP回復", "t憑依"], 5, 200, 0, 0, EQUIP.SLASH|EQUIP.THRUST|EQUIP.LONGSLASH, "マサノリ/@ヨシトウ", "", "", ""]
  ,[1193, "プリザーブドタイム/プリザーブドタイム/ぷりざーぶどたいむ", false, ["pd弱体解除(単)", "", "cd凍結"], 4, 100, 0, 0, EQUIP.THRUST|EQUIP.SHOT|EQUIP.SNIPE, "ヒッポリュトス/@マサノリ", "", "", ""]
  ,[1194, "バッドガイズ・グッドラック！/バッドガイズ・グッドラック！/ばっどがいず・ぐっどらっく！", false, ["呪いに特攻[1.4]", "a祝福", ""], 4, 200, 0, 0, EQUIP.SHOT|EQUIP.MAGIC|EQUIP.LONGSLASH, "クランプス/@シームルグ", "", "", ""]
  ,[1195, "微笑み彩る花箱を/微笑み彩る花箱を/ほほえみいろどるはなばこを", false, ["pm再生/打撃に特防[0.8]", "", ""], 3, 100, 0, EQUIP.FIRE|EQUIP.WATER|EQUIP.WOOD, 0, "@ヒッポリュトス/シトリー", "", "", ""]
  ,[1196, "稽古の後でもう一本！/稽古の後でもう一本！/けいこのあとでもういっぽん！", false, ["幻惑に特攻[2.0]", "", "aHP減少(%)"], 5, 100, 0, 0, EQUIP.SLASH|EQUIP.MAGIC|EQUIP.LONGSLASH, "@シュウイチ/マクロイヒ", "", "", ""]
  ,[1197, "愛され獣になりたくて！/愛され獣になりたくて！/あいされけものになりたくて！", false, ["ba回避", "emCP増加", ""], 5, 300, 0, EQUIP.WATER|EQUIP.NETHER, 0, "@ユーマ/アールプ", "", "", ""]
  ,[1198, "極上肉のテクニック/極上肉のテクニック/ごくじょうにくのてくにっく", false, ["j被回復増加", "pa奮起", ""], 4, 100, 0, EQUIP.FIRE|EQUIP.WOOD|EQUIP.NETHER, 0, "リョウタ/@チェルノボーグ", "", "", ""]
  ,[1199, "ロスト・パラダイス/ロスト・パラダイス/ろすと・ぱらだいす", false, ["j幻惑耐性/ba根性", "", ""], 4, 0, 0, EQUIP.ALLROUND|EQUIP.AETHER|EQUIP.NETHER, 0, "@ロビンソン/@アステリオス", "", "", ""]
  ,[1200, "真夏のクリスマスツリー/真夏のクリスマスツリー/まなつのくりすますつりー", false, ["混乱x/emHP回復", "emHP回復", ""], 4, 150, 0, EQUIP.FIRE|EQUIP.WATER|EQUIP.WOOD, 0, "@ジェド/@イツァムナー", "", "", ""]
  ,[1201, "メルト・ファンタジア/メルト・ファンタジア/めると・ふぁんたじあ", false, ["pmCP増加/魅了に特攻[1.3]", "", ""], 3, 200, 0, EQUIP.FIRE|EQUIP.INFERNAL, 0, "アルク/@スルト", "", "", ""]
]);
