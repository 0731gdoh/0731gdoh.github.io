"use strict";

function checkTiming(a, b, mode){
  if(!b) return false;
  if(a & TIMING_FLAG.COMPOUND) return (a & b | TIMING_FLAG.COMPOUND) !== a;
  return check(a, b, mode || 0);
}

function EffectFilter(n, ids, ar){
  this.timing = ar ? TIMING_FLAG.NOT_CS : TIMING_FLAG.ANY;
  this.range = 7;
  this.category = 0;
  this.effect = 0;
  this.ar = ar;
  this.ids = ids.map(function(id){
    return id + n;
  });
  this.label = "効果" + n + "/Effect " + n;
}
EffectFilter.prototype = {
  init: function(parent, tab){
    var c = this;
    this.markDirty = tab.getMarkDirty(false, c.ids[3]);
    linkInput([parent, c], "effect", c.ids[3]);
    linkInput([parent, c], "category", c.ids[2], function(){
      c.updateOptions(true);
    });
    linkInput([parent, c], "range", c.ids[1], function(){
      c.updateOptions();
    });
    linkInput([parent, c], "timing", c.ids[0], function(){
      c.updateOptions();
    });
  },
  updateOptions: function(skip){
    var rb = bits(this.range || 7);
    var b = this.timing || TIMING_FLAG.ANY;
    var n = this.ar ? TAG_FLAG_NUM.AR : 0;
    var checkFlag = function(x){
      return rb.some(function(r){
        return x.checkFlag(r + n, b);
      });
    };
    var c, s;
    if(!skip) setOptions(this.ids[2], TAG, {filter: function(x){
      return !x.index || (x.type === TAG_TYPE.CATEGORY && checkFlag(x));
    }, text: "カテゴリ：/Category: "});
    c = this.category;
    s = c && TAG[c].reading[0] !== "ん";
    setOptions(this.ids[3], TAG, {filter: function(x){
      return !x.index || (x.type !== TAG_TYPE.CATEGORY && (s || x.reading.indexOf(" ") === -1) && x.checkCategory(c) && checkFlag(x));
    }, labels: TAG.LABELS[0]});
  },
  updateTexts: function(){
    var params;
    if(this.ar) params = {filter: FILTER.NOT_CS};
    setCheckGroup(this.ids[0], TIMING, params);
    setCheckGroup(this.ids[1], RANGE);
    this.updateOptions();
    setText("l" + this.ids[3], this.label);
  },
  getFilter: function(exclude){
    var effect = this.effect || this.category;
    var timing = this.timing;
    var rb = bits(this.range);
    var d = exclude ? TAG_MAX * 10 : TAG_MAX;
    this.mark();
    if(!effect || !timing || !this.range){
      this.markDirty(false);
      return;
    }
    this.markDirty(true);
    return function(x){
      return rb.every(function(range){
        return x.tag[range].every(function(ie){
          return (effect !== ie[0] % d) || checkTiming(ie[1], timing);
        });
      });
    };
  },
  mark: function(){
    var tag = TAG[this.effect || this.category];
    var timing = this.timing || TIMING_FLAG.ANY;
    var range = this.range || 7;
    var n = this.ar ? TAG_FLAG_NUM.AR : 0;
    var tFlag = 0;
    var rFlag = 0;
    [1, 2, 4].forEach(function(bit, i){
      var flag = tag.flags[i + n];
      if(flag){
        if(range & bit) tFlag |= flag;
        if(timing & flag) rFlag |= bit;
      }
    });
    markUnmatched(this.ids[0], tFlag);
    markUnmatched(this.ids[1], rFlag);
  }
};

function StaticEffectFilter(ids, ar){
  this.bonus_a = 0;
  this.bonus_d = 0;
  this.nullify = 0;
  this.stef = 0;
  this.tmp = [1, 1, 1, 1];
  this.ids = ids;
  this.ar = ar;
  this.tid = ids.pop();
}
StaticEffectFilter.prototype = {
  init: function(parent, tab){
    var c = this;
    var keys = ["bonus_a", "bonus_d", "nullify", "stef"]
    this.ids.forEach(function(id, i){
      linkInput([parent, c], keys[i], id, tab);
      linkInput([parent, c], "tmp", c.tid + (i + 1), tab, true, i);
    });
  },
  updateTexts: function(){
    var tl = "l" + this.tid;
    var labels = ["特攻対象/A.Adv.", "特防対象/D.Adv.", "状態無効/Nullify", "常時/Static"];
    var n = this.ar ? TAG_FLAG_NUM.AR + 3 : 3;
    this.ids.forEach(function(key, i){
      setOptions(key, TAG, {filter: function(x){
        return !x.index || x.checkFlag(i + n, TIMING_FLAG.STATIC);
      }, labels: TAG.LABELS[i + 3]});
      setText("l" + key, labels[i]);
      setText(tl + (i + 1), "状態変化を含む/Include Status Effects");
    });
  },
  getFilter: function(exclude){
    var d = exclude ? TAG_MAX * 10 : TAG_MAX;
    var flags = this.tmp.map(function(tmp){
      if(tmp) return TIMING_FLAG.STATIC;
      return TIMING_FLAG.STATIC | TIMING_FLAG.NOT_TEMPORARY;
    });
    var a = [this.bonus_a, this.bonus_d, this.nullify, this.stef];
    return function(x){
      return a.some(function(te, i){
        return te && x.tag[(i + 3) % 6].every(function(ie){
          return te !== ie[0] % d || checkTiming(ie[1], flags[i], 1);
        });
      });
    };
  }
};
