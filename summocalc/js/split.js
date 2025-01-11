"use strict";

function SkillData(k, v){
  if(v[2] & TIMING_FLAG.COMPOUND){
    k = v[2] + k;
  }
  if(v[2] & TIMING_FLAG.SALV){
    if(v[3]) v[3] += TAG_MAX;
    if(v[2] & TIMING_FLAG.NOT_CS){
      k = "&c" + k;
    }else{
      k = "c" + k;
    }
  }
  this.name = v[0];
  this.index = v[1];
  this.timing = v[2];
  this.target = v[3];
  this.targetName = v[4];
  this.demerit = v[5];
  this.key = k;
}

function splitCharaNames(s){
  if(!s) return [];
  return s.split("/").reduce(function(acc, cur){
    if(cur[0] === "@") cur = cur.slice(1);
    return acc.concat(CARD.table.get(cur));
  }, []);
}

function splitThumbnailNames(sc, st){
  var result = [];
  var f = function(s){
    if(s) s.split("/").forEach(function(x){
      if(x[0] === "@") result.push(THUMBNAIL.table.get(x.slice(1)).count());
    });
  };
  f(sc);
  f(st);
  return result;
}

function generateTagData(s, flagNum, ar){
  var z = [];
  var table = new Map();
  s.forEach(function(sd){
    var v = sd.index;
    var timing = sd.timing;
    if(flagNum === 3){
      if(sd.demerit) return;
      v = sd.target % TAG_MAX || TAG[v].getTarget(flagNum);
      timing &= ~TIMING_FLAG.NOT_CS;
    }
    if(v){
      var tag = TAG[v];
      var g = 0;
      var compound = timing & TIMING_FLAG.COMPOUND;
      if(timing & TIMING_FLAG.CS){
        g = TAG_MAX;
        if(!compound && timing & TIMING_FLAG.NOT_CS){
          timing &= ~TIMING_FLAG.CS;
        }
      }
      if(tag.type !== TAG_TYPE.CATEGORY){
        var f = (tag.type === TAG_TYPE.STATIC) ? TAG_FLAG_NUM.STATIC : flagNum;
        var b = (f < 3) ? timing : (timing || 1);
        var sf = true;
        if(ar) f += TAG_FLAG_NUM.AR;
        switch(tag.type){
          case TAG_TYPE.SKIP:
            break;
          case TAG_TYPE.ALL_BUFFS:
          case TAG_TYPE.ALL_DEBUFFS:
            sf = false;
          case TAG_TYPE.BUFF:
          case TAG_TYPE.DEBUFF:
            if(flagNum > 2) sf = false;
          default:
            if(table.has(v + g)){
              table.get(v + g)[1] |= timing;
            }else{
              var data = [v + g, timing];
              z.push(data);
              if(!compound) table.set(v + g, data);
            }
            tag.setFlag(f, b);
            break;
        }
        (flagNum < 3 ? tag.category : tag.subset).forEach(function(c){
          if(table.has(c + g)){
            table.get(c + g)[1] |= timing;
          }else{
            var subdata = [c + g, timing];
            z.push(subdata);
            if(!compound) table.set(c + g, subdata);
          }
          if(sf) TAG[c].setFlag(f, b);
        });
      }
    }
  });
  return z;
}

function splitSkills(s){
  var re = /^([a-z&+]*)(.+)$/;
  var bo = /^(.*[^に])に?((?:特攻|(デメリット))\[\d+\.\d+\]|に(貫通))$/;
  var result = new Map();
  var set = function(k, v){
    var sd = new SkillData(k, v);
    if(!sd.index && sd.name) throw new Error("タグ「" + sd.name + "」は未登録です\n（" + s + "）");
    if(result.has(sd.key)) throw new Error("スキル「" + sd.key + "」が重複しています\n（" + s + "）");
    result.set(sd.key, sd);
  };
  if(s) s.split("/").forEach(function(x){
    var match = x.match(re);
    var timing = 0;
    var tname = "";
    var ignore = false;
    var demerit = false;
    if(match[1]){
      var compound = match[1].indexOf("+") !== -1;
      var sep = compound ? "+" : "&";
      var salv = 0;
      timing = match[1].split(sep).reduce(function(acc, cur){
        var flag = 0;
        if(cur === "x"){
          salv = -1;
        }else{
          var n = TIMING.table.get(cur);
          if(n === undefined) throw new Error("キーワード「" + cur + "」は未定義です\n（" + s + "）");
          flag = (1 << n)
          if(!salv && TIMING_FLAG.CS & flag) salv = 1;
        }
        return acc | flag;
      }, 0);
      if(salv === 1) timing |= TIMING_FLAG.SALV;
      if(compound) timing |= TIMING_FLAG.COMPOUND;
    }
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
    var tag = TAG[target];
    var subset = [];
    switch(tag.type){
      case TAG_TYPE.SKIP:
      case TAG_TYPE.STATUS_GROUP:
        set(key, ["", 0, timing, target, tname, false]);
        subset = tag.subset;
        break;
      default:
        set(key, [name, i, timing, target, tname, demerit]);
        subset = tag.variant;
        break;
    }
    if(subset.length){
      var evo = [];
      subset.forEach(function(sub){
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
    }
  });
  return result;
}

function generateEffectData(s, group){
  var result = [];
  s.forEach(function(sd){
    var i = EFFECT.table.get(group ? "*" + sd.name : sd.name);
    if(i){
      var e = EFFECT[i];
      var g = (sd.timing & TIMING_FLAG.SALV) ? EFFECT_MAX : 0;
      if(!e.isToken()){
        if(sd.target){
          var n = i;
          if(e.type === TYPE.BONUS || g){
            n = e.subset.get(sd.target);
            if(!n) n = registerBonusEffect(i, sd);
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

function registerBonusEffect(i, sd){
  var tag = TAG[sd.target % TAG_MAX];
  var o = Object.create(EFFECT[i]);
  if(o.type !== TYPE.IGNORE){
    if(tag.type === TAG_TYPE.SPECIAL){
      o.name = sd.targetName + sd.name + "/Bonus damage " + t(tag.name, 1) + sd.name.replace(/^[^\[]+/, " ");
    }else{
      [[3, "超特攻/Massive bonus"]
      ,[2, "大特攻/Greater bonus"]
      ,[1, "特攻/Bonus"]
      ,[0, "与ダメージ減少/Decrease"]
      ].some(function(x){
        if(o.baseValue[0] >= x[0]){
          o.name = sd.targetName + "に" + x[1] + " damage against " + t(tag.name, 1);
          return true;
        }
        return false;
      });
    }
    o.link = EFFECT.table.get("*" + sd.targetName) || 0;
    if(!o.link){
      var flag = EFFECT_FLAG.FIXED|EFFECT_FLAG.STACKABLE;
      switch(tag.type){
        case TAG_TYPE.BUFF:
        case TAG_TYPE.ALL_BUFFS:
          flag |= EFFECT_FLAG.BONUS_TO_BUFF;
          break;
        case TAG_TYPE.DEBUFF:
        case TAG_TYPE.ALL_DEBUFFS:
          flag |= EFFECT_FLAG.BONUS_TO_DEBUFF;
      }
      o.flag = flag;
    }
  }
  if(sd.target > TAG_MAX) o.csOnly = true;
  o.index = EFFECT.length;
  o.subset.set(sd.target, o.index);
  o.subset = null;
  o.sp = [i, sd.target];
  EFFECT.push(o);
  return o.index;
}
