const _ = (id) => document.getElementById(id);

const setOptions = (id, iter) => {
  const f = document.createDocumentFragment();
  for(const v of iter){
    const o = document.createElement("option");
    o.textContent = v;
    f.appendChild(o);
  }
  _(id).appendChild(f);
};

const output = () => {
  const expBonus = _("x").selectedIndex;
  const coinBonus = _("g").selectedIndex;
  const eventBonus = _("e").selectedIndex * 10;
  const mode = _("u").selectedIndex;
  const numHeroes = 4;
  const unit = ["s", "min", "h", "exp", "ラフ"][mode];
  const type = ["営業時間", "営業時間", "営業時間", "経験値", "ラフ"][mode];
  const result = [
    `「スタミナ1あたりの報酬」をすべて「${type}」に換算`,
    `条件: Exp+${expBonus}%, ラフ+${coinBonus}%, Event+${eventBonus}%`
  ];
  for(const q of quests){
    if(_(`quest${q.id}`).checked){
      const eventRate = q.eventRate || 1;
      const exp = (Math.floor(q.heroExp * (100 + expBonus) / 100) + q.heroBand) * numHeroes * 9 * eventRate;
      let average = 0;
      let numerator = q.stamina * eventRate;
      let p = 0;
      switch(mode){
        case 1:
          numerator *= 60;
          break;
        case 2:
          numerator *= 3600;
          break;
        case 3:
          numerator *= 9;
          break;
        case 4:
          numerator *= 6;
          break;
        default:
      }
      result.push("");
      result.push(`${q.name}:`);
      for(const d of q.drops){
        let t = (d.expItems.reduce(sum, 0) + d.bandItems.reduce(sum, 0)) * 9 * eventRate;
        t += d.coins.reduce((a, v) => a + Math.floor(v * (100 + coinBonus) / 100), 0) * 6 * eventRate;
        t += (d.eventItems.reduce((a, v) => a + Math.floor(v * (100 + eventBonus) / 100), 0) + d.otherItems.reduce(sum, 0)) * 900;
        t += exp;
        average += t * d.probability;
        p += d.probability;
        t = Math.round(t * 10000 / numerator) / 10000;
        if(d.label) result.push(`${d.label}: ${t}${unit}`);
      }
      if(p){
        average = Math.round(average * 10000 / (numerator * p)) / 10000;
        result.push(`期待値: ${average}${unit}`);
      }
    }
  }
  _("o").value = result.join("\n");
};

const sum = (x, y) => x + y;

const copyText = (id) => {
  let r = 1;
  try{
    const range = document.createRange();
    range.selectNode(_(id));
    window.getSelection().addRange(range);
    if(document.execCommand("copy")) r = 0;
  }catch(e){
    r = 1;
  }
  alert(["コピーしました", "コピーに失敗しました"][r]);
};

const share = (data) => {
  try{
    navigator.share(data);
  }catch(e){}
};

const createQuestCheckbox = (quest) => {
  const span = document.createElement("span");
  const label = document.createElement("label");
  const check = document.createElement("input");
  const id = `quest${quest.id}`;
  label.textContent = quest.name;
  label.htmlFor = id;
  check.type = "checkbox";
  check.checked = true;
  check.id = id;
  span.className = "ib";
  span.appendChild(check);
  span.appendChild(label);
  return span;
};

const init = () => {
  const f = _("f");
  const o = _("o");
  const r = Array.from({length: 31}, (v, i) => `${i}%`);
  setOptions("x", r);
  setOptions("g", r);
  setOptions("e", Array.from({length: 9}, (v, i) => `${i * 10}%`));
  setOptions("u", ["秒", "分", "時間", "Exp", "ラフ"]);
  for(const q of quests){
    f.insertBefore(createQuestCheckbox(q), o);
  };
  output();
  setEventHandler();
};

const setEventHandler = () => {
  if("share" in navigator){
    _("s").onclick = () =>{
      share({
        text: _("o").value,
        url: location.href
      });
    };
  }else{
    _("s").style.display = "none";
  }
  _("c").onclick = () => {
    copyText("o");
  };
  _("f").onchange = output;
};

onload = () => {
  init();
};
