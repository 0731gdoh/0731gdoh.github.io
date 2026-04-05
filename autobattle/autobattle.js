"use strict";

const WEAPONS = [
  {
    name: "斬",
    type: "relative",
    offsets: [
      [-1, -1],
      [0, -1],
      [1, -1],
    ],
  },
  {
    name: "突",
    type: "relative",
    offsets: [
      [0, -1],
      [0, -2],
    ],
  },
  {
    name: "打",
    type: "relative",
    offsets: [
      [0, -1],
    ],
  },
  {
    name: "射",
    type: "relative",
    offsets: [
      [0, -1],
      [0, -2],
      [0, -3],
    ],
  },
  {
    name: "魔",
    type: "relative",
    offsets: [
      [0, -1],
      [-1, -2],
      [0, -2],
      [1, -2],
      [0, -3],
    ],
  },
  {
    name: "横",
    type: "relative",
    offsets: [
      [-2, -1],
      [-1, -1],
      [0, -1],
      [1, -1],
      [2, -1],
    ],
  },
  {
    name: "狙",
    type: "relative",
    offsets: [
      [0, -1],
      [0, -2],
      [0, -3],
      [0, -4],
      [0, -5],
    ],
  },
  {
    name: "無",
    type: "none",
    offsets: [
    ],
  },
  {
    name: "全",
    type: "all",
    offsets: [
    ],
  },
];

class Cell{
  constructor(){
    this.type = "";
    this.unit = "";
    this.oob = false;
    this.horizontal = 1;
    this.vertical = 1;
  }
  setOoB(oob){
    this.oob = oob;
    this.setType("");
  }
  setUnit(name){
    if(this.oob && name) return;
    this.unit = name;
  }
  setType(type){
    if(this.oob && type) return;
    this.type = type;
  }
  setWeapon(weapon){
    if(!this.unit) return;
    this.weapon = weapon;
  }
  setHorizontal(value){
    if(!this.unit || value < 0 || value > 4) return;
    this.horizontal = value;
  }
  
  setVertical(value){
    if(!this.unit || value < 0 || value > 4) return;
    this.vertical = value;
  }
  
  setMovable(movable){
    if(!this.unit) return;
    this.movable = movable;
  }
}

function* range(n){
  for(let i = 0; i < n; ++i) yield i;
}

class Board{
  constructor(){
    this.cells = [];
    this.enemyUnits = new Set();
    this.playerUnits = new Set();
    this.positionMap = new Map();
    for(const y of range(6)){
      const current = [];
      for(const x of range(5)){
        const pos = [x, y];
        const cell = new Cell(pos);
        current.push(cell);
        this.positionMap.set(cell, pos);
      }
      this.cells.push(current);
    }
    this.setBoardSize(true, true);
  }
  setBoardSize(w, h){
    this.area = [
      w ? 0 : 1,
      h ? 0 : 1,
      w ? 4 : 3,
      h ? 5 : 4,
    ];
    this.setPlayerUnits();
    for(const [y, row] of this.cells.entries()){
      if(!h && y % 5 === 0){
        for(const cell of row) this.setOoB(cell, true);
      }else{
        for(const [x, cell] of row.entries()) this.setOoB(cell, (!w && x % 4 === 0));
      }
    }
    this.updateArea();
  }
  setOoB(cell, flag){
    if(flag){
      this.enemyUnits.delete(cell);
      cell.setUnit("");
    }
    cell.setOoB(flag);
  }
  toggleUnit(cell){
    if(this.enemyUnits.has(cell)){
      this.enemyUnits.delete(cell);
      cell.setUnit("");
    }else if(!cell.oob && cell.type !== "player"){
      this.enemyUnits.add(cell);
      cell.setUnit("敵");
    }
  }
  setPlayerUnits(){
    const initialPositions = [
      [1, 3],
      [3, 3],
      [1, 4],
      [3, 4],
    ];
    if(this.playerUnits.size){
      for(const cell of this.playerUnits){
        const posA = this.positionMap.get(cell);
        const posB = initialPositions.shift();
        this.swapCells(posA, posB);
      }
    }else{
      for(const name of ["1st", "2nd", "3rd", "4th"]){
        const cell = this.getCell(initialPositions.shift());
        this.playerUnits.add(cell);
        cell.setUnit(name);
        cell.setWeapon(WEAPONS.at(-2));
      }
    }
  }
  updateLines(){
    const fn = (cell) => this.positionMap.get(cell)[1];
    this.enemyLine = Math.max(...Array.from(this.enemyUnits, fn), this.area[1]) + 1;
    this.playerLine = Math.min(...Array.from(this.playerUnits, fn));
    this.movableArea = this.area.toSpliced(1, 1, this.enemyLine);
  }
  updateArea(){
    this.updateLines();
    for(const [y, row] of this.cells.entries()){
      const type = y < this.enemyLine ? "enemy" : y < this.playerLine ? "neutral" : "player";
      for(const cell of row) cell.setType(type);
    }
  }
  getCell(pos){
    return this.cells[pos[1]][pos[0]];
  }
  swapCells(posA, posB){
    const cellA = this.getCell(posA);
    const cellB = this.getCell(posB);
    this.moveCell(cellA, posB);
    this.moveCell(cellB, posA);
  }
  moveCell(cell, pos){
    this.cells[pos[1]][pos[0]] = cell;
    this.positionMap.set(cell, pos);
  }
}

const createSVG = (tag) => document.createElementNS("http://www.w3.org/2000/svg", tag);

class SVGPath{
  constructor(){
    this.svg = createSVG("svg");
    const defs = createSVG("defs");
    const marker = createSVG("marker");
    const arrow = createSVG("path");
    marker.id = "arrow";
    marker.setAttributeNS(null, "viewBox", "0 0 10 10");
    marker.setAttributeNS(null, "refX", 5);
    marker.setAttributeNS(null, "refY", 5);
    marker.setAttributeNS(null, "markerUnits", "userSpaceOnUse");
    marker.setAttributeNS(null, "markerWidth", 5);
    marker.setAttributeNS(null, "markerHeight", 5);
    marker.setAttributeNS(null, "orient", "auto");
    arrow.setAttributeNS(null, "d", "M 0 0 L 10 5 L 0 10 L 1 5 z");
    this.lines = [
      createSVG("polyline"),
      createSVG("polyline"),
    ];
//    for(const line of this.lines) line.setAttributeNS(null, "pathLength", 100);
    this.svg.setAttributeNS(null, "viewBox", "0 0 50 60");
    marker.append(arrow);
    defs.append(marker);
    this.svg.append(defs, ...this.lines);
    this.points = [];
  }
  get route(){
    if(this.points.length > 1) return this.points.slice(-9).map(([x, y]) => `${x * 10 + 5},${y * 10 + 5}`).join(" ");
    return "";
  }
  draw(){
    for(const line of this.lines) line.setAttributeNS(null, "points", this.route);
  }
  push(...points){
    for(const point of points){
      const prev = this.points.at(-2);
      if(prev && prev[0] === point[0] && prev[1] === point[1]){
        this.points.pop();
      }else{
        this.points.push(point);
      }
    }
  }
  clear(){
    for(const line of this.lines) line.setAttributeNS(null, "points", "");
    this.points.length = 0;
  }
}

const create = (tag) => document.createElement(tag);

const createDiv = (className) => {
  const div = create("div");
  div.className = className;
  return div;
};

const createLabel = (...items) => {
  const label = create("label");
  label.append(...items);
  return label;
};

const createCheck = (checked, className) => {
  const check = create("input");
  check.type = "checkbox";
  check.checked = checked;
  if(className) check.className = className;
  return check;
};

const createSelect = (list, className) => {
  const select = create("select");
  for(const text of list){
    const option = create("option");
    option.textContent = text;
    select.append(option);
  }
  if(className) select.className = className;
  return select;
};

const createSpan = (...contents) => {
  const span = create("span");
  span.append(...contents);
  return span;
};

class BoardDOM{
  constructor(board){
    this.board = board;
  }
  init(){
    if(this.boardElement) return this.boardElement;
    const board = createDiv("board");
    this.cells = [];
    this.path = new SVGPath();
    for(const y of range(6)){
      this.cells.push([]);
      for(const x of range(5)){
        const cellElement = createDiv("cell");
        board.append(cellElement);
        this.moveCell(cellElement, [x, y]);
      }
    }
    board.append(this.path.svg);
    document.body.prepend(board);
    this.boardElement = board;
    this.update();
  }
  update(){
    for(const [y, row] of this.cells.entries()){
      for(const x of row.keys()) this.updateCell([x, y]);
    }
  }
  updateCell(pos){
    const cell = this.getCell(pos);
    const data = this.board.getCell(pos);
    if(data.oob){
      cell.dataset.type = "oob";
    }else{
      cell.dataset.type = data.type;
    }
    if(data.unit){
      cell.dataset.unit = data.unit;
    }else{
      delete cell.dataset.unit;
    }
    if(data.weapon){
      cell.dataset.weapon = data.weapon.name;
    }else{
      delete cell.dataset.weapon;
    }
  }
  getCell(pos){
    return this.cells[pos[1]][pos[0]];
  }
  swapCells(posA, posB){
    const cellA = this.getCell(posA);
    const cellB = this.getCell(posB);
    this.moveCell(cellA, posB);
    this.moveCell(cellB, posA);
    this.board.swapCells(posA, posB);
  }
  moveCell(cell, pos){
    this.cells[pos[1]][pos[0]] = cell;
    cell.style.gridColumn = pos[0] + 1;
    cell.style.gridRow = pos[1] + 1;
  }
}

class BoardThumbnail extends BoardDOM{
  constructor(board){
    super(board);
    this.init();
  }
}

class BoardUI extends BoardDOM{
  constructor(){
    super(new Board());
  }
  init(){
    super.init();
    const board = this.boardElement;
    const form = create("form");
    const button = create("button");
    button.textContent = "⚙️ ユニット設定";
    button.type = "button";
    form.append(
      createLabel(createCheck(true), "横長"),
      createLabel(createCheck(true), "縦長"),
      button,
    );
    board.before(form);
    this.createUnitConfigDialog();
    board.addEventListener("pointerdown", this);
    board.addEventListener("pointermove", this, {passive: true});
    board.addEventListener("pointercancel", this);
    board.addEventListener("pointerup", this);
    form.addEventListener("change", this);
    button.addEventListener("click", this);
  }
  createUnitConfigDialog(){
    if(this.dialog) return this.dialog;
    this.unitConfigMap = new Map();
    const unitConfig = create("dialog");
    const container = createDiv("dialog-container");
    const head = createDiv("head");
    const dialogForm = create("form");
    const close = create("button");
    head.append(
      createSpan("#"),
      createSpan("武器"),
      createSpan("横移動"),
      createSpan("縦移動"),
      createSpan("移動可")
    );
    container.append(head);
    for(const data of this.board.playerUnits){
      const form = create("form");
      const weapon = createSelect(WEAPONS.map(x => x.name), "weapon");
      const horizontal = createSelect(range(5), "horizontal");
      const vertical = createSelect(range(5), "vertical");
      const movable = createCheck(true, "movable");
      weapon.selectedIndex = WEAPONS.indexOf(data.weapon);
      horizontal.selectedIndex = vertical.selectedIndex = 1;
      form.append(
        createSpan(data.unit),
        createSpan(weapon),
        createSpan(horizontal),
        createSpan(vertical),
        createSpan(movable),
      );
      form.addEventListener("change", this);
      this.unitConfigMap.set(form, data);
      container.append(form);
    }
    close.textContent = "❌ 閉じる";
    close.autofocus = true;
    dialogForm.method = "dialog",
    dialogForm.append(close);
    container.append(create("hr"), dialogForm);
    unitConfig.append(container);
    unitConfig.addEventListener("click", this);
    this.boardElement.after(unitConfig);
    this.dialog = unitConfig;
  }
  handleEvent(e){
    try{
      this._handleEvent(e);
    }catch(err){
      alert(err);
    }
  }
  _handleEvent(e){
    switch(e.type){
      case "pointerdown":
        this.pointerDown(e);
      break;
      case "pointermove":
        this.dragMove(e);
      break;
      case "pointerup":
      case "pointercancel":
        this.dragEnd(e);
      break;
      case "change":
        this.onChange(e);
      break;
      case "click":
        this.onClick(e);
      break;
    }
  }
  onClick(e){
    if(this.dialog.open){
      if(!e.target.closest(".dialog-container")) this.dialog.close();
    }else{
      this.dialog.showModal();
    }
  }
  onChange(e){
    const data = this.unitConfigMap.get(e.currentTarget);
    const elems = e.currentTarget.elements;
    if(data){
      switch(e.target.className){
        case "weapon":
          data.setWeapon(WEAPONS[e.target.selectedIndex]);
        break;
        case "horizontal":
          data.setHorizontal(e.target.selectedIndex);
        break;
        case "vertical":
          data.setVertical(e.target.selectedIndex);
        break;
        case "movable":
          data.setMovable(e.target.checked);
          if(e.target.checked){
            elems[1].selectedIndex = data.horizontal;
            elems[2].selectedIndex = data.vertical;
            elems[1].disabled = elems[2].disabled = false;
          }else{
            elems[1].selectedIndex = 0;
            elems[2].selectedIndex = 0;
            elems[1].disabled = elems[2].disabled = true;
          }
        break;
      }
    }else{
      this.board.setBoardSize(elems[0].checked, elems[1].checked);
      this.path.clear();
    }
    this.update();
  }
  pointerDown(e){
    const pos = this.posFromPoint(e.clientX, e.clientY);
    const data = this.board.getCell(pos);
    const cell = this.getCell(pos);
    switch(data.type){
      case "player":
        this.dragStart(e, data, cell);
      break;
      case "neutral":
      case "enemy":
        this.board.toggleUnit(data);
        this.board.updateArea();
        this.updateCell(pos);
      break;
    }
  }
  dragStart(e, data, cell){
    if(this.draggingPos || e.button !== 0 || !data.unit) return;
    this.offsetX = e.clientX;
    this.offsetY = e.clientY;
    this.draggingPos = this.posFromPoint(e.clientX, e.clientY);
    this.pointerId = e.pointerId;
    cell.classList.add("dragging");
    cell.setPointerCapture(e.pointerId);
    this.board.updateArea();
    this.update();
    this.path.clear();
    this.path.push(this.draggingPos);
  }
  dragMove(e){
    if(!this.draggingPos || this.pointerId !== e.pointerId) return;
    const x = e.clientX - this.offsetX;
    const y = e.clientY - this.offsetY;
    const targetPos = this.posFromPoint(e.clientX, e.clientY, this.board.movableArea);
    if(targetPos[0] !== this.draggingPos[0] || targetPos[1] !== this.draggingPos[1]){
      this.swapCells(targetPos, this.draggingPos);
      this.draggingPos = targetPos;
      this.path.push(targetPos);
      this.path.draw();
    }
  }
  dragEnd(e){
    if(!this.draggingPos || this.pointerId !== e.pointerId) return;
    const cell = this.getCell(this.draggingPos);
    cell.classList.remove("dragging");
    this.draggingPos = null;
    this.board.updateArea();
    this.update();
    this.path.clear();
  }
  posFromPoint(x, y, area){
    const [minCol, minRow, maxCol, maxRow] = area || [0, 0, 4, 5];
    const rect = this.boardElement.getBoundingClientRect();
    const col = Math.max(Math.min(Math.floor((x - rect.left) * 5 / rect.width), maxCol), minCol);
    const row = Math.max(Math.min(Math.floor((y - rect.top) * 6 / rect.height), maxRow), minRow);
    return [col, row];
  }
}

const boardUI = new BoardUI();

document.addEventListener("DOMContentLoaded", () => {
  try{
    boardUI.init();
  }catch(e){
    alert(e);
  }
});