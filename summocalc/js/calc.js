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
  NAME: function(x){return x.name},
  ATK_UP: function(x){return (x.group === 0 && (x.value[0] >= 1 || x.value[1] > 0) && !x.event && x.name[0] !== "[" && x.type !== TYPE.AFFINITY) || x.group < 0},
  DEF_DOWN: function(x){return (x.group === 1 && (x.value[0] >= 1 || x.value[1] > 0) && !x.event && x.name[0] !== "[" && x.type !== TYPE.BONUS) || x.group < 0}
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
    if(navigator.share){
      _("cc").style.display = "none";
    }else{
      _("ss").style.display = "none";
    }
    if(!navigator.userAgent.match(/iP(hone|[ao]d)/) || isStandalone()) _("ms").style.display = "none";
    this.cardfilter.init();
    this.setLanguage(-1);
    linkInput(c, "atk", "a");
    linkInput(c, "weapon", "w");
    linkInput(c, "cs", "cs");
    linkInput(c, "cLv", "cl");
    linkInput(c, "usecs", "uc");
    linkInput(c, "version", "sv");
    linkInput(c, "multiplier", "am");
    linkInput(c, "card", "pc", function(){
      c.setEffectOptions();
      c.checkCardSelected();
    });
    linkInput(c, "lv", "pl");
    linkInput(c, "ar", "rc", function(){
      c.setEffectOptions();
    });
    linkInput(c, "arLv", "rl");
    _("sl").onclick = function(){
        c.setLanguage(1 - language);
    };
    _("oa").onclick = function(){
      c.addStatus(v("os"), v("el"), 0, v("ua"));
    };
    _("or").onclick = function(){
      c.addStatus(v("os"), 0, 0);
    };
    _("da").onclick = function(){
      c.addStatus(v("ds"), v("el"), 1, v("ua"));
    };
    _("dr").onclick = function(){
      c.addStatus(v("ds"), 0, 1);
    };
    _("uc").onclick = function(){
      this.blur();
    };
    _("cc").onclick = function(){
      copyText("o");
    };
    _("sr").onclick = function(){
      share({
        text: _("o").value,
        title: document.title
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
    this.es.forEach(function(v, i){
      if(v.loop){
        var e = EFFECT[i];
        s.write(i - n);
        n = i;
        if(!e.isFixed() || !e.isStackable()) tmp.push(v.lv);
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
    });
    s.write(0);
    tmp.forEach(function(v){
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
      this.es.forEach(function(v, i){
        if(i === n && n){
          var e = EFFECT[i];
          v.loop = 1;
          if(!e.isFixed() || !e.isStackable()) v.lv = s.read();
          if(e.isStackable()) v.loop = s.read();
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
          if(tmp.length) n += tmp.shift();
        }else{
          v.clear();
        }
      });
      this.active = 1;
    }
    this.update(skipSave);
    this.setEffectOptions();
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
        if(e.link && !this.es[e.link].loop){
          var tLv = 0;
          while(tLv < 1 || tLv > 100){
            tLv = prompt(t("/Add ") + EFFECT[e.link] + t("を追加 (※Lv.1〜100)/\n(Lv.1-100)"), "");
            if(tLv !== 0 && !tLv) break;
            tLv = parseInt(tLv, 10) || 0;
          }
          if(tLv) this.addStatus(e.link, tLv, 1);
        }
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
          this.es[this.evt].clear();
          this.evt = index;
        }
        //武器種変更
        if(e.type === TYPE.WEAPON && index !== this.wc){
          this.es[this.wc].clear();
          this.wc = index;
        }
        //CS変更
        if(e.type === TYPE.CSWEAPON && index !== this.csc){
          this.es[this.csc].clear();
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
          while(lv < 1 || lv > 1000){
            lv = prompt(t("ATKの種 (※1〜1000)/ATK Seed\n(1-1000)"), es.lv || 1000);
            if(lv !== 0 && !lv) return;
            lv = parseInt(lv, 10) || 0;
          }
        }else if(e.isFixed() || e.type === TYPE.AFFINITY){
          lv = 1;
        }
        es.lv = lv;
        if(e.isStackable()){
          es.loop++;
        }else{
          es.loop = 1;
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
    this.setEffectOptions();
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
    EFFECT_ORDER.sort(function(a, b){
      var x = EFFECT[a];
      var y = EFFECT[b];
      if(x.sortkey !== y.sortkey) return x.sortkey - y.sortkey;
      if(x.sortkey !== 1) return x.index - y.index;
      if(x.reading === y.reading && x.type === TYPE.BONUS && y.type === TYPE.BONUS) return x.value[0] - y.value[0];
      if(x.type === TYPE.WEAPON && y.type === TYPE.WEAPON || x.type === TYPE.CSWEAPON && y.type === TYPE.CSWEAPON) return x.value[1] - y.value[1];
      if(language) return ("" + x).toUpperCase() < ("" + y).toUpperCase() ? -1 : 1;
      if(x.reading === y.reading) return x.index - y.index;
      return x.reading < y.reading ? -1 : 1;
    });
    this.active = 0;
    setOptions("sv", VERSION);
    setOptions("w", WEAPON, FILTER.NAME);
    setOptions("cs", CS, FILTER.VALUE, CS_ORDER);
    setOptions("ua", ELV_MODE);
    setOptions("am", MULTIPLIER);
    setOptions("ef", ATTRIBUTE);
    setOptions("wf", WEAPON);
    setOptions("cf", WEAPON);
    setOptions("rf", RARITY);
    setOptions("vf", VARIANT);
    setOptions("af1", EFFECT, FILTER.ATK_UP, EFFECT_ORDER);
    setOptions("af2", EFFECT, FILTER.ATK_UP, EFFECT_ORDER);
    setOptions("df1", EFFECT, FILTER.DEF_DOWN, EFFECT_ORDER);
    setOptions("df2", EFFECT, FILTER.DEF_DOWN, EFFECT_ORDER);
    setOptions("qf", AR);
    this.setEffectOptions();
    this.checkCardSelected();
    setText("lsv", "モード/Mode");
    setText("lpc", "カード/Card");
    setText("lpl", "カードLv/Card Lv");
    setText("lrc", "AR");
    setText("lrl", "AR Lv");
    setText("lw", "武器タイプ/Weapon Type");
    setText("lcl", "神器Lv/Artifact Lv");
    setText("los", "攻撃側/Offense");
    setText("oa", "追加/Add");
    setText("or", "削除/Remove");
    setText("lds", "防御側/Defense");
    setText("da", "追加/Add");
    setText("dr", "削除/Remove");
    setText("lel", "スキルLv/Skill Lv");
    setText("luc", "CSを使用/Use CS");
    setText("lua", "効果Lv/Effect Lv");
    setText("lam", "属性相性/Attribute");
    setText("cc", "コピー/Copy");
    setText("sr", "結果を共有/Share Result" );
    setText("su", "URLを共有/Share URL");
    setText("rs", "リセット/Reset");
    setText("sl", "English/日本語");
    setText("fc", "カードフィルタ/Filter");
    setText("lef", "属性/Attribute");
    setText("lwf", "武器タイプ/Weapon Type");
    setText("lcf", "CSタイプ/CS Type");
    setText("lrf", "レア度/Rarity");
    setText("lvf", "バージョン/Variant");
    setText("laf1", "攻撃上昇効果1/ATK Up 1");
    setText("laf2", "攻撃上昇効果2/ATK Up 2");
    setText("ldf1", "防御低下効果1/DEF Down 1");
    setText("ldf2", "防御低下効果2/DEF Down 2");
    setText("lqf", "装備可能AR/Equipable AR");
    setText("fr", "リセット/Reset");
    setText("rd", "ランダム/Random");
    setText("dd", "カードデータ: /Card Data: ");
    setText("ad", "ARデータ: /AR Data: ");
    setText("ms", "「ホーム画面に追加」機能でインストールできます/You can install this by 'Add to Home Screen'.");
    setText("um", "新しいデータがあります/New data is available.");
    setText("ub", "更新/Update");
    this.cardfilter.update();
    this.active = 1;
    if(x >= 0) this.update();
  },
  setEffectOptions: function(){
    var p = ["", "{CS} ", "[AR] "];
    var es = this.es;
    var s = [0].concat(
      CARD[this.card].effects
    );
    AR[this.ar].effects.forEach(function(x){
      s.push(EFFECT_MAX * 2 + x);
    });
    s.push(0);
    EFFECT_ORDER.forEach(function(x){
      if(es[x].loop) s.push(x);
    });
    s = s.concat(EFFECT_ORDER);
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
      atk = card.getValue(this.lv);
      weapon = card.weapon[this.usecs];
      cs = CS_ORDER[card.rarity] + card.csBoost;
      setValue("a", atk);
      setValue("w", weapon);
      setValue("cs", cs);
      result[1] = "　[Lv." + pad(this.lv, 3) + "]　" + card;
    }
    if(this.ar){
      var passive = [];
      exatk = ar.getValue(this.arLv);
      cs += ar.csBoost;
      if(exatk > 0) passive.push("ATK+" + exatk);
      if(ar.csBoost > 0) passive.push("CS威力" + ["増加", "大増"][ar.csBoost - 1]);
      if(ar.csWeapon){
        if(this.usecs) weapon = ar.csWeapon;
        passive.push(WEAPON[ar.csWeapon] + "CS");
      }
      result[2] = "　[Lv." + pad(this.arLv, 3) + "]　" + ar;
      if(passive.length) result[2] += "（" + passive.join(",") + "）";
    }
    if(this.usecs){
      csrate = CS[cs].getValue() * (1 + Math.LOG10E * Math.log(this.cLv) / 2);
      result.push(
        t("【チャージスキル】/【Charge Skill】"),
        "　{Lv." + pad(this.cLv, 3) + "}　" + CS[cs] + "（x" + csrate + "）",
        LINE
      );
    }
    for(var group = 0; group < 2; group++){
      desc = [];
      result.push(t([
        "【攻撃側補正】/【Offense】",
        "【防御側補正】/【Defense】"
      ][group]));
      for(var i = 1; i < EFFECT.length; i++){
        var count = 0;
        var e = EFFECT[EFFECT_ORDER[i]];
        var es = this.es[e.index];
        var eLv = es.lv;
        var loop = es.loop;
        if(e.group !== group) continue;
        if(e.isStackable()) count = loop;
        while(loop--){
          var x;
          if(e.isFixed()){
            desc = ["　[Lv.---]　"];
          }else if(!eLv){
            eLv = this.cLv;
            desc = ["　{Lv." + pad(eLv, 3) + "}　"];
          }else{
            desc = ["　[Lv." + pad(eLv, 3) + "]　"];
          }
          if(count > 1) desc[0] += "《x" + count + "》";
          desc[0] += e;
          x = e.getMulValue(eLv, !this.version);
          //貫通
          if(e.link && !this.es[e.link].loop) x = new Fraction(1);
          //連撃
          if(e.type === TYPE.COMBO && this.usecs) x = new Fraction(1);
          //極限
          if(e.type === TYPE.LIMIT){
            x = x.mul(2 * es.maxHp - es.hp, es.maxHp);
            desc[0] += "[HP:" + es.hp + "/" + es.maxHp + "]";
          }
          //カスタム
          if(e.type === TYPE.CUSTOM) x = es.getCustomMul();

          if(x - 0){switch(e.type){
            default:
              if(x.n !== x.d){
                dmg = dmg.mul(x);
                desc.push("x" + x);
              }
              break;

            case TYPE.ATK:
              atkbonus = atkbonus.add(x);
              desc.push("ATK+" + x.mul(100, 1) + "%");
              break;

            case TYPE.NONE:
            case TYPE.WEAPON:
            case TYPE.CSWEAPON:
              break;
          }}

          x = e.getAddValue(eLv, !this.version);
          //武器種変更
          if(e.type === TYPE.WEAPON && !this.usecs) weapon = x.round();
          //CS変更
          if(e.type === TYPE.CSWEAPON && this.usecs) weapon = x.round();
          //カスタム
          if(e.type === TYPE.CUSTOM) x = es.getCustomAdd();

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

            case TYPE.NONE:
            case TYPE.WEAPON:
            case TYPE.CSWEAPON:
              break;
          }}
          if(!loop){
            if(desc.length > 1) desc = [desc[0], "（" + desc.slice(1).join(",") + "）"];
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
    if(desc.length) result[5] += "（" + desc.join(",") + "）";
    result[6] += WEAPON[weapon];
    result.push(t("【ダメージ】/【Damage】"));
    dmg = dmg.mul(WEAPON[weapon].getValue());
    if(dmg > 0) result[6] += "（x" + WEAPON[weapon].getValue() + "）";
    for(i = 1; i < MULTIPLIER.length; i++){
      var attr = MULTIPLIER[i];
      if(!this.multiplier || i === this.multiplier){
        x = (dmg > 0) ? Math.ceil(dmg.mul(atk).mul(attr.getValue()).muln(csrate) + exdmg) : 0;
        if(i === 3 || this.multiplier) this.setTitle(x);
        result.push("　[" + attr + "]: " + (x || "-"));
      }
    }
    result.push(
      LINE,
      t("　モード: /　Mode: ") + VERSION[this.version]
    );
    _("o").value = result.filter(function(x){return x}).join("\n");
    if(!skipSave) this.save();
  },
  setTitle: function(damage){
    document.title = "summocalc - " + (this.card ? CARD[this.card] + " " : "") + damage + t("ダメージ/ damage");
  },
  cardfilter: {
    attribute: 0,
    weapon: 0,
    cs: 0,
    rarity: 0,
    variant: 0,
    atk1: 0,
    atk2: 0,
    def1: 0,
    def2: 0,
    ar: 0,
    active: 0,
    init: function(){
      var c = this;
      linkInput(c, "attribute", "ef");
      linkInput(c, "weapon", "wf");
      linkInput(c, "cs", "cf");
      linkInput(c, "rarity", "rf");
      linkInput(c, "variant", "vf");
      linkInput(c, "atk1", "af1");
      linkInput(c, "atk2", "af2");
      linkInput(c, "def1", "df1");
      linkInput(c, "def2", "df2");
      linkInput(c, "ar", "qf");
    },
    toggle: function(){
      if(this.active = 1 - this.active){
        _("sw").style.display = "block";
        setText("fv", "▲");
      }else{
        _("sw").style.display = "none";
        setText("fv", "▼");
      }
      this.update();
    },
    reset: function(){
      this.active = 0;
      ["ef", "wf", "cf", "rf", "vf", "af1", "af2", "df1", "df2"].forEach(function(x){
        setValue(x, 0);
      });
      this.active = 1;
      this.update();
    },
    update: function(){
      var p = this;
      var av = ATTRIBUTE[p.attribute].getValue();
      var rv = RARITY[p.rarity].getValue();
      var vv = VARIANT[p.variant].name;
      var pl = ["[恒常]", "[期間限定]"].indexOf(t(vv, 0));
      if(!vv || vv[0] === "["){
        vv = "";
      }else{
        vv = t(vv, 0);
      }
      setOptions("pc", CARD, function(x){
        if(!p.active) return true;
        if(!x.index) return true;
        if(p.rarity && (1 << x.rarity & rv) === 0) return false;
        if(p.weapon && x.weapon[0] !== p.weapon) return false;
        if(p.cs && x.weapon[1] !== p.cs) return false;
        if(p.attribute && (1 << x.attribute & av) === 0) return false;
        if(pl > -1 && x.limited !== pl) return false;
        if(vv && x.variant.indexOf(vv)) return false;
        if(p.ar && !x.canEquip(AR[p.ar])) return false;
        if([p.atk1, p.atk2, p.def1, p.def2].some(function(te){
          return te && x.effects.every(function(ie){
            return te !== Math.abs(ie);
          });
        })) return false;
        return true;
      });
    }
  }
};
