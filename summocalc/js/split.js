"use strict";

function splitCharaNames(s){
  if(!s) return [];
  return s.split("/").reduce(function(acc, cur){
    return acc.concat(CARD.table.get(cur));
  }, []);
}

function generateTagData(s, flagNum, arTiming){
  var z = [];
  var r = new Map();
  s.forEach(function(x){
    var sf = (x[0].slice(0, 3) !== "全ての");
    var v = x[1];
    var tag = TAG[v];
    var timing = arTiming || x[2];
    var g = 0;
    if(timing & TIMING_FLAG.CS){
      g = TAG_MAX;
      if(timing & TIMING_FLAG.NOT_CS){
        timing = timing & TIMING_FLAG.NOT_CS;
      }
    }
    if(tag.type !== TAG_TYPE.CATEGORY){
      var f = (tag.type === TAG_TYPE.STATIC) ? TAG_FLAG_NUM.STATIC : flagNum;
      var b = (f < 3) ? timing : (timing || 1);
      if(tag.type !== TAG_TYPE.SKIP){
        if(r.has(v + g)){
          r.set(v + g, r.get(v + g) | timing);
        }else{
          r.set(v + g, timing);
        }
        tag.setFlag(f, b);
      }
      (flagNum < 3 ? tag.category : tag.subset).forEach(function(c){
        if(r.has(c + g)){
          r.set(c + g, r.get(c + g) | timing);
        }else{
          r.set(c + g, timing);
        }
        if(sf) TAG[c].setFlag(f, b);
      });
    }
  });
  r.forEach(function(value, key){
    z.push([key, value]);
  });
  return z;
}

function splitEffects(s){
  return generateEffectData(splitSkills(s));
}

function splitSkills(s){
  var re = /^([a-z&]*)(.+)$/;
  var bo = /^(.*[^に])に?((?:特攻|デメリット)\[\d+\.\d+\])$/;
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
    if(target && TAG[target].subset.length && [TAG_TYPE.SKILL, TAG_TYPE.ALL_BUFFS, TAG_TYPE.ALL_DEBUFFS].indexOf(TAG[target].type) === -1){
      var evo = [];
      TAG[target].subset.forEach(function(sub){
        if(evo.indexOf(sub) === -1){
          var subtag = TAG[sub];
          var subname = t(subtag.name, 0);
          var subkey = subname + "に" + name;
          if(subtag.subset.length) evo = subtag.subset;
          result.set(subkey, [name, i, timing, sub, subname]);
        }
      });
    }else{
      result.set(key, [name, i, timing, target, tname]);
    }
  });
  return result;
}

function generateEffectData(s, group){
  var result = [];
  s.forEach(function(value){
    var i = EFFECT.table.get(group ? "*" + value[0] : value[0]);
    if(i){
      var g = (value[2] & TIMING_FLAG.CS) ? EFFECT_MAX : 0;
      if(!EFFECT[i].isToken()){
        var n = i;
        if(value[3]){
          n = EFFECT[i].subset.get(value[3]);
          if(!n) n = registerBonusEffect(i, value);
        }
        result.push(n + g);
      }
    }
  });
  return result;
}

function registerBonusEffect(i, value){
  var tag = TAG[value[3]];
  var o = Object.create(EFFECT[i]);
  var flag = EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE;
  if(tag.type === TAG_TYPE.SPECIAL){
    o.name = value[4] + value[0] + "/Bonus " + t(tag.name, 1) + value[0].replace(/^[^\[]+/, " ");
  }else{
    [[6, "極大特攻/極大特攻"]
    ,[3, "超特攻/超特攻"]
    ,[2, "大特攻/Greater bonus"]
    ,[1, "特攻/Bonus"]
    ,[0, "与ダメージ減少/Decrease"]
    ].some(function(x){
      if(o.value[0] >= x[0]){
        o.name = value[4] + "に" + x[1] + " damage against " + t(tag.name, 1);
        return true;
      }
      return false;
    });
  }
  o.index = EFFECT.length;
  o.link = EFFECT.table.get("*" + value[4]) || 0;
  o.subset.set(value[3], o.index);
  o.subset = null;
  o.sp = [i, value[3]];
  if(!o.link){
    switch(tag.type){
      case TAG_TYPE.BUFF:
      case TAG_TYPE.ALL_BUFFS:
        flag = flag | EFFECT_FLAG.BONUS_TO_BUFF;
        break;
      case TAG_TYPE.DEBUFF:
      case TAG_TYPE.ALL_DEBUFFS:
        flag = flag | EFFECT_FLAG.BONUS_TO_DEBUFF;
    }
  }
  o.flag = flag;
  EFFECT.push(o);
  return o.index;
}
