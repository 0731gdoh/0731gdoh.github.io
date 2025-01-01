"use strict";

function EffectParameter(e){
  this.effect = e;
  this.group = this.effect.group;
  this._clear();
  if(e.subset){
    var order = [];
    var f = function(a, v){
      var tag = TAG[v];
      var x = e.subset.get(v);
      if(x) a.push(x);
      x = e.subset.get(v + TAG_MAX);
      if(x) a.push(x);
      if(tag.variant.length) return tag.variant.reduce(f, a);
      return a;
    };
    order.push(TAG.LOCALE_ORDER[0].reduce(f, []));
    order.push(TAG.LOCALE_ORDER[1].reduce(f, []));
    this.subsetOrder = order;
  }
};
EffectParameter.prototype = {
  toString: function(){
    return this.effect.toString() + this.label;
  },
  _clear: function(){
    this.lv = 0;
    this.loop = 0;
    this.label = "";
    this.hp = 1;
    this.maxHp = 1;
    this.c = 0;
    this.a = 0;
    this.unit = 0;
  },
  decrementLoop: function(){
    var target = this;
    if(this.alt && this.altLength){
      this.alt.forEach(function(ep){
        if(ep.loop) target = ep;
      });
    }
    if(--target.loop < 1) target.clear();
  },
  clear: function(){
    if(this.exclusive){
      this.exclusive.forEach(function(ep){
        ep._clear();
      });
    }else{
      this._clear();
    }
    this.updateLabel();
  },
  updateLabel: function(){
    if(this.alt){
      var last;
      var n = 0;
      var pd = this.effect.promptData;
      this.alt.forEach(function(ep){
        if(ep.loop){
          ++n;
          ep.label = pd ? " #" + n : (ep.lv ? " [Lv." + ep.lv + "]" : " [CS]");
          last = ep;
        }else{
          ep.label = "";
        }
      });
      if(n === 1) last.label = "";
    }
  },
  setLevel: function(lv, loop){
    if(this.alt){
      var pd = this.effect.promptData;
      if(pd){
        this.alt[pd.getDataNum(lv)]._setLevel(lv, loop);
        return;
      }else{
        var target;
        this.alt.some(function(ep){
          if(!ep.loop){
            if(!target) target = ep;
          }else if(ep.lv === lv){
            target = ep;
            return true;
          }
          return false;
        });
        if(target){
          target._setLevel(lv, loop);
          if(target.loop) this.alt.sort(function(a, b){
            return a.lv - b.lv;
          });
        }
        return;
      }
    }else if(this.effect.type === TYPE.SEED){
      if(this.exclusive[0] !== this){
        this.exclusive[0].setLevel(lv, loop);
        return;
      }else if(!lv){
        this.clear();
        return;
      }
      lv = Math.min(lv, 2000);
    }else if(this.exclusive){
      this.exclusive.forEach(function(ep){
        if(ep !== this) ep.clear();
      });
    }
    this._setLevel(lv, loop);
  },
  _setLevel: function(lv, loop){
    if(!this.effect.isStackable()){
      this.loop = 1;
    }else{
      var limit = this.getLoopLimit();
      if(!limit){
        return;
      }else if(loop){
        this.loop = Math.min(loop, limit);
      }else if(this.loop < limit){
        this.loop++;
      }
    }
    this.lv = lv;
    this.updateLabel();
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
  },
  setUnitNum: function(u){
    this.unit = u;
  },
  getLoopSum: function(){
    if(this.alt) return this.alt.reduce(function(a, ep){
      return a + ep.loop;
    }, 0);
    return this.loop;
  },
  getLoopLimit: function(){
    if(this.alt) return 15 - this.getLoopSum() + this.loop;
    return 15;
  },
  hpPrompt: function(chara){
    var hp = 0;
    var maxHp = 0;
    while(hp < 1){
      hp = prompt(t(chara || "") + t("現在HP (※1以上の整数)/Current HP\n(Enter an integer greater than or equal to 1.)"), this.hp);
      if(!hp) return false;
      hp = parseInt(hp, 10) || 0;
    }
    while(maxHp < hp){
      maxHp = prompt(t(chara || "") + t("最大HP (※/Max HP\n(Enter an integer greater than or equal to ") + hp + t("以上の整数)/.)"), Math.max(this.maxHp, hp));
      if(!maxHp) return false;
      maxHp = parseInt(maxHp, 10) || 0;
    }
    return this.setHp(hp, maxHp);
  },
  setHp: function(hp, maxHp){
    var target = this;
    var result = 1;
    if(this.alt && this.effect.promptData){
      var n = this.effect.promptData.getDataNumFromHp(hp, maxHp);
      target = this.alt[n];
      this.setLevel(n);
      result = -1;
    }
    target.hp = Math.max(Math.min(hp, maxHp), 1);
    target.maxHp = Math.max(maxHp, 1);
    return result;
  }
};
EffectParameter.createList = function(){
  var event = [];
  var cwt = [];
  var cst = [];
  var seed = [];
  var extend = [];
  var result = [];
  EFFECT.forEach(function(e){
    var ep = new EffectParameter(e);
    result.push(ep);
    if(e.event){
      ep.exclusive = event;
      event.push(ep);
    }else{
      switch(e.type){
        case TYPE.WEAPON:
          ep.exclusive = cwt;
          cwt.push(ep);
          break;
        case TYPE.CSWEAPON:
          ep.exclusive = cst;
          cst.push(ep);
          break;
        case TYPE.SEED:
          ep.exclusive = seed;
          seed.push(ep);
          break;
      }
    }
    if(e.isAlt()) extend.push(ep);
    if(e.equ){
      var equ = result[e.equ];
      if(!equ.exclusive) equ.exclusive = [equ];
      (ep.exclusive = equ.exclusive).push(ep);
    }
  });
  extend.forEach(function(ep){
    var pd = ep.effect.promptData;
    var length = pd ? pd.data.length : 15;
    var alt = [];
    while(alt.length < length){
      var o = new EffectParameter(ep.effect);
      var index = result.length;
      alt.push(o);
      result.push(o);
      o.alt = alt;
      o.index = index;
    }
    ep.altLength = length;
    ep.alt = alt;
  });
  return result;
};
