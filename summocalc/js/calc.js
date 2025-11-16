"use strict";

var LINE = "－－－－－－－－－－－－";

var FILTER = {
  VALUE: function(x){return x.getValue() - 0},
  OFFENSE: function(x){return x.group === 0 || x.group < 0},
  DEFENSE: function(x){return x.group === 1 || x.group < 0},
  NAME: function(x){return x.name},
  NOT_CS: function(x){return x.getValue() & TIMING_FLAG.NOT_CS}
};

function r2n(r, cs){
  switch(r){
    case 5:
      return 20;
    case 4:
      return 5;
    case 0:
      if(cs){
        if(cs >= CS.ORDER[5] - 1) return 20;
        if(cs >= CS.ORDER[4] - 1) return 5;
      }
    default:
      return 1;
  }
}

function Tab(id){
  this.label = _(id);
  this.set = new Set();
}
Tab.prototype = {
  getMarkDirty: function(defaultValue, id, skip){
    var o = _("l" + id);
    var c = this;
    return function(value){
      if(value !== defaultValue){
        if(!skip) o.classList.add("dirty");
        c.set.add(id);
      }else{
        if(!skip) o.classList.remove("dirty");
        c.set.delete(id);
      }
      if(c.set.size){
        c.label.classList.add("dirty");
      }else{
        c.label.classList.remove("dirty");
      }
    };
  }
};

var calc = {
  version: 1,
  atk: 4000,
  weapon: 1,
  cs: CS.ORDER[3],
  cLv: 1,
  card: 0,
  lv: 1,
  es: EffectParameter.createList(),
  usecs: 0,
  ar: 0,
  arLv: 1,
  multiplier: 0,
  skilltable: 0,
  separator: 0,
  active: 1,
  defaultHash: "",
  savedata: [],
  init: function(){
    var c = this;
    if(navigator.share){
      _("cc").style.display = "none";
    }else{
      _("sr").style.display = "none";
      _("su").style.display = "none";
    }
    if(navigator.standalone !== false) _("ms").style.display = "none";
    this.loadLanguage();
    this.cardfilter.init();
    this.arfilter.init();
    linkInput(c, "atk", "a");
    linkInput(c, "weapon", "w");
    linkInput(c, "cs", "cs", function(){
      setText("sax", "+" + r2n(CARD[c.card].rarity, c.cs));
    });
    linkInput(c, "cLv", "cl");
    linkInput(c, "usecs", "uc");
    linkInput(c, "version", "sv");
    linkInput(c, "multiplier", "am");
    linkInput(c, "card", "pc", function(){
      if(c.active) c.updateEffectOptions();
      c.updateMultiplierOptions();
      c.checkCardSelected();
      c.arfilter.update(c.card);
      setText("sax", "+" + r2n(CARD[c.card].rarity, c.cs));
      if(c.card) c.skilltable = c.card;
      c.writeTable();
    });
    _("pl").max = 70 + MAX_LEVEL_SEED;
    linkInput(c, "lv", "pl");
    linkInput(c, "ar", "rc", function(){
      if(c.active) c.updateEffectOptions();
      c.cardfilter.updateEquipableOptions(c.ar);
      setText("rx", "+" + r2n(AR[c.ar].arRarity));
    });
    linkInput(c, "arLv", "rl");
    this.separator = getStorageItem("separator") === "1";
    linkInput(c, "separator", "ts", function(){
      setStorageItem("separator", c.separator ? "1" : "0");
    });
    this.updateSaveMenu();
    window.addEventListener("storage", function(){
      c.updateSaveMenu();
    });
    window.addEventListener("pageshow", function(e){
      if(e.persisted) c.updateSaveMenu();
    });
    _("svd").onclick = function(){
      c.saveToStorage();
    };
    _("ldd").onclick = function(){
      c.loadFromStorage();
    };
    _("dld").onclick = function(){
      c.deleteFromStorage();
    };
    _("sl").onclick = function(){
      c.setLanguage(1 - language);
    };
    _("oa").onclick = function(){
      c.addStatus(v("os"), v("el"), 0, v("al") * 2);
    };
    _("or").onclick = function(){
      c.addStatus(v("os"), 0, 0);
    };
    _("da").onclick = function(){
      c.addStatus(v("ds"), v("el"), 1, v("al") * 2);
    };
    _("dr").onclick = function(){
      c.addStatus(v("ds"), 0, 1);
    };
    _("ea").onclick = function(){
      setValue("el", 1);
    };
    _("em").onclick = function(){
      setValue("el", 100);
    };
    _("uc").onclick = function(){
      this.blur();
    };
    _("cc").onclick = function(){
      copyText("o");
    };
    _("sr").onclick = function(){
      share({
        title: document.title,
        text: _("o").value
      });
    };
    _("su").onclick = function(){
      share({
        title: document.title,
        text: document.title,
        url: location.href
      });
    };
    _("rd").onclick = function(){
      selectRandomly("pc");
    };
    _("rcb").onclick = function(){
      selectRandomly("pc");
    };
    _("fv").onclick = function(){
      c.cardfilter.toggle();
    };
    _("fr").onclick = function(){
      c.cardfilter.reset();
    };
    _("rrd").onclick = function(){
      selectRandomly("rc");
    };
    _("rv").onclick = function(){
      c.arfilter.toggle();
    };
    _("rfr").onclick = function(){
      c.arfilter.reset();
    };
    _("lm").onclick = function(){
      setValue("pl", CARD[c.card].maxLv);
      c.update();
    };
    _("lx").onclick = function(){
      setValue("pl", v("pl") + 1);
      c.update();
    };
    _("lz").onclick = function(){
      setValue("pl", v("pl") + 10);
      c.update();
    };
    _("ly").onclick = function(){
      setValue("pl", v("pl") - 10);
      c.update();
    };
    _("saa").onclick = function(){
      setValue("cl", 1);
      c.update();
    };
    _("sam").onclick = function(){
      setValue("cl", 100);
      c.update();
    };
    _("sax").onclick = function(){
      setValue("cl", v("cl") + r2n(CARD[c.card].rarity, c.cs));
      c.update();
    };
    _("ra").onclick = function(){
      setValue("rl", 1);
      c.update();
    };
    _("rm").onclick = function(){
      setValue("rl", 100);
      c.update();
    };
    _("rx").onclick = function(){
      setValue("rl", v("rl") + r2n(AR[c.ar].arRarity));
      c.update();
    };
    _("rz").onclick = function(){
      var x = v("rl");
      setValue("rl", x - x % 10 + 10);
      c.update();
    };
    _("rs").onclick = function(){
      if(confirm(t("リセットしますか？/Are you sure you want to reset?"))){
        setValue("os", 0);
        setValue("ds", 0);
        c.load(c.defaultHash);
        checkUpdate();
      }
    };
    _("ri").onclick = function(){
      var o = _("rc").options;
      var r = [];
      for(var i = 1; i < o.length; i++) r.push(AR[o[i].value].getInfo());
      _("o").value = r.join("\n\n");
    };
    document.forms[0].onfocusin = function(e){
      var elem = e.target;
      if(elem.type === "number") setTimeout(function(){
        try{
          elem.setSelectionRange(0, elem.value.length);
        }catch(e){
          elem.select();
        }
      }, 0);
    };
    _("dj").onclick = function(){
      download(Card.csv(CARD, language), "text/csv", t("housamo_card_ja.csv/housamo_card_en.csv"));
    };
    _("aj").onclick = function(){
      download(Record.csv(AR, language), "text/csv", t("housamo_ar_ja.csv/housamo_ar_en.csv"));
    };
    _("dm").selectedIndex = parseInt(document.documentElement.dataset.theme) || 0;
    _("dm").onchange = function(){
      var x = _("dm").selectedIndex;
      document.documentElement.dataset.theme = x;
      if(x){
        setStorageItem("theme", x);
      }else{
        removeStorageItem("theme");
      }
    };
    _("sci").onchange = function(){
      _("dw").style.display = _("sci").checked ? "block" : "none";
    };
    this.save();
    this.load(location.hash.slice(1), true);
  },
  save: function(){
    var s = new Encoder();
    var n = 0;
    var tmp = [];
    var bonus = [];
    var card = CARD[this.card];
    var ar = AR[this.ar];
    s.write(card.id);
    if(card.canEquip(ar, true)){
      s.write(ar.id);
    }else{
      s.write(AR[0].id);
    }
    s.write(this.usecs);
    s.write(this.cLv);
    s.write(this.arLv);
    s.write(this.version);
    if(this.card){
      s.write(this.lv);
    }else{
      s.write(this.atk);
      s.write(this.weapon);
      s.write(this.cs);
    }
    s.write(this.multiplier);
    s.write(0); //evt
    s.write(0); //wc
    s.write(0); //csc
    this.es.some(function(v, i){
      if(v.loop){
        var e = v.effect;
        if(e.sp){
          var loop = v.loop;
          if(e.link && EFFECT[e.link].isToken() && !e.isNonStatus()) loop += 100;
          if(e.sp[1] > TAG_MAX) loop += 200;
          bonus.push(e.sp[0]);
          bonus.push(e.sp[1] % TAG_MAX);
          bonus.push(loop);
        }else if(v.alt && !v.altLength){
          bonus.push(e.index);
          if(e.hasHpRef()){
            bonus.push(v.hp);
            bonus.push(v.maxHp);
          }else{
            bonus.push(v.lv);
            bonus.push(v.loop);
          }
        }else if(bonus.length){
          return true;
        }else{
          s.write(i - n);
          n = i;
          if(!e.isFixed() || !e.isStackable()){
            var lv = v.lv;
            if(e.link && EFFECT[e.link].isToken() && !e.isNonStatus()) lv += 1000;
            tmp.push(lv);
          }
          if(e.isStackable()) tmp.push(v.loop);
          if(e.hasHpRef()){
            tmp.push(v.hp);
            tmp.push(v.maxHp);
          }
          if(e.type === TYPE.ATK && e.isAffiliation()) tmp.push(v.unit);
          if(e.type === TYPE.CUSTOM){
            var c = v.getCustomMul();
            tmp.push(c.n);
            tmp.push(c.d);
            tmp.push(v.a);
          }
        }
      }
      return false;
    });
    s.write(0);
    tmp.forEach(function(v){
      s.write(v);
    });
    s.write(bonus.length);
    bonus.forEach(function(v){
      s.write(v);
    });
    s = s.toString();
    if(!this.defaultHash){
      this.defaultHash = s;
    }else if(s === this.defaultHash){
      history.replaceState(null, "", location.pathname);
    }else{
      history.replaceState(null, "", location.pathname + "#" + s);
    }
  },
  load: function(x, skipSave){
    var s = new Decoder(x);
    if(s.data){
      var complete;
      var tmp = [];
      var n = s.read();
      var index = 1;
      CARD.some(function(v, i){
        if(v.id === n){
          index = i;
          return true;
        }
        return false;
      });
      this.active = 0;
      if(this.cardfilter.active) this.cardfilter.toggle();
      if(this.arfilter.active) this.arfilter.toggle();
      this.cardfilter.reset();
      this.arfilter.reset();
      if(!index) this.skilltable = 0;
      setValue("pc", index);
      n = s.read();
      index = 0;
      AR.some(function(v, i){
        if(v.id === n){
          index = i;
          return true;
        }
        return false;
      });
      setValue("rc", index);
      setValue("uc", s.read());
      setValue("cl", s.read());
      setValue("rl", s.read());
      setValue("sv", s.read());
      if(this.card){
        setValue("pl", s.read());
      }else{
        setValue("pl", 1);
        setValue("a", s.read());
        setValue("w", s.read());
        setValue("cs", s.read());
      }
      setValue("am", s.read());
      s.read(); //evt
      s.read(); //wc
      s.read(); //csc
      while(1){
        n = s.read();
        if(!n) break;
        tmp.push(n);
      }
      n = tmp.shift();
      this.es.forEach(function(v){
        v.clear();
      });
      complete = !n;
      if(n) this.es.some(function(v, i, es){
        if(i === n){
          var e = v.effect;
          var lv = 1;
          var loop = 1;
          var owLv = 0;
          var loopOw = false;
          if(e.sp) return true;
          if(e.group === 2 && e.link){
            v = es[e.link];
            owLv = e.baseValue[0];
          }
          if(!e.isFixed() || !e.isStackable()){
            lv = s.read();
            if(e.link && EFFECT[e.link].isToken() && !e.isNonStatus()){
              if(lv < 1000){
                es[e.link].setLevel(1, 1);
              }
              lv %= 1000;
              if(EFFECT[e.link].isStackable() && es[e.link].loop) loopOw = true;
            }
          }
          if(e.isStackable()){
            loop = s.read();
            if(loopOw) es[e.link].loop = loop;
          }
          v.setLevel(owLv || lv, loop);
          if(e.hasHpRef()){
            var hp = s.read();
            var maxHp = s.read();
            v.setHp(hp, maxHp);
          }
          if(e.type === TYPE.ATK && e.isAffiliation()) v.unit = s.read();
          if(e.type === TYPE.CUSTOM){
            var cn = s.read();
            var cd = s.read();
            var ca = s.read();
            v.setCustom(cn, cd, ca);
          }
          if(!tmp.length){
            complete = true;
            return true;
          }
          n += tmp.shift();
        }
        return false;
      });
      n = s.read();
      if(complete && n){
        var bonus = [];
        var es = this.es;
        while(n > 0){
          var be = s.read();
          var bt = s.read();
          var bl = s.read();
          if(!be || !bl) break;
          bonus.push([be, bt, bl]);
          n -= 3;
        }
        if(!n) bonus.forEach(function(v){
          var ep = es[v[0]];
          var e = EFFECT[v[0]];
          if(!e || !ep) return;
          if(ep.subsetOrder){
            var flag = Math.floor(v[2] / 100);
            v[2] %= 100;

            if(flag & 2) v[1] += TAG_MAX;
            n = e.subset.get(v[1]);
            if(!n) return;
            e = EFFECT[n];
            if(!e) return;
            if(e.link && EFFECT[e.link].isToken() && !e.isNonStatus()){
              if(!(flag & 1)) es[e.link].setLevel(1, 1);
              if(es[e.link].loop && EFFECT[e.link].isStackable()) es[e.link].loop = Math.min(v[2], 15);
            }
            es[n].setLevel(1, v[2]);
          }else if(ep.altLength){
            if(e.hasHpRef()){
              ep.setHp(v[1], v[2]);
            }else{
              ep.setLevel(v[1], v[2]);
            }
          }
        });
      }
      this.updateEffectOptions();
      this.active = 1;
    }
    this.update(skipSave);
  },
  addStatus: function(index, lv, group, mode){
    if(index > EFFECT_MAX){
      mode = Math.floor(index / EFFECT_MAX);
      index %= EFFECT_MAX;
    }
    if(index > 0){
      var ep = this.es[index];
      var e = ep.effect;
      if(lv){
        if(e.promptData){
          lv = e.promptData.prompt(ep);
          if(lv === null) return;
        }else if(e.isAffiliation()){
          lv = 0;
          while(lv < 1 || lv > 10){
            lv = prompt(t("効果Lv (※1〜10)/Effect Lv\n(1-10)"), ep.lv || "");
            if(!lv) return;
            lv = parseInt(lv, 10) || 0;
          }
          if(e.type === TYPE.ATK){
            var u = 0;
            while(u < 1 || u > 5){
              u = prompt(t("所属メンバー (※1〜5)/Guildmates\n(1-5)"), ep.unit || "");
              if(!u) return;
              u = parseInt(u, 10) || 0;
            }
            ep.setUnitNum(u);
          }
        }else if(mode == 1){
          lv = 0;
        }else if(mode == 2 && !e.isFixed()){
          lv = 0;
          while(lv < 1 || lv > 100){
            lv = prompt(t("効果Lv (※1〜100)/Effect Lv\n(1-100)"), "");
            if(!lv) return;
            lv = parseInt(lv, 10) || 0;
          }
        }

        if(e.type === TYPE.CUSTOM && !ep.loop){
          if(!ep.customPrompt()) return;
        }

        if(e.type === TYPE.LIMIT){
          if(!ep.hpPrompt()) return;
        }else if(e.type === TYPE.SEED){
          lv = e.baseValue[1];
          if(!lv){
            while(lv < 1 || lv > 2000){
              lv = prompt(t("ATK+ (※1〜2000)/ATK+\n(1-2000)"), ep.exclusive[0].lv || "");
              if(!lv) return;
              lv = parseInt(lv, 10) || 0;
            }
          }
        }else if(e.isFixed() || e.isLv1()){
          lv = 1;
        }
        if(e.link){
          var tEp = this.es[e.link];
          var tE = EFFECT[e.link];
          var tLv = 0;
          if(e.type === TYPE.DEBUFF_OVERWRITE){
            tLv = -1;
            while(tLv < 0 || tLv > 15 || isNaN(tLv)){
              tLv = prompt(t("/Number of ") + tE + t("の数 (※0〜15)/\n(0-15)"), "");
              if(!tLv) break;
              tLv = parseInt(tLv, 10);
            }
            if(tLv){
              tEp.setLevel(1, tLv);
            }else if(tLv === 0){
              tEp.clear();
            }
          }else if(tEp.getLoopSum()){
            if(tE.isStackable() && tEp.loop && ep.loop){
              tLv = tEp.lv;
              this.addStatus(e.link, tLv || 1, undefined, tLv ? 0 : 1);
            }
          }else if(!e.isNonStatus()){
            if(tE.isFixed() || tE.isLv1()){
              if(confirm(t("/Add ") + tE + t("を追加/"))) tLv = 1;
            }else{
              while(tLv < 1 || tLv > 100){
                tLv = prompt(t("/Add ") + tE + t("を追加 (※Lv.1〜100)/\n(Lv.1-100)"), "");
                if(!tLv) break;
                tLv = parseInt(tLv, 10) || 0;
              }
            }
            if(tLv) this.addStatus(e.link, tLv);
          }
        }
        if(lv >= 0) ep.setLevel(lv);
      }else{
        ep.decrementLoop();
      }
    }else if(!lv && confirm(t("全ての【/Are you sure you want to remove all 【") + t(["攻撃/Offense", "防御/Defense"][group]) + t("側補正】を削除しますか？/】 effects?"))){
      this.es.forEach(function(ep){
        if(ep.effect.group === group) ep.clear();
      });
    }
    this.update();
    this.updateEffectOptions();
  },
  loadLanguage: function(){
    language = parseInt(getStorageItem("language") || 0, 10);
    this.updateTexts();
  },
  setLanguage: function(x){
    language = x;
    setStorageItem("language", x);
    this.updateTexts();
    this.active = 0;
    this.cardfilter.update();
    this.arfilter.update();
    this.active = 1;
    this.update();
  },
  updateTexts: function(){
    this.active = 0;
    setOptions("sv", VERSION);
    setOptions("dm", THEME);
    setOptions("w", WEAPON, {filter: FILTER.NAME});
    setOptions("cs", CS, {filter: FILTER.VALUE});
    this.updateMultiplierOptions();
    this.updateEffectOptions();
    setTextAll([
      ["lsv", "モード/Mode"],
      ["ldm", "テーマ/Theme"],
      ["lsci", "スキルテーブルを表示/Show Skill Table"],
      ["rcb", "ランダム/Random"],
      ["lpc", "カード/Card"],
      ["lpl", "カードLv/Card Lv"],
      ["lw", "武器/Weapon"],
      ["lcl", "神器Lv/S.A.Lv"],
      ["luc", "CSを使用/Use CS"],
      ["lrc", "AR"],
      ["lrl", "AR Lv"],
      ["los", "攻撃側/Offense"],
      ["oa", "追加/Add"],
      ["or", "削除/Remove"],
      ["lds", "防御側/Defense"],
      ["da", "追加/Add"],
      ["dr", "削除/Remove"],
      ["lel", "効果Lv/Effect Lv"],
      ["lal", "毎回尋ねる/Ask Each Time"],
      ["lam", "属性相性/Attribute"],
      ["lts", "3桁区切り/Thousands Separator"],
      ["cc", "コピー/Copy"],
      ["sr", "結果を共有/Share Result" ],
      ["su", "URLを共有/Share URL"],
      ["rs", "リセット/Reset"],
      ["sl", "English/日本語"],
      ["dd", "カードデータ: /Card Data: "],
      ["ad", "ARデータ: /AR Data: "],
      ["cg", "更新履歴/Updates"],
      ["ms", "「ホーム画面に追加」機能でインストールできます/You can install this by 'Add to Home Screen'."],
      ["um", "新しいデータがあります/New data is available."],
      ["ub", "更新/Update"],
      ["svd", "保存/Save"],
      ["ldd", "読込/Load"],
      ["dld", "削除/Delete"]
    ]);
    this.writeTable();
    this.cardfilter.updateTexts(this.ar);
    this.arfilter.updateTexts();
    this.active = 1;
  },
  updateSaveMenu: function(){
    var list = [];
    var data = [];
    for(var i = 0; i < 9; i++){
      var label = "#" + (i + 1) + ": ";
      var value = getStorageItem("slot" + i).split("#");
      if(value.length === 2 && value[0] && value[1]){
        var name = decodeURIComponent(value[0]);
        if(name.length > 49) name = name.slice(0, 49) + "…";
        list.push(label + name);
        data.push(value[1]);
      }else{
        list.push(label);
        data.push("");
      }
    }
    setOptions("ssf", list);
    this.savedata = data;
  },
  saveToStorage: function(){
    var i = Math.max(_("ssf").selectedIndex, 0);
    var label = "#" + (i + 1);
    if(!this.savedata[i] || confirm(t(label + " に上書きしますか？/Are you sure you want to overwrite to " + label + " ?"))){
      var pattern = /[\\\/:*?"<>|]/; //"
      var name = prompt(t("名前を付けて保存/Save As"), CARD[this.card]) || "";
      if(pattern.test(name)){
        alert(t("名前には次の文字は使えません/A name can't contain any of the following characters") + ':\n\\ / : * ? " < > |');
      }else if(name){
        var data = location.hash;
        if(data.length < 2) data = "#" + this.defaultHash;
        if(name.length > 50) name = name.slice(0, 50);
        setStorageItem("slot" + i, encodeURIComponent(name) + data);
        this.updateSaveMenu();
      }
    }
  },
  loadFromStorage: function(){
    var i = Math.max(_("ssf").selectedIndex, 0);
    var label = "#" + (i + 1);
    if(this.savedata[i] && confirm(t(label + " を読込みますか？/Are you sure you want to load " + label + " ?"))){
      this.load(this.savedata[i]);
    }
  },
  deleteFromStorage: function(){
    var i = Math.max(_("ssf").selectedIndex, 0);
    var label = "#" + (i + 1);
    if(this.savedata[i] && confirm(t(label + " を削除しますか？/Are you sure you want to delete " + label + " ?"))){
      removeStorageItem("slot" + i);
      this.updateSaveMenu();
    }
  },
  updateEffectOptions: function(){
    var p = ["", "{CS} ", "[AR] "];
    var es = this.es;
    var card = CARD[this.card];
    var ar = AR[this.ar];
    var order = [0];
    var labels = ["追加済み/Added", "ピックアップ/PICK UP"];
    EFFECT.LOCALE_ORDER[language].forEach(function(x){
      var ep = es[x];
      if(ep.loop) order.push(x);
      if(ep.altLength){
        ep.alt.forEach(function(z){
          if(z.loop) order.push(z.index);
        });
      }else if(ep.subsetOrder){
        ep.subsetOrder[language].forEach(function(z){
          if(es[z].loop) order.push(z);
        });
      }
    });
    order.push(0);
    order = order.concat(card.effects[0], card.effects[2]);
    if(card.canEquip(ar, true)) ar.effects.forEach(function(x){
      order.push(EFFECT_MAX * 2 + x);
    });
    order = order.concat(EFFECT.LOCALE_ORDER[language]);
    setOptions("os", es, {filter: FILTER.OFFENSE, order: order, labels: labels.concat(EFFECT.LABELS[0]), divisor: EFFECT_MAX, prefixes: p});
    setOptions("ds", es, {filter: FILTER.DEFENSE, order: order, labels: labels.concat(EFFECT.LABELS[1]), divisor: EFFECT_MAX, prefixes: p});
  },
  updateMultiplierOptions: function(){
    setOptions("am", MULTIPLIER, {labels: MULTIPLIER.LABELS, divisor: 100, prefixes: ["", this.card ? ATTRIBUTE[CARD[this.card].attribute] : "？"]});
  },
  checkCardSelected: function(){
    if(this.card){
      _("a").disabled = true;
      _("w").disabled = true;
      _("cs").disabled = true;
    }else{
      _("a").disabled = false;
      _("w").disabled = false;
      _("cs").disabled = false;
      _("a").value = this.atk;
      _("w").value = this.weapon;
      _("cs").value = this.cs;
    }
  },
  writeTable: function(){
    var card = CARD[this.skilltable];
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
        var condition = "";
        if(td.condition){
          var cx = ["", "", td.condition.slice(3), ""];
          switch(td.condition[1]){
            case "h":
              cx[0] = "HP ";
              cx[3] = "%";
              break;
            case "c":
              cx[0] = "CP ";
              break;
            case "w":
              cx[0] = "Phase ";
              break;
            case "p":
              cx[0] = "Ph.Turn ";
              break;
            case "t":
              cx[0] = "Turn ";
              break;
            case "z":
              cx[0] = "0%";
              break;
          }
          switch(td.condition[2]){
            case "g":
              cx[1] = "≥ ";
              break;
            case "l":
              cx[1] = "≤ ";
              break;
            case "e":
              cx[1] = "= ";
              break;
          }
          condition = cx.join("");
        }
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
            if(td.value > TAG_MAX && (td.timing & TIMING_FLAG.NOT_TEMPORARY)) i = 0;
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
              var cond = document.createElement("span");
              cond.textContent = x[2];
              cond.className = x[2].length > 2 ? "condition" : "zero";
              div.appendChild(cond);
              div.appendChild(document.createElement("br"));
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
  },
  update: function(skipSave){
    var es = this.es;
    var dmg = new Fraction(1);
    var exdmg = 0;
    var atk = this.atk;
    var exatk = new Fraction(0);
    var atkbonus = [];
    var weapon = this.weapon;
    var cs = this.cs;
    var csrate = 1;
    var card = CARD[this.card];
    var ar = AR[this.ar];
    var multiplier = this.multiplier;
    var separator = this.separator ? separate : function(x){return x};
    var desc = [];
    var params = [];
    var result = [
      t("【カード】/【Card】"),
      "　[Lv.---]",
      "",
      LINE,
      t("【パラメータ】/【Parameter】"),
      t("　ATK: "),
      t("　武器: /　Weapon: "),
      LINE
    ];
    if(this.card){
      atk = card.getValue(this.lv, this.version === 2);
      weapon = card.weapon[this.usecs];
      cs = CS.ORDER[card.rarity] + card.csBoost;
      setValue("a", atk, true);
      setValue("w", weapon, true);
      setValue("cs", cs, true);
      result[1] = "　[Lv." + pad(this.lv, 3) + "]　" + card;
    }
    if(this.ar && card.canEquip(ar, true)){
      var stef = [];
      exatk = ar.getValue(this.arLv);
      cs += ar.csBoost;
      if(exatk > 0) stef.push("ATK+" + separator(exatk));
      if(ar.csBoost > 0) stef.push(t("CS威力" + ["増加/I", "大増/Greatly i"][ar.csBoost - 1] + "ncrease CS Damage"));
      if(ar.csWeapon){
        if(this.usecs) weapon = ar.csWeapon;
        stef.push(WEAPON[ar.csWeapon] + "CS");
      }
      result[2] = "　[Lv." + pad(this.arLv, 3) + "]　" + ar;
      if(stef.length) result[2] += " (" + stef.join(", ") + ")";
    }
    if(this.usecs){
      csrate = CS[cs].getValue() * (1 + Math.LOG10E * Math.log(this.cLv) / 2);
      result.push(
        t("【チャージスキル】/【Charge Skill】"),
        "　{Lv." + pad(this.cLv, 3) + "}　" + CS[cs] + t(" (x/ (") + csrate + t(")/x)"),
        LINE
      );
    }
    EFFECT.LOCALE_ORDER[language].forEach(function(v){
      if(v){
        var ep = es[v];
        params.push(ep);
        if(ep.altLength){
          ep.alt.forEach(function(x){
            params.push(x);
          });
        }else if(ep.subsetOrder){
          ep.subsetOrder[language].forEach(function(x){
            params.push(es[x]);
          });
        }
      }
    });
    for(var group = 0; group < 2; group++){
      var buffed = false;
      var debuffed = false;
      var dow = undefined;
      es.some(function(ep, i){
        var e = ep.effect;
        if(!ep.loop) return false;
        if(!buffed && e.isBuff(group)) buffed = true;
        if(!debuffed && e.isDebuff(group)) debuffed = true;
        if(e.type === TYPE.DEBUFF_OVERWRITE && e.group === group) dow = e.getValue(1, false, false);
        return buffed && debuffed && dow;
      });
      desc = [];
      result.push(t([
        "【攻撃側補正】/【Offense】",
        "【防御側補正】/【Defense】"
      ][group]));
      for(var i = 0; i < params.length; i++){
        var count = 0;
        var ep = params[i];
        var e = ep.effect;
        var eLv = ep.lv;
        var loop = ep.loop;
        var condition = false;
        if(e.group !== group) continue;
        if(e.isStackable()){
          if(loop && e.link && EFFECT[e.link].isStackable()){
            ep.loop = 1;
            loop = Math.max(es[e.link].getLoopSum(), 1);
          }
          count = loop;
        }
        if(
          (e.type === TYPE.REVERSAL && buffed) ||
          (e.link && es[e.link].getLoopSum()) ||
          (e.type === TYPE.NOT_BUFFED && buffed) ||
          (e.type === TYPE.NOT_DEBUFFED && debuffed)
        ) condition = true;
        while(loop--){
          var eV = e.getValue(e.promptData ? eLv : eLv || this.cLv, !this.version, condition);
          var x = eV[0];
          var modEType = e.type;
          var label = [];
          if(eLv || e.promptData){
            label.push("　[Lv.");
            label.push("]　");
          }else{
            label.push("　{Lv.");
            label.push("}　")
          }
          if(e.isFixed() || e.promptData){
            label.splice(1, 0, "---");
          }else{
            label.splice(1, 0, pad(eLv || this.cLv, 3));
          }
          if(count > 1) label.push(t("《x/《") + count + t("》/x》"));
          label.push(e);
          if(e.promptData) label.push(e.promptData.getLabel(ep));

          //連撃
          if(e.type === TYPE.COMBO && this.usecs) x = new Fraction(1);
          //極限
          if(e.type === TYPE.LIMIT){
            x = x.mul(2 * ep.maxHp - ep.hp, ep.maxHp);
            label.push("[HP:" + separator(ep.hp) + "/" + separator(ep.maxHp) + "]");
          }
          //カスタム
          if(e.type === TYPE.CUSTOM) x = ep.getCustomMul();
          //武器種弱点
          if(e.type === TYPE.WEAPON_WEAKNESS && !((1 << weapon) & eV[1])) x = new Fraction(1);
          //支援効果
          if(e.type === TYPE.ATK && e.isAffiliation()){
            x = x.add((ep.unit - 1) * 3, 10);
            label.push(t("[所属メンバー:/[Guildmates:") + ep.unit + "]");
          }

          if(dow && e.isDebuff(group)){
            if(!(x - 0 && x.n !== x.d)){
              x = dow[0];
            }else if(!e.isFixed()){
              if(group){
                x = x.add(e.getValue(-300, false, condition)[0]).add(dow[1]);
              }else{
                x = x.add(e.getValue(100, false, condition)[0]).add(dow[1]);
              }
              if(x <= 0) modEType = TYPE.ZERO;
            }
          }

          desc = [label.join("")];

          switch(modEType){
            case TYPE.BONUS:
            case TYPE.IGNORE:
              if(e.csOnly && !this.usecs) break;
            default:
              if(x - 0 && x.n !== x.d){
                dmg = dmg.mul(x);
                desc.push(t("x/") + x + t("/x"));
              }
              break;

            case TYPE.ATK:
              if(x - 0){
                atkbonus.push(x);
                desc.push("ATK+" + x.mul(100, 1) + "%");
              }
              break;

            case TYPE.ZERO:
              dmg = new Fraction(0);
              desc.push(t("x0/0x"));
              break;

            case TYPE.DEBUFF_OVERWRITE:
              break;
          }

          x = eV[1];

          //カスタム
          if(e.type === TYPE.CUSTOM) x = ep.getCustomAdd();
          //種
          if(e.type === TYPE.SEED) x = new Fraction(eLv);

          if(x - 0){switch(e.type){
            default:
              x = x.round();
              exdmg += x;
              desc.push(t("ダメージ/Damage") + (x < 0 ? "" : "+") + separator(x));
              break;

            case TYPE.SEED:
            case TYPE.ATK:
              exatk = exatk.add(x);
              desc.push("ATK" + (x < 0 ? "" : "+") + separator(x));
              break;

            case TYPE.WEAPON:
              if(!this.usecs) weapon = x.round();
              break;
              
            case TYPE.CSWEAPON:
              if(this.usecs) weapon = x.round();
              break;
              
            case TYPE.WEAPON_WEAKNESS:
            case TYPE.DEBUFF_OVERWRITE:
              break;
          }}
          if(!loop){
            if(desc.length > 1) desc = [desc[0], " (" + desc.slice(1).join(", ") + ")"];
            result.push(desc.join(""));
          }
        }
      }
      if(desc.length){
        result.push(LINE);
      }else{
        result.pop();
      }
    }
    atk = exatk.add(atk, 1);
    desc = [];
    if(exatk.n) desc.push((exatk < 0 ? "" : "+") + separator(exatk));
    atkbonus.forEach(function(x){
      atk = x.add(1, 1).mul(atk);
      desc.push("+" + x.mul(100, 1) + "%");
    });
    result[5] += separator(atk);
    if(desc.length) result[5] += " (" + desc.join(", ") + ")";
    result[6] += WEAPON[weapon];
    result.push(t("【ダメージ】/【Damage】"));
    dmg = dmg.mul(WEAPON[weapon].getValue());
    result[6] += t(" (x/ (") + WEAPON[weapon].getValue() + t(")/x)");
    if(multiplier > 4){
      multiplier = [
        [3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [3, 3, 3, 3, 3, 3, 3, 3, 3, 1, 4, 1],
        [3, 3, 4, 1, 3, 3, 2, 3, 4, 3, 3, 4],
        [3, 1, 3, 4, 3, 3, 2, 3, 4, 3, 3, 4],
        [3, 4, 1, 3, 3, 3, 2, 3, 4, 3, 3, 4],
        [3, 3, 3, 3, 3, 1, 2, 4, 3, 3, 3, 4],
        [3, 3, 3, 3, 1, 3, 2, 4, 3, 3, 3, 4],
        [3, 2, 2, 2, 2, 2, 2, 4, 1, 3, 3, 4],
        [3, 4, 4, 4, 3, 3, 1, 2, 4, 3, 3, 4],
        [3, 3, 3, 3, 4, 4, 4, 1, 2, 3, 3, 4],
        [4, 3, 3, 3, 3, 3, 3, 3, 3, 3, 1, 1],
        [1, 3, 3, 3, 3, 3, 3, 3, 3, 4, 3, 1],
        [4, 1, 1, 1, 1, 1, 1, 1, 1, 4, 4, 3]
      ][card.attribute][MULTIPLIER[multiplier % 100].getValue() - 1];
    }
    for(i = 1; i < 5; i++){
      var attr = MULTIPLIER[i];
      if(!multiplier || i === multiplier){
        x = Math.ceil(Math.max(dmg.mul(atk).mul(attr.getValue()).muln(csrate) + exdmg, 0));
        if(i === 3 || multiplier) this.setTitle(x);
        result.push("　[" + attr + "]: " + separator(x));
      }
    }
    result.push(LINE);
    if(this.version !== 1) result.push(
      t("　モード: /　Mode: ") + VERSION[this.version]
    );
    _("o").value = result.filter(function(x){return x}).join("\n");
    if(!skipSave) this.save();
  },
  setTitle: function(damage){
    document.title = "放サモ ダメージ計算機 - " + (this.card ? CARD[this.card] + " " : "") + damage + t("ダメージ/ damage");
  },
  cardfilter: {
    name: "",
    attribute: 0,
    weapon: 0,
    weaponChange: 0,
    cs: 0,
    csChange: 0,
    rarity: 0,
    obtain: 0,
    obtainMode: 0,
    limited: 0,
    variant: 0,
    guild: 0,
    guildMode: 0,
    school: 0,
    schoolMode: 0,
    team: 0,
    ef: [
      new EffectFilter(1, ["stf", "srf", "scf", "sef"]),
      new EffectFilter(2, ["stf", "srf", "scf", "sef"]),
      new StaticEffectFilter(["baf", "bdf", "nf", "pf", "zf"])
    ],
    ar: 0,
    external: 0,
    exclude: 0,
    defaultValues: new Map(),
    active: 0,
    init: function(){
      var c = this;
      this.tabs = [
        new Tab("ltb1"),
        new Tab("ltb2"),
        new Tab("ltb3")
      ];
      linkAll(c, [
        ["weaponChange", "wf_c"],
        ["csChange", "cf_c"],
        ["obtainMode", "obf_mode"],
        ["guildMode", "gf_mode"],
        ["schoolMode", "sf_mode"],
        ["external", "egf"],
        ["exclude", "ccf"]
      ]);
      linkAll(c, [
        ["name", "xf"],
        ["attribute", "ef"],
        ["weapon", "wf"],
        ["cs", "cf"],
        ["rarity", "rf"],
        ["obtain", "obf"],
        ["limited", "lmf"],
        ["variant", "vf"],
        ["ar", "qf"]
      ], this.tabs[0]);
      linkAll(c, [
        ["guild", "gf"],
        ["school", "sf"],
        ["team", "of"]
      ], this.tabs[1]);
      this.ef.forEach(function(ef){
        ef.init(c, c.tabs[2]);
      });
      this.update();
    },
    updateEquipableOptions: function(ar){
      var active = this.active;
      var order = [0].concat(AR.ORDER);
      var labels = ["装備中/Equipped"].concat(AR.LABELS);
      var value = v("qf");
      this.active = 0;
      if(ar) order.splice(1, 0, ar);
      setOptions("qf", AR, {order: order, labels: labels});
      setValue("qf", value);
      this.active = active;
    },
    updateTexts: function(ar){
      var active = this.active;
      this.active = 0;
      this.updateToggleText();
      setCheckGroup("ef", ATTRIBUTE);
      setCheckGroup("wf", WEAPON, {check: "武器種変更を含む/Include Weapon Change"});
      setCheckGroup("cf", WEAPON, {check: "CS変更を含む/Include Change CS"});
      setCheckGroup("rf", RARITY);
      setCheckGroup("obf", OBTAIN, {select: OR_AND_NOT});
      setOptions("lmf", LIMITED);
      setOptions("vf", VARIANT, {labels: VARIANT.LABELS});
      this.updateEquipableOptions(ar);
      setCheckGroup("gf", GUILD, {select: OR_AND_NOT});
      setCheckGroup("sf", SCHOOL, {select: OR_AND_NOT});
      setCheckGroup("of", TEAM);
      this.ef.forEach(function(ef){
        ef.updateTexts();
      });
      setTextAll([
        ["fc", "カードフィルタ/Filter "],
        ["ltb1", "一般/General"],
        ["ltb2", "所属タグ/Affiliation"],
        ["ltb3", "スキル/Skill"],
        ["lxf", "名前/Name"],
        ["lef", "属性/Attribute"],
        ["lwf", "武器/Weapon"],
        ["lcf", "CSタイプ/CS Type"],
        ["lrf", "レア度/Rarity"],
        ["lobf", "入手/Obtain"],
        ["llmf", "期間限定/Limited"],
        ["lvf", "バージョン/Variant"],
        ["lgf", "ギルド/Guild"],
        ["lsf", "学園/School"],
        ["lof", "その他/Other"],
        ["lqf", "装備可能/Equipable"],
        ["legf", "ギルド制限を無視/Ignore Guild Limitations"],
        ["lccf", "CSの効果を除外する/Exclude CS Effects"],
        ["rd", "ランダムカード/Random Card"],
        ["fr", "リセット/Reset"]
      ]);
      this.active = active;
    },
    updateToggleText: function(){
      _("fv").value = t("フィルタ/Filter ") + (this.active ? "▲" : "▼");
    },
    toggle: function(){
      if(this.active = 1 - this.active){
        _("sw").style.display = "block";
      }else{
        _("sw").style.display = "none";
      }
      this.update();
      this.updateToggleText();
    },
    reset: function(){
      var active = this.active;
      this.active = 0;
      this.defaultValues.forEach(function(value, key){
        setValue(key, value);
      });
      this.active = active;
      this.update();
    },
    checkWeapon: function(mode, x){
      var bit = [this.weapon, this.cs][mode];
      var c = [this.weaponChange, this.csChange][mode];
      return bit && !(1 << x.weapon[mode] & bit) && (!c || TAG.WCS[mode].every(function(w, i){
        if(1 << i & bit){
          if(!w) return true;
          return x.tag[0].every(function(td){
            return td.value !== w;
          });
        }
        return true;
      }));
    },
    update: function(){
      var p = this;
      var nv = toLowerKatakana(p.name);
      var vid = VARIANT[p.variant].value;
      var vv = VARIANT[p.variant].keyword;
      var fs = this.ef.map(function(ef){
        return ef.getFilter(p.exclude);
      });
      setOptions("pc", CARD, {filter: function(x){
        if(!p.active) return true;
        if(!x.index) return true;
        if(nv && x.name.toLowerCase().indexOf(nv) === -1) return false;
        if(p.rarity && !(1 << x.rarity & p.rarity)) return false;
        if(p.checkWeapon(0, x)) return false;
        if(p.checkWeapon(1, x)) return false;
        if(p.attribute && !(1 << x.attribute & p.attribute)) return false;
        if(check(x.obtain, p.obtain, p.obtainMode)) return false;
        if(p.limited && (p.limited === 1) !== x.limited) return false;
        if(vv && x.variant.indexOf(vv) === -1) return false;
        if(vid){
          if(x.rarity < 3){
            if(vid !== 1) return false;
          }else if(x.id % 10 !== vid){
            return false;
          }
        }
        if(check(x.guilds, p.guild, p.guildMode)) return false;
        if(check(x.schools, p.school, p.schoolMode)) return false;
        if(p.team && !(x.teams & p.team)) return false;
        if(p.ar && !x.canEquip(AR[p.ar], p.external)) return false;
        if(fs.some(function(f){
          return f && f(x);
        })) return false;
        return true;
      }});
      _("cx").innerHTML = "(" + (_("pc").length - 1) + "/" + (CARD.length - 1) + ")";
    }
  },
  arfilter: {
    name: "",
    thumbnailText: "",
    thumbnail: 0,
    rarity: 0,
    target: 0,
    targetMode: 0,
    hp: 0,
    atk: 0,
    limited: 0,
    csPlus: 0,
    ef: [
      new EffectFilter(1, ["rmf", "ruf", "rcf", "ref"], true),
      new EffectFilter(2, ["rmf", "ruf", "rcf", "ref"], true),
      new StaticEffectFilter(["raf", "rdf", "rnf", "rpf", "rzf"], true)
    ],
    stef: 0,
    bonus_a: 0,
    bonus_b: 0,
    nullify: 0,
    card: CARD[0],
    equipable: 1,
    external: 1,
    defaultValues: new Map(),
    active: 0,
    init: function(){
      var c = this;
      this.tabs = [
        new Tab("ltb4"),
        new Tab("ltb5")
      ];
      linkAll(c, [
        ["thumbnailText", "rbf_text"],
        ["targetMode", "rtf_mode"]
      ]);
      linkAll(c, [
        ["equipable", "ceq"],
        ["external", "reg"]
      ], this.tabs[0], true);
      linkAll(c, [
        ["name", "rxf"],
        ["rarity", "rrf"],
        ["target", "rtf"],
        ["thumbnail", "rbf"],
        ["hp", "rhf"],
        ["atk", "rkf"],
        ["limited", "rlf"]
      ], this.tabs[0]);
      linkInput(c, "csPlus", "rif", c.tabs[1]);
      this.ef.forEach(function(ef){
        ef.init(c, c.tabs[1]);
      });
      this.update();
    },
    updateTexts: function(){
      var active = this.active;
      this.active = 0;
      this.updateToggleText();
      setCheckGroup("rrf", RARITY);
      setCheckGroup("rtf", LIMITATION, {select: OR_AND_NOT});
      setOptions("rlf", LIMITED);
      setCheckGroup("rif", CS_PLUS);
      this.ef.forEach(function(ef){
        ef.updateTexts();
      });
      setTextAll([
        ["rfc", "AR装備フィルタ/AR Equipment Filter "],
        ["ltb4", "一般/General"],
        ["ltb5", "スキル/Skill"],
        ["lrxf", "名前/Name"],
        ["lrbf", "サムネイル/Thumbnail"],
        ["lrrf", "レア度/Rarity"],
        ["lrtf", "装備制限/Limitation"],
        ["lrhf", "HP基本値/Base HP"],
        ["lrkf", "ATK基本値/Base ATK"],
        ["lrlf", "期間限定/Limited"],
        ["lrif", "CS+"],
        ["lceq", "装備可能のみ/Can be Equipped only"],
        ["lreg", "ギルド制限を無視/Ignore Guild Limitations"],
        ["ri", "一覧表示/List"],
        ["rrd", "ランダムAR/Random AR"],
        ["rfr", "リセット/Reset"]
      ]);
      this.active = active;
    },
    updateToggleText: function(){
      _("rv").value = t("フィルタ/Filter ") + (this.active ? "▲" : "▼");
    },
    toggle: function(){
      if(this.active = 1 - this.active){
        _("rw").style.display = "block";
      }else{
        _("rw").style.display = "none";
      }
      this.update();
      this.updateToggleText();
    },
    reset: function(){
      var active = this.active;
      var c = this;
      this.active = 0;
      this.defaultValues.forEach(function(value, key){
        setValue(key, value);
        if(key === "rbf_text") c.updateThumbnail();
      });
      this.active = active;
      this.update();
    },
    updateThumbnail: function(){
      var s = toLowerKatakana(this.thumbnailText);
      var order = [0];
      var active = this.active;
      this.active = 0;
      Thumbnail.secret = false;
      if(s[0] === "#"){
        Thumbnail.secret = true;
        s = s.slice(1);
      }
      THUMBNAIL.forEach(function(x){
        if(x.value && (!s || x.name.toLowerCase().indexOf(s) !== -1)) order.push(x.index);
      });
      if(s && order.length === 2) order.shift();
      setOptions("rbf", THUMBNAIL, {order: order});
      this.active = active;
    },
    update: function(card){
      var p = this;
      var nv = toLowerHiragana(p.name);
      var fs = this.ef.map(function(ef){
        return ef.getFilter();
      });
      if(card !== undefined) p.card = CARD[card];
      p.updateThumbnail();
      setOptions("rc", AR, {filter: function(x){
        if(!p.active) return p.card.canEquip(x, true);
        if(p.equipable && !p.card.canEquip(x, p.external)) return false;
        if(!x.index) return true;
        if(nv && x.name.toLowerCase().indexOf(nv) === -1) return false;
        if(p.thumbnail && x.thumbnails.indexOf(p.thumbnail) === -1) return false;
        if(p.rarity && (1 << x.arRarity & p.rarity) === 0) return false;
        if(check(x.limitationType, p.target, p.targetMode)) return false;
        if(p.hp && x.hp < p.hp) return false;
        if(p.atk && x.value < p.atk) return false;
        if(p.limited && (p.limited === 1) !== x.limited) return false;
        if(p.csPlus && !(1 << x.csBoost & p.csPlus)) return false;
        if(fs.some(function(f){
          return f && f(x);
        })) return false;
        return true;
      }, labels: AR.LABELS});
      _("rcx").innerHTML = "(" + (_("rc").length - 1) + "/" + (AR.length - 1) + ")";
    }
  }
};
