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
    var v = x[1];
    var timing = x[2];
    if(flagNum === 3){
      if(x[5]) return;
      v = x[3] % TAG_MAX || TAG[v].bonusTarget;
      timing = timing & TIMING_FLAG.CS;
    }
    if(v){
      var tag = TAG[v];
      var sf = ([TAG_TYPE.ALL_BUFFS, TAG_TYPE.ALL_DEBUFFS, TAG_TYPE.CWT_GROUP].indexOf(tag.type) === -1);
      var g = 0;
      timing = arTiming || timing;
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
    }
  });
  r.forEach(function(value, key){
    z.push([key, value]);
  });
  return z;
}

function splitSkills(s){
  var re = /^([a-z&]*)(.+)$/;
  var bo = /^(.*[^に])に?((?:特攻|(デメリット))\[\d+\.\d+\]|(貫通))$/;
  var result = new Map();
  var set = function(k, v){
    if(v[2] & TIMING_FLAG.CS){
      if(v[3]) v[3] += TAG_MAX;
      if(v[2] & TIMING_FLAG.NOT_CS){
        k = "&c" + k;
      }else{
        k = "c" + k;
      }
    }
    if(!v[1] && v[0]) throw new Error("タグ「" + v[0] + "」は未登録です\n（" + s + "）");
    if(result.has(k)) throw new Error("スキル「" + k + "」が重複しています\n（" + s + "）");
    result.set(k, v);
  };
  if(s) s.split("/").forEach(function(x){
    var match = x.match(re);
    var timing = 0;
    var tname = "";
    var ignore = false;
    var demerit = false;
    if(match[1]) timing = match[1].split("&").reduce(function(acc, cur){
      var n = TIMING.table.get(cur);
      if(n === undefined) throw new Error("キーワード「" + cur + "」は未定義です\n（" + s + "）");
      acc = acc | (1 << n);
      return acc;
    }, 0);
    var name = match[2].replace(bo, function(m, p1, p2, p3, p4){
      tname = p1;
      if(p4){
        ignore = true;
        return m;
      }
      demerit = !!p3;
      return p2;
    });
    var target = TAG.table.get(tname);
    var i = TAG.table.get(name);
    var key = match[2];
    if(target && TAG[target].subset.length && [TAG_TYPE.SKILL, TAG_TYPE.ALL_BUFFS, TAG_TYPE.ALL_DEBUFFS, TAG_TYPE.CWT_GROUP].indexOf(TAG[target].type) === -1){
      var evo = [];
      set(key, ["", 0, timing, target, tname, false]);
      TAG[target].subset.forEach(function(sub){
        if(evo.indexOf(sub) === -1){
          var subtag = TAG[sub];
          var subname = t(subtag.name, 0);
          if(subtag.subset.length) evo = subtag.subset;
          if(ignore){
            subname += "に貫通";
            set(subname, [subname, TAG.table.get(subname), timing, sub, subname, true]);
          }else{
            var subkey = subname + "に" + name;
            set(subkey, [name, i, timing, sub, subname, true]);
          }
        }
      });
    }else{
      set(key, [name, i, timing, target, tname, demerit]);
    }
  });
  return result;
}

function generateEffectData(s, group){
  var result = [];
  s.forEach(function(value){
    var i = EFFECT.table.get(group ? "*" + value[0] : value[0]);
    if(i){
      var e = EFFECT[i];
      var g = (value[2] & TIMING_FLAG.CS) ? EFFECT_MAX : 0;
      if(!e.isToken()){
        if(value[3]){
          var n = i;
          if(e.type === TYPE.BONUS || g){
            n = e.subset.get(value[3]);
            if(!n) n = registerBonusEffect(i, value);
          }
          result.push(n + g);
        }else if(e.type !== TYPE.BONUS){
          result.push(i + g);
        }
      }
    }
  });
  return result;
}

function registerBonusEffect(i, value){
  var tag = TAG[value[3] % TAG_MAX];
  var o = Object.create(EFFECT[i]);
  if(o.type !== TYPE.IGNORE){
    if(tag.type === TAG_TYPE.SPECIAL){
      o.name = value[4] + value[0] + "/Bonus damage " + t(tag.name, 1) + value[0].replace(/^[^\[]+/, " ");
    }else{
      [[3, "超特攻/Massive bonus"]
      ,[2, "大特攻/Greater bonus"]
      ,[1, "特攻/Bonus"]
      ,[0, "与ダメージ減少/Decrease"]
      ].some(function(x){
        if(o.baseValue[0] >= x[0]){
          o.name = value[4] + "に" + x[1] + " damage against " + t(tag.name, 1);
          return true;
        }
        return false;
      });
    }
    o.link = EFFECT.table.get("*" + value[4]) || 0;
    if(!o.link){
      var flag = EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE;
      switch(tag.type){
        case TAG_TYPE.BUFF:
        case TAG_TYPE.ALL_BUFFS:
          flag = flag | EFFECT_FLAG.BONUS_TO_BUFF;
          break;
        case TAG_TYPE.DEBUFF:
        case TAG_TYPE.ALL_DEBUFFS:
          flag = flag | EFFECT_FLAG.BONUS_TO_DEBUFF;
      }
      o.flag = flag;
    }
  }
  if(value[3] > TAG_MAX) o.csOnly = true;
  o.index = EFFECT.length;
  o.subset.set(value[3], o.index);
  o.subset = null;
  o.sp = [i, value[3]];
  EFFECT.push(o);
  return o.index;
}
