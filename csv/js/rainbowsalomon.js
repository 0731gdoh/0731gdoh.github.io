"use strict";

const CHECKER_INDEX = 4;
const ATTR = ["", "全", "火", "水", "木", "天", "冥", "魔", "英雄", "世界", "無限", "零", "神", "-"];
const WEAPON = ["", "斬撃", "突撃", "打撃", "射撃", "魔法", "横一文字", "狙撃", "全域", "無", "-"];

const build = (list) => {
  const result = [["#", "属性", "武器", "名前", "所持"]];
  let i = 0;
  for(const row of list){
    result.push(row);
    row[0] = ATTR[row[0]];
    row[1] = WEAPON[row[1]];
    row.push({value: false});
    row.unshift(++i + "");
  }
  return result;
};

const source = [
  [5, 2, "ケンゴ"]
  ,[2, 2, "オニワカ"]
  ,[2, 1, "クロード"]
  ,[6, 4, "リヒト"]
  ,[5, 5, "デュオ"]
  ,[2, 4, "コタロウ"]
  ,[4, 2, "マガン"]
  ,[5, 4, "オピオーン"]
  ,[5, 5, "ジブリール"]
  ,[3, 1, "スノウ"]
  ,[6, 4, "ジェド"]
  ,[6, 2, "ハーロット"]
  ,[8, 1, "ホロケウカムイ"]
  ,[3, 4, "ツァトグァ"]
  ,[6, 1, "チェルノボーグ"]
  ,[2, 2, "ザバーニーヤ"]
  ,[3, 4, "エイハブ"]
  ,[4, 4, "タンガロア"]
  ,[4, 5, "クロガネ"]
  ,[2, 4, "アイゼン"]
  ,[4, 3, "ワカン・タンカ"]
  ,[7, 2, "シノ"]
  ,[4, 2, "タヂカラオ"]
  ,[2, 6, "ギュウマオウ"]
  ,[3, 2, "エーギル"]
  ,[7, 6, "スルト"]
  ,[5, 2, "タングリスニル"]
  ,[7, 3, "タケマル"]
  ,[7, 4, "ツクヨミ"]
  ,[9, 5, "コロポックル"]
  ,[4, 7, "レイヴ"]
  ,[2, 2, "ヘパイストス"]
  ,[7, 5, "サナト・クマラ"]
  ,[9, 4, "テスカトリポカ"]
  ,[9, 3, "ジェイコフ"]
  ,[6, 4, "ヘラクレス"]
  ,[9, 2, "ホルス"]
  ,[2, 1, "クトゥグァ"]
  ,[7, 5, "バエル"]
  ,[7, 9, "ダイコク"]
  ,[8, 2, "シヴァ"]
  ,[6, 1, "エリイ"]
  ,[9, 1, "ヨリトモ"]
  ,[7, 2, "ヴォルフ・フセスラフ"]
  ,[3, 4, "アキハゴンゲン"]
  ,[6, 9, "ティンダロス"]
  ,[9, 7, "フッキ"]
  ,[7, 4, "サンダユウ"]
  ,[5, 5, "テュアリング"]
  ,[9, 6, "ペルーン"]
  ,[1, 3, "タケミナカタ"]
  ,[9, 2, "ウランバートル"]
  ,[5, 9, "クルシャ"]
  ,[4, 3, "アムブスキアス"]
  ,[7, 9, "オスカー"]
  ,[9, 3, "アフラ・マズダ"]
  ,[7, 5, "ロキ"]
  ,[10, 2, "シャマシュ"]
];
const data = build(source);
