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
}

class Board{
  constructor(){
    this.cells = [];
    this.enemyUnits = new Set();
    this.playerUnits = new Set();
    this.positionMap = new Map();
    for(let y = 0; y < 6; ++y){
      const current = [];
      for(let x = 0; x < 5; ++x){
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
    this.range = [
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
    }else{
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
      }
    }
  }
  updateLines(){
    const fn = (cell) => this.positionMap.get(cell)[1];
    this.enemyLine = Math.max(...Array.from(this.enemyUnits, fn), this.range[1]) + 1;
    this.playerLine = Math.min(...Array.from(this.playerUnits, fn));
    this.movableRange = this.range.toSpliced(1, 1, this.enemyLine);
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

const createCheck = (checked) => {
  const check = create("input");
  check.type = "checkbox";
  check.checked = checked;
  return check;
};

class BoardUI{
  constructor(){
    this.board = new Board();
    this.cells = [];
  }
  init(){
    this.output = createDiv("output");
    const board = createDiv("board");
    const form = create("form");
    this.checkWide = createCheck(true);
    this.checkLong = createCheck(true);
    this.path = new SVGPath();
    for(let y = 0; y < 6; ++y){
      this.cells.push([]);
      for(let x = 0; x < 5; ++x){
        const cellElement = createDiv("cell");
        const panel = createDiv("panel");
        cellElement.append(panel);
        board.append(cellElement);
        this.moveCell(cellElement, [x, y]);
      }
    }
    board.append(this.path.svg);
    form.append(
      createLabel(this.checkWide, "横長"),
      createLabel(this.checkLong, "縦長"),
    );
    document.body.prepend(form, board, this.output);
    board.addEventListener("pointerdown", this);
    board.addEventListener("pointermove", this, {passive: true});
    board.addEventListener("pointercancel", this);
    board.addEventListener("pointerup", this);
    form.addEventListener("change", this);
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
    cell.classList.toggle("unit", !!data.unit);
    cell.firstChild.textContent = data.unit;
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
    }
  }
  onChange(e){
    this.board.setBoardSize(this.checkWide.checked, this.checkLong.checked);
    this.update();
    this.path.clear();
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
    const targetPos = this.posFromPoint(e.clientX, e.clientY, this.board.movableRange);
    if(calcDistance(targetPos, this.draggingPos)){
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
  posFromPoint(x, y, range){
    const [minCol, minRow, maxCol, maxRow] = range || [0, 0, 4, 5];
    const rect = this.boardElement.getBoundingClientRect();
    const col = Math.max(Math.min(Math.floor((x - rect.left) * 5 / rect.width), maxCol), minCol);
    const row = Math.max(Math.min(Math.floor((y - rect.top) * 6 / rect.height), maxRow), minRow);
    return [col, row];
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

const calcDistance = (a, b) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2;

const boardUI = new BoardUI();

document.addEventListener("DOMContentLoaded", () => {
  try{
    boardUI.init();
  }catch(e){
    alert(e);
  }
});