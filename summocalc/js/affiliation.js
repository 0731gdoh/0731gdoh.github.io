function Affiliation(index, name, value){
  this.index = index;
  this.name = name;
  this.value = value;
}
Affiliation.prototype = {
  toString: function(){
    return t(this.name) || "－－－－－－－－－－－－－";
  },
  getValue: function(){
    return this.value;
  }
};
Affiliation.createList = function(a){
  var table = new Map();
  var order = [[], []];
  var k = [];
  var result = a.map(function(x, i){
    var v = i ? 1 << (i - 1) : 0;
    table.set(t(x, 0), v);
    order[0].push(i);
    order[1].push(i);
    k.push(t(x, 1));
    return new Affiliation(i, x, v);
  });
  order[1].sort(function(a, b){
    if(a * b) return k[a] < k[b] ? -1 : 1;
    return a - b;
  });
  result.table = table;
  result.ORDER = order;
  return result;
};

var GUILD = Affiliation.createList(
  [""
  ,"アウトローズ/Outlaws"
  ,"インベイダーズ/Invaders"
  ,"ウォーモンガーズ/Warmongers"
  ,"エージェンツ/Agents"
  ,"エンタティナーズ/Entertainers"
  ,"クラフターズ/Crafters"
  ,"クリエイターズ"
  ,"ゲームマスターズ/Game Masters"
  ,"サモナーズ/Summoners"
  ,"ジェノサイダーズ/Genociders"
  ,"タイクーンズ/Tycoons"
  ,"タオシーズ/Gurus"
  ,"バーサーカーズ/Berserkers"
  ,"ビーストテイマーズ/Beast Tamers"
  ,"ミッショネルズ/Missionaries"
  ,"ルールメイカーズ/Rule Makers"
  ,"ワイズメン/Wisemen"
  ,"？？？"
  ,"？？？？？"
  ,"？？？？？？"
  ,"？？？？？？？"
]);

var SCHOOL = Affiliation.createList(
  [""
  ,"秋波原学園/Akihabara Academy"
  ,"飢野学園/Ueno Academy"
  ,"得真道学園/Umamichi Academy"
  ,"王子坊学園/Ojimachi Academy"
  ,"学園軍獄？/Penitentia Academy?"
  ,"歌舞輝蝶学園/Kabukicho Academy"
  ,"窯多工業高等専門学校/Kamata Technical Academy"
  ,"鬼王警察学校/Kiou Police Academy"
  ,"神宿学園/Shinjuku Academy"
  ,"代神山学園/Daikanyama Academy"
  ,"東京サンタスクール/Tokyo Santa School"
  ,"東都学園"
  ,"豊舟海洋学園/Toyosu Marine Academy"
  ,"中迦野芸能学園"
  ,"武玄学園/Bukuro Academy"
  ,"不死見学園/Fujimi Academy"
  ,"依々祇学園/Yoyogi Academy"
  ,"六本城学園/Roppongi Academy"
  ,"？？？"
]);

function splitAffiliationNames(aff, s){
  return s.split("/").reduce(function(acc, cur){
    if(!aff.table.has(cur)) throw new Error("所属「" + cur + "」は未登録です\n（" + s + "）");
    return acc | aff.table.get(cur);
  }, 0);
}

function splitGuildNames(s){
  return splitAffiliationNames(GUILD, s);
}

function splitSchoolNames(s){
  return splitAffiliationNames(SCHOOL, s);
}

function affs2array(list, n, lang){
  var i = 1;
  var r = [];
  while(n){
    if(n & 1) r.push(t(list[i].name, lang));
    i++;
    n = n >> 1;
  }
  return r;
}
