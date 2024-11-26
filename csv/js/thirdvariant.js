"use strict";

const countDays = (list) => {
  let i = 0;
  for(const row of list){
    const since = toDate(row[1]);
    const until = toDate(row[2]);
    const days = (until.getTime() - since.getTime()) / (1000 * 60 * 60 * 24);
    row.push(row[2] ? "○" : "×");
    row.push((days | 0) + "");
    row.unshift(++i + "");
  }
  list.unshift(["#", "名前", "実装", "三枠目", "済", "日数"]);
  return list;
};

const toDate = (s) => s ? new Date(`20${s.replace(/\D/g, "-")}T00:00:00+09:00`) : new Date();

const data = countDays(
  [["主人公", "16/12/02", ""]
  ,["シロウ", "16/12/02", "17/02/04"]
  ,["ケンゴ", "16/12/02", "17/04/18"]
  ,["リョウタ", "16/12/02", "17/12/22"]
  ,["トウジ", "16/12/02", "19/02/14"]
  ,["オニワカ", "16/12/02", "19/01/21"]
  ,["ハヌマン", "16/12/02", "18/08/20"]
  ,["クロード", "16/12/02", "18/12/10"]
  ,["リヒト", "16/12/02", "18/02/14"]
  ,["デュオ", "16/12/02", ""]
  ,["マリア", "17/05/23", "17/08/23"]
  ,["クリスティーヌ", "18/04/09", ""]
  ,["モリタカ", "16/12/02", "17/02/04"]
  ,["フェンリル", "17/03/20", "18/09/28"]
  ,["アシガラ", "17/04/11", "17/08/29"]
  ,["アステリオス", "16/12/02", "17/11/28"]
  ,["ゴウリョウ", "17/08/01", "18/08/20"]
  ,["イクトシ", "16/12/02", "18/05/01"]
  ,["シンヤ", "17/02/04", "23/02/14"]
  ,["ケンタ", "16/12/09", "19/02/14"]
  ,["コタロウ", "16/12/02", "19/08/27"]
  ,["エイタ", "16/12/02", "17/08/01"]
  ,["チョウジ", "17/08/29", "20/12/15"]
  ,["ジュウゴ", "16/12/02", "21/08/13"]
  ,["マガン", "16/12/02", "18/06/01"]
  ,["オピオーン", "17/10/05", ""]
  ,["テムジン", "16/12/02", ""]
  ,["ガルム", "17/01/01", ""]
  ,["マカラ", "16/12/02", ""]
  ,["アザゼル", "16/12/09", ""]
  ,["カーシー", "17/01/01", "17/10/27"]
  ,["グンゾウ", "16/12/02", "17/02/04"]
  ,["マルコシアス", "16/12/02", ""]
  ,["ノブハル", "16/12/02", "18/07/05"]
  ,["キュウマ", "17/01/01", "21/02/15"]
  ,["カグツチ", "16/12/09", "20/06/30"]
  ,["R-19", "16/12/02", ""]
  ,["ジブリール", "16/12/02", "17/02/04"]
  ,["アリス", "16/12/09", "17/10/27"]
  ,["ジャンバヴァン", "17/03/20", "19/04/17"]
  ,["ルキフゲ", "17/10/05", ""]
  ,["マーナガルム", "16/12/02", ""]
  ,["バーゲスト", "16/12/02", "20/02/20"]
  ,["バティム", "16/12/02", "17/08/29"]
  ,["クニヨシ", "16/12/02", "19/04/17"]
  ,["モトスミ", "16/12/09", "19/01/21"]
  ,["カルキ", "17/02/04", "19/12/11"]
  ,["ノーマッド", "16/12/02", "17/12/05"]
  ,["スノウ", "16/12/02", "20/02/20"]
  ,["ガンダルヴァ", "17/01/01", ""]
  ,["ニャルラトテプ", "16/12/02", "24/06/21"]
  ,["シュテン", "16/12/02", "18/05/01"]
  ,["ポルックス", "17/01/01", "18/12/10"]
  ,["タウラスマスク", "16/12/02", "17/12/22"]
  ,["ジライヤ", "16/12/19", "17/08/23"]
  ,["アンドヴァリ", "16/12/02", "19/08/27"]
  ,["ヨウル", "16/12/23", ""]
  ,["ジェド", "16/12/19", "20/12/15"]
  ,["ハーロット", "17/03/20", "19/10/15"]
  ,["イバラキ", "17/03/20", ""]
  ,["ホロケウカムイ", "17/01/19", "18/06/01"]
  ,["タローマティ", "17/02/04", ""]
  ,["シトリー", "17/02/10", "19/12/11"]
  ,["ツァトグァ", "17/07/10", "19/07/08"]
  ,["ホウゲン", "17/03/20", "18/07/05"]
  ,["ザオウ", "17/04/17", "18/05/01"]
  ,["チェルノボーグ", "17/04/11", "19/08/27"]
  ,["メリュジーヌ", "17/04/18", "18/12/10"]
  ,["ザバーニーヤ", "17/05/23", "19/07/08"]
  ,["アルスラーン", "17/05/23", "17/10/27"]
  ,["イフリート", "17/07/10", "18/09/28"]
  ,["ハクメン", "17/07/10", "18/02/14"]
  ,["ベンテン", "17/08/06", "21/12/14"]
  ,["エイハブ", "17/08/01", ""]
  ,["テュポーン", "17/08/01", "18/09/28"]
  ,["ジン", "17/08/23", ""]
  ,["ショロトル", "17/10/05", "21/09/28"]
  ,["タダトモ", "17/10/05", "18/02/14"]
  ,["ヴォーロス", "17/10/27", "19/08/27"]
  ,["タンガロア", "17/11/28", "19/11/14"]
  ,["トリトン", "17/11/28", ""]
  ,["キジムナー", "17/11/30", "19/11/14"]
  ,["クロガネ", "17/12/05", "21/05/10"]
  ,["ロビンソン", "17/12/05", "19/11/14"]
  ,["クランプス", "17/12/22", "19/10/15"]
  ,["アギョウ", "18/01/04", ""]
  ,["アイゼン", "18/02/14", "20/06/30"]
  ,["ワカン・タンカ", "18/04/09", "19/07/08"]
  ,["サンダーバード", "18/04/09", "21/08/13"]
  ,["シノ", "18/04/19", "19/02/14"]
  ,["ムサシ", "18/04/19", ""]
  ,["アマツマラ", "18/04/19", "19/07/08"]
  ,["ドゥルガー", "18/05/01", "19/04/17"]
  ,["テツギュウ", "18/06/01", "19/10/15"]
  ,["シュウイチ", "18/06/01", ""]
  ,["スズカ", "18/07/05", "19/07/08"]
  ,["タヂカラオ", "18/07/05", "21/08/13"]
  ,["ギョウブ", "18/07/05", ""]
  ,["ギュウマオウ", "18/08/20", "20/02/20"]
  ,["セト", "18/08/20", "19/08/27"]
  ,["エビス", "18/09/28", "21/10/29"]
  ,["エーギル", "18/09/28", "19/12/11"]
  ,["アルク", "18/11/12", "22/02/10"]
  ,["アザトース", "18/11/12", "21/10/29"]
  ,["スルト", "18/11/12", "19/02/14"]
  ,["タングリスニル", "18/12/10", "24/09/06"]
  ,["グリンブルスティ", "19/01/01", "23/08/29"]
  ,["タケマル", "19/01/21", "19/12/11"]
  ,["ベヒモス", "19/02/14", "23/08/29"]
  ,["ジズ", "19/02/14", "20/12/15"]
  ,["ミネアキ", "19/04/01", "21/09/28"]
  ,["テツヤ", "19/04/01", "19/12/11"]
  ,["ブレイク", "19/04/01", "21/05/10"]
  ,["アヴァルガ", "19/04/09", ""]
  ,["アルジャーノン", "19/04/09", "20/08/07"]
  ,["オセ", "19/04/09", "21/12/14"]
  ,["オズ", "19/04/09", "22/07/15"]
  ,["ツクヨミ", "19/04/01", "22/10/11"]
  ,["コロポックル", "19/04/09", ""]
  ,["アールプ", "19/04/17", "21/10/29"]
  ,["レイヴ", "19/04/17", "23/07/14"]
  ,["ヘパイストス", "19/05/28", "20/08/07"]
  ,["フルフミ", "19/05/28", "20/10/09"]
  ,["オンブレティグレ", "19/05/28", "20/08/07"]
  ,["アラクネ", "19/07/09", "21/08/13"]
  ,["ゴエモン", "19/08/27", ""]
  ,["リチョウ", "19/10/15", "20/10/09"]
  ,["サナト・クマラ", "19/10/15", ""]
  ,["アスタロト", "19/11/15", ""]
  ,["ダゴン", "19/11/14", "23/08/29"]
  ,["トムテ", "19/12/11", ""]
  ,["テスカトリポカ", "20/01/20", "20/10/09"]
  ,["シンノウ", "20/01/20", "20/08/07"]
  ,["ヤスヨリ", "20/01/20", "20/12/15"]
  ,["ジェイコフ", "20/01/20", "23/02/14"]
  ,["エーコー", "20/02/20", ""]
  ,["ヘラクレス", "20/02/20", "22/07/15"]
  ,["ホルス", "20/04/03", "23/12/08"]
  ,["クトゥグァ", "20/04/03", "21/05/10"]
  ,["バエル", "20/04/15", ""]
  ,["リャナンシー", "20/04/03", ""]
  ,["タネトモ", "20/04/03", "23/02/14"]
  ,["ダイコク", "20/04/15", "21/09/28"]
  ,["ティダ", "20/04/15", "22/12/09"]
  ,["バロール", "20/04/15", "22/02/10"]
  ,["ナタ", "20/04/15", ""]
  ,["勇者", "20/06/04", ""]
  ,["オルグス", "20/05/29", ""]
  ,["ソール", "20/05/29", ""]
  ,["ネクロス&バッカス", "20/05/29", ""]
  ,["キムンカムイ", "20/06/30", ""]
  ,["ヤマサチヒコ", "20/08/07", "22/07/15"]
  ,["オトヒメ", "20/08/07", ""]
  ,["ケットシー", "20/10/09", "22/02/10"]
  ,["トヴァシュトリ", "20/10/09", ""]
  ,["シヴァ", "20/11/27", "21/08/13"]
  ,["マルドゥック", "20/11/27", "24/10/18"]
  ,["バートロ", "20/11/27", "22/12/09"]
  ,["エリイ", "20/11/27", "22/10/11"]
  ,["イツァムナー", "20/12/15", "22/02/10"]
  ,["マクロイヒ", "21/02/15", "23/07/14"]
  ,["ヨリトモ", "21/04/02", "23/02/14"]
  ,["メフィストフェレス", "21/04/02", ""]
  ,["ベイブ・バニヤン", "21/04/02", "22/08/30"]
  ,["ヴォルフ・フセスラフ", "21/04/02", ""]
  ,["マサノリ", "21/04/12", "24/02/14"]
  ,["アキハゴンゲン", "21/04/12", "22/08/30"]
  ,["クルースニク", "21/04/12", "22/10/11"]
  ,["ティンダロス", "21/04/12", "22/08/30"]
  ,["ノーデンス", "21/05/10", ""]
  ,["フッキ", "21/07/09", "22/12/09"]
  ,["サンダユウ", "21/07/09", "22/10/11"]
  ,["カトブレパス", "21/07/09", "22/08/30"]
  ,["スモーキーゴッド", "21/07/09", "22/07/15"]
  ,["オオグチマガミ", "21/08/13", ""]
  ,["シュクユウ", "21/09/28", "22/12/09"]
  ,["サルタヒコ", "21/09/28", ""]
  ,["ホテイ", "21/10/29", ""]
  ,["ワカン・タンカ∞", "21/11/30", ""]
  ,["タンガロア∞", "21/11/30", ""]
  ,["ヘルメス", "21/12/14", ""]
  ,["ブギーマン", "22/02/10", "23/07/14"]
  ,["バロン", "22/04/05", ""]
  ,["エニグマ", "22/04/05", "24/09/06"]
  ,["イスラフィール", "22/04/05", ""]
  ,["テュアリング", "22/04/05", "23/12/08"]
  ,["ヘカテー", "22/04/15", "23/07/14"]
  ,["ペルーン", "22/04/15", ""]
  ,["タケミナカタ", "22/04/15", "24/02/14"]
  ,["ヨシトウ", "22/04/15", ""]
  ,["ウランバートル", "22/05/17", "23/12/08"]
  ,["タイシャクテン", "22/05/17", "24/02/14"]
  ,["∀アイザック", "22/05/17", ""]
  ,["ゴロウザエモン", "22/07/15", ""]
  ,["ヨルムンガンド", "22/07/15", ""]
  ,["ヴァプラ", "22/08/30", ""]
  ,["イシュバランケー", "22/11/04", ""]
  ,["スフィンクス", "22/10/11", ""]
  ,["キリト", "22/11/29", ""]
  ,["ビッグフット", "22/11/29", "24/09/06"]
  ,["シームルグ", "22/12/09", ""]
  ,["イナバ", "23/01/01", ""]
  ,["ギリメカラ", "23/02/14", ""]
  ,["ハスター", "23/04/04", ""]
  ,["クルシャ", "23/04/04", ""]
  ,["パズズ", "23/04/04", ""]
  ,["ノブミチ", "23/04/04", ""]
  ,["アムブスキアス", "23/04/13", ""]
  ,["オスカー", "23/04/13", ""]
  ,["グランガチ", "23/04/13", ""]
  ,["ユーマ", "23/04/13", ""]
  ,["クアンタム", "23/11/28", ""]
  ,["アフラ・マズダ", "23/05/19", ""]
  ,["ロキ", "23/05/19", ""]
  ,["ダオジュン", "23/05/19", ""]
  ,["ベオウルフ", "23/05/19", ""]
  ,["シパクトリ", "23/07/14", ""]
  ,["ゴルム", "23/08/29", ""]
  ,["ゴードン", "23/10/17", ""]
  ,["ファヴニル", "23/10/17", ""]
  ,["クラウス", "23/10/17", ""]
  ,["シャマシュ", "23/11/02", ""]
  ,["マサシ", "23/11/28", ""]
  ,["オッター", "23/12/08", ""]
  ,["モウショウ", "24/01/01", ""]
  ,["アマノジャク", "24/01/01", ""]
  ,["ヒッポリュトス", "24/02/14", ""]
  ,["コクリュウギケン", "24/04/02", ""]
  ,["プロメテウス", "24/04/02", ""]
  ,["ベルフェゴール", "24/04/02", ""]
  ,["アメノウズメ", "24/04/02", ""]
  ,["アマテラス", "24/04/12", ""]
  ,["ウィリー・ワイルドキャット", "24/04/12", ""]
  ,["レーヴン・アーサー", "24/04/12", ""]
  ,["トゥーアルシェン", "24/04/12", ""]
  ,["ミカイール", "24/06/21", ""]
  ,["バフォメット", "24/06/21", ""]
  ,["ココペリ", "24/06/21", ""]
  ,["サンゾウ", "24/06/21", ""]
  ,["イゴーロナク", "24/07/12", ""]
  ,["ヒマヴァット", "24/09/06", ""]
  ,["クマノゴンゲン", "24/09/10", ""]
  ,["サトルヌス", "24/10/18", ""]
  ,["マンティコア", "24/11/08", ""]
]);
