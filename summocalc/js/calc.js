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
    });
    _("pl").max = 70 + MAX_LEVEL_SEED;
    linkInput(c, "lv", "pl");
    linkInput(c, "ar", "rc", function(){
      if(c.active) c.updateEffectOptions();
      c.updateEquipableOptions();
      setText("rx", "+" + r2n(AR[c.ar].arRarity));
    });
    linkInput(c, "arLv", "rl");
    this.updateSaveMenu();
    window.onstorage = function(){
      c.updateSaveMenu();
    };
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
      localStorage.setItem("theme", x);
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
    if(card.canEquip(ar)){
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
          var n = 0;
          var d = 0;
          var a = -1;
          while(n < 1){
            n = prompt(t("ダメージ倍率の分子 (※1以上の整数)/Numerator of damage multiplier\n(Enter an integer greater than or equal to 1.)"), 1);
            if(!n) return;
            n = parseInt(n, 10) || 0;
          }
          while(d < 1){
            d = prompt(t("ダメージ倍率の分母 (※1以上の整数)/Denominator of damage multiplier\n(Enter an integer greater than or equal to 1.)"), 1);
            if(!d) return;
            d = parseInt(d, 10) || 0;
          }
          while(a < 0){
            a = prompt(t("追加ダメージ (※0以上の整数)/Additional damage\n(Enter an integer greater than or equal to 0.)"), 0);
            if(!a) return;
            a = parseInt(a, 10);
            if(a !== a) a = -1;
          }
          if(n === d && !a) return;
          ep.setCustom(n, d, a);
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
          var tLoop = this.es[e.link].loop;
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
              this.es[e.link].setLevel(1, tLv);
            }else if(tLv === 0){
              this.es[e.link].clear();
            }
          }else if(tLoop){
            if(tE.isStackable() && ep.loop){
              tLv = this.es[e.link].lv;
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
    try{
      language = parseInt(localStorage.getItem("language") || 0, 10);
    }catch(e){}
    this.updateTexts();
  },
  setLanguage: function(x){
    language = x;
    try{
      localStorage.setItem("language", language);
    }catch(e){}
    this.updateTexts();
    this.active = 0;
    this.cardfilter.update();
    this.arfilter.update();
    this.active = 1;
    this.update();
  },
  updateTexts: function(){
    var cf = this.cardfilter;
    var rf = this.arfilter;
    var cb = cf.active;
    var rb = rf.active;
    this.active = 0;
    cf.updateToggleText();
    rf.updateToggleText();
    cf.active = 0;
    rf.active = 0;
    setOptions("sv", VERSION);
    setOptions("dm", THEME);
    setOptions("w", WEAPON, {filter: FILTER.NAME});
    setOptions("cs", CS, {filter: FILTER.VALUE});
    this.updateMultiplierOptions();
    setCheckGroup("ef", ATTRIBUTE);
    setCheckGroup("wf", WEAPON, {check: "武器種変更を含む/Include Weapon Change"});
    setCheckGroup("cf", WEAPON, {check: "CS変更を含む/Include Change CS"});
    setCheckGroup("rf", RARITY);
    setCheckGroup("obf", OBTAIN, {select: OR_AND_NOT});
    setOptions("lmf", LIMITED);
    setOptions("vf", VARIANT, {labels: VARIANT.LABELS});
    setCheckGroup("gf", GUILD, {select: OR_AND_NOT});
    setCheckGroup("sf", SCHOOL, {select: OR_AND_NOT});
    setCheckGroup("of", TEAM);
    ["srf1", "srf2"].forEach(function(key, i){
      setCheckGroup(key, RANGE);
      cf.updateEffectFilterOptions(i);
    });
    ["baf", "bdf", "nf", "pf"].forEach(function(key, i){
      setOptions(key, TAG, {filter: function(x){
        return !x.index || x.checkFlag(i + 3, TIMING_FLAG.ANY);
      }, labels: TAG.LABELS[i + 3]});
    });
    this.updateEquipableOptions();
    setCheckGroup("rrf", RARITY);
    setCheckGroup("rtf", LIMITATION, {select: OR_AND_NOT});
    setOptions("rlf", LIMITED);
    setCheckGroup("rif", CS_PLUS);
    ["ruf1", "ruf2"].forEach(function(key, i){
      setCheckGroup(key, RANGE);
      rf.updateEffectFilterOptions(i);
    });
    ["raf", "rdf", "rnf", "rpf"].forEach(function(key, i){
      setOptions(key, TAG, {filter: function(x){
        return !x.index || x.checkFlag(i + TAG_FLAG_NUM.AR + 3, TIMING_FLAG.NOT_CS);
      }, labels: TAG.LABELS[i + 3]});
    });
    this.updateEffectOptions();
    setText("lsv", "モード/Mode");
    setText("ldm", "テーマ/Theme");
    setText("lpc", "カード/Card");
    setText("lpl", "カードLv/Card Lv");
    setText("lw", "武器/Weapon");
    setText("lcl", "神器Lv/S.A.Lv");
    setText("luc", "CSを使用/Use CS");
    setText("lrc", "AR");
    setText("lrl", "AR Lv");
    setText("los", "攻撃側/Offense");
    setText("oa", "追加/Add");
    setText("or", "削除/Remove");
    setText("lds", "防御側/Defense");
    setText("da", "追加/Add");
    setText("dr", "削除/Remove");
    setText("lel", "効果Lv/Effect Lv");
    setText("lal", "毎回尋ねる/Ask Each Time");
    setText("lam", "属性相性/Attribute");
    setText("cc", "コピー/Copy");
    setText("sr", "結果を共有/Share Result" );
    setText("su", "URLを共有/Share URL");
    setText("rs", "リセット/Reset");
    setText("sl", "English/日本語");
    setText("fc", "カードフィルタ/Filter ");
    setText("ltb1", "一般/General");
    setText("ltb2", "所属タグ/Affiliation");
    setText("ltb3", "スキル/Skill");
    setText("lxf", "名前/Name");
    setText("lef", "属性/Attribute");
    setText("lwf", "武器/Weapon");
    setText("lcf", "CSタイプ/CS Type");
    setText("lrf", "レア度/Rarity");
    setText("lobf", "入手/Obtain");
    setText("llmf", "期間限定/Limited");
    setText("lvf", "バージョン/Variant");
    setText("lgf", "ギルド/Guild");
    setText("lsf", "学園/School");
    setText("lof", "その他/Other");
    setText("lsef1", "効果1/Effect 1");
    setCheckGroup("stf1", TIMING);
    setText("lsef2", "効果2/Effect 2");
    setCheckGroup("stf2", TIMING);
    setText("lpf", "常時/Static");
    setText("lbaf", "特攻対象/A.Advantage");
    setText("lbdf", "特防対象/D.Advantage");
    setText("lnf", "状態無効/Nullify");
    setText("lqf", "装備可能/Equipable");
    setText("legf", "ギルド制限を無視/Ignore Guild Limitations");
    setText("lccf", "CSの効果を除外する/Exclude CS Effects");
    setText("rd", "ランダムカード/Random Card");
    setText("fr", "リセット/Reset");
    setText("rfc", "AR装備フィルタ/AR Equipment Filter ");
    setText("ltb4", "一般/General");
    setText("ltb5", "スキル/Skill");
    setText("lrxf", "名前/Name");
    setText("lrbf", "サムネイル/Thumbnail");
    setText("lrrf", "レア度/Rarity");
    setText("lrtf", "装備制限/Limitation");
    setText("lrhf", "HP基本値/Base HP");
    setText("lrkf", "ATK基本値/Base ATK");
    setText("lrlf", "期間限定/Limited");
    setText("lrif", "CS+");
    setText("lref1", "効果1/Effect 1");
    setCheckGroup("rmf1", TIMING, {filter: FILTER.NOT_CS});
    setText("lref2", "効果2/Effect 2");
    setCheckGroup("rmf2", TIMING, {filter: FILTER.NOT_CS});
    setText("lrpf", "常時/Static");
    setText("lraf", "特攻対象/A.Advantage");
    setText("lrdf", "特防対象/D.Advantage");
    setText("lrnf", "状態無効/Nullify");
    setText("lceq", "装備可能のみ/Can be Equipped only");
    setText("lreg", "ギルド制限を無視/Ignore Guild Limitations");
    setText("rrd", "ランダムAR/Random AR");
    setText("rfr", "リセット/Reset");
    setText("dd", "カードデータ: /Card Data: ");
    setText("ad", "ARデータ: /AR Data: ");
    setText("ms", "「ホーム画面に追加」機能でインストールできます/You can install this by 'Add to Home Screen'.");
    setText("um", "新しいデータがあります/New data is available.");
    setText("ub", "更新/Update");
    setText("ri", "一覧表示/List");
    setText("svd", "保存/Save");
    setText("ldd", "読込/Load");
    setText("dld", "削除/Delete");
    cf.active = cb;
    rf.active = rb;
    this.active = 1;
  },
  updateSaveMenu: function(){
    var list = [];
    var data = [];
    for(var i = 0; i < 9; i++){
      var label = "#" + (i + 1) + ": ";
      var value = "";
      try{
        value = localStorage.getItem("slot" + i) || "";
      }catch(e){}
      value = value.split("#");
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
        try{
          localStorage.setItem("slot" + i, encodeURIComponent(name) + data);
        }catch(e){}
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
      try{
        localStorage.removeItem("slot" + i);
      }catch(e){}
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
    if(card.canEquip(ar)) ar.effects.forEach(function(x){
      order.push(EFFECT_MAX * 2 + x);
    });
    order = order.concat(EFFECT.LOCALE_ORDER[language]);
    setOptions("os", es, {filter: FILTER.OFFENSE, order: order, labels: labels.concat(EFFECT.LABELS[0]), divisor: EFFECT_MAX, prefixes: p});
    setOptions("ds", es, {filter: FILTER.DEFENSE, order: order, labels: labels.concat(EFFECT.LABELS[1]), divisor: EFFECT_MAX, prefixes: p});
  },
  updateEquipableOptions: function(){
    var active = this.cardfilter.active;
    var order = [0].concat(AR.ORDER);
    var labels = ["装備中/Equipped"].concat(AR.LABELS);
    var value = v("qf");
    this.cardfilter.active = 0;
    if(this.ar){
      order.splice(1, 0, this.ar);
    }
    setOptions("qf", AR, {order: order, labels: labels});
    setValue("qf", value);
    this.cardfilter.active = active;
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
      if(exatk > 0) stef.push("ATK+" + exatk);
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
            label.push("[HP:" + ep.hp + "/" + ep.maxHp + "]");
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
              desc.push(t("ダメージ/Damage") + (x < 0 ? "" : "+") + x);
              break;

            case TYPE.SEED:
            case TYPE.ATK:
              exatk = exatk.add(x);
              desc.push("ATK" + (x < 0 ? "" : "+") + x);
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
    if(exatk.n) desc.push((exatk < 0 ? "" : "+") + exatk);
    atkbonus.forEach(function(x){
      atk = x.add(1, 1).mul(atk);
      desc.push("+" + x.mul(100, 1) + "%");
    });
    result[5] += atk;
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
        result.push("　[" + attr + "]: " + x);
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
    timing1: TIMING_FLAG.ANY,
    timing2: TIMING_FLAG.ANY,
    range1: 7,
    range2: 7,
    category1: 0,
    category2: 0,
    effect1: 0,
    effect2: 0,
    stef: 0,
    bonus_a: 0,
    bonus_b: 0,
    nullify: 0,
    ar: 0,
    external: 0,
    exclude: 0,
    current: "",
    active: 0,
    init: function(){
      var c = this;
      linkTextInput(c, "name", "xf");
      linkCheckGroup(c, "attribute", "ef");
      linkCheckGroup(c, "weapon", "wf");
      linkInput(c, "weaponChange", "wf_c");
      linkCheckGroup(c, "cs", "cf");
      linkInput(c, "csChange", "cf_c");
      linkCheckGroup(c, "rarity", "rf");
      linkCheckGroup(c, "obtain", "obf")
      linkInput(c, "obtainMode", "obf_mode");
      linkInput(c, "limited", "lmf");
      linkInput(c, "variant", "vf");
      linkCheckGroup(c, "guild", "gf");
      linkInput(c, "guildMode", "gf_mode");
      linkCheckGroup(c, "school", "sf");
      linkInput(c, "schoolMode", "sf_mode");
      linkCheckGroup(c, "team", "of");
      linkInput(c, "stef", "pf");
      linkInput(c, "bonus_a", "baf");
      linkInput(c, "bonus_d", "bdf");
      linkInput(c, "nullify", "nf");
      linkInput(c, "ar", "qf");
      linkInput(c, "external", "egf");
      linkInput(c, "exclude", "ccf");
      linkCheckGroup(c, "timing1", "stf1", function(){
        c.updateEffectFilterOptions(0);
      });
      linkCheckGroup(c, "timing2", "stf2", function(){
        c.updateEffectFilterOptions(1);
      });
      linkCheckGroup(c, "range1", "srf1", function(){
        c.updateEffectFilterOptions(0);
      });
      linkCheckGroup(c, "range2", "srf2", function(){
        c.updateEffectFilterOptions(1);
      });
      linkInput(c, "category1", "scf1", function(){
        c.updateEffectFilterOptions(0, true);
      });
      linkInput(c, "category2", "scf2", function(){
        c.updateEffectFilterOptions(1, true);
      });
      linkInput(c, "effect1", "sef1");
      linkInput(c, "effect2", "sef2");
      this.update();
    },
    updateEffectFilterOptions: function(n, skip){
      var i = n + 1;
      var rb = bits((n ? this.range2 : this.range1) || 7);
      var b = (n ? this.timing2 : this.timing1) || TIMING_FLAG.ANY;
      var c = (n ? this.category2 : this.category1);
      var s = c && TAG[c].reading[0] !== "ん";
      var checkFlag = function(x){
        return rb.some(function(r){
          return x.checkFlag(r, b);
        });
      };
      if(!skip) setOptions("scf" + i, TAG, {filter: function(x){
        return !x.index || (x.type === TAG_TYPE.CATEGORY && checkFlag(x));
      }, text: "カテゴリ：/Category: "});
      setOptions("sef" + i, TAG, {filter: function(x){
        return !x.index || (x.type !== TAG_TYPE.CATEGORY && (s || x.reading.indexOf(" ") === -1) && x.checkCategory(c) && checkFlag(x));
      }, labels: TAG.LABELS[0]});
    },
    updateToggleText: function(){
      _("fv").value = t("フィルタ/Filter ") + (this.active ? "▲" : "▼");
    },
    toggle: function(){
      if(this.active = 1 - this.active){
        _("sw").style.display = "block";
      }else{
        _("sw").style.display = "none";
        hideCurrent(this);
        this.current = "";
      }
      this.update();
      this.updateToggleText();
    },
    reset: function(){
      var active = this.active;
      this.active = 0;
      ["ef", "wf", "wf_c", "cf", "cf_c", "rf", "obf", "obf_mode", "lmf", "vf", "gf", "gf_mode", "sf", "sf_mode", "of", "pf", "baf", "bdf", "nf", "qf", "egf", "sef1", "sef2", "scf1", "scf2", "ccf"].forEach(function(x){
        setValue(x, 0);
      });
      setValue("xf", "");
      setValue("stf1", TIMING_FLAG.ANY);
      setValue("stf2", TIMING_FLAG.ANY);
      setValue("srf1", 7);
      setValue("srf2", 7);
      this.active = active;
      this.update();
    },
    checkWeapon: function(mode, x){
      var bit = [this.weapon, this.cs][mode];
      var c = [this.weaponChange, this.csChange][mode];
      return bit && !(1 << x.weapon[mode] & bit) && (!c || TAG.WCS[mode].every(function(w, i){
        if(1 << i & bit){
          if(!w) return true;
          return x.tag[0].every(function(ie){
            return ie[0] !== w;
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
      var d = p.exclude ? TAG_MAX * 10 : TAG_MAX;
      var ef1 = p.effect1 || p.category1;
      var ef2 = p.effect2 || p.category2;
      var rg = [p.range1, p.range2].map(function(r){
        var a = bits(r);
        if(!r) return function(){return false};
        return function(x, fn){
          return a.every(function(range){
            return x.tag[range].every(fn);
          });
        };
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
        if(p.timing1 && ef1 && rg[0](x, function(ie){
          return (ef1 !== ie[0] % d) || checkTiming(ie[1], p.timing1);
        })) return false;
        if(p.timing2 && ef2 && rg[1](x, function(ie){
          return (ef2 !== ie[0] % d) || checkTiming(ie[1], p.timing2);
        })) return false;
        if([p.bonus_a, p.bonus_d, p.nullify, p.stef].some(function(te, i){
          return te && x.tag[(i + 3) % 6].every(function(ie){
            return te !== ie[0] % d;
          });
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
    timing1: TIMING_FLAG.NOT_CS,
    timing2: TIMING_FLAG.NOT_CS,
    range1: 7,
    range2: 7,
    category1: 0,
    category2: 0,
    effect1: 0,
    effect2: 0,
    stef: 0,
    bonus_a: 0,
    bonus_b: 0,
    nullify: 0,
    card: CARD[0],
    equipable: 1,
    external: 1,
    current: "",
    active: 0,
    init: function(){
      var c = this;
      linkTextInput(c, "name", "rxf");
      linkTextInput(c, "thumbnailText", "rbf_text");
      linkCheckGroup(c, "rarity", "rrf");
      linkCheckGroup(c, "target", "rtf");
      linkInput(c, "thumbnail", "rbf");
      linkInput(c, "targetMode", "rtf_mode");
      linkInput(c, "hp", "rhf");
      linkInput(c, "atk", "rkf");
      linkInput(c, "limited", "rlf");
      linkCheckGroup(c, "csPlus", "rif");
      linkCheckGroup(c, "timing1", "rmf1", function(){
        c.updateEffectFilterOptions(0);
      });
      linkCheckGroup(c, "timing2", "rmf2", function(){
        c.updateEffectFilterOptions(1);
      });
      linkCheckGroup(c, "range1", "ruf1", function(){
        c.updateEffectFilterOptions(0);
      });
      linkCheckGroup(c, "range2", "ruf2", function(){
        c.updateEffectFilterOptions(1);
      });
      linkInput(c, "category1", "rcf1", function(){
        c.updateEffectFilterOptions(0, true);
      });
      linkInput(c, "category2", "rcf2", function(){
        c.updateEffectFilterOptions(1, true);
      });
      linkInput(c, "effect1", "ref1");
      linkInput(c, "effect2", "ref2");
      linkInput(c, "stef", "rpf");
      linkInput(c, "bonus_a", "raf");
      linkInput(c, "bonus_d", "rdf");
      linkInput(c, "nullify", "rnf");
      linkInput(c, "equipable", "ceq");
      linkInput(c, "external", "reg");
      this.update();
    },
    updateEffectFilterOptions: function(n, skip){
      var i = n + 1;
      var rb = bits((n ? this.range2 : this.range1) || 7);
      var b = (n ? this.timing2 : this.timing1) || TIMING_FLAG.NOT_CS;
      var c = (n ? this.category2 : this.category1);
      var s = c && TAG[c].reading[0] !== "ん";
      var checkFlag = function(x){
        return rb.some(function(r){
          return x.checkFlag(r + TAG_FLAG_NUM.AR, b);
        });
      };
      setOptions("rcf" + i, TAG, {filter: function(x){
        return !x.index || (x.type === TAG_TYPE.CATEGORY && checkFlag(x)) ;
      }, text: "カテゴリ：/Category: "});
      setOptions("ref" + i, TAG, {filter: function(x){
        return !x.index || (x.type !== TAG_TYPE.CATEGORY && (s || x.reading.indexOf(" ") === -1) && x.checkCategory(c) && checkFlag(x));
      }, labels: TAG.LABELS[0]});
    },
    updateToggleText: function(){
      _("rv").value = t("フィルタ/Filter ") + (this.active ? "▲" : "▼");
    },
    toggle: function(){
      if(this.active = 1 - this.active){
        _("rw").style.display = "block";
      }else{
        _("rw").style.display = "none";
        hideCurrent(this);
        this.current = "";
      }
      this.update();
      this.updateToggleText();
    },
    reset: function(){
      var active = this.active;
      this.active = 0;
      setValue("rbf_text", "");
      this.updateThumbnail();
      ["rbf", "rrf", "rtf", "rtf_mode", "rhf", "rkf", "rlf", "rif", "rpf", "raf", "rdf", "rnf", "ref1", "ref2", "rcf1", "rcf2"].forEach(function(x){
        setValue(x, 0);
      });
      setValue("rxf", "");
      setValue("ceq", 1);
      setValue("reg", 1);
      setValue("rmf1", TIMING_FLAG.NOT_CS);
      setValue("rmf2", TIMING_FLAG.NOT_CS);
      setValue("ruf1", 7);
      setValue("ruf2", 7);
      this.active = active;
      this.update();
    },
    updateThumbnail: function(){
      var s = toLowerKatakana(this.thumbnailText);
      var order = [0];
      var active = this.active;
      this.active = 0;
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
      var ef1 = p.effect1 || p.category1;
      var ef2 = p.effect2 || p.category2;
      var rg = [p.range1, p.range2].map(function(r){
        var a = bits(r);
        if(!r) return function(){return false};
        return function(x, fn){
          return a.every(function(range){
            return x.tag[range].every(fn);
          });
        };
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
        if(p.timing1 && ef1 && rg[0](x, function(ie){
          return ef1 !== ie[0] || checkTiming(ie[1], p.timing1);
        })) return false;
        if(p.timing2 && ef2 && rg[1](x, function(ie){
          return ef2 !== ie[0] || checkTiming(ie[1], p.timing2);
        })) return false;
        if([p.bonus_a, p.bonus_d, p.nullify, p.stef].some(function(te, i){
          return te && x.tag[(i + 3) % 6].every(function(ie){
            return te !== ie[0];
          });
        })) return false;
        return true;
      }, labels: AR.LABELS});
      _("rcx").innerHTML = "(" + (_("rc").length - 1) + "/" + (AR.length - 1) + ")";
    }
  }
};
