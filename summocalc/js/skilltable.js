"use strict";

function TableLabel(index, x){
  var list = x[1].filter(function(x){
    return x;
  });
  this.index = index;
  this.name = x[0];
  this.data = x[1];
  if(x[1][0]) list.push("cond");
  this.className = list.join(" ");
}
TableLabel.prototype = {
  toString: function(){
    return t(this.name) || "－";
  },
  getValue: function(){
    return 0;
  }
};
TableLabel.createList = function(a){
  return a.map(function(v, i){
    return new TableLabel(i, v);
  });
};

var TABLE_LABEL = TableLabel.createList(
  [["発動条件/Condition", ["fomula", ""]]
  ,["0%", ["zero", "zeroline"]]
  ,["Copy", ["copy", ""]]
  ,["Skill+%%CS+", ["plus", ""]]
  ,["進化前/Pre-Evolution", ["", "del"]]
]);
TABLE_LABEL.BR = [4];

var LABEL_TYPE = {
  FOMULA: 0,
  ZERO: 1,
  COPY: 2,
  PLUS: 3,
  DEL: 4
};
var LABEL_FLAG = {
  SPLIT: (1 << LABEL_TYPE.PLUS) | (1 << LABEL_TYPE.DEL),
  DEFAULT: (1 << TABLE_LABEL.length) - (1 << LABEL_TYPE.PLUS) - 1
};


function SkillTable(id, value, setting){
  this.table = _(id);
  this.value = value;
  this.details = 1;
  this.active = 1;
  this.table.className = "skilldata";
  this.setting = setting;
}
SkillTable.prototype = {
  init: function(key){
    this.details = (getStorageItem(key) || LABEL_FLAG.DEFAULT) - 0;
    linkInput(this, "details", this.setting, function(v){
      setStorageItem(key, v);
    });
  },
  setValue: function(value){
    this.value = value;
  },
  updateSettingTexts: function(){
    setCheckGroup(this.setting, TABLE_LABEL);
  },
  update: function(){
    var card = this.value;
    var table = this.table;
    var details = this.details;
    var count = 0;
    var header = [""];
    var order = [27, 0, 1, 2, 19, 3, 4, 5, 6, 23, 26, 7, 8, 9, 10, 24, 11, 12, 13, 20, 14, 15, 25, 16, 17, 18, 21, 22];
    var data = TIMING.map(function(x){
      return [t(x.name), new Map(), new Map(), new Map()];
    });
    var st = [
      "移動時/When Moving",
      "強制移動時/During Forced Move",
      "アイテム入手時/When Obtaining Items",
      "勝利時/Upon Victory",
      "特攻/Attack Advantage",
      "特防/Defense Advantage",
      "状態異常時/When Under Status Effect",
      "状態特攻/Status Advantage"
    ].map(function(x){
      return [t(x), new Map(), new Map(), new Map()];
    });
    var nullify = function(name){
      return t(name + "無効/Nullify " + name);
    };
    var push = function(map, name, td, tooltip, tag, bonus){
      var cls = [];
      var split = details & LABEL_FLAG.SPLIT;
      var key = 0;
      if(td.timing & TIMING_FLAG.SALV){
        cls.push("salv");
        key |= 1;
      }
      if((td.timing & TIMING_FLAG.STATIC) && !(td.timing & TIMING_FLAG.NOT_TEMPORARY)){
        cls.push("temporary");
        key |= 2;
      }
      key = split ? map.size : tag.index + TAG_MAX * key;
      if(bonus && !split && map.has(key)) bonus = map.get(key)[5].concat(bonus);
      map.set(key, [name, cls, td.condition, tooltip, tag.bdi & 3, bonus]);
    };
    RANGE.forEach(function(x){
      header.push(t(x.name));
    });
    card.tag.forEach(function(tags, ti){
      var ex = [[], []];
      tags.forEach(function(td){
        var i = ti;
        var tag = TAG[td.value % TAG_MAX];
        var name = t(tag.name);
        var ei = td.value > TAG_MAX ? 1 : 0;
        var tooltip = t(tag.description);
        var bonus = "";
        if(tag.timing) tooltip = t(TAG[tag.timing].name) + "\n" + (tooltip || t("追加スキル/Additional Skill"));
        if(tag.link){
          var nth = 0;
          tooltip = tooltip.replace(/\$/g, function(){
            return t(TAG[tag.link.length ? tag.link[nth++] : tag.link].name);
          });
        }
        if(tag.type === TAG_TYPE.STATUS_GROUP || tag.type === TAG_TYPE.WEAPON_GROUP) return;
        if(i > 2){
          if(ex[ei].indexOf(tag.index) !== -1) return;
          if(i === 5 && tag.subset.length) ex[ei] = ex[ei].concat(tag.subset);
          if(tag.variant.length) ex[ei] = ex[ei].concat(tag.variant);
        }else{
          if(ex[ei].indexOf(tag.index) !== -1 && td.skip) return;
          if(tag.category.length){
            ex[ei] = ex[ei].concat(tag.category);
            if(!tag.reading || tag.reading.indexOf(" ") !== -1) name = t(TAG[tag.category[0]].name);
          }
        }
        switch(i){
          case 3:
          case 4:
            if(!td.bonus.length) return;
            bonus = td.bonus.map(function(b){
              return TAG[b].description;
            });
            if(tag.type === TAG_TYPE.SKILL && tag.subset.length){
              var skills = tag.subset.map(function(sub){
                return t(TAG[sub].name);
              });
              if(tag.name.indexOf("スキル") === -1) skills.unshift(name);
              tooltip = skills.join("\n");
            }
            if(!tooltip) tooltip = name;
//            if(td.value > TAG_MAX && (td.timing & TIMING_FLAG.NOT_TEMPORARY)) i = 0;
            break;
          case 5:
            name = nullify(name);
            break;
        }
        if(i < 3){
          if(tag.type === TAG_TYPE.STATIC){
            var tm = 3;
            ["移動力", "強制", "率"].some(function(w, n){
              if(tag.name.indexOf(w) === -1) return false;
              tm = n;
              return true;
            });
            if(!tag.name.match(/^(?:特[攻防]|デメリット|武器種弱点|.+に貫通)/)) push(st[tm][1], name, td, tooltip, tag, bonus);
            return;
          }else if(tag.target && !tooltip){
            if(tag.bonus){
              tooltip = t(TAG[tag.bonus].name);
            }else{
              var target = TAG[tag.target];
              if(target.subset.length){
                tooltip = target.subset.map(function(sub){
                  return nullify(t(TAG[sub].name));
                }).join("\n");
              }else{
                tooltip = nullify(t(target.name));
              }
            }
          }
          if(tag.bdi & TAG_BDI.IRREMOVABLE){
            tooltip = (tooltip || name) + "\n\n" + t("解除不可/Irremovable");
          }
          bits(td.timing & TIMING_FLAG.ANY).forEach(function(n){
          
            push(data[n][i + 1], name, td, tooltip, tag, bonus);
          });
        }else if(td.timing || i !== 5){
          if(i === 3 && tag.type !== TAG_TYPE.SKILL) i += 3;
          push(st[i + 1][1], name, td, tooltip, tag, bonus);
        }
      });
    });
    data = data.concat(st);
    data.push(header);
    if(!table.firstChild){
      var caption = document.createElement("caption");
      table.appendChild(caption);
      data.forEach(function(row, ri){
        var tr = document.createElement("tr");
        row.forEach(function(d, ci){
          var cell = document.createElement(ri && ci ? "td" : "th");
          tr.appendChild(cell);
        });
        table.appendChild(tr);
      });
    }
    order.forEach(function(index, ri){
      var row = data[index];
      var hide = true;
      var tr = table.rows[ri];
      row.forEach(function(d, ci){
        var cell = tr.cells[ci];
        if(ri && ci){
          while(cell.firstChild) cell.removeChild(cell.firstChild);
          d.forEach(function(x){
            var div = document.createElement("div");
            var span = document.createElement("span");
            if(x[2] && details){
              var cds = document.createElement("div");
              cds.className = "cond";
              x[2].split("@").forEach(function(s){
                var pc = parseCondition(s);
                if((1 << pc[0]) & details){
                  var tl = TABLE_LABEL[pc[0]];
                  if(pc[1]){
                    var cond = document.createElement("span");
                
                    cond.textContent = pc[1];
                    cond.className = tl.data[0];
                    cds.appendChild(cond);
                    cds.appendChild(document.createElement("br"));
                  }else if(tl.data[1]){
                    cds.classList.add(tl.data[1]);
                  }
                  if(tl.data[1]) span.className = tl.data[1];
                }
              });
              if(cds.firstChild) div.appendChild(cds);
            }
            if(x[5]) x[0] += "[" + x[5].join("/") + "]";
            span.textContent = x[0];
            x[1].forEach(function(cls){
              span.classList.add(cls);
            });
            div.className = "tooltip";
            div.dataset.tooltip = x[3] || x[0];
            if(x[4]) div.classList.add(["", "buff", "debuff"][x[4]]);
            div.appendChild(span);
            cell.appendChild(div);
          });
          if(d.size) hide = false;
        }else{
          cell.textContent = d;
        }
      });
      tr.className = ri && hide ? "hide" : (count++ & 1) ? "odd" : "even";
    });
    table.caption.textContent = card;
    return table;
  }
};

function parseCondition(s){
  var value = s.slice(2);
  var type = "";
  var op = "";
  var suffix = "";
  switch(s[0]){
    case "h":
      type = "HP";
      suffix = "%";
      break;
    case "c":
      type = "CP";
      break;
    case "w":
      type = "Phase";
      break;
    case "p":
      type = "Ph.Turn";
      break;
    case "t":
      type = "Turn";
      break;
    case "o":
      suffix = "+1";
    case "e":
      return [LABEL_TYPE.FOMULA, "Turn = 2n" + suffix];
    case "s":
      return [LABEL_TYPE.PLUS, "Skill+"];
    case "x":
      return [LABEL_TYPE.PLUS, "CS+"];
    case "d":
      return [LABEL_TYPE.DEL, ""];
    case "v":
      return [LABEL_TYPE.COPY, "Copy"];
    case "z":
      return [LABEL_TYPE.ZERO, "0%"];
  }
  switch(s[1]){
    case "g":
      op = " ≥ ";
      break;
    case "l":
      op = " ≤ ";
      break;
    case "m":
      value = "100";
    case "e":
      op = " = ";
      break;
    case "n":
      op = " ≠ ";
      break;
    case "b":
      value = value.split("-");
      return [LABEL_TYPE.FOMULA, value[0] + suffix + " ≤ ", type + " ≤ " + value[1] + suffix];
  }
  return [LABEL_TYPE.FOMULA, type + op + value + suffix];
}