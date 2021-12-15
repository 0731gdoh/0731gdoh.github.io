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
  ,["移動フェーズ終了後", "em"]
  ,["非移動後", "nm"]
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
