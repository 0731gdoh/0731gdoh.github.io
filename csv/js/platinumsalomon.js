"use strict";

const attr = ["", "全", "火", "水", "木", "天", "冥", "魔", "英雄", "世界", "無限", "零", "-"];
const weapon = ["", "斬撃", "突撃", "打撃", "射撃", "魔法", "狙撃", "横一文字", "全域", "無", "-"]

const build = (list) => {
  let i = 0;
  for(const row of list){
    row[0] = attr[row[0] || attr.length - 1];
    row[1] = weapon[row[1] || weapon.length - 1];
    row.push({value: false});
    row.unshift(++i + "");
  }
  list.unshift(["#", "属性", "武器", "名前", "所持"]);
  return list;
};

const data = build(
  [[6, 5, "シロウ"]
  ,[5, 3, "ケンゴ"]
  ,[4, 5, "リョウタ"]
  ,[3, 1, "トウジ"]
  ,[2, 2, "ハヌマン"]
  ,[6, 5, "マリア"]
  ,[1, 5, "クリスティーヌ"]
  ,[3, 1, "モリタカ"]
  ,[3, 2, "フェンリル"]
  ,[3, 5, "アシガラ"]
  ,[5, 2, "アステリオス"]
  ,[3, 1, "ゴウリョウ"]
  ,[4, 2, "イクトシ"]
  ,[5, 4, "シンヤ"]
  ,[6, 2, "ケンタ"]
  ,[3, 2, "エイタ"]
  ,[2, 5, "チョウジ"]
  ,[2, 2, "ジュウゴ"]
  ,[2, 3, "マガン"]
  ,[4, 4, "テムジン"]
  ,[6, 2, "ガルム"]
  ,[3, 2, "マカラ"]
  ,[5, 5, "アザゼル"]
  ,[4, 5, "カーシー"]
  ,[2, 2, "グンゾウ"]
  ,[2, 1, "マルコシアス"]
  ,[4, 2, "ノブハル"]
  ,[2, 4, "キュウマ"]
  ,[2, 2, "カグツチ"]
  ,[5, 4, "R-19"]
  ,[6, 5, "アリス"]
  ,[5, 5, "ジャンバヴァン"]
  ,[6, 4, "ルキフゲ"]
  ,[3, 3, "マーナガルム"]
  ,[6, 5, "バーゲスト"]
  ,[6, 2, "バティム"]
  ,[4, 5, "クニヨシ"]
  ,[2, 2, "モトスミ"]
  ,[5, 1, "カルキ"]
  ,[2, 2, "ノーマッド"]
  ,[3, 5, "ガンダルヴァ"]
  ,[4, 5, "ニャルラトテプ"]
  ,[3, 2, "シュテン"]
  ,[5, 3, "ポルックス"]
  ,[4, 2, "タウラスマスク"]
  ,[3, 4, "ジライヤ"]
  ,[6, 2, "アンドヴァリ"]
//  ,[3, 2, "ヨウル"]
  ,[2, 4, "イバラキ"]
  ,[3, 3, "ホロケウカムイ"]
  ,[5, 2, "タローマティ"]
//  ,[2, 4, "シトリー"]
  ,[4, 1, "ホウゲン"]
//  ,[4, 2, "ザオウ"]
  ,[3, 4, "メリュジーヌ"]
  ,[4, 3, "アルスラーン"]
  ,[2, 4, "イフリート"]
  ,[2, 1, "ハクメン"]
//  ,[3, 5, "ベンテン"]
  ,[3, 5, "テュポーン"]
  ,[4, 4, "ショロトル"]
  ,[2, 5, "タダトモ"]
  ,[4, 4, "ヴォーロス"]
//  ,[4, 3, "キジムナー"]
  ,[6, 4, "ロビンソン"]
  ,[6, 1, "クランプス"]
//  ,[3, 4, "アギョウ"]
  ,[5, 4, "サンダーバード"]
  ,[1, 1, "ムサシ"]
  ,[2, 3, "アマツマラ"]
  ,[7, 2, "ドゥルガー"]
  ,[6, 1, "テツギュウ"]
  ,[4, 5, "シュウイチ"]
  ,[5, 7, "スズカ"]
  ,[4, 5, "ギョウブ"]
  ,[8, 5, "セト"]
  ,[3, 6, "エビス"]
  ,[2, 6, "アルク"]
  ,[9, 6, "アザトース"]
//  ,[8, 1, "グリンブルスティ"]
  ,[6, 1, "ベヒモス"]
  ,[5, 5, "ジズ"]
  ,[3, 5, "ミネアキ"]
  ,[6, 1, "テツヤ"]
  ,[3, 1, "ブレイク"]
  ,[4, 2, "アヴァルガ"]
  ,[8, 2, "アルジャーノン"]
  ,[6, 6, "オセ"]
  ,[4, 5, "オズ"]
  ,[6, 2, "アールプ"]
  ,[4, 9, "フルフミ"]
  ,[4, 2, "オンブレティグレ"]
//  ,[7, 6, "アラクネ"]
  ,[2, 5, "ゴエモン"]
  ,[5, 5, "リチョウ"]
//  ,[5, 9, "アスタロト"]
  ,[1, 9, "トムテ"]
  ,[8, 2, "シンノウ"]
  ,[4, 7, "ヤスヨリ"]
  ,[4, 3, "エーコー"]
  ,[3, 9, "リャナンシー"]
  ,[8, 4, "タネトモ"]
  ,[8, 6, "ティダ"]
  ,[8, 3, "バロール"]
  ,[4, 3, "ナタ"]
  ,[2, 2, "キムンカムイ"]
  ,[3, 6, "オトヒメ"]
  ,[6, 5, "ケットシー"]
  ,[2, 2, "トヴァシュトリ"]
  ,[8, 6, "マルドゥック"]
  ,[9, 2, "バートロ"]
  ,[2, 9, "イツァムナー"]
  ,[9, 7, "マクロイヒ"]
  ,[7, 5, "メフィストフェレス"]
  ,[3, 4, "ベイブ・バニヤン"]
  ,[7, 3, "マサノリ"]
  ,[5, 1, "クルースニク"]
  ,[5, 3, "ノーデンス"]
  ,[4, 4, "カトブレパス"]
  ,[9, 9, "スモーキーゴッド"]
  ,[1, 5, "シュクユウ"]
  ,[3, 2, "サルタヒコ"]
  ,[5, 6, "ホテイ"]
  ,[3, 5, "ヘルメス"]
  ,[6, 1, "ブギーマン"]
  ,[2, 2, "バロン"]
  ,[6, 1, "エニグマ"]
  ,[6, 5, "ヘカテー"]
  ,[6, 9, "ヨシトウ"]
  ,[5, 3, "タイシャクテン"]
  ,[9, 9, "∀アイザック"]
  ,[6, 4, "ヴァプラ"]
  ,[11, 5, "スフィンクス"]
  ,[0, 0, "犬どもの戦場"]
  ,[0, 0, "ミッションコンプリート"]
  ,[0, 0, "計り知れざる永劫の"]
  ,[0, 0, "先輩と後輩の時間"]
  ,[0, 0, "従者並びて"]
  ,[0, 0, "シューティングスターズ"]
  ,[0, 0, "幼馴染の流儀"]
  ,[0, 0, "魔王の温泉郷へようこそ"]
  ,[0, 0, "大江山の鬼たち"]
  ,[0, 0, "新宿ポリスアカデミー"]
  ,[0, 0, "サン・アンド・オイル！"]
  ,[0, 0, "同じ月が見ている"]
  ,[0, 0, "夕暮れ時の青春は"]
  ,[0, 0, "ショコラは深淵より来たり"]
  ,[0, 0, "硬派を気取ったあの頃は"]
  ,[0, 0, "サバイバルリゾート"]
  ,[0, 0, "剣豪と刀鍛冶の攻防"]
  ,[0, 0, "いつかどうして夢の鬼"]
  ,[0, 0, "剣の道は尚遙か"]
  ,[0, 0, "歓楽の鬼"]
  ,[0, 0, "きょうだい弟子の組手"]
  ,[0, 0, "ワンダーフォーゲル！"]
  ,[0, 0, "制御できるならやってみろ！"]
  ,[0, 0, "今月の得真道学園"]
  ,[0, 0, "ウマミチカンフージェネレーション"]
  ,[0, 0, "浅草ダウンタウンボーイズ"]
  ,[0, 0, "昼休みの購買部闘争！"]
  ,[0, 0, "浅草の愚連隊"]
  ,[0, 0, "フィスト・ファイト！"]
  ,[0, 0, "愛の牢獄"]
  ,[0, 0, "鉄血のバージンロード"]
  ,[0, 0, "アタックオブザウォーターメロン"]
  ,[0, 0, "Surf the wave"]
  ,[0, 0, "出会いは決定的に"]
  ,[0, 0, "巨いなる供物"]
  ,[0, 0, "餅つきと喧嘩はひとりで出来ぬ"]
  ,[0, 0, "ゲヘナの腸"]
  ,[0, 0, "夏の海にはこれ一本！"]
  ,[0, 0, "池袋クリスマス・場外乱闘！"]
  ,[0, 0, "親父さん見てる！？"]
  ,[0, 0, "祭りの日の出会い"]
  ,[0, 0, "同盟者からのサプライズ"]
  ,[0, 0, "ファンクラブの友たち"]
  ,[0, 0, "六本木のフィクサーたち"]
  ,[0, 0, "我が盟友の為ならば"]
  ,[0, 0, "ようこそ、夜の宝石たち"]
  ,[0, 0, "腹の底から高らかに"]
]);

const b64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

const save = () => {
  const result = [];
  let header = true;
  let i = 0;
  let v = 0;
  let count = 0;
  let length = 0;
  for(const row of data){
    if(header){
      header = false;
    }else{
      v = v << 1;
      length++;
      if(row[4].checkbox.checked){
        v = v | 1;
        count++;
      }
      if(++i === 6){
        result.push(b64[v]);
        v = 0;
        i = 0;
      }
    }
  }
  history.replaceState(null, "", location.pathname + "#" + result.join(""));
  document.title = `放サモ 恒常☆4チェッカー（${count}/${length}）`;
};

const load = () => {
  const hash = location.hash.slice(1);
  if(hash){
    const result = [];
    let index = 1;
    for(const s of hash){
      const v = b64.indexOf(s);
      let i = 6;
      if(v === -1) return;
      while(i--){
        if(index >= data.length) return;
        data[index++][4].checkbox.checked = !!(v & (1 << i));
      }
    }
    data[1][4].checkbox.dispatchEvent(new Event("change", {bubbles: true}));
  }
};
