"use strict";

function EffectParameter(e){
  this.effect = e;
  this.group = this.effect.group;
  this._clear();
  if(e.subset){
    var order = [];
    var f = function(a, v){
      var x = e.subset.get(v);
      if(x) a.push(x);
      x = e.subset.get(v + TAG_MAX);
      if(x) a.push(x);
      return a;
    };
    order.push(TAG.ORDER[0].reduce(f, []));
    order.push(TAG.ORDER[1].reduce(f, []));
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
  clear: function(){
    if(this.exclusive){
      this.exclusive.forEach(function(ep){
        ep._clear();
      });
    }else{
      this._clear();
    }
    if(this.alt && this.subsetOrder){
      var last;
      this.alt.forEach(function(ep){
        if(ep.loop) last = ep;
      });
      if(last) last._clear();
    }
    this.updateLabel();
  },
  updateLabel: function(){
    if(this.alt){
      var last;
      var n = 0;
      this.alt.forEach(function(ep){
        if(ep.loop){
          ep.label = " #" + (++n);
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
        var target = this.alt[pd.getDataNum(lv)];
        if(target !== this){
          target.setLevel(lv, loop);
          this.updateLabel();
          return;
        }
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
    this.lv = lv;
    if(!this.effect.isStackable()){
      this.loop = 1;
    }else if(loop){
      this.loop = Math.min(loop, 15);
    }else if(this.loop < 15){
      this.loop++;
    }
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
    if(e.hasAlt()) extend.push(ep);
    if(e.equ){
      var equ = result[e.equ];
      if(!equ.exclusive) equ.exclusive = [equ];
      (ep.exclusive = equ.exclusive).push(ep);
    }
  });
  extend.forEach(function(ep){
    var pd = ep.effect.promptData;
    if(pd){
      var length = pd.data.length;
      var order = [];
      var alt = [];
      while(alt.length < length){
        var o = new EffectParameter(ep.effect);
        alt.push(o);
        order.push(result.length);
        result.push(o);
        o.alt = alt;
      }
      ep.subsetOrder = [order, order];
      ep.alt = alt;
    }
  });
  return result;
};
