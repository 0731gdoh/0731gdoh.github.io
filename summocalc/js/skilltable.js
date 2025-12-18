"use strict";

function SkillTable(value){
  this.value = value;
}
SkillTable.prototype = {
  setValue: function(value){
    this.value = value;
  },
  write: function(){
    var card = this.value;
    var table = _("sd");
    var count = 0;
    var header = [""];
    var order = [27, 0, 1, 2, 19, 3, 4, 5, 6, 23, 26, 7, 8, 9, 10, 24, 11, 12, 13, 20, 14, 15, 25, 16, 17, 18, 21, 22];
    var data = TIMING.map(function(x){
      return [t(x.name), [], [], []];
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
      return [t(x), [], [], []];
    });
    var nullify = function(name){
      return t(name + "無効/Nullify " + name);
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
        var border = tag.bdi & 3;
        var condition = td.condition;
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
            ex[ei] = ex[ei].concat(tag.category.slice(1));
            if(!tag.reading || tag.reading.indexOf(" ") !== -1) name = t(TAG[tag.category[0]].name);
            ex[ei].push(tag.category[0]);
          }
        }
        switch(i){
          case 3:
          case 4:
            if(!td.bonus.length) return;
            var bonus = "[" + td.bonus.map(function(b){
              return TAG[b].description;
            }).join("/") + "]";
            if(tag.type === TAG_TYPE.SKILL && tag.subset.length){
              var skills = tag.subset.map(function(sub){
                return t(TAG[sub].name);
              });
              if(tag.name.indexOf("スキル") === -1) skills.unshift(name);
              tooltip = skills.join("\n");
            }
            if(!tooltip) tooltip = name;
            name += bonus;
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
            if(!tag.name.match(/^(?:特[攻防]|デメリット|武器種弱点|.+に貫通)/)) st[tm][1].push([name, td.timing, condition, tooltip, border]);
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
          
            data[n][i + 1].push([name, td.timing, condition, tooltip, border]);
          });
        }else if(td.timing || i !== 5){
          if(i === 3 && tag.type !== TAG_TYPE.SKILL) i += 3;
          st[i + 1][1].push([name, td.timing, condition, tooltip, border]);
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
      table.className = "skilldata";
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
            if(x[2]){
              var cds = document.createElement("div");
              cds.className = "cond";
              x[2].split("@").forEach(function(s){
                var cond = document.createElement("span");
                var pc = parseCondition(s);
                cond.textContent = pc[0];
                cond.className = pc[1];
                if(pc[1] === "zero") span.className = "zeroline";
                cds.appendChild(cond);
                cds.appendChild(document.createElement("br"));
              });
              div.appendChild(cds);
            }
            span.textContent = x[0];
            if(x[1] & TIMING_FLAG.SALV) span.classList.add("salv");
            if((x[1] & TIMING_FLAG.STATIC) && !(x[1] & TIMING_FLAG.NOT_TEMPORARY)) span.classList.add("temporary");
            div.className = "tooltip";
            div.dataset.tooltip = x[3] || x[0];
            if(x[4]) div.classList.add(["", "buff", "debuff"][x[4]]);
            div.appendChild(span);
            cell.appendChild(div);
          });
          if(d.length) hide = false;
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
      return ["Turn = 2n" + suffix, "fomula"];
    case "v":
      return ["Copy", "copy"];
    case "z":
      return ["0%", "zero"];
  }
  switch(s[1]){
    case "g":
      op = " ≥ ";
      break;
    case "l":
      op = " ≤ ";
      break;
    case "e":
      op = " = ";
      break;
    case "n":
      op = " ≠ ";
      break;
    case "b":
      value = value.split("-");
      return [[value[0], suffix, " ≤ ", type, " ≤ ", value[1], suffix].join(""), "fomula"];
  }
  return [[type, op, value, suffix].join(""), "fomula"];
}