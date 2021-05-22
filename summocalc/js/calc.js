var LINE = "－－－－－－－－－－－－";

var EffectStatus = function(){
  this.clear();
};
EffectStatus.prototype = {
  clear: function(){
    this.lv = 0;
    this.loop = 0;
    this.hp = 1;
    this.maxHp = 1;
    this.c = 0;
    this.a = 0;
  },
  setCustom: function(n, d, a){
    this.c = new Fraction(n, d);
    this.a = a;
  },
  getCustomMul: function(){
    return this.c || new Fraction(1);
  },
  getCustomAdd: function(){
    return new Fraction(this.a);
  }
};

var FILTER = {
  VALUE: function(x){return x.getValue() - 0},
  OFFENSE: function(x){return x.group === 0 || x.group < 0},
  DEFENSE: function(x){return x.group === 1 || x.group < 0},
  NAME: function(x){return x.name}
};

var calc = {
  version: 1,
  atk: 4000,
  weapon: 1,
  cs: CS_ORDER[3],
  cLv: 1,
  card: 0,
  lv: 1,
  es: EFFECT.map(function(v){
    return new EffectStatus();
  }),
  evt: 0,
  wc: 0,
  csc: 0,
  usecs: 0,
  ar: 0,
  arLv: 1,
  multiplier: 0,
  active: 1,
  defaultHash: "",
  init: function(){
    var c = this;
    var nums = document.querySelectorAll('input[type="number"]');
    if(navigator.share){
      _("cc").style.display = "none";
    }else{
      _("sr").style.display = "none";
      _("su").style.display = "none";
    }
    if(!navigator.userAgent.match(/iP(hone|[ao]d)/) || isStandalone()) _("ms").style.display = "none";
    this.setLanguage(-1);
    this.cardfilter.init();
    linkInput(c, "atk", "a");
    linkInput(c, "weapon", "w");
    linkInput(c, "cs", "cs");
    linkInput(c, "cLv", "cl");
    linkInput(c, "usecs", "uc");
    linkInput(c, "version", "sv");
    linkInput(c, "multiplier", "am");
    linkInput(c, "card", "pc", function(){
      c.updateEffectOptions();
      c.checkCardSelected();
    });
    linkInput(c, "lv", "pl");
    linkInput(c, "ar", "rc", function(){
      c.updateEffectOptions();
    });
    linkInput(c, "arLv", "rl");
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
        text: _("o").value
      });
    };
    _("su").onclick = function(){
      share({
        text: document.title,
        url: location.href
      });
    };
    _("rd").onclick = function(){
      c.selectCardRandomly();
    };
    _("fv").onclick = function(){
      c.cardfilter.toggle();
    };
    _("fr").onclick = function(){
      c.cardfilter.reset();
    };
    _("lm").onclick = function(){
      setValue("pl", CARD[c.card].maxLv);
      c.update();
    };
    _("lx").onclick = function(){
      setValue("pl", v("pl") + 10);
      c.update();
    };
    _("lz").onclick = function(){
      setValue("pl", v("pl") + 15);
      c.update();
    };
    _("ly").onclick = function(){
      setValue("pl", v("pl") - 10);
      c.update();
    };
    _("rs").onclick = function(){
      if(confirm(t("リセットしますか？/Are you sure you want to reset?"))){
        c.load(c.defaultHash);
        checkUpdate();
      }
    };
    for(var i = 0; i < nums.length; i++){
      nums[i].onfocus = function(){
        var elem = this;
        setTimeout(function(){
          try{
            elem.setSelectionRange(0, elem.value.length);
          }catch(e){
            elem.select();
          }
        }, 0);
      };
    }
    nums = null;
    setBlobURL("dj", Card.csv(CARD, 0), "text/csv", "housamo_card_ja.csv");
    setBlobURL("de", Card.csv(CARD, 1), "text/csv", "housamo_card_en.csv");
    setBlobURL("aj", Record.csv(AR, 0), "text/csv", "housamo_ar_ja.csv");
    setBlobURL("ae", Record.csv(AR, 1), "text/csv", "housamo_ar_en.csv");
    this.save();
    this.load(location.hash.slice(1), true);
  },
  save: function(){
    var s = new Encoder();
    var n = 0;
    var tmp = [];
    var bonus = [];
    s.write(CARD[this.card].id);
    s.write(AR[this.ar].id);
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
    s.write(this.evt);
    s.write(this.wc);
    s.write(this.csc);
    this.es.some(function(v, i){
      if(v.loop){
        var e = EFFECT[i];
        if(e.sp){
          bonus.push(e.sp[0]);
          bonus.push(e.sp[1]);
          bonus.push(v.loop);
        }else{
          if(bonus.length) return true;
          s.write(i - n);
          n = i;
          if(!e.isFixed() || !e.isStackable()){
            tmp.push(v.lv);
          }
          if(e.isStackable()) tmp.push(v.loop);
          if(e.type === TYPE.LIMIT){
            tmp.push(v.hp);
            tmp.push(v.maxHp);
          }
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
      history.replaceState(null, null, location.pathname);
    }else{
      history.replaceState(null, null, location.pathname + "#" + s);
    }
  },
  load: function(x, skipSave){
    var s = new Decoder(x);
    if(s.data){
      var complete = false;
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
      this.evt = s.read();
      this.wc = s.read();
      this.csc = s.read();
      while(1){
        n = s.read();
        if(!n) break;
        tmp.push(n);
      }
      n = tmp.shift();
      this.es.forEach(function(v){
        v.clear();
      });
      if(n) this.es.some(function(v, i, es){
        if(i === n){
          var e = EFFECT[i];
          if(e.sp) return true;
          if(e.group === 2 && e.link) v = es[e.link];
          v.loop = 1;
          if(!e.isFixed() || !e.isStackable()) v.lv = s.read();
          if(e.isStackable()) v.loop = Math.min(s.read(), 15);
          if(e.type === TYPE.LIMIT){
            v.hp = s.read();
            v.maxHp = s.read();
          }
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
          if(!be || !bt || !bl) break;
          bonus.push([be, bt, bl]);
          n -= 3;
        }
        if(!n) bonus.forEach(function(v){
          var e = EFFECT[v[0]];
          if(!e || !e.subset) return;
          n = e.subset.get(v[1]);
          if(!n || !es[n]) return;
          es[n].loop = Math.min(v[2], 15);
          es[n].lv = 1;
        });
      }
      this.active = 1;
    }
    this.update(skipSave);
    this.updateEffectOptions();
  },
  addStatus: function(index, lv, group, mode){
    if(index > EFFECT_MAX){
      mode = Math.floor(index / EFFECT_MAX);
      index = index % EFFECT_MAX;
    }
    if(index > 0){
      var e = EFFECT[index];
      var es = this.es[index];
      if(lv){
        if(mode == 1){
          lv = 0;
        }else if(mode == 2 && !e.isFixed()){
          lv = 0;
          while(lv < 1 || lv > 100){
            lv = prompt(t("効果Lv (※1〜100)/Effect Lv\n(1-100)"), "");
            if(lv !== 0 && !lv) return;
            lv = parseInt(lv, 10) || 0;
          }
        }
        //イベント
        if(e.event && index !== this.evt){
          if(this.es[this.evt]) this.es[this.evt].clear();
          this.evt = index;
        }
        //武器種変更
        if(e.type === TYPE.WEAPON && index !== this.wc){
          if(this.es[this.wc]) this.es[this.wc].clear();
          this.wc = index;
        }
        //CS変更
        if(e.type === TYPE.CSWEAPON && index !== this.csc){
          if(this.es[this.csc]) this.es[this.csc].clear();
          this.csc = index;
        }

        if(e.type === TYPE.CUSTOM && !es.loop){
          var n = 0;
          var d = 0;
          var a = -1;
          while(n < 1){
            n = prompt(t("ダメージ倍率の分子 (※1以上の整数)/Numerator of damage multiplier\n(Enter an integer greater than or equal to 1.)"), 1);
            if(n !== 0 && !n) return;
            n = parseInt(n, 10) || 0;
          }
          while(d < 1){
            d = prompt(t("ダメージ倍率の分母 (※1以上の整数)/Denominator of damage multiplier\n(Enter an integer greater than or equal to 1.)"), 1);
            if(d !== 0 && !d) return;
            d = parseInt(d, 10) || 0;
          }
          while(a < 0){
            a = prompt(t("追加ダメージ (※0以上の整数)/Additional damage\n(Enter an integer greater than or equal to 0.)"), 0);
            if(a !== 0 && !a) return;
            a = parseInt(a, 10);
            if(a === undefined) a = -1;
          }
          if(n === d && !a) return;
          es.setCustom(n, d, a);
        }

        if(e.type === TYPE.LIMIT){
          var hp = 0;
          var maxHp = 0;
          while(hp < 1){
            hp = prompt(t("現在HP (※1以上の整数)/Current HP\n(Enter an integer greater than or equal to 1.)"), es.hp);
            if(hp !== 0 && !hp) return;
            hp = parseInt(hp, 10) || 0;
          }
          while(maxHp < hp){
            maxHp = prompt(t("最大HP (※/Max HP\n(Enter an integer greater than or equal to ") + hp + t("以上の整数)/.)"), Math.max(es.maxHp, hp));
            if(maxHp !== 0 && !maxHp) return;
            maxHp = parseInt(maxHp, 10) || 0;
          }
          es.hp = hp || 1;
          es.maxHp = maxHp || 1;
        }else if(e.type === TYPE.SEED){
          lv = 0;
          while(lv < 1 || lv > 2000){
            lv = prompt(t("ATKの種 (※1〜2000)/ATK Seed\n(1-2000)"), es.lv || 1000);
            if(lv !== 0 && !lv) return;
            lv = parseInt(lv, 10) || 0;
          }
        }else if(e.isFixed() || e.isLv1()){
          lv = 1;
        }
        es.lv = lv;
        if(!e.isStackable()){
          es.loop = 1;
        }else if(es.loop < 15){
          es.loop++;
        }
        if(e.link){
          var tLoop = this.es[e.link].loop;
          var tE = EFFECT[e.link];
          if((!tLoop || tE.isStackable() && tLoop < es.loop) && !e.isNonStatus()){
            var tLv = 0;
            if(tE.isFixed() || tE.isLv1()){
              if(confirm(t("/Add ") + tE + t("を追加/"))) tLv = 1;
            }else{
              while(tLv < 1 || tLv > 100){
                tLv = prompt(t("/Add ") + tE + t("を追加 (※Lv.1〜100)/\n(Lv.1-100)"), "");
                if(tLv !== 0 && !tLv) break;
                tLv = parseInt(tLv, 10) || 0;
              }
            }
            if(tLv) this.addStatus(e.link, tLv, 1);
          }
        }
      }else{
        if(--es.loop < 1) es.clear();
      }
    }else if(!lv && confirm(t("全ての【/Are you sure you want to remove all 【") + t(["攻撃/Offense", "防御/Defense"][group]) + t("側補正】を削除しますか？/】 effects?"))){
      this.es.forEach(function(v, i){
        if(EFFECT[i].group === group) v.clear();
      });
    }
    this.update();
    this.updateEffectOptions();
  },
  setLanguage: function(x){
    if(x < 0){
      try{
        language = parseInt(localStorage.getItem("language") || -1, 10);
      }catch(e){}
      if(language < 0) language = (
        navigator.language ||
        navigator.userLanguage ||
        navigator.browserLanguage
      ).slice(0, 2) === "ja" ? 0 : 1;
    }else{
      language = x;
    }
    try{
      localStorage.setItem("language", language);
    }catch(e){}
    this.updateTexts();
    if(x >= 0){
      this.cardfilter.update();
      this.update();
    }
  },
  updateTexts: function(){
    var cf = this.cardfilter;
    var b = cf.active;
    this.active = 0;
    cf.active = 0;
    setOptions("sv", VERSION);
    setOptions("w", WEAPON, FILTER.NAME);
    setOptions("cs", CS, FILTER.VALUE, CS_ORDER);
    setOptions("am", MULTIPLIER);
    setOptions("ef", ATTRIBUTE);
    setOptions("wf", WEAPON);
    setOptions("cf", WEAPON);
    setOptions("rf", RARITY);
    setOptions("vf", VARIANT);
    setOptions("gf", GUILD, undefined, GUILD.ORDER[language]);
    setOptions("sf", SCHOOL, undefined, SCHOOL.ORDER[language]);
    ["srf1", "srf2"].forEach(function(key, i){
      setOptions(key, RANGE);
      cf.updateEffectFilterOptions(i);
    });
    ["baf", "bdf", "nf", "pf"].forEach(function(key, i){
      setOptions(key, TAG, function(x){
        return !x.index || x.checkFlag(i + 3, TIMING.ANY);
      }, TAG.ORDER[language]);
    });
    setOptions("qf", AR);
    this.updateEffectOptions();
    this.checkCardSelected();
    setText("lsv", "モード/Mode");
    setText("lpc", "カード/Card");
    setText("lpl", "カードLv/Card Lv");
    setText("lw", "武器タイプ/Weapon Type");
    setText("lcl", "神器Lv/Artifact Lv");
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
    setText("lxf", "名前/Name");
    setText("lef", "属性/Attribute");
    setText("lwf", "武器タイプ/Weapon Type");
    setText("lcf", "CSタイプ/CS Type");
    setText("lrf", "レア度/Rarity");
    setText("lvf", "バージョン/Variant");
    setText("lgf", "ギルド/Guild");
    setText("lsf", "学園/School");
    setText("lsef1", "効果1/Effect 1");
    setCheckGroup("stf1", TIMING_LABELS, 15);
    setText("lsef2", "効果2/Effect 2");
    setCheckGroup("stf2", TIMING_LABELS, 15);
    setText("lpf", "常時/Static");
    setText("lbaf", "特攻対象/A.Bonus");
    setText("lbdf", "特防対象/D.Bonus");
    setText("lnf", "状態無効/Nullify");
    setText("lqf", "装備可能AR/Equipable AR");
    setText("lccf", "CSの効果を除外する/Exclude CS Effects");
    setText("lfv", "フィルタ/Filter ");
    setText("rd", "ランダムカード/Random Card");
    setText("fr", "フィルタをリセット/Reset Filter");
    setText("dd", "カードデータ: /Card Data: ");
    setText("ad", "ARデータ: /AR Data: ");
    setText("ms", "「ホーム画面に追加」機能でインストールできます/You can install this by 'Add to Home Screen'.");
    setText("um", "新しいデータがあります/New data is available.");
    setText("ub", "更新/Update");
    cf.active = b;
    this.active = 1;
  },
  updateEffectOptions: function(){
    var p = ["", "{CS} ", "[AR] "];
    var es = this.es;
    var s = [0].concat(
      CARD[this.card].effects
    );
    AR[this.ar].effects.forEach(function(x){
      s.push(EFFECT_MAX * 2 + x);
    });
    s.push(0);
    EFFECT.ORDER[language].forEach(function(x){
      var subset = EFFECT[x].subset;
      if(es[x].loop) s.push(x);
      if(subset) TAG.ORDER[language].forEach(function(z){
        var x = subset.get(z);
        if(x && es[x].loop) s.push(x);
      });
    });
    s = s.concat(EFFECT.ORDER[language]);
    setOptions("os", EFFECT, FILTER.OFFENSE, s, EFFECT_MAX, p);
    setOptions("ds", EFFECT, FILTER.DEFENSE, s, EFFECT_MAX, p);
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
    this.filterAR();
  },
  selectCardRandomly: function(){
    var n = _("pc").length - 1;
    if(n){
      _("pc").selectedIndex = Math.floor(Math.random() * n) + 1;
      _("pc").onchange();
    }
  },
  filterAR: function(){
    var c = CARD[this.card];
    setOptions("rc", AR, function(x){
      return c.canEquip(x);
    });
  },
  update: function(skipSave){
    var dmg = new Fraction(1);
    var exdmg = 0;
    var atk = this.atk;
    var exatk = new Fraction(0);
    var atkbonus = new Fraction(1);
    var weapon = this.weapon;
    var cs = this.cs;
    var csrate = 1;
    var card = CARD[this.card];
    var ar = AR[this.ar];
    var desc = [];
    var effects = [];
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
      cs = CS_ORDER[card.rarity] + card.csBoost;
      setValue("a", atk);
      setValue("w", weapon);
      setValue("cs", cs);
      result[1] = "　[Lv." + pad(this.lv, 3) + "]　" + card;
    }
    if(this.ar){
      var stef = [];
      exatk = ar.getValue(this.arLv);
      cs += ar.csBoost;
      if(exatk > 0) stef.push("ATK+" + exatk);
      if(ar.csBoost > 0) stef.push(t("CS威力" + ["増加/I", "大増/Greatly i"][ar.csBoost - 1] + "ncrease CS Damage"));
      if(ar.csWeapon){
        if(this.usecs) weapon = ar.csWeapon;
        stef.push(WEAPON[ar.csWeapon] + "CS");
      }
      result[2] = "　[Lv." + pad(this.arLv, 3) + "]　" + (card.canEquip(ar) ? "" : "×") + ar;
      if(stef.length) result[2] += "（" + stef.join(", ") + "）";
    }
    if(this.usecs){
      csrate = CS[cs].getValue() * (1 + Math.LOG10E * Math.log(this.cLv) / 2);
      result.push(
        t("【チャージスキル】/【Charge Skill】"),
        "　{Lv." + pad(this.cLv, 3) + "}　" + CS[cs] + "（x" + csrate + "）",
        LINE
      );
    }
    EFFECT.ORDER[language].forEach(function(v){
      var e = EFFECT[v];
      effects.push(e);
      if(e.subset){
        TAG.ORDER[language].forEach(function(x){
          var v = e.subset.get(x);
          if(v) effects.push(EFFECT[v]);
        });
      }
    });
    for(var group = 0; group < 2; group++){
      var buffed = this.es.some(function(es, i){
        if(es.loop) return EFFECT[i].isBuff(group);
        return false;
      });
      var debuffed = this.es.some(function(es, i){
        if(es.loop) return EFFECT[i].isDebuff(group);
        return false;
      });
      desc = [];
      result.push(t([
        "【攻撃側補正】/【Offense】",
        "【防御側補正】/【Defense】"
      ][group]));
      for(var i = 1; i < effects.length; i++){
        var count = 0;
        var e = effects[i];
        var es = this.es[e.index];
        var eLv = es.lv;
        var loop = es.loop;
        if(e.group !== group) continue;
        if(e.isStackable()) count = loop;
        while(loop--){
          var x;
          var label = [];
          if(eLv){
            label.push("　[Lv.");
            label.push("]　");
          }else{
            eLv = this.cLv;
            label.push("　{Lv.");
            label.push("}　")
          }
          if(e.isFixed()){
            label.splice(1, 0, "---");
          }else{
            label.splice(1, 0, pad(eLv, 3));
          }
          if(count > 1) label.push("《x" + count + "》");
          label.push(e);
          desc = [label.join("")];
          x = e.getMulValue(eLv, !this.version, this.es);

          //連撃
          if(e.type === TYPE.COMBO && this.usecs) x = new Fraction(1);
          //極限
          if(e.type === TYPE.LIMIT){
            x = x.mul(2 * es.maxHp - es.hp, es.maxHp);
            desc[0] += "[HP:" + es.hp + "/" + es.maxHp + "]";
          }
          //カスタム
          if(e.type === TYPE.CUSTOM) x = es.getCustomMul();
          //非強化時
          if(e.type === TYPE.NOT_BUFFED && buffed) x = new Fraction(1);
          //非弱体時
          if(e.type === TYPE.NOT_DEBUFFED && debuffed) x = new Fraction(1);

          switch(e.type){
            default:
              if(x - 0 && x.n !== x.d){
                dmg = dmg.mul(x);
                desc.push("x" + x);
              }
              break;

            case TYPE.ATK:
              if(x - 0){
                atkbonus = atkbonus.add(x);
                desc.push("ATK+" + x.mul(100, 1) + "%");
              }
              break;

            case TYPE.ZERO:
              dmg = new Fraction(0);
              desc.push("x0");
              break;

            case TYPE.WEAPON:
            case TYPE.CSWEAPON:
              break;
          }

          x = e.getAddValue(eLv, !this.version, this.es);

          //カスタム
          if(e.type === TYPE.CUSTOM) x = es.getCustomAdd();
          //非強化時
          if(e.type === TYPE.NOT_BUFFED && buffed) x = new Fraction(0);
          //非弱体時
          if(e.type === TYPE.NOT_DEBUFFED && debuffed) x = new Fraction(0);

          if(x - 0){switch(e.type){
            default:
              x = x.round();
              exdmg += x;
              desc.push(t("ダメージ+/Damage+") + x);
              break;

            case TYPE.SEED:
              x = new Fraction(eLv);
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
          }}
          if(!loop){
            if(desc.length > 1) desc = [desc[0], "（" + desc.slice(1).join(", ") + "）"];
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
    atk = exatk.add(atk, 1).mul(atkbonus);
    result[5] += atk;
    atkbonus = atkbonus.add(-1, 1);
    desc = [];
    if(exatk.n) desc.push((exatk < 0 ? "" : "+") + exatk);
    if(atkbonus.n) desc.push("+" + atkbonus.mul(100, 1) + "%");
    if(desc.length) result[5] += "（" + desc.join(", ") + "）";
    result[6] += WEAPON[weapon];
    result.push(t("【ダメージ】/【Damage】"));
    dmg = dmg.mul(WEAPON[weapon].getValue());
    result[6] += "（x" + WEAPON[weapon].getValue() + "）";
    for(i = 1; i < MULTIPLIER.length; i++){
      var attr = MULTIPLIER[i];
      if(!this.multiplier || i === this.multiplier){
        x = Math.ceil(dmg.mul(atk).mul(attr.getValue()).muln(csrate) + exdmg);
        if(i === 3 || this.multiplier) this.setTitle(x);
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
    cs: 0,
    rarity: 0,
    variant: 0,
    guild: 0,
    school: 0,
    timing1: TIMING.ANY,
    timing2: TIMING.ANY,
    range1: 0,
    range2: 0,
    effect1: 0,
    effect2: 0,
    stef: 0,
    bonus_a: 0,
    bonus_b: 0,
    nullify: 0,
    ar: 0,
    exclude: 0,
    active: 0,
    init: function(){
      var c = this;
      linkTextInput(c, "name", "xf");
      linkInput(c, "attribute", "ef");
      linkInput(c, "weapon", "wf");
      linkInput(c, "cs", "cf");
      linkInput(c, "rarity", "rf");
      linkInput(c, "variant", "vf");
      linkInput(c, "guild", "gf");
      linkInput(c, "school", "sf");
      linkInput(c, "stef", "pf");
      linkInput(c, "bonus_a", "baf");
      linkInput(c, "bonus_d", "bdf");
      linkInput(c, "nullify", "nf");
      linkInput(c, "ar", "qf");
      linkInput(c, "exclude", "ccf");
      linkCheckGroup(c, "timing1", "stf1", function(){
        c.updateEffectFilterOptions(0);
      });
      linkCheckGroup(c, "timing2", "stf2", function(){
        c.updateEffectFilterOptions(1);
      });
      linkInput(c, "range1", "srf1", function(){
        c.updateEffectFilterOptions(0);
      });
      linkInput(c, "range2", "srf2", function(){
        c.updateEffectFilterOptions(1);
      });
      linkInput(c, "effect1", "sef1");
      linkInput(c, "effect2", "sef2");
      this.update();
    },
    updateEffectFilterOptions: function(n){
      var id = n ? "sef2" : "sef1";
      var r = n ? this.range2 : this.range1;
      var b = (n ? this.timing2 : this.timing1) || TIMING.ANY;
      setOptions(id, TAG, function(x){
        return !x.index || x.checkFlag(r, b);
      }, TAG.ORDER[language]);
    },
    toggle: function(){
      if(this.active = 1 - this.active){
        _("sw").style.display = "block";
        setText("tfv", "▲");
        this.update();
      }else{
        _("sw").style.display = "none";
        setText("tfv", "▼");
        this.reset();
      }
    },
    reset: function(){
      var active = this.active;
      this.active = 0;
      ["ef", "wf", "cf", "rf", "vf", "gf", "sf", "pf", "baf", "bdf", "nf", "qf", "srf1", "srf2", "sef1", "sef2", "ccf"].forEach(function(x){
        setValue(x, 0);
      });
      setValue("xf", "");
      setValue("stf1", TIMING.ANY);
      setValue("stf2", TIMING.ANY);
      this.active = active;
      this.update();
    },
    update: function(){
      var p = this;
      var nv = p.name.toLowerCase().replace(/[\u3041-\u3094]/g, function(match){
        return String.fromCharCode(match.charCodeAt(0) + 0x60);
      });
      var av = ATTRIBUTE[p.attribute].getValue();
      var rv = RARITY[p.rarity].getValue();
      var vv = VARIANT[p.variant].name;
      var gv = GUILD[p.guild].getValue();
      var sv = SCHOOL[p.school].getValue();
      var pl = ["[恒常]", "[期間限定]"].indexOf(t(vv, 0));
      var d = p.exclude ? TAG_MAX * 10 : TAG_MAX;
      if(!vv || vv[0] === "["){
        vv = "";
      }else{
        vv = t(vv, 0);
      }
      setOptions("pc", CARD, function(x){
        if(!p.active) return true;
        if(!x.index) return true;
        if(nv && (x.name.toLowerCase().indexOf(nv) === -1 || nv.indexOf("/") !== -1)) return false;
        if(p.rarity && (1 << x.rarity & rv) === 0) return false;
        if(p.weapon && x.weapon[0] !== p.weapon) return false;
        if(p.cs && x.weapon[1] !== p.cs) return false;
        if(p.attribute && (1 << x.attribute & av) === 0) return false;
        if(pl > -1 && x.limited !== pl) return false;
        if(vv && x.variant.indexOf(vv)) return false;
        if(p.guild && !(x.guilds & gv)) return false;
        if(p.school && !(x.schools & sv)) return false;
        if(p.ar && !x.canEquip(AR[p.ar])) return false;
        if(p.timing1 && p.effect1 && x.tag[p.range1].every(function(ie){
          return (p.effect1 !== ie[0] % d) || !(ie[1] & p.timing1);
        })) return false;
        if(p.timing2 && p.effect2 && x.tag[p.range2].every(function(ie){
          return (p.effect2 !== ie[0] % d) || !(ie[1] & p.timing2);
        })) return false;
        if([p.bonus_a, p.bonus_d, p.nullify, p.stef].some(function(te, i){
          return te && x.tag[(i + 3) % 6].every(function(ie){
            return te !== ie[0] % d;
          });
        })) return false;
        return true;
      });
      _("cx").innerHTML = "(" + (_("pc").length - 1) + "/" + (CARD.length - 1) + ")";
    }
  }
};
