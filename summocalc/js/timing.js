var TIMING_LABELS = ["登場時/Joining Battle", "フェーズ開始時/Phase Start", "ターン開始時/Turn Start", "敵ターン開始時/Enemy Turn Start", "移動後/Post-Move", "攻撃時/Attacking", "攻撃後/Post-Attack", "空振り時/Missed Attack", "ダメージ時/Attacked", "対ダメージ/Counter", "ダメージ後/Post-Damage", "強化後/Buffed", "弱体後/Debuffed", "退場時/Defeat", "CS", "CS発動後/After CS"];

var TIMING_KEYWORDS = ["j", "p", "t", "et", "pm", "a", "pa", "ma", "ba", "cd", "pd", "b", "d", "ud", "c", "cx"];

var TIMING = {
  ANY: (1 << TIMING_KEYWORDS.length) - 1,
  CS: (1 << TIMING_KEYWORDS.indexOf("c")) | (1 << TIMING_KEYWORDS.indexOf("cx")),
  AR: 1 << TIMING_KEYWORDS.length
}
TIMING.NOT_CS = TIMING.ANY - TIMING.CS;

function timing2str(timing, lang, cs){
  timing = timing & TIMING.ANY;
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
  var bo = /^(.+)に((?:特攻|デメリット)\[\d+\.\d+\])$/;
  var result = new Map();
  if(s) s.split("/").forEach(function(x){
    var match = x.match(re);
    var timing = 0;
    var target = 0;
    var tname = "";
    if(match[1]) timing = match[1].split("&").reduce(function(acc, cur){
      var n = TIMING_KEYWORDS.indexOf(cur);
      if(n < 0) throw new Error("キーワード「" + cur + "」は未定義です\n（" + s + "）");
      acc = acc | (1 << n);
      return acc;
    }, 0);
    var name = match[2].replace(bo, function(m, p1, p2){
      target = TAG.table.get(p1);
      tname = p1;
      return p2;
    });
    var i = TAG.table.get(name);
    var key = (timing & TIMING.CS) ? "c" + match[2] : match[2];
    if(!i) throw new Error("タグ「" + name + "」は未登録です\n（" + s + "）");
    if(result.has(key)) throw new Error("スキル「" + match[2] + "」が重複しています\n（" + s + "）");
    result.set(key, [name, i, timing, target, tname]);
  });
  return result;
}
