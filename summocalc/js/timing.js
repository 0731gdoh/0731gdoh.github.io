"use strict";

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
  var br = 0;
  var r = a.map(function(v, i){
    table.set(v[1], i);
    if(v[0][0] !== "C") ++br;
    return new Timing(i, v[0]);
  });
  r.table = table;
  r.BR = [br];
  return r;
};

var TIMING = Timing.createList(
  [["登場時/Joining Battle", "j"]
  ,["フェーズ開始時/Phase Start", "p"]
  ,["ターン開始時/Turn Start", "t"]
  ,["移動後/Post-Move", "pm"]
  ,["移動フェーズ終了後/End of Movement Phase", "em"]
  ,["非移動後/Post-No Move", "nm"]
  ,["攻撃時/Attacking", "a"]
  ,["攻撃後/Post-Attack", "pa"]
  ,["空振り時/Missed Attack", "ma"]
  ,["敵ターン開始時/Enemy Turn Start", "et"]
  ,["ダメージ時/Attacked", "ba"]
  ,["対ダメージ/Counter", "cd"]
  ,["ダメージ後/Post-Damage", "pd"]
  ,["退場時/Defeat", "ud"]
  ,["強化後/Post-Buff", "b"]
  ,["弱体後/Post-Debuff", "d"]
  ,["[間接]/[Indirect]", "id"]
  ,["CS", "c"]
  ,["CS発動後/After CS", "cx"]
]);

var TIMING_FLAG = {
  ANY: (1 << TIMING.length) - 1,
  CS: (1 << TIMING.table.get("c")) | (1 << TIMING.table.get("cx")),
  COMPOUND: 1 << TIMING.length,
  SALV: 2 << TIMING.length,
  STATIC: 4 << TIMING.length,
  NOT_TEMPORARY: 8 << TIMING.length,
}
TIMING_FLAG.NOT_CS = TIMING_FLAG.ANY - TIMING_FLAG.CS;

function timing2str(timing, lang){
  var brace = (timing & TIMING_FLAG.SALV) ? "}{" : "][";
  var sep = (timing & TIMING_FLAG.COMPOUND) ? "+" : brace;
  timing &= TIMING_FLAG.ANY;
  if(!timing){
    return "";
  }else{
    var i = 0;
    var r = [];
    while(timing){
      if(timing & 1) r.push(t(TIMING[i].name, lang));
      timing >>= 1;
      i++;
    }
    return brace[1] + r.join(sep) + brace[0];
  }
}
