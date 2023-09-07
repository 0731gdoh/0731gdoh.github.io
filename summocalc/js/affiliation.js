"use strict";

function Affiliation(index, name, value){
  this.index = index;
  this.name = name;
  this.value = value;
}
Affiliation.prototype = {
  toString: function(){
    return t(this.name);
  },
  getValue: function(){
    return this.value;
  }
};
Affiliation.createList = function(a){
  var table = new Map();
  var order = [[], []];
  var k = [];
  var selectable = 0;
  var exists = 0;
  var result = a.map(function(x, i){
    var v = 1 << i;
    var key = "";
    x = x.replace(/<([^>]+)>/g, function(match, p1){
      key += p1;
      return p1;
    });
    table.set(key || t(x, 0), v);
    if(x[0] === "("){
      selectable = selectable | v;
    }else{
      order[0].push(i);
      order[1].push(i);
      if(x[0] !== "？") exists = exists | v;
    }
    k.push(t(x, 1));
    return new Affiliation(i, x, v);
  });
  order[1].sort(function(a, b){
    return k[a] < k[b] ? -1 : 1;
  });
  result.table = table;
  result.selectable = selectable;
  result.exists = exists;
  result.ORDER = order;
  return result;
};

var GUILD = Affiliation.createList(
  ["アウトローズ/Outlaws"
  ,"インベイダーズ/Invaders"
  ,"ウォーモンガーズ/Warmongers"
  ,"エージェンツ/Agents"
  ,"エンタティナーズ/Entertainers"
  ,"クラフターズ/Crafters"
  ,"クリエイターズ/Creators"
  ,"ゲームマスターズ/Game Masters"
  ,"サモナーズ/Summoners"
  ,"ジェノサイダーズ/Genociders"
  ,"タイクーンズ/Tycoons"
  ,"タオシーズ/Gurus"
  ,"バーサーカーズ/Berserkers"
  ,"ビーストテイマーズ/Beast Tamers"
  ,"ミッショネルズ/Missionaries"
  ,"ルールメイカーズ/Rule Makers"
  ,"ワイズメン/The Wisemen"
  ,"ワンダラーズ/Wanderers"
  ,"？？？"
  ,"？？？？？"
  ,"？？？？？？"
  ,"？？？？？？？"
  ,"？？？？？？？？"
  ,"(設定可)/(Selectable)"
]);

var SCHOOL = Affiliation.createList(
  ["<秋波原>学園/Akihabara Academy"
  ,"<飢野>学園/Ueno Academy"
  ,"<得真道>学園/Umamichi Academy"
  ,"<王子坊>学園/Ojimachi Academy"
  ,"学園<軍獄>？/Penitentia Academy?"
  ,"<歌舞輝蝶>学園/Kabukicho Academy"
  ,"<窯多>工業高等専門学校/Kamata Technical Academy"
  ,"<鬼王>警察学校/Kiou Police Academy"
  ,"<究段>武道学園"
  ,"<神宿>学園/Shinjuku Academy"
  ,"<水道帳>商業学校"
  ,"<世耕>農業・林業学園"
  ,"<代神山>学園/Daikanyama Academy"
  ,"東京<サンタ>スクール/Tokyo Santa School"
  ,"東京<消防>大学"
  ,"<東都>学園/Togo Academy"
  ,"<豊舟>海洋学園/Toyosu Marine Academy"
  ,"<中迦野>芸能学園"
  ,"<武玄>学園/Bukuro Academy"
  ,"<不死見>学園/Fujimi Academy"
  ,"<依々祇>学園/Yoyogi Academy"
  ,"<六本城>学園/Roppongi Academy"
  ,"？？？"
]);

var TEAM = Affiliation.createList(
  ["神宿<ワン>ダーフォー<ゲル>部/Shinjuku Academy Mountaineers"
  ,"<バズ>ル<ドリ>ーマーズ/Viral Influence"
  ,"八犬士/Eight Dog Warriors"
]);

function splitAffiliationNames(aff, s){
  if(!s) return 0;
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

function splitTeamNames(s){
  return splitAffiliationNames(TEAM, s);
}
