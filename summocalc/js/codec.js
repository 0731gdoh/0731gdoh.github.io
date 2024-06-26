"use strict";

var B64TABLE = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

var Encoder = function(){
  this.data = [];
  this.last = 0;
  this.n = 0;
};
Encoder.prototype = {
  write: function(v){
    if(v === this.last){
      this.n++;
    }else{
      if(this.n) this.data = this.data.concat(this._dot());
      this.n = 0;
      this.last = v;
      this.data.push(this._encode(v));
    }
  },
  _encode: function(v){
    var r = [];
    do{
      var n = v & 31;
      v >>= 5;
      if(r.length) n += 32;
      r.unshift(B64TABLE[n]);
    }while(v);
    return r.join("");
  },
  _dot: function(){
    var x = [];
    if(this.n === 1 && this.last < 32){
      x.push(B64TABLE[this.last]);
    }else if(this.n){
      x.push(B64TABLE[32] + this._encode(this.n - 1));
    }
    return x;
  },
  toString: function(){
    return this.data.concat(this._dot()).join("");
  }
};

var Decoder = function(s){
  this.data = s;
  this.pos = 0;
  this.n = 0;
  this.last = 0;
};
Decoder.prototype = {
  read: function(){
    if(this.n){
      this.n--;
      return this.last;
    }else{
      var v = this._read();
      if(v < 0){
        this.n = this._read();
        return this.last;
      }else{
        this.last = v;
        return v;
      }
    }
  },
  _read: function(){
    var v = 0;
    do{
      var n = B64TABLE.indexOf(this.data[this.pos++]);
      if(n < 0) return 0;
      if(n === 32 && !v) return -1;
      v <<= 5;
      v += n & 31;
    }while(n & 32);
    return v;
  }
};
