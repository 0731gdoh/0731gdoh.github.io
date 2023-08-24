"use strict";

function Record(index, id, x, limited){
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
  this.limited = limited;
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
      ["/A.Advantage to ", "に特攻/"],
      ["/D.Advantage from ", "に特防/"],
      ["/Nullify ", "無効/"]
    ];
    this.tag.forEach(function(x, i){
      var ex = [];
      var c = [];
      var tags = x.map(function(d){
        var tag = TAG[d[0] % TAG_MAX];
        if(i < 3 && tag.category.length){
          ex = ex.concat(tag.category.slice(1));
          if(!tag.reading) return 0;
          ex.push(tag.category[0]);
        }
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
  var ids = [];
  var order = [];
  var result = a.map(function(v, i){
    var limited = v.splice(2, 1)[0];
    var id = v.shift();
    if(ids.indexOf(id) !== -1) throw new Error("AR IDが重複しています（" + id + "）");
    ids.push(id);
    if(id === 101 || id === 1001) order.push(0);
    order.push(i);
    if(v[14]){
      var cb = "CS威力増加(+" + v[14] + ")";
      v[1] += v[1] ? "/" + cb : cb;
    }
    return new Record(i, id, v, limited);
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
  INFINITE: 1 << 10,
  NULL: 1 << 11
};

var AR = Record.createList(
  //id, 名前, 限定, 効果(自身), 効果(味方), 効果(敵), 特防, 耐性, レア度, ATK基本値, レア度指定, 属性指定, 武器タイプ指定, キャラ指定, ギルド指定, 学園指定[, CS倍率補正[, CSタイプ変更]]
  [[0, "", false, "", "", "", "", "", 0, 0, 0, 0, 0, "", "", ""]
  ,[1, "見習い使い魔の応援/Support of the Apprentice Familiar/みならいつかいまのおうえん", false, "CP増加", "", "", "", "", 1, 50, 0, EQUIP.ALLROUND, 0, "", "", ""]
  ,[2, "深淵の門番の破片/Shard of the Abyssal Gatekeeper/しんえんのもんばんのはへん", false, "", "", "", "", "恐怖", 2, 75, 0, EQUIP.NETHER, 0, "", "", ""]
  ,[3, "遠雷の闘士の破片/Shard of the Thunder Warrior/えんらいのとうしのはへん", false, "", "", "", "", "マヒ", 2, 200, 0, EQUIP.AETHER, 0, "", "", ""]
  ,[4, "長途の待人の破片/長途の待人の破片/ちょうとのまちびとのはへん", false, "", "", "", "", "告死", 2, 0, 0, EQUIP.WOOD, 0, "", "", ""]
  ,[101, "今、ここだけにしかない物語/Written in the Here and Now/いま、ここだけにしかないものがたり", false, "HP回復/獲得ランク経験値アップ", "", "", "", "", 4, 300, EQUIP.ANY, 0, 0, "", "", ""]
  ,[107, "お宝目指して何処までも/お宝目指して何処までも/おたからめざしてどこまでも", false, "獲得コインアップ", "", "呪い", "", "", 4, 200, EQUIP.ANY, 0, 0, "", "", ""]
  ,[108, "教えの庭にも/教えの庭にも/おしえのにわにも", false, "獲得経験値アップ/獲得ランク経験値アップ", "", "", "", "", 4, 200, EQUIP.ANY, 0, 0, "", "", ""]
  ,[119, "放課後の工房/Afterschool Workshop/ほうかごのこうぼう", false, "種獲得率アップ", "", "根性解除/根性耐性", "", "", 4, 300, EQUIP.ANY, 0, 0, "", "", ""]
  ,[134, "仕事終わりのひとときを/A Special Moment After Work/しごとおわりのひとときを", false, "獲得コインアップ/友情時強化", "", "", "", "", 4, 100, EQUIP.ANY, 0, 0, "", "", ""]
  ,[102, "拮抗の例外処理？/Exception of Antagonism?/きっこうのれいがいしょり？", true, "強制移動無効(後)", "", "HP減少", "", "", 2, 150, 0, EQUIP.WATER, 0, "", "", ""]
  ,[103, "魔王と魔王/Dark Lords/まおうとまおう", true, "", "", "", "", "毒/猛毒", 3, 150, EQUIP.ANY, 0, 0, "", "", ""]
  ,[104, "仰げば尊し/Revere Thy Teachers/あおげばとうとし", false, "獲得経験値集約/獲得経験値アップ", "", "", "", "", 4, 100, EQUIP.ANY, 0, 0, "", "", ""]
  ,[105, "聖夜のダブル・ヒーロー！/Christmas Eve's Heroic Duo!/せいやのだぶる・ひーろー！", true, "根性/特防[0.8]", "", "", "打撃", "", 3, 150, 0, 0, EQUIP.SLASH|EQUIP.THRUST|EQUIP.BLOW, "タウラスマスク/クランプス", "", ""]
  ,[106, "ギュウマオウ式OJT！/OJT: The Gyumao Way/ぎゅうまおうしきOJT！", true, "特防[0.8]", "弱体解除(単)", "", "突撃", "", 3, 0, 0, 0, EQUIP.LONGSLASH|EQUIP.MAGIC, "ギュウマオウ/セト", "", ""]
  ,[109, "友情のコンビネーション！/Made Along the Way/ゆうじょうのこんびねーしょん！", false, "獲得戦友ポイントアップ/友情時強化", "", "", "", "", 4, 200, EQUIP.ANY, 0, 0, "", "", ""]
  ,[110, "はぐれ者の幕間/はぐれ者の幕間/はぐれもののまくま", true, "弱体解除(単)", "", "", "", "劫火", 3, 0, 0, EQUIP.FIRE|EQUIP.WATER|EQUIP.AETHER, 0, "トムテ/テツヤ", "", ""]
  ,[111, "初湯のひととき/First Soak of the Year/はつゆのひととき", true, "HP回復", "", "", "", "", 4, 0, 0, 0, EQUIP.THRUST|EQUIP.LONGSLASH|EQUIP.NONE, "ギュウマオウ/シンノウ", "", ""]
  ,[112, "曙光に燃える/In the Fires of Daybreak/しょこうにもえる", true, "", "弱体解除(単)", "", "", "", 4, 400, 0, EQUIP.FIRE|EQUIP.WOOD|EQUIP.WORLD, 0, "タウラスマスク/ワカン・タンカ", "", "", 1]
  ,[113, "しゃかりき稼ぐぜ海の家/Money-Making Beach House/しゃかりきかせぐぜうみのいえ", true, "奮起", "HP回復", "", "", "", 3, 200, 0, EQUIP.FIRE|EQUIP.WATER, 0, "ノーマッド/タダトモ", "", ""]
  ,[114, "我ら今は共に歩みて/我ら今は共に歩みて/われらいまはともにあゆみて", true, "獲得ランク経験値アップ/獲得戦友ポイントアップ", "奮起", "", "", "", 5, 250, EQUIP.RARE1|EQUIP.RARE2, 0, 0, "", "バーサーカーズ/ミッショネルズ/タイクーンズ", ""]
  ,[115, "東方の賢者たち/Wisemen of the East/とうほうのけんじゃたち", true, "獲得コインアップ", "", "弱点", "", "", 5, 250, EQUIP.RARE1|EQUIP.RARE2, EQUIP.WORLD, 0, "", "ワイズメン", ""]
  ,[116, "冒険に祝杯を/Cheers to Adventure/ぼうけんにしゅくはいを", true, "魔王と名の付くスキルに特攻[1.4]/弱体無効", "", "", "", "", 3, 150, 0, 0, EQUIP.MAGIC|EQUIP.SNIPE, "ネクロス&バッカス/ソール/オルグス", "", ""]
  ,[117, "ようこそ地獄の温泉郷/ようこそ地獄の温泉郷/ようこそじごくのおんせんきょう", true, "凍結耐性/弱体解除(単)", "凍結耐性", "", "", "凍結", 3, 0, 0, 0, EQUIP.SLASH|EQUIP.BLOW|EQUIP.MAGIC, "ダイコク/サルタヒコ", "", ""]
  ,[118, "スウィート・ドリームス/スウィート・ドリームス/すうぃーと・どりーむす", true, "獲得経験値アップ", "閃き", "", "", "", 5, 200, 0, 0, EQUIP.MAGIC|EQUIP.SNIPE, "", "ビーストテイマーズ", ""]
  ,[120, "レッツ・クラフト！/It's Crafting Time!/れっつ・くらふと！", false, "ARトークン獲得率アップ", "攻撃力低下耐性", "", "", "", 4, 200, EQUIP.ANY, 0, 0, "", "", ""]
  ,[121, "隣を駆ける者ども/隣を駆ける者ども/となりをかけるものども", true, "", "崩し耐性/CP増加", "", "", "", 3, 150, 0, EQUIP.AETHER|EQUIP.VALIANT, 0, "タングリスニル/グリンブルスティ", "", ""]
  ,[122, "虎たちの乾杯/Toasting Tigers/とらたちのかんぱい", true, "CP増加/威圧特攻[AR]/特攻[1.4]", "威圧特攻[AR]", "", "", "", 4, 200, 0, 0, EQUIP.THRUST|EQUIP.MAGIC, "ノーマッド/ドゥルガー/リチョウ", "", ""]
  ,[123, "クイーン・オブ・カブキチョウ/クイーン・オブ・カブキチョウ/くいーん・おぶ・かぶきちょう", true, "種獲得率アップ", "", "魅了", "", "", 5, 100, 0, EQUIP.NETHER|EQUIP.INFERNAL, 0, "", "アウトローズ", ""]
  ,[124, "猫たちの憩いの場/A Place Where the Cats Can Dream/ねこたちのいこいのば", true, "HP回復/CP増加", "", "", "", "", 3, 0, 0, 0, EQUIP.SLASH|EQUIP.MAGIC|EQUIP.NONE, "テスカトリポカ/ケットシー", "", ""]
  ,[125, "バレンタインアドベンチャー/Valentine's Expedition/ばれんたいんあどべんちゃー", true, "HP回復", "", "", "", "疑念", 3, 200, 0, EQUIP.FIRE|EQUIP.WATER|EQUIP.WOOD, 0, "キュウマ/アキハゴンゲン", "", ""]
  ,[126, "その日は、桜の山で/その日は、桜の山で/そのひは、さくらのやまで", true, "根性時強化[桜の山AR]/CP増加", "CP増加", "", "", "", 4, 100, 0, EQUIP.WOOD|EQUIP.AETHER, 0, "ザオウ/シュテン", "", ""]
  ,[127, "クラフターズの日課/クラフターズの日課/くらふたーずのにっか", true, "ARトークン獲得率アップ/CP増加", "", "", "", "", 5, 500, 0, 0, EQUIP.THRUST|EQUIP.SHOT, "", "クラフターズ", ""]
  ,[128, "アチアチ・ホットキャンプ！/Piping-Hot Camp!/あちあち・ほっときゃんぷ！", true, "浄化/弱体解除(単)/滋養に特攻[1.3]", "", "", "", "", 3, 100, 0, EQUIP.FIRE|EQUIP.WOOD, 0, "カグツチ/シロウ/アイゼン", "", ""]
  ,[129, "N番目の祝宴/N番目の祝宴/Nばんめのしゅくえん", true, "特防[0.8]/祝福", "", "", "狙撃", "", 3, 0, 0, 0, EQUIP.LONGSLASH|EQUIP.THRUST|EQUIP.SLASH, "ヤスヨリ/オンブレティグレ", "", ""]
  ,[130, "母と子と/母と子と/ははとこと", true, "花獲得率アップ", "HP回復", "", "", "", 5, 100, 0, EQUIP.FIRE|EQUIP.NETHER, 0, "", "ジェノサイダーズ", ""]
  ,[131, "夏の日の一枚/夏の日の一枚/なつのひのいちまい", true, "意気", "", "", "", "魅了", 3, 150, 0, EQUIP.ALLROUND|EQUIP.WATER|EQUIP.INFERNAL, 0, "ベイブ・バニヤン/シュクユウ", "", ""]
  ,[132, "ある安らぎの日/ある安らぎの日/あるやすらぎのひ", true, "獲得コインアップ/獲得ランク経験値アップ", "", "", "", "", 5, 400, EQUIP.RARE1|EQUIP.RARE2, EQUIP.FIRE|EQUIP.WATER, 0, "", "タイクーンズ", ""]
  ,[133, "シークレット・エージェンツ/シークレット・エージェンツ/しーくれっと・えーじぇんつ", true, "", "", "恐怖", "", "崩し", 3, 300, 0, 0, EQUIP.SHOT|EQUIP.SLASH|EQUIP.MAGIC, "", "エージェンツ", ""]
  ,[135, "ひとりだけのあなたへ/For You and Only You", false, "花獲得率アップ", "弱体解除(単)", "", "", "", 4, 200, EQUIP.ANY, 0, 0, "", "", ""]
  ,[136, "光輝成す刃たち/光輝成す刃たち/こうきなすやいばたち", true, "極限/ARトークン獲得率アップ", "", "", "", "", 5, 500, 0, EQUIP.ALLROUND, EQUIP.SLASH, "", "サモナーズ", ""]
  ,[137, "寒空の下、君を待って/寒空の下、君を待って/さむぞらのした、きみをまって", true, "", "祝福", "", "", "凍結", 3, 100, 0, 0, EQUIP.MAGIC|EQUIP.THRUST|EQUIP.BLOW, "シロウ/リョウタ", "", ""]
  ,[138, "聖拳の交わり/聖拳の交わり/せいけんのまじわり", true, "HP回復/獲得経験値アップ", "", "HP吸収", "", "", 5, 400, EQUIP.RARE1|EQUIP.RARE2, 0, EQUIP.BLOW, "", "ミッショネルズ", ""]
  ,[139, "届かじのペーパープレイン/届かじのペーパープレイン/とどかじのぺーぱーぷれいん", true, "HP減少反転/種獲得率アップ", "HP減少反転", "", "", "", 5, 350, 0, EQUIP.AETHER|EQUIP.WORLD, 0, "", "クリエイターズ/インベイダーズ", ""]
  ,[140, "オペラ座の怪獣/オペラ座の怪獣/おぺらざのかいじゅう", true, "集中", "", "強化無効", "", "", 3, 0, 0, 0, EQUIP.BLOW|EQUIP.THRUST|EQUIP.SLASH, "シパクトリ/クリスティーヌ", "", ""]
  ,[1001, "開拓の誓い/Vow of Resurrection/かいたくのちかい", false, "", "CP増加", "", "", "恐怖", 5, 100, 0, EQUIP.NETHER, 0, "主人公/シロウ", "", ""]
  ,[1002, "無窮の誓い/Vow of Infinitude/むきゅうのちかい", false, "クリティカル", "", "", "", "マヒ", 5, 400, 0, EQUIP.AETHER, 0, "主人公/ケンゴ", "", ""]
  ,[1003, "豊穣の誓い/Vow of Abundance/ほうじょうのちかい", false, "HP回復", "", "", "", "告死", 5, 0, 0, EQUIP.WOOD, 0, "主人公/リョウタ", "", ""]
  ,[1004, "根絶の誓い/Vow of Eradication/こんぜつのちかい", false, "回避", "", "", "", "憑依", 5, 250, 0, EQUIP.WATER, 0, "主人公/トウジ", "", ""]
  ,[1005, "結合の誓い/Vow of Binding/けつごうのちかい", false, "祈り", "", "", "", "束縛", 5, 300, 0, EQUIP.FIRE, 0, "主人公/アルク", "", ""]
  ,[1006, "犬どもの戦場/Dogs of War/いぬどものせんじょう", false, "CP増加/特防[0.7]", "", "", "斬撃", "", 4, 300, 0, EQUIP.FIRE|EQUIP.WATER, 0, "モリタカ/タダトモ/シノ", "", ""]
  ,[1007, "ミッションコンプリート/Mission Complete/みっしょんこんぷりーと", false, "クリティカル/特防[0.8]", "", "", "射撃/狙撃", "", 4, 200, 0, 0, EQUIP.SHOT|EQUIP.SNIPE, "コタロウ/オセ", "", ""]
  ,[1008, "計り知れざる永劫の/Immeasurable and Eternal/はかりしれざるえいごうの", false, "恐怖に特攻[1.4]", "", "恐怖", "", "", 4, 100, 0, 0, EQUIP.MAGIC, "シロウ", "", ""]
  ,[1009, "先輩と後輩の時間/Mentoring Time/せんぱいとこうはいのじかん", false, "HP回復/特防[0.7]", "", "", "打撃", "", 4, 400, 0, 0, EQUIP.BLOW|EQUIP.LONGSLASH, "グンゾウ/ワカン・タンカ", "", ""]
  ,[1010, "従者並びて/With Retainer in Tow/じゅうしゃならびて", false, "弱体反射/HP回復", "", "", "", "", 4, 0, 0, EQUIP.FIRE|EQUIP.WOOD, 0, "オニワカ/カーシー", "", ""]
  ,[1011, "シューティングスターズ/Shooting Stars/しゅーてぃんぐすたーず", false, "回避に貫通/連撃", "", "", "", "", 4, 300, 0, 0, EQUIP.THRUST|EQUIP.SHOT, "イクトシ/バティム", "", ""]
  ,[1012, "幼馴染の流儀/Just Like Old Friends/おさななじみのりゅうぎ", false, "", "", "", "", "弱点", 4, 200, 0, EQUIP.AETHER|EQUIP.NETHER, 0, "シロウ/ケンゴ", "", "", 1]
  ,[1013, "魔王の温泉郷へようこそ/Welcome to the Dark Lord's Hot Springs/まおうのおんせんきょうへようこそ", false, "弱体解除(単)", "", "", "", "崩し", 4, 100, 0, EQUIP.NETHER, 0, "アンドヴァリ/チェルノボーグ", "", ""]
  ,[1014, "大江山の鬼たち/The Ogres of Mt. Oe/おおえやまのおにたち", false, "", "", "", "", "威圧", 4, 400, 0, EQUIP.FIRE|EQUIP.WATER|EQUIP.WOOD, 0, "シュテン/イバラキ", "", "", 1]
  ,[1015, "新宿ポリスアカデミー/The Long Arm of the Law/しんじゅくぽりすあかでみー", false, "CP増加", "", "", "", "スキル封印", 4, 200, 0, EQUIP.WOOD|EQUIP.VALIANT, 0, "タヂカラオ/ホウゲン", "", ""]
  ,[1016, "ナンパの心得/The Player's Guide/なんぱのこころえ", false, "崩しに特攻[1.4]", "", "HP減少", "", "", 3, 300, 0, EQUIP.WATER, 0, "ゴウリョウ/テュポーン", "", ""]
  ,[1017, "山の熊さんたち/Bears of the Mountain/やまのくまさんたち", false, "根性に特攻[1.4]/係留", "", "", "", "", 3, 150, 0, EQUIP.WOOD, 0, "アシガラ/バーゲスト", "", ""]
  ,[1018, "都会の隠れ家/Underground Speakeasy/とかいのかくれが", false, "加速に特攻[1.4]/加速", "", "", "", "", 3, 75, 0, EQUIP.AETHER, 0, "ガンダルヴァ/サンダーバード", "", ""]
  ,[1019, "東京カジノへようこそ/Welcome to Tokyo Casino/とうきょうかじのへようこそ", false, "闘志に特攻[1.4]", "", "HP減少", "", "", 3, 225, 0, 0, EQUIP.SHOT|EQUIP.SNIPE, "ハクメン/ショロトル", "", ""]
  ,[1020, "次なる聖夜のために/Only 364 Days to Prepare/つぎなるせいやのために", false, "特防[0.8]/CP増加", "", "", "魔法", "", 3, 0, 0, EQUIP.AETHER|EQUIP.NETHER, 0, "ジェド/タングリスニル", "", ""]
  ,[1021, "或る島での1ページ/A Page from an Island Journal/あるしまでの1ぺーじ", false, "特防[0.8]/係留", "", "", "打撃", "", 3, 75, 0, EQUIP.NETHER, 0, "アステリオス/ロビンソン", "", ""]
  ,[1022, "夏の新メニュー開発！/Developing the Summer Menu/なつのしんめにゅーかいはつ！", false, "HP回復/祝福に特攻[1.4]", "", "", "", "", 3, 0, 0, EQUIP.FIRE|EQUIP.WOOD, 0, "リョウタ/チョウジ", "", ""]
  ,[1023, "休日のカラオケロード！/Karaoke Extravaganza/きゅうじつのからおけろーど", false, "HP回復/脱力に特攻[1.4]", "", "", "", "", 3, 50, 0, EQUIP.AETHER|EQUIP.NETHER, 0, "ベヒモス/ジズ", "", ""]
  ,[1024, "糾える縄の如し/Like a Box of Chocolates/あざなえるなわのごとし", false, "CP増加/呪いに特攻[1.4]", "", "", "", "", 3, 225, 0, EQUIP.NETHER, 0, "ケンタ/バーゲスト", "", ""]
  ,[1025, "OH, MY POPSTAR！/Oh, My Pop-star!", false, "恐怖に特攻[1.4]/閃き", "", "", "", "", 3, 150, 0, 0, EQUIP.SHOT|EQUIP.SNIPE, "ニャルラトテプ/アザトース", "", ""]
  ,[1026, "ある家族の肖像/Portrait of a Family/あるかぞくのしょうぞう", false, "CP増加/祝福に特攻[1.4]", "", "", "", "", 3, 150, 0, EQUIP.FIRE, 0, "ハーロット/スルト", "", ""]
  ,[1027, "はじめてのオムライス！/My First Omelet Rice!/はじめてのおむらいす！", false, "HP回復/呪いに特攻[1.4]", "", "", "", "", 3, 75, 0, EQUIP.WATER, 0, "モリタカ/アギョウ", "", ""]
  ,[1028, "鍛錬あるのみ！/Tempered Steel/たんれんあるのみ！", false, "CP増加/頑強に特攻[1.4]", "", "", "", "", 3, 175, 0, EQUIP.FIRE|EQUIP.INFERNAL, 0, "クロガネ/アマツマラ/ヘパイストス", "", ""]
  ,[1029, "バディの絆/Bonded Brothers/ばでぃのきずな", false, "HP回復/頑強に特攻[1.4]", "", "", "", "", 3, 75, 0, 0, EQUIP.MAGIC, "レイヴ/カーシー", "", ""]
  ,[1030, "ようこそ池袋の劇場へ/Welcome to the Ikebukuro Theater/ようこそいけぶくろのげきじょうへ", false, "CP増加/熱情に特攻[1.4]", "", "", "", "", 3, 225, 0, 0, EQUIP.SLASH, "クロード/スノウ", "", ""]
  ,[1031, "飢野学園の指導/Ueno Academy Guidance/うえのがくえんのしどう", false, "閃きに特攻[1.4]/集中に特攻[1.4]", "", "", "", "", 3, 300, 0, 0, EQUIP.SHOT|EQUIP.SNIPE, "アールプ/レイヴ", "", ""]
  ,[1032, "全ては筋肉より始まる/It All Starts with Muscle!/すべてはきんにくよりはじまる", false, "剛力に特攻[1.4]", "", "HP減少", "", "", 3, 300, 0, 0, EQUIP.BLOW, "アマツマラ/スルト", "", ""]
  ,[1033, "父と子と/Father and Child/ちちとこと", false, "CP増加/再生に特攻[1.4]", "", "", "", "", 3, 150, 0, 0, EQUIP.SHOT|EQUIP.SNIPE, "アルク/スルト", "", ""]
  ,[1034, "出発！真夏の水中冒険/Midsummer Dive/しゅっぱつ！まなつのすいちゅうぼうけん", false, "CP増加/防御強化に特攻[1.4]", "", "", "", "", 3, 225, 0, EQUIP.WATER, 0, "エイタ/テュポーン", "", ""]
  ,[1035, "おお山の喜びよ/The Mountain's Bounty/おおやまのよろこびよ", false, "CP増加/凍結に特攻[1.4]", "", "", "", "", 3, 250, 0, 0, EQUIP.BLOW, "ザオウ/チェルノボーグ", "", ""]
  ,[1036, "どっちの味方なの！？/Whose Side Are You On?!/どっちのみかたなの！？", false, "CP増加/幻惑に特攻[1.4]", "", "", "", "", 3, 175, 0, 0, EQUIP.MAGIC|EQUIP.LONGSLASH, "リヒト/クニヨシ/ベンテン", "", ""]
  ,[1037, "深淵の海より来たりて/From the Depths/しんえんのうみよりきたりて", false, "弱体反射", "弱体反射", "", "", "", 5, 250, 0, EQUIP.WATER|EQUIP.INFERNAL, 0, "トリトン/ダゴン", "", "", 2]
  ,[1038, "サン・アンド・オイル！/Sun and Oil!/さん・あんど・おいる！", false, "聖油に特攻[1.4]", "CP増加", "", "", "", 4, 0, 0, EQUIP.WOOD|EQUIP.WORLD, 0, "クロガネ/タンガロア", "", ""]
  ,[1039, "サモナーズのX'MAS/A Very Summoner Xmas/さもなーずのX'MAS", false, "HP回復", "", "", "", "", 5, 200, 0, EQUIP.WATER|EQUIP.WOOD|EQUIP.ALLROUND, 0, "リョウタ/トウジ", "", "", 2]
  ,[1040, "同じ月が見ている/Beneath the Same Moon/おなじつきがみている", false, "弱体無効/HP回復", "", "", "", "", 4, 0, 0, 0, EQUIP.MAGIC, "マリア/ジブリール", "", ""]
  ,[1041, "夕暮れ時の青春は/Sunsets of Our Youth/ゆうぐれどきのせいしゅんは", false, "HP回復", "", "", "", "", 4, 200, 0, 0, EQUIP.THRUST|EQUIP.SHOT, "グンゾウ/キュウマ", "", "", 1]
  ,[1042, "バレンタイン・ドッグス！/Valentine's Dogs!/ばれんたいん・どっぐす！", false, "根性/CP増加", "", "", "", "", 5, 250, 0, EQUIP.FIRE|EQUIP.NETHER, EQUIP.SLASH, "モリタカ/タダトモ", "", ""]
  ,[1043, "ショコラは深淵より来たり/Abyssal Confectionery/しょこらはしんえんよりきたり", false, "呪いに特攻[1.6]", "", "", "", "魅了", 4, 0, 0, EQUIP.FIRE|EQUIP.NETHER, 0, "シロウ/シトリー", "", ""]
  ,[1044, "硬派を気取ったあの頃は/Acting Tough/こうはをきどったあのころは", false, "特防[0.7]/CP増加", "", "", "打撃", "", 4, 400, 0, EQUIP.AETHER, EQUIP.BLOW, "ケンゴ/シトリー", "", ""]
  ,[1045, "チョコレート・ダイナマイト！/Chocolate Dynamite!/ちょこれーと・だいなまいと！", false, "特防[0.8]", "HP回復", "", "横一文字", "", 3, 0, 0, 0, EQUIP.MAGIC|EQUIP.SNIPE, "チョウジ/エビス", "", ""]
  ,[1046, "砂漠のプライベート・レッスン？/Private Lesson in the Desert?/さばくのぷらいべーと・れっすん？", false, "", "", "魅了", "", "火傷", 5, 100, 0, EQUIP.VALIANT|EQUIP.WATER, 0, "セト/ゴウリョウ", "", ""]
  ,[1047, "蒲田ギルドの師弟/A Teacher and Student from Kamata/かまたぎるどのしてい", false, "攻撃力微増[AR]", "", "", "", "脱力", 5, 500, 0, EQUIP.FIRE|EQUIP.WOOD, 0, "アマツマラ/クロガネ", "", ""]
  ,[1048, "サバイバルリゾート/Survival Resort/さばいばるりぞーと", false, "熱情に特攻[1.6]", "", "脱力", "", "", 4, 100, 0, 0, EQUIP.SHOT|EQUIP.SNIPE, "ハヌマン/ツァトグァ", "", ""]
  ,[1049, "剣豪と刀鍛冶の攻防/Battle between Swordsmith and Swordsman/けんごうとかたなかじのこうぼう", false, "特防[0.8]", "", "強化解除(単)", "斬撃/横一文字", "", 4, 300, 0, EQUIP.ALLROUND|EQUIP.FIRE, EQUIP.SLASH, "ムサシ/アマツマラ", "", ""]
  ,[1050, "寂しがりの猛牛たち/Single Bulls Club/さびしがりのもうぎゅうたち", false, "CP増加", "", "", "", "", 5, 500, 0, EQUIP.WOOD|EQUIP.NETHER, 0, "ワカン・タンカ/テツギュウ", "", "", 2]
  ,[1051, "流れ者の集う街/City of Drifters/ながれもののつどうまち", false, "回避/特防[0.7]", "", "", "斬撃/突撃", "", 5, 100, 0, 0, EQUIP.SLASH|EQUIP.THRUST, "スズカ/テツギュウ", "", ""]
  ,[1052, "いつかどうして夢の鬼/Ogresses' Dream - A Different Time, A Different Place/いつかどうしてゆめのおに", false, "特防[0.7]", "閃き", "", "魔法", "", 4, 100, 0, EQUIP.FIRE|EQUIP.AETHER, 0, "スズカ/イバラキ", "", ""]
  ,[1053, "剣の道は尚遙か/The Way of the Sword Has Just Begun/けんのみちはなおはるか", false, "スキルが封印される状態に特攻[1.3]", "", "引き寄せ(1マス)", "", "", 4, 300, 0, 0, EQUIP.SLASH|EQUIP.LONGSLASH, "ホウゲン/トウジ", "", ""]
  ,[1054, "歓楽の鬼/Ogres' Nightlife/かんらくのおに", false, "", "", "魅了", "", "妨害", 4, 0, 0, 0, EQUIP.BLOW|EQUIP.SHOT, "スズカ/イバラキ", "", ""]
  ,[1055, "おお温泉の喜びよ/Hot Spring Fun/おおおんせんのよろこびよ", false, "温泉", "", "", "", "凍結", 5, 0, 0, 0, EQUIP.SLASH|EQUIP.THRUST, "ザオウ/チェルノボーグ", "", ""]
  ,[1056, "法の代行者たち/The Representatives of Principle/ほうのだいこうしゃたち", false, "HPが回復する状態に特攻[1.5]", "", "祝福", "", "", 5, 300, 0, EQUIP.FIRE|EQUIP.WOOD|EQUIP.VALIANT, 0, "ザバーニーヤ/アルスラーン", "", ""]
  ,[1057, "きょうだい弟子の組手/Sparring Brethren/きょうだいでしのくみて", false, "連撃", "", "", "", "", 4, 300, 0, 0, EQUIP.THRUST|EQUIP.BLOW, "イクトシ/カグツチ", "", "", 1]
  ,[1058, "ワンダーフォーゲル！/Mountaineering!/わんだーふぉーげる！", false, "奮起/根性", "", "", "", "", 4, 200, 0, EQUIP.INFERNAL, EQUIP.MAGIC, "ザオウ/ドゥルガー", "", ""]
  ,[1059, "嵐を呼ぶMCバトル！/An Electrifying MC Battle!/あらしをよぶMCばとる！", false, "強制移動無効(全)", "", "HP減少", "", "", 5, 250, 0, 0, EQUIP.BLOW|EQUIP.THRUST, "ベンテン/エーギル", "", ""]
  ,[1060, "制御できるならやってみろ！/Stop Me if You Can!/せいぎょできるならやってみろ！", false, "弱体解除(単)/暴走時防御強化/暴走+時防御強化", "", "", "", "", 4, 300, 0, EQUIP.AETHER|EQUIP.NETHER, 0, "フェンリル/ジャンバヴァン", "", ""]
  ,[1061, "打ち上げLIVE！/Celebration Live!/うちあげLIVE！", false, "意気", "CP増加", "", "", "", 3, 150, 0, EQUIP.WATER, EQUIP.BLOW|EQUIP.LONGSLASH, "ベンテン/エビス", "", ""]
  ,[1062, "奪取Theサマー/Seize the Summer!/だっしゅTheさまー", false, "CP増加", "", "CP減少", "", "", 3, 100, 0, EQUIP.WATER, 0, "テュポーン/ベンテン", "", ""]
  ,[1063, "成果は現場にあり！/Success Must Be Sought After/せいかはげんじょうにあり！", false, "閃き/幻惑に特攻[2.0]", "", "", "", "", 5, 100, 0, EQUIP.WOOD|EQUIP.NETHER, 0, "アリス/ヴォーロス", "", ""]
  ,[1064, "ジェノサイド・ハロウィン/Genociders' Halloween/じぇのさいど・はろうぃん", false, "クリティカル+", "", "", "", "強化無効", 5, 500, 0, 0, EQUIP.SLASH|EQUIP.LONGSLASH, "ハーロット/スルト", "", ""]
  ,[1065, "今月の得真道学園/The Theme of the Month/こんげつのうまみちがくえん", false, "魅了時弱化[AR]/根性", "", "", "", "", 4, 400, 0, 0, EQUIP.SLASH|EQUIP.THRUST|EQUIP.MAGIC, "リチョウ/サナト・クマラ", "", ""]
  ,[1066, "ウマミチカンフージェネレーション/Umamichi Kung-Fu Generation/うまみちかんふーじぇねれーしょん", false, "暴走に特攻[1.6]/暴走+に特攻[1.6]", "係留", "", "", "", 4, 300, 0, EQUIP.FIRE|EQUIP.WOOD, 0, "ハヌマン/ナタ", "", ""]
  ,[1067, "コリーダ・デ・トーロス/Corrida de Toros/こりーだ・で・とーろす", false, "CP増加", "", "引き寄せ(2マス)", "", "", 5, 250, 0, EQUIP.WOOD|EQUIP.AETHER, 0, "アステリオス/タウラスマスク", "", ""]
  ,[1068, "上質の一杯/To Successful Ventures/じょうしつのいっぱい", false, "滋養/滋養時強化[AR]", "滋養時強化[AR]", "", "", "", 5, 200, 0, 0, EQUIP.BLOW|EQUIP.SLASH|EQUIP.LONGSLASH, "スノウ/ギュウマオウ", "", ""]
  ,[1069, "浅草ダウンタウンボーイズ/Asakusa Downtown Boys/あさくさだうんたうんぼーいず", false, "根性時強化[浅草AR]", "", "", "", "猛毒", 4, 200, 0, 0, EQUIP.THRUST|EQUIP.BLOW, "テツギュウ/ハヌマン", "", ""]
  ,[1070, "昼休みの購買部闘争！/School Lunchtime Battle!/ひるやすみのこうばいぶとうそう！", false, "全方向移動力増加/加速", "", "", "", "", 4, 400, 0, 0, EQUIP.BLOW, "ナタ/テツギュウ", "", ""]
  ,[1071, "鬼も、福も/Ogres and Fortune/おにも、ふくも", false, "鬼道の衆に特攻[2.0]", "CP増加", "", "", "", 5, 100, 0, EQUIP.FIRE|EQUIP.INFERNAL, 0, "タケマル/モトスミ", "", ""]
  ,[1072, "禅の心/Spirit of Zen/ぜんのこころ", false, "集中", "", "", "", "CS封印", 5, 0, 0, EQUIP.VALIANT, EQUIP.THRUST, "オニワカ/シュテン", "", ""]
  ,[1073, "浅草の愚連隊/Asakusa Gang/あさくさのぐれんたい", false, "剛力時強化", "", "", "", "呪い", 4, 200, 0, 0, EQUIP.THRUST|EQUIP.MAGIC, "モトスミ/リチョウ", "", ""]
  ,[1074, "フィスト・ファイト！/Fist Fight!/ふぃすと・ふぁいと！", false, "威圧に特攻[1.4]", "", "威圧", "", "", 4, 400, 0, 0, EQUIP.BLOW, "オニワカ/イバラキ", "", ""]
  ,[1075, "父の思い出/Like Father, Like Son/ちちのおもいで", false, "火傷に特攻[2.0]", "クリティカル", "", "", "", 5, 100, 0, 0, EQUIP.SLASH|EQUIP.MAGIC|EQUIP.LONGSLASH, "マルコシアス/タダトモ", "", ""]
  ,[1076, "バレンタイン・ライブ！/Live on Valentine's Day!/ばれんたいん・らいぶ！", false, "CP増加", "CP増加", "", "", "", 5, 200, 0, EQUIP.WATER|EQUIP.AETHER, 0, "ジブリール/マーナガルム", "", "", 2]
  ,[1077, "愛の牢獄/Prison of Love/あいのろうごく", false, "", "", "係留/束縛", "", "", 4, 200, 0, EQUIP.FIRE|EQUIP.WOOD|EQUIP.AETHER, 0, "ショロトル/ハクメン", "", ""]
  ,[1078, "鉄血のバージンロード/Blushing Beloved of Blood and Steel/てっけつのばーじんろーど", false, "", "HP回復/CP増加", "", "", "", 4, 300, 0, 0, EQUIP.MAGIC, "クロード/スノウ", "", ""]
  ,[1079, "再生のキャンバス/Can't Spell Heart Without Art/さいせいのきゃんばす", false, "", "CP増加/HP回復", "", "", "", 3, 0, 0, 0, EQUIP.SHOT|EQUIP.SNIPE|EQUIP.NONE, "リヒト/イツァムナー", "", ""]
  ,[1080, "神宿学園の食いしん坊番長/Shinjuku Academy's Chancellors of Chow/しんじゅくがくえんのくいしんぼうばんちょう", false, "滋養に特攻[1.4]/HP回復", "", "", "", "", 3, 150, 0, EQUIP.WOOD|EQUIP.NETHER, 0, "ベヒモス/リョウタ", "", ""]
  ,[1081, "黄金の実り/Golden Harvest/おうごんのみのり", false, "連撃", "HP回復", "", "", "", 5, 300, 0, 0, EQUIP.THRUST, "ヴォーロス/ゴエモン", "", ""]
  ,[1082, "お宝にはご用心/Eyes on the Prize/おたからにはごようじん", false, "CP増加", "", "", "", "", 5, 200, 0, 0, EQUIP.MAGIC|EQUIP.NONE, "アンドヴァリ/コタロウ", "", "", 2]
  ,[1083, "アタックオブザウォーターメロン/Attack of the Killer Watermelons/あたっくおぶざうぉーたーめろん", false, "", "", "HP減少", "", "", 4, 400, 0, EQUIP.FIRE|EQUIP.WOOD, 0, "チョウジ/ヴォーロス", "", ""]
  ,[1084, "Surf the wave/Surfing the Wave", false, "妨害に特攻[1.6]", "", "引き寄せ(1マス)", "", "", 4, 200, 0, 0, EQUIP.BLOW, "セト/ゴエモン", "", ""]
  ,[1085, "青春は君をおって/In the Flower of Youth/せいしゅんはきみをおって", false, "", "奮起", "", "", "", 5, 300, 0, EQUIP.FIRE|EQUIP.INFERNAL, 0, "ドゥルガー/グンゾウ", "", "", 2]
  ,[1086, "おいでよぼくらのもふもふ王国/Welcome to the Furry Kingdom!/おいでよぼくらのもふもふおうこく", false, "", "", "引き寄せ(1マス)/魅了", "", "", 5, 200, 0, 0, EQUIP.THRUST|EQUIP.MAGIC, "クニヨシ/カーシー", "", ""]
  ,[1087, "出会いは決定的に/Treasure Every Meeting/であいはけっていてきに", false, "怒時強化", "", "", "", "", 4, 400, 0, EQUIP.WATER|EQUIP.WOOD|EQUIP.NETHER, 0, "クニヨシ/ベンテン", "", "", 1]
  ,[1088, "寂しがりのプランクスター/The Lonely Prankster/さびしがりのぷらんくすたー", false, "CP増加/注目", "", "", "", "", 3, 100, 0, 0, EQUIP.BLOW, "アールプ/カーシー", "", ""]
  ,[1089, "夢のもふもふ大激突！/The Great Fluffy Clash of Dreams!/ゆめのもふもふだいげきとつ！", false, "獣の末裔に特攻[1.5]/獣皮を巻く者に特攻[1.5]/HP回復", "", "", "", "", 3, 300, 0, EQUIP.WOOD|EQUIP.NETHER, 0, "クニヨシ/アールプ", "", ""]
  ,[1090, "芸術は光と陰に/All in Art is Light and Dark/げいじゅつはひかりとかげに", false, "", "CP増加", "CP減少", "", "", 3, 150, 0, EQUIP.AETHER|EQUIP.NETHER, 0, "クニヨシ/リヒト", "", ""]
  ,[1091, "夏の島の夜の踊り/Nocturnal Dance/なつのしまのよるのおどり", false, "意気/HP回復", "意気/HP回復", "", "", "", 5, 250, 0, EQUIP.WORLD|EQUIP.ALLROUND, 0, "タンガロア/キジムナー", "", ""]
  ,[1092, "夢に見た力比べ/The Strength I dream of/ゆめにみたちからくらべ", false, "", "", "威圧", "", "", 5, 350, 0, 0, EQUIP.SLASH|EQUIP.NONE, "アステリオス/アスタロト", "", "", 2]
  ,[1093, "巨いなる供物/A Great Offering/おおいなるくもつ", false, "HP回復", "", "HP減少", "", "", 4, 100, 0, EQUIP.WOOD|EQUIP.INFERNAL|EQUIP.WORLD, 0, "タンガロア/ダゴン", "", ""]
  ,[1094, "お手柄！うみのこ探検隊/Accomplished Ocean Explorers/おてがら！うみのこたんけんたい", false, "特防[0.8]/加速時強化[AR]", "", "", "射撃", "", 3, 150, 0, 0, EQUIP.THRUST|EQUIP.MAGIC, "キジムナー/エイタ", "", ""]
  ,[1095, "宿命のグラップル！/Grapple With Destiny!/しゅくめいのぐらっぷる！", false, "回避に貫通/防御力が上昇する状態に貫通", "", "崩し", "", "", 5, 500, 0, 0, EQUIP.THRUST|EQUIP.BLOW, "アルスラーン/アヴァルガ", "", ""]
  ,[1096, "研究棟の夜は終わらず/Endless Night of Research/けんきゅうとうのよるはおわらず", false, "根性/HP減少", "", "", "", "", 5, 100, 0, EQUIP.WOOD|EQUIP.AETHER, 0, "レイヴ/ジャンバヴァン", "", ""]
  ,[1097, "餅つきと喧嘩はひとりで出来ぬ/Can't Fight or Make Rice Cakes Alone/もちつきとけんかはひとりでできぬ", false, "HP回復", "", "HP減少", "", "", 4, 300, 0, EQUIP.FIRE|EQUIP.AETHER, 0, "ケンゴ/オニワカ", "", ""]
  ,[1098, "ゲヘナの腸/The Bowels of Gehenna/げへなのはらわた", false, "HPが減少する弱体に特攻[1.2]", "", "猛毒", "", "", 4, 200, 0, EQUIP.NETHER|EQUIP.INFERNAL, 0, "ルキフゲ/バエル", "", ""]
  ,[1099, "そこにお世話のある限り！/As Long As Someone's There to Help!/そこにおせわのあるかぎり！", false, "", "HP回復/CP増加", "", "", "", 3, 0, 0, EQUIP.WATER|EQUIP.VALIANT|EQUIP.ALLROUND, 0, "ホロケウカムイ/トムテ", "", ""]
  ,[1100, "星よ！太陽よ！/O Stars! O Sun!/ほしよ！たいようよ！", false, "注目に特攻[1.4]/注目", "", "", "", "", 3, 300, 0, EQUIP.WORLD, EQUIP.THRUST|EQUIP.SHOT, "テスカトリポカ/オンブレティグレ", "", ""]
  ,[1101, "苦楽は汗と共に/Sweating Together, Through Good and Bad/くらくはあせとともに", true, "弱体解除(単)/HP回復", "", "", "", "", 5, 400, 0, 0, EQUIP.SLASH|EQUIP.LONGSLASH, "モリタカ/オルグス", "", ""]
  ,[1102, "最高のパフォーマンスを/The Ultimate Performance/さいこうのぱふぉーまんすを", true, "特防[0.6]", "根性", "", "全域", "", 5, 0, 0, EQUIP.WOOD, 0, "リョウタ/ソール", "", ""]
  ,[1103, "ある日の一幕/Snapshot of That Day/あるひのいちまく", true, "特防[0.8]", "", "強化解除(単)", "打撃/射撃", "", 4, 200, 0, 0, EQUIP.BLOW|EQUIP.SHOT|EQUIP.MAGIC, "ケンゴ/勇者", "", ""]
  ,[1104, "夏の海にはこれ一本！/This One's for the Summer Seas!/なつのうみにはこれいっぽん！", false, "HP回復/火傷耐性", "HP回復/火傷耐性", "", "", "火傷", 4, 0, 0, EQUIP.NETHER|EQUIP.INFERNAL, 0, "アンドヴァリ/スルト", "", ""]
  ,[1105, "バーサーカーズのクリスマス！/バーサーカーズのクリスマス！/ばーさーかーずのくりすます！", false, "クリティカル+/祝福に特攻[2.0]", "", "", "", "", 5, 400, 0, 0, EQUIP.THRUST|EQUIP.BLOW|EQUIP.SHOT, "バティム/ポルックス", "", ""]
  ,[1106, "サウナの作法！？/サウナの作法！？/さうなのさほう！？", false, "HP回復/弱体解除(単)", "弱体解除(単)", "", "", "", 5, 200, 0, 0, EQUIP.BLOW|EQUIP.NONE, "フェンリル/シトリー", "", ""]
  ,[1107, "池袋クリスマス・場外乱闘！/池袋クリスマス・場外乱闘！/いけぶくろくりすます・じょうがいらんとう！", false, "", "", "HP減少", "", "", 4, 400, 0, EQUIP.WATER, EQUIP.SLASH|EQUIP.SNIPE, "スノウ/メリュジーヌ", "", ""]
  ,[1108, "親父さん見てる！？/親父さん見てる！？/おやじさんみてる！？", false, "", "激怒+/CP増加", "", "", "", 4, 0, 0, EQUIP.FIRE|EQUIP.NETHER, 0, "バティム/シトリー", "", ""]
  ,[1109, "骨董市の品定め/Shopping at the Antique Market/こっとういちのしなさだめ", false, "", "CS封印/次ターン強化/攻撃力増加[次ターン]", "", "", "", 5, 0, 0, EQUIP.WOOD|EQUIP.NETHER, 0, "フルフミ/リヒト", "", ""]
  ,[1110, "金魚すくいレクチャー！/A Lesson in Goldfish Scooping/きんぎょすくいれくちゃー！", false, "攻撃力増加[ターン毎減少]", "", "", "", "", 5, 300, 0, EQUIP.WATER, 0, "リョウタ/リチョウ/ケットシー", "", "", 2]
  ,[1111, "祭りの日の出会い/An Encounter at the Festival/まつりのひのであい", false, "閃き", "CP増加", "", "", "", 4, 100, 0, EQUIP.FIRE|EQUIP.WOOD|EQUIP.AETHER, 0, "リチョウ/フルフミ", "", ""]
  ,[1112, "同盟者からのサプライズ/A Surprise from a Comrade/どうめいしゃからのさぷらいず", false, "暗闇に特攻[1.6]/スキル発動率大増", "", "", "", "", 4, 200, 0, EQUIP.INFERNAL|EQUIP.VALIANT|EQUIP.WORLD, 0, "テスカトリポカ/バロール", "", ""]
  ,[1113, "悪魔式ティータイム/A Devilish Teatime/あくましきてぃーたいむ", false, "毒/再生", "毒/再生", "毒/再生", "", "", 5, 200, 0, EQUIP.AETHER|EQUIP.NETHER|EQUIP.INFERNAL, 0, "アスタロト/バエル", "", ""]
  ,[1114, "がんばれ貧乏探偵！/Hang In There, Poor Detective!/がんばれびんぼうたんてい！", false, "スキル発動率増加", "回避", "", "", "", 5, 300, 0, EQUIP.FIRE|EQUIP.AETHER, 0, "ジブリール/ノーマッド", "", ""]
  ,[1115, "ファンクラブの友たち/Friends in the Fan Club/ふぁんくらぶのともたち", false, "", "CP増加/意気", "", "", "", 4, 400, 0, 0, EQUIP.SLASH|EQUIP.BLOW|EQUIP.LONGSLASH, "カルキ/マーナガルム", "", ""]
  ,[1116, "六本木のフィクサーたち/Fixers of Roppongi/ろっぽんぎのふぃくさーたち", false, "移動不能になる状態に特攻[1.3]", "", "", "", "不動", 4, 200, 0, 0, EQUIP.SLASH|EQUIP.SHOT, "ハクメン/ツァトグァ", "", ""]
  ,[1117, "汝、何処へ行き給う/Where are you going?/なんじ、いずこへいきたまう", false, "弱体解除(単)/HP回復", "", "", "", "", 5, 100, 0, EQUIP.AETHER|EQUIP.NETHER, 0, "マリア/アザゼル", "", ""]
  ,[1118, "雪解けの甘くとろけたる/A Melting Snow-like Delight/ゆきどけのあまくとろけたる", false, "被回復増加", "被回復増加/HP回復", "", "", "", 5, 250, 0, EQUIP.VALIANT|EQUIP.ALLROUND, 0, "ホロケウカムイ/キムンカムイ", "", ""]
  ,[1119, "聖者の休息/A Break for a Saint/せいじゃのきゅうそく", true, "", "HP回復", "武器種変更：無", "", "", 4, 300, 0, 0, EQUIP.MAGIC|EQUIP.THRUST, "ソール/キムンカムイ", "", ""]
  ,[1120, "我が盟友の為ならば/For My Sworn Friend/わがめいゆうのためならば", false, "熱情に特攻[1.6]", "CP増加", "", "", "", 4, 150, 0, 0, EQUIP.SLASH|EQUIP.SHOT, "アイゼン/カルキ", "", ""]
  ,[1121, "衣装の心得/Tips on Clothing/いしょうのこころえ", false, "魅了耐性/魅了に特攻[2.0]", "", "", "", "魅了", 5, 300, 0, 0, EQUIP.BLOW|EQUIP.SHOT|EQUIP.NONE, "アラクネ/カトブレパス", "", ""]
  ,[1122, "ようこそ、夜の宝石たち/Welcome, Gems of the Night/ようこそ、よるのほうせきたち", false, "", "", "引き寄せ(1マス)", "", "", 4, 200, 0, EQUIP.AETHER|EQUIP.INFERNAL, 0, "ツクヨミ/スズカ", "", "", 1]
  ,[1123, "腹の底から高らかに/Hearty Singing/はらのそこからたからかに", false, "回避に貫通/HP回復", "HP回復", "", "", "", 4, 300, 0, 0, EQUIP.BLOW|EQUIP.SLASH|EQUIP.LONGSLASH, "アラクネ/スズカ", "", ""]
  ,[1124, "サマータイム・シャワー/Summertime Shower/さまーたいむ・しゃわー", false, "注目/熱情に特攻[1.4]", "", "", "", "", 3, 0, 0, 0, EQUIP.BLOW|EQUIP.THRUST, "ワカン・タンカ/ザバーニーヤ", "", ""]
  ,[1125, "我ら拳と魔眼を交え/A Fight of Fists and Evil Eyes/われらこぶしとまがんをまじえ", false, "攻撃力増加[装備者CP]", "", "", "", "", 5, 400, 0, 0, EQUIP.BLOW|EQUIP.THRUST, "シヴァ/バロール", "", "", 2]
  ,[1126, "FUWAMOCO☆マジックショー！/Fluffy and Furry ☆ Magic Show!/FUWAMOCO☆まじっくしょー！", false, "", "弱体無効", "混乱/HP減少", "", "", 5, 100, 0, EQUIP.INFERNAL|EQUIP.WOOD|EQUIP.WORLD, 0, "テスカトリポカ/ケットシー", "", ""]
  ,[1127, "モノクロームシンドローム/Monochrome Syndrome/ものくろーむしんどろーむ", false, "烙印に特攻[1.3]", "", "烙印", "", "", 4, 300, 0, EQUIP.FIRE|EQUIP.NETHER|EQUIP.NULL, 0, "アルク/キリト", "", ""]
  ,[1128, "無骨な漢の贈り物/A Present from an Uncouth Fellow/ぶこつなおとこのおくりもの", false, "攻撃強化", "", "", "", "束縛", 4, 0, 0, EQUIP.WATER|EQUIP.VALIANT|EQUIP.FIRE, 0, "シヴァ/ヘラクレス", "", ""]
  ,[1129, "あのサークルへ急げ！/Let's Check Out that Booth!/あのさーくるへいそげ！", false, "意気", "", "", "", "恐怖", 3, 200, 0, EQUIP.WOOD|EQUIP.NETHER|EQUIP.WORLD, 0, "クニヨシ/ヘカテー", "", ""]
  ,[1130, "大宇宙おいかけっこ/Wild-Space Chase/だいうちゅうおいかけっこ", false, "極限", "極限", "", "", "", 5, 500, 0, 0, EQUIP.SLASH|EQUIP.LONGSLASH, "ニャルラトテプ/クトゥグァ", "", "", 2]
  ,[1131, "ドキドキ実験開始！/The Experiment Begins!/どきどきじっけんかいし！", false, "集中時強化[実験AR]", "集中時強化[実験AR]/集中", "", "", "", 5, 300, 0, EQUIP.VALIANT|EQUIP.WOOD, 0, "クロガネ/ノーマッド", "", ""]
  ,[1132, "パイロットトレーニング/Pilot Training/ぱいろっととれーにんぐ", false, "HP回復", "", "妨害", "", "", 4, 200, 0, EQUIP.WATER|EQUIP.FIRE|EQUIP.INFERNAL, 0, "ブレイク/クトゥグァ", "", ""]
  ,[1133, "ドリームランドへようこそ/Welcome to the Dreamlands!/どりーむらんどへようこそ", false, "", "", "発狂", "", "発狂", 4, 300, 0, 0, EQUIP.BLOW|EQUIP.SHOT|EQUIP.SNIPE, "アザトース/ノーデンス", "", ""]
  ,[1134, "D計画の少年たち/The Plan D Youth/Dけいかくのしょうねんたち", false, "妨害時強化", "祝福/妨害時強化", "", "", "", 4, 0, 0, 0, EQUIP.SHOT|EQUIP.MAGIC|EQUIP.SNIPE, "R-19/デュオ", "", ""]
  ,[1135, "胸騒ぎの旧校舎/胸騒ぎの旧校舎/むなさわぎのきゅうこうしゃ", false, "熱情時強化[AR]", "熱情/熱情時強化[AR]", "", "", "", 5, 300, 0, EQUIP.FIRE|EQUIP.AETHER, 0, "リョウタ/フルフミ", "", ""]
  ,[1136, "ウェルカムトゥサイバースペース/ウェルカムトゥサイバースペース/うぇるかむとぅさいばーすぺーす", false, "弱体無効/特防[0.6]", "弱体無効", "", "全域", "", 5, 250, 0, 0, EQUIP.SLASH|EQUIP.MAGIC|EQUIP.NONE, "ティンダロス/エニグマ", "", ""]
  ,[1137, "パジャマパーティ・ランウェイ/パジャマパーティ・ランウェイ/ぱじゃまぱーてぃ・らんうぇい", false, "HP回復", "集中時強化[パジャマAR]", "", "", "", 4, 150, 0, 0, EQUIP.THRUST|EQUIP.SHOT|EQUIP.SNIPE, "ドゥルガー/アラクネ", "", ""]
  ,[1138, "狩猟式トレイルランニング/狩猟式トレイルランニング/しゅりょうしきとれいるらんにんぐ", false, "CP増加/崩しに特攻[1.2]", "", "", "", "", 3, 200, 0, EQUIP.WOOD|EQUIP.AETHER|EQUIP.ALLROUND, 0, "イシュバランケー/ヤマサチヒコ", "", ""]
  ,[1139, "炎天下のレッスルウォー/炎天下のレッスルウォー/えんてんかのれっするうぉー", false, "特防[0.8]", "", "HP減少", "打撃", "", 3, 300, 0, 0, EQUIP.BLOW|EQUIP.THRUST|EQUIP.LONGSLASH, "アヴァルガ/ジュウゴ", "", ""]
  ,[1140, "カウボーイ・レッスン/カウボーイ・レッスン/かうぼーい・れっすん", false, "係留", "係留/根性", "", "", "", 3, 150, 0, EQUIP.WATER|EQUIP.INFERNAL|EQUIP.NETHER, 0, "ヴァプラ/ベイブ・バニヤン", "", ""]
  ,[1141, "カーテンコールをもう一度！/カーテンコールをもう一度！/かーてんこーるをもういちど！", false, "祝福時強化[AR]", "祝福時強化[AR]/HP回復", "", "", "", 5, 250, 0, 0, EQUIP.SHOT|EQUIP.LONGSLASH|EQUIP.NONE, "レイヴ/ブギーマン", "", ""]
  ,[1142, "探究者たちのステージ/探究者たちのステージ/たんきゅうしゃたちのすてーじ", false, "頑強", "奮起", "", "", "", 4, 200, 0, 0, EQUIP.SLASH|EQUIP.MAGIC, "マクロイヒ/レイヴ/ヘカテー", "", ""]
  ,[1143, "放課後チョコレートマジック/放課後チョコレートマジック/ほうかごちょこれーとまじっく", false, "聖油", "HP回復", "", "", "", 4, 100, 0, EQUIP.AETHER|EQUIP.NETHER|EQUIP.ALLROUND, 0, "ブギーマン/シュクユウ", "", ""]
  ,[1144, "限り無き大決戦！/限り無き大決戦！/かぎりなきだいけっせん！", false, "", "", "烙印", "", "", 5, 400, 0, EQUIP.INFERNAL|EQUIP.VALIANT|EQUIP.WORLD, 0, "マクロイヒ/シパクトリ", "", "", 2]
  ,[1145, "上級生のおもてなし/上級生のおもてなし/じょうきゅうせいのおもてなし", false, "魅了に特攻[2.0]/回避", "", "", "", "", 5, 250, 0, EQUIP.VALIANT|EQUIP.INFERNAL|EQUIP.AETHER, 0, "アルジャーノン/ツクヨミ", "", ""]
  ,[1146, "真夏の浜辺の大闘争！/真夏の浜辺の大闘争！/まなつのはまべのだいとうそう！", false, "奮起時強化", "奮起時強化/奮起", "", "", "", 5, 400, 0, EQUIP.FIRE|EQUIP.WOOD|EQUIP.WATER, 0, "テスカトリポカ/オンブレティグレ", "", ""]
  ,[1147, "君と喜びの舞を/君と喜びの舞を/きみとよろこびのまいを", false, "回避に貫通", "HP回復", "", "", "", 4, 200, 0, 0, EQUIP.MAGIC|EQUIP.SNIPE|EQUIP.BLOW|EQUIP.SHOT, "オトヒメ/ヤマサチヒコ", "", ""]
  ,[1148, "家族の事が知りたくて/家族の事が知りたくて/かぞくのことがしりたくて", false, "閃き時強化[AR]", "", "", "", "マヒ", 4, 250, 0, 0, EQUIP.THRUST|EQUIP.MAGIC, "クロガネ/ヘパイストス", "", ""]
  ,[1149, "グリーンマジック/Green Magic/ぐりーんまじっく", false, "特防[0.7]/CP増加", "", "", "魔法", "", 4, 100, 0, 0, EQUIP.THRUST|EQUIP.SHOT|EQUIP.LONGSLASH, "シンノウ/ヴォーロス", "", ""]
]);
