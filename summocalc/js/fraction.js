function gcd(n, m){
  if(n > m){
    var t = n;
    n = m;
    m = t;
  }
  if(n) return gcd(m % n, n);
  return m;
}

function Fraction(n, d){
  if(d && d < 0){
    d = -d;
    n = -n;
  }
  this.n = Math.abs(Math.round(n)) || 0;
  this.d = Math.round(d) || 1;
  this.s = n < 0 ? -1 : 1;
  this.reduce();
}
Fraction.prototype = {
  reduce: function(){
    var x = gcd(this.n, this.d);
    this.d /= x;
    this.n /= x;
  },
  add: function(x, y){
    if(y) x = new Fraction(x, y);
    return new Fraction(
      this.n * this.s * x.d + x.n * x.s * this.d,
      this.d * x.d
    );
  },
  mul: function(x, y){
    if(y) x = new Fraction(x, y);
    return new Fraction(
      this.n * x.n * this.s * x.s,
      this.d * x.d
    );
  },
  muln: function(x){
    return this.n * x / this.d * this.s;
  },
  round: function(){
    var x = Math.round(this.valueOf());
    if(this.d === 2 && x & 1) x--;
    return x;
  },
  valueOf: function(){
    return this.n / this.d * this.s;
  }
};
