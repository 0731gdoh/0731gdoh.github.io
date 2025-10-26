"use strict";

const checkColorPicker = () => {
  const color = document.createElement("input");
  color.type = "color";
  color.value = "invalid";
  return color.type === "color" && color.value !== "invalid";
};

const randomColor = () => {
  const r = () => (0x120 + Math.floor(Math.random() * 0x80)).toString(16).slice(1);
  return `#${r()}${r()}${r()}`;
};

const count = (s) => {
  return [...new Intl.Segmenter().segment(s)].length;
};

class BaseItem {
  setDefaultParams(){
    this.params = new Map(this.constructor.defaultParams);
  }
  get(key){
    if(this.checkSkipFlag(key)) return 0;
    return this.params.get(key);
  }
  getEquip(key){
    if(this.get(key + "装備")){
      const value = Math.floor(this.get(key + "Lv.") / 10);
      return 5 > value ? 0 : value;
    }
    return 0;
  }
  checkSkipFlag(key){
    const flagKey = this.constructor.skipFlagMap.get(key);
    if(flagKey && !this.get(flagKey)) return true;
    return false;
  }
  set(key, value){
    return this.params.set(key, value);
  }
  checkDisabled(){
    return false;
  }
}

class Unit extends BaseItem {
  constructor(name, data){
    super();
    this.name = name;
    this.setDefaultParams();
    if(data) this.importData(data);
  }
  static skipFlagMap = new Map([
    ["SK View", "SKを使用"],
    ["ファン数", "ファン数を使用"],
  ]);
  static defaultParams = new Map([
    ["View", 1500],
    ["SK View", 350],
    ["SKを使用", true],
    ["ファン数", 1000],
    ["ファン数を使用", false],
    ["刻印", 0],
    ["color", ""],
    ["モクダイLv.", 100],
    ["モクダイ装備", false],
    ["コウキLv.", 100],
    ["コウキ装備", false],
    ["ナリヒトLv.", 100],
    ["ボレアリスLv.", 100],
    ["ボレアリス装備", false],
    ["ダンゾーLv.", 100],
    ["ダンゾー装備", false],
    ["メリデLv.", 100],
    ["メリデ装備", false],
    ["ヨハックLv.", 100],
    ["ヨハック装備", false],
    ["ヤスヒコLv.", 100],
    ["ノーモンLv.", 100],
  ]);
  static maxValue = new Map([
    ["View", 9999],
    ["SK View", 500],
    ["ファン数", 1000],
    ["刻印", 100],
  ]);
  static suggests = new Map([
    ["SK View", [0, 200, 275, 350, 425, 500]],
  ]);
  static select = new Map();
  exportData(){
    const result = [];
    for(const [key, value] of this.params){
      if(this.constructor.defaultParams.get(key) !== value){
        result.push(key);
        switch(typeof value){
          case "boolean":
            result.push(value ? "+" : "");
            break;
          case "number":
            result.push(value.toString(36));
            break;
          default:
            result.push(value);
        }
      }
    }
    return `${this.name}/${result.join(",")}`;
  }
  importData(data){
    let key = "";
    let n = 1;
    for(const v of data.split(",")){
      if(n & 1){
        key = v;
      }else if(this.params.has(key)){
        switch(typeof this.constructor.defaultParams.get(key)){
          case "boolean":
            this.set(key, !!v);
            break;
          case "number":
            this.set(key, parseInt(v, 36));
            break;
          default:
            this.set(key, v);
        }
      }
      n++;
    }
  }
}

const DISABLE = {
  IF_NOT_UNIT: 1,
  IF_UNIT: 2,
  ALWAYS: 3,
};

class Action extends BaseItem {
  constructor(unit){
    super();
    if(unit instanceof Action){
      this.unit = unit.unit || undefined;
      this.params = new Map(unit.params);
    }else{
      this.unit = unit;
      this.setDefaultParams();
    }
  }
  get name(){
    return this.unit ? this.unit.name : "";
  }
  checkDisabled(key){
    const flag = this.constructor.disabled.get(key) || 0;
    switch(flag){
      default:
        return false;
      case DISABLE.IF_NOT_UNIT:
        return !this.unit;
      case DISABLE.IF_UNIT:
        return !!this.unit;
      case DISABLE.ALWAYS:
        return true;
    }
  }
  get(key){
    let value;
    if(this.checkSkipFlag(key)) return 0;
    if(this.unit) value = this.unit.get(key);
    return value || this.params.get(key) || 0;
  }
  static skipFlagMap = new Map([
    ["刻印", "刻印を適用"],
  ]);
  static disabled = new Map([
    ["View", DISABLE.IF_UNIT],
    ["補正後View", DISABLE.ALWAYS],
    ["ナリヒト装備", DISABLE.IF_NOT_UNIT],
    ["ノーモン装備", DISABLE.IF_NOT_UNIT],
    ["ウェイト", DISABLE.IF_NOT_UNIT],
    ["刻印を適用", DISABLE.IF_NOT_UNIT],
    ["最終コスト", DISABLE.ALWAYS],
    ["追加コスト", DISABLE.ALWAYS],
    ["消費後VP", DISABLE.ALWAYS],
    ["ヤスヒコ装備", DISABLE.IF_NOT_UNIT],
  ]);
  static defaultParams = new Map([
    ["View", 1500],
    ["注目", false],
    ["発破/発破+", 0],
    ["ナリヒト装備", false],
    ["補正後View", 0],
    ["ノーモン装備", false],
    ["ウェイト", false],
    ["color", ""],
    ["消費VP", 0],
    ["刻印を適用", false],
    ["ショウエン常時", 0],
    ["誓約（付与数）", 0],
    ["引力", false],
    ["消費減少", 0],
    ["覚醒", false],
    ["消費増加", 0],
    ["過消費", false],
    ["最終コスト", 0],
    ["追加消費VP", 0],
    ["追加最大", 0],
    ["追加コスト", 0],
    ["消費後VP", 0],
    ["VP獲得", 0],
    ["協奏", false],
    ["行動後View", true],
    ["ヤスヒコ装備", false],
    ["COMBO", 0],
    ["COMBO継続", true],
    ["COMBO加算", 1],
  ]);
  static maxValue = new Map([
    ["View", 9999],
    ["発破/発破+", 1000],
    ["消費VP", 99999],
    ["誓約（付与数）", 99],
    ["消費減少", 99999],
    ["消費増加", 99999],
    ["追加消費VP", 99999],
    ["VP獲得", 99999],
    ["COMBO", 99],
    ["COMBO加算", 9],
  ]);
  static suggests = new Map([
    ["発破/発破+", [0, [500, "発破"], [1000, "発破+"]]],
    ["消費減少", [0, 500, 1000, 1250, 1500, 2000, 3000]],
  ]);
  static select = new Map([
    ["ショウエン常時", ["0%", "4%", "8%", "12%", "16%", "20%"]],
    ["追加最大", ["0回", "1回", "2回", "3回", "4回", "5回"]],
  ]);
}

class BaseManager {
  constructor(id, itemClass){
    const fieldset = document.getElementById(id);
    const div = document.createElement("div");
    const button = document.createElement("input");
    this.counter = document.createElement("output");
    this.container = document.createElement("div");
    this.Item = itemClass;
    this.data = [];
    button.type = "button";
    button.value = "＋";
    button.addEventListener("click", this.createAddButtonHandler());
    div.className = "appendpanel";
    div.append(button, this.counter);
    fieldset.append(this.container, div);
    this.updateCounter();
    fieldset.addEventListener("focusin", this.createFocusinHandler());
    fieldset.addEventListener("focusout", this.createFocusoutHandler());
    this.datalist = new Map();
    if(itemClass.suggests){
      let index = 0;
      for(const [key, value] of itemClass.suggests){
        const id = `${this.constructor.name}-${index++}`;
        this.appendDatalist(fieldset, id, value);
        this.datalist.set(key, id);
      }
    }
    this.autoCollapse = true;
    this.insertAutoCollapse();
  }
  createAddButtonHandler(){
    return () => {
      this.safeAddItem();
    };
  }
  createFocusoutHandler(){
    return (e) => {
      const elem = e.target;
      if(["number", "text"].includes(elem.type) && elem.list){
        if(!elem.value) elem.value = elem.dataset.backup;
        delete elem.dataset.backup;
      }
    };
  }
  createFocusinHandler(){
    return (e) => {
      const elem = e.target;
      if(["number", "text"].includes(elem.type)){
        if(elem.list){
          elem.dataset.backup = elem.value;
          elem.value = "";
        }else{
          setTimeout(function(){
            try{
              elem.setSelectionRange(0, elem.value.length);
            }catch(e){
              elem.select();
            }
          }, 0);
        }
      }
    };
  }
  insertAutoCollapse(){
    const content = document.createElement("div");
    const label = document.createElement("label");
    const input = document.createElement("input");
    content.append(label);
    input.type = "checkbox";
    input.checked = this.autoCollapse;
    input.addEventListener("change", this.createAutoCollapseHandler());
    label.append(input, "追加時に他を折りたたむ");
    this.insertPanel(content);
  }
  createAutoCollapseHandler(){
    return (e) => {
      this.autoCollapse = e.target.checked;
    };
  }
  appendDatalist(parent, id, list){
    const datalist = document.createElement("datalist");
    datalist.id = id;
    for(const value of list){
      const option = document.createElement("option");
      if(value.length){
        option.value = value[0];
        option.label = value[1];
      }else{
        option.value = value;
      }
      datalist.append(option);
    }
    parent.append(datalist);
  }
  static maxItem = 999;
  updateCounter(){
    this.counter.value = `${this.data.length}/${this.constructor.maxItem}`;
    if(this.data.length >= this.constructor.maxItem){
      this.counter.classList.add("full");
    }else{
      this.counter.classList.remove("full");
    }
  }
  safeAddItem(...args){
    if(this.constructor.maxItem > this.data.length) return this.addItem(...args);
    alert(`これ以上追加できません (${this.data.length}/${this.constructor.maxItem})`);
  }
  addItem(...args){
    const item = new this.Item(...args);
    this.data.push(item);
    if(this.autoCollapse) this.collapseAll();
    this.appendPanel(item);
    this.updateCounter();
    this.update("add", item);
    return item;
  }
  removeItem(item){
    const index = this.data.indexOf(item);
    if(index === -1) return;
    this.data.splice(index, 1);
    this.container.children[index].remove();
    this.updateCounter();
    this.update("remove", item);
    return item;
  }
  moveItem(item){
    const b = this.data.indexOf(item);
    const a = b - 1;
    if(a >= 0){
      const children = this.container.children;
      [this.data[a], this.data[b]] = [this.data[b], this.data[a]];
      children[b].after(children[a]);
      this.update("move");
    }
  }
  setParams(item, key, value){
    item.set(key, value);
    this.update("set", item);
  }
  insertPanel(content){
    const div = document.createElement("div");
    div.className = "panel";
    content.className = "content";
    div.append(content);
    this.container.before(div);
  }
  appendPanel(item){
    const div = document.createElement("div");
    const bar = document.createElement("div");
    const left = document.createElement("div");
    const right = document.createElement("div");
    const label = document.createElement("label");
    const plus = document.createElement("div");
    const minus = document.createElement("div");
    const checkbox = document.createElement("input");
    const title = document.createElement("output");
    const header = this.createHeader(item);
    const footer = this.createFooter(item);
    let initialColor = item.get("color");
    if(!initialColor){
      initialColor = randomColor();
      item.set("color", initialColor);
    }
    if(!item.unit){
      const color = document.createElement("input");
      const rainbow = document.createElement("label");
      color.type = "color";
      color.value = initialColor;
      color.addEventListener("change", this.createColorChangeHandler(div, item));
      rainbow.className = "colorlabel";
      rainbow.textContent = "🌈";
      rainbow.append(color);
      right.append(rainbow);
    }
    div.style.backgroundColor = initialColor + "40";
    div.className = "panel";
    bar.className = "titlebar";
    this.appendButton(right, "🔼", this.createMoveItemHandler(item)).className = "upbutton";
    this.appendButton(right, "❌", this.createRemoveItemHandler(item));
    if(item.name) title.value = item.name;
    checkbox.type = "checkbox"
    plus.textContent = "[+]";
    minus.textContent = "[-]";
    plus.className = "plus";
    minus.className = "minus";
    label.className = "expand";
    label.append(checkbox, plus, minus);
    left.append(label, title);
    bar.append(left, right);
    div.append(bar);
    if(header){
      header.className = "header";
      div.append(header);
      this.appendHR(div);
    }
    this.container.append(div);
    this.appendContent(div, item);
    if(footer){
      this.appendHR(div);
      footer.className = "footer";
      div.append(footer);
    }
  }
  createColorChangeHandler(div, item){
    return (e) => {
      const color = e.target.value;
      div.style.backgroundColor = color + "40";
      this.setParams(item, "color", color);
    };
  }
  createMoveItemHandler(item){
    return () => {
      this.moveItem(item);
    };
  }
  createRemoveItemHandler(item){
    return () => {
      this.removeItem(item);
    };
  }
  appendButton(parent, label, onclick){
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = label;
    button.addEventListener("click", onclick);
    parent.append(button);
    return button;
  }
  appendContent(parent, item){
    const content = document.createElement("div");
    const gridA = document.createElement("div");
    const gridB = document.createElement("div");
    let current = gridA;
    gridA.className = "grid";
    gridB.className = "grid";
    content.className = "content";
    content.append(gridA);
    this.appendHR(content);
    content.append(gridB);
    parent.append(content);
    for(const [key, value] of item.params){
      if(key === "color"){
        current = gridB;
      }else{
        this.appendInput(current, item, key, value);
      }
    }
  }
  appendHR(parent){
    parent.append(document.createElement("hr"));
  }
  static classNameTable = new Map();
  createSelect(list){
    const select = document.createElement("select");
    for(const value of list){
      const option = document.createElement("option");
      option.textContent = value;
      select.append(option);
    }
    return select;
  }
  appendInput(parent, item, key, value){
    const select = item.constructor.select.get(key);
    const label = document.createElement("label");
    const input = select ? this.createSelect(select) : document.createElement("input");
    const text = document.createElement("span");
    const list = this.datalist.get(key);
    const className = this.constructor.classNameTable.get(key);
    text.textContent = key;
    label.append(input);
    input.disabled = item.checkDisabled(key);
    if(className) label.classList.add(className);
    parent.append(label);
    if(select){
      label.prepend(text);
      label.classList.add("select");
      input.selectedIndex = value;
      input.addEventListener("change", this.createSelectChangeHandler(item, key));
      return;
    }
    switch(typeof value){
      case "number":
        if(input.disabled) value = 0;
        label.prepend(text);
        label.classList.add("number");
        input.type = "number";
        input.value = value;
        input.min = 0;
        if(key.endsWith("Lv.")){
          input.max = 100;
          input.classList.add("lv");
        }else{
          input.max = this.Item.maxValue.get(key);
        }
        if(list) input.setAttribute("list", list);
        input.addEventListener("change", this.createNumberChangeHandler(item, key));
        break;
      case "boolean":
        if(input.disabled) value = false;
        label.append(text);
        label.classList.add("checkbox");
        input.type = "checkbox";
        input.checked = value;
        input.addEventListener("change", this.createCheckboxChangeHandler(item, key));
        break;
    }
  }
  createSelectChangeHandler(item, key){
    return (e) => {
      this.setParams(item, key, e.target.selectedIndex);
    };
  }
  createNumberChangeHandler(item, key){
    return (e) => {
      const value = Math.min(e.target.max, Math.max(0, e.target.value | 0));
      e.target.value = value;
      this.setParams(item, key, value);
    };
  }
  createCheckboxChangeHandler(item, key){
    return (e) => {
      this.setParams(item, key, e.target.checked);
    };
  }
  createHeader(){

  }
  createFooter(){

  }
  update(type, item){

  }
  collapseAll(){
    for(const checkbox of this.container.querySelectorAll(".expand input")) checkbox.checked = true;
  }
}

class UnitDialog{
  constructor(){
    const dialog = document.createElement("dialog");
    const form = document.createElement("form");
    const title = document.createElement("div");
    const modeBlock = document.createElement("div");
    const storageBlock = document.createElement("div");
    const nameBlock = document.createElement("div");
    const control = document.createElement("div");
    const label = document.createElement("label");
    const select = document.createElement("select");
    const input = document.createElement("input");
    const create = document.createElement("input");
    const load = document.createElement("input");
    const ok = document.createElement("input");
    const cancel = document.createElement("input");
    form.method = "dialog";
    title.className = "titlebar";
    create.type = "button";
    create.value = "新規";
    create.className = "new";
    load.type = "button";
    load.value = "ロード";
    load.className = "load";
    modeBlock.append(create, load);
    modeBlock.className = "mode";
    storageBlock.append(select);
    storageBlock.className = "storage";
    input.type = "text";
    input.autofocus = true;
    label.append("名前：", input);
    nameBlock.append(label);
    nameBlock.className = "name";
    ok.type = "submit";
    ok.value = "OK";
    cancel.type = "button";
    cancel.value = "Cancel";
    cancel.autofocus = true;
    control.className = "control";
    control.append(cancel, ok);
    form.append(title, modeBlock, storageBlock, nameBlock, control);
    dialog.append(form);
    document.body.append(dialog);
    create.addEventListener("click", this.createNewModeHandler());
    load.addEventListener("click", this.createLoadModeHandler());
    cancel.addEventListener("click", this.createCancelHandler(dialog));
    dialog.addEventListener("close", this.createCloseHandler(dialog));
    dialog.addEventListener("click", this.createBackdropHandler(dialog));
    form.addEventListener("submit", this.createValidator(input, select));
    form.noValidate = true;
    this.form = form;
    this.dialogElement = dialog;
  }
  createNewModeHandler(){
    return () => {
      this.setMode("new");
    };
  }
  createLoadModeHandler(){
    return () => {
      this.setMode("load");
    };
  }
  createCancelHandler(dialog){
    return () => {
      dialog.close("");
    };
  }
  createCloseHandler(dialog){
    return () => {
      if(dialog.returnValue === "OK"){
        const value = this.getValue();
        this.resolve(value);
      }else{
        this.resolve(null);
      }
      delete this.promise;
      delete this.resolve;
    };
  }
  getValue(){
    if(this.mode === "new"){
      const value = this.form.querySelector(".name input").value;
      if(this.getNameValidateMessage(value)) return null;
      return [value];
    }else{
      const index = this.form.querySelector(".storage select").selectedIndex;
      if(this.mode === "load"){
        if(this.getLoadValidateMessage(index)) return null;
        return this.list[index];
      }
      if(index) return index;
      return null;
    }
  }
  createBackdropHandler(dialog){
    return (e) => {
      if(!e.target.closest("form")) dialog.close("");
    };
  }
  setMode(mode){
    this.form.className = this.mode = mode;
  }
  getNameValidateMessage(value){
    if(!value){
      return "名前を入力してください";
    }else if(/[\\\/:*?""<>|]/.test(value)){
      return '名前には次の文字は使えません \\ / : * ? " < > |';
    }else if(count(value) > 10){
      return "名前は10文字以内にしてください";
    }
    return "";
  }
  getLoadValidateMessage(index){
    const [name, value] = this.list[index];
    if(!name){
      return "ロードするデータを選択してください";
    }else if(!value){
      return "データがありません";
    }
    return "";
  }
  getSaveValidateMessage(index){
    if(!index){
      return "保存先を選択してください";
    }else{
      const [name, value] = this.list[index];
      if(name && !confirm(`<${name}>に上書きしますか？`)) return "保存先を選択してください";
      return "";
    }
  }
  createValidator(input, select){
    return (e) => {
      let inputMessage = "";
      let selectMessage = "";
      switch(this.mode){
        case "new":
          inputMessage = this.getNameValidateMessage(input.value);
          break;
        case "load":
          selectMessage = this.getLoadValidateMessage(select.selectedIndex);
          break;
        case "save":
          selectMessage = this.getSaveValidateMessage(select.selectedIndex);
          break;
      }
      input.setCustomValidity(inputMessage);
      select.setCustomValidity(selectMessage);
      if(inputMessage || selectMessage){
        e.preventDefault();
        this.form.reportValidity();
      }
    };
  }
  setStorageList(list){
    const select = this.form.querySelector("select");
    let n = 0;
    this.list = list;
    if(!select.options.length){
      let length = list.length;
      while(length--){
        const option = document.createElement("option");
        select.append(option);
      }
      select.options[0].textContent = "データを選択してください";
    }
    for(const [key, value] of list){
      if(n){
        const option = select.options[n];
        const index = `${100 + n}：`.slice(1);
        const name = key ? `<${key}>` : ""
        option.textContent = index + name;
      }
      n++;
    }
  }
  showModal(mode, list){
    if(this.promise){
      return this.promise;
    }else{
      this.form.querySelector(".titlebar").textContent = mode === "save" ? "キャラを保存" : "キャラを追加";
      this.setStorageList(list);
      this.setMode(mode);
      this.form.reset();
      this.promise = new Promise(resolve => {
        this.resolve = resolve;
      });
      this.dialogElement.showModal();
      return this.promise;
    }
  }
}

class StorageManager {
  constructor(){
    this.updateList();
    window.addEventListener("storage", () => {
      this.updateList();
    });
    window.addEventListener("pageshow", (e) => {
      if(e.persisted) this.updateList();
    });
  }
  updateList(){
    const list = [["", ""]];
    for(let i = 1; 20 >= i; i++){
      const key = `unit${i}`;
      const value = localStorage.getItem(key) || "";
      const data = this.splitValue(value);
      list.push(data || ["", ""]);
    }
    this.list = list;
  }
  getList(){
    return this.list;
  }
  splitValue(value){
    const data = value.split("/");
    if(data.length === 2 && data[0] && data[1] && 10 >= count(data[0])) return data;
    return;
  }
  save(n, value){
    const data = this.splitValue(value);
    if(n > 0 && data){
      this.list[n] = data;
      localStorage.setItem(`unit${n}`, value);
    }
  }
}

class UnitManager extends BaseManager{
  constructor(id, timeline){
    super(id, Unit);
    this.timeline = timeline;
    this.autoAdd = true;
    this.insertConfigPanel();
    this.storage = new StorageManager();
    this.dialog = new UnitDialog();
  }
  insertConfigPanel(){
    const content = document.createElement("div");
    const label = document.createElement("label");
    const input = document.createElement("input");
    content.append(label);
    input.type = "checkbox";
    input.checked = this.autoAdd;
    input.addEventListener("change", this.createConfigPanelHandler());
    label.append(input, "タイムラインに自動追加");
    this.insertPanel(content);
  }
  createConfigPanelHandler(){
    return (e) => {
      this.autoAdd = e.target.checked;
    };
  }
  static maxItem = 10;
  async addItem(){
    const result = await this.dialog.showModal("new", this.storage.getList());
    if(result && result[0]){
      const item = super.addItem(...result);
      if(this.autoAdd) this.timeline.addItem(item);
    }
  }
  async saveItem(item){
    const result = await this.dialog.showModal("save", this.storage.getList());
    if(result) this.storage.save(result, item.exportData());
  }
  createFooter(item){
    const footer = document.createElement("div");
    const button = document.createElement("input");
    this.appendButton(footer, "💾", this.createSaveButtonHandler(item));
    button.type = "button";
    button.value = "タイムラインに追加";
    button.addEventListener("click", this.createAddTimelineButtonHandler(item));
    footer.append(button);
    return footer;
  }
  createSaveButtonHandler(item){
    return () => {
      this.saveItem(item);
    };
  }
  createAddTimelineButtonHandler(item){
    return () => {
      this.timeline.safeAddItem(item);
    };
  }
  update(type, item){
    switch(type){
      case "add":
      case "move":
        break;
      case "remove":
      case "set":
        this.timeline.update(`${type}-unit`, item);
    }
  }
}

class TimelineManager extends BaseManager{
  constructor(id){
    super(id, Action);
    this.insertInitialVP();
    this.initialVP = 1;
  }
  insertInitialVP(){
    const content = document.createElement("div");
    const label = document.createElement("label");
    const input = document.createElement("input");
    content.append(label);
    label.textContent = "ViewPower";
    input.type = "number";
    input.min = 1;
    input.max = 999999;
    input.value = 1;
    input.addEventListener("change", this.createInitialVPHandler());
    label.append(input);
    this.insertPanel(content);
  }
  createInitialVPHandler(){
    return (e) => {
      const value = Math.min(e.target.max, Math.max(0, e.target.value | 0));
      e.target.value = value;
      this.initialVP = value;
      this.update();
    };
  }
  createHeader(){
    const header = document.createElement("div");
    const output = document.createElement("output");
    output.textContent = "ViewPower 0";
    header.append(output);
    return header;
  }
  createFooter(item){
    const footer = document.createElement("div");
    const div = document.createElement("div");
    const button = document.createElement("input");
    const output = document.createElement("output");
    button.type = "button";
    button.value = "複製";
    button.addEventListener("click", this.createCloneButtonHandler(item));
    output.textContent = "ViewPower 0";
    div.append(button);
    footer.append(div, output);
    return footer;
  }
  createCloneButtonHandler(item){
    return () => {
      this.safeAddItem(item);
    };
  }
  static classNameTable = new Map([
    ["View", "view"],
    ["補正後View", "modview"],
    ["COMBO", "combo"],
    ["最終コスト", "cost"],
    ["消費後VP", "spend"],
    ["追加最大", "max"],
    ["追加コスト", "additional"],
  ]);
  calc(item, currentVP, comboCount, block){
    let view = item.get("View");
    let gain = item.get("VP獲得");
    let combo = 10;
    let cost = item.get("消費VP");
    let div = 1;
    let vow = item.get("誓約（付与数）");
    let additional = item.get("追加消費VP");
    const seal = item.get("刻印");
    const viewUp = 100 + item.getEquip("モクダイ") + item.getEquip("コウキ") + item.getEquip("ナリヒト") * 2;
    const gainUp = 100 + item.getEquip("ボレアリス") + item.getEquip("ダンゾー");
    const melide = item.getEquip("メリデ") * 25;
    const yohack = item.getEquip("ヨハック") * 30;
    const yasuhiko = item.getEquip("ヤスヒコ") * 40;
    const gnomon = item.getEquip("ノーモン") * 25;
    const shoen = item.get("ショウエン常時");
    const max = item.get("追加最大");
    const after = item.get("行動後View");
    const color = item.get("color");
    const comboInput = block.querySelector(".combo input");
    if(item.get("COMBO継続")){
      comboInput.value = comboCount;
      item.set("COMBO", comboCount);
      comboInput.disabled = true;
    }else{
      comboCount = item.get("COMBO");
      comboInput.disabled = false;
    }
    combo = this.combo(comboCount);
    block.style.backgroundColor = color + "40";
    view += item.get("SK View");
    if(item.unit) block.querySelector(".view input").value = view;
    view *= viewUp;
    if(item.get("注目")) view = view * 3 / 2;
    view = Math.floor(view / 100);
    view += item.get("ファン数");
    view += item.get("発破/発破+");
    block.querySelector(".modview input").value = view;
    if(0 > currentVP){
      block.querySelector(".header output").value = "\u2937 VPが足りません";
    }else{
      if(melide && !gnomon) currentVP += Math.floor(Math.floor(view * melide / 1000) * combo / 10);
      block.querySelector(".header output").value = `\u2937 ViewPower ${currentVP}`;
    }
    if(item.get("ウェイト") || gnomon){
      block.querySelectorAll(".grid")[1].classList.add("hide");
      if(gnomon) currentVP += Math.floor(Math.floor(view * gnomon / 1000) * combo / 10);
      block.querySelector(".footer output").value = `\u2937 ViewPower ${currentVP}`;
      return [currentVP, comboCount];
    }else{
      block.querySelectorAll(".grid")[1].classList.remove("hide");
    }
    if(seal) cost = Math.floor(cost * (1000 - seal * 2) / 1000);
    if(item.get("引力")){
      cost *= 9;
      div *= 10;
    }
    if(shoen){
      cost *= 25 - shoen;
      div *= 25;
    }
    if(item.get("過消費")) cost *= 2;
    if(item.get("覚醒")) div *= 2;
    if(div > 1) cost /= div;
    while(vow--) cost = cost * 19 / 20;
    cost = Math.max(0, Math.floor(cost) + item.get("消費増加") - item.get("消費減少"));
    block.querySelector(".cost input").value = cost;
    if(cost > currentVP){
      block.querySelector(".footer output").value = "\u2937 VPが足りません";
      return [-1, 0];
    }
    currentVP -= cost;
    if(additional && max){
      additional *= Math.min(max, Math.floor(currentVP / additional));
      block.querySelector(".additional input").value = additional;
      currentVP -= additional;
    }
    block.querySelector(".spend input").value = currentVP;
    gain *= gainUp;
    if(item.get("協奏")) gain = gain * 3 / 2;
    gain = Math.floor(gain / 100);
    if(after) gain += view;
    currentVP += Math.floor(gain * combo / 10);
    comboCount += item.get("COMBO加算");
    combo = this.combo(comboCount);
    if(after){
      let afterVP = 0;
      if(yohack) afterVP += Math.floor(view * yohack / 1000);
      if(yasuhiko) afterVP += Math.floor(view * yasuhiko / 1000);
      if(afterVP) currentVP += Math.floor(afterVP * combo / 10);
    }
    block.querySelector(".footer output").value = `\u2937 ViewPower ${currentVP}`;
    return [currentVP, comboCount];
  }
  combo(n){
    if(!n) return 10;
    return Math.min(15, n + 9);
  }
  update(type, item){
    const block = this.container.querySelectorAll(".panel");
    let vp = this.initialVP;
    let cc = 0;
    let n = 0;
    for(const data of this.data){
      if(type === "remove-unit" && data.unit === item){
        data.unit = 0;
        block[n].classList.add("deleted");
        block[n].querySelector(".titlebar output").value = "削除済";
        block[n].querySelector(".header output").value = block[n].querySelector(".footer output").value = "\u2937 ViewPower -";
        for(const input of block[n].querySelectorAll(".content input, .content select, .footer input")) input.disabled = true;
      }else if(data.unit !== 0){
        [vp, cc] = this.calc(data, vp, cc, block[n]);
      }
      n++;
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const tm = new TimelineManager("timeline");
  const um = new UnitManager("unit", tm);
  if(checkColorPicker()) document.documentElement.classList.add("hidecolor");
});
