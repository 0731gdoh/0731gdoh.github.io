var TIMING_LABELS = ["登場時/Joining Battle", "フェーズ開始時/Phase Start", "ターン開始時/Turn Start", "敵ターン開始時/Enemy Turn Start", "移動後/Post-Move", "攻撃時/Attacking", "攻撃後/Post-Attack", "空振り時/Missed Attack", "ダメージ時/Attacked", "対ダメージ/Counter", "ダメージ後/Post-Damage", "強化後/Buffed", "弱体後/Debuffed", "退場時/Defeat", "CS", "CS発動後/After CS"];

var TIMING_KEYWORDS = ["j", "p", "t", "et", "pm", "a", "pa", "ma", "ba", "cd", "pd", "b", "d", "ud", "c", "cx"];

var TIMING = {
  ANY: (1 << TIMING_KEYWORDS.length) - 1,
  CS: (1 << TIMING_KEYWORDS.indexOf("c")) | (1 << TIMING_KEYWORDS.indexOf("cx")),
  AR: 1 << TIMING_KEYWORDS.length
}
TIMING.NOT_CS = TIMING.ANY - TIMING.CS;

function timing2str(timing, lang, cs){
  if(!timing){
    return "";
  }else if(timing){
    var i = 0;
    var r = [];
    while(timing){
      if(timing & 1) r.push(t(TIMING_LABELS[i], lang));
      timing = timing >> 1;
      i++;
    }
    if(cs){
      return "{" + r.join("}{") + "}";
    }else{
      return "[" + r.join("][") + "]";
    }
  }
}

function splitSkills(s){
  var re = /^([a-z&]*)(.+)$/;
  var result = new Map();
  if(s) s.split("/").forEach(function(x){
    var match = x.match(re);
    var timing = 0;
    if(match[1]) timing = match[1].split("&").reduce(function(acc, cur){
      var n = TIMING_KEYWORDS.indexOf(cur);
      if(n < 0) throw new Error("キーワード「" + cur + "」は未定義です\n（" + s + "）");
      acc = acc | (1 << n);
      return acc;
    }, 0);
    var i = TAG.table.get(match[2]);
    var key = (timing & TIMING.CS) ? i + TAG_MAX : i;
    if(!key) throw new Error("タグ「" + match[2] + "」は未登録です\n（" + s + "）");
    if(result.has(key)) throw new Error("タグ「" + match[2] + "」が重複しています\n（" + s + "）");
    result.set(key, [match[2], i, timing]);
  });
  return result;
}
