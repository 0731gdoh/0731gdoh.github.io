"use strict";

calc.cardfilter = {
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
  teamMode: 0,
  ef: [
    new EffectFilter(1, ["stf", "srf", "scf", "sef"]),
    new EffectFilter(2, ["stf", "srf", "scf", "sef"]),
    new StaticEffectFilter(["baf", "bdf", "nf", "pf", "zf"])
  ],
  ar: 0,
  external: 0,
  evolved: 1,
  exclude: 0,
  defaultValues: new Map(),
  active: 0,
  icon: 1,
  init: function(){
    var c = this;
    this.tabs = [
      new Tab("ltb1"),
      new Tab("ltb2"),
      new Tab("ltb3")
    ];
    c.icon = getStorageItem("icon") !== "0";
    document.body.classList.toggle("showicon", c.icon);
    linkInput(c, "icon", "ic", function(){
      setStorageItem("icon", c.icon ? "1" : "0");
      document.body.classList.toggle("showicon", c.icon);
    });
    linkAll(c, [
      ["weaponChange", "wf_c"],
      ["csChange", "cf_c"],
      ["obtainMode", "obf_mode"],
      ["guildMode", "gf_mode"],
      ["schoolMode", "sf_mode"],
      ["teamMode", "of_mode"],
      ["external", "egf"],
      ["evolved", "evf"],
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
    setCheckGroup("ef", ATTRIBUTE, {sprites: [5, 3]});
    setCheckGroup("wf", WEAPON, {check: "武器種変更を含む/Include Weapon Change", sprites: [3, 3]});
    setCheckGroup("cf", WEAPON, {check: "CS変更を含む/Include Change CS", sprites: [3, 3]});
    setCheckGroup("rf", RARITY);
    setCheckGroup("obf", OBTAIN, {select: OR_AND_NOT});
    setOptions("lmf", LIMITED);
    setOptions("vf", VARIANT, {labels: VARIANT.LABELS});
    this.updateEquipableOptions(ar);
    setCheckGroup("gf", GUILD, {select: OR_AND_NOT});
    setCheckGroup("sf", SCHOOL, {select: OR_AND_NOT});
    setCheckGroup("of", TEAM, {select: OR_AND_NOT});
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
      ["levf", "進化前の効果を除外する/Exclude Pre-Evolution Effects"],
      ["lccf", "CSの効果を除外する/Exclude CS Effects"],
      ["lic", "アイコンを表示/Show Icon"],
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
    setValue("pc", 0);
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
      return ef.getFilter(p.exclude, p.evolved);
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
      if(check(x.teams, p.team, p.teamMode)) return false;
      if(p.ar && !x.canEquip(AR[p.ar], p.external)) return false;
      if(fs.some(function(f){
        return f && f(x);
      })) return false;
      return true;
    }, output: "cx"});
    this.updateNavigate();
  },
  updateNavigate: function(){
    var pc = _("pc");
    _("ccn").textContent = pad(pc.selectedIndex || "----", 4) + "/" + pad(pc.length - 1, 4);
  }
};

calc.arfilter = {
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
    setValue("rc", 0);
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
    }, labels: AR.LABELS, output: "rcx"});
  }
};
