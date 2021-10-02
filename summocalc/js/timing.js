var Timing = function(index, x){
  this.index = index;
  this.name = x;
  this.value = 1 << index;
};
Timing.prototype = {
  toString: function(){
    return t(this.name);
  },
  getValue: function(){
    return this.value;
  }
};
Timing.createList = function(a){
  var table = new Map();
  var r = a.map(function(v, i){
    table.set(v[1], i);
    return new Timing(i, v[0]);
  });
  r.table = table;
  return r;
};

var TIMING = Timing.createList(
  [["登場時/Joining Battle", "j"]
  ,["フェーズ開始時/Phase Start", "p"]
  ,["ターン開始時/Turn Start", "t"]
  ,["敵ターン開始時/Enemy Turn Start", "et"]
  ,["移動後/Post-Move", "pm"]
  ,["攻撃時/Attacking", "a"]
  ,["攻撃後/Post-Attack", "pa"]
  ,["空振り時/Missed Attack", "ma"]
  ,["ダメージ時/Attacked", "ba"]
  ,["対ダメージ/Counter", "cd"]
  ,["ダメージ後/Post-Damage", "pd"]
  ,["強化後/Buffed", "b"]
  ,["弱体後/Debuffed", "d"]
  ,["退場時/Defeat", "ud"]
  ,["間接/Indirect", "id"]
  ,["CS", "c"]
  ,["CS発動後/After CS", "cx"]
]);

var TIMING_FLAG = {
  ANY: (1 << TIMING.length) - 1,
  CS: (1 << TIMING.table.get("c")) | (1 << TIMING.table.get("cx")),
  AR: 1 << TIMING.length
}
TIMING_FLAG.NOT_CS = TIMING_FLAG.ANY - TIMING_FLAG.CS;

function timing2str(timing, lang, cs){
  timing = timing & TIMING_FLAG.ANY;
  if(!timing){
    return "";
  }else if(timing){
    var i = 0;
    var r = [];
    while(timing){
      if(timing & 1) r.push(t(TIMING[i].name, lang));
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
      var n = TIMING.table.get(cur);
      if(n === undefined) throw new Error("キーワード「" + cur + "」は未定義です\n（" + s + "）");
      acc = acc | (1 << n);
      return acc;
    }, 0);
    var name = match[2].replace(bo, function(m, p1, p2){
      target = TAG.table.get(p1);
      tname = p1;
      return p2;
    });
    var i = TAG.table.get(name);
    var key = (timing & TIMING_FLAG.CS) ? "c" + match[2] : match[2];
    if(!i) throw new Error("タグ「" + name + "」は未登録です\n（" + s + "）");
    if(result.has(key)) throw new Error("スキル「" + match[2] + "」が重複しています\n（" + s + "）");
    result.set(key, [name, i, timing, target, tname]);
  });
  return result;
}
