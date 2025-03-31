"use strict";

class Filter{
  constructor(table, select, input, s){
    this.data = [];
    this.s = s;
    this.table = table;
    this.select = select;
    this.input = input;
  }
  getIndex(){
    const i = this.select.selectedIndex;
    if(i < 0){
      this.setKwds(0, []);
      return 0;
    }
    return i;
  }
  updateInput(){
    this.input.value = this.getKwds(this.getIndex()).join(this.s);
  }
  updateKwds(){
    this.data[this.getIndex()] = this.split(this.input.value);
  }
  getKwds(i){
    return this.data[i] || [];
  }
  setKwds(i, v){
    if(v.length === 1 && v[0] === "") v = ["", ""];
    this.data[i] = v;
    this.select.selectedIndex = i;
    this.updateInput();
  }
  split(v){
    return v ? v.split(this.s) : [];
  }
  updateTable(){
    const i = this.getIndex();
    const kwds = this.getKwds(i);
    const rows = Array.from(this.table.tBodies[0].rows);
    let count = 0;
    for(const tr of rows){
      const td = tr.cells[i];
      const checkable = td.classList.contains("checkable");
      if(!kwds.length){
        td.className = checkable ? "checkable" : "";
      }else if(checkable){
        const value = td.firstChild.checked ? "○" : "";
        td.className = (kwds.indexOf(value) === -1) ? "checkable hide" : "checkable highlight";
      }else{
        let cls = "hide";
        for(const d of Array.from(td.children)){
          if(kwds.indexOf(d.textContent) !== -1){
            cls = "highlight";
            d.className = cls;
          }else{
            d.className = "";
          }
        }
        td.className = cls;
      }
      if(Array.prototype.some.call(tr.cells, (c) => c.classList.contains("hide"))){
        tr.className = "hide";
      }else{
        tr.className = (count++ & 1) ? "odd" : "";
      }
    }
    this.table.caption.textContent = `${count}件`;
  }
}

const parseCsv = (text) => {
  const ex = /,|\r?\n|"(?:[^"]|"")*"|[^,"\r\n][^,\r\n]*/g;
  const data = [];
  let row = [""];
  let m;
  text = text.replace(/(?:\r?\n)+$/, "");
  while((m = ex.exec(text)) !== null){
    let v = m[0];
    switch(v[0]){
      case ",":
        row.push("");
        break;
      case "\r":
      case "\n":
        data.push(row);
        row = [""];
        break;
      case '"':
        v = v.slice(1, -1).replace(/""/g, '"');
      default:
        row.pop();
        row.push(v);
    }
  }
  data.push(row);
  return data;
}

const csv2table = (data, s, compareTable) => {
  const form = document.createElement("form");
  const check = document.createElement("input");
  const label = document.createElement("label");
  const searchbox = document.createElement("div");
  const select = document.createElement("select");
  const input = document.createElement("input");
  const table = document.createElement("table");
  const thead = document.createElement("thead");
  const tbody = document.createElement("tbody");
  const filter = new Filter(table, select, input, s);
  const checkables = [];
  let hasCheckable = false;
  let header = true;
  let n = 0;
  for(const row of data){
    const tr = document.createElement("tr");
    if(header){
      for(const v of row){
        const th = document.createElement("th");
        const option = document.createElement("option");
        th.textContent = v;
        tr.appendChild(th);
        option.textContent = v;
        select.appendChild(option);
        checkables.push([]);
      }
      thead.appendChild(tr);
      header = false;
    }else{
      tr.className = (n++ & 1) ? "odd" : "";
      for(const v of row){
        const td = document.createElement("td");
        if(v.split){
          const kwds = v.split(s);
          let i = 0;
          for(const p of kwds){
            const span = document.createElement("span");
            span.textContent = p;
            if(i++) td.appendChild(document.createTextNode(s));
            td.appendChild(span);
          }
        }else{
          const check = document.createElement("input");
          check.type = "checkbox";
          check.checked = v.value;
          v.checkbox = check;
          td.className = "checkable";
          td.appendChild(check);
          checkables[tr.childElementCount].push(v);
          hasCheckable = true;
        }
        tr.appendChild(td);
      }
      tbody.appendChild(tr);
    }
  }
  if(hasCheckable){
    const tr = document.createElement("tr");
    for(const list of checkables){
      const th = document.createElement("th");
      th.className = "checkable";
      if(list.length){
        const check = document.createElement("input");
        const notify = () => {updateCheckAll(check, list)};
        check.type = "checkbox";
        th.appendChild(check);
        updateCheckAll(check, list);
        check.addEventListener("change", () => {for(const v of list) v.checkbox.checked = check.checked});
        for(const v of list){
          v.notify = notify;
          v.checkbox.addEventListener("change", notify);
        }
      }
      tr.appendChild(th);
    }
    thead.appendChild(tr);
  }
  table.appendChild(thead);
  table.appendChild(tbody);
  table.createCaption().textContent = `${tbody.rows.length}件`;
  input.type = "search";
  searchbox.id = "searchbox";
  searchbox.className = "hide";
  searchbox.appendChild(select);
  searchbox.appendChild(document.createElement("br"));
  searchbox.appendChild(input);
  check.type = "checkbox";
  label.htmlFor = check.id = "check";
  label.textContent = "フィルタウインドウを表示";
  form.appendChild(check);
  form.appendChild(label);
  form.appendChild(searchbox);
  form.appendChild(table);
  thead.addEventListener("click", _thClick(table, compareTable));
  tbody.addEventListener("click", _tdClick(filter));
  select.addEventListener("change", _select(filter));
  input.addEventListener("input", _input(filter));
  check.addEventListener("change", _check(searchbox));
  return form;
};

const updateCheckAll = (checkAll, list) => {
  const count = list.reduce((a, c) => c.checkbox.checked ? a + 1 : a, 0);
  if(count === list.length){
    checkAll.checked = true;
    checkAll.indeterminate = false;
  }else{
    checkAll.checked = false;
    checkAll.indeterminate = !!count;
  }
};

const _check = (searchbox) => {
  return (evt) => {
    searchbox.className = evt.target.checked ? "" : "hide";
  };
};

const _thClick = (table, compareTable) => {
  let n = -1;
  let order = 1;
  compareTable = compareTable || [];
  return (evt) => {
    const th = evt.target.closest("th");
    if(th && !th.classList.contains("checkable")){
      const tbody = table.tBodies[0];
      const i = th.cellIndex;
      const rows = Array.from(tbody.rows);
      const _compare = compareTable[i] || new Intl.Collator(undefined, {numeric: true}).compare;
      const compare = (a, b) => a && b ? _compare(a, b) * order : a || b ? _compare(b, a) : 0;
      const get = (row) => {
        const cell = row.cells[i];
        if(cell.classList.contains("checkable")) return cell.firstChild.checked ? "○" : "×";
        return cell.textContent;
      };
      let count = 0;
      order = (i === n) ? -order : 1;
      rows.sort((a, b) => compare(get(a), get(b)));
      n = i;
      for(const tr of rows){
        tbody.removeChild(tr);
        tbody.appendChild(tr);
        if(tr.className !== "hide"){
          tr.className = (count++ & 1) ? "odd" : "";
        }
      }
    }
  };
};

const _tdClick = (filter) => {
  return (evt) => {
    const td = evt.target.closest("td");
    if(td){
      if(!td.classList.contains("checkable")){
        const i = td.cellIndex;
        filter.setKwds(i, td.className ? [] : Array.prototype.map.call(td.children, (c) => c.textContent));
      }
      filter.updateTable();
    }
  };
};

const _select = (filter) => {
  return (evt) => {
    filter.updateInput();
    filter.updateTable();
  };
};

const _input = (filter) => {
  return (evt) => {
    filter.updateKwds();
    filter.updateTable();
  };
};

const csvViewer = (tid, url, data, compareTable, s) => {
  const target = document.getElementById(tid);
  const fragment = document.createDocumentFragment();
  const p1 = document.createElement("p");
  s = s || "|";
  if(url){
    const link = document.createElement("a");
    const hr = document.createElement("hr");
    link.textContent = "Download CSV";
    if(data){
      link.href = "javascript:void(0)";
      link.addEventListener("click", () => download(data, url));
    }else{
      link.href = url;
    }
    p1.appendChild(link);
    p1.appendChild(hr);
  }
  p1.appendChild(document.createTextNode("ヘッダセルをクリックでソート"));
  p1.appendChild(document.createElement("br"));
  p1.appendChild(document.createTextNode("データセルをクリックでフィルタ"));
  fragment.appendChild(p1);
  if(data){
    const table = csv2table(data, s, compareTable);
    fragment.appendChild(table);
    document.body.replaceChild(fragment, target);
  }else{
    fetchCsv(url).then((text) => {
      const table = csv2table(parseCsv(text), s, compareTable);
      fragment.appendChild(table);
      document.body.replaceChild(fragment, target);
    }).catch((e) => {
      fragment.appendChild(document.createTextNode(e));
      document.body.replaceChild(fragment, target);
    });
  }
};

const fetchCsv = (url) => {
  return fetch(url).then((response) => {
    if(response.ok){
      return response.text();
    }else{
      throw new Error(`${response.status} ${response.statusText}`);
    }
  });
};

const createURL = (data) => {
  const text = data.map((row) => {
    return row.map((cell) => {
      if(cell.checkbox) return cell.checkbox.checked ? "○" : "";
      cell = cell.replace(/"/g, '""');
      if(/[",\n]/.test(cell)) return `"${cell}"`;
      return cell;
    }).join(",");
  }).join("\r\n");
  const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), text], {type: "text/csv"});
  return URL.createObjectURL(blob);
};

const download = (data, name) => {
  const link = document.createElement("a");
  const url = createURL(data);
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
};

window.addEventListener("touchstart", () => {}, {passive: true});
