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
const isSamePos = (posA, posB) => (posA[0] === posB[0] && posA[1] === posB[1]);

class Grid{
  #cells;
  #positionMap;
  
  constructor(grid){
    if(grid instanceof Grid){
      this.#cells = grid.#cells.map(row => row.slice());
      this.#positionMap = new Map(grid.#positionMap);
    }else{
      this.#init();
    }
  }
  #init(){
    this.#cells = [];
    this.#positionMap = new Map();
    for(const y of range(6)){
      const current = [];
      for(const x of range(5)){
        const pos = [x, y];
        const cell = new Cell(pos);
        current.push(cell);
        this.#positionMap.set(cell, pos);
      }
      this.#cells.push(current);
    }
  }
  entries(){
    return this.#cells.entries();
  }
  getPos(cell){
    return this.#positionMap.get(cell);
  }
  getCell(pos){
    return this.#cells[pos[1]][pos[0]];
  }
  swapCells(posA, posB){
    const cellA = this.getCell(posA);
    const cellB = this.getCell(posB);
    this.#moveCell(cellA, posB);
    this.#moveCell(cellB, posA);
  }
  #moveCell(cell, pos){
    this.#cells[pos[1]][pos[0]] = cell;
    this.#positionMap.set(cell, pos);
  }
}

class MovePreviewBoard{
  #realBoard;
  #grid;
  
  constructor(board, route){
    this.#realBoard = board;
    this.#grid = board.cloneGrid();
    if(route?.length > 1){
      let from = route[0];
      for(const to of route.slice(1)){
        this.#grid.swapCells(from, to);
        from = to;
      }
    }
  }
  getCell(pos){
    return this.#grid.getCell(pos);
  }
}

class ExplorationBoard{
  #realBoard;
  #grid;
  
  constructor(board){
    this.#realBoard = board;
    this.#grid = board.cloneGrid();
  }
  explore(){
    if(this.#realBoard.enemyUnits.size === 0) return [0, [[]]];
    return [0, [
      [[1, 3], [2, 3], [2, 4]],
      [[3, 3], [2, 3], [2, 4], [1, 4]],
      [[1, 4], [1, 3], [0, 3]],
      [[3, 4], [3, 3], [3, 4]],
    ]];
  }
}

class Board{
  #grid;
  #area;
  
  constructor(){
    this.enemyUnits = new Set();
    this.playerUnits = new Set();
    this.#grid = new Grid();
    this.setBoardSize(true, true);
  }
  cloneGrid(){
    return new Grid(this.#grid);
  }
  setBoardSize(w, h){
    this.#area = [
      w ? 0 : 1,
      h ? 0 : 1,
      w ? 4 : 3,
      h ? 5 : 4,
    ];
    this.#setPlayerUnits();
    for(const [y, row] of this.#grid.entries()){
      if(!h && y % 5 === 0){
        for(const cell of row) this.#setOoB(cell, true);
      }else{
        for(const [x, cell] of row.entries()) this.#setOoB(cell, (!w && x % 4 === 0));
      }
    }
    this.updateArea();
  }
  #setOoB(cell, flag){
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
  #setPlayerUnits(){
    const initialPositions = [
      [1, 3],
      [3, 3],
      [1, 4],
      [3, 4],
    ];
    if(this.playerUnits.size){
      for(const cell of this.playerUnits){
        const posA = this.#grid.getPos(cell);
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
  updateArea(){
    const fn = (cell) => this.#grid.getPos(cell)[1];
    this.enemyLine = Math.max(...Array.from(this.enemyUnits, fn), this.#area[1]) + 1;
    this.playerLine = Math.min(...Array.from(this.playerUnits, fn));
    this.movableArea = this.#area.with(1, this.enemyLine);
    for(const [y, row] of this.#grid.entries()){
      const type = y < this.enemyLine ? "enemy" : y < this.playerLine ? "neutral" : "player";
      for(const cell of row) cell.setType(type);
    }
  }
  getCell(pos){
    return this.#grid.getCell(pos);
  }
  swapCells(posA, posB){
    this.#grid.swapCells(posA, posB);
  }
}

const createSVG = (tag) => document.createElementNS("http://www.w3.org/2000/svg", tag);

class SVGPath{
  #points = [];
  #lines;
  
  static #arrow = false;
  
  constructor(){
    this.svg = createSVG("svg");
    this.#lines = [
      createSVG("polyline"),
      createSVG("polyline"),
    ];
    this.svg.setAttributeNS(null, "viewBox", "0 0 50 60");
    if(!SVGPath.#arrow) this.#appendDefs();
    this.svg.append(...this.#lines);
  }
  #appendDefs(){
    const defs = createSVG("defs");
    defs.append(
      this.#createMarker("arrow"),
      this.#createMarker("thumbnail-arrow"),
    );
    this.svg.append(defs);
    SVGPath.#arrow = true;
  }
  #createMarker(id){
        const marker = createSVG("marker");
    const arrow = createSVG("path");
    marker.id = id;
    marker.setAttributeNS(null, "viewBox", "0 0 10 10");
    marker.setAttributeNS(null, "refX", 5);
    marker.setAttributeNS(null, "refY", 5);
    marker.setAttributeNS(null, "markerUnits", "userSpaceOnUse");
    marker.setAttributeNS(null, "markerWidth", 5);
    marker.setAttributeNS(null, "markerHeight", 5);
    marker.setAttributeNS(null, "orient", "auto");
    arrow.setAttributeNS(null, "d", "M 0 0 L 10 5 L 0 10 L 1 5 z");
    marker.append(arrow);
    return marker;
  }
  get route(){
    const f = (x, y, a, b) => `${x * 10 + a},${y * 10 + b}`;
    if(this.#points.length === 3 && isSamePos(this.#points[0], this.#points[2])){
      return this.#points.map((pos, i) => f(...pos, ...(this.#points[0][0] === this.#points[1][0] ? [i * 2 + 3, 5] : [5, i * 2 + 3]))).join(" ");
    }else if(this.#points.length > 1){
      return this.#points.slice(-9).map((pos) => f(...pos, 5, 5)).join(" ");
    }else{
      return "";
    }
  }
  draw(){
    for(const line of this.#lines) line.setAttributeNS(null, "points", this.route);
  }
  push(...points){
    if(points.length > 1){
      this.#points.push(...points);
    }else{
      const point = points[0];
      const prev = this.#points.at(-2);
      if(prev && isSamePos(prev, point)){
        this.#points.pop();
      }else{
        this.#points.push(point);
      }
    }
  }
  clear(){
    for(const line of this.#lines) line.setAttributeNS(null, "points", "");
    this.#points.length = 0;
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

class BoardView{
  #panels = [];
  
  constructor(board){
    this.board = board;
  }
  init(){
    if(this.boardElement) return;
    const board = createDiv("board");
    this.path = new SVGPath();
    for(const y of range(6)){
      this.#panels.push([]);
      for(const x of range(5)){
        const panel = createDiv("panel");
        board.append(panel);
        this.#movePanel(panel, [x, y]);
      }
    }
    board.append(this.path.svg);
    this.boardElement = board;
    this.update();
  }
  update(){
    for(const [y, row] of this.#panels.entries()){
      for(const x of row.keys()) this.updatePanel([x, y]);
    }
  }
  updatePanel(pos){
    const panel = this.getPanel(pos);
    const data = this.board.getCell(pos);
    if(data.oob){
      panel.dataset.type = "oob";
    }else{
      panel.dataset.type = data.type;
    }
    if(data.unit){
      panel.dataset.unit = data.unit;
    }else{
      delete panel.dataset.unit;
    }
    if(data.weapon){
      panel.dataset.weapon = data.weapon.name;
    }else{
      delete panel.dataset.weapon;
    }
  }
  getPanel(pos){
    return this.#panels[pos[1]][pos[0]];
  }
  swapPanels(posA, posB){
    const panelA = this.getPanel(posA);
    const panelB = this.getPanel(posB);
    this.#movePanel(panelA, posB);
    this.#movePanel(panelB, posA);
    this.board.swapCells(posA, posB);
  }
  #movePanel(panel, pos){
    this.#panels[pos[1]][pos[0]] = panel;
    panel.style.gridColumn = pos[0] + 1;
    panel.style.gridRow = pos[1] + 1;
  }
}

class BoardThumbnail extends BoardView{
  constructor(board, route){
    super(new MovePreviewBoard(board, route));
    this.init();
    this.boardElement.classList.add("moving", "thumbnail");
    if(route.length){
      this.path.push(...route);
      this.path.draw();
    }
  }
}

class BoardUI extends BoardView{
  constructor(){
    super(new Board());
  }
  init(){
    super.init();
    const board = this.boardElement;
    const form = create("form");
    const button = create("button");
    this.thumbnails = createDiv("flex");
    this.output = create("output");
    board.classList.add("draggable");
    button.textContent = "⚙️ ユニット設定";
    button.type = "button";
    form.append(
      createLabel(createCheck(true), "横長"),
      createLabel(createCheck(true), "縦長"),
      button,
    );
    this.createUnitConfigDialog();
    document.body.prepend(
      form,
      board,
      this.output,
      this.thumbnails,
      this.dialog,
    );
    board.addEventListener("pointerdown", this);
    board.addEventListener("pointermove", this, {passive: true});
    board.addEventListener("pointercancel", this);
    board.addEventListener("pointerup", this);
    form.addEventListener("change", this);
    button.addEventListener("click", this);
    this.explore();
  }
  createUnitConfigDialog(){
    if(this.dialog) return;
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
    this.explore();
  }
  pointerDown(e){
    const pos = this.posFromPoint(e.clientX, e.clientY);
    const data = this.board.getCell(pos);
    const panel = this.getPanel(pos);
    switch(data.type){
      case "player":
        this.dragStart(e, data, panel);
      break;
      case "neutral":
      case "enemy":
        this.board.toggleUnit(data);
        this.board.updateArea();
        this.updatePanel(pos);
        this.explore();
      break;
    }
  }
  dragStart(e, data, panel){
    if(this.draggingPos || e.button !== 0 || !data.unit) return;
    this.boardElement.classList.remove("scrollable");
    this.offsetX = e.clientX;
    this.offsetY = e.clientY;
    this.draggingPos = this.posFromPoint(e.clientX, e.clientY);
    this.pointerId = e.pointerId;
    this.boardElement.classList.add("moving");
    panel.classList.add("dragging");
    panel.setPointerCapture(e.pointerId);
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
    if(!isSamePos(targetPos, this.draggingPos)){
      this.swapPanels(targetPos, this.draggingPos);
      this.draggingPos = targetPos;
      this.path.push(targetPos);
      this.path.draw();
    }
  }
  dragEnd(e){
    if(!this.draggingPos || this.pointerId !== e.pointerId) return;
    const panel = this.getPanel(this.draggingPos);
    panel.classList.remove("dragging");
    this.boardElement.classList.remove("moving");
    this.draggingPos = null;
    this.board.updateArea();
    this.update();
    this.path.clear();
    this.explore();
  }
  posFromPoint(x, y, area){
    const [minCol, minRow, maxCol, maxRow] = area || [0, 0, 4, 5];
    const rect = this.boardElement.getBoundingClientRect();
    const col = Math.max(Math.min(Math.floor((x - rect.left) * 5 / rect.width), maxCol), minCol);
    const row = Math.max(Math.min(Math.floor((y - rect.top) * 6 / rect.height), maxRow), minRow);
    return [col, row];
  }
  explore(){
    const board = new ExplorationBoard(this.board);
    const [score, routes] = board.explore();
    const container = this.thumbnails;
    while(container.firstChild) container.removeChild(container.firstChild);
    for(const [n, route] of routes.entries()){
      const block = createDiv("item");
      const thumbnail = new BoardThumbnail(this.board, route);
      block.append(
        `#${n + 1}`,
        thumbnail.boardElement, 
      );
      container.append(block);
    }
    this.output.value = routes.length > 1 ? score ||  "※ルート探索は未実装のため表示ルートは固定です" : "敵が配置されていません";
  }
}

const boardUI = new BoardUI();

document.addEventListener("DOMContentLoaded", () => {
  try{
    boardUI.init();
  }catch(e){
    alert(e);
  }
}, {once: true});
