"use strict";

function Variant(index, x){
  this.index = index;
  this.name = x[0];
  this.keyword = x[2] ? "" : x[1] || "";
  this.value = x[2] || 0;
}
Variant.prototype = {
  toString: function(){
    if(!this.name) return "－";
    if(this.keyword.indexOf("/") === -1) return t(this.name);
    return t(this.name) + t("(/ (") + t(this.keyword).slice(0, -2) + ")";
  },
  getValue: function(){
    return this.value;
  }
};

Variant.createList = function(a){
  var result = [];
  var labels = [];
  var order = [];
  a.forEach(function(v){
    if(Array.isArray(v)){
      var i = result.length;
      result.push(new Variant(i, v));
      if(i) order.push(i);
    }else{
      labels.push(v);
      order.push(0);
    }
  });
  result.ORDER = order;
  result.LABELS = labels;
  return result;
};

var VARIANT = Variant.createList(
  [[""]
  ,"イベントカテゴリ/Event Category"
  ,["バレンタイン/Valentine", "バレ"]
  ,["臨海学校/Seaside School", "臨海"]
  ,["ハロウィン/Halloween", "ハロ"]
  ,["秘島/Lost Isle", "秘島"]
  ,["クリスマス/Christmas", "聖夜"]
  ,["本編/Main Story", "Ch."]
  ,"2017"
  ,["バレンタインパニック！/Valentine Panic!", "バレ17/Valentine17"]
  ,["出航！真夏の海洋冒険/Embark! Summer Ocean Adventure", "海洋17/Ocean17"]
  ,["キミと真夏の臨海学校/Seaside Summer School with You", "臨海17/Seaside17"]
  ,["ハロウィンなんてこわくない！/I Ain't Scared a No Halloween!", "ハロ17/Halloween17"]
  ,["GoGo！秘島探険隊/Raiders of the Lost Isle", "秘島17/Island17"]
  ,["誕生！聖夜のNEWヒーロー？/The New Champion of Christmas", "聖夜17/Xmas17"]
  ,"2018"
  ,["バレンタイン・ジェイル！/Valentine Jail!", "バレ18/Valentine18"]
  ,["遥かなるジャンダルム/O' the Great Gendarme", "山18/Gendarme18"]
  ,["仁義なき夏祭大抗争！/Clash of Floats!", "夏祭18/Festival18"]
  ,["デザート☆ジャーニー/Desert Journey", "砂旅18/Journey18"]
  ,["開帆！黄金の宝船/Unfurl the Sails! A Golden Treasure Ship", "宝船18/T.Ship18"]
  ,["池袋クリスマス競争曲/Battle of the Bells! An Ikebukuro Christmas", "聖夜18/Xmas18"]
  ,"2019"
  ,["鬼は内！？失恋大工の建築記/In with the Ogres! Carpentry of the Heart", "節分19/Setsubun19"]
  ,["バレンタインフェスタ！/Valentine's Extravaganza!", "バレ19/Valentine19"]
  ,["上野もふもふ夢王国！/A Fluffy Nightmare in Ueno!", "夢19/Nightmare19"]
  ,["渚のファッショニスタ/Seaside Fashionista", "渚19/Fashionista19"]
  ,["ガチ儲け！海の家と黄金洞窟/Make a Killing! The Beach House and Andvari Falls", "海家19/Beach19"]
  ,["招来！ハロウィン暴走夜/Trick or Treat! Jiangshi Night", "ハロ19/Halloween19"]
  ,["約束の海底都市/Canaan - The Promised Land", "カナーン19/Canaan19"]
  ,["ミスティック・クリスマス！/Mystic Christmas", "聖夜19/Xmas19"]
  ,"2020"
  ,["バレンタイン・タイムスリップ！/Valentine's Time Warp!", "バレ20/Valentine20"]
  ,["進め！温泉野営大会/Let's Go! Hot Spring Jamboree", "野営20/Jamboree20"]
  ,["バーチャルサマー・メモリー/Virtual Summer Memories", "竜宮20/Virtual20"]
  ,["ニャンと！福祭の幻世奇術/Me-ow! Happy Illusion! The Festival of Magic Hijinks", "福祭20/Illusion20"]
  ,["サンシャイン・クリスマス/Sunshine Christmas", "聖夜20/Xmas20"]
  ,"2021"
  ,["バレンタイン・コロッセオ/Battle of the Valentines", "バレ21/Valentine21"]
  ,["星空の転光機兵隊/Nightglows of the Starlit Sky", "星空21/Nightglows21"]
  ,["サマーリバー・アドベンチャー", "川21/River21"]
  ,["摩訶不思議！？地獄の極楽温泉郷！/A Mystery Most Profound! Hell's Hot Paradise!", "地獄21/Onsen21"]
  ,["特別警戒！ハロウィン警察隊", "ハロ21/Halloween21"]
  ,["クリスマス・ショーダウン", "聖夜21/Xmas21"]
  ,"2022"
  ,["バレンタイン・ファンタジー/Valentine Fantasy", "バレ22/Valentine22"]
  ,["本編第13章/Main Story Chapter 13", "13章22/Ch.1322"]
  ,["サマープール・トワイライト", "プール22/Pool22"]
  ,["アキバ・アンド・ドラゴンズ！", "浜辺22/Dynamis22"]
  ,["歌舞伎町ナイトフェスティバル", "夜祭22/NightFest22"]
  ,["聖夜に輝くギャングスター", "聖夜22/Xmas22"]
  ,"2023"
  ,["バレンタイン・スノーファイト/Valentine's Snowball Fight", "バレ23/Valentine23"]
  ,["ジュラシック・サマーバカンス", "ジュラ23/Jurassic23"]
  ,["マリンリゾート・クライシス！", "臨海23/Seaside23"]
  ,["オオエド・クリスマス", "聖夜23/Xmas23"]
  ,"2024"
  ,["バレンタイン・クロスロード", "バレ24/Valentine24"]
  ,["本編第15章/Main Story Chapter 15", "15章24/Ch.1524"]
  ,["ファビュラス・サマーホスト", "ホスト24/Host24"]
  ,["トップオブ・サマーマウンテンズ！", "夏山24/Mountain24"]
  ,"スロット/Slot"
  ,["[1枚目]/[1st Variant]", , 1]
  ,["[2枚目]/[2nd Variant]", , 2]
  ,["[3枚目]/[3rd Variant]", , 3]
  ,["[4枚目]/[4th Variant]", , 4]
]);
