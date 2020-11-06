var TAG_TYPE = {
  CATEGORY: 0,
  BUFF: 1,
  DEBUFF: 2,
  PASSIVE: 3,
  ONE_SHOT: 4,
  WEAPON: 5,
  SKILL: 6,
  SKIP: 7
};

function Tag(index, x, category, subset){
  this.index = index;
  this.name = x[0];
  this.type = x[1];
  this.category = category;
  this.subset = subset;
  this.sortkey = 1;
  this.flag = 0;
}
Tag.prototype = {
  toString: function(){
    if(this.type) return t(this.name);
    if(this.name) return "[" + t(this.name) + "]";
    return LINE;
  },
  setFlag: function(n){
    this.flag = this.flag | (1 << n);
  }
};
Tag.createList = function(a){
  var table = new Map();
  var f = function(x){
    return table.get(x);
  };
  var b = [];
  var d = [];
  a.forEach(function(v, i){
    table.set(v[0], i);
    if(v[1] === TAG_TYPE.BUFF) b.push(i);
    if(v[1] === TAG_TYPE.DEBUFF) d.push(i);
  });
  return a.map(function(v, i){
    var c = [];
    var s = [];
    switch(v[0]){
      case "全ての強化":
        s = b;
        break;
      case "全ての弱体":
        s = d;
        break;
      default:
        if(v[2]) c = v[2].split("/").map(f);
        if(v[3]) s = v[3].split("/").map(f);
    }
    return new Tag(i, v, c, s);
  });
};

var TAG_MAX = 10000;

var TAG = Tag.createList(
  [["", 0]
  ,["全ての強化", 1]
  ,["全ての弱体", 2]
  ,["移動不能状態", 7, "", "威圧/恐怖/崩し/不動/マヒ"]
  ,["攻撃力低下状態", 7, "", "強化反転/暗闇/幻惑/束縛/呪い/マヒ"]
  ,["スキル封印状態", 7, "", "スキル封印/束縛/二重封印"]
  ,["被ダメージ増加状態", 7, "", "強化反転/崩し/激怒/激怒+/弱点/凍結/暴走/暴走+/烙印"]
  ,["防御力増加状態", 7, "", "頑強/金剛/守護/聖油/防御強化"]
  ,["CP減少", 4, "CP減少系"]
  ,["CP増加", 4, "CP増加系"]
  ,["CS封印", 2, "CS封印系"]
  ,["CS変更", 1]
  ,["CS変更：打撃", 1, "CS変更"]
  ,["CS変更：魔法", 1, "CS変更"]
  ,["CS変更：横一文字", 1, "CS変更"]
  ,["CS変更：全域", 1, "CS変更"]
  ,["HP回復", 4, "HP回復系"]
  ,["HP減少", 4, "HP減少系"]
  ,["威圧", 2, "移動封印系"]
  ,["意気", 1, "攻撃増加系"]
  ,["移動力増加", 3]
  ,["移動力増加(縦)", 3, "移動力増加"]
  ,["移動力増加(横)", 3, "移動力増加"]
  ,["移動力増加(全)", 3, "移動力増加/移動力増加(縦)/移動力増加(横)"]
  ,["祈り", 1, "発動率増加系"]
  ,["温泉", 1, "CP増加系"]
  ,["回避", 1, "防御増加系"]
  ,["回避に貫通", 3, "特攻/貫通系"]
  ,["獲得経験値アップ", 3, ""]
  ,["獲得コインアップ", 3, ""]
  ,["加速", 1, "CP増加系"]
  ,["頑強", 1, "防御増加系"]
  ,["頑強に貫通", 3, "特攻/貫通系"]
  ,["強化解除", 4]
  ,["強化解除(単)", 4, "強化解除"]
  ,["強化解除(複)", 4, "強化解除"]
  ,["強化解除(全)", 4, "強化解除/強化解除(複)"]
  ,["強化奪取", 4]
  ,["強化奪取(単)", 4, "強化奪取/強化解除/強化解除(単)/強化を複製"]
  ,["強化奪取(複)", 4, "強化奪取/強化解除/強化解除(複)/強化を複製"]
  ,["強化転写(全)", 4, "強化を貼付(味方から)"]
  ,["強化反転", 2, "攻撃減少系/防御減少系"]
  ,["強化無効", 2, ""]
  ,["強化を複製", 4, ""]
  ,["強化を貼付(味方から)", 4, ""]
  ,["強化を貼付(敵から)", 4, ""]
  ,["強制移動無効(後)", 3, ""]
  ,["強制移動無効(全)", 3, "強制移動無効(後)"]
  ,["恐怖", 2, "CP減少系/移動封印系"]
  ,["極限", 1, "攻撃増加系"]
  ,["崩し", 2, "防御減少系/移動封印系"]
  ,["暗闇", 2, "攻撃減少系/CS封印系"]
  ,["クリティカル", 1, "攻撃増加系"]
  ,["クリティカル+", 1, "攻撃増加系"]
  ,["クリティカル++", 1, "攻撃増加系"]
  ,["係留", 1, ""]
  ,["激怒", 1, "攻撃増加系/防御減少系", "激怒+"]
  ,["激怒+", 1, "攻撃増加系/防御減少系"]
  ,["激怒+時強化", 1, "発動率増加系"]
  ,["幻惑", 2, "攻撃減少系"]
  ,["劫火", 2, "防御減少系"]
  ,["攻撃強化", 1, "攻撃増加系"]
  ,["攻撃力減少", 2, "攻撃減少系"]
  ,["攻撃力微増", 1, "攻撃増加系"]
  ,["剛力", 1, "攻撃増加系"]
  ,["告死", 2, "HP減少系"]
  ,["金剛", 1, "防御増加系"]
  ,["金剛に貫通", 3, "特攻/貫通系"]
  ,["根性", 1, ""]
  ,["根性時強化", 1, "攻撃増加系"]
  ,["再生", 1, "HP回復系"]
  ,["弱体解除", 4]
  ,["弱体解除(単)", 4, "弱体解除"]
  ,["弱体解除(複)", 4, "弱体解除"]
  ,["弱体解除(全)", 4, "弱体解除/弱体解除(複)"]
  ,["弱体時強化", 1, "HP回復系/CP増加系"]
  ,["弱体奪取", 4]
  ,["弱体奪取(複)", 4, "弱体奪取/弱体解除/弱体解除(複)/弱体を複製(味方に)"]
  ,["弱体転写(全)", 4, "弱体を貼付"]
  ,["弱体反射", 1, "弱体無効系"]
  ,["弱体無効", 1, "弱体無効系"]
  ,["弱体を複製(味方に)", 4, ""]
  ,["弱体を複製(敵に)", 4, ""]
  ,["弱体を貼付", 4, ""]
  ,["弱点", 2, "防御減少系"]
  ,["集中", 1, "攻撃増加系/発動率増加系"]
  ,["祝福", 1, "HP回復系"]
  ,["守護", 1, "防御増加系"]
  ,["守護に貫通", 3, "特攻/貫通系"]
  ,["守護無効化", 2, "防御減少系"]
  ,["滋養", 1, "攻撃増加系/HP回復系"]
  ,["スキル封印", 2, "スキル封印系"]
  ,["聖油", 1, "防御増加系/HP回復系"]
  ,["聖油時弱体", 3, "防御減少系"]
  ,["聖油に貫通", 3, "特攻/貫通系"]
  ,["全方向移動力増加", 1, "移動力一時増加系"]
  ,["全方向移動力大増", 1, "移動力一時増加系"]
  ,["束縛", 2, "攻撃減少系/スキル封印系"]
  ,["束縛時強化", 1, "攻撃増加系"]
  ,["脱力", 2, "CP減少系/発動率減少系"]
  ,["注目", 1, ""]
  ,["注目時強化", 1, "発動率増加系"]
  ,["凍結", 2, "防御減少系/HP減少系"]
  ,["闘志", 1, "攻撃増加系"]
  ,["毒", 2, "HP減少系"]
  ,["毒反転", 1, "攻撃増加系/防御増加系/HP回復系"]
  ,["特防", 3]
  ,["特防[0.01]", 3, "特防"]
  ,["特防[0.1]", 3, "特防"]
  ,["特防[0.2]", 3, "特防"]
  ,["特防[0.3]", 3, "特防"]
  ,["特防[0.5]", 3, "特防"]
  ,["特防[0.6]", 3, "特防"]
  ,["特防[0.7]", 3, "特防"]
  ,["特防[0.8]", 3, "特防"]
  ,["特防[1.7]", 3, "特防"]
  ,["特防[10.0]", 3, "特防"]
  ,["特攻", 3]
  ,["特攻[1.3]", 3, "特攻"]
  ,["特攻[1.4]", 3, "特攻"]
  ,["特攻[1.5]", 3, "特攻"]
  ,["特攻[1.6]", 3, "特攻"]
  ,["特攻[2.0]", 3, "特攻"]
  ,["特攻[2.3]", 3, "特攻"]
  ,["特攻[2.5]", 3, "特攻"]
  ,["特攻[3.0]", 3, "特攻"]
  ,["特攻[4.0]", 3, "特攻"]
  ,["特攻[6.0]", 3, "特攻"]
  ,["二重封印", 2, "スキル封印系/CS封印系"]
  ,["熱情", 1, "攻撃増加系/CP増加系"]
  ,["呪い", 2, "攻撃減少系"]
  ,["引き寄せ", 4]
  ,["引き寄せ(1マス)", 4, "強制移動系/引き寄せ"]
  ,["引き寄せ(2マス)", 4, "強制移動系/引き寄せ"]
  ,["引き寄せ(4マス)", 4, "強制移動系/引き寄せ"]
  ,["非根性時強化", 1, "防御増加系"]
  ,["憑依", 2, ""]
  ,["閃き", 1, "発動率増加系"]
  ,["武器種変更", 1]
  ,["武器種変更：斬撃", 1, "武器種変更"]
  ,["武器種変更：突撃", 1, "武器種変更"]
  ,["武器種変更：打撃", 1, "武器種変更"]
  ,["武器種変更：魔法", 1, "武器種変更"]
  ,["武器種変更：横一文字", 1, "武器種変更"]
  ,["武器種変更：狙撃", 1, "武器種変更"]
  ,["武器種変更：全域", 1, "武器種変更"]
  ,["武器種変更：無", 1, "武器種変更"]
  ,["吹き飛ばし(縦)", 4]
  ,["吹き飛ばし(1マス)", 4, "強制移動系/吹き飛ばし(縦)"]
  ,["吹き飛ばし(2マス)", 4, "強制移動系/吹き飛ばし(縦)"]
  ,["吹き飛ばし(3マス)", 4, "強制移動系/吹き飛ばし(縦)"]
  ,["吹き飛ばし(右)", 4, "強制移動系"]
  ,["吹き飛ばし(左)", 4, "強制移動系"]
  ,["不動", 1, "CP増加系/移動封印系"]
  ,["奮起", 1, "CP増加系"]
  ,["妨害", 2, "発動率減少系"]
  ,["防御強化", 1, "防御増加系"]
  ,["防御強化に貫通", 3, "特攻/貫通系"]
  ,["防御強化無効化", 2, "防御減少系"]
  ,["暴走", 1, "攻撃増加系/防御減少系", "暴走+"]
  ,["暴走+", 1, "攻撃増加系/防御減少系"]
  ,["暴走+時強化", 1, "攻撃増加系/防御増加系"]
  ,["マヒ", 2, "攻撃減少系/移動封印系"]
  ,["魅了", 2, ""]
  ,["無窮", 1, "攻撃増加系/HP減少系"]
  ,["猛毒", 2, "HP減少系"]
  ,["火傷", 2, "HP減少系"]
  ,["烙印", 2, "防御減少系/HP減少系"]
  ,["連撃", 1, "攻撃増加系"]

  ,["斬撃", 5]
  ,["突撃", 5]
  ,["打撃", 5]
  ,["射撃", 5]
  ,["魔法", 5]
  ,["狙撃", 5]
  ,["横一文字", 5]
  ,["全域", 5]
  ,["無", 5]

  ,["鬼系スキル", 7, "", "鬼道の衆/鬼道を束ねる者"]
  ,["獣系スキル", 7, "", "首狩りの獣/獣の末裔/獣皮を巻く者/黄昏に弾く獣/忠玉の八犬士"]
  ,["チート系スキル", 7, "", "チート系勇者/チートなる者"]
  ,["魔王系スキル", 7, "", "僥倖の魔王/混沌の魔王/退廃の魔王/第四天魔王の子/大力の魔王/常闇の魔王/墓場の魔王/魔王"]

  ,["愛を囚う者", 6]
  ,["アスリート", 6, "", "歓呼のアスリート/直感のアスリート"]
  ,["海を航る者", 6]
  ,["泳達者", 6]
  ,["大筒の支配者", 6]
  ,["歓呼のアスリート", 6]
  ,["鬼道の衆", 6]
  ,["鬼道を束ねる者", 6]
  ,["僥倖の魔王", 6]
  ,["狂戦士", 6]
  ,["巨人なる者", 6]
  ,["首狩りの獣", 6]
  ,["獣の末裔", 6, "", "首狩りの獣/黄昏に弾く獣/忠玉の八犬士"]
  ,["混沌の魔王", 6]
  ,["支配者", 6, "", "大筒の支配者"]
  ,["島に生きる者", 6]
  ,["獣皮を巻く者", 6]
  ,["須弥山に篭る者", 6]
  ,["大雪山に篭る者", 6]
  ,["退廃の魔王", 6]
  ,["第四天魔王の子", 6]
  ,["大力の魔王", 6]
  ,["黄昏に弾く獣", 6]
  ,["祟られし者", 6]
  ,["チート系勇者", 6]
  ,["チートなる者", 6]
  ,["忠玉の八犬士", 6]
  ,["直感のアスリート", 6]
  ,["翼持つ者", 6]
  ,["天地創造者", 6]
  ,["常闇の魔王", 6]
  ,["轟く者", 6]
  ,["墓場の魔王", 6]
  ,["不死身なる者", 6]
  ,["魔王", 6, "", "第四天魔王の子"]
  ,["マシンボディ", 6]
  ,["緑を育む者", 6]
  ,["山に篭る者", 6, "", "須弥山に篭る者/大雪山に篭る者"]
  ,["有尾の悪魔", 6]
  ,["雷光を現す者", 6]
  ,["竜を継ぐ者", 6]
  ,["霊体", 6]

  ,["攻撃増加系", 0]
  ,["攻撃減少系", 0]
  ,["防御増加系", 0]
  ,["防御減少系", 0]
  ,["HP回復系", 0]
  ,["HP減少系", 0]
  ,["CP増加系", 0]
  ,["CP減少系", 0]
  ,["弱体無効系", 0]
  ,["発動率増加系", 0]
  ,["発動率減少系", 0]
  ,["移動力一時増加系", 0]
  ,["強制移動系", 0]
  ,["移動封印系", 0]
  ,["スキル封印系", 0]
  ,["CS封印系", 0]
  ,["貫通系", 0]
]);

var TAG_ORDER = TAG.map(function(v, i){return i});

var TAG_FLAG = {
  SELF: 0,
  ALLY: 1,
  ENEMY: 2,
  BONUS_A: 3,
  BONUS_D: 4,
  NULLIFY: 5,
  PASSIVE: 6
};

function splitTagNames(s, flag){
  var r = [];
  if(s) s.split("/").forEach(function(x){
    var g = 0;
    var sf = true;
    if(x[0] === "c"){
      x = x.slice(1);
      g = TAG_MAX;
    }
    if(x.slice(0, 3) === "全ての") sf = false;
    var e = TAG.some(function(tag, i){
      if(tag.type && t(tag.name, 0) === x){
        var f = (tag.type === TAG_TYPE.PASSIVE) ? TAG_FLAG.PASSIVE : flag;
        if(r.indexOf(g + i) !== -1) throw new Error("タグ「" + x + "」が重複しています\n（" + s + "）");
        if(tag.type !== TAG_TYPE.SKIP){
          r.push(g + i);
          tag.setFlag(f);
        }
        (flag < 3 ? tag.category : tag.subset).forEach(function(c){
          if(r.indexOf(g + c) === -1) r.push(g + c);
          if(sf) TAG[c].setFlag(f);
        });
        return true;
      }
      return false;
    });
    if(!e) throw new Error("タグ「" + x + "」は有効なタグとして登録されていません\n（" + s + "）");
  });
  return r;
}
